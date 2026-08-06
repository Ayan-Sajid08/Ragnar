from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import documents
from routers import messages

app = FastAPI()

app.include_router(documents.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router)

@app.get("/")
def read_root():
    return {"message": "Ragnar API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}