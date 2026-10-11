// SPDX-License-Identifier: GPL-3.0-or-later
/* trk114: deleting an automatic trk playlist leaves a marker so the next start does not recreate it,
 * moving trk's OST Vol.1 is respected after the one-time trk112 migration, and catalog guides carry a
 * dictionary key so the note follows the UI language. The library.js pieces run in a vm sandbox. */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const library = fs.readFileSync(`${ROOT}/js/library.js`, "utf8");
const coreSrc = fs.readFileSync(`${ROOT}/js/core.js`, "utf8");
const catalogSrc = fs.readFileSync(`${ROOT}/js/catalog.js`, "utf8");
const between = (src, start, end) => {
  const a = src.indexOf(start), b = src.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `slice ${start}`);
  return src.slice(a, b);
};
const textBlocks = library.match(/^Object\.assign\(TEXT\.(?:ja|en|zh|ko), \{[\s\S]*?^\}\);$/gm).join("\n");
const catalogContext = vm.createContext({});
vm.runInContext(catalogSrc + "\nglobalThis.__catalog = TRK_CATALOG;", catalogContext);
const catalog = catalogContext.__catalog;
const lol = catalog.find(series => series.id === "lol");
const valorant = catalog.find(series => series.id === "valorant");

function sandbox(settings, { lang = "ja", series = [lol] } = {}) {
  const calls = { saves: 0, ensureGame: 0, ensureClassic: 0 };
  const context = vm.createContext({
    TEXT: { ja: {}, en: {}, zh: {}, ko: {} }, lang, console, calls, window: {},
    core: { settings, saveUserPrefs: () => { calls.saves++; } },
    tr: (key, vars) => {
      let s = context.TEXT[context.lang][key] ?? context.TEXT.en[key] ?? context.TEXT.ja[key] ?? key;
      for (const [k, v] of Object.entries(vars || {})) s = s.split(`{${k}}`).join(String(v));
      return s;
    },
    plToast: () => {}, renderLib: () => {}, ensureTrkFolder: () => {}, plSanitize: raw => raw,
    trkCatalog: () => series, trkWishesForSeries: () => [],
    ensureTrkPlaylist: () => { calls.ensureGame++; return false; },
    ensureTrkClassicPlaylist: () => { calls.ensureClassic++; return false; },
    TRK_PLAYLIST_ID: "trk-playlist", TRK_CLASSIC_ID: "trk-classic", TRK_OST_ID: "trk-ost-v1", TRK_FOLDER_ID: "trk",
    FIRST_SPARK_KEY: "builtin:first-spark-tutorial-v1",
    plById: id => settings.playlists.find(p => p.id === id) || null
  });
  vm.runInContext([
    textBlocks,
    between(library, "function trkWishFromTrack(", "\nfunction trkWishesFromCatalog"),
    between(library, "function trkCatalogGuide(", "\n(function plTighten()"),
    between(library, "const TRK_OST_CAT", "/* 🌐 trk114 より前に作った"),
    between(library, "function trkGuideBackfill()", "function trkOrderedPlaylists("),
    between(library, "const TRK_AUTO_ID", "\n/* 📂 フォルダ内プレイリストのタブを閉じる"),
    between(library, "function plGuideText(", "/* プレイリスト1つの設定"),
    "globalThis.__api = { ensureTrkDistributionPlaylists, ensureTrkOstPlaylist, plDelete, trkRestoreRemoved, trkIsRemoved, trkUnmarkRemoved, trkCatalogGuide, plGuideSanitize, plGuideText, trkGuideBackfill };"
  ].join("\n"), context);
  return { api: context.__api, calls, context };
}
const fresh = () => ({ playlists: [], plFolders: [], libOpenTabs: [], libTab: "all", trkRemoved: [] });

describe("deleted automatic trk playlists stay deleted", () => {
  test("deleting a catalog playlist leaves a marker and the next start skips only that list", () => {
    const settings = fresh();
    const { api } = sandbox(settings);
    api.ensureTrkDistributionPlaylists();
    const total = settings.playlists.length;
    const season3 = settings.playlists.find(p => p.id === "trk-lol-season-3");
    assert.ok(season3 && total === lol.playlists.length);
    api.plDelete(season3);
    assert.deepEqual(settings.trkRemoved, ["trk-lol-season-3"]);
    api.ensureTrkDistributionPlaylists();
    assert.equal(settings.playlists.length, total - 1, "the deleted list is not recreated");
    assert.ok(!settings.playlists.some(p => p.id === "trk-lol-season-3"));
    const own = { id: "pl123abc", name: "mine", songs: [] };
    settings.playlists.push(own);
    api.plDelete(own);
    assert.deepEqual(settings.trkRemoved, ["trk-lol-season-3"], "the user's own playlists never get a marker");
  });

  test("restore clears every marker and recreates the lists", () => {
    const settings = fresh();
    const { api, calls } = sandbox(settings);
    api.ensureTrkDistributionPlaylists();
    api.plDelete(settings.playlists.find(p => p.id === "trk-lol-warsongs"));
    api.plDelete(settings.playlists.find(p => p.id === "trk-lol-season-9"));
    assert.equal(settings.trkRemoved.length, 2);
    const restored = api.trkRestoreRemoved();
    assert.equal(restored, 2);
    assert.equal(settings.trkRemoved.length, 0);
    assert.ok(settings.playlists.some(p => p.id === "trk-lol-warsongs") && settings.playlists.some(p => p.id === "trk-lol-season-9"));
    assert.ok(calls.ensureGame === 1 && calls.ensureClassic === 1, "Game Vol.1 and Classic Vol.1 are offered again too");
  });
});

