// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! mmd.js — 🩷 MMDマスコット（PMX/PMD モデル ＋ VMD モーション）
   ・Lat式ミク・タワシ式CHAN×CO など、MMDのモデルを「自分の端末から」読み込んで動かせます。
     モデルは同梱しません（配布元の規約にしたがって、各自が用意してください）。
   ・3Dの部品（three.js / @yohawing/three-mmd-loader）は、MMDを初めて使うときだけ
     index.html の importmap から読み込みます（CDN。オフラインでは使えません）。
   ・モーションは2つの道：
     ① 自分で用意した .vmd を読み込む（配布元の規約を確認してから）
     ② 内蔵モーション（このファイルがコードで VMD を組み立てます＝自作なので権利は trk! のもの）
   ・物理（髪・スカートの揺れ）は、ライブラリの対応範囲ですが、いまはオフ（軽さ優先）。
   読み込み順：… → vrm.js → mmd.js（どちらも遅延読み込みの3D）   ※ vrm.js とは独立しています。
   ========================================================================== */
"use strict";
(() => {
const MB = 1048576, MAX_PMX = 120 * MB, MAX_VMD = 40 * MB, MAX_FILES = 400;
const MMD_LIB = "@yohawing/three-mmd-loader";
const mmdDB = idbStore("shadow_taiko_mmd", "files");     // 🆕 新しい保存先（既存のキーは変えません）

/* ============ 文章（接頭辞 mmd…） ============ */
Object.assign(TEXT.ja, {
  mmdTitle:"🩷 MMD（モデルは自分で用意）",
  mmdHint:"MMDのモデル（.pmx/.pmd）とモーション（.vmd）を読み込んで、ゲーム中に踊らせられます。モデルは「持ち込み」が基本です（下に💠同梱モデルのボタンがあるときは、それだけで始められます）。持ち込むときは配布元の規約（商用不可・再配布不可など）を守って、自分で用意してください。",
  mmdPresetBtn:"💠 {name} をマスコットにする（同梱）",
  mmdPresetHint:"💠 は、この trk! に「れあどめ」（配布元の規約）ごと同梱されているモデルです。規約（PCL＝非営利など）の範囲で楽しんでください。クレジットは自動で入ります。",
  mmdPresetMissing:"同梱モデルのファイルが見つかりませんでした（この配布には入っていないようです）。",
  mmdAgree:"配布元の規約を確認し、自分で用意したモデルを使います（三次配布・商用利用はしません）",
  mmdChooseModel:"📦 モデル（.pmx/.pmd）", mmdChooseFolder:"📁 モデルのフォルダ（テクスチャも一緒に）",
  mmdChooseMotion:"🎬 モーション（.vmd）", mmdClearModel:"モデルを外す", mmdClearMotion:"モーションを外す",
  mmdRemember:"読み込んだモデル・モーションを、この端末に保存する（IndexedDB）",
  mmdModelHead:"モデル", mmdMotionHead:"モーション", mmdFitHead:"大きさ・向き",
  mmdSize:"大きさ", mmdTurn:"向き（左右）", mmdCreditLabel:"クレジット表示（作者名など）", mmdCreditPlaceholder:"例：Lat式ミク / Lat",
  mmdCheck:"🔎 動作チェック（実機で）", mmdCopy:"📋 結果をコピー", mmdCopied:"📋 コピーしました", mmdCopyNg:"📋 コピーできませんでした（下の行を選んでコピーしてください）",
  mmdCheckHint:"うまく動かないときは、これを押すと WebGL・CDN（three／three-mmd-loader）・モデル・モーションの状態を調べて1か所に出します。うまくいかない場合は、この結果を貼ってもらえれば原因を切り分けられます。",
  mmdCheckRunning:"チェック中…（初回はCDNから読み込むので、少し待ちます）", mmdCheckOk:"✅ チェックOK（WebGL・CDN・ライブラリ）", mmdCheckNg:"❌ チェックで問題が見つかりました（下の結果を見てください）",
  mmdMotionNone:"（モーションなし）",
  mmdMotionAuto:"🎲 おまかせ（曲のBPMにいちばん近い🎵を自動で。設定しなおし不要）",
  mmdMotionWatch:"👀 みてる（こちらをじっと・BPM非依存）", mmdMotionStroll:"👀 たたずむ（見まわす・BPM非依存）",
  mmdMotionStep:"内蔵① ステップ（120BPM）", mmdMotionSwing:"内蔵② ゆらゆら（100BPM）", mmdMotionTurn:"内蔵③ ターン（120BPM）",
  mmdMotionJump:"内蔵④ ジャンプ（130BPM・はで）", mmdMotionIdol:"内蔵⑤ アイドル（128BPM）",
  mmdMotionAirgtr:"🎸128 エアギター（シューゲイザーむけ）", mmdMotionDreamy:"🎸128 しっとり（When You Sleepむけ）",
  mmdMotionKneel:"🎸128 かたひざ（しずかに眺める）",
  mmdMotionIevan:"🎵120 ネギスピン（Ievan Polkkaむけ）", mmdMotionKyukura:"🎵165 くらくら（きゅうくらりんむけ）",
  mmdMotionRabbit:"🎵173 うさみみ（ラビットホールむけ・5拍子スキップ）", mmdMotionMesmer:"🎵185 すましシャッフル（メズマライザーむけ）",
  mmdMotionDune:"🎵135 こうしん（砂の惑星むけ）", mmdMotionGreen:"🎵145 ペンライト（グリーンライツむけ）",
  mmdMotionMiku39:"🎵146 ねぎふり（みくみくむけ）", mmdMotionTyw:"🎵150 せかいへ（Tell Your Worldむけ）",
  mmdMotionSenbon:"🎵154 キレの和（千本桜むけ）", mmdMotionMelt:"🎵170 きゅん（メルトむけ）",
  mmdMotionUmg:"🎵170 つたえる（アンノウン・マザーグースむけ）", mmdMotionWedh:"🎵174 ダンスホール（ワールズエンドむけ）",
  mmdMotionRolling:"🎵194 ぐるぐる（ローリンガールむけ）", mmdMotionUraomote:"🎵196 うらおもて（裏表ラバーズむけ）",
  mmdMotionVanish:"🎵240 こうそく（消失むけ）",
  mmdBuiltinNote:"内蔵モーションは trk! がコードで作った VMD です（権利は trk! のもの）。🎵 は人気ミク曲のテンポに合わせた振り付け（曲名は目安です）。基準BPMが 0 のとき、内蔵モーションはそれぞれの基準BPMで曲に自動シンクします。",
  mmdBpm:"モーションの基準BPM（0＝内蔵は自動シンク・持ち込みVMDは固定）",
  mmdLoading:"モデルを読み込んでいます…", mmdLoadingPct:"モデルを読み込んでいます… {n}%",
  mmdLoaded:"モデル「{name}」を読み込みました。", mmdRestored:"前回のモデルを戻しました。",
  mmdNotMmd:"MMDのモデル（.pmx/.pmd）ではありません。", mmdTooBig:"大きすぎます（モデルは{n}MB、モーションは{m}MBまで）。",
  mmdNoModel:"先にモデルを読み込んでください。", mmdNetError:"3Dの部品（CDN）を読み込めませんでした。オンラインで開いて、もう一度試してください。",
  mmdNoWebGL:"WebGLを使えない環境です。", mmdLoadError:"モデルを読み込めませんでした。",
  mmdNoAgree:"先に、うえの「規約を確認しました」にチェックを入れてください。",
  mmdFilesEmpty:"モデルのファイルが入っていません。", mmdTooManyFiles:"ファイルが多すぎます（{n}個まで）。",
  mmdVmdLoaded:"モーション「{name}」を読み込みました。", mmdVmdBad:"VMD（モーション）ではありません／読み込めませんでした。",
  mmdSelected:"MMDのマスコットに切り替えました。", mmdSafe:"🛟 セーフモード中は、MMDの読み込み・復元をしません。",
  mmdSaveFail:"この端末に保存できませんでした（大きすぎる可能性があります）。",
  mmdCreditPrefix:"MMD:"
});
Object.assign(TEXT.en, {
  mmdTitle:"🩷 MMD (bring your own model)",
  mmdHint:"Load an MMD model (.pmx/.pmd) and motion (.vmd) and let it dance in-game. Bringing your own model is the default (when a 💠 bundled-model button appears below, that alone gets you started). If you bring one, follow the distributor's terms (usually non-commercial, no redistribution).",
  mmdPresetBtn:"💠 Use {name} as the mascot (bundled)",
  mmdPresetHint:"💠 is a model bundled with this trk! together with its original readme (the distributor's terms). Enjoy it within those terms (PCL: non-commercial etc.). The credit line is filled in automatically.",
  mmdPresetMissing:"Could not find the bundled model files (this copy may not include them).",
  mmdAgree:"I'll use a model I obtained myself, following its terms (no re-distribution, no commercial use)",
  mmdChooseModel:"📦 Model (.pmx/.pmd)", mmdChooseFolder:"📁 Model folder (with textures)",
  mmdChooseMotion:"🎬 Motion (.vmd)", mmdClearModel:"Remove model", mmdClearMotion:"Remove motion",
  mmdRemember:"Keep the loaded model and motion on this device (IndexedDB)",
  mmdModelHead:"Model", mmdMotionHead:"Motion", mmdFitHead:"Size and angle",
  mmdSize:"Size", mmdTurn:"Facing", mmdCreditLabel:"Credit line (author etc.)", mmdCreditPlaceholder:"e.g. Lat-style Miku / Lat",
  mmdCheck:"🔎 Check (on your device)", mmdCopy:"📋 Copy the result", mmdCopied:"📋 Copied", mmdCopyNg:"📋 Could not copy (select the lines below)",
  mmdCheckHint:"If something does not work, press this: it checks WebGL, the CDN (three / three-mmd-loader), your model and your motion, and prints one block. Paste that block and we can find the cause.",
  mmdCheckRunning:"Checking… (the first run loads from the CDN, so give it a moment)", mmdCheckOk:"✅ Check OK (WebGL, CDN, libraries)", mmdCheckNg:"❌ Something is wrong (see the lines below)",
  mmdMotionNone:"(no motion)",
  mmdMotionAuto:"🎲 Auto (pick the 🎵 nearest to the song's BPM — set once, works everywhere)",
  mmdMotionWatch:"👀 Watching you (BPM-free)", mmdMotionStroll:"👀 Standing by (looking around, BPM-free)",
  mmdMotionStep:"Built-in 1: Step (120 BPM)", mmdMotionSwing:"Built-in 2: Sway (100 BPM)", mmdMotionTurn:"Built-in 3: Turn (120 BPM)",
  mmdMotionJump:"Built-in 4: Jump (130 BPM, flashy)", mmdMotionIdol:"Built-in 5: Idol pump (128 BPM)",
  mmdMotionAirgtr:"🎸128 Air guitar (shoegaze)", mmdMotionDreamy:"🎸128 Dreamy drift (for When You Sleep)",
  mmdMotionKneel:"🎸128 One-knee gaze (quiet)",
  mmdMotionIevan:"🎵120 Leek spin (for Ievan Polkka)", mmdMotionKyukura:"🎵165 Dizzy puppet (for Kyu-kurarin)",
  mmdMotionRabbit:"🎵173 Bunny-ear hop (for Rabbit Hole, 5-beat skip)", mmdMotionMesmer:"🎵185 Cartoon shuffle (for Mesmerizer)",
  mmdMotionDune:"🎵135 March (for Sand Planet)", mmdMotionGreen:"🎵145 Penlight (for Greenlights Serenade)",
  mmdMotionMiku39:"🎵146 Leek wave (for Miku Miku ni…)", mmdMotionTyw:"🎵150 To the world (for Tell Your World)",
  mmdMotionSenbon:"🎵154 Sharp wa-style (for Senbonzakura)", mmdMotionMelt:"🎵170 Heart-flutter (for Melt)",
  mmdMotionUmg:"🎵170 Reaching out (for Unknown Mother Goose)", mmdMotionWedh:"🎵174 Dancehall (for World's End Dancehall)",
  mmdMotionRolling:"🎵194 Rolling (for Rolling Girl)", mmdMotionUraomote:"🎵196 Flip-flop (for Ura-Omote Lovers)",
  mmdMotionVanish:"🎵240 Hyper rush (for The Disappearance)",
  mmdBuiltinNote:"The built-in motions are VMD data generated by trk!'s own code. 🎵 ones are choreographed to the tempo of popular Miku songs (titles are a guide). When the base BPM is 0, built-in motions auto-sync to the song using their own base BPM.",
  mmdBpm:"Motion base BPM (0 = built-ins auto-sync; your own VMD stays fixed)",
  mmdLoading:"Loading the model…", mmdLoadingPct:"Loading the model… {n}%",
  mmdLoaded:"Loaded the model “{name}”.", mmdRestored:"Restored your previous model.",
  mmdNotMmd:"That is not an MMD model (.pmx/.pmd).", mmdTooBig:"Too big (models up to {n}MB, motions up to {m}MB).",
  mmdNoModel:"Load a model first.", mmdNetError:"Could not load the 3D parts (CDN). Open it online and try again.",
  mmdNoWebGL:"WebGL is not available here.", mmdLoadError:"Could not load the model.",
  mmdNoAgree:"Tick “I'll use a model I obtained myself” above first.",
  mmdFilesEmpty:"No files in that folder.", mmdTooManyFiles:"Too many files (up to {n}).",
  mmdVmdLoaded:"Loaded the motion “{name}”.", mmdVmdBad:"That is not a VMD motion, or it could not be read.",
  mmdSelected:"Switched to the MMD mascot.", mmdSafe:"🛟 Safe mode: MMD loading and restore are off.",
  mmdSaveFail:"Could not save on this device (it may be too big).",
  mmdCreditPrefix:"MMD:"
});
Object.assign(TEXT.zh, {
  mmdTitle:"🩷 MMD（模型请自己准备）",
  mmdHint:"可以读取MMD模型（.pmx/.pmd）和动作（.vmd），让其在游戏中跳舞。基本做法是自带模型（如果下面出现💠内置模型按钮，仅用它即可开始）。自带模型时请遵守发布方的规约（多为禁止商用、禁止再分发）。",
  mmdPresetBtn:"💠 使用 {name} 作为吉祥物（内置）",
  mmdPresetHint:"💠 是与原版「readme」（发布方规约）一同内置在本 trk! 中的模型。请在规约（PCL：非商用等）范围内使用。署名会自动填写。",
  mmdPresetMissing:"找不到内置模型的文件（此版本可能未附带）。",
  mmdAgree:"我会遵守发布方的规约，使用自己准备的模型（不再分发、不商用）",
  mmdChooseModel:"📦 模型（.pmx/.pmd）", mmdChooseFolder:"📁 模型文件夹（含贴图）",
  mmdChooseMotion:"🎬 动作（.vmd）", mmdClearModel:"移除模型", mmdClearMotion:"移除动作",
  mmdRemember:"把读取的模型和动作保存在本机（IndexedDB）",
  mmdModelHead:"模型", mmdMotionHead:"动作", mmdFitHead:"大小与朝向",
  mmdSize:"大小", mmdTurn:"朝向", mmdCreditLabel:"署名显示（作者等）", mmdCreditPlaceholder:"例：Lat式ミク / Lat",
  mmdCheck:"🔎 运行检查（在实机上）", mmdCopy:"📋 复制结果", mmdCopied:"📋 已复制", mmdCopyNg:"📋 无法复制（请选中下面的行）",
  mmdCheckHint:"如果无法运行，按这里会检查 WebGL、CDN（three／three-mmd-loader）、模型和动作，并把结果汇总成一段。把这结果贴出来就能定位原因。",
  mmdCheckRunning:"检查中…（初次会从 CDN 读取，请稍等）", mmdCheckOk:"✅ 检查通过（WebGL・CDN・库）", mmdCheckNg:"❌ 检查发现问题（请看下面的结果）",
  mmdMotionNone:"（无动作）",
  mmdMotionAuto:"🎲 自动（选择最接近歌曲BPM的🎵・设置一次即可）",
  mmdMotionWatch:"👀 看着你（与BPM无关）", mmdMotionStroll:"👀 伫立（四处张望・与BPM无关）",
  mmdMotionStep:"内置① 踏步（120BPM）", mmdMotionSwing:"内置② 摇摆（100BPM）", mmdMotionTurn:"内置③ 转身（120BPM）",
  mmdMotionJump:"内置④ 跳跃（130BPM・华丽）", mmdMotionIdol:"内置⑤ 偶像应援（128BPM）",
  mmdMotionAirgtr:"🎸128 空气吉他（Shoegaze风）", mmdMotionDreamy:"🎸128 沉静漂浮（When You Sleep风）",
  mmdMotionKneel:"🎸128 单膝远眺（安静）",
  mmdMotionIevan:"🎵120 甩葱旋转（Ievan Polkka风）", mmdMotionKyukura:"🎵165 晕乎乎（Kyu-kurarin风）",
  mmdMotionRabbit:"🎵173 兔耳蹦跳（Rabbit Hole风・5拍子）", mmdMotionMesmer:"🎵185 卡通摇摆（Mesmerizer风）",
  mmdMotionDune:"🎵135 行进（砂之惑星风）", mmdMotionGreen:"🎵145 荧光棒（Greenlights风）",
  mmdMotionMiku39:"🎵146 挥葱（Miku Miku风）", mmdMotionTyw:"🎵150 向世界（Tell Your World风）",
  mmdMotionSenbon:"🎵154 和风利落（千本樱风）", mmdMotionMelt:"🎵170 心动（Melt风）",
  mmdMotionUmg:"🎵170 倾诉（Unknown Mother Goose风）", mmdMotionWedh:"🎵174 舞厅（World's End Dancehall风）",
  mmdMotionRolling:"🎵194 转圈（Rolling Girl风）", mmdMotionUraomote:"🎵196 里表翻转（里表Lovers风）",
  mmdMotionVanish:"🎵240 高速（消失风）",
  mmdBuiltinNote:"内置动作是由 trk! 自行用代码生成的 VMD。🎵 系列按人气Miku歌曲的节奏编舞（曲名仅作参考）。基准BPM为 0 时，内置动作会按各自的基准BPM自动同步到歌曲。",
  mmdBpm:"动作基准BPM（0＝内置自动同步・自带VMD保持固定）",
  mmdLoading:"正在读取模型…", mmdLoadingPct:"正在读取模型… {n}%",
  mmdLoaded:"已读取模型「{name}」。", mmdRestored:"已恢复上次的模型。",
  mmdNotMmd:"这不是MMD模型（.pmx/.pmd）。", mmdTooBig:"太大（模型上限 {n}MB，动作上限 {m}MB）。",
  mmdNoModel:"请先读取模型。", mmdNetError:"无法读取3D部件（CDN）。请联网后重试。",
  mmdNoWebGL:"此环境无法使用 WebGL。", mmdLoadError:"无法读取模型。",
  mmdNoAgree:"请先勾选上面的「已确认规约」。",
  mmdFilesEmpty:"文件夹里没有文件。", mmdTooManyFiles:"文件太多（最多 {n} 个）。",
  mmdVmdLoaded:"已读取动作「{name}」。", mmdVmdBad:"不是VMD动作，或无法读取。",
  mmdSelected:"已切换到MMD吉祥物。", mmdSafe:"🛟 安全模式下不会读取・恢复MMD。",
  mmdSaveFail:"无法保存到本机（可能太大）。",
  mmdCreditPrefix:"MMD:"
});
Object.assign(TEXT.ko, {
  mmdTitle:"🩷 MMD (모델은 직접 준비)",
  mmdHint:"MMD 모델(.pmx/.pmd)과 모션(.vmd)을 불러와 게임 중에 춤추게 할 수 있습니다. 기본은 모델을 직접 준비하는 것입니다(아래에 💠 동봉 모델 버튼이 있으면 그것만으로 시작할 수 있습니다). 직접 준비할 때는 배포처의 규약(비상업・재배포 금지 등)을 지켜 주세요.",
  mmdPresetBtn:"💠 {name} 을(를) 마스코트로 (동봉)",
  mmdPresetHint:"💠 는 원본 'readme'(배포처 규약)와 함께 이 trk!에 동봉된 모델입니다. 규약(PCL: 비상업 등) 범위에서 즐겨 주세요. 크레딧은 자동으로 들어갑니다.",
  mmdPresetMissing:"동봉 모델 파일을 찾지 못했습니다(이 배포판에는 없는 것 같습니다).",
  mmdAgree:"배포처의 규약을 확인하고, 직접 준비한 모델을 사용합니다 (재배포・상업 이용 안 함)",
  mmdChooseModel:"📦 모델 (.pmx/.pmd)", mmdChooseFolder:"📁 모델 폴더 (텍스처 포함)",
  mmdChooseMotion:"🎬 모션 (.vmd)", mmdClearModel:"모델 빼기", mmdClearMotion:"모션 빼기",
  mmdRemember:"불러온 모델・모션을 이 기기에 저장 (IndexedDB)",
  mmdModelHead:"모델", mmdMotionHead:"모션", mmdFitHead:"크기・방향",
  mmdSize:"크기", mmdTurn:"방향", mmdCreditLabel:"크레딧 표시 (제작자 등)", mmdCreditPlaceholder:"예: Lat式ミク / Lat",
  mmdCheck:"🔎 동작 확인 (실기에서)", mmdCopy:"📋 결과 복사", mmdCopied:"📋 복사했습니다", mmdCopyNg:"📋 복사할 수 없습니다(아래 줄을 선택해 주세요)",
  mmdCheckHint:"잘 안 될 때 이걸 누르면 WebGL·CDN(three／three-mmd-loader)·모델·모션 상태를 한곳에 모아 보여 줍니다. 안 되는 경우 이 결과를 붙여 주시면 원인을 좁힐 수 있습니다.",
  mmdCheckRunning:"확인 중… (처음에는 CDN에서 읽어 오므로 조금 기다려 주세요)", mmdCheckOk:"✅ 확인 OK (WebGL·CDN·라이브러리)", mmdCheckNg:"❌ 확인에서 문제를 찾았습니다(아래 결과를 봐 주세요)",
  mmdMotionNone:"(모션 없음)",
  mmdMotionAuto:"🎲 자동 (곡 BPM에 가장 가까운 🎵 선택・한 번만 설정하면 끝)",
  mmdMotionWatch:"👀 바라보기 (BPM 무관)", mmdMotionStroll:"👀 서성이기 (두리번・BPM 무관)",
  mmdMotionStep:"내장① 스텝 (120BPM)", mmdMotionSwing:"내장② 흔들흔들 (100BPM)", mmdMotionTurn:"내장③ 턴 (120BPM)",
  mmdMotionJump:"내장④ 점프 (130BPM・화려)", mmdMotionIdol:"내장⑤ 아이돌 (128BPM)",
  mmdMotionAirgtr:"🎸128 에어기타 (슈게이저풍)", mmdMotionDreamy:"🎸128 차분히 (When You Sleep풍)",
  mmdMotionKneel:"🎸128 한쪽 무릎 (조용히 바라보기)",
  mmdMotionIevan:"🎵120 파 돌리기 (Ievan Polkka풍)", mmdMotionKyukura:"🎵165 어질어질 (큐쿠라린풍)",
  mmdMotionRabbit:"🎵173 토끼귀 폴짝 (Rabbit Hole풍・5박자)", mmdMotionMesmer:"🎵185 카툰 셔플 (메즈머라이저풍)",
  mmdMotionDune:"🎵135 행진 (모래의 행성풍)", mmdMotionGreen:"🎵145 펜라이트 (Greenlights풍)",
  mmdMotionMiku39:"🎵146 파 흔들기 (Miku Miku풍)", mmdMotionTyw:"🎵150 세계로 (Tell Your World풍)",
  mmdMotionSenbon:"🎵154 와풍 절도 (센본자쿠라풍)", mmdMotionMelt:"🎵170 두근 (Melt풍)",
  mmdMotionUmg:"🎵170 전하기 (Unknown Mother Goose풍)", mmdMotionWedh:"🎵174 댄스홀 (World's End Dancehall풍)",
  mmdMotionRolling:"🎵194 빙글빙글 (Rolling Girl풍)", mmdMotionUraomote:"🎵196 안팎 뒤집기 (우라오모테 Lovers풍)",
  mmdMotionVanish:"🎵240 고속 (소실풍)",
  mmdBuiltinNote:"내장 모션은 trk!가 코드로 만든 VMD입니다. 🎵 는 인기 미쿠 곡의 템포에 맞춘 안무입니다(곡명은 참고용). 기준 BPM이 0이면 내장 모션은 각자의 기준 BPM으로 곡에 자동 동기화됩니다.",
  mmdBpm:"모션 기준 BPM (0＝내장은 자동 동기화・직접 가져온 VMD는 고정)",
  mmdLoading:"모델을 불러오는 중…", mmdLoadingPct:"모델을 불러오는 중… {n}%",
  mmdLoaded:"모델 '{name}'을(를) 불러왔습니다.", mmdRestored:"지난번 모델을 되돌렸습니다.",
  mmdNotMmd:"MMD 모델(.pmx/.pmd)이 아닙니다.", mmdTooBig:"너무 큽니다 (모델 {n}MB, 모션 {m}MB까지).",
  mmdNoModel:"먼저 모델을 불러와 주세요.", mmdNetError:"3D 부품(CDN)을 불러오지 못했습니다. 온라인에서 다시 시도해 주세요.",
  mmdNoWebGL:"WebGL을 쓸 수 없는 환경입니다.", mmdLoadError:"모델을 불러오지 못했습니다.",
  mmdNoAgree:"위의 '규약을 확인했습니다'를 먼저 체크해 주세요.",
  mmdFilesEmpty:"폴더에 파일이 없습니다.", mmdTooManyFiles:"파일이 너무 많습니다 ({n}개까지).",
  mmdVmdLoaded:"모션 '{name}'을(를) 불러왔습니다.", mmdVmdBad:"VMD 모션이 아니거나 읽을 수 없습니다.",
  mmdSelected:"MMD 마스코트로 바꿨습니다.", mmdSafe:"🛟 안전 모드에서는 MMD 읽기・복원을 하지 않습니다.",
  mmdSaveFail:"이 기기에 저장하지 못했습니다 (너무 클 수 있습니다).",
  mmdCreditPrefix:"MMD:"
});

/* ============ 小さな道具 ============ */
const status = (k, v) => setStatus("mmdStatus", k, v);
const mmdRect = () => VRM_RECT[settings.layout] || VRM_RECT.classic;
const safeNow = () => { try { return typeof window.TrkSafeMode === "function" && window.TrkSafeMode(); } catch (_) { return false; } };
const isMmdFile = n => /\.(pmx|pmd)$/i.test(String(n || ""));
const isVmdFile = n => /\.vmd$/i.test(String(n || ""));
let chain = Promise.resolve();
const enqueue = fn => (chain = chain.then(fn).catch(e => console.error(e)));
const fail = key => { const e = new Error(key); e.key = key; return e; };

/* ============ 📼 内蔵モーション：VMD（Shift-JIS）を自分で組み立てる ============
   VMDは、ボーン名をShift-JISで15バイトに詰めた、素直なバイナリです。
   使う文字だけ表に持てば足ります（ここにあるのは、規格のための事実データです）。 */
const SJIS = {
  "セ":[0x83,0x5a], "ン":[0x83,0x93], "タ":[0x83,0x5e], "ー":[0x81,0x5b],
  "上":[0x8f,0xe3], "下":[0x89,0xba], "全":[0x91,0x53], "半":[0x94,0xbc], "身":[0x90,0x67],
  "左":[0x8d,0xb6], "右":[0x89,0x45], "手":[0x8e,0xe8], "首":[0x8e,0xf1], "肩":[0x8c,0xa8],
  "腕":[0x98,0x72], "足":[0x91,0xab], "頭":[0x93,0xaa], "親":[0x90,0x65],
  "ひ":[0x82,0xd0], "じ":[0x82,0xb6], "ざ":[0x82,0xb4]
};
function sjisFix(str, len) {
  const out = new Uint8Array(len);
  let i = 0;
  for (const ch of String(str)) {
    const code = ch.charCodeAt(0);
    const bytes = code < 0x80 ? [code] : SJIS[ch];
    if (!bytes || i + bytes.length > len) continue;
    for (const b of bytes) out[i++] = b;
  }
  return out;
}
const VMD_LINEAR = [0, 0, 127, 127];      // 補間なし＝直線（64バイトを同じ模様で埋めて、どの読み方でも直線になるように）
function buildVmd(frames, modelName = "trk") {
  const n = frames.length, size = 30 + 20 + 4 + n * 111 + 20;
  const buf = new ArrayBuffer(size), u8 = new Uint8Array(buf), dv = new DataView(buf);
  const header = "Vocaloid Motion Data 0002";
  for (let i = 0; i < header.length; i++) u8[i] = header.charCodeAt(i);
  u8.set(sjisFix(modelName, 20), 30);
  dv.setUint32(50, n, true);
  frames.forEach((f, i) => {
    const at = 54 + i * 111;
    u8.set(sjisFix(f.bone, 15), at);
    dv.setUint32(at + 15, f.frame, true);
    dv.setFloat32(at + 19, f.pos[0], true); dv.setFloat32(at + 23, f.pos[1], true); dv.setFloat32(at + 27, f.pos[2], true);
    dv.setFloat32(at + 31, f.rot[0], true); dv.setFloat32(at + 35, f.rot[1], true);
    dv.setFloat32(at + 39, f.rot[2], true); dv.setFloat32(at + 43, f.rot[3], true);
    for (let k = 0; k < 64; k++) u8[at + 47 + k] = VMD_LINEAR[k % 4];
  });
  let at = 54 + n * 111;                  // モーフ・カメラ・照明・セルフシャドウ・プロパティは 0 件
  for (let k = 0; k < 5; k++) { dv.setUint32(at, 0, true); at += 4; }
  return new Uint8Array(buf);
}
/* 回転（ラジアン）→ クォータニオン。かけ算は Y → Z → X の順で統一します */
const DEG = Math.PI / 180;
function qAxis(x, y, z, deg) {
  const h = deg * DEG / 2, s = Math.sin(h);
  return [x * s, y * s, z * s, Math.cos(h)];
}
function qMul(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
  ];
}
const qEuler = (rx, ry, rz) => qMul(qMul(qAxis(0, 1, 0, ry), qAxis(0, 0, 1, rz)), qAxis(1, 0, 0, rx));
const FPS = 30, STEP = 3;                 // MMDのモーションは 30fps。3フレームごとに置く
/* モーションの台本：t（秒）→ 各ボーンの回転・位置。ここが「振り付け」です */
const BUILTIN = {
  step: { label:"mmdMotionStep", bpm:120, seconds:4, pose:t => {
    const w = 2 * Math.PI * t * 2, slow = 2 * Math.PI * t;
    return {
      "センター": { pos:[0, -0.5 * Math.max(0, Math.sin(w)), 0], rot:[0, 0, 0] },
      "上半身": { rot:[0, 4 * Math.sin(slow), 0] },
      "首":    { rot:[2 * Math.sin(w), -3 * Math.sin(slow), 0] },
      "左腕":  { rot:[0, 0, -55 + 32 * Math.sin(w)] },
      "右腕":  { rot:[0, 0, 55 - 32 * Math.sin(w)] },
      "左ひじ":{ rot:[0, -18 - 10 * Math.sin(w), 0] },
      "右ひじ":{ rot:[0, 18 + 10 * Math.sin(w), 0] }
    };
  } },
  swing: { label:"mmdMotionSwing", bpm:100, seconds:6, pose:t => {
    const w = 2 * Math.PI * t / 1.5, slow = 2 * Math.PI * t / 3;
    return {
      "センター": { pos:[0.25 * Math.sin(w), -0.12 * Math.max(0, Math.sin(w * 2)), 0], rot:[0, 0, 3 * Math.sin(w)] },
      "上半身": { rot:[0, 7 * Math.sin(slow), 2 * Math.sin(w)] },
      "上半身2":{ rot:[0, 4 * Math.sin(slow + 1), 0] },
      "首":    { rot:[3 * Math.sin(w + 1), -5 * Math.sin(slow), 0] },
      "左腕":  { rot:[0, 0, -28 + 16 * Math.sin(w + 0.6)] },
      "右腕":  { rot:[0, 0, 28 - 16 * Math.sin(w - 0.6)] },
      "左ひじ":{ rot:[0, -22, 0] }, "右ひじ":{ rot:[0, 22, 0] }
    };
  } },
  turn: { label:"mmdMotionTurn", bpm:120, seconds:4, pose:t => {
    const w = 2 * Math.PI * t / 2, spin = 360 * (t / 4), rise = Math.sin(Math.PI * Math.min(1, t / 4));
    return {
      "センター": { pos:[0, 0.5 * rise, 0], rot:[0, spin, 0] },
      "上半身": { rot:[-6 * rise, 0, 0] },
      "首":    { rot:[-4 * rise, 6 * Math.sin(w), 0] },
      "左腕":  { rot:[0, 0, -78 * rise - 10] },
      "右腕":  { rot:[0, 0, 78 * rise + 10] },
      "左ひじ":{ rot:[0, -10, 0] }, "右ひじ":{ rot:[0, 10, 0] }
    };
  } },
  /* ④ ジャンプ：バンザイしながら跳ぶ。Lat式でかわいく、デフォルメ系（タワシ式など）だと派手に見える */
  jump: { label:"mmdMotionJump", bpm:130, seconds:4, pose:t => {
    const w = 2 * Math.PI * t, up = Math.max(0, Math.sin(w)), dip = Math.max(0, -Math.sin(w));
    const alt = Math.sin(Math.PI * t / 2);           // 4秒かけて重心がゆっくり左右へ
    return {
      "センター": { pos:[0.12 * alt, 0.85 * up * up - 0.22 * dip, 0], rot:[0, 0, 2 * alt] },
      "上半身": { rot:[-7 * up + 3 * dip, 0, -2 * alt] },
      "首":    { rot:[-6 * up, 0, 0] },
      "頭":    { rot:[-5 * up + 3 * Math.sin(w * 2), 0, 0] },
      "左腕":  { rot:[0, 0, -72 + 117 * up] },
      "右腕":  { rot:[0, 0, 72 - 117 * up] },
      "左ひじ":{ rot:[0, -24 + 14 * up, 0] },
      "右ひじ":{ rot:[0, 24 - 14 * up, 0] }
    };
  } },
  /* ⑤ アイドル：サイドステップしながら右手でこぶしを突き上げる */
  idol: { label:"mmdMotionIdol", bpm:128, seconds:6, pose:t => {
    const w = 2 * Math.PI * t / 1.5, sway = Math.sin(w), hop = Math.max(0, Math.sin(2 * w));
    const pump = Math.max(0, Math.sin(2 * w - 0.4));
    return {
      "センター": { pos:[0.4 * sway, 0.12 * hop - 0.1, 0], rot:[0, 0, 3 * sway] },
      "上半身": { rot:[0, 10 * Math.sin(w / 2), 4 * sway] },
      "上半身2":{ rot:[0, 5 * sway, 0] },
      "首":    { rot:[2 * hop, -7 * sway, 0] },
      "頭":    { rot:[-4 * pump, 5 * sway, 0] },
      "左腕":  { rot:[0, 0, -58 - 10 * sway] },
      "右腕":  { rot:[0, 0, 62 - 147 * pump] },
      "左ひじ":{ rot:[0, -28, 0] },
      "右ひじ":{ rot:[0, 30 + 25 * pump, 0] }
    };
  } },
  /* ---- 🎵 BPMシリーズ：人気ミク曲のテンポに合わせた振り付け（曲名は目安。モーション自体は trk! の自作VMD） ----
     基準BPM（mmdBpm）が 0 のとき、内蔵モーションはそれぞれの bpm を基準に曲へ自動シンクします。 */
  ievan120: { label:"mmdMotionIevan", bpm:120, seconds:4, pose:t => {   // ネギスピン（8拍・はちゅね風にゆれながら回すだけ）
    const b = t * 2, spin = 2 * Math.PI * b, sway = Math.sin(Math.PI * b / 4);
    return {
      "センター": { pos:[0.06 * sway, -0.03 * Math.abs(Math.sin(Math.PI * b)), 0], rot:[0, 0, 4 * sway] },
      "上半身": { rot:[2, 5 * sway, 3 * sway] },
      "首":    { rot:[2, -4 * sway, -8 * sway] },
      "頭":    { rot:[-3, 0, -12 * sway] },
      "左腕":  { rot:[0, 0, -66 + 3 * sway] },
      "左ひじ":{ rot:[0, -14, 0] },
      "右腕":  { rot:[22 * Math.sin(spin), 0, 24 + 12 * Math.cos(spin)] },
      "右ひじ":{ rot:[0, 52 + 18 * Math.sin(spin + 1.2), 0] }
    };
  } },
  /* ---- 👀 汎用（BPM非依存。fixed:true＝曲のテンポに関係なく、いつも同じ速さ） ---- */
  watch: { label:"mmdMotionWatch", bpm:0, fixed:true, seconds:12, pose:t => { // みてる（こちらをじっと・呼吸と小さな首かしげだけ）
    const breathe = Math.sin(Math.PI * t / 2);                        // 4秒でひと呼吸
    const tilt = Math.sin(Math.PI * t / 6), shift = Math.sin(Math.PI * t / 12);
    return {
      "センター": { pos:[0.04 * shift, 0.02 * breathe, 0], rot:[0, 3 * shift, 0.6 * shift] },
      "上半身": { rot:[1 - 0.8 * breathe, -2 * shift, 0.6 * tilt] },
      "上半身2":{ rot:[0.6 * breathe, 0, 0] },
      "首":    { rot:[-2, -2 * shift, -2 * tilt] },
      "頭":    { rot:[-3 + 0.6 * breathe, -1.5 * shift, 5 * tilt] },  // ちょっと首をかしげてこちらを見る
      "左腕":  { rot:[1.5 * breathe, 0, -66] },
      "右腕":  { rot:[1.5 * breathe, 0, 66] },
      "左ひじ":{ rot:[0, -10, 0] }, "右ひじ":{ rot:[0, 10, 0] }
    };
  } },
  stroll: { label:"mmdMotionStroll", bpm:0, fixed:true, seconds:16, pose:t => { // たたずむ（手をうしろに・あたりを見まわす）
    const breathe = Math.sin(Math.PI * t / 2), look = Math.sin(Math.PI * t / 8), lean = Math.sin(Math.PI * t / 16);
    return {
      "センター": { pos:[0.08 * lean, 0.02 * breathe, 0], rot:[0, 10 * lean, 1.2 * lean] },
      "上半身": { rot:[2 - breathe, 5 * lean, 1.5 * lean] },
      "首":    { rot:[-3, 8 * look, -2 * lean] },
      "頭":    { rot:[-5 + 0.8 * breathe, 10 * look, 2 * look] },     // きょろきょろと見まわす
      "左腕":  { rot:[-22, -16, -58] },                               // 手をうしろで組む
      "右腕":  { rot:[-22, 16, 58] },
      "左ひじ":{ rot:[0, -52, 0] }, "右ひじ":{ rot:[0, 52, 0] }
    };
  } },
  /* ---- 🎸 シューゲイザー3部作（128BPM：Sometimes / When You Sleep あたりむけ） ---- */
  airgtr128: { label:"mmdMotionAirgtr", bpm:128, seconds:3.75, pose:t => { // エアギター（8拍・うつむいてかき鳴らす）
    const b = t * 128 / 60, strum = Math.sin(2 * Math.PI * b) + 0.4 * Math.sin(4 * Math.PI * b);
    const sway = Math.sin(Math.PI * b / 4), bounce = Math.abs(Math.sin(Math.PI * b));
    return {
      "センター": { pos:[0.05 * sway, -0.14 - 0.05 * bounce, 0], rot:[0, -14 + 6 * sway, 0] },
      "上半身": { rot:[14, 6 * sway, 3 * sway] },
      "上半身2":{ rot:[8, 0, 0] },
      "首":    { rot:[16, -4 * sway, 2 * sway] },
      "頭":    { rot:[20, 0, 5 * sway] },                               // 靴を見つめる
      "左腕":  { rot:[26, 24, -38] },                                   // ネックをにぎる側
      "左ひじ":{ rot:[0, -78, 0] },
      "右腕":  { rot:[14 + 7 * strum, 0, 52] },                         // かき鳴らす側
      "右ひじ":{ rot:[0, 48 + 16 * strum, 0] }
    };
  } },
  dreamy128: { label:"mmdMotionDreamy", bpm:128, seconds:7.5, pose:t => { // しっとり（16拍・ゆったりただよう）
    const b = t * 128 / 60, w = Math.PI * b / 8, s = Math.sin(w), drift = Math.sin(Math.PI * b / 4);
    return {
      "センター": { pos:[0.16 * s, -0.04 + 0.03 * Math.sin(Math.PI * b / 2), 0], rot:[0, 15 * s, 2 * drift] },
      "上半身": { rot:[2, 8 * s, 4 * drift] },
      "上半身2":{ rot:[1, 4 * s, 0] },
      "首":    { rot:[-6, -6 * s, -4 * drift] },
      "頭":    { rot:[-9, -4 * s, 6 * drift] },                         // すこし上をむいて夢見ごこち
      "左腕":  { rot:[4 * drift, 0, -62 + 4 * s] },
      "右腕":  { rot:[-4 * drift, 0, 62 + 4 * s] },
      "左ひじ":{ rot:[0, -12 - 5 * drift, 0] },
      "右ひじ":{ rot:[0, 12 - 5 * drift, 0] }
    };
  } },
  kneel128: { label:"mmdMotionKneel", bpm:128, seconds:7.5, pose:t => {  // かたひざ（16拍・しずかに眺める）
    const b = t * 128 / 60, breathe = Math.sin(Math.PI * b / 2), look = Math.sin(Math.PI * b / 8);
    return {
      "センター": { pos:[0, -3.8 + 0.06 * breathe, 0.2], rot:[0, 8 * look, 0] },
      "上半身": { rot:[10 - 2 * breathe, 4 * look, 0] },
      "上半身2":{ rot:[4, 0, 0] },
      "首":    { rot:[-10, 10 * look, 0] },
      "頭":    { rot:[-14 + breathe, 12 * look, 2 * look] },            // とおくを眺める
      "左足":  { rot:[-95, 0, 6] }, "左ひざ":{ rot:[115, 0, 0] },        // 立てひざ側
      "右足":  { rot:[-25, 0, -8] }, "右ひざ":{ rot:[120, 0, 0] },       // 地面につく側
      "左腕":  { rot:[32, 0, -48] },                                    // ひざにうでを乗せる
      "左ひじ":{ rot:[0, -58, 0] },
      "右腕":  { rot:[6, 0, 64] },                                      // だらんと支える
      "右ひじ":{ rot:[0, 14 + 3 * breathe, 0] }
    };
  } },
  dune135: { label:"mmdMotionDune", bpm:135, seconds:3.56, pose:t => {   // こうしん（8拍）
    const b = t * 2.25, arm = Math.sin(Math.PI * b), bob = Math.abs(Math.sin(Math.PI * b));
    return {
      "センター": { pos:[0, -0.22 + 0.16 * bob, 0], rot:[0, 6 * Math.sin(Math.PI * b / 4), 0] },
      "上半身": { rot:[3, 4 * arm, 0] },
      "首":    { rot:[-3 * bob, -4 * arm, 0] },
      "頭":    { rot:[4 * bob, 0, 0] },
      "左腕":  { rot:[30 * arm, 0, -62] },
      "右腕":  { rot:[-30 * arm, 0, 62] },
      "左ひじ":{ rot:[0, -45 - 15 * arm, 0] },
      "右ひじ":{ rot:[0, 45 - 15 * arm, 0] }
    };
  } },
  green145: { label:"mmdMotionGreen", bpm:145, seconds:3.31, pose:t => { // ペンライト（8拍）
    const b = t * 145 / 60, w = Math.PI * b / 2, s = Math.sin(w);
    return {
      "センター": { pos:[0.22 * s, -0.08 * Math.abs(Math.cos(w)), 0], rot:[0, 0, 3 * s] },
      "上半身": { rot:[0, 5 * s, 4 * s] },
      "首":    { rot:[-4, -5 * s, -3 * s] },
      "頭":    { rot:[-5, 0, 4 * s] },
      "左腕":  { rot:[0, 0, 38 + 20 * s] },
      "右腕":  { rot:[0, 0, -38 + 20 * s] },
      "左ひじ":{ rot:[0, -12, 0] }, "右ひじ":{ rot:[0, 12, 0] }
    };
  } },
  miku146: { label:"mmdMotionMiku39", bpm:146, seconds:3.29, pose:t => { // ねぎふり（8拍）
    const b = t * 146 / 60, wave = Math.sin(2 * Math.PI * b), hop = Math.max(0, Math.sin(Math.PI * b));
    return {
      "センター": { pos:[0, 0.12 * hop * hop - 0.06, 0], rot:[0, 8 * Math.sin(Math.PI * b / 4), 0] },
      "上半身": { rot:[0, 0, 3 * wave] },
      "首":    { rot:[3 * wave, 0, -4 * wave] },
      "頭":    { rot:[5 * hop, 0, 3 * wave] },
      "左腕":  { rot:[0, 0, -58] },
      "右腕":  { rot:[0, 0, -28 - 34 * (wave * 0.5 + 0.5)] },
      "左ひじ":{ rot:[0, -75, 0] },
      "右ひじ":{ rot:[0, 35 + 18 * wave, 0] }
    };
  } },
  tyw150: { label:"mmdMotionTyw", bpm:150, seconds:3.2, pose:t => {      // せかいへ（8拍：むね→ひろげる）
    const b = t * 2.5, u = (Math.sin(Math.PI * b / 2 - Math.PI / 2) + 1) / 2, sway = Math.sin(Math.PI * b / 4);
    return {
      "センター": { pos:[0, -0.05 + 0.08 * u, 0], rot:[0, 10 * sway, 0] },
      "上半身": { rot:[-5 * u, 6 * sway, 0] },
      "上半身2":{ rot:[-3 * u, 0, 0] },
      "首":    { rot:[-6 * u, -5 * sway, 0] },
      "頭":    { rot:[-6 * u, 0, 0] },
      "左腕":  { rot:[12 * (1 - u), 0, -58 + 78 * u] },
      "右腕":  { rot:[12 * (1 - u), 0, 58 - 78 * u] },
      "左ひじ":{ rot:[0, -82 * (1 - u) - 6, 0] },
      "右ひじ":{ rot:[0, 82 * (1 - u) + 6, 0] }
    };
  } },
  senbon154: { label:"mmdMotionSenbon", bpm:154, seconds:3.12, pose:t => { // キレの和（8拍・ジグザグでキビキビ）
    const b = t * 154 / 60, zig = Math.asin(Math.sin(Math.PI * b / 2)) * 2 / Math.PI, snap = Math.asin(Math.sin(Math.PI * b)) * 2 / Math.PI;
    return {
      "センター": { pos:[0.1 * zig, -0.1 + 0.05 * Math.abs(snap), 0], rot:[0, 0, 2 * zig] },
      "上半身": { rot:[0, 18 * zig, 3 * zig] },
      "首":    { rot:[0, -16 * zig, 0] },
      "頭":    { rot:[3 * Math.abs(snap), -6 * zig, 0] },
      "左腕":  { rot:[0, 0, -15 - 40 * Math.max(0, zig)] },
      "右腕":  { rot:[0, 0, 15 + 40 * Math.max(0, -zig)] },
      "左ひじ":{ rot:[0, -95 * Math.max(0, -zig) - 10, 0] },
      "右ひじ":{ rot:[0, 95 * Math.max(0, zig) + 10, 0] }
    };
  } },
  kyukura165: { label:"mmdMotionKyukura", bpm:165, seconds:2.91, pose:t => { // くらくら（8拍・マリオネットみたいにゆれる）
    const b = t * 2.75, w = Math.PI * b / 2, fast = 2 * Math.PI * b;
    return {
      "センター": { pos:[0.12 * Math.sin(w), 0.05 * Math.cos(w) - 0.08, 0], rot:[0, 0, 4 * Math.sin(w)] },
      "上半身": { rot:[3 * Math.cos(w), 6 * Math.sin(w), 5 * Math.sin(w + 0.4)] },
      "首":    { rot:[-3 * Math.cos(w + 0.5), 0, 8 * Math.sin(w + 0.5)] },
      "頭":    { rot:[6 * Math.cos(w), 0, 12 * Math.sin(w)] },
      "左腕":  { rot:[8 * Math.sin(fast), 0, -30 + 14 * Math.sin(fast) ] },
      "右腕":  { rot:[-8 * Math.sin(fast + 1.2), 0, 30 - 14 * Math.sin(fast + 1.2)] },
      "左ひじ":{ rot:[0, -42 - 26 * Math.sin(fast + 0.6), 0] },
      "右ひじ":{ rot:[0, 42 + 26 * Math.sin(fast + 1.8), 0] }
    };
  } },
  melt170: { label:"mmdMotionMelt", bpm:170, seconds:2.82, pose:t => {   // きゅん（8拍・むねの前で手を合わせてゆれる）
    const b = t * 170 / 60, w = Math.PI * b / 2, s = Math.sin(w), beat = Math.max(0, Math.sin(Math.PI * b));
    return {
      "センター": { pos:[0.1 * s, -0.04 * beat, 0], rot:[0, 0, 5 * s] },
      "上半身": { rot:[2, 7 * s, 3 * s] },
      "首":    { rot:[3, -6 * s, -6 * s] },
      "頭":    { rot:[-4 + 2 * beat, 0, 8 * s] },
      "左腕":  { rot:[18, 0, -48] },
      "右腕":  { rot:[18, 0, 48] },
      "左ひじ":{ rot:[0, -98, 0] },
      "右ひじ":{ rot:[0, 98, 0] }
    };
  } },
  umg170: { label:"mmdMotionUmg", bpm:170, seconds:5.65, pose:t => {     // つたえる（16拍・かた手をのばして→むねへ）
    const b = t * 170 / 60, u = (Math.sin(Math.PI * b / 8 - Math.PI / 2) + 1) / 2, s = Math.sin(Math.PI * b / 4);
    return {
      "センター": { pos:[0.08 * s, -0.03, 0], rot:[0, -8 * u, 0] },
      "上半身": { rot:[-3 * u, -6 * u, 2 * s] },
      "首":    { rot:[-4 * u, 5 * u, -3 * s] },
      "頭":    { rot:[-5 * u, 4 * u, 0] },
      "左腕":  { rot:[0, 0, -55 + 5 * s] },
      "右腕":  { rot:[-35 * u, 20 * u, 30 - 55 * u] },
      "左ひじ":{ rot:[0, -20, 0] },
      "右ひじ":{ rot:[0, 15 + 75 * (1 - u), 0] }
    };
  } },
  rabbit173: { label:"mmdMotionRabbit", bpm:173, seconds:3.47, pose:t => { // うさみみ（10拍＝5拍子×2・4ホップ＋1スキップ）
    const b = t * 173 / 60, b5 = b % 5, skip = b5 >= 4;                  // 5拍目だけ2倍速のスキップ＝変拍子感
    const hop = Math.max(0, Math.sin(Math.PI * b5 * (skip ? 2 : 1)));
    const sway = Math.sin(Math.PI * b / 5), wig = Math.sin(2 * Math.PI * b);
    return {
      "センター": { pos:[0.14 * sway, 0.1 * hop * hop - 0.05, 0], rot:[0, 0, 3 * sway] },
      "上半身": { rot:[2 * hop, 6 * sway, 2 * sway] },
      "首":    { rot:[-3 * hop, -5 * sway, 4 * wig * (skip ? 1 : 0.3)] },
      "頭":    { rot:[-4 * hop, 0, 6 * sway] },
      "左腕":  { rot:[0, 0, 52 + 4 * wig] },
      "右腕":  { rot:[0, 0, -52 - 4 * wig] },
      "左ひじ":{ rot:[0, -112 - 8 * wig, 0] },
      "右ひじ":{ rot:[0, 112 + 8 * wig, 0] }
    };
  } },
  wedh174: { label:"mmdMotionWedh", bpm:174, seconds:2.76, pose:t => {   // ダンスホール（8拍・左右交互にうでを上げる）
    const b = t * 174 / 60, s = Math.sin(Math.PI * b / 2), nod = Math.max(0, Math.sin(Math.PI * b));
    const L = Math.max(0, s), R = Math.max(0, -s);
    return {
      "センター": { pos:[0.3 * s, 0.07 * nod - 0.1, 0], rot:[0, 0, 4 * s] },
      "上半身": { rot:[0, 9 * s, 5 * s] },
      "首":    { rot:[4 * nod, -8 * s, -4 * s] },
      "頭":    { rot:[6 * nod, 0, 0] },
      "左腕":  { rot:[0, 0, -58 + 100 * L] },
      "右腕":  { rot:[0, 0, 58 - 100 * R] },
      "左ひじ":{ rot:[0, -25 + 15 * L, 0] },
      "右ひじ":{ rot:[0, 25 - 15 * R, 0] }
    };
  } },
  mesmer185: { label:"mmdMotionMesmer", bpm:185, seconds:2.59, pose:t => { // すましシャッフル（8拍・レトロカートゥーンのびよんびよん）
    const b = t * 185 / 60, beat = Math.abs(Math.sin(Math.PI * b)), alt = Math.sin(Math.PI * b / 2);
    const pend = Math.sin(Math.PI * b);                                  // 1拍で腕がふりこ
    return {
      "センター": { pos:[0.22 * alt, 0.08 * beat - 0.12 + 0.06 * beat * beat, 0], rot:[0, 0, 5 * alt] },
      "上半身": { rot:[2 * beat, 12 * alt, -4 * alt] },
      "上半身2":{ rot:[0, 6 * alt, 0] },
      "首":    { rot:[4 * beat, -8 * alt, 10 * alt] },
      "頭":    { rot:[5 * beat, 0, -13 * alt] },
      "左腕":  { rot:[38 * pend, 0, -52] },
      "右腕":  { rot:[-38 * pend, 0, 52] },
      "左ひじ":{ rot:[0, -22 - 14 * pend, 0] },
      "右ひじ":{ rot:[0, 22 - 14 * pend, 0] }
    };
  } },
  rolling194: { label:"mmdMotionRolling", bpm:194, seconds:2.47, pose:t => { // ぐるぐる（8拍・からだで円をえがく）
    const b = t * 194 / 60, w = Math.PI * b / 2;
    return {
      "センター": { pos:[0.25 * Math.sin(w), 0.1 * Math.cos(w) - 0.12, 0], rot:[0, 0, 7 * Math.sin(w)] },
      "上半身": { rot:[5 * Math.cos(w), 0, 8 * Math.sin(w)] },
      "首":    { rot:[-4 * Math.cos(w), 0, 9 * Math.sin(w + 0.7)] },
      "頭":    { rot:[-5 * Math.cos(w + 0.5), 0, 10 * Math.sin(w + 1)] },
      "左腕":  { rot:[14 * Math.sin(w), 0, -68] },
      "右腕":  { rot:[-14 * Math.sin(w), 0, 68] },
      "左ひじ":{ rot:[0, -14, 0] }, "右ひじ":{ rot:[0, 14, 0] }
    };
  } },
  uraomote196: { label:"mmdMotionUraomote", bpm:196, seconds:2.45, pose:t => { // うらおもて（8拍・くるっと左右へ向きかえ）
    const b = t * 196 / 60, flip = Math.sin(Math.PI * b / 2), nod = Math.max(0, Math.sin(2 * Math.PI * b));
    const x = Math.abs(flip);
    return {
      "センター": { pos:[0, -0.06 * nod, 0], rot:[0, 70 * flip, 0] },
      "上半身": { rot:[0, 14 * flip, 0] },
      "首":    { rot:[5 * nod, -10 * flip, 0] },
      "頭":    { rot:[7 * nod, -8 * flip, 0] },
      "左腕":  { rot:[20 * x, 0, -42 - 14 * x] },
      "右腕":  { rot:[20 * x, 0, 42 + 14 * x] },
      "左ひじ":{ rot:[0, -70 - 20 * flip, 0] },
      "右ひじ":{ rot:[0, 70 - 20 * flip, 0] }
    };
  } },
  vanish240: { label:"mmdMotionVanish", bpm:240, seconds:4, pose:t => {  // こうそく（16拍・いそがしく跳ねる）
    const b = t * 4, up = Math.pow(Math.max(0, Math.sin(Math.PI * b)), 2), fast = Math.sin(2 * Math.PI * b);
    const alt = Math.sin(Math.PI * b / 8);
    return {
      "センター": { pos:[0.08 * alt, 0.22 * up - 0.08, 0], rot:[0, 0, 2 * alt] },
      "上半身": { rot:[7, 5 * fast, -2 * alt] },
      "首":    { rot:[-4 * up, 3 * fast, 0] },
      "頭":    { rot:[-3 * up, 4 * fast, 0] },
      "左腕":  { rot:[0, 0, -55 + 26 * up] },
      "右腕":  { rot:[0, 0, 55 - 26 * up] },
      "左ひじ":{ rot:[0, -55 - 16 * fast, 0] },
      "右ひじ":{ rot:[0, 55 - 16 * fast, 0] }
    };
  } }
};
const builtinBytes = id => {
  const m = BUILTIN[id];
  if (!m) return null;
  const frames = [];
  for (let f = 0; f <= m.seconds * FPS; f += STEP) {
    const t = f / FPS, pose = m.pose(t);
    for (const bone of Object.keys(pose)) {
      const b = pose[bone], rot = qEuler(b.rot[0], b.rot[1], b.rot[2]);
      frames.push({ bone, frame:f, pos:b.pos || [0, 0, 0], rot });
    }
  }
  return buildVmd(frames, "trk-builtin-" + id);
};

/* ============ 💠 同梱プリセットモデル（assets/mmd/<dir>/preset.json があるときだけ出る） ============
   モデル本体はふだんリポジトリに入れません。**再配布OKを「れあどめ」原文で確認できたモデルだけ**、
   れあどめ原文ごと assets/mmd/<dir>/ に置き、preset.json を書くと、設定にワンクリックのボタンが出ます。
   （例：Lat式ミク＝「版権元ガイドラインの範囲内であれば改変・流用を含む利用・再配布等オールOK」）
   preset.json の形：
     { "label":"Lat式ミク", "files":["LatMiku.pmd","tex/body.bmp", …],
       "credit":"Lat式ミク / Lat様", "motion":"jump", "bpm":130, "readme":"readme_lat.txt" }
   ・files は dir からの相対パス。テクスチャも全部列挙する（GitHub Pages は大文字小文字を区別）
   ・readme は規約の原文ファイル（必ず同じフォルダに置く） */
const PRESET_BASE = "assets/mmd/", PRESET_DIRS = ["lat-miku"];
let presets = [];                                    // 読めた preset.json の一覧 [{dir, man}]
async function findPresets() {
  presets = [];                                      // 何度呼ばれても重複しない
  for (const dir of PRESET_DIRS) {
    try {
      const res = await fetch(PRESET_BASE + dir + "/preset.json", { cache:"no-cache" });
      if (!res || !res.ok) continue;
      const man = await res.json();
      if (man && man.label && Array.isArray(man.files) && man.files.length) presets.push({ dir, man });
    } catch (_) { /* 無ければ出さないだけ（持ち込み式のまま） */ }
  }
  renderPresetRow();
}
function renderPresetRow() {
  const row = $("mmdPresetRow"), hint = $("mmdPresetHint");
  if (!row) return;
  row.textContent = "";
  for (const p of presets) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = tr("mmdPresetBtn", { name:p.man.label });
    b.addEventListener("click", () => {
      if (safeNow()) { status("mmdSafe"); return; }
      enqueue(() => doLoadPreset(p));
    });
    row.append(b);
  }
  row.hidden = !presets.length;
  if (hint) hint.hidden = !presets.length;
}
async function doLoadPreset(p) {
  status("mmdLoading");
  try {
    const files = [];
    for (const name of p.man.files) {
      const path = PRESET_BASE + p.dir + "/" + String(name).split("/").map(encodeURIComponent).join("/");
      const res = await fetch(path);
      if (!res || !res.ok) throw fail("mmdPresetMissing");
      const blob = await res.blob();
      files.push(new File([blob], String(name).split("/").pop()));
    }
    if (p.man.credit) settings.mmdCredit = String(p.man.credit).slice(0, 120);
    await doLoadModel(files, { save:true });
    if (!model) return;                              // 失敗なら doLoadModel が理由を出している
    if (p.man.motion && BUILTIN[p.man.motion]) await applyMotion(p.man.motion, { silent:true });
    if (typeof p.man.bpm === "number") settings.mmdMotionBpm = Math.max(0, Math.min(300, p.man.bpm));
    saveUserPrefs(); syncUI();
  } catch (e) {
    console.error(e);
    status(e && e.key ? e.key : "mmdLoadError");
  }
}

