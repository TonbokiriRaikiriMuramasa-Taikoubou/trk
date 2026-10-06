// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! modes.js — 🪐 ORBIT（ワンボタン）／❤ 体力・体力の表示／🏅 称号
   ・設定画面の部品を作る関数（makeSeg・makeCheck・makeColorRow・hintEl）もここにあります。
     stage.js・stagefx.js・catch.js・extras.js・speed.js も使います。
   ・体力モードの設定値（settings.lives）と「MODS:」の行は core.js、共通の文章は i18n.js にあります。
   読み込み順：… truck.js → modes.js → stage.js → stagefx.js → catch.js → extras.js → library.js …
   ========================================================================== */
"use strict";

/* ============ 文章（ORBITの見た目だけ。体力・称号の文章は i18n.js／i18n-options.js） ============ */
Object.assign(TEXT.ja, {
  orbitAnyKey:"どのキーでもOK！ ノーツが判定点に重なったら押そう",
  orbitViewTitle:"🪐 ORBITの見た目", orbitLaneColor:"ノーツをドン／カッの色で表示する（オフ＝スキンの色で1色）",
  orbitStyleLabel:"道の動き", orbitStyleFree:"🎸 自由（四方八方から）", orbitStyleCalm:"🌊 おだやか（右から）",
  orbitSizeLabel:"ノーツの大きさ", orbitSizeGrow:"次のノーツを大きく", orbitSizeFixed:"サイズ固定", orbitSizeJudge:"判定の幅で表示",
  orbitSizeHint:"「判定の幅で表示」：タイルの長さ＝PERFECTの幅、外側の薄い枠＝GOODの幅。タイルが判定点に触れている間に押せばPERFECTです。",
  orbitCoreLabel:"判定点（ORBIT本体）の形", orbitCorePlanet:"● 惑星", orbitCoreRing:"◯ リング枠", orbitCoreSquare:"□ 四角枠",
  orbitCoreDiamond:"◇ ひし形枠", orbitCoreTarget:"◎ ターゲット", orbitCoreBracket:"⌜⌟ ブラケット",
  orbitCoreHint:"枠タイプは、真ん中の空いた所にノーツをはめるように押します。四角・ひし形・ブラケットは道の向きに合わせて回ります。",
  orbitCoreColor:"判定点の色", orbitMoonColor:"恒星の色", colorReset:"↺ スキンの色",
  orbitMoonLabel:"恒星（周りを回る星）", orbitMoonSong:"曲の終わりで1周（進み具合）", orbitMoonBeat:"1拍で1周", orbitMoonOff:"表示しない",
  orbitMoonShapeLabel:"恒星の形", orbitMoonOrb:"● 玉", orbitMoonStar:"★ 星", orbitMoonComet:"☄ ほうき星",
  orbitViewHint:"ノーツは道に乗って画面中央の判定点へ流れてきます。道の細い線は1拍、太い線は1小節です。",
  swayOrbit:"🪐 ORBITでレーンを揺らす（オフ＝揺れを止める）"
});
Object.assign(TEXT.en, {
  orbitAnyKey:"Any key works! Press when a note reaches the target",
  orbitViewTitle:"🪐 ORBIT look", orbitLaneColor:"Show notes in Don/Ka colors (off = one skin color)",
  orbitStyleLabel:"Path motion", orbitStyleFree:"🎸 Free (from any direction)", orbitStyleCalm:"🌊 Calm (from the right)",
  orbitSizeLabel:"Note size", orbitSizeGrow:"Enlarge next note", orbitSizeFixed:"Fixed size", orbitSizeJudge:"Show hit window",
  orbitSizeHint:"“Show hit window”: the tile length is the PERFECT window and the faint outline is the GOOD window. Press while the tile touches the target for a PERFECT.",
  orbitCoreLabel:"Target (ORBIT core) shape", orbitCorePlanet:"● Planet", orbitCoreRing:"◯ Ring frame", orbitCoreSquare:"□ Square frame",
  orbitCoreDiamond:"◇ Diamond frame", orbitCoreTarget:"◎ Crosshair", orbitCoreBracket:"⌜⌟ Brackets",
  orbitCoreHint:"Frame types are hollow: press as the note slots into the empty center. Square, diamond and brackets rotate with the path.",
  orbitCoreColor:"Target color", orbitMoonColor:"Star color", colorReset:"↺ Skin color",
  orbitMoonLabel:"Orbiting star", orbitMoonSong:"One lap per song (progress)", orbitMoonBeat:"One lap per beat", orbitMoonOff:"Hidden",
  orbitMoonShapeLabel:"Star shape", orbitMoonOrb:"● Orb", orbitMoonStar:"★ Star", orbitMoonComet:"☄ Comet",
  orbitViewHint:"Notes ride the path into the target at the center of the screen. Thin marks are beats, thick marks are bars.",
  swayOrbit:"🪐 Sway the lane in ORBIT (off = keep it still)"
});
Object.assign(TEXT.zh, {
  orbitAnyKey:"任意键都可以！音符到达判定点时按下",
  orbitViewTitle:"🪐 ORBIT 外观", orbitLaneColor:"用咚／咔的颜色显示音符（关闭＝皮肤单色）",
  orbitStyleLabel:"道路动态", orbitStyleFree:"🎸 自由（四面八方）", orbitStyleCalm:"🌊 平缓（从右侧）",
  orbitSizeLabel:"音符大小", orbitSizeGrow:"放大下一个音符", orbitSizeFixed:"固定大小", orbitSizeJudge:"按判定范围显示",
  orbitSizeHint:"“按判定范围显示”：方块长度＝PERFECT的范围，外侧淡色框＝GOOD的范围。方块碰到判定点时按下即为PERFECT。",
  orbitCoreLabel:"判定点（ORBIT本体）形状", orbitCorePlanet:"● 行星", orbitCoreRing:"◯ 圆环框", orbitCoreSquare:"□ 方框",
  orbitCoreDiamond:"◇ 菱形框", orbitCoreTarget:"◎ 准星", orbitCoreBracket:"⌜⌟ 四角框",
  orbitCoreHint:"框型判定点中间是空的，在音符嵌入空位时按下。方框、菱形框、四角框会随道路方向旋转。",
  orbitCoreColor:"判定点颜色", orbitMoonColor:"恒星颜色", colorReset:"↺ 皮肤颜色",
  orbitMoonLabel:"恒星（绕行的星）", orbitMoonSong:"整首歌绕一圈（进度）", orbitMoonBeat:"每拍绕一圈", orbitMoonOff:"不显示",
  orbitMoonShapeLabel:"恒星形状", orbitMoonOrb:"● 圆球", orbitMoonStar:"★ 星星", orbitMoonComet:"☄ 彗星",
  orbitViewHint:"音符沿着道路流向画面中央的判定点。细线是拍，粗线是小节。",
  swayOrbit:"🪐 ORBIT 模式下摇摆车道（关闭＝不摇）"
});
Object.assign(TEXT.ko, {
  orbitAnyKey:"아무 키나 OK! 노트가 판정점에 겹치면 누르세요",
  orbitViewTitle:"🪐 ORBIT 외관", orbitLaneColor:"노트를 쿵／딱 색으로 표시 (끄면 스킨 색 한 가지)",
  orbitStyleLabel:"길의 움직임", orbitStyleFree:"🎸 자유 (사방팔방에서)", orbitStyleCalm:"🌊 잔잔하게 (오른쪽에서)",
  orbitSizeLabel:"노트 크기", orbitSizeGrow:"다음 노트 크게", orbitSizeFixed:"크기 고정", orbitSizeJudge:"판정 범위로 표시",
  orbitSizeHint:"'판정 범위로 표시': 타일 길이＝PERFECT 범위, 바깥쪽 옅은 테두리＝GOOD 범위. 타일이 판정점에 닿아 있는 동안 누르면 PERFECT입니다.",
  orbitCoreLabel:"판정점 (ORBIT 본체) 모양", orbitCorePlanet:"● 행성", orbitCoreRing:"◯ 링 테두리", orbitCoreSquare:"□ 사각 테두리",
  orbitCoreDiamond:"◇ 마름모 테두리", orbitCoreTarget:"◎ 조준점", orbitCoreBracket:"⌜⌟ 브래킷",
  orbitCoreHint:"테두리형은 가운데가 비어 있어, 노트가 빈 곳에 들어맞을 때 누릅니다. 사각・마름모・브래킷은 길의 방향에 맞춰 회전합니다.",
  orbitCoreColor:"판정점 색", orbitMoonColor:"항성 색", colorReset:"↺ 스킨 색",
  orbitMoonLabel:"항성 (주위를 도는 별)", orbitMoonSong:"곡 끝에서 한 바퀴 (진행도)", orbitMoonBeat:"1박에 한 바퀴", orbitMoonOff:"표시 안 함",
  orbitMoonShapeLabel:"항성 모양", orbitMoonOrb:"● 구슬", orbitMoonStar:"★ 별", orbitMoonComet:"☄ 혜성",
  orbitViewHint:"노트가 길을 타고 화면 중앙의 판정점으로 흘러옵니다. 가는 선은 1박, 굵은 선은 1마디입니다.",
  swayOrbit:"🪐 ORBIT에서 레인 흔들기 (끄면 흔들리지 않음)"
});

