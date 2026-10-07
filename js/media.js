// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：読み込み・音声解析・譜面・ヒットSE ============ */
"use strict";

/* ---------- Web Audio ---------- */
let audioCtx = null;
function getAC() {
  if (!audioCtx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; audioCtx = new C(); }
  return audioCtx;
}
function decodeAudio(buf) {
  const ac = getAC(); if (!ac) return Promise.reject(new Error("no audio"));
  return new Promise((res, rej) => {
    try { const p = ac.decodeAudioData(buf, res, rej); if (p && typeof p.then === "function") p.then(res, rej); } catch (e) { rej(e); }
  });
}

/* ---------- 背景画像（曲パック用。音声だけの曲で表示） ---------- */
async function setBackground(blob) {
  if (bgImage && bgImage._url) URL.revokeObjectURL(bgImage._url);
  bgImage = null;
  if (!blob) return null;
  const url = URL.createObjectURL(blob), im = new Image();
  const ok = await new Promise(res => { im.onload = () => res(true); im.onerror = () => res(false); im.src = url; });
  if (!ok) { URL.revokeObjectURL(url); return null; }
  im._url = url; bgImage = im;
  return im;
}

/* 🎬 これより大きいファイルは音声解析（file.arrayBuffer で丸ごとメモリに載せる）をしません。
   解析が無くても譜面はBPMから作れます（analysis を使う所は全部 if (analysis) で守ってあります）。 */
const ANALYZE_MAX = 96 * 1024 * 1024;

/* ---------- 曲の読み込み ----------
   opts.title   : 表示名
   opts.onReady : 解析後・譜面生成前に呼ばれる。true を返すと自動生成を省略（曲パックの譜面など） */
async function loadMedia(file, opts = {}) {
  if (!file || phase !== "title") return false;
  const token = ++loadToken;
  emit("beforeLoad");
  video.pause();
  videoReady = false; analysis = null; chart = []; chartMode = "generated"; fingerprint = "";
  setStatus("chartStatus", null); setStatus("importStatus", null); updateChartButtons();
  if (mediaURL) URL.revokeObjectURL(mediaURL);
  mediaURL = URL.createObjectURL(file); mediaName = file.name || "song";
  $("songTitle").textContent = opts.title || baseName(mediaName);
  setStatus("loadStatus", "loading");
  const ok = await new Promise(res => {
    const done = v => { video.removeEventListener("loadedmetadata", onOk); video.removeEventListener("error", onErr); res(v); };
    const onOk = () => done(true), onErr = () => done(false);
    video.addEventListener("loadedmetadata", onOk); video.addEventListener("error", onErr);
    video.src = mediaURL; video.load();
  });
  if (token !== loadToken) return false;
  if (!ok || !isFinite(video.duration) || video.duration <= 0) { setStatus("loadStatus", "loadError"); updateChartButtons(); return false; }
  videoReady = true; fingerprint = `${file.size}:${Math.round(video.duration * 10)}`;
  setStatus("loadStatus", "analyzing"); updateChartButtons();
  await new Promise(r => { setTimeout(r, 30); });
  const tooBig = (Number(file.size) || 0) > ANALYZE_MAX;
  /* 🪶 軽量化：解析をしない設定では、ファイル全体をデコードして走り直すところごと飛ばします
     （長い曲ほど効きます。譜面はBPMグリッド中心の自動生成になり、自作・取り込み譜面はそのまま） */
  const liteSkip = !tooBig && typeof TrkLite === "object" && typeof TrkLite.noAnalyze === "function" && TrkLite.noAnalyze();
  const skipAnalyze = tooBig || liteSkip;
  if (skipAnalyze) analysis = null;
  else { try { analysis = await analyzeAudio(file); } catch (_) { analysis = null; } }
  if (token !== loadToken) return false;
  setStatus("loadStatus", tooBig ? "analysisSkipped" : liteSkip ? "analysisSkippedLite" : analysis ? "loaded" : "decodeFallback");
  let supplied = false;
  if (opts.onReady) { try { supplied = !!(await opts.onReady()); } catch (e) { console.error(e); } }
  if (token !== loadToken) return false;
  if (!supplied) buildChart();
  emit("mediaReady");
  return true;
}

