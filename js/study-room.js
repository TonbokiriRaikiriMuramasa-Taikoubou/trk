// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ 📚 書斎：端末内の画像・文章リーダー ============
   Local-only reader. It never uploads user files and never interprets imported text as HTML. */
"use strict";

/* 文言はこの機能内で4言語そろえる。 */
Object.assign(TEXT.ja, {
  studyTitle:"📚 書斎", studyLaunchHint:"♫を長押しして書斎を開く（キーボードではEnter）",
  studyClose:"✕ 書斎を閉じる", studyImportImages:"🖼 画像フォルダを取り込む",
  studyImportTextFiles:"＋ テキストを追加", studyImportTextFolder:"📄 テキストフォルダを取り込む",
  studyShelf:"本棚", studySearch:"タイトル・フォルダを検索…", studyShelfEmpty:"本棚は空です。画像フォルダか TXT / MD / JSON を取り込んでください。",
  studyWelcomeTitle:"読みたいものを選ぶ", studyWelcomeHint:"画像はフォルダ単位、テキストはファイルごとにこの端末内へ保存します。外へアップロードしません。",
  studySupported:"画像: JPG / PNG / WebP / GIF / AVIF / BMP · 文章: TXT / MD / JSON / CSV / HTML / XML など",
  studyTapHint:"左側／←で次へ · 右側／→で前へ · Space / Enterで次へ · Enter長押しで栞 · Space長押しでページ移動 · Escで終了",
  studyVerticalHint:"縦にスクロール／フリックして読み進める · Space / Enterで次へ · Enter長押しで栞 · Escで終了",
  studyBack:"← 本棚", studyFullscreen:"⛶ 画像を全画面化", studyModeLabel:"画像の並べ方",
  studyModeSingle:"一枚ずつ（中央）", studyModeSpread:"見開き（右が1ページ目）", studyModeVertical:"縦読み漫画",
  studyAmerican:"🇺🇸 アメリカン（左右・順序反転）", studyThemeLabel:"文字のスキン",
  studyThemePlain:"普通のテキスト", studyThemeDark:"ダークモード", studyThemeNeon:"ネオン",
  studyThemeLined:"ルーズリーフ", studyThemeGenko:"作文用紙（縦書き・右から）",
  studyTvToggle:"TVを流し見する", studyTvPosLabel:"TVの位置", studyTvTop:"上", studyTvBottom:"下", studyTvHidden:"表示しない",
  studyTvEmpty:"動画または曲のジャケットがここに表示されます。", studyTvCaption:"今の曲・動画を表示します。別の音声を重ねて再生しません。",
  studyBookmark:"🔖 栞を挟む", studyBookmarkSaved:"🔖 栞を更新しました。", studyBookmarkError:"栞を保存できませんでした。",
  studyAdvanced:"⚙ 上級者向け", studyMemoToggle:"テキストをメモ帳として編集可能にする",
  studyMemoHint:"編集は書斎内のコピーに保存し、元ファイルは書き換えません。",
  studyMemoEdit:"✎ メモ帳で編集", studyMemoDone:"閲覧に戻る", studyExportText:"⇩ テキストを書き出す",
  studyMemoSaved:"メモのコピーを保存しました。", studyMemoSaveError:"メモを保存できませんでした。",
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
  studyMemoNeedText:"テキスト本でのみメモ帳を使えます。", studyFullscreenExit:"全画面を閉じる"
});
Object.assign(TEXT.en, {
  studyTitle:"📚 Study", studyLaunchHint:"Hold ♫ Songs to open Study (press Enter when focused)",
  studyClose:"✕ Close Study", studyImportImages:"🖼 Import image folder", studyImportTextFiles:"＋ Add text files",
  studyImportTextFolder:"📄 Import text folder", studyShelf:"Bookshelf", studySearch:"Search titles and folders…",
  studyShelfEmpty:"Your shelf is empty. Import an image folder or TXT / MD / JSON files.",
  studyWelcomeTitle:"Choose something to read", studyWelcomeHint:"Images are saved by folder and text files individually on this device. Nothing is uploaded.",
  studySupported:"Images: JPG / PNG / WebP / GIF / AVIF / BMP · Text: TXT / MD / JSON / CSV / HTML / XML, and more",
  studyTapHint:"Tap left / ← for next · tap right / → for previous · Space / Enter for next · hold Enter for a bookmark · hold Space for page seek · Esc to exit",
  studyVerticalHint:"Scroll or swipe vertically to read · Space / Enter for next · hold Enter for a bookmark · Esc to exit",
  studyBack:"← Bookshelf", studyFullscreen:"⛶ Full-screen image", studyModeLabel:"Image layout",
  studyModeSingle:"Single page (centered)", studyModeSpread:"Two-page spread (page 1 on right)", studyModeVertical:"Vertical comic",
  studyAmerican:"🇺🇸 American mode (reverse sides and order)", studyThemeLabel:"Text skin",
  studyThemePlain:"Plain text", studyThemeDark:"Dark mode", studyThemeNeon:"Neon", studyThemeLined:"Loose-leaf paper",
  studyThemeGenko:"Manuscript paper (vertical, right to left)", studyTvToggle:"Watch TV while reading", studyTvPosLabel:"TV position",
  studyTvTop:"Top", studyTvBottom:"Bottom", studyTvHidden:"Hide TV", studyTvEmpty:"The current video or song cover appears here.",
  studyTvCaption:"Shows the current song or video without starting a second audio stream.",
  studyBookmark:"🔖 Save bookmark", studyBookmarkSaved:"🔖 Bookmark saved.", studyBookmarkError:"Could not save the bookmark.",
  studyAdvanced:"⚙ Advanced", studyMemoToggle:"Allow text books to open as a notepad", studyMemoHint:"Edits are saved as a copy in Study; the original file is never changed.",
  studyMemoEdit:"✎ Edit as notepad", studyMemoDone:"Back to reading", studyExportText:"⇩ Export text copy", studyMemoSaved:"Local text copy saved.",
  studyMemoSaveError:"Could not save the text copy.", studyNext:"◀ Next", studyNextRight:"Next ▶", studyPrevious:"Previous ▶", studyPreviousLeft:"◀ Previous",
  studyNextRightOnly:"Next ▶", studyPreviousLeftOnly:"◀ Previous", studyProgressDone:"Done",
  studyAssignCover:"🖼 Set this page as song cover", studyCoverAssigned:"Set as the cover for “{title}”.",
  studyCoverNeedSong:"Select a song first.", studyCoverNeedImage:"Open an image page first.", studyCoverError:"Could not save the cover.",
  studyDelete:"Delete", studyRename:"Rename", studyOpen:"Open", studyBookImages:"Image album", studyBookText:"Text",
  studyPageCount:"{n} images", studyPagesStatus:"{current} / {total}", studyPageRange:"{first}–{last} / {total}", studyPageLabel:"Page",
  studyTextProgress:"{n}%", studyRenamePrompt:"New title", studyRenamed:"Renamed.",
  studyDeleteConfirm:"Remove “{title}” from this shelf?", studyDeleted:"Removed from the shelf.",
  studyReplace:"“{title}” is already on the shelf. Replace it?", studyImportProgress:"Importing… {n} / {total}",
  studyImportDone:"Added {n} item(s) to the shelf.", studyNoImageFiles:"No supported images were found in that folder.",
  studyNoTextFiles:"No supported text files were found.", studyNoSearchResults:"No matching books found.",
  studyTextBatchLimit:"You can import up to 200 text files at once.", studyShelfLimit:"The shelf is limited to 500 books.", studyTooMany:"An image album is limited to {max} images and {mb} MB total.",
  studyFileTooBig:"“{name}” is too large (maximum {mb} MB per file).", studyTextTooBig:"“{name}” is too large (maximum {mb} MB per file).",
  studyDecodeError:"Could not decode “{name}” as text.", studyStorageError:"Browser storage failed. Check available device storage.",
  studyImageLoadError:"Could not load this image. Please import it again.", studySafeMode:"Study data is not loaded in safe mode. Open the app normally to use Study.",
  studyProgressHint:"Move the seek bar to jump to a page.", studyBookmarked:"Resumed from bookmark.",
  studyMemoNeedText:"Notepad editing is available for text books only.", studyFullscreenExit:"Close full screen"
});
Object.assign(TEXT.zh, {
  studyTitle:"📚 书斋", studyLaunchHint:"长按♫歌曲列表打开书斋（键盘聚焦后按 Enter）", studyClose:"✕ 关闭书斋",
  studyImportImages:"🖼 导入图片文件夹", studyImportTextFiles:"＋ 添加文本文件", studyImportTextFolder:"📄 导入文本文件夹",
  studyShelf:"书架", studySearch:"搜索标题或文件夹…", studyShelfEmpty:"书架为空。请导入图片文件夹或 TXT / MD / JSON。",
  studyWelcomeTitle:"选择要阅读的内容", studyWelcomeHint:"图片按文件夹、文本按文件分别保存在本设备中，不会上传。",
  studySupported:"图片: JPG / PNG / WebP / GIF / AVIF / BMP · 文本: TXT / MD / JSON / CSV / HTML / XML 等",
  studyTapHint:"点左侧／← 下一页 · 点右侧／→ 上一页 · Space / Enter 下一页 · 长按 Enter 书签 · 长按 Space 跳页 · Esc 退出",
  studyVerticalHint:"上下滚动或滑动阅读 · Space / Enter 下一页 · 长按 Enter 书签 · Esc 退出",
  studyBack:"← 书架", studyFullscreen:"⛶ 图片全屏", studyModeLabel:"图片排列方式", studyModeSingle:"单页（居中）",
  studyModeSpread:"双页（第一页在右）", studyModeVertical:"纵向漫画", studyAmerican:"🇺🇸 美式模式（左右与顺序反转）",
  studyThemeLabel:"文字主题", studyThemePlain:"普通文本", studyThemeDark:"深色模式", studyThemeNeon:"霓虹",
  studyThemeLined:"活页纸", studyThemeGenko:"作文纸（竖排，从右向左）", studyTvToggle:"边阅读边看电视", studyTvPosLabel:"电视位置",
  studyTvTop:"上方", studyTvBottom:"下方", studyTvHidden:"不显示", studyTvEmpty:"此处显示当前视频或歌曲封面。",
  studyTvCaption:"显示当前歌曲或视频，不会另外启动一条音频流。", studyBookmark:"🔖 添加书签", studyBookmarkSaved:"🔖 已保存书签。",
  studyBookmarkError:"无法保存书签。", studyAdvanced:"⚙ 高级选项", studyMemoToggle:"允许将文本书作为记事本编辑",
  studyMemoHint:"编辑内容保存在书斋副本中，不会修改原文件。", studyMemoEdit:"✎ 记事本编辑", studyMemoDone:"返回阅读",
  studyExportText:"⇩ 导出文本副本", studyMemoSaved:"已保存本地文本副本。", studyMemoSaveError:"无法保存文本副本。",
  studyNext:"◀ 下一页", studyNextRight:"下一页 ▶", studyPrevious:"上一页 ▶", studyPreviousLeft:"◀ 上一页",
  studyNextRightOnly:"下一页 ▶", studyPreviousLeftOnly:"◀ 上一页", studyProgressDone:"完成",
  studyAssignCover:"🖼 将此页设为歌曲封面", studyCoverAssigned:"已设为“{title}”的封面。", studyCoverNeedSong:"请先选择一首歌曲。",
  studyCoverNeedImage:"请先打开图片页面。", studyCoverError:"无法保存封面。", studyDelete:"删除", studyRename:"重命名", studyOpen:"打开",
  studyBookImages:"图片相册", studyBookText:"文本", studyPageCount:"{n} 张图片", studyPagesStatus:"{current} / {total}",
  studyPageRange:"{first}–{last} / {total}", studyPageLabel:"页", studyTextProgress:"{n}%", studyRenamePrompt:"新标题",
  studyRenamed:"已重命名。", studyDeleteConfirm:"要从书架删除“{title}”吗？", studyDeleted:"已从书架删除。",
  studyReplace:"书架中已有“{title}”。要替换吗？", studyImportProgress:"正在导入… {n} / {total}", studyImportDone:"已添加 {n} 项。",
  studyNoImageFiles:"该文件夹中没有受支持的图片。", studyNoTextFiles:"没有找到受支持的文本文件。",
  studyNoSearchResults:"没有匹配的书籍。", studyTextBatchLimit:"一次最多可导入 200 个文本文件。", studyShelfLimit:"书架最多保存 500 本书。",
  studyTooMany:"每个图片相册最多 {max} 张、总计 {mb} MB。", studyFileTooBig:"“{name}”太大（每个文件最多 {mb} MB）。",
  studyTextTooBig:"“{name}”太大（每个文件最多 {mb} MB）。", studyDecodeError:"无法将“{name}”解码为文本。",
  studyStorageError:"浏览器存储失败，请检查设备可用空间。", studyImageLoadError:"无法加载此图片，请重新导入。",
  studySafeMode:"安全模式下不会读取书斋数据。请正常打开应用。", studyProgressHint:"拖动进度条可跳转页面。",
  studyBookmarked:"已从书签继续阅读。", studyMemoNeedText:"只有文本书籍可以用记事本编辑。", studyFullscreenExit:"退出全屏"
});
Object.assign(TEXT.ko, {
  studyTitle:"📚 서재", studyLaunchHint:"♫ 곡 목록을 길게 눌러 서재 열기 (키보드에서는 Enter)", studyClose:"✕ 서재 닫기",
  studyImportImages:"🖼 이미지 폴더 가져오기", studyImportTextFiles:"＋ 텍스트 파일 추가", studyImportTextFolder:"📄 텍스트 폴더 가져오기",
  studyShelf:"책장", studySearch:"제목·폴더 검색…", studyShelfEmpty:"책장이 비어 있습니다. 이미지 폴더 또는 TXT / MD / JSON을 가져오세요.",
  studyWelcomeTitle:"읽을 항목을 선택하세요", studyWelcomeHint:"이미지는 폴더별로, 텍스트는 파일별로 이 기기에 저장합니다. 업로드하지 않습니다.",
  studySupported:"이미지: JPG / PNG / WebP / GIF / AVIF / BMP · 텍스트: TXT / MD / JSON / CSV / HTML / XML 등",
  studyTapHint:"왼쪽／← 다음 · 오른쪽／→ 이전 · Space / Enter 다음 · Enter 길게 눌러 책갈피 · Space 길게 눌러 이동 · Esc 종료",
  studyVerticalHint:"위아래로 스크롤하거나 밀어서 읽기 · Space / Enter 다음 · Enter 길게 눌러 책갈피 · Esc 종료",
  studyBack:"← 책장", studyFullscreen:"⛶ 이미지 전체 화면", studyModeLabel:"이미지 배열", studyModeSingle:"한 페이지 (중앙)",
  studyModeSpread:"두 페이지 (첫 페이지 오른쪽)", studyModeVertical:"세로형 만화", studyAmerican:"🇺🇸 미국식 (좌우와 순서 반전)",
  studyThemeLabel:"텍스트 스킨", studyThemePlain:"일반 텍스트", studyThemeDark:"다크 모드", studyThemeNeon:"네온",
  studyThemeLined:"루즈리프", studyThemeGenko:"원고지 (세로쓰기·오른쪽부터)", studyTvToggle:"읽으면서 TV 보기", studyTvPosLabel:"TV 위치",
  studyTvTop:"위", studyTvBottom:"아래", studyTvHidden:"표시 안 함", studyTvEmpty:"현재 영상 또는 곡 커버가 여기에 표시됩니다.",
  studyTvCaption:"현재 곡이나 영상을 표시합니다. 별도의 오디오 스트림을 재생하지 않습니다.", studyBookmark:"🔖 책갈피 저장",
  studyBookmarkSaved:"🔖 책갈피를 저장했습니다.", studyBookmarkError:"책갈피를 저장하지 못했습니다.", studyAdvanced:"⚙ 고급 설정",
  studyMemoToggle:"텍스트 책을 메모장으로 편집 허용", studyMemoHint:"편집 내용은 서재의 사본에 저장하며 원본 파일은 변경하지 않습니다.",
  studyMemoEdit:"✎ 메모장으로 편집", studyMemoDone:"읽기로 돌아가기", studyExportText:"⇩ 텍스트 사본 내보내기",
  studyMemoSaved:"로컬 텍스트 사본을 저장했습니다.", studyMemoSaveError:"텍스트 사본을 저장하지 못했습니다.",
  studyNext:"◀ 다음", studyNextRight:"다음 ▶", studyPrevious:"이전 ▶", studyPreviousLeft:"◀ 이전",
  studyNextRightOnly:"다음 ▶", studyPreviousLeftOnly:"◀ 이전", studyProgressDone:"완료",
  studyAssignCover:"🖼 이 페이지를 곡 커버로 지정", studyCoverAssigned:"“{title}”의 커버로 지정했습니다.",
  studyCoverNeedSong:"먼저 곡을 선택하세요.", studyCoverNeedImage:"먼저 이미지 페이지를 여세요.", studyCoverError:"커버를 저장하지 못했습니다.",
  studyDelete:"삭제", studyRename:"이름 변경", studyOpen:"열기", studyBookImages:"이미지 앨범", studyBookText:"텍스트",
  studyPageCount:"이미지 {n}장", studyPagesStatus:"{current} / {total}", studyPageRange:"{first}–{last} / {total}", studyPageLabel:"페이지",
  studyTextProgress:"{n}%", studyRenamePrompt:"새 제목", studyRenamed:"이름을 변경했습니다.",
  studyDeleteConfirm:"“{title}”을(를) 책장에서 삭제할까요?", studyDeleted:"책장에서 삭제했습니다.",
  studyReplace:"책장에 “{title}”이(가) 있습니다. 바꿀까요?", studyImportProgress:"가져오는 중… {n} / {total}",
  studyImportDone:"{n}개 항목을 책장에 추가했습니다.", studyNoImageFiles:"폴더에서 지원되는 이미지를 찾지 못했습니다.",
  studyNoTextFiles:"지원되는 텍스트 파일을 찾지 못했습니다.", studyNoSearchResults:"일치하는 책이 없습니다.",
  studyTextBatchLimit:"한 번에 최대 200개의 텍스트 파일을 가져올 수 있습니다.", studyShelfLimit:"책장은 최대 500권까지 저장할 수 있습니다.",
  studyTooMany:"이미지 앨범은 최대 {max}장, 총 {mb}MB까지입니다.",
  studyFileTooBig:"“{name}” 파일이 너무 큽니다 (파일당 최대 {mb}MB).", studyTextTooBig:"“{name}” 파일이 너무 큽니다 (파일당 최대 {mb}MB).",
  studyDecodeError:"“{name}”을(를) 텍스트로 디코딩하지 못했습니다.", studyStorageError:"브라우저 저장에 실패했습니다. 기기 여유 공간을 확인하세요.",
  studyImageLoadError:"이미지를 불러오지 못했습니다. 다시 가져오세요.", studySafeMode:"안전 모드에서는 서재 데이터를 읽지 않습니다. 앱을 일반 모드로 여세요.",
  studyProgressHint:"탐색 막대를 움직여 페이지를 이동할 수 있습니다.", studyBookmarked:"책갈피 위치에서 다시 시작했습니다.",
  studyMemoNeedText:"텍스트 책에서만 메모장 편집을 사용할 수 있습니다.", studyFullscreenExit:"전체 화면 닫기"
});

