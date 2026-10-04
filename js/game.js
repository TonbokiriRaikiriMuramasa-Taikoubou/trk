// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：ゲーム進行・判定・時計・プレイ記録 ============
   対応：カウントダウン・MOD・MANUAL／TRUCK／ORBIT／STAGE／CATCH・AUTO（全モードと組み合わせ）
         体力・速度別記録・PERFECT✦・判定の平均とばらつき（extras.js が表示）
   再生速度：1.00x＝通常のハイスコア／1.05x以上＝速度ごとに別記録＋🏁最高クリア速度／1.00x未満＝練習扱い */
"use strict";

/* ---------- 記録の対象外 ---------- */
const rateKey = () => settings.rate !== 1 ? settings.rate.toFixed(2) : null;
const rateUnranked = () => modsUnranked();                                   // ゆるめ判定・1.00x未満
const runUnranked = () => practice || rateUnranked() || !!settings.autoPlay;  // AUTOも記録・称号の対象外

/* ---------- カウントダウン（3・2・1・GO!） ---------- */
let leadIn = null, goAt = 0, pausedInLeadIn = false, autoplayBlocked = false;
function countIv() {
  const b = (chartMeta.bpm || 0) * settings.rate;
  return b ? Math.min(1000, Math.max(350, 60000 / b)) : 750;
}
function countTick(k) {
  if (!settings.countdownSE) return;
  const ac = getAC(); if (!ac) return;
  if (ac.state === "suspended") ac.resume();
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), go = k >= 3;
  o.type = "square"; o.frequency.value = go ? 1320 : 880;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(.002, settings.seVolume * .5), t + .005);
  g.gain.exponentialRampToValueAtTime(.0001, t + (go ? .25 : .09));
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .3);
}
function beginLeadIn(resume) {
  const iv = countIv(), p = performance.now();
  leadIn = { start:p, end:p + 3 * iv, iv, resume, last:-1 };
  clock = resume ? { t:video.currentTime * 1000, perf:p, lastCt:-1 }
                 : { t:-3 * iv * settings.rate, perf:p, lastCt:-1 };
}
function finishLeadIn() {
  const was = leadIn; leadIn = null; goAt = performance.now();
  countTick(3);
  clock = { t:was.resume ? video.currentTime * 1000 : 0, perf:goAt, lastCt:-1 };
  video.playbackRate = settings.rate;
  video.play().catch(() => { autoplayBlocked = true; pauseGame(); });
}

/* ---------- 進行 ---------- */
function resetRun() {
  chart.forEach(n => { n.judged = false; n.result = null; });
  nextIdx = 0;
  stats = { perfect:0, good:0, miss:0, combo:0, maxCombo:0, star:0, crash:0, errN:0, errSum:0, errSq:0 };
  practice = false; effects = []; errors = []; caption = null; lastMissT = -1e9;
  leadIn = null; goAt = 0; pausedInLeadIn = false; autoplayBlocked = false;
  resetTruck(); resetLives(); resetOrbit();
  if (settings.autoPlay) { lifeState.max = 0; lifeState.hp = 0; }   // AUTOには体力はありません
  if (typeof resetStage === "function") resetStage();
  if (typeof resetCatch === "function") resetCatch();
  updateHud();
}
async function startGame() {
  if (!videoReady || !chart.length) return;
  emit("beforePlay");
  const ac = getAC(); if (ac && ac.state === "suspended") ac.resume();
  if (phase === "playing" || phase === "paused") video.pause();
  resetRun();
  video.playbackRate = settings.rate;
  try { video.currentTime = 0; } catch (_) {}
  if (document.activeElement) document.activeElement.blur();
  $("endScreen").querySelector("h2").textContent = tr("finished");
  if (settings.countdown) {
    video.volume = 0;
    try { await video.play(); video.pause(); } catch (_) {}
    try { video.currentTime = 0; } catch (_) {}
    video.volume = settings.musicVolume;
    showScreen(null); setPhase("playing");
    beginLeadIn(false);
    if (typeof poke === "function") poke();
    setCaption("capStart", null, 0);
    return;
  }
  video.volume = settings.musicVolume;
  clock = { t:0, perf:performance.now(), lastCt:-1 };
  showScreen(null); setPhase("playing");
  if (typeof poke === "function") poke();
  try { await video.play(); }
  catch (_) { setPhase("title"); showScreen("selectScreen"); setStatus("loadStatus", "playError"); return; }
  setCaption("capStart", null, 0);
}
function pauseGame() {
  if (phase !== "playing") return;
  pausedInLeadIn = !!(leadIn && !leadIn.resume);
  leadIn = null;
  setPhase("paused"); video.pause(); setStatus("pauseStatus", null); showScreen("pauseScreen");
}
async function resumeGame() {
  if (phase !== "paused") return;
  showScreen(null); setPhase("playing");
  if (typeof poke === "function") poke();
  if (pausedInLeadIn) { pausedInLeadIn = false; beginLeadIn(false); return; }
  if (settings.resumeCountdown && !autoplayBlocked) { beginLeadIn(true); return; }
  autoplayBlocked = false;
  video.playbackRate = settings.rate;
  try { await video.play(); } catch (_) { pauseGame(); }
}
function toTitle() {
  leadIn = null; pausedInLeadIn = false;
  video.pause();
  video.playbackRate = 1;
  try { video.currentTime = 0; } catch (_) {}
  setPhase("title");
  showScreen("selectScreen"); renderAllStatuses();
}
function failGame() {
  if (phase !== "playing") return;
  leadIn = null;
  video.pause();
  failSound();
  endGame(true);
}

