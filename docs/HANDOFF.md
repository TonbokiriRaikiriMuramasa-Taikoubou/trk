# trk! 開発引き継ぎ（短縮版）

> 最終更新：2026-10-06（MMDモーション60種・表情モーフ対応／曲名バナー音量長押し／📚 書斎（端末内ビューア）／Hand-off再編）
> 目的：次の開発作業に必要な現在の設計・権利上の制約・検証方法をひと目で確認する。詳細な機能紹介は `README.md`、権利条件は `NOTICE.md`、実装の正は各ソースコードとする。

---

## 1. 作業を再開するとき

1. まずこの文書と `git status --short`、`git diff` を確認する。未コミットの作業を勝手に破棄しない。
2. このセッションの作業ブランチは **`arena/872022dd-trk` 固定**。ブランチを切り替えず、pushもこのブランチだけに行う。
3. 開発はリポジトリ内の実コードを編集し、最後に最低限 `npm run check` と `git diff --check` を実行する。
4. 実ブラウザ・タッチ端末・CDN依存の確認は静的検査で代用せず、未確認なら未確認のまま記録する。

このプロジェクトは通常のWebアセットで、バンドラーはありません。`index.html` をローカルのHTTPサーバーまたはGitHub Pagesから開きます。開発前には `docs/HANDOFF.md` を読み、コードの変更後は必要な文書・テスト・Service Workerのキャッシュ名も同期してください。

---

## 2. 現在の重要な状態

- MMD内蔵モーション：**60種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技の5グループ。
- VMDは `js/mmd.js` のコードから使用時に生成する。第三者のVMDや振付データは同梱しない。Lat式ミクのPMDで確認した**26種類の既存表情モーフ名**を使い、笑顔・ウィンク・照れ・怒り・困り顔・口パクなどの表情トラックも生成する。
- Lat式プリセットと新規／欠損／リセット時のモーションは `dreamy128`（128 BPM）。保存済みの有効な選択（`none`を含む）は上書きしない。エアギター、`melt170`（きゅん）、`wedh174`（ダンスホール）も残す。
- 曲名バナー音量ボタン：短押しは従来のスライダー表示切替、650ms長押しはミュート／直前の非ゼロ音量への復元。
- 📚 書斎（Study Room）：曲リスト見出しの長押し／Enter・Spaceで開く、**端末内だけ**の画像・文章ビューア。画像フォルダ＝アルバム（最大3000枚・600MB・1ファイル100MB）、テキスト（1ファイル12MB・一度に200ファイル）、本棚は最大500冊。文字コードはUTF-8／UTF-16 BOM／Shift_JISを自動判定し、青空文庫ルビを組み立てる。保存は**IndexedDB `trk_study_room_v1`**（books／pages／covers／settings）。曲へのジャケット割り当ては `covers` ストアに入り、選曲画面の背景とTVドックへ `studyCoverChanged` で反映する。`?safe=1` では開かず、保存領域にも触らない。実装は `js/study-room.js`／`js/study-room-utils.js`／`css/study-room.css`。
- 書斎を開いている間は `window._trkStudyRoomOpen` でゲーム側のキー操作を止める（`player.js`／`main.js`／`modes.js`／`stage.js`／`truck.js`／`catch.js`／`speed.js`／`extras.js`／`video-max.js`／`media-player-mode.js`／`synth-mode.js`）。書斎自身のキー（←→・PageUp/Down・Space/Enter・Esc）は capture で先に受け取る。
- `sw.js` の現在のキャッシュ名は `trk-v2026.10.6-ux7`。公開ファイルを変更したら必ず更新する。
- このcheckoutで `npm run check` はコード・データの自動検査を行うが、MMDの実描画・タッチ操作・音声の実機確認は別途必要。

---

## 3. ライセンス・再配布の制約

- ソースコードは **GPL-3.0-or-later**。プロジェクト名「trk!」と同梱モデルはGPLの対象外。
- 初音ミクのキャラクター表現はPiapro Character License（非営利条件）に従う。商用派生では `js/characters/miku.js` と対応する読み込みを取り除く。
- MMDモデル・テクスチャ・VMDは作者ごとの規約が優先。**無料公開されていることだけを理由に再配布しない**。第三者VMDは、実ファイルの再配布条件が明確でない限り同梱禁止。
- `assets/mmd/lat-miku/` は例外として、再配布を許す原文ReadMeとモデル一式を同梱している。改変・再配置時はその原文規約も維持する。
- 内蔵VMDはオリジナルのコード生成。曲名や「〜風」はテンポ／雰囲気の参考で、公式または既存の振付の再現を主張しない。顔モーフはLat式モデルに存在する名前を参照するだけで、新たなモデル形状や外部VMDは含まない。
- 権利の詳細・第三者ライブラリ一覧は `NOTICE.md` を正とする。パック仕様は `docs/pack-format.md`、アドオン仕様は `docs/ADDONS.md`。

