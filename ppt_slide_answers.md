# AshaLens — PPT Slide Answers

---

## 📌 Slide 1: Problem Statement

### What problem are you trying to solve?
In rural Indian Primary Health Centres (PHCs), patient records — prescriptions, lab slips, and Mother & Child Protection (MCP) cards — are entirely **paper-based**. ASHA workers carry them in cloth bags (*jholas*). This leads to **medication errors** such as duplicate prescriptions (e.g., two brands of the same paracetamol), **missed drug interactions** (e.g., iron + calcium taken together), **overlooked pregnancy danger signs** (e.g., high BP, bleeding, convulsions), and **delayed follow-up visits**. There is no digital safety-check system at the grassroots level that works offline on a phone.

### Who faces this problem?
- **ASHA (Accredited Social Health Activist) workers** — ~10 lakh frontline health workers across rural India who manage 40–60 households each, carrying paper records with no decision-support tools.
- **Rural patients** — especially pregnant women, diabetic patients, and children — who are at risk of medication errors and missed follow-ups.
- **Visiting PHC doctors** — who have limited time per patient and no quick way to triage or prioritise the most urgent cases from an ASHA worker's caseload.

### Why is this problem important?
- India reports significant **medication errors** in primary care, especially with polypharmacy and brand-name confusion.
- **Pregnancy-related deaths** in rural India are often linked to danger signs (eclampsia, severe anaemia, bleeding) that were recorded on paper but **not acted on in time**.
- ASHA workers serve as the critical **last-mile link** in India's NHM (National Health Mission) — yet they lack any digital decision-support system that works **offline in low-connectivity villages**.
- Existing government platforms (ABDM, eSanjeevani, SAMASTA) focus on hospital-level digitisation and **do not serve the paper-first grassroots workflow**.

---

## 📌 Slide 2: Proposed Solution

### Briefly describe your solution.
**AshaLens** is a **phone-first, offline-capable PWA (Progressive Web App)** that lets ASHA workers photograph a paper prescription, lab slip, or MCP card, and then uses **lightweight ML models** (computer vision + NLP) to:
1. **Check photo quality** (blur/dark detection using OpenCV + Logistic Regression)
2. **Classify the document type** (prescription / lab slip / MCP card using Random Forest + TinyMobileNet)
3. **Extract medicine names and doses** (NER using context LogReg + DistilBERT-tiny)
4. **Flag safety issues** — duplicate medicines, known drug interactions, pregnancy danger signs, and overdue follow-ups
5. **Rank patients** by urgency for the visiting doctor's weekly briefing
6. **Explain tablets in Tamil** — simple, low-literacy-friendly explanations of each medicine

Everything runs with a **human-confirm step** — the ASHA worker verifies extracted data before the system runs safety checks. LLMs are optional explainers only, never the source of truth.

### How does it solve the identified problem?
- **Paper → Digital bridge:** Photographs replace manual re-entry; ML pre-fills fields, but the ASHA worker confirms.
- **Safety net:** Rule-based + ML-based alerts catch duplicates, interactions, and NHM danger signs that a busy ASHA worker might overlook on paper.
- **Offline-first:** Works without internet (local-first storage, optional Supabase sync), matching the reality of rural connectivity.
- **Doctor briefing:** Auto-generates a prioritised weekly summary so the visiting doctor can triage the most urgent patients first.
- **Not a diagnosis:** The system is explicitly a **decision-support checklist companion**, not a clinical tool.

---

## 📌 Slide 3: Innovation / Uniqueness

### What is new or different about your idea?
1. **Paper-first design:** Unlike ABDM/ABHA or eSanjeevani that assume digital-native workflows, AshaLens starts from a **photograph of an existing paper document** — matching the actual workflow on the ground.
2. **Lightweight, trainable ML pipeline:** Uses small models (Logistic Regression, Random Forest, TinyMobileNet ONNX, DistilBERT-tiny ONNX) that can run on budget smartphones — not cloud-dependent large LLMs.
3. **Human-in-the-loop by design:** ML suggests, the ASHA worker confirms. Safety rules fire **only after** human verification — this is architecturally enforced, not just a disclaimer.
4. **Bilingual safety alerts (English + Tamil):** Every drug interaction, danger sign, and tablet explanation has a Tamil translation for low-literacy users.
5. **Follow-up ranker for doctors:** A Random Forest model ranks patients by urgency (overdue days, pregnancy, BP, anaemia, danger signs) and generates a printable/copyable briefing for the visiting PHC doctor.
6. **Ethical-by-default:** Uses entirely synthetic data for training; no real patient photos; no disease diagnosis; no cloning of ASHA government reporting systems.

### How is it better than existing solutions?
| Feature | ABDM / eSanjeevani | AshaLens |
|---|---|---|
| Requires internet | Yes | No (offline-first PWA) |
| Starts from paper | No (digital-native forms) | Yes (photograph-first) |
| Drug interaction check | Not at primary-care level | Yes (rule-based + bilingual) |
| NHM danger-sign checklist | Manual on paper | Automated alerts |
| Works on budget phone | Not optimised | Designed for it (lightweight ONNX models) |
| Language | English/Hindi | English + Tamil (expandable) |
| Doctor briefing | Not available | Auto-ranked weekly summary |

---

## 📌 Slide 4: Target Users

### Who will use the solution?
1. **ASHA Workers (Primary users)** — Rural frontline health workers who photograph prescriptions, confirm extracted data, receive safety alerts in Tamil, and manage follow-up visits for their 40–60 households.
2. **Visiting PHC Doctors** — Receive a ranked patient briefing (top 8 urgent cases) to triage quickly during their limited clinic hours; can review flagged interactions and danger signs.
3. **ANMs (Auxiliary Nurse Midwives)** — Can use the pregnancy danger-sign alerts and overdue ANC visit tracking for their sub-centre catchment area.
4. **Rural Primary Health Centres (PHCs)** — Specifically demonstrated for **Malligai PHC** (a synthetic demo clinic with 40 patients across multiple villages).

---

## 📌 Slide 5: Key Features

### List 3–6 major features:

1. **📸 Paper Document Capture & Quality Gate** — Photograph prescriptions, lab slips, or MCP cards; automatic blur/darkness detection with re-shoot advice.

2. **🔍 AI-Powered Medicine Extraction (NER)** — Extracts drug names and doses from photographed text using lightweight NLP models (Context LogReg + DistilBERT-tiny), with mandatory human confirmation.

3. **⚠️ Drug Safety Alerts** — Flags duplicate medicines (brand-name confusion) and known drug interactions (e.g., iron + calcium, metformin + ibuprofen) with bilingual explanations.

4. **🤰 Pregnancy Danger-Sign Checker** — Automatically checks NHM pregnancy danger signs — high BP (≥140 systolic), severe anaemia (Hb <7), bleeding, swelling, convulsions, reduced fetal movement — with Tamil alerts.

5. **📊 Smart Follow-Up Ranker** — ML-powered patient prioritisation (Random Forest) that ranks households by urgency; generates a copy-ready doctor briefing with the top 8 cases.

6. **💊 Tablet Explainer in Tamil** — Simple, low-literacy explanations for common medicines (metformin, iron, calcium, amlodipine, etc.) in both English and Tamil.
