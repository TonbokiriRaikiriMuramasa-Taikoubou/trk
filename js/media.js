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
  if (window.Trk.core.bgImage && window.Trk.core.bgImage._url) URL.revokeObjectURL(window.Trk.core.bgImage._url);
  window.Trk.core.bgImage = null;
  if (!blob) return null;
  const url = URL.createObjectURL(blob), im = new Image();
  const ok = await new Promise(res => { im.onload = () => res(true); im.onerror = () => res(false); im.src = url; });
  if (!ok) { URL.revokeObjectURL(url); return null; }
  im._url = url; window.Trk.core.bgImage = im;
  return im;
}

/* 🎬 これより大きいファイルは音声解析（file.arrayBuffer で丸ごとメモリに載せる）をしません。
   解析が無くても譜面はBPMから作れます（analysis を使う所は全部 if (analysis) で守ってあります）。 */
const ANALYZE_MAX = 96 * 1024 * 1024;
/* 🎬 ファイルサイズ（圧縮後）だけでは判断できない：デコード後のPCMは長さに比例して膨らむ
   （48kHz・ステレオ・float32 で 1分 ≒ 23MB、20分 ≒ 460MB）。長さでも区切る。
   decodeAudioData が返す量（コンテキストのサンプリングレートへ再サンプルした後の長さ）は減るが、
   デコード中のピークメモリは実装しだいで減らないことが多い。OfflineAudioContext で
   ダウンサンプルしても瞬間の最大メモリは減らない見込み（時間上限で切る判断はこのため）。 */
const ANALYZE_MAX_SEC = 20 * 60;

/* ---------- 曲の読み込み ----------
   opts.title   : 表示名
   opts.onReady : 解析後・譜面生成前に呼ばれる。true を返すと自動生成を省略（曲パックの譜面など） */
async function loadMedia(file, opts = {}) {
  if (!file || window.Trk.core.phase !== "title") return false;
  const token = ++window.Trk.core.loadToken;
  window.Trk.core.emit("beforeLoad");
  window.Trk.core.video.pause();
  window.Trk.core.videoReady = false; window.Trk.core.analysis = null; window.Trk.core.chart = []; window.Trk.core.chartMode = "generated"; window.Trk.core.fingerprint = "";
  window.Trk.core.setStatus("chartStatus", null); window.Trk.core.setStatus("importStatus", null); window.Trk.core.updateChartButtons();
  if (window.Trk.core.mediaURL) URL.revokeObjectURL(window.Trk.core.mediaURL);
  window.Trk.core.mediaURL = URL.createObjectURL(file); window.Trk.core.mediaName = file.name || "song";
  window.Trk.core.$("songTitle").textContent = opts.title || window.Trk.core.baseName(window.Trk.core.mediaName);
  window.Trk.core.setStatus("loadStatus", "loading");
  const ok = await new Promise(res => {
    const done = v => { window.Trk.core.video.removeEventListener("loadedmetadata", onOk); window.Trk.core.video.removeEventListener("error", onErr); res(v); };
    const onOk = () => done(true), onErr = () => done(false);
    window.Trk.core.video.addEventListener("loadedmetadata", onOk); window.Trk.core.video.addEventListener("error", onErr);
    window.Trk.core.video.src = window.Trk.core.mediaURL; window.Trk.core.video.load();
  });
  if (token !== window.Trk.core.loadToken) return false;
  if (!ok || !isFinite(window.Trk.core.video.duration) || window.Trk.core.video.duration <= 0) { window.Trk.core.setStatus("loadStatus", "loadError"); window.Trk.core.updateChartButtons(); return false; }
  window.Trk.core.videoReady = true; window.Trk.core.fingerprint = `${file.size}:${Math.round(window.Trk.core.video.duration * 10)}`;
  window.Trk.core.setStatus("loadStatus", "analyzing"); window.Trk.core.updateChartButtons();
  await new Promise(r => { setTimeout(r, 30); });
  const tooBig = (Number(file.size) || 0) > ANALYZE_MAX;
  const tooLong = window.Trk.core.video.duration > ANALYZE_MAX_SEC;
  /* 🪶 軽量化：解析をしない設定では、ファイル全体をデコードして走り直すところごと飛ばします
     （長い曲ほど効きます。譜面はBPMグリッド中心の自動生成になり、自作・取り込み譜面はそのまま） */
  const liteSkip = !tooBig && !tooLong && typeof TrkLite === "object" && typeof TrkLite.noAnalyze === "function" && TrkLite.noAnalyze();
  const skipAnalyze = tooBig || tooLong || liteSkip;
  if (skipAnalyze) window.Trk.core.analysis = null;
  else { try { window.Trk.core.analysis = await analyzeAudioCached(file, window.Trk.core.fingerprint); } catch (_) { window.Trk.core.analysis = null; } }
  if (token !== window.Trk.core.loadToken) return false;
  window.Trk.core.setStatus("loadStatus", tooBig ? "analysisSkipped" : tooLong ? "analysisSkippedLong" : liteSkip ? "analysisSkippedLite" : window.Trk.core.analysis ? "loaded" : "decodeFallback");
  let supplied = false;
  if (opts.onReady) { try { supplied = !!(await opts.onReady()); } catch (e) { console.error(e); } }
  if (token !== window.Trk.core.loadToken) return false;
  if (!supplied) buildChart();
  window.Trk.core.emit("mediaReady");
  return true;
}

