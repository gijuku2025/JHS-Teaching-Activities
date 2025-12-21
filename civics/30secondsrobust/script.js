// ---------- GLOBAL STATE ----------
let players = [];
let turnOrder = [];
let currentTurnIndex = 0;

// ---------- DOM ----------
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player-btn");
const setupForm = document.getElementById("setup-form");
const currentPlayerSpan = document.getElementById("current-player");

// ---------- INIT ----------
addPlayerRow();
addPlayerRow(); //
