// =============================
// VARIABLES
// =============================
let teams = null;
let currentTeamIndex = 0;
let currentPlayerIndex = 0;

let wordPool = {};
let remainingWords = [];
let incorrectWords = [];
let allWords = [];

let timer = null;
let timeLeft = 30;

const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];

// =============================
// DOM ELEMENTS
// =============================
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const chapterSelection = document.getElementById("chapter-selection");

const gameScreen = document.getElementById("game-screen");
const wordDisplayContainer = document.getElementById("word-display-container");

const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");
const nextRoundBtn = document.getElementById("next-round-btn");

const timerContainer = document.getElementById("timer-container");
const timerDisplay = document.getElementById("time-left");

const diceResultMessage = document.getElementById("dice-result-message");
const currentPlayerDisplay = document.getElementById("current-player");

const resultsDisplay = document.getElementById("results");
const turnSummary = document.getElementById("turn-summary");
const nextPlayerDisplay = document.getElementById("next-player");

// =============================
// LOAD CHAPTERS FROM JSON
// =============================
async function loadChapters() {
  try {
    const response = await fetch("chapters.json");
    if (!response.ok) throw new Error("Could not load chapters.json");

    const data = await response.json();
    wordPool = data;

    for (const chapter in data) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("checkbox-item");

      wrapper.innerHTML = `
        <input type="checkbox" id="${chapter}" value="${chapter}">
        <label for="${chapter}">${chapter.replace("chapter", "Chapter ")}</label>
      `;

      chapterSelection.appendChild(wrapper);
    }
  } catch (err) {
    alert("Failed to load chapters.json");
    console.error(err);
  }
}

// =============================
// GAME SETUP
// =============================
setupForm.addEventListener("submit", (e) => {
  e.preventDefault();

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

  if (teams.some((t) => t.players.some((p) => p === ""))) {
    alert("Please enter all player names.");
    return;
  }

  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => wordPool[input.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  remainingWords = selectedChapters.flat();
  allWords = [...remainingWords];

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTurn();
});

// =============================
// START TURN
// =============================
function startTurn() {
  clearInterval(timer);

  const currentTeam = teams[currentTeamIndex];
  const currentPlayer = currentTeam.players[currentPlayerIndex];

  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;

  wordDisplayContainer.innerHTML = "";
  diceResultMessage.textContent = "";

  rollDiceBtn.disabled = false;
  startRoundBtn.classList.add("hidden");

  resultsDisplay.classList.add("hidden");
  nextRoundBtn.classList.add("hidden");

  timerContainer.classList.add("hidden");
}

// =============================
// DICE ROLL
// =============================
rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${diceRoll}`;

  rollDiceBtn.disabled = true;
  startRoundBtn.classList.remove("hidden");
});

// =============================
// START ROUND
// =============================
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden");

  timerContainer.classList.remove("hidden");
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;

  let selectedWords = [];
  for (let i = 0; i < MAX_WORDS_PER_ROUND; i++) {
    if (remainingWords.length === 0) {
      remainingWords = incorrectWords.length > 0 ? [...incorrectWords] : [...allWords];
      incorrectWords = [];
      shuffleArray(remainingWords);
    }
    selectedWords.push(remainingWords.pop());
  }

  let roundWords = [];
  wordDisplayContainer.innerHTML = "";

  selectedWords.forEach((word) => {
    const row = document.createElement("div");
    row.classList.add("word-row");

    row.innerHTML = `
      <span class="word-text">${word}</span>
      <button class="correct-btn">Correct</button>
    `;

    row.querySelector("button").addEventListener("click", () => {
      row.dataset.correct = "true";
      row.querySelector("button").disabled = true;
      checkForRoundCompletion(roundWords);
    });

    wordDisplayContainer.appendChild(row);
    roundWords.push(row);
  });

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endRound(roundWords);
    }
  }, 1000);
});

// =============================
// EARLY END CHECK
// =============================
function checkForRoundCompletion(roundWords) {
  const allMarked = roundWords.every((row) => row.dataset.correct === "true");
  if (allMarked) {
    clearInterval(timer);
    endRound(roundWords);
  }
}

// =============================
// END ROUND
// =============================
function endRound(roundWords) {
  let correctCount = 0;

  roundWords.forEach((row) => {
    const isCorrect = row.dataset.correct === "true";
    const word = row.querySelector(".word-text").textContent;

    if (isCorrect) correctCount++;
    else incorrectWords.push(word);
  });

  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0]);
  const spacesToMove = correctCount - diceRoll;

  const team = teams[currentTeamIndex];
  team.score += spacesToMove;

  turnSummary.textContent = `Correct: ${correctCount} | Dice Roll: ${diceRoll} | Spaces Moved: ${spacesToMove}`;

  nextPlayerDisplay.textContent =
    "Next Player: " +
    teams[(currentTeamIndex + 1) % teams.length].players[
      (currentPlayerIndex + 1) % 2
    ];

  resultsDisplay.classList.remove("hidden");
  nextRoundBtn.classList.remove("hidden");
}

// =============================
// NEXT ROUND BUTTON
// =============================
nextRoundBtn.addEventListener("click", () => {
  currentPlayerIndex = (currentPlayerIndex + 1) % 2;
  currentTeamIndex = (currentTeamIndex + 1) % teams.length;

  startTurn();
});

// =============================
// SHUFFLE HELPERS
// =============================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// =============================
// INIT
// =============================
loadChapters();
