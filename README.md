# trk! — All-Generation Rhythm Game

**音楽とリズムゲームへのリスペクトから生まれた、非営利のオープンなブラウザ音ゲー。**

好きな曲を読み込んで、自動生成された譜面をすぐにプレイできます。音源はブラウザ内だけで処理され、サーバーにはアップロードされません。

> **開発中のプロトタイプです。** BPM・譜面の自動推定は実験的な機能で、曲によってはリズムとずれることがあります。気づいたことやアイデアは [Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues) へどうぞ。

## 遊びかた

1. [trk! を開く](https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/)（Pages 公開後）
2. オリジナルのシンセデモを試すか、「音源を選ぶ」から端末内の曲を読み込む
3. 音符が判定ラインに来たら **D・F・J・K** を押す（スマートフォンは画面のキーをタップ）
4. 譜面の密度は「ゆったり / スタンダード / 高密度」から選べます

対応形式はブラウザのデコーダーにより異なります（MP3、WAV、OGG、FLAC、AAC など）。最大ファイルサイズは 120 MB です。快適に遊ぶには、最新の Chrome、Firefox、Safari、Edge をおすすめします。

## ローカルで動かす

ビルドツールや依存パッケージは不要です。リポジトリのルートで簡易サーバーを起動してください。

```sh
python3 -m http.server 8000
```

ブラウザで <http://localhost:8000/> を開きます。`file://` から直接開くと、サービスワーカーや一部のブラウザ機能が使えない場合があります。

## GitHub Pages で公開する

`.github/workflows/pages.yml` が `main` への push と手動実行を受けて、静的サイトを GitHub Pages にデプロイします。リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定してください。デプロイ先は通常 `https://<owner>.github.io/trk/` です。

GitHub Actions の実行状況はリポジトリの **Actions** タブで確認できます。Pages の設定を変更できる権限がない場合は、管理者に Source の切り替えを依頼してください。

## プロジェクトの方針

- trk! のコードは **GPL-3.0-or-later** です。詳細は [`LICENSE`](LICENSE) を参照してください。
- 音源・画像・キャラクターデータはこのリポジトリに同梱しません。自分が利用・再配布できる権利を持つ素材だけを使用してください。
- trk! は独立した非営利プロジェクトです。ほかのゲームの譜面・音源・画像・ロゴを再利用せず、特定の作品を再現するものでもありません。
- UI は日本語・英語・中国語・韓国語に対応しています。

貢献方法は [`CONTRIBUTING.md`](CONTRIBUTING.md) をご覧ください。

---

**English** — trk! is a non-profit, open browser rhythm-game prototype made with love for music and rhythm games. Try the built-in synthesized demo, or load an audio file from your device and play a generated four-lane chart with D, F, J, and K. Your audio stays in your browser; it is never uploaded. Chart and BPM detection are experimental. Source code is GPL-3.0-or-later; music and other media remain the property of their respective creators.
