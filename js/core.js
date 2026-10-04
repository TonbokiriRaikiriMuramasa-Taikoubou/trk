// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：土台（設定・状態・共通処理・画面切り替え） ============
   ほかのファイルとは「合図」でつながります。
     on("language", fn)  言語が変わった
     on("skin", fn)      スキンが変わった
     on("chart", fn)     譜面・曲の読み込み状態が変わった
     on("phase", fn)     タイトル／プレイ中／一時停止／リザルトが変わった
     on("screen", fn)    選曲画面／設定画面などが切り替わった
     on("options", fn)   プレイオプション（MOD・AUTO・体力モードなど）が変わった
     on("beforePlay"/"beforeLoad"/"mediaReady"/"records"/"packsChanged", fn) */
"use strict";

const $ = id => document.getElementById(id);
const stage = $("stage"), video = $("video");
const view = $("view"), vctx = view.getContext("2d");
const fx = $("fx"), ctx = fx.getContext("2d");

function fitStage() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  stage.style.transform = `translate(-50%,-50%) scale(${s})`;
}
addEventListener("resize", fitStage);
fitStage();

/* ---------- 合図（イベント） ---------- */
const HOOKS = {};
function on(name, fn) { (HOOKS[name] ||= []).push(fn); }
function emit(name, ...args) {
  for (const fn of HOOKS[name] || []) { try { fn(...args); } catch (e) { console.error(e); } }
}

/* ---------- カスタムスキン（設定より先に読み込む） ---------- */
const CUSTOM_SKINS_KEY = "shadow_taiko_custom_skins_v1", CUSTOM_SKIN_MAX = 20, SKIN_FORMAT = "skin.shadow-taiko";
const customSkinDefs = {};
function saveCustomSkins() { try { localStorage.setItem(CUSTOM_SKINS_KEY, JSON.stringify(customSkinDefs)); } catch (_) {} }
(function loadCustomSkins() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(CUSTOM_SKINS_KEY)) || {}; } catch (_) {}
  for (const [id, d] of Object.entries(raw)) {
    if (!/^custom_[a-z0-9]+$/.test(id)) continue;
    const def = sanitizeSkinDef(d);
    if (def) { customSkinDefs[id] = def; SKINS[id] = buildCustomSkin(def); }
  }
})();

/* ---------- 設定（以前のバージョンの保存内容も引き継ぐ） ----------
   保存場所の名前（shadow_taiko_…）は、これまでのデータを引き継ぐため変えていません。
   各モードの細かい設定（ORBITの見た目・STAGEの譜面・CATCHのキーなど）は、それぞれのファイルが追加します。 */
const PREFS_KEY = "shadow_taiko_preferences_v2", OLD_PREFS_KEY = "shadow_taiko_preferences_v1", BEST_KEY = "shadow_taiko_best_v1";
let prefs = {};
try { prefs = JSON.parse(localStorage.getItem(PREFS_KEY)) || JSON.parse(localStorage.getItem(OLD_PREFS_KEY)) || {}; } catch (_) { prefs = {}; }
if (!prefs || typeof prefs !== "object") prefs = {};
const pick = (v, list, def) => list.includes(v) ? v : def;
const num = (v, lo, hi, def) => (typeof v === "number" && isFinite(v)) ? Math.min(hi, Math.max(lo, v)) : def;
function guessLang() {
  const l = (navigator.language || "en").toLowerCase();
  return l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : l.startsWith("ko") ? "ko" : "en";
}

/* キー：メイン2つ（左・右）＋サブ2つ。初期設定は A（ドン）／Space（カッ） */
const KEY_PRESETS = {
  standard:{ label:"keyPresetDefault", keys:["KeyA", "Space"], sub:["", ""] },
  taiko:   { label:"keyPresetTaiko",   keys:["KeyF", "KeyD"],  sub:["KeyJ", "KeyK"] }
};
const validCode = k => typeof k === "string" && /^[A-Za-z0-9]{1,24}$/.test(k);
const bootKeys = (Array.isArray(prefs.keys) && prefs.keys.length === 2 && prefs.keys.every(validCode) && prefs.keys[0] !== prefs.keys[1])
  ? prefs.keys.slice() : KEY_PRESETS.standard.keys.slice();
