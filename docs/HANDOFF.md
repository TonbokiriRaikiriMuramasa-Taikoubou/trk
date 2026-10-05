# trk! 開発引き継ぎ文書（HANDOFF）

> trk! is AGRG! — an All-Generation Rhythm Game
> 最終更新：2026-10-05（統合版 ＋ 公認パック ＋ 🛟緊急復旧 ＋ 🎨カスタムTV ＋ 🎬mp4 ＋ 📺◀▶ ＋ 📚棚スキン16種 ＋ 🧩アドオン ＋ 🩷MMD（💠Lat式ミク同梱・内蔵モーション25種・🎲おまかせ・選曲画面ミニ操作）＋ ⭐お気に入り ＋ ▶◀演奏中の曲送り ＋ 🥁音ゲーマー向けFAST/SLOW・あべこべ・でたらめ ＋ 💬GitHub Issuesテンプレート ＋ 📊スペクトラム（音の見える化・**見え方16種・色8種・曲名バナーのスキン・🚫使用しないスイッチ**・TVに重ねられる）＋ 🎛エフェクトチェーン編集＋ 🎹曲に合わせて演奏できるシンセモード（16音色・エレキギター／電子サックス／ZUNPET風ブラス・±8半音ピッチ・鍵盤固定オプション初期オン・大画面向け鍵盤拡張オプション・起動オプション）＋ 📤ミュージックフォルダを共有（1回の許可で一括取り込み・🔗共有をつづける・💾端末に残す・🚫やめる）＋ privacy.html ＋ Capacitor Android準備 ＋ 権利とクレジット図鑑 ＋ パック権利カード（名刺）＋ 🧭 3分チュートリアル・プレイ演出設定・CATCHニトロ得点ボーナス・▶メディアプレーヤー・🎛Loop Lab（クイック／ランダム区間・曲別プリセット）・📡キャスト／バックグラウンド再生の個別アンテナ・🖼スキンの棚（プリセット31種・グラデ対応・ごほうびスキン🎓）・🧭スタンプラリーチュートリアル（trk!入力で即完了・スキップ／もう一度・スタンプ5つでごほうび解禁）・動画キー操作まで）
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
| 利用者の曲・パック・VRM・MMDモデル・.vmd | 作者のもの。原則リポジトリに入れない（`.gitignore` で防ぐ）。MMDは再配布・MMD以外のソフトでの使用・商用を禁じる規約がほとんどなので持ち込み式。例外として、再配布OKの原文ReadMeを同梱した `assets/mmd/lat-miku/` を収録 |
| 公認パックの曲・譜面・作者のことば | 作者さんのもの。GPLの対象外。曲はリポジトリに入れず、作者さんの配布ページに置く |
| three.js / three-vrm / three-vrm-animation | MIT（VRM使用時のみCDNから読み込み。three 0.180.0 / three-vrm 3.5.5） |
| @yohawing/three-mmd-loader | MIT（MMD使用時のみCDNから読み込み。0.8.4。three非依存の独立実装） |
| Capacitor Core / Android | MIT（任意のAPKラッパーを生成したときだけ使用） |
| Capacitor CLI / TypeScript | MIT / Apache-2.0（APK生成用の開発ツール） |
| 内蔵モーション25種（step/swing/turn/jump/idol＋🎵15種＋🎸3種＋👀BPM非依存2種）＋🎲おまかせ | **trk! がコードで作る自作VMD**（`js/mmd.js` の `buildVmd()`）。GPLの対象 |
| 選曲画面のモーションミニ操作 `#mmdQuickPanel`（⏩の下。👀/🎲/🎯⭐/💤の4チップ） | `js/mmd.js` の `buildQuickPanel()`。モデル読み込み済みのときだけ表示・`mmdQuickUI` で切替 |
| 💠 同梱プリセットモデル（`assets/mmd/`） | **GPL対象外**。れあどめ原文で再配布OKを確認できたモデルだけ置ける（例：Lat式ミク）。NOTICE.md の 3a 参照 |

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
27. **📚 曲のタブ（棚）と棚スキン16種**：曲リストの上に、曲の入り口ごとのタブが自動でできる（すべて／パックごと／フォルダーごと＝最上位の階層／追加した曲／公認）。パックを入れるとタブが自動で増え、タブの中で検索・並べ替え（TVの◀▶も、いまのタブの中を送る）。見た目は棚スキン16種（タブプレーヤー・ノート・シール帳・カード目録・カセットラベル・黒板・レトロPC・クリアファイル・ジュークボックス・ラジオ番組表・電光掲示板 ＋ レコード棚・レンタルビデオ・カラオケ目次・図書館の書架・お品書き）を、曲リストの 🎨 ボタンでその場で切り替え（設定で🎨ボタンを隠せる）
28. **🧩 アドオン**：`js/addons.js`（`trk_addons_v1`）。設定画面「🧩 アドオン」から `.js` / `.trk-addon` を入れて、オン/オフ・削除・`↻ 反映`。`TrkAddons.register({id,name,version,apiVersion,setup(api)})` を書くだけで、置き場所（settings / libPanel / tvMore / rackMore）にUIを足し、`api.addSongs()` で曲を足し（曲リストの 🧩 タブに自動でまとまる）、`api.fx.tapElement(el)` で自前の音を本体のエフェクターに通せる。`index.html` に1行足す配布物向けの道もある。`?safe=1` では読み込まない。書き方は docs/ADDONS.md
29. **🩷 MMDマスコット（💠Lat式ミク同梱・内蔵モーション25種）**：`assets/mmd/lat-miku/` に再配布可能モデル同梱、BPM同期モーション25種、🎲おまかせ、選曲画面ミニ操作 `#mmdQuickPanel`、設定画面でのミクモード即時連動。
30. **❤ ノーツ数適応型ライフスケーリング ＆ 🎬 初期TVスキン「映画館」化**：短曲〜長曲のノーツ数に応じたライフ初期値・上限・回復間隔の動的スケール、黒基調の `cinema` を初期TVスキンに設定。
31. **🔥 達人・エキスパート配置生成 ＆ 推定Lv.1〜20への拡張**：16分音符の3連・5連ロール、交互トリル、小節頭ドン固定による本格音ゲーの叩き心地、Lv.1〜20連続スケール、全年齢向けUIとワンタップ解放（達人・2000 RUSH）。
32. **🥁 音ゲーマー向けFAST/SLOW・あべこべ・でたらめ**：リザルト画面での FAST/SLOW および GOOD 内訳の精密表示、判定下のリアルタイムネオンカラー表示、公式MODとしてのあべこべ（MIRROR）・でたらめ（RANDOM）の実装（`mulberry32` による決定論的再現性）。
33. **🎬 TV映像確認タブ強化・共有URL ＆ 📡 アンテナ機能**：確認タブ直下にシークバー・再生一時停止・「▶ この設定で遊ぶ」ボタン、TVスキン＆フィルターの共有URL生成（`?tv=...&skin=...`）、4種類のアンテナ形状切り替えと「通常のアンテナを使う（バックグラウンド再生モード）」チェックボックスの新設。
35. **📊 スペクトラム（音の見える化）**：`js/spectrum.js`（新ファイル）。設定のいちばん上に「🚫 スペクトラムを使用しない」があり、チェック1つで全部止められます（`settings.specOn`）。`TrkFX.tap()` で**エフェクト後の音**を見て、**16種類の見え方**（バー／ミラー／波形／リング／🎚DAW波形／🧭VUメーター／🔴LEDラダー／🌈スペクトログラム／💓心電図／📉地震計／📡レーダー／🎹ピアノロール／📈業績グラフ／💹周波数ボード／🤥嘘発見器／🔥焚き火）と**8色**（ネオン・夕焼け・モノクロ・レインボー・trk（赤×蒼）・桜・毒々・VHS）、感度、ピークの残像を描きます。置き場所は**📊 曲名バナー（#songBanner のスキン。左上の「＋」で開閉）**、🎛 ラックの「くわしい」の中、設定画面「🔊 サウンド」の下の `#specPanel`。**📺 TVの画面に重ねる**こともできます（`settings.specTv`・初期オフ）。`?safe=1` では読み戻さず出しません。
36. **💬 GitHub Issues 窓口の整備**：感想・苦情・ご意見フォーム（`feedback.yml`）、譜面・難易度バランス意見フォーム（`chart_feedback.yml`）の新設、リザルト画面下部への投稿リンク配備。
37. **🎛 エフェクトチェーン編集**（`js/fx-synth.js`）：17種の安全なエフェクトをノブ風スライダーで組み立て、順序変更・EQバンド編集・適用・マイプリセット保存・`trk-fx` Import/Export。`fx.js`／`fx-presets.js` は変更せず、`TrkFX.clean()` と既存の保存処理を使う。
38. **🎹 曲に合わせて弾けるシンセモード**（`js/synth-mode.js`）：FXドックの⏻スピーカーを長押し（標準650ms。設定で起動禁止または200msへ短縮可能）。Web Audioの16基本音色（エレキギター、電子サックス、FMエレピ、シンセストリングス、8ビットチップ、ボコーダーボイス、ZUNPET風ブラスを含む）・最大6音源レイヤー・端末内だけのサンプル音源（12MB／30秒まで）、C3〜C5の画面鍵盤、QWERTYキー割り当て、曲プレビュー操作、上部の動画＋スペクトラム表示に対応。`synthModeKeyboardLock`（初期オン）で、フォーカス中のステータス欄やスライダーに割り当てキーを吸われず、鍵盤へ固定できます。`synthModeWideKeyboard`（初期オフ）をオンにすると、大きな画面では鍵盤を最大約1.28倍に広げて表示します。音色とキー割り当ては端末内に保存し、サンプル音声自体は保存・送信しない。

