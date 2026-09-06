# Meeting Intelligence Platform - Frontend (Phase 1)

Modern React + Vite + Tailwind CSS dashboard for the Meeting Intelligence Platform.

---

## Features

- **Drag-and-Drop Uploader**: Fast client-side validation for video/audio formats and upload size limits.
- **Real-Time Progress Tracking**: Upload percentage bar combined with multi-stage inference indicators.
- **Timestamped Transcript Viewer**:
  - Highlights keyword matches with instant search.
  - Formatted timestamps `[HH:MM:SS]` with segment confidence metrics.
  - One-click copy for individual segments or entire transcript.
  - Multi-format exports: Plain text (`.txt`), JSON (`.json`), SubRip Subtitles (`.srt`).
- **System Health Monitor**: Live connection status with the backend Whisper server.

---

## Setup & Running

### 1. Install Node Dependencies

```bash
cd frontend
npm install
```

### 2. Start Vite Dev Server

```bash
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173). Requests to `/api/*` are automatically proxied to the backend at `http://127.0.0.1:8000`.

### 3. Production Build

To build the static production bundle:

```bash
npm run build
```
