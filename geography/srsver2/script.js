const app = document.getElementById("app");

const CHAPTER_FILES = [
 "chapter1","chapter2","chapter3","chapter4","chapter5","chapter6","chapter7","chapter8","chapter9","chapter10",
 "chapter11","chapter12","chapter13","chapter14","chapter15","chapter16","chapter17","chapter18","chapter19","chapter20",
 "chapter21","chapter22","chapter23","chapter24","chapter25","chapter26","chapter27","chapter28","chapter29","chapter30",
 "chapter31","chapter32","chapter33","chapter34","chapter35","chapter36","chapter37","chapter38","chapter39","chapter40"
];

const MAX_NEW_PER_DAY = 10;
const MAX_ITEMS_PER_SESSION = 20;
const REQUIRED_STREAK = 5;
const MASTERY_INTERVAL = 30; // days

let sessionCount = 0;
let failedThisSession = new Set();

let state = {
  nickname: localStorage.getItem("nickname"),
  activeChapters: JSON.parse(localStorage.getItem("activeChapters") || "[]"),
  progress: JSON.parse(localStorage.getItem("progress") || "{}"),
  todayNewCount: 0,
  stats: { correct: 0, wrong: 0, new: 0, review: 0 }
};

let vocab = [];
let newQueue = [];
let learningQueue = [];
let reviewQueue = [];
let current = null;
let direction = null;

/* ================= STORAGE ================= */

function save() {
  localStorage.setItem("nickname", state.nickname);
  localStorage.setItem("activeChapters", JSON.stringify(state.activeChapters));
  localStorage.setItem("progress", JSON.stringify(state.progress));
  localStorage.setItem("todayNewCount", state.todayNewCount);
}

function todayString() {
  return new Date().toISOString().slice(0,10);
}

function resetDailyCountIfNeeded() {
  const last = localStorage.getItem("lastStudyDate");
  const today = todayString();
  if (last !== today) {
    state.todayNewCount = 0;
    localStorage.setItem("lastStudyDate", today);
  }
}

/* ================= UI ================= */

function showNicknameScreen() {
  app.innerHTML = `
    <h2>Enter your nickname</h2>
    <input id="nickInput">
    <button onclick="setNickname()">Start</button>
  `;
}

function setNickname() {
  const val = document.getElementById("nickInput").value.trim();
  if (!val) return;
  state.nickname = val;
  save();
  showChapterScreen();
}

function showChapterScreen() {
  let html = `<h2>Select chapters</h2><div class="chapter-grid">`;
  CHAPTER_FILES.forEach((ch,i)=>{
    const selected = state.activeChapters.includes(ch) ? "selected":"";
    html += `<div class="chapter-tile ${selected}" onclick="toggleChapter('${ch}',this)">${i+1}</div>`;
  });
  html += `</div><button onclick="startStudy()">Save & Start Study</button>`;
  app.innerHTML = html;
}

function toggleChapter(ch, el) {
  if (state.activeChapters.includes(ch)) {
    state.activeChapters = state.activeChapters.filter(c=>c!==ch);
    el.classList.remove("selected");
  } else {
    state.activeChapters.push(ch);
    el.classList.add("selected");
  }
  save();
}

/* ================= LOAD ================= */

async function loadVocab() {
  vocab = [];
  for (let ch of state.activeChapters) {
    const res = await fetch("data/"+ch+".json");
    const data = await res.json();
    vocab = vocab.concat(data);
  }
}

/* ================= SRS CORE ================= */

async function startStudy() {
  if (state.activeChapters.length===0) return alert("Select at least one chapter.");
  resetDailyCountIfNeeded();
  sessionCount = 0;
  failedThisSession = new Set();
  state.stats = { correct: 0, wrong: 0, new: 0, review: 0 };
  await loadVocab();
  buildQueues();
  nextQuestion();
}

function buildQueues() {
  newQueue = [];
  learningQueue = [];
  reviewQueue = [];
  const now = Date.now();

  for (let item of vocab) {
    let p = state.progress[item.id];

    if (!p && state.todayNewCount < MAX_NEW_PER_DAY) {
      newQueue.push(item);
    } 
    else if (p && !p.mastered && now >= p.nextReview) {
      if (p.status === "learning") learningQueue.push(item);
      else reviewQueue.push(item);
    }
  }

  shuffle(newQueue);
  shuffle(learningQueue);
  shuffle(reviewQueue);
}

