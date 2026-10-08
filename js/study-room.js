(() => {
// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 📚 書斎：端末内の画像・文章リーダー ============
   ・取り込んだ本・栞・ジャケットは、この端末の中（IndexedDB trk_study_room_v1）だけに置きます。
   ・外部への送信はありません（fetch/XHR を使いません）。取り込んだ文章を HTML として解釈しません。
   ・?safe=1 では開かず、保存領域にも触りません。 */
"use strict";

/* 文言はこの機能内で4言語そろえる（tools/check-study-room.mjs が4言語の抜けを検査します）。 */
Object.assign(TEXT.ja, {
  studyTitle:"📚 書斎", studyLaunchHint:"♫を長押しして書斎を開く（キーボードではEnter）",
  studyClose:"✕ 書斎を閉じる", studyImportImages:"🖼 画像フォルダを取り込む",
  studyImportTextFiles:"＋ テキストを追加", studyImportTextFolder:"📄 テキストフォルダを取り込む",
  studyShelf:"本棚", studySearch:"タイトル・フォルダを検索…", studyShelfEmpty:"本棚は空です。画像フォルダか TXT / MD / JSON を取り込んでください。",
  studyWelcomeTitle:"読みたいものを選ぶ", studyWelcomeHint:"画像はフォルダ単位、テキストはファイルごとにこの端末内へ保存します。外へアップロードしません。",
  studyWelcomeHelp:"操作が分からなくなったら、右上の「❓ キーの説明」を開いてください。",
  studySupported:"画像: JPG / PNG / WebP / GIF / AVIF / BMP · 文章: TXT / MD / JSON / CSV / HTML / XML など",
  studyTapHint:"画像の左側タップ／→で次へ · 右側タップ／←で前へ（🇺🇸ではタップ位置を反転） · Space / Enterで次へ · Enter長押しで栞 · Space長押しでページ移動 · Escで終了",
  studyVerticalHint:"縦にスクロール／フリックして読み進める · Space / Enterで次へ · Enter長押しで栞 · Escで終了",
  studyBack:"← 本棚", studyFullscreen:"⛶ 画像を全画面化", studyModeLabel:"画像の並べ方",
  studyModeSingle:"一枚ずつ（中央）", studyModeSpread:"見開き（右が1ページ目）", studyModeVertical:"縦読み漫画",
  studyAmerican:"🇺🇸 アメリカン（左右・順序反転）", studyThemeLabel:"文字のスキン",
  studyThemePlain:"普通のテキスト", studyThemeDark:"ダークモード", studyThemeNeon:"ネオン",
  studyThemeLined:"ルーズリーフ", studyThemeGenko:"作文用紙（縦書き・右から）",
  studyThemeGroupWriter:"✍ 文筆・読書", studyThemeGroupCode:"⌨ コーディング",
  studyThemeGroupAi:"◈ AI・プロンプト風（見た目のみ）", studyThemeGroupFree:"✦ 自由な発想",
  studyThemePaper:"和紙", studyThemeWarm:"クリーム", studyThemeSepia:"古書",
  studyThemeMidnight:"ミッドナイト", studyThemeTerminal:"ターミナル", studyThemeGraphite:"グラファイト",
  studyThemeBlueprint:"設計図", studyThemeContrast:"高コントラスト",
  studyThemePrompt:"プロンプト・ラボ", studyThemeNeural:"ニューラル", studyThemeLatent:"潜在空間",
  studyThemeMatrix:"トークン・マトリクス", studyThemeSynth:"シンセシス",
  studyThemeAurora:"オーロラ", studyThemeSunset:"サンセット", studyThemeOcean:"深海",
  studyThemeMint:"ミント", studyThemeDream:"ドリーム", studyThemePrism:"プリズム",
  studyTvToggle:"TVを流し見する", studyTvPosLabel:"TVの位置", studyTvTop:"上", studyTvBottom:"下", studyTvHidden:"表示しない",
  studyTvEmpty:"動画または曲のジャケットがここに表示されます。", studyTvCaption:"今の曲・動画を表示します。別の音声を重ねて再生しません。",
  studyTvHint:"（画像を長押しすると、この曲のジャケットにできます）",
  studyBookmark:"🔖 栞を挟む", studyBookmarkSaved:"🔖 栞を更新しました。", studyBookmarkError:"栞を保存できませんでした。",
  studyAdvanced:"⚙ 上級者向け", studyMemoEdit:"✎ コピーを編集", studyMemoDone:"閲覧に戻る", studyExportText:"⇩ テキストコピーを書き出す",
  studyMemoSaved:"書斎内のコピーを保存しました。", studyMemoSaveError:"書斎内コピーを保存できませんでした。",
  studyEditorLabel:"テキスト編集", studyEditorSafety:"書斎内のコピーを編集します。元ファイルは変更せず、JS / HTMLは実行せず、Markdownも装飾表示しません。Tabで字下げ、Ctrl / ⌘+Sで保存、Escで閲覧に戻ります。",
  studyEditorUnsaved:"未保存の変更（自動保存します）", studyEditorSaving:"保存中…", studyEditorSaved:"書斎に保存済み",
  studyEditorSaveFailed:"保存に失敗しました。編集画面を閉じる前に、テキストコピーを書き出してください。",
  studyEditedTextFolderLabel:"編集した文章の本棚フォルダ", studyEditedTextFolderKeep:"自動で移動しない（今の場所）",
  studyEditedTextFolderHint:"選ぶと、編集内容を保存した本をこのフォルダへ整理します。本文は端末内の書斎に保存し、元ファイルは変更しません。",
  studyTextFiledInFolder:"編集した本を「{folder}」に整理しました。", studyEditedTextFolderSaveFailed:"本文は保存しましたが、本棚のフォルダを更新できませんでした。",
  studyExportFolderLabel:"書き出し先（端末）", studyChooseExportFolder:"書き出しフォルダを選ぶ", studyClearExportFolder:"解除",
  studyExportFolderNone:"未選択（ブラウザの通常ダウンロード先）", studyExportFolderSelected:"選択中：{name}（この起動中のみ）",
  studyExportFolderHint:"選んだフォルダに新しいファイルを作成します。同名があれば別名にし、既存ファイルは上書きしません。未対応ブラウザでは通常のダウンロードを使います。",
  studyExportSavedToFolder:"「{folder}」へ「{name}」を書き出しました。", studyExportFolderSelectError:"書き出しフォルダを選べませんでした。",
  studyExportFolderFallback:"選んだフォルダへ保存できなかったため、通常のダウンロードを開始しました。",
  studyNext:"◀ 次へ", studyNextRight:"次へ ▶", studyPrevious:"前へ ▶", studyPreviousLeft:"◀ 前へ",
  studyNextRightOnly:"次へ ▶", studyPreviousLeftOnly:"◀ 前へ", studyProgressDone:"完了",
  studyAssignCover:"🖼 このページを曲のジャケットに", studyCoverAssigned:"「{title}」のジャケットに設定しました。",
  studyCoverNeedSong:"曲を選んでから設定できます。", studyCoverNeedImage:"画像ページを開いてください。",
  studyCoverError:"ジャケットを保存できませんでした。", studyDelete:"削除", studyRename:"名前を変更", studyOpen:"開く",
  studyBookImages:"画像アルバム", studyBookText:"テキスト", studyPageCount:"{n}枚", studyPagesStatus:"{current} / {total}",
  studyPageRange:"{first}–{last} / {total}", studyPageLabel:"ページ", studyTextProgress:"{n}%",
  studyRenamePrompt:"新しい名前", studyRenamed:"名前を変更しました。", studyDeleteConfirm:"「{title}」を本棚から削除しますか？",
  studyDeleted:"本棚から削除しました。", studyReplace:"「{title}」は本棚にあります。置き換えますか？",
  studyImportProgress:"取り込み中… {n} / {total}", studyImportDone:"{n}件を本棚に追加しました。",
  studyNoImageFiles:"選択したフォルダに対応画像がありません。", studyNoTextFiles:"対応するテキストファイルがありません。",
  studyNoSearchResults:"一致する本がありません。", studyTextBatchLimit:"一度に取り込めるテキストは最大200ファイルです。", studyShelfLimit:"本棚は最大500冊です。",
  studyTooMany:"画像アルバムは最大{max}枚・合計{mb}MBまでです。", studyFileTooBig:"「{name}」は大きすぎます（1ファイル最大{mb}MB）。",
  studyTextTooBig:"「{name}」は大きすぎます（1ファイル最大{mb}MB）。", studyDecodeError:"「{name}」を文字として読み込めませんでした。",
  studyStorageError:"ブラウザ内への保存に失敗しました。空き容量を確認してください。",
  studyImageLoadError:"画像を読み込めませんでした。もう一度取り込んでください。",
  studySafeMode:"セーフモード中は、書斎の保存データを読み込みません。通常モードで開いてください。",
  studyProgressHint:"長押し中に開いたバーを動かすと、ページを移動できます。", studyBookmarked:"栞から再開しました。",
  studyMemoNeedText:"テキスト本でのみメモ帳を使えます。", studyFullscreenExit:"全画面を閉じる",
  studyHelp:"❓ キーの説明", studyHelpTitle:"書斎のキー操作", studyHelpClose:"閉じる",
  studyHelpNav:"→で次へ・←で前へ（上級者向け設定で変更可）。画像の左右タップは綴じ方向に従います。テキストはスクロールします。",
  studyHelpSpace:"次のページへ。長押しすると、画像=ページ移動バー、テキスト=栞を挟みます。",
  studyHelpPg:"前のページ／次のページ（Home / End で最初／最後へ）。",
  studyHelpZoom:"画像の拡大・縮小・フィット（縦読みでは使いません）。Ctrl+ホイールやピンチでも変えられます。",
  studyHelpSearch:"テキスト本の本文を検索（Enter=次の一致 / Shift+Enter=前の一致）。",
  studyHelpBookmark:"B=栞を挟む・外す、M=栞一覧の開閉。",
  studyHelpTv:"T=TVの表示切替（上→下→非表示）、F=画像の全画面表示。",
  studyHelpEsc:"?=この説明、Esc=説明を閉じる／書斎を閉じる。",
  studySortLabel:"並べ替え", studySortUpdated:"更新が新しい順", studySortAdded:"追加が古い順", studySortTitle:"名前順",
  studySortType:"種類別（画像→テキスト）", studySortSize:"大きい順", studyMore:"さらに{n}冊表示",
  studyFolderCreateHint:"クリックまたは長押しで新しいフォルダを作成", studyCreateFolderPrompt:"新しいフォルダ名を入力してください。",
  studyRenameFolderPrompt:"フォルダの新しい名前", studyFolderCreated:"フォルダを作成しました。", studyFolderDuplicate:"同じ名前のフォルダがあります。",
  studyFolderLimit:"フォルダは最大200個です。", studyFolderNameRequired:"フォルダ名を入力してください。", studyFolderCount:"{n}冊",
  studyFolderBack:"← 本棚へ戻る", studyFolderEmpty:"このフォルダは空です。本をここへドラッグできます。", studyFolderOpen:"フォルダを開く",
  studyFolderRename:"フォルダ名を変更", studyFolderDelete:"フォルダを削除（本は本棚に残す）",
  studyFolderDeleted:"フォルダを削除し、本を本棚へ戻しました。",
  studyShelfDragHint:"⋮⋮をドラッグして移動。自動並び替えを使わない設定で順番も変更できます。フォルダへドロップすると移動します。",
  studyKeepShelfVisible:"全画面表示でないときは本棚を表示する。", studyShelfVisibilityHint:"チェックを外すと本棚を隠します。右上の「本棚を表示」からいつでも戻せます。",
  studyShowShelf:"📚 本棚を表示", studyNextKeyLabel:"次へ", studyPreviousKeyLabel:"前へ", studyKeyChange:"変更", studyKeyPressKey:"キーを押す · Escでキャンセル",
  studyVerticalImageKeys:"画像ページを↑ / ↓で移動する", studyKeyAssignmentHint:"ボタンを押してから使いたいキーを押します。方向キー・英字・数字・PageUp / PageDown・Home / Endを設定でき、既存ショートカットは選べません。",
  studyKeyCaptureHint:"{action}に割り当てるキーを押してください。Escでキャンセル。", studyKeyAssigned:"{action}を「{key}」に設定しました。",
  studyKeyInvalid:"このキーは割り当てできません。別のキーを押してください。", studyKeyConflict:"次へと前へには別々のキーを割り当ててください。",
  studyKeyButtonLabel:"{action}のキーは{key}です。押して変更します。", studyKeyButtonCaptureLabel:"{action}キーを設定中です。キーを押してください。Escでキャンセルします。",
  studyDragHandle:"ドラッグして移動または並べ替え", studyShelfMoved:"本棚の配置を更新しました。",
  studyNoSort:"並び替えを使わない。", studyFoldersFirst:"フォルダを上に表示する。",
  studyNoDeleteConfirm:"削除の時、確認をしない。", studyManualOrderHint:"自動並び替えを止め、ドラッグでフォルダや本を自由に配置します。",
  studyStorageInfo:"{books}冊 · 画像{images}枚 · 書斎 {size}", studyStorageFree:"{books}冊 · 画像{images}枚 · 書斎 {size}（端末の空き 約{free}）",
  studyBookmarks:"🔖 栞一覧", studyBookmarkCount:"栞 {n}件",
  studyBookmarksEmpty:"栞を挟んだ本はありません。読みながら Enter 長押し（または🔖ボタン）で挟めます。",
  studyBookmarksHint:"栞は本ごとに1つ。押すとその位置から読み始めます。",
  studyBookmarkOpenAt:"{n}ページ目から開く", studyBookmarkOpenText:"先頭から約{n}%の位置から開く",
  studyBookmarkRemove:"栞を外す", studyBookmarkRemoved:"栞を外しました。",
  studyImportCancel:"中止", studyImportCancelled:"取り込みを中止しました。保存できた{n}冊はそのまま残ります。",
  studyImportAsk:"同じ名前の本が{count}冊あります。中身を置き換えますか？（「キャンセル」なら、新しい本だけを取り込みます）",
  studyImportSummary:"完了: {added}冊を追加 · {kept}冊はそのまま · {failed}件は失敗",
  studyQuotaError:"端末の空き容量が足りません。大きいアルバムや本を減らしてから、もう一度お試しください。",
  studyAlbumNestingLabel:"アルバムの分け方", studyAlbumNestingSplit:"サブフォルダごとに1冊", studyAlbumNestingFlat:"フォルダ全体で1冊",
  studyAlbumNestingHint:"次の取り込みから反映します。",
  studyClearCover:"🗑 ジャケットを外す", studyCoverCleared:"ジャケットを外しました。", studyCoverNeedCover:"この曲には、書斎のジャケットがまだありません。",
  studyCoverSource:"書斎のジャケット: {title}（{n}ページ目）", studyCoverHoldHint:"画像を長押しすると、この曲のジャケットにできます。",
  studyBookSearchPlaceholder:"本文を検索…", studyBookSearchCount:"{n} / {m}件", studyBookSearchNone:"見つかりません",
  studyBookSearchClear:"✕ 検索を終了", studyBookSearchPrev:"前の一致", studyBookSearchNext:"次の一致",
  studyBookSearchHint:"Enter=次の一致 · Shift+Enter=前の一致 · Esc=検索を終了",
  studyTextTuneLabel:"文字", studyTextSizeSmall:"小", studyTextSizeNormal:"普通", studyTextSizeLarge:"大", studyTextSizeHuge:"特大",
  studyTextSpacingTight:"詰める", studyTextSpacingNormal:"行間ふつう", studyTextSpacingLoose:"行間広め",
  studyTextWidthNarrow:"余白せまい", studyTextWidthNormal:"余白ふつう", studyTextWidthWide:"余白広い",
  studyTextTuneHint:"縦書き・ルーズリーフにも同じ設定が効きます。",
  studyZoomFit:"フィット", studyZoomValue:"{n}%", studyZoomHint:"Ctrl+ホイール・ピンチでも拡大できます。",
  studyTvLookLabel:"TVの見た目", studyTvLookPlain:"素の画面", studyTvLookCrt:"ブラウン管", studyTvLookWood:"木枠",
  studyTvLookArcade:"アーケード", studyTvLookProjector:"プロジェクター", studyTvLookAquarium:"水槽",
  studyTvSizeLabel:"大きさ", studyTvSizeSmall:"小", studyTvSizeMedium:"中", studyTvSizeLarge:"大",
  studyTvRatioLabel:"画面比", studyTvRatio169:"16:9", studyTvRatio43:"4:3", studyTvRatio219:"21:9", studyTvNameToggle:"曲名を表示",
  studyTextStats:"{chars}字 · {lines}行", studyImageOrderLabel:"ページの順序", studyImageOrderNatural:"ファイル名順",
  studyImageOrderReverse:"逆順（右綴じ向け）", studyOrphanSweep:"未使用の画像データを整理しました（{n}件）。"
});
Object.assign(TEXT.en, {
  studyTitle:"📚 Study", studyLaunchHint:"Hold ♫ Songs to open Study (press Enter when focused)",
  studyClose:"✕ Close Study", studyImportImages:"🖼 Import image folder", studyImportTextFiles:"＋ Add text files",
  studyImportTextFolder:"📄 Import text folder", studyShelf:"Bookshelf", studySearch:"Search titles and folders…",
  studyShelfEmpty:"Your shelf is empty. Import an image folder or TXT / MD / JSON files.",
  studyWelcomeTitle:"Choose something to read", studyWelcomeHint:"Images are saved by folder and text files individually on this device. Nothing is uploaded.",
  studyWelcomeHelp:"If you get lost, open “❓ Shortcuts” at the top right.",
  studySupported:"Images: JPG / PNG / WebP / GIF / AVIF / BMP · Text: TXT / MD / JSON / CSV / HTML / XML, and more",
  studyTapHint:"Tap left / → for next · tap right / ← for previous (🇺🇸 reverses tap sides) · Space / Enter for next · hold Enter for a bookmark · hold Space for page seek · Esc to exit",
  studyVerticalHint:"Scroll or swipe vertically to read · Space / Enter for next · hold Enter for a bookmark · Esc to exit",
  studyBack:"← Bookshelf", studyFullscreen:"⛶ Full-screen image", studyModeLabel:"Image layout",
  studyModeSingle:"Single page (centered)", studyModeSpread:"Two-page spread (page 1 on right)", studyModeVertical:"Vertical comic",
  studyAmerican:"🇺🇸 American mode (reverse sides and order)", studyThemeLabel:"Text skin",
  studyThemePlain:"Plain text", studyThemeDark:"Dark mode", studyThemeNeon:"Neon", studyThemeLined:"Loose-leaf paper",
  studyThemeGenko:"Manuscript paper (vertical, right to left)",
  studyThemeGroupWriter:"✍ Writing & reading", studyThemeGroupCode:"⌨ Coding",
  studyThemeGroupAi:"◈ AI / prompt aesthetics (visual only)", studyThemeGroupFree:"✦ Freeform",
  studyThemePaper:"Washi paper", studyThemeWarm:"Warm cream", studyThemeSepia:"Antique book",
  studyThemeMidnight:"Midnight", studyThemeTerminal:"Terminal green", studyThemeGraphite:"Graphite",
  studyThemeBlueprint:"Blueprint", studyThemeContrast:"High contrast", studyThemePrompt:"Prompt lab",
  studyThemeNeural:"Neural grid", studyThemeLatent:"Latent space", studyThemeMatrix:"Token matrix",
  studyThemeSynth:"Synthesis", studyThemeAurora:"Aurora", studyThemeSunset:"Sunset",
  studyThemeOcean:"Deep ocean", studyThemeMint:"Mint", studyThemeDream:"Dream", studyThemePrism:"Prism",
  studyTvToggle:"Watch TV while reading", studyTvPosLabel:"TV position",
  studyTvTop:"Top", studyTvBottom:"Bottom", studyTvHidden:"Hide TV", studyTvEmpty:"The current video or song cover appears here.",
  studyTvCaption:"Shows the current song or video without starting a second audio stream.",
  studyTvHint:"(hold an image to make it this song's cover)",
  studyBookmark:"🔖 Save bookmark", studyBookmarkSaved:"🔖 Bookmark saved.", studyBookmarkError:"Could not save the bookmark.",
  studyAdvanced:"⚙ Advanced", studyMemoEdit:"✎ Edit copy", studyMemoDone:"Finish editing", studyExportText:"⇩ Export text copy",
  studyMemoSaved:"Saved the Study copy.", studyMemoSaveError:"Could not save the Study copy.",
  studyEditorLabel:"Text editor", studyEditorSafety:"You are editing a local Study copy. The original is untouched; JS / HTML are never run and Markdown is not rendered. Tab indents · Ctrl / ⌘+S saves · Esc returns to reading.",
  studyEditorUnsaved:"Unsaved changes · auto-save pending", studyEditorSaving:"Saving…", studyEditorSaved:"Saved in Study",
  studyEditorSaveFailed:"Save failed. Export a text copy before leaving the editor.",
  studyEditedTextFolderLabel:"Bookshelf folder for edited text", studyEditedTextFolderKeep:"Keep the current location",
  studyEditedTextFolderHint:"When selected, successfully saved text books are organized in this bookshelf folder. Text stays in Study's local browser storage; the original file is unchanged.",
  studyTextFiledInFolder:"Filed the edited book in “{folder}”.", studyEditedTextFolderSaveFailed:"The text was saved, but its bookshelf folder could not be updated.",
  studyExportFolderLabel:"Export location on this device", studyChooseExportFolder:"Choose export folder", studyClearExportFolder:"Clear",
  studyExportFolderNone:"Not selected (browser downloads)", studyExportFolderSelected:"Selected: {name} (this session only)",
  studyExportFolderHint:"A new file is created in the chosen folder. If its name already exists, a different name is used; existing files are never overwritten. Unsupported browsers use a normal download instead.",
  studyExportSavedToFolder:"Exported “{name}” to “{folder}”.", studyExportFolderSelectError:"Could not select an export folder.",
  studyExportFolderFallback:"Could not save in the selected folder, so a normal download was started instead.",
  studyNext:"◀ Next", studyNextRight:"Next ▶", studyPrevious:"Previous ▶", studyPreviousLeft:"◀ Previous",
  studyNextRightOnly:"Next ▶", studyPreviousLeftOnly:"◀ Previous", studyProgressDone:"Done",
  studyAssignCover:"🖼 Set this page as song cover", studyCoverAssigned:"Set as the cover for “{title}”.",
  studyCoverNeedSong:"Select a song first.", studyCoverNeedImage:"Open an image page first.", studyCoverError:"Could not save the cover.",
  studyDelete:"Delete", studyRename:"Rename", studyOpen:"Open", studyBookImages:"Image album", studyBookText:"Text",
  studyPageCount:"{n} images", studyPagesStatus:"{current} / {total}", studyPageRange:"{first}–{last} / {total}", studyPageLabel:"Page",
  studyTextProgress:"{n}%", studyRenamePrompt:"New title", studyRenamed:"Renamed.",
  studyDeleteConfirm:"Remove “{title}” from this shelf?", studyDeleted:"Removed from the shelf.", studyReplace:"“{title}” is already on the shelf. Replace it?",
  studyImportProgress:"Importing… {n} / {total}", studyImportDone:"Added {n} item(s) to the shelf.",
  studyNoImageFiles:"No supported images were found in that folder.", studyNoTextFiles:"No supported text files were found.",
  studyNoSearchResults:"No matching books found.", studyTextBatchLimit:"You can import up to 200 text files at once.", studyShelfLimit:"The shelf is limited to 500 books.",
  studyTooMany:"An image album is limited to {max} images and {mb} MB total.", studyFileTooBig:"“{name}” is too large (maximum {mb} MB per file).",
  studyTextTooBig:"“{name}” is too large (maximum {mb} MB per file).", studyDecodeError:"Could not decode “{name}” as text.",
  studyStorageError:"Browser storage failed. Check available device storage.", studyImageLoadError:"Could not load this image. Please import it again.",
  studySafeMode:"Study data is not loaded in safe mode. Open the app normally to use Study.", studyProgressHint:"Move the seek bar to jump to a page.",
  studyBookmarked:"Resumed from bookmark.", studyMemoNeedText:"Notepad editing is available for text books only.", studyFullscreenExit:"Close full screen",
  studyHelp:"❓ Shortcuts", studyHelpTitle:"Study shortcuts", studyHelpClose:"Close",
  studyHelpNav:"→ goes forward and ← goes back (reassignable in Advanced settings). Tapping an image's left/right side follows the binding direction. Text scrolls instead.",
  studyHelpSpace:"Next page. Hold for the page seek bar (images) or to save a bookmark (text).",
  studyHelpPg:"Previous / next page (Home / End jump to the first / last page).",
  studyHelpZoom:"Zoom in, out, and fit for images (not used in vertical comic mode). Ctrl+wheel and pinch work too.",
  studyHelpSearch:"Search inside a text book (Enter = next match, Shift+Enter = previous match).",
  studyHelpBookmark:"B = add or remove a bookmark, M = toggle the bookmark list.",
  studyHelpTv:"T = cycle the TV (top → bottom → hidden), F = full-screen image.",
  studyHelpEsc:"? = this help, Esc = close the help / close Study.",
  studySortLabel:"Sort", studySortUpdated:"Recently updated", studySortAdded:"Oldest added first", studySortTitle:"Title",
  studySortType:"Type (images first)", studySortSize:"Largest first", studyMore:"Show {n} more",
  studyFolderCreateHint:"Click or hold to create a new folder", studyCreateFolderPrompt:"Enter a name for the new folder.",
  studyRenameFolderPrompt:"New folder name", studyFolderCreated:"Folder created.", studyFolderDuplicate:"A folder with that name already exists.",
  studyFolderLimit:"You can create up to 200 folders.", studyFolderNameRequired:"Enter a folder name.", studyFolderCount:"{n} books",
  studyFolderBack:"← Back to bookshelf", studyFolderEmpty:"This folder is empty. Drag books here to move them in.", studyFolderOpen:"Open folder",
  studyFolderRename:"Rename folder", studyFolderDelete:"Delete folder (keep its books)",
  studyFolderDeleted:"Folder deleted; its books were moved back to the bookshelf.",
  studyShelfDragHint:"Drag ⋮⋮ to move items. Turn off automatic sorting to reorder; drop an item on a folder to move it.",
  studyKeepShelfVisible:"Keep the bookshelf visible outside full screen.", studyShelfVisibilityHint:"Turn this off to hide the shelf. Use “Show bookshelf” in the header to bring it back at any time.",
  studyShowShelf:"📚 Show bookshelf", studyNextKeyLabel:"Next", studyPreviousKeyLabel:"Previous", studyKeyChange:"Change", studyKeyPressKey:"Press a key · Esc to cancel",
  studyVerticalImageKeys:"Use ↑ / ↓ to navigate image pages", studyKeyAssignmentHint:"Select a button, then press the key to use. Arrows, letters, digits, Page Up / Down, Home and End are supported; built-in shortcut keys cannot be assigned.",
  studyKeyCaptureHint:"Press the key to assign to {action}. Esc cancels.", studyKeyAssigned:"{action} key set to “{key}”.",
  studyKeyInvalid:"That key cannot be assigned. Press a different key.", studyKeyConflict:"Choose different keys for Next and Previous.",
  studyKeyButtonLabel:"The {action} key is {key}. Activate to change it.", studyKeyButtonCaptureLabel:"Assigning the {action} key. Press a key; Esc cancels.",
  studyDragHandle:"Drag to move or reorder", studyShelfMoved:"Bookshelf arrangement updated.",
  studyNoSort:"Disable automatic sorting (arrange manually).", studyFoldersFirst:"Show folders at the top.",
  studyNoDeleteConfirm:"Skip confirmation when deleting.", studyManualOrderHint:"Turn off automatic sorting, then drag folders and books into any order.",
  studyStorageInfo:"{books} books · {images} images · Study {size}", studyStorageFree:"{books} books · {images} images · Study {size} (about {free} free)",
  studyBookmarks:"🔖 Bookmarks", studyBookmarkCount:"{n} bookmarks",
  studyBookmarksEmpty:"No bookmarks yet. While reading, hold Enter (or press the 🔖 button) to add one.",
  studyBookmarksHint:"One bookmark per book; press it to continue from there.",
  studyBookmarkOpenAt:"Open at page {n}", studyBookmarkOpenText:"Open about {n}% from the top",
  studyBookmarkRemove:"Remove bookmark", studyBookmarkRemoved:"Bookmark removed.",
  studyImportCancel:"Cancel", studyImportCancelled:"Import cancelled. The {n} book(s) already saved are kept.",
  studyImportAsk:"{count} book(s) with the same name are already on the shelf. Replace their contents? (Choose Cancel to import only the new books.)",
  studyImportSummary:"Done: {added} added · {kept} kept · {failed} failed",
  studyQuotaError:"Not enough free space on this device. Remove some large albums or books and try again.",
  studyAlbumNestingLabel:"Album splitting", studyAlbumNestingSplit:"One book per subfolder", studyAlbumNestingFlat:"One book for the whole folder",
  studyAlbumNestingHint:"Applies from the next import.",
  studyClearCover:"🗑 Remove cover", studyCoverCleared:"Cover removed.", studyCoverNeedCover:"This song has no Study cover yet.",
  studyCoverSource:"Study cover: {title} (page {n})", studyCoverHoldHint:"Hold an image to make it this song's cover.",
  studyBookSearchPlaceholder:"Search in this book…", studyBookSearchCount:"{n} / {m}", studyBookSearchNone:"No matches",
  studyBookSearchClear:"✕ End search", studyBookSearchPrev:"Previous match", studyBookSearchNext:"Next match",
  studyBookSearchHint:"Enter = next match · Shift+Enter = previous match · Esc = end search",
  studyTextTuneLabel:"Text", studyTextSizeSmall:"S", studyTextSizeNormal:"M", studyTextSizeLarge:"L", studyTextSizeHuge:"XL",
  studyTextSpacingTight:"Tight", studyTextSpacingNormal:"Normal", studyTextSpacingLoose:"Loose",
  studyTextWidthNarrow:"Narrow", studyTextWidthNormal:"Normal", studyTextWidthWide:"Wide",
  studyTextTuneHint:"These also apply to manuscript paper and loose-leaf.",
  studyZoomFit:"Fit", studyZoomValue:"{n}%", studyZoomHint:"Ctrl+wheel and pinch also zoom.",
  studyTvLookLabel:"TV look", studyTvLookPlain:"Plain screen", studyTvLookCrt:"CRT", studyTvLookWood:"Wood frame",
  studyTvLookArcade:"Arcade", studyTvLookProjector:"Projector", studyTvLookAquarium:"Aquarium",
  studyTvSizeLabel:"Size", studyTvSizeSmall:"S", studyTvSizeMedium:"M", studyTvSizeLarge:"L",
  studyTvRatioLabel:"Aspect", studyTvRatio169:"16:9", studyTvRatio43:"4:3", studyTvRatio219:"21:9", studyTvNameToggle:"Show song title",
  studyTextStats:"{chars} chars · {lines} lines", studyImageOrderLabel:"Page order", studyImageOrderNatural:"File name order",
  studyImageOrderReverse:"Reversed (right-binding)", studyOrphanSweep:"Cleaned up {n} unused image(s)."
});
Object.assign(TEXT.zh, {
  studyTitle:"📚 书斋", studyLaunchHint:"长按♫歌曲列表打开书斋（键盘聚焦后按 Enter）",
  studyClose:"✕ 关闭书斋", studyImportImages:"🖼 导入图片文件夹", studyImportTextFiles:"＋ 添加文本文件",
  studyImportTextFolder:"📄 导入文本文件夹", studyShelf:"书架", studySearch:"搜索标题或文件夹…",
  studyShelfEmpty:"书架为空。请导入图片文件夹或 TXT / MD / JSON。",
  studyWelcomeTitle:"选择要阅读的内容", studyWelcomeHint:"图片按文件夹、文本按文件分别保存在本设备中，不会上传。",
  studyWelcomeHelp:"如果忘记操作，请打开右上角的「❓ 按键说明」。",
  studySupported:"图片: JPG / PNG / WebP / GIF / AVIF / BMP · 文本: TXT / MD / JSON / CSV / HTML / XML 等",
  studyTapHint:"点击图片左侧／→ 下一页 · 点击右侧／← 上一页（🇺🇸模式会反转点击位置） · Space / Enter 下一页 · 长按 Enter 添加书签 · 长按 Space 跳页 · Esc 退出",
  studyVerticalHint:"上下滚动或滑动阅读 · Space / Enter 下一页 · 长按 Enter 书签 · Esc 退出",
  studyBack:"← 书架", studyFullscreen:"⛶ 图片全屏", studyModeLabel:"图片排列方式", studyModeSingle:"单页（居中）",
  studyModeSpread:"双页（第一页在右）", studyModeVertical:"纵向漫画", studyAmerican:"🇺🇸 美式模式（左右与顺序反转）",
  studyThemeLabel:"文字主题", studyThemePlain:"普通文本", studyThemeDark:"深色模式", studyThemeNeon:"霓虹",
  studyThemeLined:"活页纸", studyThemeGenko:"作文纸（竖排，从右向左）",
  studyThemeGroupWriter:"✍ 写作与阅读", studyThemeGroupCode:"⌨ 编程",
  studyThemeGroupAi:"◈ AI／提示词风格（仅外观）", studyThemeGroupFree:"✦ 自由创作",
  studyThemePaper:"和纸", studyThemeWarm:"暖奶油纸", studyThemeSepia:"古籍", studyThemeMidnight:"午夜",
  studyThemeTerminal:"终端绿", studyThemeGraphite:"石墨灰", studyThemeBlueprint:"蓝图", studyThemeContrast:"高对比",
  studyThemePrompt:"提示词实验室", studyThemeNeural:"神经网络网格", studyThemeLatent:"潜空间",
  studyThemeMatrix:"Token矩阵", studyThemeSynth:"合成", studyThemeAurora:"极光", studyThemeSunset:"日落",
  studyThemeOcean:"深海", studyThemeMint:"薄荷", studyThemeDream:"梦境", studyThemePrism:"棱镜",
  studyTvToggle:"边阅读边看电视", studyTvPosLabel:"电视位置",
  studyTvTop:"上方", studyTvBottom:"下方", studyTvHidden:"不显示", studyTvEmpty:"此处显示当前视频或歌曲封面。",
  studyTvCaption:"显示当前歌曲或视频，不会另外启动一条音频流。", studyTvHint:"（长按图片可设为这首歌的封面）",
  studyBookmark:"🔖 添加书签", studyBookmarkSaved:"🔖 已保存书签。", studyBookmarkError:"无法保存书签。",
  studyAdvanced:"⚙ 高级选项", studyMemoEdit:"✎ 编辑副本", studyMemoDone:"结束编辑", studyExportText:"⇩ 导出文本副本",
  studyMemoSaved:"已保存书斋副本。", studyMemoSaveError:"无法保存书斋副本。",
  studyEditorLabel:"文本编辑器", studyEditorSafety:"正在编辑书斋中的本地副本。原文件不会更改；JS / HTML绝不执行，Markdown也不会渲染成格式化内容。Tab缩进 · Ctrl / ⌘+S保存 · Esc返回阅读。",
  studyEditorUnsaved:"有未保存的更改 · 即将自动保存", studyEditorSaving:"正在保存…", studyEditorSaved:"已保存到书斋",
  studyEditorSaveFailed:"保存失败。离开编辑器前，请先导出文本副本。",
  studyEditedTextFolderLabel:"已编辑文本的书架文件夹", studyEditedTextFolderKeep:"不自动移动（保留当前位置）",
  studyEditedTextFolderHint:"选择后，成功保存的文本书籍会整理到此书架文件夹。正文保存在书斋的本地浏览器存储中，原文件不会更改。",
  studyTextFiledInFolder:"已将编辑的书籍整理到“{folder}”。", studyEditedTextFolderSaveFailed:"正文已保存，但无法更新书架文件夹。",
  studyExportFolderLabel:"导出位置（此设备）", studyChooseExportFolder:"选择导出文件夹", studyClearExportFolder:"清除",
  studyExportFolderNone:"未选择（使用浏览器下载）", studyExportFolderSelected:"已选择：{name}（仅本次运行有效）",
  studyExportFolderHint:"将在所选文件夹中新建文件。若文件名已存在，会使用其他名称；绝不覆盖现有文件。不支持此功能的浏览器会改用普通下载。",
  studyExportSavedToFolder:"已将“{name}”导出到“{folder}”。", studyExportFolderSelectError:"无法选择导出文件夹。",
  studyExportFolderFallback:"无法保存到所选文件夹，已改为启动普通下载。",
  studyNext:"◀ 下一页", studyNextRight:"下一页 ▶", studyPrevious:"上一页 ▶", studyPreviousLeft:"◀ 上一页",
  studyNextRightOnly:"下一页 ▶", studyPreviousLeftOnly:"◀ 上一页", studyProgressDone:"完成",
  studyAssignCover:"🖼 将此页设为歌曲封面", studyCoverAssigned:"已设为“{title}”的封面。", studyCoverNeedSong:"请先选择一首歌曲。",
  studyCoverNeedImage:"请先打开图片页面。", studyCoverError:"无法保存封面。", studyDelete:"删除", studyRename:"重命名", studyOpen:"打开",
  studyBookImages:"图片相册", studyBookText:"文本", studyPageCount:"{n} 张图片", studyPagesStatus:"{current} / {total}",
  studyPageRange:"{first}–{last} / {total}", studyPageLabel:"页", studyTextProgress:"{n}%", studyRenamePrompt:"新标题",
  studyRenamed:"已重命名。", studyDeleteConfirm:"要从书架删除“{title}”吗？", studyDeleted:"已从书架删除。", studyReplace:"书架中已有“{title}”。要替换吗？",
  studyImportProgress:"正在导入… {n} / {total}", studyImportDone:"已添加 {n} 项。", studyNoImageFiles:"该文件夹中没有受支持的图片。",
  studyNoTextFiles:"没有找到受支持的文本文件。", studyNoSearchResults:"没有匹配的书籍。", studyTextBatchLimit:"一次最多可导入 200 个文本文件。",
  studyShelfLimit:"书架最多保存 500 本书。", studyTooMany:"每个图片相册最多 {max} 张、总计 {mb} MB。",
  studyFileTooBig:"“{name}”太大（每个文件最多 {mb} MB）。", studyTextTooBig:"“{name}”太大（每个文件最多 {mb} MB）。",
  studyDecodeError:"无法将“{name}”解码为文本。", studyStorageError:"浏览器存储失败，请检查设备可用空间。",
  studyImageLoadError:"无法加载此图片，请重新导入。", studySafeMode:"安全模式下不会读取书斋数据。请正常打开应用。",
  studyProgressHint:"拖动进度条可跳转页面。", studyBookmarked:"已从书签继续阅读。", studyMemoNeedText:"只有文本书籍可以用记事本编辑。",
  studyFullscreenExit:"退出全屏", studyHelp:"❓ 按键说明", studyHelpTitle:"书斋的按键操作", studyHelpClose:"关闭",
  studyHelpNav:"→ 前进，← 后退（可在高级设置中重新指定）。点击图片左右侧仍按装订方向翻页。文本会滚动。",
  studyHelpSpace:"下一页。长按：图片=页码跳转条，文本=添加书签。",
  studyHelpPg:"上一页／下一页（Home / End 跳到最前／最后）。",
  studyHelpZoom:"图片的放大、缩小、适应（纵向漫画不使用）。也支持 Ctrl+滚轮和双指缩放。",
  studyHelpSearch:"在文本书中搜索（Enter=下一个匹配，Shift+Enter=上一个匹配）。",
  studyHelpBookmark:"B=添加或移除书签，M=开关书签列表。",
  studyHelpTv:"T=切换电视显示（上→下→隐藏），F=图片全屏。",
  studyHelpEsc:"?=此说明，Esc=关闭说明／关闭书斋。",
  studySortLabel:"排序", studySortUpdated:"最近更新", studySortAdded:"最早添加", studySortTitle:"名称", studySortType:"按类型（图片优先）",
  studySortSize:"从大到小", studyMore:"再显示 {n} 本",
  studyFolderCreateHint:"点击或长按以创建新文件夹", studyCreateFolderPrompt:"请输入新文件夹名称。",
  studyRenameFolderPrompt:"新文件夹名称", studyFolderCreated:"文件夹已创建。", studyFolderDuplicate:"已存在同名文件夹。",
  studyFolderLimit:"最多可创建 200 个文件夹。", studyFolderNameRequired:"请输入文件夹名称。", studyFolderCount:"{n} 本",
  studyFolderBack:"← 返回书架", studyFolderEmpty:"此文件夹为空。将书籍拖到这里即可移入。", studyFolderOpen:"打开文件夹",
  studyFolderRename:"重命名文件夹", studyFolderDelete:"删除文件夹（保留其中的书籍）",
  studyFolderDeleted:"文件夹已删除，其中的书籍已移回书架。",
  studyShelfDragHint:"拖动 ⋮⋮ 可移动项目。关闭自动排序后可手动排序；拖放到文件夹即可移入。",
  studyKeepShelfVisible:"非全屏时显示书架。", studyShelfVisibilityHint:"取消勾选即可隐藏书架。随时可点击标题栏中的“显示书架”将其恢复。",
  studyShowShelf:"📚 显示书架", studyNextKeyLabel:"下一页", studyPreviousKeyLabel:"上一页", studyKeyChange:"更改", studyKeyPressKey:"请按一个按键 · Esc 取消",
  studyVerticalImageKeys:"使用 ↑ / ↓ 浏览图片页面", studyKeyAssignmentHint:"点击按钮后按下要使用的按键。支持方向键、字母、数字、Page Up / Down、Home 和 End；不能使用内置快捷键。",
  studyKeyCaptureHint:"请按下要分配给“{action}”的按键。Esc 取消。", studyKeyAssigned:"已将“{action}”设为“{key}”。",
  studyKeyInvalid:"无法分配此按键，请按其他按键。", studyKeyConflict:"“下一页”和“上一页”必须使用不同的按键。",
  studyKeyButtonLabel:"“{action}”按键为 {key}。点击可更改。", studyKeyButtonCaptureLabel:"正在设置“{action}”按键。请按键；Esc 取消。",
  studyDragHandle:"拖动以移动或排序", studyShelfMoved:"书架排列已更新。",
  studyNoSort:"不使用自动排序（手动排列）。", studyFoldersFirst:"将文件夹显示在顶部。",
  studyNoDeleteConfirm:"删除时不再确认。", studyManualOrderHint:"关闭自动排序后，可拖动文件夹和书籍自由排列。",
  studyStorageInfo:"{books} 本 · 图片 {images} 张 · 书斋 {size}",
  studyStorageFree:"{books} 本 · 图片 {images} 张 · 书斋 {size}（可用约 {free}）", studyBookmarks:"🔖 书签列表", studyBookmarkCount:"书签 {n} 个",
  studyBookmarksEmpty:"还没有书签。阅读时长按 Enter（或按 🔖 按钮）即可添加。", studyBookmarksHint:"每本书一个书签，点击即从该位置继续阅读。",
  studyBookmarkOpenAt:"从第 {n} 页打开", studyBookmarkOpenText:"从约 {n}% 的位置打开", studyBookmarkRemove:"移除书签", studyBookmarkRemoved:"已移除书签。",
  studyImportCancel:"中止", studyImportCancelled:"已中止导入。已保存的 {n} 本会保留。",
  studyImportAsk:"书架中已有 {count} 本同名书籍。要替换内容吗？（选择“取消”则只导入新书）",
  studyImportSummary:"完成: 新增 {added} 本 · 保留 {kept} 本 · 失败 {failed} 项",
  studyQuotaError:"设备可用空间不足。请删除一些较大的相册或书籍后重试。",
  studyAlbumNestingLabel:"相册拆分方式", studyAlbumNestingSplit:"每个子文件夹一本书", studyAlbumNestingFlat:"整个文件夹一本书",
  studyAlbumNestingHint:"从下次导入开始生效。", studyClearCover:"🗑 移除封面", studyCoverCleared:"已移除封面。",
  studyCoverNeedCover:"这首歌还没有书斋封面。", studyCoverSource:"书斋封面: {title}（第 {n} 页）", studyCoverHoldHint:"长按图片可设为这首歌的封面。",
  studyBookSearchPlaceholder:"在本书中搜索…", studyBookSearchCount:"{n} / {m}", studyBookSearchNone:"未找到",
  studyBookSearchClear:"✕ 结束搜索", studyBookSearchPrev:"上一个匹配", studyBookSearchNext:"下一个匹配",
  studyBookSearchHint:"Enter=下一个 · Shift+Enter=上一个 · Esc=结束搜索",
  studyTextTuneLabel:"文字", studyTextSizeSmall:"小", studyTextSizeNormal:"中", studyTextSizeLarge:"大", studyTextSizeHuge:"特大",
  studyTextSpacingTight:"紧凑", studyTextSpacingNormal:"行距普通", studyTextSpacingLoose:"行距宽松",
  studyTextWidthNarrow:"边距窄", studyTextWidthNormal:"边距普通", studyTextWidthWide:"边距宽",
  studyTextTuneHint:"竖排与活页纸也同样生效。", studyZoomFit:"适应", studyZoomValue:"{n}%", studyZoomHint:"也可用 Ctrl+滚轮和双指缩放。",
  studyTvLookLabel:"电视外观", studyTvLookPlain:"素屏", studyTvLookCrt:"显像管", studyTvLookWood:"木框", studyTvLookArcade:"街机",
  studyTvLookProjector:"投影仪", studyTvLookAquarium:"水族箱", studyTvSizeLabel:"大小", studyTvSizeSmall:"小", studyTvSizeMedium:"中", studyTvSizeLarge:"大",
  studyTvRatioLabel:"画面比", studyTvRatio169:"16:9", studyTvRatio43:"4:3", studyTvRatio219:"21:9", studyTvNameToggle:"显示曲名",
  studyTextStats:"{chars} 字 · {lines} 行", studyImageOrderLabel:"页面顺序", studyImageOrderNatural:"文件名顺序",
  studyImageOrderReverse:"倒序（右开本）", studyOrphanSweep:"已整理 {n} 个未使用的图片数据。"
});
Object.assign(TEXT.ko, {
  studyTitle:"📚 서재", studyLaunchHint:"♫ 곡 목록을 길게 눌러 서재 열기 (키보드에서는 Enter)",
  studyClose:"✕ 서재 닫기", studyImportImages:"🖼 이미지 폴더 가져오기", studyImportTextFiles:"＋ 텍스트 파일 추가",
  studyImportTextFolder:"📄 텍스트 폴더 가져오기", studyShelf:"책장", studySearch:"제목·폴더 검색…",
  studyShelfEmpty:"책장이 비어 있습니다. 이미지 폴더 또는 TXT / MD / JSON을 가져오세요.",
  studyWelcomeTitle:"읽을 항목을 선택하세요", studyWelcomeHint:"이미지는 폴더별로, 텍스트는 파일별로 이 기기에 저장합니다. 업로드하지 않습니다.",
  studyWelcomeHelp:"조작이 헷갈리면 오른쪽 위의 「❓ 키 설명」을 열어 보세요.",
  studySupported:"이미지: JPG / PNG / WebP / GIF / AVIF / BMP · 텍스트: TXT / MD / JSON / CSV / HTML / XML 등",
  studyTapHint:"이미지 왼쪽 누르기／→ 다음 · 오른쪽 누르기／← 이전 (🇺🇸에서는 누르는 위치 반전) · Space / Enter 다음 · Enter 길게 눌러 책갈피 · Space 길게 눌러 이동 · Esc 종료",
  studyVerticalHint:"위아래로 스크롤하거나 밀어서 읽기 · Space / Enter 다음 · Enter 길게 눌러 책갈피 · Esc 종료",
  studyBack:"← 책장", studyFullscreen:"⛶ 이미지 전체 화면", studyModeLabel:"이미지 배열", studyModeSingle:"한 페이지 (중앙)",
  studyModeSpread:"두 페이지 (첫 페이지 오른쪽)", studyModeVertical:"세로형 만화", studyAmerican:"🇺🇸 미국식 (좌우와 순서 반전)",
  studyThemeLabel:"텍스트 스킨", studyThemePlain:"일반 텍스트", studyThemeDark:"다크 모드", studyThemeNeon:"네온",
  studyThemeLined:"루즈리프", studyThemeGenko:"원고지 (세로쓰기·오른쪽부터)",
  studyThemeGroupWriter:"✍ 글쓰기와 독서", studyThemeGroupCode:"⌨ 코딩",
  studyThemeGroupAi:"◈ AI·프롬프트 분위기 (외관만)", studyThemeGroupFree:"✦ 자유로운 발상",
  studyThemePaper:"화지", studyThemeWarm:"웜 크림", studyThemeSepia:"앤티크 북", studyThemeMidnight:"미드나이트",
  studyThemeTerminal:"터미널 그린", studyThemeGraphite:"그라파이트", studyThemeBlueprint:"블루프린트", studyThemeContrast:"고대비",
  studyThemePrompt:"프롬프트 랩", studyThemeNeural:"뉴럴 그리드", studyThemeLatent:"잠재 공간",
  studyThemeMatrix:"토큰 매트릭스", studyThemeSynth:"신시시스", studyThemeAurora:"오로라", studyThemeSunset:"선셋",
  studyThemeOcean:"딥 오션", studyThemeMint:"민트", studyThemeDream:"드림", studyThemePrism:"프리즘",
  studyTvToggle:"읽으면서 TV 보기", studyTvPosLabel:"TV 위치",
  studyTvTop:"위", studyTvBottom:"아래", studyTvHidden:"표시 안 함", studyTvEmpty:"현재 영상 또는 곡 커버가 여기에 표시됩니다.",
  studyTvCaption:"현재 곡이나 영상을 표시합니다. 별도의 오디오 스트림을 재생하지 않습니다.", studyTvHint:"(이미지를 길게 누르면 이 곡의 커버로 지정됩니다)",
  studyBookmark:"🔖 책갈피 저장", studyBookmarkSaved:"🔖 책갈피를 저장했습니다.", studyBookmarkError:"책갈피를 저장하지 못했습니다.",
  studyAdvanced:"⚙ 고급 설정", studyMemoEdit:"✎ 사본 편집", studyMemoDone:"편집 마치기", studyExportText:"⇩ 텍스트 사본 내보내기",
  studyMemoSaved:"서재 사본을 저장했습니다.", studyMemoSaveError:"서재 사본을 저장하지 못했습니다.",
  studyEditorLabel:"텍스트 편집기", studyEditorSafety:"서재의 로컬 사본을 편집합니다. 원본 파일은 바뀌지 않습니다. JS / HTML은 실행하지 않고 Markdown도 서식으로 렌더링하지 않습니다. Tab 들여쓰기 · Ctrl / ⌘+S 저장 · Esc 읽기로 돌아가기.",
  studyEditorUnsaved:"저장되지 않은 변경 사항 · 자동 저장 대기 중", studyEditorSaving:"저장 중…", studyEditorSaved:"서재에 저장됨",
  studyEditorSaveFailed:"저장하지 못했습니다. 편집기를 나가기 전에 텍스트 사본을 내보내세요.",
  studyEditedTextFolderLabel:"편집한 텍스트를 넣을 책장 폴더", studyEditedTextFolderKeep:"자동 이동 안 함 (현재 위치 유지)",
  studyEditedTextFolderHint:"선택하면 저장된 텍스트 책을 이 책장 폴더로 정리합니다. 내용은 서재의 로컬 브라우저 저장소에 보관하며 원본 파일은 바꾸지 않습니다.",
  studyTextFiledInFolder:"편집한 책을 “{folder}” 폴더에 정리했습니다.", studyEditedTextFolderSaveFailed:"본문은 저장했지만 책장 폴더를 업데이트하지 못했습니다.",
  studyExportFolderLabel:"기기의 내보내기 위치", studyChooseExportFolder:"내보내기 폴더 선택", studyClearExportFolder:"해제",
  studyExportFolderNone:"선택 안 함 (브라우저 다운로드 사용)", studyExportFolderSelected:"선택됨: {name} (이번 실행 중에만)",
  studyExportFolderHint:"선택한 폴더에 새 파일을 만듭니다. 같은 이름이 있으면 다른 이름을 사용하며 기존 파일은 덮어쓰지 않습니다. 미지원 브라우저에서는 일반 다운로드를 사용합니다.",
  studyExportSavedToFolder:"“{name}”을(를) “{folder}”에 내보냈습니다.", studyExportFolderSelectError:"내보내기 폴더를 선택하지 못했습니다.",
  studyExportFolderFallback:"선택한 폴더에 저장하지 못해 일반 다운로드를 시작했습니다.",
  studyNext:"◀ 다음", studyNextRight:"다음 ▶", studyPrevious:"이전 ▶", studyPreviousLeft:"◀ 이전",
  studyNextRightOnly:"다음 ▶", studyPreviousLeftOnly:"◀ 이전", studyProgressDone:"완료",
  studyAssignCover:"🖼 이 페이지를 곡 커버로 지정", studyCoverAssigned:"“{title}”의 커버로 지정했습니다.",
  studyCoverNeedSong:"먼저 곡을 선택하세요.", studyCoverNeedImage:"먼저 이미지 페이지를 여세요.", studyCoverError:"커버를 저장하지 못했습니다.",
  studyDelete:"삭제", studyRename:"이름 변경", studyOpen:"열기", studyBookImages:"이미지 앨범", studyBookText:"텍스트",
  studyPageCount:"이미지 {n}장", studyPagesStatus:"{current} / {total}", studyPageRange:"{first}–{last} / {total}", studyPageLabel:"페이지",
  studyTextProgress:"{n}%", studyRenamePrompt:"새 제목", studyRenamed:"이름을 변경했습니다.",
  studyDeleteConfirm:"“{title}”을(를) 책장에서 삭제할까요?", studyDeleted:"책장에서 삭제했습니다.", studyReplace:"책장에 “{title}”이(가) 있습니다. 바꿀까요?",
  studyImportProgress:"가져오는 중… {n} / {total}", studyImportDone:"{n}개 항목을 책장에 추가했습니다.",
  studyNoImageFiles:"폴더에서 지원되는 이미지를 찾지 못했습니다.", studyNoTextFiles:"지원되는 텍스트 파일을 찾지 못했습니다.",
  studyNoSearchResults:"일치하는 책이 없습니다.", studyTextBatchLimit:"한 번에 최대 200개의 텍스트 파일을 가져올 수 있습니다.",
  studyShelfLimit:"책장은 최대 500권까지 저장할 수 있습니다.", studyTooMany:"이미지 앨범은 최대 {max}장, 총 {mb}MB까지입니다.",
  studyFileTooBig:"“{name}” 파일이 너무 큽니다 (파일당 최대 {mb}MB).", studyTextTooBig:"“{name}” 파일이 너무 큽니다 (파일당 최대 {mb}MB).",
  studyDecodeError:"“{name}”을(를) 텍스트로 디코딩하지 못했습니다.", studyStorageError:"브라우저 저장에 실패했습니다. 기기 여유 공간을 확인하세요.",
  studyImageLoadError:"이미지를 불러오지 못했습니다. 다시 가져오세요.", studySafeMode:"안전 모드에서는 서재 데이터를 읽지 않습니다. 앱을 일반 모드로 여세요.",
  studyProgressHint:"탐색 막대를 움직여 페이지를 이동할 수 있습니다.", studyBookmarked:"책갈피 위치에서 다시 시작했습니다.",
  studyMemoNeedText:"텍스트 책에서만 메모장 편집을 사용할 수 있습니다.", studyFullscreenExit:"전체 화면 닫기",
  studyHelp:"❓ 키 설명", studyHelpTitle:"서재 키 조작", studyHelpClose:"닫기",
  studyHelpNav:"→ 다음, ← 이전 (고급 설정에서 다시 지정할 수 있습니다). 이미지의 좌우를 누르면 제본 방향에 따라 넘깁니다. 텍스트는 스크롤합니다.",
  studyHelpSpace:"다음 페이지. 길게 누르면 이미지=페이지 이동 막대, 텍스트=책갈피 저장입니다.",
  studyHelpPg:"이전/다음 페이지 (Home / End 로 처음/마지막).",
  studyHelpZoom:"이미지 확대·축소·맞춤 (세로형 만화에서는 사용하지 않습니다). Ctrl+휠과 핀치도 가능합니다.",
  studyHelpSearch:"텍스트 책의 본문 검색 (Enter=다음 일치, Shift+Enter=이전 일치).",
  studyHelpBookmark:"B=책갈피 저장·해제, M=책갈피 목록 열기/닫기.",
  studyHelpTv:"T=TV 표시 전환 (위→아래→숨김), F=이미지 전체 화면.",
  studyHelpEsc:"?=이 설명, Esc=설명 닫기/서재 닫기.",
  studySortLabel:"정렬", studySortUpdated:"최근 업데이트순", studySortAdded:"오래된 추가순", studySortTitle:"이름순",
  studySortType:"종류별 (이미지 먼저)", studySortSize:"큰 순", studyMore:"{n}권 더 보기",
  studyFolderCreateHint:"클릭하거나 길게 눌러 새 폴더 만들기", studyCreateFolderPrompt:"새 폴더 이름을 입력하세요.",
  studyRenameFolderPrompt:"새 폴더 이름", studyFolderCreated:"폴더를 만들었습니다.", studyFolderDuplicate:"같은 이름의 폴더가 이미 있습니다.",
  studyFolderLimit:"폴더는 최대 200개까지 만들 수 있습니다.", studyFolderNameRequired:"폴더 이름을 입력하세요.", studyFolderCount:"{n}권",
  studyFolderBack:"← 책장으로 돌아가기", studyFolderEmpty:"폴더가 비어 있습니다. 책을 여기로 끌어 놓아 이동할 수 있습니다.", studyFolderOpen:"폴더 열기",
  studyFolderRename:"폴더 이름 변경", studyFolderDelete:"폴더 삭제 (책은 보관)",
  studyFolderDeleted:"폴더를 삭제하고 책을 책장으로 옮겼습니다.",
  studyShelfDragHint:"⋮⋮를 끌어 항목을 이동하세요. 자동 정렬을 끄면 순서를 바꿀 수 있고, 폴더에 놓으면 폴더로 이동합니다.",
  studyKeepShelfVisible:"전체 화면이 아닐 때 책장 표시", studyShelfVisibilityHint:"선택을 해제하면 책장을 숨깁니다. 제목 표시줄의 ‘책장 표시’를 눌러 언제든 다시 열 수 있습니다.",
  studyShowShelf:"📚 책장 표시", studyNextKeyLabel:"다음", studyPreviousKeyLabel:"이전", studyKeyChange:"변경", studyKeyPressKey:"키를 누르세요 · Esc 취소",
  studyVerticalImageKeys:"이미지 페이지를 ↑ / ↓로 이동", studyKeyAssignmentHint:"버튼을 누른 뒤 사용할 키를 누르세요. 방향키, 영문자, 숫자, Page Up / Down, Home, End를 사용할 수 있으며 기본 단축키는 지정할 수 없습니다.",
  studyKeyCaptureHint:"‘{action}’에 지정할 키를 누르세요. Esc를 누르면 취소됩니다.", studyKeyAssigned:"‘{action}’ 키를 ‘{key}’로 지정했습니다.",
  studyKeyInvalid:"지정할 수 없는 키입니다. 다른 키를 누르세요.", studyKeyConflict:"다음과 이전에는 서로 다른 키를 지정하세요.",
  studyKeyButtonLabel:"{action} 키는 {key}입니다. 눌러서 변경하세요.", studyKeyButtonCaptureLabel:"{action} 키 지정 중입니다. 키를 누르세요. Esc로 취소합니다.",
  studyDragHandle:"끌어서 이동 또는 정렬", studyShelfMoved:"책장 배치를 업데이트했습니다.",
  studyNoSort:"자동 정렬 사용 안 함 (직접 배치).", studyFoldersFirst:"폴더를 위에 표시합니다.",
  studyNoDeleteConfirm:"삭제할 때 확인하지 않습니다.", studyManualOrderHint:"자동 정렬을 끄면 폴더와 책을 끌어서 자유롭게 배치할 수 있습니다.",
  studyStorageInfo:"{books}권 · 이미지 {images}장 · 서재 {size}", studyStorageFree:"{books}권 · 이미지 {images}장 · 서재 {size} (여유 약 {free})",
  studyBookmarks:"🔖 책갈피 목록", studyBookmarkCount:"책갈피 {n}개",
  studyBookmarksEmpty:"책갈피를 저장한 책이 없습니다. 읽으면서 Enter를 길게 누르면(또는 🔖 버튼) 저장됩니다.",
  studyBookmarksHint:"책갈피는 책마다 하나이며, 누르면 그 위치에서 이어 읽습니다.",
  studyBookmarkOpenAt:"{n}페이지부터 열기", studyBookmarkOpenText:"앞에서 약 {n}% 위치부터 열기",
  studyBookmarkRemove:"책갈피 해제", studyBookmarkRemoved:"책갈피를 해제했습니다.",
  studyImportCancel:"중단", studyImportCancelled:"가져오기를 중단했습니다. 저장된 {n}권은 그대로 남습니다.",
  studyImportAsk:"같은 이름의 책이 {count}권 있습니다. 내용을 바꿀까요? (취소하면 새 책만 가져옵니다)",
  studyImportSummary:"완료: {added}권 추가 · {kept}권 유지 · {failed}건 실패",
  studyQuotaError:"기기 여유 공간이 부족합니다. 큰 앨범이나 책을 줄인 뒤 다시 시도해 주세요.",
  studyAlbumNestingLabel:"앨범 분리 방식", studyAlbumNestingSplit:"하위 폴더마다 한 권", studyAlbumNestingFlat:"폴더 전체를 한 권으로",
  studyAlbumNestingHint:"다음 가져오기부터 적용됩니다.",
  studyClearCover:"🗑 커버 해제", studyCoverCleared:"커버를 해제했습니다.", studyCoverNeedCover:"이 곡에는 아직 서재 커버가 없습니다.",
  studyCoverSource:"서재 커버: {title} ({n}페이지)", studyCoverHoldHint:"이미지를 길게 누르면 이 곡의 커버가 됩니다.",
  studyBookSearchPlaceholder:"이 책에서 검색…", studyBookSearchCount:"{n} / {m}", studyBookSearchNone:"찾지 못했습니다",
  studyBookSearchClear:"✕ 검색 종료", studyBookSearchPrev:"이전 일치", studyBookSearchNext:"다음 일치",
  studyBookSearchHint:"Enter=다음 · Shift+Enter=이전 · Esc=검색 종료",
  studyTextTuneLabel:"글자", studyTextSizeSmall:"작게", studyTextSizeNormal:"보통", studyTextSizeLarge:"크게", studyTextSizeHuge:"아주 크게",
  studyTextSpacingTight:"좁게", studyTextSpacingNormal:"줄간격 보통", studyTextSpacingLoose:"줄간격 넓게",
  studyTextWidthNarrow:"여백 좁게", studyTextWidthNormal:"여백 보통", studyTextWidthWide:"여백 넓게",
  studyTextTuneHint:"세로쓰기와 루즈리프에도 함께 적용됩니다.",
  studyZoomFit:"맞춤", studyZoomValue:"{n}%", studyZoomHint:"Ctrl+휠과 핀치로도 확대할 수 있습니다.",
  studyTvLookLabel:"TV 외형", studyTvLookPlain:"기본 화면", studyTvLookCrt:"브라운관", studyTvLookWood:"나무 프레임",
  studyTvLookArcade:"아케이드", studyTvLookProjector:"프로젝터", studyTvLookAquarium:"수조",
  studyTvSizeLabel:"크기", studyTvSizeSmall:"작게", studyTvSizeMedium:"보통", studyTvSizeLarge:"크게",
  studyTvRatioLabel:"화면비", studyTvRatio169:"16:9", studyTvRatio43:"4:3", studyTvRatio219:"21:9", studyTvNameToggle:"곡명 표시",
  studyTextStats:"{chars}자 · {lines}행", studyImageOrderLabel:"페이지 순서", studyImageOrderNatural:"파일명 순",
  studyImageOrderReverse:"역순 (오른쪽 제본)", studyOrphanSweep:"사용하지 않는 이미지 데이터 {n}개를 정리했습니다."
});

const STUDY_UTIL = window.TrkStudyUtils;
const STUDY_DB_NAME = "trk_study_room_v1";
const STUDY_STORES = ["books", "pages", "covers", "settings"];
const STUDY_IMAGE_MAX_COUNT = 3000, STUDY_IMAGE_MAX_BYTES = 600 * 1024 * 1024, STUDY_IMAGE_FILE_MAX = 100 * 1024 * 1024;
const STUDY_TEXT_FILE_MAX = 12 * 1024 * 1024, STUDY_TEXT_BATCH_MAX = 200, STUDY_BATCH_WRITE = 40;
const STUDY_SHELF_MAX = 500, STUDY_SHELF_PAGE = 60, STUDY_SEARCH_MARK_MAX = 1500;
const STUDY_ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const STUDY_TEXT_SIZE = { small:0.88, normal:1, large:1.18, huge:1.4 };
const STUDY_TEXT_LEADING = { tight:1.6, normal:1.9, loose:2.3 };
const STUDY_TEXT_PAD = { narrow:0.5, normal:1, wide:1.7 };
const STUDY_TV_LOOKS = ["plain", "crt", "wood", "arcade", "projector", "aquarium"];
const STUDY_TV_MAX = { small:"18vh", medium:"26vh", large:"36vh" };
const STUDY_TV_WIDTH = { small:"min(100%,560px)", medium:"100%", large:"100%" };
const STUDY_TV_RATIO = { "16:9":"16 / 9", "4:3":"4 / 3", "21:9":"21 / 9" };
const STUDY_IMAGE_MODES = ["single", "spread", "vertical"];
const STUDY_THEMES = [
  "plain", "paper", "warm", "lined", "genko", "sepia",
  "dark", "midnight", "terminal", "graphite", "blueprint", "contrast",
  "prompt", "neural", "latent", "matrix", "synth",
  "neon", "aurora", "sunset", "ocean", "mint", "dream", "prism"
];
const STUDY_SORTS = ["updated", "added", "title", "type", "size"];
const STUDY_FOLDER_MAX = 200;
const STUDY_DEFAULT_NEXT_KEY = "ArrowRight", STUDY_DEFAULT_PREVIOUS_KEY = "ArrowLeft";
const STUDY_RESERVED_KEYS = new Set(["Escape", "Tab", "Space", "Enter", "NumpadEnter", "KeyB", "KeyM", "KeyT", "KeyF",
  "Equal", "NumpadAdd", "Minus", "NumpadSubtract", "Digit0", "Numpad0", "Slash"]);
function studyKeyCodeAllowed(code) {
  return typeof code === "string" && !STUDY_RESERVED_KEYS.has(code) &&
    (/^Arrow(?:Left|Right|Up|Down)$/.test(code) || /^Key[A-Z]$/.test(code) || /^Digit[1-9]$/.test(code) ||
      /^Numpad[1-9]$/.test(code) || ["PageUp", "PageDown", "Home", "End"].includes(code));
}
function studyKeyCodeLabel(code) {
  return ({ ArrowLeft:"←", ArrowRight:"→", ArrowUp:"↑", ArrowDown:"↓" })[code] ||
    (/^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit[1-9]$/.test(code) ? code.slice(5) : /^Numpad[1-9]$/.test(code) ? `Num ${code.slice(6)}` : code);
}

let studyDbPromise = null;
let studyBooks = [], studyCurrentBook = null, studyCurrentPage = 0;
let studyVerticalBookId = "", studyVerticalObserver = null, studyVerticalScrollTimer = 0;
let studyMemoSaveTimer = 0, studyProgressTimer = 0, studyRenderToken = 0, studyImageLoadSeq = 0;
let studyRoomOpen = false, studyClosePending = false, studyTVToken = 0, studyTVArtUrl = "", studyTVArtSong = "";
let studyHoldTimer = 0, studyHeldCode = "", studyHoldAction = "", studySuppressTapUntil = 0;
let studyPointerStart = null, studyLaunchTimer = 0, studyLaunchFired = false, studyLaunchPointerAt = 0;
let studyVideoHomeParent = null, studyVideoHomeNext = null, studyVideoHomeStyle = null, studyFullscreenFallback = false;
let studyShelfShown = STUDY_SHELF_PAGE, studyBookmarkMode = false, studySweepBusy = false, studySweepAt = 0;
let studyShelfFolders = [], studyBookFolder = Object.create(null), studyShelfOrder = Object.create(null), studyShelfViewFolder = "";
let studyShelfDragged = null, studyShelfHoldTimer = 0, studyShelfHoldFired = false, studyDataReady = false;
let studyKeyCaptureAction = "", studyExportDirectory = null;
let studyPointers = new Map(), studyPinchStart = 0, studyPinchZoom = 1;
let studySearchState = { query:"", marks:[], index:-1, capped:false };
let studyImportState = { active:false, cancelled:false, total:0, added:0, kept:0, failed:0 };
const studyObjectUrls = new Set();
let studyPrefs = { imageMode:"single", imageOrder:"natural", american:false, zoom:1, theme:"plain",
  textSize:"normal", textSpacing:"normal", textWidth:"normal", tvEnabled:false, tvPosition:"top", tvLook:"plain",
  tvSize:"medium", tvRatio:"16:9", tvLabelOn:true, shelfSort:"updated", albumNesting:"split",
  manualShelfOrder:false, foldersFirst:false, skipDeleteConfirm:false, shelfVisible:true, verticalImageKeys:false, editedTextFolderId:"",
  studyNextKey:STUDY_DEFAULT_NEXT_KEY, studyPreviousKey:STUDY_DEFAULT_PREVIOUS_KEY, helpSeen:false };

/* ============ 保存（IndexedDB） ============ */
function studySafeMode() { return typeof window.TrkSafeMode === "function" && window.TrkSafeMode(); }
function studyDBOpen() {
  if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));
  if (studyDbPromise) return studyDbPromise;
  studyDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(STUDY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      for (const name of STUDY_STORES) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => { studyDbPromise = null; reject(request.error || new Error("Could not open Study storage")); };
    request.onblocked = () => { studyDbPromise = null; reject(new Error("Study storage is blocked")); };
  });
  return studyDbPromise;
}
function studyDBRun(storeName, mode, operation) {
  return studyDBOpen().then(db => new Promise((resolve, reject) => {
    let settled = false, result;
    const tx = db.transaction(storeName, mode);
    const done = (fn, value) => { if (!settled) { settled = true; fn(value); } };
    tx.oncomplete = () => done(resolve, result);
    tx.onerror = () => done(reject, tx.error || new Error("Study storage request failed"));
    tx.onabort = () => done(reject, tx.error || new Error("Study storage transaction was aborted"));
    try {
      const request = operation(tx.objectStore(storeName));
      if (request && typeof request === "object" && "onsuccess" in request) {
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => done(reject, request.error || new Error("Study storage request failed"));
      }
    } catch (error) {
      try { tx.abort(); } catch (_) {}
      done(reject, error);
    }
  }));
}
function studyDBBatch(storeName, entries) {
  return studyDBOpen().then(db => new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, "readwrite"), store = tx.objectStore(storeName);
    const done = (fn, value) => { if (!settled) { settled = true; fn(value); } };
    tx.oncomplete = () => done(resolve);
    tx.onerror = () => done(reject, tx.error || new Error("Study storage write failed"));
    tx.onabort = () => done(reject, tx.error || new Error("Study storage write was aborted"));
    try { for (const [key, value] of entries) store.put(value, key); }
    catch (error) { try { tx.abort(); } catch (_) {} done(reject, error); }
  }));
}
function studyDBDeleteMany(storeName, keys) {
  if (!keys || !keys.length) return Promise.resolve();
  return studyDBOpen().then(db => new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, "readwrite"), store = tx.objectStore(storeName);
    const done = (fn, value) => { if (!settled) { settled = true; fn(value); } };
    tx.oncomplete = () => done(resolve);
    tx.onerror = () => done(reject, tx.error || new Error("Study storage delete failed"));
    tx.onabort = () => done(reject, tx.error || new Error("Study storage delete was aborted"));
    try { for (const key of keys) store.delete(key); }
    catch (error) { try { tx.abort(); } catch (_) {} done(reject, error); }
  }));
}
function studyDBPairs(storeName) {
  return studyDBOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly"), store = tx.objectStore(storeName);
    const keysRequest = store.getAllKeys(), valuesRequest = store.getAll();
    let keys = [], values = [];
    keysRequest.onsuccess = () => { keys = keysRequest.result || []; };
    valuesRequest.onsuccess = () => { values = valuesRequest.result || []; };
    tx.oncomplete = () => resolve(keys.map((key, i) => [key, values[i]]));
    tx.onerror = tx.onabort = () => reject(tx.error || new Error("Study storage read failed"));
  }));
}
function studyIsQuota(error) {
  return !!error && (error.name === "QuotaExceededError" || /quota/i.test(String(error.message || "")));
}
function studyFail(error, fallbackKey) {
  console.error(error);
  if (studyIsQuota(error)) { studySetStatus("studyQuotaError"); return true; }
  studySetStatus(fallbackKey || "studyStorageError");
  return false;
}

