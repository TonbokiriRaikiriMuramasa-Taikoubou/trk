// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk137: js/backup.js の値の変換（IndexedDB の値 ⇄ JSON。Blob は zip の中の名前で参照する）。
   ・Blob／File（名前・型・更新時刻）、Date、NaN・Infinity、配列の undefined を往復できる
   ・利用者のキーが「$」で始まっても、マーカー（$blob など）と混ざらない
   ・書き出せないもの（関数・FileSystemHandle）は、その行だけ飛ばす（SkipValue）
   ・キーは文字列と数値だけ */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

class FakeHandle { constructor() { this.kind = "file"; } }
function load() {
  const window = { Trk: { core: { storageLimitsIgnored: () => false, $: () => null, setStatus() {}, saveUserPrefs() {}, settings: {} }, zipIO: {} } };
  const sandbox = {
    window, document: { readyState: "complete", getElementById: () => null, addEventListener() {} },
    console, Blob, File, Date, Number, String, Array, Object, JSON, Math, Error, Promise, ArrayBuffer, Uint8Array, DataView,
    FileSystemHandle: FakeHandle, indexedDB: {}, localStorage: { getItem: () => null },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(`${ROOT}/js/backup.js`, "utf8"), sandbox);
  return window.Trk.backup;
}
const B = load();

function collector() {
  const blobs = new Map();
  const add = (blob) => { const name = `blobs/${String(blobs.size + 1).padStart(7, "0")}`; blobs.set(name, blob); return name; };
  return { add, blobs, resolve: (name) => { if (!blobs.has(name)) throw new Error("missing " + name); return blobs.get(name); } };
}
/* vm の別realm で作られた配列・オブジェクトを、比べられる形（この realm の値）に直す */
const plain = (v) => JSON.parse(JSON.stringify(v));
const roundTrip = (v) => { const c = collector(); const j = JSON.parse(JSON.stringify(B.encodeValue(v, c.add))); return { back: B.decodeValue(j, c.resolve), j, c }; };

test("Blob, File (name, type, mtime), Date and non-finite numbers come back", () => {
  const file = new File(["abc"], "page 01.png", { type:"image/png", lastModified:1700000000000 });
  const blob = new Blob(["xyz"], { type:"text/plain" });
  const { back, c } = roundTrip({ file, blob, when:new Date(1234567890000), nan:NaN, inf:-Infinity, n:3.5 });
  assert.ok(back.file instanceof File, "File stays a File");
  assert.equal(back.file.name, "page 01.png");
  assert.equal(back.file.type, "image/png");
  assert.equal(back.file.lastModified, 1700000000000);
  assert.ok(back.blob instanceof Blob && !(back.blob instanceof File));
  assert.equal(back.blob.type, "text/plain");
  assert.equal(back.when.getTime(), 1234567890000);
  assert.ok(Number.isNaN(back.nan));
  assert.equal(back.inf, -Infinity);
  assert.equal(back.n, 3.5);
  assert.equal(c.blobs.size, 2, "two blobs were referenced, not inlined");
});

test("user keys that start with $ do not collide with the markers", () => {
  const { back } = roundTrip({ "$blob":"not a blob", "$num":"text", "$$x":1, "$date":5, plain:{ "$blob":"nested" } });
  assert.deepEqual(plain(back), { "$blob":"not a blob", "$num":"text", "$$x":1, "$date":5, plain:{ "$blob":"nested" } });
});

test("undefined members are dropped; undefined array items become null", () => {
  const { back } = roundTrip({ a:undefined, b:[1, undefined, 2], c:{ d:undefined } });
  assert.deepEqual(plain(back), { b:[1, null, 2], c:{} });
  assert.equal("a" in back, false);
});

test("functions and FileSystemHandles are skipped (the row is dropped by the caller)", () => {
  const c = collector();
  assert.throws(() => B.encodeValue({ f() {} }, c.add), e => e.name === "SkipValue");
  assert.throws(() => B.encodeValue({ h:new FakeHandle() }, c.add), e => e.name === "SkipValue");
});

test("keys are strings or finite numbers only", () => {
  assert.deepEqual(plain(B.encKey("book-1")), { s:"book-1" });
  assert.deepEqual(plain(B.encKey(7)), { n:7 });
  assert.equal(B.decKey({ s:"x" }), "x");
  assert.equal(B.decKey({ n:7 }), 7);
  assert.throws(() => B.encKey(Symbol("k")), e => e.name === "SkipValue");
  assert.throws(() => B.decKey({ s:1 }), e => e.key === "backupCorrupt");
  assert.throws(() => B.decKey({ n:Infinity }), e => e.key === "backupCorrupt");
});

test("an array of many pages keeps the order and every Blob", () => {
  const pages = Array.from({ length:50 }, (_, i) => ({ key:`k${i}`, name:`p${i}.jpg`, file:new File([String(i)], `p${i}.jpg`) }));
  const { back } = roundTrip({ pages });
  assert.deepEqual(plain(back.pages.map(p => p.key)), pages.map(p => p.key));
  assert.equal(back.pages[49].file.name, "p49.jpg");
});
