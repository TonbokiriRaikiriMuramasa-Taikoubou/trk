# trk! 開発引き継ぎ文書（HANDOFF）

> trk! is AGRG! — an All-Generation Rhythm Game
> 最終更新：2026-10（統合版 ＋ CATCHのニトロ缶 ＋ サウンドエフェクト完成・凍結 ＋ 公認パック ＋ 公開準備 まで）
> この文書は、新しい会話で開発を再開するための参照資料です。

---

## 0. 再開するときの貼り方（テンプレート）

```
trk! の開発を再開します。docs/HANDOFF.md を貼ります。
今回やりたいこと：（例）TRUCKにもニトロ缶を入れたい
関係しそうなファイル：（例）js/truck.js の全文を貼ります
```

- **貼らなくてよいファイル：** fx.js・fx-presets.js（🧊 凍結中。中身の約束は「7. 凍結中のファイル」にまとめてある）
- 出力ルール：**ファイルは全文で出す**（差分パッチは検索失敗が起きやすいので使わない）。小さな変更のときだけ「置き換える関数まるごと」でもよい。長い場合は回に分け、各ファイル末尾に `/* ✅ ○○.js 完了 */` を付ける。
- 途中で切れたら「続き」で、切れた行の直後から出す。
- コードは**まだブラウザで動作確認していない**前提で進めてきた。エラーは「コンソールのファイル名・行番号・赤い文字」をもらって、そのファイルだけ全文で直す。

---

## 1. プロジェクトの概要

| 項目 | 内容 |
|---|---|
| 名前 | **trk!**（小文字。旧名 Shadow-Taiko） |
| 標語 | **trk! is AGRG!** — an **A**ll-**G**eneration **R**hythm **G**ame（全世代向け） |
| 性格 | 非営利。友人と遊ぶ・MODする目的。ブラウザだけで動く（ビルド不要）。音楽プレイヤーとしても使える |
| 遊び方の核 | 手持ちの曲・動画（MP4/MP3など）を読み込むと、譜面を**自動生成**して遊べる |
| リポジトリ | https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk （名前に `!` は使えないので `trk`） |
| 公開ページ | https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/ （GitHub Pages、`main` / `(root)`） |
| 連絡先 | X https://x.com/ttrk143（ハッシュタグ **#trkAGRG**）／ GitHub Issues（フォーム：bug_report・feature_request） |
| 言語 | 日本語・英語・简体中文・한국어 |

### 名前の経緯
- 「TRK!」で検索すると *TRK - Gym Workout Tracking* という筋トレアプリがあったため、**小文字の trk!** に。osu! へのリスペクトも込めている。紹介文には「rhythm game」を添える。

---

## 2. ライセンスと権利（重要）

| 対象 | 扱い |
|---|---|
| ソースコード | **GPL-3.0-or-later**（LICENSE は全文） |
| 「trk!」の名前 | ライセンス対象外。派生版は別の名前にしてもらう（osu!と同じ考え方） |
| 初音ミク | **`js/characters/miku.js` だけ**に集約。PCL（非営利・無償）。商用派生ではこのファイルと読み込み1行を消すだけで動く |
| 利用者の曲・パック・VRM | 作者のもの。リポジトリに入れない（`.gitignore` で防ぐ） |
| 公認パックの曲・譜面・作者のことば | 作者さんのもの。GPLの対象外。曲はリポジトリに入れず、作者さんの配布ページに置く |
| three.js / three-vrm | MIT（VRM使用時のみCDNから読み込み。three 0.180.0 / three-vrm 3.5.5） |

- 以前のREADMEにあった「GPLで販売禁止」「osu!と同じGPL」は**誤り**として訂正済み（GPLは販売を禁止できない／osu!のコードはMIT）。
- PCLクレジットには「PCLによる許諾の旨・PCLのURL・キャラクター名・会社名」を表示（miku.js があるときだけ）。
- **譜面の方針：既存ゲームの譜面・名前・画像・キャラクターは使わない。** 内蔵の譜面は自動生成のみ。**作曲家さん・譜面作者さん本人が作った／認めた譜面は配ってよい**（公認パック）。
- 公認の権利チェック（ボカロ曲・東方アレンジなど）は `docs/verified.md`。

---

## 3. 機能の歴史（だいたいの順番）