/* ============ 状態表示・設定 ============ */
function studySetStatus(key, vars) { if (typeof setStatus === "function") setStatus("studyStatus", key, vars); }
function studyNotify(key, vars) { studySetStatus(key, vars); if (typeof showToast === "function") window.Trk.play.showToast(tr(key, vars)); }
function studyApplyShelfVisibility() {
  const visible = studyPrefs.shelfVisible !== false;
  $("studyShelf").hidden = !visible;
  $("studyRoom").classList.toggle("study-shelf-hidden", !visible);
  $("studyShelfVisible").checked = visible;
  const button = $("studyShowShelfBtn");
  button.hidden = visible;
  button.setAttribute("aria-expanded", String(visible));
}
function studySetShelfVisible(visible) {
  studyPrefs.shelfVisible = !!visible;
  studyApplyShelfVisibility(); studySavePrefs();
}
function studySetKeyCapture(action) {
  studyKeyCaptureAction = studyKeyCaptureAction === action ? "" : action;
  studyRefreshKeyAssignments();
  if (studyKeyCaptureAction) studySetStatus("studyKeyCaptureHint", { action:tr(action === "next" ? "studyNextKeyLabel" : "studyPreviousKeyLabel") });
  else studySetStatus(null);
}
function studyRefreshKeyAssignments() {
  for (const action of ["next", "previous"]) {
    const isNext = action === "next", button = $(isNext ? "studyNextKeyBtn" : "studyPreviousKeyBtn");
    const value = $(isNext ? "studyNextKeyValue" : "studyPreviousKeyValue");
    const actionNode = $(isNext ? "studyNextKeyAction" : "studyPreviousKeyAction");
    const code = studyPrefs[isNext ? "studyNextKey" : "studyPreviousKey"];
    const label = tr(isNext ? "studyNextKeyLabel" : "studyPreviousKeyLabel"), capturing = studyKeyCaptureAction === action;
    value.textContent = capturing ? "…" : studyKeyCodeLabel(code);
    actionNode.textContent = tr(capturing ? "studyKeyPressKey" : "studyKeyChange");
    button.setAttribute("aria-pressed", String(capturing));
    button.setAttribute("aria-label", tr(capturing ? "studyKeyButtonCaptureLabel" : "studyKeyButtonLabel",
      capturing ? { action:label } : { action:label, key:studyKeyCodeLabel(code) }));
    button.classList.toggle("study-capture-active", capturing);
  }
}
function studyHandleKeyCapture(event) {
  if (!studyKeyCaptureAction) return false;
  event.preventDefault(); event.stopImmediatePropagation();
  if (event.code === "Escape") {
    studyKeyCaptureAction = ""; studyRefreshKeyAssignments(); studySetStatus(null); return true;
  }
  if (event.repeat || /^(?:Shift|Control|Alt|Meta)/.test(event.code || "")) return true;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || !studyKeyCodeAllowed(event.code)) {
    studyNotify("studyKeyInvalid"); return true;
  }
  const isNext = studyKeyCaptureAction === "next";
  const property = isNext ? "studyNextKey" : "studyPreviousKey";
  const other = studyPrefs[isNext ? "studyPreviousKey" : "studyNextKey"];
  if (event.code === other) { studyNotify("studyKeyConflict"); return true; }
  studyPrefs[property] = event.code;
  studyKeyCaptureAction = ""; studySavePrefs(); studyRefreshKeyAssignments();
  studyNotify("studyKeyAssigned", { action:tr(isNext ? "studyNextKeyLabel" : "studyPreviousKeyLabel"), key:studyKeyCodeLabel(event.code) });
  return true;
}
function studyReadPrefs(raw) {
  if (!raw || typeof raw !== "object") return;
  studyPrefs.imageMode = STUDY_IMAGE_MODES.includes(raw.imageMode) ? raw.imageMode : "single";
  studyPrefs.imageOrder = raw.imageOrder === "reverse" ? "reverse" : "natural";
  studyPrefs.american = raw.american === true;
  studyPrefs.zoom = STUDY_ZOOM_STEPS.includes(Number(raw.zoom)) ? Number(raw.zoom) : 1;
  studyPrefs.theme = STUDY_THEMES.includes(raw.theme) ? raw.theme : "plain";
  studyPrefs.textSize = ["small", "normal", "large", "huge"].includes(raw.textSize) ? raw.textSize : "normal";
  studyPrefs.textSpacing = ["tight", "normal", "loose"].includes(raw.textSpacing) ? raw.textSpacing : "normal";
  studyPrefs.textWidth = ["narrow", "normal", "wide"].includes(raw.textWidth) ? raw.textWidth : "normal";
  studyPrefs.tvEnabled = raw.tvEnabled === true;
  studyPrefs.tvPosition = ["top", "bottom", "off"].includes(raw.tvPosition) ? raw.tvPosition : "top";
  if (studyPrefs.tvPosition === "off") studyPrefs.tvEnabled = false;
  studyPrefs.tvLook = STUDY_TV_LOOKS.includes(raw.tvLook) ? raw.tvLook : "plain";
  studyPrefs.tvSize = ["small", "medium", "large"].includes(raw.tvSize) ? raw.tvSize : "medium";
  studyPrefs.tvRatio = Object.keys(STUDY_TV_RATIO).includes(raw.tvRatio) ? raw.tvRatio : "16:9";
  studyPrefs.tvLabelOn = raw.tvLabelOn !== false;
  studyPrefs.shelfSort = STUDY_SORTS.includes(raw.shelfSort) ? raw.shelfSort : "updated";
  studyPrefs.albumNesting = raw.albumNesting === "flat" ? "flat" : "split";
  studyPrefs.manualShelfOrder = raw.manualShelfOrder === true;
  studyPrefs.foldersFirst = raw.foldersFirst === true;
  studyPrefs.skipDeleteConfirm = raw.skipDeleteConfirm === true;
  studyPrefs.shelfVisible = raw.shelfVisible !== false;
  studyPrefs.verticalImageKeys = raw.verticalImageKeys === true;
  studyPrefs.editedTextFolderId = typeof raw.editedTextFolderId === "string" && raw.editedTextFolderId.length <= 128 ? raw.editedTextFolderId : "";
  studyPrefs.studyNextKey = studyKeyCodeAllowed(raw.studyNextKey) ? raw.studyNextKey : STUDY_DEFAULT_NEXT_KEY;
  const previousKey = studyKeyCodeAllowed(raw.studyPreviousKey) ? raw.studyPreviousKey : STUDY_DEFAULT_PREVIOUS_KEY;
  studyPrefs.studyPreviousKey = previousKey !== studyPrefs.studyNextKey ? previousKey
    : studyPrefs.studyNextKey !== STUDY_DEFAULT_PREVIOUS_KEY ? STUDY_DEFAULT_PREVIOUS_KEY : STUDY_DEFAULT_NEXT_KEY;
  studyPrefs.helpSeen = raw.helpSeen === true;
}
function studySavePrefs() {
  return studyDBRun("settings", "readwrite", store => store.put({ ...studyPrefs }, "ui"))
    .catch(error => { studyFail(error); });
}
function studyRefreshEditedTextFolderSelect() {
  const select = $("studyEditedTextFolder"), previous = studyPrefs.editedTextFolderId;
  select.textContent = "";
  const keep = document.createElement("option"); keep.value = ""; keep.textContent = tr("studyEditedTextFolderKeep"); select.append(keep);
  const folders = [...studyShelfFolders].sort((a, b) => STUDY_UTIL.comparePath(a.name, b.name));
  for (const folder of folders) {
    const option = document.createElement("option"); option.value = folder.id; option.textContent = folder.name; select.append(option);
  }
  if (previous && !folders.some(folder => folder.id === previous)) {
    studyPrefs.editedTextFolderId = ""; studySavePrefs();
  }
  select.value = studyPrefs.editedTextFolderId;
}
function studyCanChooseExportFolder() {
  return !!(window.isSecureContext && window.self === window.top && typeof window.showDirectoryPicker === "function");
}
function studyRefreshExportFolderUI() {
  $("studyChooseExportFolderBtn").hidden = !studyCanChooseExportFolder();
  $("studyClearExportFolderBtn").hidden = !studyExportDirectory;
  $("studyExportFolderName").textContent = studyExportDirectory
    ? tr("studyExportFolderSelected", { name:studyExportDirectory.name }) : tr("studyExportFolderNone");
}
function studyReadShelfMeta(raw) {
  studyShelfFolders = [];
  studyBookFolder = Object.create(null);
  studyShelfOrder = Object.create(null);
  studyShelfOrder.root = [];
  if (!raw || typeof raw !== "object") return;
  const seen = new Set();
  for (const row of Array.isArray(raw.folders) ? raw.folders.slice(0, STUDY_FOLDER_MAX) : []) {
    if (!row || typeof row !== "object") continue;
    const id = String(row.id || "").slice(0, 80), name = String(row.name || "").trim().slice(0, 120);
    if (!/^[a-z0-9_-]{1,80}$/i.test(id) || id === "root" || !name || seen.has(id)) continue;
    seen.add(id);
    studyShelfFolders.push({ id, name, createdAt:Math.max(0, Number(row.createdAt) || Date.now()), updatedAt:Math.max(0, Number(row.updatedAt) || Date.now()) });
    studyShelfOrder[id] = [];
  }
  const folderIds = new Set(studyShelfFolders.map(folder => folder.id));
  if (raw.bookFolder && typeof raw.bookFolder === "object" && !Array.isArray(raw.bookFolder)) {
    for (const [bookId, folderId] of Object.entries(raw.bookFolder).slice(0, STUDY_SHELF_MAX)) {
      if (typeof bookId === "string" && bookId.length <= 100 && folderIds.has(String(folderId))) studyBookFolder[bookId] = String(folderId);
    }
  }
  if (raw.orderByFolder && typeof raw.orderByFolder === "object" && !Array.isArray(raw.orderByFolder)) {
    for (const [container, values] of Object.entries(raw.orderByFolder).slice(0, STUDY_FOLDER_MAX + 1)) {
      if (container !== "root" && !folderIds.has(container)) continue;
      if (!Array.isArray(values)) continue;
      const keys = [], used = new Set();
      for (const value of values.slice(0, STUDY_SHELF_MAX + STUDY_FOLDER_MAX)) {
        const key = String(value || "").slice(0, 240);
        if (!/^(?:book|folder):/.test(key) || used.has(key)) continue;
        used.add(key); keys.push(key);
      }
      studyShelfOrder[container] = keys;
    }
  }
}
function studyShelfSnapshot() {
  return JSON.stringify({ folders:studyShelfFolders, bookFolder:studyBookFolder, orderByFolder:studyShelfOrder });
}
function studyNormalizeShelfMeta() {
  const before = studyShelfSnapshot();
  const folderIds = new Set(studyShelfFolders.map(folder => folder.id));
  const bookIds = new Set(studyBooks.map(book => book.id));
  for (const id of Object.keys(studyBookFolder)) if (!bookIds.has(id)) delete studyBookFolder[id];
  for (const book of studyBooks) {
    const folderId = studyBookFolder[book.id];
    if (!folderIds.has(folderId)) studyBookFolder[book.id] = "";
  }
  const expected = Object.create(null);
  expected.root = studyShelfFolders.map(folder => `folder:${folder.id}`);
  for (const folder of studyShelfFolders) expected[folder.id] = [];
  for (const book of studyBooks) {
    const folderId = studyBookFolder[book.id] || "";
    expected[folderId || "root"].push(`book:${book.id}`);
  }
  let folderSizes = null;
  const entryForKey = key => {
    const id = key.slice(key.indexOf(":") + 1);
    if (key.startsWith("folder:")) {
      const folder = studyShelfFolders.find(item => item.id === id);
      return folder && { key, itemType:"folder", kind:"folder", title:folder.name, createdAt:folder.createdAt, updatedAt:folder.updatedAt,
        size:(folderSizes || (folderSizes = studyShelfFolderSizes())).get(id) || 0 };
    }
    const book = studyBooks.find(item => item.id === id);
    return book && { key, itemType:"book", kind:book.kind, title:book.title, createdAt:book.createdAt, updatedAt:book.updatedAt,
      size:STUDY_UTIL.bookSize(book) };
  };
  const normalized = Object.create(null);
  for (const [container, keys] of Object.entries(expected)) {
    const valid = new Set(keys), used = new Set();
    const current = Array.isArray(studyShelfOrder[container]) ? studyShelfOrder[container] : [];
    const ordered = current.filter(key => valid.has(key) && !used.has(key) && used.add(key));
    const missing = STUDY_UTIL.sortShelfItems(keys.filter(key => !used.has(key)).map(entryForKey).filter(Boolean),
      { mode:studyPrefs.shelfSort, foldersFirst:studyPrefs.foldersFirst }).map(entry => entry.key);
    normalized[container] = ordered.concat(missing);
  }
  studyShelfOrder = normalized;
  if (studyShelfViewFolder && !folderIds.has(studyShelfViewFolder)) studyShelfViewFolder = "";
  return before !== studyShelfSnapshot();
}
function studySaveShelfMeta() {
  if (studySafeMode()) return Promise.resolve(true);
  const value = { folders:studyShelfFolders, bookFolder:studyBookFolder, orderByFolder:studyShelfOrder };
  return studyDBRun("settings", "readwrite", store => store.put(value, "shelf"))
    .then(() => true).catch(error => { studyFail(error); return false; });
}
function studyShelfContainer(folderId) {
  const key = folderId || "root";
  if (!Array.isArray(studyShelfOrder[key])) studyShelfOrder[key] = [];
  return studyShelfOrder[key];
}
function studyShelfItemKey(type, id) { return `${type === "folder" ? "folder" : "book"}:${id}`; }
function studyFolderById(id) { return studyShelfFolders.find(folder => folder.id === id) || null; }
function studyBookFolderId(bookId) { return studyBookFolder[bookId] || ""; }
async function studyApplyEditedTextFolder(book) {
  const folderId = studyPrefs.editedTextFolderId;
  const folder = folderId && studyFolderById(folderId);
  if (!book || book.kind !== "text" || !folder || studyBookFolderId(book.id) === folderId) return null;
  const previousFolder = studyBookFolderId(book.id);
  studyBookFolder[book.id] = folderId; studyNormalizeShelfMeta();
  if (!await studySaveShelfMeta()) {
    studyBookFolder[book.id] = previousFolder; studyNormalizeShelfMeta(); studyRenderShelf();
    return false;
  }
  studyShelfViewFolder = folderId; studyRenderShelf(); studyNotify("studyTextFiledInFolder", { folder:folder.name });
  return true;
}
function studyShelfFolderSizes() {
  const sizes = new Map(studyShelfFolders.map(folder => [folder.id, 0]));
  for (const book of studyBooks) {
    const folderId = studyBookFolderId(book.id);
    if (sizes.has(folderId)) sizes.set(folderId, sizes.get(folderId) + STUDY_UTIL.bookSize(book));
  }
  return sizes;
}
/* 見た目の設定（TVの枠・文字サイズ・拡大率）をDOMへ反映する。 */
function studySyncLook() {
  const screen = $("studyTvScreen");
  if (screen) {
    screen.dataset.look = studyPrefs.tvLook;
    screen.dataset.size = studyPrefs.tvSize;
    screen.dataset.ratio = studyPrefs.tvRatio;
    screen.style.setProperty("--study-tv-max", STUDY_TV_MAX[studyPrefs.tvSize] || STUDY_TV_MAX.medium);
    screen.style.setProperty("--study-tv-width", STUDY_TV_WIDTH[studyPrefs.tvSize] || "100%");
    screen.style.setProperty("--study-tv-ratio", STUDY_TV_RATIO[studyPrefs.tvRatio] || STUDY_TV_RATIO["16:9"]);
  }
  const label = $("studyTvLabel");
  if (label) label.hidden = !studyPrefs.tvLabelOn;
  const stage = $("studyTextStage");
  stage.style.setProperty("--study-text-size", String(STUDY_TEXT_SIZE[studyPrefs.textSize] || 1));
  stage.style.setProperty("--study-text-leading", String(STUDY_TEXT_LEADING[studyPrefs.textSpacing] || 1.9));
  stage.style.setProperty("--study-text-pad", String(STUDY_TEXT_PAD[studyPrefs.textWidth] || 1));
  studyApplyZoom(false);
}
function studyRefreshPrefsUI() {
  $("studyImageMode").value = studyPrefs.imageMode;
  $("studyImageOrder").value = studyPrefs.imageOrder;
  $("studyAmerican").checked = studyPrefs.american;
  $("studyTheme").value = studyPrefs.theme;
  $("studyTextSize").value = studyPrefs.textSize;
  $("studyTextSpacing").value = studyPrefs.textSpacing;
  $("studyTextWidth").value = studyPrefs.textWidth;
  $("studyTvCheck").checked = studyPrefs.tvEnabled;
  $("studyTvPosition").value = studyPrefs.tvPosition;
  $("studyTvLook").value = studyPrefs.tvLook;
  $("studyTvSize").value = studyPrefs.tvSize;
  $("studyTvRatio").value = studyPrefs.tvRatio;
  $("studyTvLabelOn").checked = studyPrefs.tvLabelOn;
  $("studyShelfSort").value = studyPrefs.shelfSort;
  $("studyAlbumNesting").value = studyPrefs.albumNesting;
  $("studyManualShelfOrder").checked = studyPrefs.manualShelfOrder;
  $("studyFoldersFirst").checked = studyPrefs.foldersFirst;
  $("studySkipDeleteConfirm").checked = studyPrefs.skipDeleteConfirm;
  $("studyVerticalImageKeys").checked = studyPrefs.verticalImageKeys;
  $("studyShelfSort").disabled = studyPrefs.manualShelfOrder;
  studyRefreshEditedTextFolderSelect(); studyRefreshExportFolderUI();
  studyApplyShelfVisibility();
  studyRefreshKeyAssignments();
  studySyncLook();
  studySyncCurrentBookControls();
}

