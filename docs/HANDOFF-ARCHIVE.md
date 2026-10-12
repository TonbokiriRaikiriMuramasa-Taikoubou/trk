# trk! 開発履歴アーカイブ（HANDOFF「最近の変更」の旧記録）

> `docs/HANDOFF.md` から移したtrk70〜trk122の履歴と、trk114〜118の検証記録です（trk123以降の検証は HANDOFF §6）。現在の状態・未確認事項は [`HANDOFF.md`](HANDOFF.md) を正とします。新しい変更は同ファイルの「最近の変更」に短く記録し、詳細履歴が増えたら本書へ移します。

## trk114〜118 の検証記録（trk118のマージ前に HANDOFF §6 から移動）

- trk118のCreator-Safeリスト検査（`check-repo.mjs` の🛡️ブロック）：新しい12リスト・539曲の全曲が、記録したSpotifyトラックIDの曲名・アーティストと一致し（各100曲以下・重複なし・公式プレイリストが出典）、記録した927行のすべてが LoL・VALORANT・Riot Games のどれかのリストにあることを確認。曲名の書き換え、Riot Gamesリストの状態の変更、記録に無いトラックID、どのリストにも無い行、の4通りでFAILすることを確認済み。自動作成のtrkリストは65（上限100）。トラックIDは、VALORANTの36件が別の一覧と1件ずつ一致し、3件を公式のSpotify埋め込み表示で開いて確認。ブラウザ確認（Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（41項目・リポジトリ外）で、LoLの新しい4リストが自動作成され（29／53／17／59曲・`plGuideRiotLinksVerified`・入手先は公式プレイリスト）、🛒公式カタログから「VALORANT Creator-Safe」（39曲）・「2XKO」（45曲）・「Ruined King」（60曲）を取り込むと全曲Creator-Safeの文言になり、Riot Gamesのリストは専用フォルダに入ること、既存のLoL・VALORANTの表示とページエラーが無いことを確認。
- trk117のVALORANT Creator-Safe照合（`check-repo.mjs` の🎯VALORANTほかの検査）：`tools/valorant-creator-safe.json` に記録した公式VALORANT Creator-Safe Playlistの40曲から、各リストの見つかった曲数・見当たらない曲を計算し直し、`VAL_CREATOR_SAFE` とシリーズ説明に一致することを確認。記録の1曲をカタログの曲名に変える、記録を39曲にする、見当たらない曲の順番を入れ替える、カタログ側の状態を変える、シリーズ説明の文言を変える、の5通りでFAILすることを確認済み。`tests/trk-playlists.test.mjs` で VALORANT の2リストが共通の文言（`plGuideRiotLinksAbsent`）になることも確認。ブラウザ確認（Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（30項目・リポジトリ外）で、LoL 12リストのガイドの鍵と4言語の表示に加え、📚すべての⚙→「🛒 公式カタログ」から VALORANT の2リストを実際に取り込み、入手先ガイドが `plGuideRiotLinksAbsent`（Creator-Safeガイドへのリンク付き）で表示されること、ページエラーが無いことを確認。
- trk116のLoL Creator-Safe照合（`check-repo.mjs` のLoLアルバム検査）：LoLの18リストすべてで、`LOL_CREATOR_SAFE` と3つのfixture（SoundCloudアルバム・公式リンク集・Sessions）の `creatorSafe` が一致し、曲数・見当たらない曲（`notFound` はそのリストの曲名だけ）・根拠（embed／mirror）が矛盾しないことを確認。見当たらない曲の名前の取り違え、見当たらない状態なのに曲数1、K/DAの照合記録の削除、Dianaの曲数の食い違い、カタログ側の状態の食い違い、シリーズ説明の曲数の変更、廃止したSessions文言の復活、見当たらない状態を一部の文言に取り違えの8通りでFAILすることを確認済み。照合（songdata.io の51〜977行目の転記と曲名の突き合わせ）はリポジトリ外の作業メモで行い、結果をfixtureと台帳に記録した。ブラウザ確認（Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（22項目・リポジトリ外）で、LoL 12リストのガイドの鍵（Season・Sessions・公式リンク集・人気曲）、タブ帯の⚙→プレイリスト設定の「📄 入手先」が ja/en/zh/ko で切り替わること、trk115までに保存された廃止鍵（`plGuideLolSessions`）のガイドは保存した控えを表示し、起動時の更新で verified の鍵と文言に置き換わること、ページエラーが無いことを確認。
- trk115のLoL Creator-Safe照合（`check-repo.mjs` のLoLアルバム検査）：Season 1〜9＝verified・Warsongs＝partial（10/11、未照合は「Silver Scrapes」）が `LOL_CREATOR_SAFE` とfixtureで一致し、照合済みの各アルバムが根拠（embed／mirror）を持ち、mirror の記録（songdata.io・確認日）があることを確認。根拠の削除・mirror URLの改変・Warsongsの未照合曲の取り違え・カタログ側の状態の食い違い・シリーズ説明の文言欠落・likely文言の復活・partial文言の過大表現の7通りでFAILすることを確認済み。照合そのもの（51〜300番目の転記と区画ごとの突き合わせ）はリポジトリ外の作業メモで行い、結果をfixtureと台帳に記録した。ブラウザ確認（Chromium 153 headless・リポジトリ外の `puppeteer-core`）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。使い捨てのe2e（17項目・リポジトリ外）で、自動作成されたLoLリストのガイドの鍵（Season 1〜9＝verified・Warsongs＝partial）、タブ帯の⚙→プレイリスト設定の「📄 入手先」が ja/en/zh/ko で切り替わること、trk114までに保存された廃止鍵（`plGuideLolCsLikely`）のガイドは保存した控えを表示し、起動時の更新で verified の鍵と文言に置き換わること、ページエラーが無いことを確認。
- trk114のブラウザ確認（リポジトリ外の `@sparticuz/chromium`＋`puppeteer-core`、Chromium 153 headless）：`tools/smoke-browser.mjs --compare` は boot 0・未解決0・譜面10件一致・decode error 0・click error 0・mobile/safe-offline OK。`tools/smoke-game-end.mjs` PASS。加えて一時スクリプトで23項目（ガイドの鍵と英語表示、削除→再起動で戻らない→♻で復元、移したOSTが戻らない、3スキンのaxe、MIDIの `midiLoaded`／`midiTooDense`、ページエラー0）を確認。半透明カードのスキンはaxeが「判定不能」になるため、16スキンの数値はNodeの計算（`tests/skin-contrast.test.mjs`）で確認。

## 旧 HANDOFF §11「最近の変更」

### trk122 の記録（2026-10-12。trk125のときに HANDOFF §7 から移動）

- **trk122（2026-10-12）**：書斎の拡大中の `PageDown`／`PageUp` を、**「画像の端まで送り、端でさらに押したら次の／前のページを続きの端から開く」**動きにした（`PageDown`＝次のページの上端、`PageUp`＝前のページの下端。trk121の「端の次は反対の端」から変更）。`PageDown` を押し続けるだけで1冊を読み進め、`PageUp` で読み返せます。本の端（1ページ目の上端・最終ページの下端）では反対の端へ戻り、拡大していないときはこれまでどおりページ送り。ページを移ったあとは、**画像の高さが決まってから**続きの端を当てます（`studyImageReady` で読み込みを待ち、`studyApplyZoomLand` で位置を決める）。見開きは1回で2ページぶん進み、開く位置は左右それぞれの端です。文言（`studyZoomEdgeKeys`／`studyZoomEdgeKeysHint`／`studyHelpPg`）4言語とガイド（ja／en）、`sw.js` cache名（`trk-v2026.10.12-trk122`）を更新。

### trk121 の記録（2026-10-12。trk124のときに HANDOFF §7 から移動）

- **trk121（2026-10-12）**：書斎の画像リーダーに、**2つの設定**を足した。①**拡大中の `PageDown`／`PageUp` は、画像の下端／上端へ一度に飛ぶ**（初期オン。端に着いていたら反対の端へ。拡大していないときはこれまでどおり次のページ／前のページ）。②**マウスの中クリック＝次のページ**（初期オフ。オンにするとブラウザの自動スクロールも止める。画像の本のときだけ）。どちらも⚙上級者向けで切り替えられ、文言は4言語。`docs/guide/study-room.md`・`docs/guide/en.md` の画像の項に追記。`sw.js` cache名（`trk-v2026.10.12-trk121`）を更新。