/* ============ 状態 ============ */
const canvas = $("mmdCanvas"), prev = $("mmdPreview"), pctx = prev && prev.getContext("2d");
let renderer = null, scene = null, camera = null, pivot = null;
let L = null, injected = null;                     // L = { THREE, ThreeMmdLoader, createMmdFileIndex }
let model = null, modelFiles = [], modelName = "", modelKey = "";
let anim = null, motionKind = "none", motionName = "", motionDur = 0;
let frameInfo = null, fitScale = 1, lastT = 0, curKey = "", playing = false, clock = 0;

/* ---------- 3Dの部品は、必要になったときだけ（テストでは差し替えできます） ---------- */
function libs() {
  if (injected) return Promise.resolve(injected);
  if (!L) {
    L = Promise.all([import("three"), import(MMD_LIB)])
      .then(([THREE, M]) => ({ THREE, ThreeMmdLoader:M.ThreeMmdLoader, createMmdFileIndex:M.createMmdFileIndex }))
      .catch(e => { L = null; throw e; });
  }
  return L;
}

/* ---------- 画面まわり（vrm.js と同じ考え方） ---------- */
function ensureScene() {
  if (renderer && scene && camera && pivot) return true;
  const { THREE } = L;
  /* 途中で失敗した半端な状態を残さない（つぎの読み込みが壊れないように） */
  try {
    const r = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
    r.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
    const light = new THREE.DirectionalLight(0xffffff, 1.7);
    light.position.set(0.4, 1, 1.6).normalize(); sc.add(light);
    sc.add(new THREE.AmbientLight(0xffffff, 0.85));
    const back = new THREE.DirectionalLight(0xbfd4ff, 0.5);
    back.position.set(-0.6, 0.5, -1).normalize(); sc.add(back);
    const pv = new THREE.Group(); sc.add(pv);
    renderer = r; scene = sc; camera = cam; pivot = pv;
    return true;
  } catch (e) { console.error(e); renderer = null; scene = null; camera = null; pivot = null; return false; }
}
function measure() {
  const { THREE } = L;
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model.root);
  const h = Math.max(0.01, box.max.y - box.min.y);
  fitScale = 1.6 / h;                              // 画面のなかで 1.6 の高さに合わせる
  frameInfo = { minY:box.min.y, maxY:box.max.y, headY:box.min.y + h * 0.92 };
  applyModelTransform();
}
function applyModelTransform() {
  if (!model || !frameInfo) return;
  const sc = fitScale * (settings.mmdScale || 1);
  model.root.scale.setScalar(sc);
  model.root.position.y = -frameInfo.minY * sc;
  pivot.rotation.y = (settings.mmdTurn || 0) * DEG;
  frameCamera();
}
function frameCamera() {
  if (!frameInfo || !camera || !L) return;
  const h = Math.max(0.3, frameInfo.maxY - frameInfo.minY) * (settings.mmdScale || 1);
  const fh = 1.6 * (settings.mmdScale || 1) * 1.15, cy = fh * 0.52;
  const d = (fh / 2) / Math.tan(L.THREE.MathUtils.degToRad(camera.fov) / 2);
  camera.position.set(0, cy, d); camera.lookAt(0, cy, 0);
}
function applyRect() {
  if (!renderer || !camera) return;
  const R = mmdRect(), sc = Math.min(innerWidth / 1920, innerHeight / 1080);
  const pr = Math.min(2, Math.max(0.5, (devicePixelRatio || 1) * sc));
  const key = `${R.x},${R.y},${R.w},${R.h},${pr.toFixed(2)}`;
  if (key === curKey) return;
  curKey = key;
  Object.assign(canvas.style, { left:R.x + "px", top:R.y + "px", width:R.w + "px", height:R.h + "px" });
  renderer.setPixelRatio(pr); renderer.setSize(R.w, R.h, false);
  camera.aspect = R.w / R.h; camera.updateProjectionMatrix(); frameCamera();
}
function disposeModel() {
  if (!model) return;
  try {
    pivot.remove(model.root);
    const { THREE } = L;
    model.root.traverse(o => {
      if (o.geometry && o.geometry.dispose) o.geometry.dispose();
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      for (const m of mats) { for (const k of ["map", "alphaMap", "toonMap", "gradientMap"]) if (m[k] && m[k].dispose) m[k].dispose(); if (m.dispose) m.dispose(); }
    });
    if (THREE && THREE.Cache) { /* テクスチャは上の traverse で破棄済み */ }
  } catch (e) { console.error(e); }
  model = null; frameInfo = null; modelKey = "";
}

