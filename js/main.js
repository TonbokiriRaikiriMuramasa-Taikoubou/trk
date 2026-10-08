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
  const slot = bindingSlot;
  if (!code || slot === null) return;
  if (code === "Escape") { bindingSlot = null; setStatus("bindStatus", "cancelBind"); updateKeyUI(); return; }
  const sub = slot >= 2, idx = slot % 2;
  if (sub && code === "Backspace") {
    settings.subKeys[idx] = ""; bindingSlot = null; saveUserPrefs();
    setStatus("bindStatus", "subCleared"); updateKeyUI(); return;
  }
  if (RESERVED.has(code) || (settings.speedKeys || []).includes(code)) { setStatus("bindStatus", "reservedKey"); return; }
  const all = [settings.keys[0], settings.keys[1], settings.subKeys[0], settings.subKeys[1]];
  if (all.some((k, j) => k === code && j !== slot)) { setStatus("bindStatus", "duplicateKey"); return; }
  if (sub) settings.subKeys[idx] = code; else settings.keys[idx] = code;
  bindingSlot = null; saveUserPrefs();
  setStatus("bindStatus", sub ? "assignedSub" : idx ? "assignedRight" : "assignedLeft");
  updateKeyUI(); updateTouchKeys();
}
let menuBinding = null;
function syncMenuKeyUI() {
  const value = $("menuReturnKeyValue"), button = $("menuReturnKeyAssign"), confirmCheck = $("menuReturnConfirmCheck");
  if (value) value.textContent = formatKey(settings.menuKey);
  if (button) button.classList.toggle("listening", menuBinding !== null);
  if (confirmCheck) confirmCheck.checked = settings.menuConfirm !== false;
}
function captureMenuKey(code) {
  if (menuBinding === null) return;
  if (code === "Escape") { menuBinding = null; syncMenuKeyUI(); return; }
  const used = [...(settings.keys || []), ...(settings.subKeys || []), ...(settings.videoKeys || []), settings.menuKey, settings.mediaExitKey];
  if (RESERVED.has(code) || (used.includes(code) && code !== settings.menuKey)) return;
  settings.menuKey = code; menuBinding = null; saveUserPrefs(); syncMenuKeyUI();
}
function requestMenuReturn() {
  if (phase === "title" && screen === "select") return;
  const go = () => { if (typeof toTitle === "function") toTitle(); else if (typeof closeSettings === "function") closeSettings(); };
  if (settings.menuConfirm === false || typeof confirm !== "function") { go(); return; }
  const wasPlaying = phase === "playing";
  if (wasPlaying) pauseGame();
  if (confirm(tr("menuReturnConfirm"))) go();
  else if (wasPlaying) resumeGame();
}

/* ---------- 🧭 チュートリアル（trk!で完了 ＋ スタンプラリー） ----------
   Seed欄に trk! を打ち込んだ瞬間に完了（取り逃しなし・スキップも自由）。
   スタンプは「おまけの実績」で、曲を選ぶ・見た目を変える・1曲遊ぶ・設定を開く＋trk! の
   5つを揃えると、ごほうびスキン「🎓グラデュエーション」が解禁されます（順番自由）。 */
