"""DistilBERT-tiny token classifier (2-layer transformer). Intermediate NER you train."""

from __future__ import annotations

import json
from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset


SPECIAL = {"PAD": 0, "UNK": 1}
LABELS = ["O", "B-DRUG", "I-DRUG", "B-DOSE", "I-DOSE"]
L2I = {l: i for i, l in enumerate(LABELS)}


def build_vocab(rows: list[dict], min_count: int = 1) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        for t in row["tokens"]:
            counts[t.lower()] = counts.get(t.lower(), 0) + 1
    vocab = dict(SPECIAL)
    for w, c in counts.items():
        if c >= min_count:
            vocab[w] = len(vocab)
    return vocab


class RxDataset(Dataset):
    def __init__(self, rows: list[dict], vocab: dict[str, int], max_len: int = 32):
        self.rows = rows
        self.vocab = vocab
        self.max_len = max_len

    def __len__(self) -> int:
        return len(self.rows)

    def __getitem__(self, idx: int):
        row = self.rows[idx]
        ids, labs = [], []
        for t, lab in zip(row["tokens"], row["labels"]):
            ids.append(self.vocab.get(t.lower(), SPECIAL["UNK"]))
            labs.append(L2I.get(lab, 0))
        ids = ids[: self.max_len] + [0] * (self.max_len - len(ids))
        labs = labs[: self.max_len] + [-100] * (self.max_len - len(labs))
        mask = [1 if i < min(len(row["tokens"]), self.max_len) else 0 for i in range(self.max_len)]
        return (
            torch.tensor(ids),
            torch.tensor(mask),
            torch.tensor(labs),
        )


class DistilTinyNER(nn.Module):
    def __init__(self, vocab_size: int, dim: int = 64, layers: int = 2, heads: int = 4, n_labels: int = 5):
        super().__init__()
        self.emb = nn.Embedding(vocab_size, dim, padding_idx=0)
        layer = nn.TransformerEncoderLayer(d_model=dim, nhead=heads, dim_feedforward=128, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, num_layers=layers)
        self.head = nn.Linear(dim, n_labels)

    def forward(self, ids, mask):
        x = self.emb(ids)
        padding = mask == 0
        h = self.encoder(x, src_key_padding_mask=padding)
        return self.head(h)


def train_and_export(jsonl: Path, models: Path) -> None:
    rows = [json.loads(l) for l in jsonl.read_text(encoding="utf-8").splitlines()]
    split = int(len(rows) * 0.8)
    vocab = build_vocab(rows[:split])
    train_ds = RxDataset(rows[:split], vocab)
    loader = DataLoader(train_ds, batch_size=16, shuffle=True)
    model = DistilTinyNER(len(vocab))
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss(ignore_index=-100)
    model.train()
    for _ in range(8):
        total = 0.0
        for ids, mask, labs in loader:
            opt.zero_grad()
            logits = model(ids, mask)
            loss = loss_fn(logits.view(-1, logits.size(-1)), labs.view(-1))
            loss.backward()
            opt.step()
            total += float(loss)
    model.eval()
    torch.save({"state": model.state_dict(), "vocab": vocab, "labels": LABELS}, models / "ner_distilbert_tiny.pt")
    dummy_ids = torch.zeros(1, 32, dtype=torch.long)
    dummy_mask = torch.ones(1, 32, dtype=torch.long)
    torch.onnx.export(
        model,
        (dummy_ids, dummy_mask),
        models / "ner_distilbert_tiny.onnx",
        input_names=["ids", "mask"],
        output_names=["logits"],
        opset_version=17,
        dynamo=False,
    )
    print("Saved DistilBERT-tiny NER (.pt + .onnx)")


if __name__ == "__main__":
    from features import repo_root

    train_and_export(
        repo_root() / "ml" / "data" / "ner" / "prescriptions.jsonl",
        repo_root() / "ml" / "models",
    )
