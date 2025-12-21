// =====================
// GAME STATE
// =====================
let players = []; // { name, team }
let turnOrder = [];
let currentTurnIndex = 0;

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
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");

const currentPlayerDisplay = document.getElementById("current-player");
const diceResultMessage = document.getElementById("dice-result-message");

const wordDisplayContainer = document.getElementById("word-display-container");
const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");

const timerContainer = document.getElementById("timer-container");
const timerDisplay = document.getElementById("time-left");

const resultsDisplay = document.getElementById("results");
const turnSummary = document.getElementById("turn-summary");
const nextPlayerDisplay = document.getElementById("next-player");
const nextRoundBtn = document.getElementById("next-round-btn");

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
    const wrapper = document.createElement("div");
    wrapper.className = "checkbox-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = chapter;

    const label = document.createElement("label");
    label.textContent = chapter.replace("chapter", "Chapter ");

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    chapterSelection.appendChild(wrapper);
  }
}

// =====================
// PLAYER SETUP
// =====================
function addPlayerRow() {
  const row = document.createElement("div");
  row.className = "player-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Player name";
  nameInput.required = true;

  const teamSelect = document.createElement("select");
  teamSelect.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.appendChild(nameInput);
  row.appendChild(teamSelect);
  playersContainer.appendChild(row);
}

// start with 4 players
for (let i = 0; i < 4; i++) addPlayerRow();

addPlayerBtn.addEventListener("click", () => {
  addPlayerRow();
});

// =====================
// SETUP GAME
// =====================
setupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  players = [];
  document.querySelectorAll(".player-row").forEach(row => {
    const name = row.querySelector("input").value.trim();
    const team = row.querySelector("select").value;

    if (name) {
      players.push({ name, team });
    }
  });

  if (players.length < 2) {
    alert("Please enter at least 2 players.");
    return;
  }

  const selectedChapters = Array.from(
    chapterSelection.querySelectorAll("input[type='checkbox']:checked")
  ).map(cb => wordPool[cb.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  remainingWords = selectedChapters.flat();
  allWords = [...remainingWords];

  buildTurnOrder();

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTurn();
});

// =====================
// TURN ORDER
// =====================
function buildTurnOrder() {
  const blue = players.filter(p => p.team === "Blue");
  const red = players.filter(p => p.team === "Red");

  turnOrder = [];
  const max = Math.max(blue.length, red.length);

  for (let i = 0; i < max; i++) {
    if (blue[i]) turnOrder.push(blue[i]);
    if (red[i]) turnOrder.push(red[i]);
  }
}

// =====================
// TURN MANAGEMENT
// =====================
function startTurn() {
  clearInterval(timer);

  const player = turnOrder[currentTurnIndex];
  currentPlayerDisplay.textContent = `${player.team} Team – ${player.name}`;
  diceResultMessage.textContent = "";

  wordDisplayContainer.innerHTML = "";

  rollDiceBtn.disabled = false;
  startRoundBtn.classList.add("hidden");
  resultsDisplay.classList.add("hidden");
  nextRoundBtn.classList.add("hidden");
  timerContainer.classList.add("hidden");
}

function advanceTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
}

// =====================
// DICE
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

  let rows = [];
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
      btn.classList.add("disabled");
      row.dataset.correct = "true";
      checkRoundComplete(rows);
    };

    row.appendChild(text);
    row.appendChild(btn);
    wordDisplayContainer.appendChild(row);

    rows.push(row);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      endRound(rows);
    }
  }, 1000);
});

// =====================
// ROUND END
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

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${diceRoll} | Spaces: ${spaces}`;

  advanceTurn();

  const next = turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent = `Next: ${next.team} Team – ${next.name}`;

  resultsDisplay.classList.remove("hidden");
  nextRoundBtn.classList.remove("hidden");
}

// =====================
// NEXT ROUND
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
