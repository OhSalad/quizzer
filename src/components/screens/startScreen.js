import { BaseComponent } from '../baseComponent.js';

class StartScreen extends BaseComponent {
    constructor({ onFileSelected, onDocumentSelected, onDocumentDelete }) {
        super();
        this.onFileSelected = onFileSelected;
        this.onDocumentSelected = onDocumentSelected;
        this.onDocumentDelete = onDocumentDelete;
        this.render();
    }

    render() {
        const container = document.createElement('section');
        container.id = 'start-screen';
        container.innerHTML = `
            <h1>Welcome to Quizzer</h1>
            <p>Drag and drop your JSON file onto the button, or click to select.</p>
            <button id="upload-button">Upload JSON File</button>
            <input type="file" id="file-input" accept=".json" class="hidden">
            <div id="history-section">
                <h2>Recent Documents</h2>
                <div id="history-container"></div>
                <div id="history-empty-state" class="hidden">
                    <p>No documents uploaded yet. Upload your first JSON file to get started!</p>
                </div>
            </div>
        `;

        this.element = container;
        this.uploadButton = container.querySelector('#upload-button');
        this.fileInput = container.querySelector('#file-input');
        this.historyContainer = container.querySelector('#history-container');
        this.historyEmptyState = container.querySelector('#history-empty-state');

        this.fileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file && this.onFileSelected) {
                this.onFileSelected(file);
            }
            this.fileInput.value = '';
        });

        this.uploadButton.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.uploadButton.addEventListener('dragover', (event) => {
            event.preventDefault();
            this.uploadButton.classList.add('drag-over');
        });

        this.uploadButton.addEventListener('dragleave', () => {
            this.uploadButton.classList.remove('drag-over');
        });

        this.uploadButton.addEventListener('drop', (event) => {
            event.preventDefault();
            this.uploadButton.classList.remove('drag-over');
            const file = event.dataTransfer?.files?.[0];
            if (file && this.onFileSelected) {
                this.onFileSelected(file);
            }
        });
    }

    updateHistory(documents) {
        if (!Array.isArray(documents) || documents.length === 0) {
            this.historyContainer.classList.add('hidden');
            this.historyEmptyState.classList.remove('hidden');
            this.historyContainer.innerHTML = '';
            return;
        }

        this.historyContainer.classList.remove('hidden');
        this.historyEmptyState.classList.add('hidden');
        this.historyContainer.innerHTML = '';

        documents.slice(0, 10).forEach((doc) => {
            const card = this.createHistoryCard(doc);
            this.historyContainer.appendChild(card);
        });
    }

    createHistoryCard(docData) {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.dataset.documentId = docData.id;

        const uploadDate = new Date(docData.uploadDate);
        const formattedDate = `${uploadDate.toLocaleDateString()} ${uploadDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        const formatFileSize = (bytes) => {
            if (bytes === 0) {
                return '0 B';
            }
            const k = 1024;
            const sizes = ['B', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
        };

        card.innerHTML = `
            <div class="document-card-info">
                <div class="document-card-title">${docData.filename}</div>
                <div class="document-card-meta">
                    <span>📅 ${formattedDate}</span>
                    <span>📊 ${docData.questionCount} questions</span>
                    <span>📁 ${formatFileSize(docData.fileSize)}</span>
                </div>
            </div>
            <div class="document-card-actions">
                <button class="delete-button" title="Delete document">🗑️</button>
            </div>
        `;

        card.addEventListener('click', (event) => {
            if (event.target instanceof HTMLElement && event.target.classList.contains('delete-button')) {
                return;
            }
            if (this.onDocumentSelected) {
                this.onDocumentSelected(docData.id);
            }
        });

        const deleteButton = card.querySelector('.delete-button');
        deleteButton?.addEventListener('click', (event) => {
            event.stopPropagation();
            if (this.onDocumentDelete) {
                this.onDocumentDelete(docData.id, docData.filename);
            }
        });

        return card;
    }
}

export { StartScreen };
