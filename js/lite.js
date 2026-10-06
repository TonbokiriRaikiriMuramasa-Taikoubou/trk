// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 🪶 軽量化（スマホ・タブレット・アプリ「PWA／APK」向け） ============
   ・設定（⚙）の右下「🪶 軽量化（スマホ向け）」の欄から操作します。保存先はいつもの
     `shadow_taiko_preferences_v2`（settings.liteMode／liteFps／liteMascot／liteScale／
     liteSpectrumOff／liteFx／liteBlur／liteSeen）。localStorage のキーは増やしません。
   ・liteMode="auto" のときは、端末（モバイル判定・コア数・メモリ・省データ設定・電池・
     動きを減らす設定）を見て、必要そうなときだけ働きます。
   ・軽くする方法は「rAFは今までどおり回したまま、描く回数・描く大きさを減らす」だけです。
     ゲームの判定と時計（tickClock／gameTime＝音声の時計）は毎フレーム動くので、
     フレームレートを下げても判定はずれません。
   ・?safe=1 では何も変えません（セーフモードは元から映像を止めています）。        */
"use strict";

/* ---------- 端末の判定（判定は読み取りだけ。送信はしません） ---------- */
const liteInfo = { mobile:false, standalone:false, cores:0, mem:0, saveData:false, reduced:false, battery:null, batteryLow:false };
function liteMM(q) { try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (_) { return false; } }
function liteNative() {
  try {
    const C = window.Capacitor;
    return !!(C && ((C.isNativePlatform && C.isNativePlatform()) || C.platform === "android" || C.platform === "ios"));
  } catch (_) { return false; }
}
function liteProbe() {
  const ua = String((typeof navigator !== "undefined" && navigator.userAgent) || "");
  const coarse = liteMM("(pointer:coarse)") || liteMM("(hover:none)");
  liteInfo.mobile = coarse || /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|Windows Phone/i.test(ua);
  liteInfo.standalone = liteMM("(display-mode:standalone)") || liteMM("(display-mode:fullscreen)") ||
    liteMM("(display-mode:minimal-ui)") || (typeof navigator !== "undefined" && navigator.standalone === true) || liteNative();
  liteInfo.cores = Math.max(0, Number(typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 0);
  liteInfo.mem = Math.max(0, Number(typeof navigator !== "undefined" && navigator.deviceMemory) || 0);
  liteInfo.saveData = !!(typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData);
  liteInfo.reduced = liteMM("(prefers-reduced-motion: reduce)");
  return liteInfo;
}
/* 電池：取れるブラウザ（Chrome系・Android）だけ。取れなければ「不明」のまま */
function liteBatteryProbe() {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const get = nav && (nav.getBattery || nav.battery);
  if (!get) return;
  Promise.resolve(get.call(nav)).then(battery => {
    if (!battery) return;
    const update = () => {
      liteInfo.battery = battery;
      liteInfo.batteryLow = !battery.charging && Number(battery.level) <= 0.2;
      liteSyncUI();
    };
    update();
    try { battery.addEventListener("levelchange", update); battery.addEventListener("chargingchange", update); } catch (_) {}
  }).catch(() => {});
}
const liteLowEnd = () => (liteInfo.cores > 0 && liteInfo.cores <= 4) || (liteInfo.mem > 0 && liteInfo.mem <= 2);
/* セーフモード（?safe=1）では、初回の案内は出さない（軽量化そのものは働きます） */
const liteSafe = () => { try { return typeof window.TrkSafeMode === "function" && window.TrkSafeMode(); } catch (_) { return false; } };
const liteModeValue = () => (settings.liteMode === "on" ? "on" : settings.liteMode === "off" ? "off" : "auto");
/* 自動でオンにする理由（1つでもあれば働く。どの理由も端末の外へは出しません） */
function liteAutoReasons() {
  const out = [];
  if (liteInfo.saveData) out.push("liteWhySaveData");
  if (liteInfo.batteryLow) out.push("liteWhyBattery");
  if (liteInfo.reduced) out.push("liteWhyMotion");
  if (liteInfo.mobile && liteLowEnd()) out.push("liteWhyLow");
  return out;
}
function liteActive() {
  const mode = liteModeValue();
  if (mode === "on") return true;
  if (mode === "off") return false;
  return liteAutoReasons().length > 0;
}
/* 画面に出す「なぜ」の一覧（翻訳ずみの文字列） */
function liteReasons() {
  const mode = liteModeValue();
  if (mode === "on") return [tr("liteWhyManual")];
  if (mode === "off") return [tr("liteWhyOff")];
  const on = liteAutoReasons();
  if (on.length) return on.map(tr);
  return [liteInfo.mobile ? tr("liteWhyAutoOff") : tr("liteWhyDesktop")];
}

/* ---------- ゲート（描く回数・描く大きさ） ---------- */
const liteGates = Object.create(null);
const liteFpsValue = () => ({ "60":60, "30":30, "20":20 }[settings.liteFps] || 30);
const liteMascotFpsValue = () => ({ "60":60, "30":30, "15":15 }[settings.liteMascot] || 30);
const liteScaleValue = () => (settings.liteScale === "1" ? 1 : settings.liteScale === "1.5" ? 1.5 : 0);
function liteGate(key, fps, now) {
  if (fps >= 60) return true;                        // 60fps上限＝実質いままでどおり
  const t = typeof now === "number" ? now : performance.now();
  const iv = 1000 / fps, prev = liteGates[key] || 0;
  if (t - prev < iv - 1.5) return false;             // 60Hzの画面でも目標のfpsに届くように少しだけ緩める
  liteGates[key] = t;
  return true;
}
/* 🎮 ゲーム・📊 スペクトラム・🎬 映像などの描画（呼ぶ側は「描く直前に false なら戻る」だけ） */
function liteAllow(key, now) { return !liteActive() || liteGate(key, liteFpsValue(), now); }
/* 🎯 ゲーム中（ノーツ・映像・エフェクト）の描画：ゲーム優先のときは上限をかけない。
   判定と反応はもともと軽量化の影響を受けません（音声の時計で判定するため） */
function liteAllowGame(now) {
  if (!liteActive() || settings.liteGameFull === true) return true;
  return liteGate("game", liteFpsValue(), now);
}
/* 🩷 3Dマスコット（MMD／VRM）：描画レートを下げる／「描画しない」 */
const liteNoMascot = id => liteActive() && settings.liteMascot === "off" && (id === "mmd" || id === "vrm");
function liteMascotAllow(id, now) { return !liteNoMascot(id) && (!liteActive() || liteGate("mascot:" + id, liteMascotFpsValue(), now)); }
/* 📊 軽量化モード中はスペクトラム（アナライザー）を止める */
const liteSpecBlocked = () => liteActive() && settings.liteSpectrumOff !== false;
/* 🎬 軽量化モード中は映像のぼかしを最大2pxに（スマホのGPUでいちばん重いところ） */
const liteBlurCap = () => (liteActive() && settings.liteBlur !== false ? 2 : 0);
/* 🖼 描画解像度：端末のdevicePixelRatioに、軽量化モードの上限をかける */
function litePixelRatio(max) {
  const raw = Math.min(Number(max) || 2, typeof devicePixelRatio === "number" && devicePixelRatio > 0 ? devicePixelRatio : 1);
  const cap = liteActive() ? liteScaleValue() : 0;
  return cap ? Math.min(raw, cap) : raw;
}

/* ---------- プリセット（大まかな設定。下の項目をまとめて変えます） ----------
   ・「カスタム」はここでは何も変えません（下の項目で調整した状態）              */
const LITE_PRESET_KEYS = { balanced:"litePresetBalanced", game:"litePresetGame", max:"litePresetMax", off:"litePresetOff", custom:"litePresetCustom" };
const LITE_PRESETS = [
  /* 🪶 バランス：どこもほどほどに軽くする（初期値と同じ） */
  { id:"balanced", values:{ liteFps:"30", liteMascot:"30", liteScale:"1.5", liteSpectrumOff:true, liteFx:true, liteBlur:true, liteGameFull:false } },
  /* 🎯 ゲーム優先：ノーツ・映像はそのまま。メニュー・スペクトラム・マスコット・解像度だけ軽くする */
  { id:"game", values:{ liteFps:"30", liteMascot:"15", liteScale:"1.5", liteSpectrumOff:true, liteFx:true, liteBlur:true, liteGameFull:true } },
  /* 🔋 最大節約：いちばん軽い（ゲーム中も20fps・マスコットなし・解像度1.0倍） */
  { id:"max", values:{ liteFps:"20", liteMascot:"off", liteScale:"1", liteSpectrumOff:true, liteFx:true, liteBlur:true, liteGameFull:false } },
  /* ✨ 軽量化しない：見た目はそのまま（軽量化モードをオフにする） */
  { id:"off", mode:"off", values:{ liteFps:"60", liteMascot:"60", liteScale:"device", liteSpectrumOff:false, liteFx:false, liteBlur:false, liteGameFull:false } }
];
const liteValueOf = key => (key === "liteSpectrumOff" || key === "liteFx" || key === "liteBlur") ? settings[key] !== false : settings[key];
function litePresetId() {
  for (const preset of LITE_PRESETS) {
    if (preset.mode === "off" ? liteModeValue() !== "off" : liteModeValue() === "off") continue;
    if (Object.entries(preset.values).every(([key, value]) => liteValueOf(key) === value)) return preset.id;
  }
  return "custom";
}
const litePresetName = id => tr(LITE_PRESET_KEYS[id] || LITE_PRESET_KEYS.custom);
function liteApplyPreset(id) {
  const preset = LITE_PRESETS.find(p => p.id === id);
  if (!preset) { liteSyncUI(); return; }        // カスタム：下の項目で調整するので何も変えない
  for (const [key, value] of Object.entries(preset.values)) settings[key] = value;
  if (preset.mode) settings.liteMode = preset.mode;
  saveUserPrefs(); liteSyncUI();
  liteSay(tr("litePresetSet", { name:litePresetName(id) }));
}

/* ---------- 反映（bodyクラス＋設定画面） ---------- */
function liteApply() {
  const on = liteActive(), body = document.body;
  if (!body) return;
  body.classList.toggle("trkLite", on);
  body.classList.toggle("trkLiteFx", on && settings.liteFx !== false);
  body.classList.toggle("trkNoMascot", on && settings.liteMascot === "off");
}
function liteDeviceParts() {
  const p = [];
  if (liteInfo.cores) p.push(tr("liteCores", { n:liteInfo.cores }));
  if (liteInfo.mem) p.push(tr("liteMem", { gb:liteInfo.mem }));
  p.push(tr(liteInfo.standalone ? "liteApp" : "liteBrowser"));
  if (liteInfo.battery) p.push(tr("liteBattery", { n:Math.round(Number(liteInfo.battery.level) * 100) }));
  if (liteInfo.saveData) p.push(tr("liteWhySaveData"));
  if (liteInfo.reduced) p.push(tr("liteWhyMotion"));
  return p;
}
function liteStatus() {
  const on = liteActive();
  const state = $("liteState");
  if (state) state.textContent = tr(on ? "liteStateOn" : "liteStateOff", { why:liteReasons().join(" ・ ") });
  const device = $("liteDevice");
  if (device) device.textContent = tr("liteDevice", { parts:liteDeviceParts().join(" ・ ") });
}
function liteSyncUI() {
  const on = liteActive();
  const sel = (id, v) => { const n = $(id); if (n && n.value !== v) n.value = v; };
  const chk = (id, v) => { const n = $(id); if (n) n.checked = !!v; };
  sel("litePreset", litePresetId());
  sel("liteMode", liteModeValue());
  sel("liteFps", String(liteFpsValue()));
  sel("liteMascot", String(settings.liteMascot === "off" ? "off" : liteMascotFpsValue()));
  sel("liteScale", settings.liteScale === "1" ? "1" : settings.liteScale === "1.5" ? "1.5" : "device");
  chk("liteSpecOff", settings.liteSpectrumOff !== false);
  chk("liteFx", settings.liteFx !== false);
  chk("liteBlur", settings.liteBlur !== false);
  chk("liteGameFull", settings.liteGameFull === true);
  const panel = $("litePanel");
  if (panel) panel.classList.toggle("liteOn", on);
  liteApply();
  liteStatus();
  try { if (typeof emit === "function") emit("lite"); } catch (_) {}
}
function liteSay(text) {
  if (typeof plToast !== "function" || !text) return;
  try { plToast(text); } catch (_) {}
}

/* ---------- 起動時（設定画面の配線・初回の案内） ---------- */
function liteInit() {
  liteProbe();
  $("litePreset").addEventListener("change", e => liteApplyPreset(e.target.value));
  $("liteGameFull").addEventListener("change", e => {
    settings.liteGameFull = e.target.checked; saveUserPrefs(); liteSyncUI();
    liteSay(tr(settings.liteGameFull ? "liteGameFullOn" : "liteGameFullOff"));
  });
  $("liteMode").addEventListener("change", e => {
    settings.liteMode = ["on", "off"].includes(e.target.value) ? e.target.value : "auto";
    saveUserPrefs(); liteSyncUI();
    liteSay(tr(liteActive() ? "liteNowOn" : "liteNowOff"));
  });
  $("liteFps").addEventListener("change", e => {
    settings.liteFps = ["60", "30", "20"].includes(e.target.value) ? e.target.value : "30";
    saveUserPrefs(); liteSyncUI(); liteSay(tr("liteFpsSet", { n:liteFpsValue() }));
  });
  $("liteMascot").addEventListener("change", e => {
    const v = e.target.value;
    settings.liteMascot = ["60", "30", "15", "off"].includes(v) ? v : "30";
    saveUserPrefs(); liteSyncUI(); liteSay(tr("liteMascotSet", { n:v === "off" ? tr("liteMascotOff") : liteMascotFpsValue() + "fps" }));
  });
  $("liteScale").addEventListener("change", e => {
    settings.liteScale = ["device", "1.5", "1"].includes(e.target.value) ? e.target.value : "1.5";
    saveUserPrefs(); liteSyncUI();
  });
  for (const [id, key] of [["liteSpecOff", "liteSpectrumOff"], ["liteFx", "liteFx"], ["liteBlur", "liteBlur"]]) {
    $(id).addEventListener("change", e => { settings[key] = e.target.checked; saveUserPrefs(); liteSyncUI(); });
  }
  $("liteRecheckBtn").addEventListener("click", () => {
    liteProbe(); liteBatteryProbe(); liteSyncUI();
    liteSay(tr(liteActive() ? "liteNowOn" : "liteNowOff"));
  });
  /* 設定欄を開いたら、初回の案内はもう出さない */
  $("litePanel").addEventListener("toggle", () => {
    if (settings.liteSeen === true) return;
    settings.liteSeen = true; saveUserPrefs();
  });
  on("language", liteSyncUI);
  liteSyncUI();
  liteBatteryProbe();
  /* 初回だけ：スマホらしい端末で、まだ軽量化モードを使っていない人に、そっと1回だけ案内する */
  if (liteInfo.mobile && !liteActive() && settings.liteSeen !== true && !liteSafe()) {
    setTimeout(() => {
      if (phase !== "title" || liteActive() || settings.liteSeen === true) return;
      settings.liteSeen = true; saveUserPrefs();
      liteSay("📱 " + tr("liteToast"));
    }, 2600);
  }
}
liteInit();

window.TrkLite = Object.freeze({
  active: liteActive, reasons: liteReasons, allow: liteAllow, allowGame: liteAllowGame, mascotAllow: liteMascotAllow,
  preset: litePresetId, presetName: litePresetName, applyPreset: liteApplyPreset,
  noMascot: liteNoMascot, specBlocked: liteSpecBlocked, blurCap: liteBlurCap, pixelRatio: litePixelRatio,
  fps: liteFpsValue, mascotFps: liteMascotFpsValue, scale: liteScaleValue,
  info: () => ({ ...liteInfo }), probe: liteProbe, sync: liteSyncUI
});
