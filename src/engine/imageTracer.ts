import type { Point2D, TraceConfig, VectorStroke } from '../types/scribe';
import { buildStrokeMetrics, normalizeStrokes, simplifyRDP } from './geometry';

const NEIGHBORS: ReadonlyArray<[number, number]> = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

/**
 * Zhang-Suen iterative binary thinning algorithm (0/1 mask -> 1px centerlines).
 */
function zhangSuenThin(mask: Uint8Array, w: number, h: number, maxIter = 36): void {
  const toRemove = new Uint8Array(w * h);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    for (let step = 0; step < 2; step++) {
      toRemove.fill(0);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (mask[idx] === 0) continue;

          const p2 = mask[(y - 1) * w + x];
          const p3 = mask[(y - 1) * w + (x + 1)];
          const p4 = mask[y * w + (x + 1)];
          const p5 = mask[(y + 1) * w + (x + 1)];
          const p6 = mask[(y + 1) * w + x];
          const p7 = mask[(y + 1) * w + (x - 1)];
          const p8 = mask[y * w + (x - 1)];
          const p9 = mask[(y - 1) * w + (x - 1)];

          const neighbors = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (neighbors < 2 || neighbors > 6) continue;

          let transitions = 0;
          if (p2 === 0 && p3 === 1) transitions++;
          if (p3 === 0 && p4 === 1) transitions++;
          if (p4 === 0 && p5 === 1) transitions++;
          if (p5 === 0 && p6 === 1) transitions++;
          if (p6 === 0 && p7 === 1) transitions++;
          if (p7 === 0 && p8 === 1) transitions++;
          if (p8 === 0 && p9 === 1) transitions++;
          if (p9 === 0 && p2 === 1) transitions++;
          if (transitions !== 1) continue;

          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }

          toRemove[idx] = 1;
          changed = true;
        }
      }

      for (let i = 0; i < toRemove.length; i++) {
        if (toRemove[i]) mask[i] = 0;
      }
    }

    if (!changed) break;
  }
}

/**
 * Generates a 1px binary edge skeleton from RGBA pixels using Sobel + Non-Maximum Suppression.
 */
function detectContourEdges(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  sensitivity: number,
): Uint8Array {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    const a = rgba[o + 3] / 255;
    // Composite transparent backgrounds against white paper so silhouettes trace cleanly
    const r = rgba[o] * a + 255 * (1 - a);
    const g = rgba[o + 1] * a + 255 * (1 - a);
    const b = rgba[o + 2] * a + 255 * (1 - a);
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Light 3x3 Gaussian blur to avoid pixel noise (replicate edges to prevent fake border box)
  const blurred = new Float32Array(lum);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      blurred[i] =
        (lum[i - w - 1] +
          2 * lum[i - w] +
          lum[i - w + 1] +
          2 * lum[i - 1] +
          4 * lum[i] +
          2 * lum[i + 1] +
          lum[i + w - 1] +
          2 * lum[i + w] +
          lum[i + w + 1]) /
        16;
    }
  }

  const mag = new Float32Array(w * h);
  const gxArr = new Float32Array(w * h);
  const gyArr = new Float32Array(w * h);
  let maxMag = 1;

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x;
      const gx =
        -blurred[i - w - 1] +
        blurred[i - w + 1] -
        2 * blurred[i - 1] +
        2 * blurred[i + 1] -
        blurred[i + w - 1] +
        blurred[i + w + 1];
      const gy =
        -blurred[i - w - 1] -
        2 * blurred[i - w] -
        blurred[i - w + 1] +
        blurred[i + w - 1] +
        2 * blurred[i + w] +
        blurred[i + w + 1];
      const m = Math.hypot(gx, gy);
      mag[i] = m;
      gxArr[i] = gx;
      gyArr[i] = gy;
      if (m > maxMag) maxMag = m;
    }
  }

  // Threshold inversely proportional to sensitivity (high sensitivity = lower threshold)
  const normSens = Math.max(5, Math.min(98, sensitivity)) / 100;
  const thresh = Math.max(18, maxMag * (1 - normSens) * 0.48);
  const mask = new Uint8Array(w * h);

  // Non-Maximum Suppression along gradient direction
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const m = mag[i];
      if (m < thresh) continue;

      const angle = ((Math.atan2(gyArr[i], gxArr[i]) * 180) / Math.PI + 180) % 180;
      let q = 0;
      let r = 0;
      if (angle < 22.5 || angle >= 157.5) {
        q = mag[i + 1];
        r = mag[i - 1];
      } else if (angle < 67.5) {
        q = mag[i + w - 1];
        r = mag[i - w + 1];
      } else if (angle < 112.5) {
        q = mag[i + w];
        r = mag[i - w];
      } else {
        q = mag[i - w - 1];
        r = mag[i + w + 1];
      }

      if (m >= q && m >= r) {
        mask[i] = 1;
      }
    }
  }

  zhangSuenThin(mask, w, h, 8);
  return mask;
}

