// ==========================================
// Angle Challenge
// script.js
// Part 1 - Setup & Initialization
// ==========================================

// ---------- DOM Elements ----------

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const measureScreen = document.getElementById("measure-screen");
const resultScreen = document.getElementById("result-screen");
const gameoverScreen = document.getElementById("gameover-screen");

const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");
const rollBtn = document.getElementById("rollBtn");
const nextBtn = document.getElementById("nextBtn");

const playAgainBtn = document.getElementById("playAgainBtn");
const newGameBtn = document.getElementById("newGameBtn");

const player1Input = document.getElementById("player1");
const player2Input = document.getElementById("player2");

const difficultySelect = document.getElementById("difficulty");
const roundsSelect = document.getElementById("rounds");

const currentPlayerText = document.getElementById("currentPlayer");
const angleDisplay = document.getElementById("angleDisplay");

const targetAngleText = document.getElementById("targetAngle");

const score1Text = document.getElementById("score1");
const score2Text = document.getElementById("score2");

const roundInfo = document.getElementById("roundInfo");

const measuredAngleText = document.getElementById("measuredAngle");
const differenceText = document.getElementById("differenceText");

const diceDisplay = document.getElementById("diceDisplay");
const resultText = document.getElementById("resultText");

const winnerText = document.getElementById("winnerText");
const finalScores = document.getElementById("finalScores");

// ---------- Game Object ----------

const game = {

    players: [],

    currentPlayer: 0,

    currentRound: 1,

    totalRounds: 10,

    difficulty: "easy",

    targetAngle: 0,

    measuredAngle: 0,

    selectedType: "",

    difference: 0,

    diceRoll: 1

};

// ---------- Utility ----------

function showScreen(screen){

    startScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    measureScreen.classList.add("hidden");
    resultScreen.classList.add("hidden");
    gameoverScreen.classList.add("hidden");

    screen.classList.remove("hidden");

}

// ---------- Random Integer ----------

function randomInt(min,max){

    return Math.floor(Math.random()*(max-min+1))+min;

}

// ---------- Generate Angle ----------

function generateAngle(){

    const acute = Math.random() < 0.5;

    switch(game.difficulty){

        case "easy":

            if(acute){

                const values=[10,20,30,40,50,60,70,80];

                return values[randomInt(0,values.length-1)];

            }else{

                const values=[100,110,120,130,140,150,160,170];

                return values[randomInt(0,values.length-1)];

            }

        case "medium":

            if(acute){

                return randomInt(1,17)*5;

            }else{

                return 90+(randomInt(1,17)*5);

            }

        case "hard":

            if(acute){

                return randomInt(1,89);

            }else{

                return randomInt(91,179);

            }

    }

}

// ---------- Start Turn ----------

function startTurn(){

    const player=game.players[game.currentPlayer];

    currentPlayerText.textContent=player.name+"'s Turn";

    game.targetAngle=generateAngle();

    angleDisplay.textContent=game.targetAngle+"°";

    targetAngleText.textContent=game.targetAngle+"°";

    game.selectedType="";

    document.querySelectorAll("input[name='type']").forEach(r=>r.checked=false);

    updateScoreboard();

    showScreen(gameScreen);

}

// ---------- Update Scoreboard ----------

function updateScoreboard(){

    roundInfo.textContent="Round "+game.currentRound+" / "+game.totalRounds;

    score1Text.textContent=
        game.players[0].name+": "+game.players[0].score+" pts";

    score2Text.textContent=
        game.players[1].name+": "+game.players[1].score+" pts";

}

// ---------- Start Game ----------

function startGame(){

    const p1=player1Input.value.trim() || "Player 1";
    const p2=player2Input.value.trim() || "Player 2";

    game.players=[

        {

            name:p1,

            score:0

        },

        {

            name:p2,

            score:0

        }

    ];

    game.currentRound=1;

    game.totalRounds=parseInt(roundsSelect.value);

    game.difficulty=difficultySelect.value;

    game.currentPlayer=randomInt(0,1);

    startTurn();

}

// ---------- Finish Drawing ----------

finishBtn.addEventListener("click",()=>{

    const chosen=document.querySelector("input[name='type']:checked");

    if(!chosen){

        alert("Choose Acute or Obtuse.");

        return;

    }

    game.selectedType=chosen.value;

    game.measuredAngle=game.targetAngle;

    measuredAngleText.textContent=game.measuredAngle+"°";

    differenceText.textContent="Difference: 0°";

    showScreen(measureScreen);

});

// ---------- Start Button ----------

startBtn.addEventListener("click",startGame);

// ==========================================
// Part 2 - Measurement & Scoring
// ==========================================

const plusBtn = document.getElementById("plusBtn");
const minusBtn = document.getElementById("minusBtn");

let holdTimer = null;

// ---------- Update Measured Angle ----------

function updateMeasuredAngle() {

    if (game.measuredAngle < 1)
        game.measuredAngle = 1;

    if (game.measuredAngle > 179)
        game.measuredAngle = 179;

    measuredAngleText.textContent = game.measuredAngle + "°";

    game.difference = Math.abs(
        game.targetAngle - game.measuredAngle
    );

    differenceText.textContent =
        "Difference: " + game.difference + "°";

}

