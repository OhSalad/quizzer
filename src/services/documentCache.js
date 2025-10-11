/**
 * Storage infrastructure for document history caching
 * Implements DocumentCache class and StorageManager utility
 */

class StorageManager {
    static STORAGE_KEY = 'quizzer_document_cache';
    static MAX_DOCUMENTS = 50;
    static MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

    /**
     * Save documents to localStorage with error handling
     * @param {Array} documents - Array of cached documents
     * @returns {boolean} - Success status
     */
    static save(documents) {
        try {
            const dataString = JSON.stringify(documents);

            // Check if data exceeds storage limit
            if (dataString.length > this.MAX_STORAGE_SIZE) {
                console.warn('Storage size limit exceeded, cleanup required');
                return false;
            }

            localStorage.setItem(this.STORAGE_KEY, dataString);
            return true;
        } catch (error) {
            console.error('Failed to save documents to storage:', error);

            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded');
            }

            return false;
        }
    }

    /**
     * Load documents from localStorage with error handling
     * @returns {Array} - Array of cached documents or empty array on error
     */
    static load() {
        try {
            const dataString = localStorage.getItem(this.STORAGE_KEY);

            if (!dataString) {
                return [];
            }

            const documents = JSON.parse(dataString);

            // Validate loaded data structure
            if (!Array.isArray(documents)) {
                console.warn('Invalid document cache structure, clearing cache');
                this.clear();
                return [];
            }

            return documents;
        } catch (error) {
            console.error('Failed to load documents from storage:', error);

            // Clear corrupted data
            this.clear();
            return [];
        }
    }

    /**
     * Clear all cached documents
     */
    static clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear storage:', error);
        }
    }

    /**
     * Get current storage usage information with enhanced details
     * @returns {Object} - Storage usage statistics
     */
    static getUsage() {
        try {
            const dataString = localStorage.getItem(this.STORAGE_KEY);
            const currentSize = dataString ? dataString.length : 0;
            const documents = this.load();

            // Calculate total localStorage usage (approximate)
            let totalLocalStorageSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalLocalStorageSize += localStorage[key].length + key.length;
                }
            }

            return {
                currentSize,
                maxSize: this.MAX_STORAGE_SIZE,
                documentCount: documents.length,
                maxDocuments: this.MAX_DOCUMENTS,
                usagePercentage: (currentSize / this.MAX_STORAGE_SIZE) * 100,
                totalLocalStorageSize,
                availableSpace: this.MAX_STORAGE_SIZE - currentSize,
                isNearLimit: (currentSize / this.MAX_STORAGE_SIZE) > 0.8,
                needsCleanup: documents.length >= this.MAX_DOCUMENTS || (currentSize / this.MAX_STORAGE_SIZE) > 0.9
            };
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            return {
                currentSize: 0,
                maxSize: this.MAX_STORAGE_SIZE,
                documentCount: 0,
                maxDocuments: this.MAX_DOCUMENTS,
                usagePercentage: 0,
                totalLocalStorageSize: 0,
                availableSpace: this.MAX_STORAGE_SIZE,
                isNearLimit: false,
                needsCleanup: false
            };
        }
    }

    /**
     * Estimate storage quota using various browser APIs
     * @returns {Promise<Object>} - Storage quota information
     */
    static async getStorageQuota() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    available: estimate.quota - estimate.usage,
                    usagePercentage: (estimate.usage / estimate.quota) * 100,
                    supported: true
                };
            }
        } catch (error) {
            console.warn('Storage quota API not available:', error);
        }

        // Fallback for browsers without Storage API
        return {
            quota: null,
            usage: null,
            available: null,
            usagePercentage: null,
            supported: false
        };
    }

    /**
     * Check if localStorage is available with detailed diagnostics
     * @returns {Object} - Availability status and details
     */
    static isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);

            return {
                available: retrieved === 'test',
                reason: retrieved === 'test' ? 'available' : 'test_failed'
            };
        } catch (error) {
            let reason = 'unknown_error';

            if (error.name === 'QuotaExceededError') {
                reason = 'quota_exceeded';
            } else if (error.name === 'SecurityError') {
                reason = 'security_error';
            } else if (typeof Storage === 'undefined') {
                reason = 'not_supported';
            }

            return {
                available: false,
                reason,
                error: error.message
            };
        }
    }

    /**
     * Attempt to recover from storage errors
     * @returns {boolean} - Recovery success status
     */
    static attemptRecovery() {
        try {
            // Try to clear some space by removing non-essential items
            const keysToCheck = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key !== this.STORAGE_KEY) {
                    keysToCheck.push(key);
                }
            }

            // Remove temporary or old items (basic heuristic)
            keysToCheck.forEach(key => {
                if (key.includes('temp') || key.includes('cache') || key.includes('tmp')) {
                    try {
                        localStorage.removeItem(key);
                        console.log(`Removed temporary storage item: ${key}`);
                    } catch (error) {
                        // Ignore individual removal errors
                    }
                }
            });

            // Test if storage is now available
            const availability = this.isAvailable();
            return availability.available;
        } catch (error) {
            console.error('Storage recovery failed:', error);
            return false;
        }
    }
}

