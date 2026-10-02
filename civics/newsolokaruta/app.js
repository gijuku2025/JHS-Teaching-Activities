// Civics Karuta — Solo Match
// Data is loaded from sentences.json. If that fetch fails (e.g. the page is
// opened directly from disk instead of through a server), FALLBACK_DATA below
// is used instead so the game still works. Keep this in sync with
// sentences.json if you edit that file's chapters.

const FALLBACK_DATA = {
  chapters: [
    {
      id: "ch15",
      title: "Chapter 15: International Trade",
      sentences: [
        { part1: "Buying and selling commodities with other countries", part2: "is called trade.", audio: "buying_and_selling_commodities_with_other_countries.mp3" },
        { part1: "Countries trade because", part2: "they produce different goods.", audio: "countries_trade_because.mp3" },
        { part1: "International specialization means", part2: "countries produce the things they are good at.", audio: "international_specialization_means.mp3" },
        { part1: "After the war, Japan imported raw materials", part2: "and exported manufactured goods.", audio: "after_the_war_japan_imported_raw_materials.mp3" },
        { part1: "A trade surplus means", part2: "exports are higher than imports.", audio: "a_trade_surplus_means.mp3" },
        { part1: "Many companies moved their factories", part2: "to developing countries.", audio: "many_companies_moved_their_factories.mp3" },
        { part1: "The number of factories in Japan", part2: "decreased.", audio: "the_number_of_factories_in_japan.mp3" },
        { part1: "Deindustrialization means", part2: "factories move to other countries.", audio: "deindustrialization_means.mp3" }
      ]
    },
    {
      id: "ch16",
      title: "Chapter 16: Taxes",
      sentences: [
        { part1: "Consumers pay consumption tax", part2: "to retailers and producers.", audio: "consumers_pay_consumption_tax.mp3" },
        { part1: "Consumption tax is", part2: "an indirect tax.", audio: "consumption_tax_is.mp3" },
        { part1: "People with low incomes pay", part2: "a higher proportion of their income in consumption tax.", audio: "people_with_low_incomes_pay.mp3" },
        { part1: "A regressive tax means people", part2: "with low incomes pay a higher proportion of their income.", audio: "a_regressive_tax_means_people.mp3" },
        { part1: "People with high incomes", part2: "pay a higher proportion of their income in income tax.", audio: "people_with_high_incomes.mp3" },
        { part1: "A progressive tax means people", part2: "with high incomes pay a higher proportion of their income.", audio: "a_progressive_tax_means_people.mp3" },
        { part1: "Governments combine different kinds of taxes", part2: "to make taxes fair.", audio: "governments_combine_different_kinds_of_taxes.mp3" },
        { part1: "People with the same income", part2: "should pay the same amount of tax.", audio: "people_with_the_same_income.mp3" }
      ]
    },
    {
      id: "ch7",
      title: "Chapter 7: Polar Climates",
      sentences: [
        { part1: "The Polar Zone", part2: "is always cold.", audio: "the_polar_zone.mp3" },
        { part1: "Summer has no night,", part2: "and winter has no day.", audio: "summer_has_no_night.mp3" },
        { part1: "Inuit people used the things", part2: "in their environment.", audio: "inuit_people_used_the_things.mp3" },
        { part1: "In Tundra Climates", part2: "snow melts in summer.", audio: "in_tundra_climates.mp3" },
        { part1: "Traditional Inuit lived in", part2: "igloos and tents.", audio: "traditional_inuit_lived_in.mp3" },
        { part1: "Many modern Inuit now live", part2: "in towns with electricity.", audio: "many_modern_inuit_now_live.mp3" },
        { part1: "The sun is low in the sky,", part2: "so solar energy is weak.", audio: "the_sun_is_low_in_the_sky.mp3" },
        { part1: "In Ice Cap climates", part2: "snow never melts.", audio: "in_ice_cap_climates.mp3" }
      ]
    },
    {
      id: "ch8",
      title: "Chapter 8: Tropical Climates",
      sentences: [
        { part1: "The Tropical Zone", part2: "is always hot.", audio: "the_tropical_zone.mp3" },
        { part1: "Tropical Rainforest Climates are", part2: "hot and rainy all year.", audio: "tropical_rainforest_climates_are.mp3" },
        { part1: "Savanna Climates have", part2: "a rainy season and a dry season.", audio: "savanna_climates_have.mp3" },
        { part1: "The rainy season comes", part2: "when the Subsolar Point is near.", audio: "the_rainy_season_comes.mp3" },
        { part1: "Mangroves and coral reefs", part2: "grow in the Tropical Zone.", audio: "mangroves_and_coral_reefs.mp3" },
        { part1: "People use the things", part2: "in their environment.", audio: "people_use_the_things.mp3" },
        { part1: "Samoa exports", part2: "frozen tuna to Japan.", audio: "samoa_exports.mp3" },
        { part1: "Many Samoans", part2: "work in tourism.", audio: "many_samoans.mp3" }
      ]
    }
  ]
};

