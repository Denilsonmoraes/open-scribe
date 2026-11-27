import type { HandStyle } from '../types/scribe';

interface RealHandSprite {
  src: string;
  /** Calibrated tip pixel X inside the PNG */
  tipX: number;
  /** Calibrated tip pixel Y inside the PNG */
  tipY: number;
  /** Target display width in screen pixels at scale = 1 */
  displayWidth: number;
  img: HTMLImageElement | null;
  loaded: boolean;
  failed: boolean;
}

const REAL_HAND_SPRITES: Record<'pen' | 'pencil' | 'drag', RealHandSprite> = {
  pen: {
    src: './hands/hand-pen.png',
    tipX: 5,
    tipY: 54,
    displayWidth: 540,
    img: null,
    loaded: false,
    failed: false,
  },
  pencil: {
    src: './hands/hand-pencil.png',
    tipX: 6,
    tipY: 49,
    displayWidth: 540,
    img: null,
    loaded: false,
    failed: false,
  },
  drag: {
    src: './hands/hand-drag.png',
    tipX: 22,
    tipY: 26,
    displayWidth: 500,
    img: null,
    loaded: false,
    failed: false,
  },
};

function ensureSprite(key: 'pen' | 'pencil' | 'drag', onLoad?: () => void): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  const spec = REAL_HAND_SPRITES[key];
  if (spec.failed) return null;
  if (spec.img) {
    return spec.loaded && spec.img.naturalWidth > 0 ? spec.img : null;
  }
  const img = new Image();
  img.onload = () => {
    spec.loaded = true;
    onLoad?.();
  };
  img.onerror = () => {
    spec.failed = true;
  };
  img.src = spec.src;
  spec.img = img;
  return null;
}

/**
 * Eagerly preloads all photorealistic hand PNGs so playback and MP4 export
 * render with the real hand from frame 0.
 */
export function preloadHandSprites(): Promise<void> {
  if (typeof Image === 'undefined') return Promise.resolve();
  const keys: Array<'pen' | 'pencil' | 'drag'> = ['pen', 'pencil', 'drag'];
  return Promise.all(
    keys.map(
      (key) =>
        new Promise<void>((resolve) => {
          const spec = REAL_HAND_SPRITES[key];
          if (spec.loaded || spec.failed) {
            resolve();
            return;
          }
          const img = spec.img ?? new Image();
          spec.img = img;
          const done = () => resolve();
          img.addEventListener(
            'load',
            () => {
              spec.loaded = true;
              done();
            },
            { once: true },
          );
          img.addEventListener(
            'error',
            () => {
              spec.failed = true;
              done();
            },
            { once: true },
          );
          if (!img.src) {
            img.src = spec.src;
          } else if (img.complete) {
            spec.loaded = img.naturalWidth > 0;
            done();
          }
        }),
    ),
  ).then(() => undefined);
}

// Kick off background preload immediately in browser environments
if (typeof window !== 'undefined') {
  void preloadHandSprites();
}

/**
 * Draws a photorealistic (or specialized vector) hand + writing instrument with its tip
 * anchored precisely at `(tipX, tipY)` in screen space.
 */
