// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk137: js/zip-io.js（バックアップ用の ZIP 入出力）。
   ・書いたものを読み戻せる（store と deflate、空の中身、UTF-8 の名前）
   ・ZIP64 の構造（強制・65535件超）も読み戻せる
   ・改ざん（CRC・大きさ）は検出し、暗号化・パス逃れ・不正な署名は拒否する */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

function loadZipIO() {
  const sandbox = {
    window: {}, console, TextEncoder, TextDecoder, Blob, File, Response, Uint8Array, DataView, ArrayBuffer, BigInt,
    CompressionStream, DecompressionStream, Map, Math, Number, String, Array, Error, Promise, Uint32Array,
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(`${ROOT}/js/zip-io.js`, "utf8"), sandbox);
  return sandbox.window.Trk.zipIO;
}
const Z = loadZipIO();
const text = async (b) => new TextDecoder().decode(new Uint8Array(await b.arrayBuffer()));
async function roundTrip(entries, opts) {
  const blob = await Z.zipWrite(entries, opts);
  return { blob, zip: await Z.zipOpen(blob) };
}

test("store and deflate entries read back byte for byte", async () => {
  const entries = [
    { name: "backup.json", blob: new Blob(['{"a":1}']) },
    { name: "local.json", blob: new Blob(["x".repeat(5000)]), deflate: true },
    { name: "blobs/000001", blob: new Blob([new Uint8Array([0, 1, 2, 255])]) },
    { name: "日本語/ファイル.txt", blob: new Blob(["漫画の本文"]), deflate: true },
    { name: "empty.txt", blob: new Blob([]), deflate: true },
  ];
  const { zip } = await roundTrip(entries);
  assert.deepEqual([...zip.entries.map(e => e.name)], entries.map(e => e.name));   /* vm の別realm の配列を正規化 */
  for (const e of entries) {
    const got = zip.byName.get(e.name);
    const blob = await Z.zipEntryBlob(zip, got, 1e9);
    assert.equal(await text(blob), await text(e.blob), e.name);
    await Z.zipVerifyEntry(zip, got, 1e9);
  }
  assert.equal(zip.byName.get("local.json").method, 8, "text is deflated");
  assert.equal(zip.byName.get("blobs/000001").method, 0, "binary is stored");
});

test("ZIP64 structures (forced) read back", async () => {
  const { zip } = await roundTrip([{ name: "a.bin", blob: new Blob(["hello"]) }, { name: "b.txt", blob: new Blob(["world"]), deflate: true }], { forceZip64: true });
  assert.equal(await text(await Z.zipEntryBlob(zip, zip.byName.get("a.bin"))), "hello");
  assert.equal(await text(await Z.zipEntryBlob(zip, zip.byName.get("b.txt"))), "world");
});

test("more than 65535 entries (ZIP64 end record) read back", async () => {
  const n = 65540;
  const entries = [];
  for (let i = 0; i < n; i++) entries.push({ name: `e/${i}`, blob: new Blob([String(i % 10)]) });
  const { zip } = await roundTrip(entries);
  assert.equal(zip.entries.length, n);
  assert.equal(await text(await Z.zipEntryBlob(zip, zip.byName.get(`e/${n - 1}`))), String((n - 1) % 10));
});

test("a changed byte in the data is detected by the CRC check", async () => {
  const { blob } = await roundTrip([{ name: "x.txt", blob: new Blob(["abcdef"]) }]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  bytes[30 + 5 + 2] ^= 0x20;   /* 本文（ローカルヘッダ30＋名前5の次）の中を1byteだけ変える。中央ディレクトリは触らない */
  const zip = await Z.zipOpen(new Blob([bytes]));
  await assert.rejects(Z.zipVerifyEntry(zip, zip.byName.get("x.txt")), e => e.key === "zipCorrupt");
});

test("encrypted entries, path escapes and garbage are refused", async () => {
  const { blob } = await roundTrip([{ name: "x.txt", blob: new Blob(["abc"]) }]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const find = (sig) => { for (let i = bytes.length - 4; i >= 0; i--) if (bytes[i] === sig[0] && bytes[i + 1] === sig[1] && bytes[i + 2] === sig[2] && bytes[i + 3] === sig[3]) return i; return -1; };
  const cd = find([0x50, 0x4b, 0x01, 0x02]);
  const enc = bytes.slice(); enc[cd + 8] |= 1;
  await assert.rejects(Z.zipOpen(new Blob([enc])), e => e.key === "zipEncrypted");
  const esc = new TextEncoder().encode("../x.txt");
  const pathBytes = bytes.slice(); const nameAt = cd + 46;
  pathBytes.set(esc.subarray(0, 3), nameAt);
  await assert.rejects(Z.zipOpen(new Blob([pathBytes])), e => e.key === "zipBad");
  await assert.rejects(Z.zipOpen(new Blob([new Uint8Array(10)])), e => e.key === "zipBad");
  await assert.rejects(Z.zipOpen(new Blob([])), e => e.key === "zipBad");
});

test("a declared size over the limit stops reading", async () => {
  const { zip } = await roundTrip([{ name: "big.txt", blob: new Blob(["y".repeat(100)]), deflate: true }]);
  await assert.rejects(Z.zipEntryBlob(zip, zip.byName.get("big.txt"), 10), e => e.key === "zipTooBig");
});
