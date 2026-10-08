# League of Legends 公式楽曲カタログ — 調査・実装台帳

最終確認：**2026-10-08（日本時間）**

## 方針

「全公式楽曲」はチャンピオン約180体のテーマだけでなく、旧ログインテーマ、スキン／イベント曲、競技アンセム、ゲーム内OST、仮想アーティストや Arcane の関連楽曲まで含む大きな範囲です。単一の一覧へ急いで混ぜず、**公式の個別配信先・分類・確認状況を分けて段階収録**します。存在を確認できないチャンピオン曲は作りません。未検索・未確認を「存在しない」とは扱いません。

アプリへ入れるのは曲名・アーティスト・アルバム名と**公式配信／公開へのリンクだけ**です。音源ファイルは同梱しません。カタログのリンクや購入・サブスクリプションは、二次利用許諾の代わりになりません。

## 実装済みの範囲（Phase 1）

| 分類 | 収録内容 | 状態 |
|---|---|---|
| Sessions | Vi 36曲、Diana 43曲、Star Guardian Taliyah 29曲。計108曲 | Riotの公式Creator-Safe Sessions三作。公式SoundCloudアルバムと公式Spotify個別曲ページへリンク。既存収録・安全な更新は維持 |
| Champion Themes | 公式単曲テーマ41曲（2019–2026年、2020年代中心。Lockeまで） | Riot公式Champion Theme記事とLeague of Legends公式YouTube個別投稿を照合。**全チャンピオンを網羅する一覧ではない** |
| Worlds / WCS | 2014–2025年の公式アンセム12曲＋2026年の発表曲1曲 | 2014–2025はLeague of Legends公式YouTube動画。2026年は発表時点の公式LoL Esports記事のみで、個別の再生先は未確認 |
| MSI | 2019、2021、2022、2023年の確認済みアンセム4曲 | Riot／League of Legends公式公開先へリンク。未確認年にアンセムが存在しないとは結論しない |

2026 Worlds「Know My Name」（True Damage）は公式発表済み。発表は **2026-10-08 18:00 PDT** の公開予定で、日本時間では **2026-10-09 10:00 JST**。この調査時点では音源・公式ミュージックビデオの個別再生先をまだ確認できなかったため、アプリのリンクは告知記事を指し、アルバム欄にも「発表済・公式音源リンク待ち」と表示します。公開後に公式動画／配信先を確認し、告知リンクと置き換えます。

### Phase 1 のデータと検査

- 実装：`js/catalog.js` の `lol-champion-themes`、`lol-worlds-anthems`、`lol-msi-anthems`。
- 検査データ：`tools/leagueoflegends-music-tracklist.json`。
- Sessions の既存データ：`tools/leagueoflegends-sessions-tracklist.json`。
- 回帰検査：`tools/check-repo.mjs`。カタログ順・曲名／アーティスト／アルバム／URL、公式ホスト形式、収録数、未公開の2026年項目、権利注意書き、安全なwish更新を検査します。
- `js/library.js` は LoL 公式リストの wish とガイドだけを更新し、既存の所持曲・利用者が変更した名前／アイコン／タグは保持します。Sessions以外の新規リストにも「配信・購入は二次利用許諾ではない」旨のガイドを付けます。

## 未収録・次段階

1. **旧Champion Theme／旧ログインテーマ**：2010年代の公開先・地域版・アルバム収録を照合し、個別の曲名と公式配信先が確認できたものから追加。曲が存在しないチャンピオンへテーマを割り当てない。
2. **チャンピオン関連の歌／バーチャルアーティスト**：K/DA、True Damage、HEARTSTEEL、Pentakill などをChampion Themeと混ぜず、プロジェクト／イベント別に収録。
3. **Skin Theme／イベント曲**：Riot公式Musicタグの「Skin Theme」「Event Theme」や、季節イベント・ゲームモードの公式公開曲を別リストにする。現時点で候補を見つけても、分類・公式個別リンクを確認するまでは未収録。
4. **ゲームOST／映像OST**：公式MusicタグやRiot公式アーティストのアルバムを、収録順・重複・ゲーム内曲／映像曲の区別とともにアルバム別に照合。
5. **競技テーマ／イベント用オーケストラ曲**：Worlds／MSIの歌唱アンセムと分け、年ごとの公式投稿が特定できたものだけ収録。
6. **MSIの未確定年・その他イベント**：候補曲を調査継続。検索で見つからなかった年を「曲なし」と断定しない。

公式MusicタグにはChampion Theme以外にも Skin Theme、イベント／ゲームOSTや仮想アーティストの曲が掲載されています。したがって、Phase 1 の41曲やWorlds/MSIのリストを「LoL全楽曲」と呼びません。

## 権利・利用条件（重要）

- Riotの[Creator-Safeガイドライン](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)は、RiotがCreator-Safeとして指定する**特定のプレイリスト内の曲**と利用条件を基準にしています。Riot自身の説明でも、外部アーティスト／出版社／レーベル等との共同制作曲には複雑な権利関係があり、Creator-Safeプレイリスト外の曲は一般に権利者のライセンスが必要で、配信・動画での利用が安全とは保証されないとされています。
- Worlds／MSIアンセムは外部アーティストとの共同制作を含むため、公式YouTube／Spotify／SoundCloudで聴けることを**再利用の許可**と見なしません。創作動画・配信等に使う場合は、曲が現在のCreator-Safeリストに含まれるか、必要な権利者の許諾があるかを曲ごとに確認してください。企業広告・販売・音源再配布などは別条件です。
- SessionsはCreator-Safe Sessionsとして提供された範囲で案内し、Riotの現行ガイドラインとクレジット／利用条件に従う前提です。Creator-Safeであることも、音源そのものの再配布を許す意味ではありません。
- 本アプリは公式リンクを開くための索引です。音源をダウンロード・同梱・再配布せず、リンク先の内容・地域利用可否・権利状態も保証しません。利用直前に公式ガイドと該当曲の権利情報を確認してください。

## 参照先

- [Riot Games — Creator-Safe Guidelines](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)
- [League of Legends — Champion Theme の公式記事一覧](https://www.leagueoflegends.com/en-us/news/tags/champion-theme/)
- [League of Legends — Music の公式記事一覧](https://www.leagueoflegends.com/en-us/news/tags/music/)
- [League of Legends — 公式YouTubeチャンネル](https://www.youtube.com/@leagueoflegends)（Champion Theme個別投稿を確認。例：[Locke, the Ashen Exorcist](https://www.youtube.com/watch?v=nakzw9Y_CLI)、2026-06-26公開）
- [League of Legends — 公式Spotifyアーティスト](https://open.spotify.com/artist/47mIJdHORyRerp4os813jD)
- [League of Legends — 公式SoundCloudプロフィール](https://soundcloud.com/leagueoflegends)
- [LoL Esports — Worlds 2026 Anthem Presented by True Damage](https://lolesports.com/en-US/news/worlds-anthem-presented-by-true-damage)

Spotifyのユーザー作成プレイリストや第三者の動画は発見用の手がかりに限り、公式公開元の根拠にはしません。収録時は公式アーティスト／公式チャンネル／公式記事への個別リンクを優先します。
