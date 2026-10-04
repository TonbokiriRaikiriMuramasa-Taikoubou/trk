// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：選曲画面 ============
   曲リスト・フォルダ・プレビュー・曲ごとの設定・称号表示
   ▶ AUTO の切り替え・📻 ラジオ（次の曲へ自動で進む）・🎲 シードを探す道具
   文章は i18n.js にあります。 */
"use strict";

const MEDIA_EXT = ["mp4", "m4a", "mp3", "ogg", "oga", "opus", "wav", "webm", "flac", "aac", "mov"];
const LIB_MAX = 3000, LIB_SHOW = 300, ADDED_MAX = 50, CHART_SUFFIX = ".shadow-taiko.json";
const canPickDir = "showDirectoryPicker" in window && window.isSecureContext && window.self === window.top;
const libKV = idbStore("shadow_taiko_library", "kv");
const songDB = idbStore("shadow_taiko_songs", "files");

/* ---------- ▶ AUTO・📻 ラジオの切り替え ---------- */
settings.radio = !!prefs.radio;
const RADIO_WAIT = 5;   // 次の曲までの秒数
const autoBtn = el("button"); autoBtn.type = "button"; autoBtn.id = "autoToggle";
const radioBtn = el("button"); radioBtn.type = "button"; radioBtn.id = "radioToggle";
const toggleHint = el("div", "hint");
(() => {
  const picker = $("modePicker");
  const old = picker.querySelector('[data-playmode="auto"]'); if (old) old.remove();   // 古い index.html 用
  picker.after(autoBtn, radioBtn, toggleHint);
})();
function syncToggles() {
  autoBtn.textContent = tr(settings.autoPlay ? "autoOn" : "autoOff");
  radioBtn.textContent = tr(settings.radio ? "radioOn" : "radioOff");
  for (const [b, onFlag] of [[autoBtn, settings.autoPlay], [radioBtn, settings.radio]]) {
    b.classList.toggle("selected", onFlag); b.setAttribute("aria-pressed", String(onFlag));
  }
  toggleHint.textContent = `${tr("autoHint")} ${tr("radioHint")}`;
}
autoBtn.addEventListener("click", () => { settings.autoPlay = !settings.autoPlay; saveUserPrefs(); syncToggles(); emit("options"); });
radioBtn.addEventListener("click", () => { settings.radio = !settings.radio; saveUserPrefs(); syncToggles(); if (!settings.radio) cancelRadio(); });
on("language", syncToggles);
syncToggles();

/* ---------- 曲ごとの設定（BPM・オフセット・Seed・プレビュー位置・最近のシード） ---------- */
const SONG_PREFS_KEY = "shadow_taiko_song_prefs_v1";
let songPrefs = { byFp:{}, keyFp:{} };
try {
  const raw = JSON.parse(localStorage.getItem(SONG_PREFS_KEY));
  if (raw && typeof raw === "object") songPrefs = { byFp:raw.byFp || {}, keyFp:raw.keyFp || {} };
} catch (_) {}
function saveSongPrefsStore() { try { localStorage.setItem(SONG_PREFS_KEY, JSON.stringify(songPrefs)); } catch (_) {} }

/* main.js（BPM・オフセット・Seedの入力）から呼ばれる */
function saveSongPrefs() {
  if (!fingerprint) return false;
  const bpm = Number($("bpm").value), offset = Number($("offset").value) || 0, prev = songPrefs.byFp[fingerprint] || {};
  songPrefs.byFp[fingerprint] = { ...prev, bpm:bpm >= 60 && bpm <= 300 ? bpm : prev.bpm,
    offset:Math.max(-5000, Math.min(5000, offset)), seed:$("seed").value.slice(0, 32), t:Date.now() };
  saveSongPrefsStore();
  setStatus("songPrefsStatus", "songPrefsSaved");
  return true;
}

