import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from schemas.request import EmailRequest, ProposalRequest
from services import llm_service

app = FastAPI(title="Outbound Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROJECT_ROOT = BASE_DIR.parent


@app.get("/api/health")
async def health():
    return {"ok": True, "mode": llm_service.mode(), "model": llm_service.MODEL}


@app.get("/api/ai/mode")
async def ai_mode():
    return {
        "available": True,
        "mode": llm_service.mode(),
        "model": llm_service.MODEL,
        "configured": llm_service.is_configured(),
    }


@app.post("/api/ai/generate-email")
async def generate_email(req: EmailRequest):
    if not llm_service.is_configured():
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY，无法调用真实模型")
    try:
        content = await llm_service.generate_email(req.model_dump())
        return {"mode": "real", "model": llm_service.MODEL, "content": content}
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"模型调用失败：{exc}") from exc


@app.post("/api/ai/generate-proposal")
async def generate_proposal(req: ProposalRequest):
    if not llm_service.is_configured():
        raise HTTPException(status_code=503, detail="未配置 DEEPSEEK_API_KEY，无法调用真实模型")
    try:
        content = await llm_service.generate_proposal(req.model_dump())
        return {"mode": "real", "model": llm_service.MODEL, "content": content}
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"模型调用失败：{exc}") from exc


@app.get("/")
async def index():
    return FileResponse(PROJECT_ROOT / "index.html")


app.mount("/js", StaticFiles(directory=PROJECT_ROOT / "js"), name="js")
app.mount("/css", StaticFiles(directory=PROJECT_ROOT / "css"), name="css")
