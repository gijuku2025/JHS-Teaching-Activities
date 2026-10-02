# Civics Karuta — Solo Match

A one-student listening practice app. The app speaks the first half of a
sentence aloud; the student taps the card showing the matching second half
before time runs out. Built as a prototype using the browser's built-in
text-to-speech (the Web Speech API) — a future version could swap in
recorded mp3 audio instead.

## Files

- `index.html` — the app
- `style.css` — styling
- `app.js` — game logic
- `sentences.json` — the sentence bank, organized by chapter (edit this to add or change chapters/sentences)

## Putting it on GitHub Pages

1. Create a new repository on GitHub (or use an existing one).
2. Upload all four files (`index.html`, `style.css`, `app.js`, `sentences.json`) to the root of the repository — keep them in the same folder, don't put them in subfolders.
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch", pick your main branch and the `/ (root)` folder, then save.
5. GitHub will give you a URL like `https://yourusername.github.io/your-repo-name/`. It can take a minute or two to go live after the first save.
6. Open that URL on the tablet you'll use.

## Adding or changing sentences

Open `sentences.json`. Each chapter has an `id`, a `title` (shown next to its checkbox on the setup screen), and a list of `sentences`, each with a `part1` (what gets spoken aloud) and `part2` (what's written on the answer cards). Add as many chapters as you like — the setup screen will list all of them automatically. If you add or edit chapters, it's a good idea to also update the `FALLBACK_DATA` object at the top of `app.js` to match, so the game still works if `sentences.json` can't be loaded for some reason.

## How a session works

1. **Setup** — optionally type the student's name, check one or more chapters to pull sentences from, and choose how many seconds they get to answer each card (8–15, default 10).
2. **Play** — a card is presented: the app speaks the first half aloud (there's a "Replay audio" button if they want to hear it again), and four possible second halves appear as tappable cards, one correct and three distractors, shuffled. A countdown timer (both a number and a shrinking bar) shows how long they have. Tapping a card locks in that answer — correct briefly turns green, incorrect turns red and the correct card is revealed in green — then the next card loads automatically. If time runs out with no tap, it counts as a miss and the correct card is revealed the same way. A "End session early" link is available if needed.
3. **Results** — shows the score as "correct / attempted" (using a personalized heading if a name was entered), with a button to set up another round for the next student.

## Notes on the text-to-speech

- Uses the browser's built-in `speechSynthesis` — no audio files, no setup required, but voice quality/accent varies by browser and device.
- If a browser doesn't support it at all, the app automatically falls back to showing the sentence as text instead of speaking it.
- Speech rate is set slightly slower than normal (0.9×) for second-language listening. Change the `utterance.rate` value in `app.js` if you want it faster or slower.
- The timer starts as soon as a card appears, running in parallel with the audio — so the 10-second default is really "time to listen and decide," not "time to decide after listening." Adjust the default in the `<select id="seconds-select">` options in `index.html` if that feels too tight or too loose once you've tried it with students.
