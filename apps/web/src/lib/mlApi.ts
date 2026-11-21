export const ML_API = process.env.NEXT_PUBLIC_ML_API ?? "/ml";

export type ImagePrediction = {
  quality?: string;
  doc_type?: string;
  disclaimer?: string;
};

export type NerPrediction = {
  regex: { drug: string | null; dose: string | null; raw: string };
  entities: { label: string; text: string; confirmed: boolean }[];
  disclaimer: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`ML API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function predictImageFile(file: File): Promise<ImagePrediction> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${ML_API}/predict/image`, { method: "POST", body });
  return parseJson<ImagePrediction>(res);
}

export async function predictNer(text: string): Promise<NerPrediction> {
  const res = await fetch(`${ML_API}/predict/ner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseJson<NerPrediction>(res);
}

export async function speakTamil(text: string) {
  const res = await fetch(`${ML_API}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, confirmed: true }),
  });
  return parseJson<{ audio_url?: string | null; error?: string }>(res);
}

export async function explainDrugApi(drug: string) {
  const res = await fetch(`${ML_API}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug, confirmed: true }),
  });
  return parseJson<{ en: string; ta: string; source: string; audio_url?: string | null }>(res);
}

export type ExtractItem = {
  drug: string;
  generic: string;
  dose: string;
  frequency: string;
  confidence: number;
  needs_review: boolean;
  source: string;
};

export type ExtractVital = {
  field: "bp" | "hb" | "weight";
  label: string;
  bpSystolic?: number;
  bpDiastolic?: number;
  hemoglobin?: number;
  weightKg?: number;
  confidence: number;
  doc_type: "lab_slip" | "mcp_card";
};

export type ExtractResult = {
  quality?: string;
  doc_type?: string;
  raw_text: string;
  source: string;
  items: ExtractItem[];
  vitals?: ExtractVital[];
  alerts: { kind: string; en: string; ta: string }[];
  disclaimer: string;
};

export async function extractDocument(file?: File, text?: string): Promise<ExtractResult> {
  const body = new FormData();
  if (file) body.append("file", file);
  if (text) body.append("text", text);
  const res = await fetch(`${ML_API}/extract`, { method: "POST", body });
  return parseJson<ExtractResult>(res);
}

export async function rankRows(rows: Record<string, number>[]) {
  const res = await fetch(`${ML_API}/predict/rank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return parseJson<{ labels: string[]; proba: number[][]; classes: string[]; reasons?: string[][]; model?: string }>(res);
}
