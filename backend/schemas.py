from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class WechatLoginRequest(BaseModel):
    code: str


class UserOut(BaseModel):
    id: int
    username: str
    group_size: int
    review_intervals: str
    created_at: datetime
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class WechatToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool = False


class UserSettings(BaseModel):
    group_size: int | None = None
    review_intervals: str | None = None
    display_name: str | None = None
    avatar_url: str | None = None
