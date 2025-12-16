// =====================
// GAME STATE VARIABLES
// =====================
let teams = null;
let currentTeamIndex = 0;     // 0 = Blue, 1 = Red
let currentPlayerIndex = 0;   // 0 = Player 1, 1 = Player 2

let wordPool = {};
let remainingWords = [];
let incorrectWords = [];
let allWords = [];

let timer = null;
let timeLeft = 30;

// =====================
// DOM ELEMENTS
// =====================
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

// =====================
// CONSTANTS
// =====================
const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];

// =====================
// LOAD CHAPTERS
// =====================
async function loadChapters() {
  const response = await fetch("chapters.json");
  const data = await response.json();
  wordPool = data;

  for (const chapter in data) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = chapter;
    checkbox.id = chapter;

    const label = document.createElement("label");
    label.setAttribute("for", chapter);
    label.textContent = chapter.replace("chapter", "Chapter ");

    const wrapper = document.createElement("div");
    wrapper.classList.add("checkbox-item");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    chapterSelection.appendChild(wrapper);
  }
}

// =====================
// SETUP GAME
// =====================
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

  if (teams.some(t => t.players.some(p => p === ""))) {
    alert("Please enter all player names.");
    return;
  }

  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map(cb => wordPool[cb.value]);

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

// =====================
// TURN MANAGEMENT
// =====================
function startTurn() {
  clearInterval(timer);

  const team = teams[currentTeamIndex];
  const player = team.players[currentPlayerIndex];

  currentPlayerDisplay.textContent = `${team.name} – ${player}`;
  diceResultMessage.textContent = "";

  wordDisplayContainer.innerHTML = "";

  rollDiceBtn.disabled = false;
  startRoundBtn.classList.add("hidden");
  resultsDisplay.classList.add("hidden");
  nextRoundBtn.classList.add("hidden");
  timerContainer.classList.add("hidden");
}

// 🔁 FIXED TURN ORDER LOGIC
function advanceTurn() {
  // switch team every turn
  currentTeamIndex = (currentTeamIndex + 1) % teams.length;

  // when we loop back to Blue, advance player
  if (currentTeamIndex === 0) {
    currentPlayerIndex =
      (currentPlayerIndex + 1) % teams[0].players.length;
  }
}

// =====================
// DICE ROLL
// =====================
rollDiceBtn.addEventListener("click", () => {
  const roll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${roll}`;
  rollDiceBtn.disabled = true;
  startRoundBtn.classList.remove("hidden");
});

// =====================
// START ROUND
// =====================
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden");

  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  let selectedWords = [];
  for (let i = 0; i < MAX_WORDS_PER_ROUND; i++) {
    if (remainingWords.length === 0) {
      remainingWords = incorrectWords.length
        ? [...incorrectWords]
        : [...allWords];
      incorrectWords = [];
      shuffleArray(remainingWords);
    }
    selectedWords.push(remainingWords.pop());
  }

  let roundWords = [];
  wordDisplayContainer.innerHTML = "";

  selectedWords.forEach(word => {
    const row = document.createElement("div");
    row.className = "word-row";

    const text = document.createElement("span");
    text.textContent = word;

    const btn = document.createElement("button");
    btn.textContent = "Correct";

    btn.onclick = () => {
      btn.disabled = true;
      row.dataset.correct = "true";
      checkRoundComplete(roundWords);
    };

    row.appendChild(text);
    row.appendChild(btn);
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

// =====================
// ROUND COMPLETION
// =====================
function checkRoundComplete(rows) {
  if (rows.every(r => r.dataset.correct === "true")) {
    clearInterval(timer);
    endRound(rows);
  }
}

function endRound(rows) {
  timerContainer.classList.add("hidden");

  let correct = 0;
  rows.forEach(r => {
    if (r.dataset.correct === "true") {
      correct++;
    } else {
      incorrectWords.push(r.querySelector("span").textContent);
    }
  });

  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10);
  const spaces = correct - diceRoll;

  teams[currentTeamIndex].score += spaces;

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${diceRoll} | Spaces: ${spaces}`;

  advanceTurn();

  const nextTeam = teams[currentTeamIndex];
  const nextPlayer = nextTeam.players[currentPlayerIndex];
  nextPlayerDisplay.textContent = `Next: ${nextTeam.name} – ${nextPlayer}`;

  resultsDisplay.classList.remove("hidden");
  nextRoundBtn.classList.remove("hidden");
}

// =====================
// NEXT ROUND BUTTON
// =====================
nextRoundBtn.addEventListener("click", () => {
  startTurn();
});

// =====================
// UTIL
// =====================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// =====================
loadChapters();
