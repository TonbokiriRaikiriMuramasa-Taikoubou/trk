# trk's OST Vol.1 — optional in-app songs

This folder holds original instrumental songs that appear in the
**trk's OST Vol.1** playlist. It is optional: deleting the whole folder
makes a lighter build, and the game simply shows no OST songs.

- `manifest.json` lists the tracks (`version: 1`, `enabled`, `tracks[]`
  with `key` / `file` / `title` / `artist` / `bpm` / `offset`).
  The game fetches only this small file at startup.
- `ost-01-sunrise-dash.mp3` — track 01 **SUNRISE DASH** (150 BPM,
  game-style, ~53 s). Loaded lazily when selected, same as the
  FIRST SPARK tutorial demo.

Every track keeps its editable score in `tools/ost-scores/`:

- `<key>.json` — the composition plan (tempo, form, chords, melody,
  arrangement) read by `tools/make-trk-song.mjs`.
- `<key>.abc` — the melody and chords in ABC notation
  (human-readable, and accepted as `abc=` input by vocal synths
  such as YuE2 for future vocal versions).

Charts are auto-generated from the audio Seed, like any other song.
Re-rendering: see `tools/ost-scores/README.md`.
