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
  buildTimelineSchedule,
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
  it('traces synthetic black square silhouette into closed/continuous contour strokes', () => {
    const w = 64;
    const h = 64;
    const rgba = new Uint8ClampedArray(w * h * 4);
    // White background
    rgba.fill(255);
    // Draw solid dark square inside [16..48, 16..48]
    for (let y = 16; y < 48; y++) {
      for (let x = 16; x < 48; x++) {
        const i = (y * w + x) * 4;
        rgba[i] = 20;
        rgba[i + 1] = 20;
        rgba[i + 2] = 20;
        rgba[i + 3] = 255;
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
  });

  it('skeletonizes lineart drawings into thin centerlines', () => {
    const w = 64;
    const h = 64;
    const rgba = new Uint8ClampedArray(w * h * 4);
    rgba.fill(255);
    // Thick diagonal ink line
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

  it('generates paired icon + text storyboard from multiline script', () => {
    const elements = generateStoryboardFromScript(
      '1. Nova ideia de app mobile\n2. Crescimento rapido das vendas',
    );
    expect(elements.length).toBe(4);
    expect(elements[0].type).toBe('svg');
    expect(elements[1].type).toBe('text');
  });
});
