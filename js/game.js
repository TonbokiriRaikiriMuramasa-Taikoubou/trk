(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：ゲーム進行・判定・時計・プレイ記録 ============
   対応：カウントダウン・MOD・MANUAL／TRUCK／ORBIT／STAGE／CATCH・AUTO（全モードと組み合わせ）
         体力・速度別記録・PERFECT✦・判定の平均とばらつき（extras.js が表示）
   再生速度：1.00x＝通常のハイスコア／1.05x以上＝速度ごとに別記録＋🏁最高クリア速度／1.00x未満＝練習扱い */
"use strict";

/* ---------- 記録の対象外 ---------- */
const rateKey = () => window.Trk.core.settings.rate !== 1 ? window.Trk.core.settings.rate.toFixed(2) : null;
const rateUnranked = () => window.Trk.core.modsUnranked();                                   // ゆるめ判定・1.00x未満
const runUnranked = () => window.Trk.core.practice || rateUnranked() || !!window.Trk.core.settings.autoPlay;  // AUTOも記録・称号の対象外

/* ---------- カウントダウン（3・2・1・GO!） ---------- */
let leadIn = null, goAt = 0, pausedInLeadIn = false, autoplayBlocked = false;
function countIv() {
  const b = (window.Trk.core.chartMeta.bpm || 0) * window.Trk.core.settings.rate;
  return b ? Math.min(1000, Math.max(350, 60000 / b)) : 750;
}
function countTick(k) {
  if (!window.Trk.core.settings.countdownSE) return;
  const ac = window.Trk.media.getAC(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), go = k >= 3;
  o.type = "square"; o.frequency.value = go ? 1320 : 880;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.002, window.Trk.core.settings.seVolume * .5), t + .005);
  g.gain.exponentialRampToValueAtTime(.0001, t + (go ? .25 : .09));
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .3);
}
function beginLeadIn(resume) {
  const iv = countIv(), p = performance.now();
  leadIn = { start:p, end:p + 3 * iv, iv, resume, last:-1 };
  window.Trk.core.clock = resume ? { t:window.Trk.core.video.currentTime * 1000, perf:p, lastCt:-1 }
                 : { t:-3 * iv * window.Trk.core.settings.rate, perf:p, lastCt:-1 };
}
function finishLeadIn() {
  const was = leadIn; leadIn = null; goAt = performance.now();
  countTick(3);
  window.Trk.core.clock = { t:was.resume ? window.Trk.core.video.currentTime * 1000 : 0, perf:goAt, lastCt:-1 };
  window.Trk.core.video.playbackRate = window.Trk.core.settings.rate;
  window.Trk.core.video.play().catch(() => { autoplayBlocked = true; pauseGame(); });
}

/* ---------- 🕹️ ショートプレイ（長い曲の後半だけ遊ぶ。クリア判定は通常どおり出す） ---------- */
const SHORT_LENS = { "90": 90, "120": 120, "180": 180 };
let runShort = 0, runNoteTotal = 0, shortAn = null, shortSilenceSince = 0;
function shortLenActive() {   /* AUTOのときはフルプレイ（AUTOはseed探しなので） */
  return !window.Trk.core.settings.autoPlay && SHORT_LENS[window.Trk.core.settings.shortMode] ? SHORT_LENS[window.Trk.core.settings.shortMode] : 0;
}
function shortStart(len) {   /* 後半◯秒の開始位置（曲が短ければ頭から） */
  const d = isFinite(window.Trk.core.video.duration) ? window.Trk.core.video.duration : len;
  return Math.max(0, Math.min(d - len, d));
}
function shortSilenceWatch() {   /* 終盤の無音を検知したらそこで終了（8秒くらい余白のある曲がある） */
  if (!runShort || window.Trk.core.phase !== "playing" || !isFinite(window.Trk.core.video.duration)) return;
  if (window.Trk.core.video.duration - window.Trk.core.video.currentTime > 14) { shortSilenceSince = 0; return; }   /* 見るのは終盤だけ */
  if (!shortAn && window.TrkFX && TrkFX.tap) shortAn = TrkFX.tap(512);   /* 1回だけ作って使い回す（fxが無効なら検知なし） */
  if (!shortAn) return;
  const buf = new Uint8Array(shortAn.frequencyBinCount);
  shortAn.getByteFrequencyData(buf);
  let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i];
  if (sum > buf.length * 4) { shortSilenceSince = 0; return; }   /* 音がある */
  const now = performance.now();
  if (!shortSilenceSince) { shortSilenceSince = now; return; }
  if (now - shortSilenceSince > 2200 && window.Trk.core.video.currentTime > 10) {   /* 2.2秒ずっと無音＝曲の終わり */
    shortSilenceSince = 0;
    window.Trk.core.video.pause();
    endGame(false);
  }
}
function shortCleanup() { if (shortAn) { try { shortAn.disconnect(); } catch (_) {} shortAn = null; } shortSilenceSince = 0; }

