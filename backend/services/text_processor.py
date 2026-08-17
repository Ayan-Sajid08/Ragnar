from services.chunker import chunk_text


def extract_text(file_bytes: bytes):
    text = file_bytes.decode(
        "utf-8",
        errors="replace",
    ).strip()

    if not text:
        return [], False

    return chunk_text(text), False