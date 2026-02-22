let data;
let currentChapter, currentSection;
let sentences = [];
let index = 0;

let studyStartTime = null;
let resultsLog = [];

const nickname = localStorage.getItem("nickname") || "Student";
const subjectTitle = "Junior High Geography";
const menu = document.getElementById("menu");
const card = document.getElementById("card");
const header = document.getElementById("header");
const sentenceEl = document.getElementById("sentence");
const progressEl = document.getElementById("progress");
const input = document.getElementById("speechInput");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const playAudioBtn = document.getElementById("playAudio");
const checkBtn = document.getElementById("checkBtn");
const retryBtn = document.getElementById("retryBtn");

let audioPlayer = new Audio();

input.addEventListener("focus", () => {
  if (!card.classList.contains("hidden")) {
    header.style.visibility = "hidden";
    setTimeout(() => {
      sentenceEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }
});

input.addEventListener("blur", () => {
  header.style.visibility = "visible";
});


// ------------------- UTILITY FUNCTIONS -------------------
function normalize(text) {
  return text.toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
}

function swapChars(word, a, b) {
  return word.replaceAll(a, "#").replaceAll(b, a).replaceAll("#", b);
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function isClose(model, spoken) {
  if (!spoken) return null;
  const m = model;
  const s = spoken;

  if (swapChars(m, "l", "r") === s || swapChars(s, "l", "r") === m) return "lr";
  if (swapChars(m, "b", "v") === s || swapChars(s, "b", "v") === m) return "bv";

  if (m.replace("th", "s") === s) return "th";
  if (m.replace("th", "z") === s) return "th";
  if (m.replace("th", "t") === s) return "th";

  if (m === s + "s" || m === s + "ed" || m === s + "d" || m === s + "t") return "ending";

  if (levenshtein(m, s) === 1) return "spelling";

  return null;
}

// ------------------- LOAD DATA -------------------
fetch("sentences.json")
  .then(r => r.json())
  .then(json => {
    if (!json.chapters) throw new Error("Invalid JSON: chapters missing");
    data = json;
    showChapters();
  })
  .catch(err => {
    console.error(err);
    header.textContent = "Error loading data. Please refresh.";
    menu.innerHTML = "";
  });

// ------------------- UI FUNCTIONS -------------------
function showChapters() {
  header.innerHTML = `Welcome to Smart Speak, ${nickname}.<br>${subjectTitle}`;
  menu.innerHTML = "";
  card.classList.add("hidden");

  document.getElementById("legend").classList.add("hidden");
  
  for (let ch in data.chapters) {
    const chapterData = data.chapters[ch];
    const btn = document.createElement("button");
    btn.textContent = chapterData.title ? `${ch}. ${chapterData.title}` : `Chapter ${ch}`;
    btn.onclick = () => showSections(ch);
    menu.appendChild(btn);
  }
}

function showSections(ch) {
  currentChapter = ch;
  const chapterData = data.chapters[ch];

  header.textContent = chapterData.title ? `Chapter ${ch}: ${chapterData.title}` : `Chapter ${ch}`;
  menu.innerHTML = "";
  card.classList.add("hidden");
  document.getElementById("legend").classList.add("hidden");  

  const sections = chapterData.sections || {};
  for (let s in sections) {
    const sectionData = sections[s];
    const btn = document.createElement("button");
    btn.textContent = sectionData.title ? `${ch}-${s}: ${sectionData.title}` : `${ch}-${s}`;
    btn.onclick = () => startPractice(ch, s);
    menu.appendChild(btn);
  }
}

function startPractice(ch, s) {
  currentChapter = ch;
  currentSection = s;

  const chapterData = data.chapters[ch];
  const sectionData = chapterData.sections[s];

  document.getElementById("legend").classList.remove("hidden");

  
  if (!sectionData || !sectionData.sentences?.length) {
    alert("No sentences available in this section.");
    return;
  }  
  
  sentences = sectionData.sentences;
  index = 0;
  bestScore = 0;
  resultsLog = [];
  studyStartTime = new Date();

  menu.innerHTML = "";
  card.classList.remove("hidden");

  let headerText = `Chapter ${ch}`;
  if (chapterData.title) headerText += `: ${chapterData.title}`;
  headerText += ` — Section ${s}`;
  if (sectionData.title) headerText += `: ${sectionData.title}`;
  header.textContent = headerText;

  loadSentence();
}

function loadSentence() {
  const current = sentences[index];
  if (!current) return;

  sentenceEl.textContent = current.text || "";
  progressEl.textContent = `Sentence ${index + 1} of ${sentences.length}`;
  input.value = "";
  feedback.innerHTML = "";
  nextBtn.disabled = true;
  checkBtn.disabled = true;

  playAudioBtn.onclick = () => {
    if (!current.audio) return alert("Audio not available");
    try {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      audioPlayer.src = current.audio;
      audioPlayer.play();
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  };
}

input.oninput = () => {
  checkBtn.disabled = !input.value.trim();
};

checkBtn.onclick = () => {
  gradeSentence();
  nextBtn.disabled = false;
};

retryBtn.onclick = () => {
  input.value = "";
  feedback.innerHTML = "";
  checkBtn.disabled = true;
};

nextBtn.onclick = () => {
  index++;
  if (index < sentences.length) {
    loadSentence();  } else {
    showResults();
  }
};

// ------------------- GRADING -------------------
function gradeSentence() {
  const modelWords = normalize(sentenceEl.textContent).split(" ");
  const originalWords = sentenceEl.textContent.split(/\s+/);
  const spokenWords = normalize(input.value).split(" ").filter(Boolean);

  let html = "";          // full feedback (practice)
  let sentenceHtml = ""; // clean feedback (results)
  let score = 0;

  const feedbackMessages = {
    "lr": "Check R and L sounds（RとLの発音に注意）",
    "bv": "Check B and V sounds（BとVの発音に注意）",
    "th": "Practice the TH sound（THの発音を練習）",
    "ending": "Check word endings (s, ed)（語尾に注意）",
    "spelling": "Check pronunciation（発音をもう一度確認）"
  };

  const wordFeedback = {
    "library": "Remember the 'r' sound in the middle（真ん中のRの発音に注意）",
    "think": "TH is pronounced like in 'thanks'（THはthanksのように発音）",
    "vase": "B/V confusion possible（BとVの混同に注意）"
  };

  modelWords.forEach((modelWord, i) => {
    const spokenWord = normalize(spokenWords[i] || "");
    const cleanModelWord = normalize(modelWords[i]);
    const reason = isClose(cleanModelWord, spokenWord);

    const wordClass =
      spokenWord === cleanModelWord ? "correct" :
      reason ? "close" : "wrong";

    const displayWord = originalWords[i] ? originalWords[i].trim() : modelWords[i];

    // colored word (both outputs)
    const coloredWord = `<span class="${wordClass}">${displayWord}</span> `;

    html += coloredWord;
    sentenceHtml += coloredWord;

    // 🔽 word-by-word feedback (ONLY for practice)
    if (spokenWord !== cleanModelWord) {
      let msg =
        wordFeedback[cleanModelWord] ||
        (reason ? feedbackMessages[reason] : "Check this word（この単語を確認）");

      html += `<span class="word-feedback ${reason ? "close" : ""}">⚠️ ${msg}</span>`;
    }

    if (spokenWord === cleanModelWord) score++;
    else if (reason) score += 0.5;
  });

  // show full feedback now
  feedback.innerHTML = html;

  // save ONLY colored sentence for results page
  resultsLog.push(sentenceHtml);
}
	  function showResults() {
  const endTime = new Date();
  const timeSpentMs = endTime - studyStartTime;
  const minutes = Math.floor(timeSpentMs / 60000);
  const seconds = Math.floor((timeSpentMs % 60000) / 1000);

  const chapterData = data.chapters[currentChapter];
  const sectionData = chapterData.sections[currentSection];

  header.innerHTML = "Study Results";

  card.classList.add("hidden");
  document.getElementById("legend").classList.add("hidden");

  let html = `
    <p><strong>Name:</strong> ${nickname}</p>
    <p><strong>Date:</strong> ${endTime.toLocaleDateString()}</p>
    <p><strong>Finished at:</strong> ${endTime.toLocaleTimeString()}</p>
    <p><strong>Studied:</strong> Chapter ${currentChapter} - Section ${currentSection}</p>
    <p><strong>Time spent:</strong> ${minutes} min ${seconds} sec</p>
    <hr>
  `;

  resultsLog.forEach((sentence, i) => {
    html += `<p><strong>Sentence ${i + 1}:</strong><br>${sentence}</p>`;
  });

  html += `<button onclick="location.reload()">Back to Menu</button>`;

  menu.innerHTML = html;
}
	  
