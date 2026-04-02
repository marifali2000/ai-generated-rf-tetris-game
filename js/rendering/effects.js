/**
 * EffectsEngine — visual effects, particles, animations.
 * Extracted from Renderer for modularity (< 1000 lines per file).
 */
import { drawCell, lightenColor, darkenColor, remapColor, getThemeAccent } from './cell-themes.js';
import { Particle, MAX_PARTICLES, STARS } from './particles.js';

const CELL_SIZE = 32;
const COLS = 10;
const ROWS = 20;

class EffectsEngine {
  // Animation state
  particles = [];
  shakeAmount = 0;
  shakeDecay = 0.9;
  flashAlpha = 0;
  flashColor = '#c8d8ff';
  frameCount = 0;
  rowFlashData = [];
  sweepBeams = [];
  dissolveGrid = [];
  shockwaves = [];
  clearAnimTimer = 0;
  clearAnimDuration = 0;
  vanishingRows = [];
  vanishPhase = false;
  vanishStartTime = 0;
  slamLines = [];
  lockPulse = null;
  crackLines = [];
  floatingTexts = [];
  fallingCells = [];
  collapseGrid = [];
  collapseActive = false;
  starSpeedBoost = 0;
  dangerLevel = 0;
  prevDangerLevel = 0;
  pieceTrail = [];
  lockBounce = null;
  soundCallbacks = null;
  animSpeed = 2;
  visualTheme = 'glass';

  get isAnimating() {
    // Safety: force-clear stuck animations after 5 seconds
    if (this.vanishPhase && performance.now() - this.vanishStartTime > 5000) {
      this.vanishPhase = false;
      this.vanishingRows = [];
    }
    return this.vanishPhase === true;
  }

  /** Reset all animation state — call on game start/restart. */
  resetAnimations() {
    this.vanishPhase = false;
    this.vanishStartTime = 0;
    this.vanishingRows = [];
    this.fallingCells = [];
    this.collapseActive = false;
    this.collapseGrid = [];
    this.clearAnimTimer = 0;
    this.shakeAmount = 0;
  }

  get isCollapsing() {
    return this.collapseActive;
  }

