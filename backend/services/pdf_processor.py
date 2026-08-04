import fitz # pymupdf
import numpy as np
import cv2

from rapidocr import RapidOCR

CHUNK_SIZE = 2000
CHUNK_OVERLAP = 400

ocr = RapidOCR()

def extract_text(pdf_bytes : bytes) -> list[dict]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_chunks = []
    chunk_index = 0
    for page_num, page in enumerate(doc):
        text = page.get_text("text").strip()

        if not text:
            print(f"OCR page {page_num + 1}")
            text = ocr_page(page)
        chunks = chunk_text(text, page_num, chunk_index)
        text_chunks.extend(chunks)
        chunk_index += len(chunks)
    return text_chunks

def ocr_page(page):
    pix = page.get_pixmap(dpi=200)

    img = np.frombuffer(pix.samples, dtype=np.uint8)
    img = img.reshape((pix.height, pix.width, pix.n))

    if pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
    elif pix.n == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    result = ocr(img)

    if not result or not result.txts:
        return ""

    return "\n".join(result.txts)

def chunk_text(text: str, page_number: int, start_index: int) -> list[dict]:
    chunks = []
    chunk_index = start_index
    for i in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP):
        chunk = text[i:i + CHUNK_SIZE]
        chunks.append({"content": chunk, "page_number": page_number, "chunk_index": chunk_index})
        chunk_index += 1
    return chunks