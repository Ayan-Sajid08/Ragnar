from config import settings
import httpx

OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings"

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            OPENROUTER_EMBEDDINGS_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.allowed_origins,
            },
            json={
                "model": settings.openrouter_embedding_model,
                "input": texts,
                "encoding_format": "float",
            },
        )

    if response.is_error:
        print(response.status_code)
        print(response.text)
        response.raise_for_status()

    data = response.json()

    print("OpenRouter embedding complete")

    if response.is_error:
        print(response.status_code)
        print(response.text)
        response.raise_for_status()

    data = response.json()

    print("OpenRouter embedding complete")

    return [item["embedding"] for item in data["data"]]