/* ============ モデルの読み込み ============ */
function pickMain(files) {
  const models = files.filter(f => isMmdFile(f.name));
  if (!models.length) return null;
  const shaped = models.find(f => /\.pmx$/i.test(f.name)) || models[0];
  const root = shaped.webkitRelativePath ? shaped.webkitRelativePath.split("/").slice(0, -1).join("/") : "";
  /* いちばん浅い場所にある .pmx を本命にする（フォルダ直下のモデル） */
  return models.slice().sort((a, b) => {
    const da = (a.webkitRelativePath || a.name).split("/").length, db = (b.webkitRelativePath || b.name).split("/").length;
    return da - db;
  })[0] || shaped;
}
async function doLoadModel(files, { restored = false, select = true, save = true } = {}) {
  if (!files || !files.length) { status("mmdFilesEmpty"); return; }
  if (files.length > MAX_FILES) { status("mmdTooManyFiles", { n:MAX_FILES }); return; }
  const main = pickMain(files);
  if (!main) { status("mmdNotMmd"); return; }
  if (main.size > MAX_PMX) { status("mmdTooBig", { n:120, m:40 }); return; }
  status("mmdLoading");
  try {
    try { L = await libs(); } catch (_) { throw fail("mmdNetError"); }
    if (!ensureScene()) throw fail("mmdNoWebGL");
    const idx = L.createMmdFileIndex ? L.createMmdFileIndex(files) : null;
    const textureResolver = idx ? { resolve: async path => {
      const p = String(path || "").replace(/\\/g, "/");
      return idx.resolve(p) || idx.resolve(p.replace(/^\.\//, "")) || idx.resolve(p.split("/").pop()) || undefined;
    } } : undefined;
    const loader = new L.ThreeMmdLoader(textureResolver ? { textureResolver } : undefined);
    const next = await loader.loadModel(main, { outline:true });
    if (!next || !next.root) throw fail("mmdLoadError");
    if (!pivot) throw fail("mmdNoWebGL");
    disposeModel();
    model = next; modelFiles = files; modelName = String(main.name).replace(/\.(pmx|pmd)$/i, "").slice(0, 60);
    pivot.add(model.root);
    model.root.traverse(o => { o.frustumCulled = false; });
    measure();
    await applyMotion(motionKind, { silent:true, fromRestore:true });
    status(restored ? "mmdRestored" : "mmdLoaded", { name:modelName });
    if (select) selectMmdMascot();
    if (save && !restored && settings.mmdRemember) {
      const keep = files.filter(f => f.size < 60 * MB).slice(0, MAX_FILES);
      await mmdDB.put("model", { files:keep, main:main.name, name:modelName, savedAt:Date.now() })
        .catch(() => status("mmdSaveFail"));
    }
  } catch (e) {
    console.error(e);
    status(e && e.key ? e.key : "mmdLoadError");
  }
}
const loadModelFiles = (files, opts) => enqueue(() => doLoadModel(files, opts));

/* ============ モーション ============ */
async function applyMotion(kind, { silent = false, fromRestore = false } = {}) {
  motionKind = kind || "none";
  if (!model) return;
  try {
    if (motionKind === "none") { anim = null; motionDur = 0; motionName = ""; }
    else if (motionKind === "auto") {                 // 🎲 曲のBPMにいちばん近い🎵を選ぶ（曲がなければ👀みてる）
      autoBpmUsed = songBpm();
      autoId = pickAuto(autoBpmUsed);
      const bytes = builtinBytes(autoId);
      anim = await newAnimLoader().loadAnimation(bytes);
      motionDur = BUILTIN[autoId].seconds; motionName = "🎲 " + tr(BUILTIN[autoId].label);
    }
    else if (BUILTIN[motionKind]) {
      const bytes = builtinBytes(motionKind);
      anim = await newAnimLoader().loadAnimation(bytes);
      motionDur = BUILTIN[motionKind].seconds; motionName = tr(BUILTIN[motionKind].label);
    } else if (motionKind === "file") {
      const rec = await mmdDB.get("motion");
      const file = (motionFiles && motionFiles[0]) || (rec && rec.file);
      if (!file) { motionKind = "none"; anim = null; motionDur = 0; return; }
      if (file.size > MAX_VMD) { status("mmdTooBig", { n:120, m:40 }); return; }
      anim = await newAnimLoader().loadAnimation(file);
      const frames = (anim && anim.animation && anim.animation.metadata && anim.animation.metadata.maxFrame) || 0;
      motionDur = Math.max(0.5, frames / FPS); motionName = String(file.name).replace(/\.vmd$/i, "").slice(0, 60);
    }
    if (anim && model.setAnimation) model.setAnimation(anim);
    if (!fromRestore && motionKind !== "file") { settings.mmdMotionKind = motionKind; saveUserPrefs(); }  // 選択を記憶（次回も同じモーション）
    if (!fromRestore && !silent && motionKind === "file") status("mmdVmdLoaded", { name:motionName });
  } catch (e) {
    console.error(e);
    anim = null; motionDur = 0;
    if (motionKind === "file") { motionKind = "none"; status("mmdVmdBad"); }
  }
  renderMotionList();
}
function newAnimLoader() { return new L.ThreeMmdLoader(); }
let motionFiles = null;
async function doLoadMotion(file, { restored = false } = {}) {
  if (!file) return;
  if (!isVmdFile(file.name)) { status("mmdVmdBad"); return; }
  if (file.size > MAX_VMD) { status("mmdTooBig", { n:120, m:40 }); return; }
  if (!model) { status("mmdNoModel"); return; }
  try { L = await libs(); } catch (_) { status("mmdNetError"); return; }
  motionFiles = [file];
  await applyMotion("file", { fromRestore:restored });
  if (!restored && settings.mmdRemember) await mmdDB.put("motion", { file, name:file.name, savedAt:Date.now() }).catch(() => {});
  renderMotionList();
}
const loadMotionFile = (file, opts) => enqueue(() => doLoadMotion(file, opts));

/* ============ 姿勢とBPM（毎フレーム） ============ */
/* モーションの速さ：曲のBPM ÷ モーションの基準BPM。
   基準BPM（mmdBpm）が 0 のときは、内蔵モーションは自分の bpm で曲に自動シンク（持ち込みVMDは固定のまま）。
   👀 fixed:true のモーションと、🎲おまかせで選ばれた fixed は、いつも等速 */
const songBpm = () => (typeof chartMeta !== "undefined" && chartMeta && chartMeta.bpm) || 0;
function motionRate() {
  const cur = BUILTIN[motionKind === "auto" ? autoId : motionKind];
  if (cur && cur.fixed) return 1;
  const own = (cur && cur.bpm) || 0;
  const mb = settings.mmdMotionBpm || own, sb = songBpm();
  return (mb && sb) ? Math.min(3, Math.max(0.25, sb / mb)) : 1;
}
/* 🎲 おまかせ：曲のBPMにいちばん近い🎵（bpm持ちの内蔵）を選ぶ。曲のBPMが不明なら 👀みてる */
let autoId = "watch", autoBpmUsed = -1;
function pickAuto(bpm) {
  if (!bpm) return "watch";
  let best = "step", d = Infinity;
  for (const [id, m] of Object.entries(BUILTIN)) {
    if (!m.bpm || m.fixed) continue;
    const dd = Math.abs(bpm - m.bpm);
    if (dd < d) { d = dd; best = id; }
  }
  return best;
}
function pose(time) {
  if (!model) return;
  const rate = motionRate();
  const t = motionDur ? (time * rate) % motionDur : (time * rate);
  try { model.update(t); } catch (e) { console.error(e); }
}

/* ============ 描画ループ（必要なときだけ描く） ============ */
function animate(now) {
  requestAnimationFrame(animate);
  if (model && motionKind === "auto" && songBpm() !== autoBpmUsed) {  // 🎲 曲が変わったら選びなおす（画面に出ていなくても）
    autoBpmUsed = songBpm();
    enqueue(() => applyMotion("auto", { silent:true, fromRestore:true }));
  }
  playing = !!model && phase !== "title" && activeMascot() === "mmd";
  canvas.hidden = !playing;
  const panel = $("mmdPanel");
  const previewOn = !!model && phase === "title" && screen === "settings" && !!panel && panel.open && !!prev;
  if (!playing && !previewOn) { lastT = now; return; }
  const dt = Math.min(0.1, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
  try {
    applyRect(); applyModelTransform();
    clock += dt;
    pose(clock);
    if (renderer && scene && camera) renderer.render(scene, camera);
    if (previewOn && pctx) {
      pctx.clearRect(0, 0, prev.width, prev.height);
      const a = canvas.width / canvas.height, dh = prev.height, dw = dh * a;
      pctx.drawImage(canvas, (prev.width - dw) / 2, 0, dw, dh);
    }
  } catch (e) { console.error(e); }
}
requestAnimationFrame(animate);

/* ============ 画面の組み立て ============ */
/* ---------- 🔎 動作チェック（実機で「どこまで動くか」を1か所に出す） ----------
   実機で確かめるときは、設定 → 🩷 MMDマスコット → 🔎 動作チェック を押して、
   出てきた行をコピーして貼ってもらえれば、こちらで原因を切り分けられます。 */
let lastCheck = "", lastCheckObj = null;
async function diagnose() {
  const r = {
    at:new Date().toISOString().slice(0, 19).replace("T", " "),
    secure:(typeof location !== "undefined" && location.protocol === "https:"),
    online:(typeof navigator !== "undefined" ? navigator.onLine : null),
    webgl:null, gpu:"", three:"", loader:false, fileIndex:false, libError:"",
    safe:safeNow(), model:modelName || null, files:modelFiles.length,
    motion:motionKind, motionName:motionName || null, rate:motionRate(),
    canvas:(canvas ? `${canvas.width}x${canvas.height}` : "none"),
    ua:(typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 96) : "")
  };
  /* ① WebGL（3Dを描けるか。ここが NG なら、モデルより先に環境の問題） */
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    r.webgl = !!gl;
    if (gl) {
      const d = gl.getExtension("WEBGL_debug_renderer_info");
      r.gpu = String(d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : "(hidden)").slice(0, 72);
    }
  } catch (e) { r.webgl = false; r.libError = String((e && e.message) || e).slice(0, 120); }
  /* ② CDN から three と three-mmd-loader を読めるか */
  try {
    const lib = await libs();
    r.three = (lib && lib.THREE && lib.THREE.REVISION) ? String(lib.THREE.REVISION) : "?";
    r.loader = !!(lib && lib.ThreeMmdLoader);
    r.fileIndex = typeof lib.createMmdFileIndex === "function";
  } catch (e) { r.libError = String((e && (e.message || e)) || "error").slice(0, 160); }
  return r;
}
function checkText(r) {
  r = r || {};
  return [
    `trk! MMD check  ${r.at || ""}`,
    `webgl=${r.webgl}${r.gpu ? " (" + r.gpu + ")" : ""}  secure=${r.secure}  online=${r.online}  safe=${r.safe}`,
    `three=${r.three || "NG"}  loader=${!!r.loader}  fileIndex=${!!r.fileIndex}`,
    r.libError ? `libError=${r.libError}` : "",
    `model=${r.model || "(none)"}  files=${r.files == null ? "-" : r.files}`,
    `motion=${r.motion || "none"}${r.motionName ? " (" + r.motionName + ")" : ""}  rate=${r.rate}`,
    `canvas=${r.canvas}`,
    `ua=${r.ua || ""}`
  ].filter(Boolean).join("\n");
}
function copyText(t) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(() => status("mmdCopied"), () => status("mmdCopyNg")); return true; }
  } catch (_) {}
  try {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.append(ta); ta.select();
    const ok = document.execCommand && document.execCommand("copy");
    ta.remove();
    status(ok ? "mmdCopied" : "mmdCopyNg");
  } catch (_) { status("mmdCopyNg"); }
  return false;
}
async function runCheck() {
  const out = $("mmdCheckOut");
  status("mmdCheckRunning");
  if (out) { out.hidden = false; out.textContent = tr("mmdCheckRunning"); }
  let r;
  try { r = await diagnose(); } catch (e) { r = { at:"", webgl:false, libError:String((e && e.message) || e) }; }
  lastCheckObj = r;
  lastCheck = checkText(r);
  if (out) { out.textContent = lastCheck; out.hidden = false; }
  const ok = !!(r.webgl && r.three && r.loader);
  status(ok ? "mmdCheckOk" : "mmdCheckNg");
  try { console.log("[trk! MMD check]\n" + lastCheck); } catch (_) {}
  return r;
}

