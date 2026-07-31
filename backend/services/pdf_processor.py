import fitz  # PyMuPDF

CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400

def extract_text(pdf_bytes : bytes) -> list[dict]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_chunks = []
    chunk_index = 0
    for page_num, page in enumerate(doc):
        text = page.get_text()
        chunks = chunk_text(text, page_num, chunk_index)
        text_chunks.extend(chunks)
        chunk_index += len(chunks)
    return text_chunks

def chunk_text(text: str, page_number: int, start_index: int) -> list[dict]:
    chunks = []
    chunk_index = start_index
    for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
        chunk = text[i:i + CHUNK_SIZE]
        chunks.append({"content": chunk, "page_number": page_number, "chunk_index": chunk_index})
        chunk_index += 1
    return chunks