"""
Configuration settings for the backend system.
Uses Pydantic Settings for environment variable management.
"""
import os
import logging
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "StackBrowserAgent Backend"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    
    # API
    api_prefix: str = "/api"
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=8000, env="API_PORT")
    
    # Database
    database_url: str = Field(
        default="sqlite+aiosqlite:///./stackbrowseragent.db",
        env="DATABASE_URL"
    )
    
    # Authentication (supports both SECRET_KEY and JWT_SECRET_KEY)
    _secret_key_cache: Optional[str] = None
    
    @property
    def secret_key(self) -> str:
        """Get secret key from JWT_SECRET_KEY or SECRET_KEY environment variable."""
        if self._secret_key_cache is not None:
            return self._secret_key_cache
            
        key = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
        if not key:
            # Allow default in development, but warn in production
            if os.getenv("ENVIRONMENT", "development").lower() == "production":
                logger.critical("⚠️  SECURITY WARNING: Using default JWT secret key in production! Set JWT_SECRET_KEY environment variable.")
            key = "change-me-in-production"
        
        # Cache the result
        object.__setattr__(self, '_secret_key_cache', key)
        return key
    
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # LLM Providers
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, env="GEMINI_API_KEY")
    
    # Agent Configuration
    max_concurrent_agents: int = 20
    agent_timeout_seconds: int = 300
    task_retry_limit: int = 3
    task_retry_delay_seconds: int = 5
    
    # Vector Database
    chroma_persist_directory: str = "./chroma_db"
    embedding_model: str = "text-embedding-ada-002"
    
    # Pinecone (optional)
    pinecone_api_key: Optional[str] = Field(default=None, env="PINECONE_API_KEY")
    pinecone_environment: str = Field(default="us-west1-gcp", env="PINECONE_ENVIRONMENT")
    pinecone_index_name: str = Field(default="stackbrowseragent", env="PINECONE_INDEX_NAME")
    
    # Monitoring
    enable_metrics: bool = True
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "chrome-extension://*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
