(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：入力・イベント・初期化 ============
   サブキー・クイックリトライ（` 長押し）・オフセット調整（- / =）・プレイオプション・起動処理
   TRUCK・ORBIT・STAGE・CATCH・再生操作・速度のキーは、それぞれのファイルが先に受け取ります。 */
"use strict";

/* ---------- キー設定（枠：0＝左、1＝右、2＝左サブ、3＝右サブ） ---------- */
const RESERVED = new Set(["KeyP", "Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight", "Backquote", "Minus", "Equal", "Backspace"]);
const CAPTURE_KEYS = ["captureLeft", "captureRight", "captureSubLeft", "captureSubRight"];
function captureKey(code) {
  const slot = window.Trk.core.bindingSlot;
  if (!code || slot === null) return;
  if (code === "Escape") { window.Trk.core.bindingSlot = null; window.Trk.core.setStatus("bindStatus", "cancelBind"); window.Trk.core.updateKeyUI(); return; }
  const sub = slot >= 2, idx = slot % 2;
  if (sub && code === "Backspace") {
    window.Trk.core.settings.subKeys[idx] = ""; window.Trk.core.bindingSlot = null; window.Trk.core.saveUserPrefs();
    window.Trk.core.setStatus("bindStatus", "subCleared"); window.Trk.core.updateKeyUI(); return;
  }
  if (RESERVED.has(code) || (window.Trk.core.settings.speedKeys || []).includes(code)) { window.Trk.core.setStatus("bindStatus", "reservedKey"); return; }
  const all = [window.Trk.core.settings.keys[0], window.Trk.core.settings.keys[1], window.Trk.core.settings.subKeys[0], window.Trk.core.settings.subKeys[1]];
  if (all.some((k, j) => k === code && j !== slot)) { window.Trk.core.setStatus("bindStatus", "duplicateKey"); return; }
  if (sub) window.Trk.core.settings.subKeys[idx] = code; else window.Trk.core.settings.keys[idx] = code;
  window.Trk.core.bindingSlot = null; window.Trk.core.saveUserPrefs();
  window.Trk.core.setStatus("bindStatus", sub ? "assignedSub" : idx ? "assignedRight" : "assignedLeft");
  window.Trk.core.updateKeyUI(); window.Trk.core.updateTouchKeys();
}
let menuBinding = null;
function syncMenuKeyUI() {
  const value = window.Trk.core.$("menuReturnKeyValue"), button = window.Trk.core.$("menuReturnKeyAssign"), confirmCheck = window.Trk.core.$("menuReturnConfirmCheck");
  if (value) value.textContent = window.Trk.core.formatKey(window.Trk.core.settings.menuKey);
  if (button) button.classList.toggle("listening", menuBinding !== null);
  if (confirmCheck) confirmCheck.checked = window.Trk.core.settings.menuConfirm !== false;
}
function captureMenuKey(code) {
  if (menuBinding === null) return;
  if (code === "Escape") { menuBinding = null; syncMenuKeyUI(); return; }
  const used = [...(window.Trk.core.settings.keys || []), ...(window.Trk.core.settings.subKeys || []), ...(window.Trk.core.settings.videoKeys || []), window.Trk.core.settings.menuKey, window.Trk.core.settings.mediaExitKey];
  if (RESERVED.has(code) || (used.includes(code) && code !== window.Trk.core.settings.menuKey)) return;
  window.Trk.core.settings.menuKey = code; menuBinding = null; window.Trk.core.saveUserPrefs(); syncMenuKeyUI();
}
function requestMenuReturn() {
  if (window.Trk.core.phase === "title" && window.Trk.core.screen === "select") return;
  const go = () => { if (typeof toTitle === "function") window.Trk.play.toTitle(); else if (typeof closeSettings === "function") window.Trk.core.closeSettings(); };
  if (window.Trk.core.settings.menuConfirm === false || typeof confirm !== "function") { go(); return; }
  const wasPlaying = window.Trk.core.phase === "playing";
  if (wasPlaying) window.Trk.play.pauseGame();
  if (confirm(tr("menuReturnConfirm"))) go();
  else if (wasPlaying) window.Trk.play.resumeGame();
}

/* ---------- 🧭 チュートリアル（trk!で完了 ＋ スタンプラリー） ----------
   Seed欄に trk! を打ち込んだ瞬間に完了（取り逃しなし・スキップも自由）。
   スタンプは「おまけの実績」で、曲を選ぶ・見た目を変える・1曲遊ぶ・設定を開く＋trk! の
   5つを揃えると、ごほうびスキン「🎓グラデュエーション」が解禁されます（順番自由）。 */
const GUIDE_STAMPS = ["song", "look", "play", "safe", "seed"];
let guideNoteTimer = 0, guideCelebTimer = 0, guideCelebPending = null;
function syncTutorialUI() {
  const g = window.Trk.core.$("quickGuide");
  g.hidden = window.Trk.core.settings.tutorialDone === true;
  renderGuideStamps();
}
function maybeAddTrkPlaylist() {
  try {
    if (window.TrkEnsureTrkPlaylist && window.Trk.core.settings.tutorialDone) {
      const created = window.TrkEnsureTrkPlaylist({ toast: true, go: false });
      if (created) {
        setTimeout(function(){ try { if (window.TrkTrkPlaylistId && typeof renderLib === "function") { window.Trk.core.settings.libTab = "pl:" + window.TrkTrkPlaylistId; window.Trk.core.saveUserPrefs(); window.Trk.library.renderLib(); } } catch(_){} }, 900);
      }
    }
    if (window.TrkEnsureTrkClassicPlaylist && window.Trk.core.settings.tutorialDone) {
      const createdC = window.TrkEnsureTrkClassicPlaylist({ toast: true, go: false });
      if (createdC) {
        setTimeout(function(){ try { if (window.TrkClassicId && typeof renderLib === "function") { window.Trk.core.settings.libTab = "pl:" + window.TrkClassicId; window.Trk.core.saveUserPrefs(); window.Trk.library.renderLib(); } } catch(_){} }, 1300);
      }
    }
    if (window.ensureTrkDistributionPlaylists && window.Trk.core.settings.tutorialDone) {
      try { window.ensureTrkDistributionPlaylists(); } catch(_){}
    }
  } catch(_){}
}
function guideStampsDone() { return GUIDE_STAMPS.every(id => window.Trk.core.settings.tutorialStamps.includes(id)); }
function renderGuideStamps() {
  const g = window.Trk.core.$("quickGuide"); if (!g) return;
  const prog = window.Trk.core.$("guideProgress");
  if (prog) prog.textContent = window.Trk.core.settings.tutorialDone ? "" : `（${window.Trk.core.settings.tutorialStamps.length}/${GUIDE_STAMPS.length}）`;
  g.querySelectorAll(".guideStep[data-mission]").forEach(st => {
    st.classList.toggle("stamped", window.Trk.core.settings.tutorialStamps.includes(st.dataset.mission));
  });
}
function guideNote(key) {   /* ガイドの下に小さく知らせる（2.6秒で消える） */
  const note = window.Trk.core.$("guideNote"); if (!note) return;
  note.textContent = tr(key);
  note.hidden = false;
  clearTimeout(guideNoteTimer);
  guideNoteTimer = setTimeout(() => { note.hidden = true; }, 2600);
}
function guideStamp(id, messageKey) {   /* スタンプを1つ押す（重複なし・順番自由・スキップ後も集められる） */
  if (!GUIDE_STAMPS.includes(id) || window.Trk.core.settings.tutorialStamps.includes(id)) return;
  window.Trk.core.settings.tutorialStamps.push(id);
  window.Trk.core.saveUserPrefs();
  renderGuideStamps();
  if (messageKey && !window.Trk.core.settings.tutorialDone) guideNote(messageKey);
  if (guideStampsDone()) unlockRewardSkin();
}
function unlockRewardSkin() {   /* 🎓 5つ揃った！ごほうびスキンを解禁してお祝い */
  if (window.Trk.core.settings.skinGradUnlocked) return;
  window.Trk.core.settings.skinGradUnlocked = true;
  window.Trk.core.saveUserPrefs();
  if (typeof buildSkinGrid === "function") { window.Trk.core.buildSkinGrid(); if (typeof buildSkinNow === "function") window.Trk.core.buildSkinNow(); }
  celebrateGuide("guideReward", "guideRewardMsg");
}
/* 🥚 「チュートリアルを即終わらせたい人」がまず打ち込みそうな言葉 → こだわりの消え方で応える */
const GUIDE_EGGS = { skip:"eggSkip", cheat:"eggCheat", "god mode":"eggGod", godmode:"eggGod" };
function guideEggKind(v) {
  const k = String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
  return GUIDE_EGGS[k] || null;
}
function guideEggPlay(kind) {   /* チュートリアルバーを跳ね飛ばす／溶かす／昇天させる */
  const g = window.Trk.core.$("quickGuide");
  const finish = () => {
    if (g) g.classList.remove("eggSkip", "eggCheat", "eggGod");
    syncTutorialUI();
    window.Trk.library.plToast(tr({ eggSkip:"guideEggSkip", eggCheat:"guideEggCheat", eggGod:"guideEggGod" }[kind]));
  };
  if (!g) { syncTutorialUI(); return; }
  g.classList.add(kind);
  setTimeout(finish, 2000);   /* 演出が終わってから普通に隠す（進行度もここで更新） */
}
function completeTutorialFromSeed() {   /* Seed欄に trk! → 打ち込んだ瞬間に完了。skip/cheat/god mode はお楽しみ */
  if (window.Trk.core.settings.tutorialDone) return;
  const v = window.Trk.core.$("seed").value.trim().toLowerCase();
  const egg = guideEggKind(v);
  if (v !== "trk!" && !egg) return;
  window.Trk.core.settings.tutorialDone = true;
  const unlocked = window.Trk.core.settings.skinGradUnlocked;
  guideStamp("seed", "");   /* 5つ目なら、ここでごほうび解禁のお祝いが出る */
  window.Trk.core.saveUserPrefs();
  if (egg) { guideEggPlay(egg); maybeAddTrkPlaylist(); return; }   /* 🥚 演出付きで消える（お祝いポップアップの代わりに一報） */
  syncTutorialUI();
  maybeAddTrkPlaylist();
  if (window.Trk.core.settings.skinGradUnlocked === unlocked) celebrateGuide("guideDone", guideStampsDone() ? "" : "guideDoneMsg");
}
function celebrateGuide(titleKey, msgKey) {   /* 🎉 お祝いポップアップ（プレイ中なら選曲へ戻ってから） */
  if (window.Trk.core.phase === "playing" || window.Trk.core.phase === "paused") { guideCelebPending = [titleKey, msgKey]; return; }
  const box = window.Trk.core.$("guideCelebrate"); if (!box) return;
  window.Trk.core.$("guideCelebTitle").textContent = tr(titleKey);
  const msg = window.Trk.core.$("guideCelebMsg");
  msg.textContent = msgKey ? tr(msgKey) : ""; msg.hidden = !msgKey;
  box.hidden = false;
  box.classList.remove("play"); void box.offsetWidth;   /* アニメを最初からやり直す */
  box.classList.add("play");
  clearTimeout(guideCelebTimer);
  guideCelebTimer = setTimeout(() => { box.hidden = true; box.classList.remove("play"); }, 4500);
}
/* スタンプの検知：曲を選ぶ／1曲遊ぶ／設定を開く */
window.Trk.core.on("songSelected", () => guideStamp("song", "guideStampSong"));
window.Trk.core.on("phase", p => {
  if (p === "playing") guideStamp("play", "guideStampPlay");
  if (p === "title" && guideCelebPending) { const c = guideCelebPending; guideCelebPending = null; celebrateGuide(c[0], c[1]); }
});
window.Trk.core.on("settings", () => guideStamp("safe", "guideStampSafe"));
/* スタンプの検知：見た目を変える（スキンは保存するときだけ・エフェクトは選んだ瞬間） */
{
  const applySkinOrig = window.Trk.core.applySkin;
  window.Trk.core.applySkin = (id, persist) => { const r = applySkinOrig(id, persist); if (persist !== false) guideStamp("look", "guideStampLook"); return r; };

  /* TrkFX は fx.js が Object.freeze した公開API。関数を上書きせず、UI操作を委譲で検知する。 */
  document.addEventListener("click", e => {
    const target = e.target;
    if (!target || typeof target.closest !== "function") return;
    const preset = target.closest("#fxPanel .fxGrid .fxSeg button");
    const quickAction = target.closest("#fxQuickPanel .inline .fxMini");
    const dockAction = target.closest("#fxDock .dockSlots .dockKey:not(.empty), #fxDock .dockRand .dockKey, #fxDock .fxFavRow button");
    if (preset || quickAction || dockAction) guideStamp("look", "guideStampLook");
  });
  document.addEventListener("change", e => {
    if (e.target && e.target.matches && e.target.matches("#fxQuickPanel select.fxQuickSelect"))
      guideStamp("look", "guideStampLook");
  });
}
/* スキップ（もう知っている人へ）ともう一度（⚙設定の見た目から） */
window.Trk.core.$("guideDemoBtn").addEventListener("click", async () => {
  const button = window.Trk.core.$("guideDemoBtn");
  button.disabled = true;
  guideNote("guideDemoLoading");
  try {
    const ready = window.TrkSelectTutorialSong && await window.TrkSelectTutorialSong();
    guideNote(ready ? "guideDemoReady" : "guideDemoUnavailable");
  } catch (_) { guideNote("guideDemoUnavailable"); }
  finally { button.disabled = false; }
});
window.Trk.core.$("guideSkip").addEventListener("click", () => { window.Trk.core.settings.tutorialDone = true; window.Trk.core.saveUserPrefs(); syncTutorialUI(); maybeAddTrkPlaylist(); });
window.Trk.core.$("tutorialReplayBtn").addEventListener("click", () => {
  window.Trk.core.settings.tutorialDone = false; window.Trk.core.saveUserPrefs(); syncTutorialUI();
  const g = window.Trk.core.$("quickGuide"); if (g) g.open = true;
  if (typeof closeSettings === "function") window.Trk.core.closeSettings();
});

/* ---------- 全画面 ---------- */
const fullscreenSupported = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    const exit = d.exitFullscreen || d.webkitExitFullscreen;
    if (exit) { const r = exit.call(d); if (r && r.catch) r.catch(() => {}); }
  } else {
    const n = d.documentElement, req = n.requestFullscreen || n.webkitRequestFullscreen;
    if (req) { const r = req.call(n); if (r && r.catch) r.catch(() => {}); }
  }
}

/* ---------- クイックリトライ（` を長押し）・プレイ中のオフセット調整 ---------- */
const RETRY_HOLD_MS = 350;
let retryTimer = 0;
function beginRetryHold() {
  if (window.Trk.play.retryHoldAt || !window.Trk.core.videoReady || !window.Trk.core.chart.length) return;
  window.Trk.play.retryHoldAt = performance.now();
  retryTimer = setTimeout(() => { window.Trk.play.retryHoldAt = 0; window.Trk.play.startGame(); }, RETRY_HOLD_MS);
}
function cancelRetryHold() { clearTimeout(retryTimer); window.Trk.play.retryHoldAt = 0; }
function nudgeLatency(d) {
  window.Trk.core.settings.latency = Math.max(-300, Math.min(500, window.Trk.core.settings.latency + d));
  window.Trk.core.$("latency").value = window.Trk.core.settings.latency; window.Trk.core.saveUserPrefs();
  window.Trk.play.showToast(tr("offsetToast", { n:(window.Trk.core.settings.latency > 0 ? "+" : "") + window.Trk.core.settings.latency }));
}

/* ---------- キーボード ---------- */
addEventListener("keydown", e => {
  if (window.Trk.overlay.any()) return;
  const code = window.Trk.core.keyCodeOf(e);        // 📺 TVリモコン・メディアキーは e.code が空で e.key だけ届く
  if (menuBinding !== null) { e.preventDefault(); captureMenuKey(code); return; }
  if (window.Trk.core.bindingSlot !== null) { e.preventDefault(); captureKey(code); return; }
  if (window.Trk.core.phase === "playing") {
    const slot = window.Trk.core.slotOfKey(code);
    if (slot >= 0) { e.preventDefault(); if (!e.repeat) window.Trk.play.handleInput(window.Trk.core.slotLane(slot), e.timeStamp); return; }
  }
  if (window.Trk.core.phase !== "title") {
    if (e.code === "Backquote") { e.preventDefault(); if (!e.repeat) beginRetryHold(); return; }
    if (e.code === "Minus" || e.code === "Equal") { e.preventDefault(); nudgeLatency(e.code === "Equal" ? 5 : -5); return; }
  }
  const t = e.target;
  const typing = t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" ||
    (t.tagName === "INPUT" && !["range", "checkbox", "file", "button", "color"].includes(t.type)));
  if (typing) return;
  if (code === window.Trk.core.settings.menuKey) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) requestMenuReturn(); return; }
  /* 📺 リモコンの「戻る」は機種によって Escape／BrowserBack／GoBack で届く（Backspace は入力欄のため除外） */
  if (code === "KeyP" || code === "Escape" || code === "BrowserBack" || code === "GoBack") {
    if (window.Trk.core.phase === "playing") { e.preventDefault(); window.Trk.play.pauseGame(); }
    else if (window.Trk.core.phase === "paused") { e.preventDefault(); window.Trk.play.resumeGame(); }
    else if (window.Trk.core.phase === "title" && window.Trk.core.screen === "settings" && code === "Escape") { e.preventDefault(); window.Trk.core.closeSettings(); }
    return;
  }
  if (e.code === "KeyF" && !e.repeat && !e.ctrlKey && !e.metaKey && window.Trk.core.slotOfKey("KeyF") < 0 && fullscreenSupported) toggleFullscreen();
});
addEventListener("keyup", e => { if (window.Trk.overlay.any()) return; if (e.code === "Backquote") cancelRetryHold(); });
addEventListener("blur", cancelRetryHold);