/* ---------- 🎲 シードを探す道具 ---------- */
const seedTools = el("div", "miniActions"); seedTools.style.alignItems = "center";
$("songPrefsStatus").after(seedTools);
function setSeed(s) {
  if (phase !== "title") return;
  $("seed").value = s;
  $("seed").dispatchEvent(new Event("input"));    // main.js が保存と譜面の作り直しをします
}
function renderSeedTools() {
  seedTools.textContent = "";
  const roll = el("button", "", tr("seedRoll")); roll.type = "button";
  roll.addEventListener("click", () => setSeed(String(100000 + Math.floor(Math.random() * 900000))));
  seedTools.append(roll);
  const seeds = (fingerprint && songPrefs.byFp[fingerprint] && songPrefs.byFp[fingerprint].seeds) || [];
  if (!seeds.length) return;
  seedTools.append(el("span", "hint", tr("seedRecent")));
  for (const s of seeds) {
    const b = el("button", s === $("seed").value.trim() ? "selected" : "", s); b.type = "button";
    b.addEventListener("click", () => setSeed(s));
    seedTools.append(b);
  }
}
on("beforePlay", () => {
  const s = $("seed").value.trim(); if (!fingerprint || !s) return;
  const sp = songPrefs.byFp[fingerprint] ||= {};
  sp.seeds = [s, ...(sp.seeds || []).filter(x => x !== s)].slice(0, 8);
  saveSongPrefsStore(); renderSeedTools();
});
on("chart", renderSeedTools);
on("language", renderSeedTools);

/* ---------- 曲リストの中身 ---------- */
let folderSongs = [], addedSongs = [], packSongs = [], libHandle = null, libView = [];
const allSongs = () => [...folderSongs, ...addedSongs, ...packSongs];
function addedItem(file) {
  const base = baseName(file.name);
  return { key:`${file.size}|${base}`, source:"file", file, title:base, base, size:file.size };
}
function packItem(s) {
  const ext = extOf(s.audio), file = new File([s.audioBlob], `${safeName(s.title)}.${ext}`, { type:s.audioBlob.type || "" });
  return { key:`pack:${s.key}`, source:"pack", file, title:s.title, base:baseName(file.name), size:file.size,
    artist:s.artist, charter:s.charter, license:s.license, bpm:s.bpm, offset:s.offset, previewStart:s.previewStart,
    bgBlob:s.bgBlob, chartBlobs:s.chartBlobs, packName:s.packName };
}
function srcLabel(s) {
  if (s.source === "pack") return `${tr("srcPack")} · ${s.packName || ""}`;
  if (s.source === "file") return tr("srcFile");
  return s.dir || tr("srcFolder");
}
/* 記録の要約（称号は modes.js の titleString で計算） */
function songInfo(it, idx) {
  const fp = songPrefs.keyFp[it.key];
  const r = (fp && records[fp]) || idx[`${it.size}|${it.base}`];
  if (!r) return null;
  let best = 0;
  for (const c of Object.values(r.charts || {})) {
    for (const slot of [c, c.truck, c.orbit, c.stage, c.catch]) if (slot && slot.best) best = Math.max(best, Number(slot.best.score) || 0);
  }
  const plays = PLAY_KEYS.reduce((a, k) => a + (r[k] || 0), 0);
  return { plays, best, title:titleString(r), last:r.lastPlayed || 0 };
}

/* ============ 📚 曲のタブ（曲の入り口ごとに自動でできる棚） ============
   ・「すべて」＋ パックごと ＋ フォルダーごと ＋ 追加した曲 ＋ 公認
   ・パックを入れると、そのパックのタブが自動で増える（新しい曲を探しやすく）
   ・サブフォルダは、いちばん上の階層でまとめる（例：Album/A/01.mp3 → 「Album」のタブ）
   ・選んだタブは settings.libTab に残る。消えたタブは「すべて」を表示（設定は残すので、
     パックを入れ直すと、またそのタブが選ばれた状態に戻る） */
