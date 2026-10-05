// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! tv-dock.js — 📺 映像出力のTV風ドック（メイン画面の曲リストの下）
   ・本体のスキン30種（ボタン数がそれぞれ違う）、電源・一時停止・お気に入り登録
   ・映像フィルター45種類（tv-presets.js）をまとめて触れる
   ・🆕 カスタムTVスキン：設定画面の #tvMaker で色・形・飾りを決めて作れる（trk-tvskin / trk_tv_skins_v1）
   ・🆕 ◀ ▶ の物理ボタン：前の曲・次の曲へ（選曲リストをチャンネル送りのように）
   ・🆕 ならべ方：TV →（お気に入り）→ ラック →（お気に入り）→ TVくわしい → ラックくわしい
     （TVとラックの上下は設定で入れ替え可。「くわしい」は、いつも下のほう）
   ・FxDockと似た構造だが、映像系（videoStyle, bgDim, bgBlur）を扱う
   読み込み順：tv-presets.js → core.js → fx-dock.js → tv-dock.js → fx.js
   ========================================================================== */
"use strict";
(() => {

/* ============ 設定の初期化（fx-dock.js と同じく prefs から読む） ============ */
const L4 = (ja, en, zh, ko) => ({ ja, en, zh, ko });
const TV_DOCK_SKINS = {
  // 王道
  standard:  { n:5, cols:5, deco:"",        label:L4("スタンダード", "Standard", "标准", "스탠다드") },
  home:      { n:6, cols:3, deco:"home",    label:L4("🏠 家庭用テレビ", "🏠 Home TV", "🏠 家用电视", "🏠 가정용 TV") },
  crt:       { n:4, cols:4, deco:"tube",    label:L4("📺 ブラウン管", "📺 CRT TV", "📺 显像管电视", "📺 브라운관 TV") },
  wood:      { n:6, cols:3, deco:"wood",    label:L4("🪵 ウッドテレビ", "🪵 Wood console", "🪵 木质电视", "🪵 우드 TV") },
  portable:  { n:3, cols:3, deco:"antenna", label:L4("📻 ポータブル", "📻 Portable", "📻 便携电视", "📻 포터블 TV") },
  kamishibai:{ n:5, cols:5, deco:"paper",   label:L4("📖 紙芝居", "📖 Kamishibai", "📖 纸芝居", "📖 종이 연극") },
  tube:      { n:4, cols:2, deco:"dials",   label:L4("🎛 真空管", "🎛 Vacuum tube", "🎛 电子管", "🎛 진공관") },
  wall:      { n:5, cols:5, deco:"wall",    label:L4("🧱 壁掛けテレビ", "🧱 Wall TV", "🧱 壁挂电视", "🧱 벽걸이 TV") },
  future:    { n:8, cols:4, deco:"holo",    label:L4("🛸 未来テレビ", "🛸 Holo TV", "🛸 全息电视", "🛸 홀로 TV") },
  projector: { n:5, cols:5, deco:"screen",  label:L4("🎞 プロジェクター", "🎞 Projector", "🎞 投影仪", "🎞 프로젝터") },
  // 追加：人が思いつかなそうな面白いやつから王道まで 20種
  phone:     { n:4, cols:2, deco:"phone",   label:L4("📱 スマホ縦持ち", "📱 Phone vertical", "📱 竖屏手机", "📱 세로 스마트폰") },
  arcade:    { n:8, cols:4, deco:"arcade",  label:L4("🕹️ アーケード筐体", "🕹️ Arcade cabinet", "🕹️ 街机", "🕹️ 아케이드") },
  laptop:    { n:5, cols:5, deco:"laptop",  label:L4("💻 ノートPC", "💻 Laptop", "💻 笔记本", "💻 노트북") },
  cinema:    { n:6, cols:3, deco:"cinema",  label:L4("🎬 映画館スクリーン", "🎬 Cinema screen", "🎬 电影银幕", "🎬 영화관 스크린") },
  car:       { n:3, cols:3, deco:"car",     label:L4("🚗 カーナビ", "🚗 Car nav", "🚗 车载导航", "🚗 카 내비") },
  airplane:  { n:4, cols:2, deco:"airplane",label:L4("✈️ 機内モニター", "✈️ Seatback", "✈️ 机舱屏幕", "✈️ 기내 모니터") },
  vr:        { n:5, cols:5, deco:"vr",      label:L4("🥽 VRゴーグル", "🥽 VR headset", "🥽 VR头显", "🥽 VR 고글") },
  aquarium:  { n:5, cols:5, deco:"aquarium",label:L4("🐠 水槽テレビ", "🐠 Aquarium TV", "🐠 鱼缸电视", "🐠 수조 TV") },
  scope:     { n:3, cols:3, deco:"scope",   label:L4("📟 オシロスコープ", "📟 Oscilloscope", "📟 示波器", "📟 오실로스코프") },
  cctv:      { n:6, cols:3, deco:"cctv",    label:L4("📹 監視モニター", "📹 CCTV wall", "📹 监控墙", "📹 CCTV") },
  gameboy:   { n:4, cols:2, deco:"gameboy", label:L4("👾 ゲームボーイ", "👾 GameBoy", "👾 掌机", "👾 게임보이") },
  jumbotron: { n:8, cols:4, deco:"jumbotron",label:L4("🏟️ 大型ビジョン", "🏟️ Jumbotron", "🏟️ 巨屏", "🏟️ 전광판") },
  frame:     { n:5, cols:5, deco:"frame",   label:L4("🖼️ 額縁テレビ", "🖼️ Picture frame", "🖼️ 相框电视", "🖼️ 액자 TV") },
  transparent:{ n:5, cols:5, deco:"transparent",label:L4("🫧 透明ディスプレイ", "🫧 Transparent", "🫧 透明显示", "🫧 투명 디스플레이") },
  toy:       { n:6, cols:3, deco:"toy",     label:L4("🧸 おもちゃテレビ", "🧸 Toy TV", "🧸 玩具电视", "🧸 장난감 TV") },
  cardboard: { n:4, cols:4, deco:"cardboard",label:L4("📦 ダンボールTV", "📦 Cardboard TV", "📦 纸箱电视", "📦 박스 TV") },
  window:    { n:5, cols:5, deco:"window",  label:L4("🪟 窓ガラスTV", "🪟 Window TV", "🪟 窗户电视", "🪟 창문 TV") },
  microwave: { n:4, cols:2, deco:"microwave",label:L4("🍳 電子レンジテレビ", "🍳 Microwave TV", "🍳 微波炉电视", "🍳 전자레인지 TV") },
  videowall: { n:8, cols:4, deco:"videowall",label:L4("🧱 ビデオウォール", "🧱 Video wall", "🧱 电视墙", "🧱 비디오월") },
  hologram:  { n:6, cols:3, deco:"hologram",label:L4("🔮 ホログラム", "🔮 Hologram", "🔮 全息投影", "🔮 홀로그램") }
};
const TV_FAV_MAX = 0, TV_RECENT_MAX = 5, TV_TEMP_ID = "__tv_temp", TV_LONG_MS = 600;   /* 0＝上限なし（⭐は js/favs.js がフォルダ分けする） */
const DEFAULT_TV_FAV = ["color", "vivid", "cinema", "crt", "vhs", "underwater", "thermal", "gameboy", "vaporwave", "aurora"];

const idList = (v, max) => Array.isArray(v) ? [...new Set(v.filter(x => typeof x === "string" && /^[a-z0-9_]{1,40}$/.test(x)))].slice(0, max > 0 ? max : undefined) : [];

/* ============ 🎨 カスタムTVスキン（保存庫） ============
   ・設定画面のエディタで作る。形式は trk-tvskin、保存先は trk_tv_skins_v1（新しいキー。これまでのキーは変えない）
   ・TV_DOCK_SKINS に同じ形のエントリを足すので、render()/buildDeco() はそのまま使える
   ・見た目は CSS 変数（--tv-…）で流し込む（css/style.css の .tvCustom） */
const TV_SKINS_KEY = "trk_tv_skins_v1", TV_SKIN_MAX = 30, TV_SKIN_FORMAT = "trk-tvskin";
const TV_COLOR_KEYS = ["body", "bezel", "screen", "button", "accent", "text"];
const TV_VAR_KEYS = ["--tv-body", "--tv-body2", "--tv-bezel", "--tv-screen", "--tv-button", "--tv-accent", "--tv-text",
  "--tv-on-accent", "--tv-radius", "--tv-bezelw", "--tv-lcd-bg", "--tv-lcd-text"];
/* 飾り（物理デコ）に使える名前。ラベルは、それを使っている内蔵TVスキンから借りる */
const TV_DECO_KEYS = ["home", "tube", "wood", "antenna", "paper", "dials", "wall", "holo", "screen", "phone", "arcade",
  "laptop", "cinema", "car", "airplane", "vr", "aquarium", "scope", "cctv", "gameboy", "jumbotron", "frame",
  "transparent", "toy", "cardboard", "window", "microwave", "videowall"];
const tvDecoLabel = k => {
  const hit = Object.values(TV_DOCK_SKINS).find(d => !d.custom && d.deco === k);
  return hit ? (hit.label[lang] || hit.label.en) : k;
};
/* エディタの「ひな形」。ここから色と形を変えて作る */
const TV_MAKER_PRESETS = {
  standard: { name:"My TV", n:5, cols:5, radius:18, bezel:4, deco:"", glow:false, glare:true, scan:false,
    colors:{ body:"#2a2a2e", bezel:"#111111", screen:"#181818", button:"#3a3a40", accent:"#ffd166", text:"#eeeeee" } },
  crt:      { name:"My CRT", n:4, cols:4, radius:26, bezel:8, deco:"tube", glow:true, glare:true, scan:true,
    colors:{ body:"#d8c8a8", bezel:"#3a2e22", screen:"#1e2a1e", button:"#b8a888", accent:"#7dff9b", text:"#2a2218" } },
  wood:     { name:"My Wood", n:6, cols:3, radius:10, bezel:10, deco:"wood", glow:false, glare:false, scan:false,
    colors:{ body:"#8b5a2b", bezel:"#4a2a14", screen:"#201a12", button:"#6a4520", accent:"#ffcf8a", text:"#ffe8c8" } },
  future:   { name:"My Future", n:8, cols:4, radius:26, bezel:2, deco:"holo", glow:true, glare:true, scan:false,
    colors:{ body:"#0a2a3a", bezel:"#00ffff", screen:"#001a22", button:"#123a4a", accent:"#00ffff", text:"#bbffff" } }
};
const customTvDefs = {};
const tvInt = (v, lo, hi, def) => Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : def;

/* 外から来た trk-tvskin は、決められた項目と範囲だけを受け付ける */
function sanitizeTvDef(raw) {
  if (!raw || typeof raw !== "object") return null;
  const c = (raw.colors && typeof raw.colors === "object") ? raw.colors : raw;
  const colors = {};
  for (const k of TV_COLOR_KEYS) {
    const v = c[k];
    if (typeof v !== "string" || !HEX.test(v.trim())) return null;
    colors[k] = v.trim().toLowerCase();
  }
  const s = (raw.shape && typeof raw.shape === "object") ? raw.shape : raw;
  const n = tvInt(s.n, 3, 8, 5);
  return {
    name: String(raw.name || "").trim().slice(0, 24) || "My TV",
    colors,
    shape: {
      n, cols: tvInt(s.cols, 1, 4, Math.min(n, 4)),
      radius: tvInt(s.radius, 0, 40, 18), bezel: tvInt(s.bezel, 0, 16, 4),
      deco: TV_DECO_KEYS.includes(s.deco) ? s.deco : "",
      glow: !!s.glow, glare: s.glare !== false, scan: !!s.scan
    }
  };
}
function buildTvSkinEntry(def) {
  const label = { ja:"🎨 " + def.name, en:"🎨 " + def.name, zh:"🎨 " + def.name, ko:"🎨 " + def.name };
  return { custom:true, def, n:def.shape.n, cols:def.shape.cols, deco:def.shape.deco || "", label };
}
function saveTvSkins() { try { localStorage.setItem(TV_SKINS_KEY, JSON.stringify(customTvDefs)); } catch (_) {} }
function registerTvSkin(id, def) { customTvDefs[id] = def; TV_DOCK_SKINS[id] = buildTvSkinEntry(def); saveTvSkins(); }
function unregisterTvSkin(id) { delete customTvDefs[id]; delete TV_DOCK_SKINS[id]; saveTvSkins(); }
(function loadTvSkins() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(TV_SKINS_KEY)) || {}; } catch (_) {}
  for (const [id, d] of Object.entries(raw)) {
    if (!/^custom_tv_[a-z0-9]+$/.test(id)) continue;
    const def = sanitizeTvDef(d); if (!def) continue;
    customTvDefs[id] = def; TV_DOCK_SKINS[id] = buildTvSkinEntry(def);
  }
})();
const newTvSkinId = () => "custom_tv_" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);

/* 色と形を CSS 変数にして流し込む（#tvDock とエディタのプレビューの両方で使う） */
function paintTvVars(node, def) {
  const c = def.colors, s = def.shape, dark = luminance(c.body) < .35;
  node.style.setProperty("--tv-body", c.body);
  node.style.setProperty("--tv-body2", mixHex(c.body, dark ? "#000000" : "#ffffff", dark ? .45 : .18));
  node.style.setProperty("--tv-bezel", c.bezel);
  node.style.setProperty("--tv-screen", c.screen);
  node.style.setProperty("--tv-button", c.button);
  node.style.setProperty("--tv-accent", c.accent);
  node.style.setProperty("--tv-text", c.text);
  node.style.setProperty("--tv-on-accent", luminance(c.accent) > .45 ? "#111111" : "#ffffff");
  node.style.setProperty("--tv-radius", s.radius + "px");
  node.style.setProperty("--tv-bezelw", s.bezel + "px");
  node.style.setProperty("--tv-lcd-bg", mixHex(c.screen, "#000000", .45));
  node.style.setProperty("--tv-lcd-text", c.accent);
  node.dataset.glare = s.glare ? "1" : "0";
  node.dataset.scan = s.scan ? "1" : "0";
  node.dataset.glow = s.glow ? "1" : "0";
  node.classList.add("tvCustom");
}
function clearTvVars(node) {
  TV_VAR_KEYS.forEach(k => node.style.removeProperty(k));
  delete node.dataset.glare; delete node.dataset.scan; delete node.dataset.glow;
  node.classList.remove("tvCustom");
}
function applyTvSkinVars(node, id) {
  const e = TV_DOCK_SKINS[id];
  if (e && e.custom && e.def) { paintTvVars(node, e.def); return; }
  if (node.classList.contains("tvCustom")) clearTvVars(node);
}

