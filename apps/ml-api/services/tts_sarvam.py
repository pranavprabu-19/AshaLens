"""Cache Sarvam Bulbul audio. MP3 for the PWA, 8000 Hz WAV for Exotel."""

from __future__ import annotations

import base64
import hashlib
import os
from pathlib import Path

CACHE = Path(__file__).resolve().parents[1] / ".audio_cache"
MODEL = "bulbul:v4-flash"
SPEAKERS = {"ta": "vijay_ta_narration", "en": "dev_en_conversational"}


def _cache_path(text: str, lang: str, codec: str, sample_rate: int) -> Path:
    digest = hashlib.sha256(f"{MODEL}|{lang}|{codec}|{sample_rate}|{text}".encode()).hexdigest()[:24]
    return CACHE / f"{digest}.{codec}"


def _bhashini_audio(text: str) -> bytes:
    import httpx

    key = os.environ.get("BHASHINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("BHASHINI_API_KEY is missing")
    response = httpx.post(
        "https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        headers={"Authorization": key, "Content-Type": "application/json"},
        json={
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": "ta"},
                        "serviceId": os.environ.get("BHASHINI_TTS_SERVICE_ID", ""),
                        "gender": "female",
                    },
                }
            ],
            "inputData": {"input": [{"source": text[:500]}]},
        },
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    content = payload["pipelineResponse"][0]["audio"][0]["audioContent"]
    return base64.b64decode(content)


def synthesize_tamil(text: str) -> Path:
    """Tamil speech for the explain route. Bhashini when configured, otherwise Sarvam."""
    if os.environ.get("BHASHINI_API_KEY", "").strip():
        try:
            audio = _bhashini_audio(text)
            digest = hashlib.sha256(f"bhashini|ta|{text}".encode()).hexdigest()[:24]
            path = CACHE / f"{digest}.mp3"
            CACHE.mkdir(parents=True, exist_ok=True)
            path.write_bytes(audio)
            return path
        except Exception as exc:  # noqa: BLE001
            print("bhashini tts:", type(exc).__name__)
    return synthesize(text, "ta", codec="mp3", sample_rate=22050)


def synthesize(text: str, lang: str, codec: str = "mp3", sample_rate: int = 22050) -> Path:
    lang = "ta" if lang == "ta" else "en"
    codec = "wav" if codec == "wav" else "mp3"
    path = _cache_path(text, lang, codec, sample_rate)
    if path.exists() and path.stat().st_size > 0:
        return path
    key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("SARVAM_API_KEY is missing")
    from sarvamai import SarvamAI

    client = SarvamAI(api_subscription_key=key)
    response = client.text_to_speech.convert(
        text=text[:2500],
        language_code="ta-IN" if lang == "ta" else "en-IN",
        model=MODEL,
        speaker=SPEAKERS[lang],
        pace=0.9,
        speech_sample_rate=sample_rate,
        output_audio_codec=codec,
    )
    audio = base64.b64decode(response.audios[0])
    CACHE.mkdir(parents=True, exist_ok=True)
    path.write_bytes(audio)
    return path