/* ============ 本のデータ ============ */
function studyBookClean(raw) {
  if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id || !["image", "text"].includes(raw.kind)) return null;
  const pages = (Array.isArray(raw.pages) ? raw.pages : []).slice(0, STUDY_IMAGE_MAX_COUNT).map(p => {
    if (!p || typeof p !== "object" || typeof p.key !== "string") return null;
    return { key:p.key.slice(0, 240), name:String(p.name || "page").slice(0, 240), path:String(p.path || p.name || "").slice(0, 500),
      size:Math.max(0, Number(p.size) || 0), type:String(p.type || "").slice(0, 100) };
  }).filter(Boolean);
  const bookmark = raw.bookmark && typeof raw.bookmark === "object" ? {
    index:Math.max(0, Math.min(STUDY_IMAGE_MAX_COUNT - 1, Number(raw.bookmark.index) || 0)),
    top:Math.max(0, Number(raw.bookmark.top) || 0), left:Number(raw.bookmark.left) || 0,
    ratio:Math.max(0, Math.min(1, Number(raw.bookmark.ratio) || 0)),
    savedAt:Math.max(0, Number(raw.bookmark.savedAt) || 0)
  } : null;
  return { id:raw.id.slice(0, 100), kind:raw.kind, title:String(raw.title || "Untitled").trim().slice(0, 160) || "Untitled",
    sourcePath:String(raw.sourcePath || "").slice(0, 1000), generation:String(raw.generation || "").slice(0, 100),
    pages, content:typeof raw.content === "string" ? raw.content.slice(0, STUDY_TEXT_FILE_MAX) : "",
    extension:String(raw.extension || "").slice(0, 16), bookmark, createdAt:Math.max(0, Number(raw.createdAt) || Date.now()),
    updatedAt:Math.max(0, Number(raw.updatedAt) || Date.now()) };
}
/* ページの並び順（設定で逆順にもできる。栞や現在位置は「表示順」で数える）。 */
function studyPageAt(book, index) {
  if (!book || book.kind !== "image") return null;
  const pages = STUDY_UTIL.orderPages(book.pages, studyPrefs.imageOrder);
  return pages[Math.max(0, Math.min(pages.length - 1, Math.round(Number(index) || 0)))] || null;
}
function studyExistingBook(id) {
  return studyDBRun("books", "readonly", store => store.get(id)).then(raw => raw ? studyBookClean(raw) : null);
}
async function studyRefreshBooks() {
  const rows = await studyDBRun("books", "readonly", store => store.getAll());
  studyBooks = STUDY_UTIL.sortBooks((rows || []).map(studyBookClean).filter(Boolean), studyPrefs.shelfSort);
  if (studyCurrentBook) {
    const fresh = studyBooks.find(book => book.id === studyCurrentBook.id);
    if (fresh) studyCurrentBook = fresh; else studyCurrentBook = null;
  }
  if (studyNormalizeShelfMeta()) studySaveShelfMeta();
  studyRenderShelf(); studyRenderBookmarks(); studyRefreshShelfFoot();
}