const STUDY_UTIL = window.TrkStudyUtils;
const STUDY_DB_NAME = "trk_study_room_v1";
const STUDY_STORES = ["books", "pages", "covers", "settings"];
const STUDY_IMAGE_MAX_COUNT = 3000, STUDY_IMAGE_MAX_BYTES = 600 * 1024 * 1024, STUDY_IMAGE_FILE_MAX = 100 * 1024 * 1024;
const STUDY_TEXT_FILE_MAX = 12 * 1024 * 1024, STUDY_TEXT_BATCH_MAX = 200;
let studyDbPromise = null;
let studyBooks = [], studyCurrentBook = null, studyCurrentPage = 0;
let studyVerticalBookId = "", studyVerticalObserver = null, studyVerticalScrollTimer = 0;
let studyMemoSaveTimer = 0, studyProgressTimer = 0, studyRenderToken = 0, studyImageLoadSeq = 0;
let studyRoomOpen = false, studyTVToken = 0, studyTVArtUrl = "", studyTVArtSong = "";
let studyHoldTimer = 0, studyHeldCode = "", studyHoldAction = "", studySuppressTapUntil = 0;
let studyPointerStart = null, studyLaunchTimer = 0, studyLaunchFired = false;
let studyVideoHomeParent = null, studyVideoHomeNext = null, studyVideoHomeStyle = null, studyFullscreenFallback = false;
const studyObjectUrls = new Set();
let studyPrefs = { imageMode:"single", american:false, theme:"plain", tvEnabled:false, tvPosition:"top", memoEnabled:false };

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
function studySetStatus(key, vars) { if (typeof setStatus === "function") setStatus("studyStatus", key, vars); }
function studyNotify(key, vars) { studySetStatus(key, vars); if (typeof showToast === "function") showToast(tr(key, vars)); }
function studyReadPrefs(raw) {
  if (!raw || typeof raw !== "object") return;
  studyPrefs.imageMode = ["single", "spread", "vertical"].includes(raw.imageMode) ? raw.imageMode : "single";
  studyPrefs.american = raw.american === true;
  studyPrefs.theme = ["plain", "dark", "neon", "lined", "genko"].includes(raw.theme) ? raw.theme : "plain";
  studyPrefs.tvEnabled = raw.tvEnabled === true;
  studyPrefs.tvPosition = ["top", "bottom", "off"].includes(raw.tvPosition) ? raw.tvPosition : "top";
  if (studyPrefs.tvPosition === "off") studyPrefs.tvEnabled = false;
  studyPrefs.memoEnabled = raw.memoEnabled === true;
}
function studySavePrefs() {
  return studyDBRun("settings", "readwrite", store => store.put({ ...studyPrefs }, "ui"))
    .catch(error => { console.error(error); studySetStatus("studyStorageError"); });
}
function studyRefreshPrefsUI() {
  $("studyImageMode").value = studyPrefs.imageMode;
  $("studyAmerican").checked = studyPrefs.american;
  $("studyTheme").value = studyPrefs.theme;
  $("studyTvCheck").checked = studyPrefs.tvEnabled;
  $("studyTvPosition").value = studyPrefs.tvPosition;
  $("studyMemoEnabled").checked = studyPrefs.memoEnabled;
  studySyncCurrentBookControls();
}
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
    savedAt:Math.max(0, Number(raw.bookmark.savedAt) || 0)
  } : null;
  return { id:raw.id.slice(0, 100), kind:raw.kind, title:String(raw.title || "Untitled").trim().slice(0, 160) || "Untitled",
    sourcePath:String(raw.sourcePath || "").slice(0, 1000), generation:String(raw.generation || "").slice(0, 100),
    pages, content:typeof raw.content === "string" ? raw.content.slice(0, STUDY_TEXT_FILE_MAX) : "",
    extension:String(raw.extension || "").slice(0, 16), bookmark, createdAt:Math.max(0, Number(raw.createdAt) || Date.now()),
    updatedAt:Math.max(0, Number(raw.updatedAt) || Date.now()) };
}
async function studyRefreshBooks() {
  const rows = await studyDBRun("books", "readonly", store => store.getAll());
  studyBooks = (rows || []).map(studyBookClean).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt || STUDY_UTIL.comparePath(a.title, b.title));
  studyRenderShelf();
}
function studyRenderShelf() {
  const list = $("studyShelfList"), query = $("studySearch").value.trim().toLocaleLowerCase();
  list.textContent = "";
  const shown = studyBooks.filter(book => !query || `${book.title} ${book.sourcePath} ${book.extension}`.toLocaleLowerCase().includes(query));
  $("studyBookCount").textContent = `${shown.length} / ${studyBooks.length}`;
  if (!shown.length) { list.append(el("div", "study-shelf-empty", tr(studyBooks.length ? "studyNoSearchResults" : "studyShelfEmpty"))); return; }
  for (const book of shown.slice(0, 250)) {
    const card = el("article", "study-book-card");
    const open = el("button", "study-book-open"); open.type = "button";
    const icon = el("span", "study-book-icon", book.kind === "image" ? "🖼" : "📄");
    const text = el("span", "study-book-copy");
    const title = el("strong", "study-book-title", book.title);
    const detail = book.kind === "image" ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:book.pages.length })}` : `${tr("studyBookText")} · ${String(book.extension || "TXT").toUpperCase()}`;
    const sub = el("span", "study-book-sub", detail + (book.bookmark ? " · 🔖" : ""));
    text.append(title, sub); open.append(icon, text); open.title = tr("studyOpen"); open.addEventListener("click", () => studyOpenBook(book));
    const tools = el("span", "study-book-tools");
    const rename = el("button", "study-tool-btn", "✎"); rename.type = "button"; rename.title = tr("studyRename"); rename.setAttribute("aria-label", `${tr("studyRename")}: ${book.title}`);
    rename.addEventListener("click", () => studyRenameBook(book));
    const remove = el("button", "study-tool-btn study-delete-btn", "×"); remove.type = "button"; remove.title = tr("studyDelete"); remove.setAttribute("aria-label", `${tr("studyDelete")}: ${book.title}`);
    remove.addEventListener("click", () => studyDeleteBook(book));
    tools.append(rename, remove); card.append(open, tools); list.append(card);
  }
  if (shown.length > 250) list.append(el("div", "study-shelf-more", tr("libMore", { n:shown.length - 250 })));
}
function studyClearImage(img) {
  const url = img && img.dataset.studyObjectUrl;
  if (url) { URL.revokeObjectURL(url); studyObjectUrls.delete(url); delete img.dataset.studyObjectUrl; }
  if (img) { delete img.dataset.studyLoadToken; img.removeAttribute("src"); img.hidden = true; }
}
function studySetImage(img, blob, alt) {
  studyClearImage(img);
  if (!blob || !img) return;
  const url = URL.createObjectURL(blob);
  studyObjectUrls.add(url); img.dataset.studyObjectUrl = url; img.alt = alt || ""; img.src = url; img.hidden = false;
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
  if (!book || book.kind !== "image" || index < 0 || index >= book.pages.length) { studyClearImage(img); return; }
  const page = book.pages[index], renderToken = studyRenderToken, loadToken = String(++studyImageLoadSeq);
  img.dataset.studyLoadToken = loadToken;
  try {
    const blob = await studyDBRun("pages", "readonly", store => store.get(page.key));
    if (img.dataset.studyLoadToken !== loadToken || book !== studyCurrentBook || renderToken !== studyRenderToken) return;
    if (!blob) { studyClearImage(img); studySetStatus("studyImageLoadError"); return; }
    studySetImage(img, blob, `${book.title} — ${page.name} (${index + 1})`);
  } catch (error) {
    if (img.dataset.studyLoadToken === loadToken) { studyClearImage(img); console.error(error); studySetStatus("studyImageLoadError"); }
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
  $("studyAssignCoverBtn").disabled = !currentSong;
  $("studyAssignCoverBtn").title = currentSong ? tr("studyAssignCover") : tr("studyCoverNeedSong");
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
    if (target) target.scrollIntoView({ block:restoreVertical ? "start" : "center", behavior:restoreVertical ? "auto" : "smooth" });
    else $("studyImageStage").scrollTop = 0;
    return;
  }
  studyRenderImagePage();
}
async function studyRenderImagePage() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "image") return;
  if (studyPrefs.imageMode === "vertical") {
    for (const id of ["studyPageSingle", "studyPageLeft", "studyPageRight"]) studyClearImage($(id));
    $("studySingleWrap").hidden = true; $("studySpreadWrap").hidden = true; $("studyVerticalPages").hidden = false;
    studyBuildVerticalPages();
    const target = $("studyVerticalPages").children[studyCurrentPage];
    if (target) requestAnimationFrame(() => { target.scrollIntoView({ block:"start", behavior:"auto" }); studyVerticalScroll(); });
    else studyVerticalScroll();
    studySyncPageCount(); return;
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
  if (token === studyRenderToken) studySyncPageCount();
}
function studyBuildVerticalPages() {
  const book = studyCurrentBook, box = $("studyVerticalPages");
  if (!book || studyVerticalBookId === `${book.id}:${book.generation}`) return;
  studyClearVerticalPages();
  studyVerticalBookId = `${book.id}:${book.generation}`;
  for (let index = 0; index < book.pages.length; index++) {
    const item = el("div", "study-vertical-item"); item.dataset.pageIndex = String(index);
    const img = el("img", "study-page-image study-vertical-image"); img.alt = `${book.title} — ${book.pages[index].name} (${index + 1})`;
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
function studyRenderTextContent(book) {
  const target = $("studyTextPage"); target.textContent = "";
  const segments = STUDY_UTIL.aozoraSegments(book.content || "");
  if (!segments.some(part => part.ruby)) { target.textContent = (book.content || "").replace(/\r\n?/g, "\n").replace(/\f/g, "\n\n"); return; }
  const frag = document.createDocumentFragment();
  for (const part of segments) {
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
  $("studyTextProgress").hidden = false; $("studyTextProgress").textContent = tr("studyTextProgress", { n:percent });
}
function studyScrollText(direction) {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || !$("studyMemoEditor").hidden) return;
  const node = $("studyTextPage"), genko = studyPrefs.theme === "genko", distance = Math.max(160, (genko ? node.clientWidth : node.clientHeight) * .82);
  if (genko) node.scrollBy({ left:direction > 0 ? -distance : distance, behavior:"smooth" });
  else node.scrollBy({ top:direction * distance, behavior:"smooth" });
  setTimeout(studySyncTextProgress, 250);
}
function studyRenderCurrentBook() {
  const book = studyCurrentBook;
  if (!book) return;
  studyClearPageImages();
  const isImage = book.kind === "image";
  $("studyImageStage").hidden = !isImage; $("studyTextStage").hidden = isImage;
  $("studyImageModeRow").hidden = !isImage; $("studyAmericanRow").hidden = !isImage;
  $("studyThemeRow").hidden = isImage; $("studyProgressWrap").hidden = !isImage;
  $("studyTextProgress").hidden = isImage; $("studyAssignCoverBtn").hidden = !isImage;
  $("studyFullscreenBtn").hidden = !isImage; $("studyCurrentTitle").textContent = book.title;
  $("studyCurrentMeta").textContent = isImage ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:book.pages.length })}`
    : `${tr("studyBookText")} · ${String(book.extension || "TXT").toUpperCase()}`;
  $("studyMemoBtn").hidden = isImage || !studyPrefs.memoEnabled;
  $("studyMemoExportBtn").hidden = isImage || $("studyMemoEditor").hidden;
  $("studyTextStage").dataset.theme = studyPrefs.theme;
  $("studyMemoEditor").hidden = true; $("studyTextPage").hidden = false;
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
  studySyncCurrentBookControls(); studyApplyTVLayout();
}
function studySyncCurrentBookControls() {
  const book = studyCurrentBook;
  if (!book) return;
  $("studyImageMode").value = studyPrefs.imageMode;
  $("studyAmerican").checked = studyPrefs.american;
  $("studyTheme").value = studyPrefs.theme;
  $("studyTvCheck").checked = studyPrefs.tvEnabled;
  $("studyTvPosition").value = studyPrefs.tvPosition;
  $("studyMemoEnabled").checked = studyPrefs.memoEnabled;
  $("studyMemoBtn").hidden = book.kind !== "text" || !studyPrefs.memoEnabled;
  if (book.kind === "image") studySyncPageCount();
}
async function studyOpenBook(book) {
  if (!book) return;
  if (studyCurrentBook && !$("studyMemoEditor").hidden) {
    if (studyCurrentBook.id === book.id) return;
    await studyFlushMemo();
  }
  studyCurrentBook = book;
  $("studyWelcome").hidden = true; $("studyBookView").hidden = false;
  studyRenderCurrentBook();
  (book.kind === "image" ? $("studyImageStage") : $("studyTextPage")).focus({ preventScroll:true });
  studySetStatus(null);
}
async function studyBackToShelf() {
  await studyFlushMemo(); studyCurrentBook = null; studyClearPageImages();
  $("studyBookView").hidden = true; $("studyWelcome").hidden = false;
  studyApplyTVLayout();
}
function studySaveBook(book) {
  if (!book) return Promise.resolve();
  book.updatedAt = Date.now();
  return studyDBRun("books", "readwrite", store => store.put(book, book.id)).then(studyRefreshBooks);
}
function studyBookmarkData() {
  const book = studyCurrentBook;
  if (!book) return null;
  if (book.kind === "image") return { index:studyCurrentPage, top:0, left:0, savedAt:Date.now() };
  if (!$("studyMemoEditor").hidden) return { index:0, top:0, left:0, savedAt:Date.now() };
  const node = $("studyTextPage"); return { index:0, top:Math.max(0, node.scrollTop), left:node.scrollLeft, savedAt:Date.now() };
}
async function studySaveBookmark() {
  if (!studyCurrentBook) return;
  studyCurrentBook.bookmark = studyBookmarkData();
  try { await studySaveBook(studyCurrentBook); studyNotify("studyBookmarkSaved"); }
  catch (error) { console.error(error); studySetStatus("studyBookmarkError"); }
}
function studyStep(direction) {
  if (!studyCurrentBook) return;
  if (studyCurrentBook.kind === "text") { studyScrollText(direction); return; }
  if (studyPrefs.imageMode === "vertical") {
    const amount = Math.max(240, $("studyImageStage").clientHeight * .84);
    $("studyImageStage").scrollBy({ top:direction * amount, behavior:"smooth" }); return;
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
function studyTypingTarget(target) {
  return !!(target && typeof target.closest === "function" && target.closest("input,select,textarea,[contenteditable='true'],button,summary"));
}
function studyKeyDown(event) {
  if (!studyRoomOpen) return;
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
  if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault(); event.stopImmediatePropagation(); studyStepPhysical(event.code === "ArrowLeft" ? "left" : "right"); return;
  }
  if (event.code === "PageDown") { event.preventDefault(); event.stopImmediatePropagation(); studyStep(1); return; }
  if (event.code === "PageUp") { event.preventDefault(); event.stopImmediatePropagation(); studyStep(-1); return; }
  if (event.code !== "Space" && event.code !== "Enter" && event.code !== "NumpadEnter") { event.stopImmediatePropagation(); return; }
  event.preventDefault(); event.stopImmediatePropagation();
  if (event.repeat || studyHeldCode) return;
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
function studyImagePointerDown(event) {
  if (!studyRoomOpen || !studyCurrentBook || studyCurrentBook.kind !== "image" || (event.button != null && event.button !== 0)) return;
  const verticalItem = event.target && typeof event.target.closest === "function" ? event.target.closest(".study-vertical-item") : null;
  if (studyPrefs.imageMode === "vertical" && verticalItem) { studyCurrentPage = Number(verticalItem.dataset.pageIndex) || 0; studySyncPageCount(); }
  studyPointerStart = { x:event.clientX, y:event.clientY, id:event.pointerId, held:false };
  try { event.currentTarget.setPointerCapture(event.pointerId); } catch (_) {}
  clearTimeout(studyHoldTimer);
  studyHoldTimer = setTimeout(() => {
    if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
    studyPointerStart.held = true; studySuppressTapUntil = Date.now() + 900; studyAssignCurrentCover();
  }, 680);
}
function studyImagePointerMove(event) {
  if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
  if (Math.abs(event.clientX - studyPointerStart.x) > 14 || Math.abs(event.clientY - studyPointerStart.y) > 14) {
    clearTimeout(studyHoldTimer); studyHoldTimer = 0;
  }
}
function studyImagePointerEnd(event) {
  if (!studyPointerStart || studyPointerStart.id !== event.pointerId) return;
  clearTimeout(studyHoldTimer); studyHoldTimer = 0;
  const start = studyPointerStart; studyPointerStart = null;
  if (start.held) { studySuppressTapUntil = Date.now() + 700; return; }
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
async function studyAssignCurrentCover() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "image" || !book.pages.length) { studyNotify("studyCoverNeedImage"); return; }
  if (!currentSong) { studyNotify("studyCoverNeedSong"); return; }
  const songKey = currentSong.key, songTitle = currentSong.title || currentSong.key;
  const index = Math.max(0, Math.min(book.pages.length - 1, studyCurrentPage)), page = book.pages[index];
  try {
    const blob = await studyDBRun("pages", "readonly", store => store.get(page.key));
    if (!blob) throw new Error("Missing Study image");
    await studyDBRun("covers", "readwrite", store => store.put({ bookId:book.id, pageKey:page.key, pageIndex:index, title:book.title, updatedAt:Date.now() }, songKey));
    emit("studyCoverChanged", songKey);
    if (typeof setBackground === "function" && currentSong && currentSong.key === songKey) await setBackground(blob);
    studyNotify("studyCoverAssigned", { title:songTitle });
    studyRefreshTV();
  } catch (error) { console.error(error); studySetStatus("studyCoverError"); }
}
async function studyGetSongCoverBlob(songKey) {
  if (studySafeMode() || typeof songKey !== "string" || !songKey || songKey.length > 512) return null;
  try {
    const art = await studyDBRun("covers", "readonly", store => store.get(songKey));
    if (!art || typeof art.pageKey !== "string") return null;
    const page = await studyDBRun("pages", "readonly", store => store.get(art.pageKey));
    return page instanceof Blob ? page : null;
  } catch (_) { return null; }
}
async function studyRenameBook(book) {
  const next = prompt(tr("studyRenamePrompt"), book.title);
  if (next == null) return;
  const title = String(next).trim().slice(0, 160);
  if (!title) return;
  book.title = title;
  if (studyCurrentBook && studyCurrentBook.id === book.id) $("studyCurrentTitle").textContent = title;
  try { await studySaveBook(book); studyNotify("studyRenamed"); }
  catch (error) { console.error(error); studySetStatus("studyStorageError"); }
}
async function studyDeleteBook(book) {
  if (!confirm(tr("studyDeleteConfirm", { title:book.title }))) return;
  try {
    if (studyCurrentBook && studyCurrentBook.id === book.id) await studyBackToShelf();
    await studyDBRun("books", "readwrite", store => store.delete(book.id));
    const pageKeys = book.pages.map(page => page.key);
    if (pageKeys.length) await studyDBDeleteMany("pages", pageKeys);
    const covers = await studyDBPairs("covers"), removedSongs = [];
    for (const [songKey, art] of covers) if (art && art.bookId === book.id) { removedSongs.push(songKey); await studyDBRun("covers", "readwrite", store => store.delete(songKey)); }
    await studyRefreshBooks();
    for (const songKey of removedSongs) emit("studyCoverChanged", songKey);
    studyNotify("studyDeleted");
  } catch (error) { console.error(error); studySetStatus("studyStorageError"); }
}
function studyNewGeneration() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
async function studyPrepareReplace(id, title) {
  const existing = await studyDBRun("books", "readonly", store => store.get(id));
  if (!existing) return { existing:null, ok:true };
  return { existing:studyBookClean(existing), ok:confirm(tr("studyReplace", { title })) };
}
async function studyImportImageGroup(group, position, total) {
  if (!group.files.length) return false;
  let bytes = 0;
  for (const item of group.files) {
    const size = Number(item.file.size) || 0;
    if (size > STUDY_IMAGE_FILE_MAX) { studySetStatus("studyFileTooBig", { name:item.file.name, mb:Math.round(STUDY_IMAGE_FILE_MAX / 1048576) }); return false; }
    bytes += size;
  }
  if (group.files.length > STUDY_IMAGE_MAX_COUNT || bytes > STUDY_IMAGE_MAX_BYTES) {
    studySetStatus("studyTooMany", { max:STUDY_IMAGE_MAX_COUNT, mb:Math.round(STUDY_IMAGE_MAX_BYTES / 1048576) }); return false;
  }
  const id = STUDY_UTIL.stableId("image", group.sourcePath);
  if (studyBooks.length >= 500 && !studyBooks.some(book => book.id === id)) { studySetStatus("studyShelfLimit"); return false; }
  let replace;
  try { replace = await studyPrepareReplace(id, group.title); }
  catch (error) { console.error(error); studySetStatus("studyStorageError"); return false; }
  if (!replace.ok) return false;
  const generation = studyNewGeneration(), refs = [], entries = [];
  for (let index = 0; index < group.files.length; index++) {
    const { file, path } = group.files[index], key = `page:${id}:${generation}:${index}`;
    refs.push({ key, name:String(file.name || path).slice(0, 240), path:String(path || file.name).slice(0, 500), size:Number(file.size) || 0, type:String(file.type || "").slice(0, 100) });
    entries.push([key, file.slice(0, file.size, file.type || "application/octet-stream")]);
  }
  try {
    for (let i = 0; i < entries.length; i += 40) {
      await studyDBBatch("pages", entries.slice(i, i + 40));
      studySetStatus("studyImportProgress", { n:Math.min(total, position + Math.min(i + 40, entries.length)), total });
    }
    const now = Date.now(), old = replace.existing;
    const record = { id, kind:"image", title:String(group.title || tr("studyBookImages")).slice(0, 160), sourcePath:group.sourcePath,
      generation, pages:refs, content:"", extension:"", bookmark:old && old.bookmark ? old.bookmark : null,
      createdAt:old ? old.createdAt : now, updatedAt:now };
    await studyDBRun("books", "readwrite", store => store.put(record, id));
    if (old) {
      try {
        const mappings = await studyDBPairs("covers"), changed = [];
        for (const [songKey, art] of mappings) if (art && art.bookId === id) {
          const pageIndex = Math.max(0, Math.floor(Number(art.pageIndex) || 0));
          if (pageIndex < refs.length) await studyDBRun("covers", "readwrite", store => store.put({ ...art, pageKey:refs[pageIndex].key, pageIndex, title:record.title, updatedAt:Date.now() }, songKey));
          else await studyDBRun("covers", "readwrite", store => store.delete(songKey));
          changed.push(songKey);
        }
        for (const songKey of changed) emit("studyCoverChanged", songKey);
      } catch (error) { console.warn("Study covers could not be rebound after replacing an album", error); }
      if (old.pages.length) studyDBDeleteMany("pages", old.pages.map(page => page.key)).catch(() => {});
    }
    return true;
  } catch (error) {
    console.error(error);
    studyDBDeleteMany("pages", refs.map(page => page.key)).catch(() => {});
    studySetStatus("studyStorageError"); return false;
  }
}
async function studyImportImages(files) {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  const groups = STUDY_UTIL.groupImageFiles(files);
  if (!groups.length) { studyNotify("studyNoImageFiles"); return; }
  let imported = 0, position = 0, lastId = "", total = groups.reduce((sum, group) => sum + group.files.length, 0);
  const known = new Set(studyBooks.map(book => book.id));
  try {
    for (const group of groups) {
      const id = STUDY_UTIL.stableId("image", group.sourcePath);
      if (!known.has(id) && known.size >= 500) { studySetStatus("studyShelfLimit"); position += group.files.length; continue; }
      const ok = await studyImportImageGroup(group, position, total);
      if (ok) { imported++; lastId = id; known.add(id); }
      position += group.files.length;
    }
    await studyRefreshBooks();
  } catch (error) { console.error(error); studySetStatus("studyStorageError"); return; }
  if (imported) {
    studyNotify("studyImportDone", { n:imported });
    const newest = studyBooks.find(book => book.id === lastId);
    if (newest) studyOpenBook(newest);
  }
}
async function studyImportTextEntry(entry, position, total) {
  const file = entry.file, size = Number(file.size) || 0;
  if (size > STUDY_TEXT_FILE_MAX) { studySetStatus("studyTextTooBig", { name:file.name, mb:Math.round(STUDY_TEXT_FILE_MAX / 1048576) }); return false; }
  const id = STUDY_UTIL.stableId("text", entry.path);
  if (studyCurrentBook && studyCurrentBook.id === id && !$("studyMemoEditor").hidden) {
    await studyFlushMemo(); $("studyMemoEditor").hidden = true; $("studyTextPage").hidden = false;
    $("studyMemoBtn").textContent = tr("studyMemoEdit"); $("studyMemoExportBtn").hidden = true;
    studyRenderTextContent(studyCurrentBook); studySyncTextProgress();
  }
  let replace;
  try { replace = await studyPrepareReplace(id, entry.title); }
  catch (error) { console.error(error); studySetStatus("studyStorageError"); return false; }
  if (!replace.ok) return false;
  let content;
  try { content = STUDY_UTIL.decodeTextBuffer(await file.arrayBuffer()); }
  catch (error) { console.error(error); studySetStatus("studyDecodeError", { name:file.name }); return false; }
  try {
    const now = Date.now(), old = replace.existing;
    const record = { id, kind:"text", title:String(entry.title || STUDY_UTIL.baseName(file.name)).slice(0, 160), sourcePath:entry.path,
      generation:"", pages:[], content, extension:STUDY_UTIL.extension(file.name), bookmark:old && old.bookmark ? old.bookmark : null,
      createdAt:old ? old.createdAt : now, updatedAt:now };
    await studyDBRun("books", "readwrite", store => store.put(record, id));
    studySetStatus("studyImportProgress", { n:position + 1, total }); return true;
  } catch (error) { console.error(error); studySetStatus("studyStorageError"); return false; }
}
async function studyImportTexts(files) {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  const entries = STUDY_UTIL.listTextFiles(files);
  if (!entries.length) { studyNotify("studyNoTextFiles"); return; }
  if (entries.length > STUDY_TEXT_BATCH_MAX) { studySetStatus("studyTextBatchLimit"); return; }
  let imported = 0, lastId = "";
  const known = new Set(studyBooks.map(book => book.id));
  try {
    for (let i = 0; i < entries.length; i++) {
      const id = STUDY_UTIL.stableId("text", entries[i].path);
      if (!known.has(id) && known.size >= 500) { studySetStatus("studyShelfLimit"); continue; }
      const ok = await studyImportTextEntry(entries[i], i, entries.length);
      if (ok) { imported++; lastId = id; known.add(id); }
    }
    await studyRefreshBooks();
  } catch (error) { console.error(error); studySetStatus("studyStorageError"); return; }
  if (imported) {
    studyNotify("studyImportDone", { n:imported });
    const newest = studyBooks.find(book => book.id === lastId);
    if (newest) studyOpenBook(newest);
  }
}
async function studyFlushMemo() {
  clearTimeout(studyMemoSaveTimer); studyMemoSaveTimer = 0;
  if (!studyCurrentBook || studyCurrentBook.kind !== "text" || $("studyMemoEditor").hidden) return;
  studyCurrentBook.content = $("studyMemoEditor").value;
  try { await studySaveBook(studyCurrentBook); studySetStatus("studyMemoSaved"); }
  catch (error) { console.error(error); studySetStatus("studyMemoSaveError"); }
}
function studyMemoInput() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text") return;
  studyCurrentBook.content = $("studyMemoEditor").value;
  clearTimeout(studyMemoSaveTimer); studyMemoSaveTimer = setTimeout(studyFlushMemo, 600);
}
function studyToggleMemo() {
  const book = studyCurrentBook;
  if (!book || book.kind !== "text") { studyNotify("studyMemoNeedText"); return; }
  const editing = $("studyMemoEditor").hidden;
  if (editing) {
    $("studyMemoEditor").value = book.content || "";
    $("studyMemoEditor").hidden = false; $("studyTextPage").hidden = true;
    $("studyMemoBtn").textContent = tr("studyMemoDone"); $("studyMemoExportBtn").hidden = false;
    $("studyMemoEditor").focus({ preventScroll:true });
  } else {
    studyFlushMemo().finally(() => {
      $("studyMemoEditor").hidden = true; $("studyTextPage").hidden = false;
      $("studyMemoBtn").textContent = tr("studyMemoEdit"); $("studyMemoExportBtn").hidden = true;
      studyRenderTextContent(book); studySyncTextProgress();
    });
  }
}
function studyExportText() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "text") return;
  const text = $("studyMemoEditor").hidden ? studyCurrentBook.content : $("studyMemoEditor").value;
  const ext = studyCurrentBook.extension || "txt", blob = new Blob([text], { type:"text/plain;charset=utf-8" });
  const name = `${(studyCurrentBook.title || "notes").replace(/[\\/:*?"<>|]/g, "_")}.${ext}`;
  if (typeof downloadBlob === "function") downloadBlob(blob, name);
}
function studySaveVideoHome() {
  if (studyVideoHomeParent) return;
  studyVideoHomeParent = video.parentNode; studyVideoHomeNext = video.nextSibling; studyVideoHomeStyle = video.getAttribute("style");
}
function studyMoveVideoToTV() {
  if (!video || !$("studyTvScreen")) return;
  studySaveVideoHome();
  if (video.parentNode !== $("studyTvScreen")) $("studyTvScreen").insertBefore(video, $("studyTvArt"));
  video.classList.add("study-tv-video-visible");
  try { if (typeof newVideoFilter === "function") video.style.filter = newVideoFilter(); } catch (_) {}
}
function studyRestoreVideoHome() {
  if (!video || !studyVideoHomeParent || video.parentNode === studyVideoHomeParent) return;
  const before = studyVideoHomeNext && studyVideoHomeNext.parentNode === studyVideoHomeParent ? studyVideoHomeNext : null;
  studyVideoHomeParent.insertBefore(video, before);
  video.classList.remove("study-tv-video-visible", "study-tv-video-hidden");
  if (studyVideoHomeStyle == null) video.removeAttribute("style"); else video.setAttribute("style", studyVideoHomeStyle);
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
  const hasVideo = !!(videoReady && video.videoWidth > 0 && video.videoHeight > 0 && settings.videoStyle !== "off");
  if (hasVideo) { studySetTVVisible(true, false); return; }
  let blob = null;
  if (song && window.TrkStudyRoom) blob = await studyGetSongCoverBlob(song.key);
  if (!blob && song && song.bgBlob) blob = song.bgBlob;
  if (token !== studyTVToken || !studyRoomOpen) return;
  const artKey = song && song.key || "";
  if (blob) {
    if (studyTVArtSong !== artKey || !studyTVArtUrl) {
      studyClearImage($("studyTvArt"));
      studyTVArtUrl = URL.createObjectURL(blob); studyObjectUrls.add(studyTVArtUrl);
      $("studyTvArt").dataset.studyObjectUrl = studyTVArtUrl; $("studyTvArt").src = studyTVArtUrl;
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
function studyOpenRoom() {
  if (studySafeMode()) { studyNotify("studySafeMode"); return; }
  studyRoomOpen = true; window._trkStudyRoomOpen = true;
  $("studyRoom").hidden = false; document.body.classList.add("study-room-open");
  studyRefreshPrefsUI();
  studyReadyPromise.then(() => {
    studyRenderShelf();
    if (studyCurrentBook) { $("studyWelcome").hidden = true; $("studyBookView").hidden = false; studyApplyTVLayout(); }
  }).catch(error => { console.error(error); studySetStatus("studyStorageError"); });
  if (!studyCurrentBook) { $("studyWelcome").hidden = false; $("studyBookView").hidden = true; studyApplyTVLayout(); }
  $("studyCloseBtn").focus({ preventScroll:true });
}
function studyCloseRoom() {
  if (!studyRoomOpen) return;
  studyFlushMemo(); clearTimeout(studyHoldTimer); studyHoldTimer = 0; studyHeldCode = ""; studyPointerStart = null;
  studyRoomOpen = false; window._trkStudyRoomOpen = false;
  $("studyProgressWrap").hidden = true; $("studyRoom").classList.remove("study-progress-visible");
  if (document.fullscreenElement === $("studyRoom") && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  studyFullscreenFallback = false; $("studyRoom").classList.remove("study-fullimage");
  studyRoom.hidden = true; document.body.classList.remove("study-room-open");
  studyTVToken++; studyRestoreVideoHome();
  studyClearImage($("studyTvArt")); studyTVArtUrl = ""; studyTVArtSong = "";
  const title = document.querySelector("#libPanel .libHead h3"); if (title) title.focus({ preventScroll:true });
}
async function studyToggleFullscreen() {
  if (!studyCurrentBook || studyCurrentBook.kind !== "image") return;
  const room = $("studyRoom");
  if (room.classList.contains("study-fullimage")) {
    if (document.fullscreenElement === room && document.exitFullscreen) { try { await document.exitFullscreen(); } catch (_) {} }
    room.classList.remove("study-fullimage"); studyFullscreenFallback = false; return;
  }
  if (room.requestFullscreen) {
    try { await room.requestFullscreen(); studyFullscreenFallback = false; room.classList.add("study-fullimage"); return; }
    catch (_) { /* embedded webviews can reject fullscreen; keep a CSS-only image focus mode */ }
  }
  studyFullscreenFallback = true; room.classList.add("study-fullimage");
}
function studySyncFullButton() {
  const b = $("studyFullscreenBtn");
  if (!b) return;
  b.textContent = tr($("studyRoom").classList.contains("study-fullimage") ? "studyFullscreenExit" : "studyFullscreen");
}

const studyRoom = $("studyRoom");
for (const node of studyRoom.querySelectorAll("[data-i18n]")) node.textContent = tr(node.dataset.i18n);
$("studySearch").placeholder = tr("studySearch");
$("studyCloseBtn").addEventListener("click", studyCloseRoom);
$("studyBackBtn").addEventListener("click", studyBackToShelf);
$("studyFullscreenBtn").addEventListener("click", studyToggleFullscreen);
$("studyImageMode").addEventListener("change", () => {
  studyPrefs.imageMode = $("studyImageMode").value; studySavePrefs();
  if (studyCurrentBook && studyCurrentBook.kind === "image") {
    studyCurrentPage = studyNormalizePage(studyCurrentPage); studyClearPageImages(); studyRenderImagePage();
  }
  studySyncCurrentBookControls();
});
$("studyAmerican").addEventListener("change", () => {
  studyPrefs.american = $("studyAmerican").checked; studySavePrefs();
  if (studyCurrentBook && studyCurrentBook.kind === "image" && studyPrefs.imageMode !== "vertical") studyRenderImagePage();
  studySyncCurrentBookControls();
});
$("studyTheme").addEventListener("change", () => {
  studyPrefs.theme = $("studyTheme").value; studySavePrefs();
  $("studyTextStage").dataset.theme = studyPrefs.theme; studySyncTextProgress();
});
$("studyTvCheck").addEventListener("change", studySyncTVDirection);
$("studyTvPosition").addEventListener("change", () => {
  if ($("studyTvPosition").value === "off") $("studyTvCheck").checked = false;
  studySyncTVDirection();
});
$("studyMemoEnabled").addEventListener("change", () => {
  studyPrefs.memoEnabled = $("studyMemoEnabled").checked; studySavePrefs();
  if (studyCurrentBook) studySyncCurrentBookControls();
  if (!studyPrefs.memoEnabled && !$("studyMemoEditor").hidden) studyToggleMemo();
});
$("studyBookmarkBtn").addEventListener("click", studySaveBookmark);
$("studyNextBtn").addEventListener("click", () => studyStep(1));
$("studyPrevBtn").addEventListener("click", () => studyStep(-1));
$("studyAssignCoverBtn").addEventListener("click", studyAssignCurrentCover);
$("studyMemoBtn").addEventListener("click", studyToggleMemo);
$("studyMemoExportBtn").addEventListener("click", studyExportText);
$("studyMemoEditor").addEventListener("input", studyMemoInput);
$("studyProgress").addEventListener("change", studyJumpFromSlider);
$("studyProgressDoneBtn").addEventListener("click", studyHideProgress);
$("studySearch").addEventListener("input", studyRenderShelf);
$("studyImageFolderInput").addEventListener("change", event => {
  const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) studyImportImages(files);
});
for (const id of ["studyTextFilesInput", "studyTextFolderInput"]) $(id).addEventListener("change", event => {
  const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) studyImportTexts(files);
});
$("studyImageStage").addEventListener("click", studyImageTap);
$("studyImageStage").addEventListener("pointerdown", studyImagePointerDown);
$("studyImageStage").addEventListener("pointermove", studyImagePointerMove);
$("studyImageStage").addEventListener("pointerup", studyImagePointerEnd);
$("studyImageStage").addEventListener("pointercancel", studyImagePointerEnd);
$("studyImageStage").addEventListener("contextmenu", event => event.preventDefault());
$("studyImageStage").addEventListener("scroll", studyVerticalScroll, { passive:true });
$("studyTextPage").addEventListener("scroll", () => { clearTimeout(studyProgressTimer); studyProgressTimer = setTimeout(studySyncTextProgress, 80); }, { passive:true });
$("studyTextStage").addEventListener("scroll", studySyncTextProgress, { passive:true });
document.addEventListener("keydown", studyKeyDown, true);
document.addEventListener("keyup", studyKeyUp, true);
addEventListener("blur", () => { clearTimeout(studyHoldTimer); studyHeldCode = ""; studyPointerStart = null; });
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && !studyFullscreenFallback) $("studyRoom").classList.remove("study-fullimage");
  studySyncFullButton();
});
video.addEventListener("loadedmetadata", studyRefreshTV); video.addEventListener("loadeddata", studyRefreshTV);
video.addEventListener("resize", studyRefreshTV);
on("songSelected", studyRefreshTV); on("mediaReady", studyRefreshTV);
on("studyCoverChanged", key => { if (!key || currentSong && key === currentSong.key) { studyTVArtSong = ""; studyRefreshTV(); } });
on("phase", p => { if (p !== "title") studyCloseRoom(); else studyRefreshTV(); });
on("language", () => {
  $("studySearch").placeholder = tr("studySearch");
  studyRenderShelf();
  if (studyCurrentBook) {
    $("studyCurrentTitle").textContent = studyCurrentBook.title;
    $("studyCurrentMeta").textContent = studyCurrentBook.kind === "image" ? `${tr("studyBookImages")} · ${tr("studyPageCount", { n:studyCurrentBook.pages.length })}`
      : `${tr("studyBookText")} · ${String(studyCurrentBook.extension || "TXT").toUpperCase()}`;
    $("studyMemoBtn").textContent = $("studyMemoEditor").hidden ? tr("studyMemoEdit") : tr("studyMemoDone");
    $("studyMemoExportBtn").hidden = studyCurrentBook.kind !== "text" || $("studyMemoEditor").hidden;
    studySyncPageCount(); studySyncCurrentBookControls(); studySyncTextProgress(); studySyncFullButton();
  }
});

