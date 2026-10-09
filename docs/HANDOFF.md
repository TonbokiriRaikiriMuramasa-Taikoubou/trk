# trk! 開発引き継ぎ

> **最終更新：2026-10-09（trk105）**。現行の設計、維持条件、未完了事項をまとめる。詳細な履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、セキュリティは [`SECURITY.md`](SECURITY.md)／[`SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md) を参照。

## 1. 再開・変更の手順

- 作業前に `git status --short` と差分を確認し、既存変更を破棄・上書きしない。
- Arena指定の作業ブランチを維持し、`main` へ直接 push しない。反映はPR経由。
- バンドラーはない。`index.html` のscript読込順が実行順。
- 変更後は最低限 `npm run check` と `git diff --check` を実行する。静的／VMテストの成功を、未実施の実ブラウザ・実機確認済みとは扱わない。
- 公開コードを変更したら、関連テスト・文書・`sw.js` のキャッシュ名を確認する。

## 2. 現在の優先事項

- 音楽カタログと権利確認を優先し、LoLを先に調査する。未依頼のTV機能追加は保留。trk105で依頼されたジャケット表示変更は実装済みで、残りは §7 の実機確認。
- LoLカタログは段階収録中。現在はCreator-Safe Sessions 3作／108曲、近年のChampion Themes 41曲、Worlds/WCS公式アンセム13曲、確認済みMSIアンセム4曲、K/DA 6曲。K/DAは「POP/STARS」と「ALL OUT」EP収録5曲を独立リストに収録済み。全楽曲の網羅を主張しない。
- 次のLoL調査候補は、旧ログインテーマ／旧Champion Themes、他の仮想アーティスト作品、Skin・イベント曲、ゲームOST等。分類を混ぜず、公式の個別曲名・リンク・分類を確認できた範囲だけ追加する。見つからなかったことを「存在しない」と扱わない。
- 調査台帳：[`LEAGUE-OF-LEGENDS-MUSIC.md`](LEAGUE-OF-LEGENDS-MUSIC.md)。曲別出典・fixture：`tools/leagueoflegends-music-tracklist.json`、`tools/leagueoflegends-sessions-tracklist.json`。

## 3. TV・音源ジャケットの維持条件

- **trk100の基本確認は済み**（利用者の実ブラウザ確認、2026-10-09）。音プレビューOFF＋該当設定ONでもMUTEで無音。TVオフで映像を消せる。設定画面・演奏中・映像フィルター「非表示」でもTV映像が出ない。確認済みの条件を未確認に戻さない。
- `specArtwork`（スペクトラム右上のサムネイル）は既定OFF。ゲーム中TV側のMP3サムネイル表示は既定ON。謎設定の3項目（ジャケット全画面／書斎のサムネイルを使用／譜面時の静止画非表示）はすべて既定OFF。
- 「ジャケット画像を全画面にする」は、既存の `artWallpaperBg` 設定キーを再利用する。オフでは原寸以下で動画枠の中央に表示し、オンでは従来の全画面カバー表示にする。設定キー、既定値、リセット、Import/Export、`?safe=1` の扱いを変えない。
- ゲーム背景は `#view` のTVフィルターを受ける。TVドックの別要素として表示する静止カバーにも、CSSによる色調・モノクロ・暗さ・ぼかしを適用する。
- 書斎カバーを手動で設定・解除した場合も、関連設定と画像の優先順位に沿って背景を更新する。動画・静止画の優先関係を崩さない。
- ジャケットの抽出・縮小は端末内で行う。元ファイルは読み取り専用で、画像のアップロードや永続画像保存はしない。

## 4. 権利・データ安全

- 音楽カタログは曲名・クレジット・公式配信／公開先を案内するリンク索引。音源を同梱・再配布しない。公式リンク、視聴、購入、サブスクリプションだけで二次利用・再配布の許諾があるとは扱わない。
- Riotの[日本語法務ページ](https://www.riotgames.com/ja/legal)は一般的な参照先として記録する。個別曲は[Riot Creator-Safeガイドライン](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)と当該曲の条件を照合する。一般の法務案内や「誰でも使える」ライセンスから、K/DA等への包括許諾を推定しない。許諾を根拠にする場合は、対象曲・利用範囲・条件が分かる一次資料を残す。
- K/DA 6曲とWorlds 2026「Know My Name」のCreator-Safe対象・利用条件は未確認。公式Spotify／YouTubeページの確認は二次利用許諾の確認ではない。各曲のリンクと未確認事項はLoL調査台帳に記録する。
- PCL／東方Project等の条件、公開先の受け入れ条件、別途制作した5曲の配布条件は未確認。別途制作曲は第三者録音・サンプル・引用メロディを使っていないが、配布許諾済みとは見なさない。`NOTICE.md` の説明を他作品へ広げない。
- ゲーム内素材・モデル等は [`NOTICE.md`](../NOTICE.md) の個別条件に従う。無料公開・公認・出典表記だけを再配布許可の根拠にしない。
- ユーザーのローカル音源・文章・元ファイルは読み取り専用。入力フォルダ内に作成・移動・削除・上書きしない。書斎のテキスト書き出しだけは、利用者が別に選んだ保存先に衝突しない新規コピーを作る。
- `js/library.js` の公式wish更新では、所持曲と利用者が変更した名前・アイコン・タグを保持する。`matchAliases` は曲名照合用で、根拠のない別名を作らない。プロフィール照合メモは端末内だけ・80文字まで。

## 5. その他の維持仕様

- 新規UI文言は日本語・英語・中国語・韓国語を同時に追加する。`js/fx.js`／`js/fx-presets.js` は凍結扱い。
- 譜面生成 `chartGen=2` が既定、`1` は旧方式への選択肢。MANUAL判定は `smart` が既定で、❓謎設定 `judgeOrdered` から旧方式へ戻せる。詳細は [`JUDGE-MATCH.md`](JUDGE-MATCH.md) と [`guide/play.md`](guide/play.md)。
- MMD内蔵モーションは **65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。新規・リセット時の表情既定は `faceSing`。VMDはコードから生成し、第三者のVMD・振付データは同梱しない。

## 6. 主な実装・検査ファイル

| 対象 | ファイル・参照先 |
|---|---|
| LoLカタログ／調査 | `js/catalog.js`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`tools/leagueoflegends-music-tracklist.json` |
| wish更新／曲名照合 | `js/library.js`、`js/title-match.js`、`tests/title-match.test.mjs` |
| 音源ジャケット | `js/audio-art.js`、`js/render.js`、`js/spectrum.js`、`js/tv-dock.js`、`js/study-room.js`、`tests/audio-art.test.mjs`、`tests/song-art-display.test.mjs` |
| MANUAL判定／譜面生成 | `js/judge-match.js`、`js/chart-gen.js`、`tests/judge-match.test.mjs`、`JUDGE-MATCH.md` |
| 書斎データ安全・表示 | `js/study-room-utils.js`、`js/study-room.js`、`tools/check-study-room.mjs` |
| 静的・セキュリティ・a11y・軽量化 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs`、`tests/` |
| Service Worker | `sw.js`。現在のcache名：`trk-v2026.10.9-trk105`。vendor pinの正は `tools/vendor-lock.json` |
| 検査条件 | [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md)、[`SECURITY.md`](SECURITY.md)、[`NAMESPACE-PLAN.md`](NAMESPACE-PLAN.md) |

2026-10-09／trk105の検査：`npm run check` 成功、Static 0 failure／0 warning、`npm test` 174/174。`git diff --check` 成功。`npm run check` はrepo・security・a11y・vendor・MMD motion・Study Room・lite-mode検査とテストを実行するが、実ブラウザースモークは含まない。LoL checkerはSessions 108、Champion Themes 41、Worlds 13、MSI 4、K/DA 6の曲データ・公式リンク・権利注記・安全なwish更新を検査する。

## 7. 未完了の実機確認

- **ジャケット表示（trk101／102／105）**：Node検査は合成データ。MP3等の実音源で、曲行・選択中バナー・TV・書斎、画像なし時、`specArtwork` 初期OFF／ON、謎設定3種の初期OFFと優先順、譜面中の静止画非表示（元動画は継続）、書斎カバー設定・解除後の背景更新を確認する。trk105の原寸以下・中央表示／全画面切替と、TVフィルター（特にモノクロ）がTVドックのカバーにも適用されることもPC・Androidで確認する。曲一覧のサムネイル表示は利用者確認済み（2026-10-09）。
- **ゲーム／入力**：Android ChromeとPCでMANUALの連打・判定、Esc長押し、ランク表示、chartGen新旧方式、軽量化を確認する。VM／Nodeで確認済みの条件は [`JUDGE-MATCH.md`](JUDGE-MATCH.md) と `QUALITY-CHECKS.md` に記録する。
- **3D／オフライン／端末差**：Android ChromeとPCでMMD・VRM描画、Service Workerのcache-first／safeオフライン、IndexedDBの実ブラウザ挙動を確認する。静的・shimテストは実ブラウザの代わりにならない。
- 実施後は端末・日付・シナリオを [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) または「📱 実機確認の記録」Issueへ残す。**trk100で確認済みの項目は未完了一覧へ戻さない。**

## 8. 最近の変更

詳細な履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) とGit履歴を参照。

- **trk100 — 選曲画面TVの状態修正**：画面状態を `core.screen` 経由に統一。利用者確認済み条件は §3 に記録。
- **trk101／102 — 音源ジャケット**：端末内抽出・縮小・表示先と設定を追加。画像・処理量を制限し、通信・永続画像保存はしない。
- **trk103／104 — LoLカタログ**：Worlds 2026「Know My Name」とK/DA 6曲を追加。Creator-Safe・二次利用条件は未確認。
- **trk105 — ジャケット表示調整**：既定を原寸以下の中央表示にし、全画面設定は既存 `artWallpaperBg` を再利用。TVドックの静止カバーにもTVのCSSフィルターを適用。実機確認は §7 に残す。

## 9. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、初期値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff、`sw.js` cache名、実機確認記録の更新要否を確認した。
- [ ] `docs/guide/` の日本語を変えた場合は `docs/guide/en.md` の対応箇所も更新した。
