# 名前空間の整理（レビュー項目4）— 計画と安全網

> 対象：レビュー `docs/REVIEW-2026-10-08.md` の項目 4「グローバル名前空間が限界に近い」。
> 目的：**動きを変えずに**、大域に置かれている名前を減らし、外へ出すものを `window.Trk.*` に集める。新機能は入れない。

## 1. 現状（`node tools/globals-audit.mjs` の結果）

| 項目 | 数 |
|---|---|
| classic script（index.html の読み込み順） | 45 |
| トップレベル宣言（function／const／let／var／class） | 1169 |
| うち、他のファイルから使われない（private） | 853 |
| うち、他のファイルから使われる（public） | 316 |
| 同名の別ファイル宣言（衝突） | 0 |
| window のプロパティを介した連携（書いて別ファイルが読む） | 26 |

- インラインのイベント属性（`onclick="…"`）は `index.html` に**無い**。イベントは JS から配線している。
- `window._trk*Open` の旗（書斎・シンス・メディアプレーヤーを開いているか）は、13 以上のファイルが読んでいる。これは裸の名前ではなく window の性質なので、棚卸しで別に数える。
- `window.TrkFX`・`window.TrkSafeMode`・`window.TrkStudyRoom` などは、すでに名前空間として使われている。

## 2. 安全網（この順に用意済み）

| 道具 | 何を守るか | 実行 |
|---|---|---|
| `npm run check`・`npm test` | 静的な約束（文字列の検査・セキュリティ・4言語・a11y・node:test） | 常時 |
| `tools/globals-audit.mjs` | 宣言の数・使われ方・衝突・window 連携の変化 | `node tools/globals-audit.mjs`（基準は `tests/fixtures/globals-baseline.json`） |
| `tests/globals-audit.test.mjs` | 棚卸しの字句処理（コメント・文字列・テンプレート・正規表現・即時関数） | `npm test` に含む |
| `tools/smoke-browser.mjs` | 実ブラウザで、起動エラー・実行時に解決できない名前・譜面（生成方式×難易度）のハッシュ・全ボタンのクリック時のエラー | 下記（環境変数が必要） |

### スモーク検査の実行

ブラウザは依存に入れていない。環境変数で Chromium と puppeteer-core を指定する。

```sh
SMOKE_CHROME=/path/to/chromium \
SMOKE_CHROME_ARGS='["--no-sandbox"]' \
SMOKE_PUPPETEER=/path/to/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js \
node tools/smoke-browser.mjs --compare
```

- `--write` で基準（`tests/fixtures/smoke-baseline.json`）を作る。**名前空間の変更の前に一度だけ**作り、以後は `--compare` で比べる。
- 基準に入っている既知のエラー：ヘッドレス環境で `trk-dynEQ` の AudioWorklet が登録されない（`ampStackRadio` を押したとき）。実機では出ない想定で、基準として許容する。
- 譜面が変わったら NG。意図した変更なら、理由を書いて基準を作り直す。
- window の名前の増減は**報告のみ**（移行で意図して変わるため）。

### 検査が失敗することの確認（変異テスト）

- 譜面の定数を 1 つ変える → 譜面の NG を検出（確認済み）
- `js/title-match.js` を即時関数で包む → `plSongMatchKeys is not defined` を検出（確認済み）
- 監査の「深さ0だけを数える」条件を外す → `tests/globals-audit.test.mjs` が落ちる（確認済み）

## 3. 手順（段階。各段階の後に安全網を全部通す）