/* ============ 設定 ============ */
const hexOrEmpty = v => typeof v === "string" && HEX.test(v) ? v.toLowerCase() : "";
settings.lifeNumber = !!prefs.lifeNumber;
settings.lifeSkin = pick(prefs.lifeSkin, ["heart", "bar", "segments", "battery", "shield", "mode", "custom"], "heart");
settings.lifeEmoji = typeof prefs.lifeEmoji === "string" && prefs.lifeEmoji.trim() ? Array.from(prefs.lifeEmoji).slice(0, 4).join("") : "💠";
settings.orbitLaneColor = !!prefs.orbitLaneColor;
settings.orbitStyle = pick(prefs.orbitStyle, ["free", "calm"], "free");
settings.orbitNoteSize = pick(prefs.orbitNoteSize, ["grow", "fixed", "judge"], "grow");
settings.orbitCore = pick(prefs.orbitCore, ["planet", "ring", "square", "diamond", "target", "bracket"], "planet");
settings.orbitCoreColor = hexOrEmpty(prefs.orbitCoreColor);
settings.orbitMoon = pick(prefs.orbitMoon, ["song", "beat", "off"], "song");
settings.orbitMoonShape = pick(prefs.orbitMoonShape, ["orb", "star", "comet"], "orb");
settings.orbitMoonColor = hexOrEmpty(prefs.orbitMoonColor);

const isOrbit = () => settings.playMode === "orbit";
const orbitCoreColor = () => settings.orbitCoreColor || toHex(skin().ui["--ui-accent"]);
const orbitMoonColor = () => settings.orbitMoonColor || toHex(skin().game.perfect);

