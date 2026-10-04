// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! spectrum.js — 📊 スペクトラム（音の見える化）  version 2
   --------------------------------------------------------------------------
   ・いま鳴っている音を、16種類の「見え方」で表示します。
       きほん：バー／ミラー／波形／リング
       きろく：DAW波形／VUメーター／LEDラダー／スペクトログラム
       はかる：心電図／地震計／レーダー
       しごと：業績グラフ（プレゼン風）／周波数ボード（株価ボード風）
       おもしろ：ピアノロール／嘘発見器／焚き火
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
  specHint:"いま鳴っている音を、16種類の見え方で表示できます。TVの画面に重ねることもできます。",
  specOn:"スペクトラムを表示する",
  specWhere:"🎛 ラックの「くわしい設定」の中と、設定 →「🔊 サウンド」の下にあります。",
  specStyle:"見え方",
  specStyleBars:"📊 バー", specStyleMirror:"🪞 ミラー", specStyleWave:"〰 波形", specStyleRing:"⭕ リング",
  specStyleDaw:"🎚 DAW波形", specStyleVu:"🧭 VUメーター", specStyleLed:"🔴 LEDラダー", specStyleSpectro:"🌈 スペクトログラム",
  specStyleEcg:"💓 心電図", specStyleSeismo:"📉 地震計", specStyleRadar:"📡 レーダー",
  specStylePiano:"🎹 ピアノロール", specStyleSlide:"📈 業績グラフ", specStyleBoard:"💹 周波数ボード",
  specStyleLie:"🤥 嘘発見器", specStyleFire:"🔥 焚き火",
  specTheme:"色",
  specThemeNeon:"ネオン", specThemeSunset:"夕焼け", specThemeMono:"モノクロ", specThemeRainbow:"レインボー",
  specGain:"感度",
  specPeaks:"ピーク（残像のライン）を出す",
  specTv:"📺 TVの画面にも重ねる",
  specTvHint:"選曲画面のテレビに、映像の上から重ねて表示します（初期はオフ）。ゲーム中は出ません。",
  specWebAudio:"※ 表示すると、音は本体のエフェクターと同じ通り道（Web Audio）を通ります。エフェクトを一度も使っていないときも、この表示をオンにすると通り道が作られます。判定の記録には影響しません。",
  specNoAudio:"このブラウザでは音を見られませんでした（Web Audio が使えないときに出ます）。",
  specIdle:"曲を再生すると動きます。",
  /* 絵の中に出る文字 */
  specEcgBpm:"♥ {n} BPM", specSeismoUnit:"震度", specDawRec:"REC",
  specSlideTitle:"第3四半期 業績", specSlideLegend:"実績", specSlideGoal:"目標", specSlideNow:"達成率 {n}%",
  specBoardTitle:"trk! 周波数ボード", specBoardNow:"現在",
  specLiePulse:"脈拍", specLieBreath:"呼吸", specLieSweat:"発汗", specLieStamp:"ウソ"
});
Object.assign(TEXT.en, {
  specTitle:"📊 Spectrum (see the sound)",
  specHint:"Show what is playing right now in 16 different views. You can also overlay it on the TV screen.",
  specOn:"Show the spectrum",
  specWhere:"You can find it in the rack's “More settings”, and in Settings → “🔊 Sound”.",
  specStyle:"Style",
  specStyleBars:"📊 Bars", specStyleMirror:"🪞 Mirror", specStyleWave:"〰 Wave", specStyleRing:"⭕ Ring",
  specStyleDaw:"🎚 DAW waveform", specStyleVu:"🧭 VU meter", specStyleLed:"🔴 LED ladder", specStyleSpectro:"🌈 Spectrogram",
  specStyleEcg:"💓 ECG", specStyleSeismo:"📉 Seismograph", specStyleRadar:"📡 Radar",
  specStylePiano:"🎹 Piano roll", specStyleSlide:"📈 Results chart", specStyleBoard:"💹 Frequency board",
  specStyleLie:"🤥 Lie detector", specStyleFire:"🔥 Campfire",
  specTheme:"Color",
  specThemeNeon:"Neon", specThemeSunset:"Sunset", specThemeMono:"Mono", specThemeRainbow:"Rainbow",
  specGain:"Sensitivity",
  specPeaks:"Show peaks (falling lines)",
  specTv:"📺 Overlay it on the TV too",
  specTvHint:"Draws it over the video on the song-select TV (off by default). It is hidden while playing.",
  specWebAudio:"Note: showing it routes the sound through the same Web Audio path as the effects. Even if you never used an effect, turning this on creates that path. It does not affect your records.",
  specNoAudio:"The sound could not be read in this browser (shown when Web Audio is unavailable).",
  specIdle:"Play a song to make it move.",
  specEcgBpm:"♥ {n} BPM", specSeismoUnit:"Mag.", specDawRec:"REC",
  specSlideTitle:"Q3 Results", specSlideLegend:"Actual", specSlideGoal:"Target", specSlideNow:"{n}% of target",
  specBoardTitle:"trk! Frequency board", specBoardNow:"LIVE",
  specLiePulse:"Pulse", specLieBreath:"Breath", specLieSweat:"Sweat", specLieStamp:"LIE"
});
Object.assign(TEXT.zh, {
  specTitle:"📊 频谱（把声音可视化）",
  specHint:"可以把正在播放的声音用16种样式显示。也可以叠加在电视画面上。",
  specOn:"显示频谱",
  specWhere:"位于 🎛 机架的“详细设置”中，以及 设置 →“🔊 声音”下方。",
  specStyle:"样式",
  specStyleBars:"📊 柱状", specStyleMirror:"🪞 镜像", specStyleWave:"〰 波形", specStyleRing:"⭕ 环形",
  specStyleDaw:"🎚 DAW波形", specStyleVu:"🧭 VU表", specStyleLed:"🔴 LED电平", specStyleSpectro:"🌈 声谱图",
  specStyleEcg:"💓 心电图", specStyleSeismo:"📉 地震仪", specStyleRadar:"📡 雷达",
  specStylePiano:"🎹 钢琴卷帘", specStyleSlide:"📈 业绩图表", specStyleBoard:"💹 频率看板",
  specStyleLie:"🤥 测谎仪", specStyleFire:"🔥 篝火",
  specTheme:"配色",
  specThemeNeon:"霓虹", specThemeSunset:"晚霞", specThemeMono:"黑白", specThemeRainbow:"彩虹",
  specGain:"灵敏度",
  specPeaks:"显示峰值（余晖线）",
  specTv:"📺 也叠加到电视画面上",
  specTvHint:"在选曲画面的电视上，覆盖显示在视频之上（默认关闭）。游戏过程中不显示。",
  specWebAudio:"※ 显示后，声音会经过与本体效果器相同的通道（Web Audio）。即使从未使用过效果器，开启此显示也会创建该通道。不会影响成绩记录。",
  specNoAudio:"此浏览器无法读取声音（Web Audio 不可用时显示）。",
  specIdle:"播放歌曲后就会动起来。",
  specEcgBpm:"♥ {n} BPM", specSeismoUnit:"震度", specDawRec:"REC",
  specSlideTitle:"第三季度业绩", specSlideLegend:"实际", specSlideGoal:"目标", specSlideNow:"达成率 {n}%",
  specBoardTitle:"trk! 频率看板", specBoardNow:"实时",
  specLiePulse:"脉搏", specLieBreath:"呼吸", specLieSweat:"出汗", specLieStamp:"说谎"
});
Object.assign(TEXT.ko, {
  specTitle:"📊 스펙트럼 (소리를 보이게)",
  specHint:"지금 나오는 소리를 16가지 모양으로 볼 수 있습니다. TV 화면에 겹쳐서 표시할 수도 있습니다.",
  specOn:"스펙트럼 표시",
  specWhere:"🎛 랙의 “자세한 설정” 안과 설정 →“🔊 사운드” 아래에 있습니다.",
  specStyle:"모양",
  specStyleBars:"📊 막대", specStyleMirror:"🪞 미러", specStyleWave:"〰 파형", specStyleRing:"⭕ 링",
  specStyleDaw:"🎚 DAW 파형", specStyleVu:"🧭 VU 미터", specStyleLed:"🔴 LED 래더", specStyleSpectro:"🌈 스펙트로그램",
  specStyleEcg:"💓 심전도", specStyleSeismo:"📉 지진계", specStyleRadar:"📡 레이더",
  specStylePiano:"🎹 피아노 롤", specStyleSlide:"📈 실적 그래프", specStyleBoard:"💹 주파수 보드",
  specStyleLie:"🤥 거짓말 탐지기", specStyleFire:"🔥 모닥불",
  specTheme:"색",
  specThemeNeon:"네온", specThemeSunset:"노을", specThemeMono:"모노크롬", specThemeRainbow:"무지개",
  specGain:"감도",
  specPeaks:"피크(잔상 라인) 표시",
  specTv:"📺 TV 화면에도 겹치기",
  specTvHint:"선곡 화면의 TV에서 영상 위에 겹쳐 표시합니다(기본 꺼짐). 플레이 중에는 나오지 않습니다.",
  specWebAudio:"※ 표시하면 소리가 본체 이펙터와 같은 길(Web Audio)을 지납니다. 이펙트를 한 번도 쓰지 않았어도 이 표시를 켜면 길이 만들어집니다. 기록에는 영향을 주지 않습니다.",
  specNoAudio:"이 브라우저에서는 소리를 볼 수 없습니다 (Web Audio를 쓸 수 없을 때 표시됩니다).",
  specIdle:"곡을 재생하면 움직입니다.",
  specEcgBpm:"♥ {n} BPM", specSeismoUnit:"진도", specDawRec:"REC",
  specSlideTitle:"3분기 실적", specSlideLegend:"실적", specSlideGoal:"목표", specSlideNow:"달성률 {n}%",
  specBoardTitle:"trk! 주파수 보드", specBoardNow:"실시간",
  specLiePulse:"맥박", specLieBreath:"호흡", specLieSweat:"발한", specLieStamp:"거짓"
});