if (typeof prefs !== "undefined") {
  if (!prefs.tvFavSeeded) {
    const cur = Array.isArray(prefs.tvFav) ? prefs.tvFav : [];
    prefs.tvFav = [...DEFAULT_TV_FAV, ...cur.filter(id => !DEFAULT_TV_FAV.includes(id))];
  }
  // 既存の保存値を settings に反映（core.js の settings は既に存在）
  // 🛟 ただし ?safe=1（セーフモード）のときは読み戻さない。core.js が入れた「TVは映画館・映像OFF」を守る
  const keepSafe = (typeof safeModeOn !== "undefined") && safeModeOn;
  if (typeof settings !== "undefined" && !keepSafe) {
    settings.tvDockSkin = pick(prefs.tvDockSkin, Object.keys(TV_DOCK_SKINS), "cinema");
    settings.tvDockFive = !!prefs.tvDockFive;
    settings.tvDockOpen = prefs.tvDockOpen === true;
    settings.tvFav = idList(prefs.tvFav, TV_FAV_MAX);   // TV_FAV_MAX=0＝上限なし
    settings.tvRecent = idList(prefs.tvRecent, TV_RECENT_MAX);
    settings.tvOrder = pick(prefs.tvOrder, ["tv-first", "fx-first"], "tv-first");
    settings.tvPowerPrev = typeof prefs.tvPowerPrev === "string" ? prefs.tvPowerPrev : "color";
    settings.tvOverlay = prefs.tvOverlay !== false;
    /* 🆕 メニューでmp4の映像を流す（選曲中） */
    settings.tvSongWhilePlaying = prefs.tvSongWhilePlaying === true;  // ◀▶ を演奏中も効かせる（初期オフ）
    settings.tvMenuPreview = prefs.tvMenuPreview !== false;   // 選曲中のTVに映像を映す（初期オン）
    settings.tvMenuVideo = prefs.tvMenuVideo === true;        // 音のプレビューがオフでも映像を流す（初期オフ）
    settings.tvDockSkin = settings.tvDockSkin || "cinema";
    settings.tvFavSeeded = true;
  }
} else {
  // core.js より前に読まれた場合のフォールバック（通常は起きない）
  console.warn("tv-dock: prefs not found");
}

// settings がまだ無い場合の保険
if (typeof settings !== "undefined") {
  settings.tvDockSkin = settings.tvDockSkin || "cinema";
  settings.tvDockFive = !!settings.tvDockFive;
  settings.tvDockOpen = !!settings.tvDockOpen;
  settings.tvFav = settings.tvFav || DEFAULT_TV_FAV.slice();
  settings.tvRecent = settings.tvRecent || [];
  settings.tvOrder = settings.tvOrder || "tv-first";
  settings.tvPowerPrev = settings.tvPowerPrev || "color";
  settings.tvOverlay = settings.tvOverlay !== false;
  settings.tvMenuPreview = settings.tvMenuPreview !== false;
  settings.tvMenuVideo = settings.tvMenuVideo === true;
}

const tvSkinDef = () => TV_DOCK_SKINS[settings.tvDockSkin] || TV_DOCK_SKINS.cinema;
const tvSlotCount = () => settings.tvDockFive ? 5 : tvSkinDef().n;
const tvSlotCols = () => settings.tvDockFive ? 5 : tvSkinDef().cols;