1. **Shadow-Taiko**：ドン／カッ2ボタン、譜面自動生成、スキン、VRM、`.stpack`パック
2. **統合版（複数ファイル化）**：選曲画面、曲ごとのBPM/オフセット/Seed記憶、プレビュー、曲パック
3. **TRUCK🚚**、名前を **trk!** に
4. **GPL＋NOTICE、ミクの分離**（`registerMascot`）
5. **上級者向け設定**：3・2・1・GO!、初期キー A/Space、サブキー、` 長押しリトライ、-/= オフセット、HIDDEN/SUDDEN、再生速度、判定の厳しさ
6. **TRUCKの操作設定**
7. **ORBIT🪐**：ADOFAI風 → **Gitaroo Man風**に作り直し
8. **体力モード**と**称号**
9. **速度別ハイスコア**、速度パネル、速度キー
10. ORBITの見た目（判定点の形、恒星）
11. **STAGE🎪**（ユメステ参考）、PERFECT✦、ステージ演出、カーテンコール
12. **AUTOをトグル化**、シードを探す道具
13. **player.js**：10秒スキップ、再生バー
14. **定番機能を一括追加**：オフセット測定・自動微調整・判定統計・区間リピート・RANDOM/ANTI-ROLL・ゴースト・背景の暗さ/ぼかし・ラジオ・**CATCH🚛**
15. **統合版を9回に分けて全文出力**
16. **CATCHの障害物を廃止 → ニトロ缶🚀（ぶっ飛ばしモード）**、常時ぶっ飛ばしSeed
17. **隠しSeedの整理**：下ネタ系を削除、言葉を含むSeed（olivier/nightmare/lunatic/hentai → MASTER、1919/go → Lv.10）
18. **公開準備**：README・連絡先・Issueフォーム・`.nojekyll`・`.gitignore`・OGP・PWA（manifest・sw.js）・アイコン3案・CONTRIBUTING.md
19. **🎛 サウンドエフェクト**（fx.js）：EQ・エフェクター・ゲーム連動・マイプリセット → タイミング自動補正・譜面/記録への保存 → プリセット**115個で打ち止め** → 検索・お気に入り・最近・前後/おまかせ・元の音と比べる・`TrkFX` 窓口を足して**凍結**
20. **✔ 公認パック**（verified.js / verified.json）：SHA-256照合、譜面作者・BPM表示、作者のことば（280まで）
21. **index.html・README.md・HANDOFF.md を最新に整理**
22. **📺 映像出力（TVドック）**：`tv-presets.js` に映像フィルター45種、`tv-dock.js` にTVスキン30種（物理デコ・専用CSS）・電源/一時停止・お気に入りスロット・並び替え。家庭用TVの▲▼で映像切替、壁掛けTVはヘッダーへ移動
23. **🛟 緊急復旧**：`?safe=1`／`?reset=tv|audio|notes|all`／`?export=…`、コンソールの `trkReset`／`trkExport`、設定画面の緊急復旧パネル、隠しトリガー、フローティングボタン、バナー表示
24. **🎨 カスタムTVスキン**（`tv-dock.js` の `#tvMaker`）：色6つ・形4つ（ボタン数/列/角の丸み/画面のふち）・物理デコ28種・質感3つ（光/反射/走査線）を触って自分のテレビを作れる。ライブプレビュー、`trk-tvskin` で書き出し/読み込み、`trk_tv_skins_v1` に最大30個
25. **🎬🖼 選曲中にmp4を流す**：曲を選ぶと、TVドックの画面にそのmp4が映る（`tvMenuPreview` 初期オン）。「くわしく」に **🎛 設定 / 🖼 確認** のタブを足して、確認タブではゲーム画面と同じ見え方（contain）でフィルター・スキン・暗さ・ぼかしを再生前に確かめられる。音のプレビューがオフでも映像だけ流す `tvMenuVideo`（音なし）も追加
26. **📺◀▶ 曲送りボタンと TV→ラックのならべ方**：TVドックの上段に ◀ ▶（前の曲・次の曲。端は回り込み、液晶に `♪ 曲名`）。選曲画面の並びを **TV →（お気に入り）→ ラック →（お気に入り）→ TVくわしい → ラックくわしい** に（`applyOrder()` が各ドックの `<details>` を列の下のほうへ並べ直す。壁掛けTVのときは本体だけヘッダーへ）。お気に入り行に「お気に入りn個・ボタンm個」を表示

---

## 4. 着想元（どこから来たか）

| 機能 | 着想元 | trk!での形 |
|---|---|---|
| 全体・パック・スキン・MOD文化 | **osu!** | `.stpack`（ZIP＋pack.json）。名前とコードのライセンスを分ける考え方も |
| MANUAL🥁 | 太鼓系 | ドン／カッ2ボタン |
| TRUCK🚚 | オリジナル | 譜面の上をトラックが走る。全世代向け |
| ORBIT🪐 | **Gitaroo Man**（Trace Line がくねくね曲がって中央の点に流れ込む）。初期案は ADOFAI | うねる1本の道が四方八方から中央へ。見えている範囲は交差しない。ワンボタン |
| ORBITの判定点の枠 | osu!taiko | 惑星／リング／四角／ひし形／ターゲット／ブラケット |
| 速度別記録🏁 | **ADOFAI の Speed Trial** | 1.05x以上は速度ごとに別ハイスコア＋最高クリア速度。スコア倍率なし |
| STAGE🎪 | **ワールドダイスター 夢のステラリウム（ユメステ）** | 縦レーン4/5/6、隣レーン判定、盛り上がりで光る区切り、PERFECT✦ |
| カーテンコール | ユメステのサービス終了（2023-07-26〜2026-09-29） | Seedで幕と紙吹雪。譜面は自動生成のまま |
| 隠し難易度の言葉 `olivier` | ユメステの最高難易度 | 今の最高難易度 MASTER（765）と同じ扱い |
| 揺れ・区間リピート・判定統計 | SOUND VOLTEX | |
| オフセット測定・背景の暗さ | osu! | |
| 自動微調整・ゴースト | beatmania IIDX | |
| RANDOM / ANTI-ROLL | EZ2ON | STAGEの配置オプション |
| ラジオ📻 | DJMAX | |
| CATCH🚛 | osu!catch | 障害物は廃止し**ニトロ缶🚀**に |
| サウンドエフェクト | 音楽プレイヤーのEQ／osu!のMOD文化 | プリセット115個、ゲーム連動、JSON（trk-fx）で共有 |
| 公認パック | 作曲家さんからの寄稿を想定 | SHA-256＋オーナーだけが書ける verified.json |
| 体力の名前 trk!🐔 | 「チキンレース」 | 1ミスで終了 |

