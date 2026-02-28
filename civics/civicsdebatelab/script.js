let data;
let currentChapter;
let currentCase;
let currentSide;
let chosenArgument;
let strongestChoice;
let otherArgument;

const nickname = localStorage.getItem("nickname") || "Student";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("welcomeText").innerText =
    "Welcome, " + nickname;

  fetch("data.json")
    .then(res => res.json())
    .then(json => {
      data = json;
      loadChapters();
    });
});

function loadChapters() {
  const list = document.getElementById("chapterList");
  list.innerHTML = "";

  data.chapters.forEach(ch => {
    const btn = document.createElement("button");
    btn.innerText = "Chapter " + ch.id + ": " + ch.title;
    btn.onclick = () => openChapter(ch);
    list.appendChild(btn);
  });
}

function openChapter(ch) {
  currentChapter = ch;
  document.getElementById("chapterScreen").classList.add("hidden");
  document.getElementById("caseSelectScreen").classList.remove("hidden");
  document.getElementById("chapterTitle").innerText =
    "Chapter " + ch.id + ": " + ch.title;

  const caseList = document.getElementById("caseList");
  caseList.innerHTML = "";

  ch.cases.forEach(c => {
    const btn = document.createElement("button");
    btn.innerText = c.title;
    btn.onclick = () => openCase(c);
    caseList.appendChild(btn);
  });
}

function goToChapters() {
  document.getElementById("caseSelectScreen").classList.add("hidden");
  document.getElementById("chapterScreen").classList.remove("hidden");
}

function openCase(c) {
  currentCase = c;
  document.getElementById("caseSelectScreen").classList.add("hidden");
  document.getElementById("caseScreen").classList.remove("hidden");

  document.getElementById("caseTitle").innerText = c.title;
  document.getElementById("caseText").innerText = c.text;
}

function assignSide() {
  const history = JSON.parse(localStorage.getItem("caseHistory")) || {};
  const key = "chapter" + currentChapter.id + "_case" + currentCase.id;

  let lastSide = history[key]?.lastSide;

  if (!lastSide) {
    currentSide = Math.random() < 0.5 ? "A" : "B";
  } else {
    currentSide = lastSide === "A" ? "B" : "A";
  }

  history[key] = {
    lastSide: currentSide,
    timesPlayed: (history[key]?.timesPlayed || 0) + 1
  };

  localStorage.setItem("caseHistory", JSON.stringify(history));

  const sideText =
    currentSide === "A" ? currentCase.sideA : currentCase.sideB;

  document.getElementById("caseScreen").classList.add("hidden");
  document.getElementById("sideScreen").classList.remove("hidden");
  document.getElementById("sideText").innerText = sideText;
}

function showArguments() {
  document.getElementById("sideScreen").classList.add("hidden");
  document.getElementById("argumentScreen").classList.remove("hidden");

  document.getElementById("argumentSide").innerText =
    currentSide === "A" ? currentCase.sideA : currentCase.sideB;

  const set =
    currentSide === "A" ? currentCase.argumentsA : currentCase.argumentsB;

  const otherSet =
    currentSide === "A" ? currentCase.argumentsB : currentCase.argumentsA;

  const container = document.getElementById("argumentButtons");
  container.innerHTML = "";

  set.forEach(arg => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerText = arg.text;
    btn.onclick = () => chooseArgument(arg, otherSet);
    container.appendChild(btn);
  });
}

function chooseArgument(arg, otherSet) {
  chosenArgument = arg.text;
  const rand = Math.floor(Math.random() * otherSet.length);
  otherArgument = otherSet[rand].text;

  document.getElementById("argumentScreen").classList.add("hidden");
  document.getElementById("feedbackScreen").classList.remove("hidden");

  document.getElementById("feedbackText").innerText = arg.feedback;
}

function showReflection() {
  document.getElementById("feedbackScreen").classList.add("hidden");
  document.getElementById("reflectionScreen").classList.remove("hidden");

  const now = new Date().toLocaleString();

  document.getElementById("summaryInfo").innerText =
    "Student: " + nickname +
    "\nApp: Civics Debate Lab" +
    "\nChapter: " + currentChapter.title +
    "\nCase: " + currentCase.title +
    "\nPosition: " +
    (currentSide === "A" ? currentCase.sideA : currentCase.sideB) +
    "\nChosen Argument:\n" + chosenArgument +
    "\nDate & Time: " + now;

  const btn1 = document.getElementById("strongBtn1");
  const btn2 = document.getElementById("strongBtn2");

  btn1.innerText = chosenArgument;
  btn2.innerText = otherArgument;

  btn1.onclick = () => selectStrongest(btn1);
  btn2.onclick = () => selectStrongest(btn2);
}

function selectStrongest(btn) {
  document.getElementById("strongBtn1").style.background = "";
  document.getElementById("strongBtn2").style.background = "";

  btn.style.background = "#c8f7c5";
  strongestChoice = btn.innerText;
}

function returnToCases() {
  document.getElementById("reflectionScreen").classList.add("hidden");
  document.getElementById("caseSelectScreen").classList.remove("hidden");
}