const FEEDBACK_DELAY_MS = 900;
const AUDIO_FOLDER = "audio";

let chaptersData = [];
let currentAudio = null;

const state = {
  studentName: "",
  secondsPerCard: 10,
  pool: [],          // shuffled list of {part1, part2} to ask, in order
  index: 0,
  current: null,
  score: 0,
  attempted: 0,
  timerId: null,
  timeLeft: 10,
  answered: false,
};

const screens = document.querySelectorAll(".screen");
function showScreen(name) {
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === name));
}

// Mirrors the slug rule used to pre-fill the "audio" field in sentences.json,
// used only as a fallback for a sentence that has no "audio" field of its own.
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

function audioPathFor(chapterId, sentence) {
  const filename = sentence.audio || `${slugify(sentence.part1)}.mp3`;
  return `${AUDIO_FOLDER}/${encodeURIComponent(chapterId)}/${encodeURIComponent(filename)}`;
}

function shuffle(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- load data & populate chapter checkboxes ----------

const chapterCheckboxes = document.getElementById("chapter-checkboxes");

function populateChapterCheckboxes() {
  chapterCheckboxes.innerHTML = "";
  chaptersData.forEach(ch => {
    const row = document.createElement("div");
    row.className = "chapter-checkbox-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `chapter-cb-${ch.id}`;
    input.value = ch.id;

    const label = document.createElement("label");
    label.setAttribute("for", input.id);
    label.textContent = ch.title;

    row.appendChild(input);
    row.appendChild(label);
    chapterCheckboxes.appendChild(row);
  });
}

fetch("sentences.json")
  .then(res => {
    if (!res.ok) throw new Error("bad response");
    return res.json();
  })
  .then(data => {
    chaptersData = data.chapters || [];
    populateChapterCheckboxes();
  })
  .catch(() => {
    chaptersData = FALLBACK_DATA.chapters;
    populateChapterCheckboxes();
  });

// ---------- setup screen ----------

const studentNameInput = document.getElementById("student-name");
const secondsSelect = document.getElementById("seconds-select");
const startGameBtn = document.getElementById("start-game-btn");
const setupError = document.getElementById("setup-error");

startGameBtn.addEventListener("click", () => {
  const checked = [...chapterCheckboxes.querySelectorAll("input:checked")].map(i => i.value);
  if (checked.length === 0) {
    setupError.textContent = "Select at least one chapter.";
    return;
  }
  setupError.textContent = "";

  state.studentName = studentNameInput.value.trim();
  state.secondsPerCard = parseInt(secondsSelect.value, 10);

  const combined = checked.flatMap(id => {
    const ch = chaptersData.find(c => c.id === id);
    if (!ch) return [];
    return ch.sentences.map(s => ({
      part1: s.part1,
      part2: s.part2,
      audioPath: audioPathFor(id, s),
    }));
  });
  state.pool = shuffle(combined);
  state.index = 0;
  state.score = 0;
  state.attempted = 0;

  showScreen("play");
  loadCard();
});

// ---------- play screen ----------

const playProgress = document.getElementById("play-progress");
const playScore = document.getElementById("play-score");
const timerDisplay = document.getElementById("timer-display");
const timerBarFill = document.getElementById("timer-bar-fill");
const questionFallback = document.getElementById("question-fallback");
const replayBtn = document.getElementById("replay-btn");
const answerGrid = document.getElementById("answer-grid");
const endSessionBtn = document.getElementById("end-session-btn");

function stopAudio() {
  if (currentAudio) {
    currentAudio.onerror = null;
    currentAudio.pause();
  }
}

function playCurrentAudio() {
  stopAudio();
  questionFallback.hidden = true;
  currentAudio = new Audio(state.current.audioPath);
  currentAudio.onerror = () => {
    // Missing or unplayable file — fall back to showing the text instead.
    questionFallback.hidden = false;
    questionFallback.textContent = state.current.part1;
  };
  currentAudio.play().catch(() => {
    questionFallback.hidden = false;
    questionFallback.textContent = state.current.part1;
  });
}

function buildChoices(correct) {
  const others = state.pool.filter(s => s !== correct && s.part2 !== correct.part2);
  const pickFrom = others.length >= 3 ? others : state.pool.filter(s => s !== correct);
  const distractors = shuffle(pickFrom).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

function loadCard() {
  if (state.index >= state.pool.length) {
    endSession();
    return;
  }

  state.current = state.pool[state.index];
  state.answered = false;

  playProgress.textContent = `Card ${state.index + 1} of ${state.pool.length}`;
  playScore.textContent = `Score: ${state.score}`;

  renderChoices(buildChoices(state.current));
  playCurrentAudio();
  startTimer();
}

function renderChoices(choices) {
  answerGrid.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "answer-card";
    btn.textContent = choice.part2;
    btn.dataset.correct = choice === state.current ? "true" : "false";
    btn.addEventListener("click", () => handleAnswer(btn));
    answerGrid.appendChild(btn);
  });
}

