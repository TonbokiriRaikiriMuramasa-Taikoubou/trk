<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
# trk! 次回セッション用メモ（NEXT_SESSION_HANDOFF.md）

> 作成：2026-10-04（PR #2「元プロジェクト（統合版）を採用」を main にマージした直後）
> このメモは、そのまま次回の最初のメッセージに貼っても再開できます。
> リポジトリにこのファイルがあれば「`NEXT_SESSION_HANDOFF.md` を読んで現状を確認して」でOKです。

## 0. 次回、最初にやること（5分）
1. `git fetch origin && git log --oneline -5 origin/main && git status`
2. `docs/HANDOFF.md` と `docs/verified.md` を読む
3. 作業ツリーを壊さない（`git clean` / `git reset --hard` は使わない）
4. 下の「2. 未確認のこと」から作業を選ぶ。いちばん優先は実ブラウザでの動作確認

## 1. いまの状態（2026-10-04 時点）
- 構成：ルートに `index.html` ＋ `css/` ＋ `js/`（24本）＋ `icons/` ＋ `docs/` ＋ `tools/` ＋ `verified.json`
- モード5（manual/truck/orbit/stage/catch）、スキン9、レイアウト4、難易度5、画面4、翻訳4言語×749キー、SE 115プリセット
- 前回：元ソース採用、feedbackLabel追加、sw.js登録追加、CACHE v2026.10.2、pages.ymlをルート丸ごと公開に変更

## 2. 未確認のこと
1. 実ブラウザで全ファイルの動作確認（F12 Consoleに赤エラーがないか） - HANDOFF 12章の唯一の未チェック
2. Pagesデプロイ確認
3. 手動チェックリスト（5章）
4. スマホ確認
5. About入れる
6. NOTICE.mdとREADMEのライセンスと権利をそろえる
7. docs/checklist.md作成
8. Discussions検討
9. アイコン作り直し

## 3. 触るときの約束
- 保存キー：shadow_taiko_preferences_v2, _records_v1, _best_v1, _song_prefs_v1, _custom_skins_v1, trk_fx_presets_v1, IndexedDB shadow_taiko_packs/_songs/_library/_vrm
- 形式名：shadow-taiko-pack / chart / records / skin.shadow-taiko / trk-fx / trk-verified / *.shadow-taiko.json
- 読み込み順：player.jsはcore.js直後、fx-dock.jsはlibrary.js・main.jsより前、speed.js・vrm.jsはmain.jsの後
- 関数を包む方式：包まれる側をconstにしない（function宣言のまま）
- 翻訳：4言語すべてに、キーは接頭辞分け、tr()は未定義キーをそのまま表示
- 音：createMediaElementSourceは一度だけ、TrkFX.tap()を使う
- 公開更新したらsw.jsのCACHE名を変える
- ライセンス：新ファイル先頭に SPDX
- 初音ミク：js/characters/miku.jsだけに集約
- 素材：権利のあるものだけ（*.mp3などと*.shadow-taiko.jsonは.gitignore済み）
- GitHub Pagesは大文字小文字区別

## 4. 検証のしかた
```sh
python3 -m http.server 8000 --bind 0.0.0.0
for f in js/*.js js/characters/*.js; do node --check "$f" || echo "NG: $f"; done
```

## 5. 手動チェックリスト
- [ ] F12 Consoleに赤いエラーが出ていない
- [ ] 選曲画面の連絡先が「感想・要望・不具合はこちらへ X @ttrk143 ／ GitHub Issues」と出る
- [ ] デモ（Pulse Study）で遊べる・音が鳴る
- [ ] 手持ちの音源を読み込める
- [ ] 5モードをそれぞれ1回プレイ
- [ ] スキンを9種とも切り替え（miku39含む）
- [ ] 言語を4種とも切り替え（生キーが出ない）
- [ ] 設定を変えてリロード→残っている
- [ ] PWA：インストールできる／オフラインで再読み込みできる
- [ ] VRMマスコット
- [ ] 公認パック：verified.jsonは今は空なので✔が出ないのが正しい

