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


KIND_BY_PREFIX = {
    "INTERACTION": "interaction",
    "DUPLICATE_SALT": "duplicate",
    "DUPLICATE_CLASS": "duplicate_class",
    "NHM_DANGER_SIGN": "danger_sign",
    "NHM_HIGH_RISK": "high_risk",
    "PREGNANCY_CONTRAINDICATION": "pregnancy",
}


def _tiny_pdf(line: str) -> bytes:
    stream = f"BT /F1 18 Tf 36 100 Td ({line}) Tj ET".encode("latin-1")
    parts = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    header = b"%PDF-1.4\n"
    body = b""
    offsets = [0]
    cursor = len(header)
    for index, part in enumerate(parts, start=1):
        offsets.append(cursor)
        chunk = f"{index} 0 obj\n".encode() + part + b"\nendobj\n"
        body += chunk
        cursor += len(chunk)
    xref = b"xref\n0 6\n0000000000 65535 f \n"
    for offset in offsets[1:]:
        xref += f"{offset:010d} 00000 n \n".encode()
    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{cursor}\n%%EOF\n".encode()
    return header + body + xref + trailer


def test_text_pdf_uses_the_same_extractor():
    pdf = _tiny_pdf("Tab Dolo 650 mg 1-0-1")
    result = extract_document(pdf, "", "application/pdf")
    assert result["source"] == "pdf"
    assert any(item["generic"] == "paracetamol" for item in result["items"])
    blank = extract_document(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "", "application/pdf")
    assert blank["source"] == "none"
    assert blank["items"] == []


def test_rx_gold_flags():
    gold = json.loads((Path(__file__).resolve().parents[1] / "services" / "rx_gold.json").read_text(encoding="utf-8"))
    assert len(gold) == 25
    for case in gold:
        result = extract_document(None, case["raw_text"])
        kinds = [alert["kind"] for alert in result["alerts"]]
        expected = case["expected_flag"]
        if expected == "SAFE":
            assert kinds == [], (case["id"], kinds)
            continue
        prefix = expected.split(":", 1)[0]
        assert KIND_BY_PREFIX[prefix] in kinds, (case["id"], kinds, expected)
        text = " ".join(alert["en"] for alert in result["alerts"])
        if case["id"] == "RX-005":
            assert "does not diagnose pre-eclampsia" in text
        if case["id"] == "RX-016":
            assert "Not a diagnosis" in text
            assert "diabetes" not in text.lower()
