# AshaLens — PPT Slide Answers (Part 2)

---

## 📌 Slide 6: Implementation Plan

### How will you build it during the hackathon?

| Phase | Duration | Tasks |
|---|---|---|
| **Phase 1 — Data & ML Pipeline** | Hours 0–8 | Generate synthetic datasets (prescriptions, lab slips, MCP cards, NER text, follow-up CSV). Train 4 ML models: Quality Gate (LogReg), Document Type (Random Forest + TinyMobileNet), NER (Context LogReg + DistilBERT-tiny), Follow-up Ranker (Random Forest). Export to ONNX. |
| **Phase 2 — Backend API** | Hours 8–14 | Build FastAPI inference server with `/predict/image`, `/predict/ner`, `/predict/rank`, `/explain` endpoints. Load trained models via joblib/ONNX. Add health-check and disclaimer middleware. |
| **Phase 3 — Frontend PWA** | Hours 14–26 | Build Next.js 15 PWA with role-based login (ASHA / Doctor). Implement patient dashboard, document capture with camera, client-side quality check (Laplacian blur + brightness), safety alert panel (duplicates, interactions, danger signs), Tamil translations, and weekly doctor briefing page. |
| **Phase 4 — Integration & Polish** | Hours 26–32 | Wire frontend ↔ FastAPI via Next.js rewrites (`/ml/*` → port 8000). Add offline queue (localStorage fallback), consent flow, service worker. End-to-end demo walkthrough. |
| **Phase 5 — Testing & Demo** | Hours 32–36 | Full pipeline test with 40 synthetic patients. Record 90-second demo video. Write documentation. |

### What will be the minimum viable prototype (MVP)?

The MVP includes:
1. **Login** as ASHA worker (Meena) or Doctor (Kumar) with demo credentials
2. **Patient dashboard** showing 40 synthetic patients from Malligai PHC with village, age, pregnancy status
3. **Photograph a paper** → client-side quality gate (blur/dark detection) + ML-based document type classification
4. **Type or extract medicine text** → NER extracts drug name + dose → ASHA worker confirms → safety engine runs
5. **Safety alerts** — at least: duplicate medicine detection, iron+calcium interaction flag, pregnancy high-BP danger sign
6. **"This Week" briefing** — ranked patient list for the visiting doctor, sorted by urgency score
7. **Tamil translations** for alerts and tablet explanations

---

## 📌 Slide 7: Technology / Tech Stack

### Languages
- **TypeScript** — Frontend (Next.js PWA, React components, safety rules, state management)
- **Python** — Backend ML pipeline (data generation, model training, FastAPI inference server)
- **HTML/CSS** — UI structure and styling (Tailwind CSS)

### Frameworks
- **Next.js 15** — React-based full-stack framework for the PWA (server-side rendering, API rewrites, service workers)
- **React 19** — Component-based UI with hooks and context for state management
- **FastAPI** — High-performance Python web framework for serving ML model predictions
- **Tailwind CSS 3** — Utility-first CSS framework for responsive, mobile-first UI design
- **scikit-learn** — Classical ML model training (Logistic Regression, Random Forest)

### AI/ML Models
| Model | Algorithm | Purpose |
|---|---|---|
| Quality Gate | OpenCV + Logistic Regression | Detect blur/dark photos before processing |
| Document Classifier | Random Forest + TinyMobileNet (ONNX) | Classify paper as prescription / lab slip / MCP card |
| NER Extractor | Context LogReg + DistilBERT-tiny (ONNX) | Extract drug names and doses from prescription text |
| Follow-up Ranker | Random Forest (ONNX) | Rank patients by urgency for doctor's weekly briefing |
| Regex Baseline | Rule-based pattern matching | Fallback drug/dose extraction from text |

### APIs
- **FastAPI REST Endpoints** — `/predict/image`, `/predict/ner`, `/predict/rank`, `/explain`, `/health`
- **Supabase Auth API** (optional) — User authentication and cloud sync
- **Gemini / Groq API** (optional) — LLM-based drug explanations (only after human confirm, never source of truth)

