// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! fx-dock.js — 🎛 さわれるエフェクト本体（メイン画面の曲リストの下）
   ・本体のスキン7種（ボタン数がそれぞれ違う）、「5ボタンにそろえる」
   ・⏻ 電源＝ミュート、📡 アンテナ＝バックグラウンド再生、ボタン長押し＝今のエフェクトを登録
   ・🎲 エフェクト／⭐🎲 お気に入りから／🎛🎲 パラメーター（EQの🔒ロック、中身ロック）
   ・ボタンに入りきらないお気に入りは本体の下に ⭐○○ と並べる
   ・Media Session（ロック画面・通知の 再生／一時停止／次の曲）
   ・🧊 fx.js は変更しない。窓口 TrkFX と、fx.js が作った #fxQuickPanel・#fxPanel を使う
   読み込み順：fx-presets.js → fx-dock.js → fx.js
     （お気に入りの初期値を fx.js が読む前に入れる／visibilitychange を library.js・main.js より先に受け取る）
   ========================================================================== */
"use strict";
(() => {

/* ============ 最初のお気に入り（fx.js より先に prefs へ入れる。1回だけ） ============ */
const DEFAULT_FAV = ["vshape", "warp", "itodenwa", "spacesuit", "study"];
if (!prefs.fxFavSeeded) {
  const cur = Array.isArray(prefs.fxFav) ? prefs.fxFav : [];
  prefs.fxFav = [...DEFAULT_FAV, ...cur.filter(id => !DEFAULT_FAV.includes(id))];
}
settings.fxFavSeeded = true;

/* ============ 本体のスキン ============ */
const L4 = (ja, en, zh, ko) => ({ ja, en, zh, ko });
const DOCK_SKINS = {
  standard:{ n:5,  cols:5, deco:"",        label:L4("スタンダード", "Standard", "标准", "스탠다드") },
  cassette:{ n:4,  cols:4, deco:"reels",   label:L4("📼 ラジカセ", "📼 Boombox", "📼 收录机", "📼 카세트 라디오") },
  cd:      { n:6,  cols:3, deco:"disc",    label:L4("💿 CDプレーヤー", "💿 CD player", "💿 CD机", "💿 CD 플레이어") },
  md:      { n:3,  cols:3, deco:"disc",    label:L4("🎧 MDプレーヤー", "🎧 MiniDisc player", "🎧 MD播放器", "🎧 MD 플레이어") },
  keypad:  { n:12, cols:4, deco:"",        label:L4("⌨ 左手キーパッド", "⌨ Left-hand keypad", "⌨ 左手键盘", "⌨ 왼손 키패드") },
  future:  { n:8,  cols:4, deco:"scan",    label:L4("🛸 未来端末", "🛸 Future device", "🛸 未来终端", "🛸 미래 단말기") },
  aero:    { n:5,  cols:5, deco:"bubbles", label:L4("🫧 Frutiger Aero", "🫧 Frutiger Aero", "🫧 Frutiger Aero", "🫧 Frutiger Aero") }
};
const FAV_MAX = 0, TEMP_ID = "__chart", LONG_MS = 600;   /* 0＝上限なし（⭐は js/favs.js がフォルダ分けする） */
settings.fxDockSkin = pick(prefs.fxDockSkin, Object.keys(DOCK_SKINS), "standard");
settings.fxDockFive = !!prefs.fxDockFive;
settings.fxDockOpen = prefs.fxDockOpen === true;      // くわしい欄は最初は閉じる
settings.fxAntenna = !!prefs.fxAntenna;
settings.fxAntennaShape = pick(prefs.fxAntennaShape, ["rod", "loop", "dish", "beam"], "rod");
settings.fxEqLock = Array.isArray(prefs.fxEqLock) && prefs.fxEqLock.length === 5 ? prefs.fxEqLock.map(Boolean) : [false, false, false, false, false];
settings.fxLockChain = !!prefs.fxLockChain;
const skinDef = () => DOCK_SKINS[settings.fxDockSkin] || DOCK_SKINS.standard;
const slotCount = () => settings.fxDockFive ? 5 : skinDef().n;
const slotCols = () => settings.fxDockFive ? 5 : skinDef().cols;

/* ============ 文章（接頭辞 dock…） ============ */
Object.assign(TEXT.ja, {
  dockTitle:"🎛 くわしく（EQ・スキン・メニュー）", dockFavLabel:"⭐ ボタンに入りきらないお気に入り",
  dockNoFavShort:"⭐ お気に入りがありません",
  dockNoFav:"お気に入りはまだありません。ボタンを長押しすると、今のエフェクトを登録できます。",
  dockMore:"⚙ 詳しい設定（ゲーム連動・マイプリセットなど）",
  dockPower:"⏻ 電源（ミュート）", dockAntenna:"📡 アンテナ（バックグラウンド再生）",
  dockAntOn:"📡 アンテナON：裏にしても再生を続けます", dockAntOff:"📡 アンテナOFF", dockMute:"🔇 MUTE", dockFxOff:"FX OFF",
  dockRandFx:"🎲 エフェクト", dockRandFav:"⭐🎲 お気に入りから", dockRandParam:"🎛🎲 パラメーター",
  dockParamDone:"パラメーターをランダムにしました", dockSlotHint:"ボタンを長押し：今のエフェクトを登録（もとの登録は1つ後ろへ）",
  dockEmptySlot:"空きボタン：長押しで今のエフェクトを登録", dockNeedOn:"先にエフェクトを選んでください",
  dockTempNo:"一時プリセットは登録できません（⚙設定のJSON編集で保存してください）", dockSaved:"{n}番に「{name}」を登録しました",
  dockSkinLabel:"本体のスキン", dockFive:"どのスキンでも5ボタンにする（往年の名機に5ボタン）",
  dockAntCheckLabel:"通常のアンテナを使う（バックグラウンド再生モード）",
  dockAntShapeLabel:"アンテナの形状", dockAntShapeRod:"伸縮ロッド（標準）", dockAntShapeLoop:"円形ループ", dockAntShapeDish:"パラボラ", dockAntShapeBeam:"サイバービーム",
  dockLockChain:"🔒 パラメーターのランダムでは、プリセットの中身を変えない（EQだけ）", dockLockHint:"🔒 を付けたEQは、ランダムでも動きません",
  dockAntHint:"アンテナを立てると、アプリを裏にしたり画面を消したりしても再生を続けます（選曲中のプレビュー・ラジオの待ち時間・AUTO中）。自分で遊んでいる最中は、記録を守るため今までどおり一時停止します。裏にしている間は、ビートに合わせて動くエフェクトと画面の動きが止まり、カウントダウンは省きます。ロック画面や通知から 再生・一時停止・次の曲 を操作できます。端末の省電力設定によっては止まることがあります。"
});
Object.assign(TEXT.en, {
  dockTitle:"🎛 More (EQ, skin, menu)", dockFavLabel:"⭐ Favorites that don't fit on the buttons",
  dockNoFavShort:"⭐ No favorites yet",
  dockNoFav:"No favorites yet. Long-press a button to save the current effect there.",
  dockMore:"⚙ More settings (game-reactive, my presets, …)",
  dockPower:"⏻ Power (mute)", dockAntenna:"📡 Antenna (background playback)",
  dockAntOn:"📡 Antenna ON: keeps playing in the background", dockAntOff:"📡 Antenna OFF", dockMute:"🔇 MUTE", dockFxOff:"FX OFF",
  dockRandFx:"🎲 Effect", dockRandFav:"⭐🎲 From favorites", dockRandParam:"🎛🎲 Parameters",
  dockParamDone:"Parameters randomized", dockSlotHint:"Long-press a button: save the current effect (the old one moves back one slot)",
  dockEmptySlot:"Empty button: long-press to save the current effect", dockNeedOn:"Pick an effect first",
  dockTempNo:"Temporary presets can't be saved here (save them via JSON in ⚙ Settings)", dockSaved:"Saved “{name}” to button {n}",
  dockSkinLabel:"Device skin", dockFive:"Use 5 buttons on every skin (5 buttons on a classic)",
  dockAntCheckLabel:"Use standard antenna (background playback mode)",
  dockAntShapeLabel:"Antenna shape", dockAntShapeRod:"Telescopic rod (default)", dockAntShapeLoop:"Circular loop", dockAntShapeDish:"Satellite dish", dockAntShapeBeam:"Cyber beam",
  dockLockChain:"🔒 Parameter random keeps the preset itself (EQ only)", dockLockHint:"EQ bands marked 🔒 don't move when randomizing",
  dockAntHint:"With the antenna up, playback continues when the app is in the background or the screen is off (song previews, the radio wait, and AUTO). While you're playing yourself, it still pauses to protect your records. In the background, beat-synced effects and animations stop and the countdown is skipped. You can play/pause/skip from the lock screen or notification. Some devices' battery savers may still stop it."
});
Object.assign(TEXT.zh, {
  dockTitle:"🎛 详细（均衡器・皮肤・菜单）", dockFavLabel:"⭐ 按钮放不下的收藏",
  dockNoFavShort:"⭐ 还没有收藏",
  dockNoFav:"还没有收藏。长按按钮即可登记当前音效。", dockMore:"⚙ 详细设置（游戏联动・我的预设等）",
  dockPower:"⏻ 电源（静音）", dockAntenna:"📡 天线（后台播放）",
  dockAntOn:"📡 天线开启：切到后台也继续播放", dockAntOff:"📡 天线关闭", dockMute:"🔇 MUTE", dockFxOff:"FX OFF",
  dockRandFx:"🎲 音效", dockRandFav:"⭐🎲 从收藏", dockRandParam:"🎛🎲 参数",
  dockParamDone:"已随机调整参数", dockSlotHint:"长按按钮：登记当前音效（原来的往后挪一位）",
  dockEmptySlot:"空按钮：长按登记当前音效", dockNeedOn:"请先选择音效",
  dockTempNo:"临时预设无法登记（请在 ⚙设置 的JSON编辑中保存）", dockSaved:"已将“{name}”登记到 {n} 号",
  dockSkinLabel:"机身皮肤", dockFive:"所有皮肤都用5个按钮（给经典机型装上5键）",
  dockAntCheckLabel:"使用标准天线（后台播放模式）",
  dockAntShapeLabel:"天线形状", dockAntShapeRod:"伸缩拉杆（默认）", dockAntShapeLoop:"环形天线", dockAntShapeDish:"抛物面天线", dockAntShapeBeam:"赛博光束",
  dockLockChain:"🔒 参数随机时不改变预设本身（只改均衡器）", dockLockHint:"标记 🔒 的均衡器在随机时不会变化",
  dockAntHint:"竖起天线后，切到后台或关闭屏幕也会继续播放（选曲试听・电台等待・AUTO中）。自己游玩时为了保护记录，仍会照常暂停。后台期间，随节拍变化的音效和画面动画会停止，倒计时会省略。可以在锁屏或通知中播放・暂停・切到下一首。部分设备的省电设置仍可能停止播放。"
});
Object.assign(TEXT.ko, {
  dockTitle:"🎛 자세히 (EQ・스킨・메뉴)", dockFavLabel:"⭐ 버튼에 다 들어가지 않는 즐겨찾기",
  dockNoFavShort:"⭐ 즐겨찾기가 없습니다",
  dockNoFav:"아직 즐겨찾기가 없습니다. 버튼을 길게 누르면 지금 이펙트를 등록할 수 있습니다.", dockMore:"⚙ 자세한 설정 (게임 연동・내 프리셋 등)",
  dockPower:"⏻ 전원 (음소거)", dockAntenna:"📡 안테나 (백그라운드 재생)",
  dockAntOn:"📡 안테나 ON: 백그라운드에서도 계속 재생", dockAntOff:"📡 안테나 OFF", dockMute:"🔇 MUTE", dockFxOff:"FX OFF",
  dockRandFx:"🎲 이펙트", dockRandFav:"⭐🎲 즐겨찾기에서", dockRandParam:"🎛🎲 파라미터",
  dockParamDone:"파라미터를 랜덤으로 바꿨습니다", dockSlotHint:"버튼 길게 누르기: 지금 이펙트 등록 (원래 것은 한 칸 뒤로)",
  dockEmptySlot:"빈 버튼: 길게 눌러 지금 이펙트 등록", dockNeedOn:"먼저 이펙트를 골라 주세요",
  dockTempNo:"임시 프리셋은 등록할 수 없습니다 (⚙설정의 JSON 편집으로 저장하세요)", dockSaved:"{n}번에 '{name}'을(를) 등록했습니다",
  dockSkinLabel:"본체 스킨", dockFive:"모든 스킨을 5버튼으로 (명기에 5버튼 달기)",
  dockAntCheckLabel:"일반 안테나 사용 (백그라운드 재생 모드)",
  dockAntShapeLabel:"안테나 모양", dockAntShapeRod:"신축식 로드 (기본)", dockAntShapeLoop:"원형 루프", dockAntShapeDish:"파라볼라 안테나", dockAntShapeBeam:"사이버 빔",
  dockLockChain:"🔒 파라미터 랜덤에서 프리셋 자체는 바꾸지 않기 (EQ만)", dockLockHint:"🔒 표시한 EQ는 랜덤에서도 움직이지 않습니다",
  dockAntHint:"안테나를 세우면 앱을 백그라운드로 보내거나 화면을 꺼도 계속 재생합니다 (곡 선택 미리듣기・라디오 대기・AUTO 중). 직접 플레이하는 중에는 기록을 지키기 위해 지금처럼 일시정지합니다. 백그라운드에서는 비트에 맞춰 움직이는 이펙트와 화면 애니메이션이 멈추고, 카운트다운은 생략합니다. 잠금 화면이나 알림에서 재생・일시정지・다음 곡을 조작할 수 있습니다. 기기의 절전 설정에 따라 멈출 수도 있습니다."
});

/* ============ 📡 アンテナ：バックグラウンド再生 ============
   library.js（プレビューを止める）・main.js（プレイを一時停止）より先に visibilitychange を受け取り、
   続けてよい場面だけ止める処理を飛ばす。自分で遊んでいる最中は止める（記録のため） */
const keepAlive = () => settings.fxAntenna &&
  (phase === "title" || phase === "ended" || (phase === "playing" && settings.autoPlay));
function wakeAC() { if (typeof audioCtx !== "undefined" && audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {}); }
document.addEventListener("visibilitychange", e => {
  if (!document.hidden || !keepAlive()) return;
  e.stopImmediatePropagation();
  wakeAC();                                            // 裏ではブラウザが音の処理を止めることがあるので、再開を試みる
}, true);
/* 裏では画面の更新（requestAnimationFrame）が止まり、カウントダウンが進まないので省く */
function skipCountsIfHidden() {
  if (!document.hidden) return;
  const a = settings.countdown, b = settings.resumeCountdown;
  settings.countdown = false; settings.resumeCountdown = false;
  setTimeout(() => { settings.countdown = a; settings.resumeCountdown = b; }, 0);
}
on("beforePlay", skipCountsIfHidden);

/* ============ ロック画面・通知の操作（Media Session） ============ */
const ms = "mediaSession" in navigator ? navigator.mediaSession : null;
const setAct = (a, f) => { try { ms.setActionHandler(a, f); } catch (_) {} };
async function goNext() {
  if (typeof nextSong !== "function" || typeof selectSong !== "function") return;
  const nx = nextSong(); if (!nx) return;
  if (phase !== "title") toTitle();
  await selectSong(nx);
  if (settings.autoPlay && phase === "title" && videoReady && chart.length && currentSong === nx) { skipCountsIfHidden(); startGame(); }
}
function msMeta() {
  if (!ms || typeof MediaMetadata === "undefined") return;
  const s = currentSong || {};
  try {
    ms.metadata = new MediaMetadata({ title:s.title || baseName(mediaName) || "trk!", artist:s.artist || "trk!", album:"trk!",
      artwork:[{ src:"icons/icon-512.png", sizes:"512x512", type:"image/png" }, { src:"icons/icon-192.png", sizes:"192x192", type:"image/png" }] });
  } catch (_) {}
}
if (ms) {
  setAct("play", () => { skipCountsIfHidden(); if (phase === "paused") resumeGame(); else video.play().catch(() => {}); });
  setAct("pause", () => { if (phase === "playing") pauseGame(); else video.pause(); });
  setAct("nexttrack", () => { goNext(); });
}

/* ============ 🎛🎲 パラメーターのランダム ============ */
const BEATS = [.25, .5, 1, 2, 4];
const FREQ_KEYS = ["freq", "from", "to", "cutoff", "tone", "keepBass"];
function jitter(o) {
  if (Array.isArray(o)) return o.map(jitter);
  if (!o || typeof o !== "object") return o;
  const r = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "number") { r[k] = jitter(v); continue; }
    if (k === "beats") r[k] = v ? BEATS[Math.floor(Math.random() * BEATS.length)] : 0;   // 0 は「ミリ秒で指定」のまま
    else if (FREQ_KEYS.includes(k)) r[k] = Math.round(v * Math.pow(2, (Math.random() * 2 - 1) * .6));
    else if (k === "bits") r[k] = Math.round(v + Math.random() * 4 - 2);
    else if (k === "gain" || k === "db") r[k] = Math.round((v + Math.random() * 6 - 3) * 2) / 2;
    else r[k] = +(v * (1 + (Math.random() * 2 - 1) * .35)).toFixed(3);
  }
  return r;                                            // 範囲外の値は fx.js の検証で自動的に丸められる
}

