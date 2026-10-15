# 🎧 万能プレイヤーへの道（PLAYER-ROADMAP）

> **作成：2026-10-15（trk163時点の調査）**。「安定版の万能プレイヤー」を名乗るために足りない機能を、Web調査（音楽・動画・オーディオブック・PWA OS連携・コミックリーダー・ライブラリ整理の定番機能8検索）とローカル実装監査で洗い出した台帳です。**実装したら状態を更新する**こと（§8の運用ルール）。
>
> 調査のきっかけと経緯は `docs/HANDOFF.md` §7（trk163以降）を参照。

## 1. すでに持っているもの（調査で確認済み・追加不要）

- **OS/ブラウザ連携**：Media Session API（ロック画面・通知・メディアキー）、バックグラウンド再生（アンテナ）、キャスト（Remote Playback API）
- **再生の基本**：キュー＋検索、シャッフル／リピート（なし・1曲・全曲）、速度変更、±10秒スキップ、音量・ミュート、再生位置の記憶（`trk_media_positions_v1`）
- **音質**：5バンドEQ＋FXラック全体（TRKアンプ）、左右バランス（StereoPanner）、MIDI音色プロフィール24種、MIDI MIX
- **見た目の楽しさ**：スペクトラムビジュアライザ、フレーム補間、壁紙／スクリーンセーバー
- **他プレイヤーに無い強み**：A-Bループ＋ループ・ラボ（保存・ランダム区間）、逆再生、区間の映像クリップ書き出し、MIDI合成、 rhythm game 連携そのもの
- **形式**：mp3/m4a/m4b/aac/flac/ogg/oga/opus/wav/webm ＋ mid/midi（合成）、動画 mp4/m4v/mov/webm/mkv/avi/ogv/3gp（実際の再生はブラウザのコーデック依存）
- **書斎（コミックリーダー）**：見開き（右綴じ）／縦読み（webtoon）／1枚表示、しおり・読書位置、全画面フィット、拡大縮小・ページ送りキー、サムネイル一覧、埋め込みジャケット読取（ID3 APIC／MP4 covr／FLAC picture／Ogg）
- **スリープタイマー**：15/30/60分（→ trk164 で強化予定：下表#2）

## 2. 実装リスト（優先度順）

状態：`[ ]` 未着手・`[~]` 進行中・`[x]` 完了（trk番号を添える）・`[-]` 見送り

