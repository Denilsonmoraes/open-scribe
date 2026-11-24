import type {
  BoardTheme,
  HandStyle,
  MoveDirection,
  Point2D,
  ScheduledElement,
  ScribeElement,
  ScribeProject,
  VectorStroke,
} from '../types/scribe';
import { sampleStrokeAtLength, totalStrokesLength } from './geometry';
import { drawAnimatedHand, drawDraggingHand } from './handRenderer';
import { buildTimelineSchedule, easeInOutCubic, evaluateCameraAtTime, getStageDimensions } from './timeline';

const rasterCache = new Map<string, HTMLImageElement>();

export function getCachedRasterImage(dataUrl: string, onLoad?: () => void): HTMLImageElement | null {
  if (!dataUrl) return null;
  const cached = rasterCache.get(dataUrl);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }
  const img = new Image();
  img.onload = () => onLoad?.();
  img.src = dataUrl;
  rasterCache.set(dataUrl, img);
  return null;
}

export function preloadProjectImages(project: ScribeProject): Promise<void> {
  const urls = project.elements
    .map((e) => e.rasterDataUrl)
    .filter((u): u is string => Boolean(u));
  if (urls.length === 0) return Promise.resolve();

  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const existing = rasterCache.get(url);
          if (existing && existing.complete) {
            resolve();
            return;
          }
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
          rasterCache.set(url, img);
        }),
    ),
  ).then(() => undefined);
}