/* ============ 文章（接頭辞 tv…） ============ */
Object.assign(TEXT.ja, {
  tvTitle:"📺 テレビ（映像出力）",
  tvMoreTitle:"📺 くわしく（設定と映像の確認）",
  tvNoFavShort:"⭐ お気に入りがありません",
  tvSongPlay:"▶◀ 演奏中も ◀▶ で曲を変える",
  tvSongPlayHint:"初期オフ。オンのときは、演奏中に ◀▶ を押すと、いまのプレイをやめてその曲に移ります（記録は残りません）。",
  tvSongPlayOn:"▶◀ 演奏中も曲を変えられます", tvSongPlayOff:"▶◀ 演奏中は曲を変えません",
  tvSongSkip:"♪ {t} に切り替えました",
  tvFavLabel:"⭐ ボタンに入りきらないお気に入り",
  tvFavLabelN:"⭐ お気に入り {n}個（このTVのボタンは {m}個・ぜんぶ入っています）",
  tvFavOverflow:"⭐ ボタンに入りきらないお気に入り（ボタンは {m}個・お気に入りは {n}個）",
  tvNoFav:"お気に入りはまだありません。ボタンを長押しすると、今の映像を登録できます。",
  tvMore:"⚙ 映像の詳しい設定",
  tvReset:"↺ テレビ設定をリセット", tvResetDone:"テレビ設定をリセットしました",
  tvPower:"⏻ 電源（映像オン／オフ）",
  tvPowerOn:"📺 テレビON", tvPowerOff:"📺 テレビOFF",
  tvPause:"⏯ 一時停止／再生",
  tvPauseHint:"選曲中のプレビューや再生中の映像を一時停止します",
  /* 🖥 動画の全画面表示（このボタン） */
  tvVideoMax:"⛶ 動画を全画面で表示（もう一度押すと閉じます）",
  tvVideoMaxOn:"🖥 全画面で表示しました", tvVideoMaxOff:"🖥 全画面を閉じました",
  tvVideoMaxNeed:"まだ動画がありません。曲を選んでから押してください",
  tvRand: "🎲 映像", tvRandFav:"⭐🎲 お気に入りから", tvRandParam:"🎛🎲 明るさ・ぼかし",
  tvParamDone:"明るさ・ぼかしをランダムにしました",
  tvSlotHint:"ボタンを長押し：今の映像を登録（もとの登録は1つ後ろへ）",
  tvEmptySlot:"空きボタン：長押しで今の映像を登録",
  tvNeedOn:"先に映像フィルターを選んでください（非表示以外）",
  tvSaved:"{n}番に「{name}」を登録しました",
  tvSkinLabel:"テレビ本体のスキン", tvFive:"どのスキンでも5ボタンにする",
  tvOrderLabel:"ドックの並び順", tvOrderTvFirst:"📺 テレビが上・🎛 ラックが下（自然）", tvOrderFxFirst:"🎛 ラックが上・📺 テレビが下",
  tvOrderHint:"デフォルトは「テレビ →（お気に入り）→ ラック →（お気に入り）→ テレビくわしい → ラックくわしい」の順です。テレビとラックだけ入れ替えられます（くわしいは、いつも下のほう）。",
  tvOverlay:"📺 映像オーバーレイ（走査線・レターボックス・ノイズなど）を表示",
  tvOverlayHint:"CRTやVHS、シネマなどのフィルターで、走査線やフィルムグレイン、黒帯などの演出を重ねます。",
  tvQuick:"📺 映像", tvOff:"📺 OFF",
  tvCatBasic:"基本", tvCatVivid:"ビビッド", tvCatRetro:"レトロ", tvCatCinema:"シネマ", tvCatEffect:"エフェクト", tvCatWeird:"不思議", tvCatNature:"自然",
  tvCatFav:"★ お気に入り", tvCatRecent:"🕘 最近使った",
  tvSearch:"🔍 映像フィルターを探す", tvNoMatch:"見つかりません。", tvHits:"{n}個見つかりました",
  tvDim:"背景の暗さ", tvBlur:"背景のぼかし",
  tvCurrent:"いまの映像：{name}",
  tvPrev:"前の映像", tvNext:"次の映像", tvRandom:"おまかせ",
  tvPrevSong:"◀ 前の曲", tvNextSong:"▶ 次の曲", tvNoSongs:"曲がありません",
  /* 🆕 メニューでmp4の映像を流す・「確認」タブ */
  tvpTabSetup:"🎛 TVの設定", tvpTabPreview:"🖼 映像の確認",
  tvpPreviewHint:"いま選んでいる映像フィルター・TVスキン・暗さ・ぼかしを、この画面で確かめられます。曲を選ぶと、ここにそのmp4が流れます（ゲーム画面と同じ大きさで表示）。",
  tvpNoVideo:"まだ映像がありません。曲を選ぶと、ここに流れます。",
  tvpOff:"映像はOFFです（⏻ か、フィルターで「非表示」を選ぶと戻ります）。",
  tvpNow:"いまの映像：{name}",
  tvpMenuPreview:"🖼 選曲中のTVに映像を映す",
  tvpMenuPreviewHint:"選曲画面のTV（下のドック）の画面に、流れているmp4を映します。動きが気になるときはオフに。",
  tvpMenuVideo:"🎬 音のプレビューがオフでも、メニューで映像を再生する（音は出しません）",
  tvpMenuVideoHint:"設定の「選曲中に曲のプレビューを再生する」がオンのときは、そちら（音あり）を優先します。",
  tvpPower:"⏻ 映像のON/OFF",
  tvShareBtn:"共有URL",
  tvShareHint:"現在のTVスキンとフィルターの共有リンクをコピー",
  tvShareCopied:"🔗 共有リンクをコピーしました",
  tvSharePrompt:"この共有リンクをコピーしてください：",
  tvpPlayGame:"▶ この設定で遊ぶ"
});
Object.assign(TEXT.en, {
  tvTitle:"📺 TV (video output)",
  tvMoreTitle:"📺 More (setup & video check)",
  tvFavLabel:"⭐ Favorites that don't fit on the buttons",
  tvFavLabelN:"⭐ {n} favorites (this TV has {m} buttons — all of them fit)",
  tvFavOverflow:"⭐ Favorites that don't fit on the buttons (buttons: {m}, favorites: {n})",
  tvNoFavShort:"⭐ No favorites yet",
  tvSongPlay:"▶◀ Let ◀▶ change songs while playing",
  tvSongPlayHint:"Off by default. When on, pressing ◀▶ during play stops the current run and switches to that song (the run is not recorded).",
  tvSongPlayOn:"▶◀ You can change songs while playing", tvSongPlayOff:"▶◀ Songs stay locked while playing",
  tvSongSkip:"♪ Switched to {t}",
  tvNoFav:"No favorites yet. Long-press a button to save the current video filter.",
  tvMore:"⚙ More video settings",
  tvReset:"↺ Reset TV settings", tvResetDone:"TV settings reset",
  tvPower:"⏻ Power (video on/off)",
  tvPowerOn:"📺 TV ON", tvPowerOff:"📺 TV OFF",
  tvPause:"⏯ Pause / Play",
  tvPauseHint:"Pause the preview or current video",
  /* 🖥 Full-screen video (this button) */
  tvVideoMax:"⛶ Show the video full screen (press again to close)",
  tvVideoMaxOn:"🖥 Full screen", tvVideoMaxOff:"🖥 Closed full screen",
  tvVideoMaxNeed:"No video yet — pick a song first",
  tvRand:"🎲 Video", tvRandFav:"⭐🎲 From favorites", tvRandParam:"🎛🎲 Brightness / blur",
  tvParamDone:"Brightness / blur randomized",
  tvSlotHint:"Long-press a button: save current video (old one moves back)",
  tvEmptySlot:"Empty: long-press to save current video",
  tvNeedOn:"Pick a video filter first (not Off)",
  tvSaved:"Saved “{name}” to button {n}",
  tvSkinLabel:"TV device skin", tvFive:"Use 5 buttons on every skin",
  tvOrderLabel:"Dock order", tvOrderTvFirst:"📺 TV on top, 🎛 Rack below (natural)", tvOrderFxFirst:"🎛 Rack on top, 📺 TV below",
  tvOrderHint:"Default order: TV →(favorites)→ rack →(favorites)→ TV options → rack options. You can swap the TV and the rack (the option boxes always stay below).",
  tvOverlay:"📺 Show video overlays (scanlines, letterbox, noise…)",
  tvOverlayHint:"CRT, VHS, cinema etc. add scanlines, grain, letterbox bars for atmosphere.",
  tvQuick:"📺 Video", tvOff:"📺 OFF",
  tvCatBasic:"Basic", tvCatVivid:"Vivid", tvCatRetro:"Retro", tvCatCinema:"Cinema", tvCatEffect:"Effect", tvCatWeird:"Weird", tvCatNature:"Nature",
  tvCatFav:"★ Favorites", tvCatRecent:"🕘 Recent",
  tvSearch:"🔍 Search video filters", tvNoMatch:"No matches.", tvHits:"{n} found",
  tvDim:"Background dim", tvBlur:"Background blur",
  tvCurrent:"Current: {name}",
  tvPrev:"Prev video", tvNext:"Next video", tvRandom:"Random",
  tvPrevSong:"◀ Previous song", tvNextSong:"▶ Next song", tvNoSongs:"No songs",
  /* 🆕 menu mp4 playback + Preview tab */
  tvpTabSetup:"🎛 TV setup", tvpTabPreview:"🖼 Video check",
  tvpPreviewHint:"Check the current filter, TV skin, dim and blur right here. Pick a song and its mp4 plays in this box (same framing as in game).",
  tvpNoVideo:"No video yet. Pick a song and it plays here.",
  tvpOff:"Video is off (use ⏻ or choose “Off” in the filter list).",
  tvpNow:"Now showing: {name}",
  tvpMenuPreview:"🖼 Show the video on the TV in song select",
  tvpMenuPreviewHint:"Plays the current mp4 inside the TV dock's screen. Turn off if the motion bothers you.",
  tvpMenuVideo:"🎬 Play video in the menu even when sound previews are off (muted)",
  tvpMenuVideoHint:"When “Play song previews in song select” is on, that one (with sound) takes priority.",
  tvpPower:"⏻ Video on/off",
  tvShareBtn:"Share URL",
  tvShareHint:"Copy a shareable link for this TV skin and filter",
  tvShareCopied:"🔗 Share link copied to clipboard",
  tvSharePrompt:"Copy this share link:",
  tvpPlayGame:"▶ Play with this setup"
});
Object.assign(TEXT.zh, {
  tvTitle:"📺 电视（视频输出）",
  tvMoreTitle:"📺 详细（设置与画面确认）",
  tvFavLabel:"⭐ 按钮放不下的收藏",
  tvFavLabelN:"⭐ 收藏 {n}个（这台电视有 {m} 个按钮，全部放得下）",
  tvFavOverflow:"⭐ 按钮放不下的收藏（按钮 {m}个、收藏 {n}个）",
  tvNoFavShort:"⭐ 还没有收藏",
  tvSongPlay:"▶◀ 演奏中也可以用 ◀▶ 换曲",
  tvSongPlayHint:"默认关闭。开启后，演奏中按 ◀▶ 会结束当前演奏并切到那首歌（不会记录成绩）。",
  tvSongPlayOn:"▶◀ 已允许演奏中换曲", tvSongPlayOff:"▶◀ 演奏中不会换曲",
  tvSongSkip:"♪ 已切到 {t}",
  tvNoFav:"还没有收藏。长按按钮即可登记当前视频滤镜。",
  tvMore:"⚙ 视频详细设置",
  tvReset:"↺ 重置电视设置", tvResetDone:"已重置电视设置",
  tvPower:"⏻ 电源（视频开／关）",
  tvPowerOn:"📺 电视开", tvPowerOff:"📺 电视关",
  tvPause:"⏯ 暂停／播放",
  tvPauseHint:"暂停选曲预览或当前视频",
  /* 🖥 视频全屏显示（此按钮） */
  tvVideoMax:"⛶ 全屏显示视频（再按一次关闭）",
  tvVideoMaxOn:"🖥 已全屏显示", tvVideoMaxOff:"🖥 已关闭全屏",
  tvVideoMaxNeed:"还没有视频，请先选择歌曲",
  tvRand:"🎲 视频", tvRandFav:"⭐🎲 从收藏", tvRandParam:"🎛🎲 亮度・模糊",
  tvParamDone:"已随机调整亮度・模糊",
  tvSlotHint:"长按按钮：登记当前视频（原来的往后挪一位）",
  tvEmptySlot:"空按钮：长按登记当前视频",
  tvNeedOn:"请先选择视频滤镜（非隐藏）",
  tvSaved:"已将“{name}”登记到 {n} 号",
  tvSkinLabel:"电视机身皮肤", tvFive:"所有皮肤都用5个按钮",
  tvOrderLabel:"Dock 顺序", tvOrderTvFirst:"📺 电视在上、🎛 机架在下（自然）", tvOrderFxFirst:"🎛 机架在上、📺 电视在下",
  tvOrderHint:"默认顺序：电视 →（收藏）→ 机架 →（收藏）→ 电视详细 → 机架详细。电视与机架可以互换（详细选项始终在下方）。",
  tvOverlay:"📺 显示视频叠加（扫描线・黑边・噪点等）",
  tvOverlayHint:"CRT、VHS、影院等滤镜会叠加扫描线、颗粒、黑边等效果。",
  tvQuick:"📺 视频", tvOff:"📺 关闭",
  tvCatBasic:"基本", tvCatVivid:"鲜艳", tvCatRetro:"复古", tvCatCinema:"影院", tvCatEffect:"特效", tvCatWeird:"奇异", tvCatNature:"自然",
  tvCatFav:"★ 收藏", tvCatRecent:"🕘 最近使用",
  tvSearch:"🔍 搜索视频滤镜", tvNoMatch:"没有结果。", tvHits:"找到{n}个",
  tvDim:"背景暗度", tvBlur:"背景模糊",
  tvCurrent:"当前视频：{name}",
  tvPrev:"上一个视频", tvNext:"下一个视频", tvRandom:"随机",
  tvPrevSong:"◀ 上一首", tvNextSong:"▶ 下一首", tvNoSongs:"没有歌曲",
  /* 🆕 菜单中播放mp4 + 「确认」标签页 */
  tvpTabSetup:"🎛 电视设置", tvpTabPreview:"🖼 画面确认",
  tvpPreviewHint:"可在此确认当前的滤镜、电视皮肤、暗度和模糊。选一首歌后，其mp4会在这里播放（与游戏画面相同的取景）。",
  tvpNoVideo:"还没有画面。选一首歌后就会在这里播放。",
  tvpOff:"画面已关闭（用⏻ 或在滤镜中选“隐藏”即可恢复）。",
  tvpNow:"当前画面：{name}",
  tvpMenuPreview:"🖼 在选曲画面把视频映到电视上",
  tvpMenuPreviewHint:"把正在播放的mp4映到选曲画面下方电视坞的屏幕上。觉得晃眼时可关闭。",
  tvpMenuVideo:"🎬 即使关闭试听，也在菜单中播放视频（无声）",
  tvpMenuVideoHint:"当设置里的“选曲时播放歌曲试听”开启时，优先使用那个（有声音）。",
  tvpPower:"⏻ 画面开/关",
  tvShareBtn:"分享链接",
  tvShareHint:"复制当前TV皮肤与滤镜的分享链接",
  tvShareCopied:"🔗 分享链接已复制到剪贴板",
  tvSharePrompt:"请复制此分享链接：",
  tvpPlayGame:"▶ 使用此配置游玩"
});
Object.assign(TEXT.ko, {
  tvTitle:"📺 TV (영상 출력)",
  tvMoreTitle:"📺 자세히 (설정과 영상 확인)",
  tvFavLabel:"⭐ 버튼에 다 들어가지 않는 즐겨찾기",
  tvFavLabelN:"⭐ 즐겨찾기 {n}개 (이 TV 버튼은 {m}개 · 전부 들어갑니다)",
  tvFavOverflow:"⭐ 버튼에 다 안 들어가는 즐겨찾기 (버튼 {m}개 · 즐겨찾기 {n}개)",
  tvNoFavShort:"⭐ 즐겨찾기가 없습니다",
  tvSongPlay:"▶◀ 연주 중에도 ◀▶로 곡 바꾸기",
  tvSongPlayHint:"기본은 꺼짐. 켜면 연주 중 ◀▶를 눌렀을 때 지금 플레이를 닫고 그 곡으로 넘어갑니다(기록은 남지 않습니다).",
  tvSongPlayOn:"▶◀ 연주 중에도 곡을 바꿀 수 있습니다", tvSongPlayOff:"▶◀ 연주 중에는 곡을 바꾸지 않습니다",
  tvSongSkip:"♪ {t}(으)로 바꿨습니다",
  tvNoFav:"아직 즐겨찾기가 없습니다. 버튼을 길게 누르면 현재 영상을 등록할 수 있습니다.",
  tvMore:"⚙ 영상 자세한 설정",
  tvReset:"↺ TV 설정 초기화", tvResetDone:"TV 설정을 초기화했습니다",
  tvPower:"⏻ 전원 (영상 켜기/끄기)",
  tvPowerOn:"📺 TV 켜기", tvPowerOff:"📺 TV 끄기",
  tvPause:"⏯ 일시정지/재생",
  tvPauseHint:"선택 중 미리듣기나 현재 영상을 일시정지합니다",
  /* 🖥 영상 전체 화면(이 버튼) */
  tvVideoMax:"⛶ 영상을 전체 화면으로 보기 (다시 누르면 닫힘)",
  tvVideoMaxOn:"🖥 전체 화면으로 표시", tvVideoMaxOff:"🖥 전체 화면을 닫음",
  tvVideoMaxNeed:"아직 영상이 없습니다. 곡을 먼저 고르세요",
  tvRand:"🎲 영상", tvRandFav:"⭐🎲 즐겨찾기에서", tvRandParam:"🎛🎲 밝기・흐림",
  tvParamDone:"밝기・흐림을 랜덤으로 바꿨습니다",
  tvSlotHint:"버튼 길게 누르기: 현재 영상 등록 (원래 것은 한 칸 뒤로)",
  tvEmptySlot:"빈 버튼: 길게 눌러 현재 영상 등록",
  tvNeedOn:"먼저 영상 필터를 골라 주세요 (끄기 제외)",
  tvSaved:"{n}번에 '{name}'을(를) 등록했습니다",
  tvSkinLabel:"TV 본체 스킨", tvFive:"모든 스킨을 5버튼으로",
  tvOrderLabel:"Dock 순서", tvOrderTvFirst:"📺 TV가 위, 🎛 랙이 아래 (자연스러움)", tvOrderFxFirst:"🎛 랙이 위, 📺 TV가 아래",
  tvOrderHint:"기본 순서: TV →(즐겨찾기)→ 랙 →(즐겨찾기)→ TV 자세히 → 랙 자세히. TV와 랙만 서로 바꿀 수 있습니다(자세히는 항상 아래).",
  tvOverlay:"📺 영상 오버레이 표시 (주사선・레터박스・노이즈 등)",
  tvOverlayHint:"CRT나 VHS, 시네마 등은 주사선이나 필름 그레인, 흑색 바 등을 겹쳐 분위기를 냅니다.",
  tvQuick:"📺 영상", tvOff:"📺 OFF",
  tvCatBasic:"기본", tvCatVivid:"비비드", tvCatRetro:"레트로", tvCatCinema:"시네마", tvCatEffect:"이펙트", tvCatWeird:"기묘", tvCatNature:"자연",
  tvCatFav:"★ 즐겨찾기", tvCatRecent:"🕘 최근 사용",
  tvSearch:"🔍 영상 필터 검색", tvNoMatch:"결과가 없습니다.", tvHits:"{n}개 찾음",
  tvDim:"배경 어둡기", tvBlur:"배경 흐림",
  tvCurrent:"현재 영상: {name}",
  tvPrev:"이전 영상", tvNext:"다음 영상", tvRandom:"랜덤",
  tvPrevSong:"◀ 이전 곡", tvNextSong:"▶ 다음 곡", tvNoSongs:"곡이 없습니다",
  /* 🆕 메뉴에서 mp4 재생 + 「확인」 탭 */
  tvpTabSetup:"🎛 TV 설정", tvpTabPreview:"🖼 영상 확인",
  tvpPreviewHint:"지금 고른 필터·TV 스킨·어둡기·흐림을 이 화면에서 확인할 수 있습니다. 곡을 고르면 그 mp4가 여기서 재생됩니다(게임 화면과 같은 구도).",
  tvpNoVideo:"아직 영상이 없습니다. 곡을 고르면 여기서 재생됩니다.",
  tvpOff:"영상이 꺼져 있습니다(⏻ 또는 필터에서 “숨기기”를 고르면 돌아옵니다).",
  tvpNow:"지금 영상: {name}",
  tvpMenuPreview:"🖼 곡 선택 화면의 TV에 영상 비추기",
  tvpMenuPreviewHint:"재생 중인 mp4를 곡 선택 화면 아래 TV 독 화면에 비춥니다. 움직임이 신경 쓰이면 끄세요.",
  tvpMenuVideo:"🎬 미리듣기가 꺼져 있어도 메뉴에서 영상을 재생합니다(무음)",
  tvpMenuVideoHint:"설정의 “곡 선택 중 미리듣기 재생”이 켜져 있으면 그쪽(소리 있음)을 우선합니다.",
  tvpPower:"⏻ 영상 켜기/끄기",
  tvShareBtn:"공유 URL",
  tvShareHint:"현재 TV 스킨과 필터의 공유 링크 복사",
  tvShareCopied:"🔗 공유 링크가 복사되었습니다",
  tvSharePrompt:"이 공유 링크를 복사하세요:",
  tvpPlayGame:"▶ 이 설정으로 플레이"
});

/* ============ 映像フィルターの取得 ============ */
function tvPresetById(id) {
  return (typeof TRK_TV_PRESETS !== "undefined" ? TRK_TV_PRESETS.find(p => p.id === id) : null) || null;
}
function tvPresetName(p) {
  if (!p) return "";
  const l = p.label;
  return typeof l === "string" ? l : (l && (l[lang] || l.en || l.ja)) || p.id;
}
function tvPresetDesc(p) {
  if (!p) return "";
  const d = p.desc;
  return typeof d === "string" ? d : (d && (d[lang] || d.en || d.ja)) || "";
}
const TV_CAT_KEY = { basic:"tvCatBasic", vivid:"tvCatVivid", retro:"tvCatRetro", cinema:"tvCatCinema", effect:"tvCatEffect", weird:"tvCatWeird", nature:"tvCatNature", fav:"tvCatFav", recent:"tvCatRecent" };
const TV_GROUPS = ["fav", "recent", "basic", "vivid", "retro", "cinema", "effect", "weird", "nature"];

function tvPresetsOf(cat) {
  if (cat === "fav") return (settings.tvFav || []).map(tvPresetById).filter(Boolean);
  if (cat === "recent") return (settings.tvRecent || []).map(tvPresetById).filter(Boolean);
  if (typeof TRK_TV_PRESETS === "undefined") return [];
  return TRK_TV_PRESETS.filter(p => p.cat === cat);
}
function tvAllPresets() {
  if (typeof TRK_TV_PRESETS === "undefined") return [];
  return TRK_TV_PRESETS;
}
function tvMatches(p, q) {
  const texts = [p.id, tvPresetName(p), tvPresetDesc(p)];
  return texts.some(t => typeof t === "string" && t.toLowerCase().includes(q));
}

/* ============ videoFilter を包む（既存の背景の暗さ・ぼかしも含める） ============ */
let baseVideoFilter = null;
if (typeof videoFilter === "function") baseVideoFilter = videoFilter;

