CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400


def chunk_text(
    text: str,
    page_number: int = 0,
    start_index: int = 0,
) -> list[dict]:
    chunks = []

    step = CHUNK_SIZE - CHUNK_OVERLAP

    for i in range(0, len(text), step):
        chunk = text[i:i + CHUNK_SIZE]

        chunks.append({
            "content": chunk,
            "page_number": page_number,
            "chunk_index": start_index + len(chunks),
        })

    return chunks