// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! addons.js — 🧩 アドオン（あとから機能を足せるしくみ）

   【考え方】
   ・本体には入れられない機能（例：YouTube の音をエフェクターに通す…など）を、
     あとから誰かが「アドオン」として足せるようにするための、置き場所と決まりごと。
   ・本体はアドオンを同梱しません。入れるかどうかは、使う人が決めます。
   ・アドオンの中身は、このページの中で動くプログラムです。信頼できるものだけ入れてください。

   【入れ方】
   ・設定画面「🧩 アドオン」→「📄 アドオンを入れる」で、.js か .trk-addon(JSON) を選ぶ
   ・index.html に <script src="js/addons/○○.js"></script> を足す（配布物に入れる場合）

   【アドオンの書き方】
     TrkAddons.register({
       id:"my-addon", name:"わたしのアドオン", version:"1.0.0",
       author:"名前", description:"何をするか", apiVersion:1,
       setup(api){ ... },        // 読み込まれたときに1回呼ばれます
       teardown(){}              // 任意（いまは、外したあとの後片付け用）
     });

   【api でできること（apiVersion 1）】
     api.tr(key, vars)        … 本体の文章（4言語）を引く
     api.el(tag, cls, text)   … 要素を作る
     api.$(id)                … id で要素を取る
     api.addStyle(css)        … <style> を足す（見た目を足す用）
     api.on(event, fn) / api.emit(event, data) … 本体のイベント（language / tvChange / packsChanged / addonSelect など）
     api.slot(name)           … 置き場所。name は "settings" / "libPanel" / "tvMore" / "rackMore"
     api.say(text)            … 設定画面のアドオン欄に、そのままの文字を出す
     api.settings / api.savePrefs() … 設定（shadow_taiko_preferences_v2）
     api.video() / api.phase()      … 本体の <video> と、いまの画面（"title" など）
     api.addSongs(list)       … 曲リストに曲を足す（source:"addon"・タブが自動でできる）
     api.fx.available()       … エフェクター（TrkFX）が使えるか
     api.fx.tapElement(el)    … 自分の <audio>/<video> を、本体のエフェクターに通す
     api.log(...)             … コンソールに出す（[addon:id] が付きます）

   【曲を足すときの形（api.addSongs）】
     { key, title, artist?, bpm?, offset?,
       file?(Blob/File)   … 入れると本体の再生・エフェクターにそのまま乗ります
       addonName?         … タブの名前（既定はアドオン名）
     }
     file を入れない曲は、選んだときに "addonSelect" イベントが流れるので、
     アドオン側が自前のプレイヤーで鳴らします（その音は api.fx.tapElement でエフェクターへ）。

   【保存】
   ・trk_addons_v1（localStorage）＝入れたアドオン（名前・作者・有効/無効・コード）
   ・配布ファイルの形式名は "trk-addon"（JSON）。code を文字列で持ちます
   読み込み順：… → verified.js → lib-skins.js → addons.js（最後）
   ========================================================================== */
