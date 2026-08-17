from services.pdf_processor import extract_text as extract_pdf_text
from services.text_processor import extract_text as extract_text_file
from services.docx_processor import extract_text as extract_docx_text
from services.pptx_processor import extract_text as extract_pptx_text
from services.xlsx_processor import extract_text as extract_xlsx_text
from services.csv_processor import extract_text as extract_csv_text

def extract_document(file_bytes: bytes, file_type: str):
    if file_type == "pdf":
        return extract_pdf_text(file_bytes)

    if file_type in {"txt", "md"}:
        return extract_text_file(file_bytes)

    if file_type == "docx":
        return extract_docx_text(file_bytes)

    if file_type == "pptx":
        return extract_pptx_text(file_bytes)

    if file_type == "xlsx":
        return extract_xlsx_text(file_bytes)

    if file_type == "csv":
        return extract_csv_text(file_bytes)

    raise ValueError(
        f"Unsupported document type: {file_type}"
    )