function currentTvPreset() {
  return tvPresetById(settings.videoStyle) || null;
}
function tvFilterBase() {
  const id = settings.videoStyle;
  if (id === "off") return { filter:"none", off:true };
  const preset = tvPresetById(id);
  if (preset) {
    if (preset.filter === null) {
      // skin 標準
      return { filter: (typeof skin === "function" ? (skin().video || "none") : "none"), overlay: preset.overlay || null, off: !!preset.off };
    }
    return { filter: preset.filter || "none", overlay: preset.overlay || null, off: !!preset.off };
  }
  // フォールバック：旧来の videoStyle 値
  const map = { color:"none", mono:"grayscale(1) contrast(1.6)", dim:"brightness(.42) saturate(.85)" };
  const f = map[id] || (typeof skin === "function" ? (skin().video || "none") : "none");
  return { filter: f, overlay: null, off: false };
}

function newVideoFilter() {
  if (settings.videoStyle === "off") return "none";
  const base = tvFilterBase();
  if (base.off) return "none";
  const parts = [];
  if (base.filter && base.filter !== "none") parts.push(base.filter);
  if (settings.bgDim > 0) parts.push(`brightness(${(1 - settings.bgDim).toFixed(2)})`);
  if (settings.bgBlur > 0) parts.push(`blur(${settings.bgBlur}px)`);
  return parts.join(" ") || "none";
}

// 上書き
if (typeof window !== "undefined") {
  window.videoFilter = newVideoFilter;
  // core.js の videoFilter 参照も上書き（同じスコープなら）
  try { videoFilter = newVideoFilter; } catch (_) {}
}

/* ============ drawVideo を包んでオーバーレイを描く ============ */
let baseDrawVideo = null;
if (typeof drawVideo === "function") baseDrawVideo = drawVideo;

function drawTvOverlay(vctx, W, H, overlay) {
  if (!overlay || !settings.tvOverlay) return;
  const t = performance.now();
  vctx.save();
  switch (overlay) {
    case "vignette": {
      const g = vctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*1.2);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.7, "rgba(0,0,0,0.15)");
      g.addColorStop(1, "rgba(0,0,0,0.65)");
      vctx.fillStyle = g;
      vctx.fillRect(0,0,W,H);
      break;
    }
    case "grain": {
      vctx.globalAlpha = 0.12;
      for (let i=0;i<180;i++) {
        const x = Math.random()*W, y = Math.random()*H, s = Math.random()*2+0.5;
        vctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
        vctx.fillRect(x,y,s,s);
      }
      vctx.globalAlpha = 1;
      // fallthrough to vignette
      const g = vctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      vctx.fillStyle = g;
      vctx.fillRect(0,0,W,H);
      break;
    }
    case "crt": {
      // scanlines
      vctx.fillStyle = "rgba(0,0,0,0.22)";
      for (let y=0;y<H;y+=4) vctx.fillRect(0,y,W,2);
      // vignette + slight curvature illusion via radial
      const g = vctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*1.1);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.6, "rgba(0,0,0,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0.55)");
      vctx.fillStyle = g;
      vctx.fillRect(0,0,W,H);
      // RGB shift lines (very subtle)
      vctx.globalAlpha = 0.06;
      vctx.fillStyle = "rgba(255,0,0,0.8)";
      for (let y=1;y<H;y+=6) vctx.fillRect(1,y,W,1);
      vctx.fillStyle = "rgba(0,255,255,0.8)";
      for (let y=3;y<H;y+=6) vctx.fillRect(0,y,W,1);
      vctx.globalAlpha = 1;
      break;
    }
    case "vhs": {
      // tracking noise
      vctx.fillStyle = "rgba(255,255,255,0.08)";
      for (let i=0;i<6;i++) {
        const y = (t*0.1 + i*137) % H;
        const h = 2 + Math.random()*8;
        vctx.fillRect(0, y, W, h);
      }
      // chromatic jitter
      vctx.globalAlpha = 0.07;
      vctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i=0;i<40;i++) {
        const x = Math.random()*W, y = Math.random()*H;
        vctx.fillRect(x,y, Math.random()*30+5, 1);
      }
      vctx.globalAlpha = 1;
      // vignette
      const g = vctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, H);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.25)");
      vctx.fillStyle = g;
      vctx.fillRect(0,0,W,H);
      break;
    }
    case "letterbox": {
      const bh = H*0.08;
      vctx.fillStyle = "black";
      vctx.fillRect(0,0,W,bh);
      vctx.fillRect(0,H-bh,W,bh);
      break;
    }
    case "scope": {
      const bh = H*0.14;
      vctx.fillStyle = "black";
      vctx.fillRect(0,0,W,bh);
      vctx.fillRect(0,H-bh,W,bh);
      break;
    }
    case "scan": {
      vctx.fillStyle = "rgba(0,255,100,0.06)";
      const y = (t*0.2) % H;
      vctx.fillRect(0, y, W, 3);
      vctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let yy=0;yy<H;yy+=6) vctx.fillRect(0,yy,W,2);
      break;
    }
    case "bloom": {
      vctx.globalAlpha = 0.18;
      const g = vctx.createRadialGradient(W*0.7, H*0.35, 0, W*0.7, H*0.35, W*0.6);
      g.addColorStop(0, "rgba(255,255,255,0.8)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      vctx.fillStyle = g;
      vctx.fillRect(0,0,W,H);
      vctx.globalAlpha = 1;
      break;
    }
    case "soft": {
      // soft glow via semi-transparent white
      vctx.fillStyle = "rgba(255,255,255,0.06)";
      vctx.fillRect(0,0,W,H);
      break;
    }
    case "grid": {
      vctx.strokeStyle = "rgba(0,200,255,0.15)";
      vctx.lineWidth = 1;
      const step = 24;
      for (let x=0;x<W;x+=step) { vctx.beginPath(); vctx.moveTo(x,0); vctx.lineTo(x,H); vctx.stroke(); }
      for (let y=0;y<H;y+=step) { vctx.beginPath(); vctx.moveTo(0,y); vctx.lineTo(W,y); vctx.stroke(); }
      break;
    }
  }
  vctx.restore();
}

function drawStaticNoise(vctx, W, H, t) {
  // TV砂嵐・ノーシグナル風：暗い背景に細かいノイズ＋横線
  vctx.save();
  vctx.fillStyle = "#0a0a0a";
  vctx.fillRect(0,0,W,H);
  // 細かいノイズ
  const img = vctx.createImageData(W, H);
  const d = img.data;
  for (let i=0;i<d.length;i+=4) {
    const v = Math.random()*255|0;
    d[i]=v; d[i+1]=v; d[i+2]=v; d[i+3]=28;
  }
  vctx.putImageData(img,0,0);
  // 横線ノイズ
  vctx.fillStyle = "rgba(255,255,255,0.07)";
  for (let i=0;i<12;i++) {
    const y = (t*0.3 + i*89) % H;
    vctx.fillRect(0,y,W,1+Math.random()*3);
  }
  // 中央に NO SIGNAL
  vctx.fillStyle = "rgba(255,255,255,0.55)";
  vctx.font = `900 ${Math.round(H*0.08)}px ${typeof fontFamily==="function"?fontFamily():"monospace"}`;
  vctx.textAlign = "center"; vctx.textBaseline = "middle";
  vctx.fillText("NO SIGNAL", W/2, H/2);
  vctx.fillStyle = "rgba(255,255,255,0.35)";
  vctx.font = `700 ${Math.round(H*0.03)}px ${typeof fontFamily==="function"?fontFamily():"monospace"}`;
  vctx.fillText("Drop audio / video file to play", W/2, H/2 + H*0.08);
  vctx.restore();
}

function wrappedDrawVideo() {
  if (baseDrawVideo) {
    baseDrawVideo();
  } else {
    if (typeof vctx !== "undefined" && typeof W !== "undefined") {
      vctx.clearRect(0,0,W,H);
    }
  }
  if (typeof vctx === "undefined" || typeof W === "undefined" || typeof H === "undefined") return;
  if (settings.videoStyle === "off") return;
  const base = tvFilterBase();
  if (base.off) return;

  // 映像が無いときは砂嵐を出す（プレイ中以外）
  if (typeof videoReady !== "undefined" && !videoReady) {
    const t = performance.now();
    // 背景が何も描かれていない場合のみ砂嵐（bgImageも無い）
    if (!bgImage || !bgImage.naturalWidth) {
      drawStaticNoise(vctx, W, H, t);
    }
  }

  if (base.overlay) {
    try {
      drawTvOverlay(vctx, W, H, base.overlay);
    } catch (e) { console.error(e); }
  }
}

if (typeof window !== "undefined") {
  window.drawVideo = wrappedDrawVideo;
  try { drawVideo = wrappedDrawVideo; } catch (_) {}
}

/* ============ 操作 ============ */
function pushRecent(id) {
  if (id === "off" || id === TV_TEMP_ID) return;
  settings.tvRecent = [id, ...settings.tvRecent.filter(x => x !== id)].slice(0, TV_RECENT_MAX);
  saveUserPrefs();
}
function selectTv(id) {
  const p = tvPresetById(id);
  if (!p) return false;
  if (p.off) {
    // off のときは前のスタイルを記憶
    if (settings.videoStyle !== "off") settings.tvPowerPrev = settings.videoStyle;
    settings.videoStyle = "off";
  } else {
    if (settings.videoStyle === "off") {
      // 復帰時はそのまま選択
    }
    settings.videoStyle = id;
    pushRecent(id);
  }
  // view のフィルターを更新
  if (typeof view !== "undefined") view.style.filter = newVideoFilter();
  saveUserPrefs();
  // 設定画面のセレクトも同期
  const vs = document.getElementById("videoStyle");
  if (vs) vs.value = settings.videoStyle;
  // 同期イベント
  if (typeof emit === "function") emit("tvChange", id);
  return true;
}
function stepTv(dir) {
  const list = tvAllPresets();
  if (!list.length) return;
  const cur = list.findIndex(p => p.id === settings.videoStyle);
  const nxt = cur < 0 ? (dir > 0 ? 0 : list.length - 1) : (cur + dir + list.length) % list.length;
  selectTv(list[nxt].id);
}
function randomTv() {
  const list = tvAllPresets().filter(p => !p.off && p.id !== settings.videoStyle);
  if (list.length) selectTv(list[Math.floor(Math.random()*list.length)].id);
}
function togglePower() {
  if (settings.videoStyle === "off") {
    const prev = settings.tvPowerPrev && tvPresetById(settings.tvPowerPrev) ? settings.tvPowerPrev : "color";
    selectTv(prev);
  } else {
    settings.tvPowerPrev = settings.videoStyle;
    selectTv("off");
  }
}
function togglePause() {
  if (!video) return;
  if (video.paused) video.play().catch(()=>{});
  else video.pause();
}

/* ============ 並び順の制御 ============ */
function dockParts() {
  const tvDock = document.getElementById("tvDock");
  const fxDock = document.getElementById("fxDock");
  const col = document.querySelector(".songCol");
  /* 「くわしい」（details）は、ドックの中にあることも、列の下のほうにあることもある。
     どちらでも見つけられるようにしておく（2回目以降の整列で迷子にならないため）。 */
  const pick = (dock, cls) => {
    if (dock) { const inside = [...dock.children].find(c => c.tagName === "DETAILS"); if (inside) return inside; }
    return col ? col.querySelector(":scope > details." + cls) : null;
  };
  return { tvDock, fxDock, col, tvMore: pick(tvDock, "tvMore"), fxMore: pick(fxDock, "dockMore") };
}
/* ならべ方（デフォルト）：
     TV →（お気に入り）→ ラック →（お気に入り）→ TVくわしい → ラックくわしい
   ・「くわしい」は、それぞれのドックの外へ出して列の下のほうに並べる
   ・壁掛けTVのときは、本体だけヘッダーへ移す（お気に入りとくわしいは列に残す） */
function applyOrder() {
  const col = document.querySelector(".songCol");
  const head = document.querySelector("#selectScreen .head");
  const { tvDock, fxDock, tvMore, fxMore } = dockParts();
  if (!col || tvDock !== document.getElementById("tvDock")) return;   // ドックが無い（または別物）ときは何もしない

  if (settings.tvDockSkin === "wall") {
    if (head && tvDock.parentElement !== head) head.appendChild(tvDock);
    tvDock.classList.add("wall-mounted");
  } else {
    tvDock.classList.remove("wall-mounted");
    if (tvDock.parentElement !== col) col.appendChild(tvDock);   // ヘッダーから列へ戻す
  }

  const tvFirst = settings.tvOrder !== "fx-first";
  const list = [];
  if (settings.tvDockSkin !== "wall") list.push(tvFirst ? tvDock : fxDock, tvFirst ? fxDock : tvDock);
  else list.push(fxDock);
  list.push(tvFirst ? tvMore : fxMore, tvFirst ? fxMore : tvMore);

  const seq = list.filter(Boolean);
  let anchor = seq[0];
  if (!anchor || anchor.parentElement !== col) return;
  for (let i = 1; i < seq.length; i++) { anchor.after(seq[i]); anchor = seq[i]; }   // after() は既存要素の移動になる
}

/* ============ 🎬🖼 選曲中にmp4を流す（メニュー再生・確認用の描画） ============
   注意：ドックを組み立てている中のスコープでは const screen（TV画面のdiv）が
   core.js の画面名（"select" / "settings"）を隠してしまうので、画面名はこの関数で読む */
const screenName = () => (typeof screen === "string" ? screen : "");

/* ・音は出さない。音ありのプレビュー（settings.previewEnabled）がオンのときは、そちらを優先する
   ・fit:"contain" はゲーム画面と同じ（黒帯つきで全体を映す）／fit:"cover" はTVの画面いっぱい（はみ出しは切る） */
function paintVideoFrame(ctx, W, H, fit) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!videoReady || !video.videoWidth || settings.videoStyle === "off") return false;
  const vw = video.videoWidth, vh = video.videoHeight;
  const s = (fit === "cover" ? Math.max : Math.min)(W / vw, H / vh);
  const dw = vw * s, dh = vh * s;
  try { ctx.filter = newVideoFilter(); } catch (_) {}
  try { ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh); } catch (_) { return false; }
  ctx.filter = "none";
  const preset = currentTvPreset();
  drawTvOverlay(ctx, W, H, (preset && preset.overlay) || tvFilterBase().overlay || null);
  return true;
}

