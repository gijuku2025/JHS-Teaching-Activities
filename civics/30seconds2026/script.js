let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let previousRoundWords = [];
let recentCombinations = [];

let timer = null;
let timeLeft = 30;
let currentDiceRoll = 0;

const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];


/* =========================
   DOM
========================= */

const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");

const currentPlayerDisplay =
  document.getElementById("current-player");

const diceResultMessage =
  document.getElementById("dice-result-message");

const wordDisplayContainer =
  document.getElementById("word-display-container");

const rollDiceBtn =
  document.getElementById("roll-dice-btn");

const startRoundBtn =
  document.getElementById("start-round-btn");

const timerContainer =
  document.getElementById("timer-container");

const timerDisplay =
  document.getElementById("time-left");

const resultsDisplay =
  document.getElementById("results");

const turnSummary =
  document.getElementById("turn-summary");

const nextPlayerDisplay =
  document.getElementById("next-player");

const nextRoundBtn =
  document.getElementById("next-round-btn");

const winnerControls =
  document.getElementById("winner-controls");

const blueWinsBtn =
  document.getElementById("blue-wins-btn");

const redWinsBtn =
  document.getElementById("red-wins-btn");

const winScreen =
  document.getElementById("win-screen");

const winnerMessage =
  document.getElementById("winner-message");

const restartGameBtn =
  document.getElementById("restart-game-btn");


/* =========================
   PLAYER SETUP
========================= */

function addPlayerRow() {

  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");

  input.type = "text";
  input.placeholder = "Player name";

  const select = document.createElement("select");

  select.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.appendChild(input);
  row.appendChild(select);

  playersContainer.appendChild(row);
}


function createPlayerRows() {

  playersContainer.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    addPlayerRow();
  }
}


/* =========================
   CHAPTERS
========================= */

async function loadChapters() {

  try {

    const response = await fetch("chapters.json");

    if (!response.ok) {
      throw new Error("Could not load chapters.json");
    }

    wordPool = await response.json();

    chapterSelection.innerHTML = "";

    Object.keys(wordPool).forEach(chapter => {

      const box =
        document.createElement("div");

      box.className =
        "chapter-box";


      const checkbox =
        document.createElement("input");

      checkbox.type =
        "checkbox";

      checkbox.value =
        chapter;


      const number =
        document.createElement("div");

      number.textContent =
        chapter.replace("chapter", "");


      box.appendChild(checkbox);
      box.appendChild(number);


      box.addEventListener("click", event => {

        if (event.target !== checkbox) {
          checkbox.checked =
            !checkbox.checked;
        }

        box.classList.toggle(
          "selected",
          checkbox.checked
        );
      });


      chapterSelection.appendChild(box);

    });

  } catch (error) {

    console.error(error);

    chapterSelection.innerHTML =
      "<p>Could not load chapters.</p>";
  }
}


/* =========================
   START GAME
========================= */

function startGame(event) {

  event.preventDefault();

  players = [];


  const rows =
    playersContainer.querySelectorAll(
      ".player-row"
    );


  rows.forEach(row => {

    const input =
      row.querySelector("input");

    const select =
      row.querySelector("select");


    const name =
      input.value.trim();

    const team =
      select.value;


    if (name) {

      players.push({
        name: name,
        team: team
      });

    }

  });


  if (players.length < 2) {

    alert(
      "Please enter at least two players."
    );

    return;
  }


  const selectedChapterInputs =
    chapterSelection.querySelectorAll(
      "input:checked"
    );


  if (selectedChapterInputs.length === 0) {

    alert(
      "Please select at least one chapter."
    );

    return;
  }


  let selectedWords = [];


  selectedChapterInputs.forEach(
    checkbox => {

      const chapterWords =
        wordPool[checkbox.value];


      if (Array.isArray(chapterWords)) {

        selectedWords.push(
          ...chapterWords
        );

      }

    }
  );


  selectedWords =
    [...new Set(selectedWords)];


  if (selectedWords.length === 0) {

    alert(
      "The selected chapters contain no words."
    );

    return;
  }


  // Store the complete word pool.

  wordPool.currentGameWords =
    selectedWords;


  previousRoundWords = [];

  recentCombinations = [];


  buildTurnOrder();


  currentTurnIndex = 0;


  startScreen.classList.add(
    "hidden"
  );

  gameScreen.classList.remove(
    "hidden"
  );

  winScreen.classList.add(
    "hidden"
  );


  startTurn();
}


