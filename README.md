# Meeting Intelligence Platform — Phase 1

A production-quality, modular, free and open-source **Meeting Intelligence Platform**.

**Phase 1 Focus**: End-to-end local Audio/Video Speech-to-Text pipeline with timestamped structured transcript generation.
*No paid APIs, no OpenAI/Gemini/Claude keys required. Runs completely locally on CPU or NVIDIA GPU.*

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE                                  │
│                 React (Vite) + Tailwind CSS + Lucide Icons                  │
│   • Drag & Drop Audio/Video Uploader                                        │
│   • Live Upload & Inference Progress Indicator                              │
│   • Interactive Transcript Viewer (Search, Copy, Export TXT / JSON / SRT)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ POST /api/v1/meetings/upload
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FASTAPI BACKEND SERVER                             │
│                                                                             │
│  1. Request Validation (File extensions, size limits, streaming write)      │
│  2. File Utilities (Safe filename sanitization, traversal protection)       │
│  3. Media Service (FFmpeg audio extraction to 16kHz mono PCM WAV)           │
│  4. Faster-Whisper Service (Cached singleton WhisperModel inference)       │
│  5. Structured Response Generation (Timestamps, language, confidence)       │
│  6. Cleanup (Automatic removal of intermediate processing files)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Supported Media Formats

| Type | Supported File Extensions |
| :--- | :--- |
| **Audio** | `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg` |
| **Video** | `.mp4`, `.mkv`, `.mov`, `.webm` |

*Configurable maximum file size (default: 500 MB).*

---

## Directory Structure

```
major_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI app, CORS, lifespan, global error handlers
│   │   ├── config.py                   # Pydantic Settings & environment variables
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── health.py           # GET /api/v1/health
│   │   │       └── meeting.py          # POST /api/v1/meetings/upload
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── media_service.py        # Safe subprocess FFmpeg audio extraction
│   │   │   └── transcription_service.py # Faster-Whisper model loading & speech-to-text
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── meeting.py              # Pydantic schemas (TranscriptSegment, Response)
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── file_utils.py           # Sanitization, time formatters, safe file removal
│   ├── tests/                          # Automated Pytest suite (Whisper mocked)
│   │   ├── conftest.py
│   │   ├── test_health.py
│   │   ├── test_upload_validation.py
│   │   ├── test_transcription.py
│   │   └── test_file_utils.py
│   ├── data/                           # Local storage for uploads/extracted media (.gitignored)
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header & live backend status indicator
│   │   │   ├── FileUpload.jsx          # Drag-and-drop uploader with validation
│   │   │   ├── UploadProgress.jsx      # Upload % & stage transition indicators
│   │   │   └── TranscriptViewer.jsx    # Formatted transcript with search & exports
│   │   ├── services/
│   │   │   └── api.js                  # Axios HTTP client with progress tracking
│   │   ├── App.jsx                     # Application layout & state coordination
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind styles & theme customizations
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

Before starting, ensure you have:
1. **Python 3.11+**
2. **Node.js 18+** & **npm**
3. **FFmpeg** installed and accessible in your system PATH

### Installing FFmpeg

#### macOS (via Homebrew)
```bash
brew install ffmpeg
```

#### Ubuntu / Debian Linux
```bash
sudo apt update
sudo apt install -y ffmpeg
```

#### Windows (via winget or Chocolatey)
```powershell
# Using winget:
winget install Gyan.FFmpeg

# Or using Chocolatey:
choco install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

---

## Quick Start Guide

### Step 1: Set Up Backend

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv

   # macOS / Linux:
   source .venv/bin/activate

   # Windows (Command Prompt):
   .venv\Scripts\activate.bat

   # Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Create configuration file:
   ```bash
   cp .env.example .env
   ```

5. Start the FastAPI backend:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

Backend will be running at:
- **API Base**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

### Step 2: Set Up Frontend

