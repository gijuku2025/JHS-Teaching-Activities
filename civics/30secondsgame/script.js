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

// NEW ELEMENT (must exist in HTML): <button id="next-round-btn" class="hidden">Next Round</button>
const nextRoundBtn = document.getElementById("next-round-btn");

const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1];

async function loadChapters() {
  try {
    const response = await fetch("chapters.json");
    if (!response.ok) throw new Error("Failed to load chapters");

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
  } catch (err) {
    alert("Failed to load chapters.");
  }
}

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

  if (teams.some((team) => team.players.some((p) => p === ""))) {
    alert("Please enter names for all players.");
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

function startTurn() {
  clearInterval(timer);

  const currentTeam = teams[currentTeamIndex];
  const currentPlayer = currentTeam.players[currentPlayerIndex];

  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;
  wordDisplayContainer.innerHTML = "";
  diceResultMessage.textContent = "";
  rollDiceBtn.disabled = false;

  resultsDisplay.classList.add("hidden");
  startRoundBtn.classList.add("hidden");
  nextRoundBtn.classList.add("hidden"); // Hide next-round button

  timerDisplay.classList.add("hidden"); // Hide timer outside the round
}

rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${diceRoll}`;
  rollDiceBtn.disabled = true;
  startRoundBtn.classList.remove("hidden");
});

startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden");
  timeLeft = 30;

  timerDisplay.textContent = timeLeft;
  timerDisplay.classList.remove("hidden"); // Show timer only now

  let selectedWords = [];
  for (let i = 0; i < MAX_WORDS_PER_ROUND; i++) {
    if (remainingWords.length === 0) {
      if (incorrectWords.length) {
        remainingWords = [...incorrectWords];
        incorrectWords = [];
      } else {
        remainingWords = [...allWords];
      }
      shuffleArray(remainingWords);
    }
    selectedWords.push(remainingWords.pop());
  }

  let roundWords = [];
  wordDisplayContainer.innerHTML = "";

  for (const word of selectedWords) {
    const wordRow = document.createElement("div");
    wordRow.classList.add("word-row");

    const wordText = document.createElement("span");
    wordText.textContent = word;
    wordText.classList.add("word-text");

    const correctButton = document.createElement("button");
    correctButton.textContent = "Correct";

    correctButton.addEventListener("click", () => {
      correctButton.disabled = true;
      wordRow.dataset.correct = "true";
      checkForRoundCompletion(roundWords);
    });

    wordRow.appendChild(wordText);
    wordRow.appendChild(correctButton);
    wordDisplayContainer.appendChild(wordRow);

    roundWords.push(wordRow);
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

function checkForRoundCompletion(roundWords) {
  const allMarked = roundWords.every((row) => row.dataset.correct === "true");

  if (allMarked) {
    clearInterval(timer);
    endRound(roundWords);
  }
}

function endRound(roundWords) {
  let correctCount = 0;

  roundWords.forEach((wordRow) => {
    const isCorrect = wordRow.dataset.correct === "true";
    const wordText = wordRow.querySelector(".word-text").textContent;

    if (isCorrect) {
      correctCount++;
    } else {
      incorrectWords.push(wordText);
    }
  });

  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10);
  const spacesToMove = correctCount - diceRoll;

  const currentTeam = teams[currentTeamIndex];
  currentTeam.score += spacesToMove;

  turnSummary.textContent = `Correct: ${correctCount} | Dice Roll: ${diceRoll} | Spaces Moved: ${spacesToMove}`;

  nextPlayerDisplay.textContent = `Next Player: ${
    teams[(currentTeamIndex + 1) % teams.length].players[
      (currentPlayerIndex + 1) % 2
    ]
  }`;

  timerDisplay.classList.add("hidden"); // Hide timer after round

  resultsDisplay.classList.remove("hidden");
  nextRoundBtn.classList.remove("hidden"); // Show next-round button

  // DO NOT auto-start the next turn anymore.
}

// User presses button → next turn begins
nextRoundBtn.addEventListener("click", () => {
  currentPlayerIndex =
    currentPlayerIndex + 1 === teams[currentTeamIndex].players.length
      ? 0
      : currentPlayerIndex + 1;

  currentTeamIndex = currentTeamIndex + 1 === teams.length ? 0 : currentTeamIndex + 1;

  startTurn();
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

loadChapters();
