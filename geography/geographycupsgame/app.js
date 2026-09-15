const COLORS = ["red", "blue", "green", "purple", "orange"];
const STORAGE_PREFIX = "sentence-scramble:";

let chaptersData = [];
let currentChapter = null;
let chapterState = null; // persisted per-chapter progress
let currentSentenceIndex = null;
let currentLayout = null; // { order: [...], colors: [...] }

// ---------- Elements ----------
const screenSelect = document.getElementById("screen-select");
const screenGame = document.getElementById("screen-game");
const chapterGrid = document.getElementById("chapter-grid");
const chapterLabel = document.getElementById("chapter-label");
const progressLabel = document.getElementById("progress-label");
const chunkRow = document.getElementById("chunk-row");
const answerRow = document.getElementById("answer-row");
const btnShowAnswer = document.getElementById("btn-show-answer");
const btnNext = document.getElementById("btn-next");
const btnChangeChapter = document.getElementById("btn-change-chapter");

const timerDisplay = document.getElementById("timer-display");
const btn30 = document.getElementById("btn-30");
const btn60 = document.getElementById("btn-60");
const btnTimerStart = document.getElementById("btn-timer-start");
const btnTimerReset = document.getElementById("btn-timer-reset");

// ---------- Utilities ----------

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isIdentity(order) {
  return order.every((v, i) => v === i);
}

function sameLayout(a, b) {
  if (!a || !b) return false;
  return (
    a.order.length === b.order.length &&
    a.order.every((v, i) => v === b.order[i]) &&
    a.colors.every((v, i) => v === b.colors[i])
  );
}

function loadState(chapterId, sentenceCount) {
  const raw = localStorage.getItem(STORAGE_PREFIX + chapterId);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      /* fall through to fresh state */
    }
  }
  return {
    pointer: 0,
    recycling: false,
    lastRandomIndex: null,
    lastLayouts: {}, // sentenceIndex -> {order, colors}
  };
}

function saveState() {
  if (!currentChapter) return;
  localStorage.setItem(
    STORAGE_PREFIX + currentChapter.id,
    JSON.stringify(chapterState)
  );
}

// ---------- Chapter select ----------

async function init() {
  try {
    const res = await fetch("data/sentences.json");
    const json = await res.json();
    chaptersData = json.chapters || [];
  } catch (e) {
    chapterGrid.innerHTML =
      '<p class="chapter-grid-empty">Could not load data/sentences.json. Make sure it is in the same folder as index.html.</p>';
    return;
  }
  renderChapterGrid();
}

function renderChapterGrid() {
  chapterGrid.innerHTML = "";
  if (chaptersData.length === 0) {
    chapterGrid.innerHTML =
      '<p class="chapter-grid-empty">No chapters found in data/sentences.json yet.</p>';
    return;
  }
  chaptersData.forEach((chapter) => {
    const card = document.createElement("button");
    card.className = "chapter-card";
    card.innerHTML = `<h2>${chapter.name}</h2><p>${chapter.sentences.length} sentences</p>`;
    card.addEventListener("click", () => openChapter(chapter.id));
    chapterGrid.appendChild(card);
  });
}

function openChapter(chapterId) {
  const chapter = chaptersData.find((c) => c.id === chapterId);
  if (!chapter) return;
  currentChapter = chapter;
  chapterState = loadState(chapter.id, chapter.sentences.length);

  chapterLabel.textContent = chapter.name;
  screenSelect.hidden = true;
  screenGame.hidden = false;

  resetTimerToSelected();
  showNextSentence();
}

btnChangeChapter.addEventListener("click", () => {
  stopTimer();
  screenGame.hidden = true;
  screenSelect.hidden = false;
});

// ---------- Sentence display ----------

function pickNextSentenceIndex() {
  const total = currentChapter.sentences.length;

  if (!chapterState.recycling) {
    const idx = chapterState.pointer;
    chapterState.pointer += 1;
    if (chapterState.pointer >= total) {
      chapterState.recycling = true;
    }
    return idx;
  }

  // Recycling: pick a random sentence, avoiding an immediate repeat if possible.
  let idx = Math.floor(Math.random() * total);
  if (total > 1) {
    let attempts = 0;
    while (idx === chapterState.lastRandomIndex && attempts < 20) {
      idx = Math.floor(Math.random() * total);
      attempts += 1;
    }
  }
  chapterState.lastRandomIndex = idx;
  return idx;
}

