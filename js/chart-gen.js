// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 自動譜面の生成（純関数）============
   js/media.js の generateNotes から「音声解析の値とSeedの乱数を受け取って譜面を作る」部分だけを切り出した。
   ブラウザのグローバル（video／analysis／settings）には触らないので、node --test から同じ関数を検査できる。

   譜面の作り方（chartGen）:
     "1" … 旧方式。ca84a19 までと同じ出力を保つ（曲全体の最大音量で正規化し、曲全体で上位を選ぶ）。
           譜面の指紋（chartKeyOf＝ノーツ列のハッシュ）で記録が結び付くため、既定はこちら。
           tests/fixtures/chart-legacy-golden.json で「旧譜面の再現」を検査する。
     "2" … 新方式。前後4秒の局所正規化、8小節ごとの区間配分（長さ×密度を先に決め、盛り上がりは 0.7〜1.3 倍で残す）。
   ⚠ 旧方式の処理は変えない。直すときは "2" 側（cgBuildSectioned）だけを触る。
   ⚠ 関数名・定数名は classic script の共有スコープに載るので、他ファイルと重ならないよう cg 接頭辞を付ける。 */

const CG_SECTION_BARS = 8;          // 区間の長さ（小節）
const CG_SILENCE_REL = 0.01;        // 曲の最大音量に対してこれ未満は「無音」（新方式の開始・終了の判定）
const CG_LOCAL_HALF_S = 4;          // 局所正規化の窓（前後の秒数）

/* 旧方式と新方式の入口。p = { analysis, durationMs, diff, spec(DIFFS[diff]), bpm, offset, rand, chartGen } */
function buildChartNotes(p) {
  return String(p.chartGen) === "2" ? cgBuildSectioned(p) : cgBuildLegacy(p);
}

/* ---------- 解析データの読み取り（media.js の rmsAt／onsetAt／ratioAt と同じ式。analysis を引数で受ける） ---------- */
function cgFrameOf(a, t) { return Math.round(t / a.frameMs); }
function cgRmsAt(a, t) { return a.rms[Math.min(a.frames - 1, Math.max(0, cgFrameOf(a, t)))]; }
function cgOnsetAt(a, t) {
  const f = cgFrameOf(a, t); let m = 0;
  for (let i = Math.max(0, f - 3); i <= Math.min(a.frames - 1, f + 3); i++) if (a.onset[i] > m) m = a.onset[i];
  return m;
}
function cgRatioAt(a, t) {
  const f = cgFrameOf(a, t); let s = 0, c = 0;
  for (let i = Math.max(0, f); i <= Math.min(a.frames - 1, f + 4); i++) { s += a.ratio[i]; c++; }
  return c ? s / c : 0;
}

