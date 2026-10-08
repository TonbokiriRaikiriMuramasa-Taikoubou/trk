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

// 名前空間 D：js/ の本文では領域の接頭辞 window.Trk.<領域>. を取り除いて照合する（window.Trk.overlay は残す）
const read = rel => {
  const text = fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
  return rel.startsWith("js/") ? text.replace(/window\.Trk\.(?!overlay\b)[A-Za-z]\w*\./g, "") : text;
};
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
assert.equal(U.isTextFile({ name:"notes.md" }), true);
assert.equal(U.isTextFile({ name:"snippet.js" }), true);
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
/* ルビの細かい約束（ルビにしないものを、そのまま文字として残す） */
const plainRuby = s => U.aozoraSegments(s).map(p => p.ruby ? `[${p.ruby}:${p.reading}]` : p.text).join("");
assert.equal(plainRuby("｜《》"), "｜《》", "an empty base/reading stays text");
assert.equal(plainRuby("漢《》"), "漢《》", "an empty reading stays text");
assert.equal(plainRuby("漢《かん"), "漢《かん", "an unclosed opening bracket stays text");
assert.equal(plainRuby("漢《かん》じ"), "[漢:かん]じ", "an implicit ruby still works");
assert.equal(plainRuby("｜あい《ai》"), "[あい:ai]", "the explicit form takes everything up to 《");
assert.equal(plainRuby("｜漢《かん》と山《やま》"), "[漢:かん]と[山:やま]", "two rubies in one line");
assert.equal(plainRuby("｜漢《かん\nじ》"), "｜漢《かん\nじ》", "ruby never crosses a line break");
assert.equal(plainRuby("漢《a》b《c》"), "[漢:a]b《c》", "a reading without a kanji run stays text");
/* 🛡 細工した本文で固まらない（以前は正規表現の後戻りで、1MBの漢字だけで数分かかっていた） */
const worst = [
  ["kanji only, no 《", "漢".repeat(300000)],
  ["many ｜ without 《", ("｜" + "あ".repeat(80)).repeat(2000)],
  ["many unclosed 《", "《".repeat(150000)],
  ["｜ then a long run then 《", "｜" + "あ".repeat(300000) + "《"]
];
for (const [name, text] of worst) {
  const started = Date.now();
  const parts = U.aozoraSegments(text);
  const ms = Date.now() - started;
  assert.ok(parts.length >= 1, `aozoraSegments survives ${name}`);
  assert.ok(ms < 1500, `aozoraSegments stays linear on ${name} (${ms}ms)`);
}

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
const shelfEntries = [
  { key:"book:a", itemType:"book", kind:"text", title:"Alpha", updatedAt:30, createdAt:10, size:40 },
  { key:"folder:x", itemType:"folder", kind:"folder", title:"Zeta", updatedAt:10, createdAt:5, size:0 },
  { key:"book:b", itemType:"book", kind:"image", title:"Beta", updatedAt:20, createdAt:20, size:200 }
];
assert.deepEqual(Array.from(U.sortShelfItems(shelfEntries, { mode:"title" }), item => item.key), ["book:a", "book:b", "folder:x"]);
assert.deepEqual(Array.from(U.sortShelfItems(shelfEntries, { manual:true, orderKeys:["book:b", "folder:x", "book:a"] }), item => item.key), ["book:b", "folder:x", "book:a"]);
assert.deepEqual(Array.from(U.sortShelfItems(shelfEntries, { manual:true, foldersFirst:true, orderKeys:["book:b", "folder:x", "book:a"] }), item => item.key), ["folder:x", "book:b", "book:a"]);
assert.deepEqual(Array.from(U.sortShelfItems(shelfEntries, { mode:"updated", foldersFirst:true }), item => item.key), ["folder:x", "book:a", "book:b"]);
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
assert.ok(reader.includes("studyNormalizeShelfMeta") && reader.includes('store.put(value, "shelf")'), "folder assignments and manual order persist separately without a DB version migration");
assert.ok(reader.includes("function studyCreateFolder") && reader.includes("studyShelfTitle.addEventListener(\"pointerdown\""), "the bookshelf title supports long-press folder creation");
assert.ok(reader.includes("studyShelfDragOver") && reader.includes("studyShelfMoveItem") && reader.includes("studyBindShelfDropTarget"), "shelf items can be dragged to folders and manually reordered");
assert.ok(reader.includes('handle.addEventListener("pointerdown"') && reader.includes("studyHighlightShelfTarget"), "shelf dragging also supports touch and pen pointers");
assert.ok(reader.includes("studyPrefs.manualShelfOrder") && reader.includes("studyPrefs.foldersFirst") && reader.includes("studyPrefs.skipDeleteConfirm"), "the three advanced shelf checkboxes are wired");
assert.ok(reader.includes("!studyPrefs.skipDeleteConfirm && !confirm"), "book deletion can skip confirmation only when explicitly enabled");
assert.ok(reader.includes('STUDY_DEFAULT_NEXT_KEY = "ArrowRight"') && reader.includes('STUDY_DEFAULT_PREVIOUS_KEY = "ArrowLeft"'),
  "Study's default keyboard navigation advances with right and goes back with left");
