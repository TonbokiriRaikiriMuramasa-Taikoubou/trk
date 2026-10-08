(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! stage.js — 🎪 STAGE（縦レーン・4／5／6レーン）
   ・自動生成譜面を、階段・トリル・ワイドノーツなどの一般的な配置ルールでレーンに割り振ります
     （特定のゲームの譜面は使っていません。曲ごとに自動で作ります）
   ・配置オプション：ミラー／🎲 RANDOM（並びを入れ替え）／🔀 ANTI-ROLL（連打を避けて1ノーツずつ入れ替え）
   ・隣のレーン判定、レーンの暗さ・幅、ノーツの太さ、キービーム、補助線、盛り上がり演出、PERFECT✦
   共通の文章（モード名・記録・称号）は i18n.js にあります。
   読み込み順：modes.js の後（makeSeg などを使うため）。描画・判定は render.js／game.js から呼ばれます。
   ========================================================================== */
"use strict";

/* ============ 文章（STAGEの設定だけ） ============ */
Object.assign(TEXT.ja, {
  stageViewTitle:"🎪 STAGEの見た目と譜面",
  stageLanesLabel:"レーン数", stageLanes4:"4レーン", stageLanes5:"5レーン", stageLanes6:"6レーン",
  stagePatternLabel:"配置スタイル", stagePatternAuto:"自動（難易度に合わせる）", stagePatternCalm:"おだやか", stagePatternTech:"テクニカル",
  stageRandomLabel:"配置オプション", stageRandomOff:"オフ", stageRandomRan:"🎲 RANDOM", stageRandomAnti:"🔀 ANTI-ROLL",
  stageRandomHint:"RANDOM：レーンの並びを曲ごとに1回入れ替えます。ANTI-ROLL：ノーツを1つずつ入れ替え、同じレーンの連打を避けます。どちらもSeedで決まり、ハイスコアの対象です。",
  stageWidth:"レーンの幅", stageThick:"ノーツの太さ", stageDim:"レーンの暗さ",
  stageAdjacent:"隣のレーンを押しても判定する（やさしめ）", stageMirror:"ミラー（左右反転）",
  stageLaneColor:"ノーツをドン／カッの色で表示する（オフ＝スキンの色で1色）",
  stageBeam:"キービーム（押したレーンを光らせる）", stageGuides:"レーン補助線", stageHype:"盛り上がる場面でレーンを光らせる",
  perfectStar:"PERFECT✦ を表示する（全モード共通・スコアは変わりません）",
  stageViewHint:"速い連続は階段やトリルに、小節の頭は2レーン幅のワイドノーツになります。難易度が高いほど配置が広がります。",
  stageKeysTitle:"🎪 STAGEのキー", stageKeyReset:"↺ 標準のキーに戻す", stageLaneN:"レーン{n}",
  stageCapture:"レーン{n}に割り当てるキーを押してください。ESCでキャンセル。", stageAssigned:"STAGEのキーを設定しました。"
});
Object.assign(TEXT.en, {
  stageViewTitle:"🎪 STAGE look & charts",
  stageLanesLabel:"Lanes", stageLanes4:"4 lanes", stageLanes5:"5 lanes", stageLanes6:"6 lanes",
  stagePatternLabel:"Pattern style", stagePatternAuto:"Auto (by difficulty)", stagePatternCalm:"Calm", stagePatternTech:"Technical",
  stageRandomLabel:"Lane option", stageRandomOff:"Off", stageRandomRan:"🎲 RANDOM", stageRandomAnti:"🔀 ANTI-ROLL",
  stageRandomHint:"RANDOM shuffles the lane order once per song. ANTI-ROLL moves notes one by one to avoid repeated hits on the same lane. Both follow the seed and count for high scores.",
  stageWidth:"Lane width", stageThick:"Note thickness", stageDim:"Lane darkness",
  stageAdjacent:"Also accept hits on the neighboring lane (lenient)", stageMirror:"Mirror (flip left/right)",
  stageLaneColor:"Show notes in Don/Ka colors (off = one skin color)",
  stageBeam:"Key beam (light up pressed lanes)", stageGuides:"Lane guide lines", stageHype:"Light up the lanes in loud sections",
  perfectStar:"Show PERFECT✦ (all modes, score unchanged)",
  stageViewHint:"Fast runs become stairs or trills, and bar downbeats become two-lane wide notes. Higher difficulties spread notes wider.",
  stageKeysTitle:"🎪 STAGE keys", stageKeyReset:"↺ Default keys", stageLaneN:"Lane {n}",
  stageCapture:"Press a key for lane {n}. ESC cancels.", stageAssigned:"STAGE key assigned."
});
Object.assign(TEXT.zh, {
  stageViewTitle:"🎪 STAGE 外观与谱面",
  stageLanesLabel:"轨道数", stageLanes4:"4轨", stageLanes5:"5轨", stageLanes6:"6轨",
  stagePatternLabel:"配置风格", stagePatternAuto:"自动（随难度）", stagePatternCalm:"平缓", stagePatternTech:"技巧",
  stageRandomLabel:"轨道选项", stageRandomOff:"关闭", stageRandomRan:"🎲 RANDOM", stageRandomAnti:"🔀 ANTI-ROLL",
  stageRandomHint:"RANDOM：每首歌打乱一次轨道顺序。ANTI-ROLL：逐个移动音符，避免同一轨道连打。两者都由Seed决定，计入最高分。",
  stageWidth:"轨道宽度", stageThick:"音符粗细", stageDim:"轨道暗度",
  stageAdjacent:"按相邻轨道也算判定（宽松）", stageMirror:"镜像（左右翻转）",
  stageLaneColor:"用咚／咔的颜色显示音符（关闭＝皮肤单色）",
  stageBeam:"按键光束（点亮按下的轨道）", stageGuides:"轨道辅助线", stageHype:"高潮段落点亮轨道",
  perfectStar:"显示 PERFECT✦（所有模式・不影响分数）",
  stageViewHint:"快速连打会变成阶梯或交互，小节开头会变成两轨宽的宽音符。难度越高，配置越分散。",
  stageKeysTitle:"🎪 STAGE 按键", stageKeyReset:"↺ 恢复默认按键", stageLaneN:"轨道{n}",
  stageCapture:"请按下轨道{n}的按键。ESC取消。", stageAssigned:"已设置STAGE按键。"
});
Object.assign(TEXT.ko, {
  stageViewTitle:"🎪 STAGE 외관과 채보",
  stageLanesLabel:"레인 수", stageLanes4:"4레인", stageLanes5:"5레인", stageLanes6:"6레인",
  stagePatternLabel:"배치 스타일", stagePatternAuto:"자동 (난이도에 맞춤)", stagePatternCalm:"잔잔하게", stagePatternTech:"테크니컬",
  stageRandomLabel:"레인 옵션", stageRandomOff:"끄기", stageRandomRan:"🎲 RANDOM", stageRandomAnti:"🔀 ANTI-ROLL",
  stageRandomHint:"RANDOM: 곡마다 한 번 레인 순서를 섞습니다. ANTI-ROLL: 노트를 하나씩 옮겨 같은 레인 연타를 피합니다. 둘 다 Seed로 정해지며 최고 점수에 포함됩니다.",
  stageWidth:"레인 폭", stageThick:"노트 두께", stageDim:"레인 어둡기",
  stageAdjacent:"옆 레인을 눌러도 판정 (느슨하게)", stageMirror:"미러 (좌우 반전)",
  stageLaneColor:"노트를 쿵／딱 색으로 표시 (끄면 스킨 색 한 가지)",
  stageBeam:"키 빔 (누른 레인 빛내기)", stageGuides:"레인 보조선", stageHype:"신나는 구간에서 레인 빛내기",
  perfectStar:"PERFECT✦ 표시 (모든 모드・점수 변화 없음)",
  stageViewHint:"빠른 연타는 계단이나 트릴로, 마디 첫 박은 2레인 폭의 와이드 노트가 됩니다. 난이도가 높을수록 배치가 넓어집니다.",
  stageKeysTitle:"🎪 STAGE 키", stageKeyReset:"↺ 기본 키로", stageLaneN:"레인 {n}",
  stageCapture:"레인 {n}에 지정할 키를 누르세요. ESC로 취소.", stageAssigned:"STAGE 키를 설정했습니다."
});

/* ============ 設定 ============ */
const STAGE_DEFAULT_KEYS = {
  "4":["KeyD", "KeyF", "KeyJ", "KeyK"],
  "5":["KeyD", "KeyF", "Space", "KeyJ", "KeyK"],
  "6":["KeyS", "KeyD", "KeyF", "KeyJ", "KeyK", "KeyL"]
};
window.Trk.core.settings.stageLanes = window.Trk.core.pick(window.Trk.core.prefs.stageLanes, ["4", "5", "6"], "4");
window.Trk.core.settings.stagePattern = window.Trk.core.pick(window.Trk.core.prefs.stagePattern, ["auto", "calm", "tech"], "auto");
window.Trk.core.settings.stageRandom = window.Trk.core.pick(window.Trk.core.prefs.stageRandom, ["off", "random", "anti"], "off");
window.Trk.core.settings.stageWidth = window.Trk.core.num(window.Trk.core.prefs.stageWidth, .6, 1.4, 1);
window.Trk.core.settings.stageThick = window.Trk.core.num(window.Trk.core.prefs.stageThick, .6, 1.6, 1);
window.Trk.core.settings.stageDim = window.Trk.core.num(window.Trk.core.prefs.stageDim, 0, .9, .35);
window.Trk.core.settings.stageAdjacent = window.Trk.core.prefs.stageAdjacent !== false;
window.Trk.core.settings.stageMirror = !!window.Trk.core.prefs.stageMirror;
window.Trk.core.settings.stageLaneColor = window.Trk.core.prefs.stageLaneColor !== false;
window.Trk.core.settings.stageBeam = window.Trk.core.prefs.stageBeam !== false;
window.Trk.core.settings.stageGuides = window.Trk.core.prefs.stageGuides !== false;
window.Trk.core.settings.stageHype = window.Trk.core.prefs.stageHype !== false;
window.Trk.core.settings.perfectStar = window.Trk.core.prefs.perfectStar !== false;
const validKeyList = (v, n) => Array.isArray(v) && v.length === n && v.every(window.Trk.core.validCode) && new Set(v).size === n;
for (const n of ["4", "5", "6"]) {
  const k = "stageKeys" + n;
  window.Trk.core.settings[k] = validKeyList(window.Trk.core.prefs[k], +n) ? window.Trk.core.prefs[k].slice() : STAGE_DEFAULT_KEYS[n].slice();
}
const isStage = () => window.Trk.core.settings.playMode === "stage";
const stageN = () => +window.Trk.core.settings.stageLanes;
const stageKeys = () => window.Trk.core.settings["stageKeys" + window.Trk.core.settings.stageLanes];

/* 配置オプションを MODS に表示（ミラーは game.js が付けます） */
(() => {
  const base = window.Trk.core.activeMods;
  window.Trk.core.activeMods = () => {
    const m = base();
    if (isStage() && window.Trk.core.settings.stageRandom !== "off") m.push(window.Trk.core.settings.stageRandom === "anti" ? "A-RAN" : "RANDOM");
    return m;
  };
})();

/* ============ 形（1920×1080の座標） ============ */
const STAGE = { cx:960, topY:110, hitY:930, topRatio:.26 };
const stageBottomW = () => ({ 4:780, 5:880, 6:980 }[stageN()] || 780) * window.Trk.core.settings.stageWidth;
const stageDepth = q => Math.pow(Math.max(0, q), 1.35);                 // q：0＝奥、1＝判定ライン
const stageWidthAt = q => stageBottomW() * (STAGE.topRatio + (1 - STAGE.topRatio) * stageDepth(q));
const stageY = q => STAGE.topY + (STAGE.hitY - STAGE.topY) * stageDepth(q);
const stageLaneX = (lane, q) => { const w = stageWidthAt(q); return STAGE.cx - w / 2 + (lane + .5) * w / stageN(); };

/* ============ 譜面のレーン割り振り ============
   ・難易度の段階（tier）：初級0／中級1／上級2／MASTER・RUSH 3。おだやか＝最大1、テクニカル＝+1
   ・ゆっくりの音：ドン＝左寄り、カッ＝右寄りに置き、前と同じレーンは避ける
   ・速い連続（8分より細かい）：階段（となりへ順に）かトリル（2レーンを交互）
   ・小節の頭：一定の確率で2レーン幅のワイドノーツ
   ・音が大きい場面（上位25%）：盛り上がり演出の対象
   ・最後にミラー → RANDOM／ANTI-ROLL の順で配置オプションをかける */
const stageMap = { src:null, len:0, key:"", lanes:new Int8Array(0), wide:new Uint8Array(0), hype:new Uint8Array(0) };
function ensureStageMap() {
  const N = stageN(), seed = window.Trk.core.$("seed").value;
  const isMirror = !!(window.Trk.core.settings.stageMirror || window.Trk.core.settings.modMirror);
  const isRandom = window.Trk.core.settings.stageRandom === "random" || !!window.Trk.core.settings.modRandom;
  const key = `${N}|${seed}|${window.Trk.core.chartDiff}|${window.Trk.core.settings.stagePattern}|${isMirror}|${isRandom}|${window.Trk.core.settings.stageHype}|${window.Trk.core.chartMeta.bpm}`;
  if (stageMap.src === window.Trk.core.chart && stageMap.len === window.Trk.core.chart.length && stageMap.key === key) return;
  const base = { easy:0, normal:1, hard:2, master:3, rush:3 }[window.Trk.core.chartDiff] ?? 1;
  const tier = window.Trk.core.settings.stagePattern === "calm" ? Math.min(base, 1) : window.Trk.core.settings.stagePattern === "tech" ? Math.min(3, base + 1) : base;
  const beat = 60000 / (window.Trk.core.chartMeta.bpm || 120), bar = beat * 4, off = window.Trk.core.chartMeta.offset || 0;
  const rand = window.Trk.core.mulberry32(window.Trk.core.hashString(`stage|${key}|${window.Trk.core.chart.length}`));
  const L = window.Trk.core.chart.length, lanes = new Int8Array(L), wide = new Uint8Array(L), hype = new Uint8Array(L);
  const clamp = l => Math.max(0, Math.min(N - 1, l));
  let prev = Math.floor(N / 2), prevT = -1e9, pat = "free", dir = 1, trA = 0, trB = 1;
  for (let i = 0; i < L; i++) {
    const n = window.Trk.core.chart[i], gap = n.time - prevT, fast = gap < beat * .55;
    let l;
    if (fast && tier >= 1) {
      if (pat === "free") {
        pat = tier >= 2 && rand() < .45 ? "trill" : "stairs";
        dir = prev >= N / 2 ? -1 : 1;
        trA = prev; trB = clamp(prev + dir);
        if (trB === trA) trB = clamp(prev - dir);
      }
      if (pat === "stairs") { l = prev + dir; if (l < 0 || l >= N) { dir = -dir; l = prev + dir; } }
      else l = prev === trA ? trB : trA;
    } else {
      pat = "free";
      let lo = 0, hi = N - 1;
      if (tier <= 1) { if (n.lane) lo = Math.floor(N / 2); else hi = Math.ceil(N / 2) - 1; }
      else { if (n.lane) lo = Math.max(0, Math.floor(N / 2) - 1); else hi = Math.min(N - 1, Math.ceil(N / 2)); }
      const span = hi - lo + 1;
      l = lo + Math.floor(rand() * span);
      if (l === prev && span > 1 && gap < beat * 1.05) l = lo + ((l - lo + 1 + Math.floor(rand() * (span - 1))) % span);
      if (tier === 0 && Math.abs(l - prev) > 2 && gap < beat) l = prev + Math.sign(l - prev) * 2;   // 初級は大きく飛ばない
    }
    l = clamp(l);
    const inBar = (((n.time - off) % bar) + bar) % bar;
    const downbeat = inBar < 40 || bar - inBar < 40;
    if (downbeat && !fast && tier >= 1 && rand() < [0, .22, .32, .42][tier]) { wide[i] = 1; if (l >= N - 1) l = N - 2; }
    lanes[i] = l; prev = l; prevT = n.time;
  }
  if (window.Trk.core.settings.stageHype && window.Trk.core.analysis && L) {
    const loud = window.Trk.core.chart.map(n => window.Trk.media.rmsAt(n.time)), sorted = loud.slice().sort((a, b) => a - b);
    const thr = sorted[Math.floor(sorted.length * .75)];
    loud.forEach((v, i) => { hype[i] = v >= thr ? 1 : 0; });
  }
  /* ミラー */
  if (isMirror) for (let i = 0; i < L; i++) lanes[i] = N - 1 - lanes[i] - wide[i];
  /* 🎲 RANDOM：レーンの並びを1回だけ入れ替える */
  if (isRandom) {
    const perm = [...Array(N).keys()];
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < L; i++) {
      const a = perm[lanes[i]];
      if (wide[i]) {
        const b = perm[lanes[i] + 1];
        if (Math.abs(a - b) === 1) lanes[i] = Math.min(a, b); else { wide[i] = 0; lanes[i] = a; }
      } else lanes[i] = a;
    }
  }
  /* 🔀 ANTI-ROLL：1ノーツずつ入れ替え、短い間隔では前と同じレーン（重なり）を避ける */
  if (window.Trk.core.settings.stageRandom === "anti") {
    let pL = -9, pW = 0, pT = -1e9;
    for (let i = 0; i < L; i++) {
      const maxL = wide[i] ? N - 2 : N - 1, close = window.Trk.core.chart[i].time - pT < beat * .75;
      let l = 0;
      for (let tries = 0; tries < 8; tries++) {
        l = Math.floor(rand() * (maxL + 1));
        const overlap = l <= pL + pW && l + wide[i] >= pL;
        if (!close || !overlap) break;
      }
      lanes[i] = l; pL = l; pW = wide[i]; pT = window.Trk.core.chart[i].time;
    }
  }
  Object.assign(stageMap, { src:window.Trk.core.chart, len:L, key, lanes, wide, hype });
}
function stageHitPos(n) {      // game.js から使います
  ensureStageMap();
  const i = Math.max(0, window.Trk.core.chart.indexOf(n)), l = stageMap.lanes[i] ?? 0;
  return { x:stageLaneX(l + stageMap.wide[i] * .5, 1), y:STAGE.hitY };
}

