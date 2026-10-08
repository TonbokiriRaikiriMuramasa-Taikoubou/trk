(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：選曲画面 ============
   曲リスト・フォルダ・プレビュー・曲ごとの設定・称号表示
   ▶ AUTO の切り替え・📻 ラジオ（次の曲へ自動で進む）・🎲 シードを探す道具
   文章は i18n.js にあります。 */
"use strict";

const MEDIA_EXT = ["mp4", "m4a", "mp3", "ogg", "oga", "opus", "wav", "webm", "flac", "aac", "mov"];
const LIB_MAX = 3000, LIB_SHOW = 300, ADDED_MAX = 50, CHART_SUFFIX = ".shadow-taiko.json";
const LIB_DEPTH = 8;                        /* 📤 共有は「一気に全部」が売りなので、フォルダの深さも広く歩く（旧 6） */
const SHARED_MAX = 150;                     /* 💾 端末に残す共有の曲の上限（空き容量を守るため） */
const SHARED_BYTES = 300 * 1024 * 1024, SHARED_MB = Math.round(SHARED_BYTES / 1048576);
const canPickDir = "showDirectoryPicker" in window && window.isSecureContext && window.self === window.top;
const libKV = idbStore("shadow_taiko_library", "kv");
const songDB = idbStore("shadow_taiko_songs", "files");
/* 💾 共有した曲を端末に残すときの保存先（新しいキー。既存の保存キーは変えていません） */
const sharedDB = idbStore("shadow_taiko_shared", "files");

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
/* 🎓 任意同梱デモ。小さな manifest で存在確認し、MP3は選択時だけ同一オリジンから読みます。 */
const FIRST_SPARK_KEY = "builtin:first-spark-tutorial-v1";
const FIRST_SPARK_MAX_BYTES = 2 * 1024 * 1024;
const FIRST_SPARK_MANIFEST = "./assets/optional-demo-audio/manifest.json";
const FIRST_SPARK_ASSET = "./assets/optional-demo-audio/first-spark-tutorial.mp3";
/* 🎼 手づくりのデモ譜面（初級・中級・上級）。同じフォルダーに入る任意の同梱物で、
   ファイルが無ければ自動生成に戻ります。達人・RUSH は置いていないので今までどおりSeedから作ります。
   名前はここで決め打ち（manifest 経由でパスを変えない）＋ shadow-taiko-chart の項目検証を通します。 */
const FIRST_SPARK_CHART_DIR = "./assets/optional-demo-audio/";
const FIRST_SPARK_CHART_DIFFS = ["easy", "normal", "hard"];
const firstSparkChartFile = diff => `first-spark-tutorial.${diff}.json`;
let builtInSongs = [];
let firstSparkFilePromise = null;
let firstSparkChartMap = {};      /* 難易度 → URL（manifest.charts === false のときは空） */
let firstSparkChartCache = new Map();   /* 難易度 → 読んだ譜面データ（null = このビルドに無い） */
let songSelectToken = 0;
/* 譜面を1回だけ読みに行って覚える。404は「同梱していない」、その他の失敗は次回もう一度試す */
async function firstSparkChartData(diff) {
  const url = firstSparkChartMap[diff];
  if (!url) return null;
  if (firstSparkChartCache.has(diff)) return firstSparkChartCache.get(diff);
  try {
    const response = await fetch(url, { credentials:"same-origin" });
    if (response.status === 404) { firstSparkChartCache.set(diff, null); return null; }
    if (!response.ok) return null;
    const declared = Number(response.headers.get("Content-Length") || 0);
    if (declared > window.Trk.media.CHART_FILE_MAX) return null;
    const text = await response.text();
    if (!text.length || text.length > window.Trk.media.CHART_FILE_MAX) return null;
    const data = JSON.parse(text);
    firstSparkChartCache.set(diff, data);
    return data;
  } catch (_) { return null; }   /* 通信・JSONの失敗は自動生成で遊ぶ（デモを止めない） */
}
async function initOptionalTutorialDemo() {
  const button = $("guideDemoBtn");
  if (button) button.hidden = true;
  try {
    const response = await fetch(FIRST_SPARK_MANIFEST, { credentials:"same-origin" });
    if (!response.ok) return;
    const manifest = await response.json();
    if (!manifest || manifest.version !== 1 || manifest.enabled !== true || manifest.file !== "first-spark-tutorial.mp3") return;
    /* manifest.charts === false なら音源だけ同梱した構成（譜面は自動生成） */
    firstSparkChartMap = manifest.charts === false ? {} :
      Object.fromEntries(FIRST_SPARK_CHART_DIFFS.map(d => [d, FIRST_SPARK_CHART_DIR + firstSparkChartFile(d)]));
    builtInSongs = [{
      key:FIRST_SPARK_KEY, source:"builtin", file:null, fileName:"FIRST_SPARK_Tutorial_30s.mp3",
      title:"FIRST SPARK — Tutorial", base:"FIRST SPARK — Tutorial", artist:"trk!", size:0, bpm:128, offset:0,
      charter:Object.keys(firstSparkChartMap).length ? "trk!" : "", builtinDemo:true
    }];
    if (button) button.hidden = false;
    renderLib();
  } catch (_) { /* no manifest = intentional lightweight build or an offline optional asset */ }
}
/* 📤 ミュージックフォルダを共有（許可は1回。中身のリストをぜんぶ取り込む）まわりの状態 */
let sharedSongs = [];        /* 💾 端末に残してある共有の曲（リロード後も残る） */
let libShared = false;       /* いまの libHandle が「📤 共有」でもらったものか（📁 開く と区別するため） */
let shareRemembered = false; /* 共有の許可を覚えているか（まだつながっていなくても 🚫 を出せるように） */
let lastScan = [];           /* 直近のスキャン結果（💾 をあとからオンにしたときに使う） */
let libAllKeys = new Set();  /* いまのライブラリの曲キー（🐔 階層などの件数表示に使う。renderLib が更新） */
let dirInputMode = "open";   /* フォールバックの <input webkitdirectory> を 📁/📤 のどちらが開いたか */
/* 🧩 アドオン（js/addons.js）が足した曲。setAddonSongs() で入れ替わります */
let addonSongs = [];
function setAddonSongs(list) {
  addonSongs = Array.isArray(list) ? list.slice(0, LIB_MAX) : [];
  renderLib();
}
/* 一覧の材料。同じ曲（同じ key）が 📁フォルダ・💾共有・📄追加 で重なったときは1件だけ出します
   （共有を端末に残すと、同じ曲がフォルダ側と端末側の両方に居るため） */
const allSongs = () => {
  const out = [], seen = new Set();
  for (const it of [...builtInSongs, ...folderSongs, ...sharedSongs, ...addedSongs]) {
    if (!it || seen.has(it.key)) continue;
    seen.add(it.key); out.push(it);
  }
  return [...out, ...packSongs, ...addonSongs];
};
function addedItem(file, video) {
  const base = baseName(file.name);
  return { key:`${file.size}|${base}`, source:"file", file, title:base, base, size:file.size, video:!!video };
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
  if (s.source === "builtin") return tr("srcBuiltin");
  return s.dir || tr("srcFolder");
}
/* 記録の要約（称号は modes.js の titleString で計算） */
function songInfo(it, idx) {
  const fp = songPrefs.keyFp[it.key];
  const r = (fp && window.Trk.play.records[fp]) || idx[`${it.size}|${it.base}`];
  if (!r) return null;
  let best = 0;
  for (const c of Object.values(r.charts || {})) {
    for (const slot of [c, c.truck, c.orbit, c.stage, c.catch]) if (slot && slot.best) best = Math.max(best, Number(slot.best.score) || 0);
  }
  const plays = window.Trk.play.PLAY_KEYS.reduce((a, k) => a + (r[k] || 0), 0);
  return { plays, best, title:window.Trk.modes.titleString(r), last:r.lastPlayed || 0 };
}

/* ============ 📚 曲のタブ（曲の入り口ごとに自動でできる棚） ============
   ・「すべて」＋ パックごと ＋ フォルダーごと ＋ 追加した曲 ＋ 公認
   ・パックを入れると、そのパックのタブが自動で増える（新しい曲を探しやすく）
   ・サブフォルダは、いちばん上の階層でまとめる（例：Album/A/01.mp3 → 「Album」のタブ）
   ・選んだタブは settings.libTab に残る。消えたタブは「すべて」を表示（設定は残すので、
     パックを入れ直すと、またそのタブが選ばれた状態に戻る） */
Object.assign(TEXT.ja, {
  libTabAll:"すべて", libTabFiles:"追加した曲", libTabVerified:"公認", libTabPackNone:"曲パック", libTabFolderTop:"フォルダ（直下）", libTabAddon:"アドオン", libTabDemo:"デモ曲",
  srcBuiltin:"trk! 同梱デモ",
  libTabGo:"この棚に {n}曲", libTabEmpty:"このタブには曲がありません。ほかのタブを見てみてください。"
});
Object.assign(TEXT.en, {
  libTabAll:"All", libTabFiles:"Added", libTabVerified:"Verified", libTabPackNone:"Song pack", libTabFolderTop:"Folder (top level)", libTabAddon:"Add-on", libTabDemo:"Demo track",
  srcBuiltin:"Bundled trk! demo",
  libTabGo:"{n} songs in this shelf", libTabEmpty:"No songs in this tab. Try another tab."
});
Object.assign(TEXT.zh, {
  libTabAll:"全部", libTabFiles:"已添加", libTabVerified:"认证", libTabPackNone:"歌曲包", libTabFolderTop:"文件夹（顶层）", libTabAddon:"插件", libTabDemo:"演示曲",
  srcBuiltin:"trk! 内置演示曲",
  libTabGo:"这个架子有 {n} 首", libTabEmpty:"此标签内没有歌曲。请看看其他标签。"
});
Object.assign(TEXT.ko, {
  libTabAll:"전체", libTabFiles:"추가한 곡", libTabVerified:"공인", libTabPackNone:"곡 팩", libTabFolderTop:"폴더 (최상위)", libTabAddon:"애드온", libTabDemo:"데모 곡",
  srcBuiltin:"trk! 내장 데모",
  libTabGo:"이 선반에 {n}곡", libTabEmpty:"이 탭에는 곡이 없습니다. 다른 탭을 봐 주세요."
});
Object.assign(TEXT.ja, {
  plNewTab:"📁 新規プレイリスト", plDefaultName:"プレイリスト{n}", plGlobalTitle:"📚 プレイリスト",
  plSettings:"プレイリストの設定", plName:"名前", plIcon:"アイコン（空で自動）", plIconPh:"🎧 / 🧊 / 🔒 / 楽2 など",
  plColor:"色", plColorNone:"標準の色",
  plFrozenCheck:"🧊 フリーズ（曲の追加を防ぐ）", plLockedCheck:"🔒 ロック（削除を防ぐ）",
  plSongsNow:"現在 {n} 曲", plSave:"💾 保存", plDelete:"🗑 このプレイリストを削除",
  plDeleted:"🗑 プレイリストを削除しました（曲はライブラリに残ります）", plCreated:"📁 {name} を作成しました",
  plLockedNo:"🔒 ロック中は削除できません（長押しの設定で 🔒 を外してください）",
  plFrozenNo:"🧊 {name} はフリーズ中です（追加できません）",
  plDelOne:"中クリック1回で削除する", plDelThree:"同じタブを3回中クリックして削除する",
  plDelModeHint:"🗑 プレイリストを消しても、曲はライブラリに残ります。スマホでは長押し →「🗑 このプレイリストを削除」からも消せます。",
  plDelCount:"あと {n} 回の中クリックで削除（やめるときはそのまま）",
  plAdded:"➕ {name} へ追加しました", plRemovedFrom:"➖ {name} から外しました",
  plProfileTitle:"🎶 曲のプロフィール", plTitle:"タイトル（上書き）", plArtist:"アーティスト", plAlbum:"アルバム", plComposer:"作曲者",
  plMatchMemo:"カタログ照合メモ（キャラ名など）", plMatchMemoPh:"例：Suguri",
  plMatchMemoNote:"例：BELIEVE のメモに「Suguri」と入れると、「Suguri - BELIEVE」にも照合します。曲名かメモ部分の片方だけが合う場合も候補にします。表示される曲名は BELIEVE のままです。",
  plInLists:"プレイリストに入れる", plProfileSave:"💾 保存", plProfileSaved:"🎶 曲のプロフィールを保存しました",
  plTabHint:"このプレイリストは空です。曲を長押し →「プレイリストに入れる」、または曲をタブへドラッグして追加できます。"
});
Object.assign(TEXT.en, {
  plNewTab:"📁 New playlist", plDefaultName:"Playlist {n}", plGlobalTitle:"📚 Playlists",
  plSettings:"Playlist settings", plName:"Name", plIcon:"Icon (blank = auto)", plIconPh:"🎧 / 🧊 / 🔒 / P2…",
  plColor:"Color", plColorNone:"Default color",
  plFrozenCheck:"🧊 Freeze (blocks adding songs)", plLockedCheck:"🔒 Lock (blocks deleting)",
  plSongsNow:"{n} songs", plSave:"💾 Save", plDelete:"🗑 Delete this playlist",
  plDeleted:"🗑 Playlist deleted (songs stay in your library)", plCreated:"📁 Created {name}",
  plLockedNo:"🔒 Locked — can't delete (uncheck 🔒 in long-press settings)",
  plFrozenNo:"🧊 {name} is frozen (can't add songs)",
  plDelOne:"Middle-click once to delete", plDelThree:"Middle-click the same tab 3 times to delete",
  plDelModeHint:"🗑 Deleting a playlist never removes the songs. On touch screens, use long-press → “🗑 Delete this playlist”.",
  plDelCount:"{n} more middle-clicks to delete (just stop to cancel)",
  plAdded:"➕ Added to {name}", plRemovedFrom:"➖ Removed from {name}",
  plProfileTitle:"🎶 Song profile", plTitle:"Title (override)", plArtist:"Artist", plAlbum:"Album", plComposer:"Composer",
  plMatchMemo:"Catalog match hint (character, etc.)", plMatchMemoPh:"e.g. Suguri",
  plMatchMemoNote:"For example, adding “Suguri” to “BELIEVE” also matches “Suguri - BELIEVE”. Either the title or memo side can match on its own; the displayed title stays BELIEVE.",
  plInLists:"Add to playlists", plProfileSave:"💾 Save", plProfileSaved:"🎶 Song profile saved",
  plTabHint:"This playlist is empty. Long-press a song → “Add to playlists”, or drag a song onto the tab."
});
Object.assign(TEXT.zh, {
  plNewTab:"📁 新建播放列表", plDefaultName:"播放列表{n}", plGlobalTitle:"📚 播放列表",
  plSettings:"播放列表设置", plName:"名称", plIcon:"图标（留空＝自动）", plIconPh:"🎧 / 🧊 / 🔒 / 表2…",
  plColor:"颜色", plColorNone:"默认颜色",
  plFrozenCheck:"🧊 冻结（防止添加歌曲）", plLockedCheck:"🔒 锁定（防止删除）",
  plSongsNow:"当前 {n} 首", plSave:"💾 保存", plDelete:"🗑 删除此播放列表",
  plDeleted:"🗑 已删除播放列表（歌曲仍保留在库中）", plCreated:"📁 已创建 {name}",
  plLockedNo:"🔒 锁定中无法删除（请在长按设置中取消 🔒）",
  plFrozenNo:"🧊 {name} 已冻结（无法添加歌曲）",
  plDelOne:"中键点击1次即删除", plDelThree:"同一标签中键点击3次才删除",
  plDelModeHint:"🗑 删除播放列表不会删除歌曲。触屏设备请长按 →「🗑 删除此播放列表」。",
  plDelCount:"再中键点击 {n} 次即删除（松手即取消）",
  plAdded:"➕ 已添加到 {name}", plRemovedFrom:"➖ 已从 {name} 移除",
  plProfileTitle:"🎶 歌曲资料", plTitle:"标题（覆盖）", plArtist:"艺术家", plAlbum:"专辑", plComposer:"作曲者",
  plMatchMemo:"目录匹配备注（角色等）", plMatchMemoPh:"例如：Suguri",
  plMatchMemoNote:"例如，给 BELIEVE 填写“Suguri”也会匹配“Suguri - BELIEVE”。曲名或备注任一部分匹配即可；显示的曲名仍是 BELIEVE。",
  plInLists:"加入播放列表", plProfileSave:"💾 保存", plProfileSaved:"🎶 歌曲资料已保存",
  plTabHint:"此播放列表为空。长按歌曲 →「加入播放列表」，或将歌曲拖到标签上即可添加。"
});
Object.assign(TEXT.ko, {
  plNewTab:"📁 새 재생목록", plDefaultName:"재생목록 {n}", plGlobalTitle:"📚 재생목록",
  plSettings:"재생목록 설정", plName:"이름", plIcon:"아이콘(비우면 자동)", plIconPh:"🎧 / 🧊 / 🔒 / 플2…",
  plColor:"색", plColorNone:"기본 색",
  plFrozenCheck:"🧊 프리즈(곡 추가 막기)", plLockedCheck:"🔒 잠금(삭제 막기)",
  plSongsNow:"현재 {n}곡", plSave:"💾 저장", plDelete:"🗑 이 재생목록 삭제",
  plDeleted:"🗑 재생목록을 삭제했습니다(곡은 라이브러리에 남습니다)", plCreated:"📁 {name}을(를) 만들었습니다",
  plLockedNo:"🔒 잠금 중에는 삭제할 수 없어요(길게 누른 설정에서 🔒를 해제하세요)",
  plFrozenNo:"🧊 {name}은(는) 프리즈 중입니다(추가할 수 없어요)",
  plDelOne:"가운데 클릭 1회로 삭제", plDelThree:"같은 탭을 3번 가운데 클릭해 삭제",
  plDelModeHint:"🗑 재생목록을 지워도 곡은 라이브러리에 남습니다. 터치 화면에서는 길게 누르기 → '🗑 이 재생목록 삭제'를 사용하세요.",
  plDelCount:"{n}번 더 가운데 클릭하면 삭제됩니다(멈추면 취소)",
  plAdded:"➕ {name}에 추가했어요", plRemovedFrom:"➖ {name}에서 뺐어요",
  plProfileTitle:"🎶 곡 프로필", plTitle:"제목(덮어쓰기)", plArtist:"아티스트", plAlbum:"앨범", plComposer:"작곡가",
  plMatchMemo:"카탈로그 매칭 메모(캐릭터 등)", plMatchMemoPh:"예: Suguri",
  plMatchMemoNote:"예를 들어 BELIEVE의 메모에 “Suguri”를 쓰면 “Suguri - BELIEVE”와도 매칭돼요. 곡명이나 메모 중 한쪽만 맞아도 후보가 되며, 표시되는 곡명은 BELIEVE 그대로예요.",
  plInLists:"재생목록에 넣기", plProfileSave:"💾 저장", plProfileSaved:"🎶 곡 프로필을 저장했어요",
  plTabHint:"이 재생목록은 비어 있어요. 곡을 길게 눌러 '재생목록에 넣기'하거나, 곡을 탭으로 드래그해 넣을 수 있어요."
});
Object.assign(TEXT.ja, {
  plShare:"📤 共有", plShareTitle:"📤 プレイリストを共有",
  plShareRule:"📄 楽曲ファイルは含みません（譜面も入りません）。9曲以上＋すべての曲をクリアか視聴済みなら共有できます（AUTO・📻ラジオ・倍速も視聴と数えます。AUTO視聴だけの曲には ▶AUTO が付きます・隠せません）",
  plShareNeed9:"⚠ 9曲以上で共有できます（いま {n} 曲）",
  plShareUnplayed:"⚠ 未クリア・未視聴の曲があります：{list}",
  plShareReady:"✅ 共有できます（{n} 曲・全曲プレイ済み）",
  plShareScore:"スコアを載せる", plShareBadges:"モードの称号（🥁🚛など）を載せる",
  plShareComment:"ひとことコメント（140字まで）",
  plShareSourceNote:"入手先の説明（例：□□さんのBOOTH）",
  plShareSourceUrl:"入手先リンク（https:// から）",
  plShareExport:"📤 ファイルに書き出し", plShareCopy:"📋 テキストをコピー",
  plShareExported:"📤 書き出しました", plShareCopied:"📋 コピーしました",
  plShareTextHead:"trk!プレイリスト",
  plImport:"📥 共有プレイリストを読み込む", plImportTitle:"📥 共有プレイリスト",
  plImportBad:"❌ trk!の共有プレイリストではありません",
  plImportFound:"ライブラリに {n}／{m} 曲ありました",
  plImportTake:"📁 ある {n} 曲をプレイリストに取り込む",
  plImportTaken:"📁 取り込みました（{name}）",
  plLinkOpen:"🔗 入手先を開く", plLinkCancel:"やめる",
  plLinkWarn:"このリンクはプレイリストの作成者が設定したものです。trk!はリンク先の内容を保証しません。",
  plAutoMark:"▶AUTO"
});
Object.assign(TEXT.en, {
  plShare:"📤 Share", plShareTitle:"📤 Share this playlist",
  plShareRule:"📄 No song files (or charts) are included. You can share once you have 9+ songs and have cleared or listened to every one (AUTO, 📻 radio and speed changes count as listening; songs only heard via AUTO always get a ▶AUTO mark you can't hide).",
  plShareNeed9:"⚠ Sharing needs 9+ songs (you have {n})",
  plShareUnplayed:"⚠ Some songs are neither cleared nor listened to: {list}",
  plShareReady:"✅ Ready to share ({n} songs, all played)",
  plShareScore:"Include scores", plShareBadges:"Include mode titles (🥁🚛…)",
  plShareComment:"A short comment (up to 140 chars)",
  plShareSourceNote:"Where to get the songs (e.g. ○○'s BOOTH)",
  plShareSourceUrl:"Acquisition link (starts with https://)",
  plShareExport:"📤 Export as file", plShareCopy:"📋 Copy as text",
  plShareExported:"📤 Exported", plShareCopied:"📋 Copied",
  plShareTextHead:"trk! playlist",
  plImport:"📥 Load a shared playlist", plImportTitle:"📥 Shared playlist",
  plImportBad:"❌ Not a trk! shared playlist",
  plImportFound:"{n} of {m} songs are in your library",
  plImportTake:"📁 Import the {n} found songs as a playlist",
  plImportTaken:"📁 Imported ({name})",
  plLinkOpen:"🔗 Open the link", plLinkCancel:"Cancel",
  plLinkWarn:"This link was set by the playlist's author. trk! cannot guarantee its content.",
  plAutoMark:"▶AUTO"
});
Object.assign(TEXT.zh, {
  plShare:"📤 共享", plShareTitle:"📤 共享此播放列表",
  plShareRule:"📄 不包含歌曲文件（也不含谱面）。拥有9曲以上且每首都已通关或收听过即可共享（AUTO、📻电台、倍速也算收听。仅用AUTO收听的歌曲会带上无法隐藏的 ▶AUTO 标记）",
  plShareNeed9:"⚠ 需要9曲以上才能共享（当前 {n} 曲）",
  plShareUnplayed:"⚠ 有未通关且未收听的歌曲：{list}",
  plShareReady:"✅ 可以共享（{n} 曲・全部播放过）",
  plShareScore:"附上分数", plShareBadges:"附上模式称号（🥁🚛等）",
  plShareComment:"一句话评论（最多140字）",
  plShareSourceNote:"入手说明（例：○○的BOOTH）",
  plShareSourceUrl:"入手链接（https:// 开头）",
  plShareExport:"📤 导出为文件", plShareCopy:"📋 复制为文本",
  plShareExported:"📤 已导出", plShareCopied:"📋 已复制",
  plShareTextHead:"trk!播放列表",
  plImport:"📥 读取共享播放列表", plImportTitle:"📥 共享播放列表",
  plImportBad:"❌ 不是trk!的共享播放列表",
  plImportFound:"库中有 {n}／{m} 曲",
  plImportTake:"📁 将找到的 {n} 曲导入为播放列表",
  plImportTaken:"📁 已导入（{name}）",
  plLinkOpen:"🔗 打开链接", plLinkCancel:"取消",
  plLinkWarn:"此链接由播放列表作者设置，trk!不保证其内容安全。",
  plAutoMark:"▶AUTO"
});
Object.assign(TEXT.ko, {
  plShare:"📤 공유", plShareTitle:"📤 재생목록 공유",
  plShareRule:"📄 곡 파일(채보 포함)은 담기지 않아요. 9곡 이상이고 모든 곡을 클리어했거나 들었으면 공유할 수 있어요(AUTO・📻라디오・배속도 시청으로 셉니다. AUTO로만 들은 곡에는 숨길 수 없는 ▶AUTO 표시가 붙어요).",
  plShareNeed9:"⚠ 9곡 이상부터 공유할 수 있어요(현재 {n}곡)",
  plShareUnplayed:"⚠ 클리어하지도 듣지도 않은 곡이 있어요: {list}",
  plShareReady:"✅ 공유할 수 있어요({n}곡・전곡 플레이함)",
  plShareScore:"점수 실기", plShareBadges:"모드 칭호(🥁🚛 등) 실기",
  plShareComment:"한줄 코멘트(140자까지)",
  plShareSourceNote:"입수처 설명(예: ○○님의 BOOTH)",
  plShareSourceUrl:"입수처 링크(https:// 로 시작)",
  plShareExport:"📤 파일로 내보내기", plShareCopy:"📋 텍스트 복사",
  plShareExported:"📤 내보냈어요", plShareCopied:"📋 복사했어요",
  plShareTextHead:"trk! 재생목록",
  plImport:"📥 공유 재생목록 불러오기", plImportTitle:"📥 공유 재생목록",
  plImportBad:"❌ trk! 공유 재생목록이 아니에요",
  plImportFound:"라이브러리에 {n}／{m}곡이 있어요",
  plImportTake:"📁 있는 {n}곡을 재생목록으로 가져오기",
  plImportTaken:"📁 가져왔어요({name})",
  plLinkOpen:"🔗 링크 열기", plLinkCancel:"취소",
  plLinkWarn:"이 링크는 재생목록 만든 사람이 설정한 것이에요. trk!는 내용을 보증하지 않아요.",
  plAutoMark:"▶AUTO"
});
Object.assign(TEXT.ja, {
  plNewFolder:"📁 新規フォルダ", plDefaultFolderName:"フォルダ", plFolderSettings:"フォルダの設定",
  plFolderOf:"入れ物", plFolderRoot:"（なし・並びのトップ）",
  plFolderDel:"🗑 このフォルダを削除（中身は消えません）",
  plFolderCreated:"📁 フォルダ「{name}」を作成しました", plFolderDeleted:"🗑 フォルダを削除しました（中身は上の階層へ）",
  fldTabHint:"このフォルダは空です。プレイリストの長押し → 設定の「入れ物」で、このフォルダへ移動できます。",
  plTags:"タグ（検索用）", plTagsPh:"esports 名場面 …（スペース区切り・5個まで）",
  plProfileUrl:"入手先リンク（https://・共有に添付）", plLinkBad:"❌ リンクは https:// ではじめてください",
  plCatalogBtn:"🛒 公式カタログ", plCatalogTitle:"🛒 公式カタログ（音源は同梱しません）",
  plCatalogHint:"プレイリストの「欲しい曲リスト」を取り込めます。音源ファイルは一切同梱されません。公式の入手先から自分で入手して 📁 Musicフォルダ に入れると、同じ曲名の曲が自動でプレイリストに加わります（未入手の曲は薄く表示されます）。",
  plCatalogTake:"📥 取り込む（{n}曲）", plCatalogTaken:"📥 取り込みました（{name}）。曲を入手してMusicフォルダに入れると自動で追加されます",
  plCatalogDup:"すでに取り込んでいます（{name}）",
  plWishHead:"📡 まだ持っていない曲（{n}）— 公式から入手して Music フォルダに入れると、次に開いたときに黒くなって遊べます",
  plWishTag:"未入手", plGuideTitle:"📥 このプレイリストの入手先",
  plWishHint:"🛒 {have}/{total} 曲を入手済み。灰色はまだ持っていない曲です（タップで公式の入手先）。Music フォルダに入れると黒くなります。",
  plWishOpen:"公式の入手先を開く", plWishNoLink:"この曲の入手先リンクはありません。公式ストアなどで入手して Music フォルダに入れてください。",
  plAuthorTools:"👥 投稿者ツール（共有プレイリストをたくさん受け取る人向け）",
  plAuthorNamePh:"例：たぬき（共有ファイルに添わる名前）",
  plAuthorBtn:"👥 投稿者（検索・ブロック・お気に入り）", plAuthorTitle:"👥 投稿者",
  plAuthorSearchPh:"🔍 投稿者名でしぼりこむ", plAuthorOnly:"⭐を付けた投稿者だけ表示する",
  plAuthorFavAdd:"⭐ お気に入り投稿者にする", plAuthorFavDel:"☆ お気に入りから外す",
  plAuthorBlock:"🚫 この投稿者をブロック（プレイリストを隠します）", plAuthorUnblock:"🚫 ブロックを解除",
  plAuthorNone:"投稿者の付いたプレイリストはまだありません。共有プレイリストを読み込むと「👤 投稿者」付きで入ります。",
  plAuthorHidden:"🚫 非表示 {n} 件（ブロック中または絞り込み中）", plAuthorBy:"投稿者",
  plAuthorBlockedView:"ブロック中の投稿者です",
  trkPlaylistTitle:"🐔 trk's playlist", trkPlaylistHint:"ゲーム音楽の紹介プレイリスト（非営利・音源は同梱しません。公式の入手先からどうぞ）",
  trkPlaylistToggle:"🐔 trk's playlist タブを表示", trkPlaylistNote:"右端に出るゲーム音楽の紹介タブです。OFFで隠せます。チュートリアルを終えると自動で追加されます。",
  trkMusicFolderHint:"Musicフォルダ内に「trk」フォルダを自分で作り、曲をまとめておくと整理しやすくなります。下のボタンで選ぶと、ライブラリの読み込み先がそのフォルダに切り替わり、中だけを読み込みます（trk!はフォルダ作成・曲の移動をせず読み取りのみ。Music全体に戻すときは通常のフォルダ選択でMusicを選び直してください）。",
  trkMusicFolderBtn:"📂 Music内のtrkフォルダを読み込む",
  trkOpen:"🐔 開く", trkAdded:"🐔 trk's playlist を追加しました（{n}曲）— 右端のタブをどうぞ",
  trkDup:"🐔 trk's playlist はすでに入っています", trkShow:"🐔 trk's playlist を表示", trkHide:"🐔 trk's playlist を非表示",
  trkPanelTitle:"🐔 trk's playlist", trkPanelHint:"チュートリアルを終えると右端に現れるゲーム音楽の紹介（非営利・音源なし）。",
  trkCatalogBtn:"🐔 trk's playlist", trkCatalogTitle:"🐔 trk's playlist（非営利の紹介プレイリスト）",
  trkCatalogHint:"最初の10曲はSAM Free Music — 100% Orange Juice! で出会える曲です。東方・ブルアカ・アークナイツも収録！音源は同梱しません。（著作権は放棄されていません）",
  trkTab:"🐔 trk's playlist",
  trkTabNameLabel:"タブの表示名", trkTabNameFull:"trk's playlist", trkTabNameShort:"trk's", trkTabNameIcon:"🐔（アイコンのみ）",
  trkTabNameNote:"🐔 のアイコンと色は固定です。タブの名前はこの3つから選べます（タップ＝中身、長押し＝階層）。",
  trkMenuTitle:"🐔 階層（Vol 一覧）", trkMenuHint:"タブの長押しで開く 🐔 trk's playlist の中身です。Vol やシリーズを選べます。名前と色は変えられません。",
  trkMenuOpenFolder:"フォルダを開く", trkOpenItem:"開く", trkMoveUp:"上へ", trkMoveDown:"下へ",
  trkOrderEmpty:"（まだプレイリストがありません。チュートリアルを完了すると自動作成されます）",
  trkOrderAbcOff:"🔤 ABC順がオンのため、手動の ↑↓ は無効です。",
  trkSortAbc:"🔤 ABC順に並べる", trkSortAbcHint:"オフのときは下のリストの ↑↓ で自由に並べ替えできます。長押しで開く 🐔 の階層にも反映されます。",
  trkClassicTitle:"🎻 trk classic", trkClassicHint:"クラシック名盤100選（版権切れの名演をMusopenのPublic Domain録音で紹介）",
  trkClassicToggle:"🎻 trk classic タブを表示", trkClassicNote:"右端に出るクラシックの紹介タブです。OFFで隠せます。チュートリアルを終えると自動で追加されます。",
  trkClassicAdded:"🎻 trk classic を追加しました（{n}曲）— 右端のタブをどうぞ",
  trkClassicDup:"🎻 trk classic はすでに入っています", trkClassicShow:"🎻 trk classic を表示", trkClassicHide:"🎻 trk classic を非表示",
  trkClassicPanelTitle:"🎻 trk classic", trkClassicPanelHint:"チュートリアルを終えると右端に現れるクラシック名盤（版権切れ・音源なし）。Princess Tutuでも聴ける名曲も収録。",
  trkClassicBtn:"🎻 trk classic", trkClassicTab:"🎻 trk classic"
});
Object.assign(TEXT.en, {
  plNewFolder:"📁 New folder", plDefaultFolderName:"Folder", plFolderSettings:"Folder settings",
  plFolderOf:"Location", plFolderRoot:"(none — top level)",
  plFolderDel:"🗑 Delete this folder (contents are kept)",
  plFolderCreated:"📁 Folder “{name}” created", plFolderDeleted:"🗑 Folder deleted (contents moved up)",
  fldTabHint:"This folder is empty. Move playlists here from their long-press settings (“Location”).",
  plTags:"Tags (for search)", plTagsPh:"esports highlights … (space-separated, up to 5)",
  plProfileUrl:"Source link (https://, attached when shared)", plLinkBad:"❌ Links must start with https://",
  plCatalogBtn:"🛒 Official catalog", plCatalogTitle:"🛒 Official catalog (no audio bundled)",
  plCatalogHint:"Import curated playlists as a “wanted songs” list. No audio files are included. Get the music from the official sources, drop it into your 📁 Music folder, and matching songs join the playlist automatically (missing songs appear dimmed).",
  plCatalogTake:"📥 Import ({n} songs)", plCatalogTaken:"📥 Imported ({name}). Add the music to your Music folder and it joins automatically.",
  plCatalogDup:"Already imported ({name})",
  plWishHead:"📡 Not in your library yet ({n}) — get them from the official source and drop them into your Music folder; they turn black (playable) next time you open this tab",
  plWishTag:"missing", plGuideTitle:"📥 How to get this music",
  plWishHint:"🛒 {have}/{total} collected. Grey rows are the ones you do not have yet — tap one for its official source. Add the audio to your Music folder and it turns black.",
  plWishOpen:"Open the official source", plWishNoLink:"No source link for this track yet. Get it from an official store and put it in your Music folder.",
  plAuthorTools:"👥 Author tools (for people who receive lots of shared playlists)",
  plAuthorNamePh:"e.g. tanuki (name attached to your shared files)",
  plAuthorBtn:"👥 Authors (search / block / favorites)", plAuthorTitle:"👥 Authors",
  plAuthorSearchPh:"🔍 Filter by author name", plAuthorOnly:"Show only favorite authors",
  plAuthorFavAdd:"⭐ Mark as favorite author", plAuthorFavDel:"☆ Remove from favorites",
  plAuthorBlock:"🚫 Block this author (hides their playlists)", plAuthorUnblock:"🚫 Unblock",
  plAuthorNone:"No playlists with an author yet. Imported shared playlists carry a “👤 author”.",
  plAuthorHidden:"🚫 {n} hidden (blocked or filtered out)", plAuthorBy:"Author",
  plAuthorBlockedView:"This author is blocked",
  trkPlaylistTitle:"🐔 trk's playlist", trkPlaylistHint:"A curated game-music intro playlist (non-commercial, no audio bundled — get it from official sources).",
  trkPlaylistToggle:"Show 🐔 trk's playlist tab", trkPlaylistNote:"Game-music intro tab at the far right. Turn off to hide. Added automatically after the tutorial.",
  trkMusicFolderHint:"Create a trk folder inside Music yourself and put the tracks you want there. Choosing it below switches the active library folder to trk and scans only it; select Music again in the regular folder picker to switch back. trk! only reads files—it never creates folders or moves tracks.",
  trkMusicFolderBtn:"📂 Choose the trk folder in Music",
  trkOpen:"🐔 Open", trkAdded:"Added 🐔 trk's playlist ({n} songs) — find it at the far right",
  trkDup:"🐔 trk's playlist is already there", trkShow:"Show 🐔 trk's playlist", trkHide:"Hide 🐔 trk's playlist",
  trkPanelTitle:"🐔 trk's playlist", trkPanelHint:"Appears at the far right after the tutorial (non-commercial, no audio).",
  trkCatalogBtn:"🐔 trk's playlist", trkCatalogTitle:"🐔 trk's playlist (non-commercial intro)",
  trkCatalogHint:"First 10 are SAM Free Music — tracks from 100% Orange Juice! Touhou, Blue Archive, Arknights and more inside! No audio bundled. (Copyright not waived.)",
  trkTab:"🐔 trk's playlist",
  trkTabNameLabel:"Tab label", trkTabNameFull:"trk's playlist", trkTabNameShort:"trk's", trkTabNameIcon:"🐔 (icon only)",
  trkTabNameNote:"The 🐔 icon and color are fixed. Choose one of these three labels (tap = songs, long-press = hierarchy).",
  trkMenuTitle:"🐔 Hierarchy (Vol list)", trkMenuHint:"Opened by long-pressing 🐔 trk's playlist. Pick a Vol or series here. Name and color are fixed.",
  trkMenuOpenFolder:"Open folder", trkOpenItem:"Open", trkMoveUp:"Move up", trkMoveDown:"Move down",
  trkOrderEmpty:"(No playlists yet. They are created automatically when you finish the tutorial.)",
  trkOrderAbcOff:"🔤 Manual ↑↓ is disabled while ABC order is on.",
  trkSortAbc:"🔤 Sort A–Z", trkSortAbcHint:"When off, use ↑↓ in the list below to arrange freely. It also applies to the 🐔 hierarchy opened by long-press.",
  trkClassicTitle:"🎻 trk classic", trkClassicHint:"100 Classical masterpieces (public-domain recordings via Musopen)",
  trkClassicToggle:"Show 🎻 trk classic tab", trkClassicNote:"Classical intro tab at the far right. Turn off to hide. Added automatically after the tutorial.",
  trkClassicAdded:"Added 🎻 trk classic ({n} songs) — find it at the far right",
  trkClassicDup:"🎻 trk classic is already there", trkClassicShow:"Show 🎻 trk classic", trkClassicHide:"Hide 🎻 trk classic",
  trkClassicPanelTitle:"🎻 trk classic", trkClassicPanelHint:"Appears at the far right after the tutorial (public-domain, no audio). Gems from Princess Tutu too.",
  trkClassicBtn:"🎻 trk classic", trkClassicTab:"🎻 trk classic"
});
Object.assign(TEXT.zh, {
  plNewFolder:"📁 新建文件夹", plDefaultFolderName:"文件夹", plFolderSettings:"文件夹设置",
  plFolderOf:"所属位置", plFolderRoot:"（无・顶层）",
  plFolderDel:"🗑 删除此文件夹（内容不会消失）",
  plFolderCreated:"📁 已创建文件夹「{name}」", plFolderDeleted:"🗑 已删除文件夹（内容移到上一层）",
  fldTabHint:"此文件夹为空。在播放列表的长按设置「所属位置」中即可移入。",
  plTags:"标签（搜索用）", plTagsPh:"esports 名场面 …（空格分隔・最多5个）",
  plProfileUrl:"入手链接（https://・共享时附带）", plLinkBad:"❌ 链接必须以 https:// 开头",
  plCatalogBtn:"🛒 官方目录", plCatalogTitle:"🛒 官方目录（不包含音源）",
  plCatalogHint:"导入精选播放列表的“想要的歌曲”清单。不包含任何音频文件。请从官方渠道自行获取音乐并放入 📁 Music文件夹，同名歌曲会自动加入播放列表（未获取的歌曲会以浅色显示）。",
  plCatalogTake:"📥 导入（{n}曲）", plCatalogTaken:"📥 已导入（{name}）。把音乐放进Music文件夹后会自动加入。",
  plCatalogDup:"已经导入过了（{name}）",
  plWishHead:"📡 尚未拥有的曲目（{n}）— 从官方获取并放入 Music 文件夹后，下次打开即会变为黑色（可游玩）",
  plWishTag:"未入库", plGuideTitle:"📥 这个播放列表的获取方式",
  plWishHint:"🛒 已入手 {have}/{total} 首。灰色表示尚未拥有（点击可打开官方获取页面）。放入 Music 文件夹后即会变黑。",
  plWishOpen:"打开官方获取页面", plWishNoLink:"此曲暂无获取链接。请从官方商店获取后放入 Music 文件夹。",
  plAuthorTools:"👥 投稿者工具（适合接收大量共享播放列表的人）",
  plAuthorNamePh:"例如：狸猫（会附在你共享的文件上）",
  plAuthorBtn:"👥 投稿者（搜索／屏蔽／收藏）", plAuthorTitle:"👥 投稿者",
  plAuthorSearchPh:"🔍 按投稿者名筛选", plAuthorOnly:"只显示收藏的投稿者",
  plAuthorFavAdd:"⭐ 收藏该投稿者", plAuthorFavDel:"☆ 取消收藏",
  plAuthorBlock:"🚫 屏蔽该投稿者（隐藏其播放列表）", plAuthorUnblock:"🚫 取消屏蔽",
  plAuthorNone:"还没有带投稿者的播放列表。读入共享播放列表时会带上「👤 投稿者」。",
  plAuthorHidden:"🚫 已隐藏 {n} 件（屏蔽中或筛选中）", plAuthorBy:"投稿者",
  plAuthorBlockedView:"该投稿者已被屏蔽",
  trkPlaylistTitle:"🐔 trk's playlist", trkPlaylistHint:"游戏音乐介绍播放列表（非营利、不含音源，请从官方渠道获取）。",
  trkPlaylistToggle:"显示 🐔 trk's playlist 标签", trkPlaylistNote:"位于最右侧的游戏音乐介绍标签。关闭可隐藏，完成教程后自动添加。",
  trkMusicFolderHint:"请在 Music 文件夹内手动新建 trk 文件夹并放入想听的音乐。点击下方按钮会把当前曲库切换到 trk，只扫描其中内容；要切回整个 Music，请在常规文件夹选择中重新选择 Music。trk! 只读取，不会创建文件夹或移动歌曲。",
  trkMusicFolderBtn:"📂 选择 Music 内的 trk 文件夹",
  trkOpen:"🐔 打开", trkAdded:"已添加 🐔 trk's playlist（{n}首）— 请到最右侧查看",
  trkDup:"🐔 trk's playlist 已在列表中", trkShow:"显示 🐔 trk's playlist", trkHide:"隐藏 🐔 trk's playlist",
  trkPanelTitle:"🐔 trk's playlist", trkPanelHint:"完成教程后出现在最右侧的游戏音乐介绍（非营利、不含音源）。",
  trkCatalogBtn:"🐔 trk's playlist", trkCatalogTitle:"🐔 trk's playlist（非营利介绍）",
  trkCatalogHint:"前10首是SAM Free Music — 在100% Orange Juice! 中相遇的曲目。东方、碧蓝档案、明日方舟也有收录！不含音源。（版权未放弃）",
  trkTab:"🐔 trk's playlist",
  trkTabNameLabel:"标签显示名", trkTabNameFull:"trk's playlist", trkTabNameShort:"trk's", trkTabNameIcon:"🐔（仅图标）",
  trkTabNameNote:"🐔 图标与颜色固定。名称可从这3种中选择（点击＝内容，长按＝层级）。",
  trkMenuTitle:"🐔 层级（Vol 列表）", trkMenuHint:"长按 🐔 trk's playlist 打开的内容。可选择 Vol 或系列。名称与颜色不可更改。",
  trkMenuOpenFolder:"打开文件夹", trkOpenItem:"打开", trkMoveUp:"上移", trkMoveDown:"下移",
  trkOrderEmpty:"（还没有播放列表。完成教程后会自动创建）",
  trkOrderAbcOff:"🔤 ABC顺序开启时，手动 ↑↓ 无效。",
  trkSortAbc:"🔤 按ABC顺序排列", trkSortAbcHint:"关闭时可用下方列表的 ↑↓ 自由排序。长按打开的 🐔 层级也会同步。",
  trkClassicTitle:"🎻 trk classic", trkClassicHint:"经典名盘100首（通过Musopen公共领域录音介绍）",
  trkClassicToggle:"显示 🎻 trk classic 标签", trkClassicNote:"位于最右侧的经典介绍标签。关闭可隐藏，完成教程后自动添加。",
  trkClassicAdded:"已添加 🎻 trk classic（{n}首）— 请到最右侧查看",
  trkClassicDup:"🎻 trk classic 已在列表中", trkClassicShow:"显示 🎻 trk classic", trkClassicHide:"隐藏 🎻 trk classic",
  trkClassicPanelTitle:"🎻 trk classic", trkClassicPanelHint:"完成教程后出现在最右侧的经典名盘（公共领域、不含音源）。",
  trkClassicBtn:"🎻 trk classic", trkClassicTab:"🎻 trk classic"
});
Object.assign(TEXT.ko, {
  plNewFolder:"📁 새 폴더", plDefaultFolderName:"폴더", plFolderSettings:"폴더 설정",
  plFolderOf:"소속", plFolderRoot:"(없음・최상위)",
  plFolderDel:"🗑 이 폴더 삭제(내용은 지워지지 않아요)",
  plFolderCreated:"📁 폴더 '{name}'을(를) 만들었어요", plFolderDeleted:"🗑 폴더를 삭제했어요(내용은 위 계층으로)",
  fldTabHint:"이 폴더는 비어 있어요. 재생목록 길게 누른 설정의 '소속'에서 이 폴더로 옮길 수 있어요.",
  plTags:"태그(검색용)", plTagsPh:"esports 명장면 …(공백 구분・최대 5개)",
  plProfileUrl:"입수처 링크(https://・공유 시 첨부)", plLinkBad:"❌ 링크는 https:// 로 시작해야 해요",
  plCatalogBtn:"🛒 공식 카탈로그", plCatalogTitle:"🛒 공식 카탈로그 (음원 미포함)",
  plCatalogHint:"엄선 플레이리스트를 '원하는 곡 목록'으로 가져와요. 오디오 파일은 하나도 포함되지 않아요. 공식 입수처에서 직접 구해 📁 Music 폴더에 넣으면 같은 제목의 곡이 자동으로 플레이리스트에 들어와요 (미입수 곡은 연하게 표시돼요).",
  plCatalogTake:"📥 가져오기 ({n}곡)", plCatalogTaken:"📥 가져왔어요 ({name}). 음악을 Music 폴더에 넣으면 자동으로 추가돼요.",
  plCatalogDup:"이미 가져왔어요 ({name})",
  plWishHead:"📡 아직 없는 곡 ({n}곡) — 공식 입수처에서 구해 Music 폴더에 넣으면 다음에 열 때 검게 변해 플레이할 수 있어요",
  plWishTag:"미입수", plGuideTitle:"📥 이 플레이리스트 입수처",
  plWishHint:"🛒 {have}/{total}곡 보유 중. 회색은 아직 없는 곡이에요(탭하면 공식 입수처가 열려요). Music 폴더에 넣으면 검게 변해요.",
  plWishOpen:"공식 입수처 열기", plWishNoLink:"이 곡의 입수처 링크가 아직 없어요. 공식 스토어에서 구해 Music 폴더에 넣어 주세요.",
  plAuthorTools:"👥 올린이 도구(공유 플레이리스트를 많이 받는 사람용)",
  plAuthorNamePh:"예: 너구리(공유 파일에 붙는 이름)",
  plAuthorBtn:"👥 올린이(검색・차단・즐겨찾기)", plAuthorTitle:"👥 올린이",
  plAuthorSearchPh:"🔍 올린이 이름으로 찾기", plAuthorOnly:"⭐ 즐겨찾기 올린이만 보기",
  plAuthorFavAdd:"⭐ 즐겨찾기 올린이로 등록", plAuthorFavDel:"☆ 즐겨찾기에서 빼기",
  plAuthorBlock:"🚫 이 올린이 차단(플레이리스트 숨김)", plAuthorUnblock:"🚫 차단 해제",
  plAuthorNone:"올린이가 붙은 플레이리스트가 아직 없어요. 공유 플레이리스트를 가져오면 '👤 올린이'가 붙어요.",
  plAuthorHidden:"🚫 숨김 {n}건(차단 중 또는 필터 중)", plAuthorBy:"올린이",
  plAuthorBlockedView:"차단 중인 올린이예요",
  trkPlaylistTitle:"🐔 trk's playlist", trkPlaylistHint:"게임 음악 소개 플레이리스트(비영리・음원 미포함, 공식 입수처에서 받아 주세요).",
  trkPlaylistToggle:"🐔 trk's playlist 탭 표시", trkPlaylistNote:"맨 오른쪽에 나타나는 게임 음악 소개 탭이에요. 끄면 숨길 수 있고, 튜토리얼을 마치면 자동으로 추가돼요.",
  trkMusicFolderHint:"Music 폴더 안에 trk 폴더를 직접 만들고 곡을 넣어 주세요. 아래 버튼으로 선택하면 라이브러리 폴더가 trk로 바뀌어 그 안만 읽어요. Music 전체로 돌아가려면 일반 폴더 선택에서 Music을 다시 선택하세요. trk!는 폴더를 만들거나 곡을 옮기지 않고 읽기만 해요.",
  trkMusicFolderBtn:"📂 Music 안의 trk 폴더 선택",
  trkOpen:"🐔 열기", trkAdded:"🐔 trk's playlist를 추가했어요({n}곡) — 맨 오른쪽 탭을 확인해 주세요",
  trkDup:"🐔 trk's playlist는 이미 있어요", trkShow:"🐔 trk's playlist 표시", trkHide:"🐔 trk's playlist 숨기기",
  trkPanelTitle:"🐔 trk's playlist", trkPanelHint:"튜토리얼을 마치면 맨 오른쪽에 나타나는 게임 음악 소개(비영리・음원 없음).",
  trkCatalogBtn:"🐔 trk's playlist", trkCatalogTitle:"🐔 trk's playlist(비영리 소개 플레이리스트)",
  trkCatalogHint:"처음 10곡은 SAM Free Music — 100% Orange Juice! 에서 만난 곡들이에요. 동방·블루 아카이브·명일방주도 들어 있어요! 음원은 들어 있지 않아요. (저작권 포기 아님)",
  trkTab:"🐔 trk's playlist",
  trkTabNameLabel:"탭 표시 이름", trkTabNameFull:"trk's playlist", trkTabNameShort:"trk's", trkTabNameIcon:"🐔(아이콘만)",
  trkTabNameNote:"🐔 아이콘과 색은 고정이에요. 탭 이름은 이 3가지 중에서 고를 수 있어요(탭＝내용, 길게 누르기＝계층).",
  trkMenuTitle:"🐔 계층(Vol 목록)", trkMenuHint:"탭을 길게 눌러 여는 🐔 trk's playlist 내용이에요. Vol이나 시리즈를 고를 수 있어요. 이름과 색은 바꿀 수 없어요.",
  trkMenuOpenFolder:"폴더 열기", trkOpenItem:"열기", trkMoveUp:"위로", trkMoveDown:"아래로",
  trkOrderEmpty:"(아직 재생목록이 없어요. 튜토리얼을 마치면 자동으로 만들어져요)",
  trkOrderAbcOff:"🔤 ABC순이 켜져 있어서 수동 ↑↓는 사용할 수 없어요.",
  trkSortAbc:"🔤 ABC순으로 정렬", trkSortAbcHint:"끄면 아래 목록의 ↑↓로 자유롭게 정렬할 수 있어요. 길게 눌러 여는 🐔 계층에도 반영돼요.",
  trkClassicTitle:"🎻 trk classic", trkClassicHint:"클래식 명반 100곡(공공 영역 음원은 Musopen으로 소개)",
  trkClassicToggle:"🎻 trk classic 탭 표시", trkClassicNote:"맨 오른쪽에 나타나는 클래식 소개 탭이에요. 꺼면 숨길 수 있고, 튜토리얼을 마치면 자동으로 추가돼요.",
  trkClassicAdded:"🎻 trk classic를 추가했어요({n}곡) — 맨 오른쪽 탭을 확인해 주세요",
  trkClassicDup:"🎻 trk classic는 이미 있어요", trkClassicShow:"🎻 trk classic 표시", trkClassicHide:"🎻 trk classic 숨기기",
  trkClassicPanelTitle:"🎻 trk classic", trkClassicPanelHint:"튜토리얼을 마치면 맨 오른쪽에 나타나는 클래식 명반(공공 영역・음원 없음).",
  trkClassicBtn:"🎻 trk classic", trkClassicTab:"🎻 trk classic"
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
  if (it.source === "builtin") return "builtin";
  const seg = libFolderSeg(it);
  return seg ? "folder:" + seg : "folder";
}
/* ⭐ お気に入り（js/favs.js）。いま選んでいるフォルダの曲を数える */
function libFavKeys(all) {
  const F = window.TrkFavs;
  if (!F) return { n:0 };
  const g = F.activeOf("song");
  let n = 0;
  for (const it of all) if (F.inGroup("song", g, it.key)) n++;
  return { n, group:g };
}
/* タブの一覧（順番：すべて → ⭐お気に入り → プレイリスト → パック／アドオン／フォルダー → デモ曲 → 追加した曲 → 公認） */
function libTabsOf(all) {
  const tabs = [{ id:"all", icon:"📚", label:tr("libTabAll"), n:all.length }];
  const favN = libFavKeys(all).n;
  if (favN) tabs.push({ id:"fav", icon:"⭐", label:tr("favTab"), n:favN });
  const plKeys = new Set(all.map(x => x.key));
  /* 📁 フォルダ（中のプレイリストの曲をぜんぶ）。🐔 trk's playlist は右端に表示名つきで出すので、ここでは出さない */
  for (const f of settings.plFolders) if (!f.parent && f.id !== TRK_FOLDER_ID) tabs.push({ id:"fld:" + f.id, icon: f.icon || "📁", label: f.name, n: [...plFolderUnionKeys(f.id)].filter(k => plKeys.has(k)).length, fld: f });
  for (const p of settings.playlists) if (!p.folder && plVisible(p) && p.id !== "trk-playlist" && p.id !== "trk-classic") tabs.push({ id:"pl:" + p.id, icon: plIcon(p), label: p.name, n: plCount(p, plKeys), pl: p });   /* 🎧 フォルダに入っていないプレイリスト（👥投稿者で絞る。🐔🎻は右端に出すため除外） */
  if (settings.libTab.startsWith("pl:")) {   /* フォルダの中のプレイリストを見ているときは、そのタブも出す（戻れるように） */
    const cp = plById(settings.libTab.slice(3));
    if (cp && cp.folder && plVisible(cp) && !tabs.some(t => t.id === settings.libTab)) tabs.push({ id:"pl:" + cp.id, icon: plIcon(cp), label: cp.name, n: plCount(cp, plKeys), pl: cp, nested: true });
  }
  const packs = new Map(), folders = new Map(), addons = new Map();
  let nFiles = 0, nBuiltins = 0;
  for (const it of all) {
    if (it.source === "builtin") nBuiltins++;
    else if (it.source === "pack") {
      const key = libPackKey(it), t = packs.get(key) || { id:"pack:" + key, icon:"📦", label:it.packName || tr("libTabPackNone"), n:0 };
      t.n++; packs.set(key, t);
    } else if (it.source === "addon") {
      const key = it.addonId || "", t = addons.get(key) || { id:"addon:" + key, icon:"🧩", label:it.addonName || tr("libTabAddon"), n:0 };
      t.n++; addons.set(key, t);
    } else if (it.source === "file") nFiles++;
    else {
      const seg = libFolderSeg(it), t = folders.get(seg) || { id:seg ? "folder:" + seg : "folder", icon:"📁", label:seg || tr("libTabFolderTop"), n:0 };
      t.n++; folders.set(seg, t);
    }
  }
  for (const t of packs.values()) tabs.push(t);
  for (const t of addons.values()) tabs.push(t);          // 🧩 アドオンが足した曲
  for (const t of folders.values()) tabs.push(t);
  if (nBuiltins) tabs.push({ id:"builtin", icon:"🎓", label:tr("libTabDemo"), n:nBuiltins });
  if (nFiles) tabs.push({ id:"file", icon:"📄", label:tr("libTabFiles"), n:nFiles });
  const nv = all.filter(it => it.source === "pack" && libIsVerified(it)).length;
  if (nv) tabs.push({ id:"verified", icon:"✔", label:tr("libTabVerified"), n:nv });
  // 🐔 trk's playlist — フォルダを右端に1つ。長押しで中の Vol（階層）が開く。場所を取らずに沢山収容
  const trkFolder = settings.plFolders.find(f => f.id === TRK_FOLDER_ID);
  if (trkFolder && settings.trkPlaylist !== false) {
    const keys = plFolderUnionKeys(TRK_FOLDER_ID);
    const n = [...keys].filter(k => plKeys.has(k)).length;
    /* 表示名は設定の3種類（full=trk's playlist／short=trk's／icon=文字なし）。アイコンは 🐔 固定 */
    if (!tabs.some(x => x.id === "fld:" + TRK_FOLDER_ID)) tabs.push({ id:"fld:" + TRK_FOLDER_ID, icon: TRK_TAB_ICON, label: trkTabLabel(), n, fld: trkFolder, trk: true });
  } else if (settings.trkPlaylist !== false || settings.trkClassic !== false) {
    /* フォルダがまだ無いとき、または 🐔 タブを隠しているときのフォールバック（旧来の2タブ）。
       ⚠ 🎻 trk classic だけを表示しているときも、ここで1つタブを出す＝クラシックが行き止まりにならない */

    if (settings.trkPlaylist !== false) {
      const tp = settings.playlists.find(p => p.id === "trk-playlist");
      if (tp && plVisible(tp) && !tabs.some(x => x.id === "pl:trk-playlist")) tabs.push({ id:"pl:trk-playlist", icon: TRK_TAB_ICON, label: trkTabLabel(), n: plCount(tp, plKeys), pl: tp, trk: true });
    }
    if (settings.trkClassic !== false) {
      const tc = settings.playlists.find(p => p.id === "trk-classic");
      if (tc && plVisible(tc) && !tabs.some(x => x.id === "pl:trk-classic")) tabs.push({ id:"pl:trk-classic", icon: plIcon(tc), label: tc.name, n: plCount(tc, plKeys), pl: tc });
    }
  }
  return tabs;
}
function libTabMatch(it, id) {
  if (!id || id === "all") return true;
  if (id === "fav") { const F = window.TrkFavs; return !!(F && F.inGroup("song", F.activeOf("song"), it.key)); }
  if (id.startsWith("pl:")) { const p = plById(id.slice(3)); return !!p && p.songs.includes(it.key); }
  if (id.startsWith("fld:")) return plFolderUnionKeys(id.slice(4)).has(it.key);   /* 📁 フォルダ＝中のプレイリストの曲ぜんぶ */
  if (id === "file") return it.source === "file";
  if (id === "builtin") return it.source === "builtin";
  if (id === "verified") return it.source === "pack" && libIsVerified(it);
  if (id.startsWith("pack:")) return it.source === "pack" && "pack:" + libPackKey(it) === id;
  if (id.startsWith("addon:")) return it.source === "addon" && "addon:" + (it.addonId || "") === id;
  if (id.startsWith("folder:")) return it.source === "folder" && libFolderSeg(it) === id.slice(7);
  if (id === "folder") return it.source === "folder" && !libFolderSeg(it);
  return true;
}

/* ---------- 🎧 プレイリスト（ユーザー定義の曲タブ） ----------
   ・保存は settings.playlists（shadow_taiko_preferences_v2）。曲のキーだけを持つ参照リストなので、
     プレイリストを消しても曲はライブラリに残ります（整合性を保つ・既定の挙動）
   ・🧊フリーズ＝曲の追加を防ぐ ／ 🔒ロック＝タブの削除を防ぐ（両方ならアイコンは 🧩）
     アイコンと色は自由に設定できるので、🧊今だけ／🔒あ／楽2（色で状態を示す）といった使い方ができます
   ・操作：タブの長押し＝設定（PC・スマホ共通）／タブの中クリック＝削除（📚すべての中クリック＝新規作成。
     削除は設定で「3回」モードに変えられる）／タブ帯の右端の「＋」＝新規作成
   ・曲のプロフィール（上書きタイトル・アーティスト・アルバム・作曲者）は、localStorage の
     shadow_taiko_songmeta_v1 に別枠で保存（曲の長押しから編集） */
const PL_COLORS = { none:"", aqua:"#0e6e6e", green:"#1d6b3c", amber:"#8a5a12", red:"#8a2b35",
  purple:"#5b2d8e", blue:"#1f4f8f", pink:"#8e2d64", gray:"#4a4f5a" };
const SONG_META_KEY = "shadow_taiko_songmeta_v1";
const SONG_META_MAX = 3000;   /* 🛡 曲プロフィールの上限（共有プレイリストの取り込みで増えても、ここで頭打ち） */
function songMetaClean(raw) {   /* 1件ぶんの検証：文字列だけ・長さ上限・入手先は https のみ */
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  for (const [k, n] of [["title", 120], ["artist", 100], ["album", 100], ["composer", 100], ["matchHint", 80]]) {
    if (typeof raw[k] === "string" && raw[k].trim()) out[k] = raw[k].trim().slice(0, n);
  }
  const url = typeof raw.srcUrl === "string" ? raw.srcUrl.trim() : "";
  if (url && /^https:\/\/\S+$/i.test(url)) out.srcUrl = url.slice(0, 300);   /* javascript: などは捨てる */
  return Object.keys(out).length ? out : null;
}
function songMetaCleanAll(obj) {
  const out = {};
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return out;
  for (const k of Object.keys(obj).slice(0, SONG_META_MAX)) {
    if (typeof k !== "string" || k.length > 128) continue;
    const m = songMetaClean(obj[k]);
    if (m) out[k] = m;
  }
  return out;
}
let SONG_META = songMetaCleanAll((() => { try { return JSON.parse(localStorage.getItem(SONG_META_KEY)) || {}; } catch (_) { return {}; } })());
function songMetaSave() {
  if (Object.keys(SONG_META).length > SONG_META_MAX) SONG_META = songMetaCleanAll(SONG_META);
  try { localStorage.setItem(SONG_META_KEY, JSON.stringify(SONG_META)); } catch (_) {}
}
function metaOf(key) { const m = SONG_META[key]; return (m && typeof m === "object") ? m : null; }

/* 保存されていたプレイリスト1つの検証（読み込み時に全部に通す） */
/* 📁 プレイリストフォルダ（ネスト可・深さは3階層まで） */
function plFolderSanitize(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id) return null;
  return { id: raw.id.slice(0, 24), name: String(raw.name || "").trim().slice(0, 24) || "Folder",
    icon: typeof raw.icon === "string" ? raw.icon.slice(0, 4) : "",
    color: /^[a-z]{3,12}$/.test(raw.color || "") && PL_COLORS[raw.color] != null ? raw.color : "none",
    parent: typeof raw.parent === "string" ? raw.parent.slice(0, 24) : "",
    createdAt: (typeof raw.createdAt === "number" && raw.createdAt > 0 && raw.createdAt < 9e15) ? raw.createdAt : 0 };
}
function plFolderById(id) { return settings.plFolders.find(f => f.id === id) || null; }
function plDepthOfFolder(id) {   /* 深さ（トップ=0）。循環データでも止まる */
  let d = 0, cur = plFolderById(id); const seen = new Set();
  while (cur && cur.parent && !seen.has(cur.id)) { seen.add(cur.id); d++; cur = plFolderById(cur.parent); }
  return d;
}
function plIsDescendantFolder(id, ancestorId) {   /* id が ancestorId の中（子孫）なら真。循環データでも止まる */
  let cur = plFolderById(id); const seen = new Set();
  while (cur && cur.parent && !seen.has(cur.id)) { seen.add(cur.id); if (cur.parent === ancestorId) return true; cur = plFolderById(cur.parent); }
  return false;
}
function plFolderUnionKeys(fldId, out = new Set(), seen = new Set()) {   /* フォルダの中の曲（子フォルダも再帰） */
  if (seen.has(fldId)) return out; seen.add(fldId);
  for (const p of settings.playlists) if (p.folder === fldId && plVisible(p)) for (const k of p.songs) out.add(k);   /* 👥 ブロック中の投稿者は数えない */
  for (const f of settings.plFolders) if (f.parent === fldId) plFolderUnionKeys(f.id, out, seen);
  return out;
}
function plFolderContext() {   /* いま見ている場所のフォルダ（新規作成の初期値） */
  if (settings.libTab.startsWith("fld:")) { const f = plFolderById(settings.libTab.slice(4)); return f ? f.id : ""; }
  if (settings.libTab.startsWith("pl:")) { const p = plById(settings.libTab.slice(3)); return (p && p.folder) || ""; }
  return "";
}
/* 曲名の照合キー（plNormTitle／plTitleKeys／plSongMatchKeys／plWishTitleKeys）は js/title-match.js にある */
function plWishMatch(w, byTitle) {
  for (const k of plWishTitleKeys(w)) {
    const cands = byTitle.get(k);
    if (!cands || !cands.length) continue;
    if (cands.length === 1) return cands[0];
    const al = plNormTitle(w.al), ar = plNormTitle(w.ar);   /* 同名が複数ならアルバム→アーティストで当たりをつける */
    if (al) { const hit = cands.find(it => plNormTitle((metaOf(it.key) || {}).album) === al); if (hit) return hit; }
    if (ar) { const hit = cands.find(it => plNormTitle((metaOf(it.key) || {}).artist || it.artist) === ar); if (hit) return hit; }
    return cands[0];
  }
  return null;
}
function plSyncWishes(p, byTitle) {
  let ch = false;
  for (const w of p.wish) {
    const it = plWishMatch(w, byTitle);
    if (it && !p.songs.includes(it.key)) { p.songs.push(it.key); ch = true; }
  }
  return ch;
}
/* 🛒 「集める棚」＝ wish（カタログの曲リスト）つきプレイリスト、またはそれを含むフォルダ。
   カタログ順のまま [{w, it}] を返す（it＝もう持っている曲。まだの曲は it:null＝灰色で出す）。
   Music フォルダに入れると plSyncWishes が照合して songs に入り、次に開いたとき黒くなる。 */
function plWishFolderIds(fid) {
  const ids = new Set([fid]);
  for (const f of settings.plFolders) if (f.id !== fid && plIsDescendantFolder(f.id, fid)) ids.add(f.id);
  return ids;
}
function plCollectionEntries(tabId, byTitle) {
  const out = [], seen = new Set();
  const take = list => {
    for (const p of list) {
      if (!p || !p.wish || !p.wish.length) continue;
      for (const w of p.wish) {
        const key = plTitleKeys(w.t)[0] + "|" + plNormTitle(w.al) + "|" + plNormTitle(w.ar);
        if (seen.has(key)) continue;   /* Vol やシリーズをまたいで同じ曲があっても1回だけ */
        seen.add(key);
        out.push({ w, it: plWishMatch(w, byTitle) });
      }
    }
  };
  if (tabId.startsWith("pl:")) { const p = plById(tabId.slice(3)); if (p) take([p]); }
  else if (tabId.startsWith("fld:")) {
    const ids = plWishFolderIds(tabId.slice(4));
    take(trkOrderedPlaylists(settings.playlists.filter(p => ids.has(p.folder) && plVisible(p))));
  }
  return out;
}
/* 📡 まだ持っていない曲の行（灰色）。タップで公式の入手先を開く（リンクが無ければ案内） */
function plWishRow(w) {
  const r = el("button", "libRow plWishRow"); r.type = "button";
  /* ⚠ el(tag, cls, text) は文字を1つしか取らない。入れ子は append で組む
     （以前は "[object HTMLSpanElement]" と表示されていた） */
  const left = el("span", "libLeft");
  left.append(el("span", "libName", "🛒 " + w.t),
    el("span", "libSub", [w.ar, w.al, tr("plWishTag")].filter(Boolean).join(" · ")));
  r.append(left, el("i", "libTag", w.u ? "🔗" : "📡"));
  r.title = w.u ? tr("plWishOpen") : tr("plWishNoLink");
  r.setAttribute("aria-label", w.t + " — " + r.title);
  r.addEventListener("click", () => { if (w.u) plOpenLink(w.u); else plToast(tr("plWishNoLink")); });
  return r;
}



function plSanitize(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id) return null;
  const songs = [];
  if (Array.isArray(raw.songs)) for (const k of raw.songs) {
    if (typeof k === "string" && k.length <= 128 && !songs.includes(k)) songs.push(k);
    if (songs.length >= 1000) break;
  }
  return { id: raw.id.slice(0, 24), name: String(raw.name || "").trim().slice(0, 24) || "Playlist",
    icon: typeof raw.icon === "string" ? raw.icon.slice(0, 4) : "",
    color: /^[a-z]{3,12}$/.test(raw.color || "") && PL_COLORS[raw.color] != null ? raw.color : "none",
    frozen: !!raw.frozen, locked: !!raw.locked, songs,
    folder: typeof raw.folder === "string" ? raw.folder.slice(0, 24) : "",
    tags: (Array.isArray(raw.tags) ? raw.tags : []).filter(t => typeof t === "string").map(t => t.trim().slice(0, 16)).filter(Boolean).slice(0, 5),
    wish: (Array.isArray(raw.wish) ? raw.wish : []).filter(w => w && typeof w === "object" && w.t).slice(0, 100).map(w => {
      const out = { t: String(w.t).trim().slice(0, 120), al: String(w.al || "").trim().slice(0, 80), ar: String(w.ar || "").trim().slice(0, 80),
        u: /^https:\/\/\S+$/i.test(w.u || "") ? String(w.u).slice(0, 300) : "" };
      if (Array.isArray(w.matchAliases)) {
        const aliases = [...new Set(w.matchAliases.filter(a => typeof a === "string").map(a => a.trim().slice(0, 120)).filter(Boolean))].slice(0, 8);
        if (aliases.length) out.matchAliases = aliases;
      }
      return out;
    }),   /* 🛒 未入手の欲しい曲 */
    guide: (raw.guide && typeof raw.guide === "object") ? { note: String(raw.guide.note || "").trim().slice(0, 80),
      url: /^https:\/\/\S+$/i.test(raw.guide.url || "") ? String(raw.guide.url).slice(0, 300) : "" } : null,
    cat: typeof raw.cat === "string" && /^[a-z0-9:-]{1,40}$/i.test(raw.cat) ? raw.cat : "",
    by: typeof raw.by === "string" ? raw.by.trim().slice(0, 24) : "",   /* 👤 投稿者（共有プレイリスト由来） */
    createdAt: (typeof raw.createdAt === "number" && raw.createdAt > 0 && raw.createdAt < 9e15) ? raw.createdAt : 0 };
}
const TRK_PLAYLIST_ID = "trk-playlist";
const TRK_FOLDER_ID = "trk";
const TRK_CLASSIC_ID = "trk-classic";
/* 🐔 trk's playlist ＝ 右端のタブ（実体は trk フォルダ）。
   ・名前（タブの文字）は settings.trkTabName の3種類から選ぶ。空文字＝🐔 のアイコンだけ
   ・アイコン（🐔）と色（標準）とフォルダ名は固定＝利用者は変えられない（plFolderMenu も開かせない）
   ・長押しはプロフィール編集ではなく「階層（Vol 一覧）を開く」に固定する（plTrkMenu） */