function generateLayout(sentenceIndex, chunkCount) {
  const lastLayout = chapterState.lastLayouts[sentenceIndex] || null;
  let layout = null;
  let attempts = 0;

  do {
    const order = shuffle([...Array(chunkCount).keys()]);
    const colors = shuffle(COLORS).slice(0, chunkCount);
    layout = { order, colors };
    attempts += 1;
  } while (
    attempts < 40 &&
    (isIdentity(layout.order) || sameLayout(layout, lastLayout))
  );

  chapterState.lastLayouts[sentenceIndex] = layout;
  return layout;
}

function showNextSentence() {
  const total = currentChapter.sentences.length;
  currentSentenceIndex = pickNextSentenceIndex();
  const sentence = currentChapter.sentences[currentSentenceIndex];
  currentLayout = generateLayout(currentSentenceIndex, sentence.chunks.length);
  saveState();

  renderChunks(sentence, currentLayout);
  updateProgressLabel(total);

  answerRow.hidden = true;
  answerRow.innerHTML = "";
  btnShowAnswer.textContent = "Show answer";

  resetTimerToSelected();
}

function renderChunks(sentence, layout) {
  chunkRow.innerHTML = "";
  layout.order.forEach((chunkIdx) => {
    const tile = document.createElement("div");
    tile.className = "chunk-tile";
    tile.dataset.color = layout.colors[chunkIdx];
    tile.textContent = sentence.chunks[chunkIdx];
    chunkRow.appendChild(tile);
  });
}

function updateProgressLabel(total) {
  if (!chapterState.recycling) {
    progressLabel.textContent = `Sentence ${chapterState.pointer} of ${total}`;
  } else {
    progressLabel.textContent = "Recycling — random sentences";
  }
}

btnNext.addEventListener("click", showNextSentence);

btnShowAnswer.addEventListener("click", () => {
  const sentence = currentChapter.sentences[currentSentenceIndex];
  const showing = answerRow.hidden;

  if (showing) {
    renderAnswerChunks(sentence, currentLayout);
  } else {
    answerRow.innerHTML = "";
  }
  answerRow.hidden = !showing;
  btnShowAnswer.textContent = showing ? "Hide answer" : "Show answer";
});

function renderAnswerChunks(sentence, layout) {
  answerRow.innerHTML = "";
  sentence.chunks.forEach((chunkText, chunkIdx) => {
    const tile = document.createElement("div");
    tile.className = "chunk-tile chunk-tile-answer";
    tile.dataset.color = layout.colors[chunkIdx];
    tile.textContent = chunkText;
    answerRow.appendChild(tile);
  });
}

// ---------- Timer ----------

let selectedDuration = 30;
let remainingSeconds = selectedDuration;
let timerHandle = null;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function setDuration(seconds) {
  if (timerHandle) return; // ignore duration changes while running
  selectedDuration = seconds;
  remainingSeconds = seconds;
  btn30.classList.toggle("is-active", seconds === 30);
  btn60.classList.toggle("is-active", seconds === 60);
  timerDisplay.classList.remove("is-done", "is-running");
  updateTimerDisplay();
}

function resetTimerToSelected() {
  stopTimer();
  remainingSeconds = selectedDuration;
  timerDisplay.classList.remove("is-done", "is-running");
  updateTimerDisplay();
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
  timerDisplay.classList.remove("is-running");
}

function startTimer() {
  if (timerHandle || remainingSeconds <= 0) return;
  timerDisplay.classList.remove("is-done");
  timerDisplay.classList.add("is-running");
  timerHandle = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      stopTimer();
      timerDisplay.classList.add("is-done");
      playBeep();
    }
  }, 1000);
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    /* audio not available; fail silently */
  }
}

btn30.addEventListener("click", () => setDuration(30));
btn60.addEventListener("click", () => setDuration(60));
btnTimerStart.addEventListener("click", startTimer);
btnTimerReset.addEventListener("click", resetTimerToSelected);

// ---------- Boot ----------

setDuration(30);
init();