class CachedDocument {
    /**
     * Create a cached document instance
     * @param {File} file - Original file object
     * @param {Array} questions - Parsed questions array
     */
    constructor(file, questions) {
        this.id = this.generateId(file);
        this.filename = file.name;
        this.uploadDate = new Date().toISOString();
        this.fileSize = file.size;
        this.questions = questions;
        this.questionCount = questions.length;
        this.mcqCount = questions.filter(q => q.type === 'mcq').length;
        this.writtenCount = questions.filter(q => q.type === 'written').length;
        this.lastAccessed = new Date().toISOString();
    }

    /**
     * Generate unique document ID based on file properties
     * @param {File} file - File object
     * @returns {string} - Unique document ID
     */
    generateId(file) {
        const timestamp = Date.now();
        const fileInfo = `${file.name}_${file.size}_${timestamp}`;

        // Simple hash function for ID generation
        let hash = 0;
        for (let i = 0; i < fileInfo.length; i++) {
            const char = fileInfo.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }

    /**
     * Update last accessed timestamp
     */
    updateLastAccessed() {
        this.lastAccessed = new Date().toISOString();
    }

    /**
     * Convert to plain object for storage
     * @returns {Object} - Serializable document object
     */
    toJSON() {
        return {
            id: this.id,
            filename: this.filename,
            uploadDate: this.uploadDate,
            fileSize: this.fileSize,
            questions: this.questions,
            questionCount: this.questionCount,
            mcqCount: this.mcqCount,
            writtenCount: this.writtenCount,
            lastAccessed: this.lastAccessed
        };
    }

    /**
     * Create CachedDocument from stored object
     * @param {Object} data - Stored document data
     * @returns {CachedDocument} - Reconstructed document instance
     */
    static fromJSON(data) {
        const doc = Object.create(CachedDocument.prototype);
        Object.assign(doc, data);
        return doc;
    }
}

class DocumentCache {
    constructor() {
        this.documents = [];
        this.inMemoryMode = false;
        this.storageEventListener = null;
        this.quotaMonitorInterval = null;

        this.initializeStorage();
        this.setupStorageEventHandling();
        this.startQuotaMonitoring();
    }

    /**
     * Initialize storage system with graceful degradation
     */
    initializeStorage() {
        const availability = StorageManager.isAvailable();

        if (!availability.available) {
            console.warn(`localStorage not available (${availability.reason}), using in-memory cache`);
            this.inMemoryMode = true;

            // Attempt recovery for certain error types
            if (availability.reason === 'quota_exceeded') {
                console.log('Attempting storage recovery...');
                if (StorageManager.attemptRecovery()) {
                    console.log('Storage recovery successful, retrying initialization...');
                    this.inMemoryMode = false;
                    this.loadFromStorage();
                    return;
                }
            }

            return;
        }

        this.loadFromStorage();
    }

