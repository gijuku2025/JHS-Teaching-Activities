// Variables
let chapters = {}; // Will hold the chapter word lists
let selectedWords = [];
let score = 0;
let timeLeft = 60;

// DOM Elements
const chapterScreen = document.getElementById("chapter-screen");
const chapterForm = document.getElementById("chapter-form");
const gameScreen = document.getElementById("game");
const wordDisplay = document.getElementById("word-display");
const correctBtn = document.getElementById("correct-btn");
const incorrectBtn = document.getElementById("incorrect-btn");
const timerDisplay = document.getElementById("time");
const currentScore = document.getElementById("current-score");

// Fetch chapters dynamically from chapters.json
async function loadChapters() {
  try {
    const response = await fetch("chapters.json");
    chapters = await response.json();
    renderChapterSelection();
  } catch (err) {
    console.error("Failed to load chapters:", err);
    alert("Error loading chapter data. Please try again later.");
  }
}

// Render chapters as checkboxes
function renderChapterSelection() {
  Object.keys(chapters).forEach((chapterKey) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${chapterKey}" /> 
      ${chapterKey.replace("chapter", "Chapter ")}<br>
    `;
    chapterForm.appendChild(label);
  });

  // Add start button
  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  chapterForm.appendChild(startButton);

  chapterForm.addEventListener("submit", onStartGame);
}

// Start Game
function onStartGame(event) {
  event.preventDefault();

  // Get selected chapters
  const selectedChapters = Array.from(chapterForm.elements)
    .filter((input) => input.checked)
    .map((input) => input.value);

  if (selectedChapters.length === 0) {
    alert("Please select at least one chapter.");
    return;
  }

  // Collect words from selected chapters
  selectedWords = selectedChapters.flatMap((chapter) => chapters[chapter]);

  // Hide chapter screen and show game screen
  chapterScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  startTimer();
  displayNextWord();
}

// Display the next word
function displayNextWord() {
  if (selectedWords.length === 0) {
    wordDisplay.textContent = "No more words!";
    endGame();
    return;
  }

  const randomIndex = Math.floor(Math.random() * selectedWords.length);
  const word = selectedWords.splice(randomIndex, 1)[0];
  wordDisplay.textContent = word;
}

// Timer
function startTimer() {
  const timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

// End Game
function endGame() {
  wordDisplay.textContent = `Time's up! Final Score: ${score}`;
  correctBtn.disabled = true;
  incorrectBtn.disabled = true;
}

// Buttons: Correct / Incorrect
correctBtn.addEventListener("click", () => {
  score++;
  currentScore.textContent = score;
  displayNextWord();
});

incorrectBtn.addEventListener("click", displayNextWord);

// Load chapters when the page loads
loadChapters();