/* ============ 判定 ============ */
const stagePress = new Array(6).fill(-1e9);
function resetStage() { stagePress.fill(-1e9); stageMap.src = null; }
function stageInput(lane, ts) {
  if (window.Trk.core.phase !== "playing" || !isStage() || window.Trk.core.settings.autoPlay) return;
  ensureStageMap();
  const p = performance.now(), at = (ts > 0 && ts <= p) ? ts : p, now = window.Trk.play.gameTime(at), w = window.Trk.core.windows();
  stagePress[lane] = p; window.Trk.core.pressH = { lane:lane < stageN() / 2 ? 0 : 1, t:p };
  const reach = window.Trk.core.settings.stageAdjacent ? 1 : 0;
  let best = -1, bestScore = 1e9;
  for (let i = window.Trk.core.nextIdx; i < window.Trk.core.chart.length; i++) {
    const n = window.Trk.core.chart[i], d = now - n.time;
    if (d < -w.good) break;
    if (n.judged || Math.abs(d) > w.good) continue;
    const l0 = stageMap.lanes[i], l1 = l0 + stageMap.wide[i];
    const dist = lane < l0 ? l0 - lane : lane > l1 ? lane - l1 : 0;
    if (dist > reach) continue;
    const score = Math.abs(d) + dist * 40;                        // 同じレーンを優先
    if (score < bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) { window.Trk.media.playSE(lane < stageN() / 2 ? 0 : 1); return; }   // 空打ちはミスにしない
  const n = window.Trk.core.chart[best], d = now - n.time;
  window.Trk.media.playSE(n.lane);
  window.Trk.play.judgeNote(n, Math.abs(d) <= w.perfect ? "perfect" : "good", d);
}

/* ============ 描画（render.js から呼ばれます） ============ */
function stageQuad(x0t, x1t, x0b, x1b, yb) {
  window.Trk.core.ctx.beginPath();
  window.Trk.core.ctx.moveTo(x0t, STAGE.topY); window.Trk.core.ctx.lineTo(x1t, STAGE.topY); window.Trk.core.ctx.lineTo(x1b, yb); window.Trk.core.ctx.lineTo(x0b, yb); window.Trk.core.ctx.closePath();
}
function drawStageField(now) {
  ensureStageMap();
  const g = window.Trk.core.skin().game, N = stageN(), p = performance.now(), travel = window.Trk.core.travelMs();
  const accent = window.Trk.data.toHex(window.Trk.core.skin().ui["--ui-accent"]), pulse = window.Trk.play.beatPulse(now);
  const topW = stageWidthAt(0), botW = stageWidthAt(1), yb = STAGE.hitY + 60;
  const tl = STAGE.cx - topW / 2, bl = STAGE.cx - botW / 2;
  window.Trk.core.ctx.save();

  /* 床とレーンの暗さ */
  stageQuad(tl, tl + topW, bl, bl + botW, yb); window.Trk.core.ctx.fillStyle = g.lane; window.Trk.core.ctx.fill();
  if (window.Trk.core.settings.stageDim > 0) { window.Trk.core.ctx.fillStyle = `rgba(0,0,0,${window.Trk.core.settings.stageDim})`; window.Trk.core.ctx.fill(); }

  /* キービーム */
  if (window.Trk.core.settings.stageBeam) {
    for (let l = 0; l < N; l++) {
      const age = p - stagePress[l]; if (age > 180) continue;
      const a = Math.min(.9, .5 * window.Trk.core.gameplayFxPower()) * (1 - age / 180);
      const gr = window.Trk.core.ctx.createLinearGradient(0, STAGE.hitY, 0, STAGE.topY);
      gr.addColorStop(0, window.Trk.data.hexToRgba(accent, a)); gr.addColorStop(1, window.Trk.data.hexToRgba(accent, 0));
      stageQuad(tl + l * topW / N, tl + (l + 1) * topW / N, bl + l * botW / N, bl + (l + 1) * botW / N, STAGE.hitY);
      window.Trk.core.ctx.fillStyle = gr; window.Trk.core.ctx.fill();
    }
  }

  /* 区切り線（盛り上がる場面では光る） */
  const hype = window.Trk.core.settings.stageHype && stageMap.len && stageMap.hype[Math.min(window.Trk.core.nextIdx, stageMap.len - 1)];
  for (let l = 0; l <= N; l++) {
    const edge = l === 0 || l === N;
    if (!edge && !window.Trk.core.settings.stageGuides && !hype) continue;
    window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.moveTo(tl + l * topW / N, STAGE.topY); window.Trk.core.ctx.lineTo(bl + l * botW / N, yb);
    if (hype && !edge) {
      window.Trk.core.ctx.shadowColor = accent; window.Trk.core.ctx.shadowBlur = 14 * window.Trk.core.gameplayFxPower();
      window.Trk.core.ctx.strokeStyle = window.Trk.data.hexToRgba(accent, .55 + .35 * pulse); window.Trk.core.ctx.lineWidth = 3;
    } else { window.Trk.core.ctx.strokeStyle = g.track; window.Trk.core.ctx.lineWidth = 2; window.Trk.core.ctx.globalAlpha = edge ? .9 : .45; }
    window.Trk.core.ctx.stroke(); window.Trk.core.ctx.shadowBlur = 0; window.Trk.core.ctx.globalAlpha = 1;
  }

  /* 小節線 */
  if (window.Trk.core.chartMeta.bpm) {
    const m = 240000 / window.Trk.core.chartMeta.bpm;
    window.Trk.core.ctx.fillStyle = g.track; window.Trk.core.ctx.globalAlpha = .5;
    for (let k = Math.ceil((now - window.Trk.core.chartMeta.offset) / m); ; k++) {
      const u = window.Trk.core.chartMeta.offset + k * m - now; if (u > travel) break;
      const q = 1 - u / travel, w = stageWidthAt(q);
      window.Trk.core.ctx.fillRect(STAGE.cx - w / 2, stageY(q) - 1, w, 2);
    }
    window.Trk.core.ctx.globalAlpha = 1;
  }

  /* 判定ライン */
  window.Trk.core.ctx.shadowColor = accent; window.Trk.core.ctx.shadowBlur = 18 * window.Trk.core.gameplayFxPower();
  window.Trk.core.ctx.fillStyle = g.ink; window.Trk.core.ctx.globalAlpha = .75 + .25 * pulse;
  window.Trk.play.rr(bl - 8, STAGE.hitY - 5, botW + 16, 10, 5); window.Trk.core.ctx.fill();
  window.Trk.core.ctx.shadowBlur = 0; window.Trk.core.ctx.globalAlpha = 1;

  /* ノーツ（奥のものから） */
  let end = window.Trk.core.nextIdx;
  while (end < window.Trk.core.chart.length && window.Trk.core.chart[end].time - now <= travel) end++;
  for (let i = end - 1; i >= window.Trk.core.nextIdx; i--) {
    const n = window.Trk.core.chart[i]; if (n.judged) continue;
    const u = n.time - now, a = window.Trk.play.noteAlpha(u); if (a <= 0) continue;
    const q = 1 - u / travel, w = stageWidthAt(q), lw = w / N, span = 1 + stageMap.wide[i];
    const x = stageLaneX(stageMap.lanes[i] + (span - 1) / 2, q), y = stageY(q);
    const sc = w / botW, nw = lw * span * .9 - lw * .04, nh = Math.max(4, 26 * window.Trk.core.settings.stageThick * sc);
    const c = window.Trk.core.settings.stageLaneColor ? window.Trk.core.laneColor(n.lane) : accent;
    window.Trk.core.ctx.globalAlpha = a;
    if (g.glow || span > 1) { window.Trk.core.ctx.shadowColor = c; window.Trk.core.ctx.shadowBlur = (span > 1 ? 22 : 18) * sc; }
    window.Trk.play.rr(x - nw / 2, y - nh / 2, nw, nh, nh / 2); window.Trk.core.ctx.fillStyle = c; window.Trk.core.ctx.fill(); window.Trk.core.ctx.shadowBlur = 0;
    window.Trk.core.ctx.lineWidth = Math.max(1.5, (span > 1 ? 4 : 3) * sc); window.Trk.core.ctx.strokeStyle = g.noteBorder; window.Trk.core.ctx.stroke();
    window.Trk.core.ctx.globalAlpha = a * .55; window.Trk.core.ctx.fillStyle = "#fff";
    window.Trk.play.rr(x - nw * .32, y - nh * .22, nw * .64, Math.max(1.5, nh * .18), nh * .1); window.Trk.core.ctx.fill();
    window.Trk.core.ctx.globalAlpha = 1;
  }

  /* キー表示 */
  if (!window.Trk.core.settings.hideGameplayUI && !window.Trk.core.settings.autoPlay) {
    window.Trk.core.ctx.font = `800 20px ${window.Trk.core.fontFamily()}`; window.Trk.core.ctx.textAlign = "center"; window.Trk.core.ctx.textBaseline = "middle";
    stageKeys().forEach((k, l) => {
      window.Trk.core.ctx.fillStyle = p - stagePress[l] < 90 ? accent : g.ink;
      window.Trk.core.ctx.fillText(window.Trk.core.formatKey(k), stageLaneX(l, 1), STAGE.hitY + 34);
    });
  }
  window.Trk.core.ctx.restore();
}

/* ============ 入力（キー：main.js より先／タッチ：レーンを直接タップ、複数指OK） ============ */
let stageBinding = null;
addEventListener("keydown", e => {
  if (window.Trk.overlay.any()) return;
  if (stageBinding !== null) { e.preventDefault(); e.stopImmediatePropagation(); captureStageKey(e.code); return; }
  if (window.Trk.core.phase !== "playing" || !isStage() || window.Trk.core.bindingSlot !== null || window.Trk.core.settings.autoPlay) return;
  const i = stageKeys().indexOf(e.code); if (i < 0) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (!e.repeat) stageInput(i, e.timeStamp);
}, true);
window.Trk.core.stage.addEventListener("pointerdown", e => {
  if (window.Trk.core.phase !== "playing" || !isStage() || window.Trk.core.settings.autoPlay) return;
  if (e.target.closest("#controls, #seekBar")) return;
  e.preventDefault(); e.stopPropagation();
  const r = window.Trk.core.stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * window.Trk.data.W;
  const bw = stageBottomW(), N = stageN(), l = Math.floor((x - (STAGE.cx - bw / 2)) / (bw / N));
  if (l >= -1 && l <= N) stageInput(Math.max(0, Math.min(N - 1, l)), e.timeStamp);
}, true);
window.Trk.core.on("chart", () => { stageMap.src = null; });

/* ============ 設定画面：見た目と譜面（「マスコット」の見出しの上） ============ */
let stageRangeSeq = 0;
function makeRange(key, label, min, max, step) {
  const row = window.Trk.core.el("div", "inline"), lab = window.Trk.core.el("span", "", tr(label)), inp = document.createElement("input"), val = window.Trk.core.el("span", "mono");
  lab.dataset.i18n = label; inp.type = "range"; inp.min = min; inp.max = max; inp.step = step;
  lab.id = "stageRangeLab" + (++stageRangeSeq); inp.setAttribute("aria-labelledby", lab.id);
  const sync = () => { inp.value = window.Trk.core.settings[key]; val.textContent = Math.round(window.Trk.core.settings[key] * 100) + "%"; };
  inp.addEventListener("input", () => { window.Trk.core.settings[key] = Number(inp.value); window.Trk.core.saveUserPrefs(); sync(); });
  sync(); row.append(lab, inp, val);
  return row;
}
(() => {
  const anchor = window.Trk.core.$("stageSettingsAnchor") || document.querySelector('#settingsScreen [data-i18n="mascotSel"]'); if (!anchor) return;
  const h3 = window.Trk.core.el("h3", "", tr("stageViewTitle")); h3.dataset.i18n = "stageViewTitle";
  const reset = () => { stageMap.src = null; };
  const lanes = makeSeg("stageLanesPicker", "stageLanes", [["4", "stageLanes4"], ["5", "stageLanes5"], ["6", "stageLanes6"]]);
  lanes.addEventListener("click", () => { reset(); stageBinding = null; syncStageKeyUI(); });
  const pattern = makeSeg("stagePatternPicker", "stagePattern", [["auto", "stagePatternAuto"], ["calm", "stagePatternCalm"], ["tech", "stagePatternTech"]]);
  pattern.addEventListener("click", reset);
  const random = makeSeg("stageRandomPicker", "stageRandom", [["off", "stageRandomOff"], ["random", "stageRandomRan"], ["anti", "stageRandomAnti"]]);
  random.addEventListener("click", () => { reset(); window.Trk.core.emit("options"); });
  const mirror = makeCheck("stageMirror", "stageMirror", "stageMirror");
  const hypeCk = makeCheck("stageHype", "stageHype", "stageHype");
  for (const c of [mirror, hypeCk]) c.querySelector("input").addEventListener("change", reset);
  anchor.before(
    h3, hintEl("stageLanesLabel"), lanes, hintEl("stagePatternLabel"), pattern,
    hintEl("stageRandomLabel"), random, hintEl("stageRandomHint"),
    makeRange("stageWidth", "stageWidth", .6, 1.4, .05),
    makeRange("stageThick", "stageThick", .6, 1.6, .05),
    makeRange("stageDim", "stageDim", 0, .9, .05),
    makeCheck("stageAdjacent", "stageAdjacent", "stageAdjacent"),
    mirror,
    makeCheck("stageLaneColor", "stageLaneColor", "stageLaneColor"),
    makeCheck("stageBeam", "stageBeam", "stageBeam"),
    makeCheck("stageGuides", "stageGuides", "stageGuides"),
    hypeCk,
    makeCheck("perfectStar", "perfectStar", "perfectStar"),
    hintEl("stageViewHint")
  );
})();

/* ============ 設定画面：キー（「⌨ 操作」のトラック設定の下） ============ */
let syncStageKeyUI = () => {};
(() => {
  const anchor = document.querySelector('#settingsScreen [data-i18n="truckCtlHint"]'); if (!anchor) return;
  const h3 = window.Trk.core.el("h3", "", tr("stageKeysTitle")); h3.dataset.i18n = "stageKeysTitle";
  const rows = window.Trk.core.el("div", "keyRows"); rows.style.marginTop = "10px";
  const reset = window.Trk.core.el("button", "", tr("stageKeyReset")); reset.type = "button"; reset.dataset.i18n = "stageKeyReset";
  reset.style.cssText = "margin-top:8px;padding:7px 12px;font-size:14px";
  const status = window.Trk.core.el("div", "hint status"); status.id = "stageBindStatus";
  anchor.after(h3, rows, reset, status);
  syncStageKeyUI = () => {
    rows.textContent = "";
    stageKeys().forEach((k, i) => {
      const row = window.Trk.core.el("div", "keyRow"), b = window.Trk.core.el("button", "", tr("assign"));
      b.type = "button"; b.classList.toggle("listening", stageBinding === i);
      b.addEventListener("click", () => {
        window.Trk.core.bindingSlot = null; window.Trk.core.updateKeyUI(); stageBinding = i; b.blur();
        window.Trk.core.setStatus("stageBindStatus", "stageCapture", { n:i + 1 }); syncStageKeyUI();
      });
      row.append(window.Trk.core.el("strong", "", tr("stageLaneN", { n:i + 1 })), window.Trk.core.el("span", "keyValue", window.Trk.core.formatKey(k)), b);
      rows.append(row);
    });
  };
  reset.addEventListener("click", () => {
    window.Trk.core.settings["stageKeys" + window.Trk.core.settings.stageLanes] = STAGE_DEFAULT_KEYS[window.Trk.core.settings.stageLanes].slice();
    stageBinding = null; window.Trk.core.saveUserPrefs(); syncStageKeyUI(); window.Trk.core.setStatus("stageBindStatus", "stageAssigned");
  });
  window.Trk.core.on("language", syncStageKeyUI);
  syncStageKeyUI();
})();
function captureStageKey(code) {
  const i = stageBinding;
  if (code === "Escape") { stageBinding = null; window.Trk.core.setStatus("stageBindStatus", "cancelBind"); syncStageKeyUI(); return; }
  if (RESERVED.has(code) || (window.Trk.core.settings.speedKeys || []).includes(code) || code === "KeyR") { window.Trk.core.setStatus("stageBindStatus", "reservedKey"); return; }
  const keys = stageKeys();
  if (keys.some((k, j) => k === code && j !== i)) { window.Trk.core.setStatus("stageBindStatus", "duplicateKey"); return; }
  keys[i] = code; stageBinding = null; window.Trk.core.saveUserPrefs();
  window.Trk.core.setStatus("stageBindStatus", "stageAssigned"); syncStageKeyUI();
}
/* ✅ stage.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.STAGE = STAGE;
window.drawStageField = drawStageField;
window.ensureStageMap = ensureStageMap;
window.isStage = isStage;
window.resetStage = resetStage;
Object.defineProperty(window, "stageBinding", { configurable:true, get:() => stageBinding, set:v => { stageBinding = v; } });
window.stageHitPos = stageHitPos;
window.stageInput = stageInput;
window.stageKeys = stageKeys;
window.stageMap = stageMap;
window.stagePress = stagePress;
})();
