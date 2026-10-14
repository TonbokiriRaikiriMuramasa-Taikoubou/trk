// SPDX-License-Identifier: GPL-3.0-or-later
/* ミカ曲：公式ページの固定記録、5項目の媒体・言語の分離、保存時の条件維持。 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const fixture = JSON.parse(fs.readFileSync(`${ROOT}/tools/bluearchive-mika-tracklist.json`, "utf8"));
const lib = fs.readFileSync(`${ROOT}/js/library.js`, "utf8");
const between = (a, b) => {
  const start = lib.indexOf(a), end = lib.indexOf(b, start);
  assert.ok(start >= 0 && end > start, a);
  return lib.slice(start, end);
};
const ctx = vm.createContext({ metaOf: () => null, PL_COLORS: { none: "", pink: "pink" } });
vm.runInContext([
  fs.readFileSync(`${ROOT}/js/catalog.js`, "utf8"),
  fs.readFileSync(`${ROOT}/js/title-match.js`, "utf8"),
  between("function plWishMatch(", "function plSyncWishes("),
  between("function plSanitize(", "const TRK_PLAYLIST_ID"),
  between("function plGuideSanitize(", "function plGuideJa("),
  between("function trkWishFromTrack(", "function trkWishesFromCatalog("),
  `globalThis.api = { plWishMatch, plSongMatchKeys, plWishMediaMatches, plSanitize, trkWishFromTrack };
   globalThis.ba = TRK_CATALOG.find(s => s.id === "bluearchive");`
].join("\n"), ctx);
const { api, ba } = ctx;
const playlist = ba.playlists.find(p => p.id === fixture.playlistId);
const clean = x => JSON.parse(JSON.stringify(x));
const index = items => {
  const map = new Map();
  for (const it of items) for (const key of api.plSongMatchKeys(it.title, it.hint)) {
    const hits = map.get(key) || [];
    if (!hits.includes(it)) hits.push(it);
    map.set(key, hits);
  }
  return map;
};
const local = (title, kind) => ({ key: `${kind}|${title}`, title,
  file: { name: title + (kind === "video" ? ".mp4" : ".m4a"), type: kind + "/mp4" } });

test("confirmed five match the source ledger; existing 225 OST tracks stay separate", () => {
  assert.equal(ba.playlists.length, 11);
  assert.equal(ba.playlists.filter(p => /^ba-v[1-8]$/.test(p.id)).flatMap(p => p.songs).length, 225);
  assert.equal(playlist.name, fixture.playlistName);
  assert.ok(playlist.name.length <= 24);
  assert.equal(playlist.sourceUrl, fixture.guideUrl);
  assert.deepEqual(clean(playlist.songs), fixture.tracks.map(({ durationSeconds, ...track }) => track));
  assert.deepEqual(playlist.songs.map(t => t.matchMedia).join(","), "video,video,audio,audio,audio");
  assert.ok(playlist.songs.every(t => !/short|by angel/i.test(t.t + " " + t.matchAliases.join(" "))));
});

for (let i = 0; i < fixture.tracks.length; i++) test(`only the right language/medium matches: ${fixture.tracks[i].t}`, () => {
  const track = playlist.songs[i];
  for (const title of [track.t, ...track.matchAliases]) {
    for (const prefix of ["", "【高音質】"]) {
      const file = local(prefix + title, track.matchMedia);
      const hits = playlist.songs.filter(w => api.plWishMatch(w, index([file])));
      assert.deepEqual(hits.map(w => w.t).join(), track.t);
      const wrong = local(prefix + title, track.matchMedia === "audio" ? "video" : "audio");
      assert.equal(api.plWishMatch(track, index([wrong])), null);
    }
  }
});

test("unmarked titles, old typo and Short versions do not fill any of the five rows", () => {
  for (const title of ["Do you wanna kiss angel", "Do you wanna kiss by angel", "Do you wanna kiss angel (JP Ver. (Short))",
    "Do you wanna kiss angel - CN Ver. (Short)", "Do you wanna kiss angel (JP MV) (Short)"]) {
    for (const kind of ["audio", "video"]) {
      const file = local(title, kind);
      assert.ok(playlist.songs.every(w => api.plWishMatch(w, index([file])) === null));
    }
  }
});

test("media filtering happens before selecting a hit, including decorated fallback", () => {
  const wish = playlist.songs[0];
  for (const prefix of ["", "【高音質】"]) {
    const audio = local(prefix + wish.t, "audio"), video = local(prefix + wish.t, "video");
    assert.equal(api.plWishMatch(wish, index([audio, video])), video);
    assert.equal(api.plWishMatch(wish, index([video, audio])), video);
  }
  const memo = { ...local("unrelated", "audio"), hint: wish.t };
  assert.equal(api.plWishMatch(wish, index([memo])), null, "a manual match note cannot turn an audio file into a PV");
});

test("catalog projection and saved playlist sanitization retain media conditions", () => {
  const wish = playlist.songs.map(api.trkWishFromTrack);
  const p = api.plSanitize({ id: "trk-ba-mika-kiss", name: playlist.name, wish, songs: [] });
  assert.deepEqual(clean(p.wish), clean(playlist.songs));
  const restored = api.plSanitize(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(clean(restored.wish), clean(p.wish));
  for (const invalid of ["image", true, 1, {}, ["video"]]) {
    assert.equal(api.trkWishFromTrack({ t: "x", matchMedia: invalid }).matchMedia, undefined);
    assert.equal(api.plSanitize({ id: "x", wish: [{ t: "x", matchMedia: invalid }] }).wish[0].matchMedia, undefined);
  }
});

test("file MIME/name or confirmed video flag determine medium; display title does not", () => {
  const audio = { matchMedia: "audio" }, video = { matchMedia: "video" };
  for (const item of [{ file: { name: "x.mp4" } }, { file: { type: "video/webm" } }, { video: true }]) {
    assert.equal(api.plWishMediaMatches(video, item), true);
    assert.equal(api.plWishMediaMatches(audio, item), false);
  }
  for (const item of [{ file: { name: "x.m4a" } }, { file: { type: "audio/mp4", name: "x.mp4" } }]) {
    assert.equal(api.plWishMediaMatches(audio, item), true);
    assert.equal(api.plWishMediaMatches(video, item), false);
  }
  for (const item of [{ title: "x.mp4" }, { file: { name: "unknown" } }]) {
    assert.equal(api.plWishMediaMatches(audio, item), false);
    assert.equal(api.plWishMediaMatches(video, item), false);
    assert.equal(api.plWishMediaMatches({ t: "ordinary" }, item), true, "old catalog behavior is unchanged");
  }
});

const ariaFixture = JSON.parse(fs.readFileSync(`${ROOT}/tools/bluearchive-mika-aria-tracklist.json`, "utf8"));
const aria = ba.playlists.find(p => p.id === ariaFixture.playlistId);
test("Aria has exactly two vocal tracks plus the full Global official musical", () => {
  assert.equal(aria.name, ariaFixture.playlistName);
  assert.ok(aria.name.length <= 24);
  assert.equal(aria.sourceUrl, ariaFixture.guideUrl);
  assert.deepEqual(clean(aria.songs), ariaFixture.tracks.map(({ durationSeconds, ...t }) => t));
  assert.equal(aria.songs.length, 3);
  assert.equal(ba.playlists.flatMap(p => p.songs).length, 237);
  const p = api.plSanitize({ id: "trk-ba-mika-aria", wish: aria.songs.map(api.trkWishFromTrack) });
  assert.deepEqual(clean(p.wish), clean(aria.songs));
  assert.deepEqual(clean(api.plSanitize(JSON.parse(JSON.stringify(p))).wish), clean(p.wish));
});

for (const wish of aria.songs) test(`Aria media and version isolation: ${wish.t}`, () => {
  for (const title of [wish.t, ...(wish.matchAliases || [])]) {
    for (const prefix of ["", "【高音質】"]) {
      const right = local(prefix + title, wish.matchMedia);
      const wrong = local(prefix + title, wish.matchMedia === "audio" ? "video" : "audio");
      assert.equal(api.plWishMatch(wish, index([wrong])), null);
      assert.equal(api.plWishMatch(wish, index([wrong, right])), right);
      assert.deepEqual(aria.songs.filter(w => api.plWishMatch(w, index([right]))).map(w => w.t).join(), wish.t);
    }
    for (const version of [" (Instrumental)", " (Short)", " (English Ver.)", " (Teaser)", " (Album Ver.) MV"]) {
      assert.equal(api.plWishMatch(wish, index([local(title + version, wish.matchMedia)])), null);
    }
  }
});

test("Japanese solo/ensemble songs keep full vocals separate from short, instrumental and MV", () => {
  const p = ba.playlists.find(p => p.id === "ba-mika-vocals");
  assert.deepEqual([...p.songs.map(t => t.t)], ["幸せになるよ", "ワンダー・ファニー・ハーモニー", "Let's Go With...", "【ブルアカ】5周年記念楽曲「Let's Go With…」MV"]);
  assert.deepEqual([...p.songs.map(t => t.matchMedia)], ["audio", "audio", "audio", "video"]);
  assert.deepEqual([...p.songs.map(t => t.u.split("/").pop())], ["1867673117", "1697260292", "1861397911", "watch?v=PdnDedDp-5A"]);
  assert.equal(p.songs[1].ar.split("、").length, 12);
  assert.equal(p.songs[2].ar.split("、").length, 6);
  for (const w of p.songs) {
    assert.ok(w.ar.includes("ミカ"));
    assert.ok(w.ar.length <= 80);
    const right = local(w.t, w.matchMedia);
    assert.equal(api.plWishMatch(w, index([right])), right);
    assert.equal(api.plWishMatch(w, index([local(w.t, w.matchMedia === "audio" ? "video" : "audio")])), null);
    for (const suffix of ["(Short Ver.)", "(Instrumental Ver.)", " (Cover)"]) {
      assert.equal(api.plWishMatch(w, index([local(w.t + suffix, w.matchMedia)])), null);
    }
  }
  assert.deepEqual(clean(api.plSanitize({ id: "jp", wish: p.songs.map(api.trkWishFromTrack) }).wish), clean(p.songs));
});
