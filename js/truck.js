(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：🚚 トラックモード（操作設定つき）・レーンの色付け・揺れ ============
   ・共通の文章（紹介文・操作の案内・記録・称号）は i18n.js にあります。
   ・トラック用のキーは、main.js より先に（キャプチャ段階で）受け取ります。 */
"use strict";

/* ---------- 文章（トラック・揺れの設定だけ） ---------- */
Object.assign(TEXT.ja, {
  secTruck:"🚚 トラックモード",
  truckHint:"操作キーでレーンを移動し、トラックが踏んだノーツは自動で判定されます（キーは「⌨ 操作」で設定）。記録はMANUALとは別に残ります。",
  laneTint:"レーンの色の濃さ", truckBounce:"トラックを跳ねさせる",
  swayTitle:"🌀 レーンの揺れ（TRUCK／ORBIT）", swayBeat:"ビートに合わせて左右に傾ける", swayHit:"ドンで左、カッで右に傾ける",
  swayPower:"揺れの強さ", swayReduced:"OSの「視差効果を減らす」がオンのため、揺れと跳ねは止めています。",
  swayModeHint:"🚚トラックと🪐ORBITは既定で揺れます（それぞれのモードの設定で止められます）。ほかのモードは揺れません。❓謎設定の「全ゲームモードで揺れをオンにする」がいちばん優先されます。",
  swayTruck:"🚚 トラックモードでレーンを揺らす（オフ＝揺れを止める）",
  truckCtlTitle:"🚚 トラックモードの操作",
  truckPresetLayout:"レイアウトに合わせる", truckPresetUD:"↑／↓ に固定", truckPresetLR:"←／→ に固定",
  truckLane0:"レーン1（上／左）", truckLane1:"レーン2（下／右）", truckToggle:"切り替えキー（任意）",
  truckAutoTag:"自動", truckHitKeys:"通常の叩くキーでもレーンを移動する",
  truckCtlHint:"「レイアウトに合わせる」は、横スクロールでは↑↓、縦レイアウトでは←→を使います。切り替えキーは押すたびにレーンを行き来します（片手プレイ向け）。",
  truckCapture0:"レーン1（上／左）に割り当てるキーを押してください。ESCでキャンセル。",
  truckCapture1:"レーン2（下／右）に割り当てるキーを押してください。ESCでキャンセル。",
  truckCapture2:"切り替えキーを押してください。Backspaceで解除、ESCでキャンセル。",
  truckAssigned:"トラックの操作キーを設定しました。", truckToggleCleared:"切り替えキーを解除しました。",
  truckKeysDone:"トラックの操作を「{name}」にしました。", truckPreviewToggle:"切り替え"
});
Object.assign(TEXT.en, {
  secTruck:"🚚 Truck mode",
  truckHint:"Change lanes with your truck keys; notes your truck drives over are judged automatically (set keys in “⌨ Controls”). Records are kept separately from MANUAL.",
  laneTint:"Lane tint strength", truckBounce:"Make the truck bounce",
  swayTitle:"🌀 Lane sway (TRUCK / ORBIT)", swayBeat:"Tilt left/right with the beat", swayHit:"Tilt left on Don, right on Ka",
  swayPower:"Sway strength", swayReduced:"Sway and bounce are off because your system's “reduce motion” setting is on.",
  swayModeHint:"🚚 Truck and 🪐 ORBIT sway by default (each mode can turn it off). Other modes stay still. The ❓ mystery option “Sway in every game mode” wins over both.",
  swayTruck:"🚚 Sway the lane in Truck mode (off = keep it still)",
  truckCtlTitle:"🚚 Truck mode controls",
  truckPresetLayout:"Follow layout", truckPresetUD:"Fixed ↑ / ↓", truckPresetLR:"Fixed ← / →",
  truckLane0:"Lane 1 (top / left)", truckLane1:"Lane 2 (bottom / right)", truckToggle:"Toggle key (optional)",
  truckAutoTag:"auto", truckHitKeys:"Normal hit keys also change lanes",
  truckCtlHint:"“Follow layout” uses ↑↓ for horizontal layouts and ←→ for vertical ones. The toggle key switches lanes on every press (good for one-handed play).",
  truckCapture0:"Press a key for lane 1 (top / left). ESC cancels.",
  truckCapture1:"Press a key for lane 2 (bottom / right). ESC cancels.",
  truckCapture2:"Press a toggle key. Backspace clears, ESC cancels.",
  truckAssigned:"Truck key assigned.", truckToggleCleared:"Toggle key cleared.",
  truckKeysDone:"Truck controls set to “{name}”.", truckPreviewToggle:"Toggle"
});
Object.assign(TEXT.zh, {
  secTruck:"🚚 卡车模式",
  truckHint:"用操作键切换车道，卡车压过的音符会自动判定（按键在“⌨ 操作”中设置）。记录与MANUAL分开保存。",
  laneTint:"车道染色浓度", truckBounce:"让卡车弹跳",
  swayTitle:"🌀 车道摇摆（TRUCK／ORBIT）", swayBeat:"随节拍左右倾斜", swayHit:"咚向左、咔向右倾斜",
  swayPower:"摇摆强度", swayReduced:"系统已开启“减弱动态效果”，摇摆和弹跳已关闭。",
  swayModeHint:"🚚卡车与🪐ORBIT 默认摇摆（可在各自模式设置中关闭）。其他模式不摇摆。❓谜之设定中的“所有游戏模式都摇摆”优先级最高。",
  swayTruck:"🚚 卡车模式下摇摆车道（关闭＝不摇）",
  truckCtlTitle:"🚚 卡车模式操作",
  truckPresetLayout:"跟随布局", truckPresetUD:"固定 ↑／↓", truckPresetLR:"固定 ←／→",
  truckLane0:"车道1（上／左）", truckLane1:"车道2（下／右）", truckToggle:"切换键（可选）",
  truckAutoTag:"自动", truckHitKeys:"普通敲击键也能切换车道",
  truckCtlHint:"“跟随布局”在横向布局使用↑↓，纵向布局使用←→。切换键每按一次就在两条车道间切换（适合单手游玩）。",
  truckCapture0:"请按下车道1（上／左）的按键。ESC取消。",
  truckCapture1:"请按下车道2（下／右）的按键。ESC取消。",
  truckCapture2:"请按下切换键。Backspace解除，ESC取消。",
  truckAssigned:"已设置卡车操作键。", truckToggleCleared:"已解除切换键。",
  truckKeysDone:"已将卡车操作设为“{name}”。", truckPreviewToggle:"切换"
});
Object.assign(TEXT.ko, {
  secTruck:"🚚 트럭 모드",
  truckHint:"조작 키로 레인을 옮기면 트럭이 밟은 노트가 자동으로 판정됩니다 (키는 '⌨ 조작'에서 설정). 기록은 MANUAL과 따로 남습니다.",
  laneTint:"레인 색 농도", truckBounce:"트럭 통통 튀기기",
  swayTitle:"🌀 레인 흔들림 (TRUCK／ORBIT)", swayBeat:"비트에 맞춰 좌우로 기울이기", swayHit:"쿵은 왼쪽, 딱은 오른쪽으로 기울이기",
  swayPower:"흔들림 강도", swayReduced:"시스템의 '동작 줄이기'가 켜져 있어 흔들림과 튀기기를 껐습니다.",
  swayModeHint:"🚚트럭과 🪐ORBIT는 기본적으로 흔들립니다(각 모드 설정에서 끌 수 있음). 다른 모드는 흔들리지 않습니다. ❓ 수수께끼 설정의 '모든 게임 모드에서 흔들기'가 가장 우선합니다.",
  swayTruck:"🚚 트럭 모드에서 레인 흔들기 (끄면 흔들리지 않음)",
  truckCtlTitle:"🚚 트럭 모드 조작",
  truckPresetLayout:"레이아웃에 맞추기", truckPresetUD:"↑／↓ 고정", truckPresetLR:"←／→ 고정",
  truckLane0:"레인 1 (위／왼쪽)", truckLane1:"레인 2 (아래／오른쪽)", truckToggle:"전환 키 (선택)",
  truckAutoTag:"자동", truckHitKeys:"일반 두드리기 키로도 레인 이동",
  truckCtlHint:"'레이아웃에 맞추기'는 가로 레이아웃에서 ↑↓, 세로 레이아웃에서 ←→를 씁니다. 전환 키는 누를 때마다 레인을 오갑니다 (한 손 플레이용).",
  truckCapture0:"레인 1 (위／왼쪽)로 지정할 키를 누르세요. ESC로 취소.",
  truckCapture1:"레인 2 (아래／오른쪽)로 지정할 키를 누르세요. ESC로 취소.",
  truckCapture2:"전환 키를 누르세요. Backspace로 해제, ESC로 취소.",
  truckAssigned:"트럭 조작 키를 설정했습니다.", truckToggleCleared:"전환 키를 해제했습니다.",
  truckKeysDone:"트럭 조작을 '{name}'(으)로 바꿨습니다.", truckPreviewToggle:"전환"
});

/* ---------- 設定（初期値：色付けはほんのり、揺れと跳ねはオフ、操作はレイアウトに合わせる） ---------- */
window.Trk.core.settings.laneTint = window.Trk.core.num(window.Trk.core.prefs.laneTint, 0, .5, .12);
window.Trk.core.settings.truckBounce = window.Trk.core.prefs.truckBounce !== false;
window.Trk.core.settings.swayBeat = window.Trk.core.prefs.swayBeat !== false;
window.Trk.core.settings.swayHit = window.Trk.core.prefs.swayHit !== false;
window.Trk.core.settings.swayPower = window.Trk.core.num(window.Trk.core.prefs.swayPower, .2, 2, 1.1);
/* 🌀 揺れるモード：既定は 🚚TRUCK と 🪐ORBIT だけ。それぞれのモードで止められます。
   （🪐ORBIT のチェックボックスは modes.js が作ります）
   ❓謎設定の swayAllModes は「揺らさない」設定より優先して、全モードで揺らします。 */
window.Trk.core.settings.swayTruck = window.Trk.core.prefs.swayTruck !== false;
window.Trk.core.settings.swayOrbit = window.Trk.core.prefs.swayOrbit !== false;
window.Trk.core.settings.swayAllModes = window.Trk.core.prefs.swayAllModes === true;
const TRUCK_PRESETS = { ud:["ArrowUp", "ArrowDown"], lr:["ArrowLeft", "ArrowRight"] };
window.Trk.core.settings.truckKeyMode = window.Trk.core.pick(window.Trk.core.prefs.truckKeyMode, ["layout", "custom"], "layout");
window.Trk.core.settings.truckKeys = (Array.isArray(window.Trk.core.prefs.truckKeys) && window.Trk.core.prefs.truckKeys.length === 2 && window.Trk.core.prefs.truckKeys.every(window.Trk.core.validCode) && window.Trk.core.prefs.truckKeys[0] !== window.Trk.core.prefs.truckKeys[1])
  ? window.Trk.core.prefs.truckKeys.slice() : TRUCK_PRESETS.ud.slice();
window.Trk.core.settings.truckToggleKey = window.Trk.core.validCode(window.Trk.core.prefs.truckToggleKey) && !window.Trk.core.settings.truckKeys.includes(window.Trk.core.prefs.truckToggleKey) ? window.Trk.core.prefs.truckToggleKey : "";
window.Trk.core.settings.truckHitKeys = window.Trk.core.prefs.truckHitKeys !== false;
const isTruck = () => window.Trk.core.settings.playMode === "truck";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- トラックの操作キー ----------
   キーは「画面上の位置」に対応します（0＝上か左、1＝下か右）。
   位置→レーンは slotLane() で変換するので、左右反転をオンにしても ↑ は上のレーンのままです。 */
const truckPosKeys = () => window.Trk.core.settings.truckKeyMode === "layout"
  ? (window.Trk.play.layout().vertical ? TRUCK_PRESETS.lr : TRUCK_PRESETS.ud)
  : window.Trk.core.settings.truckKeys;
const truckPosOfKey = code => truckPosKeys().indexOf(code);
function truckKeysLabel(pos) {   // プレイ中のキー案内（render.js から使います）
  const list = [truckPosKeys()[pos]];
  if (window.Trk.core.settings.truckHitKeys) list.push(window.Trk.core.settings.keys[pos], window.Trk.core.settings.subKeys[pos]);
  return list.filter(Boolean).map(window.Trk.core.formatKey).join("/");
}

/* ---------- トラックの状態 ---------- */
const TRUCK_ROW = 42;   // 横スクロールで、ドン／カッの段を上下にずらす量
const truckState = { lane:0, vis:0, last:0, dash:-1e9 };
function resetTruck() { truckState.lane = 0; truckState.vis = window.Trk.core.laneCol(0); truckState.last = performance.now(); truckState.dash = -1e9; }
function steerTruck(lane) {
  const changed = lane !== truckState.lane;
  truckState.lane = lane;
  const p = performance.now();
  if (changed) truckState.dash = p;
  window.Trk.core.pressFlash[window.Trk.core.laneCol(lane)] = p;
}
const truckRowY = (L, lane) => L.laneY + (window.Trk.core.laneCol(lane) ? 1 : -1) * TRUCK_ROW;

/* ---------- 判定：トラックと同じレーンのノーツを自動で踏む（AUTOでないとき。render.js から） ---------- */
function truckJudge(now) {
  const w = window.Trk.core.windows();
  for (let i = window.Trk.core.nextIdx; i < window.Trk.core.chart.length; i++) {
    if (window.Trk.core.phase !== "playing") return;
    const n = window.Trk.core.chart[i]; if (n.time > now) break;
    if (n.judged || n.lane !== truckState.lane) continue;
    const d = now - n.time;
    if (d > w.good) continue;                       // 間に合わなければ sweepMisses がMISSにします
    window.Trk.play.judgeNote(n, d <= w.perfect ? "perfect" : "good", d);
    window.Trk.media.playSE(n.lane);
    const p = performance.now(); window.Trk.core.pressFlash[window.Trk.core.laneCol(n.lane)] = p; window.Trk.core.pressH = { lane:n.lane, t:p };
  }
}

/* ---------- キー入力（main.js より先に受け取る） ---------- */
let truckBinding = null;   // 0＝レーン1、1＝レーン2、2＝切り替えキー
const TRUCK_RESERVED = new Set(["KeyP", "Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight", "Backquote", "Minus", "Equal", "Backspace"]);
addEventListener("keydown", e => {
  if (window.Trk.overlay.any()) return;
  if (truckBinding !== null) { e.preventDefault(); e.stopImmediatePropagation(); captureTruckKey(e.code); return; }
  if (window.Trk.core.phase !== "playing" || !isTruck() || window.Trk.core.bindingSlot !== null || window.Trk.core.settings.autoPlay) return;   // AUTO中は自動で動く
  if (window.Trk.core.settings.truckToggleKey && e.code === window.Trk.core.settings.truckToggleKey) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (!e.repeat) steerTruck(1 - truckState.lane);
    return;
  }
  const pos = truckPosOfKey(e.code);
  if (pos >= 0) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (!e.repeat) steerTruck(window.Trk.core.slotLane(pos));
    return;
  }
  if (!window.Trk.core.settings.truckHitKeys && window.Trk.core.slotOfKey(e.code) >= 0) { e.preventDefault(); e.stopImmediatePropagation(); }   // 叩くキーでは動かさない
}, true);

