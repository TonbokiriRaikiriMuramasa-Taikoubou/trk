# trk! 開発引き継ぎ（短縮版）

> 最終更新：2026-10-06（📚 書斎 v2＝本棚の並べ替え・栞一覧・本文検索・拡大・文字組み・TVペイン／`NEXT_SESSION_HANDOFF.md` を本書へ統合）
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

- MMD内蔵モーション：**65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。
- VMDは `js/mmd.js` のコードから使用時に生成する。第三者のVMDや振付データは同梱しない。Lat式ミクのPMDで確認した**26種類の既存表情モーフ名**を使い、笑顔・ウィンク・照れ・怒り・困り顔・口パクなどの表情トラックも生成する。
- Lat式プリセットと新規／欠損／リセット時のモーションは `faceSing`（「🎤 あいうお口パク」・BPM非依存の6秒ループ）。保存済みの有効な選択（`none`を含む）は上書きしない。`melt170`（きゅん）・`wedh174`（ダンスホール）は残す。
- 曲名バナー音量ボタン：短押しは従来のスライダー表示切替、650ms長押しはミュート／直前の非ゼロ音量への復元。
- 📚 書斎（Study Room, v2）：曲リスト見出しの長押し（650ms）／Enter・Spaceで開く、**端末内だけ**の画像・文章ビューア。**本棚**＝最大500冊（1ページ60冊＋「さらに表示」）、タイトル・パス・抜粋の検索、更新順／追加順／名前順／種類別／大きい順の並べ替え、栞の付いた本の🔖、冊数・画像枚数・使用量（`navigator.storage.estimate()` があれば空き容量も）。**取り込み**＝進捗バー・中止・結果要約（追加／維持／失敗）・同名本の一括置き換え確認、入れ子は `albumNesting` で「本ごと／まとめて1冊」。**画像**＝1フォルダ＝1アルバム（最大3000枚・600MB・1ファイル100MB）、1枚ずつ／見開き／縦読み＋🇺🇸アメリカン、画像順の反転（`imageOrder`）、拡大0.5〜4倍（ボタン／Ctrl+ホイール／ピンチ／`+`-`0`）と拡大中のドラッグ、見えているページだけ `URL.createObjectURL` して離れたら `revokeObjectURL`。**文章**＝UTF-8／UTF-16 BOM／Shift_JISの自動判定と青空文庫ルビ、5スキン＋文字サイズ・行間・余白、本文検索（Ctrl+F／`<mark class="study-search-hit">`／1500件上限）、栞＋**栞一覧**（M）、メモ帳（上級者向け・書斎内コピーのみ）、❓キーの説明（初回自動・`studyPrefs.helpSeen`）。**TVペイン**＝位置（上／下／非表示）・見た目6種・大きさ3段階・縦横比・曲名ON/OFF、動画が再生中なら映像、音声だけならジャケット（画像長押し680msで割り当て）。保存は**IndexedDB `trk_study_room_v1`**（books／pages／covers／settings。表示設定は `settings` ストアの `"ui"` に `studyPrefs` 1件）。ジャケットは `covers` ストアに入り、選曲画面の背景とTVドックへ `studyCoverChanged` で反映する。取り込みが中断して残った孤立ページは `studySweepOrphans()`（60秒スロットル・起動時と開いたときに実行）で掃除する。`?safe=1` では開かず、保存領域にも触らない。実装は `js/study-room.js`／`js/study-room-utils.js`／`css/study-room.css`、公開APIは `window.TrkStudyRoom`（`open`／`close`／`toggle`／`isOpen`／`refreshTV`／`assignCover`／`sweepOrphans`／`getSongCoverBlob|Info`／`clearSongCover`／`books`／`stats`）。
- 書斎を開いている間は `window._trkStudyRoomOpen` でゲーム側のキー操作を止める（`player.js`／`main.js`／`modes.js`／`stage.js`／`truck.js`／`catch.js`／`speed.js`／`extras.js`／`video-max.js`／`media-player-mode.js`／`synth-mode.js`）。書斎自身のキー（←→・PageUp/Down・Space/Enter・Esc・B/M/T/F・`+`/`-`/`0`・`?`・Ctrl+F）は capture で先に受け取る。ただし入力欄・セレクトでは書斎のキーを止め、ボタンに焦点があるときの Space／Enter はそのボタンに譲る。書斎を閉じる・`phase` が `title` 以外へ進む・曲が切り替わるときは、TVペインへ移した `<video>` を元の親と `style` へ戻す（元の親が差し替わっていても `document.body` へ逃がす）。
- `sw.js` の現在のキャッシュ名は `trk-v2026.10.6-ux9`。公開ファイルを変更したら必ず更新する。
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

