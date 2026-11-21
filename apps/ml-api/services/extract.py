"""Photo or typed line to confirmed-ready medicine suggestions. Not a diagnosis."""

from __future__ import annotations

import base64
import io
import json
import os
import re
import time
from pathlib import Path
from typing import Optional, Tuple

import joblib
from PIL import Image

from services.formulary import ALIASES, interactions_for, parse_dose, review_item

HERE = Path(__file__).resolve().parent
MODELS = HERE.parents[2] / "ml" / "models"
DEMO = json.loads((HERE / "demo_slips.json").read_text(encoding="utf-8"))

_quality = joblib.load(MODELS / "quality_gate.pkl") if (MODELS / "quality_gate.pkl").exists() else None
_doctype = joblib.load(MODELS / "document_type.pkl") if (MODELS / "document_type.pkl").exists() else None


def _features():
    import sys

    root = HERE.parents[2] / "ml" / "src"
    if str(root) not in sys.path:
        sys.path.append(str(root))
    from features import doctype_features, quality_features

    return quality_features, doctype_features


def image_labels(image: Image.Image) -> dict:
    quality_features, doctype_features = _features()
    out = {}
    if _quality is not None:
        out["quality"] = str(_quality.predict([quality_features(image)])[0])
    if _doctype is not None:
        out["doc_type"] = str(_doctype.predict([doctype_features(image)])[0])
    return out


def _gemini(image_bytes: bytes, mime: str) -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        return ""
    import httpx

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": (
                            "Read this clinic paper. Return only a plain text list of medicine lines "
                            "with dose and frequency. Do not diagnose and do not change doses."
                        )
                    },
                    {"inline_data": {"mime_type": mime, "data": base64.b64encode(image_bytes).decode()}},
                ]
            }
        ]
    }
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"
    response = httpx.post(url, json=payload, headers={"X-goog-api-key": key}, timeout=20.0)
    response.raise_for_status()
    body = response.json()
    candidates = body.get("candidates") or []
    if not candidates:
        return ""
    parts = ((candidates[0].get("content") or {}).get("parts")) or []
    return "\n".join(str(part.get("text") or "") for part in parts if isinstance(part, dict))


def _sarvam_vision(image_bytes: bytes) -> str:
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        return ""
    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=key)
    job = client.doc_ai.parse(file=[("slip.jpg", io.BytesIO(image_bytes), "image/jpeg")], language="en-IN")
    job_id = getattr(job, "job_id", None)
    if not job_id and isinstance(job, dict):
        job_id = job.get("job_id")
    if not job_id:
        return ""
    status = ""
    for _ in range(6):
        time.sleep(1)
        current = client.doc_ai.get_status(job_id)
        status = str(getattr(current, "status", "") or "")
        if status in {"completed", "partially_completed", "failed", "rejected"}:
            break
    if status not in {"completed", "partially_completed"}:
        return ""
    results = client.doc_ai.get_results(job_id)
    if hasattr(results, "model_dump"):
        payload = results.model_dump()
    elif hasattr(results, "dict"):
        payload = results.dict()
    else:
        payload = results
    if isinstance(payload, (dict, list)):
        return json.dumps(payload)
    return str(payload)


def read_paper(image_bytes: bytes, mime: str) -> Tuple[str, str]:
    if os.environ.get("GEMINI_API_KEY", "").strip():
        try:
            text = _gemini(image_bytes, mime)
            if text.strip():
                return text, "gemini"
        except Exception as exc:  # noqa: BLE001
            print("gemini vision:", type(exc).__name__)
    try:
        text = _sarvam_vision(image_bytes)
        if text.strip():
            return text, "sarvam-vision"
    except Exception as exc:  # noqa: BLE001
        print("sarvam vision:", type(exc).__name__)
    return "", "none"


def _vital_only(chunk: str) -> bool:
    if not re.search(r"\b(bp|hb|fbs|ppbs|platelets|ns1|weight|wt)\b", chunk, re.I):
        return False
    lowered = chunk.lower()
    return not any(len(key) >= 5 and key in lowered for key in ALIASES)


def checklist_from_slip(text: str) -> tuple[bool, list[dict]]:
    pregnant = bool(re.search(r"\banc\b|\d+\s*wks\b", text, re.I))
    alerts = []
    bp = re.search(r"\bBP:?\s*(\d{2,3})\s*/\s*(\d{2,3})", text, re.I)
    if pregnant and bp and int(bp.group(1)) >= 140:
        alerts.append(
            {
                "kind": "danger_sign",
                "en": (
                    f"Pregnancy blood pressure {bp.group(1)}/{bp.group(2)} is in the danger-sign range "
                    "on the NHM checklist. Arrange a doctor review today. This app does not diagnose pre-eclampsia."
                ),
                "ta": "கர்ப்ப கால இரத்த அழுத்தம் ஆபத்து அறிகுறி வரம்பில் உள்ளது. இன்று மருத்துவரை அணுகுங்கள். இது நோயறிதல் அல்ல.",
            }
        )
    hb = re.search(r"\bHb:?\s*(\d+(?:\.\d+)?)", text, re.I)
    if hb and float(hb.group(1)) < 7:
        alerts.append(
            {
                "kind": "danger_sign",
                "en": (
                    f"Haemoglobin {hb.group(1)} g/dL is in the severe-anaemia range used for referral checklists. "
                    "Confirm with a lab and the doctor. Not a diagnosis."
                ),
                "ta": "ஹீமோகுளோபின் மிகவும் குறைவு. ஆய்வகம் மற்றும் மருத்துவரிடம் உறுதி செய்யுங்கள். இது நோயறிதல் அல்ல.",
            }
        )
    fbs = re.search(r"\bFBS:?\s*(\d+)", text, re.I)
    ppbs = re.search(r"\bPPBS:?\s*(\d+)", text, re.I)
    high_sugar = (fbs is not None and int(fbs.group(1)) >= 126) or (ppbs is not None and int(ppbs.group(1)) >= 140)
    lowered = text.lower()
    if high_sugar and ("insulin" in lowered or "mixtard" in lowered):
        alerts.append(
            {
                "kind": "high_risk",
                "en": "ANC slip lists high sugar readings and insulin. Weekly PHC follow-up. Not a diagnosis.",
                "ta": "அதிக சர்க்கரை அளவும் இன்சுலினும் உள்ளன. வாரந்தோறும் ஆரம்ப சுகாதார நிலையத்தில் பின்தொடரவும். இது நோயறிதல் அல்ல.",
            }
        )
    return pregnant, alerts


