// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! video-max.js — 🖥 動画の全画面表示（最大化ビューア）
   ・📺 TVドックの ⛶（＝「次の曲」の右のボタン）と、メディアプレーヤーの
     「全画面で表示」から開きます。
   ・いま流れている動画を、画面いっぱいに映します（縦横比は変えません）。
     音声だけの曲は、曲パックの背景画像を映します。
   ・閉じる：✕ ／ ESC ／ 黒いところのクリック。音の設定は変えません。
   ・ゲームが始まったら自動で閉じます（判定や記録には影響しません）。
   ============================================================================ */
"use strict";
(() => {

/* ============ 文章（接頭辞 videoMax…） ============ */
Object.assign(TEXT.ja, {
  videoMaxTitle: "🖥 動画の全画面表示",
  videoMaxToast: "🖥 動画を全画面で表示します",
  videoMaxClose: "✕ 閉じる",
  videoMaxPlay: "▶ 再生", videoMaxPause: "⏸ 一時停止",
  videoMaxFull: "⛶ ブラウザーの全画面", videoMaxExitFull: "⛶ ブラウザーの全画面を終了",
  videoMaxNoVideo: "まだ動画がありません。曲を選ぶと、ここに全画面で映します。",
  videoMaxHint: "動画をクリック：再生／一時停止　←→：10秒　⛶：ブラウザーの全画面　ESC か ✕ で閉じます"
});
Object.assign(TEXT.en, {
  videoMaxTitle: "🖥 Full-screen video",
  videoMaxToast: "🖥 Showing the video full screen",
  videoMaxClose: "✕ Close",
  videoMaxPlay: "▶ Play", videoMaxPause: "⏸ Pause",
  videoMaxFull: "⛶ Browser full screen", videoMaxExitFull: "⛶ Exit browser full screen",
  videoMaxNoVideo: "No video yet. Pick a song and it plays here full screen.",
  videoMaxHint: "Click the video: play / pause · ←→: 10 s · ⛶: browser full screen · ESC or ✕ closes"
});
Object.assign(TEXT.zh, {
  videoMaxTitle: "🖥 视频全屏显示",
  videoMaxToast: "🖥 正在全屏显示视频",
  videoMaxClose: "✕ 关闭",
  videoMaxPlay: "▶ 播放", videoMaxPause: "⏸ 暂停",
  videoMaxFull: "⛶ 浏览器全屏", videoMaxExitFull: "⛶ 退出浏览器全屏",
  videoMaxNoVideo: "还没有视频。选择歌曲后会在这里全屏播放。",
  videoMaxHint: "点击视频：播放／暂停　←→：10秒　⛶：浏览器全屏　按 ESC 或 ✕ 关闭"
});
Object.assign(TEXT.ko, {
  videoMaxTitle: "🖥 영상 전체 화면",
  videoMaxToast: "🖥 영상을 전체 화면으로 보여 줍니다",
  videoMaxClose: "✕ 닫기",
  videoMaxPlay: "▶ 재생", videoMaxPause: "⏸ 일시정지",
  videoMaxFull: "⛶ 브라우저 전체 화면", videoMaxExitFull: "⛶ 브라우저 전체 화면 끝내기",
  videoMaxNoVideo: "아직 영상이 없습니다. 곡을 고르면 여기 전체 화면으로 보여 줍니다.",
  videoMaxHint: "영상을 클릭: 재생／일시정지　←→: 10초　⛶: 브라우저 전체 화면　ESC 또는 ✕ 로 닫습니다"
});

const videoEl = document.getElementById("video");
if (!videoEl) return;

let root = null, canvas = null, ctx = null, stage = null;
let topBar = null, titleNode = null, playNode = null, fsNode = null, closeNode = null;
let noteNode = null, hintNode = null;
let raf = 0, isOn = false, playedByUs = false, idleTimer = 0;
const watchers = new Set();

/* core.js のグローバル（let 宣言）は、読み込み前・初期化前だと参照できないので必ず守る */
const songTitle = () => { try { return (currentSong && (currentSong.title || currentSong.name)) || ""; } catch (_) { return ""; } };
const hasFrames = () => { try { return !!videoEl.videoWidth && videoEl.readyState >= 2 && !!videoEl.src; } catch (_) { return false; } };
const packImage = () => { try { return (bgImage && bgImage.naturalWidth) ? bgImage : null; } catch (_) { return null; } };

function notify() { for (const fn of [...watchers]) { try { fn(isOn); } catch (_) {} } }
function setI18n(node, key) { if (!node) return; node.textContent = tr(key); node.dataset.i18n = key; }

/* ---- ブラウザーの全画面（対応しているときだけ） ---- */
const fsSupported = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsCurrent = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function toggleBrowserFullscreen() {
  try {
    if (fsCurrent()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) { const p = exit.call(document); if (p && p.catch) p.catch(() => {}); }
      return;
    }
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!req) return;
    const p = req.call(root);
    if (p && p.catch) p.catch(() => {});   /* 許可されなくても、アプリ内の全画面はそのまま使える */
  } catch (_) {}
}
function syncFsLabel() {
  if (!fsNode) return;
  const on = !!fsCurrent();
  fsNode.classList.toggle("selected", on);
  fsNode.textContent = "⛶";
  fsNode.title = tr(on ? "videoMaxExitFull" : "videoMaxFull");
  fsNode.setAttribute("aria-label", fsNode.title);
  fsNode.setAttribute("aria-pressed", String(on));
}

