#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * trk! static security check (🛡).
 *
 * `npm run check` の一部として走る、静的な「守りが残っているか」の見張り番。
 * ここが見ているのは、過去に洗い出して塞いだ穴が **戻ってこないこと**（回帰よけ）:
 *
 *   1. コード実行につながる書き方（eval / new Function / document.write / srcdoc / 素の innerHTML）
 *   2. 外から来た文字列を <a href> にするときに、https の関所（safeHttpUrl / safeLink）を通しているか
 *   3. 共有ファイル（パック・譜面・スキン・TVスキン・エフェクト・公認リスト）の検証関数が残っているか
 *   4. 設定の読み込みが __proto__ / constructor / prototype を踏まないか
 *   5. ZIP（.stpack）の展開が、宣言サイズを信用せず上限で止まるか
 *   6. アドオンが安全モードで止まり、遠隔のコードを取りに行かないか
 *   7. ページから出ていく通信が、許した相手だけか（同一オリジン / jsDelivr の import map のみ）
 *   8. ファイル選択が読み取り専用か（createWritable など書き込みAPIを使っていないか）
 *
 * 実行: node tools/check-security.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = rel => fs.readFileSync(path.join(root, rel), "utf8");
const exists = rel => fs.existsSync(path.join(root, rel));
const jsFiles = fs.readdirSync(path.join(root, "js")).filter(f => f.endsWith(".js"));
const js = Object.fromEntries(jsFiles.map(f => ["js/" + f, read("js/" + f)]));
const allJs = Object.entries(js);
const indexHtml = read("index.html");
const sw = read("sw.js");

let pass = 0, failed = 0;
const rule = (ok, label, detail = "") => {
  if (ok) { pass++; console.log("OK    " + label + (detail ? " — " + detail : "")); }
  else { failed++; console.log("FAIL  " + label + (detail ? " — " + detail : "")); }
};
const occurrences = (text, re) => [...text.matchAll(re)];