| # | 機能 | 優先 | コスト | 状態 | 実装メモ（既存インフラへの接続点） |
|---|---|---|---|---|---|
| 1 | **Picture-in-Picture**（動画の小窓再生） | 🥇 | 極小 | [x] trk164 | 実装済み：コントロール列（全画面の右）に📌ボタン。`document.pictureInPictureEnabled`＋`requestPictureInPicture` 実在チェック、非対応では無効＋タイトルで案内。enter/leaveイベント追従、closeMediaで浮き窓も終える。`documentPictureInPicture` は追っていない（通常PiPで十分） |
| 2 | **Wake Lock**（動画再生中の画面消灯防止） | 🥇 | 極小 | [x] trk164 | 実装済み：`navigator.wakeLock.request("screen")`。**動画の再生中だけ**取得（`hasVideoFrames()`・再生中・タブが表・設定オン）。renderMedia 250ms周期＋visibilitychange復帰で監視、releaseイベント追従、closeMediaで即解放。設定「🔆 画面を消灯させない」は 🎬動画キー／壁紙パネルの隣（既定オン）。音声だけは消灯を妨げない |
| 3 | **スマート巻き戻し**（再開時に数秒戻る） | 🥇 | 小 | [x] trk164 | 実装済み：`mediaResumeRewind`（0/3/5/10/15/30秒、既定オフ）。「続きから再生」の入口（openMedia・playSong）だけ `savedMediaPosition({resume:true})` でN秒戻す。一時停止からの再開では戻さない。openMediaのシークは停止中／終了後のみ（再生中の飛び防止） |
| 4 | **スリープタイマー強化**（フェードアウト＋「今の曲の終わりまで」） | 🥇 | 小 | [x] trk164 | 実装済み：off/15/30/60に「💤 この曲の終わり」を追加（endedMediaでリピート／シャッフルより優先し、続き位置を消して停止。手動選曲で解除）。分数モードは停止15秒前からフェードアウト（逆再生中は音量に触れない。停止・解除時は設定音量へ戻す） |
| 5 | **share_target / file_handlers**（OSの共有シート・「このアプリで開く」からCBZ/曲/パックを受け取る） | 🥈 | 中〜低 | [x] trk165 | 実装済み（Web側）：manifest 宣言＋`sw.js` の `handleShareTarget`（POST→CacheStorage `trk-share-inbox-v1` に一時保存→303でアプリへ。activate の掃除から除外）＋`launchQueue`（file_handlers・デスクトップ、single-client）。`js/share-inbox.js` が**既存の検証経路だけ**へ合流（曲→addSongFiles／動画→addVideoFiles／CBZ・ZIP→study.importArchives／.stpack・pack.json入りZIP→custom.installAndUse）＝新しい入口は作っていない。受け取れない形式は4言語で案内。**残るは実機確認（インストール済みPWA前提・HANDOFF §4-17）と、iOS で必要になった場合の Capacitor ビルド側対応（先行事例：quire#143）** |
| 6 | **歌詞表示**（ID3埋め込み歌詞＋`.lrc` 同期歌詞） | 🥈 | 低〜中 | [ ] | `audio-art.js` のタグパーサを USLT/SYLT（ID3）・`©lyr`（MP4）・Vorbis `LYRICS` へ拡張。LRCパーサ（[mm:ss.xx]行）＋再生位置同期スクロール表示。歌詞ファイルは同じフォルダの同名 `.lrc`（フォルダ共有経由）または手動選択 |
| 7 | **埋め込みテキストタグの表示**（ID3 TIT2/TPE1/TALB/TRCK 等）→ アーティスト／アルバム视图の土台 | 🥈 | 中 | [ ] | 同じく `audio-art.js` 拡張（読み取りだけ・**タグ編集はしない**＝読み取り専用方針）。表示名の優先順「ユーザー設定名→**タグ**→カタログ曲名→元ファイル名」への挿入は `TITLE-MATCH.md` の方針更新とセットで。アルバム別/アーティスト別のグルーピング表示・トラック番号順は次段 |
| 8 | **ReplayGain／音量正規化** | 🥉 | 中 | [ ] | 既存の `analyzeAudio`＋`trk_analysis_cache_v1`（解析キャッシュ）に loudness 項目を足し、TRKアンプの gain ノードで適用。ファイルへのタグ書き込みはしない（読み取り専用方針）＝端末内計算のみ |
| 9 | **字幕（SRT/VTT）** | 🥉 | 中 | [ ] | `<track>`＋WebVTT はブラウザネイティブ。SRT→VTT 変換は自前数十行。外部字幕ファイルの読み込み（フォルダ共有に相乗り or 手動選択）＋遅延調整。埋め込み字幕トラックはブラウザ制約で読めない場合がある（Safari系限定の textTracks）＝外部ファイル優先 |
| 10 | **M4Bチャプター**（一覧・ジャンプ） | 🥉 | 中〜高 | [ ] | HTMLMediaElement はチャプターを露出しないので MP4 の `chpl`/`©chm` ボックスを自前パース。`audio-art.js` の MP4 ボックス解析が足場になる。チャプター境界はスリープタイマー「曲の終わりまで」とも接続 |
| 11 | スマートプレイリスト的なもの（「最近追加」「よく再生」） | 🥉 | 中 | [ ] | `shadow_taiko_played_v1`（プレイ履歴）と favs で材料はそろう。#7のタグ表示の後が自然 |
| 12 | 書斎：自動スクロール（ハンズフリー縦読み） | 🥉 | 小〜中 | [ ] | 縦読みモードに等速スクロール＋速度設定。タップ/キーで停止 |
| 13 | 書斎：明るさ/コントラスト調整（読書用フィルタ） | 🥉 | 小 | [ ] | CSS filter（brightness/contrast/invert系）を設定に。既存の全画面フィット・拡大率とは独立 |
| 14 | 波形シークバー／ホバーサムネイル | 🥉 | 中 | [ ] | 解析キャッシュの rms データをそのまま描画に使える |
| 15 | 進捗フィルター（未聴/継続/完了） | 🥉 | 小 | [ ] | 位置記憶＋duration で算出。表示層だけ |

## 3. 安定版の後へ見送り（記録だけ）