/* ---------- 旧方式（ca84a19 の generateNotes をそのまま移したもの。出力を変えないこと） ---------- */
function cgBuildLegacy(p) {
  const { analysis, bpm, offset, rand, spec: d } = p;
  const step = 60000 / bpm / d.div;
  let startMs = 600, endMs = p.durationMs - 400;
  if (analysis) {
    const thr = analysis.maxRms * .06; let f0 = 0, f1 = analysis.frames - 1;
    while (f0 < f1 && analysis.rms[f0] < thr) f0++;
    while (f1 > f0 && analysis.rms[f1] < thr) f1--;
    startMs = Math.max(300, f0 * analysis.frameMs - 30); endMs = Math.min(endMs, f1 * analysis.frameMs + 30);
  }
  const cands = [];
  for (let k = Math.ceil((startMs - offset) / step); ; k++) {
    const t = offset + k * step; if (t > endMs) break; if (t < startMs) continue;
    const sub = ((k % d.div) + d.div) % d.div, beatIdx = Math.floor(k / d.div);
    const onBeat = sub === 0, onBar = onBeat && ((beatIdx % 4) + 4) % 4 === 0;
    let s, loud = 0.5;
    if (analysis) {
      loud = cgRmsAt(analysis, t) / (analysis.maxRms || 1);
      if (loud < .05) continue;
      s = Math.min(1.6, cgOnsetAt(analysis, t) / (analysis.scale || 1)) + loud * .35;
    } else s = rand() * .6;
    s *= onBar ? 1.6 : onBeat ? 1.3 : (sub % 2 === 0 ? 1.1 : 0.95);
    s += rand() * .1;
    cands.push({ t, s, onBar, onBeat, sub, k, loud });
  }

  let sel;
  if (p.diff === "easy" || p.diff === "normal") {
    const count = Math.round(cands.length * d.density);
    sel = cands.slice().sort((a, b) => b.s - a.s).slice(0, count).sort((a, b) => a.t - b.t);
  } else {
    // 上級・達人・RUSH：音楽的フレーズ構造（8分音符骨格＋16分連打・トリル）
    const targetCount = d.target ? Math.min(cands.length, d.target) : Math.round(cands.length * d.density);
    const chosen = new Set();
    for (const c of cands) {
      if ((c.onBeat || c.sub % 2 === 0) && (c.loud > 0.22 || c.s > 0.75)) {
        chosen.add(c);
      }
    }
    for (let i = 0; i < cands.length; i++) {
      const c = cands[i];
      const loudThreshold = (p.diff === "master" || p.diff === "rush") ? 0.30 : 0.50;
      if (c.loud > loudThreshold && c.s > 0.8) {
        const isDense = (p.diff === "master" || p.diff === "rush");
        const burstLen = isDense ? (rand() < 0.45 ? 7 : (rand() < 0.5 ? 5 : 3)) : (rand() < 0.35 ? 5 : 3);
        for (let b = 0; b < burstLen && i + b < cands.length; b++) {
          chosen.add(cands[i + b]);
        }
      }
    }
    let list = Array.from(chosen);
    if (list.length < targetCount) {
      const remaining = cands.filter(c => !chosen.has(c)).sort((a, b) => b.s - a.s);
      list = list.concat(remaining.slice(0, targetCount - list.length));
    } else if (list.length > targetCount && p.diff !== "rush") {
      list.sort((a, b) => b.s - a.s);
      list = list.slice(0, targetCount);
    }
    sel = list.sort((a, b) => a.t - b.t);
  }
  return cgPlace(sel, p);
}

/* ---------- 新方式（chartGen 2） ---------- */
/* 曲を先頭から読み、各時刻の「前後 CG_LOCAL_HALF_S 秒」の代表値を秒ごとに1つ作る。
   rms は90パーセンタイル（ふだんの音量）、onset は正の値の95パーセンタイル（立ち上がりの強さ）。 */
function cgLocalNorm(a) {
  const N = Math.max(1, Math.ceil(a.frames * a.frameMs / 1000));
  const ref = new Float32Array(N), scl = new Float32Array(N);
  for (let s = 0; s < N; s++) {
    const f0 = Math.max(0, Math.floor((s - CG_LOCAL_HALF_S) * 1000 / a.frameMs));
    const f1 = Math.min(a.frames, Math.ceil((s + CG_LOCAL_HALF_S + 1) * 1000 / a.frameMs));
    const r = new Float32Array(Math.max(0, f1 - f0));
    for (let j = 0; j < r.length; j++) r[j] = a.rms[f0 + j];
    r.sort();
    ref[s] = r.length ? r[Math.floor((r.length - 1) * .9)] : 0;
    const o = [];
    for (let f = f0; f < f1; f++) if (a.onset[f] > 0) o.push(a.onset[f]);
    const oa = Float32Array.from(o).sort();
    scl[s] = oa.length ? oa[Math.min(oa.length - 1, Math.floor(oa.length * .95))] : 0;
  }
  return { ref, scl, N };
}
function cgSecOf(norm, t) { return Math.min(norm.N - 1, Math.max(0, Math.floor(t / 1000))); }
/* 局所の大きさ（その区間のふだんの音量に対する比）。無音に近いところは 0 に近づく */
function cgLocalLoud(a, norm, t) {
  const floor = (a.maxRms || 1) * CG_SILENCE_REL;
  return cgRmsAt(a, t) / Math.max(norm.ref[cgSecOf(norm, t)], floor);
}
function cgLocalScale(a, norm, t) {
  return norm.scl[cgSecOf(norm, t)] || a.scale || 1;
}

