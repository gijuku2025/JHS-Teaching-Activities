// Variables for team and game setup
let teams; // Array to hold team/player data
let currentTeamIndex = 0; // Tracks which team's turn it is
let currentPlayerIndex = 0; // Tracks which player on the current team is up
let wordPool = []; // Master list of words (selected chapters)
let remainingWords = []; // Words currently left to show
let incorrectWords = []; // Words marked as incorrect
let correctWords = []; // Words marked as correct
let timer; // Store interval for the turn timer
let timeLeft = 30; // 30 seconds timer

// DOM Elements
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");
const wordDisplay = document.getElementById("word-display");
const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");
const correctBtn = document.getElementById("correct-btn");
const incorrectBtn = document.getElementById("incorrect-btn");
const answerButtons = document.getElementById("answer-buttons");
const timerDisplay = document.getElementById("time-left");
const diceResultMessage = document.getElementById("dice-result-message");
const currentPlayerDisplay = document.getElementById("current-player");
const resultsDisplay = document.getElementById("results");
const turnSummary = document.getElementById("turn-summary");
const nextPlayerDisplay = document.getElementById("next-player");

// Constants
const DICE_RESULTS = [0, 1]; // Dice can roll 0 or 1

// Load chapter info from JSON
async function loadChapters() {
  try {
    const response = await fetch("chapters.json");
    const data = await response.json();

    // Dynamically render chapter checkboxes on the setup screen
    for (let chapter in data) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = chapter;
      checkbox.id = chapter;

      const label = document.createElement("label");
      label.setAttribute("for", chapter);
      label.textContent = chapter.replace("chapter", "Chapter ");

      chapterSelection.appendChild(checkbox);
      chapterSelection.appendChild(label);
      chapterSelection.appendChild(document.createElement("br"));
    }

    wordPool = data; // Store the full word pool
  } catch (err) {
    alert("Failed to load chapters. Please refresh the page.");
    console.error(err);
  }
}

// Start the game after setup
setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Capture player names
  teams = [
    {
      name: "Blue Team",
      players: [
        document.getElementById("blue-team-player-1").value,
        document.getElementById("blue-team-player-2").value
      ],
      score: 0
    },
    {
      name: "Red Team",
      players: [
        document.getElementById("red-team-player-1").value,
        document.getElementById("red-team-player-2").value
      ],
      score: 0
    }
  ];

  // Build the word list based on selected chapters
  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => wordPool[input.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  remainingWords = selectedChapters.flat(); // Flatten the selected chapters into the remainingWords array
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTurn();
});

// Start a turn for the current player
function startTurn() {
  // Determine the current player
  const currentTeam = teams[currentTeamIndex];
  const currentPlayer =
    currentTeam.players[currentPlayerIndex];

  // Update display for the current player's turn
  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;
  wordDisplay.textContent = "Roll the Dice";
  diceResultMessage.textContent = "";
  rollDiceBtn.disabled = false;
  resultsDisplay.classList.add("hidden");
  answerButtons.classList.add("hidden");
  startRoundBtn.classList.add("hidden");
}

// Roll the dice
rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];

  // Notify dice result
  diceResultMessage.textContent = `Dice roll: ${diceRoll}`;
  rollDiceBtn.disabled = true;
  startRoundBtn.classList.remove("hidden"); // Allow round to start now
});

// Start the round
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden");
  answerButtons.classList.remove("hidden");
  resultsDisplay.classList.add("hidden");
  timeLeft = 30;
  timerDisplay.textContent = timeLeft;

  // Start the 30-second timer
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer); // Stop the timer
      endTurn(); // Move to end-of-turn logic
    }
  }, 1000);

  showNextWord(); // Display the first word
});

// Show the next word
function showNextWord() {
  if (remainingWords.length > 0) {
    const wordIndex = Math.floor(Math.random() * remainingWords.length);
    const word = remainingWords.splice(wordIndex, 1)[0]; // Remove from the pool
    wordDisplay.textContent = word;
  } else if (incorrectWords.length > 0) {
    // Shuffle and reuse incorrect words when the pool is empty
    remainingWords = [...incorrectWords];
    incorrectWords = [];
    showNextWord();
  } else {
    // Cycle through previously correct words if incorrect words are done
    remainingWords = [...correctWords];
    correctWords = [];
    showNextWord();
  }
}

// Correct guess
correctBtn.addEventListener("click", () => {
  correctWords.push(wordDisplay.textContent);
  showNextWord();
});

// Incorrect guess
incorrectBtn.addEventListener("click", () => {
  incorrectWords.push(wordDisplay.textContent);
  showNextWord();
});

// End the turn
function endTurn() {
  const currentTeam = teams[currentTeamIndex];
  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10); // Extract dice roll
  const spacesToMove = correctWords.length - diceRoll;

  // Update scores
  currentTeam.score += spacesToMove;

  // Display turn summary
  turnSummary.textContent = `${
    currentTeam.players[currentPlayerIndex]
  } (${currentTeam.name})\nCorrect: ${
    correctWords.length
  } | Dice Roll: ${diceRoll} | Spaces to Move: ${spacesToMove}`;
  nextPlayerDisplay.textContent = `Next Player: ${
    teams[(currentTeamIndex + 1) % teams.length].players[
      (currentPlayerIndex + 1) % 2
    ]
  }`;

  resultsDisplay.classList.remove("hidden");

  // Reset for the next player
  currentPlayerIndex =
    currentPlayerIndex + 1 === currentTeam.players.length
      ? 0
      : currentPlayerIndex + 1; // Alternate between players
  currentTeamIndex =
    currentTeamIndex + 1 === teams.length ? 0 : currentTeamIndex + 1;

  correctWords = []; // Reset correct words
  setTimeout(startTurn, 5000); // Wait 5 seconds before switching turns
});

// Start loading the game
loadChapters();