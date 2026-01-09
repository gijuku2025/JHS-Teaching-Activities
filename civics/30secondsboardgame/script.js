// =====================
// GAME STATE
// =====================
let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let remainingWords = [];
let incorrectWords = [];

let timer = null;
let timeLeft = 30;

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
// BOARD PATH (EDIT X/Y IF NEEDED)
// =====================
const boardPath = [
  { x: 80, y: 520 },
  { x: 160, y: 500 },
  { x: 240, y: 470 },
  { x: 320, y: 430 },
  { x: 400, y: 390 },
  { x: 480, y: 350 },
  { x: 560, y: 320 },
  { x: 640, y: 280 },
  { x: 720, y: 240 },
  { x: 780, y: 180 }
];

// =====================
// BOARD TOKEN UPDATE
// =====================
function updateToken(team) {
  const pos = Math.min(teamPositions[team], boardPath.length - 1);
  teamPositions[team] = pos;

  const point = boardPath[pos];
  const token = document.getElementById(
    team === "Blue" ? "blue-token" : "red-token"
  );

  token.style.left = point.x + "px";
  token.style.top = point.y + "px";
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
    .map(cb => wordPool[cb.value])
    .flat();

  remainingWords = [...new Set(chapters)];

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
}

function advanceTurn() {
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
}

// =====================
// DICE
// =====================
rollDiceBtn.onclick = () => {
  const roll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${roll}`;
  rollDiceBtn.style.display = "none";
  startRoundBtn.classList.remove("hidden");
};

// =====================
// START ROUND
// =====================
startRoundBtn.onclick = () => {
  startRoundBtn.classList.add("hidden");
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  const selected = [];
  while (selected.length < MAX_WORDS_PER_ROUND && remainingWords.length) {
    selected.push(remainingWords.pop());
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
      endRound(rows);
    }
  }, 1000);
};

// =====================
// END ROUND
// =====================
function endRound(rows) {
  timerContainer.classList.add("hidden");

  let correct = rows.filter(r => r.dataset.correct === "true").length;
  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10);
  const spaces = Math.max(0, correct - diceRoll);

  const player = turnOrder[currentTurnIndex];
  teamPositions[player.team] += spaces;
  updateToken(player.team);

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${diceRoll} | Spaces: ${spaces}`;

  advanceTurn();
  const next = turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent = `Next: ${next.team} Team – ${next.name}`;

  resultsDisplay.classList.remove("hidden");
}

// =====================
// NEXT ROUND
// =====================
nextRoundBtn.onclick = startTurn;

// =====================
loadChapters();
