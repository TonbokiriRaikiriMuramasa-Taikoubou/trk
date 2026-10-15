# trk! 開発引き継ぎ

> **最終更新：2026-10-15（trk167）**。現在の仕様・守る条件・未確認事項の要約です。過去の変更履歴（trk154以前）と検証記録（trk158以前）は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、品質・安全確認は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) と [`SECURITY.md`](SECURITY.md) を参照してください。
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

### ブルーアーカイブ・ミカ（trk157〜159）

既存OST Vol.1〜8・225曲は維持。メモリアルロビー2曲と旧3リスト（kiss angel／Aria to the Star／ソロ＆参加曲）を1つのプレイリスト **`ba-mika`（自動作成ID `trk-ba-mika`）「🪽 聖園ミカ」**（タブ色 `pink`）にまとめ、**BA全体は9リスト・239項目**です。ミカ部分はメモリアルロビーBGM2曲と歌唱6楽曲を言語・媒体・伴奏で分けた14項目（音源10／映像4）であり、「14曲」でも全作品の網羅数でもありません。

| 曲の並び（`ba-mika`「🪽 聖園ミカ」内） | 項目数 | 収録範囲・案内先 |
|---|---|---|
| 1〜2：メモリアルロビー曲 | 2項目 | Daily Routine 24/7（Nor、OST Vol.1／mora、`Daily Routine 247` も照合）＋You’re My Princess（EmoCosine、2026年10月時点で公式配信先未確認のため作曲家Xの1分投稿へ案内） |
| 3〜7：kiss angel | 5項目 | PV2本（中／日、公式bilibili）＋音源3曲（中文版／日文版／伴奏版、Apple Music中国ストア） |
| 8〜10：Aria to the Star | 3項目 | Prismatic Diary／The Incandescent Blue and the Cometの音源2曲（Apple Music英国ストア）＋グローバル公式ミニミュージカル本編（YouTube） |
| 11〜14：ソロ＆参加曲 | 4項目 | 幸せになるよ／ワンダー・ファニー・ハーモニー／Let's Go With...の歌入り3曲（Apple Music日本ストア）＋最後の曲の公式MV（YouTube） |

- 既存ブルアカ棚 `trk-ba` に自動作成し、共通タグは `Mika`。新しいMikaフォルダへの移動はしません。trk157〜158の旧3リスト（`trk-ba-mika-kiss`／`trk-ba-mika-aria`／`trk-ba-mika-vocals`）が保存されている場合は、所持曲・開いているタブ・ユーザー編集・削除状態を引き継いで `trk-ba-mika` 1つへ自動統合します（`BA_MIKA_LEGACY_PL`、削除予定日 2027-01-14）。
- 案内キーは `plGuideBlueArchiveMika`（4言語）。地域差、ローカルファイル提供の保証なし、配信・購入は二次利用許諾ではないことを明記。
- **英語掲載名≠英語歌唱**。Ariaの韓国語公式曲名は音源の照合別名。本編と曲別MV、音源と映像は分け、英韓チャンネルの投稿数を楽曲数に加算しません。合唱クレジットはCV括弧のみ省略し、全キャラクター名を80文字内に保持。
- kiss angelのShort音声2版は公式の単独配信先未確認で未収録。Ariaの会話・伴奏・曲別MV、日本語曲の別バージョン、映像出演だけの候補は今回の収録対象外（存在未確認とは区別）。
- 出典・各曲の範囲は [`BLUEARCHIVE-MIKA-INDEX.md`](BLUEARCHIVE-MIKA-INDEX.md)、作品別は [`BLUEARCHIVE-MIKA-MUSIC.md`](BLUEARCHIVE-MIKA-MUSIC.md)／[`BLUEARCHIVE-MIKA-ARIA.md`](BLUEARCHIVE-MIKA-ARIA.md)。音源・動画・歌詞は同梱しません。

### 曲名と媒体の照合（trk155〜159）

- **元ファイル名・表示名は変更しない**。公式タイトルと根拠のある `matchAliases` で照合します。方針はREADME（日英）、仕様と未対応例は [`TITLE-MATCH.md`](TITLE-MATCH.md)。
- クラシックは `Cm`／`C minor`・空白・句読点を吸収し、調・作品番号・楽章は保持。BeethovenのMusopen掲載名を別名として登録し、保存済みClassic Vol.1へも同じ曲の別名だけを補います。全クラシックの配布名を確認したわけではありません。
- `24/7`（半角 `/`・全角 `／`）を含む曲名からは `247` の照合キーも生成し、`Daily Routine 24/7` と `Daily Routine 247` のどちらの表記でも整合します。
- 装飾救済は `【高音質】`／`[HQ]`／`[High Quality]`／先頭🎧／`Theme 数字 -` に限定。通常照合の後、全候補が一意なときだけ採用。作者クレジットはカタログのartistを含む完全なキーと照合し、ローカル名のbyを推測で削りません。
- JP／CN／Short／Instrumental等の版名は保持。版やクラシックの見出しを左右に分割して別曲を拾わず、装飾救済を共有プレイリストの取り込みに広げません。旧テストの `Do you wanna kiss by angel` は仮想例で、公式曲名・別名には登録していません。
- ミカの項目は `matchMedia: audio | video` を指定。通常／別名／装飾／照合メモの候補を媒体で絞ります。動画取込flag→実FileのMIME→実ファイル名の拡張子の順に判定し、媒体不明は未一致。`trkWishFromTrack`／`plSanitize`で条件を保存します。**内容の鑑定ではなく、誤った形式情報や録音・歌唱言語を検証するものではありません。** 条件のない既存項目は従来どおり。

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

### 初回の案内（trk140）

- 1行のバー（`#quickGuide`）＋開くと出る8つの手順（`#guideSteps`）。スタンプは `GUIDE_STAMPS`（js/main.js）。完了は Seed 欄の `trk!`（演出つき 🥚 の言葉も残す）。
- 検知：設定の開閉（`settings`／`settingsClose`）、書斎の開閉（`studyOpen`／`studyClose`）、TRKアンプの `#ampUseInp`、スキンは `applySkin`、曲は `phase` が playing。
- 保存：`tutorialStamps`（js/core.js）。旧 `song` は `play` に移し、未知の値は捨てる。

### 書斎のCBZ／ZIP（trk138）

- 1ファイル＝1冊の画像の本。ページは `page:{id}:{generation}:{n}` のキーで保存し、置き換えは画像フォルダと同じ `studyWriteImageRecord` を使う。
- 通常上限は書斎の画像と同じ（3000ページ・合計600MiB・1ページ100MiB）。「容量の上限を無視」で冊数・ページ数・合計容量・通常画像の単体上限は外せますが、圧縮爆弾対策の **CBZ／ZIP内1ページ100MiB展開上限は常に残す**。ZIP読取の固定構造上限（1アーカイブ25万項目・中央目録64MiB）も設定では解除されません。上限の判定は取り込み前に行い、超えるファイルは作らない。
- 失敗の理由は、1冊も入らなかったときは状態欄に、途中まで入ったときは集計の後ろに添えて出す（取り込みの開始と本を開く処理は状態欄を消すため、その後に出す）。
- 失敗の表示は、ファイルごとの文言が最後の集計（`Done: …`）で上書きされる。画像フォルダと同じ動き。

### 📦 まるごとバックアップ・端末保存（trk136〜137・160〜163）

- 設定画面から `navigator.storage.persist()` を要求／状態表示します（`?safe=1` は要求しない）。まるごとバックアップは core（localStorage許可リスト＋ライブラリ）・書斎・パックを既定で含み、曲・VRM・MMDなど大きいmediaは任意です。ZIP64対応、復元前に全エントリーのCRC・サイズをストリームで確認し、宣言サイズを超えた展開はその場で止めます。localStorageは `LS_KEYS` の許可リストだけを読み書きします。
- 書き出し側のCRCもBlobの `stream()` で計算し、ファイル全体を `arrayBuffer()` にしません。復元のBlob参照はZIP内のsliceで保持します（JSON化・IndexedDB書込み自体は必要な箇所で行います）。`.stpack`の読み込み・生成も共通ZIP経路を使い、パック全体を`ArrayBuffer`へ載せず、個々の展開ファイルもCRC・実サイズを確認します。
- **固定の解析安全上限（trk162）**：共通ZIP reader/writerは1アーカイブ250,000項目・中央目録64MiB。バックアップはさらにメタデータ1MiB、設定JSON20MiB、DBストアJSON64MiB／250,000レコード／ストア、圧縮エントリー展開64MiBまで（backup.jsonは1MiB・local.jsonは20MiB）。書き出し側も早めに検査し、「容量の上限を無視」では外しません。CBZ／ZIPはこの構造上限に加え、展開後1ページ100MiBを維持します。
- **ZIP作り手の互換性（trk163・F-37）**：Info-ZIPが標準入力・パイプからメンバーを読むZIP（`printf abc | zip - - > x.cbz` など）は、大きさが事前に分からないため32bitで足りていてもZIP64終端レコード＋ロケーターを必ず置きます（trk162はこれを`zipBad`で拒否する回帰でした）。ロケーターが正しく指し、終端レコードの中身（ディスク番号・件数・中央目録の大きさ／位置）がEOCDと一致するときだけ、その位置を中央目録の終わりとして認めます。中身が食い違うファイルは従来どおり拒否し、読む値は常にEOCD側だけ＝二重解釈は許しません。実Info-ZIP 3.0出力（store・deflate）の受理と嘘ロケーター／中身違いの拒否fixtureは `tests/zip-io.test.mjs` に固定。**ローカルヘッダと中央目録の `flags` 完全一致の要求は緩めていません**（実機確認は§4-15）。
- **書斎ストアの復元順（trk163）**：参照される側から書きます（pages→covers→books→settings）。容量不足などで途中失敗しても本側は無傷のままで、残る不整合は「参照されないページ」（書斎の整理で消せる）になり、「存在しないページを指す本」にはなりません。失敗時の案内に逃げ道も明記（4言語）：固定上限を超えたとき（backupHardLimit）は「作成時に📚書斎などの領域のチェックを外す／範囲を分ける」、パック導入失敗の内訳（backupRestorePackFailedKept）は「空き容量が足りないときは不要なパックを削除してからもう一度復元」。
- 復元時のアプリ上限（無視設定がオフのとき）は、書斎500冊・1冊3000ページ・画像アルバム600MiB／100MiB/画像・文章12MiB、パック500MiB/件・合計1GiB。画像サイズは `page.size` ではなくZIPの検証済みBlobエントリー実サイズを確認。すべての上限を無視してもブラウザ容量・メモリ上限は残ります。
- パック領域の復元は、先に既存インストーラで各パックを試し、最後にバックアップに無いIDだけ削除します。IDは正規化後の名前＋作者から算出。対象パックの導入失敗時は同じIDの既存版を残し、manifestから全IDを特定できないバックアップでは削除処理をしません。完了時に導入・失敗・削除件数と、同一ID保護／整理見送りをダイアログで表示し、確認後に再読み込みします。保存容量不足時に成功を保証するものではありません。

