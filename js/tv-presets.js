// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! tv-presets.js — 📺 映像フィルターのプリセット（20+種類）
   ・各プリセットは CSS filter 文字列と、任意の overlay タイプを持つ
   ・overlay は tv-dock.js が render で描画する（scanlines, letterbox, vhs など）
   ・形式は fx-presets と似せるが、独立（映像は記録に影響しない）
   読み込み順：data.js → tv-presets.js → core.js の後で tv-dock が包む
   ========================================================================== */
"use strict";

const TRK_TV_PRESETS = [
  // basic
  {
    id:"skin",
    cat:"basic",
    label:{ja:"スキン標準", en:"Skin default", zh:"皮肤默认", ko:"스킨 기본"},
    desc:{ja:"スキンが決めた色味", en:"Uses the skin's color", zh:"使用皮肤配色", ko:"스킨 색감 사용"},
    filter:null
  },
  {
    id:"color",
    cat:"basic",
    label:{ja:"オリジナル（カラー）", en:"Original color", zh:"原色", ko:"원본 컬러"},
    desc:{ja:"そのままの色", en:"No filter", zh:"无滤镜", ko:"필터 없음"},
    filter:"none"
  },
  {
    id:"mono",
    cat:"basic",
    label:{ja:"モノクロ", en:"Monochrome", zh:"黑白", ko:"흑백"},
    desc:{ja:"白黒", en:"Black & white", zh:"黑白", ko:"흑백"},
    filter:"grayscale(1) contrast(1.6)"
  },
  {
    id:"dim",
    cat:"basic",
    label:{ja:"暗め", en:"Dimmed", zh:"调暗", ko:"어둡게"},
    desc:{ja:"少し暗く", en:"Slightly dim", zh:"稍暗", ko:"조금 어둡게"},
    filter:"brightness(.42) saturate(.85)"
  },
  {
    id:"off",
    cat:"basic",
    label:{ja:"非表示", en:"Off", zh:"隐藏", ko:"숨기기"},
    desc:{ja:"映像を消す", en:"Hide video", zh:"隐藏视频", ko:"영상 숨기기"},
    filter:"none",
    off:true
  },
  // vivid / pop
  {
    id:"vivid",
    cat:"vivid",
    label:{ja:"ビビッド", en:"Vivid", zh:"鲜艳", ko:"비비드"},
    desc:{ja:"色鮮やか", en:"High saturation", zh:"高饱和", ko:"선명한 색"},
    filter:"saturate(1.9) brightness(1.08) contrast(1.18)"
  },
  {
    id:"pop",
    cat:"vivid",
    label:{ja:"ポップ", en:"Pop", zh:"波普", ko:"팝"},
    desc:{ja:"はじける色", en:"Pop colors", zh:"跳跃色彩", ko:"톡톡 튀는 색"},
    filter:"saturate(2.2) contrast(1.15) brightness(1.06) hue-rotate(-4deg)"
  },
  {
    id:"pastel",
    cat:"vivid",
    label:{ja:"パステル", en:"Pastel", zh:"粉彩", ko:"파스텔"},
    desc:{ja:"やわらかく淡い", en:"Soft pastel", zh:"柔和粉彩", ko:"부드러운 파스텔"},
    filter:"saturate(.88) brightness(1.14) contrast(.92) sepia(.12) hue-rotate(-6deg)"
  },
  // retro
  {
    id:"warm",
    cat:"retro",
    label:{ja:"暖色", en:"Warm", zh:"暖色", ko:"따뜻한 톤"},
    desc:{ja:"夕日のような暖かさ", en:"Sunset warmth", zh:"夕阳暖调", ko:"노을처럼 따뜻하게"},
    filter:"sepia(.45) saturate(1.35) brightness(.92) hue-rotate(-12deg) contrast(1.05)"
  },
  {
    id:"cool",
    cat:"retro",
    label:{ja:"寒色", en:"Cool", zh:"冷色", ko:"차가운 톤"},
    desc:{ja:"ひんやりクール", en:"Cool blue", zh:"冷调", ko:"차가운 블루"},
    filter:"grayscale(.35) hue-rotate(180deg) saturate(1.5) brightness(.9) contrast(1.1)"
  },
  {
    id:"vintage",
    cat:"retro",
    label:{ja:"ビンテージ", en:"Vintage", zh:"复古", ko:"빈티지"},
    desc:{ja:"古い写真のように", en:"Old photo", zh:"旧照片", ko:"오래된 사진처럼"},
    filter:"sepia(.85) contrast(1.18) brightness(.88) saturate(.72) hue-rotate(-8deg)",
    overlay:"vignette"
  },
  {
    id:"film",
    cat:"retro",
    label:{ja:"フィルム", en:"Film", zh:"胶片", ko:"필름"},
    desc:{ja:"映画フィルム風", en:"Film stock", zh:"胶片质感", ko:"영화 필름 느낌"},
    filter:"sepia(.32) contrast(1.28) brightness(.9) saturate(.82) hue-rotate(-4deg)",
    overlay:"grain"
  },
  {
    id:"crt",
    cat:"retro",
    label:{ja:"ブラウン管", en:"CRT", zh:"显像管", ko:"브라운관"},
    desc:{ja:"レトロなブラウン管テレビ", en:"Retro CRT TV", zh:"复古显像管", ko:"레트로 CRT"},
    filter:"contrast(1.38) brightness(.92) saturate(1.12) sepia(.14) hue-rotate(-2deg)",
    overlay:"crt"
  },
  {
    id:"vhs",
    cat:"retro",
    label:{ja:"VHS", en:"VHS", zh:"录像带", ko:"VHS"},
    desc:{ja:"VHSのノイズとにじみ", en:"VHS tracking noise", zh:"录像带噪点", ko:"VHS 노이즈"},
    filter:"contrast(1.12) saturate(1.38) hue-rotate(-7deg) brightness(1.04) sepia(.08)",
    overlay:"vhs"
  },
  // cinema
  {
    id:"cinema",
    cat:"cinema",
    label:{ja:"シネマ", en:"Cinema", zh:"影院", ko:"시네마"},
    desc:{ja:"映画館のようなコントラスト", en:"Cinematic contrast", zh:"电影感对比", ko:"영화관 같은 대비"},
    filter:"contrast(1.35) brightness(.92) sepia(.22) saturate(1.22) hue-rotate(-3deg)",
    overlay:"letterbox"
  },
  {
    id:"cinemascope",
    cat:"cinema",
    label:{ja:"シネスコ", en:"Cinemascope", zh:"宽银幕", ko:"시네마스코프"},
    desc:{ja:"上下に黒帯・横長映画", en:"Letterbox scope", zh:"宽银幕黑边", ko:"상하 레터박스"},
    filter:"contrast(1.3) brightness(.9) saturate(1.15)",
    overlay:"scope"
  },
  {
    id:"noir",
    cat:"cinema",
    label:{ja:"ノワール", en:"Noir", zh:"黑色电影", ko:"누아르"},
    desc:{ja:"ハイコントラスト白黒", en:"High contrast B&W", zh:"高对比黑白", ko:"하이 콘트라스트 흑백"},
    filter:"grayscale(1) contrast(1.75) brightness(.86)",
    overlay:"vignette"
  },
  {
    id:"news",
    cat:"cinema",
    label:{ja:"ニュース", en:"News", zh:"新闻", ko:"뉴스"},
    desc:{ja:"TVニュース風・くっきり", en:"Broadcast news", zh:"电视新闻风", ko:"TV 뉴스 느낌"},
    filter:"contrast(1.22) saturate(1.12) brightness(1.06) sepia(.04)"
  },
  {
    id:"commercial",
    cat:"cinema",
    label:{ja:"CM", en:"Commercial", zh:"广告", ko:"CF"},
    desc:{ja:"CMのような高彩度・明るめ", en:"Bright commercial", zh:"广告般明亮高饱和", ko:"광고처럼 밝고 선명하게"},
    filter:"saturate(1.65) contrast(1.08) brightness(1.12) hue-rotate(2deg)"
  },
  // effect
  {
    id:"night",
    cat:"effect",
    label:{ja:"ナイト", en:"Night", zh:"夜景", ko:"나이트"},
    desc:{ja:"夜・ネオン街", en:"Night city", zh:"夜景霓虹", ko:"밤 거리"},
    filter:"brightness(.56) contrast(1.32) saturate(.78) hue-rotate(210deg) sepia(.18)",
    overlay:"vignette"
  },
  {
    id:"security",
    cat:"effect",
    label:{ja:"監視カメラ", en:"Security cam", zh:"监控", ko:"보안 카메라"},
    desc:{ja:"監視カメラ風・緑がかった", en:"CCTV greenish", zh:"监控摄像头风", ko:"CCTV 느낌"},
    filter:"sepia(.18) hue-rotate(75deg) saturate(1.25) contrast(1.25) brightness(.88) grayscale(.18)",
    overlay:"scan"
  },
  {
    id:"dream",
    cat:"effect",
    label:{ja:"ドリーム", en:"Dream", zh:"梦幻", ko:"드림"},
    desc:{ja:"ふわっと明るい夢の中", en:"Soft dreamy glow", zh:"柔和梦幻", ko:"몽환적인 꿈속"},
    filter:"brightness(1.18) saturate(1.18) contrast(.92) sepia(.08) hue-rotate(-4deg)",
    overlay:"bloom"
  },
  {
    id:"faded",
    cat:"effect",
    label:{ja:"フェード", en:"Faded", zh:"褪色", ko:"페이디드"},
    desc:{ja:"色あせた記憶", en:"Faded memory", zh:"褪色记忆", ko:"바랜 기억"},
    filter:"saturate(.55) brightness(1.08) contrast(.92) sepia(.18)"
  },
  {
    id:"poster",
    cat:"effect",
    label:{ja:"ポスター", en:"Poster", zh:"海报", ko:"포스터"},
    desc:{ja:"コントラスト強め・ポスター風", en:"Posterized high contrast", zh:"海报风高对比", ko:"포스터 같은 강한 대비"},
    filter:"contrast(1.55) saturate(1.9) brightness(1.02)"
  },
  {
    id:"soft",
    cat:"effect",
    label:{ja:"ソフト", en:"Soft", zh:"柔焦", ko:"소프트"},
    desc:{ja:"やわらかくぼかしたような", en:"Soft focus", zh:"柔焦", ko:"부드러운 포커스"},
    filter:"brightness(1.06) contrast(.94) saturate(.92) sepia(.06)",
    overlay:"soft"
  },
  // ===== 追加：人が思いつかなそうな面白いフィルター20種 =====
  {
    id:"underwater",
    cat:"weird",
    label:{ja:"🌊 水中", en:"🌊 Underwater", zh:"🌊 水下", ko:"🌊 수중"},
    desc:{ja:"水の中から見たような青く揺らぐ", en:"Blue wobble as if underwater", zh:"水下摇晃的蓝色", ko:"물속에서 보는 듯한 푸른 흔들림"},
    filter:"hue-rotate(190deg) saturate(1.4) brightness(.85) contrast(1.2) sepia(.2)",
    overlay:"bloom"
  },
  {
    id:"thermal",
    cat:"weird",
    label:{ja:"🌡️ サーモグラフィ", en:"🌡️ Thermal", zh:"🌡️ 热成像", ko:"🌡️ 열화상"},
    desc:{ja:"温度で色が変わるサーモカメラ", en:"Thermal camera heat map", zh:"热成像仪", ko:"온도에 따라 색이 변하는 열화상"},
    filter:"hue-rotate(280deg) saturate(3) contrast(1.6) brightness(.9) invert(.1)",
    overlay:"scan"
  },
  {
    id:"xray",
    cat:"weird",
    label:{ja:"🦴 レントゲン", en:"🦴 X-Ray", zh:"🦴 X光", ko:"🦴 엑스레이"},
    desc:{ja:"骨が透けるレントゲン風", en:"X-ray see-through", zh:"X光透视", ko:"뼈가 비치는 엑스레이"},
    filter:"grayscale(1) invert(1) contrast(1.8) brightness(1.1)",
    overlay:"vignette"
  },
  {
    id:"nightvision",
    cat:"weird",
    label:{ja:"🔭 暗視ゴーグル", en:"🔭 Night vision", zh:"🔭 夜视仪", ko:"🔭 야간 투시경"},
    desc:{ja:"緑一色の暗視ゴーグル", en:"Green night vision goggles", zh:"绿色夜视仪", ko:"녹색 야간 투시경"},
    filter:"sepia(1) hue-rotate(60deg) saturate(2.5) contrast(1.4) brightness(.9)",
    overlay:"scan"
  },
  {
    id:"gameboy",
    cat:"weird",
    label:{ja:"👾 ゲームボーイ", en:"👾 GameBoy", zh:"👾 掌机", ko:"👾 게임보이"},
    desc:{ja:"4階調の緑・ドット感", en:"4-shade green dot matrix", zh:"四阶绿点阵", ko:"4계조 녹색 도트"},
    filter:"sepia(.8) hue-rotate(60deg) saturate(1.8) contrast(1.5) brightness(.9) grayscale(.2)",
    overlay:"crt"
  },
  {
    id:"dot",
    cat:"weird",
    label:{ja:"🔳 ドット絵", en:"🔳 Dot matrix", zh:"🔳 点阵", ko:"🔳 도트"},
    desc:{ja:"粗いドット絵・8bit風", en:"Coarse 8-bit pixels", zh:"粗糙8位像素", ko:"거친 8비트 도트"},
    filter:"contrast(1.6) saturate(1.8) brightness(1.05)",
    overlay:"scan"
  },
  {
    id:"newspaper",
    cat:"weird",
    label:{ja:"📰 新聞", en:"📰 Newspaper", zh:"📰 报纸", ko:"📰 신문"},
    desc:{ja:"白黒の新聞ハーフトーン", en:"B&W halftone newspaper", zh:"黑白报纸半调", ko:"흑백 신문 하프톤"},
    filter:"grayscale(1) contrast(1.9) brightness(1.15)",
    overlay:"grain"
  },
  {
    id:"blueprint",
    cat:"weird",
    label:{ja:"📐 青焼き", en:"📐 Blueprint", zh:"📐 蓝图", ko:"📐 청사진"},
    desc:{ja:"青い設計図のような反転", en:"Inverted blueprint cyan", zh:"蓝色蓝图反转", ko:"파란 설계도 반전"},
    filter:"invert(1) sepia(1) hue-rotate(180deg) saturate(2) contrast(1.3) brightness(.9)",
    overlay:"grid"
  },
  {
    id:"comic",
    cat:"weird",
    label:{ja:"💥 アメコミ", en:"💥 Comic", zh:"💥 美漫", ko:"💥 코믹"},
    desc:{ja:"はっきりした線とベタ塗り・漫画", en:"Bold lines flat colors comic", zh:"粗线平涂漫画", ko:"굵은 선과 단색 만화"},
    filter:"contrast(1.9) saturate(2.2) brightness(1.08) sepia(.08)",
    overlay:"bloom"
  },
  {
    id:"invert",
    cat:"weird",
    label:{ja:"🎞 ネガフィルム", en:"🎞 Negative", zh:"🎞 负片", ko:"🎞 네거티브"},
    desc:{ja:"色が反転したネガ", en:"Inverted negative film", zh:"反色负片", ko:"색이 반전된 네거"},
    filter:"invert(1) hue-rotate(180deg)",
    overlay:"vignette"
  },
  {
    id:"acid",
    cat:"weird",
    label:{ja:"🌈 アシッド", en:"🌈 Acid", zh:"🌈 迷幻", ko:"🌈 애시드"},
    desc:{ja:"色がぐるぐる変わるサイケ", en:"Psychedelic hue swirl", zh:"迷幻色相旋转", ko:"색이 빙빙 도는 사이키"},
    filter:"hue-rotate(90deg) saturate(3) contrast(1.4) brightness(1.1)",
    overlay:"bloom"
  },
  {
    id:"vaporwave",
    cat:"weird",
    label:{ja:"🌸 ヴェイパーウェイブ", en:"🌸 Vaporwave", zh:"🌸 蒸汽波", ko:"🌸 베이퍼웨이브"},
    desc:{ja:"ピンクと水色の80s夢", en:"Pink cyan 80s dream", zh:"粉蓝80年代梦", ko:"핑크와 하늘색 80년대 꿈"},
    filter:"hue-rotate(300deg) saturate(1.6) brightness(1.12) contrast(1.05) sepia(.15)",
    overlay:"soft"
  },
  {
    id:"cyberpunk",
    cat:"weird",
    label:{ja:"🌃 サイバーパンク", en:"🌃 Cyberpunk", zh:"🌃 赛博朋克", ko:"🌃 사이버펑크"},
    desc:{ja:"ネオン街・紫と青の夜", en:"Neon street purple blue night", zh:"霓虹街紫蓝夜", ko:"네온 거리 보라 파랑 밤"},
    filter:"hue-rotate(260deg) saturate(1.9) contrast(1.35) brightness(.88)",
    overlay:"vignette"
  },
  {
    id:"matrix",
    cat:"weird",
    label:{ja:"💻 マトリックス", en:"💻 Matrix", zh:"💻 黑客帝国", ko:"💻 매트릭스"},
    desc:{ja:"緑のコードが流れる", en:"Green code rain", zh:"绿色代码雨", ko:"녹색 코드가 흐르는"},
    filter:"sepia(1) hue-rotate(70deg) saturate(2.8) contrast(1.3) brightness(.85)",
    overlay:"scan"
  },
  {
    id:"sunset",
    cat:"nature",
    label:{ja:"🌅 夕焼け", en:"🌅 Sunset", zh:"🌅 日落", ko:"🌅 노을"},
    desc:{ja:"オレンジに染まる夕日", en:"Orange dyed sunset", zh:"橙色夕阳", ko:"주황으로 물든 석양"},
    filter:"sepia(.6) saturate(1.6) hue-rotate(-20deg) brightness(.95) contrast(1.15)",
    overlay:"bloom"
  },
  {
    id:"moonlight",
    cat:"nature",
    label:{ja:"🌙 月光", en:"🌙 Moonlight", zh:"🌙 月光", ko:"🌙 달빛"},
    desc:{ja:"青白い月明かり", en:"Bluish moonlight", zh:"青白月光", ko:"푸르스름한 달빛"},
    filter:"grayscale(.5) hue-rotate(200deg) saturate(.6) brightness(.8) contrast(1.2) sepia(.2)",
    overlay:"vignette"
  },
  {
    id:"aurora",
    cat:"nature",
    label:{ja:"✨ オーロラ", en:"✨ Aurora", zh:"✨ 极光", ko:"✨ 오로라"},
    desc:{ja:"緑と紫が揺らめく空", en:"Green purple shimmering sky", zh:"绿紫闪烁天空", ko:"초록 보라가 아른거리는 하늘"},
    filter:"hue-rotate(120deg) saturate(1.7) brightness(1.05) contrast(1.1) sepia(.1)",
    overlay:"bloom"
  },
  {
    id:"lava",
    cat:"nature",
    label:{ja:"🌋 溶岩", en:"🌋 Lava", zh:"🌋 熔岩", ko:"🌋 용암"},
    desc:{ja:"赤く燃える溶岩", en:"Red burning lava", zh:"红色燃烧熔岩", ko:"붉게 타오르는 용암"},
    filter:"sepia(.8) hue-rotate(-30deg) saturate(2.2) contrast(1.4) brightness(.9)",
    overlay:"vignette"
  },
  {
    id:"ice",
    cat:"nature",
    label:{ja:"🧊 氷", en:"🧊 Ice", zh:"🧊 冰", ko:"🧊 얼음"},
    desc:{ja:"キンと冷えた氷の世界", en:"Freezing ice world", zh:"冰冻世界", ko:"꽁꽁 언 얼음 세계"},
    filter:"hue-rotate(180deg) saturate(.7) brightness(1.15) contrast(1.1) sepia(.1)",
    overlay:"soft"
  },
  {
    id:"kaleido",
    cat:"weird",
    label:{ja:"🔮 万華鏡", en:"🔮 Kaleidoscope", zh:"🔮 万花筒", ko:"🔮 만화경"},
    desc:{ja:"色がくるくる変わる万華鏡", en:"Color swirling kaleidoscope", zh:"色彩旋转万花筒", ko:"색이 빙글빙글 만화경"},
    filter:"hue-rotate(90deg) saturate(2.5) contrast(1.3) brightness(1.1)",
    overlay:"bloom"
  }
];
/* ✅ tv-presets.js 完了 */
