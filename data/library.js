// Library catalog. Each tradition holds ordered collections; each collection holds works.
// A work with `text` set has a readable text in window.TEXTS; others are catalog-only for now.
window.LIBRARY = {
  traditions: [
    { id: "christianity", name: "Christianity", icon: "cross", live: true },
    { id: "judaism", name: "Judaism", icon: "star" },
    { id: "islam", name: "Islam", icon: "moon" },
    { id: "norse", name: "Norse", icon: "rune" },
    { id: "greek", name: "Greek", icon: "temple" },
  ],

  christianity: {
    name: "Christianity",
    facets: ["Texts", "History", "People", "Beliefs", "Traditions"],
    collections: [
      {
        id: "biblical-canon",
        title: "Biblical Canon",
        blurb: "Explore the major biblical canons and compare different traditions.",
        count: "Multiple Canons",
        about: "The books accepted as Scripture across Christian traditions. Protestant Bibles contain 66 books; Catholic and Orthodox canons are larger, and the Ethiopian Orthodox canon is the broadest of all.",
        works: [
          { id: "torah", title: "The Torah", blurb: "Genesis through Deuteronomy", tags: ["Hebrew Bible", "5 books"] },
          { id: "historical-books", title: "Historical Books", blurb: "Joshua through Esther", tags: ["Hebrew Bible", "12 books"] },
          { id: "wisdom-poetry", title: "Wisdom & Poetry", blurb: "Job, Psalms, Proverbs, Ecclesiastes, Song of Songs", tags: ["Hebrew Bible", "5 books"] },
          { id: "prophets", title: "The Prophets", blurb: "Isaiah through Malachi", tags: ["Hebrew Bible", "17 books"] },
          { id: "gospels-acts", title: "Gospels & Acts", blurb: "The life of Jesus and the early church", tags: ["New Testament", "5 books"] },
          { id: "epistles", title: "The Epistles", blurb: "Letters of Paul and the apostles", tags: ["New Testament", "21 books"] },
          { id: "revelation", title: "Revelation", blurb: "The apocalypse of John", tags: ["New Testament", "1 book"] },
        ],
      },
      {
        id: "deuterocanonical",
        title: "Deuterocanonical Books",
        blurb: "Texts regarded as Scripture in Catholic and Orthodox traditions.",
        count: "10 works",
        about: "Jewish writings from the Second Temple period that were preserved in the Greek Septuagint. Catholic and Orthodox churches count them as Scripture. Protestant Bibles either leave them out or print them separately as the Apocrypha.",
        works: [
          { id: "tobit", title: "Tobit", blurb: "A family's piety, exile, and an angelic guide" },
          { id: "judith", title: "Judith", blurb: "A widow who saves her people" },
          { id: "additions-esther", title: "Additions to Esther", blurb: "Prayers and edicts added to the Greek Esther" },
          { id: "wisdom-solomon", title: "Wisdom of Solomon", blurb: "Personified Wisdom and the fate of the righteous" },
          { id: "sirach", title: "Sirach", blurb: "Proverbs of Jesus ben Sira" },
          { id: "baruch", title: "Baruch", blurb: "Confession and hope in exile" },
          { id: "1-maccabees", title: "1 Maccabees", blurb: "The Hasmonean revolt against Seleucid rule" },
          { id: "2-maccabees", title: "2 Maccabees", blurb: "Martyrdom and the rededication of the Temple" },
          { id: "additions-daniel", title: "Additions to Daniel", blurb: "Susanna, Bel and the Dragon, the Song of the Three" },
          { id: "prayer-manasseh", title: "Prayer of Manasseh", blurb: "A king's prayer of repentance" },
        ],
      },
      {
        id: "early-jewish",
        title: "Related Early Jewish Writings",
        blurb: "Ancient Jewish literature that provides historical and theological context for early Christianity.",
        count: "6 works",
        about: "Ancient Jewish literature that shows the historical and theological world early Christianity grew out of. Most of these works are not in the biblical canon of mainstream Christian traditions, but several shaped early Christian thought deeply, and some are Scripture in particular churches.",
        themes: ["Angels and demons", "Apocalyptic vision", "Final judgment", "Rewritten Scripture", "Messianic hope"],
        works: [
          { id: "1-enoch", title: "1 Enoch", blurb: "Watchers, angels, and final judgment", tags: ["Ancient Jewish", "Ethiopian Scripture", "Early Christian Influence"], text: "1-enoch" },
          { id: "jubilees", title: "Book of Jubilees", blurb: "Retelling of Genesis and early Exodus", tags: ["Ancient Jewish", "Ethiopian Scripture"] },
          { id: "2-baruch", title: "2 Baruch", blurb: "Visions of judgment and restoration", tags: ["Ancient Jewish", "Syriac"] },
          { id: "4-ezra", title: "4 Ezra (2 Esdras 3–14)", blurb: "Visions on evil, suffering, and restoration", tags: ["Ancient Jewish", "Apocalypse"] },
          { id: "testaments-twelve", title: "Testaments of the Twelve Patriarchs", blurb: "Ethical teachings attributed to Jacob's sons", tags: ["Ancient Jewish", "Christian redaction"] },
          { id: "adam-eve", title: "Life of Adam and Eve", blurb: "Expands the story of Adam, Eve, and Satan", tags: ["Ancient Jewish"] },
        ],
      },
      {
        id: "early-christian",
        title: "Early Christian Writings",
        blurb: "The generations after the apostles, including the Apostolic Fathers and early church writings.",
        intro: "Letters, sermons, church manuals, and visions from the earliest generations of Christianity. These writings circulated alongside the emerging New Testament and illuminate the beliefs and practices of the early Church.",
        count: "8 works",
        sample: true,
        works: [
          { id: "didache", title: "The Didache", text: "didache", author: { basis: "anonymous" }, date: { label: "c. 50–120 CE", sort: 85, debated: true },
            blurb: "A short church manual on ethics, baptism, fasting, and the Eucharist." },
          { id: "1-clement", title: "1 Clement", author: { name: "Clement of Rome", basis: "traditional" }, date: { label: "c. 96 CE", sort: 96 },
            blurb: "A letter from the church in Rome urging the Corinthians to restore their deposed leaders." },
          { id: "2-clement", title: "2 Clement", author: { name: "Clement of Rome", basis: "traditional" }, date: { label: "c. 120–160 CE", sort: 140 },
            blurb: "The oldest surviving Christian sermon outside the New Testament, a call to repentance." },
          { id: "ignatius", title: "Letters of Ignatius of Antioch", author: { name: "Ignatius of Antioch", basis: "known" }, date: { label: "c. 107–115 CE", sort: 110, debated: true },
            blurb: "Seven letters written on the road to martyrdom in Rome, urging unity around the bishop.",
            // The seven letters of the middle recension, each addressable on its own.
            partLabel: "letters",
            parts: [
              { id: "ignatius-ephesians", title: "To the Ephesians" },
              { id: "ignatius-magnesians", title: "To the Magnesians" },
              { id: "ignatius-trallians", title: "To the Trallians" },
              { id: "ignatius-romans", title: "To the Romans" },
              { id: "ignatius-philadelphians", title: "To the Philadelphians" },
              { id: "ignatius-smyrnaeans", title: "To the Smyrnaeans" },
              { id: "ignatius-polycarp", title: "To Polycarp" },
            ] },
          { id: "polycarp-philippians", title: "Letter of Polycarp to the Philippians", author: { name: "Polycarp of Smyrna", basis: "known" }, date: { label: "c. 110–140 CE", sort: 125 },
            blurb: "Pastoral counsel to the church at Philippi, woven with early quotations of apostolic writings." },
          { id: "martyrdom-polycarp", title: "Martyrdom of Polycarp", author: { name: "on behalf of the church at Smyrna", basis: "anonymous" }, date: { label: "c. 155–160 CE", sort: 157 },
            blurb: "The earliest surviving account of a Christian martyrdom outside the New Testament." },
          { id: "hermas", title: "Shepherd of Hermas", author: { name: "Hermas", basis: "attributed" }, date: { label: "c. 100–150 CE", sort: 125 },
            blurb: "Visions, commandments, and parables on repentance, given by an angelic shepherd." },
          { id: "barnabas", title: "Epistle of Barnabas", author: { name: "Barnabas", basis: "traditional" }, date: { label: "c. 70–135 CE", sort: 105, debated: true },
            blurb: "Reads the Jewish Scriptures as Christian allegory and argues against keeping the Law." },
        ],
      },
      {
        id: "christian-apocrypha",
        title: "Christian Apocrypha",
        blurb: "Alternative and noncanonical writings, including gospels, acts, and revelations.",
        count: "6 works",
        about: "Gospels, acts, and apocalypses that circulated in early Christianity but were left out of the New Testament. They show how varied early Christian belief was and how stories about Jesus and the apostles kept growing.",
        works: [
          { id: "thomas", title: "Gospel of Thomas", blurb: "114 sayings attributed to Jesus", tags: ["Nag Hammadi"] },
          { id: "peter-gospel", title: "Gospel of Peter", blurb: "A fragmentary passion narrative" },
          { id: "protoevangelium", title: "Protoevangelium of James", blurb: "The birth and childhood of Mary" },
          { id: "paul-thecla", title: "Acts of Paul and Thecla", blurb: "A young woman follows Paul's preaching" },
          { id: "mary-gospel", title: "Gospel of Mary", blurb: "Mary Magdalene's vision and teaching" },
          { id: "apocalypse-peter", title: "Apocalypse of Peter", blurb: "An early tour of heaven and hell" },
        ],
      },
      {
        id: "church-fathers",
        title: "Church Fathers & Theology",
        blurb: "Foundational works of Christian doctrine, apologetics, and theology.",
        count: "6 works",
        about: "The theologians of the second to fifth centuries. They defended the faith before Rome, argued against rival teachings, and laid the foundations of Christian doctrine.",
        works: [
          { id: "justin-apology", title: "First Apology", blurb: "Justin Martyr's defense of Christianity to Rome", tags: ["Justin Martyr"] },
          { id: "against-heresies", title: "Against Heresies", blurb: "Irenaeus refutes the Gnostic systems", tags: ["Irenaeus"] },
          { id: "tertullian-apology", title: "Apology", blurb: "Tertullian's appeal to the governors of Rome", tags: ["Tertullian"] },
          { id: "first-principles", title: "On First Principles", blurb: "Origen's systematic theology", tags: ["Origen"] },
          { id: "incarnation", title: "On the Incarnation", blurb: "Why the Word became flesh", tags: ["Athanasius"] },
          { id: "confessions", title: "Confessions", blurb: "Augustine's restless heart", tags: ["Augustine"] },
        ],
      },
      {
        id: "medieval",
        title: "Medieval Christian Literature",
        blurb: "Spiritual writings, saints' lives, and theological works from the medieval Christian world.",
        count: "4 works",
        about: "Monastic rules, histories, and mystical writings from the medieval Christian world.",
        works: [
          { id: "rule-benedict", title: "Rule of Saint Benedict", blurb: "The foundation of Western monastic life", tags: ["c. 530"] },
          { id: "bede-history", title: "Ecclesiastical History of the English People", blurb: "Bede's history of Christianity in Britain", tags: ["731"] },
          { id: "proslogion", title: "Proslogion", blurb: "Anselm's \"faith seeking understanding\"", tags: ["1078"] },
          { id: "julian-revelations", title: "Revelations of Divine Love", blurb: "Julian of Norwich's visions", tags: ["c. 1395"] },
        ],
      },
    ],
  },

  // Paths: curated reading journeys across works. A step with `work` + `ch` links into the reader.
  paths: [
    {
      id: "the-watchers",
      title: "The Watchers",
      blurb: "Follow one strange story of fallen angels from Genesis through Enoch to the New Testament.",
      length: "5 steps",
      steps: [
        { title: "Genesis 6:1–4", note: "The \"sons of God\" take human wives and the Nephilim appear. Four verses that later writers could not leave alone." },
        { title: "1 Enoch 6–8", note: "The Book of the Watchers expands Genesis into a full narrative: two hundred angels, an oath on Mount Hermon, forbidden knowledge.", work: "1-enoch", ch: 6 },
        { title: "1 Enoch 9–10", note: "The archangels intercede and judgment is pronounced. Azâzêl is bound in the darkness.", work: "1-enoch", ch: 9 },
        { title: "Book of Jubilees 5", note: "A second-century BCE retelling that folds the Watchers into the flood story.", work: "jubilees" },
        { title: "Jude 6, 14–15", note: "A New Testament letter quotes 1 Enoch 1:9 directly: \"Behold, the Lord cometh with ten thousands of his saints.\"", work: "1-enoch", ch: 1, v: "9" },
      ],
    },
  ],

  // Work overviews (see the schema comment above viewWork in app.js).
  works: {
    didache: {
      sample: true,
      aka: "The Teaching of the Twelve Apostles",
      intro: "A brief manual of early Christian instruction covering moral teaching, baptism, prayer, the Eucharist, and the leadership of local communities. It is one of the oldest surviving Christian writings outside the New Testament.",
      facts: [
        { label: "Composed", value: "c. 50–120 CE", basis: "disputed" },
        { label: "Authorship", value: "Anonymous; presented as the teaching of the Twelve Apostles", basis: "established" },
        { label: "Original language", value: "Koine Greek", basis: "established" },
        { label: "Place of origin", value: "Uncertain; Syria or Palestine are often proposed", basis: "disputed" },
        { label: "Canonical status", value: "Not part of the New Testament canon; valued by some early writers for instruction", basis: "established" },
      ],
      background: [
        { kind: "fact", text: "The Didache is a short work of sixteen chapters. It opens with moral instruction framed as a choice between two ways, one of life and one of death, then gives directions for baptism, fasting, prayer, and the Eucharist, and closes with guidance on traveling teachers, local leaders, and watchfulness for the last days." },
        { kind: "fact", text: "For centuries the work was known only from mentions by other writers. A complete Greek text was rediscovered in 1873 by Philotheos Bryennios in a manuscript held in Constantinople and published in 1883." },
        { kind: "interpretation", text: "Many scholars regard the Didache as a composite work assembled from earlier traditions, including a \"Two Ways\" teaching that also appears in the Epistle of Barnabas." },
        { kind: "interpretation", text: "Its relationship to the Gospel of Matthew, with which it shares the Lord's Prayer and several sayings, remains debated. It may draw on Matthew, on shared oral tradition, or on both." },
      ],
      structure: [
        ["1–6", "The Two Ways"],
        ["7–10", "Baptism, fasting, prayer, and the Eucharist"],
        ["11–15", "Teachers, prophets, and community leadership"],
        ["16", "Watchfulness and the last days"],
      ],
      // Manuscripts and editions are interactive: `record` will hold a detailed manuscript record
      // (images only where legally usable); `text` names a translation in TEXTS.didache.
      manuscripts: [
        { id: "hierosolymitanus-54", name: "Codex Hierosolymitanus 54", date: "1056 CE", note: "The only complete Greek text, rediscovered in 1873.", record: null },
        { id: "p-oxy-1782", name: "Oxyrhynchus Papyrus 1782", date: "4th century", note: "Greek fragments of the opening chapters.", record: null },
        { id: "bl-or-9271", name: "Coptic fragment, British Library Or. 9271", date: "c. 5th century", note: "A Coptic version of part of the later chapters.", record: null },
        { id: "apostolic-constitutions-7", name: "Apostolic Constitutions, Book 7", date: "4th century", note: "A later church order that reworks much of the Didache.", record: null },
      ],
      editions: [
        { id: "lightfoot", title: "J. B. Lightfoot", detail: "The Apostolic Fathers, English translation, 1891 · public domain · chapters 1–3 in this sample", status: "available", text: "lightfoot" },
        { id: "bryennios", title: "Philotheos Bryennios", detail: "First printed edition of the Greek text, 1883", status: "planned" },
        { id: "lake", title: "Kirsopp Lake", detail: "The Apostolic Fathers (Loeb), Greek and English, 1912 · public domain", status: "planned" },
      ],
      connections: [
        { rel: "Parallels", title: "Gospel of Matthew", note: "Shares the Lord's Prayer and several sayings of Jesus.", disputed: true },
        { rel: "Shared tradition", title: "Epistle of Barnabas", note: "Contains a closely related form of the Two Ways teaching.", work: "barnabas" },
        { rel: "Shared tradition", title: "Doctrina Apostolorum", note: "A Latin version of the Two Ways teaching." },
        { rel: "Reworked in", title: "Apostolic Constitutions", note: "Book 7 adapts much of the Didache into a later church order." },
      ],
      // Sources & further reading. Each group lists the claims it supports; `items` stay empty until verified.
      sources: {
        text: [{ label: "J. B. Lightfoot, The Apostolic Fathers (1891), Didache translation, via Wikisource", href: "https://en.wikisource.org/wiki/Didache_(Lightfoot_translation)" }],
        groups: [
          { title: "Composition date", items: [] },
          { title: "Authorship and place of origin", items: [] },
          { title: "Manuscripts and rediscovery", items: [] },
          { title: "Scholarly interpretations", items: [] },
        ],
      },
      // Reader notes keyed by passage reference ("didache.1" applies to the whole chapter).
      notes: {
        "didache.1": [{ kind: "Connection", title: "Epistle of Barnabas 18–20", note: "Another form of the Two Ways teaching.", work: "barnabas" }],
        "didache.1.3": [{ kind: "Parallel", title: "Matthew 22:37–39", note: "Love of God and of neighbor." }],
        "didache.1.5": [{ kind: "Parallel", title: "Matthew 7:12; Luke 6:31", note: "Compare the Golden Rule, here in negative form." }],
        "didache.1.7": [{ kind: "Parallel", title: "Matthew 5:44; Luke 6:27–28", note: "Blessing those who curse and praying for enemies." }],
        "didache.1.10": [{ kind: "Parallel", title: "Matthew 5:39–41; Luke 6:29", note: "The other cheek and the second mile." }],
      },
    },

    "1-enoch": {
      totalSections: 108,
      intro: "A collection of apocalyptic writings attributed to Enoch, the great-grandfather of Noah, composed in stages over several centuries and preserved complete only in Ge'ez.",
      facts: [
        { label: "Composed", value: "c. 300 BCE – 1st century CE, in stages", basis: "established" },
        { label: "Authorship", value: "Pseudonymous; attributed to Enoch", basis: "established" },
        { label: "Original language", value: "Aramaic for most sections; preserved complete in Ge'ez", basis: "established" },
        { label: "Place of origin", value: "Judea", basis: "disputed" },
        { label: "Canonical status", value: "Scripture in the Ethiopian Orthodox Tewahedo Church", basis: "established" },
      ],
      background: [
        { kind: "fact", text: "Genesis says Enoch \"walked with God; and he was not, for God took him.\" Later Jewish writers credited him with visions of heaven, the angels, and the end of history. Aramaic fragments of most sections were found among the Dead Sea Scrolls at Qumran." },
        { kind: "fact", text: "The Epistle of Jude quotes 1 Enoch 1:9 almost word for word." },
        { kind: "interpretation", text: "Its picture of fallen angels, final judgment, and a heavenly \"Son of Man\" is widely seen as shaping early Christian thought." },
      ],
      structure: [
        ["1–36", "Book of the Watchers"],
        ["37–71", "Book of Parables (Similitudes)"],
        ["72–82", "Astronomical Book"],
        ["83–90", "Book of Dream Visions"],
        ["91–108", "Epistle of Enoch"],
      ],
      editions: [
        { id: "charles", title: "R. H. Charles", detail: "The Book of Enoch, English translation, 1912 · public domain · chapters 1–16 in this preview", status: "available", text: "main" },
      ],
      connections: [
        { rel: "Expands", title: "Genesis 6:1–4", note: "The \"sons of God\" and the Nephilim." },
        { rel: "Quoted in", title: "Jude 14–15", note: "Quotes 1 Enoch 1:9." },
        { rel: "Shares tradition", title: "Book of Jubilees", note: "Retells the Watchers story.", work: "jubilees" },
      ],
    },
  },
};