### 書斎の設定と画像キー（trk133〜135）

- **全画面フィット（trk135）**：設定の一番上「全画面時に強制的に画面にフィットにする」（`fullscreenFit:false` が既定、保存値は boolean `true` だけオン）。全画面中だけ画像全体を縦横比を保って表示（単ページ・見開きの左右それぞれ・縦読みの1枚ごと）。`studyFullscreenFitActive` と `studyApplyZoomValue` が保存済み `zoom` を変えず、表示倍率だけ1／`data-fullscreen-fit=1` にします。CSSは `minmax(0,1fr)` で縦横の枠を確定し `object-fit:contain`（単に倍率を1へ戻すだけでは大きな画像がはみ出すため）。強制中はキー・ホイール・ピンチで倍率を変えず、ドラッグのパンも止めてスワイプを維持。ネイティブ全画面・CSS代替・ブラウザからの全画面終了・リサイズに対応し、終了後は元の拡大率へ。縦読みは各ページを画面高に収め、一覧は引き続きスクロールします。
- **書斎上部に常時「⚙ 設定」**（trk134）。本を未選択・本棚非表示でも開けます。読書見出しの **「画像を全画面化」の左にも「⚙ 設定」**。本棚にも入口があり、従来の上級者向け項目を同じモーダルへ移設（コントロールは複製しない）。本棚非表示・テキスト閲覧中にも読書側から開けます。変更は即保存。Esc／閉じる／背景クリックで設定だけを閉じ、入口へフォーカスを戻します（本棚を隠して入口が消えたら、見える入口へ）。設定中は本体を inert にし、Tab はパネル内、読書ショートカットは止めます。キー割り当ては引き続き設定内で使えます。
- **PageDown＝画像の下端、PageUp＝上端が倍率に関係なく標準**。はみ出す画像が対象（単ページ・見開き、100%・縮小も）。端で押し直すと次／前ページを続きの端から開き、本の端では全画面を終了して本棚へ。**「最後のページ時PageDownで本を閉じる」**（`closeOnLastPageDown:true` が既定、trk134）をオフにすると、最後の画像の下端で止まって本・全画面を維持します（キーは処理済みにしてページ送りへ落とさない）。単ページ・見開きの画像端移動に適用。先頭でのPageUp・中クリック・直接ページ送りモード・縦読み・テキストには変更なし。保存値は `false` だけオフ、未保存・不正型は初期オン。押しっぱなしでは端で停止。`↑`／`↓` の拡大時スクロール、縦読み・テキスト・画面に収まる画像の従来動作は変更なし。
- 設定 **「PageUP、PageDownをページ動作にする」**（`pageKeysTurnPages:false` が既定）をオンにすると直接ページ送り。旧 `zoomEdgeKeys:false` は新設定 `true` として引き継ぎます（新設定の boolean があれば優先、文字列は boolean として扱わない）。保存先は従来どおり書斎専用 IndexedDB の `settings/ui`。アプリ全体の設定 Import/Export・リセットとは別の既存経路で、`?safe=1` では書斎を開かず保存領域を読みません。明示的に割り当てた「次へ／前へ」のキーは引き続き優先。

### 維持中の既存機能

- **🎓 trk's OST Vol.1（`trk-ost-v1`）**：🐔 trk's playlist の Game Vol.1 直下。今は FIRST SPARK のデモ1曲を置く棚です。手続き生成曲は別の **trk Agent's OST Vol.1（`trk-agent-ost-v1`）** にmanifest経由で接続済み（下記）。trk112が最上位に作った本棚だけを一度trkフォルダへ移し（印は `cat: "trk:ost"`）、以後は利用者が動かした場所を守ります。
- **🎼 手続き作曲ツール／任意のAgent OST（trk113・trk149〜151）**：`node tools/make-trk-ost.mjs` で5ルール×2曲＝10曲のWAVスケッチと `assets/trk-ost/manifest.json` を生成（外部ライブラリなし・決定的）。アプリ側にはmanifest読込み・専用リスト作成・選択時の音源読込みを実装済みです。ただし音源とmanifestは `.gitignore` 対象で、公開リポジトリには入っていません。既定コードの `AGENT_OST_MANIFEST_INCLUDED=false` は任意資産をfetchしない印です。音源を意図的に含める配布／試験ビルドだけ true にし、生成したmanifest・WAVと一緒に配布します。10曲の実聴取・品質評価は未確認（§4-6）。
- **消した自動リストは作り直さない（trk114）**：trk!が自動で作るリスト（IDが `trk-` で始まる Game Vol.1・Classic Vol.1・trk's OST Vol.1・Agent's OST Vol.1・カタログの各リスト）を消すと、`settings.trkRemoved` に印が残り、次の起動で作り直しません。設定「🐔 trk's playlist」の **♻ 消したtrkのリストを戻す（n件）**で印を外して作り直します（Game Vol.1／Classic Vol.1の「開く」ボタンもその1件の印を外す）。印は `trk-` で始まるIDだけ・200件までに検証し、全リセットで空に戻ります。
- **入手先ガイドは表示言語で出す（trk114）**：公式カタログ由来のガイドは辞書キー（`plGuide…`）と日本語の控えを保存し、表示時に今の言語で引きます（LoL・Endfield・ブルアカ・学マス・Game／Classic Vol.1など21キー×4言語）。既存の保存データは起動時に自動で鍵が付きます。カタログ本体の各シリーズ説明文（`js/catalog.js` の `note`）はまだ日本語だけです。
- **小さなアクセント文字の色（trk114）**：`--ui-accent-ink`（`js/data.js` の `accentInk`、`applySkin` が毎回設定）。設定画面の入れ子の欄（カード＋パネル＋小欄の重なり）でも4.5:1になるまで、アクセントを本文の色へ5%ずつ寄せます。足りているスキンは元の色のまま。44スキン中16スキンで色が少し変わりました（スキンの棚の見出し、リンク、記録表の選択行など13ルール＋fx.jsのリンク1箇所）。
- **曲名バナーの操作（trk73・trk126）**：バナーの**右端に [◀][🎲][▶]**（前後の曲・おまかせ。🎲 は既定で長押し650ms、設定で「タップだけ」「非表示」を選べる）、**右下に [⏯][🔊]**（同じ大きさのアイコンだけのボタンを並べた `.bannerMediaBar`）。🔊 は短押しでスライダー・長押しでミュート／復元。**⏯ は選曲中にプレビューの音を止める／鳴らす**（止めたところから鳴り直す）、曲の再生中・一時停止中はゲームの一時停止／再開（プレイ中は選曲画面ごと隠れるので、ふだん見えるのは選曲中）。**曲名に触れて曲を選び直すと一時停止は解除されて鳴り直す**（止まったままにならない）。設定などへ行って選曲画面に戻ったときも、プレビューは開始位置から鳴り直します（`library.js` の `screen` → `startPreview`）。**これは意図どおり**（2026-10-12のレビューで確認）：一時停止は「いまだけ止める」もので、次に曲を選ぶのは音を鳴らしたいという判断のため。止めた状態を保つ仕様ではありません（「ユーザーが止めた」フラグは持たせない）。止める音がないとき（曲未選択・プレビューオフ）は押せない状態で、ボタンの説明（ホバー・読み上げ）が理由を出します（trk127：曲を選ぶ／プレビューをオンにする／その他。`bannerPlayTipKey`）。設定「右上の曲名をタップで一時停止／再生」（初期オフ）はバナー全体のタップとして別に残ります。
- **タブの挙動（trk112）**：チュートリアルのデモ曲は独立タブ（🎓デモ曲）をやめ、上記 trk's OST Vol.1 にまとめました。開いたタブは libOpenTabs で残り、削除はタブの ⚙（長押し）設定から（曲はライブラリに残る）。**フォルダ内のプレイリストを開いたタブは閉じるまで残る**のが既定になり、フォルダ内タブの中クリックは「タブを閉じる」（本体は残す）に変更しました。
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

一覧（状態は 2026-10-15 時点）。詳細は下の「4.1 詳細」にあります。既存項目の番号は維持しています。

