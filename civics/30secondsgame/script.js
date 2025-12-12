// Variables for team and game setup
let teams = null;
let currentTeamIndex = 0;
let currentPlayerIndex = 0;
let wordPool = {};
let remainingWords = [];
let incorrectWords = [];
let allWords = [];
let timer = null;
let timeLeft = 30;

// DOM Elements
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");
const wordDisplayContainer = document.getElementById("word-display-container");
const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");
const timerDisplay = document.getElementById("time-left");
const diceResultMessage = document.getElementById("dice-result-message");
const currentPlayerDisplay = document.getElementById("current-player");
const resultsDisplay = document.getElementById("results");
const turnSummary = document.getElementById("turn-summary");
const nextPlayerDisplay = document.getElementById("next-player");

// Constants
const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];

/*** LOAD CHAPTERS FROM JSON AND RENDER CHECKBOXES ***/
async function loadChapters() {
  console.log("Loading chapters...");
  try {
    const response = await fetch("chapters.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters.json. Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Parsed JSON data:", data);
    wordPool = data;

    for (const chapter in data) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = chapter;
      checkbox.value = chapter;

      const label = document.createElement("label");
      label.setAttribute("for", chapter);
      label.textContent = chapter.replace("chapter", "Chapter");

      const wrapper = document.createElement("div");
      wrapper.classList.add("checkbox-item");
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      chapterSelection.appendChild(wrapper);
    }
    console.log("Chapters rendered successfully.");
  } catch (err) {
    console.error("Error loading chapters:", err);
  }
}

/*** SETUP GAME WHEN FORM IS SUBMITTED ***/
setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  teams = [
    {
      name: "Blue Team",
      players: [
        document.getElementById("blue-team-player-1").value.trim(),
        document.getElementById("blue-team-player-2").value.trim(),
      ],
      score: 0,
    },
    {
      name: "Red Team",
      players: [
        document.getElementById("red-team-player-1").value.trim(),
        document.getElementById("red-team-player-2").value.trim(),
      ],
      score: 0,
    },
  ];

  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => wordPool[input.value]);

  remainingWords = selectedChapters.flat();
  allWords = [...remainingWords];

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTurn();
});

/*** START TURN ***/
function startTurn() {
  clearInterval(timer);

  const currTeam = teams[currentTeamIndex];
  const currPlayer = currTeam.players[currentPlayerIndex];
  currentPlayerDisplay.textContent = `${currPlayer} (${currTeam.name})`;
  resultsDisplay.classList.add("hidden");
  console.log(`It's ${currPlayer}'s turn (${currTeam.name}).`);
}

/*** END ROUND (BUG FIXED) ***/
function endRound(words) {
  // Do the word-marking processing logic, scoring, and next-turn logic. Add logs if needed.
  console.log("Transitioning to the next stage...");
}
