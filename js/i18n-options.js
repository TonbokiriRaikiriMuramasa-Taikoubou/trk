// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 統合版：🎯 プレイオプションの文章 ============
   体力モード・体力の表示・カウントダウン・判定・再生速度・HIDDEN/SUDDEN・サブキー・プレイ中のキー */
"use strict";

Object.assign(TEXT.ja, {
  secOptions:"🎯 プレイオプション",
  /* 体力モード */
  secLives:"❤ 体力モード", livesStandard:"Standard", livesKnight:"Knight", livesChicken:"trk!", livesNone:"Infinite",
  livesHint:"MANUAL・STAGE・CATCH：Standard＝体力20から開始・10コンボで+1・最大50。TRUCK：Standard＝体力3（50コンボで+1）。ORBIT：Standard＝体力20（20コンボで+1）。Knight＝ORBIT以外は体力3から開始・50コンボで+1・最大5、ORBITは15（50コンボで+1）。trk!＝1ミスで終了。Infinite＝ミスしても最後まで遊べます。AUTOには体力はありません。称号はどの体力モードでも取れます。",
  lifeNumber:"体力の数字も表示する", lifeHeal:"❤ +1", lifeSkinLabel:"体力の表示スタイル",
  lifeSkinHeart:"❤ ハート", lifeSkinBar:"━ シンプルゲージ", lifeSkinSegments:"▰ セグメント", lifeSkinBattery:"▣ バッテリー",
  lifeSkinShield:"🛡 シールド", lifeSkinMode:"モードアイコン", lifeSkinCustom:"カスタム絵文字", lifeEmojiLabel:"表示する絵文字",
  /* カウントダウン */
  countdown:"開始前に 3・2・1・GO! を表示する", countdownSE:"カウントの音を鳴らす",
  resumeCountdown:"一時停止から戻るときもカウントする",
  countdownHint:"カウントの間隔は曲のBPMに合わせます。カウント中にノーツが流れ込んできます。", go:"GO!",
  /* 判定 */
  judgeLevel:"判定の厳しさ", judgeLenient:"ゆるめ", judgeStandard:"標準", judgeStrict:"きびしめ",
  judgeHint:"「ゆるめ」は練習扱いで、ハイスコアの対象外です。「きびしめ」は対象です。",
  /* 再生速度 */
  rate:"再生速度",
  rateHint:"1.00x＝通常のハイスコア。1.05x以上は速度ごとに別のハイスコアと「🏁 最高クリア速度」が残ります。1.00x未満は練習扱いです（音程は変わりません）。",
  rateRecordNote:"（速度別ハイスコア）", unrankedNote:"（練習扱い・ハイスコア対象外）", modsLabel:"MODS",
  /* HIDDEN／SUDDEN */
  hidden:"HIDDEN：判定位置の手前でノーツが消える", sudden:"SUDDEN：ノーツが途中から現れる", coverAmount:"消える／隠れる範囲",
  /* サブキー・プリセット */
  leftSub:"左キー（サブ）", rightSub:"右キー（サブ）", unset:"未設定",
  keyPresetDefault:"↺ A／Space（標準）", keyPresetTaiko:"osu!taiko風（F・J／D・K）", keysPresetDone:"キー設定を「{name}」にしました。",
  captureSubLeft:"左キー（サブ）に割り当てるキーを押してください。Backspaceで解除、ESCでキャンセル。",
  captureSubRight:"右キー（サブ）に割り当てるキーを押してください。Backspaceで解除、ESCでキャンセル。",
  assignedSub:"サブキーに設定しました。", subCleared:"サブキーを解除しました。",
  /* プレイ中のキー */
  quickRetryHint:"プレイ中のキー：` （1の左）を長押し＝最初からやり直し ／ - と = ＝タイミング補正を5msずつ調整",
  offsetToast:"タイミング補正 {n}ms"
});