| # | 項目 | 状態 | 次の一手 |
|---|---|---|---|
| 1 | MIDI／MIXの実ブラウザ・実音声確認（PC・Android） | 自動テスト済み・実音声は未確認 | 実音声で聴く。trk114 の処理量の上限を実際のMIDIで確かめる |
| 2 | カタログ名表示（優先順と元ファイル名の保存） | 未確認 | 実ライブラリで確認 |
| 3 | 音源ジャケット（trk101〜106） | 一覧のサムネイルは利用者確認済み（2026-10-09）。ほかは未確認 | 選択中バナー・TV・書斎・譜面中の配置を実曲で確認 |
| 4 | LoL外部ページ（Season 4〜9 の SoundCloud セット、人気曲リンク） | 未確認 | 実ブラウザで再確認、LoL台帳を更新 |
| 5 | Endfield配信リンク（Spotify個別曲・ffm.to・網易云） | 一部未確認（バッチ2の残り75曲のIDなど） | 実ブラウザで確認、エンドフィールド台帳を更新 |
| 6 | 🎼 手続き生成10曲の聴取（trk113） | manifest経由のアプリ連携は実装済み。10曲の実聴取・品質評価は未確認 | `assets/trk-ost/index.html` で聴く。任意音源ビルドでは専用リスト・選曲再生も確認 |
| 7 | Android Chrome／PCの Service Worker、MMD／VRM、IndexedDB | オフライン動作は利用者確認済み（2026-10-14）。safe・MMD／VRM・IndexedDBは未確認 | 残る項目を実機で確認 |
| 8 | trk114 の画面（自動リストの復元、入手先ガイド、16スキンの色） | ヘッドレスで一部確認 | 実機で確認 |
| 9 | 書斎の設定と画像キー（trk133〜135） | ヘッドレスで確認、実機は未確認 | 全画面フィット、上部の設定入口、拡大の送り幅を実機で |
| 10 | Riot系カタログ（trk116〜118） | ヘッドレスで取り込みとガイドを確認、実機は未確認 | 実機で確認、Spotify リンクを数件開く |
| 11 | 入口まわり（📚書斎ボタン・⏯再生ボタン、trk125・126） | **2026-10-12 に実機で動作確認済み** | 押しやすさ（大きさ・位置）だけ引き続き見る。再発時は端末・押し方を聞く |
| 12 | trk129〜132 の確認（↕並べ替え、パック外し、共有プレイリスト、MIRROR、Endfield、フォルダ上限40、🎭棚の戻し、パックとスキン、MOD後の書き出し） | 実機未確認（自動検査のみ。⑧⑨はヘッドレス17項目で確認） | 見てほしい順（①〜⑨）で実機確認 |
| 13 | trk136（全画面フィットの PageDown 長押し、💾端末の保存） | 実機未確認 | PC・Android で確認 |
| 14 | 曲名照合・ミカ音源／映像（trk155〜159） | Node/VM・合成WAVのヘッドレス検査済み。実曲・実動画・実機は未確認 | 実ファイルで照合・再生、配信ページの地域差を確認（購入・抽出を自動実行しない） |
| 15 | ZIP作り手の互換性（trk163：Info-ZIP標準入力出力の受理、`flags`完全一致） | 実Info-ZIP 3.0出力（store・deflate・パイプ）とレビューでのPython zipfileはNode検査済み。Windowsのエクスプローラー／macOSの圧縮／スマホアプリのCBZは実機未確認 | 各で作ったCBZを実機で一度ずつ書斎に取り込んでみる。読めないCBZが出たら `flags` の食い違いを疑い、緩めるなら暗号化ビット（bit0）＋圧縮方式だけの比較にする（現時点では緩めていない） |
| 16 | ▶ メディアプレーヤーの新機能（trk164：📌画中画・🔆Wake Lock・⏪スマート巻き戻し・💤スリープのフェードアウト＋この曲の終わり） | 純関数の決定（巻き戻しの計算・フェード計画・endedMediaの優先順・タイマーの掃除）はNode/VM検査済み。実機挙動は未確認 | Android Chrome／PCで📌画中画の継続と復帰、🔆動画再生中に画面が消えないこと（音声だけ・タブ裏では消えること）、⏪続き再生の戻し幅が実際的な不快感にならないか、💤フェード後に音量が戻った状態で次の再生が始まるかを確認。iOSはPiP／Wake Lockの対応差（SafariのPiPはvideo要素のみ可など）を見て非対応時のボタン無効＋案内が出ればよい |
| 17 | 📥 OSの共有／「このアプリで開く」（trk165：share_target＋file_handlers） | 振り分け・SWの一時保存・manifestの整合はNode/VM検査済み。**インストール済みPWAが前提**なので実機は未確認 | Android Chromeで共有シート→trk!（曲・動画・CBZ/ZIP・.stpack・pack.json入りZIP）、デスクトップで「このアプリで開く」を確認。非対応形式の案内、複数ファイル、容量超過時の案内（?shared=partial/error）、アプリ更新をまたいで受け取りが残ること（inboxはactivateの掃除から除外）も。iOS Safariは非対応＝何も出ないのが仕様 |
| 18 | 🎤 歌詞（trk166：LRC同期歌詞＋埋め込み歌詞 USLT/SYLT/©lyr/LYRICS） | LRCパーサ・合成バイナリからの埋め込み歌詞読取・優先順（手動→フォルダ.lrc→埋め込み）はNode/VM検査済み。実音源での確認は未了 | 手持ちの実ファイルで: ①歌詞タグ入り mp3/m4a/flac/ogg で 🎤 パネルに出典「埋め込みタグ」と出るか（USLT と SYLT、UTF-16 タグ含む）②フォルダ共有で同名 .lrc を置いた曲が同期するか ③「📄 歌詞ファイルを選ぶ」で選んだ .lrc/.txt が曲ごとに保存され、再起動後も残るか ④行クリックのシーク、ハイライト追従、スクロールの見た目 ⑤時刻なし歌詞の素の表示 |
| 19 | 🏷 埋め込みテキストタグの表示（trk167：TIT2/TPE1/TALB/TPE2/TRCK/TCON・©nam/©ART/©alb/aART/trkn/©gen・Vorbis TITLE/ARTIST/ALBUM/…） | 合成バイナリからの読取・表示名の優先順（ユーザー設定名→タグ→カタログ曲名→ファイル名）・照合の分離はNode/VM検査済み。実音源での確認は未了 | タグ付きの mp3/m4a/flac/ogg で: 曲リストの曲名・サブ行（アーティスト・アルバム）、検索、名前順ソート、選曲バナー、メディアプレーヤー（キュー・ヘッダ・ロック画面表示）にタグが出ること。🎶 プロフィールの設定名がタグより優先、タグなしは従来のファイル名のまま。**カタログ照合（灰色行→黒行）はファイル名側のまま**＝タグとファイル名が食い違うファイルでも自動追加が壊れないことの確認も |

#### 実ブラウザsmoke／CIの容量（trk162調査）

- **実行環境**：`npm run check` は実ブラウザsmokeを実行しません。GitHub ActionsはGitHub Pagesの静的コピー／公開のみです。`package.json`／lockfileにPuppeteerはなく、smokeスクリプトは `SMOKE_CHROME`／`SMOKE_PUPPETEER` で外部インストール済みブラウザを指定するため、自動ダウンロードはしません。この環境にChromium／Chromeはなく、実ブラウザsmokeは未実施。
- **既知のサイズ**：npm registryの `puppeteer-core@25.13.0` は単体の展開後6,010,962 bytes（約5.73 MiB、927 files）。リポジトリ依存には含まれず、推移依存はこの値に含みません。Chrome／Chromium本体、CIキャッシュ、一時ディスク、実転送量は未計測です。
- **ソース差分**：HEAD比でHTML／JS／SWが非圧縮約17.7 kB増、テスト・ガイド等を含む全ファイルは約64.7 kB増。Pages workflowはリポジトリ一式をartifactへコピーしますが、圧縮後サイズは未計測です。
- **上限設計のNode目安**：10万項目・約9.08 MBの合成ZIPを作成・読込すると約2.44秒、強制GC後のJS heapは処理前比約10.7 MiB増でした。ピークRSSやChrome／モバイルのメモリ測定ではありません。この目安から、ZIP64の65,535件境界を十分に超える250,000項目・64 MiBの上限にしています。

### 4.1 詳細

1. **MIDI／MIXの実ブラウザ・実音声確認**（PC・Android）：有効なSMF 0/1の読込、24音色の違い、プロフィール選択が次の読込に反映されること、形式・サイズ・長さ制限を確認。MP3/WAVでMIX初期オフ／オン／プロファイル切替を確認し、セーフモード・Audioリセットで停止することも確認する。現時点では自動テスト済み・実音声未確認。
   - trk114：**実際の東方MIDIで処理量の上限（2億）を確かめる**。手元のファイルで `node tools/midi-budget.mjs *.mid --render` を実行し、各曲の処理量・PCでの変換時間を記録する（ファイルはリポジトリに入れない）。Androidでは変換時間と進み具合（%）の表示、変換中に別の曲を選んだときに止まること、余韻を打ち切った曲の終わり方（不自然な切れ目がないか）を聴いて確認する。合成ループの高速化は出力差1 LSB以内をNodeで確認しただけで、実機の音は未確認。
