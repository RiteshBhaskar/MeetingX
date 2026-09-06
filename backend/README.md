# Meeting Intelligence Platform - Backend (Phase 1)

FastAPI-powered backend service for the Meeting Intelligence Platform, featuring FFmpeg media extraction and local Faster-Whisper automatic speech recognition.

---

## Architecture Overview

```
backend/
├── app/
│   ├── main.py                     # FastAPI application setup, CORS, lifespan, global exception handlers
│   ├── config.py                   # Pydantic Settings (env vars: model, device, max file size, data paths)
│   ├── api/
│   │   └── routes/
│   │       ├── health.py           # GET /api/v1/health
│   │       └── meeting.py          # POST /api/v1/meetings/upload
│   ├── services/
│   │   ├── media_service.py        # Safe FFmpeg audio extraction & validation
│   │   └── transcription_service.py # Faster-Whisper singleton model transcription
│   ├── schemas/
│   │   └── meeting.py              # Pydantic data models for transcripts & segments
│   └── utils/
│       └── file_utils.py           # Filename sanitization, timestamps, and file cleanup
├── tests/                          # Unit and integration test suite
├── requirements.txt
├── .env.example
└── README.md
```

---

## Prerequisites

1. **Python 3.11+**
2. **FFmpeg** (required for extracting audio from video and processing non-WAV media)

---

## Setup & Installation

### 1. Create and Activate Virtual Environment

```bash
cd backend
python3 -m venv .venv

# On macOS/Linux:
source .venv/bin/activate

# On Windows (cmd):
.venv\Scripts\activate.bat

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` to configure your Whisper model, device, and upload limits:

```ini
WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_COMPUTE_TYPE=int8
MAX_UPLOAD_SIZE_MB=500
```

---

## Running the Server

Start the development server with live reload:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## API Endpoints

### 1. Health Check
`GET /api/v1/health`

**Response (200 OK):**
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

### 2. Upload and Transcribe Meeting
`POST /api/v1/meetings/upload`

**Form-data Payload:**
- `file`: Audio or video file (`.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.mp4`, `.mkv`, `.mov`, `.webm`)

**Response (200 OK):**
```json
{
  "meeting_id": "8fa5383f-4e0e-4fa2-bf41-39659b854e4c",
  "filename": "team_meeting.mp4",
  "media_type": "video",
  "language": "en",
  "language_probability": 0.9842,
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

## Running Tests

Run the test suite with pytest (mocks the Whisper model for rapid offline execution):

```bash
pytest -v
```
