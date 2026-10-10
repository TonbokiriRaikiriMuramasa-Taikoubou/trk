// SPDX-License-Identifier: GPL-3.0-or-later
/* Local Standard MIDI parsing/rendering; no third-party audio or game data. */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT } from "./helpers/browser-data.mjs";

const context = { window: {}, ArrayBuffer, Uint8Array, DataView, Blob, File, setTimeout };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/midi-profiles.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(ROOT, "js/midi-player.js"), "utf8"), context);
const profiles = context.window.Trk.midiProfiles;
const midi = context.window.Trk.midi;

const u16 = n => [n >> 8 & 255, n & 255];
const u32 = n => [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
const text = s => [...Buffer.from(s, "ascii")];
const vlq = value => {
  let n = Math.max(0, Math.floor(value));
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
};
function midiFile(trackBytes, { format = 0, tracks = [trackBytes], division = 480 } = {}) {
  const header = [...text("MThd"), ...u32(6), ...u16(format), ...u16(tracks.length), ...u16(division)];
  const chunks = tracks.flatMap(track => [...text("MTrk"), ...u32(track.length), ...track]);
  return Uint8Array.from([...header, ...chunks]);
}
function oneNoteMidi() {
  return midiFile([
    0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, // 500,000 us per quarter note
    0x00, 0xc0, 0x00,                         // program change: piano
    0x00, 0x90, 0x3c, 0x64,                   // middle C on
    0x83, 0x60, 0x80, 0x3c, 0x00,             // middle C off after one quarter
    0x00, 0xff, 0x2f, 0x00                    // end of track
  ]);
}
function expectMidiError(code, fn) {
  assert.throws(fn, error => error && error.code === code);
}

describe("Code-generated MIDI timbre profiles", () => {
  test("exposes exactly 24 unique immutable profiles: 10 reference-inspired and 14 trk originals", () => {
    const list = profiles.list();
    assert.equal(list.length, 24);
    assert.equal(list.filter(profile => profile.category === "reference").length, 10);
    assert.equal(list.filter(profile => profile.category === "trk").length, 14);
    assert.equal(new Set(list.map(profile => profile.id)).size, 24);
    assert.equal(profiles.defaultId, "studio_gm");
    assert.equal(profiles.normalize("not-a-profile"), profiles.defaultId);
    assert.ok(Object.isFrozen(list));
    for (const profile of list) {
      assert.match(profile.id, /^[a-z0-9_]{1,40}$/);
      assert.ok(Object.isFrozen(profile) && Object.isFrozen(profile.synth) && Object.isFrozen(profile.mixChain));
      assert.ok(profile.name.ja && profile.name.en && profile.name.zh && profile.name.ko);
      assert.ok(profile.mixChain.every(effect => effect && typeof effect.type === "string"));
    }
  });
});

describe("Standard MIDI File parsing", () => {
  test("reads a valid type-0 track and applies tempo to ticks", () => {
    const parsed = midi.parseMidi(oneNoteMidi());
    assert.equal(parsed.format, 0);
    assert.equal(parsed.trackCount, 1);
    assert.equal(parsed.division, 480);
    assert.equal(parsed.durationSeconds, 0.5);
    assert.deepEqual(Array.from(parsed.events, e => e.kind), ["tempo", "channel", "channel", "channel"]);
    assert.equal(parsed.events.find(e => e.command === 0x9).a, 60);
    assert.equal(parsed.events.find(e => e.command === 0x8).seconds, 0.5);
  });

  test("supports running status for channel events", () => {
    const parsed = midi.parseMidi(midiFile([
      0, 0x90, 60, 100,
      0, 64, 90,       // running-status note-on
      0x83, 0x60, 0x80, 60, 0,
      0, 64, 0,         // running-status note-off
      0, 0xff, 0x2f, 0
    ]));
    assert.equal(parsed.events.filter(e => e.kind === "channel").length, 4);
    assert.deepEqual(Array.from(parsed.events.filter(e => e.command === 0x9), e => e.a), [60, 64]);
    assert.deepEqual(Array.from(parsed.events.filter(e => e.command === 0x8), e => e.a), [60, 64]);
  });

  test("merges type-1 tracks and applies later global tempo changes", () => {
    const tempoTrack = [
      0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20,
      0x83, 0x60, 0xff, 0x51, 3, 0x0f, 0x42, 0x40,
      0, 0xff, 0x2f, 0
    ];
    const noteTrack = [
      0, 0x90, 69, 100,
      0x87, 0x40, 0x80, 69, 0, // 960 ticks, spanning both tempo regions
      0, 0xff, 0x2f, 0
    ];
    const parsed = midi.parseMidi(midiFile(tempoTrack, { format: 1, tracks: [tempoTrack, noteTrack] }));
    assert.equal(parsed.durationSeconds, 1.5);
    assert.equal(parsed.events.find(e => e.command === 0x8).seconds, 1.5);
  });

  test("rejects malformed headers, type 2, SMPTE timing, and unbounded duration", () => {
    expectMidiError("midi-invalid", () => midi.parseMidi(Uint8Array.of(1, 2, 3)));
    expectMidiError("midi-unsupported-format", () => midi.parseMidi(midiFile([0, 0xff, 0x2f, 0], { format: 2 })));
    expectMidiError("midi-smpte-unsupported", () => midi.parseMidi(midiFile([0, 0xff, 0x2f, 0], { division: 0xe728 })));
    const longTrack = [
      0, 0x90, 60, 100,
      ...vlq(1200 * 960), 0x80, 60, 0,
      0, 0xff, 0x2f, 0
    ];
    expectMidiError("midi-too-long", () => midi.parseMidi(midiFile(longTrack)));
  });

  test("enforces the MIDI input-size ceiling before parsing", () => {
    expectMidiError("midi-too-large", () => midi.parseMidi(new Uint8Array(8 * 1024 * 1024 + 1)));
  });

  test("counts tempo meta-events against the event ceiling", () => {
    const flood = [];
    for (let i = 0; i < 100001; i++) flood.push(0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20);
    expectMidiError("midi-event-limit", () => midi.parseMidi(midiFile(flood)));
  });
});

describe("Local MIDI rendering", () => {
  test("renders a WAV blob with audible PCM and correct RIFF headers", async () => {
    const wav = await midi.renderMidi(oneNoteMidi(), { sampleRate: 8000 });
    assert.equal(wav.type, "audio/wav");
    const buffer = await wav.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    assert.equal(Buffer.from(bytes.slice(0, 4)).toString("ascii"), "RIFF");
    assert.equal(Buffer.from(bytes.slice(8, 12)).toString("ascii"), "WAVE");
    const view = new DataView(buffer);
    assert.equal(view.getUint32(24, true), 8000);
    assert.equal(view.getUint16(34, true), 16);
    let energy = 0;
    for (let i = 44; i < bytes.length; i += 2) energy += Math.abs(view.getInt16(i, true));
    assert.ok(energy > 1000, "rendered audio contains non-silent samples");
  });

  test("uses the selected procedural profile and falls back safely for unknown IDs", async () => {
    const neutral = await midi.renderMidi(oneNoteMidi(), { sampleRate:8000, profileId:"studio_gm" });
    const fallback = await midi.renderMidi(oneNoteMidi(), { sampleRate:8000, profileId:"not-a-profile" });
    const pixel = await midi.renderMidi(oneNoteMidi(), { sampleRate:8000, profileId:"trk_pixel" });
    const [neutralBytes, fallbackBytes, pixelBytes] = await Promise.all([neutral, fallback, pixel].map(blob => blob.arrayBuffer()));
    assert.deepEqual(Buffer.from(fallbackBytes), Buffer.from(neutralBytes), "unknown profile IDs use the neutral default");
    assert.notDeepEqual(Buffer.from(pixelBytes), Buffer.from(neutralBytes), "different selected profiles produce different code-generated PCM");
  });

  test("does not accept silent, malformed, or note-dense input as playable audio", async () => {
    await assert.rejects(midi.renderMidi(midiFile([0, 0xff, 0x2f, 0])), error => error.code === "midi-no-notes");
    const file = new File([oneNoteMidi()], "th06_01.mid", { type: "audio/midi" });
    assert.equal(midi.isMidiFile(file), true);
    assert.equal(midi.isMidiFile({ name: "song.mp3", type: "audio/mpeg" }), false);
    const wavFile = await midi.renderFile(file, { sampleRate: 8000 });
    assert.equal(wavFile.name, "th06_01.wav");
    assert.equal(wavFile.type, "audio/wav");
  });
});