const bootSub = [0, 1].map(i => { const k = Array.isArray(prefs.subKeys) ? prefs.subKeys[i] : ""; return validCode(k) && !bootKeys.includes(k) ? k : ""; });
if (bootSub[0] && bootSub[0] === bootSub[1]) bootSub[1] = "";

const PLAY_MODES = ["manual", "truck", "orbit", "stage", "catch"];
const savedSkinAtBoot = typeof prefs.skin === "string" ? prefs.skin : "";   // パックのスキンは後から復元
const settings = {
  language: pick(prefs.language, ["ja", "en", "zh", "ko"], guessLang()),
  skin: SKINS[prefs.skin] ? prefs.skin : ({ dark:"shadow", light:"daylight" }[prefs.skin] || "shadow"),
  layout: pick(prefs.layout ?? prefs.gameplayLayout, Object.keys(LAYOUTS), "classic"),
  videoStyle: pick(prefs.videoStyle, ["skin", "color", "mono", "dim", "off"], "skin"),
  bgDim: num(prefs.bgDim, 0, .9, 0),
  bgBlur: num(prefs.bgBlur, 0, 12, 0),
  scroll: num(prefs.scroll, .5, 2.5, 1),
  latency: num(prefs.latency, -300, 500, 0),
  /* プレイ方法：以前の「AUTO」モードは「MANUAL＋AUTOオン」に引き継ぐ */
  playMode: pick(prefs.playMode, PLAY_MODES, "manual"),
  autoPlay: prefs.autoPlay === true || prefs.playMode === "auto",
  difficulty: pick(prefs.difficulty, DIFF_IDS, "normal"),
  seed: typeof prefs.seed === "string" ? prefs.seed.slice(0, 32) : "834271",   // 曲ごとの設定がない曲の初期値
  bpm: num(prefs.bpm, 60, 300, 138),
  offset: num(prefs.offset, -5000, 5000, 0),
  reverseHands: !!prefs.reverseHands,
  hideGameplayUI: !!prefs.hideGameplayUI,
  playerMode: !!prefs.playerMode,
  errorMeter: prefs.errorMeter !== false,
  keys: bootKeys,
  subKeys: bootSub,
  seEnabled: !!prefs.seEnabled,
  seVolume: num(prefs.seVolume, 0, 1, .28),
  musicVolume: num(prefs.musicVolume, 0, 1, .7),
  notes: sanitizeNotes(prefs.notes ?? (prefs.skin === "clarity" ? NOTE_PRESETS.clarity : null)),
  mascot: pick(prefs.mascot, ["skin", "none", ...MASCOT_IDS], "skin"),
  fxPower: num(prefs.fxPower, 0, 3, 1.5),
  vrmFrame: pick(prefs.vrmFrame, ["full", "upper", "face"], "full"),
  vrmTurn: num(prefs.vrmTurn, -60, 60, -20),
  vrmRemember: prefs.vrmRemember !== false,
  vrmMotionBpm: num(prefs.vrmMotionBpm, 0, 300, 0),
  activePack: typeof prefs.activePack === "string" ? prefs.activePack : null,
  previewEnabled: prefs.previewEnabled !== false,
  libSort: pick(prefs.libSort, ["name", "plays", "recent", "best"], "name"),
  /* プレイオプション */
  lives: pick(prefs.lives, ["standard", "knight", "chicken", "none"], "standard"),
  countdown: prefs.countdown !== false,
  countdownSE: prefs.countdownSE !== false,
  resumeCountdown: prefs.resumeCountdown !== false,
  judge: pick(prefs.judge, ["lenient", "standard", "strict"], "standard"),
  rate: num(prefs.rate, .5, 3, 1),          // 上限は speed.js が「2.0x・3.0x も使う」の設定に合わせて決め直します
  hidden: !!prefs.hidden,
  sudden: !!prefs.sudden,
  cover: num(prefs.cover, .2, .7, .4)
};
function saveUserPrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(settings)); } catch (_) {} }