/* ============ 本棚 ============ */
function studyShelfEntries(folderId, query) {
  const search = String(query || "").toLocaleLowerCase(), entries = [];
  const folderSizes = folderId ? null : studyShelfFolderSizes();
  if (!folderId) {
    for (const folder of studyShelfFolders) {
      if (search && !folder.name.toLocaleLowerCase().includes(search)) continue;
      entries.push({ key:studyShelfItemKey("folder", folder.id), itemType:"folder", kind:"folder", title:folder.name,
        createdAt:folder.createdAt, updatedAt:folder.updatedAt, size:folderSizes.get(folder.id) || 0, folder });
    }
  }
  for (const book of studyBooks) {
    const parent = studyBookFolderId(book.id);
    if (folderId ? parent !== folderId : !search && parent) continue;
    const folder = studyFolderById(parent);
    const searchable = `${book.title} ${book.sourcePath} ${book.extension} ${folder ? folder.name : ""}`.toLocaleLowerCase();
    if (search && !searchable.includes(search)) continue;
    entries.push({ key:studyShelfItemKey("book", book.id), itemType:"book", kind:book.kind, title:book.title,
      createdAt:book.createdAt, updatedAt:book.updatedAt, size:STUDY_UTIL.bookSize(book), book, folderId:parent });
  }
  let orderKeys = studyShelfContainer(folderId);
  if (!folderId && search) orderKeys = ["root", ...studyShelfFolders.map(folder => folder.id)].flatMap(key => studyShelfContainer(key));
  return STUDY_UTIL.sortShelfItems(entries, { mode:studyPrefs.shelfSort, manual:studyPrefs.manualShelfOrder,
    foldersFirst:studyPrefs.foldersFirst, orderKeys });
}
function studyShelfCanDrop(drag, target) {
  if (!drag || !target) return false;
  if (target.type === "back") return drag.type === "book" && !!drag.sourceFolder;
  if (target.type === "folder") return drag.type === "book" || drag.type === "folder" && studyPrefs.manualShelfOrder;
  if (target.type === "book") {
    if (drag.type === "book") return studyPrefs.manualShelfOrder || drag.sourceFolder !== (target.folderId || "");
    return drag.type === "folder" && studyPrefs.manualShelfOrder && !target.folderId;
  }
  if (target.type === "container") {
    const destination = target.folderId || "";
    if (drag.type === "book") return studyPrefs.manualShelfOrder || drag.sourceFolder !== destination;
    return drag.type === "folder" && studyPrefs.manualShelfOrder && !destination;
  }
  return false;
}
function studyShelfDragOver(event, target, node) {
  if (!studyShelfCanDrop(studyShelfDragged, target)) return;
  event.preventDefault(); event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  node.classList.add("study-drop-target");
}
function studyShelfMoveItem(drag, destination, reference, after) {
  if (!drag) return;
  const isFolder = drag.type === "folder", key = studyShelfItemKey(drag.type, drag.id);
  const source = isFolder ? "" : studyBookFolderId(drag.id);
  const targetFolder = isFolder ? "" : (destination || "");
  if (isFolder && !studyPrefs.manualShelfOrder || !isFolder && !studyBooks.some(book => book.id === drag.id)) return;
  if (targetFolder && !studyFolderById(targetFolder)) return;
  if (!studyPrefs.manualShelfOrder && !isFolder && source === targetFolder) return;
  if (reference && reference.key === key) return;
  const from = studyShelfContainer(source), fromIndex = from.indexOf(key);
  if (fromIndex >= 0) from.splice(fromIndex, 1);
  if (!isFolder) studyBookFolder[drag.id] = targetFolder;
  const to = studyShelfContainer(targetFolder);
  let index = to.length;
  if (reference && reference.key) {
    const targetIndex = to.indexOf(reference.key);
    if (targetIndex >= 0) index = targetIndex + (after ? 1 : 0);
  }
  to.splice(index, 0, key);
  const scrollTop = $("studyShelfList").scrollTop;
  studySaveShelfMeta(); studyRenderShelf(); $("studyShelfList").scrollTop = scrollTop; studySetStatus("studyShelfMoved");
}
function studyShelfDrop(event, target) {
  const drag = studyShelfDragged;
  if (!studyShelfCanDrop(drag, target)) return;
  event.preventDefault(); event.stopPropagation();
  let destination = "", reference = null, after = false;
  if (target.type === "folder") {
    if (drag.type === "book") destination = target.id;
    else { reference = { key:studyShelfItemKey("folder", target.id) }; after = event.clientY > target.node.getBoundingClientRect().top + target.node.getBoundingClientRect().height / 2; }
  } else if (target.type === "book") {
    destination = target.folderId || "";
    reference = { key:studyShelfItemKey("book", target.id) };
    const rect = target.node.getBoundingClientRect(); after = event.clientY > rect.top + rect.height / 2;
  } else if (target.type === "container" && target.folderId) destination = target.folderId;
  studyShelfMoveItem(drag, destination, reference, after);
  studyShelfDragged = null;
  $("studyShelfList").classList.remove("study-drop-target");
}
function studyBindShelfDropTarget(node, target) {
  target.node = node;
  node.addEventListener("dragover", event => studyShelfDragOver(event, target, node));
  node.addEventListener("dragleave", event => { if (!node.contains(event.relatedTarget)) node.classList.remove("study-drop-target"); });
  node.addEventListener("drop", event => studyShelfDrop(event, target));
}
function studyShelfTargetAt(x, y) {
  const hit = document.elementFromPoint(x, y);
  if (!hit || typeof hit.closest !== "function") return null;
  const back = hit.closest(".study-shelf-back");
  if (back) return { type:"back", folderId:"", node:back };
  const folder = hit.closest(".study-folder-card");
  if (folder) return { type:"folder", id:folder.dataset.studyItemId, node:folder };
  const book = hit.closest(".study-book-card");
  if (book) return { type:"book", id:book.dataset.studyItemId, folderId:book.dataset.studyFolderId || "", node:book };
  const list = hit.closest("#studyShelfList");
  return list ? { type:"container", folderId:studyShelfViewFolder, node:list } : null;
}
function studyHighlightShelfTarget(x, y) {
  const list = $("studyShelfList");
  for (const node of list.querySelectorAll(".study-drop-target")) node.classList.remove("study-drop-target");
  list.classList.remove("study-drop-target");
  const target = studyShelfTargetAt(x, y);
  if (studyShelfCanDrop(studyShelfDragged, target)) (target.node || list).classList.add("study-drop-target");
  return target;
}
function studyShelfDragHandle(type, id, sourceFolder, card) {
  const handle = el("button", "study-tool-btn study-drag-handle", "⋮⋮");
  handle.type = "button";
  handle.draggable = type === "folder" ? studyPrefs.manualShelfOrder : studyPrefs.manualShelfOrder || studyShelfFolders.length > 0;
  handle.hidden = !handle.draggable;
  handle.title = tr("studyDragHandle"); handle.setAttribute("aria-label", `${tr("studyDragHandle")}: ${type === "folder" ? (studyFolderById(id) || {}).name || id : (studyBooks.find(book => book.id === id) || {}).title || id}`);
  handle.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || !handle.draggable) return;
    event.preventDefault();
    const originalDraggable = handle.draggable;
    handle.draggable = false;
    const pointer = { id:event.pointerId, x:event.clientX, y:event.clientY, started:false };
    const startDrag = () => {
      pointer.started = true; studyShelfDragged = { type, id, sourceFolder:sourceFolder || "" };
      card.classList.add("study-dragging");
    };
    const move = moveEvent => {
      if (moveEvent.pointerId !== pointer.id) return;
      if (!pointer.started && Math.hypot(moveEvent.clientX - pointer.x, moveEvent.clientY - pointer.y) < 8) return;
      moveEvent.preventDefault();
      if (!pointer.started) startDrag();
      studyHighlightShelfTarget(moveEvent.clientX, moveEvent.clientY);
    };
    const finish = endEvent => {
      if (endEvent.pointerId !== pointer.id) return;
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", finish);
      document.removeEventListener("pointercancel", cancel);
      if (pointer.started && endEvent.type === "pointerup") {
        const target = studyHighlightShelfTarget(endEvent.clientX, endEvent.clientY);
        if (studyShelfCanDrop(studyShelfDragged, target)) studyShelfDrop({
          preventDefault() {}, stopPropagation() {}, clientY:endEvent.clientY
        }, target);
      }
      studyShelfDragged = null; handle.draggable = originalDraggable;
      card.classList.remove("study-dragging");
      for (const node of $("studyShelfList").querySelectorAll(".study-drop-target")) node.classList.remove("study-drop-target");
      $("studyShelfList").classList.remove("study-drop-target");
    };
    const cancel = cancelEvent => finish(cancelEvent);
    document.addEventListener("pointermove", move, { passive:false });
    document.addEventListener("pointerup", finish);
    document.addEventListener("pointercancel", cancel);
    try { handle.setPointerCapture(event.pointerId); } catch (_) {}
  });
  handle.addEventListener("dragstart", event => {
    if (type === "folder" && !studyPrefs.manualShelfOrder) { event.preventDefault(); return; }
    studyShelfDragged = { type, id, sourceFolder:sourceFolder || "" };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      try { event.dataTransfer.setData("text/plain", studyShelfItemKey(type, id)); } catch (_) {}
    }
    card.classList.add("study-dragging");
  });
  handle.addEventListener("dragend", () => {
    studyShelfDragged = null;
    for (const node of $("studyShelfList").querySelectorAll(".study-dragging,.study-drop-target")) node.classList.remove("study-dragging", "study-drop-target");
    $("studyShelfList").classList.remove("study-drop-target");
  });
  return handle;
}
function studyRenderFolderCard(folder) {
  const card = el("article", "study-folder-card");
  card.dataset.studyItemType = "folder"; card.dataset.studyItemId = folder.id;
  const open = el("button", "study-folder-open"); open.type = "button";
  const copy = el("span", "study-book-copy");
  copy.append(el("strong", "study-book-title", folder.name), el("span", "study-book-sub", tr("studyFolderCount", { n:studyBooks.filter(book => studyBookFolderId(book.id) === folder.id).length })));
  open.append(el("span", "study-folder-icon", "📁"), copy); open.title = tr("studyFolderOpen");
  open.setAttribute("aria-label", `${tr("studyFolderOpen")}: ${folder.name}`);
  open.addEventListener("click", () => {
    studyShelfViewFolder = folder.id; studyShelfShown = STUDY_SHELF_PAGE; $("studySearch").value = ""; studyRenderShelf();
    const back = $("studyShelfList").querySelector(".study-shelf-back"); if (back) back.focus({ preventScroll:true });
  });
  const tools = el("span", "study-book-tools");
  tools.append(studyShelfDragHandle("folder", folder.id, "", card));
  const rename = el("button", "study-tool-btn", "✎"); rename.type = "button"; rename.title = tr("studyFolderRename");
  rename.setAttribute("aria-label", `${tr("studyFolderRename")}: ${folder.name}`); rename.addEventListener("click", () => studyRenameFolder(folder));
  const remove = el("button", "study-tool-btn study-delete-btn", "×"); remove.type = "button"; remove.title = tr("studyFolderDelete");
  remove.setAttribute("aria-label", `${tr("studyFolderDelete")}: ${folder.name}`); remove.addEventListener("click", () => studyDeleteFolder(folder));
  tools.append(rename, remove); card.append(open, tools);
  studyBindShelfDropTarget(card, { type:"folder", id:folder.id });
  return card;
}
function studyRenderBookCard(book) {
  const card = el("article", "study-book-card"), folderId = studyBookFolderId(book.id), folder = studyFolderById(folderId);
  card.dataset.studyItemType = "book"; card.dataset.studyItemId = book.id; card.dataset.studyFolderId = folderId;
  const open = el("button", "study-book-open"); open.type = "button";
  const icon = el("span", "study-book-icon", book.kind === "image" ? "🖼" : "📄");
  const text = el("span", "study-book-copy");
  const title = el("strong", "study-book-title", book.title);
  const detail = book.kind === "image" ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:book.pages.length })}`
    : `${tr("studyBookText")} · ${String(book.extension || "TXT").toUpperCase()} · ${tr("studyTextStats", STUDY_UTIL.textStats(book.content))}`;
  const sub = el("span", "study-book-sub", detail + (folder ? ` · 📁 ${folder.name}` : "") + (book.bookmark ? " · 🔖" : ""));
  text.append(title, sub);
  if (book.kind === "text" && book.content) {
    const ratio = book.bookmark && book.bookmark.ratio ? book.bookmark.ratio : 0;
    text.append(el("span", "study-book-snippet", STUDY_UTIL.snippetAt(book.content, ratio, 64)));
  }
  open.append(icon, text); open.title = tr("studyOpen"); open.addEventListener("click", () => studyOpenBook(book));
  const tools = el("span", "study-book-tools");
  tools.append(studyShelfDragHandle("book", book.id, folderId, card));
  const rename = el("button", "study-tool-btn", "✎"); rename.type = "button"; rename.title = tr("studyRename"); rename.setAttribute("aria-label", `${tr("studyRename")}: ${book.title}`);
  rename.addEventListener("click", () => studyRenameBook(book));
  const remove = el("button", "study-tool-btn study-delete-btn", "×"); remove.type = "button"; remove.title = tr("studyDelete"); remove.setAttribute("aria-label", `${tr("studyDelete")}: ${book.title}`);
  remove.addEventListener("click", () => studyDeleteBook(book));
  tools.append(rename, remove); card.append(open, tools);
  studyBindShelfDropTarget(card, { type:"book", id:book.id, folderId });
  return card;
}
function studyRenderShelf() {
  const list = $("studyShelfList"), query = $("studySearch").value.trim();
  list.textContent = "";
  const entries = studyShelfEntries(studyShelfViewFolder, query);
  const bookCount = entries.filter(entry => entry.itemType === "book").length;
  const scopeCount = studyShelfViewFolder ? studyBooks.filter(book => studyBookFolderId(book.id) === studyShelfViewFolder).length : studyBooks.length;
  $("studyBookCount").textContent = query || studyShelfViewFolder ? `${bookCount} / ${scopeCount}` : String(studyBooks.length);
  $("studyShelfDragHelp").hidden = !(studyPrefs.manualShelfOrder || studyShelfFolders.length);
  studySyncWelcome();
  if (studyShelfViewFolder) {
    const folder = studyFolderById(studyShelfViewFolder);
    const back = el("button", "study-shelf-back", `${tr("studyFolderBack")} · ${folder ? folder.name : ""}`); back.type = "button";
    back.setAttribute("aria-label", `${tr("studyFolderBack")}: ${folder ? folder.name : ""}`);
    back.addEventListener("click", () => {
      studyShelfViewFolder = ""; studyShelfShown = STUDY_SHELF_PAGE; $("studySearch").value = ""; studyRenderShelf();
      studyShelfTitle.focus({ preventScroll:true });
    });
    studyBindShelfDropTarget(back, { type:"back", folderId:studyShelfViewFolder }); list.append(back);
  }
  if (!entries.length) {
    const key = query ? "studyNoSearchResults" : studyShelfViewFolder ? "studyFolderEmpty" : "studyShelfEmpty";
    list.append(el("div", "study-shelf-empty", tr(key)));
    return;
  }
  const visible = entries.slice(0, Math.max(STUDY_SHELF_PAGE, studyShelfShown));
  for (const entry of visible) list.append(entry.itemType === "folder" ? studyRenderFolderCard(entry.folder) : studyRenderBookCard(entry.book));
  if (entries.length > visible.length) {
    const more = el("button", "study-more-btn", tr("studyMore", { n:Math.min(STUDY_SHELF_PAGE, entries.length - visible.length) }));
    more.type = "button";
    more.addEventListener("click", () => { studyShelfShown = visible.length + STUDY_SHELF_PAGE; studyRenderShelf(); });
    list.append(more);
  }
}
/* ============ 🔖 栞一覧 ============ */
/* 説明パネルは「本がなくて、読んでもいない」ときだけ出します（本棚に本があるときは邪魔なので隠す）。 */
function studySyncWelcome() {
  const reading = !!studyCurrentBook && !$("studyBookView").hidden;
  $("studyWelcome").hidden = studyBooks.length > 0 || reading;
}
function studyBookmarkDetail(book) {
  const mark = book.bookmark;
  if (!mark) return "";
  if (book.kind === "image") return tr("studyBookmarkOpenAt", { n:Math.min(book.pages.length, mark.index + 1) });
  return tr("studyBookmarkOpenText", { n:Math.round((mark.ratio || 0) * 100) });
}
function studyRenderBookmarks() {
  const panel = $("studyBookmarkPanel"), rows = STUDY_UTIL.bookmarkedBooks(studyBooks);
  const badge = $("studyBookmarkCount");
  badge.hidden = !rows.length; badge.textContent = tr("studyBookmarkCount", { n:rows.length });
  $("studyBookmarksBtn").setAttribute("aria-pressed", String(studyBookmarkMode));
  if (!studyBookmarkMode) return;
  panel.textContent = "";
  if (!rows.length) { panel.append(el("div", "study-shelf-empty", tr("studyBookmarksEmpty"))); return; }
  panel.append(el("div", "study-shelf-more", tr("studyBookmarksHint")));
  for (const book of rows) {
    const card = el("article", "study-bookmark-card");
    const open = el("button", "study-bookmark-open"); open.type = "button"; open.title = tr("studyOpen");
    const copy = el("span", "study-bookmark-copy");
    copy.append(el("strong", "", book.title), el("span", "", studyBookmarkDetail(book)));
    open.append(el("span", "study-bookmark-icon", "🔖"), copy);
    if (book.kind === "text" && book.content) copy.append(el("span", "", STUDY_UTIL.snippetAt(book.content, (book.bookmark && book.bookmark.ratio) || 0, 56)));
    open.addEventListener("click", () => studyOpenBookmarkEntry(book));
    const unset = el("button", "study-bookmark-unset", "🗑"); unset.type = "button"; unset.title = tr("studyBookmarkRemove");
    unset.setAttribute("aria-label", `${tr("studyBookmarkRemove")}: ${book.title}`);
    unset.addEventListener("click", () => studyClearBookmark(book));
    card.append(open, unset); panel.append(card);
  }
}
function studyToggleBookmarkPanel(force) {
  studyBookmarkMode = typeof force === "boolean" ? force : !studyBookmarkMode;
  $("studyBookmarkPanel").hidden = !studyBookmarkMode;
  $("studyShelfList").hidden = studyBookmarkMode;
  $("studyBookmarksBtn").setAttribute("aria-pressed", String(studyBookmarkMode));
  studyRenderBookmarks();
}
async function studyOpenBookmarkEntry(book) {
  studyToggleBookmarkPanel(false);
  await studyOpenBook(book);
  if (book.bookmark) studySetStatus("studyBookmarked");
}
async function studyClearBookmark(book) {
  const target = book || studyCurrentBook;
  if (!target || !target.bookmark) return;
  target.bookmark = null;
  try { await studySaveBook(target); studyNotify("studyBookmarkRemoved"); }
  catch (error) { studyFail(error); }
}
function studyToggleBookmark() {
  if (!studyCurrentBook) return;
  if (studyCurrentBook.bookmark) studyClearBookmark(studyCurrentBook); else studySaveBookmark();
}
/* ============ 使用量の表示 ============ */
async function studyRefreshShelfFoot() {
  const foot = $("studyShelfFoot");
  const books = studyBooks.length, images = studyBooks.reduce((sum, book) => sum + book.pages.length, 0);
  const size = STUDY_UTIL.formatBytes(studyBooks.reduce((sum, book) => sum + STUDY_UTIL.bookSize(book), 0));
  let free = "";
  try {
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      const estimate = await navigator.storage.estimate();
      if (estimate && estimate.quota) free = STUDY_UTIL.formatBytes(Math.max(0, estimate.quota - (estimate.usage || 0)));
    }
  } catch (_) {}
  foot.textContent = free ? tr("studyStorageFree", { books, images, size, free }) : tr("studyStorageInfo", { books, images, size });
}
/* 取り込み中に落ちた・中止した場合などに残る、参照されていない画像データを片づける。 */
async function studySweepOrphans() {
  if (studySafeMode() || studyImportState.active || studySweepBusy) return 0;
  if (Date.now() - studySweepAt < 60000) return 0;
  studySweepBusy = true;
  try {
    const keys = await studyDBRun("pages", "readonly", store => store.getAllKeys());
    const alive = new Set();
    for (const book of studyBooks) for (const page of book.pages) alive.add(page.key);
    for (const [, art] of await studyDBPairs("covers")) if (art && typeof art.pageKey === "string") alive.add(art.pageKey);
    const dead = (keys || []).filter(key => !alive.has(key));
    if (dead.length) await studyDBDeleteMany("pages", dead);
    return dead.length;
  } catch (_) { return 0; } finally { studySweepBusy = false; studySweepAt = Date.now(); }
}

/* ============ 取り込み ============ */
function studyImportStart(total) {
  studyImportState = { active:true, cancelled:false, total, added:0, kept:0, failed:0 };
  $("studyImportWrap").hidden = false; $("studyImportFill").style.width = "0%";
  $("studyImportCancelBtn").disabled = false;
  $("studyImportLabel").textContent = tr("studyImportProgress", { n:0, total });
  studySetStatus(null);
}
function studyImportTick(done, total) {
  const percent = total ? Math.max(0, Math.min(100, Math.round(done / total * 100))) : 0;
  $("studyImportFill").style.width = `${percent}%`;
  $("studyImportLabel").textContent = tr("studyImportProgress", { n:Math.min(done, total), total });
}
function studyImportEnd(key, vars) {
  studyImportState.active = false;
  $("studyImportWrap").hidden = true;
  if (key) studyNotify(key, vars);
}
function studyCancelImport() {
  if (!studyImportState.active) return;
  studyImportState.cancelled = true;
  $("studyImportCancelBtn").disabled = true;
  $("studyImportLabel").textContent = tr("studyImportCancel");
}
async function studyImportSummary() {
  const state = studyImportState, added = state.added, kept = state.kept, failed = state.failed;
  studyImportEnd();
  if (!added && !kept && !failed) return;
  if (!kept && !failed) { studyNotify("studyImportDone", { n:added }); return; }
  /* 1冊も入らなかったときは「大きすぎる」などの具体的な理由を消さないようにします。 */
  if (!added && !kept) { if (typeof showToast === "function") window.Trk.play.showToast(tr("studyImportSummary", { added, kept, failed })); return; }
  studyNotify("studyImportSummary", { added, kept, failed });
}
async function studyImportImageGroup(group, id, position, total) {
  const old = await studyExistingBook(id);
  const generation = studyNewGeneration(), refs = [], entries = [];
  for (let index = 0; index < group.files.length; index++) {
    const { file, path } = group.files[index], key = `page:${id}:${generation}:${index}`;
    refs.push({ key, name:String(file.name || path).slice(0, 240), path:String(path || file.name).slice(0, 500), size:Number(file.size) || 0, type:String(file.type || "").slice(0, 100) });
    entries.push([key, file.slice(0, file.size, file.type || "application/octet-stream")]);
  }
  try {
    for (let i = 0; i < entries.length; i += STUDY_BATCH_WRITE) {
      if (studyImportState.cancelled) throw Object.assign(new Error("Study import cancelled"), { studyCancelled:true });
      await studyDBBatch("pages", entries.slice(i, i + STUDY_BATCH_WRITE));
      studyImportTick(position + Math.min(i + STUDY_BATCH_WRITE, entries.length), total);
    }
    const now = Date.now();
    const record = { id, kind:"image", title:String(group.title || tr("studyBookImages")).slice(0, 160), sourcePath:group.sourcePath,
      generation, pages:refs, content:"", extension:"", bookmark:old && old.bookmark ? old.bookmark : null,
      createdAt:old ? old.createdAt : now, updatedAt:now };
    await studyDBRun("books", "readwrite", store => store.put(record, id));
    if (old) {
      try {
        const changed = [];
        for (const [songKey, art] of await studyDBPairs("covers")) if (art && art.bookId === id) {
          const pageIndex = Math.max(0, Math.floor(Number(art.pageIndex) || 0));
          if (pageIndex < refs.length) await studyDBRun("covers", "readwrite", store => store.put({ ...art, pageKey:refs[pageIndex].key, pageIndex, title:record.title, updatedAt:Date.now() }, songKey));
          else await studyDBRun("covers", "readwrite", store => store.delete(songKey));
          changed.push(songKey);
        }
        for (const songKey of changed) emit("studyCoverChanged", songKey);
      } catch (error) { console.warn("Study covers could not be rebound after replacing an album", error); }
      if (old.pages.length) studyDBDeleteMany("pages", old.pages.map(page => page.key)).catch(() => {});
    }
    return "ok";
  } catch (error) {
    studyDBDeleteMany("pages", refs.map(page => page.key)).catch(() => {});
    if (error && error.studyCancelled) return "cancelled";
    studyFail(error);
    return "error";
  }
}
async function studyImportImages(files) {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  if (studyImportState.active) return;
  const groups = STUDY_UTIL.groupImageFiles(files, studyPrefs.albumNesting);
  if (!groups.length) { studyNotify("studyNoImageFiles"); return; }
  const tasks = groups.map(group => ({ group, id:STUDY_UTIL.stableId("image", group.sourcePath) }));
  const known = new Set(studyBooks.map(book => book.id));
  const replaceCount = tasks.filter(task => known.has(task.id)).length;
  const replace = !replaceCount || confirm(tr("studyImportAsk", { count:replaceCount }));
  const total = groups.reduce((sum, group) => sum + group.files.length, 0);
  let position = 0, lastId = "";
  studyImportStart(total);
  try {
    for (const task of tasks) {
      if (studyImportState.cancelled) break;
      if (!known.has(task.id) && known.size >= STUDY_SHELF_MAX) { studyImportState.failed++; studySetStatus("studyShelfLimit"); position += task.group.files.length; studyImportTick(position, total); continue; }
      if (!replace && known.has(task.id)) { studyImportState.kept++; position += task.group.files.length; studyImportTick(position, total); continue; }
      const result = await studyImportImageGroup(task.group, task.id, position, total);
      if (result === "ok") { studyImportState.added++; known.add(task.id); lastId = task.id; }
      else if (result === "error") studyImportState.failed++;
      else break;
      position += task.group.files.length;
      studyImportTick(position, total);
    }
    await studyRefreshBooks();
  } catch (error) { studyImportEnd(); studyFail(error); return; }
  const cancelled = studyImportState.cancelled;
  if (cancelled) { const added = studyImportState.added; studyImportEnd("studyImportCancelled", { n:added }); }
  else await studyImportSummary();
  if (lastId && !cancelled) { const newest = studyBooks.find(book => book.id === lastId); if (newest) studyOpenBook(newest); }
}
async function studyImportTextEntry(entry, id, position, total) {
  const file = entry.file, size = Number(file.size) || 0;
  if (size > STUDY_TEXT_FILE_MAX) { studySetStatus("studyTextTooBig", { name:file.name, mb:Math.round(STUDY_TEXT_FILE_MAX / 1048576) }); return "error"; }
  if (studyCurrentBook && studyCurrentBook.id === id && !$("studyMemoEditor").hidden) {
    if (!await studyFlushMemo(true)) return "error";
    $("studyMemoEditor").readOnly = false; $("studyMemoEditor").hidden = true;
    $("studyEditorNotice").hidden = true; $("studyTextPage").hidden = false;
    $("studyMemoBtn").textContent = tr("studyMemoEdit"); $("studyMemoExportBtn").hidden = false;
    studyRenderTextContent(studyCurrentBook); studySyncTextProgress();
  }
  let old = null;
  try { old = await studyExistingBook(id); }
  catch (error) { studyFail(error); return "error"; }
  let content;
  try { content = STUDY_UTIL.decodeTextBuffer(await file.arrayBuffer()); }
  catch (error) { console.error(error); studySetStatus("studyDecodeError", { name:file.name }); return "error"; }
  try {
    const now = Date.now();
    const record = { id, kind:"text", title:String(entry.title || STUDY_UTIL.baseName(file.name)).slice(0, 160), sourcePath:entry.path,
      generation:"", pages:[], content, extension:STUDY_UTIL.extension(file.name), bookmark:old && old.bookmark ? old.bookmark : null,
      createdAt:old ? old.createdAt : now, updatedAt:now };
    await studyDBRun("books", "readwrite", store => store.put(record, id));
    studyImportTick(position + 1, total);
    return "ok";
  } catch (error) { studyFail(error); return "error"; }
}
async function studyImportTexts(files) {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  if (studyImportState.active) return;
  const entries = STUDY_UTIL.listTextFiles(files);
  if (!entries.length) { studyNotify("studyNoTextFiles"); return; }
  if (entries.length > STUDY_TEXT_BATCH_MAX) { studySetStatus("studyTextBatchLimit"); return; }
  const tasks = entries.map(entry => ({ entry, id:STUDY_UTIL.stableId("text", entry.path) }));
  const known = new Set(studyBooks.map(book => book.id));
  const replaceCount = tasks.filter(task => known.has(task.id)).length;
  const replace = !replaceCount || confirm(tr("studyImportAsk", { count:replaceCount }));
  let lastId = "";
  studyImportStart(entries.length);
  try {
    for (let i = 0; i < tasks.length; i++) {
      if (studyImportState.cancelled) break;
      const task = tasks[i];
      if (!known.has(task.id) && known.size >= STUDY_SHELF_MAX) { studyImportState.failed++; studySetStatus("studyShelfLimit"); continue; }
      if (!replace && known.has(task.id)) { studyImportState.kept++; studyImportTick(i + 1, entries.length); continue; }
      const result = await studyImportTextEntry(task.entry, task.id, i, entries.length);
      if (result === "ok") { studyImportState.added++; known.add(task.id); lastId = task.id; }
      else if (result === "error") studyImportState.failed++;
      else break;
    }
    await studyRefreshBooks();
  } catch (error) { studyImportEnd(); studyFail(error); return; }
  const cancelled = studyImportState.cancelled;
  if (cancelled) { const added = studyImportState.added; studyImportEnd("studyImportCancelled", { n:added }); }
  else await studyImportSummary();
  if (lastId && !cancelled) { const newest = studyBooks.find(book => book.id === lastId); if (newest) studyOpenBook(newest); }
}
function studyNewGeneration() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }

/* ============ 画像の表示 ============ */
/* 保存済みの値が Blob かどうかは、別の実行環境で作られた Blob でも通るように型名ではなく形で判断します。 */
function studyIsBlob(value) {
  return !!value && typeof value === "object" && typeof value.size === "number" && typeof value.slice === "function";
}
/* 画像の URL は見えているページの分だけ作り、離れたらすぐ解放します（縦読みの長い本で特に大事）。 */
function studyClearImage(img) {
  const url = img && img.dataset.studyObjectUrl;
  if (url) {
    try { if (typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url); } catch (_) {}
    studyObjectUrls.delete(url); delete img.dataset.studyObjectUrl;
  }
  if (img) { delete img.dataset.studyLoadToken; img.removeAttribute("src"); img.hidden = true; }
}
function studySetImage(img, blob, alt) {
  studyClearImage(img);
  if (!img || !studyIsBlob(blob) || typeof URL.createObjectURL !== "function") return false;
  let url = "";
  try { url = URL.createObjectURL(blob); } catch (_) { return false; }
  studyObjectUrls.add(url); img.dataset.studyObjectUrl = url; img.alt = alt || ""; img.src = url; img.hidden = false;
  return true;
}
function studyClearVerticalPages() {
  if (studyVerticalObserver) { studyVerticalObserver.disconnect(); studyVerticalObserver = null; }
  const box = $("studyVerticalPages");
  for (const img of box.querySelectorAll("img")) studyClearImage(img);
  box.textContent = ""; studyVerticalBookId = "";
}
function studyClearPageImages() {
  studyRenderToken++;
  for (const id of ["studyPageSingle", "studyPageLeft", "studyPageRight"]) studyClearImage($(id));
  studyClearVerticalPages();
}
async function studyLoadPageImage(img, index, book = studyCurrentBook) {
  const page = book && book.kind === "image" ? studyPageAt(book, index) : null;
  if (!page) { studyClearImage(img); return; }
  const renderToken = studyRenderToken, loadToken = String(++studyImageLoadSeq);
  img.dataset.studyLoadToken = loadToken;
  try {
    const blob = await studyDBRun("pages", "readonly", store => store.get(page.key));
    if (img.dataset.studyLoadToken !== loadToken || book !== studyCurrentBook || renderToken !== studyRenderToken) return;
    if (!studyIsBlob(blob)) { studyClearImage(img); studySetStatus("studyImageLoadError"); return; }
    if (!studySetImage(img, blob, `${book.title} — ${page.name} (${index + 1})`)) studySetStatus("studyImageLoadError");
  } catch (error) {
    if (img.dataset.studyLoadToken === loadToken) { studyClearImage(img); studyFail(error, "studyImageLoadError"); }
  }
}
function studySyncPageCount() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "image") return;
  const total = book.pages.length;
  const progress = $("studyProgress"), mode = studyPrefs.imageMode;
  progress.max = String(Math.max(0, total - 1)); progress.step = mode === "spread" ? "2" : "1";
  progress.value = String(Math.max(0, Math.min(total - 1, studyCurrentPage)));
  let label = tr("studyPagesStatus", { current:Math.min(total, studyCurrentPage + 1), total });
  if (mode === "spread" && total) label = tr("studyPageRange", { first:studyCurrentPage + 1, last:Math.min(total, studyCurrentPage + 2), total });
  $("studyPageCount").textContent = label;
  $("studyImageHint").textContent = tr(mode === "vertical" ? "studyVerticalHint" : "studyTapHint");
  const canPrev = studyCurrentPage > 0;
  const canNext = mode === "vertical" ? true : studyCurrentPage < total - 1;
  $("studyPrevBtn").disabled = !canPrev;
  $("studyNextBtn").disabled = !canNext;
  const american = studyPrefs.american;
  $("studyNextBtn").textContent = tr(american ? "studyNextRightOnly" : "studyNext");
  $("studyPrevBtn").textContent = tr(american ? "studyPreviousLeftOnly" : "studyPrevious");
  studyRefreshCoverButtons();
}
function studyNormalizePage(page) {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return 0;
  const last = Math.max(0, studyCurrentBook.pages.length - 1);
  let index = Math.max(0, Math.min(last, Math.round(Number(page) || 0)));
  if (studyPrefs.imageMode === "spread") index = Math.min(last, Math.floor(index / 2) * 2);
  return index;
}
function studyJumpToPage(page, restoreVertical = false) {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return;
  studyCurrentPage = studyNormalizePage(page);
  studySyncPageCount();
  if (studyPrefs.imageMode === "vertical") {
    const target = $("studyVerticalPages").querySelector(`[data-page-index="${studyCurrentPage}"]`);
    if (target && typeof target.scrollIntoView === "function") target.scrollIntoView({ block:restoreVertical ? "start" : "center", behavior:restoreVertical ? "auto" : "smooth" });
    else if (!target) $("studyImageStage").scrollTop = 0;
    return;
  }
  studyRenderImagePage();
}
async function studyRenderImagePage() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "image") return;
  $("studyImageStage").dataset.mode = studyPrefs.imageMode;
  if (studyPrefs.imageMode === "vertical") {
    for (const id of ["studyPageSingle", "studyPageLeft", "studyPageRight"]) studyClearImage($(id));
    $("studySingleWrap").hidden = true; $("studySpreadWrap").hidden = true; $("studyVerticalPages").hidden = false;
    studyBuildVerticalPages();
    const target = $("studyVerticalPages").children[studyCurrentPage];
    if (target && typeof target.scrollIntoView === "function") requestAnimationFrame(() => { target.scrollIntoView({ block:"start", behavior:"auto" }); studyVerticalScroll(); });
    else studyVerticalScroll();
    studySyncPageCount(); studyApplyZoom(false); return;
  }
  studyClearVerticalPages();
  $("studyVerticalPages").hidden = true;
  const token = ++studyRenderToken;
  if (studyPrefs.imageMode === "spread") {
    studyClearImage($("studyPageLeft")); studyClearImage($("studyPageRight"));
    $("studySingleWrap").hidden = true; $("studySpreadWrap").hidden = false;
    const leftIndex = studyPrefs.american ? studyCurrentPage : studyCurrentPage + 1;
    const rightIndex = studyPrefs.american ? studyCurrentPage + 1 : studyCurrentPage;
    await Promise.all([studyLoadPageImage($("studyPageLeft"), leftIndex, book), studyLoadPageImage($("studyPageRight"), rightIndex, book)]);
  } else {
    studyClearImage($("studyPageSingle"));
    $("studySingleWrap").hidden = false; $("studySpreadWrap").hidden = true;
    await studyLoadPageImage($("studyPageSingle"), studyCurrentPage, book);
  }
  if (token === studyRenderToken) { studySyncPageCount(); studyApplyZoom(false); }
}
function studyBuildVerticalPages() {
  const book = studyCurrentBook, box = $("studyVerticalPages");
  const cacheKey = book ? `${book.id}:${book.generation}:${studyPrefs.imageOrder}` : "";
  if (!book || studyVerticalBookId === cacheKey) return;
  studyClearVerticalPages();
  studyVerticalBookId = cacheKey;
  for (let index = 0; index < book.pages.length; index++) {
    const page = studyPageAt(book, index);
    const item = el("div", "study-vertical-item"); item.dataset.pageIndex = String(index);
    const img = el("img", "study-page-image study-vertical-image"); img.alt = `${book.title} — ${page ? page.name : index + 1} (${index + 1})`;
    img.loading = "lazy"; img.draggable = false; item.append(img); box.append(item);
  }
  if ("IntersectionObserver" in window) {
    studyVerticalObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const img = entry.target.querySelector("img"), index = Number(entry.target.dataset.pageIndex);
        if (entry.isIntersecting) {
          if (!img.dataset.studyObjectUrl) studyLoadPageImage(img, index, book);
          const r = entry.target.getBoundingClientRect(), stageRect = $("studyImageStage").getBoundingClientRect();
          if (r.top <= stageRect.top + stageRect.height * .55 && r.bottom >= stageRect.top + stageRect.height * .18) {
            studyCurrentPage = index; studySyncPageCount();
          }
        } else studyClearImage(img);
      }
    }, { root:$("studyImageStage"), rootMargin:"120% 0px" });
    for (const item of box.children) studyVerticalObserver.observe(item);
  } else studyVerticalScroll();
}

/* ============ 画像の拡大 ============ */
function studySnapZoom(value) {
  const number = Number(value) || 1;
  let best = STUDY_ZOOM_STEPS[0];
  for (const step of STUDY_ZOOM_STEPS) if (Math.abs(step - number) < Math.abs(best - number)) best = step;
  return best;
}
function studyApplyZoomValue(value) {
  const zoom = Math.max(STUDY_ZOOM_STEPS[0], Math.min(STUDY_ZOOM_STEPS[STUDY_ZOOM_STEPS.length - 1], Number(value) || 1));
  studyPrefs.zoom = Math.round(zoom * 100) / 100;
  const stage = $("studyImageStage");
  stage.style.setProperty("--study-zoom", String(studyPrefs.zoom));
  stage.dataset.zoomed = studyPrefs.zoom > 1 ? "1" : "0";
  stage.dataset.zoomActive = Math.abs(studyPrefs.zoom - 1) > .001 ? "1" : "0";
  const label = tr("studyZoomValue", { n:Math.round(studyPrefs.zoom * 100) });
  $("studyZoomLabel").textContent = label; $("studyZoomChip").textContent = label;
  $("studyZoomOut").disabled = studyPrefs.zoom <= STUDY_ZOOM_STEPS[0] + .001;
  $("studyZoomIn").disabled = studyPrefs.zoom >= STUDY_ZOOM_STEPS[STUDY_ZOOM_STEPS.length - 1] - .001;
}
function studyApplyZoom(notify) {
  studyApplyZoomValue(studyPrefs.zoom);
  if (notify && Math.abs(studyPrefs.zoom - 1) > .001) studySetStatus("studyZoomHint");
}
function studyStepZoom(direction) {
  const index = STUDY_ZOOM_STEPS.indexOf(studySnapZoom(studyPrefs.zoom));
  const next = STUDY_ZOOM_STEPS[Math.max(0, Math.min(STUDY_ZOOM_STEPS.length - 1, (index < 0 ? 2 : index) + direction))];
  studySetZoom(next, true);
}
function studySetZoom(value, save = true) {
  studyApplyZoomValue(value);
  if (save) studySavePrefs();
  return studyPrefs.zoom;
}
function studyZoomReset() { studySetZoom(1, true); studySetStatus("studyZoomHint"); }
function studySyncZoomRow() {
  const visible = !!studyCurrentBook && studyCurrentBook.kind === "image" && studyPrefs.imageMode !== "vertical";
  $("studyZoomGroup").hidden = !visible;
  if (visible) studyApplyZoomValue(studyPrefs.zoom);
}

/* ============ 文章の表示 ============ */
function studySegments(book) { return STUDY_UTIL.aozoraSegments(book && book.content || ""); }
/* 表示に使う文字列（ルビの読みは含めない）。検索位置はこの文字列を基準に数える。 */
function studySearchText(book) { return studySegments(book).map(part => part.ruby || part.text).join(""); }
function studyRenderTextContent(book) {
  const target = $("studyTextPage");
  target.textContent = "";
  const frag = document.createDocumentFragment();
  for (const part of studySegments(book)) {
    if (part.ruby) {
      const ruby = document.createElement("ruby"); ruby.append(document.createTextNode(part.ruby));
      const rt = document.createElement("rt"); rt.textContent = part.reading; ruby.append(rt); frag.append(ruby);
    } else frag.append(document.createTextNode(part.text));
  }
  target.append(frag);
}
function studySyncTextProgress() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || $("studyMemoEditor").hidden === false) return;
  const node = $("studyTextPage"), genko = studyPrefs.theme === "genko";
  const extent = genko ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
  const offset = genko ? Math.abs(node.scrollLeft) : node.scrollTop;
  const percent = extent > 0 ? Math.max(0, Math.min(100, Math.round(offset / extent * 100))) : 0;
  const stats = STUDY_UTIL.textStats(studyCurrentBook.content);
  $("studyTextProgress").hidden = false; $("studyTextProgress").textContent = tr("studyTextProgress", { n:percent });
  $("studyTextStats").hidden = false; $("studyTextStats").textContent = tr("studyTextStats", stats);
}
function studyScrollText(direction) {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || !$("studyMemoEditor").hidden) return;
  const node = $("studyTextPage"), genko = studyPrefs.theme === "genko", step = direction * Math.max(160, (genko ? node.clientWidth : node.clientHeight) * .82);
  /* 古い WebView には scrollBy/scrollTo が無いことがあるので、その場合は直接動かします。 */
  if (typeof node.scrollBy === "function") {
    if (genko) node.scrollBy({ left:-step, behavior:"smooth" });
    else node.scrollBy({ top:step, behavior:"smooth" });
  } else if (genko) node.scrollLeft -= step;
  else node.scrollTop += step;
  setTimeout(studySyncTextProgress, 250);
}
function studyTextEdges(edge) {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || !$("studyMemoEditor").hidden) return;
  const node = $("studyTextPage"), genko = studyPrefs.theme === "genko";
  const target = edge === "start" ? 0 : (genko ? node.scrollWidth : node.scrollHeight);
  if (typeof node.scrollTo === "function") node.scrollTo(genko ? { left:target, behavior:"smooth" } : { top:target, behavior:"smooth" });
  else if (genko) node.scrollLeft = target;
  else node.scrollTop = target;
  setTimeout(studySyncTextProgress, 250);
}

/* ============ 本文の検索 ============ */
function studySyncFindRow() {
  const book = studyCurrentBook;
  const visible = !!book && book.kind === "text" && $("studyMemoEditor").hidden;
  $("studyFindRow").hidden = !visible || $("studyRoom").classList.contains("study-fullimage");
}
function studyUpdateSearchCount() {
  const node = $("studyFindCount"), state = studySearchState;
  if (!state.query) { node.textContent = ""; node.dataset.state = ""; return; }
  if (!state.marks.length) { node.textContent = tr("studyBookSearchNone"); node.dataset.state = "none"; return; }
  node.dataset.state = "";
  node.textContent = tr("studyBookSearchCount", { n:state.index + 1, m:state.marks.length }) + (state.capped ? "+" : "");
}
/* ひとつのテキストノードの中だけで一致を着色する（ルビをまたぐ一致は着色しない）。 */
function studyHighlightMatchesInNode(node, query, budget) {
  const positions = STUDY_UTIL.findMatches(node.nodeValue, query, budget);
  let count = 0;
  for (let i = positions.length - 1; i >= 0; i--) {
    const start = positions[i], end = start + query.length;
    if (end > node.nodeValue.length) continue;
    const tail = node.splitText(start);
    tail.splitText(end - start);
    const mark = document.createElement("mark");
    mark.className = "study-search-hit";
    if (tail.parentNode) { tail.parentNode.insertBefore(mark, tail); mark.append(tail); count++; }
  }
  return count;
}
function studyClearSearchMarks() {
  const page = $("studyTextPage");
  for (const mark of [...page.querySelectorAll("mark.study-search-hit")]) {
    const parent = mark.parentNode;
    if (!parent) continue;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}
function studyRunSearch(query) {
  const page = $("studyTextPage"), text = String(query || "");
  studyClearSearchMarks();
  studySearchState = { query:text, marks:[], index:-1, capped:false };
  if (text) {
    const needle = text.toLocaleLowerCase(), walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === "RT") return NodeFilter.FILTER_REJECT;
        if (typeof parent.closest === "function" && parent.closest("mark.study-search-hit")) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.toLocaleLowerCase().includes(needle) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    let total = 0;
    for (const textNode of nodes) {
      if (total >= STUDY_SEARCH_MARK_MAX) { studySearchState.capped = true; break; }
      total += studyHighlightMatchesInNode(textNode, text, STUDY_SEARCH_MARK_MAX - total);
    }
    studySearchState.marks = [...page.querySelectorAll("mark.study-search-hit")];
    studySearchState.index = studySearchState.marks.length ? 0 : -1;
    if (studySearchState.index >= 0) studySearchGo(0, true);
  }
  studyUpdateSearchCount();
}
function studySearchGo(index, quiet) {
  const marks = studySearchState.marks;
  if (!marks.length) { studyUpdateSearchCount(); return; }
  studySearchState.index = ((index % marks.length) + marks.length) % marks.length;
  marks.forEach((mark, i) => { if (i === studySearchState.index) mark.dataset.current = "1"; else delete mark.dataset.current; });
  const current = marks[studySearchState.index];
  /* 作文用紙スキンは横スクロールなので、縦横どちらでも近づくようにしておきます。 */
  if (!quiet && current && typeof current.scrollIntoView === "function") current.scrollIntoView({ block:"center", inline:"center", behavior:"smooth" });
  studyUpdateSearchCount();
}
function studyEndSearch() {
  studyClearSearchMarks();
  studySearchState = { query:"", marks:[], index:-1, capped:false };
  $("studyFindInput").value = ""; studyUpdateSearchCount();
  if (studyCurrentBook && studyCurrentBook.kind === "text" && $("studyMemoEditor").hidden) $("studyTextPage").focus({ preventScroll:true });
}
function studyFocusSearch() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "text" || !$("studyMemoEditor").hidden) { studyNotify("studyMemoNeedText"); return; }
  $("studyFindRow").hidden = false;
  $("studyFindInput").focus({ preventScroll:true }); $("studyFindInput").select();
  studySetStatus("studyBookSearchHint");
}

/* ============ 本を開く・閉じる ============ */
function studyRenderCurrentBook() {
  const book = studyCurrentBook;
  if (!book) return;
  studyClearPageImages(); studyEndSearch();
  const isImage = book.kind === "image";
  $("studyImageStage").hidden = !isImage; $("studyTextStage").hidden = isImage;
  $("studyImageModeRow").hidden = !isImage; $("studyImageOrderRow").hidden = !isImage;
  $("studyAmericanRow").hidden = !isImage; $("studyThemeRow").hidden = isImage;
  $("studyTextTuneRow").hidden = isImage; $("studyProgressWrap").hidden = !isImage;
  $("studyTextProgress").hidden = isImage; $("studyTextStats").hidden = isImage;
  $("studyAssignCoverBtn").hidden = !isImage; $("studyFullscreenBtn").hidden = !isImage;
  $("studyCurrentTitle").textContent = book.title;
  $("studyCurrentMeta").textContent = isImage ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:book.pages.length })}`
    : `${tr("studyBookText")} · ${String(book.extension || "TXT").toUpperCase()}`;
  $("studyMemoBtn").hidden = isImage;
  $("studyMemoExportBtn").hidden = isImage;
  $("studyTextStage").dataset.theme = studyPrefs.theme;
  $("studyMemoEditor").hidden = true; $("studyMemoEditor").readOnly = false;
  $("studyTextPage").hidden = false; $("studyEditorNotice").hidden = true;
  $("studyMemoBtn").textContent = tr("studyMemoEdit");
  if (isImage) {
    studyCurrentPage = studyNormalizePage(book.bookmark ? book.bookmark.index : 0);
    studyRenderImagePage();
  } else {
    studyRenderTextContent(book);
    const bookmark = book.bookmark;
    requestAnimationFrame(() => {
      const node = $("studyTextPage");
      if (bookmark) { node.scrollTop = bookmark.top || 0; node.scrollLeft = bookmark.left || 0; }
      studySyncTextProgress();
    });
  }
  studySyncCurrentBookControls(); studySyncFindRow(); studyApplyTVLayout(); studyApplyZoom(false);
}
function studySyncCurrentBookControls() {
  const book = studyCurrentBook;
  $("studyImageMode").value = studyPrefs.imageMode;
  $("studyImageOrder").value = studyPrefs.imageOrder;
  $("studyAmerican").checked = studyPrefs.american;
  $("studyTheme").value = studyPrefs.theme;
  $("studyTvCheck").checked = studyPrefs.tvEnabled;
  $("studyTvPosition").value = studyPrefs.tvPosition;
  $("studyMemoBtn").hidden = !book || book.kind !== "text";
  $("studyFullscreenBtn").textContent = tr($("studyRoom").classList.contains("study-fullimage") ? "studyFullscreenExit" : "studyFullscreen");
  $("studyFullscreenBtn").hidden = !book || book.kind !== "image";
  studySyncZoomRow();
  if (book && book.kind === "image") studySyncPageCount();
}
async function studyOpenBook(book) {
  if (!book || studyClosePending) return;
  if (studyCurrentBook && !$("studyMemoEditor").hidden) {
    if (studyCurrentBook.id === book.id) return;
    if (!await studyFlushMemo(true)) { $("studyMemoEditor").focus({ preventScroll:true }); return; }
  }
  studyCurrentBook = book;
  $("studyBookView").hidden = false; studySyncWelcome();
  studyRenderCurrentBook();
  (book.kind === "image" ? $("studyImageStage") : $("studyTextPage")).focus({ preventScroll:true });
  studySetStatus(null);
}
async function studyBackToShelf() {
  if (studyClosePending) return false;
  if (!$("studyMemoEditor").hidden) {
    if (!await studyFlushMemo(true)) { $("studyMemoEditor").focus({ preventScroll:true }); return false; }
    $("studyMemoEditor").readOnly = false; $("studyMemoEditor").hidden = true;
    $("studyEditorNotice").hidden = true; $("studyTextPage").hidden = false; $("studyMemoExportBtn").hidden = true;
    $("studyMemoBtn").textContent = tr("studyMemoEdit");
  }
  studyEndSearch(); studyCurrentBook = null; studyClearPageImages();
  $("studyBookView").hidden = true;
  studySyncWelcome();
  studyApplyTVLayout();
  return true;
}
function studySaveBook(book) {
  if (!book) return Promise.resolve();
  book.updatedAt = Date.now();
  return studyDBRun("books", "readwrite", store => store.put(book, book.id)).then(studyRefreshBooks);
}
function studyBookmarkData() {
  const book = studyCurrentBook;
  if (!book) return null;
  if (book.kind === "image") return { index:studyCurrentPage, top:0, left:0, ratio:0, savedAt:Date.now() };
  if (!$("studyMemoEditor").hidden) return { index:0, top:0, left:0, ratio:0, savedAt:Date.now() };
  const node = $("studyTextPage"), genko = studyPrefs.theme === "genko";
  const extent = genko ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
  const offset = genko ? Math.abs(node.scrollLeft) : node.scrollTop;
  return { index:0, top:Math.max(0, node.scrollTop), left:node.scrollLeft, ratio:extent > 0 ? Math.max(0, Math.min(1, offset / extent)) : 0, savedAt:Date.now() };
}
async function studySaveBookmark() {
  if (!studyCurrentBook) return;
  studyCurrentBook.bookmark = studyBookmarkData();
  try { await studySaveBook(studyCurrentBook); studyNotify("studyBookmarkSaved"); }
  catch (error) { studyFail(error, "studyBookmarkError"); }
}
function studyStep(direction) {
  if (!studyCurrentBook) return;
  if (studyCurrentBook.kind === "text") { studyScrollText(direction); return; }
  if (studyPrefs.imageMode === "vertical") {
    const stage = $("studyImageStage"), amount = direction * Math.max(240, stage.clientHeight * .84);
    if (typeof stage.scrollBy === "function") stage.scrollBy({ top:amount, behavior:"smooth" });
    else stage.scrollTop += amount;
    return;
  }
  const step = studyPrefs.imageMode === "spread" ? 2 : 1;
  studyJumpToPage(studyCurrentPage + direction * step);
}
function studyStepPhysical(side) {
  const left = side === "left", american = studyPrefs.american && studyCurrentBook && studyCurrentBook.kind === "image";
  const next = american ? !left : left;
  studyStep(next ? 1 : -1);
}
function studyJumpFromSlider() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return;
  studyJumpToPage(Number($("studyProgress").value), true);
}
function studyShowProgress() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return;
  $("studyProgressWrap").hidden = false; $("studyRoom").classList.add("study-progress-visible");
  $("studyProgress").focus({ preventScroll:true }); studySetStatus("studyProgressHint");
}
function studyHideProgress() {
  $("studyProgressWrap").hidden = true; $("studyRoom").classList.remove("study-progress-visible");
  if (studyRoomOpen && studyCurrentBook && studyCurrentBook.kind === "image") $("studyImageStage").focus({ preventScroll:true });
  studySetStatus(null);
}

