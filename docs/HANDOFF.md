# trk! 開発引き継ぎ

> **最終更新：2026-10-12（trk117）**。現在の仕様・守る条件・未確認事項の要約です。細かな過去の作業履歴（trk114以前）は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、品質・安全確認は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) と [`SECURITY.md`](SECURITY.md) を参照してください。
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

### その他のカタログ

- LoLカタログはtrk108時点で18プレイリスト・456曲（Creator-Safe Sessions、Champion Themes、Worlds、MSI、K/DA、Season 1〜9 OST、Warsongs、人気曲）。**18リストすべてをRiot公式Creator-Safe Playlistと照合済み**（先頭100曲は公式の埋め込み表示＝trk114、101曲目以降は第三者サイトsongdata.ioの一覧＝trk115〜116。songdata.ioは979曲中977曲を表示し、出ない2曲は701〜750番目）。全曲あり＝Season 1〜9・Sessions: Vi・Star Guardian Taliyah／一部＝Champion Theme 39/41・Sessions: Diana 42/43・Warsongs 10/11・Worlds 1/13・人気曲 7/30／見当たらない＝MSIアンセム・K/DA。trk108〜113の「Season 1〜9・Warsongsは確認済み」は根拠の無いまま書いた過大表記で、trk114で訂正しています。照合状態はプレイリストごとに `js/catalog.js` の `LOL_CREATOR_SAFE` に持たせ、入手先ガイドの文言はそこから選びます（3つのLoL fixtureの `creatorSafe` と `check-repo` で一致・曲数・根拠を検査）。
- 曲別出典、範囲、権利上の未確認事項は [`LEAGUE-OF-LEGENDS-MUSIC.md`](LEAGUE-OF-LEGENDS-MUSIC.md) と `tools/leagueoflegends-*-tracklist.json` を参照。音源はカタログにも同梱しません。
- VALORANTカタログ（Championsアンセム6曲・エージェント関連曲3曲）は、VALORANT公式Creator-Safe Playlist（Spotify・全40曲を公式の埋め込み表示で確認）とRiot Games Creator-Safe Playlistのどちらにも見当たらない（trk117）。照合状態は `js/catalog.js` の `VAL_CREATOR_SAFE`（links-absent）、根拠は `tools/valorant-creator-safe.json`、台帳は [`VALORANT-MUSIC.md`](VALORANT-MUSIC.md)。入手先ガイドの文言は LoL と共通（`js/library.js` の `RIOT_GUIDE_KEYS`）。
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
4. **LoL外部ページ**：Season 4〜9・WarsongsのSoundCloudセット表示と、地域制限曲を含む人気曲リンクを実ブラウザで再確認する。曲別調査はLoL台帳を更新する。
   - trk116：Creator-Safe Playlistに見当たらなかった曲（Warsongs「Silver Scrapes」、Champion Theme「Smolder, the Fiery Fledgling」「Yunara, the Unbroken Faith」、Sessions: Diana「Oh Baby」）は、空さんの判断でSpotifyアプリでの追加確認をしない（2026-10-12）。状態は「見当たらない」のまま扱う。101曲目以降は第三者サイトsongdata.ioでの照合（方法と注意は台帳）。