describe("trk's OST Vol.1", () => {
  test("is created once in the trk folder and then left where the user moves it", () => {
    const settings = fresh();
    const { api } = sandbox(settings);
    assert.equal(api.ensureTrkOstPlaylist({ toast: false }), true);
    const ost = settings.playlists.find(p => p.id === "trk-ost-v1");
    assert.equal(ost.folder, "trk");
    assert.equal(ost.cat, "trk:ost");
    ost.folder = "my-folder";
    assert.equal(api.ensureTrkOstPlaylist({ toast: false }), false);
    assert.equal(ost.folder, "my-folder", "a moved OST is not pulled back");
    ost.folder = "";
    api.ensureTrkOstPlaylist({ toast: false });
    assert.equal(ost.folder, "", "not even when it was moved to the top level");
  });

  test("migrates the trk112 top-level copy once, and a deleted OST is not recreated", () => {
    const settings = fresh();
    settings.playlists.push({ id: "trk-ost-v1", name: "trk's OST Vol.1", folder: "", cat: "", songs: [] });
    const { api } = sandbox(settings);
    api.ensureTrkOstPlaylist({ toast: false });
    assert.equal(settings.playlists[0].folder, "trk");
    assert.equal(settings.playlists[0].cat, "trk:ost");
    api.plDelete(settings.playlists[0]);
    assert.deepEqual(settings.trkRemoved, ["trk-ost-v1"]);
    assert.equal(api.ensureTrkOstPlaylist({ toast: false }), false);
    assert.equal(settings.playlists.length, 0);
    api.trkRestoreRemoved();
    assert.ok(settings.playlists.some(p => p.id === "trk-ost-v1"));
  });
});

