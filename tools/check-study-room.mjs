#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * 📚 書斎（Study reader）の依存なし静的検査。
 *
 * ・js/study-room-utils.js は Node 上で実際に走らせて、文字コード・並べ替え・検索・しおりの純関数を確かめます。
 * ・js/study-room.js / index.html / css は、UIのID・4言語の網羅・保存の約束・安全側の作りを静的に確かめます。
 * これは実ブラウザ・実機の代わりではありません（フォルダ取り込み・IndexedDB・タッチ操作は実機で確認してください）。
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const read = rel => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const utilitySource = read("js/study-room-utils.js");
const windowStub = {};
vm.runInNewContext(utilitySource, { window:windowStub, TextDecoder, Uint8Array, Intl, Math, Set, Map, String, Number, Object, Array, RegExp });
const U = windowStub.TrkStudyUtils;
assert.ok(U, "Study utility module exports its public API");

/* ---------- 取り込むファイルの分類 ---------- */
assert.equal(U.extension("folder/Novel.MD"), "md");
assert.equal(U.baseName("folder/Novel.MD"), "Novel");
assert.equal(U.isImageFile({ name:"page.webp", type:"image/webp" }), true);
assert.equal(U.isImageFile({ name:"script.svg", type:"image/svg+xml" }), false, "SVG stays outside the image allowlist");
assert.equal(U.isTextFile({ name:"book.json" }), true);
assert.equal(U.isTextFile({ name:"photo.png" }), false);

const imageFile = (name, rel, size = 10) => {
  const file = { name, type:"image/png", size, webkitRelativePath:rel };
  return file;
};
/* サブフォルダは別の本（split）／まとめて1冊（flat） */
const nested = [imageFile("1.png", "Manga/vol1/1.png"), imageFile("2.png", "Manga/vol1/2.png"), imageFile("1.png", "Manga/vol2/1.png"), imageFile("cover.png", "Manga/cover.png")];
const split = U.groupImageFiles(nested, "split");
assert.deepEqual(Array.from(split, group => group.sourcePath), ["Manga", "Manga/vol1", "Manga/vol2"]);
assert.deepEqual(Array.from(split.find(group => group.sourcePath === "Manga/vol1").files, entry => entry.path), ["1.png", "2.png"]);
assert.equal(split.find(group => group.sourcePath === "Manga/vol2").title, "vol2");
const flat = U.groupImageFiles(nested, "flat");
assert.deepEqual(Array.from(flat, group => group.sourcePath), ["Manga"]);
assert.equal(flat[0].files.length, 4);
const plain = U.groupImageFiles([imageFile("10.png", "Album/10.png"), imageFile("2.png", "Album/2.png"), imageFile("1.png", "Album/1.png")]);
assert.deepEqual(Array.from(plain[0].files, entry => entry.path), ["1.png", "2.png", "10.png"], "numeric order");
assert.equal(U.groupImageFiles([imageFile("loose.png", "loose.png")])[0].title, U.ROOT_ALBUM);
const texts = U.listTextFiles([
  { name:"b.md", webkitRelativePath:"Books/b.md" },
  { name:"a.txt", webkitRelativePath:"Books/a.txt" },
  { name:"skip.exe", webkitRelativePath:"Books/skip.exe" }
]);
assert.deepEqual(Array.from(texts, entry => entry.path), ["Books/a.txt", "Books/b.md"]);

