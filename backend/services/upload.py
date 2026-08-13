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

    # Extract text and determine whether OCR was required
    text_chunks, ocr_used = extract_text(pdf_bytes)

    doc_response = supabase.table("documents").insert({
        "user_id": user_id,
        "conversation_id": conversation_id,
        "name": filename,
        "file_url": file_path,
        "file_type": "pdf",
        "ocr": ocr_used,
    }).execute()

    document_id = doc_response.data[0]["id"]

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


async def edit_document(
    pdf_bytes: bytes,
    document_id: str,
    user_id: str,
):
    # --------------------------------------------------
    # 1. Get existing document
    # --------------------------------------------------

    document_response = (
        supabase
        .table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )

    if not document_response.data:
        raise ValueError("Document not found")

    document = document_response.data

    # --------------------------------------------------
    # 2. Prevent editing scanned/OCR documents
    # --------------------------------------------------

    if document["ocr"]:
        raise ValueError("Scanned PDFs cannot be edited")

    file_path = document["file_url"]

    # --------------------------------------------------
    # 3. Replace PDF in Supabase Storage
    # --------------------------------------------------

    supabase.storage.from_("documents").upload(
        file_path,
        pdf_bytes,
        {
            "content-type": "application/pdf",
            "upsert": "true",
        }
    )

    # --------------------------------------------------
    # 4. Delete old chunks
    # --------------------------------------------------

    supabase.table("document_chunks").delete().eq(
        "document_id",
        document_id
    ).execute()

    # --------------------------------------------------
    # 5. Extract text from edited PDF
    # --------------------------------------------------

    text_chunks, ocr_used = extract_text(pdf_bytes)

    if not text_chunks:
        raise ValueError("No text could be extracted from the PDF")

    # --------------------------------------------------
    # 6. Generate new embeddings
    # --------------------------------------------------

    contents = [
        chunk["content"]
        for chunk in text_chunks
    ]

    embeddings = await get_embeddings(contents)

    for i, chunk in enumerate(text_chunks):
        chunk["embedding"] = embeddings[i]

    # --------------------------------------------------
    # 7. Insert new chunks
    # --------------------------------------------------

    chunks_to_insert = []

    for chunk in text_chunks:
        chunks_to_insert.append({
            "document_id": document_id,
            "content": chunk["content"],
            "embedding": chunk["embedding"],
            "page_number": chunk["page_number"],
            "chunk_index": chunk["chunk_index"],
        })

    supabase.table("document_chunks").insert(
        chunks_to_insert
    ).execute()

    # --------------------------------------------------
    # 8. Update OCR status
    # --------------------------------------------------

    supabase.table("documents").update({
        "ocr": ocr_used,
    }).eq(
        "id",
        document_id
    ).execute()

    return {
        "message": "Document updated successfully",
        "document_id": document_id,
    }