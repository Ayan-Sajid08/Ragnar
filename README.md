# What is Ragnar?

Ragnar is a RAG-powered document chat application. It allows users to upload multiple documents to a conversation, analyze them, make queries about their contents, and edit uploaded PDFs directly.

It follows the traditional RAG pipeline, but not in the strict way. Instead of shutting down to document-only answers, it can answer generally while maintaining confidence and being transparent when it generalized a response instead of getting it from the documents.

Ragnar supports multiple document formats, including PDFs, TXT, Markdown, DOCX, PPTX, XLSX, and CSV files. PDFs also have an OCR fallback for scanned documents. Instead of relying solely on the language model's pre-trained knowledge, Ragnar retrieves the most relevant information from uploaded documents using semantic vector search. The retrieved context, along with the conversation history and user query, is provided to the language model to generate accurate, context-aware responses.

# Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js |
| PDF Editor | ComPDFKit WebViewer |
| Backend API | FastAPI |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Database | Supabase PostgreSQL |
| Vector Search | PostgreSQL + pgvector (via Supabase) |
| Embeddings | OpenRouter Embedding Model |
| LLM | OpenRouter Chat Models |
| OCR | MistralOCR |

# Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

# Supported Documents

Ragnar currently supports the following document formats:

| Format | Extraction Method | OCR |
| --- | --- | --- |
| PDF | PyMuPDF | MistralOCR fallback for scanned pages |
| TXT | UTF-8 text decoding | No  |
| MD  | UTF-8 text decoding | No  |
| DOCX | python-docx | No  |
| PPTX | python-pptx | No  |
| XLSX | openpyxl | No  |
| CSV | Python CSV parser | No  |

For PDFs, pages containing little or no extractable text can be processed using OCR. OCR usage is tracked for the document so scanned PDFs can be identified by the application.

Structured documents preserve useful structural information during extraction. For example:

- PPTX files preserve slide numbers.
- XLSX files preserve worksheet names.
- DOCX files extract both paragraphs and table contents.
- CSV files preserve rows and columns by joining cell values.
- PDF files preserve page numbers.

# Features

- Main
    
    - Uploading multiple documents per conversation.
    - Support for PDF, TXT, Markdown, DOCX, PPTX, XLSX, and CSV files.
    - Viewing uploaded PDFs directly in the chat.
    - Editing supported PDFs directly through ComPDFKit WebViewer.
    - Saving edited PDFs in place of the original.
    - Automatic OCR fallback for scanned PDF pages.
    - Re-processing edited documents so their extracted content and embeddings remain up to date.
    - Summarizing documents.
    - Chatting with context from uploaded documents.
    - Follow-up abilities and basic per-chat memory.
    - General questions when appropriate.
    - Semantic vector search across multiple documents.
- QoL
    
    - Autoscroll.
    - Rename conversations.
    - Delete conversations.
    - Add documents without leaving the current chat.
    - Loading states while documents are being opened.
    - Conversation list with the newest conversations displayed first.

# ENV Variables

- Backend
    
    - SUPABASE_URL
    - SUPABASE_SECRET_KEY
    - DATABASE_URL
    - ALLOWED_ORIGINS
    - OPENROUTER_API_KEY
    - OPENROUTER_MODEL
    - OPENROUTER_EMBEDDING_MODEL
- Frontend
    
    - NEXT_PUBLIC_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    - NEXT_PUBLIC_API_URL (Backend url)

# Architecture

## Component Explanation

### 1\. Document Upload

The user uploads a supported document through the Next.js frontend. The file is stored in Supabase Storage, while document metadata is stored in the database. Multiple documents can be attached to the same conversation.

### 2\. Document Type Detection

The backend determines the document type from the uploaded file and routes it to the appropriate document processor.

Supported processors include:

- `pdf_processor` for PDF files.
- `text_processor` for TXT and Markdown files.
- `docx_processor` for DOCX files.
- `pptx_processor` for PPTX files.
- `xlsx_processor` for XLSX files.
- `csv_processor` for CSV files.

### 3\. Text Extraction

