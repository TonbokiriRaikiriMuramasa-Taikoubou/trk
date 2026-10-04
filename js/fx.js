// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! fx.js — 🎛 サウンドエフェクト（EQ・エフェクター・ゲーム連動・マイプリセット）

   【目次】
     ① 文章            ② 設定             ③ エフェクトの検証（trk-fx）
     ④ プリセット       ⑤ 音の部品         ⑥ エフェクトを作る（mk）
     ⑦ 音の通り道       ⑧ タイミング自動補正 ⑨ ゲーム連動
     ⑩ 操作            ⑪ 譜面・記録への保存 ⑫ 設定画面
     ⑬ 選曲画面のメニュー ⑭ 表示の同期      ⑮ 窓口（window.TrkFX）  ⑯ 起動

   【音の通り道】
     video → [プリセット] → [かんたんEQ 5バンド] → [ゲーム連動] → [音量] → ([リミッター]) → [出口 G.out] → スピーカー

   【約束】
   ・オンにするまでは音の通り道を変えない。createMediaElementSource(video) は一度だけ（2回目はエラー）
     音を使う機能は、新しく作らず TrkFX.tap() を使う
   ・譜面のタイミングは変えない：音程や再生位置を動かすエフェクトは入れない
   ・外から読むJSON（trk-fx）は、決められた種類と範囲の値だけ。プログラムは実行しない
   ・文章キーは sfx…（stagefx.js の fx… と重ならないように）
   ・包んでいる関数：gameTime（game.js）、chartToData・applyChartData（media.js）
   ・内蔵プリセットは js/fx-presets.js（TRK_FX_PRESETS、115個で打ち止め）
   ・保存：設定は settings.fx…（お気に入り fxFav・最近 fxRecent も）、マイプリセットは trk_fx_presets_v1

   読み込み順：extras.js → fx-presets.js → fx.js → library.js
   ========================================================================== */