const GUIDE_STAMPS = ["song", "look", "play", "safe", "seed"];
let guideNoteTimer = 0, guideCelebTimer = 0, guideCelebPending = null;
function syncTutorialUI() {
  const g = $("quickGuide");
  g.hidden = settings.tutorialDone === true;
  renderGuideStamps();
}
function maybeAddTrkPlaylist() {
  try {
    if (window.TrkEnsureTrkPlaylist && settings.tutorialDone) {
      const created = window.TrkEnsureTrkPlaylist({ toast: true, go: false });
      if (created) {
        setTimeout(function(){ try { if (window.TrkTrkPlaylistId && typeof renderLib === "function") { settings.libTab = "pl:" + window.TrkTrkPlaylistId; saveUserPrefs(); window.Trk.library.renderLib(); } } catch(_){} }, 900);
      }
    }
    if (window.TrkEnsureTrkClassicPlaylist && settings.tutorialDone) {
      const createdC = window.TrkEnsureTrkClassicPlaylist({ toast: true, go: false });
      if (createdC) {
        setTimeout(function(){ try { if (window.TrkClassicId && typeof renderLib === "function") { settings.libTab = "pl:" + window.TrkClassicId; saveUserPrefs(); window.Trk.library.renderLib(); } } catch(_){} }, 1300);
      }
    }
    if (window.ensureTrkDistributionPlaylists && settings.tutorialDone) {
      try { window.ensureTrkDistributionPlaylists(); } catch(_){}
    }
  } catch(_){}
}
function guideStampsDone() { return GUIDE_STAMPS.every(id => settings.tutorialStamps.includes(id)); }
function renderGuideStamps() {
  const g = $("quickGuide"); if (!g) return;
  const prog = $("guideProgress");
  if (prog) prog.textContent = settings.tutorialDone ? "" : `（${settings.tutorialStamps.length}/${GUIDE_STAMPS.length}）`;
  g.querySelectorAll(".guideStep[data-mission]").forEach(st => {
    st.classList.toggle("stamped", settings.tutorialStamps.includes(st.dataset.mission));
  });
}
function guideNote(key) {   /* ガイドの下に小さく知らせる（2.6秒で消える） */
  const note = $("guideNote"); if (!note) return;
  note.textContent = tr(key);
  note.hidden = false;
  clearTimeout(guideNoteTimer);
  guideNoteTimer = setTimeout(() => { note.hidden = true; }, 2600);
}
function guideStamp(id, messageKey) {   /* スタンプを1つ押す（重複なし・順番自由・スキップ後も集められる） */
  if (!GUIDE_STAMPS.includes(id) || settings.tutorialStamps.includes(id)) return;
  settings.tutorialStamps.push(id);
  saveUserPrefs();
  renderGuideStamps();
  if (messageKey && !settings.tutorialDone) guideNote(messageKey);
  if (guideStampsDone()) unlockRewardSkin();
}
function unlockRewardSkin() {   /* 🎓 5つ揃った！ごほうびスキンを解禁してお祝い */
  if (settings.skinGradUnlocked) return;
  settings.skinGradUnlocked = true;
  saveUserPrefs();
  if (typeof buildSkinGrid === "function") { buildSkinGrid(); if (typeof buildSkinNow === "function") buildSkinNow(); }
  celebrateGuide("guideReward", "guideRewardMsg");
}
/* 🥚 「チュートリアルを即終わらせたい人」がまず打ち込みそうな言葉 → こだわりの消え方で応える */
const GUIDE_EGGS = { skip:"eggSkip", cheat:"eggCheat", "god mode":"eggGod", godmode:"eggGod" };
function guideEggKind(v) {
  const k = String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
  return GUIDE_EGGS[k] || null;
}
function guideEggPlay(kind) {   /* チュートリアルバーを跳ね飛ばす／溶かす／昇天させる */
  const g = $("quickGuide");
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
  if (settings.tutorialDone) return;
  const v = $("seed").value.trim().toLowerCase();
  const egg = guideEggKind(v);
  if (v !== "trk!" && !egg) return;
  settings.tutorialDone = true;
  const unlocked = settings.skinGradUnlocked;
  guideStamp("seed", "");   /* 5つ目なら、ここでごほうび解禁のお祝いが出る */
  saveUserPrefs();
  if (egg) { guideEggPlay(egg); maybeAddTrkPlaylist(); return; }   /* 🥚 演出付きで消える（お祝いポップアップの代わりに一報） */
  syncTutorialUI();
  maybeAddTrkPlaylist();
  if (settings.skinGradUnlocked === unlocked) celebrateGuide("guideDone", guideStampsDone() ? "" : "guideDoneMsg");
}
function celebrateGuide(titleKey, msgKey) {   /* 🎉 お祝いポップアップ（プレイ中なら選曲へ戻ってから） */
  if (phase === "playing" || phase === "paused") { guideCelebPending = [titleKey, msgKey]; return; }
  const box = $("guideCelebrate"); if (!box) return;
  $("guideCelebTitle").textContent = tr(titleKey);
  const msg = $("guideCelebMsg");
  msg.textContent = msgKey ? tr(msgKey) : ""; msg.hidden = !msgKey;
  box.hidden = false;
  box.classList.remove("play"); void box.offsetWidth;   /* アニメを最初からやり直す */
  box.classList.add("play");
  clearTimeout(guideCelebTimer);
  guideCelebTimer = setTimeout(() => { box.hidden = true; box.classList.remove("play"); }, 4500);
}
/* スタンプの検知：曲を選ぶ／1曲遊ぶ／設定を開く */
on("songSelected", () => guideStamp("song", "guideStampSong"));
on("phase", p => {
  if (p === "playing") guideStamp("play", "guideStampPlay");
  if (p === "title" && guideCelebPending) { const c = guideCelebPending; guideCelebPending = null; celebrateGuide(c[0], c[1]); }
});
on("settings", () => guideStamp("safe", "guideStampSafe"));
/* スタンプの検知：見た目を変える（スキンは保存するときだけ・エフェクトは選んだ瞬間） */
{
  const applySkinOrig = applySkin;
  applySkin = (id, persist) => { const r = applySkinOrig(id, persist); if (persist !== false) guideStamp("look", "guideStampLook"); return r; };

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
$("guideDemoBtn").addEventListener("click", async () => {
  const button = $("guideDemoBtn");
  button.disabled = true;
  guideNote("guideDemoLoading");
  try {
    const ready = window.TrkSelectTutorialSong && await window.TrkSelectTutorialSong();
    guideNote(ready ? "guideDemoReady" : "guideDemoUnavailable");
  } catch (_) { guideNote("guideDemoUnavailable"); }
  finally { button.disabled = false; }
});
$("guideSkip").addEventListener("click", () => { settings.tutorialDone = true; saveUserPrefs(); syncTutorialUI(); maybeAddTrkPlaylist(); });
$("tutorialReplayBtn").addEventListener("click", () => {
  settings.tutorialDone = false; saveUserPrefs(); syncTutorialUI();
  const g = $("quickGuide"); if (g) g.open = true;
  if (typeof closeSettings === "function") closeSettings();
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
  if (retryHoldAt || !videoReady || !chart.length) return;
  retryHoldAt = performance.now();
  retryTimer = setTimeout(() => { retryHoldAt = 0; startGame(); }, RETRY_HOLD_MS);
}
function cancelRetryHold() { clearTimeout(retryTimer); retryHoldAt = 0; }
function nudgeLatency(d) {
  settings.latency = Math.max(-300, Math.min(500, settings.latency + d));
  $("latency").value = settings.latency; saveUserPrefs();
  showToast(tr("offsetToast", { n:(settings.latency > 0 ? "+" : "") + settings.latency }));
}

/* ---------- キーボード ---------- */
addEventListener("keydown", e => {
  if (window.Trk.overlay.any()) return;
  const code = keyCodeOf(e);        // 📺 TVリモコン・メディアキーは e.code が空で e.key だけ届く
  if (menuBinding !== null) { e.preventDefault(); captureMenuKey(code); return; }
  if (bindingSlot !== null) { e.preventDefault(); captureKey(code); return; }
  if (phase === "playing") {
    const slot = slotOfKey(code);
    if (slot >= 0) { e.preventDefault(); if (!e.repeat) handleInput(slotLane(slot), e.timeStamp); return; }
  }
  if (phase !== "title") {
    if (e.code === "Backquote") { e.preventDefault(); if (!e.repeat) beginRetryHold(); return; }
    if (e.code === "Minus" || e.code === "Equal") { e.preventDefault(); nudgeLatency(e.code === "Equal" ? 5 : -5); return; }
  }
  const t = e.target;
  const typing = t && (t.tagName === "TEXTAREA" || t.tagName === "SELECT" ||
    (t.tagName === "INPUT" && !["range", "checkbox", "file", "button", "color"].includes(t.type)));
  if (typing) return;
  if (code === settings.menuKey) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) requestMenuReturn(); return; }
  /* 📺 リモコンの「戻る」は機種によって Escape／BrowserBack／GoBack で届く（Backspace は入力欄のため除外） */
  if (code === "KeyP" || code === "Escape" || code === "BrowserBack" || code === "GoBack") {
    if (phase === "playing") { e.preventDefault(); pauseGame(); }
    else if (phase === "paused") { e.preventDefault(); resumeGame(); }
    else if (phase === "title" && screen === "settings" && code === "Escape") { e.preventDefault(); closeSettings(); }
    return;
  }
  if (e.code === "KeyF" && !e.repeat && !e.ctrlKey && !e.metaKey && slotOfKey("KeyF") < 0 && fullscreenSupported) toggleFullscreen();
});
addEventListener("keyup", e => { if (window.Trk.overlay.any()) return; if (e.code === "Backquote") cancelRetryHold(); });
addEventListener("blur", cancelRetryHold);

