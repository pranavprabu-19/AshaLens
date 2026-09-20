from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from ner_regex_baseline import extract
from features import repo_root


def main() -> None:
    path = repo_root() / "ml" / "data" / "ner" / "prescriptions.jsonl"
    rows = [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines()[:100]]
    gold_drug = 0
    regex_hit = 0
    for row in rows:
        gold = {t for t, lab in zip(row["tokens"], row["labels"]) if lab.endswith("DRUG")}
        pred = extract(row["text"])["drug"]
        if gold:
            gold_drug += 1
            if pred and any(pred.lower() in g.lower() or g.lower() in pred.lower() for g in gold):
                regex_hit += 1
    report = {
        "n": len(rows),
        "regex_drug_recall_proxy": regex_hit / max(gold_drug, 1),
        "note": "Compare regex vs trained LogReg NER vs DistilBERT-tiny in the college report. LogReg/Distil metrics print during train_ner.py.",
        "llm": "Optional Gemini/Groq is explanation-only and is not scored as an extractor.",
    }
    out = repo_root() / "docs" / "model-comparison.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