/* ============ TVペイン（今の曲を流し見する） ============ */
function studySaveVideoHome() {
  if (studyVideoHomeParent && studyVideoHomeParent.isConnected && !$("studyTvScreen").contains(video)) return;
  studyVideoHomeParent = video.parentNode && video.parentNode.nodeType === 1 ? video.parentNode : document.body;
  studyVideoHomeNext = video.nextSibling; studyVideoHomeStyle = video.getAttribute("style");
}
function studyMoveVideoToTV() {
  if (!video || !$("studyTvScreen")) return;
  studySaveVideoHome();
  if (video.parentNode !== $("studyTvScreen")) $("studyTvScreen").insertBefore(video, $("studyTvArt"));
  video.classList.add("study-tv-video-visible");
  try { if (typeof newVideoFilter === "function") video.style.filter = newVideoFilter(); } catch (_) {}
}
function studyRestoreVideoHome() {
  if (!video) return;
  const home = studyVideoHomeParent && studyVideoHomeParent.isConnected ? studyVideoHomeParent : document.body;
  if (video.parentNode !== home) {
    const before = studyVideoHomeNext && studyVideoHomeNext.parentNode === home ? studyVideoHomeNext : null;
    home.insertBefore(video, before);
  }
  video.classList.remove("study-tv-video-visible", "study-tv-video-hidden");
  if (studyVideoHomeStyle == null) video.removeAttribute("style"); else video.setAttribute("style", studyVideoHomeStyle);
  /* 次に開くときは、そのときの置き場所をもう一度調べ直す（TVドックが作り直されていても迷子にならない）。 */
  studyVideoHomeParent = null; studyVideoHomeNext = null; studyVideoHomeStyle = null;
}
function studyApplyTVLayout() {
  const active = studyRoomOpen && !!studyCurrentBook && !$("studyBookView").hidden && studyPrefs.tvEnabled && studyPrefs.tvPosition !== "off";
  const pane = $("studyTvPane"), panels = $("studyPanels"), content = $("studyContentPane");
  pane.hidden = !active;
  if (!active) { studyRestoreVideoHome(); return; }
  if (studyPrefs.tvPosition === "top") panels.insertBefore(pane, content);
  else if (content.nextElementSibling !== pane) panels.insertBefore(pane, content.nextElementSibling);
  studyMoveVideoToTV(); studyRefreshTV();
}
function studySetTVVisible(hasVideo, hasImage) {
  video.classList.toggle("study-tv-video-hidden", !hasVideo);
  $("studyTvArt").hidden = !hasImage;
  $("studyTvEmpty").hidden = hasVideo || hasImage;
}
async function studyRefreshTV() {
  const token = ++studyTVToken;
  if (!studyRoomOpen || !studyCurrentBook || !studyPrefs.tvEnabled || studyPrefs.tvPosition === "off") return;
  const song = currentSong;
  $("studyTvLabel").textContent = song ? (song.title || song.key) : "";
  const hasVideo = !!(typeof videoReady !== "undefined" && videoReady && video.videoWidth > 0 && video.videoHeight > 0 && settings.videoStyle !== "off");
  if (hasVideo) { studySetTVVisible(true, false); return; }
  let blob = null;
  if (song && window.TrkStudyRoom) blob = await studyGetSongCoverBlob(song.key);
  if (!studyIsBlob(blob) && song && song.bgBlob) blob = song.bgBlob;
  if (!studyIsBlob(blob)) blob = null;
  if (token !== studyTVToken || !studyRoomOpen) return;
  const artKey = song && song.key || "";
  if (blob) {
    if (studyTVArtSong !== artKey || !studyTVArtUrl) {
      studyClearImage($("studyTvArt"));
      studyTVArtUrl = studySetImage($("studyTvArt"), blob, song ? (song.title || song.key) : "") ? ($("studyTvArt").dataset.studyObjectUrl || "") : "";
    }
    studyTVArtSong = artKey; studySetTVVisible(false, true);
  } else {
    studyClearImage($("studyTvArt")); studyTVArtUrl = "";
    studyTVArtSong = artKey; studySetTVVisible(false, false);
  }
}
function studySyncTVDirection() {
  let position = $("studyTvPosition").value, enabled = $("studyTvCheck").checked;
  if (enabled && position === "off") { position = "top"; $("studyTvPosition").value = position; }
  if (position === "off") enabled = false;
  studyPrefs.tvEnabled = enabled; studyPrefs.tvPosition = position;
  $("studyTvCheck").checked = enabled; studySavePrefs(); studyApplyTVLayout();
}
function studyCycleTV() {
  const enabled = studyPrefs.tvEnabled, position = studyPrefs.tvPosition;
  if (!enabled || position === "off") { studyPrefs.tvEnabled = true; studyPrefs.tvPosition = "top"; }
  else if (position === "top") studyPrefs.tvPosition = "bottom";
  else { studyPrefs.tvEnabled = false; studyPrefs.tvPosition = "off"; }
  $("studyTvCheck").checked = studyPrefs.tvEnabled; $("studyTvPosition").value = studyPrefs.tvPosition;
  studySavePrefs(); studyApplyTVLayout();
}

