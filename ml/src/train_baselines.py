"""Train basic quality-gate and document-type models on synthetic clinic papers."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import joblib
import pandas as pd
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import doctype_features, quality_features, repo_root

ROOT = repo_root()
DATA = ROOT / "ml" / "data" / "synthetic"
MODELS = ROOT / "ml" / "models"


def load_xy():
    labels = pd.read_csv(DATA / "labels.csv")
    q_x, q_y, t_x, t_y = [], [], [], []
    for row in labels.itertuples(index=False):
        image = Image.open(DATA / row.path)
        q_x.append(quality_features(image))
        q_y.append(row.quality)
        t_x.append(doctype_features(image))
        t_y.append(row.doc_type)
    return q_x, q_y, t_x, t_y


def main() -> None:
    MODELS.mkdir(parents=True, exist_ok=True)
    q_x, q_y, t_x, t_y = load_xy()

    xq_train, xq_test, yq_train, yq_test = train_test_split(
        q_x, q_y, test_size=0.25, random_state=42, stratify=q_y
    )
    quality_model = Pipeline(
        [
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=400)),
        ]
    )
    quality_model.fit(xq_train, yq_train)
    print("\n=== Quality gate (Logistic Regression) ===")
    print(classification_report(yq_test, quality_model.predict(xq_test)))
    joblib.dump(quality_model, MODELS / "quality_gate.pkl")

    xt_train, xt_test, yt_train, yt_test = train_test_split(
        t_x, t_y, test_size=0.25, random_state=42, stratify=t_y
    )
    type_model = RandomForestClassifier(
        n_estimators=120,
        random_state=42,
        n_jobs=-1,
    )
    type_model.fit(xt_train, yt_train)
    print("\n=== Document type (Random Forest) ===")
    print(classification_report(yt_test, type_model.predict(xt_test)))
    joblib.dump(type_model, MODELS / "document_type.pkl")

    (MODELS / "README.txt").write_text(
        "quality_gate.pkl — Logistic Regression on brightness + Laplacian sharpness.\n"
        "document_type.pkl — Random Forest on 24x24 pixels + color histograms.\n"
        "Trained on synthetic papers only. Not for real clinical use.\n",
        encoding="utf-8",
    )
    print(f"Saved models to {MODELS}")


if __name__ == "__main__":
    main()
