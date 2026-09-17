/* ===================================================================
   Vocab Duel — Social Studies edition
   Each chapter has 10 words. Player 1 is quizzed on a random 5,
   Player 2 gets the other 5.
   =================================================================== */

const ROUND_SECONDS = 30;
const WORDS_PER_ROUND = 10;
const WORDS_NEEDED = WORDS_PER_ROUND * 2; // 20 — pooled from (usually) two 10-word chapters
const DATA_FILE = 'data/social_studies.json';

// ---- state -----------------------------------------------------------
const state = {
  subject: null,     // { label, chapters: [{id, name, words}] }
  players: { p1: '', p2: '' },
  round1: { words: [], answers: [] },
  round2: { words: [], answers: [] },
  timer: { seconds: ROUND_SECONDS, handle: null },
  currentIndex: 0,
  activeRound: 1
};

// ---- helpers -----------------------------------------------------------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function $(id) { return document.getElementById(id); }

// ---- load vocab data -----------------------------------------------------------
async function loadData() {
  const listEl = $('chapter-list');
  try {
    const res = await fetch(DATA_FILE);
    if (!res.ok) throw new Error(`${DATA_FILE}: ${res.status}`);
    const data = await res.json();
    state.subject = { label: data.subject, chapters: data.chapters };
    renderChapterList();
  } catch (err) {
    listEl.innerHTML = `<p class="setup-error" style="margin:0;">Couldn't load the vocab list (${err.message}). Serve this folder over http:// (e.g. GitHub Pages or a local server) rather than opening index.html directly.</p>`;
  }
}

function renderChapterList() {
  const listEl = $('chapter-list');
  listEl.innerHTML = state.subject.chapters.map(c => `
    <label class="chapter-item">
      <input type="checkbox" class="chapter-check" data-chapter="${c.id}" checked>
      <span>${c.name}</span>
      <span class="chapter-item-count">${c.words.length} words</span>
    </label>
  `).join('');
}

// ---- word pool building -----------------------------------------------------------
function getSelectedPool() {
  const words = [];
  document.querySelectorAll('.chapter-check:checked').forEach(cb => {
    const chapter = state.subject.chapters.find(c => c.id === cb.dataset.chapter);
    if (chapter) chapter.words.forEach(w => words.push({ en: w.en, jp: w.jp }));
  });
  return words;
}

// ---- setup screen -----------------------------------------------------------
function showSetupError(msg) {
  const el = $('setup-error');
  el.textContent = msg;
  el.hidden = false;
}
function clearSetupError() {
  $('setup-error').hidden = true;
}

$('btn-start').addEventListener('click', () => {
  clearSetupError();

  const p1 = $('p1-name').value.trim() || 'Player 1';
  const p2 = $('p2-name').value.trim() || 'Player 2';

  const pool = getSelectedPool();
  if (pool.length === 0) {
    showSetupError('Choose at least one chapter to practice.');
    return;
  }
  if (pool.length < WORDS_NEEDED) {
    showSetupError(`Not enough words in the selected chapters (need at least ${WORDS_NEEDED}, have ${pool.length}). Select another chapter too.`);
    return;
  }

  const shuffled = shuffle(pool).slice(0, WORDS_NEEDED);

  state.players.p1 = p1;
  state.players.p2 = p2;
  state.round1.words = shuffled.slice(0, WORDS_PER_ROUND);
  state.round2.words = shuffled.slice(WORDS_PER_ROUND, WORDS_NEEDED);
  state.round1.answers = [];
  state.round2.answers = [];

  startRound(1);
});

// ---- intro / swap screen -----------------------------------------------------------
function startRound(roundNum) {
  state.activeRound = roundNum;
  const isRound1 = roundNum === 1;

  // Round 1: Player 1 holds the tablet, reads English, Player 2 answers in Japanese.
  // Round 2: Player 2 holds the tablet, reads Japanese, Player 1 answers in English.
  const reader = isRound1 ? state.players.p1 : state.players.p2;
  const answerer = isRound1 ? state.players.p2 : state.players.p1;
  const readerLang = isRound1 ? 'English' : 'Japanese';
  const answererLang = isRound1 ? 'Japanese' : 'English';

  $('intro-eyebrow').textContent = isRound1 ? 'Round 1 of 2' : 'Round 2 of 2 — swap!';
  $('intro-heading').innerHTML = `Pass the tablet to&nbsp;<span id="intro-holder-name">${reader}</span>`;
  $('intro-reader-name').textContent = reader;
  $('intro-reader-lang').textContent = readerLang;
  $('intro-answerer-name').textContent = answerer;
  $('intro-answerer-lang').textContent = answererLang;

  state.roundMeta = { reader, answerer, readerLang, answererLang };

  showScreen('screen-intro');
}