"use strict";
(() => {

/* ============ ① 文章 ============ */
Object.assign(TEXT.ja, {
  sfxTitle:"🎛 サウンドエフェクト（EQ・エフェクター）", sfxOn:"エフェクトを使う",
  sfxHint:"曲の聴こえ方を変えます。リバーブなどの響きは元の音に重ねるだけです。記録には影響しません。",
  sfxPresetLabel:"プリセット", sfxCatBasic:"基本", sfxCatGenre:"ジャンル", sfxCatScene:"シーン", sfxCatSpace:"空間",
  sfxCatGame:"ゲーム", sfxCatFun:"おもしろ", sfxCatWeird:"ちょっと変", sfxCatCustom:"マイプリセット",
  sfxCatFav:"★ お気に入り", sfxCatRecent:"🕘 最近使った",
  sfxSearch:"🔍 プリセットを探す（名前・説明・作者）", sfxNoMatch:"見つかりません。", sfxHits:"{n}個見つかりました",
  sfxFavAdd:"☆ お気に入りに追加", sfxFavRemove:"★ お気に入りから外す",
  sfxPrev:"前のプリセット", sfxNext:"次のプリセット", sfxRandom:"おまかせ（ランダム）",
  sfxCompare:"👂 押している間だけ元の音", sfxCompareHint:"押している間だけ、エフェクトなしの音になります",
  sfxEqLabel:"かんたんEQ（プリセットに重ねてかかります）", sfxEqReset:"↺ EQをリセット", sfxVolume:"エフェクト後の音量", sfxLimiter:"音割れを防ぐ（リミッター）",
  sfxGameTitle:"🎮 ゲーム連動エフェクト（プレイ中だけ）", sfxGameMiss:"ミスすると一瞬こもる", sfxGameCombo:"コンボが続くと音が華やかになる",
  sfxGamePinch:"体力が少ないと、こもって心音のように揺れる", sfxGameBlast:"🚀 ぶっ飛ばし中は音が明るく派手になる（CATCH）",
  sfxGamePan:"トラックの位置に合わせて左右に動く（CATCH）",
  sfxSyncTitle:"⏱ タイミングと記録", sfxComp:"エフェクトによる音の遅れを、ノーツのタイミングで自動補正する",
  sfxCompExtra:"補正の微調整", sfxCompNow:"いまの自動補正：約 {n}ms",
  sfxCompHint:"Web Audioを通る分と、コンプレッサー・リミッター（1つにつき約6ms）の遅れを足して補正します。目安の値なので、ずれを感じたら微調整してください。「⌨ 操作」のタイミング補正とは別に足されます。",
  sfxRecord:"譜面を書き出すとき、使っているエフェクトも記録する", sfxChartLoad:"譜面に記録されたエフェクトを読み込んで使う",
  sfxChartApplied:"📄 譜面に記録されたエフェクト「{name}」を使っています", sfxResult:"🎛 エフェクト：{name}",
  sfxRecent:"🎛 この曲で最近使ったエフェクト：{name}", sfxUseThis:"このエフェクトを使う", sfxApplied:"エフェクトを「{name}」にしました。",
  sfxCustomTitle:"🧩 マイプリセット（MOD）",
  sfxCustomHint:"今の設定をJSONで書き出して編集し、読み込むと自分のプリセットになります。\"author\" と \"url\" を書くと、作者名とリンクが表示されます。プログラムは実行せず、決められたエフェクトの組み合わせだけを読み込むので安全です。",
  sfxExport:"⇩ 今の設定をJSONで書き出す", sfxImport:"⇧ JSONを読み込む", sfxDelete:"🗑 このマイプリセットを消す",
  sfxEditor:"上級者向け：JSONを直接編集", sfxApply:"✓ 適用して保存", sfxBy:"作者：{name}",
  sfxSaved:"マイプリセット「{name}」を保存しました。", sfxBad:"エフェクトのJSONが正しくありません。", sfxDeleted:"マイプリセットを消しました。",
  sfxLimit:"マイプリセットは30個までです。", sfxExported:"エフェクトのJSONを書き出しました。", sfxUnsupported:"このブラウザではエフェクトを使えません。",
  sfxConfirmDelete:"このマイプリセットを消しますか？", sfxQuick:"🎛 エフェクト", sfxOff:"オフ"
});
Object.assign(TEXT.en, {
  sfxTitle:"🎛 Sound effects (EQ & effects)", sfxOn:"Use sound effects",
  sfxHint:"Changes how songs sound. Reverb and echo are layered on top of the original. Records are not affected.",
  sfxPresetLabel:"Presets", sfxCatBasic:"Basic", sfxCatGenre:"Genre", sfxCatScene:"Scene", sfxCatSpace:"Space",
  sfxCatGame:"Game", sfxCatFun:"Fun", sfxCatWeird:"Weird", sfxCatCustom:"My presets",
  sfxCatFav:"★ Favorites", sfxCatRecent:"🕘 Recent",
  sfxSearch:"🔍 Search presets (name, description, author)", sfxNoMatch:"No matches.", sfxHits:"{n} found",
  sfxFavAdd:"☆ Add to favorites", sfxFavRemove:"★ Remove from favorites",
  sfxPrev:"Previous preset", sfxNext:"Next preset", sfxRandom:"Surprise me (random)",
  sfxCompare:"👂 Hold to hear the original", sfxCompareHint:"While held, you hear the song without effects",
  sfxEqLabel:"Quick EQ (applied on top of the preset)", sfxEqReset:"↺ Reset EQ", sfxVolume:"Output volume", sfxLimiter:"Prevent clipping (limiter)",
  sfxGameTitle:"🎮 Game-reactive effects (during play only)", sfxGameMiss:"Muffle briefly on a miss", sfxGameCombo:"Get brighter as your combo grows",
  sfxGamePinch:"Muffle and pulse like a heartbeat when lives are low", sfxGameBlast:"🚀 Brighter and bolder during Blast mode (CATCH)",
  sfxGamePan:"Pan with the truck's position (CATCH)",
  sfxSyncTitle:"⏱ Timing & records", sfxComp:"Auto-compensate note timing for effect latency",
  sfxCompExtra:"Fine-tune", sfxCompNow:"Current compensation: about {n} ms",
  sfxCompHint:"Adds the Web Audio path latency plus about 6 ms per compressor/limiter. It's an estimate, so fine-tune it if timing feels off. This is added on top of the latency setting in “⌨ Controls”.",
  sfxRecord:"Save the current effect when exporting charts", sfxChartLoad:"Use effects saved in charts",
  sfxChartApplied:"📄 Using the chart's effect “{name}”", sfxResult:"🎛 Effect: {name}",
  sfxRecent:"🎛 Recently used on this song: {name}", sfxUseThis:"Use this effect", sfxApplied:"Effect set to “{name}”.",
  sfxCustomTitle:"🧩 My presets (MOD)",
  sfxCustomHint:"Export the current settings as JSON, edit it, and import it to make your own preset. Add \"author\" and \"url\" to show your name and a link. No code is run — only a fixed set of effects is loaded, so it's safe.",
  sfxExport:"⇩ Export current as JSON", sfxImport:"⇧ Import JSON", sfxDelete:"🗑 Delete this preset",
  sfxEditor:"Advanced: edit JSON directly", sfxApply:"✓ Apply & save", sfxBy:"by {name}",
  sfxSaved:"Saved “{name}”.", sfxBad:"Invalid effect JSON.", sfxDeleted:"Preset deleted.",
  sfxLimit:"You can have up to 30 presets.", sfxExported:"Effect JSON exported.", sfxUnsupported:"Sound effects aren't available in this browser.",
  sfxConfirmDelete:"Delete this preset?", sfxQuick:"🎛 Sound", sfxOff:"Off"
});
Object.assign(TEXT.zh, {
  sfxTitle:"🎛 音效（均衡器・效果器）", sfxOn:"使用音效",
  sfxHint:"改变歌曲的听感。混响等只是叠加在原声上。不影响记录。",
  sfxPresetLabel:"预设", sfxCatBasic:"基本", sfxCatGenre:"曲风", sfxCatScene:"场景", sfxCatSpace:"空间",
  sfxCatGame:"游戏", sfxCatFun:"趣味", sfxCatWeird:"奇怪", sfxCatCustom:"我的预设",
  sfxCatFav:"★ 收藏", sfxCatRecent:"🕘 最近使用",
  sfxSearch:"🔍 搜索预设（名称・说明・作者）", sfxNoMatch:"没有结果。", sfxHits:"找到{n}个",
  sfxFavAdd:"☆ 加入收藏", sfxFavRemove:"★ 取消收藏",
  sfxPrev:"上一个预设", sfxNext:"下一个预设", sfxRandom:"随机",
  sfxCompare:"👂 按住听原声", sfxCompareHint:"按住期间播放没有音效的原声",
  sfxEqLabel:"简易均衡器（叠加在预设上）", sfxEqReset:"↺ 重置均衡器", sfxVolume:"输出音量", sfxLimiter:"防止破音（限幅器）",
  sfxGameTitle:"🎮 游戏联动音效（仅游戏中）", sfxGameMiss:"失误时声音短暂变闷", sfxGameCombo:"连击越多声音越华丽",
  sfxGamePinch:"体力低时声音变闷并像心跳一样起伏", sfxGameBlast:"🚀 狂飙中声音更明亮（CATCH）",
  sfxGamePan:"声音随卡车位置左右移动（CATCH）",
  sfxSyncTitle:"⏱ 时机与记录", sfxComp:"自动补偿音效造成的声音延迟（调整音符时机）",
  sfxCompExtra:"微调", sfxCompNow:"当前自动补偿：约 {n}ms",
  sfxCompHint:"补偿经过Web Audio的延迟，以及每个压缩器・限幅器约6ms的延迟。这是估计值，感觉有偏差时请微调。会在“⌨ 操作”的延迟补偿之外另行叠加。",
  sfxRecord:"导出谱面时一并记录当前音效", sfxChartLoad:"读取并使用谱面中记录的音效",
  sfxChartApplied:"📄 正在使用谱面记录的音效“{name}”", sfxResult:"🎛 音效：{name}",
  sfxRecent:"🎛 本曲最近使用的音效：{name}", sfxUseThis:"使用此音效", sfxApplied:"已切换为音效“{name}”。",
  sfxCustomTitle:"🧩 我的预设（MOD）",
  sfxCustomHint:"将当前设置导出为JSON，编辑后导入即可成为自己的预设。写上 \"author\" 和 \"url\" 会显示作者名和链接。不会执行程序，只读取规定的效果组合，很安全。",
  sfxExport:"⇩ 导出当前设置为JSON", sfxImport:"⇧ 导入JSON", sfxDelete:"🗑 删除此预设",
  sfxEditor:"进阶：直接编辑JSON", sfxApply:"✓ 应用并保存", sfxBy:"作者：{name}",
  sfxSaved:"已保存“{name}”。", sfxBad:"音效JSON格式不正确。", sfxDeleted:"已删除预设。",
  sfxLimit:"我的预设最多30个。", sfxExported:"已导出音效JSON。", sfxUnsupported:"此浏览器无法使用音效。",
  sfxConfirmDelete:"要删除此预设吗？", sfxQuick:"🎛 音效", sfxOff:"关闭"
});
Object.assign(TEXT.ko, {
  sfxTitle:"🎛 사운드 이펙트 (EQ・이펙터)", sfxOn:"이펙트 사용",
  sfxHint:"곡이 들리는 방식을 바꿉니다. 리버브 등은 원음에 겹칠 뿐입니다. 기록에는 영향이 없습니다.",
  sfxPresetLabel:"프리셋", sfxCatBasic:"기본", sfxCatGenre:"장르", sfxCatScene:"상황", sfxCatSpace:"공간",
  sfxCatGame:"게임", sfxCatFun:"재미", sfxCatWeird:"조금 이상한", sfxCatCustom:"내 프리셋",
  sfxCatFav:"★ 즐겨찾기", sfxCatRecent:"🕘 최근 사용",
  sfxSearch:"🔍 프리셋 검색 (이름・설명・제작자)", sfxNoMatch:"결과가 없습니다.", sfxHits:"{n}개 찾음",
  sfxFavAdd:"☆ 즐겨찾기에 추가", sfxFavRemove:"★ 즐겨찾기에서 빼기",
  sfxPrev:"이전 프리셋", sfxNext:"다음 프리셋", sfxRandom:"랜덤",
  sfxCompare:"👂 누르는 동안 원음", sfxCompareHint:"누르고 있는 동안 이펙트 없는 소리가 납니다",
  sfxEqLabel:"간단 EQ (프리셋 위에 겹쳐 적용)", sfxEqReset:"↺ EQ 초기화", sfxVolume:"출력 음량", sfxLimiter:"소리 깨짐 방지 (리미터)",
  sfxGameTitle:"🎮 게임 연동 이펙트 (플레이 중에만)", sfxGameMiss:"미스하면 잠깐 소리가 먹먹해짐", sfxGameCombo:"콤보가 이어지면 소리가 화려해짐",
  sfxGamePinch:"체력이 적으면 먹먹해지고 심장 소리처럼 울림", sfxGameBlast:"🚀 폭주 중에는 소리가 밝고 화려해짐 (CATCH)",
  sfxGamePan:"트럭 위치에 맞춰 좌우로 이동 (CATCH)",
  sfxSyncTitle:"⏱ 타이밍과 기록", sfxComp:"이펙트로 인한 소리 지연을 노트 타이밍에서 자동 보정",
  sfxCompExtra:"미세 조정", sfxCompNow:"현재 자동 보정: 약 {n}ms",
  sfxCompHint:"Web Audio를 거치는 지연과, 컴프레서・리미터 하나당 약 6ms의 지연을 더해 보정합니다. 추정값이므로 어긋남이 느껴지면 미세 조정하세요. '⌨ 조작'의 지연 보정과는 별도로 더해집니다.",
  sfxRecord:"채보를 내보낼 때 사용 중인 이펙트도 기록", sfxChartLoad:"채보에 기록된 이펙트를 불러와 사용",
  sfxChartApplied:"📄 채보에 기록된 이펙트 '{name}' 사용 중", sfxResult:"🎛 이펙트: {name}",
  sfxRecent:"🎛 이 곡에서 최근 사용한 이펙트: {name}", sfxUseThis:"이 이펙트 사용", sfxApplied:"이펙트를 '{name}'(으)로 바꿨습니다.",
  sfxCustomTitle:"🧩 내 프리셋 (MOD)",
  sfxCustomHint:"현재 설정을 JSON으로 내보내 편집한 뒤 불러오면 나만의 프리셋이 됩니다. \"author\"와 \"url\"을 쓰면 제작자 이름과 링크가 표시됩니다. 프로그램은 실행하지 않고 정해진 이펙트 조합만 읽으므로 안전합니다.",
  sfxExport:"⇩ 현재 설정을 JSON으로 내보내기", sfxImport:"⇧ JSON 불러오기", sfxDelete:"🗑 이 프리셋 삭제",
  sfxEditor:"고급: JSON 직접 편집", sfxApply:"✓ 적용하고 저장", sfxBy:"제작: {name}",
  sfxSaved:"'{name}'을(를) 저장했습니다.", sfxBad:"이펙트 JSON 형식이 올바르지 않습니다.", sfxDeleted:"프리셋을 삭제했습니다.",
  sfxLimit:"내 프리셋은 최대 30개입니다.", sfxExported:"이펙트 JSON을 내보냈습니다.", sfxUnsupported:"이 브라우저에서는 이펙트를 사용할 수 없습니다.",
  sfxConfirmDelete:"이 프리셋을 삭제할까요?", sfxQuick:"🎛 사운드", sfxOff:"끄기"
});

/* ============ ② 設定 ============ */
const FX_STORE = "trk_fx_presets_v1", FX_MAX = 30, TEMP_ID = "__chart", RECENT_MAX = 5, FAV_MAX = 40;
const GAME_DEF = { miss:true, combo:true, pinch:false, blast:true, pan:false };
const EQ_BANDS = [["lowshelf", 60, "60Hz"], ["peaking", 250, "250Hz"], ["peaking", 1000, "1kHz"], ["peaking", 4000, "4kHz"], ["highshelf", 12000, "12kHz"]];
const idList = (v, max) => Array.isArray(v) ? [...new Set(v.filter(x => typeof x === "string" && /^[a-z0-9_]{1,40}$/.test(x)))].slice(0, max) : [];
settings.fxOn = !!prefs.fxOn;
settings.fxPreset = typeof prefs.fxPreset === "string" ? prefs.fxPreset.slice(0, 40) : "flat";
if (settings.fxPreset === TEMP_ID) settings.fxPreset = "flat";   // 一時プリセットは保存しないので、起動時はフラットに戻す
settings.fxEq = Array.isArray(prefs.fxEq) && prefs.fxEq.length === 5 ? prefs.fxEq.map(v => num(v, -12, 12, 0)) : [0, 0, 0, 0, 0];
settings.fxVolume = num(prefs.fxVolume, -12, 6, 0);
settings.fxLimiter = prefs.fxLimiter !== false;
settings.fxComp = prefs.fxComp !== false;
settings.fxCompExtra = num(prefs.fxCompExtra, -50, 50, 0);
settings.fxRecord = prefs.fxRecord !== false;
settings.fxChartLoad = prefs.fxChartLoad !== false;
settings.fxFav = idList(prefs.fxFav, FAV_MAX);
settings.fxRecent = idList(prefs.fxRecent, RECENT_MAX);
settings.fxGame = {};
for (const k of Object.keys(GAME_DEF)) settings.fxGame[k] = prefs.fxGame && typeof prefs.fxGame[k] === "boolean" ? prefs.fxGame[k] : GAME_DEF[k];

/* ============ ③ エフェクトの検証（決められた種類と範囲だけ） ============ */
const R = (v, lo, hi, d) => num(Number(v), lo, hi, d);
const str = (v, n) => typeof v === "string" ? v.trim().slice(0, n) : "";
const HTTPS = /^https:\/\/[^\s"'<>]+$/;
const BIQUAD = ["lowshelf", "highshelf", "peaking", "lowpass", "highpass", "bandpass", "notch"];
const SWEEP_F = ["lowpass", "highpass", "bandpass"];
const NOISES = ["pink", "vinyl", "tape", "rain", "wind", "fire", "crowd"];
function cleanFx(f) {
  if (!f || typeof f !== "object") return null;
  switch (f.type) {
    case "eq": {
      const bands = (Array.isArray(f.bands) ? f.bands : []).slice(0, 10).filter(b => b && BIQUAD.includes(b.type))
        .map(b => ({ type:b.type, freq:R(b.freq, 20, 20000, 1000), gain:R(b.gain, -24, 24, 0), q:R(b.q, .1, 18, .8) }));
      return bands.length ? { type:"eq", bands } : null;
    }
    case "comp": return { type:"comp", threshold:R(f.threshold, -60, 0, -24), ratio:R(f.ratio, 1, 20, 3), attack:R(f.attack, 0, 1, .01),
      release:R(f.release, .01, 1, .25), knee:R(f.knee, 0, 40, 10), makeup:R(f.makeup, 0, 24, 0) };
    case "gain": return { type:"gain", db:R(f.db, -24, 12, 0) };
    case "width": return { type:"width", amount:R(f.amount, 0, 2, 1) };
    case "vocalCut": return { type:"vocalCut", amount:R(f.amount, 0, 1, .9), keepBass:R(f.keepBass, 40, 400, 150) };
    case "delay": return { type:"delay", beats:R(f.beats, 0, 4, 0), ms:R(f.ms, 1, 2000, 300), feedback:R(f.feedback, 0, .9, .3),
      mix:R(f.mix, 0, 1, .25), tone:R(f.tone, 500, 20000, 6000) };
    case "reverb": return { type:"reverb", size:R(f.size, .2, 8, 2), decay:R(f.decay, .5, 8, 2.5), mix:R(f.mix, 0, 1, .2) };
    case "drive": return { type:"drive", amount:R(f.amount, 0, 1, .2), mix:R(f.mix, 0, 1, 1) };
    case "lofi": return { type:"lofi", bits:Math.round(R(f.bits, 2, 16, 8)), cutoff:R(f.cutoff, 500, 20000, 6000) };
    case "pump": return { type:"pump", depth:R(f.depth, 0, 1, .35), beats:R(f.beats, .25, 4, 1) };
    case "tremolo": return { type:"tremolo", depth:R(f.depth, 0, 1, .3), beats:R(f.beats, .125, 8, .5) };
    case "autopan": return { type:"autopan", depth:R(f.depth, 0, 1, .7), beats:R(f.beats, .5, 32, 8) };
    case "sweep": return { type:"sweep", filter:SWEEP_F.includes(f.filter) ? f.filter : "lowpass", from:R(f.from, 20, 20000, 300),
      to:R(f.to, 20, 20000, 8000), beats:R(f.beats, .25, 32, 4), q:R(f.q, .1, 18, 1) };
    case "ringmod": return { type:"ringmod", freq:R(f.freq, 1, 5000, 40), mix:R(f.mix, 0, 1, .5) };
    case "chorus": {
      const ms = R(f.ms, 1, 50, 15);
      return { type:"chorus", ms, depth:Math.min(R(f.depth, .1, 20, 3), ms * .9), rate:R(f.rate, .02, 10, .6),
        feedback:R(f.feedback, 0, .9, 0), mix:R(f.mix, 0, 1, .3) };
    }
    case "noise": return { type:"noise", kind:NOISES.includes(f.kind) ? f.kind : "pink", level:R(f.level, -60, -6, -30) };
    case "crossfeed": return { type:"crossfeed", amount:R(f.amount, 0, .6, .3) };
  }
  return null;
}
/* trk-fx 形式：{ format, version, name, author?, url?, id?, chain:[…最大16], eq?:[5], volume? } */
function cleanPreset(raw) {
  if (!raw || typeof raw !== "object" || (raw.format && raw.format !== "trk-fx") || !Array.isArray(raw.chain)) return null;
  const out = { name:str(raw.name, 24) || "My FX", chain:raw.chain.slice(0, 16).map(cleanFx).filter(Boolean) };
  const author = str(raw.author, 24); if (author) out.author = author;
  if (typeof raw.url === "string" && HTTPS.test(raw.url)) out.url = raw.url.slice(0, 200);
  if (typeof raw.id === "string" && /^[a-z0-9_]{1,32}$/.test(raw.id)) out.id = raw.id;
  if (Array.isArray(raw.eq) && raw.eq.length === 5) out.eq = raw.eq.map(v => R(v, -12, 12, 0));
  if (raw.volume != null) out.volume = R(raw.volume, -12, 6, 0);
  return out;
}
const copy = o => o == null ? o : JSON.parse(JSON.stringify(o));

/* ============ ④ プリセット（内蔵は fx-presets.js、マイプリセットは localStorage） ============ */
const CATS = ["basic", "genre", "scene", "space", "game", "fun", "weird", "custom"];
const CAT_KEY = { basic:"sfxCatBasic", genre:"sfxCatGenre", scene:"sfxCatScene", space:"sfxCatSpace", game:"sfxCatGame",
  fun:"sfxCatFun", weird:"sfxCatWeird", custom:"sfxCatCustom", fav:"sfxCatFav", recent:"sfxCatRecent" };
const BUILTIN = [];
for (const p of (typeof TRK_FX_PRESETS !== "undefined" ? TRK_FX_PRESETS : [])) {
  if (!p || !/^[a-z0-9_]{1,32}$/.test(p.id) || !CATS.includes(p.cat) || p.cat === "custom" || BUILTIN.some(b => b.id === p.id)) continue;
  BUILTIN.push({ id:p.id, cat:p.cat, label:p.label || p.id, desc:p.desc || "",
    chain:(Array.isArray(p.chain) ? p.chain : []).slice(0, 16).map(cleanFx).filter(Boolean) });
}
if (!BUILTIN.some(p => p.id === "flat")) BUILTIN.unshift({ id:"flat", cat:"basic", label:{ ja:"フラット", en:"Flat" }, desc:"", chain:[] });

let custom = {}, tempPreset = null;   // tempPreset：譜面・記録から読み込んだ一時的なエフェクト（保存しない）
try {
  const raw = JSON.parse(localStorage.getItem(FX_STORE)) || {};
  for (const [id, v] of Object.entries(raw)) { const c = /^my_[a-z0-9]+$/.test(id) && cleanPreset(v); if (c) custom[id] = c; }
} catch (_) {}
const saveCustom = () => { try { localStorage.setItem(FX_STORE, JSON.stringify(custom)); } catch (_) {} };
const pText = o => typeof o === "string" ? o : (o && (o[lang] || o.en || o.ja)) || "";
function presetById(id) {
  const b = BUILTIN.find(p => p.id === id); if (b) return b;
  if (id === TEMP_ID && tempPreset) return { ...tempPreset, id, cat:"custom", temp:true, label:"📄 " + tempPreset.name, desc:"" };
  if (custom[id]) return { ...custom[id], id, cat:"custom", custom:true, label:custom[id].name, desc:"" };
  return null;
}
const curPreset = () => presetById(settings.fxPreset) || BUILTIN[0];
const presetName = p => p.custom || p.temp ? p.name : pText(p.label);
const presetDesc = p => p.author ? tr("sfxBy", { name:p.author }) : pText(p.desc);
function presetsOf(cat) {
  if (cat === "fav") return settings.fxFav.map(presetById).filter(Boolean);
  if (cat === "recent") return settings.fxRecent.map(presetById).filter(Boolean);
  if (cat !== "custom") return BUILTIN.filter(p => p.cat === cat);
  const list = Object.keys(custom).map(presetById);
  if (tempPreset) list.unshift(presetById(TEMP_ID));
  return list.filter(Boolean);
}
const allPresets = () => CATS.flatMap(presetsOf);
/* 表示する分類（お気に入り・最近使ったを上に） */
const GROUPS = ["fav", "recent", ...CATS];
/* 検索：4言語の名前・説明・作者名のどれかに含まれていれば */
function matches(p, q) {
  const texts = [p.id, p.name, p.author];
  for (const o of [p.label, p.desc]) texts.push(...(typeof o === "string" ? [o] : Object.values(o || {})));
  return texts.some(t => typeof t === "string" && t.toLowerCase().includes(q));
}

/* ============ ⑤ 音の部品 ============ */
const G = { ac:null, src:null, ok:true, made:[], ticks:[], comps:0, eq:[], game:null, vol:null, lim:null, out:null, noise:{}, ir:new Map() };
let cur = null;                                       // 作り直すときに消すノードの一覧（rebuild 中だけ）
let bypass = false;                                   // 👂 元の音と比べている間だけ true
const active = () => settings.fxOn && !bypass;
const T = n => { if (cur) cur.push(n); return n; };
const dbToGain = d => Math.pow(10, d / 20);
const gainN = (ac, v) => { const g = T(ac.createGain()); g.gain.value = v; return g; };
const biq = (ac, type, f, q, gain = 0) => { const n = T(ac.createBiquadFilter()); n.type = type; n.frequency.value = f; n.Q.value = q; n.gain.value = gain; return n; };
function stereoIn(ac) { const g = gainN(ac, 1); g.channelCount = 2; g.channelCountMode = "explicit"; g.channelInterpretation = "speakers"; return g; }
function matrix(ac, a, b) {                           // L' = a·L + b·R、R' = a·R + b·L
  const inp = stereoIn(ac), sp = T(ac.createChannelSplitter(2)), mg = T(ac.createChannelMerger(2));
  const ll = gainN(ac, a), rl = gainN(ac, b), rr = gainN(ac, a), lr = gainN(ac, b);
  inp.connect(sp);
  sp.connect(ll, 0); sp.connect(lr, 0); sp.connect(rr, 1); sp.connect(rl, 1);
  ll.connect(mg, 0, 0); rl.connect(mg, 0, 0); rr.connect(mg, 0, 1); lr.connect(mg, 0, 1);
  return { input:inp, output:mg };
}
function parallel(ac, mix, wetIn, wetOut, dryLevel = 1) {   // 元の音（dry）に響き（wet）を重ねる
  const inp = gainN(ac, 1), out = gainN(ac, 1), dry = gainN(ac, dryLevel), wet = gainN(ac, mix);
  inp.connect(dry); dry.connect(out); inp.connect(wetIn); wetOut.connect(wet); wet.connect(out);
  return { input:inp, output:out };
}
/* リバーブの響き（同じ大きさ・減衰なら使い回す。最大24種類） */
function impulse(ac, size, decay) {
  const key = size + "|" + decay;
  if (G.ir.has(key)) return G.ir.get(key);
  const len = Math.floor(ac.sampleRate * size), b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  if (G.ir.size >= 24) G.ir.delete(G.ir.keys().next().value);
  G.ir.set(key, b);
  return b;
}
function driveCurve(k) {
  const n = 4096, c = new Float32Array(n), a = 1 + k * 30;
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(a * x) / Math.tanh(a); }
  return c;
}
function crushCurve(bits) {
  const n = 8192, c = new Float32Array(n), steps = Math.pow(2, bits - 1);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.round(x * steps) / steps; }
  return c;
}
/* 環境音（4秒のループを自動生成。録音素材は使わない） */
function noiseBuffer(ac, kind) {
  if (G.noise[kind]) return G.noise[kind];
  const sr = ac.sampleRate, len = sr * 4, b = ac.createBuffer(2, len, sr), fade = 2048;
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    let p0 = 0, p1 = 0, p2 = 0, br = 0, last = 0, pop = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      p0 = .99765 * p0 + w * .0990460; p1 = .963 * p1 + w * .2965164; p2 = .57 * p2 + w * 1.0526913;
      const pink = (p0 + p1 + p2 + w * .1848) * .11;
      br = (br + .02 * w) / 1.02; pop *= .6;
      let v;
      switch (kind) {
        case "vinyl": if (Math.random() < .0003) pop = (Math.random() < .5 ? -1 : 1) * (.3 + Math.random() * .6); v = pink * .12 + pop; break;
        case "tape": v = (w - last) * .18 + pink * .05; break;
        case "rain": if (Math.random() < .004) pop = w * .5; v = pink * .35 + pop * .5; break;
        case "wind": v = br * 3 * (.55 + .45 * Math.sin(TAU * i / len * 2 + c * 1.7)); break;
        case "fire": if (Math.random() < .0012) pop = (Math.random() * 2 - 1) * .8; v = br * 1.6 + pop; break;
        case "crowd": v = pink * .3 * (.7 + .3 * Math.sin(TAU * i / len * 3 + c)); break;
        default: v = pink * .4;
      }
      last = w; d[i] = Math.max(-1, Math.min(1, v));
    }
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
  }
  return (G.noise[kind] = b);
}
/* ビートの位置（曲のBPMとオフセットから。速度変更にも追従） */
function beatInfo() {
  const bpm = chartMeta.bpm || Number($("bpm").value) || 120, beatMs = 60000 / bpm;
  return { beatSec:beatMs / 1000 / (video.playbackRate || 1), pos:((video.currentTime || 0) * 1000 - (chartMeta.offset || 0)) / beatMs, playing:!video.paused };
}

