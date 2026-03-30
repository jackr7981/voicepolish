# VoicePolish

A Progressive Web App that captures voice dictation using the Web Speech API and polishes raw text using Claude AI via OpenRouter.

Works on desktop (Chrome) and mobile (Safari PWA). Install it on your iPhone home screen for a native-like experience.

## Features

- **Voice-to-text** — Tap the mic or press Space to dictate
- **AI polishing** — Raw speech is cleaned up by Claude Haiku in real-time (streaming)
- **Prompt profiles** — Switch between General, Coding, Maritime, Email, Casual modes
- **Custom dictionary** — Add terms the AI should always spell correctly
- **Edit & copy** — Edit polished text inline, one-tap copy
- **History** — Browse and copy from recent dictations
- **PWA** — Installable on mobile, works offline (cached UI)

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19 + Vite + TypeScript      |
| Styling  | Tailwind CSS                      |
| Voice    | Web Speech API                    |
| Backend  | FastAPI (Python)                  |
| Database | SQLite (aiosqlite)                |
| LLM      | Claude Haiku via OpenRouter       |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OpenRouter API key
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite dev proxy forwards `/api` to the backend.

## Deployment

- **Frontend** → Vercel (set `VITE_API_URL` env var to your backend URL)
- **Backend** → Render / Railway (set `OPENROUTER_API_KEY` and `ALLOWED_ORIGINS` env vars)

## Environment Variables

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `MODEL_NAME` | No | LLM model (default: `anthropic/claude-3.5-haiku`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: localhost) |
| `PORT` | No | Server port (default: 8000) |

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Backend API URL (e.g. `https://your-api.onrender.com`) |
