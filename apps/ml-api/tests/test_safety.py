"""Safety rules and the offline extract path. No cloud calls."""

from __future__ import annotations

import json
from pathlib import Path

from services.extract import extract_document
from services.formulary import INTERACTIONS, canonical, interactions_for, parse_dose, review_item

ROOT = Path(__file__).resolve().parents[3]
FORMULARY = ROOT / "apps" / "web" / "src" / "lib" / "formulary.json"
SLIPS = json.loads((Path(__file__).resolve().parents[1] / "services" / "demo_slips.json").read_text(encoding="utf-8"))


def test_brand_map_covers_common_duplicates():
    assert len(json.loads(FORMULARY.read_text(encoding="utf-8"))["aliases"]) >= 60
    assert canonical("Dolo-650")[0] == "paracetamol"
    assert canonical("Crocin")[0] == "paracetamol"
    assert canonical("Calpol")[0] == "paracetamol"
    assert canonical("Glycomet")[0] == "metformin"
    assert canonical("Shelcal")[0] == "calcium"
    assert canonical("Stamlo")[0] == "amlodipine"
    assert canonical("Brufen")[0] == "ibuprofen"


def test_dose_and_frequency_shorthand():
    item = review_item("Dolo", "Tab Dolo 650 mg 1-0-1", "Tab Dolo 650 mg 1-0-1")
    assert parse_dose("650 mg") == "650 mg"
    assert item["generic"] == "paracetamol"
    assert item["dose"] == "650 mg"
    assert item["frequency"] == "morning and night"
    assert item["needs_review"] is False


def test_fifteen_interactions_and_pregnancy_block():
    assert len(INTERACTIONS) >= 15
    iron = interactions_for(["ferrous", "calcium"])
    assert any(alert["kind"] == "interaction" for alert in iron)
    pain = interactions_for(["amlodipine", "ibuprofen"])
    assert any("amlodipine" in alert["en"] or "Ibuprofen" in alert["en"] for alert in pain)
    sugar = interactions_for(["glibenclamide", "atenolol"])
    assert sugar
    bleeding = interactions_for(["warfarin", "ibuprofen"])
    assert bleeding
    duplicate = interactions_for(["paracetamol", "paracetamol"])
    assert any(alert["kind"] == "duplicate" for alert in duplicate)
    pregnant = interactions_for(["ibuprofen"], pregnant=True)
    assert any(alert["kind"] == "pregnancy" for alert in pregnant)
    assert interactions_for(["ibuprofen"], pregnant=False) == [] or all(
        alert["kind"] != "pregnancy" for alert in interactions_for(["ibuprofen"], pregnant=False)
    )


def test_three_demo_slips_work_without_cloud():
    expect = [
        {"paracetamol", "metformin"},
        {"ferrous", "calcium"},
        {"amlodipine", "ibuprofen"},
    ]
    for slip, generics in zip(SLIPS, expect):
        result = extract_document(None, slip["text"])
        assert result["source"] == "demo-cache"
        found = {item["generic"] for item in result["items"]}
        assert generics <= found
        assert all(item["confidence"] >= 0.65 for item in result["items"])
        assert result["disclaimer"]