39. **📤 ミュージックフォルダを共有**（library.js）：「許可を承認してフォルダを開く」に加えて、**端末に1回だけ許可をもらってミュージックフォルダの中身を一気に取り込む**入口を新設。`📁 開く` は動画フォルダ用として**ならべて残す**。許可は `libKV` の `"share"`（共有）と `"dir"`（開く）に分けて覚え、次回からは「🔗 共有をつづける」の1タップ。読み込み中は曲数を出し、終わると「{n}曲（対象外のファイル {skip}件はとばしました）」＝**変な曲や動画も一緒に入る**のが分かる表示。設定画面に `#libSharePanel`（📤 共有／💾 端末に残す／🚫 共有をやめる）を追加。`💾` は新しい IndexedDB `shadow_taiko_shared` に最大150曲・300MBまで保存し、リロード後は許可なしで遊べる（`?safe=1` では読み戻さない）。

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
├─ index.html  privacy.html  credits.html  manifest.webmanifest  sw.js  verified.json  .nojekyll  .gitignore
├─ package.json  capacitor.config.ts
├─ README.md  NOTICE.md  CONTRIBUTING.md  LICENSE
├─ css/style.css   icons/（icon.svg・icon-192.png・icon-512.png）   tools/make-icons.html
├─ docs/  HANDOFF.md  pack-format.md  android.md  verified.md  og.png
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
| 18.5 | fx-synth.js | 🎛 視覚的なエフェクトチェーン編集。`window.TrkFX` と #fxPanel の保存欄を使うため、fx.js の後。メイン画面の `.dockMore` は tv-dock.js が `.songCol` 直下へ移動したあとに探す |
| 19 | library.js | 選曲画面・AUTO/ラジオ・シード道具・プレビュー・📁フォルダ／📤共有 |
| 20 | verified.js | ✔公認パック（SHA-256と verified.json の照合、作者名・BPM・作者のことば） |
| 21 | main.js | 入力・イベント・**起動処理**（`packsReady`）、サービスワーカー登録 |
| 22 | speed.js | ⏩速度パネル・速度キー（main の後） |
| 23 | vrm.js | 🧍VRM（`packsReady` を待つ） |
| 24 | mmd.js | 🩷MMD（持ち込みモデル・自作VMD。`packsReady` を待つ） |
| 25 | favs.js | ⭐ お気に入りのフォルダ管理（1軍／2軍／🧊／📤元。tv・fx・song の3系統） |
| 26 | spectrum.js | 📊 スペクトラム（音の見える化）。`TrkFX.tap()` でエフェクト後の音を見る。TVの画面に重ねられる。fx.js・tv-dock.js の後 |
| 27 | synth-mode.js | 🎹 曲に合わせて演奏するWeb Audioシンセ。FXドックの電源ボタンを長押し。音声分析に `TrkFX.tap()` を使うため spectrum.js の後に読む |
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

### 🧩 アドオン（js/addons.js）
- **保存**：`trk_addons_v1`（localStorage。新しいキー。既存のキーは触らない）。1件＝`{ id, name, version, author, description, apiVersion, enabled, code, source, addedAt, error }`
- **動かし方**：入れたコードは `(0, eval)(code)` でそのページの中で実行（サンドボックスではない）。コードは `TrkAddons.register(def)` を呼ぶ約束
  - `collecting` を立てて実行 → register が集める → `setup(api)` を呼ぶ。`setup` が投げたら、そのアドオンだけ無効にして一覧に赤字で出す（本体は止めない）
  - 起動（DOMContentLoaded・最後）に、enabled な保存ぶんを順に実行。`?safe=1` / `?factory` のときは読み込まない
  - `index.html` の `<script src>` から来たアドオンは「index.html から読み込み」として一覧に出し、削除ボタンは出さない
- **api（apiVersion 1）**：`tr` / `el` / `$` / `addStyle` / `on` / `emit` / `slot` / `say` / `settings` / `savePrefs` / `video` / `phase` / `addSongs` / `fx.available` / `fx.tapElement` / `log`
- **置き場所**：`settings`（#addonSlots）/ `libPanel`（#libStatus の前）/ `tvMore` / `rackMore`。空のスロットは `MutationObserver` で隠す
- **曲を足す**：`api.addSongs(list)` → `library.js` の `setAddonSongs()` に渡し、`allSongs()` の末尾に足す。`libTabsOf` が `addon:<id>` のタブを自動で作る（🧩・`libTabAddon`）
  - `file`（Blob/File）を持つ曲は、ふつうの曲と同じ道（loadMedia → エフェクター）を通る
  - `file` を持たない曲は、選ぶと `emit("addonSelect", it)` が流れる（アドオンが自前のプレイヤーで鳴らす）
  - どの曲でも `emit("songSelected", it)` が流れる（selectSong の中）
- **エフェクターへの通り道**：`fx.js` に `TrkFX.tapElement(el)` / `untapElement(el)` を追加（`G.extra` に MediaElementSource を保持し、`G.eq[0]` へつなぐ）。同じ要素は一度だけ・オフでも素通しでつながる・AudioContext が suspended なら resume
- **正直な限界**：クロスオリジンの iframe（YouTube など）の中の音は、ブラウザの仕様で取り出せない。アドオンでも同じ（docs/ADDONS.md の 6 章に明記）

### 📤 ミュージックフォルダを共有（library.js）
- **入口は2つをならべる**：`#libOpenBtn`（📁 開く＝従来どおり。🎬 動画フォルダなども）と `#libShareBtn`（📤 共有＝端末に1回だけ許可をもらって、ミュージックフォルダの中身を**一気に**取り込む）。設定画面にも同じパネル `#libSharePanel` がある（`#libShareSettingsBtn`／`#libShareStopBtn`／`#libKeepSharedChk`／`#libKeepSharedHint`／`#libShareState`＝いまの状態／`#libShareStatus`＝直前の操作の結果）
- **許可の覚え方を分ける**：`libKV`（IndexedDB `shadow_taiko_library` の kv）に **"share"（📤 共有）** と **"dir"（📁 開く）** を別々に保存。`initLibrary()` は **share を優先**して `libHandle` に入れ `libShared` を立てる（`shareRemembered` は「覚えているが、まだつながっていない」印）。再接続ボタンの文章は `libShared` で出し分け（`libShareResume` / `libReconnect`）。⚠ ブラウザの都合で、**許可は操作のたびに要る**（`queryPermission` → `requestPermission`）
- **スキャン**：`scanHandle(h, onProgress)` は `{files, skipped}` を返す（旧：配列だけ）。深さは `LIB_DEPTH = 8`（旧 6）、25曲ごとに `onProgress` → `libShareScanning`（読み込み中の曲数が出る）。曲でも譜面でもないファイルは `skipped` に数えて、`ingestFolder(list, dirName, shared, skipped)` が `libShareFound`＝「{n}曲（対象外のファイル {skip}件はとばしました）」を出す
- **非対応ブラウザ**（`canPickDir` が false ＝ スマホの Chrome など）：`dirInputMode = "share"` にして `#libDirInput`（webkitdirectory）を開き、change 側で `shared` を判定して同じ道へ合流する。`libShareUnsupported` の note を設定パネルに出す。`showDirectoryPicker` が投げたときも同じフォールバック（**AbortError＝キャンセルは何もしない**）
- **💾 端末に残す（`settings.libKeepShared`・初期オフ）**：新しい IndexedDB **`shadow_taiko_shared`**（store "files"）に `{key, file, name, dir, addedAt}` を保存する。上限は `SHARED_MAX = 150` 曲・`SHARED_BYTES = 300MB`（`SHARED_MB`）で、`keepSharedSongs()` が上限で止めて `libKeepSharedFull`、書き込み失敗（QuotaExceededError など）は `libKeepSharedFailed` を出す
  - 起動時は `loadSharedSongs()` が `sharedSongs` に戻し、`allSongs()` が **同じ key を1件だけ**出す（folderSongs → sharedSongs → addedSongs の順で重複をとばす。共有を端末に残すと同じ曲が両方に居るため）。行には 📤 のタグと ✕（`removeShared()`）が出る
  - オフにすると `clearSharedSongs()`（保存を全部消す）。**🚫 共有をやめる**（`stopSharing()`）は kv の "share" ＋ 端末の曲 ＋ 共有中のリストをまとめて消す（📁 開く で入れた曲は消さない）
  - あとから 💾 をオンにしたときに使えるよう、直近のスキャン結果を `lastScan` に取ってある。↻ 再スキャンのときは **もう端末にある曲（key＝「サイズ|曲名」が同じ）を書き直さない**ので、300MB を何度も書き込まない
  - `?safe=1` では読み戻さない（`enterSafeMode()` が `libKeepShared = false`＋`initLibrary()` が `TrkSafeMode()` でも見る）
- **文章キー**：`libShare…` / `libKeepShared…` / `secShare`（4言語・21キー）。⚠ `libKeepSharedHint` は `{max}` `{mb}` が入るので **data-i18n にしない**（`applyLanguage()` は変数を渡さないため）。`syncShareUI()` が `tr(…, {max, mb})` で書き、言語切り替え（`on("language")`）でも書き直す
- 動作確認：`jsdom-libshare.mjs`（**73項目**：共有→5曲・深いフォルダ・変な曲・対象外2件・kv:share・📁Musicタブ／💾オン→保存5曲・一覧は増えない・リロードで戻る・✕で外れる・🔗再接続で重複しない・🚫で全部消える／📁開くは従来どおり／上限150曲・300MB／`?safe=1`／非対応ブラウザのフォールバック／4言語）

