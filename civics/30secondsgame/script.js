// Variables for team and game setup
let teams = null; // Array to hold team/player data
let currentTeamIndex = 0; // Tracks which team's turn it is
let currentPlayerIndex = 0; // Tracks which player on the current team is up
let wordPool = {}; // Full word pool from the chapters.json JSON file
let remainingWords = []; // Words left to show for rounds
let incorrectWords = []; // Words marked as incorrect
let allWords = []; // Combined pool of all words
let timer = null; // Timer reference for each round
let timeLeft = 30; // 30-second timer for each round

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

// Constants
const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0, 1]; // Dice can roll either 0 or 1

/*** LOAD CHAPTERS FROM JSON AND RENDER CHECKBOXES ***/
async function loadChapters() {
  console.log("Loading chapters..."); // Debugging
  try {
    const response = await fetch("chapters.json");
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters.json. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Parsed JSON data:", data);
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

      const wrapper = document.createElement("div");
      wrapper.classList.add("checkbox-item");
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      chapterSelection.appendChild(wrapper);
    }
    console.log("Chapters successfully rendered!");
  } catch (err) {
    alert("Failed to load chapters. Please refresh the page.");
    console.error("Error loading chapters:", err);
  }
}

/*** SETUP GAME WHEN THE FORM IS SUBMITTED ***/
setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  // Capture player names
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

  // Validate player names
  if (teams.some((team) => team.players.some((player) => player === ""))) {
    alert("Please enter names for all players.");
    return;
  }

  // Get selected chapters
  const selectedChapters = Array.from(
    setupForm.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => wordPool[input.value]);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  // Initialize the word pool and reset variables
  remainingWords = selectedChapters.flat();
  allWords = [...remainingWords]; // Save all words in the "allWords" array
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startTurn(); // Begin the first turn
});

/*** START THE CURRENT PLAYER'S TURN ***/
function startTurn() {
  clearInterval(timer); // Clear any previous timers

  const currentTeam = teams[currentTeamIndex];
  const currentPlayer = currentTeam.players[currentPlayerIndex];

  // Update UI for current turn
  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;
  wordDisplayContainer.innerHTML = ""; // Clear previous round's words
  diceResultMessage.textContent = "";
  rollDiceBtn.disabled = false; // Enable dice rolling
  resultsDisplay.classList.add("hidden"); // Hide results section
  startRoundBtn.classList.add("hidden"); // Initially hide start round button

  console.log(`It's ${currentPlayer} (${currentTeam.name})'s turn!`);
}

/*** HANDLE DICE ROLL ***/
rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${diceRoll}`;
  rollDiceBtn.disabled = true; // Disable the dice roll
  startRoundBtn.classList.remove("hidden"); // Show the Start Round button
});

/*** START THE ROUND (TIMER & WORD DISPLAY) ***/
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden");
  timeLeft = 30; // Reset timer
  timerDisplay.textContent = timeLeft;

  // Select 5 words for the round
  let roundWords =
