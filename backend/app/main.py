"""Main FastAPI application entrypoint."""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import api_router
from app.config import get_settings
from app.services.media_service import MediaProcessingError, get_media_service
from app.services.transcription_service import TranscriptionError

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("meeting_intelligence")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan events."""
    settings = get_settings()
    logger.info("Starting %s v%s", settings.PROJECT_NAME, settings.VERSION)
    logger.info(
        "Whisper Configuration: model='%s', device='%s', compute_type='%s'",
        settings.WHISPER_MODEL,
        settings.WHISPER_DEVICE,
        settings.WHISPER_COMPUTE_TYPE,
    )
    
    # Check FFmpeg availability at startup
    media_service = get_media_service()
    if media_service.is_ffmpeg_available():
        logger.info("FFmpeg detected at: %s", media_service.ffmpeg_path)
    else:
        logger.warning(
            "FFmpeg executable NOT detected in PATH. "
            "Video conversions and non-WAV audio processing will require FFmpeg to be installed."
        )

    yield

    logger.info("Shutting down %s", settings.PROJECT_NAME)


def create_application() -> FastAPI:
    """Factory function to build and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description=(
            "Phase 1 Meeting Intelligence Platform API: "
            "High-performance local speech-to-text pipeline powered by Faster-Whisper and FFmpeg."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS Middleware Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(MediaProcessingError)
    async def media_processing_exception_handler(
        request: Request, exc: MediaProcessingError
    ):
        logger.error("Media processing exception on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": str(exc), "error_code": "MEDIA_PROCESSING_ERROR"},
        )

    @app.exception_handler(TranscriptionError)
    async def transcription_exception_handler(
        request: Request, exc: TranscriptionError
    ):
        logger.error("Transcription exception on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc), "error_code": "TRANSCRIPTION_ERROR"},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        logger.warning("Validation error on %s: %s", request.url.path, exc)
        errors = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": f"Invalid request parameters: {'; '.join(errors)}",
                "error_code": "VALIDATION_ERROR",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled server error on %s: %s", request.url.path, exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "An internal server error occurred while processing your request.",
                "error_code": "INTERNAL_SERVER_ERROR",
            },
        )

    # Include API Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": "/docs",
            "health": f"{settings.API_V1_STR}/health",
            "phase": "Phase 1 - Audio/Video Speech-to-Text",
        }

    return app


app = create_application()
