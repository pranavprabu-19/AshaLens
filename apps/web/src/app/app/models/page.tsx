"use client";

export default function ModelsPage() {
  const stages = [
    {
      level: "Basic CV",
      title: "Quality gate",
      status: "Trained Logistic Regression + OpenCV Laplacian",
      detail: "ok / blur / dark. Browser preview plus Python model via FastAPI.",
    },
    {
      level: "Basic–intermediate CV",
      title: "Document type",
      status: "Random Forest + Tiny-MobileNet ONNX",
      detail: "prescription / lab_slip / mcp_card. Synthetic papers only.",
    },
    {
      level: "Intermediate NLP",
      title: "Medicine NER",
      status: "LogReg token NER + DistilBERT-tiny ONNX",
      detail: "DRUG and DOSE. Human confirm is mandatory. Regex is the weak baseline.",
    },
    {
      level: "Basic tabular ML",
      title: "Follow-up ranker",
      status: "Random Forest + ONNX",
      detail: "Compared against days>30. Feature importances saved for the viva.",
    },
    {
      level: "API only",
      title: "Tamil explanation",
      status: "Templates after confirm",
      detail: "Gemini/Groq key is optional and never used for diagnosis.",
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-teal-dark">Models we train</h1>
      <p className="text-sm text-ink/65">
        Perfect scores on synthetic papers are expected. Real handwriting will drop — that drop is the report.
      </p>
      <ol className="space-y-3">
        {stages.map((s) => (
          <li key={s.title} className="rounded-3xl bg-white p-4 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal">{s.level}</p>
            <h2 className="font-display text-xl">{s.title}</h2>
            <p className="text-xs font-medium text-ok">{s.status}</p>
            <p className="mt-2 text-sm text-ink/70">{s.detail}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-ink/50">
        From repo root: <code className="rounded bg-sand px-1">py -3 ml/src/pipeline.py</code>
      </p>
    </div>
  );
}