/* ---- 操作まわり ---- */
function togglePlay() {
  try {
    if (videoEl.paused) { const p = videoEl.play(); if (p && p.catch) p.catch(() => {}); }
    else videoEl.pause();
    playedByUs = false;   /* 自分で操作したあとは、閉じるときに勝手に止めない */
  } catch (_) {}
}
function seekBy(delta) {
  try {
    if (!Number.isFinite(videoEl.duration)) return;
    videoEl.currentTime = Math.max(0, Math.min(videoEl.duration, (videoEl.currentTime || 0) + delta));
  } catch (_) {}
}
function pokeChrome() {
  if (!root) return;
  root.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (isOn && root) root.classList.add("idle"); }, 2600);
}

/* ---- 描画 ---- */
function paint() {
  raf = requestAnimationFrame(paint);
  if (!ctx || !canvas) return;
  const w = canvas.clientWidth || window.innerWidth || 0, h = canvas.clientHeight || window.innerHeight || 0;
  if (!w || !h) return;
  const dpr = typeof TrkLite === "object" ? TrkLite.pixelRatio(2) : Math.min(2, window.devicePixelRatio || 1);   // 🪶 軽量化は描画解像度の上限
  const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  let drew = false;
  /* ✨ フレーム補完（js/frame-interp.js）：設定がオンのときは、作った中間フレームを映す */
  const fi = (typeof settings !== "undefined" && settings.frameInterp !== "off" && window.TrkFrameInterp) ? window.TrkFrameInterp : null;
  if (fi) { try { drew = fi.drawTo(ctx, W, H); } catch (_) { drew = false; } }
  if (!drew && hasFrames()) {
    const s = Math.min(W / videoEl.videoWidth, H / videoEl.videoHeight);   /* 全体を映す（切らない） */
    const dw = videoEl.videoWidth * s, dh = videoEl.videoHeight * s;
    try { ctx.drawImage(videoEl, (W - dw) / 2, (H - dh) / 2, dw, dh); drew = true; } catch (_) {}
  }
  if (!drew) {
    const img = packImage();
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      try { ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh); drew = true; } catch (_) {}
    }
  }
  if (noteNode) noteNode.hidden = drew;
  const t = songTitle();
  if (titleNode) {
    if (t) { if (titleNode.textContent !== t) { titleNode.textContent = t; titleNode.dataset.i18n = ""; } }
    else if (titleNode.dataset.i18n !== "videoMaxTitle") setI18n(titleNode, "videoMaxTitle");
  }
  const key = videoEl.paused ? "videoMaxPlay" : "videoMaxPause";
  if (playNode && playNode.dataset.i18n !== key) setI18n(playNode, key);
}
function startLoop() { if (!raf) raf = requestAnimationFrame(paint); }
function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

/* ---- 開く・閉じる ---- */
function openMax() {
  if (!root) build();
  if (!root || isOn) return false;
  if (window.TrkSafeMode && TrkSafeMode()) return false;
  isOn = true; playedByUs = false;
  if (window.TrkFrameInterp) { try { window.TrkFrameInterp.attach("max", canvas); } catch (_) {} }
  root.hidden = false;
  document.body.classList.add("videoMaxOpen");
  try {
    if (videoEl.paused && videoEl.src) { const p = videoEl.play(); if (p && p.catch) p.catch(() => {}); playedByUs = true; }
  } catch (_) {}
  startLoop(); pokeChrome(); syncFsLabel();
  if (closeNode) closeNode.focus();
  notify();
  if (typeof showToast === "function") showToast(tr("videoMaxToast"));
  return true;
}
function closeMax() {
  if (!isOn) return;
  isOn = false;
  if (window.TrkFrameInterp) { try { window.TrkFrameInterp.detach("max"); } catch (_) {} }
  stopLoop();
  clearTimeout(idleTimer);
  if (root) { root.hidden = true; root.classList.remove("idle"); }
  document.body.classList.remove("videoMaxOpen");
  if (fsCurrent()) { try { const exit = document.exitFullscreen || document.webkitExitFullscreen; if (exit) { const p = exit.call(document); if (p && p.catch) p.catch(() => {}); } } catch (_) {} }
  if (playedByUs) { try { videoEl.pause(); } catch (_) {} }
  playedByUs = false;
  notify();
}
function toggleMax() { if (isOn) closeMax(); else openMax(); }

