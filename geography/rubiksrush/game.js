(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const PALETTE = ['red', 'blue', 'green', 'orange', 'yellow', 'white'];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PARTNER_ROUNDS = 10;
const PARTNER_ROUND_SECONDS = 20;
const SOLO_BONUS_SECONDS = 2;

const settings = { sound: true, speak: true, time: 60 };
let G = null, timerId = null, AC = null;

/* ---------------- audio + speech ---------------- */
function beep(freq, dur = 0.1, type = 'sine', vol = 0.15) {
  if (!settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  } catch (e) { /* audio not available */ }
}
const sfx = {
  good: () => beep(660, 0.08),
  bad: () => beep(150, 0.25, 'sawtooth', 0.12),
  win: () => { beep(523, 0.1); setTimeout(() => beep(659, 0.1), 100); setTimeout(() => beep(784, 0.18), 200); }
};
function say(text) {
  if (!settings.speak || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.85;
    speechSynthesis.speak(u);
  } catch (e) { /* speech not available */ }
}

/* ---------------- screens + menu ---------------- */
function show(name) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === name));
}
function refreshMenu() {
  $('#chapterTitle').textContent = CHAPTER.title;
  $('#optSound').textContent = 'Sound: ' + (settings.sound ? 'ON' : 'OFF');
  $('#optSpeak').textContent = 'Read aloud: ' + (settings.speak ? 'ON' : 'OFF');
  $$('[data-time]').forEach(b => b.classList.toggle('on', +b.dataset.time === settings.time));
}
$('#optSound').addEventListener('click', () => { settings.sound = !settings.sound; refreshMenu(); });
$('#optSpeak').addEventListener('click', () => { settings.speak = !settings.speak; refreshMenu(); });
$$('[data-time]').forEach(b => b.addEventListener('click', () => { settings.time = +b.dataset.time; refreshMenu(); }));
$$('[data-mode]').forEach(b => b.addEventListener('click', () => startGame(b.dataset.mode)));
$('#quit').addEventListener('click', toMenu);
$$('.say').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); if (G && G.cur) say(G.cur.speak); }));

function toMenu() {
  stopTimer();
  if (G) G.ended = true;
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  hideBanner();
  show('menu');
}

/* ---------------- round generation ---------------- */
function makeRound() {
  const cats = CHAPTER.categories, facts = CHAPTER.facts || [];
  const allItems = [...new Set(cats.flatMap(c => c.items))];
  let round = null;

  for (let tries = 0; tries < 25 && !round; tries++) {
    const useFact = facts.length > 0 && Math.random() < 0.3;
    if (useFact) {
      const f = pick(facts), key = 'f:' + f.q;
      if (G.recent.includes(key) && tries < 20) continue;
      const cat = cats.find(c => c.name === f.group);
      const pool = shuffle((cat ? cat.items : []).filter(i => i !== f.a));
      const rest = shuffle(allItems.filter(i => i !== f.a && !pool.includes(i)));
      const distract = pool.concat(rest).slice(0, 8);
      round = { key, type: 'fact', clue: f.q, speak: f.q.replace(/\.\.\.$/, ' blank'), answerText: f.a,
        targets: [f.a], tiles: [{ text: f.a, correct: true }].concat(distract.map(t => ({ text: t, correct: false }))) };
    } else {
      const c = pick(cats), key = 'c:' + c.name;
      if (G.recent.includes(key) && tries < 20) continue;
      const targets = shuffle(c.items).slice(0, Math.min(3, c.items.length));
      const others = shuffle(allItems.filter(i => !c.items.includes(i)));
      const distract = others.slice(0, 9 - targets.length);
      round = { key, type: 'category', clue: c.clue, speak: c.clue.replace(/^Tap /, 'Tap '), answerText: targets.join(', '),
        targets, tiles: targets.map(t => ({ text: t, correct: true })).concat(distract.map(t => ({ text: t, correct: false }))) };
    }
  }
  G.recent.push(round.key);
  if (G.recent.length > 4) G.recent.shift();
  return round;
}

/* ---------------- game flow ---------------- */
function startGame(mode) {
  stopTimer();
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume && AC.resume(); } catch (e) { /* ignore */ }
  const players = mode === 'solo' ? 1 : 2;
  G = {
    mode, players, scores: [0, 0], round: 0, cleared: 0, review: [], recent: [], cur: null,
    found: [0, 0], lockedUntil: [0, 0], layout: [[], []], els: [[], []],
    busy: false, ended: false, mistake: false, deadline: 0
  };
  document.body.classList.toggle('solo', mode === 'solo');
  $('#zone0 .pname').textContent = mode === 'solo' ? 'Score' : 'Player 1';
  show('game');
  if (mode === 'solo') G.deadline = Date.now() + settings.time * 1000;
  nextRound();
  timerId = setInterval(tick, 100);
}
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

function nextRound() {
  if (!G || G.ended) return;
  if (G.mode === 'partner' && G.round >= PARTNER_ROUNDS) return endGame();
  G.round++;
  G.busy = false; G.mistake = false;
  G.found = [0, 0]; G.lockedUntil = [0, 0];
  G.cur = makeRound();
  if (G.mode === 'partner') G.deadline = Date.now() + PARTNER_ROUND_SECONDS * 1000;
  hideBanner();
  renderRound();
  updateHud();
  say(G.cur.speak);
}

