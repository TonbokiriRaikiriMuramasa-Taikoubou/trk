// SPDX-License-Identifier: GPL-3.0-or-later
/* 曲名の照合（js/title-match.js）を node --test で検査する（依存パッケージ不要）。
 *
 *   node --test tests/        または   npm test
 *
 * 入出力で確かめる：ファイル名（08_sometimes.fla・SEARCH LIGHT.ogg など）と、カタログの見出し（08 sometimes・SEARCH RIGHT）が
 * 同じ曲として当たること、別の曲や同名の別アルバムを取り違えないこと。 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const titleMatchSrc = fs.readFileSync(path.join(ROOT, "js/title-match.js"), "utf8");
const libSrc = fs.readFileSync(path.join(ROOT, "js/library.js"), "utf8");
/* plWishMatch は library.js に残っている（metaOf を使う）。その定義だけを切り出して同じ文脈で動かす */
const wishMatchSrc = (libSrc.match(/function plWishMatch[\s\S]*?(?=\nfunction plSyncWishes)/) || [""])[0];
if (!wishMatchSrc) throw new Error("plWishMatch が library.js から見つからない");

/* 各テストで作り直す文脈。metaOf は曲ごとのアルバム・アーティストを返す（無ければ null） */
function context(meta = {}) {
  const ctx = { metaOf: key => meta[key] || null };
  vm.createContext(ctx);
  vm.runInContext(`${titleMatchSrc}\n${wishMatchSrc}\n` +
    "globalThis.__keys = plTitleKeys; globalThis.__song = plSongMatchKeys; globalThis.__wish = plWishTitleKeys; globalThis.__match = plWishMatch;", ctx);
  return ctx;
}
/* media 曲のファイル名（＋任意のメモ）から、照合用の byTitle を作る（library.js の byTitleAdd と同じ形） */
function library(ctx, items) {
  const byTitle = new Map();
  for (const it of items) {
    for (const key of ctx.__song(it.title, it.hint || "")) {
      const hits = byTitle.get(key) || [];
      if (!hits.includes(it)) hits.push(it);
      byTitle.set(key, hits);
    }
  }
  return byTitle;
}

describe("曲名の照合キー（plTitleKeys）", () => {
  const ctx = context();
  test("ファイル名の番号・拡張子を外した別表記が候補に入る（08_sometimes.fla ↔ 08 sometimes）", () => {
    const keys = [...ctx.__keys("08_sometimes.fla")];
    assert.equal(keys[0], "08_sometimes.fla", "先頭はそのままの小文字");
    assert.ok(keys.includes("08 sometimes"), "区切りを空白にした形");
    assert.ok(keys.includes("sometimes"), "番号を外した形");
  });
  test("カタログ側の見出し（08 sometimes）は番号を外した形を含む", () => {
    assert.deepEqual([...ctx.__keys("08 sometimes")], ["08 sometimes", "sometimes"]);
  });
  test("大文字小文字と空白の差は同じキーになる", () => {
    assert.ok(ctx.__keys("  Up_to   YOU ").includes("up to you"));
    assert.equal(ctx.__keys("").length, 0, "空の名前は候補なし");
  });
  test("区切りの違い（ _ ・ - ・ / ）は空白に揃う", () => {
    assert.ok(ctx.__keys("Comet-Hime").includes("comet hime"));
    assert.ok(ctx.__keys("Sora／Up_to_you.ogg").includes("sora up to you"));
  });
});

