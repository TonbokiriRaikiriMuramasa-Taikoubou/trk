# trk!

> **trk! is AGRG!** — an **A**ll-**G**eneration **R**hythm **G**ame
> 手持ちの曲ひとつで、叩いても、走っても、回っても、舞台に立っても、荷物を運んでもOK🚚

[![License: GPL v3+](https://img.shields.io/badge/License-GPLv3+-blue.svg)](LICENSE)
[![Play](https://img.shields.io/badge/▶_Play-GitHub_Pages-ff3b55.svg)](https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/)
[![X](https://img.shields.io/badge/X-@ttrk143-000000.svg)](https://x.com/ttrk143)

trk!（トラック）は、ブラウザだけで動く**非営利のリズムゲーム**です。
手持ちの音楽や動画（MP3・MP4など）を読み込むと、**譜面を自動で作って**すぐに遊べます。
インストールもアカウント登録もいりません。曲やデータは**どこにもアップロードされません**。
エフェクトを付けて聴く**音楽プレイヤー**としても使えます。

▶ **遊ぶ：** https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/

> ⚠ 開発中です。不具合を見つけたら [Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues) か X [@ttrk143](https://x.com/ttrk143) に教えてください。

---

## 目次
- [すぐに始める](#-すぐに始める)
- [5つのプレイ方法](#-5つのプレイ方法)
- [AUTOとラジオ](#-autoとラジオ)
- [プレイオプション](#-プレイオプション)
- [練習に便利な機能](#-練習に便利な機能)
- [記録と称号](#-記録と称号)
- [見た目のカスタマイズ](#-見た目のカスタマイズ)
- [サウンドエフェクト](#-サウンドエフェクト)
- [パックと公認パック](#-パックと公認パック)
- [キー操作](#-キー操作)
- [スマホで遊ぶ](#-スマホで遊ぶ)
- [動作環境と保存](#-動作環境と保存)
- [感想・要望・不具合の報告](#-感想要望不具合の報告)
- [MODを作る](#-modを作る)
- [ファイル構成](#-ファイル構成)
- [着想元とリスペクト](#-着想元とリスペクト)
- [ライセンスと権利](#-ライセンスと権利)
- [English](#english)

---

## 🚀 すぐに始める

1. 上のリンクを開きます。
2. 「📁 ミュージックフォルダを開く」か「＋ 曲ファイルを追加」で曲を読み込みます。画面に**ドラッグ＆ドロップ**しても読み込めます。
3. 曲を選ぶと、プレビューが流れます。
4. プレイ方法と難易度を選んで、**▶ PLAY**！

**対応している形式：** MP4・MP3・M4A・OGG・OPUS・WAV・WebM・FLAC・AAC・MOV（ブラウザが再生できるもの）

### 自分のPCで動かす
ビルドは不要です。ただし、フォルダの記憶・VRM・公認パックの確認には **http(s) で開く**必要があるので、簡単なサーバーを使ってください。

```bash
git clone https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk.git
cd trk
python -m http.server 8000
# → http://localhost:8000 を開く
```

---

## 🎮 5つのプレイ方法

| モード | 遊び方 | 操作 |
|---|---|---|
| 🥁 **MANUAL** | 流れてくるドン（赤）とカッ（青）を叩く、いちばん基本のモード | A（ドン）／ Space（カッ）。変更・サブキーあり |
| 🚚 **TRUCK** | トラックでレーンを移動します。トラックが踏んだノーツは自動で判定されます。全世代向けのやさしいモードです | ↑↓ または ←→（レイアウトに合わせて自動）。切り替えキー1つでも遊べます |
| 🪐 **ORBIT** | うねる1本の道が、四方八方から画面中央の判定点へ流れ込みます。**どのキーでもOK**のワンボタンモードです | どのキーでも／画面タップ |
| 🎪 **STAGE** | 奥から手前へ流れる縦レーン（4／5／6レーン）。階段・トリル・2レーン幅のワイドノーツが出ます | D F J K など（レーン数ごとに設定）／レーンを直接タップ |
| 🚛 **CATCH** | 落ちてくる荷物を、トラックの荷台で受け止めます。道の上の**ニトロ缶🚀**を取ると、しばらく「**ぶっ飛ばしモード**」（受け止める幅2倍・移動が速くなる）になります | ←→ または A・D／画面をなぞる |

- 譜面は、BPM・譜面ずらし・**Seed**から自動で作られます。Seedを変えると譜面も変わります。
- 難易度：初級・中級・上級（隠し難易度もあります）。
- どのモードでも同じ譜面を使い、記録はモードごとに別々に残ります。

---

## ▶ AUTOとラジオ

選曲画面の切り替えボタンで、どのモードとも組み合わせられます。

| 機能 | 内容 |
|---|---|
| **▶ AUTO** | 自動演奏で、ノーツの流れを眺められます。PVを見ながら難所を確かめたり、好みのSeedを探したりするのに便利です。体力・記録・称号はありません |
| **📻 ラジオ** | 曲が終わると、5秒後に曲リストの次の曲が始まります。**AUTO＋ラジオ＋サウンドエフェクト**で、好きな音で聴き続ける音楽プレイヤーになります。「もう一度」か「選曲へ」で止まります |

---

## 🎯 プレイオプション

| 項目 | 内容 |
|---|---|
| ❤ **体力モード** | Standard／Knight／**trk!**（1ミスで終了🐔）／Infinite。表示は、ハート・ゲージ・バッテリー・絵文字など7種類から選べます |
| **3・2・1・GO!** | 曲のBPMに合わせたカウントダウン。一時停止から戻るときもカウントできます |
| **判定の厳しさ** | ゆるめ（練習扱い）／標準／きびしめ |
| ⏩ **再生速度** | 0.5x〜2.0x（設定で3.0xまで）。音程は変わりません。**1.05x以上は速度ごとに別のハイスコア**と「🏁 最高クリア速度」が残ります |
| **HIDDEN／SUDDEN** | ノーツが途中で消える／途中から現れる |
| 🎲 **RANDOM／ANTI-ROLL**（STAGE） | レーンの並びを入れ替える／同じレーンの連打を避けて1ノーツずつ入れ替える。Seedで決まるので記録の対象です |
| **ミラー**（STAGE） | 左右反転 |
| **キー設定** | メイン・サブキー、プリセット（A／Space、osu!taiko風 F・J／D・K）、左右反転（左利き用） |
| 🎯 **オフセット測定** | カチッという音に合わせて16回タップすると、ちょうどよいタイミング補正を提案します |
| **自動微調整** | プレイ後に「早い／遅い」の偏りから、補正値を少しずつ直します（初期値オフ） |

---

## 🔁 練習に便利な機能

AUTO中か、「シークバーを表示（練習用）」をオンにしているときに使えます。これらを使ったプレイは**練習扱い**になり、ハイスコアには残りません。

| 機能 | 操作 |
|---|---|
| 再生バー | 画面下のバーで、好きな位置へ移動 |
| 10秒スキップ | ← ／ →（キーは変更できます） |
| 🔁 区間リピート | **R キー**で A点 → B点 → 解除。一時停止画面のボタンでも設定できます |
| ` 長押し | すぐに最初からやり直し |
| - ／ = | タイミング補正を5msずつ調整 |
| [ ／ ] | 再生速度を変更（途中で変えたプレイは練習扱い） |

ほかにも、次の機能があります。
- 👻 **ゴースト**：プレイ中に、自己ベストとの差を表示します。
- 📊 **判定の平均とばらつき**：リザルトに「判定 平均 +3.2ms · ばらつき 11.4ms」のように表示します。
- **タイミングメーター**：判定のずれを表示します。

---

## 🏅 記録と称号

- 記録は、曲ごと・譜面ごと・モードごと・速度ごとに残ります（ハイスコア・精度・最多PERFECT・回数・履歴30件）。
- **PERFECT✦**：PERFECTの中でも、特にタイミングがぴったりのときに付きます。スコアは変わりません。
- **称号**は、曲リストの曲名の横に並びます。

| 印 | 意味 |
|---|---|
| 🥁 🚚 🪐 🎪 🚛 | そのモードでクリア |
| ⚔ | Sランク（精度95%）以上 |
| 🐔 | ノーミス |
| ⭐ | ALL PERFECT |
| 🏁 | 最高クリア速度 |

例：`好きな曲 🥁🐔🚚⚔🎪🐔🚛`

- 履歴には、そのとき使った**サウンドエフェクト**も残ります（「🎛 この曲で最近使ったエフェクト」から、同じ音に1回で戻せます）。
- 記録は「⇩ 記録をバックアップ」でJSONとして書き出し、別のブラウザで読み込めます。

---

## 🎨 見た目のカスタマイズ

- **スキン**：シャドウ・デイライト・ネオン・サクラ・ターミナル・クラリティ（色覚配慮）など。色を選んで**自作スキン**も作れます（JSONで共有可）。
- **レイアウト**：横スクロール／縦・左／縦・中央／解説動画風
- **ノーツ**：色と形（丸・ひし形・四角）を、スキンとは別に決められます。
- **背景映像**：カラー・モノクロ・暗め・非表示に加えて、**暗さ**と**ぼかし**をスライダーで調整できます。選曲画面の📺TVドックから、**映像フィルター45種**（レトロ・シネマ・不思議・自然など）と**TVスキン30種**（ブラウン管・ウッド・アーケード・水槽・プロジェクターなど）を切り替えられます。映像が変になったら `?safe=1` で安全な状態に戻せます。
- **カスタムTV**：設定画面の🎨から、色6つ・形（ボタン数／列／角の丸み／画面のふち）・飾り28種・質感（光る／ガラスの反射／走査線）を選んで、自分のテレビを作れます。保存するとTVドックのスキン一覧に出て、`trk-tvskin`（JSON）で共有できます（最大30個）。
- **📺 の物理ボタンで曲を送る**：TVドックの電源・一時停止のとなりに **◀ ▶** があります。テレビのチャンネル送りみたいに、**前の曲・次の曲**へ（リストの端は先頭／末尾へ回り込み、液晶に `♪ 曲名` が出ます）。
- **ならべ方**：選曲画面は **📺 TV →（お気に入り）→ 🎛 ラック →（お気に入り）→ 📺 TVくわしい → 🎛 ラックくわしい** の順。テレビの**すぐ下にラック**が来るので「テレビの下にオーディオ機器」という自然な姿になります（TVとラックの上下は「くわしい」の中で入れ替え可）。
- **お気に入りの数えっこ**：「⭐ ボタンに入りきらないお気に入り」の行に、**お気に入りの数と、そのTVのボタン数**が出ます（例：お気に入り7個・ボタンは6個）。TVスキンを変えてボタンが増えると、たくさん入る——という遊びになります。
- **🧩 アドオン**：本体に入れられない機能を、あとから足せます。設定画面「🧩 アドオン」→「📄 アドオンを入れる」で `.js` か `.trk-addon`（JSON）を選ぶだけ（`trk_addons_v1` に保存）。アドオンは**曲を足す**（曲リストの 🧩 タブに自動でまとまります）、**置き場所**（設定画面・曲リスト・TVのくわしい・ラックのくわしい）にUIを足す、**自分の音を本体のエフェクターに通す**（`api.fx.tapElement`）ことができます。書き方は [docs/ADDONS.md](docs/ADDONS.md) と見本の [`js/addons/example.js`](js/addons/example.js)。壊れたときは `?safe=1` で読み込まれません。
- **📚 曲のタブ（棚）**：曲リストの上に、**曲の入り口ごとのタブ**が自動で並びます（📚すべて／📦パックごと／📁フォルダーごと／📄追加した曲／✔公認）。**曲パックを入れると、そのパックのタブが自動で増える**ので、あとから入れた曲をすぐ見つけられます。タブを選んだ中で検索・並べ替えができ、TVの ◀ ▶ も**いま開いているタブの中**で曲を送ります。タブに件数が出るので、どの棚に何曲あるかも一目で分かります。
- **📚 棚のスキン8種**：曲タブの見た目を **🎛 タブプレーヤー／📝 ノート／🌈 シール帳／🗄 カード目録／📼 カセットラベル／🖍 黒板／🕹 レトロPC／📁 クリアファイル** から選べます。曲リストの見出しの **🎨 ボタン**で、その場でぽんぽん切り替え（`🎲 おまかせ` も）。🎨 ボタンが不要なときは、設定画面「見た目」で**隠せます**。
- **選曲中にmp4を再生**：曲を選ぶと、TVドックの画面にそのmp4が映ります（設定でオフにもできます）。くわしく →「🖼 映像の確認」タブなら、ゲーム画面と同じ見え方でフィルター・TVスキン・暗さ・ぼかしを**再生する前に**確かめられます。
- **ORBIT**：道の動き、ノーツの大きさ（判定の幅で表示もOK）、判定点の形6種類、周りを回る恒星
- **STAGE**：レーンの幅・暗さ、ノーツの太さ、キービーム、補助線、盛り上がる場面で光るレーン、スポットライトなどの舞台演出
- **判定文字**：大きさ・位置・FAST/SLOWの表示範囲、AP/FCの継続表示
- **揺れ**：ビートやドン／カッに合わせてレーンを傾けます（初期値オフ。OSの「視差効果を減らす」がオンなら止まります）
- **マスコット**：オレンジ相棒、初音ミク（PCL・非公式の二次創作）、**自分のVRMモデル**（VRM 1.0）、**自分のMMDモデル**（.pmx／.pmd）。VRM の .vrma も MMD の .vmd も、曲のBPMに合わせて動きます。
- **🩷 MMDマスコット（持ち込み式）**：Lat式ミクやタワシ式CHAN×CO系ミクなど、**お手持ちのMMDモデル**を動かせます。テクスチャごとフォルダを選ぶだけ。内蔵モーションは trk! がコードで作る自作の3種（step／swing／turn）で、自分の `.vmd` も読み込めます。**モデルとモーションは同梱していません**（MMDの模型は再配布できないものがほとんどです）。大きさ・向き・画面下のクレジットを設定でき、チェックを入れると次に開いたときも復元します。`?safe=1` のときは読み込みません。

---

## 🎛 サウンドエフェクト

trk! は、音楽プレイヤーとしても楽しめます。設定画面の「🎛 サウンドエフェクト」か、選曲画面のメニューで切り替えます。記録には影響しません。

| 分類 | 数 | 例 |
|---|---|---|
| 基本 | 10 | ドンシャリ／夜間モード／クリア／ミックス確認：スマホ |
| ジャンル | 16 | EDM／ピアノ／ジャズ／オーケストラ／シティポップ／ボカロ |
| シーン | 20 | おやすみ／雨の日／焚き火／夜の高速／雪の夜／耳元で |
| 空間 | 17 | 大聖堂／隣の部屋／プラネタリウム／押し入れの中／駅のホーム |
| ゲーム | 15 | ボス戦／セーブポイント／回想シーン／エンディングロール |
| おもしろ | 21 | 8D風／カラオケ／レコード／糸電話／留守番電話 |
| ちょっと変 | 16 | ロボット／壁の向こうのライブハウス／深海／ブラックホールのそば |

- **かんたんEQ**（5バンド ±12dB）は、どのプリセットにも重ねてかかります。
- EDMのうねり・ゲート・8D・エコーなどは、**曲のBPMに合わせて**動きます。
- 🎮 **ゲーム連動**：ミスで一瞬こもる、コンボで華やかになる、ピンチで心音、🚀ぶっ飛ばし中に派手になる、など（プレイ中だけ）。
- ⏱ **タイミング自動補正**：エフェクトで音が遅れる分を、ノーツの判定で自動的に補正します（微調整あり）。
- 📄 **譜面に記録**：Exportした譜面にエフェクトも入るので、受け取った人も同じ音で遊べます。

### 🧩 マイプリセット（MOD）
「⇩ 今の設定をJSONで書き出す」で書き出したファイルを編集して読み込むと、自分のプリセットになります（形式 `trk-fx`）。

```json
{ "format":"trk-fx", "version":1, "name":"わたしのシティポップ",
  "chain":[ { "type":"eq", "bands":[ { "type":"lowshelf", "freq":90, "gain":3 } ] },
            { "type":"reverb", "size":1.8, "decay":3, "mix":0.15 } ],
  "eq":[0,0,0,1,2], "volume":0 }
```

使えるエフェクト：`eq` `comp` `gain` `width` `vocalCut` `delay` `reverb` `drive` `lofi` `pump` `tremolo` `autopan` `sweep` `ringmod` `chorus` `noise` `crossfeed`

読み込むのは決められた種類と範囲の値だけで、プログラムは実行しないので、ほかの人のJSONも安全に試せます。

> 内蔵プリセットは **115個で打ち止め** にしています。新しい音は、マイプリセットやMODでどんどん作って、**#trkAGRG** で共有してください。

---

## 📦 パックと公認パック

osu! のスキンのように、いろいろなものを1つのファイル（`.stpack`）にまとめて配れます。サーバーはないので、Discordやクラウドストレージなどで共有してください。

- **見た目パック**：スキン・ノーツの色/形/画像・効果音・VRM・モーション・マスコットのセリフ
- **曲パック**：音源・譜面・背景画像・BPM・譜面作者の名前・作者のことば（1パック50曲まで）
- 作り方：設定画面の「＋ 今の設定からパックを作る」、選曲画面の「📦 この曲を曲パックにする」
- 入れ方：画面にドロップするだけです。

> ⚠ パックには、**自分に再配布の権利がある素材・曲だけ**を入れてください。
> 中身は ZIP です。形式名 `shadow-taiko-pack` は、以前のパックとの互換のためにそのまま使っています。

### ✔ 公認パック
作曲家さん・譜面作者さんの**本人確認と権利の確認**が済んだ曲パックには **✔公認** が付き、作者さんの「💬 作者のことば」（Xの無料枠と同じ280まで）が表示されます。

- パックのファイル全体の指紋（SHA-256）を、リポジトリの [`verified.json`](verified.json) と照らし合わせます。中身が少しでも変わると ✔ は付きません。
- 公認されていない曲パックでも、**譜面作者とBPM**は表示されます。
- 公認の申し込みは X [@ttrk143](https://x.com/ttrk143) の DM か Issues へ。手順と権利のチェックリストは [docs/verified.md](docs/verified.md) をご覧ください。

---

## ⌨ キー操作

| キー | 動作 |
|---|---|
| A ／ Space | ドン ／ カッ（MANUAL。変更可） |
| ↑↓ ／ ←→ | TRUCKのレーン移動 ／ CATCHの移動 |
| D F J K など | STAGEのレーン |
| どのキーでも | ORBIT |
| P ／ Esc | 一時停止・再開 |
| ` （1の左）長押し | 最初からやり直し |
| - ／ = | タイミング補正 ±5ms |
| [ ／ ] | 再生速度 |
| ← ／ → | 10秒スキップ（AUTO・練習中） |
| R | 区間リピート（AUTO・練習中） |
| F | 全画面 |

タッチ操作にも対応しています（MANUAL・TRUCK・ORBITは左右ボタン、STAGEはレーンをタップ、CATCHは画面をなぞる）。

---

## 📱 スマホで遊ぶ

- スマホのブラウザで上のリンクを開き、「**ホーム画面に追加**」を選ぶと、アプリのように全画面で遊べます。
- スマホでは、曲を1つずつ選んで追加してください（フォルダをまとめて開く機能は、パソコンのChrome／Edgeだけです）。
- スマホの音楽フォルダを読み込めるアプリ版（APK）は、今後の予定です。

---

## 💻 動作環境と保存

最新の **Chrome／Edge** がおすすめです。Firefox・Safari（16.4以降）でも遊べます。

| 機能 | 条件 |
|---|---|
| ミュージックフォルダを記憶 | パソコンの Chrome／Edge（HTTPS か localhost）。ほかのブラウザでは毎回フォルダを選びます |
| パックの読み込み | `DecompressionStream` に対応したブラウザ |
| 公認パックの確認 | HTTPS か localhost（指紋の計算に必要です） |
| VRM | WebGL。初回だけ three.js／three-vrm をCDNから読み込みます |
| MMD | WebGL。初回だけ three.js／three-mmd-loader をCDNから読み込みます |

**保存について：** 設定・記録・パック・追加した曲・マイプリセットは、**このブラウザの中だけ**に保存されます（localStorage・IndexedDB）。ブラウザのデータを消すと消えるので、記録はときどきバックアップしてください。

---

## 💬 感想・要望・不具合の報告

trk! は、遊んでくれる人の声で育っていくゲームです。どんなことでも気軽に送ってください！

| 送りたいこと | 送り先 |
|---|---|
| 感想・「この曲で遊んだ！」・スクショやプレイ動画 | X **[@ttrk143](https://x.com/ttrk143)**（ハッシュタグ **#trkAGRG** を付けてもらえると見つけやすいです） |
| 不具合の報告 | [🐛 不具合を報告する](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues/new?template=bug_report.yml) |
| 「こんなモード・設定がほしい」 | [💡 アイデアを送る](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues/new?template=feature_request.yml) |
| パック・マイプリセット・MOD・自作キャラの紹介 | X で **#trkAGRG** を付けて投稿、または Issues |
| 曲の公認の申し込み（作曲家さん・譜面作者さん） | X の DM、または Issues（[手順](docs/verified.md)） |

不具合を報告するときは、次のことを書いてもらえると助かります。
- 使っているブラウザ（Chrome／Edge／Firefox／Safari など）とOS
- プレイ方法（MANUAL・TRUCK・ORBIT・STAGE・CATCH）
- F12キーで開くコンソールに出た、赤い文字

> ⚠ 曲のファイルそのものは送らないでください（著作権のため）。曲名とBPMだけで大丈夫です。

---

## 🛠 MODを作る

trk! はMODしやすいように、機能ごとにファイルを分けています。

- **自作キャラクター**：`js/characters/miku.js` を見本に `registerMascot()` を呼ぶファイルを作り、`index.html` に1行足すだけです。
- **内蔵スキン**：`js/data.js` の `SKINS` に1項目足すと、一覧に出ます。
- **棚スキン（曲タブの見た目）**：`js/lib-skins.js` の `LIB_SKINS` と `LIB_SKIN_ORDER` に1項目、`css/style.css` に `#libPanel[data-lib-skin="ID"] …` の見た目を足すだけです。
- **アドオン**：`js/*.js` を触らずに機能を足せます。`TrkAddons.register({...})` を書いて、設定画面から入れるか `index.html` に1行。API は [docs/ADDONS.md](docs/ADDONS.md)、見本は `js/addons/example.js`。
- **TVスキン**：`js/tv-dock.js` の `TV_DOCK_SKINS` に1項目、`buildDeco()` に飾り、`css/style.css` に見た目を足します。自分で作るだけなら、設定画面の🎨（`#tvMaker`）からどうぞ。
- **サウンドエフェクト**：マイプリセット（`trk-fx` のJSON）か、`TRK_FX_PRESETS` に足す自分のファイル。
- **翻訳**：`js/i18n.js` などの `TEXT.ja / en / zh / ko`
- **参加のしかた**：[CONTRIBUTING.md](CONTRIBUTING.md)
- **開発の引き継ぎ資料**：[docs/HANDOFF.md](docs/HANDOFF.md)（設計の考え方・ファイル間の約束・保存データの形式）

派生版を公開するときは、別の名前にしてください（下の「ライセンスと権利」を参照）。

---

## 📁 ファイル構成

```
trk/
├─ index.html  manifest.webmanifest  sw.js  verified.json
├─ css/style.css
├─ icons/                        … アプリのアイコン
├─ js/
│  ├─ i18n.js  i18n-options.js   … 4言語の文章
│  ├─ data.js                    … スキン・レイアウト・難易度・マスコット登録
│  ├─ characters/miku.js         … 初音ミク（PCL）。削除してもゲームは動きます
│  ├─ core.js                    … 設定・状態・共通処理
│  ├─ player.js                  … 再生操作・区間リピート
│  ├─ media.js                   … 読み込み・音声解析・譜面生成
│  ├─ game.js                    … 進行・判定・記録
│  ├─ render.js                  … 描画
│  ├─ custom.js                  … ノーツ・スキン作成・パック
│  ├─ truck.js  modes.js  stage.js  stagefx.js  catch.js   … 各モード・体力・称号・演出
│  ├─ extras.js                  … オフセット測定・ゴーストなど
│  ├─ tv-presets.js  tv-dock.js  … 映像フィルター・TVドック・カスタムTVスキン
│  ├─ fx-presets.js  fx.js       … サウンドエフェクト
│  ├─ library.js                 … 選曲画面・AUTO・ラジオ・曲のタブ（棚）
│  ├─ lib-skins.js               … 棚スキン8種（曲タブの見た目・🎨ボタン）
│  ├─ verified.js                … 公認パック
│  ├─ addons.js  addons/         … アドオン（あとから機能を足すしくみ・見本）
│  ├─ main.js  speed.js          … 入力・起動・速度
│  ├─ vrm.js                     … VRMマスコット
│  └─ mmd.js                     … MMDマスコット（モデル・モーションは持ち込み）
├─ docs/  HANDOFF.md  verified.md  og.png
├─ tools/make-icons.html         … アイコンとOGP画像を作るツール
├─ .github/ISSUE_TEMPLATE/       … 不具合・アイデアのフォーム
├─ README.md  NOTICE.md  CONTRIBUTING.md  LICENSE
```

---

## 💐 着想元とリスペクト

trk! は、たくさんの音楽ゲームから着想をもらっています。どの作品とも関係のない、**非公式のファンメイド**です。
各ゲームの譜面・画像・音声・名前は使っていません。内蔵の譜面はすべて自動生成です。

| trk! の機能 | 着想元 |
|---|---|
| パック・スキン・MOD文化、オフセット測定、背景の暗さ | osu! |
| 🪐 ORBIT の道の動き | ギタルマン（Gitaroo Man）の Trace Line |
| 🏁 速度別の記録 | A Dance of Fire and Ice の Speed Trial |
| 🎪 STAGE、PERFECT✦、カーテンコール | ワールドダイスター 夢のステラリウム |
| 🚛 CATCH | osu!catch |
| 区間リピート・判定の統計・揺れ | SOUND VOLTEX |
| 自動微調整・ゴースト | beatmania IIDX |
| RANDOM／ANTI-ROLL | EZ2ON |
| 📻 ラジオ | DJMAX |

<details>
<summary>🤫 隠しSeed（ネタバレ注意）</summary>

| Seed | 効果 |
|---|---|
| `143` | 隠し難易度をすべて解放 |
| `765` ／ `2000` | MASTER ／ 2000 RUSH |
| `olivier` ／ `nightmare` ／ `lunatic` ／ `hentai` を含む | MASTER を解放 |
| `20230726` ／ `20260929` ／ `curtaincall` | カーテンコール（たくさんの舞台に、ありがとう） |
| `nitro` ／ `buttobi` ／ `ぶっとばし` | CATCHが最初から最後までぶっ飛ばしモード（練習扱い） |

ほかにもあるかも…？
</details>

---

## ⚖ ライセンスと権利

| 対象 | 扱い |
|---|---|
| ソースコード | **GNU GPL v3.0 or later**（[LICENSE](LICENSE)） |
| 「trk!」の名前 | ライセンスの対象外です。派生版は、別の名前で公開してください |
| 初音ミクのマスコット（`js/characters/miku.js`） | ピアプロ・キャラクター・ライセンス（PCL）に基づく二次創作です。**GPLの対象外**で、非営利・無償の範囲でのみ使えます |
| three.js ／ three-vrm ／ three-mmd-loader | MIT License（VRM・MMDの使用時にCDNから読み込み） |
| 利用者が読み込む曲・VRM・MMDモデル・.vmd・パック | それぞれの作者のものです |
| 公認パックの曲・譜面・作者のことば | 作者さんのものです。GPLの対象外で、trk! で遊ぶための公開です |

### 初音ミクについて
この作品はピアプロ・キャラクター・ライセンスに基づいてクリプトン・フューチャー・メディア株式会社のキャラクター「初音ミク」を描いたものです。
https://piapro.jp/license/pcl/summary

- 公式画像は使わず、Canvasで一から描いています。「冬服ミク」「春ミク」などは、オリジナルのアレンジです。
- 販売・広告・有料機能・投げ銭など、**対価を受け取る形では使えません**。収益化している配信では、マスコットをオフにしてください。
- 商用の派生版を作るときは、`js/characters/miku.js` を削除し、`index.html` の読み込み1行を消してください。ほかは直さなくても動きます。

### お願い
- 権利のない曲を、曲パックなどで配らないでください。
- VRMモデルは、作者の利用条件を確認してから使ってください（VRChat改変モデルは、元の規約も確認してください）。
- MMDモデル・モーションも、**同梱していません**。使うときは作者の規約（再配布の可否・MMD／MMM以外のソフトでの使用・商用の可否）を確かめて、**自分の端末から**読み込んでください。trk! は読み込んだファイルを保存も送信もしません（下の「保存」にチェックを入れたときだけ、このブラウザの中に残します）。

詳しくは [NOTICE.md](NOTICE.md) をご覧ください。

---

## English

**trk! is AGRG!** — an All-Generation Rhythm Game that runs entirely in your browser.
Load your own music or video and trk! **auto-generates a chart** for it. Nothing is uploaded.

▶ **Play:** https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/

**Five play styles**
- 🥁 **MANUAL** — two-button Don/Ka drumming
- 🚚 **TRUCK** — switch lanes and let your truck drive over the notes (easy mode for everyone)
- 🪐 **ORBIT** — one-button play; a winding path flows into the center target (inspired by Gitaroo Man)
- 🎪 **STAGE** — 4/5/6-lane vertical play with stairs, trills and wide notes (inspired by World Dai Star: Yume no Stellarium)
- 🚛 **CATCH** — catch falling parcels with your truck; grab nitro cans 🚀 for **Blast mode**

**Also:** AUTO play for every mode, 📻 Radio (auto-advance to the next song), life modes, countdown, playback speed with per-speed records, HIDDEN/SUDDEN, RANDOM/ANTI-ROLL, offset wizard, A-B repeat, ghost, timing stats, titles, custom skins, VRM 1.0 mascots, MMD mascots (bring your own model), shareable `.stpack` packs, and 🎛 **sound effects** (115 EQ/FX presets, game-reactive effects, automatic latency compensation, shareable `trk-fx` JSON presets).

**✔ Verified packs:** song packs whose composer/charter identity and rights have been confirmed get a ✔ badge and a short message from the creator (up to 280, like a free X post). See [docs/verified.md](docs/verified.md).

**Run locally:** `python -m http.server 8000`, then open `http://localhost:8000`.

**Feedback:** casual thoughts on X [@ttrk143](https://x.com/ttrk143) (hashtag **#trkAGRG**), bugs and ideas on [GitHub Issues](https://github.com/TonbokiriRaikiriMuramasa-Taikoubou/trk/issues).

**License:** code under **GPL-3.0-or-later**. The name “trk!” is not licensed — please rename forks. The Hatsune Miku mascot (`js/characters/miku.js`) is fan art under the Piapro Character License (non-commercial only) and is **not** covered by the GPL; delete that file and its `<script>` line for commercial forks. MMD models and `.vmd` motions are **never bundled** — you load your own from your device, and their authors' terms apply. Songs, charts and messages in verified packs belong to their creators.

This work depicts the character “Hatsune Miku” of Crypton Future Media, INC. under the Piapro Character License.

trk! is an unofficial fan project and is not affiliated with any of the games listed above.
