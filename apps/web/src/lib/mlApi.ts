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

export async function explainDrugApi(drug: string) {
  const res = await fetch(`${ML_API}/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drug, confirmed: true }),
  });
  return parseJson<{ en: string; ta: string; source: string }>(res);
}

export async function rankRows(rows: Record<string, number>[]) {
  const res = await fetch(`${ML_API}/predict/rank`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  return parseJson<{ labels: string[]; proba: number[][]; classes: string[] }>(res);
}