/* ---------- スコア ---------- */
function currentScore() { const total = chart.length || 1; return Math.min(1e6, Math.round(1e6 * (stats.perfect + stats.good * .5) / total)); }
function currentAcc() { const j = stats.perfect + stats.good + stats.miss; return j ? (stats.perfect + stats.good * .5) / j * 100 : 100; }
function updateHud() {
  $("scoreVal").textContent = currentScore().toLocaleString();
  $("comboVal").textContent = stats.combo;
  $("accVal").textContent = currentAcc().toFixed(2) + "%";
}
const MODE_LABEL = { truck:"truckPlay", orbit:"orbitPlay", stage:"stagePlay", catch:"catchPlay" };
const MODE_ICON = { truck:"🚚", orbit:"🪐", stage:"🎪", catch:"🚛" };
const modeLabel = () => tr(MODE_LABEL[settings.playMode] || "manualPlay") + (settings.autoPlay ? " · " + tr("autoPlay") : "");
const modeIcon = m => MODE_ICON[m] || "";
const runMods = () => [...activeMods(), ...lifeTags(),
  ...(settings.playMode === "stage" && settings.stageMirror ? ["MIRROR"] : []), ...(settings.autoPlay ? ["AUTO"] : [])];
const showStar = () => settings.perfectStar !== false;