function captureTruckKey(code) {
  const slot = truckBinding;
  if (!code || slot === null) return;
  if (code === "Escape") { truckBinding = null; window.Trk.core.setStatus("truckBindStatus", "cancelBind"); syncTruckKeyUI(); return; }
  if (slot === 2 && code === "Backspace") {
    window.Trk.core.settings.truckToggleKey = ""; truckBinding = null; window.Trk.core.saveUserPrefs();
    window.Trk.core.setStatus("truckBindStatus", "truckToggleCleared"); syncTruckKeyUI(); return;
  }
  if (TRUCK_RESERVED.has(code) || (window.Trk.core.settings.speedKeys || []).includes(code)) { window.Trk.core.setStatus("truckBindStatus", "reservedKey"); return; }
  const others = slot === 2 ? truckPosKeys() : [window.Trk.core.settings.truckKeys[1 - slot], window.Trk.core.settings.truckToggleKey];
  if (others.includes(code)) { window.Trk.core.setStatus("truckBindStatus", "duplicateKey"); return; }
  if (slot === 2) window.Trk.core.settings.truckToggleKey = code; else window.Trk.core.settings.truckKeys[slot] = code;
  truckBinding = null; window.Trk.core.saveUserPrefs();
  window.Trk.core.setStatus("truckBindStatus", "truckAssigned"); syncTruckKeyUI();
}

