const COLORS = ["orange", "yellow", "teal", "pink", "lime"];
const ROUNDS = [
  { label: "Round 1", seconds: 60 },
  { label: "Round 2", seconds: 45 },
  { label: "Round 3", seconds: 30 },
];

let allChapters = [];
let selectedChapterKeys = new Set();
let studentName = "";
let session = null;

// ---------- Elements ----------
const screenName = document.getElementById("screen-name");
const screenChapters = document.getElementById("screen-chapters");
const screenPlay = document.getElementById("screen-play");
const screenResults = document.getElementById("screen-results");

const nameInput = document.getElementById("name-input");
const btnNameContinue = document.getElementById("btn-name-continue");
const chaptersGreeting = document.getElementById("chapters-greeting");
const chapterGrid = document.getElementById("chapter-grid");
const btnStartTraining = document.getElementById("btn-start-training");

const roundLabel = document.getElementById("round-label");
const timerDisplay = document.getElementById("timer-display");
const chunkRow = document.getElementById("chunk-row");
const answerRow = document.getElementById("answer-row");
const btnDone = document.getElementById("btn-done");
const gradeButtons = document.getElementById("grade-buttons");
const btnCorrect = document.getElementById("btn-correct");
const btnIncorrect = document.getElementById("btn-incorrect");

const resultsName = document.getElementById("results-name");
const resultsDate = document.getElementById("results-date");
const resultsScore = document.getElementById("results-score");
const resultsMissed = document.getElementById("results-missed");
const btnTrainAgain = document.getElementById("btn-train-again");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const overlaySub = document.getElementById("overlay-sub");

// ---------- Utilities ----------

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function interleaveByChapter(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.chapterId)) groups.set(item.chapterId, []);
    groups.get(item.chapterId).push(item);
  });
  const lists = shuffle([...groups.values()].map((g) => shuffle(g)));
  const result = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const list of lists) {
      if (list.length) {
        result.push(list.shift());
        remaining = true;
      }
    }
  }
  return result;
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

function generateLayout(key, chunkCount, lastLayouts) {
  const lastLayout = lastLayouts.get(key) || null;
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
  lastLayouts.set(key, layout);
  return layout;
}

