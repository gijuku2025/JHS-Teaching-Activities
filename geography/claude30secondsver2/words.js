/* ==============================================================
   30 SECONDS — WORD BANK
   ==============================================================
   Edit the word lists below to customize what students see.

   - Add, remove, or rename chapters freely — the chapter names
     are just for your own organization; students never see them.
   - Add as many words as you like inside each chapter's [ ] list.
   - Keep the punctuation exactly as shown: each word in quotes,
     commas between words, and no comma after the last word in a
     list or the last chapter.
   - Save this file and reload index.html in the browser — no
     server or rebuild needed.

   Why is this a .js file and not a plain .json file?
   Opening index.html straight from disk (double-clicking it) is
   exactly what you asked for — but browsers block a local page
   from *fetching* a separate .json file for security reasons
   unless it's served from a website. A tiny .js file that just
   assigns the same data to a variable doesn't hit that block, so
   this is the closest thing to "words in a separate file" that
   still works with zero setup. The content below the first line
   is still exactly the same JSON shape you'd put in a .json file.
   ============================================================== */

window.WORD_BANK = {
  "chapters": {
    "Animals": [
      "elephant", "penguin", "giraffe", "octopus", "kangaroo",
      "dolphin", "hedgehog", "butterfly", "crocodile", "squirrel"
    ],
    "Food & Drink": [
      "sandwich", "pancake", "avocado", "spaghetti", "lemonade",
      "popcorn", "strawberry", "omelette", "sausage", "pineapple"
    ],
    "Travel & Places": [
      "airport", "passport", "mountain", "lighthouse", "suitcase",
      "campsite", "harbour", "motorway", "waterfall", "village"
    ],
    "School & Work": [
      "notebook", "calculator", "timetable", "whiteboard", "deadline",
      "interview", "classroom", "homework", "printer", "keyboard"
    ],
    "Feelings & People": [
      "jealous", "confident", "exhausted", "curious", "embarrassed",
      "neighbour", "stranger", "toddler", "grandparent", "teenager"
    ],
    "Everyday Objects": [
      "umbrella", "pillow", "candle", "scissors", "mirror",
      "blanket", "ladder", "battery", "envelope", "toothbrush"
    ]
  }
};