const skin = () => SKINS[settings.skin] || SKINS.shadow;
const fontFamily = () => skin().font || FONT_DEFAULT;
function activeMascot() {
  const m = settings.mascot === "skin" ? skin().mascot : settings.mascot;
  return MASCOT_IDS.includes(m) ? m : null;
}
const isPclMascot = m => !!m && MASCOT_FAMILY[m] === "miku";

/* ---------- 状態 ---------- */
let phase = "title";            // title / playing / paused / ended
let screen = "select";          // select / settings（phase が title のとき）
let currentSong = null;         // 選曲中の曲（library.js が設定）
let videoReady = false, mediaURL = null, mediaName = "", fingerprint = "", loadToken = 0, analysis = null;
let bgImage = null;             // 音声だけの曲で使う背景画像（曲パック）
let chart = [], chartMode = "generated", chartDiff = settings.difficulty, chartMeta = { bpm:0, offset:0 };
let currentLevel = 1, levelOverride = null;
const unlock = { master:false, rush:false };
let nextIdx = 0;
let stats = { perfect:0, good:0, miss:0, combo:0, maxCombo:0, star:0 };
let practice = false, effects = [], errors = [];
let pressFlash = [-1e9, -1e9], pressH = { lane:0, t:-1e9 }, avatarHit = [-1e9, -1e9], lastMissT = -1e9;
let caption = null; const CAPTION_MS = 2600;
let clock = { t:0, perf:0, lastCt:-1 };
let bindingSlot = null, seekDragging = false;
const isTouch = matchMedia("(pointer:coarse)").matches || "ontouchstart" in window;

