# AshaLens synthetic dataset card

**Purpose:** Train paper-quality, document-type, NER, and follow-up ranking models without real patient photographs or identifiable health records.

**License / ethics:** Synthetic only. Not for clinical use. Do not mix in real PHC scans until college ethics approval.

## Splits

| Set | Location | Size (approx) | Labels |
| --- | --- | --- | --- |
| Clinic papers | `ml/data/synthetic/` | 324 JPEGs | `doc_type`, `quality` |
| Prescription text | `ml/data/ner/prescriptions.jsonl` | 400 lines | BIO `DRUG` / `DOSE` |
| Follow-up table | `ml/data/ranker/followup.csv` | 800 rows | `on_track` / `overdue_medium` / `overdue_high` |
| Clinic roster | `apps/web/src/lib/seed.ts` + extras | 40 patients | synthetic PHI-free names |

## Collection method

Images are drawn with Pillow (letterhead, tables, MCP card blocks), then blurred or darkened on purpose. NER lines are templated English Rx strings with light OCR-like character noise. Ranker rows are sampled from rules that mimic NHM follow-up urgency — the Random Forest must beat a dumb “days > 30” baseline, not memorize a hospital.

## Intended use

Quality gate, document routing, field suggestion, ASHA week ranking. **Not** disease diagnosis.

## Known gaps

Handwriting, Tamil script mixed with English, torn paper, and torch glare are missing. Report those as limitations. Expected F1 will drop on real paper.
