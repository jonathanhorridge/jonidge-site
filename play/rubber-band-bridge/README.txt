Rubber Band Bridge v3, a game by Jonidge
========================================
Contact: jonidge@yahoo.com, jonidge.com

Open index.html in any modern desktop or mobile browser. It's a single
self-contained file: no install, no network, no external assets, no tracking.

How to play
-----------
- Drag from one gold peg to another to stretch a rubber band, or tap one peg
  and then another. Tap a band to remove it.
- Green bands are bridges. Yellow bands are trampolines when Pip drops onto
  them. Red bands snap under Pip, and a hard fall onto a red band launches him.
- Bands can't go through solid ground or through Pip's starting spot.
- Press GO. Pip walks right by himself. Get him to the flag. Stop cancels a run,
  and your layout stays after a failed run.
- Stars: 3 at par, 2 with one extra band, 1 otherwise.

40 levels in 4 worlds
---------------------
1. The Workbench (bridges and gaps)   3. Snap Yard (snap launches)
2. Bounce House (trampolines)         4. Sky Works (springs, crumbly planks)
Levels unlock in order. Each world opens when the previous one is finished.

Coins
-----
Start with 100. A first clear pays 20 + 5 per star. A replay pays 5 for each
newly earned star and nothing otherwise.
Spend coins in Help:
- Hint: 25. Lights up the next band of the answer, and stars are kept.
- Extra band: 40. +1 band for this visit (max 2), best result 2 stars.
- Show solution: 75, owned forever for that level. It places the whole
  answer, and the best result is 1 star.
A free hint unlocks after every 3 failed runs on a level, so you can always
progress without coins.
Get coins:
- Watch an ad: +30, up to 5 a day. The web version shows a placeholder.
- Coin packs (500 / 1,500 / 4,000): available in the app version only. The
  web version never charges anything. Add ?testmode=1 to the URL to grant
  packs for free when testing.

For the app build: window.RBB_Ads.showRewarded(cb) and
window.RBB_IAP.purchase(sku, cb) are stubs. Define them before the game script
to plug in a real ad or store SDK.
SKUs: rbb.coins.500, rbb.coins.1500, rbb.coins.4000.

Keys: Space = GO, Z = undo, R = retry, H = help, Esc = pause.
Progress is saved in this browser (localStorage key "rbb3.save").
