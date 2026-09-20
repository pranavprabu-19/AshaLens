from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize

from features import repo_root

FEATURES = [
    "days_overdue",
    "pregnant",
    "gestational_week",
    "high_bp",
    "duplicate_meds",
    "interaction",
    "anemia",
    "danger_sign",
    "age",
]


def main() -> None:
    data = pd.read_csv(repo_root() / "ml" / "data" / "ranker" / "followup.csv")
    x = data[FEATURES]
    y = data["label"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.25, random_state=0, stratify=y)
    clf = RandomForestClassifier(n_estimators=160, random_state=0, n_jobs=-1)
    clf.fit(x_train, y_train)
    pred = clf.predict(x_test)
    print("\n=== Follow-up ranker (Random Forest) ===")
    print(classification_report(y_test, pred))
    y_bin = label_binarize(y_test, classes=clf.classes_)
    proba = clf.predict_proba(x_test)
    try:
        auc = roc_auc_score(y_bin, proba, average="macro", multi_class="ovr")
        print(f"macro ROC-AUC {auc:.3f}")
    except Exception as exc:  # noqa: BLE001
        print("AUC skipped", exc)

    rule = (x_test["days_overdue"] > 30).map({True: "overdue_medium", False: "on_track"})
    print("Dumb rule (days>30) accuracy", float((rule.values == y_test.values).mean()))
    print("RF accuracy", float((pred == y_test).mean()))
    print("feature importances", dict(zip(FEATURES, clf.feature_importances_)))

    models = repo_root() / "ml" / "models"
    models.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": clf, "features": FEATURES, "classes": list(clf.classes_)}, models / "followup_rf.pkl")

    try:
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType

        onx = convert_sklearn(clf, initial_types=[("input", FloatTensorType([None, len(FEATURES)]))])
        (models / "followup_rf.onnx").write_bytes(onx.SerializeToString())
        print("Exported followup_rf.onnx")
    except Exception as exc:  # noqa: BLE001
        print("ONNX export skipped:", exc)

    (models / "ranker_importances.json").write_text(
        json.dumps(dict(zip(FEATURES, [float(v) for v in clf.feature_importances_])), indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