### trk120 の記録（2026-10-12。trk123のときに HANDOFF §7 から移動）

- **trk120（2026-10-12）**：書斎の**拡大の送り幅を％で選べるようにした**（−／＋ボタン・`Ctrl+ホイール`・ピンチで同じ幅を使う）。初期値は **5%**（100%→200%が20回）で、⚙上級者向けの「拡大の送り幅」から **1／2／5／10／25%** を選べる（1%＝細かく、25%＝大きく）。以前は決め打ちの倍率（100→125→150→200→300→400%）だったので、マウスホイールで1回に大きく飛んでいた。倍率の刻みに乗っていないピンチ直後の倍率からは、進む向きの次の目盛りへ動く。`studyZoomStepLabel`／`studyZoomStepOption`／`studyZoomStepHint` と `studyHelpZoom` を4言語で更新し、ガイド（ja／en）にも追記。`sw.js` cache名（`trk-v2026.10.12-trk120`）を更新。

### trk119 の記録（2026-10-12。trk122のときに HANDOFF §7 から移動）

- **trk119（2026-10-12）**：📚 書斎の画像リーダーで、**拡大した画像を `↑`／`↓` で送れる**ようにした（マウスホイールが動かすのと同じ場所＝1枚ずつの台紙・見開きの各ページ）。1回押し＝表示高の84%、押しっぱなし（キーリピート）＝6%ずつ。上下の端に着いたらキーを返し、上級者向け設定「画像ページを ↑ / ↓ で移動する」のページ送り（既定はオフ）や既存のページ操作はそのまま効く。縦読みは台紙そのものがスクロールするので対象外。送りは滑らせず、押した回数どおりに動く（連打・長押しでも取りこぼさない）。`studyHelpZoom`／`studyZoomHint` の文言4言語と、ガイド（ja／en）を更新。`sw.js` cache名（`trk-v2026.10.12-trk119`）を更新。

### trk118 の記録（2026-10-12。trk121のときに HANDOFF §7 から移動）

- **trk118（2026-10-12）**：Creator-Safe Playlistの曲から、誰でも使いやすいリストを作った（新しい12リスト・539曲。全曲 links-verified＝「全曲がCreator-Safe対象（照合済み）」）。LoL（自動作成）：Pentakill 29曲・ログイン／イベント／スキンのテーマ 53曲・eスポーツのテーマ 17曲・2025〜26年のサウンドトラック 59曲。VALORANT：VALORANT Creator-Safe 39曲。新シリーズ「🛡️ Riot Games — LoL関連ゲーム」（🛒から取り込み）：Ruined King 60・The Mageseeker 57・Hextech Mayhem 30・Teamfight Tactics Vol.1／Vol.2 各68・2XKO 45・Wild Rift & Runeterra 14。各曲はプレイリストにあるSpotifyトラックIDへリンク（`tools/riot-games-creator-safe-playlist.json` に51〜977行目を記録、VALORANTのfixtureにIDを追加）。文言 `plGuideRiotLinksVerified` を4言語で追加。台帳・ガイド（ja／en）・NOTICE・`sw.js` cache名（`trk-v2026.10.12-trk118`）を更新。

### trk117 の記録（2026-10-12。trk120のときに HANDOFF §7 から移動）

- **trk117（2026-10-12）**：VALORANTのリストもCreator-Safeと照合。VALORANT公式Creator-Safe Playlist（Spotify）の全40曲を公式の埋め込み表示で読み（`tools/valorant-creator-safe.json` に記録）、LoLで読んだRiot Games Creator-Safe Playlistの977行とも照らした結果、Championsアンセム6曲・エージェント関連曲3曲はどちらにも見当たらない（`VAL_CREATOR_SAFE`＝links-absent）。公式リンク集の文言を LoL と共通の `plGuideRiotLinksPartial`／`plGuideRiotLinksAbsent` に改名し（特定のゲーム名を含まない文言に）、`LOL_GUIDE_KEYS` を `RIOT_GUIDE_KEYS` に。台帳 `docs/VALORANT-MUSIC.md` を新設。LoLで見当たらなかった4曲は、空さんの判断で追加確認をしない。ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk117`）を更新。

### trk116 の記録（2026-10-12。trk119のときに HANDOFF §7 から移動）

- **trk116（2026-10-12）**：LoLの残りのリストもRiot公式Creator-Safe Playlistと照合。songdata.io が表示する全977行（公式979曲。出ない2曲は701〜750番目）を読み、Sessions: Vi・Star Guardian Taliyahは全曲（verified）、Sessions: Dianaは42/43（「Oh Baby」が見当たらない）、Champion Themeは39/41（Smolder・Yunara）、Worlds/WCSアンセムは「Worlds Collide」（2015）だけ、人気曲は7/30、MSIアンセムとK/DAは見当たらない。Warsongs「Silver Scrapes」も全行に無かった。状態に links-partial／links-absent を足し（公式リンク集の文言 `plGuideLolLinksPartial`／`plGuideLolLinksAbsent` を4言語で追加）、Playlistと未照合だった sessions 状態とその文言を廃止。一部の文言は「残りはPlaylistに見当たらない・要確認」、人気曲は「一部だけ対象、共同制作曲などは対象外・要確認」に。`notYetMatched` を `notFound` に改め、公式リンク集・Sessionsのfixtureにも `creatorSafe` を追加し、`check-repo` で18リストを検査（8通りの改変でFAILを確認）。台帳・ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk116`）を更新。

### trk115 の記録（2026-10-12。trk118のときに HANDOFF §7 から移動）

- **trk115（2026-10-12）**：LoLのCreator-Safe照合を101曲目以降へ広げた。公式の埋め込み表示は先頭100曲までなので、プレイリスト全体を表示する第三者サイトsongdata.ioで51〜300番目を読み、Season 7の残り7曲・Season 1〜6の全136曲・Warsongs 10曲を照合（51〜100番目は公式の埋め込みと完全一致することを確認）。Season 1〜9を照合済み（verified）、Warsongsを一部照合済み（partial・10/11、「Silver Scrapes」は未照合）にし、推測で「可能性が高い」とした likely 状態と文言（4言語）を廃止。partialの文言は「一部の曲は対象（照合済み）、残りは未照合・要確認」に変更。fixtureに根拠（embed／mirror）と第三者サイトの記録、公式SoundCloudのCreator-Safe Playlist Pt. I／IIを追加し、`check-repo` で一致・曲数・根拠を検査（7通りの改変でFAILを確認）。台帳・ガイド（ja／en）・`sw.js` cache名（`trk-v2026.10.12-trk115`）を更新。

### trk114 の記録（2026-10-11。trk117のときに HANDOFF §7 から移動）

- **trk114（2026-10-11）**：再レビュー（3a3a3db→2380d8b）への対応。①LoLのCreator-Safe表示を照合状態ごとに分けた（照合済み＝Season 9・8、一部照合済み＝Season 7、可能性が高い・未照合＝Season 1〜6、未照合＝Warsongs、人気曲＝共同制作曲は対象外・要確認）。公式埋め込み表示の先頭100件でSeason 8全曲とSeason 7の41曲を新たに照合し、台帳・fixture・ガイドの過大な記述を訂正。②`js/fx.js`／`js/fx-presets.js` の凍結を空さんの判断で解除し、NAMESPACE-PLAN・ADDONS・REVIEW記録の記述をそろえた。③MIDIの処理量：聞こえない余韻を数えず・描かず、合成ループを高速化、上限を2億に、`midiTooDense` の専用文言・進み具合・中止、`tools/midi-budget.mjs`。④消した自動リストを作り直さない印（`trkRemoved`）と♻復元ボタン、OSTの移動を守る。⑤入手先ガイドを4言語の辞書キーで表示。⑥`TrkEnsureTrkOstPlaylist`・`TrkOstPlaylistId`・`TrkTouhouThemeData` を `window.Trk.library`／`window.Trk.touhouThemeData` へ。⑦入れ子の見出しなど小さなアクセント文字に `--ui-accent-ink`（全スキン4.5:1）。`sw.js` cache名を `trk-v2026.10.11-trk114` に更新。

