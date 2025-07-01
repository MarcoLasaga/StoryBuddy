let currentStoryIndex = -1;
let currentVideoIndex = 0;
let fontSizes = ["default-font", "large-font", "xlarge-font"];
let currentFont = 0;

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  document.getElementById("mainHeader").classList.toggle("dark-header");
  document.getElementById("mainHeader").classList.toggle("light-header");
}

function toggleMusic() {
  const music = document.getElementById("bgMusic");
  music.paused ? music.play() : music.pause();
}

function changeFontSize() {
  document.body.classList.remove(fontSizes[currentFont]);
  currentFont = (currentFont + 1) % fontSizes.length;
  document.body.classList.add(fontSizes[currentFont]);
}

function readPlot() {
  const text = document.getElementById("storyPlot").textContent;
  const msg = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(msg);
}

function showStory(index) {
  currentStoryIndex = index;
  currentVideoIndex = 0;
  const story = StoryData[index];

  document.getElementById("storyPlot").innerHTML = story.plot;
  document.getElementById("storyVideo").src = story.videos[0].url;
  document.getElementById("episodeLabel").textContent = story.videos[0].episode;

  // Characters
  const cl = document.getElementById("characterList");
  cl.innerHTML = "";
  story.characters.forEach(c => {
    const el = document.createElement("div");
    el.className = "character";
    el.innerHTML = `<img src="${c.image}" class="character-img"/><div class="character-info"><strong>${c.name}</strong></div>`;
    el.onclick = () => openCharacterModal(c);
    cl.appendChild(el);
  });

  // Timeline
  const map = document.getElementById("mapTimeline");
  map.innerHTML = "";
  story.timeline.forEach(point => {
    const li = document.createElement("li");
    li.textContent = point;
    map.appendChild(li);
  });

  // Video timeline
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";
  story.videos.forEach((v, i) => {
    const btn = document.createElement("button");
    btn.className = "episode-pill";
    btn.textContent = v.episode;
    btn.onclick = () => {
      currentVideoIndex = i;
      updateVideo();
    };
    timeline.appendChild(btn);
  });

  // Notes
  document.getElementById("userNotes").value = localStorage.getItem(`notes_${index}`) || "";

  // Quiz
  loadQuiz(story);

  // Achievements
  unlockAchievement("Opened a story");

  // Progress
  saveProgress(index);
  markCompletedStories();
}

