<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# trk! 次回セッション用メモ（NEXT_SESSION_HANDOFF.md）

> 作成：2026-10-04（PR #3「feat(tv): 30 TV skins, 45 video filters, emergency recovery via URL」の続き）
> 更新：2026-10-04（🎨 カスタムTVスキン → 🎬🖼 選曲中のmp4再生と「確認」タブを追加した回）
> このメモは、そのまま次回の最初のメッセージに貼っても再開できます。
> リポジトリにこのファイルがあれば「`NEXT_SESSION_HANDOFF.md` を読んで現状を確認して」でOKです。

## 0. 次回、最初にやること（5分）
1. `git fetch origin && git log --oneline -5 origin/main && git status`
2. `docs/HANDOFF.md` と `NEXT_SESSION_HANDOFF.md` を読む
3. 実ブラウザで `python3 -m http.server 8000 --bind 0.0.0.0` → F12 Consoleに赤エラーがないか、TVドック30種＋カスタムTV・映像45種が動くか、`?safe=1` が効くか確認
4. 作業ツリーを壊さない（`git clean` / `git reset --hard` は使わない）

## 1. いまの状態（2026-10-04 時点）
- 構成：ルートに `index.html` ＋ `css/` ＋ `js/`（tv-presets.js, tv-dock.js, core.js など）＋ `icons/` ＋ `docs/` ＋ `tools/` ＋ `verified.json`
- モード5（manual/truck/orbit/stage/catch）、スキン9＋TVドック30、レイアウト4、難易度5、画面4、翻訳4言語、SE 115プリセット、**映像フィルター45種**
- TVドック（`js/tv-dock.js` / `js/tv-presets.js`）：
  - スキン30種：standard, home(初期), crt, wood, portable, kamishibai, tube, wall, future, projector, phone, arcade, laptop, cinema, car, airplane, vr, aquarium, scope, cctv, gameboy, jumbotron, frame, transparent, toy, cardboard, window, microwave, videowall, hologram
  - 各スキンに物理デコ（`buildDeco()`）と専用CSS（`css/style.css`）
  - 家庭用TVはCH表示＋▲▼で映像横切替、＋－で音量／壁掛けTVは `#selectScreen .head` に `wall-mounted` として絶対配置
  - リセットボタン：映像・TV設定を初期化
- 🆕 **🎨 カスタムTVスキン（今回追加）**
  - 設定画面の `#tvMaker`（index.html に素のHTML／配線は `setupTvMaker()`）で色6つ（筐体・画面の枠・画面・ボタン・アクセント・文字）・形4つ（ボタン数3-8／列1-4／角の丸み0-40／画面のふち0-16）・飾り28種・質感3つ（光る／ガラスの反射／走査線）を選べる
  - ライブプレビュー（`#tvmPreview`。TVドックと同じクラス名で作ってある）、ひな形4つ（standard/crt/wood/future）
  - 保存：`trk_tv_skins_v1`（最大30個・IDは `custom_tv_…`）、TVドックのスキン一覧に「🎨 名前（n）」で出る
  - 共有：`trk-tvskin`（JSON）で書き出し／読み込み。読み込むとそのままTVに反映
  - 見た目は CSS 変数 `--tv-…`（`paintTvVars()`）。CSSは `#tvDock.tvCustom …` と `#tvmPreview.tvCustom …` の2本立て
  - TVドックの窓口 `window.TrkTV` が version 2 に（`skins()` `skin()` `selectSkin(id)` が増えた）
- 🆕 **🎬🖼 選曲中にmp4を流す（今回追加）**
  - 曲を選ぶと、**TVドックの画面にそのmp4が映る**（動いているときだけ。TVスキンの枠・デコ・カスタムTVの色もそのまま）
  - 「くわしく」のパネルが **🎛 TVの設定 / 🖼 映像の確認** のタブに分かれた
  - 🖼 確認タブ：`#tvDock .tvpCanvas`（1920×1080）に、**ゲーム画面と同じ見え方**（contain＝黒帯つきで全体）で映像＋フィルター＋オーバーレイを描く。
    フィルター・TVスキン・暗さ・ぼかし・⏻ をその場で変えて、**再生する前に**確かめられる（止まっていたら音なしで再生を始める）
  - 設定（2つ）：
    - `tvMenuPreview`（🖼 選曲中のTVに映像を映す・**初期オン**）→ ドックの画面に映すかどうか
    - `tvMenuVideo`（🎬 音のプレビューがオフでも、メニューで映像を再生＝**音なし**・**初期オフ**）→ 「選曲中に曲のプレビューを再生する」がオンのときはそちら（音あり）を優先
  - 音は出さない方針：自分で再生したときだけ `video.muted` を立て、止めるときに戻す（fx-dockの⏻ミュートを壊さない）
  - 止まる場所：ゲーム開始（phase）／設定画面へ／タブやパネルを閉じる／タブが隠れた