/* 「🎬 音のプレビューがオフでも、メニューで映像を再生する」の中身 */
let menuMutedByUs = false, menuPlayingByUs = false;
function menuVideoWanted() {
  return settings.tvMenuVideo === true && settings.previewEnabled !== true &&
    phase === "title" && screen === "select" && !document.hidden && videoReady && !!video.src;
}
function menuVideoTick() {
  if (!menuVideoWanted()) {
    if (menuPlayingByUs) { try { video.pause(); } catch (_) {} menuPlayingByUs = false; }
    if (menuMutedByUs) { video.muted = false; menuMutedByUs = false; }
    return;
  }
  if (video.paused) {
    if (!video.muted) { video.muted = true; menuMutedByUs = true; }
    video.play().then(() => { menuPlayingByUs = true; }).catch(() => {});
  } else {
    menuPlayingByUs = false;   // 誰かが再生している場合は、止めるときも触らない
  }
}
video.addEventListener("ended", () => {
  if (!menuVideoWanted()) return;
  try { video.currentTime = (typeof previewStartFor === "function") ? previewStartFor() : 0; } catch (_) {}
  video.play().catch(() => {});
});
document.addEventListener("visibilitychange", menuVideoTick);
on("screen", menuVideoTick);
on("phase", menuVideoTick);
video.addEventListener("canplay", menuVideoTick);
video.addEventListener("loadeddata", menuVideoTick);
video.addEventListener("play", menuVideoTick);   // 「pause」は見ない（⏯で止めたものを勝手に戻さないため）

