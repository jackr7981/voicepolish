from fastapi import APIRouter, HTTPException
from models.schemas import DictionaryEntry, DictionaryResponse
from services.database import (
    get_all_dictionary_entries,
    add_dictionary_entry,
    delete_dictionary_entry,
)

router = APIRouter()

@router.get("/api/dictionary", response_model=DictionaryResponse)
async def list_dictionary():
    entries = await get_all_dictionary_entries()
    return DictionaryResponse(
        entries=[DictionaryEntry(**e) for e in entries],
        total=len(entries)
    )

@router.post("/api/dictionary")
async def add_entry(entry: DictionaryEntry):
    is_new = await add_dictionary_entry(entry.term, entry.preferred_spelling, entry.category)
    status = "added" if is_new else "updated"
    return {"status": status, "term": entry.term}

@router.delete("/api/dictionary/{term}")
async def remove_entry(term: str):
    deleted = await delete_dictionary_entry(term)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Term '{term}' not found")
    return {"status": "deleted", "term": term}