assert.ok(reader.includes("studyHandleKeyCapture") && reader.includes("studyPrefs.studyNextKey") && reader.includes("studyPrefs.studyPreviousKey") &&
  reader.includes("studyPrefs.verticalImageKeys"), "navigation keys can be assigned, with optional up/down image navigation");
assert.ok(reader.includes("studyApplyShelfVisibility") && reader.includes("studySetShelfVisible(true)"),
  "the shelf is visible by default and can be restored from the header after hiding");
assert.ok(reader.includes("studyEditorHandleTab") && reader.includes('event.code === "KeyS"') &&
  reader.includes("if (editor.value !== content)") && reader.includes("studyEditorUnsaved"),
  "the text editor supports indentation, immediate save, and visible auto-save state");
assert.ok(reader.includes("studyEditorSafety") && reader.includes("studySaveBook(book)") && reader.includes("studyExportText"),
  "text editing stays in the local Study copy and offers explicit copy export");
assert.ok(reader.includes("studyApplyEditedTextFolder") && reader.includes("studyPrefs.editedTextFolderId") &&
  reader.includes("studyTextFiledInFolder"), "edited text can be filed into a chosen bookshelf folder after saving");
const prefsWriter = reader.match(/function studySavePrefs\(\) \{[\s\S]*?\n\}/);
assert.ok(prefsWriter && prefsWriter[0].includes('store.put({ ...studyPrefs }, "ui")') && !prefsWriter[0].includes("studyExportDirectory"),
  "the selected device folder handle is transient and is not stored in Study preferences");
assert.ok(reader.includes("studyWriteExportCopy") && reader.includes('mode:"readwrite"') &&
  reader.includes('getFileHandle(filename, { create:true })') && reader.includes('writable.write(blob)') &&
  reader.includes('$("studyMemoExportBtn").hidden = isImage'),
  "text export is available while reading and writes a new copy to the user-selected destination");
assert.ok(reader.includes('$("studyMemoBtn").textContent = tr($("studyMemoEditor").hidden ? "studyMemoEdit" : "studyMemoDone")'),
  "the edit button keeps its localized label when the app language changes mid-edit");
assert.ok(!reader.includes("studyPrefs.memoEnabled") && !html.includes('id="studyMemoEnabled"'),
  "editing text books is immediately available rather than hidden behind an opt-in preference");