/* ============ 設定画面の部品（ほかのファイルからも使います） ============ */
function makeSeg(id, key, items) {
  const seg = el("div", "seg"); seg.id = id;
  for (const [value, label] of items) {
    const b = el("button"); b.type = "button"; b.dataset.v = value; b.dataset.i18n = label; b.textContent = tr(label); seg.append(b);
  }
  const sync = () => seg.querySelectorAll("button").forEach(b => {
    const on = b.dataset.v === String(settings[key]);
    b.classList.toggle("selected", on); b.setAttribute("aria-pressed", String(on));
  });
  seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    settings[key] = b.dataset.v; saveUserPrefs(); sync();
    if (key === "orbitStyle") orbitPath.src = null;
  });
  sync();
  return seg;
}
function makeCheck(id, key, label) {
  const lab = el("label", "check"), inp = document.createElement("input"), sp = el("span", "", tr(label));
  inp.type = "checkbox"; inp.id = id; inp.checked = !!settings[key];
  sp.dataset.i18n = label; lab.append(inp, sp);
  inp.addEventListener("change", () => { settings[key] = inp.checked; saveUserPrefs(); });
  return lab;
}
let colorRowSeq = 0;
function makeColorRow(key, label, fallback) {
  const row = el("div", "inline"), lab = el("span", "", tr(label)), inp = document.createElement("input"), reset = el("button", "", tr("colorReset"));
  lab.dataset.i18n = label; inp.type = "color";
  lab.id = "colorRowLab" + (++colorRowSeq); inp.setAttribute("aria-labelledby", lab.id);
  reset.type = "button"; reset.dataset.i18n = "colorReset"; reset.style.cssText = "padding:6px 12px;font-size:14px";
  const sync = () => { inp.value = settings[key] || fallback(); reset.disabled = !settings[key]; };
  inp.addEventListener("input", () => { settings[key] = inp.value.toLowerCase(); saveUserPrefs(); sync(); });
  reset.addEventListener("click", () => { settings[key] = ""; saveUserPrefs(); sync(); });
  on("skin", sync); sync();
  row.append(lab, inp, reset);
  return row;
}
function hintEl(key) { const h = el("div", "hint", tr(key)); h.dataset.i18n = key; return h; }

/* ============ ❤ 体力ルール（ノーツ数に応じた動的スケーリング） ============
   音ゲー（IIDX・SDVX・太鼓・osu!・チュウニズム等）のライフ／ゲージ設計を研究し、
   譜面の総ノーツ数（chart.length）に応じて初期体力・最大上限・コンボ回復間隔を最適化：
   ・短曲（〜100ノーツ）：初期体力を確保しつつ小刻みなコンボで回復可能にして理不尽な即死を防ぐ
   ・標準曲（300〜600ノーツ）：適度な緊張感と達成感のあるバランス
   ・長曲・高密度曲（1000〜2000+ノーツ）：体力の余裕と相応のコンボ継続回復を求め、持続的な緊張感を維持
   ※ trk!（chicken）：常に1ライフ・回復なしの即死（調整なし）
   ※ Infinite（none）：体力なし・ミスしても完走 */
const LIFE_RULES = {          // TRUCK（基準値）
  standard:{ start:4, max:6, heal:35 }, knight:{ start:3, max:4, heal:50 }, chicken:{ max:1, heal:0 }, none:{ max:0, heal:0 }
};
const MANUAL_LIFE_RULES = {   // MANUAL・STAGE・CATCH（基準値）
  standard:{ start:20, max:35, heal:12 }, knight:{ start:6, max:9, heal:28 }, chicken:{ max:1, heal:0 }, none:{ max:0, heal:0 }
};
const ORBIT_LIFE_RULES = {    // ORBIT（基準値）
  standard:{ start:20, max:32, heal:16 }, knight:{ start:6, max:9, heal:32 }, chicken:{ max:1, heal:0 }, none:{ max:0, heal:0 }
};

function lifeRule(totalNotes) {
  const opt = settings.lives || "standard";
  if (opt === "none") return { start:0, max:0, heal:0 };
  if (opt === "chicken") return { start:1, max:1, heal:0 }; // trk! 1-life sudden death (調整なし)

  const n = (typeof totalNotes === "number" && totalNotes > 0)
    ? totalNotes
    : ((Array.isArray(chart) && chart.length > 0) ? chart.length : 350);
  const factor = Math.max(0, Math.min(1, (n - 50) / 1150));
  const m = settings.playMode;

  if (m === "truck") {
    if (opt === "knight") {
      const start = n <= 250 ? 2 : 3;
      const max = n <= 250 ? 3 : (n <= 650 ? 4 : 5);
      const heal = Math.round(35 + 25 * factor);
      return { start, max, heal };
    }
    const start = n <= 250 ? 3 : (n <= 650 ? 4 : 5);
    const max = n <= 250 ? 5 : (n <= 650 ? 6 : 8);
    const heal = Math.round(25 + 25 * factor);
    return { start, max, heal };
  }

  if (m === "orbit") {
    if (opt === "knight") {
      const start = Math.round(5 + 5 * factor);
      const max = Math.round(7 + 6 * factor);
      const heal = Math.round(25 + 25 * factor);
      return { start, max, heal };
    }
    const start = Math.round(15 + 15 * factor);
    const max = Math.round(20 + 25 * factor);
    const heal = Math.round(12 + 12 * factor);
    return { start, max, heal };
  }

  // MANUAL・STAGE・CATCH
  if (opt === "knight") {
    const start = Math.round(5 + 5 * factor);
    const max = Math.round(7 + 7 * factor);
    const heal = Math.round(20 + 25 * factor);
    return { start, max, heal };
  }
  // standard
  const start = Math.round(15 + 20 * factor);
  const max = Math.round(25 + 35 * factor);
  const heal = Math.round(8 + 14 * factor);
  return { start, max, heal };
}

const LIFE_TAGS = { knight:"KNIGHT", chicken:"TRK!", none:"INF" };
const lifeState = { hp:0, max:0, heal:0, lostAt:-1e9, healAt:-1e9 };
const lifeTags = () => Object.prototype.hasOwnProperty.call(LIFE_TAGS, settings.lives) ? [LIFE_TAGS[settings.lives]] : [];