2. **カタログ名表示**：ユーザー設定名 → カタログ名 → 元ファイル名の優先順と、元ファイル名・保存名が変わらないことを実際のライブラリで確認する。
3. **音源ジャケット**（trk101〜106）：曲一覧のサムネイル表示は利用者確認済み（2026-10-09）。選択中バナー・TV・書斎、譜面中の右上配置、フィルター、画像なし、表示設定の優先順はPC／Androidの実曲で確認する。詳細は旧記録と [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) を参照。
4. **LoL外部ページ**：Season 4〜9 のSoundCloudセット表示と、地域制限曲を含む人気曲リンクを実ブラウザで再確認する（Warsongsのセットはtrk115で確認済み）。曲別調査はLoL台帳を更新する。
5. **Endfield配信リンク**：Zeroth Directive OST 60曲＋バッチ2の6作81曲のSpotify個別曲ページ、各巻のffm.toスマートリンクと网易云音乐アルバムの表示・地域差を実ブラウザで再確認する。バッチ2は個別曲IDの抜取確認が6曲のみで、残り75曲のIDは未個別確認。バッチ2の中国語公式曲名・ffm.to告知リンク（Homecoming 以外）・VGMdb照合・他ストアの曲別URLは未確認のまま。Zeroth Vol.1 は 2026-10-11 に Apple Music 掲載を確認済み（Vol.2 のアルバム別URLは未照合）。未収録の公式リリース（Yi／Old Deep Water Dies／Sketches of Lost Heirlooms／A Promise Makes a Home 等）は台帳の「調査中の他の公式リリース」表に確認状況を記録済み。曲別調査はエンドフィールド台帳を更新する。trk128 の並び・棚・改名はヘッドレスChromiumのe2e（20項目）で確認済みだが、**実端末でのEndfieldタブの見た目（並び・「Endfield Character Theme」棚）は未確認**。
6. **🎼 手続き生成10曲の聴取確認**（trk113）：自動検査は「無音でもクリップでもない」こと（peak 0.62〜0.72・RMS 0.08〜0.29）と決定的生成を確認しただけで、音楽としての良否は未確認。`assets/trk-ost/index.html` で曲として聴けるか、耳障りなノイズや音量バランスを確認する。アプリ連携先は別棚 `trk-agent-ost-v1` として実装済みだが、公開リポジトリにWAV／manifestは同梱しない。任意音源を含める検証ビルドでは `AGENT_OST_MANIFEST_INCLUDED=true` にして専用リストと選曲時の読込みを確認する。品質評価・公開配布への同梱判断は別。
7. Android Chrome／PCでService Workerのsafe・オフライン、MMD／VRM、IndexedDBを確認する。Node・shim検査は実機確認の代用ではありません。
   - **2026-10-14 更新**：オフラインで動くことは利用者が実機で確認済み（「インターネットに繋がなくても遊べる」の文言の根拠）。MMD／VRM、IndexedDB、safe の実機確認は未了。
8. **trk114の画面確認**：①自動リスト（例：LoLのSeason 3）を消して再起動しても戻らないこと、♻ボタンの件数表示と復元、trk's OST Vol.1を別フォルダへ動かして再起動しても戻らないこと。②英・中・韓のUIで入手先ガイド（タブの長押し）が各言語で出ること。③色が変わった16スキン（shadow・daylight・sakura・snowfield・garden・strawberry・melonberry・dawn・midnightsun・pastelloop・wagara・showacafe・cbLight・shojiLight・morningKitchen・mikuClassic）で、スキンの棚の見出しやリンクの色が見やすく、スキンの雰囲気を壊していないこと。ヘッドレスChromiumでは①②とcbLight・shojiLight・morningKitchenのaxe（4.61〜4.62:1）を確認済み。
9. **書斎の設定と画像キー（trk133〜135で実機確認してほしいこと）**：trk135の全画面フィット（実機のピンチ・画面回転・全画面終了で元の倍率に戻ること）。trk134の上部設定入口（未選択・本棚非表示）と「最後のページ時PageDownで本を閉じる」の切り替え。trk133の操作感と最後で閉じる動作は利用者から好評（端末・ブラウザの詳細は未確認）。以下は従来の確認項目：読書見出しの設定ボタンの押しやすさ、本棚を隠したままの設定、等倍の大きな画像で PageDown／PageUp → 端で押し直してページ送り → 本の端で閉じる動作、新設定オンで直接ページ送りになること。ヘッドレスChromiumでは確認済みですが、実際のPC／Androidの手ざわりは未確認。**以下はtrk119〜127の経緯（倍率制限はtrk133で解除）**：拡大した画像を `↑`／`↓` で送る動きは、ヘッドレスChromium（PCの画面比・全画面モード）で確認済み。PC・Androidの実機で、トラックパッドやノートPCのキーボード、日本語配列、`←`／`→`のページ送りと混ぜて使ったときの体感、および長い本（縦読み）での手ざわりは未確認。実際に読みながら「1回押しの送り幅（画面の84%）」が多すぎ／少なすぎないかも見てほしい。拡大の送り幅の設定（trk120、初期値5%・1／2／5／10／25%）も、実機で「気持ちよく拡大縮小できるか」を試してほしい（ホイール・＋／−ボタン・ピンチで同じ幅を使う）。trk121〜123の `PageDown`／`PageUp`（初期オン。拡大中は下端／上端へ、端でさらに押すと次の／前のページを続きの端から開き、**本の端では閉じる動作**＝画像の全画面を終了して本棚へ）と、trk124の**PCのマウス操作**（**左右クリックでページ送り**＝左＝次へ・右＝前へ、**左右の反転**つき。**中クリック**は「何もしない／次のページへ／閉じて本棚へ（全画面を終了）」の3択。初期値はオフ／何もしない）は、PCの実機で試してほしい。マウスは**右クリックでブラウザのメニューが出ないこと**（画像の上では前から出ません）、中ボタンの押し心地、ブラウザの自動スクロールが出ないこと、トラックパッドの中クリック、トラックボールや左利きでの左右の反転、指のタップ（これまでどおり左右の半分で送る）と混ぜて使ったときの手ざわりを確かめてほしい。実際に読みながら「端でさらに押すと次の／前のページへ」「本の端で閉じる」が好みか、読んでいる途中で意図せず閉じてしまわないか（押しすぎ）も見てほしい。中クリックの設定はtrk124で選択式に変わったので、trk121から中クリック＝次のページを使っていた人は選び直しが必要かどうかも。 **trk127の押しっぱなし停止**：ヘッドレスChromiumで、単発・押しっぱなし（同じキーのrepeat）を再現し、端で止まること・本を閉じないことを確認（修正前の版では次のページへ進み、本が閉じることも再現）。実際のキーボードの連打・OSのキーリピート設定での体感は未確認。
10. **Riot系カタログの画面確認**（trk116〜118）：🛒公式カタログに「🛡️ Riot Games — LoL関連ゲーム」と「VALORANT Creator-Safe」が出て取り込めること、LoLフォルダに4リスト（Pentakill など）が増えたこと、各リストの入手先ガイド（全曲／一部／見当たらない）が4言語で出ることを実機で確認する。新しい539曲のSpotifyリンクは、トラックIDの抜き取り確認が3件（VALORANTの36件は別の一覧と照合）なので、数件開いて確かめると確実。ヘッドレスChromiumでは取り込みとガイド表示を確認済み。
11. **入口まわりは実機で確認済み（trk125・trk126）**：曲リスト右の **📚 書斎** ボタン（常時表示）と、曲名バナーの右下の **⏯ 再生／一時停止**（音量ボタンの左）は、**2026-10-12に実機で動作確認済み**（空さん。選曲中のプレビュー停止／再開と、曲名に触れて選び直したときの鳴り直しを含む）。配置も「いい配置」とのこと。「長押しで書斎に行かない」という報告は、ヘッドレスChromiumの自動化では再現せず（タイトル・再生中・一時停止中・開いて閉じた後・ライトモードのオン／オフ・マウス／タッチのいずれでも開く）、その後の実機でも問題なく開いている。**もし再発したら**、端末とブラウザ、押し方（指かマウスか）を教えてほしい。アイコンだけの小さなボタンなので、押しやすさ（大きさ・位置）は引き続き見てほしい。
12. **trk129〜132の確認（実機で見てほしいこと）**：この4回は自動検査（`npm run check`・`git diff --check`）までで、**実機での確認は未実施**です（trk132の①②③はアーカイブの検証記録のとおりヘッドレスChromiumでも確認しましたが、ほかは自動検査のみ）。見てほしい順に：①**↕の並べ替え**（🐔の階層メニュー＝タブ長押しで、同じフォルダ〈Volの並び〉の中の↑↓を押すとその場で1つ動くこと。押しても画面が変わらない・別のフォルダの曲と入れ替わる、が直っているか。並びの端ではボタンが押せない〈薄い〉こと、🔤ABC順がオンなら4つのボタンすべてが押せないこと。フォルダ設定⚙で並べ替えると画面が開き直って新しい並びが見えること）。②**📦パックを外したとき**（パックが変えたスキン・ノーツの色/形・エフェクトの強さ・SEのオンが、当てる前の値に戻ること。パックを当てたまま再起動してから外しても戻ること。パックを使っている間に自分で変えた項目は元に戻らないこと。音を持つパックAから音を持たないパックBへ切り替えると、自分の読み込んだSEが消えたままにならず戻ること＝素早く切り替えても取り違えない）。③**📥共有プレイリスト**（4MiBを超えるファイルを選ぶと読み込まずに「ファイルが大きすぎます」と出ること〈4言語の文言は自動検査のみ〉。曲名が `08 sometimes`／`08_sometimes` のような表記ゆれで、手元の同じ曲にだけ✅が付き、別のアルバムの「01 intro」と「03 intro」のような曖昧な名前は✅にならないこと）。④**MIRROR**（掛けて遊んだとき、記録の行がMOD無しと同じ行に入り、ゴーストが前回どのMODで遊んでいても出ること）。⑤**Endfieldタブ**（上下の名前が「初号指令 (上) ZD OST Vol.1」「初号指令 (下) ZD OST Vol.2」と切れずに表示されること＝旧名の利用者も改名されること）。⑥**フォルダ上限40**（40個目までは作れて41個目は作られず、トースト「📁 フォルダは40個までです。使っていないフォルダを消すと作れます」が出ること〈4言語の文言は自動検査のみ。実際の表示は ja で確認してほしい〉）。⑦**🎭棚の戻し**（trk128をすでに4個以上のフォルダで起動していた環境＝🎭棚が消えてキャラクターテーマ4リストがトップへ落ちた状態で、新しい版の初回起動にだけ4リストが🎭棚へ戻り、2回目以降は利用者が動かした配置が守られること）。⑧**📦パックの切り替えとスキン**（スキンを持つパックAから、スキンを持たないパックBへ切り替えてBを外すと、Aのスキンではなく、Aを当てる前の自分のスキンに戻ること。Aを使っている間に自分でスキンを選び直したときは、その選んだスキンに戻ること）。⑨**MOD付きで遊んだ後の書き出し**（ミラー／RANDOMを掛けて遊んだ後に、一時停止画面・結果画面の「Export」や曲パックの「今の譜面を含める」で書き出しても、MOD後の譜面ではなく元の譜面が出ること）。※⑥⑦はヘッドレスChromiumでも未実施（自動検査のみ）。**⑧⑨はヘッドレスChromiumのe2e（17項目）で確認済み**（アーカイブ・trk132）だが、実機では未確認。
13. **trk136の確認（実機で見てほしいこと）**：①全画面フィットをオンにして **PageDown を長押し** すると、ページが連続して進むこと（描画が追いつかないときは止まり、追いついたら続く）。はみ出す画像では、長押しが端で止まること（従来どおり）。②設定の **💾 端末の保存** が、PC・Android Chromeで「固定されています」と出るか（Androidでは利用の状況により固定されないことがあり得ます。その場合は表示どおり書き出しで控える）。