describe("カタログの別表記（matchAliases）", () => {
  const ctx = context();
  test("SEARCH RIGHT（公式表記）は SEARCH LIGHT（配布ファイル名）の別表記として照合できる", () => {
    const wish = { t: "SEARCH RIGHT", al: "", ar: "初星学園", matchAliases: ["SEARCH LIGHT"] };
    const file = { key: "local-search-light", title: "SEARCH LIGHT.ogg", artist: "not 初星学園" };
    assert.equal(ctx.__match(wish, library(ctx, [file])), file);
  });
  test("TouhouThemeDBの曲IDでローカルMIDIを対応づける（th06_05.mid → おてんば恋娘）", () => {
    const wish = { t:"おてんば恋娘", al:"東方紅魔郷", ar:"ZUN", matchAliases:["th06_05"] };
    const file = { key:"local-th06-05", title:"th06_05.mid" };
    assert.equal(ctx.__match(wish, library(ctx, [file])), file);
  });
  test("th06_15.midもU.N.オーエンは彼女なのか？のカタログIDで照合する", () => {
    const wish = { t:"U.N.オーエンは彼女なのか？", al:"東方紅魔郷", ar:"ZUN", matchAliases:["th06_15"] };
    const file = { key:"local-th06-15", title:"th06_15.mid" };
    assert.equal(ctx.__match(wish, library(ctx, [file])), file);
  });
  test("別表記が無ければ SEARCH LIGHT は当たらない（別名を勝手に作らない）", () => {
    const wish = { t: "SEARCH RIGHT", al: "", ar: "" };
    const file = { key: "x", title: "SEARCH LIGHT.ogg", artist: "" };
    assert.equal(ctx.__match(wish, library(ctx, [file])), null);
  });
  test("別表記は8件まで（それ以上は読まない）", () => {
    const aliases = Array.from({ length: 9 }, (_, i) => `alias ${i}`);
    const keys = [...ctx.__wish({ t: "Main", matchAliases: aliases })];
    assert.ok(keys.includes("alias 7"));
    assert.ok(!keys.includes("alias 8"));
  });
});

describe("メモ（matchHint）と「キャラ名 - 曲名」の見出し", () => {
  const ctx = context();
  test("タイトルだけで BELIEVE.ogg が「Suguri - BELIEVE」に当たる", () => {
    const it = { key: "BELIEVE.ogg", title: "BELIEVE.ogg" };
    assert.equal(ctx.__match({ t: "Suguri - BELIEVE", al: "", ar: "" }, library(ctx, [it])), it);
  });
  test("メモ単独（Suguri）でも、タイトルが別でも当たる", () => {
    const it = { key: "unrelated.ogg", title: "unrelated.ogg", hint: "Suguri" };
    assert.equal(ctx.__match({ t: "Suguri - BELIEVE", al: "", ar: "" }, library(ctx, [it])), it);
  });
  test("メモ＋タイトルの組み合わせ（Hime - Comet）", () => {
    const it = { key: "Comet.ogg", title: "Comet.ogg", hint: "Hime" };
    assert.equal(ctx.__match({ t: "Hime - Comet", al: "", ar: "" }, library(ctx, [it])), it);
  });
  test("無関係なメモ・タイトルは当たらない", () => {
    const it = { key: "unrelated.ogg", title: "unrelated.ogg", hint: "other hint" };
    assert.equal(ctx.__match({ t: "Suguri - BELIEVE", al: "", ar: "" }, library(ctx, [it])), null);
  });
});

describe("同名の曲が複数あるとき（plWishMatch）", () => {
  test("候補が1つならそれを返す", () => {
    const ctx = context();
    const it = { key: "a", title: "Comet.ogg" };
    assert.equal(ctx.__match({ t: "Comet", al: "", ar: "" }, library(ctx, [it])), it);
  });
  test("候補が複数ならアルバム名で当たりを付ける", () => {
    const ctx = context({ a: { album: "Live" }, b: { album: "Studio" } });
    const live = { key: "a", title: "Song.ogg" }, studio = { key: "b", title: "Song.ogg" };
    assert.equal(ctx.__match({ t: "Song", al: "Studio", ar: "" }, library(ctx, [live, studio])), studio);
  });
  test("アルバムが合わなければアーティストで当たりを付ける", () => {
    const ctx = context({ a: { artist: "X" }, b: { artist: "Y" } });
    const x = { key: "a", title: "Song.ogg" }, y = { key: "b", title: "Song.ogg" };
    assert.equal(ctx.__match({ t: "Song", al: "", ar: "Y" }, library(ctx, [x, y])), y);
  });
});