- `BUILTIN` は65種、`MOTION_GROUPS` が選曲optgroupとクイック選択optgroupを定義し、`MOTION_MENU_IDS` はその65種を同じ順で平坦化する。`MOTION_MENU_SET` は表示・お気に入り・保存値の判定に使う。
- 生成は `buildVmd()`。ボーンフレームに加えてVMD標準のモーフフレーム（Shift-JIS名15バイト＋frame＋weight）を出力する。`FACE_MORPHS` の26名は同梱Lat式PMDの実データで照合し、CP932表にも全て登録する。振付数式を共有し、VMDデータファイルを追加しないことで配布物を軽く保つ。
- `faceSing` は「あ・い・う・お」モーフを循環させる簡易口パクで、曲の歌詞／音声とは同期しない。対応モーフ名がないモデルでは表情部分が無視される。
- 「おまかせ」はBPMが近い候補を選び、汎用歩行／走行は自動候補から外す。座り・表情だけの動きはBPM非依存。新規・未設定・リセットの既定 `faceSing` と既存選択の保持を維持する。
- 170「きゅん」・174「ダンスホール」は既存選択を維持。エアギター（旧 `airgtr128`）は2026-10に一旦外した：腕・肘が弦の位置に乗らず破綻しやすかったため。戻すときは git 履歴（`147720e` 時点の `js/mmd.js`）から pose を復元する。
- 🎤 歌・口パクの6種（`songMic` / `songLong` / `songUp` / `songHum` / `songWhisper` / `songCall`）は、母音モーフ（あ・い・う・お・ワ）と鼻歌用の ω を使い分ける（`faceMorphs` の `singUp` / `singSoft` / `call` / `hum` / `whisper`）。腕は肘を「前に折る」向き（左＝+Y／右＝-Y）で組み、ボディと干渉しないこと・口を隠さないことを `pose` の手首位置で確認済み（実機の見た目は要確認）。
- **回転軸の実測メモ（このローダー＋Lat式PMDで確認）**：`pose` の `rot` は全ボーン共通で「X＝前後の回転（腕なら振り、脚なら股関節）、Y＝上下軸まわり（体幹のひねり／腕を下ろした状態では見た目に出ない）、Z＝左右（体側）への傾き」。腕を下ろしているときの肘は、左＝+Y／右＝-Y で「手が前に出る」向き、逆符号だと背屈（後ろ折り）になる。既存の表情・actモーションの肘は旧来の向きのまま残してあり、🎤の6種だけ前折りにしている（全モーションへ広げるかは実機で見てから）。
- 🚶走行／🏃歩行は「その場足踏み」。腕は脚と逆相で、前後は `左腕/右腕` の `rot[0]`（±34°／走りは±54°）、肘は前折りで 22〜42°（走りは 46〜64°）。**足は `左足ＩＫ` / `右足ＩＫ` の position キーで持ち上げる**（Y＝上げ幅、Z は −で手前＝ひざを前へ）。モデルの足ＩＫは本来「足首を固定する」IKなので、これを動かさないと脚のFKが打ち消されて足が床に張り付く。足ＩＫのCP932用に SJIS 表へ `Ｉ` / `Ｋ` を追加済み。
- 3Dモデルの脚は既定で足ＩＫが効くため、**足ＩＫを動かさないモーションは足首が固定されてひざだけが動く**（その場で膝を曲げる見え方）。全モーションの脚をFK化するにはVMDのIK/表示プロパティで `左足ＩＫ` 等を切る方法があるが、見え方が一斉に変わるため未実施（`buildVmd` は現状IK/表示セクションを0件で書いている）。
- ブラウザ上の描画・VMDローダー実行・髪／衣装／スカートの貫通は、このNode検査だけでは保証しない。three.jsと `@yohawing/three-mmd-loader` はMMD使用時にCDNから読み込む。
- テスト：`tools/check-mmd-motion-data.mjs` が全65種のポーズ値・VMD構造・CP932・Lat式PMDのボーン／モーフ名・モーフフレームを検査する。