/* ---------- 進行 ---------- */
function resetRun() {
  const rand = window.Trk.core.settings.modRandom ? window.Trk.core.mulberry32(window.Trk.core.hashString(`trkRand|${window.Trk.core.$("seed")?.value || 0}|${window.Trk.core.chartDiff}|${window.Trk.core.chart.length}`)) : null;
  window.Trk.core.chart.forEach(n => {
    n.judged = false; n.result = null;
    if (n.origLane == null) n.origLane = n.lane;
    let l = n.origLane;
    if (window.Trk.core.settings.modMirror) l = 1 - l;
    if (window.Trk.core.settings.modRandom && rand) l = rand() < 0.5 ? 0 : 1;
    n.lane = l;
  });
  window.Trk.core.nextIdx = 0;
  runShort = shortLenActive(); runNoteTotal = window.Trk.core.chart.length; shortCleanup();
  if (runShort) {   /* 🕹️ 窓より前のノーツはスキップ（スコアの分母にも入れない） */
    const st = shortStart(runShort) * 1000 - window.Trk.core.settings.latency;
    while (window.Trk.core.nextIdx < window.Trk.core.chart.length && window.Trk.core.chart[window.Trk.core.nextIdx].time < st) { window.Trk.core.chart[window.Trk.core.nextIdx].judged = true; window.Trk.core.chart[window.Trk.core.nextIdx].result = "skip"; window.Trk.core.nextIdx++; }
    runNoteTotal = window.Trk.core.chart.length - window.Trk.core.nextIdx;
  }
  window.Trk.core.stats = { perfect:0, good:0, miss:0, combo:0, maxCombo:0, star:0, fast:0, slow:0, goodFast:0, goodSlow:0, crash:0, errN:0, errSum:0, errSq:0, blastBonus:0 };
  window.Trk.core.practice = false; window.Trk.core.effects = []; window.Trk.core.errors = []; window.Trk.core.caption = null; window.Trk.core.lastMissT = -1e9;
  leadIn = null; goAt = 0; pausedInLeadIn = false; autoplayBlocked = false;
  resetTruck(); resetLives(); resetOrbit();
  if (window.Trk.core.settings.autoPlay) { lifeState.max = 0; lifeState.hp = 0; }   // AUTOには体力はありません
  if (typeof resetStage === "function") resetStage();
  if (typeof resetCatch === "function") resetCatch();
  updateHud();
}
async function startGame() {
  if (!window.Trk.core.videoReady || !window.Trk.core.chart.length) return;
  window.Trk.core.emit("beforePlay");
  const ac = window.Trk.media.getAC(); if (ac && ac.state === "suspended") ac.resume();
  if (window.Trk.core.phase === "playing" || window.Trk.core.phase === "paused") window.Trk.core.video.pause();
  resetRun();
  window.Trk.core.video.playbackRate = window.Trk.core.settings.rate;
  try { window.Trk.core.video.currentTime = runShort ? shortStart(runShort) : 0; } catch (_) {}
  if (document.activeElement) document.activeElement.blur();
  window.Trk.core.$("endScreen").querySelector("h2").textContent = tr("finished");
  if (window.Trk.core.settings.countdown) {
    window.Trk.core.video.volume = 0;
    try { await window.Trk.core.video.play(); window.Trk.core.video.pause(); } catch (_) {}
    try { window.Trk.core.video.currentTime = runShort ? shortStart(runShort) : 0; } catch (_) {}
    window.Trk.core.video.volume = window.Trk.core.settings.musicVolume;
    window.Trk.core.showScreen(null); window.Trk.core.setPhase("playing");
    beginLeadIn(false);
    if (typeof poke === "function") poke();
    setCaption("capStart", null, 0);
    return;
  }
  window.Trk.core.video.volume = window.Trk.core.settings.musicVolume;
  window.Trk.core.clock = { t:0, perf:performance.now(), lastCt:-1 };
  window.Trk.core.showScreen(null); window.Trk.core.setPhase("playing");
  if (typeof poke === "function") poke();
  try { await window.Trk.core.video.play(); }
  catch (_) { window.Trk.core.setPhase("title"); window.Trk.core.showScreen("selectScreen"); window.Trk.core.setStatus("loadStatus", "playError"); return; }
  setCaption("capStart", null, 0);
}
function pauseGame() {
  if (window.Trk.core.phase !== "playing") return;
  pausedInLeadIn = !!(leadIn && !leadIn.resume);
  leadIn = null;
  window.Trk.core.setPhase("paused"); window.Trk.core.video.pause(); window.Trk.core.setStatus("pauseStatus", null); window.Trk.core.showScreen("pauseScreen");
}
async function resumeGame() {
  if (window.Trk.core.phase !== "paused") return;
  window.Trk.core.showScreen(null); window.Trk.core.setPhase("playing");
  if (typeof poke === "function") poke();
  if (pausedInLeadIn) { pausedInLeadIn = false; beginLeadIn(false); return; }
  if (window.Trk.core.settings.resumeCountdown && !autoplayBlocked) { beginLeadIn(true); return; }
  autoplayBlocked = false;
  window.Trk.core.video.playbackRate = window.Trk.core.settings.rate;
  try { await window.Trk.core.video.play(); } catch (_) { pauseGame(); }
}
function toTitle() {
  leadIn = null; pausedInLeadIn = false;
  window.Trk.core.video.pause();
  window.Trk.core.video.playbackRate = 1;
  try { window.Trk.core.video.currentTime = 0; } catch (_) {}
  window.Trk.core.setPhase("title");
  window.Trk.core.showScreen("selectScreen"); window.Trk.core.renderAllStatuses();
}
function failGame() {
  if (window.Trk.core.phase !== "playing") return;
  leadIn = null;
  window.Trk.core.video.pause();
  failSound();
  endGame(true);
}

