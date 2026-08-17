import csv
from io import StringIO

from services.chunker import chunk_text


def extract_text(file_bytes: bytes):
    text = file_bytes.decode(
        "utf-8-sig",
        errors="replace",
    )

    reader = csv.reader(StringIO(text))

    rows = []

    for row in reader:
        values = [
            str(value).strip()
            for value in row
            if str(value).strip()
        ]

        if values:
            rows.append(" | ".join(values))

    if not rows:
        return [], False

    text = "\n".join(rows)

    return chunk_text(text), False