"""Unit tests for file utilities and helpers."""

from app.utils.file_utils import (
    format_duration_display,
    format_seconds_to_hhmmss,
    get_file_extension,
    is_allowed_extension,
    is_video_file,
    sanitize_filename,
)


def test_sanitize_filename():
    """Verify filename sanitization with paths, spaces, and special characters."""
    assert sanitize_filename("../../../etc/passwd.mp3") == "passwd.mp3"
    assert sanitize_filename("my meeting 2026! @#$.wav") == "my_meeting_2026.wav"
    assert sanitize_filename("..//some_dir//audio.m4a") == "audio.m4a"
    assert sanitize_filename("") == "unnamed_media_file"
    assert sanitize_filename("   ") == "unnamed_media_file"


def test_file_extension_helpers():
    """Verify extension extraction and validation."""
    allowed = {".mp3", ".wav", ".mp4"}
    videos = {".mp4", ".mkv"}

    assert get_file_extension("audio.MP3") == ".mp3"
    assert get_file_extension("file.tar.gz") == ".gz"
    assert is_allowed_extension("test.wav", allowed) is True
    assert is_allowed_extension("test.exe", allowed) is False
    assert is_video_file("video.mp4", videos) is True
    assert is_video_file("recording.mp3", videos) is False


def test_format_seconds_to_hhmmss():
    """Verify timestamp formatting."""
    assert format_seconds_to_hhmmss(0.0) == "00:00:00"
    assert format_seconds_to_hhmmss(75.5) == "00:01:15"
    assert format_seconds_to_hhmmss(75.5, include_ms=True) == "00:01:15.500"
    assert format_seconds_to_hhmmss(3665.0) == "01:01:05"


def test_format_duration_display():
    """Verify duration display formatting."""
    assert format_duration_display(0) == "00:00"
    assert format_duration_display(45) == "00:45"
    assert format_duration_display(1250) == "20:50"
    assert format_duration_display(3720) == "01:02:00"
