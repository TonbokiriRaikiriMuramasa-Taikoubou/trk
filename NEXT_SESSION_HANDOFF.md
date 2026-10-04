<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# trk! 次回セッション用メモ（NEXT_SESSION_HANDOFF.md）

> 最終更新：**2026-10-05**（PR #5 マージ済み／💠 MMD同梱プリセット機構＋内蔵モーション5種化の回）
> このメモは、そのまま次回の最初のメッセージに貼っても再開できます。
> リポジトリにこのファイルがあれば「`NEXT_SESSION_HANDOFF.md` を読んで現状を確認して」でOKです。
> 詳しい仕様（ファイル間の約束・保存データ・落とし穴）は **docs/HANDOFF.md** にあります。

## 0. 次回、最初にやること（5分）

1. `git fetch origin && git log --oneline -5 origin/main && git status`
2. **docs/HANDOFF.md** と このメモを読む
3. 実ブラウザで `python3 -m http.server 8000 --bind 0.0.0.0` → F12 Console に赤エラーがないか、
   選曲画面（TVドック・曲タブ）／⭐お気に入り／🩷MMD／`?safe=1` をひととおり見る
4. 作業ツリーを壊さない（**`git clean` / `git reset --hard` は使わない**）

---

## 1. いまの状態（2026-10-05）

### 1-1. main に入っているもの

- **PR #4 をマージ済み**（`0fb3157`、2026-10-04）。Task C〜J が全部 main に入っています：
  | Task | 内容 | commit |
  |---|---|---|
  | C | 🎨 カスタムTVスキンエディタ ＋ `trk-tvskin` 共有 | `7d186d4` |
  | D | 🎬🖼 選曲中にmp4を流す（ドックの画面＋「映像の確認」タブ） | `96f048d` |
  | E | 📺◀▶ 曲送りボタンと、TV→ラック→くわしい×2 のならべ方 | `1f90656` |
  | F | 📚 曲のタブ（棚）と、棚スキン | `347e863` |
  | G | 🧩 アドオン（あとから機能を足すしくみ） | `57fc3b1` |
  | H | 🩷 MMDマスコット（モデル・モーションは持ち込み式） | `99eb003` |
  | I | ⭐ お気に入りのフォルダ管理（上限なし・1軍/2軍/🧊/📤元） | `503d54e` |
  | J | ▶◀ 演奏中も曲を送る設定（初期オフ）＋ 🔎 MMD動作チェック | `89ba00e` |
  | — | fix: お気に入り一覧の名前がIDで出ていたのを修正 | `0975e05` |
- これまでの PR：#2 元プロジェクト統合版 → #3 TVドック拡張＋緊急復旧 → #4（上記）→ **#5 棚スキン11種＋ドキュメント整理（`1425839` でマージ済み）**。
- いまの作業ブランチ：**`arena/01a10781-trk`**（💠 MMD同梱プリセットの回）

### 1-1b. 今回（arena/01a10781-trk）でやったこと：💠 Lat式ミク同梱の下ごしらえ

- **方針決定（坂主さん確認済み）**：同梱は **Lat式ミクだけ採用**。れあどめ原文の
  「版権元ガイドラインの範囲内であれば改変・流用を含む利用・再配布等オールOK」を根拠に、
  **れあどめ原文ごと**同梱する。タワシ式CHAN×CO風は readme 原文が確認できるまで持ち込み式のまま
- **💠 同梱プリセット機構（js/mmd.js）**：`assets/mmd/<dir>/preset.json` があるときだけ、
  設定 →🩷 MMD に💠ボタンが出る。1クリックで fetch→読み込み→クレジット・モーション・基準BPMを自動設定。
  同意チェック不要（規約ごと同梱のため）。`?safe=1` では探しにも行かない。**モデル未配置ならボタンは出ない＝従来どおり**
- **内蔵モーションが5種に**：④ジャンプ（130BPM・バンザイして跳ぶ・派手）／⑤アイドル（128BPM・サイドステップ＋こぶし突き上げ）。
  どちらも自作VMD（コード生成・GPL対象）。タワシ式のようなデフォルメモデルだと④が特に派手に見えるはず
