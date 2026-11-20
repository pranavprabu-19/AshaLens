"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { AlertList } from "@/components/AlertList";
import { VitalForm } from "@/components/VitalForm";
import { evaluateSafety, explainDrug } from "@/lib/safety";
import { ASHAS } from "@/lib/seed";
import { patchPatient } from "@/lib/storage";

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const { patients, refresh } = useStore();
  const patient = patients.find((p) => p.id === id);
  const [abha, setAbha] = useState("");
  const [abhaNote, setAbhaNote] = useState("");

  if (!patient) {
    return <p className="text-sm text-alert">Patient not on this roster.</p>;
  }

  const record = patient;
  const alerts = evaluateSafety(record);
  const asha = ASHAS.find((a) => a.id === record.ashaId);
  const latest = record.vitals[record.vitals.length - 1];

  function onAbha(event: FormEvent) {
    event.preventDefault();
    const digits = abha.replace(/\D/g, "");
    if (digits && digits.length !== 14) {
      setAbhaNote("ABHA is 14 digits. Leave it blank if you do not have one.");
      return;
    }
    patchPatient(record.id, { abhaId: digits });
    refresh();
    setAbhaNote(digits ? "Saved on this phone. Not checked with ABDM." : "Cleared.");
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink/50">{record.village}</p>
        <h1 className="font-display text-3xl text-teal-dark">{record.name}</h1>
        <p className="text-sm text-ink/60">
          {record.nameTa} · {record.age} years · {record.sex}
          {record.pregnant ? ` · pregnant ${record.gestationalWeek}w` : ""}
        </p>
        <p className="text-xs text-ink/50">ASHA {asha?.name}</p>
      </div>

      <Link
        href={`/app/patients/${record.id}/capture`}
        className="block rounded-2xl bg-teal py-3 text-center font-semibold text-cream"
      >
        Photograph a paper slip
      </Link>
      <Link
        href={`/app/patients/${record.id}/summary`}
        className="block rounded-2xl border border-teal py-3 text-center font-semibold text-teal-dark"
      >
        Show for consult
      </Link>

      <form onSubmit={onAbha} className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-lg">ABHA</h2>
        <p className="mt-1 text-xs text-ink/55">Not checked with ABDM. Optional.</p>
        <p className="mt-1 text-sm">{record.abhaId ? record.abhaId : "No number saved."}</p>
        <input
          value={abha}
          onChange={(event) => setAbha(event.target.value)}
          inputMode="numeric"
          placeholder="14 digits"
          className="mt-2 w-full rounded-2xl border border-sand bg-paper px-3 py-2 text-sm"
        />
        <button type="submit" className="mt-2 rounded-2xl bg-sand px-3 py-2 text-sm font-semibold text-teal-dark">
          Save ABHA
        </button>
        {abhaNote ? <p className="mt-2 text-xs text-ink/60">{abhaNote}</p> : null}
      </form>

      <AlertList alerts={alerts} />

      <section className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-lg">Vitals timeline</h2>
        {record.vitals.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">No vitals yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {record.vitals.map((v) => (
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
        <VitalForm patient={record} onSaved={() => undefined} />
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-card">
        <h2 className="font-display text-lg">Medicines</h2>
        <ul className="mt-2 space-y-3">
          {record.medicines.map((m) => {
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

      {record.documents.length > 0 ? (
        <section className="rounded-3xl bg-white p-4 shadow-card">
          <h2 className="font-display text-lg">Captured papers</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {record.documents.map((d) => (
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
