import base64
import cv2
from mistralai.client.sdk import Mistral
from config import settings

client = Mistral(
    api_key=settings.mistral_api_key
)

def extract_text_from_image(image) -> str:
    """
    image: OpenCV image (numpy array)
    returns: extracted text
    """

    success, buffer = cv2.imencode(".png", image)
    if not success:
        raise RuntimeError("Failed to encode image")

    image_b64 = base64.b64encode(buffer.tobytes()).decode()

    response = client.ocr.process(
        model=settings.mistral_ocr_model,
        document={
            "type": "image_url",
            "image_url": f"data:image/png;base64,{image_b64}",
        },
    )

    text = []

    for page in response.pages:
        if page.markdown:
            text.append(page.markdown)

    return "\n".join(text)