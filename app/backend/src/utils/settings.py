from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
  host_ip: str
  # --------------------------
  # kafka config
  # --------------------------
  kafka_server: str = "kafka:9092"
  kafka_topic: str = "email"
  # --------------------------
  # email config
  # --------------------------
  mail_username: str
  mail_password: str
  mail_from: str
  mail_port: int = 587
  mail_server: str = "smtp.gmail.com"
  mail_from_name: str = "W.I.T.H"
  mail_starttls: bool = True
  mail_ssl_tls: bool = False
  # tokenset.py
  # --------------------------
  # secret_key: str
  private_key: str = "secrets/authpr.pem"
  public_key: str = "secrets/authpb.pem"
  access_token_expire_minutes: int
  refresh_token_expire_days: int
  # --------------------------
  # rediscl.py
  # --------------------------
  redis_host: str
  redis_port: int
  redis_db: int
  # --------------------------
  # file.py
  # --------------------------
  service_key: str
  # --------------------------
  # db.py
  # --------------------------
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
