"""Transcription service integrating Faster-Whisper for high-efficiency local speech-to-text."""

import logging
import math
from pathlib import Path
from typing import List, Optional, Tuple
from faster_whisper import WhisperModel

from app.config import Settings, get_settings
from app.schemas.meeting import TranscriptSegment
from app.utils.file_utils import format_duration_display, format_seconds_to_hhmmss

logger = logging.getLogger(__name__)


class TranscriptionError(Exception):
    """Exception raised when speech-to-text transcription fails."""
    pass


class TranscriptionService:
    """
    Faster-Whisper Transcription Service.
    
    Loads the pre-trained Whisper model once into memory and reuses it for all requests.
    Supports both CPU (default) and NVIDIA GPU (CUDA) execution.
    
    GPU Configuration Note:
    To switch to GPU execution on CUDA-supported machines:
    1. Set environment variable WHISPER_DEVICE=cuda
    2. Set environment variable WHISPER_COMPUTE_TYPE=float16 (or int8_float16)
    3. Ensure NVIDIA CUDA Toolkit and cuDNN libraries (ctranslate2 compatible) are installed.
    """

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self._model: Optional[WhisperModel] = None

    def get_model(self) -> WhisperModel:
        """
        Lazily load and return the Faster-Whisper model singleton.
        Downloads the model files to cache on first use, then loads from cache.
        """
        if self._model is None:
            logger.info(
                "Loading Faster-Whisper model: model=%s, device=%s, compute_type=%s",
                self.settings.WHISPER_MODEL,
                self.settings.WHISPER_DEVICE,
                self.settings.WHISPER_COMPUTE_TYPE,
            )
            try:
                self._model = WhisperModel(
                    model_size_or_path=self.settings.WHISPER_MODEL,
                    device=self.settings.WHISPER_DEVICE,
                    compute_type=self.settings.WHISPER_COMPUTE_TYPE,
                    download_root=str(self.settings.data_path / "models"),
                )
                logger.info("Faster-Whisper model loaded successfully.")
            except Exception as exc:
                logger.exception("Failed to initialize Faster-Whisper model: %s", exc)
                raise TranscriptionError(
                    f"Failed to load Whisper model '{self.settings.WHISPER_MODEL}': {str(exc)}"
                ) from exc
        return self._model

    def transcribe_file(
        self, audio_path: Path
    ) -> Tuple[List[TranscriptSegment], str, Optional[float], float, str]:
        """
        Transcribe the given audio file using Faster-Whisper.
        
        Returns:
            Tuple containing:
            - segments: List of structured TranscriptSegment items
            - detected_language: 2-letter language code
            - language_probability: Confidence score for detected language
            - total_duration: Total duration in seconds
            - full_text: Combined transcript text
        """
        if not audio_path.exists():
            raise TranscriptionError(f"Audio file does not exist: {audio_path}")

        logger.info("Starting transcription for file: %s", audio_path.name)
        model = self.get_model()

        try:
            # Transcribe with Faster-Whisper
            # vad_filter=True helps filter out non-speech/silence sections
            segments_generator, info = model.transcribe(
                str(audio_path),
                beam_size=5,
                word_timestamps=False,
                vad_filter=True,
            )

            detected_language = info.language
            language_probability = round(info.language_probability, 4) if info.language_probability else None
            total_duration = info.duration or 0.0

            structured_segments: List[TranscriptSegment] = []
            full_text_parts: List[str] = []

            segment_idx = 0
            max_end_time = 0.0

            for segment in segments_generator:
                text = segment.text.strip()
                if not text:
                    continue

                start_sec = round(segment.start, 2)
                end_sec = round(segment.end, 2)
                if end_sec > max_end_time:
                    max_end_time = end_sec

                # Calculate confidence score if avg_logprob is available
                # avg_logprob ranges from ~ -inf to 0 (where 0 is 100% confident)
                confidence = None
                if segment.avg_logprob is not None:
                    # Map logprob to probability estimate: exp(avg_logprob)
                    try:
                        confidence = round(min(1.0, max(0.0, math.exp(segment.avg_logprob))), 4)
                    except (OverflowError, ValueError):
                        confidence = None

                avg_logprob = round(segment.avg_logprob, 4) if segment.avg_logprob is not None else None
                no_speech_prob = round(segment.no_speech_prob, 4) if segment.no_speech_prob is not None else None

                segment_item = TranscriptSegment(
                    id=segment_idx,
                    start=start_sec,
                    end=end_sec,
                    start_formatted=format_seconds_to_hhmmss(start_sec),
                    end_formatted=format_seconds_to_hhmmss(end_sec),
                    text=text,
                    confidence=confidence,
                    avg_logprob=avg_logprob,
                    no_speech_prob=no_speech_prob,
                )

                structured_segments.append(segment_item)
                full_text_parts.append(text)
                segment_idx += 1

            if not total_duration or total_duration == 0.0:
                total_duration = max_end_time

            full_text = " ".join(full_text_parts)

            logger.info(
                "Transcription completed: %d segments, detected_language=%s, duration=%.2fs",
                len(structured_segments),
                detected_language,
                total_duration,
            )

            return (
                structured_segments,
                detected_language,
                language_probability,
                total_duration,
                full_text,
            )

        except Exception as exc:
            if isinstance(exc, TranscriptionError):
                raise
            logger.exception("Error during Whisper transcription: %s", exc)
            raise TranscriptionError(f"Transcription failed: {str(exc)}") from exc


# Global service instance
_transcription_service_instance: Optional[TranscriptionService] = None


def get_transcription_service() -> TranscriptionService:
    """Return singleton instance of TranscriptionService."""
    global _transcription_service_instance
    if _transcription_service_instance is None:
        _transcription_service_instance = TranscriptionService()
    return _transcription_service_instance
