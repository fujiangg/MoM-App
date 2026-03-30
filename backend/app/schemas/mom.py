from pydantic import BaseModel
from datetime import date, datetime

class MoMBase(BaseModel):
    title: str
    meeting_date: date
    content: str

class MoMCreate(MoMBase):
    pass

class MoMUpdate(MoMBase):
    title: str | None = None
    meeting_date: date | None = None
    content: str | None = None

class MoMResponse(MoMBase):
    id: int
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True
