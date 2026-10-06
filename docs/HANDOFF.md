# trk! 開発引き継ぎ（短縮版）

> 最終更新：2026-10-06（**🛡 セキュリティ点検（5回・F-1〜F-21）＋🌐 CDNをやめて自前ホスティング（`assets/vendor/`）＋🔐 守りの追加（`?reset=all` の確認・アドオン同意）＋♿ 堅牢性／読みやすさの点検（`tools/check-a11y.mjs`）** ＝PR #18。追補F-22〜F-29（アドオン指紋・譜面／設定Import上限・スキン参照／容量など）はPR #19で反映済み。F-30〜F-32（設定enumの許可リスト／hashリセット確認／パック累積容量）はIssue #21・#22・#24・#25を受けた対応で、PR #26をmainへの統合・追跡先とする。以下はそれ以前からの状態：🎮 キーコンフィング（**ゲームパッド・音ゲーム用コントローラー・TVリモコン**）＝設定 ⌨ 操作の中に新設・ボタン／軸の直接割り当て・メニュー移動／🪶 軽量化（スマホ・アプリ向け）＝設定の右下に新設・自動判定／**プリセット（🎯 ゲーム優先＝ノーツと反応は下げず、他だけ軽く）**／フレームレート上限／3Dマスコットの描画レート／描画解像度／スペクトラム・ぼかしの節約／🎛 曲名バナーの曲操作を右端の [◀][🎲][▶] に集約／📚 書斎 v2／🩷 MMDモーション改修）
> 目的：次の開発作業に必要な現在の設計・権利上の制約・検証方法をひと目で確認する。詳細な機能紹介は `README.md`、権利条件は `NOTICE.md`、実装の正は各ソースコードとする。

---

## 1. 作業を再開するとき

1. まずこの文書と `git status --short`、`git diff` を確認する。未コミットの作業を勝手に破棄しない。
2. 作業ブランチはセッションごとに指定される（このリポジトリでは `arena/…-trk`）。指定されたブランチから切り替えず、pushもそのブランチだけに行い、`main` への反映はPR経由で行う。
3. 開発はリポジトリ内の実コードを編集し、最後に最低限 `npm run check` と `git diff --check` を実行する。
4. 実ブラウザ・タッチ端末・3D（WebGL）の確認は静的検査で代用せず、未確認なら未確認のまま記録する。第三者ライブラリは同梱（`assets/vendor/`）なので、オフラインでも動く。

このプロジェクトは通常のWebアセットで、バンドラーはありません。`index.html` をローカルのHTTPサーバーまたはGitHub Pagesから開きます。開発前には `docs/HANDOFF.md` を読み、コードの変更後は必要な文書・テスト・Service Workerのキャッシュ名も同期してください。

---

## 2. 現在の重要な状態

- MMD内蔵モーション：**65種をすべて選択可能**。日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パクの6グループ。
- VMDは `js/mmd.js` のコードから使用時に生成する。第三者のVMDや振付データは同梱しない。Lat式ミクのPMDで確認した**26種類の既存表情モーフ名**を使い、笑顔・ウィンク・照れ・怒り・困り顔・口パクなどの表情トラックも生成する。
- Lat式プリセットと新規／欠損／リセット時のモーションは `faceSing`（「🎤 あいうお口パク」・BPM非依存の6秒ループ）。保存済みの有効な選択（`none`を含む）は上書きしない。`melt170`（きゅん）・`wedh174`（ダンスホール）は残す。
- 曲名バナー音量ボタン：短押しは従来のスライダー表示切替、650ms長押しはミュート／直前の非ゼロ音量への復元。
- 曲名バナーの曲操作は**右端に [◀][🎲][▶]**（`div.bannerSongBar`。左端に置いていた◀が曲名の頭に重なるため、`js/library.js` で右端へ集約）。◀▶ は `bannerSongBtns`（初期オン）で表示、番号の選択は今までどおり**いま開いているタブの中**（`prevSong()`／`nextSong()`）。🎲 は `bannerRandomBtn`（初期オン）で表示、`bannerRandomTap`（初期オフ）でタップだけに。**既定は650msの長押し**で、短押しは曲を変えず `bannerRandomHold` のトースト案内だけを出す（移動12px超でキャンセル・長押し直後の click は1回だけ止める。音量ボタンと同じ作り）。抽選は選曲画面の🎲と同じ `randomSongPick()`（`libView` ＋ 📌ピンの曲）。表示中は `#songBanner` に `hasSongBtns` が付き、曲名の右側を空ける。
- ⚠ `bannerSongStep` の文字列と `index.html` の `id="bannerSongBtns"` は `tools/check-repo.mjs` が検査しているので、改名には同ファイルの更新が必要。
- 🎮 キーコンフィング（`js/pad.js`・設定 ⌨ **操作** → 「🎮 コントローラー・パッド・リモコン」）：`settings.padEnabled`（初期オン）／`padMenuNav`（初期オン）／`padLeft`・`padRight`・`padConfirm`・`padBack`・`padPause`（初期 `"b0"`／`"b1"`／`"b0"`／`"b1"`／`"b9"`）。割り当ての値は**パッドの生の入力**で、`"b<番号>"`＝ボタン、`"a<軸>+"`／`"a<軸>-"`＝軸の＋／−方向（スティック・D-padが軸で届く機種・アケコンのレバーを同じ形で扱う。`validPadBind()` で検証、既定は `PAD_DEFAULTS`）。**同じ入力の兼用が前提の設計**（既定では「左ノーツ」と「決定」が同じ b0）で、プレイ中はノーツ・一時停止、それ以外は決定＝いま選んでいるボタンを押す／戻る＝ESC を送る／D-pad・スティック＝`padMoveFocus()`（座標があれば方向つき、無ければDOM順。押しっぱなしで連続移動）。`TrkLite` と同じく描画は触らず、判定は `handleInput(lane, performance.now())`（STAGE は `stageInput`、CATCH は `catchState.held` を140msだけ倒す）。**Gamepad API はボタンを1回押すまでパッドを返さない**ので、未接続の案内を出す。公開は `window.TrkPad`（`tick`／`moveFocus`／`format`／`defaults`／`presets` ほか）。⚠ パッドの読み取りは `requestAnimationFrame` の見張りだけで、書斎・メディアプレーヤー・シンセが開いている間（`window._trkStudyRoomOpen` など）はメニュー移動をしない。
- ⌨ TVリモコン・メディアキー：`keyCodeOf(e)`（`js/core.js`）＝`e.code` が空のとき `e.key` を使う（リモコンのメディアキーは `code=""` で届く）。`js/main.js` のノーツ・メニューキー・割り当ての取り込みと、`js/media-player-mode.js` の終了キー・`videoKeys`・区間ループ／壁紙の長押しがこれを使う。**戻る**は Escape に加えて `BrowserBack`／`GoBack` も同じ扱い（`Backspace` は入力欄のために除外）。`formatKey()` にメディアキー・リモコンの表示を追加。キーのプリセットは `KEY_PRESETS` に **`arcade`（Digit1／Digit2）** と **`remote`（ArrowLeft／ArrowRight）** を追加。
- ⌨ キー割り当てのリセットは `resetKeysPrefs()`（`?reset=keys`・`trkReset('keys')`・`?reset=all`／工場出荷に含む）＝キー・サブキー・メニューキー・プレーヤー終了キー・パッドの割り当てを既定へ。
- 🪶 軽量化（`js/lite.js`・設定の**右下**「🪶 軽量化（スマホ向け）」）：`settings.liteMode`（`auto`／`on`／`off`・初期 `auto`）／`liteFps`（60・30・20fps・初期30）／`liteMascot`（60・30・15・`off`・初期30）／`liteScale`（`device`／`1.5`／`1`・初期1.5）／`liteSpectrumOff`／`liteFx`／`liteBlur`（すべて初期オン）／`liteGameFull`（**🎯 ゲーム優先＝プレイ中の描画に上限をかけない**・初期オフ）／`liteSeen`。**自動**は「モバイル判定（`pointer:coarse` ＋ UA）＋（コア4以下 or メモリ2GB以下）」「`navigator.connection.saveData`」「`getBattery()` で20%以下かつ非充電」「`prefers-reduced-motion`」のどれかで働く。
  - **プリセット**（`LITE_PRESETS`・`litePresetId()`／`liteApplyPreset()`）＝🪶 バランス／**🎯 ゲーム優先**（`liteGameFull:true`・マスコット15fps）／🔋 最大節約（20fps・マスコット `off`・1.0倍・`liteGameFull:false`）／✨ 軽量化しない（`liteMode:"off"`）。下の項目を変えると選択は自動で `custom` になる（値から毎回判定し、保存はしない）。
  - 軽くする方法は**描画だけを間引く**こと。ゲーム中は `TrkLite.allowGame(now)` を使う（`settings.liteGameFull` が真なら無条件に描く＝ノーツと反応はそのまま）。`TrkLite.allow(key, now)`（60Hzの画面で目標fpsに届くよう1.5msだけ緩める）を `render.js` の `loop`（`allowGame`）／`spectrum.js` の `frame`（`"spec"`）／`media-player-mode.js` の `mediaStageTick`（`"media"`）／`tv-dock.js` の `liveFrame`・`pvFrame`（`"tv"`・`"tvCheck"`）、`TrkLite.mascotAllow(id, now)` を `mmd.js`／`vrm.js` の `animate` に置く。
  - ⚠ **`render.js` の `loop` は、`tickClock()`（🕹️ 無音検知・リードイン）→ `gameTime()` → 判定 → `sweepMisses()` をゲートの**前**に置く**。判定は音声の時計なので、描画を間引いてもズレない（`tools/check-repo.mjs` が並び順を検査している）。
  - ほかに、`TrkLite.pixelRatio(max)`（`spectrum`／`tv-dock`／`media-player-mode`／`video-max`／`synth-mode`／`mmd`／`vrm` の `devicePixelRatio` 上限）、`specBlocked()`（`spectrum.js` の `specLive()` に合流。アナライザーも作らない）、`blurCap()`（`core.js` の `videoFilter()` と `tv-dock.js` の `newVideoFilter()` で 2px 上限）、`noMascot()`（`body.trkNoMascot` で MMD／VRM のキャンバスを隠す）、`body.trkLiteFx`（CSS で `backdrop-filter` を切る）。
  - 保存はいつもの `shadow_taiko_preferences_v2`（localStorage のキーは増やしていない）。リセットは `resetLitePrefs()`＝`?reset=lite`・`trkReset('lite')`・工場出荷（`resetAllPrefs` は `liteSeen` も戻す）。`?safe=1` とも併用可。
