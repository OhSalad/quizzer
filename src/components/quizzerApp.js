import { Header } from './common/header.js';
import { StartScreen } from './screens/startScreen.js';
import { ModeScreen } from './screens/modeScreen.js';
import { QuizScreen } from './screens/quizScreen.js';
import { ResultScreen } from './screens/resultScreen.js';
import { DocumentCache } from '../services/documentCache.js';
import { normalizeText } from '../utils/text.js';

class QuizzerApp extends HTMLElement {
    constructor() {
        super();
        this.questions = [];
        this.writtenAnswers = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.questionTimerId = null;
        this.globalTimerId = null;
        this.globalTime = 0;
        this.mcqCount = 0;
        this.mode = 'take';
        this.hasAnsweredCurrent = false;
        this.handleCacheChanged = () => this.refreshHistory();
    }

    connectedCallback() {
        this.renderApp();
        this.initializeDocumentCache();
        this.applyDarkMode();
        this.refreshHistory();
        window.addEventListener('documentCacheChanged', this.handleCacheChanged);
    }

    disconnectedCallback() {
        window.removeEventListener('documentCacheChanged', this.handleCacheChanged);
        this.clearTimers();
    }

    renderApp() {
        this.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'quiz-container';

        this.header = new Header({
            onHome: () => this.resetToHome(),
            onToggleDark: () => this.toggleDarkMode()
        });
        this.startScreen = new StartScreen({
            onFileSelected: (file) => this.handleFile(file),
            onDocumentSelected: (id) => this.loadCachedDocument(id),
            onDocumentDelete: (id, name) => this.deleteCachedDocument(id, name)
        });
        this.modeScreen = new ModeScreen({
            onReview: () => this.startQuiz('review'),
            onTake: () => this.startQuiz('take')
        });
        this.quizScreen = new QuizScreen({
            onNext: () => this.handleNextQuestion()
        });
        this.resultScreen = new ResultScreen({
            onRetake: () => this.startQuiz(this.mode),
            onCopy: () => this.copyWrittenResults()
        });

        this.header.mount(container);
        this.startScreen.mount(container);
        this.modeScreen.mount(container);
        this.quizScreen.mount(container);
        this.resultScreen.mount(container);
        
        // Add footer
        const footer = document.createElement('div');
        footer.className = 'app-footer';
        footer.innerHTML = `
            <p>✨ Learning with vibes</p>
            <p>Keyboard shortcuts: <kbd>Tab</kbd> to navigate • <kbd>Enter</kbd> to select</p>
        `;
        container.appendChild(footer);

        this.appendChild(container);
    }

    initializeDocumentCache() {
        try {
            this.documentCache = new DocumentCache();
            console.log('DocumentCache initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DocumentCache:', error);
            this.documentCache = null;
        }
    }

    handleFile(file) {
        if (!file || (file.type && file.type !== 'application/json' && !file.name.endsWith('.json'))) {
            alert('Please drop or select a valid JSON file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result ?? 'null');
                if (!Array.isArray(parsed)) {
                    throw new Error('JSON data must be an array.');
                }
                this.questions = parsed
                    .map((question) => this.prepareQuestion(question))
                    .filter(Boolean);
                if (this.questions.length === 0) {
                    alert('The JSON file does not contain any valid questions.');
                    return;
                }
                this.cacheUploadedDocument(file, this.questions);
                this.openModeSelection();
            } catch (error) {
                console.error('Parsing Error:', error);
                alert(`Error parsing JSON file: ${error.message}`);
            }
        };
        reader.onerror = () => alert('Error reading file.');
        reader.readAsText(file);
    }

    prepareQuestion(rawQuestion) {
        if (!rawQuestion?.question) {
            console.warn("A question is missing the 'question' field.", rawQuestion);
            return null;
        }

        const question = { ...rawQuestion };
        if (!question.type) {
            question.type = question.options && question.answer ? 'mcq' : 'written';
        }
        return question;
    }