/* ---------- 操作設定の表示 ---------- */
function syncTruckKeyUI() {
  const keys = truckPosKeys(), auto = window.Trk.core.settings.truckKeyMode === "layout";
  for (const i of [0, 1]) window.Trk.core.$("truckKeyValue" + i).textContent = window.Trk.core.formatKey(keys[i]) + (auto ? ` (${tr("truckAutoTag")})` : "");
  window.Trk.core.$("truckKeyValue2").textContent = window.Trk.core.settings.truckToggleKey ? window.Trk.core.formatKey(window.Trk.core.settings.truckToggleKey) : tr("unset");
  window.Trk.core.$("truckHitKeys").checked = window.Trk.core.settings.truckHitKeys;
  const sel = auto ? "layout"
    : window.Trk.core.settings.truckKeys.join() === TRUCK_PRESETS.ud.join() ? "ud"
    : window.Trk.core.settings.truckKeys.join() === TRUCK_PRESETS.lr.join() ? "lr" : "";
  document.querySelectorAll("#truckKeyPresets button").forEach(b => {
    b.classList.toggle("selected", b.dataset.truckpreset === sel); b.setAttribute("aria-pressed", b.dataset.truckpreset === sel);
  });
  document.querySelectorAll("[data-truckbind]").forEach(b => b.classList.toggle("listening", truckBinding === +b.dataset.truckbind));
  const parts = [0, 1].map(p => `${window.Trk.core.laneName(window.Trk.core.slotLane(p))}: [${truckKeysLabel(p)}]`);
  if (window.Trk.core.settings.truckToggleKey) parts.push(`${tr("truckPreviewToggle")}: [${window.Trk.core.formatKey(window.Trk.core.settings.truckToggleKey)}]`);
  window.Trk.core.$("truckKeyPreview").textContent = parts.join("   ·   ");
}
window.Trk.core.$("truckKeyPresets").addEventListener("click", e => {
  const b = e.target.closest("button[data-truckpreset]"); if (!b) return;
  const id = b.dataset.truckpreset;
  if (id === "layout") window.Trk.core.settings.truckKeyMode = "layout";
  else { window.Trk.core.settings.truckKeyMode = "custom"; window.Trk.core.settings.truckKeys = TRUCK_PRESETS[id].slice(); }
  if (truckPosKeys().includes(window.Trk.core.settings.truckToggleKey)) window.Trk.core.settings.truckToggleKey = "";
  truckBinding = null; window.Trk.core.saveUserPrefs(); syncTruckKeyUI();
  window.Trk.core.setStatus("truckBindStatus", "truckKeysDone", { name:b.textContent });
});
document.querySelectorAll("[data-truckbind]").forEach(b => b.addEventListener("click", () => {
  const slot = +b.dataset.truckbind;
  if (slot < 2 && window.Trk.core.settings.truckKeyMode === "layout") {   // 自動から自分で設定に切り替え（今のキーを元にする）
    window.Trk.core.settings.truckKeys = truckPosKeys().slice(); window.Trk.core.settings.truckKeyMode = "custom"; window.Trk.core.saveUserPrefs();
  }
  window.Trk.core.bindingSlot = null; window.Trk.core.updateKeyUI();                        // 通常のキー設定と同時に待たない
  truckBinding = slot; b.blur();
  window.Trk.core.setStatus("truckBindStatus", "truckCapture" + slot); syncTruckKeyUI();
}));
document.querySelectorAll("[data-bind]").forEach(b => b.addEventListener("click", () => {
  if (truckBinding !== null) { truckBinding = null; syncTruckKeyUI(); }
}));
window.Trk.core.$("truckHitKeys").addEventListener("change", e => { window.Trk.core.settings.truckHitKeys = e.target.checked; window.Trk.core.saveUserPrefs(); syncTruckKeyUI(); });
window.Trk.core.$("layoutPicker").addEventListener("click", () => setTimeout(syncTruckKeyUI, 0));   // レイアウトで自動のキーが変わる
window.Trk.core.$("reverseHands").addEventListener("change", () => setTimeout(syncTruckKeyUI, 0));
document.querySelectorAll("#keyPresets, [data-bind]").forEach(n => n.addEventListener("click", () => setTimeout(syncTruckKeyUI, 0)));
addEventListener("keyup", () => { if (window.Trk.overlay.is("study")) return; if (window.Trk.core.bindingSlot === null) syncTruckKeyUI(); });   // 通常キーの変更をプレビューに反映
window.Trk.core.on("language", syncTruckKeyUI);

