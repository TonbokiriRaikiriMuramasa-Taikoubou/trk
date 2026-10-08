(() => {
  const core = window.Trk.core;
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：ノーツ設定・マスコット表示・スキン作成・パック・曲パック ============
   ※ パックの形式名 "shadow-taiko-pack" は、これまでに作られたパックとの互換のため変更していません。 */
"use strict";

/* ============ ノーツの見た目 ============ */
function syncNoteUI() {
  for (const i of [0, 1]) {
    core.$("noteColor" + i).value = core.settings.notes[i].color;
    core.$("noteShape" + i).value = core.settings.notes[i].shape;
    const d = core.$("notePrev" + i);
    d.className = `dot big ${core.settings.notes[i].shape}`; d.style.background = core.settings.notes[i].color;
  }
}
function setNotes(list, persist = true) {
  core.settings.notes = window.Trk.data.sanitizeNotes(list);
  syncNoteUI(); core.applyNoteVars(); core.updateTouchKeys();
  if (persist) core.saveUserPrefs();
}
[0, 1].forEach(i => {
  core.$("noteColor" + i).addEventListener("input", e => { const n = core.settings.notes.map(x => ({ ...x })); n[i].color = e.target.value; setNotes(n); });
  core.$("noteShape" + i).addEventListener("change", e => { const n = core.settings.notes.map(x => ({ ...x })); n[i].shape = e.target.value; setNotes(n); });
});
core.$("notePresets").addEventListener("click", e => {
  const b = e.target.closest("button[data-preset]"); if (!b) return;
  if (b.dataset.preset === "skin") {
    const s = core.skin();
    setNotes([{ color:window.Trk.data.toHex(s.game.don, window.Trk.data.NOTE_PRESETS.classic[0].color), shape:s.shapes[0] },
              { color:window.Trk.data.toHex(s.game.ka, window.Trk.data.NOTE_PRESETS.classic[1].color), shape:s.shapes[1] }]);
  } else setNotes(window.Trk.data.NOTE_PRESETS[b.dataset.preset]);
});

/* ============ マスコット設定・PCLクレジット ============ */
const PCL_URL = "https://piapro.jp/license/pcl/summary";
function updateMascotUI() {
  core.$("mascotSelect").value = core.settings.mascot;
  /* 🩷 マスコットが変わった合図。js/mmd.js・js/vrm.js は、🪶 軽量化で起動時に読み込まなかった
     3Dモデルをここで読みに行きます（モデルが既にあるときは中身を見てすぐ止まるので無駄打ちしません） */
  try { core.emit("mascot"); } catch (_) {}
  const on = core.isPclMascot(core.activeMascot());
  document.querySelectorAll(".pclCredit").forEach(n => {
    n.hidden = !on; n.textContent = "";
    if (!on) return;
    n.append(core.el("span", "", tr("pclCredit") + " "));
    if (lang !== "ja" && TEXT.ja.pclCredit) n.append(core.el("span", "", `（${TEXT.ja.pclCredit}）`), " ");   // 正文は日本語版
    const a = core.el("a", "", PCL_URL); a.href = PCL_URL; a.target = "_blank"; a.rel = "noopener noreferrer";
    n.append(a);
  });
}
core.$("mascotSelect").addEventListener("change", e => { core.settings.mascot = e.target.value; core.saveUserPrefs(); updateMascotUI(); });
on("skin", updateMascotUI);
on("language", updateMascotUI);

/* ============ スキン作成・編集 ============ */
const MAKER_COLORS = ["bg", "bg2", "panel", "text", "accent", "gold"];
const CUSTOM_SKIN_FILE_MAX = 256 * 1024;
function defFromSkin(id) {
  if (Object.prototype.hasOwnProperty.call(core.customSkinDefs, id)) return JSON.parse(JSON.stringify(core.customSkinDefs[id]));
  const s = window.Trk.data.has(window.Trk.data.SKINS, id) ? window.Trk.data.SKINS[id] : window.Trk.data.SKINS.shadow, u = s.ui;
  const font = !s.font ? "default" : /mono|consolas/i.test(s.font) ? "mono" : /serif/i.test(s.font) && !/sans/i.test(s.font) ? "serif" : "rounded";
  const g = window.Trk.data.parseGrad(u["--ui-bg"]);   // グラデーションのスキンをリミックスしたら、2色と向きをそのまま持ってくる
  return {
    name:`${s.label[lang] || s.label.en} ${tr("remix")}`.slice(0, 24),
    colors:{ bg:g ? g.from : window.Trk.data.toHex(u["--ui-bg"]), bg2:g ? g.to : "", panel:window.Trk.data.toHex(u["--ui-panel"]), text:window.Trk.data.toHex(u["--ui-text"]), accent:window.Trk.data.toHex(u["--ui-accent"]), gold:window.Trk.data.toHex(u["--ui-gold"]) },
    glow:!!s.game.glow, scanlines:!!s.game.scanlines, gradDir:g ? g.dir : "none", font, video:"mono",
    mascot:window.Trk.data.MASCOT_IDS.includes(s.mascot) ? s.mascot : "none"
  };
}
function fillSkinMaker(id) {
  const d = defFromSkin(id);
  core.$("makerName").value = d.name;
  for (const k of MAKER_COLORS) core.$("makerColor_" + k).value = d.colors[k] || d.colors.bg;   // bg2 が空のときは bg と同色で立たせておく
  core.$("makerGradDir").value = d.gradDir || "none";
  core.$("makerGlow").checked = d.glow; core.$("makerScan").checked = d.scanlines;
  core.$("makerFont").value = d.font; core.$("makerVideo").value = d.video; core.$("makerMascot").value = d.mascot;
}
function readSkinMaker() {
  const colors = {};
  for (const k of MAKER_COLORS) colors[k] = core.$("makerColor_" + k).value;
  return window.Trk.data.sanitizeSkinDef({ name:core.$("makerName").value, colors, glow:core.$("makerGlow").checked, scanlines:core.$("makerScan").checked, gradDir:core.$("makerGradDir").value,
    font:core.$("makerFont").value, video:core.$("makerVideo").value, mascot:core.$("makerMascot").value });
}
function storeCustomSkin(id, def) {
  core.customSkinDefs[id] = def; window.Trk.data.SKINS[id] = window.Trk.data.buildCustomSkin(def);
  core.saveCustomSkins(); core.buildSkinGrid(); core.applySkin(id);
}
const newSkinId = () => "custom_" + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
const skinShelf = core.$("skinShelf");
if (skinShelf) {
  skinShelf.open = core.settings.skinShelfOpen !== false;      // 前回の開閉を復元
  skinShelf.addEventListener("toggle", () => { core.settings.skinShelfOpen = skinShelf.open; core.saveUserPrefs(); });
}
core.$("skinMaker").addEventListener("toggle", () => { if (core.$("skinMaker").open) fillSkinMaker(core.settings.skin); });
core.$("makerLoadBtn").addEventListener("click", () => { fillSkinMaker(core.settings.skin); core.setStatus("makerStatus", null); });
core.$("makerSaveNewBtn").addEventListener("click", () => {
  if (Object.keys(core.customSkinDefs).length >= core.CUSTOM_SKIN_MAX) { core.setStatus("makerStatus", "skinLimit"); return; }
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  storeCustomSkin(newSkinId(), def); core.setStatus("makerStatus", "skinSaved");
});
core.$("makerOverwriteBtn").addEventListener("click", () => {
  if (!Object.prototype.hasOwnProperty.call(core.customSkinDefs, core.settings.skin)) { core.setStatus("makerStatus", "builtinLocked"); return; }
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  storeCustomSkin(core.settings.skin, def); core.setStatus("makerStatus", "skinSaved");
});
core.$("makerExportBtn").addEventListener("click", () => {
  const def = readSkinMaker(); if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  core.downloadJSON({ format:core.SKIN_FORMAT, version:1, ...def }, `${core.safeName(def.name)}.skin.json`);
  core.setStatus("makerStatus", "skinExported");
});
core.$("makerImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (typeof f.size !== "number" || !Number.isFinite(f.size) || f.size < 0 || f.size > CUSTOM_SKIN_FILE_MAX) {
    core.setStatus("makerStatus", "skinBad"); return;
  }
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
  const def = raw && (!raw.format || raw.format === core.SKIN_FORMAT) ? window.Trk.data.sanitizeSkinDef(raw) : null;
  if (!def) { core.setStatus("makerStatus", "skinBad"); return; }
  if (Object.keys(core.customSkinDefs).length >= core.CUSTOM_SKIN_MAX) { core.setStatus("makerStatus", "skinLimit"); return; }
  storeCustomSkin(newSkinId(), def); fillSkinMaker(core.settings.skin); core.setStatus("makerStatus", "skinImported");
});
core.$("makerDeleteBtn").addEventListener("click", () => {
  const id = core.settings.skin;
  if (!Object.prototype.hasOwnProperty.call(core.customSkinDefs, id)) { core.setStatus("makerStatus", "builtinLocked"); return; }
  if (!confirm(tr("confirmDelete"))) return;
  delete core.customSkinDefs[id]; delete window.Trk.data.SKINS[id]; core.saveCustomSkins();
  core.buildSkinGrid(); core.applySkin("shadow"); fillSkinMaker("shadow"); core.setStatus("makerStatus", "skinDeleted");
});