/* =========================
   TURN ORDER
========================= */

function buildTurnOrder() {

  const bluePlayers =
    players.filter(
      player =>
        player.team === "Blue"
    );


  const redPlayers =
    players.filter(
      player =>
        player.team === "Red"
    );


  turnOrder = [];


  const longest =
    Math.max(
      bluePlayers.length,
      redPlayers.length
    );


  for (
    let i = 0;
    i < longest;
    i++
  ) {

    if (bluePlayers[i]) {
      turnOrder.push(
        bluePlayers[i]
      );
    }


    if (redPlayers[i]) {
      turnOrder.push(
        redPlayers[i]
      );
    }

  }
}


/* =========================
   SHUFFLE
========================= */

function shuffle(array) {

  const result =
    [...array];


  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );


    [
      result[i],
      result[j]
    ] =
    [
      result[j],
      result[i]
    ];

  }


  return result;
}


/* =========================
   SELECT WORDS
========================= */

function selectWordsForRound() {

  const allWords =
    wordPool.currentGameWords || [];


  if (allWords.length === 0) {
    return [];
  }


  const numberToSelect =
    Math.min(
      MAX_WORDS_PER_ROUND,
      allWords.length
    );


  /*
     IMPORTANT:

     If there are at least 5 words
     that were NOT used in the previous
     round, use those first.

     This guarantees that consecutive
     rounds do not contain the same
     words when the chapter has 10 words.
  */

  let availableWords =
    allWords.filter(
      word =>
        !previousRoundWords.includes(word)
    );


  /*
     If there aren't enough unused words,
     fill the remaining spaces from the
     complete pool.
  */

  if (
    availableWords.length <
    numberToSelect
  ) {

    const extraWords =
      shuffle(
        allWords.filter(
          word =>
            !availableWords.includes(word)
        )
      );


    availableWords =
      [
        ...availableWords,
        ...extraWords
      ];

  }


  /*
     Shuffle the available words so
     the order changes every round.
  */

  let selection =
    shuffle(
      availableWords
    ).slice(
      0,
      numberToSelect
    );


  /*
     Try to avoid repeating an entire
     five-word combination from the
     recent rounds.
  */

  const makeKey =
    words =>
      [...words]
        .sort()
        .join("|");


  const currentKey =
    makeKey(selection);


  if (
    recentCombinations.includes(
      currentKey
    )
  ) {

    for (
      let attempt = 0;
      attempt < 50;
      attempt++
    ) {

      const alternative =
        shuffle(
          availableWords
        ).slice(
          0,
          numberToSelect
        );


      const alternativeKey =
        makeKey(alternative);


      if (
        !recentCombinations.includes(
          alternativeKey
        )
      ) {

        selection =
          alternative;

        break;
      }

    }

  }


  /*
     Remember the combination.
  */

  recentCombinations.push(
    makeKey(selection)
  );


  if (
    recentCombinations.length > 6
  ) {

    recentCombinations.shift();

  }


  /*
     Remember this round's words.
  */

  previousRoundWords =
    [...selection];


  return selection;
}


/* =========================
   START TURN
========================= */

function startTurn() {

  clearInterval(timer);


  wordDisplayContainer.innerHTML =
    "";


  resultsDisplay.classList.add(
    "hidden"
  );


  timerContainer.classList.add(
    "hidden"
  );


  winnerControls.classList.remove(
    "hidden"
  );


  if (turnOrder.length === 0) {
    return;
  }


  const player =
    turnOrder[currentTurnIndex];


  currentPlayerDisplay.textContent =
    `${player.team} Team – ${player.name}`;


  diceResultMessage.textContent =
    "";


  rollDiceBtn.style.display =
    "inline-block";


  startRoundBtn.classList.add(
    "hidden"
  );

}


/* =========================
   DICE
========================= */

function rollDice() {

  currentDiceRoll =
    DICE_RESULTS[
      Math.floor(
        Math.random() *
        DICE_RESULTS.length
      )
    ];


  diceResultMessage.textContent =
    `Dice Roll: ${currentDiceRoll}`;


  rollDiceBtn.style.display =
    "none";


  startRoundBtn.classList.remove(
    "hidden"
  );
}


/* =========================
   START ROUND
========================= */

