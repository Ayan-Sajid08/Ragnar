from database import supabase

async def search_similar_chunks(
    query_embedding: list[float],
    conversation_id: str,
    document_ids: list[str] | None = None,
    limit: int = 5
):
    result = supabase.rpc("match_chunks", {
        "query_embedding": query_embedding,
        "conversation_id": conversation_id,
        "document_ids": document_ids,
        "match_count": limit
    }).execute()

    return result.data