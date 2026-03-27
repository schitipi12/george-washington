// ===== WIKIPEDIA IMAGE LOADER =====
// Loads images dynamically from Wikipedia's REST API to avoid hotlink issues
async function loadWikiImages() {
  const imgs = document.querySelectorAll('img[data-wiki]');
  for (const img of imgs) {
    const article = img.getAttribute('data-wiki');
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(article)}`
      );
      const data = await res.json();
      const src = data.originalimage?.source || data.thumbnail?.source;
      if (src) {
        img.src = src;
      } else {
        img.closest('.section-image-wrap, .gallery-item')
          ?.classList.add('img-missing');
      }
    } catch (e) {
      img.closest('.section-image-wrap, .gallery-item')
        ?.classList.add('img-missing');
    }
  }
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .fact-bubble, .timeline-content, .stat-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ===== ANIMATED STAT COUNTERS =====
function animateCounter(el, target, duration) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-target'));
      animateCounter(el, target, target > 100 ? 2000 : 1000);
      statsObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  statsObserver.observe(el);
});

// ===== TIMELINE EXPAND =====
function toggleTimeline(item) {
  item.classList.toggle('expanded');
}

// ===== GALLERY LIGHTBOX =====
function openLightbox(item) {
  const img = item.querySelector('img');
  const caption = item.querySelector('.gallery-caption');
  if (!img.src || img.src === window.location.href) return;
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox-caption').textContent =
    caption ? caption.textContent : img.alt;
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// ===== WASHINGTON QUOTES =====
const quotes = [
  { text: '"It is far better to be alone than to be in bad company."', },
  { text: '"Happiness and moral duty are inseparably connected."', },
  { text: '"Guard against the impostures of pretended patriotism."', },
  { text: '"Be courteous to all, but intimate with few, and let those few be well tried before you give them your confidence."', },
  { text: '"Observe good faith and justice towards all Nations; cultivate peace and harmony with all."', },
  { text: '"If freedom of speech is taken away, then dumb and silent we may be led, like sheep to the slaughter."', },
  { text: '"The very atmosphere of firearms anywhere and everywhere restrains evil interference — they deserve a place of honor with all that is good."', },
  { text: '"To be prepared for war is one of the most effective means of preserving peace."', },
];

let currentQuote = 0;

function renderQuote() {
  document.getElementById('quote-text').textContent = quotes[currentQuote].text;
  const dotsEl = document.getElementById('quote-dots');
  dotsEl.innerHTML = quotes.map((_, i) =>
    `<span class="quote-dot ${i === currentQuote ? 'active' : ''}" onclick="goToQuote(${i})"></span>`
  ).join('');
}

function changeQuote(dir) {
  currentQuote = (currentQuote + dir + quotes.length) % quotes.length;
  renderQuote();
}

function goToQuote(i) {
  currentQuote = i;
  renderQuote();
}

// Auto-advance quotes every 6 seconds
setInterval(() => changeQuote(1), 6000);

// ===== QUIZ =====
const questionPool = [
  {
    q: "When was George Washington born?",
    options: ["January 1, 1730", "February 22, 1732", "July 4, 1776", "March 15, 1745"],
    correct: 1
  },
  {
    q: "What was the name of Washington's beloved home?",
    options: ["Monticello", "The White House", "Mount Vernon", "Independence Hall"],
    correct: 2
  },
  {
    q: "Which river did Washington cross on Christmas night 1776?",
    options: ["Mississippi River", "Delaware River", "Hudson River", "Potomac River"],
    correct: 1
  },
  {
    q: "How many terms did Washington serve as President?",
    options: ["One", "Two", "Three", "Four"],
    correct: 1
  },
  {
    q: "Which coin has George Washington's face on it?",
    options: ["Dime", "Nickel", "Quarter", "Half Dollar"],
    correct: 2
  },
  {
    q: "What year was George Washington inaugurated as President?",
    options: ["1776", "1783", "1789", "1797"],
    correct: 2
  },
  {
    q: "Who did George Washington marry?",
    options: ["Abigail Adams", "Martha Dandridge Custis", "Mary Ball Washington", "Eleanor Calvert"],
    correct: 1
  },
  {
    q: "At what age did Washington become a professional land surveyor?",
    options: ["14", "17", "21", "25"],
    correct: 1
  },
  {
    q: "Which battle ended the Revolutionary War?",
    options: ["Battle of Bunker Hill", "Battle of Saratoga", "Battle of Trenton", "Battle of Yorktown"],
    correct: 3
  },
  {
    q: "Where did Washington's army spend the brutal winter of 1777–1778?",
    options: ["Trenton", "Valley Forge", "Philadelphia", "Yorktown"],
    correct: 1
  },
  {
    q: "How tall was George Washington?",
    options: ["5 feet 8 inches", "5 feet 11 inches", "6 feet 2 inches", "6 feet 5 inches"],
    correct: 2
  },
  {
    q: "What did Washington name one of his beloved pet dogs?",
    options: ["Rufus", "Biscuit", "Sweet Lips", "General"],
    correct: 2
  },
  {
    q: "Which bill has George Washington's portrait on it?",
    options: ["$5 bill", "$10 bill", "$20 bill", "$1 bill"],
    correct: 3
  },
  {
    q: "How many U.S. states were there when Washington became president?",
    options: ["7", "13", "26", "50"],
    correct: 1
  },
];

let activeQuestions = [];
let currentQuestion = 1;
let score = 0;
const TOTAL = 5;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuiz() {
  activeQuestions = shuffle(questionPool).slice(0, TOTAL);
  activeQuestions.forEach((q, idx) => {
    const n = idx + 1;
    // Build shuffled options but track correct answer
    const correct = q.options[q.correct];
    const shuffled = shuffle(q.options);
    const newCorrectIdx = shuffled.indexOf(correct);

    document.getElementById(`q${n}-text`).textContent = `${n}. ${q.q}`;
    const optEl = document.getElementById(`q${n}-options`);
    optEl.innerHTML = '';
    shuffled.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.onclick = function () { answer(this, i === newCorrectIdx, n); };
      optEl.appendChild(btn);
    });
    document.getElementById(`q${n}-feedback`).textContent = '';
  });
}

function answer(btn, isCorrect, qNum) {
  const questionEl = document.getElementById('q' + qNum);
  const buttons = questionEl.querySelectorAll('button');
  const feedback = document.getElementById('q' + qNum + '-feedback');

  buttons.forEach(b => b.disabled = true);

  if (isCorrect) {
    btn.classList.add('correct');
    feedback.textContent = '✅ Correct! Great job!';
    feedback.style.color = '#2d8a4e';
    score++;
  } else {
    btn.classList.add('wrong');
    feedback.textContent = '❌ Not quite — but keep learning!';
    feedback.style.color = '#c0392b';
    buttons.forEach(b => {
      if (b.onclick.toString().includes('true')) b.classList.add('correct');
    });
  }

  // Update progress bar
  const pct = (qNum / TOTAL) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';

  setTimeout(() => {
    if (qNum < TOTAL) {
      questionEl.classList.remove('active');
      document.getElementById('q' + (qNum + 1)).classList.add('active');
      currentQuestion = qNum + 1;
      document.getElementById('progress-text').textContent =
        `Question ${currentQuestion} of ${TOTAL}`;
    } else {
      showResult();
    }
  }, 1400);
}

function showResult() {
  document.getElementById('q' + TOTAL).classList.remove('active');
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');
  document.getElementById('score').textContent = score;
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('progress-text').textContent = 'Quiz complete!';

  const stars = '⭐'.repeat(score) + '☆'.repeat(TOTAL - score);
  document.getElementById('score-stars').textContent = stars;

  let msg = '';
  if (score === 5) msg = '🌟 Perfect score! You are a George Washington expert!';
  else if (score >= 3) msg = '👏 Great work! You know a lot about George Washington!';
  else msg = '📚 Good try! Read through the page and try new questions!';
  document.getElementById('result-msg').textContent = msg;
}

function restartQuiz() {
  currentQuestion = 1;
  score = 0;

  for (let i = 1; i <= TOTAL; i++) {
    const q = document.getElementById('q' + i);
    q.classList.remove('active');
  }
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('progress-bar').style.width = '20%';
  document.getElementById('progress-text').textContent = 'Question 1 of 5';

  buildQuiz();
  document.getElementById('q1').classList.add('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadWikiImages();
  renderQuote();
  buildQuiz();
});