### 📚 曲のタブ（棚）と、棚スキン16種（library.js / lib-skins.js）
- **タブ**：`renderLib()` の入口で `libTabsOf(all)` が入り口ごとにまとめ、`libTabMatch(it, id)` で絞ってから検索・並べ替えに流す（`libView` はこの絞ったあとの並び＝◀▶ もタブの中で動く）
  - タブID：`all` / `pack:<packId|packName>` / `folder:<最上位のフォルダ名>` / `folder`（直下）/ `file` / `verified`。`renderLibTabs()` が描画し、`settings.libTab` に残す
  - サブフォルダは最上位の階層でまとめる（`libFolderSeg`：`Album/A/01.mp3` → 「Album」）。パックは `packId` ごと（無ければパック名）
  - **消えたタブ**（パックを外した等）は「すべて」を表示するだけで、`settings.libTab` は消さない（入れ直すと、またそのタブに戻る）
  - 公認の判定は `window.TrkVerified.verifyOf`（verified.js の窓口。IIFEの内側なので、外から見えるように足した）。無ければ公認タブは作らない
  - タブが1つ（＝すべてだけ）のときは、タブ帯ごと隠す。曲が0件のタブは `libTabEmpty` を出す
- **棚スキン**：`js/lib-skins.js`。`#libPanel[data-lib-skin="…"]` を付け替えるだけ（タブの中身は library.js が作る）
  - `LIB_SKIN_ORDER` ＋ `LIB_SKINS`（icon と 4言語の label）が定義（全16種：player / note / sticker / card / cassette / blackboard / retro / clearfile / juke / guide / board / vinyl / vhs / karaoke / archive / menu）。CSS は `css/style.css` に集約。
  - `settings.libSkin`（既定 `player`）／`settings.libSkinQuick`（🎨 ボタンを出す・既定オン）。知らないIDは `player` に落とす
  - 🎨 ボタン → `#libSkinBar`（チップ＋🎲おまかせ）を開閉。外をクリック／Escape で閉じる。設定画面「見た目」にセレクトと、🎨ボタンの表示チェック
  - 窓口 `window.TrkLibSkins`（`skins()` `skin()` `selectSkin(id)` `random()` `open()` `barOpen()`）

### 🖼 全体見た目スキン31種と「スキンの棚」（data.js / characters/miku.js / core.js）
- **プリセット31種**：`js/data.js` の `SKINS` に定番8種＋追加18種（ミントガーデン／ストロベリーホイップ／メロンベリー／宵闇／深海／残炎／朝焼け／白夜／パステルループ／プリズム／レーザーナイト／オーロラ／和モダン／昭和喫茶／青写真／天体観測／モノクロ印画／ネッスン・ドルマ）＋ごほうびスキン「🎓グラデュエーション」（`locked:true`）。`js/characters/miku.js` にミク系4種（ミク・ティール／ノワール／クラシック／アイドル）
  - 各スキンの `cat` タグ（`basic` / `miku` / `dark` / `light` / `grad` / `fun` の配列）で、棚のチップから絞り込み。カスタム／パックスキンは自動で `custom` 行き
  - **グラデーション**：`--ui-bg` と `game.stage` には `linear-gradient(180deg,#a,#b)` を直接書ける（上→下＝`180deg`、下→上＝`0deg`、右→左＝`270deg`、左→右＝`90deg`）。`parseGrad()` が2色と向きを読み返すので、スキン作成の「リミックス」もグラデを引き継ぐ
- **スキンの棚（設定画面「見た目」）**：`#skinNow`（今のスキン。押すと棚が開く）＋ `#skinShelf`（開閉できるdetails。`settings.skinShelfOpen` で記憶）＋ `#skinChips`（絞り込み。`settings.skinShelfCat`）。31種＋カスタムでも設定画面が縦に伸びすぎないための仕組み
- **スキン作成（skinMaker）のグラデ対応**：`colors.bg2`（グラデ先の色）＋ `gradDir`（none/down/up/left/right）。`sanitizeSkinDef()` が検証、`buildCustomSkin()` が `--ui-bg` と `game.stage` にグラデを流し込む。古い形式（bg2なし）は単色のまま動く
- **ミクの新衣装（マスコット）**：黒衣装ミク（`mikuNoir`）とアイドル服ミク（`mikuIdol`・`extra:"star"` のきらきらパーティクル）。PCL二次創作・オリジナルアレンジ（`characters/miku.js` 冒頭の注意を参照）
- `tools/check-repo.mjs` が全体スキン数31（data.js 27＋miku.js 4）と、ごほうびスキンの鍵（`locked:true` と `applySkin` のガード）を検査する

### 🧭 スタンプラリーチュートリアル（main.js / core.js / data.js）
- **trk! で即完了・取り逃しなし**：Seed欄への入力は `input` イベントで**打ち込んだ瞬間**に反応し `settings.tutorialDone` が立って案内が消える。ガイドのフッタには**スキップ**ボタン（`#guideSkip`）、⚙設定の「見た目」（helpText の下）には**🧭もう一度**ボタン（`#tutorialReplayBtn`。押すと `tutorialDone=false` にして設定を閉じ、ガイドを開き直す。**スタンプは消さない**）
- **スタンプ5つ**（`settings.tutorialStamps`。順番自由・重複なし・スキップ後も蓄積）：`song`（`songSelected` イベント＝曲を選ぶ／追加直後の自動選曲）、`look`（`applySkin()` を `persist` 時だけ包む ＋ `TrkFX.select`／`TrkFX.random` を包む）、`play`（`phase` イベントが `playing`）、`safe`（`openSettings()` が `emit("settings")`）、`seed`（trk! 入力）。ガイドの手順カード（`.guideStep[data-mission]`）に✓スタンプが付き、サマリーに `（n/5）` 進捗
- **ごほうび**：5つ揃うと `unlockRewardSkin()` が `settings.skinGradUnlocked` を立て、スキンの棚を再構築してお祝いポップアップ（`#guideCelebrate`。✦きらきらアニメ・4.5秒で自動で閉じる。**プレイ中に揃ったら選曲へ戻った瞬間**に表示）。trk! だけで完了したときは「スタンプを5つ集めると、なにかもらえるかも…？」と予告だけ出る
- **ごほうびスキン「🎓グラデュエーション」**（`data.js` の `graduation`・`locked:true`）：未解禁のあいだ棚では「❓ ？？？」の無効カード（`.skinCard.locked`）。`applySkin()` は鍵付きスキンをシャドウへフォールバック（ブート復元でも安全）。`settings.tutorialStamps`／`skinGradUnlocked` は設定リセットで初期化

### 📺◀▶ 曲送りボタンと、TV→ラックのならべ方（tv-dock.js）
- **◀ ▶**：`.tvTop` の中の `.tvSong`（⏻ と ⏸ の間）。`songStep(dir)` は **library.js の `nextSong()` / `prevSong()`** に任せる（ラジオと同じ並び。`libView` → 無ければ `allSongs()`）。
  端は回り込み（`prevSong()` は新設：`(i-1+len)%len`）。**初期設定では `phase !== "title"` のときは何もしない**（ゲーム中に曲が飛ばないため）。選んだら液晶に `♪ 曲名`
- **🆕 演奏中も曲を送る（`settings.tvSongWhilePlaying`。新規の保存項目・初期 false）**：設定 →🎛設定タブの `#tvSongWhilePlaying`（`songPlayCheck`）。
  オンのときは、演奏中に ◀▶ を押すと `lcdFlash(tr("tvSongSkip", {t}))` → `toTitle()`（いまのプレイを閉じる＝**記録は残らない**）→ `selectSong(it)` で、その曲を選び直す。
  オフのときは今までどおり無反応。**キー（←/→＝player.js の10秒スキップ）には触っていない**（キーバインドは従来のまま）
  ⚠ 新しい設定を足したら、`core.js` の `enterSafeMode()` と `resetVideoPrefs()` の**両方**に初期値を戻す行を足し、`tv-dock.js` の読み戻し側（`keepSafe`）でも守ること
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

### 📊 スペクトラム（js/spectrum.js）
- **音の見かた**：`window.TrkFX.tap(2048)` が返す `AnalyserNode` を**1つだけ**使い回します（`TrkFX.tap` は呼ぶたびに `G.out` へぶら下がるので、作り直すと増えます）。`createMediaElementSource` は**呼びません**（fx.js の担当）。
  - ⚠ 使うと音が Web Audio の通り道を通ります（エフェクト未使用でも `G.ac` が作られます）。`fxDelayMs()` はコンプ／リミッターがオフなら 0 のままなので、**判定・記録には影響しません**。
  - アナライザーは**ユーザー操作のあと**（`hadGesture`）に、**実際に音が鳴っているとき**だけ作ります（ブラウザの音の制限のため）。`?safe=1` では作りません。
- **「🚫 スペクトラムを使用しない」**：設定（オプション）の 📊 スペクトラム欄と、くわしい欄の**いちばん上**にある `mkCheck("specOff", () => !settings.specOn, …)`（3つ目の引数で `specOffRow` の目印を付ける）。チェック＝`settings.specOn = false` で、バナー・くわしい欄・TVの重ね・アナライザーまでまとめて止まります（`specOffHint` で説明）。オフのあいだは `.specBox.specOff` でほかの設定をうすく見せます。
  - ⚠ むかしの「スペクトラムを表示する」チェック（TEXT `specOn`）は**同じ設定の裏返しなので消して**、この否定形に置き換えました。保存キー `settings.specOn` はそのまま（増やしていません）。