14. **曲名照合とミカの案内**：Musopen等の実ダウンロード音源、ミカの実音源・実動画、PC／Androidの実際のフォルダ選択・聴取・再生は未確認。リンクの公開メタデータ取得を、全地域・全アカウントでの再生可否やローカルファイルの入手許諾と扱わない。範囲・未収録候補はミカ索引と `TITLE-MATCH.md` に残し、確認できた根拠だけを個別に更新する。

15. **ZIP作り手の互換性（trk163・レビュー【情報】）**：Info-ZIP 3.0 の標準入力メンバー出力（`printf abc | zip - -` のstore版・deflate版）、パイプ出力（アーカイブ自体を標準出力へ）、通常の一時ファイル出力は、実物のバイト列をNode fixtureにして受理・展開（CRC込み）を確認済み。2026-10-15 のレビューでは Info-ZIP（通常）・Python zipfile（deflate・UTF-8フラグ・ストリーム書き）もOKと確認されている。**未確認（実機で一度ずつ試してほしい）**：Windowsのエクスプローラー「圧縮フォルダー」、macOS「圧縮」、スマホアプリで作ったCBZを書斎に取り込めるか。注意点：**ローカルヘッダと中央目録の `flags` が完全一致すること**を求めており、試した作り手では問題なかったが、一部の作り手では両者がずれることが知られている。実機で読めないCBZが出たら、まず `flags` の食い違いを疑うこと。緩める場合は `flags` 全体ではなく**暗号化ビット（bit0）と圧縮方式だけの比較**にするのが安全（`js/zip-io.js` の `zipDataStart`。現時点では緩めていない）。

16. **▶ メディアプレーヤーの新機能（trk164で実機で見てほしいこと）**（2026-10-15、空さんの依頼を記録）：Node/VM検査は純関数の決定（巻き戻しの計算・フェード計画・タイマーの掃除・endedMediaの優先順）までで、以下は**すべて実機未確認**。
   - **📌 画中画（PiP）の継続と復帰（Android Chrome／PC）**：小窓に出して再生が続くこと、プレーヤーへ戻ると表示が復帰すること、プレーヤーを閉じたら浮き窓も一緒に消えること。
   - **🔆 動画再生中に画面が消えないこと**：動画の再生中は画面が暗くならない／消灯しない。**音声だけの再生と、タブ裏では消えること**（省電力を尊重する側。Wake Lockは「動画の再生中」だけ取得する設計）。設定「🔆 画面を消灯させない」のオン／オフがすぐ効くことも。
   - **⏪ 巻き戻し幅の実際的な不快感**：3〜30秒を設定して「続きから再生」したとき、戻り幅が実際に使って不快感にならないか（戻りすぎ／足りなすぎ）。一時停止からの再開では戻らないことも。
   - **💤 フェード後に音量が戻った状態で次の再生が始まるか**：分数スリープのフェードアウトで停止したあと、次に再生したときに音量が絞られたままになっていないこと。「この曲の終わり」で、リピート／シャッフルより優先して停止することも。
   - **iOS**：PiP／Wake Lockは**非対応時にボタンが無効＋案内（タイトル）が出ればOK**（動作の確認までは求めない。SafariのPiPは対応していれば動く、くらいで見る）。

17. **📥 OSの共有／「このアプリで開く」（trk165で実機で見てほしいこと）**：**インストール済みPWA**（「ホーム画面に追加」／デスクトップの「インストール」）が前提のため、ヘッドレスでは一切確認できない。見てほしいこと：①Android Chrome の共有シートに trk! が出ること（曲 mp3 等・動画・CBZ／ZIP・.stpack を1つずつ共有して、それぞれ既存の取り込みと同じ案内・検証で入ること。pack.json を含む .zip がパックとして入ること＝画像ZIPは書斎へ）。②デスクトップ（Chrome／Edge）でファイルを右クリック→「このアプリで開く」に trk! が出ること。③受け取れない形式（.txt など）を「📥 受け取れないファイル：名前」で知らせること。④複数ファイルの同時共有、空き容量不足（?shared=partial／error の案内）。⑤アプリの更新（SWのactivate）をまたいで一時置き場（trk-share-inbox-v1）が消えず、次の起動で取り込まれること。⑥起動中に共有されたとき（single-client の launchQueue 経路）。**iOS Safari は share_target／file_handlers 非対応＝共有シートに trk! が出ないのが仕様**（Capacitor ビルドで必要になったら別対応。PLAYER-ROADMAP #5 の記録どおり）。

18. **🎤 歌詞（trk166で実機で見てほしいこと）**：合成バイナリのテストは緑だが、**世の中の本物のタグは癖が強い**ので実ファイルで見てほしい。①手持ちの歌詞タグ入り mp3（USLT・SYLT の両方、UTF-16 エンコードのタグ）／m4a（©lyr）／flac・ogg（LYRICS / UNSYNCEDLYRICS）を再生して、メディアプレーヤーの 🎤 パネルに「出典：埋め込みタグ」と歌詞が出ること。②フォルダ共有（📤）で曲と同じ名前の .lrc を同じフォルダに置くと「出典：フォルダの .lrc（名前）」になること（優先順：手で選んだ歌詞 → フォルダの .lrc → 埋め込みタグ）。③「📄 歌詞ファイルを選ぶ」で .lrc/.txt を選ぶと曲ごとに保存され、**ページをリロードしても残る**こと（localStorage trk_lyrics_v1・1曲256KB/合計512KBで古い順に追い出し）。「✖ 選んだ歌詞を消す」で消えること。④同期歌詞のハイライトが再生位置に追随し、行のクリックでその位置へシークすること（逆再生中はハイライトを止めてある）。⑤時刻タグのない歌詞は「※ 時刻のない歌詞なので、そのまま表示します」と出てスクロールなしの素の表示になること。⑥歌詞は**読むだけ**：元ファイルは書き換わらない（書き戻し経路そのものが無い）。文字化けを見つけたら符号化（Latin-1/UTF-16/UTF-8）のどれだったか控えておいてほしい。

19. **🏷 埋め込みテキストタグの表示（trk167で実機で見てほしいこと）**：合成バイナリのテストは緑だが、実ファイルのタグは文字化け・非標準エンコード・巨大タグなど癖があるので実音源で見てほしい。①タグ付き mp3（TIT2/TPE1/TALB/TPE2/TRCK「3/12」形式、UTF-16 タグ）／m4a（©nam/©ART/©alb/aART/trkn）／flac・ogg（TITLE/ARTIST/ALBUM/TRACKNUMBER/TRACKTOTAL）で、曲リストの曲名とサブ行（アーティスト・アルバム）がタグから表示されること。②表示名の優先順：🎶 曲のプロフィールで名前を設定した曲は**それが勝ち続ける**こと、タグなしの曲は従来のファイル名のままなこと、東方 MIDI（th06_15.mid 等）はタグが無いのでカタログ曲名のままなこと。③選曲バナー・メディアプレーヤー（ヘッダ・キュー・Media Session＝ロック画面／通知）にも同じ名前が出ること。④検索（🔍）と名前順ソートがタグ込みの表示名で動くこと。⑤**照合の分離**：🛒 公式カタログの灰色行が黒くなる自動追加が、タグとファイル名が食い違うファイル（例：ファイル名 `08_sometimes.fla`・タグ「別名」）でも**ファイル名側で従来どおり**動くこと。⑥読み込みタイミング：長いリストをスクロールしたときに行が見えてからタグに変わること（サムネイルと同じタイミング）・もたつかないこと。⑦文字化けを見たら符号化（Latin-1/UTF-16/UTF-8）を控えておいてほしい。タグの**編集はできません**（読み取り専用＝設計）。

### 4.2 一回限りの移行・印（削除予定）

