// SPDX-License-Identifier: GPL-3.0-or-later
/* 📚 書斎の純粋データ処理。外部ライブラリ・通信・HTML解釈は使いません。 */
"use strict";

window.TrkStudyUtils = (() => {
  const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"]);
  const TEXT_EXTS = new Set(["txt", "md", "markdown", "json", "csv", "log", "html", "htm", "xml", "yaml", "yml", "ini", "css", "js", "ts"]);
  const collator = new Intl.Collator(undefined, { numeric:true, sensitivity:"base" });

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

  function groupImageFiles(files) {
    const grouped = new Map();
    for (const file of Array.from(files || [])) {
      if (!isImageFile(file)) continue;
      const rel = relativePath(file), parts = rel.split("/").filter(Boolean);
      const root = parts.length > 1 ? parts[0] : "画像";
      const pagePath = parts.length > 1 ? parts.slice(1).join("/") : (file.name || rel);
      if (!grouped.has(root)) grouped.set(root, { title:root, sourcePath:root, files:[] });
      grouped.get(root).files.push({ file, path:pagePath });
    }
    return [...grouped.values()].map(group => ({
      ...group,
      files:group.files.sort((a, b) => comparePath(a.path, b.path))
    })).sort((a, b) => comparePath(a.title, b.title));
  }

  function listTextFiles(files) {
    return Array.from(files || []).filter(isTextFile).map(file => ({
      file,
      path:relativePath(file) || file.name || "Untitled.txt",
      title:baseName(file.name)
    })).sort((a, b) => comparePath(a.path, b.path));
  }

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

  function aozoraSegments(input) {
    const source = String(input || "").replace(/\r\n?/g, "\n").replace(/\f/g, "\n\n").replace(/［＃改ページ］/g, "\n\n");
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

  function stableId(kind, sourcePath) {
    const input = `${kind}\u0000${String(sourcePath || "").normalize("NFC")}`;
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return `${kind}-${(hash >>> 0).toString(36)}`;
  }

  return Object.freeze({ IMAGE_EXTS, TEXT_EXTS, extension, baseName, relativePath, isImageFile, isTextFile,
    comparePath, groupImageFiles, listTextFiles, decodeTextBuffer, aozoraSegments, stableId });
})();