/* ---------- 便利な関数 ---------- */
function hashString(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const extOf = p => String(p).split(".").pop().toLowerCase();
const baseName = n => String(n).replace(/\.[^.]+$/, "");
const safeName = s => String(s).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 60) || "file";
function fmtTime(s) { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function fmtDate(t) {
  try { return new Date(t).toLocaleString(document.documentElement.lang || undefined, { month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
  catch (_) { return ""; }
}
function formatKey(code) {
  if (!code) return "—";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map = { ArrowLeft:"←", ArrowRight:"→", ArrowUp:"↑", ArrowDown:"↓", Space:"Space", ShiftLeft:"L-Shift", ShiftRight:"R-Shift",
    ControlLeft:"L-Ctrl", ControlRight:"R-Ctrl", AltLeft:"L-Alt", AltRight:"R-Alt", Semicolon:";", Comma:",", Period:".", Slash:"/",
    BracketLeft:"[", BracketRight:"]", Quote:"'", Backslash:"\\", Minus:"-", Equal:"=", Backquote:"`", Enter:"Enter", Backspace:"BS" };
  return map[code] || code.replace(/^Numpad/, "Num ");
}
/* 押されたキーが左右どちらの枠か（メイン・サブ両方を見る）。なければ -1 */
function slotOfKey(code) {
  if (!code) return -1;
  const k = settings.keys.indexOf(code); if (k >= 0) return k;
  return settings.subKeys.indexOf(code);
}
const keysLabel = slot => [settings.keys[slot], settings.subKeys[slot]].filter(Boolean).map(formatKey).join("/");
const slotLane = slot => settings.reverseHands ? 1 - slot : slot;
const laneCol = lane => settings.reverseHands ? 1 - lane : lane;
const laneName = lane => tr(lane ? "ka" : "don");
const laneColor = lane => settings.notes[lane].color;
const noteShape = lane => settings.notes[lane].shape;
const travelMs = () => 1700 / settings.scroll;

/* 判定幅（難易度 × 判定の厳しさ） */
const JUDGE_SCALE = { lenient:1.3, standard:1, strict:.75 };
const windows = () => {
  const d = DIFFS[chartDiff] || DIFFS.normal, k = JUDGE_SCALE[settings.judge] || 1;
  return { perfect:d.perfect * k, good:d.good * k };
};

/* ---------- MOD（プレイオプション）の表示 ---------- */
function activeMods() {
  const m = [];
  if (settings.hidden) m.push("HD");
  if (settings.sudden) m.push("SD");
  if (settings.rate !== 1) m.push(settings.rate.toFixed(2) + "x");
  if (settings.judge === "strict") m.push("STRICT");
  if (settings.judge === "lenient") m.push("LENIENT");
  return m;
}
/* 簡単になる設定（ゆるめ判定・1.00x未満）は練習扱い。1.05x以上は速度別のハイスコア */
const modsUnranked = () => settings.judge === "lenient" || settings.rate < 1;
const LIVES_TAG = { knight:"🛡 KNIGHT", chicken:"🐔 trk!", none:"♾ INFINITE" };
function renderModsLine() {
  const n = $("modsLine"); if (!n) return;
  const mods = [...activeMods(), ...(LIVES_TAG[settings.lives] ? [LIVES_TAG[settings.lives]] : []), ...(settings.autoPlay ? ["▶ AUTO"] : [])];
  if (!mods.length) { n.textContent = ""; return; }
  const note = settings.autoPlay ? "" : modsUnranked() ? tr("unrankedNote") : settings.rate > 1 ? tr("rateRecordNote") : "";
  n.textContent = `${tr("modsLabel")}: ${mods.join(" · ")}${note ? " " + note : ""}`;
}
on("options", renderModsLine);
on("language", renderModsLine);

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function downloadJSON(obj, name) { downloadBlob(new Blob([JSON.stringify(obj, null, 2)], { type:"application/json" }), name); }

/* ブラウザ内保存（IndexedDB）。データベース名はこれまでと同じものを使います */
function idbStore(dbName, store = "kv") {
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open(dbName, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(store)) r.result.createObjectStore(store); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { p = null; rej(r.error); };
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, mode), req = fn(tx.objectStore(store));
      tx.oncomplete = () => res(req ? req.result : undefined);
      tx.onerror = tx.onabort = () => rej(tx.error);
    });
  };
  return {
    get: k => run("readonly", s => s.get(k)),
    put: (k, v) => run("readwrite", s => s.put(v, k)),
    del: k => run("readwrite", s => s.delete(k)),
    all: () => run("readonly", s => s.getAll()),
    keys: () => run("readonly", s => s.getAllKeys())
  };
}

/* ---------- ステータス表示（言語を変えると訳し直す） ---------- */
const statusState = {};
function setStatus(id, key, vars) { statusState[id] = key ? { key, vars } : null; renderStatus(id); }
function renderStatus(id) {
  const n = $(id), s = statusState[id]; if (!n) return;
  n.textContent = !s ? "" : (typeof s.key === "function" ? s.key() : tr(s.key, s.vars));
}
function renderAllStatuses() { Object.keys(statusState).forEach(renderStatus); }

/* ---------- 言語 ---------- */
function applyLanguage(code) {
  lang = TEXT[code] ? code : "en"; settings.language = lang; $("language").value = lang;
  document.documentElement.lang = { ja:"ja", en:"en", zh:"zh-CN", ko:"ko" }[lang];
  document.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = tr(n.dataset.i18n); });
  buildSkinGrid(); updateKeyUI(); updateTouchKeys(); refreshSeedSecrets(); syncPickers(); renderAllStatuses();
  emit("language");
}

