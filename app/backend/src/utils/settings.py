from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
  host_ip: str
  # --------------------------
  # rediscl.py
  # --------------------------
  redis_host: str = "redis"
  redis_port: int = 6379
  redis_db: int = 0
  # --------------------------
  # file.py
  # --------------------------
  mariadb_user: str
  mariadb_password: str
  mariadb_host: str
  mariadb_database: str
  mariadb_port: int
  service_key: str
  # --------------------------
  # db.py
  # --------------------------
  maria_db_url: str
  maria_db_user: str
  maria_db_password: str
  maria_db_host: str
  maria_db_database: str
  maria_db_port: int

  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
  )

settings = Settings()