| 段階 | 内容 | 公開名 | 状態 |
|---|---|---|---|
| A 準備 | 棚卸し・スモーク基準・字句処理の検査・計画 | 変えない | 完了 |
| B 非公開を包む | 他から使われない名前だけを即時関数で包む。公開名は大域のまま（据え置きは `window.NAME = NAME`） | 変えない | 完了（私有の名前は全て包んだ。包んでいないファイルは公開名だけ：`i18n.js`・`tv-presets.js`・`catalog.js`・`title-match.js`、凍結の `fx-presets.js` は触らない） |
| C 旗を集約 | `window._trk*Open` などを `window.Trk` 配下の一つの関数・状態へ | 読み手を書き換える | 完了（書斎・メディアプレーヤー・シンスの 3 旗を `window.Trk.overlay` に集約。下の「C の進捗」） |
| D 公開名を移す | 公開名を `window.Trk.<領域>` へ移し、呼び出し側を書き換える（領域ごと） | 段階的 | 未着手。**方針（利用者の決定）：旧名は別名として残す**。ただし別名だけでは大域の名前数（317）は減らない。減らすには呼び出し側を `window.Trk.*` に書き換えてから別名を外す（後の段階） |
| E 文書化 | `docs/ADDONS.md` に、アドオンが使ってよい公開 API を明記 | — | 未着手 |

### B の進め方（規則）

- **1 ファイル 1 コミット**。そのファイルの宣言が private だけ（または公開名を据え置く）ことを監査で確かめてから包む。
- 包み方：ファイルの先頭に `(() => {`、末尾に `})();` を足す。**中身は字下げし直さない**（文字列検査の一致を保つため）。`"use strict"` は本体の先頭に残す。
- 包んだあとに `window.X = …` と書かれている名前は、そのまま window に載る（変わらない）。
- 公開名（他のファイルが裸の名前で読む）を包むときは、末尾で `window.NAME = NAME;` と据え置く。対象は `function`・`const`（再代入されないもの）だけ。`let`・`var` で再代入される名前は、値が古くなるので「据え置き」の代入では出さない。**実施：`Object.defineProperty(window, …)` の get/set で、元の変数を読み書きする形にした**（値は常に一致する）。当初の「後の段階へ回す」からの変更（理由：`core.js` など再代入の多いファイルで、後回しにすると B が終わらないため）。
- 包んだ直後は、そのファイルの中身を文字列で読んでいる検査（`tools/check-*.mjs`）が「包みの先頭」で壊れないかを必ず確かめる。
- 順番：`study-room.js`（公開は `window.TrkStudyRoom` だけ）→ `tv-rich.js` → `pad.js` → `main.js` → `library.js` の順に小さいものから。
- **触らない**：`js/fx.js`・`js/fx-presets.js`（凍結）。
- 各コミットの後：`npm run check`・`npm test`・スモーク `--compare`・監査の数の変化を記録。`sw.js` のキャッシュ名は、公開コードを変えたコミットごとに上げる。

- **差し替えられる関数**（後から別のファイルが `名前 = function …` で上書きする）は、窓の名前を get/set のアクセサにする（`Object.defineProperty(window, "名前", { get, set })`）。値のコピー（`window.X = X;`）だと、ファイル内部の呼び出しに差し替えが届かない（B 段階の欠陥。下の「回帰修正」を参照）。`tools/check-repo.mjs` の `PATCHED_FUNCTIONS` が見張る。

### C 以降の注意

- `window._trk*Open` の旗は、読み手が 13 以上ある。一つの関数（例：`Trk.isModalOpen()`）に置き換えるとき、既存の文字列検査（`tools/check-study-room.mjs`・`tools/check-repo.mjs` の `"window._trkStudyRoomOpen"`）を同時に直す。
- 公開名の移動（D）は、裸の識別子を書き換える必要がある。字句処理で範囲を確かめ、書き換えた箇所の数を記録する。書き換え漏れは、監査（「公開なのに裸で参照されている」）とスモークで捕まえる。

### B の進捗

