"""Photo or typed line to confirmed-ready medicine suggestions. Not a diagnosis."""

from __future__ import annotations

import base64
import io
import json
import os
import re
import time
from pathlib import Path

import joblib
from PIL import Image

from services.formulary import interactions_for, parse_dose, review_item

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
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    response = httpx.post(url, json=payload, timeout=25)
    response.raise_for_status()
    parts = response.json()["candidates"][0]["content"]["parts"]
    return "\n".join(part.get("text", "") for part in parts)


def _sarvam_vision(image_bytes: bytes) -> str:
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        return ""
    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=key)
    job = client.doc_ai.parse(file=[("slip.jpg", io.BytesIO(image_bytes), "image/jpeg")], language="en-IN")
    job_id = getattr(job, "job_id", None) or job.get("job_id")
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
    return json.dumps(results.dict() if hasattr(results, "dict") else results)


def read_paper(image_bytes: bytes, mime: str) -> tuple[str, str]:
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


def items_from_text(text: str) -> list[dict]:
    items = []
    chunks = re.split(r"[\n;]+", text)
    for chunk in chunks:
        if parse_dose(chunk) == "" and not re.search(r"[A-Za-z]{4,}", chunk):
            continue
        name = re.sub(r"\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu)\b", " ", chunk, flags=re.I)
        name = re.sub(r"\b(tab|cap|syp|rx|od|bd|tds|hs|sos|ac|pc)\b", " ", name, flags=re.I)
        name = re.sub(r"\b[01]-[01]-[01]\b", " ", name)
        name = re.sub(r"\s+", " ", name).strip(" -:.,")
        if len(name) < 3:
            continue
        item = review_item(name, text, chunk)
        item["source"] = "text"
        items.append(item)
    return items


def extract_document(image_bytes: bytes | None, text: str, mime: str = "image/jpeg", pregnant: bool = False) -> dict:
    labels = {}
    source = "text" if text.strip() else "none"
    if image_bytes:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        labels = image_labels(image)
        if not text.strip():
            text, source = read_paper(image_bytes, mime)
    cached = next((slip for slip in DEMO if slip["text"].strip().lower() == text.strip().lower()), None)
    if cached:
        source = "demo-cache"
    items = items_from_text(text)
    return {
        "quality": labels.get("quality"),
        "doc_type": labels.get("doc_type"),
        "raw_text": text,
        "source": source,
        "items": items,
        "alerts": interactions_for([item["generic"] for item in items], pregnant=pregnant),
        "disclaimer": "Suggestions only. A person must confirm every field. Not a diagnosis.",
    }