Object.assign(TEXT.ja, {
  libTabAll:"すべて", libTabFiles:"追加した曲", libTabVerified:"公認", libTabPackNone:"曲パック", libTabFolderTop:"フォルダ（直下）",
  libTabGo:"この棚に {n}曲", libTabEmpty:"このタブには曲がありません。ほかのタブを見てみてください。"
});
Object.assign(TEXT.en, {
  libTabAll:"All", libTabFiles:"Added", libTabVerified:"Verified", libTabPackNone:"Song pack", libTabFolderTop:"Folder (top level)",
  libTabGo:"{n} songs in this shelf", libTabEmpty:"No songs in this tab. Try another tab."
});
Object.assign(TEXT.zh, {
  libTabAll:"全部", libTabFiles:"已添加", libTabVerified:"认证", libTabPackNone:"歌曲包", libTabFolderTop:"文件夹（顶层）",
  libTabGo:"这个架子有 {n} 首", libTabEmpty:"此标签内没有歌曲。请看看其他标签。"
});
Object.assign(TEXT.ko, {
  libTabAll:"전체", libTabFiles:"추가한 곡", libTabVerified:"공인", libTabPackNone:"곡 팩", libTabFolderTop:"폴더 (최상위)",
  libTabGo:"이 선반에 {n}곡", libTabEmpty:"이 탭에는 곡이 없습니다. 다른 탭을 봐 주세요."
});
const libFolderSeg = it => String(it.dir || "").split("/")[0].trim();
/* ✔公認の判定は verified.js の窓口から（読み込まれていなければ、公認タブは作りません） */
const libIsVerified = it => {
  const v = window.TrkVerified;
  return !!(v && typeof v.verifyOf === "function" && v.verifyOf(it));
};
const libPackKey = it => it.packId || it.packName || "";
/* 曲 → タブのID（同じ曲でも、入り口が違えば別のタブ） */
function libTabIdOf(it) {
  if (it.source === "pack") return "pack:" + libPackKey(it);
  if (it.source === "file") return "file";
  const seg = libFolderSeg(it);
  return seg ? "folder:" + seg : "folder";
}
/* タブの一覧（順番：すべて → パック → フォルダー → 追加した曲 → 公認） */
function libTabsOf(all) {
  const tabs = [{ id:"all", icon:"📚", label:tr("libTabAll"), n:all.length }];
  const packs = new Map(), folders = new Map();
  let nFiles = 0;
  for (const it of all) {
    if (it.source === "pack") {
      const key = libPackKey(it), t = packs.get(key) || { id:"pack:" + key, icon:"📦", label:it.packName || tr("libTabPackNone"), n:0 };
      t.n++; packs.set(key, t);
    } else if (it.source === "file") nFiles++;
    else {
      const seg = libFolderSeg(it), t = folders.get(seg) || { id:seg ? "folder:" + seg : "folder", icon:"📁", label:seg || tr("libTabFolderTop"), n:0 };
      t.n++; folders.set(seg, t);
    }
  }
  for (const t of packs.values()) tabs.push(t);
  for (const t of folders.values()) tabs.push(t);
  if (nFiles) tabs.push({ id:"file", icon:"📄", label:tr("libTabFiles"), n:nFiles });
  const nv = all.filter(it => it.source === "pack" && libIsVerified(it)).length;
  if (nv) tabs.push({ id:"verified", icon:"✔", label:tr("libTabVerified"), n:nv });
  return tabs;
}
function libTabMatch(it, id) {
  if (!id || id === "all") return true;
  if (id === "file") return it.source === "file";
  if (id === "verified") return it.source === "pack" && libIsVerified(it);
  if (id.startsWith("pack:")) return it.source === "pack" && "pack:" + libPackKey(it) === id;
  if (id.startsWith("folder:")) return it.source === "folder" && libFolderSeg(it) === id.slice(7);
  if (id === "folder") return it.source === "folder" && !libFolderSeg(it);
  return true;
}
/* タブ帯を描いて、いま選ばれているタブのIDを返す */
function renderLibTabs(tabs) {
  const box = $("libTabs");
  const active = tabs.some(t => t.id === settings.libTab) ? settings.libTab : "all";
  if (!box) return active;
  box.textContent = "";
  box.hidden = tabs.length < 2;
  if (box.hidden) return active;
  for (const t of tabs) {
    const b = el("button", "libTab" + (t.id === active ? " on" : "")); b.type = "button";
    b.dataset.tab = t.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(t.id === active));
    b.title = tr("libTabGo", { n:t.n });
    b.append(el("span", "libTabIcon", t.icon), el("span", "libTabName", t.label), el("i", "libTabN", String(t.n)));
    b.addEventListener("click", () => {
      if (settings.libTab === t.id) return;
      settings.libTab = t.id; saveUserPrefs(); renderLib();
    });
    box.append(b);
  }
  return active;
}