/* ============ 画面の組み立て ============ */
addEventListener("DOMContentLoaded", () => {
  const col = document.querySelector(".songCol");
  const vsSel = document.getElementById("videoStyle");
  if (!col) return;
  saveUserPrefs();

  const tx = (tag, key, cls) => { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; };
  const btn = (cls, ...kids) => { const b = el("button", cls); b.type = "button"; b.append(...kids); return b; };
  const names = () => Object.fromEntries(tvAllPresets().map(p => [p.id, tvPresetName(p)]));

  // 設定画面の videoStyle セレクトを全プリセットで埋める
  if (vsSel) {
    vsSel.textContent = "";
    for (const cat of TV_GROUPS) {
      if (cat === "fav" || cat === "recent") continue;
      const items = tvPresetsOf(cat);
      if (!items.length) continue;
      const og = document.createElement("optgroup");
      og.label = tr(TV_CAT_KEY[cat] || cat);
      for (const p of items) {
        const o = document.createElement("option");
        o.value = p.id;
        o.textContent = tvPresetName(p);
        og.append(o);
      }
      vsSel.append(og);
    }
    vsSel.value = settings.videoStyle;
  }

  /* ---- TV 本体 ---- */
  const dock = el("div"); dock.id = "tvDock";
  const dev = el("div", "tvDev");
  const powLed = el("i", "led tvLed");
  const pauseLed = el("i", "led tvPauseLed");
  const pow = btn("tvKey tvPow", powLed, el("span", "", "⏻"));
  /* 🖥 「次の曲 ▶」の右のボタン：動画の全画面表示（js/video-max.js）。
     見た目はこれまでの一時停止ボタンと同じ（点灯するLEDアイコンのまま） */
  const pauseBtn = btn("tvKey tvPause tvMax", pauseLed, el("span", "", "⛶"));
  const lcd = el("div", "tvLcd");
  /* 🆕 ◀ ▶ の物理ボタン：選曲リストの前の曲・次の曲へ（テレビのチャンネル送りみたいに） */
  const prevSongBtn = btn("tvKey tvSong", el("span", "", "◀"));
  const nextSongBtn = btn("tvKey tvSong", el("span", "", "▶"));
  const top = el("div", "tvTop"); top.append(pow, prevSongBtn, lcd, nextSongBtn, pauseBtn);
  const screenWrap = el("div", "tvScreenWrap");
  const screen = el("div", "tvScreen");
  const screenGlare = el("i", "tvGlare");
  const speaker = el("div", "tvSpeaker");
  /* 🆕 選曲中は、この画面に流れているmp4を映す（paintVideoFrame が描く） */
  const liveCanvas = document.createElement("canvas"); liveCanvas.className = "tvLive";
  screen.append(liveCanvas, screenGlare, el("i", "tvScanlines"));   // 走査線はカスタムTVスキン用（[data-scan="1"] のときだけ出る）
  screenWrap.append(screen, speaker);
  const deco = el("div", "tvDeco");
  const slots = el("div", "tvSlots");
  const rTv = btn("tvKey"), rFav = btn("tvKey"), rPar = btn("tvKey");
  const rnd = el("div", "tvRand"); rnd.append(rTv, rFav, rPar);
  const slotHint = tx("div", "tvSlotHint", "hint tvHint");
  dev.append(top, screenWrap, deco, slots, rnd, slotHint);

  const overLabel = tx("div", "tvFavLabel", "hint");
  const overflow = el("div", "tvFavRow");
  /* ⭐ フォルダのチップ（1軍／2軍／🧊フリーズ／📤元お気に入り。中身は js/favs.js が作る） */
  const favChips = el("div", "favChipsWrap");

  const body = el("details", "panel tvMore"); body.open = settings.tvDockOpen;
  body.addEventListener("toggle", () => { settings.tvDockOpen = body.open; saveUserPrefs(); });

  // くわしい欄の中身
  const quickSel = document.createElement("select"); quickSel.className = "tvQuickSelect";
  quickSel.addEventListener("change", () => { if (quickSel.value) selectTv(quickSel.value); });
  const quickRow = el("div", "inline tight"); quickRow.append(tx("span","tvQuick"), quickSel);
  const dimRow = el("div", "inline"), blurRow = el("div", "inline");
  const dimLab = tx("span","tvDim"), blurLab = tx("span","tvBlur");
  const dimInp = document.createElement("input"), blurInp = document.createElement("input");
  const dimVal = el("span","mono"), blurVal = el("span","mono");
  dimInp.type = "range"; dimInp.min = 0; dimInp.max = 0.9; dimInp.step = 0.05;
  blurInp.type = "range"; blurInp.min = 0; blurInp.max = 12; blurInp.step = 1;
  dimInp.addEventListener("input", () => { settings.bgDim = Number(dimInp.value); saveUserPrefs(); if (typeof view !== "undefined") view.style.filter = newVideoFilter(); render(); });
  blurInp.addEventListener("input", () => { settings.bgBlur = Number(blurInp.value); saveUserPrefs(); if (typeof view !== "undefined") view.style.filter = newVideoFilter(); render(); });
  dimRow.append(dimLab, dimInp, dimVal);
  blurRow.append(blurLab, blurInp, blurVal);

  const skinRow = el("label","field"), skinSel = document.createElement("select");
  skinRow.append(tx("span","tvSkinLabel"), skinSel);
  skinSel.addEventListener("change", () => { settings.tvDockSkin = skinSel.value; saveUserPrefs(); render(true); });

  // 🎨 カスタムTVスキンのエディタを開く（キーは tvmOpen。tvMakerOpen だと生キーが出てしまう）
  const makerBtn = tx("button","tvmOpen","fxMini slim"); makerBtn.type = "button";
  makerBtn.addEventListener("click", () => {
    openSettings();
    const mk = document.getElementById("tvMaker");
    if (!mk) return;
    mk.open = true;
    setTimeout(() => mk.scrollIntoView({behavior:"smooth", block:"center"}), 50);
  });

  const five = (() => {
    const lab = el("label","check"), inp = document.createElement("input");
    inp.type = "checkbox"; lab.append(inp, tx("span","tvFive"));
    inp.addEventListener("change", () => { settings.tvDockFive = inp.checked; saveUserPrefs(); render(); });
    return { lab, inp };
  })();

  const orderRow = el("label","field"), orderSel = document.createElement("select");
  orderRow.append(tx("span","tvOrderLabel"), orderSel);
  const opt1 = document.createElement("option"); opt1.value = "tv-first"; opt1.textContent = tr("tvOrderTvFirst");
  const opt2 = document.createElement("option"); opt2.value = "fx-first"; opt2.textContent = tr("tvOrderFxFirst");
  orderSel.append(opt1, opt2);
  orderSel.addEventListener("change", () => { settings.tvOrder = orderSel.value; saveUserPrefs(); applyOrder(); render(); });

  const overlayCheck = (() => {
    const lab = el("label","check"), inp = document.createElement("input");
    inp.type = "checkbox"; lab.append(inp, tx("span","tvOverlay"));
    inp.addEventListener("change", () => { settings.tvOverlay = inp.checked; saveUserPrefs(); render(); });
    return { lab, inp };
  })();

  /* 🆕 演奏中も ◀▶ で曲を変える（初期オフ。使いたい人だけオンにする） */
  const songPlayCheck = (() => {
    const lab = el("label","check"), inp = document.createElement("input");
    inp.type = "checkbox"; inp.id = "tvSongWhilePlaying";
    lab.append(inp, tx("span","tvSongPlay"));
    inp.addEventListener("change", () => {
      settings.tvSongWhilePlaying = inp.checked;
      saveUserPrefs();
      lcdFlash(tr(inp.checked ? "tvSongPlayOn" : "tvSongPlayOff"));
      render();
    });
    return { lab, inp };
  })();

  const moreBtn = tx("button","tvMore","fxMini"); moreBtn.type = "button";
  moreBtn.addEventListener("click", () => {
    openSettings();
    const vs = document.getElementById("videoStyle");
    if (vs) {
      vs.closest("details.panel").open = true;
      setTimeout(() => vs.scrollIntoView({behavior:"smooth", block:"start"}), 50);
    }
  });
  const resetBtn = tx("button","tvReset","fxMini"); resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    settings.videoStyle = "color";
    settings.bgDim = 0; settings.bgBlur = 0;
    settings.tvDockSkin = "cinema";
    settings.tvDockFive = false;
    settings.tvOrder = "tv-first";
    settings.tvOverlay = true;
    settings.tvPowerPrev = "color";
    settings.tvMenuPreview = true; settings.tvMenuVideo = false;
    if (typeof view !== "undefined") view.style.filter = newVideoFilter();
    saveUserPrefs();
    menuVideoTick();
    const vs = document.getElementById("videoStyle");
    if (vs) vs.value = settings.videoStyle;
    if (typeof dimInp !== "undefined") { dimInp.value = 0; blurInp.value = 0; }
    lcdFlash(tr("tvResetDone"));
    render(true);
    applyOrder();
  });

  /* ---- 🎛 設定 / 🖼 確認 のタブと中身 ---- */
  const tabsBar = el("div", "seg tvTabs");
  const tabSetup = btn("");
  const tabPrev = btn("");
  const setLabel = (node, key) => { node.textContent = tr(key); node.dataset.i18n = key; };
  setLabel(tabSetup, "tvpTabSetup"); setLabel(tabPrev, "tvpTabPreview");
  tabsBar.append(tabSetup, tabPrev);

  const paneSetup = el("div", "tvPane");
  const shareBtn = btn("fxMini", "🔗 " + tr("tvShareBtn"));
  shareBtn.dataset.i18n = "tvShareBtn";
  shareBtn.title = tr("tvShareHint");
  shareBtn.addEventListener("click", () => {
    try {
      const u = new URL(location.href);
      u.searchParams.set("tv", settings.videoStyle);
      u.searchParams.set("skin", settings.tvDockSkin);
      const text = u.toString();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          if (typeof showToast === "function") showToast(tr("tvShareCopied"));
          else alert(tr("tvShareCopied"));
        }).catch(() => prompt(tr("tvSharePrompt"), text));
      } else {
        prompt(tr("tvSharePrompt"), text);
      }
    } catch (_) {}
  });
  paneSetup.append(tx("div","tvOverlayHint","hint"), overlayCheck.lab, five.lab, orderRow,
    tx("div","tvOrderHint","hint"), songPlayCheck.lab, tx("div","tvSongPlayHint","hint"),
    el("div","miniActions", makerBtn, shareBtn, moreBtn, resetBtn));

  const pvWrap = el("div", "tvpWrap");
  const pvCanvas = document.createElement("canvas"); pvCanvas.className = "tvpCanvas";
  pvCanvas.width = 1920; pvCanvas.height = 1080;
  const pvChip = el("div", "tvpChip");
  pvWrap.append(pvCanvas, pvChip);

  const pvControls = el("div", "inline", { style:"gap:8px;margin:8px 0 10px;width:100%" });
  const pvPlayPause = btn("fxMini", "▶");
  const pvSeek = document.createElement("input");
  pvSeek.type = "range"; pvSeek.min = "0"; pvSeek.max = "100"; pvSeek.step = "0.1"; pvSeek.value = "0";
  pvSeek.style.flex = "1";
  const pvTime = el("span", "mono", "0:00 / 0:00");
  pvTime.style.fontSize = "12px";
  pvControls.append(pvPlayPause, pvSeek, pvTime);

  const pvPlayBtn = btn("primary slim", tr("tvpPlayGame"));
  pvPlayBtn.dataset.i18n = "tvpPlayGame";
  pvPlayBtn.style.marginTop = "4px";
  pvPlayBtn.addEventListener("click", () => {
    if (videoReady && chart.length && typeof startGame === "function") startGame();
  });

  const fmtTime = sec => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  pvPlayPause.addEventListener("click", () => {
    if (!videoReady) return;
    if (video.paused) {
      video.play().then(() => { pvPlayPause.textContent = "⏸"; }).catch(() => {});
    } else {
      video.pause();
      pvPlayPause.textContent = "▶";
    }
  });

  let pvSeeking = false;
  pvSeek.addEventListener("input", () => {
    pvSeeking = true;
    if (video.duration) {
      const t = (Number(pvSeek.value) / 100) * video.duration;
      pvTime.textContent = `${fmtTime(t)} / ${fmtTime(video.duration)}`;
    }
  });
  pvSeek.addEventListener("change", () => {
    if (video.duration) {
      video.currentTime = (Number(pvSeek.value) / 100) * video.duration;
    }
    pvSeeking = false;
  });

  const menuPrevCheck = (() => {
    const lab = el("label","check"), inp = document.createElement("input");
    inp.type = "checkbox"; lab.append(inp, tx("span","tvpMenuPreview"));
    inp.addEventListener("change", () => { settings.tvMenuPreview = inp.checked; saveUserPrefs(); render(); });
    return { lab, inp };
  })();
  const menuVidCheck = (() => {
    const lab = el("label","check"), inp = document.createElement("input");
    inp.type = "checkbox"; lab.append(inp, tx("span","tvpMenuVideo"));
    inp.addEventListener("change", () => { settings.tvMenuVideo = inp.checked; saveUserPrefs(); menuVideoTick(); render(); });
    return { lab, inp };
  })();
  const pvPower = btn("fxMini", tr("tvpPower")); pvPower.dataset.i18n = "tvpPower";
  pvPower.addEventListener("click", () => { togglePower(); render(); });

  const panePreview = el("div", "tvPane");
  panePreview.append(pvWrap, pvControls, tx("div","tvpPreviewHint","hint"), menuPrevCheck.lab, tx("div","tvpMenuPreviewHint","hint"),
    menuVidCheck.lab, tx("div","tvpMenuVideoHint","hint"), el("div","miniActions", pvPlayBtn, pvPower, moreBtn));

  let tab = "setup", pvRaf = 0, pvMutedByUs = false, pvPlayedByUs = false;
  const previewOn = () => tab === "preview" && !panePreview.hidden && body.open && !document.hidden &&
    phase === "title" && screenName() === "select";
  function pvChipText() {
    if (settings.videoStyle === "off") { pvChip.textContent = tr("tvOff"); return; }
    pvChip.textContent = tr("tvpNow", { name: names()[settings.videoStyle] || settings.videoStyle });
  }
  function pvPlaceholder(ctx, text) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none"; ctx.globalAlpha = 1;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 1920, 1080);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = `600 56px ${FONT_DEFAULT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(text, 960, 540);
  }
  function pvFrame() {
    pvRaf = requestAnimationFrame(pvFrame);
    const ctx = pvCanvas.getContext("2d"); if (!ctx) return;
    if (settings.videoStyle === "off") { pvPlaceholder(ctx, tr("tvpOff")); return; }
    if (!paintVideoFrame(ctx, 1920, 1080, "contain")) pvPlaceholder(ctx, tr("tvpNoVideo"));
    if (!pvSeeking && video.duration) {
      pvSeek.value = ((video.currentTime / video.duration) * 100).toFixed(1);
      pvTime.textContent = `${fmtTime(video.currentTime)} / ${fmtTime(video.duration)}`;
      pvPlayPause.textContent = video.paused ? "▶" : "⏸";
    }
  }
  /* 「確認」タブを開いている間は、止まっていたら（音なしで）動かす */
  function pvKeepPlaying() {
    if (!previewOn() || settings.previewEnabled) return;
    if (video.paused && videoReady) {
      if (!video.muted) { video.muted = true; pvMutedByUs = true; }
      video.play().then(() => { pvPlayedByUs = true; }).catch(() => {});
    }
  }
  function pvRelease() {
    if (settings.tvMenuVideo === true) return;   // メニュー再生が続くので触らない
    if (pvPlayedByUs) { try { video.pause(); } catch (_) {} pvPlayedByUs = false; }
    if (pvMutedByUs) { video.muted = false; pvMutedByUs = false; }
  }
  function previewTick() {
    pvChipText();
    if (previewOn()) {
      if (!pvRaf) pvRaf = requestAnimationFrame(pvFrame);
      pvKeepPlaying();
    } else {
      if (pvRaf) { cancelAnimationFrame(pvRaf); pvRaf = 0; }
      pvRelease();
    }
  }
  function showTab(which) {
    tab = which === "preview" ? "preview" : "setup";
    paneSetup.hidden = tab !== "setup";
    panePreview.hidden = tab !== "preview";
    tabSetup.classList.toggle("selected", tab === "setup");
    tabPrev.classList.toggle("selected", tab === "preview");
    tabSetup.setAttribute("aria-pressed", String(tab === "setup"));
    tabPrev.setAttribute("aria-pressed", String(tab === "preview"));
    previewTick();
  }
  tabSetup.addEventListener("click", () => showTab("setup"));
  tabPrev.addEventListener("click", () => showTab("preview"));
  body.addEventListener("toggle", previewTick);
  video.addEventListener("ended", () => {
    if (!previewOn() || !pvPlayedByUs) return;   // 音ありプレビューが動かしている場合は library.js に任せる
    try { video.currentTime = (typeof previewStartFor === "function") ? previewStartFor() : 0; } catch (_) {}
    video.play().catch(() => {});
  });
  document.addEventListener("visibilitychange", previewTick);
  video.addEventListener("play", previewTick);
  video.addEventListener("pause", previewTick);
  video.addEventListener("canplay", previewTick);
  showTab("setup");

  body.append(tx("summary","tvMoreTitle"), quickRow, skinRow, dimRow, blurRow, tabsBar, paneSetup, panePreview);

  dock.append(dev, favChips, overLabel, overflow, body);
  col.append(dock);

  // 液晶フラッシュ
  let flash = null;
  function lcdFlash(text) { flash = { text, until: Date.now()+2000 }; render(); setTimeout(render, 2100); }

  pow.addEventListener("click", () => {
    togglePower();
    lcdFlash(tr(settings.videoStyle === "off" ? "tvPowerOff" : "tvPowerOn"));
  });
  /* 🖥 動画を全画面で表示（もう一度押すと閉じる）。一時停止は全画面の中の ▶ ボタンでできます */
  pauseBtn.addEventListener("click", () => {
    if (!window.TrkVideoMax) { togglePause(); lcdFlash(tr("tvPause")); return; }
    const opening = !window.TrkVideoMax.isOpen();
    if (opening && !videoReady) { lcdFlash(tr("tvVideoMaxNeed")); return; }
    window.TrkVideoMax.toggle();
    lcdFlash(tr(opening ? "tvVideoMaxOn" : "tvVideoMaxOff"));
  });
  if (window.TrkVideoMax) window.TrkVideoMax.onChange(() => render());
  /* ◀ ▶：選曲リストを前へ・次へ（ラジオのチャンネル送りみたいに）
     曲の選び方は library.js の nextSong() / prevSong() に任せる（ラジオと同じ並び） */
  const songStep = async dir => {
    const playing = phase !== "title";
    if (playing && !settings.tvSongWhilePlaying) return;        // 初期オフ（ゲーム中は曲が飛ばない）
    const pickSong = dir > 0 ? (typeof nextSong === "function" ? nextSong : null)
                             : (typeof prevSong === "function" ? prevSong : null);
    const it = pickSong ? pickSong() : null;
    if (!it) { lcdFlash(tr("tvNoSongs")); return; }
    if (typeof selectSong !== "function") return;
    if (playing) {
      /* 演奏中に切り替える設定のとき：いまのプレイを閉じて、選曲画面でその曲を選び直す */
      lcdFlash(tr("tvSongSkip", { t:String(it.title || "").slice(0, 24) }));
      try { if (typeof toTitle === "function") toTitle(); } catch (_) {}
    } else {
      lcdFlash("♪ " + String(it.title || "").slice(0, 36));
    }
    await selectSong(it);
    render();
  };
  prevSongBtn.addEventListener("click", () => songStep(-1));
  nextSongBtn.addEventListener("click", () => songStep(1));
  video.addEventListener("play", () => render());
  video.addEventListener("pause", () => render());
  rTv.addEventListener("click", () => randomTv());
  rFav.addEventListener("click", () => {
    const F = window.TrkFavs;
    const src = F ? F.pool("tv") : (settings.tvFav || []);
    const list = src.filter(id => id !== settings.videoStyle && tvPresetById(id) && !tvPresetById(id).off);
    if (list.length) selectTv(list[Math.floor(Math.random()*list.length)]);
    else lcdFlash(tr("tvNoFavShort"));
  });
  rPar.addEventListener("click", () => {
    const dim = Math.round(Math.random()*18)/20; // 0-0.9
    const blur = Math.floor(Math.random()*9); // 0-8
    settings.bgDim = dim; settings.bgBlur = blur;
    saveUserPrefs();
    if (typeof view !== "undefined") view.style.filter = newVideoFilter();
    lcdFlash("🎛🎲 " + tr("tvParamDone"));
    render();
  });

  function assign(i) {
    if (settings.videoStyle === "off") { lcdFlash(tr("tvNeedOn")); return; }
    const id = settings.videoStyle;
    if (!tvPresetById(id) || tvPresetById(id).off) { lcdFlash(tr("tvNeedOn")); return; }
    const F = window.TrkFavs;
    if (F) {
      /* ⭐ いま選んでいるフォルダ（1軍／2軍／🧊）へ入れる。上限なし。🧊は凍結中なら断る */
      const g = ["main", "sub", "frozen"].includes(F.activeOf("tv")) ? F.activeOf("tv") : "main";
      const r = F.add("tv", id, { group:g, index:i });
      if (!r.ok) { lcdFlash(F.msg(r.why)); return; }
      emit("language");
      lcdFlash(tr("tvSaved", { n:i+1, name: tvPresetName(tvPresetById(id)) }));
      render();
      return;
    }
    const arr = (settings.tvFav || []).filter(x => x !== id);
    arr.splice(Math.min(i, arr.length), 0, id);
    settings.tvFav = arr;
    saveUserPrefs();
    if (typeof emit === "function") emit("language");
    lcdFlash(tr("tvSaved", { n:i+1, name: tvPresetName(tvPresetById(id)) }));
    render();
  }
  function slotButton(i, id, nm) {
    const preset = tvPresetById(id);
    const isOff = preset && preset.off;
    const on = !isOff && settings.videoStyle === id;
    const b = btn("tvKey tvSlot" + (id ? "" : " empty") + (on ? " selected" : ""), el("span","num", String(i+1)), el("span","nm", nm || "—"));
    b.title = id ? nm : tr("tvEmptySlot");
    b.setAttribute("aria-pressed", String(on));
    let timer=0, long=false;
    b.addEventListener("pointerdown", () => { long=false; timer=setTimeout(()=>{ long=true; assign(i); }, TV_LONG_MS); });
    for (const ev of ["pointerup","pointerleave","pointercancel"]) b.addEventListener(ev, ()=>clearTimeout(timer));
    b.addEventListener("contextmenu", e=>e.preventDefault());
    b.addEventListener("click", () => {
      if (long) return;
      if (!id) { lcdFlash(tr("tvEmptySlot")); return; }
      if (preset && preset.off) { selectTv("off"); return; }
      if (on) selectTv("off");
      else selectTv(id);
    });
    return b;
  }

  function buildDeco() {
    deco.textContent = "";
    const d = tvSkinDef().deco;
    deco.className = "tvDeco " + d;
    deco.hidden = !d;
    if (d === "tube") {
      deco.append(el("i","tubeGlow"), el("i","tubeKnob"), el("i","tubeKnob"));
    } else if (d === "wood") {
      deco.append(el("i","woodGrain"), el("i","woodSpeaker"));
    } else if (d === "antenna") {
      const ant = el("i","tvAnt"); deco.append(ant);
      if (settings.videoStyle !== "off" && !video.paused) ant.classList.add("on");
    } else if (d === "paper") {
      deco.append(el("i","paperFrame"), el("i","paperSlide"));
    } else if (d === "dials") {
      for (let k=0;k<3;k++) deco.append(el("i","dial"));
    } else if (d === "home") {
      const chDisp = el("i","homeChDisp"); chDisp.textContent = settings.videoStyle === "off" ? "--" : settings.videoStyle.toUpperCase().slice(0,4);
      const chUp = el("button","homeBtn"); chUp.type="button"; chUp.textContent="▲"; chUp.title=tr("tvNext");
      const chDown = el("button","homeBtn"); chDown.type="button"; chDown.textContent="▼"; chDown.title=tr("tvPrev");
      chUp.addEventListener("click", ()=>{ stepTv(1); });
      chDown.addEventListener("click", ()=>{ stepTv(-1); });
      const volUp = el("button","homeBtn"); volUp.type="button"; volUp.textContent="＋"; volUp.title="Volume";
      const volDown = el("button","homeBtn"); volDown.type="button"; volDown.textContent="－";
      volUp.addEventListener("click", ()=>{ settings.musicVolume = Math.min(1, settings.musicVolume+0.05); if (typeof video!=="undefined") video.volume = settings.musicVolume; const v=document.getElementById("volume"); if(v) v.value=settings.musicVolume; saveUserPrefs(); });
      volDown.addEventListener("click", ()=>{ settings.musicVolume = Math.max(0, settings.musicVolume-0.05); if (typeof video!=="undefined") video.volume = settings.musicVolume; const v=document.getElementById("volume"); if(v) v.value=settings.musicVolume; saveUserPrefs(); });
      deco.append(chDisp, chUp, chDown, volUp, volDown, el("i","homeSpeaker"));
    } else if (d === "wall") {
      deco.append(el("i","wallMount"), el("i","wallShadow"));
    } else if (d === "holo" || d === "hologram") {
      deco.append(el("i","holoRing"), el("i","holoRing"), el("i","holoScan"), el("i","holoFloat"));
    } else if (d === "screen") {
      deco.append(el("i","projBeam"), el("i","projCurtain"), el("i","projCurtain right"), el("i","projLens"));
    } else if (d === "phone") {
      deco.append(el("i","phoneNotch"), el("i","phoneSpeaker"), el("i","phoneHome"));
    } else if (d === "arcade") {
      deco.append(el("i","arcadeMarquee"), el("i","arcadeStick"), el("i","arcadeBtn"), el("i","arcadeBtn"), el("i","arcadeCoin"));
    } else if (d === "laptop") {
      deco.append(el("i","laptopHinge"), el("i","laptopKeys"), el("i","laptopTrack"));
    } else if (d === "cinema") {
      deco.append(el("i","cinemaCurtain left"), el("i","cinemaCurtain right"), el("i","cinemaSeats"));
    } else if (d === "car") {
      deco.append(el("i","carDash"), el("i","carVent"), el("i","carWheel"));
    } else if (d === "airplane") {
      deco.append(el("i","planeTray"), el("i","planeBelt"), el("i","planeWindow"));
    } else if (d === "vr") {
      deco.append(el("i","vrStrap"), el("i","vrLens"), el("i","vrLens right"), el("i","vrSensor"));
    } else if (d === "aquarium") {
      deco.append(el("i","aquaBubble"), el("i","aquaBubble b2"), el("i","aquaBubble b3"), el("i","aquaFish"), el("i","aquaSand"));
    } else if (d === "scope") {
      deco.append(el("i","scopeGrid"), el("i","scopeKnob"), el("i","scopeGlow"));
    } else if (d === "cctv") {
      deco.append(el("i","cctvRec"), el("i","cctvTime"), el("i","cctvScan"));
    } else if (d === "gameboy") {
      deco.append(el("i","gbDpad"), el("i","gbBtnA"), el("i","gbBtnB"), el("i","gbSpeaker"));
    } else if (d === "jumbotron") {
      deco.append(el("i","jumboBolt"), el("i","jumboBolt"), el("i","jumboBolt"), el("i","jumboGlare"));
    } else if (d === "frame") {
      deco.append(el("i","frameMount"), el("i","frameShadow"));
    } else if (d === "transparent") {
      deco.append(el("i","transEdge"), el("i","transShine"));
    } else if (d === "toy") {
      deco.append(el("i","toyBow"), el("i","toyHeart"), el("i","toyStar"));
    } else if (d === "cardboard") {
      deco.append(el("i","cardTape"), el("i","cardScribble"));
    } else if (d === "window") {
      deco.append(el("i","winHandle"), el("i","winRain"), el("i","winBlind"));
    } else if (d === "microwave") {
      deco.append(el("i","mwTimer"), el("i","mwDoor"), el("i","mwPlate"));
    } else if (d === "videowall") {
      deco.append(el("i","vwBezH"), el("i","vwBezV"), el("i","vwSeam"));
    }
  }

  /* ---- ドックの画面に映像を映す（実際の大きさに合わせて描く） ---- */
  let liveRaf = 0;
  function liveFrame() {
    liveRaf = requestAnimationFrame(liveFrame);
    const w = liveCanvas.clientWidth, h = liveCanvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, (typeof devicePixelRatio === "number" ? devicePixelRatio : 1));
    const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
    if (liveCanvas.width !== W || liveCanvas.height !== H) { liveCanvas.width = W; liveCanvas.height = H; }
    const ctx = liveCanvas.getContext("2d"); if (!ctx) return;
    paintVideoFrame(ctx, W, H, "cover");
  }
  function startLive() { if (!liveRaf) liveRaf = requestAnimationFrame(liveFrame); }
  function stopLive() { if (liveRaf) { cancelAnimationFrame(liveRaf); liveRaf = 0; } }

  let lastSkin = "";
  function render(skinChanged) {
    const nm = names();
    // 知らないスキン名（古い設定・壊れた設定ファイル）は映画館スクリーンとして描く
    const skinId = TV_DOCK_SKINS[settings.tvDockSkin] ? settings.tvDockSkin : "cinema";
    dock.dataset.skin = skinId;
    applyTvSkinVars(dock, skinId);
    dock.classList.toggle("off", settings.videoStyle === "off");
    dock.classList.toggle("playing", !video.paused && settings.videoStyle !== "off");
    if (skinChanged || lastSkin !== settings.tvDockSkin) { buildDeco(); lastSkin = settings.tvDockSkin; }

    const isOff = settings.videoStyle === "off";
    /* 🖼 選曲中のTVに映像を映す（動いているときだけ） */
    const liveOn = settings.tvMenuPreview !== false && !isOff && videoReady && !video.paused &&
      phase === "title" && screenName() === "select";
    screen.dataset.live = liveOn ? "1" : "0";
    if (liveOn) startLive(); else stopLive();
    powLed.classList.toggle("on", !isOff);
    /* 🖥 全画面表示のときに点灯（スキンの点灯アイコンの見た目はそのまま） */
    pauseLed.classList.toggle("on", !!(window.TrkVideoMax && window.TrkVideoMax.isOpen()));
    pauseBtn.classList.toggle("selected", !!(window.TrkVideoMax && window.TrkVideoMax.isOpen()));
    pow.title = `${tr("tvPower")} · ${tr("tvMediaHoldHint")}`; pow.setAttribute("aria-label", pow.title); pow.setAttribute("aria-pressed", String(!isOff));
    pauseBtn.title = tr("tvVideoMax"); pauseBtn.setAttribute("aria-label", pauseBtn.title);
    pauseBtn.setAttribute("aria-pressed", String(!!(window.TrkVideoMax && window.TrkVideoMax.isOpen())));
    prevSongBtn.title = tr("tvPrevSong"); prevSongBtn.setAttribute("aria-label", prevSongBtn.title);
    nextSongBtn.title = tr("tvNextSong"); nextSongBtn.setAttribute("aria-label", nextSongBtn.title);

    const curName = isOff ? tr("tvOff") : (nm[settings.videoStyle] || settings.videoStyle);
    lcd.textContent = flash && Date.now() < flash.until ? flash.text : curName + (isOff ? "" : (video.paused ? " ⏸" : " ▶"));
    // 家庭用TVのCH表示をリアルタイム更新
    try {
      const chDisp = deco.querySelector(".homeChDisp");
      if (chDisp) chDisp.textContent = isOff ? "--" : (settings.videoStyle || "").toUpperCase().slice(0,4);
    } catch(_) {}

    rTv.textContent = tr("tvRand"); rFav.textContent = tr("tvRandFav"); rPar.textContent = tr("tvRandParam");

    // スロット（⭐いまのフォルダの中身。1軍＝これまでの settings.tvFav）
    const F = window.TrkFavs;
    const favGroup = F && ["main", "sub", "frozen"].includes(F.activeOf("tv")) ? F.activeOf("tv") : "main";
    const favAll = F ? F.list("tv", favGroup) : (settings.tvFav || []);
    const fav = favAll.filter(id => { const p = tvPresetById(id); return p && !p.off; });
    const n = tvSlotCount();
    slots.style.setProperty("--cols", tvSlotCols());
    slots.textContent = "";
    for (let i=0;i<n;i++) slots.append(slotButton(i, fav[i], nm[fav[i]]));

    /* ⭐ フォルダのチップ（切り替えると、ボタンの中身が入れ替わる） */
    if (F) {
      favChips.textContent = "";
      favChips.append(F.chips("tv", { former:true, onChange: () => render() }));
    }
    overflow.textContent = "";
    const rest = fav.slice(n);
    /* フォルダ名と数、このTVのボタン数を出す（TVごとの持ちやすさが見える） */
    if (!F) overLabel.textContent = rest.length ? tr("tvFavOverflow", { n: fav.length, m: n }) : tr("tvFavLabelN", { n: fav.length, m: n });
    else {
      const lock = F.locked("tv", favGroup) ? " 🔒" : "";
      const former = F.count("tv", "former");
      overLabel.textContent = tr("favHintDock", { g: F.label(favGroup) + lock, n: favAll.length, m: n })
        + (former ? " ／ " + tr("favHintN", { g: F.label("former"), n: former }) : "");
    }
    overLabel.hidden = !favAll.length;
    if (!favAll.length) overflow.append(tx("div","tvNoFav","hint"));
    for (const id of rest) {
      const on = settings.videoStyle === id;
      const b = btn(on ? "selected" : "", "⭐" + (F && F.pinned("tv", id) ? "📌" : "") + (nm[id]||id));
      b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", () => { if (on) selectTv("off"); else selectTv(id); });
      if (F) {
        /* 長押しでメニュー（1軍／2軍／🧊／📌／外す） */
        let t = 0, lng = false;
        b.addEventListener("pointerdown", () => { lng = false; t = setTimeout(() => { lng = true; F.menu(b, "tv", id); }, TV_LONG_MS); });
        for (const ev of ["pointerup","pointerleave","pointercancel"]) b.addEventListener(ev, () => clearTimeout(t));
        b.addEventListener("click", e => { if (lng) { e.stopImmediatePropagation(); lng = false; } }, true);
        b.addEventListener("contextmenu", e => { e.preventDefault(); F.menu(b, "tv", id); });
      }
      overflow.append(b);
    }

    // くわしい欄
    quickSel.textContent = "";
    const offOpt = document.createElement("option"); offOpt.value = "off"; offOpt.textContent = tr("tvOff"); quickSel.append(offOpt);
    for (const cat of TV_GROUPS) {
      if (cat === "fav" || cat === "recent") continue;
      const items = tvPresetsOf(cat);
      if (!items.length) continue;
      const og = document.createElement("optgroup"); og.label = tr(TV_CAT_KEY[cat]||cat);
      for (const p of items) { if (p.off) continue; const o = document.createElement("option"); o.value = p.id; o.textContent = tvPresetName(p); og.append(o); }
      quickSel.append(og);
    }
    quickSel.value = isOff ? "off" : settings.videoStyle;

    dimInp.value = settings.bgDim; dimVal.textContent = Math.round(settings.bgDim*100)+"%";
    blurInp.value = settings.bgBlur; blurVal.textContent = settings.bgBlur+"px";

    skinSel.textContent = "";
    for (const [id, d] of Object.entries(TV_DOCK_SKINS)) {
      const o = document.createElement("option"); o.value = id; o.textContent = `${d.label[lang]||d.label.en}（${d.n}）`; skinSel.append(o);
    }
    skinSel.value = settings.tvDockSkin;
    five.inp.checked = settings.tvDockFive;
    orderSel.value = settings.tvOrder;
    overlayCheck.inp.checked = settings.tvOverlay;
    songPlayCheck.inp.checked = !!settings.tvSongWhilePlaying;
    menuPrevCheck.inp.checked = settings.tvMenuPreview !== false;
    menuVidCheck.inp.checked = settings.tvMenuVideo === true;

    // スクリーンの見た目
    const curPreset = tvPresetById(settings.videoStyle);
    screen.dataset.filter = curPreset ? curPreset.id : "";
    screen.dataset.off = isOff ? "1" : "0";
    // スピーカーの光
    speaker.classList.toggle("on", !isOff && !video.paused);
  }

  // 設定画面の videoStyle 同期
  if (vsSel) {
    vsSel.addEventListener("change", () => {
      selectTv(vsSel.value);
      render();
    });
  }

  let queued = false;
  const update = () => { if (queued) return; queued=true; requestAnimationFrame(()=>{ queued=false; render(); }); };
  const mo = new MutationObserver(update);
  if (vsSel) mo.observe(vsSel, { childList:true });
  on("language", () => { update(); applyOrder(); previewTick(); pvChipText(); });
  on("skin", update);
  on("tvChange", () => { update(); applyOrder(); menuVideoTick(); previewTick(); });
  on("phase", update);
  on("screen", update);

  render(true);
  applyOrder();
  // fxDock が後から作られる場合も並び替え
  setTimeout(applyOrder, 500);
  setTimeout(applyOrder, 1500);

  // 初回フィルター適用
  if (typeof view !== "undefined") view.style.filter = newVideoFilter();
});