- 📚 書斎（Study Room, v2）：曲リスト見出しの長押し（650ms）／Enter・Spaceで開く、**端末内だけ**の画像・文章ビューア。**本棚**＝最大500冊（1ページ60冊＋「さらに表示」）、タイトル・パス・抜粋の検索、更新順／追加順／名前順／種類別／大きい順の並べ替え、栞の付いた本の🔖、冊数・画像枚数・使用量（`navigator.storage.estimate()` があれば空き容量も）。**取り込み**＝進捗バー・中止・結果要約（追加／維持／失敗）・同名本の一括置き換え確認、入れ子は `albumNesting` で「本ごと／まとめて1冊」。**画像**＝1フォルダ＝1アルバム（最大3000枚・600MB・1ファイル100MB）、1枚ずつ／見開き／縦読み＋🇺🇸アメリカン、画像順の反転（`imageOrder`）、拡大0.5〜4倍（ボタン／Ctrl+ホイール／ピンチ／`+`-`0`）と拡大中のドラッグ、見えているページだけ `URL.createObjectURL` して離れたら `revokeObjectURL`。**文章**＝UTF-8／UTF-16 BOM／Shift_JISの自動判定と青空文庫ルビ、5スキン＋文字サイズ・行間・余白、本文検索（Ctrl+F／`<mark class="study-search-hit">`／1500件上限）、栞＋**栞一覧**（M）、メモ帳（上級者向け・書斎内コピーのみ）、❓キーの説明（初回自動・`studyPrefs.helpSeen`）。**TVペイン**＝位置（上／下／非表示）・見た目6種・大きさ3段階・縦横比・曲名ON/OFF、動画が再生中なら映像、音声だけならジャケット（画像長押し680msで割り当て）。保存は**IndexedDB `trk_study_room_v1`**（books／pages／covers／settings。表示設定は `settings` ストアの `"ui"` に `studyPrefs` 1件）。ジャケットは `covers` ストアに入り、選曲画面の背景とTVドックへ `studyCoverChanged` で反映する。取り込みが中断して残った孤立ページは `studySweepOrphans()`（60秒スロットル・起動時と開いたときに実行）で掃除する。`?safe=1` では開かず、保存領域にも触らない。実装は `js/study-room.js`／`js/study-room-utils.js`／`css/study-room.css`、公開APIは `window.TrkStudyRoom`（`open`／`close`／`toggle`／`isOpen`／`refreshTV`／`assignCover`／`sweepOrphans`／`getSongCoverBlob|Info`／`clearSongCover`／`books`／`stats`）。
- 書斎を開いている間は `window._trkStudyRoomOpen` でゲーム側のキー操作を止める（`player.js`／`main.js`／`modes.js`／`stage.js`／`truck.js`／`catch.js`／`speed.js`／`extras.js`／`video-max.js`／`media-player-mode.js`／`synth-mode.js`）。書斎自身のキー（←→・PageUp/Down・Space/Enter・Esc・B/M/T/F・`+`/`-`/`0`・`?`・Ctrl+F）は capture で先に受け取る。ただし入力欄・セレクトでは書斎のキーを止め、ボタンに焦点があるときの Space／Enter はそのボタンに譲る。書斎を閉じる・`phase` が `title` 以外へ進む・曲が切り替わるときは、TVペインへ移した `<video>` を元の親と `style` へ戻す（元の親が差し替わっていても `document.body` へ逃がす）。
- 🔥 TRKアンプ（`js/fx-dock.js` の左下カテゴリー＋`js/fx.js` のラック）：`settings.fxRack`（段の配列・最大8。`cleanFx` で検証）／`settings.fxRackOn`（初期オフ）／`settings.ampOpen`（欄の開閉・**初期開き**。触って閉じた人の `false` は尊重。`?reset=amp`／`?reset=all` は初期の開へ戻し、`?safe=1` だけは閉じたまま）。段は**プリセットの後・かんたんEQの前**に効き、`exportObj`（マイプリセット書き出し）と `exportPrefs("all")`（設定の書き出し）にそのまま入る。リセットは `?reset=amp`（別名 `rack`）＝空に／`?reset=all`＝空に／`?safe=1`＝**段は残して止める**だけ。`core.js` の `resetAmpPrefs()` は fx.js より先に走るため、一度きりの合図 `takeAmpReset()`（sessionStorage `trk_amp_reset_once`）を置き、`js/fx.js` が読み込み時に拾って消す。⚠ `js/fx.js` は凍結扱いだが、この機能のために**追加のみ**の窓口（`TrkFX.rack`／`rackTypes`／`rackOn`／`rackSet`／`rackAdd`／`rackClear`）と `refresh()` の `emit("fxRack")` を足した（DSP・保存形式は不変）。
- ✨ TRKエフェクト（`js/tv-rich.js` の左下カテゴリー）：`js/tv-presets.js` の `portrait|anime|texture|quality`（各5種＝20）をまとめた**独立カテゴリー**（`details.panel.dockRich#richPanel`）。🔥 TRKアンプの直下に `placeRich()`＋MutationObserver で再配置。**中身は映像フィルターそのもの**で、適用は必ず `TrkTV.select()`（`settings.videoStyle`）を通す＝TVドックと二重がけにならない。設定キーは `tvRichId`（初期 `portrait_natural`）／`tvRichPrev`（切ったとき戻る先）／`tvRichCat`（開いているタブ・初期 `portrait`）／`tvRichOpen`（欄の開閉・**初期開き**。触って閉じた人の `false` は尊重。`?reset=tv`／`?reset=all` は開へ戻し、`?safe=1` は閉じたまま）。`resetVideoPrefs()`（`?reset=tv`）で4つとも初期化し、`exportPrefs("all")` にも入る。`?safe=1` はスイッチとチップを無効化して記憶は残す。⚠ `TrkTV.list()` に説明文は無いので、説明は `TRK_TV_PRESETS` から読む。⚠ 読み込み時は `settings` 側の値を優先する（`?reset=tv` は core.js が先に走って settings へ既定値を書くため）。
- 🛡 **点検・守りの現在地（2026-10-06・PR #18／#19）**。以下5つは「一度洗い出して、直して、戻らないよう見張る」体制になっている。
  - **洗い出しの記録**：`docs/SECURITY.md`（F-1〜F-32。直した穴も消さずに残す）＋ `docs/SECURITY-CHECKLIST.md`（OWASP Top 10 Client-Side Security Risks と CWE Top 25（2025）に1項目ずつ当てた表。✅／🟡仕様／🔶未実施／➖対象外、根拠つき）。見つけ方・直し方・残した理由はこの2つが正。
  - **毎回の見張り番**：`tools/check-security.mjs`（**55項目**）＋ `tools/check-a11y.mjs`（**6項目・WARN 1**）＋ `tools/check-vendor.mjs`（8項目）。すべて `npm run check` に含まれ、**依存パッケージ不要**。
  - **第三者ライブラリは同梱**：`assets/vendor/`（three.js・three-vrm 一式・three-mmd-loader＋WASM＋トゥーン素材＝**98ファイル・3.60MB**、各LICENSEつき）。import map は**相対パスだけ＝外部オリジンゼロ**。ロックは `tools/vendor-lock.json`（SHA-384・バイト数・取得元URL）、更新は `npm run vendor:update`、上流との突き合わせは `npm run check:vendor:npm`。**起動時には読まず**、VRM／MMD を使い始めたときだけ動的 import（`?safe=1` では読まない）。
  - **壊す操作の前に1回止まる**：`?reset=all`／`?reset=factory`／`?reset=full`／`#reset=all` は**確認ダイアログ**（queryでもhashでも `force=1` の完全一致だけ即実行＝非常口として残す）。⚠ **`?factory` 単体は全リセットではなく `?safe=1` と同じセーフモード**（`js/addons.js` の `safeNow()` と同じ解釈。壊す動作にしない側へそろえた。`tools/check-security.mjs` が文書の食い違いを検査する）。新規アドオンは同意後にだけ評価し、SHA-256（Web Crypto対応時）の指紋を保存、起動時の不一致・容量超過は実行前に止める。壊れたJSONはJavaScript扱いにしない。記録のない既存アドオンは互換性のため警告だけで続行（localStorageの記録は署名ではなく、サンドボックスでもない）。単体譜面JSON／設定Importは各2MiB、カスタムメイン／TVスキンJSONは各256KiB、アドオン入力ファイル4MiB／コード512KiB（UTF-8換算）で、入力ファイルは `file.text()` 前、コードは評価前に検査する。`?reset=tv|audio|notes|lite|keys|amp` と `?safe=1` は**ワンタップの非常口のまま**。
  - **追補 F-22〜F-32（＋2026-10-07 の仕上げ）**：アドオン指紋不一致の起動前停止・壊れたJSONのfail-closed化・raw JavaScriptはファイルなら`.js`限定／設定Importと譜面メタデータ・Spectrum／MMD／FX enumの型・許可リスト検証／各ID辞書のown-property・null-prototype照合／hashの`force=1`完全一致／`.stpack`の保存済み合計1GiB上限とquota案内を追加。`difficulty:"constructor"`等の継承キーを回帰検査で拒否する。**仕上げ（PR #26 のレビュー対応）**：緊急Importが弾いたキーを黙って捨てないよう報告を追加し（4言語）、spectrum の ID 辞書6個すべてをnull-prototype検査の対象にして「辞書が増えたら検査も更新」する形にし、パック容量の集計で新しいレコードの `size` を優先するようにした。さらに**外部検収（2026-10-07）を受けて**：弾いた理由を3区分（この端末に無いID／型が違う／この設定に無いキー）で表示、🪶 `liteMode`／`liteFps`／`liteMascot`／`liteScale` をImport許可リストへ追加（`LITE_ENUM_VALUES`）、✨ `tvRichId`／`tvRichPrev` を実在IDで検証、hash の値を小文字化しないよう修正、`?factory` の文書ドリフトを解消。**大型修正（パック容量のindex集計・2026-10-07）**：F-32の残件だった「合計を出すために全レコード（Blob）を復元している」を解消した。`js/core.js` の `idbStore()` に `opts.sizeKey`／`opts.sizeOf` を足し、`packs` ストアを **v2**（`IDB_VERSION`）へ上げて `size` index を作り、合計は**index のキー（数値）だけ**で数える（`packDB.usage()`）。⚠ **過小計上は上限の素通し**なので二段の保険を置いた：(a) v1→v2 の移行で `size` を持たない既存レコードへ合計を書き戻す（`openCursor`＋`update`）、(b) indexのキー数とレコード件数が食い違う／キーが数値でない（壊れた `size`）ときは **null を返して全件を数え直す**。`putIf()` は従来どおり**上限判定と put を同じ readwrite トランザクション**で行い、渡す述語が「全レコードの配列」から**集計値** `{stored, replacing, count, fast}` に変わった点に注意（呼び出し側は `packProjected(stats, total)`）。⚠ **版数を上げた副作用**：他のタブが v1 を掴んでいると `onblocked` で止まるため、`r.onblocked` で **reject（`idb-blocked`）して `packDbBlocked` を4言語で案内**する（貼らないと onsuccess も onerror も来ず保存が永遠に固まる）。CSP／Referrer-Policyの本格再評価はIssue #23に従い安定版リリース時まで保留。詳細・誤検知・互換性は `docs/SECURITY.md` を正とする。
  - **監査範囲の限界**：F-29〜F-30では難易度／判定／ライフ／スキンとSpectrum／MMD／FXの設定ID経路を個別に確認・修正し回帰検査へ追加した。2026-10-07 の外部検収で 🪶 `js/lite.js`（M-02）と ✨ `js/tv-rich.js`（M-03）も**全行確認して「問題なし」**となり、加えて `LITE_ENUM_VALUES`／`richIdOk`／`videoIdOk` で予防的に閉じた（記録は `docs/SECURITY.md` の「問題なし」テーブル）。それでも設定値が関係する全辞書参照を網羅監査したわけではない。**未確認で残るのは layout、short mode など**で、問題があると断定せず今後の再点検項目とする。
  - **指摘の読み分け**：`?tv`／`?skin` の「任意CSS注入」は誤検知（CSS文字列はURLから入らず、実際のリスクは未検証IDの保存・表示）。URL経由の保存動作は維持しつつ未許可IDは無視する。既存 `TrkAddons.install(text,name)` のraw-code APIと、同意記録のない旧アドオンの警告付き互換実行も維持。アドオン同意指紋はlocalStorage内の変更検知であって署名・隔離ではない。
  - **外部セキュリティ再点検**：レビュー指摘は必ず実コードで再現性・到達経路・必要なユーザー操作を確認してから判断し、未確認項目を修正済みと扱わない。公開GitHub PagesのURL自体は秘密ではないため、悪用詳細は公開Issueに書かず非公開Security Advisoryへ。制限版を試す必要がある場合は認証付きの別ステージングを使い、本番のURL隠しで代用しない。
  - **最新検査（2026-10-06）**：`node tools/check-security.mjs` 55項目PASS、`npm run check` 全体PASS、`git diff --check` PASS。a11yの見出し順序WARN 1件は既知。実ブラウザ／タッチ端末の手動確認は別途必要。
  - **検査は「効いているか」まで確認する（2026-10-07）**：新しく足した検査は、**わざと修正を元に戻して FAIL すること**を `/tmp` のコピーで確認してから採用する。**PASS だけ見ると「通っているふり」の検査が紛れ込む。** 実際に1回やらかした：
    - ❌ **「通っているふり」の実例**：`tv-rich.js` の検証を確かめる検査で、vm 上から `richIdOk()`／`videoIdOk()` を**直接呼んで**合否を見ていた。その結果 `pickRich("tvRichId", richIdOk, …)` の**配線を外しても**（緩い `idOk` に戻しても）検査は通り続けた。→ **直した**：実際に保存値を注入して `settings.tvRichId` / `settings.tvRichPrev` の**結果**を見る形に変更（＋配線の文字列チェック）。
    - ✅ このとき効いた逆テスト（いずれも FAIL を確認）：①`THEME_KEYS` を `{}` に戻す ②`packRecordBytes` を旧実装に戻す ③報告処理を消す ④spectrum に7個目の null-prototype 辞書を足す ⑤i18n を3言語しか足さない ⑥`LITE_ENUM_VALUES` を外す ⑦tv-rich の検証を緩い `idOk` に戻す ⑧`tvRichPrev` を `richIdOk`（誤った許可リスト）で検証する ⑨検証関数を残したまま配線だけ外す ⑩hash の値まで小文字化する ⑪`?factory` を全リセット扱いに戻す ⑫Import 報告の重複よけを外す ⑬`size` index を使わない v1 に戻す ⑭v1→v2 の移行（`size` の書き戻し）を消す ⑮件数が食い違っても数え直さない（過小計上へ戻す）⑯`onblocked` を外す ⑰`sizeOf` を渡さない ⑱`packDbBlocked` を1言語だけにする。
    - ⚠ **vm で検証するときの落とし穴**：トップレベルの `const`／`let` は**グローバルオブジェクトに載らない**（`ctx.TRK_TV_PRESETS` は `undefined` になる）。別スクリプトからは字句スコープで見えるので、`window.TrkTV = { list: () => TRK_TV_PRESETS.map(…) }` のように**vm の内側でスタブを組む**こと。外側から渡すと `TypeError` が try/catch に飲まれて「一覧が読めない＝fail-open」になり、**検査が無条件で通ってしまう**。
    - ✅ **検査のほうが本体の穴を見つけた実例（2026-10-07）**：`size` index の検査を書くとき「数値でないキーは過小計上になる」と気づいて `null`（＝全件数え直し）を期待したところ、実装は `keys.length !== count` しか見ておらず **`Number.isFinite(k) ? k : 0` で 0 に落として通していた**。つまり `size:"900"` のような壊れたレコードがあると合計が過小になり、上限を素通しする。→ **実装側を直した**（数値でない／負のキーは `null` を返す）。検査を先に厳しく書くと、実装の穴が見つかる。
  - **♿ 読みやすさ**：外部ツール（html-validate・axe-core・ESLint・css-tree・Manifest）を一度かけた記録が `docs/QUALITY-CHECKS.md`（**再点検で axe violation 0**）。見つけた実害（読み上げ名の不足23か所＋つまみ60か所・`role="tablist"` に「＋」が混ざっていた・見出しに `role="button"`・重複キー29件）はすべて修正済み。**残したものと理由も同文書**（見出しの飛び h1→h3 は WARN だけ、色のコントラストは実機で、動画の字幕は該当なし など）。