$('btn-ready').addEventListener('click', () => {
  beginPlay();
});

// ---- play screen -----------------------------------------------------------
function currentRoundData() {
  return state.activeRound === 1 ? state.round1 : state.round2;
}

function beginPlay() {
  state.currentIndex = 0;
  currentRoundData().answers = [];
  state.timer.seconds = ROUND_SECONDS;

  const meta = state.roundMeta;
  $('play-reader-name').textContent = meta.reader;
  $('play-reader-lang').textContent = meta.readerLang;
  $('play-answerer-name').textContent = meta.answerer;
  $('play-answerer-lang').textContent = meta.answererLang;
  $('word-total').textContent = WORDS_PER_ROUND;

  renderCurrentWord();
  updateTimerDisplay();

  showScreen('screen-play');

  clearInterval(state.timer.handle);
  state.timer.handle = setInterval(() => {
    state.timer.seconds -= 0.1;
    if (state.timer.seconds <= 0) {
      state.timer.seconds = 0;
      updateTimerDisplay();
      clearInterval(state.timer.handle);
      endRound();
      return;
    }
    updateTimerDisplay();
  }, 100);
}

function updateTimerDisplay() {
  const pct = Math.max(0, (state.timer.seconds / ROUND_SECONDS) * 100);
  $('timer-fill').style.width = pct + '%';
  $('timer-seconds').textContent = Math.ceil(state.timer.seconds);
}

function renderCurrentWord() {
  const round = currentRoundData();
  const word = round.words[state.currentIndex];
  $('word-en').textContent = word.en;
  $('word-jp').textContent = word.jp;
  $('word-index').textContent = state.currentIndex + 1;
}

function judge(isCorrect) {
  const round = currentRoundData();
  const word = round.words[state.currentIndex];
  round.answers.push({ en: word.en, jp: word.jp, correct: isCorrect, reached: true });
  state.currentIndex++;

  if (state.currentIndex >= round.words.length) {
    clearInterval(state.timer.handle);
    endRound();
  } else {
    renderCurrentWord();
  }
}

$('btn-correct').addEventListener('click', () => judge(true));
$('btn-incorrect').addEventListener('click', () => judge(false));

function endRound() {
  clearInterval(state.timer.handle);
  const round = currentRoundData();
  // mark any unreached words as missed
  for (let i = state.currentIndex; i < round.words.length; i++) {
    const word = round.words[i];
    round.answers.push({ en: word.en, jp: word.jp, correct: false, reached: false });
  }

  if (state.activeRound === 1) {
    startRound(2);
  } else {
    showResults();
  }
}

// ---- results screen -----------------------------------------------------------
function scoreFor(answers) {
  return answers.filter(a => a.correct).length;
}

function renderPlayerCard(name, answers, sideClass) {
  const score = scoreFor(answers);
  const missed = answers.filter(a => !a.correct);

  const missedHtml = missed.length
    ? `<div class="missed-list">${missed.map(m => `<span class="missed-chip"><b>${m.en}</b> — ${m.jp}</span>`).join('')}</div>`
    : `<p class="missed-empty">Got every word!</p>`;

  return `
    <div class="player-result ${sideClass}">
      <div class="player-result-head">
        <span class="player-result-name">${name}</span>
        <span class="player-result-score">${score}/${WORDS_PER_ROUND}</span>
      </div>
      <p class="player-result-sub">Words to review</p>
      ${missedHtml}
    </div>
  `;
}

function showResults() {
  // Player 1 was tested in round 2 (answering English). Player 2 was tested in round 1 (answering Japanese).
  const grid = $('results-grid');
  grid.innerHTML =
    renderPlayerCard(state.players.p1, state.round2.answers, 'is-p1') +
    renderPlayerCard(state.players.p2, state.round1.answers, 'is-p2');
  showScreen('screen-results');
}

$('btn-restart').addEventListener('click', () => {
  clearInterval(state.timer.handle);
  $('p1-name').value = '';
  $('p2-name').value = '';
  document.querySelectorAll('.chapter-check').forEach(cb => cb.checked = true);
  clearSetupError();
  showScreen('screen-setup');
});

// ---- init -----------------------------------------------------------
loadData();
