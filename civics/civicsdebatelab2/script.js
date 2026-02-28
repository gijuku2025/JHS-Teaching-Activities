let data;
let currentChapter;
let currentCase;
let currentSide;
let chosenArgument;
let strongestChoice;
let otherArgument;
let openGloss = null;

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
    btn.innerText = ch.id; // Only number
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
    btn.innerText = "Case " + c.id + ": " + c.title;
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

  assignSide(); // Automatically assigns AND applies gloss
}


function applyGloss(text) {
  if (!data.globalGlossary) return text;

  let result = text;

  const terms = Object.keys(data.globalGlossary);

  // Sort longest first (important for multi-word terms)
  terms.sort((a, b) => b.length - a.length);

  terms.forEach(term => {
    const meaning = data.globalGlossary[term];

    const regex = new RegExp("\\b(" + term + ")\\b", "gi");

    result = result.replace(regex, function(match) {
      return `<span class="gloss" data-ja="${meaning}">${match}</span>`;
    });
  });

  return result;
}

function activateGlosses() {
  const glosses = document.querySelectorAll(".gloss");

  glosses.forEach(g => {
    g.addEventListener("click", function () {

      // If clicking same open gloss → close it
      if (openGloss === this) {
        this.classList.remove("open");
        openGloss = null;
        return;
      }

      // Close previously open gloss
      if (openGloss) {
        openGloss.classList.remove("open");
      }

      // Open new one
      this.classList.add("open");
      openGloss = this;
    });
  });
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

  document.getElementById("caseScreen").classList.remove("hidden");

const glossedSituation = applyGloss(currentCase.text);
const glossedSide = applyGloss(sideText);

document.getElementById("caseText").innerHTML =
  "<strong>Situation:</strong><br><br>" + glossedSituation +
  "<br><br><strong>Your Position:</strong><br><br>" + glossedSide;

activateGlosses();

document.getElementById("continueToArguments").onclick = () => {
  document.getElementById("caseScreen").classList.add("hidden");
  showArguments();
};  
}

function showArguments() {

  if (openGloss) {
    openGloss.classList.remove("open");
    openGloss = null;
  }

  document.getElementById("caseScreen").classList.add("hidden");
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
    btn.innerHTML = applyGloss(arg.text);
    btn.onclick = () => chooseArgument(arg, otherSet);
    container.appendChild(btn);
  });

  // 🔥 THIS MUST BE INSIDE THE FUNCTION
  activateGlosses();
}

function generateFeedback(arg) {
  const typeMap = {
    social: "fairness, shared impact, or rights",
    practical: "real-world consequences or efficiency",
    rule: "laws, agreements, or formal structure",
    developmental: "growth, responsibility, or learning",
    emotional: "personal feelings or reactions"
  };

  let strengthText = "";
  let improvementText = "";

  if (arg.strength === "strong") {
    strengthText = "You selected a STRONG " + arg.type + " argument.";
    improvementText = "This is effective reasoning in civic debate.";
  } 
  else if (arg.strength === "moderate") {
    strengthText = "You selected a MODERATE " + arg.type + " argument.";
    improvementText = "It could be stronger if you connect it more clearly to public impact.";
  } 
  else {
    strengthText = "You selected a WEAK " + arg.type + " argument.";
    improvementText = "Try using fairness, consequences, or shared rules instead of personal opinion.";
  }

  const explanation =
    "This type of reasoning focuses on " + typeMap[arg.type] + ".";

  document.getElementById("feedbackText").innerText =
    strengthText + "\n\n" +
    explanation + "\n\n" +
    improvementText;
}


function showReflection() {
  
if (openGloss) {
  openGloss.classList.remove("open");
  openGloss = null;
}
document.getElementById("app").scrollTop = 0;
    
  window.scrollTo(0, 0);  
  document.getElementById("feedbackScreen").classList.add("hidden");
  document.getElementById("reflectionScreen").classList.remove("hidden");

  const now = new Date().toLocaleString();

  document.getElementById("summaryInfo").innerText =
    "Student: " + nickname +
   
    "\nChapter: " + currentChapter.title +
    "\nCase: " + currentCase.title +
    "\nPosition: " +
    (currentSide === "A" ? currentCase.sideA : currentCase.sideB) +
    "\nChosen Argument:\n" + chosenArgument.text +
"\nType: " + chosenArgument.type +
"\nStrength: " + chosenArgument.strength +
    "\nDate & Time: " + now;

  const btn1 = document.getElementById("strongBtn1");
  const btn2 = document.getElementById("strongBtn2");

  btn1.innerText = chosenArgument.text;
  btn2.innerText = otherArgument.text;

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
