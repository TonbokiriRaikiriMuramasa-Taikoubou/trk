# trk! 開発引き継ぎ

> **最終更新：2026-10-14（trk137）**。現在の仕様・守る条件・未確認事項の要約です。細かな過去の作業履歴（trk123以前）と trk114〜118 の検証の詳細は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、品質・安全確認は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) と [`SECURITY.md`](SECURITY.md) を参照してください。
>
> **本書の読み方**：§2＝今の仕様、§3＝壊してはいけない条件、§4＝実機で確認していないこと（ここが最重要）、§5＝ファイルの場所、§6＝自動検査で確かめたこと、§7＝最近の変更、§8＝変更時の点検。

## 1. 作業の基本

- 作業前に `git status --short` と差分を見て、既存の変更を破棄・上書きしない。
- Arenaで指定された作業ブランチを維持し、`main` へ直接 push しない。反映はPR経由。
- バンドラーはありません。`index.html` の `<script>` 順が依存関係と実行順を決めます。
- 変更後は `npm run check` と `git diff --check` を実行。静的・VM・スモーク検査の成功を、実音声・実機での確認済みとは扱いません。
- 公開JSを変更したら関連テスト・文書・`sw.js` のcache名更新要否を確認します。vendor pinの正は `tools/vendor-lock.json` です。
- `js/fx.js`／`js/fx-presets.js` の凍結は **trk114で解除**しました（2026-10-11、空さんの判断。trk109でfx.jsに足したMIDI MIXの経路も追認）。ほかのファイルと同じく、変更時はテスト・文書・実音声で確認します。fx.jsが読むための互換名（`chartMeta`・`phase`・`prefs`・`stats`・`videoReady`、読み取り専用の `_trkStudyRoomOpen`）はまだ残っていて、fx.jsを書き換えれば外せます（`docs/ADDONS.md` §0、`docs/NAMESPACE-PLAN.md`）。

## 2. 現在の実装状態

### TouhouカタログとローカルMIDI

- `js/touhou-theme-data.js` はTouhouThemeDBの固定スナップショット（commit `e70e645`、The Unlicense）。カタログは曲名等のメタデータだけで、ゲーム音源や抽出物は含みません。904 release IDのうち862をTouhou Project、関連ゲーム42 IDを別系列として扱います。完全性を保証する数字ではありません。
- ID形式のローカル名はユーザー設定名 → カタログ曲名 → 元ファイル名の順で表示します。例：`th06_05.mid`。**元ファイル名・保存済みタイトルは書き換えません。** 曲リストとの照合に使う別名は、根拠があるものだけです。
- `.mid`／`.midi` はローカルでコード生成WAVに変換します。SMF 0/1・PPQ対応、SMPTE非対応、入力上限8 MiB、10分。全曲・全作品にMIDIがあるわけではありません。
- 変換の処理量の上限（trk114）：各音が鳴る時間の合計×22050で **2億**（`MAX_RENDERED_VOICE_SAMPLES`）。聞こえなくなった余韻（音色の減衰が−72 dB以下、ドラムは各打楽器の減衰から決まる秒数以降）は描かず、数えません。ノートオフの無いドラムが曲末まで鳴り続けて上限を食う問題もこれで解消。超えたときは専用の文言「長い、または同時に鳴る音が多すぎる」（`midiTooDense`）を出し、イベント数・トラック数の上限（`midiTooComplex`）と分けました。変換中は5%刻みで進み具合を出し、別の曲を選ぶと次の区切りで止めます。合成ループは同じ音のまま約1.7〜2.4倍速く（出力差は1 LSB以内。7・10ビット化するプロフィールは量子化1段まで）。手元のMIDIの処理量は `node tools/midi-budget.mjs ファイル.mid [--render]` で測れます（読むだけ・送信なし）。
- 音色プロフィールは**24種**（一般的な音色傾向の参考10種＋trkオリジナル14種）。設定は次にMIDIを読み込んだとき反映されます。実SoundFont・SF2/SF3・PCM/WAVサンプル・ROM・東方ゲーム音源は含まず、実機や製品のエミュレーションでもありません。製品名に似た表記は広い着想を示すだけです。
- 選曲画面左下の `#richPanel` 直下に **TRK MIDI MIX** があります。プロフィール由来のDSPを通常音声に適用する機能で、初期オフ。SoundFont合成でも音声→MIDI変換でもありません。MIDI音色プロフィールとは別設定です。
- Audio設定のExport/Import、enum検証、リセット、セーフモードにプロフィール／MIX状態を接続済み。MIXはリセットとセーフモードでオフになります。
- 抽出ツールTouhou Music Room等は案内だけで、本体・実行ファイルを組み込んでいません。利用・抽出・再配布の注意は [`guide/touhou-midi.md`](guide/touhou-midi.md) を正とします。

### Riot系カタログとCreator-Safe（LoL・VALORANT・LoL関連ゲーム）

| シリーズ（`js/catalog.js`） | 中身 | 作られ方 |
|---|---|---|
| ⚔️ League of Legends（`lol`） | 22リスト・614曲（Sessions 3作、Champion Themes、Worlds、MSI、K/DA、Season 1〜9 OST、Warsongs、人気曲、trk118の4リスト＝Pentakill・ログイン／イベント／スキンのテーマ・eスポーツのテーマ・2025〜26年のサウンドトラック） | 自動（🐔 trk-lol） |
| 🎯 VALORANT（`valorant`） | 3リスト・48曲（Championsアンセム6曲・エージェント関連曲3曲・VALORANT Creator-Safe 39曲） | 🛒公式カタログから取り込む |
| 🛡️ Riot Games — LoL関連ゲーム（`riot-games`・trk118） | 7リスト・342曲（Ruined King・The Mageseeker・Hextech Mayhem・Teamfight Tactics Vol.1／Vol.2・2XKO・Wild Rift & Runeterra） | 🛒公式カタログから取り込む |

- **照合状態はプレイリストごと**に `js/catalog.js` の `LOL_CREATOR_SAFE`・`VAL_CREATOR_SAFE`・`RIOT_GAMES_CREATOR_SAFE` に持たせ、入手先ガイドの文言は `js/library.js` の `RIOT_GUIDE_KEYS` で選ぶ。照合していないものを対象と書かない（表に無い状態は「公式リンク集・Creator-Safeの対象と条件を要確認」）。

  | 状態 | 意味 | 文言キー | 該当リスト |
  |---|---|---|---|
  | verified | アルバムの全曲がプレイリストにある | `plGuideLolCsVerified` | Season 1〜9、Sessions: Vi・Star Guardian Taliyah |
  | partial | アルバムの一部だけ（`notFound`＝見当たらない曲） | `plGuideLolCsPartial` | Warsongs 10/11、Sessions: Diana 42/43 |
  | links-verified | 公式リンク集の全曲がある（プレイリストの曲から作ったリスト） | `plGuideRiotLinksVerified` | LoLの4リスト、VALORANT Creator-Safe、LoL関連ゲームの7リスト |
  | links-partial | 公式リンク集の一部だけ | `plGuideRiotLinksPartial` | Champion Themes 39/41、Worlds/WCSアンセム 1/13 |
  | links-absent | 1曲も見当たらない | `plGuideRiotLinksAbsent` | MSIアンセム、K/DA、VALORANTのChampionsアンセム・エージェント関連曲 |
  | mixed | 人気曲スナップショット（一部だけ） | `plGuideLolPopular` | LoL人気曲 7/30 |

  `unverified`（未照合）は後から足すリスト用で、今は使っていない。
- **根拠**：Riot Games Creator-Safe Playlist（979曲）の先頭100曲は公式の埋め込み表示（trk114）、101曲目以降は第三者サイト songdata.io の一覧（trk115〜116。表示は977曲で、出ない2曲は701〜750番目）。VALORANT Creator-Safe Playlist（40曲）は公式の埋め込み表示で全曲。記録は `tools/leagueoflegends-*-tracklist.json`（各リストの `creatorSafe`）、`tools/riot-games-creator-safe-playlist.json`（51〜977行目の曲名・アーティスト・SpotifyトラックID）、`tools/valorant-creator-safe.json`。`check-repo` が状態・曲数・見当たらない曲・根拠の一致、trk118のリストの全曲が記録したトラックIDと一致すること、記録した927行がすべてどこかのリストにあることを検査する。
- **見当たらなかった曲**（Warsongs「Silver Scrapes」、Champion Theme「Smolder, the Fiery Fledgling」「Yunara, the Unbroken Faith」、Sessions: Diana「Oh Baby」）は、空さんの判断で追加確認をしない（2026-10-12）。「見当たらない」のまま扱う。
- trk108〜113の「Season 1〜9・Warsongsは確認済み」は根拠の無い過大表記で、trk114で訂正した（経緯はアーカイブ）。
- Creator-Safe でも Riot の法務表記（Legal Jibber Jabber）に従うことが条件で、音源の同梱・再配布・販売や企業広告での利用は別条件。音源はカタログにも同梱しない。曲別出典・範囲・権利上の注意は [`LEAGUE-OF-LEGENDS-MUSIC.md`](LEAGUE-OF-LEGENDS-MUSIC.md) と [`VALORANT-MUSIC.md`](VALORANT-MUSIC.md)。

### その他のカタログ

