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

/* ================= 🍊 SAM Free Music — 100% Orange Juice! で出会える10曲（最初のオススメ） =================
   SAM Free Music（@samfree33）の楽曲のうち、100% Orange Juice! で出会える10曲を最初のオススメに。
   Wikiのサントラ解説（テーマ名—曲名対応）を手がかりに、気になったら聴いてみてください。
   音源は同梱しません。個人でご用意のうえ 📁 Musicフォルダへ。 */
S("samfree", "SAM Free Music — 100% Orange Juice! 10選", "\uD83C\uDF4A", "amber", "ゲーム音楽", "\uD83C\uDFAE",
  "最初の10曲はSAM Free Music — 100% Orange Juice! で出会える曲です。気に入ったら @samfree33 ものぞいてみてください。Wikiのサントラ解説を手がかりに個人でどうぞ。音源は同梱しません。",
  "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)",
  [PL("samfree-oj10", "SAM Free Music 10選 — 100%OJで出会える曲", "\uD83C\uDF4A", "amber", ["Game","100%OJ","Suguri Series","samfree"],
    [T("Menu - Sincere", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Dialog 1 - Friendly", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("QP - peace", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Yuki - Secret Mission", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Suguri - BELIEVE", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Hime - Comet", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Sora - Up to you", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Marc - Hill of Wind", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Peat - Dead or Alive", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)"),
     T("Marie Poppo - Childlike", "100% Orange Juice!", "samfree", "https://100orangejuice.fandom.com/wiki/100%25_Orange_Juice!_(Soundtrack)")])]);

/* ================= 🎻 クラシック名盤 — 版権切れの名演（Public Domain） =================
   バッハからドビュッシーまで、没後70年以上で作曲の著作権が切れた名曲を、MusopenのPublic Domain録音（CC-PD）と
   IMSLP／Mutopiaの楽譜で紹介します。音源は同梱しません。Musopen（https://musopen.org/）やArchive.orgのPD録音、
   ウィキメディア・コモンズの音源などを個人でご用意のうえ 📁 Musicフォルダへ。ウィキペディアやIMSLPも併用できます。
   単曲だけ有名な作曲家は Popular にまとめています。 */
