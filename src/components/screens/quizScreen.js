import { BaseComponent } from '../baseComponent.js';

class QuizScreen extends BaseComponent {
    constructor({ onNext }) {
        super();
        this.onNext = onNext;
        this.optionButtons = [];
        this.render();
    }

    render() {
        const container = document.createElement('section');
        container.id = 'quiz-screen';
        container.classList.add('hidden');
        container.innerHTML = `
            <div id="progress-container">
                <div id="progress-bar"></div>
            </div>
            <p id="progress-text"></p>
            <div id="timer-container">
                <p>Time left: <span id="question-timer">180</span>s</p>
                <p>Total Time: <span id="global-timer-display">0s</span></p>
            </div>
            <div id="question-container">
                <p id="question-text"></p>
                <div id="options-container"></div>
                <textarea id="written-answer" class="hidden" placeholder="Type your answer here"></textarea>
            </div>
            <button id="next-button" class="hidden">Next</button>
        `;

        this.element = container;
        this.progressBar = container.querySelector('#progress-bar');
        this.progressText = container.querySelector('#progress-text');
        this.questionTimerSpan = container.querySelector('#question-timer');
        this.globalTimerDisplay = container.querySelector('#global-timer-display');
        this.questionText = container.querySelector('#question-text');
        this.optionsContainer = container.querySelector('#options-container');
        this.writtenAnswerInput = container.querySelector('#written-answer');
        this.nextButton = container.querySelector('#next-button');

        this.nextButton.addEventListener('click', () => {
            if (this.onNext) {
                this.onNext();
            }
        });
    }

    setProgress(currentIndex, total) {
        const progressPercentage = ((currentIndex + 1) / total) * 100;
        this.progressBar.style.width = `${progressPercentage}%`;
        this.progressText.textContent = `Question ${currentIndex + 1} of ${total}`;
    }

    resetState() {
        this.optionButtons = [];
        this.optionsContainer.innerHTML = '';
        this.optionsContainer.classList.add('hidden');
        this.writtenAnswerInput.value = '';
        this.writtenAnswerInput.classList.add('hidden');
        this.writtenAnswerInput.disabled = false;
        this.nextButton.classList.add('hidden');
    }

    renderQuestion(question, mode, { onOptionSelect }) {
        this.resetState();
        this.questionText.textContent = question.question;
        this.nextButton.classList.remove('hidden');

        if (question.type === 'mcq') {
            this.optionsContainer.classList.remove('hidden');
            this.optionButtons = question.options.map((optionText) => {
                const button = document.createElement('button');
                button.textContent = optionText;
                button.classList.add('option');
                if (mode === 'take' && onOptionSelect) {
                    button.addEventListener('click', () => onOptionSelect(optionText, button));
                } else {
                    button.disabled = true;
                }
                this.optionsContainer.appendChild(button);
                return button;
            });
        } else {
            this.writtenAnswerInput.classList.remove('hidden');
            if (mode === 'review') {
                this.writtenAnswerInput.disabled = true;
                this.writtenAnswerInput.value = question.answer || '';
            }
        }
    }

    revealMcqAnswer(correctAnswer, selectedButton, normalizeFn, mode) {
        this.optionButtons.forEach((button) => {
            button.disabled = true;
            const isCorrect = normalizeFn(button.textContent) === normalizeFn(correctAnswer);
            if (isCorrect) {
                button.classList.add('correct');
            } else if (selectedButton && button === selectedButton) {
                button.classList.add('wrong');
            }
        });

        if (mode === 'review') {
            this.questionTimerSpan.textContent = '--';
        }
    }

    setQuestionTimer(value) {
        this.questionTimerSpan.textContent = value;
    }

    setGlobalTimer(value) {
        this.globalTimerDisplay.textContent = value;
    }

    getWrittenAnswer() {
        return this.writtenAnswerInput.value;
    }

    disableWrittenAnswer() {
        this.writtenAnswerInput.disabled = true;
    }

    enableWrittenAnswer() {
        this.writtenAnswerInput.disabled = false;
        this.writtenAnswerInput.classList.remove('hidden');
    }
}

export { QuizScreen };
