const normalizeText = (value = '') => value.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').toLowerCase();

const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export { normalizeText, debounce };
