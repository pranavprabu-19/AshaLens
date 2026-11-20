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