### trk113 の記録（2026-10-11。trk116のときに HANDOFF §7 から移動）

- **trk113（2026-10-11）**：🎓 trk's OST Vol.1 用の手続き作曲スクリプト `tools/make-trk-ost.mjs` を追加。コード進行／確率・統計（マルコフ・ランダムウォーク）／進化的アルゴリズム（GA）／深層学習（tiny MLPを勾配降下で訓練）／自由作曲 の5ルール×2曲＝10曲を依存なしで合成し `assets/trk-ost/` へWAV出力（.gitignore でGit外・生成スクリプトのみ同梱）。試聴は `assets/trk-ost/index.html`。音源はアプリ未組込（将来 trk's OST Vol.1 へ追加予定）。

### trk112 の記録（2026-10-11。trk115のときに HANDOFF §7 から移動）

- **trk112（2026-10-11）**：タブ挙動の改善。①デモ曲を🎓 trk's OST Vol.1 プレイリストへ移設（🐔 trk's playlist 内・Game Vol.1 の下、`js/library.js` の `ensureTrkOstPlaylist`／`TRK_OST_ID`。旧版の最上位タブからの移行あり）。②開いたフォルダ内プレイリストのタブを `settings.libOpenTabs` で永続化し、中クリックはタブを閉じるのみに（`plCloseOpenTab`）。ガイド（`appearance.md`・`en.md`）と `sw.js` cache名（`trk-v2026.10.11-trk112`）を更新。`npm run check` 全件通過・VMで新関数の挙動を確認。

### trk111 の記録（2026-10-11。trk114のときに HANDOFF §7 から移動）

- **trk111（2026-10-11）**：エンドフィールド公式カタログにMetal Scar Radioの公式アルバム6作・計81曲を追加（Eve of Departure 5曲・Thunder's Legacy 9曲・At the Wake of Spring OST 17曲・Contingency Contract Re-Ignition OST 4曲・Homecoming OST 30曲・Dreamscape of Wind and Snow OST 16曲、いずれも公式Spotify収録順）。各曲は公式Spotify個別曲、各アルバムは公式Spotifyアルバムページへリンクし、取り込み時に `trk-ef-*` を自動作成。この6作の中国語公式曲名・ffm.to告知リンク（Homecoming 以外）・VGMdb照合は未確認（照合別名なし）。台帳 `docs/ARKNIGHTS-ENDFIELD-MUSIC.md`、fixture `tools/endfield-msr-albums-tracklist.json`、検査は `tools/check-repo.mjs` の🛰️MSR albumsブロックに追加。ガイド（`appearance.md`・`en.md`）とNOTICEを更新し、`sw.js` cache名を `trk-v2026.10.11-trk111` に更新。

### trk109〜trk110 の記録（2026-10-10。trk113のときに HANDOFF §7 から移動）

- **trk109 — Touhouローカル曲名・MIDI音色・MIX**：TouhouThemeDBのローカル曲名カタログとID形式名の表示、実サンプルを使わない24種のコード生成MIDI音色、通常音声用・初期オフのTRK MIDI MIXを追加。詳細な権利・抽出注意は [`guide/touhou-midi.md`](guide/touhou-midi.md)。
- **trk110 — Endfield 初号指令OST**：公式カタログに「初号指令OST」Zeroth Directive Vol.1（37曲）・Vol.2（23曲）を公式収録順で追加。各曲は公式Spotify個別曲、各巻は公式ffm.to配信一覧へリンクし、中国語公式曲名を照合別名に登録。旧4パート紹介版プレイリストは永続ID `ef-firstorder` を保ったまま安全更新。権利調査は [`ARKNIGHTS-ENDFIELD-MUSIC.md`](ARKNIGHTS-ENDFIELD-MUSIC.md)、fixtureは `tools/endfield-zeroth-directive-tracklist.json`、検査は `tools/check-repo.mjs` の🛰️ブロックに追加。ガイド（`appearance.md`・`en.md`）とNOTICEを更新し、`sw.js` cache名を `trk-v2026.10.10-trk110` に更新。

### trk106〜trk108 の記録（2026-10-10。trk109のときに旧HANDOFF §8 から移動）

- **trk106 — 譜面中のジャケット配置**：選曲中は従来どおり動画枠中央、譜面演奏中は右上タイマーの下（160×160px枠）へ配置。右余白とタイマー間隔を固定し、各レイアウトでレーン・ノーツに重ねない。元画像は拡大せず、全画面設定オンも従来どおり。実機確認は現行HANDOFF §4を参照。
- **trk107 — LoLプレイリストの整理**：公式SoundCloudアルバムを1アルバム＝1プレイリストにし、Season 1〜9のゲームOST 243曲、Warsongs 11曲、公式人気曲30曲を追加。LoLは計18プレイリスト・456曲。音源は同梱せず、アルバムは公式SoundCloud、曲別は公式Spotify（人気曲は公式SoundCloud）へリンク。詳細と未確認事項は `docs/LEAGUE-OF-LEGENDS-MUSIC.md` とfixtureを参照。
- **trk108 — LoL Creator-Safe対象の確認**（※trk114で訂正：実際に照合したのはSeason 9だけだった。trk114でSeason 8全曲とSeason 7の41曲を追加照合し、残りは「可能性が高い・未照合／未照合」と表示。trk115で101曲目以降も照合し、Season 1〜9全曲を照合済み・Warsongsを10/11にした）：Riot公式Creator-Safe Playlistへの掲載を確認し、Season 1〜9のOST 243曲とWarsongs 11曲を対象として扱う。人気曲の共同制作曲、K/DA、Worlds 2026「Know My Name」等は対象外・要確認のまま。根拠と制限はLoL調査台帳を参照。

### trk100〜trk105 の記録（2026-10-10。trk108 のときに HANDOFF §8 から移動）

- **trk100 — 選曲画面TVの状態修正**：画面状態を `core.screen` 経由に統一。利用者確認済み条件は §3 に記録。
- **trk101／102 — 音源ジャケット**：端末内抽出・縮小・表示先と設定を追加。画像・処理量を制限し、通信・永続画像保存はしない。
- **trk103／104 — LoLカタログ**：Worlds 2026「Know My Name」とK/DA 6曲を追加。Creator-Safe・二次利用条件は未確認。
- **trk105 — ジャケット表示調整**：既定を原寸以下の中央表示にし、全画面設定は既存 `artWallpaperBg` を再利用。TVドックの静止カバーにもTVのCSSフィルターを適用。実機確認は §7 に残す。

### trk97〜trk98 の記録（2026-10-09。trk99 のときに HANDOFF §11 から移動）

- **trk97 — Esc長押しで選曲へ戻る**：プレイ中・一時停止中・リザルトで Esc を約1秒押すと、確認なしで選曲画面へ戻る（`js/main.js` の `escHoldStart`）。短押しは従来どおり。❓謎設定の「Esc長押しで曲選択画面に戻らない」（`escNoReturn`、既定オフ＝戻る）で止められる。合成キー（パッドの戻る）と、書斎などの開いている間は対象外。検査は `tests/esc-hold.test.mjs`。
- **trk97 — ランク判定の検査**：ゆるめ判定・1.00x未満は練習扱い（プレイ回数は増えるがハイスコアは更新しない）、きびしめ・1.05x以上は記録対象、AUTO は記録しない、を実ソースの `recordPlay` で確かめる（`tests/ranked-option.test.mjs`）。ヘッドレスのブラウザは環境になく、画面上での確認は §7 に残す。
- **trk98 — 曲の終わりで結果画面が出ない不具合（回帰）を修正**：`game.js` の `runMods` が、IIFE の中にある `lifeTags` を裸の名前で呼んでいたため ReferenceError になり、`phase` だけ `ended` になって結果画面が空のままだった（trk95・96 の修正は正しく、その後の名前の整理で `lifeTags` が公開されなくなった）。`js/modes.js` で `window.Trk.modes.lifeTags` として公開し、`game.js` はそれを呼ぶ。既存の検査はスタブで `runMods` を置き換えていたため見逃していた。検査：`tests/game-end.test.mjs` に配線の検査を追加。実ブラウザの検査として `tools/smoke-game-end.mjs`（下記）を追加。
- **trk98 — 実ブラウザの終端検査**：`SMOKE_CHROME=… SMOKE_PUPPETEER=… node tools/smoke-game-end.mjs` で、20秒の合成音声を MANUAL と AUTO の両方で最後まで流し、結果画面の表示と pageerror 0 を確かめる。`npm run check` には入れない。

