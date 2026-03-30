from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import PolishRequest, PolishResponse
from services.llm import call_llm, call_llm_stream
from services.database import get_dictionary_as_context, get_profile_as_context
from prompts.polish_prompt import build_polish_prompt
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/api/polish", response_model=PolishResponse)
async def polish_text(request: PolishRequest):
    try:
        prompt = await _build_prompt(request)
        polished = await call_llm(prompt)
        return PolishResponse(
            polished_text=polished,
            changes_summary="Text polished successfully"
        )
    except Exception as e:
        logger.exception("Polish request failed")
        raise HTTPException(status_code=500, detail="Failed to polish text. Please try again.")


@router.post("/api/polish/stream")
async def polish_text_stream(request: PolishRequest):
    """Stream polished text token-by-token via SSE."""
    try:
        prompt = await _build_prompt(request)
    except Exception as e:
        logger.exception("Failed to build prompt")
        raise HTTPException(status_code=500, detail="Failed to prepare polish request.")

    async def event_generator():
        try:
            async for token in call_llm_stream(prompt):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            logger.exception("Stream error")
            yield f"data: {json.dumps({'error': 'Polishing failed. Please try again.'})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _build_prompt(request: PolishRequest) -> str:
    dictionary_context = await get_dictionary_as_context()
    profile_context = await get_profile_as_context(request.profile_id)
    return build_polish_prompt(
        raw_text=request.raw_text,
        dictionary_context=dictionary_context,
        profile_context=profile_context,
        format_as=request.format_as.value,
    )
