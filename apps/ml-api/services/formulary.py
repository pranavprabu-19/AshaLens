"""Indian brand map, dose parse, and frequency shorthand. Stdlib only."""

from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DATA = json.loads((ROOT / "apps" / "web" / "src" / "lib" / "formulary.json").read_text(encoding="utf-8"))
ALIASES: dict[str, str] = {k.lower(): v for k, v in DATA["aliases"].items()}
FREQUENCIES: dict[str, str] = DATA["frequencies"]
INTERACTIONS: list[dict] = DATA["interactions"]
PREGNANCY_AVOID = set(DATA["pregnancy_avoid"])
DOSE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|iu)\b", re.I)
REVIEW_BELOW = 0.65


def canonical(name: str) -> tuple[str, float]:
    raw = name.strip().lower()
    raw = re.sub(r"[^a-z0-9 +\-]", "", raw)
    raw = re.sub(r"\s+", " ", raw).strip(" -")
    if raw in ALIASES:
        return ALIASES[raw], 0.95
    first = raw.split(" ")[0]
    if first in ALIASES:
        return ALIASES[first], 0.9
    contained = [key for key in ALIASES if len(key) >= 5 and key in raw]
    if contained:
        return ALIASES[max(contained, key=len)], 0.9
    best_key = ""
    best = 0.0
    for key in ALIASES:
        if abs(len(first) - len(key)) > 2:
            continue
        score = SequenceMatcher(None, first, key).ratio()
        if score > best:
            best = score
            best_key = key
    if best >= 0.92 and best_key:
        return ALIASES[best_key], 0.72
    return first or raw, 0.4


def parse_dose(text: str) -> str:
    match = DOSE_RE.search(text)
    if not match:
        return ""
    return f"{match.group(1)} {match.group(2).lower()}"


def parse_frequency(text: str) -> str:
    lower = text.lower()
    for pattern in ("1-1-1", "1-0-1", "1-0-0", "0-0-1", "0-1-0"):
        if pattern in FREQUENCIES and pattern in lower:
            return FREQUENCIES[pattern]
    for token, phrase in FREQUENCIES.items():
        if re.fullmatch(r"\d-\d-\d", token):
            continue
        if re.search(rf"\b{re.escape(token)}\b", lower):
            return phrase
    return ""


def grounded(drug: str, raw_text: str) -> bool:
    hay = raw_text.lower()
    if drug.lower() in hay:
        return True
    return any(alias in hay for alias, generic in ALIASES.items() if generic == drug and len(alias) > 3)


def review_item(drug_text: str, raw_text: str, dose_hint: str = "") -> dict:
    generic, score = canonical(drug_text)
    dose = parse_dose(dose_hint or drug_text) or parse_dose(raw_text)
    if dose:
        score = min(0.98, score + 0.05)
    if not grounded(generic, raw_text) and drug_text.lower() not in raw_text.lower():
        score = min(score, 0.45)
    return {
        "drug": drug_text.strip(),
        "generic": generic,
        "dose": dose or "unknown",
        "frequency": parse_frequency(dose_hint or drug_text) or parse_frequency(raw_text),
        "confidence": round(score, 2),
        "needs_review": score < REVIEW_BELOW,
        "source": "formulary",
    }


def interactions_for(generics: list[str], pregnant: bool = False) -> list[dict]:
    found = []
    keys = set(generics)
    for pair in INTERACTIONS:
        if pair["a"] in keys and pair["b"] in keys:
            found.append({"kind": "interaction", "en": pair["en"], "ta": pair["ta"]})
    counts: dict[str, int] = {}
    for name in generics:
        counts[name] = counts.get(name, 0) + 1
    for name, count in counts.items():
        if count > 1:
            found.append(
                {
                    "kind": "duplicate",
                    "en": f"Possible duplicate of {name}. Confirm before giving both.",
                    "ta": f"{name} இரண்டு முறை இருக்கலாம். இரண்டையும் கொடுக்கும் முன் உறுதி செய்யுங்கள்.",
                }
            )
    for group in DATA.get("duplicate_classes", []):
        present = [member for member in group["members"] if member in keys]
        if len(present) >= 2:
            found.append({"kind": "duplicate_class", "en": group["en"], "ta": group["ta"]})
    if pregnant:
        for name in keys:
            if name in PREGNANCY_AVOID:
                found.append({"kind": "pregnancy", "en": f"{name}: {DATA['pregnancy_note']['en']}", "ta": DATA["pregnancy_note"]["ta"]})
    return found