/* ============ ⑥ エフェクトを作る（{ input, output, tick? } を返す。tick は毎フレーム呼ばれる） ============ */
function mk(ac, f) {
  const now = () => ac.currentTime;
  switch (f.type) {
    case "eq": {
      const ns = f.bands.map(b => biq(ac, b.type, b.freq, b.q, b.gain));
      for (let i = 1; i < ns.length; i++) ns[i - 1].connect(ns[i]);
      return { input:ns[0], output:ns[ns.length - 1] };
    }
    case "comp": {
      const c = T(ac.createDynamicsCompressor());
      c.threshold.value = f.threshold; c.ratio.value = f.ratio; c.attack.value = f.attack; c.release.value = f.release; c.knee.value = f.knee;
      const g = gainN(ac, dbToGain(f.makeup)); c.connect(g);
      return { input:c, output:g };
    }
    case "gain": { const g = gainN(ac, dbToGain(f.db)); return { input:g, output:g }; }
    case "width": return matrix(ac, (1 + f.amount) / 2, (1 - f.amount) / 2);
    case "vocalCut": {
      const inp = stereoIn(ac), out = gainN(ac, 1), m = matrix(ac, 1, -f.amount);
      const hp = biq(ac, "highpass", f.keepBass, .7), lp = biq(ac, "lowpass", f.keepBass, .7);
      inp.connect(m.input); m.output.connect(hp); hp.connect(out); inp.connect(lp); lp.connect(out);
      return { input:inp, output:out };
    }
    case "delay": {
      const d = T(ac.createDelay(4)), fb = gainN(ac, f.feedback), tone = biq(ac, "lowpass", f.tone, .7);
      d.delayTime.value = f.ms / 1000; d.connect(tone); tone.connect(fb); fb.connect(d);
      const node = parallel(ac, f.mix, d, tone);
      if (f.beats > 0) node.tick = bi => {
        const t = Math.min(3.9, f.beats * bi.beatSec);
        if (Math.abs(d.delayTime.value - t) > .002) d.delayTime.setTargetAtTime(t, now(), .05);
      };
      return node;
    }
    case "reverb": {
      const cv = T(ac.createConvolver()), hp = biq(ac, "highpass", 120, .7);
      cv.buffer = impulse(ac, f.size, f.decay); hp.connect(cv);
      return parallel(ac, f.mix, hp, cv);
    }
    case "drive": {
      const pre = gainN(ac, 1), ws = T(ac.createWaveShaper());
      ws.curve = driveCurve(f.amount); ws.oversample = "2x"; pre.connect(ws);
      return parallel(ac, f.mix, pre, ws, 1 - f.mix);
    }
    case "lofi": {
      const ws = T(ac.createWaveShaper()), lp = biq(ac, "lowpass", f.cutoff, .7);
      ws.curve = crushCurve(f.bits); ws.connect(lp);
      return { input:ws, output:lp };
    }
    case "pump": {                                      // 拍の頭で沈んで、すぐ戻る
      const g = gainN(ac, 1);
      return { input:g, output:g, tick:bi => {
        const ph = ((bi.pos / f.beats) % 1 + 1) % 1;
        g.gain.setTargetAtTime(1 - f.depth * Math.pow(Math.max(0, 1 - ph / .6), 2), now(), .012);
      } };
    }
    case "tremolo": {
      const g = gainN(ac, 1);
      return { input:g, output:g, tick:bi => { g.gain.setTargetAtTime(1 - f.depth * (.5 + .5 * Math.cos(TAU * bi.pos / f.beats)), now(), .015); } };
    }
    case "autopan": {
      if (!ac.createStereoPanner) return null;
      const pn = T(ac.createStereoPanner());
      return { input:pn, output:pn, tick:bi => { pn.pan.setTargetAtTime(f.depth * Math.sin(TAU * bi.pos / f.beats), now(), .03); } };
    }
    case "sweep": {                                     // フィルターの周波数が、拍に合わせて往復する
      const n = biq(ac, f.filter, f.from, f.q);
      return { input:n, output:n, tick:bi => {
        const ph = .5 - .5 * Math.cos(TAU * bi.pos / f.beats);
        n.frequency.setTargetAtTime(f.from * Math.pow(f.to / f.from, ph), now(), .02);
      } };
    }
    case "ringmod": {                                   // 音 × サイン波（ロボット声）
      const osc = T(ac.createOscillator()), mod = gainN(ac, 0);
      osc.frequency.value = f.freq; osc.connect(mod.gain); osc.start();
      return parallel(ac, f.mix, mod, mod, 1 - f.mix);
    }
    case "chorus": {                                    // 揺れる短いディレイ（feedback を上げるとフランジャー）
      const d = T(ac.createDelay(.1)), lfo = T(ac.createOscillator()), dep = gainN(ac, f.depth / 1000), fb = gainN(ac, f.feedback);
      d.delayTime.value = f.ms / 1000; lfo.frequency.value = f.rate; lfo.connect(dep); dep.connect(d.delayTime); lfo.start();
      d.connect(fb); fb.connect(d);
      return parallel(ac, f.mix, d, d);
    }
    case "noise": {                                     // 環境音を重ねる（曲が止まると一緒に止まる）
      const src = T(ac.createBufferSource()), g = gainN(ac, 0), pass = gainN(ac, 1), lv = dbToGain(f.level);
      src.buffer = noiseBuffer(ac, f.kind); src.loop = true; src.connect(g); g.connect(pass); src.start();
      return { input:pass, output:pass, tick:bi => g.gain.setTargetAtTime(bi.playing ? lv : 0, now(), .08) };
    }
    case "crossfeed": {                                 // 反対側の低めの音を少し混ぜる
      const inp = stereoIn(ac), sp = T(ac.createChannelSplitter(2)), mg = T(ac.createChannelMerger(2));
      const lpL = biq(ac, "lowpass", 700, .7), lpR = biq(ac, "lowpass", 700, .7);
      const xl = gainN(ac, f.amount), xr = gainN(ac, f.amount), dl = gainN(ac, 1 - f.amount * .3), dr = gainN(ac, 1 - f.amount * .3);
      inp.connect(sp); sp.connect(dl, 0); sp.connect(dr, 1); sp.connect(lpL, 0); sp.connect(lpR, 1);
      lpL.connect(xl); lpR.connect(xr);
      dl.connect(mg, 0, 0); xr.connect(mg, 0, 0); dr.connect(mg, 0, 1); xl.connect(mg, 0, 1);
      return { input:inp, output:mg };
    }
  }
  return null;
}