- **置き場**：`assets/mmd/README.md`（足し方と規約の条件）／`assets/mmd/lat-miku/`＝**Lat式ミク Ver2.31 Normal 投入済み**
  （pmd＋テクスチャ18＋ReadMe.txt原文＋preset.json、計18.6MB。jsdom実HTTP検証で22項目全部OK）
- **NOTICE.md に 3a 追加**：assets/mmd/ は GPL対象外・れあどめ原文同梱が条件・商用フォークは assets/mmd/ ごと削除
- 新i18nキー：`mmdPresetBtn` `mmdPresetHint` `mmdPresetMissing` `mmdMotionJump` `mmdMotionIdol`（4言語）＋ `mmdHint` を4言語とも更新
- `sw.js` の `CACHE`＝**`trk-v2026.10.5-mmdpreset1`**
- 検証：`jsdom-mmdpreset.mjs`（18本目）全部OK／`node --check` 全ファイルOK

### 1-2. 規模（数字で見る現在地）

| 項目 | 数 |
|---|---|
| モード | 5（manual / truck / orbit / stage / catch）＋ AUTO・ラジオ・練習 |
| スキン | 9（ノーツの見た目）／TVドック **30**（＋カスタム最大30） |
| 映像フィルター | **45**（basic/vivid/retro/cinema/effect/weird/nature） |
| サウンドエフェクト | **115 プリセット**（fx.js・fx-presets.js は🧊凍結中） |
| 曲リストの棚スキン | **11**（＋🎲おまかせ） |
| 言語 | 4（ja/en/zh/ko）・**992 キー × 4**（欠け0・生キー0） |
| 記録 | 難易度5・速度別・称号・公認パック（✔） |

### 1-3. 機能の要点（詳細は docs/HANDOFF.md）

- **TVドック（tv-dock.js）**：スキン30種＋カスタムTV。◀▶ で曲送り、家庭用TVの▲▼で映像横切替、選曲中は画面にmp4。
- **◀▶ の演奏中送り**：設定 →🎛設定タブの **「▶◀ 演奏中も ◀▶ で曲を変える」**（`settings.tvSongWhilePlaying`・**初期オフ**）。
  オンのときだけ、演奏中でも押したその場で曲が切り替わる（**記録は残らない**）。**キー（←/→＝10秒スキップ）は従来のまま**。
- **棚スキン（lib-skins.js）11種**：🎛タブプレーヤー／📝ノート／🌈シール帳／🗄カード目録／📼カセットラベル／🖍黒板／
  🕹レトロPC／📁クリアファイル／**🎰ジュークボックス／📻ラジオ番組表／🚉電光掲示板**（2026-10-05 追加）。
  曲リストの 🎨 ボタンでその場で切り替え（`settings.libSkin` / `libSkinQuick`）。
- **⭐ お気に入り（favs.js）**：曲・映像フィルター・エフェクトの3系統を **⭐1軍／⭐2軍／🧊フリーズ／📤元お気に入り** の4フォルダで管理。
  **上限なし**、🧊＝凍結、📌＝「絶対に外れない」（🎲の候補に必ず入る）、📤元は抽選に出ない、`trk-favs` で書き出し／読み込み（足し算）。
- **🩷 MMD（mmd.js）**：モデル（.pmx/.pmd）と .vmd は**同梱せず持ち込み**。内蔵モーション3種は自作VMD。曲のBPMに同期。
  **🔎 動作チェック**（設定 →🩷 MMDマスコット）で、WebGL・CDN・モデル・モーションの状態を1か所に出せる（📋 結果をコピー）。
- **🧩 アドオン（addons.js）**：`.js` / `.trk-addon` を入れて、設定・曲リスト・TV/ラックのくわしい欄にUIを足す／曲を足す／
  自前の音を `api.fx.tapElement` でエフェクターに通す。`trk_addons_v1`。`?safe=1` では読み込まない。
- **🛟 緊急復旧**：`?safe=1` / `?reset=tv|video|audio|notes|all|factory` / `?export=…`、コンソール `trkReset()` `trkExport()`。
- キャッシュ：`sw.js` の `CACHE` は **`trk-v2026.10.5-shelf1`**（公開を更新したら必ず変える）。

---

## 2. 未確認・次の候補

