# 30 Seconds — Classroom Edition

A browser-based version of the "30 Seconds" board game for groups of 4–5 students. It's a single HTML file — double-click it to play, no server, no internet connection, no install required.

## How it works

1. **Setup** — each student in the group types their name and picks Red or Blue. You need at least 4 players (2 per team); add a 5th to either team when your class doesn't divide evenly into groups of four.
2. **Blue goes first.** Each turn, one team member is the describer (holds the tablet) and the rest guess. The describer role rotates through the team's members every time that team plays.
3. The describer **rolls the dice** (shows 0 or 1), then starts the **30-second round**. Five words appear; the describer gives clues, and taps "Mark correct" whenever the guesser says the right word. Words can be marked in any order.
4. When the timer hits 0, the buttons lock. The **round results** screen shows which words were guessed and which were missed.
5. **Movement = words correct − dice roll** (minimum 0). Tapping Continue moves the team's marker on the board and passes the turn to the other team.
6. First team to reach the final space wins.

Words are pulled from every chapter at once and shuffled together, so different chapters mix in the same round. Every word is used once before any word repeats — once the whole list has been used, it reshuffles and starts again.

## Editing the word list

Open `index.html` in a text editor and look near the top of the `<body>` for a block that starts like this:

```html
<script type="application/json" id="wordBank">
{
  "chapters": {
    "Animals": ["elephant", "penguin", "giraffe"],
    "Food & Drink": ["sandwich", "pancake", "avocado"]
  }
}
</script>
```

- Add, remove, or rename chapters freely — the names are just for your own organization; students never see them.
- Add as many words as you like per chapter.
- Keep it valid JSON: commas between items, quotes around every word, no trailing comma after the last item in a list.
- Save the file and reopen it in the browser — that's it.

## Running it

Each group uses one tablet or laptop, passed around between the describer and guesser(s). Just open `index.html`:

- **Copy it onto the device** (AirDrop, USB, email, a shared drive, whatever's easiest) and double-click it, or open it from your Files app. It runs entirely offline — no wifi or server needed.
- If you'd rather host it centrally so every tablet just opens one link, you can still upload `index.html` to GitHub Pages or any static web host; it works fine there too. That's optional, not required.

## Multiple groups at once

Each device keeps its own game state (saved locally to that browser), so several tablets can run their own copy of the same file independently without interfering with each other. Use **Reset game** (top right) to clear a group's players and board and start a new game on that device.

## Customizing the look

Board length, round length, and colors are set near the top of the `<script>` block in `index.html`:
- `ROUND_SECONDS` — length of the description round (default 30)
- `BOARD_LENGTH` — number of spaces to the finish (default 24)
- The `:root` CSS variables near the top of the `<style>` block control the color palette.