/* ============ ⑦ 音の通り道 ============ */
function ensureGraph() {
  if (G.src) return true;
  if (!G.ok) return false;
  const ac = getAC(); if (!ac) { G.ok = false; return false; }
  try { G.src = ac.createMediaElementSource(video); } catch (e) { console.error(e); G.ok = false; return false; }
  G.ac = ac; cur = null;
  /* かんたんEQ */
  G.eq = EQ_BANDS.map(([t, f]) => biq(ac, t, f, .9));
  for (let i = 1; i < G.eq.length; i++) G.eq[i - 1].connect(G.eq[i]);
  /* ゲーム連動 */
  const gm = G.game = { lp:biq(ac, "lowpass", 22000, .7), low:biq(ac, "lowshelf", 120, .7), high:biq(ac, "highshelf", 6000, .7),
    amp:gainN(ac, 1), pan:ac.createStereoPanner ? ac.createStereoPanner() : null };
  G.eq[G.eq.length - 1].connect(gm.lp); gm.lp.connect(gm.low); gm.low.connect(gm.high); gm.high.connect(gm.amp);
  /* 音量 → (リミッター) → 出口 → スピーカー */
  G.vol = gainN(ac, 1);
  if (gm.pan) { gm.amp.connect(gm.pan); gm.pan.connect(G.vol); } else gm.amp.connect(G.vol);
  G.lim = ac.createDynamicsCompressor();
  G.lim.threshold.value = -1; G.lim.knee.value = 0; G.lim.ratio.value = 20; G.lim.attack.value = .003; G.lim.release.value = .1;
  G.out = ac.createGain(); G.out.connect(ac.destination);
  video.addEventListener("play", () => { if (ac.state === "suspended") ac.resume(); });
  rebuild(); applyOut();
  return true;
}
/* プリセットの部分だけを作り直す（EQ・ゲーム連動・出口はそのまま）
   切り替えの瞬間のプチッという音を防ぐため、出口を一瞬だけ絞ってから戻す */
