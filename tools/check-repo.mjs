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

// A cache name is deliberately checked for existence, not for a guessed
// date, because the service worker is manually bumped for every release.
const sw = read("sw.js");
const cacheMatch = sw.match(/CACHE\s*=\s*["']([^"']+)["']/);
if (!cacheMatch) fail("sw.js cache name could not be read");
else if (!/^trk-v\d{4}\.\d{1,2}\.\d{1,2}[-\w]*$/.test(cacheMatch[1])) fail(`unexpected service-worker cache name: ${cacheMatch[1]}`);
else ok(`service-worker cache: ${cacheMatch[1]}`);

for (const rel of ["docs/HANDOFF.md", "docs/pack-format.md", "NOTICE.md", "README.md"]) {
  if (!exists(rel)) fail(`required project document is missing: ${rel}`);
}
if (exists("README.md") && !read("README.md").includes("docs/pack-format.md")) {
  fail("README.md does not link to docs/pack-format.md");
} else if (exists("README.md")) {
  ok("pack format documentation is linked from README.md");
}

console.log(`\nStatic check: ${failures ? "FAILED" : "passed"} · ${failures} failure(s) · ${warnings} warning(s)`);
if (failures) process.exitCode = 1;
