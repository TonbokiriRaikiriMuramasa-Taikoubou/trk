# アークナイツ：エンドフィールド 公式楽曲カタログ — 調査・実装台帳

最終確認：**2026-10-10（UTC）**

## 方針

アプリへ入れるのは曲名・アーティスト・アルバム名（事実情報）と**公式配信／公開へのリンクだけ**です。音源ファイルは同梱しません。カタログのリンクや購入・サブスクリプションは、二次利用許諾の代わりになりません。曲順・曲数・曲名・アーティスト表記は公式Spotifyアルバムページを正とし、中国語公式曲名と作曲クレジットはVGMdbアルバムページ（出典表記はMETAL SCAR RADIO／上海鹰角网络科技有限公司）と公式ffm.toスマートリンクで照合しました。確認できない曲は作りません。未検索・未確認を「存在しない」とは扱いません。

## 権利者と公式レーベル

- 楽曲の著作権・原盤権は **©/℗ 2026 GRYPHLINE**（公式Spotifyアルバムページの表示）。VGMdbでは Publisher / Phonographic Copyright を **Hypergryph（上海鹰角网络科技有限公司 / Shanghai Hypergryph Network Technology Co., Ltd.）** と表記。日本の窓口は GRYPH FRONTIER PTE. LTD.（二次創作ガイドライン制定者）。
- レーベル名義は **Metal Scar Radio（鐵痕電台 / 铁痕电台）**。無印アークナイツの Monster-Siren Records（塞壬唱片）と同じ Hypergryph 運営の Arknights: Endfield 公式音楽レーベルです。Monster-Siren には実在の公式サイト（monster-siren.hypergryph.com）がありますが、Metal Scar Radio は作中世界の「非合法ラジオ局」という設定で、**曲単位の公式サイトは存在しません**。そのため公式の入手先は各種サブスク配信（Spotify等）と公式YouTubeになります。
- Spotifyアーティストページ： https://open.spotify.com/artist/63CsKCn2OazatczRm1tk9c
- 作曲クレジット（両巻）：Gareth Coker、Hybrid（Mike Truman / Lottie Truman）、Kirara Magic、VISION SOUND、Salty Salt、原田萌喜、Alec Justice、Cody Matthew Johnson、MeLo_绿萝组、Robert Wolf、SKa2or、MSR Studio、BLACK 0、Aurora Sky（歌唱）。マスタリングは Abbey Road（Christian Wright）ほか。

## 初号指令OST（Zeroth Directive）の公式配信先

公式告知（アークナイツ：エンドフィールド日本公式X、2026-02-03）： https://x.com/AKEndfieldJP/status/2022928866638205084
**2026-02-15 から Spotify、YouTube、Amazon Music 等で配信開始**。告知内の ffm.to スマートリンクが公式の「配信一覧」です。

| 巻 | 公式告知の配信一覧（ffm.to） | Spotifyアルバム | YouTube Music | Amazon Music | 网易云音乐 | その他 |
|---|---|---|---|---|---|---|
| Vol.1（初号指令OST 上 / 零号委托OST（上））37曲・113:54 | https://ffm.to/ro6qjnl | [5qK87ACnKVHYKUWozTtXOA](https://open.spotify.com/album/5qK87ACnKVHYKUWozTtXOA) | [OLAK5uy_ksgKvvAzjasGo9AHgxKpEOtPPAuqFP0R4](https://music.youtube.com/playlist?list=OLAK5uy_ksgKvvAzjasGo9AHgxKpEOtPPAuqFP0R4) | [B0GN36WMS8](https://music.amazon.com/albums/B0GN36WMS8) | [361952900](https://music.163.com/#/album?id=361952900) | — |
| Vol.2（初号指令OST 下 / 零号委托OST（下））23曲・70:52 | https://ffm.to/eq8xpy7 | [4msN2gQVhoyeSNxH5fp6RW](https://open.spotify.com/album/4msN2gQVhoyeSNxH5fp6RW) | [OLAK5uy_lTVj4U8HrYsSidSEgzrTsC7AHCIoao3mE](https://music.youtube.com/playlist?list=OLAK5uy_lTVj4U8HrYsSidSEgzrTsC7AHCIoao3mE) | [B0GN36HRI9](https://music.amazon.com/albums/B0GN36HRI9) | [361958075](https://music.163.com/#/album?id=361958075) | [Deezer](https://www.deezer.com/album/917391741)・[Qobuz](https://play.qobuz.com/album/okt4htf3bnn16) |

