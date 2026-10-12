// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk130: パックを外したときに、パックが変えた設定（スキン・ノーツ・fxPower・SEのオン）を戻す。
   ・退避は settings.packPrev（保存される）＝パックを使ったまま再起動してから外しても戻せる
   ・パックAからBへ切り替えても上書きしない（最初に退避した値を保つ）
   ・利用者がパックを使っている間に自分で変えた項目は戻さない（その変更が正）
   新しいパックに音が無いときだけ自分のSEを読み直す（切り替え中の競合よけ） */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const custom = fs.readFileSync(`${ROOT}/js/custom.js`, "utf8");
const start = custom.indexOf("/* 📦 パックが変えた設定の退避（trk130）");
const end = custom.indexOf("async function activatePack(");
assert.ok(start >= 0 && end > start, "the pack snapshot/restore helpers can be isolated");
const src = custom.slice(start, end);

const SKINS = { shadow:{}, sakura:{}, forest:{} };
function setup({ prev = null, savedSkinAtBoot = "shadow", seFiles = [null, null] } = {}) {
  const calls = { skins: [], loadedSE: [] };
  const settings = { skin:"sakura", notes:[{ color:"#ffcc00", shape:"circle" }, { color:"#00ccff", shape:"diamond" }],
    fxPower:1.25, seEnabled:false, activePack:"p1", packPrev:prev ? JSON.parse(JSON.stringify(prev)) : null };
  const els = { fxPower:{ value:0 }, seEnabled:{ checked:false } };
  const ctx = vm.createContext({
    console, JSON, Array, Object, String, Number, Math,
    core: { settings, savedSkinAtBoot,
      applySkin(id, persist) { calls.skins.push(id); settings.skin = Object.prototype.hasOwnProperty.call(SKINS, id) ? id : "shadow"; },
      $(id) { return els[id] || null; }, setStatus() {}, saveUserPrefs() {} },
    setNotes(list) { settings.notes = list.map(n => ({ color:n.color, shape:n.shape })); },
    showFxPower() {},
    window: { Trk: { media: { seBuffers:[{}, {}], seFiles, loadSE(file, lane) { calls.loadedSE.push([file, lane]); } } } }
  });
  vm.runInContext(src + "\nglobalThis.__api = { packSnapshot, packApplied, packRestoreSettings, restoreOwnSounds };", ctx);
  return { settings, els, calls, api: ctx.__api };
}

test("a pack that changed the look gives the old look back when it is removed", () => {
  const { settings, els, calls, api } = setup();
  api.packSnapshot();
  api.packApplied({ skin:"pack_p1", notes:[{ color:"#111111", shape:"square" }, { color:"#222222", shape:"triangle" }], fxPower:2, seEnabled:true });
  settings.skin = "pack_p1"; settings.notes = [{ color:"#111111", shape:"square" }, { color:"#222222", shape:"triangle" }];
  settings.fxPower = 2; settings.seEnabled = true; els.fxPower.value = 2; els.seEnabled.checked = true;
  assert.equal(api.packRestoreSettings(), true);
  assert.equal(settings.skin, "sakura", "the user's own skin comes back");
  assert.deepEqual(settings.notes.map(n => n.color), ["#ffcc00", "#00ccff"]);
  assert.equal(settings.fxPower, 1.25);
  assert.equal(settings.seEnabled, false);
  assert.equal(els.fxPower.value, 1.25, "the slider follows");
  assert.equal(els.seEnabled.checked, false, "the checkbox follows");
  assert.equal(settings.packPrev, undefined, "the snapshot is used up");
  assert.ok(calls.skins.includes("sakura"));
});

test("what the user changed while the pack was on is kept", () => {
  const { settings, api } = setup();
  api.packSnapshot();
  api.packApplied({ skin:"pack_p1", notes:[{ color:"#111111", shape:"square" }, { color:"#222222", shape:"triangle" }], fxPower:2, seEnabled:true });
  settings.seEnabled = true;                     /* パックが入れた（利用者は触っていない） */
  settings.skin = "forest";                      /* 利用者が別のスキンを選んだ */
  settings.notes = [{ color:"#ffffff", shape:"circle" }, { color:"#000000", shape:"circle" }];
  settings.fxPower = 0.5;                        /* 動かした */
  assert.equal(api.packRestoreSettings(), true, "the SE switch (which the user did not touch) still comes back");
  assert.equal(settings.skin, "forest");
  assert.deepEqual(settings.notes.map(n => n.color), ["#ffffff", "#000000"]);
  assert.equal(settings.fxPower, 0.5);
  assert.equal(settings.seEnabled, false, "SE goes back to off — the pack turned it on and the user left it alone");
  assert.equal(settings.packPrev, undefined);
});

