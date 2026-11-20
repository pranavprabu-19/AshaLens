"""Read-only dial-pad copy for confirmed synthetic records. Not a diagnosis."""

from __future__ import annotations

import hashlib
import hmac
import os
import time
from dataclasses import dataclass, field
from typing import Optional

DISCLAIMER_EN = "Please confirm with your PHC doctor or ASHA worker."
DISCLAIMER_TA = "தயவு செய்து உங்கள் ஆரம்ப சுகாதார நிலைய மருத்துவர் அல்லது ஆஷா பணியாளரிடம் உறுதி செய்யுங்கள்."


def _pepper() -> str:
    return os.environ.get("DIALPAD_PIN_PEPPER", "ashalens-demo")


def hash_pin(pin: str) -> str:
    return hashlib.sha256(f"{_pepper()}:{pin}".encode()).hexdigest()


def _secret() -> bytes:
    return os.environ.get("DIALPAD_TOKEN_SECRET", "ashalens-dialpad-demo").encode()


@dataclass
class Medicine:
    name: str
    dose: str
    frequency: str
    confirmed: bool = True


@dataclass
class Patient:
    id: str
    name: str
    phone: str
    short_code: str
    pin_hash: str
    asha_name: str
    pregnant: bool
    medicines: list[Medicine]
    bp: str
    haemoglobin: str
    next_visit: str
    alerts_en: list[str] = field(default_factory=list)
    alerts_ta: list[str] = field(default_factory=list)
    pregnancy_en: str = ""
    pregnancy_ta: str = ""
    preferred_lang: str = "ta"


def _roster() -> list[Patient]:
    pin = hash_pin("1234")
    return [
        Patient(
            id="p-lakshmi",
            name="Lakshmi",
            phone="9000011101",
            short_code="1001",
            pin_hash=pin,
            asha_name="Meena",
            pregnant=True,
            medicines=[
                Medicine("Ferrous sulphate", "200 mg", "once daily after food"),
                Medicine("Calcium carbonate", "500 mg", "once daily, 2 hours apart from iron"),
                Medicine("Folic acid", "5 mg", "once daily"),
            ],
            bp="148/94",
            haemoglobin="9.1",
            next_visit="10 August 2026",
            alerts_en=["Take iron and calcium at least 2 hours apart."],
            alerts_ta=["இரும்பு மற்றும் கால்சியம் மாத்திரைகளை குறைந்தது 2 மணி நேரம் இடைவெளியில் எடுங்கள்."],
            pregnancy_en="Blood pressure 148/94 is on the pregnancy danger-sign checklist. Next ANC was due 10 August 2026. Watch for bleeding, severe headache, or swelling.",
            pregnancy_ta="கர்ப்ப இரத்த அழுத்தம் 148/94 ஆபத்து பட்டியலில் உள்ளது. அடுத்த பரிசோதனை 10 ஆகஸ்ட் 2026. இரத்தப்போக்கு, கடும் தலைவலி, அல்லது வீக்கம் இருந்தால் உடனே செல்லுங்கள்.",
        ),
        Patient(
            id="p-murugan",
            name="Murugan",
            phone="9000011102",
            short_code="1002",
            pin_hash=pin,
            asha_name="Meena",
            pregnant=False,
            medicines=[
                Medicine("Metformin", "500 mg", "twice daily with food"),
                Medicine("Amlodipine", "5 mg", "once daily"),
                Medicine("Ibuprofen", "400 mg", "as needed"),
            ],
            bp="142/88",
            haemoglobin="not recorded",
            next_visit="2 September 2026",
            alerts_en=[
                "Ibuprofen can reduce the effect of amlodipine. Show this to the doctor.",
                "Ibuprofen with metformin needs a kidney check. This is not a diagnosis.",
            ],
            alerts_ta=[
                "இபுபுரூஃபன் அம்லோடிபின் விளைவை குறைக்கலாம். மருத்துவரிடம் காட்டுங்கள்.",
                "மெட்ஃபார்மினுடன் இபுபுரூஃபன் சிறுநீரக பரிசோதனை தேவை. இது நோய் கண்டறிதல் அல்ல.",
            ],
        ),
    ]


ROSTER = _roster()
CALLS: dict[str, dict] = {}
LOGS: list[dict] = []


def _digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


def find_patient(phone: str = "", short_code: str = "", patient_id: str = "") -> Optional[Patient]:
    phone = _digits(phone)
    for patient in ROSTER:
        if patient_id and patient.id == patient_id:
            return patient
        if short_code and patient.short_code == short_code.strip():
            return patient
        if phone and patient.phone == phone[-10:]:
            return patient
    return None


