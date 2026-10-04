<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# trk! — developer handoff

## Current shape

trk! is a no-build, static browser app. The published site is served directly from the repository root and must continue to work below the project path `/<repo>/` on GitHub Pages.

- `index.html` is the landing page and game shell.
- `style.css` contains the responsive visual system and game overlay.
- `app.js` owns language strings, local audio decoding, experimental BPM/chart generation, Web Audio playback, and the four-lane game loop.
- `manifest.webmanifest` and `sw.js` are the optional install/offline shell. The service worker is scoped to its registration path and only cleans up cache keys prefixed `trk-`.
- `.github/workflows/pages.yml` deploys the static root on pushes to `main` (or a manual workflow run). Repository Pages must use **GitHub Actions** as its build source.

There are no runtime dependencies, analytics, external asset hosts, or application servers. Use relative paths (`./...`) for site files so the project works at both `/` locally and `/trk/` on Pages.

## Local audio and chart prototype

Audio files are accepted through a local file picker or drag-and-drop, decoded with the browser's Web Audio API, and retained only in memory. Do not add a network upload path or commit user music. A tiny original synth demo is generated in memory so a new visitor can play without bringing a file.

The current chart is a four-lane prototype (`D`, `F`, `J`, `K`): tempo and onset energy are estimated client-side; the density selector changes how beat subdivisions are charted. This is intentionally not represented as a finished transcription system. Keep the UI clear that results are estimates, and test unusual file lengths, quiet audio, and browsers without Web Audio.

## Localization and accessibility

The contributor guide asks that visible UI text be present in Japanese, English, Chinese, and Korean. Add new interface copy to all four dictionaries in `app.js`; use `data-i18n` for page copy and `tr()` for runtime messages. Keep keyboard play, touch targets, focus visibility, reduced-motion support, and localized accessible labels working.

## Compatibility and media

The save-key prefixes and pack/format names called out in `CONTRIBUTING.md` are compatibility contracts; do not rename them when those features are implemented. No chart-pack format, character format, or persistence backend is implemented by this first playable screen. Only include media that the project has the right to redistribute. Do not reuse another game's charts, audio, logos, or artwork.