test("switching from pack A to pack B keeps A's snapshot", () => {
  const { settings, api } = setup();
  api.packSnapshot();
  api.packApplied({ skin:"pack_p1", fxPower:2 });
  /* B を当てるとき（activatePack は snapshot → deactivatePack(false) の順で呼ぶ） */
  settings.packPrev.applied = {};                /* deactivatePack(false) は packRestoreSettings を呼ばない */
  settings.skin = "pack_p1";
  api.packSnapshot();
  assert.equal(settings.packPrev.skin, "sakura", "the first snapshot is not overwritten");
  api.packApplied({ skin:"pack_p2" });
  settings.skin = "pack_p2";
  api.packRestoreSettings();
  assert.equal(settings.skin, "sakura", "removing B brings back the skin from before A");
});

test("a snapshot saved in the settings still works after a restart", () => {
  /* 再起動の再現：起動時の復元（restore:true）は packSnapshot を呼ばず、settings.packPrev をそのまま使う */
  const prev = { skin:"sakura", notes:[{ color:"#ffcc00", shape:"circle" }, { color:"#00ccff", shape:"diamond" }],
    fxPower:1.25, seEnabled:false, applied:{ skin:"pack_p1", fxPower:2, seEnabled:true } };
  const { settings, api } = setup({ prev });
  settings.skin = "pack_p1"; settings.fxPower = 2; settings.seEnabled = true;
  assert.equal(api.packRestoreSettings(), true);
  assert.equal(settings.skin, "sakura");
  assert.equal(settings.fxPower, 1.25);
  assert.equal(settings.seEnabled, false);
});

test("a missing snapshot falls back to the default skin (old data)", () => {
  const { settings, api } = setup();
  settings.skin = "pack_p1";
  assert.equal(api.packRestoreSettings(), false, "no snapshot = nothing to restore");
  assert.equal(settings.skin, "pack_p1");
});

test("the wiring: snapshot before applying, restore only when the pack is really removed", () => {
  const act = custom.slice(custom.indexOf("async function activatePack("), custom.indexOf("function deactivatePack("));
  const deact = custom.slice(custom.indexOf("function deactivatePack("), custom.indexOf("async function installAndUse("));
  const iSnap = act.indexOf("if (!restore) packSnapshot();"), iUnload = act.indexOf("deactivatePack(false);");
  assert.ok(iSnap >= 0 && iUnload > iSnap, "the snapshot is taken before the old pack is unloaded (the unload can reset the skin)");
  assert.ok(act.indexOf("packSnapshot();") < act.indexOf("packApplied("), "prev is captured before applied");
  for (const mark of ["packApplied({ skin: sid })", "packApplied({ notes:", "packApplied({ seEnabled: true })", "packApplied({ fxPower: core.settings.fxPower })"])
    assert.ok(act.includes(mark), `${mark} records what the pack applied`);
  assert.ok(deact.includes("if (persist) packRestoreSettings();"), "removing restores; switching does not");
  assert.ok(deact.indexOf("packRestoreSettings();") < deact.indexOf("delete window.Trk.data.SKINS[sid];"), "restore runs before the pack skin is deleted");
  assert.ok(deact.includes("if (persist) restoreOwnSounds();"), "the SE reload waits until the pack is really removed");
  assert.ok(act.includes("if (!packRuntime.hadSounds && prevHadSounds) restoreOwnSounds();"), "a sound-less pack hands the user's SE back");
  assert.ok(act.includes("if (restore) { core.settings.activePack = null; packRestoreSettings();"), "a missing pack record gives the settings back");
});

test("own sound effects come back, and only the sound-less pack reads them", () => {
  const don = { name:"don.wav" };
  const { settings, calls, api } = setup({ seFiles:[don, null] });
  assert.equal(api.restoreOwnSounds(), true);
  assert.deepEqual(calls.loadedSE, [[don, 0]]);
  assert.equal(api.restoreOwnSounds(), true, "no own sound file for the ka lane leaves it null");
  assert.deepEqual(calls.loadedSE, [[don, 0], [don, 0]]);
});
