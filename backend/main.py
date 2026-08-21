import os
import subprocess
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import documents
from routers import messages
from routers.conversations import router as conversations_router
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from routers.web import router as web_router


def ensure_playwright_browser():
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        chromium_path = p.chromium.executable_path

    if not os.path.exists(chromium_path):
        print("Chromium not found. Installing Playwright Chromium...")

        subprocess.run(
            [
                sys.executable,
                "-m",
                "playwright",
                "install",
                "chromium",
            ],
            check=True,
        )

        print("Playwright Chromium installed.")
    else:
        print("Playwright Chromium already installed.")


ensure_playwright_browser()


app = FastAPI()

app.include_router(documents.router)
app.include_router(conversations_router)
app.include_router(messages.router)
app.include_router(web_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("VALIDATION ERROR:", exc.errors())

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


@app.get("/")
def read_root():
    return {"message": "Ragnar API is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}