0. **💠 Lat式ミクの実機確認（新・最優先）** — モデルは**投入済み**（2026-10-05）
   - `assets/mmd/lat-miku/` に Normal.pmd（ASCII名にリネーム・中身無改変）＋テクスチャ18＋**ReadMe.txt原文**＋`preset.json` が入っている
   - ReadMe.txt 原文で再配布OKを確認済み（「PCL対象内外問わず、規約内であれば再配布OK。ReadMe.txt同梱と製作者・改変元の明記が条件」→ lat-miku/README.md に明記済み）
   - 残るは**実ブラウザ**：💠ボタン→テクスチャ・toonが正しく出るか／④ジャンプの見た目／クレジット表示／リロード復元／`?safe=1`
   - 元zipはリポジトリから削除済み（mainの履歴 `83a174b` から復元可能。White・セーラー服は未同梱）
0b. **🩷 MMDの実機確認（持ち越し）**
   - CDNから three／three-mmd-loader が読めるか／Lat式ミク・タワシ式CHAN×CO系ミクの .pmx が動くか／
     テクスチャ付きフォルダ／自分の .vmd が曲に合うか／モバイル幅の見え方
   - **手順＝設定 →🩷 MMDマスコット →🔎 動作チェック →📋 結果をコピー → 貼って送る**（切り分けは `webgl=` → `three=NG`＋`libError` → `loader=` → `model=` の順）
1. **🎰📻🚉 新しい棚スキン3種の実機の見た目**（モバイル幅・長い曲名のタブ・タブが1つのとき）
2. 実ブラウザで全30スキン＋カスタムTV・45フィルターの見た目（特に新20スキンのモバイル表示、`#tvMaker` の900px以下の1列表示、🎬ドックの画面に映る映像の見え方）
3. カスタムTVの実機確認：壁掛け→自作TVに戻ったときヘッダーから曲リストへ戻るか（jsdomでは確認済み）、プロジェクター/透明スキンと併用したときの見え方
4. `?safe=1` 後の壁掛けTV位置がヘッダーで被らないか微調整（right:140px → headToolsとの兼ね合い）
5. カスタムTVのオーバーレイ（grid）の見た目をもう少し派手に／他に rainbow や dots を足す？
6. TVスキンごとのお気に入りスロット数（n）のバランス調整（8は多い？）
7. 映像フィルターの共有URL：`?tv=underwater&skin=arcade` のような共有リンク生成
8. 🎬 続きの候補：確認タブの映像を**一時停止・シーク**できるようにする／`tvpWrap` の下に「この設定で遊ぶ」ボタン／TVの画面に**スペクトラム**を重ねる
9. カスタムTVスキンの追加機能：柄（グラデーション/木目/ドット）・LCDの色・スキンの複製ボタン・サムネイル一覧
10. 選曲画面のTVドックとFXドックの並び順をドラッグで入れ替え
11. Pagesデプロイ確認（og.png, icons）／スマホ実機確認／About・NOTICE・README のライセンス表記を最新に
12. 曲管理の続き（アイデア）：💿レコード棚／📼レンタルビデオ屋／🎤カラオケ目次／🗂️図書館の書架／🍱お品書き など

**前回までの未回答の質問は、どちらも回答済み**：お気に入りの上限＝**かけない**（Task I）／演奏中も◀▶＝**設定でオンにできる（初期オフ）**（Task J）

### 💭 YouTube連携について（結論・未実装）

- **ストリームのダウンロード／抽出はNG**。YouTube利用規約 5.1.8（アクセス・複製・ダウンロード・配信などの禁止）に明確に反する。私的利用でも規約違反で、再配布は著作権法上もNG。非営利で公開しているtrk!には入れない方針
- **公式の埋め込みプレーヤー（IFrame Player API）なら規約内**。ただし：
  - 音はクロスオリジンのiframeなので **Web Audio に取れない** → fx.js のエフェクト（EQ・空間系など）は**かけられない**
  - **映像は CSS filter が iframe にも効く**ので、TVドックの映像フィルターならかけられる（全画面にすると外れる・埋め込み禁止の動画は見られない・年齢制限はサインインが要る）
  - 音が取れない＝**譜面の自動生成には使えない**（プレイヤーとして見るだけ）
- やるなら「選曲画面に 📺 YouTube タブ → 公式埋め込み＋映像フィルター＋公式APIの再生速度/音量」まで。やるかどうかは次回決める

