"""TwiML adapter. Exotel is the India path. Clinical copy stays in dialpad_core."""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import Response

from services.dialpad_core import CALLS, check_pin, find_patient, insight_text, log_access, public_base, wav_url

router = APIRouter(prefix="/ivr/twilio", tags=["ivr-twilio"])
alias_router = APIRouter(prefix="/ivr", tags=["ivr"])

EMERGENCY_EN = "If this is an emergency, hang up and dial 108."
EMERGENCY_TA = "அவசரமாக இருந்தால், இந்த அழைப்பை நிறுத்தி 108 ஐ நீங்களே அழையுங்கள்."
UNKNOWN = "This number is not on the clinic list."


def _xml(body: str) -> Response:
    return Response(
        f'<?xml version="1.0" encoding="UTF-8"?><Response>{body}</Response>',
        media_type="application/xml",
    )


def _say(text: str) -> str:
    safe = text.replace("&", "and").replace("<", "").replace(">", "")
    return f"<Say>{safe}</Say>"


def _speech(text: str, lang: str) -> str:
    try:
        url = wav_url(text, lang).replace("&", "&amp;")
        return f"<Play>{url}</Play>"
    except Exception:  # noqa: BLE001
        return _say(text)


def _gather(num_digits: int, inner: str) -> str:
    action = f"{public_base()}/ivr/menu"
    return f"<Gather numDigits='{num_digits}' timeout='10' action='{action}'>{inner}</Gather>"


def _call(call_sid: str, phone: str) -> dict:
    patient = find_patient(phone=phone)
    state = {
        "phone": phone,
        "patient_id": patient.id if patient else "",
        "authed": False,
        "lang": patient.preferred_lang if patient else "en",
        "last_text": "",
        "timeouts": 0,
    }
    CALLS[call_sid] = state
    return state


def _pin_prompt(lang: str) -> str:
    pin = "நான்கு இலக்க குடும்ப PIN ஐ அழுத்துங்கள்." if lang == "ta" else "Enter your 4 digit family PIN."
    local = f"{EMERGENCY_TA} " if lang == "ta" else ""
    return f"{EMERGENCY_EN} {local}{pin}"


def _goodbye(lang: str) -> str:
    if lang == "ta":
        return "விசை அழுத்தப்படவில்லை. நன்றி."
    return "No key was pressed. Goodbye."


def _welcome_body(call_sid: str, phone: str) -> str:
    state = _call(call_sid or f"anon-{phone or 'unknown'}", phone)
    patient = find_patient(patient_id=state["patient_id"]) if state["patient_id"] else None
    if patient is None:
        return _speech(UNKNOWN, "en") + "<Hangup/>"
    text = _pin_prompt(state["lang"])
    state["last_text"] = text
    return _gather(4, _speech(text, state["lang"]))


def _menu_body(call_sid: str, digits: str) -> str:
    state = CALLS.get(call_sid)
    if state is None:
        return _say("Please call again.") + "<Hangup/>"
    lang = state["lang"]
    patient = find_patient(patient_id=state["patient_id"]) if state["patient_id"] else None
    if patient is None:
        return _speech(UNKNOWN, "en") + "<Hangup/>"
    pressed = (digits or "").strip()
    if not pressed:
        state["timeouts"] = int(state.get("timeouts") or 0) + 1
        if state["timeouts"] >= 2:
            return _speech(_goodbye(lang), lang) + "<Hangup/>"
        if not state["authed"]:
            text = _pin_prompt(lang)
            state["last_text"] = text
            return _gather(4, _speech(text, lang))
        text = state["last_text"] or insight_text(patient, "menu", lang)
        state["last_text"] = text
        return _gather(1, _speech(text, lang))
    state["timeouts"] = 0
    if not state["authed"]:
        if len(pressed) == 4 and check_pin(patient, pressed):
            state["authed"] = True
            text = insight_text(patient, "menu", lang)
            state["last_text"] = text
            return _gather(1, _speech(text, lang))
        text = "PIN பொருந்தவில்லை. மீண்டும் அழுத்துங்கள்." if lang == "ta" else "PIN did not match. Try again."
        state["last_text"] = text
        return _gather(4, _speech(text, lang))
    if pressed == "*":
        text = state["last_text"] or insight_text(patient, "menu", lang)
        return _gather(1, _speech(text, lang))
    if pressed == "0":
        state["lang"] = "en" if lang == "ta" else "ta"
        lang = state["lang"]
        text = "English." if lang == "en" else "தமிழ்."
        state["last_text"] = text
        return _gather(1, _speech(text, lang))
    if pressed in {"1", "2", "3", "4", "5", "9"}:
        text = insight_text(patient, pressed, lang)
        state["last_text"] = text
        log_access(patient.id, pressed, lang, "ivr")
        return _gather(1, _speech(text, lang))
    text = insight_text(patient, "menu", lang)
    state["last_text"] = text
    return _gather(1, _speech(text, lang))


async def _fields(request: Request) -> dict:
    form = await request.form() if request.method == "POST" else {}
    params = request.query_params

    def pick(*names: str) -> str:
        for name in names:
            if form.get(name):
                return str(form.get(name))
            if params.get(name):
                return str(params.get(name))
        return ""

    return {"call_sid": pick("CallSid", "CallSid"), "phone": pick("From", "from"), "digits": pick("Digits", "digits")}


@router.api_route("/entry", methods=["GET", "POST"])
@alias_router.api_route("/welcome", methods=["GET", "POST"])
async def entry(request: Request):
    fields = await _fields(request)
    return _xml(_welcome_body(fields["call_sid"], fields["phone"]))


@router.api_route("/gather", methods=["GET", "POST"])
@alias_router.api_route("/menu", methods=["GET", "POST"])
async def gather(request: Request):
    fields = await _fields(request)
    return _xml(_menu_body(fields["call_sid"], fields["digits"]))
