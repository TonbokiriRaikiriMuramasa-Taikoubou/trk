<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# 次回セッション引き継ぎ（2026-10-05）

> 詳細な仕様・設計・手動確認項目は [`docs/HANDOFF.md`](docs/HANDOFF.md) を正本とします。ここには、次のセッションが最初に見るべき現状だけを置きます。

## 現在地

- 作業ブランチ：`arena/01a109eb-trk`（前セッションで push されず失われた5コミットを、同じ内容で再適用したブランチ）
- 直近の機能コミット：`feat: complete tutorial with seed challenge`（再適用版）
- 今回の対象：キャストアンテナとバックグラウンド再生アンテナの分離、Seed（`trk!`）入力で完了するチュートリアル、Service Workerキャッシュの更新
- 公開URL：<https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/>
- Service Workerキャッシュ：`sw.js` の `CACHE = "trk-v2026.10.5-synth5"`

## 今回整理・実装したもの

- 📡 外部出力ポリシーを「キャストアンテナ（`settings.castPolicy`）」と「バックグラウンド再生アンテナ（`settings.backgroundPolicy`＋`settings.fxAntenna`）」の2本に分離。ドックに📺キャストボタン（`.dockCast`）を追加し、クリックで Remote Playback API／Safari の選択画面を開く（自動接続なし）。初期はどちらもオフ。旧 `castPolicy=antenna` は `backgroundPolicy=antenna` として引き継ぐ。
- 🧭 3分チュートリアルに5段階目「Seedで譜面を変える」を追加。Seed欄へ `trk!` と入力すると `settings.tutorialDone` が立ち、案内が消える（`js/main.js` の `syncTutorialUI()` / `completeTutorialFromSeed()`、`js/core.js` の設定リセットで `false` に戻る）。
- `sw.js` のキャッシュ名を `trk-v2026.10.5-synth5` に更新。
- `docs/HANDOFF.md`・`README.md`・このファイルを上記の仕様に同期。

## 最初に実行する検査

```sh
node tools/check-repo.mjs
node --check js/*.js

git diff --check
git status --short --branch
```

`tools/check-repo.mjs` は静的検査であり、実ブラウザや実機の代わりではありません。音声、Canvas、IndexedDB、File System Access API、CDN、モバイル幅、PWAインストールは、実際に確認するまで完了扱いにしないでください。

## 未確認の優先項目

1. 実ブラウザで初回起動・コンソールエラー・PWAアイコン・横画面表示を確認。
2. アンテナ分離：キャスト／バックグラウンド再生それぞれのポリシー変更、📺キャストボタンの表示・選択画面・切断、📡アンテナのON/OFF、旧 `castPolicy=antenna` からの引き継ぎを実機で確認。
3. チュートリアル：5段階目の表示、Seed欄に `trk!` 入力での完了と案内の消失、設定リセットでの復帰を確認。
4. メディアプレーヤー：逆再生音声、A-Bループ、Loop Lab、壁紙、ナビゲーションキーの実機確認は前セッションから未完了のまま。
5. GitHub Pagesの公開状態、About、Topics、DiscussionsをGitHub側で確認・判断。

## 維持する方針

- Web Audio合成を基本とし、ユーザーのサンプル音源は端末内・セッション中だけ扱う。保存・送信を前提にしない。
- キャストは自動接続しない。ユーザー操作でだけ選択画面を開く。
- MMDモデル・モーションは原則持ち込み。`assets/mmd/lat-miku/` は再配布条件と原文ReadMeを同梱した例外で、権利説明を変更しない。
- `sw.js` のキャッシュ名を公開更新ごとに変更する。
- 変更後はREADME、`docs/HANDOFF.md`、このファイルの仕様・検査コマンド記載を必要に応じて同期する。