def check_pin(patient: Patient, pin: str) -> bool:
    return hmac.compare_digest(patient.pin_hash, hash_pin(pin.strip()))


def issue_token(patient_id: str, ttl_seconds: int = 900) -> str:
    exp = int(time.time()) + ttl_seconds
    payload = f"{patient_id}.{exp}"
    sig = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def patient_from_token(token: str) -> Optional[Patient]:
    parts = token.split(".")
    if len(parts) != 3:
        return None
    patient_id, exp, sig = parts
    payload = f"{patient_id}.{exp}"
    expected = hmac.new(_secret(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return None
    if int(exp) < int(time.time()):
        return None
    return find_patient(patient_id=patient_id)


def _meds(patient: Patient, lang: str) -> str:
    lines = []
    for index, med in enumerate(patient.medicines, start=1):
        if not med.confirmed:
            continue
        if lang == "ta":
            lines.append(f"{index}. {med.name}, {med.dose}, {med.frequency}.")
        else:
            lines.append(f"{index}. {med.name}, {med.dose}, {med.frequency}.")
    if not lines:
        return "உறுதி செய்யப்பட்ட மருந்து இல்லை." if lang == "ta" else "No confirmed medicines."
    return " ".join(lines)


def insight_text(patient: Patient, menu: str, lang: str) -> str:
    lang = "ta" if lang == "ta" else "en"
    if menu == "1":
        body = _meds(patient, lang)
        title = "இன்றைய மருந்துகள்." if lang == "ta" else "Today's medicines."
    elif menu == "2":
        alerts = patient.alerts_ta if lang == "ta" else patient.alerts_en
        body = " ".join(alerts) if alerts else ("எச்சரிக்கை இல்லை." if lang == "ta" else "No active safety alerts.")
        title = "பாதுகாப்பு எச்சரிக்கை." if lang == "ta" else "Safety alerts."
    elif menu == "3":
        if lang == "ta":
            body = f"இரத்த அழுத்தம் {patient.bp}. ஹீமோகுளோபின் {patient.haemoglobin}. இது நிலை விளக்கம் மட்டுமே."
        else:
            body = f"Blood pressure {patient.bp}. Haemoglobin {patient.haemoglobin}. This is a status reading only."
        title = "பரிசோதனை சுருக்கம்." if lang == "ta" else "Lab and vitals."
    elif menu == "4":
        if not patient.pregnant:
            body = "கர்ப்ப பதிவு இல்லை." if lang == "ta" else "No pregnancy record on this chart."
        else:
            body = patient.pregnancy_ta if lang == "ta" else patient.pregnancy_en
        title = "கர்ப்ப குறிப்பு." if lang == "ta" else "Pregnancy and MCP."
    elif menu == "5":
        if lang == "ta":
            body = f"அடுத்த வருகை {patient.next_visit}. ஆஷா {patient.asha_name}."
        else:
            body = f"Next visit {patient.next_visit}. ASHA worker {patient.asha_name}."
        title = "அடுத்த வருகை." if lang == "ta" else "Next visit."
    elif menu == "9":
        LOGS.append({"patient_id": patient.id, "menu": "9", "kind": "asha_callback"})
        if lang == "ta":
            body = f"ஆஷா {patient.asha_name} தொடர்பு கோரிக்கை பதிவாகியது. அவசரமாக இருந்தால் 108 ஐ நேரடியாக அழையுங்கள்."
        else:
            body = f"A callback request for ASHA {patient.asha_name} is logged. In an emergency, hang up and dial 108 yourself."
        title = "ஆஷா தொடர்பு." if lang == "ta" else "ASHA contact."
    else:
        title = "மெனு." if lang == "ta" else "Menu."
        body = "1 மருந்து, 2 எச்சரிக்கை, 3 பரிசோதனை, 4 கர்ப்பம், 5 வருகை, 0 மொழி, 9 ஆஷா." if lang == "ta" else "Press 1 for medicines, 2 for alerts, 3 for labs, 4 for pregnancy, 5 for the next visit, 0 for language, 9 for ASHA."
    tail = DISCLAIMER_TA if lang == "ta" else DISCLAIMER_EN
    return f"{title} {body} {tail}"


def log_access(patient_id: str, menu: str, lang: str, source: str) -> None:
    LOGS.append(
        {
            "patient_id": patient_id,
            "menu_key": menu,
            "lang": lang,
            "source": source,
            "at": int(time.time()),
        }
    )
