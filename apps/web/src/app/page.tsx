import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="paper-grid min-h-dvh">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Portfolio · rural health OS</p>
        <h1 className="mt-3 font-display text-5xl leading-tight text-teal-dark">AshaLens</h1>
        <p className="mt-4 text-lg text-ink/80">
          Government apps collect data from workers. AshaLens turns the patient’s paper jhola into a safety net — and
          the models that read the paper are ones you train.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-2xl bg-teal px-5 py-3 font-semibold text-cream">
            Open live demo
          </Link>
          <Link href="/demo" className="rounded-2xl border border-sand bg-white px-5 py-3 font-semibold">
            90-second walkthrough
          </Link>
        </div>
        <ul className="mt-10 space-y-3 text-sm leading-relaxed">
          <li>
            <strong>Quality gate + document type</strong> — Logistic Regression and Tiny-MobileNet you train on synthetic papers.
          </li>
          <li>
            <strong>NER</strong> — context LogReg and DistilBERT-tiny tag DRUG/DOSE. A human must confirm.
          </li>
          <li>
            <strong>Follow-up ranker</strong> — Random Forest vs a dumb 30-day rule. Priority, not diagnosis.
          </li>
          <li>
            <strong>Ethics</strong> — no disease models, no real patient photos, Tamil explainers only after confirm.
          </li>
        </ul>
        <p className="mt-8 text-xs text-ink/50">Malligai PHC is synthetic. Not a medical device.</p>
      </div>
    </div>
  );
}