/* ---------- リザルト ---------- */
function endGame(failed = false) {
  if (phase !== "playing") return;
  for (const n of chart) if (!n.judged) { n.judged = true; n.result = "miss"; stats.miss++; }
  setPhase("ended");
  video.playbackRate = 1;
  const mode = settings.playMode, icon = modeIcon(mode);
  const acc = currentAcc(), score = currentScore(), clean = !failed && !(stats.crash > 0);   // CATCHでぶつかったらFCなし
  const ap = clean && stats.perfect > 0 && stats.good === 0 && stats.miss === 0;
  const fc = clean && stats.miss === 0 && stats.perfect + stats.good > 0;
  const grade = failed ? "F" : ap ? "SS" : acc >= 95 ? "S" : acc >= 90 ? "A" : acc >= 80 ? "B" : acc >= 70 ? "C" : "D";

  const rec = recordPlay({ score, acc, grade, ap, fc, failed });
  let bestHtml = "";
  if (rec.chart) {
    const star = rec.chart.ap ? ` ${icon}⭐` : "";
    const rk = rateKey() ? ` (${rateKey()}x)` : "";
    if (rec.isNew) bestHtml = `<div class="best new">${esc(tr("newBest"))}${rk}${star}</div>`;
    else if (rec.prev) bestHtml = `<div class="best">${esc(tr("best"))}${rk}: ${Number(rec.prev.score).toLocaleString()} · ${Number(rec.prev.acc).toFixed(2)}%${star}</div>`;
    if (rec.newSpeed) bestHtml += `<div class="best new">${esc(tr("newSpeed", { r:settings.rate.toFixed(2) + "x" }))}</div>`;
    bestHtml += `<div class="best">${esc(tr("recPlayCount", { n:rec.plays }))}</div>`;
  }
  const meta = [modeLabel(), tr(chartDiff), `${tr("level")}${currentLevel} ${tr("estimate")}`];
  const mods = runMods();
  if (mods.length) meta.push(`${tr("modsLabel")}: ${mods.join(" ")}`);
  if (failed) meta.push(tr("failedNote"));
  else if (settings.autoPlay) {}
  else if (practice) meta.push(tr("practice"));
  else if (rateUnranked()) meta.push(tr("unrankedNote"));
  else if (rateKey()) meta.push(tr("rateRecordNote"));
  const apKey = { truck:"truckAllPerfect", orbit:"orbitAllPerfect", stage:"stageAllPerfect", catch:"catchAllPerfect" }[mode] || "allPerfect";
  const fcKey = { truck:"truckFullCombo", orbit:"orbitFullCombo", stage:"stageFullCombo", catch:"catchFullCombo" }[mode] || "fullCombo";
  const badges = failed ? `<span class="badge" style="background:#8a1c2b;color:#fff">${esc(tr("failed"))}</span>`
               : settings.autoPlay ? `<span class="badge">▶ AUTO</span>`
               : ap ? `<span class="badge">${esc(tr(apKey))}</span>`
               : fc ? `<span class="badge">${esc(tr(fcKey))}</span>` : "";
  const starHtml = showStar() ? `<small style="display:block;font-size:14px;opacity:.85">${esc(tr("starCount", { n:stats.star || 0 }))}</small>` : "";
  $("endScreen").querySelector("h2").textContent = tr(failed ? "failed" : "finished");
  $("result").innerHTML = `
    <div class="gradeRow"><div class="grade" aria-label="${esc(tr("grade"))}">${grade}</div>
      <div style="text-align:left"><div class="bigScore">${score.toLocaleString()}</div>
        <div class="hint">${esc(meta.join(" · "))}</div><div class="badges">${badges}</div></div></div>
    <div class="statGrid">
      <div><span>${esc(tr("accuracy"))}</span><b>${acc.toFixed(2)}%</b></div>
      <div><span>${esc(tr("maxCombo"))}</span><b>${stats.maxCombo}</b></div>
      <div class="p"><span>${esc(tr("perfect"))}</span><b>${stats.perfect}</b>${starHtml}</div>
      <div><span>${esc(tr("good"))}</span><b>${stats.good}</b></div>
      <div class="m"><span>${esc(tr("miss"))}</span><b>${stats.miss}</b></div>
    </div>${bestHtml}`;

  const cr = $("credits"); cr.textContent = "";
  const song = currentSong || {};
  cr.append(el("div", "", `♪ ${song.title || baseName(mediaName)}${rec.chart && rec.chart.ap ? ` ${icon}⭐` : ""}`));
  if (song.artist) cr.append(el("div", "", `${tr("songBy")}: ${song.artist}`));
  if (song.charter) cr.append(el("div", "", `${tr("chartBy")}: ${song.charter}`));
  if (song.license) cr.append(el("div", "", `${tr("songLicense")}: ${song.license}`));
  if (song.source !== "pack") cr.append(el("div", "", tr("creditNote")));

  setStatus("endStatus", null);
  showScreen("endScreen");
}

/* ---------- セリフ ---------- */
function setCaption(key, vars, speaker) {
  const m = activeMascot(), fam = m ? MASCOT_FAMILY[m] : null;
  const pc = (typeof packRuntime !== "undefined" && packRuntime.captions) || null;
  const own = (pc && pc[key]) || (fam && MASCOT_CAPTIONS[fam] && MASCOT_CAPTIONS[fam][key]) || (skin().captions && skin().captions[key]);
  let text = own ? (own[lang] || own.en || Object.values(own)[0]) : tr(key);
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  caption = { text, speaker, t:performance.now() };
}