---

## 5. 設計の方針（守ってきたこと）

- **全世代向けのやさしい初期値**：揺れオフ、レーン色付け8%、体力Standardは多め、隣レーン判定オン、エフェクトはオフ。
- **好みが分かれるものは設定で選べる**が、増やしすぎない。
- **記録の公平さ**：
  - 簡単になる設定（判定「ゆるめ」、1.00x未満、シーク・区間リピート・途中の速度変更、常時ぶっ飛ばし）は**練習扱い**
  - 難しくなる設定（HIDDEN/SUDDEN/きびしめ、RANDOM）は記録対象。MODSに表示
  - AUTOは記録・称号・体力なし
  - Seedで決まるもの（ニトロ缶の位置など）は全員同じなので記録対象
  - サウンドエフェクトは記録に影響しない（履歴に名前だけ残す）
- **互換性**：保存場所や形式名は Shadow-Taiko 時代の名前を**変えない**。
- **動きを減らす設定**（prefers-reduced-motion）を尊重する。
- **キャラクターは registerMascot で外付け**。権利物は1ファイルに閉じ込める。
- **既存ファイルを書き換えずに、関数を包んで機能を足す**やり方を使ってよい（stage.js・catch.js・stagefx.js・fx.js・verified.js がしている）。
- **内蔵の音のプリセットは115個で打ち止め**（個人製作者の作る余地を残す）。今後は作者名表示・共有・紹介の仕組みを優先。
- **外から読み込むJSON（パック・trk-fx・verified.json）は、決められた項目と範囲だけを受け付け、プログラムは実行しない。** 文字は textContent で表示する。

---

## 6. ファイルの役割と読み込み順

```
trk/
├─ index.html  manifest.webmanifest  sw.js  verified.json  .nojekyll  .gitignore
├─ README.md  NOTICE.md  CONTRIBUTING.md  LICENSE
├─ css/style.css   icons/（icon.svg・icon-192.png・icon-512.png）   tools/make-icons.html
├─ docs/  HANDOFF.md  verified.md  og.png
├─ .github/ISSUE_TEMPLATE/  bug_report.yml  feature_request.yml  config.yml
└─ js/
```

**読み込み順（この順番が前提）**

| # | ファイル | 役割 |
|---|---|---|
| 1 | i18n.js | 共通の文章、`tr()` |
| 2 | i18n-options.js | 🎯プレイオプションの文章 |
| 3 | data.js | スキン、レイアウト、難易度、`registerMascot`、`EGG_KEYS`・`EGG_WORDS`（隠しSeed） |
| 4 | characters/miku.js | 初音ミク（PCL）。消しても動く |
| 4.5 | tv-presets.js | 📺 映像フィルターのプリセット（`TRK_TV_PRESETS`、45個。core.js が使うので core より前） |
| 5 | core.js | `settings`、状態変数、合図 `on/emit`、`videoFilter`、`renderModsLine`、`seedEggs`、画面切り替え |
| 6 | player.js | AUTO/練習中の10秒スキップ・区間リピート。**各モードより先にキーを取るため core の直後** |
| 7 | media.js | 読み込み・音声解析・譜面生成・SE |
| 8 | game.js | 進行・判定・時計・カウントダウン・AUTO・記録 |
| 9 | render.js | 描画・マスコット・`ownField()`・`showToast()`・`loop()` |
| 10 | custom.js | ノーツ設定・スキン作成・パック・曲パック |
| 11 | truck.js | 🚚TRUCK・レーン色付け・揺れ（`reduceMotion`） |
| 12 | modes.js | 🪐ORBIT・体力・称号・**設定画面の部品関数** |
| 13 | stage.js | 🎪STAGE（配置・RANDOM・判定・描画・設定） |
| 14 | stagefx.js | 🎭ステージ演出・判定文字・AP/FC表示・カーテンコール |
| 15 | catch.js | 🚛CATCH・🚀ぶっ飛ばし・常時ぶっ飛ばしSeed |
| 16 | extras.js | オフセット測定・自動微調整・判定統計・ゴースト・背景の暗さ/ぼかし |
| 17 | fx-presets.js 🧊 | 🎛 内蔵プリセットのデータ（`TRK_FX_PRESETS`、115個） |
| 17.5 | fx-dock.js | 🎛 さわれる本体（スキン7種・⏻ミュート・📡アンテナ＝バックグラウンド再生・ボタン長押し登録・3種ランダム・EQロック）、Media Session
| 17.7 | tv-dock.js | 📺 映像出力のTV風ドック（スキン30種＋🎨カスタムTVスキン、電源・お気に入り・並び順） |
| 18 | fx.js 🧊 | 🎛 サウンドエフェクト本体（「7. 凍結中のファイル」参照） |
| 19 | library.js | 選曲画面・AUTO/ラジオ・シード道具・プレビュー |
| 20 | verified.js | ✔公認パック（SHA-256と verified.json の照合、作者名・BPM・作者のことば） |
| 21 | main.js | 入力・イベント・**起動処理**（`packsReady`）、サービスワーカー登録 |
| 22 | speed.js | ⏩速度パネル・速度キー（main の後） |
| 23 | vrm.js | 🧍VRM（`packsReady` を待つ） |
🧊＝凍結中（しばらく触らない。会話に貼らなくてよい）

---

