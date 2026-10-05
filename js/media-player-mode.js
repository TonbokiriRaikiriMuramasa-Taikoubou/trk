// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! media-player-mode.js — ▶ メディアプレーヤーモード
   TVの電源ボタンを長押しして、ゲームを始めずに曲を聴くための画面を開く。
   音源は既存の video 要素を使い、曲ファイルは端末内から出ない。
   ============================================================================ */
"use strict";
(() => {

Object.assign(TEXT.ja, {
  tvMediaHoldHint:"電源長押しでメディアプレーヤー",
  mediaTitle:"▶ メディアプレーヤー",
  mediaSubtitle:"ゲームを始めずに、曲を聴くための再生画面です。曲送り・リピート・シャッフル・速度・スリープタイマーを使えます。",
  mediaClose:"閉じる", mediaNoTrack:"曲を選ぶと、ここでフル再生できます。",
  mediaNow:"再生中", mediaPaused:"一時停止", mediaEnded:"再生終了",
  mediaPrev:"前の曲", mediaNext:"次の曲", mediaPlay:"再生", mediaPause:"一時停止", mediaRestart:"最初から",
  mediaVolume:"音量", mediaMute:"ミュート", mediaUnmute:"ミュート解除", mediaSeek:"再生位置",
  mediaShuffle:"シャッフル", mediaRepeat:"リピート", mediaRepeatOff:"なし", mediaRepeatOne:"1曲", mediaRepeatAll:"全曲",
  mediaRate:"再生速度", mediaSleep:"スリープタイマー", mediaSleepOff:"なし", mediaSleep15:"15分", mediaSleep30:"30分", mediaSleep60:"60分",
  mediaQueue:"再生キュー", mediaQueueHint:"曲を選ぶと、この画面を閉じずに再生します。曲リストに追加した音源・共有フォルダ・曲パックをまとめて扱えます。",
  mediaSearch:"キューを検索…", mediaNoSongs:"まだ曲がありません。選曲画面から音源を追加してください。", mediaNoMatch:"一致する曲がありません。",
  mediaSleepSet:"{n}分後に再生を止めます。", mediaSleepDone:"スリープタイマーで停止しました。", mediaLoaded:"読み込み中…", mediaLoadFailed:"この曲を読み込めませんでした。",
  mediaKeyboard:"Space：再生／一時停止　←→：10秒　N：次の曲　P：前の曲　Esc：閉じる",
  mediaModeStatus:"メディアプレーヤー中（ゲームの記録には影響しません）"
});
Object.assign(TEXT.en, {
  tvMediaHoldHint:"Long-press power for media player",
  mediaTitle:"▶ Media player",
  mediaSubtitle:"Listen without starting a game. Use track controls, repeat, shuffle, playback speed, and a sleep timer.",
  mediaClose:"Close", mediaNoTrack:"Choose a song to play it here in full.",
  mediaNow:"Playing", mediaPaused:"Paused", mediaEnded:"Finished",
  mediaPrev:"Previous", mediaNext:"Next", mediaPlay:"Play", mediaPause:"Pause", mediaRestart:"Restart",
  mediaVolume:"Volume", mediaMute:"Mute", mediaUnmute:"Unmute", mediaSeek:"Position",
  mediaShuffle:"Shuffle", mediaRepeat:"Repeat", mediaRepeatOff:"Off", mediaRepeatOne:"One", mediaRepeatAll:"All",
  mediaRate:"Playback speed", mediaSleep:"Sleep timer", mediaSleepOff:"Off", mediaSleep15:"15 min", mediaSleep30:"30 min", mediaSleep60:"60 min",
  mediaQueue:"Queue", mediaQueueHint:"Choose a track to play it without closing this screen. Added files, shared folders, and song packs appear together.",
  mediaSearch:"Search queue…", mediaNoSongs:"No songs yet. Add audio from song select.", mediaNoMatch:"No matching songs.",
  mediaSleepSet:"Playback will stop in {n} minutes.", mediaSleepDone:"Sleep timer stopped playback.", mediaLoaded:"Loading…", mediaLoadFailed:"This track could not be loaded.",
  mediaKeyboard:"Space: play/pause   ←→: 10 seconds   N: next   P: previous   Esc: close",
  mediaModeStatus:"Media player (does not affect game records)"
});
Object.assign(TEXT.zh, {
  tvMediaHoldHint:"长按电源打开媒体播放器",
  mediaTitle:"▶ 媒体播放器", mediaSubtitle:"不开始游戏也能听歌。支持切歌、循环、随机、播放速度和睡眠定时器。",
  mediaClose:"关闭", mediaNoTrack:"选择歌曲后，就能在这里完整播放。", mediaNow:"正在播放", mediaPaused:"已暂停", mediaEnded:"播放结束",
  mediaPrev:"上一首", mediaNext:"下一首", mediaPlay:"播放", mediaPause:"暂停", mediaRestart:"从头播放",
  mediaVolume:"音量", mediaMute:"静音", mediaUnmute:"取消静音", mediaSeek:"播放位置",
  mediaShuffle:"随机", mediaRepeat:"循环", mediaRepeatOff:"关闭", mediaRepeatOne:"单曲", mediaRepeatAll:"全部",
  mediaRate:"播放速度", mediaSleep:"睡眠定时", mediaSleepOff:"关闭", mediaSleep15:"15分钟", mediaSleep30:"30分钟", mediaSleep60:"60分钟",
  mediaQueue:"播放队列", mediaQueueHint:"选择歌曲后会在此画面中播放。添加的文件、共享文件夹和歌曲包会合并显示。",
  mediaSearch:"搜索队列…", mediaNoSongs:"还没有歌曲。请先在选曲画面添加音频。", mediaNoMatch:"没有匹配的歌曲。",
  mediaSleepSet:"将在{n}分钟后停止播放。", mediaSleepDone:"睡眠定时器已停止播放。", mediaLoaded:"正在读取…", mediaLoadFailed:"无法读取这首歌。",
  mediaKeyboard:"空格：播放／暂停　←→：10秒　N：下一首　P：上一首　Esc：关闭",
  mediaModeStatus:"媒体播放器中（不影响游戏记录）"
});
Object.assign(TEXT.ko, {
  tvMediaHoldHint:"전원 길게 눌러 미디어 플레이어",
  mediaTitle:"▶ 미디어 플레이어", mediaSubtitle:"게임을 시작하지 않고 음악을 듣습니다. 곡 넘기기・반복・셔플・재생 속도・취침 타이머를 지원합니다.",
  mediaClose:"닫기", mediaNoTrack:"곡을 고르면 여기서 전체 재생할 수 있습니다.", mediaNow:"재생 중", mediaPaused:"일시정지", mediaEnded:"재생 완료",
  mediaPrev:"이전 곡", mediaNext:"다음 곡", mediaPlay:"재생", mediaPause:"일시정지", mediaRestart:"처음부터",
  mediaVolume:"볼륨", mediaMute:"음소거", mediaUnmute:"음소거 해제", mediaSeek:"재생 위치",
  mediaShuffle:"셔플", mediaRepeat:"반복", mediaRepeatOff:"끔", mediaRepeatOne:"한 곡", mediaRepeatAll:"전체",
  mediaRate:"재생 속도", mediaSleep:"취침 타이머", mediaSleepOff:"끔", mediaSleep15:"15분", mediaSleep30:"30분", mediaSleep60:"60분",
  mediaQueue:"재생 큐", mediaQueueHint:"곡을 고르면 이 화면을 닫지 않고 재생합니다. 추가한 파일・공유 폴더・곡 팩을 함께 표시합니다.",
  mediaSearch:"큐 검색…", mediaNoSongs:"아직 곡이 없습니다. 곡 선택 화면에서 음원을 추가하세요.", mediaNoMatch:"일치하는 곡이 없습니다.",
  mediaSleepSet:"{n}분 후 재생을 멈춥니다.", mediaSleepDone:"취침 타이머로 재생을 멈췄습니다.", mediaLoaded:"불러오는 중…", mediaLoadFailed:"이 곡을 불러오지 못했습니다.",
  mediaKeyboard:"Space: 재생／일시정지   ←→: 10초   N: 다음   P: 이전   Esc: 닫기",
  mediaModeStatus:"미디어 플레이어 중 (게임 기록에 영향 없음)"
});

const HOLD_MS = 650;
let overlay, dialog, powerButton;
let mediaOpen = false, holdTimer = 0, longPressed = false;
let repeatMode = settings.mediaRepeat || "off", shuffle = !!settings.mediaShuffle;
let mediaRate = Number(settings.mediaRate) || 1, sleepTimer = 0, sleepUntil = 0, tickTimer = 0;
let seeking = false, queueFilter = "";
const MEDIA_POS_KEY = "trk_media_positions_v1";
let mediaPositions = {};
try { mediaPositions = JSON.parse(localStorage.getItem(MEDIA_POS_KEY)) || {}; } catch (_) { mediaPositions = {}; }
function mediaPositionKey() { return fingerprint || (currentSong && currentSong.key) || ""; }
function savedMediaPosition() {
  const p = Number(mediaPositions[mediaPositionKey()]);
  return Number.isFinite(p) && p > 5 && video.duration > p + 5 ? p : 0;
}
function saveMediaPosition(clear = false) {
  const key = mediaPositionKey(); if (!key || !videoReady) return;
  if (clear || video.ended || !Number.isFinite(video.currentTime) || video.currentTime < 5 || video.currentTime >= (video.duration || Infinity) - 5) delete mediaPositions[key];
  else mediaPositions[key] = Math.round(video.currentTime * 10) / 10;
  try { localStorage.setItem(MEDIA_POS_KEY, JSON.stringify(mediaPositions)); } catch (_) {}
}

const mpFmt = sec => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};
const mpSongs = () => typeof allSongs === "function" ? allSongs().filter(Boolean) : [];
const mediaActive = () => !!window._trkMediaPlayerOpen;
function currentList() {
  const q = queueFilter.trim().toLowerCase();
  return mpSongs().filter(it => !q || `${it.title || ""} ${it.artist || ""} ${it.packName || ""} ${it.dir || ""}`.toLowerCase().includes(q));
}
function setRate(value) {
  mediaRate = Number(value) || 1;
  settings.mediaRate = mediaRate;
  if (video) video.playbackRate = mediaRate;
  saveUserPrefs();
}
function setRepeat(value) {
  repeatMode = ["off", "one", "all"].includes(value) ? value : "off";
  settings.mediaRepeat = repeatMode;
  saveUserPrefs(); renderMedia();
}
function setShuffle(value) {
  shuffle = !!value;
  settings.mediaShuffle = shuffle;
  saveUserPrefs(); renderMedia();
}
function stopSleepTimer(silent = true) {
  clearTimeout(sleepTimer); sleepTimer = 0; sleepUntil = 0;
  if (!silent) renderMedia();
}
function setSleep(minutes) {
  const n = Number(minutes) || 0;
  stopSleepTimer(true);
  if (n > 0) {
    sleepUntil = Date.now() + n * 60000;
    sleepTimer = setTimeout(() => {
      sleepTimer = 0; sleepUntil = 0;
      video.pause();
      if (typeof showToast === "function") showToast(tr("mediaSleepDone"));
      renderMedia();
    }, n * 60000);
    if (typeof showToast === "function") showToast(tr("mediaSleepSet", { n }));
  }
  renderMedia();
}
function mediaCandidates() {
  const list = mpSongs();
  if (!list.length) return [];
  if (shuffle) {
    const cur = currentSong && currentSong.key;
    const other = list.filter(x => x.key !== cur);
    return other.length ? other : list;
  }
  return list;
}
function nextMediaSong(dir = 1) {
  const list = mediaCandidates(); if (!list.length) return null;
  if (shuffle) return list[Math.floor(Math.random() * list.length)];
  const i = currentSong ? list.findIndex(x => x.key === currentSong.key) : -1;
  return list[(i + dir + list.length) % list.length];
}
async function playSong(it, fromStart = true) {
  if (!it || typeof selectSong !== "function") return;
  if (phase !== "title") {
    if (typeof toTitle === "function") toTitle();
    else return;
  }
  window._trkMediaPlayerMode = true;
  if (!currentSong || currentSong.key !== it.key) {
    saveMediaPosition();
    await selectSong(it);
  } else if (!videoReady) {
    await selectSong(it);
  }
  if (!mediaActive() || currentSong !== it || !videoReady) { renderMedia(); return; }
  if (fromStart) { try { video.currentTime = savedMediaPosition(); } catch (_) {} }
  video.muted = false; video.volume = settings.musicVolume; setRate(mediaRate);
  try { await video.play(); } catch (_) { showMediaStatus("mediaLoadFailed"); }
  renderMedia(); updateMediaSession();
}
function playPause() {
  if (!videoReady) return;
  if (video.paused || video.ended) {
    if (video.ended) { try { video.currentTime = 0; } catch (_) {} }
    video.muted = false; video.volume = settings.musicVolume; video.play().catch(() => showMediaStatus("mediaLoadFailed"));
  } else video.pause();
  renderMedia();
}
async function stepMedia(dir) {
  const it = nextMediaSong(dir);
  if (it) await playSong(it, true);
  else showMediaStatus("mediaNoSongs");
}
function seekBy(delta) {
  if (!videoReady || !Number.isFinite(video.duration)) return;
  video.currentTime = Math.max(0, Math.min(video.duration, (video.currentTime || 0) + delta));
  renderMedia();
}
function showMediaStatus(key, vars) {
  if (!statusNode) return;
  statusNode.textContent = tr(key, vars);
  statusNode.dataset.i18n = key;
}
function endedMedia() {
  if (!mediaActive()) return;
  if (repeatMode === "one") { saveMediaPosition(true); try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); }
  else if (repeatMode === "all" || shuffle) stepMedia(1);
  else saveMediaPosition(true);
  renderMedia(); updateMediaSession();
}
function updateMediaSession() {
  const ms = navigator.mediaSession;
  if (!ms) return;
  const s = currentSong || {};
  if (typeof MediaMetadata !== "undefined" && s) {
    try { ms.metadata = new MediaMetadata({ title:s.title || baseName(mediaName) || "trk!", artist:s.artist || "trk!", album:s.packName || "trk!", artwork:[{ src:"icons/icon-512.png", sizes:"512x512", type:"image/png" }] }); } catch (_) {}
  }
  try {
    if (videoReady && Number.isFinite(video.duration) && video.duration > 0 && typeof ms.setPositionState === "function") {
      ms.setPositionState({ duration:video.duration, playbackRate:video.playbackRate || 1, position:Math.max(0, Math.min(video.duration, video.currentTime || 0)) });
    }
  } catch (_) {}
}
async function sessionSong(dir) {
  const pick = dir > 0 ? nextSong : prevSong;
  if (typeof pick !== "function" || typeof selectSong !== "function") return;
  const it = pick(); if (!it) return;
  if (phase !== "title" && typeof toTitle === "function") toTitle();
  await selectSong(it);
  if (settings.autoPlay && phase === "title" && videoReady && chart.length && currentSong === it && typeof startGame === "function") startGame();
}
function installMediaSession() {
  const ms = navigator.mediaSession; if (!ms) return;
  const act = (name, fn) => { try { ms.setActionHandler(name, fn); } catch (_) {} };
  act("play", () => mediaActive() ? playPause() : (phase === "paused" ? resumeGame() : video.play().catch(() => {})));
  act("pause", () => mediaActive() ? playPause() : (phase === "playing" ? pauseGame() : video.pause()));
  act("previoustrack", () => mediaActive() ? stepMedia(-1) : sessionSong(-1));
  act("nexttrack", () => mediaActive() ? stepMedia(1) : sessionSong(1));
  act("seekbackward", d => seekBy(-(d && d.seekOffset || 10)));
  act("seekforward", d => seekBy(d && d.seekOffset || 10));
  act("seekto", d => { if (Number.isFinite(d && d.seekTime) && videoReady) video.currentTime = Math.max(0, Math.min(video.duration || 0, d.seekTime)); });
}

