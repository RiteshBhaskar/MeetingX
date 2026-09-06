"""Pydantic models for meeting audio/video transcription and system status."""

from typing import List, Optional
from pydantic import BaseModel, Field


class TranscriptSegment(BaseModel):
    """Represents a discrete timestamped speech segment from Whisper."""

    id: int = Field(..., description="Sequential segment index")
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    start_formatted: str = Field(
        ..., description="Human-readable start timestamp in HH:MM:SS format"
    )
    end_formatted: str = Field(
        ..., description="Human-readable end timestamp in HH:MM:SS format"
    )
    text: str = Field(..., description="Transcribed text for this segment")
    confidence: Optional[float] = Field(
        default=None,
        description="Confidence score (0.0 to 1.0) derived from segment probabilities",
    )
    avg_logprob: Optional[float] = Field(
        default=None, description="Average log probability from the acoustic model"
    )
    no_speech_prob: Optional[float] = Field(
        default=None, description="Probability that the segment contains no speech"
    )


class MeetingTranscriptResponse(BaseModel):
    """Structured response returned after transcribing an uploaded meeting."""

    meeting_id: str = Field(..., description="Unique meeting identifier (UUID)")
    filename: str = Field(..., description="Original name of the uploaded meeting file")
    media_type: str = Field(
        ..., description="Detected media type ('audio' or 'video')"
    )
    language: str = Field(..., description="Detected language code (e.g., 'en', 'es', 'fr')")
    language_probability: Optional[float] = Field(
        default=None, description="Confidence in detected language"
    )
    duration: float = Field(..., description="Total audio duration in seconds")
    duration_formatted: str = Field(
        ..., description="Human-readable duration in HH:MM:SS or MM:SS format"
    )
    segment_count: int = Field(..., description="Total number of segments generated")
    segments: List[TranscriptSegment] = Field(
        default_factory=list, description="Ordered list of timestamped segments"
    )
    full_text: str = Field(..., description="Full concatenated transcript text")


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(default="ok", description="Overall service status")
    whisper_model: str = Field(..., description="Configured Whisper model size")
    whisper_device: str = Field(..., description="Execution device ('cpu' or 'cuda')")
    whisper_compute_type: str = Field(..., description="Compute precision type")
    ffmpeg_available: bool = Field(
        ..., description="Whether FFmpeg binary is detected and accessible"
    )
    max_upload_size_mb: int = Field(..., description="Maximum allowed file size in MB")


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    detail: str = Field(..., description="User-friendly error explanation")
    error_code: Optional[str] = Field(
        default=None, description="Machine-readable error identifier"
    )