- 🆕 **📺◀▶ 曲送りボタンと、TV→ラックのならべ方（今回追加）**
  - TVドックの上段：⏻ → **◀** → 液晶 → **▶** → ⏸（◀▶ は `.tvTop .tvSong`）。押すと選曲リストの前後の曲へ（端は回り込み、液晶に `♪ 曲名`）
  - 曲の選び方は `library.js` の `nextSong()`（既存）と、**新設した `prevSong()`** に任せる（ラジオと同じ並び・副作用なし）
  - ならべ方を変更：**TV →（お気に入り）→ ラック →（お気に入り）→ TVくわしい → ラックくわしい** がデフォルト。
    `applyOrder()` が、それぞれの `<details>`（`.tvMore` / `.dockMore`）をドックの外＝列の下のほうへ並べ直す（TVを壁掛けにしても、くわしいは列に残る）
  - お気に入り行に**数**を表示（`tvFavLabelN` / `tvFavOverflow`）：お気に入り7個・ボタン6個のように、TVごとの収まり具合が見える
  - 並び順の設定はそのまま（テレビとラックの上下だけ入れ替え。くわしいは、いつも下のほう）
- 🆕 **📚 曲のタブ（棚）と、棚スキン8種（今回追加）**
  - 曲リストの上に、曲の入り口ごとのタブが自動でできる：📚すべて／📦パックごと／📁フォルダーごと（最上位の階層）／📄追加した曲／✔公認
  - **パックを入れると、そのパックのタブが自動で増える**（新しい曲を探しやすく）。タブの中で検索・並べ替え、TVの◀▶も、いま開いているタブの中を送る
  - 見た目は棚スキン8種：🎛タブプレーヤー／📝ノート／🌈シール帳／🗄カード目録／📼カセットラベル／🖍黒板／🕹レトロPC／📁クリアファイル
  - 曲リストの見出しの **🎨 ボタン**で、その場で切り替え（🎲おまかせ付き）。設定画面「見た目」で、スキンの選択と **🎨 ボタンを隠す** ができる
  - 保存：`shadow_taiko_preferences_v2` の `libTab` / `libSkin` / `libSkinQuick`（新しい保存キーは増やしていません）
- 映像フィルター45種：
  - basic: skin, color, mono, dim, off ／ vivid: vivid, pop, pastel ／ retro: warm, cool, vintage, film, crt, vhs
  - cinema: cinema, cinemascope, noir, news, commercial ／ effect: night, security, dream, faded, poster, soft
  - weird: underwater, thermal, xray, nightvision, gameboy, dot, newspaper, blueprint(grid overlay), comic, invert, acid, vaporwave, cyberpunk, matrix, kaleido
  - nature: sunset, moonlight, aurora, lava, ice
  - オーバーレイ対応：vignette, grain, crt, vhs, letterbox, scope, scan, bloom, soft, grid
- 緊急復旧：
  - URLコマンド：`?safe=1` / `#safe` → セーフモード（映像OFF・ぼかし0・TV初期化・fxPower0）、`?reset=tv` / `video` / `audio` / `notes` / `all` / `factory`、`?export=notes|all|tv|audio`
  - コンソール：`trkReset('tv')`, `trkExport('notes')`／設定画面に `🛟 緊急復旧` パネル／隠しトリガー（タイトル5回クリック、Ctrl+Shift+S、Esc長押し）／フローティング🛟ボタン／バナー表示（6秒）
- キャッシュ：`sw.js` CACHE `trk-v2026.10.4-tvmk1`（**今回の更新で変更済み**）
- 前回PR：#2 元プロジェクト統合版採用、#3 TVドック拡張＋緊急復旧

