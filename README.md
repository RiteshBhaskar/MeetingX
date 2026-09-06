# Meeting Intelligence Platform — Phase 1

A production-quality, modular, free and open-source **Meeting Intelligence Platform**.

**Phase 1 Focus**: End-to-end Audio/Video Speech-to-Text pipeline with timestamped structured transcript generation.
*No paid APIs, no OpenAI/Gemini/Claude keys required. Runs completely locally on CPU/GPU or deployed on Render cloud.*

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             USER INTERFACE                                  │
│                 React (Vite) + Tailwind CSS + Lucide Icons                  │
│   • Drag & Drop Audio/Video Uploader                                        │
│   • Live Ingestion & Inference Progress Indicator                           │
│   • Interactive Transcript Viewer (Search, Copy, Export TXT/JSON/SRT/CSV)   │
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

## 📁 Directory Structure

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
│   ├── tests/                          # Automated Pytest suite
│   │   ├── conftest.py
│   │   ├── test_health.py
│   │   ├── test_upload_validation.py
│   │   ├── test_transcription.py
│   │   └── test_file_utils.py
│   ├── Dockerfile                      # Production Docker container with FFmpeg & Python 3.11
│   ├── .dockerignore
│   ├── runtime.txt                     # Python 3.11 version specifier
│   ├── requirements.txt                # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header & live backend status indicator
│   │   │   ├── FileUpload.jsx          # Drag-and-drop uploader with validation
│   │   │   ├── UploadProgress.jsx      # Upload % & stage transition indicators
│   │   │   └── TranscriptViewer.jsx    # Formatted transcript with search & exports
│   │   ├── services/
│   │   │   └── api.js                  # Axios HTTP client with dynamic VITE_API_URL
│   │   ├── App.jsx                     # Application layout & state coordination
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind styles & theme customizations
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── .env.example                        # Root environment reference
├── .gitignore
├── Makefile                            # One-command runners (make dev, make test)
├── render.yaml                         # Render 1-click Blueprint configuration
├── run_backend.sh                      # Backend start script
├── run_frontend.sh                     # Frontend start script
├── run_tests.sh                        # Pytest runner script
├── start.sh                            # Unified concurrent startup script
└── README.md
```

---

## 💻 Local Development Setup

### Prerequisites
1. **Python 3.11+**
2. **Node.js 18+** & **npm**
3. **FFmpeg** installed on your system PATH

#### Installing FFmpeg Locally
- **macOS (Homebrew):** `brew install ffmpeg`
- **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install -y ffmpeg`
- **Windows (winget):** `winget install Gyan.FFmpeg`

---

### Option A: One-Command Startup (Recommended)

From the project root directory:

```bash
# Make scripts executable
chmod +x start.sh run_backend.sh run_frontend.sh run_tests.sh

# Run both Backend & Frontend concurrently
./start.sh
# or: make dev
```

- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

### Option B: Run in Separate Terminals

#### Terminal 1 — Backend (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Run FastAPI with live reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Terminal 2 — Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Testing

Run the automated backend test suite:

```bash
cd backend
source .venv/bin/activate
pytest -v
```

---

## 🐙 Git & GitHub Workflow

To commit and push all changes to your GitHub repository:

```bash
cd /Users/riteshbhaskar/Downloads/project/major_project

# 1. Stage all deployment files
git add .

# 2. Commit
git commit -m "feat: complete Phase 1 deployment configuration for Render and GitHub"

# 3. Ensure branch is main
git branch -M main

# 4. Set remote repository
git remote set-url origin https://github.com/RiteshBhaskar/MeetingX.git 2>/dev/null || git remote add origin https://github.com/RiteshBhaskar/MeetingX.git

# 5. Push to GitHub
git push -u origin main
```

---

## 🚀 Deployment to Render.com

This project is configured for cloud deployment on **Render**:

- **Backend**: Containerized **Docker Web Service** ensuring FFmpeg and Python 3.11 Faster-Whisper are pre-installed.
- **Frontend**: **Static Site** built with Vite.

---

### Method 1: Automated Blueprint Deployment (1-Click)