function startTimer() {
  clearInterval(state.timerId);
  state.timeLeft = state.secondsPerCard;
  updateTimerDisplay();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const t = Math.max(state.timeLeft, 0);
  timerDisplay.textContent = t;
  const urgent = t <= 3;
  timerDisplay.classList.toggle("urgent", urgent);
  timerBarFill.style.width = `${(t / state.secondsPerCard) * 100}%`;
  timerBarFill.classList.toggle("urgent", urgent);
}

function handleAnswer(selectedBtn) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timerId);
  state.attempted += 1;

  const isCorrect = selectedBtn.dataset.correct === "true";
  if (isCorrect) {
    state.score += 1;
    selectedBtn.classList.add("correct");
  } else {
    selectedBtn.classList.add("incorrect");
    revealCorrectCard();
  }
  playScore.textContent = `Score: ${state.score}`;
  lockChoices();
  setTimeout(advanceCard, FEEDBACK_DELAY_MS);
}

function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  state.attempted += 1;
  revealCorrectCard();
  lockChoices();
  setTimeout(advanceCard, FEEDBACK_DELAY_MS);
}

function revealCorrectCard() {
  [...answerGrid.children].forEach(btn => {
    if (btn.dataset.correct === "true") btn.classList.add("correct");
  });
}

function lockChoices() {
  [...answerGrid.children].forEach(btn => { btn.disabled = true; });
}

function advanceCard() {
  state.index += 1;
  loadCard();
}

replayBtn.addEventListener("click", () => {
  if (!currentAudio) return;
  currentAudio.currentTime = 0;
  currentAudio.play().catch(() => {});
});

endSessionBtn.addEventListener("click", () => {
  clearInterval(state.timerId);
  stopAudio();
  endSession();
});

// ---------- results screen ----------

const resultsHeading = document.getElementById("results-heading");
const resultsScore = document.getElementById("results-score");
const playAgainBtn = document.getElementById("play-again-btn");

function endSession() {
  clearInterval(state.timerId);
  stopAudio();
  resultsHeading.textContent = state.studentName ? `Nice work, ${state.studentName}!` : "Results";
  resultsScore.textContent = `${state.score} / ${state.attempted} correct`;
  showScreen("results");
}

playAgainBtn.addEventListener("click", () => {
  studentNameInput.value = "";
  setupError.textContent = "";
  showScreen("setup");
});