assert.ok(!/\beval\s*\(/.test(reader) && !/\bnew\s+Function\s*\(/.test(reader) && !reader.includes(".innerHTML"),
  "text and source-code books remain inert; the reader does not execute or parse their contents as markup");
const editorTabFn = reader.match(/function studyEditorHandleTab\(event\) \{[\s\S]*?\n\}/);
assert.ok(editorTabFn, "the editor indentation handler is defined");
const editorTestContext = vm.createContext({ Event: class { constructor(type, options) { this.type = type; Object.assign(this, options); } } });
vm.runInContext(`${editorTabFn[0]}\nglobalThis.handleTab = studyEditorHandleTab;`, editorTestContext);
function applyEditorTab(value, start, end, shiftKey = false) {
  const editor = {
    id:"studyMemoEditor", value, selectionStart:start, selectionEnd:end,
    setRangeText(replacement, from, to, mode) {
      this.value = this.value.slice(0, from) + replacement + this.value.slice(to);
      if (mode === "end") this.selectionStart = this.selectionEnd = from + replacement.length;
    },
    setSelectionRange(from, to) { this.selectionStart = from; this.selectionEnd = to; },
    dispatchEvent(event) { this.inputEvent = event.type; },
  };
  const event = { code:"Tab", target:editor, shiftKey, preventDefault(){ this.prevented = true; }, stopImmediatePropagation(){ this.stopped = true; } };
  editorTestContext.handleTab(event);
  return { editor, event };
}
let editorTabResult = applyEditorTab("ab", 1, 1);
assert.equal(editorTabResult.editor.value, "a\tb");
assert.equal(editorTabResult.editor.selectionStart, 2);
editorTabResult = applyEditorTab("one\ntwo\nthree", 1, 8);
assert.equal(editorTabResult.editor.value, "\tone\n\ttwo\nthree");
assert.deepEqual([editorTabResult.editor.selectionStart, editorTabResult.editor.selectionEnd], [2, 10]);
editorTabResult = applyEditorTab("\tone\n\ttwo\nthree", 2, 10, true);
assert.equal(editorTabResult.editor.value, "one\ntwo\nthree");
assert.deepEqual([editorTabResult.editor.selectionStart, editorTabResult.editor.selectionEnd], [1, 8]);
assert.ok(editorTabResult.event.prevented && editorTabResult.event.stopped && editorTabResult.editor.inputEvent === "input");
const exportWriterFn = reader.match(/async function studyWriteExportCopy\(directory, blob, title, extension\) \{[\s\S]*?^\}/m);
assert.ok(exportWriterFn, "the explicit export writer is defined separately from file import");
const exportWriterContext = vm.createContext({ crypto:{ randomUUID:() => "test-export-id" }, Date:{ now:() => 123456789 } });
vm.runInContext(`${exportWriterFn[0]}\nglobalThis.writeExportCopy = studyWriteExportCopy;`, exportWriterContext);
const existingExports = new Set(); let exportChecks = 0, exportedBlob = null, exportClosed = false;
const fakeExportDirectory = { getFileHandle:async (name, options) => {
  if (options && options.create) {
    assert.ok(!existingExports.has(name), "export never opens an existing file for writing"); existingExports.add(name);
    return { createWritable:async () => ({ write:async value => { exportedBlob = value; }, close:async () => { exportClosed = true; } }) };
  }
  exportChecks++;
  if (exportChecks <= 2) { existingExports.add(name); return {}; }
  const missing = new Error("not found"); missing.name = "NotFoundError"; throw missing;
} };
const testExportBlob = { text:"edited copy" };
const testExportName = await exportWriterContext.writeExportCopy(fakeExportDirectory, testExportBlob, "draft", "txt");
assert.match(testExportName, /draft - edited-.* \(3\)\.txt$/);
assert.equal(exportedBlob, testExportBlob); assert.equal(exportClosed, true);
const reservedKeys = reader.match(/const STUDY_RESERVED_KEYS = new Set\([\s\S]*?\);/);
const keyAllowed = reader.match(/function studyKeyCodeAllowed\(code\) \{[\s\S]*?\n\}/);
const keyLabel = reader.match(/function studyKeyCodeLabel\(code\) \{[\s\S]*?\n\}/);
assert.ok(reservedKeys && keyAllowed && keyLabel, "navigation key validation and labels are defined");
const keyTestContext = vm.createContext({});
vm.runInContext(`${reservedKeys[0]}\n${keyAllowed[0]}\n${keyLabel[0]}\nglobalThis.allowed = studyKeyCodeAllowed; globalThis.label = studyKeyCodeLabel;`, keyTestContext);
for (const code of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "Digit3", "Numpad4", "PageUp", "PageDown", "Home", "End"])
  assert.equal(keyTestContext.allowed(code), true, `${code} is a supported navigation key`);
for (const code of ["Escape", "Tab", "Space", "Enter", "KeyB", "KeyM", "KeyT", "KeyF", "Digit0", "Unknown"])
  assert.equal(keyTestContext.allowed(code), false, `${code} is reserved or unsupported`);
assert.equal(keyTestContext.label("ArrowRight"), "→");
assert.equal(keyTestContext.label("KeyA"), "A");
assert.equal(keyTestContext.label("Numpad4"), "Num 4");
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

/* 24種類の文字スキン（既存5種を含む）と4分類 */
const themeDeclaration = reader.match(/const STUDY_THEMES = \[([\s\S]*?)\];/);
assert.ok(themeDeclaration, "the supported Study theme IDs are declared");
const studyThemes = [...themeDeclaration[1].matchAll(/"([a-z]+)"/g)].map(match => match[1]);
assert.equal(studyThemes.length, 24, "Study keeps exactly 24 text themes");
assert.equal(new Set(studyThemes).size, 24, "Study theme IDs are unique");
const expectedThemes = ["plain", "paper", "warm", "lined", "genko", "sepia", "dark", "midnight", "terminal", "graphite", "blueprint", "contrast",
  "prompt", "neural", "latent", "matrix", "synth", "neon", "aurora", "sunset", "ocean", "mint", "dream", "prism"];
assert.deepEqual(studyThemes, expectedThemes, "the stable theme IDs and category order stay intentional");
assert.ok(reader.includes('if (node.tagName === "OPTGROUP") node.label = translated;'), "language changes update optgroup labels without replacing their options");
for (const key of ["studyThemeGroupWriter", "studyThemeGroupCode", "studyThemeGroupAi", "studyThemeGroupFree"])
  for (const lang of ["ja", "en", "zh", "ko"]) assert.ok(localizedKeys[lang].has(key), `${lang} includes ${key}`);

/* index.html のIDと data-i18n */
const staticIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]));
const missingIds = [...reader.matchAll(/\$\(["']([^"']+)["']\)/g)].map(match => match[1]).filter(id => !staticIds.has(id));
assert.deepEqual([...new Set(missingIds)], [], "Study static element references exist in index.html");
const section = html.slice(html.indexOf('<section id="studyRoom"'), html.indexOf('<button id="floatingSafeBtn"'));
const themeSelectMarkup = section.match(/<select id="studyTheme">([\s\S]*?)<\/select>/)?.[1];
assert.ok(themeSelectMarkup, "the Study text-theme selector exists");
const themeGroups = [...themeSelectMarkup.matchAll(/<optgroup\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/optgroup>/g)];
assert.equal(themeGroups.length, 4, "text themes have four localized optgroups");
assert.deepEqual(themeGroups.map(group => group[1]), ["studyThemeGroupWriter", "studyThemeGroupCode", "studyThemeGroupAi", "studyThemeGroupFree"]);
const groupedThemes = themeGroups.map(group => [...group[2].matchAll(/<option\b[^>]*value="([^"]+)"/g)].map(match => match[1]));
assert.deepEqual(groupedThemes.map(group => group.length), [6, 6, 5, 7], "writer/code/AI/freeform groups have the planned counts");
assert.deepEqual(groupedThemes.flat(), studyThemes, "HTML options match the supported theme list and order");
assert.ok(section.includes('id="studyRoom"') && section.includes('id="studyBookmarkPanel"') && section.includes('id="studyImportWrap"'));
assert.ok(section.includes('id="studyShelfSort"') && section.includes('id="studyFindRow"') && section.includes('id="studyHelp"') && section.includes('id="studyZoomIn"'));
assert.ok(section.includes('id="studyShelfCreateFolder"') && section.includes('id="studyManualShelfOrder"') &&
  section.includes('id="studyFoldersFirst"') && section.includes('id="studySkipDeleteConfirm"') && section.includes('id="studyShelfDragHelp"'),
  "the bookshelf folder and advanced preference controls exist in the room markup");
assert.ok(section.includes('id="studyShelfVisible"') && section.includes('id="studyShowShelfBtn"') &&
  section.includes('id="studyNextKeyBtn"') && section.includes('id="studyPreviousKeyBtn"') && section.includes('id="studyVerticalImageKeys"'),
  "the shelf visibility and configurable navigation controls exist in the room markup");
assert.ok(section.includes('id="studyEditorNotice"') && section.includes('id="studyEditorLabel"') &&
  section.includes('id="studyEditorSafetyText"') && section.includes('id="studyEditorSaveStatus"') &&
  section.includes('aria-labelledby="studyEditorLabel"') && section.includes('aria-describedby="studyEditorSafetyText"') &&
  section.includes('maxlength="12582912"'),
  "the inert local-copy editor includes a safety notice, save state, and accessible label");
assert.ok(section.includes('id="studyEditedTextFolder"') && section.includes('aria-labelledby="studyEditedTextFolderLabel"') &&
  section.includes('aria-describedby="studyEditedTextFolderHint"') && section.includes('id="studyEditedTextFolderHint"') &&
  section.includes('id="studyChooseExportFolderBtn"') && section.includes('aria-describedby="studyExportFolderHint"') &&
  section.includes('id="studyExportFolderHint"') && section.includes('id="studyClearExportFolderBtn"') &&
  section.includes('id="studyExportFolderName"'),
  "advanced options can organize edited books and select a device export folder");
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
assert.ok(css.includes("background-color:var(--study-theme-page)") && css.includes("color:var(--study-theme-ink)") &&
  css.includes("font-family:var(--study-theme-font)"), "reader colors, backgrounds, and fonts use the active theme");
assert.ok(css.includes("background-color:var(--study-theme-editor)") && css.includes("color:var(--study-theme-editor-ink)") &&
  css.includes("font-family:var(--study-theme-editor-font)") && css.includes("font-size:calc(15px * var(--study-text-size))"),
  "the editing textarea also uses the active theme palette, font, and text sizing");
assert.ok(css.includes("--study-theme-editor:#fcfaf4"), "the standard theme also styles the editor like the reading page");
assert.ok(css.includes(".study-text-stage[data-theme=\"genko\"] .study-memo-editor{writing-mode:vertical-rl;text-orientation:mixed;direction:ltr}"),
  "manuscript-paper writing remains vertical in the editor");
for (const theme of studyThemes.filter(id => id !== "plain")) {
  const themeRules = [...css.matchAll(new RegExp(`\\.study-text-stage\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`, "g"))]
    .map(match => match[1]).join("\\n");
  assert.ok(themeRules.includes("--study-theme-stage:") && themeRules.includes("--study-theme-page:") &&
    themeRules.includes("--study-theme-editor:") && themeRules.includes("--study-theme-ink:") && themeRules.includes("--study-theme-editor-ink:"),
    `${theme} defines coordinated reader and editor colors/backgrounds`);
}
assert.ok(css.includes("AI／プロンプト作業をイメージした装飾テーマ（AI処理・通信機能はありません）"), "AI-themed skins are presentation only");
for (const selector of ['.study-tv-screen[data-look="crt"]', '.study-tv-screen[data-look="aquarium"]', "mark.study-search-hit",
  "--study-zoom", "--study-text-size", "--study-tv-ratio", ".study-bookmark-card", ".study-import-track", ".study-help-card",
  ".study-folder-card", ".study-drop-target", ".study-shelf-title", ".study-shelf-advanced", ".study-key-capture", ".study-shelf-hidden",
  ".study-editor-notice", ".study-editor-save-status", ".study-memo-editor", ".study-export-folder-controls", ".study-export-folder-name"])
  assert.ok(css.includes(selector), `css is missing ${selector}`);
assert.ok(css.includes("grid-template-rows:minmax(220px,44vh)") && css.includes("grid-template-rows:minmax(210px,42vh)"),
  "the responsive bookshelf reserves more vertical space for the shelf and its item list");
assert.ok(css.includes("prefers-reduced-motion"), "reduced motion is respected");

/* TVドック／選曲画面との連携（背景・ジャケット） */
const tv = read("js/tv-dock.js");
const library = read("js/library.js");
assert.ok(tv.includes('className = "tvCover"') && tv.includes('on("studyCoverChanged"'));
assert.ok(library.includes('on("studyCoverChanged"') && library.includes("getSongCoverBlob"));
assert.ok(library.includes("studySongArt"), "song selection prefers the Study cover");

/* 書斎を開いている間、ゲーム側のキーを止める（旗は window.Trk.overlay に集めた。旧 window._trk*Open は残さない） */
/* js/fx.js は凍結（書き換えない）。その 1 箇所だけは、core.js の読み取り専用の互換アクセサ window._trkStudyRoomOpen を読む */
for (const file of ["player.js", "main.js", "media-player-mode.js", "catch.js", "modes.js", "stage.js", "truck.js", "speed.js", "extras.js", "video-max.js", "synth-mode.js", "fx.js"]) {
  const src = read(`js/${file}`);
  const yields = /Trk\.overlay\.(is\("study"\)|any\(\))/.test(src) || (file === "fx.js" && src.includes("window._trkStudyRoomOpen"));
  assert.ok(yields, `${file} yields global keys to Study`);
}
{
  const jsFiles = fs.readdirSync(new URL("../js/", import.meta.url)).filter(f => f.endsWith(".js") && f !== "fx.js" && f !== "core.js");
  const oldFlags = jsFiles.filter(f => /_trk(StudyRoom|MediaPlayer|SynthMode)Open/.test(read(`js/${f}`)));
  assert.deepEqual(oldFlags, [], "the old window._trk*Open flags are gone (except the frozen fx.js); use window.Trk.overlay");
  const core = read("js/core.js");
  assert.ok(core.includes("window.Trk.overlay = {"), "core.js defines window.Trk.overlay");
  assert.ok(core.includes('Object.defineProperty(window, "_trkStudyRoomOpen"'), "core.js keeps the read-only compatibility getter for the frozen fx.js");
  assert.ok(!/_trk(MediaPlayer|SynthMode)Open/.test(core), "core.js has no old media／synth flag left");
}

console.log(`OK    Study reader: ${localizedKeys.ja.size} strings × 4 languages, 24 text themes / 4 groups / reader-editor styling, shelf folders/drag ordering/visibility, configurable navigation keys, inert text editing/export, data safety, zoom/search/bookmarks/TV wiring`);