/* ---------- 音声解析（音量・立ち上がり・高音の割合） ---------- */
async function analyzeAudio(file) {
  const audio = await decodeAudio(await file.arrayBuffer());
  const sr = audio.sampleRate, n = audio.length;
  const c0 = audio.getChannelData(0), c1 = audio.numberOfChannels > 1 ? audio.getChannelData(1) : null;
  const hop = Math.max(1, Math.round(sr * 0.01)), frames = Math.floor(n / hop), frameMs = hop / sr * 1000;
  const rms = new Float32Array(frames), hf = new Float32Array(frames);
  let prev = 0, maxRms = 0;
  for (let f = 0; f < frames; f++) {
    let e = 0, h = 0; const s0 = f * hop;
    for (let i = s0; i < s0 + hop; i++) {
      const x = c1 ? (c0[i] + c1[i]) * .5 : c0[i];
      e += x * x; const d = x - prev; h += d * d; prev = x;
    }
    rms[f] = Math.sqrt(e / hop); hf[f] = Math.sqrt(h / hop);
    if (rms[f] > maxRms) maxRms = rms[f];
  }
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) flux[f] = Math.max(0, rms[f] - rms[f - 1]) + .6 * Math.max(0, hf[f] - hf[f - 1]);
  const P = new Float64Array(frames + 1);
  for (let f = 0; f < frames; f++) P[f + 1] = P[f] + flux[f];
  const onset = new Float32Array(frames), ratio = new Float32Array(frames), win = 25;
  for (let f = 0; f < frames; f++) {
    const lo = Math.max(0, f - win), hi = Math.min(frames, f + win + 1);
    onset[f] = Math.max(0, flux[f] - (P[hi] - P[lo]) / (hi - lo));
    ratio[f] = hf[f] / (rms[f] + 1e-6);
  }
  const nz = Array.from(onset).filter(v => v > 0).sort((a, b) => a - b);
  const scale = nz.length ? nz[Math.floor(nz.length * .95)] || nz[nz.length - 1] : 1;
  return { rms, onset, ratio, frames, frameMs, maxRms: maxRms || 1, scale: scale || 1 };
}
const frameAt = t => Math.round(t / analysis.frameMs);
function onsetAt(t) {
  const f = frameAt(t); let m = 0;
  for (let i = Math.max(0, f - 3); i <= Math.min(analysis.frames - 1, f + 3); i++) if (analysis.onset[i] > m) m = analysis.onset[i];
  return m;
}
function rmsAt(t) { return analysis.rms[Math.min(analysis.frames - 1, Math.max(0, frameAt(t)))]; }
function ratioAt(t) {
  const f = frameAt(t); let s = 0, c = 0;
  for (let i = Math.max(0, f); i <= Math.min(analysis.frames - 1, f + 4); i++) { s += analysis.ratio[i]; c++; }
  return c ? s / c : 0;
}