/* ---------- 1. コード実行につながる書き方 ---------- */
{
  const bad = [];
  for (const [file, text] of allJs) {
    for (const re of [/\beval\s*\(/g, /new\s+Function\s*\(/g, /document\.write\s*\(/g, /\bsrcdoc\b/g,
      /createContextualFragment\s*\(/g, /set(?:Timeout|Interval)\s*\(\s*["'`]/g]) {
      for (const m of occurrences(text, re)) bad.push(`${file}: ${m[0].trim()}`);
    }
  }
  rule(bad.length === 0, "no dynamic code-execution sinks in js/", bad.slice(0, 3).join(" · "));

  /* innerHTML は、ゲーム結果画面の1か所だけ（すべて esc() を通した文字列）。増えたら気づけるようにする。 */
  const inner = [];
  for (const [file, text] of allJs) for (const m of occurrences(text, /\.innerHTML\s*=/g)) inner.push(file);
  const gameOnly = inner.every(f => f === "js/game.js");
  const gameUsesEsc = !js["js/game.js"] || !inner.includes("js/game.js") || /esc\(/.test(js["js/game.js"]);
  rule(gameOnly && gameUsesEsc, "innerHTML is limited to the esc()d result screen", inner.join(", ") || "none");
}

/* ---------- 2. リンクの関所 ---------- */
{
  const helpers = js["js/core.js"].includes("function safeHttpUrl(") && js["js/core.js"].includes("function safeLink(") &&
    js["js/core.js"].includes('u.protocol === "https:"');
  rule(helpers, "safeHttpUrl / safeLink exist in core.js (https only, no javascript:/data:)");

  /* `X.href = 何か.url` のような「外から来た URL をそのまま href にする」形を探す */
  const rawHref = [];
  for (const [file, text] of allJs) {
    for (const m of occurrences(text, /\.href\s*=\s*[^;\n]*?\.(?:url|link|srcUrl|href)\b[^;\n]*/g)) {
      const line = m[0];
      if (/safeHttpUrl|safeLink|createObjectURL/.test(line)) continue;
      rawHref.push(file + ": " + line.trim());
    }
  }
  rule(rawHref.length === 0, "no raw `href = …url` assignments left (use safeLink)", rawHref.slice(0, 2).join(" · "));

  /* target=_blank には rel=noopener。JS と HTML の両方を見る。 */
  const jsBlank = [];
  for (const [file, text] of allJs) {
    for (const m of occurrences(text, /target\s*=\s*"_blank"/g)) {
      /* 同じ文の前後（rel は target の前でも後でも書ける。safeLink は次の行で rel を付けている） */
      const around = text.slice(Math.max(0, m.index - 200), m.index + 220);
      if (/noopener/.test(around)) continue;
      jsBlank.push(file + ": " + text.slice(m.index, m.index + 40).trim());
    }
  }
  const htmlBlank = occurrences(indexHtml, /<a\b[^>]*target="_blank"[^>]*>/g)
    .filter(m => !/rel="[^"]*noopener/.test(m[0])).map(m => m[0].slice(0, 60));
  rule(jsBlank.length === 0 && htmlBlank.length === 0, "every target=_blank link carries rel=noopener",
    [...jsBlank, ...htmlBlank].slice(0, 2).join(" · "));
}

/* ---------- 3. 共有ファイルの検証関数 ---------- */
{
  const need = [
    ["js/custom.js", "function sanitizeManifest(", "パック（pack.json）"],
    ["js/data.js", "function sanitizeSkinDef(", "カスタムスキン"],
    ["js/custom.js", "function sanitizeCreditCard(", "作者の名刺"],
    ["js/custom.js", "const safePath =", "パック内のファイルパス（../ と絶対パスを弾く）"],
    ["js/tv-dock.js", "function sanitizeTvDef(", "カスタムTVスキン"],
    ["js/media.js", "function validateChartData(", "譜面"],
    ["js/verified.js", "function cleanVerified(", "公認リスト"],
    ["js/fx.js", "function cleanPreset(", "エフェクトのプリセット"],
    ["js/fx.js", "function cleanFx(", "エフェクトの段"],
    ["js/favs.js", "function importObj(", "⭐の書き出し/読み込み"],
  ];
  const missing = need.filter(([file, token]) => !js[file].includes(token)).map(([, , what]) => what);
  rule(missing.length === 0, "validators for every shared file format are present", missing.join(", "));

  const packGuards = js["js/custom.js"].includes('!p.includes("..")') && js["js/custom.js"].includes("PATH_RE.test(p)") &&
    js["js/custom.js"].includes("file.size > PACK_MAX");
  rule(packGuards, "pack paths and size caps are enforced (no zip-slip, no 500MB+ packs)");

  const httpsOnly = js["js/library.js"].includes("/^https:\\/\\/\\S+$/i") && js["js/verified.js"].includes("/^https:\\/\\/[^\\s\"'<>]+$/");
  rule(httpsOnly, "shared links are https-only at import time (playlists / verified list)");
}

/* ---------- 4. 設定の読み込み（プロトタイプ汚染よけ） ---------- */
{
  const core = js["js/core.js"];
  const guard = core.includes('const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"])') &&
    core.includes("UNSAFE_KEYS.has(k)") && core.includes("Object.prototype.hasOwnProperty.call(settings, k)");
  rule(guard, "the settings import skips __proto__ / constructor / prototype and inherited keys");

  /* ほかに「外から来たオブジェクトを settings へ丸ごと代入」する形がないか */
  const loose = [];
  for (const [file, text] of allJs) {
    for (const m of occurrences(text, /settings\[[a-zA-Z_$][\w$]*\]\s*=\s*[^;\n]*(?:data|raw|json)\b[^;\n]*/g)) {
      if (file === "js/core.js" && /UNSAFE_KEYS/.test(text)) continue;
      loose.push(file + ": " + m[0].trim().slice(0, 60));
    }
  }
  rule(loose.length === 0, "no unguarded mass-assignment of imported objects into settings", loose.slice(0, 2).join(" · "));
}

/* ---------- 5. ZIP の展開上限（圧縮爆弾よけ） ---------- */
{
  const custom = js["js/custom.js"];
  const capped = custom.includes("async function inflateEntry(e, limit = 0, label = \"\")") &&
    custom.includes("const reader = stream.getReader(), chunks = []") &&
    custom.includes("if (size > limit) throw new PackError(\"packFileTooBig\"") &&
    custom.includes("await inflateEntry(ent, lim, path)") && custom.includes("await inflateEntry(entries[mf], PACK_MB, mf)");
  rule(capped, "pack entries are inflated with a streaming size cap (a lying usize cannot exhaust memory)");
}

/* ---------- 5b. 共有プレイリスト（他人から受け取るファイル） ---------- */
{
  const lib = js["js/library.js"];
  const openGuard = lib.includes("function plOpenLink(url)") && lib.includes("url = safeHttpUrl(url);") &&
    lib.includes("if (!url) return;");
  rule(openGuard, "plOpenLink re-validates https at the moment it opens (not only at import)", "");

  const metaGuard = lib.includes("function songMetaClean(raw)") && lib.includes("function songMetaCleanAll(obj)") &&
    lib.includes("let SONG_META = songMetaCleanAll(") && lib.includes("const SONG_META_MAX = 3000") &&
    lib.includes("/^https:\\/\\/\\S+$/i.test(url)");
  rule(metaGuard, "per-song profiles (SONG_META) are sanitised on load, https-only, and capped");

  /* コメント（「handle.remove() は呼ばない」という注意書き）を外してから、実行される呼び出しだけを見る */
  const libCode = lib.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const shareClean = lib.includes('await libKV.del("share")') && lib.includes('await libKV.del("dir")') &&
    !/[\w.]*handle\.remove\s*\(/.test(libCode);
  rule(shareClean, "🚫 共有をやめる drops both remembered folder handles and never calls handle.remove() (which would delete the real folder)");

  const sharedOk = lib.includes('raw.format !== "trk-playlist"') && lib.includes("https:\\/\\/\\S+$/i.test(String(s.srcUrl") &&
    lib.includes("slice(0, 1000)") && lib.includes("slice(0, 24)");
  rule(sharedOk, "shared playlist files are format-checked with song/tag/length caps (no media, no code)");
}

/* ---------- 6. アドオン ---------- */
{
  const addons = js["js/addons.js"];
  const safeGate = addons.includes("const safeNow = () => {") && addons.includes('window.TrkSafeMode') &&
    addons.includes('sp.has("safe")') && addons.includes('sp.has("factory")') && addons.includes("if (safeNow())");
  const codeCap = addons.includes("MAX_CODE = 512 * 1024") && addons.includes("code.length > MAX_CODE");
  rule(safeGate && codeCap, "add-ons stay off in safe mode and have a code size cap");

  const sample = (addons.match(/const SAMPLE_URL = "([^"]+)"/) || [])[1] || "";
  const remoteFetches = [];
  for (const [file, text] of allJs) {
    for (const m of occurrences(text, /fetch\(\s*["'`](https?:\/\/[^"'`\s]+)/g)) remoteFetches.push(file + ": " + m[1]);
  }
  rule(!/^https?:/.test(sample) && remoteFetches.length === 0, "no remote code/JSON is fetched from js/ at runtime",
    remoteFetches.slice(0, 3).join(" · ") || "sample: " + (sample || "?"));
}

/* ---------- 7. 外へ出る通信の許しリスト ---------- */
{
  const mapStart = indexHtml.indexOf('type="importmap"');
  const mapBlock = mapStart < 0 ? "" : indexHtml.slice(mapStart, indexHtml.indexOf("</script>", mapStart) + 9);
  const origins = [...new Set(occurrences(mapBlock, /https:\/\/([a-z0-9.-]+)/gi).map(m => m[1].toLowerCase()))];
  const allowed = new Set(["cdn.jsdelivr.net"]);
  const badOrigins = origins.filter(o => !allowed.has(o));
  rule(origins.length > 0 && badOrigins.length === 0, "third-party code comes only from the allow-listed CDN (import map)",
    origins.join(", "));

  /* 版は「完全固定」か（範囲・latest を許さない）。CDN は jsDelivr だけ（既存の検査）。 */
  const mapUrls = [...mapBlock.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^/@"]+)@([^/"]+)\//g)];
  const loose = mapUrls.filter(m => !/^\d+\.\d+\.\d+$/.test(m[2]));
  rule(mapUrls.length >= 5 && loose.length === 0, "every CDN import is pinned to an exact version (no ranges, no latest)",
    loose.map(m => `${m[1]}@${m[2]}`).join(" · "));

  let lock = null;
  try { lock = JSON.parse(fs.readFileSync(new URL("../tools/cdn-lock.json", import.meta.url), "utf8")); } catch (_) {}
  const lockUrls = Object.keys((lock && lock.entries) || {});
  const pkgs = [...new Set(mapUrls.map(m => m[1]))];
  const uncovered = pkgs.filter(p => !lockUrls.some(u => u.includes(`/npm/${p}@`)));
  rule(!!lock && lockUrls.length >= 20 && uncovered.length === 0,
    `tools/cdn-lock.json covers every pinned package (${lockUrls.length} modules)`);

  const dyn = [];
  for (const [name, text] of Object.entries(js))
    for (const m of text.matchAll(/\bimport\s*\(\s*"([^"]+)"/g)) dyn.push([name, m[1]]);
  const lazyOk = dyn.length > 0 && dyn.every(([name, spec]) =>
    ["js/vrm.js", "js/mmd.js"].includes(name) && (/^(three|@pixiv\/three-vrm)/.test(spec) || spec.startsWith("three/addons/") || spec.startsWith("@yohawing/")));
  rule(lazyOk, "CDN modules are imported lazily and only from the VRM / MMD files",
    dyn.map(d => `${d[0]}: ${d[1]}`).join(" · "));

  const safeVrm = js["js/core.js"].includes('settings.mascot === "vrm") settings.mascot = "skin"') &&
    js["js/core.js"].includes('settings.mascot === "mmd") settings.mascot = "skin"');
  rule(safeVrm, "safe mode steps back from both VRM and MMD (so it never loads CDN code)");

  const swGuards = sw.includes("url.origin !== SCOPE.origin") && sw.includes('response.type === "basic"') &&
    sw.includes('request.method !== "GET"');
  rule(swGuards, "the service worker caches only same-origin, basic, GET responses");

  const media = js["js/media.js"], library = js["js/library.js"];
  rule(media.includes("const ANALYZE_MAX = 96 * 1024 * 1024") && media.includes('tooBig ? "analysisSkipped"') &&
    !/file\.arrayBuffer\(\)[^\n]*\n[^\n]*ANALYZE/ .test(media),
    "huge media is never read into memory: audio analysis is skipped above ANALYZE_MAX (a 2GB file used to be loaded whole)");
  rule(library.includes("async function addVideoFiles") && library.includes("function probeVideoFile") &&
    library.includes("el.videoWidth > 0 && el.videoHeight > 0") && library.includes("videoReady"),
    "the 🎬 video import waits for a real first frame before marking an item as video, then opens the viewer");
}

/* ---------- 8. ファイルは読み取りだけ ---------- */
{
  const writes = [];
  for (const [file, text] of allJs) {
    for (const re of [/createWritable\s*\(/g, /\.write\s*\(\s*[a-zA-Z]/g, /removeEntry\s*\(/g, /getFileHandle\s*\(/g]) {
      for (const m of occurrences(text, re)) {
        if (file === "js/study-room.js" && /\.write\(/.test(m[0])) continue;   /* IndexedDB への書き込み */
        writes.push(file + ": " + m[0].trim());
      }
    }
  }
  const pickers = allJs.filter(([, text]) => text.includes("showDirectoryPicker"))
    .every(([, text]) => !/mode\s*:\s*"readwrite"/.test(text) && /mode\s*:\s*"read"/.test(text));
  rule(writes.length === 0 && pickers, "folder/file access is read-only (mode:\"read\", no createWritable)",
    writes.slice(0, 3).join(" · "));
}

/* ---------- 8b. 📚 書斎（本文はすべて文字として描く・細工した本文で固まらない） ---------- */
{
  const study = js["js/study-room.js"], util = js["js/study-room-utils.js"];
  const textOnly = !/\.innerHTML\s*=/.test(study) && !/\.outerHTML\s*=/.test(study) &&
    !study.includes("insertAdjacentHTML") && !study.includes("document.write");
  const oneSrc = occurrences(study, /(?:[\w$.\[\]]*\.)src\s*=\s*[^;]+/g)
    .every(m => m[0].startsWith("img.src = url"));   /* 唯一の代入は、許可リストの画像ブロブだけ */
  rule(textOnly && oneSrc, "the study reader renders text only as text nodes (no HTML, no markdown, one blob img.src)",
    onlyIf(!textOnly, "innerHTML/HTML sink found") + onlyIf(!oneSrc, "unexpected .src assignment"));

  /* ルビは線形走査。後戻りのある正規表現に戻っていないか（1MBの漢字だけで数分固まっていた原因） */
  const linear = util.includes("function aozoraSegments(input)") && util.includes("const closeAfter = at =>") &&
    util.includes("const sameLine = p =>") && util.includes("const KANJI_LIKE =") && !util.includes("rubyPattern");
  rule(linear, "the Aozora ruby parser is a single forward scan (no backtracking regex)");

  const noTests = /\/\*[\s\S]*?\*\//g;
  const utilCode = util.replace(noTests, "");
  const risky = [...utilCode.matchAll(/\/[^\/\n]*(?:\[\^[^\]]*\]|\.)[+*][^\/\n]*\/[gimsuy]*/g)]
    .filter(m => /\[\^[^\]]*\]\+|\[\.\]\+/.test(m[0]))
    .map(m => m[0]);
  rule(risky.length === 0, "no backtracking-prone text-matching regex left in the study utils", risky.slice(0, 2).join(" · "));
}
function onlyIf(cond, text) { return cond ? text : ""; }

/* ---------- 9. 説明が残っているか ---------- */
{
  const doc = exists("docs/SECURITY.md") && read("README.md").includes("docs/SECURITY.md") &&
    read("docs/HANDOFF.md").includes("check-security.mjs");
  rule(doc, "docs/SECURITY.md exists and is linked from README / HANDOFF");
}

console.log("");
if (failed) {
  console.log(`Security check: ${failed} failure(s) · ${pass} check(s) passed`);
  process.exit(1);
}
console.log(`Security check: passed · ${pass} check(s) · 0 warning(s)`);
