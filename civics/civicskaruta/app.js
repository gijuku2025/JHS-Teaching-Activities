// Civics Karuta — game logic
// Data is loaded from sentences.json. If that fetch fails (e.g. the page is
// opened directly from disk instead of through a server), FALLBACK_DATA below
// is used instead so the game still works.

const FALLBACK_DATA = {
  chapters: [
    {
      id: "ch15",
      title: "Chapter 15: International Trade",
      sentences: [
        { part1: "Buying and selling commodities with other countries", part2: "is called trade." },
        { part1: "Countries trade because", part2: "they produce different goods." },
        { part1: "International specialization means", part2: "countries produce the things they are good at." },
        { part1: "After the war, Japan imported raw materials", part2: "and exported manufactured goods." },
        { part1: "A trade surplus means", part2: "exports are higher than imports." },
        { part1: "Many companies moved their factories", part2: "to developing countries." },
        { part1: "The number of factories in Japan", part2: "decreased." },
        { part1: "Deindustrialization means", part2: "factories move to other countries." }
      ]
    },
    {
      id: "ch16",
      title: "Chapter 16: Taxes",
      sentences: [
        { part1: "Consumers pay consumption tax", part2: "to retailers and producers." },
        { part1: "Consumption tax is", part2: "an indirect tax." },
        { part1: "People with low incomes pay", part2: "a higher proportion of their income in consumption tax." },
        { part1: "A regressive tax means people", part2: "with low incomes pay a higher proportion of their income." },
        { part1: "People with high incomes", part2: "pay a higher proportion of their income in income tax." },
        { part1: "A progressive tax means people", part2: "with high incomes pay a higher proportion of their income." },
        { part1: "Governments combine different kinds of taxes", part2: "to make taxes fair." },
        { part1: "People with the same income", part2: "should pay the same amount of tax." }
      ]
    }
  ]
};

const ROUND_SECONDS = 60;

let chaptersData = [];

const state = {
  players: [],          // [{name}] in the order typed
  readerOrder: [],       // indices into players, alphabetical by first name
  roundNumber: 0,
  readerTurn: 0,         // increments each round, index = readerTurn % 3
  pool: [],
  poolIndex: 0,
  roundScores: [0, 0, 0],
  totalScores: [0, 0, 0],
  roundHistory: [],      // [{ round: 1, scores: [0,0,0] }, ...]
  selectedForCard: null,
  timeLeft: ROUND_SECONDS,
  timerId: null,
};

const screens = document.querySelectorAll(".screen");
function showScreen(name) {
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === name));
}

// ---------- load data & populate chapter pickers ----------

const chapterA = document.getElementById("chapter-a");
const chapterB = document.getElementById("chapter-b");

function populateChapterSelects() {
  [chapterA, chapterB].forEach((select, i) => {
    select.innerHTML = "";
    chaptersData.forEach(ch => {
      const opt = document.createElement("option");
      opt.value = ch.id;
      opt.textContent = ch.title;
      select.appendChild(opt);
    });
    if (chaptersData[i]) select.value = chaptersData[i].id;
  });
}

fetch("sentences.json")
  .then(res => {
    if (!res.ok) throw new Error("bad response");
    return res.json();
  })
  .then(data => {
    chaptersData = data.chapters || [];
    populateChapterSelects();
  })
  .catch(() => {
    chaptersData = FALLBACK_DATA.chapters;
    populateChapterSelects();
  });

// ---------- setup screen ----------

const startGameBtn = document.getElementById("start-game-btn");
const setupError = document.getElementById("setup-error");

startGameBtn.addEventListener("click", () => {
  const names = [0, 1, 2].map(i => document.getElementById(`player-${i}`).value.trim());

  if (names.some(n => n.length === 0)) {
    setupError.textContent = "Enter all three players' names.";
    return;
  }
  const lower = names.map(n => n.toLowerCase());
  if (new Set(lower).size !== 3) {
    setupError.textContent = "Player names need to be different from each other.";
    return;
  }
  if (chapterA.value === chapterB.value) {
    setupError.textContent = "Choose two different chapters.";
    return;
  }

  setupError.textContent = "";
  state.players = names.map(name => ({ name }));
  state.readerOrder = [0, 1, 2].sort((a, b) =>
    names[a].toLowerCase().localeCompare(names[b].toLowerCase())
  );
  state.readerTurn = 0;
  state.roundNumber = 0;
  state.totalScores = [0, 0, 0];
  state.roundHistory = [];

  buildPool(chapterA.value, chapterB.value);
  beginRoundSetup();
});

function buildPool(idA, idB) {
  const a = chaptersData.find(c => c.id === idA);
  const b = chaptersData.find(c => c.id === idB);
  const combined = [...(a ? a.sentences : []), ...(b ? b.sentences : [])];
  state.pool = shuffle(combined);
}

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- pass-tablet screen ----------

const passRoundTag = document.getElementById("pass-round-tag");
const passReaderName = document.getElementById("pass-reader-name");
const readyBtn = document.getElementById("ready-btn");

function currentReaderIndex() {
  return state.readerOrder[state.readerTurn % 3];
}

function beginRoundSetup() {
  state.roundNumber += 1;
  const readerIdx = currentReaderIndex();
  passRoundTag.textContent = `Round ${state.roundNumber}`;
  passReaderName.textContent = state.players[readerIdx].name;
  showScreen("pass");
}