function rebuild() {
  if (!G.src) return;
  const t = G.ac.currentTime, og = G.out.gain;
  og.cancelScheduledValues(t); og.setValueAtTime(0, t); og.linearRampToValueAtTime(1, t + .06);
  try { G.src.disconnect(); } catch (_) {}
  for (const n of G.made) { try { if (n.stop) n.stop(); } catch (_) {} try { n.disconnect(); } catch (_) {} }
  G.made = []; G.ticks = []; G.comps = 0;
  let last = G.src;
  if (active()) {
    cur = G.made;
    for (const f of curPreset().chain) {
      try {
        const nd = mk(G.ac, f); if (!nd) continue;
        last.connect(nd.input); last = nd.output;
        if (nd.tick) G.ticks.push(nd.tick);
        if (f.type === "comp") G.comps++;
      } catch (e) { console.error(e); }
    }
    cur = null;
  }
  last.connect(G.eq[0]);
  syncEq();
}
function syncEq() {
  if (!G.src) return;
  G.eq.forEach((n, i) => n.gain.setTargetAtTime(active() ? settings.fxEq[i] : 0, G.ac.currentTime, .03));
}
function applyOut() {
  if (!G.src) return;
  try { G.vol.disconnect(); } catch (_) {}
  try { G.lim.disconnect(); } catch (_) {}
  if (active() && settings.fxLimiter) { G.vol.connect(G.lim); G.lim.connect(G.out); }
  else G.vol.connect(G.out);
  G.vol.gain.setTargetAtTime(active() ? dbToGain(settings.fxVolume) : 1, G.ac.currentTime, .03);
}
/* 👂 元の音と比べる（押している間だけ素通しにする） */
function setBypass(v) {
  v = !!v;
  if (bypass === v) return;
  if (v && (!settings.fxOn || !G.src)) return;
  bypass = v;
  rebuild(); applyOut();
  document.querySelectorAll(".fxCompare").forEach(b => b.classList.toggle("selected", v));
}
/* エフェクト後の音を見る（波形・スペクトラム表示などに。初めて呼ぶと音の通り道を作る） */
function tap(fftSize = 2048) {
  if (!ensureGraph()) return null;
  const a = G.ac.createAnalyser();
  a.fftSize = fftSize; G.out.connect(a);
  return a;
}

