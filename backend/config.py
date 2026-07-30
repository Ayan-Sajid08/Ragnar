from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    allowed_origins: str = "http://localhost:3000"
    supabase_url: str
    supabase_secret_key: str
    database_url: str
    
    class Config:
        env_file = ".env"

settings = Settings()