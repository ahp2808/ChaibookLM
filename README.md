# ☕ ChaibookLM

> **An intelligent, local-first research assistant and AI notebook inspired by Google NotebookLM.**  
> Ground generative AI answers strictly in your own notes, research papers, YouTube videos, websites, and transcripts — complete with interactive passage citations and source inspection.

---

## 🌟 Overview & Key Features

ChaibookLM is a modern React web application that lets you curate multi-source research notebooks and query them using Retrieval-Augmented Generation (RAG).

### 🔍 Grounded AI Answers with Verified Citations
- **Zero Hallucination Guardrails**: Prompts are constrained to answer strictly from your indexed sources.
- **Interactive Citations**: Clickable badges (`[1]`, `[2]`) in AI responses open the source inspector drawer, scrolling and highlighting the exact excerpt, page, or timestamp.
- **Text-to-Speech (TTS)**: Built-in voice synthesis to listen to answers.

### 📚 Versatile Multi-Source Ingestion Pipeline
- **📄 PDF Documents**: Page-by-page extraction using client-side `pdf.js` with page-aware chunking.
- **🌐 Web Articles & URLs**: Ingests website text with boilerplate removal and CORS proxy fallback.
- **🎥 YouTube Videos**: Extracts timed caption transcripts directly from YouTube URLs.
- **📝 Text & Markdown**: Paste notes, articles, research summaries, or raw text.
- **⏱️ Subtitles & Transcripts**: Supports `.vtt` and `.srt` subtitle files with precise time-offset chunking.

### 🧠 Semantic Vector Search (RAG)
- Generates vector embeddings using Google Generative AI (`gemini-embedding-001`) via LangChain.
- Performs cosine similarity ranking in the browser to retrieve the most relevant source passages.
- Queries Gemini (`gemini-3.5-flash-lite`) via the OpenAI-compatible REST API.

### 💾 Local-First Notebook Management
- Create, rename, delete, and switch between separate research notebooks.
- Automatic local persistence (`localStorage` / storage API) for notebooks, indexed chunks, and conversation histories.

---

## 🚀 Getting Started (Run Locally)

Follow these steps to set up and run ChaibookLM locally on your machine.

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (comes with Node.js) or **pnpm** / **yarn**
- **Gemini API Key**: Get a free API key from [Google AI Studio](https://aistudio.google.com/).

### 2. Clone the Repository
```bash
git clone https://github.com/ahp2808/ChaibookLM.git
cd ChaibookLM
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the project root by copying `.env_example`:

```bash
# On Linux/macOS
cp .env_example .env

# On Windows (PowerShell)
Copy-Item .env_example .env
```

Open `.env` and add your Gemini API Key:
```env
VITE_API_KEY=your_gemini_api_key_here
```

### 5. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

### 6. Additional Scripts
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Lint code**: `npm run lint`
- **Lint & auto-fix**: `npm run lint:fix`

---

## 🗂️ Project Structure & File Roles

Below is a breakdown of the codebase architecture and the function of each file:

```
ChaibookLM/
├── public/
│   ├── icon1.svg                     # Application logo/branding icon
│   └── assets/                       # Static public assets
│
├── src/
│   ├── main.jsx                      # React application entrypoint
│   ├── App.jsx                       # Main application state container & coordinator
│   ├── App.css                       # Global styles, custom utilities, scrollbars & theme variables
│   ├── index.css                     # Tailwind CSS v4 entrypoint
│   │
│   ├── api/
│   │   └── openai.js                 # API wrapper placeholder / client setup
│   │
│   ├── components/                   # UI Components
│   │   ├── NotebookRail.jsx          # Left sidebar: Create, rename, delete, switch notebooks
│   │   ├── SourcesPanel.jsx          # Middle sidebar: Source list, filter search, add CTA
│   │   ├── SourceRow.jsx             # Individual source item with status pill, inspect, & delete actions
│   │   ├── AddSourceModal.jsx        # Multi-tab modal to upload PDFs, URLs, YouTube, Text, & VTT
│   │   ├── ChatPanel.jsx             # Central chat interface, starter prompt chips, TTS & copy actions
│   │   ├── Citation.jsx              # Parser rendering inline clickable citation badges ([1], [2])
│   │   ├── SourceViewerDrawer.jsx    # Slide-over drawer inspecting raw text, PDF canvas, or video cues
│   │   ├── FullTextHighlight.jsx     # Component highlighting matched chunk excerpts within full source text
│   │   ├── StatusBadge.jsx           # Processing status indicators (reading, chunking, embedding, ready, error)
│   │   ├── Toast.jsx                 # Toast notification provider and animated banner alerts
│   │   └── IconButton.jsx            # Reusable accessible icon button primitive
│   │
│   ├── services/                     # Business Logic, RAG Pipeline & Storage
│   │   ├── injest.js                 # Ingestion orchestrator (extract -> chunk -> embed -> ready)
│   │   ├── chunking.js               # Text chunking strategies (plain text overlap, page-wise, cue-wise)
│   │   ├── embeddings.js             # Vector embeddings (LangChain Google/OpenAI) and cosine similarity
│   │   ├── storage.js                # Local storage persistence for notebooks, sources, and chat messages
│   │   └── parsers/                  # Format-specific data extractors
│   │       ├── html.js               # Web scraper & DOM parser with CORS proxy fallback
│   │       ├── youtube.js            # YouTube video ID parser & caption transcript fetcher
│   │       └── vtt.js                # WebVTT / SRT subtitle file parser converting to timed cues
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── usePdfJs.js               # Asynchronous dynamic CDN loader for pdf.js and its web worker
│   │   └── useFonts.js               # Custom font loader hook
│   │
│   ├── constants/
│   │   └── sourceTypes.js            # Source type configuration (labels, icons, status definitions)
│   │
│   └── utils/
│       ├── format.js                 # Timestamp formatting helper (seconds -> mm:ss or hh:mm:ss)
│       └── ids.js                    # Unique ID generator for notebooks, sources, chunks, and messages
│
├── .env_example                      # Example environment variables template
├── package.json                      # Project dependencies, scripts, and metadata
├── vite.config.js                    # Vite configuration with React and Tailwind plugins
└── eslint.config.js                  # ESLint configuration
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS variables |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Embeddings & LLM** | [@langchain/google-genai](https://js.langchain.com/), Google Gemini API (`gemini-3.5-flash-lite`, `gemini-embedding-001`) |
| **PDF Processing** | [PDF.js](https://mozilla.github.io/pdf.js/) |
| **Transcript & Video** | `youtube-transcript`, WebVTT parsing |
| **Persistence** | LocalStorage / Browser Storage API |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