function setAgreeUI() {
  const on = !!settings.mmdAgreed;
  for (const id of ["mmdModelFile", "mmdFolderFile", "mmdMotionFile"]) {
    const inp = $(id); if (inp) inp.disabled = !on;
    const lab = inp && inp.closest("label"); if (lab) lab.classList.toggle("disabled", !on);
  }
}
function selectMmdMascot() { settings.mascot = "mmd"; saveUserPrefs(); updateMascotUI(); status("mmdSelected"); }
function renderMotionList() {
  const sel = $("mmdMotionSelect");
  if (!sel) return;
  const keep = motionKind;
  sel.textContent = "";
  const opt = document.createElement("option"); opt.value = "none"; opt.textContent = tr("mmdMotionNone"); sel.append(opt);
  const oa = document.createElement("option"); oa.value = "auto"; oa.textContent = tr("mmdMotionAuto"); sel.append(oa);
  for (const id of Object.keys(BUILTIN)) {
    const o = document.createElement("option"); o.value = id; o.textContent = tr(BUILTIN[id].label); o.dataset.builtin = "1"; sel.append(o);
  }
  if (anim && keep === "file") { const o = document.createElement("option"); o.value = "file"; o.textContent = "🎬 " + (motionName || "VMD"); sel.append(o); }
  sel.value = (keep === "file" && !anim) ? "none" : keep;
}
function syncUI() {
  const box = $("mmdInfo");
  if (box) {
    box.textContent = "";
    const add = (k, v) => { const d = el("div", "", `${tr(k)}: ${v}`); box.append(d); };
    if (modelName) add("mmdModelHead", modelName);
    if (motionName) add("mmdMotionHead", motionName);
    if (!modelName && !motionName) box.append(el("div", "hint", tr("mmdHint")));
  }
  const size = $("mmdSize"), sizeVal = $("mmdSizeVal");
  if (size) { size.value = settings.mmdScale; if (sizeVal) sizeVal.textContent = Math.round(settings.mmdScale * 100) + "%"; }
  const turn = $("mmdTurn"), turnVal = $("mmdTurnVal");
  if (turn) { turn.value = settings.mmdTurn; if (turnVal) turnVal.textContent = settings.mmdTurn + "°"; }
  const mb = $("mmdBpm"); if (mb) mb.value = settings.mmdMotionBpm;
  const cr = $("mmdCredit"); if (cr && document.activeElement !== cr) cr.value = settings.mmdCredit || "";
  const rem = $("mmdRemember"); if (rem) rem.checked = settings.mmdRemember !== false;
  const ag = $("mmdAgree"); if (ag) ag.checked = !!settings.mmdAgreed;
  setAgreeUI(); renderMotionList();
}

