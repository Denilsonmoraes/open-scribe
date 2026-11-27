import { describe, expect, it } from 'vitest';
import { VECTOR_ASSETS } from '../../data/assetLibrary';
import { createStarterProject } from '../../data/presets';
import {
  buildStrokeMetrics,
  orderStrokesGreedy,
  sampleStrokeAtLength,
  simplifyRDP,
} from '../geometry';
import { traceImageDataToStrokes } from '../imageTracer';
import { generateStoryboardFromScript } from '../scriptGenerator';
import { parseSvgToStrokes } from '../svgParser';
import {
  buildProjectFromAiPlan,
  encodePcm16ToWavBlob,
  extractPcm16Samples,
  resamplePcm16,
  type AiStoryboardPlan,
} from '../aiDirector';
import {
  buildTimelineSchedule,
  computeFitAllCamera,
  evaluateCameraAtTime,
  fitElementsToVoiceDuration,
} from '../timeline';

describe('Geometry & Stroke Math', () => {
  it('simplifies collinear points using RDP', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 0.1 },
      { x: 10, y: 0 },
      { x: 15, y: 0.05 },
      { x: 20, y: 0 },
    ];
    const simplified = simplifyRDP(pts, 0.5);
    expect(simplified).toEqual([
      { x: 0, y: 0 },
      { x: 20, y: 0 },
    ]);
  });

  it('samples exact mid-point along cumulative arc length', () => {
    const stroke = buildStrokeMetrics([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
    ]);
    expect(stroke.totalLength).toBeCloseTo(20);
    const mid = sampleStrokeAtLength(stroke, 10);
    expect(mid.point.x).toBeCloseTo(0);
    expect(mid.point.y).toBeCloseTo(10);
    const threeQuarters = sampleStrokeAtLength(stroke, 15);
    expect(threeQuarters.point.x).toBeCloseTo(5);
    expect(threeQuarters.point.y).toBeCloseTo(10);
  });

  it('orders strokes greedily by nearest endpoint', () => {
    const s1 = buildStrokeMetrics([
      { x: 0, y: 0 },
      { x: 0.2, y: 0 },
    ]);
    const s2 = buildStrokeMetrics([
      { x: 0.9, y: 0.9 },
      { x: 1, y: 1 },
    ]);
    const s3 = buildStrokeMetrics([
      { x: 0.21, y: 0 },
      { x: 0.4, y: 0 },
    ]);
    const ordered = orderStrokesGreedy([s1, s2, s3]);
    expect(ordered[1].points[0].x).toBeCloseTo(0.21);
  });
});