/* ============ 画面の組み立て（全部のファイルを読み終えてから） ============ */
addEventListener("DOMContentLoaded", () => {
  const col = document.querySelector(".songCol"), quick = $("fxQuickPanel"), full = $("fxPanel");
  if (!col || !quick || !full || !window.TrkFX) return;
  saveUserPrefs();

  const tx = (tag, key, cls) => { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; };
  const btn = (cls, ...kids) => { const b = el("button", cls); b.type = "button"; b.append(...kids); return b; };
  const names = () => Object.fromEntries(TrkFX.list().map(p => [p.id, p.name]));

  /* ---- 本体 ---- */
  const dock = el("div"); dock.id = "fxDock";
  const dev = el("div", "dockDev");
  const antWrap = el("div", "antWrap");
  const antBody = el("div", "antBody"), antTip = el("div", "antTip"), antSignal = el("div", "antSignal");
  antWrap.append(antBody, antTip, antSignal);

  const powLed = el("i", "led"), antLed = el("i", "led ledAnt");
  const pow = btn("dockKey dockPow", powLed, el("span", "", "⏻"));
  const ant = btn("dockKey dockAnt", antLed, el("span", "antIcon", "📡"), el("span", "antTxt", "ANT"));
  const lcd = el("div", "dockLcd");
  const top = el("div", "dockTop"); top.append(pow, lcd, ant);
  const deco = el("div", "dockDeco");
  const slots = el("div", "dockSlots");
  const rFx = btn("dockKey"), rFav = btn("dockKey"), rPar = btn("dockKey");
  const rnd = el("div", "dockRand"); rnd.append(rFx, rFav, rPar);
  const slotHint = tx("div", "dockSlotHint", "hint dockHint");
  dev.append(antWrap, top, deco, slots, rnd, slotHint);

  /* ---- ⭐ お気に入り（フォルダのチップと、ボタンに入りきらないぶん） ---- */
  const overLabel = tx("div", "dockFavLabel", "hint");
  const overflow = el("div", "fxFavRow");
  const favChips = el("div", "favChipsWrap");

  /* ---- くわしい欄（メニュー・EQ・スキン） ---- */
  const body = el("details", "panel dockMore"); body.open = settings.fxDockOpen;
  body.addEventListener("toggle", () => { settings.fxDockOpen = body.open; saveUserPrefs(); });
  quick.classList.add("inDock");
  const eqRanges = Array.from(full.querySelectorAll('input[type="range"]')).slice(0, 5);   // fx.js のかんたんEQ
  const eqBox = el("div", "fxDockEq");
  eqBox.append(tx("div", "sfxEqLabel", "hint"));
  const mirrors = eqRanges.map((o, i) => {
    const row = el("div", "inline tight"), m = document.createElement("input"), val = el("span", "mono");
    m.type = "range"; m.min = o.min; m.max = o.max; m.step = o.step;
    m.addEventListener("input", () => { o.value = m.value; o.dispatchEvent(new Event("input", { bubbles:true })); });
    const lock = btn("fxMini dockLock");
    lock.addEventListener("click", () => { settings.fxEqLock[i] = !settings.fxEqLock[i]; saveUserPrefs(); render(); });
    row.append(el("span", "", ["60Hz", "250Hz", "1kHz", "4kHz", "12kHz"][i]), m, val, lock);
    eqBox.append(row);
    return { o, m, val, lock, oVal:o.parentElement.querySelector(".mono") };
  });
  const origReset = full.querySelector('[data-i18n="sfxEqReset"]');
  if (origReset) { const r = tx("button", "sfxEqReset", "fxMini"); r.type = "button"; r.addEventListener("click", () => origReset.click()); eqBox.append(r); }
  const mkCheck = (key, label) => {
    const lab = el("label", "check"), inp = document.createElement("input");
    inp.type = "checkbox"; lab.append(inp, tx("span", label));
    inp.addEventListener("change", () => { settings[key] = inp.checked; saveUserPrefs(); render(); });
    return { lab, inp };
  };
  const lockChain = mkCheck("fxLockChain", "dockLockChain");
  const skinRow = el("label", "field"), skinSel = document.createElement("select");
  skinRow.append(tx("span", "dockSkinLabel"), skinSel);
  skinSel.addEventListener("change", () => { settings.fxDockSkin = skinSel.value; saveUserPrefs(); render(true); });
  const five = mkCheck("fxDockFive", "dockFive");

  /* 📡 アンテナの形状 & 通常アンテナを使う（バックグラウンド再生モード）チェックボックス */
  const antShapeRow = el("label", "field antShapeField");
  const antShapeSel = document.createElement("select");
  const antShapes = [
    ["rod", "dockAntShapeRod"],
    ["loop", "dockAntShapeLoop"],
    ["dish", "dockAntShapeDish"],
    ["beam", "dockAntShapeBeam"]
  ];
  const buildAntShapes = () => {
    antShapeSel.textContent = "";
    for (const [k, lbl] of antShapes) {
      const o = document.createElement("option"); o.value = k; o.textContent = tr(lbl);
      o.dataset.i18n = lbl;
      antShapeSel.append(o);
    }
    antShapeSel.value = settings.fxAntennaShape || "rod";
  };
  buildAntShapes();
  antShapeSel.addEventListener("change", () => {
    settings.fxAntennaShape = antShapeSel.value;
    saveUserPrefs();
    render();
  });
  antShapeRow.append(tx("span", "dockAntShapeLabel"), antShapeSel);

  const antCheck = mkCheck("fxAntenna", "dockAntCheckLabel");

  const more = tx("button", "dockMore", "fxMini"); more.type = "button";
  more.addEventListener("click", () => {
    openSettings(); full.open = true;
    setTimeout(() => full.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  });
  body.append(tx("summary", "dockTitle"), quick, eqBox, tx("div", "dockLockHint", "hint"), lockChain.lab,
    skinRow, five.lab, antShapeRow, antCheck.lab, tx("div", "dockAntHint", "hint"), more);

  dock.append(dev, favChips, overLabel, overflow, body);
  col.append(dock);

  /* ---- 液晶の一時メッセージ ---- */
  let flash = null;
  function lcdFlash(text) { flash = { text, until:Date.now() + 2000 }; render(); setTimeout(render, 2100); }

  /* ---- ボタンの動き ---- */
  function toggleAntenna(forced) {
    settings.fxAntenna = forced !== undefined ? !!forced : !settings.fxAntenna;
    saveUserPrefs();
    lcdFlash(tr(settings.fxAntenna ? "dockAntOn" : "dockAntOff"));
    render();
  }
  pow.addEventListener("click", () => { video.muted = !video.muted; render(); });
  video.addEventListener("volumechange", () => render());
  ant.addEventListener("click", () => toggleAntenna());
  antWrap.addEventListener("click", () => toggleAntenna());
  rFx.addEventListener("click", () => TrkFX.random());
  rFav.addEventListener("click", () => {
    const F = window.TrkFavs;
    const src = F ? F.pool("fx") : (settings.fxFav || []);
    const list = src.filter(id => id !== settings.fxPreset && names()[id]);
    if (list.length) TrkFX.select(list[Math.floor(Math.random() * list.length)]);
    else lcdFlash(tr("dockNoFavShort"));
  });
  rPar.addEventListener("click", () => {
    const eq = settings.fxEq.map((v, i) => settings.fxEqLock[i] ? v : Math.round((Math.random() * 12 - 6) * 2) / 2);
    const cur = TrkFX.current();
    if (!settings.fxLockChain && cur && cur.chain.length) {
      const base = cur.name.replace(/ 🎲$/, "").slice(0, 21);
      TrkFX.apply({ format:"trk-fx", version:1, name:base + " 🎲", chain:jitter(cur.chain), eq, volume:cur.volume });
    } else {
      eqRanges.forEach((o, i) => { if (settings.fxEqLock[i]) return; o.value = eq[i]; o.dispatchEvent(new Event("input", { bubbles:true })); });
    }
    lcdFlash("🎛🎲 " + tr("dockParamDone"));
  });

  /* ボタンに今のエフェクトを登録（もとの登録は1つ後ろへずらすので、消えない） */
  function assign(i) {
    if (!settings.fxOn) { lcdFlash(tr("dockNeedOn")); return; }
    const id = settings.fxPreset;
    if (id === TEMP_ID || !names()[id]) { lcdFlash(tr("dockTempNo")); return; }
    const F = window.TrkFavs;
    if (F) {
      /* ⭐ いま選んでいるフォルダ（1軍／2軍／🧊）へ入れる。上限なし。🧊は凍結中なら断る */
      const g = ["main", "sub", "frozen"].includes(F.activeOf("fx")) ? F.activeOf("fx") : "main";
      const r = F.add("fx", id, { group:g, index:i });
      if (!r.ok) { lcdFlash(F.msg(r.why)); return; }
      emit("language");
      lcdFlash(tr("dockSaved", { n:i + 1, name:names()[id] }));
      return;
    }
    const arr = (settings.fxFav || []).filter(x => x !== id);
    arr.splice(Math.min(i, arr.length), 0, id);
    settings.fxFav = arr; saveUserPrefs();
    emit("language");
    lcdFlash(tr("dockSaved", { n:i + 1, name:names()[id] }));
  }
  function slotButton(i, id, nm) {
    const on = settings.fxOn && settings.fxPreset === id;
    const b = btn("dockKey slot" + (id ? "" : " empty") + (on ? " selected" : ""), el("span", "num", String(i + 1)), el("span", "nm", nm || "—"));
    b.title = id ? nm : tr("dockEmptySlot");
    b.setAttribute("aria-pressed", String(on));
    let timer = 0, long = false;
    b.addEventListener("pointerdown", () => { long = false; timer = setTimeout(() => { long = true; assign(i); }, LONG_MS); });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => clearTimeout(timer));
    b.addEventListener("contextmenu", e => e.preventDefault());   // スマホの長押しメニューを出さない
    b.addEventListener("click", () => {
      if (long) return;
      if (!id) { lcdFlash(tr("dockEmptySlot")); return; }
      if (on) TrkFX.off(); else TrkFX.select(id);
    });
    return b;
  }

  /* ---- 飾り（スキンごと） ---- */
  function buildDeco() {
    deco.textContent = "";
    const d = skinDef().deco; deco.className = "dockDeco " + d; deco.hidden = !d;
    if (d === "reels") deco.append(el("i", "reel"), el("i", "reel"));
    else if (d === "disc") deco.append(el("i", "disc"));
    else if (d === "scan") deco.append(el("i", "scanbar"));
    else if (d === "bubbles") for (let k = 0; k < 4; k++) deco.append(el("i", "bubble"));
  }

  /* ---- 表示 ---- */
  let lastSkin = "";
  function render(skinChanged) {
    const nm = names();
    dock.dataset.skin = settings.fxDockSkin;
    dock.dataset.antShape = settings.fxAntennaShape || "rod";
    antWrap.dataset.shape = settings.fxAntennaShape || "rod";
    dock.classList.toggle("ant", settings.fxAntenna);
    dock.classList.toggle("playing", !video.paused);
    if (skinChanged || lastSkin !== settings.fxDockSkin) { buildDeco(); lastSkin = settings.fxDockSkin; }
    /* 電源・アンテナ・液晶 */
    powLed.classList.toggle("on", !video.muted);
    antLed.classList.toggle("on", settings.fxAntenna);
    ant.classList.toggle("on", settings.fxAntenna);
    if (antCheck && antCheck.inp) antCheck.inp.checked = settings.fxAntenna;
    if (antShapeSel) antShapeSel.value = settings.fxAntennaShape || "rod";
    pow.title = tr("dockPower"); pow.setAttribute("aria-label", pow.title); pow.setAttribute("aria-pressed", String(!video.muted));
    ant.title = tr("dockAntenna"); ant.setAttribute("aria-label", ant.title); ant.setAttribute("aria-pressed", String(settings.fxAntenna));
    lcd.textContent = flash && Date.now() < flash.until ? flash.text
      : (video.muted ? tr("dockMute") + " · " : "") + (settings.fxOn ? (nm[settings.fxPreset] || "FX") : tr("dockFxOff")) + (settings.fxAntenna ? " 📡" : "");
    /* ランダム */
    rFx.textContent = tr("dockRandFx"); rFav.textContent = tr("dockRandFav"); rPar.textContent = tr("dockRandParam");
    /* ⭐ ボタン（いまのフォルダの中身。1軍＝これまでの settings.fxFav）と、入りきらないぶん */
    const F = window.TrkFavs;
    const favGroup = F && ["main", "sub", "frozen"].includes(F.activeOf("fx")) ? F.activeOf("fx") : "main";
    const favAll = F ? F.list("fx", favGroup) : (settings.fxFav || []);
    const fav = favAll.filter(id => nm[id]), n = slotCount();
    slots.style.setProperty("--cols", slotCols());
    slots.textContent = "";
    for (let i = 0; i < n; i++) slots.append(slotButton(i, fav[i], nm[fav[i]]));
    if (F) {
      favChips.textContent = "";
      favChips.append(F.chips("fx", { former:true, onChange: () => render() }));
    }
    overflow.textContent = "";
    const rest = fav.slice(n);
    if (!F) overLabel.hidden = !rest.length && fav.length > 0;
    else {
      const lock = F.locked("fx", favGroup) ? " 🔒" : "";
      const former = F.count("fx", "former");
      overLabel.textContent = tr("favHintDock", { g: F.label(favGroup) + lock, n: favAll.length, m: n })
        + (former ? " ／ " + tr("favHintN", { g: F.label("former"), n: former }) : "");
      overLabel.hidden = !favAll.length;
    }
    if (!fav.length) overflow.append(tx("div", "dockNoFav", "hint"));
    for (const id of rest) {
      const on = settings.fxOn && settings.fxPreset === id;
      const b = btn(on ? "selected" : "", "⭐" + (F && F.pinned("fx", id) ? "📌" : "") + nm[id]);
      b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", () => { if (on) TrkFX.off(); else TrkFX.select(id); });
      if (F) {
        /* 長押しでメニュー（1軍／2軍／🧊／📌／外す） */
        let t = 0, lng = false;
        b.addEventListener("pointerdown", () => { lng = false; t = setTimeout(() => { lng = true; F.menu(b, "fx", id); }, LONG_MS); });
        for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => clearTimeout(t));
        b.addEventListener("click", e => { if (lng) { e.stopImmediatePropagation(); lng = false; } }, true);
        b.addEventListener("contextmenu", e => { e.preventDefault(); F.menu(b, "fx", id); });
      }
      overflow.append(b);
    }
    /* くわしい欄 */
    skinSel.textContent = "";
    for (const [id, d] of Object.entries(DOCK_SKINS)) {
      const o = document.createElement("option"); o.value = id; o.textContent = `${d.label[lang] || d.label.en}（${d.n}）`; skinSel.append(o);
    }
    skinSel.value = settings.fxDockSkin;
    five.inp.checked = settings.fxDockFive; lockChain.inp.checked = settings.fxLockChain;
    for (const [i, r] of mirrors.entries()) {
      r.m.value = r.o.value; if (r.oVal) r.val.textContent = r.oVal.textContent;
      r.lock.textContent = settings.fxEqLock[i] ? "🔒" : "🔓";
      r.lock.setAttribute("aria-pressed", String(settings.fxEqLock[i]));
    }
  }

  /* fx.js が表示を作り直したら（プリセット・お気に入り・EQ・言語の変更）こちらも更新 */
  let queued = false;
  const update = () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (typeof buildAntShapes === "function") buildAntShapes();
      render();
    });
  };
  const mo = new MutationObserver(update);
  const sel = quick.querySelector("select"); if (sel) mo.observe(sel, { childList:true });
  for (const r of mirrors) if (r.oVal) mo.observe(r.oVal, { childList:true, characterData:true, subtree:true });
  video.addEventListener("play", () => { if (ms) ms.playbackState = "playing"; msMeta(); wakeAC(); update(); });
  video.addEventListener("pause", () => { if (ms) ms.playbackState = "paused"; update(); });
  on("chart", msMeta);
  on("language", update);
  render(true);
});
})();
/* ✅ fx-dock.js 完了 */