export function drawAnimatedHand(
  ctx: CanvasRenderingContext2D,
  style: HandStyle,
  tipX: number,
  tipY: number,
  angleTilt = 0,
  nibColor = '#18181b',
  scale = 1,
  isLifted = false,
  onSpriteLoad?: () => void,
): void {
  if (style === 'none') return;

  const liftScale = isLifted ? 1.035 : 1;
  const liftOffsetY = isLifted ? -6 * scale : 0;

  ctx.save();
  ctx.translate(tipX, tipY + liftOffsetY);
  ctx.scale(scale * liftScale, scale * liftScale);
  // Subtle, velocity-driven wrist tilt (never over-rotates away from the ink tip)
  const clampedTilt = Math.max(-1, Math.min(1, angleTilt));
  ctx.rotate(clampedTilt * 0.055);

  // Realistic 3D cast shadow on the whiteboard surface (expands softly when lifted)
  ctx.shadowColor = isLifted ? 'rgba(15, 23, 42, 0.18)' : 'rgba(15, 23, 42, 0.28)';
  ctx.shadowBlur = isLifted ? 24 : 14;
  ctx.shadowOffsetX = isLifted ? 15 : 8;
  ctx.shadowOffsetY = isLifted ? 22 : 12;

  // Photorealistic real human hands for primary writing styles
  if (style === 'realistic-pen' || style === 'marker' || style === 'pencil') {
    const spriteKey = style === 'pencil' ? 'pencil' : 'pen';
    const spec = REAL_HAND_SPRITES[spriteKey];
    const img = ensureSprite(spriteKey, onSpriteLoad);
    if (img) {
      const styleMul = style === 'marker' ? 1.06 : 1.0;
      const drawW = spec.displayWidth * styleMul;
      const ratio = drawW / img.naturalWidth;
      const drawH = img.naturalHeight * ratio;
      const anchorX = spec.tipX * ratio;
      const anchorY = spec.tipY * ratio;

      ctx.drawImage(img, -anchorX, -anchorY, drawW, drawH);

      // For colored markers/pens, add a tiny wet-ink sheen right at the tip (0,0) when touching paper
      if (!isLifted && style === 'marker') {
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = nibColor;
        ctx.beginPath();
        ctx.arc(1, 0, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return;
    }
  }

  if (style === 'minimal-nib') {
    ctx.rotate(-0.52);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, -6);
    ctx.lineTo(118, -14);
    ctx.lineTo(124, 0);
    ctx.lineTo(118, 14);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(112, 0);
    ctx.stroke();

    ctx.restore();
    return;
  }

  if (style === 'eraser') {
    ctx.rotate(-0.35);
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -14, 64, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-24, 6, 64, 10, 3);
    ctx.fill();

    drawHandBack(ctx, 22, 8);
    ctx.restore();
    return;
  }

  // Fallback vector hand (used for 'chalk' or while PNG is still decoding on first tick)
  drawHandPalmBehind(ctx, 26, 10);

  ctx.save();
  ctx.rotate(-0.68);

  if (style === 'marker') {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(18, -11, 136, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.roundRect(12, -8.5, 16, 17, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(142, -10.5, 16, 21, 4);
    ctx.fill();

    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -4.5);
    ctx.lineTo(12, 4.5);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'pencil') {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(22, -6.5, 135, 13, 2);
    ctx.fill();

    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -6.5);
    ctx.lineTo(22, 6.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(7.5, -2.2);
    ctx.lineTo(7.5, 2.2);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'chalk') {
    ctx.fillStyle = '#f4f4f5';
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(0, -6.5, 86, 13, 4);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(18, -7, 140, 14, 5);
    ctx.fill();

    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(18, -6, 14, 12);

    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(18, -5.5);
    ctx.lineTo(18, 5.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  drawHandFingersFront(ctx, 26, 10);

  ctx.restore();
}

function drawHandBack(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
  drawHandPalmBehind(ctx, offsetX, offsetY);
  drawHandFingersFront(ctx, offsetX, offsetY);
}

function drawHandPalmBehind(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);

  const skinGrad = ctx.createLinearGradient(0, -20, 140, 120);
  skinGrad.addColorStop(0, '#f7cbb2');
  skinGrad.addColorStop(0.55, '#ecc1a5');
  skinGrad.addColorStop(1, '#dba789');

  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = 'rgba(120, 72, 48, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.quadraticCurveTo(42, -16, 98, -10);
  ctx.quadraticCurveTo(156, 2, 210, 52);
  ctx.lineTo(175, 138);
  ctx.quadraticCurveTo(96, 105, 42, 72);
  ctx.quadraticCurveTo(12, 52, 8, 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#dfa98b';
  ctx.beginPath();
  ctx.ellipse(24, 34, 22, 11, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#27272a';
  ctx.beginPath();
  ctx.moveTo(158, 36);
  ctx.lineTo(245, 86);
  ctx.lineTo(205, 165);
  ctx.lineTo(124, 114);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(148, 34);
  ctx.lineTo(164, 42);
  ctx.lineTo(132, 118);
  ctx.lineTo(116, 110);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHandFingersFront(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number): void {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.shadowColor = 'transparent';

  const skinGrad = ctx.createLinearGradient(0, -20, 120, 40);
  skinGrad.addColorStop(0, '#f7cbb2');
  skinGrad.addColorStop(1, '#e7b99b');

  ctx.fillStyle = skinGrad;
  ctx.strokeStyle = 'rgba(120, 72, 48, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(2, -14);
  ctx.quadraticCurveTo(34, -30, 76, -18);
  ctx.quadraticCurveTo(104, -8, 114, 10);
  ctx.lineTo(66, 20);
  ctx.quadraticCurveTo(22, -2, 2, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.quadraticCurveTo(14, -12, 44, -4);
  ctx.quadraticCurveTo(58, 4, 52, 20);
  ctx.quadraticCurveTo(34, 30, 8, 22);
  ctx.quadraticCurveTo(-4, 16, -2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 244, 238, 0.55)';
  ctx.beginPath();
  ctx.ellipse(6, -10, 5.5, 3, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a photorealistic real human hand sliding/placing an object during Move-In transitions.
 */
export function drawDraggingHand(
  ctx: CanvasRenderingContext2D,
  gripX: number,
  gripY: number,
  from: 'left' | 'right' | 'top' | 'bottom' = 'right',
  scale = 1,
  onSpriteLoad?: () => void,
): void {
  ctx.save();
  ctx.translate(gripX, gripY);
  ctx.scale(scale, scale);

  const rotMap = {
    right: -0.18,
    left: Math.PI * 0.78,
    top: -Math.PI * 0.55,
    bottom: Math.PI * 0.22,
  } as const;
  ctx.rotate(rotMap[from]);

  ctx.shadowColor = 'rgba(15, 23, 42, 0.26)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 9;
  ctx.shadowOffsetY = 14;

  const spec = REAL_HAND_SPRITES.drag;
  const img = ensureSprite('drag', onSpriteLoad);
  if (img) {
    const drawW = spec.displayWidth;
    const ratio = drawW / img.naturalWidth;
    const drawH = img.naturalHeight * ratio;
    const anchorX = spec.tipX * ratio;
    const anchorY = spec.tipY * ratio;
    ctx.drawImage(img, -anchorX, -anchorY, drawW, drawH);
    ctx.restore();
    return;
  }

  // Fallback vector dragging hand
  drawHandPalmBehind(ctx, 18, 6);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#f5c7ab';
  ctx.strokeStyle = 'rgba(120, 72, 48, 0.28)';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.roundRect(-8, -14, 46, 15, 7);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-2, 2, 42, 14, 7);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