/* ---------- 曲リストの表示 ---------- */
function renderLib() {
  const box = $("libList"); box.textContent = "";
  const all = allSongs();
  $("libCount").textContent = all.length ? tr("libCount", { n:all.length }) : "";
  const tabId = renderLibTabs(libTabsOf(all));          // タブは、曲が1つも無くても片付ける
  if (!all.length) { libView = []; box.append(el("div", "libEmpty", tr("libEmptyList"))); return; }
  const scope = all.filter(it => libTabMatch(it, tabId));
  const q = $("libSearch").value.trim().toLowerCase(), idx = {};
  for (const r of Object.values(records)) if (r && r.title != null) idx[`${r.size}|${r.title}`] = r;
  const items = scope
    .filter(it => !q || `${it.title} ${it.dir || ""} ${it.artist || ""} ${it.packName || ""}`.toLowerCase().includes(q))
    .map(it => ({ it, info:songInfo(it, idx) }));
  const v = (x, k) => (x.info ? x.info[k] : 0);
  const cmp = {
    name:(a, b) => a.it.title.localeCompare(b.it.title, undefined, { numeric:true }),
    plays:(a, b) => v(b, "plays") - v(a, "plays"),
    recent:(a, b) => v(b, "last") - v(a, "last"),
    best:(a, b) => v(b, "best") - v(a, "best")
  }[settings.libSort] || (() => 0);
  items.sort(cmp);
  libView = items.map(x => x.it);
  if (!items.length) { box.append(el("div", "libEmpty", tr(scope.length ? "libNoMatch" : "libTabEmpty"))); return; }
  for (const { it, info } of items.slice(0, LIB_SHOW)) {
    const wrap = el("div"); wrap.style.cssText = "display:flex;gap:6px;align-items:stretch";
    const cur = currentSong && currentSong.key === it.key;
    const b = el("button", `libRow src-${it.source}` + (cur ? " cur" : "")); b.type = "button"; b.style.flex = "1"; b.style.minWidth = "0";
    const left = el("span", "libLeft"), meta = el("span", "libMeta");
    left.append(el("span", "libName", it.title + (info && info.title ? " " + info.title : "")),   // 例：曲名 🥁🐔🚚⚔🎪🚛
                el("span", "libSub", [it.artist, srcLabel(it)].filter(Boolean).join(" · ")));
    if (it.charts) meta.append(el("i", "libTag", "📄"));
    if (it.chartBlobs && Object.keys(it.chartBlobs).length) meta.append(el("i", "libTag", "📦"));
    if (info && info.plays) meta.append(el("i", "libTag", tr("libPlays", { n:info.plays })));
    if (info && info.best) meta.append(el("i", "libTag", info.best.toLocaleString()));
    b.append(left, meta);
    b.addEventListener("click", () => selectSong(it));
    wrap.append(b);
    if (it.source === "file") {
      const del = el("button", "", "✕"); del.type = "button"; del.title = tr("libRemove"); del.setAttribute("aria-label", tr("libRemove"));
      del.style.cssText = "padding:6px 12px;font-size:14px;border-radius:12px";
      del.addEventListener("click", () => removeAdded(it));
      wrap.append(del);
    }
    box.append(wrap);
  }
  if (items.length > LIB_SHOW) box.append(el("div", "hint", tr("libMore", { n:items.length - LIB_SHOW })));
}

