// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 📦 まるごとバックアップ（trk137） ============
   1つのZIPに、この端末の trk! の保存内容をまとめます。
     ・core（常に）：設定・記録・プレイリスト・スキン・音量など（localStorage の許可リスト）＋ライブラリ（IndexedDB shadow_taiko_library）
     ・study（既定ON）：📚 書斎（本・画像・栞・メモ・設定）
     ・packs（既定ON）：📦 カスタムパック。本体を .stpack に組み直し、復元は既存のインストーラで**検証を通す**
     ・media（既定OFF）：🎵 曲・VRM・MMD のファイル（大きい）
   含めないもの：解析の結果（再生成できる）、一度きりの印、フォルダの権限（ブラウザごとの許可なので書き出せない）。
   復元は「選んだ項目を置き換える」。バックアップに無い項目には触らない。
   「容量の上限を無視」（設定）は、アプリが決めた上限（本棚500冊・1冊3000ページ・テキスト12MB・パック1GiB／1件500MB）だけを外す。
   ブラウザの空き容量は外せない（足りなければブラウザが保存を断る）。
   公開先：window.Trk.backup（テスト用の純粋関数も含む） */
(function () {
  "use strict";
  const core = window.Trk.core;
  const Z = window.Trk.zipIO;
  const FORMAT = "trk-backup", VERSION = 1, APP = "trk";
  const BLOB_PREFIX = "blobs/", PACK_PREFIX = "packs/", DB_PREFIX = "db/";
  const MAX_META = 1 << 20, MAX_RECORDS = 1000000, MAX_LS_VALUE = 20 * 1048576;

  /* localStorage の許可リスト。ここに無いキーは書き出さない・復元もしない。 */
  const LS_KEYS = [
    "shadow_taiko_preferences_v2", "shadow_taiko_preferences_v1", "shadow_taiko_best_v1", "shadow_taiko_custom_skins_v1",
    "shadow_taiko_records_v1", "shadow_taiko_song_prefs_v1", "shadow_taiko_songmeta_v1", "shadow_taiko_played_v1",
    "trk_media_positions_v1", "trk_media_loop_presets_v1", "trk_fx_presets_v1", "trk_addons_v1",
    "trk_synth_mode_v1", "trk_synth_patches_v1", "trk_tv_skins_v1",
  ];
  /* IndexedDB の対象。skip はそのストアで書き出さないキー（FileSystemHandle などを持つ） */
  const DB_LIBRARY = { db:"shadow_taiko_library", version:2, stores:["kv"], skip:{ kv:["dir", "share"] } };
  const DB_STUDY = { db:"trk_study_room_v1", version:1, stores:["books", "pages", "covers", "settings"] };
  const DB_PACKS = { db:"shadow_taiko_packs", version:2, stores:["packs"], index:{ packs:"size" } };
  const DB_MEDIA = [
    { db:"shadow_taiko_songs", version:2, stores:["files"] },
    { db:"shadow_taiko_shared", version:2, stores:["files"] },
    { db:"shadow_taiko_vrm", version:2, stores:["files"] },
    { db:"shadow_taiko_mmd", version:2, stores:["files"] },
  ];
  const ALL_DBS = [DB_LIBRARY, DB_STUDY, DB_PACKS, ...DB_MEDIA];

  class BackupError extends Error { constructor(key, vars) { super(key); this.key = key; this.vars = vars; } }
  class SkipValue extends Error { constructor() { super("skip"); this.name = "SkipValue"; } }   /* この行だけ書き出さない */

  /* ---------- 値の変換（純粋関数。テストで直接使う） ---------- */
  function encKey(k) {
    if (typeof k === "string") return { s:k };
    if (typeof k === "number" && isFinite(k)) return { n:k };
    throw new SkipValue();
  }
  function decKey(o) {
    if (o && typeof o.s === "string") return o.s;
    if (o && typeof o.n === "number" && isFinite(o.n)) return o.n;
    throw new BackupError("backupCorrupt");
  }
  /* 利用者のオブジェクトの「$」で始まる名前は、マーカー（$blob など）と混ざらないように1つ足す */
  const encName = k => (k.startsWith("$") ? "$" + k : k);
  const decName = k => (k.startsWith("$$") ? k.slice(1) : k);

  /* IndexedDB の値を JSON にする。Blob／File は add() に渡して zip の中の名前だけを書く。 */
  function encodeValue(v, add, depth = 0) {
    if (depth > 60) throw new SkipValue();
    if (v === null || typeof v === "string" || typeof v === "boolean") return v;
    if (typeof v === "number") return isFinite(v) ? v : { "$num":String(v) };
    if (v instanceof Blob) {
      const isFile = typeof File !== "undefined" && v instanceof File;
      return { "$blob":add(v), type:String(v.type || "").slice(0, 200), file:isFile,
        name:isFile ? String(v.name || "").slice(0, 260) : "", mtime:isFile ? Number(v.lastModified) || 0 : 0 };
    }
    if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) return { "$blob":add(new Blob([v])), type:"", file:false, name:"", mtime:0 };
    if (v instanceof Date) return { "$date":v.getTime() };
    if (Array.isArray(v)) return v.map(x => (x === undefined ? null : encodeValue(x, add, depth + 1)));
    if (typeof FileSystemHandle !== "undefined" && v instanceof FileSystemHandle) throw new SkipValue();
    if (typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v)) { if (v[k] !== undefined) o[encName(k)] = encodeValue(v[k], add, depth + 1); }
      return o;
    }
    throw new SkipValue();   /* function・symbol・bigint など */
  }
  /* 書いた JSON を値に戻す。resolve(name) は zip の中の Blob を返す（同期）。 */
  function decodeValue(j, resolve, depth = 0) {
    if (depth > 60) throw new BackupError("backupCorrupt");
    if (j === null || typeof j !== "object") return j;
    if (Array.isArray(j)) return j.map(x => decodeValue(x, resolve, depth + 1));
    if (typeof j.$num === "string") return Number(j.$num);
    if (typeof j.$date === "number") return new Date(j.$date);
    if (typeof j.$blob === "string") {
      const b = resolve(j.$blob);
      const type = typeof j.type === "string" ? j.type.slice(0, 200) : "";
      if (j.file) return new File([b], typeof j.name === "string" && j.name ? j.name.slice(0, 260) : "file", { type, lastModified:Number(j.mtime) || 0 });
      return new Blob([b], { type });
    }
    const o = {};
    for (const k of Object.keys(j)) o[decName(k)] = decodeValue(j[k], resolve, depth + 1);
    return o;
  }

  /* ---------- IndexedDB（作らない読み出し・置き換え） ---------- */
  async function dbExists(name) {
    if (typeof indexedDB.databases !== "function") return true;   /* 判定できないときは開いてみる */
    try { return (await indexedDB.databases()).some(d => d.name === name); } catch (_) { return true; }
  }
  function openDb(spec, create) {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open(spec.db, spec.version);
      r.onupgradeneeded = () => {
        const db = r.result;
        for (const s of spec.stores) {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
          const os = r.transaction.objectStore(s), idx = spec.index && spec.index[s];
          if (idx && !os.indexNames.contains(idx)) os.createIndex(idx, idx);
        }
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error || new Error("open failed"));
      r.onblocked = () => reject(new Error("idb-blocked"));
    });
  }
  /* 1ストアを、JSON（[{k,v}]の配列の文字列）にする。読むだけ。値の中の Blob は add() で zip へ。 */
  function readStoreJson(db, store, skip, add) {
    return new Promise((resolve, reject) => {
      const parts = ["["];
      let first = true, count = 0, skipped = 0;
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return;
        if (!(skip && skip.includes(cur.key))) {
          try {
            const rec = JSON.stringify({ k:encKey(cur.key), v:encodeValue(cur.value, add) });
            parts.push(first ? rec : "," + rec); first = false; count++;
          } catch (e) {
            if (e instanceof SkipValue) skipped++; else throw e;
          }
        }
        cur.continue();
      };
      tx.oncomplete = () => { parts.push("]"); resolve({ text:parts.join(""), count, skipped }); };
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("read failed"));
    });
  }
  /* 1ストアを置き換える（同じ読み書きの1トランザクション）。skip のキーは残す。 */
  function replaceStore(db, store, pairs, skip) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite"), os = tx.objectStore(store);
      const writeAll = () => { for (const [k, v] of pairs) os.put(v, k); };
      if (skip && skip.length) {
        /* 残すキー（skip）以外を消してから入れる。消す対象は先に一覧で決める（カーソルで消しながら入れると、入れたものを消しうる） */
        const keysReq = os.getAllKeys();
        keysReq.onsuccess = () => { for (const k of keysReq.result) if (!skip.includes(k)) os.delete(k); writeAll(); };
      } else { os.clear(); writeAll(); }
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("write failed"));
    });
  }
  function readAllValues(db, store) {
    return new Promise((resolve, reject) => {
      const out = [];
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).openCursor();
      req.onsuccess = () => { const c = req.result; if (!c) return; out.push(c.value); c.continue(); };
      tx.oncomplete = () => resolve(out);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error("read failed"));
    });
  }

  /* ---------- 書き出し ---------- */
  async function buildBackup(opts = {}) {
    const want = { study:opts.study !== false, packs:opts.packs !== false, media:opts.media === true };
    const entries = [], counts = { ls:0, library:0, study:{ books:0, pages:0 }, packs:0, media:0 };
    let skipped = 0, blobN = 0;
    const add = (blob) => { const name = BLOB_PREFIX + String(++blobN).padStart(7, "0"); entries.push({ name, blob }); return name; };
    const note = () => {};   /* 進み具合の表示は作成中の一文だけ（段階名は出さない） */

    /* core：localStorage の許可リストと、ライブラリ */
    const items = {};
    for (const key of LS_KEYS) { const v = localStorage.getItem(key); if (v !== null) items[key] = v; }
    counts.ls = Object.keys(items).length;
    entries.push({ name:"local.json", blob:new Blob([JSON.stringify({ items })]), deflate:true });
    note("core");
    async function dumpStore(spec, store, into) {
      if (!(await dbExists(spec.db))) return null;
      const db = await openDb(spec, false);
      try {
        const r = await readStoreJson(db, store, (spec.skip && spec.skip[store]) || null, add);
        skipped += r.skipped;
        entries.push({ name:`${DB_PREFIX}${spec.db}/${store}.json`, blob:new Blob([r.text]), deflate:true });
        return r.count;
      } finally { db.close(); }
    }
    counts.library = (await dumpStore(DB_LIBRARY, "kv")) || 0;

    if (want.study) {
      note("study");
      for (const s of DB_STUDY.stores) {
        const n = await dumpStore(DB_STUDY, s);
        if (s === "books") counts.study.books = n || 0;
        if (s === "pages") counts.study.pages = n || 0;
      }
    }
    if (want.media) {
      note("media");
      for (const spec of DB_MEDIA) for (const s of spec.stores) counts.media += (await dumpStore(spec, s)) || 0;
    }
    if (want.packs) {
      note("packs");
      if (await dbExists(DB_PACKS.db)) {
        const db = await openDb(DB_PACKS, false);
        let recs = [];
        try { recs = await readAllValues(db, "packs"); } finally { db.close(); }
        let i = 0;
        for (const rec of recs) {
          if (!rec || !rec.manifest || !rec.files) { skipped++; continue; }
          const inner = [{ name:"pack.json", blob:new Blob([JSON.stringify(rec.manifest)]), deflate:true }];
          for (const [path, blob] of Object.entries(rec.files)) if (blob instanceof Blob) inner.push({ name:path, blob });
          const zipped = await Z.zipWrite(inner);
          entries.push({ name:`${PACK_PREFIX}${String(++i).padStart(4, "0")}.stpack`, blob:zipped });
        }
        counts.packs = i;
      }
    }
    const meta = {
      format:FORMAT, version:VERSION, app:APP, createdAt:new Date().toISOString(),
      areas:{ core:true, study:want.study, packs:want.packs, media:want.media },
      counts, skipped, limitsIgnored:core.storageLimitsIgnored(),
    };
    note("zip");
    const blob = await Z.zipWrite([{ name:"backup.json", blob:new Blob([JSON.stringify(meta, null, 1)]), deflate:true }, ...entries]);
    return { blob, meta };
  }

  /* ---------- 復元 ---------- */
  /* 中身を読まずに、backup.json だけ確かめる（確認画面に出す用）。 */
  async function readBackupMeta(file) {
    const zip = await Z.zipOpen(file);
    const e = zip.byName.get("backup.json");
    if (!e) throw new BackupError("backupRestoreBad");
    let meta;
    try { meta = JSON.parse(await (await Z.zipEntryBlob(zip, e, MAX_META)).text()); }
    catch (_) { throw new BackupError("backupRestoreBad"); }
    if (!meta || meta.format !== FORMAT || meta.version !== VERSION || meta.app !== APP) throw new BackupError("backupRestoreBad");
    return { zip, meta };
  }
  /* 上限の確認（上限を無視しないとき）。書斎の本棚・1冊のページ数・テキストの大きさ。 */
  function checkStudyLimits(books) {
    if (core.storageLimitsIgnored()) return;
    const L = window.Trk.studyLimits;
    if (!L) throw new BackupError("backupRestoreFail");   /* 書斎の上限が読めないときは、確かめられないので止める */
    if (books.length > L.shelf) throw new BackupError("backupRestoreLimit");
    for (const b of books) {
      const pages = b && Array.isArray(b.v && b.v.pages) ? b.v.pages.length : 0;
      if (pages > L.pages) throw new BackupError("backupRestoreLimit");
      const text = b && b.v && typeof b.v.content === "string" ? b.v.content : "";
      if (text && new Blob([text]).size > L.textBytes) throw new BackupError("backupRestoreLimit");
    }
  }
  async function restoreBackup(file, opts = {}) {
    const { zip, meta } = await readBackupMeta(file);
    /* 1) 全件の中身を確かめる（CRC・大きさ）。書く前に終えて、壊れた中身で途中まで書き換えないため。 */
    for (const e of zip.entries) {
      try { await Z.zipVerifyEntry(zip, e); }
      catch (_) { throw new BackupError("backupCorrupt"); }
    }
    /* 2) 読んで、書くものを用意する（まだ書かない）。blob の参照は同期で取れるよう先に位置を覚える。 */
    for (const e of zip.entries) if (e.method === 0 && e.name.startsWith(BLOB_PREFIX)) e.start = await Z.zipDataStart(zip, e);
    const resolve = (name) => {
      const e = zip.byName.get(name);
      if (!e || !name.startsWith(BLOB_PREFIX) || e.method !== 0 || typeof e.start !== "number") throw new BackupError("backupCorrupt");
      return zip.file.slice(e.start, e.start + e.csize);
    };
    const plan = { ls:null, dbs:[] };
    if (meta.areas && meta.areas.core) {
      const le = zip.byName.get("local.json");
      if (le) {
        const j = JSON.parse(await (await Z.zipEntryBlob(zip, le, MAX_LS_VALUE)).text());
        const out = [];
        for (const [k, v] of Object.entries(j && j.items || {})) {
          if (LS_KEYS.includes(k) && typeof v === "string" && v.length <= MAX_LS_VALUE) out.push([k, v]);
        }
        plan.ls = out;
      }
    }
    const wanted = new Set();
    for (const spec of ALL_DBS) for (const s of spec.stores) wanted.add(`${spec.db}/${s}`);
    for (const e of zip.entries) {
      if (!e.name.startsWith(DB_PREFIX) || !e.name.endsWith(".json")) continue;
      const key = e.name.slice(DB_PREFIX.length, -".json".length);
      if (!wanted.has(key)) continue;   /* 知らない名前は読まない */
      const arr = JSON.parse(await (await Z.zipEntryBlob(zip, e)).text());
      if (!Array.isArray(arr) || arr.length > MAX_RECORDS) throw new BackupError("backupCorrupt");
      const spec = ALL_DBS.find(d => key.startsWith(d.db + "/"));
      const store = key.slice(spec.db.length + 1);
      plan.dbs.push({ spec, store, arr, key });
    }
    const studyBooks = plan.dbs.filter(p => p.key === `${DB_STUDY.db}/books`).flatMap(p => p.arr);
    checkStudyLimits(studyBooks);
    const packEntries = zip.entries.filter(e => e.name.startsWith(PACK_PREFIX) && e.name.endsWith(".stpack"));
    /* 3) 書く */
    for (const p of plan.dbs) {
      const pairs = p.arr.map(r => [decKey(r.k), decodeValue(r.v, resolve)]);
      const db = await openDb(p.spec, true);
      try { await replaceStore(db, p.store, pairs, (p.spec.skip && p.spec.skip[p.store]) || null); }
      finally { db.close(); }
    }
    if (plan.ls) {
      for (const k of LS_KEYS) { try { localStorage.removeItem(k); } catch (_) {} }
      for (const [k, v] of plan.ls) { try { localStorage.setItem(k, v); } catch (_) { throw new BackupError("backupRestoreFail"); } }
    }
    let packsOk = 0, packsFailed = 0;
    if (meta.areas && meta.areas.packs) {
      const db = await openDb(DB_PACKS, true);
      try { await replaceStore(db, "packs", [], null); } finally { db.close(); }
      const install = window.Trk.custom && window.Trk.custom.installPackFile;
      for (const e of packEntries) {
        const blob = await Z.zipEntryBlob(zip, e);
        const r = install ? await install(new File([blob], e.name.split("/").pop(), { type:"application/zip" })) : null;
        if (r) packsOk++; else packsFailed++;
      }
    }
    return { meta, packsOk, packsFailed };
  }

  /* ---------- 画面 ---------- */
  const $ = (id) => document.getElementById(id);
  const stamp = (d) => { const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
  function say(key, vars) { try { core.setStatus("backupStatus", key, vars); } catch (_) {} }
  function sizeText(n) { return n >= 1073741824 ? (n / 1073741824).toFixed(1) + " GB" : n >= 1048576 ? Math.round(n / 1048576) + " MB" : Math.round(n / 1024) + " KB"; }

  function setup() {
    const make = $("backupMakeBtn"), file = $("backupRestoreFile"), ignore = $("ignoreLimitsChk");
    if (!make || !file || !ignore) return;
    ignore.checked = core.storageLimitsIgnored();
    ignore.addEventListener("change", () => { core.settings.ignoreStorageLimits = ignore.checked; core.saveUserPrefs(); });
    make.addEventListener("click", async () => {
      make.disabled = true;
      try {
        say("backupMaking");
        const { blob, meta } = await buildBackup({
          study: $("backupAreaStudy").checked, packs: $("backupAreaPacks").checked, media: $("backupAreaMedia").checked,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `trk-backup-${stamp(new Date())}.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        say("backupDone", { size: sizeText(blob.size), books: meta.counts.study.books, packs: meta.counts.packs });
      } catch (e) {
        console.error(e);
        say("backupFail");
      } finally { make.disabled = false; }
    });
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      file.value = "";
      if (!f) return;
      let info;
      try { info = await readBackupMeta(f); }
      catch (_) { say("backupRestoreBad"); return; }
      const m = info.meta;
      const date = (() => { const d = new Date(m.createdAt); return isNaN(d) ? "?" : d.toLocaleString(); })();
      const ask = window.tr("backupRestoreAsk", { date, books: m.counts && m.counts.study ? m.counts.study.books : 0, packs: m.counts ? m.counts.packs || 0 : 0, media: m.counts ? m.counts.media || 0 : 0 });
      if (!confirm(ask)) return;
      say("backupRestoreWorking");
      try {
        const r = await restoreBackup(f);
        if (r.packsFailed) say("backupRestorePackFail", { n: r.packsFailed });
        else say("backupRestoreDone");
        setTimeout(() => location.reload(), 1200);
      } catch (e) {
        console.error(e);
        say(keyOfError(e));
      }
    });
  }
  /* 画面に出すキー。ZIP の層の失敗は「壊れている・バックアップではない」にまとめる */
  function keyOfError(e) {
    if (e instanceof BackupError) return e.key;
    if (e && typeof e.key === "string" && e.key.startsWith("zip")) return "backupCorrupt";
    return "backupRestoreFail";
  }

  window.Trk.backup = Object.assign(window.Trk.backup || {}, {
    buildBackup, restoreBackup, readBackupMeta, encodeValue, decodeValue, encKey, decKey, encName, decName, LS_KEYS, BackupError,
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
