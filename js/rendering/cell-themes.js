/**
 * Cell theme rendering — standalone drawing functions for each visual theme.
 * Extracted from Renderer class for modularity (< 1000 lines per file).
 */

import { getColorForType, getShapeForType } from '../piece.js';

const CELL_SIZE = 32;

function lightenColor(hex, percent) {
  const num = Number.parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, percent) {
  const num = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex, alpha) {
  const num = Number.parseInt(hex.slice(1), 16);
  return `rgba(${num >> 16},${(num >> 8) & 0xff},${num & 0xff},${alpha})`;
}

function drawCell(ctx, x, y, color, alpha, theme, cellSize) {
  if (y < 0) return;
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;
  const inset = 1;
  const w = cellSize - 2;

  ctx.globalAlpha = alpha;

  switch (theme) {
    case 'concrete': drawCellConcrete(ctx, px, py, inset, w, color); break;
    case 'crystal':  drawCellCrystal(ctx, px, py, inset, w, color); break;
    case 'metal':    drawCellMetal(ctx, px, py, inset, w, color); break;
    case 'ice':      drawCellIce(ctx, px, py, inset, w, color); break;
    case 'wood':     drawCellWood(ctx, px, py, inset, w, color); break;
    case 'plastic':  drawCellPlastic(ctx, px, py, inset, w, color); break;
    case 'gold':     drawCellGold(ctx, px, py, inset, w, color); break;
    case 'silver':   drawCellSilver(ctx, px, py, inset, w, color); break;
    default:         drawCellGlass(ctx, px, py, inset, w, color); break;
  }

  ctx.globalAlpha = 1;
}

function drawCellGlass(ctx, px, py, inset, w, color) {
  const r = 4;
  // Semi-transparent glass base
  const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE * 0.3, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 35));
  grad.addColorStop(0.3, color);
  grad.addColorStop(1, darkenColor(color, 20));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  // Glass surface — large specular gloss highlight
  const gloss = ctx.createLinearGradient(px, py, px, py + CELL_SIZE * 0.5);
  gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.10)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.roundRect(px + inset + 1, py + inset + 1, w - 2, w * 0.55, [r, r, 0, 0]);
  ctx.fill();

  // Edge refraction highlight (top-left)
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);
  ctx.fillRect(px + inset, py + inset + 2, 1.5, w - 4);

  // Bottom-right shadow for glass depth
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(px + inset + 2, py + CELL_SIZE - 2.5, w - 4, 1.5);
  ctx.fillRect(px + CELL_SIZE - 2.5, py + inset + 2, 1.5, w - 4);

  // Small circular specular glint
  const shineGrad = ctx.createRadialGradient(px + 9, py + 8, 0, px + 9, py + 8, 6);
  shineGrad.addColorStop(0, 'rgba(255,255,255,0.50)');
  shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(px + 4, py + 3, 12, 12);
}

function drawCellConcrete(ctx, px, py, inset, w, color) {
  const r = 2;
  // Flat matte base — slightly desaturated
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 12));
  grad.addColorStop(0.5, darkenColor(color, 8));
  grad.addColorStop(1, darkenColor(color, 22));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  // Rough surface texture — random dark speckles (aggregate)
  const sx = (px * 7 + py * 13) & 0xFFFF; // deterministic seed from position
  for (let i = 0; i < 8; i++) {
    const hash = (sx + i * 2654435761) & 0xFFFF;
    const dx = (hash % w) + inset;
    const dy = ((hash >> 4) % w) + inset;
    const size = 1 + (hash >> 8) % 3;
    ctx.fillStyle = (hash & 1) ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(px + dx, py + dy, size, size);
  }

  // Subtle crack line
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const cx = px + inset + ((sx >> 2) % (w - 6)) + 3;
  ctx.moveTo(cx, py + inset + 3);
  ctx.lineTo(cx + 3, py + CELL_SIZE - 4);
  ctx.stroke();

  // Top edge (weathered, not shiny)
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);

  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(px + inset + 2, py + CELL_SIZE - 3, w - 4, 2);
  ctx.fillRect(px + CELL_SIZE - 3, py + inset + 2, 2, w - 4);
}

