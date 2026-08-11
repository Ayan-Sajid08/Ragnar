import time

from database import supabase
from services.pdf_processor import extract_text
from services.embeddings import get_embeddings


async def upload_document(
    pdf_bytes: bytes,
    filename: str,
    user_id: str,
    conversation_id: str,
):
    file_path = f"{user_id}/{int(time.time())}_{filename}"

    supabase.storage.from_("documents").upload(
        file_path,
        pdf_bytes,
        {"content-type": "application/pdf"}
    )

    doc_response = supabase.table("documents").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "name": filename,
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

    supabase.table("document_chunks").insert(
        chunks_to_insert
    ).execute()

    return {
        "message": "Document uploaded successfully",
        "document_id": document_id,
    }