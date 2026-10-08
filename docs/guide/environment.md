# 💻 動作環境と保存

> 動作環境と、保存されるデータ。

← [📚 ガイド目次](index.md)　／　[README](../../README.md)

最新の **Chrome／Edge** がおすすめです。Firefox・Safari（16.4以降）でも遊べます。

| 機能 | 条件 |
|---|---|
| 📁 ミュージックフォルダを記憶 | パソコンの Chrome／Edge（HTTPS か localhost）。ほかのブラウザでは毎回フォルダを選びます |
| 📤 共有を記憶（🔗 共有をつづける） | パソコンの Chrome／Edge（HTTPS か localhost）。ほかのブラウザでは共有のたびにフォルダを選びます |
| 🧠 解析結果を端末に残す | 自動（同じ曲をもう一度読むと、音の解析を省く。IndexedDB `trk_analysis_cache_v1`。音の波形は残さず、音量などの数値だけ。最大30曲。`?safe=1` では使わない） |
| 💾 共有した曲を端末に残す | 設定でオンにしたときだけ（IndexedDB `shadow_taiko_shared`。最大150曲・300MB。`?safe=1` では読み戻しません） |
| パックの読み込み | `DecompressionStream` に対応したブラウザ |
| 公認パックの確認 | HTTPS か localhost（指紋の計算に必要です） |
| VRM | WebGL。three.js／three-vrm は同梱（`assets/vendor/`）。VRMを使い始めたときだけ読み込みます |
| MMD | WebGL。three.js／three-mmd-loader は同梱（`assets/vendor/`）。MMDを使い始めたときだけ読み込みます |
| ⭐ お気に入り | 端末の中だけ（localStorage）。フォルダ分けも同じ |
| 📚 書斎 | 端末の中だけ（IndexedDB `trk_study_room_v1` の books／pages／covers／settings）。アルバム最大3000枚・600MB／文章1ファイル12MB／本棚500冊。栞・メモのコピー・ジャケット・表示設定も同じ場所。`?safe=1` では開きません |

**保存について：** 設定・記録・パック・追加した曲・マイプリセットは、**このブラウザの中だけ**に保存されます（localStorage・IndexedDB）。解析結果（音量などの数値）も同じ場所に残ります。♻️ 初期化では消えません（設定だけが戻ります）。ブラウザのデータを消すと消えるので、記録はときどきバックアップしてください。

---
