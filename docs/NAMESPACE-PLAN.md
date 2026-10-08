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
| B 非公開を包む | 他から使われない名前だけを即時関数で包む。公開名は大域のまま | 変えない | 着手 |
| C 旗を集約 | `window._trk*Open` などを `window.Trk` 配下の一つの関数・状態へ | 読み手を書き換える | 未着手 |
| D 公開名を移す | 公開名を `window.Trk.<領域>` へ移し、呼び出し側を書き換える（領域ごと） | 段階的 | 未着手 |
| E 文書化 | `docs/ADDONS.md` に、アドオンが使ってよい公開 API を明記 | — | 未着手 |

### B の進め方（規則）

- **1 ファイル 1 コミット**。そのファイルの宣言が private だけ（または公開名を据え置く）ことを監査で確かめてから包む。
- 包み方：ファイルの先頭に `(() => {`、末尾に `})();` を足す。**中身は字下げし直さない**（文字列検査の一致を保つため）。`"use strict"` は本体の先頭に残す。
- 包んだあとに `window.X = …` と書かれている名前は、そのまま window に載る（変わらない）。
- 公開名（他のファイルが裸の名前で読む）を包むときは、末尾で `window.NAME = NAME;` と据え置く。対象は `function`・`const`（再代入されないもの）だけ。`let`・`var` で再代入される名前は、値が古くなるので据え置かない（そのファイルは後の段階へ回す）。
- 包んだ直後は、そのファイルの中身を文字列で読んでいる検査（`tools/check-*.mjs`）が「包みの先頭」で壊れないかを必ず確かめる。
- 順番：`study-room.js`（公開は `window.TrkStudyRoom` だけ）→ `tv-rich.js` → `pad.js` → `main.js` → `library.js` の順に小さいものから。
- **触らない**：`js/fx.js`・`js/fx-presets.js`（凍結）。
- 各コミットの後：`npm run check`・`npm test`・スモーク `--compare`・監査の数の変化を記録。`sw.js` のキャッシュ名は、公開コードを変えたコミットごとに上げる。

### C 以降の注意

- `window._trk*Open` の旗は、読み手が 13 以上ある。一つの関数（例：`Trk.isModalOpen()`）に置き換えるとき、既存の文字列検査（`tools/check-study-room.mjs`・`tools/check-repo.mjs` の `"window._trkStudyRoomOpen"`）を同時に直す。
- 公開名の移動（D）は、裸の識別子を書き換える必要がある。字句処理で範囲を確かめ、書き換えた箇所の数を記録する。書き換え漏れは、監査（「公開なのに裸で参照されている」）とスモークで捕まえる。

### B の進捗

| 回 | 対象 | トップレベル宣言 | 公開名 | 基準・結果 |
|---|---|---|---|---|
| 0 | （準備の時点） | 1169 | 316 | 基準 `40122ea` |
| 1 | `js/study-room.js` を即時関数で包む（公開は `window.TrkStudyRoom` のまま） | 927 | 316 | スモーク OK。window から消えた `study*` 関数は他から使われていないもの（報告のみ） |
| 2 | `js/tv-rich.js`（公開 0）・`js/pad.js`（公開 2：`padBack`・`updatePadUI`）を包む。pad の 2 件は末尾で `window.padBack = padBack;` のように据え置く | 881 | 314（うち 2 件は window 経由に移った） | スモーク OK。`check-security.mjs` の M-03 検査は、包みの先頭を外して同じ関数を動かすように直した（検査の中身は同じ） |

## 4. 止める条件

- スモーク `--compare` が NG で、原因が説明できない。
- `npm run check`・`npm test` が落ちる（文字列検査の変更を伴う場合を除く）。
- 譜面（10 ケース）のハッシュが変わる。
- `js/fx.js`・`js/fx-presets.js` に変更が必要になった。

## 5. 残るリスク（正直に）

- スモークは「押したボタン」しか見ていない。押していない経路の実行時エラーは検出できない。
- 字句処理は簡易版。正規表現リテラルや特殊な構文で誤判定の可能性がある（誤判定は「公開」側へ倒れるので、包んで壊す方向の誤りは検査で止まる）。
- 実機（Android Chrome・タッチ・IndexedDB・実曲の音）の確認は、この作業の対象外で、従来どおり HANDOFF §7 に残す。
