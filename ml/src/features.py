from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def to_array(image: Image.Image, size: int = 96) -> np.ndarray:
    rgb = image.convert("RGB").resize((size, size))
    return np.asarray(rgb, dtype=np.float32) / 255.0


def brightness(arr: np.ndarray) -> float:
    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    return float(gray.mean() * 255)


def sharpness(arr: np.ndarray) -> float:
    gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    padded = np.pad(gray, 1, mode="edge")
    lap = (
        4 * padded[1:-1, 1:-1]
        - padded[1:-1, :-2]
        - padded[1:-1, 2:]
        - padded[:-2, 1:-1]
        - padded[2:, 1:-1]
    )
    return float(lap.var() * 255 * 255)


def opencv_quality(image: Image.Image) -> np.ndarray:
    try:
        import cv2

        arr = np.asarray(image.convert("RGB"))
        gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
        bright = float(gray.mean())
        lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        return np.array([bright, lap], dtype=np.float32)
    except Exception:
        arr = to_array(image, 96)
        return np.array([brightness(arr), sharpness(arr)], dtype=np.float32)


def quality_features(image: Image.Image) -> np.ndarray:
    return opencv_quality(image)


def doctype_features(image: Image.Image) -> np.ndarray:
    arr = to_array(image, 24)
    hist = []
    for c in range(3):
        h, _ = np.histogram(arr[:, :, c], bins=8, range=(0, 1))
        hist.append(h.astype(np.float32) / (h.sum() + 1e-6))
    return np.concatenate([arr.reshape(-1), *hist])


def degrade(image: Image.Image, kind: str) -> Image.Image:
    if kind == "blur":
        return image.filter(ImageFilter.GaussianBlur(radius=3.2))
    if kind == "dark":
        arr = np.asarray(image.convert("RGB"), dtype=np.float32) * 0.28
        return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return image


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]
