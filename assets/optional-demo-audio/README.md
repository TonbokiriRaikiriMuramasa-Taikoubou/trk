# Optional tutorial demo audio

This folder contains the optional 30-second **FIRST SPARK** tutorial track (about 704 KiB) and the tiny manifest that enables its button in trk!. The MP3 is fetched only when the player/demo button is used; keeping this folder does not preload the audio.

## To build a lighter, media-player-focused copy

Delete this **entire `assets/optional-demo-audio/` folder** before serving/building. The app treats it as optional: without `manifest.json`, the demo button and built-in song entry stay hidden. This does not affect local music/video playback, the media player, or the rest of the tutorial. If only the MP3 is deleted but the manifest is left behind, selecting the demo will fail gracefully and hide the missing entry.

If a browser has already cached the MP3, clearing that site's data/service-worker cache releases its cached copy. The app loads user songs locally; they are not affected by removing this folder.

To skip the tutorial in the app, open the quick guide and press **Skip**. To use trk! as a media player without starting a game, long-press the TV dock's **⏻ power** button, then load your own music folder/files.
