from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    allowed_origins: str = "http://localhost:3000"
    supabase_url: str
    supabase_secret_key: str
    database_url: str
    huggingface_api_key: str
    voyage_api_key: str
    openrouter_api_key: str
    openrouter_model: str
    openrouter_embedding_model: str
    mistral_api_key: str
    mistral_ocr_model: str = "mistral-ocr-latest"

    class Config:
        env_file = ".env"

settings = Settings()