In a separate terminal window:

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   [http://localhost:5173](http://localhost:5173)

---

## Configuration Reference (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `WHISPER_MODEL` | `base` | Model size: `tiny`, `base`, `small`, `medium`, `large-v3` |
| `WHISPER_DEVICE` | `cpu` | Device: `cpu` or `cuda` |
| `WHISPER_COMPUTE_TYPE` | `int8` | Precision: `int8`, `float32` (CPU) or `float16`, `int8_float16` (CUDA) |
| `MAX_UPLOAD_SIZE_MB` | `500` | Maximum allowed file upload size in megabytes |
| `HOST` | `127.0.0.1` | Backend host binding |
| `PORT` | `8000` | Backend port |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed CORS origins for frontend requests |
| `DATA_DIR` | `data` | Local directory for intermediate files and downloaded models |

### Switching to GPU (NVIDIA CUDA)
To enable GPU acceleration on systems with NVIDIA GPUs:
1. In `backend/.env`, set:
   ```ini
   WHISPER_DEVICE=cuda
   WHISPER_COMPUTE_TYPE=float16
   ```
2. Verify NVIDIA drivers and CUDA toolkit are installed.

---

## API Endpoints

### 1. Health Check
`GET /api/v1/health`

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "whisper_model": "base",
  "whisper_device": "cpu",
  "whisper_compute_type": "int8",
  "ffmpeg_available": true,
  "max_upload_size_mb": 500
}
```

---

### 2. Upload and Transcribe Meeting
`POST /api/v1/meetings/upload`

**Request Body (multipart/form-data):**
- `file`: Meeting audio or video recording file.

**Sample Response (`200 OK`):**
```json
{
  "meeting_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "filename": "team_meeting.mp4",
  "media_type": "video",
  "language": "en",
  "language_probability": 0.985,
  "duration": 1250.4,
  "duration_formatted": "20:50",
  "segment_count": 2,
  "segments": [
    {
      "id": 0,
      "start": 0.0,
      "end": 5.2,
      "start_formatted": "00:00:00",
      "end_formatted": "00:00:05",
      "text": "Today we need to discuss the backend architecture.",
      "confidence": 0.952,
      "avg_logprob": -0.048,
      "no_speech_prob": 0.012
    },
    {
      "id": 1,
      "start": 5.2,
      "end": 10.8,
      "start_formatted": "00:00:05",
      "end_formatted": "00:00:10",
      "text": "Rahul will handle the API integration.",
      "confidence": 0.941,
      "avg_logprob": -0.061,
      "no_speech_prob": 0.018
    }
  ],
  "full_text": "Today we need to discuss the backend architecture. Rahul will handle the API integration."
}
```

---

## Automated Backend Testing

Run the automated test suite with `pytest`:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

*Note: The test suite mocks the Whisper model and FFmpeg processing to guarantee instant, reproducible offline execution without downloading models during CI/testing.*

---

## Troubleshooting

### 1. `FFmpeg is not installed on the server`
- **Cause**: The `ffmpeg` binary was not found in your system's PATH.
- **Fix**: Install FFmpeg (e.g. `brew install ffmpeg` on macOS, `sudo apt install ffmpeg` on Linux) and verify with `ffmpeg -version`. Restart the backend server after installation.

### 2. `Unsupported file format`
- **Cause**: The file uploaded does not have an allowed audio/video extension.
- **Fix**: Supported extensions are `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.mp4`, `.mkv`, `.mov`, `.webm`.

### 3. `File size exceeds maximum allowed upload size`
- **Cause**: The uploaded file is larger than `MAX_UPLOAD_SIZE_MB`.
- **Fix**: Adjust `MAX_UPLOAD_SIZE_MB=1000` in `.env` to accommodate larger recordings.

### 4. Slow transcription on CPU
- **Fix**: By default, Faster-Whisper is configured with `WHISPER_MODEL=base` and `WHISPER_COMPUTE_TYPE=int8` which runs quickly on modern CPUs. For even faster transcription, switch to `WHISPER_MODEL=tiny`.

---

## Project Roadmap

```
PHASE 1 (Completed)
 Audio/Video → Speech-to-Text Pipeline (Faster-Whisper + FFmpeg + FastAPI + React)

PHASE 2
 Speaker Diarization (PyAnnote Audio / Local Diarization model, Speaker Identification)

PHASE 3
 NLP Intelligence
 • Executive Summary
 • Topic Modeling & Agenda Tracking
 • Key Decisions
 • Action Items & Owner Assignment
 • Deadlines & Milestones
 • Risk & Blocker Extraction

PHASE 4
 Hybrid RAG
 • Smart Chunking (Speaker & Topic aligned)
 • Local Embeddings
 • Vector Database (Qdrant / ChromaDB)
 • Meeting Interactive Chatbot

PHASE 5
 Advanced Intelligence
 • Knowledge Graph Generation
 • Cross-Meeting Longitudinal Memory
 • Hybrid Search (Dense + Sparse BM25)
 • Reranking

PHASE 6
 Evidence Verification
 • Source Attribution & Timestamp Citations
 • Grounding & Hallucination Detection
 • Evidence Confidence Scoring

PHASE 7
 Production & Scale
 • Authentication & RBAC (Role-Based Access Control)
 • Background Task Workers (Celery / Redis / ARQ)
 • PostgreSQL Database Integration
 • Docker Containerization & Helm Charts
 • Cloud Deployment & Observability (OpenTelemetry / Prometheus)
```
# MEETING-INTELLIGENCE
# MEETING-INTELLIGENCE
