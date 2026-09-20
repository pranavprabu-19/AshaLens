from __future__ import annotations

import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from features import repo_root

random.seed(7)

DRUGS = [
    ("Ferrous sulphate", "200 mg", "once daily"),
    ("Calcium carbonate", "500 mg", "once daily"),
    ("Metformin", "500 mg", "twice daily"),
    ("Amlodipine", "5 mg", "once daily"),
    ("Paracetamol", "500 mg", "three times daily"),
    ("Amoxicillin", "250 mg", "three times daily"),
    ("Ibuprofen", "400 mg", "as needed"),
    ("Folic acid", "5 mg", "once daily"),
    ("Atorvastatin", "10 mg", "once nightly"),
    ("Acetaminophen", "650 mg", "twice daily"),
]

FREQ = ["once daily", "twice daily", "BD", "HS", "after food", "as needed"]

TEMPLATES = [
    "Rx {drug} {dose} {freq}",
    "Tab {drug} {dose} {freq}",
    "{drug} {dose} {freq}",
    "Take {drug} {dose} {freq}",
    "Dr note: {drug} {dose}, {freq}",
]


def noise(text: str) -> str:
    chars = list(text)
    if random.random() < 0.35 and chars:
        i = random.randrange(len(chars))
        chars[i] = random.choice("aeioult")
    return "".join(chars).replace("mg", random.choice(["mg", "mg", "m g"]))


def main() -> None:
    out = repo_root() / "ml" / "data" / "ner"
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for i in range(400):
        drug, dose, freq = random.choice(DRUGS)
        freq = random.choice(FREQ)
        text = random.choice(TEMPLATES).format(drug=drug, dose=dose, freq=freq)
        if random.random() < 0.4:
            extra = random.choice(DRUGS)
            text += f" ; {extra[0]} {extra[1]}"
        noisy = noise(text)
        tokens = noisy.split()
        labels = ["O"] * len(tokens)
        for d, _, _ in DRUGS:
            parts = d.split()
            for t_i in range(len(tokens) - len(parts) + 1):
                window = " ".join(tokens[t_i : t_i + len(parts)]).lower()
                if window == d.lower() or window.replace(" ", "") == d.lower().replace(" ", ""):
                    labels[t_i] = "B-DRUG"
                    for k in range(1, len(parts)):
                        labels[t_i + k] = "I-DRUG"
        for t_i, tok in enumerate(tokens):
            if any(ch.isdigit() for ch in tok) and "B-DRUG" not in labels[t_i]:
                labels[t_i] = "B-DOSE"
                if t_i + 1 < len(tokens) and tokens[t_i + 1].lower() in {"mg", "g", "ml", "m"}:
                    labels[t_i + 1] = "I-DOSE"
        rows.append({"id": f"rx-{i:04d}", "text": noisy, "tokens": tokens, "labels": labels})
    (out / "prescriptions.jsonl").write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")
    print(f"Wrote {len(rows)} NER lines -> {out}")


if __name__ == "__main__":
    import sys
    from pathlib import Path as P

    sys.path.insert(0, str(P(__file__).resolve().parent))
    main()
