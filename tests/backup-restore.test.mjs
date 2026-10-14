// SPDX-License-Identifier: GPL-3.0-or-later
/* trk160–162: ZIP/backup hard limits, pack restore ordering, and user-visible restore reporting. */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

function loadZipIO() {
  const sandbox = { window:{}, console, TextEncoder, TextDecoder, Blob, File, Response, Uint8Array, DataView, ArrayBuffer,
    BigInt, CompressionStream, DecompressionStream, Map, Math, Number, String, Array, Error, Promise, Uint32Array };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(`${ROOT}/js/zip-io.js`, "utf8"), sandbox);
  return sandbox.window.Trk.zipIO;
}
const Z = loadZipIO();
const freshMeta = () => ({ format:"trk-backup", version:1, app:"trk", createdAt:"2026-10-14T00:00:00.000Z",
  areas:{ core:false, study:false, packs:true, media:false }, counts:{ ls:0, library:0, study:{ books:0, pages:0 }, packs:0, media:0 } });
async function packBlob(id) {
  return Z.zipWrite([{ name:"pack.json", blob:new Blob([JSON.stringify({ id, format:"shadow-taiko-pack", name:id, author:"test" })]), deflate:true }]);
}
async function backupFile(entries = [], { packs = true } = {}) {
  const meta = freshMeta(); meta.areas.packs = packs;
  return Z.zipWrite([
    { name:"backup.json", blob:new Blob([JSON.stringify(meta)]), deflate:true },
    ...entries.map((blob, i) => ({ name:`packs/${String(i + 1).padStart(4, "0")}.stpack`, blob })),
  ]);
}
test("backup restore reports ZIP entry-count safety caps as non-bypassable", async () => {
  const restore = loadBackup({ idb:mockIDB(new Map(), []), custom:{}, limitsIgnored:true });
  const valid = await Z.zipWrite([
    { name:"backup.json", blob:new Blob([JSON.stringify(freshMeta())]), deflate:true },
  ], { forceZip64:true });
  const bytes = new Uint8Array(await valid.arrayBuffer());
  let record = -1;
  for (let i = 0; i + 4 <= bytes.length; i++) if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x06 && bytes[i + 3] === 0x06) { record = i; break; }
  assert.ok(record >= 0, "forced ZIP64 end record is present");
  const view = new DataView(bytes.buffer);
  view.setBigUint64(record + 24, BigInt(Z.limits.entries + 1), true);
  view.setBigUint64(record + 32, BigInt(Z.limits.entries + 1), true);
  await assert.rejects(restore.readBackupMeta(new Blob([bytes])), e => e.key === "backupHardLimit");
});

async function studyBackup({ pageBytes = 101, declaredPageSize = 1 } = {}) {
  const meta = freshMeta(); meta.areas = { core:false, study:true, packs:false, media:false };
  const book = [{ k:{ s:"book-1" }, v:{ id:"book-1", kind:"image", pages:[{ key:"page-1", size:declaredPageSize }] } }];
  const pages = [{ k:{ s:"page-1" }, v:{ $blob:"blobs/0000001", type:"image/png", file:false, name:"", mtime:0 } }];
  return Z.zipWrite([
    { name:"backup.json", blob:new Blob([JSON.stringify(meta)]), deflate:true },
    { name:"db/trk_study_room_v1/books.json", blob:new Blob([JSON.stringify(book)]), deflate:true },
    { name:"db/trk_study_room_v1/pages.json", blob:new Blob([JSON.stringify(pages)]), deflate:true },
    { name:"blobs/0000001", blob:new Blob([new Uint8Array(pageBytes)]) },
  ]);
}
function mockIDB(packStore, events) {
  const stores = new Map([["packs", packStore]]);
  const db = {
    objectStoreNames:{ contains:name => stores.has(name) },
    createObjectStore(name) { const store = new Map(); stores.set(name, store); return { createIndex() {} }; },
    close() {},
    transaction(name) {
      const map = stores.get(name);
      const tx = { error:null, oncomplete:null, onerror:null, onabort:null, abort() { this.onabort?.(); } };
      const os = {
        getAllKeys() {
          const req = { result:null, onsuccess:null, onerror:null };
          setTimeout(() => {
            req.result = [...map.keys()];
            req.onsuccess?.();
            setTimeout(() => tx.oncomplete?.(), 0);
          }, 0);
          return req;
        },
        delete(key) { events.push(`delete:${key}`); map.delete(key); },
      };
      tx.objectStore = () => os;
      return tx;
    },
  };
  return {
    databases:async () => [{ name:"shadow_taiko_packs" }],
    open() {
      const req = { result:null, onsuccess:null, onerror:null, onblocked:null, onupgradeneeded:null };
      setTimeout(() => { req.result = db; req.onsuccess?.(); }, 0);
      return req;
    },
  };
}
function loadBackup({ idb, custom, tr = (key, vars = {}) => `${key}:${JSON.stringify(vars)}`, elements = {},
  confirmFn = () => true, alertFn = () => {}, reloadFn = () => {}, limitsIgnored = true,
  studyLimits = { shelf:500, pages:3000, imageBytes:600 * 1048576, imageFileBytes:100 * 1048576, textBytes:12 * 1048576 } }) {
  const window = { tr, alert:alertFn, Trk:{ core:{ storageLimitsIgnored:() => limitsIgnored, $:() => null, setStatus() {} }, custom, zipIO:Z, studyLimits } };
  const sandbox = {
    window, document:{ readyState:"complete", getElementById:id => elements[id] || null, addEventListener() {} },
    confirm:confirmFn, location:{ reload:reloadFn },
    indexedDB:idb, localStorage:{ getItem:() => null, setItem() {}, removeItem() {} },
    console, Blob, File, Date, Number, String, Array, Object, JSON, Math, Error, Promise, ArrayBuffer, Uint8Array, DataView, Map, Set,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(`${ROOT}/js/backup.js`, "utf8"), sandbox);
  return window.Trk.backup;
}