- `sw.js` の現在のキャッシュ名は `trk-v2026.10.6-sec31`。公開ファイルを変更したら必ず更新する。
- このcheckoutで `npm run check` はコード・データの自動検査を行うが、MMDの実描画・タッチ操作・音声の実機確認は別途必要。
- **Issue #21〜#25 の再調査・残件（2026-10-06）**：
  - **#21**：不正な `specStyle`／`specTheme` を設定Import時点で拒否し、Spectrum辞書もnull-prototype化済み。GitHub本文の再現手順どおりの実ブラウザ確認はまだなので、画面・コンソール確認を残す。
  - **#22**：MMD `BUILTIN` とFX `custom` の継承キー参照を防ぎ、Import enumも検証済み。`npm run check` とMMD smoke checkはPASS。LatモデルでのMMD選択／FX有効時の実音声グラフは未確認。
  - **#23**：未解決の設計タスクとしてOpenを維持。CSPは導入せず、Referrer-Policy／Capacitor/WebViewを含む配信ヘッダ判断を安定版リリース前に再評価する。
  - **#24**：query/hashの全設定リセットは、`force=1` の完全一致以外は確認ダイアログを出す。GitHub Issue本文のURLは誤植のまま。正しい再現URLは `https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/#reset=all&force=0`。誤記URLを再利用しない。
    - ⚠ **トークン権限の調査結果（2026-10-07）**：`gh issue edit` は `Resource not accessible by integration` で拒否される。原因は**スコープ切れではなく「Issues の書き込み権限が無いトークン」**（PR の作成・ラベル付与はできる）。`gh auth refresh` は使えない。直すには Arena の GitHub 連携に **Issues: Read and write** を持つトークンを設定し直す必要がある。詳細は §2 末尾の「GitHub 書き込み権限の切り分け」を参照。
  - **#25**：現行の展開後合計1GiB上限は、**公認・非公認を問わず全パックに適用**し、WAV/FLAC等も例外にしない。大きな音源では上限に達し得る。公認パックの例外や別枠容量を設ける案は将来のポリシー検討に残し、信頼根拠・上限・quota・更新／削除挙動を定義してから実装する（現時点では例外処理なし）。低quota環境の実機／模擬テストも未実施。
  - 🔑 **`gh auth refresh` が使えない理由（2026-10-07 実測）**：このサンドボックスの認証は `GH_TOKEN` 環境変数（ユーザートークン）で、`gh auth status` は成功するが `x-oauth-scopes` は空＝**fine-grained PAT**（`GET /user` は 200、`GET /app` は 401）。`gh auth refresh` は ①`GH_TOKEN` が設定されていると「まず環境変数を消せ」と拒否する ②`~/.config/gh/` に保存済み資格情報が無い ③そもそも **OAuth アプリの再認証しかしないので、既存 PAT の権限は変えられない**——の3点で効かない。読み取り（`gh issue view`／`gh label list`）は通り、書き込み（`gh issue edit --add-label`）だけが拒否される。**対処はトークンの再発行・権限変更のみ。**
  - GitHub状態の最終確認時点では #21〜#25 はすべてOpen、ラベル未付与。PR #26は関連Issueを参照するが、実ブラウザ検証などの未完了確認があるため自動close指定をしていない。Issue編集は `Resource not accessible by integration` で拒否されたため、#24本文修正とラベル付与は権限が整ってから再試行する。**2026-10-07 追記**：`gh auth refresh` では直らない（後述）。PR #26ではGitHub checksが報告されていないため、ローカルの `npm run check`／`git diff --check` 結果を検証根拠として記録する。実ブラウザ検証が必要な項目は、コード修正だけを理由に完了扱いにしない。

