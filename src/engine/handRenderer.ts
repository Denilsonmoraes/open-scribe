import type { HandStyle } from '../types/scribe';

/**
 * Draws a crisp, realistic vector hand + writing instrument with its tip anchored
 * precisely at `(tipX, tipY)` in screen space.
 */
export function drawAnimatedHand(
  ctx: CanvasRenderingContext2D,
  style: HandStyle,
  tipX: number,
  tipY: number,
  angleTilt = 0,
  nibColor = '#18181b',
  scale = 1,
): void {
  if (style === 'none') return;

  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.scale(scale, scale);
  ctx.rotate(angleTilt * 0.08);

  // Drop shadow on whiteboard paper
  ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 14;

  if (style === 'minimal-nib') {
    // Sleek minimal architectural pen nib
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
    // Eraser block
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-24, -14, 64, 28, 6);
    ctx.fill();
    ctx.stroke();

    // Felt pad
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-24, 6, 64, 10, 3);
    ctx.fill();

    // Hand gripping eraser
    drawHandBack(ctx, 22, 8);
    ctx.restore();
    return;
  }

  // Draw palm & lower fingers behind the pen barrel
  drawHandPalmBehind(ctx, 26, 10);

  // Pen / Marker / Pencil / Chalk orientation anchored at (0, 0)
  ctx.save();
  ctx.rotate(-0.68); // Natural ~39deg writing angle pointing down-left to tip

  if (style === 'marker') {
    // Thick whiteboard marker barrel
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(18, -11, 136, 22, 6);
    ctx.fill();
    ctx.stroke();

    // Colored cap collar & end plug
    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.roundRect(12, -8.5, 16, 17, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(142, -10.5, 16, 21, 4);
    ctx.fill();

    // Felt chisel tip
    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(12, -4.5);
    ctx.lineTo(12, 4.5);
    ctx.closePath();
    ctx.fill();
  } else if (style === 'pencil') {
    // Classic yellow graphite pencil
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(22, -6.5, 135, 13, 2);
    ctx.fill();

    // Wood cone
    ctx.fillStyle = '#f5d0a9';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(22, -6.5);
    ctx.lineTo(22, 6.5);
    ctx.closePath();
    ctx.fill();

    // Graphite tip
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
    // 'realistic-pen': sleek studio fineliner
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(18, -7, 140, 14, 5);
    ctx.fill();

    // Metallic grip ring
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(18, -6, 14, 12);

    // Tapered metal cone
    ctx.fillStyle = '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(18, -5.5);
    ctx.lineTo(18, 5.5);
    ctx.closePath();
    ctx.fill();

    // Fine nib tip
    ctx.fillStyle = nibColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Draw index & thumb fingers gripping over the pen barrel
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

  // Palm & wrist leading off canvas
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

  // Subtle curled middle/ring finger under pen
  ctx.fillStyle = '#dfa98b';
  ctx.beginPath();
  ctx.ellipse(24, 34, 22, 11, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crisp studio shirt cuff at bottom-right
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

  // Index finger resting along top of pen
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

  // Thumb curling around front over pen grip
  ctx.beginPath();
  ctx.moveTo(-2, 4);
  ctx.quadraticCurveTo(14, -12, 44, -4);
  ctx.quadraticCurveTo(58, 4, 52, 20);
  ctx.quadraticCurveTo(34, 30, 8, 22);
  ctx.quadraticCurveTo(-4, 16, -2, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle nail highlight
  ctx.fillStyle = 'rgba(255, 244, 238, 0.55)';
  ctx.beginPath();
  ctx.ellipse(6, -10, 5.5, 3, -0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