const TRK_TAB_ICON = "🐔";
const TRK_FOLDER_NAME = "trk's playlist";
/* 許可リストは core.js の TRK_ENUM_VALUES.trkTabName（設定Importでも同じものを使う） */
const TRK_TAB_NAME_MODES = (typeof TRK_ENUM_VALUES === "object" && TRK_ENUM_VALUES && Array.isArray(TRK_ENUM_VALUES.trkTabName))
  ? TRK_ENUM_VALUES.trkTabName : ["full", "short", "icon"];
function trkNameMode() {
  const v = settings.trkTabName;
  return (v === "short" || v === "icon") ? v : "full";
}
function trkTabLabel() {   /* タブに出す文字（"icon" のときは空＝アイコンだけ） */
  const m = trkNameMode();
  if (m === "icon") return "";
  try { return tr(m === "short" ? "trkTabNameShort" : "trkTabNameFull"); } catch (_) { return m === "short" ? "trk's" : TRK_FOLDER_NAME; }
}
function trkCatalog() {   /* 🛒 カタログ本体（catalog.js の const。⚠ window には載らないので、素の名前で読む） */
  try { return (typeof TRK_CATALOG !== "undefined" && Array.isArray(TRK_CATALOG)) ? TRK_CATALOG : []; } catch (_) { return []; }
}
function trkFolderNormalize() {   /* 保存データ側も固定名・固定アイコン・色なしにそろえる（旧名の 🐔 二重表示も直る） */
  const f = settings.plFolders.find(x => x.id === TRK_FOLDER_ID);
  if (!f) return null;
  let ch = false;
  if (f.name !== TRK_FOLDER_NAME) { f.name = TRK_FOLDER_NAME; ch = true; }
  if (f.icon !== TRK_TAB_ICON) { f.icon = TRK_TAB_ICON; ch = true; }
  if (f.color !== "none") { f.color = "none"; ch = true; }
  if (f.parent) { f.parent = ""; ch = true; }
  if (ch) saveUserPrefs();
  return f;
}
function ensureTrkSubfolder(id, name, icon) {
  let f = settings.plFolders.find(x => x.id === id);
  if (f) return f;
  f = plFolderSanitize({ id, name, icon, color: "none", parent: TRK_FOLDER_ID });
  if (!f) return null;
  settings.plFolders.push(f);
  saveUserPrefs();
  return f;
}
function ensureTrkFolder() {
  let f = settings.plFolders.find(x => x.id === TRK_FOLDER_ID);
  if (!f) {
    f = plFolderSanitize({ id: TRK_FOLDER_ID, name: TRK_FOLDER_NAME, icon: TRK_TAB_ICON, color: "none", parent: "" });
    if (f) { settings.plFolders.push(f); saveUserPrefs(); }
  }
  ensureTrkSubfolder("trk-classic", "Classic", "🎻");
  ensureTrkSubfolder("trk-ba", "Blue Archive", "🎮");
  ensureTrkSubfolder("trk-lol", "League of Legends", "⚔️");
  ensureTrkSubfolder("trk-touhou", "Touhou", "⛩️");
  ensureTrkSubfolder("trk-arknights", "Arknights", "🎮");
  ensureTrkSubfolder("trk-gakumas", "Gakum@s", "🎤");
  ensureTrkSubfolder("trk-endfield", "Endfield", "🛰️");
  trkFolderNormalize();   /* 旧データの「🐔 trk's playlist」もここで固定名に直す */
  return settings.plFolders.find(x => x.id === TRK_FOLDER_ID) || f || null;
}
function trkWishFromTrack(tt) {
  const cleanText = (value, limit) => typeof value === "string" ? value.trim().slice(0, limit) : "";
  const rawUrl = typeof tt.u === "string" ? tt.u : "";
  const wish = { t: cleanText(tt.t, 120), al: cleanText(tt.al, 80), ar: cleanText(tt.ar, 80),
    u: /^https:\/\/\S+$/i.test(rawUrl) ? rawUrl.slice(0, 300) : "" };
  if (Array.isArray(tt.matchAliases)) {
    const aliases = [...new Set(tt.matchAliases.filter(alias => typeof alias === "string")
      .map(alias => alias.trim().slice(0, 120)).filter(Boolean))].slice(0, 8);
    if (aliases.length) wish.matchAliases = aliases;
  }
  return wish;
}
function trkWishesFromCatalog() {
  const cat = trkCatalog();
  const out = [];
  for (const s of cat) {
    if (s.id === "classical") continue; // 🎻 classicは別枠 trk classicへ
    for (const pl of (s.playlists || [])) {
      for (const tt of (pl.songs || [])) {
        out.push(trkWishFromTrack(tt));
        if (out.length >= 100) return out;
      }
      if (out.length >= 100) return out;
    }
    if (out.length >= 100) return out;
  }
  return out;
}
function trkClassicWishesFromCatalog() {
  const cat = trkCatalog();
  const out = [];
  for (const s of cat) {
    if (s.id !== "classical") continue;
    for (const pl of (s.playlists || [])) {
      for (const tt of (pl.songs || [])) {
        out.push(trkWishFromTrack(tt));
        if (out.length >= 100) return out;
      }
      if (out.length >= 100) return out;
    }
    if (out.length >= 100) return out;
  }
  return out;
}
function ensureTrkPlaylist(opts) {
  const o = opts || {};
  const doToast = o.toast !== false;
  const go = !!o.go;
  if (settings.trkPlaylist === false) return false;
  if (settings.playlists.some(function(p){ return p.id === TRK_PLAYLIST_ID; })) return false;
  ensureTrkFolder();
  const wishes = trkWishesFromCatalog();
  if (!wishes.length) return false;
  const p = plSanitize({ id: TRK_PLAYLIST_ID, name: "Game Vol.1", icon: "\uD83D\uDC14", color: "none", folder: TRK_FOLDER_ID, tags: ["Game","Vol.1"], wish: wishes, songs: [], guide: { note: "\u975E\u55B6\u5229\u306E\u7D39\u4ECB\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8\u3002\u97F3\u6E90\u306F\u540C\u68B1\u3057\u307E\u305B\u3093\u3002\u516C\u5F0F\u306E\u5165\u624B\u5148\u304B\u3089\u3069\u3046\u305E\u3002", url: "https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk" }, cat: "trk:all", createdAt: Date.now() });
  if (!p) return false;
  settings.playlists.push(p);
  saveUserPrefs();
  if (doToast) try { plToast(tr("trkAdded", { n: wishes.length })); } catch(_){}
  if (go) { settings.libTab = "pl:" + TRK_PLAYLIST_ID; saveUserPrefs(); try { renderLib(); } catch(_){} }
  return true;
}
function ensureTrkClassicPlaylist(opts) {
  const o = opts || {};
  const doToast = o.toast !== false;
  const go = !!o.go;
  if (settings.trkClassic === false) return false;
  if (settings.playlists.some(function(p){ return p.id === TRK_CLASSIC_ID; })) return false;
  ensureTrkFolder();
  const wishes = trkClassicWishesFromCatalog();
  if (!wishes.length) return false;
  const p = plSanitize({ id: TRK_CLASSIC_ID, name: "Classic Vol.1", icon: "\uD83C\uDFBB", color: "none", folder: "trk-classic", tags: ["Classic","Vol.1"], wish: wishes, songs: [], guide: { note: "\u7248\u6A29\u5207\u308C\u306E\u540D\u6F14\u3092Musopen\u306E\u516C\u958B\u9332\u97F3\u3067\u7D39\u4ECB\u3002\u97F3\u6E90\u306F\u540C\u68B1\u3057\u307E\u305B\u3093\u3002", url: "https://musopen.org/" }, cat: "trk:classic", createdAt: Date.now() });
  if (!p) return false;
  settings.playlists.push(p);
  saveUserPrefs();
  if (doToast) try { plToast(tr("trkClassicAdded", { n: wishes.length })); } catch(_){}
  if (go) { settings.libTab = "pl:" + TRK_CLASSIC_ID; saveUserPrefs(); try { renderLib(); } catch(_){} }
  return true;
}
window.TrkEnsureTrkPlaylist = ensureTrkPlaylist;
window.TrkTrkPlaylistId = TRK_PLAYLIST_ID;
window.TrkEnsureTrkClassicPlaylist = ensureTrkClassicPlaylist;
window.TrkClassicId = TRK_CLASSIC_ID;
function trkOrderedPlaylists(list) {
  if (settings.trkSortABC) return list.slice().sort((a,b) => a.name.localeCompare(b.name, 'ja'));
  const order = settings.playlistOrder || [];
  if (!order.length) return list.slice().sort((a,b) => (a.createdAt||0)-(b.createdAt||0));
  const idx = new Map(order.map((id,i)=>[id,i]));
  return list.slice().sort((a,b) => {
    const ai = idx.has(a.id) ? idx.get(a.id) : 1e9;
    const bi = idx.has(b.id) ? idx.get(b.id) : 1e9;
    if (ai !== bi) return ai - bi;
    return (a.createdAt||0)-(b.createdAt||0);
  });
}
function trkMovePlaylist(id, dir) {
  let order = (settings.playlistOrder||[]).slice();
  const inTrk = trkFolderIdSet();
  const ids = trkOrderedPlaylists(settings.playlists.filter(p => inTrk.has(p.folder))).map(p=>p.id);
  // ensure order contains all ids
  for (const pid of ids) if (!order.includes(pid)) order.push(pid);
  const i = order.indexOf(id);
  if (i < 0) return;
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  settings.playlistOrder = order.slice(0,200);
  saveUserPrefs();
  renderLib();
  try { if (typeof renderTrkSettings === "function") renderTrkSettings(); } catch(_){}
}
window.ensureTrkDistributionPlaylists = ensureTrkDistributionPlaylists;

