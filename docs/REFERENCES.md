# Reference systems

Canonical references follow each work's own citation system. This file records which system
each work uses, how it was checked, and how translations map onto it.

## The Didache

**System.** Chapter and verse, as printed in standard editions of the Greek text: 16 chapters
with numbered verses. References take the form `didache.<chapter>.<verse>`, e.g. `didache.1.3`.

**Status.** `proposed`. Chapter 1 has been cross-checked (below); chapters 2–16 have not.
It should be signed off against a modern critical edition (e.g. M. W. Holmes, *The Apostolic
Fathers*) before being marked `verified`. I could not consult Holmes directly.

**Witnesses used** (snapshots committed under `content/_raw/wikisource/verification/`):

1. Kirsopp Lake, *The Apostolic Fathers*, vol. 1 (Loeb Classical Library, 1912), English
   translation with verse numbers, via Wikisource. (`lake-1912-apostolic-fathers`)
2. The Greek text with chapter and verse numbers on Greek Wikisource. The page does not name
   its edition, so it serves only as a second witness. (`wikisource-el-didache`)

**Chapter 1 cross-check.** Both witnesses divide chapter 1 into the same six verses, and
each verse begins at the same point in the text. Lightfoot's translation (our sample text) has no
verse numbers. Wikisource splits it into 23 segments, and each segment falls entirely inside one
verse:

| Verse | Lightfoot segments | Lightfoot begins | Lake begins | Greek begins |
|---|---|---|---|---|
| 1.1 | 1–1 | There are two ways, one of life and one of death… | There are two Ways, one of Life and one of Death… | Ὁδοὶ δύο εἰσί, μία τῆς ζωῆς καὶ μία τοῦ… |
| 1.2 | 2–5 | The way of life is this.… | The Way of Life is this: "First, thou shalt love… | Ἡ μὲν οὖν ὁδὸς τῆς ζωῆς ἐστιν αὕτη· πρῶτ… |
| 1.3 | 6–8 | Now of these words the doctrine is this.… | Now, the teaching of these words is this: "Bless… | Τούτων δὲ τῶν λόγων ἡ διδαχή ἐστιν αὕτη·… |
| 1.4 | 9–13 | Abstain thou from fleshly and bodily lusts.… | "Abstain from carnal" and bodily "lusts." "If an… | Ἀπέχου τῶν σαρκικῶν καί σωματικῶν ἐπιθυμ… |
| 1.5 | 14–21 | To every man that asketh of thee give, and ask n… | Give to everyone that asks thee, and do not refu… | Παντὶ τῷ αἰτοῦντί σε δίδου καὶ μὴ ἀπαίτε… |
| 1.6 | 22–23 | Yea, as touching this also it is said;… | But concerning this it was also said, "Let thine… | Ἀλλὰ καὶ περὶ τούτου δὲ εἴρηται· Ἱδρωσάτ… |

No disagreements were found between the two witnesses or with the proposed alignment, so **no
corrections were needed**. The segment boundaries in Lightfoot fall at sentence breaks that
coincide with the verse breaks.

**Known variation (not affecting chapter 1).** Some editions treat 1.3b–2.1 as a distinct
section (the "evangelical section"). This concerns interpretation, not numbering; verse numbers
are the same.

**Chapters 2–3.** Not aligned. Lightfoot's Wikisource segments do not always fall on verse
boundaries; for example, segment 2.2 runs across what Lake numbers 2.2–2.4. Alignment allows one
segment to map to several verses, but each mapping has to be checked against the witnesses, not
inferred. Until then, passages in these chapters resolve to `didache.2` / `didache.3` with a
translation anchor.

## 1 Enoch

**System.** Chapter and verse following R. H. Charles. This is the conventional numbering, and
it is printed in the translation itself, so the importer derives the alignment from Charles' own
verse numbers. Charles' sub-verse letters (`6a`, `b`, `7c`, …) in chapter 5 align to their parent
verse (`1-enoch.5.6`, `1-enoch.5.7`). Status: `proposed`.