/* ---- 組み立て ---- */
function applyTexts() {
  if (!root) return;
  if (!songTitle()) setI18n(titleNode, "videoMaxTitle");
  setI18n(noteNode, "videoMaxNoVideo");
  setI18n(hintNode, "videoMaxHint");
  if (playNode) setI18n(playNode, videoEl.paused ? "videoMaxPlay" : "videoMaxPause");
  if (closeNode) { closeNode.title = tr("videoMaxClose"); closeNode.setAttribute("aria-label", closeNode.title); }
  root.setAttribute("aria-label", tr("videoMaxTitle"));
  syncFsLabel();
}
function build() {
  root = el("div", "videoMaxView"); root.id = "videoMaxView"; root.hidden = true;
  root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true");

  topBar = el("div", "videoMaxTop");
  titleNode = el("strong", "videoMaxTitle", tr("videoMaxTitle")); titleNode.dataset.i18n = "videoMaxTitle";
  playNode = el("button", "videoMaxBtn", tr("videoMaxPlay")); playNode.type = "button"; playNode.dataset.i18n = "videoMaxPlay";
  fsNode = el("button", "videoMaxBtn videoMaxFs", "⛶"); fsNode.type = "button";
  fsNode.hidden = !fsSupported();
  closeNode = el("button", "videoMaxBtn videoMaxClose", "✕"); closeNode.type = "button";
  const tools = el("div", "videoMaxTools"); tools.append(playNode, fsNode, closeNode);
  topBar.append(titleNode, tools);

  stage = el("div", "videoMaxStage");
  canvas = document.createElement("canvas"); canvas.className = "videoMaxCanvas";
  noteNode = el("p", "videoMaxNote hint", tr("videoMaxNoVideo")); noteNode.dataset.i18n = "videoMaxNoVideo";
  stage.append(canvas, noteNode);

  hintNode = el("p", "videoMaxHint hint", tr("videoMaxHint")); hintNode.dataset.i18n = "videoMaxHint";

  root.append(topBar, stage, hintNode);
  document.body.append(root);

  ctx = canvas.getContext("2d");
  canvas.addEventListener("click", togglePlay);
  stage.addEventListener("click", e => {
    /* 動画の外側（黒いところ）をクリックしたら閉じる。動画が無いときは画面のどこでも閉じる */
    if (e.target === stage || e.target === noteNode) { closeMax(); return; }
    if (e.target === canvas && !hasFrames()) closeMax();
  });
  topBar.addEventListener("click", e => { if (e.target === topBar) closeMax(); });
  playNode.addEventListener("click", togglePlay);
  closeNode.addEventListener("click", () => closeMax());
  fsNode.addEventListener("click", toggleBrowserFullscreen);
  root.addEventListener("pointermove", pokeChrome);
  root.addEventListener("pointerdown", pokeChrome);
  document.addEventListener("fullscreenchange", syncFsLabel);
  document.addEventListener("webkitfullscreenchange", syncFsLabel);
  applyTexts();
}

/* ---- キー（開いている間だけ、先に受け取る） ---- */
addEventListener("keydown", e => {
  if (!isOn || window._trkStudyRoomOpen) return;
  if (e.code === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeMax(); return; }
  if (e.code === "Space") { e.preventDefault(); e.stopImmediatePropagation(); togglePlay(); return; }
  if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
    e.preventDefault(); e.stopImmediatePropagation();
    seekBy(e.code === "ArrowRight" ? 10 : -10);
  }
}, true);

/* ゲームが始まったら閉じる（判定や記録には影響しない） */
on("phase", p => { if (p === "playing" && isOn) closeMax(); });
on("language", () => { if (isOn || root) applyTexts(); });

window.TrkVideoMax = Object.freeze({
  version: 1,
  open: openMax,
  close: closeMax,
  toggle: toggleMax,
  isOpen: () => isOn,
  onChange(fn) { if (typeof fn === "function") watchers.add(fn); return () => watchers.delete(fn); }
});

})();
/* ✅ video-max.js 完了 */
