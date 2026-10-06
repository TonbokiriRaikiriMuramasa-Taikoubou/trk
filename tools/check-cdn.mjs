#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * CDN pin checker (network required -- deliberately NOT part of `npm run check`).
 *
 *   node tools/check-cdn.mjs                  verify the CDN bytes against tools/cdn-lock.json
 *   node tools/check-cdn.mjs --source=npm     verify npm registry tarballs against the same lock
 *   node tools/check-cdn.mjs --update         re-download and rewrite the lock (only for a version bump)
 *   node tools/check-cdn.mjs --list           print the module graph (no hashes checked)
 *
 * Why: the import map pins exact npm versions, but an import map cannot carry integrity metadata
 * (browsers do not support SRI there), so "the URL is pinned" is not the same as "the bytes are ours".
 * This tool records SHA-384 digests for every module in the graph (the entry points plus everything
 * they statically import) so a later change on the CDN becomes visible.
 *
 * With --source=npm the same graph is read out of the published npm tarballs instead of the CDN.
 * That works in restricted networks and also proves the CDN content equals the published package.
 *
 * Exit codes: 0 = matches the lock, 1 = mismatch / graph changed, 3 = could not reach the source.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const LOCK = path.join(root, "tools", "cdn-lock.json");
const CDN = "https://cdn.jsdelivr.net";
const REGISTRY = "https://registry.npmjs.org";
const MAX_FILES = 400;
const argv = process.argv.slice(2);
const has = flag => argv.includes(flag);
const value = (name, fallback) => {
  const hit = argv.find(a => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : fallback;
};
const source = value("--source", "cdn");
const mode = has("--update") ? "update" : has("--list") ? "list" : "verify";
if (!["cdn", "npm"].includes(source)) { console.error(`unknown --source=${source} (use cdn or npm)`); process.exit(1); }

const read = rel => fs.readFileSync(path.join(root, rel), "utf8");

/* ---------- 1. import map + the specifiers the app really imports ---------- */
const html = read("index.html");
const mapMatch = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
if (!mapMatch) { console.error("no import map found in index.html"); process.exit(1); }
const importMap = JSON.parse(mapMatch[1]).imports || {};
const specifiers = new Set();
const appSource = [];
for (const file of fs.readdirSync(path.join(root, "js"))) {
  if (!file.endsWith(".js")) continue;
  const text = fs.readFileSync(path.join(root, "js", file), "utf8");
  appSource.push(text);
  for (const m of text.matchAll(/\bimport\s*\(\s*"([^"]+)"\s*\)/g)) specifiers.add(m[1]);
}
/* import(mapKey) where the name comes from a const would be invisible above, so also take every
   exact import-map key that appears as a string literal somewhere in js/ (e.g. MMD_LIB). */
for (const key of Object.keys(importMap)) {
  if (key.endsWith("/")) continue;
  if (appSource.some(text => text.includes(`"${key}"`))) specifiers.add(key);
}
function resolveSpecifier(spec, baseUrl) {
  if (spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/")) return new URL(spec, baseUrl).href;
  if (importMap[spec]) return importMap[spec];
  const prefix = Object.keys(importMap).filter(key => key.endsWith("/") && spec.startsWith(key)).sort((a, b) => b.length - a.length)[0];
  if (prefix) return new URL(spec.slice(prefix.length), importMap[prefix]).href;
  return null;
}
/* https://cdn.jsdelivr.net/npm/@scope/name@1.2.3/path/to/file.js -> package + path inside the tarball */
function packageOf(url) {
  const m = url.match(/^https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^/@]+)@([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, name, version, file] = m;
  const base = name.includes("/") ? name.split("/")[1] : name;
  return { name, version, file, tarball: `${REGISTRY}/${name}/-/${base}-${version}.tgz`, prefix: `package/` };
}

/* ---------- 2. module graph, read from the CDN or from npm tarballs ---------- */
const IMPORT_RE = /(?:^|[^\w$])(?:import|export)\s*(?:[\s\S]{0,4000}?\bfrom\s*)?"([^"]+)"|import\s*\(\s*"([^"]+)"\s*\)|import\s*\(\s*'([^']+)'\s*\)/g;
/* assets a module resolves next to itself at runtime (wasm binaries, textures, ...) */
const ASSET_RE = /new\s+URL\s*\(\s*"([^"]+)"\s*,\s*import\.meta\.url\s*\)/g;
const tarballs = new Map();
async function fetchNpmFile(url) {
  const info = packageOf(url);
  if (!info) throw Object.assign(new Error(`not an npm CDN url: ${url}`), { unreachable: true });
  if (!tarballs.has(info.tarball)) {
    const res = await fetch(info.tarball, { redirect: "follow" });
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} for ${info.tarball}`), { unreachable: true });
    tarballs.set(info.tarball, unpackTar(zlib.gunzipSync(Buffer.from(await res.arrayBuffer()))));
  }
  const file = tarballs.get(info.tarball).get(info.prefix + info.file);
  if (!file) throw Object.assign(new Error(`${info.file} is not inside ${info.tarball}`), { unreachable: true });
  return file;
}
/* minimal ustar reader (npm tarballs are plain gzip + ustar, names fit with the prefix field) */
function unpackTar(buf) {
  const files = new Map();
  for (let o = 0; o + 512 <= buf.length;) {
    const name = buf.toString("utf8", o, o + 100).replace(/\0.*$/, "");
    if (!name) break;
    const prefix = buf.toString("utf8", o + 345, o + 500).replace(/\0.*$/, "");
    const size = parseInt(buf.toString("utf8", o + 124, o + 136).replace(/\0.*$/, "").trim() || "0", 8) || 0;
    const type = buf.toString("utf8", o + 156, o + 157);
    const full = prefix ? `${prefix}/${name}` : name;
    if (type === "0" || type === "\0" || type === "") files.set(full, buf.subarray(o + 512, o + 512 + size));
    o += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}
async function fetchBytes(url) {
  if (source === "npm") return fetchNpmFile(url);
  const res = await fetch(url, { redirect: "follow", headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), { unreachable: true });
  return Buffer.from(await res.arrayBuffer());
}

const graph = new Map();   // url -> { sha384, bytes }
const problems = [];
const queue = [...specifiers].map(s => resolveSpecifier(s, `${CDN}/`));
let unreachable = 0;
while (queue.length) {
  const url = queue.shift();
  if (!url || graph.has(url)) continue;
  if (!url.startsWith(`${CDN}/npm/`)) { problems.push(`unexpected origin in the module graph: ${url}`); continue; }
  if (graph.size >= MAX_FILES) { problems.push(`module graph is larger than ${MAX_FILES} files -- stopping`); break; }
  let bytes;
  try { bytes = await fetchBytes(url); }
  catch (error) {
    unreachable++;
    console.error(`could not read: ${url}\n  ${error && error.message}`);
    continue;
  }
  graph.set(url, { sha384: crypto.createHash("sha384").update(bytes).digest("base64"), bytes: bytes.length });
  const text = bytes.toString("utf8");
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] || m[2] || m[3];
    if (spec.startsWith("node:")) continue;      /* Node-only branch inside the MMD loader: never runs in a browser */
    const next = resolveSpecifier(spec, url);
    if (next) queue.push(next);
    else problems.push(`unmapped import "${spec}" inside ${url}`);
  }
  for (const m of text.matchAll(ASSET_RE)) queue.push(new URL(m[1], url).href);
}
if (unreachable && !graph.size) { console.error(`could not reach the ${source === "npm" ? "npm registry" : "CDN"} -- nothing checked`); process.exit(3); }

/* ---------- 3. compare / update / list ---------- */
const urls = [...graph.keys()].sort();
if (mode === "list") {
  for (const url of urls) console.log(`${String(graph.get(url).bytes).padStart(9)}  ${url}`);
  console.log(`\n${urls.length} module(s), ${specifiers.size} entry specifier(s), source=${source}`);
  process.exit(0);
}
if (mode === "update") {
  const lock = { note: "SHA-384 of every module trk! loads from cdn.jsdelivr.net (npm package files). Run: npm run check:cdn", source, entries: {} };
  for (const url of urls) lock.entries[url] = { sha384: graph.get(url).sha384, bytes: graph.get(url).bytes };
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
  console.log(`wrote ${path.relative(root, LOCK)} from ${source}: ${urls.length} module(s)`);
  for (const url of urls) console.log(`  ${url.slice(`${CDN}/npm/`.length)}`);
  process.exit(0);
}
let old = { entries: {} };
try { old = JSON.parse(fs.readFileSync(LOCK, "utf8")); } catch (_) { console.error(`missing or unreadable ${path.relative(root, LOCK)} -- run with --update`); process.exit(1); }
let failed = 0, missing = 0, extra = 0;
for (const url of urls) {
  const now = graph.get(url), was = old.entries[url];
  if (!was) { missing++; console.log(`NEW     ${url}`); continue; }
  if (was.sha384 === now.sha384) console.log(`ok      ${url.slice(`${CDN}/npm/`.length)}  (${now.bytes} bytes)`);
  else { failed++; console.log(`CHANGED ${url}\n          expected sha384-${was.sha384}\n          got      sha384-${now.sha384}`); }
}
for (const url of Object.keys(old.entries)) if (!graph.has(url)) { extra++; console.log(`GONE    ${url} (no longer imported)`); }
console.log("");
for (const problem of problems) console.log(`WARN    ${problem}`);
if (failed || missing || extra || problems.length) {
  console.log(`CDN check (${source}): ${failed} changed, ${missing} new, ${extra} gone, ${problems.length} warning(s)`);
  console.log("If this is not an intentional version bump, do not trust the site: re-check tools/cdn-lock.json and");
  console.log("stay away from the VRM / MMD features until the source looks right again (see docs/SECURITY.md).");
  process.exit(1);
}
console.log(`CDN check (${source}): passed - ${urls.length} module(s) match tools/cdn-lock.json`);