let statusNode, queueNode, progressNode, playNode, timeNode, titleNode, subNode, volumeNode, muteNode, shuffleNode, repeatNode, rateNode, sleepNode, searchNode;
function tx(tag, key, cls) { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; }
function makeButton(key, cls = "mediaSmallBtn") { const b = el("button", cls, tr(key)); b.type = "button"; b.dataset.i18n = key; return b; }
function updateTrackText() {
  const s = currentSong;
  titleNode.textContent = s ? s.title : tr("mediaNoTrack");
  subNode.textContent = s ? [s.artist, s.packName, srcLabelSafe(s)].filter(Boolean).join(" · ") : tr("mediaModeStatus");
  titleNode.dataset.i18n = s ? "" : "mediaNoTrack";
  if (!s) delete titleNode.dataset.i18n;
}
function srcLabelSafe(s) {
  try { return typeof srcLabel === "function" ? srcLabel(s) : s.source || ""; } catch (_) { return s.source || ""; }
}
function renderQueue() {
  if (!queueNode) return;
  queueNode.textContent = "";
  const all = currentList();
  if (!all.length) { queueNode.append(el("div", "mediaEmpty", tr(mpSongs().length ? "mediaNoMatch" : "mediaNoSongs"))); return; }
  for (const it of all.slice(0, 300)) {
    const b = el("button", "mediaQueueItem" + (currentSong && currentSong.key === it.key ? " selected" : ""));
    b.type = "button"; b.dataset.key = it.key;
    const name = el("strong", "mediaQueueName", it.title || "song");
    const meta = el("span", "mediaQueueMeta", [it.artist, srcLabelSafe(it)].filter(Boolean).join(" · "));
    b.append(name, meta);
    b.addEventListener("click", () => playSong(it, true));
    queueNode.append(b);
  }
  if (all.length > 300) queueNode.append(el("div", "hint", `+ ${all.length - 300}`));
}
function renderMedia() {
  if (!mediaOpen || !overlay) return;
  updateTrackText();
  const ready = !!(videoReady && currentSong);
  const cur = ready ? (video.currentTime || 0) : 0, dur = ready && Number.isFinite(video.duration) ? video.duration : 0;
  if (progressNode) {
    progressNode.max = String(dur || 1); progressNode.value = String(Math.min(cur, dur || 0)); progressNode.disabled = !ready;
    progressNode.setAttribute("aria-valuetext", `${mpFmt(cur)} / ${mpFmt(dur)}`);
  }
  if (timeNode) timeNode.textContent = `${mpFmt(cur)} / ${mpFmt(dur)}`;
  if (playNode) { playNode.textContent = video.paused || !ready ? tr(video.ended ? "mediaRestart" : "mediaPlay") : tr("mediaPause"); playNode.dataset.i18n = video.ended ? "mediaRestart" : (video.paused || !ready ? "mediaPlay" : "mediaPause"); }
  if (volumeNode) volumeNode.value = String(settings.musicVolume);
  if (muteNode) { muteNode.textContent = video.muted ? tr("mediaUnmute") : tr("mediaMute"); muteNode.dataset.i18n = video.muted ? "mediaUnmute" : "mediaMute"; }
  if (shuffleNode) { shuffleNode.classList.toggle("selected", shuffle); shuffleNode.setAttribute("aria-pressed", String(shuffle)); }
  if (repeatNode) { repeatNode.value = repeatMode; }
  if (rateNode) rateNode.value = String(mediaRate);
  if (sleepNode) sleepNode.value = sleepUntil ? String(Math.max(1, Math.round((sleepUntil - Date.now()) / 60000))) : "0";
  if (statusNode) {
    statusNode.textContent = videoReady && currentSong ? (video.ended ? tr("mediaEnded") : video.paused ? tr("mediaPaused") : tr("mediaNow")) : tr("mediaNoTrack");
    statusNode.dataset.i18n = "";
  }
  renderQueue();
  updateMediaSession();
}
function closeMedia(restore = true) {
  if (!mediaOpen) return;
  mediaOpen = false; window._trkMediaPlayerOpen = false; window._trkMediaPlayerMode = false;
  clearInterval(tickTimer); tickTimer = 0; stopSleepTimer(true); seeking = false;
  saveMediaPosition(); video.pause(); video.playbackRate = 1;
  overlay.hidden = true; document.body.classList.remove("mediaOpen");
  if (restore && phase === "title" && settings.previewEnabled && typeof startPreview === "function") setTimeout(startPreview, 50);
  if (powerButton) powerButton.focus();
}
function openMedia() {
  if (!overlay || (window.TrkSafeMode && TrkSafeMode())) return;
  if (window._trkSynthModeOpen && typeof window._trkCloseSynth === "function") window._trkCloseSynth();
  mediaOpen = true; window._trkMediaPlayerOpen = true; window._trkMediaPlayerMode = true;
  overlay.hidden = false; document.body.classList.add("mediaOpen");
  if (videoReady) { video.muted = false; video.volume = settings.musicVolume; setRate(mediaRate); }
  if (currentSong && videoReady) { try { video.currentTime = savedMediaPosition(); } catch (_) {} }
  tickTimer = setInterval(renderMedia, 250);
  renderMedia(); updateMediaSession();
  const focus = playNode || closeNode; if (focus) focus.focus();
}
let closeNode;
function buildMedia() {
  powerButton = document.querySelector("#tvDock .tvPow");
  if (!powerButton) return false;
  overlay = el("div", "instOverlay mediaOverlay"); overlay.id = "mediaPlayerMode"; overlay.hidden = true;
  const backdrop = el("div", "instBackdrop");
  dialog = el("section", "instDialog mediaDialog"); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", "mediaTitle");
  const header = el("header", "instHeader mediaHeader");
  const hwrap = el("div"); const h = tx("h2", "mediaTitle"); h.id = "mediaTitle";
  hwrap.append(h, tx("p", "mediaSubtitle", "instSubtitle"));
  closeNode = makeButton("mediaClose", "instClose"); closeNode.addEventListener("click", () => closeMedia());
  header.append(hwrap, closeNode);

  const display = el("div", "mediaDisplay");
  titleNode = el("strong", "mediaDisplayTitle", tr("mediaNoTrack"));
  subNode = el("span", "mediaDisplaySub", tr("mediaModeStatus"));
  statusNode = el("span", "mediaStatus", tr("mediaPaused"));
  display.append(titleNode, subNode, statusNode);

  const controls = el("div", "mediaControls");
  const prev = makeButton("mediaPrev", "mediaControlBtn");
  playNode = makeButton("mediaPlay", "mediaControlBtn mediaPlayBtn");
  const next = makeButton("mediaNext", "mediaControlBtn");
  const restart = makeButton("mediaRestart", "mediaSmallBtn");
  prev.addEventListener("click", () => stepMedia(-1)); playNode.addEventListener("click", playPause); next.addEventListener("click", () => stepMedia(1)); restart.addEventListener("click", () => { if (videoReady) { saveMediaPosition(true); video.currentTime = 0; video.play().catch(() => {}); } });
  controls.append(prev, playNode, next, restart);

  const progressRow = el("div", "mediaProgressRow");
  progressNode = document.createElement("input"); progressNode.type = "range"; progressNode.min = "0"; progressNode.step = "0.1"; progressNode.value = "0"; progressNode.className = "mediaProgress"; progressNode.setAttribute("aria-label", tr("mediaSeek"));
  timeNode = el("span", "mono mediaTime", "0:00 / 0:00");
  progressRow.append(progressNode, timeNode);
  progressNode.addEventListener("pointerdown", () => { seeking = true; });
  progressNode.addEventListener("pointerup", () => { seeking = false; });
  progressNode.addEventListener("input", () => { if (videoReady && video.duration) { video.currentTime = Number(progressNode.value); timeNode.textContent = `${mpFmt(video.currentTime)} / ${mpFmt(video.duration)}`; } });

  const options = el("div", "mediaOptions");
  const volumeRow = el("label", "mediaOption mediaVolumeRow"); volumeRow.append(tx("span", "mediaVolume"));
  volumeNode = document.createElement("input"); volumeNode.type = "range"; volumeNode.min = "0"; volumeNode.max = "1"; volumeNode.step = "0.01"; volumeRow.append(volumeNode);
  volumeNode.addEventListener("input", () => { settings.musicVolume = Number(volumeNode.value); video.volume = settings.musicVolume; saveUserPrefs(); });
  muteNode = makeButton("mediaMute", "mediaSmallBtn"); muteNode.addEventListener("click", () => { video.muted = !video.muted; renderMedia(); });
  shuffleNode = makeButton("mediaShuffle", "mediaSmallBtn"); shuffleNode.addEventListener("click", () => setShuffle(!shuffle));
  const repeatLabel = el("label", "mediaOption"); repeatLabel.append(tx("span", "mediaRepeat"));
  repeatNode = document.createElement("select");
  for (const [value, key] of [["off", "mediaRepeatOff"], ["one", "mediaRepeatOne"], ["all", "mediaRepeatAll"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); repeatNode.append(o); }
  repeatLabel.append(repeatNode); repeatNode.addEventListener("change", () => setRepeat(repeatNode.value));
  const rateLabel = el("label", "mediaOption"); rateLabel.append(tx("span", "mediaRate"));
  rateNode = document.createElement("select"); for (const v of [.5, .75, 1, 1.25, 1.5, 2]) { const o = document.createElement("option"); o.value = v; o.textContent = `${v.toFixed(2)}x`; rateNode.append(o); }
  rateLabel.append(rateNode); rateNode.addEventListener("change", () => { setRate(rateNode.value); });
  const sleepLabel = el("label", "mediaOption"); sleepLabel.append(tx("span", "mediaSleep"));
  sleepNode = document.createElement("select"); for (const [v, key] of [[0, "mediaSleepOff"], [15, "mediaSleep15"], [30, "mediaSleep30"], [60, "mediaSleep60"]]) { const o = document.createElement("option"); o.value = v; o.dataset.i18n = key; o.textContent = tr(key); sleepNode.append(o); }
  sleepLabel.append(sleepNode); sleepNode.addEventListener("change", () => setSleep(sleepNode.value));
  options.append(volumeRow, muteNode, shuffleNode, repeatLabel, rateLabel, sleepLabel);

  const queuePanel = el("section", "mediaQueuePanel");
  const qhead = el("div", "mediaQueueHead"); qhead.append(tx("h3", "mediaQueue"), tx("p", "mediaQueueHint", "hint"));
  searchNode = document.createElement("input"); searchNode.type = "search"; searchNode.placeholder = tr("mediaSearch"); searchNode.dataset.i18nPlaceholder = "mediaSearch"; searchNode.className = "mediaSearch"; searchNode.addEventListener("input", () => { queueFilter = searchNode.value; renderQueue(); });
  queueNode = el("div", "mediaQueueList"); queuePanel.append(qhead, searchNode, queueNode);

  const footer = el("footer", "instFooter mediaFooter"); footer.append(tx("span", "mediaModeStatus"), tx("span", "mediaKeyboard", "instKeyHint"));
  dialog.append(header, display, controls, progressRow, options, queuePanel, footer);
  overlay.append(backdrop, dialog); document.body.append(overlay);

  backdrop.addEventListener("click", () => closeMedia());
  overlay.addEventListener("click", e => { if (e.target === overlay) closeMedia(); });
  overlay.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.code === "Tab") {
      const fs = [...dialog.querySelectorAll("button,input,select")].filter(n => !n.disabled && !n.hidden && n.getClientRects().length);
      if (!fs.length) return;
      const i = fs.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); fs[fs.length - 1].focus(); }
      else if (!e.shiftKey && (i < 0 || i === fs.length - 1)) { e.preventDefault(); fs[0].focus(); }
    }
  });
  overlay.addEventListener("keyup", e => e.stopPropagation());
  const isTyping = t => t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName);
  addEventListener("keydown", e => {
    if (!mediaOpen) return;
    if (e.code === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); closeMedia(); return; }
    if (isTyping(e.target)) return;
    if (e.code === "Space") { e.preventDefault(); e.stopImmediatePropagation(); playPause(); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); e.stopImmediatePropagation(); seekBy(-10); }
    else if (e.code === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); seekBy(10); }
    else if (e.code === "KeyN") { e.preventDefault(); e.stopImmediatePropagation(); stepMedia(1); }
    else if (e.code === "KeyP") { e.preventDefault(); e.stopImmediatePropagation(); stepMedia(-1); }
  }, true);

  let lastPositionSave = 0;
  for (const type of ["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "volumechange", "ratechange", "ended", "loadeddata"]) video.addEventListener(type, () => {
    if (type === "timeupdate" && Date.now() - lastPositionSave > 2000) { lastPositionSave = Date.now(); saveMediaPosition(); }
    if (type === "ended") endedMedia(); else renderMedia();
  });
  on("songSelected", renderMedia); on("mediaReady", () => { if (mediaOpen) renderMedia(); updateMediaSession(); });
  on("records", renderQueue); on("packsChanged", renderQueue); on("language", () => {
    if (searchNode) searchNode.placeholder = tr("mediaSearch");
    if (progressNode) progressNode.setAttribute("aria-label", tr("mediaSeek"));
    if (mediaOpen) renderMedia();
  });
  on("phase", p => { if (p !== "title" && mediaOpen) closeMedia(false); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && mediaOpen) video.pause(); });

  let pointerTimer = 0;
  powerButton.addEventListener("pointerdown", e => {
    if (e.button !== undefined && e.button !== 0) return;
    clearTimeout(pointerTimer); longPressed = false;
    pointerTimer = setTimeout(() => { longPressed = true; openMedia(); }, HOLD_MS);
  }, true);
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) powerButton.addEventListener(type, () => { clearTimeout(pointerTimer); }, true);
  powerButton.addEventListener("click", e => {
    if (!longPressed) return;
    e.preventDefault(); e.stopImmediatePropagation(); longPressed = false;
  }, true);
  powerButton.addEventListener("contextmenu", e => e.preventDefault());

  installMediaSession();
  return true;
}

/* The TV dock is built by its own DOMContentLoaded callback first. */
addEventListener("DOMContentLoaded", () => {
  if (!buildMedia()) return;
  applyLanguage(settings.language);
});
window.TrkMediaPlayer = { open:openMedia, close:closeMedia, isOpen:mediaActive };
window._trkMediaPlayerOpen = false;
window._trkMediaPlayerMode = false;
})();
/* ✅ media-player-mode.js 完了 */
