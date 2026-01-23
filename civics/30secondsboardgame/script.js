// =====================
// GAME STATE
// =====================
let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let remainingWords = [];
let usedWords = [];

let timer = null;
let timeLeft = 30;

let currentDiceRoll = 0;

let teamPositions = {
  Blue: 0,
  Red: 0
};

// =====================
// DOM ELEMENTS
// =====================
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");

const boardWrapper = document.getElementById("board-wrapper");
const boardImage = document.getElementById("board-image");

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
// BOARD PATH (PERCENTAGES)
// =====================
const boardPath = [
  { x: 10, y: 85 },
  { x: 20, y: 80 },
  { x: 30, y: 74 },
  { x: 40, y: 68 },
  { x: 50, y: 62 },
  { x: 60, y: 56 },
  { x: 70, y: 50 },
  { x: 80, y: 44 },
  { x: 88, y: 36 },
  { x: 92, y: 28 }
];

// =====================
// BOARD VISIBILITY
// =====================
function showBoard() {
  boardWrapper.classList.remove("hidden");
}

function hideBoard() {
  boardWrapper.classList.add("hidden");
}

// =====================
// TOKEN POSITIONING (FIXED)
// =====================
function updateToken(team) {
  const pos = Math.min(teamPositions[team], boardPath.length - 1);
  teamPositions[team] = pos;

  const point = boardPath[pos];
  const token = document.getElementById(
    team === "Blue" ? "blue-token" : "red-token"
  );

  const rect = boardImage.getBoundingClientRect();

  token.style.left = rect.width * (point.x / 100) + "px";
  token.style.top = rect.height * (point.y / 100) + "px";
}

// =====================
// LOAD CHAPTERS
// =====================
async function loadChapters() {
  const res = await fetch("chapters.json");
  wordPool = await res.json();

  for (const chapter in wordPool) {
    const div = document.createElement("div");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = chapter;

    const label = document.createElement("label");
    label.textContent = chapter.replace("chapter", "Chapter ");

    div.append(cb, label);
    chapterSelection.appendChild(div);
  }
}

// =====================
// PLAYER SETUP
// =====================
function addPlayerRow() {
  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");
  input.placeholder = "Player name";
  input.required = true;

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.append(input, select);
  playersContainer.appendChild(row);
}

for (let i = 0; i < 4; i++) addPlayerRow();
addPlayerBtn.onclick = addPlayerRow;

// =====================
// START GAME
// =====================
setupForm.onsubmit = e => {
  e.preventDefault();

  players = [];
  document.querySelectorAll(".player-row").forEach(r => {
    const name = r.querySelector("input").value.trim();
    const team = r.querySelector("select").value;
    if (name) players.push({ name, team });
  });

  const chapters = [...chapterSelection.querySelectorAll("input:checked")]
    .flatMap(cb => wordPool[cb.value]);

  remainingWords = shuffleArray([...new Set(chapters)]);
  usedWords = [];

  buildTurnOrder();

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  updateToken("Blue");
  updateToken("Red");

  startTurn();
};

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

  const p = turnOrder[currentTurnIndex];
  currentPlayerDisplay.textContent = `${p.team} Team – ${p.name}`;
  diceResultMessage.textContent = "";

  wordDisplayContainer.innerHTML = "";
  rollDiceBtn.style.display = "inline-block";
  startRoundBtn.classList.add("hidden");
  resultsDisplay.classList.add("hidden");
  timerContainer.classList.add("hidden");

  showBoard();
}

function advanceTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
}

// =====================
// DICE
// =====================
rollDiceBtn.onclick = () => {
  currentDiceRoll =
    DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];

  diceResultMessage.textContent = `Dice Roll: ${currentDiceRoll}`;
  rollDiceBtn.style.display = "none";
  startRoundBtn.classList.remove("hidden");
};

// =====================
// START ROUND
// =====================
startRoundBtn.onclick = () => {
  startRoundBtn.classList.add("hidden");
  hideBoard();

  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  const selected = [];

  while (selected.length < MAX_WORDS_PER_ROUND) {
    if (remainingWords.length === 0) {
      remainingWords = shuffleArray(usedWords);
      usedWords = [];
    }

    const word = remainingWords.pop();
    selected.push(word);
    usedWords.push(word);
  }

  const rows = [];
  wordDisplayContainer.innerHTML = "";

  selected.forEach(word => {
    const row = document.createElement("div");
    row.className = "word-row";

    const span = document.createElement("span");
    span.textContent = word;

    const btn = document.createElement("button");
    btn.textContent = "Correct";
    btn.onclick = () => {
      btn.disabled = true;
      row.dataset.correct = "true";
    };

    row.append(span, btn);
    wordDisplayContainer.appendChild(row);
    rows.push(row);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      disableAllWordButtons();
      endRound(rows);
    }
  }, 1000);
};

// =====================
// END ROUND
// =====================
function endRound(rows) {
  timerContainer.classList.add("hidden");
  showBoard();

  const correct = rows.filter(r => r.dataset.correct === "true").length;
  const spaces = Math.max(0, correct - currentDiceRoll);

  const player = turnOrder[currentTurnIndex];
  teamPositions[player.team] += spaces;
  updateToken(player.team);

  if (checkWin(player.team)) return;

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${currentDiceRoll} | Spaces: ${spaces}`;

  advanceTurn();
  const next = turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent = `Next: ${next.team} Team – ${next.name}`;

  resultsDisplay.classList.remove("hidden");
}

// =====================
// WIN CONDITION
// =====================
function checkWin(team) {
  if (teamPositions[team] >= boardPath.length - 1) {
    alert(`${team} Team Wins! 🎉`);
    rollDiceBtn.disabled = true;
    startRoundBtn.disabled = true;
    return true;
  }
  return false;
}

// =====================
// UTIL
// =====================
function disableAllWordButtons() {
  document
    .querySelectorAll(".word-row button")
    .forEach(btn => (btn.disabled = true));
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// =====================
loadChapters();