/* ---------- 判定 ---------- */
let autoJudging = false;   // AUTOの処理から判定しているときだけ true
function showJudge(kind, delta, star) {
  const n = $("judge");
  $("judgeText").textContent = tr(kind) + (star && showStar() ? "✦" : "");
  $("judgeSub").textContent = (kind !== "perfect" && delta != null) ? tr(delta < 0 ? "early" : "late") : "";
  n.className = ""; void n.offsetWidth; n.className = `show ${kind}`;
}
function judgeHitPos(n) {
  if (isOrbit()) return orbitHitPos(n);
  if (isStage()) return stageHitPos(n);
  if (typeof isCatch === "function" && isCatch()) return catchHitPos(n);
  return hitPos(layout(), n.lane);
}
function judgeNote(n, kind, delta) {
  if (phase !== "playing") return;
  if (settings.autoPlay && !autoJudging && kind !== "miss") return;   // AUTO中は、キー・タップでは判定しない
  n.judged = true; n.result = kind;
  const star = kind === "perfect" && delta != null && Math.abs(delta) <= windows().perfect * .5;   // PERFECT✦
  if (kind === "miss") {
    stats.miss++;
    lastMissT = performance.now();
    if (stats.combo >= 20) setCaption("capBreak", null, 0);
    stats.combo = 0;
  } else {
    stats[kind]++; stats.combo++; stats.maxCombo = Math.max(stats.maxCombo, stats.combo);
    if (star) stats.star++;
    const hp = judgeHitPos(n);
    effects.push({ x:hp.x, y:hp.y, c:laneColor(n.lane), t:performance.now(), kind, seed:Math.random() * TAU });
    avatarHit[n.lane] = performance.now();
    if (stats.combo % 50 === 0) setCaption("capCombo", { n:stats.combo }, 1);
    if (delta != null && !settings.autoPlay) { stats.errN++; stats.errSum += delta; stats.errSq += delta * delta; }   // 平均とばらつき
  }
  if (delta != null && kind !== "miss" && ["manual", "orbit", "stage"].includes(settings.playMode)) {
    errors.push({ d:delta, t:performance.now(), kind }); if (errors.length > 30) errors.shift();
  }
  showJudge(kind, delta, star); updateHud();
  while (nextIdx < chart.length && chart[nextIdx].judged) nextIdx++;
  if (lifeAfterJudge(kind)) failGame();
}
/* ORBIT：どのキーでも次のノーツ1つだけ（早すぎる連打はMISS） */
function orbitInput(ts) {
  const p = performance.now(), at = (ts > 0 && ts <= p) ? ts : p;
  const now = gameTime(at), w = windows(), n = chart[nextIdx];
  pressH = { lane:0, t:p };
  if (!n) return;
  const d = now - n.time;
  if (d < -w.good * 2) return;
  playSE(n.lane);
  if (d < -w.good) { judgeNote(n, "miss", d); return; }
  judgeNote(n, Math.abs(d) <= w.perfect ? "perfect" : "good", d);
}
function handleInput(lane, ts) {
  if (phase !== "playing" || settings.autoPlay) return;            // AUTO中は見るだけ
  const mode = settings.playMode;
  if (mode === "stage" || mode === "catch") return;                 // stage.js・catch.js が受け取る
  if (mode === "orbit") { orbitInput(ts); return; }
  if (mode === "truck") { steerTruck(lane); return; }
  const p = performance.now(), at = (ts > 0 && ts <= p) ? ts : p;
  const now = gameTime(at);
  playSE(lane);
  pressFlash[laneCol(lane)] = p; pressH = { lane, t:p };
  const w = windows();
  for (let i = nextIdx; i < chart.length; i++) {
    const n = chart[i]; if (n.judged) continue;
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
  } else if (!isOrbit()) pressFlash[laneCol(n.lane)] = p;
  pressH = { lane:n.lane, t:p };
}
function autoPlay(now) {
  autoJudging = true;
  for (let i = nextIdx; i < chart.length; i++) {
    if (phase !== "playing") break;
    const n = chart[i]; if (n.time > now) break;
    if (!n.judged) { judgeNote(n, "perfect", 0); playSE(n.lane); autoVisual(n, i, performance.now()); }
  }
  autoJudging = false;
  const nx = chart[nextIdx];                                       // TRUCKは次のノーツのレーンへ先回り
  if (nx && isTruck() && typeof truckState !== "undefined") truckState.lane = nx.lane;
}
function sweepMisses(now) {
  if (settings.autoPlay && phase === "playing") autoPlay(now);     // AUTOはMISS判定の前に自動で判定
  const w = windows();
  for (let i = nextIdx; i < chart.length; i++) {
    if (phase !== "playing") return;
    const n = chart[i]; if (n.time > now - w.good) break;
    if (!n.judged) judgeNote(n, "miss", null);
  }
}
function seekTo(sec) {
  practice = true;
  if (leadIn) { leadIn = null; if (phase === "playing") video.play().catch(() => {}); }
  try { video.currentTime = sec; } catch (_) { return; }
  clock = { t:sec * 1000, perf:performance.now(), lastCt:-1 };
  const t = sec * 1000 - settings.latency;
  for (const n of chart) {
    if (n.time < t) { if (!n.judged) { n.judged = true; n.result = "skip"; } }
    else { n.judged = false; n.result = null; }
  }
  stats.combo = 0; nextIdx = 0;
  while (nextIdx < chart.length && chart[nextIdx].judged) nextIdx++;
  updateHud();
}

