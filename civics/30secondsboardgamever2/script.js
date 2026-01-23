let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

let wordPool = {};
let remainingWords = [];

let timer = null;
let timeLeft = 30;

let teamPositions = { Blue: 0, Red: 0 };

const boardSquares = [
  {x:120,y:150},{x:200,y:150},{x:280,y:150},
  {x:280,y:230},{x:280,y:310},
  {x:200,y:310},{x:120,y:310},
  {x:120,y:230}
];

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

function updateToken(team) {
  let pos = Math.min(teamPositions[team], boardSquares.length - 1);
  teamPositions[team] = pos;
  const p = boardSquares[pos];
  const token = document.getElementById(team === "Blue" ? "blue-token" : "red-token");
  token.style.left = p.x + "px";
  token.style.top = p.y + "px";
}

async function loadChapters() {
  const res = await fetch("chapters.json");
  wordPool = await res.json();

  chapterSelection.innerHTML = "";
  for (const ch in wordPool) {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = ch;
    cb.checked = true;

    const label = document.createElement("label");
    label.textContent = ch;

    const div = document.createElement("div");
    div.append(cb,label);
    chapterSelection.appendChild(div);
  }
}

function addPlayerRow() {
  const row = document.createElement("div");
  row.className = "player-row";

  const input = document.createElement("input");
  input.placeholder = "Player name";
  input.required = true;

  const select = document.createElement("select");
  select.innerHTML = `
    <option value="Blue">Blue Team</option>
    <option value="Red">Red Team</option>
  `;

  row.append(input,select);
  playersContainer.appendChild(row);
}

for (let i=0;i<4;i++) addPlayerRow();
addPlayerBtn.onclick = addPlayerRow;

setupForm.onsubmit = e => {
  e.preventDefault();

  players = [];
  document.querySelectorAll(".player-row").forEach(r=>{
    const name = r.querySelector("input").value.trim();
    const team = r.querySelector("select").value;
    if(name) players.push({name,team});
  });

  const selected = [...chapterSelection.querySelectorAll("input:checked")]
    .map(cb=>wordPool[cb.value])
    .flat();

  remainingWords = [...new Set(selected)];

  buildTurnOrder();

  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  teamPositions.Blue=0;
  teamPositions.Red=0;
  updateToken("Blue");
  updateToken("Red");

  startTurn();
};

function buildTurnOrder() {
  const blue = players.filter(p=>p.team==="Blue");
  const red = players.filter(p=>p.team==="Red");
  turnOrder=[];
  const max=Math.max(blue.length,red.length);
  for(let i=0;i<max;i++){
    if(blue[i])turnOrder.push(blue[i]);
    if(red[i])turnOrder.push(red[i]);
  }
}

function startTurn(){
  clearInterval(timer);
  const p=turnOrder[currentTurnIndex];
  currentPlayerDisplay.textContent=`${p.team} – ${p.name}`;
  diceResultMessage.textContent="";
  wordDisplayContainer.innerHTML="";
  rollDiceBtn.style.display="inline-block";
  startRoundBtn.classList.add("hidden");
  resultsDisplay.classList.add("hidden");
  timerContainer.classList.add("hidden");
}

rollDiceBtn.onclick=()=>{
  const roll=Math.floor(Math.random()*2);
  diceResultMessage.textContent=`Dice: ${roll}`;
  rollDiceBtn.style.display="none";
  startRoundBtn.classList.remove("hidden");
};

startRoundBtn.onclick=()=>{
  startRoundBtn.classList.add("hidden");
  timeLeft=30;
  timerDisplay.textContent=timeLeft;
  timerContainer.classList.remove("hidden");

  if(remainingWords.length<5){
    remainingWords=[...Object.values(wordPool).flat()];
  }

  const words=remainingWords.splice(0,5);
  const rows=[];
  wordDisplayContainer.innerHTML="";

  words.forEach(w=>{
    const row=document.createElement("div");
    row.className="word-row";
    const span=document.createElement("span");
    span.textContent=w;
    const btn=document.createElement("button");
    btn.textContent="Correct";
    btn.onclick=()=>{btn.disabled=true;row.dataset.correct="true";};
    row.append(span,btn);
    wordDisplayContainer.appendChild(row);
    rows.push(row);
  });

  timer=setInterval(()=>{
    timeLeft--;
    timerDisplay.textContent=timeLeft;
    if(timeLeft<=0){
      clearInterval(timer);
      document.querySelectorAll(".word-row button").forEach(b=>b.disabled=true);
      endRound(rows);
    }
  },1000);
};

function endRound(rows){
  timerContainer.classList.add("hidden");

  let correct=rows.filter(r=>r.dataset.correct==="true").length;
  const dice=parseInt(diceResultMessage.textContent.match(/\d+/)[0]);
  const spaces=Math.max(0,correct-dice);

  const player=turnOrder[currentTurnIndex];
  teamPositions[player.team]+=spaces;
  updateToken(player.team);

  if(teamPositions[player.team]>=boardSquares.length-1){
    alert(player.team+" Team Wins!");
    location.reload();
  }

  turnSummary.textContent=`Correct: ${correct} | Dice: ${dice} | Move: ${spaces}`;

  currentTurnIndex=(currentTurnIndex+1)%turnOrder.length;
  const next=turnOrder[currentTurnIndex];
  nextPlayerDisplay.textContent=`Next: ${next.team} – ${next.name}`;
  resultsDisplay.classList.remove("hidden");
}

nextRoundBtn.onclick=startTurn;

loadChapters();
