// =====================
// GAME STATE
// =====================
let wordPool = {};
let remainingWords = [];
let incorrectWords = [];

let currentRound = 1; // 1 or 2
let totalCorrect = 0;

let timer = null;
let timeLeft = 30;

const MAX_WORDS_PER_ROUND = 5;

// =====================
// DOM ELEMENTS
// =====================
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const chapterSelection = document.getElementById("chapter-selection");

const gameScreen = document.getElementById("game-screen");
const readyScreen = document.getElementById("ready-screen");
const readyText = document.getElementById("ready-text");

const startRoundBtn = document.getElementById("start-round-btn");

const timerContainer = document.getElementById("timer-container");
const timerDisplay = document.getElementById("time-left");

const wordDisplayContainer = document.getElementById("word-display-container");

const totalCorrectDisplay = document.getElementById("total-correct");

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
// SETUP GAME
// =====================
setupForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const selectedChapters = Array.from(
    chapterSelection.querySelectorAll("input[type='checkbox']:checked")
  ).map(cb => wordPool[cb.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  remainingWords = [...new Set(selectedChapters.flat())];
  incorrectWords = [];
  totalCorrect = 0;
  currentRound = 1;

  totalCorrectDisplay.textContent = "0";

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  showReadyScreen();
});

// =====================
// READY SCREEN
// =====================
function showReadyScreen() {
  wordDisplayContainer.innerHTML = "";
  timerContainer.classList.add("hidden");

  readyText.textContent =
    currentRound === 1 ? "Ready Player 1" : "Ready Player 2";

  readyScreen.classList.remove("hidden");
}

// =====================
// START ROUND
// =====================
startRoundBtn.addEventListener("click", () => {
  readyScreen.classList.add("hidden");
  startRound();
});

function startRound() {
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  const selectedWords = [];
  const used = new Set();

  while (selectedWords.length < MAX_WORDS_PER_ROUND) {
    if (remainingWords.length === 0) {
      remainingWords = [...new Set(incorrectWords)];
      incorrectWords = [];
      shuffleArray(remainingWords);
    }

    const word = remainingWords.pop();
    if (!used.has(word)) {
      used.add(word);
      selectedWords.push(word);
    }
  }

  wordDisplayContainer.innerHTML = "";

  selectedWords.forEach(word => {
    const row = document.createElement("div");
    row.className = "word-row";

    const text = document.createElement("span");
    text.textContent = word;

    const btn = document.createElement("button");
    btn.textContent = "Correct";

    btn.onclick = () => {
      if (btn.disabled) return;
      btn.disabled = true;

      totalCorrect++;
      totalCorrectDisplay.textContent = totalCorrect;
    };

    row.appendChild(text);
    row.appendChild(btn);
    wordDisplayContainer.appendChild(row);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endRound();
    }
  }, 1000);
}

// =====================
// END ROUND
// =====================
function endRound() {
  timerContainer.classList.add("hidden");

  if (currentRound === 1) {
    currentRound = 2;
    showReadyScreen();
  } else {
    showGameOver();
  }
}

// =====================
// GAME OVER
// =====================
function showGameOver() {
  wordDisplayContainer.innerHTML = `
    <div class="times-up-message">
      🎉 Game Over<br>
      Total Correct: ${totalCorrect}
    </div>
  `;
}

// =====================
// UTIL
// =====================
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

loadChapters();
