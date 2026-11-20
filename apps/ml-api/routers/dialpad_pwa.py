"""In-app dial pad. JSON plus cached MP3. Confirmed records only."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.dialpad_core import check_pin, find_patient, insight_text, issue_token, log_access, patient_from_token
from services.tts_sarvam import synthesize

router = APIRouter(prefix="/dialpad", tags=["dialpad"])


class AuthBody(BaseModel):
    phone_number: str = ""
    pin: str = ""
    patient_short_code: str = ""


def _bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing session token")
    return authorization.split(" ", 1)[1].strip()


@router.post("/auth")
def auth(body: AuthBody):
    patient = find_patient(phone=body.phone_number, short_code=body.patient_short_code)
    if patient is None or not body.pin or not check_pin(patient, body.pin):
        raise HTTPException(status_code=401, detail="Phone, code, or PIN did not match")
    return {
        "token": issue_token(patient.id),
        "patient_id": patient.id,
        "name": patient.name,
        "preferred_lang": patient.preferred_lang,
        "disclaimer": "Read-only confirmed records. Not a diagnosis.",
    }


@router.get("/insights/{patient_id}")
def insights(
    patient_id: str,
    menu: str = "1",
    lang: str = "ta",
    authorization: Optional[str] = Header(default=None),
):
    patient = patient_from_token(_bearer(authorization))
    if patient is None or patient.id != patient_id:
        raise HTTPException(status_code=401, detail="Session does not match this patient")
    if menu not in {"1", "2", "3", "4", "5", "9", "0", "*"}:
        raise HTTPException(status_code=400, detail="Unknown menu key")
    spoken = insight_text(patient, menu, lang)
    log_access(patient.id, menu, "ta" if lang == "ta" else "en", "pwa")
    audio_url = None
    audio_error = None
    try:
        path = synthesize(spoken, lang, codec="mp3", sample_rate=22050)
        base = os.environ.get("PUBLIC_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        audio_url = f"{base}/dialpad/audio/{path.name}"
    except Exception as exc:  # noqa: BLE001
        audio_error = "Audio is unavailable. The text is still safe to show."
        print("dialpad tts:", type(exc).__name__)
    return {
        "menu": menu,
        "lang": "ta" if lang == "ta" else "en",
        "spoken_text": spoken,
        "audio_url": audio_url,
        "audio_error": audio_error,
        "confirmed_only": True,
    }


@router.get("/audio/{filename}")
def audio(filename: str):
    if "/" in filename or ".." in filename:
        raise HTTPException(status_code=404, detail="Not found")
    path = Path(__file__).resolve().parents[1] / ".audio_cache" / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    media = "audio/wav" if path.suffix == ".wav" else "audio/mpeg"
    return FileResponse(path, media_type=media)
