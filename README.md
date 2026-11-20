# AshaLens

Phone-first **paper-to-safety** companion for rural Indian primary care.

Photograph a prescription, lab slip, or MCP card. Flag duplicate medicines, known interactions, missed visits, and pregnancy danger-sign **checklists**. Explain tablets in Tamil. This is **not a doctor** and **not a diagnosis**.

Demo clinic: **Malligai PHC** (40 synthetic patients).

## Where AshaLens fits

eSanjeevani connects a patient or rural centre to a doctor over video. AshaLens sits before and after that call: it reads household paper, flags checklists, and speaks confirmed medicines. It should feed a consult, not replace one. There is no live eSanjeevani or ABHA integration in this repo. See [docs/esanjeevani-gap-roadmap.md](docs/esanjeevani-gap-roadmap.md).

## Tech stack

### Frontend (`apps/web`)

| Category | Technology | Version |
| --- | --- | --- |
| Framework | Next.js | 15.5.x |
| UI | React | 19.1.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Components | shadcn-style (custom) | — |
| Icons | Lucide React | 0.544.0 |
| PWA | Service Worker + manifest | — |
| Backend client | Supabase (optional) | 2.114.0 |
| Language | TypeScript | 5.9.2 |

### Backend and ML (`apps/ml-api`, `ml/`)

| Category | Technology | Version |
| --- | --- | --- |
| API | FastAPI + Uvicorn | 0.115 / 0.30 |
| ML | scikit-learn | 1.6.1 |
| Data | NumPy, Pandas | 1.26 / 2.2 |
| Image | OpenCV headless, Pillow | 4.10 / 10.4 |
| Persistence | joblib | 1.4 |
| Deep learning | PyTorch (optional) | 2.4 |
| Edge inference | ONNX Runtime | 1.19 |
| Speech and documents | Sarvam SDK (`sarvamai`) | 0.1.48 |

### External services

| Service | Provider | Role |
| --- | --- | --- |
| Tamil and English speech | Sarvam Bulbul v4 Flash | Dial-pad and IVR audio |
| Cloud document read | Gemini Flash, then Sarvam Vision | Photo extraction when a typed line is not used |
| Chat | `sarvam-105b-conversations` | Optional post-confirmation wording |
| Telephony | Exotel (primary), Twilio (dev only) | Feature-phone IVR |
| Database | Supabase PostgreSQL | Planned production store with row-level security |

## Models

### Baseline models in use

| File | Algorithm | Purpose |
| --- | --- | --- |
| `quality_gate.pkl` | Logistic Regression | Blur and dark photo detection |
| `document_type.pkl` | Random Forest | Prescription, lab slip, or MCP card |
| `ner_logreg.pkl` | Context logistic regression | Drug and dose tokens |
| `followup_rf.pkl` | Histogram gradient boosting (forest kept for reasons) | Visit priority |

### Experimental ONNX (not the live path yet)

| Target | Architecture | Status |
| --- | --- | --- |
| `document_type.onnx` | TinyMobileNet, INT8 | Training script exists; export is not the live classifier |
| DistilBERT-tiny ONNX | 2-layer transformer NER | Export runs only when PyTorch succeeds |

## Features

### Implemented

- [x] Document capture (camera and file upload)
- [x] In-browser quality gate (brightness and Laplacian sharpness)
- [x] Server inference through the `/ml` proxy
- [x] Drug interaction alerts (15 primary-care pairs, including iron with calcium or antacid, warfarin with an NSAID, and a sulfonylurea with a beta-blocker)
- [x] Duplicate medicine detection, including Dolo, Crocin, and Calpol as paracetamol
- [x] Pregnancy caution list (ibuprofen, warfarin, doxycycline, enalapril, losartan, atorvastatin)
- [x] NHM pregnancy danger-sign checklist
- [x] English and Tamil explanations from Sarvam after confirmation, with local templates if the call fails
- [x] Follow-up ranking with gradient boosting and the top reasons on the week page
- [x] Photo or typed-line extraction at `POST /extract`, with a confidence badge and a human confirm step
- [x] In-app patient dial pad at `/app/dialpad`
- [x] Offline capture queue
- [x] Synthetic Malligai PHC roster (40 patients)
- [x] Installable PWA
- [x] Patient Dial-Pad read API and Exotel webhook adapter (synthetic roster, confirmed medicines only)
- [x] Supabase schema and row-level security migration

### Roadmap

- [ ] Dexie.js IndexedDB instead of the current browser store
- [ ] MCP card and lab-slip structured parsers
- [ ] TinyMobileNet and DistilBERT-tiny as the live ONNX models
- [ ] Tamil–English code-mixed NER training set
- [ ] Supabase Auth (phone OTP) and offline PIN unlock
- [ ] Full Tamil UI
- [ ] Docker, GitHub Actions, and model versioning
- [x] Local FHIR JSON download from the consult summary (not an ABDM or eSanjeevani submission)
- [ ] ABDM sandbox linking and a live consent-manager flow

