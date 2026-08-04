import fitz
import numpy as np
import cv2
from rapidocr import RapidOCR

ocr = RapidOCR()

pdf_path = "C:/Users/Ayan/Downloads/14. In re LONDON AND MEDITERRANEAN BANK. WRIGHT'S CASE. (1871) L.R. 7 Ch.App. 55.pdf"

doc = fitz.open(pdf_path)

for i, page in enumerate(doc):
    print(f"\n--- PAGE {i+1} ---")

    text = page.get_text().strip()

    if text:
        print(text[:500])
        continue

    pix = page.get_pixmap(dpi=150)

    img = np.frombuffer(pix.samples, dtype=np.uint8)
    img = img.reshape((pix.height, pix.width, pix.n))

    if pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

    result = ocr(img)

    text = "\n".join(result.txts)
    print(text[:500])