function drawCellCrystal(ctx, px, py, inset, w, color) {
  const r = 3;
  const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE * 0.5, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 40));
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, darkenColor(color, 25));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  drawCrystalFacets(ctx, px, py, inset, w, r);

  // Bright specular highlight (facet catch-light)
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  ctx.beginPath();
  ctx.moveTo(px + 5, py + 3);
  ctx.lineTo(px + 14, py + 3);
  ctx.lineTo(px + 8, py + 10);
  ctx.closePath();
  ctx.fill();

  // Edge sparkle
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(px + inset + 2, py + inset, w - 4, 1);
  ctx.fillRect(px + inset, py + inset + 2, 1, w - 4);
}

/** Crystal internal facet lines and prismatic refraction. */
function drawCrystalFacets(ctx, px, py, inset, w, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.clip();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(px + inset, py + inset + w * 0.4);
  ctx.lineTo(px + inset + w * 0.6, py + inset);
  ctx.moveTo(px + inset + w * 0.3, py + inset + w);
  ctx.lineTo(px + inset + w, py + inset + w * 0.3);
  ctx.moveTo(px + inset, py + inset + w * 0.7);
  ctx.lineTo(px + inset + w * 0.3, py + inset + w);
  ctx.stroke();

  const rGrad = ctx.createLinearGradient(px + 6, py + 5, px + 20, py + 14);
  rGrad.addColorStop(0, 'rgba(255,100,100,0.12)');
  rGrad.addColorStop(0.3, 'rgba(255,255,100,0.12)');
  rGrad.addColorStop(0.6, 'rgba(100,255,100,0.10)');
  rGrad.addColorStop(1, 'rgba(100,100,255,0.10)');
  ctx.fillStyle = rGrad;
  ctx.fillRect(px + 5, py + 4, 16, 10);
  ctx.restore();
}

function drawCellMetal(ctx, px, py, inset, w, color) {
  const r = 2;
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 30));
  grad.addColorStop(0.15, lightenColor(color, 10));
  grad.addColorStop(0.5, darkenColor(color, 15));
  grad.addColorStop(0.55, lightenColor(color, 5));
  grad.addColorStop(0.85, darkenColor(color, 20));
  grad.addColorStop(1, darkenColor(color, 30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  drawMetalDetails(ctx, px, py, inset, w, r);

  // Top bevel
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.fillRect(px + inset + 1, py + inset, w - 2, 1.5);

  // Bottom/right shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(px + inset + 1, py + CELL_SIZE - 3, w - 2, 2);
  ctx.fillRect(px + CELL_SIZE - 3, py + inset + 1, 2, w - 2);

  // Rivet dots
  ctx.fillStyle = 'rgba(200,200,200,0.35)';
  ctx.beginPath();
  ctx.arc(px + 5, py + 5, 1.5, 0, Math.PI * 2);
  ctx.arc(px + CELL_SIZE - 5, py + 5, 1.5, 0, Math.PI * 2);
  ctx.arc(px + 5, py + CELL_SIZE - 5, 1.5, 0, Math.PI * 2);
  ctx.arc(px + CELL_SIZE - 5, py + CELL_SIZE - 5, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Brushed metal striations and specular band. */
function drawMetalDetails(ctx, px, py, inset, w, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += 3) {
    ctx.beginPath();
    ctx.moveTo(px + inset, py + inset + i);
    ctx.lineTo(px + inset + w, py + inset + i);
    ctx.stroke();
  }
  ctx.restore();

  const spec = ctx.createLinearGradient(px, py + 4, px, py + 12);
  spec.addColorStop(0, 'rgba(255,255,255,0)');
  spec.addColorStop(0.5, 'rgba(255,255,255,0.25)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(px + inset + 2, py + 4, w - 4, 8);
}

function drawCellIce(ctx, px, py, inset, w, color) {
  const r = 3;
  const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE * 0.4, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 45));
  grad.addColorStop(0.3, lightenColor(color, 25));
  grad.addColorStop(0.7, color);
  grad.addColorStop(1, darkenColor(color, 10));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  // Frost layer
  const frost = ctx.createLinearGradient(px, py, px + CELL_SIZE, py + CELL_SIZE);
  frost.addColorStop(0, 'rgba(220,240,255,0.30)');
  frost.addColorStop(0.5, 'rgba(200,230,255,0.10)');
  frost.addColorStop(1, 'rgba(180,220,255,0.20)');
  ctx.fillStyle = frost;
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.fill();

  drawIceCracks(ctx, px, py, inset, w, r);

  // Glossy ice shine
  const shine = ctx.createLinearGradient(px, py, px, py + CELL_SIZE * 0.4);
  shine.addColorStop(0, 'rgba(255,255,255,0.40)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.roundRect(px + inset + 2, py + inset + 1, w - 4, w * 0.4, [r, r, 0, 0]);
  ctx.fill();

  // Subtle blue edge glow
  ctx.fillStyle = 'rgba(150,200,255,0.15)';
  ctx.fillRect(px + inset, py + inset + 2, 1.5, w - 4);
  ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);
}

/** Deterministic ice surface crack lines clipped to cell. */
function drawIceCracks(ctx, px, py, inset, w, r) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px + inset, py + inset, w, w, r);
  ctx.clip();

  const seed = (px * 7 + py * 13) & 0xFFFF;
  ctx.strokeStyle = 'rgba(180,220,255,0.25)';
  ctx.lineWidth = 0.5;
  const cx = px + inset + (seed % (w - 8)) + 4;
  const cy = py + inset + ((seed >> 3) % (w - 8)) + 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx - 5, cy + 7);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 6, cy + 4);
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + 2, cy - 6);
  ctx.stroke();
  ctx.restore();
}