/* ---------- 選曲画面の曲名の欄 ---------- */
let bannerUrl = null;
const previewSetBtn = el("button", "", "");
previewSetBtn.type = "button"; previewSetBtn.hidden = true;
previewSetBtn.style.cssText = "position:absolute;top:12px;right:12px;padding:6px 12px;font-size:13px;z-index:1";
$("songBanner").append(previewSetBtn);
function renderBanner() {
  const b = $("songBanner"), s = currentSong;
  if (bannerUrl) { URL.revokeObjectURL(bannerUrl); bannerUrl = null; }
  b.style.backgroundImage = ""; b.classList.remove("hasImg");
  if (!s) {
    $("songTitleBig").textContent = tr("songNone"); $("songSub").textContent = tr("songNoneSub");
  } else {
    $("songTitleBig").textContent = s.title;
    $("songSub").textContent = [s.artist, s.charter ? `${tr("chartBy")}: ${s.charter}` : "", srcLabel(s)].filter(Boolean).join(" · ");
    if (s.bgBlob) { bannerUrl = URL.createObjectURL(s.bgBlob); b.style.backgroundImage = `url("${bannerUrl}")`; b.classList.add("hasImg"); }
  }
  previewSetBtn.textContent = tr("previewSet");
  previewSetBtn.hidden = !(s && videoReady);
}
function updateSpBuilder() {
  $("songPackBuilder").hidden = !(currentSong && videoReady);
  previewSetBtn.hidden = !(currentSong && videoReady);
}
previewSetBtn.addEventListener("click", () => {
  if (!fingerprint || !isFinite(video.currentTime)) return;
  const t = Math.round(video.currentTime * 10) / 10;
  songPrefs.byFp[fingerprint] = { ...(songPrefs.byFp[fingerprint] || {}), previewStart:t };
  saveSongPrefsStore();
  setStatus("songPrefsStatus", "previewSetDone", { t:fmtTime(t) });
});

/* ---------- プレビュー再生 ---------- */
let previewPending = false, fadeRaf = 0;
function previewStartFor() {
  const fp = fingerprint || (currentSong && isFinite(video.duration) ? `${currentSong.size}:${Math.round(video.duration * 10)}` : "");
  const sp = songPrefs.byFp[fp];
  let t = sp && typeof sp.previewStart === "number" ? sp.previewStart
        : currentSong && currentSong.previewStart != null ? currentSong.previewStart
        : (video.duration || 0) * 0.4;
  return Math.max(0, Math.min(t, (video.duration || 0) - 3));
}
function fadeTo(target, ms) {
  cancelAnimationFrame(fadeRaf);
  const from = video.volume, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms);
    video.volume = Math.max(0, Math.min(1, from + (target - from) * k));
    if (k < 1 && phase === "title") fadeRaf = requestAnimationFrame(step);
  };
  fadeRaf = requestAnimationFrame(step);
}
function startPreview() {
  if (!settings.previewEnabled || phase !== "title" || !currentSong || !video.src || !isFinite(video.duration)) return;
  if (!video.paused) return;
  cancelAnimationFrame(fadeRaf);
  try { video.currentTime = previewStartFor(); } catch (_) {}
  video.volume = 0;
  video.play().then(() => fadeTo(settings.musicVolume * 0.8, 900)).catch(() => {});
}
function stopPreview() {
  cancelAnimationFrame(fadeRaf);
  if (phase === "title" && !video.paused) video.pause();
}
video.addEventListener("canplay", () => { if (previewPending) { previewPending = false; startPreview(); } });
video.addEventListener("ended", () => {
  if (phase !== "title" || !currentSong || !settings.previewEnabled) return;
  try { video.currentTime = previewStartFor(); } catch (_) {}
  video.play().catch(() => {});
});
on("beforePlay", () => { previewPending = false; stopPreview(); });
on("beforeLoad", stopPreview);
on("phase", p => { if (p !== "title") { previewPending = false; cancelAnimationFrame(fadeRaf); } });
on("screen", id => { if (id === "selectScreen" && phase === "title" && videoReady) setTimeout(startPreview, 50); });
document.addEventListener("visibilitychange", () => { if (document.hidden && phase === "title") stopPreview(); });
$("previewEnabled").addEventListener("change", e => {
  settings.previewEnabled = e.target.checked; saveUserPrefs();
  if (settings.previewEnabled) startPreview(); else stopPreview();
});

