# trk! — AGRG

> **trk! is AGRG!** — an **A**ll-**G**eneration **R**hythm **G**ame
> 手持ちの曲ひとつで、叩いても、走っても、回っても、舞台に立っても、荷物を運んでもOK🚚

[![License: GPL v3+](https://img.shields.io/badge/License-GPLv3+-blue.svg)](LICENSE)
[![Play](https://img.shields.io/badge/▶_Play-GitHub_Pages-ff3b55.svg)](https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/)
[![X](https://img.shields.io/badge/X-@ttrk143-000000.svg)](https://x.com/ttrk143)

trk!（トラック）は、ブラウザだけで動く**非営利のリズムゲーム**です。
手持ちの音楽や動画（MP3・MP4など）を読み込むと、**譜面を自動で作って**すぐに遊べます。
インストールもアカウント登録もいりません。曲やデータは**どこにもアップロードされません**。
エフェクトを付けて聴く**音楽プレイヤー**としても使えます。

▶ **遊ぶ：** https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/

> ⚠ 開発中です。不具合を見つけたら [Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues) か X [@ttrk143](https://x.com/ttrk143) に教えてください。

---

## 🚀 3ステップで遊ぶ

1. 上の **▶ 遊ぶ** のリンクを開きます。
2. 「**📤 ミュージックフォルダを共有**」を押します（端末に**1回だけ**許可を求めます）。曲が一気に取り込まれます。
3. 曲とプレイ方法・難易度を選んで、**▶ PLAY**！

> 🧭 初めてなら、画面上部の **まずは3分チュートリアル** から。ゲームをせずに使う方法は [docs/guide/start.md](docs/guide/start.md) にあります。

### 自分のPCで動かす
ビルドは不要です。ただし、フォルダの記憶・VRM・公認パックの確認には **http(s) で開く**必要があるので、簡単なサーバーを使ってください。

```bash
git clone https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk.git
cd trk
python -m http.server 8000
# → http://localhost:8000 を開く
```

---

---

## 🎮 5つのプレイ方法

| モード | 一言 |
|---|---|
| 🥁 **MANUAL** | 流れてくるドン（赤）とカッ（青）を叩く、いちばん基本のモード |
| 🚚 **TRUCK** | トラックでレーンを移動。全世代向けのやさしいモード |
| 🪐 **ORBIT** | どのキーでもOKのワンボタン。うねる道が中央の判定点へ流れ込む |
| 🎪 **STAGE** | 縦レーン（4／5／6）。階段・トリル・ワイドノーツ |
| 🚛 **CATCH** | 落ちてくる荷物を荷台で受け止める。ニトロ缶 🚀 で「ぶっ飛ばしモード」 |

譜面は曲から**自動で作られます**（Seed を変えると譜面も変わります）。AUTO・📻 ラジオ・練習機能・書斎（画像と文章のビューア）などは、[ガイド](docs/guide/index.md)にまとめています。

---

## 📚 くわしい説明・関連資料

- [📚 ガイド目次](docs/guide/index.md)：操作・見た目・サウンド・書斎・パック・スマホ・動作環境・セキュリティ・MOD・ファイル構成・クレジット
- [パック形式](docs/pack-format.md)（`.stpack`）・[公認パックの確認](docs/verified.md)
- [MOD（アドオン）の作り方](docs/ADDONS.md)
- [セキュリティ](docs/SECURITY.md)（[突き合わせ表](docs/SECURITY-CHECKLIST.md)）・[品質の確認](docs/QUALITY-CHECKS.md)
- [プライバシー方針](privacy.html)・[クレジット](credits.html)・[ファイル構成](docs/guide/files.md)

---

## 💬 感想・要望・不具合の報告

- 感想：X [@ttrk143](https://x.com/ttrk143)（ハッシュタグ **#trkAGRG**）
- 不具合・要望：[GitHub Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues)（[不具合](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues/new?template=bug_report.yml)・[譜面](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues/new?template=chart_feedback.yml)・[要望](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues/new?template=feature_request.yml)のテンプレートあり）

---

## ⚖ ライセンスと権利

- **ソースコード**：GNU GPL v3.0 or later（[LICENSE](LICENSE)）。「trk!」の名前はライセンスの対象外です。派生版は別の名前で公開してください。
- **権利の要点**：初音ミク（PCL・GPLの対象外）、東方のキャラ肌（上海アリス幻樂団）、第三者ライブラリ、利用者が読み込む曲・モデル・パックは、それぞれの権利者のものです。詳細と条件は [NOTICE.md](NOTICE.md) にまとめています。
- **お願い**：権利のない曲を配らないこと、VRM・MMDモデルは作者の利用条件を確かめてから使うこと（[NOTICE.md の §3](NOTICE.md)）。

---

## English

**trk! is AGRG!** — an All-Generation Rhythm Game that runs entirely in your browser.
Load your own music or video and trk! **auto-generates a chart** for it. Nothing is uploaded.

▶ **Play:** https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/

**Run locally:** `python -m http.server 8000`, then open `http://localhost:8000`.

Five play styles (MANUAL, TRUCK, ORBIT, STAGE, CATCH), Study Room, verified packs and lighter builds are described in the **[full English guide](docs/guide/en.md)**.

**Feedback:** [@ttrk143](https://x.com/ttrk143) (hashtag **#trkAGRG**), bugs and ideas on [GitHub Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues).

**License:** code under **GPL-3.0-or-later**. The name “trk!” is not licensed — please rename forks. See [NOTICE.md](NOTICE.md) for the rights of the characters and third-party material.

This work depicts the character “Hatsune Miku” of Crypton Future Media, INC. under the Piapro Character License.

trk! is an unofficial fan project and is not affiliated with any of the games listed above.
