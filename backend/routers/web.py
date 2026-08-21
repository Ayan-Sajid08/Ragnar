from fastapi import APIRouter, Depends

from schemas.web import (
    WebCaptureRequest,
    WebCaptureResponse,
)

from services.web_capture import capture_website
from dependencies import get_current_user


router = APIRouter(
    prefix="/web",
    tags=["Web Capture"],
)


@router.post(
    "/capture",
    response_model=WebCaptureResponse,
)
async def capture_webpage(
    request: WebCaptureRequest,
    user=Depends(get_current_user),
):
    result = await capture_website(
        url=str(request.url),
        capture_mode=request.capture_mode,
        user_id=str(user.id),
        conversation_id=request.conversation_id,
    )

    return result