/* ============ 曲のジャケット ============ */
async function studyAssignCurrentCover() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "image" || !book.pages.length) { studyNotify("studyCoverNeedImage"); return; }
  if (!currentSong) { studyNotify("studyCoverNeedSong"); return; }
  const songKey = currentSong.key, songTitle = currentSong.title || currentSong.key;
  const index = Math.max(0, Math.min(book.pages.length - 1, studyCurrentPage)), page = studyPageAt(book, index);
  if (!page) { studyNotify("studyCoverNeedImage"); return; }
  try {
    const blob = await studyDBRun("pages", "readonly", store => store.get(page.key));
    if (!blob) throw new Error("Missing Study image");
    await studyDBRun("covers", "readwrite", store => store.put({ bookId:book.id, pageKey:page.key, pageIndex:index, title:book.title, updatedAt:Date.now() }, songKey));
    emit("studyCoverChanged", songKey);
    if (typeof setBackground === "function" && currentSong && currentSong.key === songKey) await window.Trk.media.setBackground(blob);
    studyNotify("studyCoverAssigned", { title:songTitle });
    studyRefreshTV(); studyRefreshCoverButtons();
  } catch (error) { studyFail(error, "studyCoverError"); }
}
async function studyGetSongCoverInfo(songKey) {
  if (studySafeMode() || typeof songKey !== "string" || !songKey || songKey.length > 512) return null;
  try {
    const art = await studyDBRun("covers", "readonly", store => store.get(songKey));
    if (!art || typeof art.pageKey !== "string") return null;
    return { bookId:String(art.bookId || ""), pageKey:art.pageKey, pageIndex:Math.max(0, Number(art.pageIndex) || 0),
      title:String(art.title || ""), updatedAt:Math.max(0, Number(art.updatedAt) || 0) };
  } catch (_) { return null; }
}
async function studyGetSongCoverBlob(songKey) {
  if (studySafeMode() || typeof songKey !== "string" || !songKey || songKey.length > 512) return null;
  try {
    const art = await studyDBRun("covers", "readonly", store => store.get(songKey));
    if (!art || typeof art.pageKey !== "string") return null;
    const page = await studyDBRun("pages", "readonly", store => store.get(art.pageKey));
    return studyIsBlob(page) ? page : null;
  } catch (_) { return null; }
}
async function studyClearSongCover(songKey) {
  const key = typeof songKey === "string" && songKey ? songKey : currentSong && currentSong.key;
  if (!key) { studyNotify("studyCoverNeedSong"); return false; }
  try {
    const info = await studyGetSongCoverInfo(key);
    if (!info) { studyNotify("studyCoverNeedCover"); return false; }
    await studyDBRun("covers", "readwrite", store => store.delete(key));
    emit("studyCoverChanged", key);
    if (typeof setBackground === "function" && currentSong && currentSong.key === key) {
      const song = currentSong;
      if (song.bgBlob) await window.Trk.media.setBackground(song.bgBlob); else await window.Trk.media.setBackground(null);
    }
    studyNotify("studyCoverCleared");
    studyRefreshTV(); studyRefreshCoverButtons();
    return true;
  } catch (error) { studyFail(error, "studyCoverError"); return false; }
}
async function studyRefreshCoverButtons() {
  const song = currentSong, assign = $("studyAssignCoverBtn"), clear = $("studyClearCoverBtn");
  assign.disabled = !song;
  assign.title = song ? tr("studyAssignCover") : tr("studyCoverNeedSong");
  clear.hidden = true;
  if (!song || !studyRoomOpen) return;
  const info = await studyGetSongCoverInfo(song.key);
  if (!currentSong || currentSong.key !== song.key) return;
  if (info) {
    clear.hidden = false;
    clear.title = tr("studyCoverSource", { title:info.title || "?", n:info.pageIndex + 1 });
  }
}
function studyCreateFolder() {
  if (!studyDataReady) { studyReadyPromise.then(() => { if (studyDataReady) studyCreateFolder(); }); return; }
  if (studyShelfFolders.length >= STUDY_FOLDER_MAX) { studyNotify("studyFolderLimit"); return; }
  const value = prompt(tr("studyCreateFolderPrompt"), "");
  if (value == null) return;
  const name = String(value).trim().slice(0, 120);
  if (!name) { studyNotify("studyFolderNameRequired"); return; }
  if (studyShelfFolders.some(folder => folder.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { studyNotify("studyFolderDuplicate"); return; }
  let id = `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  while (studyFolderById(id)) id = `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const now = Date.now();
  const folder = { id, name, createdAt:now, updatedAt:now };
  studyShelfFolders.push(folder); studyShelfContainer("").push(studyShelfItemKey("folder", id));
  studyShelfViewFolder = ""; studyShelfShown = STUDY_SHELF_PAGE; $("studySearch").value = "";
  studyRefreshEditedTextFolderSelect(); studySaveShelfMeta(); studyRenderShelf(); studyNotify("studyFolderCreated");
}
function studyRenameFolder(folder) {
  if (!folder) return;
  const value = prompt(tr("studyRenameFolderPrompt"), folder.name);
  if (value == null) return;
  const name = String(value).trim().slice(0, 120);
  if (!name) { studyNotify("studyFolderNameRequired"); return; }
  if (studyShelfFolders.some(item => item.id !== folder.id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    studyNotify("studyFolderDuplicate"); return;
  }
  folder.name = name; folder.updatedAt = Date.now();
  studyRefreshEditedTextFolderSelect(); studySaveShelfMeta(); studyRenderShelf(); studyNotify("studyRenamed");
}
function studyDeleteFolder(folder) {
  if (!folder) return;
  const root = studyShelfContainer(""), inside = studyShelfContainer(folder.id).slice();
  for (const key of inside) {
    if (!key.startsWith("book:")) continue;
    const bookId = key.slice(5);
    if (!studyBooks.some(book => book.id === bookId)) continue;
    studyBookFolder[bookId] = "";
    if (!root.includes(key)) root.push(key);
  }
  const folderKey = studyShelfItemKey("folder", folder.id), folderIndex = root.indexOf(folderKey);
  if (folderIndex >= 0) root.splice(folderIndex, 1);
  studyShelfFolders = studyShelfFolders.filter(item => item.id !== folder.id);
  delete studyShelfOrder[folder.id];
  if (studyShelfViewFolder === folder.id) studyShelfViewFolder = "";
  studyRefreshEditedTextFolderSelect(); studySaveShelfMeta(); studyRenderShelf(); studyNotify("studyFolderDeleted");
}
async function studyRenameBook(book) {
  const next = prompt(tr("studyRenamePrompt"), book.title);
  if (next == null) return;
  const title = String(next).trim().slice(0, 160);
  if (!title) return;
  book.title = title;
  if (studyCurrentBook && studyCurrentBook.id === book.id) $("studyCurrentTitle").textContent = title;
  try { await studySaveBook(book); studyNotify("studyRenamed"); }
  catch (error) { studyFail(error); }
}
async function studyDeleteBook(book) {
  if (!studyPrefs.skipDeleteConfirm && !confirm(tr("studyDeleteConfirm", { title:book.title }))) return;
  try {
    if (studyCurrentBook && studyCurrentBook.id === book.id && !await studyBackToShelf()) return;
    await studyDBRun("books", "readwrite", store => store.delete(book.id));
    const pageKeys = book.pages.map(page => page.key);
    if (pageKeys.length) await studyDBDeleteMany("pages", pageKeys);
    const removedSongs = [];
    for (const [songKey, art] of await studyDBPairs("covers")) if (art && art.bookId === book.id) {
      removedSongs.push(songKey); await studyDBRun("covers", "readwrite", store => store.delete(songKey));
    }
    await studyRefreshBooks();
    for (const songKey of removedSongs) emit("studyCoverChanged", songKey);
    studyNotify("studyDeleted");
  } catch (error) { studyFail(error); }
}

/* ============ テキスト編集と書き出し ============ */
function studySetEditorStatus(key, force = false) {
  const status = $("studyEditorSaveStatus");
  if (!force && status.dataset.state === key) return;
  status.dataset.state = key; status.textContent = tr(key);
}
function studyUpdateEditorStats() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text") return;
  const text = $("studyMemoEditor").hidden ? studyCurrentBook.content : $("studyMemoEditor").value;
  $("studyEditorStats").textContent = tr("studyTextStats", STUDY_UTIL.textStats(text));
}
async function studyFlushMemo(seal = false) {
  clearTimeout(studyMemoSaveTimer); studyMemoSaveTimer = 0;
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || $("studyMemoEditor").hidden) return true;
  const editor = $("studyMemoEditor"), book = studyCurrentBook;
  if (seal) editor.readOnly = true;
  const content = editor.value;
  book.content = content;
  studySetEditorStatus("studyEditorSaving");
  try {
    await studySaveBook(book);
    const filed = await studyApplyEditedTextFolder(book);
    if (editor.value !== content) {
      studySetEditorStatus("studyEditorUnsaved"); studyUpdateEditorStats();
      return true;
    }
    studySetEditorStatus("studyEditorSaved"); studyUpdateEditorStats();
    studySetStatus(filed === false ? "studyEditedTextFolderSaveFailed" : "studyMemoSaved");
    return true;
  } catch (error) {
    if (seal) editor.readOnly = false;
    studySetEditorStatus("studyEditorSaveFailed"); studyFail(error, "studyMemoSaveError");
    return false;
  }
}
function studyMemoInput() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text") return;
  studyCurrentBook.content = $("studyMemoEditor").value;
  studySetEditorStatus("studyEditorUnsaved");
  clearTimeout(studyMemoSaveTimer); studyMemoSaveTimer = setTimeout(studyFlushMemo, 800);
}
function studyToggleMemo() {
  if (studyClosePending) return;
  const book = studyCurrentBook;
  if (!book || book.kind !== "text") { studyNotify("studyMemoNeedText"); return; }
  const editor = $("studyMemoEditor"), editing = editor.hidden, button = $("studyMemoBtn");
  if (editing) {
    studyEndSearch();
    editor.value = book.content || "";
    editor.spellcheck = ["txt", "md", "markdown"].includes(String(book.extension || "").toLowerCase());
    editor.readOnly = false; editor.hidden = false;
    $("studyEditorNotice").hidden = false; $("studyTextPage").hidden = true;
    button.textContent = tr("studyMemoDone"); $("studyMemoExportBtn").hidden = false;
    studySetEditorStatus("studyEditorSaved", true); studyUpdateEditorStats(); studySyncFindRow();
    editor.focus({ preventScroll:true });
  } else {
    button.disabled = true;
    studyFlushMemo(true).then(saved => {
      button.disabled = false;
      if (!saved) { editor.focus({ preventScroll:true }); return; }
      editor.readOnly = false; editor.hidden = true; $("studyEditorNotice").hidden = true; $("studyTextPage").hidden = false;
      button.textContent = tr("studyMemoEdit"); $("studyMemoExportBtn").hidden = false;
      studyRenderTextContent(book); studySyncTextProgress(); studySyncFindRow();
    });
  }
}
async function studyWriteExportCopy(directory, blob, title, extension) {
  const safeTitle = String(title || "notes").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 80) || "notes";
  const rawExtension = String(extension || "txt").toLowerCase();
  const ext = /^[a-z0-9]{1,16}$/.test(rawExtension) ? rawExtension : "txt";
  const token = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  const stem = `${safeTitle} - edited-${Date.now().toString(36)}-${token}`;
  let filename = "", available = false;
  for (let index = 1; index <= 1000; index++) {
    const candidate = `${stem}${index === 1 ? "" : ` (${index})`}.${ext}`;
    try { await directory.getFileHandle(candidate); }
    catch (error) {
      if (!error || error.name !== "NotFoundError") throw error;
      filename = candidate; available = true; break;
    }
  }
  if (!available) throw new Error("Could not find an unused export filename");
  const fileHandle = await directory.getFileHandle(filename, { create:true });
  const writable = await fileHandle.createWritable();
  try { await writable.write(blob); await writable.close(); }
  catch (error) { if (typeof writable.abort === "function") { try { await writable.abort(); } catch (_) {} } throw error; }
  return filename;
}
async function studyChooseExportDirectory() {
  if (!studyCanChooseExportFolder()) { studyRefreshExportFolderUI(); return; }
  try {
    studyExportDirectory = await window.showDirectoryPicker({ id:"trk-study-text-export", mode:"readwrite" });
    studyRefreshExportFolderUI();
  } catch (error) {
    if (error && error.name === "AbortError") return;
    studyFail(error, "studyExportFolderSelectError");
  }
}
async function studyExportText() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text") return;
  const book = studyCurrentBook;
  const text = $("studyMemoEditor").hidden ? book.content : $("studyMemoEditor").value;
  const title = String(book.title || "notes").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 80) || "notes";
  const rawExtension = String(book.extension || "txt").toLowerCase();
  const ext = /^[a-z0-9]{1,16}$/.test(rawExtension) ? rawExtension : "txt";
  const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
  let fallback = false;
  if (studyExportDirectory) {
    try {
      const name = await studyWriteExportCopy(studyExportDirectory, blob, title, ext);
      studyNotify("studyExportSavedToFolder", { name, folder:studyExportDirectory.name }); return;
    } catch (error) { console.warn(error); fallback = true; }
  }
  if (typeof downloadBlob === "function") {
    downloadBlob(blob, `${title} - edited.${ext}`);
    if (fallback) studyNotify("studyExportFolderFallback");
  } else if (fallback) studyNotify("studyExportFolderFallback");
}