| 回 | 対象 | 大域に残る名前（監査） | 全宣言（不変） | 基準・結果 |
|---|---|---|---|---|
| 0 | （準備の時点） | 1169 | 1169 | 基準 `40122ea` |
| 1 | `js/study-room.js` を即時関数で包む（公開は `window.TrkStudyRoom` のまま） | 927 | 1169 | スモーク OK。window から消えた `study*` 関数は他から使われていないもの（報告のみ） |
| 2 | `js/tv-rich.js`（公開 0）・`js/pad.js`（公開 2：`padBack`・`updatePadUI`）を包む。pad の 2 件は末尾で `window.padBack = padBack;` のように据え置く | 883 | 1169 | スモーク OK。`check-security.mjs` の M-03 検査は、包みの先頭を外して同じ関数を動かすように直した（検査の中身は同じ） |
| 3 | `js/lite.js`（公開 4：`liteLibRows`・`liteNoAnalyze`・`liteMascotNoLoad`・`liteSyncUI` を据え置き）を包む | 845 | 1169 | スモーク OK。`check-lite.mjs` は、包みを外して評価するように直した（120 件すべて通過） |
| 4 | `js/main.js`（公開 6：`RESERVED`・`packsReady`・`poke`・`showFxPower`・`syncOptionsUI` は据え置き、`idleTimer` は `let` のため getter/setter で window に出す） を包む | 810 | 1169 | スモーク OK（報告：window 増 6 件・減 214 件。減は他から参照されていない関数。未解決の名前 0）。`let` の公開は据え置きの値ではなく get/set にする |
| 5 | `js/library.js`（公開 25：`let` の `addonSongs`・`libView` は get/set、それ以外は据え置き）を包む | 585 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。公開名の数は 304 → 279 で、library.js の公開 25 件と一致。`plWishMatch` は `metaOf` を使うため library.js に残す（言語版の照合は `title-match.js` 側） |
| 6 | `js/custom.js`（公開 11 を据え置き。`let` は無し）を包む。`"use strict"` は包みの先頭文のまま | 531 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 7 | `js/modes.js` を即時関数で包む（公開19名は据え置き） | 493 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 8 | `js/game.js` を即時関数で包む（公開27名のうち let は get/set、それ以外は据え置き） | 458 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 9 | `js/render.js` を即時関数で包む（公開12名：let は get/set、それ以外は据え置き） | 431 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 10 | `js/catch.js` を即時関数で包む（公開8名は据え置き） | 410 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 11 | `js/stage.js` を即時関数で包む（公開11名：let の stageBinding は get/set、それ以外は据え置き） | 397 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 12 | `js/truck.js` を即時関数で包む（公開15名：let の truckBinding は get/set、それ以外は据え置き） | 388 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 13 | `js/media.js` を即時関数で包む（公開18名：let の audioCtx は get/set、それ以外は据え置き。譜面生成の関数も据え置き） | 381 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 14 | `js/data.js` を即時関数で包む（公開28名は据え置き。テスト補助 tests/helpers/browser-data.mjs は sb.window から DIFFS を取るように直した） | 377 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 15 | `js/fx-dock.js` を即時関数で包む（公開0） | 376 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 16 | `js/chart-gen.js` を即時関数で包む（公開2名（buildChartNotes・cgEstimateLevel）と、テスト用の cgAllocate を据え置き。テストは ctx.window から読む） | 361 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`npm run check`・`npm test`・`git diff --check` OK |
| 17 | `js/core.js`（ハブ。公開 116 名は据え置き。`let` は get/set、`const`・`function` は据え置き。私有 44 名は包みの中に残す） | 317 | 1169 | スモーク OK（未解決の名前 0・譜面 10 件一致）。`window.screen` と衝突する名前が 1 つある（`screen`、ゲームの画面状態）。段階 D で改名する対象。監査の数え方を直した後（`1122f98`）に包んだ |

### C の進捗

