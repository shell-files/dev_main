from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
  host_ip: str
  secret_key: str
  access_token_expire_minutes: int
  refresh_token_expire_days: int
  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
  )

settings = Settings()