function trkWishesForSeries(seriesId) {
  const cat = trkCatalog();
  const out = [];
  for (const s of cat) {
    if (s.id !== seriesId) continue;
    for (const pl of (s.playlists || [])) {
      for (const tt of (pl.songs || [])) {
        out.push(trkWishFromTrack(tt));
      }
    }
  }
  return out;
}
function trkCatalogGuide(s, pl, forDistributionPlaylist = false) {
  const isBlueArchiveOst = s.id === "bluearchive" && pl && pl.sourceUrl;
  const isSoundCloudAlbum = s.id === "lol" && pl && pl.sourceUrl && pl.sourceLabel === "SoundCloud";
  const isLoLLinkList = s.id === "lol" && pl && !isSoundCloudAlbum;
  const isGakumasInstrument = s.id === "gakumas" && pl && (pl.id === "gm-inst" || pl.id === "gm-inst2");
  const isGakumasDiscography = s.id === "gakumas" && pl && pl.id === "gm-releases";
  const loLLinkNote = "公式リンク集。配信・購入は二次利用許諾ではありません。Creator-Safeの対象と条件を要確認。";
  const note = isBlueArchiveOst
    ? "NexTone.Link／Apple Music公式案内。音源なし。購入・サブスクは利用許諾ではありません。"
    : isSoundCloudAlbum
      ? "公式SoundCloudアルバム（音源なし）。配信・購入は二次利用許諾ではありません。Creator-Safeの条件を確認。"
      : isLoLLinkList
        ? loLLinkNote
        : isGakumasInstrument
          ? "公式Driveで配布確認済み。DOWNLOAD規約はファン動画向けの限定条件で、全用途の許諾ではありません。"
          : isGakumasDiscography
            ? "公式ディスコグラフィ掲載曲。現行Driveで未確認の曲も含みます（配布不可の断定ではありません）。"
            : s.id === "valorant"
              ? "公式曲リンク集。配信・購入は二次利用許諾ではありません。Creator-Safeの対象と条件を要確認。"
              : s.id === "genshin"
                ? "Apple Music公式配信への案内です。サブスク・購入は二次利用許諾ではありません。"
                : s.id === "oj" || s.id === "samfree"
                  ? "公式ゲーム案内のみ。個別曲の公式配信先・使用許諾は未確認です。"
                  : s.id === "arknights"
                    ? "Monster-Siren公式の曲／OSTページです。音源は同梱せず、リンクは利用許諾ではありません。"
                    : forDistributionPlaylist
                      ? "\u975E\u55B6\u5229\u306E\u7D39\u4ECB\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8。" + s.name + " の配布形態別フォルダに収容。"
                      : (s.note || "");
  /* GakumasはDrive置場と規約ページを分離。VALORANTの設定ガイドはCreator-Safeへ直接案内。 */
  const guideUrl = (s.id === "gakumas" || s.id === "valorant")
    ? (s.url || "")
    : (pl && pl.sourceUrl) || s.url || "https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk";
  return { note, url: guideUrl };
}
function ensureTrkDistributionPlaylists() {
  ensureTrkFolder();
  const cat = trkCatalog();
  const folderMap = { bluearchive: "trk-ba", lol: "trk-lol", touhou: "trk-touhou", arknights: "trk-arknights", gakumas: "trk-gakumas", endfield: "trk-endfield" };
  let changed = false;
  for (const s of cat) {
    /* Only these series are auto-created under trk. Manually imported catalog entries
       from all other series still get safe metadata refreshes below. */
    const folder = folderMap[s.id] || "";
    for (const pl of (s.playlists || [])) {
      const baseId = "trk-" + pl.id;
      const wishes = (pl.songs || []).map(trkWishFromTrack);
      const sourceCats = new Set([s.id + ":" + pl.id, "trk:" + s.id + ":" + pl.id]);
      const guide = trkCatalogGuide(s, pl);
      /* Refresh catalog-owned wish/guide fields only. Never replace owned songs or
         user-edited name, icon, or tags. */
      for (const imported of settings.playlists) {
        if (!sourceCats.has(imported.cat)) continue;
        if (JSON.stringify(imported.wish) !== JSON.stringify(wishes)) { imported.wish = wishes; changed = true; }
        if (JSON.stringify(imported.guide || null) !== JSON.stringify(guide)) { imported.guide = guide; changed = true; }
        if (s.id === "lol" && pl.id === "lol-svi" && imported.name === "Sessions: Vi 厳選") { imported.name = pl.name; changed = true; }
        if (s.id === "valorant" && pl.id === "val-themes" && imported.name === "VALORANT テーマ厳選") { imported.name = pl.name; changed = true; }
        if (s.id === "gakumas" && pl.id === "gm-inst" && imported.name === "学マス インスト厳選 — キャラ別 Vol.1") { imported.name = pl.name; changed = true; }
        if (s.id === "gakumas" && pl.id === "gm-inst2" && imported.name === "学マス インスト厳選 — キャラ別 Vol.2") { imported.name = pl.name; changed = true; }
      }
      const existing = settings.playlists.find(p => p.id === baseId);
      if (existing) {
        /* 🛤️ Lone Trail の旧3曲版を、同じ公式カタログ項目の10曲版へ更新する。
           cat が一致する公式項目だけ更新し、所持曲・名前・アイコン・タグのユーザー変更は守る。 */
        if (pl.id === "ak-lonetrail" && existing.cat === "trk:" + s.id + ":" + pl.id) {
          if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }
          if (existing.name === "アークナイツ — Lone Trail") { existing.name = pl.name; changed = true; }
          if (existing.icon === "🛤️") { existing.icon = pl.icon || s.icon; changed = true; }
          if (JSON.stringify(existing.tags) === JSON.stringify(["Game","Arknights","MSR","Lone Trail"])) {
            existing.tags = (pl.tags || []).slice(0,5); changed = true;
          }
        }
        /* 🌋 So Long, Adele の旧3曲紹介版を、公式OST全9曲へ更新する。 */
        if (pl.id === "ak-solongadele" && existing.cat === "trk:" + s.id + ":" + pl.id) {
          if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }
        }
        /* 🩹 旧カタログの「痕」は、永続IDを保ったまま「墟」へ更新する。 */
        if (pl.id === "ak-hen" && existing.cat === "trk:" + s.id + ":" + pl.id) {
          if (JSON.stringify(existing.wish) !== JSON.stringify(wishes)) { existing.wish = wishes; changed = true; }
          if (existing.name === "アークナイツ — 痕") { existing.name = pl.name; changed = true; }
          if (existing.icon === "🩹") { existing.icon = pl.icon || s.icon; changed = true; }
          if (JSON.stringify(existing.tags) === JSON.stringify(["Game","Arknights","MSR","痕"])) {
            existing.tags = (pl.tags || []).slice(0,5); changed = true;
          }
        }
        continue;
      }
      if (!folder || !wishes.length) continue;
      // respect 100 limit per Vol, split if needed into Vol.1 / Vol.2 etc.
      const total = wishes.length;
      const vols = Math.ceil(total / 100) || 1;
      for (let v = 0; v < vols; v++) {
        const vid = vols === 1 ? baseId : baseId + "-v" + (v+1);
        if (settings.playlists.some(p => p.id === vid)) continue;
        const slice = wishes.slice(v*100, (v+1)*100);
        const vTag = vols === 1 ? [] : ["Vol."+(v+1)];
        const vName = vols === 1 ? pl.name : pl.name + " Vol." + (v+1);
        const p = plSanitize({ id: vid, name: vName, icon: pl.icon || s.icon, color: pl.color || s.color, folder, tags: (pl.tags || []).concat(vTag).slice(0,5), wish: slice, songs: [], guide: trkCatalogGuide(s, pl, true), cat: "trk:" + s.id + ":" + pl.id, createdAt: Date.now() + v });
        if (p) { settings.playlists.push(p); changed = true; }
      }
    }
  }
  /* Migrate the previous one-list Gakumas import to the current catalog without replacing
     its owned songs, custom name/icon/tags or playlist identity. */
  const gakumas = cat.find(s => s.id === "gakumas");
  const legacyGakumas = settings.playlists.find(p => p.id === "trk-gakumas-v1" && p.cat === "trk:gakumas");
  if (gakumas && legacyGakumas) {
    const wishes = trkWishesForSeries("gakumas").slice(0, 100);
    const guide = { note: "DOWNLOAD規約はファン動画向け限定。全用途の許諾ではありません。Drive未掲載は配布不可の証明ではありません。", url: gakumas.url };
    if (JSON.stringify(legacyGakumas.wish) !== JSON.stringify(wishes)) { legacyGakumas.wish = wishes; changed = true; }
    if (JSON.stringify(legacyGakumas.guide || null) !== JSON.stringify(guide)) { legacyGakumas.guide = guide; changed = true; }
  }
  // legacy: ensure old 4 generic still migrate if missing (for existing users)
  const legacy = [
    { id: "trk-ba-v1", folder: "trk-ba", series: "bluearchive" },
    { id: "trk-touhou-v1", folder: "trk-touhou", series: "touhou" },
    { id: "trk-arknights-v1", folder: "trk-arknights", series: "arknights" },
    { id: "trk-gakumas-v1", folder: "trk-gakumas", series: "gakumas" },
  ];
  for (const d of legacy) {
    if (settings.playlists.some(p => p.id === d.id)) continue;
    const s = cat.find(x=> x.id===d.series);
    if (!s) continue;
    // if new per-PL already cover, skip legacy creation
    if (s.playlists && s.playlists.some(pl=> settings.playlists.some(p=> p.id==="trk-"+pl.id))) continue;
    const wishesAll = trkWishesForSeries(d.series);
    if (!wishesAll.length) continue;
    const slice = wishesAll.slice(0,100);
    const p = plSanitize({ id: d.id, name: s.name + " Vol.1", icon: s.icon, color: s.color, folder: d.folder, tags: ["Game", s.name, "Vol.1"], wish: slice, songs: [], guide: { note: "\u975E\u55B6\u5229\u306E\u7D39\u4ECB\u30D7\u30EC\u30A4\u30EA\u30B9\u30C8。", url: s.url || "https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk" }, cat: "trk:" + d.series, createdAt: Date.now() });
    if (p) { settings.playlists.push(p); changed = true; }
  }
  if (changed) saveUserPrefs();
}
(function plTighten() {
  settings.playlists = (settings.playlists || []).map(plSanitize).filter(Boolean).slice(0, 100);
  settings.plFolders = (settings.plFolders || []).map(plFolderSanitize).filter(Boolean).slice(0, 12);
  const fids = new Set(settings.plFolders.map(f => f.id));
  for (const p of settings.playlists) if (p.folder && !fids.has(p.folder)) p.folder = "";
  for (const f of settings.plFolders) if (f.parent && (!fids.has(f.parent) || f.parent === f.id)) f.parent = "";
  for (const f of settings.plFolders) if (plIsDescendantFolder(f.id, f.id)) f.parent = "";   /* 循環を断つ */
  try { trkFolderNormalize(); } catch (_) {}   /* 🐔 名前・アイコン・色は固定（旧データもここでそろう） */
})();

