import os
import shutil
import tempfile
import uuid
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlparse

from playwright.async_api import async_playwright

from config import settings
from supabase import create_client


MAX_SCROLLS = 10
BUCKET_NAME = "web_capture"


@dataclass
class WebCaptureResult:
    success: bool
    id: str | None
    name: str | None
    url: str
    title: str | None
    capture_mode: str
    image_urls: list[str]
    error: str | None = None


supabase = create_client(
    settings.supabase_url,
    settings.supabase_secret_key,
)


async def capture_website(
    url: str,
    capture_mode: str,
    user_id: str,
    conversation_id: str | None = None,
) -> WebCaptureResult:

    capture_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix="ragnar_web_capture_")

    screenshot_paths: list[str] = []
    title: str | None = None

    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        # Remove "www." to keep names cleaner
        if domain.startswith("www."):
            domain = domain[4:]

        timestamp = datetime.now().strftime(
            "%Y-%m-%d_%H-%M-%S"
        )

        name = f"{domain}_{timestamp}"

        async with async_playwright() as p:
            browser = await p.chromium.launch()

            page = await browser.new_page(
                viewport={
                    "width": 1280,
                    "height": 720,
                }
            )

            await page.goto(
                url,
                wait_until="networkidle",
                timeout=30000,
            )

            title = await page.title()

            if capture_mode == "long":

                filename = f"{name}.png"

                screenshot_path = os.path.join(
                    temp_dir,
                    filename,
                )

                await page.screenshot(
                    path=screenshot_path,
                    full_page=True,
                )

                screenshot_paths.append(
                    screenshot_path
                )

            elif capture_mode == "parts":

                for i in range(MAX_SCROLLS):

                    filename = f"{name}_{i + 1}.png"

                    screenshot_path = os.path.join(
                        temp_dir,
                        filename,
                    )

                    await page.screenshot(
                        path=screenshot_path,
                    )

                    screenshot_paths.append(
                        screenshot_path
                    )

                    previous_scroll = await page.evaluate(
                        "window.scrollY"
                    )

                    await page.evaluate(
                        "window.scrollBy(0, window.innerHeight)"
                    )

                    await page.wait_for_timeout(1000)

                    current_scroll = await page.evaluate(
                        "window.scrollY"
                    )

                    if current_scroll == previous_scroll:
                        break

            else:
                return WebCaptureResult(
                    success=False,
                    id=None,
                    name=None,
                    url=url,
                    title=None,
                    capture_mode=capture_mode,
                    image_urls=[],
                    error=f"Invalid capture mode: {capture_mode}",
                )

            await browser.close()

        # Upload screenshots
        image_urls: list[str] = []

        for local_path in screenshot_paths:

            filename = os.path.basename(local_path)

            storage_path = (
                f"{user_id}/{capture_id}/{filename}"
            )

            with open(local_path, "rb") as file:

                supabase.storage \
                    .from_(BUCKET_NAME) \
                    .upload(
                        storage_path,
                        file,
                        {
                            "content-type": "image/png",
                            "upsert": False,
                        },
                    )

            image_urls.append(storage_path)

        # Insert database record
        supabase.table("web_captures").insert(
            {
                "id": capture_id,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "name": name,
                "url": url,
                "capture_mode": capture_mode,
                "image_urls": image_urls,
            }
        ).execute()

        return WebCaptureResult(
            success=True,
            id=capture_id,
            name=name,
            url=url,
            title=title,
            capture_mode=capture_mode,
            image_urls=image_urls,
            error=None,
        )

    except Exception as e:

        return WebCaptureResult(
            success=False,
            id=None,
            name=None,
            url=url,
            title=title,
            capture_mode=capture_mode,
            image_urls=[],
            error=str(e),
        )

    finally:
        shutil.rmtree(
            temp_dir,
            ignore_errors=True,
        )