- **置き場所**：① 📊 曲名バナー `#songBanner`（`buildBannerSkin()`。バナーいっぱいの `canvas.specBannerCanvas` を敷き、左上に `button.specZip`＝「＋」／「−」、「＋」の隣（左上）に `div.specSkinTools`＝開いたときだけ出るクイック操作（⚠ 右上は library.js の「▶ ここから再生」ボタンなので避ける））／② 🎛 ラックの「くわしい」の中（`document.querySelector('button[data-i18n="dockMore"]')` の直前。⚠ くわしい欄は `applyOrder()` で `#fxDock` の外へ動くので `#fxDock` から辿らないこと）／③ 設定画面の `#specPanel`（fx.js の `#fxPanel` の直後）
  - バナーのキャンバスだけは `GATES`（WeakMap）で「`specSkin` がオンのときだけ描く」条件を持たせています。`DIRTY`（WeakSet）で「絵が入っているキャンバスだけ消す」ようにして、毎フレームの clearRect を避けています。
  - クイック操作は **⇄ 次の見え方**（`specNextStyle`）と**色の丸ボタン8個**だけ。**ピーク／TVに重ねるは設定（オプション）側に置いたまま**（開いたときに幅が広がりすぎないようにするため）。
- **保存（`settings`。`shadow_taiko_preferences_v2`）**：`specOn`（表示・初期オン）／`specStyle`（下の16種・初期 **ring**）／`specTheme`（下の8色・初期 **neon**）／`specGain`（0.4〜2.5）／`specPeaks`（初期オン）／`specTv`（📺重ね・初期オフ）／`specSkin`（📊 曲名バナーのスキン・初期オン）／`specSkinOpen`（最初から大きく開くか・初期オフ）
  - 一度だけの移行：`prefs.specStyle === "bars"` かつ `prefs.specSkin` が無い（＝v1 の頃の初期値のまま）ときだけ `ring` に移します。それ以外の保存値はそのまま。
  - 新しい設定の3点セット＝`core.js` の `settings`・`enterSafeMode()`（表示オフ）・`resetVideoPrefs()`（既定に戻す）に**足してあります**。spectrum.js 側も `?safe=1` では読み戻しません。
- **見え方16種（`SPEC_STYLES`。順番がチップの並び順）**：
  `bars`📊／`mirror`🪞／`wave`〰／`ring`⭕／`daw`🎚／`vu`🧭／`led`🔴／`spectro`🌈／`ecg`💓／`seismo`📉／`radar`📡／`piano`🎹／`slide`📈／`board`💹／`lie`🤥／`fire`🔥
  - 描く関数は `STYLE_DRAW`（`(S, g, W, H)`。`S` に `vals`＝対数バケット／`wave`＝時間波形／`live`＝読めているか／`theme`／`peaks`／`st`＝キャンバスごとの状態（ピーク・履歴・針・粒子）／`mirror` が入ります）。
  - 追加するときは **① `STYLE_KEYS`＋`SPEC_STYLES` と `STYLE_DRAW` ② `TEXT` の `specStyle<名前>` を4言語 ③ `jsdom-spectrum.mjs` の `WANT_STYLES`** の3か所。`core.js` の検証は `TrkSpec.styles()` を見て、無ければ初期4種に落ちるだけなので直さなくて大丈夫（spectrum.js が読み込み時に `prefs` から読み直します）。
  - 絵の中の文字も4言語：`specEcgBpm`／`specSeismoUnit`／`specDawRec`／`specSlide…`／`specBoard…`／`specLie…`。
- **色8種（`SPEC_THEMES`。順番がチップと丸ボタンの並び順）**：`neon`／`sunset`／`mono`／`rainbow`／`trk`（**trk! のテーマ色** `--ui-accent #ff3b55` の赤 → `--ka #55aaff` の蒼）／`sakura`／`acid`／`vhs`
  - チップと丸ボタンの色見本は JS の `THEME_SWATCH` から CSS 変数 `--specSwatch` に渡します（CSS 側に色を二重に書かない）。
- **窓口 `window.TrkSpec`（version 3）**：`styles()` `themes()` `style()` `theme()` `setStyle(id)` `setTheme(id)` `setOn(v)` `showTv(v)` `skin()` `skinOpen()` `setSkin(v)` `openSkin(v)` `cycleStyle()` `analyser()` `request()` `active()` `noAudio()` `canvases()`
- **CSS**：`.specBox`（オフのときは `.specBox.specOff` で `> *:not(.specOffRow)` をうすく）`.specCanvas` `.specSeg`（見え方のチップは13pxで折り返し）`.specSegColor`（色の見本は `--specSwatch`）`.specLabel` `.specTvCanvas`／曲名バナー用：`.banner .specBannerCanvas` `.banner.specSkin::after`（文字の下だけ暗くする）`.banner.specOpen`（高さ320px）`.specZip` `.specSkinTools` `.specNext` `.specDots` `.specDot`（`#tvDock .tvScreen` の中・`mix-blend-mode:screen`・z-index:1 なので、走査線やグレア（z-index:2）の下）
- **動きを減らす設定**：`prefers-reduced-motion: reduce` のときは本数を32本に減らし、ピークも出しません。音を見ていないときは 4fps に落として休みます。
- 見え方の計算：40Hz〜14kHz を対数で分けたバケットの平均。`freq.length`（1024）と `wave.length`（2048）は `TrkFX.tap(2048)` の値。

### 🎛 視覚的なエフェクトチェーン編集（js/fx-synth.js）
- `fx.js` の後に読み込み、選曲画面のくわしい欄へ `#fxSynthPanel` を追加（tv-dock.js が `.dockMore` を `.songCol` 直下へ移動したあとを探す）。保存UIはメイン設定内の `#fxPanel textarea.fxEditor` と `button[data-i18n="sfxApply"]` を使う。
- **fx.js・fx-presets.js は変更しない**。`TrkFX.clean()` で検証した17種のエフェクトを、追加・削除・上下移動・パラメーター調整。EQは1〜10バンド、エフェクトチェーンは最大16個。周波数スライダーは対数目盛。
- `Apply` は名前・チェーン・5バンドEQ・音量を `TrkFX.apply()` に渡して一時適用。`Save to My Presets` は一時適用後、fx.js の既存「適用して保存」処理を呼び出す（保存上限やJSON検証を二重実装しない）。
- `trk-fx` Import は1MBまで、`TrkFX.clean()` で検証し、コードは実行しない。Exportも公開 `trk-fx` 形式。新しい保存キーはなく、適用前の下書きはメモリーのみ（保存または書き出しが必要）。
- 5バンドEQはFXラックのEQスライダーと共通。出力音量はエフェクトチェーン編集内のマスター欄から調整する。翻訳キーは `synth…`、CSSは `.fxSynth…`。
- ⚠ fx.js のJSONエディターや保存ボタンのDOMを変更するときは、エフェクト編集の保存連携も確認する。

### 🎹 曲に合わせて演奏するシンセモード（js/synth-mode.js）
- FXドック左上の⏻スピーカー／電源ボタンを長押しして開く（標準650ms）。設定画面に「🚫 シンセモードを起動しない」「⚡ 高速でシンセモードを起動する（0.2秒）」「🔒 シンセモード中はキーボードを鍵盤に固定する（初期オン）」と「↔ 鍵盤を横に広くする（大きな画面向け）」を用意。短押しは従来どおり曲のミュート切り替え。無効時は🎹バッジを隠し、title／aria-labelにも現在の起動条件を表示。
- Web Audioで16種類のスターター音色（サイン、矩形リード、ノコギリリード、パッド、プラック、サブベース、オルガン、ベル、スーパーソー、ZUNPET風ブラス、エレキギター、電子サックス、FMエレピ、シンセストリングス、8ビットチップ、ボコーダーボイス）を生成。エレキギター／電子サックスもサンプルを使わず、複数の波形・フィルター・エンベロープを重ねた音色。ZUNPET風はデチューンしたノコギリ波／矩形波／三角波を重ねた音色。全音を移調するピッチつまみ（−8〜＋8半音、初期0）も備える。波形／オクターブ／デチューン／レベル、最大6レイヤー、フィルター、ADSR、マスター音量を調整できる。ピッチ値は端末内に保存。カスタム音色はlocalStorageに最大20個。
- 端末の音声ファイルを最大12MB・30秒までのワンショットサンプルとして追加。ローカルで `decodeAudio()` し、C4を基準にピッチを変える。サンプルデータはメモリーだけに置き、音色保存・通信・アップロードには含めない。
- C3〜C5（25半音）の画面鍵盤。初期QWERTY配列は低音域 `Z S X D C V G B H N J M`、高音域 `Q 2 W 3 E R 5 T 6 Y 7 U I`（tracker／Web仮想ピアノでよく使われる配置）。`synthModeWideKeyboard` をオンにすると、大きな画面では各キーを最大約1.28倍に広げます（スマホ幅では従来の幅を維持）。「⌨ キーアサイン」をON→画面鍵盤で音を選択→割り当てるキーを押す。ESCで終了、Delete/Backspaceで選択音の割り当てを解除。キー割り当ては端末に保存。
- モーダル上部は、再生中なら動画を薄く重ね、その上に `TrkFX.tap(2048)` の出力スペクトラムを描く。曲再生／一時停止・ミュート・音量も操作できる。モーダル表示中はゲームのキー操作・スキップ・速度ホットキーを抑止し、シンセ音は共有AudioContextから直接出力する。`synthModeKeyboardLock` がオン（初期値）なら、音色名入力やrange/selectにフォーカスが残っていても、割り当て済みのkeydown/keyupをpreventDefaultして鍵盤へ固定する。オフなら従来のフォーム入力を優先する。音ゲー判定・譜面記録は変更しない。
- ⚠ 実機確認：スピーカー長押し／短押し、起動禁止・高速起動、音色16種（エレキギター／電子サックス／ZUNPET風ブラスを含む）、鍵盤固定ON（初期値）でスライダー等にフォーカスがあっても押鍵できること／OFFでフォーム入力へ戻ること、ピッチ−8〜＋8半音と音程変化・保存、キー割り当てと解除、和音・リリース、曲と動画、モバイルタッチ鍵盤、サンプル制限・端末内保存、4言語、`?safe=1`。