### trk99 の記録（2026-10-09。trk100 のときに HANDOFF §11 から移動）

- **trk99 — 密な連打で横のノーツを巻き込む問題（MANUAL）**：打鍵とノーツの対応づけを `js/judge-match.js`（純関数・`window.Trk.judge`）に切り出し、既定を新方式 `"smart"` にした（HANDOFF §2.3）。❓謎設定「🥁 判定を昔のやり方にする」（`judgeOrdered`、既定オフ、4言語、リセット・Export／Import 対応、`?safe=1` は触らない）で旧方式 `"ordered"` に戻せる。読込順 `js/media.js` → `js/judge-match.js` → `js/game.js`、`tools/check-repo.mjs` の `TRK_REGISTRARS` に `judge`、検査 `tests/judge-match.test.mjs`（26件）、`tests/fixtures/globals-baseline.json` を再生成（trk97〜98 のずれも取り込み）。文書：`JUDGE-MATCH.md`（設計メモ）、`guide/play.md`・`guide/en.md` に「🥁 MANUAL の判定のしくみ」、`guide/credits.md`・`en.md` の着想元に osu!lazer・太鼓・IIDX、`guide/files.md`・`NAMESPACE-PLAN.md` に新ファイル。実機確認は HANDOFF §7。

### 作業要約（2026-10-09時点・trk75〜97）

- **Esc長押しで選曲へ戻る（trk97）**：プレイ中・一時停止中・リザルト画面で Esc を約1秒押し続けると、確認なしで選曲画面へ戻る（`js/main.js` の `escHoldStart`）。短押しは従来どおり（一時停止・設定を閉じる）。❓謎設定（🎯プレイオプション内）の「Esc長押しで曲選択画面に戻らない」（`escNoReturn`、既定オフ＝戻る）で止められる。合成キー（パッドの戻る）は `isTrusted` で除外。書斎・メディアプレーヤー・シンス等の開いている間は対象外。`tests/esc-hold.test.mjs`。実機の体感は未確認（§7）。
- **trk96 — リザルトのランク・称号が消える問題**：画面を出す前に結果を描いていなかったため、聞き手の出力（判定の平均・称号など）が消えていた。順序を「結果を描く → 画面を出す → 記録 → 記録に依る行を埋める → `resultRecorded`」に直した（`js/game.js`・`js/modes.js`）。検査は `tests/game-end.test.mjs`。
- **trk95 — 終端・リザルト遷移**：終端判定を `game.js` に一元化（§2.3）。
- **（trk96 の記録）**：
- **リザルトのランク・称号が消える問題（trk96）**：
  - 原因：`endGame()` が `showScreen("endScreen")` を結果の描画より前に呼んでいたため、画面の `screen` 聞き手（判定の平均・公認・称号）が描く先の結果がまだなく、後の `innerHTML` 代入で消えていた。称号（🏅のランク表示）は、記録より前に呼ばれていたため直前の曲の履歴も見ていた。
  - 順序を「①結果を描く → ②画面を出す → ③記録を保存（try）→ ④自己ベスト行・クレジットの⭐を埋める → `resultRecorded` を emit」に変更。称号は `modes.js` で `resultRecorded` を聞く。自動微調整の文言も、画面を出す前に消すよう直した（従来は後で消えていた）。
  - `tests/game-end.test.mjs` に順序の検査を追加。`npm run check` 成功（テスト 110/110）。`sw.js` のキャッシュ名は `trk-v2026.10.9-trk96`。ヘッドレスのブラウザは環境になく、実機・実ブラウザの表示は未確認（§7）。

- **（trk95 の記録）**：
- **リザルト画面が出ない問題の再修正（trk95）**：
  - 原因：`tickClock()` の終端ガードが、`video.paused`／`seeking` の早期 return より後にあり、終端付近で video が pause 済みだと実行されなかった。`main.js` のイベント側も `phase === "playing"` の場合だけを見ており、終端・pause・時計の判定が分散していた。
  - 終端・pause の処理を `game.js` に一元化。終端判定を早期 return より前に行い、ブラウザの `ended` 通知が欠落しても終端時刻を検知する。AUTO／MANUAL／TRUCK／ORBIT／STAGE／CATCH 共通。手動一時停止中は、実際に `video.ended` になった場合だけ結果へ進む。極端に短い音源を開始直後に終了扱いしないよう、終端許容幅は曲長に比例させる。
  - リザルト画面を記録保存より先に表示し、記録・履歴の保存に失敗してもスコア結果を描画する。短い無音区間終了・FAILEDも、phase を終端へ移した後で video を pause し、pause 合図との競合を避ける。
  - `tests/game-end.test.mjs` を追加し、pause 済みの終端・ended 通知・通常 pause・短い曲・全5モード／AUTO／MANUALを検査。`npm run check` 成功（`npm test` 109/109、Static 0 failure／0 warning）。実ブラウザ／実機の再確認は未実施（§7）。`sw.js` のキャッシュ名を `trk-v2026.10.9-trk95` に更新。
- **リザルト終端ガードの初回対応／軽量化設定欄の配置変更（trk94、終端処理はtrk95で再修正）**：
  - `tickClock` と `main.js` に終端ガードを追加したが、`tickClock` 側は `video.paused`／`seeking` の早期 return より後にあり、停止状態では実行されない欠陥が残っていた。trk95で処理を共通化し、動作を伴う回帰テストへ置き換えた。
  - 設定画面の右下にあった「🪶 軽量化設定（`#litePanel`）」を左列の「🩷 MMDマスコット（`#mmdPanel`）」のすぐ上に移動（この配置変更は維持）。
- **設定画面プルダウンと棚カウンターのコントラスト改善（trk94）**：
  - `.field` の外にある `#displayMode`（表示モード）と `#shortMode`（短縮）を含む全 `select` 要素に素の `select` スタイル（`padding:8px 10px;border-radius:10px;background:var(--ui-field);color:var(--ui-text);border:1px solid var(--ui-border);font-size:16px`）を適用し、暗いスキン28種で白地に白文字になる視認性問題を根本解消。
  - `#skinShelfCount` の `opacity:.6` を廃止し、`color:var(--ui-muted);font-weight:600` に変更して明るいスキンでのコントラスト低下（2.2〜3.2）を解消。
  - `tests/skin-contrast.test.mjs` に全 select 要素のスタイル適用および shelf counter のコントラスト回帰テストを追加。
  - `sw.js` キャッシュ名を `trk-v2026.10.9-trk94` に更新。
