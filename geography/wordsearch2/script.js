```javascript
let gridSize = 10;
let grid = [];
let wordList = [];
let selectedCells = [];
let isSelecting = false;
let placedWords = [];

let roundComplete = false;
let roundScored = false;

let fullWordList = [];
let score = 0;

// ⏱ TIMER
let timeLeft = 0;
let timerInterval = null;

// 🔹 INIT
window.onload = () => {
  init();

  document.getElementById('next-btn').addEventListener('click', () => {
    showResults();
  });
};

async function init() {
  document.getElementById('menu').style.display = 'flex';
  document.getElementById('game').style.display = 'none';
  document.getElementById('results').style.display = 'none';

  showMenu();
}

// 🔹 GRID SETUP
function createEmptyGrid() {
  grid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => '')
  );
}

const directions = [
  [0, 1],
  [1, 0]
];

function isNearbyOccupied(r, c) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;

      if (
        nr >= 0 && nr < gridSize &&
        nc >= 0 && nc < gridSize &&
        grid[nr][nc] !== ''
      ) {
        return true;
      }
    }
  }
  return false;
}

function placeWords() {
  placedWords = [];

  let availableWords = [...wordList];
  let finalWords = [];

  while (availableWords.length > 0) {
    let word = availableWords.shift();

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;

      const dir = directions[Math.floor(Math.random() * directions.length)];
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);

      let fits = true;
      let positions = [];

      for (let i = 0; i < word.length; i++) {
        const r = row + dir[0] * i;
        const c = col + dir[1] * i;

        if (
          r < 0 || r >= gridSize ||
          c < 0 || c >= gridSize ||
          (grid[r][c] && grid[r][c] !== word[i]) ||
          isNearbyOccupied(r, c)
        ) {
          fits = false;
          break;
        }

        positions.push([r, c]);
      }

      if (fits) {
        positions.forEach(([r, c], i) => {
          grid[r][c] = word[i];
        });

        placedWords.push({ word, positions });
        finalWords.push(word);
        placed = true;
      }
    }
  }

  wordList = finalWords;
}

function fillRandom() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!grid[r][c]) {
        grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }
}

// 🔹 RENDER
function renderGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${gridSize}, min(8vw, 40px))`;

  grid.forEach((row, r) => {
    row.forEach((letter, c) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = letter;
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startSelection(e);
      }, { passive: false });

      cell.addEventListener('touchmove', (e) => {
        e.preventDefault();
        moveSelection(e);
      }, { passive: false });

      cell.addEventListener('touchend', (e) => {
        e.preventDefault();
        endSelection(e);
      }, { passive: false });

      cell.addEventListener('mousedown', startSelection);
      cell.addEventListener('mouseenter', moveSelection);
      cell.addEventListener('mouseup', endSelection);

      gridEl.appendChild(cell);
    });
  });

  document.addEventListener('mouseup', endSelection);
}

function renderWordList() {
  const listEl = document.getElementById('word-list');
  listEl.innerHTML = '';

  wordList.forEach(word => {
    const div = document.createElement('div');
    div.className = 'word';
    div.textContent = word;
    div.dataset.word = word;
    listEl.appendChild(div);
  });
}

// 🔹 SELECTION
function startSelection(e) {
  isSelecting = true;
  clearSelection();

  const cell = e.target;
  selectedCells = [cell];
  cell.classList.add('selected');
}

function moveSelection(e) {
  if (!isSelecting) return;

  let el;

  if (e.touches) {
    const touch = e.touches[0];
    el = document.elementFromPoint(touch.clientX, touch.clientY);
  } else {
    el = e.target;
  }

  if (!el || !el.classList.contains('cell')) return;
  if (selectedCells.includes(el)) return;

  if (selectedCells.length >= 2) {
    const [r0, c0] = getPos(selectedCells[0]);
    const [r1, c1] = getPos(selectedCells[1]);
    const [r, c] = getPos(el);

    const dr = r1 - r0;
    const dc = c1 - c0;

    if (dr === 0 && c < c1) return;
    if (dc === 0 && r < r1) return;

    if ((r - r0) * dc !== (c - c0) * dr) return;
  }

  selectedCells.push(el);
  el.classList.add('selected');
}