/* ---------- 譜面 ---------- */
const CHART_FILE_MAX = 2 * 1024 * 1024;   // docs/pack-format.md の譜面JSON上限に合わせる
function estimateLevel(notes) {
  if (levelOverride) return levelOverride;
  if (!notes || !notes.length) return 1;
  const span = Math.max(10, (notes[notes.length - 1].time - notes[0].time) / 1000);
  const nps = notes.length / span;

  let peak = 0, j = 0;
  for (let i = 0; i < notes.length; i++) {
    while (notes[i].time - notes[j].time > 2500) j++;
    peak = Math.max(peak, (i - j + 1) / 2.5);
  }

  let fastCount = 0, trillCount = 0, ultraFast = 0;
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].time - notes[i - 1].time;
    if (gap <= 220) {
      fastCount++;
      if (gap <= 100) ultraFast++;
      if (notes[i].lane !== notes[i - 1].lane && i >= 2 && notes[i - 1].lane !== notes[i - 2].lane && notes[i - 1].time - notes[i - 2].time <= 220) {
        trillCount++;
      }
    }
  }

  const fastRatio = fastCount / (notes.length - 1 || 1);
  const trillRatio = trillCount / (notes.length - 1 || 1);
  const ultraRatio = ultraFast / (notes.length - 1 || 1);

  // 音ゲー標準の Lv. 1 〜 20 スケール（初級 1〜3 / 中級 4〜6 / 上級 7〜11 / 達人 12〜15 / RUSH 16〜20）
  const base = nps * 0.88 + peak * 0.38 + 0.5;
  const tech = fastRatio * 1.8 + trillRatio * 1.5 + ultraRatio * 2.2;

  return Math.max(1, Math.min(20, Math.round(base + tech)));
}
/* ゲームの状態を変えずに譜面だけを作る（曲パックの書き出しでも使う） */
function generateNotes(diff, bpm, offset, seed) {
  if (!videoReady || !(bpm >= 60 && bpm <= 300) || !DIFF_IDS.includes(diff)) return [];
  const d = DIFFS[diff], durMs = video.duration * 1000;
  const rand = mulberry32(hashString(`${String(seed).trim()}|${diff}|${bpm}|${offset}`));
  const step = 60000 / bpm / d.div;
  let startMs = 600, endMs = durMs - 400;
  if (analysis) {
    const thr = analysis.maxRms * .06; let f0 = 0, f1 = analysis.frames - 1;
    while (f0 < f1 && analysis.rms[f0] < thr) f0++;
    while (f1 > f0 && analysis.rms[f1] < thr) f1--;
    startMs = Math.max(300, f0 * analysis.frameMs - 30); endMs = Math.min(endMs, f1 * analysis.frameMs + 30);
  }
  const cands = [];
  for (let k = Math.ceil((startMs - offset) / step); ; k++) {
    const t = offset + k * step; if (t > endMs) break; if (t < startMs) continue;
    const sub = ((k % d.div) + d.div) % d.div, beatIdx = Math.floor(k / d.div);
    const onBeat = sub === 0, onBar = onBeat && ((beatIdx % 4) + 4) % 4 === 0;
    let s, loud = 0.5;
    if (analysis) {
      loud = rmsAt(t) / (analysis.maxRms || 1);
      if (loud < .05) continue;
      s = Math.min(1.6, onsetAt(t) / (analysis.scale || 1)) + loud * .35;
    } else s = rand() * .6;
    s *= onBar ? 1.6 : onBeat ? 1.3 : (sub % 2 === 0 ? 1.1 : 0.95);
    s += rand() * .1;
    cands.push({ t, s, onBar, onBeat, sub, k, loud });
  }

  let sel;
  if (diff === "easy" || diff === "normal") {
    const count = Math.round(cands.length * d.density);
    sel = cands.slice().sort((a, b) => b.s - a.s).slice(0, count).sort((a, b) => a.t - b.t);
  } else {
    // 上級・達人・RUSH：音楽的フレーズ構造（8分音符骨格＋16分連打・トリル）
    const targetCount = d.target ? Math.min(cands.length, d.target) : Math.round(cands.length * d.density);
    const chosen = new Set();
    for (const c of cands) {
      if ((c.onBeat || c.sub % 2 === 0) && (c.loud > 0.22 || c.s > 0.75)) {
        chosen.add(c);
      }
    }
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const loudThreshold = (diff === "master" || diff === "rush") ? 0.30 : 0.50;
      if (c.loud > loudThreshold && c.s > 0.8) {
        const isDense = (diff === "master" || diff === "rush");
        const burstLen = isDense ? (rand() < 0.45 ? 7 : (rand() < 0.5 ? 5 : 3)) : (rand() < 0.35 ? 5 : 3);
        for (let b = 0; b < burstLen && i + b < cands.length; b++) {
          chosen.add(cands[i + b]);
        }
      }
    }
    let list = Array.from(chosen);
    if (list.length < targetCount) {
      const remaining = cands.filter(c => !chosen.has(c)).sort((a, b) => b.s - a.s);
      list = list.concat(remaining.slice(0, targetCount - list.length));
    } else if (list.length > targetCount && diff !== "rush") {
      list.sort((a, b) => b.s - a.s);
      list = list.slice(0, targetCount);
    }
    sel = list.sort((a, b) => a.t - b.t);
  }

  // 専門的な音ゲー配置（トリル・連打・複合ストリーム）
  const PAT_3 = [
    [0, 0, 1], // ドドカ
    [1, 1, 0], // カカド
    [0, 1, 0], // ドカド
    [1, 0, 1], // カドカ
    [0, 1, 1], // ドカカ
    [1, 0, 0], // カドド
    [0, 0, 0]  // ドドド
  ];
  const PAT_5 = [
    [0, 0, 1, 1, 0], // ドドカカド
    [1, 1, 0, 0, 1], // カカドドカ
    [0, 1, 0, 1, 0], // 5連トリル
    [0, 1, 1, 0, 1], // ドカカドカ
    [0, 0, 1, 0, 0]  // ドドカドド
  ];

  let med = 0, ratios = null;
  if (analysis && sel.length) {
    ratios = sel.map(c => ratioAt(c.t));
    const sr = ratios.slice().sort((a, b) => a - b);
    med = sr[Math.floor(sr.length / 2)] || 0;
  }

  const L = sel.length;
  const result = new Array(L);
  let idx = 0;
  const fastThresh = (60000 / bpm / d.div) * 1.35;

  while (idx < L) {
    let runEnd = idx;
    while (runEnd + 1 < L && sel[runEnd + 1].t - sel[runEnd].t <= fastThresh) {
      runEnd++;
    }
    const runLen = runEnd - idx + 1;

    if (runLen >= 3 && (diff === "hard" || diff === "master" || diff === "rush")) {
      const isTrill = (diff === "master" || diff === "rush") ? (rand() < 0.52) : (rand() < 0.38);
      if (isTrill || runLen >= 6) {
        let startColor = sel[idx].onBar ? 0 : (rand() < 0.6 ? 0 : 1);
        for (let k = 0; k < runLen; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: (startColor + k) % 2 };
        }
      } else if (runLen === 3) {
        const pat = PAT_3[Math.floor(rand() * PAT_3.length)];
        for (let k = 0; k < 3; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat[k] };
        }
      } else if (runLen === 4) {
        const r4 = rand();
        const pat4 = r4 < 0.45 ? [0, 1, 0, 1] : (r4 < 0.75 ? [0, 0, 1, 1] : [0, 1, 1, 0]);
        for (let k = 0; k < 4; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat4[k] };
        }
      } else if (runLen === 5) {
        const pat = PAT_5[Math.floor(rand() * PAT_5.length)];
        for (let k = 0; k < 5; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat[k] };
        }
      } else {
        const chunk = rand() < 0.5 ? 1 : 2;
        for (let k = 0; k < runLen; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: Math.floor(k / chunk) % 2 };
        }
      }
      idx = runEnd + 1;
    } else {
      let lane;
      if (sel[idx].onBar && rand() < 0.85) lane = 0;
      else if (analysis && ratios) {
        lane = ratios[idx] > med ? 1 : 0;
        if (rand() < 0.10) lane = 1 - lane;
      } else {
        lane = rand() < 0.35 ? 1 : 0;
      }
      result[idx] = { time: Math.round(sel[idx].t), lane };
      idx++;
    }
  }

  return result;
}
function buildChart() {
  if (!videoReady) return;
  chartMode = "generated"; chartDiff = settings.difficulty;
  const bpm = Number($("bpm").value), offset = Number($("offset").value) || 0;
  if (!(bpm >= 60 && bpm <= 300)) { chart = []; setStatus("chartStatus", "noChart"); updateChartButtons(); return; }
  chart = generateNotes(chartDiff, bpm, offset, $("seed").value).map(n => ({ ...n, judged:false, result:null }));
  chartMeta = { bpm, offset };
  currentLevel = estimateLevel(chart);
  setStatus("chartStatus", chart.length ? () => chartSummary() : "noChart");
  updateChartButtons();
}
function chartToData(notes, diff, meta = chartMeta) {
  return {
    format:"shadow-taiko-chart", version:2, app:"trk!",
    media:{ name:mediaName, fingerprint, duration:+(video.duration || 0).toFixed(3) },
    bpm:meta.bpm, offset:meta.offset, seed:$("seed").value.trim(), difficulty:diff, level:estimateLevel(notes),
    notes:notes.map(n => [n.time, n.lane])
  };
}
function exportChart(statusId) {
  if (!chart.length) { setStatus(statusId, "exportNone"); return; }
  const base = safeName(baseName(mediaName) || "chart");
  downloadBlob(new Blob([JSON.stringify(chartToData(chart, chartDiff))], { type:"application/json" }), `${base}-${chartDiff}.shadow-taiko.json`);
  setStatus(statusId, "exportDone");
}
function parseNote(n) {
  let time, lane;
  if (Array.isArray(n) && n.length >= 2) {
    [time, lane] = n;
  } else if (n && typeof n === "object" && !Array.isArray(n)) {
    time = n.time ?? n.t;
    lane = n.lane ?? n.l;
    if (lane === undefined && (n.type === "ka" || n.type === "don")) lane = n.type === "ka" ? 1 : 0;
  }
  return {
    time:typeof time === "number" ? time : NaN,
    lane:typeof lane === "number" ? lane : NaN
  };
}
/* 譜面データを確認する。問題があれば { key }、OKなら { notes } を返す */
function validateChartData(data, checkFingerprint = true) {
  if (!data || typeof data !== "object" || (data.format && !String(data.format).startsWith("shadow-taiko"))) return { key:"importBad" };
  const has = key => Object.prototype.hasOwnProperty.call(data, key);
  if ((has("bpm") && (typeof data.bpm !== "number" || !Number.isFinite(data.bpm))) ||
      (has("offset") && (typeof data.offset !== "number" || !Number.isFinite(data.offset)))) return { key:"importInvalid" };
  if (!Array.isArray(data.notes) || data.notes.length > 50000) return { key:"importInvalid" };
  const notes = data.notes.map(parseNote);
  if (notes.some(n => !isFinite(n.time) || n.time < 0 || (n.lane !== 0 && n.lane !== 1))) return { key:"importInvalid" };
  if (!notes.length) return { key:"importEmpty" };
  if (checkFingerprint && data.media && data.media.fingerprint && data.media.fingerprint !== fingerprint) return { key:"importMismatch" };
  notes.sort((a, b) => a.time - b.time);
  if (notes[notes.length - 1].time > video.duration * 1000 + 1000) return { key:"importTooLong" };
  return { notes };
}
/* 確認した譜面を今の譜面にする（mode: "imported" / "pack"） */
function applyChartData(data, mode = "imported", sid = "importStatus", checkFingerprint = true) {
  if (!videoReady) { setStatus(sid, "loadError"); return false; }
  const v = validateChartData(data, checkFingerprint);
  if (v.key) { setStatus(sid, v.key); return false; }
  chart = v.notes.map(n => ({ time:Math.round(n.time), lane:n.lane, judged:false, result:null }));
  chartMode = mode;
  chartDiff = DIFF_IDS.includes(data.difficulty) ? data.difficulty : settings.difficulty;
  chartMeta = {
    bpm:typeof data.bpm === "number" && Number.isFinite(data.bpm) ? data.bpm : 0,
    offset:typeof data.offset === "number" && Number.isFinite(data.offset) ? data.offset : 0
  };
  currentLevel = estimateLevel(chart);
  setStatus("chartStatus", () => chartSummary());
  if (mode === "imported") setStatus(sid, "importSuccess");
  updateChartButtons();
  return true;
}
async function importChartFile(file, sid = "importStatus") {
  if (!file || typeof file.size !== "number" || !Number.isFinite(file.size) || file.size < 0 ||
      file.size > CHART_FILE_MAX || typeof file.text !== "function") {
    setStatus(sid, "importInvalid"); return false;
  }
  let data = null;
  try { data = JSON.parse(await file.text()); } catch (_) { setStatus(sid, "importBad"); return false; }
  return applyChartData(data, "imported", sid, true);
}

