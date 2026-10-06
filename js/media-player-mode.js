// SPDX-License-Identifier: GPL-3.0-or-later
/* ============================================================================
   trk! media-player-mode.js — ▶ メディアプレーヤーモード
   TVの電源ボタンを長押しして、ゲームを始めずに曲を聴くための画面を開く。
   音源は既存の video 要素を使い、曲ファイルは端末内から出ない。
   ============================================================================ */
"use strict";
(() => {

Object.assign(TEXT.ja, {
  tvMediaHoldHint:"電源長押しでメディアプレーヤー",
  dockCastPolicy:"キャストアンテナ", dockCastOff:"キャストしない（キャストアンテナを隠す）", dockCastAntenna:"キャストアンテナを表示", dockCastHint:"キャストアンテナはバックグラウンド再生のアンテナと別々に表示/非表示できます。ここで消しても、曲の再生用のアンテナは消えません。自動接続はせず、クリックしたときだけ対応ブラウザーの選択画面を開きます。", dockCastUnsupported:"このブラウザは外部出力選択に対応していません。", dockCastOn:"📡 キャスト先の選択を開きました", dockCastOffDone:"📡 キャストを切断しました", dockCastFailed:"外部出力を開始できませんでした。", dockCastButton:"キャスト", dockBackgroundPolicy:"バックグラウンド再生アンテナ", dockBackgroundOff:"表示しない（バックグラウンド再生なし）", dockBackgroundAntenna:"ドックにアンテナを表示", dockBackgroundCorner:"右上に置く（言語の左・コンパクト）", dockBackgroundHint:"キャストとは別に、バックグラウンド再生だけを許可します。「ドックにアンテナを表示」か「右上に置く」のときONにすると、裏にしても再生を続けます。",
  mediaTitle:"▶ メディアプレーヤー",
  mediaSubtitle:"ゲームを始めずに、曲を聴くための再生画面です。曲送り・リピート・シャッフル・速度・スリープタイマーを使えます。",
  mediaClose:"閉じる", mediaNoTrack:"曲を選ぶと、ここでフル再生できます。",
  mediaNow:"再生中", mediaPaused:"一時停止", mediaEnded:"再生終了",
  mediaPrev:"前の曲", mediaNext:"次の曲", mediaPlay:"再生", mediaPause:"一時停止", mediaRestart:"最初から",
  mediaVolume:"音量", mediaMute:"ミュート", mediaUnmute:"ミュート解除", mediaSeek:"再生位置",
  mediaShuffle:"シャッフル", mediaRepeat:"リピート", mediaRepeatOff:"なし", mediaRepeatOne:"1曲", mediaRepeatAll:"全曲",
  mediaRate:"再生速度", mediaSleep:"スリープタイマー", mediaSleepOff:"なし", mediaSleep15:"15分", mediaSleep30:"30分", mediaSleep60:"60分",
  mediaQueue:"再生キュー", mediaQueueHint:"曲を選ぶと、この画面を閉じずに再生します。曲リストに追加した音源・共有フォルダ・曲パックをまとめて扱えます。",
  mediaSearch:"キューを検索…", mediaNoSongs:"まだ曲がありません。選曲画面から音源を追加してください。", mediaNoMatch:"一致する曲がありません。",
  mediaSleepSet:"{n}分後に再生を止めます。", mediaSleepDone:"スリープタイマーで停止しました。", mediaLoaded:"読み込み中…", mediaLoadFailed:"この曲を読み込めませんでした。",
  mediaKeyboard:"Space：再生／一時停止　←→：10秒　N：次の曲　P：前の曲　Esc：閉じる　逆再生・区間ループ・壁紙は設定で割り当て",
  mediaVideoKeysTitle:"🎬 動画プレーヤーのキー", mediaWallKey:"壁紙／スクリーンセーバー", mediaReverse:"逆再生", mediaReverseStart:"逆再生を開始", mediaForward:"順再生に戻す", mediaReverseLoading:"逆再生を準備中…", mediaReverseUnavailable:"この曲の逆再生用音声を準備できませんでした。映像のみで試します。", mediaReverseDone:"曲の先頭まで逆再生しました。",
  mediaLoop:"区間ループ", mediaLoopSetA:"A点を設定", mediaLoopSetB:"B点を設定", mediaLoopClear:"解除", mediaLoopMode:"区間ループの操作", mediaLoopToggle:"トグル", mediaLoopHold:"長押し中だけ", mediaLoopHint:"A点・B点を設定すると、範囲をくり返します。割り当てキーはA点 → B点／開始 → 解除を順に操作できます。", mediaLoopNone:"区間ループ：なし", mediaLoopOnlyA:"A点 {a} — B点を設定してください", mediaLoopRange:"{a} – {b} をくり返し中", mediaLoopNeedRange:"先にA点とB点を設定してください。", mediaLoopLabTitle:"🎛 ループ・ラボ", mediaLoopQuickHint:"5秒・10秒・20秒の区間をすぐ作れます。保存した区間は曲ごとに端末内へ記録します。", mediaLoopQuick5:"5秒", mediaLoopQuick10:"10秒", mediaLoopQuick20:"20秒", mediaLoopRandom:"🎲 ランダム区間", mediaLoopSave:"この区間を保存", mediaLoopPresets:"保存した区間", mediaLoopNoPresets:"保存した区間はまだありません。", mediaLoopDelete:"この区間を削除", mediaLoopClearPresets:"保存を消去", mediaLoopSaved:"区間を保存しました",
  mediaWall:"壁紙／スクリーンセーバー", mediaWallShow:"壁紙を表示", mediaWallHide:"壁紙を閉じる", mediaWallHint:"人目を避けたいときに動画を壁紙で隠します。ESCまたは同じキーで戻れます。", mediaWallStyle:"壁紙", mediaWallMidnight:"ミッドナイト", mediaWallAurora:"オーロラ", mediaWallPaper:"紙", mediaWallCustom:"アップロード画像", mediaWallUpload:"画像を選ぶ", mediaWallUploadHint:"画像はこのセッションの端末内だけで使います。外部へ送信しません。", mediaWallResetImage:"アップロード画像を外す", mediaWallNoImage:"画像を選ぶとここに表示します。", mediaWallClock:"時計を表示", mediaWallPlayback:"壁紙中の動画", mediaWallStopVideo:"動画を止める", mediaWallContinueVideo:"動画を続ける", mediaWallTrigger:"壁紙キーの操作", mediaWallToggle:"トグル", mediaWallHold:"長押し中だけ",
  mediaVideoMax:"全画面で表示", mediaVideoMaxClose:"全画面を閉じる",
  mediaVideoZoomIn:"動画を拡大", mediaVideoZoomOut:"動画を縮小", mediaVideoFaster:"再生速度を上げる", mediaVideoSlower:"再生速度を下げる", mediaVideoPause:"再生／一時停止",
  mediaVideoKeysHint:"メディアプレーヤー中の動画操作、逆再生、区間ループと、ゲーム中の背景動画の拡大・縮小をキーに割り当てます。ゲームの判定や記録は変わりません。",
  mediaVideoKeysReset:"↺ 動画キーを初期値に戻す", mediaVideoCapture0:"「動画を拡大」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture1:"「動画を縮小」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture2:"「再生速度を上げる」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture3:"「再生速度を下げる」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture4:"「再生／一時停止」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture5:"「逆再生」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture6:"「区間ループ」に割り当てるキーを押してください。ESCでキャンセル。", mediaVideoCapture7:"「壁紙／スクリーンセーバー」に割り当てるキーを押してください。ESCでキャンセル。",
  mediaVideoToastZoom:"動画ズーム {n}x", mediaVideoToastRate:"再生速度 {n}x",
  mediaModeStatus:"メディアプレーヤー中（ゲームの記録には影響しません）"
});
Object.assign(TEXT.en, {
  tvMediaHoldHint:"Long-press power for media player",
  dockCastPolicy:"Cast antenna", dockCastOff:"Don't cast (hide the cast antenna)", dockCastAntenna:"Show the cast antenna", dockCastHint:"The cast antenna is toggled separately from the background playback antenna — hiding it never hides the playback one. It never auto-connects; clicking it opens the picker on supported browsers only.", dockCastUnsupported:"This browser doesn't support the external playback picker.", dockCastOn:"📡 Opened the cast picker", dockCastOffDone:"📡 Cast disconnected", dockCastFailed:"Couldn't start external playback.", dockCastButton:"Cast", dockBackgroundPolicy:"Background playback antenna", dockBackgroundOff:"Hide (no background playback)", dockBackgroundAntenna:"Show on the dock", dockBackgroundCorner:"Top-right (left of Language, compact)", dockBackgroundHint:"Background playback can be allowed separately from casting. With \"Show on the dock\" or \"Top-right\", turning it on keeps playing in the background.",
  mediaTitle:"▶ Media player",
  mediaSubtitle:"Listen without starting a game. Use track controls, repeat, shuffle, playback speed, and a sleep timer.",
  mediaClose:"Close", mediaNoTrack:"Choose a song to play it here in full.",
  mediaNow:"Playing", mediaPaused:"Paused", mediaEnded:"Finished",
  mediaPrev:"Previous", mediaNext:"Next", mediaPlay:"Play", mediaPause:"Pause", mediaRestart:"Restart",
  mediaVolume:"Volume", mediaMute:"Mute", mediaUnmute:"Unmute", mediaSeek:"Position",
  mediaShuffle:"Shuffle", mediaRepeat:"Repeat", mediaRepeatOff:"Off", mediaRepeatOne:"One", mediaRepeatAll:"All",
  mediaRate:"Playback speed", mediaSleep:"Sleep timer", mediaSleepOff:"Off", mediaSleep15:"15 min", mediaSleep30:"30 min", mediaSleep60:"60 min",
  mediaQueue:"Queue", mediaQueueHint:"Choose a track to play it without closing this screen. Added files, shared folders, and song packs appear together.",
  mediaSearch:"Search queue…", mediaNoSongs:"No songs yet. Add audio from song select.", mediaNoMatch:"No matching songs.",
  mediaSleepSet:"Playback will stop in {n} minutes.", mediaSleepDone:"Sleep timer stopped playback.", mediaLoaded:"Loading…", mediaLoadFailed:"This track could not be loaded.",
  mediaKeyboard:"Space: play/pause   ←→: 10 seconds   N: next   P: previous   Esc: close   Assign reverse / A-B loop / wallpaper in Settings",
  mediaVideoKeysTitle:"🎬 Video player keys", mediaWallKey:"Wallpaper / screen saver", mediaReverse:"Reverse", mediaReverseStart:"Start reverse", mediaForward:"Return to forward", mediaReverseLoading:"Preparing reverse playback…", mediaReverseUnavailable:"Could not prepare reverse audio for this track. Trying video frames only.", mediaReverseDone:"Reverse playback reached the beginning.",
  mediaLoop:"A-B loop", mediaLoopSetA:"Set A", mediaLoopSetB:"Set B", mediaLoopClear:"Clear", mediaLoopMode:"A-B loop control", mediaLoopToggle:"Toggle", mediaLoopHold:"While held", mediaLoopHint:"Set A and B to repeat a range. The assigned key cycles A → B / start → clear.", mediaLoopNone:"A-B loop: off", mediaLoopOnlyA:"A at {a} — set B", mediaLoopRange:"Repeating {a} – {b}", mediaLoopNeedRange:"Set both A and B first.", mediaLoopLabTitle:"🎛 Loop lab", mediaLoopQuickHint:"Make a 5, 10, or 20 second loop instantly. Saved ranges stay on this device per song.", mediaLoopQuick5:"5 sec", mediaLoopQuick10:"10 sec", mediaLoopQuick20:"20 sec", mediaLoopRandom:"🎲 Random range", mediaLoopSave:"Save this range", mediaLoopPresets:"Saved ranges", mediaLoopNoPresets:"No saved ranges yet.", mediaLoopDelete:"Delete this range", mediaLoopClearPresets:"Clear saved", mediaLoopSaved:"Range saved",
  mediaWall:"Wallpaper / screen saver", mediaWallShow:"Show wallpaper", mediaWallHide:"Close wallpaper", mediaWallHint:"Hide the video behind a wallpaper when you need privacy. Press ESC or the same key to return.", mediaWallStyle:"Wallpaper", mediaWallMidnight:"Midnight", mediaWallAurora:"Aurora", mediaWallPaper:"Paper", mediaWallCustom:"Uploaded image", mediaWallUpload:"Choose image", mediaWallUploadHint:"The image stays on this device for this session and is never uploaded.", mediaWallResetImage:"Remove uploaded image", mediaWallNoImage:"Choose an image to show it here.", mediaWallClock:"Show clock", mediaWallPlayback:"Video while wallpaper is shown", mediaWallStopVideo:"Stop video", mediaWallContinueVideo:"Keep video playing", mediaWallTrigger:"Wallpaper key behavior", mediaWallToggle:"Toggle", mediaWallHold:"While held",
  mediaVideoMax:"Full screen", mediaVideoMaxClose:"Close full screen",
  mediaVideoZoomIn:"Zoom in", mediaVideoZoomOut:"Zoom out", mediaVideoFaster:"Speed up", mediaVideoSlower:"Slow down", mediaVideoPause:"Play / pause",
  mediaVideoKeysHint:"Assign keys for video zoom, reverse playback, A-B looping, and media-player controls. Game judgment and records are not changed.",
  mediaVideoKeysReset:"↺ Reset video keys", mediaVideoCapture0:"Press a key for “Zoom in”. ESC cancels.", mediaVideoCapture1:"Press a key for “Zoom out”. ESC cancels.", mediaVideoCapture2:"Press a key for “Speed up”. ESC cancels.", mediaVideoCapture3:"Press a key for “Slow down”. ESC cancels.", mediaVideoCapture4:"Press a key for “Play / pause”. ESC cancels.", mediaVideoCapture5:"Press a key for “Reverse”. ESC cancels.", mediaVideoCapture6:"Press a key for “A-B loop”. ESC cancels.", mediaVideoCapture7:"Press a key for “Wallpaper / screen saver”. ESC cancels.",
  mediaVideoToastZoom:"Video zoom {n}x", mediaVideoToastRate:"Playback speed {n}x",
  mediaModeStatus:"Media player (does not affect game records)"
});
Object.assign(TEXT.zh, {
  tvMediaHoldHint:"长按电源打开媒体播放器",
  dockCastPolicy:"投放天线", dockCastOff:"不投放（隐藏投放天线）", dockCastAntenna:"显示投放天线", dockCastHint:"投放天线与后台播放的天线分别开关，在这里隐藏也不会隐藏播放用的天线。不会自动连接，只在点击时于支持的浏览器打开选择画面。", dockCastUnsupported:"此浏览器不支持外部输出选择。", dockCastOn:"📡 已打开投放选择", dockCastOffDone:"📡 已断开投放", dockCastFailed:"无法开始外部输出。", dockCastButton:"投放", dockBackgroundPolicy:"后台播放天线", dockBackgroundOff:"不显示（无后台播放）", dockBackgroundAntenna:"在机台上显示天线", dockBackgroundCorner:"放到右上角（语言左侧·紧凑）", dockBackgroundHint:"可以与投放分开，只允许后台播放。选择「在机台上显示」或「放到右上角」并开启后，切到后台也会继续播放。",
  mediaTitle:"▶ 媒体播放器", mediaSubtitle:"不开始游戏也能听歌。支持切歌、循环、随机、播放速度和睡眠定时器。",
  mediaClose:"关闭", mediaNoTrack:"选择歌曲后，就能在这里完整播放。", mediaNow:"正在播放", mediaPaused:"已暂停", mediaEnded:"播放结束",
  mediaPrev:"上一首", mediaNext:"下一首", mediaPlay:"播放", mediaPause:"暂停", mediaRestart:"从头播放",
  mediaVolume:"音量", mediaMute:"静音", mediaUnmute:"取消静音", mediaSeek:"播放位置",
  mediaShuffle:"随机", mediaRepeat:"循环", mediaRepeatOff:"关闭", mediaRepeatOne:"单曲", mediaRepeatAll:"全部",
  mediaRate:"播放速度", mediaSleep:"睡眠定时", mediaSleepOff:"关闭", mediaSleep15:"15分钟", mediaSleep30:"30分钟", mediaSleep60:"60分钟",
  mediaQueue:"播放队列", mediaQueueHint:"选择歌曲后会在此画面中播放。添加的文件、共享文件夹和歌曲包会合并显示。",
  mediaSearch:"搜索队列…", mediaNoSongs:"还没有歌曲。请先在选曲画面添加音频。", mediaNoMatch:"没有匹配的歌曲。",
  mediaSleepSet:"将在{n}分钟后停止播放。", mediaSleepDone:"睡眠定时器已停止播放。", mediaLoaded:"正在读取…", mediaLoadFailed:"无法读取这首歌。",
  mediaKeyboard:"空格：播放／暂停　←→：10秒　N：下一首　P：上一首　Esc：关闭　倒放／区间循环／壁纸可在设置中分配",
  mediaVideoKeysTitle:"🎬 视频播放器按键", mediaWallKey:"壁纸／屏幕保护", mediaReverse:"倒放", mediaReverseStart:"开始倒放", mediaForward:"恢复正放", mediaReverseLoading:"正在准备倒放…", mediaReverseUnavailable:"无法准备这首歌的倒放音频，将尝试仅倒放画面。", mediaReverseDone:"倒放已到达开头。",
  mediaLoop:"区间循环", mediaLoopSetA:"设为A点", mediaLoopSetB:"设为B点", mediaLoopClear:"解除", mediaLoopMode:"区间循环操作", mediaLoopToggle:"切换", mediaLoopHold:"按住时循环", mediaLoopHint:"设置A点和B点后重复区间。分配的按键会依次执行A点 → B点／开始 → 解除。", mediaLoopNone:"区间循环：关闭", mediaLoopOnlyA:"A点 {a} — 请设置B点", mediaLoopRange:"重复 {a} – {b}", mediaLoopNeedRange:"请先设置A点和B点。", mediaLoopLabTitle:"🎛 循环实验室", mediaLoopQuickHint:"可立即创建5秒、10秒或20秒区间。保存的区间会按歌曲保存在设备中。", mediaLoopQuick5:"5秒", mediaLoopQuick10:"10秒", mediaLoopQuick20:"20秒", mediaLoopRandom:"🎲 随机区间", mediaLoopSave:"保存此区间", mediaLoopPresets:"已保存区间", mediaLoopNoPresets:"还没有保存的区间。", mediaLoopDelete:"删除此区间", mediaLoopClearPresets:"清除保存", mediaLoopSaved:"区间已保存",
  mediaWall:"壁纸／屏幕保护", mediaWallShow:"显示壁纸", mediaWallHide:"关闭壁纸", mediaWallHint:"需要隐私时，用壁纸遮住视频。按ESC或同一个按键返回。", mediaWallStyle:"壁纸", mediaWallMidnight:"午夜", mediaWallAurora:"极光", mediaWallPaper:"纸张", mediaWallCustom:"上传的图片", mediaWallUpload:"选择图片", mediaWallUploadHint:"图片仅在本次会话中保留在设备上，不会上传到外部。", mediaWallResetImage:"移除上传图片", mediaWallNoImage:"选择图片后会显示在这里。", mediaWallClock:"显示时钟", mediaWallPlayback:"显示壁纸时的视频", mediaWallStopVideo:"停止视频", mediaWallContinueVideo:"继续播放视频", mediaWallTrigger:"壁纸按键操作", mediaWallToggle:"切换", mediaWallHold:"按住时显示",
  mediaVideoMax:"全屏显示", mediaVideoMaxClose:"关闭全屏",
  mediaVideoZoomIn:"放大视频", mediaVideoZoomOut:"缩小视频", mediaVideoFaster:"提高速度", mediaVideoSlower:"降低速度", mediaVideoPause:"播放／暂停",
  mediaVideoKeysHint:"为视频缩放、倒放、区间循环和媒体播放器操作分配按键。不会改变游戏判定或记录。",
  mediaVideoKeysReset:"↺ 恢复视频按键", mediaVideoCapture0:"请按下“放大视频”的按键。ESC取消。", mediaVideoCapture1:"请按下“缩小视频”的按键。ESC取消。", mediaVideoCapture2:"请按下“提高速度”的按键。ESC取消。", mediaVideoCapture3:"请按下“降低速度”的按键。ESC取消。", mediaVideoCapture4:"请按下“播放／暂停”的按键。ESC取消。", mediaVideoCapture5:"请按下“倒放”的按键。ESC取消。", mediaVideoCapture6:"请按下“区间循环”的按键。ESC取消。", mediaVideoCapture7:"请按下“壁纸／屏幕保护”的按键。ESC取消。",
  mediaVideoToastZoom:"视频缩放 {n}x", mediaVideoToastRate:"播放速度 {n}x",
  mediaModeStatus:"媒体播放器中（不影响游戏记录）"
});
Object.assign(TEXT.ko, {
  tvMediaHoldHint:"전원 길게 눌러 미디어 플레이어",
  dockCastPolicy:"캐스트 안테나", dockCastOff:"캐스트 안 함 (캐스트 안테나 숨기기)", dockCastAntenna:"캐스트 안테나 표시", dockCastHint:"캐스트 안테나는 백그라운드 재생 안테나와 별도로 켜고 끌 수 있으며, 여기서 숨겨도 재생용 안테나는 사라지지 않습니다. 자동 연결 없이 클릭할 때만 지원 브라우저의 선택기를 엽니다.", dockCastUnsupported:"이 브라우저는 외부 출력 선택을 지원하지 않습니다.", dockCastOn:"📡 캐스트 선택을 열었습니다", dockCastOffDone:"📡 캐스트 연결을 끊었습니다", dockCastFailed:"외부 출력을 시작하지 못했습니다.", dockCastButton:"캐스트", dockBackgroundPolicy:"백그라운드 재생 안테나", dockBackgroundOff:"표시하지 않기 (백그라운드 재생 없음)", dockBackgroundAntenna:"독에 안테나 표시", dockBackgroundCorner:"오른쪽 상단에 두기 (언어 왼쪽·컴팩트)", dockBackgroundHint:"캐스트와 별도로 백그라운드 재생만 허용할 수 있습니다. 독에 안테나 표시 또는 오른쪽 상단에 두기를 켜면 백그라운드에서도 계속 재생합니다.",
  mediaTitle:"▶ 미디어 플레이어", mediaSubtitle:"게임을 시작하지 않고 음악을 듣습니다. 곡 넘기기・반복・셔플・재생 속도・취침 타이머를 지원합니다.",
  mediaClose:"닫기", mediaNoTrack:"곡을 고르면 여기서 전체 재생할 수 있습니다.", mediaNow:"재생 중", mediaPaused:"일시정지", mediaEnded:"재생 완료",
  mediaPrev:"이전 곡", mediaNext:"다음 곡", mediaPlay:"재생", mediaPause:"일시정지", mediaRestart:"처음부터",
  mediaVolume:"볼륨", mediaMute:"음소거", mediaUnmute:"음소거 해제", mediaSeek:"재생 위치",
  mediaShuffle:"셔플", mediaRepeat:"반복", mediaRepeatOff:"끔", mediaRepeatOne:"한 곡", mediaRepeatAll:"전체",
  mediaRate:"재생 속도", mediaSleep:"취침 타이머", mediaSleepOff:"끔", mediaSleep15:"15분", mediaSleep30:"30분", mediaSleep60:"60분",
  mediaQueue:"재생 큐", mediaQueueHint:"곡을 고르면 이 화면을 닫지 않고 재생합니다. 추가한 파일・공유 폴더・곡 팩을 함께 표시합니다.",
  mediaSearch:"큐 검색…", mediaNoSongs:"아직 곡이 없습니다. 곡 선택 화면에서 음원을 추가하세요.", mediaNoMatch:"일치하는 곡이 없습니다.",
  mediaSleepSet:"{n}분 후 재생을 멈춥니다.", mediaSleepDone:"취침 타이머로 재생을 멈췄습니다.", mediaLoaded:"불러오는 중…", mediaLoadFailed:"이 곡을 불러오지 못했습니다.",
  mediaKeyboard:"Space: 재생／일시정지   ←→: 10초   N: 다음   P: 이전   Esc: 닫기   역재생／구간 반복／배경은 설정에서 지정",
  mediaVideoKeysTitle:"🎬 동영상 플레이어 키", mediaWallKey:"배경／스크린세이버", mediaReverse:"역재생", mediaReverseStart:"역재생 시작", mediaForward:"정재생으로", mediaReverseLoading:"역재생 준비 중…", mediaReverseUnavailable:"이 곡의 역재생 오디오를 준비하지 못했습니다. 영상 프레임만 시도합니다.", mediaReverseDone:"역재생이 처음에 도달했습니다.",
  mediaLoop:"구간 반복", mediaLoopSetA:"A점 설정", mediaLoopSetB:"B점 설정", mediaLoopClear:"해제", mediaLoopMode:"구간 반복 조작", mediaLoopToggle:"토글", mediaLoopHold:"누르는 동안", mediaLoopHint:"A점과 B점을 설정하면 구간을 반복합니다. 지정한 키는 A점 → B점／시작 → 해제를 차례로 실행합니다.", mediaLoopNone:"구간 반복: 없음", mediaLoopOnlyA:"A점 {a} — B점을 정해 주세요", mediaLoopRange:"{a} – {b} 반복 중", mediaLoopNeedRange:"먼저 A점과 B점을 설정하세요.", mediaLoopLabTitle:"🎛 반복 실험실", mediaLoopQuickHint:"5초・10초・20초 구간을 바로 만들 수 있습니다. 저장한 구간은 곡별로 이 기기에 기록됩니다.", mediaLoopQuick5:"5초", mediaLoopQuick10:"10초", mediaLoopQuick20:"20초", mediaLoopRandom:"🎲 랜덤 구간", mediaLoopSave:"이 구간 저장", mediaLoopPresets:"저장한 구간", mediaLoopNoPresets:"저장한 구간이 없습니다.", mediaLoopDelete:"이 구간 삭제", mediaLoopClearPresets:"저장 지우기", mediaLoopSaved:"구간을 저장했습니다",
  mediaWall:"배경／스크린세이버", mediaWallShow:"배경 표시", mediaWallHide:"배경 닫기", mediaWallHint:"사생활이 필요할 때 배경으로 영상을 가립니다. ESC 또는 같은 키로 돌아갑니다.", mediaWallStyle:"배경", mediaWallMidnight:"미드나이트", mediaWallAurora:"오로라", mediaWallPaper:"종이", mediaWallCustom:"업로드한 이미지", mediaWallUpload:"이미지 선택", mediaWallUploadHint:"이미지는 이번 세션 동안 이 기기에만 보관되며 외부로 업로드되지 않습니다.", mediaWallResetImage:"업로드한 이미지 제거", mediaWallNoImage:"이미지를 선택하면 여기에 표시됩니다.", mediaWallClock:"시계 표시", mediaWallPlayback:"배경 표시 중 동영상", mediaWallStopVideo:"동영상 멈추기", mediaWallContinueVideo:"동영상 계속 재생", mediaWallTrigger:"배경 키 동작", mediaWallToggle:"토글", mediaWallHold:"누르는 동안 표시",
  mediaVideoMax:"전체 화면으로 보기", mediaVideoMaxClose:"전체 화면 닫기",
  mediaVideoZoomIn:"동영상 확대", mediaVideoZoomOut:"동영상 축소", mediaVideoFaster:"재생 속도 높이기", mediaVideoSlower:"재생 속도 낮추기", mediaVideoPause:"재생／일시정지",
  mediaVideoKeysHint:"동영상 확대·축소, 역재생, 구간 반복과 미디어 플레이어 조작 키를 지정합니다. 게임 판정과 기록은 바뀌지 않습니다.",
  mediaVideoKeysReset:"↺ 동영상 키 초기화", mediaVideoCapture0:"'동영상 확대'로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture1:"'동영상 축소'로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture2:"'재생 속도 높이기'로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture3:"'재생 속도 낮추기'로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture4:"'재생／일시정지'로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture5:"'역재생'으로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture6:"'구간 반복'으로 지정할 키를 누르세요. ESC로 취소.", mediaVideoCapture7:"'배경／스크린세이버'로 지정할 키를 누르세요. ESC로 취소.",
  mediaVideoToastZoom:"동영상 확대 {n}x", mediaVideoToastRate:"재생 속도 {n}x",
  mediaModeStatus:"미디어 플레이어 중 (게임 기록에 영향 없음)"
});

const HOLD_MS = 650;
if (!Array.isArray(settings.videoKeys) || settings.videoKeys.length !== VIDEO_KEY_DEFAULTS.length || settings.videoKeys.some(k => !validCode(k)) || new Set(settings.videoKeys).size !== VIDEO_KEY_DEFAULTS.length) settings.videoKeys = VIDEO_KEY_DEFAULTS.slice();
let overlay, dialog, powerButton;
let mediaOpen = false, holdTimer = 0, longPressed = false;
let repeatMode = settings.mediaRepeat || "off", shuffle = !!settings.mediaShuffle;
let mediaRate = Number(settings.mediaRate) || 1, sleepTimer = 0, sleepUntil = 0, tickTimer = 0;
let seeking = false, queueFilter = "", videoBinding = null;
let reverseActive = false, reverseLoading = false, reverseTimer = 0, reverseSource = null, reverseGain = null;
let reverseBuffer = null, reverseBufferKey = "", reverseVideoMuted = false, reverseStartAt = 0, reverseClockAt = 0;
let loopTimer = 0;
let loopA = null, loopB = null, loopActive = false, loopKeyDown = false;
let wallOverlay, wallClockNode, wallDateNode, wallNode, wallStyleNode, wallClockCheck, wallPlaybackNode, wallTriggerNode, wallFileNode, wallResetNode;
let maxNode = null;   /* 🖥 「全画面で表示」（js/video-max.js） */
/* ✨ フレーム補完（js/frame-interp.js）：区間ループのすぐ上に置く設定と、映像エリア */
let interpBox = null, interpModeNode = null, interpStrengthNode = null, interpStrengthVal = null;
let interpStatusNode = null, interpHintNode = null, interpUnsupported = null;
let stageWrap = null, stageCanvas = null, stageCtx = null, stageNote = null;
let stageRaf = 0;
let wallActive = false, wallKeyDown = false, wallTimer = 0, wallWasPlaying = false, wallCustomURL = "";
let mediaExitBinding = null;
const VIDEO_KEY_LABELS = ["mediaVideoZoomIn", "mediaVideoZoomOut", "mediaVideoFaster", "mediaVideoSlower", "mediaVideoPause", "mediaReverse", "mediaLoop", "mediaWallKey"];
const REVERSE_KEY_INDEX = 5, LOOP_KEY_INDEX = 6, WALL_KEY_INDEX = 7;
const VIDEO_KEY_BAD = ["Escape", "Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight", "Backquote", "Backspace"];
const MEDIA_POS_KEY = "trk_media_positions_v1", MEDIA_LOOP_KEY = "trk_media_loop_presets_v1";
let mediaPositions = {}, mediaLoopPresets = {};
try { mediaPositions = JSON.parse(localStorage.getItem(MEDIA_POS_KEY)) || {}; } catch (_) { mediaPositions = {}; }
try { mediaLoopPresets = JSON.parse(localStorage.getItem(MEDIA_LOOP_KEY)) || {}; } catch (_) { mediaLoopPresets = {}; }
function mediaLoopStoreKey() { return (currentSong && currentSong.key) || fingerprint || ""; }
function storedMediaLoops() { const list = mediaLoopPresets[mediaLoopStoreKey()]; return Array.isArray(list) ? list.filter(x => x && Number.isFinite(x.a) && Number.isFinite(x.b) && x.b > x.a).slice(0, 8) : []; }
function saveMediaLoopStore() { try { localStorage.setItem(MEDIA_LOOP_KEY, JSON.stringify(mediaLoopPresets)); } catch (_) {} }
function mediaPositionKey() { return fingerprint || (currentSong && currentSong.key) || ""; }
function savedMediaPosition() {
  const p = Number(mediaPositions[mediaPositionKey()]);
  return Number.isFinite(p) && p > 5 && video.duration > p + 5 ? p : 0;
}
function saveMediaPosition(clear = false) {
  const key = mediaPositionKey(); if (!key || !videoReady) return;
  if (clear || video.ended || !Number.isFinite(video.currentTime) || video.currentTime < 5 || video.currentTime >= (video.duration || Infinity) - 5) delete mediaPositions[key];
  else mediaPositions[key] = Math.round(video.currentTime * 10) / 10;
  try { localStorage.setItem(MEDIA_POS_KEY, JSON.stringify(mediaPositions)); } catch (_) {}
}
function loopHasRange() { return Number.isFinite(loopA) && Number.isFinite(loopB) && loopB > loopA; }
function loopStatusText() {
  if (!Number.isFinite(loopA)) return tr("mediaLoopNone");
  if (!Number.isFinite(loopB)) return tr("mediaLoopOnlyA", { a:mpFmt(loopA) });
  return loopActive ? tr("mediaLoopRange", { a:mpFmt(loopA), b:mpFmt(loopB) }) : tr("mediaLoop", {});
}
function setMediaLoopRange(a, b, active = true) {
  if (!videoReady || !Number.isFinite(video.duration) || video.duration <= 0) return false;
  const duration = video.duration;
  loopA = Math.max(0, Math.min(duration, Number(a) || 0));
  loopB = Math.max(0, Math.min(duration, Number(b) || loopA + .1));
  if (loopB - loopA < .1) {
    if (loopA >= duration - .1) { loopB = duration; loopA = Math.max(0, duration - .1); }
    else loopB = Math.min(duration, loopA + .1);
  }
  loopActive = loopB > loopA && active; loopKeyDown = false;
  try { video.currentTime = loopA; } catch (_) {}
  renderLoopUI(); return loopHasRange();
}
function setQuickMediaLoop(seconds) {
  if (!videoReady || !Number.isFinite(video.duration)) return;
  const len = Math.min(Number(seconds) || 5, video.duration), cur = Math.max(0, video.currentTime || 0);
  const start = Math.max(0, Math.min(cur, video.duration - len));
  setMediaLoopRange(start, start + len, true);
}
function setRandomMediaLoop() {
  if (!videoReady || !Number.isFinite(video.duration)) return;
  const len = Math.min(video.duration, 4 + Math.floor(Math.random() * 9));
  const start = Math.random() * Math.max(0, video.duration - len);
  setMediaLoopRange(start, start + len, true);
}
function saveMediaLoopPreset() {
  if (!loopHasRange()) { if (typeof showToast === "function") showToast(tr("mediaLoopNeedRange")); return; }
  const key = mediaLoopStoreKey(); if (!key) return;
  const list = storedMediaLoops().filter(x => Math.abs(x.a - loopA) > .1 || Math.abs(x.b - loopB) > .1);
  list.unshift({ a:Math.round(loopA * 10) / 10, b:Math.round(loopB * 10) / 10 });
  mediaLoopPresets[key] = list.slice(0, 8); saveMediaLoopStore();
  if (typeof showToast === "function") showToast(tr("mediaLoopSaved"));
  renderLoopUI();
}
function clearMediaLoopPresets() {
  const key = mediaLoopStoreKey(); if (!key) return;
  delete mediaLoopPresets[key]; saveMediaLoopStore(); renderLoopUI();
}
function deleteMediaLoopPreset(index) {
  const key = mediaLoopStoreKey(); if (!key) return;
  const list = storedMediaLoops().filter((_, i) => i !== index);
  if (list.length) mediaLoopPresets[key] = list; else delete mediaLoopPresets[key];
  saveMediaLoopStore(); renderLoopUI();
}
function syncLoopPresetSelection() {
  if (!loopPresetListNode) return;
  const list = storedMediaLoops();
  loopPresetListNode.querySelectorAll(".mediaLoopPreset").forEach((button, i) => {
    const x = list[i], selected = !!x && loopHasRange() && Math.abs(x.a - loopA) < .11 && Math.abs(x.b - loopB) < .11;
    button.classList.toggle("selected", selected); button.setAttribute("aria-pressed", String(selected));
  });
}
function renderLoopPresets() {
  if (!loopPresetListNode) return;
  const key = mediaLoopStoreKey(), list = storedMediaLoops(), sig = list.map(x => `${x.a}:${x.b}`).join("|");
  if (loopPresetRenderKey === key && loopPresetRenderSig === sig) {
    if (loopSaveNode) loopSaveNode.disabled = !loopHasRange();
    if (loopClearPresetsNode) loopClearPresetsNode.disabled = !list.length;
    syncLoopPresetSelection(); return;
  }
  loopPresetRenderKey = key; loopPresetRenderSig = sig; loopPresetListNode.textContent = "";
  if (!list.length) loopPresetListNode.append(el("span", "hint", tr("mediaLoopNoPresets")));
  else list.forEach((x, i) => {
    const row = el("div", "mediaLoopPresetRow");
    const b = el("button", "mediaLoopPreset", `${mpFmt(x.a)} – ${mpFmt(x.b)}`); b.type = "button"; b.title = tr("mediaLoopRange", { a:mpFmt(x.a), b:mpFmt(x.b) });
    b.addEventListener("click", () => setMediaLoopRange(x.a, x.b, true));
    const del = el("button", "mediaLoopPresetDelete", "×"); del.type = "button"; del.title = tr("mediaLoopDelete"); del.setAttribute("aria-label", tr("mediaLoopDelete")); del.addEventListener("click", () => deleteMediaLoopPreset(i));
    row.append(b, del); loopPresetListNode.append(row);
  });
  if (loopSaveNode) loopSaveNode.disabled = !loopHasRange();
  if (loopClearPresetsNode) loopClearPresetsNode.disabled = !list.length;
  syncLoopPresetSelection();
}
function renderLoopUI() {
  if (loopStatusNode) loopStatusNode.textContent = loopStatusText();
  if (loopSetANode) loopSetANode.disabled = !videoReady;
  if (loopSetBNode) loopSetBNode.disabled = !videoReady || !Number.isFinite(loopA);
  if (loopClearNode) loopClearNode.disabled = !Number.isFinite(loopA);
  loopQuickNodes.forEach(n => { n.disabled = !videoReady; });
  if (loopModeNode) loopModeNode.value = settings.mediaLoopTrigger || "toggle";
  renderLoopPresets();
}
function clearMediaLoop(silent = false) {
  loopA = loopB = null; loopActive = false; loopKeyDown = false;
  if (!silent && typeof showToast === "function") showToast(tr("mediaLoopClear"));
  renderLoopUI();
}
function setMediaLoopPoint(which) {
  if (!videoReady || !Number.isFinite(video.duration)) return;
  const t = Math.max(0, Math.min(video.duration, video.currentTime || 0));
  if (which === "a") {
    loopA = t; loopB = null; loopActive = false;
  } else if (Number.isFinite(loopA)) {
    if (Math.abs(t - loopA) < .1) return;
    if (t < loopA) [loopA, loopB] = [t, loopA]; else loopB = t;
    loopActive = true;
    if (settings.mediaLoopTrigger === "hold") loopActive = false;
  }
  renderLoopUI();
}
function cycleMediaLoop() {
  if (!videoReady) return;
  if (!Number.isFinite(loopA)) setMediaLoopPoint("a");
  else if (!Number.isFinite(loopB)) setMediaLoopPoint("b");
  else clearMediaLoop();
}
function activateHeldLoop() {
  if (!Number.isFinite(loopA)) { setMediaLoopPoint("a"); return; }
  if (!Number.isFinite(loopB)) { setMediaLoopPoint("b"); if (loopHasRange()) { loopActive = true; loopKeyDown = true; renderLoopUI(); } return; }
  loopActive = true; loopKeyDown = true; renderLoopUI();
}
function releaseHeldLoop() {
  if (settings.mediaLoopTrigger === "hold" && loopKeyDown) { loopActive = false; loopKeyDown = false; renderLoopUI(); }
}
function stopReverseAudio() {
  if (reverseSource) { reverseSource.onended = null; try { reverseSource.stop(); } catch (_) {} reverseSource = null; }
  if (reverseGain) { try { reverseGain.disconnect(); } catch (_) {} reverseGain = null; }
}
function stopReverse(resume = false, silent = true) {
  if (!reverseActive && !reverseLoading) return;
  reverseActive = false; reverseLoading = false; clearInterval(reverseTimer); reverseTimer = 0;
  stopReverseAudio();
  video.muted = reverseVideoMuted; video.playbackRate = mediaRate;
  if (resume && videoReady) video.play().catch(() => {});
  if (!silent && typeof showToast === "function") showToast(tr("mediaForward"));
  renderMedia();
}
async function reverseAudioForCurrentSong() {
  const key = (currentSong && currentSong.key) || mediaPositionKey();
  if (reverseBuffer && reverseBufferKey === key) return reverseBuffer;
  if (!currentSong || !currentSong.file || typeof decodeAudio !== "function" || typeof getAC !== "function") throw new Error("reverse audio unavailable");
  const decoded = await decodeAudio(await currentSong.file.arrayBuffer());
  const ac = getAC(); if (!ac) throw new Error("audio context unavailable");
  const reversed = ac.createBuffer(decoded.numberOfChannels, decoded.length, decoded.sampleRate);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const from = decoded.getChannelData(ch), to = reversed.getChannelData(ch);
    for (let i = 0, n = from.length; i < n; i++) to[i] = from[n - i - 1];
  }
  reverseBuffer = reversed; reverseBufferKey = key;
  return reversed;
}
function reverseClockSeconds() {
  if (reverseHasAudio && typeof audioCtx !== "undefined" && audioCtx) return audioCtx.currentTime;
  return performance.now() / 1000;
}
let reverseHasAudio = false, reverseBoundaryBusy = false;
function reverseTick() {
  if (!reverseActive || reverseLoading || !videoReady) return;
  const elapsed = Math.max(0, reverseClockSeconds() - reverseClockAt) * Math.abs(mediaRate || 1);
  const t = reverseStartAt - elapsed;
  if (loopActive && loopHasRange() && t <= loopA) {
    if (reverseBoundaryBusy) return;
    reverseBoundaryBusy = true;
    video.currentTime = loopB;
    startReverseAt(loopB, true).finally(() => { reverseBoundaryBusy = false; });
    return;
  }
  if (t <= .02) {
    video.currentTime = 0; stopReverse(false, true);
    if (typeof showToast === "function") showToast(tr("mediaReverseDone"));
    return;
  }
  try { video.currentTime = t; } catch (_) {}
  renderMedia();
}
async function startReverseAt(position, restart = false) {
  if (!videoReady || !Number.isFinite(video.duration) || video.duration <= 0) return;
  if (reverseLoading && !restart) return;
  if (!reverseActive) { reverseVideoMuted = !!video.muted; reverseActive = true; }
  reverseLoading = true; clearInterval(reverseTimer); reverseTimer = 0; stopReverseAudio();
  video.pause(); video.muted = true;
  let start = Math.max(0, Math.min(video.duration, Number(position) || 0));
  if (!restart && start <= .02) start = video.duration;
  try { video.currentTime = start; } catch (_) {}
  if (typeof showToast === "function" && !restart) showToast(tr("mediaReverseLoading"));
  let buffer = null;
  try { const gestureAC = typeof getAC === "function" ? getAC() : null; if (gestureAC && gestureAC.state === "suspended") gestureAC.resume().catch(() => {}); } catch (_) {}
  try { buffer = await reverseAudioForCurrentSong(); } catch (_) {
    reverseBuffer = null; reverseBufferKey = "";
    if (typeof showToast === "function" && !restart) showToast(tr("mediaReverseUnavailable"));
  }
  if (!reverseActive || !videoReady) return;
  reverseHasAudio = false;
  const ac = buffer && typeof getAC === "function" ? getAC() : null;
  if (buffer && ac) {
    try {
      if (ac.state === "suspended") await ac.resume();
      const src = ac.createBufferSource(), gain = ac.createGain();
      src.buffer = buffer; src.playbackRate.value = Math.max(.05, Math.abs(mediaRate || 1));
      gain.gain.value = reverseVideoMuted ? 0 : Math.max(0, Math.min(1, Number(settings.musicVolume) || 0));
      src.connect(gain); gain.connect(ac.destination);
      const offset = Math.max(0, Math.min(buffer.duration - .001, buffer.duration * (1 - start / video.duration)));
      reverseSource = src; reverseGain = gain; reverseHasAudio = true;
      src.onended = () => { if (reverseActive && reverseSource === src) reverseTick(); };
      src.start(0, offset);
    } catch (_) { reverseHasAudio = false; stopReverseAudio(); }
  }
  reverseStartAt = start; reverseClockAt = reverseClockSeconds(); reverseLoading = false;
  reverseTimer = setInterval(reverseTick, 25);
  renderMedia();
}
function toggleReverse() {
  if (!mediaActive() || !videoReady) return;
  if (reverseActive || reverseLoading) stopReverse(true, false);
  else startReverseAt(video.currentTime || 0);
}
function checkMediaLoop() {
  if (!mediaActive() || !loopActive || !loopHasRange() || !videoReady || reverseActive || video.paused) return;
  if ((video.currentTime || 0) >= loopB - .02) {
    try { video.currentTime = loopA; } catch (_) {}
  }
}
function renderWall() {
  if (!wallOverlay) return;
  const configuredStyle = settings.mediaWallStyle || "midnight";
  const style = configuredStyle === "custom" && !wallCustomURL ? "midnight" : configuredStyle;
  wallOverlay.dataset.style = style;
  wallOverlay.style.backgroundImage = configuredStyle === "custom" && wallCustomURL ? `url("${wallCustomURL}")` : "";
  if (wallClockNode) wallClockNode.hidden = !settings.mediaWallClock;
  if (wallDateNode) wallDateNode.hidden = !settings.mediaWallClock;
  if (wallDateNode) {
    const now = new Date();
    try {
      wallClockNode.textContent = now.toLocaleTimeString(settings.language || undefined, { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false });
      wallDateNode.textContent = now.toLocaleDateString(settings.language || undefined, { weekday:"short", year:"numeric", month:"short", day:"numeric" });
    } catch (_) { wallClockNode.textContent = now.toLocaleTimeString(); wallDateNode.textContent = now.toLocaleDateString(); }
  }
  if (wallNode) { wallNode.textContent = tr(wallActive ? "mediaWallHide" : "mediaWallShow"); wallNode.dataset.i18n = wallActive ? "mediaWallHide" : "mediaWallShow"; wallNode.setAttribute("aria-pressed", String(wallActive)); }
}
function activateWall() {
  if (!mediaActive() || wallActive) return;
  if (window.TrkVideoMax && window.TrkVideoMax.isOpen()) window.TrkVideoMax.close();   /* 🖥 壁紙の上に残さない */
  wallActive = true; wallKeyDown = false;
  wallWasPlaying = !!(reverseActive || reverseLoading || (videoReady && !video.paused && !video.ended));
  if (settings.mediaWallStopsVideo) { stopReverse(false, true); video.pause(); }
  wallOverlay.hidden = false; document.body.classList.add("mediaWallOpen");
  clearInterval(wallTimer); wallTimer = setInterval(renderWall, 1000); renderWall();
}
function deactivateWall(resume = true) {
  if (!wallActive) return;
  wallActive = false; wallKeyDown = false; clearInterval(wallTimer); wallTimer = 0;
  wallOverlay.hidden = true; document.body.classList.remove("mediaWallOpen");
  const shouldResume = resume && settings.mediaWallStopsVideo && wallWasPlaying && videoReady && !document.hidden;
  wallWasPlaying = false;
  if (shouldResume) video.play().catch(() => {});
  renderMedia();
}
function toggleWall() {
  if (!mediaActive()) return;
  if (wallActive) deactivateWall(true); else activateWall();
}
function videoAction(action) {
  if (action === 0 || action === 1) {
    settings.videoZoom = Math.max(.5, Math.min(3, (Number(settings.videoZoom) || 1) + (action === 0 ? .1 : -.1)));
    const z = document.getElementById("videoZoom"); if (z) z.value = settings.videoZoom;
    const zv = document.getElementById("videoZoomVal"); if (zv) zv.textContent = settings.videoZoom.toFixed(1) + "x";
    saveUserPrefs();
    if (typeof showToast === "function") showToast(tr("mediaVideoToastZoom", { n:settings.videoZoom.toFixed(1) }));
    return;
  }
  if (!mediaActive()) return;
  if (action === 2 || action === 3) {
    const next = Math.max(.5, Math.min(2, (Number(mediaRate) || 1) + (action === 2 ? .25 : -.25)));
    setRate(next); renderMedia();
    if (typeof showToast === "function") showToast(tr("mediaVideoToastRate", { n:next.toFixed(2) }));
  } else if (action === 4) playPause();
  else if (action === REVERSE_KEY_INDEX) toggleReverse();
  else if (action === LOOP_KEY_INDEX) settings.mediaLoopTrigger === "hold" ? activateHeldLoop() : cycleMediaLoop();
  else if (action === WALL_KEY_INDEX) settings.mediaWallTrigger === "hold" ? (activateWall(), wallKeyDown = true) : toggleWall();
}
function syncMediaExitUI() {
  const value = document.getElementById("mediaExitKeyValue"), button = document.getElementById("mediaExitKeyAssign"), check = document.getElementById("mediaExitConfirmCheck");
  if (value) value.textContent = formatKey(settings.mediaExitKey);
  if (button) button.classList.toggle("listening", mediaExitBinding !== null);
  if (check) check.checked = settings.mediaExitConfirm !== false;
}
function captureMediaExitKey(code) {
  if (mediaExitBinding === null) return;
  if (code === "Escape") { mediaExitBinding = null; syncMediaExitUI(); return; }
  const used = [...(settings.videoKeys || []), settings.menuKey, settings.mediaExitKey, "Space", "ArrowLeft", "ArrowRight", "KeyN", "KeyP"];
  if (VIDEO_KEY_BAD.includes(code) || (used.includes(code) && code !== settings.mediaExitKey)) return;
  settings.mediaExitKey = code; mediaExitBinding = null; saveUserPrefs(); syncMediaExitUI();
}
function requestMediaExit() {
  const go = () => closeMedia();
  if (settings.mediaExitConfirm === false || typeof confirm !== "function" || confirm(tr("mediaExitConfirm"))) go();
}
function captureVideoKey(code) {
  const i = videoBinding;
  if (code === "Escape") { videoBinding = null; syncVideoKeysUI(); return; }
  if (VIDEO_KEY_BAD.includes(code) || ((settings.videoKeys || []).includes(code) && settings.videoKeys[i] !== code)) {
    if (typeof showToast === "function") showToast(tr("reservedKey"));
    return;
  }
  settings.videoKeys[i] = code; videoBinding = null; saveUserPrefs(); syncVideoKeysUI();
}
let syncVideoKeysUI = () => {};

const mpFmt = sec => {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};
const mpSongs = () => typeof allSongs === "function" ? allSongs().filter(Boolean) : [];
const mediaActive = () => !!window._trkMediaPlayerOpen;
function currentList() {
  const q = queueFilter.trim().toLowerCase();
  return mpSongs().filter(it => !q || `${it.title || ""} ${it.artist || ""} ${it.packName || ""} ${it.dir || ""}`.toLowerCase().includes(q));
}
function setRate(value) {
  mediaRate = Number(value) || 1;
  settings.mediaRate = mediaRate;
  if (video) video.playbackRate = mediaRate;
  saveUserPrefs();
  if (reverseActive && !reverseLoading) startReverseAt(video.currentTime || 0, true);
}
function setRepeat(value) {
  repeatMode = ["off", "one", "all"].includes(value) ? value : "off";
  settings.mediaRepeat = repeatMode;
  saveUserPrefs(); renderMedia();
}
function setShuffle(value) {
  shuffle = !!value;
  settings.mediaShuffle = shuffle;
  saveUserPrefs(); renderMedia();
}
function stopSleepTimer(silent = true) {
  clearTimeout(sleepTimer); sleepTimer = 0; sleepUntil = 0;
  if (!silent) renderMedia();
}
function setSleep(minutes) {
  const n = Number(minutes) || 0;
  stopSleepTimer(true);
  if (n > 0) {
    sleepUntil = Date.now() + n * 60000;
    sleepTimer = setTimeout(() => {
      sleepTimer = 0; sleepUntil = 0;
      video.pause();
      if (typeof showToast === "function") showToast(tr("mediaSleepDone"));
      renderMedia();
    }, n * 60000);
    if (typeof showToast === "function") showToast(tr("mediaSleepSet", { n }));
  }
  renderMedia();
}
function mediaCandidates() {
  const list = mpSongs();
  if (!list.length) return [];
  if (shuffle) {
    const cur = currentSong && currentSong.key;
    const other = list.filter(x => x.key !== cur);
    return other.length ? other : list;
  }
  return list;
}
function nextMediaSong(dir = 1) {
  const list = mediaCandidates(); if (!list.length) return null;
  if (shuffle) return list[Math.floor(Math.random() * list.length)];
  const i = currentSong ? list.findIndex(x => x.key === currentSong.key) : -1;
  return list[(i + dir + list.length) % list.length];
}
async function playSong(it, fromStart = true) {
  if (!it || typeof selectSong !== "function") return;
  if (reverseActive || reverseLoading) stopReverse(false, true);
  clearMediaLoop(true);
  if (phase !== "title") {
    if (typeof toTitle === "function") toTitle();
    else return;
  }
  window._trkMediaPlayerMode = true;
  if (!currentSong || currentSong.key !== it.key) {
    saveMediaPosition();
    await selectSong(it);
  } else if (!videoReady) {
    await selectSong(it);
  }
  if (!mediaActive() || currentSong !== it || !videoReady) { renderMedia(); return; }
  if (fromStart) { try { video.currentTime = savedMediaPosition(); } catch (_) {} }
  video.muted = false; video.volume = settings.musicVolume; setRate(mediaRate);
  try { await video.play(); } catch (_) { showMediaStatus("mediaLoadFailed"); }
  renderMedia(); updateMediaSession();
}
function playPause() {
  if (!videoReady) return;
  if (reverseActive || reverseLoading) { stopReverse(true, false); renderMedia(); return; }
  if (video.paused || video.ended) {
    if (video.ended) { try { video.currentTime = 0; } catch (_) {} }
    video.muted = false; video.volume = settings.musicVolume; video.play().catch(() => showMediaStatus("mediaLoadFailed"));
  } else video.pause();
  renderMedia();
}
async function stepMedia(dir) {
  const it = nextMediaSong(dir);
  if (it) await playSong(it, true);
  else showMediaStatus("mediaNoSongs");
}
function seekBy(delta) {
  if (!videoReady || !Number.isFinite(video.duration)) return;
  if (reverseActive || reverseLoading) stopReverse(false, true);
  video.currentTime = Math.max(0, Math.min(video.duration, (video.currentTime || 0) + delta));
  renderMedia();
}
function showMediaStatus(key, vars) {
  if (!statusNode) return;
  statusNode.textContent = tr(key, vars);
  statusNode.dataset.i18n = key;
}
function endedMedia() {
  if (!mediaActive()) return;
  if (repeatMode === "one") { saveMediaPosition(true); try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); }
  else if (repeatMode === "all" || shuffle) stepMedia(1);
  else saveMediaPosition(true);
  renderMedia(); updateMediaSession();
}
function updateMediaSession() {
  const ms = navigator.mediaSession;
  if (!ms) return;
  const s = currentSong || {};
  if (typeof MediaMetadata !== "undefined" && s) {
    try { ms.metadata = new MediaMetadata({ title:s.title || baseName(mediaName) || "trk!", artist:s.artist || "trk!", album:s.packName || "trk!", artwork:[{ src:"icons/icon-512.png", sizes:"512x512", type:"image/png" }] }); } catch (_) {}
  }
  try {
    if (videoReady && Number.isFinite(video.duration) && video.duration > 0 && typeof ms.setPositionState === "function") {
      ms.setPositionState({ duration:video.duration, playbackRate:video.playbackRate || 1, position:Math.max(0, Math.min(video.duration, video.currentTime || 0)) });
    }
  } catch (_) {}
}
async function sessionSong(dir) {
  const pick = dir > 0 ? nextSong : prevSong;
  if (typeof pick !== "function" || typeof selectSong !== "function") return;
  const it = pick(); if (!it) return;
  if (phase !== "title" && typeof toTitle === "function") toTitle();
  await selectSong(it);
  if (settings.autoPlay && phase === "title" && videoReady && chart.length && currentSong === it && typeof startGame === "function") startGame();
}
function installMediaSession() {
  const ms = navigator.mediaSession; if (!ms) return;
  const act = (name, fn) => { try { ms.setActionHandler(name, fn); } catch (_) {} };
  act("play", () => mediaActive() ? playPause() : (phase === "paused" ? resumeGame() : video.play().catch(() => {})));
  act("pause", () => mediaActive() ? playPause() : (phase === "playing" ? pauseGame() : video.pause()));
  act("previoustrack", () => mediaActive() ? stepMedia(-1) : sessionSong(-1));
  act("nexttrack", () => mediaActive() ? stepMedia(1) : sessionSong(1));
  act("seekbackward", d => seekBy(-(d && d.seekOffset || 10)));
  act("seekforward", d => seekBy(d && d.seekOffset || 10));
  act("seekto", d => { if (Number.isFinite(d && d.seekTime) && videoReady) { if (reverseActive || reverseLoading) stopReverse(false, true); video.currentTime = Math.max(0, Math.min(video.duration || 0, d.seekTime)); } });
}