addEventListener("DOMContentLoaded", () => {
  if (!canvas || !$("mmdPanel")) return;

  $("mmdAgree").addEventListener("change", e => {
    settings.mmdAgreed = !!e.target.checked; saveUserPrefs(); setAgreeUI();
    if (settings.mmdAgreed) status("mmdHint"); else status("mmdNoAgree");
  });
  $("mmdModelFile").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!settings.mmdAgreed) { status("mmdNoAgree"); return; }
    if (!isMmdFile(f.name)) { status("mmdNotMmd"); return; }
    motionFiles = null;
    loadModelFiles([f]);
  });
  $("mmdFolderFile").addEventListener("change", e => {
    const files = [...(e.target.files || [])]; e.target.value = "";
    if (!settings.mmdAgreed) { status("mmdNoAgree"); return; }
    if (!files.length) { status("mmdFilesEmpty"); return; }
    motionFiles = null;
    loadModelFiles(files);
  });
  $("mmdMotionFile").addEventListener("change", e => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!settings.mmdAgreed) { status("mmdNoAgree"); return; }
    loadMotionFile(f);
  });
  $("mmdMotionSelect").addEventListener("change", e => loadMotionKind(e.target.value));
  $("mmdClearModel").addEventListener("click", () => {
    disposeModel(); motionKind = "none"; anim = null; motionDur = 0; motionName = "";
    canvas.hidden = true; motionFiles = null;
    mmdDB.del("model").catch(() => {}); mmdDB.del("motion").catch(() => {});
    syncUI(); status("mmdClearModel");
  });
  $("mmdClearMotion").addEventListener("click", () => {
    motionFiles = null; motionKind = "none"; anim = null; motionDur = 0; motionName = "";
    mmdDB.del("motion").catch(() => {});
    syncUI(); status("mmdClearMotion");
  });
  $("mmdSize").addEventListener("input", e => { settings.mmdScale = Number(e.target.value) || 1; $("mmdSizeVal").textContent = Math.round(settings.mmdScale * 100) + "%"; });
  $("mmdSize").addEventListener("change", () => saveUserPrefs());
  $("mmdTurn").addEventListener("input", e => { settings.mmdTurn = Number(e.target.value) || 0; $("mmdTurnVal").textContent = settings.mmdTurn + "°"; });
  $("mmdTurn").addEventListener("change", () => saveUserPrefs());
  $("mmdBpm").addEventListener("change", e => { settings.mmdMotionBpm = Math.max(0, Math.min(300, Number(e.target.value) || 0)); saveUserPrefs(); });
  $("mmdCredit").addEventListener("input", e => { settings.mmdCredit = String(e.target.value).slice(0, 120); });
  $("mmdCredit").addEventListener("change", () => saveUserPrefs());
  $("mmdRemember").addEventListener("change", e => {
    settings.mmdRemember = !!e.target.checked; saveUserPrefs();
    if (!settings.mmdRemember) { mmdDB.del("model").catch(() => {}); mmdDB.del("motion").catch(() => {}); }
  });

  $("mmdCheckBtn").addEventListener("click", () => { enqueue(runCheck); });
  $("mmdCopyBtn").addEventListener("click", () => {
    if (!lastCheck) { enqueue(async () => { await runCheck(); copyText(lastCheck); }); return; }
    copyText(lastCheck);
  });

  on("language", () => { syncUI(); renderPresetRow(); });

  /* 前回のモデルを戻す（覚える設定のときだけ・セーフモードでは何もしない） */
  syncUI();
  if (safeNow()) { status("mmdSafe"); return; }
  enqueue(findPresets);                              // 💠 同梱モデルがあればボタンを出す（無ければ何もしない）
  if (settings.mmdRemember) enqueue(async () => {
    try {
      const rec = await mmdDB.get("model");
      if (rec && rec.files && rec.files.length) {
        settings.mmdAgreed = true; syncUI();
        const keep = settings.mmdMotionKind;                           // 記憶したモーション（none/auto/内蔵）
        if (keep && (keep === "auto" || BUILTIN[keep])) motionKind = keep;
        await doLoadModel(rec.files, { restored:true, select:false, save:false });
        const m = await mmdDB.get("motion");
        if (m && m.file) await doLoadMotion(m.file, { restored:true });
      }
    } catch (_) {}
  });
});