function nextQuestion() {
  if (sessionCount >= MAX_ITEMS_PER_SESSION) return showResults();
  if (!reviewQueue.length && !learningQueue.length && !newQueue.length) return showResults();

  if (learningQueue.length) current = learningQueue.shift();
  else if (reviewQueue.length) current = reviewQueue.shift();
  else current = newQueue.shift();

  direction = Math.random()<0.5?"en-jp":"jp-en";

  const prompt = direction==="en-jp"?current.en:current.jp;
  const label = direction==="en-jp"?"日本語でタイプ:":"Type the English word:";

  app.innerHTML = `
    <div class="word">${prompt}</div>
    <div>${label}</div>
    <input id="answer">
    <button onclick="submitAnswer()">Submit</button>
  `;
}

/* ================= CHECKING ================= */

function normalizeJP(str) {
  return str.replace(/[\u30a1-\u30f6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0)-0x60)
  );
}

function levenshtein(a,b){
  const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)dp[i][0]=i;
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      dp[i][j]=Math.min(
        dp[i-1][j]+1,
        dp[i][j-1]+1,
        dp[i-1][j-1]+(a[i-1]==b[j-1]?0:1)
      );
    }
  }
  return dp[a.length][b.length];
}

function submitAnswer() {
  const input = document.getElementById("answer").value.trim();
  let result = "wrong";

  if (direction==="en-jp") {
    const a = normalizeJP(input);
    if (a===normalizeJP(current.jp) || a===normalizeJP(current.kana)) result="correct";
  } else {
    const dist = levenshtein(input.toLowerCase(), current.en.toLowerCase());
    if (dist===0) result="correct";
    else if (dist<=1) result="partial";
  }

  updateProgress(result);
  sessionCount++;
  showFeedback(result);
}

function updateProgress(result) {
  let p = state.progress[current.id];

  if (!p) {
    p = {status:"learning", interval:1, ease:2.3, streak:0, mastered:false, nextReview:Date.now()};
    state.progress[current.id]=p;
    state.stats.new++;
    state.todayNewCount++;
  } else {
    state.stats.review++;
  }

  if (result==="correct") {
    p.streak++;
    p.interval = Math.round(p.interval * p.ease);
    p.ease = Math.min(p.ease+0.1,3);
    state.stats.correct++;
  } 
  else if (result==="partial") {
    p.interval = Math.max(1, Math.round(p.interval*0.8));
    state.stats.correct++;
  } 
  else {
    p.streak=0;
    p.interval=1;
    p.status="learning";
    state.stats.wrong++;
    if (!failedThisSession.has(current.id)) {
      failedThisSession.add(current.id);
      learningQueue.push(current);
    }
  }

  if (p.streak>=REQUIRED_STREAK && p.interval>=MASTERY_INTERVAL) {
    p.mastered=true;
  } 
  else if (p.interval>=3) {
    p.status="review";
  }

  p.nextReview = Date.now()+p.interval*86400000;
  save();
}

/* ================= MASTERY BAR ================= */

function masteryPercent(p) {
  const streakPart = Math.min(p.streak / REQUIRED_STREAK, 1);
  const intervalPart = Math.min(p.interval / MASTERY_INTERVAL, 1);
  return Math.round((streakPart*0.5 + intervalPart*0.5) * 100);
}

/* ================= FEEDBACK ================= */

function showFeedback(result) {
  let msg = result==="correct"?"✔ Correct!":result==="partial"?"⚠ Almost!":"✘ Incorrect";
  let p = state.progress[current.id];
  let percent = masteryPercent(p);

  app.innerHTML = `
    <h3>${msg}${p.mastered?" (Mastered 🎉)":""}</h3>
    <div>${current.en} = ${current.jp}</div>
    <div>${current.kana}</div>

    <div style="margin:10px 0;">
      <div style="background:#ddd;height:10px;border-radius:5px;">
        <div style="background:#4caf50;height:10px;width:${percent}%;border-radius:5px;"></div>
      </div>
      <small>Mastery: ${percent}%</small>
    </div>

    <div class="example">${current.example}</div>
    <button onclick="nextQuestion()">Next</button>
  `;
}

/* ================= RESULTS ================= */

function showResults() {
  const now = new Date();
  const chapters = state.activeChapters.map(ch=>ch.replace("chapter","")).join(", ");
  app.innerHTML = `
    <h2>Junior High Geography SRS</h2>
    <p>Nickname: ${state.nickname}</p>
    <p>Date: ${now.toLocaleDateString()}</p>
    <p>Chapters studied: ${chapters}</p>
    <p>New: ${state.stats.new}</p>
    <p>Review: ${state.stats.review}</p>
    <p>Correct: ${state.stats.correct}</p>
    <p>Incorrect: ${state.stats.wrong}</p>
    <p>Accuracy: ${Math.round(state.stats.correct/(state.stats.correct+state.stats.wrong)*100)||0}%</p>
    <p><strong>Great work today!</strong></p>
  `;
}

/* ================= UTILS ================= */

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

/* ================= START ================= */

if (!state.nickname) showNicknameScreen();
else showChapterScreen();