const studyLaunchTitle = document.querySelector("#libPanel .libHead h3");
if (studyLaunchTitle) {
  studyLaunchTitle.classList.add("study-launch-title"); studyLaunchTitle.tabIndex = 0;
  studyLaunchTitle.setAttribute("role", "button"); studyLaunchTitle.setAttribute("aria-haspopup", "dialog");
  studyLaunchTitle.title = tr("studyLaunchHint"); studyLaunchTitle.setAttribute("aria-label", `${tr("libTitle")}. ${tr("studyLaunchHint")}`);
  studyLaunchTitle.addEventListener("pointerdown", event => {
    if (event.button != null && event.button !== 0) return;
    clearTimeout(studyLaunchTimer); studyLaunchFired = false;
    studyLaunchTimer = setTimeout(() => {
      studyLaunchFired = true; studyOpenRoom();
      setTimeout(() => { studyLaunchFired = false; }, 1200);
    }, 650);
  });
  const releaseLaunch = () => { clearTimeout(studyLaunchTimer); studyLaunchTimer = 0; };
  ["pointerup", "pointercancel", "pointerleave"].forEach(type => studyLaunchTitle.addEventListener(type, releaseLaunch));
  studyLaunchTitle.addEventListener("contextmenu", event => event.preventDefault());
  studyLaunchTitle.addEventListener("click", event => {
    if (studyLaunchFired) { studyLaunchFired = false; event.preventDefault(); event.stopPropagation(); }
    else if (event.detail === 0) studyOpenRoom();
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

let studyReadyPromise = Promise.resolve();
async function studyInit() {
  if (studySafeMode()) return;
  try {
    const saved = await studyDBRun("settings", "readonly", store => store.get("ui"));
    studyReadPrefs(saved); studyRefreshPrefsUI(); await studyRefreshBooks();
  } catch (error) { console.error(error); studySetStatus("studyStorageError"); }
}
studyReadyPromise = studyInit();

window.TrkStudyRoom = Object.freeze({
  open:studyOpenRoom,
  close:studyCloseRoom,
  getSongCoverBlob:studyGetSongCoverBlob,
  books:() => studyBooks.map(book => ({ id:book.id, title:book.title, kind:book.kind, pages:book.pages.length }))
});
