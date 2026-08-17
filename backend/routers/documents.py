from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from database import supabase
from dependencies import get_current_user
from services import upload

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    conversation_id: str,
    file: UploadFile = File(...),
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

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is missing"
        )

    filename = file.filename

    extension = (
        filename.rsplit(".", 1)[-1].lower()
        if "." in filename
        else ""
    )

    supported_formats = {
        "pdf",
        "txt",
        "md",
        "docx",
        "pptx",
        "xlsx",
        "csv",
    }

    if extension not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: .{extension}"
        )

    content_types = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "md": "text/markdown",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
    }

    return await upload.upload_document(
        file_bytes=file_bytes,
        filename=filename,
        file_type=extension,
        content_type=content_types[extension],
        user_id=user.id,
        conversation_id=conversation_id,
    )

@router.post("/{document_id}/edit")
async def edit_document(
    document_id: str,
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    document_response = (
        supabase
        .table("documents")
        .select("id")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not document_response.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    pdf_bytes = await file.read()

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF is empty"
        )

    try:
        return await upload.edit_document(
            pdf_bytes=pdf_bytes,
            document_id=document_id,
            user_id=user.id,
        )

    except Exception as e:
        print("EDIT DOCUMENT ERROR:", e)

        raise HTTPException(
            status_code=500,
            detail="Failed to update document"
        )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user=Depends(get_current_user)
):
    document_response = (
        supabase
        .table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .execute()
    )

    if not document_response.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    document = document_response.data[0]

    file_path = document["file_url"]

    supabase.storage.from_("documents").remove([file_path])

    supabase.table("documents").delete().eq(
        "id", document_id
    ).execute()

    return {"message": "Document deleted successfully"}