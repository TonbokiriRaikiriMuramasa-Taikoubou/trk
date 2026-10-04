<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# trk! 次回セッション用メモ（NEXT_SESSION_HANDOFF.md）

> 作成：2026-10-04（PR #3「feat(tv): 30 TV skins, 45 video filters, emergency recovery via URL」を main にマージした直後）
> このメモは、そのまま次回の最初のメッセージに貼っても再開できます。
> リポジトリにこのファイルがあれば「`NEXT_SESSION_HANDOFF.md` を読んで現状を確認して」でOKです。

## 0. 次回、最初にやること（5分）
1. `git fetch origin && git log --oneline -5 origin/main && git status`
2. `docs/HANDOFF.md` と `NEXT_SESSION_HANDOFF.md` を読む
3. 実ブラウザで `python3 -m http.server 8000 --bind 0.0.0.0` → F12 Consoleに赤エラーがないか、TVドック30種・映像45種が動くか、?safe=1 が効くか確認
4. 作業ツリーを壊さない（`git clean` / `git reset --hard` は使わない）

## 1. いまの状態（2026-10-04 時点）
- 構成：ルートに `index.html` ＋ `css/` ＋ `js/`（tv-presets.js, tv-dock.js, core.js など）＋ `icons/` ＋ `docs/` ＋ `tools/` ＋ `verified.json`
- モード5（manual/truck/orbit/stage/catch）、スキン9→TVドック側は30、レイアウト4、難易度5、画面4、翻訳4言語、SE 115プリセット、**映像フィルター45種**
- TVドック：
  - スキン30種：standard, home(初期), crt, wood, portable, kamishibai, tube, wall, future, projector, phone, arcade, laptop, cinema, car, airplane, vr, aquarium, scope, cctv, gameboy, jumbotron, frame, transparent, toy, cardboard, window, microwave, videowall, hologram
  - 各スキンに物理デコ（`buildDeco()`）と専用CSS（`css/style.css` 700行超）
  - 家庭用TVはCH表示＋▲▼で映像横切替、＋－で音量
  - 壁掛けTVは `#selectScreen .head` に `wall-mounted` として絶対配置（タイトル横の空きエリア）
  - プロジェクター真っ暗バグ修正：背景を明るく、projBeam非表示、projLens追加
  - リセットボタン：映像・TV設定を初期化
- 映像フィルター45種：
  - basic: skin, color, mono, dim, off
  - vivid: vivid, pop, pastel
  - retro: warm, cool, vintage, film, crt, vhs
  - cinema: cinema, cinemascope, noir, news, commercial
  - effect: night, security, dream, faded, poster, soft
  - weird(新): underwater, thermal, xray, nightvision, gameboy, dot, newspaper, blueprint(grid overlay追加), comic, invert, acid, vaporwave, cyberpunk, matrix, kaleido
  - nature(新): sunset, moonlight, aurora, lava, ice
  - オーバーレイ対応：vignette, grain, crt, vhs, letterbox, scope, scan, bloom, soft, grid（新規実装）
- 緊急復旧：
  - URLコマンド：`?safe=1` / `#safe` → セーフモード（映像OFF・ぼかし0・TV初期化・fxPower0）、`?reset=tv` / `video` / `audio` / `notes` / `all` / `factory`、`?export=notes|all|tv|audio`
  - コンソール：`trkReset('tv')`, `trkExport('notes')`
  - 設定画面に `🛟 緊急復旧` パネル（書き出し・読み込み、URL一覧）
  - 隠しトリガー：タイトル5回クリック、Ctrl+Shift+S、Esc長押しでセーフモード確認
  - フローティング🛟ボタン（右下、通常opacity .15、3秒後に一瞬光る）
  - バナー表示（6秒）＋URLパラメータ自動削除
  - `js/core.js` に `resetVideoPrefs`, `resetAudioPrefs`, `resetNotesPrefs`, `enterSafeMode`, `resetAllPrefs`, `exportPrefs`, `handleUrlCommands`, `setupEmergencyPanel`, `setupHiddenEmergency`
  - `index.html` に emergencyPanel と floatingSafeBtn 追加
- キャッシュ：`sw.js` CACHE `trk-v2026.10.3-tv5-final`
- 前回PR：#2 元プロジェクト統合版採用、#3 TVドック拡張＋緊急復旧（今回）

