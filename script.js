// ===== QUIZ LOGIC =====
let currentQuestion = 1;
let score = 0;
const totalQuestions = 5;

function answer(btn, isCorrect) {
  const questionEl = document.getElementById('q' + currentQuestion);
  const buttons = questionEl.querySelectorAll('button');
  const feedback = questionEl.querySelector('.q-feedback');

  // Disable all buttons
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
    // Highlight the correct answer
    buttons.forEach(b => {
      if (b.getAttribute('onclick').includes('true')) {
        b.classList.add('correct');
      }
    });
  }

  // Move to next question after delay
  setTimeout(() => {
    if (currentQuestion < totalQuestions) {
      currentQuestion++;
      document.getElementById('q' + (currentQuestion - 1)).classList.remove('active');
      document.getElementById('q' + currentQuestion).classList.add('active');
      document.getElementById('progress-text').textContent =
        'Question ' + currentQuestion + ' of ' + totalQuestions;
    } else {
      showResult();
    }
  }, 1400);
}

function showResult() {
  document.getElementById('q' + totalQuestions).classList.remove('active');
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');
  document.getElementById('score').textContent = score;

  let msg = '';
  if (score === 5) {
    msg = '🌟 Perfect score! You are a George Washington expert!';
  } else if (score >= 3) {
    msg = '👏 Great work! You know a lot about George Washington!';
  } else {
    msg = '📚 Good try! Read through the page again and try once more!';
  }
  document.getElementById('result-msg').textContent = msg;
  document.getElementById('progress-text').textContent = 'Quiz complete!';
}

function restartQuiz() {
  currentQuestion = 1;
  score = 0;

  // Reset all questions
  for (let i = 1; i <= totalQuestions; i++) {
    const q = document.getElementById('q' + i);
    q.classList.remove('active');
    q.querySelectorAll('button').forEach(b => {
      b.disabled = false;
      b.classList.remove('correct', 'wrong');
    });
    q.querySelector('.q-feedback').textContent = '';
  }

  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('q1').classList.add('active');
  document.getElementById('progress-text').textContent = 'Question 1 of 5';
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

document.querySelectorAll('.card, .fact-bubble, .timeline-content').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