    /**
     * Load documents from localStorage
     */
    loadFromStorage() {
        if (this.inMemoryMode) {
            return;
        }

        const storedDocuments = StorageManager.load();
        this.documents = storedDocuments.map(data => CachedDocument.fromJSON(data));
    }

    /**
     * Setup cross-tab synchronization via storage events
     */
    setupStorageEventHandling() {
        if (this.inMemoryMode || typeof window === 'undefined') {
            return;
        }

        this.storageEventListener = (event) => {
            // Only handle our storage key
            if (event.key === StorageManager.STORAGE_KEY) {
                console.log('Storage changed in another tab, synchronizing...');
                this.handleStorageChange(event);
            }
        };

        window.addEventListener('storage', this.storageEventListener);
    }

    /**
     * Handle storage changes from other tabs
     * @param {StorageEvent} event - Storage event object
     */
    handleStorageChange(event) {
        try {
            if (event.newValue === null) {
                // Storage was cleared
                this.documents = [];
                this.notifyStorageChange('cleared');
            } else {
                // Storage was updated
                const newDocuments = JSON.parse(event.newValue);
                if (Array.isArray(newDocuments)) {
                    this.documents = newDocuments.map(data => CachedDocument.fromJSON(data));
                    this.notifyStorageChange('updated');
                }
            }
        } catch (error) {
            console.error('Failed to handle storage change:', error);
        }
    }

    /**
     * Notify about storage changes (can be extended for UI updates)
     * @param {string} changeType - Type of change ('updated', 'cleared')
     */
    notifyStorageChange(changeType) {
        // Dispatch custom event for UI components to listen to
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('documentCacheChanged', {
                detail: { changeType, documentCount: this.documents.length }
            });
            window.dispatchEvent(event);
        }
    }

    /**
     * Start monitoring storage quota and usage
     */
    startQuotaMonitoring() {
        if (this.inMemoryMode) {
            return;
        }

        // Monitor every 30 seconds
        this.quotaMonitorInterval = setInterval(() => {
            this.checkStorageQuota();
        }, 30000);
    }

    /**
     * Check storage quota and perform cleanup if needed
     */
    checkStorageQuota() {
        const usage = this.getStorageUsage();

        // If usage exceeds 90%, trigger cleanup
        if (usage.usagePercentage > 90) {
            console.warn(`Storage usage high: ${usage.usagePercentage.toFixed(1)}%`);
            this.performAutomaticCleanup();
        }

        // If document count exceeds limit, cleanup
        if (usage.documentCount >= StorageManager.MAX_DOCUMENTS) {
            console.warn(`Document count limit reached: ${usage.documentCount}`);
            this.performAutomaticCleanup();
        }
    }

    /**
     * Perform automatic cleanup with enhanced strategy
     */
    performAutomaticCleanup() {
        const initialCount = this.documents.length;

        // Enhanced cleanup strategy
        this.cleanupOldDocuments();

        const cleanedCount = initialCount - this.documents.length;
        if (cleanedCount > 0) {
            console.log(`Automatic cleanup removed ${cleanedCount} documents`);
            this.notifyStorageChange('cleanup');
        }
    }

    /**
     * Cleanup method for graceful shutdown
     */
    destroy() {
        // Remove event listeners
        if (this.storageEventListener && typeof window !== 'undefined') {
            window.removeEventListener('storage', this.storageEventListener);
        }

        // Clear monitoring interval
        if (this.quotaMonitorInterval) {
            clearInterval(this.quotaMonitorInterval);
        }
    }

    /**
     * Save current documents to localStorage with enhanced error handling
     * @returns {boolean} - Success status
     */
    saveToStorage() {
        if (this.inMemoryMode) {
            // In memory mode, always return true but don't persist
            return true;
        }

        const serializedDocuments = this.documents.map(doc => doc.toJSON());
        const success = StorageManager.save(serializedDocuments);

        if (!success) {
            // If save failed, try cleanup and retry once
            console.warn('Save failed, attempting cleanup and retry...');
            this.performAutomaticCleanup();
            return StorageManager.save(this.documents.map(doc => doc.toJSON()));
        }

        return success;
    }