export function drawBoardBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: BoardTheme,
  customColor: string,
  cam: { cx: number; cy: number; zoom: number },
): void {
  if (theme === 'chalkboard') {
    ctx.fillStyle = '#182621';
  } else if (theme === 'blueprint') {
    ctx.fillStyle = '#0f2847';
  } else if (theme === 'dotgrid') {
    ctx.fillStyle = customColor || '#fcfbf7';
  } else {
    ctx.fillStyle = customColor || '#faf9f5';
  }
  ctx.fillRect(0, 0, width, height);

  if (theme === 'blueprint') {
    ctx.save();
    const step = 44 * cam.zoom;
    if (step >= 10) {
      const offsetX = (((width / 2 - cam.cx * cam.zoom) % step) + step) % step;
      const offsetY = (((height / 2 - cam.cy * cam.zoom) % step) + step) % step;
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = offsetX; x < width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offsetY; y < height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (theme === 'dotgrid') {
    ctx.save();
    const step = 36 * cam.zoom;
    if (step >= 10) {
      const offsetX = (((width / 2 - cam.cx * cam.zoom) % step) + step) % step;
      const offsetY = (((height / 2 - cam.cy * cam.zoom) % step) + step) % step;
      ctx.fillStyle = 'rgba(24, 24, 27, 0.14)';
      for (let x = offsetX; x < width; x += step) {
        for (let y = offsetY; y < height; y += step) {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }
    ctx.restore();
  } else if (theme === 'chalkboard') {
    // Subtle matte vignette
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.15,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75,
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.03)');
    grad.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

function wrapTextLines(
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

function worldToLocalPoint(el: ScribeElement, p: Point2D): Point2D {
  return {
    x: (p.x - 0.5) * el.width,
    y: (p.y - 0.5) * el.height,
  };
}

function localToWorldPoint(el: ScribeElement, lx: number, ly: number): Point2D {
  const rad = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: el.x + lx * cos - ly * sin,
    y: el.y + lx * sin + ly * cos,
  };
}

function renderTextElement(
  ctx: CanvasRenderingContext2D,
  el: ScribeElement,
  progress: number, // 0..1
): Point2D | null {
  const rawText = el.text || 'Seu Texto Aqui';
  const fontSize = el.fontSize || 42;
  const fontFamily = el.fontFamily || 'Caveat';
  const align = el.textAlign || 'center';
  const lineHeight = fontSize * 1.24;

  ctx.font = `700 ${fontSize}px "${fontFamily}", cursive, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  const lines = wrapTextLines(ctx, rawText, Math.max(80, el.width - 16));
  const totalBlockH = lines.length * lineHeight;
  const startY = -totalBlockH / 2 + lineHeight / 2;
  const xAnchor = align === 'left' ? -el.width / 2 + 8 : align === 'right' ? el.width / 2 - 8 : 0;

  const lineWidths = lines.map((l) => Math.max(12, ctx.measureText(l).width));
  const totalWidth = lineWidths.reduce((a, b) => a + b, 0);

  if (el.textBgColor && el.textBgColor !== 'transparent') {
    const maxLineW = Math.max(...lineWidths, 48);
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

  let consumed = 0;
  let penLocal: Point2D | null = null;
  const targetCharsWidth = progress * totalWidth;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lw = lineWidths[i];
    const ly = startY + i * lineHeight;

    let lineLeft = xAnchor - lw / 2;
    if (align === 'left') lineLeft = xAnchor;
    if (align === 'right') lineLeft = xAnchor - lw;

    if (progress >= 1 || consumed + lw <= targetCharsWidth) {
      ctx.fillStyle = el.strokeColor;
      ctx.fillText(line, xAnchor, ly);
      consumed += lw;
    } else if (targetCharsWidth > consumed) {
      const localReveal = targetCharsWidth - consumed;
      ctx.save();
      ctx.beginPath();
      ctx.rect(lineLeft - 6, ly - lineHeight * 0.65, localReveal + 6, lineHeight * 1.3);
      ctx.clip();
      ctx.fillStyle = el.strokeColor;
      ctx.fillText(line, xAnchor, ly);
      ctx.restore();

      const osc = Math.sin(progress * 42) * (fontSize * 0.12);
      penLocal = {
        x: lineLeft + localReveal,
        y: ly + osc,
      };
      break;
    } else {
      break;
    }
  }

  return penLocal ? localToWorldPoint(el, penLocal.x, penLocal.y) : null;
}

function renderVectorElement(
  ctx: CanvasRenderingContext2D,
  el: ScribeElement,
  progress: number, // 0..1
  onImageLoad?: () => void,
  isLightPaper = true,
): Point2D | null {
  const strokes = el.strokes;
  const hasRaster = Boolean(el.rasterDataUrl);
  const img = hasRaster && el.rasterDataUrl ? getCachedRasterImage(el.rasterDataUrl, onImageLoad) : null;

  // Fill/raster reveal ramp near the end of drawing
  const fillAlpha =
    progress >= 1
      ? 1
      : el.fillReveal
        ? Math.max(0, Math.min(1, (progress - 0.78) / 0.22))
        : 0;

  if (img && el.fillReveal && fillAlpha > 0) {
    ctx.save();
    ctx.globalAlpha *= fillAlpha;
    if (isLightPaper) ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
    ctx.restore();
  }

  // If element has no vector strokes (e.g., pure raster fallback), reveal raster smoothly
  if (strokes.length === 0) {
    if (img) {
      ctx.save();
      ctx.globalAlpha *= progress;
      if (isLightPaper) ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
      ctx.restore();
    }
    return null;
  }

  // Optional solid vector fill reveal
  if (el.fillReveal && fillAlpha > 0 && el.type === 'svg') {
    ctx.save();
    ctx.globalAlpha *= fillAlpha * 0.92;
    for (const stroke of strokes) {
      if (!stroke.fillColor && !el.fillColor) continue;
      if (stroke.closed && stroke.points.length >= 3) {
        ctx.fillStyle = stroke.fillColor || el.fillColor;
        ctx.beginPath();
        const p0 = worldToLocalPoint(el, stroke.points[0]);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = worldToLocalPoint(el, stroke.points[i]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Progressive stroke drawing
  const strokeProgressEnd = el.fillReveal && (img || el.type === 'svg') ? 0.9 : 1;
  const drawProg = Math.min(1, progress / strokeProgressEnd);

  const totalLen = totalStrokesLength(strokes);
  const targetLen = drawProg * totalLen;
  let acc = 0;
  let penWorld: Point2D | null = null;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const rasterLineFade =
    img && el.fillReveal && el.type === 'traced-image' ? Math.max(0.25, 1 - fillAlpha * 0.72) : 1;

  for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
    const stroke: VectorStroke = strokes[sIdx];
    const sLen = Math.max(0.01, stroke.totalLength);
    ctx.strokeStyle = stroke.color || el.strokeColor;
    ctx.lineWidth = stroke.width ? Math.max(1.5, el.strokeWidth) : el.strokeWidth;

    ctx.save();
    ctx.globalAlpha *= rasterLineFade;

    if (acc + sLen <= targetLen || progress >= 1) {
      // Full stroke
      ctx.beginPath();
      const p0 = worldToLocalPoint(el, stroke.points[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = worldToLocalPoint(el, stroke.points[i]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
      acc += sLen;
    } else if (targetLen > acc) {
      // Partial active stroke
      const localTarget = targetLen - acc;
      const sample = sampleStrokeAtLength(stroke, localTarget);

      ctx.beginPath();
      const p0 = worldToLocalPoint(el, stroke.points[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i <= sample.endIndex; i++) {
        const pt = worldToLocalPoint(el, stroke.points[i]);
        ctx.lineTo(pt.x, pt.y);
      }
      const tipLocal = worldToLocalPoint(el, sample.point);
      ctx.lineTo(tipLocal.x, tipLocal.y);
      ctx.stroke();
      ctx.restore();

      if (drawProg < 1) {
        penWorld = localToWorldPoint(el, tipLocal.x, tipLocal.y);
      }
      break;
    } else {
      ctx.restore();
      break;
    }
  }

  return penWorld;
}

interface ElementRenderOutput {
  kind: 'draw' | 'drag';
  point: Point2D;
  moveFrom?: MoveDirection;
}

function renderSingleElement(
  ctx: CanvasRenderingContext2D,
  el: ScribeElement,
  drawProgress: number,
  onImageLoad?: () => void,
  isLightPaper = true,
): ElementRenderOutput | null {
  ctx.save();

  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;
  let alpha = el.opacity;
  let effectiveDraw = drawProgress;
  let dragOutput: ElementRenderOutput | null = null;

  if (el.animationMode === 'move-in') {
    const from: MoveDirection = el.moveInFrom || 'right';
    const slideT = Math.min(1, drawProgress / 0.84);
    const eased = easeInOutCubic(slideT);
    const travel = 460 * (1 - eased);
    if (from === 'right') offsetX = travel;
    else if (from === 'left') offsetX = -travel;
    else if (from === 'top') offsetY = -travel;
    else offsetY = travel;

    effectiveDraw = 1;
    alpha *= Math.min(1, drawProgress * 4.5);

    if (drawProgress < 0.99) {
      const retract = drawProgress > 0.84 ? ((drawProgress - 0.84) / 0.16) * 240 : 0;
      const gx =
        el.x +
        offsetX +
        (from === 'right' ? el.width * 0.28 + retract : from === 'left' ? -el.width * 0.28 - retract : 0);
      const gy =
        el.y +
        offsetY +
        (from === 'bottom' ? el.height * 0.28 + retract : from === 'top' ? -el.height * 0.28 - retract : 8);
      dragOutput = { kind: 'drag', point: { x: gx, y: gy }, moveFrom: from };
    }
  } else if (el.animationMode === 'fade') {
    alpha *= easeInOutCubic(drawProgress);
    effectiveDraw = 1;
  } else if (el.animationMode === 'pop') {
    const p = easeInOutCubic(drawProgress);
    scale = 0.65 + 0.35 * p;
    alpha *= Math.min(1, drawProgress * 2.5);
    effectiveDraw = 1;
  } else if (el.animationMode === 'slide-up') {
    const p = easeInOutCubic(drawProgress);
    offsetY = (1 - p) * 60;
    alpha *= Math.min(1, drawProgress * 2.2);
    effectiveDraw = 1;
  }

  ctx.globalAlpha = alpha;
  ctx.translate(el.x + offsetX, el.y + offsetY);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);

  let penWorld: Point2D | null = null;
  if (el.type === 'text') {
    penWorld = renderTextElement(ctx, el, effectiveDraw);
  } else {
    penWorld = renderVectorElement(ctx, el, effectiveDraw, onImageLoad, isLightPaper);
  }

  ctx.restore();
  if (el.animationMode === 'move-in') return dragOutput;
  if (el.animationMode === 'draw' && penWorld) return { kind: 'draw', point: penWorld };
  return null;
}

export interface RenderFrameOptions {
  width: number;
  height: number;
  time: number;
  mode: 'edit' | 'play' | 'export';
  editCamera?: { cx: number; cy: number; zoom: number };
  selectedId?: string | null;
  onImageLoad?: () => void;
}

/**
 * Deterministic canvas renderer for both live preview/editor and frame-by-frame video export.
 */
export function renderProjectFrame(
  ctx: CanvasRenderingContext2D,
  project: ScribeProject,
  opts: RenderFrameOptions,
): void {
  const { width, height, time, mode, selectedId, onImageLoad } = opts;
  const { items } = buildTimelineSchedule(project);

  const stage = getStageDimensions(project.aspectRatio);
  const stageScale = Math.min(width / stage.width, height / stage.height);

  const cam =
    mode === 'edit' && opts.editCamera
      ? opts.editCamera
      : evaluateCameraAtTime(items, time);

  const effectiveZoom = cam.zoom * stageScale;

  drawBoardBackground(ctx, width, height, project.boardTheme, project.backgroundColor, {
    cx: cam.cx,
    cy: cam.cy,
    zoom: effectiveZoom,
  });

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(effectiveZoom, effectiveZoom);
  ctx.translate(-cam.cx, -cam.cy);

  let activeHand: {
    kind: 'draw' | 'drag';
    point: Point2D;
    color: string;
    style: HandStyle;
    prog: number;
    moveFrom?: MoveDirection;
  } | null = null;

  const isLightPaper = project.boardTheme === 'whiteboard' || project.boardTheme === 'dotgrid';

  if (mode === 'edit') {
    // Subtle stage reference frame around world origin (0, 0)
    ctx.save();
    ctx.strokeStyle =
      project.boardTheme === 'chalkboard' || project.boardTheme === 'blueprint'
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(24,24,27,0.12)';
    ctx.lineWidth = 2 / Math.max(0.25, effectiveZoom);
    ctx.setLineDash([8 / Math.max(0.25, effectiveZoom), 6 / Math.max(0.25, effectiveZoom)]);
    ctx.strokeRect(-stage.width / 2, -stage.height / 2, stage.width, stage.height);
    ctx.restore();

    for (const el of project.elements) {
      renderSingleElement(ctx, el, 1, onImageLoad, isLightPaper);
    }
  } else {
    for (const item of items) {
      if (time < item.startTime) continue;

      const drawDur = Math.max(0.15, item.element.drawDuration);
      const prog = Math.max(0, Math.min(1, (time - item.startTime) / drawDur));
      const handOut = renderSingleElement(ctx, item.element, prog, onImageLoad, isLightPaper);

      if (handOut && prog < 1) {
        const chosenStyle =
          item.element.handStyleOverride && item.element.handStyleOverride !== 'inherit'
            ? item.element.handStyleOverride
            : project.defaultHandStyle;
        activeHand = {
          kind: handOut.kind,
          point: handOut.point,
          color: item.element.strokeColor,
          style: chosenStyle,
          prog,
          moveFrom: handOut.moveFrom,
        };
      }
    }
  }

  ctx.restore();

  // Selection overlay in edit mode (screen space for crisp handles regardless of zoom)
  if (mode === 'edit' && selectedId) {
    const sel = project.elements.find((e) => e.id === selectedId);
    if (sel) {
      drawSelectionGizmo(ctx, sel, width, height, { cx: cam.cx, cy: cam.cy, zoom: effectiveZoom });
    }
  }

  // Animated drawing/dragging hand in screen space
  if (activeHand && mode !== 'edit' && activeHand.style !== 'none') {
    const sx = width / 2 + (activeHand.point.x - cam.cx) * effectiveZoom;
    const sy = height / 2 + (activeHand.point.y - cam.cy) * effectiveZoom;
    const handScale = Math.max(0.62, Math.min(1.35, width / 1180));
    if (activeHand.kind === 'drag') {
      drawDraggingHand(ctx, sx, sy, activeHand.moveFrom || 'right', handScale);
    } else {
      const tilt = Math.sin(activeHand.prog * Math.PI * 16);
      drawAnimatedHand(ctx, activeHand.style, sx, sy, tilt, activeHand.color, handScale);
    }
  }
}

function drawSelectionGizmo(
  ctx: CanvasRenderingContext2D,
  el: ScribeElement,
  width: number,
  height: number,
  cam: { cx: number; cy: number; zoom: number },
): void {
  const sx = width / 2 + (el.x - cam.cx) * cam.zoom;
  const sy = height / 2 + (el.y - cam.cy) * cam.zoom;
  const sw = el.width * cam.zoom;
  const sh = el.height * cam.zoom;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate((el.rotation * Math.PI) / 180);

  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 1.75;
  ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);

  const corners: Point2D[] = [
    { x: -sw / 2, y: -sh / 2 },
    { x: sw / 2, y: -sh / 2 },
    { x: sw / 2, y: sh / 2 },
    { x: -sw / 2, y: sh / 2 },
  ];

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  for (const c of corners) {
    ctx.beginPath();
    ctx.rect(c.x - 5, c.y - 5, 10, 10);
    ctx.fill();
    ctx.stroke();
  }

  // Rotate knob
  ctx.beginPath();
  ctx.moveTo(0, -sh / 2);
  ctx.lineTo(0, -sh / 2 - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -sh / 2 - 26, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function hitTestElement(
  project: ScribeProject,
  worldX: number,
  worldY: number,
): ScribeElement | null {
  for (let i = project.elements.length - 1; i >= 0; i--) {
    const el = project.elements[i];
    const rad = (-el.rotation * Math.PI) / 180;
    const dx = worldX - el.x;
    const dy = worldY - el.y;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    if (Math.abs(lx) <= el.width / 2 + 12 && Math.abs(ly) <= el.height / 2 + 12) {
      return el;
    }
  }
  return null;
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: ScribeProject['aspectRatio'],
  editCam: { cx: number; cy: number; zoom: number },
): Point2D {
  const stage = getStageDimensions(aspectRatio);
  const stageScale = Math.min(canvasWidth / stage.width, canvasHeight / stage.height);
  const effectiveZoom = editCam.zoom * stageScale;
  return {
    x: editCam.cx + (screenX - canvasWidth / 2) / effectiveZoom,
    y: editCam.cy + (screenY - canvasHeight / 2) / effectiveZoom,
  };
}

export function getScheduledItemAtTime(
  schedule: ScheduledElement[],
  t: number,
): ScheduledElement | null {
  for (const item of schedule) {
    if (t >= item.startTime && t <= item.endTime) return item;
  }
  return null;
}
