/**
 * Canvas 2D renderer for the Designer Card.
 * High-quality shareable PNG: 1200×630 (OG format), 2× retina.
 */

interface CardData {
  userName: string;
  photoUrl: string | null;
  fileName: string;
  pageName: string;
  totalNodes: number;
  totalFrames: number;
  totalComponents: number;
  userInitial: string;
  activityData: Record<string, number>;
  activityView: 'year' | 'month' | 'week';
  activityOffset: number;
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

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Shrinks font size until text fits within maxWidth. ctx.font is set to result. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number
): number {
  let size = maxSize;
  ctx.font = `700 ${size}px Inter, -apple-system, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = `700 ${size}px Inter, -apple-system, sans-serif`;
  }
  return size;
}

export async function drawDesignerCard(data: CardData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.scale(2, 2);

  const leftPaneW = 460;
  const mx = 64;

  // ── BACKGROUND ────────────────────────────────────────────────
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, W, H);

  // Dot-grid texture
  ctx.fillStyle = 'rgba(255,255,255,0.020)';
  const dotSpacing = 28;
  for (let dx = dotSpacing / 2; dx < W; dx += dotSpacing) {
    for (let dy = dotSpacing / 2; dy < H; dy += dotSpacing) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Ambient glow — green, bottom-left
  const g1 = ctx.createRadialGradient(80, H - 60, 0, 80, H - 60, 500);
  g1.addColorStop(0, 'rgba(60,255,160,0.22)');
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Ambient glow — purple, top-right
  const g2 = ctx.createRadialGradient(W - 80, 60, 0, W - 80, 60, 420);
  g2.addColorStop(0, 'rgba(110,80,255,0.16)');
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  // Card border
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  // Corner brackets
  const cb = 18, cp = 20;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cp, cp + cb); ctx.lineTo(cp, cp); ctx.lineTo(cp + cb, cp); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - cp - cb, cp); ctx.lineTo(W - cp, cp); ctx.lineTo(W - cp, cp + cb); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cp, H - cp - cb); ctx.lineTo(cp, H - cp); ctx.lineTo(cp + cb, H - cp); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - cp - cb, H - cp); ctx.lineTo(W - cp, H - cp); ctx.lineTo(W - cp, H - cp - cb); ctx.stroke();

  // ── LEFT PANE: HEADER ─────────────────────────────────────────
  const avatarSz = 48;
  const headerMY = 46;

  ctx.save();
  ctx.beginPath();
  ctx.arc(mx + avatarSz / 2, headerMY + avatarSz / 2, avatarSz / 2, 0, Math.PI * 2);
  ctx.clip();

  let photoDrawn = false;
  if (data.photoUrl) {
    try {
      const img = await loadImage(data.photoUrl);
      ctx.drawImage(img, mx, headerMY, avatarSz, avatarSz);
      photoDrawn = true;
    } catch { /* fall through */ }
  }
  if (!photoDrawn) {
    ctx.fillStyle = '#3CFFA0';
    ctx.fillRect(mx, headerMY, avatarSz, avatarSz);
    ctx.fillStyle = '#000';
    ctx.font = '700 18px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.userInitial, mx + avatarSz / 2, headerMY + avatarSz / 2 + 1);
  }
  ctx.restore();

  // Avatar ring
  ctx.beginPath();
  ctx.arc(mx + avatarSz / 2, headerMY + avatarSz / 2, avatarSz / 2 + 1, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const textX = mx + avatarSz + 16;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 18px Inter, -apple-system, sans-serif';
  ctx.fillText(data.userName, textX, headerMY + 4, leftPaneW - textX);

  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.font = '400 12px Inter, -apple-system, sans-serif';
  ctx.fillText(`${data.fileName}  ·  ${data.pageName}`, textX, headerMY + 28, leftPaneW - textX);

  // ── LEFT PANE: SEPARATOR ──────────────────────────────────────
  const sepY = headerMY + avatarSz + 24;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx, sepY); ctx.lineTo(leftPaneW, sepY);
  ctx.stroke();

  // Vertical divider between left/right panes
  const divX = leftPaneW + 40;
  ctx.beginPath();
  ctx.moveTo(divX, mx); ctx.lineTo(divX, H - mx);
  ctx.stroke();

  // ── LEFT PANE: STATS (Nodes + Frames + Comps Stacked) ─────────
  const statBoxTop = sepY + 24;
  const statBoxH = H - mx - 20 - statBoxTop; // Reserve 20px for footer

  // Hero (Nodes) box
  const heroH = statBoxH * 0.52;
  roundRect(ctx, mx, statBoxTop, leftPaneW - mx, heroH, 12);
  const heroGrad = ctx.createLinearGradient(mx, statBoxTop, mx, statBoxTop + heroH);
  heroGrad.addColorStop(0, 'rgba(60,255,160,0.05)');
  heroGrad.addColorStop(1, 'rgba(60,255,160,0.01)');
  ctx.fillStyle = heroGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,255,160,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const heroCX = mx + (leftPaneW - mx) / 2;
  const nodesStr = data.totalNodes.toLocaleString();
  const heroFontSize = fitFontSize(ctx, nodesStr, leftPaneW - mx - 40, 72, 32);

  ctx.fillStyle = '#3CFFA0';
  ctx.font = `700 ${heroFontSize}px Inter, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nodesStr, heroCX, statBoxTop + heroH / 2 - 8);

  ctx.fillStyle = 'rgba(60,255,160,0.50)';
  ctx.font = '600 11px Inter, -apple-system, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('TOTAL NODES', heroCX, statBoxTop + heroH - 16);

  // Secondary boxes (Frames & Components)
  const secTop = statBoxTop + heroH + 16;
  const secH = statBoxH - heroH - 16;
  const secGap = 16;
  const secW = (leftPaneW - mx - secGap) / 2;

  const secStats = [
    { num: data.totalFrames.toLocaleString(), label: 'FRAMES' },
    { num: data.totalComponents.toLocaleString(), label: 'COMP' }
  ];

  secStats.forEach((stat, i) => {
    const bx = mx + i * (secW + secGap);
    const by = secTop;

    roundRect(ctx, bx, by, secW, secH, 10);
    const boxGrad = ctx.createLinearGradient(bx, by, bx, by + secH);
    boxGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
    boxGrad.addColorStop(1, 'rgba(255,255,255,0.01)');
    ctx.fillStyle = boxGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    const statSize = fitFontSize(ctx, stat.num, secW - 24, 42, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `700 ${statSize}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.num, bx + secW / 2, by + secH / 2 - 8);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 10px Inter, -apple-system, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.fillText(stat.label, bx + secW / 2, by + secH - 14);
  });

  // ── FOOTER (Left Pane) ────────────────────────────────────────
  const footerY = H - 22;
  ctx.fillStyle = '#3CFFA0';
  ctx.font = '700 10px Inter, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('STATISTIGMA', mx, footerY);

  // ── RIGHT PANE: ACTIVITY CHART ────────────────────────────────
  const rightPaneX = divX + 50;
  const rightPaneW = W - rightPaneX - mx;

  // Data Aggregation logic (matches ActivityHeatmap.tsx)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const daysVisible = data.activityView === 'year' ? 365 : data.activityView === 'month' ? 30 : 7;
  const endPoint = addDays(today, data.activityOffset * daysVisible);
  const startPoint = addDays(endPoint, -(daysVisible - 1));

  const cells: { date: Date; key: string; count: number }[] = [];
  let d = new Date(startPoint);
  while (d <= endPoint) {
    const k = dateKey(d);
    cells.push({ date: new Date(d), key: k, count: data.activityData[k] ?? 0 });
    d = addDays(d, 1);
  }

  const maxCount = Math.max(...cells.map(c => c.count), 0);
  const getLevelDynamic = (count: number) => {
    if (count === 0 || maxCount === 0) return 0;
    const step = maxCount / 4;
    if (count <= step) return 1;
    if (count <= step * 2) return 2;
    if (count <= step * 3) return 3;
    return 4;
  };

  const COLORS = [
    'rgba(255,255,255,0.06)',
    'rgba(60,255,160,0.3)',
    'rgba(60,255,160,0.55)',
    'rgba(60,255,160,0.8)',
    'rgba(60,255,160,1)',
  ];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAY_ABR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const cellsWithLevel = cells.map(c => ({ ...c, level: getLevelDynamic(c.count) }));
  const totalChanges = cells.reduce((sum, c) => sum + c.count, 0);

  // Draw Chart Header
  let navLabel = '';
  if (data.activityView === 'year') {
    navLabel = `${addDays(today, data.activityOffset * 365 - 364).getFullYear()} – ${addDays(today, data.activityOffset * 365).getFullYear()}`;
  } else if (data.activityView === 'month') {
    navLabel = `${MONTHS[startPoint.getMonth()]} ${startPoint.getDate()} – ${MONTHS[endPoint.getMonth()]} ${endPoint.getDate()}, ${endPoint.getFullYear()}`;
  } else {
    navLabel = `${MONTHS[startPoint.getMonth()]} ${startPoint.getDate()} – ${MONTHS[endPoint.getMonth()]} ${endPoint.getDate()}`;
  }

  const chartTop = headerMY;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '700 24px Inter, -apple-system, sans-serif';
  ctx.fillText('Activity', rightPaneX, chartTop);

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '500 16px Inter, -apple-system, sans-serif';
  const titleW = ctx.measureText('Activity').width;
  ctx.fillText(`${totalChanges} changes`, rightPaneX + titleW + 16, chartTop + 6);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '600 14px Inter, -apple-system, sans-serif';
  ctx.fillText(navLabel, rightPaneX + rightPaneW, chartTop + 8);

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(rightPaneX, chartTop + 40); ctx.lineTo(rightPaneX + rightPaneW, chartTop + 40);
  ctx.stroke();

  // Draw Chart Content
  const contentTop = chartTop + 70;

  if (data.activityView === 'year') {
    let startGrid = new Date(startPoint);
    const dow = startGrid.getDay();
    startGrid = addDays(startGrid, -(dow === 0 ? 6 : dow - 1));

    const columns: { date: Date; key: string; count: number; level: number; inRange: boolean }[][] = [];
    let cur = new Date(startGrid);
    const gridEnd = addDays(endPoint, (7 - (endPoint.getDay() || 7)));

    while (cur <= gridEnd) {
      const col: any[] = [];
      for (let i = 0; i < 7; i++) {
        const k = dateKey(cur);
        const count = data.activityData[k] ?? 0;
        col.push({
          date: new Date(cur), key: k, count,
          level: getLevelDynamic(count),
          inRange: cur >= startPoint && cur <= endPoint
        });
        cur = addDays(cur, 1);
      }
      columns.push(col);
    }

    const monthLabels: { col: number; label: string }[] = [];
    let prevM = -1;
    columns.forEach((col, ci) => {
      const m = col[0].date.getMonth();
      if (m !== prevM) { monthLabels.push({ col: ci, label: MONTHS[m] }); prevM = m; }
    });

    const gap = 3;
    const colsCount = columns.length;
    // Fit columns into width
    const cellW = (rightPaneW - (colsCount - 1) * gap) / colsCount;
    const cellH = Math.min(cellW, Math.floor((statBoxH - 60) / 7)); // max height to fit 7 rows

    const actualGridH = 7 * cellH + 6 * gap;
    const gridYOffset = contentTop + 20;

    // Draw month labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '500 10px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    monthLabels.forEach(ml => {
      ctx.fillText(ml.label, rightPaneX + ml.col * (cellW + gap), gridYOffset - 8);
    });

    // Draw cells
    columns.forEach((col, ci) => {
      const cx = rightPaneX + ci * (cellW + gap);
      col.forEach((cell, ri) => {
        const cy = gridYOffset + ri * (cellH + gap);
        ctx.globalAlpha = cell.inRange ? 1 : 0.15;
        ctx.fillStyle = COLORS[cell.level];
        ctx.beginPath();
        ctx.moveTo(cx + 2, cy); ctx.lineTo(cx + cellW - 2, cy);
        ctx.quadraticCurveTo(cx + cellW, cy, cx + cellW, cy + 2);
        ctx.lineTo(cx + cellW, cy + cellH - 2);
        ctx.quadraticCurveTo(cx + cellW, cy + cellH, cx + cellW - 2, cy + cellH);
        ctx.lineTo(cx + 2, cy + cellH);
        ctx.quadraticCurveTo(cx, cy + cellH, cx, cy + cellH - 2);
        ctx.lineTo(cx, cy + 2);
        ctx.quadraticCurveTo(cx, cy, cx + 2, cy);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    });

  } else if (data.activityView === 'month') {
    // 7 columns
    const cols = 7;
    const gap = 8;
    const cellW = (rightPaneW - (cols - 1) * gap) / cols;
    const cellH = 50;

    // Draw days of week header
    const dowY = contentTop;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '600 11px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < 7; i++) {
      ctx.fillText(DAY_ABR[i], rightPaneX + i * (cellW + gap) + cellW / 2, dowY);
    }

    // Month uses a rolling block display, just wrap elements
    const gridTop = dowY + 24;
    cellsWithLevel.forEach((cell, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = rightPaneX + col * (cellW + gap);
      const cy = gridTop + row * (cellH + gap);

      roundRect(ctx, cx, cy, cellW, cellH, 6);
      ctx.fillStyle = COLORS[cell.level];
      ctx.fill();

      ctx.fillStyle = cell.count > 0 ? '#000' : 'rgba(255,255,255,0.4)';
      ctx.font = '600 12px Inter, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      // Date number
      ctx.fillText(cell.date.getDate().toString(), cx + cellW / 2, cy + cellH / 2);
    });

  } else if (data.activityView === 'week') {
    const gap = 16;
    const colW = (rightPaneW - 6 * gap) / 7;
    const maxBarH = H - mx - contentTop - 60; // Leave room for legend

    const days = cellsWithLevel.map((c, i) => ({ ...c, label: DAY_ABR[i] }));
    const safeMax = Math.max(maxCount, 1);

    const barBottomY = contentTop + maxBarH;

    days.forEach((d, i) => {
      const bx = rightPaneX + i * (colW + gap);
      // Min height 4px, Max height maxBarH
      let bh = 4;
      if (d.count > 0) {
        bh = Math.max(12, Math.round((d.count / safeMax) * maxBarH));
      }

      // Draw bar
      ctx.fillStyle = COLORS[d.level];
      ctx.beginPath();
      const r = 4;
      ctx.moveTo(bx, barBottomY);
      ctx.lineTo(bx + colW, barBottomY);
      ctx.lineTo(bx + colW, barBottomY - bh + r);
      ctx.quadraticCurveTo(bx + colW, barBottomY - bh, bx + colW - r, barBottomY - bh);
      ctx.lineTo(bx + r, barBottomY - bh);
      ctx.quadraticCurveTo(bx, barBottomY - bh, bx, barBottomY - bh + r);
      ctx.fill();

      // Draw day label
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const isToday = dateKey(d.date) === dateKey(today);
      ctx.fillStyle = isToday ? '#3CFFA0' : 'rgba(255,255,255,0.3)';
      ctx.font = isToday ? '700 13px Inter, -apple-system, sans-serif' : '600 12px Inter, -apple-system, sans-serif';
      ctx.fillText(d.label, bx + colW / 2, barBottomY + 16);

      // Draw count above bar if > 0
      if (d.count > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '600 11px Inter, -apple-system, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(d.count.toString(), bx + colW / 2, barBottomY - bh - 8);
      }
    });
  }

  // Draw Legend precisely bottom-right
  const legendY = H - 26;
  const legDot = 10;
  const legGap = 6;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '500 11px Inter, -apple-system, sans-serif';
  ctx.fillText('More', rightPaneX + rightPaneW, legendY);

  let lex = rightPaneX + rightPaneW - ctx.measureText('More').width - legGap - legDot;
  for (let i = COLORS.length - 1; i >= 0; i--) {
    ctx.fillStyle = COLORS[i];
    roundRect(ctx, lex, legendY - legDot / 2, legDot, legDot, 2);
    ctx.fill();
    lex -= (legDot + Math.floor(legGap / 2));
  }

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('Less', lex - Math.floor(legGap / 2), legendY);

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
