# What is Ragnar?
Ragnar is a RAG-powered document chat application. Allowing users to quickly analyze and make queries about the documents they upload. It follows the traditional RAG pipeline, but not in the strict way. Instead of shutting down to document only, it can answer generally while maintaining confidence and being transparent when it generalized a response instead of getting it from the document. Currently only supports pdfs and has an OCR fallback for scanned pdfs. Instead of relying solely on the language model's pre-trained knowledge, it retrieves the most relevant information from the uploaded document using semantic vector search. The retrieved context, along with the conversation history and user query, is provided to the language model to generate accurate, document-grounded responses.

# Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js |
| Backend API | FastAPI |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Database | Supabase PostgreSQL |
| Vector Search | PostgreSQL + pgvector (via Supabase) |
| Embeddings | OpenRouter Embedding Model |
| LLM | OpenRouter Chat Models |
| OCR | RapidOCR |

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


# Features
- Main
	- Uploading the pdf.
	- Summarizing.
	- Chatting with context of the pdf.
	- Follow up abilities and basic per chat memory.
- QoL
	- Autoscroll
	- Delete conversations

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

### 1. Document Upload

The user uploads a PDF through the Next.js frontend. The file is stored in Supabase Storage, while document metadata is stored in the database.

### 2. Text Extraction

The backend extracts text from the uploaded PDF. If the PDF contains selectable text, it is extracted directly. If it is a scanned document, an OCR step can be used to convert images into text.

### 3. Chunking

The extracted text is divided into smaller overlapping chunks. Chunking improves retrieval accuracy because embedding models work better with shorter passages than with entire documents.

### 4. Embedding Generation

Each chunk is converted into a numerical vector (embedding) using an embedding model accessed through OpenRouter. These vectors capture the semantic meaning of the text.

### 5. Vector Storage

Each embedding is stored in the database alongside its corresponding text chunk and document identifier. This creates a searchable knowledge base for the uploaded document.

### 6. User Query Processing

When the user asks a question, the question is also converted into an embedding using the same embedding model.

### 7. Similarity Search

The query embedding is compared against the stored document embeddings using vector similarity search. The most relevant chunks are retrieved to provide context for answering the question.

### 8. Prompt Construction

The backend constructs a prompt containing:

- A system prompt defining the assistant's behavior.
- The retrieved document context.
- Recent conversation history.
- The current user question.

This gives the language model both the relevant document information and conversational context.

### 9. Response Generation

The prompt is sent to an OpenRouter language model. If the primary model is unavailable or fails, the system automatically retries using a fallback model.

### 10. Conversation Storage

The generated response is saved in the conversation history, allowing future questions to maintain context and enabling multi-turn interactions.

## Overall Flow

```text
Upload PDF
      │
      ▼
Extract Text
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