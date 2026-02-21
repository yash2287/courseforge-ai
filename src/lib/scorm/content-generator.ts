/** Convert markdown content to SCORM-compatible HTML page */
export function generateLessonHtml(opts: {
  title: string;
  content: string;
  keyTakeaways: string[];
  moduleTitle: string;
  courseTitle: string;
  lessonIndex: number;
  totalLessons: number;
}): string {
  const htmlContent = markdownToHtml(opts.content);

  const takeawaysHtml = opts.keyTakeaways.length
    ? `<div class="takeaways">
      <h3>Key Takeaways</h3>
      <ul>${opts.keyTakeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}</title>
  <link rel="stylesheet" href="../style.css">
  <script src="../scormapi.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <div class="breadcrumb">${escapeHtml(opts.courseTitle)} &rsaquo; ${escapeHtml(opts.moduleTitle)}</div>
      <h1>${escapeHtml(opts.title)}</h1>
      <div class="progress">Lesson ${opts.lessonIndex} of ${opts.totalLessons}</div>
    </header>
    <main class="content">
      ${htmlContent}
    </main>
    ${takeawaysHtml}
    <footer>
      <button onclick="completeSco()" class="btn-complete">Mark Complete &amp; Continue</button>
    </footer>
  </div>
  <script>
    window.onload = function() { doLMSInitialize(); };
    function completeSco() {
      doLMSSetValue("cmi.core.lesson_status", "completed");
      doLMSCommit();
      doLMSFinish();
    }
  </script>
</body>
</html>`;
}

/** Generate interactive quiz HTML page */
export function generateQuizHtml(opts: {
  title: string;
  questions: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
  passingScore: number;
  courseTitle: string;
}): string {
  const questionsJson = JSON.stringify(opts.questions);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}</title>
  <link rel="stylesheet" href="${opts.title.includes('Final') ? '' : '../'}style.css">
  <script src="${opts.title.includes('Final') ? '' : '../'}scormapi.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <div class="breadcrumb">${escapeHtml(opts.courseTitle)}</div>
      <h1>${escapeHtml(opts.title)}</h1>
      <p class="passing-note">Passing score: ${opts.passingScore}%</p>
    </header>
    <main id="quiz-container"></main>
    <div id="results" style="display:none;"></div>
    <footer>
      <button onclick="submitQuiz()" id="submit-btn" class="btn-complete">Submit Answers</button>
    </footer>
  </div>
  <script>
    var questions = ${questionsJson};
    var passingScore = ${opts.passingScore};
    var answers = {};

    window.onload = function() {
      doLMSInitialize();
      renderQuiz();
    };

    function renderQuiz() {
      var container = document.getElementById('quiz-container');
      var html = '';
      for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        html += '<div class="question"><p class="q-text"><strong>Q' + (i+1) + '.</strong> ' + q.question + '</p>';
        html += '<div class="options">';
        for (var j = 0; j < q.options.length; j++) {
          html += '<label class="option"><input type="radio" name="q' + i + '" value="' + j + '" onchange="answers[' + i + ']=' + j + '"> ' + q.options[j] + '</label>';
        }
        html += '</div></div>';
      }
      container.innerHTML = html;
    }

    function submitQuiz() {
      var correct = 0;
      for (var i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correctAnswer) correct++;
      }
      var score = Math.round((correct / questions.length) * 100);
      var passed = score >= passingScore;

      doLMSSetValue("cmi.core.score.raw", score.toString());
      doLMSSetValue("cmi.core.lesson_status", passed ? "passed" : "failed");
      doLMSCommit();

      var results = document.getElementById('results');
      results.style.display = 'block';
      results.innerHTML = '<div class="result-card ' + (passed ? 'passed' : 'failed') + '"><h2>' + (passed ? 'Passed!' : 'Not Passed') + '</h2><p>Score: ' + score + '% (' + correct + '/' + questions.length + ')</p></div>';

      document.getElementById('submit-btn').textContent = 'Close';
      document.getElementById('submit-btn').onclick = function() { doLMSFinish(); };
    }
  </script>
</body>
</html>`;
}

/** Basic markdown to HTML converter */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[hulo])/gim, '<p>')
    .replace(/([^>])$/gim, '$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hulo])/g, '$1')
    .replace(/(<\/[hulo][^>]*>)<\/p>/g, '$1');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
