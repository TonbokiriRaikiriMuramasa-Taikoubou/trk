# trk! 開発引き継ぎ

> **最終更新：2026-10-10（trk109）**。現在の仕様・守る条件・未確認事項の要約です。細かな過去の作業履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md)、利用者向け仕様は [`README.md`](../README.md) と [`guide/`](guide/)、権利表記は [`NOTICE.md`](../NOTICE.md)、品質・安全確認は [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) と [`SECURITY.md`](SECURITY.md) を参照してください。

## 1. 作業の基本

- 作業前に `git status --short` と差分を見て、既存の変更を破棄・上書きしない。
- Arenaで指定された作業ブランチを維持し、`main` へ直接 push しない。反映はPR経由。
- バンドラーはありません。`index.html` の `<script>` 順が依存関係と実行順を決めます。
- 変更後は `npm run check` と `git diff --check` を実行。静的・VM・スモーク検査の成功を、実音声・実機での確認済みとは扱いません。
- 公開JSを変更したら関連テスト・文書・`sw.js` のcache名更新要否を確認します。vendor pinの正は `tools/vendor-lock.json` です。

## 2. 現在の実装状態

### TouhouカタログとローカルMIDI

- `js/touhou-theme-data.js` はTouhouThemeDBの固定スナップショット（commit `e70e645`、The Unlicense）。カタログは曲名等のメタデータだけで、ゲーム音源や抽出物は含みません。904 release IDのうち862をTouhou Project、関連ゲーム42 IDを別系列として扱います。完全性を保証する数字ではありません。
- ID形式のローカル名はユーザー設定名 → カタログ曲名 → 元ファイル名の順で表示します。例：`th06_05.mid`。**元ファイル名・保存済みタイトルは書き換えません。** 曲リストとの照合に使う別名は、根拠があるものだけです。
- `.mid`／`.midi` はローカルでコード生成WAVに変換します。SMF 0/1・PPQ対応、SMPTE非対応、入力上限8 MiB、10分。全曲・全作品にMIDIがあるわけではありません。
- 音色プロフィールは**24種**（一般的な音色傾向の参考10種＋trkオリジナル14種）。設定は次にMIDIを読み込んだとき反映されます。実SoundFont・SF2/SF3・PCM/WAVサンプル・ROM・東方ゲーム音源は含まず、実機や製品のエミュレーションでもありません。製品名に似た表記は広い着想を示すだけです。
- 選曲画面左下の `#richPanel` 直下に **TRK MIDI MIX** があります。プロフィール由来のDSPを通常音声に適用する機能で、初期オフ。SoundFont合成でも音声→MIDI変換でもありません。MIDI音色プロフィールとは別設定です。
- Audio設定のExport/Import、enum検証、リセット、セーフモードにプロフィール／MIX状態を接続済み。MIXはリセットとセーフモードでオフになります。
- 抽出ツールTouhou Music Room等は案内だけで、本体・実行ファイルを組み込んでいません。利用・抽出・再配布の注意は [`guide/touhou-midi.md`](guide/touhou-midi.md) を正とします。

### その他のカタログ

- LoLカタログはtrk108時点で18プレイリスト・456曲（Creator-Safe Sessions、Champion Themes、Worlds、MSI、K/DA、Season 1〜9 OST、Warsongs、人気曲）。Season 1〜9 OST 243曲とWarsongs 11曲はCreator-Safe Playlist掲載を確認済み。人気曲の共同制作曲などは対象外・要確認のままです。
- 曲別出典、範囲、権利上の未確認事項は [`LEAGUE-OF-LEGENDS-MUSIC.md`](LEAGUE-OF-LEGENDS-MUSIC.md) と `tools/leagueoflegends-*-tracklist.json` を参照。音源はカタログにも同梱しません。

### 維持中の既存機能

- MMD内蔵モーションは**65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。Latの表情モーフを含み、新規・リセット時の既定は `faceSing`。VMDはコードで生成し、第三者の振付データは同梱しません。

## 3. 維持するデータ・安全条件

- ローカル曲、画像、文章、元ファイルは読み取り専用。入力フォルダの作成・移動・削除・上書き、音源のアップロードや永続保存はしません。音声変換や解析は端末内で行います。
- 公式リンク、購入、サブスクリプション、カタログ掲載だけを再配布・二次利用許諾の根拠にしません。許諾が未確認のものは未確認と表示します。
- Touhouのタイトル索引・MIDI演奏機能と、Touhouゲームの音源・実サンプル・抽出データを混同しないこと。実サンプルを追加する場合は、ファイル単位の権利根拠と再頒布許諾を確認するまで同梱しません。
- Import時は既知キー・型・enumを代入前に検証し、拒否した設定と理由を表示します。MIDIプロフィールIDも実在一覧に対して検証します。
- 新規UI文言は日本語・英語・中国語・韓国語をそろえます。中国語・韓国語を母語話者が確認したとは限りません。

