# 🧾 trk! セキュリティ・チェックリスト（標準リストとの突き合わせ）

この文書は、**定番の脆弱性リストに trk! を1項目ずつ当てはめた記録**です。見つけた問題と直した内容は `docs/SECURITY.md`（F-1〜）に、ここは「どの項目をどう確認したか／残っている宿題は何か」を一覧にしたものです。

- 参照した標準リスト
  - **OWASP Top 10 Client-Side Security Risks**（ブラウザ側コード向け・OWASP プロジェクト）<https://owasp.org/projects/top-10-client-side-security-risks>
  - **CWE Top 25 Most Dangerous Software Weaknesses（2025）**（MITRE）<https://cwe.mitre.org/top25/>
  - 補助：OWASP Top 10（2021）の項目名（該当する物だけ）
- 確認の方法：`npm run check`（静的検査 **31項目**＋**同梱ライブラリ検証8項目**）／`npm run check:cdn`（CDNの94モジュール）／jsdom の動的テスト（リポジトリ外 `tools/` ではなく検証用ハーネス）／手動の実機確認
- 凡例：✅ 確認済み・🟡 仕様として残した（理由あり）・🔶 未実施の推奨・➖ このアプリには当てはまらない

---

## A. OWASP Top 10 Client-Side Security Risks

| # | 項目 | trk! での状態 | 根拠・備考 |
|---|---|---|---|
| 1 | **Broken Client-side Access Control** | 🟡 | サーバもアカウントも無いので「他人のデータに触る」経路はありません。ページ内でコードが動ける唯一の穴は**アドオン**で、**入れた人の責任**（明示インストール・共有ファイルから自動では入らない・512KB上限・オフ／削除可・`?safe=1` で停止）。端末のファイルは**読み取り専用**、フォルダは「🚫 共有をやめる」でハンドルを両方削除 |
| 2 | **DOM-based XSS** | ✅ | `innerHTML` は結果画面の1か所だけで**すべて `esc()` 済み**（`js/game.js`）。書斎の本文は `createTextNode`/`textContent` のみ（`.html`/`.js`/`.md` もソースのまま表示）。`javascript:` は `safeHttpUrl()` で弾き、共有URLは `safeLink()` が**文字にするだけ**。`eval`/`new Function`/`document.write` はアドオン（仕様）以外に無し |
| 3 | **Sensitive Data Leakage**（トラッカー・ピクセル） | ✅ | 外部通信は**同一オリジンの取得**と、VRM／MMD を使うときの jsDelivr のみ（`privacy.html` と一致）。解析・広告・ピクセルなし。実測でも起動時にページ内から外部へ出ません |
| 4 | **Vulnerable and Outdated Components** | ✅ | 第三者ライブラリ（three.js・three-vrm・three-mmd-loader）は **`assets/vendor/` に同梱**（98ファイル・3.60MB）。**`tools/vendor-lock.json` に SHA-384 を記録し、`npm run check` が毎回オフラインで検証**（`npm run check:vendor`）。版の更新は `npm run vendor:update` で差分がPRに残る |
| 5 | **Lack of Third-party Origin Control** | ✅ | **import map に第三者オリジンがありません**（全部 `./assets/vendor/...`＝同一オリジン。`check-security` が検査）。動的 `import()` も `js/vrm.js`・`js/mmd.js` だけ。Service Worker はクロスオリジンをキャッシュしません（CSP の扱いは §C-1） |
| 6 | **JavaScript Drift**（読み込むコードが知らぬ間に変わる） | ✅ | 第三者コードは**リポジトリに入っている**ので、変われば git の差分として必ず見えます。加えて `check-vendor` がハッシュ・相対importの解決・import map の被覆を毎回検査（来歴の確認は `check:vendor:npm`） |
| 7 | **Sensitive Data Stored Client-Side** | ✅ | 保存するのは設定・スコア・プレイリスト・パック・書斎の本・VRM/MMDモデル・フォルダのハンドル。**パスワード・トークン・APIキー・個人情報は保存しません**（そもそも持ちません）。端末を触れる人はブラウザのストレージから読める、が正直なところで `privacy.html` に明記 |
| 8 | **Client-side Security Logging and Monitoring Failures** | 🟡 | 送信型のログ・監視は**ありません**（オフラインで完結するゲームなので、送る先が無い＝プライバシー優先）。異常は画面の表示とコンソールで確認。監視が要るなら有料の外部サービスが必要になるため、意図的に持たない選択 |
| 9 | **Not Using Standard Browser Security Controls** | 🟡 | 使っている：同一オリジン限定のService Worker（ネットワーク優先）・読み取り専用のファイル選択・`noopener noreferrer`・`safeHttpUrl`・`?safe=1`。**CSP は入れない方針**（§C-1：ビルド無しのHTML/JS・inline import map・blobメディアのため、開発と実機検証が壊れやすい。**安定版リリース時のみ**実機テスト付きで検討）。第三者オリジンがゼロになったことで、CSP を入れる場合の設定もずっと簡単になりました |
| 10 | **Including Proprietary Information on the Client-Side** | ✅ | trk! は GPL-3.0-or-later のオープンソースで、クライアントに秘密は置いていません（APIキー・認証情報・内部エンドポイントなし）。隠し要素は「遊び」であって機密ではありません |

