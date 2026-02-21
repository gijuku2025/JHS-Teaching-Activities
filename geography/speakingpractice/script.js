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

function isClose(word1, word2) {
  if (!word2) return false;

  // simple "close enough" rule:
  // same first 2 letters OR one is inside the other
  if (word1.startsWith(word2.slice(0,2)) || word2.startsWith(word1.slice(0,2))) {
    return true;
  }

  if (word1.includes(word2) || word2.includes(word1)) {
    return true;
  }

  return false;
}

function gradeSentence() {
  const modelWords = normalize(sentenceEl.textContent).split(" ");
  const spokenWords = normalize(input.value).split(" ");

  let html = "";
  let score = 0;

  modelWords.forEach((modelWord, i) => {
    const spokenWord = spokenWords[i];

    if (spokenWord === modelWord) {
      html += `<span class="correct">${modelWord} </span>`;
      score++;
    } 
    else if (isClose(modelWord, spokenWord)) {
      html += `<span class="close">${modelWord} </span>`;
      score += 0.5;
    } 
    else {
      html += `<span class="wrong">${modelWord} </span>`;
    }
  });

  if (score > bestScore) bestScore = score;

  feedback.innerHTML = html;
}
