# Vocab Duel — Social Studies edition (10 words each, two chapters)

A two-player vocab quiz game for one tablet, using Social Studies vocab only.

## How it plays

1. **Setup** — enter both players' names, then tick **two chapters** (10 words each, 20 total).
2. The app shuffles all 20 words together and splits them: **10 random words for Player 2 to be quizzed on**, **the other 10 for Player 1**.
3. **Round 1** — Player 1 holds the tablet and reads the English word aloud; Player 2 says the Japanese. Player 1 taps the blue circle (correct) or red cross (incorrect) after each answer. 30 seconds on the clock.
4. **Swap** — the app shows a "pass the tablet" screen with the new instructions.
5. **Round 2** — Player 2 holds the tablet and reads the Japanese word aloud; Player 1 says the English. Same scoring.
6. **Results** — each player's score out of 10 and the exact words they missed, ready to screenshot and send to the teacher.

You can select more than two chapters if you like — all their words get pooled and shuffled before the 10/10 split — but you need at least 20 words total (two chapters' worth) for the game to start.

## Running it

Plain static site (`index.html` + `style.css` + `script.js` + `data/social_studies.json`) — any static host works.

**GitHub Pages:**
1. Create a GitHub repository and upload everything in this folder (keep the `data/` folder as-is).
2. Repo **Settings → Pages** → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → **Save**.
3. Open the URL GitHub gives you (e.g. `https://yourname.github.io/your-repo-name/`) on the tablet.

**Important:** the app loads the vocab list with `fetch()`, which needs `http(s)://`. Don't just double-click `index.html` locally — it won't load. To test locally, run `python3 -m http.server` from this folder and visit `http://localhost:8000`.

## Adding or editing vocab

Edit `data/social_studies.json`. Right now it only has Chapter 7 — add a second chapter object so there's a 20-word pool to choose from:

```json
{
  "subject": "Social Studies",
  "chapters": [
    {
      "id": "ss-ch7",
      "name": "Chapter 7",
      "words": [
        { "en": "Polar Zone", "jp": "寒帯" }
      ]
    },
    {
      "id": "ss-ch8",
      "name": "Chapter 8",
      "words": [
        { "en": "example word", "jp": "例の単語" }
      ]
    }
  ]
}
```

Each `id` must be unique, `name` is what shows up as a checkbox label, and each chapter needs 10 `{ "en": ..., "jp": ... }` pairs for a clean 20-word pool. New chapters show up as checkboxes automatically — no code changes needed.
