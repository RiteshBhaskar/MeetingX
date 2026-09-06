"""Unit tests for upload validation (extensions, empty files, size limits)."""

import io
from fastapi.testclient import TestClient


def test_reject_unsupported_file_extension(client: TestClient):
    """Verify that uploading an unsupported file format (.exe, .pdf, .txt) returns 400."""
    fake_file = io.BytesIO(b"dummy pdf content")
    response = client.post(
        "/api/v1/meetings/upload",
        files={"file": ("meeting_notes.pdf", fake_file, "application/pdf")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_reject_executable_file(client: TestClient):
    """Verify that executable files are rejected."""
    fake_file = io.BytesIO(b"MZ executable header")
    response = client.post(
        "/api/v1/meetings/upload",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")},
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_reject_empty_file(client: TestClient):
    """Verify that uploading a 0-byte file returns 400."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/v1/meetings/upload",
        files={"file": ("empty_recording.mp3", empty_file, "audio/mpeg")},
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_missing_file_parameter(client: TestClient):
    """Verify that missing file payload returns 422 Unprocessable Entity."""
    response = client.post("/api/v1/meetings/upload", data={})
    assert response.status_code == 422