/* ---------- 曲を選ぶ ---------- */
async function selectSong(it) {
  if (phase !== "title" || !it) return;
  if (currentSong && currentSong.key === it.key) { if (videoReady) startPreview(); return; }
  currentSong = it;
  stopPreview(); renderLib(); renderBanner(); updateSpBuilder();
  await setBackground(it.bgBlob || null);
  if (currentSong !== it) return;
  previewPending = true;
  const ok = await loadMedia(it.file, { title:it.title, onReady:() => restoreSongState(it) });
  if (!ok || currentSong !== it) return;
  renderLib(); renderBanner(); updateSpBuilder(); renderSeedTools();
}
/* 解析後・譜面を作る前に呼ばれる。true を返すと自動生成を省略 */
async function restoreSongState(it) {
  if (currentSong !== it) return false;
  const sp = songPrefs.byFp[fingerprint];
  let bpm = settings.bpm, offset = settings.offset, seed = settings.seed, key = "songPrefsHint";
  if (sp && sp.bpm) { bpm = sp.bpm; offset = sp.offset ?? 0; seed = sp.seed ?? seed; key = "songPrefsRestored"; }
  else if (it.bpm) { bpm = it.bpm; offset = it.offset ?? 0; key = "songPrefsPack"; }
  $("bpm").value = bpm; $("offset").value = offset; $("seed").value = seed;
  setStatus("songPrefsStatus", key);
  refreshSeedSecrets(); syncPickers();
  songPrefs.keyFp[it.key] = fingerprint; saveSongPrefsStore();
  return trySongChart();
}
/* 曲パック・フォルダに、今の難易度の譜面があれば読み込む */
async function trySongChart() {
  const s = currentSong, d = settings.difficulty;
  if (!s || !videoReady) return false;
  if (s.chartBlobs && s.chartBlobs[d]) {
    let data = null; try { data = JSON.parse(await s.chartBlobs[d].text()); } catch (_) {}
    if (data && applyChartData(data, "pack", "importStatus", false)) { setStatus("importStatus", "packChartLoaded", { d:tr(d) }); return true; }
  }
  if (s.charts && s.charts.length) {
    const lower = f => f.name.toLowerCase();
    const f = s.charts.find(x => lower(x).endsWith(`-${d}${CHART_SUFFIX}`)) || s.charts.find(x => lower(x) === (s.base + CHART_SUFFIX).toLowerCase());
    if (f && await importChartFile(f)) { setStatus("libStatus", "libChartLoaded", { f:f.name }); return true; }
  }
  return false;
}

