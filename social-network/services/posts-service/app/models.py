from typing import Optional

from pydantic import BaseModel

class CreatePostRequest(BaseModel):
    authorHandle: str
    authorName: str
    text: str
    hasMedia: bool = False

class CounterUpdateRequest(BaseModel):
    field: str
    delta: int