function customFor(store, events, failIds = []) {
  return {
    packIdentityFromManifest(raw) { return raw && typeof raw.id === "string" ? { id:raw.id } : null; },
    async installPackFile(file) {
      const id = file.name.includes("0001") ? "target-good" : "target-fail";
      events.push(`install:${id}`);
      if (failIds.includes(id)) return null;
      store.set(id, { id, value:"restored" });
      return { id };
    },
  };
}

test("failed replacement preserves its old pack; successful installs precede pruning absent IDs", async () => {
  const events = [];
  const oldFailed = { id:"target-fail", value:"pre-existing version" };
  const store = new Map([
    ["target-fail", oldFailed],
    ["target-good", { id:"target-good", value:"old version" }],
    ["stale", { id:"stale", value:"not in backup" }],
  ]);
  const custom = customFor(store, events, ["target-fail"]);
  const restore = loadBackup({ idb:mockIDB(store, events), custom });
  const file = await backupFile([await packBlob("target-good"), await packBlob("target-fail")]);
  const result = await restore.restoreBackup(file);

  assert.equal(result.packsOk, 1);
  assert.equal(result.packsFailed, 1);
  assert.equal(result.packsRemoved, 1);
  assert.equal(result.packCleanupSkipped, false);
  assert.deepEqual(events, ["install:target-good", "install:target-fail", "delete:stale"]);
  assert.equal(store.get("target-good").value, "restored");
  assert.equal(store.get("target-fail"), oldFailed, "failed replacement leaves the previous same-ID pack untouched");
  assert.equal(store.has("stale"), false, "only an ID absent from the backup is pruned");
});

test("an unidentifiable backup pack disables pruning rather than risking unrelated data", async () => {
  const events = [];
  const store = new Map([["keep-me", { id:"keep-me", value:"safe" }], ["stale", { id:"stale" }]]);
  const custom = {
    packIdentityFromManifest() { return null; },
    async installPackFile() { events.push("install:failed"); return null; },
  };
  const restore = loadBackup({ idb:mockIDB(store, events), custom });
  const malformedInner = await Z.zipWrite([{ name:"other.json", blob:new Blob(["not a pack"]) }]);
  const result = await restore.restoreBackup(await backupFile([malformedInner]));
  assert.equal(result.packsFailed, 1);
  assert.equal(result.packsRemoved, 0);
  assert.equal(result.packCleanupSkipped, true, "the report can distinguish preserved data from a clean inventory");
  assert.deepEqual(events, ["install:failed"]);
  assert.equal(store.has("keep-me"), true);
  assert.equal(store.has("stale"), true);
});

test("an intentionally empty pack area removes all installed pack IDs", async () => {
  const events = [];
  const store = new Map([["old-a", { id:"old-a" }], ["old-b", { id:"old-b" }]]);
  const custom = {
    packIdentityFromManifest(raw) { return raw && typeof raw.id === "string" ? { id:raw.id } : null; },
    async installPackFile() { throw new Error("there are no pack entries"); },
  };
  const restore = loadBackup({ idb:mockIDB(store, events), custom });
  const result = await restore.restoreBackup(await backupFile());
  assert.equal(result.packsOk, 0);
  assert.equal(result.packsFailed, 0);
  assert.equal(result.packsRemoved, 2);
  assert.equal(result.packCleanupSkipped, false);
  assert.equal(store.size, 0);
  assert.deepEqual(events, ["delete:old-a", "delete:old-b"]);
});

