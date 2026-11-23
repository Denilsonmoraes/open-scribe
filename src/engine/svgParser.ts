import type { Point2D, VectorStroke } from '../types/scribe';
import { buildStrokeMetrics, normalizeStrokes } from './geometry';

type Mat2D = [number, number, number, number, number, number]; // [a, b, c, d, e, f]

const IDENTITY: Mat2D = [1, 0, 0, 1, 0, 0];

function mulMat(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMat(m: Mat2D, p: Point2D): Point2D {
  return {
    x: m[0] * p.x + m[2] * p.y + m[4],
    y: m[1] * p.x + m[3] * p.y + m[5],
  };
}

function parseTransform(attr: string | undefined): Mat2D {
  if (!attr) return IDENTITY;
  let result: Mat2D = [...IDENTITY];
  const regex = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attr)) !== null) {
    const fn = match[1].toLowerCase();
    const args = match[2]
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    let m: Mat2D = IDENTITY;
    if (fn === 'translate') {
      m = [1, 0, 0, 1, args[0] || 0, args[1] || 0];
    } else if (fn === 'scale') {
      const sx = args[0] ?? 1;
      const sy = args[1] ?? sx;
      m = [sx, 0, 0, sy, 0, 0];
    } else if (fn === 'rotate') {
      const rad = ((args[0] || 0) * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      if (args.length >= 3) {
        const cx = args[1];
        const cy = args[2];
        m = mulMat(mulMat([1, 0, 0, 1, cx, cy], [cos, sin, -sin, cos, 0, 0]), [
          1,
          0,
          0,
          1,
          -cx,
          -cy,
        ]);
      } else {
        m = [cos, sin, -sin, cos, 0, 0];
      }
    } else if (fn === 'matrix' && args.length >= 6) {
      m = [args[0], args[1], args[2], args[3], args[4], args[5]];
    }
    result = mulMat(result, m);
  }
  return result;
}

/**
 * Evaluates a cubic Bezier curve into adaptive polyline segments.
 */
function sampleCubic(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  steps = 14,
): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    pts.push({
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y,
    });
  }
  return pts;
}

function sampleQuadratic(p0: Point2D, p1: Point2D, p2: Point2D, steps = 10): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    });
  }
  return pts;
}

/**
 * Converts SVG elliptical arc (W3C F.6.5/F.6.6 implementation) into polyline points.
 */
function sampleSvgArc(
  p0: Point2D,
  rxIn: number,
  ryIn: number,
  xAxisRotDeg: number,
  largeArc: number,
  sweep: number,
  p1: Point2D,
): Point2D[] {
  if (p0.x === p1.x && p0.y === p1.y) return [];
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [p1];

  const phi = (xAxisRotDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (p0.x - p1.x) / 2;
  const dy2 = (p0.y - p1.y) / 2;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const num = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq);
  const den = rxSq * y1pSq + rySq * x1pSq;
  const coef = sign * Math.sqrt(den > 0 ? num / den : 0);

  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (p0.x + p1.x) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (p0.y + p1.y) / 2;

  const vecAngle = (ux: number, uy: number, vx: number, vy: number) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    const ratio = len > 0 ? Math.max(-1, Math.min(1, dot / len)) : 1;
    let ang = Math.acos(ratio);
    if (ux * vy - uy * vx < 0) ang = -ang;
    return ang;
  };

  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vecAngle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );

  if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

  const steps = Math.max(8, Math.ceil((Math.abs(dTheta) / (Math.PI * 2)) * 32));
  const pts: Point2D[] = [];
  for (let i = 1; i <= steps; i++) {
    const theta = theta1 + (dTheta * i) / steps;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    pts.push({
      x: cosPhi * rx * cosT - sinPhi * ry * sinT + cx,
      y: sinPhi * rx * cosT + cosPhi * ry * sinT + cy,
    });
  }
  return pts;
}

/**
 * Tokenizes an SVG path `d` string handling condensed numbers, signs and arc flags.
 */
function tokenizePath(d: string): string[] {
  const tokens: string[] = [];
  const re = /([a-zA-Z])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    tokens.push(m[0]);
  }
  return tokens;
}

