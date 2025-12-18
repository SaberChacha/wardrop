from pydantic_settings import BaseSettings
from functools import lru_cache
import pytz


class Settings(BaseSettings):
    # Application
    app_name: str = "Wardrop"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://wardrop:wardrop123@localhost:5432/wardrop"
    
    # JWT Authentication
    secret_key: str = "your-super-secret-key-change-in-production-wardrop-2024"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # Timezone and Locale
    timezone: str = "Africa/Algiers"
    currency: str = "DZD"
    default_language: str = "fr"
    supported_languages: list = ["fr", "ar"]
    
    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = ["jpg", "jpeg", "png", "webp"]
    
    # Twilio (SMS/WhatsApp)
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_number: str = ""
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Timezone helper
def get_timezone():
    settings = get_settings()
    return pytz.timezone(settings.timezone)


# Currency formatting helper
def format_currency(amount: float) -> str:
    """Format amount in Algerian Dinars (DZD)"""
    return f"{amount:,.2f} DZD"