- **Endfieldカタログ**（trk110〜trk111・trk128で整頓）は初号指令OSTと公式アルバム6作の2系統です。いずれも公式Spotify収録順・各曲は公式Spotify個別曲ページへリンクし、取り込み時に自動でプレイリスト化します。音源は同梱しません。
  - **並び順（trk128）**：①初号指令OST 上下2巻を**最上**（ゲームのオープニングBGMがここにある）。表示名はtrk129で24文字に収まる「初号指令 (上) ZD OST Vol.1」／「初号指令 (下) ZD OST Vol.2」へ（trk128の長い名前は保存時に「初号指令 (上) ― Zeroth Direct」と語の途中で切れていました。旧既定名からの改名はセーフリフレッシュ・§2参照）。②公式アルバム6作を**リリース順**（Eve of Departure 2026-04-11 → Thunder's Legacy 2026-04-22 → At the Wake of Spring OST 2026-04-30 → Contingency Contract Re-Ignition OST 2026-06-20 → Homecoming OST 2026-07-31 → Dreamscape of Wind and Snow OST 2026-09-10）。③**キャラクターテーマ4リスト**（ef-blurring・ef-ashen・ef-floaty・ef-makers。Talos Wiki（コミュニティ）では Laevatein×2・Gilberta・Yvonne のOperatorテーマ）をネスト棚 **`trk-endfield-character`「Endfield Character Theme」（🎭、trk-endfieldの子）**にまとめる。④紹介リスト ef-signal を最後に。順序の正は `tools/endfield-zeroth-directive-tracklist.json` の `seriesPlaylistOrder`（check-repo がシリーズ全13リストの順を検査）。
  - **一回限りの整頓（trk128）**：`js/library.js` の `trkEndfieldTidyOnce` が初回起動だけ、既存取り込みを上記の順へ並べ替え（配列順・`playlistOrder`・`createdAt` の3系統）し、キャラクターテーマ4リストをまだ既定場所（trk-endfield）にあるものだけ棚へ移動する。`settings.trkEndfieldTidy1` の印が付いた後は並び・配置とも二度と触らない（利用者の配置・手動並べ替えを守る）。改名は**保存データに実際にある24文字切り名「Endfield — Zeroth Direct」にも命中**する（実アプリでは保存名が `plSanitize` で24文字に切られ、trk110の上下の名前が同じ文字列になる）。フォルダ上限は 12→13（`plTighten`・`core.js`）。🐔階層メニュー（plTrkMenu）は一段深い棚も表示する。
  - **trk128で修正した既存欠陥**：サブフォルダ（🐔 の中の棚など）を開いたとき、そのフォルダがタブ帯に無かったため表示が「すべて」へフォールバックしていた。`libTabsOf` が見ているサブフォルダのタブを出すようにした（`plNested` 付き・見なくなったら消える＝フォルダ内プレイリストタブと同パターン）。
  - 初号指令OST「Zeroth Directive」：Vol.1 37曲＋Vol.2 23曲（2026-02-15 配信開始）。各巻は公式告知のffm.to配信一覧へリンクし、中国語公式曲名を照合別名に登録済み。旧「初号指令 OST」4パート紹介版は永続ID `ef-firstorder` を保ったままVol.1全曲版へ、旧既定名（trk110・trk128の名前＝保存は24文字切り）も安全更新されます（所持曲・ユーザー変更は維持）。
  - **表示名は24文字に収める（trk129）**：保存名は `plSanitize` が24文字で切るため、trk128 の長い名前は「初号指令 (上) ― Zeroth Direct」のように語の途中で切れていました。trk129 で「初号指令 (上) ZD OST Vol.1」／「初号指令 (下) ZD OST Vol.2」（21文字。ZD＝Zeroth Directive。フル名はタグに残る）へ改名し、旧既定名からの改名表を `js/library.js` の `ENDFIELD_FIRSTORDER_OLD_NAMES` にまとめました。`check-repo` が24文字に収まることも検査します。
  - Metal Scar Radio 公式アルバム6作・計81曲（trk111）：各アルバムは公式Spotifyアルバムページへリンクし、`trk-ef-*` プレイリストとして自動作成。
  - 権利表記：©/℗ GRYPHLINE（Hypergryph）、レーベルは Metal Scar Radio（鐵痕電台）。配信・購入は二次利用許諾ではなく、公式二次創作ガイドラインは公式素材のそのままの複製・抽出を禁止します。
  - 未確認（断定しない）：6作の中国語公式曲名・公式告知のffm.to配信一覧（Homecoming を除く）・VGMdb照合・他ストアの曲別URL。照合別名は付けていません。「配信なし」とも書きません。trk128 で Talos Wiki（コミュニティ運営）から確認したキャラクター分類・発売日・3アルバムのSpotifyID（Ashen Remains 6aFenM2edcPyIfzg6ZtQnz／Maker's Luv 4ZZOkqQONyAFHzEG31Qss4／The Floaty Envelope 44qElu191kLQ5fit5fAQ6g・Blurring曲 0QqtGr91Q6JxiUW7sCukIg）は**公式ページでの再確認が未実施**＝台帳の「調査中の他の公式リリース」へ記録。
  - 台帳とfixture：[`ARKNIGHTS-ENDFIELD-MUSIC.md`](ARKNIGHTS-ENDFIELD-MUSIC.md)、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`。

### 書斎の設定と画像キー（trk133〜135）

- **全画面フィット（trk135）**：設定の一番上「全画面時に強制的に画面にフィットにする」（`fullscreenFit:false` が既定、保存値は boolean `true` だけオン）。全画面中だけ画像全体を縦横比を保って表示（単ページ・見開きの左右それぞれ・縦読みの1枚ごと）。`studyFullscreenFitActive` と `studyApplyZoomValue` が保存済み `zoom` を変えず、表示倍率だけ1／`data-fullscreen-fit=1` にします。CSSは `minmax(0,1fr)` で縦横の枠を確定し `object-fit:contain`（単に倍率を1へ戻すだけでは大きな画像がはみ出すため）。強制中はキー・ホイール・ピンチで倍率を変えず、ドラッグのパンも止めてスワイプを維持。ネイティブ全画面・CSS代替・ブラウザからの全画面終了・リサイズに対応し、終了後は元の拡大率へ。縦読みは各ページを画面高に収め、一覧は引き続きスクロールします。
- **書斎上部に常時「⚙ 設定」**（trk134）。本を未選択・本棚非表示でも開けます。読書見出しの **「画像を全画面化」の左にも「⚙ 設定」**。本棚にも入口があり、従来の上級者向け項目を同じモーダルへ移設（コントロールは複製しない）。本棚非表示・テキスト閲覧中にも読書側から開けます。変更は即保存。Esc／閉じる／背景クリックで設定だけを閉じ、入口へフォーカスを戻します（本棚を隠して入口が消えたら、見える入口へ）。設定中は本体を inert にし、Tab はパネル内、読書ショートカットは止めます。キー割り当ては引き続き設定内で使えます。
- **PageDown＝画像の下端、PageUp＝上端が倍率に関係なく標準**。はみ出す画像が対象（単ページ・見開き、100%・縮小も）。端で押し直すと次／前ページを続きの端から開き、本の端では全画面を終了して本棚へ。**「最後のページ時PageDownで本を閉じる」**（`closeOnLastPageDown:true` が既定、trk134）をオフにすると、最後の画像の下端で止まって本・全画面を維持します（キーは処理済みにしてページ送りへ落とさない）。単ページ・見開きの画像端移動に適用。先頭でのPageUp・中クリック・直接ページ送りモード・縦読み・テキストには変更なし。保存値は `false` だけオフ、未保存・不正型は初期オン。押しっぱなしでは端で停止。`↑`／`↓` の拡大時スクロール、縦読み・テキスト・画面に収まる画像の従来動作は変更なし。
- 設定 **「PageUP、PageDownをページ動作にする」**（`pageKeysTurnPages:false` が既定）をオンにすると直接ページ送り。旧 `zoomEdgeKeys:false` は新設定 `true` として引き継ぎます（新設定の boolean があれば優先、文字列は boolean として扱わない）。保存先は従来どおり書斎専用 IndexedDB の `settings/ui`。アプリ全体の設定 Import/Export・リセットとは別の既存経路で、`?safe=1` では書斎を開かず保存領域を読みません。明示的に割り当てた「次へ／前へ」のキーは引き続き優先。

### 維持中の既存機能

- **🎓 trk's OST Vol.1（オリジナル曲の置き場）**：🐔 trk's playlist の中、Game Vol.1 の直下にあります（`TRK_OST_ID = "trk-ost-v1"`）。今はチュートリアルのデモ曲1曲のみ。trk113の手続き生成スケッチ（下記）はまだアプリ未組込で、将来ここへ増やしていく想定です。trk112が最上位に作ったものだけを一度trkフォルダへ移し（印は `cat: "trk:ost"`）、以後は利用者が動かした場所を守ります。
- **消した自動リストは作り直さない（trk114）**：trk!が自動で作るリスト（IDが `trk-` で始まる Game Vol.1・Classic Vol.1・trk's OST Vol.1・カタログの各リスト）を消すと、`settings.trkRemoved` に印が残り、次の起動で作り直しません。設定「🐔 trk's playlist」の **♻ 消したtrkのリストを戻す（n件）**で印を外して作り直します（Game Vol.1／Classic Vol.1の「開く」ボタンもその1件の印を外す）。印は `trk-` で始まるIDだけ・200件までに検証し、全リセットで空に戻ります。
- **入手先ガイドは表示言語で出す（trk114）**：公式カタログ由来のガイドは辞書キー（`plGuide…`）と日本語の控えを保存し、表示時に今の言語で引きます（LoL・Endfield・ブルアカ・学マス・Game／Classic Vol.1など21キー×4言語）。既存の保存データは起動時に自動で鍵が付きます。カタログ本体の各シリーズ説明文（`js/catalog.js` の `note`）はまだ日本語だけです。
- **小さなアクセント文字の色（trk114）**：`--ui-accent-ink`（`js/data.js` の `accentInk`、`applySkin` が毎回設定）。設定画面の入れ子の欄（カード＋パネル＋小欄の重なり）でも4.5:1になるまで、アクセントを本文の色へ5%ずつ寄せます。足りているスキンは元の色のまま。44スキン中16スキンで色が少し変わりました（スキンの棚の見出し、リンク、記録表の選択行など13ルール＋fx.jsのリンク1箇所）。
- **曲名バナーの操作（trk73・trk126）**：バナーの**右端に [◀][🎲][▶]**（前後の曲・おまかせ。🎲 は既定で長押し650ms、設定で「タップだけ」「非表示」を選べる）、**右下に [⏯][🔊]**（同じ大きさのアイコンだけのボタンを並べた `.bannerMediaBar`）。🔊 は短押しでスライダー・長押しでミュート／復元。**⏯ は選曲中にプレビューの音を止める／鳴らす**（止めたところから鳴り直す）、曲の再生中・一時停止中はゲームの一時停止／再開（プレイ中は選曲画面ごと隠れるので、ふだん見えるのは選曲中）。**曲名に触れて曲を選び直すと一時停止は解除されて鳴り直す**（止まったままにならない）。設定などへ行って選曲画面に戻ったときも、プレビューは開始位置から鳴り直します（`library.js` の `screen` → `startPreview`）。**これは意図どおり**（2026-10-12のレビューで確認）：一時停止は「いまだけ止める」もので、次に曲を選ぶのは音を鳴らしたいという判断のため。止めた状態を保つ仕様ではありません（「ユーザーが止めた」フラグは持たせない）。止める音がないとき（曲未選択・プレビューオフ）は押せない状態で、ボタンの説明（ホバー・読み上げ）が理由を出します（trk127：曲を選ぶ／プレビューをオンにする／その他。`bannerPlayTipKey`）。設定「右上の曲名をタップで一時停止／再生」（初期オフ）はバナー全体のタップとして別に残ります。
- **タブの挙動（trk112）**：チュートリアルのデモ曲は独立タブ（🎓デモ曲）をやめ、上記 trk's OST Vol.1 にまとめました。開いたタブは libOpenTabs で残り、削除はタブの ⚙（長押し）設定から（曲はライブラリに残る）。**フォルダ内のプレイリストを開いたタブは閉じるまで残る**のが既定になり、フォルダ内タブの中クリックは「タブを閉じる」（本体は残す）に変更しました。
- **🎼 手続き作曲ツール（trk113）**：`node tools/make-trk-ost.mjs` で10曲のWAVスケッチを生成（5ルール×2曲＝コード進行／確率・統計／進化的アルゴリズム／深層学習／自由作曲）。出力は `assets/trk-ost/`（.gitignore でGit外・同梱するのは生成スクリプトのみ）で、試聴は同ディレクトリの `index.html`。外部ライブラリなし・決定的（毎回同じ音）です。**アプリ本体には組込んでいません。**
- **📁 プレイリストフォルダの上限は40（trk129）**：`PL_FOLDER_MAX`（`js/library.js`）と `js/core.js` の読み込み上限（`slice(0, 40)`）が対です。trk の固定棚（🐔・Classic・BA・LoL・東方・Touhou関連・Arknights・学マス・Endfield・🎭）で10個使うので、利用者のぶんを十分に残します。**作るときに上限を確かめ**、いっぱいならトースト（`plFolderLimit`・4言語・`{n}`）で知らせて作りません（カタログ取り込みでは入りきらないリストをフォルダなし＝トップへ置きます）。上限を超えた配列は `plFolderTrim` が trk の固定棚を先に残して利用者のフォルダを後ろから落とします（trk128 の上限13では、利用者のフォルダが4個以上あると 🎭棚が起動のたびに切り捨てられ、キャラクターテーマ4リストがトップへ落ちていました）。
- **記録とゴーストのキーは MOD に依存しない（trk129）**：`chartKeyOf` は MIRROR／RANDOM を掛ける**前**のレーン（`resetRun` が残す `origLane`）で作ります。掛けた後で作っていたため、同じ譜面でも MOD の有無で記録の行が分かれ、ゴースト（`beforePlay` でキーを引くので `resetRun` の前）は MOD を変えた直後に出ませんでした。MOD 無しの既存の記録のキーは変わりません（MIRROR を掛けた古い記録は行が分かれたまま残ります＝戻しません。レビュー第4弾に「左右反転したキーも引けばMIRRORの分だけ救える」との提案がありましたが、RANDOMの分は救えず数も少ないため、**2026-10-13 利用者の判断で救わない**）。MOD ごとにベストを分けたくなったら速度別（`slot.rates[rateKey()]`）と同じように入れ物側で分けます（**2026-10-13 利用者確認済み：この方針で確定**）。**譜面の書き出しも同じ考え方（trk132）**：`chartToData`（`js/media.js`）は `n.origLane ?? n.lane` を書き、一時停止画面・結果画面からの書き出し（`exportChart`）と曲パック（`custom.js` の `buildSongPack`）に MOD 後の譜面が入りません。
- **↕（並べ替え）は「いま見えている並び」で動く（trk130）**：`trkMovePlaylist(id, dir, peers)` は `peers`（その画面で隣に並ぶプレイリストのID＝表示順）の中だけで隣と入れ替え、`playlistOrder` は trk の表示順を全部書き出した形に組み直します。**消えたプレイリストのIDはここで落とします**（旧版は `playlistOrder` に残った削除済みIDと入れ替えて、押しても画面が変わらないことがありました）。端と🔤ABC順では `trkMoveButtonsState` が↑↓を押せなくします（3つの一覧＝🐔の階層メニュー・フォルダ設定・🐔の設定画面すべてが `peers` を渡し、フォルダ設定は並べ替え後に開き直します）。
- **📥共有プレイリストの取り込みは読み込み前の4MiB上限（trk130・F-34）**：`PLAYLIST_IMPORT_MAX`（`js/library.js`）を `f.text()` の前に判定し、超えていれば4言語の `plImportTooBig` で案内して読まない（曲数1000などの上限は解析の後にしか効かないため）。
- **共有プレイリストの曲名照合は「一意なゆるい一致」だけを採る（trk130）**：`plMatchByTitle` は①曲名の完全一致（大きさ優先）→②表記ゆれ（`plTitleKeys`／`plSongMatchKeys`。区切り・拡張子・先頭のトラック番号まで外す）の順で探しますが、②は**候補が1曲に絞れて、共有側に大きさがあれば大きさも合うときだけ**採ります（「01 intro」と「03 intro」を同じ曲にしないため。索引 `plMatchIndex` は曲リストごとに1回だけ作り、捨てられれば消える `WeakMap`）。
- **📦パックを外したら、パックが変えた設定を戻す（trk130）**：パックが変える項目（スキン・ノーツの色/形・エフェクトの強さ・SEのオン）は、当てる前に `settings.packPrev`（**設定として保存**。`prev`＝当てる前の値、`applied`＝パックが当てた値）へ退避し、**外したときに、利用者がその間に自分で変えていない項目だけ**戻します（変更していればその値が正）。パックを当てたまま再起動してから外しても戻り、A→Bの切り替えでは最初の退避を保ちます（**2026-10-13 利用者確認済み：この実装で確定**）。ただし**Aを使っている間に自分で変えた項目は、切り替えの直前に `packRebase` が「戻る先」（`prev`）へ取り込み、`applied` から外します**（触っていない項目は最初の退避のまま。trk132）。**スキンを持つパックAから、スキンを持たないパックBへ切り替えたとき**は、Aのスキンを消すときに退避したスキン（`prev.skin`。無ければ `shadow`）へ移り、`applied.skin` を外します（旧版は `shadow` へ移るため、Bを外しても元へ戻りませんでした。trk132）。古い版で当てたままのパックには `applied` だけ控えます（無い場合はスキンを既定へ戻す従来の控え）。
- **パック切り替え中のSEは上書きしない（trk130）**：`deactivatePack` は自分のSE（`seFiles`）を読み直しません（`persist=true`＝本当に外すときだけ戻し、パックが読み込んだ音との競合を避けます）。音を持つパックから音を持たないパックへ切り替えたときは、新しいパックの読み込み後に自分のSEへ戻します。
- MMD内蔵モーションは**65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。Latの表情モーフを含み、新規・リセット時の既定は `faceSing`。VMDはコードで生成し、第三者の振付データは同梱しません。

## 3. 維持するデータ・安全条件

- ローカル曲、画像、文章、元ファイルは読み取り専用。入力フォルダの作成・移動・削除・上書き、音源のアップロードや永続保存はしません。音声変換や解析は端末内で行います。
- 公式リンク、購入、サブスクリプション、カタログ掲載だけを再配布・二次利用許諾の根拠にしません。許諾が未確認のものは未確認と表示します。
- Touhouのタイトル索引・MIDI演奏機能と、Touhouゲームの音源・実サンプル・抽出データを混同しないこと。実サンプルを追加する場合は、ファイル単位の権利根拠と再頒布許諾を確認するまで同梱しません。
- Import時は既知キー・型・enumを代入前に検証し、拒否した設定と理由を表示します。MIDIプロフィールIDも実在一覧に対して検証します。
- 新規UI文言は日本語・英語・中国語・韓国語をそろえます。中国語・韓国語を母語話者が確認したとは限りません。

## 4. 未完了の確認

1. **MIDI／MIXの実ブラウザ・実音声確認**（PC・Android）：有効なSMF 0/1の読込、24音色の違い、プロフィール選択が次の読込に反映されること、形式・サイズ・長さ制限を確認。MP3/WAVでMIX初期オフ／オン／プロファイル切替を確認し、セーフモード・Audioリセットで停止することも確認する。現時点では自動テスト済み・実音声未確認。
   - trk114：**実際の東方MIDIで処理量の上限（2億）を確かめる**。手元のファイルで `node tools/midi-budget.mjs *.mid --render` を実行し、各曲の処理量・PCでの変換時間を記録する（ファイルはリポジトリに入れない）。Androidでは変換時間と進み具合（%）の表示、変換中に別の曲を選んだときに止まること、余韻を打ち切った曲の終わり方（不自然な切れ目がないか）を聴いて確認する。合成ループの高速化は出力差1 LSB以内をNodeで確認しただけで、実機の音は未確認。
2. **カタログ名表示**：ユーザー設定名 → カタログ名 → 元ファイル名の優先順と、元ファイル名・保存名が変わらないことを実際のライブラリで確認する。
3. **音源ジャケット**（trk101〜106）：曲一覧のサムネイル表示は利用者確認済み（2026-10-09）。選択中バナー・TV・書斎、譜面中の右上配置、フィルター、画像なし、表示設定の優先順はPC／Androidの実曲で確認する。詳細は旧記録と [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) を参照。
4. **LoL外部ページ**：Season 4〜9 のSoundCloudセット表示と、地域制限曲を含む人気曲リンクを実ブラウザで再確認する（Warsongsのセットはtrk115で確認済み）。曲別調査はLoL台帳を更新する。
5. **Endfield配信リンク**：Zeroth Directive OST 60曲＋バッチ2の6作81曲のSpotify個別曲ページ、各巻のffm.toスマートリンクと网易云音乐アルバムの表示・地域差を実ブラウザで再確認する。バッチ2は個別曲IDの抜取確認が6曲のみで、残り75曲のIDは未個別確認。バッチ2の中国語公式曲名・ffm.to告知リンク（Homecoming 以外）・VGMdb照合・他ストアの曲別URLは未確認のまま。Zeroth Vol.1 は 2026-10-11 に Apple Music 掲載を確認済み（Vol.2 のアルバム別URLは未照合）。未収録の公式リリース（Yi／Old Deep Water Dies／Sketches of Lost Heirlooms／A Promise Makes a Home 等）は台帳の「調査中の他の公式リリース」表に確認状況を記録済み。曲別調査はエンドフィールド台帳を更新する。trk128 の並び・棚・改名はヘッドレスChromiumのe2e（20項目）で確認済みだが、**実端末でのEndfieldタブの見た目（並び・「Endfield Character Theme」棚）は未確認**。
6. **🎼 手続き生成10曲の聴取確認**（trk113）：自動検査は「無音でもクリップでもない」こと（peak 0.62〜0.72・RMS 0.08〜0.29）と決定的生成しか確認していません。曲として聴けるか・不快なノイズや耳障りな音がないか・音量バランスは、`assets/trk-ost/index.html` で実際に聴いて確認する。採用曲を決めたら、trk's OST Vol.1 への組込み方（音源の権利表記・同梱可否）を別途決める。
7. Android Chrome／PCでService Workerのsafe・オフライン、MMD／VRM、IndexedDBを確認する。Node・shim検査は実機確認の代用ではありません。
8. **trk114の画面確認**：①自動リスト（例：LoLのSeason 3）を消して再起動しても戻らないこと、♻ボタンの件数表示と復元、trk's OST Vol.1を別フォルダへ動かして再起動しても戻らないこと。②英・中・韓のUIで入手先ガイド（タブの長押し）が各言語で出ること。③色が変わった16スキン（shadow・daylight・sakura・snowfield・garden・strawberry・melonberry・dawn・midnightsun・pastelloop・wagara・showacafe・cbLight・shojiLight・morningKitchen・mikuClassic）で、スキンの棚の見出しやリンクの色が見やすく、スキンの雰囲気を壊していないこと。ヘッドレスChromiumでは①②とcbLight・shojiLight・morningKitchenのaxe（4.61〜4.62:1）を確認済み。
9. **書斎の設定と画像キー（trk133〜135で実機確認してほしいこと）**：trk135の全画面フィット（実機のピンチ・画面回転・全画面終了で元の倍率に戻ること）。trk134の上部設定入口（未選択・本棚非表示）と「最後のページ時PageDownで本を閉じる」の切り替え。trk133の操作感と最後で閉じる動作は利用者から好評（端末・ブラウザの詳細は未確認）。以下は従来の確認項目：読書見出しの設定ボタンの押しやすさ、本棚を隠したままの設定、等倍の大きな画像で PageDown／PageUp → 端で押し直してページ送り → 本の端で閉じる動作、新設定オンで直接ページ送りになること。ヘッドレスChromiumでは確認済みですが、実際のPC／Androidの手ざわりは未確認。**以下はtrk119〜127の経緯（倍率制限はtrk133で解除）**：拡大した画像を `↑`／`↓` で送る動きは、ヘッドレスChromium（PCの画面比・全画面モード）で確認済み。PC・Androidの実機で、トラックパッドやノートPCのキーボード、日本語配列、`←`／`→`のページ送りと混ぜて使ったときの体感、および長い本（縦読み）での手ざわりは未確認。実際に読みながら「1回押しの送り幅（画面の84%）」が多すぎ／少なすぎないかも見てほしい。拡大の送り幅の設定（trk120、初期値5%・1／2／5／10／25%）も、実機で「気持ちよく拡大縮小できるか」を試してほしい（ホイール・＋／−ボタン・ピンチで同じ幅を使う）。trk121〜123の `PageDown`／`PageUp`（初期オン。拡大中は下端／上端へ、端でさらに押すと次の／前のページを続きの端から開き、**本の端では閉じる動作**＝画像の全画面を終了して本棚へ）と、trk124の**PCのマウス操作**（**左右クリックでページ送り**＝左＝次へ・右＝前へ、**左右の反転**つき。**中クリック**は「何もしない／次のページへ／閉じて本棚へ（全画面を終了）」の3択。初期値はオフ／何もしない）は、PCの実機で試してほしい。マウスは**右クリックでブラウザのメニューが出ないこと**（画像の上では前から出ません）、中ボタンの押し心地、ブラウザの自動スクロールが出ないこと、トラックパッドの中クリック、トラックボールや左利きでの左右の反転、指のタップ（これまでどおり左右の半分で送る）と混ぜて使ったときの手ざわりを確かめてほしい。実際に読みながら「端でさらに押すと次の／前のページへ」「本の端で閉じる」が好みか、読んでいる途中で意図せず閉じてしまわないか（押しすぎ）も見てほしい。中クリックの設定はtrk124で選択式に変わったので、trk121から中クリック＝次のページを使っていた人は選び直しが必要かどうかも。 **trk127の押しっぱなし停止**：ヘッドレスChromiumで、単発・押しっぱなし（同じキーのrepeat）を再現し、端で止まること・本を閉じないことを確認（修正前の版では次のページへ進み、本が閉じることも再現）。実際のキーボードの連打・OSのキーリピート設定での体感は未確認。
10. **Riot系カタログの画面確認**（trk116〜118）：🛒公式カタログに「🛡️ Riot Games — LoL関連ゲーム」と「VALORANT Creator-Safe」が出て取り込めること、LoLフォルダに4リスト（Pentakill など）が増えたこと、各リストの入手先ガイド（全曲／一部／見当たらない）が4言語で出ることを実機で確認する。新しい539曲のSpotifyリンクは、トラックIDの抜き取り確認が3件（VALORANTの36件は別の一覧と照合）なので、数件開いて確かめると確実。ヘッドレスChromiumでは取り込みとガイド表示を確認済み。
11. **入口まわりは実機で確認済み（trk125・trk126）**：曲リスト右の **📚 書斎** ボタン（常時表示）と、曲名バナーの右下の **⏯ 再生／一時停止**（音量ボタンの左）は、**2026-10-12に実機で動作確認済み**（空さん。選曲中のプレビュー停止／再開と、曲名に触れて選び直したときの鳴り直しを含む）。配置も「いい配置」とのこと。「長押しで書斎に行かない」という報告は、ヘッドレスChromiumの自動化では再現せず（タイトル・再生中・一時停止中・開いて閉じた後・ライトモードのオン／オフ・マウス／タッチのいずれでも開く）、その後の実機でも問題なく開いている。**もし再発したら**、端末とブラウザ、押し方（指かマウスか）を教えてほしい。アイコンだけの小さなボタンなので、押しやすさ（大きさ・位置）は引き続き見てほしい。
12. **trk129〜132の確認（実機で見てほしいこと）**：この4回は自動検査（`npm run check`・`git diff --check`）までで、**実機での確認は未実施**です（trk132の①②③は§6のとおりヘッドレスChromiumでも確認しましたが、ほかは自動検査のみ）。見てほしい順に：①**↕の並べ替え**（🐔の階層メニュー＝タブ長押しで、同じフォルダ〈Volの並び〉の中の↑↓を押すとその場で1つ動くこと。押しても画面が変わらない・別のフォルダの曲と入れ替わる、が直っているか。並びの端ではボタンが押せない〈薄い〉こと、🔤ABC順がオンなら4つのボタンすべてが押せないこと。フォルダ設定⚙で並べ替えると画面が開き直って新しい並びが見えること）。②**📦パックを外したとき**（パックが変えたスキン・ノーツの色/形・エフェクトの強さ・SEのオンが、当てる前の値に戻ること。パックを当てたまま再起動してから外しても戻ること。パックを使っている間に自分で変えた項目は元に戻らないこと。音を持つパックAから音を持たないパックBへ切り替えると、自分の読み込んだSEが消えたままにならず戻ること＝素早く切り替えても取り違えない）。③**📥共有プレイリスト**（4MiBを超えるファイルを選ぶと読み込まずに「ファイルが大きすぎます」と出ること〈4言語の文言は自動検査のみ〉。曲名が `08 sometimes`／`08_sometimes` のような表記ゆれで、手元の同じ曲にだけ✅が付き、別のアルバムの「01 intro」と「03 intro」のような曖昧な名前は✅にならないこと）。④**MIRROR**（掛けて遊んだとき、記録の行がMOD無しと同じ行に入り、ゴーストが前回どのMODで遊んでいても出ること）。⑤**Endfieldタブ**（上下の名前が「初号指令 (上) ZD OST Vol.1」「初号指令 (下) ZD OST Vol.2」と切れずに表示されること＝旧名の利用者も改名されること）。⑥**フォルダ上限40**（40個目までは作れて41個目は作られず、トースト「📁 フォルダは40個までです。使っていないフォルダを消すと作れます」が出ること〈4言語の文言は自動検査のみ。実際の表示は ja で確認してほしい〉）。⑦**🎭棚の戻し**（trk128をすでに4個以上のフォルダで起動していた環境＝🎭棚が消えてキャラクターテーマ4リストがトップへ落ちた状態で、新しい版の初回起動にだけ4リストが🎭棚へ戻り、2回目以降は利用者が動かした配置が守られること）。⑧**📦パックの切り替えとスキン**（スキンを持つパックAから、スキンを持たないパックBへ切り替えてBを外すと、Aのスキンではなく、Aを当てる前の自分のスキンに戻ること。Aを使っている間に自分でスキンを選び直したときは、その選んだスキンに戻ること）。⑨**MOD付きで遊んだ後の書き出し**（ミラー／RANDOMを掛けて遊んだ後に、一時停止画面・結果画面の「Export」や曲パックの「今の譜面を含める」で書き出しても、MOD後の譜面ではなく元の譜面が出ること）。※⑥⑦はヘッドレスChromiumでも未実施（自動検査のみ）。**⑧⑨はヘッドレスChromiumのe2e（17項目）で確認済み**（§6・trk132）だが、実機では未確認。
13. **trk136の確認（実機で見てほしいこと）**：①全画面フィットをオンにして **PageDown を長押し** すると、ページが連続して進むこと（描画が追いつかないときは止まり、追いついたら続く）。はみ出す画像では、長押しが端で止まること（従来どおり）。②設定の **💾 端末の保存** が、PC・Android Chromeで「固定されています」と出るか（Androidでは利用の状況により固定されないことがあり得ます。その場合は表示どおり書き出しで控える）。

## 5. 主なファイル

| 内容 | ファイル |
|---|---|
| Touhou固定タイトルデータ・曲カタログ | `js/touhou-theme-data.js`、`js/catalog.js` |
| 曲名照合・表示名 | `js/title-match.js`、`js/library.js`、`tests/title-match.test.mjs` |
| MIDI音色プロフィール・レンダラー・UI | `js/midi-profiles.js`、`js/midi-player.js`、`js/midi-settings.js`、`js/media.js` |
| 通常音声MIX DSP・左下パネル | `js/fx.js`、`js/fx-dock.js`、`css/style.css` |
| 設定・Import検証 | `js/core.js`、`tools/check-security.mjs` |
| 共有プレイリスト（📥）の取り込み・曲名照合 | `js/library.js`（`plImportPick`・`PLAYLIST_IMPORT_MAX`・`plMatchIndex`・`plMatchByTitle`）、`js/title-match.js`、`tests/playlist-import.test.mjs` |
| 🐔の並べ替え（↕） | `js/library.js`（`trkMovePlaylist`・`trkMoveButtonsState`・`trkOrderedPlaylists`）、`tests/trk-move-order.test.mjs` |
| 📦パックを外したときの復元 | `js/custom.js`（`packSnapshot`・`packRebase`・`packApplied`・`packRestoreSettings`・`restoreOwnSounds`）、`js/core.js`（`cleanPackPrev`・`settings.packPrev`）、`tests/pack-unapply.test.mjs` |
| MIDI/MIXとカタログの検査 | `tests/midi-player.test.mjs`、`tests/media-midi-integration.test.mjs`、`tests/midi-mix.test.mjs`、`tests/touhou-catalog.test.mjs` |
| MIDIの処理量の測定（手元のファイル用） | `tools/midi-budget.mjs`（`estimateRender` を使う。読むだけ） |
| 自動リストの削除の印・ガイドの言語 | `js/library.js`（`trkRemoved`・`trkRestoreRemoved`・`trkCatalogGuide`・`plGuideText`）、`js/core.js`（`cleanTrkRemoved`）、`tests/trk-playlists.test.mjs` |
| Riot系カタログ（LoL・VALORANT・LoL関連ゲーム）のCreator-Safe照合状態 | `js/catalog.js`（`LOL_CREATOR_SAFE`・`VAL_CREATOR_SAFE`・`RIOT_GAMES_CREATOR_SAFE`）、`js/library.js`（`RIOT_GUIDE_KEYS`）、`tools/leagueoflegends-*-tracklist.json`（各リストの `creatorSafe`）、`tools/riot-games-creator-safe-playlist.json`（Riot Games Creator-Safe Playlistの記録）、`tools/valorant-creator-safe.json`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`docs/VALORANT-MUSIC.md` |
| 利用者向けMIDI・権利案内 | `docs/guide/touhou-midi.md`、`docs/guide/sound.md`、`docs/guide/en.md` |
| 🎓 OST手続き生成 | `tools/make-trk-ost.mjs`（出力は `assets/trk-ost/`・Git外。5ルール×2曲＝10曲のWAVスケッチ） |
| Endfield楽曲台帳・曲名fixture・検査 | `docs/ARKNIGHTS-ENDFIELD-MUSIC.md`、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`、`tools/check-repo.mjs` |
| Service Worker | `sw.js`（現行cache名：`trk-v2026.10.14-trk135`） |
| 全体・安全検査 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs` |

## 6. 直近の検証

- **trk133〜135のマージ前確認（2026-10-14）**：書斎の設定ボタン3か所（上部 `studyHeaderSettingsBtn`／本棚 `studyShelfSettingsBtn`／読書見出し `studySettingsBtn`）をヘッドレスChromium 153で実際にクリック／タップし、**83/83項目成功・ページエラー0**。
  - **PC 1200×850**：未選択（上部・本棚）、画像と文章の閲覧中（3入口すべて）、本棚非表示（未選択では上部、閲覧中では上部・読書見出し）、Enter／Spaceでの起動、Esc／閉じるボタン／背景クリックでの終了を確認。
  - **モバイルエミュレーション 360×800／800×360**：実際のブラウザのタップイベントで同じ入口の開閉を確認。全サイズで設定中の背面 inert、閉じた後の起動ボタンへのフォーカス復帰、別の入口から開き直してもチェック状態を共有することを確認。
  - **最終再実行**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` **250/250**）、`git diff --check` 成功。`tools/smoke-browser.mjs --compare` 成功（boot・未解決・decode/click error 0、譜面10件一致、mobile/safe-offline OK）。ブラウザのテストはローカルHTTP＋NSS/NSPRスタブ、生成したテスト用画像・文章と使い捨てe2eはリポジトリ外。**スマホ実機でのタップ・ピンチや端末固有の全画面動作まで確認済みとは扱わない**（§4-9）。