/* ---------- タッチ操作（MANUAL・TRUCK・ORBITの左右ボタン） ---------- */
document.querySelectorAll("#touchKeys button").forEach(b => {
  const up = () => b.classList.remove("down");
  b.addEventListener("pointerdown", e => {
    e.preventDefault(); b.classList.add("down"); poke();
    handleInput(slotLane(+b.dataset.slot), e.timeStamp);
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => b.addEventListener(type, up));
});
$("touchKeys").addEventListener("contextmenu", e => e.preventDefault());

/* ---------- プレイ中、マウスを動かさなければ操作バーを隠す ---------- */
let idleTimer = 0;
function poke() {
  stage.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => stage.classList.add("idle"), 2200);
}
addEventListener("pointermove", poke);
addEventListener("pointerdown", poke);

/* ---------- 選曲画面 ---------- */
$("language").addEventListener("change", () => { applyLanguage($("language").value); saveUserPrefs(); });
$("mediaFile").addEventListener("change", e => { const fs = Array.from(e.target.files || []); e.target.value = ""; window.Trk.library.addSongFiles(fs); });
/* 🎬 動画を読み込む：映像つきかどうかを確かめてから記録し、そのまま全画面で流す（library.js） */
$("videoFile").addEventListener("change", e => { const fs = Array.from(e.target.files || []); e.target.value = ""; window.Trk.library.addVideoFiles(fs); });
$("openSettingsBtn").addEventListener("click", openSettings);
$("closeSettingsBtn").addEventListener("click", closeSettings);

