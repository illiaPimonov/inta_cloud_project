from pydantic import BaseModel

class SendMessageRequest(BaseModel):
    fromHandle: str
    text: str

class StartConversationRequest(BaseModel):
    initiatorHandle: str
    initiatorName: str
    recipientHandle: str
    recipientName: str
