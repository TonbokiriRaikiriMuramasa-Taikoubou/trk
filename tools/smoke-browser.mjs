#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* 実ブラウザでのスモーク検査（レビュー項目4の安全網）。npm run check には入れない（ブラウザが要るため）。
 *
 *   SMOKE_CHROME=/path/to/chromium [SMOKE_CHROME_ARGS='["--no-sandbox", …]'] \
 *   SMOKE_PUPPETEER=puppeteer-core \
 *   node tools/smoke-browser.mjs --write      … 基準を tests/fixtures/smoke-baseline.json に書く（変更の前に一度）
 *   node tools/smoke-browser.mjs --compare    … 基準と比べる（譜面の一致・未解決の名前・新しいエラーがあれば終了コード1）
 *
 * 見ること：
 *   1. 起動直後のエラー（pageerror／console.error）
 *   2. 監査（tools/globals-audit.mjs）がトップレベルと判定した名前が、実行時に本当に解決できるか
 *   3. 合成曲の譜面（生成方式 1／2 × 難易度すべて）の一致（ノーツ列のハッシュ）
 *   4. 画面の見えているボタンを順に押したときの新しいエラー
 * window に増減した名前は、名前空間の移行で意図して変わるので「報告のみ」。 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { audit } from "./globals-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODE = process.argv.includes("--write") ? "write" : process.argv.includes("--compare") ? "compare" : null;
if (!MODE) { console.error("使い方：--write か --compare を付けてください（先頭のコメント参照）"); process.exit(2); }
const CLICK_LIMIT = Number(process.env.SMOKE_CLICKS || 400);
const BASELINE = path.join(ROOT, "tests/fixtures/smoke-baseline.json");

/* ---- 合成曲（tests/helpers/synth.mjs と同じ考え方：区間ごとに音量を変える） ---- */
function makeWav() {
  const SR = 22050, DUR = 90, BPM = 120;
  const n = SR * DUR, pcm = new Int16Array(n);
  let s = 99991;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const amp = t => (t < 20 ? 0.04 : t < 40 ? 0.25 : t < 70 ? 0.6 : 0.3);
  const beat = 60 / BPM;
  for (let i = 0; i < n; i++) {
    const t = i / SR, a = amp(t), bt = t % beat;
    const kick = bt < 0.25 ? Math.sin(2 * Math.PI * (120 * Math.exp(-bt * 25)) * bt) * Math.exp(-bt * 18) : 0;
    const hat = (t % (beat / 2)) < 0.02 ? (rnd() * 2 - 1) * 0.25 : 0;
    pcm[i] = Math.max(-32767, Math.min(32767, Math.round(a * (kick * 0.9 + hat) * 32767)));
  }
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + pcm.length * 2, 4); hdr.write("WAVE", 8);
  hdr.write("fmt ", 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(1, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28); hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34);
  hdr.write("data", 36); hdr.writeUInt32LE(pcm.length * 2, 40);
  return Buffer.concat([hdr, Buffer.from(pcm.buffer)]);
}

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".mjs": "text/javascript", ".wasm": "application/wasm" };
function serve() {
  const wav = makeWav();
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (u === "/__smoke.wav") { res.writeHead(200, { "Content-Type": "audio/wav" }); return res.end(wav); }
    if (u === "/__blank.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end("<!doctype html><title>blank</title>"); }
    const f = path.join(ROOT, u === "/" ? "index.html" : u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => server.listen(0, "127.0.0.1", () => r(server)));
}

async function loadPuppeteer() {
  const spec = process.env.SMOKE_PUPPETEER || "puppeteer-core";
  const mod = await import(spec.startsWith("/") ? pathToFileURL(spec).href : spec);
  return mod.default || mod;
}

const uniq = a => [...new Set(a)].sort();

async function main() {
  const puppeteer = await loadPuppeteer();
  const server = await serve();
  const port = server.address().port;
  const launch = { headless: true, args: JSON.parse(process.env.SMOKE_CHROME_ARGS || "[]") };
  if (process.env.SMOKE_CHROME) launch.executablePath = process.env.SMOKE_CHROME;
  const browser = await puppeteer.launch(launch);
  const report = { boot: {}, globals: {}, unresolved: [], charts: {}, clicks: {}, pageErrors: [] };
  try {
    /* 基準：何も読み込んでいない about:blank の window の名前 */
    const blank = await browser.newPage();
    await blank.goto(`http://127.0.0.1:${port}/__blank.html`, { waitUntil: "load" });
    const baseNames = await blank.evaluate(() => Object.getOwnPropertyNames(window));
    await blank.close();

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const errors = [];
    page.on("pageerror", e => errors.push("pageerror: " + e.message));
    const pending = [];
    page.on("console", m => {
      if (m.type() !== "error") return;
      pending.push(Promise.all(m.args().map(a => a.evaluate(x => (x && x.message) ? x.message : String(x)).catch(() => "?")))
        .then(parts => { errors.push("console: " + parts.join(" ").slice(0, 300)); }));
    });
    const flush = async () => { await Promise.all(pending.splice(0)); };
    page.on("dialog", d => d.dismiss().catch(() => {}));
    page.on("filechooser", () => {});
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load", timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await flush();
    report.boot.errors = uniq(errors);
    errors.length = 0;

    /* 2. 名前の解決：監査が宣言とみなした名前（トップレベル）は、実行時に参照できるはず */
    const auditAll = uniq(audit().files.flatMap(f => f.names));
    report.unresolved = await page.evaluate(names => names.filter(n => {
      try { (0, eval)(n); return false; } catch (_) { return true; }
    }), auditAll);
    report.declCount = auditAll.length;

    /* 1・3. window に増えた名前（報告のみ） */
    const appNames = await page.evaluate(() => Object.getOwnPropertyNames(window));
    report.globals.added = uniq(appNames.filter(n => !baseNames.includes(n)));

    /* 3. 譜面：生成方式 × 難易度ごとにノーツ列のハッシュ */
    const diffIds = await page.evaluate(() => (typeof DIFF_IDS !== "undefined" ? DIFF_IDS : []));
    await page.evaluate(async () => {
      const buf = await (await fetch("/__smoke.wav")).arrayBuffer();
      await loadMedia(new File([buf], "smoke.wav", { type: "audio/wav" }), {});
    });
    for (const gen of ["1", "2"]) {
      for (const d of diffIds) {
        const row = await page.evaluate((g, diff) => {
          settings.chartGen = g; settings.difficulty = diff; buildChart();
          const body = JSON.stringify(chart.map(n => [n.time, n.lane ?? n.col ?? n.l ?? null, n.type ?? n.kind ?? null]));
          return { notes: chart.length, level: currentLevel, body };
        }, gen, d);
        report.charts[`gen${gen}/${d}`] = {
          notes: row.notes, level: row.level,
          hash: crypto.createHash("sha256").update(row.body).digest("hex").slice(0, 16),
        };
      }
    }
    errors.length = 0;

    /* 4. 見えているボタンを順に押す。押すたびに新しいエラーが出ないかを見る */
    const clickLabels = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll("button, [role=button]").forEach((b, i) => {
        if (!b.offsetParent || b.disabled) return;
        const label = (b.getAttribute("data-i18n") || b.textContent || b.getAttribute("aria-label") || b.id || "").trim().replace(/\s+/g, " ").slice(0, 40);
        b.setAttribute("data-smoke", String(i));
        out.push({ i, label });
      });
      return out;
    });
    const seen = new Set();
    const clickErrors = [];
    let clicked = 0;
    for (const { i, label } of clickLabels.slice(0, CLICK_LIMIT)) {
      if (/reset|リセット|share|共有|削除|delete|remove|clear|消去|https?:/i.test(label)) continue; // 状態を大きく壊す／外へ出る操作は押さない
      const before = errors.length;
      const ok = await page.evaluate(idx => {
        const b = document.querySelector(`[data-smoke="${idx}"]`);
        if (!b || !b.offsetParent) return false;
        b.click(); return true;
      }, String(i)).catch(() => false);
      if (!ok) continue;
      clicked++;
      await new Promise(r => setTimeout(r, 120));
      await flush();
      if (errors.length > before) {
        for (const e of errors.slice(before)) {
          const key = `${label} :: ${e}`;
          if (!seen.has(key)) { seen.add(key); clickErrors.push({ label, error: e }); }
        }
      }
      // 押した結果でページを離れたら戻す
      const pages = await browser.pages();
      for (const p of pages) if (p !== page && p.url() !== "about:blank") await p.close().catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
    }
    report.clicks = { candidates: clickLabels.length, clicked, errors: clickErrors };
    await flush();
    report.pageErrors = uniq(errors);
  } finally {
    await browser.close().catch(() => {});
    server.close();
  }
  return report;
}

