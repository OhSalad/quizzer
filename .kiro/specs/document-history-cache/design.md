# Design Document

## Overview

The document history caching system will extend the existing Quizzer application to store and manage previously uploaded JSON quiz documents. The system will use browser localStorage for persistence and provide a seamless user experience for accessing historical documents directly from the home page.

## Architecture

### Storage Layer
- **LocalStorage Manager**: Handles all localStorage operations with error handling and quota management
- **Document Cache**: Stores document metadata and content with automatic cleanup policies
- **Storage Schema**: Structured data format for cached documents with versioning support

### UI Components
- **History List Component**: Displays cached documents on the home page
- **Document Card Component**: Individual document representation with metadata and actions
- **Empty State Component**: Handles display when no documents are cached

### Integration Points
- **File Upload Handler**: Extended to automatically cache uploaded documents
- **Navigation System**: Modified to support direct navigation to cached documents
- **Mode Selection**: Enhanced to work with cached document data

## Components and Interfaces

### DocumentCache Class
```javascript
class DocumentCache {
  // Core operations
  saveDocument(file, questions)
  getDocument(documentId)
  getAllDocuments()
  removeDocument(documentId)
  
  // Utility methods
  generateDocumentId(file)
  cleanupOldDocuments()
  getStorageUsage()
}
```

### Document Storage Schema
```javascript
{
  id: string,           // Unique identifier (hash of filename + size + timestamp)
  filename: string,     // Original filename
  uploadDate: Date,     // When document was cached
  fileSize: number,     // File size in bytes
  questionCount: number, // Number of questions in document
  mcqCount: number,     // Number of MCQ questions
  writtenCount: number, // Number of written questions
  questions: Array,     // Full question data
  lastAccessed: Date    // For cleanup policies
}
```

### UI Components

#### HistorySection Component
- Renders on home page below upload button
- Shows up to 10 most recent documents
- Handles empty state display
- Provides document selection and deletion

#### DocumentCard Component
- Displays document metadata (name, date, question counts)
- Provides hover actions (delete button)
- Handles click navigation to mode selection

## Data Models

### CachedDocument Model
```javascript
class CachedDocument {
  constructor(file, questions) {
    this.id = this.generateId(file);
    this.filename = file.name;
    this.uploadDate = new Date();
    this.fileSize = file.size;
    this.questions = questions;
    this.questionCount = questions.length;
    this.mcqCount = questions.filter(q => q.type === 'mcq').length;
    this.writtenCount = questions.filter(q => q.type === 'written').length;
    this.lastAccessed = new Date();
  }
}
```

### StorageManager Model
```javascript
class StorageManager {
  static STORAGE_KEY = 'quizzer_document_cache';
  static MAX_DOCUMENTS = 50;
  static MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  
  // Storage operations with error handling
  save(documents)
  load()
  clear()
  getUsage()
}
```

## Error Handling

### Storage Errors
- **Quota Exceeded**: Implement automatic cleanup of oldest documents
- **Storage Unavailable**: Graceful degradation with in-memory cache
- **Corrupted Data**: Clear cache and start fresh with user notification

### Document Errors
- **Missing Document**: Remove from cache and show user-friendly message
- **Invalid Format**: Skip corrupted entries during cache loading
- **Access Errors**: Fallback to re-upload workflow

### User Experience Errors
- **Network Issues**: All operations are local, minimal impact
- **Browser Compatibility**: Feature detection for localStorage support
- **Performance Issues**: Lazy loading and pagination for large document lists

## Testing Strategy

### Unit Tests
- DocumentCache class methods
- StorageManager operations
- Document model validation
- Error handling scenarios

### Integration Tests
- File upload to cache workflow
- Cache to mode selection navigation
- Document deletion and cleanup
- Storage quota management

### User Experience Tests
- Home page history display
- Document selection flow
- Empty state handling
- Performance with large document sets

## Implementation Considerations

### Performance Optimizations
- **Lazy Loading**: Load document content only when needed
- **Metadata Caching**: Store lightweight metadata separately for list display
- **Debounced Operations**: Prevent excessive localStorage writes
- **Memory Management**: Clear unused document data from memory

### Browser Compatibility
- **LocalStorage Detection**: Feature detection with fallback
- **Storage Events**: Handle storage changes from other tabs
- **JSON Serialization**: Robust parsing with error recovery
- **Date Handling**: Consistent date serialization across browsers

### Security Considerations
- **Data Sanitization**: Validate cached document structure
- **Storage Isolation**: Use application-specific storage keys
- **Content Validation**: Verify document integrity on load
- **Privacy**: No external data transmission, local-only storage

### Scalability
- **Storage Limits**: Implement automatic cleanup policies
- **Document Limits**: Cap maximum cached documents
- **Performance Monitoring**: Track cache hit rates and performance
- **Upgrade Path**: Version storage schema for future enhancements