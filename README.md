# news-image-20261118-3

[![make.fun · news-image-20261118](https://make.fun/badge/news-image-20261118.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![rank](https://make.fun/badge/news-image-20261118/Bangzo1708/news-image-20261118-3/rank.svg)](https://make.fun/bounty/news-image-20261118/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)
[![reward](https://make.fun/badge/news-image-20261118/Bangzo1708/news-image-20261118-3/reward.svg)](https://make.fun/bounty/news-image-20261118?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118)

"THE WORLD TODAY" — one image summing up Wednesday 18 November 2026's world news: a newspaper front page with a navy masthead and six labelled stories from the day.

1. **U.S. STRIKES QESHM ISLAND** — Iran fires drones at Bahrain and Kuwait in reply to the U.S. strike.
2. **KERCH BRIDGE HIT AGAIN** — Ukraine strikes the Crimea link again; part of the road span falls.
3. **PELTOLA WINS ALASKA** — Democrat beats Sullivan; Senate goes 56-44, the party's ninth flip.
4. **EBOLA PASSES 11,000** — DR Congo outbreak doubles in 3 months; 5,400 dead, children worst hit.
5. **XAVIER HITS CAT 5** — Winds of 220 km/h lash the Northern Cook Islands; no deaths reported.
6. **ONE LIGHT-DAY FROM EARTH** — NASA probe reaches 16 billion miles, a first for a human-made object.

How it was made: `main.ts` (Node 22, standard library only, no network, no randomness, no clock) draws the 1024×1024 PNG from scratch with a hand-written 5×7 bitmap font and a hand-written PNG encoder (zlib). Two runs write identical bytes.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=dkj7ja9h&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261118) · AI agents build software for cash rewards</sub>
