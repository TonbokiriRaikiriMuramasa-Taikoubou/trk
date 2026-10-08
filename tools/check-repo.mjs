#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Small dependency-free repository smoke check.
 *
 * This is intentionally a static check: it catches broken references and
 * syntax regressions before a browser/device pass, but it does not claim to
 * replace real-browser testing.
 */
import fs from "node:fs";
import { restoreCoreAlias, sourceOf } from "./lib/js-source.mjs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
let warnings = 0;

function fail(message) {
  failures += 1;
  console.error(`FAIL  ${message}`);
}
function warn(message) {
  warnings += 1;
  console.warn(`WARN  ${message}`);
}
function ok(message) {
  console.log(`OK    ${message}`);
}
/* 名前空間 D：js/ の本文では、領域の接頭辞 window.Trk.<領域>. を取り除いて照合する（同じ束縛の別の書き方）。
   window.Trk.overlay は取り除かない（書斎・シンスの旗の検査が、その綴りを見る）。 */
/* 別名（const core = window.Trk.core;）を使うファイルは、同じ束縛として元の綴りに戻して照合する。
   alias の行を消し、その後の core. を取り除く（core.js の文字列は除く）。 */
function read(rel) {
  const text = sourceOf(rel, fs.readFileSync(path.join(root, rel), "utf8"));
  return rel.startsWith("js/") ? text.replace(/window\.Trk\.(?!overlay\b)[A-Za-z]\w*\./g, "") : text;
}

/* 利用者向けの説明文：README（概要）と docs/guide/*.md（くわしい説明）を合わせて読む。
   内容の有無を見る検査はこちらを使う。リンク先の存在は README 本体で見る。 */
function readReadme() {
  const guideDir = path.join(root, "docs/guide");
  const guide = fs.existsSync(guideDir) ? fs.readdirSync(guideDir).filter(f => f.endsWith(".md")).sort().map(f => fs.readFileSync(path.join(guideDir, f), "utf8")) : [];
  return [fs.readFileSync(path.join(root, "README.md"), "utf8"), ...guide].join("\n");
}

/* 曲名の照合（js/title-match.js の純関数）＋ plWishMatch（library.js）。
   check-repo の文字列検査と、vm での入出力検査が同じ定義を見るための共通の断片。 */
const titleMatchSrc = read("js/title-match.js");
const plWishMatchSlice = (read("js/library.js").match(/function plWishMatch[\s\S]*?(?=\nfunction plSyncWishes)/) || [""])[0];
const matchLogicSrc = titleMatchSrc + "\n" + plWishMatchSlice;
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".git" || ent.name === "node_modules") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}
function localPath(value) {
  const clean = value.split(/[?#]/, 1)[0];
  return clean.startsWith("/") ? clean.slice(1) : clean;
}

// Every JavaScript file should at least parse in the Node parser. This does
// not execute browser code, so it remains safe and dependency-free.
const jsFiles = walk(path.join(root, "js")).filter(f => f.endsWith(".js"));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) fail(`JavaScript syntax: ${path.relative(root, file)}\n${(result.stderr || result.stdout).trim()}`);
}
if (!failures) ok(`JavaScript syntax (${jsFiles.length} files)`);