test("packs omitted from a backup are reported as unchanged and are not pruned", async () => {
  const events = [], store = new Map([["keep", { id:"keep" }]]);
  const custom = {
    packIdentityFromManifest() { return null; },
    async installPackFile() { throw new Error("packs must not be installed"); },
  };
  const restore = loadBackup({ idb:mockIDB(store, events), custom });
  const result = await restore.restoreBackup(await backupFile([], { packs:false }));
  assert.equal(result.packsOk, 0);
  assert.equal(result.packsRemoved, 0);
  assert.equal(result.packCleanupSkipped, false, "not including the pack area is not a failed cleanup");
  assert.equal(store.has("keep"), true);
  assert.deepEqual(events, []);
});

test("backup restore enforces shelf, page, file and per-album byte caps, using actual blob sizes", () => {
  const limits = { shelf:2, pages:10, imageBytes:600, imageFileBytes:100, textBytes:12 };
  const check = loadBackup({ idb:mockIDB(new Map(), []), custom:{}, limitsIgnored:false, studyLimits:limits }).checkStudyLimits;
  const imageBook = sizes => ({ v:{ kind:"image", pages:sizes.map((size, index) => ({ key:`page-${index}`, size })) } });
  const invalid = book => assert.throws(() => check([book]), e => e.key === "backupRestoreLimit");

  assert.doesNotThrow(() => check([imageBook([100, 100, 100, 100, 100, 100])]));
  invalid(imageBook(Array(11).fill(0)));
  invalid(imageBook([101]));
  invalid(imageBook([86, 86, 86, 86, 86, 86, 86]));
  invalid({ v:{ kind:"text", content:"1234567890123", pages:[] } });
  assert.throws(() => check(Array.from({ length:3 }, () => ({ v:{ kind:"text", pages:[] } }))), e => e.key === "backupRestoreLimit");

  const actualSizeCheck = loadBackup({ idb:mockIDB(new Map(), []), custom:{}, limitsIgnored:false, studyLimits:limits }).checkStudyLimits;
  assert.throws(() => actualSizeCheck([imageBook([1])], new Map([["page-0", 101]])), e => e.key === "backupRestoreLimit",
    "a forged small page.size does not hide the actual Blob size");
  const ignored = loadBackup({ idb:mockIDB(new Map(), []), custom:{}, limitsIgnored:true, studyLimits:limits }).checkStudyLimits;
  assert.doesNotThrow(() => ignored([imageBook([1000, 1000, 1000, 1000]), { v:{ kind:"text", content:"long", pages:[] } }]));
});

test("restore checks the actual page Blob size instead of trusting book metadata", async () => {
  const restore = loadBackup({
    idb:mockIDB(new Map(), []), custom:{}, limitsIgnored:false,
    studyLimits:{ shelf:500, pages:3000, imageBytes:600 * 1048576, imageFileBytes:100, textBytes:12 * 1048576 },
  });
  await assert.rejects(restore.restoreBackup(await studyBackup({ pageBytes:101, declaredPageSize:1 })),
    e => e.key === "backupRestoreLimit");
});

test("the completion details report counts, failed-version protection and skipped pruning", () => {
  const tr = (key, vars = {}) => key === "backupRestorePackCounts"
    ? `counts:${vars.ok}/${vars.failed}/${vars.removed}` : key;
  const restore = loadBackup({ idb:mockIDB(new Map(), []), custom:{}, tr });
  assert.equal(restore.formatRestoreDetails({ meta:{ areas:{ packs:true } }, packsOk:2, packsFailed:1, packsRemoved:3, packCleanupSkipped:true }),
    "counts:2/1/3\nbackupRestorePackFailedKept\nbackupRestorePackCleanupSkipped");
  assert.equal(restore.formatRestoreDetails({ meta:{ areas:{ packs:false } }, packsOk:0, packsFailed:0, packsRemoved:0 }),
    "backupRestorePacksNotIncluded");
});

test("the restore completion report is acknowledged before the page reloads", async () => {
  const element = () => ({ checked:false, disabled:false, files:[], value:"", handlers:{},
    addEventListener(type, handler) { this.handlers[type] = handler; } });
  const input = element(), events = [];
  input.files = [await backupFile([], { packs:false })];
  const restore = loadBackup({
    idb:mockIDB(new Map(), []), custom:{},
    elements:{ backupMakeBtn:element(), backupRestoreFile:input, ignoreLimitsChk:element() },
    tr:(key, vars = {}) => key === "backupRestoreDone" ? `done:${vars.details}` : key,
    alertFn:text => events.push(["alert", text]),
    reloadFn:() => events.push(["reload"]),
  });
  assert.equal(typeof restore.restoreBackup, "function");
  await input.handlers.change();
  assert.deepEqual(events, [
    ["alert", "done:backupRestorePacksNotIncluded"],
    ["reload"],
  ]);
});