S("classical", "クラシック名盤 — 版権切れの名演", "🎻", "purple", "クラシック", "🎼",
  "バッハからドビュッシーまで、作曲の著作権が切れた名曲をMusopenのPublic Domain録音とIMSLPの楽譜で紹介。音源は同梱しません。個人でご用意のうえ 📁 Musicフォルダへ。単曲で有名な作曲家は Popular にまとめています。",
  "https://musopen.org/",
  [PL("classic-beethoven", "Beethoven — 運命と月光とエリーゼ", "🎹", "amber", ["Classic","Beethoven","Symphony","Piano"],
    [T("Symphony No.5 - I. Allegro con brio", "Symphony No.5 Op.67", "Beethoven", "https://musopen.org/music/2567-symphony-no-5-in-c-minor-op-67/"),
     T("Symphony No.9 - Ode to Joy", "Symphony No.9 Op.125", "Beethoven", "https://musopen.org/music/2553-symphony-no-9-in-d-minor-op-125/"),
     T("Für Elise - Bagatelle No.25", "Bagatelle", "Beethoven", "https://musopen.org/music/4545-fur-elise-bagatelle-no-25-in-a-minor/"),
     T("Moonlight Sonata - I. Adagio sostenuto", "Piano Sonata No.14", "Beethoven", "https://musopen.org/music/2549-piano-sonata-no-14-in-c-sharp-minor-moonlight-op-27-no-2/")]),
   PL("classic-mozart-bach", "Mozart・Bach — 古典の礎", "🎻", "blue", ["Classic","Mozart","Bach","Baroque"],
    [T("Eine kleine Nachtmusik - I. Allegro", "Serenade K.525", "Mozart", "https://musopen.org/music/2674-serenade-no-13-for-strings-eine-kleine-nachtmusik/"),
     T("Symphony No.40 - I. Molto allegro", "Symphony No.40 K.550", "Mozart", "https://musopen.org/music/composer/wolfgang-amadeus-mozart/"),
     T("Toccata and Fugue in D minor, BWV 565", "BWV 565", "J.S. Bach", "https://musopen.org/music/2210-toccata-and-fugue-in-d-minor-bwv-565/"),
     T("Air on the G String, BWV 1068", "Orchestral Suite No.3", "J.S. Bach", "https://musopen.org/music/1226-air-on-the-g-string/")]),
   PL("classic-chopin-liszt", "Chopin・Liszt — ピアノの詩人", "🎹", "pink", ["Classic","Chopin","Liszt","Piano"],
    [T("Nocturne Op.9 No.2 in E-flat major", "Nocturnes Op.9", "Chopin", "https://musopen.org/music/108-nocturnes-op-9/"),
     T("Étude Op.10 No.3 'Tristesse'", "Études Op.10", "Chopin", "https://musopen.org/music/composer/frederic-chopin/"),
     T("Liebestraum No.3 in A-flat major", "Liebesträume S.541", "Liszt", "https://musopen.org/sheetmusic/1025/franz-liszt/liebestraume-s-541/"),
     T("Hungarian Rhapsody No.2", "Hungarian Rhapsody", "Liszt", "https://musopen.org/music/composer/franz-liszt/")]),
   PL("classic-gems", "Popular Classics — 一度は聴いた名曲", "✨", "green", ["Classic","Popular","Gems","Orchestra"],
    [T("The Four Seasons - Spring: Allegro", "The Four Seasons Op.8", "Vivaldi", "https://musopen.org/music/2212-the-four-seasons/"),
     T("Canon in D major", "Canon and Gigue", "Pachelbel", "https://musopen.org/music/44093-canon-and-gigue-in-d-major-flute-quartet-arr/"),
     T("Clair de Lune", "Suite bergamasque", "Debussy", "https://musopen.org/music/1463-clair-de-lune/"),
     T("The Blue Danube, Op.314", "Waltz", "Strauss II", "https://musopen.org/music/composer/johann-strauss-ii/"),
     T("In the Hall of the Mountain King", "Peer Gynt Suite", "Grieg", "https://musopen.org/music/composer/edvard-grieg/")]),
   PL("classic-tchaikovsky-ballet", "Tchaikovsky — バレエ三大作", "🩰", "red", ["Classic","Tchaikovsky","Ballet","Orchestra"],
    [T("Nutcracker - Miniature Overture", "Nutcracker Op.71", "Tchaikovsky", "https://musopen.org/music/composer/pyotr-ilyich-tchaikovsky/"),
     T("Nutcracker - March", "Nutcracker Op.71", "Tchaikovsky", "https://musopen.org/music/composer/pyotr-ilyich-tchaikovsky/"),
     T("Nutcracker - Dance of the Sugar Plum Fairy", "Nutcracker Op.71", "Tchaikovsky", "https://musopen.org/music/composer/pyotr-ilyich-tchaikovsky/"),
     T("Nutcracker - Trepak (Russian Dance)", "Nutcracker Op.71", "Tchaikovsky", "https://musopen.org/music/composer/pyotr-ilyich-tchaikovsky/"),
     T("Nutcracker - Waltz of the Flowers", "Nutcracker Op.71", "Tchaikovsky", "https://musopen.org/music/composer/pyotr-ilyich-tchaikovsky/")]),
   PL("classic-mussorgsky-pictures", "Mussorgsky — 展覧会の絵", "🎨", "amber", ["Classic","Mussorgsky","Pictures","Piano"],
    [T("Promenade", "Pictures at an Exhibition", "Mussorgsky", "https://musopen.org/music/composer/modest-mussorgsky/"),
     T("The Gnome", "Pictures at an Exhibition", "Mussorgsky", "https://musopen.org/music/composer/modest-mussorgsky/"),
     T("Ballet of the Unhatched Chicks", "Pictures at an Exhibition", "Mussorgsky", "https://musopen.org/music/composer/modest-mussorgsky/"),
     T("The Great Gate at Kiev", "Pictures at an Exhibition", "Mussorgsky", "https://musopen.org/music/composer/modest-mussorgsky/"),
     T("The Old Castle", "Pictures at an Exhibition", "Mussorgsky", "https://musopen.org/music/composer/modest-mussorgsky/")]),
   PL("classic-saintsaens-carnival", "Saint-Saëns — 動物の謝肉祭", "🦢", "green", ["Classic","Saint-Saens","Carnival","Orchestra"],
    [T("Introduction and Royal March of the Lion", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Hens and Roosters", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Aquarium", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("The Swan", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Kangaroos", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Fossils", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Tortoises", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("The Elephant", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("Danse Macabre, Op.40", "Danse Macabre", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/"),
     T("The Carnival - Finale", "Carnival of the Animals", "Saint-Saens", "https://musopen.org/music/composer/camille-saint-saens/")]),
   PL("classic-mendelssohn-rimsky", "Mendelssohn・Rimsky — 梦と物語", "🌿", "pink", ["Classic","Mendelssohn","Rimsky","Romantic"],
    [T("Wedding March", "A Midsummer Night's Dream Op.61", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/"),
     T("Scherzo", "A Midsummer Night's Dream Op.61", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/"),
     T("Nocturne", "A Midsummer Night's Dream Op.61", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/"),
     T("Overture", "A Midsummer Night's Dream Op.61", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/"),
     T("The Sea and Sinbad's Ship", "Scheherazade Op.35", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("The Kalender Prince", "Scheherazade Op.35", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("The Young Prince and Princess", "Scheherazade Op.35", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("Flight of the Bumblebee", "Tsar Saltan Op.57", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("Festival at Baghdad", "Scheherazade Op.35", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("Songs Without Words Op.19-1", "Songs Without Words", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/")]),
   PL("classic-delibes-bizet", "Delibes・Bizet — バレエとオペラ", "💃", "red", ["Classic","Delibes","Bizet","Ballet"],
    [T("Waltz of the Hours", "Coppelia", "Delibes", "https://musopen.org/music/composer/leo-delibes/"),
     T("Music of the Automatons", "Coppelia Act 2", "Delibes", "https://musopen.org/music/composer/leo-delibes/"),
     T("Mazurka", "Coppelia", "Delibes", "https://musopen.org/music/composer/leo-delibes/"),
     T("Habanera", "Carmen", "Bizet", "https://musopen.org/music/composer/georges-bizet/"),
     T("Toreador Song", "Carmen", "Bizet", "https://musopen.org/music/composer/georges-bizet/"),
     T("Aragonaise", "Carmen", "Bizet", "https://musopen.org/music/composer/georges-bizet/"),
     T("Polovtsian Dances", "Prince Igor", "Borodin", "https://musopen.org/music/composer/alexander-borodin/"),
     T("In the Steppes of Central Asia", "Steppes", "Borodin", "https://musopen.org/music/composer/alexander-borodin/"),
     T("Mazurka Op.6-1", "Mazurka", "Chopin", "https://musopen.org/music/composer/frederic-chopin/"),
     T("Maiden's Prayer", "Prayer", "Badarzewska", "https://musopen.org/music/composer/tekla-badarzewska/")]),
   PL("classic-vivaldi-baroque", "Vivaldi・Pachelbel — バロックの華", "🎻", "blue", ["Classic","Vivaldi","Pachelbel","Baroque"],
    [T("Four Seasons - Summer: Presto", "Four Seasons Op.8", "Vivaldi", "https://musopen.org/music/2212-the-four-seasons/"),
     T("Four Seasons - Autumn: Allegro", "Four Seasons Op.8", "Vivaldi", "https://musopen.org/music/2212-the-four-seasons/"),
     T("Four Seasons - Winter: Largo", "Four Seasons Op.8", "Vivaldi", "https://musopen.org/music/2212-the-four-seasons/"),
     T("Water Music - Air", "Water Music HWV 348", "Handel", "https://musopen.org/music/composer/george-frideric-handel/"),
     T("Messiah - Hallelujah Chorus", "Messiah HWV 56", "Handel", "https://musopen.org/music/composer/george-frideric-handel/"),
     T("Canon - Full Score", "Canon", "Pachelbel", "https://musopen.org/music/44093-canon-and-gigue-in-d-major-flute-quartet-arr/"),
     T("Brandenburg Concerto No.3 - I. Allegro", "Brandenburg Op.1045", "J.S. Bach", "https://musopen.org/music/composer/johann-sebastian-bach/"),
     T("Goldberg Variations - Aria", "Goldberg BWV 988", "J.S. Bach", "https://musopen.org/music/composer/johann-sebastian-bach/"),
     T("Cello Suite No.1 - Prelude", "Cello Suite BWV 1007", "J.S. Bach", "https://musopen.org/music/composer/johann-sebastian-bach/"),
     T("Dido's Lament", "Dido and Aeneas", "Purcell", "https://musopen.org/music/composer/henry-purcell/")]),
   PL("classic-brahms-debussy", "Brahms・Debussy — 浪漫と印象", "🎶", "purple", ["Classic","Brahms","Debussy","Romantic"],
    [T("Hungarian Dance No.5", "Hungarian Dances WoO1", "Brahms", "https://musopen.org/music/composer/johannes-brahms/"),
     T("Hungarian Dance No.6", "Hungarian Dances", "Brahms", "https://musopen.org/music/composer/johannes-brahms/"),
     T("Lullaby (Wiegenlied) Op.49-4", "Lullaby", "Brahms", "https://musopen.org/music/composer/johannes-brahms/"),
     T("New World Symphony - Largo", "Symphony No.9 Op.95", "Dvorak", "https://musopen.org/music/composer/antonin-dvorak/"),
     T("Golliwog's Cakewalk", "Children's Corner", "Debussy", "https://musopen.org/music/composer/claude-debussy/"),
     T("Prelude to the Afternoon of a Faun", "Prelude", "Debussy", "https://musopen.org/music/composer/claude-debussy/"),
     T("Gymnopedie No.1", "Gymnopedies", "Satie", "https://musopen.org/music/composer/erik-satie/"),
     T("Gymnopedie No.3", "Gymnopedies", "Satie", "https://musopen.org/music/composer/erik-satie/"),
     T("Bolero", "Bolero", "Ravel", "https://musopen.org/music/composer/maurice-ravel/"),
     T("Pavane for a Dead Princess", "Pavane", "Ravel", "https://musopen.org/music/composer/maurice-ravel/")]),
   PL("classic-wagner-strauss-schubert", "Wagner・Strauss・Schubert — 奥行と歌", "🎭", "amber", ["Classic","Wagner","Strauss","Schubert"],
    [T("Lohengrin - Prelude Act 3", "Lohengrin WWV 75", "Wagner", "https://musopen.org/music/composer/richard-wagner/"),
     T("Siegfried Idyll", "Siegfried Idyll WWV 103", "Wagner", "https://musopen.org/music/composer/richard-wagner/"),
     T("Ride of the Valkyries", "Die Walkure", "Wagner", "https://musopen.org/music/composer/richard-wagner/"),
     T("Tales from the Vienna Woods", "Tales Op.325", "Strauss II", "https://musopen.org/music/composer/johann-strauss-ii/"),
     T("Voices of Spring", "Voices Op.410", "Strauss II", "https://musopen.org/music/composer/johann-strauss-ii/"),
     T("Ave Maria, D.839", "Ave Maria", "Schubert", "https://musopen.org/music/composer/franz-schubert/"),
     T("Erlking, D.328", "Erlking", "Schubert", "https://musopen.org/music/composer/franz-schubert/"),
     T("Serenade, D.957-4", "Serenade", "Schubert", "https://musopen.org/music/composer/franz-schubert/"),
     T("Träumerei, Op.15-7", "Kinderszenen", "Schumann", "https://musopen.org/music/composer/robert-schumann/"),
     T("Widmung, Op.25-1", "Myrthen", "Schumann", "https://musopen.org/music/composer/robert-schumann/")]),
   PL("classic-tutu-bonus", "Princess Tutu — 物語を紡ぐ曲達", "🧚", "pink", ["Classic","Princess Tutu","Ballet","Anime"],
    [T("Coppelia - Waltz of the Hours (Tutu)", "Coppelia", "Delibes", "https://musopen.org/music/composer/leo-delibes/"),
     T("Giselle - Hilarion's Entrance", "Giselle", "Adam", "https://musopen.org/music/composer/adolphe-adam/"),
     T("Don Quixote - Kitri's Entrance", "Don Quixote", "Minkus", "https://musopen.org/music/composer/leon-minkus/"),
     T("La Sylphide - Finale", "La Sylphide", "Lovenskjold", "https://musopen.org/music/composer/herman-lovenskiold/"),
     T("Cinderella - Waltz-Coda", "Cinderella", "Prokofiev", "https://musopen.org/music/composer/sergei-prokofiev/"),
     T("Cinderella - Midnight", "Cinderella", "Prokofiev", "https://musopen.org/music/composer/sergei-prokofiev/"),
     T("Scheherazade - Young Prince", "Scheherazade", "Rimsky-Korsakov", "https://musopen.org/music/composer/nikolai-rimsky-korsakov/"),
     T("Caucasian Sketches - In the Pass", "Caucasian Sketches", "Ippolitov-Ivanov", "https://musopen.org/music/composer/mikhail-ippolitov-ivanov/"),
     T("On Wings of Song, Op.34-2", "On Wings of Song", "Mendelssohn", "https://musopen.org/music/composer/felix-mendelssohn/"),
     T("Arabesque No.1", "Arabesque", "Schumann", "https://musopen.org/music/composer/robert-schumann/"),
     T("Egmont Overture", "Egmont Op.84", "Beethoven", "https://musopen.org/music/composer/ludwig-van-beethoven/"),
     T("Coriolan Overture", "Coriolan Op.62", "Beethoven", "https://musopen.org/music/composer/ludwig-van-beethoven/"),
     T("Firebird - Tableau 2", "Firebird", "Stravinsky", "https://musopen.org/music/composer/igor-stravinsky/")])]);

/* ================= 🎒 ブルーアーカイブ（Nexon / Yostar） ================= */
S("bluearchive", "ブルーアーカイブ", "🎒", "blue", "ソーシャルゲーム", "🎮",
  "公式サウンドトラック（Vol.1〜Vol.4）は各種サブスク・ストアで配信中。公式YouTubeチャンネルでも聴けます。音源はご自身で入手してMusicフォルダへ。Vol.ごとにフォルダ分けして収容（100超は Vol.2 自動作成）。",
  "https://bluearchive.jp/",
  [PL("ba-v1", "ブルアカ OST Vol.1", "💿", "blue", ["Game","Blue Archive","OST","Vol.1","Mitsukiyo"],
    [T("Constant Moderato", "Blue Archive Original Soundtrack Vol.1", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.1"),
     T("Vol.1 - Discovery", "Vol.1", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.1"),
     T("Vol.1 - Courage", "Vol.1", "Karut", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.1"),
     T("青春のアーカイブ", "Blue Archive OST", "Nor", "https://bluearchive.jp/")]),
   PL("ba-v2", "ブルアカ OST Vol.2", "💿", "blue", ["Game","Blue Archive","OST","Vol.2","Mitsukiyo"],
    [T("Vol.2 - Search", "Blue Archive Original Soundtrack Vol.2", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.2"),
     T("Vol.2 - Future", "Vol.2", "KARUT", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.2")]),
   PL("ba-v3", "ブルアカ OST Vol.3", "💿", "blue", ["Game","Blue Archive","OST","Vol.3","Mitsukiyo"],
    [T("Vol.3 - To the Sky", "Blue Archive Original Soundtrack Vol.3", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.3")]),
   PL("ba-v4", "ブルアカ OST Vol.4", "💿", "blue", ["Game","Blue Archive","OST","Vol.4","Mitsukiyo"],
    [T("Unwelcome School", "Blue Archive Original Soundtrack Vol.4", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.4"),
     T("Aoharu", "Vol.4", "Mitsukiyo", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.4"),
     T("Future Breeze", "Vol.4", "Nor", "https://bluearchive.fandom.com/wiki/Blue_Archive_Original_Soundtrack_Vol.4")])]);

/* ================= 🩺 アークナイツ（Hypergravity / Yostar） =================
   公式レーベル「Monster-Siren Records（塞壬唱片）」は全楽曲を公式サイトで公開・販売。
   曲名をタップすると公式の楽曲ページが開きます（開く前に確認が出ます）。 */
S("arknights", "アークナイツ", "🩺", "amber", "ソーシャルゲーム", "🎮",
  "公式音楽レーベル「Monster-Siren Records」のサイトで全楽曲を試聴・購入できます（中国語サイト・要ログインの場合あり）。アルバム別フォルダで収容（100超は Vol.2 自動作成）。",
  "https://monster-siren.hypergryph.com/",
  [PL("ak-msr", "アークナイツ MSR 厳選", "🎼", "amber", ["Game","Arknights","MSR","Monster Siren"],
    [T("Still the Same", "", "", "https://monster-siren.hypergryph.com/music/461129"),
     T("Final Embrace", "", "", "https://monster-siren.hypergryph.com/music/125053"),
     T("Il Signore del Carnevale", "揭幕者们 / I Portatori dei Velluti OST", "", "https://monster-siren.hypergryph.com/music/048783"),
     T("Don't Waste the Joke", "揭幕者们 / I Portatori dei Velluti OST", "", "https://monster-siren.hypergryph.com/music/461135")]),
   PL("ak-blood", "アークナイツ — Boiling Blood", "🔥", "red", ["Game","Arknights","MSR","Boiling Blood"],
    [T("Boiling Blood", "明日方舟 Sound Track", "Cristina Vee", "https://monster-siren.hypergryph.com/"),
     T("Arclight", "明日方舟 Sound Track", "", "https://monster-siren.hypergryph.com/")]),
   PL("ak-contingency", "アークナイツ — Contingency Contract", "🛡️", "amber", ["Game","Arknights","MSR","Contingency Contract"],
    [T("Battleplan Arclight", "Contingency Contract Battleplan Pyrolysis OST", "", "https://monster-siren.hypergryph.com/"),
     T("Battleplan Pyrolysis", "Contingency Contract", "", "https://monster-siren.hypergryph.com/")])]);

/* ================= ⚔️ League of Legends（Riot Games） =================
   Riot Games Music の「Sessions」シリーズは、クリエイターが安心して使える
   （Creator-Safe）楽曲として無料公開されている。SoundCloud の公式ページから
   ファイルをダウンロードできる曲もある。 */
S("lol", "League of Legends", "⚔️", "aqua", "PCゲーム", "🕹️",
  "Riot Games Music「Sessions」シリーズはクリエイター向けに無料公開（Creator-Safe）。SoundCloudの公式ページからダウンロードできる曲もあります。ガイドラインも確認してくださいね。",
  "https://www.riotgames.com/en/riot-music-creator-safe-guidelines",
  [PL("lol-svi", "Sessions: Vi 厳選", "🥊", "aqua", ["Game","LoL","Sessions:Vi","Riot Games"],
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
  [PL("val-themes", "VALORANT テーマ厳選", "🎯", "red", ["Game","VALORANT","Riot Games"],
    [T("Die For You", "VALORANT Champions 2021", "Grabbitz"),
     T("Entertain Me", "VALORANT OST", "Ylona Garcia"),
     T("On My Level", "VALORANT OST", "Ashley Warren")])]);

/* ================= ⚡ NoCopyrightSounds（イギリス発・世界的なフリーDLレーベル） =================
   NCSはクリエイター向けに楽曲を無料配布するレーベル。公式サイトの各曲ページから
   無料でダウンロードできる（クレジット表記などのルールは各曲ページで確認）。 */
S("ncs", "NoCopyrightSounds", "⚡", "aqua", "フリー音源", "🎁",
  "クリエイター向けに楽曲を無料配布するレーベル。公式サイトの各曲ページから無料でダウンロードできます（クレジット表記のルールは各曲ページで確認）。",
  "https://ncs.io/",
  [PL("ncs-top", "NCS 定番", "⚡", "aqua", ["Free","NCS","NCS Release","Alan Walker"],
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
  [PL("km-top", "incompetech 定番", "🎼", "green", ["Free","incompetech","Kevin MacLeod"],
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
  [PL("gi-top", "原神 OST 厳選", "❄", "purple", ["Game","Genshin","HOYO-MiX","Yu-Peng Chen"],
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
  [PL("oj-bgm", "100%OJ BGM 厳選", "🍊", "amber", ["Game","100%OJ","Soundtrack","FreeBGM"],
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
  "レーベル公式サイトのNEWSで、楽曲ごとのインスト音源データを継続公開中（公式Google Driveからダウンロードできます。利用ガイドラインも確認してくださいね）。キャラクター別に収容（100超は Vol.2 自動作成）。",
  "https://gakuen-label.idolmaster-official.jp/",
  [PL("gm-inst", "学マス インスト厳選 — キャラ別", "🌟", "pink", ["Game","Gakumas","Idolmaster","Bandai Namco"],
    [T("Fighting My Way — 花海咲季", "学マス インスト音源", "花海咲季", "https://gakuen-label.idolmaster-official.jp/"),
     T("Luna say maybe — 月村手毬", "学マス インスト音源", "月村手毬", "https://gakuen-label.idolmaster-official.jp/"),
     T("世界一可愛い私 — 藤田ことね", "学マス インスト音源", "藤田ことね", "https://gakuen-label.idolmaster-official.jp/"),
     T("Fluorite — 有村麻央", "学マス インスト音源", "有村麻央", "https://gakuen-label.idolmaster-official.jp/"),
     T("白線 — 葛城リーリヤ", "学マス インスト音源", "葛城リーリヤ", "https://gakuen-label.idolmaster-official.jp/"),
     T("Wonder Scale — 倉本千奈", "学マス インスト音源", "倉本千奈", "https://gakuen-label.idolmaster-official.jp/"),
     T("Tame-Lie-One-Step — 紫雲清夏", "学マス インスト音源", "紫雲清夏", "https://gakuen-label.idolmaster-official.jp/"),
     T("光景 — 篠澤広", "学マス インスト音源", "篠澤広", "https://gakuen-label.idolmaster-official.jp/"),
     T("clumsy trick — 姫崎莉波", "学マス インスト音源", "姫崎莉波", "https://gakuen-label.idolmaster-official.jp/"),
     T("標 — 初星学園", "学マス インスト音源", "初星学園", "https://gakuen-label.idolmaster-official.jp/")])]);

/* ================= ⭐ 東方Project（上海アリス幻樂団） ================= */
S("touhou", "東方Project", "⭐", "red", "同人ゲーム", "🏮",
  "ZUNさん（上海アリス幻樂団）の公式サイト。作品と音楽CDの情報はここで。ゲームの体験版もダウンロードできます（体験版にもBGMが入っています）。タイトル別フォルダで収容（100超は Vol.2 自動作成）。",
  "https://www16.big.or.jp/~zun/",
  [PL("th-koumakyou", "東方紅魔郷", "🌹", "red", ["Game","Touhou","紅魔郷","ZUN"],
    [T("U.N.オーエンは彼女なのか?", "東方紅魔郷", "ZUN", "https://www16.big.or.jp/~zun/html/th06.html"),
     T("亡き王女の為のセプテット", "東方紅魔郷", "ZUN", "https://www16.big.or.jp/~zun/html/th06.html"),
     T("月まで届け、不死の煙", "東方紅魔郷", "ZUN", "https://www16.big.or.jp/~zun/html/th06.html")]),
   PL("th-youyoumu", "東方妖々夢", "🌸", "pink", ["Game","Touhou","妖々夢","ZUN"],
    [T("幽雅に咲かせ、墨染の桜 ～ Border of Life", "東方妖々夢", "ZUN", "https://www16.big.or.jp/~zun/html/th07.html"),
     T("ネクロファンタジア", "東方妖々夢", "ZUN", "https://www16.big.or.jp/~zun/html/th07.html")]),
   PL("th-eiyasyou", "東方永夜抄", "🌙", "purple", ["Game","Touhou","永夜抄","ZUN"],
    [T("千年幻想郷 ～ History of the Moon", "東方永夜抄", "ZUN", "https://www16.big.or.jp/~zun/html/th08.html"),
     T("竹取飛翔 ～ Lunatic Princess", "東方永夜抄", "ZUN", "https://www16.big.or.jp/~zun/html/th08.html")]),
   PL("th-fuujinroku", "東方風神録", "⛩️", "green", ["Game","Touhou","風神録","ZUN"],
    [T("神々が恋した幻想郷", "東方風神録", "ZUN", "https://www16.big.or.jp/~zun/html/th10.html"),
     T("ネイティブフェイス", "東方風神録", "ZUN", "https://www16.big.or.jp/~zun/html/th10.html")]),
   PL("th-chireiden", "東方地霊殿", "🔮", "amber", ["Game","Touhou","地霊殿","ZUN"],
    [T("ハルトマンの妖怪少女", "東方地霊殿", "ZUN", "https://www16.big.or.jp/~zun/html/th11.html"),
     T("霊知の太陽信仰 ～ Nuclear Fusion", "東方地霊殿", "ZUN", "https://www16.big.or.jp/~zun/html/th11.html")])]);
})();
/* ✅ catalog.js 完了（シリーズ5・プレイリスト5。MODで TRK_CATALOG.push して追加できます） */
