// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! player.js — ⏯ AUTO・練習中の再生操作
   ・AUTO中（または練習用シークバー表示中）は、下の再生バーで自由に移動できる
   ・キーで10秒ずつ巻き戻し・早送り（初期値 ← ／ →、キー設定あり）
   ・🔁 区間リピート：R キーで A点 → B点 → 解除（一時停止画面のボタンでも可）
   読み込み順：core.js のすぐ後（TRUCK・ORBIT・STAGE・CATCHより先にキーを受け取るため）
   ========================================================================== */
"use strict";
(() => {
const SKIP_SEC = 10;          // スキップする秒数
const AB_KEY = "KeyR";        // 区間リピートのキー

/* ---------- 翻訳 ---------- */
Object.assign(TEXT.ja, {
  skipTitle:"⏯ 再生の操作（AUTO・練習中）", skipBack:"巻き戻し", skipFwd:"早送り", skipKeyReset:"↺ ← ／ → に戻す",
  skipHint:"AUTO中（または練習用シークバー表示中）は、下の再生バーで好きな位置へ移動でき、キーで10秒ずつ巻き戻し・早送りできます。R キーで区間リピート（A点 → B点 → 解除）。一時停止中も使えます。",
  skipCapture0:"「巻き戻し」に割り当てるキーを押してください。ESCでキャンセル。",
  skipCapture1:"「早送り」に割り当てるキーを押してください。ESCでキャンセル。",
  skipAssigned:"再生の操作キーを設定しました。",
  abSetA:"🔁 A点にする", abSetB:"B点にする", abClear:"解除",
  abNone:"🔁 区間リピート：なし（R キーまたは下のボタンで設定）", abOnlyA:"🔁 A点 {a} — B点を決めてください", abRange:"🔁 {a} – {b} をくり返し中",
  abToastA:"🔁 A点 {t}", abToastB:"🔁 {a} – {b} をくり返します", abToastClear:"🔁 区間リピートを解除しました"
});
Object.assign(TEXT.en, {
  skipTitle:"⏯ Playback controls (AUTO / practice)", skipBack:"Rewind", skipFwd:"Fast-forward", skipKeyReset:"↺ Back to ← / →",
  skipHint:"In AUTO (or while the practice seek bar is shown), drag the bar at the bottom to jump anywhere, or use the keys to skip 10 seconds. Press R for A-B repeat (A → B → off). Works while paused too.",
  skipCapture0:"Press a key for “Rewind”. ESC cancels.",
  skipCapture1:"Press a key for “Fast-forward”. ESC cancels.",
  skipAssigned:"Playback key assigned.",
  abSetA:"🔁 Set A", abSetB:"Set B", abClear:"Clear",
  abNone:"🔁 A-B repeat: off (press R or use the buttons below)", abOnlyA:"🔁 A at {a} — now set B", abRange:"🔁 Repeating {a} – {b}",
  abToastA:"🔁 A {t}", abToastB:"🔁 Repeating {a} – {b}", abToastClear:"🔁 A-B repeat cleared"
});
Object.assign(TEXT.zh, {
  skipTitle:"⏯ 播放操作（AUTO・练习中）", skipBack:"倒退", skipFwd:"快进", skipKeyReset:"↺ 恢复为 ← ／ →",
  skipHint:"AUTO中（或显示练习进度条时），可以拖动下方进度条跳到任意位置，也可以用按键每次倒退・快进10秒。按 R 键进行区间重复（A点 → B点 → 解除）。暂停中也能使用。",
  skipCapture0:"请按下“倒退”的按键。ESC取消。",
  skipCapture1:"请按下“快进”的按键。ESC取消。",
  skipAssigned:"已设置播放操作按键。",
  abSetA:"🔁 设为A点", abSetB:"设为B点", abClear:"解除",
  abNone:"🔁 区间重复：无（按 R 键或用下方按钮设置）", abOnlyA:"🔁 A点 {a} — 请设定B点", abRange:"🔁 正在重复 {a} – {b}",
  abToastA:"🔁 A点 {t}", abToastB:"🔁 重复 {a} – {b}", abToastClear:"🔁 已解除区间重复"
});
Object.assign(TEXT.ko, {
  skipTitle:"⏯ 재생 조작 (AUTO・연습 중)", skipBack:"되감기", skipFwd:"빨리 감기", skipKeyReset:"↺ ← ／ → 로 되돌리기",
  skipHint:"AUTO 중(또는 연습용 시크바 표시 중)에는 아래 재생 바로 원하는 위치로 이동하고, 키로 10초씩 되감기・빨리 감기할 수 있습니다. R 키로 구간 반복 (A점 → B점 → 해제). 일시정지 중에도 쓸 수 있습니다.",
  skipCapture0:"'되감기'로 지정할 키를 누르세요. ESC로 취소.",
  skipCapture1:"'빨리 감기'로 지정할 키를 누르세요. ESC로 취소.",
  skipAssigned:"재생 조작 키를 설정했습니다.",
  abSetA:"🔁 A점으로", abSetB:"B점으로", abClear:"해제",
  abNone:"🔁 구간 반복: 없음 (R 키 또는 아래 버튼으로 설정)", abOnlyA:"🔁 A점 {a} — B점을 정해 주세요", abRange:"🔁 {a} – {b} 반복 중",
  abToastA:"🔁 A점 {t}", abToastB:"🔁 {a} – {b} 반복합니다", abToastClear:"🔁 구간 반복을 해제했습니다"
});

/* ---------- 設定 ---------- */
const SKIP_DEFAULT = ["ArrowLeft", "ArrowRight"];
settings.skipKeys = (Array.isArray(prefs.skipKeys) && prefs.skipKeys.length === 2 && prefs.skipKeys.every(validCode) && prefs.skipKeys[0] !== prefs.skipKeys[1])
  ? prefs.skipKeys.slice() : SKIP_DEFAULT.slice();

const inPlay = () => phase === "playing" || phase === "paused";
const canSkip = () => inPlay() && videoReady && (settings.autoPlay || settings.playerMode);
/* 練習中（AUTOでないとき）は、遊ぶためのキーを優先する */
function usedByMode(code) {
  if (slotOfKey(code) >= 0) return true;
  if (typeof isTruck === "function" && isTruck() && typeof truckPosKeys === "function" && truckPosKeys().includes(code)) return true;
  if (typeof isStage === "function" && isStage() && typeof stageKeys === "function" && stageKeys().includes(code)) return true;
  if (typeof isCatch === "function" && isCatch() && typeof catchAllKeys === "function" && catchAllKeys().includes(code)) return true;
  return false;
}

/* ---------- 再生バー：AUTO中も表示 ---------- */
function syncSeekBar() {
  $("seekBar").classList.toggle("on", (settings.playerMode || !!settings.autoPlay) && inPlay());
}
on("phase", syncSeekBar);
on("options", syncSeekBar);

/* ---------- 10秒スキップ ---------- */
function skip(dir) {
  const d = video.duration || 0; if (!d) return;
  const t = Math.max(0, Math.min(d - .5, (video.currentTime || 0) + dir * SKIP_SEC));
  seekTo(t);
  if (typeof poke === "function") poke();
  showToast(`${dir < 0 ? "⏪ -" : "⏩ +"}${SKIP_SEC}s · ${fmtTime(t)}`);
}

/* ---------- 🔁 区間リピート ---------- */
const ab = { a:null, b:null };
function abSet(which) {
  if (!canSkip()) return;
  const t = video.currentTime || 0;
  if (which === "a") { ab.a = t; ab.b = null; showToast(tr("abToastA", { t:fmtTime(t) })); }
  else if (ab.a != null) {
    if (t <= ab.a + .5) { ab.b = ab.a; ab.a = Math.max(0, t); } else ab.b = t;   // 逆向きに置いたら入れ替える
    if (ab.b - ab.a < .5) ab.b = ab.a + .5;
    showToast(tr("abToastB", { a:fmtTime(ab.a), b:fmtTime(ab.b) }));
  }
  renderAb();
}
function abClear(silent) { ab.a = ab.b = null; if (!silent) showToast(tr("abToastClear")); renderAb(); }
function abCycle() { if (ab.a == null) abSet("a"); else if (ab.b == null) abSet("b"); else abClear(); }
function renderAb() {
  const bar = $("seekBar"), d = video.duration || 0;
  const on = ab.a != null && d > 0;
  bar.classList.toggle("ab", on);
  if (on) {
    bar.style.setProperty("--ab-a", (ab.a / d * 100).toFixed(2) + "%");
    bar.style.setProperty("--ab-b", ((ab.b ?? ab.a) / d * 100).toFixed(2) + "%");
  }
  abLine.textContent = ab.a == null ? tr("abNone")
    : ab.b == null ? tr("abOnlyA", { a:fmtTime(ab.a) })
    : tr("abRange", { a:fmtTime(ab.a), b:fmtTime(ab.b) });
}
/* B点を過ぎたらA点へ戻る（練習扱いは seekTo が付けます） */
setInterval(() => {
  if (ab.a == null || ab.b == null || phase !== "playing" || !videoReady) return;
  if ((video.currentTime || 0) >= ab.b) seekTo(ab.a);
}, 40);
on("beforeLoad", () => abClear(true));

/* 一時停止画面の表示とボタン */
const abBox = el("div"), abLine = el("div", "hint status"), abBtns = el("div", "miniActions");
abBtns.style.justifyContent = "center";
for (const [key, fn] of [["abSetA", () => abSet("a")], ["abSetB", () => abSet("b")], ["abClear", () => abClear()]]) {
  const b = el("button"); b.type = "button"; b.dataset.i18n = key; b.textContent = tr(key);
  b.addEventListener("click", fn); abBtns.append(b);
}
abBox.append(abLine, abBtns);
$("pauseScreen").querySelector("p").after(abBox);
on("phase", () => { abBox.hidden = !canSkip(); renderAb(); });
on("language", renderAb);

/* ---------- キー（ほかのモードより先に受け取る） ---------- */
let skipBinding = null;
addEventListener("keydown", e => {
  if (window._trkSynthModeOpen || window._trkMediaPlayerOpen) return;
  if (skipBinding !== null) { e.preventDefault(); e.stopImmediatePropagation(); captureSkip(e.code); return; }
  if (!canSkip()) return;
  if (!settings.autoPlay && usedByMode(e.code)) return;
  if (e.code === AB_KEY) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) abCycle(); return; }
  const i = settings.skipKeys.indexOf(e.code); if (i < 0) return;
  e.preventDefault(); e.stopImmediatePropagation();
  skip(i ? 1 : -1);                           // 長押しすると続けてスキップ
}, true);