## Patient Dial-Pad Insights

Patients on keypad phones, or households sharing one smartphone, can hear confirmed prescription details without the ASHA worker screens.

Two modes share one clinical engine in `apps/ml-api/services/dialpad_core.py`:

- **In-app (Mode B):** `POST /dialpad/auth` then `GET /dialpad/insights/{patient_id}`. Audio is MP3 from Sarvam Bulbul v4 Flash, cached on disk.
- **Feature phone (Mode A):** Exotel webhooks in `apps/ml-api/routers/ivr_exotel.py`. Telephony audio is 8000 Hz WAV. A thin Twilio TwiML adapter exists for local demos only. Exotel is the India production path because domestic calls need an Indian number.

| Key | What the patient hears |
| --- | --- |
| 1 | Today's confirmed medicines, dose, and timing |
| 2 | Duplicate and spacing alerts |
| 3 | Latest BP and haemoglobin, in plain language |
| 4 | Pregnancy / MCP danger-sign reminders |
| 5 | Next PHC or ASHA visit |
| 9 | Callback request for the assigned ASHA worker, plus spoken instruction to dial 108 in an emergency |
| * | Repeat the last message |
| 0 | Tamil or English |

The dial pad reads **human-confirmed** medicines only. Every spoken warning ends with an instruction to confirm with the PHC doctor or ASHA worker. A 4-digit PIN is required before pregnancy or MCP details are spoken. Synthetic demo PIN: `1234`. Short codes: Lakshmi `1001`, Murugan `1002`.

On the held-out synthetic split, the quality gate reached 0.98 accuracy and document type reached 1.00. The follow-up ranker (histogram gradient boosting) reached 1.00 accuracy against a days-over-30 rule at 0.51. Those scores are on synthetic paper, not handwriting.

## Extract

`POST /extract` accepts a photo, a text-layer PDF, a typed line, or both. Gemini vision is used when `GEMINI_API_KEY` is set. Otherwise Sarvam Vision is tried. Typed lines and the three cached sample slips work with the network off. A field under 0.65 confidence is marked for review. Nothing is saved until a person checks it.

## Run

Need Node 18+ and Python 3.11 for the ML training path. The Sarvam check script uses the repo `.venv`.

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (portfolio landing) then **Open live demo**.

Demo login:

- ASHA Meena — `meena@ashalens.demo` / `demo123`
- Dr. Kumar — `kumar@ashalens.demo` / `demo123`

Train models and start the API (repo root):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r ml/requirements.txt
pip install -r apps/ml-api/requirements.txt
python learn/sklearn_crash.py
python ml/src/pipeline.py
cd apps/ml-api
python -m uvicorn main:app --reload --port 8000
```

The Next app proxies `/ml/*` to port 8000.

Sarvam chat check (key stays in `.env`, never in source):

```bash
set -a && source .env && set +a
.venv/bin/python sarvam_hello.py
```

## What you train

- Quality gate (OpenCV features + logistic regression)
- Document type (random forest; TinyMobileNet ONNX is experimental)
- NER (context logistic regression; DistilBERT-tiny ONNX is experimental)
- Follow-up ranker (histogram gradient boosting vs a random forest and a days-overdue rule; the forest supplies the “why” reasons)

LLM and speech APIs explain or speak text **after** a person confirms the fields. They do not extract the clinical record.

## Layout

```
apps/web                 Next.js PWA
apps/ml-api              FastAPI inference, dial pad, Exotel webhooks
apps/ml-api/services     Shared dial-pad text and Sarvam audio cache
apps/ml-api/routers      PWA JSON, Exotel, optional Twilio
ml/src                   generate + train + compare
ml/data                  synthetic sets + DATASET_CARD.md
ml/notebooks             teaching notebooks
learn/                   Phase 0 crash path
docs/                    report outline, comparison, demo script
supabase/migrations      PostgreSQL schema and row-level security
```

## Build order

| Phase | Focus | Deliverables |
| --- | --- | --- |
| 1 | Reliability and dial-pad MVP | Offline store, Supabase schema, in-app dial pad, local OCR |
| 2 | Clinical depth and telephony | Exotel production number, drug formulary, MCP and lab parsers |
| 3 | Edge models and grounded wording | ONNX classifiers, code-mixed NER, Tamil UI, cited NHM answers |
| 4 | Production | Containers, CI, model tracking, FHIR/ABDM export |

## Ethics

No disease diagnosis. No real patient photos. No clone of government ASHA reporting portals.

Dial-pad playback is PIN-protected and limited to records a person has confirmed. Alerts are checklists and instructions, and each one tells the listener to confirm with a PHC doctor or ASHA worker. The schema can hold an ABHA id later. It does not replace ABDM or NHM systems.
