import { BaseComponent } from '../baseComponent.js';
import { debounce } from '../../utils/text.js';

class Header extends BaseComponent {
    constructor({ onHome, onToggleDark, onSearch, onSort }) {
        super();
        this.onHome = onHome;
        this.onToggleDark = onToggleDark;
        this.onSearch = onSearch;
        this.onSort = onSort;
        this.render();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'header';
        container.innerHTML = `
            <div class="header-left">
                <button id="home-button" class="hidden">Home</button>
                <div class="search-container">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="search-input" placeholder="Search documents..." class="search-input">
                    <button class="clear-search hidden" type="button" title="Clear search">✕</button>
                    <select id="sort-select" class="sort-select">
                        <option value="name">Sort by Name</option>
                        <option value="uploadDate">Sort by Upload Date</option>
                        <option value="lastAccessed">Sort by Access Date</option>
                        <option value="fileSize">Sort by Size</option>
                        <option value="questionCount">Sort by Questions</option>
                    </select>
                </div>
            </div>
            <div class="header-right">
                <button id="dark-mode-toggle">🌙</button>
            </div>
        `;

        const homeButton = container.querySelector('#home-button');
        const darkToggle = container.querySelector('#dark-mode-toggle');
        const searchInput = container.querySelector('#search-input');
        const sortSelect = container.querySelector('#sort-select');

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

        const debouncedSearch = debounce((value) => {
            if (this.onSearch) {
                this.onSearch(value);
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
            this.updateClearButton(e.target.value);
        });

        // Add clear button functionality
        const clearButton = container.querySelector('.clear-search');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                if (this.onSearch) {
                    this.onSearch('');
                }
                this.updateClearButton('');
                searchInput.focus();
            });
        }

        sortSelect.addEventListener('change', (e) => {
            if (this.onSort) {
                this.onSort(e.target.value);
            }
        });

        // Make header clickable to focus search (except on interactive elements)
        container.addEventListener('click', (e) => {
            // Don't focus search if clicking on interactive elements
            if (e.target === homeButton || 
                e.target === darkToggle || 
                e.target === sortSelect || 
                e.target === clearButton ||
                e.target === searchInput) {
                return;
            }
            
            // Focus the search input
            if (searchInput && !searchInput.classList.contains('hidden')) {
                searchInput.focus();
            }
        });

        // Add keyboard shortcut (Ctrl/Cmd + K) to focus search
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInput && !searchInput.classList.contains('hidden')) {
                    searchInput.focus();
                    searchInput.select();
                }
            }
        });

        this.homeButton = homeButton;
        this.darkToggle = darkToggle;
        this.searchInput = searchInput;
        this.sortSelect = sortSelect;
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

    setSearchVisibility(visible) {
        const searchContainer = this.element?.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.toggle('hidden', !visible);
        }
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.updateClearButton('');
        }
    }

    updateClearButton(value) {
        const clearButton = this.element?.querySelector('.clear-search');
        if (clearButton) {
            clearButton.classList.toggle('hidden', !value);
        }
    }

    setSortValue(value) {
        if (this.sortSelect) {
            this.sortSelect.value = value;
        }
    }
}

export { Header };