export function parseSvgPathD(
  d: string,
  transform: Mat2D = IDENTITY,
  style?: { color?: string; width?: number; fillColor?: string },
): VectorStroke[] {
  const tokens = tokenizePath(d);
  const strokes: VectorStroke[] = [];
  let currentPts: Point2D[] = [];
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let lastCtrlX = 0;
  let lastCtrlY = 0;
  let lastCmd = '';
  let idx = 0;

  const flush = (closed = false) => {
    if (currentPts.length >= 2) {
      const transformed = currentPts.map((p) => applyMat(transform, p));
      strokes.push(
        buildStrokeMetrics(transformed, {
          color: style?.color,
          width: style?.width,
          closed,
          fillColor: style?.fillColor,
        }),
      );
    }
    currentPts = [];
  };

  const nextNum = (): number => {
    const val = Number(tokens[idx++]);
    return Number.isFinite(val) ? val : 0;
  };

  const isCmd = (tok: string | undefined) => Boolean(tok && /^[a-zA-Z]$/.test(tok));

  let activeCmd = '';
  while (idx < tokens.length) {
    if (isCmd(tokens[idx])) {
      activeCmd = tokens[idx++];
      if (activeCmd === 'Z' || activeCmd === 'z') {
        if (currentPts.length > 0 && (cx !== startX || cy !== startY)) {
          currentPts.push({ x: startX, y: startY });
        }
        cx = startX;
        cy = startY;
        flush(true);
        lastCmd = activeCmd;
        continue;
      }
    } else if (!activeCmd) {
      idx++;
      continue;
    }

    const rel = activeCmd === activeCmd.toLowerCase();
    const cmd = activeCmd.toUpperCase();

    if (cmd === 'M') {
      flush(false);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      cx = x;
      cy = y;
      startX = x;
      startY = y;
      currentPts.push({ x, y });
      // Subsequent coordinate pairs after M are implicit L/l
      activeCmd = rel ? 'l' : 'L';
      lastCmd = 'M';
    } else if (cmd === 'L') {
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      cx = x;
      cy = y;
      currentPts.push({ x, y });
      lastCmd = 'L';
    } else if (cmd === 'H') {
      const x = nextNum() + (rel ? cx : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      cx = x;
      currentPts.push({ x: cx, y: cy });
      lastCmd = 'H';
    } else if (cmd === 'V') {
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      cy = y;
      currentPts.push({ x: cx, y: cy });
      lastCmd = 'V';
    } else if (cmd === 'C') {
      const x1 = nextNum() + (rel ? cx : 0);
      const y1 = nextNum() + (rel ? cy : 0);
      const x2 = nextNum() + (rel ? cx : 0);
      const y2 = nextNum() + (rel ? cy : 0);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      currentPts.push(...sampleCubic({ x: cx, y: cy }, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }));
      lastCtrlX = x2;
      lastCtrlY = y2;
      cx = x;
      cy = y;
      lastCmd = 'C';
    } else if (cmd === 'S') {
      const prevWasCubic = lastCmd === 'C' || lastCmd === 'S';
      const x1 = prevWasCubic ? 2 * cx - lastCtrlX : cx;
      const y1 = prevWasCubic ? 2 * cy - lastCtrlY : cy;
      const x2 = nextNum() + (rel ? cx : 0);
      const y2 = nextNum() + (rel ? cy : 0);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      currentPts.push(...sampleCubic({ x: cx, y: cy }, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }));
      lastCtrlX = x2;
      lastCtrlY = y2;
      cx = x;
      cy = y;
      lastCmd = 'S';
    } else if (cmd === 'Q') {
      const x1 = nextNum() + (rel ? cx : 0);
      const y1 = nextNum() + (rel ? cy : 0);
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      currentPts.push(...sampleQuadratic({ x: cx, y: cy }, { x: x1, y: y1 }, { x, y }));
      lastCtrlX = x1;
      lastCtrlY = y1;
      cx = x;
      cy = y;
      lastCmd = 'Q';
    } else if (cmd === 'T') {
      const prevWasQuad = lastCmd === 'Q' || lastCmd === 'T';
      const x1 = prevWasQuad ? 2 * cx - lastCtrlX : cx;
      const y1 = prevWasQuad ? 2 * cy - lastCtrlY : cy;
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      currentPts.push(...sampleQuadratic({ x: cx, y: cy }, { x: x1, y: y1 }, { x, y }));
      lastCtrlX = x1;
      lastCtrlY = y1;
      cx = x;
      cy = y;
      lastCmd = 'T';
    } else if (cmd === 'A') {
      const rx = nextNum();
      const ry = nextNum();
      const rot = nextNum();
      const largeArc = nextNum();
      const sweep = nextNum();
      const x = nextNum() + (rel ? cx : 0);
      const y = nextNum() + (rel ? cy : 0);
      if (currentPts.length === 0) currentPts.push({ x: cx, y: cy });
      currentPts.push(...sampleSvgArc({ x: cx, y: cy }, rx, ry, rot, largeArc, sweep, { x, y }));
      cx = x;
      cy = y;
      lastCmd = 'A';
    } else {
      idx++;
    }
  }
  flush(false);
  return strokes;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrString)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? '';
  }
  return attrs;
}

function parseStyleColor(attrs: Record<string, string>, prop: 'stroke' | 'fill'): string | undefined {
  let val = attrs[prop];
  if (!val && attrs.style) {
    const match = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i').exec(attrs.style);
    if (match) val = match[1].trim();
  }
  if (!val || val === 'none' || val === 'transparent') return undefined;
  return val;
}