## 7. 🧊 凍結中のファイル（fx.js・fx-presets.js）

**中身を貼らずに開発を続けるための要約です。** この2ファイルを変えたくなったときだけ、全文を貼ってください。

### 音の通り道
```
video → [プリセット] → [かんたんEQ 5バンド] → [ゲーム連動] → [音量] → ([リミッター]) → [出口 G.out] → スピーカー
```
- エフェクトを**一度もオンにしなければ、音の通り道は変わらない**（`createMediaElementSource` を呼ばない）。
- 一度オンにした後は、オフでも素通しの通り道のまま（戻すにはページ再読み込み）。
- **`createMediaElementSource(video)` は一度だけ。** 音を使う新しい機能（波形・スペクトラム表示など）は、**自分で作らず `TrkFX.tap()` を使う**。

「7. 凍結中のファイル」：fx-dock.js は、fx.js が作る #fxQuickPanel（中の select）・#fxPanel（最初の5つの range がEQ、[data-i18n="sfxEqReset"]）を使っているので、fx.js の画面を変えるときは fx-dock.js も直すこと。

### ほかのファイルとの約束
| 種類 | 内容 |
|---|---|
| **包んでいる関数** | `gameTime`（game.js）：エフェクトの遅れ分を引く。`chartToData`・`applyChartData`（media.js）：譜面に `fx` を書く／読む |
| **使っている関数・変数** | `getAC` `video` `settings` `prefs` `num` `on` `emit`(なし) `tr` `el` `$` `setStatus` `saveUserPrefs` `downloadJSON` `safeName` `chartMeta` `phase` `stats` `lifeState` `songRec` `saveRecords` `videoReady` `isCatch` `isBlast` `catchState` `TAU` `lang` |
| **聞いている合図** | `beforePlay` `records` `chart` `language` `screen` |
| **画面に足す場所** | 設定画面：「🔊 サウンド」の欄の直後に `#fxPanel`。選曲画面：`#playBtn` の直後に `#fxQuickPanel`（speed.js のパネルより上に来る） |
| **文章キー** | すべて `sfx…`（stagefx.js の `fx…` と重ならないように） |
| **CSSクラス** | `.fxSearch` `.fxCat` `.fxSeg` `.fxMini` `.fxCompare` `.fxQuickSelect` `.fxQuickCompare` `.fxEditor` |

⚠ **game.js の `gameTime`、media.js の `chartToData`・`applyChartData` の名前や引数を変えるときは、fx.js も直す必要がある。** `const` に変えると包めなくなるので、`function` 宣言のままにする。

### 窓口 `window.TrkFX`（version 2）
| 呼び方 | 返すもの |
|---|---|
| `TrkFX.list()` | `[{ id, cat, name }]` |
| `TrkFX.current()` | 今のエフェクト（trk-fx のコピー）。オフなら `null` |
| `TrkFX.apply(json)` | trk-fx を使う。成功したら名前、失敗したら `null` |
| `TrkFX.select(id)` | プリセットを選ぶ（true / false） |
| `TrkFX.next()` `prev()` `random()` | 前後・おまかせ |
| `TrkFX.off()` | オフにする |
| `TrkFX.clean(json)` | 確かめて整えた trk-fx（正しくなければ `null`） |
| `TrkFX.delayMs()` | 今の自動補正（ms） |
| `TrkFX.tap(fftSize)` | エフェクト後の音の `AnalyserNode`（使えなければ `null`）。使い終わったら `disconnect()` |

### 設定（`settings` の中、`shadow_taiko_preferences_v2` に保存）
`fxOn` `fxPreset` `fxEq`（5つ、±12dB） `fxVolume`（-12〜+6dB） `fxLimiter` `fxComp` `fxCompExtra`（±50ms） `fxRecord` `fxChartLoad` `fxGame`（miss/combo/pinch/blast/pan） `fxFav`（最大40） `fxRecent`（最大5）

### trk-fx 形式（マイプリセット・譜面の `fx`・履歴の `fx`）
```
{ format:"trk-fx", version:1, name, author?, url?(https), id?(内蔵), chain:[最大16], eq?:[5], volume? }
```
- エフェクトの種類：`eq comp gain width vocalCut delay reverb drive lofi pump tremolo autopan sweep ringmod chorus noise crossfeed`
- マイプリセットは最大30個、`trk_fx_presets_v1` に保存。

### 機能の一覧（凍結時点）
- プリセット115個（基本10・ジャンル16・シーン20・空間17・ゲーム15・おもしろ21・ちょっと変16）、マイプリセット
- 検索（4言語の名前・説明・作者名）、分類ごとの折りたたみ、★お気に入り、🕘最近使った
- 選曲画面のメニュー：◀ ▶ 🎲、👂 押している間だけ元の音
- かんたんEQ・音量・リミッター、ゲーム連動5種
- タイミング自動補正：`baseLatency` ＋ コンプレッサー/リミッター1つにつき約6ms ＋ 微調整。⌨ 操作の補正とは別に足す
- 譜面のExportに `fx` を記録・Import時に使う、プレイ履歴に記録・「このエフェクトを使う」で戻す
- 切り替えの瞬間は出口を一瞬絞ってプチッという音を防ぐ
- 音程・再生位置を動かすエフェクトは入れない（譜面とずれるため）

---

## 8. ファイル間の約束（壊さないための参照）

### 合図（core.js の on/emit）
`language` `skin` `chart` `phase` `screen` `options` `beforePlay` `beforeLoad` `mediaReady` `records` `packsChanged`