---

## 3. ライセンス・再配布の制約

- ソースコードは **GPL-3.0-or-later**。プロジェクト名「trk!」と同梱モデルはGPLの対象外。
- 初音ミクのキャラクター表現はPiapro Character License（非営利条件）に従う。商用派生では `js/characters/miku.js` と対応する読み込みを取り除く。
- MMDモデル・テクスチャ・VMDは作者ごとの規約が優先。**無料公開されていることだけを理由に再配布しない**。第三者VMDは、実ファイルの再配布条件が明確でない限り同梱禁止。
- `assets/mmd/lat-miku/` は例外として、再配布を許す原文ReadMeとモデル一式を同梱している。改変・再配置時はその原文規約も維持する。
- 内蔵VMDはオリジナルのコード生成。曲名や「〜風」はテンポ／雰囲気の参考で、公式または既存の振付の再現を主張しない。顔モーフはLat式モデルに存在する名前を参照するだけで、新たなモデル形状や外部VMDは含まない。
- 権利の詳細・第三者ライブラリ一覧は `NOTICE.md` を正とする。パック仕様は `docs/pack-format.md`、アドオン仕様は `docs/ADDONS.md`。

---

## 4. 読み込み順と主要ファイル

`index.html` のscript順は前提条件。依存を変えるときは実際のHTMLも確認する。

| 順 | ファイル | 主な責務・注意 |
|---:|---|---|
| 1–5 | `i18n.js` → `i18n-options.js` → `data.js` → `characters/miku.js` → `tv-presets.js` | 共通文言、設定文言、データ／スキン、PCLキャラクター、TVフィルターデータ |
| 6 | `characters/○○.js` | 任意の拡張キャラクター用script枠 |
| 7 | `core.js` | 共通状態と保存、設定の既定値、`videoFilter()` |
| 8 | `lite.js` | 🪶 軽量化（端末の判定・描画のゲート・設定欄の配線）。設定を読んだすぐあと、描画する側より前に置く |
| 9–20 | `player.js` → `media.js` → `game.js` → `render.js` → `custom.js` → `truck.js` → `modes.js` → `stage.js` → `stagefx.js` → `catch.js` → `extras.js` | 再生・音源・ゲーム進行・描画、各ゲームモードと補助機能 |
| 21–27 | `fx-presets.js` → `fx-dock.js` → `tv-dock.js` → **`tv-rich.js`** → `video-max.js` → `fx.js` → `fx-synth.js` | 音響／映像ドック。`fx.js` と `fx-presets.js` は凍結扱い。**fx-dock.js は先に読み込まれる**ので、🔥 TRKアンプは `TrkFX.rack*` を読み込み時に見つけられない→DOMContentLoaded で組み、`on("fxRack")` で同期する。✨ TRKエフェクト（`tv-rich.js`）は **tv-dock.js の後**（`window.TrkTV` を使う） |
| 27–32 | `favs.js` → `catalog.js` → `library.js` → `verified.js` → `lib-skins.js` → `addons.js` | お気に入り、曲カタログ／選曲、公認パック、棚スキン、アドオン |
| 33–36 | `main.js` → **`pad.js`** → `speed.js` → `vrm.js` | 起動・イベント、🎮 パッド・コントローラー・TVリモコン（`main.js` の直後。Gamepad API の見張りと設定欄の配線）、速度操作、遅延VRM機能 |
| 37 | `mmd.js` | 遅延MMD機能・コード生成VMD |
| 38–41 | `spectrum.js` → `synth-mode.js` → `frame-interp.js` → `media-player-mode.js` | スペクトラム、演奏シンセ、映像補完、メディアプレーヤー |
| — | `assets/vendor/` | 🌐 同梱した第三者ライブラリ（three.js・three-vrm・three-mmd-loader＋WASM＋素材。**98ファイル・3.60MB**）。`index.html` の import map から `./assets/vendor/...` として参照。**手で編集しない**（`npm run vendor:update`） |
| — | `tools/check-security.mjs` | 🛡 静的なセキュリティ検査（危ない書き方・href の関所・共有ファイルの検証・`__proto__` よけ・ZIP／譜面／設定／アドオン入力の上限・URLスキン許可リスト・通信先・読み取り専用・セーフモードのSW規則・**アドオン同意／指紋照合が実行より前**・**`?reset=all` の確認**）。`npm run check` に含む |
| — | `tools/check-a11y.mjs` | ♿ 静的な読みやすさの検査（id の重複・入力欄の読み上げ名・`alt`・押せるものの role・`role="tablist"` の中身・点検記録の存在）。**見出しの飛びは WARN だけ**。`npm run check` に含む |
| — | `tools/check-vendor.mjs` / `tools/vendor-cdn.mjs` | 🌐 同梱ライブラリの検証（8項目・オフライン）と更新（`--source=npm`）。`npm run check` に含む |
| — | `docs/SECURITY.md` / `docs/SECURITY-CHECKLIST.md` / `docs/QUALITY-CHECKS.md` | 点検の記録（穴の一覧／標準リストとの突き合わせ／外部ツールでの手順と結果） |
| 42–43 | `study-room-utils.js` → `study-room.js` | 📚 書斎。純データ処理（文字コード・並べ替え・ルビ）とUI／IndexedDB。書斎は `#libPanel .libHead .study-launch-title`（＝見出し `h3` の中の**本物の `button`**）を長押し／Enter で開く。**見出しに `role="button"` を付け直さない**（読み上げの規則） |

