# NOTICE — trk!

trk! is AGRG! — an All-Generation Rhythm Game
Copyright (C) 2026 trk! contributors (originally "Shadow-Taiko")

This program is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.
See the LICENSE file for the full text.

The following items are NOT granted by the GPL, because they are not ours to grant
or are not part of the software license.

## 1. The "trk!" name
The GPL covers the code, not the name. Forks and derivative works are welcome,
but please use a different name (e.g. "trk-plus", "my-drum-fork") so players
are not confused about which version is official.
"Based on trk!" in your description is fine and appreciated.

## 2. Hatsune Miku (Piapro Character License)
この作品はピアプロ・キャラクター・ライセンスに基づいてクリプトン・フューチャー・メディア株式会社のキャラクター「初音ミク」を描いたものです。
This work depicts the character "Hatsune Miku" of Crypton Future Media, INC.
under the Piapro Character License (PCL). https://piapro.jp/license/pcl/summary

- **Everything Miku-related is in one file: `js/characters/miku.js`.**
  (The UI text in `js/i18n.js` only contains names and the credit line.)
- The character rights belong to Crypton Future Media, INC. and are not ours,
  so the GPL cannot grant them. Anyone using `js/characters/miku.js` must follow
  the PCL: non-commercial and free of charge only (no sales, ads, paid features,
  donations or tips of any kind).
- **To make a commercial fork or a Miku-free build:** delete `js/characters/miku.js`
  and its `<script>` line in `index.html`. Nothing else needs to change.
- "Winter Miku", "Spring Miku" and "Chibi Miku" in trk! are original arrangements.
  They are NOT the official derivative characters (Snow Miku, Sakura Miku, Mikudayo).

## 3. User content
Songs, charts, skins, `.stpack` packs, VRM models, motions and character mods are
owned by their creators. The same goes for MMD models (`.pmx`/`.pmd`), their
textures and `.vmd` motions: by default **trk! does not bundle, host or upload them.**
You pick a model or a folder from your own device in the settings panel, and the
MMD terms of that model's author apply (most MMD models forbid redistribution,
use outside MMD/MMM, and commercial use).
The built-in motions (step / swing / turn / jump / idol and the 🎵 BPM series) are **not** someone else's
work: trk! generates those `.vmd` bytes itself in `js/mmd.js`, so they are covered
by the GPL like the rest of the code.

### 3a. Bundled MMD models (`assets/mmd/`)
A model may be bundled under `assets/mmd/` ONLY when its own readme explicitly
allows redistribution. Example — Lat-style Miku's readme states that, within the
rights holder's guidelines (Crypton's PCL), any use including modification and
redistribution is OK. For every bundled model:
- the author's **original readme is included in the same folder** and its terms apply;
- the model, textures and readme are **NOT covered by the GPL** — they are not ours to license;
- character rights (Hatsune Miku etc.) remain with Crypton Future Media, INC. under
  the PCL: non-commercial and free of charge only.
**To make a commercial fork:** delete the `assets/mmd/` folder entirely
(together with `js/characters/miku.js`, see section 2).

## 4. Third-party libraries

### 4a. Web runtime libraries

Loaded from jsDelivr only when the VRM or MMD mascot is used:
- three.js — MIT License — https://github.com/mrdoob/three.js
- @pixiv/three-vrm, @pixiv/three-vrm-animation — MIT License — https://github.com/pixiv/three-vrm
- @yohawing/three-mmd-loader — MIT License — https://github.com/yohawing/three-mmd-loader
  (PMX/PMD/VMD loading; MMD is a trademark of Yu Higuchi / MikuMikuDance, and this
  loader is an independent, unaffiliated implementation)

These libraries are not bundled into the normal page as local source; the Web app
loads them from jsDelivr only when the corresponding 3D feature is used. Their
copyright and license terms remain with their respective authors.

### 4b. Optional Android wrapper

The repository includes an optional Capacitor build path. If an Android project
is generated with `docs/android.md`, the following Capacitor runtime packages are
used in the generated app:
- `@capacitor/core` — MIT License — https://github.com/ionic-team/capacitor
- `@capacitor/android` — MIT License — https://github.com/ionic-team/capacitor

The following are build-time tools, not trk!'s Web runtime:
- `@capacitor/cli` — MIT License — https://github.com/ionic-team/capacitor
- TypeScript — Apache License 2.0 — https://github.com/microsoft/TypeScript

`package-lock.json` records transitive npm packages used by the optional build
toolchain. Each package keeps its own license and copyright notices; the generated
Android project and its release process must preserve the notices required by
those packages. This file does not grant GPL rights to third-party software.

### 4c. Pro-audio effect concepts (original implementations)

The 🚪 noise gate, 🧹 spectral noise reduction, 🎚 dynamic EQ and ✨ exciter in
js/fx-worklet.js and js/fx.js are original implementations written for trk!.
Their *concepts* are inspired by well-known pro-audio tools — noise reduction
in Audacity, ReaFir (Cockos), Bertom Denoiser Classic, and the dynamic EQ /
exciter ideas popularized by TDR Nova and iZotope Ozone. No code, UI assets,
preset data, or product names from those tools are used; the DSP (radix-2 FFT,
RBJ biquad formulas, spectral subtraction) is built from textbook algorithms.
Product names are mentioned here and in the README for explanation only, and
trk! is not affiliated with or endorsed by their authors.

### 4d. Official-source playlist catalog (trademarks, factual listings)

js/catalog.js (`TRK_CATALOG`) contains curated playlists for Blue Archive,
Arknights, League of Legends "Sessions: Vi", VALORANT, Touhou Project,
NoCopyrightSounds, Kevin MacLeod (incompetech), Genshin Impact,
100% Orange Juice and Gakuen iDOLM@STER.
It bundles **no audio files, charts, or copyrighted works** — only factual
metadata (track / artist / album names, which are facts) and links that point
exclusively to official sources (bluearchive.jp, Monster-Siren Records,
riotgames.com creator-safe guidelines, ZUN's official site). Series names,
logos, characters and trademarks belong to their respective owners
(Nexon/Yostar, Hypergravity/Hypergryph, Riot Games, Team Shanghai Alice);
they are used here for factual reference only, without permission, and their
inclusion does not imply any affiliation with or endorsement of trk!.
Riot Games music is displayed under Riot's fan-content / creator-safe policy
(keep it free, don't imply official affiliation); see
https://www.riotgames.com/en/legal — "Courtesy of Riot Games".
Per the same principle, trk! never implies that any of these publishers
officially distribute, endorse, or bundle anything with this app, and users
are directed to obtain the music themselves from the linked official stores.

## 5. Not affiliated
trk! is an independent fan project. It is not affiliated with or endorsed by
ppy Pty Ltd (osu!), Bandai Namco (Taiko no Tatsujin), Crypton Future Media, INC.,
VRChat Inc., pixiv Inc., Nexon Games / Yostar (Blue Archive), Hypergravity /
Hypergryph (Arknights / Monster-Siren Records), Riot Games (League of Legends,
VALORANT), Team Shanghai Alice / ZUN (Touhou Project), miHoYo / HOYO-MiX
(Genshin Impact), Orange-Juice / Fruitbat Factory (100% Orange Juice), or
Bandai Namco Entertainment (Gakuen iDOLM@STER / THE iDOLM@STER).
