(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：描画・マスコット ============
   対応：MANUAL／TRUCK／ORBIT／STAGE／CATCH・体力・揺れ・キャラ登録・カウントダウン・HIDDEN/SUDDEN
         ステージ演出（stagefx.js）・ゴースト（extras.js）
   キャラクターのマスコットは registerMascot()（data.js）で登録されたものを描きます。
   初音ミクの絵は js/characters/miku.js にあり、このファイルには含まれていません。 */
"use strict";

const layout = () => LAYOUTS[settings.layout] || LAYOUTS.classic;
const vrmState = { loaded:false, credit:"" };      // vrm.js から更新されます
let toast = null;                                  // 画面上部の短い通知
let retryHoldAt = 0;                               // ` 長押し中の開始時刻（main.js が設定）
function showToast(text) { toast = { text, t:performance.now() }; }
/* キー案内：トラックモードはトラック用のキー、それ以外は叩くキー */
const hintKeys = slot => isTruck() ? truckKeysLabel(slot) : keysLabel(slot);
const isCatchMode = () => typeof isCatch === "function" && isCatch();
/* 画面の中央を使うモード（レイアウトの設定を使わない） */
const ownField = () => isOrbit() || isStage() || isCatchMode();

/* ---------- 図形の基本 ---------- */
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function shapePath(x, y, r, shape) {
  if (shape === "diamond") {
    const s = r * 1.18; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath();
  } else if (shape === "square") { const s = r * .92; rr(x - s, y - s, s * 2, s * 2, r * .22); }
  else { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
}
function drawLabel(text, x, y, size, color = "#fff") {
  ctx.font = `900 ${size}px ${fontFamily()}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * .24); ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function beatPulse(now) {
  if (!chartMeta.bpm) return 0;
  const b = 60000 / chartMeta.bpm, ph = ((((now - chartMeta.offset) % b) + b) % b) / b;
  return Math.max(0, 1 - ph * 3);
}
/* トラックモードの横スクロールでは、ドン＝上段・カッ＝下段 */
function notePos(L, lane, u) {
  const f = u / travelMs();
  if (L.vertical) return { x:L.centers[laneCol(lane)], y:L.hitY - f * (L.hitY - L.topY) };
  return { x:L.hitX + f * (L.endX - L.hitX), y:isTruck() ? truckRowY(L, lane) : L.laneY };
}
function hitPos(L, lane) {
  if (L.vertical) return { x:L.centers[laneCol(lane)], y:L.hitY };
  return { x:L.hitX, y:isTruck() ? truckRowY(L, lane) : L.laneY };
}
/* HIDDEN／SUDDEN：ノーツの見え方（0＝見えない、1＝そのまま）。f は判定位置で0、出現位置で1 */
function noteAlpha(u) {
  if (!settings.hidden && !settings.sudden) return 1;
  const f = u / travelMs(), both = settings.hidden && settings.sudden;
  const c = both ? Math.min(settings.cover, .45) : settings.cover;
  let a = 1;
  if (settings.hidden) a *= Math.max(0, Math.min(1, (f - c * .35) / (c * .65)));
  if (settings.sudden) a *= Math.max(0, Math.min(1, (1 - c - f) / .1));
  return a;
}

/* ---------- 背景（映像。音声だけの曲は曲パックの背景画像。暗さ・ぼかしは core.js の videoFilter） ---------- */
function drawVideo() {
  vctx.clearRect(0, 0, W, H);
  if (!videoReady || settings.videoStyle === "off") return;
  const a = ownField() ? { x:0, y:0, w:W, h:H } : layout().video;
  const zoom = Math.max(.5, Math.min(3, Number(settings.videoZoom) || 1));
  if (video.videoWidth && video.readyState >= 2) {
    const s = Math.min(a.w / video.videoWidth, a.h / video.videoHeight) * zoom;
    const w = video.videoWidth * s, h = video.videoHeight * s;
    vctx.save(); vctx.beginPath(); vctx.rect(a.x, a.y, a.w, a.h); vctx.clip();
    vctx.drawImage(video, a.x + (a.w - w) / 2, a.y + (a.h - h) / 2, w, h);
    vctx.restore();
  } else if (bgImage && bgImage.naturalWidth) {
    const s = Math.max(a.w / bgImage.naturalWidth, a.h / bgImage.naturalHeight) * zoom;
    const w = bgImage.naturalWidth * s, h = bgImage.naturalHeight * s;
    vctx.save(); vctx.beginPath(); vctx.rect(a.x, a.y, a.w, a.h); vctx.clip();
    vctx.drawImage(bgImage, a.x + (a.w - w) / 2, a.y + (a.h - h) / 2, w, h);
    vctx.restore();
  }
}
function drawScanlines() { ctx.fillStyle = "rgba(0,0,0,.22)"; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2); }

/* ---------- レーン（MANUAL・TRUCK） ---------- */
function drawHorizontalField(L, now) {
  const g = skin().game, y = L.laneY, p = performance.now(), pulse = beatPulse(now);
  ctx.fillStyle = g.lane; rr(L.hitX - 110, y - 84, L.endX - L.hitX + 170, 168, 42); ctx.fill();
  if (isTruck()) {
    for (const lane of [0, 1]) {
      const ry = truckRowY(L, lane);
      ctx.fillStyle = g.track; rr(L.hitX, ry - 4, L.endX - L.hitX, 8, 4); ctx.fill();
      ctx.globalAlpha = .8; ctx.strokeStyle = laneColor(lane); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(L.hitX, ry, 34 + pulse * 3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    }
    return;
  }
  ctx.fillStyle = g.track; rr(L.hitX, y - 5, L.endX - L.hitX, 10, 5); ctx.fill();
  const age = p - pressH.t;
  if (age < 120) {
    ctx.globalAlpha = Math.min(1, .5 * gameplayFxPower()) * (1 - age / 120); ctx.fillStyle = laneColor(pressH.lane);
    ctx.beginPath(); ctx.arc(L.hitX, y, 64, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = g.ink;
  ctx.globalAlpha = .9; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(L.hitX, y, 46 + pulse * 5, 0, TAU); ctx.stroke();
  ctx.globalAlpha = .35; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(L.hitX, y, 62, 0, TAU); ctx.stroke();
  ctx.globalAlpha = 1;
}
function drawVerticalField(L, now) {
  const g = skin().game, p = performance.now(), lw = L.laneW, font = fontFamily();
  ctx.fillStyle = g.lane; rr(L.panel.x, L.panel.y, L.panel.w, L.panel.h, L.panel.r); ctx.fill();
  for (let col = 0; col < 2; col++) {
    const x = L.centers[col], c = laneColor(slotLane(col));
    ctx.globalAlpha = .10; ctx.fillStyle = c; ctx.fillRect(x - lw / 2, L.topY, lw, L.hitY - L.topY); ctx.globalAlpha = 1;
    ctx.strokeStyle = g.track; ctx.lineWidth = 2; ctx.strokeRect(x - lw / 2, L.topY, lw, L.hitY - L.topY);
    const age = p - pressFlash[col];
    if (age < 160) {
      const gr = ctx.createLinearGradient(0, L.hitY, 0, L.hitY - 460);
      gr.addColorStop(0, hexToRgba(c, Math.min(.95, .6 * gameplayFxPower()) * (1 - age / 160))); gr.addColorStop(1, hexToRgba(c, 0));
      ctx.fillStyle = gr; ctx.fillRect(x - lw / 2, L.hitY - 460, lw, 460);
    }
  }
  const left = L.centers[0] - lw / 2, right = L.centers[1] + lw / 2;
  ctx.fillStyle = g.ink; ctx.globalAlpha = .7 + .3 * beatPulse(now);
  ctx.fillRect(left, L.hitY - 4, right - left, 8); ctx.globalAlpha = 1;
  for (let col = 0; col < 2; col++) {
    const x = L.centers[col], lane = slotLane(col), c = laneColor(lane), down = p - pressFlash[col] < 90;
    rr(x - lw / 2 + 10, L.hitY + 30, lw - 20, 76, 16); ctx.fillStyle = down ? c : g.panel; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = c; ctx.stroke();
    if (!settings.hideGameplayUI) {
      ctx.fillStyle = down ? "#fff" : g.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `900 24px ${font}`; ctx.fillText(hintKeys(col), x, L.hitY + 56, lw - 30);
      ctx.font = `700 16px ${font}`; ctx.fillText(laneName(lane), x, L.hitY + 86);
    }
  }
}
function drawMeasureLines(L, now) {
  if (!chartMeta.bpm) return;
  const m = 240000 / chartMeta.bpm, travel = travelMs(), g = skin().game;
  ctx.fillStyle = g.track;
  for (let k = Math.ceil((now - chartMeta.offset) / m); ; k++) {
    const u = chartMeta.offset + k * m - now; if (u > travel) break;
    const f = u / travel;
    if (L.vertical) { const y = L.hitY - f * (L.hitY - L.topY); ctx.fillRect(L.centers[0] - L.laneW / 2, y - 1, L.centers[1] - L.centers[0] + L.laneW, 2); }
    else { const x = L.hitX + f * (L.endX - L.hitX); ctx.fillRect(x - 1, L.laneY - 62, 2, 124); }
  }
}

/* ---------- ノーツ（MANUAL・TRUCK） ---------- */
function drawHNote(x, y, lane) {
  const g = skin().game, c = laneColor(lane), sh = noteShape(lane), img = noteImage(lane);
  if (g.glow) { ctx.shadowColor = c; ctx.shadowBlur = 26; }
  if (img) { ctx.drawImage(img, x - 42, y - 42, 84, 84); ctx.shadowBlur = 0; return; }
  shapePath(x, y, 36, sh); ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 5; ctx.strokeStyle = g.noteBorder; ctx.stroke();
  shapePath(x, y, 22, sh); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.stroke();
  if (!settings.hideGameplayUI) { const t = laneName(lane); drawLabel(t, x, y + 1, t.length > 2 ? 16 : 19); }
}
function drawVNote(x, y, lane, lw) {
  const g = skin().game, c = laneColor(lane), w = lw - 28, h = 32, img = noteImage(lane);
  if (g.glow) { ctx.shadowColor = c; ctx.shadowBlur = 22; }
  rr(x - w / 2, y - h / 2, w, h, 10); ctx.fillStyle = c; ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 3; ctx.strokeStyle = g.noteBorder; ctx.stroke();
  if (img) { ctx.drawImage(img, x - 26, y - 26, 52, 52); return; }
  shapePath(x - w / 2 + 22, y, 8, noteShape(lane)); ctx.fillStyle = g.noteBorder; ctx.fill();
  if (!settings.hideGameplayUI) drawLabel(laneName(lane), x + 8, y + 1, 18);
}
function drawKeyHintsH(L) {
  if (settings.hideGameplayUI || settings.autoPlay) return;
  const g = skin().game; let x = L.hitX - 100; const y = L.laneY + (L.commentary ? 108 : 122);
  ctx.font = `800 20px ${fontFamily()}`; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  for (let slot = 0; slot < 2; slot++) {
    const lane = slotLane(slot), txt = `${hintKeys(slot)}  ${laneName(lane)}`, w = ctx.measureText(txt).width + 32;
    rr(x, y - 20, w, 40, 20); ctx.fillStyle = g.lane; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = laneColor(lane); ctx.stroke();
    ctx.fillStyle = g.ink; ctx.fillText(txt, x + 16, y + 1);
    x += w + 14;
  }
}

/* ---------- 解説動画風パネル ---------- */
function drawCommentaryPanel() {
  const g = skin().game, p = performance.now(), font = fontFamily();
  ctx.fillStyle = g.panel; ctx.fillRect(0, 740, W, 340);
  ctx.fillStyle = laneColor(0); ctx.fillRect(0, 740, W / 2, 4); ctx.fillStyle = laneColor(1); ctx.fillRect(W / 2, 740, W / 2, 4);
  const capOn = caption && p - caption.t < CAPTION_MS;
  for (let i = 0; i < 2; i++) {
    const cx = i ? 292 : 112, c = laneColor(i);
    const cy = 880 - Math.max(0, 1 - (p - avatarHit[i]) / 200) * 10;
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx, cy, 58, 0, TAU); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = g.noteBorder; ctx.stroke();
    for (const dx of [-20, 20]) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(cx + dx, cy - 10, 11, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#1b1b22"; ctx.beginPath(); ctx.arc(cx + dx + (i ? -3 : 3), cy - 8, 6, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#1b1b22"; ctx.strokeStyle = "#1b1b22"; ctx.lineWidth = 4;
    if (capOn && caption.speaker === i) {
      ctx.beginPath(); ctx.ellipse(cx, cy + 24, 12, 4 + Math.abs(Math.sin(p / 70)) * 9, 0, 0, TAU); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(cx, cy + 16, 12, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); }
    const name = tr(i ? "speakerB" : "speakerA");
    ctx.font = `800 20px ${font}`; const tw = Math.max(100, ctx.measureText(name).width + 32);
    rr(cx - tw / 2, 962, tw, 38, 19); ctx.fillStyle = c; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(name, cx, 982);
  }
  if (capOn) {
    const age = p - caption.t;
    ctx.globalAlpha = Math.max(0, Math.min(1, age / 120, (CAPTION_MS - age) / 300));
    ctx.font = `900 44px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    const x = 1145, y = 808;
    ctx.lineWidth = 14; ctx.strokeStyle = "#111"; ctx.strokeText(caption.text, x, y, 1400);
    ctx.lineWidth = 7; ctx.strokeStyle = laneColor(caption.speaker ? 1 : 0); ctx.strokeText(caption.text, x, y, 1400);
    ctx.fillStyle = "#fff"; ctx.fillText(caption.text, x, y, 1400);
    ctx.globalAlpha = 1;
  }
}

/* ---------- ヒットエフェクト ---------- */
function drawEffects() {
  const k = gameplayFxPower(), p = performance.now(), g = skin().game;
  const life = 380 * (0.85 + 0.25 * Math.min(k, 2));
  effects = effects.filter(e => p - e.t < life);
  if (k <= 0) return;
  ctx.save();
  for (const e of effects) {
    const a = (p - e.t) / life, fade = 1 - a;
    ctx.globalCompositeOperation = "lighter";
    const rad = (60 + a * 50) * (0.8 + 0.4 * k);
    const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rad);
    gr.addColorStop(0, hexToRgba(e.c, Math.min(1, .55 * k) * fade));
    gr.addColorStop(.45, hexToRgba(e.c, Math.min(1, .25 * k) * fade));
    gr.addColorStop(1, hexToRgba(e.c, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, TAU); ctx.fill();
    if (e.kind === "perfect" && a < .35) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(.9, .45 * k) * (1 - a / .35)})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, 30 + a * 40, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = Math.min(1, fade * (0.55 + 0.45 * Math.min(k, 1.5)));
    ctx.strokeStyle = e.c; ctx.lineWidth = (8 * fade + 2) * (0.7 + 0.3 * k);
    ctx.shadowColor = e.c; ctx.shadowBlur = 12 * k;
    ctx.beginPath(); ctx.arc(e.x, e.y, 44 + a * 70 * (0.8 + 0.2 * k), 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
    if (e.kind === "perfect") {
      const count = Math.round(8 + 4 * k), size = 4 + 2 * Math.min(k, 2);
      ctx.fillStyle = g.perfect;
      for (let i = 0; i < count; i++) {
        const ang = i / count * TAU + e.seed, r = 60 + a * 90 * (0.8 + 0.2 * k);
        ctx.fillRect(e.x + Math.cos(ang) * r - size / 2, e.y + Math.sin(ang) * r - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
/* タイミングメーター：タイミングで叩くモード（MANUAL・ORBIT・STAGE）だけ。AUTOでは出さない */
function drawErrorMeter() {
  if (!settings.errorMeter || settings.autoPlay || !["manual", "orbit", "stage"].includes(settings.playMode)) return;
  const w = windows(), g = skin().game, cx = 960, cy = 64, half = 200, p = performance.now();
  ctx.fillStyle = "rgba(0,0,0,.35)"; rr(cx - half - 10, cy - 14, half * 2 + 20, 28, 14); ctx.fill();
  ctx.globalAlpha = .3; ctx.fillStyle = g.good; ctx.fillRect(cx - half, cy - 4, half * 2, 8);
  const pw = half * w.perfect / w.good; ctx.globalAlpha = .55; ctx.fillStyle = g.perfect; ctx.fillRect(cx - pw, cy - 4, pw * 2, 8);
  ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.fillRect(cx - 1.5, cy - 12, 3, 24);
  for (const e of errors) {
    const age = (p - e.t) / 4000; if (age > 1) continue;
    const x = cx + Math.max(-1, Math.min(1, e.d / w.good)) * half;
    ctx.globalAlpha = 1 - age; ctx.fillStyle = e.kind === "perfect" ? g.perfect : g.good; ctx.fillRect(x - 2, cy - 11, 4, 22);
  }
  ctx.globalAlpha = 1;
}

/* ---------- カウントダウン（3・2・1・GO!） ---------- */
function drawCountdown() {
  const p = performance.now(), L = layout();
  let text = null, age = 0, go = false;
  if (leadIn && phase === "playing") {
    const k = Math.floor((p - leadIn.start) / leadIn.iv);
    if (k >= 0 && k < 3) { text = String(3 - k); age = (p - leadIn.start - k * leadIn.iv) / leadIn.iv; }
  } else if (goAt && p - goAt < 650) { text = tr("go"); age = (p - goAt) / 650; go = true; }
  if (!text) return;
  let x = 960, y = 640;
  if (isOrbit()) y = 300;
  else if (isStage()) y = 520;
  else if (isCatchMode()) y = 460;
  else if (L.commentary) y = 400;
  else if (L.vertical) { x = (L.centers[0] + L.centers[1]) / 2; y = 520; }
  const s = (go ? 1.1 : 1) * (1.25 - .25 * Math.min(1, age * 3));
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - age * .85);
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.font = `900 ${go ? 190 : 220}px ${fontFamily()}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
  ctx.lineWidth = 18; ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = go ? skin().game.perfect : "#ffffff"; ctx.fillText(text, 0, 0);
  ctx.restore();
}

/* ---------- 通知・リトライの長押しバー ---------- */
function drawToastAndRetry() {
  const p = performance.now();
  if (toast && p - toast.t < 1400) {
    const a = Math.min(1, (1400 - (p - toast.t)) / 300);
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = `800 26px ${fontFamily()}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const tw = ctx.measureText(toast.text).width + 40;
    rr(960 - tw / 2, 102, tw, 44, 22); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(toast.text, 960, 125);
    ctx.restore();
  }
  if (retryHoldAt) {
    const k = Math.min(1, (p - retryHoldAt) / 350);
    ctx.save();
    rr(760, 1000, 400, 14, 7); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill();
    rr(760, 1000, 400 * k, 14, 7); ctx.fillStyle = skin().ui["--ui-accent"]; ctx.fill();
    ctx.restore();
  }
}

/* ---------- マスコット：オレンジ相棒（オリジナル・GPL） ---------- */
function drawBuddy(x, y, st) {
  const p = st.p, r = 60;
  ctx.fillStyle = "#c4500f"; rr(x - 36, y + r - 12, 24, 22, 9); ctx.fill(); rr(x + 12, y + r - 12, 24, 22, 9); ctx.fill();
  const grd = ctx.createRadialGradient(x - 22, y - 28, 8, x, y, r * 1.15);
  grd.addColorStop(0, "#ffb27a"); grd.addColorStop(1, "#ff6a1f");
  rr(x - r, y - r, r * 2, r * 2, r * .6); ctx.fillStyle = grd; ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = "#7a2e08"; ctx.stroke();
  ctx.lineCap = "round"; ctx.lineWidth = 9; ctx.strokeStyle = "#2b2b33";
  ctx.beginPath(); ctx.arc(x, y - 4, r + 9, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  for (const s of [-1, 1]) {
    const cx = x + s * (r + 5);
    rr(cx - 13, y - 24, 26, 46, 10); ctx.fillStyle = "#2b2b33"; ctx.fill();
    rr(cx - 7, y - 16, 14, 30, 6); ctx.fillStyle = laneColor(s < 0 ? 0 : 1); ctx.fill();
  }
  ctx.fillStyle = "#2a1408"; ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 5;
  if (st.sad) {
    for (const s of [-1, 1]) {
      const ex = x + s * 22, ey = y - 8;
      ctx.beginPath(); ctx.moveTo(ex + 8 * s, ey - 7); ctx.lineTo(ex - 6 * s, ey); ctx.lineTo(ex + 8 * s, ey + 7); ctx.stroke();
    }
  } else {
    const eh = (p % 3400) < 120 ? 3 : st.happy ? 10 : 16;
    for (const s of [-1, 1]) { rr(x + s * 22 - 5, y - 10 - eh / 2, 10, eh, 3); ctx.fill(); }
  }
  ctx.globalAlpha = .35; ctx.fillStyle = "#ff3b6b";
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 38, y + 10, 10, 6, 0, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#2a1408"; ctx.strokeStyle = "#2a1408"; ctx.lineWidth = 4;
  if (st.talking) { ctx.beginPath(); ctx.ellipse(x, y + 20, 9, 3 + Math.abs(Math.sin(p / 70)) * 8, 0, 0, TAU); ctx.fill(); }
  else if (st.sad) { ctx.beginPath(); ctx.arc(x, y + 30, 10, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(x, y + 12, st.happy ? 14 : 10, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); }
}
const BUDDY_DEF = { draw:drawBuddy, top:-74, shadowY:74, border:"#ff7a2f" };

/* ---------- 吹き出し（共通） ---------- */
function drawBubble(anchorX, by, maxW, border, tailRight) {
  const g = skin().game, p = performance.now(), age = p - caption.t;
  ctx.globalAlpha = Math.max(0, Math.min(1, age / 120, (CAPTION_MS - age) / 300));
  ctx.font = `800 24px ${fontFamily()}`;
  const tw = Math.min(maxW, ctx.measureText(caption.text).width), bw = tw + 44, bh = 56;
  const bx = Math.max(20, anchorX - bw);
  rr(bx, by, bw, bh, 18); ctx.fillStyle = g.panel; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = border; ctx.stroke();
  ctx.beginPath();
  if (tailRight) { ctx.moveTo(bx + bw - 2, by + 14); ctx.lineTo(bx + bw + 24, by + 28); ctx.lineTo(bx + bw - 2, by + 42); }
  else { const tx = Math.min(bx + bw - 40, anchorX - 54); ctx.moveTo(tx, by + bh - 2); ctx.lineTo(tx + 12, by + bh + 22); ctx.lineTo(tx + 24, by + bh - 2); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = g.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(caption.text, bx + 22, by + bh / 2 + 1, tw);
  ctx.globalAlpha = 1;
}
function drawCornerCredit(text) {
  const g = skin().game;
  ctx.globalAlpha = .75; ctx.font = `600 15px ${fontFamily()}`;
  ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = g.ink;
  ctx.fillText(text, W - 20, H - 16, 700);
  ctx.globalAlpha = 1;
}

/* ---------- マスコット全体 ---------- */
function drawVrmOverlay() {
  if (!vrmState.loaded) return;
  const R = VRM_RECT[settings.layout] || VRM_RECT.classic, talking = !!caption && performance.now() - caption.t < CAPTION_MS;
  ctx.save();
  if (talking && settings.layout !== "commentary") drawBubble(R.x + 40, R.y + 50, 640, skin().ui["--ui-accent"], true);
  if (vrmState.credit) drawCornerCredit(vrmState.credit);
  ctx.restore();
}
/* 🩷 MMD：3Dは #mmdCanvas が描くので、ここは吹き出しとクレジットだけ */
function drawMmdOverlay() {
  const info = window.TrkMMD && window.TrkMMD.model && window.TrkMMD.model();
  if (!info) return;
  const R = VRM_RECT[settings.layout] || VRM_RECT.classic, talking = !!caption && performance.now() - caption.t < CAPTION_MS;
  ctx.save();
  if (talking && settings.layout !== "commentary") drawBubble(R.x + 40, R.y + 50, 640, skin().ui["--ui-accent"], true);
  const credit = String(settings.mmdCredit || "").trim();
  if (credit) drawCornerCredit(tr("mmdCreditPrefix") + " " + credit);
  ctx.restore();
}
function drawMascot() {
  const m = activeMascot(); if (!m) return;
  if (m === "vrm") { drawVrmOverlay(); return; }
  if (m === "mmd") { drawMmdOverlay(); return; }
  const def = m === "buddy" ? BUDDY_DEF : MASCOT_DEFS[m];
  if (!def) return;
  const P = MASCOT_POS[settings.layout] || MASCOT_POS.classic, p = performance.now();
  const hitAge = p - Math.max(avatarHit[0], avatarHit[1]);
  const st = { p, sad: p - lastMissT < 700, happy: hitAge < 300, talking: !!caption && p - caption.t < CAPTION_MS };
  const x = P.x, y = P.y - Math.max(0, 1 - hitAge / 180) * 14 + Math.sin(p / 420) * 4;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(P.x, P.y + (def.shadowY || 74), 48, 10, 0, 0, TAU); ctx.fill();
  ctx.save();
  try { def.draw(x, y, st); } catch (e) { console.error(e); }
  ctx.restore();
  if (st.talking && settings.layout !== "commentary") {
    drawBubble(x + 60, y + (def.top || -74) - 70, settings.layout === "center" ? 460 : 720, def.border || skin().ui["--ui-accent"], false);
  }
  if (typeof def.credit === "function") { const c = def.credit(); if (c) drawCornerCredit(String(c)); }
  ctx.restore();
}

/* ---------- 1フレームの描画 ----------
   ORBIT：道と判定点（modes.js）／STAGE：舞台演出＋縦レーン（stagefx.js・stage.js）／CATCH：道路とトラック（catch.js） */
function tiltPivot(L) {
  if (isOrbit()) return { x:ORBIT_CX, y:ORBIT_CY };
  if (isStage()) return { x:STAGE.cx, y:STAGE.hitY };
  if (isCatchMode()) return { x:960, y:CATCH.lineY };
  return lanePivot(L);
}
function drawGame(now) {
  const L = layout(), g = skin().game, mode = settings.playMode;
  ctx.clearRect(0, 0, W, H);
  if (g.scanlines) drawScanlines();
  if (L.commentary && !ownField()) drawCommentaryPanel();
  if (mode === "stage" && typeof drawStageBackdrop === "function") drawStageBackdrop(now);
  const tilt = laneTilt(now);
  ctx.save();
  if (tilt) { const c = tiltPivot(L); ctx.translate(c.x, c.y); ctx.rotate(tilt); ctx.translate(-c.x, -c.y); }
  if (mode === "orbit") drawOrbitField(now);
  else if (mode === "stage") drawStageField(now);
  else if (mode === "catch") drawCatchField(now);
  else {
    const truckMode = mode === "truck";
    if (L.vertical) drawVerticalField(L, now); else drawHorizontalField(L, now);
    if (truckMode) drawLaneTint(L);
    drawMeasureLines(L, now);
    const travel = travelMs(); let end = nextIdx;
    while (end < chart.length && chart[end].time - now <= travel) end++;
    for (let i = end - 1; i >= nextIdx; i--) {
      const n = chart[i]; if (n.judged) continue;
      const u = n.time - now, a = noteAlpha(u);
      if (a <= 0) continue;
      const pos = notePos(L, n.lane, u);
      ctx.globalAlpha = a;
      if (L.vertical) drawVNote(pos.x, pos.y, n.lane, L.laneW); else drawHNote(pos.x, pos.y, n.lane);
      ctx.globalAlpha = 1;
    }
    if (truckMode) drawTruck(L, now);
    if (!L.vertical) drawKeyHintsH(L);
  }
  drawEffects();
  ctx.restore();
  drawErrorMeter(); drawMascot(); drawLives(); drawCountdown(); drawToastAndRetry();
  if (typeof drawFxOverlay === "function") drawFxOverlay(now);          // AP・FC表示、カーテンコール
  if (typeof drawExtrasOverlay === "function") drawExtrasOverlay(now);  // 👻 ゴースト
}
function updateProgress() {
  const d = video.duration || 0, ct = video.currentTime || 0;
  $("progress").style.width = d ? `${ct / d * 100}%` : "0";
  $("clock").textContent = `${fmtTime(ct)} / ${fmtTime(d)}`;
  if (!seekDragging && d) $("seekBar").value = Math.round(ct / d * 1000);
}
function loop() {
  requestAnimationFrame(loop);
  if (phase === "title") return;
  tickClock();                                   // 🕹️ 無音検知・カウントダウンは毎フレーム動かす
  const now = gameTime();
  if (phase === "playing" && !settings.autoPlay) {
    if (settings.playMode === "truck") truckJudge(now);
    else if (settings.playMode === "catch") catchJudge(now);
  }
  if (phase === "playing") sweepMisses(now);   // AUTOの自動判定もここから（game.js）。ORBIT・STAGEは入力で判定
  /* 🪶 軽量化：ここから下（描くところ）だけを間引く。判定は音声の時計なので、描く回数を減らしてもズレません。
     🎯「ゲーム優先」（settings.liteGameFull）のときは、ここで止めずに今までどおりのフレームレートで描きます */
  if (typeof TrkLite === "object" && !TrkLite.allowGame(performance.now())) return;
  drawVideo(); drawGame(now); updateProgress();
}
/* ✅ render.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.beatPulse = beatPulse;
/* 後から読み込まれるファイルがこの名前を差し替える（window.drawVideo の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "drawVideo", { configurable:true, get:() => drawVideo, set:v => { drawVideo = v; } });
window.hitPos = hitPos;
window.layout = layout;
window.loop = loop;
window.noteAlpha = noteAlpha;
window.ownField = ownField;
Object.defineProperty(window, "retryHoldAt", { configurable:true, get:() => retryHoldAt, set:v => { retryHoldAt = v; } });
window.rr = rr;
window.showToast = showToast;
Object.defineProperty(window, "toast", { configurable:true, get:() => toast, set:v => { toast = v; } });
window.vrmState = vrmState;
})();