- 旗 3 つ（`window._trkStudyRoomOpen`・`window._trkMediaPlayerOpen`・`window._trkSynthModeOpen`）を `window.Trk.overlay` に置き換えた。API は `set(name, bool)`・`is(name)`・`any()`（名前は `"study"`・`"media"`・`"synth"`）。定義は `js/core.js`。
- 読み手 21 箇所（`is`・`any`）と書き手 7 箇所（`set`）を書き換えた。旗の値は真偽値のみで、`=== true` で読むので、旧い `undefined`（未設定）の扱いも同じ。
- **例外：`js/fx.js` は凍結（HANDOFF の制約）なので書き換えず、読み手 1 箇所（`window._trkStudyRoomOpen`）を残した。** `core.js` に読み取り専用の互換アクセサ（`Object.defineProperty(window, "_trkStudyRoomOpen", { get })`）を置き、書斎の開閉を映す。fx.js を書き換えた後に、この互換を外す（段階 D の後で判断）。
- `tools/check-study-room.mjs` に「旧い旗が残っていないこと」（fx.js と core.js の互換だけ例外）の検査を追加。旧コードと変異（旗を一つ戻す）の両方で落ちることを確認。
- 検査：`check-repo.mjs`（pad の文字列）・`check-study-room.mjs`（書斎の鍵止め）を新しい書き方に直した。ヘッドレス Chromium で、書斎とシンスの開閉が `overlay` に反映されること、互換アクセサの値が書斎の開閉に合うことを確認（未知の名前・`toString` は false、ページエラーなし）。
- 残した連携（旗ではない）：`window._trkMediaPlayerMode`・`window._trkCloseSynth`・`window._trkSyncSynthModeSettings`・`window.__trkPendingTvDockSkin`。次の段階で扱う。

### 回帰修正（B の欠陥・D の前に）

- 症状：後から読み込まれるファイルが、関数を代入で差し替えていた（`window.X = …` を含む）。B 段階で包んだあと、窓の値のコピーになり、ファイル内部の呼び出し（例：`library.js` の `renderLib()` 十数箇所）が差し替えを見なくなった。
- 対象（14 件・旧版と差し替えの元）：`activeMods`（stage.js・catch.js）、`applySkin`（main.js）、`videoFilter`（tv-dock.js）、`installPackFile`・`sanitizeSong`・`getPackSongs`・`renderPackList`（verified.js）、`showJudge`（stagefx.js）、`gameTime`（fx.js）、`renderLib`・`renderBanner`（verified.js）、`chartToData`・`applyChartData`（fx.js）、`drawVideo`（tv-dock.js）。

- 確認：ヘッドレス Chromium で、`window.renderLib` を見張り関数に差し替えてから一覧の並べ替え（`libSort` の change）を発火させる。旧版 `ca84a19` は 1 回、B 段階の HEAD は 0 回（回帰）。修正後は 1 回（一致）。
- 修正（`trk55` で 5 件、`trk56` で残り 9 件）：窓の値のコピー（`window.X = X;`）を `Object.defineProperty(window, "名前", { get, set })` に変えた。対象ファイル：`js/core.js`・`js/custom.js`・`js/game.js`・`js/library.js`・`js/media.js`・`js/render.js`。`window.drawVideo`・`window.videoFilter` の差し替えを内部の呼び出しに届かせる。ヘッドレスで `renderLib` の内部呼び出しが旧版と一致（1 回）、書斎・シンスの開閉（`overlay-probe`）も OK。`npm run check`・`npm test`（44/44）・スモーク `--compare`（未解決 0・譜面 10 件一致・クリックエラー 1 は基準と同じ）・`git diff --check` OK。
- 検査：`tools/check-repo.mjs` の `PATCHED_FUNCTIONS`（14 件）に「窓のアクセサ」の検査を追加。アクセサを値のコピーへ戻すと失敗することを確認（逆テスト）。
- D 段階の規則：差し替えられる名前（`名前 = …`・`window.名前 = …`・`名前++`・for-in/of の左辺で、宣言していないファイルから触られるもの）は、Trk と窓の両方をアクセサにする。凍結の `js/fx.js` は書き換えず、窓のアクセサで届く。

### D の進捗（領域ごと。利用者の承認：「Dを領域ごとですね〜」）

各段階：`node --check`・`npm run check`・`npm test`・スモーク `--compare`・`git diff --check`・`sw.js` を上げる・`tools/check-repo.mjs` の登録検査（`TRK_REGISTRARS`）。書き換えは AST（acorn）で判定し、凍結（`js/fx.js`・`js/fx-presets.js`）は書き換えない。