### Cloud / Platforms
- **Local-first / Offline PWA** — Primary mode; runs entirely on the phone browser without internet
- **Supabase** (optional) — Cloud Postgres database + auth for data sync when connectivity is available
- **ONNX Runtime** — Cross-platform ML model inference (enables future on-device deployment)
- **GitHub** — Version control and project hosting

### Hardware, if applicable
- **Any smartphone with a camera** — The app is a PWA (Progressive Web App) designed for budget Android phones common in rural India. No special hardware required.
- **Development machine** — Any laptop with Node 18+ and Python 3.11+ for training and running the local server.

---

## 📌 Slide 8: Expected Impact

### What benefit will the solution provide?

**For ASHA Workers:**
- Reduces manual effort of cross-checking paper prescriptions — safety alerts are automatic after photo capture and confirmation.
- Tamil-language tablet explanations help ASHAs explain medicines to patients in their native language.
- Weekly patient ranking tells them exactly which households to visit first.

**For Patients:**
- Catches duplicate medicines (e.g., Dolo + Paracetamol being the same drug) before they cause harm.
- Flags dangerous drug interactions (e.g., iron + calcium reducing absorption) that are commonly missed in paper-based systems.
- Pregnancy danger signs (high BP, severe anaemia, bleeding) are surfaced immediately, not buried in a paper MCP card.

**For Doctors:**
- Auto-generated, ranked briefing of the top 8 urgent patients saves triage time during limited PHC visiting hours.

### Expected social, economic, educational, environmental, or technical impact:

| Impact Area | Expected Outcome |
|---|---|
| **Social** | Improved patient safety in rural primary healthcare; reduces medication errors that disproportionately affect low-income, low-literacy populations. Empowers ASHA workers with decision-support tools. |
| **Health** | Early detection of pregnancy danger signs (eclampsia risk, severe anaemia) through automated NHM checklist flagging — potentially reducing maternal mortality in rural areas. |
| **Economic** | Prevents costs associated with adverse drug events (hospitalisations from duplicate/interacting medicines). Free, open-source tool with no subscription cost for PHCs. |
| **Educational** | Teaches ASHA workers about drug interactions and danger signs through bilingual alerts. The project itself demonstrates ML model training, comparison, and responsible AI deployment for students. |
| **Technical** | Demonstrates that lightweight ML models (LogReg, Random Forest, tiny transformers) can provide meaningful clinical decision support on budget smartphones — without relying on expensive cloud LLMs. Open-source reference architecture for offline-first health apps in low-resource settings. |

---

## 📌 Slide 9: Feasibility

### Can the solution realistically be built during the hackathon?

**Yes.** The project is designed to be buildable in a hackathon timeframe because:

1. **All data is synthetic** — No dependency on hospital partnerships, ethical approvals, or real patient data. Data generation scripts (`generate_docs.py`, `generate_ner.py`, `generate_ranker.py`) produce training sets in minutes.
2. **Lightweight models** — Logistic Regression, Random Forest, and 2-layer DistilBERT-tiny train in seconds to minutes on a laptop CPU. No GPU required.
3. **Proven tech stack** — Next.js + FastAPI + scikit-learn are mature, well-documented frameworks with fast development cycles.
4. **Offline-first PWA** — No cloud infrastructure setup required for the demo. Everything runs on `localhost` (Next.js on port 3000, FastAPI on port 8000).
5. **Modular pipeline** — Each component (quality gate, document classifier, NER, ranker, safety rules) is independent and can be developed/tested in parallel.

### Any major dependencies or limitations?

**Dependencies:**
- Node.js 18+ and Python 3.11+ must be installed on the development machine.
- `scikit-learn`, `opencv-python-headless`, `pillow`, `onnxruntime`, `torch` (for DistilBERT-tiny training only).
- A smartphone with a camera for the demo (or any browser with file upload).

**Limitations:**
- **Synthetic data only** — Models are trained on computer-generated letterheads and templated text, not real handwriting. F1 scores will drop on real PHC prescriptions.
- **Tamil mixed-script not yet covered** — NER training data is English-only; Tamil-English code-mixed prescriptions are not supported yet.
- **No real OCR** — Current NER works on typed/templated text, not on actual camera-captured handwritten text (OCR integration is future work).
- **Not a certified medical device** — This is a decision-support checklist companion; it does not diagnose or replace clinical judgment.
- **Torn paper, torch glare, and low-quality phone cameras** are not represented in the synthetic training set — listed as known gaps.