/* ---------- レーンの色付け（スキンのアクセント色） ---------- */
function drawLaneTint(L) {
  const a = window.Trk.core.settings.laneTint; if (a <= 0) return;
  window.Trk.core.ctx.fillStyle = window.Trk.data.hexToRgba(window.Trk.data.toHex(window.Trk.core.skin().ui["--ui-accent"]), a);
  if (L.vertical) {
    const x0 = L.centers[0] - L.laneW / 2, x1 = L.centers[1] + L.laneW / 2;
    window.Trk.core.ctx.fillRect(x0, L.topY, x1 - x0, L.hitY - L.topY);
  } else { window.Trk.play.rr(L.hitX - 110, L.laneY - 84, L.endX - L.hitX + 170, 168, 42); window.Trk.core.ctx.fill(); }
}

/* ---------- 揺れ（判定位置を軸に傾けるので、叩く場所はほとんど動きません） ---------- */
function lanePivot(L) {
  return L.vertical ? { x:(L.centers[0] + L.centers[1]) / 2, y:L.hitY } : { x:L.hitX, y:L.laneY };
}
/* いまのモードで揺らすか（純粋関数・テストしやすいように分離） */
/* 既定で揺れるモード（🚚トラック／🪐ORBIT） */
const SWAY_DEFAULT_MODES = ["truck", "orbit"];
function swayModeOn(mode) {
  if (window.Trk.core.settings.swayAllModes) return true;                 // ❓謎設定が最優先
  const m = mode || window.Trk.core.settings.playMode;
  if (m === "truck") return window.Trk.core.settings.swayTruck !== false;
  if (m === "orbit") return window.Trk.core.settings.swayOrbit !== false;
  return false;                                          // ほかのモード（MANUAL・STAGE・CATCH）は既定で揺れない
}
function laneTilt(now) {
  if (reduceMotion.matches || !swayModeOn()) return 0;
  const D = Math.PI / 180, k = window.Trk.core.settings.swayPower * window.Trk.core.gameplayFxMultiplier(), p = performance.now();
  let a = 0;
  if (window.Trk.core.settings.swayBeat && window.Trk.core.chartMeta.bpm) a += Math.sin(Math.PI * (now - window.Trk.core.chartMeta.offset) / (60000 / window.Trk.core.chartMeta.bpm)) * 1.4 * D * k;
  if (window.Trk.core.settings.swayHit) {
    const dk = t => Math.max(0, 1 - (p - t) / 260);
    a += (dk(window.Trk.core.avatarHit[1]) - dk(window.Trk.core.avatarHit[0])) * 2.2 * D * k;   // ドン＝左（反時計回り）、カッ＝右
  }
  return a;
}