- **追補（trk93）**：SWの初回safeナビゲーション判定を強化し、キャッシュ名を `trk-v2026.10.9-trk93` に更新。汚染 `index.html`＋HTTPサーバー停止を使うオフライン回帰と360×800／800×360のstage幾何検査をブラウザースモークへ追加（実行はブラウザ未搭載のため未確認）。`#stage` をfixedに変更。軽量化中だけ音声解析の上限を10分にし、96MiB／通常20分と `liteNoAnalyze` を分離、スキップ理由を4言語化。44スキンのボタン／曲一覧補助文字とカスタムアクセントを静的WCAG計算で検査するテストを追加。`npm run check` 成功（Static 0 failure、Security 56、a11y 8、vendor 8、lite 123 assertions、node:test 101/101）、`git diff --check` 成功。axeの実DOM再現・実機測定ではない。
- **英語ガイド・3D部品（trk92）**：英語ガイドの全節を整備し、three.js系の3D部品をローカル同梱へ移行。CDN参照を除き、エラー文言も4言語で更新。英語の母語話者確認と実機での3D表示は未確認（§7）。
- **再レビュー対応（trk75〜77、trk90）**：IndexedDB・解析キャッシュ・名前空間・譜面生成・実行動作テスト。詳細は下の項目。
- **スキンの増量（trk78〜89）**：ゲーム画面 27 → 40、TVドック 30 → 36、棚 16 → 30、書斎 24 → 30、映像フィルター 65 → 70。見やすさ・生活・色覚配慮・ビビットの系統を追加。**✨ TRKエフェクト**（映像フィルターの 20 種）は固定（`tests/trk-effects-fixed.test.mjs`）。映像フィルターの分類「エフェクト」は「ムード・場面」に改名。**スキン数は減らしていない。**
- **最終検査（trk91・2026-10-09）**：`npm run check` 成功（Static 0 failure／0 warning、Security 55、a11y 8、vendor 8、node:test 94/94）、`node tools/globals-audit.mjs --compare` 成功、`git diff --check` 成功。ブラウザースモークは trk91 では未実行（§7）。
- **最終検査（trk90・2026-10-09）**：`npm run check` 成功（Static 0 failure／0 warning、Security 55、a11y 8、vendor 8、MMD・Study・lite checks passed）、`npm test` 93/93、`node tools/globals-audit.mjs --compare` 成功（classic scripts 45・宣言 1189・private 1009・public 180・衝突 0・global names 288・window経由の連携 25）、`node tools/check-repo.mjs`・`git diff --check` 成功。ブラウザースモーク `--write`／`--compare` とも成功。`--compare` は合成譜面10件のhash／キー集合が完全一致、実WAV譜面10件のキー集合一致・件数±5%、boot／未解決名／decode／page／click errors 0（84 clicks・6 scenarios）。
- **未確認**：実ブラウザでの見た目（§7 に記録）。中国語・韓国語の訳は、母語話者の確認をしていない。自然さに問題があれば issue で指摘してもらう方針。
- **次の候補**（§9）：棚・TVドックの自由な発想の案、実機での確認。

- **2026-10-09 — 4回目レビュー（48f4550・trk90）の残り3件への対応（trk91）：**
  - ① 静かな区間の上限を、density 比例式から難易度順の表へ変更（`CG_QUIET_CAPS`：初級15%・中級20%・上級25%・達人34%・RUSH40%）。初級が中級を上回る逆転が解消し、`DIFFS` の density と揃える必要もなくなった。
    - 実測：contrast の総数は 115→100（初級のみ）／212／459／514／894。静かな区間（0〜90秒）は 0.44／1.03／2.47／3.08／7.30 nps で、難易度順に厳密増加。
    - 旧方式、introChorus・flat の初級・中級、longRamp の±10% は変わらない。
    - テスト：density 一致の assert を外し、静かな区間の密度の単調増加を追加（`npm test` 94件）。初級の静かな区間の比の下限は 0.15→0.10（上限15%の表で約0.13。0 にならないことの確認で、仕様の数値ではない）。
  - ② 互換名の一覧を `tools/compat-names.json` へ移し、`check-repo` は文書の見出し・文言を読まないようにした。JSON を壊すと FAIL、文書の文言だけを変えても通ることを確認。`docs/ADDONS.md` は一覧を JSON 参照に変更。
  - ③ 静かな曲で上級と達人の Lv が並ぶ件は仕様どおりとし、`docs/guide/play.md` に「難易度名と Lv」の節を追加（Lv は峰の難しさ）。
  - ブラウザースモーク：合成譜面10件は node で同じ手順により再計算し、変わった `gen2/easy`（115→100、hash `18df8242…`）の1件だけを基準に反映した。他の9件は一致。Chromium がないため、`smoke-browser.mjs --compare` と実 WAV のデコード経路（gen2/easy の件数 ±5%）は未実行。
  - `sw.js` のキャッシュ名は trk91。
- **2026-10-08〜09 — 再レビュー（6150725→95c8afb）への対応（trk90）：** ① 静かな区間の候補上限を Hard density 基準の25%から難易度比例へ変更（formula は§2.3）。合成曲 `contrast` は Easy〜RUSHで115／212／459／514／894ノーツ、すべて隣接難易度で増加する回帰テストを追加。Master はLv10のままで、Lv12〜15の回復は別途未対応と明記。② ブラウザスモークの譜面比較を `synthAnalysis` 注入に分離し、実WAVのデコード／解析はエラーなし・件数±5%だけを検査。`--write`／`--compare` はともに成功（boot 0・未解決 0・合成譜面10件のhash／キー集合が完全一致・実WAV10件のキー集合一致と件数±5%・デコードエラー0・click error 0）。③ 古いwindow別名の全consumerを調べ、28件を削除、5件（`chartMeta`・`phase`・`prefs`・`stats`・`videoReady`）は凍結 `js/fx.js` の読者として保留。`docs/ADDONS.md` に期限超過（trk89）と段階削除（trk90）を記録し、`check-repo` が削除・保留・core正規名を照合。`docs/NAMESPACE-PLAN.md` はD/Eの現状・最新audit数・smokeの比較方式を更新。`spectrum.js`／`tv-dock.js` 等も正規の `core.*` accessor へ移行。④ `tests/core-safety.test.mjs` で実際のcore.jsから抽出したURLコマンド／safe-modeをVM実行し、`force=1`、確認・取消、`?factory`、設定とFXラック保存を検査。`check-security` の該当する綴り依存チェックをbehaviorテスト存在確認へ置換。`restoreCoreAlias` を使う他の静的検査は段階移行として残る。

- **2026-10-08 — 映像フィルターの分類名を変更（trk89）：** 「エフェクト」→「ムード・場面」（英：Mood & scenes／中：氛围·场景／韓：분위기·장면）。TRKエフェクトと紛らわしいため。分類の中身（ナイト・監視カメラ・ドリーム・フェード・ポスター・ソフト＋生活の 5 種）と内部 ID（`effect`）は変えない。TRKエフェクトの 20 種は変更なし。
- **2026-10-08 — ④映像フィルターの見直しと TRKエフェクトの固定（trk88）：** 計画書の④を見直し（水彩・墨は実装、既存と重なる 3 案は見送り、規則を追加）。**✨ TRKエフェクト**（`tv-rich.js` の 20 種、人物・アニメ・質感・スタジオ）は固定と決定。`tests/trk-effects-fixed.test.mjs`（新規 3 件）で ID・並び順・分類の人数を守る。棚の整合性（定義・並び順・CSS が同じ 30 種、かんたん表示の上位 6 種が並びに含まれる）を `tests/shelf-skins.test.mjs` に追加（テスト 88 件）。映像フィルターの分類名は trk89 で「ムード・場面」に変更済み。
- **2026-10-08 — 棚スキン 6 種（trk87）：** 色覚配慮の 3 種（青×橙＝Okabe-Ito の基本色、模様で見分ける＝縞・点・格子・破線、黄×黒の案内サイン）とビビットの 3 種（ポップアート、虹色ネオン、トロピカル）を追加。棚は 24 → 30 種。色だけに頼らない（模様・枠の太さ・外枠で区別）。`tests/shelf-skins.test.mjs`（新規 7 件）で、6 種の単色の文字と背景を 4.5:1 以上で検査。模様の指定は目視で確認が必要。`tools/check-repo.mjs` の期待値を 30 に更新。**未確認**：実ブラウザでの見た目、かんたん表示の並び。
- **2026-10-08 — 書斎の文字スキン 6 種（trk86）：** 付箋・便箋・日記帳・俳句の短冊・新聞の紙面（文筆・読書に追加）、楽譜の余白（自由な発想に追加）。書斎は 24 → 30 種。定義（`STUDY_THEMES`）、画面の選択肢（`index.html`）、4 言語の名前、CSS（`.study-text-stage[data-theme]`）を揃えた。`tools/check-study-room.mjs` の期待値を 30 に更新し、`tests/study-themes.test.mjs`（新規 6 件）で 6 種の本文と編集欄の対比を 4.5:1 以上で検査（テスト 75 件）。**未確認**：実ブラウザでの見た目（特に新聞の段の罫線と、楽譜の五線の間隔が文字の行と合うか）。
- **2026-10-08 — 棚スキン 3 種・映像フィルター 5 種（trk85）：** 棚に駅の伝言板（message）・郵便の仕分け棚（postal）・楽譜棚（score）を追加（棚 21 → 24）。映像フィルターに水彩のにじみ・墨の滲み・雨の窓ガラス・銭湯の湯気・障子越しの光を追加（70 種、分類は effect）。\n  **計画からの変更：** 計画書の映像案のうち「褪せたフィルム」「サーマル風」「夜間の撮影」は、既存の faded・thermal・night／nightvision と役割が重なるため見送り、代わりに生活の場面の 5 種を選んだ。`tools/check-repo.mjs` の期待値を 70／24 に更新。文字と背景の対比は 4.5:1 以上。**未確認**：実ブラウザでの見た目（特に映像フィルターの見た目と、伝言板の回転したタブ）。
- **2026-10-08 — 棚スキン 5 種（trk84）：** 工具箱・植物標本箱・薬箪笥・旅館の下駄箱・駄菓子屋の棚を追加（棚 16 → 21）。見た目は CSS の `#libPanel[data-lib-skin]` だけで作り、定義（`LIB_SKINS`）と並び順（`LIB_SKIN_ORDER`）に入れた。文字と背景の対比は 4.5:1 以上（最も低い薬箪笥のタブで 4.83）。`tools/check-repo.mjs` の期待値を 21 に更新。**未確認**：実ブラウザでの見た目、かんたん表示での並び。
- **2026-10-08 — TVドックのスキン残り 3 種（trk83）：** 冷蔵庫の扉（fridge）・金魚鉢（bowl）・洗濯機の窓（washer）を追加（TVドック 33 → 36、飾り 31 → 34）。
  **重要な訂正：** 飾り（`.tvDeco`）は機器の全体ではなく、画面と操作ボタンの間の高さ約 44px の帯です。trk82 の 3 種（車内モニター・船の丸窓・提灯）は全体に重なる想定で書いていたため、trk83 で帯の中に収まるように直しました（車内モニターの扉の飾りは削除）。今回の 3 種も帯の中の形で作りました。**未確認**：実ブラウザでの見た目。
