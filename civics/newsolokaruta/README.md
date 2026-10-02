# Civics Karuta — Solo Match

A one-student listening practice app. The app plays an mp3 of the first half
of a sentence; the student taps the card showing the matching second half
before time runs out.

## Files

- `index.html` — the app
- `style.css` — styling
- `app.js` — game logic
- `sentences.json` — the sentence bank, organized by chapter, including each sentence's audio filename

## Audio folder structure

The app expects an `audio` folder next to `index.html`, with one subfolder per chapter (named by the chapter's `id`, e.g. `ch15`), containing one mp3 per sentence:

```
audio/
  ch15/
    buying_and_selling_commodities_with_other_countries.mp3
    countries_trade_because.mp3
    ... (6 more)
  ch16/
    consumers_pay_consumption_tax.mp3
    ... (7 more)
  ch7/
    the_polar_zone.mp3
    ... (7 more)
  ch8/
    the_tropical_zone.mp3
    ... (7 more)
```

Each sentence in `sentences.json` has an `"audio"` field with the exact filename expected in that chapter's folder — the full list is already filled in, generated from each sentence's first half (lowercased, punctuation stripped, spaces replaced with underscores). Record (or name) your mp3s to match those filenames, **or** edit the `"audio"` value for any sentence to whatever filename you actually used — the app reads that field directly. If a sentence's `"audio"` field is ever removed, the app falls back to generating the same filename pattern automatically, so it still works without editing the JSON, as long as the file on disk matches that pattern.

If an mp3 is missing or fails to play, that card automatically shows the sentence as text instead, so the student isn't stuck on a silent card — worth checking the browser console if that happens, to catch a typo'd filename before class.

## Putting it on GitHub Pages

1. Create a new repository on GitHub (or use an existing one).
2. Upload `index.html`, `style.css`, `app.js`, `sentences.json`, and the whole `audio` folder (with its chapter subfolders and mp3s) to the root of the repository.
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch", pick your main branch and the `/ (root)` folder, then save.
5. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/`. It can take a minute or two to go live after the first save.
6. Open that URL on the tablet you'll use.

## Adding or changing sentences

Open `sentences.json`. Each chapter has an `id` (also its audio subfolder name), a `title` (shown next to its checkbox on the setup screen), and a list of `sentences`, each with a `part1` (what gets spoken), a `part2` (what's written on the answer cards), and an `audio` filename. Add as many chapters as you like — the setup screen will list all of them automatically. If you add or edit chapters, it's a good idea to also update the `FALLBACK_DATA` object at the top of `app.js` to match, so the game still works if `sentences.json` can't be loaded for some reason.

## How a session works

1. **Setup** — optionally type the student's name, check one or more chapters to pull sentences from, and choose how many seconds they get to answer each card (8–15, default 10).
2. **Play** — a card is presented: the mp3 for the first half plays automatically (there's a "Replay audio" button to hear it again), and four possible second halves appear as tappable cards, one correct and three distractors, shuffled. A countdown timer (both a number and a shrinking bar) shows how long they have. Tapping a card locks in that answer — correct briefly turns green, incorrect turns red and the correct card is revealed in green — then the next card loads automatically. If time runs out with no tap, it counts as a miss and the correct card is revealed the same way. An "End session early" link is available if needed.
3. **Results** — shows the score as "correct / attempted" (using a personalized heading if a name was entered), with a button to set up another round for the next student.

## Notes on the audio

- The timer starts as soon as a card appears, running in parallel with the audio — so the 10-second default is really "time to listen and decide," not "time to decide after listening." Adjust the default in the `<select id="seconds-select">` options in `index.html`, or just pick a longer option on the setup screen, if that feels too tight once you've tried it with students.
- Browsers sometimes require one tap on the page before they'll play audio automatically; since "Start" is itself a tap, this should already be satisfied, but worth confirming on whichever tablet/browser you're using.