/* ---------- 📻 ラジオ：曲が終わったら、少しして次の曲へ ---------- */
let radioTimer = 0, radioTick = 0;
function cancelRadio() { clearTimeout(radioTimer); clearInterval(radioTick); radioTimer = radioTick = 0; }
function nextSong() {
  const list = libView.length ? libView : allSongs(); if (!list.length) return null;
  const i = currentSong ? list.findIndex(x => x.key === currentSong.key) : -1;
  return list[(i + 1) % list.length];
}
/* 📺 TVドックの ◀ から使う（前の曲。端は末尾へ回り込む。曲が無いときは null） */
function prevSong() {
  const list = libView.length ? libView : allSongs(); if (!list.length) return null;
  const i = currentSong ? Math.max(0, list.findIndex(x => x.key === currentSong.key)) : 0;
  return list[(i - 1 + list.length) % list.length];
}
async function radioGo(next) {
  cancelRadio();
  if (phase !== "ended" || !settings.radio) return;
  toTitle();
  await selectSong(next);
  if (phase === "title" && videoReady && chart.length && currentSong === next) startGame();
}
on("screen", id => {
  if (id !== "endScreen" || !settings.radio) return;
  const next = nextSong(); if (!next) return;
  cancelRadio();
  let n = RADIO_WAIT;
  setStatus("endStatus", "radioNext", { t:next.title, n });
  radioTick = setInterval(() => { n--; if (n > 0) setStatus("endStatus", "radioNext", { t:next.title, n }); }, 1000);
  radioTimer = setTimeout(() => radioGo(next), RADIO_WAIT * 1000);
});
on("phase", p => { if (p !== "ended") cancelRadio(); });   // もう一度・選曲へ戻ると止まる

/* ---------- 追加した曲（ブラウザ内に保存） ---------- */
async function addSongFiles(list) {
  const files = Array.from(list || []).filter(f => MEDIA_EXT.includes(extOf(f.name)));
  if (!files.length) return;
  let first = null;
  for (const f of files) {
    const it = addedItem(f), i = addedSongs.findIndex(x => x.key === it.key);
    if (i >= 0) addedSongs.splice(i, 1);
    addedSongs.unshift(it); first = first || it;
    songDB.put(it.key, { key:it.key, file:f, name:f.name, addedAt:Date.now() }).catch(() => {});
  }
  while (addedSongs.length > ADDED_MAX) { const x = addedSongs.pop(); songDB.del(x.key).catch(() => {}); }
  renderLib();
  if (first) selectSong(first);
}
function removeAdded(it) {
  addedSongs = addedSongs.filter(x => x.key !== it.key);
  songDB.del(it.key).catch(() => {});
  renderLib();
}

/* ---------- 曲パックの曲 ---------- */
async function refreshPackSongs() {
  try { packSongs = (await getPackSongs()).map(packItem); } catch (e) { console.error(e); packSongs = []; }
  renderLib();
}
on("packsChanged", refreshPackSongs);