上記は `index.html` の実順。依存を追加・移動する場合はscriptタグと `tools/check-repo.mjs` の両方を確認する。
主なファイル：`index.html`（UIと読込順）／`css/style.css`・`css/study-room.css`／`js/core.js`（設定・保存）／`js/main.js`（初期化）／`js/pad.js`（🎮 パッド・リモコン）／`js/library.js`（選曲）／`js/lite.js`（🪶 軽量化）／`js/study-room.js`・`js/study-room-utils.js`（書斎）／`js/mmd.js`（MMD）／`js/addons.js`（🧩 同意と指紋）／`sw.js`（オフラインキャッシュ）／`assets/vendor/`（同梱ライブラリ）／`tools/check-*.mjs`（見張り番）／`README.md`／`NOTICE.md`／`docs/`（点検の記録）。

---

## 5. 壊さないための契約

### 保存・形式

- 既存のlocalStorage／IndexedDBキーやファイル形式名を理由なく改名しない。変更が必要なら移行処理と後方互換テストを追加する。
- 主な保存先：`shadow_taiko_preferences_v2`（設定）、`shadow_taiko_records_v1`（記録）、`shadow_taiko_song_prefs_v1`（曲別設定）、IndexedDB `shadow_taiko_packs`／`shadow_taiko_songs`／`shadow_taiko_library`／`shadow_taiko_vrm`／`shadow_taiko_mmd`／`shadow_taiko_shared`／`trk_study_room_v1`（書斎。books／pages／covers／settings。削除操作は書斎内の「×」とブラウザのサイトデータ削除）。
- 共有・Export形式：`shadow-taiko-pack`、`shadow-taiko-chart`、`shadow-taiko-records`、`skin.shadow-taiko`、`trk-fx`、`trk-verified`、`trk-tvskin`、`trk-playlist`。外部JSONは項目と範囲を検証し、コードとして実行しない。

### 音声・イベント・安全モード

- `createMediaElementSource(video)` は一度だけ。波形・スペクトラムなど音を観察する機能は `TrkFX.tap()` を使い、独自に音源を再接続しない。
- `js/fx.js` と `js/fx-presets.js` は **凍結扱い**。変更が本当に必要な場合は、依存するfx-dock／fx-synthと `window.TrkFX` APIの利用者を一緒に確認する。2026-10-06 の 🔥 TRKアンプ追加では、**DSPに触れず**に (1) `TrkFX.rack*` の追加、(2) `refresh()` の `emit("fxRack")`、(3) 検証用の定数（`R`／`str`／`BIQUAD`／`SWEEP_F`／`NOISES`）を `settings.fxRack` を `cleanFx` で読む行より前へ移動（**それまでは、段を保存した人が次回の読み込みで参照エラーで落ちていた**）、(4) ラックの段セレクトの絵文字が二重に出ていたのを修正、だけを行った。この4点は戻さないこと（check-repo.mjs が見張っている）。
- 後から読み込まれる機能が関数を包む場合、対象は `function` 宣言か `let` である必要がある。`const` 化・引数変更はラッパー側を先に検索する。
- `?safe=1` は保存ファイルやCDN機能の読み込みを抑える非常用モード。安全モードを迂回しない。
- 🛡 セキュリティ：`docs/SECURITY.md` が洗い出しの記録、`tools/check-security.mjs` が回帰よけ（`npm run check` に含む）。守るべき決まりは4つ。
  - **外から来た文字列を `<a href>` にするときは `safeLink()`／`safeHttpUrl()`（`js/core.js`）を通す**（https 以外はリンクにせず文字だけ出す）。共有ファイル（パックの名刺・配布ページ・エフェクトのプリセット）と公認リストの作者リンクが対象。`href` への直代入は check-security が FAIL にする。
  - **設定の緊急インポートは `UNSAFE_KEYS`（`__proto__`／`constructor`／`prototype`）を飛ばし、`hasOwnProperty` で自分のキーだけ入れる**（プロトタイプ汚染よけ）。**型不一致・未対応の列挙ID・未知キーで弾いた分は `rejected[]` に集め、結果表示（4言語）で必ず伝える**（「📥 読み込みました」と出しながら黙って捨てない。未適用があるときだけ再読み込みを2.6秒に遅らせて読む時間を確保）。列挙IDの検証対象は `SETTING_ENUM_KEYS`（`js/core.js`。増やしたら `tools/check-security.mjs` も更新）。
  - ⚠ **`fxPreset` の `my_*` はその端末のローカル保存にあるカスタムプリセット**なので、別端末の設定を取り込むと必ず未適用になる。これは仕様（存在しないIDを settings に入れない）で、隠さず表示する方針。
  - **`.stpack` の展開は `inflateEntry(entry, limit, path)` のとおり上限を渡す**。ZIP の `usize` は作り手が自由に書けるので信用しない（展開しながら数えて止める＝圧縮爆弾よけ）。保存済みパックは展開後合計1GiB（同一IDの更新は差分）まで。**この1GiBはパック専用で、📚書斎（`trk_study_room_v1`）とは合算しない**（合算の防御は `navigator.storage.estimate()` の事前判定だけ。書斎を先に埋めるとパックが入らなくなる）。`navigator.storage.estimate()` は参考値として事前確認し、最終上限確認＋putはIndexedDB readwrite transaction内で一体化（複数タブ間の競合も防止）。quota超過は4言語で案内。
  - **共有プレイリストのリンクは `plOpenLink()` を通し、その先頭で `safeHttpUrl()` を再確認する**（取り込み時の検証だけに頼らない）。曲プロフィール（`SONG_META`）は読み込み時に `songMetaCleanAll()` で1件ずつ整える（https のみ・長さ・3000件上限）。
  - **📁 開く／📤 共有で覚えたフォルダのハンドルは、「🚫 共有をやめる」で `share` と `dir` の両方を消す**。⚠ `FileSystemHandle.remove()` は**本物のファイル／フォルダを消す API** なので絶対に呼ばない（check-security が見張っている）。
  - **大きいメディアを丸ごとメモリに載せない**：`js/media.js` の `ANALYZE_MAX`（96MB）を超えるファイルは音声解析を省略する（`analysis` を使う所は全部 `if (analysis)` で守る）。動画は「🎬 動画を読み込む」＝`addVideoFiles`／`probeVideoFile` を通し、**最初のフレーム（videoWidth > 0）まで確かめてから** 🎬 として記録する（勝手に「動画」と決めつけない）。
  - **`?safe=1` の判定は core.js の `handleUrlCommands()`（＝起動直後）より後ろに動かさない**。コードを実行しうるもの（アドオンの `boot()` 等）は、必ずセーフモードの判定**後**に置き、先頭で `safeNow()` を見る。SW は**セーフモードのクライアントにキャッシュを配らない**（`safeClients`／`safeWanted`）＝オフラインでも汚染されたコピーを実行しない。
  - **第三者ライブラリは CDN から読まない**（`assets/vendor/` に同梱）。import map は相対パス `./assets/vendor/...` のみ。**同梱ファイルは手で編集しない**：版を上げるときは `npm run vendor:update` → `git diff` で差分を確認 → `npm run check`（`npm run check:vendor` がハッシュ・相対import・import map の被覆をオフラインで検証。来歴は `npm run check:vendor:npm`）。**起動時に3Dライブラリを読まない**こと（動的 import は `js/vrm.js` と `js/mmd.js` だけ）。
  - **📚 書斎の本文は「文字」としてしか描かない**（`createTextNode` / `textContent`。`innerHTML` での本文組み立ては禁止。マークダウンのレンダラも無し）。`.html`／`.js`／`.md` もソースのまま見せます。
  - **青空文庫ルビの解析（`js/study-room-utils.js` の `aozoraSegments`）は線形走査を維持する**。後戻りのある正規表現（`/｜([^《\n]+)《…/`）に戻すと、**漢字だけが続く本文や閉じない`《`でタブが固まる**（実測: 1MBで数分）。`tools/check-study-room.mjs` が速度、`tools/check-security.mjs` が正規表現への逆戻りを見張っている。
  - **動的評価は例外1か所だけ**：`js/addons.js` の間接 `eval` は、利用者が明示選択・同意したアドオン用（同一ページのフル権限、sandboxではない）。保存アドオンは起動時に指紋確認してから実行し、古い指紋不一致やサイズ超過は止める。`new Function`／`document.write`／`srcdoc` は使わず、アドオンコードを遠隔取得しない（同梱サンプル以外）・安全モードでは読まない。`innerHTML` は `js/game.js` の結果画面（全部 `esc()` 済み）だけ。