$("bpm").addEventListener("change", () => {
  const v = Number($("bpm").value);
  if (v >= 60 && v <= 300) { if (!window.Trk.library.saveSongPrefs()) { settings.bpm = v; saveUserPrefs(); } }
  if (videoReady && chartMode === "generated") window.Trk.media.buildChart();
});
$("chartGen").addEventListener("change", () => {
  settings.chartGen = $("chartGen").value === "2" ? "2" : "1"; saveUserPrefs();   // 譜面の作り方は全曲共通の設定
  if (videoReady && chartMode === "generated") window.Trk.media.buildChart();
});
$("offset").addEventListener("change", () => {
  const v = Number($("offset").value);
  if (isFinite(v)) { if (!window.Trk.library.saveSongPrefs()) { settings.offset = Math.max(-5000, Math.min(5000, v)); saveUserPrefs(); } }
  if (videoReady && chartMode === "generated") window.Trk.media.buildChart();
});
let seedTimer = 0;
$("seed").addEventListener("input", () => {
  if (!window.Trk.library.saveSongPrefs()) { settings.seed = $("seed").value.slice(0, 32); saveUserPrefs(); }
  completeTutorialFromSeed();
  refreshSeedSecrets(); syncPickers();
  clearTimeout(seedTimer);
  seedTimer = setTimeout(() => {
    if (videoReady && chartMode === "generated") window.Trk.media.buildChart();
    else if (chart.length) { currentLevel = window.Trk.media.estimateLevel(chart); renderStatus("chartStatus"); }
  }, 300);
});

$("modePicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-playmode]"); if (!b) return;
  settings.playMode = b.dataset.playmode; syncPickers(); saveUserPrefs(); emit("options");
});
$("difficultyPicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-mode]"); if (!b || b.hidden) return;
  settings.difficulty = b.dataset.mode; syncPickers(); saveUserPrefs();
  setStatus("importStatus", null);
  if (videoReady) window.Trk.library.trySongChart().then(ok => { if (!ok) window.Trk.media.buildChart(); });   // パック・フォルダの譜面を優先
});

