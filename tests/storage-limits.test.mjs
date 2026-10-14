// SPDX-License-Identifier: GPL-3.0-or-later
/* 📦 trk137: 「容量の上限を無視する」（既定オフ）。
   外すのはアプリが決めた上限だけ。書斎の読み込み（studyBookClean）と、パックの上限（packCap）を、オン／オフで確かめる。
   ・オフ：従来どおり（1冊3000ページで切る・テキストは12MBで切る）
   ・オン：切らない */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const study = fs.readFileSync(`${ROOT}/js/study-room.js`, "utf8");
const custom = fs.readFileSync(`${ROOT}/js/custom.js`, "utf8");
function between(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a + 1);
  assert.ok(a >= 0 && b > a, `isolate ${startMarker.slice(0, 40)}`);
  return src.slice(a, b);
}
const capLine = study.match(/^function studyCap\(max\) \{.*\}$/m);
assert.ok(capLine, "studyCap is defined");
const cap = capLine[0];
const clean = between(study, "function studyBookClean(raw) {", "\n/* ページの並び順");
const packLine = custom.match(/^const packCap = .*$/m);
assert.ok(packLine, "the pack cap helper exists");

function studyContext(ignored) {
  const ctx = vm.createContext({ Date, Number, String, Math, Array, Object, JSON, console,
    core: { storageLimitsIgnored: () => ignored },
    STUDY_IMAGE_MAX_COUNT: 3000, STUDY_TEXT_FILE_MAX: 12 * 1024 * 1024 });
  vm.runInContext(`${cap}\n${clean}\nglobalThis.studyBookClean = studyBookClean;`, ctx);
  return ctx;
}
const book = (pages, content = "") => ({ id: "b", kind: "image", title: "T", pages: Array.from({ length: pages }, (_, i) => ({ key: "k" + i, name: "p" + i, path: "p" + i, size: 1, type: "image/png" })), content, bookmark: { index: 2999 + 5, top: 0, left: 0, ratio: 0, savedAt: 1 } });

test("off: a book is cut at 3000 pages (the old behaviour is unchanged)", () => {
  const c = studyContext(false);
  const out = c.studyBookClean(book(3001));
  assert.equal(out.pages.length, 3000);
  assert.ok(out.bookmark.index <= 2999, "a bookmark past the cut is clamped");
});

test("on: a book keeps every page and the bookmark is not clamped", () => {
  const c = studyContext(true);
  const out = c.studyBookClean(book(3001));
  assert.equal(out.pages.length, 3001);
  assert.equal(out.bookmark.index, 3004);
});

test("off: text is cut at 12 MB; on: it is kept", () => {
  const big = "a".repeat(12 * 1024 * 1024 + 10);
  const off = studyContext(false).studyBookClean({ id: "t", kind: "text", title: "T", content: big });
  assert.equal(off.content.length, 12 * 1024 * 1024);
  const on = studyContext(true).studyBookClean({ id: "t", kind: "text", title: "T", content: big });
  assert.equal(on.content.length, big.length);
});

test("pack cap: off uses the app's limit; on removes it", () => {
  const make = (ignored) => {
    const ctx = vm.createContext({ core: { storageLimitsIgnored: () => ignored } });
    vm.runInContext(packLine[0] + "\nglobalThis.packCap = packCap;", ctx);
    return ctx.packCap;
  };
  assert.equal(make(false)(500 * 1048576), 500 * 1048576);
  assert.equal(make(true)(500 * 1048576), Infinity);
});
