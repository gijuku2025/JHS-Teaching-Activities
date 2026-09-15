# Vocab Duel

A two-player vocab quiz game for one tablet. Built as a static site — no build step, no server code.

## How it plays

1. **Setup** — enter both players' names, then tick the subject(s) and chapter(s) to practice.
   - Pick one subject and it uses 20 words from it (10 per round).
   - Pick both subjects and it uses 10 words from each (5 per round from each), so 20 total.
2. **Round 1** — Player 1 holds the tablet and reads the English word aloud; Player 2 says the Japanese. Player 1 taps the blue circle (correct) or red cross (incorrect) after each answer. 30 seconds on the clock.
3. **Swap** — the app shows a "pass the tablet" screen with the new instructions.
4. **Round 2** — Player 2 holds the tablet and reads the Japanese word aloud; Player 1 says the English. Same scoring.
5. **Results** — each player's score out of 10 and the exact words they missed, ready to screenshot and send to the teacher.

Round 1 and Round 2 always draw from **different words**, so each player is tested on a separate list.

## Running it

This is a plain static site (`index.html` + `style.css` + `script.js` + two JSON files), so any static host works.

**GitHub Pages (recommended):**
1. Create a new GitHub repository and upload everything in this folder (keep the `data/` folder as-is).
2. Go to the repo's **Settings → Pages**.
3. Under "Build and deployment", set **Source** to "Deploy from a branch", pick the `main` branch and `/ (root)` folder, then **Save**.
4. GitHub gives you a URL like `https://yourname.github.io/your-repo-name/` — open that on the tablet.

**Important:** the app loads the vocab lists with `fetch()`, which requires the files to be served over `http(s)://`. Don't just double-click `index.html` to open it as a local file — it won't load the word lists. If you want to test locally first, run a tiny local server from this folder, e.g. `python3 -m http.server`, then visit `http://localhost:8000`.

## Adding or editing vocab

Vocab lives in two JSON files in `data/`:

- `data/social_studies.json`
- `data/math.json`

Each file looks like this:

```json
{
  "subject": "Social Studies",
  "chapters": [
    {
      "id": "ss-ch7",
      "name": "Chapter 7",
      "words": [
        { "en": "Polar Zone", "jp": "寒帯" },
        { "en": "Tundra Climate", "jp": "ツンドラ気候" }
      ]
    }
  ]
}
```

To add a new chapter, add another object to the `chapters` array with a unique `id` (anything unique, e.g. `"ss-ch8"`), a `name` shown to the user (e.g. `"Chapter 8"`), and a `words` list of `{ "en": ..., "jp": ... }` pairs. New chapters automatically show up as checkboxes on the setup screen — no code changes needed.

To add a brand-new subject (e.g. Science), create a new JSON file in `data/` in the same shape, then add it to the `DATA_FILES` list near the top of `script.js`:

```js
const DATA_FILES = [
  { key: 'social_studies', file: 'data/social_studies.json' },
  { key: 'math', file: 'data/math.json' },
  { key: 'science', file: 'data/science.json' }
];
```

**Word count note:** with one subject selected, the app needs at least 20 words across the selected chapters. With two (or more) subjects selected, each selected subject needs at least 10 words across its selected chapters. If a chapter is short, ask students to select an additional chapter alongside it.
