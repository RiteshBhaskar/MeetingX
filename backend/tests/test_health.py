"""Unit tests for the health check endpoint."""

from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Verify GET /api/v1/health returns status 200 and expected schema keys."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "whisper_model" in data
    assert "whisper_device" in data
    assert "whisper_compute_type" in data
    assert "ffmpeg_available" in data
    assert "max_upload_size_mb" in data


def test_root_endpoint(client: TestClient):
    """Verify root GET / returns metadata and documentation link."""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["phase"] == "Phase 1 - Audio/Video Speech-to-Text"
