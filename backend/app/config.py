"""Application configuration module using Pydantic Settings."""

import os
from functools import lru_cache
from pathlib import Path
from typing import List, Set, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables and .env file."""

    # Project metadata
    PROJECT_NAME: str = "Meeting Intelligence Platform"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Faster-Whisper Model Settings
    # Options for model: tiny, tiny.en, base, base.en, small, small.en, medium, medium.en, large-v1, large-v2, large-v3
    WHISPER_MODEL: str = "base"
    # Options for device: cpu, cuda
    WHISPER_DEVICE: str = "cpu"
    # Options for compute_type: int8, float32 (CPU) | float16, int8_float16, int8 (CUDA GPU)
    WHISPER_COMPUTE_TYPE: str = "int8"

    # Upload and media constraints
    MAX_UPLOAD_SIZE_MB: int = 500

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Optional Deployed Frontend URL (e.g., https://meetingx-frontend.onrender.com)
    FRONTEND_URL: Optional[str] = None

    # CORS settings (Default local dev origins)
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Storage paths
    DATA_DIR: str = "data"

    # Supported file extensions
    AUDIO_EXTENSIONS: Set[str] = {".mp3", ".wav", ".m4a", ".flac", ".ogg"}
    VIDEO_EXTENSIONS: Set[str] = {".mp4", ".mkv", ".mov", ".webm"}

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated string to list if necessary."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def all_cors_origins(self) -> List[str]:
        """Combine default CORS origins with FRONTEND_URL if provided."""
        origins = list(self.CORS_ORIGINS) if isinstance(self.CORS_ORIGINS, list) else [self.CORS_ORIGINS]
        if self.FRONTEND_URL:
            for url in self.FRONTEND_URL.split(","):
                clean_url = url.strip().rstrip("/")
                if clean_url and clean_url not in origins:
                    origins.append(clean_url)
        return origins

    @property
    def allowed_extensions(self) -> Set[str]:
        """Return combined set of allowed audio and video extensions."""
        return self.AUDIO_EXTENSIONS | self.VIDEO_EXTENSIONS

    @property
    def max_upload_size_bytes(self) -> int:
        """Return maximum upload size in bytes."""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def data_path(self) -> Path:
        """Return resolved Path to the data directory."""
        base_dir = Path(__file__).resolve().parent.parent
        path = base_dir / self.DATA_DIR
        return path

    @property
    def uploads_path(self) -> Path:
        """Return resolved Path to the uploads directory."""
        path = self.data_path / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def extracted_path(self) -> Path:
        """Return resolved Path to the extracted audio directory."""
        path = self.data_path / "extracted"
        path.mkdir(parents=True, exist_ok=True)
        return path

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    settings = Settings()
    # Ensure directories exist
    settings.uploads_path.mkdir(parents=True, exist_ok=True)
    settings.extracted_path.mkdir(parents=True, exist_ok=True)
    return settings
