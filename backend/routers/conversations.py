from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from schemas.conversation import ConversationRequest
from database import supabase
from dependencies import get_current_user


router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationCreate(BaseModel):
    title: str


class ConversationUpdate(BaseModel):
    title: str


# Create a conversation
@router.post("/")
async def create_conversation(
    request: ConversationRequest,
    user=Depends(get_current_user)
):
    conversation_data = {
        "title": request.title,
        "user_id": user.id
    }

    response = supabase.table("conversations").insert(
        conversation_data
    ).execute()

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create conversation"
        )

    return response.data[0]


# Rename a conversation
@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    request: ConversationUpdate,
    user=Depends(get_current_user)
):
    conversation = (
        supabase
        .table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not conversation.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    response = (
        supabase
        .table("conversations")
        .update({"title": request.title})
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update conversation"
        )

    return response.data[0]


# Delete a conversation
@router.delete("/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user=Depends(get_current_user)
):
    conversation = (
        supabase
        .table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not conversation.data:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    response = (
        supabase
        .table("conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation"
        )

    return {"message": "Conversation deleted successfully"}