"use strict";
(() => {

const ADDONS_KEY = "trk_addons_v1";       // 新しい保存キー（既存のキーは触りません）
const ADDON_FORMAT = "trk-addon";         // 配布ファイルの形式名
const API_VERSION = 1;                    // このファイルが提供するAPIの版
const MAX_CODE = 512 * 1024;              // 1つのアドオンの上限（512KB）
const SAMPLE_URL = "js/addons/example.js";

/* ============ 文章（接頭辞 addon…） ============ */
Object.assign(TEXT.ja, {
  addonTitle:"🧩 アドオン（あとから機能を足す）",
  addonHint:"本体に入れられない機能を、あとから足せます。アドオンは、このページの中で動くプログラムです。**信頼できるものだけ**入れてください。",
  addonInstall:"📄 アドオンを入れる", addonSample:"⬇ サンプルを保存", addonDocs:"📖 つくり方（docs/ADDONS.md）",
  addonReload:"↻ 反映して再読み込み", addonNone:"まだアドオンはありません。",
  addonOn:"オン", addonOff:"オフ", addonDelete:"削除", addonFromFile:"index.html から読み込み",
  addonInstalled:"アドオン「{name}」を入れました。", addonRemoved:"アドオン「{name}」を外しました（↻ 反映して再読み込み）。",
  addonToggledOn:"アドオン「{name}」をオンにしました（↻ 反映して再読み込み）。",
  addonToggledOff:"アドオン「{name}」をオフにしました（↻ 反映して再読み込み）。",
  addonBadFile:"アドオンとして読み込めませんでした：{why}", addonNoRegister:"TrkAddons.register({...}) が見つかりませんでした。",
  addonNeedReload:"（いま入れたアドオンは、読み込み直すと もっと確実に動きます）",
  addonSongs:"このアドオンが足した曲：{n}曲", addonBroken:"エラー：{why}",
  addonSafe:"🛟 セーフモード中は、アドオンを読み込みません（?safe=1 を外して開き直してください）。",
  addonSampleSaved:"サンプルを保存しました。中身を見て、自分のアドオンを作ってみてください。",
  addonSampleFail:"サンプルを取ってこられませんでした。docs/ADDONS.md を見てください。",
  addonTooBig:"大きすぎます（{n}KB まで）。"
});
Object.assign(TEXT.en, {
  addonTitle:"🧩 Add-ons (add features later)",
  addonHint:"You can add features the app itself can't include. An add-on is a program that runs inside this page. **Only install ones you trust.**",
  addonInstall:"📄 Install an add-on", addonSample:"⬇ Save the sample", addonDocs:"📖 How to make one (docs/ADDONS.md)",
  addonReload:"↻ Apply and reload", addonNone:"No add-ons yet.",
  addonOn:"On", addonOff:"Off", addonDelete:"Remove", addonFromFile:"loaded from index.html",
  addonInstalled:"Installed “{name}”.", addonRemoved:"Removed “{name}” (↻ Apply and reload).",
  addonToggledOn:"“{name}” is on (↻ Apply and reload).",
  addonToggledOff:"“{name}” is off (↻ Apply and reload).",
  addonBadFile:"Could not read it as an add-on: {why}", addonNoRegister:"No TrkAddons.register({...}) found.",
  addonNeedReload:"(A reload makes a freshly installed add-on work more reliably.)",
  addonSongs:"Songs added by this add-on: {n}", addonBroken:"Error: {why}",
  addonSafe:"🛟 Add-ons are not loaded in safe mode (open again without ?safe=1).",
  addonSampleSaved:"Sample saved. Open it and try making your own add-on.",
  addonSampleFail:"Could not fetch the sample. See docs/ADDONS.md.",
  addonTooBig:"Too big (up to {n}KB)."
});
Object.assign(TEXT.zh, {
  addonTitle:"🧩 插件（之后添加功能）",
  addonHint:"可以之后添加本体无法包含的功能。插件是在本页面内运行的程序，**请只安装你信任的**。",
  addonInstall:"📄 安装插件", addonSample:"⬇ 保存示例", addonDocs:"📖 制作方法（docs/ADDONS.md）",
  addonReload:"↻ 应用并重新加载", addonNone:"还没有插件。",
  addonOn:"开", addonOff:"关", addonDelete:"删除", addonFromFile:"从 index.html 读取",
  addonInstalled:"已安装插件「{name}」。", addonRemoved:"已移除插件「{name}」（↻ 应用并重新加载）。",
  addonToggledOn:"插件「{name}」已开启（↻ 应用并重新加载）。",
  addonToggledOff:"插件「{name}」已关闭（↻ 应用并重新加载）。",
  addonBadFile:"无法作为插件读取：{why}", addonNoRegister:"没有找到 TrkAddons.register({...})。",
  addonNeedReload:"（重新加载后，刚安装的插件会更可靠地运行。）",
  addonSongs:"此插件添加的歌曲：{n}首", addonBroken:"错误：{why}",
  addonSafe:"🛟 安全模式下不会读取插件（请去掉 ?safe=1 后重新打开）。",
  addonSampleSaved:"已保存示例。请打开看看，试着自己做一个插件。",
  addonSampleFail:"取不到示例。请看 docs/ADDONS.md。",
  addonTooBig:"太大了（最大 {n}KB）。"
});
Object.assign(TEXT.ko, {
  addonTitle:"🧩 애드온 (나중에 기능 추가)",
  addonHint:"본체에 넣을 수 없는 기능을 나중에 추가할 수 있습니다. 애드온은 이 페이지 안에서 동작하는 프로그램입니다. **믿을 수 있는 것만** 넣어 주세요.",
  addonInstall:"📄 애드온 넣기", addonSample:"⬇ 샘플 저장", addonDocs:"📖 만드는 법 (docs/ADDONS.md)",
  addonReload:"↻ 반영하고 새로고침", addonNone:"아직 애드온이 없습니다.",
  addonOn:"켜기", addonOff:"끄기", addonDelete:"삭제", addonFromFile:"index.html에서 읽음",
  addonInstalled:"애드온 '{name}'을(를) 넣었습니다.", addonRemoved:"애드온 '{name}'을(를) 뺐습니다 (↻ 반영하고 새로고침).",
  addonToggledOn:"애드온 '{name}'을(를) 켰습니다 (↻ 반영하고 새로고침).",
  addonToggledOff:"애드온 '{name}'을(를) 껐습니다 (↻ 반영하고 새로고침).",
  addonBadFile:"애드온으로 읽을 수 없습니다: {why}", addonNoRegister:"TrkAddons.register({...})를 찾지 못했습니다.",
  addonNeedReload:"(새로고침하면 방금 넣은 애드온이 더 확실히 동작합니다.)",
  addonSongs:"이 애드온이 더한 곡: {n}곡", addonBroken:"오류: {why}",
  addonSafe:"🛟 안전 모드에서는 애드온을 읽지 않습니다 (?safe=1을 빼고 다시 열어 주세요).",
  addonSampleSaved:"샘플을 저장했습니다. 열어 보고 자기만의 애드온을 만들어 보세요.",
  addonSampleFail:"샘플을 가져오지 못했습니다. docs/ADDONS.md를 봐 주세요.",
  addonTooBig:"너무 큽니다 ({n}KB까지)."
});

/* ============ 保存（入れたアドオン） ============ */
function loadStore() {
  try {
    const raw = localStorage.getItem(ADDONS_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return (o && typeof o === "object") ? o : {};
  } catch (_) { return {}; }
}
let store = loadStore();
function saveStore() {
  try { localStorage.setItem(ADDONS_KEY, JSON.stringify(store)); return true; }
  catch (e) { say("⚠ " + (e && e.message || e)); return false; }
}
const runtime = new Map();      // id → { def, api }
const fileAddons = [];          // index.html の <script> から来たアドオン
const songsByAddon = new Map(); // id → 曲の配列
const slots = new Map();        // 置き場所
let collecting = null;          // いま走っているコードが register() したぶん
let pendingReload = false;

/* ============ 画面まわり ============ */
function say(text, isError) {
  const box = $("addonStatus");
  if (box) { box.textContent = String(text || ""); box.classList.toggle("ng", !!isError); }
}
function downloadText(text, filename) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type:"text/javascript" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  } catch (e) { say("⚠ " + (e && e.message || e), true); }
}
/* セーフモード中は、アドオンを読み込まない。
   印は core.js（window.TrkSafeMode）から。URLのほうは、処理前に見るための保険です */
const safeNow = () => {
  try { if (typeof window.TrkSafeMode === "function" && window.TrkSafeMode()) return true; } catch (_) {}
  try {
    const u = new URL(location.href), sp = u.searchParams;
    return sp.has("safe") || sp.get("safe") === "1" || (u.hash || "").toLowerCase().includes("safe") || sp.has("factory");
  } catch (_) { return false; }
};
const appPhase = () => (typeof phase === "string" ? phase : "");

/* ============ 置き場所（アドオンがUIを足せる場所） ============ */
function mountSlots() {
  const mk = (name, host, put) => {
    if (!host) return;
    const box = el("div", "addonSlot"); box.dataset.addonSlot = name;
    put(host, box);
    slots.set(name, box);
  };
  mk("settings", $("addonSlots"), (h, d) => h.append(d));
  mk("libPanel", $("libPanel"), (h, d) => { const st = $("libStatus"); if (st) st.before(d); else h.append(d); });
  /* 📺🎛 の「くわしい」は、並べ替えで列の下のほうへ移ることがある（Task E）。どちらでも見つける */
  mk("tvMore", document.querySelector("#tvDock .tvMore") || document.querySelector(".songCol > details.tvMore"), (h, d) => h.append(d));
  mk("rackMore", document.querySelector("#fxDock .dockMore") || document.querySelector(".songCol > details.dockMore"), (h, d) => h.append(d));
  /* 置き場所に何も無いときは、場所ごと隠す（画面を静かに保つ） */
  const hide = () => slots.forEach(box => { box.hidden = !box.children.length; });
  hide();
  const mo = new MutationObserver(hide);
  slots.forEach(box => mo.observe(box, { childList:true }));
}

/* ============ アドオンを動かす ============ */
function register(def) {
  if (!def || typeof def !== "object") throw new Error("register(def) にはオブジェクトを渡してください");
  const id = String(def.id || "").trim();
  if (!/^[a-z0-9][a-z0-9._-]{1,39}$/i.test(id)) throw new Error("id は英数字と . _ - で2〜40文字にしてください");
  const norm = {
    id,
    name: String(def.name || id),
    version: String(def.version || "0"),
    apiVersion: Number(def.apiVersion || API_VERSION),
    author: String(def.author || ""),
    description: String(def.description || ""),
    setup: typeof def.setup === "function" ? def.setup : null,
    teardown: typeof def.teardown === "function" ? def.teardown : null
  };
  if (collecting) { collecting.push(norm); return norm; }
  /* index.html に <script src> で書いたアドオン：その場で動かす */
  if (fileAddons.some(d => d.id === norm.id)) return norm;
  fileAddons.push(norm);
  startAddon(norm, null);
  renderList();
  return norm;
}
function runCode(code) {
  collecting = [];
  let err = null;
  try { (0, eval)(code); } catch (e) { err = e; }
  const got = collecting;
  collecting = null;
  if (err) throw err;          // 構文エラー・実行時エラーは、そのまま呼び出し元へ
  return got;
}
function makeApi(id) {
  return Object.freeze({
    apiVersion: API_VERSION,
    id,
    tr: (key, vars) => tr(key, vars),
    log: (...a) => console.log("[addon:" + id + "]", ...a),
    el, $: elemId => document.getElementById(elemId),
    addStyle(css) {
      const s = document.createElement("style");
      s.dataset.addon = id; s.textContent = String(css || "");
      document.head.append(s); return s;
    },
    on: (ev, fn) => on(ev, fn),
    emit: (ev, data) => emit(ev, data),
    slot: name => slots.get(name) || null,
    say: text => say("🧩 " + id + "：" + text),
    settings, savePrefs: () => saveUserPrefs(),
    video: () => document.getElementById("video"),
    phase: appPhase,
    addSongs: list => setSongs(id, list),
    fx: {
      available: () => !!(window.TrkFX && typeof window.TrkFX.tapElement === "function"),
      tapElement: mediaEl => (window.TrkFX && typeof window.TrkFX.tapElement === "function") ? window.TrkFX.tapElement(mediaEl) : false
    }
  });
}
function startAddon(def, entry) {
  if (def.apiVersion > API_VERSION) {
    if (entry) entry.error = tr("addonBroken", { why:"apiVersion " + def.apiVersion });
    return false;
  }
  try {
    const api = makeApi(def.id);
    if (def.setup) def.setup(api);
    runtime.set(def.id, { def, api });
    if (entry) entry.error = "";
    return true;
  } catch (err) {
    console.error("[addon:" + def.id + "]", err);
    runtime.delete(def.id);
    if (entry) entry.error = tr("addonBroken", { why:(err && err.message) || String(err) });
    return false;
  }
}
function stopAddon(id) {
  const rt = runtime.get(id);
  if (rt && rt.def.teardown) { try { rt.def.teardown(); } catch (e) { console.error(e); } }
  runtime.delete(id);
}
function setSongs(id, list) {
  const entry = store[id];
  const rt = runtime.get(id);
  const name = (entry && entry.name) || (rt && rt.def.name) || id;
  const out = (Array.isArray(list) ? list : []).slice(0, 2000).map(it => ({
    ...it,
    source: "addon",
    addonId: id,
    addonName: it.addonName || name,
    key: String(it.key || (id + ":" + (it.title || "?"))),
    title: String(it.title || it.key || "?")
  }));
  songsByAddon.set(id, out);
  syncSongs();
  renderList();
}
function syncSongs() {
  const all = [];
  for (const list of songsByAddon.values()) all.push(...list);
  if (typeof setAddonSongs === "function") setAddonSongs(all);
}

/* ============ 入れる／外す ============ */
function parseAddonFile(text) {
  const t = String(text || "");
  if (/^\s*[{[]/.test(t)) {
    try {
      const j = JSON.parse(t);
      if (j && typeof j.code === "string") {
        return { code:j.code, meta:{ name:j.name, author:j.author, description:j.description, version:j.version, apiVersion:j.apiVersion, format:j.format } };
      }
      if (j && j.format === ADDON_FORMAT) return { code:"", meta:j, why:"code がありません" };
    } catch (e) { return { code:t, meta:{}, why:"JSON として読めませんでした：" + e.message }; }
  }
  return { code:t, meta:{} };
}
function installText(text, filename) {
  const filename2 = String(filename || "(text)");
  const parsed = parseAddonFile(text);
  const code = parsed.code;
  if (!code || !code.trim()) return { ok:false, why:parsed.why || "中身が空です" };
  if (code.length > MAX_CODE) return { ok:false, why:tr("addonTooBig", { n:Math.floor(MAX_CODE / 1024) }) };
  let defs;
  try { defs = runCode(code); }
  catch (e) { return { ok:false, why:"コードが動きませんでした：" + ((e && e.message) || e) }; }
  if (!defs || !defs.length) return { ok:false, why:tr("addonNoRegister") };
  const def = defs[0];
  const old = store[def.id];
  const entry = {
    id: def.id,
    name: def.name || parsed.meta.name || def.id,
    version: def.version || parsed.meta.version || "0",
    author: def.author || parsed.meta.author || "",
    description: def.description || parsed.meta.description || "",
    apiVersion: def.apiVersion || parsed.meta.apiVersion || API_VERSION,
    enabled: old ? !!old.enabled : true,
    code,
    source: "installed",
    file: filename2,
    addedAt: (old && old.addedAt) || Date.now(),
    error: ""
  };
  store[def.id] = entry;
  saveStore();
  if (entry.enabled) startAddon(def, entry);
  pendingReload = true;
  saveStore();
  renderList(); updateReload();
  say(tr("addonInstalled", { name:entry.name }) + " " + tr("addonNeedReload"));
  return { ok:true, id:def.id, name:entry.name };
}
function setEnabled(id, on) {
  const e = store[id];
  if (!e) return false;
  e.enabled = !!on;
  if (!e.enabled) stopAddon(id);
  saveStore();
  pendingReload = true;
  renderList(); updateReload();
  say(tr(e.enabled ? "addonToggledOn" : "addonToggledOff", { name:e.name }));
  return true;
}
function removeAddon(id) {
  const e = store[id];
  if (!e) return false;
  stopAddon(id);
  songsByAddon.delete(id); syncSongs();
  delete store[id];
  saveStore();
  pendingReload = true;
  renderList(); updateReload();
  say(tr("addonRemoved", { name:e.name }));
  return true;
}

/* ============ パネルの絵 ============ */
function row(entry) {
  const box = el("div", "addonRow" + (entry.enabled ? "" : " off"));
  const head = el("div", "addonHead");
  const on = entry.enabled !== false;
  const bits = [
    el("span", "addonDot" + (on ? " on" : "") + (entry.error ? " ng" : "")),
    el("b", "addonName", entry.name || entry.id),
    el("span", "addonVer", "v" + (entry.version || "0"))
  ];
  if (entry.author) bits.push(el("span", "addonAuthor", "by " + entry.author));
  if (entry.source === "file") bits.push(el("span", "addonBadge", tr("addonFromFile")));
  head.append(...bits);
  box.append(head);
  if (entry.description) box.append(el("div", "hint", entry.description));
  if (entry.id && songsByAddon.has(entry.id) && songsByAddon.get(entry.id).length) {
    box.append(el("div", "hint", tr("addonSongs", { n:songsByAddon.get(entry.id).length })));
  }
  if (entry.error) box.append(el("div", "hint addonErr", tr("addonBroken", { why:entry.error })));
  if (entry.source !== "file") {
    const acts = el("div", "miniActions");
    const tg = el("button", "", tr(on ? "addonOff" : "addonOn")); tg.type = "button";
    tg.addEventListener("click", () => setEnabled(entry.id, !on));
    const del = el("button", "", tr("addonDelete")); del.type = "button";
    del.addEventListener("click", () => { if (confirm("🧩 " + entry.name + " / " + tr("addonDelete") + "?")) removeAddon(entry.id); });
    acts.append(tg, del);
    box.append(acts);
  }
  return box;
}
function renderList() {
  const box = $("addonList"); if (!box) return;
  box.textContent = "";
  const entries = Object.values(store).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  if (!entries.length && !fileAddons.length) { box.append(el("div", "hint", tr("addonNone"))); return; }
  for (const e of entries) box.append(row(e));
  for (const d of fileAddons) box.append(row({ ...d, source:"file", enabled:true }));
}
function updateReload() {
  const b = $("addonReloadBtn");
  if (b) b.hidden = !pendingReload;
}

/* ============ 起動 ============ */
function boot() {
  if (safeNow()) { say(tr("addonSafe")); return; }
  for (const entry of Object.values(store)) {
    if (!entry.enabled || !entry.code) continue;
    let defs;
    try { defs = runCode(entry.code); }
    catch (e) { entry.error = tr("addonBroken", { why:(e && e.message) || String(e) }); continue; }
    const def = (defs || []).find(d => d.id === entry.id) || (defs || [])[0];
    if (!def) { entry.error = tr("addonNoRegister"); continue; }
    entry.name = def.name || entry.name;
    entry.version = def.version || entry.version;
    entry.author = def.author || entry.author;
    entry.description = def.description || entry.description;
    if (!startAddon(def, entry)) console.warn("[addon:" + entry.id + "]", entry.error);
  }
  saveStore();
}
addEventListener("DOMContentLoaded", () => {
  mountSlots();
  const fileInput = $("addonInstallFile");
  if (fileInput) fileInput.addEventListener("change", async e => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    let text = "";
    try { text = await f.text(); } catch (err) { say(tr("addonBadFile", { why:(err && err.message) || err }), true); return; }
    const res = installText(text, f.name);
    if (!res.ok) say(tr("addonBadFile", { why:res.why }), true);
  });
  const sample = $("addonSampleBtn");
  if (sample) sample.addEventListener("click", async () => {
    let code = "";
    try { const r = await fetch(SAMPLE_URL, { cache:"no-store" }); if (r.ok) code = await r.text(); } catch (_) {}
    if (!code) { say(tr("addonSampleFail"), true); return; }
    downloadText(code, "trk-addon-example.js");
    say(tr("addonSampleSaved"));
  });
  const reload = $("addonReloadBtn");
  if (reload) reload.addEventListener("click", () => location.reload());
  renderList(); updateReload();
  boot();
  on("language", () => { renderList(); updateReload(); });
});

/* ============ 窓口 ============ */
window.TrkAddons = Object.freeze({
  version: 1,
  apiVersion: API_VERSION,
  format: ADDON_FORMAT,
  key: ADDONS_KEY,
  register,
  list: () => Object.entries(store).map(([id, e]) => ({
    id, name:e.name, version:e.version, author:e.author, description:e.description,
    enabled:!!e.enabled, error:e.error || "", source:e.source || "installed"
  })),
  active: () => [...runtime.keys()],
  install: (text, name) => installText(text, name || "(text)"),
  setEnabled, remove: removeAddon,
  slots: () => [...slots.keys()],
  songs: id => (songsByAddon.get(id) || []).slice(),
  panel() { const p = $("addonPanel"); if (p) { p.open = true; try { p.scrollIntoView({ behavior:"smooth", block:"start" }); } catch (_) {} } },
  docs: "docs/ADDONS.md"
});
})();
/* ✅ addons.js 完了 */