/* ---------- トラック本体（Canvasで描いたオリジナル） ---------- */
function drawTruck(L, now) {
  const p = performance.now(), dt = Math.min(.05, Math.max(0, (p - truckState.last) / 1000));
  truckState.last = p;
  const col = window.Trk.core.laneCol(truckState.lane);
  truckState.vis += (col - truckState.vis) * Math.min(1, dt * 16);
  const v = truckState.vis, lean = (col - v) * .35;
  const hitK = Math.max(0, 1 - (p - Math.max(window.Trk.core.avatarHit[0], window.Trk.core.avatarHit[1])) / 180);
  const bounce = window.Trk.core.settings.truckBounce && !reduceMotion.matches ? (hitK * 9 + window.Trk.play.beatPulse(now) * 3) * window.Trk.core.gameplayFxMultiplier() : 0;
  window.Trk.core.ctx.save();
  if (L.vertical) {
    window.Trk.core.ctx.translate(L.centers[0] + (L.centers[1] - L.centers[0]) * v, L.hitY);
    window.Trk.core.ctx.rotate(-Math.PI / 2); window.Trk.core.ctx.scale(.8 + bounce * .006, .8 + bounce * .006);
  } else {
    window.Trk.core.ctx.translate(L.hitX, L.laneY - TRUCK_ROW + 2 * TRUCK_ROW * v - bounce);
    window.Trk.core.ctx.scale(.78, .78);
  }
  window.Trk.core.ctx.rotate(lean);
  const cab = window.Trk.core.laneColor(truckState.lane), ink = "#1b1b22";
  const dashAge = p - truckState.dash;
  if (dashAge >= 0 && dashAge < 260 && window.Trk.core.gameplayFxPower() > 0) {
    window.Trk.core.ctx.save(); window.Trk.core.ctx.globalAlpha = (1 - dashAge / 260) * Math.min(1, window.Trk.core.gameplayFxPower());
    window.Trk.core.ctx.strokeStyle = cab; window.Trk.core.ctx.lineWidth = 5; window.Trk.core.ctx.lineCap = "round";
    for (const y of [-18, 0, 18]) { window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.moveTo(-142, y); window.Trk.core.ctx.lineTo(-94, y + lean * 18); window.Trk.core.ctx.stroke(); }
    window.Trk.core.ctx.restore();
  }
  window.Trk.core.ctx.lineJoin = "round";
  window.Trk.core.ctx.fillStyle = "rgba(0,0,0,.28)"; window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.ellipse(-35, 36, 70, 8, 0, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill();   // 影
  window.Trk.play.rr(-100, -30, 82, 52, 7); window.Trk.core.ctx.fillStyle = "#f4f4f8"; window.Trk.core.ctx.fill();                                          // 荷台
  window.Trk.core.ctx.lineWidth = 3; window.Trk.core.ctx.strokeStyle = ink; window.Trk.core.ctx.stroke();
  window.Trk.core.ctx.fillStyle = cab; window.Trk.core.ctx.fillRect(-100, 4, 82, 7);
  window.Trk.core.ctx.fillStyle = ink; window.Trk.core.ctx.font = `900 18px ${window.Trk.core.fontFamily()}`; window.Trk.core.ctx.textAlign = "center"; window.Trk.core.ctx.textBaseline = "middle";
  window.Trk.core.ctx.fillText("trk!", -59, -12);
  window.Trk.play.rr(-16, -18, 44, 40, 9); window.Trk.core.ctx.fillStyle = cab; window.Trk.core.ctx.fill(); window.Trk.core.ctx.stroke();                                  // 運転席（今のレーンの色）
  window.Trk.play.rr(6, -12, 17, 14, 4); window.Trk.core.ctx.fillStyle = "#cfeaff"; window.Trk.core.ctx.fill();
  window.Trk.core.ctx.fillStyle = "#ffe27a"; window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(27, 12, 4 + hitK * 2, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill();            // ヘッドライト
  if (hitK > 0 && window.Trk.core.gameplayFxPower() > 0) {
    window.Trk.core.ctx.globalCompositeOperation = "lighter";
    const gr = window.Trk.core.ctx.createRadialGradient(30, 12, 0, 30, 12, 44);
    gr.addColorStop(0, `rgba(255,226,122,${Math.min(.8, .4 * window.Trk.core.gameplayFxPower()) * hitK})`); gr.addColorStop(1, "rgba(255,226,122,0)");
    window.Trk.core.ctx.fillStyle = gr; window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(30, 12, 44, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill();
    window.Trk.core.ctx.globalCompositeOperation = "source-over";
  }
  const spin = (p / 60) % window.Trk.data.TAU;                                                                              // タイヤ
  for (const wx of [-78, -40, 12]) {
    window.Trk.core.ctx.fillStyle = ink; window.Trk.core.ctx.beginPath(); window.Trk.core.ctx.arc(wx, 24, 11, 0, window.Trk.data.TAU); window.Trk.core.ctx.fill();
    window.Trk.core.ctx.strokeStyle = "#9aa0aa"; window.Trk.core.ctx.lineWidth = 2; window.Trk.core.ctx.beginPath();
    window.Trk.core.ctx.moveTo(wx + Math.cos(spin) * 7, 24 + Math.sin(spin) * 7); window.Trk.core.ctx.lineTo(wx - Math.cos(spin) * 7, 24 - Math.sin(spin) * 7); window.Trk.core.ctx.stroke();
  }
  window.Trk.core.ctx.restore();
}

/* ---------- 設定画面（見た目の欄） ---------- */
function showTruckVals() {
  window.Trk.core.$("laneTintVal").textContent = Math.round(window.Trk.core.settings.laneTint * 100) + "%";
  window.Trk.core.$("swayPowerVal").textContent = Math.round(window.Trk.core.settings.swayPower * 100) + "%";
}
window.Trk.core.$("laneTint").value = window.Trk.core.settings.laneTint;
window.Trk.core.$("swayPower").value = window.Trk.core.settings.swayPower;
window.Trk.core.$("truckBounce").checked = window.Trk.core.settings.truckBounce;
window.Trk.core.$("swayBeat").checked = window.Trk.core.settings.swayBeat;
window.Trk.core.$("swayHit").checked = window.Trk.core.settings.swayHit;
window.Trk.core.$("swayTruck").checked = window.Trk.core.settings.swayTruck;
showTruckVals();
window.Trk.core.$("laneTint").addEventListener("input", e => { window.Trk.core.settings.laneTint = Number(e.target.value); showTruckVals(); window.Trk.core.saveUserPrefs(); });
window.Trk.core.$("swayPower").addEventListener("input", e => { window.Trk.core.settings.swayPower = Number(e.target.value); showTruckVals(); window.Trk.core.saveUserPrefs(); });
for (const id of ["truckBounce", "swayTruck", "swayBeat", "swayHit"]) {
  window.Trk.core.$(id).addEventListener("change", e => { window.Trk.core.settings[id] = e.target.checked; window.Trk.core.saveUserPrefs(); });
}
const syncReducedNote = () => { window.Trk.core.$("swayReducedNote").hidden = !reduceMotion.matches; };
if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", syncReducedNote);
syncReducedNote();
setTimeout(syncTruckKeyUI, 0);   // 言語の反映が終わってから表示
/* ✅ truck.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.drawLaneTint = drawLaneTint;
window.drawTruck = drawTruck;
window.isTruck = isTruck;
window.lanePivot = lanePivot;
window.laneTilt = laneTilt;
window.reduceMotion = reduceMotion;
window.resetTruck = resetTruck;
window.steerTruck = steerTruck;
window.syncTruckKeyUI = syncTruckKeyUI;
Object.defineProperty(window, "truckBinding", { configurable:true, get:() => truckBinding, set:v => { truckBinding = v; } });
window.truckJudge = truckJudge;
window.truckKeysLabel = truckKeysLabel;
window.truckPosKeys = truckPosKeys;
window.truckRowY = truckRowY;
window.truckState = truckState;
})();
