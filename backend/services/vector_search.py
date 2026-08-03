from database import supabase

async def search_similar_chunks(query_embedding: list[float], document_id: str, limit: int = 5):
    result = supabase.rpc('match_chunks', {
        'query_embedding': query_embedding,
        'document_id': document_id,
        'match_count': limit
    }).execute()
    return result.data