/**
 * Generates a 1px binary centerline skeleton from line-art/sketch RGBA pixels.
 */
function detectLineArtSkeleton(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  sensitivity: number,
  invert: boolean,
): Uint8Array {
  const mask = new Uint8Array(w * h);
  // Sensitivity 0..100 maps luminance threshold from 80..230
  const cutoff = 70 + (Math.max(5, Math.min(98, sensitivity)) / 100) * 165;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const o = i * 4;
      const alpha = rgba[o + 3];
      if (alpha < 40) continue;

      const lum = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
      const isInk = invert ? lum > 255 - cutoff : lum < cutoff;
      if (isInk) mask[i] = 1;
    }
  }

  zhangSuenThin(mask, w, h, 36);
  return mask;
}

/**
 * Walks 8-connected chains from a thinned 1px binary mask into ordered polylines.
 */
function extractChains(mask: Uint8Array, w: number, h: number): Point2D[][] {
  const visited = new Uint8Array(w * h);
  const degree = (x: number, y: number): number => {
    let d = 0;
    for (const [dx, dy] of NEIGHBORS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx]) d++;
    }
    return d;
  };

  const traceFrom = (sx: number, sy: number): Point2D[] => {
    const chain: Point2D[] = [{ x: sx, y: sy }];
    visited[sy * w + sx] = 1;
    let cx = sx;
    let cy = sy;
    let prevDx = 0;
    let prevDy = 0;

    while (true) {
      let nextX = -1;
      let nextY = -1;
      let bestScore = -Infinity;

      for (const [dx, dy] of NEIGHBORS) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nIdx = ny * w + nx;
        if (!mask[nIdx] || visited[nIdx]) continue;

        // Prefer 4-connected neighbors and directional continuity
        const orthoBonus = dx === 0 || dy === 0 ? 0.5 : 0;
        const dirDot = prevDx * dx + prevDy * dy;
        const score = dirDot + orthoBonus;
        if (score > bestScore) {
          bestScore = score;
          nextX = nx;
          nextY = ny;
        }
      }

      if (nextX === -1) break;
      visited[nextY * w + nextX] = 1;
      chain.push({ x: nextX, y: nextY });
      prevDx = nextX - cx;
      prevDy = nextY - cy;
      cx = nextX;
      cy = nextY;
    }

    return chain;
  };

  const chains: Point2D[][] = [];

  // Pass 1: start from endpoints (degree == 1) for clean open curves
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!mask[idx] || visited[idx]) continue;
      if (degree(x, y) === 1) {
        const chain = traceFrom(x, y);
        if (chain.length >= 3) chains.push(chain);
      }
    }
  }

  // Pass 2: remaining closed loops & junctions
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (!mask[idx] || visited[idx]) continue;
      const chain = traceFrom(x, y);
      if (chain.length >= 4) chains.push(chain);
    }
  }

  return chains;
}

/**
 * Pure TypeScript auto-vectorizer: converts RGBA pixel data (PNG/JPG/WebP)
 * into clean, ordered, normalized VectorStrokes ready to be hand-drawn.
 */
export function traceImageDataToStrokes(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  config: TraceConfig,
): { strokes: VectorStroke[]; aspectRatio: number } {
  const mask =
    config.mode === 'lineart'
      ? detectLineArtSkeleton(rgba, width, height, config.sensitivity, config.invert)
      : detectContourEdges(rgba, width, height, config.sensitivity);

  const chains = extractChains(mask, width, height);
  const epsilon = Math.max(0.5, config.detail);

  const rawStrokes: VectorStroke[] = [];
  for (const chain of chains) {
    const simplified = simplifyRDP(chain, epsilon);
    if (simplified.length >= 2) {
      rawStrokes.push(buildStrokeMetrics(simplified));
    }
  }

  const normalized = normalizeStrokes(rawStrokes);
  return {
    strokes: normalized.strokes,
    aspectRatio: width / Math.max(1, height),
  };
}

/**
 * Browser helper: decodes a PNG/JPG/WebP File or DataURL into normalized VectorStrokes
 * plus an optimized DataURL for fill-reveal.
 */
export async function traceImageUrlToVectors(
  dataUrl: string,
  config: TraceConfig,
  maxWorkDim = 340,
): Promise<{
  strokes: VectorStroke[];
  aspectRatio: number;
  width: number;
  height: number;
}> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Falha ao carregar imagem para vetorização.'));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxWorkDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(16, Math.round(img.naturalWidth * scale));
  const h = Math.max(16, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Contexto 2D indisponível.');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const result = traceImageDataToStrokes(imgData.data, w, h, config);

  return {
    strokes: result.strokes,
    aspectRatio: img.naturalWidth / Math.max(1, img.naturalHeight),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}
