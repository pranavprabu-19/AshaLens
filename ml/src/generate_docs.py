"""Create labeled synthetic clinic papers so we never train on real patient photos."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import csv
import random

from PIL import Image, ImageDraw, ImageFont

from features import degrade, repo_root

random.seed(42)

OUT = repo_root() / "ml" / "data" / "synthetic"
IMG = OUT / "images"
LABELS = OUT / "labels.csv"

TYPES = ("prescription", "lab_slip", "mcp_card")
QUALITIES = ("ok", "blur", "dark")
DRUGS = [
    ("Ferrous sulphate", "200 mg"),
    ("Calcium carbonate", "500 mg"),
    ("Metformin", "500 mg"),
    ("Amlodipine", "5 mg"),
    ("Paracetamol", "500 mg"),
    ("Amoxicillin", "250 mg"),
]


def font(size: int):
    for name in ("arial.ttf", "segoeui.ttf", "C:\\Windows\\Fonts\\arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_prescription(i: int) -> Image.Image:
    img = Image.new("RGB", (512, 640), "#fffdf8")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 512, 88), fill="#0A4A45")
    d.text((24, 28), "Malligai PHC  |  Rx", fill="#F4EFE4", font=font(28))
    d.text((24, 110), f"Pt: SYN-{i:03d}   Age: {20 + i % 40}", fill="#12221F", font=font(22))
    d.text((24, 150), "Rx", fill="#0E6B63", font=font(40))
    y = 210
    for name, dose in random.sample(DRUGS, k=3):
        d.text((40, y), f"- {name}  {dose}", fill="#12221F", font=font(22))
        y += 42
    d.line((40, 560, 220, 560), fill="#12221F", width=2)
    d.text((40, 570), "MO signature (synthetic)", fill="#667", font=font(16))
    return img


def draw_lab(i: int) -> Image.Image:
    img = Image.new("RGB", (512, 640), "#f3f7fb")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 512, 80), fill="#1d4e89")
    d.text((24, 26), "LAB REPORT  SYNTHETIC", fill="white", font=font(24))
    rows = [("Hb", f"{8 + (i % 40) / 10:.1f} g/dL"), ("BP", f"{110 + i % 40}/{70 + i % 20}"), ("RBS", f"{90 + i % 80} mg/dL")]
    y = 120
    d.rectangle((24, 100, 488, 280), outline="#1d4e89", width=2)
    for test, val in rows:
        d.text((40, y), test, fill="#123", font=font(22))
        d.text((280, y), val, fill="#123", font=font(22))
        y += 44
    d.text((24, 320), f"Sample ID L-{i:04d}", fill="#345", font=font(20))
    return img


def draw_mcp(i: int) -> Image.Image:
    img = Image.new("RGB", (512, 640), "#fff4e8")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 512, 90), fill="#c2410c")
    d.text((24, 28), "MCP CARD  |  Mother & Child", fill="#fff7ed", font=font(22))
    d.rounded_rectangle((28, 120, 484, 260), radius=16, fill="#fed7aa")
    d.text((48, 140), f"Mother SYN-M-{i:03d}", fill="#7c2d12", font=font(22))
    d.text((48, 180), f"ANC visit {(i % 4) + 1} of 4", fill="#7c2d12", font=font(20))
    d.text((48, 220), "TT1  [x]    TT2  [ ]    IFA  [x]", fill="#7c2d12", font=font(18))
    d.rounded_rectangle((28, 290, 484, 520), radius=16, outline="#c2410c", width=3)
    d.text((48, 310), "Immunisation boxes (synthetic)", fill="#9a3412", font=font(18))
    for idx, shot in enumerate(["BCG", "OPV", "DPT", "Measles"]):
        x = 48 + (idx % 2) * 210
        y = 360 + (idx // 2) * 60
        d.rectangle((x, y, x + 160, y + 44), outline="#9a3412")
        d.text((x + 12, y + 10), shot, fill="#9a3412", font=font(18))
    return img


DRAW = {
    "prescription": draw_prescription,
    "lab_slip": draw_lab,
    "mcp_card": draw_mcp,
}


def main() -> None:
    IMG.mkdir(parents=True, exist_ok=True)
    rows: list[dict[str, str]] = []
    n = 0
    for doc_type in TYPES:
        for i in range(36):
            for quality in QUALITIES:
                n += 1
                image = DRAW[doc_type](i)
                image = degrade(image, quality)
                name = f"{doc_type}_{quality}_{i:03d}.jpg"
                image.save(IMG / name, quality=86)
                rows.append(
                    {
                        "path": f"images/{name}",
                        "doc_type": doc_type,
                        "quality": quality,
                    }
                )
    with LABELS.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["path", "doc_type", "quality"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} synthetic images -> {IMG}")


if __name__ == "__main__":
    main()