- **登録の置き場所は、領域で読み込み順に最後のファイルの末尾**（play は `render.js`、modes は `catch.js`）。書き換えは、その置き場所より後に読み込まれるファイルだけ（起動時の順序を変えないため）。前のファイルの裸の参照は、窓の別名で動く（D の残り：将来、遅延する関数の中だけでも書き換えられる）。先頭のファイルに置くと、後から読み込まれるファイルの名前を値として読む時点で ReferenceError になり、包みの末尾まで届かない（play で一度起きた。スモークの起動エラーで見つかり、試行は捨てて HEAD に戻した）。

| 領域 | 登録元 | 登録（window.Trk.領域） | 書き換え（件数） | sw.js | 結果 |
|---|---|---|---|---|---|
| chart | `js/chart-gen.js` | `buildChartNotes`・`cgEstimateLevel`・`cgAllocate`（値のコピー） | 2（`js/media.js`） | trk57 | 登録検査は、登録の無い HEAD で失敗（確認）→ 適用後に通る。1 名だけ抜いた逆テストで失敗（確認）。スモーク OK（未解決 0・譜面 10 件一致） |
| pad | `js/pad.js` | `padBack`・`updatePadUI`（値のコピー） | 0 | trk58 | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。スモーク OK |
| lite | `js/lite.js` | `liteLibRows`・`liteNoAnalyze`・`liteMascotNoLoad`・`liteSyncUI`（値のコピー） | 0 | trk59 | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。スモーク OK |
| main | `js/main.js` | `RESERVED`・`packsReady`・`poke`・`showFxPower`・`syncOptionsUI`（値のコピー）・`idleTimer`（アクセサ） | 4 | trk60 | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。書き換えは speed.js 3・vrm.js 1。スモーク OK |
| custom | `js/custom.js` | `initPacks`・`noteImage`・`packDB`・`packRuntime`・`skinShelf`・`syncNoteUI`・`updateMascotUI`（値のコピー）、`installPackFile`・`sanitizeSong`・`getPackSongs`・`renderPackList`（アクセサ。verified.js が差し替える） | 21（追補で代入の左辺 4 件を加えた） | trk61・trk62（追補） | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。差し替えの 4 名は窓と Trk の両方をアクセサ。追補：代入の左辺（`verified.js` の `installPackFile = …` など）が書き換えられていなかったのを直した（acorn-walk は左辺を `VariablePattern` として走査する）。スモーク OK |
| library | `js/library.js` | 公開名のうち値のコピー、`addonSongs`・`libView`・`renderLib`・`renderBanner`（アクセサ。verified.js などが差し替える）。title-match.js の 4 関数も登録 | 31 | trk63 | 登録検査（title-match.js の関数も対象に広げた。失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。スモーク OK |
| media | `js/media.js` | `CHART_FILE_MAX`・`buildChart`・`decodeAudio`・`estimateLevel`・`exportChart`・`generateNotes`・`getAC`・`importChartFile`・`loadMedia`・`loadSE`・`playSE`・`rmsAt`・`seBuffers`・`seFiles`・`setBackground`（値のコピー）、`applyChartData`・`chartToData`・`audioCtx`（アクセサ。fx.js が凍結のまま差し替える） | 62 | trk64 | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。js/fx.js は未変更（凍結）。スモーク OK |
| data | `js/data.js` | 29 名（`DIFFS`・`DIFF_IDS`・`SKINS`・`NOTE_PRESETS`・`buildCustomSkin`・`hexToRgba` など。すべて値のコピー） | 219 | trk65 | 登録検査（失敗→適用後に通る）。1 名抜いた逆テストで失敗（確認）。検査の文字列照合（check-repo の SKINS 数・check-security の形の検査）は window.Trk.<領域>. を除いた本文で見るように直した（見る条件は変えていない）。スモーク OK |
| play | `js/render.js` | game.js・render.js の公開名（`PLAY_KEYS`・`startGame`・`judgeNote` など、値のコピー）。アクセサは `gameTime`・`showJudge`・`drawVideo`・`retryHoldAt`・`toast`・`goAt`・`leadIn` など | 147 | trk66 | 登録は領域で最後に読み込まれる render.js の末尾（game.js の末尾に置いたら、render.js の名前を読む時点で ReferenceError になり、起動が止まった：その試行は捨てて HEAD に戻した）。書き換え 147。登録検査（render.js・TRK_EXTRAS で game.js の窓の名前も対象）。1 名抜いた逆テストで失敗（確認）。スモーク OK |
| modes | `js/catch.js` | modes.js・truck.js・stage.js・catch.js の公開名 54（値のコピー。`truckBinding`・`stageBinding` は let のためアクセサ） | 27 | trk67 | 登録は領域で最後に読み込まれる catch.js の末尾。登録より前に読み込まれる stagefx.js などの裸の参照は書き換えない（起動時の順序を変えないため。窓の別名で従来どおり動く＝残り）。登録検査（catch.js・TRK_EXTRAS で modes/truck/stage の窓の名前も対象）。1 名抜いた逆テストで失敗（確認）。スモーク OK |
| core | `js/core.js` | 116 名（`let` 約 40 名はアクセサ、差し替えられる `activeMods`・`applySkin`・`videoFilter` などはアクセサ、残りは値のコピー）。`_trkStudyRoomOpen`（互換の読み取り専用）は登録しない | 6013 | trk68 | 登録は core.js の末尾（読み込み順で領域の最初。core 以外の領域の名前は、この後の登録で出る）。書き換え 6013（代入の左辺を含む。core.js より後に読み込まれるファイルだけ）。検査：check-repo・check-security・check-lite・check-study-room の文字列照合は window.Trk.<領域>. を除いた本文で見る（overlay は除かない）。check-lite の仮想環境に window.Trk.core を用意。1 名抜いた逆テストで失敗（確認）。スモーク OK。ヘッドレス（差し替え・書斎/シンス）OK |
| study（別名） | `js/study-room.js` | `window.Trk.study = window.TrkStudyRoom;`（凍結のオブジェクトの同じ参照。登録ではなく別名） | 0 | trk69 | 検査（`check-repo.mjs` の別名検査）：無い状態で失敗→追加後に通る。行を消す逆テストで失敗（確認）。スモーク OK |


