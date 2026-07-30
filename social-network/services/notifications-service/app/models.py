from typing import Literal, Optional

from pydantic import BaseModel

NotificationType = Literal["like", "follow", "reply", "repost", "mention"]

class CreateNotificationRequest(BaseModel):
    recipientHandle: str
    type: NotificationType
    actorHandle: str
    actorName: str
    postExcerpt: Optional[str] = None