---

## 4. 読み込み順と主要ファイル

`index.html` のscript順は前提条件。依存を変えるときは実際のHTMLも確認する。

| 順 | ファイル | 主な責務・注意 |
|---:|---|---|
| 1–5 | `i18n.js` → `i18n-options.js` → `data.js` → `characters/miku.js` → `tv-presets.js` | 共通文言、設定文言、データ／スキン、PCLキャラクター、TVフィルターデータ |
| 6 | `characters/○○.js` | 任意の拡張キャラクター用script枠 |
| 7–18 | `core.js` → `player.js` → `media.js` → `game.js` → `render.js` → `custom.js` → `truck.js` → `modes.js` → `stage.js` → `stagefx.js` → `catch.js` → `extras.js` | 共通状態と保存、再生・音源・ゲーム進行・描画、各ゲームモードと補助機能 |
| 19–24 | `fx-presets.js` → `fx-dock.js` → `tv-dock.js` → `video-max.js` → `fx.js` → `fx-synth.js` | 音響／映像ドック。`fx.js` と `fx-presets.js` は凍結扱い |
| 25–30 | `favs.js` → `catalog.js` → `library.js` → `verified.js` → `lib-skins.js` → `addons.js` | お気に入り、曲カタログ／選曲、公認パック、棚スキン、アドオン |
| 31–33 | `main.js` → `speed.js` → `vrm.js` | 起動・イベント、速度操作、遅延VRM機能 |
| 34 | `mmd.js` | 遅延MMD機能・コード生成VMD |
| 35–38 | `spectrum.js` → `synth-mode.js` → `frame-interp.js` → `media-player-mode.js` | スペクトラム、演奏シンセ、映像補完、メディアプレーヤー |
| 39–40 | `study-room-utils.js` → `study-room.js` | 📚 書斎。純データ処理（文字コード・並べ替え・ルビ）とUI／IndexedDB。書斎は `#libPanel .libHead h3` を長押しして開く |

上記は `index.html` の実順。依存を追加・移動する場合はscriptタグと `tools/check-repo.mjs` の両方を確認する。
主なファイル：`index.html`（UIと読込順）／`css/style.css`・`css/study-room.css`／`js/core.js`（設定・保存）／`js/main.js`（初期化）／`js/library.js`（選曲）／`js/study-room.js`・`js/study-room-utils.js`（書斎）／`js/mmd.js`（MMD）／`sw.js`（オフラインキャッシュ）／`README.md`／`NOTICE.md`。

---

## 5. 壊さないための契約

### 保存・形式

- 既存のlocalStorage／IndexedDBキーやファイル形式名を理由なく改名しない。変更が必要なら移行処理と後方互換テストを追加する。
- 主な保存先：`shadow_taiko_preferences_v2`（設定）、`shadow_taiko_records_v1`（記録）、`shadow_taiko_song_prefs_v1`（曲別設定）、IndexedDB `shadow_taiko_packs`／`shadow_taiko_songs`／`shadow_taiko_library`／`shadow_taiko_vrm`／`shadow_taiko_mmd`／`shadow_taiko_shared`／`trk_study_room_v1`（書斎。books／pages／covers／settings。削除操作は書斎内の「×」とブラウザのサイトデータ削除）。
- 共有・Export形式：`shadow-taiko-pack`、`shadow-taiko-chart`、`shadow-taiko-records`、`skin.shadow-taiko`、`trk-fx`、`trk-verified`、`trk-tvskin`、`trk-playlist`。外部JSONは項目と範囲を検証し、コードとして実行しない。

### 音声・イベント・安全モード

- `createMediaElementSource(video)` は一度だけ。波形・スペクトラムなど音を観察する機能は `TrkFX.tap()` を使い、独自に音源を再接続しない。
- `js/fx.js` と `js/fx-presets.js` は **凍結扱い**。変更が本当に必要な場合は、依存するfx-dock／fx-synthと `window.TrkFX` APIの利用者を一緒に確認する。
- 後から読み込まれる機能が関数を包む場合、対象は `function` 宣言か `let` である必要がある。`const` 化・引数変更はラッパー側を先に検索する。
- `?safe=1` は保存ファイルやCDN機能の読み込みを抑える非常用モード。安全モードを迂回しない。
- UI追加時は4言語の文言を同時に追加し、設定項目は初期値・リセット・Import/Export・セーフモード経路を確認する。
- GitHub Pagesはファイル名の大文字小文字を区別する。相対パスとService Workerキャッシュも確認する。