## 2. 未確認・次の候補
1. 実ブラウザで全30スキン＋カスタムTV・45フィルターの見た目確認（特に新20スキンのモバイル表示、`#tvMaker` の900px以下の1列表示、🎬ドックの画面に映る映像の見え方）
2. カスタムTVの実機確認：壁掛け→自作TVに戻ったときヘッダーから曲リストへ戻るか（jsdomでは確認済み）、プロジェクター/透明スキンと併用したときの見え方
3. `?safe=1` 後の壁掛けTV位置がヘッダーで被らないか微調整（right:140px → headToolsとの兼ね合い）
4. カスタムTVのオーバーレイ（grid）の見た目をもう少し派手に／他にrainbowやdots追加？
5. TVスキンごとのお気に入りスロット数（n）のバランス調整（8は多い？）
6. 映像フィルターの共有URL：`?tv=underwater&skin=arcade` のような共有リンク生成（カスタムTVのIDも載せられる）
6.5. 🎬 続きの候補：確認タブの映像を**一時停止・シーク**できるようにする／`tvpWrap` の下に「この設定で遊ぶ」ボタン／TVの画面の映像に**音量メーターやスペクトラム**を重ねる（`TrkFX.tap()` は音声エフェクト用なので映像には使えない点に注意）
7. TV画面に音声スペクトラム表示（`TrkFX.tap()` 使用）
8. カスタムTVスキンの追加機能：柄（グラデーション/木目/ドット）・LCDの色・スキンの複製ボタン・サムネイル一覧
9. 選曲画面のTVドックとFXドックの並び順をドラッグで入れ替え
10. Pagesデプロイ確認（og.png, icons）／スマホ実機確認
11. About / NOTICE / README のライセンス表記を最新に

### 💭 YouTube連携について（今回の会話の結論・未実装）
- **ストリームのダウンロード／抽出はNG**。YouTube利用規約 5.1.8（アクセス・複製・ダウンロード・配信などの禁止）に明確に反する。私的利用でも規約違反で、再配布は著作権法上もNG。非営利で公開しているtrk!には入れない方針
- **公式の埋め込みプレーヤー（IFrame Player API）なら規約内**。ただし：
  - 音はクロスオリジンのiframeなので **Web Audio に取れない** → fx.js のエフェクト（EQ・空間系など）は**かけられない**
  - **映像は CSS filter が iframe にも効く**ので、TVドックの映像フィルターならかけられる（全画面にすると外れる・埋め込み禁止の動画は見られない・年齢制限はサインインが要る）
  - 音が取れない＝**譜面の自動生成には使えない**（プレイヤーとして見るだけ）
- やるなら「選曲画面に 📺 YouTube タブ → 公式埋め込み＋映像フィルター＋公式APIの再生速度/音量」まで。やるかどうかは次回決める

## 3. 触るときの約束
- 保存キー：shadow_taiko_preferences_v2, _records_v1, _best_v1, _song_prefs_v1, _custom_skins_v1, trk_fx_presets_v1, **trk_tv_skins_v1（新）**, IndexedDB shadow_taiko_packs/_songs/_library/_vrm
- 形式名：shadow-taiko-pack / chart / records / skin.shadow-taiko / trk-fx / trk-verified / **trk-tvskin**, 譜面ファイル *.shadow-taiko.json
- 読み込み順：tv-presets.js → core.js → fx-dock.js → tv-dock.js → fx.js → library.js … player.jsはcore直後
- 関数を包む方式：包まれる側をconstにしない（function宣言のまま）— tv-dock.js は `videoFilter` と `drawVideo` を包む
- 翻訳：4言語すべて、キーは接頭辞分け（tv… / **tvm…（カスタムTV）** / sfx… / vf…）、tr()は未定義キーをそのまま表示
- 音：createMediaElementSourceは一度だけ、TrkFX.tap()を使う
- 公開更新したらsw.jsのCACHE名を変える — 今回 `trk-v2026.10.4-tvmk1`
- ライセンス：新ファイル先頭に SPDX／初音ミク：js/characters/miku.jsだけに集約／素材：権利のあるものだけ
- GitHub Pagesは大文字小文字区別
- TVドックに内蔵スキンを足すとき：TV_DOCK_SKINSにエントリ → buildDeco()に分岐 → css/style.cssにスキンCSS → 必要ならオーバーレイ追加
- カスタムTVの飾り（deco）を足すとき：`buildDeco()` と `TV_DECO_KEYS` の両方に（ラベルは内蔵スキンから借りる）