- **壊す操作の前には1回止まる（非常口は残す）**：`?reset=all`／`?reset=factory`／`?reset=full`／`#reset=all` は `js/core.js` の `askFactoryReset()` で**確認ダイアログ**を出し、同意したときだけ実行する（query／hashとも `force=1` の完全一致だけ即実行＝非常口。`trkReset("all")` も同じ関門を通る）。**URL のパラメータは確認を出す前に消す**（リロードループ防止）。確認を足す／文言を変えるときは4言語文言と `tools/check-security.mjs` の規則をセットで更新する。`?reset=tv|audio|notes|lite|keys|amp` と `?safe=1` は**ワンタップのまま**（逃げ道を遠くしない）。
- **アドオンは「同意 → 実行」の順を崩さない**（`js/addons.js`）：ファイルを選んだら同意ダイアログ → 同意で `installText` → `consentAt`（時刻）と `consentSha`（Web Crypto対応時はSHA-256、非対応時は互換FNV系）を `trk_addons_v1` に記録。保存コードは起動時に全指紋を確認してから実行し、stale・不正・512KiB超は止める。壊れたJSONはコードにフォールバックしない。`TrkAddons.list()` の各要素は `consent:{state:"ok"|"stale"|"none", at, sha}` を返し、一覧は ✅／⚠ を出す。**この機能より前のアドオン（`none`）は動かしたまま警告だけ**（黙って止めない）。記録はlocalStorageのため署名／sandboxではなく、同一ページ権限から改変可能。⚠ 保存キーと形（`trk_addons_v1`）は変えない。
- **読み上げ名（aria）の付け方**：見える文言をそのまま名前にしたいときは、その要素に `id` を付けて `aria-labelledby` で結ぶ（新しい翻訳文が要らず、言語を切り替えても付いてくる）。辞書から名前を入れたい `<select>` などは **`data-i18n-aria="キー"`**（`js/core.js` の `applyLanguage` が `aria-label` に入れる。🔤 キーは4言語そろえる）。つまみを作るときは `fx.js` の `range()`／`stage.js` の `makeRange()`／`modes.js` の `makeColorRow()`／`stagefx.js`／`extras.js` と同じく**隣の見出しと結ぶ**。⚠ **押せるものから role を消さない**（`role="presentation"`／`"none"` を button に付けない）。`role="tablist"` の中は**タブだけ**にし、＋などのボタンは入れ物の外へ（`js/library.js` の `.libTabsList`＝`display:contents` はスキンの見た目を変えずにこれを満たす工夫なので、`.libTabs` の見た目を触るときはここも確認する）。書斎を開く見出しは `h3` の中の `<button>` のままにする。
- UI追加時は4言語の文言を同時に追加し、設定項目は初期値・リセット・Import/Export・セーフモード経路を確認する。
- GitHub Pagesはファイル名の大文字小文字を区別する。相対パスとService Workerキャッシュも確認する。

---

## 6. MMD実装メモ

### 構成

- `BUILTIN` は65種。`MOTION_GROUPS` が選曲optgroupとクイック選択optgroupを定義し、`MOTION_MENU_IDS` がその65種を同じ順で平坦化する（`MOTION_MENU_SET` は表示・お気に入り・保存値の判定に使う）。グループは 日常・休憩／ダンス・ステージ／ミク曲テンポ／ミク定番ポーズ／表情・演技／🎤 歌・口パク。
- 生成は `buildVmd()`／`builtinBytes()`。ボーンフレームに加えてVMD標準のモーフフレーム（Shift-JIS名15バイト＋frame＋weight）を出力する。`FACE_MORPHS` の26名は同梱Lat式PMDの実データで照合し、CP932表にも全て登録する。振付数式を共有し、VMDデータファイルを追加しないことで配布物を軽く保つ。
- 「おまかせ」はBPMが近い候補を選び、汎用の歩行／走行は自動候補から外す。座り・表情・🎤だけの動きはBPM非依存。新規／未設定／リセット時の既定は `faceSing` で、保存済みの有効な選択（`none` を含む）は上書きしない。

### 座標と回転軸（実測メモ）

- `pose` の `rot` は全ボーン共通で、**X＝前後の傾き（+で手前＝カメラ側）／Y＝体の上下軸まわりの水平回転（腕は手を前へ寄せる・体幹はひねり）／Z＝前後軸まわりの傾き（腕を体側から開く・下ろす。左右で逆符号＝左 + で上／右 + で下）**。腕の前後振りは `rot[0]`（左腕 `rot[0]`+20 で左手首が手前へ +1.05、脚も同じ向き＝股関節の屈伸）。
- 肘を前へ折るには `rot[0]`（左右同じ符号・+20 で手首 +0.43）か `rot[1]`（左右逆符号・左 +20／右 −20 で +0.54）。**既存の表情・actモーションの肘は昔からの向きのまま**（腕を下ろしたまま手が後ろへ流れる）で、🎤の6種は `rot[1]`、🚶／🏃の肘は `rot[0]` で前へ折っている。
- `センター` などの `pos` は `pos[1]`＝上、`pos[2]`＝−で手前（three側の +Z が顔の向き）。

### 🚶歩行112／🏃走行152（その場足踏み）

- 腕は脚と逆相で `rot[0]` を振り（歩き ±34°／走り ±54°＋前傾 6°）、肘は前へ折る（歩き `rot[0]` 22〜42°／走り `rot[0]` 64〜80°）。胴のひねりと頭の揺れも入れている。
- **足は `左足ＩＫ` / `右足ＩＫ` の position キーで持ち上げる**（Y＝上げ幅 歩き0.7／走り1.1、Z は − で手前＝ひざを前へ）。モデルの足ＩＫは本来「足首を床に固定する」IKなので、これを動かさないと脚のFKが打ち消されて足首が張り付く（＝膝だけが曲がる見え方）。足ＩＫのCP932用に SJIS 表へ `Ｉ` / `Ｋ` を追加済み（`sjisFix` は未登録の文字を黙って落とすため、抜けるとボーン名が途中で切れる）。
- モデルの足ＩＫを切って脚を全てFKにする手もある（VMDのIK/表示プロパティ）が、見え方が一斉に変わるため未実施（`buildVmd` はIK/表示セクションを0件で書いている）。
- 実測（本物のローダー＋Lat式PMD・120サンプル）：左手首の前後幅 歩き 3.40／走り 3.36、足首の上がり 歩き 1.38→2.07／走り 1.30→3.49、手足の体へのめり込みフラグ 0/120（走りは初版で肘が 1.17 まで胴に入っていたのを腕の開きと `ひじ rot[2]` 0 で解消）。

### 🎤 歌・口パク

- 6種（`songMic`／`songLong`／`songUp`／`songHum`／`songWhisper`／`songCall`）は、母音モーフ（あ・い・う・お・ワ）と鼻歌用の ω を使い分ける（`faceMorphs` の `singUp`／`singSoft`／`call`／`hum`／`whisper`）。BPM非依存の6秒ループ。
- `faceSing` は「あ・い・う・お」モーフを循環させる簡易口パクで、歌詞／音声とは同期しない。対応モーフ名がないモデルでは表情部分が無視される。
- 腕は肘を「前に折る」向き（左＝+Y／右＝−Y）で組み、体と干渉しないこと・口を隠さないことを実測で確認済み（実機の見た目は要確認）。

### 外したもの・戻し方

