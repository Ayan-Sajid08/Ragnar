from config import settings
import httpx

VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"

async def get_embeddings(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            VOYAGE_URL,
            headers={"Authorization": f"Bearer {settings.voyage_api_key}"},
            json={"input": texts, "model": "voyage-3-lite"}
        )
        data = response.json()
        print("Voyage response:", data)
        return [item["embedding"] for item in data["data"]]