/* ============ ❓ キーの説明 ============ */
function studyHelpOpen() {
  if (!studyRoomOpen || !$("studyHelp").hidden) return;
  if (studyKeyCaptureAction) { studyKeyCaptureAction = ""; studyRefreshKeyAssignments(); }
  $("studyHelp").hidden = false;
  $("studyHelpCloseBtn").focus({ preventScroll:true });
}
function studyCloseHelp() {
  if ($("studyHelp").hidden) return false;
  $("studyHelp").hidden = true;
  studyPrefs.helpSeen = true; studySavePrefs();
  const target = studyCurrentBook && studyCurrentBook.kind === "image" ? $("studyImageStage")
    : studyCurrentBook ? $("studyTextPage") : $("studyCloseBtn");
  if (target) target.focus({ preventScroll:true });
  return true;
}
function studyToggleHelp() { if ($("studyHelp").hidden) studyHelpOpen(); else studyCloseHelp(); }

/* ============ キー操作 ============ */
/* 文字を打つ場所では、書斎のキー操作を止めます（入力の邪魔をしない）。 */
function studyTypingTarget(target) {
  return !!(target && typeof target.closest === "function" && target.closest("input,select,textarea,[contenteditable='true']"));
}
/* Space / Enter は、ボタンなどに焦点があるときはその要素の操作に譲ります。 */
function studyActivateTarget(target) {
  return !!(target && typeof target.closest === "function" && target.closest("button,summary,a[href],[role='button'],[role='link']"));
}
function studyEditorHandleTab(event) {
  const editor = event.target;
  if (event.code !== "Tab" || !editor || editor.id !== "studyMemoEditor") return false;
  event.preventDefault(); event.stopImmediatePropagation();
  const start = editor.selectionStart, end = editor.selectionEnd, text = editor.value;
  let changed = false;
  if (!event.shiftKey && start === end) {
    if (typeof editor.setRangeText === "function") editor.setRangeText("\t", start, end, "end");
    else { editor.value = `${text.slice(0, start)}\t${text.slice(end)}`; editor.setSelectionRange(start + 1, start + 1); }
    changed = true;
  } else {
    const firstLineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lastSelectedPosition = Math.max(start, end - 1);
    const nextLineBreak = text.indexOf("\n", lastSelectedPosition);
    const blockEnd = nextLineBreak < 0 ? text.length : nextLineBreak;
    const lines = text.slice(firstLineStart, blockEnd).split("\n");
    const replaceLines = replacement => {
      if (typeof editor.setRangeText === "function") editor.setRangeText(replacement, firstLineStart, blockEnd, "preserve");
      else editor.value = `${text.slice(0, firstLineStart)}${replacement}${text.slice(blockEnd)}`;
    };
    if (!event.shiftKey) {
      replaceLines(lines.map(line => `\t${line}`).join("\n"));
      editor.setSelectionRange(start + 1, end + lines.length); changed = true;
    } else {
      const removed = lines.map(line => (line.match(/^(?:\t| {1,4})/) || [""])[0].length);
      if (removed.some(length => length > 0)) {
        replaceLines(lines.map((line, index) => line.slice(removed[index])).join("\n"));
        const lastLineStart = firstLineStart + lines.slice(0, -1).reduce((length, line) => length + line.length + 1, 0);
        const startRemoved = Math.min(removed[0], start - firstLineStart);
        const endRemoved = removed.slice(0, -1).reduce((sum, length) => sum + length, 0) +
          Math.min(removed[removed.length - 1], Math.max(0, end - lastLineStart));
        editor.setSelectionRange(start - startRemoved, end - endRemoved); changed = true;
      }
    }
  }
  if (changed) editor.dispatchEvent(new Event("input", { bubbles:true }));
  return true;
}
function studyKeyDown(event) {
  if (!studyRoomOpen) return;
  if (studyHandleKeyCapture(event)) return;
  if (event.code === "Escape" && event.target && event.target.id === "studyMemoEditor") {
    event.preventDefault(); event.stopImmediatePropagation();
    $("studyMemoEditor").blur(); studyToggleMemo(); return;
  }
  if (event.target && event.target.id === "studyMemoEditor" && !event.shiftKey && (event.ctrlKey || event.metaKey) && event.code === "KeyS") {
    event.preventDefault(); event.stopImmediatePropagation(); studyFlushMemo(); return;
  }
  if (studyEditorHandleTab(event)) return;
  const helpOpen = !$("studyHelp").hidden;
  if (helpOpen) {
    if (event.code === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); studyCloseHelp(); return; }
    if (event.code === "Tab") {
      const card = $("studyHelp").querySelector(".study-help-card");
      const focusable = [...card.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])")]
        .filter(node => !node.hidden && node.getClientRects().length);
      const index = focusable.indexOf(document.activeElement);
      if (!focusable.length) { event.preventDefault(); $("studyHelpCloseBtn").focus(); event.stopImmediatePropagation(); return; }
      if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!event.shiftKey && (index < 0 || index === focusable.length - 1)) { event.preventDefault(); focusable[0].focus(); }
      event.stopImmediatePropagation(); return;
    }
    event.stopImmediatePropagation(); return;
  }
  if (event.code === "Escape") {
    event.preventDefault(); event.stopImmediatePropagation(); studyCloseRoom(); return;
  }
  if (event.code === "Tab") {
    const focusable = [...studyRoom.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])")]
      .filter(node => !node.hidden && node.getClientRects().length);
    if (!focusable.length) { event.preventDefault(); $("studyCloseBtn").focus(); event.stopImmediatePropagation(); return; }
    const index = focusable.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
    else if (!event.shiftKey && (index < 0 || index === focusable.length - 1)) { event.preventDefault(); focusable[0].focus(); }
    event.stopImmediatePropagation(); return;
  }
  if (studyTypingTarget(event.target)) { event.stopImmediatePropagation(); return; }
  const key = event.key || "";
  if ((event.ctrlKey || event.metaKey) && event.code === "KeyF") { event.preventDefault(); event.stopImmediatePropagation(); studyFocusSearch(); return; }
  if (key === "?" || (event.code === "Slash" && event.shiftKey)) { event.preventDefault(); event.stopImmediatePropagation(); studyToggleHelp(); return; }
  if (event.code === studyPrefs.studyNextKey || event.code === studyPrefs.studyPreviousKey) {
    event.preventDefault(); event.stopImmediatePropagation(); studyStep(event.code === studyPrefs.studyNextKey ? 1 : -1); return;
  }
  if (studyPrefs.verticalImageKeys && studyCurrentBook && studyCurrentBook.kind === "image" &&
      (event.code === "ArrowUp" || event.code === "ArrowDown")) {
    event.preventDefault(); event.stopImmediatePropagation(); studyStep(event.code === "ArrowDown" ? 1 : -1); return;
  }
  if (event.code === "PageDown") { event.preventDefault(); event.stopImmediatePropagation(); studyStep(1); return; }
  if (event.code === "PageUp") { event.preventDefault(); event.stopImmediatePropagation(); studyStep(-1); return; }
  if (event.code === "Home" || event.code === "End") {
    event.preventDefault(); event.stopImmediatePropagation();
    if (studyCurrentBook && studyCurrentBook.kind === "image") studyJumpToPage(event.code === "Home" ? 0 : Math.max(0, studyCurrentBook.pages.length - 1), true);
    else studyTextEdges(event.code === "Home" ? "start" : "end");
    return;
  }
  if (event.code === "Equal" || event.code === "NumpadAdd") { event.preventDefault(); event.stopImmediatePropagation(); studyStepZoom(1); return; }
  if (event.code === "Minus" || event.code === "NumpadSubtract") { event.preventDefault(); event.stopImmediatePropagation(); studyStepZoom(-1); return; }
  if (event.code === "Digit0" || event.code === "Numpad0") { event.preventDefault(); event.stopImmediatePropagation(); studyZoomReset(); return; }
  if (event.repeat) { event.stopImmediatePropagation(); return; }
  if (event.code === "KeyB") { event.preventDefault(); event.stopImmediatePropagation(); studyToggleBookmark(); return; }
  if (event.code === "KeyM") { event.preventDefault(); event.stopImmediatePropagation(); studyToggleBookmarkPanel(); return; }
  if (event.code === "KeyT") { event.preventDefault(); event.stopImmediatePropagation(); studyCycleTV(); return; }
  if (event.code === "KeyF") {
    event.preventDefault(); event.stopImmediatePropagation();
    if (studyCurrentBook && studyCurrentBook.kind === "image") studyToggleFullscreen();
    return;
  }
  if (event.code !== "Space" && event.code !== "Enter" && event.code !== "NumpadEnter") { event.stopImmediatePropagation(); return; }
  if (studyActivateTarget(event.target)) { event.stopImmediatePropagation(); return; }
  event.preventDefault(); event.stopImmediatePropagation();
  if (studyHeldCode) return;
  studyHeldCode = event.code; studyHoldAction = "";
  studyHoldTimer = setTimeout(() => {
    if (!studyRoomOpen || studyHeldCode !== event.code) return;
    if (event.code === "Space") {
      studyHoldAction = "held";
      if (studyCurrentBook && studyCurrentBook.kind === "image") studyShowProgress();
    } else {
      studyHoldAction = "bookmark"; studySaveBookmark();
    }
  }, 520);
}
function studyKeyUp(event) {
  if (!studyRoomOpen) return;
  event.stopImmediatePropagation();
  if (!studyHeldCode || event.code !== studyHeldCode) return;
  clearTimeout(studyHoldTimer); studyHoldTimer = 0;
  const action = studyHoldAction; studyHeldCode = ""; studyHoldAction = "";
  event.preventDefault(); event.stopImmediatePropagation();
  if (!action) studyStep(1);
}

