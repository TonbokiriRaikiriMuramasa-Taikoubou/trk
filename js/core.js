(() => {
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

/* ---------- 全画面の重ね表示が開いているか（名前空間の移行で、旧 window の旗 3 つ＝書斎・メディアプレーヤー・シンス を置き換え） ----------
   書く側：window.Trk.overlay.set("study", true)   読む側：window.Trk.overlay.is("study")
   どれか一つでも開いているか：window.Trk.overlay.any()   名前は "study"（書斎）・"media"（メディアプレーヤー）・"synth"（シンス） */
const TRK_OVERLAY_OPEN = { study:false, media:false, synth:false };
const trkOverlayHas = name => Object.prototype.hasOwnProperty.call(TRK_OVERLAY_OPEN, name);
window.Trk = window.Trk || {};
window.Trk.overlay = {
  set(name, open) { if (trkOverlayHas(name)) TRK_OVERLAY_OPEN[name] = !!open; },
  is(name) { return trkOverlayHas(name) && TRK_OVERLAY_OPEN[name] === true; },
  any() { return Object.keys(TRK_OVERLAY_OPEN).some(k => TRK_OVERLAY_OPEN[k] === true); },
};
/* 互換：js/fx.js（凍結のため書き換えない）はまだ window._trkStudyRoomOpen を読む。読み取り専用で、書斎の開閉を映す */
Object.defineProperty(window, "_trkStudyRoomOpen", { configurable: true, get: () => TRK_OVERLAY_OPEN.study === true });

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
const PREFS_IMPORT_MAX = 2 * 1024 * 1024;
let prefs = {};
try { prefs = JSON.parse(localStorage.getItem(PREFS_KEY)) || JSON.parse(localStorage.getItem(OLD_PREFS_KEY)) || {}; } catch (_) { prefs = {}; }
if (!prefs || typeof prefs !== "object") prefs = {};
const pick = (v, list, def) => list.includes(v) ? v : def;
const VIDEO_STYLE_IDS = typeof TRK_TV_PRESETS !== "undefined" && Array.isArray(TRK_TV_PRESETS)
  ? TRK_TV_PRESETS.map(p => p && p.id).filter(id => typeof id === "string")
  : ["skin", "color", "mono", "dim", "off"];
const num = (v, lo, hi, def) => (typeof v === "number" && isFinite(v)) ? Math.min(hi, Math.max(lo, v)) : def;
const clampTvDim = v => Number((Math.round(num(v, 0, .9, 0) * 20) / 20).toFixed(2));
const clampTvBlur = v => Math.round(num(v, 0, 12, 0));
const TV_PARAM_FAV_MAX = 8;
function cleanTvParamFavorites(v) {
  if (!Array.isArray(v)) return [];
  const out = [], seen = new Set();
  for (const item of v) {
    if (!item || typeof item !== "object" || !Number.isFinite(item.dim) || !Number.isFinite(item.blur)) continue;
    const dim = clampTvDim(item.dim), blur = clampTvBlur(item.blur), key = `${dim.toFixed(2)}:${blur}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push({ dim, blur });
    if (out.length >= TV_PARAM_FAV_MAX) break;
  }
  return out;
}
function guessLang() {
  const l = (navigator.language || "en").toLowerCase();
  return l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : l.startsWith("ko") ? "ko" : "en";
}

/* キー：メイン2つ（左・右）＋サブ2つ。初期設定は A（ドン）／Space（カッ） */
const KEY_PRESETS = {
  standard:{ label:"keyPresetDefault", keys:["KeyA", "Space"], sub:["", ""] },
  taiko:   { label:"keyPresetTaiko",   keys:["KeyF", "KeyD"],  sub:["KeyJ", "KeyK"] },
  /* 🕹 アーケード筐体・自作コントローラー（1・2ボタン）／📺 TVリモコン（← →） */
  arcade:  { label:"keyPresetArcade",  keys:["Digit1", "Digit2"], sub:["", ""] },
  remote:  { label:"keyPresetRemote",  keys:["ArrowLeft", "ArrowRight"], sub:["", ""] }
};
const validCode = k => typeof k === "string" && /^[A-Za-z0-9]{1,24}$/.test(k);
/* 🎮 パッドの割り当て（js/pad.js）：ボタン＝"b0"、軸＝"a0+"（＋方向）／"a0-"（−方向）。
   スティック・D-pad（軸で届く機種）・アケコンのレバーも、この1つの形で表します。 */
const validPadBind = b => typeof b === "string" && /^[ba]\d{1,2}[+-]?$/.test(b) && !(b[0] === "b" && /[+-]$/.test(b));
const padBindOr = (v, d) => (validPadBind(v) ? v : d);
const PAD_DEFAULTS = { left:"b0", right:"b1", confirm:"b0", back:"b1", pause:"b9" };
/* TVリモコン・メディアキーは e.code が空で e.key だけ届くことがあります（逆に e.code が名前の機種も）。
   ノーツや移動キーの割り当ては、この関数の値で判定します。 */
function keyCodeOf(e) {
  if (!e) return "";
  if (e.code) return e.code;
  const k = e.key || "";
  return /^[A-Za-z0-9]{1,24}$/.test(k) ? k : "";
}
const VIDEO_KEY_DEFAULTS = ["NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide", "Numpad0", "Numpad9", "Numpad8", "Numpad7"];
const savedVideoKeys = Array.isArray(prefs.videoKeys) && prefs.videoKeys.length === VIDEO_KEY_DEFAULTS.length &&
  prefs.videoKeys.every(validCode) && new Set(prefs.videoKeys).size === VIDEO_KEY_DEFAULTS.length ? prefs.videoKeys.slice()
  : Array.isArray(prefs.videoKeys) && [5, 7].includes(prefs.videoKeys.length) && prefs.videoKeys.every(validCode) && new Set(prefs.videoKeys).size === prefs.videoKeys.length
    ? [...prefs.videoKeys, ...VIDEO_KEY_DEFAULTS.slice(prefs.videoKeys.length)] : VIDEO_KEY_DEFAULTS.slice();
const bootKeys = (Array.isArray(prefs.keys) && prefs.keys.length === 2 && prefs.keys.every(validCode) && prefs.keys[0] !== prefs.keys[1])
  ? prefs.keys.slice() : KEY_PRESETS.standard.keys.slice();
const bootSub = [0, 1].map(i => { const k = Array.isArray(prefs.subKeys) ? prefs.subKeys[i] : ""; return validCode(k) && !bootKeys.includes(k) ? k : ""; });
if (bootSub[0] && bootSub[0] === bootSub[1]) bootSub[1] = "";

const PLAY_MODES = ["manual", "truck", "orbit", "stage", "catch"];
const savedSkinAtBoot = typeof prefs.skin === "string" ? prefs.skin : "";   // パックのスキンは後から復元
/* 🪶 軽量化の許可リスト。ここで決め打ちできるので、辞書の読み込み状況に左右されない。
   ⚠ js/lite.js はこの値を { "60":60, … }[settings.liteFps] || 30 の形で数値へ写す。
     未知の文字列（継承キーの "constructor" など）が入ると Object 関数が truthy で返り、
     || 30 の保険が効かずにゲート間隔が NaN になる＝軽量化が一瞬効かなくなる（M-02）。 */
const LITE_ENUM_VALUES = {
  liteMode: ["off", "auto", "on"],
  liteFps: ["60", "30", "20"],
  liteMascot: ["60", "30", "15", "off"],
  liteScale: ["device", "1.5", "1"],
  liteLibRows: ["device", "150", "60"]      // 🪶 曲リストが初回に描く行数
};
/* 🐔 trk's playlist のタブ表示名（3種類）。名前が長いのを嫌う人向けに短くできる。
   "icon" は文字を出さない（🐔 のアイコンだけ）。名前と色は固定なので、ここで選べるのは表示名だけ。 */
const TRK_ENUM_VALUES = {
  trkTabName: ["full", "short", "icon"],
  chartGen: ["1", "2"]          // 🎼 自動譜面の作り方（1＝旧方式、2＝新方式・既定。js/chart-gen.js）
};

const settings = {
  language: pick(prefs.language, ["ja", "en", "zh", "ko"], guessLang()),
  skin: has(SKINS, prefs.skin) ? prefs.skin : (prefs.skin === "dark" ? "shadow" : prefs.skin === "light" ? "daylight" : "shadow"),
  skinShelfOpen: prefs.skinShelfOpen !== false,      // 🖼 スキンの棚の開閉（30種＋カスタムでも設定画面が膨らまないように）
  skinShelfCat: pick(prefs.skinShelfCat, ["all","basic","miku","dark","light","grad","fun","custom"], "all"),
  layout: pick(prefs.layout ?? prefs.gameplayLayout, Object.keys(LAYOUTS), "classic"),
  videoStyle: pick(prefs.videoStyle, VIDEO_STYLE_IDS, "skin"),
  videoZoom: num(prefs.videoZoom, .5, 3, 1),
  videoKeys: savedVideoKeys,
  castPolicy: pick(prefs.castPolicy, ["off", "antenna"], "off"),
  backgroundPolicy: pick(prefs.backgroundPolicy, ["off", "antenna", "corner"], prefs.castPolicy === "antenna" ? "antenna" : "off"),
  bgDim: clampTvDim(prefs.bgDim),
  bgBlur: clampTvBlur(prefs.bgBlur),
  tvParamFavs: cleanTvParamFavorites(prefs.tvParamFavs),
  scroll: num(prefs.scroll, .5, 2.5, 1.2),
  latency: num(prefs.latency, -300, 500, 0),
  /* プレイ方法：以前の「AUTO」モードは「MANUAL＋AUTOオン」に引き継ぐ */
  playMode: pick(prefs.playMode, PLAY_MODES, "manual"),
  autoPlay: prefs.autoPlay === true || prefs.playMode === "auto",
  difficulty: pick(prefs.difficulty, DIFF_IDS, "normal"),
  showMasterDiff: !!prefs.showMasterDiff,
  chartGen: pick(prefs.chartGen, ["1", "2"], "2"),                        // 🎼 自動譜面の作り方（既定は新方式。旧方式「1」へ戻せば、旧譜面の記録もそのまま開ける）
  seed: typeof prefs.seed === "string" ? prefs.seed.slice(0, 32) : "834271",   // 曲ごとの設定がない曲の初期値
  bpm: num(prefs.bpm, 60, 300, 138),
  offset: num(prefs.offset, -5000, 5000, 0),
  reverseHands: !!prefs.reverseHands,
  hideGameplayUI: !!prefs.hideGameplayUI,
  playerMode: !!prefs.playerMode,
  helpText: prefs.helpText !== false,
  tutorialDone: prefs.tutorialDone === true,
  tutorialStamps: (Array.isArray(prefs.tutorialStamps) ? prefs.tutorialStamps : []).filter(x => ["song", "look", "play", "safe", "seed"].includes(x)),   /* 🧭 スタンプラリー（順番自由・5つでごほうび） */
  skinGradUnlocked: prefs.skinGradUnlocked === true,
  menuKey: validCode(prefs.menuKey) ? prefs.menuKey : "KeyM",
  menuConfirm: prefs.menuConfirm !== false,
  mediaExitKey: validCode(prefs.mediaExitKey) ? prefs.mediaExitKey : "Escape",
  mediaExitConfirm: prefs.mediaExitConfirm !== false,
  errorMeter: prefs.errorMeter !== false,
  keys: bootKeys,
  subKeys: bootSub,
  /* 🎮 ゲームパッド・コントローラー（読み込みは js/pad.js） */
  padEnabled: prefs.padEnabled !== false,
  padMenuNav: prefs.padMenuNav !== false,
  padLeft: padBindOr(prefs.padLeft, PAD_DEFAULTS.left),
  padRight: padBindOr(prefs.padRight, PAD_DEFAULTS.right),
  padConfirm: padBindOr(prefs.padConfirm, PAD_DEFAULTS.confirm),
  padBack: padBindOr(prefs.padBack, PAD_DEFAULTS.back),
  padPause: padBindOr(prefs.padPause, PAD_DEFAULTS.pause),
  seEnabled: !!prefs.seEnabled,
  seVolume: num(prefs.seVolume, 0, 1, .28),
  musicVolume: num(prefs.musicVolume, 0, 1, .7),
  musicVolumeRestore: num(prefs.musicVolumeRestore, .01, 1,
    typeof prefs.musicVolume === "number" && prefs.musicVolume > 0 ? prefs.musicVolume : .7),
  bannerPause: prefs.bannerPause === true,                                   // ⏯ 右上の曲名バナーをタップで一時停止（初期オフ）
  bannerSongBtns: prefs.bannerSongBtns !== false,                            // ◀▶ バナー右端の曲送りボタン（初期オン）
  bannerRandomBtn: prefs.bannerRandomBtn !== false,                          // 🎲 バナー右端のおまかせボタン（初期オン）
  bannerRandomTap: prefs.bannerRandomTap === true,                           // 🎲 タップだけで変える（初期オフ＝長押し）
  /* 🪶 軽量化（スマホ・タブレット・アプリ向け。読み込みは js/lite.js） */
  liteMode: pick(prefs.liteMode, LITE_ENUM_VALUES.liteMode, "auto"),         // 自動＝端末・省データ・電池を見て決める
  liteFps: pick(prefs.liteFps, LITE_ENUM_VALUES.liteFps, "30"),              // 描画のフレームレート上限
  liteMascot: pick(prefs.liteMascot, LITE_ENUM_VALUES.liteMascot, "30"),     // 🩷 3Dマスコット（MMD／VRM）の描画レート
  liteScale: pick(prefs.liteScale, LITE_ENUM_VALUES.liteScale, "1.5"),       // 描画解像度（devicePixelRatio）の上限
  liteSpectrumOff: prefs.liteSpectrumOff !== false,                          // 📊 軽量化モード中はスペクトラムを止める
  liteFx: prefs.liteFx !== false,                                            // 軽量化モード中はぼかし・すりガラスを減らす
  liteBlur: prefs.liteBlur !== false,                                        // 軽量化モード中は映像のぼかしを最大2pxに
  liteDecor: prefs.liteDecor !== false,                                      // 軽量化モード中は動き続ける装飾（📡ドックのキャラ等）を間引く
  liteLibRows: pick(prefs.liteLibRows, LITE_ENUM_VALUES.liteLibRows, "device"),  // 🪶 曲リストの初回表示行数（device＝制限なし）
  liteNoAnalyze: prefs.liteNoAnalyze === true,                               // 軽量化モード中は曲の音声解析をしない（譜面はBPM中心）
  liteMascotNoLoad: prefs.liteMascotNoLoad === true,                         // 軽量化モード中は3Dマスコットを自動で読み込まない
  liteSeen: prefs.liteSeen === true,                                         // 📱 スマホ向けの初回案内を出したか
  liteGameFull: prefs.liteGameFull === true,                                 // 🎯 ゲーム中は描画を軽くしない（ゲーム優先・初期オフ）
  /* 🎹 シンセ演奏モード */
  synthModeDisabled: !!prefs.synthModeDisabled,
  synthModeFastStart: !!prefs.synthModeFastStart,
  synthModeKeyboardLock: prefs.synthModeKeyboardLock !== false,
  synthModeWideKeyboard: !!prefs.synthModeWideKeyboard,
  notes: sanitizeNotes(prefs.notes ?? (prefs.skin === "clarity" ? NOTE_PRESETS.clarity : null)),
  mascot: pick(prefs.mascot, ["skin", "none", ...MASCOT_IDS], "skin"),
  fxPower: num(prefs.fxPower, 0, 3, 1.5),
  gameFxMode: pick(prefs.gameFxMode, ["full", "soft", "off"], "full"),
  vrmFrame: pick(prefs.vrmFrame, ["full", "upper", "face"], "full"),
  vrmTurn: num(prefs.vrmTurn, -60, 60, -20),
  vrmRemember: prefs.vrmRemember !== false,
  vrmMotionBpm: num(prefs.vrmMotionBpm, 0, 300, 0),
  /* 🩷 MMD（モデルは同梱しません。読み込んだものは端末内だけに保存） */
  mmdAgreed: !!prefs.mmdAgreed,
  mmdRemember: prefs.mmdRemember !== false,
  mmdScale: num(prefs.mmdScale, .5, 1.8, 1),
  mmdTurn: num(prefs.mmdTurn, -60, 60, 0),
  mmdMotionBpm: num(prefs.mmdMotionBpm, 0, 300, 0),
  mmdMotionKind: typeof prefs.mmdMotionKind === "string" && prefs.mmdMotionKind !== "file" ? prefs.mmdMotionKind : "faceSing",  // 🩷 選んだ内蔵モーション（mmd.js が実在を検証）
  mmdQuickUI: prefs.mmdQuickUI !== false,                                                     // 🩷 選曲画面のモーションミニ操作
  mmdMotionFavs: Array.isArray(prefs.mmdMotionFavs) ? prefs.mmdMotionFavs.filter(x => typeof x === "string").slice(0, 50) : [],  // 🩷 ⭐お気に入りモーション
  mmdCredit: typeof prefs.mmdCredit === "string" ? prefs.mmdCredit.slice(0, 120) : "",
  activePack: typeof prefs.activePack === "string" ? prefs.activePack : null,
  previewEnabled: prefs.previewEnabled !== false,
  libSort: pick(prefs.libSort, ["name", "plays", "recent", "best"], "name"),
  shortMode: pick(prefs.shortMode, ["off", "90", "120", "180"], "off"),      // 🕹️ ショートプレイ（後半だけ遊ぶ・初期オフ）
  libTab: typeof prefs.libTab === "string" ? prefs.libTab : "all",            // 📚 選んでいる棚（タブ）のID
  playlists: (Array.isArray(prefs.playlists) ? prefs.playlists : []).filter(p => p && typeof p === "object").slice(0, 100),  // 🎧 ユーザー定義＋公式カタログ由来プレイリスト（library.js が読み込み時に検証）
  plFolders: (Array.isArray(prefs.plFolders) ? prefs.plFolders : []).filter(f => f && typeof f === "object").slice(0, 12),  // 📁 プレイリストフォルダ（ネスト可。library.js が検証）
  playlistDelMode: prefs.playlistDelMode === "three" ? "three" : "one",       // 🎧 タブの中クリック削除を3回にするモード
  plAuthorTools: prefs.plAuthorTools === true,                                // 👥 投稿者ツール（初期オフ。library.js）
  plAuthorName: typeof prefs.plAuthorName === "string" ? prefs.plAuthorName.slice(0, 24) : "",   // 👤 共有ファイルに添える投稿者名
  plAuthorBlock: (Array.isArray(prefs.plAuthorBlock) ? prefs.plAuthorBlock : []).map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 100),   // 🚫 ブロックした投稿者
  plAuthorFav: (Array.isArray(prefs.plAuthorFav) ? prefs.plAuthorFav : []).map(x => String(x).slice(0, 24)).filter(Boolean).slice(0, 100),        // ⭐ お気に入り投稿者
  plAuthorOnly: prefs.plAuthorOnly === true,                                  // 👥 ⭐のお気に入り投稿者だけ表示
  libSkin: typeof prefs.libSkin === "string" ? prefs.libSkin : "player",      // 📚 棚のスキン（js/lib-skins.js が検証）
  libSkinQuick: prefs.libSkinQuick !== false,                                 // 📚 曲リストの 🎨 ボタンを出す
  libKeepShared: prefs.libKeepShared === true,                                // 📤💾 共有で取り込んだ曲を端末に残す（初期オフ。library.js）
  trkPlaylist: prefs.trkPlaylist !== false,                               // 🐔 trk's playlist（右端のタブ。チュートリアル後に自動追加。設定で非表示可）
  trkClassic: prefs.trkClassic !== false,                                // 🎻 trk classic（クラシック名盤。ゲームとは別枠で100曲。設定で非表示可）
  trkSortABC: prefs.trkSortABC === true,                                 // 🔤 trk フォルダ内をABC順で並べる（初期オフ）
  trkTabName: pick(prefs.trkTabName, TRK_ENUM_VALUES.trkTabName, "full"), // 🐔 タブの表示名（full=trk's playlist／short=trk's／icon=🐔 だけ）
  playlistOrder: (Array.isArray(prefs.playlistOrder) ? prefs.playlistOrder : []).map(x => String(x).slice(0, 48)).filter(Boolean).slice(0, 200), // ↕ 自由並べ替え（初期は作成順）
  /* 📊 スペクトラム（js/spectrum.js が値と実在を検証して読み戻す） */
  specOn: prefs.specOn !== false,                                             // 表示する（初期オン）
  /* 見え方と色の一覧は spectrum.js（このあとに読み込む）が決めています。ここでは
     TrkSpec があればその一覧、なければ初期のぶんで検証し、spectrum.js の読み込み時に
     もう一度 prefs から読み直して広げます（core.js 側の直し忘れを防ぐ）。 */
  specStyle: pick(prefs.specStyle, (window.TrkSpec && TrkSpec.styles()) || ["ring", "bars", "mirror", "wave"], "ring"),
  specTheme: pick(prefs.specTheme, (window.TrkSpec && TrkSpec.themes()) || ["neon", "sunset", "mono", "rainbow"], "neon"),
  specGain: num(prefs.specGain, .4, 2.5, 1),
  specPeaks: prefs.specPeaks !== false,
  specTv: prefs.specTv === true,                                              // 📺 TVに重ねる（初期オフ）
  specSkin: prefs.specSkin !== false,                                         // 📊 曲名バナーをスキンにする（初期オン）
  specSkinOpen: prefs.specSkinOpen === true,                                  // 大きく開いた状態（初期は閉じ）
  /* プレイオプション */
  lives: pick(prefs.lives, ["standard", "knight", "chicken", "none"], "standard"),
  countdown: prefs.countdown !== false,
  countdownSE: prefs.countdownSE !== false,
  resumeCountdown: prefs.resumeCountdown !== false,
  judge: pick(prefs.judge, ["lenient", "standard", "strict"], "standard"),
  rate: num(prefs.rate, .5, 3, 1),          // 上限は speed.js が「2.0x・3.0x も使う」の設定に合わせて決め直します
  hidden: !!prefs.hidden,
  sudden: !!prefs.sudden,
  modMirror: !!prefs.modMirror,
  modRandom: !!prefs.modRandom,
  cover: num(prefs.cover, .2, .7, .4),
  catchNitroBonus: prefs.catchNitroBonus !== false,
  /* ▶ メディアプレーヤー（TV電源長押し） */
  mediaRepeat: pick(prefs.mediaRepeat, ["off", "one", "all"], "off"),
  mediaShuffle: prefs.mediaShuffle === true,
  mediaRate: num(prefs.mediaRate, .5, 2, 1),
  mediaLoopTrigger: pick(prefs.mediaLoopTrigger, ["toggle", "hold"], "toggle"),
  mediaWallTrigger: pick(prefs.mediaWallTrigger, ["toggle", "hold"], "toggle"),
  mediaWallStyle: pick(prefs.mediaWallStyle, ["midnight", "aurora", "paper", "custom"], "midnight"),
  mediaWallClock: prefs.mediaWallClock !== false,
  mediaWallStopsVideo: prefs.mediaWallStopsVideo !== false,
  /* ✨ フレーム補完（js/frame-interp.js）。既定はオフ（重いので） */
  frameInterp: pick(prefs.frameInterp, ["off", "blend", "flow"], "off"),
  frameInterpStrength: num(prefs.frameInterpStrength, 0, 1, .85)
};
function saveUserPrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(settings)); } catch (_) {} }
function rememberMusicVolume(value) {
  const volume = Number(value);
  if (Number.isFinite(volume) && volume > 0) settings.musicVolumeRestore = Math.min(1, Math.max(.01, volume));
}
/* プレイ中の追加演出だけをまとめて抑える。音声エフェクターの設定とは別です。 */
const gameplayFxMultiplier = () => settings.gameFxMode === "off" ? 0 : settings.gameFxMode === "soft" ? .42 : 1;
const gameplayFxPower = () => settings.fxPower * gameplayFxMultiplier();

/* ---------- URLコマンドによる緊急リセット & 設定の書き出し ----------
   画面が触れなくなった時でもURLで復旧できるようにする。
   例:
     ?safe=1 / ?safe / #safe          → セーフモード（映像OFF・ぼかし無し・TVは家庭用）
     ?reset=tv / ?reset=video         → 映像・TVまわりだけデフォルトに戻す
     ?reset=audio / ?reset=sound      → 音量・SEをデフォルトに戻す
     ?reset=notes                     → ノーツ色・形をデフォルトに戻す（確認あり）
     ?reset=amp / ?reset=rack         → 🔥 TRKアンプ（🎚 エフェクターラック）を空に戻す
     ?reset=all                      → 全設定リセット（ノーツも含む）。実行前に確認します（&force=1 で確認を飛ばす）
     ?reset=factory / ?reset=full     → 上と同じ（別名）
     ?factory                        → セーフモード（?safe=1 と同じ。全リセットではない。js/addons.js も同じ解釈）
     ?export=notes / ?export=all      → 設定をJSONでダウンロード
   ノーツ設定は細かく詰める人が多いので、tv/audioリセットでは保持される。 */
/* ♻️ 全設定リセットの確認ダイアログ。
   ?reset=all はリンクを踏むだけで（ノーツ・音量・映像・キー・プレイリストまで）消えるため、
   実行前にここで一度止めます。&force=1 を付けたときだけ、そのまま実行します。
   ダイアログは素のDOMで作るので、ほかの機能が壊れていても出せます（ESC・外側クリック＝やめる）。 */
function askFactoryReset(onYes, onNo) {
  const wrap = document.createElement("div");
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.dataset.trkAsk = "factory";   /* 見つけやすさのために印を付ける（テスト・支援技術） */
  wrap.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px";
  const card = document.createElement("div");
  card.style.cssText = "max-width:min(92vw,470px);background:#16181d;color:#f2f3f5;border:2px solid #ff3d7f;border-radius:14px;padding:16px 18px;box-shadow:0 10px 40px rgba(0,0,0,.6);font:15px/1.65 system-ui,sans-serif";
  const title = document.createElement("b");
  title.textContent = "♻️ " + tr("factoryAskTitle");
  title.style.cssText = "font-size:17px";
  const body = document.createElement("div");
  body.textContent = tr("factoryAskBody");
  body.style.cssText = "margin:8px 0 4px;white-space:pre-line";
  const hint = document.createElement("div");
  hint.textContent = tr("factoryForceHint");
  hint.style.cssText = "opacity:.65;font-size:12px;margin-bottom:12px";
  const rowBox = document.createElement("div");
  rowBox.style.cssText = "display:flex;gap:10px;flex-wrap:wrap";
  const yes = document.createElement("button");
  yes.type = "button"; yes.textContent = tr("factoryAskYes");
  yes.style.cssText = "flex:1 1 auto;min-height:44px;padding:10px 14px;border-radius:10px;border:0;background:#ff3d7f;color:#fff;font-weight:700;font-size:15px;cursor:pointer";
  const no = document.createElement("button");
  no.type = "button"; no.textContent = tr("factoryAskNo");
  no.style.cssText = "flex:1 1 auto;min-height:44px;padding:10px 14px;border-radius:10px;border:1px solid #555;background:#22252b;color:#f2f3f5;font-size:15px;cursor:pointer";
  const close = () => { document.removeEventListener("keydown", onKey); wrap.remove(); };
  const onKey = e => {
    if (e.key !== "Escape") return;
    close();
    if (typeof onNo === "function") onNo();
  };
  yes.addEventListener("click", () => { close(); if (typeof onYes === "function") onYes(); });
  no.addEventListener("click", () => { close(); if (typeof onNo === "function") onNo(); });
  wrap.addEventListener("click", e => { if (e.target === wrap) { close(); if (typeof onNo === "function") onNo(); } });
  document.addEventListener("keydown", onKey);
  rowBox.append(yes, no);
  card.append(title, body, hint, rowBox);
  wrap.append(card);
  (document.body || document.documentElement).append(wrap);
  try { no.focus(); } catch (_) {}
}
function resetVideoPrefs() {
  settings.videoStyle = "color";
  settings.videoZoom = 1; settings.videoKeys = VIDEO_KEY_DEFAULTS.slice(); settings.castPolicy = "off"; settings.backgroundPolicy = "off"; settings.fxAntenna = false; settings.fxAntennaShape = "rod"; settings.fxAntennaCustomOn = ""; settings.fxAntennaCustomOff = ""; settings.mediaLoopTrigger = "toggle"; settings.mediaWallTrigger = "toggle"; settings.mediaWallStyle = "midnight"; settings.mediaWallClock = true; settings.mediaWallStopsVideo = true; settings.mediaExitKey = "Escape"; settings.mediaExitConfirm = true;
  settings.bgDim = 0; settings.bgBlur = 0;
  /* ✨ TRKエフェクト（リッチ映像。js/tv-rich.js）の記憶も一緒に戻す */
  settings.tvRichId = "portrait_natural"; settings.tvRichPrev = ""; settings.tvRichCat = "portrait"; settings.tvRichOpen = true;   /* 初期状態に戻す＝欄は開いておく */
  settings.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs); // user bookmarks survive a TV-only reset
  settings.tvDockSkin = "cinema"; settings.tvDockFive = false;
  settings.tvOrder = "tv-first"; settings.tvOverlay = true;
  settings.tvPowerPrev = "color"; settings.previewEnabled = true;
  settings.tvSongWhilePlaying = false;   /* ◀▶ を演奏中も効かせる設定も一緒に戻す */
  /* tv-dock.js の「選曲中に映像を流す」も一緒に戻す */
  settings.tvMenuPreview = true; settings.tvMenuVideo = false;
  /* 📊 スペクトラム（js/spectrum.js）も映像まわりとして一緒に戻す */
  settings.specOn = true; settings.specStyle = "ring"; settings.specTheme = "neon";
  settings.specGain = 1; settings.specPeaks = true; settings.specTv = false;
  settings.specSkin = true; settings.specSkinOpen = false;
  if (typeof view !== "undefined" && view) { try { view.style.filter = videoFilter(); } catch(_) {} }
  if (typeof menuVideoTick === "function") { try { menuVideoTick(); } catch(_) {} }
}
function resetAudioPrefs() {
  settings.musicVolume = 0.7; settings.musicVolumeRestore = 0.7; settings.seVolume = 0.28; settings.seEnabled = false; settings.bannerPause = false; settings.bannerSongBtns = true;
  settings.bannerRandomBtn = true; settings.bannerRandomTap = false;
  settings.synthModeDisabled = false; settings.synthModeFastStart = false; settings.synthModeKeyboardLock = true; settings.synthModeWideKeyboard = false;
  // fx-dock / eq-dock の音まわりがあれば一緒に初期化
  if ("gameVolume" in settings) settings.gameVolume = 0.7;
  if ("eqEnabled" in settings) settings.eqEnabled = false;
  if ("eqLow" in settings) { settings.eqLow = 0; settings.eqMid = 0; settings.eqHigh = 0; }
  if ("compEnabled" in settings) settings.compEnabled = false;
  try { if (typeof window._trkSyncSynthModeSettings === "function") window._trkSyncSynthModeSettings(); } catch (_) {}
}
function resetLitePrefs() {
  /* 🪶 軽量化（js/lite.js）。?reset=lite と trkReset('lite') から呼びます */
  settings.liteMode = "auto"; settings.liteFps = "30"; settings.liteMascot = "30"; settings.liteScale = "1.5";
  settings.liteSpectrumOff = true; settings.liteFx = true; settings.liteBlur = true; settings.liteGameFull = false;
  settings.liteDecor = true; settings.liteLibRows = "device"; settings.liteNoAnalyze = false; settings.liteMascotNoLoad = false;
  if (typeof liteSyncUI === "function") { try { liteSyncUI(); } catch (_) {} }
}
function resetNotesPrefs() {
  try {
    const def = (typeof NOTE_PRESETS !== "undefined" && NOTE_PRESETS.standard) ? NOTE_PRESETS.standard : null;
    if (def) settings.notes = JSON.parse(JSON.stringify(def));
    else settings.notes = sanitizeNotes(null);
    applyNoteVars();
  } catch(_) { settings.notes = sanitizeNotes(null); }
}
/* 🔥 TRKアンプ（🎚 エフェクターラック・js/fx.js。左下の独立カテゴリー）のリセット。
   fx.js は core.js よりあとに読み込まれるので、読み込み時点では settings.fx… がまだ無い。
   そのため一度きりの合図を残し、fx.js が読み込み時に拾って片づける
   （"clear"＝段を空にする／"off"＝段はそのまま止める）。すでに読み込まれているときは、その場でも外す。 */
const AMP_RESET_KEY = "trk_amp_reset_once";
function markAmpReset(mode) { try { sessionStorage.setItem(AMP_RESET_KEY, mode); } catch (_) {} }
function takeAmpReset() {
  try {
    const m = sessionStorage.getItem(AMP_RESET_KEY);
    sessionStorage.removeItem(AMP_RESET_KEY);
    return m === "clear" || m === "off" ? m : "";
  } catch (_) { return ""; }
}
function resetAmpPrefs() {
  if ("fxRack" in settings) settings.fxRack = [];
  if ("fxRackOn" in settings) settings.fxRackOn = false;
  settings.ampOpen = true;   /* 初期状態に戻す＝欄は開いておく（?safe=1 だけは閉じたまま＝下の enterSafeMode） */
  markAmpReset("clear");
  try { if (window.TrkFX && typeof TrkFX.rackClear === "function") { TrkFX.rackClear(); TrkFX.rackOn(false); } } catch (_) {}
}

/* セーフモードに入ったかどうか（?safe=1 / ?factory で入る）。
   アドオン（js/addons.js）など、あとから来る機能は、これを見て「読み込まない」を決めます。
   URLは処理のあと掃除されるので、印を残しておく必要があります。 */
let safeModeOn = false;
window.TrkSafeMode = () => safeModeOn;
function enterSafeMode() {
  safeModeOn = true;
  settings.videoStyle = "off";
  settings.videoZoom = 1; settings.castPolicy = "off"; settings.backgroundPolicy = "off"; settings.fxAntenna = false;
  settings.bgDim = 0; settings.bgBlur = 0;
  settings.tvParamFavs = []; // safe mode starts with no saved TV adjustment pairs
  settings.tvDockSkin = "cinema"; settings.tvDockFive = false;
  settings.tvOrder = "tv-first"; settings.tvOverlay = false;
  settings.previewEnabled = false;
  settings.tvMenuPreview = false; settings.tvMenuVideo = false;   // セーフモードは映像を流さない
  settings.tvSongWhilePlaying = false;                            // セーフモードでは演奏中の曲送りもしない
  settings.specOn = false; settings.specTv = false;               // 📊 スペクトラムも出さない（音の通り道を作らない）
  settings.specSkin = false; settings.specSkinOpen = false;
  settings.synthModeKeyboardLock = true; // 🎹 セーフモードではシンセを開けないが、既定値は壊さない
  settings.synthModeWideKeyboard = false;
  settings.libKeepShared = false;        // 📤 セーフモードでは、端末に残した共有の曲も読み戻さない
  settings.fxPower = 0; settings.gameFxMode = "off"; settings.hideGameplayUI = false;
  /* 🔥 TRKアンプも安全側へ（段は消さず、止めるだけ。fx.js が読み込み時に拾う） */
  if ("fxRackOn" in settings) settings.fxRackOn = false;
  markAmpReset("off");
  settings.tvRichOpen = false;   /* ✨ TRKエフェクトの欄も安全側では閉じておく */
  if (settings.mascot === "mmd") settings.mascot = "skin";     // 🩷 セーフモードでは MMD を使わない
  if (settings.mascot === "vrm") settings.mascot = "skin";     // 🧍 同じ理由で VRM も使わない（CDNのライブラリを読まない）
  if (typeof view !== "undefined" && view) { try { view.style.filter = "none"; } catch(_) {} }
}
function resetKeysPrefs() {
  /* ⌨ キー割り当て（🎮 パッド含む）。?reset=keys と trkReset('keys') から呼びます */
  settings.keys = KEY_PRESETS.standard.keys.slice();
  settings.subKeys = KEY_PRESETS.standard.sub.slice();
  settings.menuKey = "KeyM"; settings.mediaExitKey = "Escape";
  settings.padEnabled = true; settings.padMenuNav = true;
  settings.padLeft = PAD_DEFAULTS.left; settings.padRight = PAD_DEFAULTS.right;
  settings.padConfirm = PAD_DEFAULTS.confirm; settings.padBack = PAD_DEFAULTS.back; settings.padPause = PAD_DEFAULTS.pause;
}
function resetAllPrefs() {
  resetVideoPrefs(); resetAudioPrefs(); resetNotesPrefs(); resetLitePrefs(); resetKeysPrefs(); resetAmpPrefs();
  settings.liteSeen = false;   // 🪶 工場出荷状態では、スマホ向けの初回案内もやり直す
  settings.tvParamFavs = []; // a factory reset clears the separately preserved TV bookmarks too
  settings.trkPlaylist = true; // 🐔 trk's playlistも初期状態に戻す（再表示）
  settings.trkClassic = true;  // 🎻 trk classic も初期状態に戻す
  settings.trkSortABC = false; settings.playlistOrder = []; settings.trkTabName = "full"; settings.chartGen = "2";
  settings.fxPower = 1.5; settings.gameFxMode = "full"; settings.hideGameplayUI = false; settings.helpText = true; settings.tutorialDone = false; settings.tutorialStamps = []; settings.skinGradUnlocked = false; settings.playlists = []; settings.plFolders = []; settings.playlistDelMode = "one"; settings.plAuthorTools = false; settings.plAuthorName = ""; settings.plAuthorBlock = []; settings.plAuthorFav = []; settings.plAuthorOnly = false; settings.menuKey = "KeyM"; settings.menuConfirm = true; settings.mediaExitKey = "Escape"; settings.mediaExitConfirm = true; settings.errorMeter = true;
  settings.scroll = 1.2; settings.latency = 0;
  settings.catchNitroBonus = true; settings.mediaRepeat = "off"; settings.mediaShuffle = false; settings.mediaRate = 1; settings.mediaLoopTrigger = "toggle"; settings.videoKeys = VIDEO_KEY_DEFAULTS.slice();
  settings.judge = "standard"; settings.rate = 1; settings.shortMode = "off"; settings.shortMode = "off";
  settings.hidden = false; settings.sudden = false; settings.modMirror = false; settings.modRandom = false; settings.showMasterDiff = false;
  settings.mascot = "skin"; settings.vrmFrame = "full";
  settings.mmdScale = 1; settings.mmdTurn = 0; settings.mmdMotionBpm = 0; settings.mmdMotionKind = "faceSing";
  settings.mmdQuickUI = true; settings.mmdMotionFavs = [];
  settings.skin = "shadow"; settings.layout = "classic";
}
function exportPrefs(kind) {
  const out = {};
  if (kind === "notes") out.notes = settings.notes;
  else if (kind === "tv" || kind === "video") {
    out.videoStyle = settings.videoStyle; out.bgDim = settings.bgDim; out.bgBlur = settings.bgBlur;
    /* ✨ TRKエフェクト（リッチ映像）の記憶も、映像の書き出しに一緒に乗せる */
    out.tvRichId = settings.tvRichId; out.tvRichPrev = settings.tvRichPrev; out.tvRichCat = settings.tvRichCat; out.tvRichOpen = settings.tvRichOpen;
    out.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs);
    out.tvDockSkin = settings.tvDockSkin; out.tvDockFive = settings.tvDockFive; out.tvOrder = settings.tvOrder;
    out.tvOverlay = settings.tvOverlay; out.previewEnabled = settings.previewEnabled; out.fxPower = settings.fxPower;
    out.tvMenuPreview = settings.tvMenuPreview; out.tvMenuVideo = settings.tvMenuVideo;
  } else if (kind === "audio") {
    out.musicVolume = settings.musicVolume; out.musicVolumeRestore = settings.musicVolumeRestore; out.seEnabled = settings.seEnabled; out.seVolume = settings.seVolume;
    out.synthModeDisabled = settings.synthModeDisabled; out.synthModeFastStart = settings.synthModeFastStart;
    out.synthModeKeyboardLock = settings.synthModeKeyboardLock;
    out.synthModeWideKeyboard = settings.synthModeWideKeyboard;
    if ("gameVolume" in settings) out.gameVolume = settings.gameVolume;
  } else { // all
    Object.assign(out, settings);
  }
  try { downloadJSON(out, `trk-${kind || "all"}-` + new Date().toISOString().slice(0,10) + ".json"); } catch(e){ console.error(e); }
}
function parseHashParams(hash) {
  /* ⚠ 小文字にするのは**キーだけ**（値まで小文字にすると、将来ケースを区別する値を
     hash に足したときに静かに壊れる）。URLSearchParams の形は保つ（検査もそのまま通る）。 */
  const out = new URLSearchParams();
  for (const [k, v] of new URLSearchParams(String(hash || "").replace(/^#/, ""))) out.append(k.toLowerCase(), v);
  return out;
}
// URLパラメータを解釈して即時実行（ロード時）
(function handleUrlCommands() {
  try {
    const url = new URL(location.href);
    const sp = url.searchParams;
    const hashParams = parseHashParams(location.hash);
    const get = k => sp.get(k);
    const has = k => sp.has(k) || hashParams.has(k);
    let didReset = "";
    let doExport = "";
    let pendingFactory = false;   /* ♻️ 確認待ちの ?reset=all / #reset=all */
    // export は先に判定（リセットと同時も可）
    if (has("export")) doExport = ((sp.has("export") ? get("export") : hashParams.get("export")) || "all").toLowerCase();
    // safe / safety
    /* ⚠ ?factory 単体は**全リセットではなくセーフモードの合図**（?safe=1 と同じ）。
       js/addons.js の safeNow() が昔から sp.has("factory") をセーフ扱いにしており、
       core.js の「?factory で入る」というコメントとも一致する。壊す動作にしないのが安全側。
       全リセットは ?reset=all / ?reset=factory / #reset=all（いずれも確認ダイアログ）。 */
    if (has("safe") || has("safety") || sp.has("factory")) {
      enterSafeMode(); didReset = "safe";
    } else if (get("reset")) {
      const r = get("reset").toLowerCase();
      if (["tv","video","screen"].includes(r)) { resetVideoPrefs(); didReset = "tv"; }
      else if (["audio","sound","volume"].includes(r)) { resetAudioPrefs(); didReset = "audio"; }
      else if (["notes","note"].includes(r)) { resetNotesPrefs(); didReset = "notes"; }
      else if (["lite","light"].includes(r)) { resetLitePrefs(); didReset = "lite"; }
      else if (["keys","key","pad","controller","input"].includes(r)) { resetKeysPrefs(); didReset = "keys"; }
      else if (["amp","rack"].includes(r)) { resetAmpPrefs(); didReset = "amp"; }
      else if (["all","factory","full"].includes(r)) {
        /* ♻️ いちばん危ないリセット。リンクを踏んだだけで消えないよう、確認を挟む（&force=1 で省略） */
        if (sp.get("force") === "1") { resetAllPrefs(); didReset = "all"; } else pendingFactory = true;
      }
    } else if (hashParams.has("reset")) {
      const r = (hashParams.get("reset") || "").toLowerCase();
      if (["audio","sound","volume"].includes(r)) { resetAudioPrefs(); didReset = "audio"; }
      else if (["notes","note"].includes(r)) { resetNotesPrefs(); didReset = "notes"; }
      else if (["lite","light"].includes(r)) { resetLitePrefs(); didReset = "lite"; }
      else if (["keys","key","pad","controller","input"].includes(r)) { resetKeysPrefs(); didReset = "keys"; }
      else if (["amp","rack"].includes(r)) { resetAmpPrefs(); didReset = "amp"; }
      else if (["all","factory","full"].includes(r)) {
        if (hashParams.get("force") === "1") { resetAllPrefs(); didReset = "all"; } else pendingFactory = true;
      }
      else { resetVideoPrefs(); didReset = "tv"; }
    }
    if (!didReset) {
      if (sp.has("tv") || sp.has("filter")) {
        const f = sp.get("tv") || sp.get("filter");
        if (typeof f === "string" && f.length < 50 && VIDEO_STYLE_IDS.includes(f)) {
          settings.videoStyle = f;
          saveUserPrefs();
        }
      }
      if (sp.has("skin") || sp.has("tvskin")) {
        /* tv-dock.js loads its saved custom skins after core.js. Hand the requested ID over
           for validation against that complete allowlist there; never persist raw URL text. */
        const s = sp.get("skin") || sp.get("tvskin");
        if (typeof s === "string" && s.length < 50) window.__trkPendingTvDockSkin = s;
      }
    }
    if (didReset || doExport || pendingFactory) {
      if (!pendingFactory) saveUserPrefs();   /* 確認待ちの間は、まだ何も保存し直さない */
      // URLを綺麗にする（リセットループ防止）
      try {
        const clean = new URL(location.href);
        clean.searchParams.delete("reset"); clean.searchParams.delete("safe"); clean.searchParams.delete("safety"); clean.searchParams.delete("factory"); clean.searchParams.delete("force");
        // export は残しても良いが、一度だけにするために削除
        if (doExport) clean.searchParams.delete("export");
        const cleanHash = parseHashParams(clean.hash);
        if (["reset", "safe", "safety", ...(doExport ? ["export"] : [])].some(k => cleanHash.has(k))) clean.hash = "";
        history.replaceState(null, "", clean.toString());
      } catch(_) {}
      if (pendingFactory) {
        /* ♻️ 実行するかどうかを聞く。はい＝リセットして再読み込み（全部を確実に適用するため）、
           いいえ＝何もしない。URLはもう綺麗にしてあるので、聞き直しにはなりません。 */
        setTimeout(() => {
          const toast = text => {
            if (typeof caption !== "undefined") caption = { text, t: performance.now() };
            const b = document.createElement("div");
            b.textContent = text;
            b.style.cssText = "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:2px solid #ff3d7f;padding:10px 16px;border-radius:10px;max-width:90vw;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.6)";
            document.body.appendChild(b);
            setTimeout(() => b.remove(), 5000);
          };
          askFactoryReset(
            () => { resetAllPrefs(); saveUserPrefs(); toast("♻️ " + tr("factoryAskYes")); setTimeout(() => location.reload(), 400); },
            () => toast(tr("factoryAskCanceled"))
          );
        }, 300);
      }
      // バナー表示は DOM 構築後に行うため、少し遅延
      setTimeout(() => {
        if (doExport) exportPrefs(doExport);
        if (!didReset) return;
        const msg = {
          safe: "🛟 セーフモード：映像OFF・ぼかし無し・TVを初期化しました（?safe）",
          tv: "📺 映像・TV設定を初期化しました（?reset=tv）",
          audio: "🔊 音量・SE設定を初期化しました（?reset=audio）",
          notes: "🎨 ノーツ設定を初期化しました（?reset=notes）",
          lite: "🪶 軽量化の設定を初期化しました（?reset=lite）",
          keys: "🎮 キー割り当て（パッド・リモコン含む）を初期化しました（?reset=keys）",
          amp: "🔥 TRKアンプ（エフェクターラック）を空に戻しました（?reset=amp）",
          all: "♻️ 全設定を初期化しました（?reset=all）"
        }[didReset] || `リセットしました: ${didReset}`;
        // 既存のcaptionシステムがあれば使う、なければalert風div
        if (typeof caption !== "undefined") { caption = { text: msg, t: performance.now() }; }
        const b = document.createElement("div");
        b.textContent = msg + " — ページを再読み込みせずに復旧しました。URLパラメータは自動で削除されました。";
        b.style.cssText = "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;background:#111;color:#fff;border:2px solid #0f0;padding:10px 16px;border-radius:10px;max-width:90vw;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.6)";
        document.body.appendChild(b);
        setTimeout(()=> b.remove(), 6000);
      }, 400);
    }
    // グローバルからも手動で呼べるように公開
    window.trkReset = (k="tv") => {
      k = String(k).toLowerCase();
      if (["all","factory"].includes(k)) {
        /* ♻️ コンソールからの trkReset("all") も、消す前に確認する */
        askFactoryReset(() => { resetAllPrefs(); saveUserPrefs(); location.reload(); }, () => {});
        return;
      }
      if (k==="safe") enterSafeMode(); else if (["tv","video"].includes(k)) resetVideoPrefs(); else if (["audio","sound"].includes(k)) resetAudioPrefs(); else if (k==="notes") resetNotesPrefs(); else if (["lite","light"].includes(k)) resetLitePrefs(); else if (["keys","key","pad","controller","input"].includes(k)) resetKeysPrefs(); else if (["amp","rack"].includes(k)) resetAmpPrefs(); else resetVideoPrefs();
      saveUserPrefs(); location.reload();
    };
    window.trkExport = (k="all") => exportPrefs(String(k).toLowerCase());
  } catch(e) { console.error("url command failed", e); }
})();


const skin = () => has(SKINS, settings.skin) ? SKINS[settings.skin] : SKINS.shadow;
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
/* 外から来た文字列を <a href> にする前の関所（🛡 セキュリティ）。
   javascript: / data: / vbscript: / blob: などはリンクにしない＝クリックでコードが動く経路を作らない。
   共有パックの名刺・プレゼントの入手先・イベントの作者リンクなど、他人が作った文字列は必ずここを通す。
   読めれば用は足りるので、危ない URL は「リンクにせず、ただの文字」として出す（情報は消さない）。 */
function safeHttpUrl(v) {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s.length > 300) return "";
  try {
    const u = new URL(s, location.href);
    return u.protocol === "https:" && u.hostname ? u.href : "";
  } catch (_) { return ""; }
}
function safeLink(cls, url, text) {
  const label = text != null ? String(text) : String(url == null ? "" : url);
  const href = safeHttpUrl(url);
  const n = href ? el("a", cls, label) : el("span", cls, label);
  if (href) { n.href = href; n.target = "_blank"; n.rel = "noopener noreferrer"; }
  return n;
}
/* 設定の読み込みなどで、オブジェクトを丸ごと書き戻すときに踏んではいけないキー
   （__proto__ を代入すると、そのオブジェクトの継承先ごと入れ替わってしまう） */
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
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
    BracketLeft:"[", BracketRight:"]", Quote:"'", Backslash:"\\", Minus:"-", Equal:"=", Backquote:"`", Enter:"Enter", Backspace:"BS",
    PageUp:"PgUp", PageDown:"PgDn", Insert:"Ins", Delete:"Del", Tab:"Tab", ContextMenu:"Menu", CapsLock:"Caps",
    MediaPlayPause:"⏯", MediaPlay:"▶", MediaPause:"⏸", MediaStop:"⏹", MediaTrackNext:"⏭", MediaTrackPrevious:"⏮",
    VolumeUp:"Vol+", VolumeDown:"Vol−", VolumeMute:"🔇", ChannelUp:"CH+", ChannelDown:"CH−",
    BrowserBack:"←戻る", GoBack:"←戻る", ColorF0Red:"🔴", ColorF1Green:"🟢", ColorF2Yellow:"🟡", ColorF3Blue:"🔵" };
  return map[code] || code.replace(/^Numpad/, "Num ");
}
/* 🎮 パッドの割り当てを表示用に（ボタン0 → 「ボタン0・A／×」） */
const PAD_BUTTON_NAMES = { 0:"A／×", 1:"B／○", 2:"X／□", 3:"Y／△", 4:"LB／L1", 5:"RB／R1", 6:"LT／L2", 7:"RT／R2",
  8:"Back／Share", 9:"Start／Options", 10:"L3", 11:"R3", 12:"↑", 13:"↓", 14:"←", 15:"→", 16:"Home／PS" };
/* 軸の名前は、どの言語でも読める short 表記（L-Stick ← など）にする */
const PAD_AXIS_NAMES = { 0:["L-Stick ←", "L-Stick →"], 1:["L-Stick ↑", "L-Stick ↓"],
  2:["LT", "RT"], 3:["R-Stick ←", "R-Stick →"], 4:["R-Stick ↑", "R-Stick ↓"],
  9:["D-pad ←", "D-pad →"], 10:["D-pad ↑", "D-pad ↓"] };
function formatPadBind(bind) {
  if (!validPadBind(bind)) return tr("unset");
  if (bind[0] === "b") {
    const n = +bind.slice(1), name = PAD_BUTTON_NAMES[n];
    return tr("padBtn", { n, name: name ? "・" + name : "" });
  }
  const axis = +bind.slice(1, -1), dir = bind.endsWith("+") ? 1 : 0, name = PAD_AXIS_NAMES[axis];
  return tr("padAxis", { n:axis, dir: name ? name[dir] : (bind.endsWith("+") ? "＋" : "−") });
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
  const d = DIFF_IDS.includes(chartDiff) ? DIFFS[chartDiff] : DIFFS.normal;
  const k = Object.prototype.hasOwnProperty.call(JUDGE_SCALE, settings.judge) ? JUDGE_SCALE[settings.judge] : 1;
  return { perfect:d.perfect * k, good:d.good * k };
};

/* ---------- MOD（プレイオプション）の表示 ---------- */
function activeMods() {
  const m = [];
  if (settings.hidden) m.push("HD");
  if (settings.sudden) m.push("SD");
  if (settings.modMirror) m.push("MIRROR");
  if (settings.modRandom) m.push("RANDOM");
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
  const lifeTag = Object.prototype.hasOwnProperty.call(LIVES_TAG, settings.lives) ? LIVES_TAG[settings.lives] : "";
  const mods = [...activeMods(), ...(lifeTag ? [lifeTag] : []), ...(settings.autoPlay ? ["▶ AUTO"] : [])];
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

/* ブラウザ内保存（IndexedDB）。データベース名はこれまでと同じものを使います。
   opts（省略可）：
     sizeKey … レコードのサイズを入れているキー名。これを渡すと**そのキーに index を張り**、
               合計を「index のキー（数値）だけ」で数えられるようになる（レコード本体＝Blob を復元しない）。
     sizeOf  … sizeKey が無い古いレコードからサイズを計算する関数（index への移行と、数え直しの両方で使う）。 */
const IDB_VERSION = 2;   /* v2＝サイズ index。v1→v2 の移行で size を持たない古いレコードへ書き戻す */
function idbStore(dbName, store = "kv", opts = null) {
  const opt = opts || {};
  const sizeKey = opt.sizeKey || "";
  const sizeOf = typeof opt.sizeOf === "function" ? opt.sizeOf
    : (rec => (rec && Number.isFinite(rec[sizeKey]) ? rec[sizeKey] : 0));
  let p = null;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open(dbName, IDB_VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      const os = r.transaction.objectStore(store);
      if (!sizeKey || os.indexNames.contains(sizeKey)) return;
      os.createIndex(sizeKey, sizeKey);
      /* ⚠ 移行を省くと「size を持たないレコード」が index に載らず、**合計が過小**になって
         上限を素通しする（＝危険な方向）。なので v1→v2 の一度きりで size を書き戻す。 */
      const cur = os.openCursor();
      cur.onsuccess = () => {
        const c = cur.result; if (!c) return;
        const rec = c.value;
        if (rec && typeof rec === "object" && !Array.isArray(rec) && !Number.isFinite(rec[sizeKey])) {
          try { c.update(Object.assign({}, rec, { [sizeKey]: sizeOf(rec) })); } catch (_) {}
        }
        c.continue();
      };
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => { p = null; rej(r.error); };
    /* ⚠ バージョンを上げたので、古いタブが v1 を掴んでいるとブロックされる。
       onblocked を貼らないと onsuccess も onerror も来ず、**保存が永遠に固まる**。 */
    r.onblocked = () => { p = null; rej(new Error("idb-blocked")); };
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const tx = db.transaction(store, mode), req = fn(tx.objectStore(store));
      tx.oncomplete = () => res(req ? req.result : undefined);
      tx.onerror = tx.onabort = () => rej(tx.error);
    });
  };
  /* 合計を index のキー（数値）だけで組み立てる。レコード本体（Blob）を復元しない。
     ⚠ **件数と食い違ったら null を返す**。それは「size を持たないレコードがある」ということで、
        合計が過小＝上限を素通しする危険な向きなので、呼び出し側で全件を数え直させる。 */
  const statsFromKeys = (keys, count, prev) => {
    if (!Array.isArray(keys) || !Number.isFinite(count) || keys.length !== count) return null;
    let stored = 0;
    for (const k of keys) {
      /* 数値でないキー＝壊れた size（文字列など）を持ち込まれた状態。0 として足すと**過小**になるので、
         ここも null を返して全件を数え直させる（安全側＝数え直しに倒す）。 */
      if (!Number.isFinite(k) || k < 0) return null;
      stored += k;
    }
    return { stored, replacing: prev == null ? 0 : sizeOf(prev), count, fast: true };
  };
  /* 全レコードを読む、遅いが確実な経路（index が使えない／件数が食い違ったとき） */
  const statsFromAll = (os, replacingId, cb) => {
    const req = os.getAll();
    req.onsuccess = () => {
      const list = req.result || [];
      cb({
        stored: list.reduce((a, r) => a + sizeOf(r), 0),
        replacing: list.reduce((a, r) => a + (r && replacingId != null && r.id === replacingId ? sizeOf(r) : 0), 0),
        count: list.length, fast: false
      });
    };
  };
  /* stats を取る共通部分。replacingId を渡すと「置き換えられる分」も一緒に返す。 */
  const readStats = (os, replacingId, cb) => {
    const idx = sizeKey && os.indexNames.contains(sizeKey) ? os.index(sizeKey) : null;
    if (!idx) { statsFromAll(os, replacingId, cb); return; }
    let keys = null, count = null, prev = replacingId == null ? null : undefined, out = null;
    const maybe = () => {
      if (out || keys === null || count === null || prev === undefined) return;
      out = statsFromKeys(keys, count, prev);
      if (out) cb(out); else statsFromAll(os, replacingId, s => { out = s; cb(s); });
    };
    idx.getAllKeys().onsuccess = e => { keys = e.target.result || []; maybe(); };
    os.count().onsuccess = e => { count = e.target.result || 0; maybe(); };
    if (replacingId == null) prev = null;
    else os.get(replacingId).onsuccess = e => { prev = e.target.result == null ? null : e.target.result; maybe(); };
  };
  return {
    get: k => run("readonly", s => s.get(k)),
    put: (k, v) => run("readwrite", s => s.put(v, k)),
    /* 合計だけを知りたいとき（Blob を復元しない。件数が食い違えば自動で全件を数え直す） */
    usage: () => open().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, "readonly"), os = tx.objectStore(store);
      readStats(os, null, res);
      tx.onerror = tx.onabort = () => rej(tx.error || new Error("IndexedDB usage read failed"));
    })),
    /* 上限の判定と put を**同じ readwrite トランザクション内**で一体化する（複数タブ間の競合を防ぐ）。
       predicate には全レコードではなく**集計値** { stored, replacing, count, fast } を渡す。 */
    putIf: (k, v, predicate) => open().then(db => new Promise((res, rej) => {
      const tx = db.transaction(store, "readwrite"), os = tx.objectStore(store);
      let permitted = false, checkError = null;
      readStats(os, v && v.id, stats => {
        try {
          permitted = predicate(stats) === true;
          if (permitted) os.put(v, k);
        } catch (e) { checkError = e; tx.abort(); }
      });
      tx.oncomplete = () => res(permitted);
      tx.onerror = tx.onabort = () => rej(checkError || tx.error || new Error("IndexedDB transaction aborted"));
    })),
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
  /* 読み上げ名（aria-label）も同じ辞書から。data-i18n-aria="key" と書く */
  document.querySelectorAll("[data-i18n-aria]").forEach(n => { n.setAttribute("aria-label", tr(n.dataset.i18nAria)); });
  buildSkinGrid(); updateKeyUI(); updateTouchKeys(); refreshSeedSecrets(); syncPickers(); renderAllStatuses();
  if (typeof updatePadUI === "function") updatePadUI();   // 🎮 pad.js（読み込み前は何もしない）
  emit("language");
}

