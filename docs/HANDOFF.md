# trk! 開発引き継ぎ

> **最終更新：2026-10-08**。この文書は、次の作業に必要な現在の設計・権利上の制約・未確認事項をまとめる。利用者向けの説明は [`README.md`](../README.md)、権利・同梱物の詳細は [`NOTICE.md`](../NOTICE.md)、セキュリティの調査記録は [`SECURITY.md`](SECURITY.md) と [`SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md) を参照。コードと回帰検査を正とし、古い作業履歴は `git log` で確認する。

## 1. 作業を再開するとき

1. `git status --short` と差分を読み、未コミットの変更を勝手に破棄しない。
2. Arenaが指定したブランチを使い、別ブランチへ切り替えない。`main` への反映はPR経由。
3. 最低限 `npm run check` と `git diff --check` を実行する。
4. 静的検査の成功を実ブラウザ・タッチ端末・WebGL確認済みと扱わない。未確認事項は §7 に残す。

バンドラーはない。`index.html` をHTTPサーバーまたはGitHub Pagesから開く。scriptの読込順は `index.html` が正で、変更時はテスト・関連文書・`sw.js` のキャッシュ名も確認する。

## 2. 現在の実装・カタログ

### 2.1 公式音楽カタログ

実装本体は `js/catalog.js` の `TRK_CATALOG`（`S`＝シリーズ、`PL`＝リスト、`T`＝曲）。音源ファイルは同梱せず、カタログ行から公式の作品・配信先へ案内する。**公式リンクは視聴・購入先の案内であり、二次利用許諾ではない。** 個別曲ページが確認できれば優先し、なければ公式カタログ／作品ページを案内する。ファンWikiや第三者投稿を公式配信先として扱わない。

- **League of Legends**：Creator-Safe Sessions 3作／108曲（Vi 36・Diana 43・Star Guardian Taliyah 29）、近年のChampion Themes 41曲、Worlds/WCSアンセム2014–2025の12曲＋2026年の告知曲、確認できたMSIアンセム4曲。Phase 1であり全楽曲ではない。旧ログインテーマ・他のChampion Theme・Skin／イベント曲・ゲームOSTは調査対象として残る。個別の利用条件は[Riot Creator-Safeガイド](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)で確認する。調査台帳とfixtureは `docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`tools/leagueoflegends-music-tracklist.json`、`tools/leagueoflegends-sessions-tracklist.json`。
- **VALORANT**：Champions Anthems（2021–2026）6曲とAgent関連3曲を別リストに分類。曲別の公式公開先とCreator-Safeガイドを案内する。公開・購入・サブスクを二次利用許諾の根拠にしない。
- **アークナイツ**：Monster-Siren Recordsの曲／OSTページへ案内。誤記だった「痕」は表示せず、永続ID `ak-hen` のまま **「墟」／👹** に置換。`ak-msr` は4曲、`ak-ilcarnevale` はOST曲目ページ6曲。既存リストの更新では所持曲・カスタム情報を維持する。
- **原神**：HOYO-MiX公式Apple Musicの個別曲ページ12件。
- **100% Orange Juice／SAM Free Music**：選曲15曲／10曲を維持。Fruitbat Factory公式のゲーム案内は作品ページであり、個別曲の公式配信先・利用許諾の確認済みとは表現しない。
- **学園アイドルマスター**：確認日2026-10-08の公式Drive掲載インスト50件を `gm-inst`／`gm-inst2` に25曲ずつ、公式ディスコグラフィの14曲を `gm-releases` に分離。公式曲名は **SEARCH RIGHT**、Drive掲載名 **SEARCH LIGHT** は照合用別名。`SUGAR FLAVOR` はDrive掲載を確認したが、公式ページ記載の配信日は2026-10-14。Drive未掲載は配布不可の証明ではない。fixture `tools/gakumas-download-tracks.json`。
- **ブルーアーカイブ**：公式OST Vol.1–8、合計225曲。公式収録順・曲ごとのApple Music URL・巻別NexTone.Linkを案内。Yostar公式ガイドラインは音声・楽曲素材のコピー等を制限している。購入・サブスクリプションと二次利用許諾は別。利用前に[公式ガイドライン](https://bluearchive.jp/fankit/guidelines)を確認する。fixture `tools/bluearchive-tracklist.json`。

### 2.2 Wishlist照合・既存リストの更新

- 音声ファイルの例は `.ogg`。区切りや拡張子違いは `plTitleKeys()` で正規化し、カタログ見出しの左右どちらかだけ一致する場合も候補として扱う。プロフィールの「カタログ照合メモ」`SONG_META.matchHint` は80文字まで・端末内保存・共有データには出さない。例：`BELIEVE.ogg` に `Suguri` とメモすると `Suguri - BELIEVE` に一致する。**曲名またはメモの片方だけの一致で十分**。
- 曲プロフィールで照合しにくい公式名／ファイル名の差にはカタログの `matchAliases` を使う。`plSanitize()`、カタログwish生成、照合、既存wish更新まで保持し、SEARCH RIGHT ↔ SEARCH LIGHT を回帰検査する。
- `ensureTrkDistributionPlaylists()` は `cat` が公式項目と一致する既存リストのwish／guideを更新する。所持曲と利用者編集の名前・アイコン・タグは維持し、既知の旧既定名だけ旧値一致時に変更する。旧 `trk-gakumas-v1` はwishを現行64曲へ更新するが、ユーザーの所持曲・表示設定は保持する。
- 設定の「🐔 trk's playlist」からMusic内の `trk` フォルダを選べる。フォルダは**利用者が自分で作成**し、アプリは読み取り専用で選択・走査する。アプリはフォルダ作成、曲の移動、書込み、削除をしない。Music全体へ戻す場合は通常のフォルダ選択でMusicを選び直す。

### 2.3 その他の実装上の要点

- MMD内蔵モーションは **65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。VMDは `js/mmd.js` のコードから使用時に生成し、第三者のVMD・振付データは同梱しない。
- 軽量化の判定・描画ゲートは `js/lite.js`。ゲーム判定と音声時計は描画間引きの前に処理する。設定の保存形式は既存の `shadow_taiko_preferences_v2` を維持する。
- 書斎は端末内のIndexedDB `trk_study_room_v1` に保存。書斎の本文は文字として描画し、`.txt`／`.md`／`.js`等の編集は`textarea`からローカルコピーだけを書き換える。HTML／JavaScript／Markdownを実行・HTML解釈・プレビューする経路を追加しない。上級者設定で編集後の本棚フォルダを選べるが、本文の保存先は引き続きIndexedDB。本棚の元ファイルは読み取り専用。明示的な書き出しだけは、ユーザーが別途選んだフォルダへ衝突しない新規名のテキストコピーを作り、既存ファイルを上書きしない（選択ハンドルは起動中のメモリだけに保持。非対応ブラウザは通常ダウンロード）。画像のObject URLは不要時に破棄。本棚フォルダ・本の移動・手動順序は `settings` store の `shelf` レコード、表示状態・Studyナビゲーションキー等は `ui` レコードに保存する。既存DBバージョンを変えずに正規化し、フォルダ削除では本を削除せず本棚へ戻す。
- 書斎の文字スキンは24種（文筆・読書6／コーディング6／AI・プロンプト風5／自由な発想7）。4分類の`optgroup`と24個のテーマ名は4言語で管理し、読書ページと編集用`textarea`の両方にテーマ色・書体・背景を適用する。AI・プロンプト風は装飾のみで、AI処理・ネットワークアクセスを追加しない。
- **自動譜面（`js/chart-gen.js`）**：設定 `chartGen`（Seed欄の下の「自動譜面の作り方」）。既定は **`"2"`＝新方式**（2026-10-08、利用者の決定：ノーツ総数の増加と高難度の頭打ちを受け入れ）。`"1"`＝旧方式は選択で戻せ、旧方式で作った記録は記録表で「旧方式」の印が付く（記録作成時に `gen` を保存）。`"2"`＝新方式は、前後4秒の90パーセンタイルで音量を局所正規化し、8小節ごとに「長さ×密度」でノーツ数を先に配って、盛り上がりは係数0.7〜1.3で残す。冒頭の判定は最大音量の1%未満のみ無音扱い（旧方式は6%）ため、冒頭の小さな音も譜面に入り、ノーツ総数は増えやすい（実測：マスター 359→585、RUSH 438→714）。`chartGen` の純関数としての未指定は旧方式のまま（ゴールデンを保つため）。旧方式の出力は `tests/fixtures/chart-legacy-golden.json`（ca84a19の`generateNotes`から取得）と全件一致が必須。ゴールデンは旧方式を変えたときに**作り直さない**（`node tests/capture-legacy-golden.mjs`は一度きりの道具）。
- ライフ（体力）の規則は `js/modes.js` の `lifeRule(totalNotes)`（TRUCK の標準・最大・回復の帯）にある。ノーツ数で段階的に決まり、本書には数値を書かない。ノーツ数が増えると回復量が少し増える（帯が変わるのは250／650を越えるときだけ）。自動譜面の総数が増えたことは利用者が受け入れ済み。
- `sw.js` の現在のキャッシュ名は **`trk-v2026.10.8-trk36`**。公開コードを更新するときは変更する。

## 3. 権利・データ・セキュリティの不変条件

- ソースは GPL-3.0-or-later。プロジェクト名・同梱モデル等の個別条件は [`NOTICE.md`](../NOTICE.md) を正とする。MMDモデル・テクスチャ・VMDは、無料公開だけを理由に再配布しない。Lat式ミクは原文ReadMeと再配布条件を維持する。Piapro Character License／東方Projectの説明・クレジットも変更しない。
- 音楽カタログは紹介用で音源を含めない。公開・販売・ストリーミング・購入・公式ページへのリンクを、一般の二次利用許諾と混同しない。許諾・対象曲・利用条件が未確認なら、未確認と表示する。
- ユーザーが取り込んだローカル音源・文章・フォルダの元ファイルは読み取り専用。入力用ハンドルで `FileSystemHandle.remove()`／`createWritable()`／移動・作成・削除を行わない。唯一の例外は、利用者が明示的に実行する書斎テキストコピー書き出しで、別に選択したフォルダへ衝突しない新しいコピーだけを作る。既存ファイル・元ファイルは上書きせず、フォルダハンドルを設定へ永続保存しない。メディアを丸ごとメモリへ読まず、音声解析は、ファイルが `ANALYZE_MAX`（96MB・圧縮後）を超えるか、長さが `ANALYZE_MAX_SEC`（20分）を超える場合に省略する（デコード後のPCMは長さに比例するため、サイズだけでは判断しない）。省略時は状態に理由（`analysisSkipped`／`analysisSkippedLong`）を表示する。
- 外部由来URLは `safeHttpUrl()`／`safeLink()` を通し、開く直前にも `plOpenLink()` で再検証する。設定・共有データは許可リストとサイズ上限で検証し、未検証JSONをコード実行しない。
- `.stpack` は展開後合計1GiB上限。IndexedDB v2 の `size` indexで合計し、移行・件数不一致・不正値の過小計上を防ぐ。上限検査とputは同一readwrite transaction内で行う。書斎の容量とは別枠。
- `?safe=1` の判定・Service Workerのセーフクライアント除外を迂回しない。全設定リセットは確認ダイアログを通し、完全一致の `force=1` のみ確認を省く。`?factory` 単体は全消去ではなくセーフモード。新規アドオンは同意後にだけ実行し、起動時に指紋を確認する。
- 第三者ライブラリは `assets/vendor/` に同梱。CDNから実行コードを取得しない。vendorファイルは手で編集せず、`npm run vendor:update` と `npm run check` で更新・検証する。
- `js/fx.js` と `js/fx-presets.js` は凍結扱い。変更が必要なら `TrkFX` API利用者とfx-dock／fx-synthを一緒に確認する。新規UI文言は日本語・英語・中国語・韓国語を同時に追加する。
- セキュリティの調査経緯・例外・残件は [`SECURITY.md`](SECURITY.md) と [`SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md)、読みやすさの点検は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) を参照。

## 4. 主要ファイル・依存関係

`index.html` のscript順が実行順。依存を追加・移動する場合はHTMLと `tools/check-repo.mjs` の両方を更新する。

| ファイル | 責務・注意 |
|---|---|
| `js/core.js` | 設定・保存・セーフモード・リセット・共通検証 |
| `js/lite.js` | 軽量化。設定読込後、描画側より前にロード |
| `js/chart-gen.js` | 自動譜面の純関数。`chartGen` 1＝旧方式（ca84a19の出力を保つ）、2＝新方式・既定（局所正規化＋8小節ごとの区間配分）。`media.js` の `generateNotes` は薄いラッパー。`tests/` が検査 |
| `js/catalog.js` → `js/title-match.js` → `js/library.js` | 公式カタログ定義、プレイリスト・照合・Music読込。曲名の照合キー（`plTitleKeys`・`plSongMatchKeys`・`plWishTitleKeys`）は純関数として `title-match.js` にあり、`tests/title-match.test.mjs` が入出力を検査する（`plWishMatch` は `metaOf` を使うため `library.js` に残す）。`catalog.js` のトップレベル `const TRK_CATALOG` は `window` に載らないため、`trkCatalog()` 経由で読む |
| `js/fx.js`／`js/fx-presets.js` | 音響API・プリセット。凍結扱い |
| `js/vrm.js`／`js/mmd.js` | 3D機能。vendorライブラリは利用時だけ動的import。`?safe=1` では読み込まない |
| `js/study-room-utils.js`／`js/study-room.js` | 書斎の純データ処理・UI。ルビ解析は線形走査を維持 |
| `sw.js` | 同一オリジンGET資源のキャッシュ。safeクライアントへキャッシュを返さない |
| `tools/check-*.mjs` | 静的回帰検査。失敗時は最初のエラーから直す |

## 5. MMD実装メモ

- `BUILTIN` は65種。生成は `buildVmd()`／`builtinBytes()`。Lat式PMDで確認した26種類の既存表情モーフを使う。新規・未設定・リセット時の既定は `faceSing`（簡易口パク、音声とは同期しない）。保存済みの有効選択（`none` 含む）は上書きしない。
- `pose.rot` の軸：X＝前後の傾き、Y＝上下軸まわりの水平回転、Z＝前後軸まわりの傾き。`pos[1]` は上、`pos[2]` の負値は手前。腕の前後振りは `rot[0]`。
- 歩行112／走行152は `左足ＩＫ`／`右足ＩＫ` の位置キーで足を交互に上げる（歩き0.7／走り1.1）。CP932表の `Ｉ`／`Ｋ` を削らない。モーションの値・左右・VMD構造は `tools/check-mmd-motion-data.mjs` が検査する。
- テストは実際のモデル表示、VMDローダー、髪・衣装・スカートの貫通を保証しない。Latモデル・VRMの実描画は実ブラウザで別途確認する。

## 6. 自動検査

```sh
npm run check
git diff --check
```

`npm run check` は `check-repo`、`check-security.mjs`、`check-a11y.mjs`、`check-vendor.mjs`、`check-mmd-motion-data.mjs`、`check-study-room.mjs`、`check-lite.mjs`、`tests/` の node:test（`npm test`＝`tools/run-tests.mjs`）を実行する。名前空間の棚卸しは `node tools/globals-audit.mjs`（基準 `tests/fixtures/globals-baseline.json`）、実ブラウザのスモークは `tools/smoke-browser.mjs`（Chromium と puppeteer-core を環境変数で指定。`npm run check` には入れない。手順は [`NAMESPACE-PLAN.md`](NAMESPACE-PLAN.md) §2）。依存パッケージは追加不要（Node 22 の `node:test`）。テストは合成曲で譜面生成を検査する（音源は使わない）。現行の目安はSecurity 55 checks、a11y 7 checks、vendor 8 checks、軽量化120 assertions。a11yでは既知の見出し順 `h1→h3` 1件だけWARNを許容し、未知の警告や同じ警告の増加はFAILする。理由・許容条件・外部ツールでの再検査方法は `QUALITY-CHECKS.md` に記録している。

`check-repo.mjs` はJavaScript構文・ローカル参照・ID・設定文言に加え、Arknights公式リンク、Blue Archive 225曲、LoL Sessions 108曲／Phase 1の58件、Gakumas 50件・別名、公式リンクと権利注記、既存プレイリストの所有曲・カスタムフィールド保持を検査する。チェックは意図的な逆テストでもFAILすることを確認してから追加する。外部ツールの起動後DOM検査は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) を参照し、リポジトリ外で行う。

## 7. 実機確認の未完了項目

静的検査だけでは以下を保証できない。対応端末で確認したらこの節を更新する。

- **最優先：MMD／VRM** — 実ブラウザでLat式PMDとVRMを読み込み、Consoleにmodule resolution errorがなく、vendorの `three.core.js`／`BufferGeometryUtils.js` が404にならず、モデルが表示されること。
- **Music／プレイリスト** — タッチ端末で🐔の長押し階層・表示名・並べ替えを確認。Music内で利用者が作った`trk`フォルダを選んで中だけが読み込まれ、再スキャン可能であり、ファイルの新規作成・移動がないこと。公式wishで灰色→所持後に黒い行となり遊べること、`.ogg`と照合メモ／SEARCH LIGHT別名を実ファイルで確認。
- **カタログ曲リンク** — wish行から公式の個別ページ／作品ページが開くこと。楽曲別ページがない案内先は作品ページとして表示され、利用許諾と誤解されないこと。アークナイツ「墟」👹、Babel 5曲、LONETRAIL 10曲、イベントOST8作品も確認。
- **FIRST SPARK** — 30秒デモの初級・中級・上級を実際に遊び、27／54／111ノーツが音に合うか、`chartCustom`表示・難易度切替・達人/RUSHの自動生成・404時のフォールバックを確認。
- **軽量化** — Android Chrome／PWAで自動判定、20／30fpsの操作感・発熱・電池、装飾間引き、曲リスト60行、音声解析省略、MMD／VRM遅延読込を確認。
- **IndexedDB** — 既存pack入りのブラウザでv1→v2移行・`size` index・旧レコードのsize・新規保存・複数タブ時の `packDbBlocked` を確認。容量が0になる／過小計上する場合は最優先で調査。
- **書斎表示・テーマ** — 24スキンすべてで閲覧ページ・編集欄の色／書体／背景が反映されること、作文用紙の縦書き、4言語切替後も4つの`optgroup`内に選択肢が残ることを確認。AI風スキンが見た目だけで通信しないことも確認する。大量画像・Shift_JIS・quota超過・TVペインからのvideo復帰、色コントラスト、読み上げ（NVDA／TalkBack／VoiceOver）、モバイル幅も実機で確認。
- **本棚操作** — タイトルのクリック／長押しでフォルダ作成、PCのドラッグ＆ドロップとタッチでのフォルダ移動、手動順序・フォルダ先頭・削除確認スキップの保存／再起動後の復元、既定表示／非表示からの再表示、`→`／`←`割当・画像用`↑`／`↓`を確認する。狭い縦画面でも項目リストの高さを確保する。
- **テキスト編集・書き出し** — `.txt`／`.md`／`.js` の入力、Tab字下げ、Ctrl／⌘+S、自動保存と切替時の失敗ガード、本棚フォルダへの振り分けを確認する。通常ダウンロード／対応ブラウザのフォルダ選択、同名ファイルを上書きしないこと、元ファイル非書込み、HTML／JavaScriptを実行しないことも実機で確認。
- **媒体操作** — ゲームパッド／TVリモコン、バナーの短押し・650ms長押し、映像・音声・メディアプレーヤー・シンセを実ブラウザで確認。
- **譜面生成（chartGen・既定は新方式）** — 実機で、新方式の譜面が曲ごとに自然か（冒頭の静かな部分・後半の盛り上がり・Easy〜RUSHのLv表示・ノーツ増加の手触り）を確認する。「旧方式」に切り替えて従来の譜面・記録が出ること、旧方式の記録に「旧方式」の印が付くことも確認する。ヘッドレス（Chromium）での読込・切替・再読込の保存は確認済み（実機ではない）。
- **長い曲の解析省略（20分超）** — 実機（Android Chrome等）で、20分を超える音声・動画を読み込んだとき「20分を超える曲は…省略」の表示と、BPMグリッドの譜面が出ることを確認する。ヘッドレスChromiumでは21分のWAVで省略の表示と譜面生成を確認済み（実機ではない）。96MB超のファイルの省略は未確認。メモリ使用量は端末で未測定。

## 8. ユーザーが指定した維持条件

- アークナイツの「痕」は覚え違い。表示から消し、「墟」へ置換し、アイコンは👹。既存ID `ak-hen` は移行のため維持。
- 音声例は `.ogg`。Wish照合は両方一致を要求せず、曲名・キャラクター名／照合メモ・登録別名の**片方だけの一致でも候補にする**。
- Music内の`trk`フォルダを案内し、設定に選択導線を置く。既存フォルダ／ファイルは読み取り専用で、アプリはフォルダ作成や曲移動をしない。
- Blue Archiveは公式配布・配信と公式収録順を基準にし、購入・所持と二次利用の許諾を混同しない。Yostar公式ガイドラインを確認し、全楽曲・全用途に許諾があると断定しない。
- LoLは全楽曲カタログの調査を続け、特に約180体規模のChampion Themeは分割実装可。Worlds/WCS・MSIアンセムは公式リンクの存在だけで利用許諾とせず、権利・対象・条件を確認する。
- VALORANT・Arknights・Genshin・学マス・OJ/SAMも、公式リンクは利用許諾ではない。非公式Wiki・第三者アップロードを公式配信先と表記しない。学マスDOWNLOAD規約の限定的なファン動画条件を一般利用へ広げず、Drive未掲載は配布不可の証明としない。
- 他ゲーム（『太鼓の仙人12』等）の話題は設計思想の参考に限る。既存作品の楽曲・素材・表現を取り込まず、権利を守り独自の設計・コンテンツで進める。

## 9. 継続検討・未決事項

- **音楽カタログ**：LoLの未調査範囲（旧ログインテーマ・残りChampion Themes・Skin／イベント曲・ゲームOSTなど）を公式ソースと利用条件から段階調査。Blue Archiveについても権利者のガイドラインを軸に公式配信・購入先を案内し、購入だけで二次利用が許可されるという前提は置かない。
- **譜面生成**：静かなイントロから始まり後半ほど音量が大きい曲では、旧方式の自動譜面が後半へ偏る（冒頭に0ノーツ・20秒から開始の実測あり）。新方式（`chartGen` "2"）で改善し、**2026-10-08に既定を新方式へ切り替えた**（旧方式は `"1"` で選べる）。実機での手触りは§7で確認する。上級以上は元の密度が高く、盛り上がりの区間は候補の100%で頭打ちになる（仕様上、候補にない位置へは置かない）。レビューの対応状況は `docs/REVIEW-2026-10-08.md`。
- **IndexedDB回帰検査**：パック容量v2の移行・`size` index・複数タブ `onblocked` をNodeだけで実走する依存なしハーネス（候補 `tools/check-idb.mjs`）は未実装。現状は静的検査と§7の実機確認でカバーする。
- **軽量化の追加候補**：起動時のサンプル映像 preload と、rAF外のA-B／逆再生setIntervalは未調整。初速・ループ精度とのトレードオフがあるため、実機検証なしに変更しない。
- **実ブラウザ検収**：§7の端末確認が未完了。静的テストを根拠に実機検収済みとしない。
- **支援案（構想のみ）**：機能の有料解放・月額支援はしない。GitHub Sponsors等の候補、匿名性・本人向け支援記録、使途説明は未決定。権利条件が確認できるまで寄付リンク／募集表示を追加しない。Ko-fiへの誘導はしない。
- **権利・公開先**：PCL・東方Project等の条件、AI生成物を受け入れる公開先、5曲の配布条件は未確認のものが残る。別途制作した5曲はボーカルなしの手続き生成で、第三者録音・サンプル・ループ・引用メロディを使わず、アプリ／Gitには未同梱。許諾済みと見なさず、`NOTICE.md` の音源記載を他作品への包括許諾にしない。
- **開発アイデア**：称号、10秒以内の`trk!`入力に反応するスピードチャレンジ、TV／fxドックの連想ゲーム系スキン。実装決定ではない。
- Issue #21–#25の最新状態・#24本文の誤記はGitHubで確認する。正しい再現URLは `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/#reset=all&force=0`。Issueの現在状態をこの文書の古い記録だけで判断しない。CSP／配信ヘッダーは安定版リリース前に再評価し、通常開発ではCSPを追加しない方針を維持する。

## 10. 変更時のチェックリスト

- [ ] `git status`・差分を読み、既存のデータ／所持曲／ユーザーカスタムを保持した。
- [ ] 新規UIは4言語対応。設定は初期値・リセット・Import/Export・`?safe=1` を確認した。
- [ ] 外部URL・ファイル・第三者素材の出所と利用条件を検証し、利用許諾を誤認させない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] `README.md`・`NOTICE.md`・本書・`sw.js`の更新要否を確認し、未確認の実機作業を明記した。

## 11. 最近の変更

- **2026-10-08 — 譜面生成（レビュー1）：** 自動譜面を `js/chart-gen.js` の純関数へ分離。旧方式はca84a19の出力と140件ビット一致（ゴールデン）、新方式（`chartGen` "2"）は局所正規化・8小節区間配分・冒頭無音の判定の改善。`npm test` を追加。既定を新方式へ変更し、旧方式の記録に印を付けた。
- **2026-10-08 — 名前空間の準備（レビュー4）：** 棚卸し `tools/globals-audit.mjs`（宣言1169件、private 853／public 316、衝突0、window 経由の連携26）、実ブラウザのスモーク `tools/smoke-browser.mjs`（譜面10ケースのハッシュ・未解決の名前・ボタンのクリック）の基準を作成。計画は `docs/NAMESPACE-PLAN.md`。コードの動きは変えていない。
- **2026-10-08 — 曲名の照合（レビュー3）：** `plTitleKeys` などを `js/title-match.js` に切り出し、`tests/title-match.test.mjs`（14件）で `08_sometimes.fla`↔`08 sometimes`、SEARCH LIGHT↔SEARCH RIGHT、メモ照合、同名の取り違えを入出力で検査。変異テストで検出を確認。
- **2026-10-08 — 解析の上限（レビュー2）：** 音声解析の省略に長さ（20分）の条件を追加（`ANALYZE_MAX_SEC`）。容量超過の表示キー `analysisSkipped` が未定義だったため、4言語で定義し直した。
- **2026-10-08 — 書斎：** 本棚フォルダ／ドラッグ移動／手動順序／表示状態／ナビゲーションキー、テキストのコピー編集・自動保存・安全な新規コピー書き出し、24種の文字スキンを追加。4言語と静的回帰検査を更新。実ブラウザ・タッチ確認は未実施。
- **2026-10-08 — 公式カタログ：** VALORANT、Arknights、Genshin、OJ／SAM、Gakumas、LoL、Blue Archiveの公式リンク・権利注記・fixture／回帰検査を更新。各一覧の範囲と権利条件は§2.1を参照。
- **2026-10-07：** PR #31で集める棚・trk階層プレイリストを整備。PR #32でFIRST SPARK手づくり譜面と軽量化拡張を追加。
- **2026-10-06〜07：** PR #18/#19/#26/#27でvendor同梱、セキュリティ／アクセシビリティ検査、設定・パック容量検証を拡張。

長い旧 `NEXT_SESSION_HANDOFF.md` は本書へ統合済み。過去の細かな実装履歴・PR差分はGit履歴、検収記録は `docs/SECURITY.md`／`docs/QUALITY-CHECKS.md`、利用者向け仕様は `README.md` を参照する。