### 🩷 MMDマスコット（js/mmd.js）
- **持ち込み式が基本**：MMDのモデル（.pmx/.pmd）とモーション（.vmd）は原則**同梱しない**。設定パネルの `mmdModelFile`（単体）／`mmdFolderFile`（webkitdirectory、テクスチャ込み）で、利用者の端末のファイルを読むだけ。フォルダのときは `createMmdFileIndex()` で索引を作り、`textureResolver` をローダーに渡す。上限 120MB／400ファイル（本命の .pmx はパスの浅い順）
- **🆕 💠 同梱プリセット（例外）**：れあどめ原文で**再配布OK**と確認できたモデルだけ、`assets/mmd/<dir>/` に「モデル一式＋れあどめ原文＋`preset.json`」を置ける（対象の dir は `js/mmd.js` の `PRESET_DIRS`）。起動時に `findPresets()` が `preset.json` を fetch できたときだけ `#mmdPresetRow` に💠ボタンが出て、1クリックで fetch→File化→`doLoadModel()`→クレジット（`credit`）・内蔵モーション（`motion`）・基準BPM（`bpm`）を自動設定。規約同意チェック（`mmdAgreed`）は**不要**（規約ごと同梱のため）。`?safe=1` では探しにも行かない。ファイルが無ければボタンは出ず従来どおり
- **内蔵モーションは trk! の自作**：`buildVmd()` がその場で VMD のバイト列を作る（30fps・3フレーム刻み・111B/フレーム・補間バイトは `[0,0,127,127]` ×16＝どの読み方でも直線・末尾 `54+n*111+20`）。`BUILTIN` は step(120BPM/4s)・swing(100BPM/6s)・turn(120BPM/4s)。ボーン名（センター／上半身／上半身2／首／左腕／右腕／左ひじ／右ひじ）は SJIS（cp932 の実測値）で埋め込む
- **BPM同期**：`rate = chartMeta.bpm ÷ 基準BPM`。基準BPMは `settings.mmdMotionBpm`、それが0なら内蔵モーション自身の bpm（持ち込みVMDで0なら固定＝1）。0.25〜3 に丸める。`phase==="playing"` では `#mmdCanvas`、設定パネルを開いているときは `mmdPreview`（180×120）に描く
- **設定（`settings`。`shadow_taiko_preferences_v2` に保存）**：`mmdAgreed`（規約同意。未同意なら3つのファイル入力が disabled）／`mmdRemember`（既定オン。IndexedDB `shadow_taiko_mmd` の "model"・"motion" に保存し、次回に復元）／`mmdScale`(0.5〜1.8)／`mmdTurn`(−60〜60)／`mmdBpm`(0〜300)／`mmdCredit`(120字。画面右下に `MMD: <クレジット>`)／`mmdMotionKind`(選んだ内蔵モーションの記憶。"file"は対象外)／`mmdQuickUI`(選曲画面のミニ操作を出す・既定オン)／`mmdMotionFavs`(⭐お気に入りモーションID配列・最大50)
- **窓口 `window.TrkMMD`（version 1）**：`builtins()` `motions()` `model()` `motion()` `setMotion()` `loadModel(files)` `loadMotion(file)` `clear()` `select()` `isPlaying()` `clock()` `rate()` `info()`。テスト用に `_injectLibs()` / `_builtin(id)` / `_sjis(s,n)` も出している
- **importmap**：`three/`＝three@0.180.0、`@yohawing/three-mmd-loader`（jsDelivr の dist/index.js）。**three 本体の MMDLoader は r175 で削除された**ので `three/addons/loaders/MMDLoader.js` は使えない（404）
- **`ensureScene()` は全か無か**：途中で throw したら renderer/scene/camera/pivot を**全部 null に戻す**（半端に残すと以降ぜんぶ落ちる）。`applyModelTransform()` / `frameCamera()` / `applyRect()` は null ガード必須
- **`?safe=1`**：ライブラリも読み込まず、保存ぶんも復元しない（`mmdSafe` を出す）。`settings.mascot === "mmd"` なら "skin" に戻す
- **正直な限界**：three とローダーはCDNから取るので**初回はオンラインが要る**。検証環境（サンドボックス）からは jsDelivr に届かないため、テストは偽ライブラリ `TrkMMD._injectLibs()` で代用している。**本物のモデル・.vmd・CDNは実機で確かめること**
- 動作確認：`jsdom-mmd.mjs`（VMDのバイト列とSJIS・同意ゲート・CDN不達→`mmdNetError`・モデル読み込みと保存・誤形式→`mmdVmdBad`・大きすぎ→`mmdTooBig`・フォルダ読み・BPM同期・playing/preview の描画・4言語・`?safe=1`）／`jsdom-mmdpreset.mjs`（💠 preset.json 検出→ボタン→読み込み→credit/motion/bpm 自動設定・jump/idol のVMD生成・新キー4言語）
  - 落とし穴：ハーネスの `stubCanvas` が `createImageData()` を返さないと、TV砂嵐（`tv-dock.js` の `drawStaticNoise`）が `img.data` で毎フレーム jsdomError を出す。**製品側のバグではない**
- **🆕 🔎 動作チェック（実機用の切り分け。`#mmdCheckBtn` / `#mmdCopyBtn` / `#mmdCheckOut`）**：`diagnose()` が ①WebGL（`WEBGL_debug_renderer_info` で GPU 名も）②CDN の three／three-mmd-loader（`libs()` を実際に読む）③いまのモデル・モーション・canvas・UA を調べ、`checkText(r)` が8行以下のプレーンなテキストにする。`runCheck()` が `#mmdCheckOut` に出して、`mmdCheckOk`／`mmdCheckNg` を出す。`copyText(t)` は `navigator.clipboard` → `execCommand("copy")` の順（両方だめなら `mmdCopyNg` で下の行を選ばせる）
  - 窓口：`TrkMMD.diagnose()` `check()` `checkText(r)` `lastCheck()`。`console.log("[trk! MMD check]\n" + テキスト)` も出す（実機のF12から拾える）
  - 環境が悪いときの見え方：CDN 不可 → `three=NG  loader=false` ＋ `libError=…`／セーフモード → `safe=true`／WebGL 不可 → `webgl=false`（この順で切り分ける）

### ⭐ お気に入りのフォルダ管理（js/favs.js）
- **3系統**：`tv`（映像フィルター。1軍＝`settings.tvFav`）／`fx`（エフェクト。1軍＝`settings.fxFav`）／`song`（曲。1軍＝`settings.songFav`＝新規）。**1軍はこれまでの保存場所のまま**、2軍〜元お気に入り・ピン・ロック・選択中フォルダだけ `settings.favs` に足す（既存キー・形式は不変）
- **4つの固定フォルダ**：`main`（⭐1軍＝ボタンに並ぶ）／`sub`（⭐2軍＝控え。チップで切り替えるとボタンに出る）／`frozen`（🧊フリーズ。**既定で🔒**）／`former`（📤元お気に入り。外したものが自動で入り、🎲の候補には出ない）
- **上限なし**：`TV_FAV_MAX` / `FAV_MAX` は 0（＝上限なし）にした。`idList(v, max)` は `max > 0` のときだけ切る
- **🧊凍結**＝フォルダごとの🔒。凍結中は追加・削除・移動を断る（`{ok:false, why:"locked"}`）。解除は🔓
- **📌ピン**＝「絶対に外れない」。`pool(kind)` ＝ いまのフォルダ＋**ピン（ほかのフォルダにいても必ず候補に入る）**。ピン中のものは外せない（`why:"pinned"`）
- **窓口 `window.TrkFavs`（version 1）**：`state` `list` `count` `groupOf` `has` `inGroup` `pinned` `locked` `activeOf` `setActive` `toggleLock` `add` `move` `remove` `restore` `clearFormer` `togglePin` `pool` `nameOf` `exportObj` `importObj` `exportJSON` `importFile` `exportText` `menu` `menuButton` `chips` `renderPanel` `msg` `toast` `refresh` `fxToggle`
- **UI**：ドックのチップ（`.favChipsWrap`）／曲リストの ⭐タブ＋チップ（`.favChipsRow`）／行の ☆★ と ⋯／設定画面の `#favPanel`（4フォルダの一覧・移動・ピン・凍結・書き出し・読み込み・コピー）
- **書き出し形式**：`trk-favs`（`{format,version,kind,groups:{main,sub,frozen,former},pins,locks}`）。読み込みは**足し算**（消さない）
- **fx.js は凍結中なので包む**：`favBtn` の listener を付け替えて `TrkFavs.fxToggle()` に繋ぎ、読み込み時に40個で切られたぶんを `prefs.fxFav` から戻す。外れても fx.js は今までどおり（1軍だけ）動く
- **🎲 の扱い**：ドックの「⭐🎲お気に入りから」＝ `pool`（いまのフォルダ＋📌）。曲リストの🎲＝いまの一覧＋📌の曲。📻ラジオと ◀▶ は今までどおり「いま開いている棚の並び」のまま（ピンでも列は変えない）
- 動作確認：`jsdom-favs.mjs`（上限なし45個・読み込みで55個・フォルダ切替のスロット・🧊凍結／🔓解除・📌ピン（🎲の候補）・📤元→↩戻す→🗑空にする・`trk-favs` の書き出し／読み込み／誤形式・fx の★・曲の⭐タブと⋯メニュー・長押しで2軍へ・4言語・?safe=1・**コンソールエラー0**）

