// =====================
// GAME STATE
// =====================
let wordPool = {};
let remainingWords = [];

let currentRound = 1;
let roundScore = 0;

let round1Score = 0;
let round2Score = 0;

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

const roundScoreDisplay = document.getElementById("round-score");

const reviewScreen = document.getElementById("review-screen");
const reviewScore = document.getElementById("review-score");
const reviewOkBtn = document.getElementById("review-ok-btn");

const finalReview = document.getElementById("final-review");
const finalR1 = document.getElementById("final-r1");
const finalR2 = document.getElementById("final-r2");

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
// SETUP
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

  currentRound = 1;
  round1Score = 0;
  round2Score = 0;

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  showReadyScreen();
});

// =====================
// READY SCREEN
// =====================
function showReadyScreen() {
  wordDisplayContainer.innerHTML = "";
  reviewScreen.classList.add("hidden");
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
  roundScore = 0;
  roundScoreDisplay.textContent = "0";

  timeLeft = 30;
  timerDisplay.textContent = timeLeft;
  timerContainer.classList.remove("hidden");

  shuffleArray(remainingWords);
  const roundWords = remainingWords.splice(0, MAX_WORDS_PER_ROUND);

  wordDisplayContainer.innerHTML = "";

  roundWords.forEach(word => {
    const row = document.createElement("div");
    row.className = "word-row";

    const text = document.createElement("span");
    text.textContent = word;

    const btn = document.createElement("button");
    btn.textContent = "Correct";

    btn.onclick = () => {
      if (btn.disabled) return;
      btn.disabled = true;

      roundScore++;
      roundScoreDisplay.textContent = roundScore;
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
    round1Score = roundScore;
  } else {
    round2Score = roundScore;
  }

  reviewScore.textContent = roundScore;
  reviewScreen.classList.remove("hidden");
}

// =====================
// REVIEW OK
// =====================
reviewOkBtn.addEventListener("click", () => {
  reviewScreen.classList.add("hidden");

  if (currentRound === 1) {
    currentRound = 2;
    showReadyScreen();
  } else {
    showFinalReview();
  }
});

// =====================
// FINAL REVIEW
// =====================
function showFinalReview() {
  finalR1.textContent = round1Score;
  finalR2.textContent = round2Score;

  finalReview.classList.remove("hidden");
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
