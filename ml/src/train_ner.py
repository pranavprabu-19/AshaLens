from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import joblib
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline

from features import repo_root


def token_feat(tokens: list[str], i: int) -> dict:
    tok = tokens[i]
    prev = tokens[i - 1] if i else ""
    nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
    return {
        "tok": tok.lower(),
        "prev": prev.lower(),
        "next": nxt.lower(),
        "is_digit": str(any(c.isdigit() for c in tok)),
        "is_title": str(tok[:1].isupper()),
        "suffix2": tok[-2:].lower(),
        "len": str(min(len(tok), 12)),
    }


def load_xy(path: Path):
    X, y = [], []
    for line in path.read_text(encoding="utf-8").splitlines():
        row = json.loads(line)
        tokens, labels = row["tokens"], row["labels"]
        for i, lab in enumerate(labels):
            X.append(token_feat(tokens, i))
            y.append(lab)
    return X, y


def main() -> None:
    data = repo_root() / "ml" / "data" / "ner" / "prescriptions.jsonl"
    models = repo_root() / "ml" / "models"
    models.mkdir(parents=True, exist_ok=True)
    X, y = load_xy(data)
    split = int(len(X) * 0.8)
    pipe = Pipeline(
        [
            ("vec", DictVectorizer()),
            ("clf", LogisticRegression(max_iter=400, class_weight="balanced")),
        ]
    )
    pipe.fit(X[:split], y[:split])
    print("\n=== spaCy-style token NER (LogReg + context features) ===")
    print(classification_report(y[split:], pipe.predict(X[split:]), zero_division=0))
    joblib.dump(pipe, models / "ner_logreg.pkl")

    try:
        import torch
        from train_distilbert_tiny import train_and_export

        train_and_export(data, models)
    except Exception as exc:  # noqa: BLE001
        print("DistilBERT-tiny skipped:", exc)


if __name__ == "__main__":
    main()