def vitals_from_text(text: str) -> list[dict]:
    """Structured lab or MCP numbers. A weak match stays under 0.65 so it is not saved."""
    doc_type = "mcp_card" if re.search(r"\bmcp\b|\banc\b", text, re.I) else "lab_slip"
    rows: list[dict] = []
    bp = re.search(r"\bBP:?\s*(\d{2,3})\s*/\s*(\d{2,3})", text, re.I)
    if bp:
        systolic = int(bp.group(1))
        diastolic = int(bp.group(2))
        plausible = 70 <= systolic <= 250 and 40 <= diastolic <= 150 and systolic > diastolic
        rows.append(
            {
                "field": "bp",
                "label": f"BP {systolic}/{diastolic}",
                "bpSystolic": systolic,
                "bpDiastolic": diastolic,
                "confidence": 0.92 if plausible else 0.4,
                "doc_type": doc_type,
            }
        )
    hb = re.search(r"\bHb:?\s*(\d+(?:\.\d+)?)", text, re.I)
    if hb:
        value = float(hb.group(1))
        rows.append(
            {
                "field": "hb",
                "label": f"Hb {value:g} g/dL",
                "hemoglobin": value,
                "confidence": 0.92 if 3 <= value <= 20 else 0.4,
                "doc_type": doc_type,
            }
        )
    weight = re.search(r"\b(?:weight|wt)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kg)?\b", text, re.I)
    if weight:
        kilos = float(weight.group(1))
        rows.append(
            {
                "field": "weight",
                "label": f"Weight {kilos:g} kg",
                "weightKg": kilos,
                "confidence": 0.92 if 2 <= kilos <= 180 else 0.4,
                "doc_type": doc_type,
            }
        )
    return rows


def items_from_text(text: str) -> list[dict]:
    items = []
    chunks = re.split(r"[\n;]+", text)
    for chunk in chunks:
        if _vital_only(chunk):
            continue
        if parse_dose(chunk) == "" and not re.search(r"[A-Za-z]{4,}", chunk):
            continue
        name = re.sub(r"\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu)\b", " ", chunk, flags=re.I)
        name = re.sub(r"\b(tab|cap|syp|inj|rx|od|bd|tds|hs|sos|ac|pc)\b", " ", name, flags=re.I)
        name = re.sub(r"\b[01]-[01]-[01]\b", " ", name)
        name = re.sub(r"\s+", " ", name).strip(" -:.,")
        if len(name) < 3:
            continue
        item = review_item(name, text, chunk)
        item["source"] = "text"
        items.append(item)
    return items


def _pdf_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception as exc:  # noqa: BLE001
        print("pdf text:", type(exc).__name__)
        return ""


def extract_document(
    image_bytes: Optional[bytes],
    text: str,
    mime: str = "image/jpeg",
    pregnant: bool = False,
) -> dict:
    labels = {}
    source = "text" if text.strip() else "none"
    is_pdf = bool(image_bytes) and (mime == "application/pdf" or image_bytes[:5] == b"%PDF-")
    if is_pdf and image_bytes is not None:
        extracted = _pdf_text(image_bytes)
        text = extracted or text
        source = "pdf" if text.strip() else "none"
    elif image_bytes:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        labels = image_labels(image)
        if not text.strip():
            text, source = read_paper(image_bytes, mime)
    cached = next((slip for slip in DEMO if slip["text"].strip().lower() == text.strip().lower()), None)
    if cached:
        source = "demo-cache"
    items = items_from_text(text)
    slip_pregnant, vital_alerts = checklist_from_slip(text)
    confident = [
        salt
        for item in items
        if item["confidence"] >= 0.65
        for salt in (item.get("generics") or [item["generic"]])
    ]
    alerts = interactions_for(confident, pregnant=pregnant or slip_pregnant) + vital_alerts
    return {
        "quality": labels.get("quality"),
        "doc_type": labels.get("doc_type"),
        "raw_text": text,
        "source": source,
        "items": items,
        "vitals": vitals_from_text(text),
        "alerts": alerts,
        "disclaimer": "Suggestions only. A person must confirm every field. Not a diagnosis.",
    }
