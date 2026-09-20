"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { evaluateSafety, rankPatients } from "@/lib/safety";
import { PHC_NAME } from "@/lib/seed";

export default function HomePage() {
  const { patients, session } = useStore();
  const ranked = rankPatients(patients);
  const high = ranked.filter((p) => evaluateSafety(p).some((a) => a.severity === "high")).length;
  const pregnant = patients.filter((p) => p.pregnant).length;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-teal-dark p-5 text-cream">
        <p className="text-xs uppercase tracking-[0.18em] text-sand">Today at {PHC_NAME}</p>
        <h1 className="mt-2 font-display text-3xl">
          {session?.role === "asha" ? "Your village list" : "Doctor visit briefing"}
        </h1>
        <p className="mt-2 text-sm text-cream/80">
          {patients.length} people on this roster · {high} high safety flags · {pregnant} pregnancies
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/week" className="rounded-3xl bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-warn">This week</p>
          <p className="mt-2 font-display text-2xl text-teal-dark">{ranked[0]?.name ?? "—"}</p>
          <p className="text-xs text-ink/60">Highest priority household</p>
        </Link>
        <Link href="/app/patients" className="rounded-3xl bg-white p-4 shadow-card">
          <p className="text-xs font-semibold uppercase text-teal">Capture</p>
          <p className="mt-2 font-display text-2xl text-teal-dark">Paper first</p>
          <p className="text-xs text-ink/60">Photo a slip, confirm fields</p>
        </Link>
      </div>

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-display text-xl">Needs a visit</h2>
          <Link href="/app/week" className="text-sm text-teal">
            Full week view
          </Link>
        </div>
        <ul className="space-y-2">
          {ranked.slice(0, 4).map((p) => {
            const alerts = evaluateSafety(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/app/patients/${p.id}`}
                  className="block rounded-2xl border border-sand bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-ink/55">
                        {p.village} · {p.age}y · {p.pregnant ? `ANC ${p.gestationalWeek}w` : p.sex}
                      </p>
                    </div>
                    <span className="rounded-full bg-alert/10 px-2 py-1 text-[11px] font-semibold text-alert">
                      {alerts.length} flags
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
