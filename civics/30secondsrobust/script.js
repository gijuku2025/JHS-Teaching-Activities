// =====================
// GAME STATE
// =====================
let teams = {
  blue: { name: "Blue Team", players: [], score: 0 },
  red: { name: "Red Team", players: [], score: 0 }
};

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
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");

const playerList = document.getElementById("player-list");
const addPlayerBtn = document.getElementById("add-player-btn");
const blueTeamList = document.getElementById("blue-team-list");
const redTeamList = document.getElementById("red-team-list");

const currentPlayerDisplay = document.getElementById("current-player");
const diceResultMessage = document.getElementById("dice-result-message");

const wordDisplayContainer = document.getElementById("word-display-container");
const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");
const nextRoundBtn = document.getElementById("next-round-btn");

const timerContainer = document.getElementById("timer-container");
const timerDisplay = document.getElementById("time-left");

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
  wordPool = await response.json();

  for (const chapter in wordPool) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = chapter;
    checkbox.id = chapter;

    const label = document.createElement("label");
    label.htmlFor = chapter;
    label.textContent = chapter.replace("chapter", "Chapter ");

    const wrapper = document.createElement("div");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    chapterSelection.appendChild(wrapper);
  }
}

// =====================
// PLAYER SETUP UI
// =====================
function addPlayerInput() {
  const wrapper = document.createElement("div");
  wrapper.className = "player-entry";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Player name";
  input.required = true;

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="blue">Blue Team</option>
    <option value="red">Red Team</option>
  `;

  wrapper.appendChild(input);
  wrapper.appendChild(select);
  playerList.appendChild(wrapper);
}

// Add first 4 inputs by default
for (let i = 0; i < 4; i++) addPlayerInput();

addPlayerBtn.addEventListener("click", addPlayerInput);

// =====================
// SETUP GAME
// =====================
setupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  teams.blue.players = [];
  teams.red.players = [];

  const entries = document.querySelectorAll(".player-entry");

  entries.forEach(entry => {
    const name = entry.querySelector("input").value.trim();
    const team = entry.querySelector("select").value;

    if (name) {
      teams[team].players.push(name);
    }
  });

  if (teams.blue.players.length === 0 || teams.red.players.length === 0) {
    alert("Each team must have at least one player.");
    return;
  }

  buildTurnOrder();

  const selectedChapters = Array.from(
    setupForm.querySelectorAll("#chapter-selection input:checked")
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
// TURN ORDER LOGIC
// =====================
function buildTurnOrder() {
  turnOrder = [];

  const maxPlayers = Math.max(
    teams.blue.players.length,
    teams.red.players.length
  );

  for (let i = 0; i < maxPlayers; i++) {
    if (teams.blue.players[i]) {
      turnOrder.push({ team: "blue", player: teams.blue.players[i] });
    }
    if (teams.red.players[i]) {
      turnOrder.push({ team: "red", player: teams.red.players[i] });
    }
  }

  currentTurnIndex = 0;
}

function startTurn() {
  clearInterval(timer);

  const current = turnOrder[currentTurnIndex];
  currentPlayerDisplay.textContent =
    `${teams[current.team].name} – ${current.player}`;

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

  const roundWords = [];
  wordDisplayContainer.innerHTML = "";

  for (let i = 0; i < MAX_WORDS_PER_ROUND; i++) {
    if (remainingWords.length === 0) {
      remainingWords = incorrectWords.length
        ? [...incorrectWords]
        : [...allWords];
      incorrectWords = [];
      shuffleArray(remainingWords);
    }

    const word = remainingWords.pop();
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
  }

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

  const diceRoll = parseInt(
    diceResultMessage.textContent.match(/\d+/)[0], 10
  );

  const spaces = correct - diceRoll;

  const current = turnOrder[currentTurnIndex];
  teams[current.team].score += spaces;

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${diceRoll} | Spaces: ${spaces}`;

  advanceTurn();

  const next = turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent =
    `Next: ${teams[next.team].name} – ${next.player}`;

  resultsDisplay.classList.remove("hidden");
  nextRoundBtn.classList.remove("hidden");
}

// =====================
// NEXT ROUND
// =====================
nextRoundBtn.addEventListener("click", startTurn);

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