/* ---------- スコア ---------- */
function currentScore() { const total = runNoteTotal || window.Trk.core.chart.length || 1, points = window.Trk.core.stats.perfect + window.Trk.core.stats.good * .5, bonus = (window.Trk.core.stats.blastBonus || 0) * .1; return Math.min(1e6, Math.round(1e6 * (points + bonus) / total)); }   /* 🕹️ ショートは窓内のノーツ数で割る */
function currentAcc() { const j = window.Trk.core.stats.perfect + window.Trk.core.stats.good + window.Trk.core.stats.miss; return j ? (window.Trk.core.stats.perfect + window.Trk.core.stats.good * .5) / j * 100 : 100; }
function updateHud() {
  window.Trk.core.$("scoreVal").textContent = currentScore().toLocaleString();
  window.Trk.core.$("comboVal").textContent = window.Trk.core.stats.combo;
  window.Trk.core.$("accVal").textContent = currentAcc().toFixed(2) + "%";
}
const MODE_LABEL = { truck:"truckPlay", orbit:"orbitPlay", stage:"stagePlay", catch:"catchPlay" };
const MODE_ICON = { truck:"🚚", orbit:"🪐", stage:"🎪", catch:"🚛" };
const modeLabel = () => tr(MODE_LABEL[window.Trk.core.settings.playMode] || "manualPlay") + (window.Trk.core.settings.autoPlay ? " · " + tr("autoPlay") : "");
const modeIcon = m => MODE_ICON[m] || "";
const runMods = () => [...window.Trk.core.activeMods(), ...lifeTags(),
  ...(window.Trk.core.settings.playMode === "catch" && window.Trk.core.settings.catchNitroBonus && window.Trk.core.stats.blastBonus > 0 ? ["NITRO×1.1"] : []),
  ...(window.Trk.core.settings.playMode === "stage" && window.Trk.core.settings.stageMirror && !window.Trk.core.settings.modMirror ? ["MIRROR"] : []),
  ...(window.Trk.core.settings.playMode === "stage" && window.Trk.core.settings.stageRandom === "random" && !window.Trk.core.settings.modRandom ? ["RANDOM"] : []),
  ...(window.Trk.core.settings.autoPlay ? ["AUTO"] : [])];
const showStar = () => window.Trk.core.settings.perfectStar !== false;

/* ---------- リザルト ---------- */
function endGame(failed = false) {
  if (window.Trk.core.phase !== "playing") return;
  for (const n of window.Trk.core.chart) if (!n.judged) { n.judged = true; n.result = "miss"; window.Trk.core.stats.miss++; }
  shortCleanup();
  window.Trk.core.setPhase("ended");
  window.Trk.core.video.playbackRate = 1;
  const mode = window.Trk.core.settings.playMode, icon = modeIcon(mode);
  const acc = currentAcc(), score = currentScore(), clean = !failed && !(window.Trk.core.stats.crash > 0);   // CATCHでぶつかったらFCなし
  const ap = clean && window.Trk.core.stats.perfect > 0 && window.Trk.core.stats.good === 0 && window.Trk.core.stats.miss === 0;
  const fc = clean && window.Trk.core.stats.miss === 0 && window.Trk.core.stats.perfect + window.Trk.core.stats.good > 0;
  const grade = failed ? "F" : ap ? "SS" : acc >= 95 ? "S" : acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : "D";

  const rec = recordPlay({ score, acc, grade, ap, fc, failed, short: runShort || 0 });
  const shTag = runShort ? ` 🕹️${runShort}s` : "";
  let bestHtml = "";
  if (rec.chart) {
    const star = rec.chart.ap ? ` ${icon}⭐` : "";
    const rk = rateKey() ? ` (${rateKey()}x)` : "";
    if (rec.isNew) bestHtml = `<div class="best new">${window.Trk.core.esc(tr("newBest"))}${rk}${star}${shTag}</div>`;
    else if (rec.prev) bestHtml = `<div class="best">${window.Trk.core.esc(tr("best"))}${rk}${shTag}: ${Number(rec.prev.score).toLocaleString()} · ${Number(rec.prev.acc).toFixed(2)}%${star}</div>`;
    if (rec.newSpeed) bestHtml += `<div class="best new">${window.Trk.core.esc(tr("newSpeed", { r:window.Trk.core.settings.rate.toFixed(2) + "x" }))}</div>`;
    bestHtml += `<div class="best">${window.Trk.core.esc(tr("recPlayCount", { n:rec.plays }))}</div>`;
  }
  const meta = [modeLabel(), tr(window.Trk.core.chartDiff), `${tr("level")}${window.Trk.core.currentLevel} ${tr("estimate")}`];
  if (runShort) meta.push(tr("shortTag", { n: runShort }));   /* 🕹️ 称号はモードを問わずこの絵文字で統一 */
  const mods = runMods();
  if (mods.length) meta.push(`${tr("modsLabel")}: ${mods.join(" ")}`);
  if (failed) meta.push(tr("failedNote"));
  else if (window.Trk.core.settings.autoPlay) {}
  else if (window.Trk.core.practice) meta.push(tr("practice"));
  else if (rateUnranked()) meta.push(tr("unrankedNote"));
  else if (rateKey()) meta.push(tr("rateRecordNote"));
  const apKey = { truck:"truckAllPerfect", orbit:"orbitAllPerfect", stage:"stageAllPerfect", catch:"catchAllPerfect" }[mode] || "allPerfect";
  const fcKey = { truck:"truckFullCombo", orbit:"orbitFullCombo", stage:"stageFullCombo", catch:"catchFullCombo" }[mode] || "fullCombo";
  const badges = failed ? `<span class="badge" style="background:#8a1c2b;color:#fff">${window.Trk.core.esc(tr("failed"))}</span>`
               : window.Trk.core.settings.autoPlay ? `<span class="badge">▶ AUTO</span>`
               : ap ? `<span class="badge">${window.Trk.core.esc(tr(apKey))}</span>`
               : fc ? `<span class="badge">${window.Trk.core.esc(tr(fcKey))}</span>` : "";
  const starHtml = showStar() ? `<small style="display:block;font-size:14px;opacity:.85">${window.Trk.core.esc(tr("starCount", { n:window.Trk.core.stats.star || 0 }))}</small>` : "";
  window.Trk.core.$("endScreen").querySelector("h2").textContent = tr(failed ? "failed" : "finished");
  window.Trk.core.$("result").innerHTML = `
    <div class="gradeRow"><div class="grade" aria-label="${window.Trk.core.esc(tr("grade"))}">${grade}</div>
      <div style="text-align:left"><div class="bigScore">${score.toLocaleString()}</div>
        <div class="hint">${window.Trk.core.esc(meta.join(" · "))}</div><div class="badges">${badges}</div></div></div>
    <div class="statGrid">
      <div><span>${window.Trk.core.esc(tr("accuracy"))}</span><b>${acc.toFixed(2)}%</b></div>
      <div><span>${window.Trk.core.esc(tr("maxCombo"))}</span><b>${window.Trk.core.stats.maxCombo}</b></div>
      <div class="p"><span>${window.Trk.core.esc(tr("perfect"))}</span><b>${window.Trk.core.stats.perfect}</b>${starHtml}</div>
      <div><span>${window.Trk.core.esc(tr("good"))}</span><b>${window.Trk.core.stats.good}</b></div>
      <div class="m"><span>${window.Trk.core.esc(tr("miss"))}</span><b>${window.Trk.core.stats.miss}</b></div>
    </div>
    <div class="fastSlowRow">
      <div class="fsBadge fastBadge"><span class="fsLabel">FAST</span><b class="fsVal">${window.Trk.core.stats.fast || 0}</b>${window.Trk.core.stats.goodFast ? `<small class="fsSub">(${window.Trk.core.esc(tr("good"))} ${window.Trk.core.stats.goodFast})</small>` : ""}</div>
      <div class="fsBadge slowBadge"><span class="fsLabel">SLOW</span><b class="fsVal">${window.Trk.core.stats.slow || 0}</b>${window.Trk.core.stats.goodSlow ? `<small class="fsSub">(${window.Trk.core.esc(tr("good"))} ${window.Trk.core.stats.goodSlow})</small>` : ""}</div>
    </div>${bestHtml}`;

  const cr = window.Trk.core.$("credits"); cr.textContent = "";
  const song = window.Trk.core.currentSong || {};
  cr.append(window.Trk.core.el("div", "", `♪ ${song.title || window.Trk.core.baseName(window.Trk.core.mediaName)}${rec.chart && rec.chart.ap ? ` ${icon}⭐` : ""}`));
  if (song.artist) cr.append(window.Trk.core.el("div", "", `${tr("songBy")}: ${song.artist}`));
  if (song.charter) cr.append(window.Trk.core.el("div", "", `${tr("chartBy")}: ${song.charter}`));
  if (song.license) cr.append(window.Trk.core.el("div", "", `${tr("songLicense")}: ${song.license}`));
  if (song.source !== "pack") cr.append(window.Trk.core.el("div", "", tr("creditNote")));

  window.Trk.core.setStatus("endStatus", null);
  window.Trk.core.showScreen("endScreen");
}