## 4. 未完了の確認

1. **MIDI／MIXの実ブラウザ・実音声確認**（PC・Android）：有効なSMF 0/1の読込、24音色の違い、プロフィール選択が次の読込に反映されること、形式・サイズ・長さ制限を確認。MP3/WAVでMIX初期オフ／オン／プロファイル切替を確認し、セーフモード・Audioリセットで停止することも確認する。現時点では自動テスト済み・実音声未確認。
2. **カタログ名表示**：ユーザー設定名 → カタログ名 → 元ファイル名の優先順と、元ファイル名・保存名が変わらないことを実際のライブラリで確認する。
3. **音源ジャケット**（trk101〜106）：曲一覧のサムネイル表示は利用者確認済み（2026-10-09）。選択中バナー・TV・書斎、譜面中の右上配置、フィルター、画像なし、表示設定の優先順はPC／Androidの実曲で確認する。詳細は旧記録と [`QUALITY-CHECKS.md`](QUALITY-CHECKS.md) を参照。
4. **LoL外部ページ**：Season 4〜9・WarsongsのSoundCloudセット表示と、地域制限曲を含む人気曲リンクを実ブラウザで再確認する。曲別調査はLoL台帳を更新する。
5. Android Chrome／PCでService Workerのsafe・オフライン、MMD／VRM、IndexedDBを確認する。Node・shim検査は実機確認の代用ではありません。

## 5. 主なファイル

| 内容 | ファイル |
|---|---|
| Touhou固定タイトルデータ・曲カタログ | `js/touhou-theme-data.js`、`js/catalog.js` |
| 曲名照合・表示名 | `js/title-match.js`、`js/library.js`、`tests/title-match.test.mjs` |
| MIDI音色プロフィール・レンダラー・UI | `js/midi-profiles.js`、`js/midi-player.js`、`js/midi-settings.js`、`js/media.js` |
| 通常音声MIX DSP・左下パネル | `js/fx.js`、`js/fx-dock.js`、`css/style.css` |
| 設定・Import検証 | `js/core.js`、`tools/check-security.mjs` |
| MIDI/MIXとカタログの検査 | `tests/midi-player.test.mjs`、`tests/media-midi-integration.test.mjs`、`tests/midi-mix.test.mjs`、`tests/touhou-catalog.test.mjs` |
| 利用者向けMIDI・権利案内 | `docs/guide/touhou-midi.md`、`docs/guide/sound.md`、`docs/guide/en.md` |
| Service Worker | `sw.js`（現行cache名：`trk-v2026.10.10-trk109`） |
| 全体・安全検査 | `tools/check-repo.mjs`、`tools/check-security.mjs`、`tools/check-a11y.mjs`、`tools/check-lite.mjs` |

## 6. 直近の検証

- `npm run check`：成功。Static 0 failure／0 warning、`node:test` **202/202・28 suites**。リポジトリ、Security、a11y、vendor、MMD、Study Room、lite-mode検査を含む。
- `git diff --check`：成功。
- 自動検査でローカル参照・構文・Stageの幾何・選曲画面のoverflowを確認。新しいMIDIの音質、通常ブラウザ上での聞こえ方、実機操作はまだ確認していません。

## 7. 最近の変更

- **trk109（2026-10-10）**：TouhouThemeDBのローカル曲名カタログとID形式名の表示、実サンプルを使わない24種のコード生成MIDI音色、通常音声用・初期オフのTRK MIDI MIXを追加。詳細な権利・抽出注意は `guide/touhou-midi.md`。
- **trk108以前**：LoLカタログ、音源ジャケット、TV、譜面生成、名前空間等の作業履歴は [`HANDOFF-ARCHIVE.md`](HANDOFF-ARCHIVE.md) と各設計資料を参照。

## 8. 変更時チェックリスト

- [ ] 作業前にstatus／diffを確認し、既存変更と利用者指定を保持した。
- [ ] UI・設定は4言語、既定値、リセット、Import/Export、`?safe=1` を確認した。
- [ ] 外部URL・データ・素材の権利条件を確認し、未確認事項を許諾済みと表現していない。
- [ ] 関連テスト、`npm run check`、`git diff --check` を通した。
- [ ] README／NOTICE／handoff と `sw.js` cache名を確認した。
- [ ] 日本語ガイドを変更した場合、英語ガイドの対応箇所も更新した。