/* 配分：total 個を weights の比で caps 以下に割る（最大剰余法。上限に届いた区間は固定して残りを配り直す） */
function cgAllocate(total, weights, caps) {
  const out = new Array(weights.length).fill(0);
  let remaining = Math.min(total, caps.reduce((x, y) => x + y, 0));
  const active = new Set();
  for (let i = 0; i < weights.length; i++) if (caps[i] > 0 && weights[i] > 0) active.add(i);
  while (remaining > 0 && active.size) {
    let wsum = 0;
    for (const i of active) wsum += weights[i];
    const capped = [];
    for (const i of active) if (remaining * weights[i] / wsum >= caps[i] - out[i]) capped.push(i);
    if (capped.length) {
      for (const i of capped) { remaining -= caps[i] - out[i]; out[i] = caps[i]; active.delete(i); }
      continue;
    }
    let assigned = 0; const rem = [];
    for (const i of active) {
      const share = remaining * weights[i] / wsum, f = Math.floor(share);
      out[i] += f; assigned += f; rem.push([share - f, i]);
    }
    let left = remaining - assigned;
    rem.sort((x, y) => (y[0] - x[0]) || (x[1] - y[1]));
    for (const [, i] of rem) { if (left <= 0) break; if (out[i] < caps[i]) { out[i]++; left--; } }
    break;
  }
  return out;
}

/* 1区間の中から quota 個を選ぶ（旧方式の選び方を区間の中で行う） */
function cgPickSection(list, quota, diff, d, rand) {
  if (diff === "easy" || diff === "normal") {
    return list.slice().sort((a, b) => b.s - a.s).slice(0, quota);
  }
  const set = new Set();
  for (const c of list) {
    if ((c.onBeat || c.sub % 2 === 0) && (c.loud > 0.22 || c.s > 0.75)) set.add(c);
  }
  const loudThreshold = (diff === "master" || diff === "rush") ? 0.30 : 0.50;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c.loud > loudThreshold && c.s > 0.8) {
      const isDense = (diff === "master" || diff === "rush");
      const burstLen = isDense ? (rand() < 0.45 ? 7 : (rand() < 0.5 ? 5 : 3)) : (rand() < 0.35 ? 5 : 3);
      for (let b = 0; b < burstLen && i + b < list.length; b++) set.add(list[i + b]);
    }
  }
  let out = Array.from(set);
  if (out.length < quota) {
    const rest = list.filter(c => !set.has(c)).sort((a, b) => b.s - a.s);
    out = out.concat(rest.slice(0, quota - out.length));
  } else if (out.length > quota && diff !== "rush") {
    out.sort((a, b) => b.s - a.s);
    out = out.slice(0, quota);
  }
  return out;
}