function resetLives() {
  const r = lifeRule();
  lifeState.max = settings.autoPlay ? 0 : r.max;
  lifeState.hp = lifeState.max ? Math.min(lifeState.max, r.start ?? r.max) : 0;
  lifeState.heal = r.heal || 0;
  lifeState.lostAt = lifeState.healAt = -1e9;
}
/* 判定のあとに呼ぶ。体力が0になったら true（CATCHの衝突は catch.js が直接減らします） */
function lifeAfterJudge(kind) {
  if (!lifeState.max) return false;
  const healInterval = lifeState.heal > 0 ? lifeState.heal : (lifeRule().heal || 0);
  const p = performance.now();
  if (kind === "miss") {
    lifeState.hp = Math.max(0, lifeState.hp - 1); lifeState.lostAt = p;
    return lifeState.hp <= 0;
  }
  if (healInterval > 0 && stats.combo > 0 && stats.combo % healInterval === 0 && lifeState.hp < lifeState.max) {
    lifeState.hp++; lifeState.healAt = p;
    showToast(tr("lifeHeal"));
  }
  return false;
}
function failSound() {
  const ac = getAC(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = "sawtooth"; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(70, t + .7);
  g.gain.setValueAtTime(Math.max(.002, settings.seVolume * .6), t); g.gain.exponentialRampToValueAtTime(.0001, t + .8);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .85);
}

/* ============ ❤ 体力の表示（コンパクト。5以下のハートは並べ、多いときはゲージ） ============ */
const MODE_EMOJI = { manual:"🥁", truck:"🚚", orbit:"🪐", stage:"🎪", catch:"🚛" };
function heartPath(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * .9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * .2, x - s * .7, y - s * 1.2, x, y - s * .45);
  ctx.bezierCurveTo(x + s * .7, y - s * 1.2, x + s * 1.4, y - s * .2, x, y + s * .9);
  ctx.closePath();
}
function lifeIcon() {
  switch (settings.lifeSkin) {
    case "heart": return "❤";
    case "shield": return "🛡";
    case "mode": return MODE_EMOJI[settings.playMode] || "❤";
    case "custom": return settings.lifeEmoji || "💠";
    default: return "";
  }
}
function lifeText(x, y, size) {
  const t = `${lifeState.hp}/${lifeState.max}`;
  ctx.font = `800 ${size}px ${fontFamily()}`; ctx.textAlign = "left";
  ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.strokeText(t, x, y);
  ctx.fillStyle = "#fff"; ctx.fillText(t, x, y);
}
function drawLifeBar(x, y, w, h, ratio, color) {
  const battery = settings.lifeSkin === "battery", seg = settings.lifeSkin === "segments";
  rr(x, y, w, h, battery ? 4 : h / 2); ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fill();
  if (battery) {
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(x + w + 2, y + h * .28, 5, h * .44);
  }
  if (seg) {
    const n = 10, gap = 3, cw = (w - gap * (n - 1)) / n, act = Math.ceil(ratio * n);
    for (let i = 0; i < n; i++) {
      rr(x + i * (cw + gap), y, cw, h, 3);
      ctx.fillStyle = i < act ? color : "rgba(255,255,255,.12)"; ctx.fill();
    }
  } else if (ratio > 0) {
    const pad = battery ? 3 : 0, fw = (w - pad * 2) * ratio;
    rr(x + pad, y + pad, Math.max(h - pad * 2, fw), h - pad * 2, Math.min(6, h / 2));
    ctx.fillStyle = color; ctx.fill();
  }
}
function drawLives() {   // render.js から呼ばれます
  if (!lifeState.max || phase === "title") return;
  const p = performance.now(), x0 = settings.layout === "vertical" && !ownField() ? 760 : 70, y = 152;
  const ratio = Math.max(0, Math.min(1, lifeState.hp / lifeState.max));
  const color = ratio <= .3 ? "#ffb000" : toHex(skin().ui["--ui-accent"]);
  const shake = Math.max(0, 1 - (p - lifeState.lostAt) / 400) * Math.sin(p / 25) * 5;
  const healing = p - lifeState.healAt < 600;
  ctx.save(); ctx.textBaseline = "middle";
  if (settings.lifeSkin === "heart" && lifeState.max <= 5) {
    for (let i = 0; i < lifeState.max; i++) {
      const x = x0 + 16 + i * 32 + (i === lifeState.hp ? shake : 0);
      heartPath(x, y, 12);
      if (i < lifeState.hp && healing && i === lifeState.hp - 1) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
      ctx.fillStyle = i < lifeState.hp ? color : "rgba(0,0,0,.35)"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
    }
    if (settings.lifeNumber) lifeText(x0 + 8 + lifeState.max * 32, y, 17);
    ctx.restore(); return;
  }
  const icon = lifeIcon(), bx = icon ? x0 + 46 : x0 + 12, bw = 200, bh = 12;
  if (icon) { ctx.font = `22px ${FONT_DEFAULT}`; ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.fillText(icon, x0 + 12 + shake, y + 1); }
  if (healing) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
  drawLifeBar(bx, y - bh / 2, bw, bh, ratio, color);
  ctx.shadowBlur = 0;
  if (settings.lifeNumber) lifeText(bx + bw + 14, y, 15);
  ctx.restore();
}

