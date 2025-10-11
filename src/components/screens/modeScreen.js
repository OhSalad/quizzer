import { BaseComponent } from '../baseComponent.js';

class ModeScreen extends BaseComponent {
    constructor({ onReview, onTake }) {
        super();
        this.onReview = onReview;
        this.onTake = onTake;
        this.render();
    }

    render() {
        const container = document.createElement('section');
        container.id = 'mode-screen';
        container.classList.add('hidden');
        container.innerHTML = `
            <h2>Choose how you want to proceed</h2>
            <div class="mode-buttons">
                <button id="review-mode-button">Review Answers</button>
                <button id="take-mode-button">Take Quiz</button>
            </div>
        `;

        this.element = container;

        const reviewButton = container.querySelector('#review-mode-button');
        const takeButton = container.querySelector('#take-mode-button');

        reviewButton?.addEventListener('click', () => {
            if (this.onReview) {
                this.onReview();
            }
        });

        takeButton?.addEventListener('click', () => {
            if (this.onTake) {
                this.onTake();
            }
        });
    }
}

export { ModeScreen };
