let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let remainingWords = [];
let usedWords = [];

let timer = null;
let timeLeft = 30;
let currentDiceRoll = 0;

let teamPositions = { Blue: 0, Red: 0 };

// GRID SETTINGS (for your board image)
const ROWS = 4;
const COLS = 7;

/* Path: bottom row → up right side → across top */
const boardPath = [
  [3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],
  [2,6],[1,6],[0,6],
  [0,5],[0,4],[0,3],[0,2],[0,1],[0,0]
];

// DOM
const startScreen = document.getElementById("start-screen");
const setupForm = document.getElementById("setup-form");
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const chapterSelection = document.getElementById("chapter-selection");
const gameScreen = document.getElementById("game-screen");

const currentPlayerDisplay = document.getElementById("current-player");
const diceResultMessage = document.getElementById("dice-result-message");
const wordDisplayContainer = document.getElementById("word-display-container");

const rollDiceBtn = document.getElementById("roll-dice-btn");
const startRoundBtn = document.getElementById("start-round-btn");
const timerContainer = document.getElementById("timer-container");
const timerDisplay = document.getElementById("time-left");

const resultsDisplay = document.getElementById("results");
const turnSummary = document.getElementById("turn-summary");
const nextPlayerDisplay = document.getElementById("next-player");
const nextRoundBtn = document.getElementById("next-round-btn");

const boardWrapper = document.getElementById("board-wrapper");
const boardImage = document.getElementById("board-image");

const MAX_WORDS_PER_ROUND = 5;
const DICE_RESULTS = [0,1];

function getSquareSize() {
  return {
    w: boardImage.clientWidth / COLS,
    h: boardImage.clientHeight / ROWS
  };
}

function updateToken(team) {
  teamPositions[team] = Math.min(teamPositions[team], boardPath.length - 1);
  const [row,col] = boardPath[teamPositions[team]];
  const {w,h} = getSquareSize();

  const token = document.getElementById(team==="Blue"?"blue-token":"red-token");
  token.style.left = col * w + w/2 + "px";
  token.style.top  = row * h + h/2 + "px";
}

async function loadChapters() {
  const res = await fetch("chapters.json");
  wordPool = await res.json();

  for (const chapter in wordPool) {
    const div = document.createElement("div");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = chapter;

    const label = document.createElement("label");
    label.textContent = chapter.replace("chapter","Chapter ");

    div.append(cb,label);
    chapterSelection.appendChild(div);
  }
}

function addPlayerRow() {
  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");
  input.placeholder = "Player name";

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.append(input,select);
  playersContainer.appendChild(row);
}

for(let i=0;i<4;i++) addPlayerRow();
addPlayerBtn.onclick = addPlayerRow;

setupForm.onsubmit = e => {
  e.preventDefault();

  players = [];
  document.querySelectorAll(".player-row").forEach(r=>{
    const name = r.querySelector("input").value.trim();
    const team = r.querySelector("select").value;
    if(name) players.push({name,team});
  });

  const chapters = [...chapterSelection.querySelectorAll("input:checked")]
    .map(cb=>wordPool[cb.value]).flat();

  remainingWords = [...new Set(chapters)];
  usedWords = [];

  buildTurnOrder();
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  boardImage.onload = ()=>{
    updateToken("Blue");
    updateToken("Red");
  };

  startTurn();
};

function buildTurnOrder() {
  const blue = players.filter(p=>p.team==="Blue");
  const red  = players.filter(p=>p.team==="Red");
  turnOrder=[];
  const max=Math.max(blue.length,red.length);
  for(let i=0;i<max;i++){
    if(blue[i]) turnOrder.push(blue[i]);
    if(red[i])  turnOrder.push(red[i]);
  }
}

function startTurn() {
  clearInterval(timer);
  boardWrapper.classList.remove("hidden");
  wordDisplayContainer.innerHTML="";
  resultsDisplay.classList.add("hidden");
  timerContainer.classList.add("hidden");

  const p = turnOrder[currentTurnIndex];
  currentPlayerDisplay.textContent=`${p.team} Team – ${p.name}`;
  diceResultMessage.textContent="";

  rollDiceBtn.style.display="inline-block";
  startRoundBtn.classList.add("hidden");
}

rollDiceBtn.onclick=()=>{
  currentDiceRoll=DICE_RESULTS[Math.floor(Math.random()*DICE_RESULTS.length)];
  diceResultMessage.textContent=`Dice Roll: ${currentDiceRoll}`;
  rollDiceBtn.style.display="none";
  startRoundBtn.classList.remove("hidden");
};

startRoundBtn.onclick=()=>{
  boardWrapper.classList.add("hidden");
  startRoundBtn.classList.add("hidden");
  timeLeft=30;
  timerDisplay.textContent=timeLeft;
  timerContainer.classList.remove("hidden");

  const selected=[];
  while(selected.length<MAX_WORDS_PER_ROUND){
    if(!remainingWords.length){
      remainingWords=[...usedWords];
      usedWords=[];
    }
    const w=remainingWords.pop();
    usedWords.push(w);
    selected.push(w);
  }

  const rows=[];
  wordDisplayContainer.innerHTML="";

  selected.forEach(word=>{
    const row=document.createElement("div");
    row.className="word-row";
    const span=document.createElement("span");
    span.textContent=word;
    const btn=document.createElement("button");
    btn.textContent="Correct";
    btn.onclick=()=>{
      btn.disabled=true;
      row.dataset.correct="true";
    };
    row.append(span,btn);
    wordDisplayContainer.appendChild(row);
    rows.push(row);
  });

  timer=setInterval(()=>{
    timeLeft--;
    timerDisplay.textContent=timeLeft;
    if(timeLeft<=0){
      clearInterval(timer);
      rows.forEach(r=>r.querySelector("button").disabled=true);
      endRound(rows);
    }
  },1000);
};

function endRound(rows){
  timerContainer.classList.add("hidden");
  boardWrapper.classList.remove("hidden");

  const correct=rows.filter(r=>r.dataset.correct==="true").length;
  const spaces=Math.max(0,correct-currentDiceRoll);

  const player=turnOrder[currentTurnIndex];
  teamPositions[player.team]+=spaces;
  updateToken(player.team);

  if(teamPositions[player.team]>=boardPath.length-1){
    turnSummary.textContent=`${player.team} Team wins! 🎉`;
    nextPlayerDisplay.textContent="";
    resultsDisplay.classList.remove("hidden");
    return;
  }

  turnSummary.textContent=`Correct: ${correct} | Dice: ${currentDiceRoll} | Move: ${spaces}`;

  currentTurnIndex=(currentTurnIndex+1)%turnOrder.length;
  const next=turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent=`Next: ${next.team} Team – ${next.name}`;
  resultsDisplay.classList.remove("hidden");
}

nextRoundBtn.onclick=startTurn;

loadChapters();
