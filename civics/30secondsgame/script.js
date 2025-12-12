// Variables for team and game setup
let teams = null; // Array to hold team/player data
let currentTeamIndex = 0; // Tracks which team's turn it is
let currentPlayerIndex = 0; // Tracks which player on the current team is up
let wordPool = {}; // The full word pool from the JSON file
let remainingWords = []; // Words currently left to show
let incorrectWords = []; // Words marked as incorrect
let correctWords = []; // Words marked as correct
let timer = null; // Timer reference for the round
let timeLeft = 30; // 30-second timer for each round

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

// **1. Load chapters from JSON and render checkboxes**
async function loadChapters() {
  try {
    const response = await fetch("chapters.json"); // Fetch the JSON file
    if (!response.ok) {
      throw new Error(`HTTP Error! status: ${response.status}`);
    }
    const data = await response.json(); // Parse JSON data
    wordPool = data;

    // Dynamically render chapter checkboxes
    for (const chapter in data) {
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
  } catch (err) {
    alert("Failed to load chapters. Please refresh the page.");
    console.error("Error loading chapters:", err);
  }
}

// **2. Setup the game when the form is submitted**
setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Capture player names
  teams = [
    {
      name: "Blue Team",
      players: [
        document.getElementById("blue-team-player-1").value.trim(),
        document.getElementById("blue-team-player-2").value.trim()
      ],
      score: 0
    },
    {
      name: "Red Team",
      players: [
        document.getElementById("red-team-player-1").value.trim(),
        document.getElementById("red-team-player-2").value.trim()
      ],
      score: 0
    }
  ];

  // Validate that all names are entered
  if (
    teams.some((team) =>
      team.players.some((player) => player === "")
    )
  ) {
    alert("Please enter names for all players.");
    return;
  }

  // Build the word list based on selected chapters
  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => wordPool[input.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  remainingWords = selectedChapters.flat(); // Flatten chapter arrays into a single pool of words
  startScreen.classList.add("hidden"); // Hide the start screen
  gameScreen.classList.remove("hidden"); // Show the game screen

  startTurn(); // Begin the first turn
});

// **3. Starts the turn for the current player**
function startTurn() {
  clearInterval(timer); // Clear previous timer

  const currentTeam = teams[currentTeamIndex];
  const currentPlayer = currentTeam.players[currentPlayerIndex];

  // Reset UI elements
  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;
  wordDisplay.textContent = "Roll the Dice";
  diceResultMessage.textContent = "";
  rollDiceBtn.disabled = false; // Enable the dice roll button
  resultsDisplay.classList.add("hidden"); // Hide results
  answerButtons.classList.add("hidden"); // Hide answer buttons
  startRoundBtn.classList.add("hidden"); // Hide start round button

  correctWords = []; // Reset correct words list for this turn
}

// **4. Roll the dice and begin the round**
rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];

  // Show dice result
  diceResultMessage.textContent = `Dice roll: ${diceRoll}`;
  rollDiceBtn.disabled = true; // Disable dice roll button
  startRoundBtn.classList.remove("hidden"); // Enable "Start Round" button
});

// **5. Start the round (30-second timer)**
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden"); // Hide the button
  answerButtons.classList.remove("hidden"); // Show answer buttons
  timeLeft = 30; // Reset timer
  timerDisplay.textContent = timeLeft;

  // Start the timer countdown
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endTurn(); // End the turn
    }
  }, 1000);

  showNextWord(); // Display the first word
});

// **6. Show the next word**
function showNextWord() {
  if (remainingWords.length > 0) {
    const wordIndex = Math.floor(Math.random() * remainingWords.length);
    const word = remainingWords.splice(wordIndex, 1)[0];
    wordDisplay.textContent = word;
  } else if (incorrectWords.length > 0) {
    remainingWords = [...incorrectWords]; // Reuse incorrect words
    incorrectWords = [];
    showNextWord();
  } else if (correctWords.length > 0) {
    remainingWords = [...correctWords]; // Reuse correct words
    correctWords = [];
    showNextWord();
  } else {
    wordDisplay.textContent = "No more words available.";
    correctBtn.disabled = true;
    incorrectBtn.disabled = true;
  }
}

// **7. Handle correct/incorrect answers**
correctBtn.addEventListener("click", () => {
  correctWords.push(wordDisplay.textContent); // Mark word as correct
  showNextWord();
});

incorrectBtn.addEventListener("click", () => {
  incorrectWords.push(wordDisplay.textContent); // Mark word as incorrect
  showNextWord();
});

// **8. End the turn**
function endTurn() {
  const currentTeam = teams[currentTeamIndex];
  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10); // Extract dice value
  const spacesToMove = correctWords.length - diceRoll;

  currentTeam.score += spacesToMove; // Update score

  // Display turn summary
  turnSummary.textContent = `${currentTeam.players[currentPlayerIndex]} (${currentTeam.name}): 
    Correct Guesses: ${correctWords.length} | Dice Roll: ${diceRoll} | Spaces to Move: ${spacesToMove}`;
  nextPlayerDisplay.textContent = `Next Player: ${
    teams[(currentTeamIndex + 1) % teams.length].players[
      (currentPlayerIndex + 1) % 2
    ]
  }`;

  resultsDisplay.classList.remove("hidden"); // Show results summary

  // Update indices for next turn
  currentPlayerIndex =
    currentPlayerIndex + 1 === teams[currentTeamIndex].players.length
      ? 0
      : currentPlayerIndex + 1;
  currentTeamIndex =
    currentTeamIndex + 1 === teams.length ? 0 : currentTeamIndex + 1;

  setTimeout(startTurn, 5000); // Wait 5 seconds, then start next turn
);

// Load chapters on initial page load
loadChapters();
