# trk! 開発引き継ぎ

> **最終更新：2026-10-12（trk126）**。現在の仕様・守る条件・未確認事項の要約です。細かな過去の作業履歴（trk123以前）と trk114〜118 の検証の詳細は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、品質・安全確認は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) と [`SECURITY.md`](SECURITY.md) を参照してください。
>
> **本書の読み方**：§2＝今の仕様、§3＝壊してはいけない条件、§4＝実機で確認していないこと（ここが最重要）、§5＝ファイルの場所、§6＝自動検査で確かめたこと、§7＝直近3回の変更、§8＝変更時の点検。

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

- **Endfieldカタログ**（trk110〜trk111）は初号指令OSTと公式アルバム6作の2系統です。いずれも公式Spotify収録順・各曲は公式Spotify個別曲ページへリンクし、取り込み時に自動でプレイリスト化します。音源は同梱しません。
  - 初号指令OST「Zeroth Directive」：Vol.1 37曲＋Vol.2 23曲。各巻は公式告知のffm.to配信一覧へリンクし、中国語公式曲名を照合別名に登録済み。旧「初号指令 OST」4パート紹介版は永続ID `ef-firstorder` を保ったままVol.1全曲版へ安全更新されます（所持曲・ユーザー変更は維持）。キャラクターOST等5プレイリストの内容は不変。
  - Metal Scar Radio 公式アルバム6作・計81曲（trk111）：Eve of Departure 5曲（2026-04-11）・Thunder's Legacy 9曲（2026-04-22）・At the Wake of Spring OST 17曲（2026-04-30）・Contingency Contract Re-Ignition OST 4曲（2026-06-20）・Homecoming OST 30曲（2026-07-31）・Dreamscape of Wind and Snow OST 16曲（2026-09-10）。各アルバムは公式Spotifyアルバムページへリンクし、`trk-ef-*` プレイリストとして自動作成。
  - 権利表記：©/℗ GRYPHLINE（Hypergryph）、レーベルは Metal Scar Radio（鐵痕電台）。配信・購入は二次利用許諾ではなく、公式二次創作ガイドラインは公式素材のそのままの複製・抽出を禁止します。
  - 未確認（断定しない）：6作の中国語公式曲名・公式告知のffm.to配信一覧（Homecoming を除く）・VGMdb照合・他ストアの曲別URL。照合別名は付けていません。「配信なし」とも書きません。
  - 台帳とfixture：[`ARKNIGHTS-ENDFIELD-MUSIC.md`](ARKNIGHTS-ENDFIELD-MUSIC.md)、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`。

### 維持中の既存機能

- **🎓 trk's OST Vol.1（オリジナル曲の置き場）**：🐔 trk's playlist の中、Game Vol.1 の直下にあります（`TRK_OST_ID = "trk-ost-v1"`）。今はチュートリアルのデモ曲1曲のみ。trk113の手続き生成スケッチ（下記）はまだアプリ未組込で、将来ここへ増やしていく想定です。trk112が最上位に作ったものだけを一度trkフォルダへ移し（印は `cat: "trk:ost"`）、以後は利用者が動かした場所を守ります。
- **消した自動リストは作り直さない（trk114）**：trk!が自動で作るリスト（IDが `trk-` で始まる Game Vol.1・Classic Vol.1・trk's OST Vol.1・カタログの各リスト）を消すと、`settings.trkRemoved` に印が残り、次の起動で作り直しません。設定「🐔 trk's playlist」の **♻ 消したtrkのリストを戻す（n件）**で印を外して作り直します（Game Vol.1／Classic Vol.1の「開く」ボタンもその1件の印を外す）。印は `trk-` で始まるIDだけ・200件までに検証し、全リセットで空に戻ります。
- **入手先ガイドは表示言語で出す（trk114）**：公式カタログ由来のガイドは辞書キー（`plGuide…`）と日本語の控えを保存し、表示時に今の言語で引きます（LoL・Endfield・ブルアカ・学マス・Game／Classic Vol.1など21キー×4言語）。既存の保存データは起動時に自動で鍵が付きます。カタログ本体の各シリーズ説明文（`js/catalog.js` の `note`）はまだ日本語だけです。
- **小さなアクセント文字の色（trk114）**：`--ui-accent-ink`（`js/data.js` の `accentInk`、`applySkin` が毎回設定）。設定画面の入れ子の欄（カード＋パネル＋小欄の重なり）でも4.5:1になるまで、アクセントを本文の色へ5%ずつ寄せます。足りているスキンは元の色のまま。44スキン中16スキンで色が少し変わりました（スキンの棚の見出し、リンク、記録表の選択行など13ルール＋fx.jsのリンク1箇所）。
- **曲名バナーの操作（trk73・trk126）**：バナーの**右端に [◀][🎲][▶]**（前後の曲・おまかせ。🎲 は既定で長押し650ms、設定で「タップだけ」「非表示」を選べる）、**右下に [⏯][🔊]**（同じ大きさのアイコンだけのボタンを並べた `.bannerMediaBar`）。🔊 は短押しでスライダー・長押しでミュート／復元。**⏯ は選曲中にプレビューの音を止める／鳴らす**（止めたところから鳴り直す）、曲の再生中・一時停止中はゲームの一時停止／再開（プレイ中は選曲画面ごと隠れるので、ふだん見えるのは選曲中）。**曲名に触れて曲を選び直すと一時停止は解除されて鳴り直す**（止まったままにならない）。止める音がないとき（曲未選択・プレビューオフ）は押せない状態。設定「右上の曲名をタップで一時停止／再生」（初期オフ）はバナー全体のタップとして別に残ります。
- **タブの挙動（trk112）**：チュートリアルのデモ曲は独立タブ（🎓デモ曲）をやめ、上記 trk's OST Vol.1 にまとめました。開いたタブは libOpenTabs で残り、削除はタブの ⚙（長押し）設定から（曲はライブラリに残る）。**フォルダ内のプレイリストを開いたタブは閉じるまで残る**のが既定になり、フォルダ内タブの中クリックは「タブを閉じる」（本体は残す）に変更しました。
- **🎼 手続き作曲ツール（trk113）**：`node tools/make-trk-ost.mjs` で10曲のWAVスケッチを生成（5ルール×2曲＝コード進行／確率・統計／進化的アルゴリズム／深層学習／自由作曲）。出力は `assets/trk-ost/`（.gitignore でGit外・同梱するのは生成スクリプトのみ）で、試聴は同ディレクトリの `index.html`。外部ライブラリなし・決定的（毎回同じ音）です。**アプリ本体には組込んでいません。**
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
5. **Endfield配信リンク**：Zeroth Directive OST 60曲＋バッチ2の6作81曲のSpotify個別曲ページ、各巻のffm.toスマートリンクと网易云音乐アルバムの表示・地域差を実ブラウザで再確認する。バッチ2は個別曲IDの抜取確認が6曲のみで、残り75曲のIDは未個別確認。バッチ2の中国語公式曲名・ffm.to告知リンク（Homecoming 以外）・VGMdb照合・他ストアの曲別URLは未確認のまま。Zeroth Vol.1 は 2026-10-11 に Apple Music 掲載を確認済み（Vol.2 のアルバム別URLは未照合）。未収録の公式リリース（Yi／Old Deep Water Dies／Sketches of Lost Heirlooms／A Promise Makes a Home 等）は台帳の「調査中の他の公式リリース」表に確認状況を記録済み。曲別調査はエンドフィールド台帳を更新する。
6. **🎼 手続き生成10曲の聴取確認**（trk113）：自動検査は「無音でもクリップでもない」こと（peak 0.62〜0.72・RMS 0.08〜0.29）と決定的生成しか確認していません。曲として聴けるか・不快なノイズや耳障りな音がないか・音量バランスは、`assets/trk-ost/index.html` で実際に聴いて確認する。採用曲を決めたら、trk's OST Vol.1 への組込み方（音源の権利表記・同梱可否）を別途決める。
7. Android Chrome／PCでService Workerのsafe・オフライン、MMD／VRM、IndexedDBを確認する。Node・shim検査は実機確認の代用ではありません。
8. **trk114の画面確認**：①自動リスト（例：LoLのSeason 3）を消して再起動しても戻らないこと、♻ボタンの件数表示と復元、trk's OST Vol.1を別フォルダへ動かして再起動しても戻らないこと。②英・中・韓のUIで入手先ガイド（タブの長押し）が各言語で出ること。③色が変わった16スキン（shadow・daylight・sakura・snowfield・garden・strawberry・melonberry・dawn・midnightsun・pastelloop・wagara・showacafe・cbLight・shojiLight・morningKitchen・mikuClassic）で、スキンの棚の見出しやリンクの色が見やすく、スキンの雰囲気を壊していないこと。ヘッドレスChromiumでは①②とcbLight・shojiLight・morningKitchenのaxe（4.61〜4.62:1）を確認済み。
9. **書斎の拡大画像のキー送り（trk119）**：拡大した画像を `↑`／`↓` で送る動きは、ヘッドレスChromium（PCの画面比・全画面モード）で確認済み。PC・Androidの実機で、トラックパッドやノートPCのキーボード、日本語配列、`←`／`→`のページ送りと混ぜて使ったときの体感、および長い本（縦読み）での手ざわりは未確認。実際に読みながら「1回押しの送り幅（画面の84%）」が多すぎ／少なすぎないかも見てほしい。拡大の送り幅の設定（trk120、初期値5%・1／2／5／10／25%）も、実機で「気持ちよく拡大縮小できるか」を試してほしい（ホイール・＋／−ボタン・ピンチで同じ幅を使う）。trk121〜123の `PageDown`／`PageUp`（初期オン。拡大中は下端／上端へ、端でさらに押すと次の／前のページを続きの端から開き、**本の端では閉じる動作**＝画像の全画面を終了して本棚へ）と、trk124の**PCのマウス操作**（**左右クリックでページ送り**＝左＝次へ・右＝前へ、**左右の反転**つき。**中クリック**は「何もしない／次のページへ／閉じて本棚へ（全画面を終了）」の3択。初期値はオフ／何もしない）は、PCの実機で試してほしい。マウスは**右クリックでブラウザのメニューが出ないこと**（画像の上では前から出ません）、中ボタンの押し心地、ブラウザの自動スクロールが出ないこと、トラックパッドの中クリック、トラックボールや左利きでの左右の反転、指のタップ（これまでどおり左右の半分で送る）と混ぜて使ったときの手ざわりを確かめてほしい。実際に読みながら「端でさらに押すと次の／前のページへ」「本の端で閉じる」が好みか、読んでいる途中で意図せず閉じてしまわないか（押しすぎ）も見てほしい。中クリックの設定はtrk124で選択式に変わったので、trk121から中クリック＝次のページを使っていた人は選び直しが必要かどうかも。
10. **Riot系カタログの画面確認**（trk116〜118）：🛒公式カタログに「🛡️ Riot Games — LoL関連ゲーム」と「VALORANT Creator-Safe」が出て取り込めること、LoLフォルダに4リスト（Pentakill など）が増えたこと、各リストの入手先ガイド（全曲／一部／見当たらない）が4言語で出ることを実機で確認する。新しい539曲のSpotifyリンクは、トラックIDの抜き取り確認が3件（VALORANTの36件は別の一覧と照合）なので、数件開いて確かめると確実。ヘッドレスChromiumでは取り込みとガイド表示を確認済み。
11. **入口まわりは実機で確認済み（trk125・trk126）**：曲リスト右の **📚 書斎** ボタン（常時表示）と、曲名バナーの右下の **⏯ 再生／一時停止**（音量ボタンの左）は、**2026-10-12に実機で動作確認済み**（空さん。選曲中のプレビュー停止／再開と、曲名に触れて選び直したときの鳴り直しを含む）。配置も「いい配置」とのこと。「長押しで書斎に行かない」という報告は、ヘッドレスChromiumの自動化では再現せず（タイトル・再生中・一時停止中・開いて閉じた後・ライトモードのオン／オフ・マウス／タッチのいずれでも開く）、その後の実機でも問題なく開いている。**もし再発したら**、端末とブラウザ、押し方（指かマウスか）を教えてほしい。アイコンだけの小さなボタンなので、押しやすさ（大きさ・位置）は引き続き見てほしい。

## 5. 主なファイル

| 内容 | ファイル |
|---|---|
| Touhou固定タイトルデータ・曲カタログ | `js/touhou-theme-data.js`、`js/catalog.js` |
| 曲名照合・表示名 | `js/title-match.js`、`js/library.js`、`tests/title-match.test.mjs` |
| MIDI音色プロフィール・レンダラー・UI | `js/midi-profiles.js`、`js/midi-player.js`、`js/midi-settings.js`、`js/media.js` |
| 通常音声MIX DSP・左下パネル | `js/fx.js`、`js/fx-dock.js`、`css/style.css` |
| 設定・Import検証 | `js/core.js`、`tools/check-security.mjs` |
| MIDI/MIXとカタログの検査 | `tests/midi-player.test.mjs`、`tests/media-midi-integration.test.mjs`、`tests/midi-mix.test.mjs`、`tests/touhou-catalog.test.mjs` |
| MIDIの処理量の測定（手元のファイル用） | `tools/midi-budget.mjs`（`estimateRender` を使う。読むだけ） |
| 自動リストの削除の印・ガイドの言語 | `js/library.js`（`trkRemoved`・`trkRestoreRemoved`・`trkCatalogGuide`・`plGuideText`）、`js/core.js`（`cleanTrkRemoved`）、`tests/trk-playlists.test.mjs` |
| Riot系カタログ（LoL・VALORANT・LoL関連ゲーム）のCreator-Safe照合状態 | `js/catalog.js`（`LOL_CREATOR_SAFE`・`VAL_CREATOR_SAFE`・`RIOT_GAMES_CREATOR_SAFE`）、`js/library.js`（`RIOT_GUIDE_KEYS`）、`tools/leagueoflegends-*-tracklist.json`（各リストの `creatorSafe`）、`tools/riot-games-creator-safe-playlist.json`（Riot Games Creator-Safe Playlistの記録）、`tools/valorant-creator-safe.json`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`docs/VALORANT-MUSIC.md` |
| 利用者向けMIDI・権利案内 | `docs/guide/touhou-midi.md`、`docs/guide/sound.md`、`docs/guide/en.md` |
| 🎓 OST手続き生成 | `tools/make-trk-ost.mjs`（出力は `assets/trk-ost/`・Git外。5ルール×2曲＝10曲のWAVスケッチ） |
| Endfield楽曲台帳・曲名fixture・検査 | `docs/ARKNIGHTS-ENDFIELD-MUSIC.md`、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`、`tools/check-repo.mjs` |
| Service Worker | `sw.js`（現行cache名：`trk-v2026.10.12-trk126`） |
| 全体・安全検査 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs` |

## 6. 直近の検証

- `npm run check`：成功。Static 0 failure／0 warning、`node:test` **218/218**（リポジトリ、Security、a11y、vendor、MMD、Study Room、lite-mode検査を含む）。`git diff --check`：成功。
- **Creator-Safe（`check-repo.mjs`）**：LoL 22リストの状態・曲数・見当たらない曲・根拠の一致、VALORANT（記録した40曲から状態を計算し直す）、trk118の12リスト・539曲（全曲が記録したトラックIDの曲名・アーティストと一致、各100曲以下・重複なし）と記録した927行の網羅を検査。各ブロックとも、わざと壊すとFAILすること（改変検知）を確認済み（trk115：7通り、trk116：8通り、trk117：5通り、trk118：4通り）。自動作成のtrkリストは65（上限100）。照合作業そのもの（songdata.io の51〜977行目の転記と突き合わせ）はリポジトリ外で行い、結果をfixtureと台帳に記録した。トラックIDは、VALORANTの36件が別の一覧と1件ずつ一致し、3件を公式のSpotify埋め込み表示で開いて確認。
- **ブラウザ**（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium 153 headless、trk118時点。この開発コンテナにはNSPR／NSSが無くそのままでは起動しないため、`objdump -T` で未定義シンボルを拾って空の `libnspr4`／`libnss3`／`libnssutil3` を作り、`LD_LIBRARY_PATH` で通しています）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。`tools/smoke-game-end.mjs` PASS（trk114）。使い捨てのe2e（最新41項目）で、LoLリストの入手先ガイドの鍵と ja/en/zh/ko の表示、廃止した鍵（`plGuideLolCsLikely`・`plGuideLolSessions`）の保存データが起動時に置き換わること、LoLの新しい4リストの自動作成、🛒公式カタログからの VALORANT・LoL関連ゲームのリストの取り込みとガイド、ページエラー0を確認。trk114では削除の印・♻復元・OSTの移動・3スキンのaxe・MIDIの文言も確認（23項目）。各回の詳細は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) の「trk114〜118 の検証記録」。
- **trk119の書斎キー送り**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218。`tools/check-study-room.mjs` に、`js/study-room.js` から `studyZoomScrollNodes`／`studyScrollZoomedImage` を取り出して動かすVM検査を追加：1回押し＝84%、押しっぱなし＝6%、上下の端で `false` を返してページ送りにゆずること、見開きは左右が同じだけ動くこと、縦読み・等倍・文章の本では動かないこと）。わざと壊す3通り（配線の削除・送り幅の変更・縦読み／等倍の除外の削除）でFAILすることを確認。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless）：①900×600の窓と全画面（`F`）で、ズーム2倍の画像が `↑`／`↓` で送られ（48px／504px＝そのときの表示高の84%）、ページ番号が動かないこと、②見開きは左右のページが同じだけ動き、`↑` で両方が戻ること、③「画像ページを ↑ / ↓ で移動する」設定では、端まで送った次の押下でページが進み、その続きを送れること、④拡大していないときは、この設定がオフなら何も起きない（従来どおり）こと、⑤マウスホイールの動き（送り先・ページ番号不変）とページエラー0を確認。`docs/guide/study-room.md`・`docs/guide/en.md` の画像・キー操作の項に追記。
- **trk120の拡大の送り幅**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` のVM検査を追加：`studyZoomPercentStep`（未設定・不正値は5%）、`studySnapZoom`（5%＝1.14→1.15／1.12→1.1、25%＝2.2→2.25、上下限0.5〜4）、`studyStepZoom`（5%＝100→105→110→105%、刻みに乗らない1.37は10%で140%→130%、25%は20回で400%止まり・30回戻して50%止まり）。⚙のセレクトが1／2／5／10／25%を並び順どおりに持つこと、ariaラベル、配線、言語切替の文言同期、初期化も検査。**わざと壊す10通りでFAILを確認**（既定値・選択肢の変更、刻みの無視、配線／初期化／言語同期の削除、HTMLの選択肢の削除・並び順の変更、aria属性の削除）。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760）：Ctrl+ホイール1回＝100→105→110→105%、`+`／`-`キーも同じ、`0`で100%。⚙で25%にすると1回＝125%（戻して100%）、1%にすると101→102%。25%で20回＝400%止まり、30回戻して50%止まり。リロード後も送り幅（25%）と倍率（50%）が残る。ja／en／zh／koで行ラベル・選択肢・ヒント・キーの説明（`studyHelpZoom`）が4言語で出る。**trk119の ↑／↓ は変わらず**：200%で ↓1回＝357px（表示高425の84%）→ ↑で0、「↑ / ↓でページ移動する」設定ONでも ↓×3＝1,071px（ページ番号は不変）、全画面（`F`）↓＝638px（表示高760の84%）、Ctrlなしホイールは300pxのネイティブスクロール。ページエラー0。`docs/guide/study-room.md`・`docs/guide/en.md` の画像の項に追記。
- **trk121の書斎キー／マウス**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` のVM検査を追加：`studyJumpZoomEdge`（下端へ→下端の次は上端、上端で `PageUp`→下端、見開きは左右とも、縦読み・等倍・文本書・画面に収まる画像は `false`＝ページ送りにゆずる）と、⚙の2つのチェックボックスの初期値（端ジャンプ＝オン、中クリック＝オフ）、配線・既定値の読み戻し。わざと壊す7通りでFAILを確認。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless）：①200%で `PageDown`＝下端（11,330px＝いちばん下）→もう一度で上端（0px）、`PageUp` も対称に動く（上端→下端→上端）、全画面（`F`）でも下端（16,592px）へ、②100%（等倍）では従来どおり次のページ／前のページ、③中クリック（`page.mouse.click({button:"middle"})`）は初期オフではページが動かず、⚙で入れると1回で2ページ目へ（`mousedown` での自動スクロール抑止も確認）、④ページエラー0。文言（`studyHelpNav`／`studyHelpPg`／`studyZoomEdgeKeys`／`studyZoomEdgeKeysHint`／`studyMiddleClickNext`／`studyMiddleClickNextHint`）は4言語。
- **trk122の書斎ページ送り**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` のVM検査を更新：`studyJumpZoomEdge` が「端では次の／前のページへ（`studyJumpZoomPage` 相当の `studyJumpToPage` 呼び出しと、開く位置 `top`／`bottom`）」「見開きは2ページずつ」「片側だけスクロールしている見開きは端へ送るだけ」「本の端では反対の端へ」「縦読み・等倍・文本書・画面に収まる画像は `false`」、そして `studyApplyZoomLand` が新しいページの高さで開くこと（`top`/`bottom`）。**わざと壊す6通りでFAILを確認**。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760、高さの違う4枚の画像）：200%で `PageDown`＝下端（11,330px＝1枚目の高さ）→もう一度で2ページ目の上端（0）→下端（14,258px＝**2枚目の高さ**。続きの端が新しい画像の高さで当たっている証拠）→3ページ目の上端、`PageUp` は逆に（前のページの下端→上端→さらに前のページの下端）。見開き（300%）は左右が同じだけ動き、見開きごとに2ページ送り、戻ると前の見開きの下端。2ページの本では最終ページの下端で `PageDown` が上端へ戻る（本の端）。等倍では従来どおりページ送り。ページエラー0。文言（`studyZoomEdgeKeys`／`studyZoomEdgeKeysHint`／`studyHelpPg`）は4言語、ガイド（ja／en）も更新。
- **trk126のバナーの再生／一時停止**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-repo.mjs` に `bannerPlayAction`（純粋関数）のVM検査を追加：プレイ中＝一時停止、一時停止中＝再開、選曲中はプレビューの停止／再生、プレビューオフ・曲未選択・メディアプレーヤー中・ended では何もしない（8通り）。あわせて、**音量ボタンの左に同じ大きさで並ぶこと**（`bannerMediaBar.append(bannerPlayBtn, bannerVolBtn)`）、アイコンと説明が状態に合うこと、押せない状態（`disabled`）を持つこと、押したときの4動作（ゲームの一時停止／再開・プレビューの停止／再開）が**そのボタンの中だけ**に書かれていること、`video` の play／pause と `phase`／`language` で表示が追随すること、曲名に触れたときの再開（`bannerPreviewRestart`）、共通の大きさのCSS、曲名の右の余白（96px以上）、4言語のヒントを検査。**わざと壊す11通りでFAIL**（左右の順番／アイコンの状態合わせ／`aria-label`／`disabled`／プレビューオフの除外／再開の配線／再生を鳴らさない／共通サイズのCSS／余白／韓国語の文言／並びに入れない）。ボタンは**選曲画面（曲名バナー）の中**にあるので、実際に見えるのは選曲中のプレビュー操作です（プレイ中は選曲画面ごと隠れるため。プレイ中の一時停止はこれまでどおり⌨や下の一時停止ボタン）。 この開発コンテナのChromiumには絵文字フォントが無いので、確認は**アイコンが豆腐（□）にならないかの字形依存**を避けるため、Noto Color Emoji をその場で当てて撮った写真でも行った（▶／⏸／🔊 とも色つきで出る。実機ではOSの絵文字フォントで同じ形になる）。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760）：初期状態は曲未選択で押せず（`▶`・薄い色）、デモ曲を選ぶと `⏸` になり、押すと止まり（`video.paused`）、もう一度押すと**止めた位置から**鳴ります。**同じ曲名に触れても、別の曲名に触れても一時停止は解除されて鳴り**（止まったままにならない）、一時停止のままプレイ（▶スタート）すると再生されます（`phase`＝playing・`video.paused`＝false）。ボタンは音量ボタンと同じ大きさ（17×18px）で**すぐ左**に並び、曲名とは重なりません。音量ボタンの短押し（スライダー表示）はこれまでどおり。ja／en で説明が変わり、ページエラー0。
- **trk125の書斎ボタンと長押しの強化**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` に、2つの長押し（書斎の起動と本棚のフォルダ作成）が共有する `studyBindHoldPress`（650ms・14px超の移動で取り消し）のVM検査14通りを追加：押しっぱなしで1回だけ発火、長押しの直後のクリックを飲み込める、650ms未満は離しても発火しない、ドラッグで取り消し、**動いていない `pointercancel` では取り消さない**、離した時点で650ms経っていればタイマーが消えていても発火、右ボタンでは始まらない、タッチの `pointerleave` では取り消さない、フラグが自分で消える、など。新設のCSS検査も含め、**わざと壊す9通りでFAILを確認**。`tools/check-repo.mjs` の項目6は、📚 書斎ボタンが `studyHeadBtn` を持ち `moreBtn` を持たないこと（設定で隠れないこと）と、`studyOpenBtnHint` が4言語そろっていることを検査。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760・タッチ対応）：ボタンは初期状態から見え（`📚 Study`／`📚 書斎`、ヒント付き）、クリックで開く。**設定「長押しの代わりのボタンを出す」をオフにすると他の `moreBtn` 4つは隠れるのに、このボタンは出たまま**で開ける。曲リストの見出しの長押しはマウス・タッチとも開き、**動かないまま届いた `pointercancel` でも開き**、動かしてから取り消すと開かず、短いタップでも開かない。本棚の見出しは長押し・`pointercancel`・タップのいずれでもフォルダができる（1→2→3）。ページエラー0。**「長押しで書斎に行かない」という報告は、自動化ではタイトル／再生中／一時停止中・開いて閉じた後・ライトモードのオン／オフ・マウス／タッチのいずれでも再現しなかった**（Chromium）。実機でまだ起きるなら端末とブラウザを教えてほしい。
- **trk124のPCマウス操作**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` のVM検査を追加：`studyMouseClickPage`（**マウスの左クリック＝次へ・右クリック＝前へ**、`pointerdown` で覚えた種類は1回で消費＝合成 click では送らない、**反転**で右＝進む・左＝戻る、設定オフ／縦読み／文本書／書斎の外では `false`。指・ペンのタップは左右の半分のまま）と中クリックの3択（何もしない／次のページへ／閉じて本棚へ。`mousedown` は自動スクロールを止めるだけ、閉じるは `studyCloseToShelf()` を呼びページは送らない）。**わざと壊す9通りでFAILを確認**（マウス以外でも送る／種類を消費しない／左右の割り当てを逆／縦読みでも送る／旧・中クリックの引き継ぎを消す／反転の有効／無効を切り替えない／「閉じる」を次ページにする／右クリックの配線を消す／HTMLのチェックボックスを消す）。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760・タッチ対応、高さの違う4枚の画像）：初期値は左右クリック＝オフ（反転は選べない）・中クリック＝何もしないで、左クリックはこれまでどおり**左半分＝次へ（1→2ページ）・右半分＝前へ（2→1）**、右クリックは何も起きない。左右クリックをオンにすると**右半分をクリックしても次へ**（1→2）、**左半分を右クリックしても前へ**（2→1）。反転をオンにすると右クリック＝進む（1→2）・左クリック＝戻る（2→1）。設定オンのままでも**指のタップは左右の半分**（左半分＝次へ、右半分＝前へ）。中クリックは「何もしない」＝ページが動かず、「次のページへ」＝1回で進み（1→2）、「閉じて本棚へ」＝**全画面（`F`＝実 `document.fullscreenElement`）からも**本が閉じて本棚へ戻り全画面が終わる（`.study-fullimage` が外れ `fullscreenElement` が `null`）。リロード後も**オン／反転／中クリックの選択**が残る（左右クリックはオフに戻す）。ページエラー0。`docs/guide/study-room.md`・`docs/guide/en.md` の画像の項、`sw.js` cache名（`trk-v2026.10.12-trk124`）を更新。
- **trk123の本の端の閉じる動作**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` 218/218）。`tools/check-study-room.mjs` のVM検査を更新：`studyJumpZoomEdge` が本の端（1ページ目の上端・最終ページの下端）でページを送らず `studyCloseAtBookEdge` を1回だけ呼び、途中の位置では呼ばないこと（6項目）、`studyCloseAtBookEdge` が「全画面なら `study-fullimage` を外して `document.exitFullscreen()` を呼び、コントロールを直してから `studyBackToShelf()` を呼ぶ」「CSSだけの全画面（`studyFullscreenFallback`）ではブラウザAPIを呼ばない」「他の要素が全画面のときは触らない」「全画面でなければ本棚へ戻るだけ」の9項目。**わざと壊す9通りでFAILを確認**。ブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium headless、1100×760）：通常表示では200%で最終ページの下端→`PageDown` で本が閉じて本棚（メニュー）へ、全画面（`F`＝実際に `requestFullscreen` が通る）では1ページ目の上端→`PageUp`、最終ページの下端→`PageDown` のどちらでも `.study-fullimage` が外れ、`document.fullscreenElement` が `null`（全画面も終了）になり、`#studyBookView` が隠れて本棚が残ること。ページエラー0。
- trk114のMIDI計測（開発コンテナのNode、`studio_gm`）：4和音・3分（2,880音）は7.9秒→3.3秒、合成した密な3分の曲（平均約37音）は36.3秒→21.3秒。4和音・9分半は8,650万（旧上限8,000万で拒否→可）、密な4分は1.96億（可）、密な5分は2.46億（不可）。実際の東方MIDIでは未計測（§4-1）。
- Endfield Zeroth Directiveカタログ検査（`check-repo.mjs`🛰️ブロック）：Vol.1 37曲＋Vol.2 23曲の順序・公式Spotify個別曲リンク・中国語別名・ffm.toガイド・既存取り込みの安全更新を確認。
- Endfield Metal Scar Radioアルバム検査（`check-repo.mjs`🛰️バッチ2ブロック）：6作81曲（5+9+17+4+30+16）の順序・一意な公式Spotify個別曲リンク・照合別名なし・公式SpotifyアルバムのsourceUrl・権利表記・`trk-endfield` 配下への6プレイリスト自動作成を確認。曲名を1つ壊すとFAILすることを確認済み（改変検知の動作確認）。
- 🎼 手続き生成（`tools/make-trk-ost.mjs`）：10曲すべて生成でき、WAVの peak 0.62〜0.72・RMS 0.08〜0.29（無音でもクリップでもない）。打楽器ノイズとMLPサンプリングをシード済みPRNG化したため **2回生成して全ファイルのmd5一致**を確認（決定的ビルド）。**実際に聴いての良否は未確認**（§4-6）。
- 自動検査でローカル参照・構文・Stageの幾何・選曲画面のoverflowを確認。新しいMIDIの音質、通常ブラウザ上での聞こえ方、実機操作はまだ確認していません。
- **利用者の実機確認（2026-10-12、trk125・trk126）**：曲リスト右の 📚 書斎 ボタン（常時表示）と、曲名バナーの右下の ⏯ 再生／一時停止（音量ボタンの左）が実機で動作（空さん）。一時停止＝プレビューが止まり、曲名に触れると鳴り直すこと、書斎ボタンで書斎に入れることを確認。配置も了承。Endfieldの配信リンク（Spotify・ffm.to・网易云音乐）の実ブラウザ表示も未確認です（§4-5）。バッチ2の曲順・曲名・アーティストは 2026-10-11 に公式Spotifyのアルバム埋め込みページで6作すべてを再確認し、Homecoming は公式ffm.toスマートリンクでも照合しましたが、個別曲IDの全数確認と実ブラウザ確認は未実施です。