/* ============ 設定（core.js の settings に足す） ============ */
/* 見え方（順番がチップの並び順） */
const STYLE_KEYS = {
  bars:"specStyleBars", mirror:"specStyleMirror", wave:"specStyleWave", ring:"specStyleRing",
  daw:"specStyleDaw", vu:"specStyleVu", led:"specStyleLed", spectro:"specStyleSpectro",
  ecg:"specStyleEcg", seismo:"specStyleSeismo", radar:"specStyleRadar",
  piano:"specStylePiano", slide:"specStyleSlide", board:"specStyleBoard",
  lie:"specStyleLie", fire:"specStyleFire"
};
const SPEC_STYLES = Object.keys(STYLE_KEYS);
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
   ・作るのはユーザーの操作（クリック・キー）のあとだけ。ブラウザは操作のあとでないと
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

/* ============ 小さな道具（色・履歴・数字） ============ */
const FONT = (size, weight) => `${weight ? weight + " " : ""}${Math.max(8, Math.round(size))}px ${FONT_DEFAULT}`;
const MONO = size => `${Math.max(8, Math.round(size))}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;

function themeColor(theme, i, n, v) {
  const t = n > 1 ? i / (n - 1) : 0;
  /* カンマ区切りの hsl() で書く（スペース区切りは新しいブラウザしか読めないため） */
  if (theme === "sunset") return `hsl(${Math.round(40 + t * 300)}, 95%, ${Math.round(56 + v * 12)}%)`;   // 山吹 → ピンク
  if (theme === "mono") return `hsl(0, 0%, ${Math.round(68 + v * 30)}%)`;
  if (theme === "rainbow") return `hsl(${Math.round(t * 320)}, 92%, ${Math.round(58 + v * 10)}%)`;
  return `hsl(${Math.round(188 + t * 132)}, 100%, ${Math.round(56 + v * 12)}%)`;   // neon：シアン → マゼンタ
}
/* スペクトログラムの色（静か＝青 → うるさい＝赤白） */
function heatColor(v) {
  const k = Math.max(0, Math.min(1, v));
  return `hsl(${Math.round(250 - k * 250)}, 95%, ${Math.round(6 + k * k * 68)}%)`;
}
function avgRange(a, from, to) {
  const n = a.length; if (!n) return 0;
  let i0 = Math.max(0, Math.floor(from * n)), i1 = Math.max(i0 + 1, Math.min(n, Math.round(to * n)));
  let s = 0; for (let i = i0; i < i1; i++) s += a[i];
  return s / (i1 - i0);
}
/* 時間のゆれ（波形データ）から、ざっくりした大きさ 0..1 */
function rms01(a) {
  if (!a || !a.length) return 0;
  let s = 0, c = 0;
  for (let i = 0; i < a.length; i += 4) { const v = (a[i] - 128) / 128; s += v * v; c++; }
  return Math.min(1, Math.sqrt(s / Math.max(1, c)) * 2.4);
}
function bpmNow() {
  const b = (typeof chartMeta !== "undefined" && chartMeta && chartMeta.bpm) ? chartMeta.bpm : 0;
  return b > 0 ? Math.round(b) : 0;
}
/* 帯ごとの履歴（リングバッファ）。st[key + "I"] が「次に書く場所」＝いちばん古い場所 */
function ringPush(st, key, len, v) {
  let a = st[key];
  if (!a || a.length !== len) { a = st[key] = new Float32Array(len); a.fill(0); st[key + "I"] = 0; }
  const i = st[key + "I"];
  a[i] = v;
  st[key + "I"] = (i + 1) % len;
  return a;
}
function ringAt(st, key, k) {           // k=0 がいちばん古い
  const a = st[key]; if (!a) return 0;
  return a[(st[key + "I"] + k) % a.length];
}
/* 針（少し跳ねる） */
function needleStep(st, key, target) {
  const v = st[key] || 0, vel = st[key + "V"] || 0;
  const nv = v + vel + (target - v) * .22;
  st[key + "V"] = (nv - v) * .55;
  st[key] = Math.max(0, Math.min(1.05, nv));
  return st[key];
}

/* ============ 見え方（16種） ============
   どの関数も (S, g, W, H) を受け取ります。
   S = { vals, wave, live, theme, peaks, reduced, cv, st, kind, t, n }
     vals … 40Hz〜14kHz を対数で分けた帯の強さ（0..1）
     wave … 時間のゆれ（0..255、128が真ん中）／ live … いま音を読めているか      */
function drawBars(S, g, W, H) {
  const n = S.vals.length, step = W / n, bw = Math.max(2, step * .74);
  const mirror = !!S.mirror;
  const base = mirror ? H / 2 : H * .92;
  const pk = peakOf(S.cv, n);
  for (let i = 0; i < n; i++) {
    const v = S.vals[i];
    pk[i] = Math.max(v, pk[i] - .02);
    const x = i * step + (step - bw) / 2;
    g.fillStyle = themeColor(S.theme, i, n, v);
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
    if (S.peaks && pk[i] > .03) {
      const ph = Math.max(2, pk[i] * (mirror ? base * .96 : base));
      g.fillStyle = "rgba(255,255,255,.85)";
      g.fillRect(x, (mirror ? H / 2 : base) - ph, bw, 2);
    }
  }
}
function drawWave(S, g, W, H) {
  const n = S.vals.length, step = W / n, bw = Math.max(2, step * .8);
  g.globalAlpha = .3;                                        // うしろに周波数のミラー
  for (let i = 0; i < n; i++) {
    const v = S.vals[i], hh = v * H * .42;
    g.fillStyle = themeColor(S.theme, i, n, v);
    g.fillRect(i * step + (step - bw) / 2, H / 2 - hh, bw, hh * 2);
  }
  g.globalAlpha = 1;
  if (!S.live || !S.wave || !S.wave.length) return;
  const len = S.wave.length;
  g.beginPath();
  for (let x = 0; x < W; x++) {
    const k = Math.min(len - 1, Math.floor(x / W * len));
    const y = H / 2 + ((S.wave[k] - 128) / 128) * (H * .42);
    if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.lineWidth = Math.max(1.5, H * .014);
  g.strokeStyle = themeColor(S.theme, 0, 1, .85);
  g.shadowColor = g.strokeStyle;
  g.shadowBlur = Math.max(2, H * .07);
  g.stroke();
  g.shadowBlur = 0;
}
function drawRing(S, g, W, H) {
  const n = S.vals.length, cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * .24, len = Math.min(W, H) * .2;
  g.save(); g.translate(cx, cy);
  for (let i = 0; i < n; i++) {
    const v = S.vals[i], a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r1 = R + Math.max(1, v * len);
    g.strokeStyle = themeColor(S.theme, i, n, v);
    g.lineWidth = Math.max(1.5, Math.min(W, H) / n * 1.7);
    g.beginPath();
    g.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    g.stroke();
  }
  g.restore();
}
/* ---- 🎚 DAW波形：録音ソフトのタイムライン（波形・再生ヘッド・dB目盛り・REC） ---- */
function drawDaw(S, g, W, H) {
  const st = S.st, len = Math.max(64, Math.round(W));
  ringPush(st, "daw", len, Math.min(1, rms01(S.wave) * 1.5));
  g.fillStyle = "rgba(9,13,20,.80)"; g.fillRect(0, 0, W, H);
  const step = Math.max(16, W / 8);
  g.strokeStyle = "rgba(120,170,255,.13)"; g.lineWidth = 1;
  for (let x = step; x < W; x += step) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  for (const k of [.25, .75]) { g.beginPath(); g.moveTo(0, H * k + .5); g.lineTo(W, H * k + .5); g.stroke(); }
  g.strokeStyle = "rgba(140,190,255,.34)";
  g.beginPath(); g.moveTo(0, H * .5 + .5); g.lineTo(W, H * .5 + .5); g.stroke();
  for (let x = 0; x < W; x++) {
    const v = ringAt(st, "daw", Math.floor(x / W * len));
    const hh = v * H * .42;
    g.fillStyle = themeColor(S.theme, x / W, 1, v);
    g.fillRect(x, H * .5 - hh, 1, hh * 2);
  }
  const px = Math.round(W * .74);                            // 再生ヘッド
  g.fillStyle = "rgba(255,77,94,.22)"; g.fillRect(px - 6, 0, 6, H);
  g.fillStyle = "#ff4d5e"; g.fillRect(px, 0, 2, H);
  if (S.live && Math.floor(S.t / 500) % 2 === 0) { g.fillStyle = "#ff4d5e"; g.beginPath(); g.arc(11, 12, 5, 0, 6.284); g.fill(); }
  g.fillStyle = "rgba(210,225,255,.8)"; g.font = MONO(H * .13); g.textAlign = "left"; g.textBaseline = "top";
  g.fillText(tr("specDawRec"), 21, 5);
  g.textAlign = "right"; g.fillStyle = "rgba(160,200,255,.5)";
  g.fillText("0", W - 5, 3); g.fillText("-12", W - 5, H * .34); g.fillText("-24", W - 5, H * .62);
}
/* ---- 🧭 VUメーター：アナログの針2本（L/R） ---- */
function vuFace(g, x, y, w, h, v, theme, label) {
  g.fillStyle = "rgba(246,240,222,.95)";
  rr2(g, x, y, w, h);
  g.strokeStyle = "rgba(60,50,30,.55)"; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  const cx = x + w / 2, cy = y + h * 1.02, R = h * .96;
  const a0 = -Math.PI * .42, a1 = Math.PI * .42;
  g.strokeStyle = "rgba(40,35,20,.75)"; g.lineWidth = 3;      // 目盛りの弧
  g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 + a0, -Math.PI / 2 + a1); g.stroke();
  for (let i = 0; i <= 8; i++) {                              // 目盛り
    const a = a0 + (a1 - a0) * i / 8, rad = -Math.PI / 2 + a;
    const inner = i >= 6 ? .86 : .9;
    g.strokeStyle = i >= 6 ? "rgba(200,30,30,.9)" : "rgba(40,35,20,.75)";
    g.lineWidth = i >= 6 ? 3 : 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(rad) * R * inner, cy + Math.sin(rad) * R * inner);
    g.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R);
    g.stroke();
  }
  g.strokeStyle = "rgba(200,30,30,.85)"; g.lineWidth = 3;     // 赤ゾーン
  g.beginPath(); g.arc(cx, cy, R * .95, -Math.PI / 2 + a0 + (a1 - a0) * .75, -Math.PI / 2 + a1); g.stroke();
  const a = a0 + (a1 - a0) * Math.min(1, v);                  // 針
  g.strokeStyle = "#1a1a1a"; g.lineWidth = Math.max(1.5, h * .03);
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-Math.PI / 2 + a) * R * .94, cy + Math.sin(-Math.PI / 2 + a) * R * .94); g.stroke();
  g.fillStyle = "#333"; g.beginPath(); g.arc(cx, cy, Math.max(2, h * .06), 0, 6.284); g.fill();
  g.fillStyle = "rgba(40,35,20,.85)"; g.font = FONT(h * .18, "700"); g.textAlign = "center"; g.textBaseline = "top";
  g.fillText("VU", cx, y + h * .12);
  g.font = FONT(h * .16, "700"); g.fillStyle = themeColor(theme, label === "L" ? 0 : 1, 1, .6);
  g.fillText(label, x + w * .12, y + h * .1);
}
function drawVu(S, g, W, H) {
  const st = S.st;
  const lv = Math.min(1, avgRange(S.vals, 0, .45) * 1.35 + .02);
  const rv = Math.min(1, avgRange(S.vals, .45, 1) * 1.45 + .02);
  const l = needleStep(st, "vuL", lv), r = needleStep(st, "vuR", rv);
  const pad = Math.max(3, W * .015), w = (W - pad * 3) / 2, h = H * .8;
  vuFace(g, pad, H * .08, w, h, l, S.theme, "L");
  vuFace(g, pad * 2 + w, H * .08, w, h, r, S.theme, "R");
}
/* ---- 🔴 LEDラダー：カセットデッキのレベルメーター（クリップ保持つき） ---- */
function ledLadder(S, g, x, y, w, h, v, key) {
  const st = S.st, segs = Math.max(8, Math.min(20, Math.round(h / 7)));
  const gap = Math.max(1, h / segs * .18), sh = h / segs - gap;
  const lit = Math.round(v * segs);
  const pk = Math.max(lit, (st[key + "Pk"] || 0) - (S.t - (st[key + "Pt"] || 0) > 700 ? .35 : 0));
  st[key + "Pk"] = Math.min(segs, pk); st[key + "Pt"] = S.t;
  for (let i = 0; i < segs; i++) {
    const yy = y + h - (i + 1) * (h / segs) + gap / 2;
    const col = i >= segs - 2 ? "#ff3b30" : i >= segs - 5 ? "#ffcc00" : "#33d17a";
    const on = i < lit;
    g.globalAlpha = on ? 1 : .12;
    g.fillStyle = on ? col : "#ffffff";
    rr2(g, x, yy, w, sh);
    if (on) { g.shadowColor = col; g.shadowBlur = Math.max(2, w * .3); rr2(g, x, yy, w, sh); g.shadowBlur = 0; }
    g.globalAlpha = 1;
  }
  const pi = Math.round(st[key + "Pk"]);
  if (pi > 0) {
    const yy = y + h - pi * (h / segs);
    g.fillStyle = "rgba(255,255,255,.9)";
    g.fillRect(x, yy, w, Math.max(2, h / segs * .18));
  }
  if (v >= .985) st.clipUntil = S.t + 1500;
}
function drawLed(S, g, W, H) {
  const st = S.st;
  const lv = Math.min(1, avgRange(S.vals, 0, .45) * 1.3 + .01);
  const rv = Math.min(1, avgRange(S.vals, .45, 1) * 1.4 + .01);
  const w = Math.max(10, W * .11), h = H * .78, y = H * .10;
  g.fillStyle = "rgba(8,9,12,.72)"; g.fillRect(0, 0, W, H);
  ledLadder(S, g, W * .34 - w / 2, y, w, h, lv, "ledL");
  ledLadder(S, g, W * .66 - w / 2, y, w, h, rv, "ledR");
  g.font = MONO(H * .12); g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(220,230,240,.75)";
  g.fillText("L", W * .34, H * .95); g.fillText("R", W * .66, H * .95);
  g.textAlign = "right"; g.fillStyle = "rgba(200,220,240,.5)";
  g.fillText("0dB", W * .34 - w * .8, H * .14); g.fillText("-30", W * .34 - w * .8, H * .84);
  g.textAlign = "left"; g.fillStyle = "rgba(200,220,240,.5)";
  g.fillText("0dB", W * .66 + w * .8, H * .14); g.fillText("-30", W * .66 + w * .8, H * .84);
  if (S.t < (st.clipUntil || 0) && Math.floor(S.t / 250) % 2 === 0) {
    g.fillStyle = "#ff3b30"; g.textAlign = "center"; g.textBaseline = "top"; g.font = FONT(H * .18, "900");
    g.fillText("CLIP", W / 2, 2);
  }
}
/* ---- 🌈 スペクトログラム：時間×周波数のヒートマップ（右から左へ流れる） ---- */
function drawSpectro(S, g, W, H) {
  const st = S.st;
  if (!st.sp || st.sp.width !== Math.max(2, W) || st.sp.height !== Math.max(2, H)) {
    st.sp = document.createElement("canvas");
    st.sp.width = Math.max(2, W); st.sp.height = Math.max(2, H);
    st.spC = st.sp.getContext("2d"); st.spX = 0;
    if (st.spC) { st.spC.fillStyle = "#04070c"; st.spC.fillRect(0, 0, W, H); }
  }
  const c = st.spC;
  if (!c) { g.fillStyle = "#04070c"; g.fillRect(0, 0, W, H); return; }
  const n = S.vals.length;
  st.spX = (st.spX + Math.max(1, Math.round(W / 240))) % st.sp.width;
  for (let i = 0; i < n; i++) {
    const v = S.vals[i];
    const y = H - 1 - (i + 1) / n * H, hh = Math.max(1, H / n + 1);
    c.fillStyle = heatColor(v);
    c.fillRect(st.spX, y, Math.max(1, W / 240), hh);
  }
  g.fillStyle = "#04070c"; g.fillRect(0, 0, W, H);
  g.drawImage(st.sp, st.spX + 1 - st.sp.width, 0);
  g.drawImage(st.sp, st.spX + 1, 0);
  g.fillStyle = "rgba(255,255,255,.55)"; g.font = MONO(H * .11); g.textAlign = "left"; g.textBaseline = "top";
  g.fillText("16k", 4, 3); g.fillText("1k", 4, H * .48); g.fillText("40", 4, H - 12);
}
/* ---- 💓 心電図：緑のモニター（BPMつき） ---- */
function drawEcg(S, g, W, H) {
  const st = S.st;
  g.fillStyle = "rgba(3,11,7,.86)"; g.fillRect(0, 0, W, H);
  const fine = Math.max(6, H * .1);
  g.strokeStyle = "rgba(0,255,140,.09)"; g.lineWidth = 1;
  for (let x = fine; x < W; x += fine) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  for (let y = fine; y < H; y += fine) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
  g.strokeStyle = "rgba(0,255,140,.18)";
  for (let x = fine * 5; x < W; x += fine * 5) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  for (let y = fine * 5; y < H; y += fine * 5) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
  const len = Math.max(64, Math.round(W));
  const step = Math.max(1, Math.round(W / 90));
  for (let i = 0; i < step; i++) {
    const k = S.wave && S.wave.length ? Math.floor(i / step * S.wave.length) : 0;
    const raw = S.live && S.wave ? (S.wave[k] - 128) / 128 : 0;
    ringPush(st, "ecg", len, Math.max(-1, Math.min(1, raw * 1.7)));
  }
  g.strokeStyle = "#39ff9a"; g.lineWidth = Math.max(1.4, H * .012);
  g.shadowColor = "#39ff9a"; g.shadowBlur = Math.max(2, H * .07);
  g.beginPath();
  for (let x = 0; x < W; x++) {
    const y = H * .5 - ringAt(st, "ecg", Math.min(len - 1, Math.floor(x / W * len))) * H * .40;
    if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  g.shadowBlur = 0;
  g.fillStyle = "#39ff9a"; g.textAlign = "left"; g.textBaseline = "top";
  g.font = FONT(H * .2, "700"); g.fillText("♥", 7, 4);
  g.font = MONO(H * .13);
  g.fillText(tr("specEcgBpm", { n: bpmNow() || "--" }), 7, H * .28);
  const lastY = H * .5 - ringAt(st, "ecg", len - 1) * H * .40;   // 先端の点
  if (Math.floor(S.t / 400) % 2 === 0) { g.beginPath(); g.arc(W - 4, lastY, Math.max(2, H * .035), 0, 6.284); g.fill(); }
}
/* ---- 📉 地震計：ドラム紙に赤い針が揺れを描く（震度つき） ---- */
function drawSeismo(S, g, W, H) {
  const st = S.st;
  g.fillStyle = "rgba(249,244,229,.95)"; g.fillRect(0, 0, W, H);
  const grid = Math.max(7, H * .08);
  g.strokeStyle = "rgba(214,150,70,.32)"; g.lineWidth = 1;
  for (let x = grid; x < W; x += grid) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  for (let y = grid; y < H; y += grid) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
  g.strokeStyle = "rgba(150,110,60,.4)";
  g.beginPath(); g.moveTo(0, H * .5 + .5); g.lineTo(W, H * .5 + .5); g.stroke();
  const len = Math.max(64, Math.round(W));
  const step = Math.max(1, Math.round(W / 130));
  for (let i = 0; i < step; i++) {
    const k = S.wave && S.wave.length ? Math.floor(i / step * S.wave.length) : 0;
    const raw = S.live && S.wave ? (S.wave[k] - 128) / 128 : 0;
    ringPush(st, "sei", len, Math.max(-1, Math.min(1, raw * 1.9)));
  }
  g.strokeStyle = "#b71c1c"; g.lineWidth = Math.max(1, H * .014);
  g.beginPath();
  for (let x = 0; x < W; x++) {
    const y = H * .5 - ringAt(st, "sei", Math.min(len - 1, Math.floor(x / W * len))) * H * .38;
    if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.stroke();
  g.fillStyle = "rgba(120,20,20,.85)"; g.fillRect(W - 3, H * .07, 2, H * .86);   // 針
  const mag = Math.min(7, rms01(S.wave) * 16);
  g.fillStyle = "#5d4037"; g.textAlign = "left"; g.textBaseline = "top";
  g.font = FONT(H * .15, "700");
  g.fillText(`${tr("specSeismoUnit")} ${mag < .05 ? "0.0" : mag.toFixed(1)}`, 7, 4);
}
/* ---- 📡 レーダー：掃引とブリップ（残像つき） ---- */
function drawRadar(S, g, W, H) {
  const st = S.st;
  g.fillStyle = "rgba(2,10,6,.30)"; g.fillRect(0, 0, W, H);      // 少しずつ消して残像に
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .45;
  g.strokeStyle = "rgba(0,255,140,.22)"; g.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(cx, cy, R * i / 4, 0, 6.284); g.stroke(); }
  g.beginPath();
  g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
  st.rot = ((st.rot || 0) + .028) % 6.284;
  g.strokeStyle = "rgba(120,255,180,.85)"; g.lineWidth = Math.max(1.5, H * .014);
  g.beginPath(); g.moveTo(cx, cy);
  g.lineTo(cx + Math.cos(st.rot) * R, cy + Math.sin(st.rot) * R); g.stroke();
  const n = S.vals.length;
  for (let i = 0; i < n; i++) {
    const v = S.vals[i];
    if (v < .22) continue;
    const a = (i / n) * 6.284 + st.rot * .18;
    const rr = R * (.16 + v * .8);
    g.globalAlpha = Math.min(1, v * 1.35);
    g.fillStyle = v > .66 ? "#eafff2" : heatColor(v);
    g.beginPath();
    g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.max(1.2, v * H * .035), 0, 6.284);
    g.fill();
    g.globalAlpha = 1;
  }
  g.fillStyle = "rgba(130,255,190,.7)"; g.font = MONO(H * .1); g.textAlign = "left"; g.textBaseline = "top";
  g.fillText("16k", cx + 3, cy - R + 2); g.fillText("4k", cx + R - 20, cy - 12); g.fillText("40", cx + 3, cy + R - 12);
}
/* ---- 🎹 ピアノロール：鍵盤と、音に反応するノート ---- */
function drawPiano(S, g, W, H) {
  const keys = Math.max(12, Math.min(28, Math.round(W / 20)));
  const kbH = H * .30, top = H - kbH, kw = W / keys;
  g.fillStyle = "rgba(7,8,14,.78)"; g.fillRect(0, 0, W, H);
  for (let i = 0; i < keys; i++) {
    const v = Math.min(1, S.vals[Math.min(S.vals.length - 1, Math.floor(i / keys * S.vals.length))] * 1.25);
    const x = i * kw;
    const bh = Math.max(1, v * (top - 2) * .94);                  // ノート（鍵盤の上に伸びる）
    g.fillStyle = themeColor(S.theme, i, keys, v);
    g.fillRect(x + 2, top - bh, Math.max(2, kw - 4), bh);
    if (v > .5) { g.globalAlpha = (v - .5) * .8; rr2(g, x + 2, top - bh - 3, Math.max(2, kw - 4), 3); g.globalAlpha = 1; }
    const lit = v > .12;                                          // 鍵盤
    g.fillStyle = lit ? themeColor(S.theme, i, keys, Math.min(1, v)) : "rgba(240,242,248,.92)";
    g.fillRect(x + 1, top, Math.max(2, kw - 2), kbH - 2);
    g.fillStyle = "rgba(0,0,0,.16)";
    g.fillRect(x + 1, top + kbH * .55, Math.max(2, kw - 2), Math.max(2, kbH * .3));   // 黒鍵の帯
  }
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, top + .5); g.lineTo(W, top + .5); g.stroke();
}
/* ---- 📈 業績グラフ：プレゼン資料風（達成率つき） ---- */
function drawSlide(S, g, W, H) {
  g.fillStyle = "rgba(250,251,253,.95)"; g.fillRect(0, 0, W, H);
  const barH = Math.max(14, H * .24);
  g.fillStyle = "#1b3a6b"; g.fillRect(0, 0, W, barH);
  g.fillStyle = "#ffffff"; g.font = FONT(barH * .52, "700"); g.textAlign = "left"; g.textBaseline = "middle";
  g.fillText(tr("specSlideTitle"), 8, barH * .52);
  const lv = avgRange(S.vals, 0, 1);
  const pct = Math.round(72 + lv * 96);
  g.textAlign = "right";
  g.fillStyle = pct >= 100 ? "#8ef0b0" : "#ffd166";
  g.font = FONT(barH * .52, "700");
  g.fillText((pct >= 100 ? "↗ " : "↘ ") + tr("specSlideNow", { n: pct }), W - 8, barH * .52);
  const n = Math.max(6, Math.min(12, Math.round(W / 46)));
  const gx = W * .05, gy = barH + H * .12, gw = W * .90, gh = Math.max(10, H - gy - H * .17);
  g.strokeStyle = "rgba(27,58,107,.22)"; g.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = gy + gh * i / 4; g.beginPath(); g.moveTo(gx, y + .5); g.lineTo(gx + gw, y + .5); g.stroke(); }
  const slot = gw / n, bw = slot * .62;
  for (let i = 0; i < n; i++) {
    const v = Math.min(1, S.vals[Math.min(S.vals.length - 1, Math.floor(i / n * S.vals.length))] * 1.3);
    const h = Math.max(2, v * gh), x = gx + i * slot + (slot - bw) / 2;
    const grd = g.createLinearGradient(0, gy + gh - h, 0, gy + gh);
    grd.addColorStop(0, "#5aa9e6"); grd.addColorStop(1, "#1b3a6b");
    g.fillStyle = grd; g.fillRect(x, gy + gh - h, bw, h);
    g.fillStyle = "rgba(233,140,0,.75)";                            // 目標ライン
    g.fillRect(x, Math.max(gy, gy + gh - v * .82 * gh), bw, 2);
  }
  g.textAlign = "left"; g.textBaseline = "bottom";
  g.font = FONT(H * .115, "700");
  g.fillStyle = "#1b3a6b"; g.fillText("■ " + tr("specSlideLegend"), gx, H - 5);
  g.fillStyle = "rgba(214,124,0,.95)"; g.fillText("▬ " + tr("specSlideGoal"), gx + gw * .45, H - 5);
}
/* ---- 💹 周波数ボード：株価ボード風（帯ごとの数値と▲▼） ---- */
function drawBoard(S, g, W, H) {
  const st = S.st;
  g.fillStyle = "rgba(6,8,12,.92)"; g.fillRect(0, 0, W, H);
  const head = Math.max(14, H * .18);
  g.fillStyle = "rgba(255,183,3,.10)"; g.fillRect(0, 0, W, head);
  g.fillStyle = "#ffb703"; g.font = MONO(head * .62); g.textAlign = "left"; g.textBaseline = "middle";
  g.fillText(tr("specBoardTitle"), 7, head * .52);
  g.textAlign = "right";
  g.fillStyle = "rgba(255,183,3,.8)";
  g.fillText(tr("specBoardNow"), W - 20, head * .52);
  if (Math.floor(S.t / 600) % 2 === 0) { g.fillStyle = "#3ddc84"; g.beginPath(); g.arc(W - 10, head * .5, 3.5, 0, 6.284); g.fill(); }
  const names = ["40-200", "200-1k", "1k-4k", "4k-16k"], rows = names.length;
  const rowH = (H - head) / rows;
  for (let i = 0; i < rows; i++) {
    const v = Math.min(1, avgRange(S.vals, i / rows, (i + 1) / rows) * 1.35);
    const y = head + i * rowH;
    g.fillStyle = i % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.07)";
    g.fillRect(0, y, W, rowH - 1);
    g.fillStyle = "#ffd166"; g.font = MONO(rowH * .42); g.textAlign = "left"; g.textBaseline = "middle";
    g.fillText(names[i], 7, y + rowH / 2);
    const blocks = 10, bx = W * .28, bw = Math.max(3, (W * .38) / blocks);
    for (let b = 0; b < blocks; b++) {
      const on = Math.round(v * blocks) > b;
      g.fillStyle = on ? (b >= 8 ? "#ff5252" : b >= 6 ? "#ffd166" : "#3ddc84") : "rgba(255,255,255,.10)";
      g.fillRect(bx + b * bw + 1, y + rowH * .30, bw - 2, rowH * .40);
    }
    const prev = st["bd" + i] || 0;
    const up = v >= prev;
    st["bd" + i] = v;
    g.textAlign = "right"; g.fillStyle = up ? "#ff6b6b" : "#4aa3ff";
    g.font = MONO(rowH * .42);
    g.fillText(`${up ? "▲" : "▼"} ${(v * 60 - 60).toFixed(1)}`, W - 7, y + rowH / 2);
  }
}
/* ---- 🤥 嘘発見器：3本の記録紙と「ウソ」スタンプ ---- */
function drawLie(S, g, W, H) {
  const st = S.st, len = Math.max(64, Math.round(W));
  g.fillStyle = "rgba(250,246,236,.95)"; g.fillRect(0, 0, W, H);
  const grid = Math.max(8, H * .07);
  g.strokeStyle = "rgba(150,120,90,.16)"; g.lineWidth = 1;
  for (let x = grid; x < W; x += grid) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
  const step = Math.max(1, Math.round(W / 110));
  for (let i = 0; i < step; i++) {
    const k = S.wave && S.wave.length ? Math.floor(i / step * S.wave.length) : 0;
    const raw = S.live && S.wave ? (S.wave[k] - 128) / 128 : 0;
    ringPush(st, "lieP", len, raw * 1.1);
    ringPush(st, "lieB", avgRange(S.vals, 0, .28) * 1.5 - .25 + raw * .18);
    ringPush(st, "lieS", avgRange(S.vals, .5, 1) * 1.7 - .2 + (Math.random() - .5) * .06);
  }
  const trace = (key, color, y0, amp, width) => {
    g.strokeStyle = color; g.lineWidth = Math.max(1, H * width);
    g.beginPath();
    for (let x = 0; x < W; x++) {
      const y = y0 - ringAt(st, key, Math.min(len - 1, Math.floor(x / W * len))) * amp;
      if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  };
  trace("lieB", "#1565c0", H * .43, H * .16, .011);
  trace("lieS", "#2e7d32", H * .70, H * .12, .011);
  trace("lieP", "#c62828", H * .24, H * .17, .013);
  g.font = FONT(H * .115, "700"); g.textAlign = "left"; g.textBaseline = "top";
  g.fillStyle = "rgba(198,40,40,.9)"; g.fillText(tr("specLiePulse"), 5, 3);
  g.fillStyle = "rgba(21,101,192,.9)"; g.fillText(tr("specLieBreath"), 5, H * .30);
  g.fillStyle = "rgba(46,125,50,.9)"; g.fillText(tr("specLieSweat"), 5, H * .56);
  const lv = avgRange(S.vals, 0, 1);
  st.lieMark = (st.lieMark || 0) * .78 + lv * .22;            // 急に大きくなったら反応
  if (lv > st.lieMark + .20) st.lieUntil = S.t + 1500;
  if (S.t < (st.lieUntil || 0)) {
    const k = Math.min(1, (st.lieUntil - S.t) / 1500);
    g.save(); g.translate(W * .76, H * .5); g.rotate(-.16);
    g.globalAlpha = .35 + .55 * k;
    g.strokeStyle = "#c62828"; g.lineWidth = Math.max(2, H * .02);
    g.strokeRect(-W * .17, -H * .17, W * .34, H * .34);
    g.fillStyle = "#c62828"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = FONT(H * .26, "900");
    g.fillText(tr("specLieStamp"), 0, 0);
    g.restore();
  }
}
/* ---- 🔥 焚き火：炎と火の粉 ---- */
function drawFire(S, g, W, H) {
  const st = S.st;
  g.fillStyle = "rgba(8,5,3,.76)"; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H * .95);                       // 薪
  g.fillStyle = "#4a2c15";
  g.rotate(-.07); g.fillRect(-W * .32, -H * .05, W * .64, H * .08);
  g.rotate(.14); g.fillRect(-W * .32, -H * .05, W * .64, H * .08);
  g.restore();
  const band = Math.max(5, Math.min(14, Math.round(W / 36)));
  const n = S.vals.length;
  for (let i = 0; i < band; i++) {
    const v = S.vals[Math.min(n - 1, Math.floor(i / band * n * .8))];
    const x0 = (i + .5) / band * W;
    const sway = Math.sin(S.t / 380 + i * 1.7) * W * .012;
    const h = Math.max(H * .05, v * H * .74), w = W / band * .92;
    const grd = g.createLinearGradient(0, H, 0, H - h);
    grd.addColorStop(0, "rgba(255,80,0,.85)");
    grd.addColorStop(.5, "rgba(255,170,40,.7)");
    grd.addColorStop(1, "rgba(255,245,170,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(x0 - w / 2, H * .92);
    g.quadraticCurveTo(x0 - w / 2 + sway, H - h * .5, x0 + sway, H - h);
    g.quadraticCurveTo(x0 + w / 2 + sway, H - h * .5, x0 + w / 2, H * .92);
    g.closePath(); g.fill();
  }
  if (!st.embers) st.embers = [];
  const lv = avgRange(S.vals, 0, 1);
  if (st.embers.length < 42 && Math.random() < .1 + lv * .5) {
    st.embers.push({ x: W / 2 + (Math.random() - .5) * W * .45, y: H * .84, vy: -(.5 + Math.random() * 1.3), vx: (Math.random() - .5) * .5, life: 1 });
  }
  for (const e of st.embers) { e.y += e.vy; e.x += e.vx; e.life -= .012; }
  st.embers = st.embers.filter(e => e.life > 0 && e.y > -8);
  for (const e of st.embers) {
    g.fillStyle = `rgba(255,${190 + Math.round(50 * e.life)},90,${(e.life * .9).toFixed(2)})`;
    g.fillRect(e.x, e.y, 2, 2);
  }
}
const STYLE_DRAW = {
  bars: (S, g, W, H) => drawBars(S, g, W, H),
  mirror: (S, g, W, H) => drawBars(S, g, W, H),
  wave: drawWave, ring: drawRing,
  daw: drawDaw, vu: drawVu, led: drawLed, spectro: drawSpectro,
  ecg: drawEcg, seismo: drawSeismo, radar: drawRadar,
  piano: drawPiano, slide: drawSlide, board: drawBoard, lie: drawLie, fire: drawFire
};
const IDLE_LINE = { bars: 1, mirror: 1, wave: 1 };              // 音が無いときの平らな線を出す見え方

/* ---- キャンバス1枚ぶんの状態（ピーク・履歴・針・粒子） ---- */
const STATES = new WeakMap();
function stateOf(cv) {
  let st = STATES.get(cv);
  if (!st) { st = { pk: null, embers: null, sp: null, spX: 0 }; STATES.set(cv, st); }
  return st;
}
function peakOf(cv, n) {
  const st = stateOf(cv);
  if (!st.pk || st.pk.length !== n) st.pk = new Float32Array(n);
  return st.pk;
}
function rr2(g, x, y, w, h) {
  h = Math.max(1, h);
  const r = Math.min(w / 2, h / 2, 4);
  if (typeof g.roundRect === "function" && h > 2) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }
  else g.fillRect(x, y, w, h);
}
function idleLine(g, W, H) {
  g.fillStyle = "rgba(255,255,255,.22)";
  g.fillRect(0, Math.round(H / 2), W, 2);
}
/* 1枚のキャンバスに描く。描けたら true */
function drawOne(cv, kind, t) {
  const w = cv.clientWidth, h = cv.clientHeight;
  if (!w || !h) return false;
  const dpr = Math.min(2, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);
  const W = Math.max(2, Math.round(w * dpr)), H = Math.max(2, Math.round(h * dpr));
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext("2d"); if (!g) return false;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = "none"; g.globalAlpha = 1; g.shadowBlur = 0; g.lineWidth = 1; g.lineJoin = "miter";
  g.textAlign = "left"; g.textBaseline = "alphabetic";
  g.clearRect(0, 0, W, H);

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
  const fn = STYLE_DRAW[style] || STYLE_DRAW.bars;
  const S = {
    vals, wave, live, theme: settings.specTheme, peaks: settings.specPeaks && !reducedMotion(),
    reduced: reducedMotion(), cv, st: stateOf(cv), kind, n, t: t || 0,
    mirror: style === "mirror"
  };
  try { fn(S, g, W, H); } catch (e) { console.error(e); }
  if (!live && IDLE_LINE[style]) idleLine(g, W, H);
  return true;
}

/* ============ 描き続けるかどうか ============ */
const panelCanvases = [];              // くわしい欄と設定画面のキャンバス（見えているものだけ描く）
let tvCanvas = null;                   // 📺 TVに重ねるキャンバス
let raf = 0;

/* 📺 重ねるときの濃さ：全面に背景を塗る見え方は薄くして、映像が透けるようにする */
const TV_ALPHA = { daw:.58, vu:.7, led:.7, spectro:.72, ecg:.7, seismo:.55, radar:.82, piano:.68, slide:.5, board:.68, lie:.55, fire:.85 };

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
function frame(t) {
  raf = 0;
  let busy = false;
  const on = settings.specOn && !isSafe();
  /* アナライザーは、ページで一度でも操作されたあと（ブラウザの音の制限）に、
     実際に音が鳴っているときだけ作る */
  if (on && !an && !specNoAudio && hadGesture && !video.paused) ensureAnalyser();
  /* 音を見ていないときは、毎フレーム描かずに休む（画面を開いているあいだの負担を減らす） */
  const now = t || performance.now();
  const idle = !an;
  const skip = idle && now - lastIdle < 250;
  const all = panelCanvases.filter(seeable);
  const tv = on && tvOn();
  for (const cv of panelCanvases) {
    if (!on || !seeable(cv)) { if (cv.isConnected) clearOne(cv); continue; }
    busy = true;
  }
  if (tv) busy = true; else if (tvCanvas && tvCanvas.isConnected) clearOne(tvCanvas);
  if (!skip) {
    for (const cv of all) drawOne(cv, "panel", now);
    if (tv) drawOne(tvCanvas, "tv", now);
    lastIdle = now;
  }
  if (busy && !document.hidden) raf = requestAnimationFrame(frame);
}
function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }

/* ============ 画面を作る ============ */
const SYNCS = [];                      // 表示を合わせる関数（言語を変えたときにも呼ぶ）
function tx(tag, key, cls) { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; }

function mkChips(pairs, get, set, cls) {
  const row = el("div", "seg specSeg" + (cls ? " " + cls : ""));
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
    mkChips(SPEC_STYLES.map(v => [v, STYLE_KEYS[v]]),
      () => settings.specStyle, v => { settings.specStyle = v; saveUserPrefs(); syncAll(); }));
  host.append(tx("div", "specTheme", "hint specLabel"),
    mkChips(SPEC_THEMES.map((v, i) => [v, ["specThemeNeon", "specThemeSunset", "specThemeMono", "specThemeRainbow"][i]]),
      () => settings.specTheme, v => { settings.specTheme = v; saveUserPrefs(); syncAll(); }, "specSegColor"));
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
  /* 濃さは CSS 変数で渡す（インラインの opacity だと「オフのとき 0」に勝ってしまうため） */
  if (tvCanvas) tvCanvas.style.setProperty("--specTvAlpha", String(TV_ALPHA[settings.specStyle] || .92));
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
  version: 2,
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