---

## 3. 触るときの約束

- **保存キー（変えない）**：`shadow_taiko_preferences_v2` / `_records_v1` / `_best_v1` / `_song_prefs_v1` / `_custom_skins_v1` / `trk_fx_presets_v1` / `trk_tv_skins_v1` / `trk_addons_v1` / IndexedDB `shadow_taiko_packs` `_songs` `_library` `_vrm` `_mmd`
  - 新しく足したのは **`settings.favs` / `settings.songFav`**（＋既存キーの中の新しい項目 `tvSongWhilePlaying` `mmd*` `libTab` `libSkin` `libSkinQuick`）。既存キーと形式名はそのまま
- **形式名（変えない）**：`shadow-taiko-pack` / `chart` / `records` / `skin` / `trk-fx` / `trk-verified` / `trk-tvskin` / **`trk-favs`**、譜面ファイル `*.shadow-taiko.json`
- **読み込み順**：`tv-presets.js → core.js → fx-dock.js → tv-dock.js → fx.js → favs.js → library.js → verified.js → lib-skins.js → addons.js → main.js → speed.js → vrm.js → mmd.js`（player.js は core の直後、mmd.js は vrm.js の直後）
- **関数を包む方式**：包まれる側を `const` にしない（`function` 宣言のまま）— tv-dock.js が `videoFilter` と `drawVideo` を、favs.js が fx の ★ を包む
- **新しい設定を足したときの3点セット**：①`core.js` の `enterSafeMode()` ②`resetVideoPrefs()` ③読み戻し側（`tv-dock.js` の `keepSafe`＝`?safe=1` では保存値を読み戻さない）。どれか忘れると `?safe=1` が効かなくなる
- **翻訳**：4言語すべて更新。キーは接頭辞で分ける（`tv…` / `tvm…` / `sfx…` / `vf…` / `mmd…` / `libTab…` / `libSkin…` / `fav…`）。生のキー表示は禁止（`jsdom-i18n-audit.mjs` で点検できる）
- **音**：`createMediaElementSource` は一度だけ → `TrkFX.tap()`。アドオンは `api.fx.tapElement()`
- **スキンの足し方**：
  - TVドック：`TV_DOCK_SKINS` にエントリ → `buildDeco()` に分岐 → `css/style.css` にスキンCSS → 必要ならオーバーレイ
  - カスタムTVの飾り：`buildDeco()` と `TV_DECO_KEYS` の両方に
  - **棚スキン：`css/style.css` に `#libPanel[data-lib-skin="…"]` の1ブロック ＋ `js/lib-skins.js` の `LIB_SKIN_ORDER`（順番）と `LIB_SKINS`（icon ＋4言語ラベル）に1行**
- **MMD**：モデル・モーションは**原則リポジトリに入れない**（持ち込み式）。内蔵モーションは自作VMDのみ。`three/addons/loaders/MMDLoader.js` を足さない（r180に無い）
  - **例外＝💠同梱プリセット**：れあどめ原文で**再配布OK**を確認できたモデルだけ（いまは Lat式ミクのみ採用）。
    足し方＝`assets/mmd/<dir>/` に「モデル一式＋**れあどめ原文**＋`preset.json`」→ `js/mmd.js` の `PRESET_DIRS` に dir を追加 → NOTICE.md 3a を確認。
    モデル部分は **GPL対象外**（NOTICE.md 3a）。タワシ式などは readme 原文を確認できるまで入れない
- **ライセンス**：新ファイルの先頭に SPDX（GPL-3.0-or-later）／初音ミクは `js/characters/miku.js` だけに集約（PCL）／素材は権利のあるものだけ
- GitHub Pages は**大文字小文字を区別**する。公開を更新したら `sw.js` の `CACHE` 名を変える

---

## 4. 検証のしかた

```sh
python3 -m http.server 8000 --bind 0.0.0.0
# 別ターミナル
for f in js/*.js js/characters/*.js js/addons/*.js; do node --check "$f" || echo "NG: $f"; done
```