let statusNode, queueNode, progressNode, playNode, timeNode, titleNode, subNode, volumeNode, muteNode, shuffleNode, repeatNode, rateNode, sleepNode, searchNode;
let reverseNode, loopStatusNode, loopSetANode, loopSetBNode, loopClearNode, loopModeNode, loopPresetListNode, loopSaveNode, loopClearPresetsNode;
let loopPresetRenderKey = null, loopPresetRenderSig = null, loopQuickNodes = [];
function tx(tag, key, cls) { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; }
function makeButton(key, cls = "mediaSmallBtn") { const b = el("button", cls, tr(key)); b.type = "button"; b.dataset.i18n = key; return b; }
function updateTrackText() {
  const s = currentSong;
  titleNode.textContent = s ? s.title : tr("mediaNoTrack");
  subNode.textContent = s ? [s.artist, s.packName, srcLabelSafe(s)].filter(Boolean).join(" · ") : tr("mediaModeStatus");
  titleNode.dataset.i18n = s ? "" : "mediaNoTrack";
  if (!s) delete titleNode.dataset.i18n;
}
function srcLabelSafe(s) {
  try { return typeof srcLabel === "function" ? srcLabel(s) : s.source || ""; } catch (_) { return s.source || ""; }
}
function renderQueue() {
  if (!queueNode) return;
  queueNode.textContent = "";
  const all = currentList();
  if (!all.length) { queueNode.append(el("div", "mediaEmpty", tr(mpSongs().length ? "mediaNoMatch" : "mediaNoSongs"))); return; }
  for (const it of all.slice(0, 300)) {
    const b = el("button", "mediaQueueItem" + (currentSong && currentSong.key === it.key ? " selected" : ""));
    b.type = "button"; b.dataset.key = it.key;
    const name = el("strong", "mediaQueueName", it.title || "song");
    const meta = el("span", "mediaQueueMeta", [it.artist, srcLabelSafe(it)].filter(Boolean).join(" · "));
    b.append(name, meta);
    b.addEventListener("click", () => playSong(it, true));
    queueNode.append(b);
  }
  if (all.length > 300) queueNode.append(el("div", "hint", `+ ${all.length - 300}`));
}
/* ================= ✨ フレーム補完（js/frame-interp.js） =================
   ・設定は区間ループのすぐ上。効果は上の映像エリアで見られます。
   ・重い処理なので、表示しているときだけ取り込みを動かします。 */
