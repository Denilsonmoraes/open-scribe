import type { Point2D, ScribeElement } from '../types/scribe';

export interface TextPenSample {
  /** Local element coordinates (centered at 0,0 before rotation/translation) */
  point: Point2D;
  /** Instantaneous movement direction for natural hand tilt */
  velocity: Point2D;
  /** True while gliding across spaces or returning to the next line */
  isLifted: boolean;
}

interface CharBox {
  char: string;
  x0: number;
  x1: number;
  width: number;
}

interface TextLineLayout {
  text: string;
  y: number;
  left: number;
  width: number;
  chars: CharBox[];
}

interface TimelineSegment {
  kind: 'char' | 'space' | 'newline';
  lineIdx: number;
  charIdx: number;
  weight: number;
  from: Point2D;
  to: Point2D;
  charBox?: CharBox;
  lineY: number;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Wraps text into lines fitting `maxWidth`.
 */
export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${current} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

/**
 * Returns normalized pen waypoints `(u, v)` inside a character box where:
 * - `u` in [0..1] is left-to-right across the character width
 * - `v` in [-0.5..+0.5] is vertical relative to text middle (-0.42 = ascender top, +0.36 = baseline, +0.52 = descender)
 */
function getGlyphStrokeWaypoints(ch: string): Array<[number, number]> {
  const lower = ch.toLowerCase();

  // Punctuation
  if (ch === '.' || ch === ',') {
    return [
      [0.35, 0.25],
      [0.55, 0.36],
      [0.45, ch === ',' ? 0.48 : 0.34],
    ];
  }
  if (ch === '-' || ch === '–' || ch === '—') {
    return [
      [0.1, 0.04],
      [0.9, 0.04],
    ];
  }
  if (ch === '!' || ch === '?') {
    return [
      [0.3, -0.34],
      [0.65, -0.26],
      [0.5, 0.12],
      [0.5, 0.34],
    ];
  }
  if (ch === ':') {
    return [
      [0.5, -0.14],
      [0.5, 0.26],
    ];
  }

  // Tall ascenders
  if ('bdfhklt'.includes(lower) || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
    if ('mwMW'.includes(ch)) {
      return [
        [0.08, -0.34],
        [0.14, 0.32],
        [0.36, -0.18],
        [0.52, 0.32],
        [0.74, -0.18],
        [0.92, 0.32],
      ];
    }
    if ('oO0cCgGqQ'.includes(ch)) {
      return [
        [0.68, -0.32],
        [0.2, -0.22],
        [0.14, 0.16],
        [0.52, 0.34],
        [0.86, 0.12],
        [0.82, -0.18],
      ];
    }
    if ('aA'.includes(ch)) {
      return [
        [0.12, 0.34],
        [0.48, -0.36],
        [0.86, 0.34],
        [0.24, 0.08],
        [0.78, 0.08],
      ];
    }
    if ('tT'.includes(ch)) {
      return [
        [0.48, -0.38],
        [0.48, 0.34],
        [0.16, -0.16],
        [0.86, -0.16],
      ];
    }
    // General tall stroke (downstroke + loop/crossbar)
    return [
      [0.24, -0.38],
      [0.24, 0.34],
      [0.64, -0.14],
      [0.86, 0.32],
    ];
  }

  // Descenders
  if ('gjpqy'.includes(lower)) {
    return [
      [0.66, -0.14],
      [0.22, -0.06],
      [0.26, 0.26],
      [0.76, -0.1],
      [0.68, 0.48],
      [0.32, 0.5],
    ];
  }

  // Wide lowercase
  if (lower === 'm' || lower === 'w') {
    return [
      [0.08, -0.14],
      [0.18, 0.32],
      [0.4, -0.14],
      [0.54, 0.32],
      [0.76, -0.14],
      [0.92, 0.32],
    ];
  }

  // Narrow vertical
  if (lower === 'i' || lower === 'l') {
    return [
      [0.48, -0.28],
      [0.48, 0.34],
      [0.54, -0.34],
    ];
  }

  // Curved lowercase (a, c, e, o, s, u, n, r, v, x, z)
  return [
    [0.22, -0.14],
    [0.18, 0.28],
    [0.58, 0.32],
    [0.82, -0.08],
    [0.88, 0.3],
  ];
}

function getCharWeight(ch: string): number {
  if (ch === ' ') return 0.26;
  if ('il.,!|:;-'.includes(ch)) return 0.58;
  if ('mwMW@#%&'.includes(ch)) return 1.32;
  if (ch >= 'A' && ch <= 'Z') return 1.15;
  return 1.0;
}

function sampleGlyphPath(
  waypoints: Array<[number, number]>,
  t: number,
  x0: number,
  width: number,
  lineY: number,
  fontSize: number,
): { point: Point2D; velocity: Point2D; maxU: number } {
  const n = waypoints.length;
  if (n === 1) {
    const [u, v] = waypoints[0];
    return {
      point: { x: x0 + u * width, y: lineY + v * fontSize },
      velocity: { x: 1, y: 0 },
      maxU: u,
    };
  }

  const scaled = Math.max(0, Math.min(1, t)) * (n - 1);
  const idx = Math.min(n - 2, Math.floor(scaled));
  const frac = scaled - idx;

  const [u0, v0] = waypoints[idx];
  const [u1, v1] = waypoints[idx + 1];
  const u = u0 + (u1 - u0) * frac;
  const v = v0 + (v1 - v0) * frac;

  // Monotonic horizontal reveal envelope so ink never lags behind or jumps ahead of nib
  let maxU = u;
  for (let i = 0; i <= idx; i++) {
    if (waypoints[i][0] > maxU) maxU = waypoints[i][0];
  }

  return {
    point: { x: x0 + u * width, y: lineY + v * fontSize },
    velocity: { x: (u1 - u0) * width, y: (v1 - v0) * fontSize },
    maxU: Math.max(maxU, t),
  };
}

/**
 * Renders a text element with tight per-character pen-to-ink synchronization.
 * Returns the exact pen tip position in local element space, instantaneous velocity,
 * and whether the pen is lifted (gliding over a space or jumping to the next line).
 */
export function renderSynchronizedText(
  ctx: CanvasRenderingContext2D,
  el: ScribeElement,
  progress: number, // 0..1
): TextPenSample | null {
  const rawText = el.text || 'Seu Texto Aqui';
  const fontSize = el.fontSize || 42;
  const fontFamily = el.fontFamily || 'Caveat';
  const align = el.textAlign || 'center';
  const lineHeight = fontSize * 1.24;

  ctx.font = `700 ${fontSize}px "${fontFamily}", cursive, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const lines = wrapTextLines(ctx, rawText, Math.max(80, el.width - 16));
  const totalBlockH = lines.length * lineHeight;
  const startY = -totalBlockH / 2 + lineHeight / 2;
  const xAnchor = align === 'left' ? -el.width / 2 + 8 : align === 'right' ? el.width / 2 - 8 : 0;

  // Compute per-line & per-character exact bounding boxes
  const layouts: TextLineLayout[] = lines.map((line, i) => {
    const lw = Math.max(8, ctx.measureText(line).width);
    let left = xAnchor - lw / 2;
    if (align === 'left') left = xAnchor;
    if (align === 'right') left = xAnchor - lw;

    const chars: CharBox[] = [];
    for (let c = 0; c < line.length; c++) {
      const prefixW = c === 0 ? 0 : ctx.measureText(line.slice(0, c)).width;
      const nextW = ctx.measureText(line.slice(0, c + 1)).width;
      const cw = Math.max(2, nextW - prefixW);
      chars.push({
        char: line[c],
        x0: left + prefixW,
        x1: left + nextW,
        width: cw,
      });
    }

    return {
      text: line,
      y: startY + i * lineHeight,
      left,
      width: lw,
      chars,
    };
  });

  // Optional background highlight pill behind text
  if (el.textBgColor && el.textBgColor !== 'transparent') {
    const maxLineW = Math.max(...layouts.map((l) => l.width), 48);
    const padX = 20;
    const padY = 12;
    const boxW = Math.min(el.width, maxLineW + padX * 2);
    const boxH = totalBlockH + padY * 2;
    const bx = align === 'left' ? -el.width / 2 - 4 : align === 'right' ? el.width / 2 - boxW + 4 : -boxW / 2;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, progress * 3);
    ctx.fillStyle = el.textBgColor;
    ctx.beginPath();
    ctx.roundRect(bx, -boxH / 2, boxW, boxH, 12);
    ctx.fill();
    ctx.restore();
  }

  // Fast path: fully written
  if (progress >= 1) {
    ctx.fillStyle = el.strokeColor;
    for (const layout of layouts) {
      if (layout.text) {
        ctx.fillText(layout.text, layout.left, layout.y);
      }
    }
    return null;
  }

  // Build synchronized timeline segments across all characters, spaces, and line returns
  const segments: TimelineSegment[] = [];
  let prevEndPoint: Point2D | null = null;

  for (let li = 0; li < layouts.length; li++) {
    const layout = layouts[li];
    if (layout.chars.length === 0) continue;

    if (prevEndPoint) {
      const nextStart: Point2D = { x: layout.chars[0].x0, y: layout.y };
      segments.push({
        kind: 'newline',
        lineIdx: li,
        charIdx: 0,
        weight: 0.65,
        from: prevEndPoint,
        to: nextStart,
        lineY: layout.y,
      });
    }

    for (let ci = 0; ci < layout.chars.length; ci++) {
      const cb = layout.chars[ci];
      const isSpace = cb.char.trim().length === 0;
      const fromPt: Point2D = { x: cb.x0, y: layout.y + fontSize * 0.1 };
      const toPt: Point2D = { x: cb.x1, y: layout.y + fontSize * 0.1 };

      segments.push({
        kind: isSpace ? 'space' : 'char',
        lineIdx: li,
        charIdx: ci,
        weight: getCharWeight(cb.char),
        from: fromPt,
        to: toPt,
        charBox: cb,
        lineY: layout.y,
      });

      prevEndPoint = toPt;
    }
  }

  if (segments.length === 0) return null;

  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  const targetWeight = Math.max(0, Math.min(1, progress)) * totalWeight;

  let acc = 0;
  let activeSeg = segments[segments.length - 1];
  let localT = 1;

  for (const seg of segments) {
    if (acc + seg.weight >= targetWeight) {
      activeSeg = seg;
      localT = seg.weight > 0 ? (targetWeight - acc) / seg.weight : 1;
      break;
    }
    acc += seg.weight;
  }

  // Draw all completed lines cleanly
  ctx.fillStyle = el.strokeColor;
  for (let li = 0; li < activeSeg.lineIdx; li++) {
    if (layouts[li].text) {
      ctx.fillText(layouts[li].text, layouts[li].left, layouts[li].y);
    }
  }

  const activeLayout = layouts[activeSeg.lineIdx];

  if (activeSeg.kind === 'newline') {
    // Pen gliding smoothly from end of previous line to start of current line
    const e = smoothstep(localT);
    const arcLift = Math.sin(localT * Math.PI) * fontSize * 0.22;
    const px = activeSeg.from.x + (activeSeg.to.x - activeSeg.from.x) * e;
    const py = activeSeg.from.y + (activeSeg.to.y - activeSeg.from.y) * e - arcLift;
    return {
      point: { x: px, y: py },
      velocity: {
        x: activeSeg.to.x - activeSeg.from.x,
        y: activeSeg.to.y - activeSeg.from.y,
      },
      isLifted: true,
    };
  }

  // Draw completed characters on the active line (using prefix substring to preserve kerning)
  if (activeSeg.charIdx > 0) {
    const completedPrefix = activeLayout.text.slice(0, activeSeg.charIdx);
    const prefixEndX = activeLayout.chars[activeSeg.charIdx - 1].x1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      activeLayout.left - 8,
      activeLayout.y - lineHeight * 0.7,
      prefixEndX - activeLayout.left + 9,
      lineHeight * 1.4,
    );
    ctx.clip();
    ctx.fillText(completedPrefix, activeLayout.left, activeLayout.y);
    ctx.restore();
  }

  if (activeSeg.kind === 'space') {
    const e = smoothstep(localT);
    const hop = Math.sin(localT * Math.PI) * fontSize * 0.14;
    const px = activeSeg.from.x + (activeSeg.to.x - activeSeg.from.x) * e;
    const py = activeSeg.from.y - hop;
    return {
      point: { x: px, y: py },
      velocity: { x: activeSeg.to.x - activeSeg.from.x, y: 0 },
      isLifted: true,
    };
  }

  // Active character: trace authentic glyph stroke & reveal ink in exact lockstep with nib
  const cb = activeSeg.charBox!;
  const waypoints = getGlyphStrokeWaypoints(cb.char);
  const sample = sampleGlyphPath(waypoints, localT, cb.x0, cb.width, activeSeg.lineY, fontSize);

  const revealX = cb.x0 + sample.maxU * cb.width + 1.5;
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    cb.x0 - 3,
    activeLayout.y - lineHeight * 0.7,
    Math.max(1, revealX - (cb.x0 - 3)),
    lineHeight * 1.4,
  );
  ctx.clip();
  // Render full line clipped strictly to current glyph reveal window so kerning & italic overhang stay exact
  ctx.fillText(activeLayout.text, activeLayout.left, activeLayout.y);
  ctx.restore();

  return {
    point: sample.point,
    velocity: sample.velocity,
    isLifted: false,
  };
}
