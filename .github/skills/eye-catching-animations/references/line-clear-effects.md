# Line Clear Effects — Drop-in Code

Complete implementation for dramatic, multi-phase line clear animations.

## Full Dramatic Line Clear

### Step 1: Add State Fields to Renderer

Add these private fields to the `Renderer` class:

```javascript
// In Renderer class field declarations:
#rowFlashData = [];        // { row, alpha, color } — row highlight overlays
#sweepBeams = [];          // { row, x, width, alpha } — sweeping light beam
#dissolveGrid = [];        // { col, row, color, scale, rotation, alpha, vx, vy } — shrinking cells
#shockwaves = [];          // { cx, cy, radius, maxRadius, alpha, color } — expanding rings
#freezeFrames = 0;         // Skip N frames of game logic (visual pause)
```

### Step 2: Replace `triggerLineClearEffect()`

```javascript
triggerLineClearEffect(clearedRows, clearedRowColors) {
  const count = clearedRows.length;
  const isTetris = count >= 4;

  // Screen shake — scales with count
  this.#shakeAmount = 3 + count * 4;

  // Flash — brighter for bigger clears
  this.#flashAlpha = 0.2 + count * 0.12;
  if (isTetris) this.#flashAlpha = 0.7;

  // Phase 1: Row highlight flashes
  for (let i = 0; i < clearedRows.length; i++) {
    this.#rowFlashData.push({
      row: clearedRows[i],
      alpha: 1.0,
      color: isTetris ? '#ffe080' : '#ffffff',
    });
  }

  // Phase 2: Sweep beams (staggered 2 frames apart per row)
  for (let i = 0; i < clearedRows.length; i++) {
    this.#sweepBeams.push({
      row: clearedRows[i],
      x: -CELL_SIZE * 2,
      speed: 18 + count * 4,
      width: CELL_SIZE * 3,
      alpha: 0.8,
      delay: i * 2,   // stagger frames
      color: isTetris ? '#ffe080' : '#80c0ff',
    });
  }

  // Phase 3: Dissolving cells
  for (let i = 0; i < clearedRows.length; i++) {
    const row = clearedRows[i];
    const colors = clearedRowColors[i];
    for (let c = 0; c < colors.length; c++) {
      if (!colors[c]) continue;
      this.#dissolveGrid.push({
        px: c * CELL_SIZE + CELL_SIZE / 2,
        py: row * CELL_SIZE + CELL_SIZE / 2,
        color: colors[c],
        scale: 1.0,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        alpha: 1.0,
        delay: 8 + i * 2 + Math.random() * 4,  // starts after sweep
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }
  }

  // Phase 4: Shockwave from center of cleared area
  const midRow = clearedRows[Math.floor(clearedRows.length / 2)];
  const centerY = midRow * CELL_SIZE + CELL_SIZE / 2;
  this.#shockwaves.push({
    cx: (COLS * CELL_SIZE) / 2,
    cy: centerY,
    radius: 5,
    maxRadius: 280 + count * 40,
    alpha: 0.5 + count * 0.08,
    color: isTetris ? '#ffe080' : '#80c0ff',
    lineWidth: 2 + count,
  });

  if (isTetris) {
    // Second shockwave offset for Tetris
    this.#shockwaves.push({
      cx: (COLS * CELL_SIZE) / 2,
      cy: centerY,
      radius: 5,
      maxRadius: 350,
      alpha: 0.35,
      color: '#ffffff',
      lineWidth: 1.5,
    });
    // Freeze frame — brief pause for drama
    this.#freezeFrames = 3;
  }

  // Phase 5: Explosion particles (existing system, boosted)
  for (let i = 0; i < clearedRows.length; i++) {
    const row = clearedRows[i];
    const colors = clearedRowColors[i];
    const particlesPerCell = 4 + count * 2;
    for (let c = 0; c < colors.length; c++) {
      const cx = c * CELL_SIZE + CELL_SIZE / 2;
      const cy = row * CELL_SIZE + CELL_SIZE / 2;
      const color = colors[c] || '#fff';
      for (let p = 0; p < particlesPerCell; p++) {
        if (this.#particles.length < MAX_PARTICLES) {
          this.#particles.push(new Particle(cx, cy, color));
        }
      }
    }
  }
}
```

### Step 3: Add Rendering in `drawFrame()`

Insert these blocks at the correct pipeline positions:

#### After `#drawBoard()` — Row highlights + dissolving cells
```javascript
// Row flash highlights
if (this.#rowFlashData.length > 0) {
  for (const rf of this.#rowFlashData) {
    ctx.save();
    ctx.globalAlpha = rf.alpha * 0.9;
    ctx.fillStyle = rf.color;
    ctx.fillRect(0, rf.row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    // Halo glow
    ctx.shadowColor = rf.color;
    ctx.shadowBlur = 25 * rf.alpha;
    ctx.fillRect(0, rf.row * CELL_SIZE - 2, COLS * CELL_SIZE, CELL_SIZE + 4);
    ctx.restore();
    rf.alpha -= 0.04;
  }
  this.#rowFlashData = this.#rowFlashData.filter(rf => rf.alpha > 0.01);
}

// Sweep beams
if (this.#sweepBeams.length > 0) {
  for (const sb of this.#sweepBeams) {
    if (sb.delay > 0) { sb.delay--; continue; }
    ctx.save();
    ctx.globalAlpha = sb.alpha;
    const grad = ctx.createLinearGradient(sb.x, 0, sb.x + sb.width, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.3, sb.color);
    grad.addColorStop(0.7, sb.color);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sb.x, sb.row * CELL_SIZE - 2, sb.width, CELL_SIZE + 4);
    ctx.restore();
    sb.x += sb.speed;
    if (sb.x > COLS * CELL_SIZE + sb.width) sb.alpha = 0;
    sb.alpha *= 0.98;
  }
  this.#sweepBeams = this.#sweepBeams.filter(sb => sb.alpha > 0.01);
}

// Dissolving cells
if (this.#dissolveGrid.length > 0) {
  for (const dc of this.#dissolveGrid) {
    if (dc.delay > 0) { dc.delay--; continue; }
    ctx.save();
    ctx.globalAlpha = dc.alpha;
    ctx.translate(dc.px, dc.py);
    ctx.rotate(dc.rotation);
    ctx.scale(dc.scale, dc.scale);
    const half = CELL_SIZE / 2;
    ctx.fillStyle = dc.color;
    ctx.fillRect(-half + 1, -half + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    ctx.restore();
    dc.rotation += dc.rotSpeed;
    dc.scale *= 0.92;
    dc.alpha -= 0.04;
    dc.px += dc.vx;
    dc.py += dc.vy;
    dc.vy += 0.1;
  }
  this.#dissolveGrid = this.#dissolveGrid.filter(dc => dc.alpha > 0.01);
}
```

#### After flash overlay — Shockwave rings
```javascript
// Shockwave rings
if (this.#shockwaves.length > 0) {
  for (const sw of this.#shockwaves) {
    ctx.save();
    ctx.globalAlpha = sw.alpha;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = sw.lineWidth;
    ctx.beginPath();
    ctx.arc(sw.cx, sw.cy, sw.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    sw.radius += 7;
    sw.alpha *= 0.93;
    sw.lineWidth *= 0.97;
  }
  this.#shockwaves = this.#shockwaves.filter(sw => sw.alpha > 0.01 && sw.radius < sw.maxRadius);
}
```

### Step 4: Freeze Frame Support (Optional)

In `game.js`, add a freeze frame check. Before applying gravity in `#gameLoop()`:

```javascript
// Check for visual freeze frames (dramatic pause on Tetris)
if (this.#renderer.freezeFrames > 0) {
  this.#renderer.freezeFrames--;
  this.#render();
  this.#animFrameId = requestAnimationFrame((t) => this.#gameLoop(t));
  return;
}
```

Expose via getter in Renderer:
```javascript
get freezeFrames() { return this.#freezeFrames; }
set freezeFrames(v) { this.#freezeFrames = v; }
```

## Tetris-Specific Golden Flash

For 4-line clears, use a golden color palette instead of blue:

```javascript
// In triggerLineClearEffect, when count >= 4:
this.#flashAlpha = 0.7;
// Use '#ffe080' for flash color instead of '#c8d8ff'
// In drawFrame flash section, check:
const flashColor = this.#flashAlpha > 0.5 ? '#ffe080' : '#c8d8ff';
ctx.fillStyle = flashColor;
```

## Cascade Chain Visuals

When Block Blast gravity causes chain clears, each wave should escalate:

```javascript
// Track cascade wave count in triggerLineClearEffect
#cascadeWave = 0;

triggerLineClearEffect(clearedRows, clearedRowColors, cascadeWave = 0) {
  // Escalate colors per wave
  const waveColors = ['#80c0ff', '#80ffb0', '#ffe080', '#ff8080'];
  const ringColor = waveColors[Math.min(cascadeWave, waveColors.length - 1)];
  
  // Escalate shake/flash per wave
  const waveBoost = 1 + cascadeWave * 0.3;
  this.#shakeAmount = (3 + count * 4) * waveBoost;
  this.#flashAlpha = (0.2 + count * 0.12) * waveBoost;
  
  // Use ringColor for shockwaves and sweep beams
}
```