function plById(id) { return settings.playlists.find(p => p.id === id) || null; }
function plIcon(p) { if (p.icon) return p.icon; if (p.frozen && p.locked) return "🧩"; if (p.frozen) return "🧊"; if (p.locked) return "🔒"; return "🎧"; }
function plCount(p, keySet) { let n = 0; for (const k of p.songs) if (keySet.has(k)) n++; return n; }

let plToastTimer = 0, plDragKey = "";
function plToast(msg) {
  let t = document.querySelector(".plToast");
  if (!t) { t = el("div", "plToast"); document.body.append(t); }
  t.textContent = msg; t.classList.add("on");
  clearTimeout(plToastTimer);
  plToastTimer = setTimeout(() => t.classList.remove("on"), 2400);
}

/* 長押し（PCのマウス押しっぱなし ＋ スマホ）。開いたあとの click は1回だけ止める */
let plSuppressUntil = 0, plLastPointer = "mouse";
function plSuppressClick() { return Date.now() < plSuppressUntil; }
function onLongPress(elm, open) {
  let t = 0, sx = 0, sy = 0;
  elm.addEventListener("pointerdown", e => {
    plLastPointer = e.pointerType || "mouse";
    if (e.pointerType === "mouse" && e.button !== 0) return;
    sx = e.clientX; sy = e.clientY;
    clearTimeout(t);
    t = setTimeout(() => { t = 0; plSuppressUntil = Date.now() + 700; open(); }, 480);
  });
  const cancel = () => { clearTimeout(t); t = 0; };
  elm.addEventListener("pointerup", cancel);
  elm.addEventListener("pointercancel", cancel);
  elm.addEventListener("pointermove", e => { if (t && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) cancel(); });
  elm.addEventListener("contextmenu", e => { if (plLastPointer === "touch") e.preventDefault(); });   /* スマホ長押しのメニュー防止 */
}

/* 中央に出す小さいダイアログ（プレイリスト設定・曲プロフィールで使う） */
function plDialog(title) {
  document.querySelectorAll(".plOverlay").forEach(x => x.remove());
  const ov = el("div", "plOverlay"), card = el("div", "plCard");
  const esc = e => { if (e.key === "Escape") close(); };
  const close = () => { document.removeEventListener("keydown", esc); ov.remove(); };
  document.addEventListener("keydown", esc);
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
  card.append(el("b", "plCardTitle", title));
  ov.append(card); document.body.append(ov);
  return { card, close };
}
function plRow(labelText, node) { const r = el("label", "plRow"); r.append(el("span", "plRowLabel", labelText), node); return r; }

/* 色の見本（クリックで選ぶ。box.value に選んだキーが入る） */
function plColorSwatches(initial) {
  const box = el("div", "plSwatches");
  box.value = PL_COLORS[initial] != null ? initial : "none";
  for (const [key, hex] of Object.entries(PL_COLORS)) {
    const s = el("button", "plSwatch" + (key === box.value ? " on" : "")); s.type = "button";
    s.title = key === "none" ? tr("plColorNone") : key;
    if (hex) s.style.background = hex; else s.textContent = "✕";
    s.addEventListener("click", () => {
      box.value = key;
      box.querySelectorAll(".plSwatch").forEach(x => x.classList.remove("on"));
      s.classList.add("on");
    });
    box.append(s);
  }
  return box;
}