- 資料用ページ（公式ではない）：VGMdb [Vol.1](https://vgmdb.net/album/157312) / [Vol.2](https://vgmdb.net/album/157313)
- **Apple Music 掲載は 2026-10-10 時点で確認できませんでした**（公式告知の配信サービス名とffm.toの表示範囲にApple Musicがない）。これは「配信されていない」証明ではありません。

## 収録したプレイリスト（js/catalog.js・シリーズ `endfield`）

| プレイリスト（ID・表示名） | 内容 | 曲数 | 曲別リンク | 巻のリンク（sourceUrl） |
|---|---|---|---|---|
| `ef-firstorder`「Endfield — Zeroth Directive OST Vol.1（初号指令・上）」 | 初号指令OST（上）＝Zeroth Directive Vol.1 全曲を公式収録順で | 37 | 公式Spotify個別曲 | 公式ffm.to配信一覧 |
| `ef-firstorder2`「Endfield — Zeroth Directive OST Vol.2（初号指令・下）」 | 初号指令OST（下）＝Zeroth Directive Vol.2 全曲を公式収録順で | 23 | 公式Spotify個別曲 | 公式ffm.to配信一覧 |

- 旧版の「初号指令 OST」プレイリスト（上・下それぞれ Part 1/2 の4項目紹介版）は、**永続ID `ef-firstorder` を保ったまま Vol.1 全37曲版へ更新**します。既存の取り込みは wish・ガイドと旧既定名／タグだけが更新され、所持曲・ユーザーが変えた名前／アイコン／タグはそのままです（`js/library.js` のセーフリフレッシュ、検査は `tools/check-repo.mjs`）。
- 中国語公式曲名（例：`协议流`＝Protocol Flow）は**照合別名（matchAliases）**として登録。中国語ファイル名の手元音源も曲名照合できます。表示曲名は公式英語名です。
- キャラクターOST等の既存プレイリスト（`ef-blurring`・`ef-ashen`・`ef-floaty`・`ef-makers`・`ef-signal`）の内容は変更していません。
- データの正： [`tools/endfield-zeroth-directive-tracklist.json`](../tools/endfield-zeroth-directive-tracklist.json)

### Tracklist — Vol.1（初号指令OST 上 / 零号委托OST（上））

| # | 曲名 | 中国語公式曲名 | アーティスト（公式Spotify表記） | Spotify |
|---|---|---|---|---|
| 01 | Protocol Flow | 协议流 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/0NOD8FVBXkLbmrJSYCS3Aq) |
| 02 | Initial Process | 最初进程 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/57d9mK6RV0bizpXK1Qn8Pr) |
| 03 | Shape of the Tower | 塔之形 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/3QAvUY8zexlNtAOls3Cfwk) |
| 04 | Protocolized Resonance | 协议化轰鸣 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/225SxJEm6YYWkhFbqdKKZ0) |
| 05 | Existence | 本有 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/1Sx7W1yEghAW8Oa4Nc2CNT) |
| 06 | Defying Stillness | 否定沉寂 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/0tRjyNRuNZBe4vewMfBbMR) |
| 07 | Cosmic Observer | 寰宇观者 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/44IGAtL6UxB13zhby5jzeE) |
| 08 | Downpour | 降之雨流 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/5HS3n0elShzZKDSC6F8CBq) |
| 09 | Promotion Structure | 进阶构成 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/4AjuUlEkp4BYisV9mTo2z3) |
| 10 | Edge/Mechanics | 锋刃/机械 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/4dNsfN1Hy3GTsGd2RxeQbE) |
| 11 | Nexus Event | 中枢现象 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/34yq954sCweaNmXSjugQ8t) |
| 12 | Soils of Life | 生之泥壤 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/4j47ihnA2y30qt2Laus5gW) |
| 13 | Fort in the Acid Fog | 雾蚀要塞 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/4AFefMOgOfQYfX8edlMSPU) |
| 14 | Guns/Steel | 铳/钢铁 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/2zEEwI0uFuOCofZUTfExyY) |
| 15 | Outpost Shaping I | 据点塑成I | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/07n4CfyBw4SrNhfFycIiAx) |
| 16 | Outpost Shaping II | 据点塑成II | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/2Eokhj679zoVAqywFykWpq) |
| 17 | Outpost Shaping III | 据点塑成III | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/5AwJQcr0cYLPzo3TKPddQH) |
| 18 | Outpost Shaping IV | 据点塑成IV | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/1Xn5iOdiiYIwOuF3PrixJH) |
| 19 | Imprisoned Below | 地牢囚者 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/2WfrnGt27WNGaOpxyOl7VS) |
| 20 | Hazefyre | 雾火 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/3O0GfLIt03pB8ub8sbqx5R) |
| 21 | The Bonekrushing Fist | 碾骨之拳 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/0tsG3JQ064n0TLwRNRXRf6) |
| 22 | Echoes in Ore | 岩石密语 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/7yHbrlVnFiWmdnBbErgNGl) |
| 23 | Evacuation 373 | 373号撤离 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/5whDfg415m9xBRjhRKqY36) |
| 24 | The Planter's Trace | 种植者留痕 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/4WDzT25chfGRaKb5VlKFUS) |
| 25 | Originium Science Park | 源石研究园 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/1oVsPq1xRPr77WDMdWnGqV) |
| 26 | Journey to the Vein | 行向矿脉 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/3VSuE9MC9qyFvbygrtQDUS) |
| 27 | Surviving Mining | 矿业余生 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/0WKf9g8biP06EHSaSoP9cM) |
| 28 | Arts/Blood | 法术/血液 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/7MCy2nFsCJSaXzgK1mhxgy) |
| 29 | Lodespring Corner | 源区一隅 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/2TRQdwBHPAaTnf4zFmXAqZ) |
| 30 | Ankhor! Ankhor! Ankhor! | 锚点！锚点！锚点！ | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/3ENwa03847OrFuy1gaoPmn) |
| 31 | Triaggelos: Remaining | 三位一体：亡骸 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/3PuUBlKn2Z35eVQWDwJ408) |
| 32 | Triaggelos: Being | 三位一体：造物 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/2At7k5s0O9UJWtFAb3Aw8M) |
| 33 | Triaggelos: Obscurity | 三位一体：晦暗 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/7A3DxC1kgjLzfcaa3l6ANr) |
| 34 | Sinking Rays | 光线沉降 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/27F6i9A5wxNBfiP2FK9ZL5) |
| 35 | Marble Aggelomoirai | 白垩界卫 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/6a6L23E4lQGFhqmGJn55gY) |
| 36 | Joyous Now | 庆乐此时 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/1nwA4ElX1TOCCli3Hnornh) |
| 37 | Faith's Imprint | 信念拓印 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/15gTGxr577tNJ2gZZXTfAG) |