$("playBtn").addEventListener("click", startGame);
$("importChartBtn").addEventListener("click", () => $("chartImportFile").click());
$("regenerateChartBtn").addEventListener("click", () => { setStatus("importStatus", null); window.Trk.media.buildChart(); });
$("exportSelectBtn").addEventListener("click", () => window.Trk.media.exportChart("importStatus"));
$("chartImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = "";
  if (f && phase === "title") await window.Trk.media.importChartFile(f);
});

/* ---------- 設定画面：見た目 ---------- */
$("layoutPicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-layout]"); if (!b) return;
  settings.layout = b.dataset.layout; syncPickers(); saveUserPrefs();
});
$("videoStyle").addEventListener("change", () => { settings.videoStyle = $("videoStyle").value; view.style.filter = videoFilter(); saveUserPrefs(); });
function showVideoZoom() { $("videoZoomVal").textContent = settings.videoZoom.toFixed(1) + "x"; }
$("videoZoom").addEventListener("input", e => { settings.videoZoom = Number(e.target.value) || 1; showVideoZoom(); saveUserPrefs(); });
$("scroll").addEventListener("input", () => {
  settings.scroll = Number($("scroll").value) || 1;
  $("scrollVal").textContent = settings.scroll.toFixed(1) + "x"; saveUserPrefs();
});
function showFxPower() { $("fxPowerVal").textContent = Math.round(settings.fxPower * 100) + "%"; }
$("fxPower").addEventListener("input", e => { settings.fxPower = Number(e.target.value); showFxPower(); saveUserPrefs(); });
$("gameFxMode").addEventListener("change", e => { settings.gameFxMode = e.target.value; saveUserPrefs(); emit("options"); });
$("hideGameplayUI").addEventListener("change", e => { settings.hideGameplayUI = e.target.checked; saveUserPrefs(); });
$("helpText").addEventListener("change", e => { settings.helpText = e.target.checked; document.body.classList.toggle("helpTextOff", !settings.helpText); saveUserPrefs(); });
$("errorMeter").addEventListener("change", e => { settings.errorMeter = e.target.checked; saveUserPrefs(); });
$("playerMode").addEventListener("change", e => { settings.playerMode = e.target.checked; setPhase(phase); saveUserPrefs(); });

/* ---------- 設定画面：プレイオプション ---------- */
function syncOptionsUI() {
  $("countdown").checked = settings.countdown;
  $("shortMode").value = settings.shortMode;   /* 🕹️ ショートプレイ（後半だけ遊ぶ） */
  $("shortMode").addEventListener("change", e => {
    settings.shortMode = ["off", "90", "120", "180"].includes(e.target.value) ? e.target.value : "off";
    saveUserPrefs();
  });
  $("countdownSE").checked = settings.countdownSE;
  $("resumeCountdown").checked = settings.resumeCountdown;
  $("optHidden").checked = settings.hidden;
  $("optSudden").checked = settings.sudden;
  if ($("optMirror")) $("optMirror").checked = !!settings.modMirror;
  if ($("optRandom")) $("optRandom").checked = !!settings.modRandom;
  if ($("showMasterDiff")) $("showMasterDiff").checked = !!settings.showMasterDiff;
  if ($("swayAllModes")) $("swayAllModes").checked = !!settings.swayAllModes;
  $("rate").value = settings.rate;
  $("rateVal").textContent = settings.rate.toFixed(2) + "x";
  $("cover").value = settings.cover;
  $("coverVal").textContent = Math.round(settings.cover * 100) + "%";
  if ($("gameFxMode")) $("gameFxMode").value = settings.gameFxMode;
  syncPickers();
}
function optionsChanged() { saveUserPrefs(); syncOptionsUI(); emit("options"); }
[["countdown", "countdown"], ["countdownSE", "countdownSE"], ["resumeCountdown", "resumeCountdown"],
 ["optHidden", "hidden"], ["optSudden", "sudden"], ["optMirror", "modMirror"], ["optRandom", "modRandom"],
 ["swayAllModes", "swayAllModes"]].forEach(([id, key]) => {
  const el = $(id);
  if (el) el.addEventListener("change", e => { settings[key] = e.target.checked; optionsChanged(); });
});
const expCheck = $("showMasterDiff");
if (expCheck) {
  expCheck.addEventListener("change", e => {
    settings.showMasterDiff = e.target.checked;
    refreshSeedSecrets();
    optionsChanged();
    if (settings.showMasterDiff && typeof showToast === "function") showToast(tr("expertUnlocked"));
  });
}
const expToggle = $("expertDiffToggle");
if (expToggle) {
  expToggle.addEventListener("click", () => {
    settings.showMasterDiff = !settings.showMasterDiff;
    refreshSeedSecrets();
    optionsChanged();
    if (settings.showMasterDiff && typeof showToast === "function") showToast(tr("expertUnlocked"));
  });
}
$("judgePicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-judge]"); if (!b) return;
  settings.judge = b.dataset.judge; optionsChanged();
});
/* 速度の上限（2.0x／3.0x）は speed.js が設定に合わせて決め直します */
$("rate").addEventListener("input", e => {
  settings.rate = Math.min(3, Math.max(.5, Math.round(Number(e.target.value) * 100) / 100)); optionsChanged();
});
$("cover").addEventListener("input", e => {
  settings.cover = Math.min(.7, Math.max(.2, Number(e.target.value))); optionsChanged();
});