/* ---------- タッチ操作（MANUAL・TRUCK・ORBITの左右ボタン） ---------- */
document.querySelectorAll("#touchKeys button").forEach(b => {
  const up = () => b.classList.remove("down");
  b.addEventListener("pointerdown", e => {
    e.preventDefault(); b.classList.add("down"); poke();
    window.Trk.play.handleInput(window.Trk.core.slotLane(+b.dataset.slot), e.timeStamp);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => b.addEventListener(type, up));
});
window.Trk.core.$("touchKeys").addEventListener("contextmenu", e => e.preventDefault());

/* ---------- プレイ中、マウスを動かさなければ操作バーを隠す ---------- */
let idleTimer = 0;
function poke() {
  window.Trk.core.stage.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => window.Trk.core.stage.classList.add("idle"), 2200);
}
addEventListener("pointermove", poke);
addEventListener("pointerdown", poke);

/* ---------- 選曲画面 ---------- */
window.Trk.core.$("language").addEventListener("change", () => { window.Trk.core.applyLanguage(window.Trk.core.$("language").value); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("mediaFile").addEventListener("change", e => { const fs = Array.from(e.target.files || []); e.target.value = ""; window.Trk.library.addSongFiles(fs); });
/* 🎬 動画を読み込む：映像つきかどうかを確かめてから記録し、そのまま全画面で流す（library.js） */
window.Trk.core.$("videoFile").addEventListener("change", e => { const fs = Array.from(e.target.files || []); e.target.value = ""; window.Trk.library.addVideoFiles(fs); });
window.Trk.core.$("openSettingsBtn").addEventListener("click", window.Trk.core.openSettings);
window.Trk.core.$("closeSettingsBtn").addEventListener("click", window.Trk.core.closeSettings);

window.Trk.core.$("bpm").addEventListener("change", () => {
  const v = Number(window.Trk.core.$("bpm").value);
  if (v >= 60 && v <= 300) { if (!window.Trk.library.saveSongPrefs()) { window.Trk.core.settings.bpm = v; window.Trk.core.saveUserPrefs(); } }
  if (window.Trk.core.videoReady && window.Trk.core.chartMode === "generated") window.Trk.media.buildChart();
});
window.Trk.core.$("chartGen").addEventListener("change", () => {
  window.Trk.core.settings.chartGen = window.Trk.core.$("chartGen").value === "2" ? "2" : "1"; window.Trk.core.saveUserPrefs();   // 譜面の作り方は全曲共通の設定
  if (window.Trk.core.videoReady && window.Trk.core.chartMode === "generated") window.Trk.media.buildChart();
});
window.Trk.core.$("offset").addEventListener("change", () => {
  const v = Number(window.Trk.core.$("offset").value);
  if (isFinite(v)) { if (!window.Trk.library.saveSongPrefs()) { window.Trk.core.settings.offset = Math.max(-5000, Math.min(5000, v)); window.Trk.core.saveUserPrefs(); } }
  if (window.Trk.core.videoReady && window.Trk.core.chartMode === "generated") window.Trk.media.buildChart();
});
let seedTimer = 0;
window.Trk.core.$("seed").addEventListener("input", () => {
  if (!window.Trk.library.saveSongPrefs()) { window.Trk.core.settings.seed = window.Trk.core.$("seed").value.slice(0, 32); window.Trk.core.saveUserPrefs(); }
  completeTutorialFromSeed();
  window.Trk.core.refreshSeedSecrets(); window.Trk.core.syncPickers();
  clearTimeout(seedTimer);
  seedTimer = setTimeout(() => {
    if (window.Trk.core.videoReady && window.Trk.core.chartMode === "generated") window.Trk.media.buildChart();
    else if (window.Trk.core.chart.length) { window.Trk.core.currentLevel = window.Trk.media.estimateLevel(window.Trk.core.chart); window.Trk.core.renderStatus("chartStatus"); }
  }, 300);
});

window.Trk.core.$("modePicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-playmode]"); if (!b) return;
  window.Trk.core.settings.playMode = b.dataset.playmode; window.Trk.core.syncPickers(); window.Trk.core.saveUserPrefs(); window.Trk.core.emit("options");
});
window.Trk.core.$("difficultyPicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-mode]"); if (!b || b.hidden) return;
  window.Trk.core.settings.difficulty = b.dataset.mode; window.Trk.core.syncPickers(); window.Trk.core.saveUserPrefs();
  window.Trk.core.setStatus("importStatus", null);
  if (window.Trk.core.videoReady) window.Trk.library.trySongChart().then(ok => { if (!ok) window.Trk.media.buildChart(); });   // パック・フォルダの譜面を優先
});