/* ============ ポインタ（タップ／スワイプ／長押し／ピンチ／拡大中の見回し） ============ */
function studyImagePointerDown(event) {
  if (!studyRoomOpen || !studyCurrentBook || studyCurrentBook.kind !== "image" || (event.button != null && event.button !== 0)) return;
  studyPointers.set(event.pointerId, { x:event.clientX, y:event.clientY });
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}
  if (studyPointers.size >= 2) {
    clearTimeout(studyHoldTimer); studyHoldTimer = 0; studyPointerStart = null; studySuppressTapUntil = Date.now() + 400;
    const [a, b] = [...studyPointers.values()];
    studyPinchStart = Math.hypot(a.x - b.x, a.y - b.y); studyPinchZoom = studyPrefs.zoom;
    return;
  }
  const verticalItem = event.target && typeof event.target.closest === "function" ? event.target.closest(".study-vertical-item") : null;
  if (studyPrefs.imageMode === "vertical" && verticalItem) { studyCurrentPage = Number(verticalItem.dataset.pageIndex) || 0; studySyncPageCount(); }
  studyPointerStart = { x:event.clientX, y:event.clientY, id:event.pointerId, held:false, panning:false };
  clearTimeout(studyHoldTimer);
  studyHoldTimer = setTimeout(() => {
    if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
    studyPointerStart.held = true; studySuppressTapUntil = Date.now() + 900; studyAssignCurrentCover();
  }, 680);
}
function studyImagePointerMove(event) {
  const tracked = studyPointers.get(event.pointerId);
  if (tracked) { tracked.x = event.clientX; tracked.y = event.clientY; }
  if (studyPointers.size >= 2 && studyPinchStart > 0) {
    const [a, b] = [...studyPointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (distance > 0) studyApplyZoomValue(studyPinchZoom * distance / studyPinchStart);
    return;
  }
  if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
  const dx = event.clientX - studyPointerStart.x, dy = event.clientY - studyPointerStart.y;
  if (studyPrefs.zoom > 1.001 && studyPrefs.imageMode !== "vertical") {
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      clearTimeout(studyHoldTimer); studyHoldTimer = 0;
      studyPointerStart.panning = true;
      const nodes = studyPrefs.imageMode === "spread" ? [...$("studySpreadWrap").querySelectorAll(".study-spread-page")] : [$("studySingleWrap")];
      for (const node of nodes) { if (!node) continue; node.scrollLeft -= dx; node.scrollTop -= dy; }
      studyPointerStart.x = event.clientX; studyPointerStart.y = event.clientY;
      $("studyImageStage").dataset.panning = "1";
      return;
    }
  }
  if (Math.abs(dx) > 18 || Math.abs(dy) > 18) { clearTimeout(studyHoldTimer); studyHoldTimer = 0; }
}
function studyImagePointerEnd(event) {
  studyPointers.delete(event.pointerId);
  if (studyPointers.size < 2 && studyPinchStart > 0) {
    studyPinchStart = 0; studySetZoom(studySnapZoom(studyPrefs.zoom), true);
    if (Math.abs(studyPrefs.zoom - 1) > .001) studySetStatus("studyZoomHint");
  }
  delete $("studyImageStage").dataset.panning;
  if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
  clearTimeout(studyHoldTimer); studyHoldTimer = 0;
  const start = studyPointerStart; studyPointerStart = null;
  if (start.held) { studySuppressTapUntil = Date.now() + 700; return; }
  if (start.panning) { studySuppressTapUntil = Date.now() + 500; return; }
  if (event.type === "pointercancel") return;
  const dx = event.clientX - start.x, dy = event.clientY - start.y;
  if (studyPrefs.imageMode !== "vertical" && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    studySuppressTapUntil = Date.now() + 700;
    studyStepPhysical(dx < 0 ? "left" : "right");
  }
}
function studyImageTap(event) {
  if (Date.now() < studySuppressTapUntil || (event.target && typeof event.target.closest === "function" && event.target.closest("button"))) return;
  if (!studyCurrentBook || studyCurrentBook.kind !== "image" || studyPrefs.imageMode === "vertical") return;
  const rect = $("studyImageStage").getBoundingClientRect();
  studyStepPhysical(event.clientX < rect.left + rect.width / 2 ? "left" : "right");
}
function studyVerticalScroll() {
  clearTimeout(studyVerticalScrollTimer);
  studyVerticalScrollTimer = setTimeout(() => {
    const box = $("studyVerticalPages"), rect = $("studyImageStage").getBoundingClientRect(), targetY = rect.top + rect.height * .35;
    const items = [...box.children]; let best = null, bestDist = Infinity;
    for (const item of items) {
      const r = item.getBoundingClientRect(), img = item.querySelector("img"), index = Number(item.dataset.pageIndex);
      const near = r.bottom > rect.top - rect.height && r.top < rect.bottom + rect.height;
      if (!studyVerticalObserver) {
        if (near && !img.dataset.studyObjectUrl && !img.dataset.studyLoadToken) studyLoadPageImage(img, index);
        else if (!near && (img.dataset.studyObjectUrl || img.dataset.studyLoadToken)) studyClearImage(img);
      }
      if (r.bottom < rect.top || r.top > rect.bottom) continue;
      const dist = Math.abs((r.top + r.bottom) / 2 - targetY);
      if (dist < bestDist) { best = item; bestDist = dist; }
    }
    if (best) { studyCurrentPage = Number(best.dataset.pageIndex) || 0; studySyncPageCount(); }
  }, 90);
}

/* ============ 開く・閉じる ============ */
function studyOpenRoom() {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  if (studyRoomOpen) return;
  studyRoomOpen = true; window.Trk.overlay.set("study", true);
  $("studyRoom").hidden = false; document.body.classList.add("study-room-open");
  studyRefreshPrefsUI();
  studyReadyPromise.then(() => {
    studyRenderShelf(); studyRenderBookmarks(); studyRefreshShelfFoot();
    if (studyCurrentBook) { $("studyBookView").hidden = false; studySyncWelcome(); studyApplyTVLayout(); }
    studySweepOrphans().then(cleaned => { if (cleaned) studySetStatus("studyOrphanSweep", { n:cleaned }); });
  }).catch(studyFail);
  if (!studyCurrentBook) { $("studyBookView").hidden = true; studySyncWelcome(); studyApplyTVLayout(); }
  $("studyCloseBtn").focus({ preventScroll:true });
  if (!studyPrefs.helpSeen) { studyPrefs.helpSeen = true; studySavePrefs(); studyHelpOpen(); }
}
async function studyCloseRoom() {
  if (!studyRoomOpen || studyClosePending) return;
  studyClosePending = true;
  studyKeyCaptureAction = ""; studyRefreshKeyAssignments();
  const editor = $("studyMemoEditor");
  if (!editor.hidden && !await studyFlushMemo(true)) {
    studyClosePending = false; editor.focus({ preventScroll:true }); return;
  }
  editor.readOnly = false;
  clearTimeout(studyHoldTimer); studyHoldTimer = 0; studyHeldCode = ""; studyPointerStart = null;
  clearTimeout(studyShelfHoldTimer); studyShelfHoldTimer = 0; studyShelfHoldFired = false;
  studyPointers.clear(); studyPinchStart = 0;
  if (!$("studyHelp").hidden) $("studyHelp").hidden = true;
  studyEndSearch();
  studyRoomOpen = false; window.Trk.overlay.set("study", false);
  $("studyProgressWrap").hidden = true; $("studyRoom").classList.remove("study-progress-visible");
  if (document.fullscreenElement === $("studyRoom") && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  studyFullscreenFallback = false; $("studyRoom").classList.remove("study-fullimage");
  studyRoom.hidden = true; document.body.classList.remove("study-room-open");
  studyTVToken++; studyRestoreVideoHome();
  studyClearImage($("studyTvArt")); studyTVArtUrl = ""; studyTVArtSong = "";
  const title = document.querySelector("#libPanel .libHead .study-launch-title"); if (title) title.focus({ preventScroll:true });
  studyClosePending = false;
}
async function studyToggleFullscreen() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return;
  const room = $("studyRoom");
  if (room.classList.contains("study-fullimage")) {
    if (document.fullscreenElement === room && document.exitFullscreen) { try { await document.exitFullscreen(); } catch (_) {} }
    room.classList.remove("study-fullimage"); studyFullscreenFallback = false; studySyncCurrentBookControls(); studySyncFindRow(); return;
  }
  if (room.requestFullscreen) {
    try { await room.requestFullscreen(); studyFullscreenFallback = false; room.classList.add("study-fullimage"); studySyncCurrentBookControls(); studySyncFindRow(); return; }
    catch (_) { /* embedded webviews can reject fullscreen; keep a CSS-only image focus mode */ }
  }
  studyFullscreenFallback = true; room.classList.add("study-fullimage");
  studySyncCurrentBookControls(); studySyncFindRow();
}

/* ============ 配線 ============ */
const studyRoom = $("studyRoom");
function studyTranslateNodes() {
  for (const node of studyRoom.querySelectorAll("[data-i18n]")) {
    const translated = tr(node.dataset.i18n);
    if (node.tagName === "OPTGROUP") node.label = translated;
    else node.textContent = translated;
  }
}
studyTranslateNodes();
$("studySearch").placeholder = tr("studySearch");
$("studyFindInput").placeholder = tr("studyBookSearchPlaceholder");
const studyShelfTitle = $("studyShelfCreateFolder");
function studySyncShelfTitleHint() {
  studyShelfTitle.title = tr("studyFolderCreateHint");
  studyShelfTitle.setAttribute("aria-label", `${tr("studyShelf")}. ${tr("studyFolderCreateHint")}`);
}
studySyncShelfTitleHint();
studyShelfTitle.addEventListener("pointerdown", event => {
  if (event.button != null && event.button !== 0) return;
  clearTimeout(studyShelfHoldTimer); studyShelfHoldFired = false;
  studyShelfHoldTimer = setTimeout(() => {
    studyShelfHoldTimer = 0; studyShelfHoldFired = true; studyCreateFolder();
    setTimeout(() => { studyShelfHoldFired = false; }, 1200);
  }, 650);
});
const releaseShelfTitle = () => { clearTimeout(studyShelfHoldTimer); studyShelfHoldTimer = 0; };
for (const type of ["pointerup", "pointercancel", "pointerleave"]) studyShelfTitle.addEventListener(type, releaseShelfTitle);
studyShelfTitle.addEventListener("contextmenu", event => event.preventDefault());
studyShelfTitle.addEventListener("click", event => {
  if (studyShelfHoldFired) { studyShelfHoldFired = false; event.preventDefault(); event.stopPropagation(); return; }
  studyCreateFolder();
});
$("studyShowShelfBtn").addEventListener("click", () => {
  studySetShelfVisible(true); $("studyShelfCreateFolder").focus({ preventScroll:true });
});
$("studyNextKeyBtn").addEventListener("click", () => studySetKeyCapture("next"));
$("studyPreviousKeyBtn").addEventListener("click", () => studySetKeyCapture("previous"));
$("studyCloseBtn").addEventListener("click", studyCloseRoom);
$("studyBackBtn").addEventListener("click", studyBackToShelf);
$("studyFullscreenBtn").addEventListener("click", studyToggleFullscreen);
$("studyImportCancelBtn").addEventListener("click", studyCancelImport);
$("studyBookmarksBtn").addEventListener("click", () => studyToggleBookmarkPanel());
$("studyHelpBtn").addEventListener("click", studyToggleHelp);
$("studyHelpCloseBtn").addEventListener("click", studyCloseHelp);
$("studyHelp").addEventListener("click", event => { if (event.target === $("studyHelp")) studyCloseHelp(); });
$("studyZoomIn").addEventListener("click", () => studyStepZoom(1));
$("studyZoomOut").addEventListener("click", () => studyStepZoom(-1));
$("studyZoomFit").addEventListener("click", studyZoomReset);
$("studyNextBtn").addEventListener("click", () => studyStep(1));
$("studyPrevBtn").addEventListener("click", () => studyStep(-1));
$("studyBookmarkBtn").addEventListener("click", studyToggleBookmark);
$("studyAssignCoverBtn").addEventListener("click", studyAssignCurrentCover);
$("studyClearCoverBtn").addEventListener("click", () => studyClearSongCover());
$("studyMemoBtn").addEventListener("click", studyToggleMemo);
$("studyMemoExportBtn").addEventListener("click", studyExportText);
$("studyChooseExportFolderBtn").addEventListener("click", studyChooseExportDirectory);
$("studyClearExportFolderBtn").addEventListener("click", () => { studyExportDirectory = null; studyRefreshExportFolderUI(); });
$("studyMemoEditor").addEventListener("input", studyMemoInput);
$("studyProgress").addEventListener("change", studyJumpFromSlider);
$("studyProgressDoneBtn").addEventListener("click", studyHideProgress);
$("studySearch").addEventListener("input", () => { studyShelfShown = STUDY_SHELF_PAGE; studyRenderShelf(); });
const studyShelfList = $("studyShelfList");
studyShelfList.addEventListener("dragover", event => studyShelfDragOver(event, { type:"container", folderId:studyShelfViewFolder }, studyShelfList));
studyShelfList.addEventListener("dragleave", event => { if (!studyShelfList.contains(event.relatedTarget)) studyShelfList.classList.remove("study-drop-target"); });
studyShelfList.addEventListener("drop", event => studyShelfDrop(event, { type:"container", folderId:studyShelfViewFolder }));
$("studyImageFolderInput").addEventListener("change", event => {
  const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) studyImportImages(files);
});
for (const id of ["studyTextFilesInput", "studyTextFolderInput"]) $(id).addEventListener("change", event => {
  const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) studyImportTexts(files);
});
/* 設定の選択（文字列・チェックボックス）をまとめて結びつける。 */
function studyBindPref(id, key, onChange) {
  const node = $(id);
  node.addEventListener("change", () => {
    studyPrefs[key] = node.type === "checkbox" ? node.checked : node.value;
    studySavePrefs();
    if (onChange) onChange(node);
  });
}
function studySyncBookOrder() {
  if (studyCurrentBook && studyCurrentBook.kind === "image") {
    studyCurrentPage = studyNormalizePage(studyCurrentPage);
    studyClearPageImages(); studyRenderImagePage();
  }
  studySyncCurrentBookControls();
}
studyBindPref("studyImageMode", "imageMode", studySyncBookOrder);
studyBindPref("studyImageOrder", "imageOrder", studySyncBookOrder);
studyBindPref("studyAmerican", "american", () => { if (studyCurrentBook && studyCurrentBook.kind === "image" && studyPrefs.imageMode !== "vertical") studyRenderImagePage(); studySyncCurrentBookControls(); });
studyBindPref("studyTheme", "theme", () => { $("studyTextStage").dataset.theme = studyPrefs.theme; studySyncTextProgress(); });
studyBindPref("studyTextSize", "textSize", studySyncLook);
studyBindPref("studyTextSpacing", "textSpacing", studySyncLook);
studyBindPref("studyTextWidth", "textWidth", studySyncLook);
studyBindPref("studyTvCheck", "tvEnabled", studySyncTVDirection);
studyBindPref("studyTvPosition", "tvPosition", studySyncTVDirection);
studyBindPref("studyTvLook", "tvLook", studySyncLook);
studyBindPref("studyTvSize", "tvSize", studySyncLook);
studyBindPref("studyTvRatio", "tvRatio", studySyncLook);
studyBindPref("studyTvLabelOn", "tvLabelOn", studySyncLook);
studyBindPref("studyShelfSort", "shelfSort", () => studyRefreshBooks());
studyBindPref("studyManualShelfOrder", "manualShelfOrder", () => {
  $("studyShelfSort").disabled = studyPrefs.manualShelfOrder; studyShelfShown = STUDY_SHELF_PAGE; studyRenderShelf();
});
studyBindPref("studyFoldersFirst", "foldersFirst", () => { studyShelfShown = STUDY_SHELF_PAGE; studyRenderShelf(); });
studyBindPref("studySkipDeleteConfirm", "skipDeleteConfirm");
studyBindPref("studyShelfVisible", "shelfVisible", () => {
  studyApplyShelfVisibility();
  if (!studyPrefs.shelfVisible) $("studyShowShelfBtn").focus({ preventScroll:true });
});
studyBindPref("studyVerticalImageKeys", "verticalImageKeys");
studyBindPref("studyAlbumNesting", "albumNesting", () => studySetStatus("studyAlbumNestingHint"));
studyBindPref("studyEditedTextFolder", "editedTextFolderId", () => {
  if (studyCurrentBook && studyCurrentBook.kind === "text" && !$("studyMemoEditor").hidden) studyFlushMemo();
});
$("studyFindInput").addEventListener("input", () => studyRunSearch($("studyFindInput").value));
$("studyFindInput").addEventListener("keydown", event => {
  if (event.code === "Enter") { event.preventDefault(); studySearchGo(studySearchState.index + (event.shiftKey ? -1 : 1)); }
  else if (event.code === "Escape") { event.preventDefault(); studyEndSearch(); }
  else if (event.code === "ArrowUp" || event.code === "ArrowDown") event.stopPropagation();
});
$("studyFindNext").addEventListener("click", () => studySearchGo(studySearchState.index + 1));
$("studyFindPrev").addEventListener("click", () => studySearchGo(studySearchState.index - 1));
$("studyFindClear").addEventListener("click", studyEndSearch);
$("studyImageStage").addEventListener("click", studyImageTap);
$("studyImageStage").addEventListener("pointerdown", studyImagePointerDown);
$("studyImageStage").addEventListener("pointermove", studyImagePointerMove);
$("studyImageStage").addEventListener("pointerup", studyImagePointerEnd);
$("studyImageStage").addEventListener("pointercancel", studyImagePointerEnd);
$("studyImageStage").addEventListener("contextmenu", event => event.preventDefault());
$("studyImageStage").addEventListener("scroll", studyVerticalScroll, { passive:true });
$("studyImageStage").addEventListener("wheel", event => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  studyStepZoom(event.deltaY > 0 ? -1 : 1);
}, { passive:false });
$("studyTextPage").addEventListener("scroll", () => { clearTimeout(studyProgressTimer); studyProgressTimer = setTimeout(studySyncTextProgress, 80); }, { passive:true });
$("studyTextStage").addEventListener("scroll", studySyncTextProgress, { passive:true });
document.addEventListener("keydown", studyKeyDown, true);
document.addEventListener("keyup", studyKeyUp, true);
addEventListener("blur", () => {
  clearTimeout(studyHoldTimer); studyHeldCode = ""; studyPointerStart = null;
  studyPointers.clear(); studyPinchStart = 0;
});
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && !studyFullscreenFallback) $("studyRoom").classList.remove("study-fullimage");
  studySyncCurrentBookControls(); studySyncFindRow();
});
video.addEventListener("loadedmetadata", studyRefreshTV); video.addEventListener("loadeddata", studyRefreshTV);
video.addEventListener("resize", studyRefreshTV);
on("songSelected", () => { studyRefreshTV(); studyRefreshCoverButtons(); });
on("mediaReady", () => { studyRefreshTV(); studyRefreshCoverButtons(); });
on("studyCoverChanged", key => {
  if (!key || currentSong && key === currentSong.key) { studyTVArtSong = ""; studyRefreshTV(); studyRefreshCoverButtons(); }
});
on("phase", p => { if (p !== "title") studyCloseRoom(); else { studyRefreshTV(); studyRefreshCoverButtons(); } });
on("language", () => {
  studyTranslateNodes();
  $("studySearch").placeholder = tr("studySearch");
  $("studyFindInput").placeholder = tr("studyBookSearchPlaceholder");
  studySyncShelfTitleHint(); studyApplyShelfVisibility(); studyRefreshKeyAssignments();
  studyRefreshEditedTextFolderSelect(); studyRefreshExportFolderUI();
  $("studyMemoBtn").textContent = tr($("studyMemoEditor").hidden ? "studyMemoEdit" : "studyMemoDone");
  studySetEditorStatus($("studyEditorSaveStatus").dataset.state || "studyEditorSaved", true); studyUpdateEditorStats();
  studyRenderShelf(); studyRenderBookmarks();
  studySyncZoomRow(); studySyncLook();
  if (studyCurrentBook) {
    $("studyCurrentTitle").textContent = studyCurrentBook.title;
    $("studyCurrentMeta").textContent = studyCurrentBook.kind === "image" ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:studyCurrentBook.pages.length })}`
      : `${tr("studyBookText")} · ${String(studyCurrentBook.extension || "TXT").toUpperCase()}`;
    $("studyMemoBtn").textContent = $("studyMemoEditor").hidden ? tr("studyMemoEdit") : tr("studyMemoDone");
    $("studyMemoExportBtn").hidden = studyCurrentBook.kind !== "text";
    studySyncPageCount(); studySyncCurrentBookControls(); studySyncTextProgress(); studyUpdateSearchCount();
  }
});

/* 起動の長押し（曲リストの見出し） */
const studyLaunchTitle = document.querySelector("#libPanel .libHead .study-launch-title");
if (studyLaunchTitle) {
  /* 見出し(h3)の中の本物の <button>。role も tabindex も要らず、読み上げでは「ボタン」と分かります */
  studyLaunchTitle.title = tr("studyLaunchHint"); studyLaunchTitle.setAttribute("aria-label", `${tr("libTitle")}. ${tr("studyLaunchHint")}`);
  studyLaunchTitle.addEventListener("pointerdown", event => {
    if (event.button != null && event.button !== 0) return;
    studyLaunchPointerAt = Date.now();
    clearTimeout(studyLaunchTimer); studyLaunchFired = false;
    studyLaunchTimer = setTimeout(() => {
      studyLaunchFired = true; studyOpenRoom();
      setTimeout(() => { studyLaunchFired = false; }, 1200);
    }, 650);
  });
  const releaseLaunch = () => { studyLaunchPointerAt = Date.now(); clearTimeout(studyLaunchTimer); studyLaunchTimer = 0; };
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => studyLaunchTitle.addEventListener(type, releaseLaunch));
  studyLaunchTitle.addEventListener("contextmenu", event => event.preventDefault());
  studyLaunchTitle.addEventListener("click", event => {
    if (studyLaunchFired) { studyLaunchFired = false; event.preventDefault(); event.stopPropagation(); return; }
    /* 指やマウスのタップ（pointer が直前に動いた click）では開かず、キーボードや読み上げの click だけで開きます。 */
    if (event.detail === 0 && Date.now() - studyLaunchPointerAt > 600) { event.preventDefault(); studyOpenRoom(); }
  });
  studyLaunchTitle.addEventListener("keydown", event => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault(); studyLaunchFired = true; studyOpenRoom();
      setTimeout(() => { studyLaunchFired = false; }, 900);
    }
  });
}
on("language", () => {
  if (!studyLaunchTitle) return;
  studyLaunchTitle.title = tr("studyLaunchHint");
  studyLaunchTitle.setAttribute("aria-label", `${tr("libTitle")}. ${tr("studyLaunchHint")}`);
});

/* ============ 起動 ============ */
let studyReadyPromise = Promise.resolve();
async function studyInit() {
  if (studySafeMode()) return;
  try {
    const [saved, shelf] = await Promise.all([
      studyDBRun("settings", "readonly", store => store.get("ui")),
      studyDBRun("settings", "readonly", store => store.get("shelf"))
    ]);
    studyReadPrefs(saved); studyReadShelfMeta(shelf); studyRefreshPrefsUI(); await studyRefreshBooks();
    studyDataReady = true;
    const cleaned = await studySweepOrphans();
    if (cleaned) studySetStatus("studyOrphanSweep", { n:cleaned });
  } catch (error) { studyFail(error); }
}
studyReadyPromise = studyInit();

window.TrkStudyRoom = Object.freeze({
  open:studyOpenRoom,
  close:studyCloseRoom,
  toggle:() => { if (studyRoomOpen) studyCloseRoom(); else studyOpenRoom(); },
  isOpen:() => studyRoomOpen,
  refreshTV:studyRefreshTV,
  assignCover:studyAssignCurrentCover,
  sweepOrphans:studySweepOrphans,
  getSongCoverBlob:studyGetSongCoverBlob,
  getSongCoverInfo:studyGetSongCoverInfo,
  clearSongCover:studyClearSongCover,
  books:() => studyBooks.map(book => ({ id:book.id, title:book.title, kind:book.kind, pages:book.pages.length, bookmarked:!!book.bookmark })),
  stats:() => ({ books:studyBooks.length, images:studyBooks.reduce((n, book) => n + book.pages.length, 0),
    bytes:studyBooks.reduce((n, book) => n + STUDY_UTIL.bookSize(book), 0), bookmarks:STUDY_UTIL.bookmarkedBooks(studyBooks).length })
});
})();