/* ============ ⑧ タイミングの自動補正 ============
   音が遅れて聞こえる分だけ、判定に使うゲーム内時刻を遅らせる（game.js の gameTime を包む）
   ・baseLatency：Web Audio を通る分（どのブラウザでも使える）
   ・コンプレッサー／リミッター：1つにつき約6msの先読み
   ・outputLatency（機器の遅れ）は、エフェクトなしでも同じだけあるので足さない（⌨ 操作の補正で合わせる） */
function fxDelayMs() {
  if (!G.src || !settings.fxComp) return 0;
  let ms = (G.ac.baseLatency || 0) * 1000;
  if (active()) ms += 6 * (G.comps + (settings.fxLimiter ? 1 : 0));
  return ms + settings.fxCompExtra;
}
const baseGameTime = gameTime;
gameTime = function (at) { return baseGameTime(at) - fxDelayMs(); };

/* ============ ⑨ ゲーム連動（毎フレーム） ============ */
let missSeen = 0, missAt = -1e9;
function gameTick(p) {
  const gm = G.game, t = G.ac.currentTime, g = settings.fxGame, live = active() && phase === "playing";
  if (stats.miss > missSeen && live) missAt = p;
  missSeen = stats.miss;
  let f = 22000, low = 0, high = 0, amp = 1, pan = 0;
  if (live) {
    if (g.miss) { const k = (p - missAt) / 700; if (k < 1) f = Math.min(f, 700 * Math.pow(22000 / 700, k)); }
    if (g.pinch && lifeState.max && lifeState.hp / lifeState.max <= .3) {
      f = Math.min(f, 2500);
      const ph = ((beatInfo().pos % 1) + 1) % 1;
      amp = 1 - .18 * Math.pow(Math.max(0, 1 - ph / .25), 2);
    }
    if (g.combo) { const c = Math.min(4, stats.combo / 25); low += c; high += c; }
    const catching = typeof isCatch === "function" && isCatch();
    if (g.blast && catching && typeof isBlast === "function" && isBlast(gameTime())) { high += 4; low += 2; }
    if (g.pan && catching && typeof catchState !== "undefined") pan = (catchState.x - .5) * .7;
  }
  gm.lp.frequency.setTargetAtTime(f, t, .03);
  gm.low.gain.setTargetAtTime(low, t, .1);
  gm.high.gain.setTargetAtTime(high, t, .1);
  gm.amp.gain.setTargetAtTime(amp, t, .015);
  if (gm.pan) gm.pan.pan.setTargetAtTime(pan, t, .05);
}
function frame() {
  requestAnimationFrame(frame);
  if (!G.src) return;
  if (G.ticks.length) { const bi = beatInfo(); for (const tk of G.ticks) { try { tk(bi); } catch (_) {} } }
  gameTick(performance.now());
}
requestAnimationFrame(frame);

/* ブラウザは、ユーザーの操作のあとでないと音を出せないので、最初の操作で準備する */
function wakeAudio() {
  if (settings.fxOn) ensureGraph();
  if (G.ac && G.ac.state === "suspended") G.ac.resume();
}
addEventListener("pointerdown", wakeAudio, true);
addEventListener("keyup", wakeAudio, true);
addEventListener("blur", () => setBypass(false));

/* ============ ⑩ 操作 ============ */
function refresh() {
  if (settings.fxOn && !ensureGraph()) { settings.fxOn = false; setStatus("sfxStatus", "sfxUnsupported"); }
  if (!settings.fxOn) bypass = false;
  if (G.src) { rebuild(); applyOut(); }
  saveUserPrefs(); syncUI();
}
function setOn(v) { settings.fxOn = !!v; refresh(); }
function pushRecent(id) {
  if (id === TEMP_ID || id === "flat") return;
  settings.fxRecent = [id, ...settings.fxRecent.filter(x => x !== id)].slice(0, RECENT_MAX);
}
function selectPreset(id) {
  const p = presetById(id); if (!p) return false;
  settings.fxPreset = id; settings.fxOn = true;
  if ((p.custom || p.temp) && p.eq) settings.fxEq = p.eq.slice();
  if ((p.custom || p.temp) && typeof p.volume === "number") settings.fxVolume = p.volume;
  pushRecent(id);
  refresh();
  return true;
}
/* 前／次のプリセット（分類の並び順。オフのときは最初から） */
function stepPreset(dir) {
  const list = allPresets(); if (!list.length) return;
  const i = settings.fxOn ? list.findIndex(p => p.id === settings.fxPreset) : -1;
  const j = i < 0 ? (dir > 0 ? 0 : list.length - 1) : (i + dir + list.length) % list.length;
  selectPreset(list[j].id);
}
/* おまかせ：フラットと今のプリセット以外の内蔵から1つ */
function randomPreset() {
  const list = BUILTIN.filter(p => p.id !== "flat" && p.id !== settings.fxPreset);
  if (list.length) selectPreset(list[Math.floor(Math.random() * list.length)].id);
}
function toggleFav() {
  const id = settings.fxPreset; if (!settings.fxOn || id === TEMP_ID) return;
  settings.fxFav = settings.fxFav.includes(id) ? settings.fxFav.filter(x => x !== id) : [id, ...settings.fxFav].slice(0, FAV_MAX);
  saveUserPrefs(); syncUI();
}
/* 今の設定を trk-fx 形式で（内蔵プリセットは id も入れる） */
function exportObj() {
  const p = curPreset();
  const o = { format:"trk-fx", version:1, name:presetName(p).slice(0, 24) };
  if (p.author) o.author = p.author;
  if (p.url) o.url = p.url;
  Object.assign(o, { chain:copy(p.chain), eq:settings.fxEq.slice(), volume:settings.fxVolume });
  if (!p.custom && !p.temp) o.id = p.id;
  return o;
}
/* 譜面・記録のエフェクトを使う。内蔵の id があればそれを、なければ一時プリセットとして */
function applyFxObj(raw) {
  const c = cleanPreset(raw); if (!c) return null;
  if (c.id && BUILTIN.some(p => p.id === c.id)) settings.fxPreset = c.id;
  else { tempPreset = c; settings.fxPreset = TEMP_ID; }
  if (c.eq) settings.fxEq = c.eq.slice();
  if (typeof c.volume === "number") settings.fxVolume = c.volume;
  settings.fxOn = true; refresh();
  return c.name;
}
function storePreset(raw, overwriteId) {
  const c = cleanPreset(raw); if (!c) { setStatus("sfxStatus", "sfxBad"); return false; }
  delete c.id;
  if (!overwriteId && Object.keys(custom).length >= FX_MAX) { setStatus("sfxStatus", "sfxLimit"); return false; }
  const id = overwriteId || "my_" + Date.now().toString(36);
  custom[id] = c; saveCustom();
  selectPreset(id);
  setStatus("sfxStatus", "sfxSaved", { name:c.name });
  return true;
}
const exportForFile = () => { const o = exportObj(); delete o.id; return o; };

