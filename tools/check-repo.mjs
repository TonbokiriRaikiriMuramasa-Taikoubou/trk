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
  "tools/prepare-mobile-web.mjs"
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
