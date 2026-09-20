"""MobileNet-style CNN for document type. Intermediate CV you train on synthetic papers."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import pandas as pd
from PIL import Image

from features import repo_root, to_array

CLASSES = ["lab_slip", "mcp_card", "prescription"]
C2I = {c: i for i, c in enumerate(CLASSES)}


def load_tensors():
    labels = pd.read_csv(repo_root() / "ml" / "data" / "synthetic" / "labels.csv")
    xs, ys = [], []
    root = repo_root() / "ml" / "data" / "synthetic"
    for row in labels.itertuples(index=False):
        arr = to_array(Image.open(root / row.path), 64)
        xs.append(np.transpose(arr, (2, 0, 1)))
        ys.append(C2I[row.doc_type])
    x = np.stack(xs)
    y = np.array(ys)
    idx = np.random.default_rng(0).permutation(len(x))
    n = int(len(x) * 0.8)
    return x[idx[:n]], y[idx[:n]], x[idx[n:]], y[idx[n:]]


def main() -> None:
    try:
        import torch
        from torch import nn
        from torch.utils.data import DataLoader, TensorDataset
    except ImportError:
        print("PyTorch not installed — skip MobileNet-style CNN.")
        return

    class MobileBlock(nn.Module):
        def __init__(self, cin: int, cout: int, stride: int = 1):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(cin, cin, 3, stride=stride, padding=1, groups=cin, bias=False),
                nn.BatchNorm2d(cin),
                nn.ReLU(inplace=True),
                nn.Conv2d(cin, cout, 1, bias=False),
                nn.BatchNorm2d(cout),
                nn.ReLU(inplace=True),
            )

        def forward(self, x):
            return self.net(x)

    class TinyMobileNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.stem = nn.Sequential(
                nn.Conv2d(3, 16, 3, stride=2, padding=1, bias=False),
                nn.BatchNorm2d(16),
                nn.ReLU(inplace=True),
            )
            self.blocks = nn.Sequential(
                MobileBlock(16, 24, 1),
                MobileBlock(24, 32, 2),
                MobileBlock(32, 48, 2),
            )
            self.head = nn.Sequential(nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(48, 3))

        def forward(self, x):
            return self.head(self.blocks(self.stem(x)))

    x_train, y_train, x_test, y_test = load_tensors()
    model = TinyMobileNet()
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()
    loader = DataLoader(
        TensorDataset(torch.tensor(x_train), torch.tensor(y_train, dtype=torch.long)),
        batch_size=32,
        shuffle=True,
    )
    model.train()
    for _ in range(12):
        for xb, yb in loader:
            opt.zero_grad()
            loss = loss_fn(model(xb), yb)
            loss.backward()
            opt.step()
    model.eval()
    with torch.no_grad():
        pred = model(torch.tensor(x_test)).argmax(1).numpy()
    acc = float((pred == y_test).mean())
    print(f"Tiny-MobileNet document-type accuracy {acc:.3f}")
    models = repo_root() / "ml" / "models"
    models.mkdir(parents=True, exist_ok=True)
    torch.save({"state": model.state_dict(), "classes": CLASSES}, models / "doctype_mobilenet.pt")
    dummy = torch.zeros(1, 3, 64, 64)
    torch.onnx.export(
        model,
        dummy,
        models / "doctype_mobilenet.onnx",
        input_names=["image"],
        output_names=["logits"],
        opset_version=17,
        dynamo=False,
    )
    print("Saved doctype_mobilenet.pt + .onnx")


if __name__ == "__main__":
    main()
