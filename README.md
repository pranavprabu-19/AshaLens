# AshaLens

Phone-first **paper-to-safety** companion for rural Indian primary care.

Photograph a prescription, lab slip, or MCP card. Flag duplicate medicines, known interactions, missed visits, and pregnancy danger-sign **checklists**. Explain tablets in Tamil. This is **not a doctor** and **not a diagnosis**.

Demo clinic: **Malligai PHC** (40 synthetic patients).

## Run

Need Node 18+ and Python 3.11 (`py -3` on Windows).

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
py -3 -m venv .venv
.\.venv\Scripts\activate
pip install -r ml/requirements.txt
py -3 learn/sklearn_crash.py
py -3 ml/src/pipeline.py
cd apps/ml-api
py -3 -m uvicorn main:app --reload --port 8000
```

The Next app proxies `/ml/*` to port 8000.

## What you train

- Quality gate (OpenCV + Logistic Regression)
- Document type (Random Forest + Tiny-MobileNet ONNX)
- NER (context LogReg + DistilBERT-tiny ONNX)
- Follow-up ranker (Random Forest ONNX vs days>30)

LLM APIs are optional explainers **after** human confirm only.

## Layout

```
apps/web          Next.js PWA (shadcn-style UI, optional Supabase)
apps/ml-api       FastAPI inference
ml/src            generate + train + compare
ml/data           synthetic sets + DATASET_CARD.md
ml/notebooks      teaching notebook
learn/            Phase 0 crash path
docs/             report outline, comparison, demo script
```

## Ethics

No disease diagnosis, no real patient photos, no ASHA reporting clone.
