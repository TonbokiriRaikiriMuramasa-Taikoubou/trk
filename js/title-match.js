// SPDX-License-Identifier: GPL-3.0-or-later
/* ============ trk! 曲名の照合（純関数）============
   js/library.js から切り出した。曲名・メモの表記ゆれ（区切り・番号・別表記）を照合キーに直す部分だけで、
   ブラウザのグローバル（settings・metaOf など）には触らない。node --test（tests/title-match.test.mjs）から同じ関数を検査する。
   読み込み順：library.js より前（index.html）。plWishMatch（曲の当たりを付ける部分）は library.js に残す。
   ⚠ 関数名は classic script の共有スコープに載る。library.js と重ならないよう pl 接頭辞を保つこと。 */
/* 曲名の正規化（大文字小文字・前後と連続する空白）。照合キーの土台 */
const plNormTitle = t => String(t || "").trim().toLowerCase().replace(/\s+/g, " ");
/* 曲名の照合キー。ファイル名は「08_sometimes.fla」、カタログは「08 sometimes」のように
   区切りが違うことが多いので、厳しい順に候補を作って照合する（先頭＝そのまま）。 */
function plTitleKeys(t) {
  const out = [];
  const base = plNormTitle(t);
  if (!base) return out;
  out.push(base);
  const sep = base.replace(/\.[a-z0-9]{1,5}$/, "").replace(/[._\-\u30FB\uFF65\uFF0F\/]+/g, " ").replace(/\s+/g, " ").trim();
  if (sep && !out.includes(sep)) out.push(sep);
  const noNum = sep.replace(/^(?:vol\.?\s*)?\d{1,3}\s+/, "");   /* 「08 sometimes」→「sometimes」 */
  if (noNum && !out.includes(noNum)) out.push(noNum);
  return out;
}
/* 曲プロフィールの照合メモは表示タイトルに混ぜず、メモ単独と「メモ - 曲名」の候補を足す。
   例：タイトル BELIEVE ＋ メモ Suguri → カタログの Suguri - BELIEVE に一致 */
function plSongMatchKeys(title, matchHint) {
  const out = plTitleKeys(title);
  const hint = String(matchHint || "").trim().slice(0, 80);
  if (!hint) return out;
  /* メモ単独／「メモ - 曲名」の両方を候補にする。カタログ照合は片方だけでも拾える。 */
  for (const key of plTitleKeys(hint)) if (!out.includes(key)) out.push(key);
  for (const key of plTitleKeys(`${hint} - ${title}`)) if (!out.includes(key)) out.push(key);
  return out;
}
function plWishTitleKeys(wish) {
  const title = typeof wish === "string" ? wish : (wish && wish.t) || "";
  const out = plTitleKeys(title);
  /* 「キャラ名 - 曲名」のカタログ見出しは、左右どちらかだけの一致も許す。 */
  const parts = String(title || "").split(/\s+[-–—]\s+/).filter(Boolean);
  if (parts.length > 1) for (const part of parts) {
    for (const key of plTitleKeys(part)) if (!out.includes(key)) out.push(key);
  }
  /* 公式名と配布ファイル名が異なる場合だけ、データ側の別表記も照合候補に加える。 */
  if (wish && typeof wish === "object" && Array.isArray(wish.matchAliases)) {
    for (const alias of wish.matchAliases.slice(0, 8)) {
      for (const key of plTitleKeys(alias)) if (!out.includes(key)) out.push(key);
    }
  }
  return out;
}