## 4. 検証のしかた
```sh
python3 -m http.server 8000 --bind 0.0.0.0
# 別ターミナル
for f in js/*.js js/characters/*.js; do node --check "$f" || echo "NG: $f"; done
# ブラウザで
# - http://localhost:8000/?safe=1 → セーフモードバナー
# - http://localhost:8000/?reset=tv → 映像リセットバナー／?export=notes → JSONダウンロード
# - 設定 → 🖼 表示 → 🎨 カスタムTVスキン：色を変えてプレビューが変わるか、「＋ 新規保存」でTVドックに反映されるか
# - TVドック30種切り替え、家庭用TVの▲▼、gridオーバーレイ（青焼き）、右下🛟ボタン
```
- 実ブラウザが使えない環境では **jsdom** でも配線ミスを拾える（読み込みエラー0・新規保存・上書き・読み込み・削除・再読み込みの復元・翻訳キーの抜け）
  - 例：`npm i jsdom` して、index.html の script を `vm.runInContext` で順に流し、DOMContentLoaded を発火 → コンソールエラーと DOM を見る
  - canvas は `getContext` をスタブする（無いと render.js で落ちる）

## 5. 手動チェックリスト
- [ ] F12 Consoleに赤いエラーが出ていない
- [ ] 選曲画面のTVドックが表示され、30スキン切り替えできる
- [ ] 家庭用TVの▲▼で映像が横に切り替わる、＋－で音量変わる
- [ ] 壁掛けTV選択時、ヘッダー右上に移動し、他スキン（自作TV含む）に戻すとsongColに戻る
- [ ] プロジェクター選択時、画面全体が真っ暗にならない
- [ ] 映像フィルター45種が「くわしく」セレクトに表示され、weird/natureカテゴリがある
- [ ] 🎨 カスタムTVスキン：色・形・飾りを変えるとプレビューが即変わる
- [ ] 🎨「＋ 新規保存」→ TVドックが自作TVになり、スキン一覧に「🎨 名前」が出る
- [ ] 🎨 上書き保存・書き出し（.tvskin.json）・読み込み・削除ができる（内蔵スキンでは上書き/削除が断られる）
- [ ] 🎨 リロードしても自作TVが選ばれたまま／`?safe=1` で家庭用TVに戻る（自作TVの定義は残る）
- [ ] 🎬 曲を選ぶと、TVドックの画面にそのmp4が映る（TVスキンを変えても映り続ける）
- [ ] 🖼 くわしく →「映像の確認」タブ：映像が動き、フィルター・スキン・暗さ・ぼかしを変えると即座に反映される
- [ ] 🖼 確認タブを閉じると映像が止まり、ミュートが元に戻る（音ありプレビューがオンのときは音も出たまま）
- [ ] 🎬「音のプレビュー」をオフにしても、チェックを入れればメニューで映像が流れる（音は出ない）
- [ ] 🎬 ゲームを始めると映像が止まる／選曲に戻ると再開する
- [ ] ⏻ミュート（オーディオ側のドック）と 🔉音量が、映像再生と喧嘩しない
- [ ] 青焼き（blueprint）でgridオーバーレイが表示される
- [ ] ?safe=1 で映像OFF・ぼかし0・TV初期化され、バナーが出てURLが綺麗になる
- [ ] ?reset=tv でノーツは保持されたまま映像だけリセット
- [ ] 緊急パネルでノーツ書き出し・全設定書き出し・読み込みができる
- [ ] タイトルを5回クリックでセーフモード確認ダイアログ／右下🛟ボタンで?safe=1に遷移
- [ ] デモ（Pulse Study）で遊べる・音が鳴る
- [ ] 言語4種切り替えで生キーが出ない（カスタムTVの画面も）
- [ ] 設定を変えてリロード→残っている
- [ ] PWA：インストールできる／オフラインで再読み込みできる
