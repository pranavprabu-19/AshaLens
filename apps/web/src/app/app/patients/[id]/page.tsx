"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { AlertList } from "@/components/AlertList";
import { VitalForm } from "@/components/VitalForm";
import { evaluateSafety, explainDrug } from "@/lib/safety";
import { ASHAS } from "@/lib/seed";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { patients } = useStore();
  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return <p className="text-sm text-alert">Patient not on this roster.</p>;
  }

  const alerts = evaluateSafety(patient);
  const asha = ASHAS.find((a) => a.id === patient.ashaId);
  const latest = patient.vitals[patient.vitals.length - 1];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/50">{patient.village}</p>
        <h1 className="font-display text-3xl text-teal-dark">{patient.name}</h1>
        <p className="text-sm text-ink/60">
          {patient.nameTa} · {patient.age} years · {patient.sex}
          {patient.pregnant ? ` · pregnant ${patient.gestationalWeek}w` : ""}
        </p>
        <p className="text-xs text-ink/50">ASHA {asha?.name}</p>
      </div>

      <Link
        href={`/app/patients/${patient.id}/capture`}
        className="block rounded-2xl bg-teal py-3 text-center font-semibold text-cream"
      >
        Photograph a paper slip
      </Link>

      <AlertList alerts={alerts} />

      <section className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-lg">Vitals timeline</h2>
        {patient.vitals.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No vitals yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {patient.vitals.map((v) => (
              <li key={v.date} className="flex justify-between border-b border-sand py-2 last:border-0">
                <span className="text-ink/55">{v.date}</span>
                <span>
                  {v.bpSystolic ? `${v.bpSystolic}/${v.bpDiastolic}` : "—"}
                  {v.hemoglobin ? ` · Hb ${v.hemoglobin}` : ""}
                  {v.weightKg ? ` · ${v.weightKg} kg` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        {latest?.bpSystolic ? (
          <p className="mt-2 text-xs text-ink/55">Latest BP {latest.bpSystolic}/{latest.bpDiastolic}. Trend is for the visiting doctor, not a diagnosis.</p>
        ) : null}
        <VitalForm patient={patient} onSaved={() => undefined} />
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-lg">Medicines</h2>
        <ul className="mt-2 space-y-3">
          {patient.medicines.map((m) => {
            const explain = explainDrug(m.name);
            return (
              <li key={m.id} className="rounded-2xl bg-paper px-3 py-3">
                <p className="font-semibold">
                  {m.name}{" "}
                  <span className="text-xs font-normal text-ink/50">
                    {m.dose} · {m.frequency}
                  </span>
                </p>
                {explain ? (
                  <>
                    <p className="mt-1 text-sm text-ink/75">{explain.en}</p>
                    <p className="text-sm text-teal-dark">{explain.ta}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-ink/50">No plain-language card yet. Confirm with the doctor.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {patient.documents.length > 0 ? (
        <section className="rounded-3xl bg-white p-4 shadow-card">
          <h2 className="font-display text-lg">Captured papers</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {patient.documents.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>
                  {d.type.replace("_", " ")} · {d.quality}
                </span>
                <span className="text-ink/50">{new Date(d.capturedAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