一覧と削除予定日は **[`docs/MIGRATIONS.md`](MIGRATIONS.md)** にあります（trk143 で登録簿にした）。
- 新しい一回限りの印・旧名の表を作ったら、登録簿に1行足す（`tools/check-repo.mjs` が表とコードのずれを失敗にし、期限切れを警告にする）。
- 期限は 2027-01-14（3か月後）。`trkRemoved` は保存データなので消さない。

## 5. 主なファイル

| 内容 | ファイル |
|---|---|
| Touhou固定タイトルデータ・曲カタログ | `js/touhou-theme-data.js`、`js/catalog.js` |
| 曲名照合・表示名 | `js/title-match.js`、`js/library.js`、`tests/title-match.test.mjs` |
| ミカの楽曲・出典・検査 | `docs/BLUEARCHIVE-MIKA-INDEX.md`、`docs/BLUEARCHIVE-MIKA-MUSIC.md`、`docs/BLUEARCHIVE-MIKA-ARIA.md`、`tools/bluearchive-mika*-tracklist.json`、`tests/bluearchive-mika.test.mjs` |
| 曲名照合の方針・ブラウザE2E | `docs/TITLE-MATCH.md`、`tools/e2e-title-match.mjs`（合成WAV・実曲未使用） |
| MIDI音色プロフィール・レンダラー・UI | `js/midi-profiles.js`、`js/midi-player.js`、`js/midi-settings.js`、`js/media.js` |
| 通常音声MIX DSP・左下パネル | `js/fx.js`、`js/fx-dock.js`、`css/style.css` |
| 設定・Import検証 | `js/core.js`、`tools/check-security.mjs` |
| 共有プレイリスト（📥）の取り込み・曲名照合 | `js/library.js`（`plImportPick`・`PLAYLIST_IMPORT_MAX`・`plMatchIndex`・`plMatchByTitle`）、`js/title-match.js`、`tests/playlist-import.test.mjs` |
| 🐔の並べ替え（↕） | `js/library.js`（`trkMovePlaylist`・`trkMoveButtonsState`・`trkOrderedPlaylists`）、`tests/trk-move-order.test.mjs` |
| 📥 OSの共有／「このアプリで開く」の受け口 | `js/share-inbox.js`（振り分け）、`sw.js`（`handleShareTarget`・inboxキャッシュ）、`manifest.webmanifest`（share_target／file_handlers）、`tests/trk165-share-inbox.test.mjs` |
| 🎤 歌詞（LRC・埋め込み歌詞） | `js/lyrics.js`（パーサ・保存・解決）、`js/audio-art.js`（`extractLyrics`）、`js/media-player-mode.js`（パネル）、`css/style.css`（`.mediaLyricsBox`）、`tests/trk166-lyrics.test.mjs` |
| 🏷 埋め込みテキストタグの表示 | `js/audio-art.js`（`extractTags`）、`js/library.js`（`songTags`・`songDisplayTitle`・`songDisplayMeta`・`loadSongTags`）、`js/media-player-mode.js`（`trackDisplayMeta`）、`tests/trk167-audio-tags.test.mjs`、方針＝`docs/TITLE-MATCH.md` |
| 📦パックを外したときの復元 | `js/custom.js`（`packSnapshot`・`packRebase`・`packApplied`・`packRestoreSettings`・`restoreOwnSounds`）、`js/core.js`（`cleanPackPrev`・`settings.packPrev`）、`tests/pack-unapply.test.mjs` |
| MIDI/MIXとカタログの検査 | `tests/midi-player.test.mjs`、`tests/media-midi-integration.test.mjs`、`tests/midi-mix.test.mjs`、`tests/touhou-catalog.test.mjs` |
| MIDIの処理量の測定（手元のファイル用） | `tools/midi-budget.mjs`（`estimateRender` を使う。読むだけ） |
| 自動リストの削除の印・ガイドの言語 | `js/library.js`（`trkRemoved`・`trkRestoreRemoved`・`trkCatalogGuide`・`plGuideText`）、`js/core.js`（`cleanTrkRemoved`）、`tests/trk-playlists.test.mjs` |
| Riot系カタログ（LoL・VALORANT・LoL関連ゲーム）のCreator-Safe照合状態 | `js/catalog.js`（`LOL_CREATOR_SAFE`・`VAL_CREATOR_SAFE`・`RIOT_GAMES_CREATOR_SAFE`）、`js/library.js`（`RIOT_GUIDE_KEYS`）、`tools/leagueoflegends-*-tracklist.json`（各リストの `creatorSafe`）、`tools/riot-games-creator-safe-playlist.json`（Riot Games Creator-Safe Playlistの記録）、`tools/valorant-creator-safe.json`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`docs/VALORANT-MUSIC.md` |
| 利用者向けMIDI・権利案内 | `docs/guide/touhou-midi.md`、`docs/guide/sound.md`、`docs/guide/en.md` |
| 🎼 Agent OSTの任意連携／生成 | `js/library.js`（`AGENT_OST_MANIFEST_INCLUDED`・`initAgentOstTracks`）、`tools/make-trk-ost.mjs`（10曲＋manifestを `assets/trk-ost/`・Git外へ生成）、`tools/e2e-trk149.mjs`、`tests/agent-ost.test.mjs` |
| 📦 まるごとバックアップ・ZIP CRC・復元 | `js/backup.js`、`js/zip-io.js`、`js/custom.js`（.stpackのストリーム読書き・`packIdentityFromManifest`）、`tests/backup-codec.test.mjs`、`tests/backup-restore.test.mjs`、`tests/pack-identity.test.mjs`、`tests/pack-zip-stream.test.mjs`、`tests/zip-io.test.mjs`、`tools/check-security.mjs` |
| CBZ／ZIP書斎のページ展開上限 | `js/study-room.js`（`studyAlbumLimits`・`studyImportArchiveBook`）、`tests/storage-limits.test.mjs` |
| Endfield楽曲台帳・曲名fixture・検査 | `docs/ARKNIGHTS-ENDFIELD-MUSIC.md`、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`、`tools/check-repo.mjs` |
| Service Worker | `sw.js`（現行cache名：`trk-v2026.10.15-trk163`） |
| 全体・安全検査 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs` |

## 6. 直近の検証

- **trk163（ZIP／バックアップのレビュー対応、2026-10-15）**：`npm run check` 成功（Static 0 failure／0 warning、Security **61 check**／0 warning、`node:test` **401/401**）、`git diff --check` 成功。実 Info-ZIP 3.0 の標準入力メンバー出力（`printf abc | zip - -` と時刻欄を除きバイト一致の199／203バイトfixture）の受理・CRC込み展開、嘘ロケーター・終端レコード中身の食い違い（二重解釈）の `zipBad` 拒否、書斎復元のストア書き込み順（pages→covers→books→settings）をNode/VM・静的検査で確認。この環境の Info-ZIP で生成したパイプ出力CBZ（一時ファイル経由・真のパイプの両方）も受理。**実ブラウザsmokeは未実施**（Chromium/Chrome未導入）。

- **trk162（ZIP／バックアップ容量境界、2026-10-15）**：`npm run check` 成功（Static 0 failure／0 warning、Security 59 check／0 warning、`node:test` **398/398**）、`git diff --check` 成功。ZIP64 unsafe値・偽EOCD・名前／件数／64MiB中央目録境界・256回決定的ヘッダfuzz、バックアップ復元のZIP上限案内、書斎復元の実Blob画像容量、容量上限を無視してもCBZ1ページ100MiBが残ることをNode/VM・静的検査で確認。**実ブラウザsmokeは未実施**（Chromium/Chrome未導入、`npm run check` とPages workflowにブラウザ取得処理なし）。

- **trk161（バックアップ復元結果の表示、2026-10-14）**：`npm run check` 成功（Static 0 failure／0 warning、Security 58 check、`node:test` **390/390**）、`git diff --check` 成功。パック領域を含む／含まない場合の表示、導入・失敗・削除数、同一ID保護、ID不明時の整理見送りと、確認後の再読み込みをNode/VM・静的検査で確認。**実ブラウザsmokeは未実施**（この環境にChromium/ChromeとPuppeteerがない）。

- **trk160（ZIP／バックアップのレビュー対応、2026-10-14）**：`npm run check` 成功（Static 0 failure／0 warning、Security 58 check、`node:test` **387/387**）、`git diff --check` 成功。ZIP CRC・サイズ確認、ZIP作成と `.stpack` の読み書き、ZIP64追加フィールド境界、パス名、バックアップ復元時の同一ID保護、`__proto__` codec、Agent OST既定manifest非取得、容量設定を無視したCBZページ100MB上限をNode/VM・静的検査で確認。**実ブラウザsmoke／PC・Android実機は未実施**（この環境にChromium/ChromeとPuppeteerがなく、`tools/smoke-game-end.mjs`／`tools/e2e-trk149.mjs`／`tools/e2e-title-match.mjs`は未実行）。

- **trk159（ミカ3リストを「🪽 聖園ミカ」1つへ統合＋メモロビ2曲追加、2026-10-14）**：`npm run check` 成功（Static 0 failure／0 warning、`node:test` **371/371**）、`git diff --check` 成功。`ba-mika`（`🪽 聖園ミカ`、色 `pink`、14項目：メモリアルロビー2曲 `Daily Routine 24/7`・`You’re My Princess` → `kiss angel` 5項目 → `Aria to the Star` 3項目 → `ソロ＆参加曲` 4項目の順）、`Daily Routine 24/7` ↔ `Daily Routine 247` の表記ゆれ照合、旧3リスト（`trk-ba-mika-kiss`／`trk-ba-mika-aria`／`trk-ba-mika-vocals`）からの所持曲・開いているタブ・ユーザー編集を引き継ぐ統合、公式名・媒体・URL・全員の簡略クレジット、4言語ガイド、保存／再読込・削除尊重をNode/VMで検査（`tools/e2e-title-match.mjs` も統合リスト `trk-ba-mika` の14項目に追随更新済み）。**実ブラウザでの再実行・実曲の聴取・実動画再生・Android実機の確認は未実施。**