---

## 6. MMD実装メモ

- `BUILTIN` は60種、`MOTION_GROUPS` が選曲optgroupとクイック選択optgroupを定義し、`MOTION_MENU_IDS` はその60種を同じ順で平坦化する。`MOTION_MENU_SET` は表示・お気に入り・保存値の判定に使う。
- 生成は `buildVmd()`。ボーンフレームに加えてVMD標準のモーフフレーム（Shift-JIS名15バイト＋frame＋weight）を出力する。`FACE_MORPHS` の26名は同梱Lat式PMDの実データで照合し、CP932表にも全て登録する。振付数式を共有し、VMDデータファイルを追加しないことで配布物を軽く保つ。
- `faceSing` は「あ・い・う・お」モーフを循環させる簡易口パクで、曲の歌詞／音声とは同期しない。対応モーフ名がないモデルでは表情部分が無視される。
- 「おまかせ」はBPMが近い候補を選び、汎用歩行／走行は自動候補から外す。座り・表情だけの動きはBPM非依存。新規・未設定・リセットの既定 `dreamy128` と既存選択の保持を維持する。
- 170「きゅん」・174「ダンスホール」・エアギターは既存選択を維持。エアギターは右腕・右肘・手首の演奏動作を含む。
- ブラウザ上の描画・VMDローダー実行・髪／衣装／スカートの貫通は、このNode検査だけでは保証しない。three.jsと `@yohawing/three-mmd-loader` はMMD使用時にCDNから読み込む。
- テスト：`tools/check-mmd-motion-data.mjs` が全60種のポーズ値・VMD構造・CP932・Lat式PMDのボーン／モーフ名・モーフフレームを検査する。

---

## 7. 自動検査と手動確認

### 自動

```sh
npm run check

git diff --check
```

`npm run check` は `tools/check-repo.mjs`（構文・ローカル参照・設定／翻訳・重要機能）、`tools/check-mmd-motion-data.mjs`（VMD生成データ／Lat PMD）、`tools/check-study-room.mjs`（書斎の純データ処理・4言語の網羅・`index.html` のID照合・通信／`innerHTML` を使わないこと・TV／ジャケット連携・キー譲渡）を実行する。依存パッケージのインストールは不要。失敗したら、まず最初のエラーを直してから再実行する。

### 未確認の実機項目

- Lat式ミクの表示・表情モーフ・60種の動き、特に左右の腕／顔／裾の見え方。CDN利用を含むため実ブラウザで確認する。
- 曲名バナー音量ボタンの短押し・650ms長押し、ドラッグ時の誤発火防止、タッチ端末でのミュート／復元。
- TV／スペクトラム／メディアプレーヤー／シンセの実映像・音声、モバイル幅・発熱・操作感。
- 📚 書斎：実ブラウザでのフォルダ取り込み（数千枚のAlbum・入れ子フォルダ）、Shift_JISの実書籍、IndexedDBの容量超過時の挙動、長押し（650msで起動／680msでジャケット割り当て）とスワイプの取り違え、モバイル幅・フルスクリーンAPI、TVペインで動画を移したあとの復帰。
- WebGL・IndexedDB・端末のフォルダ選択など環境依存機能。静的検査通過を実機確認済みと表現しない。

---

## 8. 変更時の短いチェックリスト

- [ ] `git status` と差分を読んで、既存のユーザー変更を保持したか
- [ ] 4言語、初期値、リセット、Import/Export、`?safe=1` を確認したか
- [ ] 保存キー／Export形式を不用意に変更していないか
- [ ] 第三者素材の実際の利用・改変・再配布条件を確認したか
- [ ] 関連テストと `npm run check`、`git diff --check` を通したか
- [ ] `README.md`／`NOTICE.md`／この文書／`sw.js` の更新が必要か確認したか
- [ ] 未確認の実ブラウザ・タッチ端末作業を明記したか

長い機能別の開発履歴は重複を避けるため本書から外した。過去の実装は `git log`、利用者向け仕様は `README.md` と `docs/`、権利情報は `NOTICE.md` を参照する。