/* ---------- スキン ---------- */
const SKIN_CATS = [["all","catAll"],["basic","catBasic"],["miku","catMiku"],["dark","catDark"],["light","catLight"],["grad","catGrad"],["fun","catFun"],["custom","catCustom"]];
const skinCatList = s => (s.custom || s.pack) ? ["custom"] : (Array.isArray(s.cat) && s.cat.length ? s.cat : ["basic"]);
/* 今 使っているスキン（棚を閉じていても見える）。押すと棚が開く */
function buildSkinNow() {
  const now = $("skinNow"); if (!now) return;
  const s = skin(); now.textContent = "";
  const b = el("button", "skinCard"); b.type = "button";
  b.style.setProperty("--sk-bg", s.game.stage); b.style.setProperty("--sk-text", s.ui["--ui-text"]);
  b.style.setProperty("--sk-border", s.ui["--ui-border"]);
  if (s.font) b.style.fontFamily = s.font;
  const dots = el("span", "dots");
  for (const c of [s.ui["--ui-accent"], s.ui["--ui-gold"], s.ui["--ui-text"]]) { const d = el("i", "dot square"); d.style.background = c; dots.append(d); }
  b.append(dots, el("b", "", s.label[lang] || s.label.en), el("small", "", (s.desc && (s.desc[lang] || s.desc.en)) || ""));
  b.title = tr("skinShelf"); b.setAttribute("aria-label", tr("skinShelf"));
  b.addEventListener("click", () => { const shelf = $("skinShelf"); if (shelf) shelf.open = true; });
  now.append(b);
}
function buildSkinGrid() {
  const grid = $("skinGrid"); if (!grid) return;
  grid.textContent = "";
  /* 棚のチップ（そのカテゴリーに属するスキンがないときはチップ自体を出さない） */
  const cats = new Set(); for (const s of Object.values(SKINS)) skinCatList(s).forEach(c => cats.add(c));
  const cat = settings.skinShelfCat !== "all" && cats.has(settings.skinShelfCat) ? settings.skinShelfCat : "all";
  const chips = $("skinChips");
  if (chips) {
    chips.textContent = "";
    for (const [id, key] of SKIN_CATS) {
      if (id !== "all" && !cats.has(id)) continue;
      const c = el("button", "skinChip"); c.type = "button"; c.textContent = tr(key);
      c.classList.toggle("on", id === cat); c.setAttribute("aria-pressed", String(id === cat));
      c.addEventListener("click", () => { settings.skinShelfCat = id; saveUserPrefs(); buildSkinGrid(); });
      chips.append(c);
    }
  }
  const count = $("skinShelfCount"); if (count) count.textContent = `（${Object.keys(SKINS).length}）`;
  for (const [id, s] of Object.entries(SKINS)) {
    if (cat !== "all" && !skinCatList(s).includes(cat)) continue;
    if (s.locked && !settings.skinGradUnlocked) {   /* ❓ ごほうびスキン（スタンプ5つで解禁）は、正体不明カードで出す */
      const q = el("button", "skinCard locked"); q.type = "button"; q.disabled = true; q.title = tr("skinLockedHint");
      q.style.setProperty("--sk-bg", "#10142a"); q.style.setProperty("--sk-text", "var(--ui-muted)"); q.style.setProperty("--sk-border", "var(--ui-border)");
      q.append(el("b", "", "❓ ？？？"), el("small", "", tr("skinLockedHint")));
      grid.append(q); continue;
    }
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
  const baseMap = { color:"none", mono:"grayscale(1) contrast(1.6)", dim:"brightness(.42) saturate(.85)" };
  const base = Object.prototype.hasOwnProperty.call(baseMap, settings.videoStyle)
    ? baseMap[settings.videoStyle] : (skin().video || "none");
  const parts = base && base !== "none" ? [base] : [];
  const dim = clampTvDim(settings.bgDim), blur = clampTvBlur(settings.bgBlur);
  /* 🪶 軽量化モード中は、いちばん重い「ぼかし」を2pxまでに抑える（設定そのものは変えません） */
  const cap = (typeof window.TrkLite === "object" && window.TrkLite && typeof window.TrkLite.blurCap === "function") ? window.TrkLite.blurCap() : 0;
  const useBlur = cap ? Math.min(blur, cap) : blur;
  if (dim > 0) parts.push(`brightness(${(1 - dim).toFixed(2)})`);
  if (useBlur > 0) parts.push(`blur(${useBlur}px)`);
  return parts.join(" ") || "none";
}
function applyNoteVars() {
  const root = document.documentElement.style;
  root.setProperty("--don", settings.notes[0].color); root.setProperty("--ka", settings.notes[1].color);
}
function applySkin(id, persist = true) {
  if (has(SKINS, id) && SKINS[id].locked && !settings.skinGradUnlocked) id = "shadow";   /* 🔒 ごほうびスキンは、スタンプ5つで解禁されるまで当てられない */
  settings.skin = has(SKINS, id) ? id : "shadow";
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
  buildSkinNow();
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
  unlock.master = e.master || !!settings.showMasterDiff;
  unlock.rush = e.rush || !!settings.showMasterDiff;
  levelOverride = e.level;
  const masterBtn = document.querySelector('#difficultyPicker [data-mode="master"]');
  const rushBtn = document.querySelector('#difficultyPicker [data-mode="rush"]');
  if (masterBtn) masterBtn.hidden = !unlock.master;
  if (rushBtn) rushBtn.hidden = !unlock.rush;
  if ((settings.difficulty === "master" && !unlock.master) || (settings.difficulty === "rush" && !unlock.rush)) {
    settings.difficulty = "normal";
    if (typeof syncPickers === "function") syncPickers();
  }
  const toggleBtn = $("expertDiffToggle");
  if (toggleBtn) {
    toggleBtn.classList.toggle("selected", !!settings.showMasterDiff);
    toggleBtn.setAttribute("aria-pressed", String(!!settings.showMasterDiff));
  }
  const check = $("showMasterDiff");
  if (check) check.checked = !!settings.showMasterDiff;
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
  /* 自動生成 / trk!手づくり（同梱デモ） / 読み込んだ譜面 */
  const label = chartMode === "generated" ? "chartGenerated" : chartMode === "custom" ? "chartCustom" : "chartImported";
  return `${tr(label)} · ${tr(chartDiff)} · ${chart.length} ${tr("notes")} · ${tr("level")}${currentLevel} ${tr("estimate")}`;
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
function openSettings() { if (phase === "title") { showScreen("settingsScreen"); emit("settings"); } }   /* 🧭 スタンプ「設定を見た」の検知 */
function closeSettings() { if (phase === "title") showScreen("selectScreen"); }

/* Emergency settings imports validate enum IDs at the boundary, before live settings are changed.
   列挙IDの検証対象（増やしたら tools/check-security.mjs も更新）。
   ⚠ 辞書が要るもの（TrkSpec/TrkMMD/TrkFX）は、その辞書が読めていないと fail-closed で落ちる。
      🪶 軽量化のように core.js で決め打ちできるものは LITE_ENUM_VALUES へ、
      🐔 タブ表示名のように UI 側の定数と対になるものは TRK_ENUM_VALUES へ寄せる（読み込み順に左右されない）。 */
const SETTING_ENUM_KEYS = ["specStyle", "specTheme", "mmdMotionKind", "fxPreset",
  "liteMode", "liteFps", "liteMascot", "liteScale", "liteLibRows", "trkTabName", "chartGen"];
/* Importで弾いた理由（対応が変わるので、表示では区別して出す） */
const SKIP_WHY = { enum:"prefSkipWhyId", type:"prefSkipWhyType", unknown:"prefSkipWhyUnknown", failed:"prefSkipWhyType" };
function validImportedSettingEnum(key, value) {
  if (typeof value !== "string") return false;
  const staticList = LITE_ENUM_VALUES[key] || TRK_ENUM_VALUES[key];
  if (staticList) return staticList.includes(value);
  try {
    if (key === "specStyle") return !!window.TrkSpec && window.TrkSpec.styles().includes(value);
    if (key === "specTheme") return !!window.TrkSpec && window.TrkSpec.themes().includes(value);
    if (key === "mmdMotionKind") {
      const ids = window.TrkMMD && window.TrkMMD.builtins();
      return Array.isArray(ids) && (ids.includes(value) || ["auto", "none"].includes(value));
    }
    if (key === "fxPreset") {
      const presets = window.TrkFX && window.TrkFX.list();
      return Array.isArray(presets) && presets.some(p => p && p.id === value);
    }
  } catch (_) {}
  return false;
}

/* ---------- 緊急復旧パネルのボタン ---------- */
(function setupEmergencyPanel(){
  const bind = (id, fn) => {
    const n = document.getElementById(id);
    if (!n) return;
    n.addEventListener("click", fn);
  };
  const setSt = (key, vars) => {
    const n = document.getElementById("emergencyStatus");
    if (!n) return;
    n.textContent = key ? (typeof tr !== "undefined" ? tr(key, vars) : key) : "";
    // also use status system
    try { setStatus("emergencyStatus", key, vars); } catch(_) {}
  };
  bind("emergencySafeBtn", () => {
    enterSafeMode(); saveUserPrefs();
    setSt(() => "🛟 セーフモードにしました。映像OFF・ぼかし無し・TV初期化。ページを再読み込みします…");
    setTimeout(()=> location.reload(), 800);
  });
  bind("emergencyTvResetBtn", () => {
    resetVideoPrefs(); saveUserPrefs();
    try { if (typeof view !== "undefined") view.style.filter = videoFilter(); } catch(_){}
    setSt(() => "📺 映像・TV設定を初期化しました");
    setTimeout(()=> { try { emit("skin"); } catch(_){} }, 100);
  });
  bind("emergencyAudioResetBtn", () => {
    resetAudioPrefs(); saveUserPrefs();
    setSt(() => "🔊 音量・SE設定を初期化しました");
  });
  bind("emergencyExportNotesBtn", () => { exportPrefs("notes"); setSt(() => "🎨 ノーツ設定を書き出しました"); });
  bind("emergencyExportAllBtn", () => { exportPrefs("all"); setSt(() => "💾 全設定を書き出しました"); });
  const imp = document.getElementById("emergencyImportFile");
  if (imp) {
    imp.addEventListener("change", async () => {
      const f = imp.files && imp.files[0]; if (!f) return;
      try {
        if (typeof f.size !== "number" || !Number.isFinite(f.size) || f.size < 0 || f.size > PREFS_IMPORT_MAX) {
          throw new Error("設定ファイルは2 MiBまでです");
        }
        const txt = await f.text(); const data = JSON.parse(txt);
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("設定JSONはオブジェクト形式にしてください");
        let applied = [], rejected = [];
        const hasImported = key => Object.prototype.hasOwnProperty.call(data, key);
        if (hasImported("notes")) { settings.notes = sanitizeNotes(data.notes); applied.push("notes"); }
        const importedVideoStyle = hasImported("videoStyle") ? pick(data.videoStyle, VIDEO_STYLE_IDS, "") : "";
        if (importedVideoStyle) { settings.videoStyle = importedVideoStyle; applied.push("videoStyle"); }
        if (hasImported("bgDim") && typeof data.bgDim === "number") { settings.bgDim = clampTvDim(data.bgDim); applied.push("bgDim"); }
        if (hasImported("bgBlur") && typeof data.bgBlur === "number") { settings.bgBlur = clampTvBlur(data.bgBlur); applied.push("bgBlur"); }
        if (hasImported("tvParamFavs")) { settings.tvParamFavs = cleanTvParamFavorites(data.tvParamFavs); applied.push("tvParamFavs"); }
        const importedTvDockSkin = hasImported("tvDockSkin") && typeof data.tvDockSkin === "string" && window.TrkTV && typeof window.TrkTV.skins === "function" &&
          window.TrkTV.skins().some(item => item && item.id === data.tvDockSkin) ? data.tvDockSkin : "";
        if (importedTvDockSkin) { settings.tvDockSkin = importedTvDockSkin; applied.push("tvDockSkin"); }
        if (hasImported("musicVolume") && typeof data.musicVolume === "number") {
          settings.musicVolume = num(data.musicVolume, 0, 1, settings.musicVolume);
          if (settings.musicVolume > 0) rememberMusicVolume(settings.musicVolume);
          applied.push("musicVolume");
        }
        if (hasImported("musicVolumeRestore") && typeof data.musicVolumeRestore === "number") {
          settings.musicVolumeRestore = num(data.musicVolumeRestore, .01, 1, settings.musicVolumeRestore);
          applied.push("musicVolumeRestore");
        }
        /* 理由つきで記録する（「この端末に無いID」と「型が違う」では利用者の対応が変わる）。
           ⚠ rejected に入るのは**表示用の文字列**なので、重複よけは別に生のキーで持つ。 */
        const rejectedKeys = new Set();
        const reject = (k, why) => {
          if (rejectedKeys.has(k)) return;
          rejectedKeys.add(k);
          rejected.push(tr(SKIP_WHY[why] || SKIP_WHY.unknown, { k }));
        };
        // 既知キーだけを取り込み、型と列挙IDは代入前に検証する。
        // ⚠ 弾いたキーは黙って捨てない（「読み込みました」なのに反映されない事故を防ぐ）。最後にまとめて報告する。
        for (const k of Object.keys(data)) {
          if (UNSAFE_KEYS.has(k) || ["notes", "videoStyle", "tvDockSkin", "bgDim", "bgBlur", "tvParamFavs", "musicVolume", "musicVolumeRestore"].includes(k) || applied.includes(k)) continue;
          if (!Object.prototype.hasOwnProperty.call(settings, k)) { reject(k, "unknown"); continue; }
          const current = settings[k], incoming = data[k];
          const sameShape = Array.isArray(current) ? Array.isArray(incoming)
            : current === null ? (incoming === null || typeof incoming === "string")
            : current && typeof current === "object" ? !!incoming && typeof incoming === "object" && !Array.isArray(incoming)
            : typeof incoming === typeof current && (typeof incoming !== "number" || Number.isFinite(incoming));
          if (!sameShape) { reject(k, "type"); continue; }
          if (SETTING_ENUM_KEYS.includes(k) && !validImportedSettingEnum(k, incoming)) { reject(k, "enum"); continue; }
          try { settings[k] = incoming; applied.push(k); } catch(_){ reject(k, "failed"); }
        }
        /* 上の個別処理で黙って落としたキーも同じように報告する。
           理由は落とし方ごとに決まる：videoStyle／tvDockSkin は許可リスト不一致、
           それ以外（bgDim／bgBlur／musicVolume など）は型が合わなかったときだけ残る。 */
        for (const k of Object.keys(data)) {
          if (applied.includes(k) || rejectedKeys.has(k) || UNSAFE_KEYS.has(k)) continue;
          reject(k, ["videoStyle", "tvDockSkin"].includes(k) ? "enum" : "type");
        }
        saveUserPrefs();
        try { applyNoteVars(); if (typeof view !== "undefined") view.style.filter = videoFilter(); } catch(_){}
        /* 長くなりすぎないよう先頭12件まで表示し、残りは件数だけ添える（表示は言語を選ばない記号のみ） */
        const keyList = keys => keys.slice(0, 12).join(", ") + (keys.length > 12 ? ` …+${keys.length - 12}` : "");
        if (rejected.length) setSt("prefImportedPartial", { list:keyList(applied), skipped:keyList(rejected) });
        else setSt("prefImported", { list:keyList(applied) });
        /* 未適用の告知は読む時間が要るので、そのときだけ再読み込みを遅らせる */
        setTimeout(()=> location.reload(), rejected.length ? 2600 : 900);
      } catch(e) {
        console.error(e);
        setSt(() => "読み込み失敗: " + (e.message || e));
      } finally { imp.value = ""; }
    });
  }
})();

/* ---------- 隠し緊急トリガー：タイトル5回クリック / Ctrl+Shift+S ---------- */
(function setupHiddenEmergency(){
  try {
    let clicks = 0, last = 0;
    const title = document.querySelector("#selectScreen .head h1, .head h1, h1");
    if (title) {
      title.style.cursor = "pointer";
      title.title = "5回クリックでセーフモード（緊急）";
      title.addEventListener("click", () => {
        const now = Date.now();
        if (now - last > 2000) clicks = 0;
        last = now; clicks++;
        if (clicks >= 5) {
          clicks = 0;
          if (confirm("🛟 セーフモードに入りますか？\n映像OFF・ぼかし0・TV初期化で操作可能にします。\n\n?safe=1 と同じ効果です。")) {
            enterSafeMode(); saveUserPrefs(); location.reload();
          }
        }
      });
    }
    document.addEventListener("keydown", (e) => {
      // Ctrl+Shift+S または Ctrl+Shift+? でセーフモード確認
      if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === "s" || e.key === "?" || e.key === "/")) {
        e.preventDefault();
        if (confirm("🛟 セーフモードに入りますか？ (Ctrl+Shift+S)")) {
          enterSafeMode(); saveUserPrefs(); location.reload();
        }
      }
      // Esc を3秒長押しでセーフモード（画面が真っ暗でボタン押せない時用）
      if (e.key === "Escape") {
        if (!window._escHold) window._escHold = 0;
        window._escHold++;
        if (window._escHold > 60) { // 約1秒以上押しっぱなしを想定、keydownリピートでカウント
          window._escHold = 0;
          if (confirm("🛟 Esc長押しを検出：セーフモードに入りますか？")) {
            enterSafeMode(); saveUserPrefs(); location.reload();
          }
        }
        setTimeout(()=>{ window._escHold = Math.max(0, (window._escHold||0)-1); }, 100);
      }
    });
  } catch(_) {}
})();
/* ✅ core.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.$ = $;
window.BEST_KEY = BEST_KEY;
window.CAPTION_MS = CAPTION_MS;
window.CUSTOM_SKIN_MAX = CUSTOM_SKIN_MAX;
window.KEY_PRESETS = KEY_PRESETS;
window.PAD_DEFAULTS = PAD_DEFAULTS;
window.SKIN_FORMAT = SKIN_FORMAT;
window.TRK_ENUM_VALUES = TRK_ENUM_VALUES;
window.TV_PARAM_FAV_MAX = TV_PARAM_FAV_MAX;
window.VIDEO_KEY_DEFAULTS = VIDEO_KEY_DEFAULTS;
window.activeMascot = activeMascot;
/* 後から読み込まれるファイルがこの名前を差し替える（window.activeMods の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "activeMods", { configurable:true, get:() => activeMods, set:v => { activeMods = v; } });
Object.defineProperty(window, "analysis", { configurable:true, get:() => analysis, set:v => { analysis = v; } });
window.applyLanguage = applyLanguage;
window.applyNoteVars = applyNoteVars;
/* 後から読み込まれるファイルがこの名前を差し替える（window.applySkin の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "applySkin", { configurable:true, get:() => applySkin, set:v => { applySkin = v; } });
Object.defineProperty(window, "avatarHit", { configurable:true, get:() => avatarHit, set:v => { avatarHit = v; } });
window.baseName = baseName;
Object.defineProperty(window, "bgImage", { configurable:true, get:() => bgImage, set:v => { bgImage = v; } });
Object.defineProperty(window, "bindingSlot", { configurable:true, get:() => bindingSlot, set:v => { bindingSlot = v; } });
window.buildSkinGrid = buildSkinGrid;
window.buildSkinNow = buildSkinNow;
Object.defineProperty(window, "caption", { configurable:true, get:() => caption, set:v => { caption = v; } });
Object.defineProperty(window, "chart", { configurable:true, get:() => chart, set:v => { chart = v; } });
Object.defineProperty(window, "chartDiff", { configurable:true, get:() => chartDiff, set:v => { chartDiff = v; } });
Object.defineProperty(window, "chartMeta", { configurable:true, get:() => chartMeta, set:v => { chartMeta = v; } });
Object.defineProperty(window, "chartMode", { configurable:true, get:() => chartMode, set:v => { chartMode = v; } });
window.chartSummary = chartSummary;
window.clampTvBlur = clampTvBlur;
window.clampTvDim = clampTvDim;
window.cleanTvParamFavorites = cleanTvParamFavorites;
Object.defineProperty(window, "clock", { configurable:true, get:() => clock, set:v => { clock = v; } });
window.closeSettings = closeSettings;
window.ctx = ctx;
Object.defineProperty(window, "currentLevel", { configurable:true, get:() => currentLevel, set:v => { currentLevel = v; } });
Object.defineProperty(window, "currentSong", { configurable:true, get:() => currentSong, set:v => { currentSong = v; } });
window.customSkinDefs = customSkinDefs;
window.downloadBlob = downloadBlob;
window.downloadJSON = downloadJSON;
Object.defineProperty(window, "effects", { configurable:true, get:() => effects, set:v => { effects = v; } });
window.el = el;
window.emit = emit;
Object.defineProperty(window, "errors", { configurable:true, get:() => errors, set:v => { errors = v; } });
window.esc = esc;
window.extOf = extOf;
Object.defineProperty(window, "fingerprint", { configurable:true, get:() => fingerprint, set:v => { fingerprint = v; } });
window.fmtDate = fmtDate;
window.fmtTime = fmtTime;
window.fontFamily = fontFamily;
window.formatKey = formatKey;
window.formatPadBind = formatPadBind;
window.fx = fx;
window.gameplayFxMultiplier = gameplayFxMultiplier;
window.gameplayFxPower = gameplayFxPower;
window.hashString = hashString;
window.idbStore = idbStore;
window.isPclMascot = isPclMascot;
window.keyCodeOf = keyCodeOf;
window.keysLabel = keysLabel;
window.laneCol = laneCol;
window.laneColor = laneColor;
window.laneName = laneName;
Object.defineProperty(window, "lastMissT", { configurable:true, get:() => lastMissT, set:v => { lastMissT = v; } });
Object.defineProperty(window, "levelOverride", { configurable:true, get:() => levelOverride, set:v => { levelOverride = v; } });
Object.defineProperty(window, "loadToken", { configurable:true, get:() => loadToken, set:v => { loadToken = v; } });
Object.defineProperty(window, "mediaName", { configurable:true, get:() => mediaName, set:v => { mediaName = v; } });
Object.defineProperty(window, "mediaURL", { configurable:true, get:() => mediaURL, set:v => { mediaURL = v; } });
window.modsUnranked = modsUnranked;
window.mulberry32 = mulberry32;
Object.defineProperty(window, "nextIdx", { configurable:true, get:() => nextIdx, set:v => { nextIdx = v; } });
window.noteShape = noteShape;
window.num = num;
window.on = on;
window.openSettings = openSettings;
Object.defineProperty(window, "phase", { configurable:true, get:() => phase, set:v => { phase = v; } });
window.pick = pick;
Object.defineProperty(window, "practice", { configurable:true, get:() => practice, set:v => { practice = v; } });
Object.defineProperty(window, "prefs", { configurable:true, get:() => prefs, set:v => { prefs = v; } });
Object.defineProperty(window, "pressFlash", { configurable:true, get:() => pressFlash, set:v => { pressFlash = v; } });
Object.defineProperty(window, "pressH", { configurable:true, get:() => pressH, set:v => { pressH = v; } });
window.refreshSeedSecrets = refreshSeedSecrets;
window.rememberMusicVolume = rememberMusicVolume;
window.renderAllStatuses = renderAllStatuses;
window.renderStatus = renderStatus;
window.safeHttpUrl = safeHttpUrl;
window.safeLink = safeLink;
Object.defineProperty(window, "safeModeOn", { configurable:true, get:() => safeModeOn, set:v => { safeModeOn = v; } });
window.safeName = safeName;
window.saveCustomSkins = saveCustomSkins;
window.saveUserPrefs = saveUserPrefs;
window.savedSkinAtBoot = savedSkinAtBoot;
Object.defineProperty(window, "screen", { configurable:true, get:() => screen, set:v => { screen = v; } });
Object.defineProperty(window, "seekDragging", { configurable:true, get:() => seekDragging, set:v => { seekDragging = v; } });
window.setPhase = setPhase;
window.setStatus = setStatus;
window.settings = settings;
window.showScreen = showScreen;
window.skin = skin;
window.slotLane = slotLane;
window.slotOfKey = slotOfKey;
window.stage = stage;
Object.defineProperty(window, "stats", { configurable:true, get:() => stats, set:v => { stats = v; } });
window.syncPickers = syncPickers;
window.takeAmpReset = takeAmpReset;
window.travelMs = travelMs;
window.updateChartButtons = updateChartButtons;
window.updateKeyUI = updateKeyUI;
window.updateTouchKeys = updateTouchKeys;
window.validCode = validCode;
window.validPadBind = validPadBind;
window.vctx = vctx;
window.video = video;
/* 後から読み込まれるファイルがこの名前を差し替える（window.videoFilter の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "videoFilter", { configurable:true, get:() => videoFilter, set:v => { videoFilter = v; } });
Object.defineProperty(window, "videoReady", { configurable:true, get:() => videoReady, set:v => { videoReady = v; } });
window.view = view;
window.windows = windows;
})();