/* ---------- 文字コードと本文の組み立て ---------- */
assert.equal(U.decodeTextBuffer(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41, 0x42])), "AB");
assert.equal(U.decodeTextBuffer(Uint8Array.from([0xff, 0xfe, 0x42, 0x30])), "あ", "UTF-16LE is decoded");
assert.equal(U.decodeTextBuffer(Uint8Array.from([0xfe, 0xff, 0x30, 0x42])), "あ", "UTF-16BE is decoded");
assert.equal(U.decodeTextBuffer(Uint8Array.from([0x82, 0xa0])), "あ", "Shift_JIS fallback is decoded");
assert.equal(U.normalizeText("a\r\nb\fc"), "a\nb\n\nc");
const ruby = U.aozoraSegments("｜漢字《かんじ》と山《やま》\n");
assert.deepEqual(Array.from(ruby, part => part.ruby ? [part.ruby, part.reading] : part.text), [["漢字", "かんじ"], "と", ["山", "やま"], "\n"]);
assert.equal(U.aozoraSegments("［＃改ページ］").map(part => part.text).join(""), "\n\n");

/* ---------- 検索・抜粋・文字数 ---------- */
assert.deepEqual(Array.from(U.findMatches("abcABCabc", "ABC")), [0, 3, 6], "case-insensitive matches keep their offsets");
assert.deepEqual(Array.from(U.findMatches("aaa", "aa")), [0], "matches do not overlap");
assert.equal(U.findMatches("abc", "").length, 0);
assert.ok(U.findMatches("x".repeat(5000), "x", 10).length === 10, "match list is capped");
assert.equal(U.textStats("a\nb\nc").lines, 3);
assert.equal(U.textStats("a\nb\nc").chars, 3);
assert.ok(U.snippetAt("0123456789".repeat(20), .5, 30).includes("…"));

/* ---------- 本棚の並べ替え・使用量・しおり ---------- */
const book = (id, title, kind, updatedAt, createdAt, pages, content) => ({ id, title, kind, updatedAt, createdAt, pages:pages || [], content:content || "" });
const shelf = [book("a", "Beta", "text", 300, 100, [], "x".repeat(50)), book("b", "Alpha", "image", 200, 400, [{ size:1024 }, { size:1024 }])];
assert.deepEqual(Array.from(U.sortBooks(shelf, "updated"), b => b.id), ["a", "b"]);
assert.deepEqual(Array.from(U.sortBooks(shelf, "added"), b => b.id), ["a", "b"]);
assert.deepEqual(Array.from(U.sortBooks(shelf, "title"), b => b.id), ["b", "a"]);
assert.deepEqual(Array.from(U.sortBooks(shelf, "type"), b => b.id), ["b", "a"]);
assert.deepEqual(Array.from(U.sortBooks(shelf, "size"), b => b.id), ["b", "a"]);
assert.equal(U.sortBooks(undefined, "updated").length, 0, "an empty shelf stays safe");
assert.equal(U.bookSize(shelf[1]), 2048);
assert.equal(U.formatBytes(0), "0 B");
assert.equal(U.formatBytes(2048), "2 KB");
assert.ok(/MB$/.test(U.formatBytes(3 * 1024 * 1024)));
const marked = { ...shelf[0], bookmark:{ index:3, top:0, left:0, ratio:.5, savedAt:5 } };
assert.deepEqual(Array.from(U.bookmarkedBooks([shelf[0], marked, shelf[1]]), b => b.id), ["a"]);
assert.deepEqual(Array.from(U.orderPages([1, 2, 3], "reverse")), [3, 2, 1]);
assert.deepEqual(Array.from(U.orderPages([1, 2, 3], "natural")), [1, 2, 3]);
assert.equal(U.stableId("text", "Books/a.txt"), U.stableId("text", "Books/a.txt"));
assert.notEqual(U.stableId("text", "Books/a.txt"), U.stableId("text", "Books/b.txt"));
assert.notEqual(U.stableId("text", "Books/a.txt"), U.stableId("image", "Books/a.txt"));