let report;
try {
  report = await main();
} catch (e) {
  console.log("NG\n- 実行中の例外: " + String(e && e.message || e).split("\n")[0]);
  process.exit(1);
}
const summary = {
  boot: report.boot.errors.length, unresolved: report.unresolved.length,
  decls: report.declCount, added: report.globals.added.length,
  charts: Object.keys(report.charts).length, clicks: report.clicks.clicked,
  clickErrors: report.clicks.errors.length,
};
console.log(JSON.stringify(summary));
if (MODE === "write") {
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(report, null, 1) + "\n");
  console.log(`wrote ${path.relative(ROOT, BASELINE)}`);
} else {
  const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  const problems = [];
  for (const [k, v] of Object.entries(base.charts)) {
    const now = report.charts[k];
    if (!now || now.hash !== v.hash || now.notes !== v.notes || now.level !== v.level) problems.push(`譜面が変わった: ${k}（${v.notes} → ${now ? now.notes : "なし"}）`);
  }
  if (report.unresolved.length) problems.push(`実行時に解決できない宣言: ${report.unresolved.join(", ")}`);
  const baseErr = new Set([...base.boot.errors, ...base.pageErrors, ...base.clicks.errors.map(e => e.error)]);
  for (const e of [...report.boot.errors, ...report.pageErrors, ...report.clicks.errors.map(x => x.error)]) {
    if (!baseErr.has(e)) problems.push(`新しいエラー: ${e}`);
  }
  const addedNow = new Set(report.globals.added), addedBase = new Set(base.globals.added);
  const diff = { gained: [...addedNow].filter(n => !addedBase.has(n)), lost: [...addedBase].filter(n => !addedNow.has(n)) };
  if (diff.gained.length || diff.lost.length) console.log("window の名前の増減（報告のみ）:", JSON.stringify(diff));
  if (problems.length) { console.log("NG\n- " + problems.join("\n- ")); process.exit(1); }
  console.log("OK：譜面・未解決の名前・新しいエラーはありません");
}