window.Trk.core.$("playBtn").addEventListener("click", window.Trk.play.startGame);
window.Trk.core.$("importChartBtn").addEventListener("click", () => window.Trk.core.$("chartImportFile").click());
window.Trk.core.$("regenerateChartBtn").addEventListener("click", () => { window.Trk.core.setStatus("importStatus", null); window.Trk.media.buildChart(); });
window.Trk.core.$("exportSelectBtn").addEventListener("click", () => window.Trk.media.exportChart("importStatus"));
window.Trk.core.$("chartImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = "";
  if (f && window.Trk.core.phase === "title") await window.Trk.media.importChartFile(f);
});

/* ---------- 設定画面：見た目 ---------- */
window.Trk.core.$("layoutPicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-layout]"); if (!b) return;
  window.Trk.core.settings.layout = b.dataset.layout; window.Trk.core.syncPickers(); window.Trk.core.saveUserPrefs();
});
window.Trk.core.$("videoStyle").addEventListener("change", () => { window.Trk.core.settings.videoStyle = window.Trk.core.$("videoStyle").value; window.Trk.core.view.style.filter = window.Trk.core.videoFilter(); window.Trk.core.saveUserPrefs(); });
function showVideoZoom() { window.Trk.core.$("videoZoomVal").textContent = window.Trk.core.settings.videoZoom.toFixed(1) + "x"; }
window.Trk.core.$("videoZoom").addEventListener("input", e => { window.Trk.core.settings.videoZoom = Number(e.target.value) || 1; showVideoZoom(); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("scroll").addEventListener("input", () => {
  window.Trk.core.settings.scroll = Number(window.Trk.core.$("scroll").value) || 1;
  window.Trk.core.$("scrollVal").textContent = window.Trk.core.settings.scroll.toFixed(1) + "x"; window.Trk.core.saveUserPrefs();
});
function showFxPower() { window.Trk.core.$("fxPowerVal").textContent = Math.round(window.Trk.core.settings.fxPower * 100) + "%"; }
window.Trk.core.$("fxPower").addEventListener("input", e => { window.Trk.core.settings.fxPower = Number(e.target.value); showFxPower(); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("gameFxMode").addEventListener("change", e => { window.Trk.core.settings.gameFxMode = e.target.value; window.Trk.core.saveUserPrefs(); window.Trk.core.emit("options"); });
window.Trk.core.$("hideGameplayUI").addEventListener("change", e => { window.Trk.core.settings.hideGameplayUI = e.target.checked; window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("helpText").addEventListener("change", e => { window.Trk.core.settings.helpText = e.target.checked; document.body.classList.toggle("helpTextOff", !window.Trk.core.settings.helpText); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("errorMeter").addEventListener("change", e => { window.Trk.core.settings.errorMeter = e.target.checked; window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("playerMode").addEventListener("change", e => { window.Trk.core.settings.playerMode = e.target.checked; window.Trk.core.setPhase(window.Trk.core.phase); window.Trk.core.saveUserPrefs(); });

/* ---------- 設定画面：プレイオプション ---------- */
function syncOptionsUI() {
  window.Trk.core.$("countdown").checked = window.Trk.core.settings.countdown;
  window.Trk.core.$("shortMode").value = window.Trk.core.settings.shortMode;   /* 🕹️ ショートプレイ（後半だけ遊ぶ） */
  window.Trk.core.$("shortMode").addEventListener("change", e => {
    window.Trk.core.settings.shortMode = ["off", "90", "120", "180"].includes(e.target.value) ? e.target.value : "off";
    window.Trk.core.saveUserPrefs();
  });
  window.Trk.core.$("countdownSE").checked = window.Trk.core.settings.countdownSE;
  window.Trk.core.$("resumeCountdown").checked = window.Trk.core.settings.resumeCountdown;
  window.Trk.core.$("optHidden").checked = window.Trk.core.settings.hidden;
  window.Trk.core.$("optSudden").checked = window.Trk.core.settings.sudden;
  if (window.Trk.core.$("optMirror")) window.Trk.core.$("optMirror").checked = !!window.Trk.core.settings.modMirror;
  if (window.Trk.core.$("optRandom")) window.Trk.core.$("optRandom").checked = !!window.Trk.core.settings.modRandom;
  if (window.Trk.core.$("showMasterDiff")) window.Trk.core.$("showMasterDiff").checked = !!window.Trk.core.settings.showMasterDiff;
  if (window.Trk.core.$("swayAllModes")) window.Trk.core.$("swayAllModes").checked = !!window.Trk.core.settings.swayAllModes;
  window.Trk.core.$("rate").value = window.Trk.core.settings.rate;
  window.Trk.core.$("rateVal").textContent = window.Trk.core.settings.rate.toFixed(2) + "x";
  window.Trk.core.$("cover").value = window.Trk.core.settings.cover;
  window.Trk.core.$("coverVal").textContent = Math.round(window.Trk.core.settings.cover * 100) + "%";
  if (window.Trk.core.$("gameFxMode")) window.Trk.core.$("gameFxMode").value = window.Trk.core.settings.gameFxMode;
  window.Trk.core.syncPickers();
}
function optionsChanged() { window.Trk.core.saveUserPrefs(); syncOptionsUI(); window.Trk.core.emit("options"); }
[["countdown", "countdown"], ["countdownSE", "countdownSE"], ["resumeCountdown", "resumeCountdown"],
 ["optHidden", "hidden"], ["optSudden", "sudden"], ["optMirror", "modMirror"], ["optRandom", "modRandom"],
 ["swayAllModes", "swayAllModes"]].forEach(([id, key]) => {
  const el = window.Trk.core.$(id);
  if (el) el.addEventListener("change", e => { window.Trk.core.settings[key] = e.target.checked; optionsChanged(); });
});
const expCheck = window.Trk.core.$("showMasterDiff");
if (expCheck) {
  expCheck.addEventListener("change", e => {
    window.Trk.core.settings.showMasterDiff = e.target.checked;
    window.Trk.core.refreshSeedSecrets();
    optionsChanged();
    if (window.Trk.core.settings.showMasterDiff && typeof showToast === "function") window.Trk.play.showToast(tr("expertUnlocked"));
  });
}
const expToggle = window.Trk.core.$("expertDiffToggle");
if (expToggle) {
  expToggle.addEventListener("click", () => {
    window.Trk.core.settings.showMasterDiff = !window.Trk.core.settings.showMasterDiff;
    window.Trk.core.refreshSeedSecrets();
    optionsChanged();
    if (window.Trk.core.settings.showMasterDiff && typeof showToast === "function") window.Trk.play.showToast(tr("expertUnlocked"));
  });
}
window.Trk.core.$("judgePicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-judge]"); if (!b) return;
  window.Trk.core.settings.judge = b.dataset.judge; optionsChanged();
});
/* 速度の上限（2.0x／3.0x）は speed.js が設定に合わせて決め直します */
window.Trk.core.$("rate").addEventListener("input", e => {
  window.Trk.core.settings.rate = Math.min(3, Math.max(.5, Math.round(Number(e.target.value) * 100) / 100)); optionsChanged();
});
window.Trk.core.$("cover").addEventListener("input", e => {
  window.Trk.core.settings.cover = Math.min(.7, Math.max(.2, Number(e.target.value))); optionsChanged();
});

/* ---------- 設定画面：操作 ---------- */
window.Trk.core.$("reverseHands").addEventListener("change", e => { window.Trk.core.settings.reverseHands = e.target.checked; window.Trk.core.updateKeyUI(); window.Trk.core.updateTouchKeys(); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("menuReturnKeyAssign").addEventListener("click", () => { menuBinding = 0; syncMenuKeyUI(); });
window.Trk.core.$("menuReturnConfirmCheck").addEventListener("change", e => { window.Trk.core.settings.menuConfirm = e.target.checked; window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("helpText").checked = window.Trk.core.settings.helpText !== false;
window.Trk.core.$("helpText").dispatchEvent(new Event("change"));
syncMenuKeyUI();
window.Trk.core.$("latency").addEventListener("change", () => {
  const v = Number(window.Trk.core.$("latency").value);
  window.Trk.core.settings.latency = isFinite(v) ? Math.max(-300, Math.min(500, Math.round(v))) : 0;
  window.Trk.core.$("latency").value = window.Trk.core.settings.latency; window.Trk.core.saveUserPrefs();
});
document.querySelectorAll("[data-bind]").forEach(b => b.addEventListener("click", () => {
  window.Trk.core.bindingSlot = +b.dataset.bind; b.blur();
  window.Trk.core.setStatus("bindStatus", CAPTURE_KEYS[window.Trk.core.bindingSlot]); window.Trk.core.updateKeyUI();
}));
window.Trk.core.$("keyPresets").addEventListener("click", e => {
  const b = e.target.closest("button[data-keypreset]"); if (!b) return;
  const P = window.Trk.core.KEY_PRESETS[b.dataset.keypreset]; if (!P) return;
  window.Trk.core.settings.keys = P.keys.slice(); window.Trk.core.settings.subKeys = P.sub.slice(); window.Trk.core.bindingSlot = null;
  window.Trk.core.saveUserPrefs(); window.Trk.core.updateKeyUI(); window.Trk.core.updateTouchKeys();
  window.Trk.core.setStatus("bindStatus", "keysPresetDone", { name:tr(P.label) });
});

/* ---------- 設定画面：サウンド ---------- */
window.Trk.core.$("seEnabled").addEventListener("change", e => {
  window.Trk.core.settings.seEnabled = e.target.checked; window.Trk.core.saveUserPrefs();
  window.Trk.core.setStatus("seStatus", window.Trk.core.settings.seEnabled ? "seOn" : "seOff");
  if (window.Trk.core.settings.seEnabled) { const ac = window.Trk.media.getAC(); if (ac && ac.state === "suspended") ac.resume(); }
});
window.Trk.core.$("seVolume").addEventListener("input", e => { window.Trk.core.settings.seVolume = Number(e.target.value); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("donSeFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; window.Trk.media.loadSE(f, 0); });
window.Trk.core.$("kaSeFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; window.Trk.media.loadSE(f, 1); });
window.Trk.core.$("previewDonBtn").addEventListener("click", () => window.Trk.media.playSE(0, true));
window.Trk.core.$("previewKaBtn").addEventListener("click", () => window.Trk.media.playSE(1, true));
window.Trk.core.$("volume").addEventListener("input", e => { window.Trk.core.settings.musicVolume = Number(e.target.value); if (window.Trk.core.settings.musicVolume > 0) window.Trk.core.rememberMusicVolume(window.Trk.core.settings.musicVolume); window.Trk.core.video.volume = window.Trk.core.settings.musicVolume; window.Trk.core.saveUserPrefs(); });

/* ---------- プレイ中・一時停止・リザルト ---------- */
window.Trk.core.$("pauseBtn").addEventListener("click", window.Trk.play.pauseGame);
window.Trk.core.$("fullBtn").addEventListener("click", toggleFullscreen);
window.Trk.core.$("fullBtnTitle").addEventListener("click", toggleFullscreen);
window.Trk.core.$("resumeBtn").addEventListener("click", window.Trk.play.resumeGame);
window.Trk.core.$("retryBtn").addEventListener("click", window.Trk.play.startGame);
window.Trk.core.$("exportPauseBtn").addEventListener("click", () => window.Trk.media.exportChart("pauseStatus"));
window.Trk.core.$("returnTitleBtn").addEventListener("click", window.Trk.play.toTitle);
window.Trk.core.$("replayBtn").addEventListener("click", window.Trk.play.startGame);
window.Trk.core.$("exportEndBtn").addEventListener("click", () => window.Trk.media.exportChart("endStatus"));
window.Trk.core.$("endTitleBtn").addEventListener("click", window.Trk.play.toTitle);

/* ---------- 再生バー（AUTO中・練習中） ---------- */
const seekBar = window.Trk.core.$("seekBar");
seekBar.addEventListener("pointerdown", () => { window.Trk.core.seekDragging = true; });
addEventListener("pointerup", () => { window.Trk.core.seekDragging = false; });
seekBar.addEventListener("change", () => { window.Trk.core.seekDragging = false; });
seekBar.addEventListener("input", () => {
  if (window.Trk.core.videoReady && (window.Trk.core.phase === "playing" || window.Trk.core.phase === "paused")) window.Trk.play.seekTo(seekBar.value / 1000 * window.Trk.core.video.duration);
});

/* ---------- 動画の合図（イヤホンの再生／停止ボタンにも対応） ----------
   ・カウントダウン中（leadIn）は動画を止めているので、一時停止の合図は無視します
   ・video.paused も確認：プレビューを止めた合図が、ゲーム開始後に遅れて届くことがあるため */
window.Trk.core.video.addEventListener("ended", () => { if (window.Trk.core.phase === "playing") window.Trk.play.endGame(); });
window.Trk.core.video.addEventListener("pause", () => {
  if (window.Trk.core.phase === "playing" && !window.Trk.play.leadIn && window.Trk.core.video.paused && !window.Trk.core.video.ended && !window.Trk.core.video.seeking) window.Trk.play.pauseGame();
});
window.Trk.core.video.addEventListener("play", () => { if (window.Trk.core.phase === "paused") { window.Trk.core.showScreen(null); window.Trk.core.setPhase("playing"); poke(); } });
document.addEventListener("visibilitychange", () => { if (document.hidden && window.Trk.core.phase === "playing") window.Trk.play.pauseGame(); });

/* ---------- ドラッグ＆ドロップ（.stpack は custom.js、.vrm/.vrma は vrm.js が先に受け取ります） ---------- */
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", async e => {
  e.preventDefault();
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
  if (!files.length || window.Trk.core.phase !== "title") return;
  const json = files.find(f => /\.json$/i.test(f.name) || f.type === "application/json");
  if (json) { await window.Trk.media.importChartFile(json); return; }
  window.Trk.library.addSongFiles(files);
});

/* ============ 起動 ============ */
window.Trk.core.$("bpm").value = window.Trk.core.settings.bpm;
window.Trk.core.$("offset").value = window.Trk.core.settings.offset;
window.Trk.core.$("seed").value = window.Trk.core.settings.seed;
window.Trk.core.$("chartGen").value = window.Trk.core.settings.chartGen;
window.Trk.core.$("hideGameplayUI").checked = window.Trk.core.settings.hideGameplayUI;
window.Trk.core.$("errorMeter").checked = window.Trk.core.settings.errorMeter;
window.Trk.core.$("playerMode").checked = window.Trk.core.settings.playerMode;
window.Trk.core.$("reverseHands").checked = window.Trk.core.settings.reverseHands;
window.Trk.core.$("seEnabled").checked = window.Trk.core.settings.seEnabled;
window.Trk.core.$("seVolume").value = window.Trk.core.settings.seVolume;
window.Trk.core.$("volume").value = window.Trk.core.settings.musicVolume;
window.Trk.core.$("scroll").value = window.Trk.core.settings.scroll;
window.Trk.core.$("scrollVal").textContent = window.Trk.core.settings.scroll.toFixed(1) + "x";
window.Trk.core.$("latency").value = window.Trk.core.settings.latency;
window.Trk.core.$("videoStyle").value = window.Trk.core.settings.videoStyle;
window.Trk.core.$("videoZoom").value = window.Trk.core.settings.videoZoom;
showVideoZoom();
window.Trk.core.$("fxPower").value = window.Trk.core.settings.fxPower;
window.Trk.core.$("gameFxMode").value = window.Trk.core.settings.gameFxMode;
window.Trk.core.video.volume = window.Trk.core.settings.musicVolume;
/* 再生速度を変えても音程を保つ（初期値でもオンですが、念のため） */
window.Trk.core.video.preservesPitch = true; window.Trk.core.video.mozPreservesPitch = true; window.Trk.core.video.webkitPreservesPitch = true;
if (!fullscreenSupported) { window.Trk.core.$("fullBtn").hidden = true; window.Trk.core.$("fullBtnTitle").hidden = true; }

window.Trk.core.applySkin(window.Trk.core.settings.skin, false);
window.Trk.core.applyLanguage(window.Trk.core.settings.language);
syncTutorialUI();
window.Trk.custom.syncNoteUI(); showFxPower(); window.Trk.custom.updateMascotUI(); syncOptionsUI();
window.Trk.core.setStatus("seStatus", window.Trk.core.settings.seEnabled ? "seOn" : "seDefault");
window.Trk.core.setStatus("songPrefsStatus", "songPrefsHint");
window.Trk.core.setPhase("title");
window.Trk.core.showScreen("selectScreen");
window.Trk.core.updateChartButtons();
window.Trk.core.emit("options");
window.Trk.core.saveUserPrefs();
requestAnimationFrame(window.Trk.play.loop);

/* パックを戻してから曲リストを作る（vrm.js も packsReady を待ちます） */
const packsReady = window.Trk.custom.initPacks().catch(e => console.error(e));
packsReady.then(() => window.Trk.library.initLibrary()).catch(e => console.error(e));

/* PWA：オフラインでも開けるようにする（HTTPS か localhost のときだけ）。
   キャッシュの整理は sw.js が trk- で始まる名前だけを消すので、ほかのサイトに影響しません。 */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js", { scope: "./" })
    .catch(() => { /* オフライン用のキャッシュが無くても、ゲームはそのまま遊べます */ });
}
/* ✅ main.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.RESERVED = RESERVED;
Object.defineProperty(window, "idleTimer", { configurable:true, get:() => idleTimer, set:v => { idleTimer = v; } });
window.packsReady = packsReady;
window.poke = poke;
window.showFxPower = showFxPower;
window.syncOptionsUI = syncOptionsUI;
/* 領域（window.Trk.main）：公開名の正規の場所。旧名（window.X）は別名として残す（利用者の決定） */
window.Trk = window.Trk || {};
window.Trk.main = Object.assign(window.Trk.main || {}, { RESERVED, packsReady, poke, showFxPower, syncOptionsUI });
Object.defineProperty(window.Trk.main, "idleTimer", { configurable:true, get:() => idleTimer, set:v => { idleTimer = v; } });
})();
