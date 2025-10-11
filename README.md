# Quizzer App

A modern quiz application with document management, search functionality, and dark/light mode support.

## Features

- 📁 **Document Management**: Upload and manage JSON quiz files
- 🔍 **Smart Search**: Real-time search with multiple sorting options
- 🌙 **Dark/Light Mode**: Toggle between themes
- 📱 **Responsive Design**: Works on all devices
- ⚡ **Fast Performance**: Vanilla JavaScript, no frameworks
- 💾 **Local Storage**: Automatic document caching

## Getting Started

### Local Development

1. Clone the repository
2. Open `index.html` in your browser, or
3. Run a local server:
   ```bash
   python -m http.server 8000
   # or
   npm run dev
   ```

### Deployment

This is a static site that can be deployed to any static hosting service:

- **Vercel**: Configured with `vercel.json`
- **Netlify**: Drag and drop the project folder
- **GitHub Pages**: Push to a repository and enable Pages
- **Any static host**: Upload all files to the web root

## Project Structure

```
quizzer/
├── index.html          # Main HTML file
├── src/
│   ├── components/     # UI components
│   ├── services/       # Business logic
│   ├── styles/         # CSS styles
│   └── utils/          # Utility functions
├── package.json        # Project metadata
└── vercel.json        # Vercel deployment config
```

## Usage

1. **Upload Quiz**: Click "Upload JSON File" or drag & drop
2. **Search Documents**: Use the search bar to find specific files
3. **Sort Options**: Sort by name, date, size, or question count
4. **Take Quiz**: Select a document and choose Take or Review mode
5. **Dark Mode**: Toggle with the moon/sun button

## JSON Format

Quiz files should be JSON arrays with this structure:

```json
[
  {
    "question": "What is the capital of France?",
    "type": "mcq",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "answer": "Paris"
  },
  {
    "question": "Explain the concept of recursion.",
    "type": "written",
    "answer": "Sample answer for reference"
  }
]
```

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers

## License

MIT License - feel free to use and modify!