/* ---------- 時計 ---------- */
function tickClock() {
  const p = performance.now();
  if (leadIn && phase === "playing") {
    if (leadIn.resume) clock = { t:video.currentTime * 1000, perf:p, lastCt:-1 };
    else { clock.t = -(leadIn.end - p) * settings.rate; clock.perf = p; }
    const k = Math.floor((p - leadIn.start) / leadIn.iv);
    if (k !== leadIn.last && k < 3) { leadIn.last = k; countTick(k); }
    if (p >= leadIn.end) finishLeadIn();
    return;
  }
  const ct = video.currentTime * 1000;
  if (video.paused || video.seeking || phase !== "playing") { clock = { t:ct, perf:p, lastCt:ct }; return; }
  let t = clock.t + (p - clock.perf) * (video.playbackRate || 1);
  if (ct !== clock.lastCt) {
    const diff = ct - t;
    if (Math.abs(diff) > 80) t = ct; else t += diff * .2;
    clock.lastCt = ct;
  }
  clock.t = t; clock.perf = p;
}
function gameTime(at = performance.now()) {
  let base;
  if (phase === "playing" && leadIn) base = leadIn.resume ? clock.t : clock.t + (at - clock.perf) * settings.rate;
  else base = (phase === "playing" && !video.paused) ? clock.t + (at - clock.perf) * (video.playbackRate || 1) : clock.t;
  return base - settings.latency;
}

/* ============ プレイ記録 ============
   MANUAL・TRUCK・ORBIT・STAGE・CATCH は別々。1.05x以上は slot.rates["1.25"] のように速度ごと。
   slot.maxRate＝🏁最高クリア速度。AUTO・練習・練習扱い・FAILEDはハイスコア対象外。 */