/* ---------- ヒットSE ---------- */
const seBuffers = [null, null], seFiles = [null, null]; let noiseBuf = null;
function playSE(lane, force = false) {
  if (!settings.seEnabled && !force) return;
  const ac = getAC(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const t = ac.currentTime, out = ac.createGain();
  out.gain.value = settings.seVolume; out.connect(ac.destination);
  if (seBuffers[lane]) { const s = ac.createBufferSource(); s.buffer = seBuffers[lane]; s.connect(out); s.start(t); return; }
  const o = ac.createOscillator(), e = ac.createGain();
  if (lane === 0) {
    o.type = "sine"; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(58, t + .14);
    e.gain.setValueAtTime(1, t); e.gain.exponentialRampToValueAtTime(.001, t + .2);
    o.connect(e).connect(out); o.start(t); o.stop(t + .22);
  } else {
    o.type = "triangle"; o.frequency.setValueAtTime(1350, t); o.frequency.exponentialRampToValueAtTime(820, t + .05);
    e.gain.setValueAtTime(.7, t); e.gain.exponentialRampToValueAtTime(.001, t + .08);
    o.connect(e).connect(out); o.start(t); o.stop(t + .1);
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * .05), ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const nz = ac.createBufferSource(), hp = ac.createBiquadFilter(), ng = ac.createGain();
    nz.buffer = noiseBuf; hp.type = "highpass"; hp.frequency.value = 2500;
    ng.gain.setValueAtTime(.4, t); ng.gain.exponentialRampToValueAtTime(.001, t + .05);
    nz.connect(hp).connect(ng).connect(out); nz.start(t);
  }
}
async function loadSE(file, lane) {
  if (!file) return;
  if (!getAC()) { setStatus("seStatus", "seUnavailable"); return; }
  try {
    seBuffers[lane] = await decodeAudio(await file.arrayBuffer());
    seFiles[lane] = file;
    setStatus("seStatus", lane ? "seLoadedKa" : "seLoadedDon");
  } catch (_) { setStatus("seStatus", "seLoadError"); }
}
/* ✅ media.js 完了 */
