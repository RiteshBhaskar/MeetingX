"""File and string manipulation helper utilities."""

import logging
import os
import re
from pathlib import Path
from typing import Set, Union

logger = logging.getLogger(__name__)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize an uploaded filename to prevent directory traversal and illegal characters.
    
    Preserves alphanumeric characters, underscores, hyphens, and dots.
    Replaces spaces with underscores and strips path separators.
    """
    if not filename or not isinstance(filename, str) or not filename.strip():
        return "unnamed_media_file"

    # Extract the base name to eliminate any path traversal sequences like ../
    clean_name = os.path.basename(filename).strip()

    # Split name and extension
    name_part, ext_part = os.path.splitext(clean_name)

    # Replace whitespace and problematic characters with underscore
    name_part = re.sub(r"[^\w\-.]", "_", name_part)
    # Deduplicate consecutive underscores
    name_part = re.sub(r"_+", "_", name_part).strip("._")

    # Clean extension part
    ext_part = re.sub(r"[^\w.]", "", ext_part).lower()

    if not name_part:
        name_part = "unnamed_media_file"

    return f"{name_part}{ext_part}"


def get_file_extension(filename: str) -> str:
    """Return lowercase file extension including leading dot (e.g. '.mp4')."""
    return os.path.splitext(filename)[1].lower()


def is_allowed_extension(filename: str, allowed_extensions: Set[str]) -> bool:
    """Check if the filename has an allowed extension."""
    ext = get_file_extension(filename)
    return ext in allowed_extensions


def is_video_file(filename: str, video_extensions: Set[str]) -> bool:
    """Check if the filename is a video format based on its extension."""
    ext = get_file_extension(filename)
    return ext in video_extensions


def format_seconds_to_hhmmss(seconds: float, include_ms: bool = False) -> str:
    """
    Format a floating-point seconds value into a standard timestamp string.
    
    Examples:
        75.25 -> "00:01:15" or "00:01:15.250"
        3665.0 -> "01:01:05"
    """
    if seconds is None or seconds < 0:
        seconds = 0.0

    total_seconds = int(seconds)
    ms = int(round((seconds - total_seconds) * 1000))

    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if include_ms:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}.{ms:03d}"
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def format_duration_display(seconds: float) -> str:
    """
    Format duration for display (e.g., '20:50' or '01:20:50').
    """
    if seconds is None or seconds < 0:
        return "00:00"

    total_seconds = int(round(seconds))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def safe_remove_file(file_path: Union[str, Path, None]) -> bool:
    """
    Safely delete a file without raising exceptions if it doesn't exist or is locked.
    
    Returns:
        True if the file was deleted, False otherwise.
    """
    if not file_path:
        return False

    path = Path(file_path)
    try:
        if path.exists() and path.is_file():
            path.unlink()
            logger.debug("Successfully deleted temporary file: %s", path)
            return True
    except OSError as exc:
        logger.warning("Could not delete file %s: %s", path, exc)
    return False