### 他のファイルから使われる主な関数・変数
| 定義場所 | 名前 |
|---|---|
| core.js | `settings` `prefs` `pick` `num` `validCode` `el` `setStatus` `slotOfKey` `slotLane` `laneCol` `laneColor` `windows()` `travelMs()` `activeMods` `modsUnranked` `renderModsLine` `videoFilter` `updateTouchKeys` `syncPickers` `seedEggs` `refreshSeedSecrets` `downloadJSON` `safeName` `KEY_PRESETS` `PLAY_MODES` |
| media.js | `getAC` `chartToData` `applyChartData` `importChartFile` `generateNotes` `rmsAt` |
| game.js | `startGame` `pauseGame` `resumeGame` `toTitle` `endGame` `judgeNote` `handleInput` `seekTo` `gameTime` `currentAcc` `currentScore` `runUnranked` `rateKey` `songRec` `chartKeyOf` `records` `saveRecords` `renderRecords` `PLAY_KEYS` `MODE_PLAYS` `leadIn` `pausedInLeadIn` `showJudge` |
| render.js | `rr` `beatPulse` `noteAlpha` `showToast` `ownField` `layout` `retryHoldAt` |
| custom.js | `packDB` `installPackFile` `sanitizeSong` `getPackSongs` `renderPackList` |
| truck.js | `isTruck` `truckPosKeys` `TRUCK_PRESETS` `truckBinding` `syncTruckKeyUI` `reduceMotion` `laneTilt` `lanePivot` |
| modes.js | `makeSeg` `makeCheck` `makeColorRow` `hintEl` `isOrbit` `lifeState` `lifeRule` `lifeTags` `resetLives` `failSound` `titleString` `songTitles` `TITLE_MODES` `starPath` `ORBIT_IGNORE` |
| stage.js | `isStage` `stageKeys` `stageMap` `ensureStageMap` `stagePress` `stageBinding` `STAGE` |
| catch.js | `isCatch` `isBlast` `catchState` `catchAllKeys` `CATCH` `catchJudge` `resetCatch` `catchHitPos` |
| fx.js 🧊 | `window.TrkFX`（上の表） |
| tv-dock.js | `window.TrkTV`（version 2：`list()` `skins()` `skin()` `selectSkin(id)` `current()` `select(id)` `next()` `prev()` `random()` `off()` `on()` `toggle()` `filter()` `overlay()`）、`applyOrder()` `tvSlotCount()` `tvSlotCols()` `settings.tvDockSkin` |
| library.js | `renderLib` `renderBanner` `refreshPackSongs` `currentSong` `libView` `LIB_SHOW` |
| main.js | `RESERVED` `poke` `syncOptionsUI` `packsReady` `showFxPower` |

### 関数を包んで機能を足しているところ（上書きの順番に注意）
| 包むファイル | 包まれる関数 |
|---|---|
| stage.js・catch.js | `activeMods`（RANDOM・∞BLAST を追記） |
| stagefx.js | `showJudge`（FAST/SLOWの表示範囲） |
| fx.js 🧊 | `gameTime`、`chartToData`、`applyChartData` |
| tv-dock.js | `videoFilter`（映像フィルター45種＋背景の暗さ/ぼかし）、`drawVideo`（スキャン線・額縁などのオーバーレイ描画） |
| verified.js | `installPackFile`（SHA-256を保存）、`sanitizeSong`（作者のことば）、`getPackSongs`、`renderPackList`、`renderLib`、`renderBanner` |

関数を包むには、`function` 宣言か `let` で作られている必要がある（`const` は上書き不可）。

：fx-dock.js は document の visibilitychange をキャプチャ段階で先に受け取り、アンテナが立っていて続けてよい場面では stopImmediatePropagation() する（library.js・main.js より先に読む必要がある）。グローバル関数の nextSong・selectSong（library.js）を使っている。

### 🎨 カスタムTVスキン（tv-dock.js）
- 作る画面は設定画面の `#tvMaker`（index.html に素のHTML、配線は tv-dock.js の `setupTvMaker()`）。
  TVドックの「くわしく」にある `🎨 カスタムTVスキンを作る`（キー `tvmOpen`）で開く
- 定義 `trk-tvskin`：
  `{ format, version, name, colors:{body,bezel,screen,button,accent,text}, shape:{n(3-8), cols(1-4), radius(0-40), bezel(0-16), deco, glow, glare, scan} }`
- 保存先は新しいキー `trk_tv_skins_v1`（最大30個）。IDは `custom_tv_…`。
  **TV_DOCK_SKINS に同じ形で登録する**ので、`render()`・`buildDeco()`・スロット数・スキン一覧はそのまま使える
- 見た目は CSS 変数（`--tv-body` `--tv-bezel` `--tv-screen` `--tv-button` `--tv-accent` `--tv-text` `--tv-radius` `--tv-bezelw` など）で流し込む。
  CSS は `#tvDock.tvCustom …` と `#tvmPreview.tvCustom …` を並べて書く（`#tvDock .tvKey` は id+class なので、クラスだけでは勝てない）
- 飾り（deco）は `TV_DECO_KEYS`＝内蔵スキンの `buildDeco()` の分岐名。増やすときは buildDeco() と TV_DECO_KEYS の両方へ。
  走査線は画面の中の `<i class="tvScanlines">`（`[data-scan="1"]` のときだけ出る）
