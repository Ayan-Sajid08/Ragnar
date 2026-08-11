from pydantic import BaseModel


class ConversationRequest(BaseModel):
    title: str