describe('SVG Parser Engine', () => {
  it('parses all curated built-in SVG assets cleanly with normalized [0..1] coordinates', () => {
    for (const asset of VECTOR_ASSETS) {
      const parsed = parseSvgToStrokes(asset.svg);
      expect(parsed.strokes.length).toBeGreaterThan(0);
      for (const stroke of parsed.strokes) {
        expect(stroke.points.length).toBeGreaterThanOrEqual(2);
        for (const pt of stroke.points) {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(1);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('supports cubic, quadratic, arc, and group transform commands', () => {
    const svg = `<svg viewBox="0 0 100 100">
      <g transform="translate(10, 10)">
        <path d="M 0 0 C 10 20, 30 20, 40 0 Q 50 -20, 60 0 A 15 15 0 0 1 80 20 Z" stroke="#111" />
      </g>
    </svg>`;
    const parsed = parseSvgToStrokes(svg);
    expect(parsed.strokes.length).toBe(1);
    expect(parsed.strokes[0].closed).toBe(true);
    expect(parsed.strokes[0].points.length).toBeGreaterThan(15);
  });
});

describe('PNG/JPG Auto-Vectorizer Engine', () => {
  it('traces synthetic asymmetric shape without spurious outer border strokes', () => {
    const w = 64;
    const h = 64;
    const rgba = new Uint8ClampedArray(w * h * 4);
    rgba.fill(255);
    // Top bar [14..50, 14..26] + Left bar [14..26, 14..50] -> empty bottom-right quadrant [36..50, 36..50]
    for (let y = 14; y < 50; y++) {
      for (let x = 14; x < 50; x++) {
        if (y < 26 || x < 26) {
          const i = (y * w + x) * 4;
          rgba[i] = 20;
          rgba[i + 1] = 20;
          rgba[i + 2] = 20;
          rgba[i + 3] = 255;
        }
      }
    }

    const traced = traceImageDataToStrokes(rgba, w, h, {
      mode: 'contour',
      sensitivity: 65,
      detail: 1.5,
      invert: false,
      revealOriginal: true,
    });
    expect(traced.strokes.length).toBeGreaterThan(0);
    expect(traced.aspectRatio).toBeCloseTo(1);
    const hasSpuriousBottomRightCorner = traced.strokes.some((s) =>
      s.points.some((p) => p.x > 0.72 && p.y > 0.72),
    );
    expect(hasSpuriousBottomRightCorner).toBe(false);
  });

  it('skeletonizes lineart drawings into thin centerlines', () => {
    const w = 64;
    const h = 64;
    const rgba = new Uint8ClampedArray(w * h * 4);
    rgba.fill(255);
    for (let k = 10; k < 54; k++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const i = ((k + dy) * w + (k + dx)) * 4;
          rgba[i] = 10;
          rgba[i + 1] = 10;
          rgba[i + 2] = 10;
          rgba[i + 3] = 255;
        }
      }
    }

    const traced = traceImageDataToStrokes(rgba, w, h, {
      mode: 'lineart',
      sensitivity: 60,
      detail: 1.4,
      invert: false,
      revealOriginal: false,
    });
    expect(traced.strokes.length).toBeGreaterThan(0);
    expect(traced.strokes[0].points.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Timeline Scheduler & Script Storyboard', () => {
  it('computes non-overlapping schedule and smooth camera interpolation', () => {
    const project = createStarterProject();
    const { items, totalDuration } = buildTimelineSchedule(project);
    expect(items.length).toBe(project.elements.length);
    expect(totalDuration).toBeGreaterThan(10);

    for (let i = 1; i < items.length; i++) {
      expect(items[i].startTime).toBeGreaterThanOrEqual(items[i - 1].endTime);
    }

    const camStart = evaluateCameraAtTime(items, 0);
    expect(camStart.cx).toBeCloseTo(items[0].cameraTarget.cx);

    const camEnd = evaluateCameraAtTime(items, totalDuration);
    expect(camEnd.cx).toBeCloseTo(items[items.length - 1].cameraTarget.cx);
  });

  it('fits element durations to target voiceover duration', () => {
    const project = createStarterProject();
    const fitted = fitElementsToVoiceDuration(project.elements, 30);
    const { totalDuration } = buildTimelineSchedule({ ...project, elements: fitted });
    expect(totalDuration).toBeCloseTo(30, 0);
  });

  it('computes fit-all camera enclosing starter storyboard elements', () => {
    const project = createStarterProject();
    const cam = computeFitAllCamera(project);
    expect(cam.zoom).toBeGreaterThan(0.25);
    expect(cam.zoom).toBeLessThan(1.0);
    expect(cam.cx).toBeGreaterThan(300);
    expect(cam.cy).toBeGreaterThan(100);
  });

  it('generates paired icon + text storyboard from multiline script', () => {
    const elements = generateStoryboardFromScript(
      '1. Nova ideia de app mobile\n2. Crescimento rapido das vendas',
    );
    expect(elements.length).toBe(4);
    expect(elements[0].type).toBe('svg');
    expect(elements[1].type).toBe('text');
  });

  it('includes 45+ unique premium SVG assets across all categories', () => {
    expect(VECTOR_ASSETS.length).toBeGreaterThanOrEqual(45);
    const ids = new Set(VECTOR_ASSETS.map((a) => a.id));
    expect(ids.size).toBe(VECTOR_ASSETS.length);
  });
});

describe('AI Director Engine (5–10 min Storyboard & Gemini PCM/WAV)', () => {
  it('encodes, extracts, and resamples PCM16/WAV audio cleanly', async () => {
    const raw = new Int16Array(2400); // 0.1s at 24kHz
    for (let i = 0; i < raw.length; i++) {
      raw[i] = Math.round(Math.sin(i * 0.1) * 12000);
    }
    const wavBlob = encodePcm16ToWavBlob(raw, 24000);
    const wavBytes = new Uint8Array(await wavBlob.arrayBuffer());
    const extracted = extractPcm16Samples(wavBytes);
    expect(extracted.sampleRate).toBe(24000);
    expect(extracted.samples.length).toBe(2400);
    expect(extracted.samples[10]).toBe(raw[10]);

    const resampled = resamplePcm16(extracted.samples, 24000, 16000);
    expect(resampled.length).toBe(1600);
  });

  it('builds a 20-scene (~5 min) AI project synced tightly to exact scene audio durations', () => {
    const scenes = Array.from({ length: 20 }, (_, i) => ({
      heading: `${i + 1}. Capítulo ${i + 1}`,
      caption: 'Resumo visual sincronizado com a narração.',
      narration: 'Texto narrado pela voz natural do Google Gemini.',
      assetId: i % 2 === 0 ? 'lightbulb' : 'money-bag',
      animationMode: (i % 5 === 0 ? 'move-in' : 'draw') as 'draw' | 'move-in',
    }));
    const plan: AiStoryboardPlan = {
      title: 'Guia Completo de 5 Minutos',
      chosenTopic: 'Finanças e Produtividade',
      boardTheme: 'whiteboard',
      handStyle: 'realistic-pen',
      scenes,
    };
    const durations = scenes.map(() => 15); // 20 * 15s = 300s (5:00)
    const project = buildProjectFromAiPlan(plan, durations, null, '16:9');
    expect(project.elements.length).toBe(40); // 20 SVGs + 20 Texts
    const { totalDuration } = buildTimelineSchedule(project);
    expect(totalDuration).toBeGreaterThan(285);
    expect(totalDuration).toBeLessThan(315);
  });
});