- 知らないスキンID（古い設定・壊れた設定ファイル）は「home」として描く（`render()` の `skinId`）
- 文章キーは `tvm…`（4言語）。座標や色は `paintTvVars()` に集約
- 動作確認は jsdom でもできる（`node --check` だけでは配線ミスが出ないため）

### 📺◀▶ 曲送りボタンと、TV→ラックのならべ方（tv-dock.js）
- **◀ ▶**：`.tvTop` の中の `.tvSong`（⏻ と ⏸ の間）。`songStep(dir)` は **library.js の `nextSong()` / `prevSong()`** に任せる（ラジオと同じ並び。`libView` → 無ければ `allSongs()`）。
  端は回り込み（`prevSong()` は新設：`(i-1+len)%len`）、`phase !== "title"` のときは何もしない（ゲーム中に曲が飛ばないため）。選んだら液晶に `♪ 曲名`
- **ならべ方**：`applyOrder()` が `dockParts()` で `#tvDock`・`#fxDock` と、その中の `<details>`（`.tvMore` / `.dockMore`）を拾い、
  **TV →（お気に入り）→ ラック →（お気に入り）→ TVくわしい → ラックくわしい** の順に `.songCol` へ並べ直す（`anchor.after()` は要素の移動になる）。
  くわしい欄は**ドックの外**へ出るので、2回目以降は `.songCol > details.…` から拾う（`pick()`。これを忘れると整列のたびに迷子になる）。
  壁掛け（`tvDockSkin==="wall"`）のときは**本体だけ**ヘッダーへ移し、くわしいは列に残す。上下入れ替え（`settings.tvOrder`）はテレビとラックだけに効き、くわしいは、いつも下のほう
- **お気に入りの数**：`.tvFavRow` の見出し（`.hint`）に `tvFavLabelN`（ぜんぶ入っている）／`tvFavOverflow`（あふれている）を出し分け。TVスキンを変えるとボタン数が変わるので「このTVはたくさん入る」が分かる
- **見た目**：CSSは `.tvTabs` `.tvPane` `.tvFavRow` などクラス直指定なので、くわしいをドックの外へ出しても崩れない（`#tvDock …` の子孫指定はデバイス本体にしか当たっていない）。狭い画面用に `@media(max-width:520px)` で ◀▶ を小さくする

### 🎬🖼 選曲中にmp4を流す（tv-dock.js）
- **ドックの画面**：`#tvDock .tvScreen` の中の `<canvas class="tvLive">` に、流れているmp4を `paintVideoFrame(ctx,W,H,"cover")` で描く。
  動いているときだけ `screen.dataset.live="1"`（CSSで出す／`render()` が判定）。ゲーム画面と同じフィルター（`newVideoFilter()`）とオーバーレイもかかる
- **確認タブ**：`#tvDock .tvpCanvas`（1920×1080）に `paintVideoFrame(...,"contain")` で描く。
  contain は**ゲーム画面の drawVideo と同じ**（`Math.min`＝黒帯つきで全体）。cover はTVの画面いっぱい
- **設定**（`settings`。`shadow_taiko_preferences_v2` に保存）：
  `tvMenuPreview`（🖼 選曲中のTVに映像を映す・初期オン）／`tvMenuVideo`（🎬 音のプレビューがオフでもメニューで映像を再生＝音なし・初期オフ）
- **音の扱い**：`tv-dock.js` は**音を出さない**。`settings.previewEnabled`（音ありプレビュー）がオンなら、そちらを優先して何もしない。
  自分で再生したときだけ `video.muted` を立て、止めるときに戻す（`menuMutedByUs` / `pvMutedByUs`。fx-dock の⏻ミュートを壊さないため）
- **止める場所**：`phase !== "title"` / 選曲画面以外 / タブを閉じた / パネルを閉じた / タブが隠れた（visibilitychange）
- ⚠ **`screen` の名前かぶり**：ドックを組み立てているスコープでは `const screen`（TV画面のdiv）が core.js の画面名を隠す。
  画面名が要るときは `screenName()`（モジュール先頭で定義）を使う
- 「確認」タブを開いている間は、止まっていたら音なしで再生し、閉じたら元に戻す（`pvKeepPlaying` / `pvRelease`）

### キー入力の優先順位
- `window` のキャプチャ段階で、**登録順**に受け取る：player.js → truck.js → modes.js(ORBIT) → stage.js → catch.js → extras.js(測定中) → speed.js → その後 main.js（通常段階）。
- AUTO中：各モードはキーで判定しない。←/→・R は player.js が使う。
- 予約キー：P / Esc（一時停止）、` （リトライ）、- / = （オフセット）、R（区間リピート）、[ ]（速度、変更可）。

### よくある落とし穴
- **同じファイル内で `const` を2回宣言するとファイル全体が読み込まれず、翻訳キーがそのまま表示される。**
- **`TEXT` のキーは、ファイルごとに接頭辞を付ける**（`stage…` `sfx…` `vf…` など）。fx.js の `fxTitle` が stagefx.js と重なり、見出しが両方「🎛」になった例がある。
- 後から作る設定欄は `tr()` で**作った時点の文字も入れる**。
- `practice` は `resetRun()` で false に戻るので、練習扱いは `on("phase", p => p==="playing" …)` で付ける。
- 音を使う機能は `TrkFX.tap()` から（`createMediaElementSource` は一度だけ）。
- `crypto.subtle`（公認の指紋）・File System Access・サービスワーカーは **HTTPS か localhost** でしか動かない。`file://` で開くと公認は表示されない。
- GitHub Pages は**ファイル名の大文字・小文字を区別する**。
- .screen h2 のような広い指定は、ほかの見出しの指定より強くなることがある

