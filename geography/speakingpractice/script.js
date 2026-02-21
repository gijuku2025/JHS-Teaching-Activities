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

fetch("sentences.json")
  .then(r => r.json())
  .then(json => {
    data = json;
    showChapters();
  });

function showChapters() {
  header.textContent = "Choose a Chapter";
  menu.innerHTML = "";
  card.classList.add("hidden");

  for (let ch in data.chapters) {
    const chapterData = data.chapters[ch];
    const btn = document.createElement("button");

    // show title if it exists
    btn.textContent = chapterData.title
      ? `${ch}. ${chapterData.title}`
      : `Chapter ${ch}`;

    btn.onclick = () => showSections(ch);
    menu.appendChild(btn);
  }
}

function showSections(ch) {
  currentChapter = ch;
  const chapterData = data.chapters[ch];

  header.textContent = chapterData.title
    ? `Chapter ${ch}: ${chapterData.title}`
    : `Chapter ${ch}`;

  menu.innerHTML = "";
  card.classList.add("hidden");

  const sections = chapterData.sections;
  for (let s in sections) {
    const sectionData = sections[s];
    const btn = document.createElement("button");

    // show section title if it exists
    btn.textContent = sectionData.title
      ? `${ch}-${s}: ${sectionData.title}`
      : `${ch}-${s}`;

    btn.onclick = () => startPractice(ch, s);
    menu.appendChild(btn);
  }
}

function startPractice(ch, s) {
  currentChapter = ch;
  currentSection = s;

  const chapterData = data.chapters[ch];
  const sectionData = chapterData.sections[s];

  sentences = sectionData.sentences;
  index = 0;
  bestScore = 0;

  menu.innerHTML = "";
  card.classList.remove("hidden");

  // header now shows chapter + section
  let headerText = `Chapter ${ch}`;
  if (chapterData.title) headerText += `: ${chapterData.title}`;
  headerText += ` — Section ${s}`;
  if (sectionData.title) headerText += `: ${sectionData.title}`;

  header.textContent = headerText;

  loadSentence();
}

function loadSentence() {
  const current = sentences[index];
  sentenceEl.textContent = current.text;
  progressEl.textContent = `Sentence ${index + 1} of ${sentences.length}`;
  input.value = "";
  feedback.innerHTML = "";
  nextBtn.disabled = true;

  playAudioBtn.onclick = () => {
    new Audio(current.audio).play();
  };
}

checkBtn.onclick = () => {
  gradeSentence();
  nextBtn.disabled = false;
};

retryBtn.onclick = () => {
  input.value = "";
  feedback.innerHTML = "";
};

nextBtn.onclick = () => {
  index++;
  if (index < sentences.length) {
    loadSentence();
  } else {
    header.textContent = "Finished!";
    card.classList.add("hidden");
    menu.innerHTML = "<button onclick='location.reload()'>Back to Menu</button>";
  }
};

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")   // remove punctuation
    .replace(/\s+/g, " ")     // collapse spaces
    .trim();
}

function isClose(model, spoken) {
  if (!spoken) return false;

  // exact handled elsewhere, so here we test "near matches"
  const m = model;
  const s = spoken;

  // 1️⃣ L ↔ R confusion
  if (swapChars(m, "l", "r") === s || swapChars(s, "l", "r") === m) return true;

  // 2️⃣ B ↔ V confusion
  if (swapChars(m, "b", "v") === s || swapChars(s, "b", "v") === m) return true;

  // 3️⃣ TH ↔ S / Z / T
  if (m.replace("th", "s") === s) return true;
  if (m.replace("th", "z") === s) return true;
  if (m.replace("th", "t") === s) return true;

  // 4️⃣ Missing final consonant (s, ed, d, t)
  if (m === s + "s") return true;
  if (m === s + "ed") return true;
  if (m === s + "d") return true;
  if (m === s + "t") return true;

  // 5️⃣ Small spelling difference (1 letter off)
  if (levenshtein(m, s) === 1) return true;

  return false;
}

function swapChars(word, a, b) {
  return word
    .replaceAll(a, "#")
    .replaceAll(b, a)
    .replaceAll("#", b);
}

// Levenshtein distance (edit distance)
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

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

function gradeSentence() {
  const originalWords = sentenceEl.textContent.split(" ");
  const modelWords = normalize(sentenceEl.textContent).split(" ");
  const spokenWords = normalize(input.value).split(" ");

  let html = "";
  let score = 0;

  modelWords.forEach((modelWord, i) => {
    const spokenWord = spokenWords[i];
    const displayWord = originalWords[i] || modelWord;

    if (spokenWord === modelWord) {
      html += `<span class="correct">${displayWord} </span>`;
      score++;
    } 
    else if (isClose(modelWord, spokenWord)) {
      html += `<span class="close">${displayWord} </span>`;
      score += 0.5;
    } 
    else {
      html += `<span class="wrong">${displayWord} </span>`;
    }
  });

  if (score > bestScore) bestScore = score;

  feedback.innerHTML = html;
}
