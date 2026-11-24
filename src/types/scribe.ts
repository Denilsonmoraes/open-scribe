export interface Point2D {
  x: number;
  y: number;
}

export interface VectorStroke {
  points: Point2D[];
  /** Cumulative arc lengths matching `points` (starts at 0). */
  lengths: number[];
  totalLength: number;
  color?: string;
  width?: number;
  closed?: boolean;
  fillColor?: string;
}

export type BoardTheme = 'whiteboard' | 'chalkboard' | 'blueprint' | 'dotgrid';

export type HandStyle =
  | 'realistic-pen'
  | 'marker'
  | 'pencil'
  | 'chalk'
  | 'minimal-nib'
  | 'eraser'
  | 'none';

export type AnimationMode = 'draw' | 'move-in' | 'fade' | 'pop' | 'slide-up';

export type MoveDirection = 'left' | 'right' | 'top' | 'bottom';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type HandwritingFont =
  | 'Caveat'
  | 'Patrick Hand'
  | 'Architects Daughter'
  | 'Indie Flower'
  | 'Plus Jakarta Sans'
  | 'JetBrains Mono';

export interface ElementCamera {
  /** World-space center X when focusing this element */
  cx: number;
  /** World-space center Y when focusing this element */
  cy: number;
  /** Zoom multiplier (1 = 100% view fitting base stage) */
  zoom: number;
  /** When true, camera automatically centers cleanly on the element */
  autoFit: boolean;
}

export interface TraceConfig {
  mode: 'contour' | 'lineart';
  /** 0..100 sensitivity for edge/ink detection */
  sensitivity: number;
  /** 0.5..6 RDP simplification tolerance (lower = more detail) */
  detail: number;
  invert: boolean;
  revealOriginal: boolean;
}

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: number;
  elementCount: number;
  aspectRatio: AspectRatio;
  boardTheme: BoardTheme;
  source: 'local-db' | 'desktop-disk';
}

export interface ScribeElement {
  id: string;
  name: string;
  type: 'svg' | 'traced-image' | 'text';
  /** Center X in infinite world coordinates */
  x: number;
  /** Center Y in infinite world coordinates */
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees

  /** Timing (seconds) */
  drawDuration: number;
  pauseDuration: number;
  transitionDuration: number;
  animationMode: AnimationMode;
  moveInFrom?: MoveDirection;

  /** Styling */
  strokeColor: string;
  strokeWidth: number;
  fillReveal: boolean;
  fillColor: string;
  opacity: number;
  handStyleOverride?: HandStyle | 'inherit';

  /** Camera framing */
  camera: ElementCamera;

  /** Normalized vector strokes (coordinates normalized to [0..1] within element box) */
  strokes: VectorStroke[];
  sourceSvg?: string;

  /** For traced raster images */
  rasterDataUrl?: string;
  traceConfig?: TraceConfig;

  /** For text elements */
  text?: string;
  fontFamily?: HandwritingFont;
  fontSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  textBgColor?: string;
}

export interface AudioTrackData {
  id: string;
  name: string;
  dataUrl: string;
  duration: number;
  volume: number;
  offset: number;
  waveform: number[];
}

export interface ScribeProject {
  id: string;
  title: string;
  updatedAt: number;
  boardTheme: BoardTheme;
  backgroundColor: string;
  aspectRatio: AspectRatio;
  defaultHandStyle: HandStyle;
  elements: ScribeElement[];
  voiceover: AudioTrackData | null;
  music: AudioTrackData | null;
}

export interface ScheduledElement {
  element: ScribeElement;
  index: number;
  startTime: number;
  drawEndTime: number;
  pauseEndTime: number;
  endTime: number;
  cameraStart: { cx: number; cy: number; zoom: number };
  cameraTarget: { cx: number; cy: number; zoom: number };
}

export interface ExportConfig {
  resolution: '720p' | '1080p';
  fps: 30 | 60;
  format: 'mp4' | 'webm';
}

export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding-audio' | 'finalizing' | 'done' | 'error';
  progress: number; // 0..1
  currentFrame: number;
  totalFrames: number;
  message: string;
}
