"""Optional TwiML adapter for a local Twilio sandbox. Exotel is the India path."""

from __future__ import annotations

from fastapi import APIRouter, Form, Request
from fastapi.responses import Response

from services.dialpad_core import CALLS, check_pin, find_patient, insight_text, log_access

router = APIRouter(prefix="/ivr/twilio", tags=["ivr-twilio"])


def _xml(body: str) -> Response:
    return Response(f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>', media_type="application/xml")


@router.post("/entry")
def entry(CallSid: str = Form(default=""), From: str = Form(default="")):
    patient = find_patient(phone=From)
    CALLS[CallSid] = {
        "phone": From,
        "patient_id": patient.id if patient else "",
        "authed": False,
        "lang": "ta",
        "last_text": "",
    }
    say = "Enter your 4 digit PIN." if patient else "This number is not on the clinic list."
    return _xml(f"<Gather numDigits='4' timeout='10' action='/ivr/twilio/gather'><Say>{say}</Say></Gather>")


@router.post("/gather")
async def gather(request: Request, CallSid: str = Form(default=""), Digits: str = Form(default="")):
    state = CALLS.get(CallSid)
    if state is None:
        return _xml("<Say>Please call again.</Say>")
    patient = find_patient(patient_id=state["patient_id"]) if state["patient_id"] else None
    digits = Digits.strip()
    if patient and not state["authed"]:
        if len(digits) == 4 and check_pin(patient, digits):
            state["authed"] = True
            return _xml("<Gather numDigits='1' timeout='10' action='/ivr/twilio/gather'><Say>Press 1 for medicines, 2 for alerts, 5 for the next visit.</Say></Gather>")
        return _xml("<Gather numDigits='4' timeout='10' action='/ivr/twilio/gather'><Say>PIN did not match. Try again.</Say></Gather>")
    if patient is None:
        return _xml("<Say>This number is not on the clinic list.</Say>")
    if digits == "0":
        state["lang"] = "en" if state["lang"] == "ta" else "ta"
        return _xml("<Gather numDigits='1' timeout='10' action='/ivr/twilio/gather'><Say>Language switched.</Say></Gather>")
    text = insight_text(patient, digits if digits in {"1", "2", "3", "4", "5", "9"} else "menu", state["lang"])
    state["last_text"] = text
    if digits in {"1", "2", "3", "4", "5", "9"}:
        log_access(patient.id, digits, state["lang"], "ivr")
    safe = text.replace("&", "and").replace("<", "").replace(">", "")
    return _xml(f"<Say>{safe}</Say><Gather numDigits='1' timeout='10' action='/ivr/twilio/gather'><Say>Press another key.</Say></Gather>")
