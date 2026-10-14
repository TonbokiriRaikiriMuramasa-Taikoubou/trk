// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 CBZ／ZIP の取り込み（trk138）の純粋な部分：どの項目をページにするか、並び順、MIME。
   js/study-room-utils.js を vm で読み、study-room.js の配線は npm run check の静的検査で見る。 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const window = {};
vm.runInNewContext(fs.readFileSync(`${ROOT}/js/study-room-utils.js`, "utf8"), { window, Intl, String, Array, Map, Set, Math, Number });
const U = window.TrkStudyUtils;
const names = list => U.archivePages(list.map(name => ({ name }))).map(entry => entry.name);

test("only image entries become pages, in natural order", () => {
  assert.deepEqual(names(["10.jpg", "2.jpg", "1.PNG", "notes.txt", "a/3.webp", "a/10.webp"]),
    ["1.PNG", "2.jpg", "10.jpg", "a/3.webp", "a/10.webp"]);
});

test("Mac metadata and dot files are skipped", () => {
  assert.deepEqual(names(["__MACOSX/vol/._1.jpg", "vol/.DS_Store", "vol/.hidden.jpg", "vol/1.jpg", "__MACOSX.jpg"]),
    ["__MACOSX.jpg", "vol/1.jpg"]);
});

test("unsupported image types are not pages", () => {
  assert.deepEqual(names(["1.svg", "2.tiff", "3.heic", "4.jpeg"]), ["4.jpeg"]);
});

test("MIME follows the extension and falls back to octet-stream", () => {
  assert.equal(U.mimeOf("x/A.JPG"), "image/jpeg");
  assert.equal(U.mimeOf("p.png"), "image/png");
  assert.equal(U.mimeOf("p.bin"), "application/octet-stream");
});
