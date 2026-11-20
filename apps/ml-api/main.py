from __future__ import annotations

import base64
import io
import json
import os
import sys
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.append(str(ROOT / "ml" / "src"))

from features import doctype_features, quality_features, to_array  # noqa: E402
from ner_regex_baseline import extract as regex_extract  # noqa: E402
from routers.dialpad_pwa import router as dialpad_router  # noqa: E402
from routers.ivr_exotel import router as exotel_router  # noqa: E402
from routers.ivr_twilio import router as twilio_router  # noqa: E402

app = FastAPI(
    title="AshaLens ML API",
    version="0.2.0",
    description="Inference for trained AshaLens models. Not a medical device.",
)
app.include_router(dialpad_router)
app.include_router(exotel_router)
app.include_router(twilio_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS = ROOT / "ml" / "models"
quality_model = None
type_model = None
ner_model = None
ranker_bundle = None

try:
    import joblib

    if (MODELS / "quality_gate.pkl").exists():
        quality_model = joblib.load(MODELS / "quality_gate.pkl")
    if (MODELS / "document_type.pkl").exists():
        type_model = joblib.load(MODELS / "document_type.pkl")
    if (MODELS / "ner_logreg.pkl").exists():
        ner_model = joblib.load(MODELS / "ner_logreg.pkl")
    if (MODELS / "followup_rf.pkl").exists():
        ranker_bundle = joblib.load(MODELS / "followup_rf.pkl")
except Exception as exc:  # noqa: BLE001
    print("pickle load:", exc)


class RankRow(BaseModel):
    days_overdue: float
    pregnant: float
    gestational_week: float
    high_bp: float
    duplicate_meds: float
    interaction: float
    anemia: float
    danger_sign: float
    age: float


class RankBody(BaseModel):
    rows: list[RankRow]


class NerBody(BaseModel):
    text: str


class ExplainBody(BaseModel):
    drug: str
    confirmed: bool = False


class ImageB64(BaseModel):
    image_base64: str


TEMPLATES = {
    "ferrous": (
        "This is an iron tablet for blood. Take after food. Do not take with milk or calcium at the same time.",
        "இது இரத்தத்திற்கான இரும்பு மாத்திரை. உணவிற்கு பின் எடுங்கள்.",
    ),
    "metformin": (
        "This is a diabetes tablet. Take with food. Do not skip meals.",
        "இது நீரிழிவு மாத்திரை. உணவுடன் எடுங்கள்.",
    ),
}


def decode_image(raw: bytes) -> Image.Image:
    return Image.open(io.BytesIO(raw)).convert("RGB")


def predict_image_pil(image: Image.Image) -> dict:
    result = {"disclaimer": "Human must confirm. Not a diagnosis."}
    if quality_model is not None:
        result["quality"] = str(quality_model.predict([quality_features(image)])[0])
    if type_model is not None:
        result["doc_type"] = str(type_model.predict([doctype_features(image)])[0])
    return result


@app.get("/health")
def health():
    return {
        "ok": True,
        "quality_model": quality_model is not None,
        "document_type_model": type_model is not None,
        "ner_model": ner_model is not None,
        "ranker_model": ranker_bundle is not None,
        "disclaimer": "Not a medical device. Synthetic demo only.",
    }


@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    image = decode_image(await file.read())
    return predict_image_pil(image)


@app.post("/predict/image-b64")
def predict_image_b64(body: ImageB64):
    raw = body.image_base64.split(",")[-1]
    image = decode_image(base64.b64decode(raw))
    return predict_image_pil(image)


@app.post("/predict/ner")
def predict_ner(body: NerBody):
    regex = regex_extract(body.text)
    tokens = body.text.split()
    entities = []
    if ner_model is not None:
        from train_ner import token_feat

        labels = ner_model.predict([token_feat(tokens, i) for i in range(len(tokens))])
        i = 0
        while i < len(tokens):
            lab = labels[i]
            if str(lab).startswith("B-"):
                kind = str(lab)[2:]
                span = [tokens[i]]
                i += 1
                while i < len(tokens) and str(labels[i]) == f"I-{kind}":
                    span.append(tokens[i])
                    i += 1
                entities.append({"label": kind, "text": " ".join(span), "confirmed": False})
                continue
            i += 1
    return {
        "regex": regex,
        "entities": entities,
        "disclaimer": "Suggestions only. A person must confirm before saving.",
    }


@app.post("/predict/rank")
def predict_rank(body: RankBody):
    if ranker_bundle is None:
        return {"scores": [], "note": "Ranker not trained yet."}
    clf = ranker_bundle["model"]
    feats = ranker_bundle["features"]
    import numpy as np

    x = np.array([[getattr(row, f) for f in feats] for row in body.rows], dtype=float)
    labels = clf.predict(x)
    proba = clf.predict_proba(x)
    importances = ranker_bundle.get("importances") or []
    reasons = []
    for row in body.rows:
        scored = []
        for feature, weight in zip(feats, importances):
            value = float(getattr(row, feature))
            concerning = value > 0
            if feature == "days_overdue":
                concerning = value > 14
            elif feature == "gestational_week":
                concerning = value >= 28
            elif feature == "age":
                concerning = value >= 35
            if not concerning:
                continue
            scored.append((float(weight), feature.replace("_", " ")))
        scored.sort(reverse=True)
        reasons.append([name for _, name in scored[:3]])
    return {
        "labels": [str(v) for v in labels],
        "proba": proba.tolist(),
        "classes": [str(c) for c in clf.classes_],
        "reasons": reasons,
        "model": ranker_bundle.get("name", "random_forest"),
        "disclaimer": "Priority score, not a diagnosis.",
    }


@app.post("/explain")
def explain(body: ExplainBody):
    if not body.confirmed:
        return {"error": "Refuse to explain unconfirmed extraction.", "en": "", "ta": "", "audio_url": None}
    key = body.drug.strip().lower().split()[0]
    en, ta = TEMPLATES.get(
        key,
        (
            f"{body.drug}: ask the doctor what this tablet is for. This app does not diagnose.",
            f"{body.drug}: இது எதற்கு என்று மருத்துவரிடம் கேளுங்கள்.",
        ),
    )
    source = "template"
    api_key = os.environ.get("SARVAM_API_KEY", "").strip()
    if api_key:
        try:
            from sarvamai import SarvamAI

            client = SarvamAI(api_subscription_key=api_key)
            reply = client.chat.completions(
                model="sarvam-105b-conversations",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You explain a confirmed medicine in simple English and Tamil. "
                            "Never diagnose. Never change the dose. Never add a new medicine. "
                            "Reply exactly as two lines: EN: ... then TA: ..."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "drug": body.drug,
                                "english_template": en,
                                "tamil_template": ta,
                            }
                        ),
                    },
                ],
            )
            text = reply.choices[0].message.content or ""
            en_line = next((line[3:].strip() for line in text.splitlines() if line.upper().startswith("EN:")), "")
            ta_line = next((line[3:].strip() for line in text.splitlines() if line.upper().startswith("TA:")), "")
            if en_line and ta_line:
                en, ta = en_line, ta_line
                source = "sarvam-105b-conversations"
        except Exception as exc:  # noqa: BLE001
            print("explain llm:", type(exc).__name__)
    audio_url = None
    try:
        from services.tts_sarvam import synthesize

        path = synthesize(ta, "ta", codec="mp3", sample_rate=22050)
        base = os.environ.get("PUBLIC_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        audio_url = f"{base}/dialpad/audio/{path.name}"
    except Exception as exc:  # noqa: BLE001
        print("explain audio:", type(exc).__name__)
    return {
        "en": en,
        "ta": ta,
        "source": source,
        "audio_url": audio_url,
        "disclaimer": "Explanation after human confirm only. Never a diagnosis.",
    }


@app.post("/extract")
async def extract_endpoint(
    file: Optional[UploadFile] = File(default=None),
    text: str = Form(default=""),
    pregnant: bool = Form(default=False),
):
    from services.extract import extract_document

    raw = await file.read() if file is not None else None
    mime = file.content_type if file is not None and file.content_type else "image/jpeg"
    return extract_document(raw, text, mime, pregnant)
