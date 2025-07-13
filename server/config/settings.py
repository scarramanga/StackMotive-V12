"""
StackMotive Configuration Settings

Production-level configuration management for StackMotive trading platform.
"""
import os
from enum import Enum
from typing import Optional


class StackMotiveMode(str, Enum):
    """StackMotive operational modes"""
    DEVELOPMENT = "dev"
    STAGING = "staging" 
    PRODUCTION = "prod"


class Settings:
    """Global StackMotive settings"""
    
    # Core application mode
    STACKMOTIVE_MODE: StackMotiveMode = StackMotiveMode(
        os.getenv("STACKMOTIVE_MODE", "dev")
    )
    
    # Database configuration - uses canonical dev.db at project root
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
    
    # JWT configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
    
    # Production mode safeguards
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.STACKMOTIVE_MODE == StackMotiveMode.PRODUCTION
    
    @property
    def allow_fallback_data(self) -> bool:
        """Allow fallback/mock data injection"""
        return not self.is_production
    
    @property
    def allow_auto_patching(self) -> bool:
        """Allow automatic backend patching"""
        return not self.is_production
    
    @property
    def enable_detailed_logging(self) -> bool:
        """Enable detailed operation logging"""
        return self.is_production
    
    def log_change(self, operation: str, details: str) -> None:
        """Log changes when in production mode"""
        if self.enable_detailed_logging:
            import logging
            logger = logging.getLogger("stackmotive.changes")
            logger.info(f"CHANGE: {operation} - {details}")
    
    def validate_production_constraints(self) -> None:
        """Validate production environment constraints"""
        if self.is_production:
            # Ensure critical environment variables are set
            if self.JWT_SECRET_KEY == "your-secret-key":
                raise ValueError("Production requires secure JWT_SECRET_KEY")
            
            # ⚠️ TEMPORARILY DISABLED for production testing with SQLite
            # TODO: Re-enable for actual production deployment
            # if "sqlite" in self.DATABASE_URL.lower():
            #     raise ValueError("Production should not use SQLite database")


# Global settings instance
settings = Settings()

# Validate on import if in production
if settings.is_production:
    settings.validate_production_constraints() 