function endSelection() {
  if (!isSelecting) return;
  isSelecting = false;

  const word = selectedCells.map(c => c.textContent).join('');

  if (wordList.includes(word)) {
    selectedCells.forEach(c => {
      c.classList.remove('selected');
      c.classList.add('found');
    });

    document.querySelector(`[data-word="${word}"]`)
      .classList.add('found-word');

    checkWin();
  } else {
    clearSelection();
  }

  selectedCells = [];
}

// 🔹 WIN / LOSE
function checkWin() {
  const remaining = document.querySelectorAll('#word-list .word:not(.found-word)');

  if (remaining.length === 0) {
    roundComplete = true;
    clearInterval(timerInterval);

    if (!roundScored) {
      const wordScore = wordList.length * 10;
      const timeBonus = timeLeft * 2;
      score += wordScore + timeBonus;
      roundScored = true;
    }

    const btn = document.getElementById('next-btn');
    btn.style.display = 'block';
    btn.textContent = "View Results";
  }
}

function gameOver() {
  roundComplete = false;

  if (!roundScored) {
    const foundCount = document.querySelectorAll('.found-word').length;
    score += foundCount * 10;
    roundScored = true;
  }

  revealMissedWords();

  const btn = document.getElementById('next-btn');
  btn.style.display = 'block';
  btn.textContent = "View Results";
}

// 🔹 MISSED WORDS
function revealMissedWords() {
  const foundWords = Array.from(
    document.querySelectorAll('.found-word')
  ).map(el => el.dataset.word);

  placedWords.forEach(entry => {
    if (!foundWords.includes(entry.word)) {
      entry.positions.forEach(([r, c]) => {
        const cell = document.querySelector(
          `.cell[data-row="${r}"][data-col="${c}"]`
        );
        if (cell) cell.classList.add('missed');
      });

      const wordEl = document.querySelector(`[data-word="${entry.word}"]`);
      if (wordEl) {
        wordEl.style.background = 'red';
        wordEl.style.color = 'white';
      }
    }
  });
}

// 🔹 TIMER
function startTimer() {
  const timerEl = document.getElementById('timer');
  timerEl.style.display = 'block';
  timerEl.textContent = "Time: " + timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = "Time: " + timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameOver();
    }
  }, 1000);
}

// 🔹 MENU / LOAD
async function showMenu() {
  const res = await fetch('./data/chapters.json');
  const data = await res.json();

  const listEl = document.getElementById('chapter-list');
  listEl.innerHTML = '';

  data.chapters.forEach(ch => {
    const btn = document.createElement('div');
    btn.className = 'word';
    btn.textContent = ch.title;

    btn.addEventListener('click', () => loadChapter(ch.id));
    listEl.appendChild(btn);
  });
}

async function loadChapter(id) {
  const res = await fetch(`./data/${id}.json`);
  const data = await res.json();

  document.getElementById('menu').style.display = 'none';
  document.getElementById('game').style.display = 'flex';

  document.getElementById('title').textContent = data.title;

  fullWordList = data.words.map(w => w.toUpperCase());

  let shuffled = [...fullWordList].sort(() => Math.random() - 0.5);
  let count = Math.floor(Math.random() * 3) + 5;
  wordList = shuffled.slice(0, count);

  let longestWord = Math.max(...wordList.map(w => w.length));
  gridSize = Math.max(10, longestWord + 2);

  score = 0;
  roundScored = false;

  createEmptyGrid();
  placeWords();
  fillRandom();
  renderGrid();
  renderWordList();

  timeLeft = 120;
  startTimer();
}

// 🔹 RESULTS
function showResults() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('results').style.display = 'flex';

  const now = new Date();
  const timeString = now.toLocaleString();

  document.getElementById('final-score').textContent =
    `Score: ${score} | ${timeString}`;
}

function showMenuScreen() {
  clearInterval(timerInterval);

  document.getElementById('menu').style.display = 'flex';
  document.getElementById('game').style.display = 'none';
  document.getElementById('results').style.display = 'none';
}

// 🔹 HELPERS
function clearSelection() {
  document.querySelectorAll('.selected')
    .forEach(c => c.classList.remove('selected'));
}

function getPos(cell) {
  return [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
}
```