/* ---------- スキン ---------- */
function buildSkinGrid() {
  const grid = $("skinGrid"); grid.textContent = "";
  for (const [id, s] of Object.entries(SKINS)) {
    const b = el("button", "skinCard"); b.type = "button"; b.dataset.skin = id;
    b.style.setProperty("--sk-bg", s.game.stage); b.style.setProperty("--sk-text", s.ui["--ui-text"]);
    b.style.setProperty("--sk-border", s.ui["--ui-border"]);
    if (s.font) b.style.fontFamily = s.font;
    if (s.custom || s.pack) b.append(el("span", "skinTag", s.pack ? "PACK" : tr("customTag")));
    const dots = el("span", "dots");
    for (const c of [s.ui["--ui-accent"], s.ui["--ui-gold"], s.ui["--ui-text"]]) { const d = el("i", "dot square"); d.style.background = c; dots.append(d); }
    b.append(dots, el("b", "", s.label[lang] || s.label.en), el("small", "", (s.desc && (s.desc[lang] || s.desc.en)) || ""));
    b.classList.toggle("selected", id === settings.skin); b.setAttribute("aria-pressed", id === settings.skin);
    b.addEventListener("click", () => applySkin(id));
    grid.append(b);
  }
}
/* 背景映像のフィルター：スキン／表示スタイルの色味 → 暗さ → ぼかし の順に重ねる */
function videoFilter() {
  if (settings.videoStyle === "off") return "none";
  const base = { color:"none", mono:"grayscale(1) contrast(1.6)", dim:"brightness(.42) saturate(.85)" }[settings.videoStyle] ?? (skin().video || "none");
  const parts = base && base !== "none" ? [base] : [];
  if (settings.bgDim > 0) parts.push(`brightness(${(1 - settings.bgDim).toFixed(2)})`);
  if (settings.bgBlur > 0) parts.push(`blur(${settings.bgBlur}px)`);
  return parts.join(" ") || "none";
}
function applyNoteVars() {
  const root = document.documentElement.style;
  root.setProperty("--don", settings.notes[0].color); root.setProperty("--ka", settings.notes[1].color);
}
function applySkin(id, persist = true) {
  settings.skin = SKINS[id] ? id : "shadow";
  const s = skin(), root = document.documentElement.style;
  for (const [k, v] of Object.entries(s.ui)) root.setProperty(k, v);
  root.setProperty("--stage-bg", s.game.stage); root.setProperty("--hud-text", s.game.ink);
  root.setProperty("--hud-shadow", s.game.inkShadow); root.setProperty("--font", s.font || FONT_DEFAULT);
  root.setProperty("--j-perfect", s.game.perfect); root.setProperty("--j-good", s.game.good); root.setProperty("--j-miss", s.game.miss);
  applyNoteVars();
  document.documentElement.dataset.skin = settings.skin;
  document.querySelectorAll("#skinGrid .skinCard").forEach(b => {
    b.classList.toggle("selected", b.dataset.skin === settings.skin); b.setAttribute("aria-pressed", b.dataset.skin === settings.skin);
  });
  view.style.filter = videoFilter();
  updateTouchKeys();
  if (persist) saveUserPrefs();
  emit("skin");
}

