import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from services.database import init_db
from services.llm import close_client
from routers import polish, dictionary, profiles

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_client()

app = FastAPI(title="VoicePolish API", version="1.0.0", lifespan=lifespan)

# Allow frontend origin from env, fallback to permissive for dev
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(polish.router)
app.include_router(dictionary.router)
app.include_router(profiles.router)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