1. Log into your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** → **Blueprint**.
3. Select your repository: **`RiteshBhaskar/MeetingX`**.
4. Render will automatically parse [`render.yaml`](file:///Users/riteshbhaskar/Downloads/project/major_project/render.yaml) and create both services.
5. Click **Apply**.

---

### Method 2: Manual Web Service & Static Site Setup

#### Step 1: Deploy Backend Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository: `RiteshBhaskar/MeetingX`.
3. Configure the settings:
   - **Name**: `meetingx-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: `backend`
   - **Instance Type**: `Free` or `Starter`
   - **Health Check Path**: `/api/v1/health`
4. Add Environment Variables:
   - `WHISPER_MODEL`: `base` (or `tiny` for faster startup)
   - `WHISPER_DEVICE`: `cpu`
   - `WHISPER_COMPUTE_TYPE`: `int8`
   - `MAX_UPLOAD_SIZE_MB`: `500`
   - `HOST`: `0.0.0.0`
5. Click **Create Web Service**.
6. Copy your deployed Backend URL (e.g. `https://meetingx-backend.onrender.com`).

#### Step 2: Deploy Frontend Static Site
1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect your GitHub repository: `RiteshBhaskar/MeetingX`.
3. Configure the settings:
   - **Name**: `meetingx-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://meetingx-backend.onrender.com` (your backend URL from Step 1)
5. Click **Create Static Site**.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env` / Render Web Service)

| Variable | Default (Local) | Render Production Example | Description |
| :--- | :--- | :--- | :--- |
| `HOST` | `0.0.0.0` | `0.0.0.0` | Host address binding |
| `PORT` | `8000` | Injected dynamically by Render | Web server listening port |
| `WHISPER_MODEL` | `base` | `base` (or `tiny`) | Model size (`tiny`, `base`, `small`, `medium`, `large-v3`) |
| `WHISPER_DEVICE` | `cpu` | `cpu` | Compute device (`cpu` or `cuda`) |
| `WHISPER_COMPUTE_TYPE` | `int8` | `int8` | Model precision quantization |
| `MAX_UPLOAD_SIZE_MB` | `500` | `500` | Maximum file upload limit in MB |
| `FRONTEND_URL` | *(none)* | `https://meetingx-frontend.onrender.com` | Production frontend domain for strict CORS |
| `CORS_ORIGINS` | `http://localhost:5173,...` | `http://localhost:5173,...` | Comma-separated allowed dev origins |
| `DATA_DIR` | `data` | `data` | Ephemeral scratch directory for audio extraction |

### Frontend (`frontend/.env` / Render Static Site)

| Variable | Default (Local) | Render Production Example | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | *(empty — uses Vite proxy)* | `https://meetingx-backend.onrender.com` | Full URL of the FastAPI backend service |

---

## ⚠️ Cloud & Storage Notes

- **Ephemeral Storage**: In Render Free and Starter web services, the local filesystem is ephemeral. Temporary files created during audio extraction are automatically deleted in the `finally` block after each meeting transcript is produced.
- **Spin-down Behavior**: On Render's Free tier, the backend web service spins down after 15 minutes of inactivity. When a new request arrives, Render automatically wakes up the container (~30-50 seconds). The live status indicator in the frontend top navbar will reflect the backend's availability.

---

## 🗺️ Project Roadmap

- **Phase 1 (Current)**: Local/Cloud Speech-to-Text with Faster-Whisper, FFmpeg, and structured timestamped transcript viewer.
- **Phase 2**: Local Speaker Diarization (Speaker identification & turn-taking alignment).
- **Phase 3**: NLP Intelligence (Executive summaries, action items, key decisions, risks).
- **Phase 4**: Hybrid RAG (Vector storage, semantic chunking, and meeting query chatbot).
- **Phase 5**: Advanced Intelligence (Knowledge graphs, cross-meeting memory, hybrid search).
- **Phase 6**: Evidence Verification (Source attribution and confidence grounding).
- **Phase 7**: Production Scale (Auth, RBAC, background task queues, PostgreSQL).