/* ---------- 設定画面：操作 ---------- */
$("reverseHands").addEventListener("change", e => { settings.reverseHands = e.target.checked; updateKeyUI(); updateTouchKeys(); saveUserPrefs(); });
$("menuReturnKeyAssign").addEventListener("click", () => { menuBinding = 0; syncMenuKeyUI(); });
$("menuReturnConfirmCheck").addEventListener("change", e => { settings.menuConfirm = e.target.checked; saveUserPrefs(); });
$("helpText").checked = settings.helpText !== false;
$("helpText").dispatchEvent(new Event("change"));
syncMenuKeyUI();
$("latency").addEventListener("change", () => {
  const v = Number($("latency").value);
  settings.latency = isFinite(v) ? Math.max(-300, Math.min(500, Math.round(v))) : 0;
  $("latency").value = settings.latency; saveUserPrefs();
});
document.querySelectorAll("[data-bind]").forEach(b => b.addEventListener("click", () => {
  bindingSlot = +b.dataset.bind; b.blur();
  setStatus("bindStatus", CAPTURE_KEYS[bindingSlot]); updateKeyUI();
}));
$("keyPresets").addEventListener("click", e => {
  const b = e.target.closest("button[data-keypreset]"); if (!b) return;
  const P = KEY_PRESETS[b.dataset.keypreset]; if (!P) return;
  settings.keys = P.keys.slice(); settings.subKeys = P.sub.slice(); bindingSlot = null;
  saveUserPrefs(); updateKeyUI(); updateTouchKeys();
  setStatus("bindStatus", "keysPresetDone", { name:tr(P.label) });
});

