# 🧩 アドオン（trk! にあとから機能を足す）

trk! 本体には入れられない機能を、あとから足せるしくみです。
しくみは [`js/addons.js`](../js/addons.js)、書き方の見本は [`js/addons/example.js`](../js/addons/example.js)。

> **大事なこと**：アドオンは、このページの中で動くプログラムです（サンドボックスではありません）。
> ページの設定・保存・音・画面のすべてに触れられます。**信頼できるものだけ**入れてください。
> 壊れて画面が開かなくなったときは、`?safe=1` で開き直すと、アドオンを読み込みません。
> 設定画面「🧩 アドオン」からも、オン/オフ・削除ができます。

---

## 1. 入れ方

| 方法 | やり方 |
|---|---|
| ファイルから | 設定画面「🧩 アドオン」→「📄 アドオンを入れる」→ `.js` か `.trkaddon`（JSON）を選ぶ |
| 配布物に入れる | `index.html` に `<script src="js/addons/○○.js"></script>` を1行足す |

- 入れたアドオンは `trk_addons_v1`（localStorage）に保存され、次に開いたときも動きます
- オン/オフ・削除のあとは、`↻ 反映して再読み込み` を押してください（読み込み直すと確実です）
- 1つのアドオンの上限は **512KB**。`id` は英数字と `. _ -` で2〜40文字

### 配布ファイルの形（`trk-addon`）

```json
{
  "format": "trk-addon",
  "version": 1,
  "name": "○○アドオン",
  "author": "名前",
  "description": "何をするか",
  "code": "TrkAddons.register({ id:'my.addon', name:'○○', setup(api){ /* … */ } });"
}
```

`.js` をそのまま「アドオンを入れる」で選んでも読めます（中身がそのままコードとして走ります）。

---

## 2. つくり方（最小）

```js
TrkAddons.register({
  id: "my.addon",            // 必須。英数字と . _ - で2〜40文字
  name: "わたしのアドオン",     // 一覧に出る名前
  version: "1.0.0",
  author: "名前",
  description: "何をするか",
  apiVersion: 1,             // 対応するAPIの版（いまは 1）
  setup(api) {               // 読み込まれたときに1回
    const box = api.el("div", "hint", "こんにちは！");
    api.slot("settings")?.append(box);
  },
  teardown() { /* 任意：外したときの後片付け */ }
});
```

`setup()` の中で `throw` したアドオンは、そのアドオンだけが無効になり（一覧に赤字でエラーが出ます）、
ほかのアドオンや本体は動き続けます。

---

## 3. `api` でできること（apiVersion 1）

| 呼び方 | 何ができる |
|---|---|
| `api.tr(key, vars)` | 本体の文章（4言語）を引く。`{n}` などの差し込みも同じ |
| `api.el(tag, cls, text)` | 要素を作る（本体の書き方と同じ） |
| `api.$(id)` | id で要素を取る |
| `api.addStyle(css)` | `<style>` を1つ足す（`data-addon="id"` が付きます） |
| `api.on(ev, fn)` / `api.emit(ev, data)` | 本体のイベントを拾う／流す |
| `api.slot(name)` | 置き場所（下の表）。無ければ `null` |
| `api.say(text)` | 設定画面のアドオン欄に、そのままの文字を出す |
| `api.settings` / `api.savePrefs()` | 設定（`shadow_taiko_preferences_v2`）を読み書きする |
| `api.video()` / `api.phase()` | 本体の `<video>` と、いまの画面（`"title"` / `"playing"` など） |
| `api.addSongs(list)` | 曲リストに曲を足す（下の「曲を足す」） |
| `api.fx.available()` | エフェクター（`TrkFX`）が使えるか |
| `api.fx.tapElement(el)` | 自分の `<audio>` / `<video>` を、本体のエフェクターに通す |
| `api.log(...)` | コンソールに出す（`[addon:id]` が付きます） |

### 置き場所（slot）

| 名前 | 場所 |
|---|---|
| `settings` | 設定画面「🧩 アドオン」の中 |
| `libPanel` | 曲リスト（`#libPanel`）の中。検索・並べ替えの下 |
| `tvMore` | 📺 テレビの「くわしい」の中 |
| `rackMore` | 🎛 ラックの「くわしい」の中 |

置き場所が空のときは、場所ごと隠れます（画面は静かなまま）。

### イベント

