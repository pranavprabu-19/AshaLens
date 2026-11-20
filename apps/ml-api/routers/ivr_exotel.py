"""Exotel webhooks. Clinical copy stays in dialpad_core; this file only adapts the call."""

from __future__ import annotations

import os

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, PlainTextResponse

from services.dialpad_core import CALLS, check_pin, find_patient, insight_text, log_access, wav_url
from services.tts_sarvam import synthesize

router = APIRouter(prefix="/ivr/exotel", tags=["ivr-exotel"])


def _check_token(request: Request) -> None:
    expected = os.environ.get("EXOTEL_WEBHOOK_TOKEN", "").strip()
    if not expected:
        return
    sent = request.headers.get("x-exotel-token") or request.query_params.get("token") or ""
    if sent != expected:
        raise HTTPException(status_code=403, detail="Webhook token did not match")


def _call(call_sid: str, phone: str) -> dict:
    state = CALLS.get(call_sid)
    if state is None:
        patient = find_patient(phone=phone)
        state = {
            "phone": phone,
            "patient_id": patient.id if patient else "",
            "authed": False,
            "lang": patient.preferred_lang if patient else "ta",
            "last_text": "",
        }
        CALLS[call_sid] = state
    return state


def _prompt(state: dict, digits: str) -> str:
    lang = state["lang"]
    patient = find_patient(patient_id=state["patient_id"]) if state["patient_id"] else None
    if patient is None:
        return "இந்த எண் பதிவில் இல்லை." if lang == "ta" else "This number is not on the clinic list."
    if not state["authed"]:
        if len(digits) == 4 and check_pin(patient, digits):
            state["authed"] = True
            state["last_text"] = insight_text(patient, "menu", lang)
            return state["last_text"]
        state["last_text"] = (
            "நான்கு இலக்க குடும்ப PIN ஐ அழுத்துங்கள்."
            if lang == "ta"
            else "Enter the 4 digit family PIN."
        )
        return state["last_text"]
    if digits == "*":
        return state["last_text"] or insight_text(patient, "menu", lang)
    if digits == "0":
        state["lang"] = "en" if lang == "ta" else "ta"
        lang = state["lang"]
        state["last_text"] = "English." if lang == "en" else "தமிழ்."
        return state["last_text"]
    if digits in {"1", "2", "3", "4", "5", "9"}:
        state["last_text"] = insight_text(patient, digits, lang)
        log_access(patient.id, digits, lang, "ivr")
        return state["last_text"]
    state["last_text"] = insight_text(patient, "menu", lang)
    return state["last_text"]


@router.api_route("/entry", methods=["GET", "POST"])
async def entry(request: Request, CallSid: str = "", From: str = "", format: str = ""):
    _check_token(request)
    form = await request.form() if request.method == "POST" else {}
    call_sid = CallSid or str(form.get("CallSid") or "")
    phone = From or str(form.get("From") or "")
    if not call_sid:
        call_sid = f"anon-{phone or 'unknown'}"
    state = _call(call_sid, phone)
    text = _prompt(state, "")
    if format == "json":
        return {"play": wav_url(text, state["lang"]), "gather_timeout_seconds": 10, "retries": 2}
    path = synthesize(text, state["lang"], codec="wav", sample_rate=8000)
    return FileResponse(path, media_type="audio/wav")


@router.api_route("/passthru", methods=["GET", "POST"])
async def passthru(request: Request):
    _check_token(request)
    form = await request.form() if request.method == "POST" else {}
    call_sid = str(form.get("CallSid") or request.query_params.get("CallSid") or "")
    phone = str(form.get("From") or request.query_params.get("From") or "")
    digits = str(form.get("digits") or request.query_params.get("digits") or "")
    state = _call(call_sid or f"anon-{phone}", phone)
    text = _prompt(state, (digits or "").strip())
    return PlainTextResponse(wav_url(text, state["lang"]))


@router.api_route("/status", methods=["GET", "POST"])
async def status(request: Request, CallSid: str = "", Status: str = ""):
    _check_token(request)
    form = await request.form() if request.method == "POST" else {}
    call_sid = CallSid or str(form.get("CallSid") or "")
    call_status = Status or str(form.get("Status") or form.get("CallStatus") or "")
    state = CALLS.get(call_sid, {})
    log_access(state.get("patient_id") or "unknown", call_status or "status", state.get("lang") or "ta", "ivr")
    return {"ok": True}
