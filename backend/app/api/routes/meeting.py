"""Meeting audio and video upload and transcription endpoints."""

import logging
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import Settings, get_settings
from app.schemas.meeting import MeetingTranscriptResponse
from app.services.media_service import (
    FFmpegNotFoundError,
    MediaProcessingError,
    MediaService,
    get_media_service,
)
from app.services.transcription_service import (
    TranscriptionError,
    TranscriptionService,
    get_transcription_service,
)
from app.utils.file_utils import (
    format_duration_display,
    get_file_extension,
    is_allowed_extension,
    is_video_file,
    safe_remove_file,
    sanitize_filename,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/upload",
    response_model=MeetingTranscriptResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload and Transcribe Audio or Video Meeting",
)
async def upload_meeting(
    file: UploadFile = File(..., description="Audio or video meeting file"),
    settings: Settings = Depends(get_settings),
    media_service: MediaService = Depends(get_media_service),
    transcription_service: TranscriptionService = Depends(get_transcription_service),
) -> MeetingTranscriptResponse:
    """
    Process an uploaded meeting audio or video file:
    
    1. Validate file extension against supported formats.
    2. Stream and write the file securely with maximum upload size enforcement.
    3. Detect media type (audio vs. video).
    4. Extract audio using FFmpeg if the file is a video or compressed format.
    5. Transcribe speech using Faster-Whisper.
    6. Clean up temporary intermediate processing files.
    7. Return timestamped structured segments and metadata.
    """
    raw_filename = file.filename or "meeting_file"
    extension = get_file_extension(raw_filename)

    logger.info("Received meeting upload request: filename='%s', content_type='%s'", raw_filename, file.content_type)

    # 1. Validate file extension
    if not is_allowed_extension(raw_filename, settings.allowed_extensions):
        supported_formats = ", ".join(sorted(settings.allowed_extensions))
        logger.warning("Rejected file '%s' with unsupported extension '%s'", raw_filename, extension)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file format '{extension}'. "
                f"Allowed formats are: {supported_formats}"
            ),
        )

    meeting_id = str(uuid.uuid4())
    safe_name = sanitize_filename(raw_filename)
    saved_file_path = settings.uploads_path / f"{meeting_id}_{safe_name}"
    extracted_audio_path = settings.extracted_path / f"{meeting_id}_audio.wav"

    # Track files for cleanup
    temp_files_to_cleanup = []

    try:
        # 2. Stream uploaded file to disk while validating size
        total_bytes = 0
        chunk_size = 1024 * 1024  # 1 MB chunks

        with open(saved_file_path, "wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > settings.max_upload_size_bytes:
                    # Exceeded maximum size
                    logger.warning(
                        "Upload '%s' exceeded max size limit of %d MB (uploaded > %d bytes)",
                        raw_filename,
                        settings.MAX_UPLOAD_SIZE_MB,
                        total_bytes,
                    )
                    safe_remove_file(saved_file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
                    )
                buffer.write(chunk)

        if total_bytes == 0:
            safe_remove_file(saved_file_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty (0 bytes). Please upload a valid media file.",
            )

        logger.info("Saved upload '%s' as '%s' (%d bytes)", raw_filename, saved_file_path.name, total_bytes)
        temp_files_to_cleanup.append(saved_file_path)

        # 3. Determine media type and prepare audio for Whisper
        is_video = is_video_file(raw_filename, settings.VIDEO_EXTENSIONS)
        media_type = "video" if is_video else "audio"

        audio_for_transcription: Path

        # For video or non-wav compressed audio, extract/convert via FFmpeg
        if is_video or extension != ".wav":
            if not media_service.is_ffmpeg_available():
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        "FFmpeg is not installed on the server. "
                        "FFmpeg is required to process video files and compressed audio formats. "
                        "Please install FFmpeg on your system to enable media transcription."
                    ),
                )
            try:
                audio_for_transcription = media_service.extract_audio_to_wav(
                    input_media_path=saved_file_path,
                    output_wav_path=extracted_audio_path,
                )
                temp_files_to_cleanup.append(extracted_audio_path)
            except MediaProcessingError as exc:
                logger.error("Media processing failed for %s: %s", raw_filename, exc)
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Failed to process media file: {str(exc)}",
                )
        else:
            # File is already a WAV audio file
            audio_for_transcription = saved_file_path

        # 4. Transcribe audio with Faster-Whisper
        try:
            (
                segments,
                detected_language,
                language_prob,
                duration,
                full_text,
            ) = transcription_service.transcribe_file(audio_for_transcription)
        except TranscriptionError as exc:
            logger.error("Transcription failed for %s: %s", raw_filename, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Speech transcription failed: {str(exc)}",
            )

        formatted_duration = format_duration_display(duration)

        logger.info(
            "Successfully processed meeting %s: duration=%s, segments=%d",
            meeting_id,
            formatted_duration,
            len(segments),
        )

        return MeetingTranscriptResponse(
            meeting_id=meeting_id,
            filename=raw_filename,
            media_type=media_type,
            language=detected_language,
            language_probability=language_prob,
            duration=round(duration, 2),
            duration_formatted=formatted_duration,
            segment_count=len(segments),
            segments=segments,
            full_text=full_text,
        )

    finally:
        # 5. Clean up temporary files to conserve disk space
        for temp_file in temp_files_to_cleanup:
            safe_remove_file(temp_file)
        await file.close()
