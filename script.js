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
    const modeScreen = document.getElementById('mode-screen');
    const reviewModeButton = document.getElementById('review-mode-button');
    const takeModeButton = document.getElementById('take-mode-button');
    const writtenResultsContainer = document.getElementById('written-results-container');
    const writtenAnswersDisplay = document.getElementById('written-answers-display');
    const copyWrittenButton = document.getElementById('copy-written-button');
    const homeButton = document.getElementById('home-button');

    // --- State Variables ---
    let questions = [];
    let writtenAnswers = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let questionTimer;
    let globalTimer;
    let globalTime = 0;
    let mcqCount = 0;
    let mode = 'take'; // 'take' or 'review'

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

            // Show mode selection screen so user can choose to review or take the quiz
            startScreen.classList.add('hidden');
            modeScreen.classList.remove('hidden');
        };
        reader.onerror = () => {
            alert('Error reading file.');
        };
        reader.readAsText(file);
    }

    function startQuiz() {
        startScreen.classList.add('hidden');
        modeScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        homeButton.classList.remove('hidden');
        currentQuestionIndex = 0;
        score = 0;
        globalTime = 0;
        writtenAnswers = [];
        mcqCount = questions.filter(q => q.type === 'mcq').length;
        shuffleQuestions();
        showQuestion();
        startGlobalTimer();
    }

    // Mode button handlers
    reviewModeButton.addEventListener('click', () => {
        mode = 'review';
        startQuiz();
    });
    takeModeButton.addEventListener('click', () => {
        mode = 'take';
        startQuiz();
    });

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
                // In 'take' mode the user can select an option. In 'review' mode we simply show correct answer immediately.
                if (mode === 'take') {
                    button.addEventListener('click', () => selectAnswer(button, question.answer));
                }
                optionsContainer.appendChild(button);
            });
            if (mode === 'take') {
                startQuestionTimer();
            } else if (mode === 'review') {
                // Immediately highlight answers in review mode
                const options = optionsContainer.querySelectorAll('.option');
                options.forEach(opt => {
                    opt.disabled = true;
                    if (opt.textContent === question.answer) {
                        opt.classList.add('correct');
                    }
                });
                // No per-question timer in review mode
                questionTimerSpan.textContent = '--';
            }
        } else if (question.type === 'written') {
            writtenAnswerInput.classList.remove('hidden');
            // In review mode, show the provided answer (if any) and make readonly. In take mode, allow typing.
            if (mode === 'review') {
                writtenAnswerInput.value = question.answer || '';
                writtenAnswerInput.disabled = true;
            } else {
                writtenAnswerInput.value = '';
                writtenAnswerInput.disabled = false;
            }
            questionTimerSpan.textContent = '--';
        }
        nextButton.classList.remove('hidden');
    }

    function resetQuestionState() {
        clearInterval(questionTimer);
        optionsContainer.innerHTML = '';
        optionsContainer.classList.add('hidden');
        writtenAnswerInput.value = '';
        writtenAnswerInput.disabled = false;
        writtenAnswerInput.classList.add('hidden');
        nextButton.classList.add('hidden');
    }

    function startQuestionTimer() {
        let timeLeft = 180;
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
        if (mode === 'take') {
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
        } else if (mode === 'review') {
            // In review mode selection shouldn't happen, but provide a safe no-op that ensures correct is highlighted
            const options = optionsContainer.querySelectorAll('.option');
            options.forEach(option => {
                option.disabled = true;
                if (option.textContent === correctAnswer) option.classList.add('correct');
            });
        }
    }

    function handleNextQuestion() {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion.type === 'written') {
            const answerVal = mode === 'review' ? (currentQuestion.answer || '') : writtenAnswerInput.value;
            writtenAnswers.push({
                question: currentQuestion.question,
                answer: answerVal
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
        homeButton.classList.add('hidden');
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

    function resetToHome() {
        clearInterval(questionTimer);
        clearInterval(globalTimer);
        quizScreen.classList.add('hidden');
        resultScreen.classList.add('hidden');
        modeScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        homeButton.classList.add('hidden');
        // Reset state variables
        questions = [];
        writtenAnswers = [];
        currentQuestionIndex = 0;
        score = 0;
        globalTime = 0;
        mode = 'take';
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
    homeButton.addEventListener('click', resetToHome);

    // --- Initial Run ---
    applyDarkMode();
});