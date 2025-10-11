const normalizeText = (value = '') => value.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').toLowerCase();

export { normalizeText };