function parseStyleWidth(attrs: Record<string, string>): number | undefined {
  let val = attrs['stroke-width'];
  if (!val && attrs.style) {
    const match = /stroke-width\s*:\s*([^;]+)/i.exec(attrs.style);
    if (match) val = match[1].trim();
  }
  if (!val) return undefined;
  const num = parseFloat(val);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Parses an entire SVG markup string (all shapes & nested <g> transforms)
 * into normalized, ordered VectorStrokes ready for progressive hand drawing.
 */
export function parseSvgToStrokes(svgMarkup: string): {
  strokes: VectorStroke[];
  aspectRatio: number;
} {
  const rawStrokes: VectorStroke[] = [];
  const tagRe = /<\/?([a-zA-Z0-9:_-]+)([^>]*?)(\/?)>/g;
  const transformStack: Mat2D[] = [IDENTITY];
  const strokeColorStack: Array<string | undefined> = [undefined];
  const fillColorStack: Array<string | undefined> = [undefined];

  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(svgMarkup)) !== null) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    const attrText = m[2] || '';
    const selfClosing = m[3] === '/' || full.endsWith('/>');
    const isClosing = full.startsWith('</');

    if (isClosing) {
      if (tag === 'g' && transformStack.length > 1) {
        transformStack.pop();
        strokeColorStack.pop();
        fillColorStack.pop();
      }
      continue;
    }

    const attrs = parseAttributes(attrText);
    const parentTransform = transformStack[transformStack.length - 1];
    const localTransform = parseTransform(attrs.transform);
    const currentTransform = mulMat(parentTransform, localTransform);
    const strokeColor = parseStyleColor(attrs, 'stroke') ?? strokeColorStack[strokeColorStack.length - 1];
    const fillColor = parseStyleColor(attrs, 'fill') ?? fillColorStack[fillColorStack.length - 1];
    const strokeWidth = parseStyleWidth(attrs);

    if (tag === 'g') {
      if (!selfClosing) {
        transformStack.push(currentTransform);
        strokeColorStack.push(strokeColor);
        fillColorStack.push(fillColor);
      }
      continue;
    }

    const pushPts = (pts: Point2D[], closed = false) => {
      if (pts.length >= 2) {
        rawStrokes.push(
          buildStrokeMetrics(
            pts.map((p) => applyMat(currentTransform, p)),
            { color: strokeColor, width: strokeWidth, closed, fillColor },
          ),
        );
      }
    };

    if (tag === 'path' && attrs.d) {
      rawStrokes.push(
        ...parseSvgPathD(attrs.d, currentTransform, {
          color: strokeColor,
          width: strokeWidth,
          fillColor,
        }),
      );
    } else if (tag === 'line') {
      pushPts([
        { x: Number(attrs.x1) || 0, y: Number(attrs.y1) || 0 },
        { x: Number(attrs.x2) || 0, y: Number(attrs.y2) || 0 },
      ]);
    } else if (tag === 'rect') {
      const x = Number(attrs.x) || 0;
      const y = Number(attrs.y) || 0;
      const w = Number(attrs.width) || 0;
      const h = Number(attrs.height) || 0;
      if (w > 0 && h > 0) {
        pushPts(
          [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
            { x, y },
          ],
          true,
        );
      }
    } else if (tag === 'circle') {
      const cx = Number(attrs.cx) || 0;
      const cy = Number(attrs.cy) || 0;
      const r = Number(attrs.r) || 0;
      if (r > 0) {
        const pts: Point2D[] = [];
        const steps = 36;
        for (let i = 0; i <= steps; i++) {
          const ang = (i / steps) * Math.PI * 2;
          pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
        }
        pushPts(pts, true);
      }
    } else if (tag === 'ellipse') {
      const cx = Number(attrs.cx) || 0;
      const cy = Number(attrs.cy) || 0;
      const rx = Number(attrs.rx) || 0;
      const ry = Number(attrs.ry) || 0;
      if (rx > 0 && ry > 0) {
        const pts: Point2D[] = [];
        const steps = 36;
        for (let i = 0; i <= steps; i++) {
          const ang = (i / steps) * Math.PI * 2;
          pts.push({ x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry });
        }
        pushPts(pts, true);
      }
    } else if ((tag === 'polyline' || tag === 'polygon') && attrs.points) {
      const nums = attrs.points
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      const pts: Point2D[] = [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        pts.push({ x: nums[i], y: nums[i + 1] });
      }
      if (tag === 'polygon' && pts.length >= 2) {
        pts.push(pts[0]);
      }
      pushPts(pts, tag === 'polygon');
    }
  }

  return normalizeStrokes(rawStrokes);
}