- 実ブラウザが使えない環境では **jsdom** で配線を拾える（`npm i jsdom` → `/home/user/browsercheck` で `for f in jsdom-*.mjs; do node "$f"; done`）
  - canvas は `getContext` をスタブする。**`createImageData` も返す**こと（TV砂嵐が `img.data` を読む）
  - ハーネスは **18本**：`smoke` `func` `i18n` `lang-fav` `libtabs` `menu` `order2` `prev` `rack` `reload` `skinbtn` `dock` `addons` `favs` `mmd` `songwhile` `i18n-audit` `mmdpreset`
    - `jsdom-mmdpreset.mjs`（🆕）は fetch と three／three-mmd-loader を偽物に差し替えて、💠 preset.json 検出→ボタン→読み込み→credit/motion/bpm 自動設定、jump/idol のVMD生成、新キー4言語を見る。**jsdom には matchMedia が無い**ので `beforeParse` でスタブする（`TEXT`／`settings` は const/let なので `win.eval` 経由で見る）
    - `jsdom-mmd.mjs` は本物のCDNに届かないので、ページ内に**偽の three／three-mmd-loader** を流し込んで `TrkMMD._injectLibs()` で差し替える
    - `jsdom-i18n-audit.mjs` は静的監査（992キー×4言語の欠け／生キー／コードが使うキーの実在）。**エラー0が正常**
  - 調査用（テスト本数に数えない）：`jsdom-dump.mjs`・`jsdom-debug*.mjs`（exit 1 が正常）、`safeprobe.mjs`（`?safe=1` の設定をJSONで出す・exit 0 が正常）、`probe-*.mjs`

---

## 5. 手動チェックリスト

- [ ] F12 Console に赤いエラーが出ていない
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
- [ ] 📚 曲のタブ：パックを入れるとタブが増える／タブの中で検索・並べ替えができる／TVの◀▶がそのタブの中で動く
- [ ] 📚 棚スキン11種：🎨 ボタンでその場で切り替わる（🎰ジュークボックス・📻ラジオ番組表・🚉電光掲示板を含む）／設定で🎨ボタンを隠せる
- [ ] ⭐ お気に入り：ドックのチップで1軍／2軍／🧊が切り替わり、ボタンの中身が入れ替わる
- [ ] ⭐ お気に入り：🔒で凍結（追加できない）→🔓で解除、📌ピンは🎲の候補に必ず入る、外したものは📤元から戻せる
- [ ] ⭐ お気に入り：曲の行の☆★と ⭐タブ、設定の「⭐ お気に入り」で書き出し／読み込みができる
- [ ] 💠 同梱プリセット：`assets/mmd/lat-miku/` にモデル＋preset.json を置くと💠ボタンが出る／1クリックで踊り出す／クレジット・モーション・BPMが自動で入る
- [ ] 💠 モデル未配置なら💠ボタンも説明も出ない（赤エラーなし）／`?safe=1` では配置してあっても出ない
- [ ] 🩷 内蔵モーション④ジャンプ・⑤アイドルが選べて、見た目が破綻しない（④はバンザイ跳び・⑤は右手突き上げ）
- [ ] 🩷 MMD：規約同意 → モデル（単体／フォルダ）を読み込むと、マスコットが MMD になり動く
- [ ] 🩷 MMD：内蔵モーション3種と自分の .vmd が切り替わり、曲のBPMに合う（`mmdBpm` を変えると速さが変わる）
- [ ] 🩷 MMD：大きさ・向き・クレジットが効く／「保存」を入れておくとリロードしても残る
- [ ] 🩷 MMD：🔎 動作チェックで `webgl=true`・`three=<版>`・`loader=true` が出る（だめなときは 📋 でコピーして貼る）
- [ ] 🩷 MMD：`?safe=1` では読み込まれず、マスコットが「オレンジ相棒」に戻る（赤エラーが出ない）
- [ ] ▶◀ 設定「演奏中も ◀▶ で曲を変える」：オフなら演奏中は何も起きず、オンなら押した曲に切り替わる（記録は残らない）
- [ ] 🧩 アドオン：`js/addons/example.js` を入れてボタンが出る（`?safe=1` で入らなくなる）
- [ ] 言語4種切り替えで生キーが出ない（カスタムTV・MMD・お気に入り・棚スキンの画面も）
- [ ] 設定を変えてリロード→残っている
- [ ] PWA：インストールできる／オフラインで再読み込みできる
