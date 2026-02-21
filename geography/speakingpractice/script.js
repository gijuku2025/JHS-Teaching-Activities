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

function gradeSentence() {
  const clean = str =>
  str.toLowerCase().replace(/[.,!?]/g, "").trim();

const model = clean(sentenceEl.textContent).split(" ");
const spoken = clean(input.value).split(" ");

  let html = "";
  let score = 0;

  model.forEach(word => {
    if (spoken.includes(word)) {
      html += `<span class="close">${word} </span>`;
      score++;
    } else {
      html += `<span class="wrong">${word} </span>`;
    }
  });

  if (spoken.join(" ") === model.join(" ")) {
    html = model.map(w => `<span class="correct">${w} </span>`).join("");
    score = model.length;
  }

  if (score > bestScore) bestScore = score;

  feedback.innerHTML = html;
}
