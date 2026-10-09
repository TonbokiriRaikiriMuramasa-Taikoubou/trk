# trk! 開発引き継ぎ

> **最終更新：2026-10-09（trk104）**。この文書は現在の設計・利用者指定・未完了事項だけをまとめる。詳細な履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、セキュリティは [`SECURITY.md`](SECURITY.md)／[`SECURITY-CHECKLIST.md`](SECURITY-CHECKLIST.md) を参照する。

## 1. 再開・変更の基本

- 最初に `git status --short` と差分を確認する。既存の変更を確認せずに破棄・上書きしない。
- Arena指定の作業ブランチを維持し、`main` へ直接 push しない。反映はPR経由。
- 変更後は最低限 `npm run check` と `git diff --check`。静的・VMテストの成功を、未実施の実ブラウザ／実機確認済みとは扱わない。
- バンドラーはない。`index.html` のscript読込順が実行順。公開コード変更時は関連テスト・文書・`sw.js` のキャッシュ名を確認する。

## 2. 現在の優先事項

- **音楽カタログと権利確認を優先し、TV機能の追加作業は保留。LoLを先に調査する。**
- LoLは段階収録。現状はCreator-Safe Sessions 3作／108曲、近年のChampion Themes 41曲、Worlds/WCS公式アンセム13曲、確認済みMSIアンセム4曲、K/DA 6曲。K/DAは「POP/STARS」＋「ALL OUT」EP収録5曲を独立リストに収録済み。全楽曲の網羅を主張しない。
- 次のLoL調査候補は、旧ログインテーマ／旧Champion Themes、他の仮想アーティスト作品、Skin・イベント曲、ゲームOST等。Champion Theme・大会アンセム・仮想アーティストを混ぜず、公式の個別曲名・リンク・分類が確認できた範囲だけ追加する。見つからなかったことを「存在しない」と扱わない。
- 調査台帳：[`LEAGUE-OF-LEGENDS-MUSIC.md`](LEAGUE-OF-LEGENDS-MUSIC.md)。曲別の出典・fixture：`tools/leagueoflegends-music-tracklist.json` と `tools/leagueoflegends-sessions-tracklist.json`。

## 3. 権利・配布の扱い

