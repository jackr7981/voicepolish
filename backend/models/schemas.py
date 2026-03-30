from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class FormatType(str, Enum):
    auto = "auto"
    paragraph = "paragraph"
    bullets = "bullets"
    numbered = "numbered"

class PolishRequest(BaseModel):
    raw_text: str = Field(..., min_length=1, max_length=10000)
    profile_id: Optional[int] = None
    format_as: FormatType = FormatType.auto

class PolishResponse(BaseModel):
    polished_text: str
    changes_summary: str

class DictionaryEntry(BaseModel):
    term: str = Field(..., min_length=1, max_length=200)
    preferred_spelling: str = Field(..., min_length=1, max_length=200)
    category: Optional[str] = Field(default="general", max_length=50)

class DictionaryResponse(BaseModel):
    entries: list[DictionaryEntry]
    total: int

class PromptProfile(BaseModel):
    id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    rules: list[str] = Field(..., max_length=50)
    is_default: Optional[bool] = False

class PromptProfileResponse(BaseModel):
    profiles: list[PromptProfile]
    total: int