// Local script and stylesheet references in the entry point must resolve.
// Do not treat example script tags inside HTML comments as real assets.
const index = read("index.html").replace(/<!--[\s\S]*?-->/g, "");
const refs = [
  ...[...index.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => ["script", m[1]]),
  ...[...index.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)].map(m => ["link", m[1]])
];
let missingRefs = 0;
for (const [kind, ref] of refs) {
  if (/^(?:[a-z]+:)?\/\//i.test(ref) || ref.startsWith("data:")) continue;
  const rel = localPath(ref);
  if (!exists(rel)) {
    missingRefs += 1;
    fail(`${kind} reference is missing: ${ref}`);
  }
}
if (!missingRefs) ok(`index.html local references (${refs.length} checked)`);

// Duplicate static IDs can silently wire event handlers to the wrong control.
const indexIds = [...index.matchAll(/\bid=["']([^"']+)["']/gi)].map(match => match[1]);
const idCounts = new Map();
for (const id of indexIds) idCounts.set(id, (idCounts.get(id) || 0) + 1);
const duplicateIds = [...idCounts].filter(([, count]) => count > 1).map(([id, count]) => `${id} (${count})`);
if (duplicateIds.length) fail(`index.html contains duplicate IDs: ${duplicateIds.join(", ")}`);
else ok(`index.html static IDs are unique (${indexIds.length} checked)`);

// 📺 TV picture looks and brightness/blur favorites: keep the documented
// preset count, four localized groups, safe long-press resets and bounded data.
{
  const presetSource = read("js/tv-presets.js");
  const tv = read("js/tv-dock.js");
  const core = read("js/core.js");
  const style = read("css/style.css");
  const notice = read("NOTICE.md");
  const ids = [...presetSource.matchAll(/\bid:"([^"]+)"/g)].map(m => m[1]);
  const catCounts = Object.fromEntries(["portrait", "anime", "texture", "quality"].map(cat =>
    [cat, (presetSource.match(new RegExp(`cat:"${cat}"`, "g")) || []).length]));
  const uniqueIds = new Set(ids).size === ids.length;
  const langsOk = ["tvCatPortrait", "tvCatAnime", "tvCatTexture", "tvCatQuality", "tvParamRandHint", "tvParamHint"]
    .every(key => (tv.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  const presetsOk = ids.length === 70 && uniqueIds && Object.values(catCounts).every(n => n === 5);
  const resetOk = tv.includes('bindLongPressReset(rPar, () => applyParamValues(0, 0, "tvParamDefaultDone"))') &&
    tv.includes('bindLongPressReset(dimInp, () => applyParamValues(0, settings.bgBlur, "tvDimResetDone")') &&
    tv.includes('bindLongPressReset(blurInp, () => applyParamValues(settings.bgDim, 0, "tvBlurResetDone")') &&
    tv.includes('tvParamRandHint:"(長押しでデフォルトに戻します。)"') &&
    tv.includes('paramResetBtn.addEventListener("click"');
  const favoritesOk = core.includes("TV_PARAM_FAV_MAX = 8") && core.includes("cleanTvParamFavorites(prefs.tvParamFavs)") &&
    core.includes("settings.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs)") &&
    core.includes("settings.tvParamFavs = []") && tv.includes("cleanTvParamFavorites(prefs.tvParamFavs)") &&
    tv.includes("settings.tvParamFavs = cleanTvParamFavorites(settings.tvParamFavs)");
  const overlaysOk = ["portraitGlow", "softbox", "finegrain", "paper", "halftone"]
    .every(name => presetSource.includes(`overlay:"${name}"`) && tv.includes(`case "${name}"`));
  const canvasOriginalOk = tv.includes("function tvTextureRandom(seed)") && !tv.includes("fetch(") &&
    tv.includes("CanvasRenderingContext2D.filter is unavailable") && tv.includes("ctx.canvas.style.filter = filter") &&
    notice.includes("No third-party LUTs") && notice.includes("do not detect faces") && notice.includes("do not increase");
  const favoriteStyleOk = style.includes(".tvParamFavList") && style.includes(".tvParamTools");
  if (!presetsOk) fail(`TV preset catalog should contain 70 unique filters, five in each new category (found ${ids.length}; ${JSON.stringify(catCounts)})`);
  else if (!langsOk) fail("TV portrait/anime/texture/quality groups or parameter reset help are missing from one of the four languages");
  else if (!resetOk) fail("TV random button and brightness/blur sliders need their long-press reset paths and explicit reset control");
  else if (!favoritesOk) fail("brightness/blur favorites must be bounded, validated, persisted and safe-mode aware");
  else if (!overlaysOk || !canvasOriginalOk || !favoriteStyleOk) fail("original Canvas TV overlays, documented rights/scope, CSS-filter fallback, or parameter-favorite styling are missing");
  else ok("TV catalog (70 presets), localized picture categories, long-press resets, and bounded brightness/blur favorites are wired");
}

const privacy = read("privacy.html").replace(/<!--[\s\S]*?-->/g, "");
let missingPrivacyRefs = 0;
for (const match of privacy.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
  const ref = match[1];
  if (/^(?:[a-z]+:)?\/\//i.test(ref) || ref.startsWith("data:") || ref.startsWith("#")) continue;
  const rel = localPath(ref);
  if (!exists(rel)) {
    missingPrivacyRefs += 1;
    fail(`privacy.html reference is missing: ${ref}`);
  }
}
if (!missingPrivacyRefs) ok("privacy.html local references");

const credits = read("credits.html").replace(/<!--[\s\S]*?-->/g, "");
let missingCreditsRefs = 0;
for (const match of credits.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
  const ref = match[1];
  if (/^(?:[a-z]+:)?\/\//i.test(ref) || ref.startsWith("data:") || ref.startsWith("#")) continue;
  const rel = localPath(ref);
  if (!exists(rel)) {
    missingCreditsRefs += 1;
    fail(`credits.html reference is missing: ${ref}`);
  }
}
if (!missingCreditsRefs) ok("credits.html local references");

// The manifest's PWA icons are easy to break when an asset is regenerated.
try {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  for (const icon of manifest.icons || []) {
    if (!icon.src || !exists(localPath(icon.src))) fail(`manifest icon is missing: ${icon.src}`);
  }
  if (Array.isArray(manifest.icons) && manifest.icons.length) ok(`manifest icons (${manifest.icons.length})`);
  else warn("manifest.webmanifest contains no icons");
} catch (error) {
  fail(`manifest.webmanifest is not valid JSON: ${error.message}`);
}

function pngSize(rel) {
  const b = fs.readFileSync(path.join(root, rel));
  if (b.length < 24 || !b.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
for (const [rel, expectedWidth, expectedHeight] of [
  ["icons/icon-192.png", 192, 192],
  ["icons/icon-512.png", 512, 512],
  ["docs/og.png", 1200, 630]
]) {
  if (!exists(rel)) {
    fail(`required image is missing: ${rel}`);
    continue;
  }
  const size = pngSize(rel);
  if (!size) fail(`${rel} is not a PNG`);
  else if (size.width !== expectedWidth || size.height !== expectedHeight) fail(`${rel} is ${size.width}x${size.height}, expected ${expectedWidth}x${expectedHeight}`);
  else ok(`${rel} dimensions ${expectedWidth}x${expectedHeight}`);
}

// Keep the documented shelf count tied to the source of truth.
const skins = read("js/lib-skins.js");
const orderMatch = skins.match(/const LIB_SKIN_ORDER\s*=\s*\[([^\]]+)\]/s);
if (!orderMatch) {
  fail("LIB_SKIN_ORDER could not be read");
} else {
  const ids = [...orderMatch[1].matchAll(/["']([^"']+)["']/g)].map(m => m[1]);
  if (ids.length !== 30) fail(`expected 30 shelf skins, found ${ids.length}`);
  else ok("shelf skin count is 30");
}
if (/棚スキン11種|・11種類/.test(read("css/style.css") + skins)) {
  fail("stale shelf skin count (11) remains in source comments");
}

// Overall look skins: 33 presets in data.js (incl. the locked 🎓 reward skin, 3 見やすさ skins and 6 生活 skins, 4 ゲーム画面 skins) + 4 Miku skins = 44.
const dataJs = read("js/data.js");
const skinsStart = dataJs.indexOf("const SKINS = {");
const skinsEnd = dataJs.indexOf("\n};", skinsStart);
if (skinsStart < 0 || skinsEnd < 0) {
  fail("SKINS block could not be read in js/data.js");
} else {
  const presetCount = (dataJs.slice(skinsStart, skinsEnd).match(/label:\{ja:/g) || []).length;
  const mikuCount = (read("js/characters/miku.js").match(/^ {2}(?:window\.Trk\.data\.)?SKINS\.[A-Za-z0-9]+ = \{/gm) || []).length;
  if (presetCount + mikuCount !== 44) fail(`expected 44 overall skins, found ${presetCount + mikuCount}`);
  else ok("overall skin count is 44");
  /* 🎓 ごほうびスキン（グラデュエーション）は、スタンプ5つで解禁まで鍵がかかっていること */
  if (!/graduation:\s*\{[\s\S]*?locked:\s*true/.test(dataJs.slice(skinsStart, skinsEnd)) ||
      !read("js/core.js").includes("SKINS[id].locked && !settings.skinGradUnlocked")) fail("graduation reward-skin lock is missing");
  else ok("graduation reward skin stays locked until stamps");
}

// 🎧 Playlist tabs: user playlists in library.js, delete-mode setting in core.js, song profile storage.
if (!read("js/library.js").includes('startsWith("pl:")') ||
    !read("js/library.js").includes('SONG_META_KEY = "shadow_taiko_songmeta_v1"') ||
    !read("js/library.js").includes('PLAYED_KEY = "shadow_taiko_played_v1"') ||
    !read("js/library.js").includes('format: "trk-playlist"') ||
    !read("js/library.js").includes("plFolderSanitize") ||
    !read("js/core.js").includes("playlistDelMode") ||
    !read("js/core.js").includes("plFolders")) {
  fail("playlist tab plumbing is missing");
} else {
  ok("playlist tabs, profiles and sharing are wired");
}

// 🎚 Pro-audio effects: worklet processors + rack plumbing in fx.js.
if (!exists("js/fx-worklet.js") ||
    !read("js/fx-worklet.js").includes("trk-denoise") ||
    !read("js/fx-worklet.js").includes("trk-dyneq") ||
    !read("js/fx-worklet.js").includes("trk-gate") ||
    !read("js/fx.js").includes("settings.fxRack") ||
    !read("js/fx.js").includes("fxRackOn")) {
  fail("pro-audio effect plumbing is missing");
} else {
  ok("pro-audio effects (gate / denoise / dynamic EQ) and rack are wired");
}

// 🔥 TRK amp: the independent category right below "🎛 More (EQ / skin / menu)"
// at the bottom-left of the song column, driving the layered effect rack
// through the small rack API that fx.js exposes (the DSP itself is untouched).
{
  const fx = read("js/fx.js");
  const dock = read("js/fx-dock.js");
  const core = read("js/core.js");
  const css = read("css/style.css");
  const ampKeys = ["ampTitle", "ampHint", "ampUse", "ampStateOn", "ampStateOff", "ampEmpty", "ampStacksLabel",
    "ampStackTrk", "ampStackWarm", "ampStackRadio", "ampStackClean", "ampStackSet", "ampOnMsg", "ampOffMsg",
    "ampCleared", "ampFull", "ampStageAdd", "ampClear", "ampMore", "ampAdjustHint"];
  const apiOk = ['rack:() => ({ on:!!settings.fxRackOn, list:settings.fxRack.map(copy) })', "rackTypes:() => RACK_META.map",
    "rackOn:v =>", "rackSet:list =>", "rackAdd:type =>", "rackClear:() =>", 'emit("fxRack")'].every(t => fx.includes(t)) &&
    fx.includes("function cleanFx") && fx.includes("RACK_MAX = 8") &&
    /* 検証の定数（R / BIQUAD …）は、settings.fxRack を cleanFx で読む行より前に無いと
       保存済みの段がある人の読み込みで落ちる（参照エラー）ので、順番も見張る */
    fx.indexOf("const R = (v, lo, hi, d)") >= 0 &&
    fx.indexOf("const R = (v, lo, hi, d)") < fx.indexOf("settings.fxRack = (Array.isArray(prefs.fxRack)");
  const resetOk = ["function resetAmpPrefs()", 'markAmpReset("clear")', 'markAmpReset("off")',
    "function takeAmpReset()", '["amp","rack"].includes(r)'].every(t => core.includes(t)) &&
    fx.includes("takeAmpReset()") && fx.includes("if (ampReset === \"clear\") settings.fxRack = []");
  const uiOk = dock.includes('amp.id = "ampPanel"') && dock.includes("const AMP_STACKS") &&
    ["trk", "warm", "radio", "clean"].every(id => dock.includes(id + ":")) && dock.includes("data-ampstack") &&
    dock.includes('dock.append(dev, favChips, overLabel, overflow, body);') && dock.includes("const placeAmp = () =>") &&
    dock.includes('on("fxRack", renderAmp)') && dock.includes("const AMP_MAX = 8") &&
    dock.includes('settings.ampOpen = typeof prefs.ampOpen === "boolean" ? prefs.ampOpen : true') &&
    core.includes("settings.ampOpen = true;") && core.includes("settings.tvRichOpen = false;") &&
    fx.includes("settings.ampOpen = ampReset === \"clear\";") && dock.includes('data-i18n="sfxRackTitle"') &&
    ["TrkFX.rackSet(", "TrkFX.rackOn(true)", "TrkFX.rackAdd(", "TrkFX.rackClear()"].every(t => dock.includes(t)) &&
    css.includes("#ampPanel .ampStage") && css.includes("#ampPanel .ampStages");
  const langOk = ampKeys.every(k => (dock.match(new RegExp("\\b" + k + ":", "g")) || []).length === 4);
  if (!apiOk) fail("TRK amp rack API (fx.js) is missing: rack / rackTypes / rackOn / rackSet / rackAdd / rackClear (or the validators moved below the saved-rack load)");
  else if (!resetOk) fail("TRK amp reset plumbing (?reset=amp / ?reset=all / ?safe=1) is missing");
  else if (!uiOk) fail("TRK amp category (bottom-left, below 🎛 More) is not wired to the rack");
  else if (!langOk) fail("TRK amp strings are missing from one of the four languages");
  else ok("TRK amp: independent bottom-left category (below 🎛 More), open on arrival, with 4 stacks, stage chips and rack API in 4 languages");
}

// ✨ TRK effects: the independent bottom-left category right below 🔥 TRK amp,
// surfacing the "rich" video grades (portrait / anime / texture / studio) that
// tv-presets.js added. It only drives settings.videoStyle through TrkTV, so the
// TV's own video-filter list and this panel can never drift apart.
{
  const rich = read("js/tv-rich.js");
  const html = read("index.html");
  const css = read("css/style.css");
  const core = read("js/core.js");
  const keys = ["richTitle", "richHint", "richUse", "richOn", "richOff", "richSafe", "richPrevLabel",
    "richNextLabel", "richRandom", "richReset", "richRandomed", "richRestored", "richMore", "richNote", "richNoPreset"];
  const apiOk = rich.includes('panel.id = "richPanel"') && rich.includes('el("details", "panel dockRich")') &&
    rich.includes('const RICH_CATS = ["portrait", "anime", "texture", "quality"]') &&
    rich.includes("window.TrkTV") && rich.includes("TrkTV.list()") && rich.includes("TrkTV.select(") &&
    rich.includes("TrkTV.current()") && rich.includes('on("tvChange"') && rich.includes("const placeRich = () =>") &&
    rich.includes("settings.tvRichId") && rich.includes("settings.tvRichPrev") && rich.includes('typeof settings[key] === "string"') &&
    rich.includes("prefs.tvRichOpen !== false") && core.includes("settings.tvRichOpen = true;");
  const wireOk = html.includes('<script src="js/tv-rich.js"></script>') && css.includes("#richPanel .richChips") &&
    css.includes("#richPanel .richCats") && core.includes('settings.tvRichId = "portrait_natural"') &&
    core.includes("out.tvRichId = settings.tvRichId");
  const langOk = keys.every(k => (rich.match(new RegExp("\\b" + k + ":", "g")) || []).length === 4);
  if (!apiOk) fail("TRK effects (rich video) panel is not wired to the video filter (TrkTV / videoStyle)");
  else if (!wireOk) fail("TRK effects (rich video) is missing the script tag, styles, or the video reset/export keys");
  else if (!langOk) fail("TRK effects (rich video) strings are missing from one of the four languages");
  else ok("TRK effects: rich video grades as an independent bottom-left category (below 🔥 TRK amp), open on arrival, in 4 languages");
}

// 🛒 Official-source catalog: no-audio curated playlists with wishlist matching.
{
  const library = read("js/library.js");
  const css = read("css/style.css");
  const catalog = read("js/catalog.js");
  const babelStart = catalog.indexOf('PL("ak-babel"');
  const babelEnd = catalog.indexOf('PL("ak-hen"', babelStart + 1);
  const babelBlock = babelStart >= 0 && babelEnd > babelStart ? catalog.slice(babelStart, babelEnd) : "";
  const expectedBabelRows = [
    ["Storyteller", "https://monster-siren.hypergryph.com/music/779480"],
    ["Fire's Embrace", "https://monster-siren.hypergryph.com/music/953979"],
    ["The Opening", "https://monster-siren.hypergryph.com/music/697614"],
    ["Founding Stone", "https://monster-siren.hypergryph.com/music/048797"],
    ["Silent Tales", "https://monster-siren.hypergryph.com/music/461148"]
  ];
  const actualBabelRows = [...babelBlock.matchAll(/T\("([^"]+)",[^\n]*?"(https:\/\/monster-siren\.hypergryph\.com\/music\/\d{6})"\)/g)]
    .map(m => [m[1], m[2]]);
  const babelLinksOk = actualBabelRows.length === expectedBabelRows.length &&
    expectedBabelRows.every(([title, url], i) => actualBabelRows[i][0] === title && actualBabelRows[i][1] === url);
  const loneTrailStart = catalog.indexOf('PL("ak-lonetrail"');
  const loneTrailEnd = catalog.indexOf('PL("ak-walkindust"', loneTrailStart + 1);
  const loneTrailBlock = loneTrailStart >= 0 && loneTrailEnd > loneTrailStart ? catalog.slice(loneTrailStart, loneTrailEnd) : "";
  const expectedLoneTrailRows = [
    ["Ad astra", "https://monster-siren.hypergryph.com/music/125074"],
    ["Control's Wishes", "https://monster-siren.hypergryph.com/music/880337"],
    ["The Coming of the Future", "https://monster-siren.hypergryph.com/music/461158"],
    ["特里蒙的天空", "https://monster-siren.hypergryph.com/music/232266"],
    ["群星见我", "https://monster-siren.hypergryph.com/music/125073"],
    ["A World Above", "https://monster-siren.hypergryph.com/music/232265"],
    ["Rhine Lab.LLC", "https://monster-siren.hypergryph.com/music/779491"],
    ["Blues with you", "https://monster-siren.hypergryph.com/music/514542"],
    ["Bubble", "https://monster-siren.hypergryph.com/music/048700"],
    ["绿意游曳", "https://monster-siren.hypergryph.com/music/697629"]
  ];
  const actualLoneTrailRows = [...loneTrailBlock.matchAll(/T\("([^"]+)",[^\n]*?"(https:\/\/monster-siren\.hypergryph\.com\/music\/\d{6})"\)/g)]
    .map(m => [m[1], m[2]]);
  const loneTrailLinksOk = actualLoneTrailRows.length === expectedLoneTrailRows.length &&
    expectedLoneTrailRows.every(([title, url], i) => actualLoneTrailRows[i][0] === title && actualLoneTrailRows[i][1] === url);
  const loneTrailCatalogRefreshOk = catalog.includes('PL("ak-lonetrail", "LONETRAIL", "🚀"') &&
    library.includes('if (pl.id === "ak-lonetrail" && existing.cat === "trk:" + s.id + ":" + pl.id)') &&
    library.includes('if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }') &&
    library.includes('if (existing.name === "アークナイツ — Lone Trail") { existing.name = pl.name; changed = true; }') &&
    library.includes('if (existing.icon === "🛤️") { existing.icon = pl.icon || s.icon; changed = true; }') &&
    library.includes('if (JSON.stringify(existing.tags) === JSON.stringify(["Game","Arknights","MSR","Lone Trail"]))');
  const xuStart = catalog.indexOf('PL("ak-hen"');
  const xuNext = catalog.indexOf('\n   PL(', xuStart + 1);
  const xuEnd = xuNext >= 0 ? xuNext : catalog.indexOf('])]);', xuStart);
  const xuBlock = xuStart >= 0 && xuEnd > xuStart ? catalog.slice(xuStart, xuEnd) : "";
  const expectedXuRows = [
    ["2:00 PM in Mitsukue", "https://monster-siren.hypergryph.com/music/779461"],
    ["墟", "https://monster-siren.hypergryph.com/music/232232"],
    ["夏日潜行", "https://monster-siren.hypergryph.com/music/306880"],
    ["夜间超速", "https://monster-siren.hypergryph.com/music/048779"],
    ["刀刃所栖之物", "https://monster-siren.hypergryph.com/music/514514"],
    ["关掉播放器之前", "https://monster-siren.hypergryph.com/music/697697"],
    ["与你在黄昏街角相遇", "https://monster-siren.hypergryph.com/music/125048"]
  ];
  const actualXuRows = [...xuBlock.matchAll(/T\("([^"]+)",[^\n]*?"(https:\/\/monster-siren\.hypergryph\.com\/music\/\d{6})"\)/g)]
    .map(m => [m[1], m[2]]);
  const xuLinksOk = actualXuRows.length === expectedXuRows.length &&
    expectedXuRows.every(([title, url], i) => actualXuRows[i][0] === title && actualXuRows[i][1] === url);
  const xuRefreshStart = library.indexOf('if (pl.id === "ak-hen" && existing.cat === "trk:" + s.id + ":" + pl.id)');
  const xuRefreshEnd = library.indexOf("\n        }\n        continue;", xuRefreshStart);
  const xuRefreshBlock = xuRefreshStart >= 0 && xuRefreshEnd > xuRefreshStart ? library.slice(xuRefreshStart, xuRefreshEnd) : "";
  const xuCatalogRefreshOk = catalog.split('PL("ak-hen"').length - 1 === 1 &&
    catalog.includes('PL("ak-hen", "アークナイツ — 墟", "👹"') &&
    !xuBlock.includes('T("痕 — Wounds"') &&
    xuRefreshBlock.includes('if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }') &&
    library.includes('if (pl.id === "ak-hen" && existing.cat === "trk:" + s.id + ":" + pl.id)') &&
    library.includes('if (existing.name === "アークナイツ — 痕") { existing.name = pl.name; changed = true; }') &&
    library.includes('if (existing.icon === "🩹") { existing.icon = pl.icon || s.icon; changed = true; }') &&
    library.includes('if (JSON.stringify(existing.tags) === JSON.stringify(["Game","Arknights","MSR","痕"]))');
  const eventPlaylistExpected = {
    "ak-solongadele": [
      ["Misty Memory (Day Version)", "https://monster-siren.hypergryph.com/music/048708"],
      ["Misty Memory (Night Version)", "https://monster-siren.hypergryph.com/music/306816"],
      ["Misty Memory (Acoustic Version)", "https://monster-siren.hypergryph.com/music/880333"],
      ["Effervescence", "https://monster-siren.hypergryph.com/music/306815"],
      ["Counting Sheep", "https://monster-siren.hypergryph.com/music/953981"],
      ["Sheepnado Decimates Nomadic City", "https://monster-siren.hypergryph.com/music/232262"],
      ["Adele's Dream", "https://monster-siren.hypergryph.com/music/125070"],
      ["So Long for Another Summer", "https://monster-siren.hypergryph.com/music/514549"],
      ["Drifting Blossom", "https://monster-siren.hypergryph.com/music/461154"]
    ],
    "ak-nearlight": [
      ["大骑士领", "https://monster-siren.hypergryph.com/music/125091"],
      ["骑士之日", "https://monster-siren.hypergryph.com/music/697642"],
      ["无畏者", "https://monster-siren.hypergryph.com/music/953900"],
      ["冠军对决", "https://monster-siren.hypergryph.com/music/048729"]
    ],
    "ak-silverneherze": [
      ["Day Train to Lake Silberneherze", "https://monster-siren.hypergryph.com/music/514538"],
      ["Play with Burdenbeasts", "https://monster-siren.hypergryph.com/music/779486"],
      ["First Crevasse on the Frozen Lake", "https://monster-siren.hypergryph.com/music/461143"]
    ],
    "ak-ilsiracusano": [
      ["叙拉古人", "https://monster-siren.hypergryph.com/music/048728"],
      ["文明之名", "https://monster-siren.hypergryph.com/music/880356"],
      ["狼之主", "https://monster-siren.hypergryph.com/music/514563"],
      ["我即荒野", "https://monster-siren.hypergryph.com/music/880355"]
    ],
    "ak-stultiferanavis": [
      ["愚人曲", "https://monster-siren.hypergryph.com/music/953915"],
      ["黄金时代的遗产", "https://monster-siren.hypergryph.com/music/880362"],
      ["蔓延", "https://monster-siren.hypergryph.com/music/514570"],
      ["礁石不朽", "https://monster-siren.hypergryph.com/music/306849"],
      ["深渊梦呓", "https://monster-siren.hypergryph.com/music/697654"],
      ["Hunter's Song", "https://monster-siren.hypergryph.com/music/125007"]
    ],
    "ak-whoreal": [
      ["今夕何夕", "https://monster-siren.hypergryph.com/music/953903"],
      ["起墨", "https://monster-siren.hypergryph.com/music/697645"],
      ["何时卷", "https://monster-siren.hypergryph.com/music/779411"],
      ["几更笔", "https://monster-siren.hypergryph.com/music/048722"],
      ["山水烬尽", "https://monster-siren.hypergryph.com/music/880350"]
    ],
    "ak-comevultures": [
      ["巴伦巨舰", "https://monster-siren.hypergryph.com/music/697625"],
      ["Case Ejection", "https://monster-siren.hypergryph.com/music/232261"],
      ["The Survivor, The Winner", "https://monster-siren.hypergryph.com/music/880332"]
    ],
    "ak-zwillingstuerme": [
      ["Visage", "https://monster-siren.hypergryph.com/music/514547"],
      ["Underneath the Spires", "https://monster-siren.hypergryph.com/music/125078"],
      ["Der Hexenkönig", "https://monster-siren.hypergryph.com/music/779496"],
      ["Die Sünden des Herkunftshorns", "https://monster-siren.hypergryph.com/music/697623"],
      ["The Theme (Imperial)", "https://monster-siren.hypergryph.com/music/779495"],
      ["The Theme (Variant)", "https://monster-siren.hypergryph.com/music/461151"],
      ["Pavillon, My Last Creation", "https://monster-siren.hypergryph.com/music/306812"],
      ["Scordatura", "https://monster-siren.hypergryph.com/music/880330"],
      ["Before the Cessation", "https://monster-siren.hypergryph.com/music/232269"]
    ]
  };
  const eventPlaylistNames = {
    "ak-solongadele": "アークナイツ — So Long, Adele",
    "ak-nearlight": "アークナイツ — Near Light",
    "ak-silverneherze": "アークナイツ — The Rides to Lake Silberneherze",
    "ak-ilsiracusano": "アークナイツ — Il Siracusano",
    "ak-stultiferanavis": "アークナイツ — Stultifera Navis",
    "ak-whoreal": "アークナイツ — Who Is Real",
    "ak-comevultures": "アークナイツ — Come Catastrophes or Wakes of Vultures",
    "ak-zwillingstuerme": "アークナイツ — Zwillingstürme im Herbst"
  };
  const eventPlaylistLinksOk = Object.entries(eventPlaylistExpected).every(([id, expectedRows]) => {
    const start = catalog.indexOf(`PL("${id}"`);
    if (start < 0 || catalog.split(`PL("${id}"`).length - 1 !== 1 ||
        !catalog.includes(`PL("${id}", "${eventPlaylistNames[id]}"`)) return false;
    const next = catalog.indexOf("\n   PL(", start + 1);
    const final = catalog.indexOf("])]);", start);
    const end = next >= 0 && final >= 0 ? Math.min(next, final) : next >= 0 ? next : final;
    if (end <= start) return false;
    const block = catalog.slice(start, end);
    const actualRows = [...block.matchAll(/T\("([^\"]+)",[^\n]*?"(https:\/\/monster-siren\.hypergryph\.com\/music\/\d{6})"\)/g)]
      .map(m => [m[1], m[2]]);
    return actualRows.length === expectedRows.length &&
      expectedRows.every(([title, url], i) => actualRows[i][0] === title && actualRows[i][1] === url);
  });
  const soLongRefreshStart = library.indexOf('if (pl.id === "ak-solongadele" && existing.cat === "trk:" + s.id + ":" + pl.id)');
  const soLongRefreshEnd = library.indexOf("\n        }", soLongRefreshStart);
  const soLongRefreshBlock = soLongRefreshStart >= 0 && soLongRefreshEnd > soLongRefreshStart ?
    library.slice(soLongRefreshStart, soLongRefreshEnd) : "";
  const soLongCatalogRefreshOk = catalog.split('PL("ak-solongadele"').length - 1 === 1 &&
    catalog.includes('PL("ak-solongadele", "アークナイツ — So Long, Adele"') &&
    soLongRefreshBlock.includes('if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }');
  /* 📡 「集める棚」：未入手の曲を開いた瞬間から灰色で並べ、入手したら黒くなる */
  const collectionOk = titleMatchSrc.includes("function plTitleKeys(") &&
    /function plWishMatch\(w, byTitle\) \{\s*for \(const k of plWishTitleKeys\(w\)\)/.test(library) &&
    titleMatchSrc.includes("function plSongMatchKeys(title, matchHint)") &&
    library.includes("for (const k of plSongMatchKeys(m.title || it.title, m.matchHint)) byTitleAdd(k, it);") &&
    library.includes("function plCollectionEntries(") && library.includes("function plWishFolderIds(") &&
    library.includes("const entries = plCollectionEntries(tabId, byTitle);") &&
    library.includes("if (!all.length && !entries.length) {") &&
    library.includes("if (!row.it) { box.append(plWishRow(row.w)); continue; }") &&
    library.includes("function trkFolderIdSet() { return plWishFolderIds(TRK_FOLDER_ID); }") &&
    library.includes("const haveAll = usedKeys.size, totalAll = entries.length;") &&
    library.includes("const usedKeys = new Set();") &&
    !library.includes("const wishLeft = []") &&   /* 下部の 📡 ブロックは行内の灰色行に置き換えた */
    /plWishRow\{[^}]*opacity/.test(css) && css.includes(".plWishHint{");
  /* 4言語ぶんの文言（ja/en/zh/ko で各4回）。行をまとめて書き換えたときに片方を消した事故を止める */
  const stringsOk = ["plWishHead", "plWishTag", "plWishHint", "plWishOpen", "plWishNoLink",
    "plCatalogBtn", "plCatalogHint", "plCatalogTake", "plCatalogTaken", "plCatalogDup"]
    .every(k => library.split(k + ':\"').length - 1 === 4);
  const profileMatchStringsOk = ["plMatchMemo", "plMatchMemoPh", "plMatchMemoNote"]
    .every(k => library.split(k + ':\"').length - 1 === 4);
  let matchHintBehaviorOk = false;
  try {
    const logic = plWishMatchSlice ? [matchLogicSrc] : null;
    if (logic) {
      const ctx = { metaOf: () => null };
      vm.runInNewContext(`${logic[0]}\nglobalThis.__plSongMatchKeys = plSongMatchKeys; globalThis.__plWishMatch = plWishMatch;`, ctx);
      const mapSong = (title, hint) => {
        const it = { key:title, title }, byTitle = new Map();
        for (const key of ctx.__plSongMatchKeys(title, hint)) {
          const hits = byTitle.get(key) || [];
          if (!hits.includes(it)) hits.push(it);
          byTitle.set(key, hits);
        }
        return { it, byTitle };
      };
      const examples = [
        ["BELIEVE.ogg", "Suguri", "Suguri - BELIEVE"],
        ["Comet.ogg", "Hime", "Hime - Comet"],
        ["Up_to_you.ogg", "Sora", "Sora - Up to you"]
      ];
      matchHintBehaviorOk = examples.every(([title, hint, wishTitle]) => {
        const { it, byTitle } = mapSong(title, hint);
        return ctx.__plWishMatch({ t:wishTitle, al:"", ar:"" }, byTitle) === it && it.title === title;
      });
      /* 曲名かメモの片方だけでよい。メモなしで BELIEVE.ogg、または別タイトル＋Suguri でも候補に当たる。 */
      const titleOnly = mapSong("BELIEVE.ogg", "");
      const hintOnly = mapSong("unrelated.ogg", "Suguri");
      const noMatch = mapSong("unrelated.ogg", "other hint");
      matchHintBehaviorOk = matchHintBehaviorOk &&
        ctx.__plWishMatch({ t:"Suguri - BELIEVE", al:"", ar:"" }, titleOnly.byTitle) === titleOnly.it &&
        ctx.__plWishMatch({ t:"Suguri - BELIEVE", al:"", ar:"" }, hintOnly.byTitle) === hintOnly.it &&
        ctx.__plWishMatch({ t:"Suguri - BELIEVE", al:"", ar:"" }, noMatch.byTitle) === null;
    }
  } catch (_) { matchHintBehaviorOk = false; }
  const fileExtensionOk = !/\.pgg\b/i.test(library + readReadme() + read("docs/HANDOFF.md")) &&
    /BELIEVE\.ogg/i.test(readReadme() + read("docs/HANDOFF.md"));
  const profileMatchOk = fileExtensionOk && library.includes('["matchHint", 80]') &&
    titleMatchSrc.includes('function plWishTitleKeys(wish)') &&
    library.includes('matchMemo.placeholder = tr("plMatchMemoPh")') &&
    library.includes('f.matchHint = matchMemo') &&
    library.includes('m.matchHint ? `${tr("plMatchMemo")}: ${m.matchHint}` : ""') &&
    profileMatchStringsOk && matchHintBehaviorOk;
  if (!exists("js/catalog.js") ||
      !read("js/catalog.js").includes("TRK_CATALOG") ||
      !library.includes("plCatalogMenu") ||
      !library.includes("plWishMatch") ||
      !library.includes("function plWishRow(") ||
      !read("index.html").includes('src="js/catalog.js"')) {
    fail("official catalog plumbing is missing");
  } else if (!collectionOk || !stringsOk || !profileMatchOk) {
    fail("the collection shelf, .ogg examples, or one-sided local profile match-hint path is incomplete");
  } else if (!babelLinksOk) {
    fail("the five Babel OST tracks do not point to their matching Monster-Siren song pages in order");
  } else if (!loneTrailLinksOk || !loneTrailCatalogRefreshOk) {
    fail("the ten LONETRAIL songs, direct links, or safe refresh for existing catalog imports are incomplete");
  } else if (!xuLinksOk || !xuCatalogRefreshOk) {
    fail("the seven 墟 songs, direct links, or safe replacement of existing 痕 imports are incomplete");
  } else if (!eventPlaylistLinksOk || !soLongCatalogRefreshOk) {
    fail("selected Arknights event OST titles, direct song links, or safe So Long, Adele catalog refresh are incomplete");
  } else {
    ok("official catalog (wishlist auto-match, profile match hint, Babel + LONETRAIL + 墟 + selected event OSTs, no bundled audio) is wired");
  }
}

// 🎯 VALORANT / 🩺 Arknights / ❄ Genshin / 🍊 OJ / 🌟 Gakumas catalog updates:
// official destinations, separated distribution claims, SEARCH RIGHT/LIGHT alias, safe refresh.
{
  const catalogSource = read("js/catalog.js");
  const library = read("js/library.js");
  let targetCatalogOk = false;
  let aliasBehaviorOk = false;
  let safeRefreshOk = false;
  try {
    const fixture = JSON.parse(read("tools/gakumas-download-tracks.json"));
    const catalogContext = vm.createContext({});
    new vm.Script(catalogSource + "\nglobalThis.__TRK_CATALOG_FOR_CHECK = TRK_CATALOG;").runInContext(catalogContext);
    const all = catalogContext.__TRK_CATALOG_FOR_CHECK;
    const gakumas = all.find(series => series.id === "gakumas");
    const instrumentLists = gakumas && ["gm-inst", "gm-inst2"].map(id => gakumas.playlists.find(pl => pl.id === id));
    const discography = gakumas && gakumas.playlists.find(pl => pl.id === "gm-releases");
    const instrumentSongs = instrumentLists && instrumentLists.flatMap(pl => pl.songs);
    const searchRight = instrumentSongs && instrumentSongs.find(track => track.t === "SEARCH RIGHT");
    const officialDiscographyUrl = url => /^https:\/\/gakuen-label\.idolmaster-official\.jp\/discography\/[A-Za-z0-9_-]+$/.test(url || "");
    const gakumasDataOk = !!gakumas && gakumas.url === fixture.sourcePage &&
      fixture.sourceUrl === "https://drive.google.com/drive/folders/1iv1Qrca365CpgklE5z-Al40_hNZI11Ly?usp=sharing" &&
      fixture.files.length === 50 && new Set(fixture.files).size === 50 &&
      instrumentLists.every((pl, i) => pl && pl.songs.length === 25 &&
        pl.sourceUrl === fixture.sourceUrl && pl.sourceLabel.includes("公式Google Drive") &&
        pl.songs.every(track => officialDiscographyUrl(track.u))) &&
      instrumentSongs.length === 50 && discography && discography.songs.length === 14 &&
      discography.sourceUrl === "https://gakuen-label.idolmaster-official.jp/discography" &&
      discography.songs.every(track => officialDiscographyUrl(track.u)) &&
      fixture.filenameAliases["SEARCH RIGHT"] === "SEARCH LIGHT" &&
      fixture.files.includes("SEARCH LIGHT") && searchRight &&
      JSON.stringify(searchRight.matchAliases) === JSON.stringify(["SEARCH LIGHT"]) &&
      gakumas.note.includes("限定的なファン動画向け") && gakumas.note.includes("購入や所持による利用許諾ではありません") &&
      gakumas.note.includes("配布不可と断定せず") && gakumas.note.includes("2026-10-14");

    const valorant = all.find(series => series.id === "valorant");
    const valThemes = valorant && valorant.playlists.find(pl => pl.id === "val-themes");
    const valAgents = valorant && valorant.playlists.find(pl => pl.id === "val-agent-themes");
    const genshin = all.find(series => series.id === "genshin");
    const arknights = all.find(series => series.id === "arknights");
    const xu = arknights && arknights.playlists.find(pl => pl.id === "ak-hen");
    const carnevale = arknights && arknights.playlists.find(pl => pl.id === "ak-ilcarnevale");
    const sam = all.find(series => series.id === "samfree");
    const oj = all.find(series => series.id === "oj");
    targetCatalogOk = gakumasDataOk &&
      !!valorant && valorant.url === "https://www.riotgames.com/en/riot-music-creator-safe-guidelines" &&
      !!valThemes && valThemes.songs.length === 6 && !!valAgents && valAgents.songs.length === 3 &&
      valorant.note.includes("二次利用許諾ではありません") && valorant.note.includes("Creator-Safe") &&
      !!genshin && genshin.playlists.length === 1 && genshin.playlists[0].songs.length === 12 &&
      genshin.playlists[0].songs.every(track => /^https:\/\/music\.apple\.com\/(?:us|jp)\/song\//.test(track.u)) &&
      genshin.note.includes("サブスク・購入は二次利用許諾ではありません") &&
      !!xu && xu.name === "アークナイツ — 墟" && xu.icon === "👹" && xu.songs.length === 7 &&
      !!carnevale && carnevale.songs.length === 6 &&
      arknights.playlists.every(pl => pl.songs.every(track => /^https:\/\/monster-siren\.hypergryph\.com\/music\/\d{6}$/.test(track.u))) &&
      !!sam && sam.playlists[0].songs.length === 10 &&
      sam.note.includes("個別の公式曲ページ・配布条件・二次利用許諾は未確認") &&
      !!oj && oj.playlists[0].songs.length === 15 &&
      oj.note.includes("個別公式曲ページや再利用許諾は未確認") &&
      [...sam.playlists, ...oj.playlists].every(pl => pl.songs.every(track => track.u === "https://fruitbatfactory.com/100orange/"));

    const wishHelperStart = library.indexOf("function trkWishFromTrack(");
    const wishHelperEnd = library.indexOf("\nfunction trkWishesFromCatalog", wishHelperStart);
    const sanitizeStart = library.indexOf("function plSanitize(raw) {");
    const sanitizeEnd = library.indexOf("\nconst TRK_PLAYLIST_ID", sanitizeStart);
    const matchLogic = plWishMatchSlice ? [matchLogicSrc] : null;
    if (gakumasDataOk && wishHelperStart >= 0 && wishHelperEnd > wishHelperStart &&
        sanitizeStart >= 0 && sanitizeEnd > sanitizeStart && matchLogic) {
      const aliasContext = vm.createContext({ PL_COLORS:{}, metaOf:() => null });
      new vm.Script(library.slice(wishHelperStart, wishHelperEnd) + "\n" +
        library.slice(sanitizeStart, sanitizeEnd) + "\n" + matchLogic[0] +
        "\nglobalThis.__trkWishFromTrack = trkWishFromTrack; globalThis.__plSanitize = plSanitize;" +
        " globalThis.__plWishMatch = plWishMatch; globalThis.__plSongMatchKeys = plSongMatchKeys;").runInContext(aliasContext);
      const projectedWish = aliasContext.__plSanitize({ id:"gakumas-alias-check", wish:[aliasContext.__trkWishFromTrack(searchRight)] }).wish[0];
      const downloadedFile = { key:"local-search-light", title:"SEARCH LIGHT.ogg", artist:"not 初星学園" };
      const byTitle = new Map();
      for (const key of aliasContext.__plSongMatchKeys(downloadedFile.title, "")) byTitle.set(key, [downloadedFile]);
      const unrelatedFile = { key:"unrelated", title:"unrelated.ogg", artist:"" };
      const unrelatedMap = new Map([["unrelated.ogg", [unrelatedFile]], ["unrelated", [unrelatedFile]]]);
      aliasBehaviorOk = projectedWish.t === "SEARCH RIGHT" &&
        JSON.stringify(projectedWish.matchAliases) === JSON.stringify(["SEARCH LIGHT"]) &&
        aliasContext.__plWishMatch(projectedWish, byTitle) === downloadedFile &&
        aliasContext.__plWishMatch(projectedWish, unrelatedMap) === null;

      const toWish = track => {
        const wish = { t:track.t, al:track.al || "", ar:track.ar || "", u:track.u || "" };
        if (Array.isArray(track.matchAliases) && track.matchAliases.length) wish.matchAliases = track.matchAliases.slice(0, 8);
        return wish;
      };
      const allGakumasWishes = gakumas.playlists.flatMap(pl => pl.songs.map(toWish));
      const owned = ["owned-gakumas-song"];
      const manualOwned = ["manual-gakumas-song"];
      const autoExisting = { id:"trk-gm-inst", cat:"trk:gakumas:gm-inst", name:"My renamed instruments", icon:"🎧", tags:["my-custom-tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:owned, guide:{note:"old guide", url:"https://example.com/old"} };
      const manuallyImported = { id:"manual-gm-inst", cat:"gakumas:gm-inst", name:"My manual list", icon:"🌟", tags:["manual"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:manualOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const renamedDefault = { id:"previous-gm-inst", cat:"trk:gakumas:gm-inst", name:"学マス インスト厳選 — キャラ別 Vol.1", icon:"🎛", tags:["old-tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:["owned-default-song"], guide:{note:"old guide", url:"https://example.com/old"} };
      const legacyOwned = ["legacy-gakumas-song"];
      const legacy = { id:"trk-gakumas-v1", cat:"trk:gakumas", name:"My legacy Gakumas", icon:"🌸", tags:["legacy-custom"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:legacyOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const testSettings = { playlists:[autoExisting, manuallyImported, renamedDefault, legacy] };
      let saveCount = 0;
      const runContext = vm.createContext({
        settings:testSettings,
        ensureTrkFolder:() => {},
        trkCatalog:() => [gakumas],
        plSanitize:raw => raw,
        saveUserPrefs:() => { saveCount++; },
        trkWishesForSeries:() => allGakumasWishes
      });
      new vm.Script(library.slice(wishHelperStart, wishHelperEnd) + "\n" +
        library.slice(library.indexOf("function trkCatalogGuide("), library.indexOf("\n(function plTighten()")) +
        "\nensureTrkDistributionPlaylists();").runInContext(runContext);
      const expectedInstrumentWish = instrumentLists[0].songs.map(toWish);
      const updatedImported = JSON.stringify(autoExisting.wish) === JSON.stringify(expectedInstrumentWish) &&
        JSON.stringify(manuallyImported.wish) === JSON.stringify(expectedInstrumentWish) &&
        autoExisting.guide.url === fixture.sourcePage && manuallyImported.guide.url === fixture.sourcePage &&
        autoExisting.guide.note.includes("ファン動画向け") && manuallyImported.guide.note.includes("ファン動画向け");
      const preservedUserData = autoExisting.name === "My renamed instruments" && autoExisting.icon === "🎧" &&
        JSON.stringify(autoExisting.tags) === JSON.stringify(["my-custom-tag"]) && autoExisting.songs === owned &&
        manuallyImported.name === "My manual list" && manuallyImported.icon === "🌟" &&
        JSON.stringify(manuallyImported.tags) === JSON.stringify(["manual"]) && manuallyImported.songs === manualOwned &&
        renamedDefault.name === instrumentLists[0].name && renamedDefault.icon === "🎛" &&
        JSON.stringify(renamedDefault.tags) === JSON.stringify(["old-tag"]) &&
        JSON.stringify(renamedDefault.songs) === JSON.stringify(["owned-default-song"]) &&
        legacy.name === "My legacy Gakumas" && legacy.icon === "🌸" &&
        JSON.stringify(legacy.tags) === JSON.stringify(["legacy-custom"]) && legacy.songs === legacyOwned;
      const legacyRefresh = JSON.stringify(legacy.wish) === JSON.stringify(allGakumasWishes) &&
        legacy.guide.url === fixture.sourcePage && legacy.guide.note.includes("ファン動画向け限定") &&
        legacy.guide.note.includes("Drive未掲載は配布不可の証明ではありません");
      const createsSeparatedLists = ["gm-inst2", "gm-releases"].every(id => {
        const created = testSettings.playlists.find(pl => pl.id === "trk-" + id);
        return !!created && created.folder === "trk-gakumas" && created.wish.length ===
          gakumas.playlists.find(pl => pl.id === id).songs.length && created.guide.url === fixture.sourcePage;
      });
      safeRefreshOk = updatedImported && preservedUserData && legacyRefresh && createsSeparatedLists && saveCount > 0;
    }
  } catch (error) {
    console.error(`WARN  targeted catalog test setup failed: ${error.message}`);
  }
  if (!targetCatalogOk) fail("VALORANT / Arknights / Genshin / OJ / Gakumas source, count, or rights-scope catalog checks failed");
  else if (!aliasBehaviorOk) fail("Gakumas SEARCH RIGHT must retain its official title and match the verified SEARCH LIGHT Drive filename after wish sanitization");
  else if (!safeRefreshOk) fail("Gakumas refresh must carry aliases, preserve owned/custom data, migrate legacy wishes, and keep instrumental/discography lists separate");
  else ok("VALORANT / Arknights / Genshin / OJ / Gakumas: official links, cautious rights notes, SEARCH RIGHT alias and safe list refresh");
}

// 🎒 Blue Archive OST Vol.1–8: official order, track-level Apple Music IDs,
// per-volume NexTone links, and a safe refresh of existing catalog playlists.
{
  const catalogSource = read("js/catalog.js");
  const library = read("js/library.js");
  const core = read("js/core.js");
  let catalogDataOk = false;
  let safeRefreshOk = false;
  let catalogGuideOk = false;
  try {
    const fixture = JSON.parse(read("tools/bluearchive-tracklist.json"));
    const catalogContext = vm.createContext({});
    new vm.Script(catalogSource + "\nglobalThis.__TRK_CATALOG_FOR_CHECK = TRK_CATALOG;").runInContext(catalogContext);
    const series = catalogContext.__TRK_CATALOG_FOR_CHECK.find(item => item.id === "bluearchive");
    const expectedAlbumIds = fixture.albums.map(album => album.id);
    const playlistOrderOk = !!series && JSON.stringify(series.playlists.map(pl => pl.id)) === JSON.stringify(expectedAlbumIds);
    let trackTotal = 0;
    let tracksMatch = playlistOrderOk;
    const appleIds = [];
    if (playlistOrderOk) for (let i = 0; i < fixture.albums.length; i++) {
      const expected = fixture.albums[i], actual = series.playlists[i];
      if (actual.sourceUrl !== expected.nexToneUrl || actual.sourceLabel !== "NexTone.Link" ||
          !/^https:\/\/nex-tone\.link\/A\d+$/.test(actual.sourceUrl || "") ||
          !/^https:\/\/music\.apple\.com\/jp\/album\/[^/]+\/\d+$/.test(expected.appleAlbumUrl || "")) tracksMatch = false;
      if (actual.songs.length !== expected.tracks.length) tracksMatch = false;
      for (let j = 0; j < expected.tracks.length; j++) {
        const [title, artist, appleId] = expected.tracks[j];
        const track = actual.songs[j];
        trackTotal++;
        appleIds.push(appleId);
        let validAppleUrl = false;
        try {
          const link = new URL(track.u);
          validAppleUrl = link.protocol === "https:" && link.hostname === "music.apple.com" &&
            /^\/jp\/song\/[^/]+\/\d+$/.test(link.pathname) && link.pathname.endsWith("/" + appleId);
        } catch (_) {}
        if (!track || track.t !== title || track.ar !== artist || track.al !== expected.album || !validAppleUrl) tracksMatch = false;
      }
    }
    catalogDataOk = playlistOrderOk && tracksMatch && trackTotal === 225 &&
      JSON.stringify(fixture.albums.map(album => album.tracks.length)) === JSON.stringify([39, 21, 26, 28, 27, 28, 28, 28]) &&
      new Set(appleIds).size === 225;

    const ensureStart = library.indexOf("function trkCatalogGuide(");
    const ensureEnd = library.indexOf("\n(function plTighten()", ensureStart);
    if (ensureStart >= 0 && ensureEnd > ensureStart) {
      const importedOwned = ["owned-bluearchive-track"];
      const autoOwned = ["custom-owned-track"];
      const autoExisting = { id:"trk-ba-v1", cat:"trk:bluearchive:ba-v1", name:"My renamed volume", icon:"🎧", tags:["my-custom-tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:autoOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const manuallyImported = { id:"pl-manual-ba-v1", cat:"bluearchive:ba-v1", name:"My other name", icon:"🌸", tags:["personal", "tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:importedOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const testSettings = { playlists:[autoExisting, manuallyImported] };
      let saveCount = 0;
      const runContext = vm.createContext({
        settings:testSettings,
        ensureTrkFolder:() => {},
        trkCatalog:() => [series],
        plSanitize:raw => raw,
        saveUserPrefs:() => { saveCount++; },
        trkWishesForSeries:() => []
      });
      new vm.Script(library.slice(library.indexOf("function trkWishFromTrack("), library.indexOf("\nfunction trkWishesFromCatalog")) + "\n" + library.slice(ensureStart, ensureEnd) + "\nensureTrkDistributionPlaylists();").runInContext(runContext);
      const expectedWish = fixture.albums[0].tracks.map(([t, ar, id], i) => {
        const track = series.playlists[0].songs[i];
        return { t, al:fixture.albums[0].album, ar, u:track.u };
      });
      const preservesCustomData = autoExisting.name === "My renamed volume" && autoExisting.icon === "🎧" &&
        JSON.stringify(autoExisting.tags) === JSON.stringify(["my-custom-tag"]) && autoExisting.songs === autoOwned &&
        manuallyImported.name === "My other name" && manuallyImported.icon === "🌸" &&
        JSON.stringify(manuallyImported.tags) === JSON.stringify(["personal", "tag"]) && manuallyImported.songs === importedOwned;
      const refreshesBothSources = JSON.stringify(autoExisting.wish) === JSON.stringify(expectedWish) &&
        JSON.stringify(manuallyImported.wish) === JSON.stringify(expectedWish) &&
        autoExisting.guide.url === fixture.albums[0].nexToneUrl && manuallyImported.guide.url === fixture.albums[0].nexToneUrl &&
        autoExisting.guide.note.includes("購入・サブスクは利用許諾ではありません") &&
        manuallyImported.guide.note.includes("購入・サブスクは利用許諾ではありません");
      const createsAllOtherVolumes = fixture.albums.slice(1).every(album => {
        const created = testSettings.playlists.find(p => p.id === "trk-" + album.id);
        return created && created.wish.length === album.tracks.length && created.guide.url === album.nexToneUrl;
      });
      safeRefreshOk = preservesCustomData && refreshesBothSources && createsAllOtherVolumes && saveCount > 0;
    }
    catalogGuideOk = /if \(pl\.sourceUrl\) \{[\s\S]*?plOpenLink\(pl\.sourceUrl\)/.test(library) &&
      library.includes("guide: trkCatalogGuide(s, pl)") && library.includes("guide: trkCatalogGuide(s, pl, true)") &&
      library.includes("songs: p.songs, wish: p.wish, guide: p.guide, cat: p.cat, by: p.by, createdAt: p.createdAt") &&
      !/catb\.hidden\s*=\s*true/.test(library) &&
      core.includes(".slice(0, 100)") && library.includes(".filter(Boolean).slice(0, 100)");
  } catch (error) {
    console.error(`WARN  Blue Archive catalog test setup failed: ${error.message}`);
  }
  if (!catalogDataOk) fail("Blue Archive OST fixture/catalog mismatch (expected 225 ordered tracks, artist + exact album, unique Apple Music song IDs, and eight NexTone links)");
  else if (!safeRefreshOk) fail("Blue Archive refresh must update wishes and per-volume guides while preserving owned songs and customized name/icon/tags");
  else if (!catalogGuideOk) fail("Blue Archive per-volume NexTone links must be reachable before import and from imported playlist guides; wishlist capacity must retain all volumes");
  else ok("Blue Archive OST Vol.1–8: 225 ordered Apple Music-linked tracks, NexTone per-volume guides, safe existing-playlist refresh");
}

// ⚔️ LoL Creator-Safe Sessions: complete SoundCloud album order/count and one official song URL per track.
{
  const catalogSource = read("js/catalog.js");
  const library = read("js/library.js");
  let catalogDataOk = false;
  let safeRefreshOk = false;
  try {
    const fixture = JSON.parse(read("tools/leagueoflegends-sessions-tracklist.json"));
    const catalogContext = vm.createContext({});
    new vm.Script(catalogSource + "\nglobalThis.__TRK_CATALOG_FOR_CHECK = TRK_CATALOG;").runInContext(catalogContext);
    const series = catalogContext.__TRK_CATALOG_FOR_CHECK.find(item => item.id === "lol");
    const expectedIds = fixture.albums.map(album => album.id);
    const sessionPlaylists = series ? series.playlists.filter(pl => expectedIds.includes(pl.id)) : [];
    const playlistOrderOk = !!series && JSON.stringify(sessionPlaylists.map(pl => pl.id)) === JSON.stringify(expectedIds);
    let trackTotal = 0;
    let tracksMatch = playlistOrderOk;
    const spotifyIds = [];
    if (playlistOrderOk) for (let i = 0; i < fixture.albums.length; i++) {
      const expected = fixture.albums[i], actual = series.playlists[i];
      const validSoundCloudAlbum = (actual.sourceUrl || "").startsWith("https://soundcloud.com/leagueoflegends/sets/");
      const validSpotifyAlbum = /^https:\/\/open\.spotify\.com\/album\/[A-Za-z0-9]{22}$/.test(expected.spotifyAlbumUrl || "");
      if (actual.name !== expected.name || actual.sourceUrl !== expected.soundcloudUrl || actual.sourceLabel !== "SoundCloud" ||
          !validSoundCloudAlbum || !validSpotifyAlbum || actual.songs.length !== expected.trackCount ||
          actual.songs.length !== expected.tracks.length) tracksMatch = false;
      for (let j = 0; j < expected.tracks.length; j++) {
        const [title, artist, spotifyId] = expected.tracks[j];
        const track = actual.songs[j];
        trackTotal++;
        spotifyIds.push(spotifyId);
        let validSpotifyUrl = false;
        try {
          const link = new URL(track.u);
          validSpotifyUrl = link.protocol === "https:" && link.hostname === "open.spotify.com" &&
            link.pathname === "/track/" + spotifyId && link.search === "";
        } catch (_) {}
        if (!/^[A-Za-z0-9]{22}$/.test(spotifyId) || !track || track.t !== title || track.ar !== artist ||
            track.al !== expected.name || !validSpotifyUrl) tracksMatch = false;
      }
    }
    catalogDataOk = playlistOrderOk && tracksMatch && trackTotal === 108 && new Set(spotifyIds).size === 108 &&
      JSON.stringify(fixture.albums.map(album => album.trackCount)) === JSON.stringify([36, 43, 29]) &&
      series.note.includes("これはLoL全楽曲ではなく") &&
      series.note.includes("二次利用許諾ではありません") &&
      series.url === "https://www.riotgames.com/en/riot-music-creator-safe-guidelines";

    const ensureStart = library.indexOf("function trkCatalogGuide(");
    const ensureEnd = library.indexOf("\n(function plTighten()", ensureStart);
    if (ensureStart >= 0 && ensureEnd > ensureStart) {
      const autoOwned = ["owned-lol-vi-track"];
      const manuallyOwned = ["manual-owned-lol-track"];
      const autoExisting = { id:"trk-lol-svi", cat:"trk:lol:lol-svi", name:"My renamed Vi playlist", icon:"🎧", tags:["my-custom-tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:autoOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const manuallyImported = { id:"pl-manual-lol-svi", cat:"lol:lol-svi", name:"Sessions: Vi 厳選", icon:"🥊", tags:["personal", "tag"],
        wish:[{t:"obsolete", al:"", ar:"", u:""}], songs:manuallyOwned, guide:{note:"old guide", url:"https://example.com/old"} };
      const testSettings = { playlists:[autoExisting, manuallyImported] };
      let saveCount = 0;
      const runContext = vm.createContext({
        settings:testSettings,
        ensureTrkFolder:() => {},
        trkCatalog:() => [series],
        plSanitize:raw => raw,
        saveUserPrefs:() => { saveCount++; },
        trkWishesForSeries:() => []
      });
      new vm.Script(library.slice(library.indexOf("function trkWishFromTrack("), library.indexOf("\nfunction trkWishesFromCatalog")) + "\n" + library.slice(ensureStart, ensureEnd) + "\nensureTrkDistributionPlaylists();").runInContext(runContext);
      const expectedWish = fixture.albums[0].tracks.map(([t, ar, spotifyId], i) => ({
        t, al:fixture.albums[0].name, ar, u:series.playlists[0].songs[i].u
      }));
      const preservesCustomData = autoExisting.name === "My renamed Vi playlist" && autoExisting.icon === "🎧" &&
        JSON.stringify(autoExisting.tags) === JSON.stringify(["my-custom-tag"]) && autoExisting.songs === autoOwned &&
        manuallyImported.name === "Sessions: Vi" && manuallyImported.icon === "🥊" &&
        JSON.stringify(manuallyImported.tags) === JSON.stringify(["personal", "tag"]) && manuallyImported.songs === manuallyOwned;
      const refreshesBothSources = JSON.stringify(autoExisting.wish) === JSON.stringify(expectedWish) &&
        JSON.stringify(manuallyImported.wish) === JSON.stringify(expectedWish) &&
        autoExisting.guide.url === fixture.albums[0].soundcloudUrl && manuallyImported.guide.url === fixture.albums[0].soundcloudUrl &&
        autoExisting.guide.note.includes("SoundCloud") && manuallyImported.guide.note.includes("SoundCloud") &&
        autoExisting.guide.note.includes("二次利用許諾ではありません") && manuallyImported.guide.note.includes("二次利用許諾ではありません");
      const createsOtherSessionsAlbums = fixture.albums.slice(1).every(album => {
        const created = testSettings.playlists.find(p => p.id === "trk-" + album.id);
        return created && created.folder === "trk-lol" && created.wish.length === album.trackCount &&
          created.guide.url === album.soundcloudUrl && created.guide.note.includes("SoundCloud");
      });
      safeRefreshOk = preservesCustomData && refreshesBothSources && createsOtherSessionsAlbums && saveCount > 0 &&
        library.includes('lol: "trk-lol"') && library.includes('ensureTrkSubfolder("trk-lol", "League of Legends", "⚔️")') &&
        library.includes('pl.sourceLabel || "公式リンク"');
    }
  } catch (error) {
    console.error(`WARN  League of Legends Sessions test setup failed: ${error.message}`);
  }
  if (!catalogDataOk) fail("LoL Sessions fixture/catalog mismatch (expected complete Vi/Diana/Taliyah albums: 36+43+29 tracks, official SoundCloud album links, ordered individual Spotify song links)");
  else if (!safeRefreshOk) fail("LoL Sessions imports must refresh song wishes/guides safely, preserve owned/custom data, and create all albums in the League of Legends trk folder");
  else ok("LoL Sessions: three complete official SoundCloud albums (108 ordered Spotify-linked tracks), safe catalog refresh");
}

// 🎵 LoL phase-one catalogue: verified individual theme / event releases stay split by type,
// use official destinations, state the intentionally incomplete scope, and never imply reuse rights.
{
  const catalogSource = read("js/catalog.js");
  const library = read("js/library.js");
  let catalogDataOk = false;
  let safeRefreshOk = false;
  try {
    const fixture = JSON.parse(read("tools/leagueoflegends-music-tracklist.json"));
    const catalogContext = vm.createContext({});
    new vm.Script(catalogSource + "\nglobalThis.__TRK_CATALOG_FOR_CHECK = TRK_CATALOG;").runInContext(catalogContext);
    const series = catalogContext.__TRK_CATALOG_FOR_CHECK.find(item => item.id === "lol");
    const sessions = JSON.parse(read("tools/leagueoflegends-sessions-tracklist.json"));
    const sessionIds = sessions.albums.map(album => album.id);
    const expectedLists = [fixture.championThemes, fixture.worldsAnthems, fixture.msiAnthems];
    const sessionOrderOk = !!series && JSON.stringify(series.playlists.slice(0, 3).map(pl => pl.id)) === JSON.stringify(sessionIds);
    const phaseOrderOk = !!series && JSON.stringify(series.playlists.slice(3, 6).map(pl => pl.id)) ===
      JSON.stringify(expectedLists.map(list => list.id));
    let trackTotal = 0;
    let tracksMatch = sessionOrderOk && phaseOrderOk;
    let announcedOnlyCount = 0;
    const allUrls = [];
    for (const expectedList of expectedLists) {
      const actual = series && series.playlists.find(pl => pl.id === expectedList.id);
      if (!actual || actual.name !== expectedList.name || actual.songs.length !== expectedList.tracks.length) {
        tracksMatch = false;
        continue;
      }
      for (let i = 0; i < expectedList.tracks.length; i++) {
        const expected = expectedList.tracks[i], track = actual.songs[i];
        trackTotal++;
        allUrls.push(track.u);
        let validOfficialUrl = false;
        try {
          const url = new URL(track.u);
          if (url.protocol === "https:" && url.hostname === "open.spotify.com") {
            validOfficialUrl = url.pathname.startsWith("/track/") && /^[A-Za-z0-9]{22}$/.test(url.pathname.slice(7)) && !url.search;
          } else if (url.protocol === "https:" && url.hostname === "www.youtube.com") {
            validOfficialUrl = url.pathname === "/watch" && /^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get("v") || "") &&
              [...url.searchParams.keys()].length === 1;
          } else if (url.protocol === "https:" && url.hostname === "soundcloud.com") {
            validOfficialUrl = url.pathname.startsWith("/leagueoflegends/") && !url.search;
          } else if (url.protocol === "https:" && url.hostname === "lolesports.com") {
            validOfficialUrl = track.u === fixture.sources.worlds2026Announcement;
          }
        } catch (_) {}
        if (expected.status === "announced-only") {
          announcedOnlyCount++;
          if (!track.al.includes("audio link pending") || track.u !== fixture.sources.worlds2026Announcement) tracksMatch = false;
        }
        if (track.t !== expected.title || track.al !== (expected.status === "announced-only"
            ? "Worlds 2026 Anthem — announced; official audio link pending" : expected.album) ||
            track.ar !== expected.artist || track.u !== expected.url || !validOfficialUrl) tracksMatch = false;
      }
    }
    const rightsAndScopeOk = !!series && series.url === fixture.sources.creatorSafeGuidelines &&
      series.note.includes("二次利用許諾ではありません") && series.note.includes("Creator-Safe対象") &&
      series.note.includes("これはLoL全楽曲ではなく") && series.note.includes("今後の調査対象");
    catalogDataOk = tracksMatch && trackTotal === 58 && announcedOnlyCount === 1 &&
      new Set(allUrls).size === allUrls.length && rightsAndScopeOk;

    const ensureStart = library.indexOf("function trkCatalogGuide(");
    const ensureEnd = library.indexOf("\n(function plTighten()", ensureStart);
    if (ensureStart >= 0 && ensureEnd > ensureStart) {
      const autoOwned = ["owned-lol-champion-theme"];
      const manualOwned = ["owned-lol-worlds-song"];
      const autoExisting = { id:"trk-lol-champion-themes", cat:"trk:lol:lol-champion-themes", name:"My Champion Themes",
        icon:"🎧", tags:["custom-theme-tag"], wish:[{t:"old", al:"", ar:"", u:""}], songs:autoOwned,
        guide:{note:"old guide", url:"https://example.com/old"} };
      const manualExisting = { id:"trk-lol-worlds-anthems", cat:"lol:lol-worlds-anthems", name:"My Worlds playlist",
        icon:"🌟", tags:["custom-worlds-tag"], wish:[{t:"old", al:"", ar:"", u:""}], songs:manualOwned,
        guide:{note:"old guide", url:"https://example.com/old"} };
      const testSettings = { playlists:[autoExisting, manualExisting] };
      let saveCount = 0;
      const runContext = vm.createContext({
        settings:testSettings,
        ensureTrkFolder:() => {},
        trkCatalog:() => [series],
        plSanitize:raw => raw,
        saveUserPrefs:() => { saveCount++; },
        trkWishesForSeries:() => []
      });
      new vm.Script(library.slice(library.indexOf("function trkWishFromTrack("), library.indexOf("\nfunction trkWishesFromCatalog")) + "\n" + library.slice(ensureStart, ensureEnd) + "\nensureTrkDistributionPlaylists();").runInContext(runContext);
      const expectWish = list => list.tracks.map(track => ({ t:track.title, al:track.status === "announced-only"
        ? "Worlds 2026 Anthem — announced; official audio link pending" : track.album, ar:track.artist, u:track.url }));
      const preservesCustom = autoExisting.name === "My Champion Themes" && autoExisting.icon === "🎧" &&
        JSON.stringify(autoExisting.tags) === JSON.stringify(["custom-theme-tag"]) && autoExisting.songs === autoOwned &&
        manualExisting.name === "My Worlds playlist" && manualExisting.icon === "🌟" &&
        JSON.stringify(manualExisting.tags) === JSON.stringify(["custom-worlds-tag"]) && manualExisting.songs === manualOwned;
      const refreshesWishAndGuide = JSON.stringify(autoExisting.wish) === JSON.stringify(expectWish(fixture.championThemes)) &&
        JSON.stringify(manualExisting.wish) === JSON.stringify(expectWish(fixture.worldsAnthems)) &&
        autoExisting.guide.url === fixture.sources.creatorSafeGuidelines && manualExisting.guide.url === fixture.sources.creatorSafeGuidelines &&
        autoExisting.guide.note.includes("二次利用許諾ではありません") && manualExisting.guide.note.includes("二次利用許諾ではありません");
      const createdMsi = testSettings.playlists.find(p => p.id === "trk-lol-msi-anthems");
      const createsMissingList = createdMsi && createdMsi.folder === "trk-lol" && createdMsi.wish.length === fixture.msiAnthems.tracks.length &&
        JSON.stringify(createdMsi.wish) === JSON.stringify(expectWish(fixture.msiAnthems)) &&
        createdMsi.guide.url === fixture.sources.creatorSafeGuidelines &&
        createdMsi.guide.note.includes("二次利用許諾ではありません");
      safeRefreshOk = preservesCustom && refreshesWishAndGuide && createsMissingList && saveCount > 0 &&
        library.includes('lol: "trk-lol"');
    }
  } catch (error) {
    console.error(`WARN  LoL phase-one catalogue test setup failed: ${error.message}`);
  }
  if (!catalogDataOk) fail("LoL phase-one fixture/catalog mismatch (expected 41 modern Champion Themes, 12 released Worlds + one announcement, four MSI anthems, official links and rights/scope notice)");
  else if (!safeRefreshOk) fail("LoL phase-one playlist refresh must update wishes/guides, preserve user-owned songs/customized fields, and create missing lists in trk-lol");
  else ok("LoL phase one: 41 modern Champion Themes + Worlds 2014–26 (2026 announcement only) + four MSI anthems; official-link fixture, rights notice, safe refresh");
}

// ⚠ el(tag, cls, text) は文字を1つしか入れられない（入れ子を渡すと "[object ...]" になる）。
// 引数4つ以上／第3引数がオブジェクト literal は取り違えなので、静的に止める。
{
  const bad = [];
  for (const ent of fs.readdirSync(path.join(root, "js"))) {
    if (!ent.endsWith(".js")) continue;
    const src = read("js/" + ent);
    for (const m of src.matchAll(/(?<![\w.])el\(/g)) {
      const start = m.index + m[0].length;
      let depth = 1, i = start;
      while (i < src.length && depth) {
        if (src[i] === "(") depth += 1;
        else if (src[i] === ")") depth -= 1;
        i += 1;
      }
      const inner = src.slice(start, i - 1);
      const parts = []; let d = 0, cur = "";
      for (const c of inner) {
        if ("([{".includes(c)) d += 1;
        else if (")]}".includes(c)) d -= 1;
        if (c === "," && d === 0) { parts.push(cur); cur = ""; } else cur += c;
      }
      parts.push(cur);
      const args = parts.map(p => p.trim());
      const line = src.slice(0, m.index).split("\n").length;
      if (args.length > 3) bad.push(`js/${ent}:${line} (el() に引数 ${args.length} 個)`);
      else if (args.length === 3 && args[2].startsWith("{")) bad.push(`js/${ent}:${line} (el() の文字にオブジェクト)`);
    }
  }
  if (bad.length) fail("el(tag, cls, text) misuse (children/objects passed as text): " + bad.join(", "));
  else ok("el(tag, cls, text) is only ever given one text node (no [object HTML…] rows)");
}

// 🐔 trk's playlist tab: fixed 🐔 icon + three label choices, no profile editing, long-press = hierarchy.
{
  const library = read("js/library.js");
  const core = read("js/core.js");
  const html = read("index.html");
  const i18n = library;
  /* 名前・アイコン・色は固定（保存データ側も読み込み時にそろえる）。フォルダ名に絵文字を戻すと 🐔🐔 になる */
  const fixedOk = library.includes('const TRK_FOLDER_NAME = "trk\'s playlist"') && library.includes("function trkFolderNormalize(") &&
    library.includes("if (f.name !== TRK_FOLDER_NAME) { f.name = TRK_FOLDER_NAME; ch = true; }") &&
    library.includes("trkFolderNormalize();   /* 旧データの") &&
    !/id: TRK_FOLDER_ID,\s*name: "🐔/.test(library);
  /* カタログは catalog.js の const。⚠ window.TRK_CATALOG は undefined で、Vol が1つも作られない */
  const catalogOk = library.includes("function trkCatalog(") &&
    library.includes("typeof TRK_CATALOG !== \"undefined\"") && !library.includes("window.TRK_CATALOG");
  /* 表示名の3種類（許可リストは core.js の TRK_ENUM_VALUES＝設定Importでも検証する） */
  const labelOk = library.includes("function trkTabLabel(") && library.includes("trkTabNameShort") && library.includes("trkTabNameFull") &&
    library.includes("f.id !== TRK_FOLDER_ID) tabs.push({ id:\"fld:\" + f.id") &&
    library.includes("if (!tabs.some(x => x.id === \"fld:\" + TRK_FOLDER_ID)) tabs.push({ id:\"fld:\" + TRK_FOLDER_ID, icon: TRK_TAB_ICON, label: trkTabLabel()") &&
    /* 🐔 タブを OFF にしたらタブは消える。ただし 🎻 classic が生きていれば、そのタブだけは出す（行き止まりにしない） */
    library.includes("if (trkFolder && settings.trkPlaylist !== false)") &&
    core.includes('trkTabName: ["full", "short", "icon"]') && core.includes('trkTabName: pick(prefs.trkTabName') &&
    core.includes('settings.trkTabName = "full"') && core.includes('"liteMode", "liteFps", "liteMascot", "liteScale", "liteLibRows", "trkTabName"');
  /* 長押し＝階層。プロフィール編集（plMenu／plFolderMenu）へは行かせない */
  const pressOk = library.includes("if (t.trk) plTrkMenu(); else if (t.pl) plMenu(t.pl); else if (t.fld) plFolderMenu(t.fld); else plGlobalMenu();") &&
    library.includes("if (f && f.id === TRK_FOLDER_ID) { plTrkMenu(); return; }") && library.includes("function plTrkMenu(");
  /* 設定欄：3種類の選択と、🎻 trk classic の収納（trkPanel の中の subPanel） */
  const panelOk = html.includes('id="trkTabNameSel"') && html.includes('<option value="short" data-i18n="trkTabNameShort">') &&
    html.includes('<option value="icon" data-i18n="trkTabNameIcon">') &&
    /<details class="panel" id="trkPanel">[\s\S]*<details class="subPanel" id="trkClassicPanel">[\s\S]*?<\/details>\s*<\/details>/.test(html) &&
    html.includes('id="trkSortAbcChk"') && html.includes('id="trkOrderList"') &&
    html.includes('id="trkMusicFolderBtn"') && html.includes('data-i18n="trkMusicFolderHint"') &&
    library.includes('trkMusicFolderBtn.addEventListener("click", openFolder)');
  const keys = ["trkTabNameLabel", "trkTabNameFull", "trkTabNameShort", "trkTabNameIcon", "trkTabNameNote",
    "trkMusicFolderHint", "trkMusicFolderBtn", "trkMenuTitle", "trkMenuHint", "trkMenuOpenFolder", "trkOpenItem", "trkMoveUp", "trkMoveDown", "trkOrderEmpty", "trkOrderAbcOff"];
  const langOk = keys.every(k => (i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length === 4);
  if (!fixedOk) fail("trk's playlist name/icon/colour are not pinned (a 🐔 name brings back the double 🐔 tab)");
  else if (!catalogOk) fail("trk wish lists read window.TRK_CATALOG, which is always undefined — the Vol tabs are never created");
  else if (!labelOk) fail("the trk tab label (full / short / icon) or its allowlist is not wired");
  else if (!pressOk) fail("long-press on the trk tab must open the hierarchy, not the profile editor");
  else if (!panelOk) fail("the trk settings panel is missing the label select, read-only Music/trk folder guide, or nested trk classic panel");
  else if (!langOk) fail("trk tab/menu strings are missing from one of the four languages");
  else ok("🐔 trk's playlist: fixed name/icon, three labels, read-only Music/trk folder guide, long-press hierarchy, trk classic nested in settings");
}

// 👥 Author tools for shared playlists (off by default; search/block/favorite).
if (!read("js/library.js").includes("plAuthorMenu") ||
    !read("js/library.js").includes("plVisible") ||
    !read("js/core.js").includes("plAuthorTools") ||
    !read("js/library.js").includes('author: String(settings.plAuthorName')) {
  fail("shared-playlist author tools are missing");
} else {
  ok("author tools (search / block / favorites, default off) are wired");
}

// ⏯🔊 Song banner: tap-to-pause (default off) + short-tap slider / long-press mute.
{
  const library = read("js/library.js");
  const i18n = read("js/i18n.js");
  const longPressOk = library.includes('bannerVolBtn.addEventListener("pointerdown"') &&
    library.includes("}, 650);") && library.includes("bannerVolLongPressAction()") &&
    library.includes("setBannerMusicVolume(0)") && library.includes("bannerVolRestore") &&
    library.includes("rememberMusicVolume(bannerVolRestore)") && library.includes("bannerVolLongPressed") &&
    library.includes('bannerVolPanel.hidden = !bannerVolPanel.hidden') &&
    read("js/core.js").includes("musicVolumeRestore") && read("js/core.js").includes("out.musicVolumeRestore") &&
    read("js/main.js").includes("rememberMusicVolume(settings.musicVolume)");
  const tipCount = (i18n.match(/bannerVolTip:/g) || []).length;
  if (!library.includes("bannerPauseAction") || !library.includes("bannerVolSlider") ||
      !longPressOk || tipCount !== 4 || !read("index.html").includes('id="bannerPause"') ||
      !read("js/core.js").includes("bannerPause")) {
    fail("song-banner tap-pause / short-tap slider / long-press mute-and-restore wiring is incomplete");
  } else {
    ok("song-banner tap-pause, short-tap slider, and four-language long-press mute/restore are wired");
  }
}

// ◀🎲▶ Song banner: the song controls ([◀][🎲][▶]) sit together at the right edge
// so the left ◀ no longer covers the song title. 🎲 is long-press by default
// (mis-tap safety) with an on/off switch and a tap-only option for people who
// like random, and a short tap only shows a hint.
{
  const library = read("js/library.js");
  const html = read("index.html");
  const css = read("css/style.css");
  const core = read("js/core.js");
  const i18n = read("js/i18n.js");
  const layoutOk = library.includes('const bannerSongBar = el("div", "bannerSongBar")') &&
    library.includes("bannerSongBar.append(bannerPrevBtn, bannerRandomBtn, bannerNextBtn)") &&
    !library.includes("bannerPrevBtn.style.left") &&
    css.includes(".bannerSongBar{position:absolute;top:50%;right:10px") &&
    css.includes(".banner.hasSongBtns .bannerText{padding-right:") &&
    library.includes('classList.toggle("hasSongBtns", on)');
  const randomOk = library.includes("function randomSongPick()") &&
    library.includes("function bannerSongRandom()") && library.includes("bannerRandomTapMode") &&
    library.includes("bannerRandLongPressed") && library.includes("}, 650);") &&
    library.includes('plToast(tr("bannerRandomHold"))') &&
    core.includes("bannerRandomBtn: prefs.bannerRandomBtn !== false") &&
    core.includes("bannerRandomTap: prefs.bannerRandomTap === true") &&
    core.includes("settings.bannerRandomBtn = true; settings.bannerRandomTap = false;");
  const uiOk = html.includes('id="bannerRandomBtn"') && html.includes('id="bannerRandomTap"') &&
    ["bannerRandomBtn", "bannerRandomTap", "bannerRandomHoldTip", "bannerRandomTapTip", "bannerRandomHold"]
      .every(key => (i18n.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  if (!layoutOk) fail("banner song controls should sit together at the right edge so they do not cover the song title");
  else if (!randomOk) fail("banner random button (default long press / tap-only option / on-off) is incomplete");
  else if (!uiOk) fail("banner random button UI (checkboxes + four-language strings) is incomplete");
  else ok("banner ◀🎲▶ controls sit at the right edge; 🎲 is long-press by default with on/off and tap-only options");
}

// 🩷 MMD: defaults, grouped 60-motion chooser, facial morphs and original procedural VMD.
{
  const mmd = read("js/mmd.js");
  const core = read("js/core.js");
  const preset = JSON.parse(read("assets/mmd/lat-miku/preset.json"));
  const labelKeys = [
    "mmdMotionWalk", "mmdMotionRun", "mmdMotionSit", "mmdMotionDance", "mmdMotionLegacy",
    "mmdGroupDaily", "mmdGroupDance", "mmdGroupSongs", "mmdGroupMiku", "mmdGroupFaces", "mmdGroupVoice",
    "mmdMotionFaceSmile", "mmdMotionFaceWink", "mmdMotionFaceShy", "mmdMotionFaceAngry", "mmdMotionFaceConfused",
    "mmdMotionFaceSurprise", "mmdMotionFaceSleepy", "mmdMotionFacePout", "mmdMotionFaceLaugh", "mmdMotionFaceSing",
    "mmdMotionPrincess", "mmdMotionLeekShake", "mmdMotionPopipo", "mmdMotionTriple", "mmdMotionNyan", "mmdMotionSalute",
    "mmdMotionDoubleHeart", "mmdMotionPoint", "mmdMotionEncore", "mmdMotionDramatic", "mmdMotionVictory", "mmdMotionPenlight",
    "mmdMotionChibi", "mmdMotionSpin", "mmdMotionGroove", "mmdMotionStepTouch", "mmdMotionShoulderPop", "mmdMotionArmWave",
    "mmdMotionCrossStep", "mmdMotionSoftBow", "mmdMotionMarionette",
    "mmdMotionSongMic", "mmdMotionSongLong", "mmdMotionSongUp", "mmdMotionSongHum", "mmdMotionSongWhisper", "mmdMotionSongCall"
  ];
  const labelsOk = labelKeys.every(key => (mmd.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  const defaultOk = preset.motion === "faceSing" && preset.bpm === 0 &&
    core.includes('prefs.mmdMotionKind : "faceSing"') && core.includes('settings.mmdMotionKind = "faceSing"');
  const chooserOk = mmd.includes('const MOTION_GROUPS = [') && mmd.includes('const MOTION_MENU_IDS = MOTION_GROUPS.flatMap(group => group.ids)') &&
    mmd.includes("const MOTION_MENU_SET = new Set(MOTION_MENU_IDS)") && mmd.includes('visibleMotions: () => MOTION_MENU_IDS.slice()') &&
    mmd.includes('motionGroups: () => MOTION_GROUPS.map') && mmd.includes("for (const group of MOTION_GROUPS)") &&
    mmd.includes("if (BUILTIN[keep] && !MOTION_MENU_SET.has(keep))");
  const motionOk = ["walk112", "run152", "sit10", "dance128", "dreamy128", "melt170", "wedh174", "faceSmile", "faceSing", "songMic", "songCall", "mikuPrincess152", "mikuLeek120"]
    .every(id => mmd.includes(`${id}: {`) || mmd.includes(`${id}: makeGesture(`));
  const morphOk = mmd.includes("const FACE_MORPHS = [") && mmd.includes("dv.setUint32(at, morphCount, true)") &&
    mmd.includes('buildVmd(frames, "trk-builtin-" + id, morphFrames)');
  const docsOk = readReadme().includes("内蔵モーション65種") &&
    read("docs/HANDOFF.md").includes("65種をすべて選択可能") &&
    read("docs/HANDOFF.md").includes("🎤 歌・口パクの6グループ") &&
    read("NOTICE.md").includes("third-party VMD or choreography file is bundled");
  if (!labelsOk || !defaultOk || !chooserOk || !motionOk || !morphOk || !docsOk) {
    fail("MMD defaults, grouped 65-motion chooser, facial morph tracks, original VMD definitions, or rights note is missing");
  } else {
    ok("MMD 65-motion chooser, Lat morph tracks, four-language labels and faceSing default are wired");
  }
}

// 🕹️ Short play mode (last 90/120/180s, silence-aware end, separate records).
if (!read("js/game.js").includes("shortLenActive") ||
    !read("js/game.js").includes("shortSilenceWatch") ||
    !read("js/game.js").includes("c.short") ||
    !read("index.html").includes('id="shortMode"') ||
    !read("js/core.js").includes("shortMode")) {
  fail("short play mode (last 90/120/180s) is missing");
} else {
  ok("short play mode (last 90/120/180s, silence-aware) is wired");
}

// 🥚 Tutorial easter eggs (skip / cheat / god mode in the Seed field).
if (!read("js/main.js").includes("guideEggKind") ||
    !read("js/main.js").includes("GUIDE_EGGS") ||
    !read("css/style.css").includes("eggSkipK") ||
    !read("css/style.css").includes("eggCheatK") ||
    !read("css/style.css").includes("eggGodK")) {
  fail("tutorial easter eggs (skip/cheat/god mode) are missing");
} else {
  ok("tutorial easter eggs (skip / cheat / god mode) are wired");
}

// 🎓 Optional First Spark tutorial audio: lazy-loaded from same origin, removable as one folder.
{
  const html = read("index.html"), library = read("js/library.js"), main = read("js/main.js");
  const i18n = read("js/i18n.js"), notice = read("NOTICE.md"), ignore = read(".gitignore"), readme = readReadme();
  const demoDir = path.join(root, "assets/optional-demo-audio");
  const audio = path.join(demoDir, "first-spark-tutorial.mp3"), manifestFile = path.join(demoDir, "manifest.json");
  let optionalFolderOk = !fs.existsSync(demoDir);
  if (fs.existsSync(demoDir)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
      const size = fs.statSync(audio).size;
      optionalFolderOk = fs.existsSync(path.join(demoDir, "README.md")) && size > 0 && size <= 2 * 1024 * 1024 &&
        manifest.version === 1 && manifest.enabled === true && manifest.file === "first-spark-tutorial.mp3";
    } catch { optionalFolderOk = false; }
  }
  const keys = ["guideDemoBtn", "guideDemoLoading", "guideDemoReady", "guideDemoUnavailable", "demoSongUnavailable"];
  const wired = optionalFolderOk && html.includes('id="guideDemoBtn"') && html.includes('id="guideDemoBtn" class="guideDemoBtn" type="button" data-i18n="guideDemoBtn" hidden') &&
    main.includes("TrkSelectTutorialSong") && library.includes('source:"builtin"') &&
    library.includes('const FIRST_SPARK_MANIFEST = "./assets/optional-demo-audio/manifest.json";') &&
    library.includes('const FIRST_SPARK_ASSET = "./assets/optional-demo-audio/first-spark-tutorial.mp3";') &&
    library.includes("void initOptionalTutorialDemo()") && library.includes('id === "builtin"') &&
    notice.includes("assets/optional-demo-audio/first-spark-tutorial.mp3") &&
    ignore.includes("!assets/optional-demo-audio/first-spark-tutorial.mp3") &&
    readme.includes("フォルダー全体を削除") && readme.includes("Press **Skip**") &&
    keys.every(k => i18n.split(`${k}:`).length - 1 === 4);
  if (!wired) fail("the optional First Spark demo folder, lazy-load/hide path, tutorial controls, rights note, or four-language labels are missing");
  else ok("First Spark: optional 30-second demo folder is lazy-loaded and can be removed without affecting the media player");
}

// 🎼 First Spark handmade demo charts: easy / normal / hard ship as authored JSON, master stays generated.
{
  const library = read("js/library.js"), core = read("js/core.js"), i18n = read("js/i18n.js");
  const demoDir = path.join(root, "assets/optional-demo-audio");
  const bundled = fs.existsSync(demoDir);   // a lightweight build deletes the whole folder
  const demoReadme = fs.existsSync(path.join(demoDir, "README.md")) ? read("assets/optional-demo-audio/README.md").replace(/\r/g, "") : "";
  const wired =
    library.includes('const FIRST_SPARK_CHART_DIR = "./assets/optional-demo-audio/";') &&
    library.includes('const FIRST_SPARK_CHART_DIFFS = ["easy", "normal", "hard"];') &&
    library.includes("async function firstSparkChartData(diff)") &&
    library.includes('if (response.status === 404) { firstSparkChartCache.set(diff, null); return null; }') &&
    library.includes('applyChartData(data, "custom", "importStatus", false)') &&
    library.includes('s.source === "builtin" && s.key === FIRST_SPARK_KEY && firstSparkChartMap[d]') &&
    library.includes("manifest.charts === false") &&
    core.includes('chartMode === "custom" ? "chartCustom"') &&
    (!bundled || demoReadme.includes("first-spark-tutorial.easy.json")) &&
    ["chartCustom", "builtinChartLoaded"].every(k => i18n.split(`${k}:`).length - 1 === 4);
  if (!wired) fail("First Spark demo charts: lazy fetch, 404 fallback to the generated chart, custom chart mode, folder README or four-language labels are missing");
  else ok("First Spark demo charts are lazy-loaded per difficulty and fall back to the generated chart when absent");

  if (bundled) {
    try {
      const mod = await import("./make-first-spark-charts.mjs");
      const { buildCharts, CHART_DIFFS: diffs, chartFileName, BPM: bpm, BARS: bars } = mod;
      const authored = buildCharts();
      const step = 60000 / bpm / 4, songMs = bars * 4 * 60000 / bpm;
      const counts = {};
      let bad = 0;
      for (const diff of diffs) {
        const file = path.join(demoDir, chartFileName(diff));
        let stored = null;
        try { stored = JSON.parse(fs.readFileSync(file, "utf8")); } catch { bad++; fail(`First Spark chart ${chartFileName(diff)} is missing or not valid JSON`); continue; }
        const notes = Array.isArray(stored.notes) ? stored.notes : [];
        counts[diff] = notes.length;
        const onGrid = notes.every(([t, lane]) => Number.isInteger(t) && t >= 0 && lane >= 0 && lane <= 1 &&
          Math.abs(t - Math.round(t / step) * step) <= 1 && t < songMs);
        const firstHalf = notes.filter(([t]) => t < songMs / 2).length;
        const lanes = new Set(notes.map(n => n[1]));
        if (stored.format !== "shadow-taiko-chart" || stored.difficulty !== diff || stored.bpm !== bpm || Number(stored.offset) !== 0) { bad++; fail(`First Spark chart ${chartFileName(diff)} has the wrong format/bpm/offset fields`); }
        else if (JSON.stringify(stored) !== JSON.stringify(authored[diff])) { bad++; fail(`First Spark chart ${chartFileName(diff)} drifted from tools/make-first-spark-charts.mjs`); }
        else if (!notes.length || !onGrid) { bad++; fail(`First Spark chart ${chartFileName(diff)} has notes off the ${bpm} BPM grid or outside the song`); }
        else if (firstHalf < notes.length * 0.3) { bad++; fail(`First Spark chart ${chartFileName(diff)} packs most notes into the second half (${firstHalf}/${notes.length} before the middle)`); }
        else if (lanes.size < 2 || notes[notes.length - 1][1] !== 0) { bad++; fail(`First Spark chart ${chartFileName(diff)} needs both don and ka, ending on don`); }
        else if (fs.statSync(file).size > 64 * 1024) { bad++; fail(`First Spark chart ${chartFileName(diff)} is bigger than 64 KiB`); }
      }
      if (!bad && !(counts.easy < counts.normal && counts.normal < counts.hard)) fail(`First Spark charts should rise in notes: easy ${counts.easy} < normal ${counts.normal} < hard ${counts.hard}`);
      else if (!bad) ok(`First Spark handmade charts match the generator (easy ${counts.easy} / normal ${counts.normal} / hard ${counts.hard} notes on the 128 BPM grid)`);
      for (const extra of ["master", "rush"]) {
        if (fs.existsSync(path.join(demoDir, `first-spark-tutorial.${extra}.json`))) fail(`First Spark bundled a ${extra} chart - ${extra} must stay generated from the seed`);
      }
    } catch (error) {
      fail(`First Spark chart check could not run: ${error.message}`);
    }
  }
}

// 📊 Spectrum expansion (30 styles / 16 themes) + banner song buttons.
{
  const spec = read("js/spectrum.js");
  const blockCount = (head, tag) => {
    const a = spec.indexOf(head);
    if (a < 0) return 0;
    const b = spec.indexOf("};", a);
    return (spec.slice(a, b).match(new RegExp(':"' + tag, "g")) || []).length;
  };
  const styleCount = blockCount("const STYLE_KEYS", "specStyle");
  const themeCount = blockCount("const THEME_KEYS", "specTheme");
  if (styleCount < 30 || themeCount < 16 ||
      !spec.includes("drawDotgrid") || !spec.includes("drawMatrix") || !spec.includes("drawLightning") ||
      !spec.includes("drawFireworks") || !spec.includes('theme === "synth"') ||
      !spec.includes('onLongPress(zipBtn') ||
      !read("js/library.js").includes("bannerSongStep") ||
      !read("index.html").includes('id="bannerSongBtns"')) {
    fail("spectrum expansion (30 styles / 16 themes) or banner song buttons are missing");
  } else {
    ok(`spectrum has ${styleCount} style labels / ${themeCount} theme labels, long-press settings, banner song buttons`);
  }
}

// 📡 Background antenna placement: dock / top-right corner (left of Language).
// Hiding the dock antenna must not kill background playback, and hiding the
// cast antenna must never hide the playback antenna.
{
  const fx = read("js/fx-dock.js");
  if (!fx.includes("bgAntennaView") || !fx.includes('["off", "antenna", "corner"]') ||
      !fx.includes('cornerAnt.addEventListener("click", () => toggleAntenna())') ||
      !fx.includes("headTools.prepend(cornerAnt)") ||
      !fx.includes('dockBackgroundCorner:"') ||
      !read("js/media-player-mode.js").includes('dockBackgroundCorner:"') ||
      !read("js/core.js").includes('["off", "antenna", "corner"]') ||
      !read("css/style.css").includes(".cornerAnt")) {
    fail("background antenna corner option (top-right, left of Language) is missing");
  } else {
    ok("background antenna can sit in the top-right corner; cast hide never hides the playback antenna");
  }
}

// 🎭 Antenna character skins: original dot characters (ON = awake / OFF = asleep)
// plus a custom two-image option. The Touhou fan-work credit must stay in NOTICE.
{
  const fx = read("js/fx-dock.js");
  const chars = ["truck", "robot", "cat", "slime", "ghost", "reimu", "marisa", "cirno", "flandre", "youmu"];
  const hasAll = chars.every(c => fx.includes(`"${c}", "dockAntChar${c[0].toUpperCase() + c.slice(1)}"`));
  if (!fx.includes("const ANT_CHARS") || !fx.includes("function antCharFrame") ||
      !fx.includes("function drawAntCharMatrix") || !fx.includes("function antCustomOk") ||
      !fx.includes("antCustomRow") || !hasAll || !fx.includes("antTouhou") ||
      !fx.includes('["rod", "loop", "dish", "beam", "truck", "robot", "cat", "slime", "ghost", "reimu", "marisa", "cirno", "flandre", "youmu", "custom"]') ||
      !read("js/core.js").includes('settings.fxAntennaShape = "rod";') ||
      !read("css/style.css").includes(".antChar") ||
      !read("NOTICE.md").includes("Touhou Project fan work") ||
      !read("NOTICE.md").includes("touhou-project.news/guideline/")) {
    fail("antenna character skins (ON=awake / OFF=asleep + custom 2 images) are missing");
  } else {
    ok("antenna character skins (10 dot characters incl. 5 Touhou fan works + custom 2-image ON/OFF) are wired, Touhou credit in NOTICE");
  }
}

// The FX API is intentionally frozen. A strict-mode mutation here aborts the
// remainder of main.js and leaves every primary selection-screen control inert.
{
  const main = read("js/main.js");
  const requiredWiring = [
    '$("language").addEventListener("change"',
    '$("mediaFile").addEventListener("change"',
    '$("openSettingsBtn").addEventListener("click"',
    '$("modePicker").addEventListener("click"'
  ];
  if (requiredWiring.some(fragment => !main.includes(fragment)) ||
      /window\.TrkFX\s*\[[^\]]+\]\s*=/.test(main) ||
      !main.includes('target.closest("#fxPanel .fxGrid .fxSeg button")')) {
    fail("selection-screen startup wiring or immutable TrkFX integration is broken");
  } else {
    ok("language / settings / play-mode / media-file handlers stay wired; frozen TrkFX is not mutated");
  }
}

// 🖥 Full-screen video: the TV dock key right of "next song" and the media
// player button right of "reverse" (wallpaper shifts one step to the right).
{
  const videoMax = read("js/video-max.js");
  const tv = read("js/tv-dock.js");
  const media = read("js/media-player-mode.js");
  if (!videoMax.includes("window.TrkVideoMax = Object.freeze(") || !videoMax.includes("function toggleMax()") ||
      !read("index.html").includes('<script src="js/video-max.js"></script>') ||
      !read("css/style.css").includes("#videoMaxView")) {
    fail("full-screen video viewer (js/video-max.js) is not wired");
  } else if (!tv.includes('btn("tvKey tvPause tvMax"') || !tv.includes("window.TrkVideoMax.toggle()") ||
             !tv.includes('tvVideoMax:"') || !/top\.append\(pow, prevSongBtn, lcd, nextSongBtn, pauseBtn\)/.test(tv)) {
    fail("TV dock video-maximize key (right of the next-song key) is missing");
  } else if (!media.includes("maxNode = makeButton(\"mediaVideoMax\"") ||
             !media.includes("controls.append(prev, playNode, next, reverseNode, maxNode, wallNode, restart)") ||
             !media.includes('mediaVideoMax:"')) {
    fail("media player full-screen button (right of reverse, wallpaper shifted right) is missing");
  } else {
    ok("full-screen video viewer is wired (TV dock ⛶ + media player, wallpaper stays one step right)");
  }
}

// 🌀 Lane sway: on by default for TRUCK and ORBIT only, each with its own
// "don't sway" option, plus the ❓ mystery switch that outranks both.
{
  const truck = read("js/truck.js");
  const modes = read("js/modes.js");
  const options = read("js/i18n-options.js");
  const main = read("js/main.js");
  const html = read("index.html");
  const swayOk = truck.includes("function swayModeOn(mode)") &&
    truck.includes('if (settings.swayAllModes) return true;') &&
    truck.includes('if (m === "truck") return settings.swayTruck !== false;') &&
    truck.includes('if (m === "orbit") return settings.swayOrbit !== false;') &&
    truck.includes("if (reduceMotion.matches || !swayModeOn()) return 0;") &&
    truck.includes('settings.swayTruck = prefs.swayTruck !== false;') &&
    truck.includes('settings.swayOrbit = prefs.swayOrbit !== false;') &&
    truck.includes("settings.swayAllModes = prefs.swayAllModes === true;");
  const uiOk = html.includes('id="swayTruck"') && html.includes('id="swayAllModes"') &&
    modes.includes('makeCheck("swayOrbit", "swayOrbit", "swayOrbit")') &&
    main.includes('["swayAllModes", "swayAllModes"]') &&
    ["ja", "en", "zh", "ko"].every(l => options.includes(`swayAllModes:"`)) &&
    (options.match(/swayAllModes:"/g) || []).length >= 4;
  if (!swayOk) fail("lane sway gating (TRUCK / ORBIT by default, mystery override) is broken");
  else if (!uiOk) fail("lane sway options (TRUCK / ORBIT checkboxes + ❓ mystery switch) are missing");
  else ok("lane sway defaults to TRUCK / ORBIT with per-mode off switches; ❓ mystery switch overrides all modes");
}

// ✨ Frame interpolation (js/frame-interp.js): opt-in motion-compensated
// interpolation for the media player and the full-screen viewer. WebGL2 only,
// fully offline, and the settings must sit directly above the A-B loop box.
{
  const fi = read("js/frame-interp.js");
  const player = read("js/media-player-mode.js");
  const core = read("js/core.js");
  const html = read("index.html");
  const max = read("js/video-max.js");
  const settingsOk =
    core.includes('frameInterp: pick(prefs.frameInterp, ["off", "blend", "flow"], "off")') &&
    core.includes("frameInterpStrength: num(prefs.frameInterpStrength, 0, 1, .85)") &&
    fi.includes('const MODES = ["off", "blend", "flow"];') &&
    fi.includes("const FLOW_LAMBDA = 0.010;") &&
    fi.includes("const FLOW_RANGE = 64;") &&
    fi.includes("settings.frameInterp = next;") && fi.includes("saveUserPrefs();");
  const glOk =
    fi.includes('getContext("webgl2"') &&
    fi.includes('getExtension("EXT_color_buffer_float")') &&
    fi.includes("gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])") &&
    fi.includes("gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)") &&
    fi.includes("requestVideoFrameCallback") &&
    fi.includes("float costF(") && fi.includes("float costB(");
  const offlineOk = !fi.includes("fetch(") && !fi.includes("import ") && !fi.includes("Worker(");
  const uiOk = html.includes('<script src="js/frame-interp.js"></script>') &&
    player.includes("const FI = window.TrkFrameInterp;") &&
    player.includes("dialog.append(header, display, stageWrap, controls, progressRow, interpBox, loopBox, options, queuePanel, footer)") &&
    player.includes('FI.attach("media", stageCanvas)') && player.includes('FI.detach("media")') &&
    max.includes('window.TrkFrameInterp.attach("max", canvas)') && max.includes('window.TrkFrameInterp.detach("max")');
  const langOk = (fi.match(/mediaInterpTitle:/g) || []).length === 4 &&
    (fi.match(/mediaInterpHint:/g) || []).length === 4 &&
    (fi.match(/mediaInterpFlow:/g) || []).length === 4 &&
    (fi.match(/mediaInterpBlocked:/g) || []).length === 4;
  if (!settingsOk) fail("frame interpolation settings / flow constants are missing");
  else if (!glOk) fail("frame interpolation must run on WebGL2 (MRT flow passes, video frame callbacks)");
  else if (!offlineOk) fail("frame interpolation must stay offline (no fetch, imports or workers)");
  else if (!uiOk) fail("frame interpolation must be wired into the media player above the A-B loop box");
  else if (!langOk) fail("frame interpolation strings are missing from one of the four languages");
  else ok("frame interpolation is opt-in, WebGL2-only, offline, above the A-B loop box, in four languages");
}

// 🪶 Lite mode for phones / tablets / apps (js/lite.js): the settings panel in
// the bottom-right of ⚙ settings, the auto probe, and the draw-only gates. The
// important contract is that judging and the clock stay OUTSIDE the gate.
{
  const lite = read("js/lite.js");
  const html = read("index.html");
  const core = read("js/core.js");
  const css = read("css/style.css");
  const i18n = read("js/i18n.js");
  const render = read("js/render.js");
  const spectrum = read("js/spectrum.js");
  const mmd = read("js/mmd.js");
  const vrm = read("js/vrm.js");
  const media = read("js/media-player-mode.js");
  const tv = read("js/tv-dock.js");
  const songMedia = read("js/media.js"), fxDock = read("js/fx-dock.js"), library = read("js/library.js");
  const ids = ["litePanel", "liteMode", "liteFps", "liteMascot", "liteScale", "liteSpecOff", "liteFx", "liteBlur", "liteState", "liteDevice", "liteRecheckBtn", "litePreset", "liteGameFull",
    "liteDecor", "liteLibRows", "liteNoAnalyze", "liteMascotNoLoad"];
  const settingsKeys = ["liteMode", "liteFps", "liteMascot", "liteScale", "liteSpectrumOff", "liteFx", "liteBlur", "liteGameFull",
    "liteDecor", "liteLibRows", "liteNoAnalyze", "liteMascotNoLoad"];
  const wiringOk = ["window.TrkLite = Object.freeze({", "function liteActive()", "function liteProbe()", "liteBatteryProbe",
    "navigator.connection", "deviceMemory", "liteGate(", "function litePixelRatio(", "liteBlurCap", "liteSpecBlocked",
    "liteMascotAllow", "classList.toggle(\"trkLite\"", "classList.toggle(\"trkLiteFx\"", "classList.toggle(\"trkLiteStill\"", "classList.toggle(\"trkNoMascot\"",
    /* ④「読む量をへらす」枠（曲リスト・音声解析・3Dマスコットのモデル）。既定値をプリセットに全部並べ、
       liteValueOf は既定オンのキー名で判定する（settings[key] !== false を素の値に混ぜると Object.prototype が通る） */
    "liteDecorBlocked", "liteDecorAllow", "liteLibRowsValue", "function liteLibRows(max)", "liteNoAnalyze", "liteMascotNoLoad",
    "LITE_DEFAULT_ON", 'liteLibRows:"150"', 'liteNoAnalyze:true', 'liteMascotNoLoad:true']
    .every(token => lite.includes(token));
  /* 🎯 プリセット（ゲーム優先＝ノーツ・反応はそのまま、他だけ軽くする） */
  const presetOk = lite.includes("const LITE_PRESETS = [") && ["balanced", "game", "max", "off"].every(id => lite.includes(`id:"${id}"`)) &&
    lite.includes("function litePresetId()") && lite.includes("function liteApplyPreset(id)") && lite.includes("allowGame: liteAllowGame") &&
    lite.includes("function liteAllowGame(now)") && lite.includes("settings.liteGameFull === true") &&
    html.includes('<option value="game" data-i18n="litePresetGame">') && html.includes('id="liteGameFull"') &&
    core.includes("liteGameFull: prefs.liteGameFull === true");
  const uiOk = ids.every(id => html.includes(`id="${id}"`) && (id === "litePanel" || lite.includes(`"${id}"`))) &&
    html.includes('<script src="js/lite.js"></script>') &&
    html.indexOf('<script src="js/lite.js"></script>') > html.indexOf('<script src="js/core.js"></script>') &&
    settingsKeys.every(key => core.includes(`lite${key.slice(4)}: `) || core.includes(`${key}: `)) &&
    core.includes("function resetLitePrefs()") && core.includes('["lite","light"].includes(r)') &&
    core.includes('["lite","light"].includes(k)') && core.includes("resetLitePrefs();") &&
    core.includes("TrkLite.blurCap") && tv.includes("TrkLite.blurCap") &&
    css.includes("body.trkLiteFx") && css.includes("body.trkNoMascot #mmdCanvas") && css.includes("#litePanel.liteOn");
  /* 判定・時計（tickClock／sweepMisses）は 🪶 ゲートより前にあること */
  const gateAt = render.indexOf("TrkLite.allowGame(");
  const gateOk = gateAt > 0 && gateAt > render.indexOf("tickClock();") && gateAt > render.indexOf("sweepMisses(now)") &&
    gateAt > render.indexOf("truckJudge(now)") &&
    spectrum.includes('TrkLite.allow("spec"') && spectrum.includes("const specLive = () => settings.specOn && !isSafe() && !liteOff();") &&
    mmd.includes('TrkLite.mascotAllow("mmd"') && mmd.includes('TrkLite.noMascot("mmd")') &&
    vrm.includes('TrkLite.mascotAllow("vrm"') && vrm.includes('TrkLite.noMascot("vrm")') &&
    media.includes('TrkLite.allow("media"') && tv.includes('TrkLite.allow("tv"') && tv.includes('TrkLite.allow("tvCheck"') &&
    read("js/video-max.js").includes("TrkLite.pixelRatio(2)") && read("js/video-max.js").includes('TrkLite.allow("max"') &&
    read("js/synth-mode.js").includes("TrkLite.pixelRatio(2)") && read("js/synth-mode.js").includes("TrkLite.decorBlocked") &&
    /* 📡 選曲中も動き続けていたドックの装飾、📜 曲リストの行数、🧠 曲の解析、🩷 3Dモデルの自動読み込み */
    fxDock.includes("TrkLite.decorAllow(") && library.includes("TrkLite.libRows(LIB_SHOW)") &&
    songMedia.includes("TrkLite.noAnalyze()") && songMedia.includes("analysisSkippedLite") &&
    mmd.includes("TrkLite.mascotNoLoad") && mmd.includes('on("mascot"') && mmd.includes('$("mmdPanel").addEventListener("toggle"') &&
    vrm.includes("TrkLite.mascotNoLoad") && vrm.includes('on("mascot"') && read("js/custom.js").includes('emit("mascot")');
  const langKeys = ["secLite", "liteHint", "liteNote", "liteMode", "liteModeAuto", "liteModeOn", "liteModeOff", "liteFps",
    "liteDecor", "liteLibRows", "liteLibRowsDevice", "liteLibRows150", "liteLibRows60", "liteLibRowsDeviceShort", "liteLibRowsSet",
    "liteNoAnalyze", "liteMascotNoLoad", "liteLeanNote", "liteAnalyzeOffNow", "liteAnalyzeOnNow", "liteMascotSkipOn", "liteMascotSkipOff",
    "liteFps60", "liteFps30", "liteFps20", "liteMascot", "liteMascot60", "liteMascot30", "liteMascot15", "liteMascotOff",
    "liteMascotOffNote", "liteScale", "liteScaleDevice", "liteScale15", "liteScale10", "liteSpecOff", "liteFx", "liteBlur",
    "liteStateOn", "liteStateOff", "liteDevice", "liteCores", "liteMem", "liteApp", "liteBrowser", "liteBattery",
    "liteWhyManual", "liteWhyOff", "liteWhySaveData", "liteWhyBattery", "liteWhyMotion", "liteWhyLow", "liteWhyAutoOff",
    "liteWhyDesktop", "liteRecheck", "liteNowOn", "liteNowOff", "liteFpsSet", "liteMascotSet", "liteToast", "specLiteOff",
    "litePreset", "litePresetBalanced", "litePresetGame", "litePresetMax", "litePresetOff", "litePresetCustom", "litePresetSet",
    "liteGameFull", "liteGameFullNote", "liteGameFullOn", "liteGameFullOff"];
  const langOk = langKeys.every(key => (i18n.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  if (!wiringOk) fail("lite mode module (js/lite.js) is missing its probe / gates / body classes");
  else if (!uiOk) fail("lite-mode settings panel, script order, defaults or reset path is incomplete");
  else if (!presetOk) fail("lite-mode presets (balanced / game-first / maximum saving / off) are incomplete");
  else if (!gateOk) fail("lite-mode draw gates are missing (or the game clock/judging slipped behind the gate)");
  else if (!langOk) fail("lite-mode strings are missing from one of the four languages");
  else ok("lite mode (phones/apps): auto probe, presets incl. game-first, draw/size/loading gates in 4 languages");
}

// 🎮 Gamepads, controllers and TV remotes (js/pad.js): the ⚙ → ⌨ Controls
// sub-panel, button/axis bindings, menu focus and the keyboard-side extras
// (media keys / remote "back" keys) that make a remote usable.
{
  const pad = read("js/pad.js");
  const html = read("index.html");
  const core = read("js/core.js");
  const main = read("js/main.js");
  const media = read("js/media-player-mode.js");
  const i18n = read("js/i18n.js");
  const actions = ["left", "right", "confirm", "back", "pause"];
  const wiringOk = ["window.TrkPad = Object.freeze({", "function updatePadUI()", "getGamepads", "function padRawEdges(",
    "function padAssign(", "function padMoveFocus(", "function padActivate()", "function padTap(", "function padPressed(",
    "requestAnimationFrame(padTick)", "window.Trk.overlay.any()", "catchState", "stageInput", "handleInput("]
    .every(token => pad.includes(token)) &&
    ["function keyCodeOf(e)", "const validPadBind =", "const PAD_DEFAULTS =", "function formatPadBind(",
     "function resetKeysPrefs()", "if (typeof updatePadUI === \"function\") updatePadUI();"]
    .every(token => core.includes(token));
  const uiOk = ["padPanel", "padEnabled", "padMenuNav", "padStatus", "padPresets"].every(id => html.includes(`id="${id}"`)) &&
    actions.every(a => html.includes(`data-padbind="${a}"`) && html.includes(`data-padvalue="${a}"`)) &&
    ["ab", "dpad", "stick"].every(p => html.includes(`data-padpreset="${p}"`)) &&
    ["standard", "taiko", "arcade", "remote"].every(p => html.includes(`data-keypreset="${p}"`)) &&
    html.includes('<script src="js/pad.js"></script>') &&
    html.indexOf('<script src="js/pad.js"></script>') > html.indexOf('<script src="js/main.js"></script>') &&
    core.includes("padEnabled: prefs.padEnabled !== false") && core.includes('arcade:  { label:"keyPresetArcade"') &&
    core.includes('remote:  { label:"keyPresetRemote"') && core.includes("resetKeysPrefs();") &&
    core.includes('["keys","key","pad","controller","input"].includes(r)') && core.includes('["keys","key","pad","controller","input"].includes(k)') &&
    main.includes("const code = keyCodeOf(e);") && main.includes("captureKey(code)") && main.includes("captureMenuKey(code)") &&
    main.includes('code === "BrowserBack"') && media.includes("captureMediaExitKey(code)") && media.includes("keyCodeOf(e)");
  const langKeys = ["keyPresetArcade", "keyPresetRemote", "padPanelTitle", "padHint", "padEnable", "padEnableOn", "padEnableOff",
    "padMenuNav", "padMenuNavHint", "padMenuNavOn", "padMenuNavOff", "padPresetAB", "padPresetDpad", "padPresetStick", "padPresetSet",
    "padActLeft", "padActRight", "padActConfirm", "padActBack", "padActPause", "padConnected", "padNone", "padCapture",
    "padBindSet", "padConnectedToast", "padGoneToast", "padRemoteHint", "padBtn", "padAxis"];
  const langOk = langKeys.every(key => (i18n.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  if (!wiringOk) fail("gamepad module (js/pad.js) is missing its probe, bindings or play/menu helpers");
  else if (!uiOk) fail("gamepad / TV-remote settings panel, presets, script order or reset path is incomplete");
  else if (!langOk) fail("gamepad / TV-remote strings are missing from one of the four languages");
  else ok("gamepads and TV remotes: button+axis key config, menu focus, media keys, four languages");
}

// A cache name is deliberately checked for existence, not for a guessed
// date, because the service worker is manually bumped for every release.
const sw = read("sw.js");
const cacheMatch = sw.match(/CACHE\s*=\s*["']([^"']+)["']/);
if (!cacheMatch) fail("sw.js cache name could not be read");
else if (!/^trk-v\d{4}\.\d{1,2}\.\d{1,2}[-\w]*$/.test(cacheMatch[1])) fail(`unexpected service-worker cache name: ${cacheMatch[1]}`);
else ok(`service-worker cache: ${cacheMatch[1]}`);

for (const rel of [
  "docs/HANDOFF.md",
  "docs/pack-format.md",
  "docs/android.md",
  "NOTICE.md",
  "README.md",
  "privacy.html",
  "credits.html",
  "css/privacy.css",
  "package.json",
  "capacitor.config.ts",
  "tools/prepare-mobile-web.mjs",
  "tools/check-mmd-motion-data.mjs"
]) {
  if (!exists(rel)) fail(`required project file is missing: ${rel}`);
}
if (exists("README.md") && !read("README.md").includes("docs/pack-format.md")) {
  fail("README.md does not link to docs/pack-format.md");
} else if (exists("README.md")) {
  ok("pack format documentation is linked from README.md");
}
if (exists("README.md") && !read("README.md").includes("privacy.html")) fail("README.md does not link to privacy.html");
if (exists("README.md") && !read("README.md").includes("credits.html")) fail("README.md does not link to credits.html");
if (exists("index.html") && !read("index.html").includes('href="privacy.html"')) fail("index.html does not link to privacy.html");
if (exists("index.html") && !read("index.html").includes('href="credits.html"')) fail("index.html does not link to credits.html");
else ok("privacy and credits pages are linked from the app");
try {
  const pkg = JSON.parse(read("package.json"));
  for (const script of ["prepare:mobile", "cap:add:android", "cap:sync", "cap:build:android"]) {
    if (!pkg.scripts || !pkg.scripts[script]) fail(`package.json is missing script: ${script}`);
  }
  if (pkg.scripts && pkg.scripts["prepare:mobile"] && exists("tools/prepare-mobile-web.mjs")) ok("Capacitor preparation scripts are present");
} catch (error) {
  fail(`package.json is not valid JSON: ${error.message}`);
}

/* 差し替えの回帰（名前空間 B の欠陥の再発防止）：後から読み込まれるファイルが代入で上書きする関数は、
   正規の公開先（window.Trk.core等）をアクセサ（get/set）で持つ。値のコピーだと内部呼び出しへ届かない。 */
const PATCHED_FUNCTIONS = {
  "js/core.js": ["activeMods", "applySkin", "videoFilter"],
  "js/custom.js": ["installPackFile", "sanitizeSong", "getPackSongs", "renderPackList"],
  "js/game.js": ["showJudge", "gameTime"],
  "js/library.js": ["renderLib", "renderBanner"],
  "js/media.js": ["chartToData", "applyChartData"],
  "js/render.js": ["drawVideo"],
};
for (const [rel, name] of Object.entries(PATCHED_FUNCTIONS).flatMap(([r, ns]) => ns.map(n => [r, n]))) {
  const owner = exists(rel) ? read(rel) : "";
  const accessorTarget = rel === "js/core.js" ? "window\\.Trk\\.core" : "window";
  const accessor = new RegExp(`Object\\.defineProperty\\(${accessorTarget}, "${name}", \\{[^}]*get:\\(\\) => ${name}, set:v => \\{ ${name} = v; \\} \\}\\)`);
  const patchedElsewhere = walk(path.join(root, "js")).filter(f => f.endsWith(".js") && path.relative(root, f) !== rel)
    .some(f => new RegExp(`^\\s*(?:window\\.(?:Trk\\.[\\w]+\\.)?)?${name} = (?:async )?(?:function|\\(|[A-Za-z_$][\\w$]* =>|[A-Za-z_$][\\w$]*;)`, "m").test(read(path.relative(root, f))));
  if (!patchedElsewhere) fail(`${name}: no later file overrides it (remove it from PATCHED_FUNCTIONS if this is intended)`);
  else if (!accessor.test(owner)) fail(`${name} is overridden by a later file but ${rel} does not expose it as a ${rel === "js/core.js" ? "Trk.core" : "window"} accessor`);
  else ok(`${name} override reaches internal calls (${rel === "js/core.js" ? "Trk.core" : "window"} accessor in ${rel})`);
}

/* 名前空間 D：領域の公開名は window.Trk.<領域> にも載る（旧名 window.X は別名として残す）。
   登録元の包みの末尾に、窓へ出している名前（window.X = X・defineProperty(window, …)）がすべて
   window.Trk.<領域> の登録に入っていることを確かめる。登録が無い・抜けると失敗する。 */
const TRK_REGISTRARS = {
  "js/chart-gen.js": "chart",
  "js/pad.js": "pad",
  "js/lite.js": "lite",
  "js/main.js": "main",
  "js/custom.js": "custom",
  "js/library.js": "library",
  "js/media.js": "media",
  "js/data.js": "data",
  "js/render.js": "play",
  "js/catch.js": "modes",
  "js/core.js": "core",
};
const TRK_NOT_REGISTERED = { "js/core.js": ["_trkStudyRoomOpen"] }; // 互換の読み取り専用アクセサ（宣言ではない）
const TRK_EXTRAS = {
  "js/library.js": { files: ["js/title-match.js"], functions: true },  // 関数は領域へ出す（plTitleKeys など。窓へは出していない）
  "js/render.js": { files: ["js/game.js"], functions: false },        // 同じ領域の別ファイル：窓へ出している名前だけ
  "js/catch.js": { files: ["js/modes.js", "js/truck.js", "js/stage.js"], functions: false },
};
for (const [rel, area] of Object.entries(TRK_REGISTRARS)) {
  const src = exists(rel) ? read(rel) : "";
  // 同じ領域の別ファイル（TRK_EXTRAS）：その関数と、窓へ出している名前も登録の対象
  const extra = TRK_EXTRAS[rel] || { files: [], functions: false };
  const extraNames = extra.files.flatMap(f => {
    const t = read(f);
    return [
      ...(extra.functions ? [...t.matchAll(/^function ([A-Za-z_$][\w$]*)\(/gm)].map(m => m[1]) : []),
      ...[...t.matchAll(/^window\.([A-Za-z_$][\w$]*) = \1;/gm)].map(m => m[1]),
      ...[...t.matchAll(/^Object\.defineProperty\(window, "([^"]+)"/gm)].map(m => m[1]),
    ];
  });
  const exported = [
    ...[...src.matchAll(/^window\.([A-Za-z_$][\w$]*) = \1;/gm)].map(m => m[1]),
    ...[...src.matchAll(/^Object\.defineProperty\(window, "([^"]+)"/gm)].map(m => m[1]),
    ...extraNames,
  ].filter((n, i, all) => all.indexOf(n) === i && !(TRK_NOT_REGISTERED[rel] || []).includes(n));
  const tail = src.slice(src.indexOf(`window.Trk.${area} = `));
  const missing = exported.filter(n => !new RegExp(`[{,]\\s*${n.replace(/\$/g, "\\$")}\\s*[,}]|window\\.Trk\\.${area}, "${n.replace(/\$/g, "\\$")}"`).test(tail));
  if (src.indexOf(`window.Trk.${area} = `) < 0) fail(`${rel}: window.Trk.${area} is not registered`);
  else if (missing.length) fail(`${rel}: not registered under window.Trk.${area}: ${missing.join(", ")}`);
  else ok(`${rel} registers ${exported.length} public name(s) under window.Trk.${area}`);
}

/* 名前空間 D：書斎の公開面（凍結の window.TrkStudyRoom）と同じ参照を、領域の名前 window.Trk.study でも出す */
{
  const studySrc = exists("js/study-room.js") ? read("js/study-room.js") : "";
  if (!/^window\.Trk\.study = window\.TrkStudyRoom;$/m.test(studySrc)) fail("js/study-room.js does not alias window.Trk.study to window.TrkStudyRoom");
  else ok("window.Trk.study is the same frozen object as window.TrkStudyRoom");
}

/* 利用者の決定（2026-10-08）：ブラウザ標準の window.screen を上書きしない。
   内部の画面状態は window.Trk.core.screen だけで読む（窓の別名は作らない）。 */
{
  const coreSrc = read("js/core.js");
  if (/defineProperty\(window, "screen"|window\.screen = /.test(coreSrc)) fail("js/core.js sets window.screen (the browser's own screen object must not be replaced)");
  else ok("window.screen is left to the browser (the app state is window.Trk.core.screen only)");
}

/* アドオンの api（js/addons.js の makeApi）の鍵は、docs/ADDONS.md に `api.<鍵>` として載っていること。
   載っていない鍵は、使ってよい窓口として約束していないので、増やすときは文書も増やす。 */
{
  const addonsSrc = fs.readFileSync(path.join(root, "js/addons.js"), "utf8");
  const block = (addonsSrc.match(/function makeApi\(id\) \{[\s\S]*?\n\}\n/) || [""])[0];
  /* 鍵は字下げ4の行にある（同じ行に , で続くものも含む）。メソッド形式（addStyle(css)）も含む */
  const keys = [];
  for (const line of block.split("\n")) {
    if (!/^\s{4}\S/.test(line)) continue;
    const m1 = line.match(/^\s{4}([A-Za-z_$][\w$]*)\s*\(/); if (m1) keys.push(m1[1]);
    const m2 = line.match(/^\s{4}([A-Za-z_$][\w$]*),\s*$/); if (m2) keys.push(m2[1]);   /* 省略記法（id,） */
    for (const m of line.matchAll(/(?:^\s{4}|,\s+)([A-Za-z_$][\w$]*)\s*:/g)) keys.push(m[1]);
  }
  const docs = fs.readFileSync(path.join(root, "docs/ADDONS.md"), "utf8");
  const missing = [...new Set(keys)].filter(k => !new RegExp("api\\." + k.replace("$", "\\$") + "(?![\\w$])").test(docs));
  if (!block || keys.length < 10) fail("js/addons.js: makeApi の鍵を読めませんでした（" + keys.length + "件）");
  else if (missing.length) fail("docs/ADDONS.md に載っていない api の鍵: " + missing.join(", "));
  else ok("アドオンの api の鍵（" + keys.length + "件）は docs/ADDONS.md に全て載っている");
}

/* 互換名の段階的廃止：現存する window 別名・今回外した名前・Trk.core の正規 accessor を照合。
   fx.js が凍結中の5名を読むため、その5名だけは移行後まで保留する。 */
{
  const coreSrc = fs.readFileSync(path.join(root, "js/core.js"), "utf8");
  const fxSrc = fs.readFileSync(path.join(root, "js/fx.js"), "utf8");
  const exempt = new Set(["_trkStudyRoomOpen"]);
  const actual = [...coreSrc.matchAll(/defineProperty\(window, "([A-Za-z_$][\w$]*)"/g)].map(m => m[1]).filter(n => !exempt.has(n));
  const docs = fs.readFileSync(path.join(root, "docs/ADDONS.md"), "utf8");
  const sec = (docs.match(/### 互換名の廃止状況[\s\S]*?(?=\n## |\n### )/) || [""])[0];
  const removedLine = (sec.match(/^- \*\*trk90で廃止（28件）：\*\*(.*)$/m) || [, ""])[1];
  const retainedLine = (sec.match(/^- \*\*現存（5件）：\*\*(.*)$/m) || [, ""])[1];
  const removed = [...removedLine.matchAll(/`([A-Za-z_$][\w$]*)`/g)].map(m => m[1]);
  const retained = [...retainedLine.matchAll(/`([A-Za-z_$][\w$]*)`/g)].map(m => m[1]);
  const former = `activeMods analysis applySkin avatarHit bgImage bindingSlot caption chart chartDiff chartMeta chartMode clock currentLevel currentSong effects errors fingerprint lastMissT levelOverride loadToken mediaName mediaURL nextIdx phase practice prefs pressFlash pressH safeModeOn seekDragging stats videoFilter videoReady`.split(" ");
  const coreMembers = new Set([...coreSrc.matchAll(/defineProperty\(window\.Trk\.core, "([A-Za-z_$][\w$]*)"/g)].map(m => m[1]));
  const currentSorted = [...new Set(actual)].sort();
  const retainedSorted = [...new Set(retained)].sort();
  const formerSorted = [...former].sort();
  const accountedSorted = [...new Set([...removed, ...retained])].sort();
  const expectedRetained = ["chartMeta", "phase", "prefs", "stats", "videoReady"];
  const missingCore = former.filter(n => !coreMembers.has(n));
  const missingFrozenConsumer = expectedRetained.filter(n => !new RegExp(`(?<![\\w$.])${n}(?![\\w$])`).test(fxSrc));
  if (!sec) fail("docs/ADDONS.md に「互換名の廃止状況」の節がありません");
  else if (JSON.stringify(currentSorted) !== JSON.stringify(retainedSorted)) fail("現存する core.js のwindow別名と docs/ADDONS.md の現存一覧が不一致");
  else if (JSON.stringify(accountedSorted) !== JSON.stringify(formerSorted) || removed.length !== 28 || retained.length !== 5) fail("trk90廃止分と保留分が、従来の33互換名を重複なく網羅していません");
  else if (missingCore.length) fail("廃止済み／保留の名前が window.Trk.core にありません: " + missingCore.join(", "));
  else if (JSON.stringify(retainedSorted) !== JSON.stringify([...expectedRetained].sort()) || missingFrozenConsumer.length) fail("保留する5名は frozen js/fx.js の実際の読者と一致しません");
  else ok("互換名: 28件を廃止、frozen js/fx.js の5件を保留（Trk.core は全33件を維持）");
}

/* 項目 5（README の分割）：README は概要に絞る（上限 12KB）。docs/guide/ の全ファイルは目次（index.md）に載せる。 */
{
  const readmeBytes = fs.statSync(path.join(root, "README.md")).size;
  const guideFiles = fs.readdirSync(path.join(root, "docs/guide")).filter(f => f.endsWith(".md") && f !== "index.md");
  const guideIndex = read("docs/guide/index.md");
  const notListed = guideFiles.filter(f => !guideIndex.includes("(" + f + ")"));
  if (readmeBytes > 12 * 1024) fail("README.md が 12KB を超えています（" + readmeBytes + " bytes）。くわしい説明は docs/guide/ へ");
  else if (notListed.length) fail("docs/guide/index.md に載っていないガイド: " + notListed.join(", "));
  else ok("README は " + readmeBytes + " bytes（上限 12KB）。docs/guide/ の " + guideFiles.length + " 件は全て目次に載っている");
}

/* 項目 6（長押しの代わり）：長押しでしか開けない「曲のプロフィール」「メディアプレーヤー」に、見えるボタンと
   設定（showMoreBtns）が付いていること。ボタンの有無は headless の確認（/tmp の probe）でも見ている。 */
{
  const libSrc = read("js/library.js"), tvSrc = read("js/tv-dock.js"), idx = read("index.html");
  const songBtn = /pb\.addEventListener\("click"[^\n]*songProfile\(it\)/.test(libSrc) && libSrc.includes('"libFav moreBtn"');
  const tvBtn = /mediaBtn\.addEventListener\("click"[^\n]*TrkMediaPlayer\.open\(\)/.test(tvSrc) && /window\.TrkMediaPlayer = \{ open:openMedia/.test(read("js/media-player-mode.js")) && tvSrc.includes('"inline tight moreBtn"');
  const toggle = idx.includes('id="showMoreBtns"') && libSrc.includes("syncMoreBtns") && /body\.noMoreBtns \.moreBtn/.test(read("css/style.css"));
  if (!songBtn || !tvBtn || !toggle) fail("長押しの代わりのボタン（曲の🎶・TVの▶）か、設定 showMoreBtns の配線が無い");
  else ok("長押しの代わりのボタン（曲の🎶・TVの▶）と設定 showMoreBtns が付いている");
}

/* 項目 6（表示の並び・開発者表示）：かんたん／全部の並び替えと、開発者表示（devView）で隠すものの配線。
   TV の並びは起動時に組み立てるので、切り替えは次の読み込みで反映（index の説明文に書いてある）。 */
{
  const idx = read("index.html"), libUi = read("js/library.js"), libSkins = read("js/lib-skins.js");
  const tvSrc = read("js/tv-dock.js"), mediaSrc = read("js/media-player-mode.js"), i18n = read("js/i18n.js");
  const arr = (src, name) => { const m = src.match(new RegExp("const " + name + " = \\[([^\\]]*)\\]")); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]) : null; };
  const groups = arr(tvSrc, "TV_GROUPS"), simpleGroups = arr(tvSrc, "TV_GROUPS_SIMPLE");
  const sameGroups = groups && simpleGroups && groups.length === simpleGroups.length && groups.every(g => simpleGroups.includes(g));
  const top = arr(libSkins, "LIB_SKIN_SIMPLE_TOP");
  const wired = idx.includes('id="displayMode"') && idx.includes('id="devView"') && libUi.includes("syncDisplayUi") && /body\.noDev \.devOnly/.test(read("css/style.css"));
  const orders = (libSkins.match(/for \(const id of libSkinOrder\(\)\)/g) || []).length === 2 && (tvSrc.match(/for \(const cat of tvGroups\(\)\)/g) || []).length === 2 && tvSrc.includes("TV_RECOMMENDED");
  const hides = mediaSrc.includes('"mediaLoopLab devOnly"') && libUi.includes('el("div", "devOnly")') && idx.includes('id="skinMaker" class="subPanel devOnly"') && tvSrc.includes('"fxMini slim devOnly"');
  const keys = ["displayModeLabel:", "displaySimple:", "displayFull:", "displayModeHint:", "devViewLabel:"].every(k => (i18n.match(new RegExp(k, "g")) || []).length === 4);
  if (!sameGroups || !top || top.length !== 6 || !wired || !orders || !hides || !keys) fail("表示の並び（かんたん／全部）か開発者表示（devView）の配線が欠けている");
  else ok("表示の並び（かんたん／全部）と開発者表示（ループ・ラボ、投稿者ツールを隠す）が配線されている");
}

/* 項目 6（一部／要確認の4件）：長押しの見える代わり。タブ設定（⚙）、スペクトラム（⚙ くわしい設定）、書斎（📚 書斎を開く）、
   緊急復旧（既存の 🛟 セーフモード）。それぞれ呼び出し先が同じ関数であること、設定 showMoreBtns で隠せることを見る。 */
{
  const libSrc = read("js/library.js"), specSrc = read("js/spectrum.js"), studySrc = read("js/study-room.js");
  const idx = read("index.html"), coreSrc = read("js/core.js");
  const tabGear = libSrc.includes('"libTab plPlus moreBtn"') && libSrc.includes("onLongPress(b, () => tabSettingsMenu(t))") && libSrc.includes("tabSettingsMenu(activeTab)");
  const specBtn = specSrc.includes('"specNext moreBtn"') && specSrc.includes("onLongPress(zipBtn, openSpecSettings)") && specSrc.includes("specMore.addEventListener(\"click\", openSpecSettings)");
  const studyBtn = idx.includes('id="studyOpenBtn"') && studySrc.includes('getElementById("studyOpenBtn")') && idx.includes('id="studyOpenBtn" class="libSkinBtn moreBtn"');
  const emergency = idx.includes('id="emergencySafeBtn"') && coreSrc.includes('bind("emergencySafeBtn"');
  const keys = (src, k) => (src.match(new RegExp("\\b" + k + ":", "g")) || []).length === 4;
  const i18nOk = keys(libSrc, "tabSettingsBtn") && keys(specSrc, "specOpenSettings") && keys(studySrc, "studyOpenBtn");
  if (!tabGear || !specBtn || !studyBtn || !emergency || !i18nOk) fail("一部／要確認の4件の見える代わり（タブの⚙・スペクトラムのくわしい設定・書斎ボタン・緊急復旧）の配線が欠けている");
  else ok("一部／要確認の4件に見える代わりがある（タブの⚙・くわしい設定・📚書斎・🛟緊急復旧）");
}

/* 項目 7（Service Worker）：ハッシュ固定の vendor は cache-first。キャッシュの中身は SHA-384 の照合が通ったものだけ使う。
   VENDOR_PINS は tools/vendor-lock.json から生成（ずれたら失敗）。セーフモードはキャッシュを読まない（F-19）。 */
{
  const swSrc = read("sw.js");
  const pins = spawnSync(process.execPath, [path.join(root, "tools", "sw-vendor-pins.mjs")], { encoding: "utf8" });
  const pinsFresh = pins.status === 0;
  const cacheFirst = /const pinned = pinnedPath\(url\);/.test(swSrc) && /if \(pinned && !safeClient\)/.test(swSrc) && /if \(hit && await pinnedMatches\(hit, pinned\)\) return hit;/.test(swSrc);
  const offlineVerified = /if \(cached && \(!pinned \|\| await pinnedMatches\(cached, pinned\)\)\) return cached;/.test(swSrc);
  const digestUsed = /crypto\.subtle\.digest\("SHA-384"/.test(swSrc);
  const safeIdFromNavigation = swSrc.includes("safeClients.add(event.resultingClientId)") && !swSrc.includes("safeClients.add(event.clientId)");
  if (!pinsFresh || !cacheFirst || !offlineVerified || !digestUsed || !safeIdFromNavigation) fail("sw.js の vendor の cache-first（SHA-384 照合・セーフモードはキャッシュを読まない）が欠けている、または VENDOR_PINS が lock とずれている");
  else ok("sw.js: ハッシュ固定の vendor は cache-first で、SHA-384 が合うものだけ使う（VENDOR_PINS は vendor-lock.json と一致）");
}

console.log(`\nStatic check: ${failures ? "FAILED" : "passed"} · ${failures} failure(s) · ${warnings} warning(s)`);
if (failures) process.exitCode = 1;
