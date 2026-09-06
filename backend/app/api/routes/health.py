"""Health check endpoint."""

from fastapi import APIRouter, Depends
from app.config import Settings, get_settings
from app.schemas.meeting import HealthResponse
from app.services.media_service import MediaService, get_media_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, summary="System Health & Configuration Check")
async def health_check(
    settings: Settings = Depends(get_settings),
    media_service: MediaService = Depends(get_media_service),
) -> HealthResponse:
    """
    Check the health of the Meeting Intelligence backend service,
    model configuration, and FFmpeg installation status.
    """
    return HealthResponse(
        status="ok",
        whisper_model=settings.WHISPER_MODEL,
        whisper_device=settings.WHISPER_DEVICE,
        whisper_compute_type=settings.WHISPER_COMPUTE_TYPE,
        ffmpeg_available=media_service.is_ffmpeg_available(),
        max_upload_size_mb=settings.MAX_UPLOAD_SIZE_MB,
    )
