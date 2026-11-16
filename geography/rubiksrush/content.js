// =====================================================================
//  CHAPTER CONTENT  –  edit this file for each new chapter.
//  (On GitHub: open content.js, click the pencil icon, edit, commit.)
//
//  categories: groups of words. A "category round" shows `clue` and the
//              player taps 3 tiles from that group (the other tiles come
//              from the other categories). Need at least 2 categories and
//              at least 9 words in total. Keep words short for tiles!
//
//  facts:      single-answer questions. `a` is the right tile. `group` must
//              match the `name` of a category – the wrong tiles are taken
//              from that group first, so it's a real test of knowledge.
// =====================================================================
const CHAPTER = {
  title: "Sample chapter: Our World",

  categories: [
    { name: "Oceans",    clue: "Tap all the OCEANS",
      items: ["Pacific", "Atlantic", "Indian", "Arctic", "Southern"] },

    { name: "Continents", clue: "Tap all the CONTINENTS",
      items: ["Asia", "Africa", "Europe", "North America", "South America", "Australia", "Antarctica"] },

    { name: "Landforms", clue: "Tap all the LANDFORMS",
      items: ["mountain", "island", "desert", "valley", "volcano", "plain", "peninsula"] },

    { name: "Asian countries", clue: "Tap the countries in ASIA",
      items: ["Japan", "China", "India", "Thailand", "Korea", "Vietnam"] },

    { name: "European countries", clue: "Tap the countries in EUROPE",
      items: ["France", "Italy", "Spain", "Germany", "Poland", "Greece"] },

    { name: "Directions", clue: "Tap the DIRECTIONS",
      items: ["north", "south", "east", "west"] }
  ],

  facts: [
    { q: "Which is the BIGGEST ocean?",             a: "Pacific",       group: "Oceans" },
    { q: "Which ocean is the COLDEST (North Pole)?", a: "Arctic",        group: "Oceans" },
    { q: "Which continent is the BIGGEST?",          a: "Asia",          group: "Continents" },
    { q: "Which continent is the COLDEST?",          a: "Antarctica",    group: "Continents" },
    { q: "Which continent has the Sahara Desert?",   a: "Africa",        group: "Continents" },
    { q: "Land with water all around it is an...",   a: "island",        group: "Landforms" },
    { q: "A mountain that can erupt is a...",        a: "volcano",       group: "Landforms" },
    { q: "A very dry, sandy place is a...",          a: "desert",        group: "Landforms" },
    { q: "Which country is Tokyo in?",               a: "Japan",         group: "Asian countries" },
    { q: "Which country is Paris in?",               a: "France",        group: "European countries" },
    { q: "The sun rises in the...",                  a: "east",          group: "Directions" },
    { q: "Opposite of north?",                       a: "south",         group: "Directions" }
  ]
};
