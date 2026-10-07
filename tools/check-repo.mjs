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
import path from "node:path";
import { spawnSync } from "node:child_process";
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
function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
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
  const presetsOk = ids.length === 65 && uniqueIds && Object.values(catCounts).every(n => n === 5);
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
  if (!presetsOk) fail(`TV preset catalog should contain 65 unique filters, five in each new category (found ${ids.length}; ${JSON.stringify(catCounts)})`);
  else if (!langsOk) fail("TV portrait/anime/texture/quality groups or parameter reset help are missing from one of the four languages");
  else if (!resetOk) fail("TV random button and brightness/blur sliders need their long-press reset paths and explicit reset control");
  else if (!favoritesOk) fail("brightness/blur favorites must be bounded, validated, persisted and safe-mode aware");
  else if (!overlaysOk || !canvasOriginalOk || !favoriteStyleOk) fail("original Canvas TV overlays, documented rights/scope, CSS-filter fallback, or parameter-favorite styling are missing");
  else ok("TV catalog (65 presets), localized picture categories, long-press resets, and bounded brightness/blur favorites are wired");
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
  if (ids.length !== 16) fail(`expected 16 shelf skins, found ${ids.length}`);
  else ok("shelf skin count is 16");
}
if (/棚スキン11種|・11種類/.test(read("css/style.css") + skins)) {
  fail("stale shelf skin count (11) remains in source comments");
}

