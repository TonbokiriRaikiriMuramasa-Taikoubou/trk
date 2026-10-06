// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 書斎の純粋データ処理。外部ライブラリ・通信・HTML解釈は使いません。
   ここは「決まった入力 → 決まった出力」だけを置き、UI・IndexedDB・イベントは study-room.js 側に置きます。 */
"use strict";

window.TrkStudyUtils = (() => {
  const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"]);
  const TEXT_EXTS = new Set(["txt", "md", "markdown", "json", "csv", "log", "html", "htm", "xml", "yaml", "yml", "ini", "css", "js", "ts"]);
  const collator = new Intl.Collator(undefined, { numeric:true, sensitivity:"base" });
  const ROOT_ALBUM = "画像";
  const MAX_MATCHES = 4000;

  function extension(name) {
    const leaf = String(name || "").split(/[\\/]/).pop() || "";
    const dot = leaf.lastIndexOf(".");
    return dot > 0 ? leaf.slice(dot + 1).toLowerCase() : "";
  }
  function baseName(name) {
    const leaf = String(name || "").split(/[\\/]/).pop() || "";
    const dot = leaf.lastIndexOf(".");
    return (dot > 0 ? leaf.slice(0, dot) : leaf).trim() || leaf || "Untitled";
  }
  function relativePath(file) {
    return String(file && (file.webkitRelativePath || file.name) || "").replace(/\\/g, "/").split("/").filter(Boolean).join("/");
  }
  function isImageFile(file) {
    const ext = extension(file && file.name);
    return IMAGE_EXTS.has(ext) || (!ext && /^image\/(?:jpeg|png|webp|gif|avif|bmp)$/i.test(file && file.type || ""));
  }
  function isTextFile(file) { return TEXT_EXTS.has(extension(file && file.name)); }
  function comparePath(a, b) { return collator.compare(String(a || ""), String(b || "")); }

  /* ---------- 取り込みの整理 ----------
     nesting:"split"（既定）は「1フォルダ＝1冊」を基本にしつつ、中のサブフォルダは別の本に分けます。
     nesting:"flat" は従来どおり、選んだフォルダ全体を1冊にまとめます。 */
  function groupImageFiles(files, nesting) {
    const split = nesting !== "flat";
    const grouped = new Map();
    for (const file of Array.from(files || [])) {
      if (!isImageFile(file)) continue;
      const rel = relativePath(file), parts = rel.split("/").filter(Boolean);
      const hasFolder = parts.length > 1;
      const parentPath = hasFolder ? parts.slice(0, -1).join("/") : "";
      const key = hasFolder ? (split ? parentPath : parts[0]) : ROOT_ALBUM;
      const pagePath = parentPath ? parts[parts.length - 1] : (file.name || rel);
      if (!grouped.has(key)) grouped.set(key, { title:key.split("/").pop() || key, sourcePath:key, files:[] });
      grouped.get(key).files.push({ file, path:pagePath });
    }
    return [...grouped.values()].map(group => ({
      ...group,
      files:group.files.sort((a, b) => comparePath(a.path, b.path))
    })).sort((a, b) => comparePath(a.sourcePath, b.sourcePath));
  }

  function listTextFiles(files) {
    return Array.from(files || []).filter(isTextFile).map(file => ({
      file,
      path:relativePath(file) || file.name || "Untitled.txt",
      title:baseName(file.name)
    })).sort((a, b) => comparePath(a.path, b.path));
  }

  /* ---------- 文字コード ---------- */
  function decodeTextBuffer(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let start = 0, encoding = "utf-8";
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) start = 3;
    else if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) { start = 2; encoding = "utf-16le"; }
    else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) { start = 2; encoding = "utf-16be"; }
    const payload = bytes.subarray(start);
    if (encoding !== "utf-8") return new TextDecoder(encoding).decode(payload);
    try { return new TextDecoder("utf-8", { fatal:true }).decode(payload); }
    catch (_) {
      try { return new TextDecoder("shift_jis", { fatal:true }).decode(payload); }
      catch (_) { return new TextDecoder("utf-8").decode(payload); }
    }
  }

  /* 本文の改行・改ページを1つの形にそろえる（表示と検索で同じ文字列を使うため）。 */
  function normalizeText(input) {
    return String(input || "").replace(/\r\n?/g, "\n").replace(/\f/g, "\n\n");
  }

  function aozoraSegments(input) {
    const source = normalizeText(input).replace(/［＃改ページ］/g, "\n\n");
    const out = [], rubyPattern = /｜([^《\n]+)《([^》\n]+)》|([\u3400-\u9fff々〆ヵヶ]+)《([^》\n]+)》/gu;
    let cursor = 0, match;
    while ((match = rubyPattern.exec(source))) {
      if (match.index > cursor) out.push({ text:source.slice(cursor, match.index) });
      out.push({ ruby:match[1] || match[3], reading:match[2] || match[4] });
      cursor = rubyPattern.lastIndex;
    }
    if (cursor < source.length) out.push({ text:source.slice(cursor) });
    return out;
  }

  /* ---------- 検索 ---------- */
  /* 返すのは「正規化した本文の文字位置」。UI側がDOMのテキストノードへ対応づけて着色します。 */
  function findMatches(text, query, limit) {
    const haystack = String(text || "").toLocaleLowerCase(), needle = String(query || "").toLocaleLowerCase();
    const cap = Math.max(1, Math.min(MAX_MATCHES, Number(limit) || MAX_MATCHES));
    const out = [];
    if (!needle) return out;
    let index = haystack.indexOf(needle);
    while (index >= 0 && out.length < cap) {
      out.push(index);
      index = haystack.indexOf(needle, index + Math.max(1, needle.length));
    }
    return out;
  }

  /* 本棚カードや栞一覧に出す、1行の抜粋。ratio は 0〜1（栞の位置の目安）。 */
  function snippetAt(text, ratio, length) {
    const source = normalizeText(text).replace(/\s+/g, " ").trim();
    const span = Math.max(24, Math.min(200, Number(length) || 72));
    if (source.length <= span) return source;
    const start = Math.max(0, Math.min(source.length - span, Math.round((Number(ratio) || 0) * source.length) - Math.floor(span / 2)));
    return (start > 0 ? "…" : "") + source.slice(start, start + span).trim() + (start + span < source.length ? "…" : "");
  }

  function textStats(text) {
    const source = normalizeText(text);
    return { chars:source.replace(/\n/g, "").length, lines:source ? source.split("\n").length : 0 };
  }

  /* ---------- 本棚・本の情報 ---------- */
  function bookSize(book) {
    if (!book || typeof book !== "object") return 0;
    if (book.kind === "text") return typeof book.content === "string" ? book.content.length : 0;
    return (Array.isArray(book.pages) ? book.pages : []).reduce((sum, page) => sum + Math.max(0, Number(page && page.size) || 0), 0);
  }
  function sortBooks(books, mode) {
    const rows = Array.from(books || []);
    const byUpdated = (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0) || comparePath(a.title, b.title);
    switch (mode) {
      case "added": return rows.sort((a, b) => (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0) || comparePath(a.title, b.title));
      case "title": return rows.sort((a, b) => comparePath(a.title, b.title));
      case "type": return rows.sort((a, b) => (a.kind === b.kind ? comparePath(a.title, b.title) : a.kind === "image" ? -1 : 1));
      case "size": return rows.sort((a, b) => bookSize(b) - bookSize(a) || comparePath(a.title, b.title));
      default: return rows.sort(byUpdated);
    }
  }
  function formatBytes(bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    if (value < 1024) return `${Math.round(value)} B`;
    const units = ["KB", "MB", "GB", "TB"], base = 1024;
    let size = value, unit = "B";
    for (const next of units) {
      if (size < base) break;
      size /= base; unit = next;
    }
    return `${size >= 100 ? Math.round(size) : Math.round(size * 10) / 10} ${unit}`;
  }

  /* ---------- しおり ---------- */
  function bookmarkedBooks(books) {
    return Array.from(books || []).filter(book => book && book.bookmark)
      .sort((a, b) => (Number(b.bookmark.savedAt) || 0) - (Number(a.bookmark.savedAt) || 0));
  }

  /* ---------- 画像の並び ---------- */
  function orderPages(pages, order) {
    const rows = Array.from(pages || []);
    return order === "reverse" ? rows.reverse() : rows;
  }

  function stableId(kind, sourcePath) {
    const input = `${kind}\u0000${String(sourcePath || "").normalize("NFC")}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return `${kind}-${(hash >>> 0).toString(36)}`;
  }

  return Object.freeze({ IMAGE_EXTS, TEXT_EXTS, ROOT_ALBUM, MAX_MATCHES, extension, baseName, relativePath, isImageFile, isTextFile,
    comparePath, groupImageFiles, listTextFiles, decodeTextBuffer, normalizeText, aozoraSegments, findMatches, snippetAt, textStats,
    bookSize, sortBooks, formatBytes, bookmarkedBooks, orderPages, stableId });
})();