### キー入力の優先順位
- `window` のキャプチャ段階で、**登録順**に受け取る：player.js → truck.js → modes.js(ORBIT) → stage.js → catch.js → extras.js(測定中) → speed.js → その後 main.js（通常段階）。
- AUTO中：各モードはキーで判定しない。←/→・R は player.js が使う。
- 予約キー：P / Esc（一時停止）、` （リトライ）、- / = （オフセット）、R（区間リピート）、[ ]（速度、変更可）。

### 📡 アンテナ機能とバックグラウンド再生（fx-dock.js）
- **キャストアンテナ（`settings.castPolicy`）**：初期値は `off`。設定で `antenna` を選んだときだけ📺キャストボタン（`.dockCast`）を表示し、クリック時のユーザー操作で Remote Playback API の `prompt()` または Safari の `webkitShowPlaybackTargetPicker()` を呼ぶ。自動キャストはしない。未対応ブラウザーでは `dockCastUnsupported` を表示するだけ。
- **バックグラウンド再生アンテナ（`settings.backgroundPolicy`＋`settings.fxAntenna`）**：
  - `backgroundPolicy` が `antenna` のときだけ📡アンテナUIを表示し、`fxAntenna` でON/OFFする。たとえば「キャスト無効＋バックグラウンド再生許可」のような組み合わせも可能（キャストとバックグラウンド再生は別ポリシー）。
  - アンテナを立てると（ON）、ブラウザのタブを切り替えたり画面をオフにしても、曲のプレビュー、ラジオ待ち受け、AUTO演奏が途切れることなくバックグラウンドで継続（`keepAlive()`）。
  - 自分でプレイ中の場合は記録保護のため通常どおり一時停止。
  - MediaSession APIと連動し、端末のロック画面や通知バーから 再生・一時停止・曲送り が可能。
- **アンテナ形状のカスタマイズ（`settings.fxAntennaShape`）**：
  - 伸縮ロッド（`rod`・標準）、円形ループ（`loop`）、パラボラ（`dish`）、サイバービーム（`beam`）の4種から選択可能。
  - アンテナON時に各形状に応じた伸長・発光・ティルト・電波シグナルリング（`signalPulse` アニメーション）が作動。
  - ドック本体のアンテナ（`.antWrap`）をクリックしても、アンテナスイッチ（`.dockAnt`）をクリックしても即座に切り替え可能。
- **スキン選択欄直下の明示的チェックボックス**：
  - スキン選択の直下に **「通常のアンテナを使う（バックグラウンド再生モード）」** チェックボックスを配置し、初見のプレイヤーでも便利なバックグラウンド再生機能の存在に自然と気付けるよう配慮。
  - キャストは別の`.dockCast`ボタンから操作する（このチェックボックスとは無関係）。
- **設定画面の個別ポリシー**：ドックの「くわしい」欄で「バックグラウンド再生アンテナ」と「キャストアンテナ」をそれぞれ `off`／`antenna` から選べる。旧バージョンの `castPolicy=antenna` 設定は `backgroundPolicy=antenna` として引き継ぐ。

### 🥁 音ゲーマー向け機能・MOD・判定分析
- **FAST / SLOW（Early / Late）の判定統計**：
  - `stats.fast`（-3ms未満）および `stats.slow`（+3ms超）を集計。GOODの内訳（`stats.goodFast` / `stats.goodSlow`）も記録。
  - リザルト画面に `.fastSlowRow`（シアンの `fastBadge`、コーラルの `slowBadge`）を新設。
  - プレイ中の判定文字下（`#judge small`）に `.early`（`#38bdf8`）／ `.late`（`#f87171`）のネオン光彩カラーを適用。
- **あべこべ（MIRROR）＆ でたらめ（RANDOM）MOD**：
  - `settings.modMirror` / `settings.modRandom` を追加。
  - `resetRun()` 時に `origLane` を保持しながら安全にレーン変換。`modRandom` は Seed・難易度・ノーツ数に基づく `mulberry32` 擬似乱数によりリトライ時も完全同一譜面を再現。
  - 太鼓系音ゲーの慣習に準拠し、MIRRORとRANDOMは公式記録対象（`activeMods()` に反映）。
  - `stage.js`（多レーンステージ）ともシームレスに同期。
- **GitHub Issues 窓口の整備**：
  - `.github/ISSUE_TEMPLATE/feedback.yml`（感想・苦情・改善要望）と `chart_feedback.yml`（譜面・難易度バランスの意見）を新設。
  - リザルト画面（`#endScreen`）下部およびタイトル画面にお問い合わせリンクを配備。

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
| `shadow_taiko_custom_skins_v1` | カスタムスキン（`skin.shadow-taiko`。`bg2`＋`gradDir` で背景グラデ対応） |
| `trk_fx_presets_v1` | マイプリセット（形式 `trk-fx`） |
| `trk_tv_skins_v1` | 🎨 カスタムTVスキン（形式 `trk-tvskin`、最大30個。選んでいるTVは `settings.tvDockSkin`） |
| IndexedDB `shadow_taiko_packs` / `_songs` / `_library` / `_vrm` / `_mmd` | パック（`sha256` 付き）・追加した曲・フォルダのハンドル（`_library` の kv：`"dir"`＝📁 開く／`"share"`＝📤 共有）・VRM・MMD（"model"/"motion"。持ち込みファイルの控え） |
| IndexedDB `shadow_taiko_shared`（新） | 📤💾 共有して端末に残した曲（`{key, file, name, dir, addedAt}`。最大150曲・300MB。`settings.libKeepShared` がオンのときだけ書く・読む） |
| `settings.libKeepShared`（新） | 💾 共有した曲を端末に残す（初期オフ。`shadow_taiko_preferences_v2` の中。`?safe=1` ではオフになる） |
| `settings.specOn` `specStyle`（16種）`specTheme`（8色）`specGain` `specPeaks` `specTv` `specSkin` `specSkinOpen`（新・📊 スペクトラム） | 表示／見え方／色／感度／ピーク／TVに重ねる／曲名バナーのスキン／開いた状態。`shadow_taiko_preferences_v2` の中 |
| `settings.songFav`（新） / `settings.favs`（新） | ⭐ 曲のお気に入り（1軍）と、3系統ぶんのフォルダ分け（`{tv,fx,song}` の `sub`／`frozen`／`former`／`pins`／`locks`／`active`）。どちらも `shadow_taiko_preferences_v2` の中 |
| `settings.castPolicy`（初期 `off`） | 📺 キャストアンテナのポリシー（`off`／`antenna`）。`antenna` のときだけ `.dockCast` ボタンを表示し、クリックで Remote Playback の選択画面を開く（自動接続なし）。`shadow_taiko_preferences_v2` の中 |
| `settings.backgroundPolicy`（初期 `off`） / `settings.fxAntenna` | 📡 バックグラウンド再生アンテナのポリシー（`off`／`antenna`）とON/OFF。旧 `castPolicy=antenna` は `backgroundPolicy=antenna` に引き継ぐ。`shadow_taiko_preferences_v2` の中 |
| `settings.fxDockSkin` `fxDockFive` `fxDockOpen` `fxAntennaShape` `fxEqLock` `fxLockChain` `fxFavSeeded` | 🎛 fxドックのスキン・5ボタン統一・開閉状態・アンテナ形状・EQロック・ロック連鎖・初期お気に入り投入済みフラグ。`shadow_taiko_preferences_v2` の中 |
| `settings.tutorialDone`（新） | 🧭 チュートリアル完了フラグ。Seed欄に `trk!` と入力した瞬間、またはガイドのスキップで `true` になり案内が消える（設定「見た目」の🧭もう一度で `false` に戻る）。設定リセットでも `false`。`shadow_taiko_preferences_v2` の中 |
| `settings.tutorialStamps`（新） | 🧭 スタンプラリーの実績（`song`/`look`/`play`/`safe`/`seed` の配列。順番自由・スキップ後も蓄積）。5つ揃うとごほうびスキンが解禁。設定リセットで空になる |
| `settings.skinGradUnlocked`（新） | 🎓 ごほうびスキン「グラデュエーション」の解禁フラグ（スタンプ5つで `true`）。設定リセットで `false` |
| `settings.skinShelfOpen`（新） / `settings.skinShelfCat`（新） | 🖼 スキンの棚の開閉と、絞り込みカテゴリー（all／basic／miku／dark／light／grad／fun／custom）。`shadow_taiko_preferences_v2` の中 |

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

