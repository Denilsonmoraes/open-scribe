import { VECTOR_ASSETS } from './assetLibrary';
import { parseSvgToStrokes } from '../engine/svgParser';
import type { ScribeElement, ScribeProject } from '../types/scribe';

function makeAssetElement(
  assetId: string,
  opts: {
    id: string;
    x: number;
    y: number;
    size?: number;
    drawDuration?: number;
    pauseDuration?: number;
    transitionDuration?: number;
    strokeColor?: string;
    camera?: { cx: number; cy: number; zoom: number; autoFit: boolean };
  },
): ScribeElement {
  const preset = VECTOR_ASSETS.find((a) => a.id === assetId) ?? VECTOR_ASSETS[0];
  const parsed = parseSvgToStrokes(preset.svg);
  const w = opts.size ?? 250;
  return {
    id: opts.id,
    name: preset.name,
    type: 'svg',
    x: opts.x,
    y: opts.y,
    width: w,
    height: Math.round(w / Math.max(0.4, parsed.aspectRatio)),
    rotation: 0,
    drawDuration: opts.drawDuration ?? 2.2,
    pauseDuration: opts.pauseDuration ?? 0.35,
    transitionDuration: opts.transitionDuration ?? 0.6,
    animationMode: 'draw',
    strokeColor: opts.strokeColor ?? preset.defaultStrokeColor,
    strokeWidth: 3.4,
    fillReveal: true,
    fillColor: preset.defaultFillColor,
    opacity: 1,
    camera: opts.camera ?? { cx: opts.x, cy: opts.y, zoom: 1, autoFit: false },
    strokes: parsed.strokes,
    sourceSvg: preset.svg,
  };
}

function makeTextElement(opts: {
  id: string;
  text: string;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  color?: string;
  drawDuration?: number;
  pauseDuration?: number;
  transitionDuration?: number;
  camera?: { cx: number; cy: number; zoom: number; autoFit: boolean };
}): ScribeElement {
  return {
    id: opts.id,
    name: opts.text.slice(0, 26),
    type: 'text',
    x: opts.x,
    y: opts.y,
    width: opts.width ?? 480,
    height: 180,
    rotation: 0,
    drawDuration: opts.drawDuration ?? 2.0,
    pauseDuration: opts.pauseDuration ?? 0.45,
    transitionDuration: opts.transitionDuration ?? 0.25,
    animationMode: 'draw',
    strokeColor: opts.color ?? '#18181b',
    strokeWidth: 3,
    fillReveal: false,
    fillColor: opts.color ?? '#18181b',
    opacity: 1,
    camera: opts.camera ?? { cx: opts.x, cy: opts.y, zoom: 1, autoFit: false },
    strokes: [],
    text: opts.text,
    fontFamily: 'Caveat',
    fontSize: opts.fontSize ?? 46,
    textAlign: 'left',
  };
}

export function createStarterProject(freshId = false): ScribeProject {
  const cam1 = { cx: 0, cy: 0, zoom: 1.05, autoFit: false };
  const cam2 = { cx: 1120, cy: 0, zoom: 1.05, autoFit: false };
  const cam3 = { cx: 1120, cy: 680, zoom: 1.05, autoFit: false };
  const camOverview = { cx: 560, cy: 340, zoom: 0.56, autoFit: false };

  return {
    id: freshId ? `demo-${Date.now()}` : 'demo-openscribe-1',
    title: freshId ? 'Novo Projeto Demo' : 'Apresentação Whiteboard Turbo',
    updatedAt: Date.now(),
    boardTheme: 'whiteboard',
    backgroundColor: '#faf9f5',
    aspectRatio: '16:9',
    defaultHandStyle: 'realistic-pen',
    voiceover: null,
    music: null,
    elements: [
      makeAssetElement('lightbulb', {
        id: 'demo-1',
        x: -200,
        y: -20,
        size: 240,
        drawDuration: 2.1,
        pauseDuration: 0.2,
        transitionDuration: 0,
        camera: cam1,
      }),
      makeTextElement({
        id: 'demo-2',
        text: '1. Toda grande ideia\ncomeça num rascunho!',
        x: 150,
        y: -15,
        width: 440,
        fontSize: 48,
        drawDuration: 2.1,
        pauseDuration: 0.5,
        transitionDuration: 0.15,
        camera: cam1,
      }),
      makeAssetElement('smartphone', {
        id: 'demo-3',
        x: 920,
        y: -15,
        size: 230,
        drawDuration: 2.0,
        pauseDuration: 0.2,
        transitionDuration: 0.65,
        camera: cam2,
      }),
      makeTextElement({
        id: 'demo-4',
        text: '2. Desenhe SVGs ou\nauto-vetorize qualquer PNG\ndireto no navegador.',
        x: 1270,
        y: -10,
        width: 450,
        fontSize: 42,
        drawDuration: 2.4,
        pauseDuration: 0.5,
        transitionDuration: 0.15,
        camera: cam2,
      }),
      makeAssetElement('rocket', {
        id: 'demo-5',
        x: 920,
        y: 670,
        size: 240,
        drawDuration: 2.2,
        pauseDuration: 0.2,
        transitionDuration: 0.65,
        camera: cam3,
      }),
      makeTextElement({
        id: 'demo-6',
        text: '3. Exporte em MP4\nsem marca d’água!',
        x: 1270,
        y: 670,
        width: 440,
        fontSize: 46,
        color: '#ea580c',
        drawDuration: 1.9,
        pauseDuration: 0.35,
        transitionDuration: 0.15,
        camera: cam3,
      }),
      makeAssetElement('check-badge', {
        id: 'demo-7',
        x: 560,
        y: 340,
        size: 230,
        drawDuration: 1.6,
        pauseDuration: 1.1,
        transitionDuration: 0.85,
        camera: camOverview,
      }),
    ],
  };
}

export function createBlankProject(): ScribeProject {
  return {
    id: `proj-${Date.now()}`,
    title: 'Novo Projeto Whiteboard',
    updatedAt: Date.now(),
    boardTheme: 'whiteboard',
    backgroundColor: '#faf9f5',
    aspectRatio: '16:9',
    defaultHandStyle: 'realistic-pen',
    voiceover: null,
    music: null,
    elements: [],
  };
}
