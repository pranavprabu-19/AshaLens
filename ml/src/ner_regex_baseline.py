"""Regex NER baseline on synthetic prescription lines. DistilBERT comes next."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from features import repo_root

DRUGS = [
    "Ferrous sulphate",
    "Calcium carbonate",
    "Metformin",
    "Amlodipine",
    "Paracetamol",
    "Amoxicillin",
    "Ibuprofen",
    "Folic acid",
]

DOSE = re.compile(r"(\d+\s?(mg|g|ml))", re.I)


def extract(text: str) -> dict[str, str | None]:
    drug = next((d for d in DRUGS if d.lower() in text.lower()), None)
    dose_match = DOSE.search(text)
    return {
        "drug": drug,
        "dose": dose_match.group(0) if dose_match else None,
        "raw": text,
    }


def main() -> None:
    samples = [
        "Rx Ferrous sulphate 200 mg once daily",
        "Tab Metformin 500 mg BD",
        "Amlodipine 5mg HS",
        "Syp Paracetamol 250 ml",
        "Unknown herb powder morning",
    ]
    preds = [extract(s) for s in samples]
    out = repo_root() / "ml" / "models" / "ner_regex_preview.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(preds, indent=2), encoding="utf-8")
    print(json.dumps(preds, indent=2))
    print("This regex baseline is the 'before' for DistilBERT NER.")


if __name__ == "__main__":
    main()