/* ---------- 本体（js/study-room.js） ---------- */
const reader = read("js/study-room.js");
const html = read("index.html");
assert.ok(html.includes("css/study-room.css") && html.includes("js/study-room-utils.js") && html.includes("js/study-room.js"));
assert.ok(html.indexOf("js/study-room-utils.js") < html.indexOf("js/study-room.js"), "utils load before the room");
assert.ok(reader.includes('const STUDY_DB_NAME = "trk_study_room_v1"'));
assert.ok(reader.includes("studyDBOpen") && reader.includes("studyGetSongCoverBlob"));
assert.ok(reader.includes("STUDY_IMAGE_MAX_COUNT = 3000") && reader.includes("STUDY_IMAGE_MAX_BYTES = 600 * 1024 * 1024") &&
  reader.includes("STUDY_IMAGE_FILE_MAX = 100 * 1024 * 1024") && reader.includes("STUDY_TEXT_FILE_MAX = 12 * 1024 * 1024") &&
  reader.includes("STUDY_TEXT_BATCH_MAX = 200") && reader.includes("STUDY_SHELF_MAX = 500"), "documented limits stay in the code");
assert.ok(reader.includes("studySafeMode()") && reader.includes("window.TrkSafeMode"), "safe mode is respected");
assert.ok(reader.includes("studyCancelImport") && reader.includes("studyImportState.cancelled"), "imports can be cancelled");
assert.ok(reader.includes("studyImportAsk") && reader.includes("studyQuotaError"), "bulk replace + quota errors are handled");
assert.ok(reader.includes("studySweepOrphans") && reader.includes("studyDBDeleteMany"), "orphaned pages are swept");
assert.ok(reader.includes("studyGetSongCoverInfo") && reader.includes("studyClearSongCover"), "covers can be inspected and removed");
assert.ok(reader.includes("STUDY_ZOOM_STEPS") && reader.includes("studyApplyZoomValue") && reader.includes("studyPinchStart"), "image zoom (buttons / wheel / pinch) exists");
assert.ok(reader.includes("studyRunSearch") && reader.includes("studyHighlightMatchesInNode") && reader.includes("STUDY_SEARCH_MARK_MAX"), "in-book search exists and is capped");
assert.ok(reader.includes("STUDY_UTIL.bookmarkedBooks") && reader.includes("studyBookmarkOpenAt") && reader.includes("studyToggleBookmarkPanel"), "the bookmark list exists");
assert.ok(reader.includes("STUDY_TV_LOOKS") && reader.includes("STUDY_TV_RATIO") && reader.includes("studyCycleTV"), "TV looks / aspect / cycling exist");
assert.ok(reader.includes("studyIsBlob(") && reader.includes('typeof URL.createObjectURL !== "function"'), "stored blobs and object URLs are handled defensively");
assert.ok(reader.includes("studyTypingTarget") && reader.includes("studyActivateTarget"), "typing vs. activation targets are separated");
assert.ok(reader.includes("studySyncWelcome") && reader.includes("STUDY_SHELF_PAGE = 60"), "the shelf hides the welcome panel when it has books and pages the list");
assert.ok(reader.includes('typeof node.scrollBy === "function"') && reader.includes('typeof node.scrollTo === "function"'), "scrollBy/scrollTo have fallbacks for older webviews");
assert.ok(reader.includes("sweepOrphans:studySweepOrphans") && reader.includes("toggle:() =>"), "the public API exposes sweepOrphans/toggle for hosts and tests");
assert.ok(reader.includes("function studyHelpOpen") && reader.includes("studyHelpTitle"), "the shortcut help overlay exists");
assert.ok(reader.includes("document.body") && reader.includes("isConnected"), "the live <video> is restored even if its old parent was replaced");

/* 4言語の網羅 */
const localizedKeys = {};
for (const lang of ["ja", "en", "zh", "ko"]) {
  const match = reader.match(new RegExp(`Object\\.assign\\(TEXT\\.${lang}, \\{([\\s\\S]*?)\\n\\}\\);`));
  assert.ok(match, `the ${lang} Study translation block exists`);
  localizedKeys[lang] = new Set([...match[1].matchAll(/\b(study[A-Za-z0-9]+)\s*:/g)].map(item => item[1]));
}
assert.ok(localizedKeys.ja.size >= 150, `the Study feature documents its own strings (found ${localizedKeys.ja.size})`);
for (const lang of ["en", "zh", "ko"]) {
  const missing = [...localizedKeys.ja].filter(key => !localizedKeys[lang].has(key));
  const extra = [...localizedKeys[lang]].filter(key => !localizedKeys.ja.has(key));
  assert.deepEqual(missing, [], `${lang} has every Japanese Study string`);
  assert.deepEqual(extra, [], `${lang} has no Study string missing from Japanese`);
}