/* ============ 🎨 カスタムTVスキンのエディタ（設定画面の #tvMaker） ============
   ・色6つ・形4つ・飾り1つ・質感3つを触って、自分のテレビを作る（プレビューはライブで更新）
   ・保存すると trk_tv_skins_v1 に入り、TV_DOCK_SKINS に登録されてスキン一覧に出る
   ・作ったTVは trk-tvskin（JSON）で書き出し・読み込みできる */
Object.assign(TEXT.ja, {
  tvmTitle:"🎨 カスタムTVスキン", tvmHint:"色・形・飾りを決めて、自分のテレビを作れます。保存するとTVドックのスキン一覧に「🎨 名前」で出てきます（最大30個）。",
  tvmName:"名前", tvmColorHead:"色", tvmColorBody:"筐体", tvmColorBezel:"画面の枠", tvmColorScreen:"画面", tvmColorButton:"ボタン", tvmColorAccent:"アクセント", tvmColorText:"文字",
  tvmShape:"形", tvmButtons:"ボタンの数", tvmCols:"ならべる列", tvmRadius:"角の丸み", tvmBezelW:"画面のふち",
  tvmDeco:"飾り（物理デコ）", tvmDecoNone:"なし", tvmTex:"質感", tvmGlow:"光らせる（アクセント色）", tvmGlare:"ガラスの反射", tvmScan:"走査線",
  tvmPreset:"ひな形", tvmPreview:"プレビュー", tvmOpen:"🎨 カスタムTVスキンを作る",
  tvmSaved:"保存しました。TVドックに反映しました。", tvmExported:"trk-tvskin を書き出しました。", tvmImported:"読み込んで、TVドックに反映しました。",
  tvmDeleted:"削除しました。TVは家庭用テレビに戻しました。", tvmLimit:"カスタムTVスキンは30個までです。", tvmBad:"TVスキンファイルの形式が正しくありません。",
  tvmLocked:"内蔵のTVスキンは上書き・削除できません。「＋ 新規保存」で複製してください。", tvmLoaded:"選択中のカスタムTVを読み込みました。",
  tvmPresetLoaded:"ひな形を読み込みました。色と形を変えて「＋ 新規保存」してください。", tvmConfirmDelete:"このカスタムTVスキンを削除しますか？"
});
Object.assign(TEXT.en, {
  tvmTitle:"🎨 Custom TV skin", tvmHint:"Pick colors, shape and a prop to build your own TV. Saved TVs appear in the dock's skin list as “🎨 name” (up to 30).",
  tvmName:"Name", tvmColorHead:"Colors", tvmColorBody:"Body", tvmColorBezel:"Bezel", tvmColorScreen:"Screen", tvmColorButton:"Buttons", tvmColorAccent:"Accent", tvmColorText:"Text",
  tvmShape:"Shape", tvmButtons:"How many buttons", tvmCols:"Columns", tvmRadius:"Corner rounding", tvmBezelW:"Screen frame",
  tvmDeco:"Prop (physical deco)", tvmDecoNone:"None", tvmTex:"Texture", tvmGlow:"Glow (accent color)", tvmGlare:"Glass glare", tvmScan:"Scanlines",
  tvmPreset:"Template", tvmPreview:"Preview", tvmOpen:"🎨 Make a custom TV skin",
  tvmSaved:"Saved and applied to the TV dock.", tvmExported:"Exported a trk-tvskin file.", tvmImported:"Imported and applied to the TV dock.",
  tvmDeleted:"Deleted. The TV is back to the Home TV.", tvmLimit:"You can have up to 30 custom TV skins.", tvmBad:"Invalid TV skin file.",
  tvmLocked:"Built-in TV skins can't be overwritten or deleted. Use “＋ Save as new” to copy one.", tvmLoaded:"Loaded the selected custom TV.",
  tvmPresetLoaded:"Template loaded. Tweak it and use “＋ Save as new”.", tvmConfirmDelete:"Delete this custom TV skin?"
});
Object.assign(TEXT.zh, {
  tvmTitle:"🎨 自定义电视皮肤", tvmHint:"选择颜色、形状和装饰，做一台自己的电视。保存后会以“🎨 名称”出现在电视坞的皮肤列表（最多30个）。",
  tvmName:"名称", tvmColorHead:"颜色", tvmColorBody:"机身", tvmColorBezel:"边框", tvmColorScreen:"屏幕", tvmColorButton:"按钮", tvmColorAccent:"强调色", tvmColorText:"文字",
  tvmShape:"形状", tvmButtons:"按钮数量", tvmCols:"列数", tvmRadius:"圆角", tvmBezelW:"屏幕边框",
  tvmDeco:"装饰（实体道具）", tvmDecoNone:"无", tvmTex:"质感", tvmGlow:"发光（强调色）", tvmGlare:"玻璃反光", tvmScan:"扫描线",
  tvmPreset:"模板", tvmPreview:"预览", tvmOpen:"🎨 制作自定义电视皮肤",
  tvmSaved:"已保存，并应用到电视坞。", tvmExported:"已导出 trk-tvskin 文件。", tvmImported:"已导入并应用到电视坞。",
  tvmDeleted:"已删除。电视已恢复为家用电视。", tvmLimit:"自定义电视皮肤最多30个。", tvmBad:"电视皮肤文件格式不正确。",
  tvmLocked:"内置电视皮肤无法覆盖或删除，请用“＋ 另存为新皮肤”复制。", tvmLoaded:"已载入当前的自定义电视。",
  tvmPresetLoaded:"已载入模板。调整颜色和形状后请用“＋ 另存为新皮肤”。", tvmConfirmDelete:"要删除这个自定义电视皮肤吗？"
});
Object.assign(TEXT.ko, {
  tvmTitle:"🎨 커스텀 TV 스킨", tvmHint:"색·모양·장식을 골라 나만의 TV를 만들 수 있습니다. 저장하면 TV 독 스킨 목록에 “🎨 이름”으로 나타납니다 (최대 30개).",
  tvmName:"이름", tvmColorHead:"색", tvmColorBody:"본체", tvmColorBezel:"베젤", tvmColorScreen:"화면", tvmColorButton:"버튼", tvmColorAccent:"강조색", tvmColorText:"글자",
  tvmShape:"모양", tvmButtons:"버튼 개수", tvmCols:"열 수", tvmRadius:"모서리 둥글기", tvmBezelW:"화면 테두리",
  tvmDeco:"장식(물리 데코)", tvmDecoNone:"없음", tvmTex:"질감", tvmGlow:"발광(강조색)", tvmGlare:"유리 반사", tvmScan:"주사선",
  tvmPreset:"템플릿", tvmPreview:"미리보기", tvmOpen:"🎨 커스텀 TV 스킨 만들기",
  tvmSaved:"저장했습니다. TV 독에 적용했습니다.", tvmExported:"trk-tvskin 파일을 내보냈습니다.", tvmImported:"가져와 TV 독에 적용했습니다.",
  tvmDeleted:"삭제했습니다. TV는 가정용 TV로 돌아갔습니다.", tvmLimit:"커스텀 TV 스킨은 30개까지입니다.", tvmBad:"TV 스킨 파일 형식이 올바르지 않습니다.",
  tvmLocked:"내장 TV 스킨은 덮어쓰기·삭제할 수 없습니다. “＋ 새로 저장”으로 복사하세요.", tvmLoaded:"선택한 커스텀 TV를 불러왔습니다.",
  tvmPresetLoaded:"템플릿을 불러왔습니다. 색과 모양을 바꾼 뒤 “＋ 새로 저장”하세요.", tvmConfirmDelete:"이 커스텀 TV 스킨을 삭제할까요?"
});