function drawCellWood(ctx, px, py, inset, w, color) {
  const r = 2;
  // Warm wood base gradient
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 18));
  grad.addColorStop(0.3, color);
  grad.addColorStop(0.7, darkenColor(color, 12));
  grad.addColorStop(1, darkenColor(color, 20));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.fill();
  // Horizontal wood grain lines
  ctx.save(); ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.6;
  const seed = (px * 7 + py * 13) & 0xFFFF;
  for (let i = 0; i < 5; i++) {
    const gy = py + inset + 3 + i * 5 + ((seed >> (i * 2)) & 3);
    ctx.beginPath();
    ctx.moveTo(px + inset, gy);
    ctx.quadraticCurveTo(px + inset + w * 0.5, gy + ((seed >> i) & 1 ? 1.5 : -1.5), px + inset + w, gy);
    ctx.stroke();
  }
  ctx.restore();
  // Top bevel
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);
  // Bottom/right shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(px + inset + 2, py + CELL_SIZE - 3, w - 4, 1.5);
  ctx.fillRect(px + CELL_SIZE - 3, py + inset + 2, 1.5, w - 4);
}

function drawCellPlastic(ctx, px, py, inset, w, color) {
  const r = 6;
  // Bright smooth base
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, lightenColor(color, 25));
  grad.addColorStop(0.4, color);
  grad.addColorStop(1, darkenColor(color, 15));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.fill();
  // Big glossy highlight (plastic sheen)
  const gloss = ctx.createRadialGradient(px + w * 0.4, py + w * 0.35, 0, px + w * 0.4, py + w * 0.35, w * 0.6);
  gloss.addColorStop(0, 'rgba(255,255,255,0.50)');
  gloss.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.fill();
  // Small circular bump (stud like LEGO)
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath();
  ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.5;
  ctx.stroke();
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(px + inset + 3, py + CELL_SIZE - 3, w - 6, 2);
}