/* ============ ❤ 体力の設定画面 ============ */
function syncLivesUI() {
  document.querySelectorAll("#livesPicker button").forEach(b => {
    const on = b.dataset.lives === settings.lives;
    b.classList.toggle("selected", on); b.setAttribute("aria-pressed", String(on));
  });
  const num = $("lifeNumber"), sel = $("lifeSkinSelect"), emo = $("lifeEmojiInput");
  if (num) num.checked = settings.lifeNumber;
  if (sel) sel.value = settings.lifeSkin;
  if (emo) { emo.value = settings.lifeEmoji; emo.closest(".field").hidden = settings.lifeSkin !== "custom"; }
}
$("livesPicker").addEventListener("click", e => {
  const b = e.target.closest("button[data-lives]"); if (!b) return;
  settings.lives = b.dataset.lives; saveUserPrefs(); syncLivesUI(); emit("options");
});
(() => {
  /* 「体力の数字も表示する」：index.html にあればそれを使い、なければ作る */
  let num = $("lifeNumber");
  if (num) num.addEventListener("change", () => { settings.lifeNumber = num.checked; saveUserPrefs(); });
  else {
    const picker = $("livesPicker"); if (!picker) return;
    (picker.nextElementSibling || picker).after(makeCheck("lifeNumber", "lifeNumber", "lifeNumber"));
    num = $("lifeNumber");
  }
  /* 表示スタイルと絵文字 */
  const skinField = el("label", "field"), skinLab = el("span", "", tr("lifeSkinLabel")), sel = document.createElement("select");
  skinLab.dataset.i18n = "lifeSkinLabel"; sel.id = "lifeSkinSelect";
  for (const [v, k] of [["heart", "lifeSkinHeart"], ["bar", "lifeSkinBar"], ["segments", "lifeSkinSegments"],
    ["battery", "lifeSkinBattery"], ["shield", "lifeSkinShield"], ["mode", "lifeSkinMode"], ["custom", "lifeSkinCustom"]]) {
    const o = document.createElement("option"); o.value = v; o.dataset.i18n = k; o.textContent = tr(k); sel.append(o);
  }
  skinField.append(skinLab, sel);
  const emoField = el("label", "field"), emoLab = el("span", "", tr("lifeEmojiLabel")), emo = document.createElement("input");
  emoLab.dataset.i18n = "lifeEmojiLabel"; emo.id = "lifeEmojiInput"; emo.type = "text"; emo.maxLength = 8; emo.autocomplete = "off";
  emoField.append(emoLab, emo);
  num.closest("label").after(skinField, emoField);
  sel.addEventListener("change", () => { settings.lifeSkin = sel.value; saveUserPrefs(); syncLivesUI(); });
  emo.addEventListener("input", () => { settings.lifeEmoji = Array.from(emo.value).slice(0, 4).join("") || "💠"; saveUserPrefs(); });
  syncLivesUI();
})();

/* ============ 🏅 称号（曲ごと・モードごとに3段階） ============
   0＝なし、1＝クリア、2＝⚔ Sランク以上（精度95%以上）、3＝🐔 ノーミス
   記録（game.js のハイスコア・FC）から計算します。1.05x以上の速度別記録も含みます。
   CATCHでぶつかったプレイは game.js がFCにしないので、🐔になりません。 */
const TITLE_MODES = [["manual", "🥁"], ["truck", "🚚"], ["orbit", "🪐"], ["stage", "🎪"], ["catch", "🚛"]];
const TIER_MARK = ["", "", "⚔", "🐔"];
const TIER_TEXT = ["", "tier1", "tier2", "tier3"];
function slotTier(s) {
  if (!s) return 0;
  if (s.fc) return 3;
  if (s.best) return Number(s.best.acc) >= 95 ? 2 : 1;
  return 0;
}
const slotTierAll = s => s ? Math.max(slotTier(s), ...Object.values(s.rates || {}).map(slotTier)) : 0;
function songTitles(r) {
  const t = {}; for (const [m] of TITLE_MODES) t[m] = 0;
  if (!r || !r.charts) return t;
  for (const c of Object.values(r.charts)) {
    for (const [m] of TITLE_MODES) t[m] = Math.max(t[m], slotTierAll(m === "manual" ? c : c[m]));
  }
  return t;
}
function titleString(r) {   // 例：🥁🐔🚚⚔🪐🎪🐔🚛（library.js からも使います）
  const t = songTitles(r);
  return TITLE_MODES.map(([m, icon]) => t[m] ? icon + TIER_MARK[t[m]] : "").join("");
}
let titleSnap = null;
on("beforePlay", () => { titleSnap = songTitles(songRec(false)); });
on("screen", id => {
  if (id !== "endScreen") return;
  const pair = TITLE_MODES.find(([m]) => m === settings.playMode); if (!pair) return;
  const [mode, icon] = pair;
  if ((lifeState.max > 0 && lifeState.hp <= 0) || runUnranked()) return;   // FAILED・AUTO・練習扱いは対象外
  const noMiss = stats.miss === 0 && !(stats.crash > 0) && stats.perfect + stats.good > 0;
  const tier = noMiss ? 3 : currentAcc() >= 95 ? 2 : 1;
  const s = songRec(false);
  const now = songTitles(s)[mode], prev = titleSnap ? titleSnap[mode] : 0;
  const b = $("result").querySelector(".badges");
  if (b) {
    b.append(el("span", "badge", `${icon}${TIER_MARK[tier]} ${tr(TIER_TEXT[tier])}`));
    if (now > prev) b.append(el("span", "badge", tr("newTitle")));
  }
  const h = s && s.history && s.history[0];
  if (h && h.mode === mode) {
    h.title = icon + TIER_MARK[tier];
    h.mods = [...(Array.isArray(h.mods) ? h.mods : []), h.title];
    saveRecords(); renderRecords(); emit("records");
  }
});
function renderTitles() {
  if (!videoReady) return;
  const s = songRec(false); if (!s || !s.history || !s.history.length) return;
  const t = titleString(s);
  if (t) $("recSummary").append(el("div", "hint status", `${tr("titlesLabel")}: ${t}`));
}
on("chart", renderTitles);
on("language", renderTitles);
on("records", renderTitles);

