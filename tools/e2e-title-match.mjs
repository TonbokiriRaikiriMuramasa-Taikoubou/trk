#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
/* クラシック／ブルアカの表記ゆれ：実ブラウザの保存済みClassic → 別名更新 → 灰色行 → 所持曲。
 * ブルアカ実カタログでは装飾付きの2曲と作者違いを検査する。
 * SMOKE_CHROME=/path/to/chromium SMOKE_CHROME_ARGS='["--no-sandbox"]' \
 * SMOKE_PUPPETEER=puppeteer-core node tools/e2e-title-match.mjs
 * 新規のブラウザ文脈と合成WAVだけを使用。Musopenの実音源・音質の検証ではない。
 * npm run check とは別（ブラウザが必要）。 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const spec = process.env.SMOKE_PUPPETEER || "puppeteer-core";
const { default: puppeteer } = await import(spec.startsWith("/") ? pathToFileURL(spec).href : spec);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".wasm": "application/wasm" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://test");
  const file = path.resolve(ROOT, "." + decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "0.0.0.0", r));
let browser;
const supplied = "Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio";
try {
  browser = await puppeteer.launch({ executablePath: process.env.SMOKE_CHROME, headless: true,
    args: JSON.parse(process.env.SMOKE_CHROME_ARGS || "[]") });
  const page = await browser.newPage();
  const errors = [], optional404s = [];
  const optionalOstMissing = !fs.existsSync(path.join(ROOT, "assets/trk-ost/manifest.json"));
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", msg => {
    if (msg.type() !== "error") return;
    const url = msg.location().url || "";
    // 未生成の任意OSTは本体が404を許容する。ほかの404・例外は隠さない。
    if (optionalOstMissing && url.endsWith("/assets/trk-ost/manifest.json") && /status of 404/.test(msg.text())) {
      optional404s.push(url); return;
    }
    errors.push(msg.text() + " " + url);
  });
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => {
    const key = "shadow_taiko_preferences_v2";
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({ tutorialDone: true, welcomeSeen: true, language: "ja",
      previewEnabled: false, libTab: "pl:trk-classic",
      plFolders: [{ id: "trk", name: "trk", parent: "" }, { id: "trk-classic", name: "Classic", parent: "trk" }],
      playlists: [{ id: "trk-classic", cat: "trk:classic",
        name: "My Classic", folder: "trk-classic", songs: [], frozen: false,
        wish: [{ t: "Symphony No.5 - I. Allegro con brio", al: "Symphony No.5 Op.67", ar: "Beethoven",
          u: "https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/" }] }] }));
  });
  const openClassic = () => page.evaluate(() => {
    window.Trk.core.settings.libTab = "pl:trk-classic";
    window.Trk.library.renderLib();
  });
  const state = () => page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-classic");
    return { name: p.name, aliases: p.wish[0].matchAliases, songs: p.songs,
      grey: document.querySelectorAll("#libList .plWishRow").length,
      playable: document.querySelectorAll("#libList .libRow:not(.plWishRow)").length };
  });
  // 合成WAVを実Fileとして追加し、通常のデコード・解析経路の完了を待つ。
  const add = async title => {
    await page.evaluate(async title => {
      const rate = 22050, n = rate * 12, data = new ArrayBuffer(44 + n * 2), v = new DataView(data);
      const text = (at, value) => [...value].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
      text(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); text(8, "WAVE"); text(12, "fmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      text(36, "data"); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin(2 * Math.PI * 440 * i / rate) * 3000, true);
      await window.Trk.library.addSongFiles([new File([data], title + ".wav", { type: "audio/wav" })]);
    }, title);
    await page.waitForFunction(title => window.Trk.core.videoReady && window.Trk.core.currentSong?.title === title, {}, title);
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: "load" });
  await page.waitForFunction(() => window.Trk?.core?.settings?.playlists.find(p => p.id === "trk-classic")?.wish[0]?.matchAliases?.length);
  await openClassic();
  await page.waitForSelector("#libList .plWishRow", { timeout: 5000 });
  assert.deepEqual(await state(), { name: "My Classic", aliases: [supplied], songs: [], grey: 1, playable: 0 });
  console.log("OK  保存済みClassicの別名更新・改名の維持・未所持の灰色行");

  for (const title of [supplied.replace("Op. 67", "Op. 68"), supplied.replace("I. Allegro", "II. Allegro")]) {
    await add(title);
    const s = await state();
    assert.equal(s.grey, 1); assert.equal(s.playable, 0); assert.deepEqual(s.songs, []);
  }
  console.log("OK  別の作品番号／楽章を読み込んでも未所持のまま");

  await page.evaluate(() => { window.Trk.core.settings.playlists.find(p => p.id === "trk-classic").frozen = true; });
  await add(supplied);
  assert.deepEqual((await state()).songs, [], "フリーズ中は自動追加しない");
  await page.evaluate(() => {
    window.Trk.core.settings.playlists.find(p => p.id === "trk-classic").frozen = false;
    window.Trk.library.renderLib();
  });
  const matched = await state();
  assert.equal(matched.grey, 0); assert.equal(matched.playable, 1); assert.equal(matched.songs.length, 1);
  // 解析完了時の再描画で行が置き換わるため、Locatorで安定した行をクリックする。
  await page.locator("#libList .libRow:not(.plWishRow)").click();
  await page.waitForFunction(title => window.Trk.core.videoReady && window.Trk.core.currentSong?.title === title, {}, supplied);
  assert.equal(await page.evaluate(() => window.Trk.core.currentSong.file.name), supplied + ".wav");
  console.log("OK  改名・メモなしで所持行へ／選曲・デコード／フリーズ尊重");

  await page.setViewport({ width: 360, height: 800 });
  assert.equal((await state()).playable, 1);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.Trk?.library?.allSongs().some(s => s.source === "file"));
  await openClassic();
  await page.waitForSelector("#libList .libRow:not(.plWishRow)");
  assert.deepEqual(await state(), matched, "再起動しても名前・照合・所持曲を維持");
  console.log("OK  モバイル幅・再起動後のClassic照合・重複なし");

  // ブルアカは実カタログから自動作成されたVol.1を使う。曲名表示・実ファイル名は変えない。
  await page.evaluate(() => {
    window.Trk.core.settings.libTab = "pl:trk-ba-v1";
    window.Trk.library.renderLib();
  });
  const baRows = () => page.evaluate(() => [...document.querySelectorAll("#libList .libRow")].map(row => ({
    title: row.querySelector(".libName")?.textContent || "", grey: row.classList.contains("plWishRow")
  })));
  let ba = await baRows();
  assert.ok(ba.some(row => row.grey && row.title === "🛒 Constant Moderato"));
  assert.ok(ba.some(row => row.grey && row.title === "🛒 Daily Routine 247"));
  const wrongArtist = "🎧Theme 22 - Daily Routine 247 by KARUT";
  await add(wrongArtist);
  assert.ok((await baRows()).some(row => row.grey && row.title === "🛒 Daily Routine 247"));
  for (const title of ["【高音質】Constant Moderato", "🎧Theme 22 - Daily Routine 247 by Nor"]) {
    await add(title);
    assert.ok((await baRows()).some(row => !row.grey && row.title === title));
    assert.equal(await page.evaluate(() => window.Trk.core.currentSong.file.name), title + ".wav");
  }
  ba = await baRows();
  assert.ok(!ba.some(row => row.grey && /🛒 (?:Constant Moderato|Daily Routine 247)$/.test(row.title)));
  const baOwned = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-v1");
    return window.Trk.library.allSongs().filter(s => p.songs.includes(s.key)).map(s => s.title).sort();
  });
  assert.deepEqual(baOwned, ["【高音質】Constant Moderato", "🎧Theme 22 - Daily Routine 247 by Nor"].sort());
  console.log("OK  ブルアカ実カタログ：高音質・Theme番号・作者クレジットの照合／作者違いの拒否／元の名前維持");

  const mikaWishes = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-mika-kiss");
    window.Trk.core.settings.libTab = "pl:" + p.id;
    window.Trk.library.renderLib();
    return p.wish;
  });
  assert.equal(mikaWishes.length, 5);
  assert.equal((await baRows()).filter(row => row.grey).length, 5);
  // PVと同じ名前のWAVでも、映像を所持した扱いにしない。
  await add(mikaWishes[0].t);
  assert.equal((await baRows()).filter(row => row.grey).length, 5);
  for (const wish of mikaWishes.filter(w => w.matchMedia === "audio")) await add(wish.t);
  assert.equal((await baRows()).filter(row => row.grey).length, 2);
  assert.equal((await baRows()).filter(row => !row.grey).length, 3);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.Trk?.library?.allSongs().some(s => s.title === "Do you wanna kiss angel (伴奏版)"));
  const restored = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-mika-kiss");
    window.Trk.core.settings.libTab = "pl:" + p.id; window.Trk.library.renderLib();
    return { name: p.name, media: p.wish.map(w => w.matchMedia), owned: p.songs.length, guide: p.guide.key };
  });
  assert.deepEqual(restored, { name: "ミカ — kiss angel", media: ["video", "video", "audio", "audio", "audio"], owned: 3, guide: "plGuideBlueArchiveMika" });
  assert.equal((await baRows()).filter(row => row.grey).length, 2);
  assert.equal((await baRows()).filter(row => !row.grey).length, 3);
  assert.deepEqual(errors, [], "pageerror / console.error");
  console.log("OK  ミカの5項目：音源3つだけ所持・同名音声でPVを埋めない・再起動後も媒体条件維持・ページエラー0");
  const ariaWishes = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-mika-aria");
    window.Trk.core.settings.libTab = "pl:" + p.id; window.Trk.library.renderLib();
    return p.wish;
  });
  assert.equal(ariaWishes.length, 3);
  assert.equal((await baRows()).filter(row => row.grey).length, 3);
  await add(ariaWishes[2].t);
  await add(ariaWishes[0].t + " (Instrumental)");
  assert.equal((await baRows()).filter(row => row.grey).length, 3);
  await add(ariaWishes[0].t);
  await add(ariaWishes[1].matchAliases[0]); // 韓国語の公式曲名でも音源を拾う。
  assert.equal((await baRows()).filter(row => row.grey).length, 1);
  assert.equal((await baRows()).filter(row => !row.grey).length, 2);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => window.Trk?.library?.allSongs().some(s => s.title === "따뜻한 푸름과 꼬리별"));
  const ariaRestored = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-mika-aria");
    window.Trk.core.settings.libTab = "pl:" + p.id; window.Trk.library.renderLib();
    return { media: p.wish.map(w => w.matchMedia), owned: p.songs.length, guide: p.guide.key, url: p.wish[2].u };
  });
  assert.deepEqual(ariaRestored, { media: ["audio", "audio", "video"], owned: 2,
    guide: "plGuideBlueArchiveMikaAria", url: "https://www.youtube.com/watch?v=wsq-I61IvwE" });
  assert.equal((await baRows()).filter(row => row.grey).length, 1);
  assert.equal((await baRows()).filter(row => !row.grey).length, 2);
  assert.deepEqual(errors, [], "pageerror / console.error after Aria tests");
  console.log("OK  Aria：音源2曲＋Global本編MV、伴奏・同名音声による誤一致なし、韓国語曲名・再起動保持・ページエラー0");
  const jpWishes = await page.evaluate(() => {
    const p = window.Trk.core.settings.playlists.find(p => p.id === "trk-ba-mika-vocals");
    window.Trk.core.settings.libTab = "pl:" + p.id; window.Trk.library.renderLib();
    return p.wish;
  });
  assert.equal(jpWishes.length, 4);
  await add(jpWishes[3].t);
  await add(jpWishes[1].t + "(Short Ver.)");
  assert.equal((await baRows()).filter(row => row.grey).length, 4);
  for (const wish of jpWishes.filter(w => w.matchMedia === "audio")) await add(wish.t);
  assert.equal((await baRows()).filter(row => row.grey).length, 1);
  assert.equal((await baRows()).filter(row => !row.grey).length, 3);
  assert.deepEqual(errors, [], "pageerror / console.error after Japanese vocals tests");
  console.log("OK  日本語ソロ＆参加曲：歌入り3曲だけ所持、Short・同名音声でMVを埋めない、ページエラー0");
  if (optional404s.length) console.log(`NOTE  未生成の任意OST manifestの404: ${optional404s.length}件（想定内・別記録）`);
} finally {
  if (browser) await browser.close();
  await new Promise(r => server.close(r));
}