function startRound() {

  startRoundBtn.classList.add(
    "hidden"
  );


  timeLeft = 30;


  timerDisplay.textContent =
    timeLeft;


  timerContainer.classList.remove(
    "hidden"
  );


  const selectedWords =
    selectWordsForRound();


  const rows = [];


  wordDisplayContainer.innerHTML =
    "";


  selectedWords.forEach(word => {

    const row =
      document.createElement("div");

    row.className =
      "word-row";


    const wordText =
      document.createElement("span");

    wordText.textContent =
      word;


    const correctButton =
      document.createElement("button");

    correctButton.textContent =
      "Correct";


    correctButton.addEventListener(
      "click",
      () => {

        correctButton.disabled =
          true;

        row.dataset.correct =
          "true";

      }
    );


    row.appendChild(
      wordText
    );

    row.appendChild(
      correctButton
    );


    wordDisplayContainer.appendChild(
      row
    );


    rows.push(row);

  });


  timer =
    setInterval(() => {

      timeLeft--;


      timerDisplay.textContent =
        timeLeft;


      if (timeLeft <= 0) {

        clearInterval(timer);


        rows.forEach(row => {

          const button =
            row.querySelector(
              "button"
            );


          if (button) {
            button.disabled =
              true;
          }

        });


        endRound(rows);

      }

    }, 1000);
}


/* =========================
   END ROUND
========================= */

function endRound(rows) {

  clearInterval(timer);


  timerContainer.classList.add(
    "hidden"
  );


  const correct =
    rows.filter(
      row =>
        row.dataset.correct ===
        "true"
    ).length;


  const spaces =
    Math.max(
      0,
      correct - currentDiceRoll
    );


  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${currentDiceRoll} | Move: ${spaces} spaces`;


  currentTurnIndex =
    (
      currentTurnIndex + 1
    ) %
    turnOrder.length;


  const nextPlayer =
    turnOrder[currentTurnIndex];


  nextPlayerDisplay.textContent =
    `Next: ${nextPlayer.team} Team – ${nextPlayer.name}`;


  resultsDisplay.classList.remove(
    "hidden"
  );
}


/* =========================
   NEXT ROUND
========================= */

function nextRound() {

  startTurn();

}


/* =========================
   WINNER
========================= */

function declareWinner(team) {

  clearInterval(timer);


  resultsDisplay.classList.add(
    "hidden"
  );


  wordDisplayContainer.innerHTML =
    "";


  timerContainer.classList.add(
    "hidden"
  );


  winnerMessage.textContent =
    `${team} Team wins! 🎉`;


  winScreen.classList.remove(
    "hidden"
  );
}


/* =========================
   RESTART
========================= */

function restartGame() {

  clearInterval(timer);


  players = [];

  turnOrder = [];

  currentTurnIndex = 0;

  wordPool = {};

  previousRoundWords = [];

  recentCombinations = [];

  timeLeft = 30;

  currentDiceRoll = 0;


  timerDisplay.textContent =
    "30";


  currentPlayerDisplay.textContent =
    "";


  diceResultMessage.textContent =
    "";


  wordDisplayContainer.innerHTML =
    "";


  resultsDisplay.classList.add(
    "hidden"
  );


  timerContainer.classList.add(
    "hidden"
  );


  startRoundBtn.classList.add(
    "hidden"
  );


  winScreen.classList.add(
    "hidden"
  );


  rollDiceBtn.style.display =
    "inline-block";


  /*
     Recreate the player inputs.
  */

  createPlayerRows();


  /*
     Return to setup screen.
  */

  gameScreen.classList.add(
    "hidden"
  );

  startScreen.classList.remove(
    "hidden"
  );


  /*
     Reload chapters.
  */

  loadChapters();
}


/* =========================
   BUTTON EVENTS
========================= */

addPlayerBtn.addEventListener(
  "click",
  addPlayerRow
);


setupForm.addEventListener(
  "submit",
  startGame
);


rollDiceBtn.addEventListener(
  "click",
  rollDice
);


startRoundBtn.addEventListener(
  "click",
  startRound
);


nextRoundBtn.addEventListener(
  "click",
  nextRound
);


blueWinsBtn.addEventListener(
  "click",
  () =>
    declareWinner("Blue")
);


redWinsBtn.addEventListener(
  "click",
  () =>
    declareWinner("Red")
);


restartGameBtn.addEventListener(
  "click",
  restartGame
);


/* =========================
   INITIAL SETUP
========================= */

createPlayerRows();

loadChapters();
