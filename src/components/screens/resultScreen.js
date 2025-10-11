import { BaseComponent } from '../baseComponent.js';

class ResultScreen extends BaseComponent {
    constructor({ onRetake, onCopy }) {
        super();
        this.onRetake = onRetake;
        this.onCopy = onCopy;
        this.render();
    }

    render() {
        const container = document.createElement('section');
        container.id = 'result-screen';
        container.classList.add('hidden');
        container.innerHTML = `
            <h2>Quiz Complete!</h2>
            <p>Your score is: <span id="score"></span></p>
            <p>Total time: <span id="global-timer"></span></p>
            <div id="written-results-container" class="hidden">
                <h3>Written Answers</h3>
                <div id="written-answers-display"></div>
                <button id="copy-written-button">Copy Answers</button>
            </div>
            <button id="retake-button">Retake Quiz</button>
        `;

        this.element = container;
        this.scoreSpan = container.querySelector('#score');
        this.globalTimerSpan = container.querySelector('#global-timer');
        this.writtenResultsContainer = container.querySelector('#written-results-container');
        this.writtenAnswersDisplay = container.querySelector('#written-answers-display');
        this.copyButton = container.querySelector('#copy-written-button');
        this.retakeButton = container.querySelector('#retake-button');

        this.copyButton.addEventListener('click', () => {
            if (this.onCopy) {
                this.onCopy();
            }
        });

        this.retakeButton.addEventListener('click', () => {
            if (this.onRetake) {
                this.onRetake();
            }
        });
    }

    showResults({ scoreText, totalTimeText, writtenAnswers }) {
        this.scoreSpan.textContent = scoreText;
        this.globalTimerSpan.textContent = totalTimeText;

        if (Array.isArray(writtenAnswers) && writtenAnswers.length > 0) {
            this.writtenResultsContainer.classList.remove('hidden');
            this.writtenAnswersDisplay.innerHTML = '';
            writtenAnswers.forEach(({ question, answer }) => {
                const block = document.createElement('div');
                block.classList.add('written-answer-block');
                block.innerHTML = `
                    <p><strong>Q:</strong> ${question}</p>
                    <p><strong>A:</strong> ${answer}</p>
                `;
                this.writtenAnswersDisplay.appendChild(block);
            });
        } else {
            this.writtenResultsContainer.classList.add('hidden');
            this.writtenAnswersDisplay.innerHTML = '';
        }
    }

    showCopyFeedback() {
        this.copyButton.textContent = 'Copied!';
        setTimeout(() => {
            this.copyButton.textContent = 'Copy Answers';
        }, 2000);
    }
}

export { ResultScreen };
