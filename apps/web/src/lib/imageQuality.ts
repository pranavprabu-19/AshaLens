import type { QualityEstimate } from "./types";

function laplacianVar(gray: number[], width: number, height: number) {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const i = y * width + x;
      const v =
        4 * gray[i] -
        gray[i - 1] -
        gray[i + 1] -
        gray[i - width] -
        gray[i + width];
      sum += v;
      sumSq += v * v;
      n += 1;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

export async function estimateQuality(file: File): Promise<QualityEstimate> {
  const bitmap = await createImageBitmap(file);
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { label: "ok", brightness: 0, sharpness: 0, advice: "Could not read image." };
  }
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const gray: number[] = [];
  let brightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray.push(g);
    brightness += g;
  }
  brightness /= gray.length;
  const sharpness = laplacianVar(gray, size, size);

  let label: QualityEstimate["label"] = "ok";
  let advice = "Photo looks usable. Confirm the extracted fields before saving.";
  if (brightness < 55) {
    label = "dark";
    advice = "Too dark. Step into daylight or turn on the torch and retake.";
  } else if (sharpness < 90) {
    label = "blur";
    advice = "Too blurry. Hold the phone steady and fill the frame with the paper.";
  }

  return {
    label,
    brightness: Math.round(brightness),
    sharpness: Math.round(sharpness),
    advice,
  };
}
