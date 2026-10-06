# 🧾 trk! セキュリティ・チェックリスト（標準リストとの突き合わせ）

この文書は、**定番の脆弱性リストに trk! を1項目ずつ当てはめた記録**です。見つけた問題と直した内容は `docs/SECURITY.md`（F-1〜）に、ここは「どの項目をどう確認したか／残っている宿題は何か」を一覧にしたものです。

- 参照した標準リスト
  - **OWASP Top 10 Client-Side Security Risks**（ブラウザ側コード向け・OWASP プロジェクト）<https://owasp.org/projects/top-10-client-side-security-risks>
  - **CWE Top 25 Most Dangerous Software Weaknesses（2025）**（MITRE）<https://cwe.mitre.org/top25/>
  - 補助：OWASP Top 10（2021）の項目名（該当する物だけ）
- 確認の方法：`npm run check`（静的検査 **32項目**）／`npm run check:cdn`（CDNの94モジュール）／jsdom の動的テスト（リポジトリ外 `tools/` ではなく検証用ハーネス）／手動の実機確認
- 凡例：✅ 確認済み・🟡 仕様として残した（理由あり）・🔶 未実施の推奨・➖ このアプリには当てはまらない

---

## A. OWASP Top 10 Client-Side Security Risks

| # | 項目 | trk! での状態 | 根拠・備考 |
|---|---|---|---|
| 1 | **Broken Client-side Access Control** | 🟡 | サーバもアカウントも無いので「他人のデータに触る」経路はありません。ページ内でコードが動ける唯一の穴は**アドオン**で、**入れた人の責任**（明示インストール・共有ファイルから自動では入らない・512KB上限・オフ／削除可・`?safe=1` で停止）。端末のファイルは**読み取り専用**、フォルダは「🚫 共有をやめる」でハンドルを両方削除 |
| 2 | **DOM-based XSS** | ✅ | `innerHTML` は結果画面の1か所だけで**すべて `esc()` 済み**（`js/game.js`）。書斎の本文は `createTextNode`/`textContent` のみ（`.html`/`.js`/`.md` もソースのまま表示）。`javascript:` は `safeHttpUrl()` で弾き、共有URLは `safeLink()` が**文字にするだけ**。`eval`/`new Function`/`document.write` はアドオン（仕様）以外に無し |
| 3 | **Sensitive Data Leakage**（トラッカー・ピクセル） | ✅ | 外部通信は**同一オリジンの取得**と、VRM／MMD を使うときの jsDelivr のみ（`privacy.html` と一致）。解析・広告・ピクセルなし。実測でも起動時にページ内から外部へ出ません |
| 4 | **Vulnerable and Outdated Components** | 🟡 | CDNは**完全固定**（`three@0.180.0` 等）で、**94ファイル・3.60MB の SHA-384 を `tools/cdn-lock.json` に記録**し `npm run check:cdn` で検証可。import map は **SRI が使えない**のが残る弱点 → 自前ホスティング推奨（§C-1） |
| 5 | **Lack of Third-party Origin Control** | 🟡 | 第三者コードは**許可リスト1ホスト（cdn.jsdelivr.net）だけ**で、動的 `import()` も `js/vrm.js`・`js/mmd.js` の許可リストのみ（`check-security` が検査）。Service Worker は**クロスオリジンをキャッシュしない**。**CSP は未設定**（inline の import map があるため段階導入が必要 → §C-2） |
| 6 | **JavaScript Drift**（読み込むコードが知らぬ間に変わる） | ✅ | CDNの全モジュールのハッシュを記録し、`check:cdn` で「変わった／増えた／消えた」を検出（npm レジストリとの突き合わせは `check:cdn:npm`）。自分のコードは git 管理下でPRレビュー |
| 7 | **Sensitive Data Stored Client-Side** | ✅ | 保存するのは設定・スコア・プレイリスト・パック・書斎の本・VRM/MMDモデル・フォルダのハンドル。**パスワード・トークン・APIキー・個人情報は保存しません**（そもそも持ちません）。端末を触れる人はブラウザのストレージから読める、が正直なところで `privacy.html` に明記 |
| 8 | **Client-side Security Logging and Monitoring Failures** | 🟡 | 送信型のログ・監視は**ありません**（オフラインで完結するゲームなので、送る先が無い＝プライバシー優先）。異常は画面の表示とコンソールで確認。監視が要るなら有料の外部サービスが必要になるため、意図的に持たない選択 |
| 9 | **Not Using Standard Browser Security Controls** | 🔶 | 使っている：同一オリジン限定のService Worker（ネットワーク優先）・読み取り専用のファイル選択・`noopener noreferrer`・`safeHttpUrl`・`?safe=1`。**未使用：CSP（Subresource Integrity は import map では不可）** → §C-2 の推奨 |
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

1. **CDN の自前ホスティング（vendor 化）**：実測 **94ファイル・3.60MB**。CDN改ざん・オフライン・版消滅が同時に解決（当面は `check:cdn` 運用）
2. **CSP（Content Security Policy）**：inline の import map を外部ファイル化＋ハッシュ化してから段階導入。`script-src`／`media-src blob:`／`worker-src` の検証が必要で、壊すと全機能が止まるため**実機テスト付きで**（`docs/SECURITY.md` §6 に案）
3. **`?reset=all` の確認ダイアログ**（リンクを踏むだけで設定が初期化される）／**アドオン同意の記録**／**GitHub Actions のSHA固定**／**`mobile-web/` から開発文書を除外**
4. **このチェックリストの定期実行**：バージョンを上げたら `npm run check` と `npm run check:cdn`、新しいファイル形式を足したら該当する検証関数と `tools/check-*.mjs` をセットで更新（`docs/HANDOFF.md` の決まりごと）

---

## D. この文書の更新ルール

- 標準リストが改訂されたら（OWASP／MITREの新版）、**この表に追記**して差分だけ確認する。
- 「✅」は**根拠（ファイル／テスト名）を必ず書く**。根拠が消えたら ✅ も消す。
- 直した問題は `docs/SECURITY.md` の F番号に残し、ここからは参照するだけ（二重管理しない）。
