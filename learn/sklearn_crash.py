"""Phase 0: scikit-learn on a tiny follow-up table. No clinic photos yet."""

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
import numpy as np

# days_overdue, pregnant, high_bp, duplicate_meds -> visit_this_week
rng = np.random.default_rng(0)
n = 200
days = rng.integers(0, 90, n)
pregnant = rng.integers(0, 2, n)
high_bp = rng.integers(0, 2, n)
dupes = rng.integers(0, 2, n)
X = np.column_stack([days, pregnant, high_bp, dupes])
y = ((days > 30) | ((pregnant == 1) & (high_bp == 1)) | (dupes == 1)).astype(int)

x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
clf = RandomForestClassifier(n_estimators=40, random_state=0)
clf.fit(x_train, y_train)
print(classification_report(y_test, clf.predict(x_test), target_names=["wait", "visit"]))
print("feature importances", dict(zip(["days_overdue", "pregnant", "high_bp", "dupes"], clf.feature_importances_)))