readyBtn.addEventListener("click", startRound);

// ---------- reading screen ----------

const readingRoundTag = document.getElementById("reading-round-tag");
const timerDisplay = document.getElementById("timer-display");
const cardPart1 = document.getElementById("card-part1");
const cardPart2 = document.getElementById("card-part2");
const progressNote = document.getElementById("progress-note");
const playerButtonsWrap = document.getElementById("player-buttons");
const nextCardBtn = document.getElementById("next-card-btn");

function startRound() {
  state.pool = shuffle(state.pool);
  state.poolIndex = 0;
  state.roundScores = [0, 0, 0];
  state.timeLeft = ROUND_SECONDS;

  const readerIdx = currentReaderIndex();
  readingRoundTag.textContent = `Round ${state.roundNumber} \u00b7 ${state.players[readerIdx].name} is reading`;

  buildPlayerButtons(readerIdx);
  showCard();
  updateTimerDisplay();

  clearInterval(state.timerId);
  state.timerId = setInterval(tickTimer, 1000);

  showScreen("reading");
}

function buildPlayerButtons(readerIdx) {
  playerButtonsWrap.innerHTML = "";
  state.players.forEach((p, i) => {
    const btn = document.createElement("button");
    if (i === readerIdx) {
      btn.innerHTML = `${p.name}<span class="reader-note">reading</span>`;
      btn.disabled = true;
    } else {
      btn.textContent = p.name;
      btn.addEventListener("click", () => selectPlayerForCard(i, btn));
    }
    btn.dataset.playerIndex = i;
    playerButtonsWrap.appendChild(btn);
  });
}

function selectPlayerForCard(playerIndex, btnEl) {
  state.selectedForCard = playerIndex;
  [...playerButtonsWrap.children].forEach(b => b.classList.remove("selected"));
  btnEl.classList.add("selected");
}

function showCard() {
  const card = state.pool[state.poolIndex];
  cardPart1.textContent = card.part1;
  cardPart2.textContent = card.part2;
  progressNote.textContent = `Card ${state.poolIndex + 1} of ${state.pool.length}`;
  state.selectedForCard = null;
  [...playerButtonsWrap.children].forEach(b => b.classList.remove("selected"));
}

nextCardBtn.addEventListener("click", () => {
  if (state.selectedForCard !== null) {
    state.roundScores[state.selectedForCard] += 1;
  }
  state.poolIndex += 1;
  if (state.poolIndex >= state.pool.length) {
    endRound();
  } else {
    showCard();
  }
});

function tickTimer() {
  state.timeLeft -= 1;
  updateTimerDisplay();
  if (state.timeLeft <= 0) {
    endRound();
  }
}

function updateTimerDisplay() {
  const m = Math.floor(Math.max(state.timeLeft, 0) / 60);
  const s = Math.max(state.timeLeft, 0) % 60;
  timerDisplay.textContent = `${m}:${String(s).padStart(2, "0")}`;
  timerDisplay.classList.toggle("urgent", state.timeLeft <= 10);
}

// ---------- round end screen ----------

const roundEndTag = document.getElementById("round-end-tag");
const roundEndScores = document.getElementById("round-end-scores");
const newRoundBtn = document.getElementById("new-round-btn");
const endGameBtn = document.getElementById("end-game-btn");

function endRound() {
  clearInterval(state.timerId);
  state.players.forEach((p, i) => { state.totalScores[i] += state.roundScores[i]; });
  state.roundHistory.push({ round: state.roundNumber, scores: state.roundScores.slice() });

  roundEndTag.textContent = `Round ${state.roundNumber} complete`;
  roundEndScores.innerHTML = "";
  state.players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `<span class="name">${p.name}</span><span class="count">${state.roundScores[i]}</span>`;
    roundEndScores.appendChild(row);
  });

  showScreen("round-end");
}

newRoundBtn.addEventListener("click", () => {
  state.readerTurn += 1;
  beginRoundSetup();
});

endGameBtn.addEventListener("click", showResults);

// ---------- results screen ----------

const resultsScores = document.getElementById("results-scores");
const playAgainBtn = document.getElementById("play-again-btn");

function showResults() {
  resultsScores.innerHTML = "";

  state.roundHistory.forEach(entry => {
    const block = document.createElement("div");
    block.className = "round-block";

    const heading = document.createElement("p");
    heading.className = "eyebrow round-block-heading";
    heading.textContent = `Round ${entry.round}`;
    block.appendChild(heading);

    state.players.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "score-row";
      row.innerHTML = `<span class="name">${p.name}</span><span class="count">${entry.scores[i]}</span>`;
      block.appendChild(row);
    });

    resultsScores.appendChild(block);
  });

  const totalBlock = document.createElement("div");
  totalBlock.className = "round-block round-block-total";
  const totalHeading = document.createElement("p");
  totalHeading.className = "eyebrow round-block-heading";
  totalHeading.textContent = "Total";
  totalBlock.appendChild(totalHeading);
  state.players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `<span class="name">${p.name}</span><span class="count">${state.totalScores[i]}</span>`;
    totalBlock.appendChild(row);
  });
  resultsScores.appendChild(totalBlock);

  showScreen("results");
}

playAgainBtn.addEventListener("click", () => {
  [0, 1, 2].forEach(i => { document.getElementById(`player-${i}`).value = ""; });
  setupError.textContent = "";
  showScreen("setup");
});