  addCrackLines(clearedRows) {
    for (const row of clearedRows) {
      // Several crack lines emanate from random points along the row
      const crackCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < crackCount; i++) {
        const startX = Math.random() * COLS * CELL_SIZE;
        const startY = row * CELL_SIZE + Math.random() * CELL_SIZE;
        const segments = [];
        let cx = startX;
        let cy = startY;
        const segCount = 4 + Math.floor(Math.random() * 5);
        for (let s = 0; s < segCount; s++) {
          const nx = cx + (Math.random() - 0.5) * CELL_SIZE * 1.5;
          const ny = cy + (Math.random() - 0.5) * CELL_SIZE;
          segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
          cx = nx;
          cy = ny;
        }
        this.crackLines.push({ segments, alpha: 1, delay: i * 2 });
      }
    }
  }

  addRowFlashes(clearedRows, isTetris) {
    const color = isTetris ? '#ffe080' : '#ffffff';
    for (let i = 0; i < clearedRows.length; i++) {
      // Stagger each row's flash — each row lights up one after another
      this.rowFlashData.push({ row: clearedRows[i], alpha: 1.5, color, delay: i * 18 });
    }
  }

  addSweepBeams(clearedRows, count, isTetris) {
    const accent = getThemeAccent(this.visualTheme);
    const color = isTetris ? '#ffe080' : accent.slam;
    for (let i = 0; i < clearedRows.length; i++) {
      this.sweepBeams.push({
        row: clearedRows[i],
        x: -CELL_SIZE * 3,
        speed: 4 + count,
        width: CELL_SIZE * 5,
        alpha: 0.95,
        delay: 15 + i * 8,
        color,
      });
    }
  }

  addDissolveEffects(clearedRows, clearedRowColors) {
    for (let i = 0; i < clearedRows.length; i++) {
      const row = clearedRows[i];
      const colors = clearedRowColors[i];
      for (let c = 0; c < colors.length; c++) {
        if (!colors[c]) continue;
        const remapped = remapColor(colors[c], this.visualTheme);
        const shardCount = 3 + Math.floor(Math.random() * 2);
        for (let s = 0; s < shardCount; s++) {
          const offsetX = (Math.random() - 0.5) * CELL_SIZE * 0.6;
          const offsetY = (Math.random() - 0.5) * CELL_SIZE * 0.6;
          this.dissolveGrid.push({
            px: c * CELL_SIZE + CELL_SIZE / 2 + offsetX,
            py: row * CELL_SIZE + CELL_SIZE / 2 + offsetY,
            color: remapped,
            scale: 0.4 + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            alpha: 1,
            delay: 25 + i * 8 + c * 1.5 + s * 3,
            vx: (Math.random() - 0.5) * 2,
            vy: -0.3 + Math.random() * -1.5,
            isShard: true,
          });
        }
      }
    }
  }

  addShockwaves(clearedRows, count, isTetris) {
    const accent = getThemeAccent(this.visualTheme);
    const midRow = clearedRows[Math.floor(clearedRows.length / 2)];
    const centerY = midRow * CELL_SIZE + CELL_SIZE / 2;
    this.shockwaves.push({
      cx: (COLS * CELL_SIZE) / 2,
      cy: centerY,
      radius: 5,
      maxRadius: 350 + count * 60,
      alpha: 0.7 + count * 0.1,
      color: isTetris ? '#ffe080' : accent.slam,
      lineWidth: 3 + count,
    });

    // Second ring for double+ clears
    if (count >= 2) {
      this.shockwaves.push({
        cx: (COLS * CELL_SIZE) / 2,
        cy: centerY,
        radius: 5,
        maxRadius: 250 + count * 40,
        alpha: 0.4,
        color: '#ffffff',
        lineWidth: 2,
      });
    }

    if (isTetris) {
      // Third dramatic ring for Tetris
      this.shockwaves.push({
        cx: (COLS * CELL_SIZE) / 2,
        cy: centerY,
        radius: 5,
        maxRadius: 500,
        alpha: 0.35,
        color: '#ffe080',
        lineWidth: 5,
      });
    }
  }

  addExplosionParticles(clearedRows, clearedRowColors, count) {
    const particlesPerCell = 4 + count * 3;
    const accent = getThemeAccent(this.visualTheme);
    for (let i = 0; i < clearedRows.length; i++) {
      const row = clearedRows[i];
      const colors = clearedRowColors[i];
      for (let c = 0; c < colors.length; c++) {
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = row * CELL_SIZE + CELL_SIZE / 2;
        const color = remapColor(colors[c], this.visualTheme) || accent.dust;
        for (let p = 0; p < particlesPerCell; p++) {
          if (this.particles.length < MAX_PARTICLES) {
            const shard = new Particle(cx, cy, color);
            if (Math.random() < 0.4) {
              shard.color = accent.shard;
            }
            this.particles.push(shard);
          }
        }
      }
    }
  }

  addSlamLines(piece, intensity) {
    const slamColor = remapColor(piece.color, this.visualTheme);
    const shape = piece.shape;
    for (let c = 0; c < shape[0].length; c++) {
      for (let r = 0; r < shape.length; r++) {
        if (shape[r][c]) {
          this.slamLines.push({
            x: (piece.x + c) * CELL_SIZE + CELL_SIZE / 2,
            topY: 0,
            bottomY: (piece.y + r) * CELL_SIZE,
            alpha: 0.5 * intensity,
            width: 2,
            color: slamColor,
          });
          break;
        }
      }
    }
  }

  addDustParticles(piece) {
    const accent = getThemeAccent(this.visualTheme);
    const dustColor = remapColor(piece.color, this.visualTheme) || accent.dust;
    const shape = piece.shape;
    for (let c = 0; c < shape[0].length; c++) {
      for (let r = shape.length - 1; r >= 0; r--) {
        if (shape[r][c]) {
          const cx = (piece.x + c) * CELL_SIZE + CELL_SIZE / 2;
          const cy = (piece.y + r + 1) * CELL_SIZE;
          for (let i = 0; i < 3; i++) {
            if (this.particles.length < MAX_PARTICLES) {
              const p = new Particle(cx, cy, dustColor);
              p.vy = -(Math.random() * 2 + 0.5);
              p.vx = (Math.random() - 0.5) * 6;
              p.size = 1.5 + Math.random() * 2;
              p.gravity = 0.08;
              this.particles.push(p);
            }
          }
          break;
        }
      }
    }
  }

  drawStars(ctx, w, h) {
    const time = this.frameCount * 0.02 * this.starSpeedBoost;
    // Decay speed boost back to 1
    this.starSpeedBoost += (1 - this.starSpeedBoost) * 0.02;
    for (const star of STARS) {
      const twinkle = 0.3 + 0.7 * ((Math.sin(time * star.speed + star.phase) + 1) * 0.5);
      ctx.globalAlpha = twinkle * 0.6;
      ctx.fillStyle = '#6090c0';
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawVignette(ctx, w, h) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, h * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  drawSlamLines(ctx) {
    if (this.slamLines.length === 0) return;
    const accent = getThemeAccent(this.visualTheme);
    for (const sl of this.slamLines) {
      ctx.save();
      ctx.globalAlpha = sl.alpha;
      ctx.strokeStyle = sl.color || accent.slam;
      ctx.lineWidth = sl.width;
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.topY);
      ctx.lineTo(sl.x, sl.bottomY);
      ctx.stroke();
      ctx.restore();
      sl.alpha *= 0.85;
    }
    this.slamLines = this.slamLines.filter(sl => sl.alpha > 0.01);
  }

  drawCrackLines(ctx) {
    if (this.crackLines.length === 0) return;
    const accent = getThemeAccent(this.visualTheme);
    for (const cl of this.crackLines) {
      if (cl.delay > 0) { cl.delay--; continue; }
      ctx.save();
      ctx.globalAlpha = cl.alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = accent.slam;
      ctx.shadowBlur = 8 * cl.alpha;
      ctx.lineWidth = 1.5;
      for (const seg of cl.segments) {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
      ctx.restore();
      cl.alpha -= 0.008;
    }
    this.crackLines = this.crackLines.filter(cl => cl.alpha > 0.01);
  }

  drawRowFlashes(ctx) {
    if (this.rowFlashData.length === 0) return;
    for (const rf of this.rowFlashData) {
      if (rf.delay > 0) { rf.delay--; continue; }
      ctx.save();
      // Pulsing glow effect — brighter and more visible
      const pulse = 0.85 + 0.15 * Math.sin(this.frameCount * 0.4);
      ctx.globalAlpha = Math.min(1, rf.alpha) * pulse;
      ctx.fillStyle = rf.color;
      ctx.fillRect(0, rf.row * CELL_SIZE - 4, COLS * CELL_SIZE, CELL_SIZE + 8);
      ctx.shadowColor = rf.color;
      ctx.shadowBlur = 40 * Math.min(1, rf.alpha);
      ctx.fillRect(0, rf.row * CELL_SIZE - 6, COLS * CELL_SIZE, CELL_SIZE + 12);
      ctx.restore();
      rf.alpha -= 0.012;
    }
    this.rowFlashData = this.rowFlashData.filter(rf => rf.alpha > 0.01);
  }

  drawSweepBeams(ctx) {
    if (this.sweepBeams.length === 0) return;
    for (const sb of this.sweepBeams) {
      if (sb.delay > 0) { sb.delay--; continue; }
      ctx.save();
      ctx.globalAlpha = sb.alpha;
      const grad = ctx.createLinearGradient(sb.x, 0, sb.x + sb.width, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.2, sb.color);
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.8, sb.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sb.x, sb.row * CELL_SIZE - 3, sb.width, CELL_SIZE + 6);
      ctx.restore();
      sb.x += sb.speed;
      if (sb.x > COLS * CELL_SIZE + sb.width) sb.alpha = 0;
      sb.alpha *= 0.995;
    }
    this.sweepBeams = this.sweepBeams.filter(sb => sb.alpha > 0.01);
  }

  drawDissolvingCells(ctx) {
    if (this.dissolveGrid.length === 0) return;
    for (const dc of this.dissolveGrid) {
      if (dc.delay > 0) { dc.delay--; continue; }
      ctx.save();
      ctx.globalAlpha = dc.alpha;
      ctx.translate(dc.px, dc.py);
      ctx.rotate(dc.rotation);
      ctx.scale(dc.scale, dc.scale);
      const half = CELL_SIZE / 2;

      // Draw as glass shard triangle
      ctx.beginPath();
      ctx.moveTo(0, -half);
      ctx.lineTo(half * 0.7, half * 0.6);
      ctx.lineTo(-half * 0.5, half * 0.4);
      ctx.closePath();
      ctx.fillStyle = dc.color;
      ctx.shadowColor = dc.color;
      ctx.shadowBlur = 10 * dc.alpha;
      ctx.fill();
      // Glass edge highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
      dc.rotation += dc.rotSpeed;
      dc.scale *= 0.992;
      dc.alpha -= 0.005;
      dc.px += dc.vx;
      dc.py += dc.vy;
      dc.vy += 0.02;
    }
    this.dissolveGrid = this.dissolveGrid.filter(dc => dc.alpha > 0.01);
  }

  drawFallingCells(ctx) {
    if (this.fallingCells.length === 0) return;
    if (this.vanishPhase) {
      for (const fc of this.fallingCells) {
        drawCell(ctx, fc.col, fc.fromY, fc.color, 1, this.visualTheme, CELL_SIZE);
      }
      return;
    }
    for (const fc of this.fallingCells) {
      if (fc.landed) {
        this.#drawLandedCell(ctx, fc);
      } else {
        this.#drawFallingCell(ctx, fc);
      }
    }
    this.fallingCells = this.fallingCells.filter(fc => !fc.done);
  }

  #drawLandedCell(ctx, fc) {
    fc.landGlow -= 0.08;
    drawCell(ctx, fc.col, fc.toY, fc.color, 1, this.visualTheme, CELL_SIZE);
    if (fc.landGlow > 0) {
      ctx.save();
      ctx.globalAlpha = fc.landGlow * 0.5;
      ctx.fillStyle = fc.color;
      ctx.shadowColor = fc.color;
      ctx.shadowBlur = 15;
      ctx.fillRect(fc.col * CELL_SIZE, fc.toY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.restore();
    } else {
      fc.done = true;
    }
  }

  #drawFallingCell(ctx, fc) {
    fc.velocity += fc.gravity;
    fc.currentY += fc.velocity;
    if (fc.currentY >= fc.toY) {
      fc.currentY = fc.toY;
      fc.velocity = 0;
      fc.landed = true;
      fc.landGlow = 1;
    }
    if (fc.velocity > 0.03) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      drawCell(ctx, fc.col, fc.currentY - 0.4, fc.color, 0.15, this.visualTheme, CELL_SIZE);
      ctx.globalAlpha = 0.08;
      drawCell(ctx, fc.col, fc.currentY - 0.7, fc.color, 0.08, this.visualTheme, CELL_SIZE);
      ctx.restore();
    }
    drawCell(ctx, fc.col, fc.currentY, fc.color, 1, this.visualTheme, CELL_SIZE);
  }

  drawVanishingRows(ctx) {
    if (this.vanishingRows.length === 0) {
      if (this.vanishPhase) this.vanishPhase = false;
      return;
    }

    let allDone = true;
    for (const vr of this.vanishingRows) {
      if (vr.delay > 0) {
        vr.delay--;
        for (const cell of vr.cells) {
          drawCell(ctx, cell.col, vr.row, cell.color, 1, this.visualTheme, CELL_SIZE);
        }
        allDone = false;
        continue;
      }

      vr.phaseTimer++;

      if (vr.phase === 'highlight') {
        this.#drawVanishHighlight(ctx, vr);
        allDone = false;
      } else if (vr.phase === 'shrink') {
        const rowDone = this.#drawVanishShrink(ctx, vr);
        if (rowDone) vr.phase = 'done';
        allDone = allDone && rowDone;
      }
    }

    this.vanishingRows = this.vanishingRows.filter(vr => vr.phase !== 'done');
    if (this.vanishingRows.length === 0 && this.vanishPhase) {
      this.vanishPhase = false;
    }
  }

  /** Highlight phase: glow ramps up over ~20 frames, then transitions to shrink. */
  #drawVanishHighlight(ctx, vr) {
    vr.highlightAlpha = Math.min(1, vr.phaseTimer / Math.round(10 / this.animSpeed));

    if (!vr.soundPlayed) {
      vr.soundPlayed = true;
      this.soundCallbacks.onRowHighlight(vr.rowIndex);
    }
    for (const cell of vr.cells) {
      drawCell(ctx, cell.col, vr.row, cell.color, 1, this.visualTheme, CELL_SIZE);
    }

    ctx.save();
    const rawTint = vr.cells.length > 0 ? vr.cells[0].color : '#80c0ff';
    const tintColor = remapColor(rawTint, this.visualTheme);
    ctx.globalAlpha = vr.highlightAlpha * 0.4;
    ctx.fillStyle = tintColor;
    ctx.shadowColor = tintColor;
    ctx.shadowBlur = 20 * vr.highlightAlpha;
    ctx.fillRect(0, vr.row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    ctx.restore();

    if (vr.phaseTimer >= Math.round(15 / this.animSpeed)) {
      vr.phase = 'shrink';
      vr.phaseTimer = 0;
      if (!vr.clearSoundPlayed) {
        vr.clearSoundPlayed = true;
        this.soundCallbacks.onRowCleared(vr.rowIndex);
      }
    }
  }

  /** Shrink phase: cells shrink and fade left-to-right with particles. Returns true when done. */
  #drawVanishShrink(ctx, vr) {
    let rowDone = true;
    for (const cell of vr.cells) {
      if (cell.delay > 0) {
        cell.delay--;
        drawCell(ctx, cell.col, vr.row, cell.color, cell.alpha, this.visualTheme, CELL_SIZE);
        rowDone = false;
        continue;
      }
      cell.scale *= (1 - Math.max(0.10 * this.animSpeed, 0.05));
      cell.alpha *= (1 - Math.max(0.08 * this.animSpeed, 0.04));
      if (!cell.particlesSpawned) {
        cell.particlesSpawned = true;
        const cx = cell.col * CELL_SIZE + CELL_SIZE / 2;
        const cy = vr.row * CELL_SIZE + CELL_SIZE / 2;
        const pColor = remapColor(cell.color, this.visualTheme);
        for (let p = 0; p < 5; p++) {
          if (this.particles.length < MAX_PARTICLES) {
            this.particles.push(new Particle(cx, cy, pColor));
          }
        }
      }
      if (cell.scale > 0.05 && cell.alpha > 0.05) {
        this.#drawShrinkingCell(ctx, cell, vr.row);
        rowDone = false;
      }
    }
    return rowDone;
  }

  /** Draw a single shrinking cell centered on its grid position. */
  #drawShrinkingCell(ctx, cell, row) {
    const px = cell.col * CELL_SIZE + CELL_SIZE / 2;
    const py = row * CELL_SIZE + CELL_SIZE / 2;
    const half = CELL_SIZE / 2;
    const c = remapColor(cell.color, this.visualTheme);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(cell.scale, cell.scale);
    ctx.globalAlpha = cell.alpha;
    const grad = ctx.createLinearGradient(-half, -half, half * 0.4, half);
    grad.addColorStop(0, lightenColor(c, 28));
    grad.addColorStop(0.35, c);
    grad.addColorStop(1, darkenColor(c, 30));
    ctx.fillStyle = grad;
    ctx.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.restore();
  }

  drawLockPulse(ctx) {
    if (!this.lockPulse) return;
    const lp = this.lockPulse;
    ctx.save();
    ctx.globalAlpha = lp.alpha;
    for (const cell of lp.cells) {
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.scale(lp.scale, lp.scale);
      ctx.shadowColor = cell.color;
      ctx.shadowBlur = 15 * lp.alpha;
      ctx.fillStyle = cell.color;
      ctx.fillRect(-CELL_SIZE / 2 + 1, -CELL_SIZE / 2 + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.restore();
    }
    ctx.restore();
    lp.scale += (1 - lp.scale) * 0.3;
    lp.alpha *= 0.82;
    if (lp.alpha < 0.02) this.lockPulse = null;
  }

  drawShockwaves(ctx) {
    if (this.shockwaves.length === 0) return;
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = sw.alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.beginPath();
      ctx.arc(sw.cx, sw.cy, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      sw.radius += 2.5;
      sw.alpha *= 0.975;
      sw.lineWidth *= 0.99;
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.alpha > 0.01 && sw.radius < sw.maxRadius);
  }

  drawFloatingTexts(ctx) {
    if (this.floatingTexts.length === 0) return;
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${ft.size}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
      ft.y += ft.vy;
      ft.vy *= 0.97;
      ft.alpha -= 0.02;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.alpha > 0.01);
  }

  drawCollapseGrid(ctx) {
    if (this.collapseGrid.length === 0) {
      if (this.collapseActive) this.collapseActive = false;
      return;
    }
    const half = CELL_SIZE / 2;
    for (const dc of this.collapseGrid) {
      if (dc.delay > 0) { dc.delay--; continue; }
      ctx.save();
      ctx.globalAlpha = dc.alpha;
      ctx.translate(dc.px, dc.py);
      ctx.rotate(dc.rotation);

      ctx.fillStyle = dc.color;
      ctx.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      ctx.restore();
      dc.rotation += dc.rotSpeed;
      dc.vy += dc.gravity;
      dc.py += dc.vy;
      dc.px += dc.vx;
      dc.alpha -= 0.008;
    }
    this.collapseGrid = this.collapseGrid.filter(
      dc => dc.alpha > 0.01 && dc.py < (ROWS + 5) * CELL_SIZE
    );
  }

  drawDangerZone(ctx) {
    if (this.dangerLevel < 0.05) return;
    const d = this.dangerLevel;
    const w = COLS * CELL_SIZE;
    const h = ROWS * CELL_SIZE;
    const pulse = 0.5 + 0.5 * Math.sin(this.frameCount * (0.08 + d * 0.12));

    this.#drawDangerOverlay(ctx, d, pulse, w, h);
    this.#drawDangerBorder(ctx, d, pulse, w, h);

    if (d > 0.5) {
      const textAlpha = (d - 0.5) * 2 * pulse;
      ctx.save();
      ctx.globalAlpha = Math.min(0.9, textAlpha);
      ctx.font = `bold ${20 + Math.floor(d * 10)}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4040';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.fillText('⚠ DANGER ⚠', w / 2, 30);
      ctx.restore();
    }

    if (d > 0.1 && this.prevDangerLevel < 0.1) {
      this.floatingTexts.push({
        text: 'DANGER ZONE!', x: w / 2, y: h * 0.3,
        alpha: 1.5, color: '#ff4040', size: 28, vy: -1,
      });
    }
    this.prevDangerLevel = d;
  }

  #drawDangerOverlay(ctx, d, pulse, w) {
    const height = Math.max(3, Math.ceil(10 * d)) * CELL_SIZE;
    ctx.save();
    ctx.globalAlpha = d * 0.4 * pulse;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#ff2020');
    grad.addColorStop(0.5, 'rgba(255,40,20,0.5)');
    grad.addColorStop(1, 'rgba(255,32,32,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, height);
    ctx.restore();
  }

  #drawDangerBorder(ctx, d, pulse, w, h) {
    ctx.save();
    ctx.globalAlpha = d * 0.6 * pulse;
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);
    ctx.restore();
  }

  drawBoardEdgeGlow(ctx, w, h) {
    const intensity = this.clearAnimTimer > 0 ? 0.4 : 0.08;
    const color = this.dangerLevel > 0.5 ? '255,60,60' : '90,176,255';
    // Left edge
    const left = ctx.createLinearGradient(0, 0, 6, 0);
    left.addColorStop(0, `rgba(${color},${intensity})`);
    left.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = left;
    ctx.fillRect(0, 0, 6, h);
    // Right edge
    const right = ctx.createLinearGradient(w, 0, w - 6, 0);
    right.addColorStop(0, `rgba(${color},${intensity})`);
    right.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = right;
    ctx.fillRect(w - 6, 0, 6, h);
    // Bottom edge
    const bottom = ctx.createLinearGradient(0, h, 0, h - 6);
    bottom.addColorStop(0, `rgba(${color},${intensity * 1.5})`);
    bottom.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = bottom;
    ctx.fillRect(0, h - 6, w, 6);
  }

  drawPieceTrail(ctx) {
    for (const t of this.pieceTrail) {
      if (t.alpha < 0.02) continue;
      ctx.save();
      ctx.globalAlpha = t.alpha;
      for (let r = 0; r < t.shape.length; r++) {
        for (let c = 0; c < t.shape[r].length; c++) {
          if (t.shape[r][c]) {
            drawCell(ctx, t.x + c, t.y + r, t.color, t.alpha, this.visualTheme, CELL_SIZE);
          }
        }
      }
      ctx.restore();
      t.alpha *= 0.5;
    }
    this.pieceTrail = this.pieceTrail.filter(t => t.alpha > 0.02);
  }

  drawLockBounce(ctx) {
    if (!this.lockBounce) return;
    const lb = this.lockBounce;
    ctx.save();
    for (const cell of lb.cells) {
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.scale(lb.scaleX, lb.scaleY);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = cell.color;
      ctx.fillRect(-CELL_SIZE / 2 + 1, -CELL_SIZE / 2 + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      ctx.restore();
    }
    ctx.restore();

    // Spring physics
    lb.velX += (1 - lb.scaleX) * 0.3;
    lb.velY += (1 - lb.scaleY) * 0.3;
    lb.velX *= 0.75;
    lb.velY *= 0.75;
    lb.scaleX += lb.velX;
    lb.scaleY += lb.velY;

    if (Math.abs(lb.scaleX - 1) < 0.01 && Math.abs(lb.scaleY - 1) < 0.01) {
      this.lockBounce = null;
    }
  }

  textColor(text) {
    if (text.includes('PERFECT')) return '#ff80ff';
    if (text.includes('BACK')) return '#ffa040';
    if (text.includes('T-SPIN')) return '#c060ff';
    return '#80c0ff';
  }

}

export { EffectsEngine };