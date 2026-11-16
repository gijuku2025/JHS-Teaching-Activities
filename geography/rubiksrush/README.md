# Geo Rush

A fast tapping game for ESL geography class, inspired by Rubik's Rush. Colourful tiles, a clue, and a race to tap the right ones. Works on iPad in Safari, no install.

## Modes

- **1 Player**: beat the clock (40/60/90 s). +10 per correct tile, +20 per round cleared, -5 per wrong tap, +2 seconds for every cleared round.
- **2 Players**: put the iPad flat between two students. Each has their own grid, facing them. First to find all the right tiles wins the round (10 rounds). A wrong tap freezes that player's grid for 1.5 seconds.
- Tap the 🔊 button to hear the clue again. Words are read aloud when tapped (turn off with "Read aloud" on the menu).
- The results screen lists everything the students got wrong, for quick review.

## Put it on GitHub Pages (once)

1. Create a new public repository on github.com.
2. Upload `index.html`, `game.js`, `content.js` (and this README).
3. Settings → Pages → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → Save.
4. After about a minute, your game is at `https://YOUR-NAME.github.io/REPO-NAME/`.
5. On each iPad: open that link in Safari → Share → **Add to Home Screen** for full-screen play.

## Change the content for each chapter

Only edit `content.js` (on GitHub: open the file → pencil icon → Commit changes; the site updates in about a minute). iPads may need a refresh to show the new version.

- `categories`: groups of words with a clue (e.g. "Tap all the OCEANS"). Each round shows 3 words from one category mixed with words from the others. You need at least 9 words in total, in at least 2 categories.
- `facts`: questions with one correct answer `a`. Set `group` to the name of the category the answer belongs to; the wrong tiles come from that category first, so students must really know the answer.
- Keep tile words short (1-2 words).