/* ---------- 選択ボタン・キー表示 ---------- */
function syncPickers() {
  const mark = (sel, attr, val) => document.querySelectorAll(sel).forEach(b => {
    b.classList.toggle("selected", b.dataset[attr] === val); b.setAttribute("aria-pressed", b.dataset[attr] === val);
  });
  mark("#modePicker button", "playmode", settings.playMode);
  mark("#difficultyPicker button", "mode", settings.difficulty);
  mark("#layoutPicker button", "layout", settings.layout);
  mark("#judgePicker button", "judge", settings.judge);
  stage.dataset.layout = settings.layout;
  stage.dataset.mode = settings.playMode;
}
function updateKeyUI() {
  for (let i = 0; i < 2; i++) {
    $("keyValue" + i).textContent = formatKey(settings.keys[i]);
    $("keyValue" + (i + 2)).textContent = settings.subKeys[i] ? formatKey(settings.subKeys[i]) : tr("unset");
  }
  $("keyPreview").textContent = `${laneName(slotLane(0))}: [${keysLabel(0)}]   ·   ${laneName(slotLane(1))}: [${keysLabel(1)}]`;
  document.querySelectorAll("[data-bind]").forEach(b => b.classList.toggle("listening", bindingSlot === +b.dataset.bind));
}
/* タッチボタン：MANUAL・TRUCK・ORBITで表示（STAGE・CATCHは画面を直接タップ。AUTOでは出さない） */
function updateTouchKeys() {
  const tk = $("touchKeys");
  tk.classList.toggle("on", isTouch && phase === "playing" && !settings.autoPlay && ["manual", "truck", "orbit"].includes(settings.playMode));
  tk.querySelectorAll("button").forEach(b => {
    const lane = slotLane(+b.dataset.slot);
    b.style.setProperty("--c", lane ? "var(--ka)" : "var(--don)");
    b.querySelector("span").textContent = laneName(lane);
  });
}
on("options", updateTouchKeys);
/* 隠しSeedの効果を調べる（完全一致：EGG_KEYS／言葉を含む：EGG_WORDS） */
function seedEggs(raw) {
  const s = String(raw || "").trim(), low = s.toLowerCase();
  const r = { master:false, rush:false, level:null, key:EGG_KEYS[low] || EGG_KEYS[s] || null, vars:null };
  if (low === "765" || low === "143") r.master = true;
  if (low === "2000" || low === "143") r.rush = true;
  for (const rule of EGG_WORDS) {
    const w = rule.words.find(x => low.includes(x)); if (!w) continue;
    if (rule.master) r.master = true;
    if (rule.rush) r.rush = true;
    if (rule.level) r.level = rule.level;
    if (!r.key) { r.key = rule.key; r.vars = { w:w.toUpperCase() }; }
  }
  return r;
}
function refreshSeedSecrets() {
  const e = seedEggs($("seed").value);
  unlock.master = e.master; unlock.rush = e.rush; levelOverride = e.level;
  document.querySelector('#difficultyPicker [data-mode="master"]').hidden = !unlock.master;
  document.querySelector('#difficultyPicker [data-mode="rush"]').hidden = !unlock.rush;
  if ((settings.difficulty === "master" && !unlock.master) || (settings.difficulty === "rush" && !unlock.rush)) settings.difficulty = "normal";
  setStatus("eggStatus", e.key || "secretHint", e.vars);
  $("eggStatus").classList.toggle("egg", !!e.key);
}

/* ---------- 譜面まわりのボタン ---------- */
function updateChartButtons() {
  const ready = videoReady && chart.length > 0;
  $("playBtn").disabled = !ready;
  $("importChartBtn").disabled = !videoReady;
  $("exportSelectBtn").disabled = !ready;
  $("regenerateChartBtn").hidden = chartMode === "generated";
  emit("chart");
}
function chartSummary() {
  if (!chart.length) return "";
  return `${tr(chartMode === "generated" ? "chartGenerated" : "chartImported")} · ${tr(chartDiff)} · ${chart.length} ${tr("notes")} · ${tr("level")}${currentLevel} ${tr("estimate")}`;
}

/* ---------- フェーズと画面 ---------- */
function setPhase(p) {
  phase = p; stage.dataset.phase = p;
  stage.classList.toggle("playing", p === "playing");
  $("seekBar").classList.toggle("on", (settings.playerMode || settings.autoPlay) && (p === "playing" || p === "paused"));
  updateTouchKeys();
  emit("phase", p);
}
const SCREENS = ["selectScreen", "settingsScreen", "pauseScreen", "endScreen"];
function showScreen(id) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  if (id === "selectScreen") screen = "select";
  else if (id === "settingsScreen") screen = "settings";
  stage.dataset.screen = id || "none";
  emit("screen", id);
}
function openSettings() { if (phase === "title") showScreen("settingsScreen"); }
function closeSettings() { if (phase === "title") showScreen("selectScreen"); }
/* ✅ core.js 完了 */
