import { BaseComponent } from '../baseComponent.js';

class Header extends BaseComponent {
    constructor({ onHome, onToggleDark }) {
        super();
        this.onHome = onHome;
        this.onToggleDark = onToggleDark;
        this.render();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'header';
        container.innerHTML = `
            <button id="home-button" class="hidden">Home</button>
            <div class="spacer"></div>
            <button id="dark-mode-toggle">🌙</button>
        `;

        const homeButton = container.querySelector('#home-button');
        const darkToggle = container.querySelector('#dark-mode-toggle');

        homeButton.addEventListener('click', () => {
            if (this.onHome) {
                this.onHome();
            }
        });

        darkToggle.addEventListener('click', () => {
            if (this.onToggleDark) {
                this.onToggleDark();
            }
        });

        this.homeButton = homeButton;
        this.darkToggle = darkToggle;
        this.element = container;
    }

    setHomeVisibility(visible) {
        if (!this.homeButton) {
            return;
        }
        this.homeButton.classList.toggle('hidden', !visible);
    }

    setDarkModeIcon(isDark) {
        if (!this.darkToggle) {
            return;
        }
        this.darkToggle.textContent = isDark ? '☀️' : '🌙';
    }
}

export { Header };