const REC_KEY = "shadow_taiko_records_v1", HIST_MAX = 30;
let records = {};
try { records = JSON.parse(localStorage.getItem(REC_KEY)) || {}; } catch (_) { records = {}; }
if (!records || typeof records !== "object" || Array.isArray(records)) records = {};
function saveRecords() { try { localStorage.setItem(REC_KEY, JSON.stringify(records)); } catch (_) {} }
const chartKeyOf = () => hashString(chart.map(n => n.time + ":" + n.lane).join(",")).toString(36);
const MODE_PLAYS = { truck:"truckPlays", orbit:"orbitPlays", stage:"stagePlays", catch:"catchPlays" };
const PLAY_KEYS = ["plays", "truckPlays", "orbitPlays", "stagePlays", "catchPlays"];
function songRec(create) {
  if (!fingerprint) return null;
  if (!records[fingerprint] && create) {
    records[fingerprint] = { title:baseName(mediaName), size:Number(fingerprint.split(":")[0]) || 0,
      plays:0, truckPlays:0, orbitPlays:0, stagePlays:0, catchPlays:0, perfectTotal:0, lastPlayed:0, charts:{}, history:[] };
  }
  return records[fingerprint] || null;
}
const newSlot = () => ({ plays:0, best:null, ap:false, fc:false, bestPerfect:0 });
function recordPlay(r) {
  const s = songRec(true); if (!s) return {};
  const mode = settings.playMode, auto = !!settings.autoPlay;
  const unranked = runUnranked() || !!r.failed;
  const ck = chartKeyOf(), rk = rateKey();
  const c = s.charts[ck] || (s.charts[ck] = { diff:chartDiff, level:currentLevel, ...newSlot() });
  c.diff = chartDiff; c.level = currentLevel;
  const base = MODE_PLAYS[mode] ? (c[mode] ||= newSlot()) : c;
  const slot = rk && settings.rate > 1 ? ((base.rates ||= {})[rk] ||= newSlot()) : base;
  const entry = { t:Date.now(), diff:chartDiff, score:r.score, acc:+r.acc.toFixed(2), grade:r.grade,
    perfect:stats.perfect, star:stats.star || 0, good:stats.good, miss:stats.miss, crash:stats.crash || 0, maxCombo:stats.maxCombo,
    mode, auto, truck:mode === "truck", orbit:mode === "orbit", stage:mode === "stage", catch:mode === "catch",
    failed:!!r.failed, rate:settings.rate, practice:practice || rateUnranked(), ap:r.ap, fc:r.fc, mods:runMods() };
  s.history.unshift(entry); if (s.history.length > HIST_MAX) s.history.length = HIST_MAX;
  s.lastPlayed = entry.t;
  s.title = baseName(mediaName) || s.title;
  if (currentSong && currentSong.title) s.display = currentSong.title;
  let out = {};
  if (!auto) {
    slot.plays = (slot.plays || 0) + 1;
    if (MODE_PLAYS[mode]) s[MODE_PLAYS[mode]] = (s[MODE_PLAYS[mode]] || 0) + 1;
    else { s.plays = (s.plays || 0) + 1; s.perfectTotal = (s.perfectTotal || 0) + stats.perfect; }
    let prev = slot.best, isNew = false, newSpeed = false;
    if (!prev && mode === "manual" && slot === c) {
      try { const old = (JSON.parse(localStorage.getItem(BEST_KEY)) || {})[`${fingerprint}|${ck}`]; if (old) prev = c.best = { score:old.score, acc:old.acc, date:old.date }; } catch (_) {}
    }
    if (!unranked) {
      slot.bestPerfect = Math.max(slot.bestPerfect || 0, stats.perfect);
      if (r.ap) slot.ap = true;
      if (r.fc) slot.fc = true;
      if (!prev || r.score > prev.score) {
        slot.best = { score:r.score, acc:entry.acc, grade:r.grade, perfect:stats.perfect, star:entry.star, good:stats.good, miss:stats.miss,
          maxCombo:stats.maxCombo, date:entry.t, mods:entry.mods, rate:settings.rate };
        isNew = true;
      }
      if (settings.rate > (base.maxRate || 1)) { base.maxRate = settings.rate; newSpeed = true; }
    }
    out = { isNew, prev, plays:slot.plays, chart:slot, mode, newSpeed };
  }
  saveRecords(); renderRecords();
  emit("records");
  return out;
}
function slotCell(t, icon) {
  return t && t.best ? `${Number(t.best.score).toLocaleString()}${t.ap ? ` ${icon}⭐` : t.fc ? " FC" : ""}` : "—";
}
const SLOT_COLS = [["truck", "🚚", "recTruck"], ["orbit", "🪐", "recOrbit"], ["stage", "🎪", "recStage"], ["catch", "🚛", "recCatch"]];
function renderRecords() {
  const panel = $("recPanel"); if (!panel) return;
  panel.hidden = !videoReady;
  const sum = $("recSummary"), hist = $("recHistory");
  sum.textContent = ""; hist.textContent = "";
  if (!videoReady) return;
  const s = songRec(false);
  if (!s || !s.history || !s.history.length) { sum.append(el("div", "hint", tr("recNone"))); return; }
  const top = el("div", "recTop");
  const extra = SLOT_COLS.map(([m, i]) => s[MODE_PLAYS[m]] ? i + s[MODE_PLAYS[m]] : "").filter(Boolean).join(" ");
  const plays = `${s.plays || 0}${extra ? ` (${extra})` : ""}`;
  [[tr("recPlays"), plays], [tr("recPerfTotal"), (s.perfectTotal || 0).toLocaleString()], [tr("recLast"), s.lastPlayed ? fmtDate(s.lastPlayed) : "—"]]
    .forEach(([k, v]) => { const d = el("div"); d.append(el("span", "", k), el("b", "", String(v))); top.append(d); });
  sum.append(top);
  const ck = chart.length ? chartKeyOf() : "", tbl = el("table", "recTable"), head = el("tr");
  [tr("recDiff"), tr("recBest"), tr("recAcc"), tr("recBestP"), tr("recCount"), ...SLOT_COLS.map(([, , k]) => tr(k))].forEach(h => head.append(el("th", "", h)));
  tbl.append(head);
  const charts = Object.entries(s.charts || {}).sort(([, a], [, b]) => DIFF_IDS.indexOf(a.diff) - DIFF_IDS.indexOf(b.diff));
  charts.forEach(([key, c]) => {
    const row = el("tr", key === ck ? "cur" : ""), badge = c.ap ? " ⭐" : c.fc ? " FC" : "";
    const bestMods = c.best && Array.isArray(c.best.mods) && c.best.mods.length ? ` [${c.best.mods.join(" ")}]` : "";
    row.append(
      el("td", "", `${tr(c.diff)} Lv.${c.level}${badge}`),
      el("td", "", c.best ? Number(c.best.score).toLocaleString() + bestMods : "—"),
      el("td", "", c.best ? Number(c.best.acc).toFixed(2) + "%" : "—"),
      el("td", "", String(c.bestPerfect || 0)),
      el("td", "", String(c.plays || 0)),
      ...SLOT_COLS.map(([m, icon]) => el("td", "", slotCell(c[m], icon))));
    tbl.append(row);
  });
  sum.append(tbl);
  const lines = [];
  for (const [, c] of charts) {
    for (const [slot, icon] of [[c, "🥁"], ...SLOT_COLS.map(([m, i]) => [c[m], i])]) {
      if (!slot) continue;
      const parts = Object.entries(slot.rates || {}).sort((a, b) => +a[0] - +b[0]).filter(([, x]) => x.best)
        .map(([k, x]) => `${k}x ${Number(x.best.score).toLocaleString()}${x.ap ? " ⭐" : x.fc ? " FC" : ""}`);
      if ((slot.maxRate || 1) > 1) parts.push(`🏁${slot.maxRate.toFixed(2)}x`);
      if (parts.length) lines.push(`${tr(c.diff)} ${icon} ${parts.join(" · ")}`);
    }
  }
  if (lines.length) {
    sum.append(el("div", "hint status", tr("rateRecLabel")));
    lines.forEach(l => sum.append(el("div", "hint", l)));
  }
  sum.append(el("div", "hint", tr("recStarHint")));
  for (const h of s.history) {
    const icon = MODE_ICON[h.mode] || "";
    const mark = h.failed ? tr("recFailed") : h.auto ? icon : h.ap ? `${icon}⭐` : h.fc ? `${icon} FC`.trim() : icon;
    const mods = Array.isArray(h.mods) && h.mods.length ? h.mods.filter(m => m !== "AUTO").join(" ") : "";
    const star = h.star ? ` ✦${h.star}` : "", crash = h.crash ? ` 💥${h.crash}` : "";
    const tags = [mark, mods, h.auto ? tr("recAuto") : "", h.practice && !h.failed && !h.auto ? tr("recPractice") : ""].filter(Boolean).join(" · ");
    hist.append(el("div", "histRow" + (h.auto || h.failed ? " auto" : ""),
      `${fmtDate(h.t)} · ${tr(h.diff)} · ${Number(h.score).toLocaleString()} · ${Number(h.acc).toFixed(2)}% · P${h.perfect}${star}/G${h.good}/M${h.miss}${crash} · ${h.grade}${tags ? " · " + tags : ""}`));
  }
}
on("chart", renderRecords);
on("language", renderRecords);

