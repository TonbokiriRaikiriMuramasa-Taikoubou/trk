// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! stagefx.js — 🎭 ステージ演出・判定表示の細かい設定・カーテンコール
   ・STAGEの舞台演出（スポットライト・床の反射・舞い上がる光）
   ・判定文字の大きさと位置、FAST/SLOWの表示範囲、AP・FC継続表示（全モード共通）
   ・Seed 20230726／20260929／curtaincall で「カーテンコール」（幕と緞帳・星の紙吹雪）
     ※譜面はいつもどおり自動生成です。特定のゲームの譜面・名前・画像は使っていません。
   読み込み順：stage.js の後。描画は render.js から呼ばれます。
   ========================================================================== */
"use strict";
(() => {

/* ============ 文章 ============ */
Object.assign(TEXT.ja, {
  fxTitle:"🎭 ステージ演出と判定表示",
  stageFxLabel:"STAGEの演出", stageFxOff:"オフ", stageFxSoft:"控えめ", stageFxStd:"標準", stageFxRich:"華やか",
  stageLightLabel:"スポットライトの色", lightSkin:"スキンの色", lightRainbow:"虹色", lightCustom:"カスタム", lightColor:"ライトの色",
  stageFxHint:"スポットライト・床の反射・舞い上がる光でSTAGEを彩ります。盛り上がる場面では明るくなります。OSの「視差効果を減らす」がオンのときは動きを止めます。",
  judgeSizeLabel:"判定文字の大きさ", sizeS:"小", sizeM:"中", sizeL:"大", judgePos:"判定文字の位置",
  fastSlowLabel:"FAST/SLOWの表示", fsGood:"GOODのみ", fsAll:"PERFECT✦以外すべて", fsOff:"表示しない",
  apfcLabel:"AP・FCが続いている間、表示する",
  eggCurtain:"✦ CURTAIN CALL：特別な幕が上がります。たくさんの舞台に、ありがとう。",
  curtainCall:"CURTAIN CALL", curtainThanks:"たくさんの拍手を、ありがとう。"
});
Object.assign(TEXT.en, {
  fxTitle:"🎭 Stage effects & judgement display",
  stageFxLabel:"STAGE effects", stageFxOff:"Off", stageFxSoft:"Soft", stageFxStd:"Standard", stageFxRich:"Dazzling",
  stageLightLabel:"Spotlight color", lightSkin:"Skin colors", lightRainbow:"Rainbow", lightCustom:"Custom", lightColor:"Light color",
  stageFxHint:"Spotlights, floor glow and rising lights decorate STAGE, brighter in loud sections. Motion stops when your system's “reduce motion” setting is on.",
  judgeSizeLabel:"Judgement text size", sizeS:"Small", sizeM:"Medium", sizeL:"Large", judgePos:"Judgement text position",
  fastSlowLabel:"FAST/SLOW display", fsGood:"GOOD only", fsAll:"Everything except PERFECT✦", fsOff:"Hidden",
  apfcLabel:"Show AP / FC while you keep it",
  eggCurtain:"✦ CURTAIN CALL: a special curtain rises. Thank you for all the stages.",
  curtainCall:"CURTAIN CALL", curtainThanks:"Thank you for all the applause."
});
Object.assign(TEXT.zh, {
  fxTitle:"🎭 舞台演出与判定显示",
  stageFxLabel:"STAGE 演出", stageFxOff:"关闭", stageFxSoft:"柔和", stageFxStd:"标准", stageFxRich:"华丽",
  stageLightLabel:"聚光灯颜色", lightSkin:"皮肤颜色", lightRainbow:"彩虹", lightCustom:"自定义", lightColor:"灯光颜色",
  stageFxHint:"用聚光灯、地面反光和上升的光点装点STAGE，高潮段落会更亮。系统开启“减弱动态效果”时停止动态。",
  judgeSizeLabel:"判定文字大小", sizeS:"小", sizeM:"中", sizeL:"大", judgePos:"判定文字位置",
  fastSlowLabel:"FAST/SLOW 显示", fsGood:"仅GOOD", fsAll:"PERFECT✦以外全部", fsOff:"不显示",
  apfcLabel:"保持AP・FC期间显示",
  eggCurtain:"✦ CURTAIN CALL：特别的幕布升起。感谢所有的舞台。",
  curtainCall:"CURTAIN CALL", curtainThanks:"感谢大家的掌声。"
});
Object.assign(TEXT.ko, {
  fxTitle:"🎭 무대 연출과 판정 표시",
  stageFxLabel:"STAGE 연출", stageFxOff:"끄기", stageFxSoft:"은은하게", stageFxStd:"표준", stageFxRich:"화려하게",
  stageLightLabel:"스포트라이트 색", lightSkin:"스킨 색", lightRainbow:"무지개", lightCustom:"사용자 지정", lightColor:"조명 색",
  stageFxHint:"스포트라이트・바닥 반사・떠오르는 빛으로 STAGE를 꾸밉니다. 신나는 구간에서는 더 밝아집니다. 시스템의 '동작 줄이기'가 켜져 있으면 움직임을 멈춥니다.",
  judgeSizeLabel:"판정 문자 크기", sizeS:"작게", sizeM:"보통", sizeL:"크게", judgePos:"판정 문자 위치",
  fastSlowLabel:"FAST/SLOW 표시", fsGood:"GOOD만", fsAll:"PERFECT✦ 외 전부", fsOff:"표시 안 함",
  apfcLabel:"AP・FC가 이어지는 동안 표시",
  eggCurtain:"✦ CURTAIN CALL: 특별한 막이 오릅니다. 모든 무대에 감사합니다.",
  curtainCall:"CURTAIN CALL", curtainThanks:"많은 박수, 감사합니다."
});

/* ============ 設定 ============ */
const hexOk = v => typeof v === "string" && window.Trk.data.HEX.test(v) ? v.toLowerCase() : "";
window.Trk.core.settings.stageFx = window.Trk.core.pick(window.Trk.core.prefs.stageFx, ["off", "soft", "std", "rich"], "std");
window.Trk.core.settings.stageLight = window.Trk.core.pick(window.Trk.core.prefs.stageLight, ["skin", "rainbow", "custom"], "skin");
window.Trk.core.settings.stageLightColor = hexOk(window.Trk.core.prefs.stageLightColor);
window.Trk.core.settings.judgeSize = window.Trk.core.pick(window.Trk.core.prefs.judgeSize, ["s", "m", "l"], "m");
window.Trk.core.settings.judgePos = window.Trk.core.num(window.Trk.core.prefs.judgePos, -300, 300, 0);
window.Trk.core.settings.fastSlow = window.Trk.core.pick(window.Trk.core.prefs.fastSlow, ["good", "all", "off"], "good");
window.Trk.core.settings.apfcShow = window.Trk.core.prefs.apfcShow !== false;

const FX_LEVEL = { off:0, soft:.55, std:1, rich:1.6 };
const still = () => reduceMotion.matches;
function lightColor(i, t) {
  if (window.Trk.core.settings.stageLight === "rainbow") return `hsl(${Math.round((t / 25 + i * 72) % 360)},90%,65%)`;
  if (window.Trk.core.settings.stageLight === "custom") return window.Trk.core.settings.stageLightColor || "#ffd166";
  return window.Trk.data.toHex(i % 2 ? window.Trk.core.skin().game.perfect : window.Trk.core.skin().ui["--ui-accent"]);
}

/* ============ STAGEの舞台演出（render.js がレーンの下に描きます） ============ */
function drawStageBackdrop(now) {
  const k0 = FX_LEVEL[window.Trk.core.settings.stageFx] || 0; if (!k0) return;
  const p = performance.now(), t = still() ? 0 : p, pulse = window.Trk.play.beatPulse(now);
  const hype = window.Trk.core.settings.stageHype && stageMap.len && stageMap.hype[Math.min(window.Trk.core.nextIdx, stageMap.len - 1)];
  const k = k0 * (hype ? 1.35 : 1);
  const n = window.Trk.core.settings.stageFx === "rich" ? 5 : window.Trk.core.settings.stageFx === "std" ? 3 : 2;
  window.Trk.core.ctx.save();
  window.Trk.core.ctx.globalCompositeOperation = "lighter";

  /* スポットライト（上から床へ、ゆっくり首を振る） */
  for (let i = 0; i < n; i++) {
    const sx = 210 + i * 1500 / (n - 1), c = lightColor(i, t);
    const a = (sx < 900 ? .22 : sx > 1020 ? -.22 : 0) + (still() ? 0 : Math.sin(t / 1700 + i * 1.3) * .28);
    const bx = sx + Math.tan(a) * 1020, by = 1000, bw = 150;
    const gr = window.Trk.core.ctx.createLinearGradient(sx, -20, bx, by);
    gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)");
    window.Trk.core.ctx.globalAlpha = Math.min(.5, .14 * k * (.8 + .4 * pulse));
    window.Trk.core.ctx.fillStyle = gr; window.Trk.core.ctx.beginPath();
    window.Trk.core.ctx.moveTo(sx - 9, -20); window.Trk.core.ctx.lineTo(sx + 9, -20); window.Trk.core.ctx.lineTo(bx + bw, by); window.Trk.core.ctx.lineTo(bx - bw, by); window.Trk.core.ctx.closePath(); window.Trk.core.ctx.fill();
    window.Trk.core.ctx.save(); window.Trk.core.ctx.translate(bx, by); window.Trk.core.ctx.scale(1, .2);                       // 床に落ちた光
    const fl = window.Trk.core.ctx.createRadialGradient(0, 0, 0, 0, 0, 170);
    fl.addColorStop(0, c); fl.addColorStop(1, "rgba(0,0,0,0)");
    window.Trk.core.ctx.globalAlpha = Math.min(.6, .22 * k); window.Trk.core.ctx.fillStyle = fl;
    window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(0, 0, 170, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill(); window.Trk.core.ctx.restore();
  }

  /* レーンの下の床の反射 */
  window.Trk.core.ctx.save(); window.Trk.core.ctx.translate(960, STAGE.hitY + 70); window.Trk.core.ctx.scale(1, .16);
  const rf = window.Trk.core.ctx.createRadialGradient(0, 0, 0, 0, 0, 640);
  rf.addColorStop(0, lightColor(0, t)); rf.addColorStop(1, "rgba(0,0,0,0)");
  window.Trk.core.ctx.globalAlpha = Math.min(.5, .2 * k * (.85 + .3 * pulse)); window.Trk.core.ctx.fillStyle = rf;
  window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(0, 0, 640, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill(); window.Trk.core.ctx.restore();

  /* 舞い上がる光 */
  const count = { soft:12, std:24, rich:44 }[window.Trk.core.settings.stageFx] || 0;
  for (let i = 0; i < count; i++) {
    const sp = .04 * (1 + (i % 4) * .35);
    const x = (i * 397.3) % window.Trk.data.W + (still() ? 0 : Math.sin(t / 900 + i) * 20);
    const y = 1100 - ((t * sp + i * 173) % 1200);
    window.Trk.core.ctx.globalAlpha = Math.min(.8, .45 * k) * (1 - Math.abs(y - 540) / 700);
    window.Trk.core.ctx.fillStyle = lightColor(i, t);
    window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(x, y, 1.5 + (i % 3), 0, window.Trk.data.TAU); window.Trk.core.ctx.fill();
  }
  window.Trk.core.ctx.restore();
}

/* ============ AP・FC継続表示（全モード。AUTOでは出さない） ============ */
function drawApFc() {
  if (!window.Trk.core.settings.apfcShow || window.Trk.core.phase !== "playing" || window.Trk.core.settings.autoPlay) return;
  if (window.Trk.core.stats.perfect + window.Trk.core.stats.good === 0 || window.Trk.core.stats.miss > 0 || window.Trk.core.stats.crash > 0) return;
  const ap = window.Trk.core.stats.good === 0, txt = ap ? "AP" : "FC";
  const c = window.Trk.data.toHex(ap ? window.Trk.core.skin().game.perfect : window.Trk.core.skin().ui["--ui-accent"]);
  const x0 = window.Trk.core.settings.layout === "vertical" && !window.Trk.play.ownField() ? 760 : 70, y = 190;
  window.Trk.core.ctx.save();
  window.Trk.core.ctx.font = `900 18px ${window.Trk.core.fontFamily()}`; window.Trk.core.ctx.textAlign = "center"; window.Trk.core.ctx.textBaseline = "middle";
  window.Trk.play.rr(x0, y - 13, 48, 26, 13); window.Trk.core.ctx.fillStyle = "rgba(0,0,0,.5)"; window.Trk.core.ctx.fill();
  window.Trk.core.ctx.lineWidth = 2; window.Trk.core.ctx.strokeStyle = c; window.Trk.core.ctx.stroke();
  window.Trk.core.ctx.fillStyle = c; window.Trk.core.ctx.fillText(txt, x0 + 24, y + 1);
  window.Trk.core.ctx.restore();
}

/* ============ カーテンコール（Seedのイースターエッグ） ============ */
const CURTAIN_SEEDS = ["20230726", "20260929", "curtaincall"];
for (const s of CURTAIN_SEEDS) window.Trk.data.EGG_KEYS[s] = "eggCurtain";
const isCurtain = () => CURTAIN_SEEDS.includes((window.Trk.core.$("seed").value || "").trim().toLowerCase());
let curtainAt = -1e9, endAt = -1e9;
window.Trk.core.on("beforePlay", () => { curtainAt = performance.now(); });
window.Trk.core.on("screen", id => {
  if (id !== "endScreen" || !isCurtain()) return;
  endAt = performance.now();
  window.Trk.core.$("credits").prepend(window.Trk.core.el("div", "best new", `✦ ${tr("curtainCall")} ✦ ${tr("curtainThanks")}`));
});
function drawCurtain() {
  if (!isCurtain() || window.Trk.core.phase === "title") return;
  const p = performance.now(), open = still() ? 1 : Math.min(1, Math.max(0, (p - curtainAt - 300) / 1800));
  const ease = 1 - Math.pow(1 - open, 3), w = 960 * (1 - ease) + 80;
  window.Trk.core.ctx.save();
  for (const side of [-1, 1]) {           // 左右の幕（ひだ付き）
    const x0 = side < 0 ? 0 : window.Trk.data.W - w;
    window.Trk.core.ctx.fillStyle = "#8e1028"; window.Trk.core.ctx.fillRect(x0, 0, w, window.Trk.data.H);
    for (let x = 0; x < w; x += 46) {
      const gr = window.Trk.core.ctx.createLinearGradient(x0 + x, 0, x0 + x + 46, 0);
      gr.addColorStop(0, "rgba(0,0,0,.35)"); gr.addColorStop(.5, "rgba(255,255,255,.08)"); gr.addColorStop(1, "rgba(0,0,0,.35)");
      window.Trk.core.ctx.fillStyle = gr; window.Trk.core.ctx.fillRect(x0 + x, 0, 46, window.Trk.data.H);
    }
  }
  window.Trk.core.ctx.fillStyle = "#5c0a1c"; window.Trk.core.ctx.fillRect(0, 0, window.Trk.data.W, 64);    // 緞帳の上部
  window.Trk.core.ctx.fillStyle = "#8e1028";
  for (let x = 0; x < window.Trk.data.W; x += 120) { window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(x + 60, 64, 60, 0, Math.PI); window.Trk.core.ctx.fill(); }
  window.Trk.core.ctx.fillStyle = "#e0b04a"; window.Trk.core.ctx.fillRect(0, 62, window.Trk.data.W, 4);
  window.Trk.core.ctx.restore();
}
function drawConfetti() {
  if (!isCurtain()) return;
  const age = performance.now() - endAt; if (age < 0 || age > 6000) return;
  window.Trk.core.ctx.save();
  for (let i = 0; i < 60; i++) {
    const x = (i * 331) % window.Trk.data.W + Math.sin(age / 500 + i) * 30;
    const y = ((age * .25 * (1 + (i % 3) * .3) + i * 53) % 1200) - 100;
    window.Trk.core.ctx.globalAlpha = Math.min(1, (6000 - age) / 1500);
    starPath(x, y, 6 + (i % 4) * 2); window.Trk.core.ctx.fillStyle = i % 3 ? "#ffd166" : lightColor(i, age); window.Trk.core.ctx.fill();
  }
  window.Trk.core.ctx.restore();
}
function drawFxOverlay() { drawApFc(); drawCurtain(); drawConfetti(); }

/* ============ 判定文字の表示 ============ */
function applyJudgeStyle() {
  const j = window.Trk.core.$("judge"); if (!j) return;
  j.style.fontSize = { s:"44px", m:"64px", l:"86px" }[window.Trk.core.settings.judgeSize];
  j.style.top = window.Trk.play.ownField() && window.Trk.core.phase !== "title" ? (isOrbit() ? "260px" : "560px") : "";
  j.style.marginTop = window.Trk.core.settings.judgePos + "px";
}
window.Trk.core.on("phase", applyJudgeStyle);
/* FAST/SLOW の表示範囲（game.js の showJudge のあとに上書き） */
const baseShowJudge = window.Trk.play.showJudge;
window.Trk.play.showJudge = function (kind, delta, star) {
  baseShowJudge(kind, delta, star);
  const sub = window.Trk.core.$("judgeSub");
  if (window.Trk.core.settings.fastSlow === "off") {
    sub.textContent = "";
    sub.className = "";
  } else if (window.Trk.core.settings.fastSlow === "all" && kind === "perfect" && !star && delta) {
    const isEarly = delta < 0;
    sub.textContent = tr(isEarly ? "early" : "late");
    sub.className = isEarly ? "early" : "late";
  }
};

/* ============ 設定画面（STAGEの設定の下、マスコットの上） ============ */
(() => {
  const anchor = window.Trk.core.$("stageSettingsAnchor") || document.querySelector('#settingsScreen [data-i18n="mascotSel"]'); if (!anchor) return;
  const h3 = window.Trk.core.el("h3", "", tr("fxTitle")); h3.dataset.i18n = "fxTitle";
  const size = makeSeg("judgeSizePicker", "judgeSize", [["s", "sizeS"], ["m", "sizeM"], ["l", "sizeL"]]);
  size.addEventListener("click", applyJudgeStyle);
  const row = window.Trk.core.el("div", "inline"), lab = window.Trk.core.el("span", "", tr("judgePos")), inp = document.createElement("input"), val = window.Trk.core.el("span", "mono");
  lab.dataset.i18n = "judgePos"; inp.type = "range"; inp.min = "-300"; inp.max = "300"; inp.step = "10";
  lab.id = "judgePosLab"; inp.setAttribute("aria-labelledby", lab.id);
  const sync = () => { inp.value = window.Trk.core.settings.judgePos; val.textContent = (window.Trk.core.settings.judgePos > 0 ? "+" : "") + window.Trk.core.settings.judgePos + "px"; };
  inp.addEventListener("input", () => { window.Trk.core.settings.judgePos = Number(inp.value); window.Trk.core.saveUserPrefs(); sync(); applyJudgeStyle(); });
  sync(); row.append(lab, inp, val);
  anchor.before(
    h3,
    hintEl("stageFxLabel"),
    makeSeg("stageFxPicker", "stageFx", [["off", "stageFxOff"], ["soft", "stageFxSoft"], ["std", "stageFxStd"], ["rich", "stageFxRich"]]),
    hintEl("stageLightLabel"),
    makeSeg("stageLightPicker", "stageLight", [["skin", "lightSkin"], ["rainbow", "lightRainbow"], ["custom", "lightCustom"]]),
    makeColorRow("stageLightColor", "lightColor", () => "#ffd166"),
    hintEl("stageFxHint"),
    hintEl("judgeSizeLabel"), size, row,
    hintEl("fastSlowLabel"),
    makeSeg("fastSlowPicker", "fastSlow", [["good", "fsGood"], ["all", "fsAll"], ["off", "fsOff"]]),
    makeCheck("apfcShow", "apfcShow", "apfcLabel")
  );
})();

/* render.js から使う関数を公開 */
window.drawStageBackdrop = drawStageBackdrop;
window.drawFxOverlay = drawFxOverlay;
applyJudgeStyle();
})();
/* ✅ stagefx.js 完了 */
