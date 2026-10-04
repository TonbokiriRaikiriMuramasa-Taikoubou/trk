// SPDX-License-Identifier: GPL-3.0-or-later
(() => {
  "use strict";

  const TEXT = {
    ja: {
      localOnly: "LOCAL ONLY · 音源は送信されません", languageLabel: "表示言語", homeLabel: "trk! ホーム",
      heroEyebrow: "音楽へのリスペクトから生まれた、自由な遊び場", heroLine1: "音で、遊びを", heroLine2: "つくろう。",
      heroDescription: "好きな曲が、あなただけの譜面になる。ジャンルも世代も飛び越えて、リズムを自由に楽しもう。",
      heroCta: "プレイをはじめる", howItWorks: "遊びかたを見る", heroFootnote: "あなたの音楽、あなたのリズム。",
      playHeading: "まずは一曲、鳴らそう。", playIntro: "デモですぐ試すか、端末の音源を読み込んで自分だけのプレイを。",
      densityLabel: "譜面の密度", densityEasy: "ゆったり", densityStandard: "スタンダード", densityHard: "高密度",
      demoOverline: "TRK! ORIGINAL / SYNTH DEMO", secondsUnit: "秒", demoTrackType: "オリジナル・シンセサウンド",
      playDemo: "デモで遊ぶ", demoDescription: "音源ファイルなしで遊べる、trk! のための小さなデモトラック。",
      uploadEyebrow: "BRING YOUR OWN BEAT", uploadHeading: "手持ちの曲で遊ぶ",
      uploadDescription: "音源をここにドロップ<br>またはファイルを選択", chooseFile: "音源を選ぶ",
      privacyNote: "音源はこの端末だけで処理され、アップロードされません。",
      uploadFootnote: "譜面とBPMは曲の音量変化から自動で推定する実験機能です。",
      trackReady: "TRACK READY", playTrack: "この曲でプレイ", removeTrack: "曲を解除",
      howHeading: "ルールは、リズムだけ。", howIntro: "譜面は自動生成。あとは流れてくるノートに合わせて叩くだけ。",
      keyLayout: "4-KEY LAYOUT", tapHint: "キーボード / タップ対応",
      stepOneTitle: "曲を選ぶ", stepOneText: "デモを鳴らすか、手元の音源を読み込もう。",
      stepTwoTitle: "リズムをつかむ", stepTwoText: "曲に合わせて流れてくるノートを見よう。",
      stepThreeTitle: "叩いて、楽しむ", stepThreeText: "D・F・J・K、または画面のキーをタイミングよく。",
      manifestoHeading: "好きなものへのリスペクトを、<br>次の遊び場へ。",
      manifestoText: "trk! は音楽と、たくさんのリズムゲームへの敬意から生まれた非営利のオープンプロジェクトです。特定の作品を再現するのではなく、みんなの「好き」を持ち寄れる遊び場を目指しています。",
      manifestoLink: "プロジェクトをのぞく", footerCopy: "音楽への敬意を、遊びにしよう。曲の権利は、それぞれの作者へ。", contributeLink: "参加する",
      nowPlaying: "NOW PLAYING", pause: "一時停止", resume: "再開", exit: "終了",
      scoreLabel: "SCORE", comboLabel: "COMBO", accuracyLabel: "ACCURACY", getReady: "GET READY",
      canvasLabel: "リズムゲームの譜面", touchKeysLabel: "タップ用レーンキー", pausedKicker: "PAUSED", pausedTitle: "ひと休み。", pausedText: "準備ができたら、リズムに戻ろう。",
      resultEyebrow: "SESSION COMPLETE", resultTitle: "いいリズム！", bestCombo: "BEST COMBO", playAgain: "もう一度遊ぶ", backHome: "曲選択に戻る",
      gameFooterHint: "ノートが判定ラインに来たら、同じ色のキーを叩こう。", progressLabel: "再生位置",
      estimatedBpm: "推定 {bpm} BPM", noteCount: "{count} NOTES", estimatedTempo: "BPMは音源からの推定値です。",
      loadingAudio: "音源を読み込んでいます…", analyzingAudio: "音のリズムを解析して譜面を作成しています…", loadingDemo: "デモトラックを準備しています…",
      trackLoaded: "{bpm} BPM前後のリズムを検出しました。プレイ準備OK！", fileTooLarge: "ファイルが大きすぎます。120 MB以下の音源を選んでください。",
      unsupportedFile: "音声ファイルを選んでください（MP3、WAV、OGG、FLAC など）。", decodeError: "この音源を読み込めませんでした。別の形式のファイルを試してください。",
      tooShort: "音源が短すぎます。5秒以上の曲を選んでください。", audioUnavailable: "このブラウザは Web Audio に対応していません。最新のブラウザでお試しください。",
      demoError: "デモ音源を作成できませんでした。ページを再読み込みしてお試しください。", chartError: "譜面を作成できませんでした。別の音源を試してください。",
      demoTitle: "Pulse Study", bpmValue: "{bpm} BPM (推定)", difficultyEasy: "ゆったり", difficultyStandard: "スタンダード", difficultyHard: "高密度",
      judgePerfect: "PERFECT", judgeGreat: "GREAT", judgeGood: "GOOD", judgeMiss: "MISS",
      toastNoNote: "", resultGradeS: "S", resultGradeA: "A", resultGradeB: "B", resultGradeC: "C", resultGradeD: "D"
    },
    en: {
      localOnly: "LOCAL ONLY · AUDIO IS NEVER UPLOADED", languageLabel: "Display language", homeLabel: "trk! home",
      heroEyebrow: "A PLAYGROUND BUILT ON LOVE FOR MUSIC", heroLine1: "Make a game", heroLine2: "out of sound.",
      heroDescription: "Your favorite tracks become your own charts. Cross genres and generations, and find your way into the rhythm.",
      heroCta: "Start playing", howItWorks: "How it works", heroFootnote: "Your music. Your rhythm.",
      playHeading: "Start with one track.", playIntro: "Jump into the demo, or load music from your own device.",
      densityLabel: "CHART DENSITY", densityEasy: "Chill", densityStandard: "Standard", densityHard: "Dense",
      demoOverline: "TRK! ORIGINAL / SYNTH DEMO", secondsUnit: "SEC", demoTrackType: "Original synth soundtrack",
      playDemo: "Play the demo", demoDescription: "A little original demo track made for trk! — no audio file needed.",
      uploadEyebrow: "BRING YOUR OWN BEAT", uploadHeading: "Play your own music",
      uploadDescription: "Drop an audio file here<br>or choose a file", chooseFile: "Choose audio",
      privacyNote: "Audio is processed on this device and never uploaded.",
      uploadFootnote: "Chart and BPM are experimental estimates based on changes in audio volume.",
      trackReady: "TRACK READY", playTrack: "Play this track", removeTrack: "Remove track",
      howHeading: "One rule: follow the rhythm.", howIntro: "Charts are generated automatically. Hit each note as it reaches the line.",
      keyLayout: "4-KEY LAYOUT", tapHint: "Keyboard / touch supported",
      stepOneTitle: "Choose a track", stepOneText: "Start the demo or load an audio file from your device.",
      stepTwoTitle: "Find the rhythm", stepTwoText: "Watch the notes move with the music.",
      stepThreeTitle: "Tap and play", stepThreeText: "Hit D, F, J, K, or tap the matching on-screen lane.",
      manifestoHeading: "Love what inspires us.<br>Make room for what comes next.",
      manifestoText: "trk! is a non-profit, open project made with respect for music and the many rhythm games that came before it. Rather than recreating any one game, we want to make a playground where everyone can bring what they love.",
      manifestoLink: "Explore the project", footerCopy: "Made with love for music. Music rights belong to their respective creators.", contributeLink: "Contribute",
      nowPlaying: "NOW PLAYING", pause: "Pause", resume: "Resume", exit: "Exit",
      scoreLabel: "SCORE", comboLabel: "COMBO", accuracyLabel: "ACCURACY", getReady: "GET READY",
      canvasLabel: "Rhythm game chart", touchKeysLabel: "On-screen lane keys", pausedKicker: "PAUSED", pausedTitle: "Take a breath.", pausedText: "Ready when you are. Find your way back to the rhythm.",
      resultEyebrow: "SESSION COMPLETE", resultTitle: "Nice rhythm!", bestCombo: "BEST COMBO", playAgain: "Play again", backHome: "Back to tracks",
      gameFooterHint: "Hit the matching lane when a note reaches the line.", progressLabel: "Playback position",
      estimatedBpm: "EST. {bpm} BPM", noteCount: "{count} NOTES", estimatedTempo: "BPM is estimated from the audio.",
      loadingAudio: "Loading audio…", analyzingAudio: "Listening for the beat and building a chart…", loadingDemo: "Preparing the demo track…",
      trackLoaded: "Found a rhythm around {bpm} BPM. Ready to play!", fileTooLarge: "That file is too large. Please choose audio under 120 MB.",
      unsupportedFile: "Please choose an audio file (MP3, WAV, OGG, FLAC, and more).", decodeError: "We couldn't read that audio. Try a different file format.",
      tooShort: "That track is too short. Please choose a song at least 5 seconds long.", audioUnavailable: "This browser does not support Web Audio. Please try a recent browser.",
      demoError: "We couldn't create the demo audio. Reload the page and try again.", chartError: "We couldn't create a chart for that track. Try another audio file.",
      demoTitle: "Pulse Study", bpmValue: "{bpm} BPM (est.)", difficultyEasy: "Chill", difficultyStandard: "Standard", difficultyHard: "Dense",
      judgePerfect: "PERFECT", judgeGreat: "GREAT", judgeGood: "GOOD", judgeMiss: "MISS", toastNoNote: "",
      resultGradeS: "S", resultGradeA: "A", resultGradeB: "B", resultGradeC: "C", resultGradeD: "D"
    },
    zh: {
      localOnly: "仅本地处理 · 音频不会上传", languageLabel: "显示语言", homeLabel: "trk! 首页",
      heroEyebrow: "以对音乐的热爱为起点，打造自由的游乐场", heroLine1: "让声音，", heroLine2: "变成游戏。",
      heroDescription: "把喜欢的音乐变成专属谱面。跨越风格与世代，自由享受节奏。",
      heroCta: "开始游玩", howItWorks: "玩法介绍", heroFootnote: "你的音乐，你的节奏。",
      playHeading: "先从一首歌开始。", playIntro: "先试试演示曲，或载入设备中的音乐开始游玩。",
      densityLabel: "谱面密度", densityEasy: "轻松", densityStandard: "标准", densityHard: "高密度",
      demoOverline: "TRK! ORIGINAL / SYNTH DEMO", secondsUnit: "秒", demoTrackType: "原创合成器音色",
      playDemo: "游玩演示曲", demoDescription: "为 trk! 创作的小型原创演示曲，无需音频文件即可游玩。",
      uploadEyebrow: "BRING YOUR OWN BEAT", uploadHeading: "游玩自己的音乐",
      uploadDescription: "将音频文件拖放到此处<br>或选择文件", chooseFile: "选择音频",
      privacyNote: "音频仅在此设备上处理，不会上传。", uploadFootnote: "谱面与 BPM 根据音量变化自动推测，目前仍属实验功能。",
      trackReady: "TRACK READY", playTrack: "用这首歌游玩", removeTrack: "移除歌曲",
      howHeading: "规则只有一个：跟随节奏。", howIntro: "谱面会自动生成。只需在音符到达判定线时按下对应按键。",
      keyLayout: "4-KEY LAYOUT", tapHint: "支持键盘与触控",
      stepOneTitle: "选择音乐", stepOneText: "播放演示曲，或载入设备中的音频文件。",
      stepTwoTitle: "找到节奏", stepTwoText: "观察音符随音乐向判定线移动。",
      stepThreeTitle: "按下并享受", stepThreeText: "按 D、F、J、K，或点击对应的屏幕轨道。",
      manifestoHeading: "致敬那些启发我们的作品，<br>一起创造下一个游乐场。",
      manifestoText: "trk! 是一个非营利开放项目，致敬音乐以及许多节奏游戏。我们不复刻任何特定作品，而是希望打造一个能让大家分享热爱的游乐场。",
      manifestoLink: "了解项目", footerCopy: "以对音乐的热爱创作。音乐版权归各自创作者所有。", contributeLink: "参与贡献",
      nowPlaying: "正在播放", pause: "暂停", resume: "继续", exit: "退出",
      scoreLabel: "分数", comboLabel: "连击", accuracyLabel: "准确率", getReady: "准备开始",
      canvasLabel: "节奏游戏谱面", touchKeysLabel: "触控轨道按键", pausedKicker: "已暂停", pausedTitle: "休息一下。", pausedText: "准备好后，回到节奏中来。",
      resultEyebrow: "本局结束", resultTitle: "节奏不错！", bestCombo: "最高连击", playAgain: "再玩一次", backHome: "返回选曲",
      gameFooterHint: "音符到达判定线时，按下对应颜色的轨道。", progressLabel: "播放进度",
      estimatedBpm: "推测 {bpm} BPM", noteCount: "{count} 个音符", estimatedTempo: "BPM 为音频分析推测值。",
      loadingAudio: "正在载入音频…", analyzingAudio: "正在分析节奏并生成谱面…", loadingDemo: "正在准备演示曲…",
      trackLoaded: "检测到约 {bpm} BPM 的节奏，准备就绪！", fileTooLarge: "文件过大，请选择 120 MB 以下的音频。",
      unsupportedFile: "请选择音频文件（MP3、WAV、OGG、FLAC 等）。", decodeError: "无法读取此音频，请尝试其他格式的文件。",
      tooShort: "音频太短，请选择至少 5 秒的曲目。", audioUnavailable: "此浏览器不支持 Web Audio，请尝试使用较新的浏览器。",
      demoError: "无法生成演示音频，请重新载入页面后重试。", chartError: "无法为此音频生成谱面，请尝试其他文件。",
      demoTitle: "Pulse Study", bpmValue: "{bpm} BPM（推测）", difficultyEasy: "轻松", difficultyStandard: "标准", difficultyHard: "高密度",
      judgePerfect: "PERFECT", judgeGreat: "GREAT", judgeGood: "GOOD", judgeMiss: "MISS", toastNoNote: "",
      resultGradeS: "S", resultGradeA: "A", resultGradeB: "B", resultGradeC: "C", resultGradeD: "D"
    },
    ko: {
      localOnly: "이 기기에서만 재생 · 오디오는 업로드되지 않아요", languageLabel: "표시 언어", homeLabel: "trk! 홈",
      heroEyebrow: "음악을 향한 애정에서 시작된 자유로운 놀이터", heroLine1: "소리로,", heroLine2: "놀이를 만들자.",
      heroDescription: "좋아하는 곡이 나만의 채보가 돼요. 장르와 세대를 넘어 리듬을 자유롭게 즐겨 보세요.",
      heroCta: "플레이 시작", howItWorks: "플레이 방법", heroFootnote: "나의 음악, 나의 리듬.",
      playHeading: "먼저 한 곡을 틀어봐요.", playIntro: "데모를 바로 플레이하거나 기기의 음악을 불러와 나만의 플레이를 즐겨요.",
      densityLabel: "채보 밀도", densityEasy: "느긋하게", densityStandard: "스탠더드", densityHard: "고밀도",
      demoOverline: "TRK! ORIGINAL / SYNTH DEMO", secondsUnit: "초", demoTrackType: "오리지널 신스 사운드",
      playDemo: "데모 플레이", demoDescription: "오디오 파일 없이 즐길 수 있는 trk! 오리지널 데모 트랙.",
      uploadEyebrow: "BRING YOUR OWN BEAT", uploadHeading: "내 음악으로 플레이",
      uploadDescription: "오디오 파일을 여기에 놓거나<br>파일을 선택하세요", chooseFile: "오디오 선택",
      privacyNote: "오디오는 이 기기에서만 처리되며 업로드되지 않아요.", uploadFootnote: "채보와 BPM은 오디오의 음량 변화를 바탕으로 추정하는 실험 기능이에요.",
      trackReady: "TRACK READY", playTrack: "이 곡으로 플레이", removeTrack: "곡 해제",
      howHeading: "규칙은 하나, 리듬을 따라가기.", howIntro: "채보는 자동으로 만들어져요. 노트가 판정선에 올 때 맞춰 입력하세요.",
      keyLayout: "4-KEY LAYOUT", tapHint: "키보드 / 터치 지원",
      stepOneTitle: "곡 선택하기", stepOneText: "데모를 재생하거나 기기의 오디오 파일을 불러오세요.",
      stepTwoTitle: "리듬 찾기", stepTwoText: "음악에 맞춰 내려오는 노트를 확인하세요.",
      stepThreeTitle: "입력하고 즐기기", stepThreeText: "D·F·J·K 키 또는 화면의 레인을 눌러요.",
      manifestoHeading: "좋아하는 것에 대한 존중을,<br>새로운 놀이터로 이어가요.",
      manifestoText: "trk!는 음악과 여러 리듬 게임에 대한 존중에서 시작된 비영리 오픈 프로젝트예요. 특정 작품을 재현하기보다 모두가 좋아하는 것을 함께 나눌 수 있는 놀이터를 만들고 싶어요.",
      manifestoLink: "프로젝트 둘러보기", footerCopy: "음악을 향한 애정으로 만들어요. 음악 권리는 각 창작자에게 있어요.", contributeLink: "함께하기",
      nowPlaying: "NOW PLAYING", pause: "일시 정지", resume: "다시 시작", exit: "종료",
      scoreLabel: "점수", comboLabel: "콤보", accuracyLabel: "정확도", getReady: "준비하세요",
      canvasLabel: "리듬 게임 채보", touchKeysLabel: "화면 레인 키", pausedKicker: "PAUSED", pausedTitle: "잠시 쉬어가요.", pausedText: "준비되면 다시 리듬 속으로 돌아와요.",
      resultEyebrow: "SESSION COMPLETE", resultTitle: "리듬이 좋아요!", bestCombo: "최고 콤보", playAgain: "다시 플레이", backHome: "곡 선택으로",
      gameFooterHint: "노트가 판정선에 오면 같은 색의 레인을 눌러요.", progressLabel: "재생 위치",
      estimatedBpm: "추정 {bpm} BPM", noteCount: "노트 {count}개", estimatedTempo: "BPM은 오디오에서 추정한 값이에요.",
      loadingAudio: "오디오를 불러오는 중…", analyzingAudio: "리듬을 분석해 채보를 만들고 있어요…", loadingDemo: "데모 트랙을 준비하는 중…",
      trackLoaded: "약 {bpm} BPM의 리듬을 찾았어요. 플레이 준비 완료!", fileTooLarge: "파일이 너무 커요. 120 MB 이하의 오디오를 선택해 주세요.",
      unsupportedFile: "오디오 파일을 선택해 주세요 (MP3, WAV, OGG, FLAC 등).", decodeError: "오디오를 읽을 수 없어요. 다른 형식의 파일을 시도해 주세요.",
      tooShort: "트랙이 너무 짧아요. 5초 이상의 곡을 선택해 주세요.", audioUnavailable: "이 브라우저는 Web Audio를 지원하지 않아요. 최신 브라우저를 사용해 주세요.",
      demoError: "데모 오디오를 만들 수 없어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.", chartError: "채보를 만들 수 없어요. 다른 오디오 파일을 시도해 주세요.",
      demoTitle: "Pulse Study", bpmValue: "{bpm} BPM (추정)", difficultyEasy: "느긋하게", difficultyStandard: "스탠더드", difficultyHard: "고밀도",
      judgePerfect: "PERFECT", judgeGreat: "GREAT", judgeGood: "GOOD", judgeMiss: "MISS", toastNoNote: "",
      resultGradeS: "S", resultGradeA: "A", resultGradeB: "B", resultGradeC: "C", resultGradeD: "D"
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const elements = {
    language: $("#language-select"), difficulty: $("#difficulty-select"),
    fileInput: $("#audio-file"), dropZone: $("#drop-zone"), chooseFile: $("#choose-file"),
    playDemo: $("#play-demo"), loadedPanel: $("#loaded-track"), loadedTitle: $("#loaded-title"),
    loadedDuration: $("#loaded-duration"), loadedBpm: $("#loaded-bpm"), loadedNotes: $("#loaded-notes"),
    playLoaded: $("#play-loaded"), clearLoaded: $("#clear-loaded"), status: $("#load-status"), statusText: $("#load-status-text"),
    game: $("#game-screen"), canvas: $("#game-canvas"), score: $("#score-value"), combo: $("#combo-value"), accuracy: $("#accuracy-value"),
    gameTrack: $("#game-track-name"), gameBpm: $("#game-bpm"), gameDifficulty: $("#game-difficulty"), gameTime: $("#game-time"),
    gameChartCount: $("#game-chart-count"), gameElapsed: $("#game-elapsed"), progress: $(".game-progress"), progressFill: $("#progress-fill"),
    countIn: $("#count-in"), countInNumber: $("#count-in-number"), judgement: $("#judgement"),
    pause: $("#pause-game"), pauseLabel: $("#pause-game .game-button-label"), pauseOverlay: $("#pause-overlay"),
    resultOverlay: $("#result-overlay"), resultGrade: $("#result-grade"), resultTrackName: $("#result-track-name"),
    resultScore: $("#result-score"), resultAccuracy: $("#result-accuracy"), resultCombo: $("#result-combo"),
    toastRegion: $("#toast-region"), touchKeys: $$(".touch-key")
  };

  let locale = "ja";
  let audioContext = null;
  let activeTrack = null;
  let lastPlayedTrack = null;
  let gameSession = null;
  let gameStatus = "idle";
  let animationFrame = 0;
  let statusTimer = 0;
  let loadToken = 0;
  let judgeTimer = 0;
  let canvasContext = null;
  let canvasSize = { width: 0, height: 0, dpr: 1, laneLeft: 0, laneWidth: 0, hitY: 0 };
  let previousBodyOverflow = "";

  const LANES = ["#62d9ee", "#ff5067", "#ffd46d", "#b29aff"];
  const KEY_LANES = { KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
  const APPROACH_MS = 1700;
  const PERFECT_MS = 46;
  const GREAT_MS = 93;
  const GOOD_MS = 155;
  const MAX_FILE_BYTES = 120 * 1024 * 1024;

  function tr(key, values = {}) {
    let value = (TEXT[locale] && TEXT[locale][key]) || TEXT.ja[key] || key;
    for (const [name, replacement] of Object.entries(values)) value = value.replaceAll(`{${name}}`, String(replacement));
    return value;
  }

  function applyTranslations() {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
    for (const node of $$("[data-i18n]")) node.textContent = tr(node.dataset.i18n);
    for (const node of $$("[data-i18n-html]")) node.innerHTML = tr(node.dataset.i18nHtml);
    for (const node of $$("[data-i18n-aria]")) node.setAttribute("aria-label", tr(node.dataset.i18nAria));
    for (const node of $$("[data-i18n-title]")) node.setAttribute("title", tr(node.dataset.i18nTitle));
    elements.language.value = locale;
    if (activeTrack) updateLoadedTrack();
    updatePauseLabel();
    if (gameSession) updateGameDetails();
  }

  function chooseInitialLocale() {
    let saved = "";
    try { saved = localStorage.getItem("trk-language") || ""; } catch { /* storage is optional */ }
    if (TEXT[saved]) return saved;
    const language = (navigator.language || "ja").slice(0, 2).toLowerCase();
    return TEXT[language] ? language : "ja";
  }

  function updateLocale(next) {
    locale = TEXT[next] ? next : "ja";
    try { localStorage.setItem("trk-language", locale); } catch { /* private browsing may disable storage */ }
    applyTranslations();
  }

  function showToast(message, kind = "error", duration = 4200) {
    if (!message) return;
    const toast = document.createElement("div");
    toast.className = `toast${kind === "success" ? " success" : ""}`;
    toast.textContent = message;
    elements.toastRegion.append(toast);
    window.setTimeout(() => {
      toast.classList.add("out");
      window.setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  function showLoadStatus(key) {
    window.clearTimeout(statusTimer);
    elements.statusText.textContent = tr(key);
    elements.status.hidden = false;
  }

  function hideLoadStatus(delay = 0) {
    window.clearTimeout(statusTimer);
    if (delay > 0) statusTimer = window.setTimeout(() => { elements.status.hidden = true; }, delay);
    else elements.status.hidden = true;
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function formatScore(score) { return String(Math.max(0, Math.floor(score))).padStart(8, "0"); }
  function currentDifficulty() { return elements.difficulty.value || "normal"; }
  function difficultyText(mode) { return tr(mode === "easy" ? "difficultyEasy" : mode === "hard" ? "difficultyHard" : "difficultyStandard"); }

  function getAudioContext() {
    if (audioContext) return audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("audio-unavailable");
    audioContext = new AudioContextClass();
    return audioContext;
  }

  function analyzeAudio(buffer) {
    const frameSeconds = 0.02;
    const analysisDuration = Math.min(buffer.duration, 180);
    const frameSize = Math.max(1, Math.round(buffer.sampleRate * frameSeconds));
    const frameCount = Math.max(1, Math.ceil(analysisDuration * buffer.sampleRate / frameSize));
    const channelCount = buffer.numberOfChannels;
    const channels = [];
    for (let channel = 0; channel < channelCount; channel++) channels.push(buffer.getChannelData(channel));

    const energy = new Float32Array(frameCount);
    let overallPower = 0;
    for (let frame = 0; frame < frameCount; frame++) {
      const start = frame * frameSize;
      const end = Math.min(start + frameSize, buffer.length);
      let power = 0;
      let samples = 0;
      for (let sample = start; sample < end; sample += 1) {
        let mono = 0;
        for (let channel = 0; channel < channelCount; channel++) mono += channels[channel][sample] || 0;
        mono /= channelCount || 1;
        power += mono * mono;
        samples += 1;
      }
      const rms = Math.sqrt(power / Math.max(1, samples));
      energy[frame] = rms;
      overallPower += power;
    }

    const onsetRaw = new Float32Array(frameCount);
    let fluxTotal = 0;
    for (let i = 1; i < frameCount; i++) {
      const from = Math.max(0, i - 4);
      let baseline = 0;
      for (let j = from; j < i; j++) baseline += energy[j];
      baseline /= Math.max(1, i - from);
      const flux = Math.max(0, energy[i] - baseline * 0.92);
      onsetRaw[i] = flux;
      fluxTotal += flux;
    }

    let peak = 0;
    for (let i = 0; i < frameCount; i++) if (onsetRaw[i] > peak) peak = onsetRaw[i];
    const meanFlux = fluxTotal / Math.max(1, frameCount - 1);
    const minimumLag = Math.floor((60 / 175) / frameSeconds);
    const maximumLag = Math.ceil((60 / 65) / frameSeconds);
    let bestLag = 25;
    let bestScore = -Infinity;

    if (peak > 0.000025) {
      for (let lag = minimumLag; lag <= maximumLag; lag++) {
        let dot = 0;
        let sumA = 0;
        let sumB = 0;
        let count = 0;
        for (let i = lag; i < frameCount; i += 2) {
          const a = Math.max(0, onsetRaw[i] - meanFlux * 0.5);
          const b = Math.max(0, onsetRaw[i - lag] - meanFlux * 0.5);
          dot += a * b;
          sumA += a * a;
          sumB += b * b;
          count++;
        }
        const score = count && sumA && sumB ? dot / Math.sqrt(sumA * sumB) : 0;
        const bpm = 60 / (lag * frameSeconds);
        const tempoPreference = bpm < 78 ? 0.93 : bpm > 160 ? 0.96 : 1;
        const adjusted = score * tempoPreference;
        if (adjusted > bestScore) { bestScore = adjusted; bestLag = lag; }
      }
    }

    let bpm = Math.round(60 / (bestLag * frameSeconds));
    if (bpm < 82 && bpm * 2 <= 175) bpm *= 2;
    if (bpm > 158 && bpm / 2 >= 65 && bestScore < 0.18) bpm = Math.round(bpm / 2);
    bpm = Math.max(65, Math.min(175, bpm));

    const onset = new Float32Array(frameCount);
    const sorted = Array.from(onsetRaw).sort((a, b) => a - b);
    const scale = sorted[Math.floor(sorted.length * 0.94)] || peak || 1;
    for (let i = 0; i < frameCount; i++) onset[i] = scale > 0 ? Math.min(1, onsetRaw[i] / scale) : 0;

    const beatSeconds = 60 / bpm;
    let phase = 0;
    let phaseScore = -1;
    const phaseLimit = Math.min(beatSeconds, 60 / 65);
    const phaseStep = frameSeconds;
    const searchDuration = Math.min(analysisDuration, 50);
    for (let candidate = 0; candidate < phaseLimit; candidate += phaseStep) {
      let score = 0;
      for (let time = candidate; time < searchDuration; time += beatSeconds) {
        const frame = Math.min(frameCount - 1, Math.round(time / frameSeconds));
        score += onset[frame] + (frame > 0 ? onset[frame - 1] * 0.28 : 0) + (frame + 1 < frameCount ? onset[frame + 1] * 0.28 : 0);
      }
      if (score > phaseScore) { phaseScore = score; phase = candidate; }
    }

    const meanRms = Math.sqrt(overallPower / Math.max(1, frameCount * frameSize));
    return { bpm, phaseSec: phase, frameSeconds, onset, active: meanRms > 0.00007 && peak > 0.000025 };
  }

  function onsetAt(analysis, time) {
    if (!analysis || !analysis.onset) return 0;
    const index = Math.round(time / analysis.frameSeconds);
    if (index < 0 || index >= analysis.onset.length) return 0;
    return analysis.onset[index];
  }

  function createChart(track, mode = currentDifficulty()) {
    const bpm = track.bpm || 120;
    const beat = 60 / bpm;
    const halfBeat = beat / 2;
    const phase = track.phaseSec || 0;
    const duration = track.buffer.duration;
    const firstAllowed = Math.max(1.75, beat * 2);
    const events = [];
    const pattern = [0, 2, 1, 3, 1, 2, 0, 3, 2, 0, 3, 1, 0, 3, 2, 1];
    let previousLane = -1;
    let previousTime = -1000;
    const maxSteps = Math.ceil(duration / halfBeat) + 2;

    for (let step = 0; step < maxSteps; step++) {
      const time = phase + step * halfBeat;
      if (time < firstAllowed || time > duration - 0.18) continue;
      const onBeat = step % 2 === 0;
      const beatIndex = Math.max(0, Math.round((time - phase) / beat));
      const accent = onsetAt(track.analysis, time);
      let include = false;

      if (mode === "easy") {
        include = (onBeat && (beatIndex % 2 === 0 || accent > 0.62)) || (!onBeat && accent > 0.88 && beatIndex % 4 !== 3);
      } else if (mode === "hard") {
        include = step % 8 !== 7 || accent > 0.48;
      } else {
        include = onBeat || (accent > 0.38 && beatIndex % 4 !== 3);
      }
      if (!include) continue;

      const patternIndex = (beatIndex * 2 + (onBeat ? 0 : 1) + Math.floor(phase * 8)) % pattern.length;
      let lane = pattern[patternIndex];
      if (!onBeat && accent > 0.66) lane = (lane + (accent > 0.84 ? 2 : 1)) % 4;
      if (lane === previousLane && time - previousTime < Math.min(beat * 0.8, 0.46)) lane = (lane + (accent > 0.7 ? 2 : 1)) % 4;

      events.push({ timeMs: time * 1000, lane, status: "pending", accent });
      previousLane = lane;
      previousTime = time;
    }
    return events;
  }

  function updateLoadedTrack() {
    if (!activeTrack) {
      elements.loadedPanel.hidden = true;
      return;
    }
    activeTrack.events = createChart(activeTrack);
    elements.loadedTitle.textContent = activeTrack.title;
    elements.loadedDuration.textContent = formatTime(activeTrack.buffer.duration);
    elements.loadedBpm.textContent = tr("bpmValue", { bpm: activeTrack.bpm });
    elements.loadedNotes.textContent = tr("noteCount", { count: activeTrack.events.length });
    elements.loadedPanel.hidden = false;
  }

  function setActiveTrack(track) {
    activeTrack = track;
    updateLoadedTrack();
    hideLoadStatus();
  }

  async function loadAudioFile(file) {
    if (!file) return;
    const token = ++loadToken;
    const extension = file.name.split(".").pop().toLowerCase();
    const audioExtensions = ["mp3", "m4a", "wav", "flac", "ogg", "opus", "aac", "aiff", "aif", "webm"];
    if (file.size > MAX_FILE_BYTES) {
      elements.playDemo.disabled = false;
      elements.playLoaded.disabled = false;
      hideLoadStatus();
      showToast(tr("fileTooLarge"));
      return;
    }
    if (!(file.type || "").startsWith("audio/") && !audioExtensions.includes(extension)) {
      elements.playDemo.disabled = false;
      elements.playLoaded.disabled = false;
      hideLoadStatus();
      showToast(tr("unsupportedFile"));
      return;
    }

    elements.playDemo.disabled = true;
    elements.playLoaded.disabled = true;
    showLoadStatus("loadingAudio");
    try {
      const context = getAudioContext();
      const fileData = await file.arrayBuffer();
      if (token !== loadToken) return;
      const buffer = await context.decodeAudioData(fileData.slice(0));
      if (token !== loadToken) return;
      if (buffer.duration < 5) throw new Error("too-short");
      showLoadStatus("analyzingAudio");
      await new Promise(resolve => window.setTimeout(resolve, 25));
      const analysis = analyzeAudio(buffer);
      const title = file.name.replace(/\.[^.]+$/, "") || file.name;
      const track = { title, buffer, analysis, bpm: analysis.bpm, phaseSec: analysis.phaseSec, isDemo: false };
      const events = createChart(track);
      if (events.length < 2) throw new Error("chart-error");
      track.events = events;
      setActiveTrack(track);
      showToast(tr("trackLoaded", { bpm: analysis.bpm }), "success");
    } catch (error) {
      if (token !== loadToken) return;
      if (error.message === "too-short") showToast(tr("tooShort"));
      else if (error.message === "audio-unavailable") showToast(tr("audioUnavailable"));
      else if (error.message === "chart-error") showToast(tr("chartError"));
      else showToast(tr("decodeError"));
      hideLoadStatus();
    } finally {
      if (token === loadToken) {
        elements.playDemo.disabled = false;
        elements.playLoaded.disabled = false;
      }
    }
  }

  function makeNoise(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return (state / 4294967295) * 2 - 1;
    };
  }

  function createDemoBuffer(context) {
    const sampleRate = context.sampleRate;
    const bpm = 120;
    const beat = 60 / bpm;
    const duration = 32;
    const buffer = context.createBuffer(2, Math.floor(sampleRate * duration), sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    const random = makeNoise(143);

    const mix = (startTime, lengthSeconds, render) => {
      const start = Math.max(0, Math.floor(startTime * sampleRate));
      const end = Math.min(buffer.length, start + Math.ceil(lengthSeconds * sampleRate));
      for (let index = start; index < end; index++) {
        const localTime = (index - start) / sampleRate;
        const value = render(localTime);
        left[index] += value;
        right[index] += value * 0.96;
      }
    };

    const kick = time => mix(time, 0.24, t => {
      const envelope = Math.exp(-t * 18);
      const phase = 2 * Math.PI * (49 * t + 82 * (1 - Math.exp(-t * 28)) / 28);
      return Math.sin(phase) * envelope * 0.38;
    });
    const snare = time => mix(time, 0.18, t => {
      const envelope = Math.exp(-t * 20);
      return (random() * 0.19 + Math.sin(2 * Math.PI * 188 * t) * 0.08) * envelope;
    });
    const hat = time => mix(time, 0.055, t => random() * Math.exp(-t * 58) * 0.047);
    const pluck = (time, frequency, velocity = 1) => mix(time, 0.29, t => {
      const attack = Math.min(1, t * 95);
      const envelope = attack * Math.exp(-t * 8.5) * velocity;
      const phase = 2 * Math.PI * frequency * t;
      return (Math.sin(phase) * 0.105 + Math.sin(phase * 2.01) * 0.028) * envelope;
    });

    const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    const motif = [0, 2, 4, 2, 1, 4, 5, 4, 0, 2, 6, 4, 1, 2, 4, 2];
    for (let step = 0; step < duration / (beat / 2); step++) {
      const time = step * beat / 2;
      const beatIndex = Math.floor(step / 2);
      const onBeat = step % 2 === 0;
      if (onBeat) {
        if (beatIndex % 4 === 0 || beatIndex % 4 === 2) kick(time);
        else snare(time);
      }
      hat(time);
      if (step % 2 === 1 && beatIndex % 2 === 1) hat(time + 0.02);
      const note = motif[step % motif.length];
      if (onBeat || step % 4 === 3) pluck(time, scale[note], onBeat ? 1 : 0.63);
    }
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = Math.max(-0.92, Math.min(0.92, data[i] * 0.88));
    }
    return buffer;
  }

  function makeDemoTrack(buffer) {
    const frameSeconds = 0.02;
    const onset = new Float32Array(Math.ceil(buffer.duration / frameSeconds));
    for (let beatIndex = 0; beatIndex < Math.floor(buffer.duration * 2); beatIndex++) {
      const beatTime = beatIndex * 0.5;
      const frame = Math.round(beatTime / frameSeconds);
      if (frame < onset.length) onset[frame] = beatIndex % 2 === 0 ? 1 : 0.7;
      const offFrame = Math.round((beatTime + 0.25) / frameSeconds);
      if (offFrame < onset.length && beatIndex % 4 === 3) onset[offFrame] = 0.54;
    }
    const analysis = { bpm: 120, phaseSec: 0, frameSeconds, onset, active: true };
    return { title: tr("demoTitle"), buffer, analysis, bpm: 120, phaseSec: 0, isDemo: true };
  }

  async function playDemo() {
    if (gameStatus !== "idle") return;
    elements.playDemo.disabled = true;
    showLoadStatus("loadingDemo");
    try {
      const context = getAudioContext();
      if (context.state === "suspended") await context.resume();
      const buffer = createDemoBuffer(context);
      const track = makeDemoTrack(buffer);
      track.events = createChart(track);
      lastPlayedTrack = track;
      hideLoadStatus();
      await startGame(track);
    } catch (error) {
      hideLoadStatus();
      showToast(error.message === "audio-unavailable" ? tr("audioUnavailable") : tr("demoError"));
    } finally {
      elements.playDemo.disabled = false;
    }
  }

  function updateGameDetails() {
    if (!gameSession) return;
    const track = gameSession.track;
    elements.gameTrack.textContent = track.title;
    elements.gameBpm.textContent = `${track.bpm} BPM`;
    elements.gameDifficulty.textContent = difficultyText(gameSession.mode).toUpperCase();
    elements.gameChartCount.textContent = tr("noteCount", { count: gameSession.events.length });
    elements.resultTrackName.textContent = track.title;
  }

  function setGameHud() {
    if (!gameSession) return;
    elements.score.textContent = formatScore(gameSession.score);
    elements.combo.textContent = String(gameSession.combo);
    const accuracy = gameSession.judged === 0 ? 100 : gameSession.accuracyPoints / gameSession.judged * 100;
    elements.accuracy.textContent = `${accuracy.toFixed(2)}%`;
  }

  function updatePauseLabel() {
    if (!elements.pauseLabel) return;
    const paused = gameStatus === "paused";
    elements.pauseLabel.textContent = tr(paused ? "resume" : "pause");
    elements.pause.setAttribute("aria-label", tr(paused ? "resume" : "pause"));
    elements.pause.title = tr(paused ? "resume" : "pause");
  }

  async function startGame(track) {
    if (gameStatus !== "idle") closeGame();
    const context = getAudioContext();
    const mode = currentDifficulty();
    const events = createChart(track, mode);
    if (events.length < 2) throw new Error("chart-error");
    if (context.state === "suspended") await context.resume();

    const source = context.createBufferSource();
    source.buffer = track.buffer;
    source.connect(context.destination);
    gameSession = {
      track, source, events, mode, startAt: 0, elapsedMs: -3000,
      score: 0, combo: 0, maxCombo: 0, judged: 0, accuracyPoints: 0,
      nextEvent: 0, hitFlash: [0, 0, 0, 0], ended: false
    };
    lastPlayedTrack = track;
    gameStatus = "countin";
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    elements.game.hidden = false;
    elements.game.setAttribute("aria-hidden", "false");
    elements.pauseOverlay.hidden = true;
    elements.resultOverlay.hidden = true;
    elements.countIn.hidden = false;
    elements.judgement.className = "judgement";
    updateGameDetails();
    setGameHud();
    updatePauseLabel();
    elements.progressFill.style.width = "0%";
    elements.progress.setAttribute("aria-valuenow", "0");
    elements.gameTime.textContent = "00:00";
    elements.gameElapsed.textContent = `00:00 / ${formatTime(track.buffer.duration)}`;
    sizeCanvas();

    const countInSeconds = 3;
    gameSession.startAt = context.currentTime + countInSeconds;
    source.onended = () => {
      if (gameSession && gameSession.source === source && gameStatus === "playing") finishGame();
    };
    source.start(gameSession.startAt);
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function sizeCanvas() {
    if (!elements.canvas) return;
    const rect = elements.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = rect.width;
    const height = rect.height;
    elements.canvas.width = Math.round(width * dpr);
    elements.canvas.height = Math.round(height * dpr);
    canvasContext = elements.canvas.getContext("2d");
    canvasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    const laneTotal = Math.min(width * (width < 680 ? 0.84 : 0.66), width < 680 ? 530 : 590);
    canvasSize = { width, height, dpr, laneLeft: (width - laneTotal) / 2, laneWidth: laneTotal / 4, hitY: height - (width < 680 ? 51 : 82) };
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawGame() {
    if (!canvasContext || !gameSession) return;
    const ctx = canvasContext;
    const { width, height, laneLeft, laneWidth, hitY } = canvasSize;
    const elapsed = gameSession.elapsedMs;
    const approach = APPROACH_MS;
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "rgba(10,12,20,0.03)");
    background.addColorStop(1, "rgba(19,22,34,0.46)");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width / 2, hitY, 0, width / 2, hitY, Math.max(width, height) * 0.73);
    glow.addColorStop(0, "rgba(97,78,124,0.14)");
    glow.addColorStop(1, "rgba(9,10,16,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const laneHeight = Math.max(0, hitY);
    for (let lane = 0; lane < 4; lane++) {
      const x = laneLeft + lane * laneWidth;
      const laneGradient = ctx.createLinearGradient(0, 0, 0, hitY + 15);
      laneGradient.addColorStop(0, lane % 2 ? "rgba(255,255,255,0.008)" : "rgba(255,255,255,0.022)");
      laneGradient.addColorStop(1, "rgba(255,255,255,0.04)");
      ctx.fillStyle = laneGradient;
      ctx.fillRect(x, 0, laneWidth, laneHeight + 8);
      if (lane > 0) {
        ctx.strokeStyle = "rgba(205,213,235,0.105)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, hitY + 12); ctx.stroke();
      }
    }

    const beat = 60000 / gameSession.track.bpm;
    const nowMs = Math.max(0, elapsed);
    const firstBeat = Math.ceil((nowMs - (gameSession.track.phaseSec || 0) * 1000) / beat);
    for (let index = firstBeat; index <= firstBeat + Math.ceil(approach / beat) + 1; index++) {
      const target = ((gameSession.track.phaseSec || 0) * 1000) + index * beat;
      const ahead = target - elapsed;
      if (ahead < 0 || ahead > approach) continue;
      const y = hitY - (ahead / approach) * (hitY - 28);
      ctx.strokeStyle = index % 4 === 0 ? "rgba(214,221,242,0.12)" : "rgba(214,221,242,0.055)";
      ctx.lineWidth = index % 4 === 0 ? 1 : .7;
      ctx.beginPath(); ctx.moveTo(laneLeft, y); ctx.lineTo(laneLeft + laneWidth * 4, y); ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 17;
    ctx.shadowColor = "rgba(255,80,103,.45)";
    ctx.strokeStyle = "rgba(255,119,137,.74)";
    ctx.lineWidth = 1.35;
    ctx.beginPath(); ctx.moveTo(laneLeft - 8, hitY); ctx.lineTo(laneLeft + laneWidth * 4 + 8, hitY); ctx.stroke();
    ctx.restore();

    for (let lane = 0; lane < 4; lane++) {
      const x = laneLeft + lane * laneWidth + 9;
      const w = laneWidth - 18;
      const flash = performance.now() - gameSession.hitFlash[lane];
      const alpha = flash >= 0 && flash < 170 ? (1 - flash / 170) * .26 : 0;
      roundedRect(ctx, x, hitY - 7, w, 15, 4);
      ctx.fillStyle = LANES[lane];
      ctx.globalAlpha = .07 + alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = LANES[lane];
      ctx.globalAlpha = .43 + alpha * 1.3;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const topLimit = elapsed - approach;
    while (gameSession.nextEvent < gameSession.events.length && gameSession.events[gameSession.nextEvent].timeMs < topLimit) gameSession.nextEvent++;
    const firstVisible = Math.max(0, gameSession.nextEvent - 1);
    const lastVisible = Math.min(gameSession.events.length - 1, firstVisible + 96);
    for (let index = firstVisible; index <= lastVisible; index++) {
      const note = gameSession.events[index];
      if (note.status !== "pending") continue;
      const ahead = note.timeMs - elapsed;
      if (ahead < -GOOD_MS || ahead > approach) continue;
      const progress = Math.max(0, Math.min(1, ahead / approach));
      const y = hitY - progress * (hitY - 28);
      const x = laneLeft + note.lane * laneWidth + 10;
      const w = laneWidth - 20;
      const noteHeight = Math.max(12, Math.min(18, laneWidth * .12));
      ctx.save();
      ctx.shadowColor = LANES[note.lane];
      ctx.shadowBlur = 11 + note.accent * 5;
      roundedRect(ctx, x, y - noteHeight / 2, w, noteHeight, 4);
      const noteGradient = ctx.createLinearGradient(x, y - noteHeight / 2, x + w, y + noteHeight / 2);
      noteGradient.addColorStop(0, "rgba(255,255,255,.93)");
      noteGradient.addColorStop(.22, LANES[note.lane]);
      noteGradient.addColorStop(1, LANES[note.lane]);
      ctx.fillStyle = noteGradient;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = .08;
    ctx.fillStyle = "#dce1f1";
    for (let i = 0; i < 32; i++) {
      const x = (i * 97.31 + (elapsed * 0.008) % Math.max(1, width)) % width;
      const y = (i * 53.17 + (i % 3) * 31) % Math.max(1, hitY);
      ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, 1);
    }
    ctx.restore();
  }

  function gameLoop() {
    if (!gameSession || gameStatus === "idle" || gameStatus === "results") return;
    if (gameStatus !== "paused") {
      const elapsed = (audioContext.currentTime - gameSession.startAt) * 1000;
      gameSession.elapsedMs = elapsed;
      if (elapsed < 0) {
        gameStatus = "countin";
        elements.countIn.hidden = false;
        elements.countInNumber.textContent = String(Math.max(1, Math.ceil(-elapsed / 1000)));
      } else {
        gameStatus = "playing";
        elements.countIn.hidden = true;
        const durationMs = gameSession.track.buffer.duration * 1000;
        while (gameSession.nextEvent < gameSession.events.length) {
          const note = gameSession.events[gameSession.nextEvent];
          if (note.status !== "pending") { gameSession.nextEvent++; continue; }
          if (elapsed <= note.timeMs + GOOD_MS) break;
          markMiss(note);
          gameSession.nextEvent++;
        }
        const progress = Math.min(100, Math.max(0, elapsed / durationMs * 100));
        elements.progressFill.style.width = `${progress}%`;
        elements.progress.setAttribute("aria-valuenow", String(Math.round(progress)));
        elements.gameTime.textContent = formatTime(elapsed / 1000);
        elements.gameElapsed.textContent = `${formatTime(elapsed / 1000)} / ${formatTime(gameSession.track.buffer.duration)}`;
        setGameHud();
        if (elapsed >= durationMs + 80) {
          finishGame();
          return;
        }
      }
    }
    drawGame();
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function setJudgement(key, style) {
    window.clearTimeout(judgeTimer);
    elements.judgement.textContent = tr(key);
    elements.judgement.className = `judgement show ${style}`;
    judgeTimer = window.setTimeout(() => { elements.judgement.className = "judgement"; }, 390);
  }

  function markMiss(note) {
    if (note.status !== "pending") return;
    note.status = "miss";
    gameSession.judged++;
    gameSession.combo = 0;
    setJudgement("judgeMiss", "miss");
  }

  function hitLane(lane) {
    if (!gameSession || gameStatus !== "playing") return;
    const elapsed = (audioContext.currentTime - gameSession.startAt) * 1000;
    let best = null;
    let bestDistance = GOOD_MS + 1;
    for (let index = Math.max(0, gameSession.nextEvent - 8); index < gameSession.events.length; index++) {
      const note = gameSession.events[index];
      if (note.timeMs > elapsed + GOOD_MS) break;
      if (note.status !== "pending" || note.lane !== lane) continue;
      const distance = Math.abs(elapsed - note.timeMs);
      if (distance <= GOOD_MS && distance < bestDistance) { best = note; bestDistance = distance; }
    }
    if (!best) return;

    best.status = "hit";
    best.distanceMs = bestDistance;
    gameSession.judged++;
    gameSession.combo++;
    gameSession.maxCombo = Math.max(gameSession.maxCombo, gameSession.combo);
    gameSession.hitFlash[lane] = performance.now();
    let label;
    let points;
    let accuracyPoints;
    let style;
    if (bestDistance <= PERFECT_MS) { label = "judgePerfect"; points = 1000; accuracyPoints = 1; style = "perfect"; }
    else if (bestDistance <= GREAT_MS) { label = "judgeGreat"; points = 750; accuracyPoints = .8; style = "great"; }
    else { label = "judgeGood"; points = 500; accuracyPoints = .5; style = "good"; }
    gameSession.score += points + Math.min(gameSession.combo, 50) * 5;
    gameSession.accuracyPoints += accuracyPoints;
    setJudgement(label, style);
    setGameHud();
  }

  async function togglePause() {
    if (!gameSession || gameStatus === "results" || gameStatus === "idle") return;
    if (gameStatus === "paused") {
      try { await audioContext.resume(); } catch { /* context may already be active */ }
      gameStatus = gameSession.elapsedMs < 0 ? "countin" : "playing";
      elements.pauseOverlay.hidden = true;
      updatePauseLabel();
      return;
    }
    try { await audioContext.suspend(); } catch { /* keep the UI usable if suspension is unavailable */ }
    gameStatus = "paused";
    elements.pauseOverlay.hidden = false;
    elements.countIn.hidden = true;
    updatePauseLabel();
  }

  function finishGame() {
    if (!gameSession || gameStatus === "results" || gameStatus === "idle") return;
    gameStatus = "results";
    gameSession.ended = true;
    for (const note of gameSession.events) if (note.status === "pending") markMiss(note);
    const accuracy = gameSession.events.length ? gameSession.accuracyPoints / gameSession.events.length * 100 : 0;
    const grade = accuracy >= 98 ? "S" : accuracy >= 90 ? "A" : accuracy >= 78 ? "B" : accuracy >= 60 ? "C" : "D";
    elements.resultGrade.textContent = tr(`resultGrade${grade}`);
    elements.resultScore.textContent = formatScore(gameSession.score);
    elements.resultAccuracy.textContent = `${accuracy.toFixed(2)}%`;
    elements.resultCombo.textContent = String(gameSession.maxCombo);
    elements.resultTrackName.textContent = gameSession.track.title;
    elements.progressFill.style.width = "100%";
    elements.progress.setAttribute("aria-valuenow", "100");
    elements.gameElapsed.textContent = `${formatTime(gameSession.track.buffer.duration)} / ${formatTime(gameSession.track.buffer.duration)}`;
    elements.resultOverlay.hidden = false;
    elements.pauseOverlay.hidden = true;
    elements.countIn.hidden = true;
    updatePauseLabel();
    setGameHud();
    drawGame();
  }

  function closeGame() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (gameSession && gameSession.source) {
      gameSession.source.onended = null;
      try { gameSession.source.stop(); } catch { /* source may already have ended */ }
    }
    gameSession = null;
    gameStatus = "idle";
    elements.game.hidden = true;
    elements.game.setAttribute("aria-hidden", "true");
    elements.pauseOverlay.hidden = true;
    elements.resultOverlay.hidden = true;
    elements.countIn.hidden = true;
    document.body.style.overflow = previousBodyOverflow;
    updatePauseLabel();
  }

  function bindEvents() {
    elements.language.addEventListener("change", event => updateLocale(event.target.value));
    elements.difficulty.addEventListener("change", () => { if (activeTrack) updateLoadedTrack(); });
    elements.chooseFile.addEventListener("click", () => elements.fileInput.click());
    elements.fileInput.addEventListener("change", event => {
      const file = event.target.files && event.target.files[0];
      event.target.value = "";
      loadAudioFile(file);
    });
    elements.dropZone.addEventListener("dragenter", event => { event.preventDefault(); elements.dropZone.classList.add("drag-over"); });
    elements.dropZone.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; elements.dropZone.classList.add("drag-over"); });
    elements.dropZone.addEventListener("dragleave", event => {
      if (!elements.dropZone.contains(event.relatedTarget)) elements.dropZone.classList.remove("drag-over");
    });
    elements.dropZone.addEventListener("drop", event => {
      event.preventDefault();
      elements.dropZone.classList.remove("drag-over");
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) loadAudioFile(file);
    });
    elements.playDemo.addEventListener("click", playDemo);
    elements.playLoaded.addEventListener("click", async () => {
      if (!activeTrack) return;
      try { lastPlayedTrack = activeTrack; await startGame(activeTrack); }
      catch (error) { showToast(error.message === "audio-unavailable" ? tr("audioUnavailable") : tr("chartError")); }
    });
    elements.clearLoaded.addEventListener("click", () => {
      loadToken++;
      activeTrack = null;
      elements.loadedPanel.hidden = true;
      elements.playDemo.disabled = false;
      elements.playLoaded.disabled = false;
      hideLoadStatus();
    });
    elements.pause.addEventListener("click", togglePause);
    $("#resume-game").addEventListener("click", togglePause);
    $("#exit-game").addEventListener("click", closeGame);
    $("#play-again").addEventListener("click", async () => {
      const track = lastPlayedTrack;
      closeGame();
      if (track) {
        try { await startGame(track); }
        catch { showToast(tr("chartError")); }
      }
    });
    $("#back-home").addEventListener("click", closeGame);

    elements.touchKeys.forEach(button => {
      const lane = Number(button.dataset.lane);
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.classList.add("pressed");
        hitLane(lane);
      });
      const release = () => button.classList.remove("pressed");
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    elements.canvas.addEventListener("pointerdown", event => {
      if (!gameSession || gameStatus !== "playing" || event.pointerType === "mouse") return;
      const rect = elements.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const lane = Math.floor((x - canvasSize.laneLeft) / canvasSize.laneWidth);
      if (lane >= 0 && lane < 4) { event.preventDefault(); hitLane(lane); }
    });

    document.addEventListener("keydown", event => {
      if (gameStatus === "idle") return;
      if (event.code === "Escape") {
        event.preventDefault();
        if (gameStatus === "results") closeGame();
        else togglePause();
        return;
      }
      const lane = KEY_LANES[event.code];
      if (lane !== undefined) { event.preventDefault(); hitLane(lane); }
    });

    window.addEventListener("resize", () => { if (!elements.game.hidden) { sizeCanvas(); drawGame(); } });
    window.addEventListener("orientationchange", () => window.setTimeout(() => { if (!elements.game.hidden) sizeCanvas(); }, 140));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && gameStatus === "playing") togglePause();
    });
  }

  function start() {
    locale = chooseInitialLocale();
    applyTranslations();
    bindEvents();
    $("#year").textContent = String(new Date().getFullYear());
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => { /* the game works without offline caching */ });
    }
  }

  start();
})();
