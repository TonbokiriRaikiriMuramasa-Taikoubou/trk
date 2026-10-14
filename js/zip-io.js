// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ ZIP の入出力（バックアップ用・Blob のまま扱う） ============
   ・書き出し：中身を Blob の参照のまま並べる（全体を1つの ArrayBuffer に載せない）。CRC は1ファイルずつ読んで計算する。
   ・読み出し：末尾と中央ディレクトリだけを読み、中身は必要になったときに slice で取り出す。
   ・ZIP64 に対応（4GiB超・65535件超）。暗号化されたZIPは受け付けない。
   ・既存のパック読み込み（custom.js の readZip）とは別の経路。ここは「大きくても全部は読まない」ための道具。
   公開先：window.Trk.zipIO */
(function () {
  "use strict";
  window.Trk = window.Trk || {};

  const U32 = 0xffffffff, U16 = 0xffff;
  const MAX_ENTRIES = 1000000, MAX_CENTRAL = 256 * 1048576;
  const enc = new TextEncoder(), dec = new TextDecoder();

  class ZipIOError extends Error {
    constructor(key) { super(key); this.key = key; }
  }

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  async function deflateBlob(blob) {
    return new Response(blob.stream().pipeThrough(new CompressionStream("deflate-raw"))).blob();
  }

  /* entries：[{ name, blob, deflate? }]。戻り値は ZIP の Blob。
     opts.forceZip64 はテスト用（ZIP64 の構造を小さなデータで通すため）。 */
  async function zipWrite(entries, opts = {}) {
    const parts = [], central = [];
    let off = 0;
    const DOS_TIME = 0, DOS_DATE = 0x21;   /* 1980-01-01 固定（決定的な出力のため） */
    for (const e of entries) {
      const raw = e.blob;
      const u8 = new Uint8Array(await raw.arrayBuffer());
      const crc = crc32(u8), usize = u8.length;
      let body = raw, method = 0, csize = usize;
      if (e.deflate && usize > 0 && typeof CompressionStream !== "undefined") {
        body = await deflateBlob(raw); method = 8; csize = body.size;
      }
      const name = enc.encode(e.name);
      const big = !!opts.forceZip64 || csize >= U32 || usize >= U32 || off >= U32;
      const lhLen = 30 + name.length + (big ? 20 : 0);
      const lh = new DataView(new ArrayBuffer(lhLen)), lu = new Uint8Array(lh.buffer);
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, big ? 45 : 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint16(8, method, true); lh.setUint16(10, DOS_TIME, true); lh.setUint16(12, DOS_DATE, true);
      lh.setUint32(14, crc, true);
      lh.setUint32(18, big ? U32 : csize, true); lh.setUint32(22, big ? U32 : usize, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, big ? 20 : 0, true);
      lu.set(name, 30);
      if (big) {
        const x = 30 + name.length;
        lh.setUint16(x, 0x0001, true); lh.setUint16(x + 2, 16, true);
        lh.setBigUint64(x + 4, BigInt(usize), true); lh.setBigUint64(x + 12, BigInt(csize), true);
      }
      parts.push(lh, body);

      const cdLen = 46 + name.length + (big ? 28 : 0);
      const ch = new DataView(new ArrayBuffer(cdLen)), cu = new Uint8Array(ch.buffer);
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, big ? 45 : 20, true); ch.setUint16(6, big ? 45 : 20, true);
      ch.setUint16(8, 0x0800, true); ch.setUint16(10, method, true); ch.setUint16(12, DOS_TIME, true); ch.setUint16(14, DOS_DATE, true);
      ch.setUint32(16, crc, true);
      ch.setUint32(20, big ? U32 : csize, true); ch.setUint32(24, big ? U32 : usize, true);
      ch.setUint16(28, name.length, true); ch.setUint16(30, big ? 28 : 0, true);
      ch.setUint32(42, big ? U32 : off, true);
      cu.set(name, 46);
      if (big) {
        const x = 46 + name.length;
        ch.setUint16(x, 0x0001, true); ch.setUint16(x + 2, 24, true);
        ch.setBigUint64(x + 4, BigInt(usize), true); ch.setBigUint64(x + 12, BigInt(csize), true); ch.setBigUint64(x + 20, BigInt(off), true);
      }
      central.push(ch);
      off += lhLen + csize;
    }
    const cdOff = off;
    const cdSize = central.reduce((s, x) => s + x.byteLength, 0);
    const count = entries.length;
    const needZip64 = !!opts.forceZip64 || count >= U16 || cdOff >= U32 || cdSize >= U32;
    const tail = [];
    if (needZip64) {
      const z = new DataView(new ArrayBuffer(56));
      z.setUint32(0, 0x06064b50, true); z.setBigUint64(4, 44n, true);
      z.setUint16(12, 45, true); z.setUint16(14, 45, true);
      z.setBigUint64(24, BigInt(count), true); z.setBigUint64(32, BigInt(count), true);
      z.setBigUint64(40, BigInt(cdSize), true); z.setBigUint64(48, BigInt(cdOff), true);
      const loc = new DataView(new ArrayBuffer(20));
      loc.setUint32(0, 0x07064b50, true); loc.setUint32(4, 0, true);
      loc.setBigUint64(8, BigInt(cdOff + cdSize), true); loc.setUint32(16, 1, true);
      tail.push(z, loc);
    }
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, Math.min(count, U16), true); end.setUint16(10, Math.min(count, U16), true);
    end.setUint32(12, Math.min(cdSize, U32), true); end.setUint32(16, Math.min(cdOff, U32), true);
    tail.push(end);
    return new Blob([...parts, ...central, ...tail], { type: "application/zip" });
  }

  /* 中央ディレクトリを読む。中身（ローカルヘッダ）は触らない。 */
  async function zipOpen(file) {
    const size = file.size;
    if (!(size >= 22)) throw new ZipIOError("zipBad");
    const tailLen = Math.min(size, 65557);
    const tail = new DataView(await file.slice(size - tailLen, size).arrayBuffer());
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new ZipIOError("zipBad");
    let count = tail.getUint16(eocd + 10, true), cdSize = tail.getUint32(eocd + 12, true), cdOff = tail.getUint32(eocd + 16, true);
    const needs64 = count === U16 || cdSize === U32 || cdOff === U32;
    if (needs64) {
      if (eocd < 20 || tail.getUint32(eocd - 20, true) !== 0x07064b50) throw new ZipIOError("zipBad");
      const z64 = Number(tail.getBigUint64(eocd - 12, true));
      if (!(z64 >= 0 && z64 + 56 <= size)) throw new ZipIOError("zipBad");
      const z = new DataView(await file.slice(z64, z64 + 56).arrayBuffer());
      if (z.getUint32(0, true) !== 0x06064b50) throw new ZipIOError("zipBad");
      count = Number(z.getBigUint64(32, true)); cdSize = Number(z.getBigUint64(40, true)); cdOff = Number(z.getBigUint64(48, true));
    }
    if (!(count <= MAX_ENTRIES) || !(cdSize <= MAX_CENTRAL) || !(cdOff + cdSize <= size)) throw new ZipIOError("zipBad");
    const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer());
    const list = [];
    let p = 0;
    for (let n = 0; n < count; n++) {
      if (p + 46 > cd.byteLength || cd.getUint32(p, true) !== 0x02014b50) throw new ZipIOError("zipBad");
      const flags = cd.getUint16(p + 8, true), method = cd.getUint16(p + 10, true), crc = cd.getUint32(p + 16, true);
      let csize = cd.getUint32(p + 20, true), usize = cd.getUint32(p + 24, true), loff = cd.getUint32(p + 42, true);
      const nlen = cd.getUint16(p + 28, true), xlen = cd.getUint16(p + 30, true), clen = cd.getUint16(p + 32, true);
      if (flags & 1) throw new ZipIOError("zipEncrypted");
      if (method !== 0 && method !== 8) throw new ZipIOError("zipMethod");
      const nameBytes = new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen);
      const name = dec.decode(nameBytes);
      /* ZIP64 の拡張：32bit が 0xffffffff のときだけ、順番どおり 8byte の値が入っている */
      let x = p + 46 + nlen;
      const xEnd = x + xlen;
      while (x + 4 <= xEnd) {
        const id = cd.getUint16(x, true), len = cd.getUint16(x + 2, true);
        if (x + 4 + len > xEnd) throw new ZipIOError("zipBad");
        if (id === 0x0001) {
          let q = x + 4;
          if (usize === U32) { usize = Number(cd.getBigUint64(q, true)); q += 8; }
          if (csize === U32) { csize = Number(cd.getBigUint64(q, true)); q += 8; }
          if (loff === U32) { loff = Number(cd.getBigUint64(q, true)); q += 8; }
        }
        x += 4 + len;
      }
      p += 46 + nlen + xlen + clen;
      if (!name || name.startsWith("/") || name.includes("..") || name.includes("\\")) throw new ZipIOError("zipBad");
      if (name.endsWith("/")) continue;
      if (loff + 30 > size) throw new ZipIOError("zipBad");
      list.push({ name, method, csize, usize, crc, off: loff });
    }
    const byName = new Map();
    for (const e of list) byName.set(e.name, e);
    return { size, file, entries: list, byName };
  }

  async function zipDataStart(zip, e) {
    const h = new DataView(await zip.file.slice(e.off, e.off + 30).arrayBuffer());
    if (h.getUint32(0, true) !== 0x04034b50) throw new ZipIOError("zipBad");
    const start = e.off + 30 + h.getUint16(26, true) + h.getUint16(28, true);
    if (start + e.csize > zip.size) throw new ZipIOError("zipBad");
    return start;
  }

  /* 中身を Blob で返す。limit を超える展開後の大きさは、展開しながら数えて止める（圧縮爆弾よけ）。 */
  async function zipEntryBlob(zip, e, limit = Infinity) {
    if (e.usize > limit) throw new ZipIOError("zipTooBig");
    const start = await zipDataStart(zip, e);
    const raw = zip.file.slice(start, start + e.csize);
    if (e.method === 0) return raw;
    const stream = raw.stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader(), chunks = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > Math.min(limit, e.usize)) throw new ZipIOError("zipTooBig");   /* 宣言より大きければ止める（検査は zipVerifyEntry） */
        chunks.push(value);
      }
    } catch (err) {
      try { await reader.cancel(); } catch (_) {}
      throw err instanceof ZipIOError ? err : new ZipIOError("zipBad");
    }
    return new Blob(chunks);
  }

  /* CRC と大きさを確かめる（読み取りのあと、中身を使う前に全件を一度読む） */
  async function zipVerifyEntry(zip, e, limit = Infinity) {
    const blob = await zipEntryBlob(zip, e, limit);
    if (blob.size !== e.usize) throw new ZipIOError("zipCorrupt");
    if (crc32(new Uint8Array(await blob.arrayBuffer())) !== e.crc) throw new ZipIOError("zipCorrupt");
    return true;
  }

  window.Trk.zipIO = Object.assign(window.Trk.zipIO || {}, {
    ZipIOError, crc32, zipWrite, zipOpen, zipDataStart, zipEntryBlob, zipVerifyEntry,
  });
})();