- **2026-10-08 — TVドックのスキン 3 種（trk82）：** 車内モニター（train）・船の丸窓（porthole）・提灯（lantern）を追加（TVドック 30 → 33）。飾りは既存の仕組み（`buildDeco` の分岐＋ CSS の `#tvDock[data-skin]`）に足し、カスタムTVの飾りの選択肢にも入る（飾りは 28 → 31）。権利：色と図形だけの自作。特定の鉄道・船・製品の意匠は使わない。**未確認**：実ブラウザでの見た目（提灯の紐と飾りの位置は、`.tvDeco` の overflow で欠けないよう調整したが、見た目の確認が必要）。`npm run check` 通過（テスト 69 件）。
- **2026-10-08 — ゲーム画面スキンの残り＋ UX の 4 か国語確認（trk81）：** 水墨・楽譜・ドット絵の夜・霧の森を追加（総数 40 → 44）。`tests/skins-access.test.mjs` に追加分のコントラスト検査（テスト 69 件）。
  4 か国語の確認（機械的な検査、約 1,617 キー × 4 言語）：キー数は全言語で揃った。英語の欠落 6 件（音色プリセット名）を追加。中国語・韓国語の文中の「・」（日本語の中点）を「·」に置換（111 箇所）。中国語の仮名の残り（「Lat式ミク」「あいうえお」）を訂正。差し込み記号（{n} など）は全言語で一致。抜き取り約 90 件を読んだ範囲では概ね自然。韓国語の引用符の一部が直線の ' のまま（未修正）。**母語話者による全件の確認は未実施**。
