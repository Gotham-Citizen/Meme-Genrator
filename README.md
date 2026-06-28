# Meme Generator

A React-based meme generator that lets you create custom memes by adding top and bottom text to random meme templates fetched from the Imgflip API. Reposition text by dragging it anywhere on the image.

## Features

- Fetch random meme templates from the Imgflip API
- Customize top and bottom text in real time
- **Drag and drop** text anywhere on the meme canvas
- Cycle through random meme images with a single click (text and positions preserved)
- Loading and error states for API calls
- Responsive design with custom CSS styling
- Classic Impact font with text stroke for authentic meme look

## Tech Stack

- **React 19** — UI library
- **Vite 8** — Build tool and dev server with HMR
- **Imgflip API** — Meme template source
- **ESLint** — Linting with React hooks and refresh plugins
- **Google Fonts** — Karla typeface

## Getting Started

### Installation

```bash
git clone <repo-url>
cd meme-generator
npm install
```

### Development

Start the dev server with hot module replacement:

```bash
npm run dev
```

### Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
meme-generator/
├── components/
│   ├── Header.jsx       # App header with troll face logo
│   └── Main.jsx         # Meme form, text inputs, drag-and-drop, and image display
├── images/
│   └── troll-face.png   # Header logo
├── src/
│   ├── App.jsx          # Root component
│   └── index.jsx        # React entry point
├── styles/
│   └── index.css        # Global styles
├── index.html           # HTML entry point
├── vite.config.js       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

## How It Works

1. On load, the app fetches popular meme templates from the Imgflip API.
2. A random template is displayed with default text.
3. Edit the top and bottom text fields to customize your meme.
4. **Drag the text** to reposition it anywhere on the meme image.
5. Click **"Get a new meme image"** to load a different random template while preserving your text and positions.