const SKIP_BAD = ["KeyP", "Escape", "Tab", "Backquote", "Minus", "Equal", "Backspace", "F5", "F11", "F12", "MetaLeft", "MetaRight", AB_KEY];
function captureSkip(code) {
  const i = skipBinding;
  if (code === "Escape") { skipBinding = null; setStatus("skipBindStatus", "cancelBind"); syncSkipUI(); return; }
  if (SKIP_BAD.includes(code) || (settings.speedKeys || []).includes(code)) { setStatus("skipBindStatus", "reservedKey"); return; }
  if (settings.skipKeys[1 - i] === code) { setStatus("skipBindStatus", "duplicateKey"); return; }
  settings.skipKeys[i] = code; skipBinding = null; saveUserPrefs();
  setStatus("skipBindStatus", "skipAssigned"); syncSkipUI();
}

/* ---------- 設定画面（⌨ 操作 の中） ---------- */
let syncSkipUI = () => {};
(() => {
  const anchor = document.querySelector('#settingsScreen [data-i18n="quickRetryHint"]'); if (!anchor) return;
  const h3 = el("h3"); h3.dataset.i18n = "skipTitle";
  const rows = el("div", "keyRows"); rows.style.marginTop = "10px";
  const reset = el("button"); reset.type = "button"; reset.dataset.i18n = "skipKeyReset";
  reset.style.cssText = "margin-top:8px;padding:7px 12px;font-size:14px";
  const status = el("div", "hint status"); status.id = "skipBindStatus";
  const hint = el("div", "hint"); hint.dataset.i18n = "skipHint";
  anchor.after(h3, rows, reset, status, hint);
  syncSkipUI = () => {
    rows.textContent = "";
    ["skipBack", "skipFwd"].forEach((key, i) => {
      const row = el("div", "keyRow"), b = el("button", "", tr("assign"));
      b.type = "button"; b.classList.toggle("listening", skipBinding === i);
      b.addEventListener("click", () => {
        bindingSlot = null; updateKeyUI();
        skipBinding = i; b.blur();
        setStatus("skipBindStatus", "skipCapture" + i); syncSkipUI();
      });
      row.append(el("strong", "", tr(key)), el("span", "keyValue", formatKey(settings.skipKeys[i])), b);
      rows.append(row);
    });
  };
  reset.addEventListener("click", () => {
    settings.skipKeys = SKIP_DEFAULT.slice(); skipBinding = null; saveUserPrefs();
    syncSkipUI(); setStatus("skipBindStatus", "skipAssigned");
  });
  document.querySelectorAll("[data-bind], [data-truckbind]").forEach(b => b.addEventListener("click", () => {
    if (skipBinding !== null) { skipBinding = null; syncSkipUI(); }
  }));
  on("language", syncSkipUI);
  syncSkipUI();
})();
})();
/* ✅ player.js 完了 */
