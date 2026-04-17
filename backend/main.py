from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from settings import settings

app = FastAPI(root_path="/api", servers=[
    {"url": "/api", "description": "API 기본 서버"}
  ])

origins = ["http://localhost", settings.host_ip]
app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
def read_root():
  return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
  return {"item_id": item_id, "q": q}
