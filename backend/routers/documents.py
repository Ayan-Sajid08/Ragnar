from fastapi import APIRouter, UploadFile, File, Depends
from database import supabase
from dependencies import get_current_user
from services.pdf_processor import extract_text
from services.embeddings import get_embeddings
from config import settings
import time

router = APIRouter(prefix="/documents", tags=["documents"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    
    pdf_bytes = await file.read()
    file_path = f"{user.id}/{int(time.time())}_{file.filename}"
    
    storage_response = supabase.storage.from_("documents").upload(
        file_path, 
        pdf_bytes,
        {"content-type": "application/pdf"}
    )

    doc_response = supabase.table("documents").insert({
        "user_id": user.id,
        "name": file.filename,
        "file_url": file_path,
        "file_type": "pdf"
    }).execute()

    document_id = doc_response.data[0]["id"]
    
    text_chunks = extract_text(pdf_bytes)
    
    contents = [chunk["content"] for chunk in text_chunks]
    embeddings = await get_embeddings(contents)
    for i, chunk in enumerate(text_chunks):
        chunk["embedding"] = embeddings[i]
    
    chunks_to_insert = []
    for chunk in text_chunks:
        chunks_to_insert.append({
            "document_id": document_id,
            "content": chunk["content"],
            "embedding": chunk["embedding"],
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"]
        })

    supabase.table("document_chunks").insert(chunks_to_insert).execute()

    return {"message": "Document uploaded successfully", "document_id": document_id}