---

## 📌 Slide 10: Prototype / References (optional)

### Figma
- Not applicable (UI built directly in code using Next.js + Tailwind CSS with shadcn-style components)

### GitHub
- Repository: `AshaLens` (local project — to be hosted on GitHub)
- Structure: Monorepo with `apps/web` (Next.js PWA), `apps/ml-api` (FastAPI), `ml/` (data generation + training), `docs/` (report, comparison, demo script)

### Demo
- **Local demo**: `http://localhost:3000` → Portfolio landing page → "Open live demo"
- **Demo login credentials**:
  - ASHA Meena: `meena@ashalens.demo` / `demo123`
  - Dr. Kumar: `kumar@ashalens.demo` / `demo123`
- **Demo clinic**: Malligai PHC with 40 synthetic patients across multiple villages
- **Demo video**: 90-second walkthrough covering login → consent → patient view → photo capture → NER → safety alerts → doctor briefing

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (ASHA / Doctor)                      │
│                  📱 Budget Android Phone                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               Next.js 15 PWA (Port 3000)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Login   │ │ Patient  │ │ Document │ │  This Week    │  │
│  │ (Consent)│ │Dashboard │ │ Capture  │ │  (Briefing)   │  │
│  └──────────┘ └──────────┘ └────┬─────┘ └───────────────┘  │
│                                 │                           │
│  ┌──────────────────────────────▼────────────────────────┐  │
│  │  Client-Side Safety Engine (safety.ts)                │  │
│  │  • Duplicate detection  • Drug interactions           │  │
│  │  • Danger-sign checker  • Follow-up ranker            │  │
│  │  • Tamil translations   • Doctor briefing generator   │  │
│  └──────────────────────────────┬────────────────────────┘  │
│                                 │                           │
│  ┌──────────────────────────────▼────────────────────────┐  │
│  │  Client-Side Quality Gate (imageQuality.ts)           │  │
│  │  • Laplacian blur detection  • Brightness check       │  │
│  └──────────────────────────────┬────────────────────────┘  │
│                                 │ /ml/* proxy               │
│  ┌──────────────────────────────▼────────────────────────┐  │
│  │  Local Storage + Offline Queue                        │  │
│  │  (localStorage fallback, optional Supabase sync)      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP (rewrites /ml/* → :8000)
┌─────────────────────▼───────────────────────────────────────┐
│              FastAPI ML API (Port 8000)                      │
│  ┌────────────────┐ ┌────────────────┐ ┌─────────────────┐  │
│  │ /predict/image │ │ /predict/ner   │ │ /predict/rank   │  │
│  │ Quality + Type │ │ Drug + Dose    │ │ Urgency Score   │  │
│  └───────┬────────┘ └───────┬────────┘ └────────┬────────┘  │
│          │                  │                    │           │
│  ┌───────▼──────────────────▼────────────────────▼────────┐  │
│  │              Trained ML Models (ml/models/)            │  │
│  │  • quality_gate.pkl    (LogReg)                        │  │
│  │  • document_type.pkl   (Random Forest + MobileNet)     │  │
│  │  • ner_logreg.pkl      (Context LogReg)                │  │
│  │  • followup_rf.pkl     (Random Forest)                 │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Research / Reference Links
1. **NHM (National Health Mission)** ASHA Guidelines — Danger signs checklist for pregnancy monitoring
   - https://nhm.gov.in
2. **ABDM (Ayushman Bharat Digital Mission)** — Government health digitisation initiative (AshaLens complements, not clones)
   - https://abdm.gov.in
3. **eSanjeevani** — Government telemedicine platform (hospital-level, not grassroots)
   - https://esanjeevani.mohfw.gov.in
4. **WHO Medication Safety Reports** — Medication errors in primary care globally
   - https://www.who.int/news-room/fact-sheets/detail/patient-safety
5. **scikit-learn Documentation** — Classical ML models used in the pipeline
   - https://scikit-learn.org/stable/
6. **ONNX Runtime** — Cross-platform model inference for edge deployment
   - https://onnxruntime.ai
7. **Next.js PWA** — Progressive Web App framework for offline-first applications
   - https://nextjs.org