- **2026-10-08 — 生活のスキン 2回目（trk80）：** 駅のホーム（夕暮れ）・台所の朝・商店街の夕暮れを追加（生活系は計6種、総数 37 → 40）。`tests/skins-access.test.mjs` の生活系の期待一覧を更新（新規の検査は追加なし。npm test は 68 件のまま）。
- **2026-10-08 — 生活のスキン（trk79）：** 生活場面のテーマを 3 種追加（カテゴリ `life`・表示名「生活」を4言語で追加）：雨の窓・夜の銭湯・障子の光。すべて自作の配色（素材・画像なし）。総数 34 → 37（`check-repo` の期待値を更新）。`tests/skins-access.test.mjs` が生活系の文字のコントラストを同じ基準で検査（形と輝度の検査は色覚配慮の要件なので生活系は対象外）。**未確認**：実ブラウザでの見た目、韓国語・中国語の文言の母語話者による確認。
- **2026-10-08 — 見やすさのスキン（trk78）：** ゲーム画面スキンに 3 種を追加（`js/data.js`、カテゴリ `access`・表示名「見やすさ」を4言語で追加）。ハイコントラスト（黒地・黄とシアン）、色覚にやさしい暗め／明るめ（Okabe & Ito の青と朱色の組み。明るめは輝度の差を広げた）。ノーツは丸と菱形で形も変え、色だけに頼らない。総数 31 → 34（`check-repo` の期待値を更新）。`tests/skins-access.test.mjs`（6件）が WCAG のコントラスト（本文 4.5:1、ハイコントラストは 7:1）、ノーツの形の違い、輝度の差、4言語の表示名を検査。テストの検査で、明るめの2色が白黒で区別しにくいと分かり、配色を直した。**未確認**：実ブラウザでの見た目（この環境に Chromium がない）、韓国語・中国語の文言の母語話者による確認。
- **2026-10-08 — 名前空間：IIFE 冒頭の別名（レビュー4・trk77）：** 各 IIFE の先頭に `const core = window.Trk.core;` を置き、本文の `window.Trk.core.X` を `core.X` にした（32 ファイル、約 6,000 箇所。`core.js`・凍結の `fx.js`／`fx-presets.js` は対象外）。別名は同じオブジェクトを指すので、getter／setter の挙動は変わらない。読み込み順は `core.js` が先（別名を作るのは IIFE 実行時で、`core.js` より前に読まれるファイルは使わない）。構文・AST で置換したので、コメント・文字列には触れていない。**静的検査は別名を元の綴りへ戻して照合する**（`tools/lib/js-source.mjs` の `restoreCoreAlias`。check-repo／check-security／check-a11y／check-lite／check-study-room／check-mmd／globals-audit が使う）。戻した結果は変換前の HEAD と 32 件すべてビット一致（`/tmp` の往復検査）。棚卸しの数（1188／182／316、重複 0）は変わらない。**未確認**：実ブラウザでの起動（この環境に Chromium がない。`tools/smoke-browser.mjs` で別途確認）。
- **2026-10-08 — 再レビュー（b7d88ad→6150725）の対応（trk75・trk76）：** ① 解析キャッシュを LRU 化（読み出しで `savedAt` を更新。テスト2件追加）。② `media.js` のコメント2件を修正（既定は `"2"`、decodeAudioData は再サンプル後の長さは減るがピークは減らない）。③ 静かな長い区間（レビュー1）：絶対音量ゲート（区間の平均音量が曲の最大の6%未満なら候補数の25%まで）を `chart-gen.js` に追加。合成曲 contrast の上級の静かな区間は 3.9→2.5 nps（Lv 10→9）。導入部（introChorus の 0〜30秒）・flat・silentLead は変わらない。**副作用**：contrast の上級・名人の総数が 562→459、768→459 に減る（盛り上がり側が候補の上限 7.9 nps に張り付くため）。テスト3件追加・1件の判定を変更（静かな区間の方が低いことを方向と下限で判定）。④ 互換名の廃止予定（レビュー4）：`docs/ADDONS.md` に 33 件を予告（trk76 から。trk76 から公開版を2回重ねた版で削除）。`tools/check-repo.mjs` が core.js の互換名と一覧の一致を検査。`const core` の別名導入は後回し（§9）。
- **2026-10-08 — 今回の作業のまとめ（マージ前）：** ① IndexedDB：容量計算の索引の取り違えを修正（`5c93ef5`、`tests/idb.test.mjs` 13件）。② 解析結果のキャッシュを確定（`0761f72`、ヘッドレスで2回目のデコード0回・譜面一致・セーフモードは書かない）。③ 項目6：「📁 開く／📤 共有」の説明行（`15ea669`）。④ Loop Lab：区間の 🎬 で映像を書き出し（`e8fae4d`、開発者表示の中だけ）。⑤ 📺 TVドックの設定：壁掛け・並び替え・5枠化の3チェック、既定はくわしいが開いた状態、3つとも OFF（`04fb26e`）。⑥ Issue：#21・#22・#24・#25 を修正済みとして閉じ、#23 は安定版の追跡項目として閉じた。
- **2026-10-08 — 残りの低優先（レビュー低）と軽量化の確認：** ① 見出しの飛び h1→h3 を解消（曲リストの見出しを h2、見た目は同じ）。② devDependency の typescript は削除せず注記（Capacitor CLI が `capacitor.config.ts` を読むのに必要。`docs/android.md`）。③ 実機確認の Issue フォーム（`device_check.yml`）。④ 軽量化の一通りの確認で、PC の自動モードでプリセットを選んでも働かなかった不具合を直した（プリセットを選んだら「オン」）。⑤ 解析キャッシュ（IndexedDB `trk_analysis_cache_v1`）を追加：保存は rms・onset・ratio の配列と数値だけ（PCM なし）。ratio を入れたのは、既定の譜面作り方が ratio を使い、外すと譜面が変わるため（利用者が選んだ）。
- **2026-10-08 — Service Worker（レビュー7・trk74）：** ハッシュ固定の vendor（`assets/vendor/`、100 ファイル）だけを cache-first にした。キャッシュの中身は、`sw.js` の `VENDOR_PINS`（`tools/vendor-lock.json` の SHA-384、`tools/sw-vendor-pins.mjs` で生成）と合うものだけ使う。合わなければ通信し、オフラインでは 503。セーフモード（`?safe=1`）はキャッシュを読まない（従来どおり）。あわせて、セーフモードの判定が効いていなかった既存の欠陥（当時の `SECURITY.md` ではF-20、2026-10-09の現行一覧ではF-19に統合）を直した：ナビゲーションの要求の `event.clientId` は空なので、`event.resultingClientId` を使う。確認：check-repo の検査（逆検証 5 件とも失敗）、headless（SW の CDP で通信件数）：2回目の取得は通信 0、偽物は拒否して取り直し、オフラインの偽物は 503、オフラインの正しいキャッシュは 200、セーフモードは通信し、オフラインは 503。修正前の 1 行に戻すと、セーフモードのオフラインが 200 になることも確認。
- **2026-10-08 — 入口の整理 その3（レビュー6・trk73）：** 「一部／要確認」の4件を判断した。タブ帯の ⚙（`tabSettingsMenu`、長押しと同じメニュー）、スキンツールの「⚙ くわしい設定」（`openSpecSettings`、長押しの判定 `typeof openSettings` を除去して、長押しでも設定を開くようにした）、曲リストの見出しの「📚 書斎を開く」（`studyOpenBtn`）を付けた。3つとも `moreBtn`（設定 showMoreBtns で隠せる）。Esc は設定の「🛟 緊急復旧」→「セーフモード」が既存なので変えない。check-repo に検査を追加（逆検証 3 件とも失敗を確認）。headless の probe（⚙ でメニュー、書斎ボタンで開く、⚙ くわしい設定で specPanel が開く、設定オフで3つ消える）、ページエラーなし。
- **2026-10-09 — 英語ガイドの全節（trk92）：** `docs/guide/en.md` に、日本語版の全節（start・play・controls・appearance・sound・spectrum・study-room・packs・mobile・environment・mods・files・security・credits）の英訳を追加した。目次つき。リンクは全件解決を確認。`appearance.md` の MMD 確認の文言（CDN）も同梱の表現に直した。英語版は日本語版の翻訳で、正は日本語版（§10 の項目）。**未確認**：英語の表現の母語話者による確認。
- **2026-10-09 — 残りの注意点の整理（trk92）：** ① 英語ガイド `docs/guide/en.md` に「Difficulty names and Lv」の節を追加（日本語版 play.md と同内容）。② 3D部品（three.js・three-vrm・three-mmd-loader）は `assets/vendor/` に同梱し、importmap もローカルを指す（CDN へ接続しない）。古い記述を直した：`js/mmd.js` の注釈、`docs/android.md` の制限4、MMD の確認・エラー文言（4言語。「CDN」→「3Dの部品」、オンラインへの案内を削除）。③ `sw.js` のキャッシュ名を `trk-v2026.10.9-trk92` に更新。確認：`npm run check` 全件通過（テスト 94/94）、`git diff --check`。ヘッドレスのブラウザは環境にないため、文言の表示と MMD の読込は実機で未確認（§7）。
- **2026-10-08 — 入口の整理 その2（レビュー6・trk72）：** 表示の段階を入れた。設定「表示の並び」（かんたん＝既定・おすすめ順／全部＝従来の順）で、棚スキンの上位6つ（プレーヤー・カセット・レコード・ノート・カラオケ・レトロ）を先頭にし、映像フィルターはカテゴリとプリセットの並びを変える（`libSkinOrder()`・`tvGroups()`・`tvPresetsOf()`。数は変えない）。映像フィルターは起動時に組み立てるので次の読み込みで反映。設定「🔧 開発者表示」（既定オフ）で、Loop Lab（クイック・保存・プリセット。A-B の基本操作は残す）と投稿者ツールの行を隠す。**trk71 の欠陥を修正**：▶ が `window.openMedia`（存在しない名前）を呼んでいた → `window.TrkMediaPlayer.open()`。check-repo に「表示の並び・開発者表示」の検査を追加（逆検証 3 件とも失敗を確認）。ガイド `appearance.md` を更新。`globals-baseline` を宣言 1173 に更新（意図した追加 1 件）。確認：npm run check、smoke --compare（boot 0・未解決 0・譜面 10 一致・クリックエラー 0）、headless の probe（表示の並び・開発者表示・再読み込み保持・投稿者ツールの行・ループ・ラボ・▶ の実クリック、ページエラーなし）。**カスタムラボの2入口を開発者表示へ**（「🎨 カスタムTVスキンを作る」・「＋ スキンを追加・編集」）。**譜面作成は既存の入口ではなく新機能の案**（§9）。英語ガイド `en.md` は未更新（※ 2026-10-09 に「難易度名と Lv」の節を追加し、2026-10-09 の後続作業で全節を追加した）。実機未確認（§7）。
- **2026-10-08 — 入口の整理 その1（レビュー6・trk71）：** 長押しでしか開けなかった2つに、見えるボタンを付けた。① 曲の行の 🎶（`js/library.js`：曲のプロフィール）、② テレビの「くわしく」欄の「▶ メディアプレーヤーを開く」（`js/tv-dock.js`：電源の長押しと同じ `openMedia`）。長押しは残す。設定「👆 長押しの代わりのボタンを出す」（`showMoreBtns`、既定はオン）で両方を隠せる（`body.noMoreBtns`）。文言は4言語。ヘッドレス確認：🎶でプロフィールが開く・▶で `openMedia` が呼ばれる・設定で隠れる／戻る（ページエラーなし）。検査：配線の有無（逆テストで失敗を確認）。洗い出しは `docs/LONG-PRESS-AUDIT.md`。
- **2026-10-08 — README の分割（レビュー5）：** README を約 98KB から約 6KB に絞った（3ステップ・5つのプレイ方法・関連資料・感想・ライセンスの要点・英語の要約）。くわしい説明は `docs/guide/`（目次 `index.md` ＋ 14 ファイル、英語全文 `en.md`）へ移した。移動の際は、見出しを一段上げ、相対リンクを直し、全リンク（108件）が解決することを確認した。検査：内容を見る検査は README と `docs/guide/` を合わせて読む（`readReadme()`）。リンクの有無を見る検査（privacy・credits・pack-format・SECURITY・QUALITY-CHECKS）は README 本体で見る。新しい検査：README は 12KB 以下、`docs/guide/` の全ファイルは目次に載る（両方とも逆テストで失敗を確認）。GIF は未追加（録画が必要）。公開コードは変えていないため、キャッシュ名は trk70 のまま。
- **2026-10-08 — 名前空間 段階 E（レビュー4）：** `docs/ADDONS.md` §0 に、使ってよい窓口（`api`・`TrkAddons`・`TrkFX`）と内部（`window.Trk.*`・旧来の大域名・即時関数の中の名前・内部イベント）を分けて明記。`api` の鍵が文書に全て載っているかを `tools/check-repo.mjs` で検査（逆テストで失敗を確認）。文書の誤り（`tvSkin`→`skin`）と不足（`api.id`・`api.apiVersion`・`TrkAddons.register`・`docs`）を修正。公開コードは変えていないため、キャッシュ名は trk70 のまま。
- **2026-10-08 — 名前空間 `screen` の決定（レビュー4・trk70）：** 利用者の選択（c）により、`window.screen`（ブラウザ標準）の定義を `js/core.js` から外した。`window.Trk.core.screen` は残す（内部の画面状態の読み書き先）。検査 `tools/check-repo.mjs` に「`js/core.js` が `window.screen` を定義しない」を追加（定義を戻す逆テストで失敗を確認）。大域の名前は 317→316。監査の `public` 316→181 は、D の書き換えで裸の参照が `window.Trk.<領域>.X` に移ったための見え方の変化（宣言数は変わらず 1171）。スモーク OK、`npm test` 44/44、overlay・regress のヘッドレス確認 OK。
- **2026-10-08 — 譜面生成（レビュー1）：** 自動譜面を `js/chart-gen.js` の純関数へ分離。旧方式はca84a19の出力と140件ビット一致（ゴールデン）、新方式（`chartGen` "2"）は局所正規化・8小節区間配分・冒頭無音の判定の改善。`npm test` を追加。既定を新方式へ変更し、旧方式の記録に印を付けた。
- **2026-10-08 — 名前空間 D 段階（レビュー4）：** 領域ごとに `window.Trk.<領域>` へ登録し、呼び出し側を書き換える（AST で判定、凍結ファイルは書き換えない）。旧名の `window.X` は別名として残す。第 1 段階は chart（`buildChartNotes`・`cgEstimateLevel`・`cgAllocate` を登録、`js/media.js` の 2 箇所を書き換え、`trk57`）。第 2 段階は pad（`padBack`・`updatePadUI`、書き換えなし、`trk58`）。第 3〜5 段階は lite（`trk59`）・main（`trk60`）・custom（`trk61`）。custom の追補（`trk62`）：代入の左辺が書き換えられていなかった分（`verified.js` の 4 箇所）を直した。第 6〜9 段階は media（`trk64`）・data（`trk65`）・play（`trk66`、登録は render.js の末尾）・modes（`trk67`、登録は catch.js の末尾）。第 10 段階は core（`trk68`、116 名・書き換え 6013 箇所）。Study の別名 `window.Trk.study`（`trk69`）。11 領域の登録は完了。`screen` の扱いは未決（利用者に確認）。登録の検査は `tools/check-repo.mjs` の `TRK_REGISTRARS`。
- **2026-10-08 — 名前空間の回帰修正（レビュー4・B段階の欠陥）：** 後から読み込まれるファイルが代入で差し替える関数（`renderLib`・`installPackFile`・`chartToData`・`showJudge`・`activeMods` など計14件）は、B段階で窓に値のコピーとして載っていたため、ファイル内部の呼び出しに差し替えが届かなかった（例：`verified.js` の `renderLib` 差し替え＝一覧の ✔ 表示は、ライブラリ内部の再描画では働かなかった）。窓の名前を get/set のアクセサにして解消（`trk55`：5件、`trk56`：残り9件。計14件の関数）。ヘッドレスChromiumで、窓の差し替えが内部の `renderLib` 呼び出しに届くこと（旧版 `ca84a19` と同じ 1 回）を確認。`tools/check-repo.mjs` に検査を追加し、アクセサを値のコピーへ戻すと落ちることを確認。
- **2026-10-08 — 名前空間 B 段階（レビュー4）：** 他から使われない名前を、ファイルごとに即時関数で包んだ（18ファイル、コミット `14393f9`〜`dc6ec0f`・`c322526`〜`1122f98` の間）。公開名は `window` に据え置き（`let` は get/set）。包んだあと、スモーク `--compare`（譜面10件・未解決の名前0）、`npm run check`・`npm test` はすべて通した。監査は包みの中の宣言も数えるように直した（大域に残る名前：1169→317）。**未確認（HANDOFF §7 へ）：** 実機（Android Chrome）での実曲の操作・音・画面は未確認。スモークは押したボタンの経路だけ。`screen` は標準の `window.screen` と同じ名前で、段階 D で改名する。
- **2026-10-08 — 名前空間 C 段階（レビュー4）：** 書斎・メディアプレーヤー・シンスの開閉の旗（旧 `window._trk*Open`）を `window.Trk.overlay`（`set`・`is`・`any`）に集約。読み手21箇所・書き手7箇所を書き換えた。凍結の `js/fx.js` は書き換えず、読み取り専用の互換アクセサ `window._trkStudyRoomOpen` を core.js に残した（fx.js の 1 箇所が読む）。検査（`check-study-room`・`check-repo`）を新しい書き方に合わせ、旧い旗が残ると落ちる検査を追加（旧コードで落ちることを確認）。ヘッドレス Chromium で開閉の反映を確認。**未確認（HANDOFF §7）：** 実機での書斎・シンスの鍵止めの体感。
- **2026-10-08 — 名前空間の準備（レビュー4）：** 棚卸し `tools/globals-audit.mjs`（宣言1169件、private 853／public 316、衝突0、window 経由の連携26）、実ブラウザのスモーク `tools/smoke-browser.mjs`（譜面10ケースのハッシュ・未解決の名前・ボタンのクリック）の基準を作成。計画は `docs/NAMESPACE-PLAN.md`。コードの動きは変えていない。
- **2026-10-08 — 曲名の照合（レビュー3）：** `plTitleKeys` などを `js/title-match.js` に切り出し、`tests/title-match.test.mjs`（14件）で `08_sometimes.fla`↔`08 sometimes`、SEARCH LIGHT↔SEARCH RIGHT、メモ照合、同名の取り違えを入出力で検査。変異テストで検出を確認。
- **2026-10-08 — 解析の上限（レビュー2）：** 音声解析の省略に長さ（20分）の条件を追加（`ANALYZE_MAX_SEC`）。容量超過の表示キー `analysisSkipped` が未定義だったため、4言語で定義し直した。
- **2026-10-08 — 書斎：** 本棚フォルダ／ドラッグ移動／手動順序／表示状態／ナビゲーションキー、テキストのコピー編集・自動保存・安全な新規コピー書き出し、24種の文字スキンを追加。4言語と静的回帰検査を更新。実ブラウザ・タッチ確認は未実施。
- **2026-10-08 — 公式カタログ：** VALORANT、Arknights、Genshin、OJ／SAM、Gakumas、LoL、Blue Archiveの公式リンク・権利注記・fixture／回帰検査を更新。各一覧の範囲と権利条件は§2.1を参照。
- **2026-10-07：** PR #31で集める棚・trk階層プレイリストを整備。PR #32でFIRST SPARK手づくり譜面と軽量化拡張を追加。
- **2026-10-06〜07：** PR #18/#19/#26/#27でvendor同梱、セキュリティ／アクセシビリティ検査、設定・パック容量検証を拡張。

長い旧 `NEXT_SESSION_HANDOFF.md` は本書へ統合済み。過去の細かな実装履歴・PR差分はGit履歴、検収記録は `docs/SECURITY.md`／`docs/QUALITY-CHECKS.md`、利用者向け仕様は `README.md`（概要）と `docs/guide/`（くわしい説明）を参照する。
