# College report outline

**Title:** AshaLens: An Offline-First Multilingual Paper-to-Digital Patient Safety System Using Lightweight Vision and NLP Models for Rural Primary Healthcare in India

## 1. Introduction
- Paper jhola, rural OPD handwriting, ASHA reporting burden vs patient safety.
- Decision support ≠ diagnosis.

## 2. Related work
- ABDM / ABHA, SAMASTA, eSanjeevani: complement, do not clone.
- Medication error reviews in Indian hospitals.

## 3. System design
- PWA, FastAPI, local-first store, optional Supabase.
- Pipeline: photo → quality → type → NER → human confirm → rules → ranker.

## 4. Datasets
- Cite `ml/data/DATASET_CARD.md`.
- Ethics: synthetic only.

## 5. Models and experiments
- Paste classification reports from training.
- Comparison tables from `docs/model-comparison.md`.

## 6. HCI
- Low-literacy Tamil cards, large tap targets, consent.

## 7. Limitations and future work
- Real handwriting, on-device ONNX, ABHA export with consent.

## 8. Conclusion
- Safety net, trained models, human in the loop.