function cgBuildSectioned(p) {
  const { analysis, diff, bpm, offset, rand, spec: d } = p;
  const step = 60000 / bpm / d.div;
  let startMs = 600, endMs = p.durationMs - 400;
  let norm = null;
  if (analysis) {
    norm = cgLocalNorm(analysis);
    const thr = analysis.maxRms * CG_SILENCE_REL; let f0 = 0, f1 = analysis.frames - 1;
    while (f0 < f1 && analysis.rms[f0] < thr) f0++;
    while (f1 > f0 && analysis.rms[f1] < thr) f1--;
    startMs = Math.max(300, f0 * analysis.frameMs - 30); endMs = Math.min(endMs, f1 * analysis.frameMs + 30);
  }
  const secTicks = CG_SECTION_BARS * 4 * d.div;     // 8小節ぶんの分割数（k の単位）
  const cands = [];
  for (let k = Math.ceil((startMs - offset) / step); ; k++) {
    const t = offset + k * step; if (t > endMs) break; if (t < startMs) continue;
    const sub = ((k % d.div) + d.div) % d.div, beatIdx = Math.floor(k / d.div);
    const onBeat = sub === 0, onBar = onBeat && ((beatIdx % 4) + 4) % 4 === 0;
    let s, loud = 0.5, rmsAbs = 0;
    if (analysis) {
      loud = cgLocalLoud(analysis, norm, t);
      if (loud < .05) continue;                       // 局所正規化の後で、本当に無音のところだけ落とす
      rmsAbs = cgRmsAt(analysis, t);
      s = Math.min(1.6, cgOnsetAt(analysis, t) / cgLocalScale(analysis, norm, t)) + loud * .35;
    } else s = rand() * .6;
    s *= onBar ? 1.6 : onBeat ? 1.3 : (sub % 2 === 0 ? 1.1 : 0.95);
    s += rand() * .1;
    cands.push({ t, s, onBar, onBeat, sub, k, loud, rmsAbs, sec: Math.floor(k / secTicks) });
  }

  /* 区間ごとに候補を分ける。ノーツ数は「候補数（長さ×密度）× 盛り上がりの係数」で先に決める */
  const bySec = new Map();
  let allRms = 0;
  for (const c of cands) {
    let list = bySec.get(c.sec); if (!list) bySec.set(c.sec, list = []);
    list.push(c); allRms += c.rmsAbs;
  }
  const secKeys = Array.from(bySec.keys()).sort((x, y) => x - y);
  const meanAll = cands.length ? allRms / cands.length : 0;
  const energyFactor = list => {
    if (!analysis || !(meanAll > 0)) return 1;
    let m = 0; for (const c of list) m += c.rmsAbs; m /= list.length;
    if (!(m > 0)) return 0.7;
    return Math.min(1.3, Math.max(0.7, 1 + 0.3 * Math.log2(m / meanAll)));
  };
  const total = d.target ? Math.min(cands.length, d.target) : Math.round(cands.length * d.density);
  const lists = secKeys.map(k => bySec.get(k));
  const quotas = cgAllocate(total, lists.map(l => l.length * energyFactor(l)), lists.map(l => l.length));

  const sel = [];
  lists.forEach((list, i) => {
    for (const c of cgPickSection(list, quotas[i], diff, d, rand)) sel.push(c);
  });
  sel.sort((a, b) => a.t - b.t);
  return cgPlace(sel, p);
}