const interpStrengthValue = () => Math.max(0, Math.min(1, Number(settings.frameInterpStrength)));
function hasVideoFrames() { return !!(videoReady && video && video.videoWidth > 0); }
function renderInterp() {
  const FI = window.TrkFrameInterp;
  if (!interpBox) return;
  const supported = !!(FI && FI.supported());
  const m = settings.frameInterp || "off";
  if (interpModeNode) {
    interpModeNode.value = m;
    interpModeNode.disabled = !supported;
  }
  if (interpStrengthNode) {
    interpStrengthNode.value = String(interpStrengthValue());
    interpStrengthNode.disabled = !supported || m !== "flow";
  }
  if (interpStrengthVal) interpStrengthVal.textContent = Math.round(interpStrengthValue() * 100) + "%";
  if (interpUnsupported) {
    const st0 = FI ? FI.stats() : null;
    interpUnsupported.textContent = st0 && st0.blocked ? tr("mediaInterpBlocked") : tr("mediaInterpUnsupported");
    interpUnsupported.hidden = supported;
  }
  if (interpHintNode) interpHintNode.hidden = !supported;
  if (interpStatusNode) {
    if (!supported || m === "off") interpStatusNode.textContent = "";
    else {
      const st = FI.stats();
      interpStatusNode.textContent = !st.ready ? tr("mediaInterpWarmup")
        : tr("mediaInterpStat", { src: st.srcFps || "-", out: st.outFps || "-", w: st.w, h: st.h }) +
          (st.degraded ? " · " + tr("mediaInterpDegraded") : "");
    }
  }
}
function drawMediaStage() {
  if (!stageCanvas || !stageCtx) return;
  const w = stageCanvas.width, h = stageCanvas.height;
  if (!w || !h) return;
  let drew = false;
  const FI = window.TrkFrameInterp;
  if (FI && settings.frameInterp !== "off") { try { drew = FI.drawTo(stageCtx, w, h); } catch (_) { drew = false; } }
  if (!drew) {
    stageCtx.fillStyle = "#000";
    stageCtx.fillRect(0, 0, w, h);
    if (hasVideoFrames()) {
      const s = Math.min(w / video.videoWidth, h / video.videoHeight);
      const dw = video.videoWidth * s, dh = video.videoHeight * s;
      stageCtx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
  }
}
function mediaStageTick() {
  stageRaf = requestAnimationFrame(mediaStageTick);
  if (!mediaOpen || !stageWrap || stageWrap.hidden) return;
  /* 🪶 軽量化：映像ステージを描く回数を減らす（音・再生位置・操作はそのまま） */
  if (typeof TrkLite === "object" && !TrkLite.allow("media", performance.now())) return;
  if (!stageCtx) { try { stageCtx = stageCanvas.getContext("2d", { alpha: false }); } catch (_) { return; } }
  const dpr = typeof TrkLite === "object" ? TrkLite.pixelRatio(2) : Math.min(2, window.devicePixelRatio || 1);
  const cw = Math.max(2, Math.round((stageCanvas.clientWidth || 480) * dpr));
  const ch = Math.max(2, Math.round((stageCanvas.clientHeight || 270) * dpr));
  if (stageCanvas.width !== cw || stageCanvas.height !== ch) { stageCanvas.width = cw; stageCanvas.height = ch; }
  drawMediaStage();
}
function syncMediaStage() {
  if (!stageWrap || !stageCanvas) return;
  const FI = window.TrkFrameInterp;
  const frames = hasVideoFrames();
  const show = mediaOpen;                       // 枠はプレーヤーを開いているときだけ
  stageWrap.hidden = !show;
  stageCanvas.hidden = !frames;                 // 映像が無い曲では注記だけ出す
  if (show && frames) {
    if (FI && settings.frameInterp !== "off") FI.attach("media", stageCanvas);
    if (!stageRaf) stageRaf = requestAnimationFrame(mediaStageTick);
  } else {
    if (FI) FI.detach("media");
    if (stageRaf) { cancelAnimationFrame(stageRaf); stageRaf = 0; }
  }
  if (stageNote) stageNote.hidden = frames;
}

function renderMedia() {
  if (!mediaOpen || !overlay) return;
  updateTrackText();
  const ready = !!(videoReady && currentSong);
  const cur = ready ? (video.currentTime || 0) : 0, dur = ready && Number.isFinite(video.duration) ? video.duration : 0;
  if (progressNode) {
    progressNode.max = String(dur || 1); progressNode.value = String(Math.min(cur, dur || 0)); progressNode.disabled = !ready;
    progressNode.setAttribute("aria-valuetext", `${mpFmt(cur)} / ${mpFmt(dur)}`);
  }
  if (timeNode) timeNode.textContent = `${mpFmt(cur)} / ${mpFmt(dur)}`;
  if (playNode) {
    const playKey = reverseActive || reverseLoading ? "mediaForward" : (video.ended ? "mediaRestart" : (video.paused || !ready ? "mediaPlay" : "mediaPause"));
    playNode.textContent = tr(playKey); playNode.dataset.i18n = playKey;
  }
  if (reverseNode) { reverseNode.textContent = tr(reverseActive || reverseLoading ? "mediaForward" : "mediaReverseStart"); reverseNode.dataset.i18n = reverseActive || reverseLoading ? "mediaForward" : "mediaReverseStart"; reverseNode.disabled = !ready; reverseNode.classList.toggle("selected", reverseActive || reverseLoading); reverseNode.setAttribute("aria-pressed", String(reverseActive || reverseLoading)); }
  if (maxNode) {
    const maxOn = !!(window.TrkVideoMax && window.TrkVideoMax.isOpen());
    const key = maxOn ? "mediaVideoMaxClose" : "mediaVideoMax";
    maxNode.textContent = tr(key); maxNode.dataset.i18n = key;
    maxNode.disabled = !ready;
    maxNode.classList.toggle("selected", maxOn);
    maxNode.setAttribute("aria-pressed", String(maxOn));
  }
  if (volumeNode) volumeNode.value = String(settings.musicVolume);
  if (muteNode) { const isMuted = reverseActive || reverseLoading ? reverseVideoMuted : video.muted; muteNode.textContent = isMuted ? tr("mediaUnmute") : tr("mediaMute"); muteNode.dataset.i18n = isMuted ? "mediaUnmute" : "mediaMute"; }
  if (shuffleNode) { shuffleNode.classList.toggle("selected", shuffle); shuffleNode.setAttribute("aria-pressed", String(shuffle)); }
  if (repeatNode) { repeatNode.value = repeatMode; }
  if (rateNode) rateNode.value = String(mediaRate);
  if (sleepNode) sleepNode.value = sleepUntil ? String(Math.max(1, Math.round((sleepUntil - Date.now()) / 60000))) : "0";
  if (statusNode) {
    const statusKey = reverseLoading ? "mediaReverseLoading" : reverseActive ? "mediaReverse" : videoReady && currentSong ? (video.ended ? "mediaEnded" : video.paused ? "mediaPaused" : "mediaNow") : "mediaNoTrack";
    statusNode.textContent = tr(statusKey); statusNode.dataset.i18n = "";
  }
  renderLoopUI();
  renderWall();
  renderQueue();
  syncMediaStage();
  renderInterp();
  updateMediaSession();
}
function closeMedia(restore = true) {
  if (!mediaOpen) return;
  if (window.TrkVideoMax && window.TrkVideoMax.isOpen()) window.TrkVideoMax.close();   /* 🖥 全画面表示も一緒に閉じる */
  deactivateWall(false);
  mediaOpen = false; window._trkMediaPlayerOpen = false; window._trkMediaPlayerMode = false;
  clearInterval(tickTimer); tickTimer = 0; stopSleepTimer(true); seeking = false;
  clearInterval(loopTimer); loopTimer = 0; stopReverse(false, true); clearMediaLoop(true);
  saveMediaPosition(); video.pause(); video.playbackRate = 1;
  if (stageRaf) { cancelAnimationFrame(stageRaf); stageRaf = 0; }
  if (window.TrkFrameInterp) window.TrkFrameInterp.detach("media");
  if (stageWrap) stageWrap.hidden = true;
  overlay.hidden = true; document.body.classList.remove("mediaOpen");
  if (restore && phase === "title" && settings.previewEnabled && typeof startPreview === "function") setTimeout(startPreview, 50);
  if (powerButton) powerButton.focus();
}
function openMedia() {
  if (!overlay || (window.TrkSafeMode && TrkSafeMode())) return;
  if (window._trkSynthModeOpen && typeof window._trkCloseSynth === "function") window._trkCloseSynth();
  mediaOpen = true; window._trkMediaPlayerOpen = true; window._trkMediaPlayerMode = true;
  overlay.hidden = false; document.body.classList.add("mediaOpen");
  if (videoReady) { video.muted = false; video.volume = settings.musicVolume; setRate(mediaRate); }
  if (currentSong && videoReady) { try { video.currentTime = savedMediaPosition(); } catch (_) {} }
  tickTimer = setInterval(renderMedia, 250); loopTimer = setInterval(checkMediaLoop, 40);
  renderMedia(); updateMediaSession(); syncMediaStage();
  const focus = playNode || closeNode; if (focus) focus.focus();
}
let closeNode;
function buildMedia() {
  powerButton = document.querySelector("#tvDock .tvPow");
  if (!powerButton) return false;
  overlay = el("div", "instOverlay mediaOverlay"); overlay.id = "mediaPlayerMode"; overlay.hidden = true;
  const backdrop = el("div", "instBackdrop");
  dialog = el("section", "instDialog mediaDialog"); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-labelledby", "mediaTitle");
  const header = el("header", "instHeader mediaHeader");
  const hwrap = el("div"); const h = tx("h2", "mediaTitle"); h.id = "mediaTitle";
  hwrap.append(h, tx("p", "mediaSubtitle", "instSubtitle"));
  closeNode = makeButton("mediaClose", "instClose"); closeNode.addEventListener("click", () => closeMedia());
  header.append(hwrap, closeNode);

  const display = el("div", "mediaDisplay");
  titleNode = el("strong", "mediaDisplayTitle", tr("mediaNoTrack"));
  subNode = el("span", "mediaDisplaySub", tr("mediaModeStatus"));
  statusNode = el("span", "mediaStatus", tr("mediaPaused"));
  display.append(titleNode, subNode, statusNode);

  /* ✨ 映像エリア（フレーム補完の効果をここで見られます） */
  stageWrap = el("div", "mediaStage"); stageWrap.hidden = true;
  stageCanvas = document.createElement("canvas"); stageCanvas.className = "mediaStageCanvas"; stageCanvas.hidden = true;
  stageNote = el("div", "mediaStageNote hint", tr("mediaStageNoVideo")); stageNote.dataset.i18n = "mediaStageNoVideo";
  stageWrap.append(stageCanvas, stageNote);

  const controls = el("div", "mediaControls");
  const prev = makeButton("mediaPrev", "mediaControlBtn");
  playNode = makeButton("mediaPlay", "mediaControlBtn mediaPlayBtn");
  const next = makeButton("mediaNext", "mediaControlBtn");
  reverseNode = makeButton("mediaReverseStart", "mediaSmallBtn");
  /* 🖥 逆再生の右＝「全画面で表示」（壁紙はひとつ右へずれます） */
  maxNode = makeButton("mediaVideoMax", "mediaSmallBtn");
  wallNode = makeButton("mediaWallShow", "mediaSmallBtn");
  const restart = makeButton("mediaRestart", "mediaSmallBtn");
  prev.addEventListener("click", () => stepMedia(-1)); playNode.addEventListener("click", playPause); next.addEventListener("click", () => stepMedia(1)); reverseNode.addEventListener("click", toggleReverse); wallNode.addEventListener("click", toggleWall);
  restart.addEventListener("click", () => { if (videoReady) { if (reverseActive || reverseLoading) stopReverse(false, true); saveMediaPosition(true); video.currentTime = 0; video.play().catch(() => {}); } });
  maxNode.addEventListener("click", () => { if (window.TrkVideoMax) window.TrkVideoMax.toggle(); });
  if (window.TrkVideoMax) window.TrkVideoMax.onChange(() => renderMedia());
  controls.append(prev, playNode, next, reverseNode, maxNode, wallNode, restart);

  const progressRow = el("div", "mediaProgressRow");
  progressNode = document.createElement("input"); progressNode.type = "range"; progressNode.min = "0"; progressNode.step = "0.1"; progressNode.value = "0"; progressNode.className = "mediaProgress"; progressNode.setAttribute("aria-label", tr("mediaSeek"));
  timeNode = el("span", "mono mediaTime", "0:00 / 0:00");
  progressRow.append(progressNode, timeNode);
  progressNode.addEventListener("pointerdown", () => { seeking = true; });
  progressNode.addEventListener("pointerup", () => { seeking = false; });
  progressNode.addEventListener("input", () => { if (videoReady && video.duration) { if (reverseActive || reverseLoading) stopReverse(false, true); video.currentTime = Number(progressNode.value); timeNode.textContent = `${mpFmt(video.currentTime)} / ${mpFmt(video.duration)}`; } });

  /* ✨ フレーム補完の設定（区間ループのすぐ上） */
  const FI = window.TrkFrameInterp;
  interpBox = el("section", "mediaInterpBox");
  const fiHead = tx("h3", "mediaInterpTitle");
  const fiRow = el("label", "mediaOption mediaInterpRow");
  fiRow.append(tx("span", "mediaInterpMode"));
  interpModeNode = document.createElement("select");
  for (const [value, key] of [["off", "mediaInterpOff"], ["blend", "mediaInterpBlend"], ["flow", "mediaInterpFlow"]]) {
    const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); interpModeNode.append(o);
  }
  fiRow.append(interpModeNode);
  const fiStrengthRow = el("label", "mediaOption mediaInterpRow");
  fiStrengthRow.append(tx("span", "mediaInterpStrength"));
  interpStrengthNode = document.createElement("input");
  interpStrengthNode.type = "range"; interpStrengthNode.min = "0"; interpStrengthNode.max = "1"; interpStrengthNode.step = "0.05";
  interpStrengthVal = el("span", "mono");
  fiStrengthRow.append(interpStrengthNode, interpStrengthVal);
  interpStatusNode = el("div", "hint mediaInterpStatus", "");
  interpHintNode = tx("p", "mediaInterpHint", "hint");
  interpUnsupported = tx("p", "mediaInterpUnsupported", "hint status");
  interpUnsupported.hidden = true;
  interpBox.append(fiHead, fiRow, fiStrengthRow, interpStatusNode, interpHintNode, interpUnsupported);
  interpModeNode.addEventListener("change", () => { if (FI) FI.setMode(interpModeNode.value); renderInterp(); renderMedia(); });
  interpStrengthNode.addEventListener("input", () => {
    settings.frameInterpStrength = Number(interpStrengthNode.value);
    interpStrengthVal.textContent = Math.round(settings.frameInterpStrength * 100) + "%";
    saveUserPrefs();
  });
  if (FI) FI.onChange(renderInterp);

  const loopBox = el("section", "mediaLoopBox");
  const loopHeading = tx("h3", "mediaLoop");
  loopStatusNode = el("div", "hint", tr("mediaLoopNone"));
  const loopHint = tx("p", "mediaLoopHint", "hint");
  const loopButtons = el("div", "miniActions");
  loopSetANode = makeButton("mediaLoopSetA"); loopSetBNode = makeButton("mediaLoopSetB"); loopClearNode = makeButton("mediaLoopClear");
  loopSetANode.addEventListener("click", () => setMediaLoopPoint("a")); loopSetBNode.addEventListener("click", () => setMediaLoopPoint("b")); loopClearNode.addEventListener("click", () => clearMediaLoop());
  loopButtons.append(loopSetANode, loopSetBNode, loopClearNode);
  const loopModeLabel = el("label", "mediaOption"); loopModeLabel.append(tx("span", "mediaLoopMode"));
  loopModeNode = document.createElement("select");
  for (const [value, key] of [["toggle", "mediaLoopToggle"], ["hold", "mediaLoopHold"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); loopModeNode.append(o); }
  loopModeLabel.append(loopModeNode); loopModeNode.addEventListener("change", () => { settings.mediaLoopTrigger = loopModeNode.value; saveUserPrefs(); if (settings.mediaLoopTrigger !== "hold") loopActive = loopHasRange(); renderLoopUI(); });
  const loopLabHeading = tx("h4", "mediaLoopLabTitle");
  const loopQuickHint = tx("p", "mediaLoopQuickHint", "hint");
  const loopQuickButtons = el("div", "miniActions"); loopQuickNodes = [];
  for (const [seconds, key] of [[5, "mediaLoopQuick5"], [10, "mediaLoopQuick10"], [20, "mediaLoopQuick20"]]) { const b = makeButton(key, "mediaSmallBtn"); b.addEventListener("click", () => setQuickMediaLoop(seconds)); loopQuickButtons.append(b); loopQuickNodes.push(b); }
  const randomLoop = makeButton("mediaLoopRandom", "mediaSmallBtn"); randomLoop.addEventListener("click", setRandomMediaLoop); loopQuickButtons.append(randomLoop); loopQuickNodes.push(randomLoop);
  const loopSaveRow = el("div", "miniActions"); loopSaveNode = makeButton("mediaLoopSave", "mediaSmallBtn"); loopSaveNode.addEventListener("click", saveMediaLoopPreset); loopClearPresetsNode = makeButton("mediaLoopClearPresets", "mediaSmallBtn"); loopClearPresetsNode.addEventListener("click", clearMediaLoopPresets); loopSaveRow.append(loopSaveNode, loopClearPresetsNode);
  const loopPresetHeading = tx("div", "mediaLoopPresets", "mediaLoopPresetHeading"); loopPresetListNode = el("div", "mediaLoopPresetList");
  loopBox.append(loopHeading, loopStatusNode, loopHint, loopButtons, loopModeLabel, loopLabHeading, loopQuickHint, loopQuickButtons, loopSaveRow, loopPresetHeading, loopPresetListNode);

  const options = el("div", "mediaOptions");
  const volumeRow = el("label", "mediaOption mediaVolumeRow"); volumeRow.append(tx("span", "mediaVolume"));
  volumeNode = document.createElement("input"); volumeNode.type = "range"; volumeNode.min = "0"; volumeNode.max = "1"; volumeNode.step = "0.01"; volumeRow.append(volumeNode);
  volumeNode.addEventListener("input", () => { settings.musicVolume = Number(volumeNode.value); if (settings.musicVolume > 0) rememberMusicVolume(settings.musicVolume); video.volume = settings.musicVolume; if (reverseGain) reverseGain.gain.value = settings.musicVolume; saveUserPrefs(); });
  muteNode = makeButton("mediaMute", "mediaSmallBtn"); muteNode.addEventListener("click", () => { if (reverseActive || reverseLoading) { reverseVideoMuted = !reverseVideoMuted; if (reverseGain) reverseGain.gain.value = reverseVideoMuted ? 0 : settings.musicVolume; } else video.muted = !video.muted; renderMedia(); });
  shuffleNode = makeButton("mediaShuffle", "mediaSmallBtn"); shuffleNode.addEventListener("click", () => setShuffle(!shuffle));
  const repeatLabel = el("label", "mediaOption"); repeatLabel.append(tx("span", "mediaRepeat"));
  repeatNode = document.createElement("select");
  for (const [value, key] of [["off", "mediaRepeatOff"], ["one", "mediaRepeatOne"], ["all", "mediaRepeatAll"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); repeatNode.append(o); }
  repeatLabel.append(repeatNode); repeatNode.addEventListener("change", () => setRepeat(repeatNode.value));
  const rateLabel = el("label", "mediaOption"); rateLabel.append(tx("span", "mediaRate"));
  rateNode = document.createElement("select"); for (const v of [.5, .75, 1, 1.25, 1.5, 2]) { const o = document.createElement("option"); o.value = v; o.textContent = `${v.toFixed(2)}x`; rateNode.append(o); }
  rateLabel.append(rateNode); rateNode.addEventListener("change", () => { setRate(rateNode.value); });
  const sleepLabel = el("label", "mediaOption"); sleepLabel.append(tx("span", "mediaSleep"));
  sleepNode = document.createElement("select"); for (const [v, key] of [[0, "mediaSleepOff"], [15, "mediaSleep15"], [30, "mediaSleep30"], [60, "mediaSleep60"]]) { const o = document.createElement("option"); o.value = v; o.dataset.i18n = key; o.textContent = tr(key); sleepNode.append(o); }
  sleepLabel.append(sleepNode); sleepNode.addEventListener("change", () => setSleep(sleepNode.value));
  options.append(volumeRow, muteNode, shuffleNode, repeatLabel, rateLabel, sleepLabel);

  const queuePanel = el("section", "mediaQueuePanel");
  const qhead = el("div", "mediaQueueHead"); qhead.append(tx("h3", "mediaQueue"), tx("p", "mediaQueueHint", "hint"));
  searchNode = document.createElement("input"); searchNode.type = "search"; searchNode.placeholder = tr("mediaSearch"); searchNode.dataset.i18nPlaceholder = "mediaSearch"; searchNode.className = "mediaSearch"; searchNode.addEventListener("input", () => { queueFilter = searchNode.value; renderQueue(); });
  queueNode = el("div", "mediaQueueList"); queuePanel.append(qhead, searchNode, queueNode);

  const footer = el("footer", "instFooter mediaFooter"); footer.append(tx("span", "mediaModeStatus"), tx("span", "mediaKeyboard", "instKeyHint"));
  dialog.append(header, display, stageWrap, controls, progressRow, interpBox, loopBox, options, queuePanel, footer);
  wallOverlay = el("section", "mediaWall"); wallOverlay.hidden = true; wallOverlay.setAttribute("role", "dialog"); wallOverlay.setAttribute("aria-modal", "true"); wallOverlay.setAttribute("aria-label", tr("mediaWall"));
  const wallTop = el("div", "mediaWallTop"); wallTop.append(tx("strong", "mediaWall"));
  const wallClose = makeButton("mediaWallHide", "mediaWallClose"); wallClose.addEventListener("click", () => deactivateWall(true)); wallTop.append(wallClose);
  const wallCenter = el("div", "mediaWallCenter"); wallClockNode = el("div", "mediaWallClock", "00:00:00"); wallDateNode = el("div", "mediaWallDate", ""); wallCenter.append(wallClockNode, wallDateNode);
  const wallHint = tx("div", "mediaWallHint", "mediaWallHintText");
  wallOverlay.append(wallTop, wallCenter, wallHint);
  overlay.append(backdrop, dialog, wallOverlay); document.body.append(overlay);

  backdrop.addEventListener("click", () => closeMedia());
  overlay.addEventListener("click", e => { if (e.target === overlay) closeMedia(); });
  overlay.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.code === "Tab") {
      const fs = [...dialog.querySelectorAll("button,input,select")].filter(n => !n.disabled && !n.hidden && n.getClientRects().length);
      if (!fs.length) return;
      const i = fs.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); fs[fs.length - 1].focus(); }
      else if (!e.shiftKey && (i < 0 || i === fs.length - 1)) { e.preventDefault(); fs[0].focus(); }
    }
  });
  overlay.addEventListener("keyup", e => e.stopPropagation());
  const isTyping = t => t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName);
  addEventListener("keydown", e => {
    const code = keyCodeOf(e);      // 📺 TVリモコン・メディアキー対応（e.code が空でも e.key を使う）
    if (mediaExitBinding !== null) { e.preventDefault(); e.stopImmediatePropagation(); captureMediaExitKey(code); return; }
    if (videoBinding !== null) { e.preventDefault(); e.stopImmediatePropagation(); captureVideoKey(code); return; }
    if (window._trkSynthModeOpen || window._trkStudyRoomOpen) return;
    const videoKey = (settings.videoKeys || []).indexOf(code);
    if (videoKey >= 0 && (mediaActive() || phase === "title" || phase === "paused")) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (!e.repeat && (!wallActive || videoKey === WALL_KEY_INDEX)) videoAction(videoKey);
      return;
    }
    if (!mediaOpen) return;
    if (wallActive && code === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); deactivateWall(true); return; }
    if (code === settings.mediaExitKey || code === "Escape" || code === "BrowserBack" || code === "GoBack") { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) requestMediaExit(); return; }
    if (wallActive) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (isTyping(e.target)) return;
    if (e.code === "Space") { e.preventDefault(); e.stopImmediatePropagation(); playPause(); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); e.stopImmediatePropagation(); seekBy(-10); }
    else if (e.code === "ArrowRight") { e.preventDefault(); e.stopImmediatePropagation(); seekBy(10); }
    else if (e.code === "KeyN") { e.preventDefault(); e.stopImmediatePropagation(); stepMedia(1); }
    else if (e.code === "KeyP") { e.preventDefault(); e.stopImmediatePropagation(); stepMedia(-1); }
  }, true);
  addEventListener("keyup", e => {
    if (mediaExitBinding !== null || videoBinding !== null || window._trkSynthModeOpen || window._trkStudyRoomOpen || !mediaActive()) return;
    if (settings.mediaLoopTrigger === "hold" && (settings.videoKeys || [])[LOOP_KEY_INDEX] === keyCodeOf(e)) {
      e.preventDefault(); e.stopImmediatePropagation(); releaseHeldLoop();
    }
    if (settings.mediaWallTrigger === "hold" && (settings.videoKeys || [])[WALL_KEY_INDEX] === keyCodeOf(e) && wallKeyDown) {
      e.preventDefault(); e.stopImmediatePropagation(); deactivateWall(true);
    }
  }, true);

  let lastPositionSave = 0;
  for (const type of ["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "volumechange", "ratechange", "ended", "loadeddata"]) video.addEventListener(type, () => {
    if (type === "timeupdate" && Date.now() - lastPositionSave > 2000) { lastPositionSave = Date.now(); saveMediaPosition(); }
    if (type === "ended") endedMedia(); else renderMedia();
  });
  on("beforeLoad", () => { stopReverse(false, true); clearMediaLoop(true); reverseBuffer = null; reverseBufferKey = ""; });
  on("songSelected", renderMedia); on("mediaReady", () => { if (mediaOpen) renderMedia(); updateMediaSession(); });
  on("records", renderQueue); on("packsChanged", renderQueue); on("language", () => {
    if (stageNote) { stageNote.textContent = tr("mediaStageNoVideo"); stageNote.dataset.i18n = "mediaStageNoVideo"; }
    renderInterp();
    loopPresetRenderKey = loopPresetRenderSig = null;
    if (searchNode) searchNode.placeholder = tr("mediaSearch");
    if (progressNode) progressNode.setAttribute("aria-label", tr("mediaSeek"));
    if (wallOverlay) wallOverlay.setAttribute("aria-label", tr("mediaWall"));
    if (mediaOpen) renderMedia();
  });
  on("phase", p => { if (p !== "title" && mediaOpen) closeMedia(false); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && mediaOpen) { releaseHeldLoop(); stopReverse(false, true); video.pause(); } });

  let pointerTimer = 0;
  powerButton.addEventListener("pointerdown", e => {
    if (e.button !== undefined && e.button !== 0) return;
    clearTimeout(pointerTimer); longPressed = false;
    pointerTimer = setTimeout(() => { longPressed = true; openMedia(); }, HOLD_MS);
  }, true);
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) powerButton.addEventListener(type, () => { clearTimeout(pointerTimer); }, true);
  powerButton.addEventListener("click", e => {
    if (!longPressed) return;
    e.preventDefault(); e.stopImmediatePropagation(); longPressed = false;
  }, true);
  powerButton.addEventListener("contextmenu", e => e.preventDefault());

  function buildVideoKeysUI() {
    const anchor = document.querySelector('#settingsScreen [data-i18n="playerMode"]')?.closest("label");
    if (!anchor || document.getElementById("mediaVideoKeysPanel")) return;
    const panel = el("details", "subPanel"); panel.id = "mediaVideoKeysPanel";
    const heading = tx("summary", "mediaVideoKeysTitle");
    const hint = tx("div", "mediaVideoKeysHint", "hint");
    const rows = el("div", "keyRows"); rows.style.marginTop = "10px";
    const reset = tx("button", "mediaVideoKeysReset"); reset.type = "button"; reset.style.marginTop = "8px";
    syncVideoKeysUI = () => {
      rows.textContent = "";
      VIDEO_KEY_LABELS.forEach((key, i) => {
        const row = el("div", "keyRow"), b = el("button", "", tr("assign"));
        b.type = "button"; b.classList.toggle("listening", videoBinding === i);
        b.addEventListener("click", () => { bindingSlot = null; updateKeyUI(); videoBinding = i; syncVideoKeysUI(); });
        row.append(el("strong", "", tr(key)), el("span", "keyValue", formatKey(settings.videoKeys[i])), b);
        rows.append(row);
      });
    };
    reset.addEventListener("click", () => { settings.videoKeys = VIDEO_KEY_DEFAULTS.slice(); videoBinding = null; saveUserPrefs(); syncVideoKeysUI(); });
    panel.append(heading, hint, rows, reset);
    const wallPanel = el("details", "subPanel mediaWallSettingsPanel"); wallPanel.id = "mediaWallSettingsPanel";
    const wallHeading = tx("summary", "mediaWall");
    const wallHint = tx("div", "mediaWallHint", "hint");
    const wallStyleLabel = el("label", "mediaOption"); wallStyleLabel.append(tx("span", "mediaWallStyle"));
    wallStyleNode = document.createElement("select");
    for (const [value, key] of [["midnight", "mediaWallMidnight"], ["aurora", "mediaWallAurora"], ["paper", "mediaWallPaper"], ["custom", "mediaWallCustom"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); wallStyleNode.append(o); }
    wallStyleLabel.append(wallStyleNode);
    const wallClockLabel = el("label", "checkLine"); wallClockCheck = document.createElement("input"); wallClockCheck.type = "checkbox"; wallClockLabel.append(wallClockCheck, tx("span", "mediaWallClock"));
    const wallPlaybackLabel = el("label", "mediaOption"); wallPlaybackLabel.append(tx("span", "mediaWallPlayback"));
    wallPlaybackNode = document.createElement("select"); for (const [value, key] of [["stop", "mediaWallStopVideo"], ["continue", "mediaWallContinueVideo"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); wallPlaybackNode.append(o); } wallPlaybackLabel.append(wallPlaybackNode);
    const wallTriggerLabel = el("label", "mediaOption"); wallTriggerLabel.append(tx("span", "mediaWallTrigger"));
    wallTriggerNode = document.createElement("select"); for (const [value, key] of [["toggle", "mediaWallToggle"], ["hold", "mediaWallHold"]]) { const o = document.createElement("option"); o.value = value; o.dataset.i18n = key; o.textContent = tr(key); wallTriggerNode.append(o); } wallTriggerLabel.append(wallTriggerNode);
    const wallUploadRow = el("label", "mediaWallUploadRow"); wallUploadRow.append(tx("span", "mediaWallUpload")); wallFileNode = document.createElement("input"); wallFileNode.type = "file"; wallFileNode.accept = "image/*"; wallUploadRow.append(wallFileNode);
    wallResetNode = tx("button", "mediaWallResetImage", "mediaSmallBtn"); wallResetNode.type = "button";
    const wallUploadHint = tx("div", "mediaWallUploadHint", "hint");
    const syncWallSettingsUI = () => { wallStyleNode.value = settings.mediaWallStyle || "midnight"; wallClockCheck.checked = settings.mediaWallClock !== false; wallPlaybackNode.value = settings.mediaWallStopsVideo === false ? "continue" : "stop"; wallTriggerNode.value = settings.mediaWallTrigger || "toggle"; renderWall(); };
    wallStyleNode.addEventListener("change", () => { settings.mediaWallStyle = wallStyleNode.value; saveUserPrefs(); renderWall(); });
    wallClockCheck.addEventListener("change", () => { settings.mediaWallClock = wallClockCheck.checked; saveUserPrefs(); renderWall(); });
    wallPlaybackNode.addEventListener("change", () => { settings.mediaWallStopsVideo = wallPlaybackNode.value !== "continue"; saveUserPrefs(); });
    wallTriggerNode.addEventListener("change", () => { settings.mediaWallTrigger = wallTriggerNode.value; saveUserPrefs(); });
    wallFileNode.addEventListener("change", () => { const f = wallFileNode.files && wallFileNode.files[0]; if (!f || !f.type.startsWith("image/")) return; if (wallCustomURL) URL.revokeObjectURL(wallCustomURL); wallCustomURL = URL.createObjectURL(f); settings.mediaWallStyle = "custom"; saveUserPrefs(); syncWallSettingsUI(); });
    wallResetNode.addEventListener("click", () => { if (wallCustomURL) URL.revokeObjectURL(wallCustomURL); wallCustomURL = ""; settings.mediaWallStyle = "midnight"; wallFileNode.value = ""; saveUserPrefs(); syncWallSettingsUI(); });
    wallPanel.append(wallHeading, wallHint, wallStyleLabel, wallClockLabel, wallPlaybackLabel, wallTriggerLabel, wallUploadRow, wallUploadHint, wallResetNode);
    anchor.after(panel, wallPanel);
    on("language", () => { syncVideoKeysUI(); syncWallSettingsUI(); });
    syncVideoKeysUI(); syncWallSettingsUI();
  }
  const mediaExitAssign = document.getElementById("mediaExitKeyAssign"), mediaExitConfirmCheck = document.getElementById("mediaExitConfirmCheck");
  if (mediaExitAssign) mediaExitAssign.addEventListener("click", () => { mediaExitBinding = 0; syncMediaExitUI(); });
  if (mediaExitConfirmCheck) mediaExitConfirmCheck.addEventListener("change", e => { settings.mediaExitConfirm = e.target.checked; saveUserPrefs(); });
  on("language", syncMediaExitUI);
  syncMediaExitUI();
  buildVideoKeysUI();
  installMediaSession();
  renderInterp();
  syncMediaStage();
  return true;
}

/* The TV dock is built by its own DOMContentLoaded callback first. */
addEventListener("DOMContentLoaded", () => {
  if (!buildMedia()) return;
  applyLanguage(settings.language);
});
window.TrkMediaPlayer = { open:openMedia, close:closeMedia, isOpen:mediaActive };
window._trkMediaPlayerOpen = false;
window._trkMediaPlayerMode = false;
})();
/* ✅ media-player-mode.js 完了 */
