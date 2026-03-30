from fastapi import APIRouter, HTTPException
from models.schemas import PromptProfile, PromptProfileResponse
from services.database import (
    get_all_profiles,
    get_profile_by_id,
    add_profile,
    update_profile,
    delete_profile,
)

router = APIRouter()

@router.get("/api/profiles", response_model=PromptProfileResponse)
async def list_profiles():
    profiles = await get_all_profiles()
    return PromptProfileResponse(
        profiles=[PromptProfile(**p) for p in profiles],
        total=len(profiles)
    )

@router.get("/api/profiles/{profile_id}")
async def get_profile(profile_id: int):
    profile = await get_profile_by_id(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PromptProfile(**profile)

@router.post("/api/profiles")
async def create_profile(profile: PromptProfile):
    new_id = await add_profile(profile.name, profile.description, profile.rules, profile.is_default)
    return {"status": "created", "name": profile.name, "id": new_id}

@router.put("/api/profiles/{profile_id}")
async def edit_profile(profile_id: int, profile: PromptProfile):
    updated = await update_profile(profile_id, profile.name, profile.description, profile.rules)
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "updated", "id": profile_id}

@router.delete("/api/profiles/{profile_id}")
async def remove_profile(profile_id: int):
    deleted = await delete_profile(profile_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Profile not found or is a default profile")
    return {"status": "deleted", "id": profile_id}
