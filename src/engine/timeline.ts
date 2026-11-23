import type { ScheduledElement, ScribeElement, ScribeProject } from '../types/scribe';

export const STAGE_BASE_WIDTH = 1280;
export const STAGE_BASE_HEIGHT = 720;

export function getStageDimensions(aspectRatio: ScribeProject['aspectRatio']): {
  width: number;
  height: number;
} {
  if (aspectRatio === '9:16') return { width: 720, height: 1280 };
  if (aspectRatio === '1:1') return { width: 960, height: 960 };
  return { width: 1280, height: 720 };
}

export function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

export function computeTargetCamera(
  el: ScribeElement,
  aspectRatio: ScribeProject['aspectRatio'],
): { cx: number; cy: number; zoom: number } {
  if (!el.camera.autoFit) {
    return { cx: el.camera.cx, cy: el.camera.cy, zoom: el.camera.zoom };
  }
  const stage = getStageDimensions(aspectRatio);
  const padX = stage.width * 0.72;
  const padY = stage.height * 0.72;
  const fitZoom = Math.min(padX / Math.max(80, el.width), padY / Math.max(80, el.height));
  const clampedZoom = Math.max(0.35, Math.min(2.6, fitZoom));
  return {
    cx: el.x,
    cy: el.y,
    zoom: clampedZoom,
  };
}

export function buildTimelineSchedule(project: ScribeProject): {
  items: ScheduledElement[];
  totalDuration: number;
} {
  const items: ScheduledElement[] = [];
  let cursor = 0;

  let prevCam =
    project.elements.length > 0
      ? computeTargetCamera(project.elements[0], project.aspectRatio)
      : { cx: 0, cy: 0, zoom: 1 };

  project.elements.forEach((el, index) => {
    const targetCam = computeTargetCamera(el, project.aspectRatio);
    const transitionStartCam = index === 0 ? targetCam : prevCam;
    const transitionDur = index === 0 ? 0 : Math.max(0, el.transitionDuration);
    const startTime = cursor + transitionDur;
    const drawEndTime = startTime + Math.max(0.15, el.drawDuration);
    const pauseEndTime = drawEndTime + Math.max(0, el.pauseDuration);

    items.push({
      element: el,
      index,
      startTime,
      drawEndTime,
      pauseEndTime,
      endTime: pauseEndTime,
      cameraStart: transitionStartCam,
      cameraTarget: targetCam,
    });

    cursor = pauseEndTime;
    prevCam = targetCam;
  });

  // Ensure a small tail if timeline has content, or minimum 1s for empty board
  const minDur = items.length > 0 ? cursor : 1;
  const totalDuration = Math.max(minDur, project.voiceover ? project.voiceover.duration : 0);

  return { items, totalDuration };
}

/**
 * Evaluates active camera state at any playback timestamp `t` (seconds).
 */
export function evaluateCameraAtTime(
  schedule: ScheduledElement[],
  t: number,
): { cx: number; cy: number; zoom: number } {
  if (schedule.length === 0) return { cx: 0, cy: 0, zoom: 1 };

  // Check if we are in a transition window leading into item `i`
  for (let i = 0; i < schedule.length; i++) {
    const item = schedule[i];
    const prevEnd = i === 0 ? 0 : schedule[i - 1].endTime;

    if (t >= prevEnd && t < item.startTime) {
      const span = item.startTime - prevEnd;
      const p = span > 1e-6 ? easeInOutCubic((t - prevEnd) / span) : 1;
      return {
        cx: item.cameraStart.cx + (item.cameraTarget.cx - item.cameraStart.cx) * p,
        cy: item.cameraStart.cy + (item.cameraTarget.cy - item.cameraStart.cy) * p,
        zoom: item.cameraStart.zoom + (item.cameraTarget.zoom - item.cameraStart.zoom) * p,
      };
    }

    if (t >= item.startTime && t <= item.endTime) {
      return item.cameraTarget;
    }
  }

  return schedule[schedule.length - 1].cameraTarget;
}

/**
 * Proportionally scales element durations to match a target voiceover duration.
 */
export function fitElementsToVoiceDuration(
  elements: ScribeElement[],
  targetDuration: number,
): ScribeElement[] {
  if (elements.length === 0 || targetDuration <= 0.5) return elements;

  const weights = elements.map((el, i) => {
    const textWeight = el.text ? Math.max(1, el.text.trim().split(/\s+/).length * 0.4) : 0;
    const strokeWeight = Math.max(1, el.strokes.length * 0.15);
    const base = el.type === 'text' ? Math.max(1.5, textWeight) : Math.max(1.8, Math.min(6, strokeWeight));
    const trans = i === 0 ? 0 : 0.45;
    return { base, pause: 0.4, trans };
  });

  const sumRaw = weights.reduce((acc, w) => acc + w.base + w.pause + w.trans, 0);
  const scale = targetDuration / Math.max(0.5, sumRaw);

  return elements.map((el, i) => ({
    ...el,
    drawDuration: Number(Math.max(0.5, weights[i].base * scale).toFixed(2)),
    pauseDuration: Number(Math.max(0.15, weights[i].pause * scale).toFixed(2)),
    transitionDuration: i === 0 ? 0 : Number(Math.max(0.2, weights[i].trans * scale).toFixed(2)),
  }));
}