## 2. 未確認・次の候補
1. 実ブラウザで全30スキン・45フィルターの見た目確認（特に新20スキンのモバイル表示）
2. `?safe=1` 後の壁掛けTV位置がヘッダーで被らないか微調整（right:140px → headToolsとの兼ね合い）
3. 新フィルターのオーバーレイ（grid）の見た目をもう少し派手に／他にrainbowやdots追加？
4. TVスキンごとのお気に入りスロット数（n）のバランス調整（8は多い？）
5. 映像フィルターの共有URL：`?tv=underwater&skin=arcade` のような共有リンク生成
6. TV画面に音声スペクトラム表示（`TrkFX.tap()` 使用）
7. カスタムTVスキンエディタ（色・形をユーザーが作れる）
8. 選曲画面のTVドックとFXドックの並び順をドラッグで入れ替え
9. Pagesデプロイ確認（og.png, icons）
10. スマホ実機確認
11. About / NOTICE / README のライセンス表記を最新に

## 3. 触るときの約束
- 保存キー：shadow_taiko_preferences_v2, _records_v1, _best_v1, _song_prefs_v1, _custom_skins_v1, trk_fx_presets_v1, IndexedDB shadow_taiko_packs/_songs/_library/_vrm
- 形式名：shadow-taiko-pack / chart / records / skin.shadow-taiko / trk-fx / trk-verified / *.shadow-taiko.json
- 読み込み順：tv-presets.js → core.js → fx-dock.js → tv-dock.js → fx.js → library.js ... player.jsはcore直後、fx-dockはlibrary/mainより前
- 関数を包む方式：包まれる側をconstにしない（function宣言のまま）— tv-dock.js の drawTvOverlay は function
- 翻訳：4言語すべて、キーは接頭辞分け、tr()は未定義キーをそのまま表示 — tvCatWeird, tvCatNature 追加済み
- 音：createMediaElementSourceは一度だけ、TrkFX.tap()を使う
- 公開更新したらsw.jsのCACHE名を変える — 今回 tv5-final
- ライセンス：新ファイル先頭に SPDX
- 初音ミク：js/characters/miku.jsだけに集約
- 素材：権利のあるものだけ（*.mp3などと*.shadow-taiko.jsonは.gitignore済み）
- GitHub Pagesは大文字小文字区別
- TVドック追加時の手順：TV_DOCK_SKINSにエントリ → buildDeco()に分岐追加 → css/style.cssにスキンCSS → 必要ならオーバーレイ追加

## 4. 検証のしかた
```sh
python3 -m http.server 8000 --bind 0.0.0.0
# 別ターミナル
for f in js/*.js js/characters/*.js; do node --check "$f" || echo "NG: $f"; done
# ブラウザで
# - http://localhost:8000/?safe=1 → セーフモードバナー
# - http://localhost:8000/?reset=tv → 映像リセットバナー
# - http://localhost:8000/?export=notes → JSONダウンロード
# - TVドックで30スキン切り替え、物理ボタン▲▼が効くか
# - 映像45種切り替え、gridオーバーレイ（青焼き）が表示されるか
# - 設定画面の一番下「🛟 緊急復旧」パネルが表示されるか
# - 右下の🛟フローティングボタンが3秒後に光るか
```

## 5. 手動チェックリスト
- [ ] F12 Consoleに赤いエラーが出ていない
- [ ] 選曲画面のTVドックが表示され、30スキン切り替えできる
- [ ] 家庭用TVの▲▼で映像が横に切り替わる、＋－で音量変わる
- [ ] 壁掛けTV選択時、ヘッダー右上に移動し、他スキンに戻すとsongColに戻る
- [ ] プロジェクター選択時、画面全体が真っ暗にならない
- [ ] 映像フィルター45種が「くわしく」セレクトに表示され、weird/natureカテゴリがある
- [ ] 青焼き（blueprint）でgridオーバーレイが表示される
- [ ] ?safe=1 で映像OFF・ぼかし0・TV初期化され、バナーが出てURLが綺麗になる
- [ ] ?reset=tv でノーツは保持されたまま映像だけリセット
- [ ] 緊急パネルでノーツ書き出し・全設定書き出し・読み込みができる
- [ ] タイトルを5回クリックでセーフモード確認ダイアログ
- [ ] 右下🛟ボタンで?safe=1に遷移
- [ ] デモ（Pulse Study）で遊べる・音が鳴る
- [ ] 言語4種切り替えで生キーが出ない
- [ ] 設定を変えてリロード→残っている
- [ ] PWA：インストールできる／オフラインで再読み込みできる
