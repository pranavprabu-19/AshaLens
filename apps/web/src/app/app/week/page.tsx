"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { briefingText, evaluateSafety, followUpScore, patientFeatures, rankPatients } from "@/lib/safety";
import { rankRows } from "@/lib/mlApi";
import { Button } from "@/components/ui/button";

export default function WeekPage() {
  const { patients, session } = useStore();
  const ranked = rankPatients(patients);
  const [modelLabels, setModelLabels] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[][]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const order = rankPatients(patients);
    rankRows(order.map(patientFeatures))
      .then((res) => {
        setModelLabels(res.labels ?? []);
        setReasons(res.reasons ?? []);
      })
      .catch(() => setModelLabels([]));
  }, [patients]);

  const text = briefingText(patients, session?.name ?? "clinician");

  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl text-teal-dark">This week</h1>
      <p className="text-sm text-ink/65">
        Rule score always shows. Random Forest labels appear when the ML API is running.
      </p>
      {session?.role === "doctor" ? (
        <Button
          type="button"
          variant="outline"
          className="w-full py-2"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? "Briefing copied" : "Copy doctor briefing"}
        </Button>
      ) : null}
      <pre className="hidden whitespace-pre-wrap print:block">{text}</pre>
      <ol className="space-y-2">
        {ranked.map((p, i) => {
          const alerts = evaluateSafety(p);
          return (
            <li key={p.id}>
              <Link href={`/app/patients/${p.id}`} className="block rounded-2xl bg-white px-4 py-3 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-sand font-display text-teal-dark">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-ink/55">
                      {p.village} · rule {followUpScore(p)}
                      {modelLabels[i] ? ` · model ${modelLabels[i]}` : ""} ·{" "}
                      {alerts.map((a) => a.kind.replace("_", " ")).join(", ") || "no flags"}
                    </p>
                    {reasons[i]?.length ? (
                      <p className="text-xs text-teal">Why: {reasons[i].join(", ")}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
