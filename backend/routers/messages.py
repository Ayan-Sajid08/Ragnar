from fastapi import APIRouter, HTTPException, Depends
from database import supabase
from schemas import MessageRequest
from dependencies import get_current_user
from services.embeddings import get_embeddings
from services.vector_search import search_similar_chunks
from config import settings
import httpx

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("/")
async def create_message(request: MessageRequest, user=Depends(get_current_user)):
    # Get conversation
    conversation = (
        supabase.table("conversations")
        .select("*")
        .eq("id", request.conversation_id)
        .single()
        .execute()
    )

    if not conversation.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    document_id = conversation.data["document_id"]

    # Generate embedding for the user's question
    embeddings = await get_embeddings([request.content])
    user_question_embedding = embeddings[0]

    # Retrieve relevant document chunks
    similar_chunks = await search_similar_chunks(
        user_question_embedding,
        document_id,
    )

    chunks_text = "\n\n".join(
        chunk.get("content", chunk.get("text", ""))
        for chunk in (similar_chunks or [])
        if chunk
    )

    if not chunks_text:
        chunks_text = "No relevant document context was found."

    # Save the user's message first
    supabase.table("messages").insert(
        {
            "conversation_id": request.conversation_id,
            "role": "user",
            "content": request.content,
        }
    ).execute()

    # Get recent conversation history
    history = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", request.conversation_id)
        .order("created_at", desc=False)
        .limit(10)
        .execute()
    )

    messages = [
        {
            "role": "system",
            "content": f"""
You are an AI assistant that answers questions about an uploaded document.

Document Context:
{chunks_text}

Rules:
- Use the document as your primary source of truth.
- You may make reasonable inferences that logically follow from the document.
- Clearly distinguish between facts from the document and your own inference.
- If the answer cannot be determined from the document, say so.
- Do not invent information.
- Keep responses concise unless the user asks for detail.
""".strip(),
        }
    ]

    # Add conversation history
    for msg in history.data:
        messages.append(
            {
                "role": msg["role"],
                "content": msg["content"],
            }
        )

    # Generate response
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": settings.allowed_origins,
            },
            json={
                "model": settings.openrouter_model,
                "messages": messages,
            },
        )

    if response.is_error:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.json(),
        )

    ai_response = response.json()["choices"][0]["message"]["content"]

    # Save assistant response
    supabase.table("messages").insert(
        {
            "conversation_id": request.conversation_id,
            "role": "assistant",
            "content": ai_response,
        }
    ).execute()

    return {"response": ai_response}