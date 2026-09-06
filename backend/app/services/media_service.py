"""Media processing service using safe FFmpeg subprocess calls."""

import logging
import os
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class MediaProcessingError(Exception):
    """Exception raised when media processing (e.g. FFmpeg conversion) fails."""

    def __init__(self, message: str, original_error: Optional[str] = None):
        super().__init__(message)
        self.original_error = original_error


class FFmpegNotFoundError(MediaProcessingError):
    """Exception raised when FFmpeg executable cannot be found on system PATH."""

    def __init__(self):
        msg = (
            "FFmpeg executable was not found on your system PATH. "
            "Please install FFmpeg: macOS (`brew install ffmpeg`), "
            "Ubuntu/Debian (`sudo apt install ffmpeg`), or Windows (`winget install Gyan.FFmpeg`)."
        )
        super().__init__(msg)


class MediaService:
    """Service handling media validation, format conversions, and audio extraction."""

    def __init__(self, ffmpeg_path: Optional[str] = None):
        self.ffmpeg_path = ffmpeg_path or shutil.which("ffmpeg")

    def is_ffmpeg_available(self) -> bool:
        """Check if FFmpeg binary is installed and executable."""
        if not self.ffmpeg_path:
            self.ffmpeg_path = shutil.which("ffmpeg")
        return self.ffmpeg_path is not None

    def extract_audio_to_wav(
        self, input_media_path: Path, output_wav_path: Path
    ) -> Path:
        """
        Extract or convert any audio/video input file into a 16kHz mono WAV audio file
        optimized for Faster-Whisper transcription.
        
        Uses secure argument list execution (no shell=True) to prevent command injection.
        """
        if not self.is_ffmpeg_available():
            logger.error("FFmpeg not found when trying to process media: %s", input_media_path)
            raise FFmpegNotFoundError()

        if not input_media_path.exists():
            raise MediaProcessingError(f"Input media file does not exist: {input_media_path}")

        # Ensure destination directory exists
        output_wav_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info(
            "Starting FFmpeg audio extraction: %s -> %s",
            input_media_path.name,
            output_wav_path.name,
        )

        # Build FFmpeg command arguments
        # -y: overwrite output
        # -i: input file
        # -vn: disable video recording (extract audio only)
        # -acodec: pcm_s16le (standard 16-bit uncompressed PCM)
        # -ar: 16000 (16 kHz sample rate, optimal for Whisper)
        # -ac: 1 (mono channel)
        cmd = [
            self.ffmpeg_path,
            "-y",
            "-i",
            str(input_media_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(output_wav_path),
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False,
                timeout=300,  # 5 minutes timeout for large files
            )

            if result.returncode != 0:
                stderr_output = result.stderr.strip()
                logger.error(
                    "FFmpeg conversion failed (exit code %d): %s",
                    result.returncode,
                    stderr_output,
                )
                raise MediaProcessingError(
                    f"FFmpeg failed to process the media file. The file may be corrupted or in an unsupported codec.",
                    original_error=stderr_output,
                )

            if not output_wav_path.exists() or output_wav_path.stat().st_size == 0:
                raise MediaProcessingError(
                    "Audio extraction completed but generated an empty or non-existent audio file."
                )

            logger.info(
                "FFmpeg audio extraction completed successfully: %s (size: %d bytes)",
                output_wav_path.name,
                output_wav_path.stat().st_size,
            )
            return output_wav_path

        except subprocess.TimeoutExpired as exc:
            logger.error("FFmpeg processing timed out for file %s", input_media_path)
            raise MediaProcessingError(
                "Media conversion timed out while processing with FFmpeg."
            ) from exc
        except FileNotFoundError as exc:
            logger.error("FFmpeg executable not found at runtime: %s", self.ffmpeg_path)
            raise FFmpegNotFoundError() from exc
        except Exception as exc:
            if isinstance(exc, MediaProcessingError):
                raise
            logger.exception("Unexpected error during FFmpeg execution: %s", exc)
            raise MediaProcessingError(
                f"An unexpected error occurred while converting media: {str(exc)}"
            ) from exc


# Global service instance
_media_service_instance: Optional[MediaService] = None


def get_media_service() -> MediaService:
    """Return singleton instance of MediaService."""
    global _media_service_instance
    if _media_service_instance is None:
        _media_service_instance = MediaService()
    return _media_service_instance
