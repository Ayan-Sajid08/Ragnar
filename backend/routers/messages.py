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

    embeddings = await get_embeddings([request.content])
    user_question_embedding = embeddings[0]

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

    supabase.table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "user",
        "content": request.content,
    }).execute()

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
You are an AI assistant designed to help users understand and analyze an uploaded document.

Document Context (extracted from the pdf):
{chunks_text}

Rules:
- The uploaded document is your primary source of truth.
- If the user's question is about the document, answer using the document context.
- You may make reasonable inferences that logically follow from the document, but clearly distinguish between facts and inferences.
- Never invent or assume information that is not supported by the document.
- If the document does not contain enough information to answer a document-related question, clearly state that.
- If the user's question is unrelated to the uploaded document, answer it using your general knowledge.
- Whenever you answer using general knowledge instead of the uploaded document, append the following notice exactly as written:

**Note:** This information is not from the uploaded document. It is a general knowledge answer. If you're looking for something specific in the document, let me know and I'll answer using it.

- Do not append the notice if your answer is based on the uploaded document.
- Keep responses concise unless the user asks for more detail.
""".strip(),
        }
    ]

    for msg in history.data:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })

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

    print("Status:", response.status_code)
    print("Response:", response.text)

    if response.is_error:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    ai_response = response.json()["choices"][0]["message"]["content"]

    supabase.table("messages").insert({
        "conversation_id": request.conversation_id,
        "role": "assistant",
        "content": ai_response,
    }).execute()

    return {"response": ai_response}