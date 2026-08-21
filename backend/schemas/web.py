from typing import Literal

from pydantic import BaseModel


class WebCaptureRequest(BaseModel):
    url: str
    capture_mode: Literal["long", "parts"] = "long"
    conversation_id: str | None = None


class WebCaptureResponse(BaseModel):
    success: bool
    id: str | None
    name: str | None
    url: str
    title: str | None
    capture_mode: str
    image_urls: list[str]
    error: str | None = None