## 7. 最近の変更

- **trk126（2026-10-12）**：曲名バナーの**右下に再生／一時停止のボタン**を足した（**音量ボタンの左**。アイコンだけの同じ大きさのボタン）。**選曲中＝プレビューの音を止める／鳴らす**（止めたところから鳴り直します）。ゲームの再生中・一時停止中は同じボタンが一時停止／再開（ゲームの一時停止と同じ）に働きますが、**プレイ中は選曲画面ごと隠れる**ので、ふだん見えるのは選曲中のプレビュー操作です。**曲名に触れて曲を選び直すと一時停止は解除され、新しい曲のプレビューが鳴ります**（止まったままにならない）。止める音がないとき（曲未選択・プレビューオフ）は押せない状態にしてあります。文言（`bannerPlayPauseTip`／`bannerPlayResumeTip`）は4言語。`docs/guide/appearance.md`・`docs/guide/en.md` を更新、`sw.js` cache名（`trk-v2026.10.12-trk126`）を更新。**2026-10-12に実機で動作確認済み**（空さん。配置も了承。§4-11）。
- **trk125（2026-10-12）**：①曲リストの右側の **📚 書斎** ボタンを**常時表示**にした（`#studyOpenBtn`。件数の隣。trk73のボタンは設定「👆 長押しの代わりのボタンを出す」で隠れていたので、そこから外した。ラベルは4言語、ヒント付き）。②書斎を開く長押しと本棚のフォルダを作る長押しを**同じヘルパー**（`studyBindHoldPress`、650ms・14px超の移動で取り消し）にまとめ、**ブラウザ都合の `pointercancel`（指が動いていないのに届くもの）では取り消さず**、離した時点で650ms経っていればタイマーが消えていても開くようにした（「長押しで書斎に行かなくなった」という報告への備え。自動化では再現しませんでした）。`docs/LONG-PRESS-AUDIT.md`・`docs/guide/study-room.md`・`docs/guide/en.md` を更新、`sw.js` cache名（`trk-v2026.10.12-trk125`）を更新。
- **trk124（2026-10-12）**：書斎の画像リーダーに**PCのマウス操作の設定**を足した。①**左右クリックでページを送る**（初期オフ。左＝次へ・右＝前へ。ページのどこをクリックしても送れ、**左右の反転**＝右＝進む・左＝戻るも選べる。トラックボールや左利き向け）②**中クリック**を「**何もしない／次のページへ／閉じて本棚へ（全画面を終了）**」から選ぶ選択式にした（初期値＝何もしない。trk121の「中クリック＝次のページ」のオンは「次のページへ」として引き継ぐ）。どちらも**マウスのボタンだけ**に働き、指のタップはこれまでどおり左右の半分で送る（画像の本のときだけ）。⚙上級者向けで、文言は4言語。`docs/guide/study-room.md`・`docs/guide/en.md` の画像の項、`sw.js` cache名（`trk-v2026.10.12-trk124`）を更新。
- **trk123以前**：trk123（拡大中の端で閉じる動作＝全画面を終了して本棚へ）・trk122（端でさらに押すと次の／前のページを続きの端から開く）・trk121（拡大中の PageDown / PageUp。中クリック＝次のページの設定は trk124 で選択式へ）・trk120（拡大の送り幅を％で選ぶ）・trk119（拡大した画像を ↑ / ↓ で送る）・trk118（Creator-Safeの12リスト・539曲）・trk117（VALORANTのCreator-Safe照合・`RIOT_GUIDE_KEYS`へ改名）・trk116（LoLの残りリストのCreator-Safe照合・`notFound`・links-partial／links-absent）・trk115（LoL Creator-Safe照合を101曲目以降へ）・trk114（再レビュー対応：LoL Creator-Safe表示の訂正・MIDI処理量・削除の印ほか）・trk113（trk's OST用の手続き作曲スクリプト）・trk112（タブ挙動・デモ曲のOST移設）・trk111は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)。Endfield初号指令OST、Touhouローカル曲名カタログと24種のコード生成MIDI音色・TRK MIDI MIX（trk109）、LoLカタログ、音源ジャケット、TV、譜面生成、名前空間等の作業履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) と各設計資料を参照。

## 8. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、既定値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・データ・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff と `sw.js` cache名を確認した。
- [ ] 日本語ガイドを変更した場合、英語ガイドの対応箇所も更新した。