function exportNotes() {
  const notes = document.getElementById("userNotes").value;
  const blob = new Blob([notes], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "StoryBuddy_Notes.txt";
  a.click();
}

function openCharacterModal(c) {
  document.getElementById("modalCharacterName").textContent = c.name;
  document.getElementById("modalCharacterInfo").textContent = c.description;
  document.getElementById("modalCharacterImage").src = c.image;
  document.getElementById("characterModal").style.display = "block";
}
function closeCharacterModal() {
  document.getElementById("characterModal").style.display = "none";
}

function slideCharacters(dir) {
  const list = document.getElementById("characterList");
  let index = parseInt(list.dataset.index || 0);
  index += dir;
  index = Math.max(0, Math.min(index, list.children.length - 3));
  list.dataset.index = index;
  list.style.transform = `translateX(-${index * 220}px)`;
}

function updateVideo() {
  const v = StoryData[currentStoryIndex].videos[currentVideoIndex];
  document.getElementById("storyVideo").src = v.url;
  document.getElementById("episodeLabel").textContent = v.episode;
}

function loadQuiz(story) {
  const quizBox = document.getElementById("quizBox");
  quizBox.innerHTML = "";
  if (!story.quiz) return;

  story.quiz.forEach((q, qi) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="quiz-question">${q.question}</div>
      ${q.choices.map(choice => `
        <label class="quiz-choices"><input type="radio" name="quiz-${qi}" value="${choice}"> ${choice}</label>
      `).join("")}`;
    quizBox.appendChild(wrap);
  });

  const btn = document.createElement("button");
  btn.className = "ui-btn";
  btn.textContent = "Submit Answers";
  btn.onclick = () => {
    let score = 0;
    story.quiz.forEach((q, qi) => {
      const ans = document.querySelector(`input[name="quiz-${qi}"]:checked`);
      if (ans && ans.value === q.answer) score++;
    });
    const res = document.createElement("div");
    res.className = "quiz-score";
    res.textContent = `You got ${score} / ${story.quiz.length}`;
    quizBox.appendChild(res);
    unlockAchievement("Completed a quiz");
  };
  quizBox.appendChild(btn);
}

const achievementTracker = {};

function unlockAchievement(label) {
  if (!achievementTracker[label]) {
    achievementTracker[label] = 1;
  } else {
    achievementTracker[label]++;
  }

  const list = document.getElementById("achievementList");
  const existing = [...list.children].find(li => li.dataset.label === label);

  if (existing) {
    existing.textContent = `🏅 ${label} (${achievementTracker[label]}x)`;
  } else {
    const li = document.createElement("li");
    li.dataset.label = label;
    li.textContent = `🏅 ${label} (1x)`;
    list.appendChild(li);
  }

  updateStats();
}


function unlockAchievement(name) {
  const list = document.getElementById("achievementList");
  if ([...list.children].some(li => li.textContent === name)) return;
  const item = document.createElement("li");
  item.textContent = "🏅 " + name;
  item.style.padding = "5px 0";
  list.appendChild(item);
}

function saveProgress(index) {
  const viewed = JSON.parse(localStorage.getItem("completed_stories") || "[]");
  if (!viewed.includes(index)) {
    viewed.push(index);
    localStorage.setItem("completed_stories", JSON.stringify(viewed));
  }
}

function markCompletedStories() {
  const viewed = JSON.parse(localStorage.getItem("completed_stories") || "[]");
  document.querySelectorAll(".story-button").forEach((btn, i) => {
    if (viewed.includes(i)) {
      btn.style.border = "3px solid #7cb518";
      btn.style.boxShadow = "0 0 12px #7cb518";
    }
  });
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}


window.addEventListener("scroll", () => {
  const max = document.body.scrollHeight - window.innerHeight;
  const percent = (window.scrollY / max) * 100;
  document.getElementById("progress").style.width = percent + "%";
});

window.onload = () => {
  const storyButtons = document.getElementById("storyButtons");
  StoryData.forEach((story, i) => {
    const btn = document.createElement("button");
    btn.className = "story-button";
    btn.innerHTML = `<img src="${story.characters[0].image}" /><span>${story.title}</span>`;
    btn.onclick = () => showStory(i);
    storyButtons.appendChild(btn);
  });
  markCompletedStories();
};
const tutorAnswers = {
  "ibong adarna": [
    {
      q: "don juan",
      a: "Don Juan is the youngest prince who captured the Ibong Adarna with kindness and courage."
    },
    {
      q: "ibong adarna",
      a: "The Ibong Adarna is a magical bird whose song can heal illness and put people to sleep."
    },
    {
      q: "betray",
      a: "Don Juan's brothers betrayed him out of jealousy after he captured the bird."
    }
  ],
  "alamat ng pinya": [
    {
      q: "pinang",
      a: "Pinang is a girl who was lazy and turned into a pineapple after wishing for more eyes."
    },
    {
      q: "mother",
      a: "Pinang's mother was hardworking and wanted her daughter to help with chores."
    },
    {
      q: "pineapple",
      a: "The pineapple symbolizes the lesson of being helpful and responsible."
    }
  ],
  "si malakas": [
    {
      q: "malakas",
      a: "Malakas means 'strong' and was the first man in the creation story."
    },
    {
      q: "maganda",
      a: "Maganda means 'beautiful' and was the first woman in the tale."
    },
    {
      q: "bamboo",
      a: "Both characters emerged from a split bamboo in the creation myth."
    }
  ],
  "alamat ng sampaguita": [
    {
      q: "rosita",
      a: "Rosita is the girl who waited for Manuel and later became the Sampaguita flower."
    },
    {
      q: "manuel",
      a: "Manuel is Rosita's lover who left for war and never returned."
    },
    {
      q: "sampaguita",
      a: "The Sampaguita flower grew from the place Rosita died, symbolizing eternal love."
    }
  ]
};

function chatSend() {
  const chatInput = document.getElementById("chatInput");
  const chatHistory = document.getElementById("chatHistory");
  const question = chatInput.value.trim().toLowerCase();

  if (!question) return;

  const story = StoryData[currentStoryIndex]?.title.toLowerCase();
  const answers = tutorAnswers[story] || [];

  const answerObj = answers.find(a => question.includes(a.q));
  const reply = answerObj ? answerObj.a : "Sorry, I don’t know the answer to that yet.";

  chatHistory.innerHTML += `<div><b>You:</b> ${question}</div>`;
  chatHistory.innerHTML += `<div><b>StoryBuddy:</b> ${reply}</div>`;
  chatInput.value = "";
  chatHistory.scrollTop = chatHistory.scrollHeight;
}
// === LOGIN + SYNC ===
function loginUser() {
  const name = prompt("Enter your name:");
  if (name) {
    localStorage.setItem("userName", name);
    document.getElementById("loginStatus").textContent = `Logged in as ${name}`;
    loadStats();
    showReminder();
  }
}

function showReminder() {
  const finished = JSON.parse(localStorage.getItem("completed_stories") || "[]");
  if (finished.length < StoryData.length) {
    alert("🔔 You still have more stories to explore! Keep going!");
  }
}

// === AUTO-SAVE NOTES ===
setInterval(() => {
  const index = currentStoryIndex;
  if (index >= 0) {
    const val = document.getElementById("userNotes").value;
    localStorage.setItem(`notes_${index}`, val);
  }
}, 10000); // every 10s

// === STATS SYSTEM ===
function updateStats() {
  const name = localStorage.getItem("userName") || "user";
  const stories = JSON.parse(localStorage.getItem("completed_stories") || "[]");
  const notes = document.getElementById("userNotes").value || "";
  const quizScores = parseInt(localStorage.getItem("quizPassed") || "0");

  document.getElementById("statStories").textContent = stories.length;
  document.getElementById("statQuizzes").textContent = quizScores;
  document.getElementById("statWords").textContent = notes.split(/\s+/).length;
}
function loadStats() {
  updateStats();
}

// === REVIEW MODE ===
function submitReview() {
  const text = document.getElementById("reviewSummary").value.trim();
  const feedbackBox = document.getElementById("feedbackMessage");

  if (text.length < 20) {
    feedbackBox.textContent = "💡 Try adding more details to your summary.";
  } else if (text.includes("and then") || text.includes("because")) {
    feedbackBox.textContent = "✅ Great! You're showing cause and effect.";
  } else {
    feedbackBox.textContent = "📝 Solid effort! Consider linking ideas next time.";
  }

  unlockAchievement("Submitted a summary");
  updateStats();
}

// === AI NOTE ENHANCER (OFFLINE VERSION) ===
function enhanceNotes() {
  const text = document.getElementById("userNotes").value;
  if (!text || text.length < 10) {
    alert("✍️ Write a bit more for me to enhance it.");
    return;
  }

  const improved = text
    .replace(/\bi think\b/gi, "I strongly believe")
    .replace(/\bgood\b/gi, "insightful")
    .replace(/\bbad\b/gi, "challenging")
    .concat(" This note shows an evolving understanding of the topic.");

  document.getElementById("userNotes").value = improved;
  unlockAchievement("Used AI Note Enhancer");
  updateStats();
}