過去の検証件数・個別E2E・旧ブラウザ環境の回避手順は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) の「trk158整理時に移した検証記録」へ移しました。上記が現在の結果です。利用者の実機確認済み事項と残る確認項目は§4を正とします。

## 7. 最近の変更

- **trk167（2026-10-15）**：🏷 埋め込みテキストタグの表示（PLAYER-ROADMAP #7）。①**audio-art.js に `extractTags`**（extract のジャケット経路・extractLyrics は無変更＝回帰テスト付き）：ID3 TIT2/TPE1/TALB/TPE2/TRCK/TCON（v2.2 の TT2/TP1/TAL/TP2/TRK/TCO も。Latin-1/UTF-16±BOM/UTF-16BE/UTF-8）、MP4 ©nam/©ART/©alb/aART/©gen＋**trkn はバイナリ**（8バイトから track/trackTotal に分解）、FLAC/Ogg/Opus の TITLE/ARTIST/ALBUM/ALBUMARTIST/TRACKNUMBER/TRACKTOTAL/GENRE（キーは大文字小文字区別なし）。`normalizeTags` でトリム・200字上限・"3/12" のトラック番号分解、全部空なら null。**読み取り専用**＝書き戻し経路なし（`createWritable` 不在を見張りで担保）。②**library.js**：`songTags`（メモリ Map・song key 単位、リロード後は読み直し＝正はファイルの中）＋`loadSongTags`（サムネイルと同じ slot 制限・pending 重複防止・負結果も記憶）＋**表示名の優先順を `songDisplayTitle` に挿入**＝「🎶 ユーザー設定名 → 🏷 タグ → カタログ曲名 → 元ファイル名」（TITLE-MATCH.md に方針を記録）。読み込みタイミング＝行が見えたとき（サムネイルと同じ IntersectionObserver）と選曲時（selectSong）。タグが届いたら `refreshRowTags` が**その行だけ**をその場で更新（`data-song-key`・全再描画しない）、選曲中の曲はバナーも更新、`core.emit("songTags")` でメディアプレーヤー側も追従。サブ行（アーティスト・アルバム）は `songDisplayMeta`（ユーザー設定 → タグ → 曲オブジェクト）でリスト・バナー・メディアプレーヤー（ヘッダ・キュー・Media Session）に統一。**カタログ照合（plWish 系）はファイル名側のまま＝タグは照合キーに関与しない**（既存行 `plNormTitle((metaOf…).artist || it.artist)` を見張りで固定）。`window.songDisplayTitle` をグローバル公開（favs.js/game.js/study-room.js/video-max.js の既存 typeof ガードが実際に届くようになった）。③テスト `tests/trk167-audio-tags.test.mjs`（6件）：audio-art.js 全体を vm で実行し合成バイナリ（ID3 v2.2/2.3・UTF-16・MP4 trkn バイナリ・FLAC/Ogg/Opus）から実読、優先順は library.js の実関数抽出で検証、ジャケット・歌詞経路の回帰付き。④check-repo 見張り追加。日英ガイド（appearance.md／en.md のジャケット項目の隣）・TITLE-MATCH.md・§4-19・§4.1-19・§5・PLAYER-ROADMAP #7→[x]（グルーピング表示・トラック番号順は #16 として起票）、`sw.js` cache を `trk-v2026.10.15-trk167` へ。**実音源での確認は §4-19 に登録**。新しい UI 文言はなし（表示だけなので 4 言語テキスト追加なし）。

- **trk166（2026-10-15）**：🎤 歌詞表示（PLAYER-ROADMAP #6）。①**js/lyrics.js**（新規・audio-art.js の直後に読込）：LRCパーサ `parseLrc`（[mm:ss.xx]／[mm:ss]／[mm:ss.xxx]／[mm:ss:xx]、1行複数時刻、時刻順不同の整列、`[offset:±N]`＝仕様どおり「+で早く」、拡張LRCの `<mm:ss.xx>` 単語タグは行単位に丸める、ti/ar/al/by/re/ve のIDタグはメタへ・知らない [xx:yy] 行は歌詞として残す、時刻タグが無ければ synced:false の素のテキスト）。上限（10万字・1000行・1行50時刻）。`activeLineIndex`（二分探索）。**解決の優先順**＝手で選んだ歌詞 → フォルダの同名 .lrc → 埋め込みタグ（`resolveLyrics`）。手で選んだ歌詞は localStorage `trk_lyrics_v1` に曲キー単位で保存（1曲256KB・合計512KB、超えたら古い順に追い出し＝今の曲は残す）。②**audio-art.js に `extractLyrics`**（extract のジャケット経路は無変更）：ID3 USLT/ULT（Latin-1/UTF-16±BOM/UTF-16BE/UTF-8）＋ SYLT/SLT（ミリ秒形式だけ→秒の `lines` に正規化・整列。MIDI形式はテンポ無しでは秒に直せないので読み飛ばし）、MP4 `©lyr`（data kind 1/0）、FLAC/Ogg Vorbisコメント LYRICS/UNSYNCEDLYRICS（大文字小文字区別なし）。歌詞は256KB上限。**読み取り専用**＝書き戻し経路は無い（createWritable 不在を見張りで担保）。③**library.js**：フォルダのスキャン（📁開く／📤共有）が `.lrc` も集め、同じフォルダの同名曲に `it.lyricsFile` を付ける（💾端末に残す曲には付かない＝手動選択の保存で代替）。④**media-player-mode.js**：🎤 パネル（`<details>`、シーークバーの直下）＝出典表示（埋め込み／フォルダ／手動＋非同期歌詞の注記）・「📄 歌詞ファイルを選ぶ」（.lrc/.txt）・「✖ 選んだ歌詞を消す」・同期リスト。ハイライトは renderMedia の250ms周期に相乗り（行が変わったときだけ class 付け替え＋`scrollIntoView(center,smooth)`）、行クリックでシーク（`seekToLyric`＝逆再生中は止めてから）。**逆再生中はハイライトを止める**（時計が違うため）。曲変更（songSelected）・プレーヤー起動（openMedia）・言語変更で作り直し。開閉は設定 `mediaLyricsOpen` に記憶。パネルを開いたときだけ歌詞を読む（埋め込みタグはファイルアクセスを伴うので）。TEXT 14キー×4言語。⑤テスト `tests/trk166-lyrics.test.mjs`（11件）：lyrics.js と audio-art.js は**実ファイル全体を vm で実行**し、合成バイナリ（ID3v2.3/2.4 USLT・UTF-16、SYLT（整列・UTF-16・MIDI形式スキップ）、MP4 ©lyr の入れ子ボックス、FLAC/Ogg/Opus コメント）から実際に読むところまで検証。ジャケット経路の回帰テスト付き。⑥`tools/check-repo.mjs` 見張り追加＋既存の dialog.append 見張りを新しい並びへ更新。日英ガイド（play.md／en.md のメディアプレーヤー行）・§4-18・§4.1-18・§5・PLAYER-ROADMAP #6→[x]、`sw.js` cache を `trk-v2026.10.15-trk166` へ。**実ファイルでの確認は§4-18に登録**。

- **trk165（2026-10-15）**：📥 OSの共有／「このアプリで開く」の受け口（PLAYER-ROADMAP #5＝🥈最優先）。①**share_target**（manifest.webmanifest）：共有シートからのPOSTを `sw.js` の `handleShareTarget` が受け、ファイルだけ（title/text/urlは無視）を CacheStorage `trk-share-inbox-v1` に一時保存して `index.html?shared=…` へ303で戻す。一時保存は1件ずつ try/catch（容量不足等は partial/error で合図）。**inboxキャッシュは activate のバージョン掃除から除外**（更新をまたいで受け取りが消えない）。②**file_handlers**（デスクトップ）：`launchQueue.setConsumer` で File を直接受け取り、同じ振り分けへ（single-client＝起動中でも届く）。③**js/share-inbox.js**（新規・backup.js の後ろで読込）：起動時（load後）に inbox を読んで File に戻し、**既存の取り込み経路だけ**へ渡す＝曲→`Trk.library.addSongFiles`／動画→`addVideoFiles`（拡張子表 MEDIA_EXT・VIDEO_EXT を library から公開）／CBZ・ZIP→`Trk.study.importArchives`（書斎の凍結APIに追加）／.stpack と **pack.json を含む ZIP**→`Trk.custom.installAndUse`（パックインストーラの入口そのまま。ZIPの判定は `/(^|\/)pack\.json$/` の存在だけを見る振り分け専用ののぞき見で、検証は既存のインストーラが行う）。**新しい検証入口は作っていない**（上限・形式検査はすべて既存経路）。受け取れない形式は「📥 受け取れないファイル：名前（先頭3件＋件数）」で案内（4言語。core.js の Import 報告と同じ作法）。処理後に inbox は削除（再処理ループ防止）、`?shared=` は history.replaceState で掃除。④テスト `tests/trk165-share-inbox.test.mjs`（10件）：実ソースvm抽出で振り分け（拡張子優先・動画MIME・音声MIME単独は正直に拒否・m4bは現行 MEDIA_EXT に無いので非対応扱い＝ROADMAP #10 領域）、pack.json のぞき見（壊れたZIPは書斎側へ）、ルーティング先、SWの一時保存とリダイレクト合図（empty/partial/error）、ページの引き取り（prefix外は触らない・壊れたX-Share-Nameの名前フォールバック・全件削除）、manifest整合、配線。⑤`tools/check-repo.mjs` に見張り追加（manifest・スクリプト順・SW分岐・公開API・4言語）。日英ガイド（mobile.md／en.md「スマホで遊ぶ」）・この引継ぎ（§4-17・§4.1-17・§5）・PLAYER-ROADMAP #5 を更新し、`sw.js` cacheを`trk-v2026.10.15-trk165`へ。**実機確認はインストール済みPWAが前提のため§4-17に登録（ヘッドレス不可）。iOS Safariは非対応＝仕様**（Capacitor側は別対応）。

