// SPDX-License-Identifier: GPL-3.0-or-later
/* ローカル音源に埋め込まれたジャケット画像を読む（通信・保存なし）。
   対応: ID3 APIC/PIC、MP4/M4A covr、FLAC picture、Ogg Vorbis/Opus picture comments。
   読み出すメタデータと画像サイズを制限し、サムネイルだけをメモリ上で作る。 */
(() => {
"use strict";
const MAX_TAG_BYTES = 16 * 1024 * 1024;
const MAX_ART_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_EDGE = 8192;
const MAX_IMAGE_PIXELS = 12_000_000;
const THUMB_EDGE = 256;
const textDecoder = typeof TextDecoder === "function" ? new TextDecoder("utf-8") : null;

function ascii(bytes, start, length) {
  let out = "";
  for (let i = 0; i < length && start + i < bytes.length; i++) out += String.fromCharCode(bytes[start + i]);
  return out;
}
function u24be(b, p) { return ((b[p] << 16) | (b[p + 1] << 8) | b[p + 2]) >>> 0; }
function u32be(b, p) { return ((b[p] * 0x1000000) + (b[p + 1] << 16) + (b[p + 2] << 8) + b[p + 3]) >>> 0; }
function u32le(b, p) { return (b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)) >>> 0; }
function u64be(b, p) {
  const hi = u32be(b, p), lo = u32be(b, p + 4);
  const value = hi * 0x100000000 + lo;
  return Number.isSafeInteger(value) ? value : Infinity;
}
function syncsafe(b, p) {
  if (b[p] & 0x80 || b[p + 1] & 0x80 || b[p + 2] & 0x80 || b[p + 3] & 0x80) return -1;
  return (b[p] << 21) | (b[p + 1] << 14) | (b[p + 2] << 7) | b[p + 3];
}
async function readRange(file, start, end, cap = MAX_TAG_BYTES) {
  if (!file || typeof file.slice !== "function" || !Number.isFinite(file.size)) return null;
  start = Math.max(0, Math.floor(start)); end = Math.min(file.size, Math.floor(end));
  if (end <= start || end - start > cap) return null;
  try {
    const part = file.slice(start, end);
    if (!part || part.size > cap) return null;
    const data = new Uint8Array(await part.arrayBuffer());
    return data.length <= cap ? data : null;
  } catch (_) { return null; }
}
function imageMime(data) {
  if (!data || data.length < 12) return "";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 24 && data[0] === 0x89 && ascii(data, 1, 3) === "PNG" && ascii(data, 12, 4) === "IHDR") return "image/png";
  if (ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 4) === "WEBP") return "image/webp";
  return "";
}
function candidate(data) {
  if (!(data instanceof Uint8Array) || data.length < 12 || data.length > MAX_ART_BYTES) return null;
  const type = imageMime(data);
  if (!type) return null;                    // reject SVG, HTML and unknown payloads regardless of tag MIME
  try { return new Blob([data.slice()], { type }); } catch (_) { return null; }
}
function findTextEnd(data, start, encoding) {
  if (encoding === 1 || encoding === 2) {
    for (let i = start; i + 1 < data.length; i += 2) if (data[i] === 0 && data[i + 1] === 0) return i + 2;
    return -1;
  }
  for (let i = start; i < data.length; i++) if (data[i] === 0) return i + 1;
  return -1;
}
function parsePictureFrame(data, version) {
  if (!data.length) return null;
  const encoding = data[0];
  let p = 1, mime = "";
  if (version === 2) {
    if (p + 4 > data.length) return null;
    const format = ascii(data, p, 3).toUpperCase(); p += 3;
    mime = format === "JPG" || format === "JPEG" ? "image/jpeg" : format === "PNG" ? "image/png" : "";
  } else {
    let end = p;
    while (end < data.length && data[end] !== 0) end++;
    if (end >= data.length || end + 1 >= data.length) return null;
    mime = ascii(data, p, end - p).toLowerCase(); p = end + 1;
  }
  const pictureType = data[p++];
  const imageStart = findTextEnd(data, p, encoding);
  if (imageStart < 0 || imageStart >= data.length) return null;
  return { blob:candidate(data.subarray(imageStart)), pictureType };
}
function removeUnsynchronisation(data) {
  const out = new Uint8Array(data.length); let n = 0;
  for (let i = 0; i < data.length; i++) {
    out[n++] = data[i];
    if (data[i] === 0xff && data[i + 1] === 0 && (i + 2 >= data.length || data[i + 2] === 0 || data[i + 2] >= 0xe0)) i++;
  }
  return out.subarray(0, n);
}
async function extractID3(file) {
  const header = await readRange(file, 0, 10, 10);
  if (!header || ascii(header, 0, 3) !== "ID3") return null;
  const version = header[3], flags = header[5];
  if (version < 2 || version > 4 || (version === 2 && (flags & 0x40))) return null; // compressed v2.2 tag
  const tagSize = syncsafe(header, 6);
  if (tagSize < 0 || tagSize > MAX_TAG_BYTES || tagSize + 10 > file.size) return null;
  let tag = await readRange(file, 10, 10 + tagSize, MAX_TAG_BYTES);
  if (!tag) return null;
  if (flags & 0x80) tag = removeUnsynchronisation(tag);
  let p = 0;
  if (flags & 0x40) {                     // extended header
    if (tag.length < 4) return null;
    const extSize = version === 4 ? syncsafe(tag, 0) : u32be(tag, 0);
    if (extSize < 4 || extSize > tag.length) return null;
    p = version === 4 ? extSize : 4 + extSize;
  }
  let first = null;
  const frameHeader = version === 2 ? 6 : 10;
  while (p + frameHeader <= tag.length) {
    const idLength = version === 2 ? 3 : 4;
    const id = ascii(tag, p, idLength);
    if (!id || /^\x00+$/.test(id)) break;
    const size = version === 2 ? u24be(tag, p + 3)
      : version === 4 ? syncsafe(tag, p + 4) : u32be(tag, p + 4);
    if (!Number.isFinite(size) || size <= 0 || size > tag.length - p - frameHeader) break;
    let flags2 = 0;
    if (version !== 2) flags2 = tag[p + 9];
    const bodyStart = p + frameHeader, bodyEnd = bodyStart + size;
    const unsupportedFlags = version === 3 ? (flags2 & 0xe0) : version === 4 ? (flags2 & 0x4f) : 0;
    if ((id === "APIC" || id === "PIC") && !unsupportedFlags) {
      const found = parsePictureFrame(tag.subarray(bodyStart, bodyEnd), version);
      if (found && found.blob) {
        if (found.pictureType === 3) return found.blob; // front cover wins
        if (!first) first = found.blob;
      }
    }
    p = bodyEnd;
  }
  return first;
}
function parseFlacPicture(data, start = 0, end = data.length) {
  let p = start;
  if (end - p < 32) return null;
  p += 4; // picture type
  const mimeLen = u32be(data, p); p += 4;
  if (mimeLen > 1024 || p + mimeLen + 4 > end) return null;
  p += mimeLen;
  const descLen = u32be(data, p); p += 4;
  if (descLen > 65536 || p + descLen + 20 > end) return null;
  p += descLen + 16;                   // width, height, depth, colors
  const imageLen = u32be(data, p); p += 4;
  if (!imageLen || imageLen > MAX_ART_BYTES || p + imageLen > end) return null;
  return candidate(data.subarray(p, p + imageLen));
}
async function extractFlac(file) {
  const signature = await readRange(file, 0, 4, 4);
  if (!signature || ascii(signature, 0, 4) !== "fLaC") return null;
  let p = 4;
  for (let n = 0; n < 4096 && p + 4 <= file.size && p < MAX_TAG_BYTES; n++) {
    const header = await readRange(file, p, p + 4, 4);
    if (!header) return null;
    const h = header[0], type = h & 0x7f, size = u24be(header, 1), start = p + 4, end = start + size;
    if (end > file.size || end > MAX_TAG_BYTES) return null;
    if (type === 6) {
      const block = await readRange(file, start, end, MAX_ART_BYTES + 128 * 1024);
      if (!block) return null;
      const blob = parseFlacPicture(block); if (blob) return blob;
    }
    p = end;
    if (h & 0x80) break;
  }
  return null;
}
function decodeBase64(value) {
  const clean = String(value || "").replace(/[\t\n\r ]/g, "");
  if (!clean || clean.length > Math.ceil(MAX_ART_BYTES * 4 / 3) + 8 || !/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return null;
  try {
    const raw = atob(clean), out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out.length <= MAX_ART_BYTES ? out : null;
  } catch (_) { return null; }
}
function parseVorbisComments(packet, start) {
  let p = start;
  if (!textDecoder || p + 8 > packet.length) return null;
  const vendorLength = u32le(packet, p); p += 4;
  if (vendorLength > packet.length - p - 4) return null;
  p += vendorLength;
  const count = u32le(packet, p); p += 4;
  if (count > 100_000) return null;
  let picture = null, coverArt = null, coverMime = "";
  for (let i = 0; i < count && p + 4 <= packet.length; i++) {
    const length = u32le(packet, p); p += 4;
    if (!length || length > packet.length - p) return null;
    const text = textDecoder.decode(packet.subarray(p, p + length)); p += length;
    const equal = text.indexOf("="); if (equal <= 0) continue;
    const key = text.slice(0, equal).toUpperCase(), value = text.slice(equal + 1);
    if (key === "METADATA_BLOCK_PICTURE" && !picture) {
      const raw = decodeBase64(value); if (raw) picture = parseFlacPicture(raw);
    } else if (key === "COVERART" && !coverArt) coverArt = decodeBase64(value);
    else if (key === "COVERARTMIME") coverMime = value.slice(0, 100);
  }
  return picture || (coverArt && candidate(coverArt)) || null;
}
function parseCommentPacket(packet) {
  if (packet.length >= 7 && packet[0] === 3 && ascii(packet, 1, 6) === "vorbis") return parseVorbisComments(packet, 7);
  if (packet.length >= 8 && ascii(packet, 0, 8) === "OpusTags") return parseVorbisComments(packet, 8);
  return null;
}
function joinChunks(chunks, length) {
  const out = new Uint8Array(length); let p = 0;
  for (const chunk of chunks) { out.set(chunk, p); p += chunk.length; }
  return out;
}
async function extractOgg(file) {
  let p = 0, serial = null, packetChunks = [], packetLength = 0, packetTooLarge = false;
  for (let pages = 0; pages < 4096 && p + 27 <= file.size && p < MAX_TAG_BYTES; pages++) {
    const header = await readRange(file, p, p + 27, 27);
    if (!header || ascii(header, 0, 4) !== "OggS" || header[4] !== 0) break;
    const pageSerial = u32le(header, 14), segments = header[26];
    if (serial === null) serial = pageSerial;
    const laceStart = p + 27, laces = segments ? await readRange(file, laceStart, laceStart + segments, 255) : new Uint8Array(0);
    if (!laces || laces.length !== segments) break;
    let bodyStart = laceStart + segments, bodySize = 0;
    for (let i = 0; i < segments; i++) bodySize += laces[i];
    const pageEnd = bodyStart + bodySize;
    if (pageEnd > file.size || pageEnd > MAX_TAG_BYTES) break;
    if (pageSerial === serial) {
      const body = bodySize ? await readRange(file, bodyStart, pageEnd, MAX_TAG_BYTES) : new Uint8Array(0);
      if (!body) break;
      let bodyOffset = 0;
      for (let i = 0; i < segments; i++) {
        const length = laces[i], end = bodyOffset + length;
        if (!packetTooLarge) {
          if (packetLength + length <= MAX_TAG_BYTES) { packetChunks.push(body.subarray(bodyOffset, end)); packetLength += length; }
          else { packetTooLarge = true; packetChunks = []; packetLength = 0; }
        }
        bodyOffset = end;
        if (length < 255) {
          if (!packetTooLarge && packetLength) {
            const blob = parseCommentPacket(joinChunks(packetChunks, packetLength));
            if (blob) return blob;
          }
          packetChunks = []; packetLength = 0; packetTooLarge = false;
        }
      }
    }
    p = pageEnd;
  }
  return null;
}
const MP4_CONTAINERS = new Set(["moov", "udta", "meta", "ilst", "trak", "mdia", "minf", "stbl", "edts", "dinf", "mvex"]);
function findMp4Cover(data, start = 0, end = data.length, depth = 0, inCovr = false) {
  if (depth > 10) return null;
  let p = start, count = 0;
  while (p + 8 <= end && count++ < 8192) {
    const size32 = u32be(data, p), type = ascii(data, p + 4, 4);
    let size = size32, header = 8;
    if (size32 === 1) { if (p + 16 > end) break; size = u64be(data, p + 8); header = 16; }
    else if (size32 === 0) size = end - p;
    if (!Number.isSafeInteger(size) || size < header || p + size > end) break;
    const payload = p + header, atomEnd = p + size;
    if (type === "data" && inCovr && atomEnd - payload >= 8) {
      const kind = u32be(data, payload);
      if (kind === 13 || kind === 14 || kind === 0) {
        const blob = candidate(data.subarray(payload + 8, atomEnd));
        if (blob) return blob;
      }
    } else if (type === "covr") {
      const blob = findMp4Cover(data, payload, atomEnd, depth + 1, true); if (blob) return blob;
    } else if (MP4_CONTAINERS.has(type)) {
      const childStart = type === "meta" ? payload + 4 : payload; // full-box version/flags
      if (childStart <= atomEnd) { const blob = findMp4Cover(data, childStart, atomEnd, depth + 1, inCovr); if (blob) return blob; }
    }
    p = atomEnd;
    if (size32 === 0) break;
  }
  return null;
}
async function extractMp4(file) {
  let offset = 0;
  for (let boxes = 0; boxes < 512 && offset + 8 <= file.size; boxes++) {
    const header = await readRange(file, offset, Math.min(file.size, offset + 16), 16);
    if (!header || header.length < 8) return null;
    const size32 = u32be(header, 0), type = ascii(header, 4, 4);
    let size = size32, headerSize = 8;
    if (size32 === 1) { if (header.length < 16) return null; size = u64be(header, 8); headerSize = 16; }
    else if (size32 === 0) size = file.size - offset;
    if (!Number.isSafeInteger(size) || size < headerSize || offset + size > file.size) return null;
    if (type === "moov") {
      if (size - headerSize > MAX_TAG_BYTES) return null;
      const moov = await readRange(file, offset + headerSize, offset + size, MAX_TAG_BYTES);
      return moov ? findMp4Cover(moov) : null;
    }
    if (size32 === 0) return null;
    offset += size;
  }
  return null;
}
async function extract(file) {
  if (!file || !Number.isFinite(file.size) || file.size < 12) return null;
  const ext = String(file.name || "").split(".").pop().toLowerCase();
  try {
    if (["mp3", "aac", "wav"].includes(ext)) return await extractID3(file);
    if (["m4a", "m4b", "mp4"].includes(ext)) return await extractMp4(file);
    if (ext === "flac") return await extractFlac(file);
    if (["ogg", "oga", "opus"].includes(ext)) return await extractOgg(file);
  } catch (_) { return null; }
  return null;
}
function imageDimensions(data, mime) {
  if (mime === "image/png" && data.length >= 24) return { width:u32be(data, 16), height:u32be(data, 20) };
  if (mime === "image/jpeg") {
    let p = 2;
    while (p + 4 <= data.length) {
      if (data[p] !== 0xff) { p++; continue; }
      while (data[p] === 0xff) p++;
      const marker = data[p++];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
      if (p + 2 > data.length) break;
      const size = (data[p] << 8) | data[p + 1];
      if (size < 2 || p + size > data.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && size >= 7)
        return { height:(data[p + 3] << 8) | data[p + 4], width:(data[p + 5] << 8) | data[p + 6] };
      p += size;
    }
    return null;
  }
  if (mime === "image/webp" && data.length >= 30) {
    const kind = ascii(data, 12, 4);
    if (kind === "VP8X" && data.length >= 30) {
      const w = data[24] | (data[25] << 8) | (data[26] << 16), h = data[27] | (data[28] << 8) | (data[29] << 16);
      return { width:w + 1, height:h + 1 };
    }
    if (kind === "VP8L" && data.length >= 25 && data[20] === 0x2f) {
      const b1 = data[21], b2 = data[22], b3 = data[23], b4 = data[24];
      return { width:1 + b1 + ((b2 & 0x3f) << 8), height:1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10) };
    }
    if (kind === "VP8 " && data.length >= 30 && data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a)
      return { width:((data[26] | (data[27] << 8)) & 0x3fff), height:((data[28] | (data[29] << 8)) & 0x3fff) };
  }
  return null;
}
async function thumbnail(blob) {
  if (!blob || typeof blob.arrayBuffer !== "function" || blob.size > MAX_ART_BYTES) return null;
  let bytes, mime;
  try { bytes = new Uint8Array(await blob.arrayBuffer()); mime = imageMime(bytes); } catch (_) { return null; }
  if (!mime) return null;
  const dimensions = imageDimensions(bytes, mime);
  if (!dimensions || !dimensions.width || !dimensions.height || dimensions.width > MAX_IMAGE_EDGE || dimensions.height > MAX_IMAGE_EDGE || dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) return null;
  if (typeof window.createImageBitmap !== "function" || typeof document === "undefined") return blob;
  let bitmap = null;
  try {
    bitmap = await window.createImageBitmap(blob);
    if (!bitmap.width || !bitmap.height || bitmap.width > MAX_IMAGE_EDGE || bitmap.height > MAX_IMAGE_EDGE || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) return null;
    const scale = Math.min(1, THUMB_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale)), height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const out = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.82));
    return out && out.size && out.size <= MAX_ART_BYTES ? out : null;
  } catch (_) { return null; }
  finally { if (bitmap && typeof bitmap.close === "function") bitmap.close(); }
}
window.Trk = window.Trk || {};
window.Trk.media = window.Trk.media || {};
window.Trk.media.audioArt = Object.freeze({ extract, thumbnail, limits:Object.freeze({ metadataBytes:MAX_TAG_BYTES, artBytes:MAX_ART_BYTES, edge:THUMB_EDGE }) });
})();