/* ============ 🪐 ORBIT：見た目の設定（「見た目」の欄に追加） ============ */
(() => {
  const anchor = $("orbitSettingsAnchor") || $("swayReducedNote"); if (!anchor) return;
  const h3 = el("h3", "", tr("orbitViewTitle")); h3.dataset.i18n = "orbitViewTitle";
  anchor.after(
    h3,
    hintEl("orbitStyleLabel"),
    makeSeg("orbitStylePicker", "orbitStyle", [["free", "orbitStyleFree"], ["calm", "orbitStyleCalm"]]),
    hintEl("orbitSizeLabel"),
    makeSeg("orbitSizePicker", "orbitNoteSize", [["grow", "orbitSizeGrow"], ["fixed", "orbitSizeFixed"], ["judge", "orbitSizeJudge"]]),
    hintEl("orbitSizeHint"),
    makeCheck("orbitLaneColor", "orbitLaneColor", "orbitLaneColor"),
    hintEl("orbitCoreLabel"),
    makeSeg("orbitCorePicker", "orbitCore", [["planet", "orbitCorePlanet"], ["ring", "orbitCoreRing"], ["square", "orbitCoreSquare"],
      ["diamond", "orbitCoreDiamond"], ["target", "orbitCoreTarget"], ["bracket", "orbitCoreBracket"]]),
    hintEl("orbitCoreHint"),
    makeColorRow("orbitCoreColor", "orbitCoreColor", () => toHex(skin().ui["--ui-accent"])),
    hintEl("orbitMoonLabel"),
    makeSeg("orbitMoonPicker", "orbitMoon", [["song", "orbitMoonSong"], ["beat", "orbitMoonBeat"], ["off", "orbitMoonOff"]]),
    hintEl("orbitMoonShapeLabel"),
    makeSeg("orbitMoonShapePicker", "orbitMoonShape", [["orb", "orbitMoonOrb"], ["star", "orbitMoonStar"], ["comet", "orbitMoonComet"]]),
    makeColorRow("orbitMoonColor", "orbitMoonColor", () => toHex(skin().game.perfect)),
    makeCheck("swayOrbit", "swayOrbit", "swayOrbit"),
    hintEl("orbitViewHint")
  );
})();

/* ============ 🪐 ORBIT：道 ============ */
const ORBIT_CX = 960, ORBIT_CY = 540;      // 判定点＝画面の真ん中（render.js の揺れの中心にも使用）
const ORBIT_STEP = 16;                     // 道を作る時間の刻み（ms）
const orbitPath = { src:null, len:0, bpm:-1, scroll:-1, style:"", t0:0, n:0, xs:null, ys:null, vpm:.6 };
const orbit = { cx:0, cy:0, ax:ORBIT_CX, ay:ORBIT_CY };
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/* 時間 t の位置＝道を一定の速さで進んだ場所。小節ごとに「まっすぐ／カーブ／方向転換／ジグザグ」。
   見えている範囲の曲がりの合計を180°未満に抑えるので、見えている道は交差しません。 */
function buildOrbitPath() {
  const beat = 60000 / (chartMeta.bpm || 120), bar = beat * 4;
  const last = chart.length ? chart[chart.length - 1].time : 0;
  const t0 = -6000, t1 = Math.max(last, (video.duration || 0) * 1000) + 4000;
  const n = Math.max(2, Math.ceil((t1 - t0) / ORBIT_STEP) + 1);
  const xs = new Float32Array(n), ys = new Float32Array(n);
  const calm = settings.orbitStyle === "calm";
  const S = calm ? { kMax:.0011, budget:.55 * Math.PI, speed:.75 } : { kMax:.0032, budget:.92 * Math.PI, speed:.6 };
  const AIMS = calm ? [0, -.35, .35, -.7, .7, 0]
    : [-Math.PI / 2, Math.PI / 2, 0, Math.PI, -Math.PI / 4, Math.PI / 4, -3 * Math.PI / 4, 3 * Math.PI / 4];
  const rand = mulberry32(hashString(`orbit|${settings.orbitStyle}|${chart.length}|${chart.length ? chart[0].time : 0}|${last}|${$("seed").value}`));
  const vpm = S.speed * settings.scroll, v = vpm * ORBIT_STEP;
  const win = Math.max(8, Math.ceil((travelMs() * 1.15 + 800) / ORBIT_STEP));
  const ring = new Float32Array(win); let ri = 0, used = 0;
  let x = 0, y = 0, h = 0, k = 0, kt = 0, mode = "straight", aim = 0, zig = 1, nextZig = 0, nextTurn = t0 + bar * 2;
  for (let i = 0; i < n; i++) {
    const t = t0 + i * ORBIT_STEP;
    if (t >= nextTurn) {
      nextTurn += bar * (rand() < .5 ? 1 : rand() < .6 ? 2 : .5);
      const r = rand();
      if (calm) { mode = "aim"; aim = AIMS[Math.floor(rand() * AIMS.length)]; }
      else if (r < .18) mode = "straight";
      else if (r < .45) { mode = "arc"; kt = (rand() < .5 ? -1 : 1) * S.kMax * (.45 + rand() * .55); }
      else if (r < .85) { mode = "aim"; aim = AIMS[Math.floor(rand() * AIMS.length)]; }
      else { mode = "zig"; zig = rand() < .5 ? -1 : 1; nextZig = t; }
    }
    if (mode === "straight") kt = 0;
    else if (mode === "aim") kt = Math.max(-S.kMax, Math.min(S.kMax, angDiff(aim, h) * .004));
    else if (mode === "zig") { if (t >= nextZig) { zig = -zig; nextZig = t + beat; } kt = zig * S.kMax * .8; }
    k += (kt - k) * .12;
    let d = k * ORBIT_STEP;
    used -= ring[ri];
    if (used + Math.abs(d) > S.budget) { d = 0; k *= .5; }
    ring[ri] = Math.abs(d); used += ring[ri]; ri = (ri + 1) % win;
    h += d; xs[i] = x; ys[i] = y;
    x += v * Math.cos(h); y += v * Math.sin(h);
  }
  Object.assign(orbitPath, { src:chart, len:chart.length, bpm:chartMeta.bpm, scroll:settings.scroll, style:settings.orbitStyle, t0, n, xs, ys, vpm });
}
function ensureOrbit() {
  const P = orbitPath;
  if (P.src !== chart || P.len !== chart.length || P.bpm !== chartMeta.bpm || P.scroll !== settings.scroll || P.style !== settings.orbitStyle) buildOrbitPath();
}
function orbitPos(t) {
  const P = orbitPath;
  let f = (t - P.t0) / ORBIT_STEP; f = Math.max(0, Math.min(P.n - 1, f));
  const i = Math.floor(f), k = f - i, j = Math.min(P.n - 1, i + 1);
  return [P.xs[i] + (P.xs[j] - P.xs[i]) * k, P.ys[i] + (P.ys[j] - P.ys[i]) * k];
}
function orbitDir(t) { const a = orbitPos(t - ORBIT_STEP), b = orbitPos(t + ORBIT_STEP); return Math.atan2(b[1] - a[1], b[0] - a[0]); }
function resetOrbit() { ensureOrbit(); }
function updateOrbitCam(now) { const [px, py] = orbitPos(now); orbit.cx = px; orbit.cy = py; }
const orbitToScreen = (x, y) => [ORBIT_CX + x - orbit.cx, ORBIT_CY + y - orbit.cy];
function orbitHitPos() { return { x:orbit.ax, y:orbit.ay }; }   // game.js から使います