    /**
     * Generate and validate document ID
     * @param {File} file - File object
     * @returns {string} - Valid unique document ID
     */
    generateDocumentId(file) {
        if (!file || !file.name) {
            throw new Error('Invalid file object for ID generation');
        }

        const tempDoc = new CachedDocument(file, []);
        let id = tempDoc.id;
        let counter = 1;

        // Ensure ID uniqueness
        while (this.documents.some(doc => doc.id === id)) {
            id = `${tempDoc.id}_${counter}`;
            counter++;
        }

        return id;
    }

    /**
     * Validate document ID format and uniqueness
     * @param {string} documentId - Document ID to validate
     * @returns {boolean} - Validation result
     */
    validateDocumentId(documentId) {
        if (!documentId || typeof documentId !== 'string') {
            return false;
        }

        // Check format (alphanumeric with underscores)
        const idPattern = /^[a-z0-9_]+$/i;
        if (!idPattern.test(documentId)) {
            return false;
        }

        return true;
    }

    /**
     * Save document to cache
     * @param {File} file - Original file object
     * @param {Array} questions - Parsed questions array
     * @returns {string|null} - Document ID on success, null on failure
     */
    saveDocument(file, questions) {
        try {
            if (!file || !Array.isArray(questions)) {
                throw new Error('Invalid file or questions data');
            }

            // Check if document already exists (same filename and size)
            const existingIndex = this.documents.findIndex(doc =>
                doc.filename === file.name && doc.fileSize === file.size
            );

            let cachedDoc;

            if (existingIndex !== -1) {
                // Update existing document
                cachedDoc = new CachedDocument(file, questions);
                cachedDoc.id = this.documents[existingIndex].id; // Keep existing ID
                this.documents[existingIndex] = cachedDoc;
            } else {
                // Create new document
                cachedDoc = new CachedDocument(file, questions);

                // Check storage limits before adding
                if (this.documents.length >= StorageManager.MAX_DOCUMENTS) {
                    this.cleanupOldDocuments();
                }

                this.documents.push(cachedDoc);
            }

            // Attempt to save to storage
            const saveSuccess = this.saveToStorage();

            if (!saveSuccess) {
                // If save failed due to quota, try cleanup and retry
                this.cleanupOldDocuments();
                this.saveToStorage();
            }

            return cachedDoc.id;
        } catch (error) {
            console.error('Failed to save document to cache:', error);
            return null;
        }
    }

    /**
     * Get document by ID
     * @param {string} documentId - Document ID
     * @returns {CachedDocument|null} - Document or null if not found
     */
    getDocument(documentId) {
        if (!this.validateDocumentId(documentId)) {
            return null;
        }

        const document = this.documents.find(doc => doc.id === documentId);

        if (document) {
            document.updateLastAccessed();
            this.saveToStorage(); // Update last accessed time in storage
        }

        return document || null;
    }

    /**
     * Get all cached documents sorted by upload date (newest first)
     * @returns {Array} - Array of cached documents
     */
    getAllDocuments() {
        return [...this.documents].sort((a, b) =>
            new Date(b.uploadDate) - new Date(a.uploadDate)
        );
    }

    /**
     * Remove document from cache
     * @param {string} documentId - Document ID to remove
     * @returns {boolean} - Success status
     */
    removeDocument(documentId) {
        if (!this.validateDocumentId(documentId)) {
            return false;
        }

        const initialLength = this.documents.length;
        this.documents = this.documents.filter(doc => doc.id !== documentId);

        const removed = this.documents.length < initialLength;

        if (removed) {
            this.saveToStorage();
        }

        return removed;
    }