/* ---------- セリフ ---------- */
function setCaption(key, vars, speaker) {
  const m = window.Trk.core.activeMascot(), fam = m ? window.Trk.data.MASCOT_FAMILY[m] : null;
  const pc = (typeof packRuntime !== "undefined" && packRuntime.captions) || null;
  const own = (pc && pc[key]) || (fam && window.Trk.data.MASCOT_CAPTIONS[fam] && window.Trk.data.MASCOT_CAPTIONS[fam][key]) || (window.Trk.core.skin().captions && window.Trk.core.skin().captions[key]);
  let text = own ? (own[lang] || own.en || Object.values(own)[0]) : tr(key);
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  window.Trk.core.caption = { text, speaker, t:performance.now() };
}

/* ---------- 判定 ---------- */
let autoJudging = false;   // AUTOの処理から判定しているときだけ true
function showJudge(kind, delta, star) {
  const n = window.Trk.core.$("judge");
  window.Trk.core.$("judgeText").textContent = tr(kind) + (star && showStar() ? "✦" : "");
  const sub = window.Trk.core.$("judgeSub");
  if (kind !== "perfect" && delta != null) {
    const isEarly = delta < 0;
    sub.textContent = tr(isEarly ? "early" : "late");
    sub.className = isEarly ? "early" : "late";
  } else {
    sub.textContent = "";
    sub.className = "";
  }
  n.className = ""; void n.offsetWidth; n.className = `show ${kind}`;
}
function judgeHitPos(n) {
  if (isOrbit()) return orbitHitPos(n);
  if (isStage()) return stageHitPos(n);
  if (typeof isCatch === "function" && isCatch()) return catchHitPos(n);
  return hitPos(layout(), n.lane);
}
function judgeNote(n, kind, delta) {
  if (window.Trk.core.phase !== "playing") return;
  if (window.Trk.core.settings.autoPlay && !autoJudging && kind !== "miss") return;   // AUTO中は、キー・タップでは判定しない
  n.judged = true; n.result = kind;
  const star = kind === "perfect" && delta != null && Math.abs(delta) <= window.Trk.core.windows().perfect * .5;   // PERFECT✦
  if (kind === "miss") {
    window.Trk.core.stats.miss++;
    window.Trk.core.lastMissT = performance.now();
    if (window.Trk.core.stats.combo >= 20) setCaption("capBreak", null, 0);
    window.Trk.core.stats.combo = 0;
  } else {
    window.Trk.core.stats[kind]++; window.Trk.core.stats.combo++; window.Trk.core.stats.maxCombo = Math.max(window.Trk.core.stats.maxCombo, window.Trk.core.stats.combo);
    if (star) window.Trk.core.stats.star++;
    if (delta != null) {
      if (delta < -3) window.Trk.core.stats.fast = (window.Trk.core.stats.fast || 0) + 1;
      else if (delta > 3) window.Trk.core.stats.slow = (window.Trk.core.stats.slow || 0) + 1;
      if (kind === "good") {
        if (delta < 0) window.Trk.core.stats.goodFast = (window.Trk.core.stats.goodFast || 0) + 1;
        else window.Trk.core.stats.goodSlow = (window.Trk.core.stats.goodSlow || 0) + 1;
      }
    }
    const hp = judgeHitPos(n);
    window.Trk.core.effects.push({ x:hp.x, y:hp.y, c:window.Trk.core.laneColor(n.lane), t:performance.now(), kind, seed:Math.random() * window.Trk.data.TAU });
    window.Trk.core.avatarHit[n.lane] = performance.now();
    if (window.Trk.core.stats.combo % 50 === 0) setCaption("capCombo", { n:window.Trk.core.stats.combo }, 1);
    if (delta != null && !window.Trk.core.settings.autoPlay) { window.Trk.core.stats.errN++; window.Trk.core.stats.errSum += delta; window.Trk.core.stats.errSq += delta * delta; }   // 平均とばらつき
  }
  if (delta != null && kind !== "miss" && ["manual", "orbit", "stage"].includes(window.Trk.core.settings.playMode)) {
    window.Trk.core.errors.push({ d:delta, t:performance.now(), kind }); if (window.Trk.core.errors.length > 30) window.Trk.core.errors.shift();
  }
  showJudge(kind, delta, star); updateHud();
  while (window.Trk.core.nextIdx < window.Trk.core.chart.length && window.Trk.core.chart[window.Trk.core.nextIdx].judged) window.Trk.core.nextIdx++;
  if (lifeAfterJudge(kind)) failGame();
}
/* ORBIT：どのキーでも次のノーツ1つだけ（早すぎる連打はMISS） */
function orbitInput(ts) {
  const p = performance.now(), at = (ts > 0 && ts <= p) ? ts : p;
  const now = gameTime(at), w = window.Trk.core.windows(), n = window.Trk.core.chart[window.Trk.core.nextIdx];
  window.Trk.core.pressH = { lane:0, t:p };
  if (!n) return;
  const d = now - n.time;
  if (d < -w.good * 2) return;
  window.Trk.media.playSE(n.lane);
  if (d < -w.good) { judgeNote(n, "miss", d); return; }
  judgeNote(n, Math.abs(d) <= w.perfect ? "perfect" : "good", d);
}
function handleInput(lane, ts) {
  if (window.Trk.core.phase !== "playing" || window.Trk.core.settings.autoPlay) return;            // AUTO中は見るだけ
  const mode = window.Trk.core.settings.playMode;
  if (mode === "stage" || mode === "catch") return;                 // stage.js・catch.js が受け取る
  if (mode === "orbit") { orbitInput(ts); return; }
  if (mode === "truck") { steerTruck(lane); return; }
  const p = performance.now(), at = (ts > 0 && ts <= p) ? ts : p;
  const now = gameTime(at);
  window.Trk.media.playSE(lane);
  window.Trk.core.pressFlash[window.Trk.core.laneCol(lane)] = p; window.Trk.core.pressH = { lane, t:p };
  const w = window.Trk.core.windows();
  for (let i = window.Trk.core.nextIdx; i < window.Trk.core.chart.length; i++) {
    const n = window.Trk.core.chart[i]; if (n.judged) continue;
    const d = now - n.time;
    if (d < -w.good) break;
    if (Math.abs(d) <= w.good) {
      if (n.lane !== lane) judgeNote(n, "miss", d);
      else judgeNote(n, Math.abs(d) <= w.perfect ? "perfect" : "good", d);
      return;
    }
  }
}
/* AUTO：どのモードでも、ちょうどのタイミングでPERFECT。モードに合わせて光らせる */
function autoVisual(n, i, p) {
  if (isStage() && typeof stagePress !== "undefined") {
    ensureStageMap();
    const l = stageMap.lanes[i]; stagePress[l] = p; if (stageMap.wide[i]) stagePress[l + 1] = p;
  } else if (!isOrbit()) window.Trk.core.pressFlash[window.Trk.core.laneCol(n.lane)] = p;
  window.Trk.core.pressH = { lane:n.lane, t:p };
}
function autoPlay(now) {
  autoJudging = true;
  for (let i = window.Trk.core.nextIdx; i < window.Trk.core.chart.length; i++) {
    if (window.Trk.core.phase !== "playing") break;
    const n = window.Trk.core.chart[i]; if (n.time > now) break;
    if (!n.judged) { judgeNote(n, "perfect", 0); window.Trk.media.playSE(n.lane); autoVisual(n, i, performance.now()); }
  }
  autoJudging = false;
  const nx = window.Trk.core.chart[window.Trk.core.nextIdx];                                       // TRUCKは次のノーツのレーンへ先回り
  if (nx && isTruck() && typeof truckState !== "undefined") truckState.lane = nx.lane;
}
function sweepMisses(now) {
  if (window.Trk.core.settings.autoPlay && window.Trk.core.phase === "playing") autoPlay(now);     // AUTOはMISS判定の前に自動で判定
  const w = window.Trk.core.windows();
  for (let i = window.Trk.core.nextIdx; i < window.Trk.core.chart.length; i++) {
    if (window.Trk.core.phase !== "playing") return;
    const n = window.Trk.core.chart[i]; if (n.time > now - w.good) break;
    if (!n.judged) judgeNote(n, "miss", null);
  }
}
function seekTo(sec) {
  window.Trk.core.practice = true;
  if (leadIn) { leadIn = null; if (window.Trk.core.phase === "playing") window.Trk.core.video.play().catch(() => {}); }
  try { window.Trk.core.video.currentTime = sec; } catch (_) { return; }
  window.Trk.core.clock = { t:sec * 1000, perf:performance.now(), lastCt:-1 };
  const t = sec * 1000 - window.Trk.core.settings.latency;
  for (const n of window.Trk.core.chart) {
    if (n.time < t) { if (!n.judged) { n.judged = true; n.result = "skip"; } }
    else { n.judged = false; n.result = null; }
  }
  window.Trk.core.stats.combo = 0; window.Trk.core.nextIdx = 0;
  while (window.Trk.core.nextIdx < window.Trk.core.chart.length && window.Trk.core.chart[window.Trk.core.nextIdx].judged) window.Trk.core.nextIdx++;
  updateHud();
}