| 機能 | 理由 |
|---|---|
| **ギャップレス再生＋クロスフェード** | Web Audio のスケジュール再生が必要で、iOS に癖（バックグラウンド・レイテンシ）がある。PWA 先行事例でも「今後の改善」扱い。**安定版（今回のプレイヤー一式）が完成した後に追加開発する**（2026-10-15 空さんの判断）。クロスフェードはギャップレスと同じ基盤で相乗り可能なので同時に |

## 4. 意図的に非対応（範囲外宣言の候補）

trk! の方針（外部通信ゼロ・完全オフライン・元ファイル読み取り専用・Webアプリ）と衝突するか、Webでは原理的に不可能なもの。**「足りない」ではなく「やらない」**として README 等に明記する候補（文言の最終判断は空さん）：

| 非対応 | 理由 |
|---|---|
| CBR/RAR（書斎） | RAR は専有形式。ブラウザ内解凍は現実的でなく、外部バイナリ依存は配布方針に反する |
| PDF/EPUB（書斎） | 別プロダクト級の追加（pdf.js 等の vendor 同梱と検証網が必要）。テキスト（.txt/.md 等）は既存の書斎が担当 |
| Scrobbling（Last.fm/ListenBrainz） | 外部通信ゼロ方針（SECURITY.md §1）と両立しない |
| クラウド/NAS/UPnP/DLNA/ネットラジオ | 同上。端末内のファイルだけを読む |
| タグ編集 | 「元ファイルは読み取り専用」原則（HANDOFF §3）。表示のための読み取り（#7）は行う |
| Android Auto / CarPlay | Web アプリからは到達できない（Capacitor ビルドでもネイティブ実装が別途必要） |
| ビットパーフェクト／排他出力・DSD/APE 等の特殊形式 | ブラウザの音声経路・コーデック制約。FLAC/Opus/AAC/WAV までが現実的な対応範囲 |

## 5. 調査の出典（2026-10-15）

- 音楽プレイヤー定番（ギャップレス・ReplayGain・EQ・歌詞・クロスフェード・スリープタイマー等）：Pulsar（Google Play）、Navidrome系クライアント一覧、iPhone向け15選（VOX/Cs Music/foobar2000/jetAudio）、HowToGeek オフライン4選、MP3プレイヤー5選（AIMP/foobar2000/jetAudio/MediaMonkey）
- 日本語圏（Musicolet/Poweramp/Pulsar）：アプリブ Musicolet紹介、dvdfab「Android音楽プレーヤーおすすめ7選 2026」、androidguias 12選、octoba Poweramp レビュー
- 動画プレイヤー（字幕・チャプター・PiP）：free-codecs「Best Player for Subtitles 2026」、mpv.rocks 比較、VLC Complete Guide、mpv vs VLC 2026
- PWA/Web（Media Session・PiP・Wake Lock・file handling）：developer.chrome.com File Handling API / Web Share Target、androxus Android背景再生ガイド、player.html（単一ファイルWebプレイヤー）、web.dev PWAオフラインストリーミング、Music-PWA（iOS制約の記録）、quire#143（file_handlers＋share_target の先行実装例）
- オーディオブック（チャプター・スマート巻き戻し・フェード）：audiobook-converter 比較表、Voice Audiobook Player（Google Play）、Audiobook Player（Google Play）、Audely ガイド、epubor 7選
- コミックリーダー（RTL/webtoon/自動スクロール/輝度調整）：Unstore デスクトップ7選、ComicX（Google Play）、Icecream CBZガイド、thedroidguy Android 9選
- ライブラリ整理（アーティスト/アルバム/ジャンル・スマートPL・検索）：Musiqly 整理ガイド、Volumio ライブラリマネージャ7選、zic（GitHub）、Albums（App Store）

## 8. 運用ルール

- 実装が完了したら §2 の状態を `[x]`＋trk番号に更新し、`docs/HANDOFF.md` §7 にも通常どおり記録する。
- 新しい定番機能の期待値が見つかったら §2 に行を足す（優先度は空さんの判断）。
- 見送り・非対応を動かすときは §3/§4 の理由欄に判断日と判断者を残す。
- この台帳は「調査の結論」であり、実装の仕様書ではない。実装時の詳細は各ファイルのコメントと HANDOFF を正とする。
