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

// 🛒 Official-source catalog: no-audio curated playlists with wishlist matching.
if (!exists("js/catalog.js") ||
    !read("js/catalog.js").includes("TRK_CATALOG") ||
    !read("js/library.js").includes("plCatalogMenu") ||
    !read("js/library.js").includes("plWishMatch") ||
    !read("js/library.js").includes("plWishRows") ||
    !read("index.html").includes('src="js/catalog.js"')) {
  fail("official catalog plumbing is missing");
} else {
  ok("official catalog (wishlist auto-match, no bundled audio) is wired");
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
  const ids = ["litePanel", "liteMode", "liteFps", "liteMascot", "liteScale", "liteSpecOff", "liteFx", "liteBlur", "liteState", "liteDevice", "liteRecheckBtn"];
  const settingsKeys = ["liteMode", "liteFps", "liteMascot", "liteScale", "liteSpectrumOff", "liteFx", "liteBlur"];
  const wiringOk = ["window.TrkLite = Object.freeze({", "function liteActive()", "function liteProbe()", "liteBatteryProbe",
    "navigator.connection", "deviceMemory", "liteGate(", "function litePixelRatio(", "liteBlurCap", "liteSpecBlocked",
    "liteMascotAllow", "classList.toggle(\"trkLite\"", "classList.toggle(\"trkLiteFx\"", "classList.toggle(\"trkNoMascot\""]
    .every(token => lite.includes(token));
  const uiOk = ids.every(id => html.includes(`id="${id}"`) && (id === "litePanel" || lite.includes(`"${id}"`))) &&
    html.includes('<script src="js/lite.js"></script>') &&
    html.indexOf('<script src="js/lite.js"></script>') > html.indexOf('<script src="js/core.js"></script>') &&
    settingsKeys.every(key => core.includes(`lite${key.slice(4)}: `) || core.includes(`${key}: `)) &&
    core.includes("function resetLitePrefs()") && core.includes('["lite","light"].includes(r)') &&
    core.includes('["lite","light"].includes(k)') && core.includes("resetLitePrefs();") &&
    core.includes("TrkLite.blurCap") && tv.includes("TrkLite.blurCap") &&
    css.includes("body.trkLiteFx") && css.includes("body.trkNoMascot #mmdCanvas") && css.includes("#litePanel.liteOn");
  /* 判定・時計（tickClock／sweepMisses）は 🪶 ゲートより前にあること */
  const gateAt = render.indexOf('TrkLite.allow("game"');
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
    "liteWhyDesktop", "liteRecheck", "liteNowOn", "liteNowOff", "liteFpsSet", "liteMascotSet", "liteToast", "specLiteOff"];
  const langOk = langKeys.every(key => (i18n.match(new RegExp("\\b" + key + ":", "g")) || []).length === 4);
  if (!wiringOk) fail("lite mode module (js/lite.js) is missing its probe / gates / body classes");
  else if (!uiOk) fail("lite-mode settings panel, script order, defaults or reset path is incomplete");
  else if (!gateOk) fail("lite-mode draw gates are missing (or the game clock/judging slipped behind the gate)");
  else if (!langOk) fail("lite-mode strings are missing from one of the four languages");
  else ok("lite mode (phones/apps): auto probe, bottom-right panel, draw-only gates in 4 languages");
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