/* ============ 🪐 ORBIT：描画 ============ */
function drawOrb(x, y, c, r) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
  gr.addColorStop(0, hexToRgba(toHex(c), .55)); gr.addColorStop(1, hexToRgba(toHex(c), 0));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
}
function starPath(x, y, r) {   // stagefx.js（紙吹雪）も使います
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r;
    i ? ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad) : ctx.moveTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}
function strokeOrbitRange(ta, tb, width, color, alpha) {
  if (tb <= ta) return;
  ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.strokeStyle = color; ctx.beginPath();
  for (let t = ta, first = true; ; t += ORBIT_STEP * 2) {
    const tt = Math.min(t, tb), [sx, sy] = orbitToScreen(...orbitPos(tt));
    if (first) { ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
    if (tt >= tb) break;
  }
  ctx.stroke(); ctx.globalAlpha = 1;
}
function drawOrbitNote(n, isNext, c, g) {
  const [sx, sy] = orbitToScreen(...orbitPos(n.time)), mode = settings.orbitNoteSize;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(orbitDir(n.time));
  if (mode === "judge") {
    const w = windows(), vpm = orbitPath.vpm, hw = 20;
    const lp = Math.max(6, w.perfect * vpm), lg = Math.max(lp + 4, w.good * vpm);
    rr(-lg, -hw - 4, lg * 2, hw * 2 + 8, 10);
    ctx.fillStyle = hexToRgba(toHex(c), .16); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = hexToRgba(toHex(c), .55); ctx.stroke();
    if (isNext) { ctx.shadowColor = c; ctx.shadowBlur = 22; }
    rr(-lp, -hw, lp * 2, hw * 2, Math.min(9, lp)); ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = isNext ? 4 : 3; ctx.strokeStyle = g.noteBorder; ctx.stroke();
    ctx.fillStyle = g.noteBorder; ctx.fillRect(-1.5, -hw, 3, hw * 2);
  } else {
    const s = mode === "grow" && isNext ? 27 : 21;
    if (isNext) { ctx.shadowColor = c; ctx.shadowBlur = 26; }
    rr(-s, -s, s * 2, s * 2, 9); ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = isNext ? 5 : 3; ctx.strokeStyle = g.noteBorder; ctx.stroke();
  }
  ctx.restore();
}
function drawOrbitCore(ax, ay, now, g) {
  const c = orbitCoreColor(), type = settings.orbitCore, pulse = beatPulse(now);
  const age = performance.now() - pressH.t, flash = age < 120 ? Math.min(1, .5 * gameplayFxPower()) * (1 - age / 120) : 0;
  if (type === "planet") {
    if (flash) { ctx.globalAlpha = flash; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ax, ay, 44, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.globalAlpha = .9; ctx.lineWidth = 5; ctx.strokeStyle = g.ink;
    ctx.beginPath(); ctx.arc(ax, ay, 36 + pulse * 5, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    drawOrb(ax, ay, c, 16);
    return;
  }
  const s = 31 + pulse * 3, round = type === "ring" || type === "target";
  ctx.save(); ctx.translate(ax, ay);
  if (!round) ctx.rotate(orbitDir(now) + (type === "diamond" ? Math.PI / 4 : 0));
  const shape = () => { if (round) { ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); } else rr(-s, -s, s * 2, s * 2, 8); };
  if (flash) { shape(); ctx.globalAlpha = flash; ctx.fillStyle = c; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  if (type === "bracket") {
    const L = s * .55; ctx.beginPath();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      ctx.moveTo(sx * s, sy * (s - L)); ctx.lineTo(sx * s, sy * s); ctx.lineTo(sx * (s - L), sy * s);
    }
  } else shape();
  ctx.lineWidth = 10; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = c; ctx.stroke();
  if (type === "target") {
    ctx.globalAlpha = .85; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, s * .45, 0, TAU); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      ctx.moveTo(Math.cos(a) * (s + 4), Math.sin(a) * (s + 4)); ctx.lineTo(Math.cos(a) * (s + 15), Math.sin(a) * (s + 15));
    }
    ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawOrbitMoon(ax, ay, now) {
  const mode = settings.orbitMoon; if (mode === "off") return;
  const c = orbitMoonColor(), R = 64;
  let ang;
  if (mode === "song") {
    const dur = (video.duration || 0) * 1000, k = dur ? Math.max(0, Math.min(1, now / dur)) : 0;
    ang = -Math.PI / 2 + k * TAU;
    ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = c;
    ctx.globalAlpha = .18; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ax, ay, R, 0, TAU); ctx.stroke();
    if (k > 0) { ctx.globalAlpha = .65; ctx.beginPath(); ctx.arc(ax, ay, R, -Math.PI / 2, ang); ctx.stroke(); }
    ctx.restore();
  } else {
    const beat = 60000 / (chartMeta.bpm || 120);
    ang = (now - (chartMeta.offset || 0)) / beat * TAU - Math.PI / 2;
  }
  const x = ax + Math.cos(ang) * R, y = ay + Math.sin(ang) * R;
  ctx.save();
  if (settings.orbitMoonShape === "comet") {
    const step = mode === "song" ? .05 : .12;
    for (let i = 6; i >= 1; i--) {
      const a = ang - i * step;
      ctx.globalAlpha = .45 * (1 - i / 7); ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(ax + Math.cos(a) * R, ay + Math.sin(a) * R, 8 - i, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; drawOrb(x, y, c, 8);
  } else if (settings.orbitMoonShape === "star") {
    ctx.shadowColor = c; ctx.shadowBlur = 16;
    starPath(x, y, 13); ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
  } else drawOrb(x, y, c, 8);
  ctx.restore();
}
function drawOrbitField(now) {   // render.js から呼ばれます
  ensureOrbit(); updateOrbitCam(now);
  const g = skin().game, travel = travelMs(), tEnd = now + travel * 1.1, accent = toHex(skin().ui["--ui-accent"]);
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  strokeOrbitRange(now - 700, now, 46, g.lane, .45);
  strokeOrbitRange(now, tEnd, 46, g.lane, 1);
  strokeOrbitRange(now - 700, now, 4, g.track, .4);
  strokeOrbitRange(now, tEnd, 4, g.track, 1);
  const beat = 60000 / (chartMeta.bpm || 120), off = chartMeta.offset || 0;
  ctx.strokeStyle = g.track;
  for (let k = Math.ceil((now - off) / beat); ; k++) {
    const t = off + k * beat; if (t > tEnd) break;
    const barLine = ((k % 4) + 4) % 4 === 0, [sx, sy] = orbitToScreen(...orbitPos(t)), d = orbitDir(t) + Math.PI / 2, L = barLine ? 28 : 15;
    ctx.globalAlpha = noteAlpha(Math.max(0, t - now)) * (barLine ? .9 : .55); ctx.lineWidth = barLine ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(sx - Math.cos(d) * L, sy - Math.sin(d) * L); ctx.lineTo(sx + Math.cos(d) * L, sy + Math.sin(d) * L); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const ax = orbit.ax, ay = orbit.ay, frame = settings.orbitCore !== "planet";
  if (frame) drawOrbitCore(ax, ay, now, g);
  let end = nextIdx;
  while (end < chart.length && chart[end].time - now <= travel * 1.05) end++;
  for (let i = end - 1; i >= nextIdx; i--) {
    const n = chart[i]; if (n.judged) continue;
    const a = noteAlpha(n.time - now); if (a <= 0) continue;
    ctx.globalAlpha = a;
    drawOrbitNote(n, i === nextIdx, settings.orbitLaneColor ? laneColor(n.lane) : accent, g);
  }
  ctx.globalAlpha = 1;
  if (!frame) drawOrbitCore(ax, ay, now, g);
  drawOrbitMoon(ax, ay, now);
  if (nextIdx === 0 && !settings.hideGameplayUI && !settings.autoPlay) {
    ctx.font = `800 26px ${fontFamily()}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.strokeText(tr("orbitAnyKey"), ax, H - 150);
    ctx.fillStyle = "#fff"; ctx.fillText(tr("orbitAnyKey"), ax, H - 150);
  }
  ctx.restore();
}

/* ============ 🪐 ORBIT：入力（どのキーでも1ボタン。main.js より先に受け取る） ============
   速度キー（speed.js）・スキップ・区間リピート（player.js）は先に受け取られるので、ここには来ません */
const ORBIT_IGNORE = new Set(["KeyP", "Escape", "Backquote", "Minus", "Equal", "Tab", "MetaLeft", "MetaRight",
  "AltLeft", "AltRight", "ControlLeft", "ControlRight", "ContextMenu", "PrintScreen"]);
addEventListener("keydown", e => {
  if (window._trkSynthModeOpen || window._trkMediaPlayerOpen || window._trkStudyRoomOpen) return;
  if (phase !== "playing" || !isOrbit() || bindingSlot !== null || settings.autoPlay) return;
  if (ORBIT_IGNORE.has(e.code) || /^F\d{1,2}$/.test(e.code) || e.ctrlKey || e.metaKey) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!e.repeat) handleInput(0, e.timeStamp);
}, true);
stage.addEventListener("pointerdown", e => {
  if (phase !== "playing" || !isOrbit() || settings.autoPlay) return;
  if (e.target.closest("#controls, #seekBar, #touchKeys")) return;
  e.preventDefault(); handleInput(0, e.timeStamp);
});
on("chart", () => { orbitPath.src = null; });
/* ✅ modes.js 完了 */