- **trk164（2026-10-15）**：▶ メディアプレーヤーの強化第1弾。`docs/PLAYER-ROADMAP.md`（ユニバーサルプレーヤー調査の台帳）の🥇最優先4項目（#1〜#4）を実装。①**📌画中画（PiP）**：コントロール列の「全画面で表示」の右にボタンを追加。`document.pictureInPictureEnabled`＋`requestPictureInPicture` の実在だけを見て、非対応ブラウザでは無効化＋タイトルで理由を表示（案内は4言語）。enter/leaveイベントで表示状態を追従させ、プレーヤーを閉じるときは `exitPictureInPicture()` で浮き窓を一緒に終える。②**🔆 Screen Wake Lock**：「動画の再生中」だけ取得する（`hasVideoFrames()` があり、再生中で、タブが表で、設定オンのとき）。音声だけの再生では画面消灯を妨げない。renderMedia の250ms周期と visibilitychange 復帰で取得／解放を監視し、ブラウザ側解放（releaseイベント）にも追従、closeMedia で即解放。設定は 🎬 動画キー／壁紙パネルの隣に「🔆 画面を消灯させない」パネルを追加（`mediaWakeLock`、既定オン＝`!== false` 方式）。③**⏪スマート巻き戻し**：`mediaResumeRewind`（0/3/5/10/15/30秒、既定オフ＝プロジェクトのオプトイン慣習）。「続きから再生」の入口（プレーヤーを開いたとき・キューから曲を選んだとき）だけ保存位置からN秒戻す（`savedMediaPosition({resume:true})`）。一時停止からの再開では戻さない。あわせて openMedia の続き位置シークを「止まっている／終わっているときだけ」に変更（再生中の飛び防止）。④**💤スリープタイマー強化**：分数（15/30/60分）に「この曲の終わり」モードを追加（selectの `track` → `setSleep(-1)` → `sleepTrackMode`）。曲終わりで endedMedia がリピート／シャッフルより優先して、続き位置を消して停止する（手で別の曲を選ぶと解除）。分数モードは停止15秒前から音量をフェードアウト（`planSleepFade` が「フェードがタイマーに入りきるか」を判定。逆再生中は逆再生側の音量管理を尊重して触らない）、停止・解除時は設定音量へ戻す。設定登録は core.js サニタイザー（`mediaResumeRewind: pick(...)`・`mediaWakeLock: !== false`）＋ resetVideoPrefs／resetAllPrefs の両リセット。テストは `tests/trk164-media-controls.test.mjs`（13件）：実ソースから純関数（巻き戻しの計算・フェード計画・savedMediaPosition のガード・setSleep／stopSleepTimer のタイマー掃除・endedMedia の優先順）を vm で切り出して検証＋TEXT 4言語・core.js 登録・配線のsource-scan。新TEXTキー11個×4言語、日英ガイド（play.md／en.md）を更新し、`sw.js` cacheを`trk-v2026.10.15-trk164`へ。実機確認は§4-16に登録。

- **trk163（2026-10-15）**：trk162のレビュー対応。①**【中・回帰】**Info-ZIPが標準入力から書いたZIP（パイプで作ったCBZ・パック）を丸ごと`zipBad`で拒否していた問題を修正（F-37）：ZIP64が不要でも置かれる終端レコード＋ロケーターを、ロケーターが正しく指し終端レコードの中身（ディスク番号・件数・中央目録の大きさ／位置）がEOCDと一致するときだけ中央目録の終わりとして受理。食い違いは従来どおり拒否＝二重解釈は引き続き塞いだまま。②**【低】**書斎ストアの復元を参照される側から（pages→covers→books→settings）に組み替え、途中失敗時に「存在しないページを指す本」が残らないように。③**【低】**固定上限（backupHardLimit）の案内に「作成時に書斎などの領域を外す／範囲を分ける」、パック導入失敗の内訳に「不要なパックを削除してからもう一度復元」の逃げ道を4言語で追記。④**【情報】**ZIP作り手互換性（エクスプローラー／macOS／スマホのCBZ、`flags`完全一致）の実機確認を§4-15に登録（`flags`は緩めていない）。`tools/check-security.mjs` に見張り2ルール追加（61 check）。日英ガイド・`docs/SECURITY.md`・この引継ぎを更新し、`sw.js` cacheを`trk-v2026.10.15-trk163`へ。自動検証は§6。

- **trk162（2026-10-15）**：ZIP reader/writerの固定上限を1アーカイブ250,000項目・中央目録64MiBへ設定。バックアップ生成／復元にはJSON・レコード固定上限を追加し、無視設定でも解除しないエラー案内を4言語化。書斎復元はアルバム合計・画像単体・文章等の通常上限を、ページBlobの実サイズと合わせて検査。日本語・英語ガイドと `docs/SECURITY.md` を更新。smoke／CI容量の内訳と未計測項目は§4へ整理。`sw.js` cacheを`trk-v2026.10.15-trk162`へ更新。

- **trk161（2026-10-14）**：バックアップ復元の完了ダイアログにパックの導入・失敗・削除件数を表示し、失敗時の同一ID保護、IDを全件確認できず整理を見送った状態、パック領域をバックアップに含めていない状態も明示。確認後に再読み込み。日本語・英語ガイドを追記し、`sw.js` cacheを`trk-v2026.10.14-trk161`へ更新。

- **trk160（2026-10-14）**：ZIP書出し・CRC／実サイズ確認をストリーム化し、ZIP64フィールド長とパス名を検査。バックアップだけでなく `.stpack` の読書きも共通のZIP経路へ移し、巨大パック全体の `ArrayBuffer` 化を避ける。復元はパック導入を試してから不要IDを整理し、失敗した同一IDの既存版を保護（ID不明時はpruneしない）。`decodeValue`の`__proto__`をデータとして保持。Agent OSTの既定ビルドはmanifestを要求せず、CBZ／ZIPは「容量の上限を無視」でも展開後1ページ100MBを維持。`smoke-game-end`の`welcomeSeen`、対象の日本語・英語ガイド、`docs/SECURITY.md`、この引継ぎ、`sw.js` cache（`trk-v2026.10.14-trk160`）を更新。自動検証は§6。

- **trk159（2026-10-14）**：ブルアカのミカ3プレイリスト（`ba-mika-kiss`／`ba-mika-aria`／`ba-mika-vocals`）を1つの「🪽 聖園ミカ」（`ba-mika`、自動作成ID `trk-ba-mika`、タブ色 `pink`）に統合し、先頭にメモリアルロビー2曲（1番目：`Daily Routine 24/7`（`Daily Routine 247` でも照合）→ mora、2番目：`You’re My Princess` → 2026年10月時点で公式配信未確認のため作曲家EmoCosine氏のX 1分投稿へ案内）を追加。曲の並び順をメモロビ2曲 → `kiss angel`（5項目）→ `Aria to the Star`（3項目）→ `ソロ＆参加曲`（4項目）の計14項目とし、旧3リストの保存データも自動統合（`BA_MIKA_LEGACY_PL`）。cacheをtrk159へ。

- **trk158（2026-10-14）**：ミカのAria（2音源＋本編映像）と日本語ソロ／歌唱参加（3音源＋MV）を追加。地域・歌唱言語・媒体を区別した4言語ガイド、出典台帳、回帰テスト。cacheをtrk158へ。

- **trk157（2026-10-14）**：READMEに公式タイトル基準の自動照合方針（元名は書き換えない）を追加。`Do you wanna kiss angel` の公式PV2本＋配信3曲を調査し、利用者の選択に従いブルアカへ独立リスト「ミカ — kiss angel」を追加。Short音声2版は未収録。媒体条件 `matchMedia`、4言語ガイド、出典fixture `tools/bluearchive-mika-tracklist.json`、テストを追加。`sw.js` cacheをtrk157へ。出典と権利・地域差は `BLUEARCHIVE-MIKA-MUSIC.md`。

- **trk156（2026-10-14）**：ブルアカの例を使い、限定した装飾の除去＋カタログ作者とのクレジット照合＋一意な場合だけの救済を追加。JP／CN／Short／Instrumental等は別の版として保護。実カタログの曲や入手先・権利情報は追加変更していない。`sw.js` cacheをtrk156へ。検証は§6、方針と未対応例は `TITLE-MATCH.md`。

- **trk155（2026-10-14）**：クラシック曲名の表記ゆれ対策。Musopenの利用者提供名をカタログ別名へ、意味を保つ表記の正規化・部分一致の抑止・末尾の作品番号を拡張子と誤認する問題を修正。保存済みClassic Vol.1の別名も更新。`sw.js` cacheをtrk155へ。合成WAVでのブラウザE2Eは§6参照。Musopenの実ダウンロード音源／PC・Android実機は未確認。

- **trk154以前**：詳細を [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) へ移しました。既存の安全対策・利用者判断は削除せず履歴に保存し、現在の仕様と未確認事項は§2〜4を参照します。

## 8. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、既定値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・データ・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff と `sw.js` cache名を確認した。
- [ ] 日本語ガイドを変更した場合、英語ガイドの対応箇所も更新した。
