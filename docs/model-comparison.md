# Model comparison chapter (draft)

Use this in the college report. Fill numbers after `py -3 ml/src/pipeline.py` and `py -3 ml/src/compare_extractors.py`.

## Extraction (same 100 synthetic slips)

| Method | What it is | DRUG F1 | DOSE F1 | Latency | Failure mode |
| --- | --- | --- | --- | --- | --- |
| Regex lexicon | `ner_regex_baseline.py` | (from compare json) | — | <1 ms | Unknown brand names |
| Context LogReg | spaCy-style token features | (train_ner printout) | | ~5 ms | OCR garbage tokens |
| DistilBERT-tiny | 2-layer transformer you train | (if torch ran) | | tens of ms | Needs vocab from train set |
| LLM prompt | Optional, not source of truth | do not use as extractor | | network | Hallucination |

## Ranking

| Method | Accuracy / AUC | Notes |
| --- | --- | --- |
| Rule: days overdue > 30 | printed by `train_ranker.py` | Ignores pregnancy BP |
| Random Forest | printed by `train_ranker.py` | Feature importances in `ml/models/ranker_importances.json` |

## Honest limitations

- Synthetic letterheads are easier than handwriting.
- Tamil mixed script is not in the NER set yet.
- Human confirm is part of the system, not a UI extra.