- 音楽カタログは曲名・クレジット・公式配信／公開先を案内する**リンク索引**で、音源を同梱・再配布しない。公式リンク、視聴、購入、サブスクリプションだけで二次利用・再配布の許諾があるとは扱わない。
- Riotの[日本語法務ページ](https://www.riotgames.com/ja/legal)を一般的な参照先として記録する。個別曲の使用では、[Riot Creator-Safeガイドライン](https://www.riotgames.com/en/riot-music-creator-safe-guidelines)と該当曲の条件を照合する。一般の法務案内や「誰でも使える」ライセンスの存在だけから、K/DA等の個別曲へ包括許諾を推定しない。ライセンスを根拠にする場合は、対象曲・利用範囲・条件を確認できる一次資料を残す。
- K/DA 6曲とWorlds 2026「Know My Name」のCreator-Safe対象・利用条件は**未確認**。公式Spotify／YouTubeページの確認は二次利用許諾の確認ではない。各曲のリンクと未確認事項はLoL調査台帳に記録する。
- PCL／東方Project等の条件、公開先の受け入れ条件、別途制作した5曲の配布条件は未確認事項として扱う。別途制作曲は第三者録音・サンプル・引用メロディを用いていないが、配布許諾済みとは見なさない。`NOTICE.md` の説明を他作品へ広げない。
- ゲーム内素材・モデル等は [`NOTICE.md`](../NOTICE.md) の個別条件を守る。無料公開・公認・出典表記だけを再配布許可の根拠にしない。

## 4. 維持する利用者指定・受入条件

### TV・音源ジャケット

- **trk100の基本確認は済み**（利用者の実ブラウザ確認、2026-10-09）。音のプレビューOFF＋該当設定ONでもMUTEで無音。TVオフで映像を消せる。設定画面・演奏中・映像フィルター「非表示」の条件でもTV映像が出ない。これらを未確認扱いに戻さない。
- スペクトラム右上のサムネイル `specArtwork` は**既定オフ**。ゲーム中TV側のMP3サムネイル表示は**既定オン**。謎設定の3チェック（壁紙を背景にする／書斎のサムネイルを使う／譜面時にサムネイルを隠す）は**すべて既定オフ**。
- 書斎カバーを手動で設定・解除した場合も、関連設定と画像の優先順位に沿って背景を更新する。動画・静止画の優先関係を崩さない。
- TV／ジャケット機能は現状の挙動を維持し、追加作業は後回し。実ブラウザで未確認の境界条件は §7 に残す。

### その他の仕様・安全条件

- `js/library.js` の公式wish更新は、所持曲と利用者が変更した名前・アイコン・タグを保持する。`matchAliases` は曲名照合用で、根拠のない別名を作らない。プロフィール照合メモは端末内だけ・80文字まで。
- ユーザーのローカル音源・文章・元ファイルは読み取り専用。入力フォルダから作成・移動・削除・上書きしない。書斎のテキスト書き出しだけは、利用者が別に選択した保存先に衝突しない新規コピーを作る。
- 新規UI文言は日本語・英語・中国語・韓国語を同時に追加する。`js/fx.js`／`js/fx-presets.js` は凍結扱い。
- 譜面生成 `chartGen=2` が既定、`1` は旧方式への選択肢。MANUAL判定は `smart` が既定で、❓謎設定 `judgeOrdered` から旧方式へ戻せる。詳細は [`JUDGE-MATCH.md`](JUDGE-MATCH.md) と `docs/guide/play.md`。
- MMD内蔵モーションは **65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。新規・リセット時の表情既定は `faceSing`。VMDはコードから生成し、第三者のVMD・振付データは同梱しない。

## 5. 主な実装・検査ファイル

| 対象 | ファイル・参照先 |
|---|---|
| 公式曲カタログ／LoL調査 | `js/catalog.js`、`docs/LEAGUE-OF-LEGENDS-MUSIC.md`、`tools/leagueoflegends-music-tracklist.json` |
| 既存wishの安全な更新・曲名照合 | `js/library.js`、`js/title-match.js`、`tests/title-match.test.mjs` |
| 埋め込みジャケット | `js/audio-art.js`、`js/render.js`、`js/spectrum.js`、`js/tv-dock.js`、`js/study-room.js`。画像の読取・縮小は端末内。テストは `tests/audio-art.test.mjs`、`tests/song-art-display.test.mjs` |
| MANUAL判定／譜面生成 | `js/judge-match.js`、`js/chart-gen.js`、`tests/judge-match.test.mjs`、`JUDGE-MATCH.md` |
| 書斎のデータ安全・表示 | `js/study-room-utils.js`、`js/study-room.js`、`tools/check-study-room.mjs` |
| 静的・権利・表示回帰 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs`、`tests/` |
| Service Worker | `sw.js`。現在のcache名：`trk-v2026.10.9-trk104`。vendorのpinは `tools/vendor-lock.json` が正 |
| 詳細な検査条件 | [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md)、[`SECURITY.md`](SECURITY.md)、[`NAMESPACE-PLAN.md`](NAMESPACE-PLAN.md) |

## 6. 最終検査の記録

2026-10-09／trk104時点で `git diff --check` と `npm run check` が成功。Static 0 failure／0 warning、`npm test` 172/172。LoL checkerはSessions 108、Champion Themes 41、Worlds 13、MSI 4、K/DA 6の順序・曲データ・公式リンク・権利注記・既存wishを保つ更新を検査する。以後コードを変えた場合は再実行する。

`npm run check` は `check-repo`、security、a11y、vendor、MMD motion、Study Room、lite-modeの検査と `tests/` を実行する。ブラウザースモークは含まない。譜面／IndexedDB／描画の詳細なテスト範囲と既知の制約は `QUALITY-CHECKS.md` を正とする。

## 7. 未完了の実機確認

- **ジャケット表示（trk101／102）**：Node検査は合成データ。MP3等の実音源で曲行・選択中バナー・TV・書斎の表示、画像なし時の表示、スペクトラム設定の初期オフ／オン、謎設定3種の初期オフと優先順、譜面中の静止画非表示（元動画は継続）、手動での書斎カバー設定・解除後の背景更新を実端末で確認する。曲一覧へのサムネイル表示は利用者確認済み（2026-10-09）。
- **ゲーム／入力**：Android ChromeとPCでMANUALの連打・判定、Esc長押し、ランク表示、chartGen新旧方式、軽量化を確認する。VM/Nodeで確認済みの条件は [`JUDGE-MATCH.md`](JUDGE-MATCH.md) と `QUALITY-CHECKS.md` に記録。
- **3D／オフライン／端末差**：Android ChromeとPCでMMD・VRMの描画、Service Workerのcache-first／safeオフライン、IndexedDBの実ブラウザ挙動を確認する。静的・shimテストは実ブラウザの代わりにならない。
- 実施したら端末・日付・シナリオを [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) または「📱 実機確認の記録」Issueへ残す。**trk100で確認済みの項目は未完了一覧へ戻さない。**

## 8. 次の作業

1. LoLの未調査音楽範囲を公式ソースから継続調査。K/DA 6曲は収録済み。新規項目は曲別公式リンク・分類・クレジットを確認してから追加する。
2. Creator-Safe対象・権利条件を曲ごとに確認し、一般的な法務ページ・公式公開先・購入／サブスクリプションを包括許諾と解釈しない。
3. TV機能の追加作業は保留。関連の実機確認は上記受入条件を変えず、利用者の指示があったときに再開する。
4. PCL／東方Project、公開先の受け入れ条件、別途制作曲5曲の配布条件は引き続き未確認として扱う。

## 9. 最近の変更

作業履歴は要点のみ。trk99以前は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、個別の詳細は上記トピック文書とGit履歴を参照する。

- **trk100 — 選曲画面TVの状態修正**：`core.screen` 経由に統一し、利用者が確認したTV条件は §4 に記録。
- **trk101／102 — 音源ジャケット**：端末内抽出・縮小・表示先／設定を追加。画像・処理量を制限し、通信・永続画像保存はしない。設定既定値と実機未確認項目は §4／§7。
- **trk103 — Worlds 2026「Know My Name」**：公式MVとSpotify個別曲ページを照合して収録。Creator-Safe対象は未確認。
- **trk104 — K/DA 6曲**：公式Spotify個別曲・表示クレジットとLeague of Legends公式YouTube動画を確認し、独立リストへ収録。Creator-Safe・二次利用条件は未確認。
- `sw.js` cache名は `trk-v2026.10.9-trk104`。

## 10. 変更時チェックリスト

- [ ] 作業開始時にstatus/diffを確認し、既存の変更と利用者指定を保持した。
- [ ] UI・設定は4言語、初期値、リセット、Import/Export、`?safe=1` の挙動を確認した。
- [ ] 外部URL・素材の出所と利用条件を確認し、未確認を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff、`sw.js` cache名、実機確認の記録の更新要否を確認した。
- [ ] `docs/guide/` の日本語を変えたときは `docs/guide/en.md` に対応する節を反映した。