### Tracklist — Vol.2（初号指令OST 下 / 零号委托OST（下））

| # | 曲名 | 中国語公式曲名 | アーティスト（公式Spotify表記） | Spotify |
|---|---|---|---|---|
| 01 | Wisdom of the Landscape | 知山水 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/3Rg8XrRfqzePhy3cgoupOu) |
| 02 | To Walk, To Cross | 行渡 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/62nDuLgX0MvZVf2Jrz2cuX) |
| 03 | Misty Grove | 雾篁 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/0DOftQ7ORTVmYq7TdYQALA) |
| 04 | The Settling Gaze | 沉降视线 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/0QPrEnH64GC7JcCYF0rmhV) |
| 05 | Marching Onwards | 武装继进 | Metal Scar Radio, Hybrid | [track](https://open.spotify.com/track/6P14Kt3awMRXeJ8ZpZ3drF) |
| 06 | Pools in the Ice Cave | 寒窟聚水 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/7BVpNwdNqdjS3p1RkdUGJg) |
| 07 | Jingyu at Daybreak | 景玉朝明 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/0ooLLIYdk5PokE3NvPfGq0) |
| 08 | Jingyu at Eventide | 景玉夕时 | Metal Scar Radio, Gareth Coker | [track](https://open.spotify.com/track/1LLqtSJcxZo3H4IG7WDODX) |
| 09 | Blossoms Bring an Old Friend | 春景故人来 | Metal Scar Radio, Kirara Magic | [track](https://open.spotify.com/track/72Mt1lphOXDWakRctULOAW) |
| 10 | The Great Tide | 大潮升 | Metal Scar Radio, VISION SOUND, Salty Salt | [track](https://open.spotify.com/track/5nYYWzAu9FSRiZfIGAwKmP) |
| 11 | Watching the Ling Waters | 观陵水 | Metal Scar Radio, 原田萌喜, Alec Justice, Cody Matthew Johnson, Aurora Sky | [track](https://open.spotify.com/track/1g3VBk3XzZLny7PXxtHEQY) |
| 12 | Fangxing | 方兴 | Metal Scar Radio, VISION SOUND, Salty Salt | [track](https://open.spotify.com/track/4oSRLPUPLrHcDooZc2oOdx) |
| 13 | Strings of Hue | 戏彩绳 | Metal Scar Radio, VISION SOUND, Salty Salt | [track](https://open.spotify.com/track/4JlHjfYQ3S5uYFwVwdHtTw) |
| 14 | A Day for Ourselves | 寻暇日 | Metal Scar Radio, MeLo_绿萝组 | [track](https://open.spotify.com/track/6gOwtSP1ul3w7uN84KWksh) |
| 15 | By the Solemn Glow | 孤案灯青 | Metal Scar Radio, MSR Studio, BLACK 0, Aurora Sky | [track](https://open.spotify.com/track/6yEVLr9xHTeAk3sxPV6l22) |
| 16 | Peace Under a Vast Sky | 万里升平 | Metal Scar Radio, MeLo_绿萝组 | [track](https://open.spotify.com/track/68yAQasLeIi4VaWGz0l0oh) |
| 17 | Charged by Verdant Tubes | 青简注我 | Metal Scar Radio, Kirara Magic | [track](https://open.spotify.com/track/0g7dFkfwlkZ1UhzQqzbGeC) |
| 18 | Crimson in the Crag | 山樆轻 | Metal Scar Radio, MSR Studio | [track](https://open.spotify.com/track/7IU7nfBAqKDYV2u6ZlHT7E) |
| 19 | When the Spring Rite Arrives | 来时新社 | Metal Scar Radio, VISION SOUND, Salty Salt | [track](https://open.spotify.com/track/2x8rSsHHA6BLMYLLvNCsCJ) |
| 20 | Of Grace and Gentle Might | 穆如清风 | Metal Scar Radio, MeLo_绿萝组 | [track](https://open.spotify.com/track/3nT3EmeiixysEpL1Lnn2LK) |
| 21 | The Wind of Rupture | 不周风 | Metal Scar Radio, VISION SOUND, Salty Salt | [track](https://open.spotify.com/track/3OZxJyMH1A5HrrpdPTlyph) |
| 22 | New Foundation | 新壤 | Metal Scar Radio, Robert Wolf | [track](https://open.spotify.com/track/54MxCLBrmnKfzS2zYCcNbZ) |
| 23 | Forge | 洪炉 | Metal Scar Radio, SKa2or | [track](https://open.spotify.com/track/3TKJkruK3HMHG25SwptRxi) |

## 権利・利用条件（重要）

- **『アークナイツ：エンドフィールド』二次創作ガイドライン**（GRYPH FRONTIER PTE. LTD.、2026-02-03制定・2026-08-24改訂）： https://endfield.gryphline.com/ja-jp/news/4497
  - 対象は個人または法人格のない団体による**非営利目的**・**日本国内での発表・流通**に限定。範囲を超える利用は事前問い合わせ（endfield_cs@gryphline.com）。
  - プレイ動画・実況配信・関連動画の投稿は、収益化の有無や所属を問わず、**（1）禁止事項に抵触しないこと、（2）作品の内容紹介およびプレイの共有を主目的とすること**を満たせば事前連絡なしで可。
  - 禁止事項に「**当社の公式素材をそのまま複製・抽出するなど、創作性が著しく乏しいもの**」があり、OST音源そのものの複製・抽出・転載は二次創作として認められる範囲に含まれません。2026-08-24改訂で硬質立体造形物（フィギュア・ガレージキット・3Dプリント等）とその製作データも明確に禁止されました。
  - ガイドラインは予告なく変更される場合があります。最新版は公式サイトで確認してください。
- trk! は曲名などの事実情報と公式配信先リンクのみを表示し、**音源を同梱・再配布しません**。配信・購入・サブスクリプションは二次利用許諾ではありません。
- ゲームプレイ動画にゲーム内BGMが含まれる場合の自動コンテンツ識別（クレーム）運用までは個別検証していません。ガイドラインの配信条件を満たす利用と、音源単体の再利用は分けて考えてください。

## 未確認・次段階

- 60曲のSpotify個別曲URLは 2026-10-10 時点の公式アルバムページHTMLで確認しましたが、実ブラウザでの一括再確認（地域制限・ログイン要求の有無）は未実施です。
- Apple Music でのアルバム掲載は未確認（「配信なし」の断定ではありません）。
- Metal Scar Radio の他の公式アルバム（Spotifyアーティストページで確認できる Eve of Departure、Homecoming、Dreamscape of Wind and Snow、Contingency Contract: Re-Ignition、At the Wake of Spring、Fragmented Dreams、Thunder's Legacy、Mirairo Rider、Qingbo! Oh My Life、Snapshot、Blurring、Lollipop Neo-nista 等）は**今後の調査対象**です。既存の `ef-blurring` 等は紹介版のままです。
- 中国語版・英語版の二次創作ガイドラインは未精読。この台帳は日本語版ガイドライン（2026-08-24改訂版）を正とします。

## 参照先

- データ（正）： [`tools/endfield-zeroth-directive-tracklist.json`](../tools/endfield-zeroth-directive-tracklist.json)
- カタログ実装： `js/catalog.js`（シリーズ `endfield`）、取り込み・更新： `js/library.js`
- 検査： `tools/check-repo.mjs`（🛰️ Endfield Zeroth Directive ブロック）
- 公式告知（日本）： https://x.com/AKEndfieldJP/status/2022928866638205084
- 公式配信一覧： https://ffm.to/ro6qjnl （Vol.1） / https://ffm.to/eq8xpy7 （Vol.2）
- 資料： VGMdb https://vgmdb.net/album/157312 / https://vgmdb.net/album/157313