/* ---------- 解析結果のキャッシュ（IndexedDB・この端末の中だけ） ----------
   同じ曲をもう一度読み込んだとき、デコードと解析を飛ばすためのもの。
   保存するのは解析の配列（rms・onset・ratio）と数値だけ。PCM（音声の波形）は保存しない。
   鍵は fingerprint（サイズ・長さ）＋先頭と末尾 64KB の SHA-256 ＋ 解析のバージョン。
   解析の式を変えたら ANALYSIS_CACHE_VERSION を上げる（古い結果は読まれなくなる）。
   セーフモードでは読まない・書かない。失敗しても普通に解析する（キャッシュは速さのためだけ）。 */
const ANALYSIS_CACHE_DB = "trk_analysis_cache_v1";
const ANALYSIS_CACHE_VERSION = 1;
const ANALYSIS_CACHE_MAX = 30;            // 件数の上限。超えたら古いものから消す
const ANALYSIS_CACHE_EDGE = 64 * 1024;    // 鍵に使う先頭・末尾のバイト数
let analysisCacheDb = null;
function analysisCacheOpen() {
  if (analysisCacheDb) return analysisCacheDb;
  analysisCacheDb = new Promise((res, rej) => {
    const r = indexedDB.open(ANALYSIS_CACHE_DB, 1);
    r.onupgradeneeded = () => {
      const os = r.result.createObjectStore("analysis", { keyPath: "key" });
      os.createIndex("savedAt", "savedAt");
    };
    r.onsuccess = () => { r.result.onversionchange = () => { r.result.close(); analysisCacheDb = null; }; res(r.result); };
    r.onerror = () => { analysisCacheDb = null; rej(r.error); };
    r.onblocked = () => { analysisCacheDb = null; rej(new Error("analysis-cache-blocked")); };
  });
  return analysisCacheDb;
}
async function analysisCacheKey(file, fingerprint) {
  const head = await file.slice(0, ANALYSIS_CACHE_EDGE).arrayBuffer();
  const tail = await file.slice(Math.max(0, file.size - ANALYSIS_CACHE_EDGE)).arrayBuffer();
  const both = new Uint8Array(head.byteLength + tail.byteLength);
  both.set(new Uint8Array(head), 0); both.set(new Uint8Array(tail), head.byteLength);
  const hex = [...new Uint8Array(await crypto.subtle.digest("SHA-256", both)).slice(0, 16)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `v${ANALYSIS_CACHE_VERSION}|${fingerprint}|${hex}`;
}
/* 読んだ記録のかたちを確かめる（端末の中の値は改ざんされうる。合わなければ無いものとして解析し直す） */
function analysisCacheValid(r) {
  return !!r && r.version === ANALYSIS_CACHE_VERSION && Number.isInteger(r.frames) && r.frames > 0 &&
    Number.isFinite(r.frameMs) && r.frameMs > 0 && Number.isFinite(r.maxRms) && Number.isFinite(r.scale) &&
    [r.rms, r.onset, r.ratio].every(a => a instanceof Float32Array && a.length === r.frames);
}
/* 読んだら savedAt を今に更新する（LRU：よく使う曲が件数の上限で先に消えないように）。
   不正な記録は触らない（解析し直したあと put で置き換わる）。 */
async function analysisCacheGet(key) {
  const db = await analysisCacheOpen();
  const tx = db.transaction("analysis", "readwrite");
  const os = tx.objectStore("analysis");
  const rec = await new Promise((res, rej) => {
    const q = os.get(key);
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
  if (!analysisCacheValid(rec)) { tx.abort(); return null; }
  os.put({ ...rec, savedAt: Date.now() });
  await new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error); });
  return { rms: rec.rms, onset: rec.onset, ratio: rec.ratio, frames: rec.frames, frameMs: rec.frameMs, maxRms: rec.maxRms, scale: rec.scale };
}
async function analysisCachePut(key, a) {
  const db = await analysisCacheOpen();
  const rec = { key, version: ANALYSIS_CACHE_VERSION, savedAt: Date.now(), frames: a.frames, frameMs: a.frameMs,
    maxRms: a.maxRms, scale: a.scale, rms: a.rms, onset: a.onset, ratio: a.ratio };
  await new Promise((res, rej) => {
    const tx = db.transaction("analysis", "readwrite");
    tx.objectStore("analysis").put(rec);
    tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error);
  });
  /* 件数の上限：savedAt の index は古い順に並ぶので、先頭（古い）から消す（読み出しで savedAt を更新しているので LRU） */
  const tx2 = db.transaction("analysis", "readwrite");
  const keys = await new Promise((res, rej) => {
    const q = tx2.objectStore("analysis").index("savedAt").getAllKeys();
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  });
  for (let i = 0; i < keys.length - ANALYSIS_CACHE_MAX; i++) tx2.objectStore("analysis").delete(keys[i]);
  await new Promise((res, rej) => { tx2.oncomplete = () => res(); tx2.onerror = tx2.onabort = () => rej(tx2.error); });
}
/* 解析の入口。キャッシュがあればデコードせずに返す。無ければ解析して、あとで保存する（待たない） */
async function analyzeAudioCached(file, fingerprint) {
  const cacheOn = !(typeof window.TrkSafeMode === "function" && window.TrkSafeMode()) &&
    !!window.indexedDB && !!(window.crypto && window.crypto.subtle) && !!fingerprint;
  let key = null;
  if (cacheOn) {
    try { key = await analysisCacheKey(file, fingerprint); const hit = await analysisCacheGet(key); if (hit) return hit; }
    catch (_) { key = null; }
  }
  const a = await analyzeAudio(file);
  if (key) analysisCachePut(key, a).catch(() => {});
  return a;
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
const frameAt = t => Math.round(t / window.Trk.core.analysis.frameMs);
function rmsAt(t) { return window.Trk.core.analysis.rms[Math.min(window.Trk.core.analysis.frames - 1, Math.max(0, frameAt(t)))]; }
/* ---------- 譜面 ---------- */
const CHART_FILE_MAX = 2 * 1024 * 1024;   // docs/pack-format.md の譜面JSON上限に合わせる
/* 譜面の難易度表示。本体の式は js/chart-gen.js（cgEstimateLevel）。ここでは levelOverride（譜面パックの指定）だけを見る */
function estimateLevel(notes) {
  if (window.Trk.core.levelOverride) return window.Trk.core.levelOverride;
  return window.Trk.chart.cgEstimateLevel(notes);
}
/* ゲームの状態を変えずに譜面だけを作る（曲パックの書き出しでも使う）。
   作り方は chartGen（設定 settings.chartGen／既定 "2" = 新方式。"1" = 旧方式）。中身は js/chart-gen.js の純関数。 */
function generateNotes(diff, bpm, offset, seed, chartGen = window.Trk.core.settings.chartGen) {
  if (!window.Trk.core.videoReady || !(bpm >= 60 && bpm <= 300) || !window.Trk.data.DIFF_IDS.includes(diff)) return [];
  const rand = window.Trk.core.mulberry32(window.Trk.core.hashString(`${String(seed).trim()}|${diff}|${bpm}|${offset}`));
  return window.Trk.chart.buildChartNotes({ analysis: window.Trk.core.analysis, durationMs: window.Trk.core.video.duration * 1000, diff, spec: window.Trk.data.DIFFS[diff], bpm, offset, rand, chartGen });
}
function buildChart() {
  if (!window.Trk.core.videoReady) return;
  window.Trk.core.chartMode = "generated"; window.Trk.core.chartDiff = window.Trk.core.settings.difficulty;
  const bpm = Number(window.Trk.core.$("bpm").value), offset = Number(window.Trk.core.$("offset").value) || 0;
  if (!(bpm >= 60 && bpm <= 300)) { window.Trk.core.chart = []; window.Trk.core.setStatus("chartStatus", "noChart"); window.Trk.core.updateChartButtons(); return; }
  window.Trk.core.chart = generateNotes(window.Trk.core.chartDiff, bpm, offset, window.Trk.core.$("seed").value).map(n => ({ ...n, judged:false, result:null }));
  window.Trk.core.chartMeta = { bpm, offset };
  window.Trk.core.currentLevel = estimateLevel(window.Trk.core.chart);
  window.Trk.core.setStatus("chartStatus", window.Trk.core.chart.length ? () => window.Trk.core.chartSummary() : "noChart");
  window.Trk.core.updateChartButtons();
}
function chartToData(notes, diff, meta = window.Trk.core.chartMeta) {
  return {
    format:"shadow-taiko-chart", version:2, app:"trk!",
    media:{ name:window.Trk.core.mediaName, fingerprint: window.Trk.core.fingerprint, duration:+(window.Trk.core.video.duration || 0).toFixed(3) },
    bpm:meta.bpm, offset:meta.offset, seed:window.Trk.core.$("seed").value.trim(), difficulty:diff, level:estimateLevel(notes),
    notes:notes.map(n => [n.time, n.lane])
  };
}
function exportChart(statusId) {
  if (!window.Trk.core.chart.length) { window.Trk.core.setStatus(statusId, "exportNone"); return; }
  const base = window.Trk.core.safeName(window.Trk.core.baseName(window.Trk.core.mediaName) || "chart");
  window.Trk.core.downloadBlob(new Blob([JSON.stringify(chartToData(window.Trk.core.chart, window.Trk.core.chartDiff))], { type:"application/json" }), `${base}-${window.Trk.core.chartDiff}.shadow-taiko.json`);
  window.Trk.core.setStatus(statusId, "exportDone");
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
  if (checkFingerprint && data.media && data.media.fingerprint && data.media.fingerprint !== window.Trk.core.fingerprint) return { key:"importMismatch" };
  notes.sort((a, b) => a.time - b.time);
  if (notes[notes.length - 1].time > window.Trk.core.video.duration * 1000 + 1000) return { key:"importTooLong" };
  return { notes };
}
/* 確認した譜面を今の譜面にする（mode: "imported" / "pack"） */
function applyChartData(data, mode = "imported", sid = "importStatus", checkFingerprint = true) {
  if (!window.Trk.core.videoReady) { window.Trk.core.setStatus(sid, "loadError"); return false; }
  const v = validateChartData(data, checkFingerprint);
  if (v.key) { window.Trk.core.setStatus(sid, v.key); return false; }
  window.Trk.core.chart = v.notes.map(n => ({ time:Math.round(n.time), lane:n.lane, judged:false, result:null }));
  window.Trk.core.chartMode = mode;
  window.Trk.core.chartDiff = window.Trk.data.DIFF_IDS.includes(data.difficulty) ? data.difficulty : window.Trk.core.settings.difficulty;
  window.Trk.core.chartMeta = {
    bpm:typeof data.bpm === "number" && Number.isFinite(data.bpm) ? data.bpm : 0,
    offset:typeof data.offset === "number" && Number.isFinite(data.offset) ? data.offset : 0
  };
  window.Trk.core.currentLevel = estimateLevel(window.Trk.core.chart);
  window.Trk.core.setStatus("chartStatus", () => window.Trk.core.chartSummary());
  if (mode === "imported") window.Trk.core.setStatus(sid, "importSuccess");
  window.Trk.core.updateChartButtons();
  return true;
}
async function importChartFile(file, sid = "importStatus") {
  if (!file || typeof file.size !== "number" || !Number.isFinite(file.size) || file.size < 0 ||
      file.size > CHART_FILE_MAX || typeof file.text !== "function") {
    window.Trk.core.setStatus(sid, "importInvalid"); return false;
  }
  let data = null;
  try { data = JSON.parse(await file.text()); } catch (_) { window.Trk.core.setStatus(sid, "importBad"); return false; }
  return applyChartData(data, "imported", sid, true);
}

/* ---------- ヒットSE ---------- */
const seBuffers = [null, null], seFiles = [null, null]; let noiseBuf = null;
function playSE(lane, force = false) {
  if (!window.Trk.core.settings.seEnabled && !force) return;
  const ac = getAC(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const t = ac.currentTime, out = ac.createGain();
  out.gain.value = window.Trk.core.settings.seVolume; out.connect(ac.destination);
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
  if (!getAC()) { window.Trk.core.setStatus("seStatus", "seUnavailable"); return; }
  try {
    seBuffers[lane] = await decodeAudio(await file.arrayBuffer());
    seFiles[lane] = file;
    window.Trk.core.setStatus("seStatus", lane ? "seLoadedKa" : "seLoadedDon");
  } catch (_) { window.Trk.core.setStatus("seStatus", "seLoadError"); }
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
/* 領域（window.Trk.media）：公開名の正規の場所。旧名（window.X）は別名として残す（利用者の決定） */
window.Trk = window.Trk || {};
window.Trk.media = Object.assign(window.Trk.media || {}, { CHART_FILE_MAX, buildChart, decodeAudio, estimateLevel, exportChart, generateNotes, getAC, importChartFile, loadMedia, loadSE, playSE, rmsAt, seBuffers, seFiles, setBackground });
Object.defineProperty(window.Trk.media, "applyChartData", { configurable:true, get:() => applyChartData, set:v => { applyChartData = v; } });
Object.defineProperty(window.Trk.media, "audioCtx", { configurable:true, get:() => audioCtx, set:v => { audioCtx = v; } });
Object.defineProperty(window.Trk.media, "chartToData", { configurable:true, get:() => chartToData, set:v => { chartToData = v; } });
})();
