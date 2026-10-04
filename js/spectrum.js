// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! spectrum.js — 📊 スペクトラム（音の見える化）  version 1
   --------------------------------------------------------------------------
   ・いま鳴っている音を、バー／ミラー／波形／リングで見られます。
   ・置き場所は2つ
       ① 🎛 ラック（fx-dock）の「くわしい」の中の大きな画面
       ② 📺 TVの画面に重ねる（settings.specTv。初期はオフ）
     さらに、設定画面「🔊 サウンド」の下に #specPanel（くわしい設定）を足します。
   ・音は fx.js の窓口 TrkFX.tap() から見ます。createMediaElementSource は
     fx.js が一度だけ作る約束なので、こちらでは作りません（アナライザーは1つを使い回す）。
   ⚠ 表示を使うと、音が本体のエフェクターと同じ通り道（Web Audio）を通ります。
     エフェクトを一度も使っていないときも、この表示をオンにすると通り道が作られます。
     自動補正（fxDelayMs）はコンプ／リミッターがオフなら 0 のままなので、
     判定の記録には影響しません（fx.js の約束）。
   ⚠ ?safe=1 では、保存値を読み戻さず（core.js の設定のまま）、表示もしません。
     新しい設定は core.js の settings／enterSafeMode()／resetVideoPrefs() にも入っています。
   読み込み順：… → mmd.js → spectrum.js（いちばん最後。fx.js・tv-dock.js の後）
   ========================================================================== */
