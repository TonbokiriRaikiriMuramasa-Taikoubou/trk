#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/** Dependency-free unit and integration smoke checks for the Study reader. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const utilitySource = fs.readFileSync(new URL("../js/study-room-utils.js", import.meta.url), "utf8");
const windowStub = {};
vm.runInNewContext(utilitySource, { window:windowStub, TextDecoder, Uint8Array, Intl, Math, Set, Map, String, Number, Object, Array, RegExp });
const U = windowStub.TrkStudyUtils;
assert.ok(U, "Study utility module exports its public API");
assert.equal(U.extension("folder/Novel.MD"), "md");
assert.equal(U.baseName("folder/Novel.MD"), "Novel");
assert.equal(U.isImageFile({ name:"page.webp", type:"image/webp" }), true);
assert.equal(U.isImageFile({ name:"script.svg", type:"image/svg+xml" }), false, "SVG stays outside the image allowlist");
assert.equal(U.isTextFile({ name:"book.json" }), true);
assert.equal(U.isTextFile({ name:"photo.png" }), false);

const imageFiles = ["10.png", "2.png", "1.png"].map(name => ({
  name, type:"image/png", size:10, webkitRelativePath:`Album/${name}`
}));
const groups = U.groupImageFiles(imageFiles);
assert.equal(groups.length, 1);
assert.equal(groups[0].title, "Album");
assert.deepEqual(Array.from(groups[0].files, entry => entry.path), ["1.png", "2.png", "10.png"]);
const texts = U.listTextFiles([
  { name:"b.md", webkitRelativePath:"Books/b.md" },
  { name:"a.txt", webkitRelativePath:"Books/a.txt" },
  { name:"skip.exe", webkitRelativePath:"Books/skip.exe" }
]);
assert.deepEqual(Array.from(texts, entry => entry.path), ["Books/a.txt", "Books/b.md"]);

assert.equal(U.decodeTextBuffer(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41, 0x42])), "AB");
assert.equal(U.decodeTextBuffer(Uint8Array.from([0xff, 0xfe, 0x42, 0x30])), "あ", "UTF-16LE is decoded");
assert.equal(U.decodeTextBuffer(Uint8Array.from([0x82, 0xa0])), "あ", "Shift_JIS fallback is decoded");
const ruby = U.aozoraSegments("｜漢字《かんじ》と山《やま》\n");
assert.deepEqual(Array.from(ruby, part => part.ruby ? [part.ruby, part.reading] : part.text), [["漢字", "かんじ"], "と", ["山", "やま"], "\n"]);
assert.equal(U.stableId("text", "Books/a.txt"), U.stableId("text", "Books/a.txt"));
assert.notEqual(U.stableId("text", "Books/a.txt"), U.stableId("text", "Books/b.txt"));
assert.notEqual(U.stableId("text", "Books/a.txt"), U.stableId("image", "Books/a.txt"));

const reader = fs.readFileSync(new URL("../js/study-room.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const tv = fs.readFileSync(new URL("../js/tv-dock.js", import.meta.url), "utf8");
const library = fs.readFileSync(new URL("../js/library.js", import.meta.url), "utf8");
assert.ok(html.includes("css/study-room.css") && html.includes("js/study-room-utils.js") && html.includes("js/study-room.js"));
assert.ok(reader.includes('const STUDY_DB_NAME = "trk_study_room_v1"'));
assert.ok(reader.includes("studyDBOpen") && reader.includes("studyGetSongCoverBlob"));
const localizedKeys = {};
for (const lang of ["ja", "en", "zh", "ko"]) {
  const match = reader.match(new RegExp(`Object\\.assign\\(TEXT\\.${lang}, \\{([\\s\\S]*?)\\n\\}\\);`));
  assert.ok(match, `the ${lang} Study translation block exists`);
  localizedKeys[lang] = new Set([...match[1].matchAll(/\b(study[A-Za-z0-9]+)\s*:/g)].map(item => item[1]));
}
for (const lang of ["en", "zh", "ko"]) {
  const missing = [...localizedKeys.ja].filter(key => !localizedKeys[lang].has(key));
  assert.deepEqual(missing, [], `${lang} has every Japanese Study string`);
}
const staticIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
const missingIds = [...reader.matchAll(/\$\(["']([^"']+)["']\)/g)].map(match => match[1]).filter(id => !staticIds.has(id));
assert.deepEqual([...new Set(missingIds)], [], "Study static element references exist in index.html");
assert.ok(!/\bfetch\s*\(/.test(reader) && !/\bXMLHttpRequest\b/.test(reader), "Study never uploads/requests imported files");
assert.ok(!reader.includes(".innerHTML"), "Imported text is never parsed as HTML");
assert.ok(tv.includes('className = "tvCover"') && tv.includes('on("studyCoverChanged"'));
assert.ok(library.includes('on("studyCoverChanged"') && library.includes("getSongCoverBlob"));
assert.ok(reader.includes('document.addEventListener("keydown", studyKeyDown, true)'));
for (const file of ["player.js", "main.js", "media-player-mode.js", "catch.js", "modes.js", "stage.js", "truck.js", "speed.js", "extras.js", "video-max.js"])
  assert.ok(fs.readFileSync(new URL(`../js/${file}`, import.meta.url), "utf8").includes("_trkStudyRoomOpen"), `${file} yields global keys to Study`);
console.log("OK    Study reader utilities, local-data safety, and TV/song-cover integration");
