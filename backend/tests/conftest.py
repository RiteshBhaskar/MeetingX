"""Pytest test configuration and fixtures."""

import os
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app
from app.schemas.meeting import TranscriptSegment
from app.services.media_service import MediaService, get_media_service
from app.services.transcription_service import (
    TranscriptionService,
    get_transcription_service,
)


@pytest.fixture
def mock_settings() -> Settings:
    """Return test settings with temporary storage directory."""
    return Settings(
        WHISPER_MODEL="base",
        WHISPER_DEVICE="cpu",
        WHISPER_COMPUTE_TYPE="int8",
        MAX_UPLOAD_SIZE_MB=10,  # 10 MB for testing
        DATA_DIR="test_data",
    )


@pytest.fixture
def mock_transcription_service() -> MagicMock:
    """Return a mocked TranscriptionService instance."""
    mock_service = MagicMock(spec=TranscriptionService)

    sample_segments = [
        TranscriptSegment(
            id=0,
            start=0.0,
            end=4.5,
            start_formatted="00:00:00",
            end_formatted="00:00:04",
            text="Today we need to discuss the backend.",
            confidence=0.96,
            avg_logprob=-0.04,
            no_speech_prob=0.01,
        ),
        TranscriptSegment(
            id=1,
            start=4.5,
            end=9.2,
            start_formatted="00:00:04",
            end_formatted="00:00:09",
            text="Rahul will handle the API integration.",
            confidence=0.94,
            avg_logprob=-0.06,
            no_speech_prob=0.02,
        ),
    ]

    mock_service.transcribe_file.return_value = (
        sample_segments,
        "en",
        0.98,
        9.2,
        "Today we need to discuss the backend. Rahul will handle the API integration.",
    )
    return mock_service


@pytest.fixture
def mock_media_service() -> MagicMock:
    """Return a mocked MediaService instance."""
    mock_service = MagicMock(spec=MediaService)
    mock_service.is_ffmpeg_available.return_value = True
    mock_service.extract_audio_to_wav.side_effect = (
        lambda input_media_path=None, output_wav_path=None, *args, **kwargs: (
            output_wav_path or Path("/tmp/mock_audio.wav")
        )
    )
    return mock_service


@pytest.fixture
def client(mock_transcription_service, mock_media_service, mock_settings) -> TestClient:
    """Return FastAPI TestClient with mocked dependencies."""
    app.dependency_overrides[get_transcription_service] = lambda: mock_transcription_service
    app.dependency_overrides[get_media_service] = lambda: mock_media_service
    app.dependency_overrides[get_settings] = lambda: mock_settings

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
