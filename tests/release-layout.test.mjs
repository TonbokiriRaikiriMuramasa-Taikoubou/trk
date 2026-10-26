// SPDX-License-Identifier: GPL-3.0-or-later
/* trk204: 📦 配布ZIPの形をそろえる（ZIPを開くと index.html・README.txt・trk-files/ の3つだけ）。
   1.0.6 のころに試作した「index.html と README だけが見える構成」を、1.0.8 から本番の形にする。
   ルートの index.html は入口（trk-files/index.html へ進むだけ）、アプリ本体は trk-files/ の中。
   ・OS別のZIPは作らない（同じアプリ本体で Windows・macOS・Linux が動く）
   tests で確かめること：組み立て（形・時刻・manifest）・検査（余計なものがルートにあったら失敗）・
   ZIP の名前・入口の作り（file:// でも進める・古い Service Worker を外す）・.gitignore */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./helpers/browser-data.mjs";
import { buildRelease, checkLayout, LAUNCHER_HTML, WRAPPER_ENTRIES } from "../tools/prepare-release.mjs";

const TOOL = path.join(ROOT, "tools/prepare-release.mjs");

function fixture({ cache = "trk-v2026.10.27-trk204" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trk-release-"));
  const app = path.join(dir, "app");
  fs.mkdirSync(path.join(app, "js"), { recursive: true });
  fs.mkdirSync(path.join(app, "icons"), { recursive: true });
  fs.writeFileSync(path.join(app, "index.html"), "<!doctype html><title>trk!</title>\n");
  fs.writeFileSync(path.join(app, "sw.js"), `// sw\nconst CACHE = "${cache}";\n`);
  fs.writeFileSync(path.join(app, "release-manifest.json"), JSON.stringify({ product:"trk!", version:"1.0.8", service_worker_cache:"stale", platform:"win-linux" }, null, 2));
  fs.writeFileSync(path.join(app, "js/app.js"), "console.log(1);\n");
  fs.writeFileSync(path.join(app, "icons/icon.svg"), "<svg/>\n");
  const readme = path.join(dir, "README.txt");
  fs.writeFileSync(readme, "trk! かんたん起動\n");
  return { dir, app, readme, cache };
}

test("trk204: the release has just the launcher, the readme and trk-files/", async () => {
  const f = fixture();
  const out = path.join(f.dir, "dist");
  const { stage, files } = await buildRelease({ app: f.app, readme: f.readme, version: "1.0.8", out });
  assert.deepEqual(fs.readdirSync(stage).sort(), [...WRAPPER_ENTRIES].sort(), "ルートは3つだけ");
  assert.deepEqual(WRAPPER_ENTRIES.slice().sort(), ["README.txt", "index.html", "trk-files"], "決めた名前");
  assert.ok(files.includes("trk-files/js/app.js"), "アプリ本体は trk-files/ の中");
  assert.ok(files.includes("README.txt") && files.includes("index.html"));
  assert.ok(!files.some(f2 => f2.startsWith("trk-files/00_START_HERE")), "配布用の起動案内はルートの README.txt に集約");
  assert.equal(fs.readFileSync(path.join(stage, "README.txt"), "utf8"), "trk! かんたん起動\n", "README はそのまま置く");
});

test("trk204: the manifest records the wrapper layout, the archive and the real cache name", async () => {
  const f = fixture();
  const { stage } = await buildRelease({ app: f.app, readme: f.readme, version: "1.0.8", out: path.join(f.dir, "dist") });
  const m = JSON.parse(fs.readFileSync(path.join(stage, "trk-files/release-manifest.json"), "utf8"));
  assert.equal(m.version, "1.0.8");
  assert.equal(m.archive, "trk-1.0.8.zip");
  assert.equal(m.layout, "wrapper");
  assert.deepEqual(m.wrapper, { launcher:"index.html", readme:"README.txt", app:"trk-files", platforms:["win", "linux", "mac"] });
  assert.equal(m.service_worker_cache, f.cache, "sw.js の CACHE を書き写す");
  assert.equal(m.platform, undefined, "OS別に分けない（platform は持たない）");
  assert.equal(m.native_installer, false);
});

test("trk204: the launcher works with no server, and clears an old root-level worker", () => {
  assert.ok(LAUNCHER_HTML.includes('url=trk-files/index.html'), "JavaScript が動かなくても進める（meta refresh）");
  assert.ok(LAUNCHER_HTML.includes('href="trk-files/index.html"'), "リンクでも進める");
  assert.ok(LAUNCHER_HTML.includes("location.replace(dest)"), "履歴を増やさずに置き換える（file:// でも動く）");
  assert.ok(LAUNCHER_HTML.includes('location.protocol !== "file:"'), "file:// では Service Worker を触らない");
  assert.ok(/var oldSw = new URL\("sw\.js", location\.href\)\.href;/.test(LAUNCHER_HTML), "1.0.7 以前のルート直下の worker");
  assert.ok(/w\.scriptURL === oldSw \? r\.unregister\(\) : null/.test(LAUNCHER_HTML), "trk! のものだけ外す");
  assert.ok(LAUNCHER_HTML.includes('var dest = "trk-files/index.html" + location.search + location.hash'), "?safe=1 などを渡す");
});

test("trk204: the layout check refuses stray files, a missing app and a stale cache name", async () => {
  const f = fixture();
  const out = path.join(f.dir, "dist");
  const { stage } = await buildRelease({ app: f.app, readme: f.readme, version: "1.0.8", out });
  assert.equal(checkLayout(stage).ok, true, "組み上がったものは通る");

  const stray = path.join(f.dir, "stray");
  fs.cpSync(stage, stray, { recursive: true });
  fs.writeFileSync(path.join(stray, "00_START_HERE.html"), "x");
  const bad = checkLayout(stray);
  assert.equal(bad.ok, false);
  assert.match(bad.problems.join(" "), /余計なものがあります/);

  const missing = path.join(f.dir, "missing");
  fs.cpSync(stage, missing, { recursive: true });
  fs.rmSync(path.join(missing, "trk-files/sw.js"));
  assert.match(checkLayout(missing).problems.join(" "), /trk-files\/sw\.js がありません/);

  const stale = path.join(f.dir, "stale");
  fs.cpSync(stage, stale, { recursive: true });
  const mp = path.join(stale, "trk-files/release-manifest.json");
  const m = JSON.parse(fs.readFileSync(mp, "utf8")); m.service_worker_cache = "trk-v2026.01.01-old";
  fs.writeFileSync(mp, JSON.stringify(m));
  assert.match(checkLayout(stale).problems.join(" "), /service_worker_cache/);
});

test("trk204: the zip keeps the wrapper folder and the same paths", async () => {
  const f = fixture();
  const out = path.join(f.dir, "dist");
  const { zipPath } = await buildRelease({ app: f.app, readme: f.readme, version: "1.0.8", out, zip: true, date: "2026-10-27T12:00:00Z" });
  assert.equal(path.basename(zipPath), "trk-1.0.8.zip", "OS別に分けないので名前は1つ");
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" }).trim().split("\n").sort();
  assert.deepEqual(listing, [
    "trk-1.0.8/README.txt", "trk-1.0.8/index.html", "trk-1.0.8/trk-files/icons/icon.svg",
    "trk-1.0.8/trk-files/index.html", "trk-1.0.8/trk-files/js/app.js",
    "trk-1.0.8/trk-files/release-manifest.json", "trk-1.0.8/trk-files/sw.js",
  ].sort(), "全部 trk-1.0.8/ の下、形はディレクトリと同じ");
  execFileSync("unzip", ["-t", zipPath], { stdio:"pipe" });
  const stamp = execFileSync("unzip", ["-Z", "-T", zipPath], { encoding: "utf8" });
  assert.match(stamp, /20261027\.120000/, "全エントリの時刻をそろえる（決定的なZIP）");
});

test("trk204: the CLI writes the same layout, and the output is git-ignored", () => {
  const f = fixture();
  const out = path.join(f.dir, "dist");
  execFileSync(process.execPath, [TOOL, `--app=${f.app}`, `--readme=${f.readme}`, "--version=1.0.8", `--out=${out}`, "--zip"], { encoding:"utf8" });
  assert.deepEqual(fs.readdirSync(path.join(out, "trk-1.0.8")).sort(), [...WRAPPER_ENTRIES].sort());
  assert.ok(fs.existsSync(path.join(out, "trk-1.0.8.zip")));
  const ignored = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.match(ignored, /^dist\/$/m, "組み立ての出力は Git に入れない");
  assert.ok(fs.readFileSync(path.join(ROOT, "package.json"), "utf8").includes("prepare-release"), "npm からも呼べる");
});