function showScreen(el) {
  [screenName, screenChapters, screenPlay, screenResults].forEach((s) => {
    s.hidden = s !== el;
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Boot / data load ----------

async function init() {
  try {
    const [ssRes, mathRes] = await Promise.all([
      fetch("data/social-studies.json"),
      fetch("data/math.json"),
    ]);
    const ss = await ssRes.json();
    const math = await mathRes.json();
    const ssChapters = (ss.chapters || []).map((c) => ({
      ...c,
      subject: "ss",
      subjectLabel: "Social Studies",
      chapterKey: `ss:${c.id}`,
    }));
    const mathChapters = (math.chapters || []).map((c) => ({
      ...c,
      subject: "math",
      subjectLabel: "Math",
      chapterKey: `math:${c.id}`,
    }));
    allChapters = [...ssChapters, ...mathChapters];
  } catch (e) {
    chapterGrid.innerHTML =
      '<p class="chapter-card">Could not load the sentence data. Check that data/social-studies.json and data/math.json are in place.</p>';
  }
}

// ---------- Name entry ----------

function goToChapters() {
  const value = nameInput.value.trim();
  if (!value) {
    nameInput.focus();
    return;
  }
  studentName = value;
  chaptersGreeting.textContent = `Hi ${studentName} —`;
  renderChapterGrid();
  showScreen(screenChapters);
}

btnNameContinue.addEventListener("click", goToChapters);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") goToChapters();
});

function renderChapterGrid() {
  chapterGrid.innerHTML = "";
  selectedChapterKeys.clear();
  updateStartButtonState();
  if (allChapters.length === 0) {
    chapterGrid.innerHTML =
      '<p class="chapter-card">No chapters available yet — ask your teacher to add sentence data.</p>';
    return;
  }

  ["ss", "math"].forEach((subject) => {
    const group = allChapters.filter((c) => c.subject === subject);
    if (group.length === 0) return;

    const heading = document.createElement("h3");
    heading.className = "subject-heading";
    heading.textContent = group[0].subjectLabel;
    chapterGrid.appendChild(heading);

    const row = document.createElement("div");
    row.className = "subject-row";
    group.forEach((chapter) => {
      const card = document.createElement("button");
      card.className = "chapter-card";
      card.innerHTML = `<h2>${chapter.name}</h2><p>${chapter.sentences.length} sentences</p>`;
      card.addEventListener("click", () => toggleChapter(chapter.chapterKey, card));
      row.appendChild(card);
    });
    chapterGrid.appendChild(row);
  });
}

function toggleChapter(chapterKey, card) {
  if (selectedChapterKeys.has(chapterKey)) {
    selectedChapterKeys.delete(chapterKey);
    card.classList.remove("is-selected");
  } else {
    selectedChapterKeys.add(chapterKey);
    card.classList.add("is-selected");
  }
  updateStartButtonState();
}

function updateStartButtonState() {
  btnStartTraining.disabled = selectedChapterKeys.size === 0;
}

btnStartTraining.addEventListener("click", () => {
  const chosen = allChapters.filter((c) => selectedChapterKeys.has(c.chapterKey));
  if (chosen.length > 0) startSession(chosen);
});

// ---------- Session / pool ----------

function toItem(chapterKey, sentence, idx) {
  return {
    key: `${chapterKey}:${idx}`,
    chapterId: chapterKey,
    chunks: sentence.chunks,
    answer: sentence.answer,
  };
}

function buildPool(chapters) {
  const items = [];
  chapters.forEach((chapter) => {
    chapter.sentences.forEach((s, i) => items.push(toItem(chapter.chapterKey, s, i)));
  });
  return items;
}

function startSession(chapters) {
  session = {
    chapters,
    pool: buildPool(chapters),
    results: new Map(),
    lastLayouts: new Map(),
    roundIndex: 0,
    roundState: null,
    secondsLeft: 0,
    timerHandle: null,
    currentItem: null,
    currentLayout: null,
    playing: false,
  };
  showScreen(screenPlay);
  startRound(0);
}

// ---------- Round flow ----------

function drawNext(roundState) {
  if (roundState.pointer >= roundState.order.length) {
    const lastItem = roundState.order[roundState.order.length - 1];
    let newOrder = interleaveByChapter(roundState.items);
    if (roundState.items.length > 1 && newOrder[0].chapterId === lastItem.chapterId) {
      const swapIdx = newOrder.findIndex((it) => it.chapterId !== lastItem.chapterId);
      if (swapIdx > 0) {
        [newOrder[0], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[0]];
      }
    }
    roundState.order = newOrder;
    roundState.pointer = 0;
  }
  return roundState.order[roundState.pointer++];
}

async function startRound(idx) {
  session.roundIndex = idx;
  const cfg = ROUNDS[idx];

  let items;
  let introSub = "";
  if (idx < 2) {
    items = session.pool;
  } else {
    const incorrect = session.pool.filter((p) => session.results.get(p.key) === "incorrect");
    if (incorrect.length > 0) {
      items = incorrect;
      introSub = "Let's fix the ones you missed!";
    } else {
      items = session.pool;
      introSub = "All correct so far — random review!";
    }
  }

  session.roundState = { items, order: interleaveByChapter(items), pointer: 0 };
  session.secondsLeft = cfg.seconds;
  roundLabel.textContent = `${cfg.label} of 3`;
  updateTimerDisplay();

  await showOverlay(cfg.label, `${cfg.seconds} seconds${introSub ? " — " + introSub : ""}`, 1600);
  await runReadySetGo();
  showCurrentSentence();
  startTimerInterval();
}

function showCurrentSentence() {
  const item = drawNext(session.roundState);
  const layout = generateLayout(item.key, item.chunks.length, session.lastLayouts);
  session.currentItem = item;
  session.currentLayout = layout;
  session.playing = true;

  renderChunks(item, layout);
  answerRow.hidden = true;
  answerRow.innerHTML = "";
  btnDone.hidden = false;
  gradeButtons.hidden = true;
}

function renderChunks(item, layout) {
  chunkRow.innerHTML = "";
  layout.order.forEach((chunkIdx) => {
    const tile = document.createElement("div");
    tile.className = "chunk-tile";
    tile.dataset.color = layout.colors[chunkIdx];
    tile.textContent = item.chunks[chunkIdx];
    chunkRow.appendChild(tile);
  });
}

function renderAnswerChunks(item, layout) {
  answerRow.innerHTML = "";
  item.chunks.forEach((chunkText, chunkIdx) => {
    const tile = document.createElement("div");
    tile.className = "chunk-tile chunk-tile-answer";
    tile.dataset.color = layout.colors[chunkIdx];
    tile.textContent = chunkText;
    answerRow.appendChild(tile);
  });
}

// ---------- Timer ----------

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(Math.max(session.secondsLeft, 0));
  timerDisplay.classList.toggle("is-low", session.secondsLeft <= 10);
}