5. **Endfield配信リンク**：Zeroth Directive OST 60曲＋バッチ2の6作81曲のSpotify個別曲ページ、各巻のffm.toスマートリンクと网易云音乐アルバムの表示・地域差を実ブラウザで再確認する。バッチ2は個別曲IDの抜取確認が6曲のみで、残り75曲のIDは未個別確認。バッチ2の中国語公式曲名・ffm.to告知リンク（Homecoming 以外）・VGMdb照合・他ストアの曲別URLは未確認のまま。Zeroth Vol.1 は 2026-10-11 に Apple Music 掲載を確認済み（Vol.2 のアルバム別URLは未照合）。未収録の公式リリース（Yi／Old Deep Water Dies／Sketches of Lost Heirlooms／A Promise Makes a Home 等）は台帳の「調査中の他の公式リリース」表に確認状況を記録済み。曲別調査はエンドフィールド台帳を更新する。
6. **🎼 手続き生成10曲の聴取確認**（trk113）：自動検査は「無音でもクリップでもない」こと（peak 0.62〜0.72・RMS 0.08〜0.29）と決定的生成しか確認していません。曲として聴けるか・不快なノイズや耳障りな音がないか・音量バランスは、`assets/trk-ost/index.html` で実際に聴いて確認する。採用曲を決めたら、trk's OST Vol.1 への組込み方（音源の権利表記・同梱可否）を別途決める。
7. Android Chrome／PCでService Workerのsafe・オフライン、MMD／VRM、IndexedDBを確認する。Node・shim検査は実機確認の代用ではありません。
8. **trk114の画面確認**：①自動リスト（例：LoLのSeason 3）を消して再起動しても戻らないこと、♻ボタンの件数表示と復元、trk's OST Vol.1を別フォルダへ動かして再起動しても戻らないこと。②英・中・韓のUIで入手先ガイド（タブの長押し）が各言語で出ること。③色が変わった16スキン（shadow・daylight・sakura・snowfield・garden・strawberry・melonberry・dawn・midnightsun・pastelloop・wagara・showacafe・cbLight・shojiLight・morningKitchen・mikuClassic）で、スキンの棚の見出しやリンクの色が見やすく、スキンの雰囲気を壊していないこと。ヘッドレスChromiumでは①②とcbLight・shojiLight・morningKitchenのaxe（4.61〜4.62:1）を確認済み。

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
| LoL・VALORANTのCreator-Safe照合状態 | `js/catalog.js`（`LOL_CREATOR_SAFE`・`VAL_CREATOR_SAFE`）、`js/library.js`（`RIOT_GUIDE_KEYS`）、`tools/leagueoflegends-*-tracklist.json`（各リストの `creatorSafe`）、`tools/valorant-creator-safe.json`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`docs/VALORANT-MUSIC.md` |
| 利用者向けMIDI・権利案内 | `docs/guide/touhou-midi.md`、`docs/guide/sound.md`、`docs/guide/en.md` |
| 🎓 OST手続き生成 | `tools/make-trk-ost.mjs`（出力は `assets/trk-ost/`・Git外。5ルール×2曲＝10曲のWAVスケッチ） |
| Endfield楽曲台帳・曲名fixture・検査 | `docs/ARKNIGHTS-ENDFIELD-MUSIC.md`、`tools/endfield-zeroth-directive-tracklist.json`、`tools/endfield-msr-albums-tracklist.json`、`tools/check-repo.mjs` |
| Service Worker | `sw.js`（現行cache名：`trk-v2026.10.12-trk117`） |
| 全体・安全検査 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs` |

## 6. 直近の検証

- trk117のVALORANT Creator-Safe照合（`check-repo.mjs` の🎯VALORANTほかの検査）：`tools/valorant-creator-safe.json` に記録した公式VALORANT Creator-Safe Playlistの40曲から、各リストの見つかった曲数・見当たらない曲を計算し直し、`VAL_CREATOR_SAFE` とシリーズ説明に一致することを確認。記録の1曲をカタログの曲名に変える、記録を39曲にする、見当たらない曲の順番を入れ替える、カタログ側の状態を変える、シリーズ説明の文言を変える、の5通りでFAILすることを確認済み。`tests/trk-playlists.test.mjs` で VALORANT の2リストが共通の文言（`plGuideRiotLinksAbsent`）になることも確認。ブラウザ確認（Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（30項目・リポジトリ外）で、LoL 12リストのガイドの鍵と4言語の表示に加え、📚すべての⚙→「🛒 公式カタログ」から VALORANT の2リストを実際に取り込み、入手先ガイドが `plGuideRiotLinksAbsent`（Creator-Safeガイドへのリンク付き）で表示されること、ページエラーが無いことを確認。
- trk116のLoL Creator-Safe照合（`check-repo.mjs` のLoLアルバム検査）：LoLの18リストすべてで、`LOL_CREATOR_SAFE` と3つのfixture（SoundCloudアルバム・公式リンク集・Sessions）の `creatorSafe` が一致し、曲数・見当たらない曲（`notFound` はそのリストの曲名だけ）・根拠（embed／mirror）が矛盾しないことを確認。見当たらない曲の名前の取り違え、見当たらない状態なのに曲数1、K/DAの照合記録の削除、Dianaの曲数の食い違い、カタログ側の状態の食い違い、シリーズ説明の曲数の変更、廃止したSessions文言の復活、見当たらない状態を一部の文言に取り違えの8通りでFAILすることを確認済み。照合（songdata.io の51〜977行目の転記と曲名の突き合わせ）はリポジトリ外の作業メモで行い、結果をfixtureと台帳に記録した。ブラウザ確認（Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（22項目・リポジトリ外）で、LoL 12リストのガイドの鍵（Season・Sessions・公式リンク集・人気曲）、タブ帯の⚙→プレイリスト設定の「📄 入手先」が ja/en/zh/ko で切り替わること、trk115までに保存された廃止鍵（`plGuideLolSessions`）のガイドは保存した控えを表示し、起動時の更新で verified の鍵と文言に置き換わること、ページエラーが無いことを確認。
- trk115のLoL Creator-Safe照合（`check-repo.mjs` のLoLアルバム検査）：Season 1〜9＝verified・Warsongs＝partial（10/11、未照合は「Silver Scrapes」）が `LOL_CREATOR_SAFE` とfixtureで一致し、照合済みの各アルバムが根拠（embed／mirror）を持ち、mirror の記録（songdata.io・確認日）があることを確認。根拠の削除・mirror URLの改変・Warsongsの未照合曲の取り違え・カタログ側の状態の食い違い・シリーズ説明の文言欠落・likely文言の復活・partial文言の過大表現の7通りでFAILすることを確認済み。照合そのもの（51〜300番目の転記と区画ごとの突き合わせ）はリポジトリ外の作業メモで行い、結果をfixtureと台帳に記録した。ブラウザ確認（Chromium 153 headless・リポジトリ外の `puppeteer-core`）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（17項目・リポジトリ外）で、自動作成されたLoLリストのガイドの鍵（Season 1〜9＝verified・Warsongs＝partial）、タブ帯の⚙→プレイリスト設定の「📄 入手先」が ja/en/zh/ko で切り替わること、trk114までに保存された廃止鍵（`plGuideLolCsLikely`）のガイドは保存した控えを表示し、起動時の更新で verified の鍵と文言に置き換わること、ページエラーが無いことを確認。
- `npm run check`：成功。Static 0 failure／0 warning、`node:test` **218/218**（trk114で16件追加：MIDIの処理量・中止・進み具合、削除の印・OSTの移動・ガイドの言語、入れ子の欄のアクセント文字色）。リポジトリ、Security、a11y、vendor、MMD、Study Room、lite-mode検査を含む。
- trk114のブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。`tools/smoke-game-end.mjs` PASS。加えて一時スクリプトで23項目（ガイドの鍵と英語表示、削除→再起動で戻らない→♻で復元、移したOSTが戻らない、3スキンのaxe、MIDIの `midiLoaded`／`midiTooDense`、ページエラー0）を確認。半透明カードのスキンはaxeが「判定不能」になるため、16スキンの数値はNodeの計算（`tests/skin-contrast.test.mjs`）で確認。
- trk114のMIDI計測（開発コンテナのNode、`studio_gm`）：4和音・3分（2,880音）は7.9秒→3.3秒、合成した密な3分の曲（平均約37音）は36.3秒→21.3秒。4和音・9分半は8,650万（旧上限8,000万で拒否→可）、密な4分は1.96億（可）、密な5分は2.46億（不可）。実際の東方MIDIでは未計測（§4-1）。
- Endfield Zeroth Directiveカタログ検査（`check-repo.mjs`🛰️ブロック）：Vol.1 37曲＋Vol.2 23曲の順序・公式Spotify個別曲リンク・中国語別名・ffm.toガイド・既存取り込みの安全更新を確認。
- Endfield Metal Scar Radioアルバム検査（`check-repo.mjs`🛰️バッチ2ブロック）：6作81曲（5+9+17+4+30+16）の順序・一意な公式Spotify個別曲リンク・照合別名なし・公式SpotifyアルバムのsourceUrl・権利表記・`trk-endfield` 配下への6プレイリスト自動作成を確認。曲名を1つ壊すとFAILすることを確認済み（改変検知の動作確認）。
- 🎼 手続き生成（`tools/make-trk-ost.mjs`）：10曲すべて生成でき、WAVの peak 0.62〜0.72・RMS 0.08〜0.29（無音でもクリップでもない）。打楽器ノイズとMLPサンプリングをシード済みPRNG化したため **2回生成して全ファイルのmd5一致**を確認（決定的ビルド）。**実際に聴いての良否は未確認**（§4-6）。
- `git diff --check`：成功。
- 自動検査でローカル参照・構文・Stageの幾何・選曲画面のoverflowを確認。新しいMIDIの音質、通常ブラウザ上での聞こえ方、実機操作はまだ確認していません。Endfieldの配信リンク（Spotify・ffm.to・网易云音乐）の実ブラウザ表示も未確認です（§4-5）。バッチ2の曲順・曲名・アーティストは 2026-10-11 に公式Spotifyのアルバム埋め込みページで6作すべてを再確認し、Homecoming は公式ffm.toスマートリンクでも照合しましたが、個別曲IDの全数確認と実ブラウザ確認は未実施です。

## 7. 最近の変更

- **trk117（2026-10-12）**：VALORANTのリストもCreator-Safeと照合。VALORANT公式Creator-Safe Playlist（Spotify）の全40曲を公式の埋め込み表示で読み（`tools/valorant-creator-safe.json` に記録）、LoLで読んだRiot Games Creator-Safe Playlistの977行とも照らした結果、Championsアンセム6曲・エージェント関連曲3曲はどちらにも見当たらない（`VAL_CREATOR_SAFE`＝links-absent）。公式リンク集の文言を LoL と共通の `plGuideRiotLinksPartial`／`plGuideRiotLinksAbsent` に改名し（特定のゲーム名を含まない文言に）、`LOL_GUIDE_KEYS` を `RIOT_GUIDE_KEYS` に。台帳 `docs/VALORANT-MUSIC.md` を新設。LoLで見当たらなかった4曲は、空さんの判断で追加確認をしない。ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk117`）を更新。
- **trk116（2026-10-12）**：LoLの残りのリストもRiot公式Creator-Safe Playlistと照合。songdata.io が表示する全977行（公式979曲。出ない2曲は701〜750番目）を読み、Sessions: Vi・Star Guardian Taliyahは全曲（verified）、Sessions: Dianaは42/43（「Oh Baby」が見当たらない）、Champion Themeは39/41（Smolder・Yunara）、Worlds/WCSアンセムは「Worlds Collide」（2015）だけ、人気曲は7/30、MSIアンセムとK/DAは見当たらない。Warsongs「Silver Scrapes」も全行に無かった。状態に links-partial／links-absent を足し（公式リンク集の文言 `plGuideLolLinksPartial`／`plGuideLolLinksAbsent` を4言語で追加）、Playlistと未照合だった sessions 状態とその文言を廃止。一部の文言は「残りはPlaylistに見当たらない・要確認」、人気曲は「一部だけ対象、共同制作曲などは対象外・要確認」に。`notYetMatched` を `notFound` に改め、公式リンク集・Sessionsのfixtureにも `creatorSafe` を追加し、`check-repo` で18リストを検査（8通りの改変でFAILを確認）。台帳・ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk116`）を更新。
- **trk115（2026-10-12）**：LoLのCreator-Safe照合を101曲目以降へ広げた。公式の埋め込み表示は先頭100曲までなので、プレイリスト全体を表示する第三者サイトsongdata.ioで51〜300番目を読み、Season 7の残り7曲・Season 1〜6の全136曲・Warsongs 10曲を照合（51〜100番目は公式の埋め込みと完全一致することを確認）。Season 1〜9を照合済み（verified）、Warsongsを一部照合済み（partial・10/11、「Silver Scrapes」は未照合）にし、推測で「可能性が高い」とした likely 状態と文言（4言語）を廃止。partialの文言は「一部の曲は対象（照合済み）、残りは未照合・要確認」に変更。fixtureに根拠（embed／mirror）と第三者サイトの記録、公式SoundCloudのCreator-Safe Playlist Pt. I／IIを追加し、`check-repo` で一致・曲数・根拠を検査（7通りの改変でFAILを確認）。台帳・ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk115`）を更新。
- **trk114以前**：trk114（再レビュー対応：LoL Creator-Safe表示の訂正・MIDI処理量・削除の印ほか）・trk113（trk's OST用の手続き作曲スクリプト）・trk112（タブ挙動・デモ曲のOST移設）・trk111は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)。Endfield初号指令OST、Touhouローカル曲名カタログと24種のコード生成MIDI音色・TRK MIDI MIX（trk109）、LoLカタログ、音源ジャケット、TV、譜面生成、名前空間等の作業履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) と各設計資料を参照。

## 8. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、既定値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・データ・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff と `sw.js` cache名を確認した。
- [ ] 日本語ガイドを変更した場合、英語ガイドの対応箇所も更新した。