---

## 9. 保存データ（変えないこと）

| キー（localStorage / IndexedDB） | 中身 |
|---|---|
| `shadow_taiko_preferences_v2`（旧 v1） | すべての設定（エフェクトの `fx…` も） |
| `shadow_taiko_records_v1` | 記録 |
| `shadow_taiko_best_v1` | v7以前の自己ベスト（引き継ぎ用） |
| `shadow_taiko_song_prefs_v1` | 曲ごとのBPM/オフセット/Seed/プレビュー位置/最近のシード |
| `shadow_taiko_custom_skins_v1` | カスタムスキン |
| `trk_fx_presets_v1` | マイプリセット（形式 `trk-fx`） |
| `trk_tv_skins_v1` | 🎨 カスタムTVスキン（形式 `trk-tvskin`、最大30個。選んでいるTVは `settings.tvDockSkin`） |
| IndexedDB `shadow_taiko_packs` / `_songs` / `_library` / `_vrm` | パック（`sha256` 付き）・追加した曲・フォルダ・VRM |fxDockSkin fxDockFive fxDockOpen fxAntenna fxEqLock fxLockChain fxFavSeeded

**形式名**：`shadow-taiko-pack`、`shadow-taiko-chart`、`shadow-taiko-records`、`skin.shadow-taiko`、`trk-fx`、`trk-verified`、`trk-tvskin`（カスタムTVスキン）、譜面ファイル `*.shadow-taiko.json`

### 記録の構造（概要）
```
records[指紋 "サイズ:長さ×10"] = {
  plays, truckPlays, orbitPlays, stagePlays, catchPlays, perfectTotal, lastPlayed,
  charts: { [譜面キー]: { diff, level, plays, best, ap, fc, bestPerfect, maxRate?, rates?:{"1.25":slot},
                          truck?:slot, orbit?:slot, stage?:slot, catch?:slot } },
  history: [{ t, diff, score, acc, grade, perfect, star, good, miss, crash, mode, auto, failed, rate,
              practice, ap, fc, mods, title?, fx? }]   // 最新30件。fx は trk-fx 形式
}
```

### 譜面JSON・曲パックの追加項目
- 譜面JSON：`"fx": { trk-fx }`（設定でオン・オフ）
- 曲パックの `songs[]`：`charter`（必須）・`bpm`・`comment`（作者のことば、Xと同じ数え方で280まで）

### 公認リスト（verified.json）
```
{ format:"trk-verified", version:1,
  creators:[{ id, name, x, url, roles:["composer"|"arranger"|"lyricist"|"vocalist"|"charter"|"illustrator"] }],
  packs:[{ sha256, creators:[id], title, comment, notice, addedAt }] }
```
パックを作り直すと指紋が変わるので、登録し直しが必要。ことばだけなら verified.json の `comment` で上書きできる。

---

## 10. ルールの早見表

### 体力（modes.js の LIFE_RULES）
| モード | Standard | Knight | trk!🐔 | Infinite |
|---|---|---|---|---|
| MANUAL・STAGE・CATCH | 20開始・10コンボで+1・最大50 | 3開始・50コンボで+1・最大5 | 1 | なし |
| TRUCK | 3（50コンボで+1） | 3開始・最大5 | 1 | なし |
| ORBIT | 20（20コンボで+1） | 15（50コンボで+1） | 1 | なし |

### 称号
`🥁 MANUAL / 🚚 TRUCK / 🪐 ORBIT / 🎪 STAGE / 🚛 CATCH` ＋ `（なし）=クリア` `⚔=Sランク(95%)以上` `🐔=ノーミス`。ALL PERFECT は `🎪⭐` のように別表示。

### CATCHのぶっ飛ばし（catch.js の `CATCH`）
ニトロ缶は荷物と荷物の間の通り道に出る。効果8拍（重ねて延長）、受け止める幅2倍、移動1.6倍。出やすさ `dens = [.06, .09, .12, .15]`。

### 隠しSeed（data.js の EGG_KEYS / EGG_WORDS、core.js の seedEggs）
| Seed | 効果 | 見つけ方 |
|---|---|---|
| 143 | 隠し難易度すべて解放 | 完全一致 |
| 765 / 2000 | MASTER / 2000 RUSH | 完全一致 |
| olivier / nightmare / lunatic / hentai | MASTER を解放 | その言葉を含む |
| 1919 / go | 推定レベル Lv.10 | その文字を含む（README には載せない） |
| 20230726 / 20260929 / curtaincall | カーテンコール | 完全一致 |
| nitro / buttobi / ぶっとばし | CATCHが常時ぶっ飛ばし（練習扱い） | 完全一致 |

大文字・小文字は区別しない。

---

## 11. 技術メモ