function startTimerInterval() {
  clearTimerInterval();
  session.timerHandle = setInterval(() => {
    session.secondsLeft -= 1;
    updateTimerDisplay();
    if (session.secondsLeft <= 0) {
      clearTimerInterval();
      endRound();
    }
  }, 1000);
}

function clearTimerInterval() {
  if (session.timerHandle) {
    clearInterval(session.timerHandle);
    session.timerHandle = null;
  }
}

async function endRound() {
  session.playing = false;
  if (session.roundIndex < ROUNDS.length - 1) {
    await startRound(session.roundIndex + 1);
  } else {
    showResults();
  }
}

// ---------- Overlay helpers ----------

function showOverlay(text, sub, durationMs) {
  overlayText.textContent = "";
  overlaySub.textContent = sub || "";
  overlay.hidden = false;
  overlayText.style.animation = "none";
  void overlayText.offsetWidth; // force reflow so the pop animation replays
  overlayText.textContent = text;
  overlayText.style.animation = "";
  return wait(durationMs || 1200);
}

async function runReadySetGo() {
  await showOverlay("Ready", "", 900);
  await showOverlay("Set", "", 900);
  await showOverlay("Go!", "", 700);
  overlay.hidden = true;
}

// ---------- Done / grading ----------

btnDone.addEventListener("click", () => {
  if (!session || !session.playing) return;
  clearTimerInterval();
  session.playing = false;
  renderAnswerChunks(session.currentItem, session.currentLayout);
  answerRow.hidden = false;
  btnDone.hidden = true;
  gradeButtons.hidden = false;
});

btnCorrect.addEventListener("click", () => gradeCurrent(true));
btnIncorrect.addEventListener("click", () => gradeCurrent(false));

async function gradeCurrent(isCorrect) {
  session.results.set(session.currentItem.key, isCorrect ? "correct" : "incorrect");
  gradeButtons.hidden = true;

  await showOverlay("Reset your cups!", "Get ready for the next sentence", 1600);

  if (session.secondsLeft <= 0) {
    overlay.hidden = true;
    endRound();
    return;
  }

  await runReadySetGo();
  showCurrentSentence();
  startTimerInterval();
}

// ---------- Results ----------

function showResults() {
  showScreen(screenResults);

  resultsName.textContent = studentName;
  resultsDate.textContent = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const attempted = session.results.size;
  const correct = [...session.results.values()].filter((v) => v === "correct").length;
  resultsScore.textContent = `${correct} / ${attempted} correct`;

  const missed = session.pool.filter((p) => session.results.get(p.key) === "incorrect");
  resultsMissed.innerHTML = "";
  const heading = document.createElement("h3");
  heading.textContent = "Sentences to review";
  resultsMissed.appendChild(heading);

  if (missed.length === 0) {
    const p = document.createElement("p");
    p.className = "all-correct";
    p.textContent = "Everything matched — great work!";
    resultsMissed.appendChild(p);
  } else {
    const ul = document.createElement("ul");
    missed.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.answer;
      ul.appendChild(li);
    });
    resultsMissed.appendChild(ul);
  }
}

btnTrainAgain.addEventListener("click", () => {
  startSession(session.chapters);
});

// ---------- Boot ----------

init();
