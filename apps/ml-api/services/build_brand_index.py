"""Build an exact brand-to-salt index from the India medicines CSV.

Reads name, short_composition1, short_composition2, and Is_discontinued.
Skips discontinued products and any salt the formulary does not already check.
Does not copy the CSV into the repo.

Usage:
  .venv/bin/python apps/ml-api/services/build_brand_index.py /path/to/medicines.csv
"""

from __future__ import annotations

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FORMULARY = ROOT / "apps" / "web" / "src" / "lib" / "formulary.json"
OUT = Path(__file__).resolve().parent / "brand_index.json"

SPELL = {
    "amoxycillin": "amoxicillin",
    "thyroxine": "levothyroxine",
    "ferrous ascorbate": "ferrous",
    "ferrous sulphate": "ferrous",
    "ferrous sulfate": "ferrous",
    "ferrous fumarate": "ferrous",
    "calcium carbonate": "calcium",
    "acetylsalicylic acid": "aspirin",
    "folic acid": "folic",
}
SALT_RE = re.compile(r"([A-Za-z][A-Za-z \-]*?)\s*\(([^)]*)\)")
FORM_WORDS = re.compile(
    r"\b(tablet|tablets|capsule|capsules|syrup|injection|suspension|drops|drop|cream|ointment|gel|sachet|respules|kit)\b"
)


def _clean(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^a-z0-9 +\-]", " ", text)
    return re.sub(r"\s+", " ", text).strip(" -")


def _to_known_factory():
    data = json.loads(FORMULARY.read_text(encoding="utf-8"))
    aliases = {key.lower(): value for key, value in data["aliases"].items()}
    known = set(aliases.values())
    for pair in data["interactions"]:
        known.add(pair["a"])
        known.add(pair["b"])
    known.update(data["pregnancy_avoid"])
    for group in data.get("duplicate_classes", []):
        known.update(group["members"])

    def to_known(raw: str) -> str:
        key = _clean(raw)
        if key in SPELL and SPELL[key] in known:
            return SPELL[key]
        if key in aliases and aliases[key] in known:
            return aliases[key]
        if key in known:
            return key
        return ""

    return to_known


def _salts(composition: str, to_known) -> list[str]:
    found: list[str] = []
    for match in SALT_RE.finditer(composition or ""):
        salt = to_known(match.group(1))
        if salt and salt not in found:
            found.append(salt)
    return found


def _brand_key(name: str) -> str:
    text = _clean(name)
    head = re.split(r"\s+\d", text, maxsplit=1)[0]
    head = FORM_WORDS.sub(" ", head)
    return re.sub(r"\s+", " ", head).strip()


def build(csv_path: Path) -> dict[str, list[str]]:
    to_known = _to_known_factory()
    votes: dict[str, Counter] = {}
    for row in csv.DictReader(csv_path.open(newline="", encoding="utf-8")):
        if str(row.get("Is_discontinued", "")).strip().lower() == "true":
            continue
        composition = f"{row.get('short_composition1') or ''} + {row.get('short_composition2') or ''}"
        salts = _salts(composition, to_known)
        key = _brand_key(row.get("name") or "")
        if len(key) < 4 or not salts:
            continue
        votes.setdefault(key, Counter())[tuple(salts)] += 1
    index: dict[str, list[str]] = {}
    for key, counter in votes.items():
        winner, count = counter.most_common(1)[0]
        total = sum(counter.values())
        if count / total < 0.7:
            continue
        index[key] = list(winner)
    return dict(sorted(index.items()))


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Pass the medicines CSV path.")
    index = build(Path(sys.argv[1]))
    OUT.write_text(json.dumps(index, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
    combos = sum(1 for salts in index.values() if len(salts) > 1)
    print(f"brands {len(index)} combos {combos} bytes {OUT.stat().st_size}")


if __name__ == "__main__":
    main()