Object.assign(TEXT.en, {
  secOptions:"🎯 Play options",
  secLives:"❤ Life mode", livesStandard:"Standard", livesKnight:"Knight", livesChicken:"trk!", livesNone:"Infinite",
  livesHint:"MANUAL/STAGE/CATCH: Standard starts with 20 lives, +1 every 10 combo, up to 50. TRUCK: Standard = 3 lives (+1 every 50 combo). ORBIT: Standard = 20 lives (+1 every 20 combo). Knight = start with 3, +1 every 50 combo, up to 5 (ORBIT: 15 lives, +1 every 50 combo). trk! = one miss and you're out. Infinite = play to the end no matter what. AUTO has no lives. Titles can be earned in any life mode.",
  lifeNumber:"Also show the life number", lifeHeal:"❤ +1", lifeSkinLabel:"Life display style",
  lifeSkinHeart:"❤ Hearts", lifeSkinBar:"━ Simple bar", lifeSkinSegments:"▰ Segments", lifeSkinBattery:"▣ Battery",
  lifeSkinShield:"🛡 Shield", lifeSkinMode:"Mode icon", lifeSkinCustom:"Custom emoji", lifeEmojiLabel:"Display emoji",
  countdown:"Show a 3-2-1-GO! countdown before playing", countdownSE:"Play countdown sounds",
  resumeCountdown:"Also count down when resuming from pause",
  countdownHint:"The countdown follows the song's BPM. Notes scroll in during the countdown.", go:"GO!",
  judgeLevel:"Judgement strictness", judgeLenient:"Lenient", judgeStandard:"Standard", judgeStrict:"Strict",
  judgeHint:"“Lenient” counts as practice (no high score). “Strict” is ranked.",
  rate:"Playback speed",
  rateHint:"1.00x = normal high score. 1.05x and above keep a separate high score per speed plus your “🏁 best clear speed”. Below 1.00x counts as practice (pitch is preserved).",
  rateRecordNote:"(per-speed high score)", unrankedNote:"(practice — no high score)", modsLabel:"MODS",
  hidden:"HIDDEN: notes fade out before the judgement line", sudden:"SUDDEN: notes appear late", coverAmount:"Fade / cover amount",
  leftSub:"Left key (sub)", rightSub:"Right key (sub)", unset:"Not set",
  keyPresetDefault:"↺ A / Space (default)", keyPresetTaiko:"osu!taiko style (F·J / D·K)", keysPresetDone:"Keys set to “{name}”.",
  captureSubLeft:"Press a key for the left sub key. Backspace clears, ESC cancels.",
  captureSubRight:"Press a key for the right sub key. Backspace clears, ESC cancels.",
  assignedSub:"Sub key assigned.", subCleared:"Sub key cleared.",
  quickRetryHint:"In play: hold ` (left of 1) = quick retry / - and = adjust latency by 5 ms",
  offsetToast:"Latency {n} ms"
});

Object.assign(TEXT.zh, {
  secOptions:"🎯 游玩选项",
  secLives:"❤ 体力模式", livesStandard:"标准", livesKnight:"骑士", livesChicken:"trk!", livesNone:"无限",
  livesHint:"MANUAL・STAGE・CATCH：标准从20开始，每10连击+1，最多50。TRUCK：标准为3（每50连击+1）。ORBIT：标准为20（每20连击+1）。骑士：从3开始，每50连击+1，最多5（ORBIT为15，每50连击+1）。trk!：失误一次即结束。无限：失误也能玩到最后。AUTO没有体力。任何体力模式都能获得称号。",
  lifeNumber:"同时显示体力数字", lifeHeal:"❤ +1", lifeSkinLabel:"体力显示样式",
  lifeSkinHeart:"❤ 爱心", lifeSkinBar:"━ 简洁进度条", lifeSkinSegments:"▰ 分段", lifeSkinBattery:"▣ 电池",
  lifeSkinShield:"🛡 盾牌", lifeSkinMode:"模式图标", lifeSkinCustom:"自定义表情", lifeEmojiLabel:"显示的表情",
  countdown:"开始前显示 3・2・1・GO!", countdownSE:"播放倒计时音效",
  resumeCountdown:"从暂停恢复时也倒计时",
  countdownHint:"倒计时间隔跟随歌曲BPM。倒计时期间音符会流入。", go:"GO!",
  judgeLevel:"判定严格度", judgeLenient:"宽松", judgeStandard:"标准", judgeStrict:"严格",
  judgeHint:"“宽松”视为练习，不计最高分；“严格”计入。",
  rate:"播放速度",
  rateHint:"1.00x＝普通最高分。1.05x以上按速度分别记录最高分，并记录“🏁 最高通关速度”。低于1.00x视为练习（音高不变）。",
  rateRecordNote:"（按速度记录）", unrankedNote:"（练习・不计最高分）", modsLabel:"MODS",
  hidden:"HIDDEN：音符在判定线前消失", sudden:"SUDDEN：音符从中途出现", coverAmount:"消失／遮挡范围",
  leftSub:"左键位（副）", rightSub:"右键位（副）", unset:"未设置",
  keyPresetDefault:"↺ A／Space（标准）", keyPresetTaiko:"osu!taiko风（F・J／D・K）", keysPresetDone:"已将按键设为“{name}”。",
  captureSubLeft:"请按下左键位（副）的按键。Backspace解除，ESC取消。",
  captureSubRight:"请按下右键位（副）的按键。Backspace解除，ESC取消。",
  assignedSub:"已设置副键。", subCleared:"已解除副键。",
  quickRetryHint:"游戏中：长按 `（1的左边）＝立即重来 ／ - 和 = ＝延迟补偿每次调整5ms",
  offsetToast:"延迟补偿 {n}ms"
});