function drawCellGold(ctx, px, py, inset, w, color) {
  const r = 2;
  // Rich gold multi-stop gradient
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, '#ffeaa0');
  grad.addColorStop(0.15, '#ffe070');
  grad.addColorStop(0.3, '#d4a520');
  grad.addColorStop(0.5, '#ffd700');
  grad.addColorStop(0.7, '#d4a520');
  grad.addColorStop(0.85, '#b8860b');
  grad.addColorStop(1, '#8b6914');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.fill();
  // Bright specular band
  const spec = ctx.createLinearGradient(px, py + 5, px, py + 14);
  spec.addColorStop(0, 'rgba(255,255,255,0)');
  spec.addColorStop(0.5, 'rgba(255,255,220,0.45)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec; ctx.fillRect(px + inset + 2, py + 5, w - 4, 9);
  // Top highlight edge
  ctx.fillStyle = 'rgba(255,255,200,0.35)'; ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);
  // Bottom/right shadow
  ctx.fillStyle = 'rgba(100,60,0,0.35)';
  ctx.fillRect(px + inset + 2, py + CELL_SIZE - 3, w - 4, 2);
  ctx.fillRect(px + CELL_SIZE - 3, py + inset + 2, 2, w - 4);
}

function drawCellSilver(ctx, px, py, inset, w, color) {
  const r = 2;
  // Silver gradient
  const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
  grad.addColorStop(0, '#e8e8e8');
  grad.addColorStop(0.15, '#d0d0d0');
  grad.addColorStop(0.3, '#a8a8a8');
  grad.addColorStop(0.5, '#c8c8c8');
  grad.addColorStop(0.7, '#a0a0a0');
  grad.addColorStop(0.85, '#909090');
  grad.addColorStop(1, '#787878');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.fill();
  // Polished mirror spec band
  const spec = ctx.createLinearGradient(px, py + 4, px, py + 13);
  spec.addColorStop(0, 'rgba(255,255,255,0)');
  spec.addColorStop(0.5, 'rgba(255,255,255,0.40)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec; ctx.fillRect(px + inset + 2, py + 4, w - 4, 9);
  // Subtle brush-line pattern
  ctx.save(); ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, r); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += 3) {
    ctx.beginPath(); ctx.moveTo(px + inset, py + inset + i); ctx.lineTo(px + inset + w, py + inset + i); ctx.stroke();
  }
  ctx.restore();
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px + inset + 2, py + inset, w - 4, 1.5);
  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(px + inset + 2, py + CELL_SIZE - 3, w - 4, 2);
  ctx.fillRect(px + CELL_SIZE - 3, py + inset + 2, 2, w - 4);
}

function drawMiniCell(ctx, px, py, inset, w, s, color, theme) {
  const draw = MINI_CELL_DRAWERS[theme] || MINI_CELL_DRAWERS['glass'];
  draw(ctx, px, py, inset, w, s, color);
}

/** Per-theme mini cell draw functions. */
const MINI_CELL_DRAWERS = {
  glass(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 35));
    grad.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
    ctx.fillRect(px + inset, py + 2, 1, w - 3);
  },
  concrete(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 12));
    grad.addColorStop(1, darkenColor(color, 22));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(px + 2, py + s - 2, w - 2, 1);
  },
  crystal(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px + s * 0.5, py + s);
    grad.addColorStop(0, lightenColor(color, 40));
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, darkenColor(color, 25));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
  },
  metal(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 30));
    grad.addColorStop(0.5, darkenColor(color, 15));
    grad.addColorStop(1, darkenColor(color, 30));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(px + 2, py + s - 2, w - 3, 1);
  },
  ice(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 45));
    grad.addColorStop(0.5, lightenColor(color, 20));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,240,255,0.25)';
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
  },
  wood(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 18));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(px + 2, py + s - 2, w - 2, 1);
  },
  plastic(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 25));
    grad.addColorStop(1, darkenColor(color, 15));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
  },
  gold(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, '#ffeaa0');
    grad.addColorStop(0.5, '#d4a520');
    grad.addColorStop(1, '#8b6914');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.30)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
  },
  silver(ctx, px, py, inset, w, s, color) {
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, '#e8e8e8');
    grad.addColorStop(0.5, '#a8a8a8');
    grad.addColorStop(1, '#787878');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1);
  },
};

