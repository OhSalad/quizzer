class BaseComponent {
    constructor() {
        this.element = null;
    }

    mount(parent) {
        if (!this.element) {
            throw new Error('Component element is not defined. Did you forget to call render()?');
        }
        parent.appendChild(this.element);
    }

    show() {
        if (this.element) {
            this.element.classList.remove('hidden');
        }
    }

    hide() {
        if (this.element) {
            this.element.classList.add('hidden');
        }
    }
}

export { BaseComponent };