/* ---------- 設定画面：サウンド ---------- */
$("seEnabled").addEventListener("change", e => {
  settings.seEnabled = e.target.checked; saveUserPrefs();
  setStatus("seStatus", settings.seEnabled ? "seOn" : "seOff");
  if (settings.seEnabled) { const ac = window.Trk.media.getAC(); if (ac && ac.state === "suspended") ac.resume(); }
});
$("seVolume").addEventListener("input", e => { settings.seVolume = Number(e.target.value); saveUserPrefs(); });
$("donSeFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; window.Trk.media.loadSE(f, 0); });
$("kaSeFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; window.Trk.media.loadSE(f, 1); });
$("previewDonBtn").addEventListener("click", () => window.Trk.media.playSE(0, true));
$("previewKaBtn").addEventListener("click", () => window.Trk.media.playSE(1, true));
$("volume").addEventListener("input", e => { settings.musicVolume = Number(e.target.value); if (settings.musicVolume > 0) rememberMusicVolume(settings.musicVolume); video.volume = settings.musicVolume; saveUserPrefs(); });

/* ---------- プレイ中・一時停止・リザルト ---------- */
$("pauseBtn").addEventListener("click", pauseGame);
$("fullBtn").addEventListener("click", toggleFullscreen);
$("fullBtnTitle").addEventListener("click", toggleFullscreen);
$("resumeBtn").addEventListener("click", resumeGame);
$("retryBtn").addEventListener("click", startGame);
$("exportPauseBtn").addEventListener("click", () => window.Trk.media.exportChart("pauseStatus"));
$("returnTitleBtn").addEventListener("click", toTitle);
$("replayBtn").addEventListener("click", startGame);
$("exportEndBtn").addEventListener("click", () => window.Trk.media.exportChart("endStatus"));
$("endTitleBtn").addEventListener("click", toTitle);

/* ---------- 再生バー（AUTO中・練習中） ---------- */
const seekBar = $("seekBar");
seekBar.addEventListener("pointerdown", () => { seekDragging = true; });
addEventListener("pointerup", () => { seekDragging = false; });
seekBar.addEventListener("change", () => { seekDragging = false; });
seekBar.addEventListener("input", () => {
  if (videoReady && (phase === "playing" || phase === "paused")) seekTo(seekBar.value / 1000 * video.duration);
});

/* ---------- 動画の合図（イヤホンの再生／停止ボタンにも対応） ----------
   ・カウントダウン中（leadIn）は動画を止めているので、一時停止の合図は無視します
   ・video.paused も確認：プレビューを止めた合図が、ゲーム開始後に遅れて届くことがあるため */
video.addEventListener("ended", () => { if (phase === "playing") endGame(); });
video.addEventListener("pause", () => {
  if (phase === "playing" && !leadIn && video.paused && !video.ended && !video.seeking) pauseGame();
});
video.addEventListener("play", () => { if (phase === "paused") { showScreen(null); setPhase("playing"); poke(); } });
document.addEventListener("visibilitychange", () => { if (document.hidden && phase === "playing") pauseGame(); });

/* ---------- ドラッグ＆ドロップ（.stpack は custom.js、.vrm/.vrma は vrm.js が先に受け取ります） ---------- */
addEventListener("dragover", e => e.preventDefault());
addEventListener("drop", async e => {
  e.preventDefault();
  const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
  if (!files.length || phase !== "title") return;
  const json = files.find(f => /\.json$/i.test(f.name) || f.type === "application/json");
  if (json) { await window.Trk.media.importChartFile(json); return; }
  window.Trk.library.addSongFiles(files);
});

/* ============ 起動 ============ */
$("bpm").value = settings.bpm;
$("offset").value = settings.offset;
$("seed").value = settings.seed;
$("chartGen").value = settings.chartGen;
$("hideGameplayUI").checked = settings.hideGameplayUI;
$("errorMeter").checked = settings.errorMeter;
$("playerMode").checked = settings.playerMode;
$("reverseHands").checked = settings.reverseHands;
$("seEnabled").checked = settings.seEnabled;
$("seVolume").value = settings.seVolume;
$("volume").value = settings.musicVolume;
$("scroll").value = settings.scroll;
$("scrollVal").textContent = settings.scroll.toFixed(1) + "x";
$("latency").value = settings.latency;
$("videoStyle").value = settings.videoStyle;
$("videoZoom").value = settings.videoZoom;
showVideoZoom();
$("fxPower").value = settings.fxPower;
$("gameFxMode").value = settings.gameFxMode;
video.volume = settings.musicVolume;
/* 再生速度を変えても音程を保つ（初期値でもオンですが、念のため） */
video.preservesPitch = true; video.mozPreservesPitch = true; video.webkitPreservesPitch = true;
if (!fullscreenSupported) { $("fullBtn").hidden = true; $("fullBtnTitle").hidden = true; }

applySkin(settings.skin, false);
applyLanguage(settings.language);
syncTutorialUI();
window.Trk.custom.syncNoteUI(); showFxPower(); window.Trk.custom.updateMascotUI(); syncOptionsUI();
setStatus("seStatus", settings.seEnabled ? "seOn" : "seDefault");
setStatus("songPrefsStatus", "songPrefsHint");
setPhase("title");
showScreen("selectScreen");
updateChartButtons();
emit("options");
saveUserPrefs();
requestAnimationFrame(loop);

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
