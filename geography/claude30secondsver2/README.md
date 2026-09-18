# 30 Seconds — Classroom Edition

A browser-based version of the "30 Seconds" board game for groups of 4–5 students. Two files, no server, no internet connection, no install — just open `index.html`.

## How it works

1. **Setup** — each student in the group types their name and picks Red or Blue. You need at least 4 players (2 per team); add a 5th to either team when your class doesn't divide evenly into groups of four.
2. **Blue goes first.** Each turn, one team member is the describer (holds the tablet) and the rest guess. The describer role rotates through the team's members every time that team plays.
3. The describer **rolls the dice** (shows 0 or 1), then starts the **30-second round**. Five words appear; the describer gives clues, and taps "Mark correct" whenever the guesser says the right word. Words can be marked in any order.
4. When the timer hits 0, the buttons lock. The **round results** screen shows which words were guessed and which were missed, plus a clear breakdown of words correct, dice roll, and how far the team moves.
5. **Movement = words correct − dice roll** (minimum 0). Tapping Continue moves the team's token along the board and passes the turn to the other team.
6. The board has **33 squares — a START square, a FINISH square, and 31 numbered squares between them** — laid out as a snake path always visible at the top of the screen, with a blue and a red token showing each team's live position. First team to reach FINISH wins.

Words are pulled from every chapter at once and shuffled together, so different chapters mix in the same round. Every word is used once before any word repeats — once the whole list has been used, it reshuffles and starts again.

## Editing the word list

Words live in **`words.js`**, right next to `index.html`. Open it in any text editor:

```js
window.WORD_BANK = {
  "chapters": {
    "Animals": ["elephant", "penguin", "giraffe"],
    "Food & Drink": ["sandwich", "pancake", "avocado"]
  }
};
```

- Add, remove, or rename chapters freely — the names are just for your own organization; students never see them.
- Add as many words as you like per chapter.
- Keep the punctuation exactly as shown: quotes around every word, commas between words, no trailing comma after the last item in a list.
- Save the file and reload `index.html` in the browser — that's it.

**Why `words.js` and not `words.json`?** Opening `index.html` straight from disk (double-clicking it, no server) is exactly what this is built for — but browsers block a local page from *fetching* a separate `.json` file for security reasons unless it's served from a real website. A tiny `.js` file that just assigns the same data to a variable sidesteps that restriction while keeping the words in their own separate, easy-to-edit file. Everything below the first line of `words.js` is the same JSON shape you'd use in a plain `.json` file.

## Running it

Each group uses one tablet or laptop, passed around between the describer and guesser(s).

- Keep `index.html` and `words.js` **together in the same folder**.
- Copy that folder onto each device (AirDrop, USB, email, a shared drive, whatever's easiest) and open `index.html` — double-click it or open it from your Files app. It runs entirely offline, no wifi or server needed.
- If you'd rather host it centrally so every tablet opens one shared link instead, you can still upload both files to GitHub Pages or any static web host; that works fine too, but it's optional, not required.

## Multiple groups at once

Each device keeps its own game state (saved locally to that browser), so several tablets can run their own copy of the same files independently without interfering with each other. Use **Reset game** (top right) to clear a group's players and board and start a new game on that device.

## Customizing

Near the top of the `<script>` block in `index.html`:
- `ROUND_SECONDS` — length of the description round (default 30)
- `TOTAL_SQUARES` — total squares on the board including START and FINISH (default 33)
- `BOARD_COLS` — how many squares wide the snake path is (default 11, giving 3 rows of 11)

The `:root` CSS variables near the top of the `<style>` block control the color palette.
