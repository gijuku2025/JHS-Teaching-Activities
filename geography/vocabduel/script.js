/* ===================================================================
   Vocab Duel — game logic
   =================================================================== */

const ROUND_SECONDS = 30;
const WORDS_PER_ROUND = 10;
const DATA_FILES = [
  { key: 'social_studies', file: 'data/social_studies.json' },
  { key: 'math', file: 'data/math.json' }
];

// ---- state -----------------------------------------------------------
const state = {
  subjects: {},      // key -> { label, chapters: [{id, name, words}] }
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
  const listEl = $('subject-list');
  try {
    const results = await Promise.all(
      DATA_FILES.map(d => fetch(d.file).then(r => {
        if (!r.ok) throw new Error(`${d.file}: ${r.status}`);
        return r.json();
      }))
    );
    results.forEach((data, i) => {
      state.subjects[DATA_FILES[i].key] = {
        label: data.subject,
        chapters: data.chapters
      };
    });
    renderSubjectList();
  } catch (err) {
    listEl.innerHTML = `<p class="setup-error" style="margin:0;">Couldn't load vocab lists (${err.message}). Serve this folder over http:// (e.g. GitHub Pages or a local server) rather than opening index.html directly.</p>`;
  }
}

function renderSubjectList() {
  const listEl = $('subject-list');
  listEl.innerHTML = '';

  Object.entries(state.subjects).forEach(([key, subject]) => {
    const block = document.createElement('div');
    block.className = 'subject-block';
    block.dataset.subject = key;

    const totalWords = subject.chapters.reduce((sum, c) => sum + c.words.length, 0);

    block.innerHTML = `
      <label class="subject-head">
        <input type="checkbox" class="subject-check" data-subject="${key}">
        <span>${subject.label}</span>
        <span class="subject-count">${totalWords} words</span>
      </label>
      <div class="chapter-list disabled" data-subject-chapters="${key}">
        ${subject.chapters.map(c => `
          <label class="chapter-item">
            <input type="checkbox" class="chapter-check" data-subject="${key}" data-chapter="${c.id}" checked>
            <span>${c.name} (${c.words.length} words)</span>
          </label>
        `).join('')}
      </div>
    `;
    listEl.appendChild(block);
  });

  // subject checkbox toggles its chapter list
  listEl.querySelectorAll('.subject-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = cb.dataset.subject;
      const chapterList = listEl.querySelector(`[data-subject-chapters="${key}"]`);
      chapterList.classList.toggle('disabled', !cb.checked);
    });
  });
}

// ---- word pool building -----------------------------------------------------------
function getSelectedPools() {
  const pools = {}; // key -> shuffled word array (with subject label attached)
  document.querySelectorAll('.subject-check:checked').forEach(subCb => {
    const key = subCb.dataset.subject;
    const subject = state.subjects[key];
    const words = [];
    document.querySelectorAll(`.chapter-check[data-subject="${key}"]:checked`).forEach(chCb => {
      const chapter = subject.chapters.find(c => c.id === chCb.dataset.chapter);
      if (chapter) {
        chapter.words.forEach(w => words.push({ en: w.en, jp: w.jp, subject: subject.label }));
      }
    });
    if (words.length) pools[key] = shuffle(words);
  });
  return pools;
}

function buildRounds(pools) {
  const keys = Object.keys(pools);
  const n = keys.length;
  const per = Math.floor(WORDS_PER_ROUND / n);
  const remainder = WORDS_PER_ROUND - per * n;

  const round1 = [];
  const round2 = [];
  const shortfalls = [];

  keys.forEach((key, idx) => {
    const takeR1 = per + (idx < remainder ? 1 : 0);
    const takeR2 = per + (idx < remainder ? 1 : 0);
    const needed = takeR1 + takeR2;
    const pool = pools[key];
    if (pool.length < needed) {
      shortfalls.push({ label: state.subjects[key].label, needed, have: pool.length });
    } else {
      round1.push(...pool.slice(0, takeR1));
      round2.push(...pool.slice(takeR1, takeR1 + takeR2));
    }
  });

  return { round1: shuffle(round1), round2: shuffle(round2), shortfalls };
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

  const pools = getSelectedPools();
  if (Object.keys(pools).length === 0) {
    showSetupError('Choose at least one subject and chapter to practice.');
    return;
  }

  const { round1, round2, shortfalls } = buildRounds(pools);
  if (shortfalls.length) {
    const detail = shortfalls.map(s => `${s.label} needs ${s.needed}, has ${s.have}`).join('; ');
    showSetupError(`Not enough words in the selected chapters (${detail}). Select more chapters.`);
    return;
  }

  state.players.p1 = p1;
  state.players.p2 = p2;
  state.round1.words = round1;
  state.round2.words = round2;
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
  document.querySelectorAll('.subject-check').forEach(cb => {
    cb.checked = false;
    const chapterList = document.querySelector(`[data-subject-chapters="${cb.dataset.subject}"]`);
    if (chapterList) chapterList.classList.add('disabled');
  });
  document.querySelectorAll('.chapter-check').forEach(cb => cb.checked = true);
  clearSetupError();
  showScreen('screen-setup');
});

// ---- init -----------------------------------------------------------
loadData();