/* ============ ZIP（.stpack の中身） ============ */
class PackError extends Error { constructor(key, vars) { super(key); this.key = key; this.vars = vars; } }
async function readZip(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer()), dv = new DataView(buf.buffer);
  if (buf.length < 22) throw new PackError("packBadZip");
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new PackError("packBadZip");
  const count = dv.getUint16(eocd + 10, true), files = {}, dec = new TextDecoder();
  let p = dv.getUint32(eocd + 16, true);
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || dv.getUint32(p, true) !== 0x02014b50) throw new PackError("packBadZip");
    const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
    const loff = dv.getUint32(p + 42, true), name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (name.endsWith("/")) continue;
    if ((flags & 1) || csize === 0xffffffff || loff + 30 > buf.length) throw new PackError("packBadZip");
    const start = loff + 30 + dv.getUint16(loff + 26, true) + dv.getUint16(loff + 28, true);
    if (start + csize > buf.length) throw new PackError("packBadZip");
    files[name] = { method, usize, data:buf.subarray(start, start + csize) };
  }
  return files;
}
async function inflateEntry(e, limit = 0, label = "") {
  if (e.method === 0) {
    if (limit > 0 && e.data.byteLength > limit) throw new PackError("packFileTooBig", { f:label });
    return new Blob([e.data]);
  }
  if (e.method !== 8) throw new PackError("packBadZip");
  if (typeof DecompressionStream === "undefined") throw new PackError("packUnsupported");
  const stream = new Blob([e.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  if (!(limit > 0)) return new Response(stream).blob();
  /* 🛡 圧縮爆弾よけ：ZIPの「展開後の大きさ（usize）」は作り手が自由に書けるので信用しない。
     展開しながら数えて、上限を超えた時点でその場で止める（展開しきってから測ると、測る前にメモリを食われる）。 */
  const reader = stream.getReader(), chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new PackError("packFileTooBig", { f:label });
      chunks.push(value);
    }
  } catch (err) {
    try { await reader.cancel(); } catch (_) {}
    throw err;
  }
  return new Blob(chunks);
}
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
async function writeZip(entries) {          // 無圧縮で書き出し（PNG・音源・VRMはもともと圧縮済み）
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  for (const e of entries) {
    const data = new Uint8Array(await e.blob.arrayBuffer()), name = enc.encode(e.name), crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
    parts.push(lh, name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    central.push(ch, name);
    off += 30 + name.length + data.length;
  }
  const cdSize = central.reduce((s, x) => s + x.byteLength, 0), end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, end], { type:"application/zip" });
}

/* ============ pack.json の検証（決められた項目と形式だけを受け付ける） ============ */
const PACK_FORMAT = "shadow-taiko-pack", PACK_MB = 1048576, PACK_MAX = 500 * PACK_MB, PACK_STORE_MAX = 1024 * PACK_MB, PACK_SONG_MAX = 50;
const IMG_EXT = ["png", "webp", "jpg", "jpeg"], SND_EXT = ["wav", "mp3", "ogg", "m4a"];
const SONG_EXT = ["mp3", "m4a", "ogg", "oga", "opus", "wav", "flac", "aac", "mp4", "webm"];
const PACK_LIMIT = { image:4, bg:8, sound:5, vrm:200, vrma:30, audio:250, chart:2 };
const MIME = { png:"image/png", webp:"image/webp", jpg:"image/jpeg", jpeg:"image/jpeg", wav:"audio/wav", mp3:"audio/mpeg",
  ogg:"audio/ogg", oga:"audio/ogg", opus:"audio/ogg", m4a:"audio/mp4", aac:"audio/aac", flac:"audio/flac", mp4:"video/mp4",
  webm:"video/webm", vrm:"model/gltf-binary", vrma:"model/gltf-binary", json:"application/json" };