    cacheUploadedDocument(file, questions) {
        if (!this.documentCache) {
            console.warn('DocumentCache not available, skipping caching');
            return;
        }

        try {
            const documentId = this.documentCache.saveDocument(file, questions);
            if (documentId) {
                console.log(`Document cached successfully with ID: ${documentId}`);
            } else {
                console.warn('Failed to cache document, but proceeding with quiz');
            }
            this.refreshHistory();
        } catch (error) {
            console.error('Error caching document:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Some older documents may have been removed to make space.');
            }
        }
    }

    openModeSelection() {
        this.startScreen.hide();
        this.resultScreen.hide();
        this.modeScreen.show();
    }

    startQuiz(mode) {
        this.mode = mode;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.globalTime = 0;
        this.writtenAnswers = [];
        this.mcqCount = this.questions.filter((question) => question.type === 'mcq').length;
        this.shuffleQuestions();
        this.modeScreen.hide();
        this.resultScreen.hide();
        this.startScreen.hide();
        this.quizScreen.show();
        this.header.setHomeVisibility(true);
        this.showCurrentQuestion();
        this.startGlobalTimer();
    }

    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    showCurrentQuestion() {
        this.clearQuestionTimer();
        this.hasAnsweredCurrent = false;
        const question = this.questions[this.currentQuestionIndex];
        if (!question) {
            console.error('Attempted to show an invalid question. Ending quiz.');
            this.finishQuiz();
            return;
        }

        this.quizScreen.setProgress(this.currentQuestionIndex, this.questions.length);
        this.quizScreen.renderQuestion(question, this.mode, {
            onOptionSelect: (optionText, button) => this.handleOptionSelection(optionText, button)
        });

        if (question.type === 'mcq') {
            if (this.mode === 'take') {
                this.startQuestionTimer();
            } else {
                this.quizScreen.revealMcqAnswer(question.answer, null, normalizeText, this.mode);
                this.quizScreen.setQuestionTimer('--');
            }
        } else if (question.type === 'written') {
            this.quizScreen.setQuestionTimer('--');
            if (this.mode === 'take') {
                this.quizScreen.enableWrittenAnswer();
            } else {
                this.quizScreen.disableWrittenAnswer();
            }
        }
    }

    handleOptionSelection(optionText, button) {
        if (this.hasAnsweredCurrent || this.mode !== 'take') {
            return;
        }
        this.hasAnsweredCurrent = true;
        this.clearQuestionTimer();
        const currentQuestion = this.questions[this.currentQuestionIndex];
        if (normalizeText(optionText) === normalizeText(currentQuestion.answer)) {
            this.score += 1;
        }
        this.quizScreen.revealMcqAnswer(currentQuestion.answer, button, normalizeText, this.mode);
    }

    startQuestionTimer() {
        let timeLeft = 180;
        this.quizScreen.setQuestionTimer(timeLeft);
        this.questionTimerId = window.setInterval(() => {
            timeLeft -= 1;
            this.quizScreen.setQuestionTimer(timeLeft);
            if (timeLeft <= 0) {
                this.clearQuestionTimer();
                if (!this.hasAnsweredCurrent) {
                    this.hasAnsweredCurrent = true;
                    const currentQuestion = this.questions[this.currentQuestionIndex];
                    this.quizScreen.revealMcqAnswer(currentQuestion.answer, null, normalizeText, this.mode);
                }
            }
        }, 1000);
    }

    clearQuestionTimer() {
        if (this.questionTimerId) {
            clearInterval(this.questionTimerId);
            this.questionTimerId = null;
        }
    }

    handleNextQuestion() {
        const currentQuestion = this.questions[this.currentQuestionIndex];
        if (currentQuestion.type === 'written') {
            const answerValue = this.mode === 'review' ? (currentQuestion.answer || '') : this.quizScreen.getWrittenAnswer();
            this.writtenAnswers.push({
                question: currentQuestion.question,
                answer: answerValue
            });
        }

        this.currentQuestionIndex += 1;
        if (this.currentQuestionIndex < this.questions.length) {
            this.showCurrentQuestion();
        } else {
            this.finishQuiz();
        }
    }

    finishQuiz() {
        this.clearTimers();
        this.quizScreen.hide();
        this.header.setHomeVisibility(false);
        this.resultScreen.show();
        const scoreText = this.mcqCount > 0 ? `${this.score} / ${this.mcqCount}` : 'N/A';
        const totalTimeText = `${this.globalTime} seconds`;
        this.resultScreen.showResults({
            scoreText,
            totalTimeText,
            writtenAnswers: this.writtenAnswers
        });
    }

    startGlobalTimer() {
        this.clearGlobalTimer();
        this.globalTime = 0;
        this.quizScreen.setGlobalTimer(`${this.globalTime}s`);
        this.globalTimerId = window.setInterval(() => {
            this.globalTime += 1;
            this.quizScreen.setGlobalTimer(`${this.globalTime}s`);
        }, 1000);
    }

    clearGlobalTimer() {
        if (this.globalTimerId) {
            clearInterval(this.globalTimerId);
            this.globalTimerId = null;
        }
    }

    clearTimers() {
        this.clearQuestionTimer();
        this.clearGlobalTimer();
    }

    copyWrittenResults() {
        if (!navigator.clipboard) {
            alert('Clipboard access is not available in this browser.');
            return;
        }
        const payload = this.writtenAnswers
            .map((item) => `Question: ${item.question}\nAnswer: ${item.answer}`)
            .join('\n\n');
        navigator.clipboard.writeText(payload).then(() => {
            this.resultScreen.showCopyFeedback();
        });
    }

    resetToHome() {
        this.clearTimers();
        this.startScreen.show();
        this.modeScreen.hide();
        this.quizScreen.hide();
        this.resultScreen.hide();
        this.header.setHomeVisibility(false);
        this.questions = [];
        this.writtenAnswers = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.globalTime = 0;
        this.mode = 'take';
        this.refreshHistory();
    }

    applyDarkMode() {
        const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', darkModeEnabled);
        this.header.setDarkModeIcon(darkModeEnabled);
    }

    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.header.setDarkModeIcon(isDark);
    }

    refreshHistory() {
        if (!this.documentCache) {
            this.startScreen.updateHistory([]);
            return;
        }
        const documents = this.documentCache.getAllDocuments();
        this.startScreen.updateHistory(documents);
    }

    loadCachedDocument(documentId) {
        if (!this.documentCache) {
            alert('Document cache is not available. Please refresh the page and try again.');
            return;
        }
        const documentEntry = this.documentCache.getDocument(documentId);
        if (!documentEntry) {
            alert('Document not found. It may have been removed from cache.');
            this.refreshHistory();
            return;
        }
        this.questions = documentEntry.questions;
        if (this.questions.length === 0) {
            alert('This document contains no valid questions.');
            return;
        }
        this.openModeSelection();
    }

    deleteCachedDocument(documentId, filename) {
        if (!this.documentCache) {
            alert('Document cache is not available. Please refresh the page and try again.');
            return;
        }
        const confirmed = window.confirm(`Are you sure you want to delete "${filename}" from your history?`);
        if (!confirmed) {
            return;
        }
        const success = this.documentCache.removeDocument(documentId);
        if (!success) {
            alert('Failed to delete document. Please try again.');
        }
        this.refreshHistory();
    }
}

customElements.define('quizzer-app', QuizzerApp);
