// Variables for team and game setup
let teams = null; // Array to hold team/player data
let currentTeamIndex = 0; // Tracks which team's turn it is
let currentPlayerIndex = 0; // Tracks which player on the current team is up
let wordPool = {}; // Full word pool from the JSON file
let remainingWords = []; // Words left to show for rounds
let incorrectWords = []; // Words marked as incorrect
let allWords = []; // Combined pool of all correct and incorrect words
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
const DICE_RESULTS = [0, 1]; // Dice can roll 0 or 1

// **1. Load Chapters from JSON and Render Checkboxes**
async function loadChapters() {
  console.log("Loading chapters..."); // Debugging
  try {
    const response = await fetch("chapters.json"); // Fetch JSON file
    if (!response.ok) {
      throw new Error(`Failed to fetch chapters.json. Status: ${response.status}`);
    }

    const data = await response.json(); // Parse JSON data
    console.log("Parsed JSON data:", data); // Debugging
    wordPool = data;

    // Dynamically render chapter checkboxes as a clean vertical list
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

// **2. Set up the game when the form is submitted**
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
  startScreen.classList.add("hidden"); // Hide start screen
  gameScreen.classList.remove("hidden"); // Show game screen

  startTurn(); // Begin the first turn
});

// **3. Start the current player's turn**
function startTurn() {
  clearInterval(timer); // Clear any previous timers

  const currentTeam = teams[currentTeamIndex];
  const currentPlayer = currentTeam.players[currentPlayerIndex];

  // Update the UI to show the current player's turn
  currentPlayerDisplay.textContent = `${currentPlayer} (${currentTeam.name})`;
  wordDisplayContainer.innerHTML = ""; // Clear previous round's words
  diceResultMessage.textContent = "";
  rollDiceBtn.disabled = false; // Enable the dice roll button
  resultsDisplay.classList.add("hidden"); // Hide results display
  startRoundBtn.classList.add("hidden"); // Hide "Start Round" button

  console.log(`It's ${currentPlayer} (${currentTeam.name})'s turn!`); // Debugging
}

// **4. Roll the dice and prepare the round**
rollDiceBtn.addEventListener("click", () => {
  const diceRoll = DICE_RESULTS[Math.floor(Math.random() * DICE_RESULTS.length)];
  diceResultMessage.textContent = `Dice Roll: ${diceRoll}`;
  rollDiceBtn.disabled = true; // Disable the dice roll
  startRoundBtn.classList.remove("hidden"); // Show "Start Round" button
});

// **5. Start a round (display 5 words and track guesses)**
startRoundBtn.addEventListener("click", () => {
  startRoundBtn.classList.add("hidden"); // Hide the button
  timeLeft = 30; // Reset timer
  timerDisplay.textContent = timeLeft;

  // Select exactly 5 words from the remainingWords pool
  let roundWords = [];
  for (let i = 0; i < MAX_WORDS_PER_ROUND; i++) {
    if (remainingWords.length === 0) {
      // Refill remainingWords if empty
      if (incorrectWords.length > 0) {
        remainingWords = [...incorrectWords];
        incorrectWords = [];
      } else {
        remainingWords = [...allWords]; // Recycle all words if all are empty
      }
      shuffleArray(remainingWords); // Shuffle the pool
    }
    // Pull one word and remove it from the pool
    roundWords.push(remainingWords.pop());
  }

  // Render each word in the UI
  for (const word of roundWords) {
    const wordRow = document.createElement("div");
    wordRow.classList.add("word-row");

    const wordText = document.createElement("span");
    wordText.textContent = word;

    const correctButton = document.createElement("button");
    correctButton.textContent = "Correct";
    correctButton.addEventListener("click", () => {
      correctButton.disabled = true; // Disable button after clicking
      wordRow.dataset.correct = true; // Mark the word as correct
    });

    wordRow.appendChild(wordText);
    wordRow.appendChild(correctButton);
    wordDisplayContainer.appendChild(wordRow);
  }

  // Start the round timer
  timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer); // Stop the timer
      endRound(roundWords); // Calculate results for the round
    }
  }, 1000);
});

// **6. End the round and calculate results**
function endRound(words) {
  let correctCount = 0;

  // Loop through words and count correct guesses
  words.forEach((wordRow) => {
    const isCorrect = wordRow.dataset.correct === "true";
    if (isCorrect) {
      correctCount++;
    } else {
      incorrectWords.push(wordRow.textContent); // Add to incorrect list
    }
  });

  const diceRoll = parseInt(diceResultMessage.textContent.match(/\d+/)[0], 10); // Extract dice roll
  const spacesToMove = correctCount - diceRoll;

  // Update the current team's score
  const currentTeam = teams[currentTeamIndex];
  currentTeam.score += spacesToMove;

  // Display turn summary
  turnSummary.textContent = `Correct: ${correctCount} | Dice Roll: ${diceRoll} | Spaces Moved: ${spacesToMove}`;
  nextPlayerDisplay.textContent = `Next Player: ${
    teams[(currentTeamIndex + 1) % teams.length].players[
      (currentPlayerIndex + 1) % 2
    ]
  }`;

  resultsDisplay.classList.remove("hidden"); // Show results

  // Advance turn: Update player/team indices
  currentPlayerIndex =
    currentPlayerIndex + 1 === currentTeam.players.length
      ? 0
      : currentPlayerIndex + 1;
  currentTeamIndex =
    currentTeamIndex + 1 === teams.length ? 0 : currentTeamIndex + 1;

  setTimeout(startTurn, 5000); // Wait and move to next turn
});

// **Utility Function: Shuffle an array**
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Load chapters on page load
loadChapters();