function drawPreviewPiece(ctx, type, width, height, theme, cellSize) {
  const shape = getShapeForType(type);
  const color = getColorForType(type);
  const maxCellW = (width - 4) / shape[0].length;
  const maxCellH = (height - 4) / shape.length;
  const previewCellSize = Math.min(26, Math.floor(Math.min(maxCellW, maxCellH)));
  const offsetX = (width - shape[0].length * previewCellSize) / 2;
  const offsetY = (height - shape.length * previewCellSize) / 2;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const px = offsetX + c * previewCellSize;
        const py = offsetY + r * previewCellSize;
        const s = previewCellSize;
        ctx.globalAlpha = 1;
        drawPreviewCellThemed(ctx, px, py, s, color, theme);
      }
    }
  }
}

/** Draw a single themed cell at preview size. */
function drawPreviewCellThemed(ctx, px, py, s, color, theme) {
  const draw = PREVIEW_CELL_DRAWERS[theme] || PREVIEW_CELL_DRAWERS['glass'];
  draw(ctx, px, py, s, color);
}

const PREVIEW_CELL_DRAWERS = {
  glass(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 35));
    grad.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 4); ctx.fill();
    const gloss = ctx.createLinearGradient(px, py, px, py + s * 0.5);
    gloss.addColorStop(0, 'rgba(255,255,255,0.45)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(px + 3, py + 2, w - 4, w * 0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1.5);
  },
  concrete(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 12));
    grad.addColorStop(0.5, darkenColor(color, 8));
    grad.addColorStop(1, darkenColor(color, 22));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px + 3, py + s - 3, w - 4, 2);
  },
  crystal(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px + s * 0.5, py + s);
    grad.addColorStop(0, lightenColor(color, 40));
    grad.addColorStop(0.4, color);
    grad.addColorStop(1, darkenColor(color, 25));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.beginPath();
    ctx.moveTo(px + 4, py + 3); ctx.lineTo(px + 12, py + 3); ctx.lineTo(px + 7, py + 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1);
  },
  metal(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 30));
    grad.addColorStop(0.15, lightenColor(color, 10));
    grad.addColorStop(0.5, darkenColor(color, 15));
    grad.addColorStop(0.55, lightenColor(color, 5));
    grad.addColorStop(0.85, darkenColor(color, 20));
    grad.addColorStop(1, darkenColor(color, 30));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.fillRect(px + 2, py + inset, w - 3, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + 2, py + s - 3, w - 3, 2);
  },
  ice(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px + s * 0.4, py + s);
    grad.addColorStop(0, lightenColor(color, 45));
    grad.addColorStop(0.3, lightenColor(color, 25));
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, darkenColor(color, 10));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 3); ctx.fill();
    const frost = ctx.createLinearGradient(px, py, px + s, py + s);
    frost.addColorStop(0, 'rgba(220,240,255,0.30)');
    frost.addColorStop(1, 'rgba(180,220,255,0.20)');
    ctx.fillStyle = frost;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 3); ctx.fill();
    const shine = ctx.createLinearGradient(px, py, px, py + s * 0.4);
    shine.addColorStop(0, 'rgba(255,255,255,0.40)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.fillRect(px + 3, py + 2, w - 4, w * 0.35);
  },
  wood(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 18));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 20));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(px + 3, py + s - 2, w - 4, 1);
  },
  plastic(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, lightenColor(color, 25));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, darkenColor(color, 15));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1);
  },
  gold(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, '#ffeaa0');
    grad.addColorStop(0.5, '#d4a520');
    grad.addColorStop(1, '#8b6914');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.35)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1.5);
    ctx.fillStyle = 'rgba(100,60,0,0.30)';
    ctx.fillRect(px + 3, py + s - 3, w - 4, 2);
  },
  silver(ctx, px, py, s, color) {
    const inset = 1, w = s - 2;
    const grad = ctx.createLinearGradient(px, py, px, py + s);
    grad.addColorStop(0, '#e8e8e8');
    grad.addColorStop(0.5, '#a8a8a8');
    grad.addColorStop(1, '#787878');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(px + inset, py + inset, w, w, 1); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(px + 3, py + inset, w - 4, 1.5);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(px + 3, py + s - 3, w - 4, 2);
  },
};

export { drawCell, drawMiniCell, drawPreviewPiece, lightenColor, darkenColor, hexToRgba };