---

## 7. 自動検査と手動確認

### 自動

```sh
npm run check

git diff --check
```

`npm run check` は `tools/check-repo.mjs`（構文・ローカル参照・設定／翻訳・重要機能）、`tools/check-mmd-motion-data.mjs`（VMD生成データ／Lat PMD）、`tools/check-study-room.mjs`（書斎の純データ処理・4言語の網羅・`index.html` のID照合・通信／`innerHTML` を使わないこと・TV／ジャケット連携・キー譲渡）を実行する。依存パッケージのインストールは不要。失敗したら、まず最初のエラーを直してから再実行する。

### 未確認の実機項目

- Lat式ミクの表示・表情モーフ・65種の動き、特に左右の腕／顔／裾の見え方。CDN利用を含むため実ブラウザで確認する。
- 🚶歩行／🏃走行の「その場足踏み」：足が上がって（歩き0.7／走り1.1ユニット）、ひざが前へ出て、腕が前後に振れているか。**🎤6種**：口の動きが見えるか、手が口や体に被らないか、マイク持ち（`songMic`）がそれらしく見えるか。
- 曲名バナー音量ボタンの短押し・650ms長押し、ドラッグ時の誤発火防止、タッチ端末でのミュート／復元。
- TV／スペクトラム／メディアプレーヤー／シンセの実映像・音声、モバイル幅・発熱・操作感。
- 📚 書斎：実ブラウザでのフォルダ取り込み（数千枚のAlbum・入れ子フォルダ）、Shift_JISの実書籍、IndexedDBの容量超過時の挙動、長押し（650msで起動／680msでジャケット割り当て）とスワイプの取り違え、モバイル幅・フルスクリーンAPI、TVペインで動画を移したあとの復帰。
- 📚 書斎 v2：本棚の並べ替え／検索／栞一覧／冊数・使用量の表示、取り込みの進捗・中止・置き換え確認と保存容量超過（`QuotaExceededError`）時の表示、縦読みの遅延読み込みと長い本のスクロール、拡大（Ctrl+ホイール・ピンチ）と拡大中のドラッグ、本文検索のハイライトと前後移動、文字組み（サイズ・行間・余白）と作文用紙の横スクロール、TVペイン（見た目6種・大きさ・縦横比・曲名）と動画の受け渡し／復帰、❓キーの説明と初回表示。JSDOMスモークでは fake IndexedDB のため `jsdom` の Blob を往復できず、画像表示は実ブラウザでのみ確認できる（テストは Node の `Blob`/`File` を注入している）。
- 前セッションからの持ち越し（要約）：初回起動・コンソールエラー・PWAアイコン・横画面、🎭キャラ肌10体と自分のイラスト2枚（端末内のみ・初期化で消える）、📡アンテナ分離と置き場、🕹️ショートプレイ（90/120/180秒・無音検知）、📊スペクトラム（30種×16色）、🛒カタログと👥投稿者ツール（初期オフ）、⏯バナーの曲送りとタップ一時停止、🎧プレイリストと📤共有の条件、🎚ラックとPro Audio系（AudioWorklet非対応時のフォールバック）、メディアプレーヤー（逆再生音声・A-Bループ・Loop Lab・壁紙）、✨フレーム補完（滑らかさ・重さ・`swayAllModes` 併用）。
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

## 9. これまでの流れと維持する方針（旧 `NEXT_SESSION_HANDOFF.md` の統合・2026-10-06）