- **trk135（全画面フィット）**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` **250/250**）。`git diff --check` 成功。`tools/smoke-browser.mjs --compare` 成功（boot・未解決・decode/click error 0、譜面10件一致、mobile/safe-offline OK）。`tests/study-settings.test.mjs` に2件追加（先頭・初期オフ・厳密boolean・保存／表示倍率と保存倍率の分離・強制中の倍率変更抑止・終了後の復帰・縦読みの同期）。ヘッドレスChromium 153のe2eで、初期オフ、235%の拡大維持、オンで縦長・横長・小画像がはみ出さず表示、キー・Ctrl+ホイールでもフィット維持、ネイティブ全画面終了で235%へ復帰、CSS代替の見開き、縦横リサイズ（360×800／800×360）、縦読みの各ページフィットとスクロール、再読込で設定保持・保存倍率235%のまま、ページエラー0を確認。**実機のピンチ・回転・全画面切り替えは未確認**。

- **trk134（未選択でも設定・最後で閉じる選択）**：`tests/study-settings.test.mjs` に2件追加（未選択・本棚非表示でも上部から設定／閉じる設定の既定値・型検証・両方向の保存）。`tools/check-study-room.mjs` のVM検査に単ページ・見開きの閉じるオン／オフ、オフでも途中はページ送り・先頭PageUpは閉じる、オンでもrepeatでは閉じないことを追加。
  - `npm run check` 成功（Static 0 failure／0 warning、`node:test` **248/248**）。`git diff --check` 成功。`tools/smoke-browser.mjs --compare` 成功（boot・未解決・decode/click error 0、譜面10件一致、mobile/safe-offline OK）。
  - ヘッドレスChromium 153のe2eで、上部入口（未選択＋本棚非表示）、初期オン、オフ時に最後の下端で停止して全画面維持、オンへ戻して押し直すと本棚へ、押しっぱなし停止、再読込でオフを保持、360×800／800×360の設定表示を確認。ページエラー0。実機での新しいチェックボックスの操作は未確認。

- **trk133（書斎の設定パネル・等倍でも画像の端へ）**：`tools/check-study-room.mjs` のVM検査に100%／50%／見開きでの端移動と着地を追加。`tests/study-settings.test.mjs` に4件（既定値・旧設定移行・型検証・保存／キーの振り分け／設定中の操作遮断・Tab・Esc・フォーカス復帰／項目の単一性とボタン位置）。`npm run check` 成功（Static 0 failure／0 warning、`node:test` **246/246**）。`git diff --check` 成功。
  - **ヘッドレスChromium 153（ローカルHTTP、NSS/NSPRスタブ）**：使い捨てe2eで、本棚入口・設定の位置・等倍の縦長画像で端へ→次ページ上端→前ページ下端・押しっぱなし停止・本の最後で押し直して全画面を終了し本棚へ・設定内のキー割り当てとEscで割り当て待ちだけ解除・設定オンで直接ページ送り・本棚を隠したまま設定・再読込で設定保持・360×800／800×360でパネル内スクロールと閉じるボタンの可視性を確認。ページエラー0。`tools/smoke-browser.mjs --compare` も成功（boot 0・未解決0・譜面10件一致・decode/click error 0・mobile/safe-offline OK）。**実機未確認**（§4-9）。

- **trk132（外部レビュー第4弾への対応。📦パックの切り替えと、MOD付きで遊んだ後の書き出し）**：`npm run check` 成功（**Static 0 failure／0 warning、Security 58 check、a11y 8 check、vendor 100 module、`node:test` 242/242**）。`git diff --check` 成功。内容は①スキンを持つパックAからスキンを持たないパックBへ切り替えたときの復元②Aを使っている間に自分で変えた値の引き継ぎ（`packRebase`）③MOD付きで遊んだ後の書き出し（`chartToData` の `origLane`）④`packSnapshot` のコメント訂正（§7）。
  - 新しい回帰テストは4本（`tests/chart-key-mods.test.mjs` 1本・`tests/pack-unapply.test.mjs` 3本）で **238→242件（+4件）**。
  - **どれも修正前のコードでFAILすることを確認**：`n.origLane ?? n.lane` を `n.lane` に戻すと1件（書き出し）／旧 `deactivatePack`（無条件に `shadow` へ移す形）をVMで動かすと、切り替えの場面で `sakura` を期待したテストが落ちる（旧関数の結果は `shadow` のまま・`applied.skin` が残る＝レビューの指摘どおり）／`packRebase` を呼ばない形では切り替えの2件が落ちる。
  - `tools/check-security.mjs` の配線検査（`packPrev` の形）を `if (!restore) { packSnapshot(); packRebase(); }` に追随（58 check のまま）。
  - `tools/check-repo.mjs`：trk132のブロック（`packRebase` が「利用者が自分で変えた項目だけ」を `prev` へ取り込んで `applied` から外すこと・切り替えの前に呼ぶ配線・パックのスキンを消すときは退避したスキンへ戻して `applied.skin` を外すこと・`chartToData` と `chartKeyOf` が同じ `origLane` を読むこと・`meta name="description"`（検索結果）と `og:description`（SNSカード）が同じ文面であること）を追加し、**わざと壊す4通りでFAIL**。
  - **実ブラウザ（Chromium 153 headless）でも確認済み**（このコンテナで NSS/NSPR のスタブを作って実行。手順は下の「ブラウザ」の行）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK、`tools/smoke-game-end.mjs` は MANUAL・AUTO とも PASS。使い捨てe2e（リポジトリ外・17項目・**17/17 PASS**）で、①MIRROR／RANDOM の後に `chartToData` が元のレーンを書き出す（`fx.js` の包みを通した実経路）②利用者が sakura を選んでいる状態でスキン付きパックA→スキン無しパックBへ切り替えると **sakura へ移り**、Bを外しても sakura のまま・触っていないエフェクトの強さは 1.5 へ戻る・`packPrev` は使い切って消える（旧版 `custom.js` で走らせると ②-4〜②-7 がFAIL＝レビューの指摘どおり `shadow` へ飛ぶ）③Aを使っている間に自分で選んだ daylight が「戻る先」になる（旧版は `shadow` のまま＝FAIL）——を確認。①も旧版 `media.js` ではFAILすることを確認。**実機（PC・Android）での確認は未実施**（§4-12の⑧⑨）。
  - main へは **PR #59** で反映（2026-10-13）。
- **trk129〜131（外部レビュー第1〜3弾への対応。中心は安全・堅牢化）**：`npm run check` 成功（**Static 0 failure／0 warning、Security 58 check、a11y 8 check、vendor 100 module、`node:test` 238/238**）。`git diff --check` 成功。**他者のファイルでタブが固まる問題の除去**（trk129＝F-33：共有譜面JSONの `bpm` を 0 か 1〜1000 に限定し、描画ループ3か所でも確認。trk130＝F-34：📥共有プレイリストを**読む前に**4MiB上限）が中心で、ほかに ↕の並べ替え・共有プレイリストの曲名照合・📦パックを外したときの復元を行いました（内容は §7）。trk131は文面（`og:description`）の差し替えだけで、検査結果は同じ。main へは PR #58 で反映。
  - 新しい回帰テストは5本：trk129が `tests/chart-import-bpm.test.mjs`・`tests/chart-key-mods.test.mjs`、trk130が `tests/trk-move-order.test.mjs`（5件）・`tests/playlist-import.test.mjs`（4件）・`tests/pack-unapply.test.mjs`（7件）で、**222→238件（+16件）**。
  - **どれも修正前のコードでFAILすることを確認**：media.js／render.js を戻すと2件（bpm）／`n.origLane ?? n.lane` を `n.lane` に戻すと2件／↕の旧版に戻すと3件／取り込みの上限判定を消すと1件／ゆるい照合を「最初の候補」にすると1件／`packRestoreSettings()` の呼び出しを消すと1件。
  - `tools/check-repo.mjs`：trk129のブロック（`PL_FOLDER_MAX`＝40と `core.js` の `slice(0, 40)` の一致、`plFolderRoom` の境界＝40個で不可／39個で可、`plFolderTrim` が固定棚を残すこと、作成の3か所の上限チェック、`plFolderLimit` の4言語、🎭棚の戻し＝こわれた形だけ・一度きり・利用者の配置を守る・`trkEndfieldTidy1` 前は触らない。Endfieldの改名検査＝旧名4種から改名・利用者が付けた名前は触らない・fixtureの名前が24文字以内）を追加し、**わざと壊す4通りでFAIL**。trk130のブロック（↕の中身と挟み込み・呼び出し6か所・ボタンの端/ABC・📥の上限→読み込みの順・4言語・表記ゆれの一意照合）を追加し、**わざと壊す5通りでFAIL**。
  - `tools/check-security.mjs`：F-33（`bpm` の範囲と3か所のループ）・F-34（プレイリストの上限→読み込みの順と4言語）・`packPrev` の形を追加（**わざと壊す3通りでFAIL**。58 check）。`docs/SECURITY.md` に F-33・F-34 の行と「各形式にそろっている」行を追加。
  - **実機・実ブラウザでの確認は未実施**（§4-12）。
- **trk128（Endfield整頓）**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`git diff --check` 成功。`tools/check-repo.mjs` の🛰️ブロックに、シリーズ全13リストの並び検査（`seriesPlaylistOrder`）、旧名の改名検査（Vol.1＝最古名＋24文字切り名＋trk110フル名／Vol.2＝trk110フル名＋24文字切り名）、一回限りの整頓の3系統（配列の並べ替え・キャラクター棚への移動と利用者の配置保持・`trkEndfieldTidy1` の印）検査、MSRブロックにキャラクター棚の自動作成検査（tidyをスキップして作成パス単体で検査）、ネストフォルダタブ追加の静的検査を追加。**わざと壊す5通り（ef-eve／ef-thunderの順序交換・キャラクター棚の作成分岐削除・印の付与削除・24文字切り名の照合削除・ネストフォルダタブ削除）でFAILを確認済み**。**実ブラウザe2e（Chromium headless・20項目）で全項目PASS**：新規取り込み（13リストの新順作成・キャラクター棚・改名・印・Endfieldタブのチップ行＝🎭棚→初号指令(上)(下)→リリース順6作→signal）、既存取り込みの移行（24文字切り旧名からの改名・並び直し・既定場所のキャラクターリストだけ棚へ・利用者の配置・所持曲・手動リストの保持・2度目の起動で並びが変わらない）、ページエラー0。このe2eで**24文字切り名への改名不発**と**サブフォルダビューが「すべて」へフォールバックする既存欠陥**を発見し修正（§2・§7）。実端末での確認は未実施（§4-5と台帳のtrk128未確認事項）。
- trk119〜127の検証記録（ページ送り・マウス・書斎ボタン・長押しの強化・⏯の説明文・押しっぱなしの停止）は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) に移しました。
- `npm run check`：成功。Static 0 failure／0 warning、`node:test` **238/238**（リポジトリ、Security、a11y、vendor、MMD、Study Room、lite-mode検査を含む）。`git diff --check`：成功。
- **Creator-Safe（`check-repo.mjs`）**：LoL 22リストの状態・曲数・見当たらない曲・根拠の一致、VALORANT（記録した40曲から状態を計算し直す）、trk118の12リスト・539曲（全曲が記録したトラックIDの曲名・アーティストと一致、各100曲以下・重複なし）と記録した927行の網羅を検査。各ブロックとも、わざと壊すとFAILすること（改変検知）を確認済み（trk115：7通り、trk116：8通り、trk117：5通り、trk118：4通り）。自動作成のtrkリストは65（上限100）。照合作業そのもの（songdata.io の51〜977行目の転記と突き合わせ）はリポジトリ外で行い、結果をfixtureと台帳に記録した。トラックIDは、VALORANTの36件が別の一覧と1件ずつ一致し、3件を公式のSpotify埋め込み表示で開いて確認。
- **ブラウザ**（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium 153 headless。trk132で**このコンテナでも動く手順を確立**：この開発コンテナにはNSPR／NSSが無いので、`objdump -T /tmp/chromium` の未定義シンボルから**スタブのCソースとバージョン定義**（`NSS_3.2`〜`NSS_3.30`・`NSSUTIL_3.12.3`・`Base`。記号の一覧は各名の後ろに `;` が要る）を作り、`gcc -shared -fPIC … -Wl,--version-script=… ` で `libnspr4.so`／`libnss3.so`／`libnssutil3.so` を作って `LD_LIBRARY_PATH` で通します（空のライブラリだけでは `symbol lookup error` で起動しない）。実行は `LD_LIBRARY_PATH=/tmp/nss-shim SMOKE_CHROME=/tmp/chromium SMOKE_PUPPETEER=<puppeteer-coreの絶対パス> node tools/smoke-…`）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。`tools/smoke-game-end.mjs` PASS（trk114）。使い捨てのe2e（最新41項目）で、LoLリストの入手先ガイドの鍵と ja/en/zh/ko の表示、廃止した鍵（`plGuideLolCsLikely`・`plGuideLolSessions`）の保存データが起動時に置き換わること、LoLの新しい4リストの自動作成、🛒公式カタログからの VALORANT・LoL関連ゲームのリストの取り込みとガイド、ページエラー0を確認。trk114では削除の印・♻復元・OSTの移動・3スキンのaxe・MIDIの文言も確認（23項目）。各回の詳細は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) の「trk114〜118 の検証記録」。
- trk114のMIDI計測（開発コンテナのNode、`studio_gm`）：4和音・3分（2,880音）は7.9秒→3.3秒、合成した密な3分の曲（平均約37音）は36.3秒→21.3秒。4和音・9分半は8,650万（旧上限8,000万で拒否→可）、密な4分は1.96億（可）、密な5分は2.46億（不可）。実際の東方MIDIでは未計測（§4-1）。
- 🎼 手続き生成（`tools/make-trk-ost.mjs`）：10曲すべて生成でき、WAVの peak 0.62〜0.72・RMS 0.08〜0.29（無音でもクリップでもない）。打楽器ノイズとMLPサンプリングをシード済みPRNG化したため **2回生成して全ファイルのmd5一致**を確認（決定的ビルド）。**実際に聴いての良否は未確認**（§4-6）。
- 自動検査でローカル参照・構文・Stageの幾何・選曲画面のoverflowを確認。新しいMIDIの音質、通常ブラウザ上での聞こえ方、実機操作はまだ確認していません。
- **利用者の実機確認（2026-10-12、trk125・trk126）**：曲リスト右の 📚 書斎 ボタン（常時表示）と、曲名バナーの右下の ⏯ 再生／一時停止（音量ボタンの左）が実機で動作（空さん）。一時停止＝プレビューが止まり、曲名に触れると鳴り直すこと、書斎ボタンで書斎に入れることを確認。配置も了承。Endfieldの配信リンク（Spotify・ffm.to・网易云音乐）の実ブラウザ表示も未確認です（§4-5）。バッチ2の曲順・曲名・アーティストは 2026-10-11 に公式Spotifyのアルバム埋め込みページで6作すべてを再確認し、Homecoming は公式ffm.toスマートリンクでも照合しましたが、個別曲IDの全数確認と実ブラウザ確認は未実施です。

## 7. 最近の変更

- **trk137（2026-10-14）**：**まるごとバックアップ／復元**（設定の「💾 端末の保存」の下）。対象は設定・記録・プレイリスト・書斎（本・画像・栞・メモ）・カスタムパック。曲・VRM・MMDなどのメディアは既定で除外し、チェックで含められる（曲は参照のまま ZIP へ書き、読み取り専用）。形式は ZIP（`js/zip-io.js`：ZIP64・deflate・CRC・展開上限）。復元は確認ダイアログのあとに、既知のキーと型だけを書き戻す（`js/backup.js`）。**「容量の上限を無視」**（設定・既定オフ・保存は `settings.ignoreStorageLimits`）：アプリ側の上限（書斎の本棚500・1冊3000ページ・テキスト12MB、パックの合計と1件）を外す。ブラウザ側の割り当て（IndexedDB・保存の固定）は回避できないため、画面に明記。凍結防止のガードは残す。書斎の上限は `window.Trk.studyLimits`（読み取り専用）へ公開し、復元とパックで同じ判定を使う。検査：`tests/zip-io.test.mjs`（6）・`tests/backup-codec.test.mjs`（6）・`tests/storage-limits.test.mjs`（4）。実ブラウザ（Chromium headless）で、書き出し→外部 Python `zipfile` の検査（13エントリ・testzip OK）→全消去→復元（localStorage・本・Blob画像・曲・ライブラリ・パック）が戻ること、上限オフの3001ページは拒否（書き込みなし）・上限オンで復元、不正ファイルは拒否されることを確認（ページエラー0）。UI（作成ボタン・上限の切り替えの保存・ファイル選択→確認ダイアログ）も確認。**未確認**：実機（Android Chrome・Safari）での大きい書き出し、書斎の読み込み（UI経路）の上限の実機確認、復元時に途中で容量が尽きた場合の表示。**既知の注意**：localStorageの値は許可リストのキーだけを文字列のまま書き戻す。中身の型・範囲は Import の検証関数を通さず、各機能の読み込み側に任せている（Import と同じ検証へ寄せるかは次の候補として未決定）。
- **trk136（2026-10-14）**：①外部レビュー（trk135）の**PageDown長押し**の指摘を反映。収まる画像（全画面フィット中を含む）では押しっぱなしでもページ送りへ戻し、止めるのは「端からの送りの着地待ち（`studyZoomLand`）」と「台紙の高さが0（描画中）」だけに。`check-study-room` に回帰2件（配線を含め `npm run check` 250 pass）。②**💾 端末の保存**（設定の新しい欄）：`navigator.storage.persist()` で保存の固定を求め、状態（固定済み／固定されていない／このブラウザでは確認できない）を表示。書斎の取り込み開始時・パックの取り込み成功時に静かに要求し、`?safe=1` では要求しない（表示のみ）。`tests/storage-persist.test.mjs` 7件。4言語・日英ガイド（`environment.md`）・`sw.js` cache名（trk136）を更新。③レビューの「製品の顔」のうち `meta description` と `og:description` は trk132・131 で既に同じ文面。残る `manifest.webmanifest` と README の音ゲー主語は trk131 の利用者判断どおり据え置き。
- **実ブラウザ（trk136）**：Chromium 153 headless（`@sparticuz/chromium` を `/tmp` へ取得し、NSS／NSPR のスタブ共有ライブラリで起動）。`tools/smoke-browser.mjs --compare` は OK（boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK）。設定の「💾 端末の保存」欄の表示と押下後の再描画を確認（ページエラー0）。
> trk130〜132は外部コードレビューへの対応で、中心は**安全・堅牢化**（他者のファイル1つでタブが固まる問題の除去＝F-33・F-34）と、↕の並べ替え・📦パックの後始末です。trk129以前の詳細は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) に移しました（新しい変更はここに短く記録し、増えたらアーカイブへ移します）。

- **trk135（2026-10-14）**：設定の先頭に「全画面時に強制的に画面にフィットにする」（初期オフ）を追加。表示だけをフィットにし、保存倍率は上書きしません。4言語・日英ガイド・回帰テスト・SW cacheを更新。
- **trk134（2026-10-14）**：書斎上部に常時使える設定入口を追加。本の未選択・本棚非表示でも設定できるようにし、「最後のページ時PageDownで本を閉じる」（初期オン）を追加。オフなら最後の画像の下端で止まり、全画面も維持します。4言語・日英ガイド・保存と端動作の回帰テスト・SW cacheを更新。前回の操作感と最後で閉じる動作は利用者から好評（端末・ブラウザの詳細は未確認）。
- **trk133（2026-10-14）**：書斎の上級者向け項目を「⚙ 設定」パネルへ移設し、読書見出し（全画面ボタンの左）と本棚から開けるようにしました。PageDown／PageUpの端移動を倍率によらず標準にし、直接ページ送りにする設定を追加（旧選択は引き継ぐ）。4言語・日英ガイド・VM回帰テスト・`sw.js` cache名を更新。仕様は§2、確認は§6。
- **trk132（2026-10-13）**：外部レビュー第4弾（📦パックの切り替え・MOD付きの書き出し）への対応。①**スキンを持つパックAから、スキンを持たないパックBへ切り替えると、外しても元に戻らない**（中）：切り替えでは `deactivatePack(false)` がAのスキンを消して `shadow` へ移すため、`applied.skin` はAのまま・今のスキンは `shadow` で一致せず、Bを外したときに戻りませんでした。切り替えの途中でパックのスキンを消すときは、退避した `packPrev.skin`（無ければ `shadow`）へ戻し、`applied.skin` を外します（`js/custom.js` の `deactivatePack`）。②**Aを使っている間に自分で変えた値が、Bを外したときに「Aより前の値」で上書きされる**（中）：「最初の退避を上書きしない」方針と「自分で変えた項目は戻さない」方針がぶつかっていました（例：Aを当てる→スキンを forest に選び直す→スキン付きのBへ切り替える→Bを外すと forest ではなくA以前のスキンに戻る）。`packRebase()` を追加し、切り替えの直前に「`applied` と今の値が違う項目（＝利用者が変えた項目）」だけ現在の値を `prev` へ取り込み、`applied` から外します（触っていない項目はそのまま）。③**MIRROR／RANDOMで遊んだ後に書き出すと、MOD後の譜面が出る**（低〜中）：`chartToData` が `n.lane` をそのまま書いていたため（`resetRun` が書き換えた後）、一時停止画面・結果画面からの書き出しと曲パック（`custom.js` の `buildSongPack`）にMOD後の譜面が入っていました。`n.origLane ?? n.lane` に直します（`chartKeyOf` と同じ考え方）。④`packSnapshot` のコメントが実装していない動き（古い版のパックは manifest から分かる範囲を控える）を書いていたので、実際の動き（退避が無いときは外すとスキンだけ既定へ、起動時の復元 `restore:true` では退避を作らない）に直しました。⑤**検索結果に出る説明文**（`index.html` の `meta name="description"`）を、trk131で決めた `og:description` と同じ日本語の文面（「万能なブラウザ再生プレイヤー。完全無料。…」）に揃えました（別々に育つと方向がずれるので、`check-repo` が2つの一致を見張ります）。古いMIRRORの記録は、RANDOMの分が救えず数も少ないため**救わない**（利用者の判断）。`sw.js` cache名（`trk-v2026.10.13-trk132`）を更新。**実ブラウザ（Chromium 153 headless）で ①②③ を確認済み**（スモーク2本と使い捨てe2e 17/17 PASS。旧版では①②の5項目がFAIL）。**実機での確認は未実施**（§4-12の⑧⑨）。
- **trk131（2026-10-13）**：利用者の判断3件の反映。①**SNSカードの説明文**（`index.html` の `og:description`）を利用者の最終文面「万能なブラウザ再生プレイヤー。完全無料。手持ちの音楽、画像、漫画、小説、そして音ゲーを楽しめます。データは、端末の中だけ。」へ差し替え（trk129で重複を直した同じ欄。利用者の文面の「ブザウザ」はブラウザの誤記として直し、meta の content なので1行のまま。5モードの説明は `manifest.webmanifest` の説明文とREADMEに残る。やや気の大きい表現だが、画像・漫画・小説は 📚 書斎、音ゲーは5モード、端末内保存は通信なしの保存方式が受け持ち、今後も整備して実態に追いつかせる方針＝利用者了承）。②カード画像 `docs/og.png` に焼く短い一文（`tools/make-icons.html`）を「万能なブラウザ再生プレイヤー。完全無料。」へ更新。**og.png の作り直しは未実施**（生成にブラウザが必要。焼いた文字は旧文のまま残っている）。③trk130の実装（📦パックを外したときの復元＝`settings.packPrev`）と trk129 の方針（記録・ゴーストのキー＝`n.origLane ?? n.lane`）は利用者の確認済みとして §2 に印を付けた。`sw.js` cache名（`trk-v2026.10.13-trk131`）を更新。
- **trk130（2026-10-12）**：外部レビュー第2・3弾への対応。①**↕が「見えている並び」で動くようにした**（中）：`playlistOrder` は全体で1本なのに、旧`trkMovePlaylist(id, dir)` は**全体の隣**と入れ替えていたため、🐔の階層メニューのようにフォルダごとのグループで並ぶ画面では**押しても画面が変わらず**（別フォルダのVolと入れ替わるだけ）、削除済みIDが `playlistOrder` に残っていると**1回ぶん飲まれる**ことがありました（VMで再現：`A1,A2`／`B1,B2` で `A1↓` は両グループとも不変、`GHOST` 入りの並びでは無反応）。`trkMovePlaylist(id, dir, peers)` とし、**その画面の隣（peers＝表示順）の中だけで入れ替え**、消えたIDはここで落とします。端と🔤ABC順のときは `trkMoveButtonsState` が↑↓を押せなくし（薄く）、3つの一覧（🐔の階層メニュー・フォルダ設定・🐔の設定画面）すべてが `peers` を渡します（フォルダ設定は並べ替えたあと開き直して新しい並びを見せます）。②**📥共有プレイリストの取り込みに読み込み前の4MiB上限**（中、F-34）：曲数1000などの上限は**解析の後**にしか効かないため、他人の巨大なファイル1つでタブが固まりました。`PLAYLIST_IMPORT_MAX`（4MiB。2MiBでは最悪に近い日本語1000曲≈2.7MBが入らない）を `f.text()` の前に判定し、超えていれば4言語の `plImportTooBig` で案内します。③**曲名のゆるい照合を一意なときだけに**（低〜中）：`plTitleKeys` は先頭のトラック番号も外すので、そのまま採ると「01 intro」と「03 intro」を同じ曲として✅にしていました。区切り・拡張子・番号の表記ゆれは今までどおり拾いますが、**候補が1曲に絞れて、共有側に大きさがあるときは大きさも合う**ときだけ採ります（キー索引は曲リストごとに1回だけ作る `plMatchIndex`＝WeakMap）。④**📦パックを外したら、パックが変えた設定を戻す**（低〜中）：これまではスキンだけが既定へ戻り、ノーツ・エフェクトの強さ・SEのオンはパックのまま残っていました。「設定に保存される」退避 `settings.packPrev`（prev＝当てる前の値、applied＝パックが当てた値）を持ち、**外したときに、利用者がその間に変えていない項目だけ**戻します（パックを当てたまま再起動しても戻せます。A→Bの切り替えでは最初の退避を保ちます。古い版で入れたパックは applied だけ控えます）。⑤**パック切り替え時のSEの競合を修正**（低）：`deactivatePack` は読み直し、新しいパックは読み込み後に上書きするため、**音を持つパックから音を持たないパックへ素早く切り替えると順序次第で自分のSEが消えたまま**になりました。切り替え中（`persist=false`）は読み直さず、**新しいパックに音が無いときだけ**戻します。⑥その他：`docs/SECURITY.md` に F-34 の行と「各形式にそろっている」行へ共有プレイリストを追記、`docs/guide/packs.md`・`docs/guide/security.md`・`docs/guide/en.md` を追随。**外部レビューが「対応不要」とした項目は採らないまま変更なし**：パックのCRC/版の検査（ZIPのCRCはライブラリが検証）、ZIPの生のエントリ名は `safePath` 経由のみ、`1e999` は表示だけ「∞」、コピーがタグを落とすのは仕様、絵文字の4単位分割はアプリ全体の挙動、フォルダのタブの残りは許容、パックのSEを書き出さないのは再配布の権利リスク回避。`buildPack` の大きさ検査は、`vrm.js` が読み込み時に `MAX_VRM`（200MB）／`MAX_VRMA`（30MB）で同じ `>` の形で弾いており**到達しない**ことを確認（変更なし）。`sw.js` cache名（`trk-v2026.10.12-trk130`）を更新。**実機・実ブラウザでの確認は未実施**（§4-13）。
- **trk125〜128**：trk128（Endfield整頓＝初号指令最上・リリース順・🎭棚・24文字に収まる改名）／trk127（書斎の押しっぱなし停止・⏯の説明文）／trk126（バナーの⏯＝プレビューの一時停止／再開）／trk125（📚書斎ボタンの常時表示・長押しの強化）。記録は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) の各記録へ移動（trk128・trk127・trk126・trk125）。
- **trk123以前**：trk123（拡大中の端で閉じる動作＝全画面を終了して本棚へ）・trk122（端でさらに押すと次の／前のページを続きの端から開く）・trk121（拡大中の PageDown / PageUp。中クリック＝次のページの設定は trk124 で選択式へ）・trk120（拡大の送り幅を％で選ぶ）・trk119（拡大した画像を ↑ / ↓ で送る）・trk118（Creator-Safeの12リスト・539曲）・trk117（VALORANTのCreator-Safe照合・`RIOT_GUIDE_KEYS`へ改名）・trk116（LoLの残りリストのCreator-Safe照合・`notFound`・links-partial／links-absent）・trk115（LoL Creator-Safe照合を101曲目以降へ）・trk114（再レビュー対応：LoL Creator-Safe表示の訂正・MIDI処理量・削除の印ほか）・trk113（trk's OST用の手続き作曲スクリプト）・trk112（タブ挙動・デモ曲のOST移設）・trk111は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)。Endfield初号指令OST、Touhouローカル曲名カタログと24種のコード生成MIDI音色・TRK MIDI MIX（trk109）、LoLカタログ、音源ジャケット、TV、譜面生成、名前空間等の作業履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) と各設計資料を参照。

## 8. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、既定値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・データ・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff と `sw.js` cache名を確認した。
- [ ] 日本語ガイドを変更した場合、英語ガイドの対応箇所も更新した。
