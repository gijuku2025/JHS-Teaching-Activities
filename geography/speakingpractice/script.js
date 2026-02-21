let data;
let currentChapter, currentSection;
let sentences = [];
let index = 0;
let bestScore = 0;

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

// ------------------- UTILITY FUNCTIONS -------------------
const Utils = {
  normalize(text) {
    return text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  },

  swapChars(word, a, b) {
    return word.replaceAll(a, "#").replaceAll(b, a).replaceAll("#", b);
  },

  levenshtein(a, b) {
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
  },

  isClose(model, spoken) {
    if (!spoken) return null;
    const m = model;
    const s = spoken;

    if (this.swapChars(m, "l", "r") === s || this.swapChars(s, "l", "r") === m) return "lr";
    if (this.swapChars(m, "b", "v") === s || this.swapChars(s, "b", "v") === m) return "bv";

    if (m.replace("th", "s") === s) return "th";
    if (m.replace("th", "z") === s) return "th";
    if (m.replace("th", "t") === s) return "th";

    if (m === s + "s" || m === s + "ed" || m === s + "d" || m === s + "t") return "ending";
    if (this.levenshtein(m, s) === 1) return "spelling";

    return null;
  }
};

// ------------------- DATA LOAD -------------------
fetch("sentences.json")
  .then(r => {
    if (!r.ok) throw new Error("Failed to fetch sentences.json");
    return r.json();
  })
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
  header.textContent = "Choose a Chapter";
  menu.innerHTML = "";
  card.classList.add("hidden");

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
  const sectionData = chapterData.sections?.[s];

  if (!sectionData || !sectionData.sentences || !sectionData.sentences.length) {
    alert("No sentences available in this section.");
    return;
  }

  sentences = sectionData.sentences;
  index = 0;
  bestScore = 0;

  menu.innerHTML = "";
  card.classList.remove("hidden");

  let headerText = `Chapter ${ch}`;
  if (chapterData.title) headerText += `: ${chapterData.title}`;
  headerText += ` — Section ${s}`;
  if (sectionData.title) headerText += `: ${sectionData.title}`;
  header.textContent = headerText;

  loadSentence();
}

// ------------------- SENTENCE HANDLING -------------------
function loadSentence() {
  const current = sentences[index];
  if (!current) return;

  sentenceEl.textContent = current.text || "";
  progressEl.textContent = `Sentence ${index + 1} of ${sentences.length}`;
  input.value = "";
  feedback.innerHTML = "";
  nextBtn.disabled = true;
  checkBtn.disabled = true;

  // Audio handling
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

// Enable check button only if input is non-empty
input.oninput = () => {
  checkBtn.disabled = !input.value.trim();
};

// ------------------- BUTTON ACTIONS -------------------
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
    loadSentence();
  } else {
    header.textContent = "Finished!";
    card.classList.add("hidden");
    menu.innerHTML = `<button onclick="location.reload()">Back to Menu</button>`;
  }
};

// ------------------- GRADING -------------------
function gradeSentence() {
  const modelWords = Utils.normalize(sentenceEl.textContent).split(" ");
  const spokenWords = Utils.normalize(input.value).split(" ").filter(Boolean);
  const originalWords = sentenceEl.textContent.split(" ");

  let html = "";
  let score = 0;
  let reasons = new Set();

  modelWords.forEach((modelWord, i) => {
    const spokenWord = spokenWords[i] || "";
    const displayWord = originalWords[i] || modelWord;

    if (spokenWord === modelWord) {
      html += `<span class="correct">${displayWord} </span>`;
      score++;
    } else {
      const reason = Utils.isClose(modelWord, spokenWord);
      if (reason) {
        html += `<span class="close">${displayWord} </span>`;
        score += 0.5;
        reasons.add(reason);
      } else {
        html += `<span class="wrong">${displayWord} </span>`;
      }
    }
  });

  if (score > bestScore) bestScore = score;

  feedback.innerHTML = html;

  // Feedback list
  if (reasons.size > 0) {
    let message = "<p><strong>Feedback:</strong></p><ul>";
    reasons.forEach(r => {
      if (r === "lr") message += "<li>Check R and L sounds（RとLの発音に注意）</li>";
      if (r === "bv") message += "<li>Check B and V sounds（BとVの発音に注意）</li>";
      if (r === "th") message += "<li>Practice the TH sound（THの発音を練習）</li>";
      if (r === "ending") message += "<li>Check word endings (s, ed)（語尾に注意）</li>";
      if (r === "spelling") message += "<li>Check pronunciation（発音をもう一度確認）</li>";
    });
    message += "</ul>";
    feedback.innerHTML += message;
  }

  // Show score percentage
  const percent = ((score / modelWords.length) * 100).toFixed(0);
  feedback.innerHTML += `<p>Score: ${percent}%</p>`;
}