/* ---------- 時計 ---------- */
function tickClock() {
  if (runShort && !leadIn) shortSilenceWatch();   /* 🕹️ 終盤の無音検知 */
  const p = performance.now();
  if (leadIn && window.Trk.core.phase === "playing") {
    if (leadIn.resume) window.Trk.core.clock = { t:window.Trk.core.video.currentTime * 1000, perf:p, lastCt:-1 };
    else { window.Trk.core.clock.t = -(leadIn.end - p) * window.Trk.core.settings.rate; window.Trk.core.clock.perf = p; }
    const k = Math.floor((p - leadIn.start) / leadIn.iv);
    if (k !== leadIn.last && k < 3) { leadIn.last = k; countTick(k); }
    if (p >= leadIn.end) finishLeadIn();
    return;
  }
  const ct = window.Trk.core.video.currentTime * 1000;
  if (window.Trk.core.video.paused || window.Trk.core.video.seeking || window.Trk.core.phase !== "playing") { window.Trk.core.clock = { t:ct, perf:p, lastCt:ct }; return; }
  let t = window.Trk.core.clock.t + (p - window.Trk.core.clock.perf) * (window.Trk.core.video.playbackRate || 1);
  if (ct !== window.Trk.core.clock.lastCt) {
    const diff = ct - t;
    if (Math.abs(diff) > 80) t = ct; else t += diff * .2;
    window.Trk.core.clock.lastCt = ct;
  }
  window.Trk.core.clock.t = t; window.Trk.core.clock.perf = p;
}
function gameTime(at = performance.now()) {
  let base;
  if (window.Trk.core.phase === "playing" && leadIn) base = leadIn.resume ? window.Trk.core.clock.t : window.Trk.core.clock.t + (at - window.Trk.core.clock.perf) * window.Trk.core.settings.rate;
  else base = (window.Trk.core.phase === "playing" && !window.Trk.core.video.paused) ? window.Trk.core.clock.t + (at - window.Trk.core.clock.perf) * (window.Trk.core.video.playbackRate || 1) : window.Trk.core.clock.t;
  return base - window.Trk.core.settings.latency;
}