/* 📁 新規プレイリスト */
function plCreate() {
  const d = plDialog(tr("plNewTab"));
  const name = el("input", "plInput"); name.type = "text"; name.maxLength = 24; name.value = tr("plDefaultName", { n: settings.playlists.length + 1 });
  const icon = el("input", "plInput"); icon.type = "text"; icon.maxLength = 4; icon.placeholder = tr("plIconPh");
  const color = plColorSwatches("none");
  const save = el("button", "plBtn", tr("plSave")); save.type = "button";
  save.addEventListener("click", () => {
    const p = plSanitize({ id: "pl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.value || tr("plDefaultName", { n: settings.playlists.length + 1 }), icon: icon.value, color: color.value, frozen: false, locked: false, folder: plFolderContext(), createdAt: Date.now(), songs: [] });
    settings.playlists.push(p); saveUserPrefs();
    settings.libTab = "pl:" + p.id;
    d.close(); renderLib();
    plToast(tr("plCreated", { name: p.name }));
  });
  d.card.append(plRow(tr("plName"), name), plRow(tr("plIcon"), icon), plRow(tr("plColor"), color), save);
  name.focus(); name.select();
}

/* プレイリスト1つの設定（タブの長押しで開く） */
function plMenu(p) {
  const d = plDialog(tr("plSettings") + "：" + p.name);
  const name = el("input", "plInput"); name.type = "text"; name.maxLength = 24; name.value = p.name;
  const icon = el("input", "plInput"); icon.type = "text"; icon.maxLength = 4; icon.value = p.icon; icon.placeholder = tr("plIconPh");
  const color = plColorSwatches(p.color);
  const fldSel = el("select", "plInput");
  fldSel.append(new Option(tr("plFolderRoot"), ""));
  for (const f of settings.plFolders) fldSel.append(new Option("　".repeat(plDepthOfFolder(f.id)) + (f.icon || "📁") + " " + f.name, f.id));
  fldSel.value = p.folder && settings.plFolders.some(f => f.id === p.folder) ? p.folder : "";
  const tags = el("input", "plInput"); tags.type = "text"; tags.maxLength = 80; tags.value = (p.tags || []).join(" "); tags.placeholder = tr("plTagsPh");
  const fz = el("input"); fz.type = "checkbox"; fz.checked = !!p.frozen;
  const lk = el("input"); lk.type = "checkbox"; lk.checked = !!p.locked;
  const save = el("button", "plBtn", tr("plSave")); save.type = "button";
  save.addEventListener("click", () => {
    const t = plSanitize({ id: p.id, name: name.value || p.name, icon: icon.value, color: color.value, frozen: fz.checked, locked: lk.checked,
      songs: p.songs, wish: p.wish, guide: p.guide, cat: p.cat, by: p.by, createdAt: p.createdAt,
      folder: fldSel.value, tags: tags.value.split(/[\s、，,]+/).map(x => x.trim().slice(0, 16)).filter(Boolean).slice(0, 5) });
    if (t) Object.assign(p, t);   /* 同じオブジェクトを直す（タブのIDは不変） */
    saveUserPrefs(); d.close(); renderLib();
  });
  const share = el("button", "plBtn", tr("plShare")); share.type = "button";
  share.addEventListener("click", () => { d.close(); plShare(p); });
  const del = el("button", "plBtnDanger", tr("plDelete")); del.type = "button";
  del.disabled = !!p.locked; del.title = p.locked ? tr("plLockedNo") : "";
  del.addEventListener("click", () => plDelete(p, d.close));
  lk.addEventListener("change", () => { del.disabled = lk.checked; del.title = lk.checked ? tr("plLockedNo") : ""; });
  if (p.guide && (p.guide.note || p.guide.url)) {   /* 🛒 公式カタログから取り込んだ入手先 */
    d.card.append(el("div", "plSep"), el("b", "plCardTitle", tr("plGuideTitle")));
    if (p.guide.note) d.card.append(el("div", "plHint", "📄 " + p.guide.note));
    if (p.guide.url) {
      const gb = el("button", "plBtn", tr("plLinkOpen")); gb.type = "button";
      gb.addEventListener("click", () => plOpenLink(p.guide.url));
      d.card.append(gb);
    }
  }
  d.card.append(plRow(tr("plName"), name), plRow(tr("plIcon"), icon), plRow(tr("plColor"), color),
    plRow(tr("plFolderOf"), fldSel), plRow(tr("plTags"), tags),
    plRow(tr("plFrozenCheck"), fz), plRow(tr("plLockedCheck"), lk),
    el("div", "plHint", tr("plSongsNow", { n: p.songs.length })),
    save, share, del);
  name.focus(); name.select();
}

/* 📁 フォルダの新規作成 */
function plFolderCreate(defaultParent = "") {
  const d = plDialog(tr("plNewFolder"));
  const name = el("input", "plInput"); name.type = "text"; name.maxLength = 24; name.value = tr("plDefaultFolderName");
  const icon = el("input", "plInput"); icon.type = "text"; icon.maxLength = 4; icon.placeholder = tr("plIconPh");
  const color = plColorSwatches("none");
  const save = el("button", "plBtn", tr("plSave")); save.type = "button";
  save.addEventListener("click", () => {
    const f = plFolderSanitize({ id: "fl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: name.value || tr("plDefaultFolderName"), icon: icon.value, color: color.value,
      parent: plFolderById(defaultParent) ? defaultParent : "", createdAt: Date.now() });
    settings.plFolders.push(f); saveUserPrefs();
    d.close(); renderLib();
    plToast(tr("plFolderCreated", { name: f.name }));
  });
  d.card.append(plRow(tr("plName"), name), plRow(tr("plIcon"), icon), plRow(tr("plColor"), color), save);
  name.focus(); name.select();
}

/* 📁 フォルダの設定（フォルダタブの長押し） */
function plFolderMenu(f) {
  /* 🐔 trk's playlist 自体は名前・アイコン・色が固定。フォルダ設定は出さず、階層（Vol 一覧）を開く */
  if (f && f.id === TRK_FOLDER_ID) { plTrkMenu(); return; }
  const d = plDialog(tr("plFolderSettings") + "：" + f.name);
  const name = el("input", "plInput"); name.type = "text"; name.maxLength = 24; name.value = f.name;
  const icon = el("input", "plInput"); icon.type = "text"; icon.maxLength = 4; icon.value = f.icon; icon.placeholder = tr("plIconPh");
  const color = plColorSwatches(f.color);
  const parent = el("select", "plInput");
  parent.append(new Option(tr("plFolderRoot"), ""));
  for (const x of settings.plFolders) {
    if (x.id === f.id || plIsDescendantFolder(x.id, f.id) || plDepthOfFolder(x.id) >= 3) continue;   /* 自分と子孫・深すぎは選べない */
    parent.append(new Option("　".repeat(plDepthOfFolder(x.id)) + (x.icon || "📁") + " " + x.name, x.id));
  }
  parent.value = f.parent && settings.plFolders.some(x => x.id === f.parent) ? f.parent : "";
  const save = el("button", "plBtn", tr("plSave")); save.type = "button";
  save.addEventListener("click", () => {
    const t = plFolderSanitize({ id: f.id, name: name.value || f.name, icon: icon.value, color: color.value, parent: parent.value, createdAt: f.createdAt });
    if (t) Object.assign(f, t);
    saveUserPrefs(); d.close(); renderLib();
  });
  const del = el("button", "plBtnDanger", tr("plFolderDel")); del.type = "button";
  del.addEventListener("click", () => plFolderDelete(f, d.close));
  d.card.append(plRow(tr("plName"), name), plRow(tr("plIcon"), icon), plRow(tr("plColor"), color),
    plRow(tr("plFolderOf"), parent), save, del);
  // 🐔 trk folder special: show inner playlists (Game Vol.1, Classic Vol.1, BlueArchive etc.) for quick open
  if (f.id === TRK_FOLDER_ID || f.id === "trk-classic" || f.id === "trk-ba" || f.id === "trk-touhou" || f.id === "trk-arknights" || f.id === "trk-gakumas" || f.id === "trk-endfield") {
    const innerIds = f.id === TRK_FOLDER_ID ? [TRK_FOLDER_ID, "trk-classic", "trk-ba", "trk-touhou", "trk-arknights", "trk-gakumas", "trk-endfield"] : [f.id];
    const allInner = settings.playlists.filter(p => innerIds.includes(p.folder) || (f.id===TRK_FOLDER_ID && settings.plFolders.some(ff=> innerIds.includes(ff.id) && ff.id===p.folder)) );
    if (allInner.length) {
      d.card.append(el("div", "plSep"));
      d.card.append(el("b", "plCardTitle", tr("plFolderContents") || "中のプレイリスト"));
      const ordered = trkOrderedPlaylists(allInner);
      for (const p of ordered) {
        const row = el("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;margin:4px 0;flex-wrap:wrap";
        const open = el("button", "plBtn", (p.icon||"🎧")+" "+p.name+" ("+plCount(p, new Set((window.__libAll||[]).map(x=>x.key)))+")"); open.type="button";
        open.addEventListener("click", () => { d.close(); settings.libTab="pl:"+p.id; renderLib(); });
        const up = el("button", "plBtn small", "↑"); up.type="button"; up.title="上へ";
        const down = el("button", "plBtn small", "↓"); down.type="button"; down.title="下へ";
        if (settings.trkSortABC) { up.disabled=true; down.disabled=true; up.style.opacity=".45"; down.style.opacity=".45"; }
        up.addEventListener("click", () => trkMovePlaylist(p.id, -1));
        down.addEventListener("click", () => trkMovePlaylist(p.id, 1));
        row.append(open, up, down);
        d.card.append(row);
      }
      if (settings.trkSortABC) d.card.append(el("div", "plHint", "🔤 ABC順がオンのため、手動並べ替えは無効です。設定でオフにしてください。"));
    }
  }
  name.focus(); name.select();
}

/* 🐔 trk's playlist の階層（タブの長押しで開く）
   ・長押しの動作を「プロフィールを弄る」から「階層（Vol 一覧）を開く」へ固定するための画面
   ・名前と色は固定なので、ここには編集欄を出さない（plFolderMenu も trk フォルダでは開かせない）
   ・各 Vol は 開く／↑↓（自由並べ替え）／⚙（そのプレイリストの設定） */
function plTrkMenu() {
  trkFolderNormalize();
  const d = plDialog(tr("trkMenuTitle"));
  d.card.append(el("div", "plHint", tr("trkMenuHint")));
  const keys = (libAllKeys instanceof Set) ? libAllKeys : new Set();
  const listBox = el("div", "plTrkList");
  const rowOf = p => {
    const row = el("div", "plTrkRow");
    const open = el("button", "plBtn", (p.icon || "🎧") + " " + p.name + "（" + plCount(p, keys) + "）"); open.type = "button";
    open.addEventListener("click", () => { d.close(); settings.libTab = "pl:" + p.id; saveUserPrefs(); renderLib(); });
    const up = el("button", "plBtn small", "↑"); up.type = "button"; up.title = tr("trkMoveUp"); up.setAttribute("aria-label", tr("trkMoveUp") + " " + p.name);
    const down = el("button", "plBtn small", "↓"); down.type = "button"; down.title = tr("trkMoveDown"); down.setAttribute("aria-label", tr("trkMoveDown") + " " + p.name);
    if (settings.trkSortABC) { up.disabled = true; down.disabled = true; up.style.opacity = ".45"; down.style.opacity = ".45"; }
    up.addEventListener("click", () => { trkMovePlaylist(p.id, -1); paint(); });
    down.addEventListener("click", () => { trkMovePlaylist(p.id, 1); paint(); });
    const gear = el("button", "plBtn small", "⚙"); gear.type = "button"; gear.title = tr("plSettings"); gear.setAttribute("aria-label", tr("plSettings") + " " + p.name);
    gear.addEventListener("click", () => plMenu(p));   /* plDialog が古いダイアログを閉じるので、そのまま開き替える */
    row.append(open, up, down, gear);
    return row;
  };
  const groupHead = f => {
    const head = el("div", "plTrkGroup");
    head.append(el("b", "plCardTitle", (f.icon || "📁") + " " + f.name));
    if (f.id !== TRK_FOLDER_ID) {   /* サブフォルダ（Classic／Blue Archive など）は、その棚を開ける */
      const fo = el("button", "plBtn small", tr("trkMenuOpenFolder")); fo.type = "button";
      fo.addEventListener("click", () => { d.close(); settings.libTab = "fld:" + f.id; saveUserPrefs(); renderLib(); });
      head.append(fo);
    }
    return head;
  };
  const paint = () => {
    listBox.replaceChildren();
    const direct = settings.playlists.filter(p => plVisible(p) && p.folder === TRK_FOLDER_ID);
    const subs = settings.plFolders.filter(f => f.parent === TRK_FOLDER_ID);
    if (!direct.length && !subs.length) { listBox.append(el("div", "plHint", tr("trkOrderEmpty"))); return; }
    if (direct.length) {
      listBox.append(groupHead({ id: TRK_FOLDER_ID, icon: TRK_TAB_ICON, name: trkTabLabel() || tr("trkTabNameFull") }));
      for (const p of trkOrderedPlaylists(direct)) listBox.append(rowOf(p));
    }
    for (const f of subs) {   /* 🎻 Classic など。中の Vol を並べる */
      listBox.append(el("div", "plSep"), groupHead(f));
      for (const p of trkOrderedPlaylists(settings.playlists.filter(p => plVisible(p) && p.folder === f.id))) listBox.append(rowOf(p));
    }
    if (settings.trkSortABC) listBox.append(el("div", "plHint", tr("trkOrderAbcOff")));
  };
  d.card.append(listBox);
  paint();
}

/* 🗑 フォルダの削除（中身は消さない。子は上の階層へ） */
function plFolderDelete(f, onClose) {
  settings.plFolders = settings.plFolders.filter(x => x !== f);
  for (const p of settings.playlists) if (p.folder === f.id) p.folder = f.parent;
  for (const x of settings.plFolders) if (x.parent === f.id) x.parent = f.parent;
  if (settings.libTab === "fld:" + f.id) settings.libTab = f.parent ? "fld:" + f.parent : "all";
  saveUserPrefs();
  if (onClose) onClose();
  renderLib();
  plToast(tr("plFolderDeleted"));
}

/* 🗑 削除（曲はライブラリに残る。🔒中は断る） */
function plDelete(p, onClose) {
  if (p.locked) { plToast(tr("plLockedNo")); return; }
  settings.playlists = settings.playlists.filter(x => x !== p);
  if (settings.libTab === "pl:" + p.id) settings.libTab = "all";
  saveUserPrefs();
  if (onClose) onClose();
  renderLib();
  plToast(tr("plDeleted"));
}

/* 中クリックでの削除（設定で「同じタブ3回」モードにできる） */
let plDelArm = { id: "", n: 0, t: 0 };
function plDeleteGesture(p, btn) {
  if (p.locked) { plToast(tr("plLockedNo")); return; }
  if (settings.playlistDelMode === "three") {
    const now = Date.now();
    if (plDelArm.id !== p.id || now - plDelArm.t > 1600) plDelArm = { id: p.id, n: 0, t: now };
    plDelArm.n++; plDelArm.t = now;
    if (plDelArm.n < 3) {
      btn.classList.add("plArm");
      setTimeout(() => btn.classList.remove("plArm"), 1600);
      plToast(tr("plDelCount", { n: 3 - plDelArm.n }));
      return;
    }
  }
  plDelete(p);
}

/* 📚すべて／自動タブの長押し＝プレイリスト全体の設定 */
/* ---------- 🛒 公式カタログ（音源は同梱しない。公式の入手先を案内するだけ） ---------- */
function plCatalogFolder(s) {   /* シリーズのフォルダ（親カテゴリ → シリーズ。無ければ作る） */
  let parent = settings.plFolders.find(f => !f.parent && f.name === s.catName);
  if (!parent) { parent = plFolderSanitize({ id: "fl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: s.catName, icon: s.catIcon || "🎮", color: "none", parent: "", createdAt: Date.now() }); settings.plFolders.push(parent); }
  let fld = settings.plFolders.find(f => f.parent === parent.id && f.name === s.name);
  if (!fld) { fld = plFolderSanitize({ id: "fl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: s.name, icon: s.icon, color: s.color, parent: parent.id, createdAt: Date.now() }); settings.plFolders.push(fld); }
  return fld.id;
}
function plCatalogMenu() {
  const d = plDialog(tr("plCatalogTitle"));
  d.card.append(el("div", "plHint", tr("plCatalogHint")));
  const cat = trkCatalog();
  if (!cat.length) d.card.append(el("div", "plSep"), el("div", "plHint", tr("plImportBad")));
  for (const s of cat) {
    d.card.append(el("div", "plSep"), el("b", "plCardTitle", `${s.icon} ${s.name}`));
    if (s.note) d.card.append(el("div", "plHint", "📄 " + s.note));
    if (s.url) {
      const b = el("button", "plBtn", tr("plLinkOpen")); b.type = "button";
      b.addEventListener("click", () => plOpenLink(s.url));
      d.card.append(b);
    }
    for (const pl of s.playlists) {
      const row = el("div"); row.style.cssText = "display:flex;gap:8px;align-items:center;margin:4px 0;flex-wrap:wrap";
      const btn = el("button", "plBtn", tr("plCatalogTake", { n: pl.songs.length })); btn.type = "button";
      btn.addEventListener("click", () => { d.close(); plCatalogTake(s, pl); });
      row.append(el("span", "", `${pl.icon} ${pl.name}`));
      if (pl.sourceUrl) {
        const source = el("button", "plBtn", "🔗 " + (pl.sourceLabel || "公式リンク")); source.type = "button";
        source.addEventListener("click", () => plOpenLink(pl.sourceUrl));
        row.append(source);
      }
      row.append(btn);
      d.card.append(row);
    }
  }
}
function plCatalogTake(s, pl) {
  const cat = s.id + ":" + pl.id;
  if (settings.playlists.some(p => p.cat === cat)) { plToast(tr("plCatalogDup", { name: pl.name })); return; }
  const fldId = plCatalogFolder(s);
  const p = plSanitize({ id: "pl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: pl.name, icon: pl.icon, color: pl.color, frozen: false, locked: false, folder: fldId, tags: pl.tags,
    cat, wish: pl.songs, guide: trkCatalogGuide(s, pl), songs: [] });
  p.createdAt = Date.now();
  settings.playlists.push(p); saveUserPrefs();
  settings.libTab = "pl:" + p.id;
  renderLib();
  plToast(tr("plCatalogTaken", { name: p.name }));
}

/* ---------- 👥 投稿者ツール（初期オフ。共有プレイリストをたくさん受け取る人向け） ---------- */
function plVisible(p) {   /* 🚫ブロック中／⭐絞り込み中の投稿者のプレイリストは隠す（自分のには投稿者がない＝隠れない） */
  if (!settings.plAuthorTools || !p || !p.by) return true;
  if (settings.plAuthorBlock.includes(p.by)) return false;
  if (settings.plAuthorOnly && !settings.plAuthorFav.includes(p.by)) return false;
  return true;
}
function plAuthorMenu() {
  const d = plDialog(tr("plAuthorTitle"));
  const search = el("input", "plInput"); search.type = "text"; search.maxLength = 24; search.placeholder = tr("plAuthorSearchPh");
  const only = el("input"); only.type = "checkbox"; only.checked = settings.plAuthorOnly === true;
  only.addEventListener("change", () => { settings.plAuthorOnly = only.checked; saveUserPrefs(); render(); renderLib(); });
  const list = el("div", "plShareList");
  const hint = el("div", "plHint", "");
  const render = () => {
    list.textContent = "";
    const q = search.value.trim().toLowerCase();
    const authors = new Map();
    for (const p of settings.playlists) if (p.by) { if (!authors.has(p.by)) authors.set(p.by, []); authors.get(p.by).push(p); }
    for (const n of settings.plAuthorBlock) if (!authors.has(n)) authors.set(n, []);   /* プレイリストが無くなってもブロック解除できるように */
    const names = [...authors.keys()].filter(n => !q || n.toLowerCase().includes(q)).sort((a, b) => a.localeCompare(b));
    if (!names.length) { list.append(el("div", "libEmpty", tr("plAuthorNone"))); hint.textContent = ""; return; }
    let hidden = 0;
    for (const name of names) {
      const pls = authors.get(name);
      const blocked = settings.plAuthorBlock.includes(name), fav = settings.plAuthorFav.includes(name);
      const row = el("div", "plShareRow" + (blocked ? " miss" : ""));
      row.append(el("b", "", "👤 " + name));
      const fb = el("button", "plLinkMini" + (fav ? " on" : "")); fb.type = "button"; fb.title = tr(fav ? "plAuthorFavDel" : "plAuthorFavAdd"); fb.textContent = fav ? "⭐" : "☆";
      fb.addEventListener("click", () => {
        settings.plAuthorFav = fav ? settings.plAuthorFav.filter(x => x !== name) : [...settings.plAuthorFav, name].slice(0, 100);
        saveUserPrefs(); render(); renderLib();
      });
      const bb = el("button", "plLinkMini" + (blocked ? " on" : "")); bb.type = "button"; bb.title = tr(blocked ? "plAuthorUnblock" : "plAuthorBlock"); bb.textContent = "🚫";
      bb.addEventListener("click", () => {
        settings.plAuthorBlock = blocked ? settings.plAuthorBlock.filter(x => x !== name) : [...settings.plAuthorBlock, name].slice(0, 100);
        saveUserPrefs(); render(); renderLib();
      });
      row.append(fb, bb);
      list.append(row);
      const vis = pls.filter(plVisible);
      hidden += pls.length - vis.length;
      if (vis.length) {
        const chips = el("div", "plAuthorChips");
        for (const p of vis) {
          const c = el("button", "skinChip", `${plIcon(p)} ${p.name}（${p.songs.length}）`); c.type = "button";
          c.addEventListener("click", () => { settings.libTab = "pl:" + p.id; saveUserPrefs(); d.close(); renderLib(); });
          chips.append(c);
        }
        list.append(chips);
      }
    }
    hint.textContent = hidden ? tr("plAuthorHidden", { n: hidden }) : "";
  };
  search.addEventListener("input", render);
  d.card.append(search, plRow(tr("plAuthorOnly"), only), el("div", "plSep"), list, hint);
  render();
}

function plGlobalMenu() {
  const d = plDialog(tr("plGlobalTitle"));
  const make = el("button", "plBtn", tr("plNewTab")); make.type = "button";
  make.addEventListener("click", () => { d.close(); plCreate(); });
  const imp = el("button", "plBtn", tr("plImport")); imp.type = "button";
  imp.addEventListener("click", () => { d.close(); plImportPick(); });
  const mkfld = el("button", "plBtn", tr("plNewFolder")); mkfld.type = "button";
  mkfld.addEventListener("click", () => { d.close(); plFolderCreate(plFolderContext()); });
  // 🐔 trk's playlist と 🛒公式カタログを分け、未取り込みの公式ソースも選べるようにする。
  const trkb = el("button", "plBtn", tr("trkCatalogBtn")); trkb.type = "button";
  trkb.addEventListener("click", () => {
    d.close();
    const created = ensureTrkPlaylist({ toast: true });
    if (!created && settings.playlists.some(function(p){ return p.id === TRK_PLAYLIST_ID; })) {
      // 既にあるならそのタブへ
      settings.libTab = "pl:" + TRK_PLAYLIST_ID; saveUserPrefs(); renderLib();
      plToast(tr("trkDup"));
    } else if (!created) {
      // まだ無くて作れなかった（カタログが無い等）は従来のカタログを表示
      plCatalogMenu();
      return;
    } else {
      settings.libTab = "pl:" + TRK_PLAYLIST_ID; saveUserPrefs(); renderLib();
    }
  });
  const catb = el("button", "plBtn", tr("plCatalogBtn")); catb.type = "button";
  catb.addEventListener("click", () => { d.close(); plCatalogMenu(); });
  const one = el("input"); one.type = "radio"; one.name = "plDelMode"; one.checked = settings.playlistDelMode !== "three";
  const three = el("input"); three.type = "radio"; three.name = "plDelMode"; three.checked = settings.playlistDelMode === "three";
  const saveMode = () => { settings.playlistDelMode = three.checked ? "three" : "one"; saveUserPrefs(); };
  one.addEventListener("change", saveMode); three.addEventListener("change", saveMode);
  /* 👥 投稿者ツール（初期オフ。共有プレイリストをたくさん受け取る人向け。基本のUIに出さない） */
  const at = el("input"); at.type = "checkbox"; at.checked = settings.plAuthorTools === true;
  const an = el("input", "plInput"); an.type = "text"; an.maxLength = 24; an.placeholder = tr("plAuthorNamePh"); an.value = settings.plAuthorName || "";
  an.addEventListener("change", () => { settings.plAuthorName = an.value.trim().slice(0, 24); saveUserPrefs(); });
  const nameRow = plRow(tr("plAuthorBy"), an); nameRow.hidden = !settings.plAuthorTools;
  const abtn = el("button", "plBtn", tr("plAuthorBtn")); abtn.type = "button"; abtn.hidden = !settings.plAuthorTools;
  abtn.addEventListener("click", () => { d.close(); plAuthorMenu(); });
  at.addEventListener("change", () => { settings.plAuthorTools = at.checked; saveUserPrefs(); nameRow.hidden = !at.checked; abtn.hidden = !at.checked; renderLib(); });
  d.card.append(make, imp, mkfld, trkb, catb, el("div", "plSep"),
    plRow(tr("plDelOne"), one), plRow(tr("plDelThree"), three),
    el("div", "plHint", tr("plDelModeHint")),
    el("div", "plSep"), plRow(tr("plAuthorTools"), at), nameRow, abtn);
}

/* 曲の追加・取り外し（🧊フリーズ中は断る） */
function plAddSong(p, key) {
  if (p.frozen) { plToast(tr("plFrozenNo", { name: p.name })); return false; }
  if (p.songs.includes(key)) return true;
  p.songs.push(key); saveUserPrefs();
  plToast(tr("plAdded", { name: p.name }));
  return true;
}
function plRemoveSong(p, key) {
  if (p.frozen) { plToast(tr("plFrozenNo", { name: p.name })); return false; }
  p.songs = p.songs.filter(k => k !== key); saveUserPrefs();
  plToast(tr("plRemovedFrom", { name: p.name }));
  return true;
}

/* 🎶 曲のプロフィール（曲の長押し）。情報の編集と、プレイリストへの追加・取り外し */
function songProfile(it) {
  const m = metaOf(it.key) || {};
  const d = plDialog(tr("plProfileTitle"));
  const f = {};
  for (const [id, key] of [["title", "plTitle"], ["artist", "plArtist"], ["album", "plAlbum"], ["composer", "plComposer"], ["srcUrl", "plProfileUrl"]]) {
    const inp = el("input", "plInput"); inp.type = "text"; inp.maxLength = id === "srcUrl" ? 300 : 100; inp.value = m[id] || "";
    if (id === "title") inp.placeholder = it.title;
    f[id] = inp;
    d.card.append(plRow(tr(key), inp));
  }
  const matchMemo = el("textarea", "plInput"); matchMemo.rows = 2; matchMemo.maxLength = 80;
  matchMemo.value = m.matchHint || ""; matchMemo.placeholder = tr("plMatchMemoPh");
  matchMemo.style.cssText = "min-height:4em;resize:vertical";
  matchMemo.setAttribute("aria-describedby", "plMatchMemoHelp");
  f.matchHint = matchMemo;
  const matchMemoRow = plRow(tr("plMatchMemo"), matchMemo);
  const matchMemoHelp = el("div", "plHint", tr("plMatchMemoNote")); matchMemoHelp.id = "plMatchMemoHelp";
  d.card.append(matchMemoRow, matchMemoHelp);
  if (settings.playlists.length) {
    d.card.append(el("div", "plSep"), el("b", "plCardTitle", tr("plInLists")));
    for (const p of settings.playlists) {
      const c = el("input"); c.type = "checkbox"; c.checked = p.songs.includes(it.key); c.disabled = !!p.frozen;
      c.addEventListener("change", () => {
        const n = p.songs.length;
        if (c.checked) { if (!plAddSong(p, it.key)) c.checked = false; }
        else { if (!plRemoveSong(p, it.key)) c.checked = true; }
        if (p.songs.length !== n) renderLib();
      });
      const r = plRow(plIcon(p) + " " + p.name, c);
      if (p.frozen) r.classList.add("plRowDim");
      d.card.append(r);
    }
  }
  const save = el("button", "plBtn", tr("plProfileSave")); save.type = "button";
  save.addEventListener("click", () => {
    const nm = {}; let any = false;
    for (const id of ["title", "artist", "album", "composer", "matchHint", "srcUrl"]) {
      let v = f[id].value.trim().slice(0, id === "srcUrl" ? 300 : id === "matchHint" ? 80 : 100);
      if (id === "srcUrl" && v && !/^https:\/\//i.test(v) && /^[a-z0-9.-]+\//i.test(v)) v = "https://" + v;   /* https:// を補う */
      if (id === "srcUrl" && v && !/^https:\/\/\S+$/i.test(v)) { plToast(tr("plLinkBad")); return; }
      if (v) { nm[id] = v; any = true; }
    }
    if (any) SONG_META[it.key] = nm; else delete SONG_META[it.key];
    songMetaSave();
    d.close(); renderLib(); renderBanner();
    plToast(tr("plProfileSaved"));
  });
  d.card.append(el("div", "plSep"), save);
}

/* ---------- 📤 プレイリストの共有（trk-playlist v1） ----------
   ・楽曲ファイル・譜面は含まない（曲名などの見出しと、プレイの証明だけ）
   ・マリオメーカー方式：9曲以上＋すべての曲をクリアか視聴済みでないと書き出せない。
     AUTO・📻ラジオ・倍速も「視聴」として数えるが、AUTO視聴だけの曲には ▶AUTO が必ず付く（隠せない）
   ・リンクは https:// 限定。開く前に確認ダイアログ（作成者が設定したもので、trk!は内容を保証しない） */
const PL_SHARE_MIN = 9;
const PLAYED_KEY = "shadow_taiko_played_v1";
let PLAYED = {};
try { PLAYED = JSON.parse(localStorage.getItem(PLAYED_KEY)) || {}; } catch (_) { PLAYED = {}; }
if (!PLAYED || typeof PLAYED !== "object" || Array.isArray(PLAYED)) PLAYED = {};
function playedSave() { try { localStorage.setItem(PLAYED_KEY, JSON.stringify(PLAYED)); } catch (_) {} }
function notePlayed(key, auto) {   /* リザルトまで行った曲＝クリア or 視聴の証明 */
  if (!key) return;
  const e = (PLAYED[key] ||= { last: 0, auto: 0, manual: 0 });
  e.last = Date.now();
  if (auto) e.auto++; else e.manual++;
  playedSave();
}
on("screen", id => {
  if (id !== "endScreen") return;
  if (currentSong && currentSong.key && !window.Trk.play.runShort) notePlayed(currentSong.key, !!settings.autoPlay);   /* 🕹️ ショートプレイは視聴証明にしない */
});

/* 証明：ランク対象のプレイ記録（クリア）か、視聴記録（AUTO・ラジオ・倍速でもOK） */
function plRecordsIdx() {
  const idx = {};
  for (const r of Object.values(window.Trk.play.records)) if (r && r.title != null) idx[`${r.size}|${r.title}`] = r;
  return idx;
}
function plProof(it, idx) {
  const info = songInfo(it, idx);
  const played = PLAYED[it.key];
  if (info && info.plays > 0) return { ok: true, auto: false, info };
  if (played && played.manual + played.auto > 0) return { ok: true, auto: played.manual === 0, info: null };
  return { ok: false, auto: false, info: null };
}
function plLocalSongs(p) {
  const byKey = new Map(allSongs().map(x => [x.key, x]));
  return p.songs.map(k => byKey.get(k)).filter(Boolean);   /* 端末から消えた曲は対象外 */
}
function plShareData(p, opts) {
  const idx = plRecordsIdx();
  const songs = plLocalSongs(p).map(it => {
    const m = metaOf(it.key) || {}, pr = plProof(it, idx);
    return { title: m.title || it.title, artist: m.artist || it.artist || "", album: m.album || "", composer: m.composer || "",
      srcUrl: /^https:\/\/\S+$/i.test(m.srcUrl || "") ? String(m.srcUrl).slice(0, 300) : "",   /* 曲ごとの入手先（YouTubeなど） */
      key: it.key, size: it.size || 0,
      badges: opts.badges && pr.info ? pr.info.title : "",
      best: opts.score && pr.info ? pr.info.best : 0,
      plays: pr.info ? pr.info.plays : 0,
      auto: pr.auto };   /* ▶AUTO は opts に関係なく必ず入る（記載必須） */
  });
  const src = {};
  if (opts.note) src.note = String(opts.note).slice(0, 60);
  if (opts.url && /^https:\/\/\S+$/i.test(opts.url)) src.url = String(opts.url).slice(0, 300);   /* 書き出しの境界でも https を確認 */
  return { format: "trk-playlist", version: 1, name: p.name, icon: plIcon(p), color: p.color,
    author: String(settings.plAuthorName || "").trim().slice(0, 24) || undefined,   /* 👤 投稿者名（受取側の👥投稿者ツールで検索・ブロックできる） */
    count: songs.length, createdAt: new Date(p.createdAt || Date.now()).toISOString(),
    comment: opts.comment || "", tags: opts.tags || [], source: (src.note || src.url) ? src : undefined, songs };
}
function plCopyText(text) {
  const done = () => plToast(tr("plShareCopied"));
  const fallback = () => {
    const ta = el("textarea"); ta.value = text; ta.style.cssText = "position:fixed;left:-999px";
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    ta.remove();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => { fallback(); done(); });
  else { fallback(); done(); }
}
function plShareText(v) {
  const lines = [`${v.icon || "🎧"} ${tr("plShareTextHead")}「${v.name}」（${v.count}曲）`];
  if (v.author) lines.push("👤 " + v.author);   /* 👀 投稿者（共有ファイルから） */
  for (const s of v.songs.slice(0, 20)) {
    const bits = [s.title];
    if (s.badges) bits.push(s.badges);
    if (s.auto) bits.push(tr("plAutoMark"));
    else if (s.best) bits.push(s.best.toLocaleString());
    lines.push("♪ " + bits.join(" "));
    if (s.srcUrl) lines.push(s.srcUrl);   /* 曲ごとの入手先（Esports名場面集など） */
  }
  if (v.songs.length > 20) lines.push(`… +${v.songs.length - 20}`);
  if (v.comment) lines.push(`📝 ${v.comment}`);
  if (v.source && v.source.note) lines.push(`🔗 ${v.source.note}`);
  if (v.source && v.source.url) lines.push(v.source.url);
  if (v.tags && v.tags.length) lines.push(v.tags.map(t => "#" + t.replace(/[\s、，,#]/g, "")).filter(Boolean).join(" "));
  return lines.join("\n");
}
/* 共有ダイアログ（書き出し条件をその場で確認） */
function plShare(p) {
  const d = plDialog(tr("plShareTitle") + "：" + p.name);
  const comment = el("input", "plInput"); comment.type = "text"; comment.maxLength = 140; comment.placeholder = tr("plShareComment");
  const note = el("input", "plInput"); note.type = "text"; note.maxLength = 60; note.placeholder = tr("plShareSourceNote");
  const url = el("input", "plInput"); url.type = "text"; url.maxLength = 300; url.placeholder = "https://…";
  const tags = el("input", "plInput"); tags.type = "text"; tags.maxLength = 80; tags.value = (p.tags || []).join(" "); tags.placeholder = tr("plTagsPh");
  const sc = el("input"); sc.type = "checkbox"; sc.checked = true;
  const bd = el("input"); bd.type = "checkbox"; bd.checked = true;
  const status = el("div", "plHint");
  const opts = () => ({ comment: comment.value.trim().slice(0, 140), note: note.value.trim().slice(0, 60),
    url: /^https:\/\/\S+$/i.test(url.value.trim()) ? url.value.trim() : "", badges: bd.checked, score: sc.checked,
    tags: tags.value.split(/[\s、，,]+/).map(x => x.trim().slice(0, 16)).filter(Boolean).slice(0, 5) });
  const check = () => {
    const songs = plLocalSongs(p);
    if (songs.length < PL_SHARE_MIN) { status.textContent = tr("plShareNeed9", { n: songs.length }); return false; }
    const idx = plRecordsIdx();
    const unplayed = songs.filter(it => !plProof(it, idx).ok).map(it => (metaOf(it.key) || {}).title || it.title);
    if (unplayed.length) {
      status.textContent = tr("plShareUnplayed", { list: unplayed.slice(0, 3).join(" / ") + (unplayed.length > 3 ? " …" : "") });
      return false;
    }
    status.textContent = tr("plShareReady", { n: songs.length });
    return true;
  };
  check();
  const exportBtn = el("button", "plBtn", tr("plShareExport")); exportBtn.type = "button";
  exportBtn.addEventListener("click", () => {
    if (!check()) return;
    const o = opts();
    downloadJSON(plShareData(p, o), `trk-playlist-${safeName(p.name)}.json`);
    p.createdAt = p.createdAt || Date.now(); p.tags = o.tags; saveUserPrefs();
    plToast(tr("plShareExported"));
  });
  const copyBtn = el("button", "plBtn", tr("plShareCopy")); copyBtn.type = "button";
  copyBtn.addEventListener("click", () => { if (check()) plCopyText(plShareText(plShareData(p, opts()))); });
  d.card.append(
    el("div", "plHint", tr("plShareRule")),
    plRow(tr("plShareComment"), comment),
    plRow(tr("plShareSourceNote"), note),
    plRow(tr("plShareSourceUrl"), url),
    plRow(tr("plTags"), tags),
    plRow(tr("plShareScore"), sc), plRow(tr("plShareBadges"), bd),
    status, exportBtn, copyBtn);
}

/* ---------- 📥 読み込み（ビューア → ある曲だけ取り込む） ---------- */
function plSanitizeShared(raw) {
  if (!raw || typeof raw !== "object" || raw.format !== "trk-playlist" || !Array.isArray(raw.songs)) return null;
  const songs = raw.songs.slice(0, 1000).map(s => (s && typeof s === "object") ? {
    title: String(s.title || "").trim().slice(0, 120), artist: String(s.artist || "").trim().slice(0, 100),
    album: String(s.album || "").trim().slice(0, 100), composer: String(s.composer || "").trim().slice(0, 100),
    srcUrl: /^https:\/\/\S+$/i.test(String(s.srcUrl || "")) ? String(s.srcUrl).trim().slice(0, 300) : "",
    key: typeof s.key === "string" ? s.key.slice(0, 128) : "", size: Number(s.size) || 0,
    badges: String(s.badges || "").slice(0, 40),
    best: Math.max(0, Math.floor(Number(s.best) || 0)), plays: Math.max(0, Math.floor(Number(s.plays) || 0)),
    auto: !!s.auto
  } : null).filter(s => s && s.title);
  if (!songs.length) return null;
  const note = String((raw.source && raw.source.note) || "").trim().slice(0, 60);
  const urlRaw = String((raw.source && raw.source.url) || "").trim();
  const url = /^https:\/\/\S+$/i.test(urlRaw) ? urlRaw.slice(0, 300) : "";
  return { name: String(raw.name || "Playlist").slice(0, 24), icon: String(raw.icon || "🎧").slice(0, 4),
    color: /^[a-z]{3,12}$/.test(raw.color || "") ? raw.color : "none",
    author: typeof raw.author === "string" ? raw.author.trim().slice(0, 24) : "",   /* 👤 投稿者名（任意・古い共有ファイルには無い） */
    count: songs.length, comment: String(raw.comment || "").slice(0, 140),
    tags: (Array.isArray(raw.tags) ? raw.tags : []).map(t => String(t).trim().slice(0, 16)).filter(Boolean).slice(0, 5),
    createdAt: String(raw.createdAt || "").slice(0, 30),
    source: (note || url) ? { note, url } : null, songs };
}
function plMatchByTitle(s, all) {
  const t = s.title.trim().toLowerCase();
  let fallback = null;
  for (const it of all) {
    if (String((metaOf(it.key) || {}).title || it.title).trim().toLowerCase() !== t) continue;
    if (!fallback) fallback = it;
    if (!s.size || !it.size || s.size === it.size) return it;
  }
  return fallback;
}
function plOpenLink(url) {   /* https限定＋開く前に確認（osu!の「入手先を明示」流・trk!は内容を保証しない） */
  /* 🛡 呼び出し側でも https を確かめているが、開く瞬間にもう一度通す。
     古い保存データ・手で書き換えた localStorage・将来の呼び出しが javascript: を渡しても開かない。 */
  url = safeHttpUrl(url);
  if (!url) return;
  const d = plDialog(tr("plLinkOpen"));
  d.card.append(el("div", "plHint", url), el("div", "plHint", tr("plLinkWarn")));
  const open = el("button", "plBtn", tr("plLinkOpen")); open.type = "button";
  open.addEventListener("click", () => { d.close(); try { const w = window.open(url, "_blank", "noopener,noreferrer"); if (w) w.opener = null; } catch (_) {} });
  const no = el("button", "plBtnDanger", tr("plLinkCancel")); no.type = "button";
  no.addEventListener("click", d.close);
  d.card.append(open, no);
}
function plViewer(v) {
  const d = plDialog(tr("plImportTitle"));
  const all = allSongs(), byKey = new Map(all.map(x => [x.key, x]));
  const matched = [];
  d.card.append(el("b", "plCardTitle", `${v.icon} ${v.name}`));
  d.card.append(el("div", "plHint", [v.createdAt ? v.createdAt.slice(0, 10) : "", tr("plSongsNow", { n: v.songs.length })].filter(Boolean).join(" · ")));
  if (v.author) {   /* 👤 投稿者（ブロック中なら 🚫 を出す。取り込むかどうかは自分で決められる） */
    const abad = settings.plAuthorTools && settings.plAuthorBlock.includes(v.author);
    d.card.append(el("div", "plHint", (abad ? "🚫 " : "👤 ") + tr("plAuthorBy") + "：" + v.author + (abad ? " ・ " + tr("plAuthorBlockedView") : "")));
  }
  if (v.comment) d.card.append(el("div", "plShareComment", "📝 " + v.comment));
  if (v.tags && v.tags.length) {
    const row = el("div", "plChipsRow");
    for (const t of v.tags) row.append(el("span", "skinChip on", "#" + t));
    d.card.append(row);
  }
  if (v.source) {
    const src = el("div", "plShareSrc");
    if (v.source.note) src.append(el("div", "plHint", "🔗 " + v.source.note));
    if (v.source.url) {
      const btn = el("button", "plBtn", tr("plLinkOpen")); btn.type = "button";
      btn.addEventListener("click", () => plOpenLink(v.source.url));
      src.append(btn, el("div", "plHint", v.source.url));
    }
    d.card.append(src);
  }
  d.card.append(el("div", "plSep"));
  const list = el("div", "plShareList");
  for (const s of v.songs) {
    const it = (s.key && byKey.get(s.key)) || plMatchByTitle(s, all);
    if (it) matched.push(it);
    const row = el("div", "plShareRow" + (it ? "" : " miss"));
    row.append(el("b", "", s.title));
    const sub = [s.artist, s.album].filter(Boolean).join(" · ");
    const marks = [s.badges, s.auto ? tr("plAutoMark") : (s.best ? s.best.toLocaleString() : "")].filter(Boolean).join(" ");
    row.append(el("div", "plHint", [sub, marks].filter(Boolean).join("　")));
    if (s.srcUrl) {
      const lb = el("button", "plLinkMini", "🔗"); lb.type = "button"; lb.title = tr("plLinkOpen");
      lb.addEventListener("click", () => plOpenLink(s.srcUrl));
      row.append(lb);
    }
    row.append(el("span", "plShareState", it ? "✅" : "❌"));
    list.append(row);
  }
  d.card.append(list);
  const take = el("button", "plBtn", tr("plImportTake", { n: matched.length })); take.type = "button";
  take.disabled = !matched.length;
  take.addEventListener("click", () => {
    const p = plSanitize({ id: "pl" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: v.name, icon: "📥", color: v.color, frozen: false, locked: false, songs: matched.map(x => x.key), tags: v.tags, by: v.author || "" });
    p.createdAt = Date.now();
    settings.playlists.push(p); saveUserPrefs();
    settings.libTab = "pl:" + p.id;
    d.close(); renderLib();
    plToast(tr("plImportTaken", { name: p.name }));
  });
  d.card.append(el("div", "plSep"), el("div", "plHint", tr("plImportFound", { n: matched.length, m: v.songs.length })), take);
}
function plImportPick() {
  const inp = el("input"); inp.type = "file"; inp.accept = "application/json,.json";
  inp.addEventListener("change", async () => {
    const f = inp.files && inp.files[0]; inp.value = "";
    if (!f) return;
    let raw = null;
    try { raw = JSON.parse(await f.text()); } catch (_) {}
    const v = plSanitizeShared(raw);
    if (!v) { plToast(tr("plImportBad")); return; }
    plViewer(v);
  });
  inp.click();
}

/* タブ帯を描いて、いま選ばれているタブのIDを返す */
function renderLibTabs(tabs) {
  const box = $("libTabs");
  const active = tabs.some(t => t.id === settings.libTab) ? settings.libTab : "all";
  if (!box) return active;
  box.textContent = "";
  box.hidden = false;   /* 🎧 「＋」（新規プレイリスト）があるので、タブが1つでも帯は出す */
  /* role=tablist は「タブだけ」を子に持たせ、＋ボタンはその外に置く（入れ子の規則を守る）。
     見た目は display:contents なので、これまでと同じ並び・同じスキンのまま */
  const tabList = el("div", "libTabsList"); tabList.setAttribute("role", "tablist"); tabList.setAttribute("aria-label", tr("libTitle"));
  for (const t of tabs) {
    const b = el("button", "libTab" + (t.id === active ? " on" : "")); b.type = "button";
    b.dataset.tab = t.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", String(t.id === active));
    b.title = tr("libTabGo", { n:t.n }) + (t.pl ? (t.pl.frozen ? " · 🧊" : "") + (t.pl.locked ? " · 🔒" : "") : "");
    if (t.pl) {
      b.dataset.pl = t.pl.id;
      const c = PL_COLORS[t.pl.color];
      if (c) { b.style.background = c; b.style.borderColor = c; b.classList.add("plCol"); }
    }
    if (t.fld) {
      b.dataset.fld = t.fld.id;
      const c = PL_COLORS[t.fld.color];
      if (c) { b.style.background = c; b.style.borderColor = c; b.classList.add("plCol"); }
    }
    if (t.nested) b.classList.add("plNested");   /* フォルダの中のプレイリスト（いま見ているぶん） */
    /* 🐔 trk's playlist は表示名を短くしても、読み上げ名は「🐔 trk's playlist」のままにする */
    if (t.trk) b.setAttribute("aria-label", tr("trkTab"));
    b.append(el("span", "libTabIcon", t.icon), el("span", "libTabName", t.label), el("i", "libTabN", String(t.n)));
    b.addEventListener("click", () => {
      if (plSuppressClick()) return;
      if (settings.libTab === t.id) return;
      settings.libTab = t.id; saveUserPrefs(); renderLib();
    });
    b.addEventListener("mousedown", e => { if (e.button === 1) e.preventDefault(); });   /* 中クリックのオートスクロールを止める */
    b.addEventListener("auxclick", e => {
      if (e.button !== 1) return;
      if (t.id === "all") plCreate();            /* 📚すべて の中クリック＝新規プレイリスト */
      else if (t.pl) plDeleteGesture(t.pl, b);   /* プレイリストタブの中クリック＝削除 */
    });
    /* 長押し＝設定（スマホ・PC共通）。⚠ 🐔 trk's playlist だけは名前と色を変えられないので、
       プロフィール編集（plMenu／plFolderMenu）へは行かせず、階層（Vol 一覧）を開く動作に固定する */
    onLongPress(b, () => { if (t.trk) plTrkMenu(); else if (t.pl) plMenu(t.pl); else if (t.fld) plFolderMenu(t.fld); else plGlobalMenu(); });
    if (t.pl) {   /* 曲をドラッグして乗せると追加 */
      b.addEventListener("dragover", e => { e.preventDefault(); b.classList.add("dragOver"); });
      b.addEventListener("dragleave", () => b.classList.remove("dragOver"));
      b.addEventListener("drop", e => {
        e.preventDefault(); b.classList.remove("dragOver");
        const key = e.dataTransfer.getData("text/plain") || plDragKey;
        if (key) { const n = t.pl.songs.length; plAddSong(t.pl, key); if (t.pl.songs.length !== n) renderLib(); }
      });
    }
    tabList.append(b);
  }
  box.append(tabList);
  const plus = el("button", "libTab plPlus", "＋"); plus.type = "button";
  plus.title = tr("plNewTab"); plus.setAttribute("aria-label", tr("plNewTab"));
  plus.addEventListener("click", () => { if (!plSuppressClick()) plCreate(); });
  box.append(plus);
  return active;
}

/* ---------- 曲リストの表示 ---------- */
function renderLib() {
  const box = $("libList"); box.textContent = "";
  const all = allSongs();
  libAllKeys = new Set(all.map(x => x.key));
  $("libCount").textContent = all.length ? tr("libCount", { n:all.length }) : "";
  const byTitle = new Map();   /* 🛒 カタログ照合用（曲名の照合キー → 曲のリスト） */
  const byTitleAdd = (k, it) => { const a = byTitle.get(k); if (a) { if (!a.includes(it)) a.push(it); } else byTitle.set(k, [it]); };
  for (const it of all) {
    const m = metaOf(it.key) || {};
    for (const k of plSongMatchKeys(m.title || it.title, m.matchHint)) byTitleAdd(k, it);
  }
  {   /* Musicフォルダに「欲しい曲」が届いていたら自動でプレイリストへ（🧊フリーズ中は尊重） */
    const wishers = settings.playlists.filter(p => p.wish && p.wish.length && !p.frozen);
    if (wishers.length && all.length) { let ch = false; for (const p of wishers) if (plSyncWishes(p, byTitle)) ch = true; if (ch) saveUserPrefs(); }
  }
  const tabId = renderLibTabs(libTabsOf(all));          // タブは、曲が1つも無くても片付ける
  /* 🛒 「集める棚」（wish つきプレイリスト／それを含むフォルダ）は、曲が1つも無くても
     カタログの曲を灰色で並べる＝開いた瞬間に「これから集める棚」だと分かる（がっかりさせない） */
  const entries = plCollectionEntries(tabId, byTitle);
  if (!all.length && !entries.length) { libView = []; box.append(el("div", "libEmpty", tr("libEmptyList"))); return; }
  const scope = all.filter(it => libTabMatch(it, tabId));
  const q = $("libSearch").value.trim().toLowerCase(), idx = {};
  for (const r of Object.values(window.Trk.play.records)) if (r && r.title != null) idx[`${r.size}|${r.title}`] = r;
  const items = scope
    .filter(it => { if (!q) return true; const m = metaOf(it.key) || {};   /* 🎶 プロフィール情報も検索対象 */
      return `${m.title || it.title} ${it.dir || ""} ${m.artist || it.artist || ""} ${m.album || ""} ${m.matchHint || ""} ${it.packName || ""}`.toLowerCase().includes(q); })
    .map(it => ({ it, info:songInfo(it, idx) }));
  const v = (x, k) => (x.info ? x.info[k] : 0);
  const cmp = {
    name:(a, b) => a.it.title.localeCompare(b.it.title, undefined, { numeric:true }),
    plays:(a, b) => v(b, "plays") - v(a, "plays"),
    recent:(a, b) => v(b, "last") - v(a, "last"),
    best:(a, b) => v(b, "best") - v(a, "best")
  }[settings.libSort] || (() => 0);
  items.sort(cmp);
  if (tabId === "fav") {
    const F = window.TrkFavs;
    if (F) {
      const bar = el("div", "favChipsRow");
      bar.append(F.chips("song", { former:true, onChange: () => renderLib() }));
      box.append(bar);
    }
  }
  if (tabId.startsWith("fld:")) {   /* 📁 フォルダの中身（子フォルダとプレイリスト）へのチップ */
    const fid = tabId.slice(4), bar = el("div", "plChipsRow");
    for (const f of settings.plFolders) if (f.parent === fid) {
      const c = el("button", "skinChip"); c.type = "button"; c.textContent = (f.icon || "📁") + " " + f.name;
      c.addEventListener("click", () => { settings.libTab = "fld:" + f.id; saveUserPrefs(); renderLib(); });
      bar.append(c);
    }
    for (const p of settings.playlists) if (p.folder === fid && plVisible(p)) {
      const c = el("button", "skinChip"); c.type = "button"; c.textContent = `${plIcon(p)} ${p.name}（${plCount(p, new Set(all.map(x => x.key)))}）`;
      c.addEventListener("click", () => { settings.libTab = "pl:" + p.id; saveUserPrefs(); renderLib(); });
      bar.append(c);
    }
    if (bar.childElementCount) box.append(bar);
  }
  /* 並び順：集める棚はカタログ順のまま（持っている＝黒／まだ＝灰色）。それ以外は今までどおり */
  const infoByKey = new Map(items.map(x => [x.it.key, x]));
  const wishHit = q ? e => e.it ? infoByKey.has(e.it.key) : `${e.w.t} ${e.w.al || ""} ${e.w.ar || ""}`.toLowerCase().includes(q) : () => true;
  const usedKeys = new Set();   /* 1曲が2つの wish に当たっても、黒い行は1回だけ */
  const shownWishes = entries.filter(wishHit).filter(e => {
    if (!e.it) return true;
    if (usedKeys.has(e.it.key)) return false;
    usedKeys.add(e.it.key);
    return true;
  });
  const rows = entries.length
    ? [...shownWishes.map(e => ({ it: e.it, info: e.it ? infoByKey.get(e.it.key) : null, w: e.w })),
       ...items.filter(x => !usedKeys.has(x.it.key)).map(x => ({ it: x.it, info: x.info, w: null }))]
    : items.map(x => ({ it: x.it, info: x.info, w: null }));
  libView = rows.filter(r => r.it).map(r => r.it);
  const haveAll = usedKeys.size, totalAll = entries.length;   /* have は実際に黒くなった曲数 */
  if (totalAll && haveAll < totalAll) {
    /* 1曲も持っていないときは「集める棚」の説明、途中なら「いま何曲目まで」を出す */
    box.append(el("div", "hint plWishHint", haveAll ? tr("plWishHint", { have: haveAll, total: totalAll })
      : tr("plWishHead", { n: totalAll })));
  }
  if (!rows.length) {
    box.append(el("div", "libEmpty", tr(scope.length ? "libNoMatch" : (tabId.startsWith("pl:") ? "plTabHint" : tabId.startsWith("fld:") ? "fldTabHint" : "libTabEmpty")))); return;
  }
  /* 🪶 軽量化：初回に描く行数をへらす（行にはボタン・長押し・ドラッグの監視がたくさん付くので、
     長い棚ではここが端末いちばんの待ち時間になります）。棚自体とランダム選曲は全曲のままです */
  const libShow = (typeof TrkLite === "object" && typeof TrkLite.libRows === "function") ? TrkLite.libRows(LIB_SHOW) : LIB_SHOW;
  for (const row of rows.slice(0, libShow)) {
    if (!row.it) { box.append(plWishRow(row.w)); continue; }   /* 🛒 まだ持っていない曲（灰色）＝タップで入手先 */
    const { it, info } = row;
    const wrap = el("div"); wrap.style.cssText = "display:flex;gap:6px;align-items:stretch";
    const cur = currentSong && currentSong.key === it.key;
    const b = el("button", `libRow src-${it.source}` + (cur ? " cur" : "")); b.type = "button"; b.style.flex = "1"; b.style.minWidth = "0";
    const left = el("span", "libLeft"), meta = el("span", "libMeta");
    const m = metaOf(it.key) || {};   /* 🎶 曲プロフィール（長押しで編集） */
    left.append(el("span", "libName", (it.video ? "🎬 " : "") + (m.title || it.title) + (info && info.title ? " " + info.title : "")),   // 例：🎬 動画 / 曲名 🥁🐔🚚⚔🎪🚛
                el("span", "libSub", [m.artist || it.artist, m.album, m.matchHint ? `${tr("plMatchMemo")}: ${m.matchHint}` : "", srcLabel(it)].filter(Boolean).join(" · ")));
    if (it.charts) meta.append(el("i", "libTag", "📄"));
    if (it.shared) { const st = el("i", "libTag", "📤"); st.title = tr("libKeepShared"); meta.append(st); }   /* 💾 端末に残した共有の曲 */
    if (it.chartBlobs && Object.keys(it.chartBlobs).length) meta.append(el("i", "libTag", "📦"));
    if (it.builtinDemo && Object.keys(firstSparkChartMap).length) meta.append(el("i", "libTag", "🎼"));   /* 🎼 trk!手づくりのデモ譜面がいっしょに入っている印 */
    if (info && info.plays) meta.append(el("i", "libTag", tr("libPlays", { n:info.plays })));
    if (info && info.best) meta.append(el("i", "libTag", info.best.toLocaleString()));
    b.append(left, meta);
    b.addEventListener("click", () => { if (!plSuppressClick()) selectSong(it); });
    b.draggable = true;   /* 🎧 プレイリストタブへドラッグして追加 */
    b.addEventListener("dragstart", e => { plDragKey = it.key; try { e.dataTransfer.setData("text/plain", it.key); e.dataTransfer.effectAllowed = "copy"; } catch (_) {} document.body.classList.add("plDragging"); });
    b.addEventListener("dragend", () => { plDragKey = ""; document.body.classList.remove("plDragging"); });
    onLongPress(b, () => songProfile(it));   /* 🎶 長押しでプロフィール＆プレイリスト */
    wrap.append(b);
    /* ⭐ お気に入り（📌は ⋯ のメニューから） */
    const F = window.TrkFavs;
    if (F) {
      const inFav = F.has("song", it.key);
      const sb = el("button", "libFav" + (inFav ? " on" : ""), inFav ? "★" : "☆");
      sb.type = "button";
      sb.title = tr(inFav ? "favDel" : "favAdd");
      sb.setAttribute("aria-label", tr(inFav ? "favIn" : "favAdd") + " " + it.title);
      sb.setAttribute("aria-pressed", String(inFav));
      sb.addEventListener("click", e => {
        e.stopPropagation();
        if (inFav) { const r = F.remove("song", it.key); if (!r.ok) F.toast(F.msg(r.why, r.g)); }
        else F.add("song", it.key, { group:"main", append:false });
        renderLib();
      });
      wrap.append(sb);
      if (inFav || F.groupOf("song", it.key)) wrap.append(F.menuButton("song", it.key, "libMenu"));
    }
    if (it.source === "file" || it.shared) {   /* 📄 追加した曲 ／ 💾 端末に残した共有の曲 は一覧から外せます */
      const del = el("button", "", "✕"); del.type = "button"; del.title = tr("libRemove"); del.setAttribute("aria-label", tr("libRemove"));
      del.style.cssText = "padding:6px 12px;font-size:14px;border-radius:12px";
      del.addEventListener("click", () => { if (it.shared) removeShared(it); else removeAdded(it); });
      wrap.append(del);
    }
    box.append(wrap);
  }
  if (rows.length > libShow) box.append(el("div", "hint", tr("libMore", { n:rows.length - libShow })));
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
    const m = metaOf(s.key) || {};   /* 🎶 曲プロフィール */
    $("songTitleBig").textContent = m.title || s.title;
    $("songSub").textContent = [m.artist || s.artist, m.album, m.composer ? `${tr("plComposer")}: ${m.composer}` : "",
      m.matchHint ? `${tr("plMatchMemo")}: ${m.matchHint}` : "", s.charter ? `${tr("chartBy")}: ${s.charter}` : "", srcLabel(s)].filter(Boolean).join(" · ");
    if (s.bgBlob) { bannerUrl = URL.createObjectURL(s.bgBlob); b.style.backgroundImage = `url("${bannerUrl}")`; b.classList.add("hasImg"); }
  }
  previewSetBtn.textContent = tr("previewSet");
  previewSetBtn.hidden = !(s && videoReady);
  if (typeof bannerSongBtnsSync === "function") bannerSongBtnsSync();
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
  if (window._trkMediaPlayerMode || !settings.previewEnabled || phase !== "title" || !currentSong || !video.src || !isFinite(video.duration)) return;
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
  if (window._trkMediaPlayerMode || phase !== "title" || !currentSong || !settings.previewEnabled) return;
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
/* ---------- ⏯ 曲名バナーをタップで一時停止（設定でON）＋ 🔊 右下の音量 ---------- */
function bannerPauseAction(st) {   /* 純粋関数（テストで確認）→ null / "pause" / "resume" / "preview" */
  if (!st.enabled || st.mediaMode || st.target) return null;
  if (st.phase === "playing") return "pause";
  if (st.phase === "paused") return "resume";
  if (st.phase === "title" && st.hasSong) return "preview";
  return null;
}
const bannerVolClamp = v => Math.max(0, Math.min(1, Number(v) || 0));
function bannerPauseSync() { $("songBanner").classList.toggle("tapPause", !!settings.bannerPause); }
$("bannerPause").addEventListener("change", e => {
  settings.bannerPause = e.target.checked; saveUserPrefs(); bannerPauseSync();
});
$("bannerPause").checked = settings.bannerPause;
bannerPauseSync();
$("songBanner").addEventListener("click", e => {
  const act = bannerPauseAction({ enabled: settings.bannerPause, mediaMode: window._trkMediaPlayerMode,
    target: !!e.target.closest("button, input, a, label"), phase, hasSong: !!(currentSong && video.src) });
  if (act === "pause") window.Trk.play.pauseGame();
  else if (act === "resume") window.Trk.play.resumeGame();
  else if (act === "preview") { if (video.paused) video.play().catch(() => {}); else video.pause(); }   /* 選曲中のプレビュー */
});
/* 🔊 音量（設定の musicVolume と同じもの。バナーの右下の小さなつまみ） */
const bannerVolBtn = el("button", "bannerVolBtn", "🔊"); bannerVolBtn.type = "button";
const bannerVolTip = () => tr("bannerVolTip");
bannerVolBtn.title = bannerVolTip();
bannerVolBtn.setAttribute("aria-label", `${tr("musicVolume")}. ${bannerVolTip()}`);
const bannerVolSlider = el("input", "bannerVolSlider"); bannerVolSlider.type = "range";
bannerVolSlider.min = "0"; bannerVolSlider.max = "1"; bannerVolSlider.step = "0.01";
const bannerVolPanel = el("div", "bannerVolPanel"); bannerVolPanel.hidden = true;
bannerVolPanel.append(bannerVolSlider);
$("songBanner").append(bannerVolPanel, bannerVolBtn);
let bannerVolRestore = settings.musicVolume > 0 ? bannerVolClamp(settings.musicVolume) : bannerVolClamp(settings.musicVolumeRestore || 0.7);
let bannerVolPressTimer = 0, bannerVolLongPressed = false, bannerVolPointer = null;
let bannerVolDownX = 0, bannerVolDownY = 0;
function bannerVolSync() {
  const volume = bannerVolClamp(settings.musicVolume);
  if (volume > 0) { bannerVolRestore = volume; rememberMusicVolume(volume); }
  bannerVolSlider.value = String(volume);
  bannerVolBtn.textContent = volume > 0 ? "🔊" : "🔇";
  bannerVolBtn.title = bannerVolTip();
  bannerVolBtn.setAttribute("aria-label", `${tr("musicVolume")}. ${bannerVolTip()}`);
}
function setBannerMusicVolume(value) {
  const volume = bannerVolClamp(value);
  if (volume > 0) { bannerVolRestore = volume; rememberMusicVolume(volume); }
  settings.musicVolume = volume;
  cancelAnimationFrame(fadeRaf);   /* プレビューのフェードインと取り合いにならないように */
  video.volume = volume;
  const sv = $("volume"); if (sv) sv.value = String(volume);   /* 設定画面のスライダーも合わせる */
  saveUserPrefs(); bannerVolSync();
}
function bannerVolLongPressAction() {
  if (settings.musicVolume > 0) {
    bannerVolRestore = bannerVolClamp(settings.musicVolume);
    rememberMusicVolume(bannerVolRestore);
    setBannerMusicVolume(0);
  } else {
    bannerVolRestore = bannerVolClamp(settings.musicVolumeRestore || bannerVolRestore || 0.7);
    setBannerMusicVolume(bannerVolRestore);
  }
}
function bannerVolCancelPress() {
  if (bannerVolPressTimer) clearTimeout(bannerVolPressTimer);
  bannerVolPressTimer = 0; bannerVolPointer = null;
}
bannerVolSync();
on("language", bannerVolSync);
bannerVolBtn.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  bannerVolCancelPress(); bannerVolLongPressed = false;
  bannerVolPointer = e.pointerId; bannerVolDownX = e.clientX; bannerVolDownY = e.clientY;
  try { bannerVolBtn.setPointerCapture(e.pointerId); } catch (_) {}
  bannerVolPressTimer = setTimeout(() => {
    bannerVolPressTimer = 0; bannerVolLongPressed = true;
    bannerVolLongPressAction();
  }, 650);
});
bannerVolBtn.addEventListener("pointermove", e => {
  if (bannerVolPointer !== e.pointerId) return;
  if (Math.hypot(e.clientX - bannerVolDownX, e.clientY - bannerVolDownY) > 12) bannerVolCancelPress();
});
bannerVolBtn.addEventListener("pointerup", e => {
  if (bannerVolPointer === e.pointerId) bannerVolCancelPress();
});
bannerVolBtn.addEventListener("pointercancel", e => {
  if (bannerVolPointer === e.pointerId) bannerVolCancelPress();
});
bannerVolBtn.addEventListener("contextmenu", e => e.preventDefault());
bannerVolBtn.addEventListener("click", e => {
  if (bannerVolLongPressed) {
    bannerVolLongPressed = false;
    e.preventDefault(); e.stopImmediatePropagation();
    return;
  }
  bannerVolPanel.hidden = !bannerVolPanel.hidden; bannerVolSync();
});
bannerVolSlider.addEventListener("input", () => setBannerMusicVolume(bannerVolSlider.value));
/* ◀🎲▶ バナーの右端にまとめて曲送り（TVドックの◀▶と同じ仕組み。いま開いているタブの中を送る）
   ・左端に置くと曲名の頭に重なるので、曲の操作は右端の [◀][🎲][▶] に集める
   ・🎲 は誤操作を防ぐため、既定では長押し（650ms）で変える。設定でタップだけにも、🎲 自体を隠すこともできる */
const bannerSongBar = el("div", "bannerSongBar");
const bannerPrevBtn = el("button", "bannerSongBtn", "◀"); bannerPrevBtn.type = "button";
const bannerRandomBtn = el("button", "bannerSongBtn bannerRandomBtn", "🎲"); bannerRandomBtn.type = "button";
const bannerNextBtn = el("button", "bannerSongBtn", "▶"); bannerNextBtn.type = "button";
bannerSongBar.append(bannerPrevBtn, bannerRandomBtn, bannerNextBtn);
$("songBanner").append(bannerSongBar);

/* 🎲 おまかせの候補：いまの一覧 ＋ 📌ピンの曲（ほかのタブにいても、必ず候補に入る） */
function randomSongPool() {
  const pool = libView.slice();
  const F = window.TrkFavs;
  if (F) {
    for (const key of F.state("song").pins) {
      if (F.groupOf("song", key) === "former") continue;
      const it = allSongs().find(x => x.key === key);
      if (it && !pool.includes(it)) pool.push(it);
    }
  }
  return pool;
}
function randomSongPick() {
  const pool = randomSongPool();
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}
const bannerRandomTapMode = () => settings.bannerRandomTap === true;   /* タップだけで変える（初期オフ＝長押し） */

function bannerSongBtnsSync() {
  const on = settings.bannerSongBtns !== false && allSongs().length > 0 && phase === "title";
  const rand = on && settings.bannerRandomBtn !== false;
  bannerSongBar.hidden = !on;
  bannerPrevBtn.hidden = bannerNextBtn.hidden = !on;
  bannerRandomBtn.hidden = !rand;
  $("songBanner").classList.toggle("hasSongBtns", on);   /* 曲名の右側を空けて、右端のボタンと重ならないようにする */
  const t1 = tr("tvPrevSong"), t2 = tr("tvNextSong");
  for (const [b, t] of [[bannerPrevBtn, t1], [bannerNextBtn, t2]]) { b.title = t; b.setAttribute("aria-label", t); }
  const tip = tr(bannerRandomTapMode() ? "bannerRandomTapTip" : "bannerRandomHoldTip");
  if (bannerRandomBtn.title !== tip) { bannerRandomBtn.title = tip; bannerRandomBtn.setAttribute("aria-label", tip); }
}
async function bannerSongStep(dir) {
  if (phase !== "title") return;
  const it = dir < 0 ? prevSong() : nextSong();
  if (it) await selectSong(it);
}
async function bannerSongRandom() {
  if (phase !== "title") return;
  const it = randomSongPick();
  if (it) await selectSong(it);
}
bannerPrevBtn.addEventListener("click", () => bannerSongStep(-1));
bannerNextBtn.addEventListener("click", () => bannerSongStep(1));
/* 🎲：既定は長押しでおまかせ。タップだけで変える設定とキーボード操作（click の detail が 0）は、その場で変える */
let bannerRandTimer = 0, bannerRandLongPressed = false, bannerRandPointer = null, bannerRandDownX = 0, bannerRandDownY = 0;
function bannerRandCancelPress() {
  if (bannerRandTimer) clearTimeout(bannerRandTimer);
  bannerRandTimer = 0; bannerRandPointer = null;
}
bannerRandomBtn.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  bannerRandCancelPress(); bannerRandLongPressed = false;
  if (bannerRandomTapMode()) return;   /* タップだけで変える設定：クリックに任せる */
  bannerRandPointer = e.pointerId; bannerRandDownX = e.clientX; bannerRandDownY = e.clientY;
  try { bannerRandomBtn.setPointerCapture(e.pointerId); } catch (_) {}
  bannerRandTimer = setTimeout(() => {
    bannerRandTimer = 0; bannerRandLongPressed = true;
    bannerSongRandom();
  }, 650);
});
bannerRandomBtn.addEventListener("pointermove", e => {
  if (bannerRandPointer !== e.pointerId) return;
  if (Math.hypot(e.clientX - bannerRandDownX, e.clientY - bannerRandDownY) > 12) bannerRandCancelPress();
});
bannerRandomBtn.addEventListener("pointerup", e => { if (bannerRandPointer === e.pointerId) bannerRandCancelPress(); });
bannerRandomBtn.addEventListener("pointercancel", e => { if (bannerRandPointer === e.pointerId) bannerRandCancelPress(); });
bannerRandomBtn.addEventListener("contextmenu", e => e.preventDefault());
bannerRandomBtn.addEventListener("click", e => {
  if (bannerRandLongPressed) {
    bannerRandLongPressed = false;
    e.preventDefault(); e.stopImmediatePropagation();
    return;
  }
  if (e.detail === 0 || bannerRandomTapMode()) { bannerSongRandom(); return; }
  plToast(tr("bannerRandomHold"));   /* 誤操作防止：短押しでは変えず、押し方だけ案内する */
});
function bannerRandomSyncPrefs() {
  const show = settings.bannerRandomBtn !== false;
  $("bannerRandomBtn").checked = show;
  $("bannerRandomTap").checked = settings.bannerRandomTap === true;
  $("bannerRandomTap").disabled = !show;   /* 🎲 を隠しているときは、押し方の設定は関係ない */
}
$("bannerSongBtns").addEventListener("change", e => {
  settings.bannerSongBtns = e.target.checked; saveUserPrefs(); bannerSongBtnsSync();
});
$("bannerRandomBtn").addEventListener("change", e => {
  settings.bannerRandomBtn = e.target.checked; saveUserPrefs(); bannerRandomSyncPrefs(); bannerSongBtnsSync();
});
$("bannerRandomTap").addEventListener("change", e => {
  settings.bannerRandomTap = e.target.checked; saveUserPrefs(); bannerSongBtnsSync();
});
$("bannerSongBtns").checked = settings.bannerSongBtns !== false;
bannerRandomSyncPrefs();
on("settings", bannerRandomSyncPrefs);   /* 音リセットなどで設定が変わっても、開いたときに合わせる */
bannerSongBtnsSync();   /* 初回の表示あわせ（renderBanner が先に走っていた場合の保険） */


/* ---------- 曲を選ぶ ---------- */
async function materializeBuiltinSong(it) {
  if (it.source !== "builtin" || it.key !== FIRST_SPARK_KEY) return it;
  if (it.file) return it;
  if (!firstSparkFilePromise) {
    firstSparkFilePromise = (async () => {
      const response = await fetch(FIRST_SPARK_ASSET, { credentials:"same-origin" });
      if (!response.ok) { const error = new Error("tutorial-audio-unavailable"); error.code = response.status === 404 ? "not-found" : "http-error"; throw error; }
      const declared = Number(response.headers.get("Content-Length") || 0);
      if (declared > FIRST_SPARK_MAX_BYTES) throw new Error("tutorial-audio-too-large");
      const blob = await response.blob();
      if (!blob.size || blob.size > FIRST_SPARK_MAX_BYTES) throw new Error("tutorial-audio-size-invalid");
      const file = new File([blob], it.fileName, { type:"audio/mpeg" });
      const ready = { ...it, file, size:file.size };
      const idx = builtInSongs.findIndex(song => song.key === FIRST_SPARK_KEY);
      if (idx >= 0) builtInSongs[idx] = ready;
      renderLib();
      return ready;
    })().catch(error => { firstSparkFilePromise = null; throw error; });
  }
  return firstSparkFilePromise;
}
async function selectSong(it) {
  if (phase !== "title" || !it) return;
  const selection = ++songSelectToken;
  if (it.source === "builtin" && !it.file) {
    try { it = await materializeBuiltinSong(it); }
    catch (error) {
      if (selection === songSelectToken) {
        console.error("tutorial audio load failed", error);
        if (error && error.code === "not-found") {
          builtInSongs = builtInSongs.filter(song => song.key !== FIRST_SPARK_KEY);
          const button = $("guideDemoBtn"); if (button) button.hidden = true;
          renderLib();
        }
        setStatus("loadStatus", "demoSongUnavailable");
      }
      return;
    }
    if (phase !== "title" || selection !== songSelectToken) return;
  }
  if (currentSong && currentSong.key === it.key) { if (videoReady) startPreview(); return; }
  currentSong = it;
  stopPreview(); renderLib(); renderBanner(); updateSpBuilder();
  emit("songSelected", it);
  /* 🧩 アドオンが連れてきた曲：ファイル読み込みは、アドオンに任せる（自前のプレイヤーで鳴らす） */
  if (it.source === "addon") {
    if (it.file) { /* file を持っていれば、ふつうの曲と同じ道（loadMedia）を通る */ }
    else { emit("addonSelect", it); renderSeedTools(); return; }
  }
  let studySongArt = null;
  try { if (window.TrkStudyRoom && typeof window.TrkStudyRoom.getSongCoverBlob === "function") studySongArt = await window.TrkStudyRoom.getSongCoverBlob(it.key); } catch (_) {}
  if (currentSong !== it) return;
  await window.Trk.media.setBackground(studySongArt || it.bgBlob || null);
  if (currentSong !== it) return;
  previewPending = true;
  const ok = await window.Trk.media.loadMedia(it.file, { title:it.title, onReady:() => restoreSongState(it) });
  if (!ok || currentSong !== it) return;
  renderLib(); renderBanner(); updateSpBuilder(); renderSeedTools();
}
window.TrkSelectTutorialSong = async function() {
  const demo = builtInSongs.find(song => song.key === FIRST_SPARK_KEY);
  if (!demo || phase !== "title") return false;
  settings.libTab = "builtin"; saveUserPrefs(); renderLib();
  await selectSong(demo);
  return !!(videoReady && currentSong && currentSong.key === FIRST_SPARK_KEY);
};
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
  /* 🎼 trk!同梱のデモ譜面（初級・中級・上級）。無い難易度＝達人・RUSHは自動生成へ戻る */
  if (s.source === "builtin" && s.key === FIRST_SPARK_KEY && firstSparkChartMap[d]) {
    let data = null;
    try { data = await firstSparkChartData(d); } catch (_) {}
    if (data && window.Trk.media.applyChartData(data, "custom", "importStatus", false)) { setStatus("importStatus", "builtinChartLoaded", { d:tr(d) }); return true; }
    return false;
  }
  if (s.chartBlobs && s.chartBlobs[d]) {
    let data = null; try { data = JSON.parse(await s.chartBlobs[d].text()); } catch (_) {}
    if (data && window.Trk.media.applyChartData(data, "pack", "importStatus", false)) { setStatus("importStatus", "packChartLoaded", { d:tr(d) }); return true; }
  }
  if (s.charts && s.charts.length) {
    const lower = f => f.name.toLowerCase();
    const f = s.charts.find(x => lower(x).endsWith(`-${d}${CHART_SUFFIX}`)) || s.charts.find(x => lower(x) === (s.base + CHART_SUFFIX).toLowerCase());
    if (f && await window.Trk.media.importChartFile(f)) { setStatus("libStatus", "libChartLoaded", { f:f.name }); return true; }
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
  window.Trk.play.toTitle();
  await selectSong(next);
  if (phase === "title" && videoReady && chart.length && currentSong === next) window.Trk.play.startGame();
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
/* ---------- 🎬 動画ファイルとして読み込む ----------
   ふつうの「＋ 曲ファイルを追加」は音も映像も同じ道を通るため、大きな動画だと
   ・音声解析でファイルを丸ごとメモリに載せる（2GBなどは失敗・待たされる）
   ・映像が間に合わず、音楽ファイルのように見えてしまう
   ことがあります。こちらは「映像つき」として読み込みます：
   ① <video> で最初のフレームまで待ち、videoWidth > 0 を確かめる（＝動画だと正確に分かる。ここが時間のかかる所）
   ② 確かめられたものだけ 🎬 として記録する（大きいファイルの音声解析は media.js 側で省略）
   ③ 読み込み後、そのまま全画面ビューア（🖥）で流す
   ※ 端末が映像を解釈できない形式なら「音として読み込みました」と出します（無理に動かさない）。 */
const VIDEO_EXT = ["mp4", "m4v", "mov", "webm", "mkv", "avi", "ogv", "3gp"];
const VIDEO_PROBE_MS = 15000;   /* 最初のフレームを待つ上限 */
function probeVideoFile(file) {
  return new Promise(resolve => {
    const el = document.createElement("video");
    let url = "", done = false, timer = 0;
    el.preload = "auto"; el.muted = true; el.setAttribute("playsinline", "");
    const finish = ok => {
      if (done) return; done = true;
      clearTimeout(timer);
      try { el.removeAttribute("src"); el.load(); } catch (_) {}
      if (url) URL.revokeObjectURL(url);
      resolve(!!ok);
    };
    const check = () => { if (el.videoWidth > 0 && el.videoHeight > 0) finish(true); };
    const looksLikeAudio = !VIDEO_EXT.includes(extOf(file.name)) && !/^video\//i.test(file.type || "");
    const meta = () => {   /* 映像が無いと分かる形（音声ファイル）なら、待たずに終える */
      check();
      if (!done && looksLikeAudio && el.videoWidth === 0 && el.readyState >= 1) finish(false);
    };
    el.addEventListener("loadedmetadata", meta);
    el.addEventListener("loadeddata", check);
    el.addEventListener("canplay", check);
    el.addEventListener("playing", () => { try { el.pause(); } catch (_) {} check(); });
    el.addEventListener("error", () => finish(false));
    timer = setTimeout(() => finish(el.videoWidth > 0), VIDEO_PROBE_MS);
    try { url = URL.createObjectURL(file); el.src = url; el.load(); } catch (_) { finish(false); }
  });
}
async function addVideoFiles(list) {
  const files = Array.from(list || []).filter(f => f && (VIDEO_EXT.includes(extOf(f.name)) || /^video\//i.test(f.type || "") || MEDIA_EXT.includes(extOf(f.name))));
  if (!files.length) return;
  let first = null;
  setStatus("libStatus", "libVideoProbe");
  for (let i = 0; i < files.length; i++) {
    const f = files[i], isVideo = await probeVideoFile(f);
    if (files.length > 1) setStatus("libStatus", "libVideoProbeN", { i:i + 1, n:files.length, name:f.name });
    const it = addedItem(f, isVideo), at = addedSongs.findIndex(x => x.key === it.key);
    if (at >= 0) addedSongs.splice(at, 1);
    addedSongs.unshift(it); first = first || it;
    songDB.put(it.key, { key:it.key, file:f, name:f.name, addedAt:Date.now(), video:isVideo }).catch(() => {});
    setStatus("libStatus", isVideo ? "libVideoYes" : "libVideoNo", { name:f.name });
  }
  while (addedSongs.length > ADDED_MAX) { const x = addedSongs.pop(); songDB.del(x.key).catch(() => {}); }
  renderLib();
  if (!first) return;
  selectSong(first);
  if (!first.video) return;
  /* 映像の準備ができたら、そのまま全画面ビューアを開く（見たかった映画をすぐ見られるように） */
  let waited = 0;
  const openWhenReady = () => {
    if (!window.TrkVideoMax || typeof window.TrkVideoMax.open !== "function") return;
    if (typeof videoReady !== "undefined" && (videoReady || waited >= 8000)) {
      try { if (window.TrkVideoMax.open()) setStatus("libStatus", "libVideoWatch"); } catch (_) {}
      return;
    }
    waited += 300; setTimeout(openWhenReady, 300);
  };
  setTimeout(openWhenReady, 300);
}
function removeAdded(it) {
  addedSongs = addedSongs.filter(x => x.key !== it.key);
  songDB.del(it.key).catch(() => {});
  renderLib();
}

/* ---------- 曲パックの曲 ---------- */
async function refreshPackSongs() {
  try { packSongs = (await window.Trk.custom.getPackSongs()).map(packItem); } catch (e) { console.error(e); packSongs = []; }
  renderLib();
}
on("packsChanged", refreshPackSongs);

/* ---------- ミュージックフォルダ（📁 開く ／ 📤 共有） ----------
   📁 開く … 今までどおり。選んだフォルダの中だけを曲リストに入れる（🎬 動画フォルダなどにも）
   📤 共有 … 端末（PC・スマホ）に**1回だけ**許可をもらって、ミュージックフォルダの中身を
             ぜんぶ一気に取り込む。許可は libKV の "share" に覚えておくので、次回からは
             「🔗 共有をつづける」の1タップ（ブラウザの都合で、許可は操作のたびに要ります）
   💾 端末に残す（settings.libKeepShared）… 共有で取り込んだ曲を shadow_taiko_shared に保存して、
             許可なしでも遊べるようにする。上限は SHARED_MAX 曲・SHARED_MB MB（空き容量を守るため）
   ⚠ 曲は端末の外へ送りません（読むだけ。アップロードはしません） */
function ingestFolder(list, dirName, shared, skipped) {
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
  /* 📤 共有のときは「何曲きたか」と「対象外が何件あったか」を両方出す（変なファイルも見て分かるように） */
  if (shared) setStatus("libStatus", "libShareFound", { dir:dirName || "", n:folderSongs.length, skip:skipped || 0 });
  else setStatus("libStatus", folderSongs.length ? "libFound" : "libEmpty", { n:folderSongs.length, dir:dirName || "" });
  renderLib();
}
/* フォルダの中を歩く。読み込んだ曲数は onProgress に出す（大きなフォルダでも待てるように） */
async function scanHandle(h, onProgress) {
  const files = []; let skipped = 0;
  async function walk(dir, path, depth) {
    if (depth > LIB_DEPTH || files.length > LIB_MAX * 2) return;
    for await (const e of dir.values()) {
      if (e.kind === "file") {
        const n = e.name.toLowerCase();
        if (MEDIA_EXT.includes(extOf(n)) || n.endsWith(CHART_SUFFIX)) {
          files.push({ file:await e.getFile(), rel:`${path}/${e.name}` });
          if (onProgress && !(files.length % 25)) onProgress(files.length);
        } else skipped++;                       /* 曲でも譜面でもないファイル（写真・テキストなど） */
      } else if (e.kind === "directory" && !e.name.startsWith(".")) await walk(e, `${path}/${e.name}`, depth + 1);
    }
  }
  await walk(h, h.name, 0);
  return { files, skipped };
}
async function useHandle(h, remember, shared) {
  libShared = !!shared;
  setStatus("libStatus", shared ? "libShareScanning" : "libScanning", { n:0 });
  try {
    const r = await scanHandle(h, n => setStatus("libStatus", shared ? "libShareScanning" : "libScanning", { n }));
    libHandle = h; lastScan = r.files;
    ingestFolder(r.files, h.name, libShared, r.skipped);
    if (remember) { libKV.put(shared ? "share" : "dir", h).catch(() => {}); if (shared) shareRemembered = true; }
    $("libReconnectBtn").hidden = true; $("libRescanBtn").hidden = false;
    if (shared && settings.libKeepShared) await keepSharedSongs(r.files);
    syncShareUI();
  } catch (e) { console.error(e); setStatus("libStatus", shared ? "libShareDenied" : "libDenied"); }
}
async function openFolder() {
  dirInputMode = "open";
  if (!canPickDir) { $("libDirInput").click(); return; }
  try { await useHandle(await showDirectoryPicker({ id:"trk-music", mode:"read", startIn:"music" }), true, false); }
  catch (e) { if (e.name !== "AbortError") { console.error(e); $("libDirInput").click(); } }
}
/* 📤 ミュージックフォルダを共有：端末に1回許可してもらうと、中身のリストをぜんぶ引き受けます */
async function shareMusicFolder() {
  dirInputMode = "share";
  if (!canPickDir) { setStatus("libShareStatus", "libShareUnsupported"); $("libDirInput").click(); return; }
  try {
    /* startIn:"music" で、端末のミュージックフォルダを最初から開きます（スマホは SAF のフォルダ選びになります） */
    const h = await showDirectoryPicker({ id:"trk-music-share", mode:"read", startIn:"music" });
    await useHandle(h, true, true);
  } catch (e) {
    if (e.name === "AbortError") { dirInputMode = "open"; return; }   /* キャンセルは何もしない */
    console.error(e);
    setStatus("libStatus", "libShareDenied"); setStatus("libShareStatus", "libShareUnsupported");
    $("libDirInput").click();
  }
}
/* 🚫 共有をやめる：覚えた許可と、端末に残した曲をぜんぶ消します */
async function stopSharing() {
  /* 🛡 覚えてあるフォルダの鍵（📤 共有の "share" と 📁 開くの "dir"）を、両方とも IndexedDB から消す。
     ページ内で動くコード（アドオン等）が、許可の生きているうちに再利用できないようにするため。
     ⚠ handle.remove() は呼ばない：あれは「本物のファイル／フォルダを消す」API。
       権限の取り消しはブラウザの設定（サイトデータ）側で行うもので、こちらからは触らない。 */
  try { await libKV.del("share"); } catch (_) {}
  try { await libKV.del("dir"); } catch (_) {}
  shareRemembered = false;
  await clearSharedSongs();
  if (libShared) {
    folderSongs = []; libHandle = null; libShared = false; lastScan = [];
    $("libReconnectBtn").hidden = true; $("libRescanBtn").hidden = true;
  }
  renderLib(); syncShareUI();
  setStatus("libShareStatus", "libShareStopped");
}
function showReconnect() {
  const b = $("libReconnectBtn");
  if (libHandle && b && !b.hidden) b.textContent = tr(libShared ? "libShareResume" : "libReconnect", { name:libHandle.name });
}

/* ---------- 💾 共有した曲を端末に残す（settings.libKeepShared） ---------- */
function sharedItem(r) {
  const f = r.file instanceof File ? r.file : new File([r.file], r.name || "song"), base = baseName(f.name);
  return { key:`${f.size}|${base}`, source:"folder", shared:true, file:f, title:base, base, size:f.size, dir:r.dir || "", charts:null };
}
async function loadSharedSongs() {
  try {
    const recs = await sharedDB.all();
    sharedSongs = (recs || []).filter(r => r && r.file).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)).map(sharedItem);
  } catch (e) { console.error(e); sharedSongs = []; }
}
async function clearSharedSongs() {
  try { for (const k of (await sharedDB.keys()) || []) await sharedDB.del(k); } catch (e) { console.error(e); }
  sharedSongs = [];
}
async function removeShared(it) {
  sharedSongs = sharedSongs.filter(x => x.key !== it.key);
  try { await sharedDB.del(it.key); } catch (_) {}
  renderLib(); syncShareUI();
}
/* 共有で取り込んだ曲を端末の中へ。上限（曲数・バイト数）に達したら、そこで止めて正直に出します。
   ⚡ もう端末にある曲（key＝「サイズ|曲名」が同じ）は書き直さないので、↻ 再スキャンは軽く済みます */
async function keepSharedSongs(list) {
  let why = "", saved = 0, bytes = 0;
  const have = new Map();                                            /* key → 保存してあるバイト数 */
  try {
    for (const k of (await sharedDB.keys()) || []) {
      const sz = Number(String(k).split("|")[0]) || 0;
      have.set(String(k), sz); bytes += sz;
    }
  } catch (_) {}
  let n = have.size;
  for (const { file, rel } of list || []) {
    if (!MEDIA_EXT.includes(extOf(file.name))) continue;
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "", key = `${file.size}|${baseName(file.name)}`;
    if (have.has(key)) continue;
    if (n >= SHARED_MAX || bytes + file.size > SHARED_BYTES) { why = "full"; break; }
    try { await sharedDB.put(key, { key, file, name:file.name, dir, addedAt:Date.now() }); }
    catch (e) { console.error(e); why = "failed"; break; }            /* 空き容量が足りない（QuotaExceededError など） */
    have.set(key, file.size); n++; bytes += file.size; saved++;
    if (!(saved % 10)) setStatus("libShareStatus", "libKeepSharedSaving", { n:saved });
  }
  await loadSharedSongs();
  renderLib();
  setStatus("libShareStatus", why === "failed" ? "libKeepSharedFailed" : why === "full" ? "libKeepSharedFull" : "libKeepSharedSaved",
    { n, max:SHARED_MAX, mb:SHARED_MB });
  return n;
}
/* 設定パネル「📤 ミュージックフォルダの共有」の中身を、いまの状態に合わせます */
function syncShareUI() {
  const chk = $("libKeepSharedChk"), hint = $("libKeepSharedHint"), state = $("libShareState"), stop = $("libShareStopBtn");
  if (chk) chk.checked = !!settings.libKeepShared;
  if (hint) hint.textContent = tr("libKeepSharedHint", { max:SHARED_MAX, mb:SHARED_MB });
  const sharing = !!libHandle && libShared;
  if (state) state.textContent = sharing ? tr("libShareStateShared", { name:libHandle.name, n:folderSongs.length })
    : sharedSongs.length ? tr("libKeepSharedRestored", { n:sharedSongs.length }) : tr("libShareStateNone");
  if (stop) stop.hidden = !(sharing || shareRemembered || sharedSongs.length);
  showReconnect();
}
function syncTrkUI() {
  const chk = $("trkPlaylistChk");
  if (chk) chk.checked = settings.trkPlaylist !== false;
  const st = $("trkStatus");
  if (st) {
    const tp = settings.playlists.find(function(p){ return p.id === TRK_PLAYLIST_ID; });
    if (settings.trkPlaylist === false) st.textContent = tr("trkHide") + " \u2014 " + tr("trkPanelHint");
    else if (tp) st.textContent = tr("trkPlaylistTitle") + " \u00B7 " + tr("plSongsNow", { n: (tp.songs.length + (tp.wish ? tp.wish.length : 0)) });
    else st.textContent = tr("trkPlaylistHint");
  }
  const chkC = $("trkClassicChk");
  if (chkC) chkC.checked = settings.trkClassic !== false;
  const stC = $("trkClassicStatus");
  if (stC) {
    const tc = settings.playlists.find(function(p){ return p.id === TRK_CLASSIC_ID; });
    if (settings.trkClassic === false) stC.textContent = tr("trkClassicHide") + " \u2014 " + tr("trkClassicPanelHint");
    else if (tc) stC.textContent = tr("trkClassicTitle") + " \u00B7 " + tr("plSongsNow", { n: (tc.songs.length + (tc.wish ? tc.wish.length : 0)) });
    else stC.textContent = tr("trkClassicHint");
  }
  const nameSel = $("trkTabNameSel");
  if (nameSel) nameSel.value = trkNameMode();
  const chkAbc = $("trkSortAbcChk");
  if (chkAbc) chkAbc.checked = !!settings.trkSortABC;
  try { renderTrkSettings(); } catch(_){}
}
function trkFolderIdSet() { return plWishFolderIds(TRK_FOLDER_ID); }   /* 🐔 の階層に入るフォルダ（trk 自身と、その子孫） */
function renderTrkSettings() {
  const box = $("trkOrderList");
  if (!box) return;
  box.replaceChildren();
  const ids = trkFolderIdSet();
  const trkList = settings.playlists.filter(p => ids.has(p.folder));
  if (!trkList.length) { box.append(el("div", "hint", tr("trkOrderEmpty"))); return; }
  for (const p of trkOrderedPlaylists(trkList)) {
    const row = el("div", "plTrkRow"); row.style.cssText = "border:1px solid var(--ui-border);border-radius:10px;padding:6px 8px";
    const name = el("span", "", (p.icon || "\uD83C\uDFA7") + " " + p.name);
    const open = el("button", "plBtn small", tr("trkOpenItem")); open.type = "button";
    open.addEventListener("click", () => { settings.libTab = "pl:" + p.id; saveUserPrefs(); renderLib(); });
    const up = el("button", "plBtn small", "\u2191"); up.type = "button"; up.title = tr("trkMoveUp"); up.setAttribute("aria-label", tr("trkMoveUp") + " " + p.name);
    const down = el("button", "plBtn small", "\u2193"); down.type = "button"; down.title = tr("trkMoveDown"); down.setAttribute("aria-label", tr("trkMoveDown") + " " + p.name);
    if (settings.trkSortABC) { up.disabled = true; down.disabled = true; up.style.opacity = ".45"; down.style.opacity = ".45"; }
    up.addEventListener("click", () => trkMovePlaylist(p.id, -1));
    down.addEventListener("click", () => trkMovePlaylist(p.id, 1));
    row.append(name, open, up, down);
    box.append(row);
  }
  if (settings.trkSortABC) box.append(el("div", "hint", tr("trkOrderAbcOff")));
}


/* ---------- ボタンの配線（📁 開く と 📤 共有 はならべて残します） ---------- */
const libOpenBtn = $("libOpenBtn"); if (libOpenBtn) libOpenBtn.addEventListener("click", openFolder);
const libShareBtn = $("libShareBtn"); if (libShareBtn) libShareBtn.addEventListener("click", shareMusicFolder);
const libShareSettingsBtn = $("libShareSettingsBtn"); if (libShareSettingsBtn) libShareSettingsBtn.addEventListener("click", shareMusicFolder);
const libShareStopBtn = $("libShareStopBtn"); if (libShareStopBtn) libShareStopBtn.addEventListener("click", stopSharing);
const trkMusicFolderBtn = $("trkMusicFolderBtn");
if (trkMusicFolderBtn) trkMusicFolderBtn.addEventListener("click", openFolder);   /* 📁 自分で作った Music/trk を読み取り専用で選ぶ */
const trkChk = $("trkPlaylistChk");
if (trkChk) trkChk.addEventListener("change", function(){
  settings.trkPlaylist = !!trkChk.checked; saveUserPrefs();
  if (settings.trkPlaylist) try { ensureTrkPlaylist({ toast: false }); } catch(_){}
  syncTrkUI(); renderLib();
  setStatus("trkStatus", settings.trkPlaylist ? "trkShow" : "trkHide");
});
const trkAbcChk = $("trkSortAbcChk");
if (trkAbcChk) trkAbcChk.addEventListener("change", function(){
  settings.trkSortABC = !!trkAbcChk.checked; saveUserPrefs();
  syncTrkUI(); renderLib();
});
/* 🐔 タブの表示名（3種類）。名前と色そのものは固定なので、選べるのは表示だけ */
const trkNameSel = $("trkTabNameSel");
if (trkNameSel) trkNameSel.addEventListener("change", function(){
  settings.trkTabName = TRK_TAB_NAME_MODES.includes(trkNameSel.value) ? trkNameSel.value : "full";
  saveUserPrefs(); syncTrkUI(); renderLib();
});
const trkOpenBtn = $("trkOpenBtn");
if (trkOpenBtn) trkOpenBtn.addEventListener("click", function(){
  const created = ensureTrkPlaylist({ toast: true });
  settings.libTab = "pl:" + TRK_PLAYLIST_ID; saveUserPrefs(); renderLib();
  if (!created) plToast(tr("trkDup"));
});
const trkHideBtn = $("trkHideBtn");
if (trkHideBtn) trkHideBtn.addEventListener("click", function(){
  settings.trkPlaylist = false; saveUserPrefs(); syncTrkUI(); renderLib(); plToast(tr("trkHide"));
});
const trkClassicChk = $("trkClassicChk");
if (trkClassicChk) trkClassicChk.addEventListener("change", function(){
  settings.trkClassic = !!trkClassicChk.checked; saveUserPrefs();
  if (settings.trkClassic) try { ensureTrkClassicPlaylist({ toast: false }); } catch(_){}
  syncTrkUI(); renderLib();
  setStatus("trkClassicStatus", settings.trkClassic ? "trkClassicShow" : "trkClassicHide");
});
const trkClassicOpenBtn = $("trkClassicOpenBtn");
if (trkClassicOpenBtn) trkClassicOpenBtn.addEventListener("click", function(){
  const created = ensureTrkClassicPlaylist({ toast: true });
  settings.libTab = "pl:" + TRK_CLASSIC_ID; saveUserPrefs(); renderLib();
  if (!created) plToast(tr("trkClassicDup"));
});
const trkClassicHideBtn = $("trkClassicHideBtn");
if (trkClassicHideBtn) trkClassicHideBtn.addEventListener("click", function(){
  settings.trkClassic = false; saveUserPrefs(); syncTrkUI(); renderLib(); plToast(tr("trkClassicHide"));
});
if (typeof on === "function") on("language", syncTrkUI);
const libKeepChk = $("libKeepSharedChk");
if (libKeepChk) libKeepChk.addEventListener("change", async () => {
  settings.libKeepShared = !!libKeepChk.checked; saveUserPrefs();
  if (settings.libKeepShared) {
    if (lastScan.length) await keepSharedSongs(lastScan);
    else setStatus("libShareStatus", "libKeepSharedNone");            /* まだ共有していない */
  } else {
    await clearSharedSongs(); renderLib();
    setStatus("libShareStatus", "libKeepSharedCleared");
  }
  syncShareUI();
});
$("libRescanBtn").addEventListener("click", () => {
  if (libHandle) useHandle(libHandle, false, libShared);
  else { dirInputMode = libShared ? "share" : "open"; $("libDirInput").click(); }
});
$("libDirInput").addEventListener("change", e => {
  const list = Array.from(e.target.files || []).map(f => ({ file:f, rel:f.webkitRelativePath || f.name }));
  e.target.value = "";
  if (!list.length) return;
  const shared = dirInputMode === "share"; dirInputMode = "open";
  const skipped = list.filter(({ file }) => !MEDIA_EXT.includes(extOf(file.name)) && !file.name.toLowerCase().endsWith(CHART_SUFFIX)).length;
  libShared = shared; libHandle = null; lastScan = list; $("libRescanBtn").hidden = false;
  ingestFolder(list, list[0].rel.split("/")[0] || "", shared, skipped);
  if (shared && settings.libKeepShared) keepSharedSongs(list);
  syncShareUI();
});
$("libReconnectBtn").addEventListener("click", async () => {
  if (!libHandle) return;
  try {
    let p = await libHandle.queryPermission({ mode:"read" });
    if (p !== "granted") p = await libHandle.requestPermission({ mode:"read" });
    if (p !== "granted") { setStatus("libStatus", libShared ? "libShareDenied" : "libDenied"); return; }
    await useHandle(libHandle, false, libShared);
  } catch (e) { console.error(e); setStatus("libStatus", libShared ? "libShareDenied" : "libDenied"); }
});

/* ---------- 検索・並べ替え・ランダム ---------- */
let libSearchTimer = 0;
$("libSearch").addEventListener("input", () => { clearTimeout(libSearchTimer); libSearchTimer = setTimeout(renderLib, 150); });
$("libSort").addEventListener("change", e => { settings.libSort = e.target.value; saveUserPrefs(); renderLib(); });
$("libRandomBtn").addEventListener("click", () => {
  /* 🎲 おまかせ：いまの一覧 ＋ 📌ピンの曲（ほかのタブにいても、必ず候補に入る）
     ＝ 曲名バナーの🎲（長押し／タップ）と同じ抽選を使う */
  const it = randomSongPick();
  if (it) selectSong(it);
});

on("records", renderLib);
on("chart", updateSpBuilder);
// 書斎で曲のジャケットを割り当て直したら、いま流している曲だけ即座に背景へ反映する。
on("studyCoverChanged", key => {
  const song = currentSong;
  if (!song || key !== song.key || !window.TrkStudyRoom || typeof window.TrkStudyRoom.getSongCoverBlob !== "function") return;
  window.TrkStudyRoom.getSongCoverBlob(key).then(blob => {
    if (currentSong === song) return window.Trk.media.setBackground(blob || song.bgBlob || null);
  }).catch(() => {});
});
on("language", () => { $("libSearch").placeholder = tr("libSearch"); showReconnect(); syncShareUI(); syncTrkUI(); renderLib(); renderBanner(); syncVideoButton(); });
/* 🎬 「動画を読み込む」の説明（通常より時間がかかります）をボタンに付ける */
function syncVideoButton() { const label = $("libVideoLabel"); if (label) label.title = tr("libAddVideoHint"); }

/* ---------- 起動時（main.js から呼びます） ---------- */
async function initLibrary() {
  $("libSort").value = settings.libSort;
  $("previewEnabled").checked = settings.previewEnabled;
  $("libSearch").placeholder = tr("libSearch");
  syncVideoButton();
  renderBanner(); renderSeedTools();
  try {
    const recs = await songDB.all();
    addedSongs = recs.filter(r => r && r.file)
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .map(r => addedItem(r.file instanceof File ? r.file : new File([r.file], r.name || "song"), r.video));
  } catch (_) {}
  await refreshPackSongs();
  if (canPickDir) {
    try {
      /* 📤 共有の許可があれば優先（無ければ 📁 開く で覚えたフォルダ） */
      const hs = await libKV.get("share"), hd = hs ? null : await libKV.get("dir");
      const h = hs || hd;
      if (h && h.kind === "directory") {
        libHandle = h; libShared = !!hs; shareRemembered = !!hs;
        $("libReconnectBtn").hidden = false; showReconnect();
      }
    } catch (_) {}
  } else setStatus("libStatus", "libFallbackNote");
  /* 💾 端末に残した共有の曲（?safe=1 では読み戻しません） */
  if (settings.libKeepShared && !(window.TrkSafeMode && TrkSafeMode())) {
    await loadSharedSongs();
    if (sharedSongs.length) setStatus("libStatus", "libKeepSharedRestored", { n:sharedSongs.length });
  }
  syncShareUI();
  // 🐔 trk's playlist — チュートリアル済みなら初回だけ自動で1タブ追加（設定で非表示なら作らない・トーストなし）
  if (settings.tutorialDone && settings.trkPlaylist !== false) {
    try { ensureTrkPlaylist({ toast: false }); } catch(_){}
  }
  // 🎻 trk classic — 同上。ゲームとは別枠で100曲。設定で非表示なら作らない
  if (settings.tutorialDone && settings.trkClassic !== false) {
    try { ensureTrkClassicPlaylist({ toast: false }); } catch(_){}
  }
  // 配布形態で分類: 各タイトル別 Vol を作る（長押しで開くリスト）
  if (settings.tutorialDone) {
    try { ensureTrkDistributionPlaylists(); } catch(_){}
  }
  syncTrkUI();
  renderLib();
  void initOptionalTutorialDemo();
}
/* ✅ library.js 完了 */

/* 公開名は据え置き（名前空間の移行の途中。window.Trk.* への移動は後の段階で行う） */
window.LIB_SHOW = LIB_SHOW;
window.addSongFiles = addSongFiles;
window.addVideoFiles = addVideoFiles;
Object.defineProperty(window, "addonSongs", { configurable:true, get:() => addonSongs, set:v => { addonSongs = v; } });
window.allSongs = allSongs;
window.bannerRandomBtn = bannerRandomBtn;
window.bannerVolTip = bannerVolTip;
window.ensureTrkDistributionPlaylists = ensureTrkDistributionPlaylists;
window.initLibrary = initLibrary;
Object.defineProperty(window, "libView", { configurable:true, get:() => libView, set:v => { libView = v; } });
window.nextSong = nextSong;
window.onLongPress = onLongPress;
window.plToast = plToast;
window.prevSong = prevSong;
window.previewStartFor = previewStartFor;
window.refreshPackSongs = refreshPackSongs;
/* 後から読み込まれるファイルがこの名前を差し替える（window.renderBanner の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "renderBanner", { configurable:true, get:() => renderBanner, set:v => { renderBanner = v; } });
/* 後から読み込まれるファイルがこの名前を差し替える（window.renderLib の代入）。内部の呼び出しにも届くよう、アクセサで同じ束縛を指す */
Object.defineProperty(window, "renderLib", { configurable:true, get:() => renderLib, set:v => { renderLib = v; } });
window.saveSongPrefs = saveSongPrefs;
window.selectSong = selectSong;
window.setAddonSongs = setAddonSongs;
window.songInfo = songInfo;
window.srcLabel = srcLabel;
window.startPreview = startPreview;
window.trySongChart = trySongChart;
/* 領域（window.Trk.library）：公開名の正規の場所。旧名（window.X）は別名として残す（利用者の決定） */
window.Trk = window.Trk || {};
window.Trk.library = Object.assign(window.Trk.library || {}, { LIB_SHOW, addSongFiles, addVideoFiles, allSongs, bannerRandomBtn, bannerVolTip, ensureTrkDistributionPlaylists, initLibrary, nextSong, onLongPress, plToast, prevSong, previewStartFor, refreshPackSongs, saveSongPrefs, selectSong, setAddonSongs, songInfo, srcLabel, startPreview, trySongChart, plTitleKeys, plSongMatchKeys, plWishTitleKeys });
Object.defineProperty(window.Trk.library, "addonSongs", { configurable:true, get:() => addonSongs, set:v => { addonSongs = v; } });
Object.defineProperty(window.Trk.library, "libView", { configurable:true, get:() => libView, set:v => { libView = v; } });
Object.defineProperty(window.Trk.library, "renderBanner", { configurable:true, get:() => renderBanner, set:v => { renderBanner = v; } });
Object.defineProperty(window.Trk.library, "renderLib", { configurable:true, get:() => renderLib, set:v => { renderLib = v; } });
})();
