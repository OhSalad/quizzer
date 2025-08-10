document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const fileInput = document.getElementById('file-input');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const writtenAnswerInput = document.getElementById('written-answer');
    const nextButton = document.getElementById('next-button');
    const scoreSpan = document.getElementById('score');
    const retakeButton = document.getElementById('retake-button');
    const questionTimerSpan = document.getElementById('question-timer');
    const globalTimerSpan = document.getElementById('global-timer');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const globalTimerDisplay = document.getElementById('global-timer-display');
    const uploadButton = document.getElementById('upload-button');
    const writtenResultsContainer = document.getElementById('written-results-container');
    const writtenAnswersDisplay = document.getElementById('written-answers-display');
    const copyWrittenButton = document.getElementById('copy-written-button');

    // --- State Variables ---
    let questions = [];
    let writtenAnswers = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let questionTimer;
    let globalTimer;
    let globalTime = 0;
    let mcqCount = 0;

    // --- Functions ---

    function handleFile(file) {
        if (!file || file.type !== 'application/json') {
            alert('Please drop or select a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            let parsedQuestions;
            try {
                parsedQuestions = JSON.parse(e.target.result);
                if (!Array.isArray(parsedQuestions)) {
                    throw new Error("JSON data must be an array.");
                }
            } catch (error) {
                console.error("Parsing Error:", error);
                alert(`Error parsing JSON file: ${error.message}`);
                return;
            }

            questions = parsedQuestions.map(q => {
                if (!q.question) {
                    console.warn("A question is missing the 'question' field.", q);
                    return null;
                }
                if (!q.type) {
                    q.type = (q.options && q.answer) ? 'mcq' : 'written';
                }
                return q;
            }).filter(Boolean);

            if (questions.length === 0) {
                alert("The JSON file does not contain any valid questions.");
                return;
            }

            startQuiz();
        };
        reader.onerror = () => {
            alert('Error reading file.');
        };
        reader.readAsText(file);
    }

    function startQuiz() {
        startScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        currentQuestionIndex = 0;
        score = 0;
        globalTime = 0;
        writtenAnswers = [];
        mcqCount = questions.filter(q => q.type === 'mcq').length;
        shuffleQuestions();
        showQuestion();
        startGlobalTimer();
    }

    function shuffleQuestions() {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }

    function showQuestion() {
        resetQuestionState();
        updateProgress();

        const question = questions[currentQuestionIndex];

        // Safeguard against invalid question data
        if (!question) {
            console.error('Attempted to show an invalid question. Ending quiz.');
            showResult();
            return;
        }

        questionText.textContent = question.question;

        if (question.type === 'mcq') {
            optionsContainer.classList.remove('hidden');
            question.options.forEach(option => {
                const button = document.createElement('button');
                button.textContent = option;
                button.classList.add('option');
                button.addEventListener('click', () => selectAnswer(button, question.answer));
                optionsContainer.appendChild(button);
            });
            startQuestionTimer();
        } else if (question.type === 'written') {
            writtenAnswerInput.classList.remove('hidden');
            questionTimerSpan.textContent = '--';
        }
        nextButton.classList.remove('hidden');
    }

    function resetQuestionState() {
        clearInterval(questionTimer);
        optionsContainer.innerHTML = '';
        optionsContainer.classList.add('hidden');
        writtenAnswerInput.value = '';
        writtenAnswerInput.classList.add('hidden');
        nextButton.classList.add('hidden');
    }

    function startQuestionTimer() {
        let timeLeft = 60;
        questionTimerSpan.textContent = timeLeft;
        questionTimer = setInterval(() => {
            timeLeft--;
            questionTimerSpan.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                selectAnswer(null, questions[currentQuestionIndex].answer);
            }
        }, 1000);
    }

    function updateProgress() {
        const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
    }

    function selectAnswer(selectedButton, correctAnswer) {
        clearInterval(questionTimer);
        const options = optionsContainer.querySelectorAll('.option');
        options.forEach(option => {
            option.disabled = true;
            if (option.textContent === correctAnswer) {
                option.classList.add('correct');
            } else if (option === selectedButton) {
                option.classList.add('wrong');
            }
        });
        if (selectedButton && selectedButton.textContent === correctAnswer) {
            score++;
        }
    }

    function handleNextQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion.type === 'written') {
            writtenAnswers.push({
                question: currentQuestion.question,
                answer: writtenAnswerInput.value
            });
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }

    function showResult() {
        clearInterval(globalTimer);
        quizScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        scoreSpan.textContent = mcqCount > 0 ? `${score} / ${mcqCount}` : 'N/A';
        globalTimerSpan.textContent = `${globalTime} seconds`;

        if (writtenAnswers.length > 0) {
            writtenResultsContainer.classList.remove('hidden');
            writtenAnswersDisplay.innerHTML = '';
            writtenAnswers.forEach(item => {
                const answerBlock = document.createElement('div');
                answerBlock.classList.add('written-answer-block');
                const q = document.createElement('p');
                q.innerHTML = `<strong>Q:</strong> ${item.question}`;
                const a = document.createElement('p');
                a.innerHTML = `<strong>A:</strong> ${item.answer}`;
                answerBlock.appendChild(q);
                answerBlock.appendChild(a);
                writtenAnswersDisplay.appendChild(answerBlock);
            });
        } else {
            writtenResultsContainer.classList.add('hidden');
        }
    }

    function copyWrittenResults() {
        let textToCopy = '';
        writtenAnswers.forEach(item => {
            textToCopy += `Question: ${item.question}\nAnswer: ${item.answer}\n\n`;
        });
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyWrittenButton.textContent = 'Copied!';
            setTimeout(() => { copyWrittenButton.textContent = 'Copy Answers'; }, 2000);
        });
    }

    function startGlobalTimer() {
        clearInterval(globalTimer);
        globalTime = 0;
        globalTimerDisplay.textContent = `${globalTime}s`;
        globalTimer = setInterval(() => {
            globalTime++;
            globalTimerDisplay.textContent = `${globalTime}s`;
        }, 1000);
    }

    function applyDarkMode() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', darkMode);
        darkModeToggle.textContent = darkMode ? '☀️' : '🌙';
    }

    // --- Event Listeners ---
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    });
    uploadButton.addEventListener('click', () => fileInput.click());
    uploadButton.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadButton.classList.add('drag-over');
    });
    uploadButton.addEventListener('dragleave', () => uploadButton.classList.remove('drag-over'));
    uploadButton.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadButton.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    nextButton.addEventListener('click', handleNextQuestion);
    retakeButton.addEventListener('click', startQuiz);
    copyWrittenButton.addEventListener('click', copyWrittenResults);

    // --- Initial Run ---
    applyDarkMode();
});