### 体力（modes.js の lifeRule：ノーツ数による動的スケーリング）
| モード | Standard（完走支援バランス） | Knight（ハードサバイバル・⚔称号） | trk!🐔（即死） | Infinite |
|---|---|---|---|---|
| MANUAL・STAGE・CATCH | 初期15〜35・8〜22コンボで+1・最大25〜60 | 初期5〜10・20〜45コンボで+1・最大7〜14 | 1（回復なし） | なし（無限） |
| TRUCK | 初期3〜5・25〜50コンボで+1・最大5〜8 | 初期2〜3・35〜60コンボで+1・最大3〜5 | 1（回復なし） | なし（無限） |
| ORBIT | 初期15〜30・12〜24コンボで+1・最大20〜45 | 初期5〜10・25〜50コンボで+1・最大7〜13 | 1（回復なし） | なし（無限） |

### 称号
`🥁 MANUAL / 🚚 TRUCK / 🪐 ORBIT / 🎪 STAGE / 🚛 CATCH` ＋ `（なし）=クリア` `⚔=Sランク(95%)以上` `🐔=ノーミス`。ALL PERFECT は `🎪⭐` のように別表示。

### 難易度と譜面生成（data.js の DIFFS、media.js の generateNotes / estimateLevel）
| 難易度 | div（グリッド） | 密度 | 主な配置特徴 | 想定Lv帯 |
|---|---|---|---|---|
| 初級（Easy） | 1（4分） | 0.55 | 単音・拍頭メイン。初心者・全年齢向け | Lv. 1 〜 3 |
| 中級（Normal） | 2（8分） | 0.48 | 8分音符の基本リズム、小刻みな2〜3連 | Lv. 4 〜 6 |
| 上級（Hard） | 4（16分） | 0.60 | 16分音符の3連・5連複合、交互トリル（ドカドカ） | Lv. 7 〜 11 |
| 達人（MASTER） | 4（16分） | 0.82 | 長連打、高速トリル、複雑な複合ストリーム | Lv. 11 〜 15 |
| 2000 RUSH | 4（16分） | 0.95 | 最大2000ノーツの極限持続ストリーム | Lv. 16 〜 20 |

※ 高難易度（MASTER・2000 RUSH）は全年齢向けとして初期状態では隠れていますが、選曲画面の「🔥 MASTER」ボタンまたはプレイオプションの「高難易度を表示」にチェックを入れるだけで即座に解放できます（隠しSeed `765`/`143`等でも解放）。

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
- MMD：同じ three@0.180.0 ＋ @yohawing/three-mmd-loader 0.8.4（importmap）。PMX/PMD/VMD、物理・IK・モーフつき。three 本体の MMDLoader は r175 で消えたので同梱しない（r0.170 まで）
- フォルダ記憶は File System Access API（パソコンの Chrome/Edge、HTTPSかlocalhost）。Androidの Chrome では使えない。
- PWA：`manifest.webmanifest`（全画面・横向き）、`sw.js`（ネット優先・同じサイトのファイルだけキャッシュ）。**公開を更新したら sw.js の `CACHE` 名を変える**（例：`trk-v2026.10` → `trk-v2026.11`）。新旧のJSが混ざるときは `<script src="…?v=2026.10.1">` のように版番号を付ける。
- Xの文字数：半角1・全角2・絵文字2、上限280（verified.js の `postLength`）。

---

## 12. 残っていること・次の候補

### 優先順位（2026-10-05時点）

1. **最優先：実機・実ブラウザ確認を実施する**。音声、Canvas、IndexedDB、File System Access API、CDN、モバイル幅は静的検査では完了扱いにしない。下の「実機確認」項目は、実際に確認できるまで `[ ]` のまま残す。
2. **次点：静的に繰り返せる検査を先に回す**。`node tools/check-repo.mjs` でJS構文、`index.html` のローカル参照、PWAアイコン寸法、棚スキン数、Service Workerのキャッシュ名、主要文書の存在を確認できる。これはブラウザ確認の代替ではない。
3. **実装済み：APK準備の土台を作る**。`privacy.html`、`package.json`、`capacitor.config.ts`、`tools/prepare-mobile-web.mjs`、`docs/android.md` を追加した。これはAndroidプロジェクト生成とWeb資産同期の準備であり、APKの実機確認・配布完了ではない。
4. **整理済み：パック作者向け仕様を固定する**。`docs/pack-format.md` に `.stpack` / `pack.json` の項目・上限・例をまとめた。実装（`js/custom.js`）を変更したら、この仕様書と `README.md` を同時に更新する。
5. **外部設定は別枠**。GitHub Pagesの公開状態・About・Topics・Discussionsは、GitHub側で確認または判断するまで完了扱いにしない。

> 注：この文書に残る `jsdom-*.mjs` の項目数・翻訳キー数は過去セッションの記録です。現在のcheckoutにはそのハーネスがないため、現行の検査結果として扱わず、必要なら別途再作成します。

