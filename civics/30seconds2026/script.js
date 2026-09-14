let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let remainingWords = [];
let usedWords = [];

let timer = null;
let timeLeft = 30;
let currentDiceRoll = 0;

// DOM
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

const winnerControls = document.getElementById("winner-controls");
const blueWinsBtn = document.getElementById("blue-wins-btn");
const redWinsBtn = document.getElementById("red-wins-btn");

const winScreen = document.getElementById("win-screen");
const winnerMessage = document.getElementById("winner-message");
const restartGameBtn = document.getElementById("restart-game-btn");

const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];

async function loadChapters() {
  const res = await fetch("chapters.json");
  wordPool = await res.json();

  chapterSelection.innerHTML = "";

  for (const chapter in wordPool) {
    const box = document.createElement("div");
    box.className = "chapter-box";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = chapter;

    const num = document.createElement("div");
    num.textContent = chapter.replace("chapter", "");

    box.appendChild(cb);
    box.appendChild(num);

    box.onclick = () => {
      cb.checked = !cb.checked;
      box.classList.toggle("selected", cb.checked);
    };

    chapterSelection.appendChild(box);
  }
}

function addPlayerRow() {
  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");
  input.placeholder = "Player name";

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.append(input, select);
  playersContainer.appendChild(row);
}

for (let i = 0; i < 4; i++) {
  addPlayerRow();
}

addPlayerBtn.onclick = addPlayerRow;

setupForm.onsubmit = e => {
  e.preventDefault();

  players = [];

  document.querySelectorAll(".player-row").forEach(r => {
    const name = r.querySelector("input").value.trim();
    const team = r.querySelector("select").value;

    if (name) {
      players.push({ name, team });
    }
  });

  const chapters = [
    ...chapterSelection.querySelectorAll("input:checked")
  ]
    .map(cb => wordPool[cb.value])
    .flat();

  remainingWords = [...new Set(chapters)];
  usedWords = [];

  buildTurnOrder();

  currentTurnIndex = 0;

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  winScreen.classList.add("hidden");

  startTurn();
};

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

function startTurn() {
  clearInterval(timer);

  wordDisplayContainer.innerHTML = "";
  resultsDisplay.classList.add("hidden");
  timerContainer.classList.add("hidden");
  winnerControls.classList.remove("hidden");

  const p = turnOrder[currentTurnIndex];

  currentPlayerDisplay.textContent = `${p.team} Team – ${p.name}`;
  diceResultMessage.textContent = "";

  rollDiceBtn.style.display = "inline-block";
  startRoundBtn.classList.add("hidden");
}

rollDiceBtn.onclick = () => {
  currentDiceRoll =
    DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];

  diceResultMessage.textContent = `Dice Roll: ${currentDiceRoll}`;

  rollDiceBtn.style.display = "none";
  startRoundBtn.classList.remove("hidden");
};

startRoundBtn.onclick = () => {
  startRoundBtn.classList.add("hidden");

  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  const selected = [];

  while (selected.length < MAX_WORDS_PER_ROUND) {
    if (!remainingWords.length) {
      remainingWords = [...usedWords];
      usedWords = [];
    }

    const w = remainingWords.pop();

    if (w !== undefined) {
      usedWords.push(w);
      selected.push(w);
    } else {
      break;
    }
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

      rows.forEach(r => {
        r.querySelector("button").disabled = true;
      });

      endRound(rows);
    }
  }, 1000);
};

function endRound(rows) {
  clearInterval(timer);

  timerContainer.classList.add("hidden");

  const correct = rows.filter(
    r => r.dataset.correct === "true"
  ).length;

  const spaces = Math.max(0, correct - currentDiceRoll);

  const player = turnOrder[currentTurnIndex];

  turnSummary.textContent =
    `Correct: ${correct} | Dice: ${currentDiceRoll} | Move: ${spaces} spaces`;

  nextPlayerDisplay.textContent = "";

  currentTurnIndex =
    (currentTurnIndex + 1) % turnOrder.length;

  const next = turnOrder[currentTurnIndex];

  nextPlayerDisplay.textContent =
    `Next: ${next.team} Team – ${next.name}`;

  resultsDisplay.classList.remove("hidden");
}

nextRoundBtn.onclick = startTurn;

blueWinsBtn.onclick = () => {
  declareWinner("Blue");
};

redWinsBtn.onclick = () => {
  declareWinner("Red");
};

function declareWinner(team) {
  clearInterval(timer);

  resultsDisplay.classList.add("hidden");
  wordDisplayContainer.innerHTML = "";
  timerContainer.classList.add("hidden");

  winnerMessage.textContent = `${team} Team wins! 🎉`;

  winScreen.classList.remove("hidden");
}

restartGameBtn.onclick = () => {
  clearInterval(timer);

  players = [];
  turnOrder = [];
  currentTurnIndex = 0;

  wordPool = {};
  remainingWords = [];
  usedWords = [];

  timeLeft = 30;
  currentDiceRoll = 0;

  timerDisplay.textContent = "30";
  currentPlayerDisplay.textContent = "";
  diceResultMessage.textContent = "";

  wordDisplayContainer.innerHTML = "";

  resultsDisplay.classList.add("hidden");
  timerContainer.classList.add("hidden");
  startRoundBtn.classList.add("hidden");
  winScreen.classList.add("hidden");

  rollDiceBtn.style.display = "inline-block";

  startScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");

  loadChapters();
};

loadChapters();