function loadMotionKind(kind) {
  if (kind === "file" && !motionFiles) {
    const rec = mmdDB.get("motion").catch(() => null);
    enqueue(async () => { const r = await rec; if (r && r.file) { motionFiles = [r.file]; await applyMotion("file"); } else { renderMotionList(); } });
    return;
  }
  enqueue(() => applyMotion(kind));
}

/* ============ 窓口（テスト・コンソールから） ============ */
window.TrkMMD = {
  version: 1,
  lib: MMD_LIB,
  key: "shadow_taiko_mmd",
  /* テスト用：3Dの部品を差し替える（本番では使いません） */
  _injectLibs(fake) { injected = fake; L = fake; },
  _builtin: id => builtinBytes(id),
  _sjis: (s, n) => Array.from(sjisFix(s, n)),
  builtins: () => Object.keys(BUILTIN),
  motions: () => Object.entries(BUILTIN).map(([id, m]) => ({ id, bpm:m.bpm, seconds:m.seconds })),
  presets: () => presets.map(p => ({ dir:p.dir, label:p.man.label })),
  findPresets: () => enqueue(findPresets),
  loadPreset: dir => { const p = presets.find(x => x.dir === dir); if (p) enqueue(() => doLoadPreset(p)); },
  model: () => model ? { name:modelName, files:modelFiles.length } : null,
  motion: () => ({ kind:motionKind, name:motionName, duration:motionDur, anim:!!anim }),
  setMotion: kind => loadMotionKind(kind),
  loadModel: files => loadModelFiles(Array.isArray(files) ? files : [files]),
  loadMotion: file => loadMotionFile(file),
  clear: () => { disposeModel(); anim = null; motionKind = "none"; motionDur = 0; motionName = ""; canvas.hidden = true; },
  select: selectMmdMascot,
  diagnose: () => diagnose(),
  check: () => runCheck(),
  checkText: r => checkText(r || lastCheckObj),
  lastCheck: () => lastCheck,
  isPlaying: () => playing,
  clock: () => clock,
  rate: motionRate,
  info: () => ({ model:modelName, motion:motionName, kind:motionKind, dur:motionDur, scale:settings.mmdScale, turn:settings.mmdTurn, agreed:!!settings.mmdAgreed })
};
})();
/* ✅ mmd.js 完了 */
