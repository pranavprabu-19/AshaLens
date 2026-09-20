"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { evaluateSafety } from "@/lib/safety";

export default function PatientsPage() {
  const { patients } = useStore();

  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl text-teal-dark">Patients</h1>
      <p className="text-sm text-ink/65">Synthetic roster only. Open a card, then capture a paper slip.</p>
      <ul className="space-y-2">
        {patients.map((p) => {
          const alerts = evaluateSafety(p);
          const high = alerts.filter((a) => a.severity === "high").length;
          return (
            <li key={p.id}>
              <Link href={`/app/patients/${p.id}`} className="block rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-ink/50">{p.nameTa}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {p.village} · last visit {p.lastVisit}
                    </p>
                  </div>
                  <span
                    className={
                      high
                        ? "rounded-full bg-alert/10 px-2 py-1 text-[11px] font-semibold text-alert"
                        : "rounded-full bg-ok/10 px-2 py-1 text-[11px] font-semibold text-ok"
                    }
                  >
                    {high ? `${high} high` : "stable"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