/* ============ プレイ記録 ============
   MANUAL・TRUCK・ORBIT・STAGE・CATCH は別々。1.05x以上は slot.rates["1.25"] のように速度ごと。
   slot.maxRate＝🏁最高クリア速度。AUTO・練習・練習扱い・FAILEDはハイスコア対象外。 */
const REC_KEY = "shadow_taiko_records_v1", HIST_MAX = 30;
let records = {};
try { records = JSON.parse(localStorage.getItem(REC_KEY)) || {}; } catch (_) { records = {}; }
if (!records || typeof records !== "object" || Array.isArray(records)) records = {};
function saveRecords() { try { localStorage.setItem(REC_KEY, JSON.stringify(records)); } catch (_) {} }
const chartKeyOf = () => window.Trk.core.hashString(window.Trk.core.chart.map(n => n.time + ":" + n.lane).join(",")).toString(36);
const MODE_PLAYS = { truck:"truckPlays", orbit:"orbitPlays", stage:"stagePlays", catch:"catchPlays" };
const PLAY_KEYS = ["plays", "truckPlays", "orbitPlays", "stagePlays", "catchPlays"];
function songRec(create) {
  if (!window.Trk.core.fingerprint) return null;
  if (!records[window.Trk.core.fingerprint] && create) {
    records[window.Trk.core.fingerprint] = { title:window.Trk.core.baseName(window.Trk.core.mediaName), size:Number(window.Trk.core.fingerprint.split(":")[0]) || 0,
      plays:0, truckPlays:0, orbitPlays:0, stagePlays:0, catchPlays:0, perfectTotal:0, lastPlayed:0, charts:{}, history:[] };
  }
  return records[window.Trk.core.fingerprint] || null;
}
const newSlot = () => ({ plays:0, best:null, ap:false, fc:false, bestPerfect:0 });
function recordPlay(r) {
  const s = songRec(true); if (!s) return {};
  const mode = window.Trk.core.settings.playMode, auto = !!window.Trk.core.settings.autoPlay;
  const unranked = runUnranked() || !!r.failed;
  const ck = chartKeyOf(), rk = rateKey();
  const c = s.charts[ck] || (s.charts[ck] = { diff:window.Trk.core.chartDiff, level:window.Trk.core.currentLevel, ...(window.Trk.core.chartMode === "generated" ? { gen:String(window.Trk.core.settings.chartGen) } : {}), ...newSlot() });
  c.diff = window.Trk.core.chartDiff; c.level = window.Trk.core.currentLevel;
  const base = MODE_PLAYS[mode] ? (c[mode] ||= newSlot()) : c;
  let slot = rk && window.Trk.core.settings.rate > 1 ? ((base.rates ||= {})[rk] ||= newSlot()) : base;
  if (r.short) slot = ((c.short ||= {})[r.short] ||= newSlot());   /* 🕹️ ショートプレイは独立の記録に */
  const entry = { t:Date.now(), diff:window.Trk.core.chartDiff, score:r.score, acc:+r.acc.toFixed(2), grade:r.grade,
    perfect:window.Trk.core.stats.perfect, star:window.Trk.core.stats.star || 0, good:window.Trk.core.stats.good, miss:window.Trk.core.stats.miss, crash:window.Trk.core.stats.crash || 0, maxCombo:window.Trk.core.stats.maxCombo,
    mode, auto, short:r.short || 0, truck:mode === "truck", orbit:mode === "orbit", stage:mode === "stage", catch:mode === "catch",
    failed:!!r.failed, rate:window.Trk.core.settings.rate, practice:window.Trk.core.practice || rateUnranked(), ap:r.ap, fc:r.fc, mods:runMods() };
  s.history.unshift(entry); if (s.history.length > HIST_MAX) s.history.length = HIST_MAX;
  s.lastPlayed = entry.t;
  s.title = window.Trk.core.baseName(window.Trk.core.mediaName) || s.title;
  if (window.Trk.core.currentSong && window.Trk.core.currentSong.title) s.display = window.Trk.core.currentSong.title;
  let out = {};
  if (!auto) {
    slot.plays = (slot.plays || 0) + 1;
    if (r.short) { /* 🕹️ ショートは曲全体のプレイ回数・フルのベストには混ぜない */ }
    else if (MODE_PLAYS[mode]) s[MODE_PLAYS[mode]] = (s[MODE_PLAYS[mode]] || 0) + 1;
    else { s.plays = (s.plays || 0) + 1; s.perfectTotal = (s.perfectTotal || 0) + window.Trk.core.stats.perfect; }
    let prev = slot.best, isNew = false, newSpeed = false;
    if (!prev && mode === "manual" && slot === c) {
      try { const old = (JSON.parse(localStorage.getItem(window.Trk.core.BEST_KEY)) || {})[`${window.Trk.core.fingerprint}|${ck}`]; if (old) prev = c.best = { score:old.score, acc:old.acc, date:old.date }; } catch (_) {}
    }
    if (!unranked) {
      slot.bestPerfect = Math.max(slot.bestPerfect || 0, window.Trk.core.stats.perfect);
      if (r.ap) slot.ap = true;
      if (r.fc) slot.fc = true;
      if (!prev || r.score > prev.score) {
        slot.best = { score:r.score, acc:entry.acc, grade:r.grade, perfect:window.Trk.core.stats.perfect, star:entry.star, good:window.Trk.core.stats.good, miss:window.Trk.core.stats.miss,
          maxCombo:window.Trk.core.stats.maxCombo, date:entry.t, mods:entry.mods, rate:window.Trk.core.settings.rate };
        isNew = true;
      }
      if (!r.short && window.Trk.core.settings.rate > (base.maxRate || 1)) { base.maxRate = window.Trk.core.settings.rate; newSpeed = true; }
    }
    out = { isNew, prev, plays:slot.plays, chart:slot, mode, newSpeed };
  }
  saveRecords(); renderRecords();
  window.Trk.core.emit("records");
  return out;
}
function slotCell(t, icon) {
  return t && t.best ? `${Number(t.best.score).toLocaleString()}${t.ap ? ` ${icon}⭐` : t.fc ? " FC" : ""}` : "—";
}
const SLOT_COLS = [["truck", "🚚", "recTruck"], ["orbit", "🪐", "recOrbit"], ["stage", "🎪", "recStage"], ["catch", "🚛", "recCatch"]];
function renderRecords() {
  const panel = window.Trk.core.$("recPanel"); if (!panel) return;
  panel.hidden = !window.Trk.core.videoReady;
  const sum = window.Trk.core.$("recSummary"), hist = window.Trk.core.$("recHistory");
  sum.textContent = ""; hist.textContent = "";
  if (!window.Trk.core.videoReady) return;
  const s = songRec(false);
  if (!s || !s.history || !s.history.length) { sum.append(window.Trk.core.el("div", "hint", tr("recNone"))); return; }
  const top = window.Trk.core.el("div", "recTop");
  const extra = SLOT_COLS.map(([m, i]) => s[MODE_PLAYS[m]] ? i + s[MODE_PLAYS[m]] : "").filter(Boolean).join(" ");
  const plays = `${s.plays || 0}${extra ? ` (${extra})` : ""}`;
  [[tr("recPlays"), plays], [tr("recPerfTotal"), (s.perfectTotal || 0).toLocaleString()], [tr("recLast"), s.lastPlayed ? window.Trk.core.fmtDate(s.lastPlayed) : "—"]]
    .forEach(([k, v]) => { const d = window.Trk.core.el("div"); d.append(window.Trk.core.el("span", "", k), window.Trk.core.el("b", "", String(v))); top.append(d); });
  sum.append(top);
  const ck = window.Trk.core.chart.length ? chartKeyOf() : "", tbl = window.Trk.core.el("table", "recTable"), head = window.Trk.core.el("tr");
  [tr("recDiff"), tr("recBest"), tr("recAcc"), tr("recBestP"), tr("recCount"), ...SLOT_COLS.map(([, , k]) => tr(k))].forEach(h => head.append(window.Trk.core.el("th", "", h)));
  tbl.append(head);
  const charts = Object.entries(s.charts || {}).sort(([, a], [, b]) => window.Trk.data.DIFF_IDS.indexOf(a.diff) - window.Trk.data.DIFF_IDS.indexOf(b.diff));
  charts.forEach(([key, c]) => {
    const row = window.Trk.core.el("tr", key === ck ? "cur" : ""), badge = c.ap ? " ⭐" : c.fc ? " FC" : "";
    const bestMods = c.best && Array.isArray(c.best.mods) && c.best.mods.length ? ` [${c.best.mods.join(" ")}]` : "";
    row.append(
      window.Trk.core.el("td", "", `${tr(c.diff)} Lv.${c.level}${badge}${c.gen === "1" ? " · " + tr("recOldGen") : ""}`),
      window.Trk.core.el("td", "", c.best ? Number(c.best.score).toLocaleString() + bestMods : "—"),
      window.Trk.core.el("td", "", c.best ? Number(c.best.acc).toFixed(2) + "%" : "—"),
      window.Trk.core.el("td", "", String(c.bestPerfect || 0)),
      window.Trk.core.el("td", "", String(c.plays || 0)),
      ...SLOT_COLS.map(([m, icon]) => window.Trk.core.el("td", "", slotCell(c[m], icon))));
    tbl.append(row);
  });
  sum.append(tbl);
  const lines = [];
  for (const [, c] of charts) {
    for (const [slot, icon] of [[c, "🥁"], ...SLOT_COLS.map(([m, i]) => [c[m], i]), ...Object.entries(c.short || {}).map(([l, sl]) => [sl, `🕹️${l}s`])]) {
      if (!slot) continue;
      const parts = Object.entries(slot.rates || {}).sort((a, b) => +a[0] - +b[0]).filter(([, x]) => x.best)
        .map(([k, x]) => `${k}x ${Number(x.best.score).toLocaleString()}${x.ap ? " ⭐" : x.fc ? " FC" : ""}`);
      if ((slot.maxRate || 1) > 1) parts.push(`🏁${slot.maxRate.toFixed(2)}x`);
      if (parts.length) lines.push(`${tr(c.diff)} ${icon} ${parts.join(" · ")}`);
    }
  }
  if (lines.length) {
    sum.append(window.Trk.core.el("div", "hint status", tr("rateRecLabel")));
    lines.forEach(l => sum.append(window.Trk.core.el("div", "hint", l)));
  }
  sum.append(window.Trk.core.el("div", "hint", tr("recStarHint")));
  for (const h of s.history) {
    const icon = MODE_ICON[h.mode] || "";
    const mark = (h.short ? `🕹️${h.short}s ` : "") + (h.failed ? tr("recFailed") : h.auto ? icon : h.ap ? `${icon}⭐` : h.fc ? `${icon} FC`.trim() : icon);
    const mods = Array.isArray(h.mods) && h.mods.length ? h.mods.filter(m => m !== "AUTO").join(" ") : "";
    const star = h.star ? ` ✦${h.star}` : "", crash = h.crash ? ` 💥${h.crash}` : "";
    const tags = [mark, mods, h.auto ? tr("recAuto") : "", h.practice && !h.failed && !h.auto ? tr("recPractice") : ""].filter(Boolean).join(" · ");
    hist.append(window.Trk.core.el("div", "histRow" + (h.auto || h.failed ? " auto" : ""),
      `${window.Trk.core.fmtDate(h.t)} · ${tr(h.diff)} · ${Number(h.score).toLocaleString()} · ${Number(h.acc).toFixed(2)}% · P${h.perfect}${star}/G${h.good}/M${h.miss}${crash} · ${h.grade}${tags ? " · " + tags : ""}`));
  }
}
window.Trk.core.on("chart", renderRecords);
window.Trk.core.on("language", renderRecords);

