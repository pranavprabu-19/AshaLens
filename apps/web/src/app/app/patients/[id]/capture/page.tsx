"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { estimateQuality } from "@/lib/imageQuality";
import { patchPatient, loadState } from "@/lib/storage";
import { enqueueCapture } from "@/lib/offlineQueue";
import { predictImageFile, predictNer, extractDocument, type ExtractItem } from "@/lib/mlApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { CapturedDocument, DocumentType, Medicine, QualityEstimate } from "@/lib/types";

const TYPES: { id: DocumentType; label: string }[] = [
  { id: "prescription", label: "Prescription" },
  { id: "lab_slip", label: "Lab slip" },
  { id: "mcp_card", label: "MCP card" },
  { id: "other", label: "Other paper" },
];

export default function CapturePage() {
  const { id } = useParams<{ id: string }>();
  const { patients, refresh } = useStore();
  const router = useRouter();
  const patient = patients.find((p) => p.id === id);

  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<QualityEstimate | null>(null);
  const [docType, setDocType] = useState<DocumentType>("prescription");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("once daily");
  const [ocrLine, setOcrLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState("browser");
  const [items, setItems] = useState<ExtractItem[]>([]);
  const [picked, setPicked] = useState<boolean[]>([]);

  const SAMPLES = [
    "Tab Dolo 650 mg 1-0-1\nTab Glycomet 500 mg BD",
    "Ferrous sulphate 200 mg OD\nShelcal 500 mg OD",
    "Stamlo 5 mg OD\nBrufen 400 mg SOS",
  ];

  if (!patient) return <p>Patient not found.</p>;
  const current = patient;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    const local = await estimateQuality(file);
    setQuality(local);
    try {
      const remote = await predictImageFile(file);
      if (remote.quality) {
        setQuality({
          ...local,
          label: remote.quality as QualityEstimate["label"],
          advice: `Server model: ${remote.quality}. ${local.advice}`,
        });
        setSource("trained-python");
      }
      if (remote.doc_type && TYPES.some((t) => t.id === remote.doc_type)) {
        setDocType(remote.doc_type as DocumentType);
      }
      const extracted = await extractDocument(file);
      applyExtracted(extracted.items);
      setSource(extracted.source);
    } catch {
      await enqueueCapture({
        id: `q-${Date.now()}`,
        patientId: current.id,
        createdAt: new Date().toISOString(),
        note: "ML API offline — used in-browser quality gate",
      });
      setSource("offline-queue");
    }
    setBusy(false);
  }

  function applyExtracted(found: ExtractItem[]) {
    setItems(found);
    setPicked(found.map((item) => !item.needs_review));
    const first = found[0];
    if (!first) return;
    setName(first.drug);
    setDose(first.dose === "unknown" ? "" : first.dose);
    if (first.frequency) setFrequency(first.frequency);
  }

  async function onNer() {
    if (!ocrLine.trim()) return;
    setBusy(true);
    try {
      const ner = await predictNer(ocrLine);
      const drug = ner.entities.find((e) => e.label === "DRUG")?.text || ner.regex.drug;
      const d = ner.entities.find((e) => e.label === "DOSE")?.text || ner.regex.dose;
      if (drug) setName(drug);
      if (d) setDose(d);
    } catch {
      await enqueueCapture({
        id: `n-${Date.now()}`,
        patientId: current.id,
        createdAt: new Date().toISOString(),
        note: "NER offline",
      });
    }
    setBusy(false);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    const extra = loadState().extraByPatient[current.id] ?? {};
    const documents: CapturedDocument[] = [
      ...(extra.documents ?? current.documents),
      {
        id: `doc-${Date.now()}`,
        type: docType,
        quality: quality?.label ?? "ok",
        capturedAt: new Date().toISOString(),
        note: `${source}: ${quality?.advice ?? ""}`,
        dataUrl: preview ?? undefined,
      },
    ];
    const medicines: Medicine[] = [...(extra.medicines ?? current.medicines)];
    items.forEach((item, index) => {
      if (!picked[index]) return;
      medicines.push({
        id: `med-${Date.now()}-${index}`,
        name: item.drug,
        dose: item.dose,
        frequency: item.frequency || frequency,
        confirmed: true,
      });
    });
    if (!items.length && name.trim()) {
      medicines.push({
        id: `med-${Date.now()}`,
        name: name.trim(),
        dose: dose.trim() || "unknown",
        frequency,
        confirmed: true,
      });
    }
    patchPatient(current.id, { documents, medicines });
    refresh();
    router.push(`/app/patients/${current.id}`);
  }

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <p className="text-xs text-ink/50">{current.name}</p>
        <h1 className="font-display text-3xl text-teal-dark">Capture paper</h1>
        <p className="text-sm text-ink/65">
          Trained models suggest quality, type, and fields. You confirm every value. Source: {source}.
        </p>
      </div>

      <label className="block rounded-3xl border border-dashed border-teal/40 bg-white p-4 text-center">
        <span className="font-semibold text-teal-dark">Take or upload a photo</span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="mt-3 block w-full text-sm"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      <div className="grid grid-cols-3 gap-2">
        {SAMPLES.map((sample, index) => (
          <button
            key={sample}
            type="button"
            className="rounded-2xl border border-sand bg-white px-2 py-2 text-xs"
            onClick={() => {
              setOcrLine(sample);
              void extractDocument(undefined, sample).then((result) => {
                applyExtracted(result.items);
                setSource(result.source);
              });
            }}
          >
            Sample {index + 1}
          </button>
        ))}
      </div>

      {items.length ? (
        <Card>
          <h2 className="font-display text-lg">Extracted lines</h2>
          <ul className="mt-2 space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item.drug}-${index}`}
                className={`rounded-2xl border px-3 py-2 text-sm ${item.needs_review ? "border-warn bg-warn/10" : "border-sand bg-white"}`}
              >
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={picked[index] ?? false}
                    onChange={() =>
                      setPicked((currentPicked) => currentPicked.map((value, i) => (i === index ? !value : value)))
                    }
                  />
                  <span>
                    {item.drug} · {item.generic} · {item.dose} · {item.frequency || "timing unknown"}
                    <span className="ml-2 text-xs">{Math.round(item.confidence * 100)}%</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Captured paper" className="max-h-56 w-full rounded-3xl object-cover" />
      ) : null}

      {busy ? <p className="text-sm">Running models…</p> : null}

      {quality ? (
        <Card>
          <p className="text-xs font-semibold uppercase text-teal">Quality gate</p>
          <p className="mt-1 font-display text-2xl capitalize text-teal-dark">{quality.label}</p>
          <p className="text-sm text-ink/70">{quality.advice}</p>
        </Card>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Document type</legend>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <label
              key={t.id}
              className={`rounded-2xl border px-3 py-3 text-sm ${
                docType === t.id ? "border-teal bg-teal/10" : "border-sand bg-white"
              }`}
            >
              <input
                type="radio"
                name="type"
                className="mr-2"
                checked={docType === t.id}
                onChange={() => setDocType(t.id)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <Card>
        <h2 className="font-display text-lg">OCR line then NER</h2>
        <p className="mb-2 text-xs text-ink/55">Type what you can read (Tesseract optional later). Then run NER.</p>
        <Input value={ocrLine} onChange={(e) => setOcrLine(e.target.value)} placeholder="Tab Metformin 500 mg BD" />
        <Button type="button" variant="outline" className="mt-2 w-full py-2" onClick={onNer}>
          Suggest fields from trained NER
        </Button>
      </Card>

      <Card>
        <h2 className="font-display text-lg">Human confirm</h2>
        <label className="block text-sm">
          Medicine name
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ferrous sulphate" />
        </label>
        <label className="mt-2 block text-sm">
          Dose
          <Input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 200 mg" />
        </label>
        <label className="mt-2 block text-sm">
          Frequency
          <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} />
        </label>
      </Card>

      <Button type="submit" className="w-full">
        Save confirmed fields
      </Button>
    </form>
  );
}