const PATH_RE = /^[A-Za-z0-9_\-./]{1,120}$/;
const safePath = (p, exts) => typeof p === "string" && PATH_RE.test(p) && !p.includes("..") && !p.startsWith("/") && exts.includes(core.extOf(p)) ? p : null;
const pstr = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";
function langText(o, n) {
  if (typeof o === "string") return o.trim() ? { en:pstr(o, n) } : null;
  if (!o || typeof o !== "object") return null;
  const r = {}; for (const l of ["ja", "en", "zh", "ko"]) if (typeof o[l] === "string" && o[l].trim()) r[l] = pstr(o[l], n);
  return Object.keys(r).length ? r : null;
}
function sanitizeSong(r, i) {
  if (!r || typeof r !== "object") return null;
  const audio = safePath(r.audio, SONG_EXT); if (!audio) return null;
  const s = {
    id: typeof r.id === "string" && /^[A-Za-z0-9_-]{1,32}$/.test(r.id) ? r.id : `s${i + 1}`,
    title: pstr(r.title, 80) || core.baseName(audio.split("/").pop()),
    artist: pstr(r.artist, 60), charter: pstr(r.charter, 40), license: pstr(r.license, 400), audio
  };
  const bg = safePath(r.background, IMG_EXT); if (bg) s.background = bg;
  const bpm = core.num(r.bpm, 60, 300, 0); if (bpm) s.bpm = bpm;
  if (typeof r.offset === "number" && isFinite(r.offset)) s.offset = Math.max(-5000, Math.min(5000, r.offset));
  if (typeof r.previewStart === "number" && isFinite(r.previewStart) && r.previewStart >= 0) s.previewStart = Math.min(36000, r.previewStart);
  if (r.charts && typeof r.charts === "object") {
    const c = {}; for (const d of window.Trk.data.DIFF_IDS) { const p = safePath(r.charts[d], ["json"]); if (p) c[d] = p; }
    if (Object.keys(c).length) s.charts = c;
  }
  return s;
}
function sanitizeCreditPerson(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = pstr(raw.name, 60); if (!name) return null;
  const person = { name };
  const role = langText(raw.role, 80); if (role) person.role = role;
  const rights = langText(raw.rights, 240); if (rights) person.rights = rights;
  const license = pstr(raw.license, 200); if (license) person.license = license;
  const handle = pstr(raw.handle, 80); if (handle) person.handle = handle;
  const url = pstr(raw.url, 200); if (/^https:\/\/[^\s"'<>]+$/.test(url)) person.url = url;
  return person;
}
function sanitizeCreditCard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = pstr(raw.name, 60); if (!name) return null;
  const card = { version:1, name };
  const role = langText(raw.role, 80); if (role) card.role = role;
  const tagline = langText(raw.tagline, 160); if (tagline) card.tagline = tagline;
  const rights = langText(raw.rights, 240); if (rights) card.rights = rights;
  const license = pstr(raw.license, 200); if (license) card.license = license;
  const handle = pstr(raw.handle, 80); if (handle) card.handle = handle;
  const url = pstr(raw.url, 200); if (/^https:\/\/[^\s"'<>]+$/.test(url)) card.url = url;
  const contributors = (Array.isArray(raw.contributors) ? raw.contributors : []).slice(0, 12)
    .map(sanitizeCreditPerson).filter(Boolean);
  if (contributors.length) card.contributors = contributors;
  return card;
}
function sanitizeManifest(raw) {
  if (!raw || typeof raw !== "object" || raw.format !== PACK_FORMAT) return null;
  const name = pstr(raw.name, 40); if (!name) return null;
  const url = pstr(raw.url, 200);
  const m = { format:PACK_FORMAT, version:1, name, author:pstr(raw.author, 40), description:pstr(raw.description, 200),
              license:pstr(raw.license, 400), url:/^https:\/\/[^\s"'<>]+$/.test(url) ? url : "" };
  const creditCard = sanitizeCreditCard(raw.creditCard); if (creditCard) m.creditCard = creditCard;
  if (raw.skin && typeof raw.skin === "object") { const d = window.Trk.data.sanitizeSkinDef({ ...raw.skin, name }); if (d) m.skin = d; }
  if (raw.notes && typeof raw.notes === "object") {
    const notes = {};
    for (const k of ["don", "ka"]) {
      const n = raw.notes[k]; if (!n || typeof n !== "object") continue;
      const o = {};
      if (typeof n.color === "string" && window.Trk.data.HEX.test(n.color)) o.color = n.color.toLowerCase();
      if (window.Trk.data.NOTE_SHAPES.includes(n.shape)) o.shape = n.shape;
      const img = safePath(n.image, IMG_EXT); if (img) o.image = img;
      if (Object.keys(o).length) notes[k] = o;
    }
    if (Object.keys(notes).length) m.notes = notes;
  }
  if (raw.sounds && typeof raw.sounds === "object") {
    const s = {}; for (const k of ["don", "ka"]) { const v = safePath(raw.sounds[k], SND_EXT); if (v) s[k] = v; }
    if (Object.keys(s).length) m.sounds = s;
  }
  if (raw.fx && typeof raw.fx.power === "number" && isFinite(raw.fx.power)) m.fx = { power:Math.min(3, Math.max(0, raw.fx.power)) };
  if (raw.mascot && typeof raw.mascot === "object") {
    const r = raw.mascot, o = {}, caps = {};
    const vrmPath = safePath(r.vrm, ["vrm"]), motion = safePath(r.motion, ["vrma"]);
    if (vrmPath) o.vrm = vrmPath;
    if (motion) o.motion = motion;
    const bpm = core.num(r.motionBpm, 40, 300, 0); if (bpm) o.motionBpm = bpm;
    if (["full", "upper", "face"].includes(r.frame)) o.frame = r.frame;
    if (typeof r.turn === "number" && isFinite(r.turn)) o.turn = Math.max(-60, Math.min(60, r.turn));
    for (const k of ["capStart", "capCombo", "capBreak"]) { const t = langText(r.captions && r.captions[k], 60); if (t) caps[k] = t; }
    if (Object.keys(caps).length) o.captions = caps;
    if (Object.keys(o).length) m.mascot = o;
  }
  if (Array.isArray(raw.songs)) {
    const songs = [], ids = new Set();
    raw.songs.slice(0, PACK_SONG_MAX).forEach((r, i) => {
      const s = sanitizeSong(r, i);
      if (s && !ids.has(s.id)) { ids.add(s.id); songs.push(s); }
    });
    if (songs.length) m.songs = songs;
  }
  return m;
}
function manifestPaths(m) {
  const out = [];
  if (m.notes) for (const k of ["don", "ka"]) if (m.notes[k] && m.notes[k].image) out.push({ path:m.notes[k].image, kind:"image" });
  if (m.sounds) for (const k of ["don", "ka"]) if (m.sounds[k]) out.push({ path:m.sounds[k], kind:"sound" });
  if (m.mascot && m.mascot.vrm) out.push({ path:m.mascot.vrm, kind:"vrm" });
  if (m.mascot && m.mascot.motion) out.push({ path:m.mascot.motion, kind:"vrma" });
  for (const s of m.songs || []) {
    out.push({ path:s.audio, kind:"audio" });
    if (s.background) out.push({ path:s.background, kind:"bg" });
    for (const p of Object.values(s.charts || {})) out.push({ path:p, kind:"chart" });
  }
  return out;
}
const hasLook = m => !!(m.skin || m.notes || m.sounds || m.fx || m.mascot);

/* ============ パックの保存・追加・適用 ============ */
/* ⚠ sizeKey/sizeOf を渡すと、合計を「index のキー（数値）だけ」で数えられる（Blob を復元しない）。
   sizeOf は「size を持たない古いレコード」の移行と、件数が食い違ったときの数え直しに使う。 */
const packDB = core.idbStore("shadow_taiko_packs", "packs", { sizeKey:"size", sizeOf:packRecordBytes });
const packRuntime = { id:null, captions:null, noteImages:[null, null], urls:[], skinId:null, hadSounds:false };
const noteImage = lane => { const im = packRuntime.noteImages[lane]; return im && im.complete && im.naturalWidth ? im : null; };
function packRecordBytes(record) {
  if (!record || typeof record !== "object") return 0;
  /* 新しいレコードは合計を size に持っているので、それを優先する（files を数え直さない） */
  if (Number.isFinite(record.size) && record.size >= 0) return record.size;
  const files = record.files;
  if (!files || typeof files !== "object") return 0;
  return Object.keys(files).reduce((sum, key) => {
    const file = files[key];
    return sum + (file && Number.isFinite(file.size) && file.size > 0 ? file.size : 0);
  }, 0);
}
/* 集計値（{ stored, replacing }）から、保存後の見込み合計を出す。
   同じ名前・作者のパックを更新するときは、置き換える前の分を差し引く。 */
function packProjected(stats, incoming) { return stats.stored - stats.replacing + incoming; }
/* 容量チェック。合計は index のキーだけで数えるので、レコード本体（Blob）を復元しない。
   ⚠ 「size を持たないレコードがある」ときは idbStore 側が自動で全件を数え直す（過小計上＝上限の素通しを防ぐ）。 */
async function checkPackStorageCapacity(id, incoming) {
  let stats, prev;
  try { stats = await packDB.usage(); }
  catch (_) { throw new PackError("packStorageCheckFailed"); }
  try { prev = await packDB.get(id); } catch (_) { prev = null; }   /* 置き換えられる分（1件だけ読む） */
  const replacing = prev ? packRecordBytes(prev) : 0;
  if (packProjected({ stored:stats.stored, replacing }, incoming) > PACK_STORE_MAX) {
    throw new PackError("packStoreLimit", { max:PACK_STORE_MAX / PACK_MB });
  }
  try {
    const storage = typeof navigator !== "undefined" && navigator.storage;
    if (storage && typeof storage.estimate === "function") {
      const estimate = await storage.estimate();
      if (Number.isFinite(estimate.quota) && Number.isFinite(estimate.usage)) {
        const available = Math.max(0, estimate.quota - estimate.usage) + replacing;
        if (incoming > available) throw new PackError("packStorageQuota");
      }
    }
  } catch (e) { if (e instanceof PackError) throw e; }  // estimate() is advisory; IndexedDB remains the final authority
}

let packInstallQueue = Promise.resolve();
function installPackFile(file) {
  const task = packInstallQueue.then(() => installPackFileSerial(file));
  packInstallQueue = task.then(() => undefined, () => undefined);
  return task;
}
async function installPackFileSerial(file) {
  core.setStatus("packStatus", "packReading");
  try {
    if (file.size > PACK_MAX) throw new PackError("packTooBig");
    const entries = await readZip(file);
    const mf = Object.keys(entries).filter(n => !n.startsWith("__MACOSX/") && /(^|\/)pack\.json$/.test(n)).sort((a, b) => a.length - b.length)[0];
    if (!mf) throw new PackError("packNoManifest");
    const root = mf.slice(0, mf.length - "pack.json".length);
    let raw = null;
    try { raw = JSON.parse(await (await inflateEntry(entries[mf], PACK_MB, mf)).text()); } catch (e) { if (e instanceof PackError) throw e; }
    const man = sanitizeManifest(raw);
    if (!man) throw new PackError("packBadManifest");
    const files = {}; let total = 0;
    for (const { path, kind } of manifestPaths(man)) {
      if (files[path]) continue;
      const ent = entries[root + path], lim = PACK_LIMIT[kind] * PACK_MB;
      if (!ent) throw new PackError("packMissingFile", { f:path });
      if (ent.usize > lim) throw new PackError("packFileTooBig", { f:path });
      const blob = await inflateEntry(ent, lim, path);   /* 🛡 展開中に上限で止める */
      if (blob.size > lim) throw new PackError("packFileTooBig", { f:path });
      total += blob.size; if (total > PACK_MAX) throw new PackError("packTooBig");
      files[path] = new Blob([blob], { type:MIME[core.extOf(path)] || "" });
    }
    const id = "p" + core.hashString(`${man.name}|${man.author}`).toString(36);
    await checkPackStorageCapacity(id, total);
    const record = { id, manifest:man, files, size:total, installedAt:Date.now() };
    /* 最終的な上限判定と保存を**同じ readwrite トランザクション**で行う（複数タブ間の競合を防ぐ）。
       ここでも合計は index のキーだけで数えるので、Blob を復元せずロック時間も短い。 */
    const stored = await packDB.putIf(id, record, stats => packProjected(stats, total) <= PACK_STORE_MAX);
    if (!stored) throw new PackError("packStoreLimit", { max:PACK_STORE_MAX / PACK_MB });
    core.setStatus("packStatus", "packInstalled", { name:man.name });
    await renderPackList();
    if (man.songs) core.emit("packsChanged");
    return { id, man };
  } catch (e) {
    console.error(e);
    const quotaError = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
    /* バージョン変更が他のタブにブロックされた（onblocked）。放置すると固まるので案内を出す */
    const blockedError = !!e && (e.message === "idb-blocked" || e.name === "BlockedError");
    core.setStatus("packStatus", e instanceof PackError ? e.key
      : blockedError ? "packDbBlocked" : quotaError ? "packStorageQuota" : "packBadZip", e && e.vars);
    return null;
  }
}
function loadImageBlob(blob) {
  return new Promise(res => {
    const url = URL.createObjectURL(blob), im = new Image();
    im.onload = () => res({ im, url }); im.onerror = () => { URL.revokeObjectURL(url); res(null); };
    im.src = url;
  });
}
function whenVrmReady(fn) {
  if (window.ShadowTaikoVRM) fn(window.ShadowTaikoVRM);
  else addEventListener("stvrm-ready", () => fn(window.ShadowTaikoVRM), { once:true });
}
async function activatePack(id, { restore = false, skipConfirm = false } = {}) {
  let rec = null; try { rec = await packDB.get(id); } catch (_) {}
  if (!rec || !hasLook(rec.manifest)) { if (restore) { core.settings.activePack = null; core.saveUserPrefs(); } return false; }
  const m = rec.manifest, f = rec.files || {};
  if (!restore && !skipConfirm && m.mascot && m.mascot.vrm && !confirm(tr("packConfirm") + (m.license || "—"))) return false;
  deactivatePack(false);
  packRuntime.id = id;
  packRuntime.captions = (m.mascot && m.mascot.captions) || null;
  if (m.skin) {
    const sid = "pack_" + id, s = window.Trk.data.buildCustomSkin({ ...m.skin, mascot:m.mascot && m.mascot.vrm ? "vrm" : m.skin.mascot });
    s.custom = false; s.pack = true;
    s.label = { en:m.name }; s.desc = { ja:"📦 パック", en:"📦 Pack", zh:"📦 资源包", ko:"📦 팩" };
    window.Trk.data.SKINS[sid] = s; packRuntime.skinId = sid; core.buildSkinGrid();
    if (!restore || core.savedSkinAtBoot === sid) core.applySkin(sid);
  }
  if (m.notes) {
    if (!restore) {
      const cur = core.settings.notes;
      setNotes([0, 1].map(i => { const n = m.notes[i ? "ka" : "don"] || {}; return { color:n.color || cur[i].color, shape:n.shape || cur[i].shape }; }));
    }
    for (const i of [0, 1]) {
      const n = m.notes[i ? "ka" : "don"];
      if (n && n.image && f[n.image]) { const r = await loadImageBlob(f[n.image]); if (r) { packRuntime.noteImages[i] = r.im; packRuntime.urls.push(r.url); } }
    }
  }
  if (m.sounds) {
    for (const i of [0, 1]) {
      const p = m.sounds[i ? "ka" : "don"];
      if (p && f[p]) { try { window.Trk.media.seBuffers[i] = await window.Trk.media.decodeAudio(await f[p].arrayBuffer()); packRuntime.hadSounds = true; } catch (_) {} }
    }
    if (packRuntime.hadSounds && !restore) { core.settings.seEnabled = true; core.$("seEnabled").checked = true; core.setStatus("seStatus", "seOn"); }
  }
  if (m.fx && !restore) { core.settings.fxPower = m.fx.power; core.$("fxPower").value = m.fx.power; if (typeof showFxPower === "function") showFxPower(); }
  if (m.mascot && m.mascot.vrm && f[m.mascot.vrm]) {
    const mm = m.mascot;
    whenVrmReady(api => api.loadFromPack(f[mm.vrm], { name:m.name, motion:mm.motion ? f[mm.motion] : null,
      motionBpm:mm.motionBpm, frame:mm.frame, turn:mm.turn, select:!restore }));
  }
  core.settings.activePack = id; core.saveUserPrefs(); updateMascotUI();
  if (!restore) core.setStatus("packStatus", "packActivated", { name:m.name });
  await renderPackList();
  return true;
}
function deactivatePack(persist = true) {
  if (packRuntime.id) {
    if (packRuntime.skinId) {
      const sid = packRuntime.skinId; delete window.Trk.data.SKINS[sid];
      if (core.settings.skin === sid) core.applySkin("shadow", false);
      core.buildSkinGrid();
    }
    packRuntime.urls.forEach(u => URL.revokeObjectURL(u));
    if (packRuntime.hadSounds) {   // 自分で読み込んだSEがあればそれに戻す
      for (const i of [0, 1]) { window.Trk.media.seBuffers[i] = null; if (window.Trk.media.seFiles[i]) window.Trk.media.loadSE(window.Trk.media.seFiles[i], i); }
    }
    Object.assign(packRuntime, { id:null, captions:null, noteImages:[null, null], urls:[], skinId:null, hadSounds:false });
    if (window.ShadowTaikoVRM) window.ShadowTaikoVRM.unloadPack();
  }
  if (persist) { core.settings.activePack = null; core.saveUserPrefs(); updateMascotUI(); core.setStatus("packStatus", "packDeactivated"); renderPackList(); }
}
async function installAndUse(file, skipConfirm = false) {
  const r = await installPackFile(file);
  if (!r) return;
  if (r.man.songs) core.setStatus("libStatus", "packSongsAdded", { n:r.man.songs.length });
  if (hasLook(r.man)) await activatePack(r.id, { skipConfirm });
}
/* 曲リスト（library.js）に渡す、全パックの曲一覧 */
async function getPackSongs() {
  let recs = []; try { recs = await packDB.all(); } catch (_) {}
  const out = [];
  for (const r of recs) {
    for (const s of (r.manifest && r.manifest.songs) || []) {
      const f = r.files || {}; if (!f[s.audio]) continue;
      const charts = {}; for (const [d, p] of Object.entries(s.charts || {})) if (f[p]) charts[d] = f[p];
      out.push({ ...s, key:`${r.id}/${s.id}`, packId:r.id, packName:r.manifest.name,
        audioBlob:f[s.audio], bgBlob:s.background ? f[s.background] || null : null, chartBlobs:charts });
    }
  }
  return out;
}

/* ============ 書き出し：見た目パック ============ */
const PACK_README = `trk! Custom Pack (.stpack)
==========================
trk! is AGRG! — an All-Generation Rhythm Game
https://github.com/  (← 配布するときは、リポジトリのURLに書き換えてください)

[日本語]
・.stpack の中身はZIPです。いちばん上に pack.json を置いてください。
・pack.json の "format" は "shadow-taiko-pack" のままにしてください（互換のための形式名です）。
・ファイル名は半角英数字にしてください（例：notes/don.png、songs/s1/audio.mp3）。
・ノーツ画像：PNG／WebP／JPG（4MBまで）　背景画像：8MBまで
・効果音：WAV／MP3／OGG／M4A（5MBまで）
・曲：MP3／M4A／OGG／OPUS／WAV／FLAC／AAC／MP4／WebM（250MBまで）、譜面JSON（2MBまで）、1パック50曲まで
・譜面は MANUAL／TRUCK／ORBIT／STAGE／CATCH のどのモードでも共通で使われます。
・VRM：VRM 1.0 のみ（200MBまで）／モーション：.vrma（30MBまで）
・pack.json の creditCard で、作者名・肩書き・権利メモ・利用条件を名刺のように表示できます。contributors で最大12人の共同制作者も記載できます（画像は含めません）。
・書き出したパックには、creditCard から自動生成した CREDITS.md も入ります。trk! の一覧から共有用SVG名刺をダウンロードできます。
・自分に再配布の権利がある素材・曲だけを入れてください。
・trk! の画面にドロップするだけで追加できます。

[English]
- A .stpack is a ZIP file. Put pack.json at the top level.
- Keep "format": "shadow-taiko-pack" in pack.json (legacy name kept for compatibility).
- Use ASCII file names (e.g. notes/don.png, songs/s1/audio.mp3).
- Note images: PNG/WebP/JPG (max 4 MB). Backgrounds: max 8 MB.
- Hit sounds: WAV/MP3/OGG/M4A (max 5 MB)
- Songs: MP3/M4A/OGG/OPUS/WAV/FLAC/AAC/MP4/WebM (max 250 MB), chart JSON (max 2 MB), up to 50 songs per pack
- Charts are shared by every mode: MANUAL / TRUCK / ORBIT / STAGE / CATCH.
- VRM: VRM 1.0 only (max 200 MB) / Motion: .vrma (max 30 MB)
- Use optional creditCard in pack.json to show the creator, role, rights note and terms like a name card. Add up to 12 contributors for co-creators (text only; no image asset).
- Exported packs include a generated CREDITS.md; the pack list can also download a shareable SVG card.
- Only include assets and songs you have the right to redistribute.
- Drop the file onto the trk! window to install.
`;
function packToZip(man, files) {
  const entries = [{ name:"pack.json", blob:new Blob([JSON.stringify(man, null, 2)], { type:"application/json" }) },
                   { name:"README.txt", blob:new Blob([PACK_README], { type:"text/plain" }) },
                   { name:"CREDITS.md", blob:new Blob([creditCardMarkdown(man)], { type:"text/markdown;charset=utf-8" }) }];
  for (const [p, b] of Object.entries(files)) entries.push({ name:p, blob:b });
  return writeZip(entries);
}
async function buildPack() {
  const name = core.$("packName").value.trim().slice(0, 40);
  if (!name) { core.setStatus("packStatus", "packNeedName"); return; }
  const man = { format:PACK_FORMAT, version:1, name, author:core.$("packAuthor").value, description:core.$("packDesc").value,
                license:core.$("packLicense").value, url:core.$("packUrl").value.trim() };
  if (core.$("packCreditCard").checked) {
    man.creditCard = { name:core.$("packAuthor").value.trim() || name, role:core.$("packRole").value, tagline:core.$("packDesc").value,
                       license:core.$("packLicense").value, rights:core.$("packRights").value, url:core.$("packUrl").value.trim() };
  }
  const files = {}, vf = window.ShadowTaikoVRM ? window.ShadowTaikoVRM.getFiles() : {};
  if (core.$("incSkin").checked) { man.skin = defFromSkin(core.settings.skin); man.fx = { power:core.settings.fxPower }; }
  if (core.$("incNotes").checked) {
    man.notes = {};
    for (const i of [0, 1]) {
      const key = i ? "ka" : "don", n = { color:core.settings.notes[i].color, shape:core.settings.notes[i].shape };
      const img = core.$(i ? "packKaImg" : "packDonImg").files[0];
      if (img) {
        const ext = core.extOf(img.name);
        if (!IMG_EXT.includes(ext) || img.size > PACK_LIMIT.image * PACK_MB) { core.setStatus("packStatus", "packImgBad"); return; }
        n.image = `notes/${key}.${ext}`; files[n.image] = img;
      }
      man.notes[key] = n;
    }
  }
  if (core.$("incSounds").checked) {
    man.sounds = {};
    for (const i of [0, 1]) {
      const sf = window.Trk.media.seFiles[i];
      if (sf && SND_EXT.includes(core.extOf(sf.name)) && sf.size <= PACK_LIMIT.sound * PACK_MB) {
        const p = `sounds/${i ? "ka" : "don"}.${core.extOf(sf.name)}`; man.sounds[i ? "ka" : "don"] = p; files[p] = sf;
      }
    }
  }
  const mascot = {};
  if (core.$("incVrm").checked && vf.vrm) {
    if (!vf.allowRedistribution && !core.$("packVrmOk").checked) { core.setStatus("packStatus", "packVrmNoRedist"); return; }
    mascot.vrm = "mascot/model.vrm"; files[mascot.vrm] = vf.vrm;
    mascot.frame = core.settings.vrmFrame; mascot.turn = core.settings.vrmTurn;
  }
  if (core.$("incMotion").checked && vf.motion) {
    mascot.motion = "mascot/motion.vrma"; files[mascot.motion] = vf.motion;
    if (core.settings.vrmMotionBpm) mascot.motionBpm = core.settings.vrmMotionBpm;
  }
  if (core.$("incCaptions").checked) {
    const caps = {};
    for (const [k, id] of [["capStart", "capStartTxt"], ["capCombo", "capComboTxt"], ["capBreak", "capBreakTxt"]]) {
      const t = core.$(id).value.trim(); if (t) caps[k] = { [lang]:t };
    }
    if (Object.keys(caps).length) mascot.captions = caps;
  }
  if (Object.keys(mascot).length) man.mascot = mascot;
  const clean = sanitizeManifest(man);
  if (!clean) { core.setStatus("packStatus", "packBadManifest"); return; }
  const out = {};
  for (const { path } of manifestPaths(clean)) if (files[path]) out[path] = files[path];
  const blob = await packToZip(clean, out), fname = `${core.safeName(name)}.stpack`;
  core.downloadBlob(blob, fname);
  core.setStatus("packStatus", "packBuilt");
  if (core.$("packInstallToo").checked) await installAndUse(new File([blob], fname), true);
}

/* ============ 書き出し：曲パック（選曲画面から） ============ */
async function buildSongPack() {
  const song = core.currentSong;
  if (!song || !core.videoReady || !song.file) { core.setStatus("spStatus", "spNoSong"); return; }
  if (!core.$("spRightsOk").checked) { core.setStatus("spStatus", "spNeedRights"); return; }
  const audioExt = SONG_EXT.includes(core.extOf(song.file.name || "")) ? core.extOf(song.file.name) : "mp3";
  if (song.file.size > PACK_LIMIT.audio * PACK_MB) { core.setStatus("spStatus", "spSongTooBig"); return; }
  const dir = "songs/s1", files = {}, charts = {};
  const bpm = Number(core.$("bpm").value), offset = Number(core.$("offset").value) || 0, seed = core.$("seed").value;
  const meta = { bpm, offset };
  if (core.$("spIncGenerated").checked && bpm >= 60 && bpm <= 300) {
    for (const d of ["easy", "normal", "hard"]) {
      const notes = window.Trk.media.generateNotes(d, bpm, offset, seed);
      if (notes.length) { charts[d] = `${dir}/${d}.json`; files[charts[d]] = new Blob([JSON.stringify(window.Trk.media.chartToData(notes, d, meta))], { type:"application/json" }); }
    }
  }
  if (core.$("spIncCurrent").checked && core.chart.length) {
    charts[core.chartDiff] = `${dir}/${core.chartDiff}.json`;
    files[charts[core.chartDiff]] = new Blob([JSON.stringify(window.Trk.media.chartToData(core.chart, core.chartDiff))], { type:"application/json" });
  }
  if (!Object.keys(charts).length) { core.setStatus("spStatus", "spNoCharts"); return; }
  let bgPath = null;
  const bgFile = core.$("spBg").files[0] || song.bgBlob || null;
  if (bgFile) {
    const ext = bgFile.name ? core.extOf(bgFile.name) : ({ "image/png":"png", "image/webp":"webp", "image/jpeg":"jpg" }[bgFile.type] || "");
    if (!IMG_EXT.includes(ext) || bgFile.size > PACK_LIMIT.bg * PACK_MB) { core.setStatus("spStatus", "spBgBad"); return; }
    bgPath = `${dir}/bg.${ext}`; files[bgPath] = bgFile;
  }
  files[`${dir}/audio.${audioExt}`] = song.file;
  const title = (song.title || core.baseName(core.mediaName)).slice(0, 80);
  const s = { id:"s1", title, artist:core.$("spArtist").value, charter:core.$("spCharter").value, license:core.$("spLicense").value,
    audio:`${dir}/audio.${audioExt}`, bpm, offset, charts };
  if (bgPath) s.background = bgPath;
  if (song.previewStart != null) s.previewStart = song.previewStart;
  const rawMan = { format:PACK_FORMAT, version:1, name:title.slice(0, 40), author:core.$("spCharter").value,
    description:core.$("spArtist").value, license:core.$("spLicense").value, songs:[s] };
  if (core.$("spCreditCard").checked) {
    const artist = core.$("spArtist").value.trim(), charter = core.$("spCharter").value.trim(), terms = core.$("spLicense").value.trim();
    rawMan.creditCard = { name:artist || title, role:charter ? `Charter: ${charter}` : "Song creator", tagline:title,
                          rights:terms, license:terms };
  }
  const man = sanitizeManifest(rawMan);
  if (!man) { core.setStatus("spStatus", "packBadManifest"); return; }
  const out = {}; for (const { path } of manifestPaths(man)) if (files[path]) out[path] = files[path];
  core.downloadBlob(await packToZip(man, out), `${core.safeName(title)}.stpack`);
  core.setStatus("spStatus", "spBuilt");
}

/* ============ パック一覧（中身はすべて textContent で表示） ============ */
function creditCardText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[lang] || value.en || value.ja || value.zh || value.ko || "";
}
function creditCardXml(value) {
  return String(value || "").replace(/[&<>\"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '\"':"&quot;", "'":"&apos;" }[c]));
}
function creditCardMarkdownText(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}
function creditCardSvg(card, packName = "") {
  const lines = [card.name, creditCardText(card.role), creditCardText(card.tagline), card.license, creditCardText(card.rights), card.url]
    .filter(Boolean).concat((card.contributors || []).map(p => `${p.name}${creditCardText(p.role) ? " · " + creditCardText(p.role) : ""}`));
  const text = lines.slice(0, 14).map((line, i) => `<text x="64" y="${126 + i * 23}" class="${i === 0 ? "name" : i === 1 ? "role" : "line"}">${creditCardXml(line)}</text>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" role="img" aria-label="trk! rights card"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#ff4c67"/><stop offset="1" stop-color="#67c8ff"/></linearGradient></defs><rect width="900" height="520" rx="36" fill="#101521"/><rect x="18" y="18" width="864" height="484" rx="28" fill="none" stroke="url(#g)" stroke-width="4"/><circle cx="790" cy="92" r="58" fill="#ff4c67" opacity=".16"/><circle cx="790" cy="92" r="34" fill="#67c8ff" opacity=".12"/><text x="64" y="72" class="eyebrow">TRK! RIGHTS CARD</text><text x="64" y="100" class="pack">${creditCardXml(packName || "trk! pack")}</text>${text}<text x="64" y="474" class="foot">Text-only credit card · keep the original license / ReadMe with the pack</text><style>.eyebrow{font:800 15px system-ui;letter-spacing:4px;fill:#8dd8ff}.pack{font:900 30px system-ui;fill:#fff}.name{font:800 25px system-ui;fill:#fff}.role{font:700 16px system-ui;fill:#ffd166}.line{font:500 16px system-ui;fill:#b9c8df}.foot{font:500 12px system-ui;fill:#71809a}</style></svg>`;
}
function creditCardMarkdown(man) {
  const c = man.creditCard;
  if (!c) return "# Credits\n\nNo credit card was supplied for this pack.\n";
  const lines = [`# Credits — ${creditCardMarkdownText(man.name)}`, "", `- Name: ${creditCardMarkdownText(c.name)}`];
  const add = (label, value) => { const text = creditCardMarkdownText(value); if (text) lines.push(`- ${label}: ${text}`); };
  add("Role", creditCardText(c.role)); add("Tagline", creditCardText(c.tagline)); add("Rights", creditCardText(c.rights));
  add("License", c.license); add("Handle", c.handle); add("URL", c.url);
  if (c.contributors && c.contributors.length) {
    lines.push("", "## Contributors");
    for (const p of c.contributors) {
      lines.push("", `### ${creditCardMarkdownText(p.name)}`);
      const personAdd = (label, value) => { const text = creditCardMarkdownText(value); if (text) lines.push(`- ${label}: ${text}`); };
      personAdd("Role", creditCardText(p.role)); personAdd("Rights", creditCardText(p.rights));
      personAdd("License", p.license); personAdd("Handle", p.handle); personAdd("URL", p.url);
    }
  }
  lines.push("", "> This card is a creator-provided summary, not a substitute for the original license or ReadMe.");
  return lines.join("\n") + "\n";
}
function appendPackCreditCard(parent, card, packName = "") {
  if (!card || !card.name) return;
  const d = core.el("details", "packCreditCardBox");
  d.append(core.el("summary", "", tr("packCreditTitle")));
  const body = core.el("div", "packCreditCardInner");
  body.append(core.el("strong", "packCreditName", card.name));
  const role = creditCardText(card.role); if (role) body.append(core.el("div", "packCreditRole", role));
  const tagline = creditCardText(card.tagline); if (tagline) body.append(core.el("p", "packCreditTagline", tagline));
  const rights = creditCardText(card.rights); if (rights) body.append(core.el("p", "packCreditRights", "⚖ " + rights));
  if (card.license) body.append(core.el("p", "packCreditLicense", "▣ " + card.license));
  if (card.handle) body.append(core.el("p", "packCreditHandle", (card.handle.startsWith("@") ? card.handle : "@" + card.handle)));
  if (card.url) body.append(core.safeLink("packCreditUrl", card.url));   /* 🛡 https 以外はリンクにしない */
  body.append(core.el("p", "packCreditDisclaimer", tr("packCreditDisclaimer")));
  const contributors = card.contributors || [];
  if (contributors.length) {
    body.append(core.el("h4", "packContributorsTitle", tr("packContributors", { n:contributors.length })));
    const list = core.el("ul", "packContributors");
    for (const person of contributors) {
      const item = core.el("li", "packContributor");
      const head = core.el("div", "packContributorHead"); head.append(core.el("strong", "packContributorName", person.name));
      const personRole = creditCardText(person.role); if (personRole) head.append(core.el("span", "packContributorRole", personRole));
      item.append(head);
      const personRights = creditCardText(person.rights); if (personRights) item.append(core.el("div", "packContributorRights", "⚖ " + personRights));
      if (person.license) item.append(core.el("div", "packContributorLicense", "▣ " + person.license));
      if (person.handle) item.append(core.el("div", "packContributorHandle", person.handle.startsWith("@") ? person.handle : "@" + person.handle));
      if (person.url) item.append(core.safeLink("packContributorUrl", person.url));   /* 🛡 https 以外はリンクにしない */
      list.append(item);
    }
    body.append(list);
  }
  const download = core.el("button", "packCreditDownload", tr("packCreditDownload")); download.type = "button";
  download.addEventListener("click", () => core.downloadBlob(new Blob([creditCardSvg(card, packName)], { type:"image/svg+xml;charset=utf-8" }), `${core.safeName(packName || card.name)}-rights-card.svg`));
  body.append(download);
  d.append(body); parent.append(d);
}
async function renderPackList() {
  const box = core.$("packList"); let recs = [];
  try { recs = await packDB.all(); } catch (_) {}
  box.textContent = "";
  if (!recs.length) { box.append(core.el("div", "hint", tr("packEmpty"))); return; }
  recs.sort((a, b) => (b.installedAt || 0) - (a.installedAt || 0));
  for (const r of recs) {
    const m = r.manifest, on = packRuntime.id === r.id, card = core.el("div", "packCard" + (on ? " active" : ""));
    const head = core.el("div", "packHead"); head.append(core.el("b", "", m.name));
    if (m.author) head.append(core.el("span", "packBy", "by " + m.author));
    head.append(core.el("span", "packBy", `${((r.size || 0) / PACK_MB).toFixed(1)} MB`));
    card.append(head);
    if (m.description) card.append(core.el("div", "hint", m.description));
    const badges = core.el("div", "packBadges");
    [[m.skin, "badgeSkin"], [m.notes, "badgeNotes"], [m.sounds, "badgeSounds"], [m.mascot && m.mascot.vrm, "badgeVrm"],
     [m.mascot && m.mascot.motion, "badgeMotion"], [m.mascot && m.mascot.captions, "badgeCaptions"]]
      .forEach(([v, k]) => { if (v) badges.append(core.el("span", "packBadge", tr(k))); });
    if (m.songs) badges.append(core.el("span", "packBadge", tr("badgeSongs", { n:m.songs.length })));
    if (m.creditCard) badges.append(core.el("span", "packBadge", tr("badgeCreditCard")));
    card.append(badges);
    appendPackCreditCard(card, m.creditCard, m.name);
    if (m.license || m.url) {
      const d = core.el("details"); d.append(core.el("summary", "", tr("packLicenseLabel")));
      if (m.license) d.append(core.el("div", "", m.license));
      if (m.url) d.append(core.safeLink("", m.url));   /* 🛡 https 以外はリンクにしない */
      card.append(d);
    }
    const acts = core.el("div", "miniActions");
    if (hasLook(m)) {
      const use = core.el("button", "", tr(on ? "packActive" : "packUse")); use.type = "button"; use.disabled = on;
      use.addEventListener("click", () => activatePack(r.id));
      acts.append(use);
    }
    const ex = core.el("button", "", tr("packExport")); ex.type = "button";
    ex.addEventListener("click", async () => core.downloadBlob(await packToZip(m, r.files || {}), `${core.safeName(m.name)}.stpack`));
    const del = core.el("button", "", tr("packDelete")); del.type = "button";
    del.addEventListener("click", async () => {
      if (!confirm(tr("confirmDeletePack"))) return;
      if (packRuntime.id === r.id) deactivatePack();
      try { await packDB.del(r.id); } catch (_) {}
      core.setStatus("packStatus", "packDeleted"); await renderPackList();
      if (m.songs) core.emit("packsChanged");
    });
    acts.append(ex, del); card.append(acts); box.append(card);
  }
}

/* 起動時：一覧を出して、使っていたパックを戻す（main.js から呼びます） */
async function initPacks() {
  await renderPackList();
  if (core.settings.activePack) await activatePack(core.settings.activePack, { restore:true });
}

/* ============ イベント ============ */
core.$("packFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) installAndUse(f); });
core.$("songPackFile").addEventListener("change", e => { const f = e.target.files[0]; e.target.value = ""; if (f) installAndUse(f); });
core.$("packOffBtn").addEventListener("click", () => deactivatePack());
core.$("packBuildBtn").addEventListener("click", () => { buildPack().catch(e => { console.error(e); core.setStatus("packStatus", "packBadZip"); }); });
core.$("spBuildBtn").addEventListener("click", () => { buildSongPack().catch(e => { console.error(e); core.setStatus("spStatus", "packBadZip"); }); });
on("language", renderPackList);
addEventListener("drop", e => {      // .stpack / .zip は他の処理より先に受け取る
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!f || !/\.(stpack|zip)$/i.test(f.name)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (core.phase !== "title") return;
  installAndUse(f);
}, true);
/* ✅ custom.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
/* 後から読み込まれるファイルがこの名前を差し替える（window.getPackSongs の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "getPackSongs", { configurable:true, get:() => getPackSongs, set:v => { getPackSongs = v; } });
window.initPacks = initPacks;
/* 後から読み込まれるファイルがこの名前を差し替える（window.installPackFile の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "installPackFile", { configurable:true, get:() => installPackFile, set:v => { installPackFile = v; } });
window.noteImage = noteImage;
window.packDB = packDB;
window.packRuntime = packRuntime;
/* 後から読み込まれるファイルがこの名前を差し替える（window.renderPackList の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "renderPackList", { configurable:true, get:() => renderPackList, set:v => { renderPackList = v; } });
/* 後から読み込まれるファイルがこの名前を差し替える（window.sanitizeSong の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "sanitizeSong", { configurable:true, get:() => sanitizeSong, set:v => { sanitizeSong = v; } });
window.skinShelf = skinShelf;
window.syncNoteUI = syncNoteUI;
window.updateMascotUI = updateMascotUI;
/* 領域（window.Trk.custom）：公開名の正規の場所。旧名（window.X）は別名として残す（利用者の決定） */
window.Trk = window.Trk || {};
window.Trk.custom = Object.assign(window.Trk.custom || {}, { initPacks, noteImage, packDB, packRuntime, skinShelf, syncNoteUI, updateMascotUI });
Object.defineProperty(window.Trk.custom, "getPackSongs", { configurable:true, get:() => getPackSongs, set:v => { getPackSongs = v; } });
Object.defineProperty(window.Trk.custom, "installPackFile", { configurable:true, get:() => installPackFile, set:v => { installPackFile = v; } });
Object.defineProperty(window.Trk.custom, "renderPackList", { configurable:true, get:() => renderPackList, set:v => { renderPackList = v; } });
Object.defineProperty(window.Trk.custom, "sanitizeSong", { configurable:true, get:() => sanitizeSong, set:v => { sanitizeSong = v; } });
})();