The appropriate processor extracts text from the uploaded document.

For PDFs, selectable text is extracted directly using PyMuPDF. If a page contains little or no extractable text, the page is rendered as an image and processed using MistralOCR.

For DOCX files, paragraphs and tables are extracted.

For PPTX files, text from presentation shapes is extracted while preserving the slide number.

For XLSX files, each worksheet is processed separately. The worksheet name is included in the extracted text, followed by its rows and cell values.

For CSV files, rows are parsed using Python's CSV parser and cell values are combined into structured text.

### 4\. Chunking

The extracted text is divided into smaller overlapping chunks.

The current chunking configuration is:

- Chunk size: 2000 characters.
- Chunk overlap: 400 characters.

Chunking improves retrieval accuracy because embedding models work better with shorter passages than with entire documents.

Each chunk also stores metadata such as its document, chunk index, and page or slide number where applicable.

### 5\. Embedding Generation

Each chunk is converted into a numerical vector (embedding) using an embedding model accessed through OpenRouter. These vectors capture the semantic meaning of the text.

### 6\. Vector Storage

Each embedding is stored in the database alongside its corresponding text chunk and document identifier. This creates a searchable knowledge base for the uploaded documents.

The database uses PostgreSQL with pgvector to perform semantic similarity searches.

### 7\. User Query Processing

When the user asks a question, the question is also converted into an embedding using the same embedding model.

### 8\. Similarity Search

The query embedding is compared against the stored document embeddings using vector similarity search.

The search can be scoped to the documents belonging to the current conversation, allowing Ragnar to retrieve relevant information from multiple uploaded documents.

The most relevant chunks are retrieved to provide context for answering the question.

### 9\. Prompt Construction

The backend constructs a prompt containing:

- A system prompt defining the assistant's behavior.
- The retrieved document context.
- Recent conversation history.
- The current user question.

This gives the language model both the relevant document information and conversational context.

### 10\. Response Generation

The backend constructs a prompt containing:

- A system prompt defining the assistant's behavior.
- The retrieved document context.
- Recent conversation history.
- The current user question.

This gives the language model both the relevant document information and conversational context.

### 11\. Conversation Storage

The generated response is saved in the conversation history, allowing future questions to maintain context and enabling multi-turn interactions.

Conversations can also be renamed or deleted. New conversations can be created without leaving the current application.

### 11\. PDF Editing

Supported PDFs can be opened in the integrated ComPDFKit WebViewer.

Users can edit the document directly within the conversation and save the edited PDF. The edited file replaces the existing file in Supabase Storage.

After an edited PDF is saved, it can be processed again so that its extracted text, chunks, and embeddings reflect the updated document.

Scanned PDFs detected through the OCR process are identified separately and are not treated as editable PDFs.

## Overall Flow

```text
Upload Document
      │
      ▼
Detect Document Type
      │
      ▼
Select Document Processor
      │
      ├─────────────── PDF ───────────────┐
      │                                   │
      │                            Extract Text
      │                                   │
      │                            Little/No Text?
      │                                   │
      │                              ┌────┴────┐
      │                             Yes        No
      │                              │          │
      │                           MistralOCR    │
      │                              │          │
      │                              └────┬─────┘
      │                                   │
      ├── TXT / MD ──► Text Extraction    │
      ├── DOCX ──────► Paragraphs/Tables  │
      ├── PPTX ──────► Slide Text         │
      ├── XLSX ──────► Worksheets/Rows    │
      └── CSV ───────► Rows/Columns       │
                                          │
                                          ▼
                                    Chunk Text
                                          │
                                          ▼
                                 Generate Embeddings
                                          │
                                          ▼
                                    Store Vectors
                                          │
                                          ▼
                                  User Asks Question
                                          │
                                          ▼
                                    Embed Question
                                          │
                                          ▼
                                    Vector Search
                                          │
                                          ▼
                              Retrieve Relevant Chunks
                                          │
                                          ▼
                                  Construct Prompt
                                          │
                                          ▼
                                  OpenRouter LLM
                                          │
                                          ▼
                                     Return Answer
```