## B. CWE Top 25（2025）から、ブラウザアプリに関係するもの

| CWE | 名前 | trk! での状態 | 根拠 |
|---|---|---|---|
| 79 | XSS | ✅ | A-2 と同じ（`esc()` 済みの1か所のみ・テキストノード・`safeLink`） |
| 22 | Path Traversal | ✅ | パックの `../`・絶対パスを拒否（`safePath`/`PATH_RE`）。書斎のパスは**見出しとIndexedDBのハッシュIDにしか使わない**（実測で端末の読み書きが起きないことを確認） |
| 94 | Code Injection | 🟡 | コードを実行する経路は**アドオンだけ**（`eval` はアドオンの実行のみ・仕様）。共有パック／プレイリスト／譜面から**アドオンが勝手に入る経路は無い**。`?safe=1` は**評価の前に**止める（`boot()` の先頭で判定）。それ以外の `eval` 等は静的検査で禁止 |
| 434 | Unrestricted Upload of Dangerous Type | ✅ | 画像は `jpg/jpeg/png/webp/gif/avif/bmp` のみ（**SVG除外**）、パックは `.stpack/.zip`＋マニフェスト検証、譜面はフォーマット検証、書斎のテキストは**文字としてのみ**表示 |
| 502 | Deserialization of Untrusted Data | ✅ | 扱うのは JSON と ZIP のみ。形式ごとの検証（`sanitizeManifest`／`plSanitizeShared`／`validateChartData`／`sanitizeTvDef`／`sanitizeSkinDef`／`studyBookClean`）と、設定インポートの**プロトタイプ汚染よけ**（`__proto__` 等をスキップ・自分のキーだけ） |
| 20 | Improper Input Validation | ✅ | 数値は範囲・件数は上限・URLは https のみ・色は `#rrggbb` のみ・ノート色/形は許可リスト。上限値は `LIB_MAX`／`SHARED_MAX`／`PACK_LIMIT`／`STUDY_*`／プレイリスト24件など |
| 200 | Exposure of Sensitive Information | ✅ | 外部に送るものは無い（A-3）。`privacy.html` に「送っていません」と明記し、実装の grep と一致することを確認 |
| 770 | Allocation of Resources Without Limits | ✅ | `.stpack` は**展開しながら数えて上限で中止**（圧縮爆弾よけ）、**96MB超のメディアは音声解析をしない**（`ANALYZE_MAX`）、ノート5万件・曲1000件・曲名/タグに長さ上限、書斎も曲数/ファイル上限あり |
| 918 | SSRF | ➖ | サーバがありません（ユーザーが入力したURLをサーバ側で取りに行く処理は無し）。外部URLは `safeLink` ＋確認ダイアログのうえ**開くだけ** |
| 89 / 352 / 862 / 863 / 284 / 306 / 639 | SQLi・CSRF・認可まわり | ➖ | サーバ・アカウント・セッションが無いため対象外（ローカル完結）。「認可」に相当するのは A-1 のクライアント側アクセス制御 |
| 787 / 125 / 416 / 120 / 121 / 122 / 476 | メモリ破壊・解放後使用など | ➖ | JSエンジン側の領域（trk! のコードでは扱いません） |
| 78 / 77 | コマンド実行 | ➖ | OSコマンドを実行する箇所なし（Capacitor のネイティブプラグインも未使用） |

## C. 残っている宿題（推奨・未実施）

0. **（済）CDN の自前ホスティング（vendor 化）**：2026-10-06 完了（**98ファイル・3.60MB**・`tools/vendor-lock.json`・`npm run check` で毎回オフライン検証）
1. **CSP は「基本は入れない」方針**（ユーザー判断）：ビルド無しのHTML/JS・inline の import map・blob のメディアを使うため、入れると開発／実機検証が壊れやすい。**安定版としてリリースするときだけ**、外部化＋ハッシュ＋`media-src blob:` を実機テスト付きで検討する（今は `<meta http-equiv>` も置かない）。第三者オリジンがゼロになったので、必要になったときの設定は簡単になっている
2. **（済）`?reset=all` の確認ダイアログ**：2026-10-06 完了（F-20。確認を飛ばす非常口は `&force=1`）
3. **（済）アドオン同意の記録**：2026-10-06 完了（F-21。**同意するまでコードを実行しない**＋同意日時とコード指紋を端末内に記録、一覧に ✅／⚠ を表示）
4. **残っている小さな宿題**：**GitHub Actions の SHA 固定**／**`mobile-web/` から開発文書を除外**（どちらも配布物まわりで、遊びには影響しません）
5. **このチェックリストの定期実行**：バージョンを上げたら `npm run check`、第三者ライブラリを上げたら `npm run vendor:update` ＋ `npm run check:vendor:npm`、新しいファイル形式を足したら該当する検証関数と `tools/check-*.mjs` をセットで更新（`docs/HANDOFF.md` の決まりごと）

---

## D. この文書の更新ルール

- 標準リストが改訂されたら（OWASP／MITREの新版）、**この表に追記**して差分だけ確認する。
- 「✅」は**根拠（ファイル／テスト名）を必ず書く**。根拠が消えたら ✅ も消す。
- 直した問題は `docs/SECURITY.md` の F番号に残し、ここからは参照するだけ（二重管理しない）。
