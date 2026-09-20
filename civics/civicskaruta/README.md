# Civics Karuta

A three-player karuta game for classroom use. One player reads the first half
of a sentence aloud; the other two grab the card with the matching second
half. Reader duty rotates each round.

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
6. Open that URL on the tablet(s) you'll use in class.

## Adding or changing sentences

Open `sentences.json`. Each chapter has an `id`, a `title` (shown in the setup screen's dropdowns), and a list of `sentences`, each with a `part1` (what the reader reads aloud) and `part2` (what's written on the card students grab). Add as many chapters as you like — the two dropdowns on the setup screen will list all of them automatically.

## How a game works

1. **Setup** — type the three players' first names and pick the two chapters to play with. The two chapters' sentences (8 each, so 16 cards) are pooled together.
2. Players are told alphabetically who reads first. Whoever's turn it is gets a "pass the tablet to ___" screen before each round starts.
3. **Reading a round** — a shuffled card appears one at a time: the first half in large text, the second half below it. A 60-second timer runs for the whole round. After each card, tap whichever player's name grabbed the card (or skip if nobody did), then tap "Next card." A round ends when either the pool of 16 runs out or the timer hits zero, whichever comes first.
4. **Between rounds** — you'll see how many cards each player collected that round, with the option to start another round (reader rotates to the next person, cards reshuffle) or end the game.
5. **Results** — total cards collected per player across all rounds played.
