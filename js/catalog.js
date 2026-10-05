// SPDX-License-Identifier: GPL-3.0-or-later
/* ==========================================================================
   trk! catalog.js — 🛒 公式カタログ（音源は同梱しないプレイリスト集）

   【考え方】
   ・音源ファイル・譜面は一切ここに入れない。曲名などの「見出し」と公式の入手先だけ
   ・取り込むと「欲しい曲リスト（wish）」付きのプレイリストになる。未入手の曲は
     ライブラリでは薄く表示され、Musicフォルダに同じ曲名のファイルが入ると自動で追加される
   ・リンク先はすべて公式サイト（https限定）。trk! は内容を保証しない
   ・楽曲名・アルバム名は事実情報（著作権で保護されない）だが、シリーズ名などの
     商標はそれぞれの権利者さんのもの（NOTICE.md 参照。無関係・非公認です）
   ・MOD：自分のファイルで TRK_CATALOG.push({...}) しても追加できる（catalog.js より前に読む）
     S = シリーズ、PL = プレイリスト、T = 曲（t:曲名 / al:アルバム / ar:アーティスト / u:入手先URL）

   読み込み順：library.js の直前
   ========================================================================== */
"use strict";
const TRK_CATALOG = [];
(() => {
const S = (id, name, icon, color, catName, catIcon, note, url, playlists) =>
  TRK_CATALOG.push({ id, name, icon, color, catName, catIcon, note, url, playlists });
const PL = (id, name, icon, color, tags, songs) => ({ id, name, icon, color, tags, songs });
const T = (t, al, ar, u) => ({ t, al: al || "", ar: ar || "", u: u || "" });

/* ================= 🎒 ブルーアーカイブ（Nexon / Yostar） ================= */
S("bluearchive", "ブルーアーカイブ", "🎒", "blue", "ソーシャルゲーム", "🎮",
  "公式サウンドトラック（Vol.1〜Vol.4）は各種サブスク・ストアで配信中。公式YouTubeチャンネルでも聴けます。音源はご自身で入手してMusicフォルダへ。",
  "https://bluearchive.jp/",
  [PL("ba-ost", "ブルアカ OST 厳選", "🎧", "blue", ["ブルアカ", "ゲーム"],
    [T("Unwelcome School", "Blue Archive Original Soundtrack Vol.4", "Mitsukiyo"),
     T("Constant Moderato", "Blue Archive Original Soundtrack Vol.1", "Mitsukiyo"),
     T("青春のアーカイブ", "", "")])]);

/* ================= 🩺 アークナイツ（Hypergravity / Yostar） =================
   公式レーベル「Monster-Siren Records（塞壬唱片）」は全楽曲を公式サイトで公開・販売。
   曲名をタップすると公式の楽曲ページが開きます（開く前に確認が出ます）。 */
S("arknights", "アークナイツ", "🩺", "amber", "ソーシャルゲーム", "🎮",
  "公式音楽レーベル「Monster-Siren Records」のサイトで全楽曲を試聴・購入できます（中国語サイト・要ログインの場合あり）。",
  "https://monster-siren.hypergryph.com/",
  [PL("ak-msr", "アークナイツ MSR 厳選", "🎼", "amber", ["アークナイツ", "ゲーム"],
    [T("Still the Same", "", "", "https://monster-siren.hypergryph.com/music/461129"),
     T("Final Embrace", "", "", "https://monster-siren.hypergryph.com/music/125053"),
     T("Il Signore del Carnevale", "揭幕者们 / I Portatori dei Velluti OST", "", "https://monster-siren.hypergryph.com/music/048783"),
     T("Don't Waste the Joke", "揭幕者们 / I Portatori dei Velluti OST", "", "https://monster-siren.hypergryph.com/music/461135"),
     T("Boiling Blood", "明日方舟 Sound Track", "Cristina Vee"),
     T("Battleplan Arclight", "Contingency Contract Battleplan Pyrolysis OST", "")])]);

/* ================= ⚔️ League of Legends（Riot Games） =================
   Riot Games Music の「Sessions」シリーズは、クリエイターが安心して使える
   （Creator-Safe）楽曲として無料公開されている。SoundCloud の公式ページから
   ファイルをダウンロードできる曲もある。 */
S("lol", "League of Legends", "⚔️", "aqua", "PCゲーム", "🕹️",
  "Riot Games Music「Sessions」シリーズはクリエイター向けに無料公開（Creator-Safe）。SoundCloudの公式ページからダウンロードできる曲もあります。ガイドラインも確認してくださいね。",
  "https://www.riotgames.com/en/riot-music-creator-safe-guidelines",
  [PL("lol-svi", "Sessions: Vi 厳選", "🥊", "aqua", ["LoL", "Lo-Fi"],
    [T("Passengers.", "Sessions: Vi", "chromonicci"),
     T("Sage", "Sessions: Vi", "junior state"),
     T("Hollow", "Sessions: Vi", "Hanz"),
     T("Geode", "Sessions: Vi", "Gemp, Sinnr"),
     T("Reading Night", "Sessions: Vi", "xander."),
     T("In Circles", "Sessions: Vi", "Tennyson"),
     T("Swing", "Sessions: Vi", "SwuM"),
     T("Take Your Time", "Sessions: Vi", "Engelwood"),
     T("Home Is Where My Heart Is", "Sessions: Vi", "Kupla"),
     T("Iota", "Sessions: Vi", "Laxcity"),
     T("Golden", "Sessions: Vi", "Idealism"),
     T("Daffodil", "Sessions: Vi", "Tennyson"),
     T("Afterglow", "Sessions: Vi", "Kupla"),
     T("First Light", "Sessions: Vi", "goosetaf")])]);

/* ================= 🎯 VALORANT（Riot Games） ================= */
S("valorant", "VALORANT", "🎯", "red", "PCゲーム", "🕹️",
  "VALORANTのオフィシャル楽曲は公式YouTubeチャンネル・ストアで公開。RiotのCreator-Safeガイドラインも参照してください。",
  "https://www.riotgames.com/en/riot-music-creator-safe-guidelines",
  [PL("val-themes", "VALORANT テーマ厳選", "🎯", "red", ["VALORANT"],
    [T("Die For You", "VALORANT Champions 2021", "Grabbitz"),
     T("Entertain Me", "VALORANT OST", "Ylona Garcia"),
     T("On My Level", "VALORANT OST", "Ashley Warren")])]);

/* ================= ⚡ NoCopyrightSounds（イギリス発・世界的なフリーDLレーベル） =================
   NCSはクリエイター向けに楽曲を無料配布するレーベル。公式サイトの各曲ページから
   無料でダウンロードできる（クレジット表記などのルールは各曲ページで確認）。 */
S("ncs", "NoCopyrightSounds", "⚡", "aqua", "フリー音源", "🎁",
  "クリエイター向けに楽曲を無料配布するレーベル。公式サイトの各曲ページから無料でダウンロードできます（クレジット表記のルールは各曲ページで確認）。",
  "https://ncs.io/",
  [PL("ncs-top", "NCS 定番", "⚡", "aqua", ["NCS", "エレクトロニック"],
    [T("Fade", "NCS Release", "Alan Walker", "https://ncs.io/fade"),
     T("Spectre", "NCS Release", "Alan Walker"),
     T("Force", "NCS Release", "Alan Walker"),
     T("Blank", "NCS Release", "Disfigure"),
     T("My Heart", "NCS Release", "Different Heaven & EH!DE"),
     T("On & On", "NCS Release", "Cartoon feat. Daniel Levi")])]);

/* ================= 🎼 Kevin MacLeod / incompetech（米国・CC BY） ================= */
S("macleod", "Kevin MacLeod", "🎼", "green", "フリー音源", "🎁",
  "米国の作曲家Kevin MacLeodさんのロイヤリティフリー音楽ライブラリ。CC BY 4.0（クレジット表記で無料・ダウンロード自由）。",
  "https://incompetech.com/",
  [PL("km-top", "incompetech 定番", "🎼", "green", ["BGM", "フリー"],
    [T("Mechanolith", "incompetech", "Kevin MacLeod"),
     T("Sneaky Snitch", "incompetech", "Kevin MacLeod"),
     T("Fluffing a Duck", "incompetech", "Kevin MacLeod"),
     T("Carefree", "incompetech", "Kevin MacLeod"),
     T("Cipher", "incompetech", "Kevin MacLeod")])]);

/* ================= ❄ 原神 Genshin Impact（miHoYo / HOYO-MiX・中国） =================
   ※フリー配布ではなく、公式YouTubeチャンネルでの視聴とサブスク・CDでの入手が案内先 */
S("genshin", "原神（Genshin Impact）", "❄", "purple", "PCゲーム", "🕹️",
  "HOYO-MiXによるOSTは公式YouTubeチャンネルで全曲を視聴でき、Spotify・Apple Musicでも配信中。※フリー配布ではないので、音源ファイルはサブスク・CDで。",
  "https://genshin.hoyoverse.com/",
  [PL("gi-top", "原神 OST 厳選", "❄", "purple", ["原神", "ゲーム"],
    [T("Liyue", "Jade Moon Upon a Sea of Clouds", "Yu-Peng Chen / HOYO-MiX"),
     T("Good Night, Liyue", "Jade Moon Upon a Sea of Clouds", "Yu-Peng Chen / HOYO-MiX"),
     T("Clear Sky over Liyue", "Jade Moon Upon a Sea of Clouds", "Yu-Peng Chen / HOYO-MiX"),
     T("Before Dawn, at the Winery", "City of Winds and Idylls", "Yu-Peng Chen / HOYO-MiX"),
     T("Say My Name", "City of Winds and Idylls", "Yu-Peng Chen / HOYO-MiX"),
     T("Moonlike Smile", "The Wind and the Star Traveler", "Yu-Peng Chen / HOYO-MiX"),
     T("Snow-Buried Tales", "Vortex of Legends", "Yu-Peng Chen / HOYO-MiX")])]);
/* ================= 🍊 100% Orange Juice（Orange-Juice / Fruitbat Factory） =================
   ゲーム内BGMの大半はロイヤリティフリー音源（作曲者さんのサイトなどで公式配布）。
   公式Wikiのサントラページに、元の曲名と作曲者の一覧があります。 */
S("oj", "100% Orange Juice", "🍊", "amber", "フリー音源", "🎁",
  "ゲーム内BGMの大半はロイヤリティフリー音源。公式Wikiのサントラページに元の曲名と作曲者がまとまっています（音源は各作曲者さんの公式サイトから入手してください）。",
  "https://orangejuice.wiki/wiki/100%25_Orange_Juice!_(Soundtrack)",
  [PL("oj-bgm", "100%OJ BGM 厳選", "🍊", "amber", ["100%OJ", "ボードゲーム"],
    [T("Sincere", "", "SAM Free Music"),
     T("Photo shot", "", "煉獄小僧"),
     T("Friendly", "", "SAM Free Music"),
     T("Sound to tell the truth", "", "Shiho+"),
     T("Sunrise", "", "かずち"),
     T("Catastrophe", "", "NaruIDEA"),
     T("the Lord", "", "ISAo."),
     T("The other side of the end", "", "煉獄小僧"),
     T("Morning Visit", "", "まんぼう二等兵"),
     T("dear Dragon", "", "Mus Mus"),
     T("Pluto", "", "Cyber-Rainforce")])]);

/* ================= 🌟 学園アイドルマスター（Bandai Namco Entertainment） =================
   レーベル公式サイトが、楽曲ごとのインスト音源データを継続して公開中
   （公式Google Driveからダウンロード。インスト音源利用ガイドラインあり）。 */
S("gakumas", "学園アイドルマスター", "🌟", "pink", "ソーシャルゲーム", "🎮",
  "レーベル公式サイトのNEWSで、楽曲ごとのインスト音源データを継続公開中（公式Google Driveからダウンロードできます。利用ガイドラインも確認してくださいね）。",
  "https://gakuen-label.idolmaster-official.jp/",
  [PL("gm-inst", "学マス インスト厳選", "🌟", "pink", ["学マス", "アイマス"],
    [T("Fighting My Way", "学マス インスト音源", "花海咲季"),
     T("Luna say maybe", "学マス インスト音源", "月村手毬"),
     T("世界一可愛い私", "学マス インスト音源", "藤田ことね"),
     T("Fluorite", "学マス インスト音源", "有村麻央"),
     T("白線", "学マス インスト音源", "葛城リーリヤ"),
     T("Wonder Scale", "学マス インスト音源", "倉本千奈"),
     T("Tame-Lie-One-Step", "学マス インスト音源", "紫雲清夏"),
     T("光景", "学マス インスト音源", "篠澤広"),
     T("clumsy trick", "学マス インスト音源", "姫崎莉波"),
     T("標", "学マス インスト音源", "初星学園")])]);

/* ================= ⭐ 東方Project（上海アリス幻樂団） ================= */
S("touhou", "東方Project", "⭐", "red", "同人ゲーム", "🏮",
  "ZUNさん（上海アリス幻樂団）の公式サイト。作品と音楽CDの情報はここで。ゲームの体験版もダウンロードできます（体験版にもBGMが入っています）。",
  "https://www16.big.or.jp/~zun/",
  [PL("th-classics", "東方 原曲クラシック", "⭐", "red", ["東方", "原曲"],
    [T("U.N.オーエンは彼女なのか?", "東方紅魔郷", "ZUN"),
     T("亡き王女の為のセプテット", "東方紅魔郷", "ZUN"),
     T("月まで届け、不死の煙", "東方紅魔郷", "ZUN"),
     T("幽雅に咲かせ、墨染の桜 ～ Border of Life", "東方妖々夢", "ZUN"),
     T("千年幻想郷 ～ History of the Moon", "東方永夜抄", "ZUN"),
     T("ハルトマンの妖怪少女", "東方地霊殿", "ZUN"),
     T("神々が恋した幻想郷", "東方風神録", "ZUN"),
     T("ネイティブフェイス", "東方風神録", "ZUN")])]);
})();
/* ✅ catalog.js 完了（シリーズ5・プレイリスト5。MODで TRK_CATALOG.push して追加できます） */