(function setupTvMaker() {
  const gid = id => document.getElementById(id);
  addEventListener("DOMContentLoaded", () => {
    const maker = gid("tvMaker"), preview = gid("tvmPreview");
    if (!maker || !preview || maker.dataset.tvMakerReady) return;   // 二重初期化の防止
    maker.dataset.tvMakerReady = "1";
    const nm = gid("tvmName"), decoSel = gid("tvmDeco"), presetSel = gid("tvmPreset"), fileInput = gid("tvmImportFile");
    const cols = Object.fromEntries(TV_COLOR_KEYS.map(k => [k, gid("tvmColor_" + k)]));
    const rng = { n:gid("tvmN"), cols:gid("tvmCols"), radius:gid("tvmRadius"), bezel:gid("tvmBezel") };
    const val = { n:gid("tvmNVal"), cols:gid("tvmColsVal"), radius:gid("tvmRadiusVal"), bezel:gid("tvmBezelVal") };
    const tex = { glow:gid("tvmGlow"), glare:gid("tvmGlare"), scan:gid("tvmScan") };
    const btnLoad = gid("tvmLoadBtn"), btnNew = gid("tvmSaveNewBtn"), btnOver = gid("tvmOverwriteBtn"),
          btnExp = gid("tvmExportBtn"), btnDel = gid("tvmDeleteBtn");
    if (!nm || !decoSel || !presetSel || Object.values(cols).some(n => !n)) return;

    /* ---- プレビュー（TVドックと同じクラス名で小さく作る） ---- */
    const pvDev = el("div","tvDev"), pvTop = el("div","tvTop"), pvWrap = el("div","tvScreenWrap");
    const pvScreen = el("div","tvScreen"), pvDeco = el("div","tvDeco"), pvSlots = el("div","tvSlots");
    pvTop.append(el("i","led tvLed on"), el("div","tvLcd","COLOR ▶"));
    pvScreen.append(el("i","tvGlare"), el("i","tvScanlines"));
    pvWrap.append(pvScreen, el("div","tvSpeaker on"));
    pvDev.append(pvTop, pvWrap, pvDeco, pvSlots);
    preview.append(pvDev);

    function paintPreview(def) {
      paintTvVars(preview, def);
      const s = def.shape;
      pvSlots.style.setProperty("--cols", s.cols);
      pvSlots.textContent = "";
      const samples = tvAllPresets().filter(p => !p.off).slice(0, s.n);
      for (let i = 0; i < s.n; i++) {
        const b = el("button", "tvKey" + (i === 0 ? " selected" : "")); b.type = "button";
        b.append(el("span", "num", String(i + 1)), el("span", "nm", samples[i] ? tvPresetName(samples[i]) : "…"));
        pvSlots.append(b);
      }
      pvDeco.className = "tvDeco";
      pvDeco.hidden = !s.deco;
      pvDeco.textContent = s.deco ? "🔧 " + tvDecoLabel(s.deco) : "";
    }

    /* ---- 読み書き ---- */
    function readDef() {
      const colors = {}; for (const k of TV_COLOR_KEYS) colors[k] = cols[k].value;
      return sanitizeTvDef({ name:nm.value, colors, shape:{ n:rng.n.value, cols:rng.cols.value, radius:rng.radius.value,
        bezel:rng.bezel.value, deco:decoSel.value, glow:tex.glow.checked, glare:tex.glare.checked, scan:tex.scan.checked } });
    }
    function paint() {
      const def = readDef(); if (!def) return;
      for (const k of ["n", "cols", "radius", "bezel"]) if (val[k]) val[k].textContent = def.shape[k];
      paintPreview(def);
    }
    function fillDef(raw) {
      const d = sanitizeTvDef(raw) || sanitizeTvDef(TV_MAKER_PRESETS.standard);
      nm.value = d.name;
      for (const k of TV_COLOR_KEYS) cols[k].value = d.colors[k];
      rng.n.value = d.shape.n; rng.cols.value = d.shape.cols;
      rng.radius.value = d.shape.radius; rng.bezel.value = d.shape.bezel;
      decoSel.value = d.shape.deco;
      tex.glow.checked = d.shape.glow; tex.glare.checked = d.shape.glare; tex.scan.checked = d.shape.scan;
      paint();
    }
    function fillSelects() {
      const curDeco = decoSel.value;
      decoSel.textContent = "";
      const none = document.createElement("option"); none.value = ""; none.textContent = tr("tvmDecoNone"); decoSel.append(none);
      for (const k of TV_DECO_KEYS) {
        const o = document.createElement("option"); o.value = k; o.textContent = tvDecoLabel(k); decoSel.append(o);
      }
      decoSel.value = TV_DECO_KEYS.includes(curDeco) ? curDeco : "";
      const curPreset = TV_MAKER_PRESETS[presetSel.value] ? presetSel.value : "standard";
      presetSel.textContent = "";
      for (const [id, d] of Object.entries(TV_MAKER_PRESETS)) {
        const o = document.createElement("option"); o.value = id; o.textContent = d.name; presetSel.append(o);
      }
      presetSel.value = curPreset;
    }
    const isCustomCurrent = () => !!customTvDefs[settings.tvDockSkin];
    const toast = (key) => { if (!maker.open) maker.open = true; setStatus("tvmStatus", key); };

    /* ---- 操作 ---- */
    const inputs = [nm, ...Object.values(cols), ...Object.values(rng), ...Object.values(tex), decoSel];
    for (const n of inputs) { n.addEventListener("input", () => { setStatus("tvmStatus", null); paint(); }); n.addEventListener("change", paint); }
    presetSel.addEventListener("change", () => { fillDef(TV_MAKER_PRESETS[presetSel.value]); setStatus("tvmStatus", "tvmPresetLoaded"); });

    if (btnLoad) btnLoad.addEventListener("click", () => {
      if (isCustomCurrent()) { fillDef(customTvDefs[settings.tvDockSkin]); setStatus("tvmStatus", "tvmLoaded"); }
      else { fillDef(TV_MAKER_PRESETS[presetSel.value]); setStatus("tvmStatus", "tvmPresetLoaded"); }
    });
    if (btnNew) btnNew.addEventListener("click", () => {
      if (Object.keys(customTvDefs).length >= TV_SKIN_MAX) { toast("tvmLimit"); return; }
      const def = readDef(); if (!def) { toast("tvmBad"); return; }
      const id = newTvSkinId(); registerTvSkin(id, def);
      settings.tvDockSkin = id; saveUserPrefs(); emit("tvChange"); toast("tvmSaved");
    });
    if (btnOver) btnOver.addEventListener("click", () => {
      if (!isCustomCurrent()) { toast("tvmLocked"); return; }
      const def = readDef(); if (!def) { toast("tvmBad"); return; }
      registerTvSkin(settings.tvDockSkin, def);
      saveUserPrefs(); emit("tvChange"); toast("tvmSaved");
    });
    if (btnExp) btnExp.addEventListener("click", () => {
      const def = readDef(); if (!def) { toast("tvmBad"); return; }
      downloadJSON({ format:TV_SKIN_FORMAT, version:1, ...def }, `${safeName(def.name)}.tvskin.json`);
      toast("tvmExported");
    });
    if (fileInput) fileInput.addEventListener("change", async e => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
      const def = raw && (!raw.format || raw.format === TV_SKIN_FORMAT) ? sanitizeTvDef(raw) : null;
      if (!def) { toast("tvmBad"); return; }
      if (Object.keys(customTvDefs).length >= TV_SKIN_MAX) { toast("tvmLimit"); return; }
      const id = newTvSkinId(); registerTvSkin(id, def);
      settings.tvDockSkin = id; saveUserPrefs(); emit("tvChange");
      fillDef(def); toast("tvmImported");
    });
    if (btnDel) btnDel.addEventListener("click", () => {
      if (!isCustomCurrent()) { toast("tvmLocked"); return; }
      if (!confirm(tr("tvmConfirmDelete"))) return;
      unregisterTvSkin(settings.tvDockSkin);
      settings.tvDockSkin = "cinema"; saveUserPrefs(); emit("tvChange"); toast("tvmDeleted");
    });

    maker.addEventListener("toggle", () => { if (maker.open) { fillSelects(); paint(); } });
    on("language", () => { fillSelects(); paint(); });

    fillSelects();
    fillDef(customTvDefs[settings.tvDockSkin] || TV_MAKER_PRESETS[presetSel.value] || TV_MAKER_PRESETS.standard);
  });
})();

/* ============ 窓口 TrkTV ============ */
window.TrkTV = Object.freeze({
  version:2,
  list:() => tvAllPresets().map(p => ({ id:p.id, cat:p.cat, name: tvPresetName(p), overlay: p.overlay||null, off: !!p.off })),
  skins:() => Object.entries(TV_DOCK_SKINS).map(([id, d]) => ({ id, name: d.label[lang] || d.label.en, custom: !!d.custom, n:d.n, cols:d.cols, deco:d.deco||"" })),
  skin:() => settings.tvDockSkin,
  selectSkin: id => { if (!TV_DOCK_SKINS[id]) return false; settings.tvDockSkin = id; saveUserPrefs(); emit("tvChange"); return true; },
  current:() => settings.videoStyle,
  select:id => selectTv(String(id)),
  next:() => stepTv(1),
  prev:() => stepTv(-1),
  random:() => randomTv(),
  off:() => selectTv("off"),
  on:() => { if (settings.videoStyle==="off") selectTv(settings.tvPowerPrev||"color"); },
  toggle:() => togglePower(),
  filter:() => newVideoFilter(),
  overlay:() => { const p = currentTvPreset(); return p ? p.overlay||null : null; }
});

})();
/* ✅ tv-dock.js 完了 */