function renderRound() {
  const r = G.cur;
  const cols = shuffle(PALETTE).concat(shuffle(PALETTE));
  for (let p = 0; p < G.players; p++) {
    const z = $('#zone' + p);
    z.classList.remove('locked');
    $('.clue-text', z).textContent = r.clue;
    const grid = $('.grid', z);
    grid.innerHTML = '';
    G.els[p] = [];
    G.layout[p] = shuffle(r.tiles);
    G.layout[p].forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'tile c-' + cols[i];
      b.textContent = t.text;
      b.addEventListener('pointerdown', e => { e.preventDefault(); onTap(p, i); });
      grid.appendChild(b);
      G.els[p].push(b);
    });
  }
}

function updateHud() {
  $('#zone0 .pscore').textContent = G.mode === 'solo' ? G.scores[0] : '⭐ ' + G.scores[0];
  $('#zone1 .pscore').textContent = '⭐ ' + G.scores[1];
  if (G.mode === 'partner') $('#info').textContent = 'Round ' + G.round + ' / ' + PARTNER_ROUNDS;
}

function tick() {
  if (!G || G.ended) return;
  const left = Math.max(0, (G.deadline - Date.now()) / 1000);
  if (G.mode === 'solo') {
    $('#info').textContent = '⏱ ' + Math.ceil(left) + 's   ·   Cleared: ' + G.cleared;
    $('#bar').style.transform = 'scaleX(' + Math.min(1, left / settings.time) + ')';
    if (left <= 0) endGame();
  } else if (!G.busy) {
    $('#bar').style.transform = 'scaleX(' + Math.min(1, left / PARTNER_ROUND_SECONDS) + ')';
    if (left <= 0) roundDone(null);
  }
}

function onTap(p, idx) {
  if (!G || G.ended || G.busy) return;
  if (G.lockedUntil[p] > Date.now()) return;
  const el = G.els[p][idx], t = G.layout[p][idx];
  if (!el || el.classList.contains('found')) return;

  if (t.correct) {
    el.classList.add('found');
    G.found[p]++;
    sfx.good();
    say(t.text);
    if (G.mode === 'solo') { G.scores[0] += 10; updateHud(); }
    if (G.found[p] >= G.cur.targets.length) roundDone(p);
  } else {
    sfx.bad();
    el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    if (!G.mistake) { G.mistake = true; G.review.push({ clue: G.cur.clue, answer: G.cur.answerText }); }
    const lockMs = G.mode === 'solo' ? 500 : 1500;
    G.lockedUntil[p] = Date.now() + lockMs;
    const z = $('#zone' + p);
    z.classList.add('locked');
    setTimeout(() => z.classList.remove('locked'), lockMs);
    if (G.mode === 'solo') { G.scores[0] = Math.max(0, G.scores[0] - 5); updateHud(); }
  }
}

function roundDone(winner) {
  if (!G || G.ended || G.busy) return;
  G.busy = true;
  if (G.mode === 'solo') {
    G.scores[0] += 20; G.cleared++;
    G.deadline += SOLO_BONUS_SECONDS * 1000;
    updateHud(); sfx.win();
    setTimeout(nextRound, 450);
    return;
  }
  // partner mode
  if (winner === null) {
    sfx.bad();
    for (let p = 0; p < 2; p++) G.els[p].forEach((b, i) => { if (G.layout[p][i].correct) b.classList.add('reveal'); });
    showBanner("Time's up!", 'Answer: ' + G.cur.answerText);
  } else {
    G.scores[winner]++;
    sfx.win();
    showBanner('Player ' + (winner + 1) + ' wins the round!', 'Answer: ' + G.cur.answerText);
  }
  updateHud();
  setTimeout(nextRound, 2400);
}

/* ---------------- banner ---------------- */
function showBanner(msg, sub) {
  $$('#banner .bmsg').forEach(e => e.textContent = msg);
  $$('#banner .bsub').forEach(e => e.textContent = sub || '');
  $('#banner').classList.add('show');
}
function hideBanner() { $('#banner').classList.remove('show'); }

/* ---------------- results ---------------- */
function endGame() {
  if (!G || G.ended) return;
  G.ended = true;
  stopTimer();
  hideBanner();
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }

  let head;
  if (G.mode === 'solo') {
    head = '<h1><span>Time!</span></h1><p class="sub">Score: <b>' + G.scores[0] + '</b> &nbsp;·&nbsp; Rounds cleared: <b>' + G.cleared + '</b></p>';
  } else {
    const [a, b] = G.scores;
    const msg = a === b ? "It's a tie!" : 'Player ' + (a > b ? 1 : 2) + ' wins!';
    head = '<h1><span>' + msg + '</span></h1><p class="sub">Player 1: <b>' + a + '</b> &nbsp;·&nbsp; Player 2: <b>' + b + '</b></p>';
  }
  const review = G.review.length
    ? '<div class="review"><h3>Review these:</h3><ul>' +
      G.review.map(r => '<li>' + esc(r.clue) + ' → <b>' + esc(r.answer) + '</b></li>').join('') + '</ul></div>'
    : '<div class="review"><h3>No mistakes. Great job! 🎉</h3></div>';

  $('#results').innerHTML = head + review +
    '<button class="big again" id="again">Play again</button>' +
    '<button class="big ghost" id="home">Menu</button>';
  show('results');
  sfx.win();
  const mode = G.mode;
  $('#again').addEventListener('click', () => startGame(mode));
  $('#home').addEventListener('click', toMenu);
}

/* ---------------- init ---------------- */
refreshMenu();
})();