| 名前 | いつ |
|---|---|
| `language` | 言語が変わった |
| `tvChange` / `tvSkin`（tv-dock.js 由来） | テレビの設定が変わった |
| `packsChanged` | 曲パックが増減した |
| `songSelected` | 曲が選ばれた（`data` は曲の情報） |
| `addonSelect` | **アドオンの曲**が選ばれた（自前のプレイヤーで鳴らす合図） |

---

## 4. 曲を足す（`api.addSongs`）

```js
api.addSongs([
  { key: "my:1", title: "曲名", artist: "だれか", bpm: 128, offset: 0, file: blobOrFile }
]);
```

- `file`（Blob / File）を渡すと、**本体の再生の道に、そのまま乗ります**（映像・譜面・エフェクターもいつもどおり）
- `file` を渡さない曲は、選んだときに `addonSelect` が流れます。アドオン側が自前のプレイヤーで鳴らしてください
- 足した曲は曲リストの **🧩 タブ**（`addonName`、既定はアドオン名）にまとまります。タブは自動でできます
- `key` は曲を見分けるIDです（省略すると `id:タイトル`）

> ゲームとして遊ぶには、音と譜面（タイミング）が要ります。
> `file` を渡す道がいちばん素直で、エフェクターも自動でかかります。

---

## 5. エフェクターに自分の音を通す（`api.fx.tapElement`）

```js
const audio = new Audio(url);
if (api.fx.available()) api.fx.tapElement(audio);   // 本体のEQ・エフェクター・音量に乗ります
await audio.play();
// 使い終わったら
audio.pause();
```

- 同じ要素は一度だけ（ブラウザの決まりで `createMediaElementSource` は2回呼べません）
- 外したいときは `TrkFX.untapElement(audio)`
- エフェクトがオフのときは素通し（EQはフラット）で、音量だけ本体に合わせます

---

## 6. YouTube の音にエフェクターをかけたい場合（正直な話）

- **iframe の中の音は、ブラウザの仕様で取り出せません**（クロスオリジン）。本体でもアドオンでも、同じです。
  YouTube 側もプレイヤーの改造を想定していません（規約でも、ダウンロードや抽出は禁止されています）。
- アドオンでできるのは、たとえば次のようなことです。
  - **自分の手元にある音**（端末のファイル、配布OKの素材、自分で録った音）を鳴らすプレイヤーを作り、
    `api.fx.tapElement(audio)` でエフェクターに通す
  - 映像側は **CSS フィルターなら iframe 要素そのものに当てられます**（見た目だけ）。
    本体のフィルター（CRT・走査線など）と同じ見た目を、`api.addStyle` で足す
  - 曲リストに**別の入り口**（URLを貼って自分の手元の音と結びつける、など）を足す
- つまり「本体が禁止しているからできない」のではなく、**ブラウザの決まりでできない**ところがあります。
  そこを踏まえて、できる範囲をアドオンで広げる——という考え方です。

---

## 7. 気をつけること（作者向け）

- 本体のファイル（`js/*.js`）を書き換えなくても、たいていのことは `api` で足ります。まず `api` を見てください
- 保存キー・形式名は変えない（`shadow_taiko_*`、`trk_fx_presets_v1`、`trk_tv_skins_v1`、`trk-tvskin` …）
- 新しい保存キーを使うときは、`trk_アドオン名_v1` のように**自分の名前空間**で
- コンソールエラーを出さない。`try/catch` を忘れずに
- 4言語ぶんの文章を出すときは、`api.tr` に自分のキーを足さず、はじめは英語＋日本語で十分です（自分の `TEXT` を持つ場合は `TEXT.ja` などを直接いじらず、自分のオブジェクトに持ってください）
- 権利のある素材だけを使う（This project is GPL-3.0-or-later。アドオンのライセンスは作者が決めます）

---

## 8. 窓口（コンソールから使えるもの）

```js
TrkAddons.apiVersion            // 1
TrkAddons.list()                // 入っているアドオン
TrkAddons.active()              // いま動いている id
TrkAddons.install(text, name)   // 文字列から入れる（テスト用）
TrkAddons.setEnabled(id, false) // オン/オフ
TrkAddons.remove(id)            // 外す
TrkAddons.slots()               // 使える置き場所
TrkAddons.songs(id)             // そのアドオンが足した曲
TrkAddons.panel()               // 設定画面のアドオン欄を開く
```