/* ---------- 記録のバックアップ・削除 ---------- */
window.Trk.core.$("recExportBtn").addEventListener("click", () => {
  window.Trk.core.downloadJSON({ format:"shadow-taiko-records", version:1, records }, `trk-records-${new Date().toISOString().slice(0, 10)}.json`);
  window.Trk.core.setStatus("recStatus", "recExported");
});
window.Trk.core.$("recImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
  if (!raw || raw.format !== "shadow-taiko-records" || !raw.records || typeof raw.records !== "object") { window.Trk.core.setStatus("recStatus", "recBad"); return; }
  let n = 0;
  for (const [k, v] of Object.entries(raw.records)) {
    if (!/^\d+:\d+$/.test(k) || !v || typeof v !== "object" || !v.charts || typeof v.charts !== "object" || !Array.isArray(v.history)) continue;
    const total = x => PLAY_KEYS.reduce((a, key) => a + (Number(x[key]) || 0), 0);
    if (!records[k] || total(v) >= total(records[k])) { records[k] = v; n++; }
  }
  saveRecords(); renderRecords(); window.Trk.core.emit("records");
  window.Trk.core.setStatus("recStatus", "recImported", { n });
});
window.Trk.core.$("recResetBtn").addEventListener("click", () => {
  if (!window.Trk.core.fingerprint || !records[window.Trk.core.fingerprint] || !confirm(tr("recConfirmReset"))) return;
  delete records[window.Trk.core.fingerprint]; saveRecords(); renderRecords(); window.Trk.core.emit("records");
  window.Trk.core.setStatus("recStatus", "recCleared");
});
/* ✅ game.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.PLAY_KEYS = PLAY_KEYS;
window.autoPlay = autoPlay;
window.chartKeyOf = chartKeyOf;
window.currentAcc = currentAcc;
window.currentScore = currentScore;
window.endGame = endGame;
/* 後から読み込まれるファイルがこの名前を差し替える（window.gameTime の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "gameTime", { configurable:true, get:() => gameTime, set:v => { gameTime = v; } });
Object.defineProperty(window, "goAt", { configurable:true, get:() => goAt, set:v => { goAt = v; } });
window.handleInput = handleInput;
window.judgeNote = judgeNote;
Object.defineProperty(window, "leadIn", { configurable:true, get:() => leadIn, set:v => { leadIn = v; } });
window.pauseGame = pauseGame;
Object.defineProperty(window, "pausedInLeadIn", { configurable:true, get:() => pausedInLeadIn, set:v => { pausedInLeadIn = v; } });
window.rateKey = rateKey;
Object.defineProperty(window, "records", { configurable:true, get:() => records, set:v => { records = v; } });
window.renderRecords = renderRecords;
window.resumeGame = resumeGame;
Object.defineProperty(window, "runShort", { configurable:true, get:() => runShort, set:v => { runShort = v; } });
window.runUnranked = runUnranked;
window.saveRecords = saveRecords;
window.seekTo = seekTo;
/* 後から読み込まれるファイルがこの名前を差し替える（window.showJudge の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "showJudge", { configurable:true, get:() => showJudge, set:v => { showJudge = v; } });
window.songRec = songRec;
window.startGame = startGame;
window.sweepMisses = sweepMisses;
window.tickClock = tickClock;
window.toTitle = toTitle;
})();
