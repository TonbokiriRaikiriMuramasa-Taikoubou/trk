<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# 次回セッション引き継ぎ（2026-10-05）

> 詳細な仕様・設計・手動確認項目は [`docs/HANDOFF.md`](docs/HANDOFF.md) を正本とします。ここには、次のセッションが最初に見るべき現状だけを置きます。

## 現在地

- 作業ブランチ：`arena/01a10940-trk`
- 直近の機能コミット：`2714154 feat: add wider synth keyboard option`
- 今回の整理対象：Handoffの優先順位、文書間の古い記載、パック仕様、依存しない静的監査、privacy.html、APK準備
- 公開URL：<https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/>
- Service Workerキャッシュ：`sw.js` の `CACHE = "trk-v2026.10.5-synth2"`

## 今回整理・実装したもの

- `privacy.html` と `css/privacy.css` を追加し、現在のWeb/PWAのローカル優先動作、外部通信、削除方法、APK版の未提供状態を明記。
- `package.json`、`capacitor.config.ts`、`tools/prepare-mobile-web.mjs`、`docs/android.md` を追加し、同じWeb資産をCapacitorのAndroid WebViewへ同期する土台を整備。Androidプロジェクト・APKはまだ生成・配布していない。
- `docs/pack-format.md` を追加し、`.stpack` / `pack.json` の形式、上限、曲パック例、権利上の注意を文書化。
- `README.md` のプライバシー、APK準備、パック仕様リンクと静的検査コマンドを追加。
- `tools/check-repo.mjs` を追加。Node.jsだけで次を監査する。
  - `js/` 全ファイルの構文
  - `index.html` のローカル script / stylesheet 参照
  - manifestのアイコン参照とPNG寸法
  - 棚スキン数（現在16）と古い件数コメント
  - Service Workerキャッシュ名
  - 主要ドキュメントとREADMEからのパック仕様リンク
- `js/lib-skins.js` / `css/style.css` の棚スキン数の古いコメントを16種に修正。
- READMEとNOTICEの権利説明を照合し、再配布条件を同梱した `assets/mmd/lat-miku/` の例外をREADMEにも反映。
- `docs/HANDOFF.md` に優先順位を追加。実機確認・GitHub側の設定は未確認のまま残している。

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
2. シンセ：起動時間、16音色、鍵盤固定ON/OFF、広い鍵盤の大画面／スマホでの挙動、ピッチ、和音、タッチ、保存を確認。
3. 曲共有：PCの許可ダイアログ、スマホのフォールバック、大量曲、端末保存、再接続、停止、`?safe=1` を確認。
4. 棚スキン16種、TV／スペクトラム／エフェクトチェーン、MMD／VRM／アドオンの実機表示と操作を確認。
5. GitHub Pagesの公開状態、About、Topics、DiscussionsをGitHub側で確認・判断。

## 維持する方針

- Web Audio合成を基本とし、ユーザーのサンプル音源は端末内・セッション中だけ扱う。保存・送信を前提にしない。
- 鍵盤固定オプションは初期オン。大画面向け鍵盤拡張は追加設定で、スマホ向けの従来表示を壊さない。
- MMDモデル・モーションは原則持ち込み。`assets/mmd/lat-miku/` は再配布条件と原文ReadMeを同梱した例外で、権利説明を変更しない。
- `sw.js` のキャッシュ名を公開更新ごとに変更する。
- 変更後はREADME、`docs/HANDOFF.md`、このファイルの仕様・検査コマンド記載を必要に応じて同期する。
