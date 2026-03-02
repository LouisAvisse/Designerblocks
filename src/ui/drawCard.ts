/**
 * Canvas 2D renderer for the Designer Card.
 * Draws a compact, tight card at 1200×630 (2x retina).
 */

interface CardData {
  userName: string;
  fileName: string;
  pageName: string;
  totalNodes: number;
  totalFrames: number;
  totalComponents: number;
  userInitial: string;
}

const W = 1200;
const H = 630;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawDesignerCard(data: CardData): string {
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  // ---- Background ----
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, W, H);

  // Ambient glow — green (bottom-left)
  const g1 = ctx.createRadialGradient(180, 500, 0, 180, 500, 350);
  g1.addColorStop(0, 'rgba(60, 255, 160, 0.05)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Ambient glow — purple (top-right)
  const g2 = ctx.createRadialGradient(1020, 120, 0, 1020, 120, 300);
  g2.addColorStop(0, 'rgba(120, 100, 255, 0.035)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Outer border
  roundRect(ctx, 0, 0, W, H, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ---- Layout constants ----
  const mx = 56; // margin x
  const headerY = 52;
  const statsY = 190;
  const footerY = H - 52;

  // ---- Avatar ----
  const aSz = 48;
  ctx.save();
  ctx.beginPath();
  ctx.arc(mx + aSz / 2, headerY + aSz / 2, aSz / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#3CFFA0';
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = '700 19px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.userInitial, mx + aSz / 2, headerY + aSz / 2 + 1);
  ctx.restore();

  // ---- User name ----
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = '700 22px Inter, -apple-system, sans-serif';
  ctx.fillText(data.userName, mx + aSz + 16, headerY + 4);

  // ---- File + Page ----
  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.font = '500 13px Inter, -apple-system, sans-serif';
  ctx.fillText(data.fileName + '  ·  ' + data.pageName, mx + aSz + 16, headerY + 32);

  // ---- Main stat (big center number) ----
  const centerX = W / 2;
  const bigY = statsY + 40;

  ctx.fillStyle = '#3CFFA0';
  ctx.font = '700 72px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(data.totalNodes.toLocaleString(), centerX, bigY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.font = '600 13px Inter, -apple-system, sans-serif';
  ctx.fillText('TOTAL NODES', centerX, bigY + 82);

  // ---- Secondary stats row ----
  const secY = bigY + 135;
  const secStats = [
    { num: data.totalFrames.toLocaleString(), label: 'FRAMES' },
    { num: data.totalComponents.toLocaleString(), label: 'COMPONENTS' },
  ];

  const secW = 200;
  const secGap = 24;
  const secTotalW = secStats.length * secW + (secStats.length - 1) * secGap;
  const secStartX = centerX - secTotalW / 2;

  secStats.forEach((stat, i) => {
    const x = secStartX + i * (secW + secGap);

    roundRect(ctx, x, secY, secW, 80, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '700 24px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(stat.num, x + secW / 2, secY + 16);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.font = '600 10px Inter, -apple-system, sans-serif';
    ctx.fillText(stat.label, x + secW / 2, secY + 50);
  });

  // ---- Footer ----
  ctx.textBaseline = 'bottom';

  ctx.fillStyle = '#3CFFA0';
  ctx.font = '700 11px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DESIGNERBLOCKS', mx, footerY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.font = '500 11px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'right';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  ctx.fillText(dateStr, W - mx, footerY);

  return canvas.toDataURL('image/png');
}

/** Convert data URL to Uint8Array for Figma createImage */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