/* ---------- 記録のバックアップ・削除 ---------- */
$("recExportBtn").addEventListener("click", () => {
  downloadJSON({ format:"shadow-taiko-records", version:1, records }, `trk-records-${new Date().toISOString().slice(0, 10)}.json`);
  setStatus("recStatus", "recExported");
});
$("recImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
  if (!raw || raw.format !== "shadow-taiko-records" || !raw.records || typeof raw.records !== "object") { setStatus("recStatus", "recBad"); return; }
  let n = 0;
  for (const [k, v] of Object.entries(raw.records)) {
    if (!/^\d+:\d+$/.test(k) || !v || typeof v !== "object" || !v.charts || typeof v.charts !== "object" || !Array.isArray(v.history)) continue;
    const total = x => PLAY_KEYS.reduce((a, key) => a + (Number(x[key]) || 0), 0);
    if (!records[k] || total(v) >= total(records[k])) { records[k] = v; n++; }
  }
  saveRecords(); renderRecords(); emit("records");
  setStatus("recStatus", "recImported", { n });
});
$("recResetBtn").addEventListener("click", () => {
  if (!fingerprint || !records[fingerprint] || !confirm(tr("recConfirmReset"))) return;
  delete records[fingerprint]; saveRecords(); renderRecords(); emit("records");
  setStatus("recStatus", "recCleared");
});
/* ✅ game.js 完了 */