/* index.html のIDと data-i18n */
const staticIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
const missingIds = [...reader.matchAll(/\$\(["']([^"']+)["']\)/g)].map(match => match[1]).filter(id => !staticIds.has(id));
assert.deepEqual([...new Set(missingIds)], [], "Study static element references exist in index.html");
const section = html.slice(html.indexOf('<section id="studyRoom"'), html.indexOf('<button id="floatingSafeBtn"'));
assert.ok(section.includes('id="studyRoom"') && section.includes('id="studyBookmarkPanel"') && section.includes('id="studyImportWrap"'));
assert.ok(section.includes('id="studyShelfSort"') && section.includes('id="studyFindRow"') && section.includes('id="studyHelp"') && section.includes('id="studyZoomIn"'));
const htmlKeys = new Set([...section.matchAll(/data-i18n=["']([^"']+)["']/g)].map(match => match[1]));
const missingHtmlKeys = [...htmlKeys].filter(key => !localizedKeys.ja.has(key));
assert.deepEqual(missingHtmlKeys, [], "every data-i18n key in the Study markup has a Japanese string");
assert.ok(section.includes('id="studyRoom"') && /role="dialog"/.test(section) && /aria-modal="true"/.test(section), "the room is an accessible dialog");

/* 安全側の作り（外部送信なし・HTML解釈なし） */
assert.ok(!/\bfetch\s*\(/.test(reader) && !/\bXMLHttpRequest\b/.test(reader), "Study never uploads/requests imported files");
assert.ok(!reader.includes(".innerHTML") && !reader.includes("insertAdjacentHTML"), "imported text is never parsed as HTML");
assert.ok(reader.includes('document.addEventListener("keydown", studyKeyDown, true)'));
assert.ok(reader.includes("studyTypingTarget"), "typing in inputs keeps its own keys");
assert.ok(!/createMediaElementSource/.test(reader), "Study never re-routes the audio graph");

/* 見た目（css） */
const css = read("css/study-room.css");
for (const selector of ['.study-tv-screen[data-look="crt"]', '.study-tv-screen[data-look="aquarium"]', "mark.study-search-hit",
  "--study-zoom", "--study-text-size", "--study-tv-ratio", ".study-bookmark-card", ".study-import-track", ".study-help-card"])
  assert.ok(css.includes(selector), `css is missing ${selector}`);
assert.ok(css.includes("prefers-reduced-motion"), "reduced motion is respected");

/* TVドック／選曲画面との連携（背景・ジャケット） */
const tv = read("js/tv-dock.js");
const library = read("js/library.js");
assert.ok(tv.includes('className = "tvCover"') && tv.includes('on("studyCoverChanged"'));
assert.ok(library.includes('on("studyCoverChanged"') && library.includes("getSongCoverBlob"));
assert.ok(library.includes("studySongArt"), "song selection prefers the Study cover");

/* 書斎を開いている間、ゲーム側のキーを止める */
for (const file of ["player.js", "main.js", "media-player-mode.js", "catch.js", "modes.js", "stage.js", "truck.js", "speed.js", "extras.js", "video-max.js", "synth-mode.js", "fx.js"])
  assert.ok(read(`js/${file}`).includes("_trkStudyRoomOpen"), `${file} yields global keys to Study`);

console.log(`OK    Study reader: ${localizedKeys.ja.size} strings × 4 languages, data safety, zoom/search/bookmarks/TV wiring`);