// ---------- Increase / Decrease ----------

function increaseAngle() {

    game.measuredAngle++;

    updateMeasuredAngle();

}

function decreaseAngle() {

    game.measuredAngle--;

    updateMeasuredAngle();

}

// ---------- Hold Support ----------

function beginHold(action){

    action();

    holdTimer = setInterval(action,120);

}

function endHold(){

    clearInterval(holdTimer);

}

["mouseup","mouseleave","touchend","touchcancel"].forEach(event=>{

    plusBtn.addEventListener(event,endHold);

    minusBtn.addEventListener(event,endHold);

});

plusBtn.addEventListener("mousedown",()=>beginHold(increaseAngle));
minusBtn.addEventListener("mousedown",()=>beginHold(decreaseAngle));

plusBtn.addEventListener("touchstart",(e)=>{

    e.preventDefault();

    beginHold(increaseAngle);

});

minusBtn.addEventListener("touchstart",(e)=>{

    e.preventDefault();

    beginHold(decreaseAngle);

});

// ---------- Dice ----------

const diceFaces = [

    "⚀",
    "⚁",
    "⚂",
    "⚃",
    "⚄",
    "⚅"

];

// ---------- Roll Dice ----------

rollBtn.addEventListener("click",rollDice);

function rollDice(){

    rollBtn.disabled = true;

    let count = 0;

    const animation = setInterval(()=>{

        const face = randomInt(1,6);

        diceDisplay.textContent = diceFaces[face-1];

        count++;

        if(count>12){

            clearInterval(animation);

            finishRoll();

        }

    },80);

}

// ---------- Finish Roll ----------

function finishRoll(){

    game.diceRoll = randomInt(1,6);

    diceDisplay.textContent =
        diceFaces[game.diceRoll-1];

    calculateTurn();

}

// ---------- Score Turn ----------

function calculateTurn(){

    let earned = 0;

    let html = "";

    const correctType =
        game.targetAngle < 90
            ? "acute"
            : "obtuse";

    html +=
        "<strong>Target:</strong> "
        + game.targetAngle
        + "°<br>";

    html +=
        "<strong>Measured:</strong> "
        + game.measuredAngle
        + "°<br>";

    html +=
        "<strong>Difference:</strong> "
        + game.difference
        + "°<br>";

    html +=
        "<strong>Dice:</strong> "
        + game.diceRoll
        + "<br><br>";

    // Classification

    if(game.selectedType===correctType){

        earned++;

        html +=
            "✅ Classification Correct (+1)<br>";

    }else{

        html +=
            "❌ Classification Incorrect<br>";

    }

    // Accuracy

    if(game.difference < game.diceRoll){

        earned++;

        html +=
            "✅ Accurate Drawing (+1)<br>";

    }else{

        html +=
            "❌ No Accuracy Point<br>";

    }

    game.players[
        game.currentPlayer
    ].score += earned;

    html +=
        "<br><strong>Points This Turn: "
        + earned
        + "</strong>";

    resultText.innerHTML = html;

    updateScoreboard();

    showScreen(resultScreen);

    rollBtn.disabled = false;

}

// ==========================================
// Part 3 - Game Flow & Game Over
// ==========================================

// ---------- Next Player ----------

nextBtn.addEventListener("click", nextTurn);

function nextTurn() {

    // Switch player
    game.currentPlayer = 1 - game.currentPlayer;

    // Every time Player 2 finishes,
    // advance the round.
    if (game.currentPlayer === 0) {
        game.currentRound++;
    }

    // End of game?
    if (game.currentRound > game.totalRounds) {

        endGame();
        return;

    }

    startTurn();

}

// ---------- End Game ----------

function endGame() {

    showScreen(gameoverScreen);

    const p1 = game.players[0];
    const p2 = game.players[1];

    if (p1.score > p2.score) {

        winnerText.textContent =
            "🏆 Winner: " + p1.name;

    }
    else if (p2.score > p1.score) {

        winnerText.textContent =
            "🏆 Winner: " + p2.name;

    }
    else {

        winnerText.textContent =
            "🤝 It's a Draw!";

    }

    finalScores.innerHTML =

        "<strong>" + p1.name + "</strong>: "
        + p1.score
        + " points<br><br>"

        +

        "<strong>" + p2.name + "</strong>: "
        + p2.score
        + " points";

}

// ---------- Play Again ----------

playAgainBtn.addEventListener("click", () => {

    game.players[0].score = 0;
    game.players[1].score = 0;

    game.currentRound = 1;

    // Randomly choose who starts again
    game.currentPlayer = randomInt(0,1);

    startTurn();

});

// ---------- New Game ----------

newGameBtn.addEventListener("click", () => {

    player1Input.value = "";
    player2Input.value = "";

    showScreen(startScreen);

});

// ---------- Initialise ----------

showScreen(startScreen);