大域の名前（監査）は 317 のまま。旧名（window.X）は別名として残す方針（利用者の決定）のため、減るのは別名を外したときだけ。Trk 側の正規の場所は `window.Trk.<領域>`（監査の window 経由の連携に `window.Trk` が 12 ファイルから書かれる）。
残りの領域は無し（11 領域の登録・書き換えは完了）。未決：`screen`（window.screen と衝突）の扱い。HANDOFF §7 の実機確認は別途。HANDOFF §7 の実機確認は別途。

## 4. 止める条件

- スモーク `--compare` が NG で、原因が説明できない。
- `npm run check`・`npm test` が落ちる（文字列検査の変更を伴う場合を除く）。
- 譜面（10 ケース）のハッシュが変わる。
- `js/fx.js`・`js/fx-presets.js` に変更が必要になった。

## 5. 残るリスク（正直に）

- スモークは「押したボタン」しか見ていない。押していない経路の実行時エラーは検出できない。
- 字句処理は簡易版。正規表現リテラルや特殊な構文で誤判定の可能性がある（誤判定は「公開」側へ倒れるので、包んで壊す方向の誤りは検査で止まる）。
- 実機（Android Chrome・タッチ・IndexedDB・実曲の音）の確認は、この作業の対象外で、従来どおり HANDOFF §7 に残す。
- 監査は `tests/`・`tools/` の参照を数えない。テストが vm の文脈から裸の名前を読むと、包んだ瞬間に壊れる（`data.js`・`chart-gen.js` で実際に起きた。どちらも `window` 経由に直した）。包むときは `npm test` を必ず見る。
- `screen`（core.js）は、ブラウザ標準の `window.screen` と同じ名前。`window.screen` を読むコードは本リポジトリに無いが、大域に出すと標準の値を隠す。段階 D で改名する。
- 監査の「大域に残る名前」は、包みの中で `window.X =` または `defineProperty(window, "X", …)` と書いた名前だけを数える。包みの外の宣言は全部数える。
