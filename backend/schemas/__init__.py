from pydantic import BaseModel

class MessageRequest(BaseModel):
    conversation_id: str
    content: str
    document_ids: list[str] | None = None