**やること**
- [ ] ブラウザで全ファイルの動作確認（コンソールに赤いエラーがないか）
- [x] `privacy.html` とCapacitor用Web資産同期の土台（APKの実機確認・配布は未完了）
- [x] `credits.html` の権利とクレジット図鑑、NOTICE / README / Handoffの第三者ライブラリ記載を同期
- [x] `.stpack` の `creditCard`（権利カード／名刺）を追加。パック作成UI・曲パック作成UIから出力し、パック一覧で折りたたみ表示
- [x] `creditCard.contributors`（最大12人）の表示、パック内 `CREDITS.md` 自動生成、共有用SVG名刺ダウンロードを追加。カードは作者申告の要約で、原文ライセンス／ReadMeを優先する
- [x] 🧭 3分チュートリアルを5段階に拡張し、最後のSeed欄に `trk!` と入力するとチュートリアル完了（`settings.tutorialDone`）になって案内が消えるようにした。初期スクロール速度1.2x、ゲーム演出（全部／控えめ／オフ）、TRUCKの初期演出強化、CATCHの任意ニトロ得点1.1倍も追加
- [x] ▶ TVドックの電源長押しでメディアプレーヤーモードを開く。再生キュー、曲送り、リピート／シャッフル、0.5〜2x速度、前回位置復元、スリープタイマー、Media Sessionを実装。ゲーム開始・記録には影響しない
- [x] 📡 外部出力を「キャストアンテナ」と「バックグラウンド再生アンテナ」の2本に分離。Remote Playback API／SafariのPlayback Target Pickerがある環境だけ、キャストアンテナ（`.dockCast`ボタン）から選択画面を開く（自動接続なし）。バックグラウンド再生は📡アンテナで個別にON/OFFでき、初期は両方ともオフ。動画ズーム0.5〜3x、速度・一時停止をキーアサイン可能にした
- [x] ⏪ メディアプレーヤーに逆再生を追加。Web Audioで曲ファイルをセッション中だけ反転した音声バッファとして再生し、映像は手動シークで同期する。音声の準備ができないブラウザーでは映像フレームのみの逆再生にフォールバックする
- [x] 🔁 メディアプレーヤーにA-B区間ループを追加。A点・B点ボタンまたは割り当てキーで範囲を作り、トグル（A→B／開始→解除）と長押し中だけの操作を選べる。曲を変えると範囲は解除する
- [x] 🎛 Loop Labを追加。現在位置から5／10／20秒のクイック区間、4〜12秒のランダム区間、曲識別子とA/B秒数だけを端末内に保存する曲別プリセット（呼び出し、個別削除、全消去、最大8件）を提供する。現在適用中のプリセットは強調表示する。音源ファイルの切り取り・変換・書き出し・外部アップロードは行わない
- [x] 🖼 壁紙／スクリーンセーバーをメディアプレーヤーに追加。専用キー（初期 `Numpad7`）をトグル／長押しに設定でき、初期状態では動画を止めてから壁紙を表示する。時計表示、ミッドナイト／オーロラ／紙の内蔵壁紙、端末から選ぶ画像（セッション中のみ・外部送信なし）に対応する
- [x] ⌘ ナビゲーションキーを追加。メニューへ戻るキー（初期 `M`）とプレーヤー終了キー（初期 `ESC`）を割り当てでき、どちらも確認を個別にオフにできる。選曲画面のチュートリアル・補足説明などをまとめて隠す「ヘルプ・説明文を表示」オプションも追加した
- [x] アイコン成果物の静的確認：`icons/icon-192.png`（192×192）・`icons/icon-512.png`（512×512）・`docs/og.png` が存在する（`node tools/check-repo.mjs` で再確認）
- [ ] `tools/make-icons.html` の生成手順を実機ブラウザで確認し、PWAアイコンと `docs/og.png` の表示を確認する
- [ ] GitHub Pages を公開し、About（説明・Website・Topics）を入れる
- [x] README と NOTICE のライセンス・権利の大枠を同期（Miku/PCL、GPL、MMDモデル、第三者ライブラリ、利用者コンテンツの扱いを相互に確認）
- [ ✅ ] i18n.js に `feedbackLabel`（4言語）が入っているか確認（選曲画面の連絡先リンクで使う）
- [ ] Discussions を開くか検討
- [x] README・index.html・HANDOFF・連絡先・Issueフォーム・公開用ファイル一式
- [x] サウンドエフェクト（fx.js・fx-presets.js）完成 → 🧊 凍結
- [x] 公認パック（verified.js・verified.json・docs/verified.md）
- [x] 📺 TVドック30スキン・映像フィルター45種・🛟緊急復旧
- [x] 🎨 カスタムTVスキン（色6・形4・飾り28・質感3、`trk-tvskin`で共有）
- [ ] 🎨 カスタムTVスキンの実機確認（モバイル幅・壁掛け・プロジェクターとの併用）
- [x] 🧩 アドオン（設置・オン/オフ・削除・保存、置き場所、曲を足す、エフェクターへの道、docs/ADDONS.md・見本）
- 動作確認：`jsdom-addons.mjs`（入れる／スロット4つ／🧩タブ／addonSelect／tapElement（偽のAudioContextで配線）／オフ・削除／壊れた3種のメッセージ／setupが投げても本体は無事／?safe=1 で読み込まない／4言語）
- [ ] 実機確認：アドオンを入れて動くか（例のサンプル）／`?safe=1` で読み込まれないか／壊れたアドオンを入れても本体が無事か
- [x] 🩷 MMDマスコット（持ち込み式・自作VMD3種・曲BPM同期・大きさ/向き/クレジット・保存と復元・4言語・`?safe=1` で切る）
- [ ] 実機確認：CDNから three／three-mmd-loader が読めるか／Lat式ミクやタワシ式CHAN×CO系ミクの .pmx が動くか／テクスチャ付きフォルダ／自分の .vmd が曲に合うか／モバイル幅での見え方
- [x] 📚 曲のタブ（自動）と棚スキン16種（🎨 で切替・設定で隠せる。2026-10-05 に 🎰ジュークボックス／📻ラジオ番組表／🚉電光掲示板 ＋ 💿レコード棚／📼レンタルビデオ／🎤カラオケ目次／🗂️図書館の書架／🍱お品書き を追加）
- [x] 🖼 スキンの棚と全体見た目プリセット30種（2026-10-05：グラデーション対応（上下左右）、ミク新衣装2種、カテゴリー絞り込みチップ、`#skinNow` 現在スキン表示、`tools/check-repo.mjs` に30種検査）
- [x] 🧭 チュートリアルをスタンプラリー化（2026-10-05：trk!入力で即完了・取り逃しなし、スキップ／もう一度ボタン、実際の行動を検知するスタンプ5つ、5つ揃いでごほうびスキン「🎓グラデュエーション」解禁（棚では❓カード）、お祝いポップアップ（プレイ中は選曲復帰時に表示）、check-repoに31種＋鍵検査）
- [ ] 実機確認：スキンの棚の開閉とチップ絞り込み、グラデの見え方（上下左右）、スキン作成のグラデ（保存・書き出し・読み込み・リミックス）、ミク新衣装ときらきらパーティクル
- [ ] 実機確認：スタンプラリー（曲選択・スキン／エフェクト変更・1曲プレイ・設定を開くの各検知と進捗表示、trk!即完了、スキップ、もう一度、スタンプ5つで🎓解禁と❓カードの変化、お祝いポップアップ）
- [x] 🥁 音ゲーマー向け機能の拡充（FAST/SLOW集計・GOOD内訳・判定下ネオン表示、MIRROR/RANDOM公式MOD、Lv.1〜20連続スケール、本格トリル・ロール配置生成、達人・2000 RUSHワンタップ解禁）
- [x] 🎬 TV映像確認タブの操作性強化 ＆ 🔗 TV設定共有URL（シークバー、再生/一時停止、時間表示、「▶ この設定で遊ぶ」ボタン、`?tv=...&skin=...` パラメータ生成と自動適用）
- [x] 📤 ミュージックフォルダを共有（1回の許可で一括取り込み・🔗 共有をつづける・💾 端末に残す（150曲／300MB）・🚫 共有をやめる・📁 開く はならべて残す・4言語）→ **PR #11 として main にマージ済み**（2026-10-05）
- 動作確認：`jsdom-libshare.mjs`（73項目）／`jsdom-smoke.mjs`（10項目）／`jsdom-i18n-audit.mjs`（32項目・**1311キー×4言語**・欠け0・二重定義0・生キー0）
- [ ] 実機確認：📤 共有（PC Chrome/Edge の許可ダイアログ・スマホ Chrome のフォルダ選び）／大きなフォルダ（1000曲以上）での読み込み時間と進捗／💾 端末に残す の所要時間と空き容量／🔗 共有をつづける／🚫 共有をやめる
- [x] 📡 アンテナ機能とバックグラウンド再生の強化（4種類のアンテナ形状、シグナル波リング演出、スイッチネオングロー、「通常のアンテナを使う」チェックボックス）
- [x] 💬 GitHub Issues フィードバック・苦情・譜面意見窓口（`feedback.yml`、`chart_feedback.yml`、リザルト画面リンク、`README.md` 更新）
- [ ] 実機確認：パックを入れてタブが増えるか／タブの中で探しやすいか／**16スキン**の見た目（モバイル幅・縦長のタブ帯・タブが1つのとき）
- [x] 📺◀▶ 曲送りボタン（前の曲・次の曲）と、TV→ラック→くわしい×2 のならべ方
- [ ] 実機確認：◀▶ で曲が送られるか（端で回り込むか）／TVのすぐ下にラックが来て見やすいか／くわしい欄が下のほうにまとまって見やすいか
- [x] 🎬🖼 選曲中にmp4を流す（ドックの画面＋「確認」タブ）
- [ ] 実機確認：選曲中にTVの画面でmp4が動くか／「確認」タブの見え方がゲーム画面と同じか／音が二重にならないか
- [x] 📊 スペクトラム（`js/spectrum.js`。**見え方16種**、**色8種**、**曲名バナーのスキン（＋で開閉）**、**「🚫 スペクトラムを使用しない」スイッチ**、感度、ピーク、TVに重ねる、`?safe=1` で出さない）
- [x] ついでに直したもの：TVドックの「🎨 カスタムTVスキンを作る」ボタンが**生キー（tvMakerOpen）**で表示されていたのを `tvmOpen` に修正（i18n監査で発見）
- [ ] 実機確認：📊 スペクトラム（音に合わせて動くか／**16種それぞれの見え方**／**曲名バナーのスキンと左上の「＋」**／**「🚫 スペクトラムを使用しない」で全部止まる・外すと戻る**／TVに重ねたときの見え方／初回に音が黙らないか／モバイル幅／他のTVスキンとの相性／設定・くわしい欄の両方で動くか）
- [x] 🎛 エフェクトチェーン編集（`js/fx-synth.js`）：17種の安全なエフェクトを組み立て、順序変更・EQバンド編集・ノブ風スライダー・一時適用・マイプリセット保存・trk-fx Import/Export（4言語）。🧊 `fx.js`／`fx-presets.js` は変更なし。
- [ ] 実機確認：エフェクト編集UIで追加・変更・並べ替え・削除／EQと音量の適用／保存後の再読み込み／trk-fxのImport/Export／4言語／モバイル幅。
- [x] 🎹 曲に合わせて演奏するシンセモード（`js/synth-mode.js`）：16音色（エレキギター／電子サックス／ZUNPET風ブラスを含む）・最大6音源レイヤー・±8半音ピッチ・ローカルサンプル・25鍵画面鍵盤・キーアサイン・**鍵盤固定オプション初期オン**・曲プレビュー操作・動画＋スペクトラム表示。
- [ ] 実機確認：⏻標準650ms／高速200ms／起動禁止と短押しミュート／16音色（エレキギター・電子サックス・ZUNPET風ブラスを含む）／**鍵盤固定ONでスライダー等にキーを吸われない・OFFで通常入力に戻ること**／**大画面向け鍵盤拡張ONでキーが横に広がり、スマホ幅では従来幅を保つこと**／±8半音ピッチつまみ（初期0・保存・押鍵中にも反映）／和音・リリース／曲と動画の再生／QWERTY配列と再割り当て／タッチ鍵盤／サンプル音源のサイズ・長さ制限とローカル動作／設定保存・4言語／モバイル幅。
「12. 次の候補」にあったエフェクトチェーン編集と🎹シンセモードは実装済みです。次は各実機確認と、下の未実装アイデアを進めてください。
**将来の大きな作業**
- APKのネイティブ音楽ライブラリ連携：今回CapacitorのWeb資産同期まで実装済み。残りは `READ_MEDIA_AUDIO` 等の必要性を確認し、端末の曲一覧・ラジオ中のバックグラウンド再生（Media Session・フォアグラウンドサービス）を、権限とプライバシー説明を含めて設計する。配布はGitHub Releasesから（Google Playは登録料と、テスター約12人×14日の条件がある）
- 公認の段階2：作者さんの鍵による署名、譜面JSON単体の公認、プリセット作者の公認
- `docs/presets.md` にみんなのマイプリセットの紹介集
- スペクトラムの続き：ゲーム画面の背景にもうっすら重ねる／ピークの色を選べる／TVの確認タブにも出す

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
- **サービスワーカーの登録を `js/main.js` の末尾に追加**。6章の読み込み順の表には「main.js＝サービスワーカー登録」とありましたが、コードには入っていませんでした。当時のキャッシュ名は `trk-v2026.10.2`。現在の値は `sw.js` の `CACHE = "trk-v2026.10.5-synth7"` です。
- `manifest.webmanifest`（全画面・横向き）・`verified.json`（空の雛形）・`.github/ISSUE_TEMPLATE/`（bug_report・feature_request・config）を新規作成しました。
- OGP画像は `tools/make-icons.html` の指示どおり **`docs/og.png`** に置きました（zip では `icons/og.png` になっていました）。`index.html` の `og:image` はそのままで合っています。
- **`.github/workflows/pages.yml` を変更**：ファイル名を並べてコピーする方式だと、新しいファイルを足すたびに公開が壊れるので、ルートを丸ごと公開する方式（`.git`・`.github`・`_site` だけ除外）にしました。`css/` や `js/` にファイルを足しても、もう直す必要はありません。
- **ブラウザでの動作確認はまだです。** 読み込み・モジュール間の約束・翻訳は機械的に確認しました（読み込みエラー0）が、描画・音・VRM・IndexedDB・公認パックは実機で見てください。
