"""Unit tests for the meeting upload and transcription pipeline."""

import io
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.media_service import MediaService, get_media_service


def test_upload_audio_successful(client: TestClient):
    """Test successful upload and transcription of an audio file."""
    fake_audio = io.BytesIO(b"RIFF dummy wav audio data header pcm")
    response = client.post(
        "/api/v1/meetings/upload",
        files={"file": ("team_standup.wav", fake_audio, "audio/wav")},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["filename"] == "team_standup.wav"
    assert data["media_type"] == "audio"
    assert data["language"] == "en"
    assert data["duration"] == 9.2
    assert data["duration_formatted"] == "00:09"
    assert data["segment_count"] == 2
    assert len(data["segments"]) == 2

    first_segment = data["segments"][0]
    assert first_segment["id"] == 0
    assert first_segment["start"] == 0.0
    assert first_segment["end"] == 4.5
    assert first_segment["start_formatted"] == "00:00:00"
    assert first_segment["text"] == "Today we need to discuss the backend."
    assert first_segment["confidence"] == 0.96

    assert "Today we need to discuss the backend." in data["full_text"]


def test_upload_video_successful(client: TestClient):
    """Test successful upload and transcription of a video file triggering FFmpeg."""
    fake_video = io.BytesIO(b"ftypmp42 dummy mp4 video stream")
    response = client.post(
        "/api/v1/meetings/upload",
        files={"file": ("quarterly_review.mp4", fake_video, "video/mp4")},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["filename"] == "quarterly_review.mp4"
    assert data["media_type"] == "video"
    assert data["language"] == "en"
    assert len(data["segments"]) == 2


def test_ffmpeg_missing_error():
    """Test clear error response when FFmpeg is not installed on the system."""
    mock_media = MagicMock(spec=MediaService)
    mock_media.is_ffmpeg_available.return_value = False

    app.dependency_overrides[get_media_service] = lambda: mock_media

    with TestClient(app) as local_client:
        fake_video = io.BytesIO(b"dummy video data")
        response = local_client.post(
            "/api/v1/meetings/upload",
            files={"file": ("all_hands.mp4", fake_video, "video/mp4")},
        )
        assert response.status_code == 500
        assert "FFmpeg is not installed" in response.json()["detail"]

    app.dependency_overrides.clear()
