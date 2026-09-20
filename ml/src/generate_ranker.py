from __future__ import annotations

import csv
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import repo_root

random.seed(11)


def label_row(days: int, pregnant: int, high_bp: int, dupes: int, anemia: int, danger: int) -> str:
    if (pregnant and (high_bp or danger)) or days >= 60 or (danger and pregnant):
        return "overdue_high"
    if days >= 30 or dupes or anemia:
        return "overdue_medium"
    return "on_track"


def main() -> None:
    out = repo_root() / "ml" / "data" / "ranker"
    out.mkdir(parents=True, exist_ok=True)
    path = out / "followup.csv"
    fields = [
        "days_overdue",
        "pregnant",
        "gestational_week",
        "high_bp",
        "duplicate_meds",
        "interaction",
        "anemia",
        "danger_sign",
        "age",
        "label",
    ]
    rows = []
    for _ in range(800):
        days = random.randint(0, 90)
        pregnant = int(random.random() < 0.28)
        gw = random.randint(8, 36) if pregnant else 0
        high_bp = int(random.random() < (0.35 if pregnant else 0.18))
        dupes = int(random.random() < 0.12)
        interaction = int(random.random() < 0.15)
        anemia = int(random.random() < 0.2)
        danger = int(random.random() < (0.12 if pregnant else 0.03))
        age = random.randint(1, 78)
        rows.append(
            {
                "days_overdue": days,
                "pregnant": pregnant,
                "gestational_week": gw,
                "high_bp": high_bp,
                "duplicate_meds": dupes,
                "interaction": interaction,
                "anemia": anemia,
                "danger_sign": danger,
                "age": age,
                "label": label_row(days, pregnant, high_bp, dupes, anemia, danger),
            }
        )
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {len(rows)} ranker rows -> {path}")


if __name__ == "__main__":
    main()
