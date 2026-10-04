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
textures and `.vmd` motions: **trk! never bundles, hosts or uploads them.**
You pick a model or a folder from your own device in the settings panel, and the
MMD terms of that model's author apply (most MMD models forbid redistribution,
use outside MMD/MMM, and commercial use).
The three built-in motions (step / swing / turn) are **not** someone else's work:
trk! generates those `.vmd` bytes itself in `js/mmd.js`, so they are covered by
the GPL like the rest of the code. They are not part of trk! and are not covered by the GPL
unless their creators say so. trk! never bundles or uploads them.

## 4. Third-party libraries
Loaded from jsDelivr only when the VRM or MMD mascot is used:
- three.js — MIT License — https://github.com/mrdoob/three.js
- @pixiv/three-vrm, @pixiv/three-vrm-animation — MIT License — https://github.com/pixiv/three-vrm
- @yohawing/three-mmd-loader — MIT License — https://github.com/yohawing/three-mmd-loader
  (PMX/PMD/VMD loading; MMD is a trademark of Yu Higuchi / MikuMikuDance, and this
  loader is an independent, unaffiliated implementation)

## 5. Not affiliated
trk! is an independent fan project. It is not affiliated with or endorsed by
ppy Pty Ltd (osu!), Bandai Namco (Taiko no Tatsujin), Crypton Future Media, INC.,
VRChat Inc., or pixiv Inc.