リポジトリ直下にあった `NEXT_SESSION_HANDOFF.md`（2026-10-05・PR #13 時点で更新が止まっていた）の中身をここへ統合し、ファイルは削除した。**引き継ぎの正本はこの1ファイルだけ**にする。

### 現在地

- 直近で入った機能（`main` へマージ済み）:
  - **PR #13**：📡キャスト／バックグラウンド再生の分離（`castPolicy`／`backgroundPolicy`、置き場は右上（言語の左）も可）、🖼スキンの棚（プリセット31種・グラデ対応・ごほうびスキン🎓）、🧭スタンプラリーチュートリアル（`trk!` 入力で即完了）、🎧プレイリスト（🧊／🔒・中クリック削除・曲プロフィール・フォルダ・タグ・曲別入手先）、📤共有（9曲以上＋全曲クリア／視聴済み・AUTO必須表示・https確認リンク）、🛒公式プレイリストカタログ（10シリーズ・**音源同梱なし**・Musicフォルダ自動マッチ）、👥投稿者ツール（**初期オフ**）、📊スペクトラム（見え方30種・色16色）、⏯バナーの◀▶曲送り（初期オン）とタップ一時停止（初期オフ）、🕹️ショートプレイ（後半90/120/180秒・無音検知終了・記録はフルと分離）、🎭アンテナのキャラ肌（ドット絵10体＋自分のイラスト2枚＝**端末内のみ**。旧設定値 `"miko"` は `"reimu"` へ自動移行）。
  - **PR #14**：🛠 UI操作不能の復旧（`main.js` が凍結済みの `window.TrkFX` を上書きして strict-mode の `TypeError` を起こし、以降の初期化が止まっていた。FX APIは変更せず、UIイベント委譲でスタンプを検知するよう修正）、🖥 動画を全画面で表示（`js/video-max.js`）、🌀 レーンの揺れ（既定は 🚚TRUCK と 🪐ORBIT のみ＋❓謎設定で全モード揺れ）、✨ フレーム補完（既定オフ・自前MEMC・`js/frame-interp.js`）。
  - **PR #16／#17（書斎）**：`arena/872022dd-trk` で開発。PR #17 は本棚の並べ替え・検索、栞一覧、本文検索、拡大／見開き、文字組み、TVペインの見た目、取り込みの進捗・中止・入れ子設定、❓キーの説明、孤立ページの掃除を追加（詳細は §2）。
- 以前の統合元ブランチ：`arena/01a109eb-trk`（Part 1–17・コミット35+・`main` へマージ済み）、`arena/01a10c69-trk`（PR #14）。
- 公開URL：<https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/>

### 維持する方針

- Web Audio合成を基本とし、ユーザーのサンプル音源は端末内・セッション中だけ扱う。保存・送信を前提にしない。
- キャストは自動接続しない。ユーザー操作でだけ選択画面を開く。
- MMDモデル・モーションは原則持ち込み。`assets/mmd/lat-miku/` は再配布条件と原文ReadMeを同梱した例外で、権利説明を変更しない。
- 東方Projectのキャラ肌は二次創作ドット絵（公式素材不使用）。`NOTICE.md` 2b節のクレジットとTouhou-freeビルド手順を維持する。
- `sw.js` のキャッシュ名を公開更新ごとに変更する（現在は §2 の値）。
- 変更後は `README.md`・`NOTICE.md`・本書を必要に応じて同期する。

## 10. 次回以降の検討事項（ユーザー提案・未着手）

- **称号システム**：チュートリアル突破などの実績で、ユーザー名の affix／suffix（称号）を設定できるようにしたい（運用の参考：Limbus Company のプロフィールカスタマイズ）。
- **trk! スピードチャレンジ**：「もう一度」から10秒以内に `trk!` を入力したら特別な何かを（称号システムと組み合わせる想定）。
- **TVスキン・fxドックへの連想ゲーム系スキン**（前々回からの持ち越し）。

---

長い機能別の開発履歴は重複を避けるため本書から外した。過去の実装は `git log`、利用者向け仕様は `README.md` と `docs/`、権利情報は `NOTICE.md` を参照する。
