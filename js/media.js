(() => {
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
/* 🎬 ファイルサイズ（圧縮後）だけでは判断できない：デコード後のPCMは長さに比例して膨らむ
   （48kHz・ステレオ・float32 で 1分 ≒ 23MB、20分 ≒ 460MB）。長さでも区切る。
   decodeAudioData は元のサンプリングレートのまま返すので、OfflineAudioContext で
   ダウンサンプルしても瞬間の最大メモリは減らない（デコード自体で同じ量を使う）。 */
const ANALYZE_MAX_SEC = 20 * 60;

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
  const tooLong = video.duration > ANALYZE_MAX_SEC;
  /* 🪶 軽量化：解析をしない設定では、ファイル全体をデコードして走り直すところごと飛ばします
     （長い曲ほど効きます。譜面はBPMグリッド中心の自動生成になり、自作・取り込み譜面はそのまま） */
  const liteSkip = !tooBig && !tooLong && typeof TrkLite === "object" && typeof TrkLite.noAnalyze === "function" && TrkLite.noAnalyze();
  const skipAnalyze = tooBig || tooLong || liteSkip;
  if (skipAnalyze) analysis = null;
  else { try { analysis = await analyzeAudio(file); } catch (_) { analysis = null; } }
  if (token !== loadToken) return false;
  setStatus("loadStatus", tooBig ? "analysisSkipped" : tooLong ? "analysisSkippedLong" : liteSkip ? "analysisSkippedLite" : analysis ? "loaded" : "decodeFallback");
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
function rmsAt(t) { return analysis.rms[Math.min(analysis.frames - 1, Math.max(0, frameAt(t)))]; }
/* ---------- 譜面 ---------- */
const CHART_FILE_MAX = 2 * 1024 * 1024;   // docs/pack-format.md の譜面JSON上限に合わせる
/* 譜面の難易度表示。本体の式は js/chart-gen.js（cgEstimateLevel）。ここでは levelOverride（譜面パックの指定）だけを見る */
function estimateLevel(notes) {
  if (levelOverride) return levelOverride;
  return cgEstimateLevel(notes);
}
/* ゲームの状態を変えずに譜面だけを作る（曲パックの書き出しでも使う）。
   作り方は chartGen（設定 settings.chartGen／既定 "1" = 旧方式）。中身は js/chart-gen.js の純関数。 */
function generateNotes(diff, bpm, offset, seed, chartGen = settings.chartGen) {
  if (!videoReady || !(bpm >= 60 && bpm <= 300) || !DIFF_IDS.includes(diff)) return [];
  const rand = mulberry32(hashString(`${String(seed).trim()}|${diff}|${bpm}|${offset}`));
  return buildChartNotes({ analysis, durationMs: video.duration * 1000, diff, spec: DIFFS[diff], bpm, offset, rand, chartGen });
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

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.CHART_FILE_MAX = CHART_FILE_MAX;
/* 後から読み込まれるファイルがこの名前を差し替える（window.applyChartData の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "applyChartData", { configurable:true, get:() => applyChartData, set:v => { applyChartData = v; } });
Object.defineProperty(window, "audioCtx", { configurable:true, get:() => audioCtx, set:v => { audioCtx = v; } });
window.buildChart = buildChart;
/* 後から読み込まれるファイルがこの名前を差し替える（window.chartToData の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "chartToData", { configurable:true, get:() => chartToData, set:v => { chartToData = v; } });
window.decodeAudio = decodeAudio;
window.estimateLevel = estimateLevel;
window.exportChart = exportChart;
window.generateNotes = generateNotes;
window.getAC = getAC;
window.importChartFile = importChartFile;
window.loadMedia = loadMedia;
window.loadSE = loadSE;
window.playSE = playSE;
window.rmsAt = rmsAt;
window.seBuffers = seBuffers;
window.seFiles = seFiles;
window.setBackground = setBackground;
})();
