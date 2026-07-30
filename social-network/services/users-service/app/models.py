from typing import Optional

from pydantic import BaseModel

class LoginRequest(BaseModel):
    identifier: str
    password: str

class RegisterRequest(BaseModel):
    displayName: str
    username: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    displayName: str
    username: str
    email: str

class FollowToggleRequest(BaseModel):
    viewerHandle: str
    targetHandle: str