/* ============ ⑪ 譜面・記録への保存 ============ */
/* 譜面に記録する／読み込む（media.js の関数を包む） */
const baseToData = chartToData;
chartToData = function (notes, diff, meta) {
  const d = baseToData(notes, diff, meta);
  if (settings.fxOn && settings.fxRecord) d.fx = exportObj();
  return d;
};
const baseApplyChart = applyChartData;
applyChartData = function (data, mode, sid, check) {
  const ok = baseApplyChart(data, mode, sid, check);
  if (ok && data && data.fx && settings.fxChartLoad) {
    const name = applyFxObj(data.fx);
    if (name) setStatus("sfxQuickStatus", "sfxChartApplied", { name });
  }
  return ok;
};
/* プレイ履歴に残す */
let fxSnap = null, fxPlayStart = 0;
on("beforePlay", () => { missSeen = 0; setBypass(false); wakeAudio(); fxSnap = settings.fxOn ? exportObj() : null; fxPlayStart = Date.now(); });
function tagHistory() {
  if (!fxSnap || !fxPlayStart) return;
  const s = songRec(false), h = s && s.history && s.history[0];
  if (!h || h.t < fxPlayStart || h.fx) return;
  h.fx = fxSnap; h.mods = [...(Array.isArray(h.mods) ? h.mods : []), "🎛" + fxSnap.name];
  fxPlayStart = 0; saveRecords();
}
/* 記録の欄に「最近使ったエフェクト」と、同じ音に戻すボタン */
function renderFxRec() {
  if (!videoReady) return;
  const s = songRec(false), h = s && s.history && s.history.find(x => x.fx);
  if (!h) return;
  const row = el("div", "miniActions"); row.style.alignItems = "center";
  const b = el("button", "", tr("sfxUseThis")); b.type = "button";
  b.addEventListener("click", () => { const n = applyFxObj(h.fx); if (n) setStatus("recStatus", "sfxApplied", { name:n }); });
  row.append(el("span", "hint", tr("sfxRecent", { name:h.fx.name })), b);
  $("recSummary").append(row);
}
on("records", () => { tagHistory(); renderFxRec(); });
on("chart", renderFxRec);
on("language", renderFxRec);
on("screen", id => {
  if (id === "endScreen" && fxSnap) $("result").append(el("div", "best", tr("sfxResult", { name:fxSnap.name })));
});

/* ============ ⑫ 設定画面 ============ */
const tx = (tag, key, cls) => { const n = el(tag, cls || "", tr(key)); n.dataset.i18n = key; return n; };
const signed = (v, unit, d = 0) => (v > 0 ? "+" : "") + v.toFixed(d) + unit;
const smallBtn = (label, title, fn) => {
  const b = el("button", "fxMini", label); b.type = "button";
  if (title) { b.title = tr(title); b.setAttribute("aria-label", tr(title)); b.dataset.titleKey = title; }
  b.addEventListener("click", fn);
  return b;
};
/* 👂 押している間だけ元の音（マウス・タッチ・キーボードのスペースやEnterでも） */
function compareBtn() {
  const b = tx("button", "sfxCompare", "fxCompare"); b.type = "button"; b.title = tr("sfxCompareHint");
  b.addEventListener("pointerdown", e => { e.preventDefault(); setBypass(true); });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(ev, () => setBypass(false));
  b.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); setBypass(true); } });
  b.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") setBypass(false); });
  b.addEventListener("blur", () => setBypass(false));
  return b;
}
function check(label, onChange) {
  const lab = el("label", "check"), inp = document.createElement("input");
  inp.type = "checkbox"; lab.append(inp, tx("span", label));
  inp.addEventListener("change", () => onChange(inp.checked));
  return { lab, inp };
}
function range(labelNode, min, max, step, onInput) {
  const row = el("div", "inline"), inp = document.createElement("input"), val = el("span", "mono");
  inp.type = "range"; inp.min = min; inp.max = max; inp.step = step;
  inp.addEventListener("input", () => onInput(Number(inp.value)));
  row.append(labelNode, inp, val);
  return { row, inp, val };
}
const setPref = (key, after) => v => { settings[key] = v; saveUserPrefs(); if (after) after(); syncUI(); };

const panel = el("details", "panel"); panel.id = "fxPanel";
const add = (...n) => panel.append(...n);
add(tx("summary", "sfxTitle"));

/* オン・プリセット（検索・お気に入り・比べる） */
const onCk = check("sfxOn", v => setOn(v)); onCk.inp.id = "fxOnCheck";
const search = document.createElement("input");
search.type = "search"; search.autocomplete = "off"; search.className = "fxSearch";
search.addEventListener("input", () => renderGrid());
const hits = el("div", "hint");
const grid = el("div", "fxGrid"), desc = el("div", "hint status");
const favBtn = el("button", "fxMini"); favBtn.type = "button"; favBtn.addEventListener("click", toggleFav);
const toolRow = el("div", "miniActions"); toolRow.append(favBtn, compareBtn());
add(onCk.lab, tx("div", "sfxHint", "hint"), tx("h3", "sfxPresetLabel"), search, hits, grid, desc, toolRow);

/* かんたんEQ・音量・リミッター（スライダーは数字だけ更新して軽くする） */
add(tx("h3", "sfxEqLabel"));
const eqRows = EQ_BANDS.map(([, , name], i) => range(el("span", "", name), -12, 12, .5, v => {
  settings.fxEq[i] = v;
  if (!settings.fxOn) setOn(true); else { syncEq(); saveUserPrefs(); syncValues(); }
}));
const eqReset = tx("button", "sfxEqReset"); eqReset.type = "button"; eqReset.style.cssText = "padding:6px 12px;font-size:14px";
eqReset.addEventListener("click", () => { settings.fxEq = [0, 0, 0, 0, 0]; syncEq(); saveUserPrefs(); syncValues(); });
const vol = range(tx("span", "sfxVolume"), -12, 6, .5, v => { settings.fxVolume = v; applyOut(); saveUserPrefs(); syncValues(); });
const limCk = check("sfxLimiter", setPref("fxLimiter", applyOut));
add(...eqRows.map(r => r.row), eqReset, vol.row, limCk.lab);

/* ゲーム連動 */
add(tx("h3", "sfxGameTitle"));
const gameCks = [["miss", "sfxGameMiss"], ["combo", "sfxGameCombo"], ["pinch", "sfxGamePinch"], ["blast", "sfxGameBlast"], ["pan", "sfxGamePan"]]
  .map(([k, key]) => { const c = check(key, v => { settings.fxGame[k] = v; saveUserPrefs(); }); add(c.lab); return [k, c.inp]; });

/* タイミングと記録 */
add(tx("h3", "sfxSyncTitle"));
const compCk = check("sfxComp", setPref("fxComp"));
const extra = range(tx("span", "sfxCompExtra"), -50, 50, 1, v => { settings.fxCompExtra = v; saveUserPrefs(); syncValues(); });
const compNow = el("div", "hint status");
const recCk = check("sfxRecord", setPref("fxRecord"));
const loadCk = check("sfxChartLoad", setPref("fxChartLoad"));
add(compCk.lab, extra.row, compNow, tx("div", "sfxCompHint", "hint"), recCk.lab, loadCk.lab);