/* ---------- ミュージックフォルダ ---------- */
function ingestFolder(list, dirName) {
  folderSongs = []; const charts = {};
  for (const { file, rel } of list) {
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "", lower = file.name.toLowerCase();
    if (lower.endsWith(CHART_SUFFIX)) {
      const base = file.name.slice(0, -CHART_SUFFIX.length).replace(/-(easy|normal|hard|master|rush)$/i, "");
      (charts[dir + "/" + base] ||= []).push(file);
    } else if (MEDIA_EXT.includes(extOf(file.name)) && folderSongs.length < LIB_MAX) {
      const base = baseName(file.name);
      folderSongs.push({ key:`${file.size}|${base}`, source:"folder", file, title:base, base, size:file.size, dir });
    }
  }
  for (const it of folderSongs) it.charts = charts[it.dir + "/" + it.base] || null;
  setStatus("libStatus", folderSongs.length ? "libFound" : "libEmpty", { n:folderSongs.length, dir:dirName || "" });
  renderLib();
}
async function scanHandle(h) {
  const out = [];
  async function walk(dir, path, depth) {
    if (depth > 6 || out.length > LIB_MAX * 2) return;
    for await (const e of dir.values()) {
      if (e.kind === "file") {
        const n = e.name.toLowerCase();
        if (MEDIA_EXT.includes(extOf(n)) || n.endsWith(CHART_SUFFIX)) out.push({ file:await e.getFile(), rel:`${path}/${e.name}` });
      } else if (e.kind === "directory" && !e.name.startsWith(".")) await walk(e, `${path}/${e.name}`, depth + 1);
    }
  }
  await walk(h, h.name, 0);
  return out;
}
async function useHandle(h, remember) {
  setStatus("libStatus", "libScanning");
  try {
    const list = await scanHandle(h);
    libHandle = h; ingestFolder(list, h.name);
    if (remember) libKV.put("dir", h).catch(() => {});
    $("libReconnectBtn").hidden = true; $("libRescanBtn").hidden = false;
  } catch (e) { console.error(e); setStatus("libStatus", "libDenied"); }
}
async function openFolder() {
  if (!canPickDir) { $("libDirInput").click(); return; }
  try { await useHandle(await showDirectoryPicker({ id:"trk-music", mode:"read", startIn:"music" }), true); }
  catch (e) { if (e.name !== "AbortError") { console.error(e); $("libDirInput").click(); } }
}
function showReconnect() {
  const b = $("libReconnectBtn");
  if (libHandle && !b.hidden) b.textContent = tr("libReconnect", { name:libHandle.name });
}
$("libOpenBtn").addEventListener("click", openFolder);
$("libRescanBtn").addEventListener("click", () => { if (libHandle) useHandle(libHandle, false); else $("libDirInput").click(); });
$("libDirInput").addEventListener("change", e => {
  const list = Array.from(e.target.files || []).map(f => ({ file:f, rel:f.webkitRelativePath || f.name }));
  e.target.value = "";
  if (!list.length) return;
  libHandle = null; $("libRescanBtn").hidden = false;
  ingestFolder(list, list[0].rel.split("/")[0] || "");
});
$("libReconnectBtn").addEventListener("click", async () => {
  if (!libHandle) return;
  try {
    let p = await libHandle.queryPermission({ mode:"read" });
    if (p !== "granted") p = await libHandle.requestPermission({ mode:"read" });
    if (p !== "granted") { setStatus("libStatus", "libDenied"); return; }
    await useHandle(libHandle, false);
  } catch (e) { console.error(e); setStatus("libStatus", "libDenied"); }
});

/* ---------- 検索・並べ替え・ランダム ---------- */
let libSearchTimer = 0;
$("libSearch").addEventListener("input", () => { clearTimeout(libSearchTimer); libSearchTimer = setTimeout(renderLib, 150); });
$("libSort").addEventListener("change", e => { settings.libSort = e.target.value; saveUserPrefs(); renderLib(); });
$("libRandomBtn").addEventListener("click", () => { if (libView.length) selectSong(libView[Math.floor(Math.random() * libView.length)]); });

on("records", renderLib);
on("chart", updateSpBuilder);
on("language", () => { $("libSearch").placeholder = tr("libSearch"); showReconnect(); renderLib(); renderBanner(); });

/* ---------- 起動時（main.js から呼びます） ---------- */
async function initLibrary() {
  $("libSort").value = settings.libSort;
  $("previewEnabled").checked = settings.previewEnabled;
  $("libSearch").placeholder = tr("libSearch");
  renderBanner(); renderSeedTools();
  try {
    const recs = await songDB.all();
    addedSongs = recs.filter(r => r && r.file)
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .map(r => addedItem(r.file instanceof File ? r.file : new File([r.file], r.name || "song")));
  } catch (_) {}
  await refreshPackSongs();
  if (canPickDir) {
    try {
      const h = await libKV.get("dir");
      if (h && h.kind === "directory") { libHandle = h; $("libReconnectBtn").hidden = false; showReconnect(); }
    } catch (_) {}
  } else setStatus("libStatus", "libFallbackNote");
  renderLib();
}
/* ✅ library.js 完了 */
