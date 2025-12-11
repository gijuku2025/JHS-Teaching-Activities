// Variables
let chapters = {}; // Holds chapter data
let selectedWords = [];
let originalWordPool = []; // Stores all the original words
let incorrectWords = []; // Stores incorrect words for retrying
let score = 0;
let timeLeft = 60;
let gameTimer; // Timer reference

// DOM Elements
const chapterScreen = document.getElementById("chapter-screen");
const chapterForm = document.getElementById("chapter-form");
const gameScreen = document.getElementById("game");
const wordDisplay = document.getElementById("word-display");
const correctBtn = document.getElementById("correct-btn");
const incorrectBtn = document.getElementById("incorrect-btn");
const timerDisplay = document.getElementById("time");
const currentScore = document.getElementById("current-score");

// Load chapters from JSON file
async function loadChapters() {
  try {
    const response = await fetch("chapters.json");
    const data = await response.json();
    chapters = data;
    renderChapterSelection();
  } catch (err) {
    console.error("Error loading chapters:", err);
    alert("Failed to load chapter data. Please check your setup.");
  }
}

// Render chapter checkboxes dynamically
function renderChapterSelection() {
  Object.keys(chapters).forEach((chapterKey) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${chapterKey}" /> 
      ${chapterKey.replace("chapter", "Chapter ")}<br>`;
    chapterForm.appendChild(label);
  });

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  chapterForm.appendChild(startButton);

  chapterForm.addEventListener("submit", onStartGame);
}

// Start game logic
function onStartGame(event) {
  event.preventDefault();

  // Get the selected chapters
  const selectedChapters = Array.from(chapterForm.elements)
    .filter((input) => input.checked)
    .map((input) => input.value);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  // Build the word pool
  selectedWords = selectedChapters.flatMap((chapter) => chapters[chapter]);
  originalWordPool = [...selectedWords]; // Save copy of original words
  incorrectWords = []; // Reset incorrect words from previous games

  // Switch to the game screen
  chapterScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  startGame();
}

// Display the next word
function displayNextWord() {
  if (selectedWords.length > 0) {
    // Show a new word from the main word pool
    const randomIndex = Math.floor(Math.random() * selectedWords.length);
    const word = selectedWords.splice(randomIndex, 1)[0];
    wordDisplay.textContent = word;
  } else if (incorrectWords.length > 0) {
    // Switch to showing words the player got wrong
    const word = incorrectWords.shift(); // Take the first word
    wordDisplay.textContent = word;
  } else {
    // If no words left at all
    wordDisplay.textContent = "All words exhausted!";
  }
}

// Start the game timer
function startGame() {
  score = 0;
  timeLeft = 60;
  currentScore.textContent = score;

  gameTimer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  displayNextWord();
}

// End the game
function endGame() {
  clearInterval(gameTimer);
  wordDisplay.textContent = `Time's up! Final Score: ${score}`;
  correctBtn.disabled = true;
  incorrectBtn.disabled = true;
}

// Button click handlers
correctBtn.addEventListener("click", () => {
  score++;
  currentScore.textContent = score;
  displayNextWord(); // Move to the next word
});

incorrectBtn.addEventListener("click", () => {
  // Add the current word to the incorrectWords array
  if (!selectedWords.length && wordDisplay.textContent !== "All words exhausted!") {
    incorrectWords.push(wordDisplay.textContent);
  }

  displayNextWord(); // Move to the next word
});

// Load chapters on startup
loadChapters();