- 170「きゅん」・174「ダンスホール」は既存選択を維持。エアギター（旧 `airgtr128`）は2026-10に一旦外した：腕・肘が弦の位置に乗らず破綻しやすかったため。戻すときは git 履歴（`147720e` 時点の `js/mmd.js`）から pose を復元する。

### 検査と未保証

- テスト：`tools/check-mmd-motion-data.mjs` が全65種のポーズ値・VMD構造・CP932・Lat式PMDのボーン／モーフ名・モーフフレームに加え、歩行／走行の前後振り（左右が逆相・同じ側の脚と逆相・肘の前折り・足ＩＫが左右交互に上がる）を検査する。
- ブラウザ上の描画・VMDローダー実行・髪／衣装／スカートの貫通は、このNode検査だけでは保証しない。three.jsと `@yohawing/three-mmd-loader` は同梱（`assets/vendor/`）で、MMDを使い始めたときに読み込む。

---

## 7. 自動検査と手動確認

### 自動

```sh
npm run check

git diff --check
```

`npm run check` は `tools/check-a11y.mjs`（**読みやすさの見張り番**：id の重複・入力欄の読み上げ名・`<img>` の `alt`・押せるものの role を消していないか・`role="tablist"` の中がタブだけか。**見出しの飛びは WARN だけ**＝左の列の見出しが h3 のため既知。外部ツールでの点検手順は `docs/QUALITY-CHECKS.md`）、`tools/check-security.mjs`（**55項目**。うちURL／設定Importの型・enum ID／譜面／スキン／アドオン入力値の境界、**緊急Importが弾いたキーを黙って捨てないこと（4言語の報告文言つき）**、spectrum の ID 辞書6個すべてが null-prototype であること（増えたら検査も更新する仕掛け）、アドオン同意・指紋確認が「実行より前」であること、query/hash resetの厳密な`force=1`、パックの累積容量・quota案内（**合計は `size` index のキーだけで数え、index に無い／数値でない `size` を見つけたら全件を数え直す**＝過小計上で上限を素通ししない）、同意／確認文言の4言語、vendorロック、import mapに第三者オリジンが無いこと、セーフモードのキャッシュ規則、この文書の存在を検査）、`tools/check-vendor.mjs`（`assets/vendor/` の欠落・改変・import map の網羅。`--source=npm` で上流と突き合わせ）、`tools/check-repo.mjs`（構文・ローカル参照・設定／翻訳・重要機能。🪶 軽量化は**描画ゲートの位置と判定がゲートの前にあること**まで検査する）、`tools/check-mmd-motion-data.mjs`（VMD生成データ／Lat PMD）、`tools/check-study-room.mjs`（書斎の純データ処理・4言語の網羅・`index.html` のID照合・通信／`innerHTML` を使わないこと・TV／ジャケット連携・キー譲渡）を実行する。依存パッケージのインストールは不要。失敗したら、まず最初のエラーを直してから再実行する。

外部ツールでの点検（**毎回ではなく、必要になったとき**）は `docs/QUALITY-CHECKS.md` の手順どおり。リポジトリの外（`/tmp/validate` など）に `html-validate`／`axe-core`／`jsdom`＋`fake-indexeddb`／`css-tree`／`eslint` を入れて回し、**リポジトリには依存を増やさない**。

JSDOM の実挙動ハーネス（**コミットしていない・消えたら作り直す**。`npm i jsdom fake-indexeddb` が要る）は `/tmp/shot/` に置いて使った。記録として残すのは**期待値**：

| ハーネス | 見ていること | 結果 |
|---|---|---|
| `security.mjs` | 危険なURL・プロトタイプ汚染・ZIP爆弾・汚れた保存データ・共有プレイリスト・セーフモード・アドオン・パック容量のindex集計 | 55/55・スクリプトエラー0 |
| `study.mjs` | 書斎のUI経路（偽装ファイルの取り込み〜表示・ルビ・速度） | 20/20 |
| `video.mjs` | 🎬判定・記録・一覧・全画面・2GBで `arrayBuffer` を呼ばない | 16/16 |
| `sw.mjs`（偽SW環境） | セーフモードのクライアントにキャッシュを配らない | 6/6 |
| `guards.mjs` | `?reset=all` の確認（やめる／同意／`force=1`）とアドオン同意（キャンセル・同意・旧アドオン・コード差し替え検知） | 24/24 |

`html-validate`／`axe-core` は**起動後の DOM** に当てる（`data-i18n` で文字が入るのは起動後。ソースだけ見ると「空の見出し」が大量に出る）。axe は隠れた要素を飛ばすので、**設定画面・書斎などを開いた状態**にしてから回す。

### 未確認の実機項目

- Lat式ミクの表示・表情モーフ・65種の動き、特に左右の腕／顔／裾の見え方。同梱ライブラリ（`assets/vendor/`）の読み込みを含むため実ブラウザで確認する。
- 🚶歩行／🏃走行の「その場足踏み」：足が上がって（歩き0.7／走り1.1ユニット）、ひざが前へ出て、腕が前後に振れているか。**🎤6種**：口の動きが見えるか、手が口や体に被らないか、マイク持ち（`songMic`）がそれらしく見えるか。
- 曲名バナー音量ボタンの短押し・650ms長押し、ドラッグ時の誤発火防止、タッチ端末でのミュート／復元。
- 🪶 軽量化：実機（Android Chrome／PWA／APK）での `getBattery()` の有無、省データ設定・電池残量での自動オン、30／20fpsでのプレイ感と発熱・電池のもち、MMD／VRMの「描画しない」、描画解像度1.0倍の見え方、`body.trkLiteFx` で `backdrop-filter` が消えること。バナー右端の [◀][🎲][▶]：🎲 の長押し／タップ／設定オフ、◀▶ の回り込み、曲名との重なり（実ブラウザ・タッチ端末）。
- TV／スペクトラム／メディアプレーヤー／シンセの実映像・音声、モバイル幅・発熱・操作感。
- 📚 書斎：実ブラウザでのフォルダ取り込み（数千枚のAlbum・入れ子フォルダ）、Shift_JISの実書籍、IndexedDBの容量超過時の挙動、長押し（650msで起動／680msでジャケット割り当て）とスワイプの取り違え、モバイル幅・フルスクリーンAPI、TVペインで動画を移したあとの復帰。
- 📚 書斎 v2：本棚の並べ替え／検索／栞一覧／冊数・使用量の表示、取り込みの進捗・中止・置き換え確認と保存容量超過（`QuotaExceededError`）時の表示、縦読みの遅延読み込みと長い本のスクロール、拡大（Ctrl+ホイール・ピンチ）と拡大中のドラッグ、本文検索のハイライトと前後移動、文字組み（サイズ・行間・余白）と作文用紙の横スクロール、TVペイン（見た目6種・大きさ・縦横比・曲名）と動画の受け渡し／復帰、❓キーの説明と初回表示。JSDOMスモークでは fake IndexedDB のため `jsdom` の Blob を往復できず、画像表示は実ブラウザでのみ確認できる（テストは Node の `Blob`/`File` を注入している）。
- 前セッションからの持ち越し（要約）：初回起動・コンソールエラー・PWAアイコン・横画面、🎭キャラ肌10体と自分のイラスト2枚（端末内のみ・初期化で消える）、📡アンテナ分離と置き場、🕹️ショートプレイ（90/120/180秒・無音検知）、📊スペクトラム（30種×16色）、🛒カタログと👥投稿者ツール（初期オフ）、⏯バナーの曲送りとタップ一時停止、🎧プレイリストと📤共有の条件、🎚ラックとPro Audio系（AudioWorklet非対応時のフォールバック）、メディアプレーヤー（逆再生音声・A-Bループ・Loop Lab・壁紙）、✨フレーム補完（滑らかさ・重さ・`swayAllModes` 併用）。
- ♿ 読みやすさ（**2026-10-06 追加**）：実ブラウザでの**色のコントラスト**（jsdom では計算できない）、読み上げ（NVDA／TalkBack／VoiceOver など）での設定画面の読み方、**書斎の起動ボタン**（曲リストの見出しの中の `<button class="study-launch-title">`）の見た目・フォーカス枠・長押しの手触り、`role="tablist"` の入れ物（`.libTabsList`＝`display:contents`）でタブの並びが崩れていないか、スキン（プレーヤー・カセット・黒板…）ごとの見た目。
- 🔐 守りの2つ（**2026-10-06 追加**）：`?reset=all` の確認ダイアログ（日本語の見た目・ESC／背景クリックで「やめる」・キーボード操作・モバイル幅・`&force=1`）、アドオンの同意ダイアログと一覧の ✅／⚠ 表示（`.trkaddon` と `.js` の両方、旧アドオンに同意を記録するボタン、端末内の時刻表記）。いずれも JSDOM（`guards.mjs`・24項目）で通してあるが、**実際の見た目と読みやすさは実ブラウザで確認する**。
- WebGL・IndexedDB・端末のフォルダ選択など環境依存機能。静的検査通過を実機確認済みと表現しない。