Object.assign(TEXT.ko, {
  secOptions:"🎯 플레이 옵션",
  secLives:"❤ 체력 모드", livesStandard:"스탠다드", livesKnight:"나이트", livesChicken:"trk!", livesNone:"무한",
  livesHint:"MANUAL・STAGE・CATCH: 스탠다드는 체력 20으로 시작, 10콤보마다 +1, 최대 50. TRUCK: 스탠다드는 체력 3 (50콤보마다 +1). ORBIT: 스탠다드는 체력 20 (20콤보마다 +1). 나이트: 3으로 시작해 50콤보마다 +1, 최대 5 (ORBIT는 15, 50콤보마다 +1). trk!: 한 번 미스하면 종료. 무한: 미스해도 끝까지 플레이. AUTO에는 체력이 없습니다. 모든 체력 모드에서 칭호를 받을 수 있습니다.",
  lifeNumber:"체력 숫자도 표시", lifeHeal:"❤ +1", lifeSkinLabel:"체력 표시 스타일",
  lifeSkinHeart:"❤ 하트", lifeSkinBar:"━ 심플 게이지", lifeSkinSegments:"▰ 분할 게이지", lifeSkinBattery:"▣ 배터리",
  lifeSkinShield:"🛡 방패", lifeSkinMode:"모드 아이콘", lifeSkinCustom:"사용자 지정 이모지", lifeEmojiLabel:"표시할 이모지",
  countdown:"시작 전에 3・2・1・GO! 표시", countdownSE:"카운트 소리 재생",
  resumeCountdown:"일시정지에서 돌아올 때도 카운트",
  countdownHint:"카운트 간격은 곡의 BPM에 맞춥니다. 카운트 중에 노트가 흘러 들어옵니다.", go:"GO!",
  judgeLevel:"판정 엄격도", judgeLenient:"느슨하게", judgeStandard:"표준", judgeStrict:"엄격하게",
  judgeHint:"'느슨하게'는 연습 취급으로 최고 점수에서 제외됩니다. '엄격하게'는 포함됩니다.",
  rate:"재생 속도",
  rateHint:"1.00x＝일반 최고 점수. 1.05x 이상은 속도마다 따로 최고 점수와 '🏁 최고 클리어 속도'가 남습니다. 1.00x 미만은 연습 취급입니다 (음정은 그대로).",
  rateRecordNote:"(속도별 최고 점수)", unrankedNote:"(연습 취급・최고 점수 제외)", modsLabel:"MODS",
  hidden:"HIDDEN: 판정선 앞에서 노트가 사라짐", sudden:"SUDDEN: 노트가 중간부터 나타남", coverAmount:"사라짐／가림 범위",
  leftSub:"왼쪽 키 (서브)", rightSub:"오른쪽 키 (서브)", unset:"미설정",
  keyPresetDefault:"↺ A／Space (기본)", keyPresetTaiko:"osu!taiko 스타일 (F・J／D・K)", keysPresetDone:"키 설정을 '{name}'(으)로 바꿨습니다.",
  captureSubLeft:"왼쪽 서브 키로 지정할 키를 누르세요. Backspace로 해제, ESC로 취소.",
  captureSubRight:"오른쪽 서브 키로 지정할 키를 누르세요. Backspace로 해제, ESC로 취소.",
  assignedSub:"서브 키를 설정했습니다.", subCleared:"서브 키를 해제했습니다.",
  quickRetryHint:"플레이 중: ` (1 왼쪽) 길게 누르기＝바로 재시작 ／ - 와 = ＝지연 보정 5ms씩 조정",
  offsetToast:"지연 보정 {n}ms"
});
/* ✅ i18n-options.js 完了 */