describe("catalog guides follow the UI language", () => {
  test("guides store a whitelisted key plus the Japanese note, and display in the current language", () => {
    const settings = fresh();
    const { api, context } = sandbox(settings, { lang: "en" });
    const season9 = lol.playlists.find(pl => pl.id === "lol-season-9");
    const guide = api.trkCatalogGuide(lol, season9, true);
    assert.equal(guide.key, "plGuideLolCsVerified");
    assert.equal(guide.note, context.TEXT.ja.plGuideLolCsVerified);
    assert.match(api.plGuideText(guide), /^Official SoundCloud album/);
    context.lang = "ko";
    assert.match(api.plGuideText(guide), /공식 SoundCloud/);
    assert.equal(api.plGuideText({ note: "保存した控え", url: "", key: "plGuideNoSuchKey" }), "保存した控え");
    assert.equal(api.plGuideSanitize({ note: "x", url: "javascript:alert(1)", key: "__proto__" }).key, undefined);
    assert.equal(api.plGuideSanitize({ note: "x", url: "javascript:alert(1)" }).url, "");
    assert.equal(api.plGuideSanitize({ note: "y".repeat(500), url: "" }).note.length, 160);
  });

  test("LoL wording matches each playlist's Creator-Safe status", () => {
    const { api, context } = sandbox(fresh());
    const keyOf = id => api.trkCatalogGuide(lol, lol.playlists.find(pl => pl.id === id), true).key;
    assert.equal(keyOf("lol-season-9"), "plGuideLolCsVerified");
    assert.equal(keyOf("lol-season-8"), "plGuideLolCsVerified");
    /* trk115：101曲目以降（songdata.io の一覧）で Season 1〜7 を全曲照合。Warsongs は11曲中10曲 */
    for (let n = 1; n <= 7; n++) assert.equal(keyOf("lol-season-" + n), "plGuideLolCsVerified", "Season " + n);
    assert.equal(keyOf("lol-warsongs"), "plGuideLolCsPartial");
    /* trk116：残りのリストも全件照合。Sessions は Vi・Taliyah が全曲、Diana が43曲中42曲。
       公式リンク集は Champion Theme 39/41・Worlds 1/13 が一部、MSI・K/DA は見当たらない */
    assert.equal(keyOf("lol-svi"), "plGuideLolCsVerified");
    assert.equal(keyOf("lol-staliyah"), "plGuideLolCsVerified");
    assert.equal(keyOf("lol-sdiana"), "plGuideLolCsPartial");
    assert.equal(keyOf("lol-champion-themes"), "plGuideRiotLinksPartial");
    assert.equal(keyOf("lol-worlds-anthems"), "plGuideRiotLinksPartial");
    assert.equal(keyOf("lol-msi-anthems"), "plGuideRiotLinksAbsent");
    assert.equal(keyOf("lol-kda-songs"), "plGuideRiotLinksAbsent");
    assert.equal(keyOf("lol-popular-tracks"), "plGuideLolPopular");
    assert.equal(api.trkCatalogGuide(lol, { id: "lol-mod-list", creatorSafe: "verified-by-mod?" }, true).key, "plGuideRiotLinks",
      "an unknown status never reads as Creator-Safe");
    assert.match(context.TEXT.ja.plGuideLolCsPartial, /一部の曲はCreator-Safe対象.*見当たらない・要確認/);
    assert.match(context.TEXT.ja.plGuideRiotLinksPartial, /^公式リンク集.*一部の曲はCreator-Safe対象.*見当たらない/);
    assert.match(context.TEXT.ja.plGuideRiotLinksAbsent, /^公式リンク集.*見当たらない.*Creator-Safe対象外・要確認/);
    for (const key of ["plGuideLolCsPartial", "plGuideRiotLinksPartial", "plGuideRiotLinksAbsent", "plGuideLolPopular"]) {
      assert.doesNotMatch(context.TEXT.ja[key], /可能性が高い/, key + " never claims the songs it did not find");
      for (const lang of ["en", "zh", "ko"]) assert.ok(context.TEXT[lang][key] && context.TEXT[lang][key] !== context.TEXT.ja[key], key + " " + lang);
    }
    for (const lang of ["ja", "en", "zh", "ko"]) {
      assert.equal(context.TEXT[lang].plGuideLolCsLikely, undefined, lang);
      assert.equal(context.TEXT[lang].plGuideLolSessions, undefined, lang);
    }
    for (const retired of ["likely", "sessions"])
      assert.equal(api.trkCatalogGuide(lol, { id: "lol-old", creatorSafe: retired }, true).key, "plGuideRiotLinks",
        "the retired '" + retired + "' status falls back to the links-only wording");
    assert.match(context.TEXT.ja.plGuideLolPopular, /一部だけCreator-Safe対象.*共同制作曲などは対象外・要確認/);
    /* trk117：VALORANT も同じ状態と文言。公式Creator-Safe Playlist（全40曲）に収録の9曲は見当たらない */
    for (const pl of valorant.playlists) {
      assert.equal(pl.creatorSafe, "links-absent", pl.id);
      const guide = api.trkCatalogGuide(valorant, pl);
      assert.equal(guide.key, "plGuideRiotLinksAbsent", pl.id);
      assert.equal(guide.url, "https://www.riotgames.com/en/riot-music-creator-safe-guidelines", pl.id);
    }
    assert.equal(api.trkCatalogGuide(valorant, { id: "val-mod", creatorSafe: "verified-by-mod?" }).key, "plGuideRiotLinks",
      "an unknown VALORANT status never reads as Creator-Safe");
    assert.equal(api.trkCatalogGuide(valorant).key, "plGuideRiotLinks", "the series itself keeps the links-only wording");
    assert.doesNotMatch(context.TEXT.ja.plGuideRiotLinksAbsent, /LoL|League/, "the shared wording names no single game");
    assert.ok(context.TEXT.ja.plGuideLolPopular.length <= 80, "the popular-tracks note stays short");
  });

  test("Game Vol.1 / Classic Vol.1 created before trk114 get a key without losing their URL", () => {
    const settings = fresh();
    settings.playlists.push({ id: "trk-playlist", guide: { note: "非営利の紹介プレイリスト。", url: "https://example.com/kept" } },
      { id: "trk-classic", guide: { note: "版権切れ", url: "https://musopen.org/" } },
      { id: "pl-user", guide: { note: "mine", url: "" } });
    const { api } = sandbox(settings);
    api.trkGuideBackfill();
    assert.equal(settings.playlists[0].guide.key, "plGuideGameVol1");
    assert.equal(settings.playlists[0].guide.url, "https://example.com/kept");
    assert.equal(settings.playlists[1].guide.key, "plGuideClassic");
    assert.equal(settings.playlists[2].guide.key, undefined);
  });
});

describe("settings: the deletion marker is validated", () => {
  const clean = new Function(`${between(coreSrc, "function cleanTrkRemoved(", "\nfunction guessLang")}\nreturn cleanTrkRemoved;`)();
  test("keeps only unique trk- IDs, newest 200", () => {
    assert.deepEqual(clean(["trk-lol-season-3", "pl-user", 42, "trk-lol-season-3", "trk-th-mcd_02", "__proto__"]), ["trk-lol-season-3", "trk-th-mcd_02"]);
    assert.deepEqual(clean("trk-ost-v1"), []);
    assert.equal(clean(Array.from({ length: 300 }, (_, i) => "trk-x" + i)).length, 200);
  });
  test("defaults, factory reset and settings import all go through the validator", () => {
    assert.match(coreSrc, /trkRemoved: cleanTrkRemoved\(prefs\.trkRemoved\)/);
    assert.match(coreSrc, /settings\.trkRemoved = \[\];/);
    assert.match(coreSrc, /settings\.trkRemoved = cleanTrkRemoved\(data\.trkRemoved\)/);
  });
});
