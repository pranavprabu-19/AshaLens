from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_docs import main as gen_docs
from generate_ner import main as gen_ner
from generate_ranker import main as gen_ranker
from ner_regex_baseline import main as ner_regex
from train_baselines import main as train_base
from train_cnn import main as train_cnn
from train_ner import main as train_ner
from train_ranker import main as train_ranker
from features import repo_root


def main() -> None:
    gen_docs()
    gen_ner()
    gen_ranker()
    train_base()
    train_cnn()
    train_ner()
    train_ranker()
    ner_regex()
    card = repo_root() / "ml" / "data" / "DATASET_CARD.md"
    print("Dataset card at", card)
    print("Pipeline complete.")


if __name__ == "__main__":
    main()