/* ---------- 共通の仕上げ：連打・トリルの配置、レーン（ドン／カッ）の決定（旧方式から移したまま） ---------- */
function cgPlace(sel, p) {
  const { analysis, bpm, rand, spec: d, diff } = p;
  // 専門的な音ゲー配置（トリル・連打・複合ストリーム）
  const PAT_3 = [
    [0, 0, 1], // ドドカ
    [1, 1, 0], // カカド
    [0, 1, 0], // ドカド
    [1, 0, 1], // カドカ
    [0, 1, 1], // ドカカ
    [1, 0, 0], // カドド
    [0, 0, 0]  // ドドド
  ];
  const PAT_5 = [
    [0, 0, 1, 1, 0], // ドドカカド
    [1, 1, 0, 0, 1], // カカドドカ
    [0, 1, 0, 1, 0], // 5連トリル
    [0, 1, 1, 0, 1], // ドカカドカ
    [0, 0, 1, 0, 0]  // ドドカドド
  ];

  let med = 0, ratios = null;
  if (analysis && sel.length) {
    ratios = sel.map(c => cgRatioAt(analysis, c.t));
    const sr = ratios.slice().sort((a, b) => a - b);
    med = sr[Math.floor(sr.length / 2)] || 0;
  }

  const L = sel.length;
  const result = new Array(L);
  let idx = 0;
  const fastThresh = (60000 / bpm / d.div) * 1.35;

  while (idx < L) {
    let runEnd = idx;
    while (runEnd + 1 < L && sel[runEnd + 1].t - sel[runEnd].t <= fastThresh) {
      runEnd++;
    }
    const runLen = runEnd - idx + 1;

    if (runLen >= 3 && (diff === "hard" || diff === "master" || diff === "rush")) {
      const isTrill = (diff === "master" || diff === "rush") ? (rand() < 0.52) : (rand() < 0.38);
      if (isTrill || runLen >= 6) {
        let startColor = sel[idx].onBar ? 0 : (rand() < 0.6 ? 0 : 1);
        for (let k = 0; k < runLen; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: (startColor + k) % 2 };
        }
      } else if (runLen === 3) {
        const pat = PAT_3[Math.floor(rand() * PAT_3.length)];
        for (let k = 0; k < 3; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat[k] };
        }
      } else if (runLen === 4) {
        const r4 = rand();
        const pat4 = r4 < 0.45 ? [0, 1, 0, 1] : (r4 < 0.75 ? [0, 0, 1, 1] : [0, 1, 1, 0]);
        for (let k = 0; k < 4; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat4[k] };
        }
      } else if (runLen === 5) {
        const pat = PAT_5[Math.floor(rand() * PAT_5.length)];
        for (let k = 0; k < 5; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: pat[k] };
        }
      } else {
        const chunk = rand() < 0.5 ? 1 : 2;
        for (let k = 0; k < runLen; k++) {
          result[idx + k] = { time: Math.round(sel[idx + k].t), lane: Math.floor(k / chunk) % 2 };
        }
      }
      idx = runEnd + 1;
    } else {
      let lane;
      if (sel[idx].onBar && rand() < 0.85) lane = 0;
      else if (analysis && ratios) {
        lane = ratios[idx] > med ? 1 : 0;
        if (rand() < 0.10) lane = 1 - lane;
      } else {
        lane = rand() < 0.35 ? 1 : 0;
      }
      result[idx] = { time: Math.round(sel[idx].t), lane };
      idx++;
    }
  }

  return result;
}

/* 譜面の難易度表示（Lv.1〜20）。media.js の estimateLevel（levelOverride を除く本体）と同じ式 */
function cgEstimateLevel(notes) {
  if (!notes || !notes.length) return 1;
  const span = Math.max(10, (notes[notes.length - 1].time - notes[0].time) / 1000);
  const nps = notes.length / span;

  let peak = 0, j = 0;
  for (let i = 0; i < notes.length; i++) {
    while (notes[i].time - notes[j].time > 2500) j++;
    peak = Math.max(peak, (i - j + 1) / 2.5);
  }

  let fastCount = 0, trillCount = 0, ultraFast = 0;
  for (let i = 1; i < notes.length; i++) {
    const gap = notes[i].time - notes[i - 1].time;
    if (gap <= 220) {
      fastCount++;
      if (gap <= 100) ultraFast++;
      if (notes[i].lane !== notes[i - 1].lane && i >= 2 && notes[i - 1].lane !== notes[i - 2].lane && notes[i - 1].time - notes[i - 2].time <= 220) {
        trillCount++;
      }
    }
  }

  const fastRatio = fastCount / (notes.length - 1 || 1);
  const trillRatio = trillCount / (notes.length - 1 || 1);
  const ultraRatio = ultraFast / (notes.length - 1 || 1);

  // 音ゲー標準の Lv. 1 〜 20 スケール（初級 1〜3 / 中級 4〜6 / 上級 7〜11 / 達人 12〜15 / RUSH 16〜20）
  const base = nps * 0.88 + peak * 0.38 + 0.5;
  const tech = fastRatio * 1.8 + trillRatio * 1.5 + ultraRatio * 2.2;

  return Math.max(1, Math.min(20, Math.round(base + tech)));
}