---

## 8. 変更時の短いチェックリスト

- [ ] `git status` と差分を読んで、既存のユーザー変更を保持したか
- [ ] 4言語、初期値、リセット、Import/Export、`?safe=1` を確認したか（**確認ダイアログ絡み**：`?reset=all` は「やめる」で何も消えない／`&force=1` は即実行、アドオンは同意するまでコードが動かない・同意の記録が一覧に出る）
- [ ] 保存キー／Export形式を不用意に変更していないか
- [ ] 第三者素材の実際の利用・改変・再配布条件を確認したか
- [ ] 関連テストと `npm run check`、`git diff --check` を通したか
- [ ] `README.md`／`NOTICE.md`／この文書／`sw.js` の更新が必要か確認したか
- [ ] 未確認の実ブラウザ・タッチ端末作業を明記したか

## 9. これまでの流れと維持する方針（旧 `NEXT_SESSION_HANDOFF.md` の統合・2026-10-06）

リポジトリ直下にあった `NEXT_SESSION_HANDOFF.md`（2026-10-05・PR #13 時点で更新が止まっていた）の中身をここへ統合し、ファイルは削除した。**引き継ぎの正本はこの1ファイルだけ**にする。

### 現在地

- 直近で入った機能（`main` へマージ済み）:
  - **PR #13**：📡キャスト／バックグラウンド再生の分離（`castPolicy`／`backgroundPolicy`、置き場は右上（言語の左）も可）、🖼スキンの棚（プリセット31種・グラデ対応・ごほうびスキン🎓）、🧭スタンプラリーチュートリアル（`trk!` 入力で即完了）、🎧プレイリスト（🧊／🔒・中クリック削除・曲プロフィール・フォルダ・タグ・曲別入手先）、📤共有（9曲以上＋全曲クリア／視聴済み・AUTO必須表示・https確認リンク）、🛒公式プレイリストカタログ（10シリーズ・**音源同梱なし**・Musicフォルダ自動マッチ）、👥投稿者ツール（**初期オフ**）、📊スペクトラム（見え方30種・色16色）、⏯バナーの◀▶曲送り（初期オン）とタップ一時停止（初期オフ）、🕹️ショートプレイ（後半90/120/180秒・無音検知終了・記録はフルと分離）、🎭アンテナのキャラ肌（ドット絵10体＋自分のイラスト2枚＝**端末内のみ**。旧設定値 `"miko"` は `"reimu"` へ自動移行）。
  - **PR #14**：🛠 UI操作不能の復旧（`main.js` が凍結済みの `window.TrkFX` を上書きして strict-mode の `TypeError` を起こし、以降の初期化が止まっていた。FX APIは変更せず、UIイベント委譲でスタンプを検知するよう修正）、🖥 動画を全画面で表示（`js/video-max.js`）、🌀 レーンの揺れ（既定は 🚚TRUCK と 🪐ORBIT のみ＋❓謎設定で全モード揺れ）、✨ フレーム補完（既定オフ・自前MEMC・`js/frame-interp.js`）。
  - **PR #16／#17（書斎・MMD）**：`arena/872022dd-trk` で開発し `main` へマージ。PR #17 は本棚の並べ替え・検索、栞一覧、本文検索、拡大／見開き、文字組み、TVペインの見た目、取り込みの進捗・中止・入れ子設定、❓キーの説明、孤立ページの掃除（詳細は §2）に加えて、**MMDモーションの改修**＝🎤 歌・口パクの6種と第6グループ、既定を `faceSing` へ、🚶／🏃の前後振りと足ＩＫの足踏み、エアギターの一旦削除（詳細は §6）を追加。
  - **PR #18（`arena/ba7b73c1-trk`・2026-10-06・16コミット）**：7つのまとまった仕事が入った。順に、①🎛 曲名バナーの曲操作を右端の `[◀][🎲][▶]` に集約（🎲は既定で長押し・設定で🎲オフ／タップだけ）／②🪶 軽量化（設定の右下・自動判定・プリセット4種＝**🎯 ゲーム優先はノーツと反応を下げない**・フレームレート上限・マスコット描画レート・描画解像度・スペクトラム／ぼかしの節約）／③🎮 キーコンフィング（ゲームパッド・音ゲーム用コントローラー・TVリモコン。ボタン／軸の直接割り当て・メニュー移動・プリセット `arcade`／`remote`）／④🔥 TRKアンプ と ⑤✨ TRKエフェクト を左下の独立カテゴリーに（どちらも**初期は開**・触って閉じた人の `false` は尊重）／⑥🛡 **セキュリティ点検（5回）**＝共有ファイル、書斎（ルビの ReDoS を線形走査に修正）、CDN（→ 自前ホスティング）、セーフモード（SWキャッシュの穴を修正）、🎬 大きい動画の扱い（`ANALYZE_MAX` と最初のフレーム判定）。記録は `docs/SECURITY.md`（F-1〜F-21）と `docs/SECURITY-CHECKLIST.md`／⑦🌐 **CDN をやめて `assets/vendor/` に同梱**（98ファイル・3.60MB・SHA-384 ロック・`npm run vendor:update`）＋🔐 **守りの追加**（`?reset=all` の確認・アドオンの同意記録）＋♿ **堅牢性／読みやすさの点検**（`tools/check-a11y.mjs`・`docs/QUALITY-CHECKS.md`）。**詳細は §2 の「点検・守りの現在地」と各節、利用者向けは `README.md`。**
  - **PR #19（2026-10-06・squash merge）**：セキュリティ追補 F-22〜F-29 と回帰検査・関連文書の更新。詳細と互換性の注意は §2 および `docs/SECURITY.md`。
- 以前の統合元ブランチ：`arena/01a109eb-trk`（Part 1–17・コミット35+・`main` へマージ済み）、`arena/01a10c69-trk`（PR #14）。
- 公開URL：<https://tonbokiriraikirimuramasa-taikoubou.github.io/trk/>

### 維持する方針

- Web Audio合成を基本とし、ユーザーのサンプル音源は端末内・セッション中だけ扱う。保存・送信を前提にしない。
- キャストは自動接続しない。ユーザー操作でだけ選択画面を開く。
- MMDモデル・モーションは原則持ち込み。`assets/mmd/lat-miku/` は再配布条件と原文ReadMeを同梱した例外で、権利説明を変更しない。
- 東方Projectのキャラ肌は二次創作ドット絵（公式素材不使用）。`NOTICE.md` 2b節のクレジットとTouhou-freeビルド手順を維持する。
- `sw.js` のキャッシュ名を公開更新ごとに変更する（現在は §2 の値）。
- 変更後は `README.md`・`NOTICE.md`・本書を必要に応じて同期する。

## 10. 次回以降の検討事項（ユーザー提案・未着手）

- **称号システム**：チュートリアル突破などの実績で、ユーザー名の affix／suffix（称号）を設定できるようにしたい（運用の参考：Limbus Company のプロフィールカスタマイズ）。
- **trk! スピードチャレンジ**：「もう一度」から10秒以内に `trk!` を入力したら特別な何かを（称号システムと組み合わせる想定）。
- **TVスキン・fxドックへの連想ゲーム系スキン**（前々回からの持ち越し）。
- **♿ 読みやすさの残り**（`docs/QUALITY-CHECKS.md` §3 に理由つき）：左の列の見出しを `h3` → `h2` に上げる（スキンの見た目の確認が要る）、`<main>` ランドマーク、実ブラウザでの**色のコントラスト**確認、`aria-label` の英語（`Zoom`／`Seek` など）の日本語化。**JS が作るボタンの `type="button"`**（97か所。いま `<form>` が無いので実害ゼロだが、フォームを足すときは要対応）。
- **CSP は「基本は入れない」方針**（ユーザー判断・2026-10-06）。入れるのは**安定版としてリリースするときだけ**で、そのときは inline の import map の外部化＋ハッシュ＋`media-src blob:` を実機テスト付きで（`docs/SECURITY.md` §6-1）。アドオンの間接 `eval` は `script-src 'self'` で止まり、`'unsafe-eval'` はXSS防御を弱めるため、アドオンをどう扱うか先に決める。第三者オリジンがゼロになったので設定自体は簡単になっている。
- **配布物まわり**：GitHub Actions の SHA 固定、`mobile-web/` から開発用文書（`docs/HANDOFF.md` など）を除外、配信側のヘッダ（`frame-ancestors` など）。

---

長い機能別の開発履歴は重複を避けるため本書から外した。過去の実装は `git log`、利用者向け仕様は `README.md` と `docs/`、権利情報は `NOTICE.md` を参照する。