- 画面は 1920×1080 固定座標をCSSで縮小（`fitStage`）。
- 時計：`video.currentTime` を `performance.now()` で補間。カウントダウン中は0秒より手前から進める。
- 速度変更は `video.playbackRate`（`preservesPitch`）。0.5x〜3.0x。
- ZIP展開は `DecompressionStream("deflate-raw")`。
- VRM：three@0.180.0、@pixiv/three-vrm 3.5.5（importmap）。VRM 1.0 のみ。
- フォルダ記憶は File System Access API（パソコンの Chrome/Edge、HTTPSかlocalhost）。Androidの Chrome では使えない。
- PWA：`manifest.webmanifest`（全画面・横向き）、`sw.js`（ネット優先・同じサイトのファイルだけキャッシュ）。**公開を更新したら sw.js の `CACHE` 名を変える**（例：`trk-v2026.10` → `trk-v2026.11`）。新旧のJSが混ざるときは `<script src="…?v=2026.10.1">` のように版番号を付ける。
- Xの文字数：半角1・全角2・絵文字2、上限280（verified.js の `postLength`）。

---

## 12. 残っていること・次の候補

**やること**
- [ ] ブラウザで全ファイルの動作確認（コンソールに赤いエラーがないか）
- [ ] `tools/make-icons.html` で `icons/icon-192.png`・`icon-512.png`・`docs/og.png` を作る
- [ ] GitHub Pages を公開し、About（説明・Website・Topics）を入れる
- [ ] NOTICE.md を README の「ライセンスと権利」とそろえる
- [ ✅ ] i18n.js に `feedbackLabel`（4言語）が入っているか確認（選曲画面の連絡先リンクで使う）
- [ ] Discussions を開くか検討
- [x] README・index.html・HANDOFF・連絡先・Issueフォーム・公開用ファイル一式
- [x] サウンドエフェクト（fx.js・fx-presets.js）完成 → 🧊 凍結
- [x] 公認パック（verified.js・verified.json・docs/verified.md）
- [x] 📺 TVドック30スキン・映像フィルター45種・🛟緊急復旧
- [x] 🎨 カスタムTVスキン（色6・形4・飾り28・質感3、`trk-tvskin`で共有）
- [ ] 🎨 カスタムTVスキンの実機確認（モバイル幅・壁掛け・プロジェクターとの併用）
- [x] 📺◀▶ 曲送りボタン（前の曲・次の曲）と、TV→ラック→くわしい×2 のならべ方
- [ ] 実機確認：◀▶ で曲が送られるか（端で回り込むか）／TVのすぐ下にラックが来て見やすいか／くわしい欄が下のほうにまとまって見やすいか
- [x] 🎬🖼 選曲中にmp4を流す（ドックの画面＋「確認」タブ）
- [ ] 実機確認：選曲中にTVの画面でmp4が動くか／「確認」タブの見え方がゲーム画面と同じか／音が二重にならないか
「12. 次の候補」：🎹 シンセサイザーモード。プリセットを組み上げる画面を、つまみ・スライダーで触れるシンセ風にする案です。最初のメッセージでもらったアイデアで、EQのロックとパラメーターのランダムは今回先に入れました。
**将来の大きな作業**
- Capacitor で APK 化：`READ_MEDIA_AUDIO` で端末の曲一覧、ラジオ中のバックグラウンド再生（Media Session・フォアグラウンドサービス）。配布は GitHub Releases から（Google Play は登録料と、テスター約12人×14日の条件がある）
- 公認の段階2：作者さんの鍵による署名、譜面JSON単体の公認、プリセット作者の公認
- `docs/presets.md` にみんなのマイプリセットの紹介集
- 波形・スペクトラム表示（`TrkFX.tap()` を使う）

**アイデア（未実装）**
- TRUCKにもニトロ缶🚀
- STAGEのホールドノーツ（離しても押し直せるやさしいルール）
- APS（全部PERFECT✦）の称号（例：🎪✦）
- 判定文字の位置をモードごとに保存
- 1.25x以上でノーミスした称号に🏁
- Gitaroo Man の防御パート風の「方向で色分けする道」モード
- `docs/pack-format.md`（パック作者向け仕様書）

---

## 13. 2026-10 リポジトリ統合メモ（元ソースをこのリポジトリに入れたとき）

- `trk!.zip`（元プロジェクト一式）をこのリポジトリに展開して採用しました。プロトタイプ版の `app.js` / `style.css` は削除しています（履歴には残っています）。
- **`feedbackLabel` を4言語ぶん追加**（`js/i18n.js`）。12章のチェックは「✅ 入っている」になっていましたが、実際は抜けていて、選曲画面の連絡先リンクの前に `feedbackLabel` という生の文字列が出ていました。
- **サービスワーカーの登録を `js/main.js` の末尾に追加**。6章の読み込み順の表には「main.js＝サービスワーカー登録」とありましたが、コードには入っていませんでした。これで `sw.js`（`CACHE = "trk-v2026.10.2"`）が動きます。
- `manifest.webmanifest`（全画面・横向き）・`verified.json`（空の雛形）・`.github/ISSUE_TEMPLATE/`（bug_report・feature_request・config）を新規作成しました。
- OGP画像は `tools/make-icons.html` の指示どおり **`docs/og.png`** に置きました（zip では `icons/og.png` になっていました）。`index.html` の `og:image` はそのままで合っています。
- **`.github/workflows/pages.yml` を変更**：ファイル名を並べてコピーする方式だと、新しいファイルを足すたびに公開が壊れるので、ルートを丸ごと公開する方式（`.git`・`.github`・`_site` だけ除外）にしました。`css/` や `js/` にファイルを足しても、もう直す必要はありません。
- **ブラウザでの動作確認はまだです。** 読み込み・モジュール間の約束・翻訳は機械的に確認しました（読み込みエラー0）が、描画・音・VRM・IndexedDB・公認パックは実機で見てください。
