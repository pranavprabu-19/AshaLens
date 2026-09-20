"use client";

import { FormEvent, useState } from "react";
import { useStore } from "@/lib/store";
import { patchPatient, loadState } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Patient, Vital } from "@/lib/types";

export function VitalForm({ patient, onSaved }: { patient: Patient; onSaved: () => void }) {
  const { refresh } = useStore();
  const [bp, setBp] = useState("");
  const [hb, setHb] = useState("");
  const [weight, setWeight] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const extra = loadState().extraByPatient[patient.id] ?? {};
    const vitals: Vital[] = [...(extra.vitals ?? patient.vitals)];
    const [sys, dia] = bp.split("/").map((p) => Number(p.trim()));
    vitals.push({
      date: new Date().toISOString().slice(0, 10),
      bpSystolic: Number.isFinite(sys) ? sys : undefined,
      bpDiastolic: Number.isFinite(dia) ? dia : undefined,
      hemoglobin: hb ? Number(hb) : undefined,
      weightKg: weight ? Number(weight) : undefined,
    });
    patchPatient(patient.id, { vitals });
    refresh();
    onSaved();
    setBp("");
    setHb("");
    setWeight("");
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 border-t border-sand pt-3">
      <p className="text-sm font-semibold">Add vitals (manual)</p>
      <label className="block text-xs">
        BP (120/80)
        <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="120/80" />
      </label>
      <label className="block text-xs">
        Hb
        <Input value={hb} onChange={(e) => setHb(e.target.value)} placeholder="11.0" />
      </label>
      <label className="block text-xs">
        Weight kg
        <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="54" />
      </label>
      <Button type="submit" className="w-full py-2">
        Save vitals
      </Button>
    </form>
  );
}
