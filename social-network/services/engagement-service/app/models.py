from typing import Literal

from pydantic import BaseModel

EngagementType = Literal["like", "repost", "bookmark"]

class ToggleRequest(BaseModel):
    userHandle: str
    postId: str
    type: EngagementType
