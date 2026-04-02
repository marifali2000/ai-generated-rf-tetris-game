/**
 * Canvas rendering — board, pieces, ghost, grid, side panels, particles, screen shake.
 */
import { getColorForType, getShapeForType } from './piece.js';

const CELL_SIZE = 32;
const COLS = 10;
const ROWS = 20;

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

const MAX_PARTICLES = 350;

/** Pre-generate static star positions for the animated background. */
const STARS = Array.from({ length: 60 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.4 + Math.random() * 1.2,
  speed: 0.3 + Math.random() * 0.7,
  phase: Math.random() * Math.PI * 2,
}));

/** Glass shard particle — triangular fragment that spins and catches light. */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    // Spread widely — shards fly all over
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2;
    this.life = 1;
    this.decay = 0.003 + Math.random() * 0.005;
    // Shard geometry — elongated triangle
    this.w = 2 + Math.random() * 7;
    this.h = 4 + Math.random() * 12;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.15;
    this.gravity = 0.03 + Math.random() * 0.02;
    // Light glint phase
    this.glintPhase = Math.random() * Math.PI * 2;
    this.glintSpeed = 0.15 + Math.random() * 0.1;
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.vx *= 0.995;
    this.rotation += this.rotSpeed;
    this.glintPhase += this.glintSpeed;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life) * 0.9;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Triangular shard shape
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 2, this.h / 2);
    ctx.lineTo(-this.w / 2, this.h / 3);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Glass edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Glinting light reflection
    const glint = Math.max(0, Math.sin(this.glintPhase));
    if (glint > 0.6) {
      ctx.globalAlpha = (glint - 0.6) * 2.5 * this.life;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.w * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Renderer {
  #gameCtx;
  #holdCtx;
  #nextCtx;
  #mobileHoldCtx;
  #mobileNextCtx;
  #scoreEl;
  #levelEl;
  #linesEl;
  #overlayEl;
  #overlayTextEl;
  #mobileScoreEl;
  #mobileLevelEl;
  #mobileLinesEl;
  #particles = [];
  #shakeAmount = 0;
  #shakeDecay = 0.9;
  #flashAlpha = 0;
  #flashColor = '#c8d8ff';
  #displayScore = 0;
  #displayLines = 0;
  #bgGradient = null;
  #frameCount = 0;

  // Dramatic line clear animation state
  #rowFlashData = [];
  #sweepBeams = [];
  #dissolveGrid = [];
  #shockwaves = [];
  #clearAnimTimer = 0;
  #clearAnimDuration = 0;

  // Row-by-row vanish: each cleared row's cells shrink and fade
  #vanishingRows = [];  // { row, cells: [{col, color, scale, alpha, delay}], startFrame }
  #vanishPhase = false; // true while rows are vanishing

  // Hard drop slam lines
  #slamLines = [];

  // Piece lock pulse
  #lockPulse = null;

  // Glass crack lines
  #crackLines = [];

  // Floating combo text
  #floatingTexts = [];

  // Animated falling cells after line clear
  #fallingCells = [];

  // Game over collapse
  #collapseGrid = [];
  #collapseActive = false;

  // Star speed boost for background reactivity
  #starSpeedBoost = 1;

  // Danger zone (0 = safe, 1 = critical)
  #dangerLevel = 0;
  #prevDangerLevel = 0;

  // Piece trail
  #pieceTrail = [];

  // Lock bounce
  #lockBounce = null;

  // Sound callbacks for animation-synced audio
  #soundCallbacks = null;

  /** True while line clear animation is playing — game logic should pause. */
  get isAnimating() {
    return this.#clearAnimTimer > 0 || this.#vanishPhase || this.#fallingCells.length > 0;
  }

  constructor() {
    const gameCanvas = document.getElementById('game-canvas');
    gameCanvas.width = COLS * CELL_SIZE;
    gameCanvas.height = ROWS * CELL_SIZE;
    this.#gameCtx = gameCanvas.getContext('2d');

    // Sound callbacks default to no-ops
    this.#soundCallbacks = { onRowHighlight: () => {}, onCellPop: () => {}, onRowCleared: () => {} };

    // Rich multi-stop background gradient
    this.#bgGradient = this.#gameCtx.createLinearGradient(0, 0, 0, ROWS * CELL_SIZE);
    this.#bgGradient.addColorStop(0, '#06101f');
    this.#bgGradient.addColorStop(0.3, '#0a1628');
    this.#bgGradient.addColorStop(0.6, '#0d1b2a');
    this.#bgGradient.addColorStop(1, '#120e28');

    this.#holdCtx = document.getElementById('hold-canvas').getContext('2d');
    this.#nextCtx = document.getElementById('next-canvas').getContext('2d');

    // Mobile hold/next canvases (may not exist on desktop, safe to check)
    const mhc = document.getElementById('mobile-hold-canvas');
    const mnc = document.getElementById('mobile-next-canvas');
    this.#mobileHoldCtx = mhc ? mhc.getContext('2d') : null;
    this.#mobileNextCtx = mnc ? mnc.getContext('2d') : null;
    this.#scoreEl = document.getElementById('score-value');
    this.#levelEl = document.getElementById('level-value');
    this.#linesEl = document.getElementById('lines-value');
    this.#overlayEl = document.getElementById('overlay');
    this.#overlayTextEl = document.getElementById('overlay-text');
    this.#mobileScoreEl = document.getElementById('mobile-score');
    this.#mobileLevelEl = document.getElementById('mobile-level');
    this.#mobileLinesEl = document.getElementById('mobile-lines');
  }

  /**
   * Set sound callbacks for animation-synced audio.
   * { onRowHighlight(rowIndex), onCellPop(col, totalCols), onRowCleared(rowIndex) }
   */
  setSoundCallbacks(callbacks) {
    this.#soundCallbacks = { ...this.#soundCallbacks, ...callbacks };
  }

  /**
   * Row-by-row line clear animation: each row highlights in color, cells shrink and vanish
   * one row at a time with staggered delay. No white flash. Particles burst from each cell.
   */
  triggerLineClearEffect(clearedRows, clearedRowColors) {
    const count = clearedRows.length;
    const isTetris = count >= 4;

    // Build vanishing row data — each row vanishes one by one
    this.#vanishingRows = [];
    this.#vanishPhase = true;
    const ROW_STAGGER = 60; // frames between each row starting to vanish

    for (let i = 0; i < clearedRows.length; i++) {
      const row = clearedRows[i];
      const colors = clearedRowColors[i];
      const cells = [];
      for (let c = 0; c < colors.length; c++) {
        if (!colors[c]) continue;
        cells.push({
          col: c,
          color: colors[c],
          scale: 1,
          alpha: 1,
          // Cells vanish left-to-right with stagger
          delay: c * 4,
          shrinking: false,
          glowAlpha: 0,
          popSoundPlayed: false, // per-cell pop sound tracking
        });
      }
      this.#vanishingRows.push({
        row,
        cells,
        delay: i * ROW_STAGGER, // each row waits before vanishing
        highlightAlpha: 0,
        phase: 'highlight', // highlight → shrink → done
        phaseTimer: 0,
        rowIndex: i, // sequence index for sound pitch escalation
        soundPlayed: false, // whether highlight sound has played
        clearSoundPlayed: false, // whether row-cleared sound has played
      });
    }

    // Mild shake — no white flash
    this.#shakeAmount = 3 + count * 2;
    if (isTetris) this.#shakeAmount = 12;

    // Shockwave (subtle, colored not white)
    this.#addShockwaves(clearedRows, count, isTetris);

    // Timer for particles and other effects
    this.#clearAnimDuration = 60 + count * ROW_STAGGER + 100;
    this.#clearAnimTimer = this.#clearAnimDuration;

    // Background reactivity
    this.#starSpeedBoost = 2 + count;
  }

  #addCrackLines(clearedRows) {
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
        this.#crackLines.push({ segments, alpha: 1, delay: i * 2 });
      }
    }
  }

  #addRowFlashes(clearedRows, isTetris) {
    const color = isTetris ? '#ffe080' : '#ffffff';
    for (let i = 0; i < clearedRows.length; i++) {
      // Stagger each row's flash — each row lights up one after another
      this.#rowFlashData.push({ row: clearedRows[i], alpha: 1.5, color, delay: i * 18 });
    }
  }

  #addSweepBeams(clearedRows, count, isTetris) {
    const color = isTetris ? '#ffe080' : '#80c0ff';
    for (let i = 0; i < clearedRows.length; i++) {
      this.#sweepBeams.push({
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

  #addDissolveEffects(clearedRows, clearedRowColors) {
    for (let i = 0; i < clearedRows.length; i++) {
      const row = clearedRows[i];
      const colors = clearedRowColors[i];
      for (let c = 0; c < colors.length; c++) {
        if (!colors[c]) continue;
        // Each cell breaks into 3–4 sub-shards for glass feel
        const shardCount = 3 + Math.floor(Math.random() * 2);
        for (let s = 0; s < shardCount; s++) {
          const offsetX = (Math.random() - 0.5) * CELL_SIZE * 0.6;
          const offsetY = (Math.random() - 0.5) * CELL_SIZE * 0.6;
          this.#dissolveGrid.push({
            px: c * CELL_SIZE + CELL_SIZE / 2 + offsetX,
            py: row * CELL_SIZE + CELL_SIZE / 2 + offsetY,
            color: colors[c],
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

  #addShockwaves(clearedRows, count, isTetris) {
    const midRow = clearedRows[Math.floor(clearedRows.length / 2)];
    const centerY = midRow * CELL_SIZE + CELL_SIZE / 2;
    this.#shockwaves.push({
      cx: (COLS * CELL_SIZE) / 2,
      cy: centerY,
      radius: 5,
      maxRadius: 350 + count * 60,
      alpha: 0.7 + count * 0.1,
      color: isTetris ? '#ffe080' : '#80c0ff',
      lineWidth: 3 + count,
    });

    // Second ring for double+ clears
    if (count >= 2) {
      this.#shockwaves.push({
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
      this.#shockwaves.push({
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

  #addExplosionParticles(clearedRows, clearedRowColors, count) {
    const particlesPerCell = 4 + count * 3;
    for (let i = 0; i < clearedRows.length; i++) {
      const row = clearedRows[i];
      const colors = clearedRowColors[i];
      for (let c = 0; c < colors.length; c++) {
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = row * CELL_SIZE + CELL_SIZE / 2;
        const color = colors[c] || '#aaccee';
        for (let p = 0; p < particlesPerCell; p++) {
          if (this.#particles.length < MAX_PARTICLES) {
            const shard = new Particle(cx, cy, color);
            // Mix in glass-tinted shards for glass feel
            if (Math.random() < 0.4) {
              shard.color = '#d0eaff';
            }
            this.#particles.push(shard);
          }
        }
      }
    }
  }

  /**
   * Hard drop slam lines + dust particles at landing site.
   */
  triggerHardDropEffect(piece, dropDistance) {
    if (dropDistance < 2) return;
    const intensity = Math.min(dropDistance / 10, 1);
    this.#shakeAmount = 2 + intensity * 6;
    this.#addSlamLines(piece, intensity);
    this.#addDustParticles(piece);
  }

  #addSlamLines(piece, intensity) {
    const shape = piece.shape;
    for (let c = 0; c < shape[0].length; c++) {
      for (let r = 0; r < shape.length; r++) {
        if (shape[r][c]) {
          this.#slamLines.push({
            x: (piece.x + c) * CELL_SIZE + CELL_SIZE / 2,
            topY: 0,
            bottomY: (piece.y + r) * CELL_SIZE,
            alpha: 0.5 * intensity,
            width: 2,
          });
          break;
        }
      }
    }
  }

  #addDustParticles(piece) {
    const shape = piece.shape;
    for (let c = 0; c < shape[0].length; c++) {
      for (let r = shape.length - 1; r >= 0; r--) {
        if (shape[r][c]) {
          const cx = (piece.x + c) * CELL_SIZE + CELL_SIZE / 2;
          const cy = (piece.y + r + 1) * CELL_SIZE;
          for (let i = 0; i < 3; i++) {
            if (this.#particles.length < MAX_PARTICLES) {
              const p = new Particle(cx, cy, '#8ab4d6');
              p.vy = -(Math.random() * 2 + 0.5);
              p.vx = (Math.random() - 0.5) * 6;
              p.size = 1.5 + Math.random() * 2;
              p.gravity = 0.08;
              this.#particles.push(p);
            }
          }
          break;
        }
      }
    }
  }

  /**
   * Lock pulse — brief scale-up then fade on the locked piece cells.
   */
  triggerLockPulse(piece) {
    const cells = [];
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          cells.push({
            x: (piece.x + c) * CELL_SIZE + CELL_SIZE / 2,
            y: (piece.y + r) * CELL_SIZE + CELL_SIZE / 2,
            color: piece.color,
          });
        }
      }
    }
    this.#lockPulse = { cells, scale: 1.12, alpha: 0.7 };
  }

  /**
   * Floating text that rises and fades (used for combos, T-spins, B2B, etc.).
   */
  triggerComboText(text, row) {
    if (!text) return;
    this.#floatingTexts.push({
      text,
      x: (COLS * CELL_SIZE) / 2,
      y: Math.max(2, row) * CELL_SIZE,
      alpha: 1,
      color: this.#textColor(text),
      size: text.includes('PERFECT') ? 28 : 20,
      vy: -2,
    });
  }

  #textColor(text) {
    if (text.includes('PERFECT')) return '#ff80ff';
    if (text.includes('BACK')) return '#ffa040';
    if (text.includes('T-SPIN')) return '#c060ff';
    return '#80c0ff';
  }

  /**
   * Animate cells sliding down after line clears.
   * Slow, visible fall with gentle bounce at landing.
   */
  triggerFallingCells(fallingCells) {
    if (!fallingCells || fallingCells.length === 0) return;
    for (const fc of fallingCells) {
      this.#fallingCells.push({
        col: fc.col,
        fromY: fc.fromRow,
        toY: fc.toRow,
        currentY: fc.fromRow,
        color: fc.color,
        velocity: 0,
        gravity: 0.008 + Math.random() * 0.004, // visible falling
        bounces: 0,
        delay: 0,
        started: false,
        landGlow: 0, // glow when cell lands
      });
    }
  }

  drawFrame(state) {
    const ctx = this.#gameCtx;
    const canvasW = COLS * CELL_SIZE;
    const canvasH = ROWS * CELL_SIZE;
    this.#frameCount++;

    // Tick animation timer
    if (this.#clearAnimTimer > 0) {
      this.#clearAnimTimer--;
    }

    ctx.save();

    // Screen shake
    if (this.#shakeAmount > 0.5) {
      const sx = (Math.random() - 0.5) * this.#shakeAmount;
      const sy = (Math.random() - 0.5) * this.#shakeAmount;
      ctx.translate(sx, sy);
      this.#shakeAmount *= this.#shakeDecay;
    } else {
      this.#shakeAmount = 0;
    }

    ctx.clearRect(-10, -10, canvasW + 20, canvasH + 20);

    // Rich gradient background
    ctx.fillStyle = this.#bgGradient;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Animated twinkling stars
    this.#drawStars(ctx, canvasW, canvasH);

    // Subtle vignette
    this.#drawVignette(ctx, canvasW, canvasH);

    this.#drawGrid(ctx);
    this.#drawBoardEdgeGlow(ctx, canvasW, canvasH);
    this.#drawSlamLines(ctx);
    // Skip static board during collapse — cells are animated individually
    if (!this.#collapseActive) {
      this.#drawBoard(ctx, state.visibleGrid);
    }
    this.#drawDangerZone(ctx);
    this.#drawFallingCells(ctx);
    this.#drawVanishingRows(ctx);
    this.#drawCrackLines(ctx);
    this.#drawRowFlashes(ctx);
    this.#drawSweepBeams(ctx);
    this.#drawDissolvingCells(ctx);
    this.#drawCollapseGrid(ctx);

    if (state.currentPiece && !state.gameOver) {
      // Piece trail — fading afterimages
      this.#drawPieceTrail(ctx);

      // Ghost piece — dashed outline
      if (state.ghostY !== undefined) {
        this.#drawGhostPiece(ctx, state.currentPiece.shape, state.currentPiece.x, state.ghostY, state.currentPiece.color);
      }
      // Active piece — with glow
      ctx.shadowColor = state.currentPiece.color;
      ctx.shadowBlur = 18;
      this.#drawPiece(ctx, state.currentPiece.shape, state.currentPiece.x, state.currentPiece.y, state.currentPiece.color, 1);
      ctx.shadowBlur = 0;
    }

    // Lock pulse effect
    this.#drawLockPulse(ctx);

    // Lock bounce (squash & spring)
    this.#drawLockBounce(ctx);

    // Flash overlay — slow dramatic decay
    if (this.#flashAlpha > 0.01) {
      ctx.globalAlpha = Math.min(1, this.#flashAlpha);
      ctx.fillStyle = this.#flashColor;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.globalAlpha = 1;
      this.#flashAlpha *= 0.96;
    }

    this.#drawShockwaves(ctx);

    // Particles
    this.#particles = this.#particles.filter(p => p.life > 0);
    for (const p of this.#particles) {
      p.update();
      p.draw(ctx);
    }

    this.#drawFloatingTexts(ctx);

    ctx.restore();

    this.#drawHoldPiece(state.holdType);
    this.#drawNextPieces(state.nextTypes);
    this.#updateStats(state.score, state.level, state.lines, state.highScore);
  }

  showOverlay(text) {
    this.#overlayTextEl.textContent = text;
    this.#overlayEl.classList.remove('hidden');
    this.#overlayEl.classList.add('visible');
  }

  hideOverlay() {
    this.#overlayEl.classList.remove('visible');
    this.#overlayEl.classList.add('hidden');
  }

  #drawStars(ctx, w, h) {
    const time = this.#frameCount * 0.02 * this.#starSpeedBoost;
    // Decay speed boost back to 1
    this.#starSpeedBoost += (1 - this.#starSpeedBoost) * 0.02;
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

  #drawVignette(ctx, w, h) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, h * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  #drawSlamLines(ctx) {
    if (this.#slamLines.length === 0) return;
    for (const sl of this.#slamLines) {
      ctx.save();
      ctx.globalAlpha = sl.alpha;
      ctx.strokeStyle = '#80c0ff';
      ctx.lineWidth = sl.width;
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.topY);
      ctx.lineTo(sl.x, sl.bottomY);
      ctx.stroke();
      ctx.restore();
      sl.alpha *= 0.85;
    }
    this.#slamLines = this.#slamLines.filter(sl => sl.alpha > 0.01);
  }

  #drawCrackLines(ctx) {
    if (this.#crackLines.length === 0) return;
    for (const cl of this.#crackLines) {
      if (cl.delay > 0) { cl.delay--; continue; }
      ctx.save();
      ctx.globalAlpha = cl.alpha;
      // White crack with glow
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#80c0ff';
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
    this.#crackLines = this.#crackLines.filter(cl => cl.alpha > 0.01);
  }

  #drawRowFlashes(ctx) {
    if (this.#rowFlashData.length === 0) return;
    for (const rf of this.#rowFlashData) {
      if (rf.delay > 0) { rf.delay--; continue; }
      ctx.save();
      // Pulsing glow effect — brighter and more visible
      const pulse = 0.85 + 0.15 * Math.sin(this.#frameCount * 0.4);
      ctx.globalAlpha = Math.min(1, rf.alpha) * pulse;
      ctx.fillStyle = rf.color;
      ctx.fillRect(0, rf.row * CELL_SIZE - 4, COLS * CELL_SIZE, CELL_SIZE + 8);
      ctx.shadowColor = rf.color;
      ctx.shadowBlur = 40 * Math.min(1, rf.alpha);
      ctx.fillRect(0, rf.row * CELL_SIZE - 6, COLS * CELL_SIZE, CELL_SIZE + 12);
      ctx.restore();
      rf.alpha -= 0.012;
    }
    this.#rowFlashData = this.#rowFlashData.filter(rf => rf.alpha > 0.01);
  }

  #drawSweepBeams(ctx) {
    if (this.#sweepBeams.length === 0) return;
    for (const sb of this.#sweepBeams) {
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
    this.#sweepBeams = this.#sweepBeams.filter(sb => sb.alpha > 0.01);
  }

  #drawDissolvingCells(ctx) {
    if (this.#dissolveGrid.length === 0) return;
    for (const dc of this.#dissolveGrid) {
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
    this.#dissolveGrid = this.#dissolveGrid.filter(dc => dc.alpha > 0.01);
  }

  #drawFallingCells(ctx) {
    if (this.#fallingCells.length === 0) return;
    // Don't start falling until vanish phase is complete
    if (this.#vanishPhase) {
      // Draw cells at their original position while waiting
      for (const fc of this.#fallingCells) {
        this.#drawCell(ctx, fc.col, fc.fromY, fc.color, 1);
      }
      return;
    }
    for (const fc of this.#fallingCells) {
      // Cell has landed — show landing glow then mark truly done
      if (fc.landed) {
        fc.landGlow -= 0.02;
        // Draw landed cell solidly at final position
        this.#drawCell(ctx, fc.col, fc.toY, fc.color, 1);
        // Landing glow overlay
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
        continue;
      }

      // Slow physics-based falling
      fc.velocity += fc.gravity;
      fc.currentY += fc.velocity;

      if (fc.currentY >= fc.toY) {
        fc.currentY = fc.toY;
        fc.velocity = 0;
        fc.landed = true;
        fc.landGlow = 1; // start landing glow
      }

      // Motion trail behind falling cell
      if (fc.velocity > 0.03) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        this.#drawCell(ctx, fc.col, fc.currentY - 0.4, fc.color, 0.15);
        ctx.globalAlpha = 0.08;
        this.#drawCell(ctx, fc.col, fc.currentY - 0.7, fc.color, 0.08);
        ctx.restore();
      }
      this.#drawCell(ctx, fc.col, fc.currentY, fc.color, 1);
    }
    this.#fallingCells = this.#fallingCells.filter(fc => !fc.done);
  }

  /**
   * Draw vanishing rows — row-by-row highlight then cell shrink animation.
   * Each row: highlight with color glow → cells shrink to nothing → particles burst.
   */
  #drawVanishingRows(ctx) {
    if (this.#vanishingRows.length === 0) {
      if (this.#vanishPhase) this.#vanishPhase = false;
      return;
    }

    let allDone = true;
    for (const vr of this.#vanishingRows) {
      // Stagger: wait for this row's delay
      if (vr.delay > 0) {
        vr.delay--;
        // Draw cells normally while waiting
        for (const cell of vr.cells) {
          this.#drawCell(ctx, cell.col, vr.row, cell.color, 1);
        }
        allDone = false;
        continue;
      }

      vr.phaseTimer++;

      if (vr.phase === 'highlight') {
        // Glow highlight ramps up over ~20 frames, using the row's own colors
        vr.highlightAlpha = Math.min(1, vr.phaseTimer / 20);

        // Play highlight sound when this row starts glowing
        if (!vr.soundPlayed) {
          vr.soundPlayed = true;
          this.#soundCallbacks.onRowHighlight(vr.rowIndex);
        }
        // Draw cells with increasing glow
        for (const cell of vr.cells) {
          this.#drawCell(ctx, cell.col, vr.row, cell.color, 1);
        }
        // Colored glow overlay on the row (not white)
        ctx.save();
        const glowAlpha = vr.highlightAlpha * 0.4;
        ctx.globalAlpha = glowAlpha;
        // Use average color tint from first cell
        const tintColor = vr.cells.length > 0 ? vr.cells[0].color : '#80c0ff';
        ctx.fillStyle = tintColor;
        ctx.shadowColor = tintColor;
        ctx.shadowBlur = 20 * vr.highlightAlpha;
        ctx.fillRect(0, vr.row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
        ctx.restore();

        if (vr.phaseTimer >= 30) {
          vr.phase = 'shrink';
          vr.phaseTimer = 0;
        }
        allDone = false;
      } else if (vr.phase === 'shrink') {
        // Cells shrink and fade one by one (left to right stagger)
        let rowDone = true;
        for (const cell of vr.cells) {
          if (cell.delay > 0) {
            cell.delay--;
            // Still visible while waiting
            this.#drawCell(ctx, cell.col, vr.row, cell.color, cell.alpha);
            rowDone = false;
            continue;
          }
          // Play per-cell pop sound when this cell starts shrinking
          if (!cell.popSoundPlayed) {
            cell.popSoundPlayed = true;
            this.#soundCallbacks.onCellPop(cell.col, COLS);
          }
          cell.scale *= 0.95;
          cell.alpha *= 0.96;
          // Spawn particles immediately as cell starts shrinking (simultaneous)
          if (!cell.particlesSpawned) {
            cell.particlesSpawned = true;
            const cx = cell.col * CELL_SIZE + CELL_SIZE / 2;
            const cy = vr.row * CELL_SIZE + CELL_SIZE / 2;
            for (let p = 0; p < 5; p++) {
              if (this.#particles.length < MAX_PARTICLES) {
                this.#particles.push(new Particle(cx, cy, cell.color));
              }
            }
          }
          if (cell.scale > 0.05 && cell.alpha > 0.05) {
            // Draw shrinking cell
            const px = cell.col * CELL_SIZE + CELL_SIZE / 2;
            const py = vr.row * CELL_SIZE + CELL_SIZE / 2;
            ctx.save();
            ctx.translate(px, py);
            ctx.scale(cell.scale, cell.scale);
            ctx.globalAlpha = cell.alpha;
            const half = CELL_SIZE / 2;
            // Draw as the colored block, shrinking
            const grad = ctx.createLinearGradient(-half, -half, half * 0.4, half);
            grad.addColorStop(0, lightenColor(cell.color, 28));
            grad.addColorStop(0.35, cell.color);
            grad.addColorStop(1, darkenColor(cell.color, 30));
            ctx.fillStyle = grad;
            ctx.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            ctx.restore();
            rowDone = false;
          }
        }
        if (rowDone) {
          vr.phase = 'done';
          // Play row-cleared completion sound
          if (!vr.clearSoundPlayed) {
            vr.clearSoundPlayed = true;
            this.#soundCallbacks.onRowCleared(vr.rowIndex);
          }
        }
        allDone = allDone && rowDone;
      }
    }

    // Remove completed rows
    this.#vanishingRows = this.#vanishingRows.filter(vr => vr.phase !== 'done');
    if (this.#vanishingRows.length === 0 && this.#vanishPhase) {
      this.#vanishPhase = false;
    }
  }

  #drawLockPulse(ctx) {
    if (!this.#lockPulse) return;
    const lp = this.#lockPulse;
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
    if (lp.alpha < 0.02) this.#lockPulse = null;
  }

  #drawShockwaves(ctx) {
    if (this.#shockwaves.length === 0) return;
    for (const sw of this.#shockwaves) {
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
    this.#shockwaves = this.#shockwaves.filter(sw => sw.alpha > 0.01 && sw.radius < sw.maxRadius);
  }

  #drawFloatingTexts(ctx) {
    if (this.#floatingTexts.length === 0) return;
    for (const ft of this.#floatingTexts) {
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
    this.#floatingTexts = this.#floatingTexts.filter(ft => ft.alpha > 0.01);
  }

  #drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(27, 58, 92, 0.35)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }
  }

  #drawBoard(ctx, grid) {
    // Build a set of cells that are currently being animated (falling)
    // so we don't draw them at their final position yet.
    const fallingSet = new Set();
    for (const fc of this.#fallingCells) {
      fallingSet.add(`${Math.round(fc.toY)},${fc.col}`);
    }

    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          if (fallingSet.has(`${r},${c}`)) continue; // skip — being animated
          this.#drawCell(ctx, c, r, grid[r][c], 1);
        }
      }
    }
  }

  #drawPiece(ctx, shape, px, py, color, alpha) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.#drawCell(ctx, px + c, py + r, color, alpha);
        }
      }
    }
  }

  #drawGhostPiece(ctx, shape, px, py, color) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = hexToRgba(color, 0.45);
    ctx.fillStyle = hexToRgba(color, 0.07);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const cx = (px + c) * CELL_SIZE;
          const cy = (py + r) * CELL_SIZE;
          if (py + r < 0) continue;
          ctx.fillRect(cx + 1, cy + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          ctx.strokeRect(cx + 2, cy + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
      }
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  #drawCell(ctx, x, y, color, alpha) {
    if (y < 0) return;
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const inset = 1;
    const w = CELL_SIZE - 2;

    ctx.globalAlpha = alpha;

    // Gradient fill for rich 3D look
    const grad = ctx.createLinearGradient(px, py, px + CELL_SIZE * 0.4, py + CELL_SIZE);
    grad.addColorStop(0, lightenColor(color, 28));
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, darkenColor(color, 30));
    ctx.fillStyle = grad;
    // Rounded rect for softer feel
    const r = 3;
    ctx.beginPath();
    ctx.moveTo(px + inset + r, py + inset);
    ctx.lineTo(px + inset + w - r, py + inset);
    ctx.quadraticCurveTo(px + inset + w, py + inset, px + inset + w, py + inset + r);
    ctx.lineTo(px + inset + w, py + inset + w - r);
    ctx.quadraticCurveTo(px + inset + w, py + inset + w, px + inset + w - r, py + inset + w);
    ctx.lineTo(px + inset + r, py + inset + w);
    ctx.quadraticCurveTo(px + inset, py + inset + w, px + inset, py + inset + w - r);
    ctx.lineTo(px + inset, py + inset + r);
    ctx.quadraticCurveTo(px + inset, py + inset, px + inset + r, py + inset);
    ctx.closePath();
    ctx.fill();

    // Top-left highlight edge
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(px + inset + 2, py + inset, w - 4, 2);
    ctx.fillRect(px + inset, py + inset + 2, 2, w - 4);

    // Bottom-right shadow edge
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px + inset + 2, py + CELL_SIZE - 3, w - 4, 2);
    ctx.fillRect(px + CELL_SIZE - 3, py + inset + 2, 2, w - 4);

    // Inner shine — circular highlight
    const shineGrad = ctx.createRadialGradient(px + 9, py + 8, 1, px + 9, py + 8, 8);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
    shineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(px + 3, py + 3, 14, 14);

    ctx.globalAlpha = 1;
  }

  #drawHoldPiece(type) {
    this.#drawHoldToCanvas(this.#holdCtx, type);
    if (this.#mobileHoldCtx) this.#drawHoldToCanvas(this.#mobileHoldCtx, type);
  }

  #drawHoldToCanvas(ctx, type) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#0c1a2e');
    bg.addColorStop(1, '#0a1222');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    this.#drawPreviewPiece(ctx, type, canvas.width, canvas.height);
  }

  #drawNextPieces(types) {
    this.#drawNextToCanvas(this.#nextCtx, types, 24);
    if (this.#mobileNextCtx) this.#drawNextToCanvas(this.#mobileNextCtx, types, 12);
  }

  #drawNextToCanvas(ctx, types, cellSize) {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#0c1a2e');
    bg.addColorStop(1, '#0a1222');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!types || types.length === 0) return;

    const slotH = canvas.height / 3;
    for (let i = 0; i < types.length; i++) {
      const shape = getShapeForType(types[i]);
      const color = getColorForType(types[i]);
      const offsetX = (canvas.width - shape[0].length * cellSize) / 2;
      const offsetY = i * slotH + (slotH - shape.length * cellSize) / 2;

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const px = offsetX + c * cellSize;
            const py = offsetY + r * cellSize;
            const s = cellSize;
            // Mini gradient cell with rounded corners
            const grad = ctx.createLinearGradient(px, py, px, py + s);
            grad.addColorStop(0, lightenColor(color, 18));
            grad.addColorStop(1, darkenColor(color, 22));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, s - 2, s - 2, 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.fillRect(px + 2, py + 1, s - 4, 2);
            ctx.fillRect(px + 1, py + 2, 2, s - 4);
          }
        }
      }

      // Separator line between slots (except after last)
      if (i < types.length - 1) {
        ctx.strokeStyle = 'rgba(27, 58, 92, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, (i + 1) * slotH);
        ctx.lineTo(canvas.width - 10, (i + 1) * slotH);
        ctx.stroke();
      }
    }
  }

  #drawPreviewPiece(ctx, type, width, height) {
    const shape = getShapeForType(type);
    const color = getColorForType(type);
    // Scale cell size to fit the canvas
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
          const grad = ctx.createLinearGradient(px, py, px, py + s);
          grad.addColorStop(0, lightenColor(color, 18));
          grad.addColorStop(1, darkenColor(color, 22));
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(px + 1, py + 1, s - 2, s - 2, 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(px + 2, py + 1, s - 4, 2);
          ctx.fillRect(px + 1, py + 2, 2, s - 4);
        }
      }
    }
  }

  #updateStats(score, level, lines, highScore) {
    // Smooth score tween
    this.#displayScore += (score - this.#displayScore) * 0.15;
    this.#displayLines += (lines - this.#displayLines) * 0.2;
    const roundedScore = Math.round(this.#displayScore);
    const roundedLines = Math.round(this.#displayLines);
    this.#scoreEl.textContent = roundedScore;
    this.#levelEl.textContent = level;
    this.#linesEl.textContent = roundedLines;
    if (this.#mobileScoreEl) this.#mobileScoreEl.textContent = roundedScore;
    if (this.#mobileLevelEl) this.#mobileLevelEl.textContent = level;
    if (this.#mobileLinesEl) this.#mobileLinesEl.textContent = roundedLines;
    const hsEl = document.getElementById('high-score');
    if (hsEl) hsEl.textContent = highScore || 0;
  }

  /**
   * Level-up celebration: golden flash + floating text + extra shake.
   */
  triggerLevelUpEffect(newLevel) {
    // Flash gold
    this.#flashColor = '#ffe060';
    this.#flashAlpha = 0.5;
    this.#shakeAmount = 6;

    // Add large floating text
    this.#floatingTexts.push({
      text: `LEVEL ${newLevel}`,
      x: (COLS * CELL_SIZE) / 2,
      y: (ROWS * CELL_SIZE) / 2,
      alpha: 1.2,
      color: '#ffe060',
      size: 36,
      vy: -1.5,
    });

    // Add golden particles
    const cx = (COLS * CELL_SIZE) / 2;
    const cy = (ROWS * CELL_SIZE) / 2;
    for (let i = 0; i < 40 && this.#particles.length < MAX_PARTICLES; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 2 + Math.random() * 4;
      const p = new Particle(cx, cy, '#ffe060');
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 2 + Math.random() * 3;
      p.life = 50 + Math.random() * 30;
      p.gravity = 0.03;
      this.#particles.push(p);
    }
  }

  /**
   * Game over collapse — cells fall row by row from top to bottom with staggered delay.
   */
  triggerGameOverCollapse(grid) {
    this.#collapseGrid = [];
    this.#collapseActive = true;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          const delay = r * 3 + Math.random() * 4; // top rows first
          this.#collapseGrid.push({
            px: c * CELL_SIZE + CELL_SIZE / 2,
            py: r * CELL_SIZE + CELL_SIZE / 2,
            color: grid[r][c],
            alpha: 1,
            delay,
            vy: 0,
            vx: (Math.random() - 0.5) * 2,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.1,
            gravity: 0.15 + Math.random() * 0.1,
          });
        }
      }
    }
    this.#shakeAmount = 8;
  }

  /**
   * Set danger level from game (0 = safe, 1 = critical).
   */
  setDangerLevel(level) {
    this.#dangerLevel = Math.max(0, Math.min(1, level));
  }

  /** Whether the game over collapse animation is still playing. */
  get isCollapsing() {
    return this.#collapseActive;
  }

  /**
   * Add a piece trail frame for motion blur.
   */
  addTrailFrame(piece) {
    if (!piece) return;
    this.#pieceTrail.push({
      shape: piece.shape,
      x: piece.x, y: piece.y,
      color: piece.color,
      alpha: 0.25,
    });
    if (this.#pieceTrail.length > 3) this.#pieceTrail.shift();
  }

  /**
   * Lock bounce — brief squash then spring back.
   */
  triggerLockBounce(piece) {
    const cells = [];
    const shape = piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          cells.push({
            x: (piece.x + c) * CELL_SIZE + CELL_SIZE / 2,
            y: (piece.y + r) * CELL_SIZE + CELL_SIZE / 2,
            color: piece.color,
          });
        }
      }
    }
    this.#lockBounce = { cells, scaleX: 1.15, scaleY: 0.75, velX: 0, velY: 0 };
  }

  // ─── New draw methods ────────────────────────────────────────────────

  #drawCollapseGrid(ctx) {
    if (this.#collapseGrid.length === 0) {
      if (this.#collapseActive) this.#collapseActive = false;
      return;
    }
    const half = CELL_SIZE / 2;
    for (const dc of this.#collapseGrid) {
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
    this.#collapseGrid = this.#collapseGrid.filter(
      dc => dc.alpha > 0.01 && dc.py < (ROWS + 5) * CELL_SIZE
    );
  }

  #drawDangerZone(ctx) {
    if (this.#dangerLevel < 0.05) return;
    const d = this.#dangerLevel;
    const w = COLS * CELL_SIZE;
    const h = ROWS * CELL_SIZE;

    // Fast pulse — more urgent at higher danger
    const pulseSpeed = 0.08 + d * 0.12;
    const pulse = 0.5 + 0.5 * Math.sin(this.#frameCount * pulseSpeed);

    // Red gradient overlay covering danger height
    const height = Math.max(3, Math.ceil(10 * d)) * CELL_SIZE;
    const alpha = d * 0.4 * pulse;
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#ff2020');
    grad.addColorStop(0.5, 'rgba(255,40,20,0.5)');
    grad.addColorStop(1, 'rgba(255,32,32,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, height);
    ctx.restore();

    // Pulsing red border on left/right edges
    const edgeAlpha = d * 0.6 * pulse;
    ctx.save();
    ctx.globalAlpha = edgeAlpha;
    ctx.fillStyle = '#ff3030';
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);
    ctx.restore();

    // "DANGER" text at critical levels
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

    // Show entering danger zone text once
    if (d > 0.1 && this.#prevDangerLevel < 0.1) {
      this.#floatingTexts.push({
        text: 'DANGER ZONE!',
        x: w / 2,
        y: h * 0.3,
        alpha: 1.5,
        color: '#ff4040',
        size: 28,
        vy: -1,
      });
    }
    this.#prevDangerLevel = d;
  }

  #drawBoardEdgeGlow(ctx, w, h) {
    const intensity = this.#clearAnimTimer > 0 ? 0.4 : 0.08;
    const color = this.#dangerLevel > 0.5 ? '255,60,60' : '90,176,255';
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

  #drawPieceTrail(ctx) {
    for (const t of this.#pieceTrail) {
      if (t.alpha < 0.02) continue;
      ctx.save();
      ctx.globalAlpha = t.alpha;
      this.#drawPiece(ctx, t.shape, t.x, t.y, t.color, t.alpha);
      ctx.restore();
      t.alpha *= 0.5;
    }
    this.#pieceTrail = this.#pieceTrail.filter(t => t.alpha > 0.02);
  }

  #drawLockBounce(ctx) {
    if (!this.#lockBounce) return;
    const lb = this.#lockBounce;
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
      this.#lockBounce = null;
    }
  }
}

export { Renderer };