// Overall look skins: 27 presets in data.js (incl. the locked 🎓 reward skin) + 4 Miku skins = 31.
const dataJs = read("js/data.js");
const skinsStart = dataJs.indexOf("const SKINS = {");
const skinsEnd = dataJs.indexOf("\n};", skinsStart);
if (skinsStart < 0 || skinsEnd < 0) {
  fail("SKINS block could not be read in js/data.js");
} else {
  const presetCount = (dataJs.slice(skinsStart, skinsEnd).match(/label:\{ja:/g) || []).length;
  const mikuCount = (read("js/characters/miku.js").match(/^ {2}SKINS\.[A-Za-z0-9]+ = \{/gm) || []).length;
  if (presetCount + mikuCount !== 31) fail(`expected 31 overall skins, found ${presetCount + mikuCount}`);
  else ok("overall skin count is 31");
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
  /* 📡 「集める棚」：未入手の曲を開いた瞬間から灰色で並べ、入手したら黒くなる */
  const collectionOk = library.includes("function plTitleKeys(") &&
    /function plWishMatch\(w, byTitle\) \{\s*for \(const k of plTitleKeys\(w\.t\)\)/.test(library) &&
    library.includes("function plCollectionEntries(") && library.includes("function plWishFolderIds(") &&
    library.includes("for (const k of plTitleKeys((metaOf(it.key) || {}).title || it.title)) byTitleAdd(k, it);") &&
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
  if (!exists("js/catalog.js") ||
      !read("js/catalog.js").includes("TRK_CATALOG") ||
      !library.includes("plCatalogMenu") ||
      !library.includes("plWishMatch") ||
      !library.includes("function plWishRow(") ||
      !read("index.html").includes('src="js/catalog.js"')) {
    fail("official catalog plumbing is missing");
  } else if (!collectionOk || !stringsOk) {
    fail("the collection shelf (grey unowned rows inline, turning black on arrival) is not wired");
  } else {
    ok("official catalog (wishlist auto-match, no bundled audio) is wired");
  }
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
    core.includes('settings.trkTabName = "full"') && core.includes('"liteMode", "liteFps", "liteMascot", "liteScale", "trkTabName"');
  /* 長押し＝階層。プロフィール編集（plMenu／plFolderMenu）へは行かせない */
  const pressOk = library.includes("if (t.trk) plTrkMenu(); else if (t.pl) plMenu(t.pl); else if (t.fld) plFolderMenu(t.fld); else plGlobalMenu();") &&
    library.includes("if (f && f.id === TRK_FOLDER_ID) { plTrkMenu(); return; }") && library.includes("function plTrkMenu(");
  /* 設定欄：3種類の選択と、🎻 trk classic の収納（trkPanel の中の subPanel） */
  const panelOk = html.includes('id="trkTabNameSel"') && html.includes('<option value="short" data-i18n="trkTabNameShort">') &&
    html.includes('<option value="icon" data-i18n="trkTabNameIcon">') &&
    /<details class="panel" id="trkPanel">[\s\S]*<details class="subPanel" id="trkClassicPanel">[\s\S]*?<\/details>\s*<\/details>/.test(html) &&
    html.includes('id="trkSortAbcChk"') && html.includes('id="trkOrderList"');
  const keys = ["trkTabNameLabel", "trkTabNameFull", "trkTabNameShort", "trkTabNameIcon", "trkTabNameNote",
    "trkMenuTitle", "trkMenuHint", "trkMenuOpenFolder", "trkOpenItem", "trkMoveUp", "trkMoveDown", "trkOrderEmpty", "trkOrderAbcOff"];
  const langOk = keys.every(k => (i18n.match(new RegExp("\\b" + k + ":", "g")) || []).length === 4);
  if (!fixedOk) fail("trk's playlist name/icon/colour are not pinned (a 🐔 name brings back the double 🐔 tab)");
  else if (!catalogOk) fail("trk wish lists read window.TRK_CATALOG, which is always undefined — the Vol tabs are never created");
  else if (!labelOk) fail("the trk tab label (full / short / icon) or its allowlist is not wired");
  else if (!pressOk) fail("long-press on the trk tab must open the hierarchy, not the profile editor");
  else if (!panelOk) fail("the trk settings panel is missing the label select or the nested trk classic panel");
  else if (!langOk) fail("trk tab/menu strings are missing from one of the four languages");
  else ok("🐔 trk's playlist: fixed name/icon, three labels, long-press opens the hierarchy, trk classic nested in settings");
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
  const docsOk = read("README.md").includes("内蔵モーション65種") &&
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
  const i18n = read("js/i18n.js"), notice = read("NOTICE.md"), ignore = read(".gitignore"), readme = read("README.md");
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
  const ids = ["litePanel", "liteMode", "liteFps", "liteMascot", "liteScale", "liteSpecOff", "liteFx", "liteBlur", "liteState", "liteDevice", "liteRecheckBtn", "litePreset", "liteGameFull"];
  const settingsKeys = ["liteMode", "liteFps", "liteMascot", "liteScale", "liteSpectrumOff", "liteFx", "liteBlur", "liteGameFull"];
  const wiringOk = ["window.TrkLite = Object.freeze({", "function liteActive()", "function liteProbe()", "liteBatteryProbe",
    "navigator.connection", "deviceMemory", "liteGate(", "function litePixelRatio(", "liteBlurCap", "liteSpecBlocked",
    "liteMascotAllow", "classList.toggle(\"trkLite\"", "classList.toggle(\"trkLiteFx\"", "classList.toggle(\"trkNoMascot\""]
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
    read("js/video-max.js").includes("TrkLite.pixelRatio(2)") && read("js/synth-mode.js").includes("TrkLite.pixelRatio(2)");
  const langKeys = ["secLite", "liteHint", "liteNote", "liteMode", "liteModeAuto", "liteModeOn", "liteModeOff", "liteFps",
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
  else ok("lite mode (phones/apps): auto probe, presets incl. game-first, draw-only gates in 4 languages");
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
    "requestAnimationFrame(padTick)", "window._trkStudyRoomOpen", "catchState", "stageInput", "handleInput("]
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

console.log(`\nStatic check: ${failures ? "FAILED" : "passed"} · ${failures} failure(s) · ${warnings} warning(s)`);
if (failures) process.exitCode = 1;
