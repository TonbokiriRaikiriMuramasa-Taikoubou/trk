# trk OST scores — compose in symbols, create in sound

Each song in **trk's OST Vol.1** starts here as a text score, then gets
rendered to audio by a deterministic synth. Nothing is recorded: every
note is written in the plan below.

- `<key>.json` — the composition plan: tempo, form (sections), one chord
  per bar, the full melody as `[bar, beat, note, lenBeats]`, and the
  drum/arp/harmony arrangement per section. Keys are C/G/F major;
  `leadWave` picks the lead timbre (`pulse` default, `tri` for a
  softer pops lead).
  More voices: `leadVib`, `bassStyle`/`bassWave`, `arpRate`, `padWave`,
  and the `soft`/`lullaby`/`blaze` drum patterns
  (see `ost-03-moonlit-lullaby.json` and `ost-04-crimson-blaze.json`).
  See `ost-01-sunrise-dash.json` for the format.
- `<key>.abc` — generated from the JSON by the renderer: melody plus
  chord symbols in ABC notation. Human-readable, and usable as `abc=`
  input for vocal synths (e.g. YuE2) when someone wants to sing it.

## Render

```sh
# WAV preview (git-ignored) + ABC (committed) from the score
node tools/make-trk-song.mjs tools/ost-scores/ost-01-sunrise-dash.json

# MP3 for the game bundle (lamejs lives outside the repo on purpose)
npm install --prefix /tmp/mp3enc lamejs
node tools/encode-ost-mp3.mjs assets/trk-ost-preview/ost-01-sunrise-dash.wav \
  assets/optional-ost-audio/ost-01-sunrise-dash.mp3
```

Then add the track to `assets/optional-ost-audio/manifest.json`, add a
per-file `!...` exception in `.gitignore` (like FIRST SPARK), and note
the provenance in `NOTICE.md`. `tools/check-repo.mjs` verifies that
every bundled MP3 has its score committed.