    /**
     * Enhanced cleanup strategy for old documents
     */
    cleanupOldDocuments() {
        if (this.documents.length === 0) {
            return;
        }

        // Sort by last accessed date (oldest first)
        this.documents.sort((a, b) =>
            new Date(a.lastAccessed) - new Date(b.lastAccessed)
        );

        // Calculate target count based on current usage
        const usage = this.getStorageUsage();
        let targetCount;

        if (usage.usagePercentage > 90) {
            // Aggressive cleanup if storage is nearly full
            targetCount = Math.floor(StorageManager.MAX_DOCUMENTS * 0.6);
        } else if (usage.documentCount >= StorageManager.MAX_DOCUMENTS) {
            // Standard cleanup if document limit reached
            targetCount = Math.floor(StorageManager.MAX_DOCUMENTS * 0.8);
        } else {
            // Minimal cleanup
            targetCount = StorageManager.MAX_DOCUMENTS - 5;
        }

        const initialCount = this.documents.length;

        // Remove oldest documents until we reach target
        while (this.documents.length > targetCount && this.documents.length > 0) {
            const removed = this.documents.shift();
            console.log(`Cleaned up old document: ${removed.filename} (last accessed: ${removed.lastAccessed})`);
        }

        // Save after cleanup
        if (this.documents.length < initialCount) {
            this.saveToStorage();
        }
    }

    /**
     * Get comprehensive storage usage statistics
     * @returns {Object} - Storage usage information
     */
    getStorageUsage() {
        const usage = StorageManager.getUsage();

        return {
            ...usage,
            inMemoryMode: this.inMemoryMode,
            documentsInCache: this.documents.length,
            oldestDocument: this.documents.length > 0 ?
                this.documents.reduce((oldest, doc) =>
                    new Date(doc.lastAccessed) < new Date(oldest.lastAccessed) ? doc : oldest
                ) : null,
            newestDocument: this.documents.length > 0 ?
                this.documents.reduce((newest, doc) =>
                    new Date(doc.uploadDate) > new Date(newest.uploadDate) ? doc : newest
                ) : null
        };
    }

    /**
     * Get storage quota information (async)
     * @returns {Promise<Object>} - Storage quota details
     */
    async getStorageQuota() {
        return await StorageManager.getStorageQuota();
    }

    /**
     * Force a storage synchronization check
     */
    forceSyncCheck() {
        if (this.inMemoryMode) {
            console.log('In memory mode, no sync needed');
            return;
        }

        try {
            const storedDocuments = StorageManager.load();
            const currentIds = new Set(this.documents.map(doc => doc.id));
            const storedIds = new Set(storedDocuments.map(doc => doc.id));

            // Check if there are differences
            const hasChanges = currentIds.size !== storedIds.size ||
                [...currentIds].some(id => !storedIds.has(id));

            if (hasChanges) {
                console.log('Storage out of sync, reloading...');
                this.documents = storedDocuments.map(data => CachedDocument.fromJSON(data));
                this.notifyStorageChange('synced');
            }
        } catch (error) {
            console.error('Failed to sync storage:', error);
        }
    }

    /**
     * Get cache health status
     * @returns {Object} - Health status information
     */
    getCacheHealth() {
        const usage = this.getStorageUsage();

        return {
            healthy: !usage.needsCleanup && !this.inMemoryMode,
            inMemoryMode: this.inMemoryMode,
            needsCleanup: usage.needsCleanup,
            nearLimit: usage.isNearLimit,
            documentCount: usage.documentsInCache,
            storageUsage: usage.usagePercentage,
            recommendations: this.getHealthRecommendations(usage)
        };
    }

    /**
     * Get health recommendations based on current state
     * @param {Object} usage - Current usage statistics
     * @returns {Array} - Array of recommendation strings
     */
    getHealthRecommendations(usage) {
        const recommendations = [];

        if (this.inMemoryMode) {
            recommendations.push('Enable localStorage for persistent document history');
        }

        if (usage.needsCleanup) {
            recommendations.push('Consider removing old documents to free up space');
        }

        if (usage.isNearLimit) {
            recommendations.push('Storage is nearly full, automatic cleanup may occur');
        }

        if (usage.documentsInCache === 0) {
            recommendations.push('No documents cached yet');
        }

        return recommendations;
    }

    /**
     * Clear all cached documents
     */
    clearAll() {
        this.documents = [];
        StorageManager.clear();
    }
}

export { DocumentCache, StorageManager, CachedDocument };
