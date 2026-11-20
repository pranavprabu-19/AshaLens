"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertList } from "@/components/AlertList";
import { PHC_NAME } from "@/lib/seed";
import { useStore } from "@/lib/store";
import { evaluateSafety } from "@/lib/safety";
import { toFhirBundle } from "@/lib/fhir";

export default function ConsultSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { patients } = useStore();
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return <p className="text-sm text-alert">Patient not on this roster.</p>;
  }

  const medicines = patient.medicines.filter((m) => m.confirmed);
  const alerts = evaluateSafety(patient);
  const latest = patient.vitals[patient.vitals.length - 1];

  return (
    <article className="space-y-5 text-ink print:space-y-4 print:text-black">
      <header>
        <p className="text-xs uppercase tracking-wide text-ink/50">{PHC_NAME}</p>
        <h1 className="font-display text-4xl leading-tight text-teal-dark">{patient.name}</h1>
        <p className="text-lg text-ink/80">
          {patient.nameTa} · {patient.age} years · {patient.sex}
        </p>
        <p className="text-base">
          {patient.village}
          {patient.pregnant ? ` · pregnant ${patient.gestationalWeek ?? "—"} weeks` : ""}
        </p>
        <p className="text-sm text-ink/70">
          Last visit {patient.lastVisit}
          {patient.nextVisit ? ` · next visit ${patient.nextVisit}` : ""}
        </p>
        <p className="text-sm">
          ABHA {patient.abhaId || "not entered"}. Not checked with ABDM.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl">Confirmed medicines</h2>
        {medicines.length === 0 ? (
          <p className="mt-2 text-base">No confirmed medicines</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-lg">
            {medicines.map((m) => (
              <li key={m.id}>
                <span className="font-semibold">{m.name}</span>
                <span className="text-ink/70">
                  {" "}
                  · {m.dose} · {m.frequency}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl">Safety flags</h2>
        <div className="mt-2">
          <AlertList alerts={alerts} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Latest vital</h2>
        {!latest ? (
          <p className="mt-2 text-base">No vitals yet.</p>
        ) : (
          <p className="mt-2 text-lg">
            {latest.date}
            {latest.bpSystolic ? ` · BP ${latest.bpSystolic}/${latest.bpDiastolic}` : ""}
            {latest.hemoglobin != null ? ` · Hb ${latest.hemoglobin} g/dL` : ""}
            {latest.weightKg != null ? ` · ${latest.weightKg} kg` : ""}
          </p>
        )}
      </section>

      <p className="text-sm leading-snug">
        For the visiting doctor to read. Not a diagnosis. Not an eSanjeevani record. The FHIR file is a local export.
      </p>

      <div className="flex flex-col gap-2 print:hidden">
        <button
          type="button"
          onClick={() => {
            const bundle = toFhirBundle(patient, alerts);
            const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/fhir+json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${patient.id}-consult.json`;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 1500);
          }}
          className="rounded-2xl bg-teal py-3 text-center font-semibold text-cream"
        >
          Download FHIR
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-2xl border border-teal py-3 text-center font-semibold text-teal-dark"
        >
          Print / share
        </button>
        <Link
          href={`/app/patients/${patient.id}`}
          className="rounded-2xl bg-sand px-4 py-3 text-center font-semibold text-teal-dark"
        >
          Back
        </Link>
      </div>
    </article>
  );
}
