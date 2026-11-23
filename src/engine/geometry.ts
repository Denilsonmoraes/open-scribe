import type { Point2D, VectorStroke } from '../types/scribe';

export function distance(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function buildStrokeMetrics(
  points: Point2D[],
  meta?: { color?: string; width?: number; closed?: boolean; fillColor?: string },
): VectorStroke {
  const lengths: number[] = new Array(points.length);
  let total = 0;
  if (points.length > 0) {
    lengths[0] = 0;
    for (let i = 1; i < points.length; i++) {
      total += distance(points[i - 1], points[i]);
      lengths[i] = total;
    }
  }
  return {
    points,
    lengths,
    totalLength: total,
    color: meta?.color,
    width: meta?.width,
    closed: meta?.closed,
    fillColor: meta?.fillColor,
  };
}

/**
 * Ramer-Douglas-Peucker polyline simplification.
 */
export function simplifyRDP(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2 || epsilon <= 0) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lineLenSq = dx * dx + dy * dy;

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    let dist: number;
    if (lineLenSq === 0) {
      dist = Math.hypot(p.x - start.x, p.y - start.y);
    } else {
      const t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / lineLenSq;
      const projX = start.x + t * dx;
      const projY = start.y + t * dy;
      dist = Math.hypot(p.x - projX, p.y - projY);
    }
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyRDP(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyRDP(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [start, end];
}

/**
 * Greedy nearest-neighbor stroke ordering so the drawing hand moves naturally
 * from the end of one stroke to the closest endpoint of the next stroke.
 */
export function orderStrokesGreedy(strokes: VectorStroke[]): VectorStroke[] {
  if (strokes.length <= 1) return strokes;
  const remaining = strokes.filter((s) => s.points.length >= 2);
  if (remaining.length <= 1) return remaining;

  // Start near top-leftmost stroke for natural left-to-right / top-to-bottom whiteboard feel
  let startIdx = 0;
  let bestTopLeft = Infinity;
  for (let i = 0; i < remaining.length; i++) {
    const p = remaining[i].points[0];
    const score = p.x * 0.7 + p.y;
    if (score < bestTopLeft) {
      bestTopLeft = score;
      startIdx = i;
    }
  }

  const ordered: VectorStroke[] = [];
  const used = new Uint8Array(remaining.length);
  let current = remaining[startIdx];
  used[startIdx] = 1;
  ordered.push(current);
  let pen = current.points[current.points.length - 1];

  for (let step = 1; step < remaining.length; step++) {
    let bestIdx = -1;
    let bestDist = Infinity;
    let reverseBest = false;

    for (let i = 0; i < remaining.length; i++) {
      if (used[i]) continue;
      const pts = remaining[i].points;
      const dStart = distance(pen, pts[0]);
      if (dStart < bestDist) {
        bestDist = dStart;
        bestIdx = i;
        reverseBest = false;
      }
      // Only reverse open strokes (closed loops look fine either way, open contours benefit hugely)
      const dEnd = distance(pen, pts[pts.length - 1]);
      if (!remaining[i].closed && dEnd < bestDist) {
        bestDist = dEnd;
        bestIdx = i;
        reverseBest = true;
      }
    }

    if (bestIdx === -1) break;
    used[bestIdx] = 1;
    const chosen = remaining[bestIdx];
    const finalStroke = reverseBest
      ? buildStrokeMetrics([...chosen.points].reverse(), {
          color: chosen.color,
          width: chosen.width,
          closed: chosen.closed,
          fillColor: chosen.fillColor,
        })
      : chosen;
    ordered.push(finalStroke);
    pen = finalStroke.points[finalStroke.points.length - 1];
  }

  return ordered;
}

/**
 * Normalizes a list of raw strokes into [0..1] square space preserving aspect ratio,
 * centered inside the unit square or tightly fitted with aspectRatio = rawW / rawH.
 */
export function normalizeStrokes(
  rawStrokes: VectorStroke[],
  padding = 0.02,
): { strokes: VectorStroke[]; aspectRatio: number } {
  const valid = rawStrokes.filter((s) => s.points.length >= 2);
  if (valid.length === 0) {
    return { strokes: [], aspectRatio: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of valid) {
    for (const p of s.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  const rawW = Math.max(1e-4, maxX - minX);
  const rawH = Math.max(1e-4, maxY - minY);
  const scaleSpan = 1 - padding * 2;

  const normalized = valid.map((s) => {
    const pts = s.points.map((p) => ({
      x: padding + ((p.x - minX) / rawW) * scaleSpan,
      y: padding + ((p.y - minY) / rawH) * scaleSpan,
    }));
    return buildStrokeMetrics(pts, {
      color: s.color,
      width: s.width,
      closed: s.closed,
      fillColor: s.fillColor,
    });
  });

  return {
    strokes: orderStrokesGreedy(normalized),
    aspectRatio: rawW / rawH,
  };
}

/**
 * Samples point at exact arc-length `targetLen` along a VectorStroke.
 */
export function sampleStrokeAtLength(stroke: VectorStroke, targetLen: number): {
  point: Point2D;
  endIndex: number;
} {
  const pts = stroke.points;
  const lens = stroke.lengths;
  if (pts.length === 0) {
    return { point: { x: 0.5, y: 0.5 }, endIndex: 0 };
  }
  if (targetLen <= 0) {
    return { point: pts[0], endIndex: 0 };
  }
  if (targetLen >= stroke.totalLength) {
    return { point: pts[pts.length - 1], endIndex: pts.length - 1 };
  }

  // Binary search segment
  let lo = 0;
  let hi = lens.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lens[mid] <= targetLen) lo = mid;
    else hi = mid;
  }

  const segStartLen = lens[lo];
  const segEndLen = lens[lo + 1];
  const segLen = segEndLen - segStartLen;
  const t = segLen > 1e-9 ? (targetLen - segStartLen) / segLen : 0;

  return {
    point: {
      x: pts[lo].x + (pts[lo + 1].x - pts[lo].x) * t,
      y: pts[lo].y + (pts[lo + 1].y - pts[lo].y) * t,
    },
    endIndex: lo,
  };
}

export function totalStrokesLength(strokes: VectorStroke[]): number {
  let sum = 0;
  for (const s of strokes) sum += Math.max(0.01, s.totalLength);
  return sum;
}
