// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：データ（スキン・レイアウト・難易度・マスコット登録） ============
   内蔵スキンを増やすときは SKINS に1項目足すだけで、設定画面の一覧に出ます。
     ui     : メニュー画面の色（CSS変数）。--ui-bg は linear-gradient(…) も可（グラデーション）
     cat    : （任意）スキンの棚での絞り込み用タグ（basic / miku / dark / light / grad / fun の配列）
     game   : プレイ画面の色
     shapes : [ドン, カッ] の「おすすめ」ノーツ形状（circle / diamond / square）
     video  : 背景映像に掛けるCSSフィルター
     font   : （任意）フォント
     mascot : （任意）スキン標準のマスコット
   キャラクターのマスコットは registerMascot() で外から追加します（見本：js/characters/miku.js）。 */
"use strict";

const W = 1920, H = 1080, TAU = Math.PI * 2;
const FONT_DEFAULT = 'system-ui,-apple-system,"Segoe UI","Noto Sans JP","Noto Sans SC","Noto Sans KR",sans-serif';
const HEX = /^#[0-9a-f]{6}$/i;
const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

/* ---------- 色の計算 ---------- */
function toHex(v, fb = "#888888") {
  v = String(v || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + v.slice(1).split("").map(c => c + c).join("").toLowerCase();
  const m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return "#" + m.slice(1, 4).map(x => Math.min(255, +x).toString(16).padStart(2, "0")).join("");
  return fb;
}
function hexToRgba(hex, a) {
  const h = toHex(hex), n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function luminance(hex) {
  const n = parseInt(toHex(hex).slice(1), 16);
  const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
}
function mixHex(a, b, t) {
  const ch = h => { const n = parseInt(toHex(h).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const ca = ch(a), cb = ch(b);
  return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/* ---------- 内蔵スキン（キャラクターに依存しないもの） ---------- */
const SKINS = {
  shadow: {
    label:{ja:"シャドウ",en:"Shadow",zh:"暗影",ko:"섀도우"},
    desc:{ja:"白黒シルエットの原点",en:"The original monochrome silhouette",zh:"原版黑白剪影",ko:"오리지널 흑백 실루엣"},
    ui:{"--ui-bg":"#07080d","--ui-panel":"rgba(14,16,24,.96)","--ui-soft":"rgba(255,255,255,.05)","--ui-text":"#f4f4f8",
      "--ui-muted":"#a9abb8","--ui-border":"rgba(255,255,255,.16)","--ui-button":"#1a1d29","--ui-button-hover":"#262b3b",
      "--ui-field":"#0f111a","--ui-accent":"#ff3b55","--ui-on-accent":"#ffffff","--ui-gold":"#ffd166",
      "--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,59,85,.14)"},
    game:{don:"#ff3b55",ka:"#55aaff",stage:"#050505",lane:"rgba(0,0,0,.52)",track:"rgba(255,255,255,.22)",ink:"#ffffff",
      inkShadow:"rgba(0,0,0,.85)",noteBorder:"#ffffff",panel:"rgba(10,11,16,.94)",perfect:"#ffd166",good:"#ffffff",miss:"#9aa0aa",glow:false},
    shapes:["circle","circle"], video:"grayscale(1) contrast(1.7)"
  },
  daylight: {
    label:{ja:"デイライト",en:"Daylight",zh:"日光",ko:"데이라이트"},
    desc:{ja:"明るく見やすいライトテーマ",en:"Clean, bright light theme",zh:"明亮清爽的浅色主题",ko:"밝고 깔끔한 라이트 테마"},
    ui:{"--ui-bg":"#eef1f6","--ui-panel":"rgba(255,255,255,.97)","--ui-soft":"rgba(20,30,50,.045)","--ui-text":"#1f2433",
      "--ui-muted":"#5b6475","--ui-border":"rgba(20,30,50,.16)","--ui-button":"#f3f5f9","--ui-button-hover":"#e5e9f1",
      "--ui-field":"#ffffff","--ui-accent":"#e0294a","--ui-on-accent":"#ffffff","--ui-gold":"#c47f00",
      "--ui-shadow":"0 24px 70px rgba(30,40,60,.16)","--ui-glow":"rgba(224,41,74,.10)"},
    game:{don:"#f0384f",ka:"#2f8cff",stage:"#e6eaf0",lane:"rgba(255,255,255,.80)",track:"rgba(20,30,50,.20)",ink:"#1f2433",
      inkShadow:"rgba(255,255,255,.9)",noteBorder:"#ffffff",panel:"rgba(246,248,251,.96)",perfect:"#d38f00",good:"#1f2433",miss:"#7a8394",glow:false},
    shapes:["circle","circle"], video:"grayscale(1) contrast(1.25) brightness(1.12)"
  },
  neon: {
    label:{ja:"ネオンアーケード",en:"Neon Arcade",zh:"霓虹街机",ko:"네온 아케이드"},
    desc:{ja:"シンセウェーブ風の発光",en:"Synthwave glow",zh:"合成波霓虹光效",ko:"신스웨이브 네온"},
    ui:{"--ui-bg":"#0b0418","--ui-panel":"rgba(20,8,40,.95)","--ui-soft":"rgba(255,43,214,.06)","--ui-text":"#fbefff",
      "--ui-muted":"#b9a3d6","--ui-border":"rgba(255,43,214,.30)","--ui-button":"#1d0b38","--ui-button-hover":"#2c1152",
      "--ui-field":"#12062a","--ui-accent":"#ff2bd6","--ui-on-accent":"#ffffff","--ui-gold":"#ffe94d",
      "--ui-shadow":"0 0 60px rgba(255,43,214,.25)","--ui-glow":"rgba(0,229,255,.18)"},
    game:{don:"#ff2bd6",ka:"#00e5ff",stage:"#0b0418",lane:"rgba(10,0,30,.58)",track:"rgba(0,229,255,.32)",ink:"#fbefff",
      inkShadow:"rgba(255,43,214,.8)",noteBorder:"#ffffff",panel:"rgba(16,5,34,.94)",perfect:"#ffe94d",good:"#e6f7ff",miss:"#8f7aa8",glow:true},
    shapes:["circle","circle"], video:"grayscale(1) contrast(1.5) sepia(1) hue-rotate(230deg) saturate(2.2) brightness(.8)",
    font:'"Trebuchet MS","Avenir Next",system-ui,sans-serif'
  },
  sakura: {
    label:{ja:"サクラ",en:"Sakura",zh:"樱花",ko:"사쿠라"},
    desc:{ja:"やわらかい桜色",en:"Soft cherry-blossom pastel",zh:"柔和樱花色",ko:"부드러운 벚꽃 파스텔"},
    ui:{"--ui-bg":"#fff0f4","--ui-panel":"rgba(255,250,252,.97)","--ui-soft":"rgba(214,77,128,.06)","--ui-text":"#3a2330",
      "--ui-muted":"#8a6474","--ui-border":"rgba(214,77,128,.24)","--ui-button":"#ffe6ee","--ui-button-hover":"#ffd5e2",
      "--ui-field":"#ffffff","--ui-accent":"#e0568a","--ui-on-accent":"#ffffff","--ui-gold":"#d9782a",
      "--ui-shadow":"0 24px 70px rgba(160,60,100,.15)","--ui-glow":"rgba(224,86,138,.14)"},
    game:{don:"#ff5d8f",ka:"#5aa9e6",stage:"#ffeef3",lane:"rgba(255,244,248,.84)",track:"rgba(224,86,138,.28)",ink:"#3a2330",
      inkShadow:"rgba(255,255,255,.9)",noteBorder:"#ffffff",panel:"rgba(255,246,249,.96)",perfect:"#e0802f",good:"#3a2330",miss:"#a58b97",glow:false},
    shapes:["circle","circle"], video:"sepia(.25) saturate(1.15) brightness(1.06)"
  },
  terminal: {
    label:{ja:"ターミナル",en:"Terminal",zh:"终端",ko:"터미널"},
    desc:{ja:"レトロCRT・走査線",en:"Retro CRT with scanlines",zh:"复古CRT扫描线",ko:"레트로 CRT 주사선"},
    ui:{"--ui-bg":"#020a04","--ui-panel":"rgba(3,14,6,.96)","--ui-soft":"rgba(57,255,20,.05)","--ui-text":"#b8ffb0",
      "--ui-muted":"#5fae63","--ui-border":"rgba(57,255,20,.30)","--ui-button":"#04180a","--ui-button-hover":"#072a10",
      "--ui-field":"#010802","--ui-accent":"#39ff14","--ui-on-accent":"#021a06","--ui-gold":"#ffb000",
      "--ui-shadow":"0 0 50px rgba(57,255,20,.15)","--ui-glow":"rgba(57,255,20,.12)"},
    game:{don:"#ffb000",ka:"#39ff14",stage:"#010501",lane:"rgba(0,10,2,.72)",track:"rgba(57,255,20,.30)",ink:"#b8ffb0",
      inkShadow:"rgba(0,0,0,.9)",noteBorder:"#e9ffe4",panel:"rgba(2,12,4,.95)",perfect:"#ffb000",good:"#b8ffb0",miss:"#3d7a40",glow:true,scanlines:true},
    shapes:["square","square"], video:"grayscale(1) contrast(1.5) sepia(1) hue-rotate(70deg) saturate(3) brightness(.7)",
    font:'"Cascadia Mono","Consolas","Menlo","Noto Sans Mono",monospace'
  },
  clarity: {
    label:{ja:"クラリティ",en:"Clarity",zh:"清晰",ko:"클래리티"},
    desc:{ja:"色覚多様性に配慮・形でも区別",en:"Colorblind-safe, shape-coded",zh:"色觉友好·形状区分",ko:"색각 친화 · 모양으로 구분"},
    ui:{"--ui-bg":"#000000","--ui-panel":"#0d0d0d","--ui-soft":"rgba(255,255,255,.06)","--ui-text":"#ffffff",
      "--ui-muted":"#cfcfcf","--ui-border":"rgba(255,255,255,.45)","--ui-button":"#1a1a1a","--ui-button-hover":"#2a2a2a",
      "--ui-field":"#000000","--ui-accent":"#E69F00","--ui-on-accent":"#000000","--ui-gold":"#F0E442",
      "--ui-shadow":"none","--ui-glow":"rgba(230,159,0,.18)"},
    game:{don:"#E69F00",ka:"#56B4E9",stage:"#000000",lane:"rgba(0,0,0,.78)",track:"rgba(255,255,255,.42)",ink:"#ffffff",
      inkShadow:"#000000",noteBorder:"#ffffff",panel:"rgba(0,0,0,.95)",perfect:"#F0E442",good:"#ffffff",miss:"#999999",glow:false},
    shapes:["circle","diamond"], video:"grayscale(1) brightness(.55)"
  },
  buddy: {
    label:{ja:"オレンジ相棒",en:"Orange Buddy",zh:"橙色搭档",ko:"오렌지 버디"},
    desc:{ja:"AIあるあるミームで応援",en:"Cheers you on with AI-assistant memes",zh:"用AI助手梗为你加油",ko:"AI 어시스턴트 밈으로 응원"},
    ui:{"--ui-bg":"#17110d","--ui-panel":"rgba(34,24,18,.96)","--ui-soft":"rgba(255,140,60,.06)","--ui-text":"#fff3e6",
      "--ui-muted":"#c9ad96","--ui-border":"rgba(255,140,60,.28)","--ui-button":"#2a1d15","--ui-button-hover":"#3a271b",
      "--ui-field":"#120c09","--ui-accent":"#ff7a2f","--ui-on-accent":"#1a0d05","--ui-gold":"#ffc861",
      "--ui-shadow":"0 24px 80px rgba(0,0,0,.55)","--ui-glow":"rgba(255,122,47,.16)"},
    game:{don:"#ff6a1f",ka:"#46c2cb",stage:"#120c09",lane:"rgba(30,18,10,.62)",track:"rgba(255,150,80,.30)",ink:"#fff3e6",
      inkShadow:"rgba(0,0,0,.85)",noteBorder:"#ffffff",panel:"rgba(28,18,12,.95)",perfect:"#ffc861",good:"#fff3e6",miss:"#9c8676",glow:false},
    shapes:["circle","circle"], video:"sepia(.5) saturate(1.4) hue-rotate(-10deg) brightness(.75)",
    font:'"Trebuchet MS","Avenir Next",system-ui,sans-serif', mascot:"buddy"
  },
  snowfield: {   // 標準マスコット（冬服ミク）は characters/miku.js があるときだけ設定されます
    label:{ja:"スノーフィールド",en:"Snowfield",zh:"雪原",ko:"스노필드"},
    desc:{ja:"雪景色のライトテーマ",en:"Snowy light theme",zh:"雪景浅色主题",ko:"눈 풍경 라이트 테마"},
    ui:{"--ui-bg":"#eef5fb","--ui-panel":"rgba(255,255,255,.96)","--ui-soft":"rgba(40,90,140,.05)","--ui-text":"#1d3550",
      "--ui-muted":"#5e7690","--ui-border":"rgba(40,90,140,.18)","--ui-button":"#f1f6fb","--ui-button-hover":"#e1ecf6",
      "--ui-field":"#ffffff","--ui-accent":"#2f8fd8","--ui-on-accent":"#ffffff","--ui-gold":"#c2477e",
      "--ui-shadow":"0 24px 70px rgba(40,80,120,.16)","--ui-glow":"rgba(47,143,216,.12)"},
    game:{don:"#ff5d7a",ka:"#3a9be0",stage:"#e8f1f8",lane:"rgba(255,255,255,.82)",track:"rgba(40,90,140,.22)",ink:"#1d3550",
      inkShadow:"rgba(255,255,255,.9)",noteBorder:"#ffffff",panel:"rgba(244,249,253,.96)",perfect:"#c2477e",good:"#1d3550",miss:"#8aa0b6",glow:false},
    shapes:["circle","circle"], video:"grayscale(.6) brightness(1.1) contrast(1.1) hue-rotate(180deg) saturate(.6)"
  }
};

/* ---------- マスコット（内蔵：オレンジ相棒・VRM。キャラクターは registerMascot で追加） ---------- */
const MASCOT_IDS = ["buddy", "vrm", "mmd"];
const MASCOT_FAMILY = { buddy:"buddy", vrm:"vrm", mmd:"mmd" };
const MASCOT_DEFS = {};
const MASCOT_CAPTIONS = {
  buddy: {
    capStart:{ja:"ご依頼ありがとうございます！一歩ずつ叩いていきましょう。",en:"Great question! Let's drum through this step by step.",
      zh:"好问题！我们一步一步敲下去吧。",ko:"좋은 질문이에요! 한 단계씩 두드려 봅시다."},
    capCombo:{ja:"{n}コンボ！まさにおっしゃる通りです！",en:"{n} combo! You're absolutely right!",
      zh:"{n}连击！您说得完全正确！",ko:"{n} 콤보! 완전히 맞는 말씀입니다!"},
    capBreak:{ja:"ご指摘ありがとうございます。私のミスでした！",en:"You're right, I apologize for the confusion!",
      zh:"感谢指正，是我的失误！",ko:"지적 감사합니다. 제 실수였어요!"}
  },
  vrm: {
    capStart:{ja:"いくよ！リズムに乗っていこう！",en:"Let's go! Ride the rhythm!",zh:"出发！跟上节奏吧！",ko:"가자! 리듬을 타 보자!"},
    capCombo:{ja:"{n}コンボ！いい調子！",en:"{n} combo! Nice groove!",zh:"{n}连击！状态很好！",ko:"{n} 콤보! 좋은 흐름이야!"},
    capBreak:{ja:"ドンマイ！まだまだこれから！",en:"No worries! Plenty of song left!",zh:"没关系！还早着呢！",ko:"괜찮아! 아직 남았어!"}
  }
};
/* キャラクターのマスコットを追加する（MOD用）
   def = { family, draw(x, y, st), top, shadowY, border, credit() }
     draw   : st = { p:時刻, sad, happy, talking } を受け取って描く
     top    : 吹き出しを出す高さ（立ち位置からの差）
     credit : （任意）プレイ中に右下へ表示する文字列を返す関数
   セリフは MASCOT_CAPTIONS[family] に入れます。 */
function registerMascot(id, def) {
  if (!/^[A-Za-z0-9_]{1,32}$/.test(id) || ["skin", "none", "vrm", "buddy"].includes(id) || !def || typeof def.draw !== "function") return false;
  if (!MASCOT_IDS.includes(id)) MASCOT_IDS.splice(MASCOT_IDS.indexOf("vrm"), 0, id);
  MASCOT_FAMILY[id] = def.family || id;
  MASCOT_DEFS[id] = def;
  return true;
}

/* ---------- カスタムスキンの組み立て ---------- */
const FONT_PRESETS = {
  default:null, mono:'"Cascadia Mono","Consolas","Menlo","Noto Sans Mono",monospace',
  rounded:'"Trebuchet MS","Avenir Next",system-ui,sans-serif', serif:'Georgia,"Noto Serif JP","Noto Serif SC",serif'
};
const VIDEO_PRESETS = {
  mono:"grayscale(1) contrast(1.6)", color:"none", dim:"brightness(.45) saturate(.85)",
  warm:"sepia(.45) saturate(1.3) brightness(.85)", cool:"grayscale(.4) hue-rotate(180deg) saturate(1.4) brightness(.8)"
};
/* ---------- 背景グラデーション（プリセットとカスタム両方で使う） ---------- */
const GRAD_DIRS = ["none", "down", "up", "left", "right"];
const GRAD_ANGLE = { down:"180deg", up:"0deg", right:"90deg", left:"270deg" };
/* "linear-gradient(180deg,#a,#b)" から {from,to,dir} を読む（スキンのリミックス用。読めなければ null） */
function parseGrad(v) {
  if (typeof v !== "string" || !v.includes("gradient")) return null;
  const hex = [...v.matchAll(/#[0-9a-f]{6}/gi)].map(m => m[0].toLowerCase());
  if (hex.length < 2) return null;
  const deg = v.match(/(-?\d+(?:\.\d+)?)deg/i);
  const dir = deg ? { 0:"up", 90:"right", 180:"down", 270:"left" }[String(Math.round((+deg[1] % 360 + 360) % 360))] || "down" : "down";
  return { from:hex[0], to:hex[hex.length - 1], dir };
}
function sanitizeSkinDef(raw) {
  if (!raw || typeof raw !== "object" || !raw.colors || typeof raw.colors !== "object") return null;
  const colors = {};
  for (const k of ["bg", "panel", "text", "accent", "gold"]) {
    const v = raw.colors[k];
    if (typeof v !== "string" || !HEX.test(v)) return null;
    colors[k] = v.toLowerCase();
  }
  colors.bg2 = typeof raw.colors.bg2 === "string" && HEX.test(raw.colors.bg2) ? raw.colors.bg2.toLowerCase() : "";   // グラデ先用（任意）
  return {
    name: String(raw.name || "").trim().slice(0, 24) || "Custom",
    colors, glow: !!raw.glow, scanlines: !!raw.scanlines,
    gradDir: GRAD_DIRS.includes(raw.gradDir) ? raw.gradDir : "none",
    font: has(FONT_PRESETS, raw.font) ? raw.font : "default",
    video: has(VIDEO_PRESETS, raw.video) ? raw.video : "mono",
    mascot: MASCOT_IDS.includes(raw.mascot) ? raw.mascot : "none"
  };
}
function buildCustomSkin(def) {
  const c = def.colors, dark = luminance(c.bg) < .35;
  const grad = c.bg2 && def.gradDir && def.gradDir !== "none" ? `linear-gradient(${GRAD_ANGLE[def.gradDir]}, ${c.bg}, ${c.bg2})` : null;   // --ui-bg と game.stage はそのまま CSS background へ
  return {
    custom:true,
    label:{ en:def.name },
    desc:{ ja:"カスタムスキン", en:"Custom skin", zh:"自定义皮肤", ko:"커스텀 스킨" },
    ui:{ "--ui-bg":grad || c.bg, "--ui-panel":hexToRgba(c.panel, .96), "--ui-soft":hexToRgba(c.text, .05), "--ui-text":c.text,
      "--ui-muted":mixHex(c.text, c.panel, .38), "--ui-border":hexToRgba(c.text, .18),
      "--ui-button":mixHex(c.panel, c.text, .06), "--ui-button-hover":mixHex(c.panel, c.text, .13),
      "--ui-field":mixHex(c.bg, c.panel, .5), "--ui-accent":c.accent,
      "--ui-on-accent":luminance(c.accent) > .45 ? "#111111" : "#ffffff", "--ui-gold":c.gold,
      "--ui-shadow":dark ? "0 24px 80px rgba(0,0,0,.55)" : "0 24px 70px rgba(30,40,60,.16)",
      "--ui-glow":hexToRgba(c.accent, .14) },
    game:{ don:c.accent, ka:c.gold, stage:grad || c.bg, lane:hexToRgba(c.panel, dark ? .6 : .82), track:hexToRgba(c.text, .24),
      ink:c.text, inkShadow:dark ? "rgba(0,0,0,.85)" : "rgba(255,255,255,.9)", noteBorder:"#ffffff",
      panel:hexToRgba(c.panel, .95), perfect:c.gold, good:c.text, miss:mixHex(c.text, c.bg, .45),
      glow:def.glow, scanlines:def.scanlines },
    shapes:["circle","circle"],
    video:VIDEO_PRESETS[def.video],
    font:FONT_PRESETS[def.font] || undefined,
    mascot:def.mascot !== "none" ? def.mascot : undefined
  };
}

/* ---------- レイアウト（1920×1080基準の座標） ---------- */
const LAYOUTS = {
  classic:    { video:{x:0,y:0,w:W,h:H}, vertical:false, laneY:330, hitX:260, endX:1860 },
  vertical:   { video:{x:720,y:0,w:1200,h:H}, vertical:true, panel:{x:30,y:96,w:660,h:964,r:26}, centers:[250,470], laneW:200, topY:110, hitY:890 },
  center:     { video:{x:0,y:0,w:W,h:H}, vertical:true, panel:{x:730,y:0,w:460,h:H,r:0}, centers:[850,1070], laneW:200, topY:0, hitY:890 },
  commentary: { video:{x:0,y:0,w:W,h:740}, vertical:false, commentary:true, laneY:945, hitX:520, endX:1870 }
};
const MASCOT_POS = { classic:{x:1780,y:900}, vertical:{x:1790,y:930}, center:{x:1790,y:930}, commentary:{x:1800,y:630} };
const VRM_RECT = {
  classic:{x:1490,y:440,w:400,h:600}, vertical:{x:1490,y:440,w:400,h:600},
  center:{x:1490,y:440,w:400,h:600}, commentary:{x:1520,y:250,w:380,h:560}
};

/* ---------- 難易度（判定幅はms） ---------- */
const DIFFS = {
  easy:   { div:1, density:.55, perfect:50, good:120 },
  normal: { div:2, density:.48, perfect:42, good:105 },
  hard:   { div:4, density:.60, perfect:36, good:95 },
  master: { div:4, density:.82, perfect:30, good:80 },
  rush:   { div:4, target:2000, density:.95, perfect:28, good:75 }
};
const DIFF_IDS = Object.keys(DIFFS);

/* ---------- ノーツの見た目（スキンとは別に保存） ---------- */
const NOTE_SHAPES = ["circle", "diamond", "square"];
const NOTE_PRESETS = {
  classic: [{ color:"#ff3b55", shape:"circle" }, { color:"#55aaff", shape:"circle" }],
  clarity: [{ color:"#e69f00", shape:"circle" }, { color:"#56b4e9", shape:"diamond" }]
};
function sanitizeNotes(v) {
  return [0, 1].map(i => {
    const n = Array.isArray(v) && v[i] && typeof v[i] === "object" ? v[i] : {}, d = NOTE_PRESETS.classic[i];
    return {
      color: typeof n.color === "string" && HEX.test(n.color) ? n.color.toLowerCase() : d.color,
      shape: NOTE_SHAPES.includes(n.shape) ? n.shape : d.shape
    };
  });
}

/* ---------- 隠しSeed ----------
   EGG_KEYS ：Seedがこの文字列と同じとき（stagefx.js・catch.js も追加します）
   EGG_WORDS：Seedにこの言葉が含まれるとき
   どちらも大文字・小文字は区別しません。判定は core.js の seedEggs() */
const EGG_KEYS = { "143":"egg143", "765":"egg765", "2000":"egg2000" };
const EGG_WORDS = [
  { words:["olivier", "nightmare", "lunatic", "hentai"], key:"eggHard", master:true },   // MASTER を解放（765と同じ）
  { words:["1919", "go"], key:"eggGo", level:10 }                                       // 推定レベル Lv.10
];
/* ✅ data.js 完了 */