"use strict";
(() => {

/* ============ 文章（接頭辞 spec…） ============ */
Object.assign(TEXT.ja, {
  specTitle:"📊 スペクトラム（音の見える化）",
  specHint:"いま鳴っている音を、バーや波形で見られます。TVの画面に重ねることもできます。",
  specOn:"スペクトラムを表示する",
  specWhere:"🎛 ラックの「くわしい設定」の中と、設定 →「🔊 サウンド」の下にあります。",
  specStyle:"見え方",
  specStyleBars:"バー", specStyleMirror:"ミラー", specStyleWave:"波形", specStyleRing:"リング",
  specTheme:"色",
  specThemeNeon:"ネオン", specThemeSunset:"夕焼け", specThemeMono:"モノクロ", specThemeRainbow:"レインボー",
  specGain:"感度",
  specPeaks:"ピーク（残像のライン）を出す",
  specTv:"📺 TVの画面にも重ねる",
  specTvHint:"選曲画面のテレビに、映像の上から重ねて表示します（初期はオフ）。ゲーム中は出ません。",
  specWebAudio:"※ 表示すると、音は本体のエフェクターと同じ通り道（Web Audio）を通ります。エフェクトを一度も使っていないときも、この表示をオンにすると通り道が作られます。判定の記録には影響しません。",
  specNoAudio:"このブラウザでは音を見られませんでした（Web Audio が使えないときに出ます）。",
  specIdle:"曲を再生すると動きます。"
});
Object.assign(TEXT.en, {
  specTitle:"📊 Spectrum (see the sound)",
  specHint:"See what is playing right now as bars or a waveform. You can also overlay it on the TV screen.",
  specOn:"Show the spectrum",
  specWhere:"You can find it in the rack's “More settings”, and in Settings → “🔊 Sound”.",
  specStyle:"Style",
  specStyleBars:"Bars", specStyleMirror:"Mirror", specStyleWave:"Wave", specStyleRing:"Ring",
  specTheme:"Color",
  specThemeNeon:"Neon", specThemeSunset:"Sunset", specThemeMono:"Mono", specThemeRainbow:"Rainbow",
  specGain:"Sensitivity",
  specPeaks:"Show peaks (falling lines)",
  specTv:"📺 Overlay it on the TV too",
  specTvHint:"Draws it over the video on the song-select TV (off by default). It is hidden while playing.",
  specWebAudio:"Note: showing it routes the sound through the same Web Audio path as the effects. Even if you never used an effect, turning this on creates that path. It does not affect your records.",
  specNoAudio:"The sound could not be read in this browser (shown when Web Audio is unavailable).",
  specIdle:"Play a song to make it move."
});
Object.assign(TEXT.zh, {
  specTitle:"📊 频谱（把声音可视化）",
  specHint:"可以把正在播放的声音显示为柱状或波形。也可以叠加在电视画面上。",
  specOn:"显示频谱",
  specWhere:"位于 🎛 机架的“详细设置”中，以及 设置 →“🔊 声音”下方。",
  specStyle:"样式",
  specStyleBars:"柱状", specStyleMirror:"镜像", specStyleWave:"波形", specStyleRing:"环形",
  specTheme:"配色",
  specThemeNeon:"霓虹", specThemeSunset:"晚霞", specThemeMono:"黑白", specThemeRainbow:"彩虹",
  specGain:"灵敏度",
  specPeaks:"显示峰值（余晖线）",
  specTv:"📺 也叠加到电视画面上",
  specTvHint:"在选曲画面的电视上，覆盖显示在视频之上（默认关闭）。游戏过程中不显示。",
  specWebAudio:"※ 显示后，声音会经过与本体效果器相同的通道（Web Audio）。即使从未使用过效果器，开启此显示也会创建该通道。不会影响成绩记录。",
  specNoAudio:"此浏览器无法读取声音（Web Audio 不可用时显示）。",
  specIdle:"播放歌曲后就会动起来。"
});
Object.assign(TEXT.ko, {
  specTitle:"📊 스펙트럼 (소리를 보이게)",
  specHint:"지금 나오는 소리를 막대나 파형으로 볼 수 있습니다. TV 화면에 겹쳐서 표시할 수도 있습니다.",
  specOn:"스펙트럼 표시",
  specWhere:"🎛 랙의 “자세한 설정” 안과 설정 →“🔊 사운드” 아래에 있습니다.",
  specStyle:"모양",
  specStyleBars:"막대", specStyleMirror:"미러", specStyleWave:"파형", specStyleRing:"링",
  specTheme:"색",
  specThemeNeon:"네온", specThemeSunset:"노을", specThemeMono:"모노크롬", specThemeRainbow:"무지개",
  specGain:"감도",
  specPeaks:"피크(잔상 라인) 표시",
  specTv:"📺 TV 화면에도 겹치기",
  specTvHint:"선곡 화면의 TV에서 영상 위에 겹쳐 표시합니다(기본 꺼짐). 플레이 중에는 나오지 않습니다.",
  specWebAudio:"※ 표시하면 소리가 본체 이펙터와 같은 길(Web Audio)을 지납니다. 이펙트를 한 번도 쓰지 않았어도 이 표시를 켜면 길이 만들어집니다. 기록에는 영향을 주지 않습니다.",
  specNoAudio:"이 브라우저에서는 소리를 볼 수 없습니다 (Web Audio를 쓸 수 없을 때 표시됩니다).",
  specIdle:"곡을 재생하면 움직입니다."
});

/* ============ 設定（core.js の settings に足す） ============ */
const SPEC_STYLES = ["bars", "mirror", "wave", "ring"];
const SPEC_THEMES = ["neon", "sunset", "mono", "rainbow"];
const specSafe = (typeof safeModeOn !== "undefined") && safeModeOn;
/* 🛟 セーフモードのときは、保存値を読み戻さない（core.js が入れた「表示しない」を守る） */
if (typeof prefs !== "undefined" && !specSafe) {
  settings.specOn    = prefs.specOn !== false;                                  // 表示する（初期オン）
  settings.specStyle = pick(prefs.specStyle, SPEC_STYLES, "bars");
  settings.specTheme = pick(prefs.specTheme, SPEC_THEMES, "neon");
  settings.specGain  = num(prefs.specGain, .4, 2.5, 1);
  settings.specPeaks = prefs.specPeaks !== false;                               // ピーク（初期オン）
  settings.specTv    = prefs.specTv === true;                                   // 📺 重ね表示（初期オフ）
}
/* core.js より前に読まれたとき・?safe=1 のときの保険（知らない値は既定に戻す） */
if (typeof settings !== "undefined") {
  settings.specOn    = settings.specOn !== false;
  settings.specStyle = pick(settings.specStyle, SPEC_STYLES, "bars");
  settings.specTheme = pick(settings.specTheme, SPEC_THEMES, "neon");
  settings.specGain  = num(settings.specGain, .4, 2.5, 1);
  settings.specPeaks = settings.specPeaks !== false;
  settings.specTv    = settings.specTv === true;
}

/* ============ 🔊 音を見る（TrkFX.tap を1つだけ使い回す） ============
   ・createMediaElementSource は fx.js が一度だけ作る（ここでは呼ばない）
   ・アナライザーは作り直すと G.out にぶら下がって増えていくので、1つを使い回す
   ・作るのはユーザーの操作（クリック・キー）の中だけ。ブラウザは操作のあとでないと
     音を出せないため、操作の外で作ると音が黙ることがある                                */
let an = null, freq = null, wave = null, specNoAudio = false, hadGesture = false;
function ensureAnalyser() {
  if (an) return an;
  if (specNoAudio || !settings.specOn) return null;
  const T = window.TrkFX;
  if (!T || typeof T.tap !== "function") { specNoAudio = true; updateStatus(); return null; }
  try { an = T.tap(2048); } catch (_) { an = null; }
  if (!an) { specNoAudio = true; updateStatus(); return null; }
  freq = new Uint8Array(an.frequencyBinCount || 1024);
  wave = new Uint8Array(an.fftSize || 2048);
  const ac = an.context;
  if (ac && ac.state === "suspended" && ac.resume) { try { const p = ac.resume(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
  updateStatus();
  return an;
}

/* ============ 色 ============ */
function themeColor(theme, i, n, v) {
  const t = n > 1 ? i / (n - 1) : 0;
  /* カンマ区切りの hsl() で書く（スペース区切りは新しいブラウザしか読めないため） */
  if (theme === "sunset") return `hsl(${Math.round(40 + t * 300)}, 95%, ${Math.round(56 + v * 12)}%)`;   // 山吹 → ピンク
  if (theme === "mono") return `hsl(0, 0%, ${Math.round(68 + v * 30)}%)`;
  if (theme === "rainbow") return `hsl(${Math.round(t * 320)}, 92%, ${Math.round(58 + v * 10)}%)`;
  return `hsl(${Math.round(188 + t * 132)}, 100%, ${Math.round(56 + v * 12)}%)`;   // neon：シアン → マゼンタ
}

/* ============ 描く ============ */
const PEAKS = new WeakMap();          // canvas → Float32Array（ピークの残像）
function peakOf(cv, n) {
  const cur = PEAKS.get(cv);
  if (cur && cur.length === n) return cur;
  const next = new Float32Array(n);
  PEAKS.set(cv, next);
  return next;
}
function rr2(g, x, y, w, h) {
  h = Math.max(1, h);
  const r = Math.min(w / 2, h / 2, 4);
  if (typeof g.roundRect === "function" && h > 2) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
  else g.fillRect(x, y, w, h);
}
function drawBars(g, W, H, vals, mirror, peaks, cv) {
  const n = vals.length, step = W / n, bw = Math.max(2, step * .74);
  const base = mirror ? H / 2 : H * .92;
  const pk = peakOf(cv, n);
  for (let i = 0; i < n; i++) {
    const v = vals[i];
    pk[i] = Math.max(v, pk[i] - .02);
    const x = i * step + (step - bw) / 2;
    g.fillStyle = themeColor(settings.specTheme, i, n, v);
    if (mirror) {
      const hh = Math.max(1, v * base * .96);
      rr2(g, x, H / 2 - hh, bw, hh * 2);
    } else {
      const hh = Math.max(1, v * base);
      rr2(g, x, base - hh, bw, hh);
      g.globalAlpha = .2;                                     // 床の反射
      rr2(g, x, base + 2, bw, Math.min(hh * .5, H - base - 3));
      g.globalAlpha = 1;
    }
    if (peaks && pk[i] > .03) {
      const ph = Math.max(2, pk[i] * (mirror ? base * .96 : base));
      g.fillStyle = "rgba(255,255,255,.85)";
      g.fillRect(x, (mirror ? H / 2 : base) - ph, bw, 2);
    }
  }
}
function drawWave(g, W, H, vals, live) {
  const n = vals.length, step = W / n, bw = Math.max(2, step * .8);
  g.globalAlpha = .3;                                        // うしろに周波数のミラー
  for (let i = 0; i < n; i++) {
    const v = vals[i], hh = v * H * .42;
    g.fillStyle = themeColor(settings.specTheme, i, n, v);
    g.fillRect(i * step + (step - bw) / 2, H / 2 - hh, bw, hh * 2);
  }
  g.globalAlpha = 1;
  if (!live || !wave || !wave.length) return;
  const len = wave.length;
  g.beginPath();
  for (let x = 0; x < W; x++) {
    const k = Math.min(len - 1, Math.floor(x / W * len));
    const y = H / 2 + ((wave[k] - 128) / 128) * (H * .42);
    if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.lineWidth = Math.max(1.5, H * .014);
  g.strokeStyle = themeColor(settings.specTheme, 0, 1, .85);
  g.shadowColor = g.strokeStyle;
  g.shadowBlur = Math.max(2, H * .07);
  g.stroke();
  g.shadowBlur = 0;
}
function drawRing(g, W, H, vals) {
  const n = vals.length, cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * .24, len = Math.min(W, H) * .2;
  g.save(); g.translate(cx, cy);
  for (let i = 0; i < n; i++) {
    const v = vals[i], a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r1 = R + Math.max(1, v * len);
    g.strokeStyle = themeColor(settings.specTheme, i, n, v);
    g.lineWidth = Math.max(1.5, Math.min(W, H) / n * 1.7);
    g.beginPath();
    g.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.stroke();
  }
  g.restore();
}
function idleLine(g, W, H) {
  g.fillStyle = "rgba(255,255,255,.22)";
  g.fillRect(0, Math.round(H / 2), W, 2);
}
/* 1枚のキャンバスに描く（中身が無いときは .22 の平らな線）。描けたら true */
function drawOne(cv, kind) {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return false;
  const dpr = Math.min(2, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
  const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext("2d"); if (!g) return false;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = "none"; g.globalAlpha = 1; g.shadowBlur = 0; g.clearRect(0, 0, W, H);

  const cap = reducedMotion() ? 32 : (kind === "tv" ? 64 : 96);
  const n = Math.max(12, Math.min(cap, Math.round(W / (kind === "tv" ? 9 : 10))));
  const vals = new Float32Array(n);
  let live = false;
  if (an && freq && wave) {
    try { an.getByteFrequencyData(freq); live = true; } catch (_) { live = false; }
    if (live) { try { an.getByteTimeDomainData(wave); } catch (_) {} }
  }
  if (live) {
    const bins = freq.length, nyq = ((an.context && an.context.sampleRate) || 48000) / 2;
    const gain = settings.specGain, LO = 40, HI = 14000;
    for (let i = 0; i < n; i++) {
      let a = Math.round(LO * Math.pow(HI / LO, i / n) / nyq * bins);
      let b = Math.round(LO * Math.pow(HI / LO, (i + 1) / n) / nyq * bins);
      a = Math.max(1, Math.min(bins - 1, a));
      b = Math.max(a + 1, Math.min(bins, b));
      let m = 0, c = 0;
      for (let k = a; k < b; k++) { m += freq[k]; c++; }
      vals[i] = Math.min(1, Math.pow((c ? m / c / 255 : 0) * gain, .85));
    }
  }
  const style = settings.specStyle;
  if (style === "wave") drawWave(g, W, H, vals, live);
  else if (style === "ring") { if (live) drawRing(g, W, H, vals); else idleLine(g, W, H); }
  else drawBars(g, W, H, vals, style === "mirror", settings.specPeaks && !reducedMotion(), cv);
  if (!live && style !== "ring") idleLine(g, W, H);
  return true;
}

/* ============ 描き続けるかどうか ============ */
const panelCanvases = [];              // くわしい欄と設定画面のキャンバス（見えているものだけ描く）
let tvCanvas = null;                   // 📺 TVに重ねるキャンバス
let raf = 0;

/* 動きを減らす設定の人には、本数を減らしてピークの残像も出さない */
function reducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (_) { return false; }
}

const isSafe = () => (typeof safeModeOn !== "undefined" && safeModeOn) || (typeof window.TrkSafeMode === "function" && window.TrkSafeMode());
function onSelectScreen() { return (typeof screen === "undefined" ? "" : screen) === "select"; }
function seeable(n) { return !!n && n.isConnected && n.clientWidth > 0 && n.clientHeight > 0 && !document.hidden; }
function panelOn() { return panelCanvases.some(seeable); }
function tvOn() {
  if (!tvCanvas || !settings.specTv || settings.videoStyle === "off" || !onSelectScreen()) return false;
  const dock = document.getElementById("tvDock");
  if (dock && dock.classList.contains("off")) return false;
  return seeable(tvCanvas);
}
/* 表示したい場所があるか（アナライザーを作る判断にも使う） */
function wantLive() { return settings.specOn && !isSafe() && (panelOn() || (tvCanvas && settings.specTv && onSelectScreen())); }
function clearOne(cv) { const g = cv.getContext && cv.getContext("2d"); if (g) { try { g.clearRect(0, 0, cv.width, cv.height); } catch (_) {} } }

/* 「曲を再生すると動きます」／「このブラウザでは音を見られません」の1行 */
const statusNodes = [];
function updateStatus() {
  const msg = !settings.specOn ? "" : specNoAudio ? tr("specNoAudio") : (an ? "" : tr("specIdle"));
  for (const n of statusNodes) if (n.textContent !== msg) n.textContent = msg;
}

let lastIdle = 0;
function frame() {
  raf = 0;
  let busy = false;
  const on = settings.specOn && !isSafe();
  /* アナライザーは、ページで一度でも操作されたあと（ブラウザの音の制限）に、
     実際に音が鳴っているときだけ作る */
  if (on && !an && !specNoAudio && hadGesture && !video.paused) ensureAnalyser();
  /* 音を見ていないときは、毎フレーム描かずに休む（画面を開いているあいだの負担を減らす） */
  const now = performance.now();
  const idle = !an;
  const skip = idle && now - lastIdle < 250;
  for (const cv of panelCanvases) {
    if (!on || !seeable(cv)) { if (cv.isConnected) clearOne(cv); continue; }
    busy = true;
    if (!skip) drawOne(cv, "panel");
  }
  if (on && tvOn()) { busy = true; if (!skip) drawOne(tvCanvas, "tv"); }
  else if (tvCanvas && tvCanvas.isConnected) clearOne(tvCanvas);
  if (!skip) lastIdle = now;
  if (busy && !document.hidden) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }

/* ============ 画面を作る ============ */
const SYNCS = [];                      // 表示を合わせる関数（言語を変えたときにも呼ぶ）
function tx(tag, key, cls) { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; }

function mkChips(pairs, get, set) {
  const row = el("div", "seg specSeg");
  const bs = pairs.map(([v, key]) => {
    const b = tx("button", key);
    b.dataset.specVal = v;
    b.addEventListener("click", () => { set(v); });
    row.append(b);
    return b;
  });
  SYNCS.push(() => { const cur = String(get()); for (const b of bs) b.classList.toggle("selected", b.dataset.specVal === cur); });
  return row;
}
function mkCheck(key, get, set) {
  const lab = el("label", "check"), inp = document.createElement("input");
  inp.type = "checkbox";
  lab.append(inp, tx("span", key));
  inp.addEventListener("change", () => set(inp.checked));
  SYNCS.push(() => { inp.checked = !!get(); });
  return lab;
}
function buildBox(host, withCanvas) {
  if (withCanvas) {
    const cv = document.createElement("canvas");
    cv.className = "specCanvas";
    cv.setAttribute("aria-hidden", "true");
    host.append(cv);
    panelCanvases.push(cv);
  }
  host.append(tx("div", "specHint", "hint"));
  host.append(tx("div", "specStyle", "hint specLabel"),
    mkChips(SPEC_STYLES.map((v, i) => [v, ["specStyleBars", "specStyleMirror", "specStyleWave", "specStyleRing"][i]]),
      () => settings.specStyle, v => { settings.specStyle = v; saveUserPrefs(); syncAll(); }));
  host.append(tx("div", "specTheme", "hint specLabel"),
    mkChips(SPEC_THEMES.map((v, i) => [v, ["specThemeNeon", "specThemeSunset", "specThemeMono", "specThemeRainbow"][i]]),
      () => settings.specTheme, v => { settings.specTheme = v; saveUserPrefs(); syncAll(); }));
  const gain = el("label", "field");
  const gr = document.createElement("input"), gv = el("span", "mono");
  gr.type = "range"; gr.min = ".4"; gr.max = "2.5"; gr.step = ".05";
  gr.addEventListener("input", () => { settings.specGain = num(Number(gr.value), .4, 2.5, 1); gv.textContent = settings.specGain.toFixed(2) + "×"; saveUserPrefs(); });
  gain.append(tx("span", "specGain"), gr, gv);
  host.append(gain);
  SYNCS.push(() => { gr.value = String(settings.specGain); gv.textContent = settings.specGain.toFixed(2) + "×"; });
  host.append(mkCheck("specPeaks", () => settings.specPeaks, v => { settings.specPeaks = v; saveUserPrefs(); syncAll(); }));
  host.append(mkCheck("specTv", () => settings.specTv, v => { settings.specTv = v; saveUserPrefs(); syncAll(); }));
  host.append(tx("div", "specTvHint", "hint specTvHint"));
  return host;
}
function syncAll() {
  for (const f of SYNCS) { try { f(); } catch (e) { console.error(e); } }
  syncTvCanvas();
  updateStatus();
  kick();
}
/* 📺 TVの画面に重ねるキャンバス（要るときだけ DOM に出す） */
function syncTvCanvas() {
  const screenEl = document.querySelector("#tvDock .tvScreen");
  const want = !!screenEl && settings.specOn && settings.specTv && !isSafe();
  if (!want) { if (tvCanvas && tvCanvas.parentElement) tvCanvas.parentElement.removeChild(tvCanvas); return; }
  if (!tvCanvas) {
    tvCanvas = document.createElement("canvas");
    tvCanvas.className = "specTvCanvas";
    tvCanvas.setAttribute("aria-hidden", "true");
  }
  if (tvCanvas.parentElement !== screenEl) screenEl.append(tvCanvas);
}

addEventListener("DOMContentLoaded", () => {
  const col = document.querySelector(".songCol");
  const fxPanel = document.getElementById("fxPanel");
  const secSound = document.getElementById("seEnabled");
  saveUserPrefs();

  /* ① 🎛 ラックの「くわしい」の中（ドックの一部なので、ならべ替えの邪魔をしない）
     ⚠ くわしい欄は applyOrder() で #fxDock の外（.songCol の直下）へ動くことがあるので、
       入れ物は「もっと詳しい設定」ボタン（fx-dock.js が作る）から辿る */
  const moreBtn = document.querySelector('button[data-i18n="dockMore"]');
  const dockMore = moreBtn ? moreBtn.closest("details") : null;
  if (dockMore) {
    const box = el("div", "specBox");
    box.append(tx("h3", "specTitle"));
    buildBox(box, true);
    const dockStatus = el("div", "hint specStatus");
    statusNodes.push(dockStatus);
    box.append(dockStatus);
    if (moreBtn) moreBtn.before(box); else dockMore.append(box);
    dockMore.addEventListener("toggle", () => syncAll());
  }

  /* ② 設定画面「🔊 サウンド」の下（fx.js の #fxPanel の直後） */
  const panel = el("details", "panel"); panel.id = "specPanel";
  panel.append(tx("summary", "specTitle"));
  const spBox = el("div", "specBox");
  spBox.append(mkCheck("specOn", () => settings.specOn, v => { settings.specOn = v; saveUserPrefs(); syncAll(); }));
  buildBox(spBox, true);      // 設定画面でも、その場で見え方を確かめられる（開いているときだけ描く）
  const spStatus = el("div", "hint specStatus");
  statusNodes.push(spStatus);
  spBox.append(spStatus);
  spBox.append(tx("div", "specWebAudio", "hint specWebAudio"));
  spBox.append(tx("div", "specWhere", "hint specWhere"));
  panel.append(spBox);
  panel.addEventListener("toggle", () => syncAll());
  if (fxPanel) fxPanel.after(panel);
  else if (secSound && secSound.closest("details.panel")) secSound.closest("details.panel").after(panel);
  else if (col) col.append(panel);

  /* ③ 追従（画面・言語・映像・見た目の変化） */
  on("screen", () => syncAll());
  on("phase", () => syncAll());
  on("language", () => syncAll());
  on("chart", () => syncAll());
  addEventListener("resize", kick);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  for (const ev of ["play", "pause", "seeked", "loadeddata", "canplay"]) video.addEventListener(ev, kick);
  /* 音を見る準備は、ユーザーの操作の中だけでする（ブラウザの音の制限のため） */
  const arm = () => { hadGesture = true; if (wantLive() && !video.paused) ensureAnalyser(); };
  addEventListener("pointerdown", arm, true);
  addEventListener("keyup", arm, true);
  addEventListener("touchstart", arm, { capture: true, passive: true });

  syncAll();
});

/* ============ 窓口（テスト・アドオン用） ============ */
window.TrkSpec = Object.freeze({
  version: 1,
  styles: () => SPEC_STYLES.slice(),
  themes: () => SPEC_THEMES.slice(),
  style: () => settings.specStyle,
  theme: () => settings.specTheme,
  setStyle: id => { if (SPEC_STYLES.includes(id)) { settings.specStyle = id; saveUserPrefs(); syncAll(); return true; } return false; },
  setTheme: id => { if (SPEC_THEMES.includes(id)) { settings.specTheme = id; saveUserPrefs(); syncAll(); return true; } return false; },
  setOn: v => { settings.specOn = !!v; saveUserPrefs(); syncAll(); return settings.specOn; },
  showTv: v => { settings.specTv = !!v; saveUserPrefs(); syncAll(); return settings.specTv; },
  analyser: () => an,
  request: () => ensureAnalyser(),
  active: () => !!(settings.specOn && !isSafe() && (panelOn() || tvOn())),
  noAudio: () => specNoAudio,
  canvases: () => ({ panel: panelCanvases.slice(), tv: tvCanvas })
});
/* ✅ spectrum.js 完了 */
})();