/* マイプリセット */
add(tx("h3", "sfxCustomTitle"), tx("div", "sfxCustomHint", "hint"));
const acts = el("div", "miniActions");
const expBtn = tx("button", "sfxExport"); expBtn.type = "button";
expBtn.addEventListener("click", () => { const o = exportForFile(); downloadJSON(o, `${safeName(o.name)}.trk-fx.json`); setStatus("sfxStatus", "sfxExported"); });
const impLab = el("label", "fileBtn small"), impInp = document.createElement("input");
impInp.type = "file"; impInp.accept = "application/json,.json"; impInp.hidden = true;
impLab.append(impInp, tx("span", "sfxImport"));
impInp.addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  let raw = null; try { raw = JSON.parse(await f.text()); } catch (_) {}
  storePreset(raw);
});
const delBtn = tx("button", "sfxDelete"); delBtn.type = "button";
delBtn.addEventListener("click", () => {
  const p = curPreset(); if (!p.custom || !confirm(tr("sfxConfirmDelete"))) return;
  delete custom[p.id]; saveCustom();
  settings.fxFav = settings.fxFav.filter(x => x !== p.id); settings.fxRecent = settings.fxRecent.filter(x => x !== p.id);
  settings.fxPreset = "flat"; refresh(); setStatus("sfxStatus", "sfxDeleted");
});
acts.append(expBtn, impLab, delBtn);
const editor = el("details", "subPanel"), area = document.createElement("textarea"), apply = tx("button", "sfxApply");
editor.append(tx("summary", "sfxEditor"), area, apply);
area.spellcheck = false; area.className = "fxEditor";
apply.type = "button"; apply.style.marginTop = "8px";
editor.addEventListener("toggle", () => { if (editor.open) area.value = JSON.stringify(exportForFile(), null, 2); });
apply.addEventListener("click", () => {
  let raw = null; try { raw = JSON.parse(area.value); } catch (_) {}
  const p = curPreset();
  if (storePreset(raw, p.custom ? p.id : null)) area.value = JSON.stringify(exportForFile(), null, 2);
});
const statusLine = el("div", "hint status"); statusLine.id = "sfxStatus";
add(acts, editor, statusLine);
(() => { const anchor = $("seEnabled") && $("seEnabled").closest("details.panel"); if (anchor) anchor.after(panel); })();

/* ============ ⑬ 選曲画面のメニュー（PLAYと速度パネルの下） ============ */
const quick = el("section", "panel"); quick.id = "fxQuickPanel"; quick.style.padding = "10px 18px";
const qRow = el("div", "inline tight"), qSel = document.createElement("select"), qDesc = el("div", "hint"), qStat = el("div", "hint status");
qStat.id = "sfxQuickStatus"; qSel.className = "fxQuickSelect";
const qPrev = smallBtn("◀", "sfxPrev", () => stepPreset(-1));
const qNext = smallBtn("▶", "sfxNext", () => stepPreset(1));
const qRand = smallBtn("🎲", "sfxRandom", randomPreset);
qRow.append(tx("span", "sfxQuick"), qPrev, qSel, qNext, qRand);
const qCompare = compareBtn(); qCompare.classList.add("fxQuickCompare");
quick.append(qRow, qDesc, qCompare, qStat);
$("playBtn").after(quick);
qSel.addEventListener("change", () => { setStatus("sfxQuickStatus", null); if (qSel.value) selectPreset(qSel.value); else setOn(false); });

/* ============ ⑭ 表示の同期 ============ */
const openCats = new Set(["fav"]);   // 開いている分類（お気に入りは最初から開く）
function presetButtons(items) {
  const seg = el("div", "seg fxSeg");
  for (const p of items) {
    const fav = settings.fxFav.includes(p.id) ? "★ " : "";
    const b = el("button", "", fav + pText(p.label)); b.type = "button"; b.title = presetDesc(p);
    const onFlag = settings.fxOn && settings.fxPreset === p.id;
    b.classList.toggle("selected", onFlag); b.setAttribute("aria-pressed", String(onFlag));
    b.addEventListener("click", () => selectPreset(p.id));
    seg.append(b);
  }
  return seg;
}
function renderGrid() {
  grid.textContent = ""; hits.textContent = "";
  const q = search.value.trim().toLowerCase();
  if (q) {                                                       // 検索中は、見つかったものだけを1つにまとめて表示
    const found = allPresets().filter(p => matches(p, q));
    hits.textContent = found.length ? tr("sfxHits", { n:found.length }) : tr("sfxNoMatch");
    if (found.length) grid.append(presetButtons(found));
    return;
  }
  for (const cat of GROUPS) {
    const items = presetsOf(cat); if (!items.length) continue;
    const d = el("details", "fxCat"), s = el("summary", "", `${tr(CAT_KEY[cat])} (${items.length})`);
    const hasCur = settings.fxOn && items.some(p => p.id === settings.fxPreset) && cat !== "recent";
    d.open = openCats.has(cat) || hasCur;
    d.addEventListener("toggle", () => { if (d.open) openCats.add(cat); else openCats.delete(cat); });
    d.append(s, presetButtons(items));
    grid.append(d);
  }
}
function renderQuick() {
  qSel.textContent = "";
  const off = document.createElement("option"); off.value = ""; off.textContent = tr("sfxOff"); qSel.append(off);
  for (const cat of GROUPS) {
    const items = presetsOf(cat); if (!items.length) continue;
    const og = document.createElement("optgroup"); og.label = tr(CAT_KEY[cat]);
    for (const p of items) { const o = document.createElement("option"); o.value = p.id; o.textContent = pText(p.label); og.append(o); }
    qSel.append(og);
  }
  qSel.value = settings.fxOn ? settings.fxPreset : "";
  qDesc.textContent = settings.fxOn ? presetDesc(curPreset()) : "";
  qCompare.hidden = !settings.fxOn;
  for (const b of [qPrev, qNext, qRand]) { b.title = tr(b.dataset.titleKey); b.setAttribute("aria-label", b.title); }
}
function renderDesc(p) {
  desc.textContent = "";
  toolRow.hidden = !settings.fxOn;
  if (!settings.fxOn) return;
  const d = presetDesc(p);
  desc.append(pText(p.label) + (d ? " — " + d : ""));
  if (p.url) {
    const a = el("a", "", p.url); a.href = p.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.style.cssText = "margin-left:8px;color:var(--ui-accent);word-break:break-all";
    desc.append(a);
  }
  favBtn.hidden = !!p.temp;
  favBtn.textContent = tr(settings.fxFav.includes(p.id) ? "sfxFavRemove" : "sfxFavAdd");
}
/* スライダーの数字だけを更新（ボタンは作り直さない） */
function syncValues() {
  eqRows.forEach((r, i) => { r.inp.value = settings.fxEq[i]; r.val.textContent = signed(settings.fxEq[i], "dB", 1); });
  vol.inp.value = settings.fxVolume; vol.val.textContent = signed(settings.fxVolume, "dB", 1);
  extra.inp.value = settings.fxCompExtra; extra.val.textContent = signed(settings.fxCompExtra, "ms");
  extra.inp.disabled = !settings.fxComp;
  compNow.textContent = tr("sfxCompNow", { n:Math.round(fxDelayMs()) });
}
function syncUI() {
  if (!presetById(settings.fxPreset)) settings.fxPreset = "flat";   // 消したプリセット・前回の一時プリセット
  const p = curPreset();
  onCk.inp.checked = settings.fxOn;
  search.placeholder = tr("sfxSearch");
  renderGrid(); renderQuick(); renderDesc(p); syncValues();
  limCk.inp.checked = settings.fxLimiter;
  for (const [k, inp] of gameCks) inp.checked = !!settings.fxGame[k];
  compCk.inp.checked = settings.fxComp; recCk.inp.checked = settings.fxRecord; loadCk.inp.checked = settings.fxChartLoad;
  delBtn.hidden = !p.custom;
}
on("language", syncUI);

/* ============ ⑮ 窓口（MOD・ほかの機能から使う） ============
   TrkFX.list()        → [{ id, cat, name }]
   TrkFX.current()     → 今のエフェクト（trk-fx のコピー）。オフなら null
   TrkFX.apply(json)   → trk-fx を使う（成功したら名前、失敗したら null）
   TrkFX.select(id)    → プリセットを選ぶ（true / false）
   TrkFX.next() / prev() / random() → 前後・おまかせ
   TrkFX.off()         → エフェクトをオフ
   TrkFX.clean(json)   → trk-fx を確かめて整えた中身を返す（正しくなければ null）
   TrkFX.delayMs()     → 今の自動補正（ms）
   TrkFX.tap(fftSize)  → エフェクト後の音を見る AnalyserNode（使えなければ null）。使い終わったら disconnect() */
window.TrkFX = Object.freeze({
  version:2,
  list:() => CATS.flatMap(c => presetsOf(c).map(p => ({ id:p.id, cat:p.cat, name:presetName(p) }))),
  current:() => settings.fxOn ? exportObj() : null,
  apply:json => applyFxObj(json),
  select:id => selectPreset(String(id)),
  next:() => stepPreset(1),
  prev:() => stepPreset(-1),
  random:() => randomPreset(),
  off:() => setOn(false),
  clean:json => copy(cleanPreset(json)),
  delayMs:() => fxDelayMs(),
  tap
});

/* ============ ⑯ 起動 ============
   音の通り道は、エフェクトがオンで、最初にクリックかキーを押したときに作ります（wakeAudio） */
syncUI();
})();
/* ✅ fx.js 完了 */
