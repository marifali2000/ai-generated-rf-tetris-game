# Game Event Animations — Drop-in Code

Dramatic animations for every major game event beyond line clears.

## Hard Drop Impact

A vertical slam effect with directional shake and dust particles.

```javascript
// Add to Renderer:
#slamLines = [];  // { x, topY, bottomY, alpha }

triggerHardDropEffect(piece, dropDistance) {
  if (dropDistance < 2) return;  // skip for tiny drops
  
  const intensity = Math.min(dropDistance / 10, 1);
  
  // Directional shake (mostly vertical)
  this.#shakeAmount = 2 + intensity * 6;
  
  // Vertical slam lines from each column of the piece
  const shape = piece.shape;
  for (let c = 0; c < shape[0].length; c++) {
    // Find topmost occupied cell in this column
    for (let r = 0; r < shape.length; r++) {
      if (shape[r][c]) {
        const px = (piece.x + c) * CELL_SIZE + CELL_SIZE / 2;
        this.#slamLines.push({
          x: px,
          topY: 0,
          bottomY: (piece.y + r) * CELL_SIZE,
          alpha: 0.5 * intensity,
          width: 2,
        });
        break;
      }
    }
  }
  
  // Dust particles at landing site
  for (let c = 0; c < shape[0].length; c++) {
    for (let r = shape.length - 1; r >= 0; r--) {
      if (shape[r][c]) {
        const cx = (piece.x + c) * CELL_SIZE + CELL_SIZE / 2;
        const cy = (piece.y + r + 1) * CELL_SIZE;
        for (let i = 0; i < 3; i++) {
          this.#particles.push(new Particle(cx, cy, '#8ab4d6'));
          const p = this.#particles[this.#particles.length - 1];
          p.vy = -(Math.random() * 2 + 0.5);
          p.vx = (Math.random() - 0.5) * 6;
          p.size = 1.5 + Math.random() * 2;
          p.gravity = 0.08;
        }
        break;
      }
    }
  }
}

// In drawFrame(), after grid but before board:
if (this.#slamLines.length > 0) {
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
```

### Wiring in game.js:
```javascript
#hardDrop() {
  // ... existing code ...
  const dropDistance = dropY - startY;
  this.#renderer.triggerHardDropEffect(this.#currentPiece, dropDistance);
  // ... lockPiece() ...
}
```

## Element Lock Pulse

Brief scale-up to 1.08× then snap back when an element locks. Creates a satisfying "thud" feel.

```javascript
// Add to Renderer:
#lockPulse = null;  // { cells: [{x,y,color}], scale, alpha }

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

// In drawFrame(), after drawing active element:
if (this.#lockPulse) {
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
  lp.scale += (1.0 - lp.scale) * 0.3;
  lp.alpha *= 0.82;
  if (lp.alpha < 0.02) this.#lockPulse = null;
}
```

## Level Up Celebration

Ascending sparkle column from center + golden radial flash.

```javascript
// Add to Renderer:
#levelUpSparkles = [];  // { x, y, alpha, size, speed }
#levelUpFlash = 0;

triggerLevelUpEffect() {
  this.#levelUpFlash = 0.5;
  
  const centerX = (COLS * CELL_SIZE) / 2;
  const bottomY = ROWS * CELL_SIZE;
  
  // Column of rising sparkles
  for (let i = 0; i < 30; i++) {
    this.#levelUpSparkles.push({
      x: centerX + (Math.random() - 0.5) * COLS * CELL_SIZE * 0.6,
      y: bottomY + Math.random() * 100,
      alpha: 0.8 + Math.random() * 0.2,
      size: 1.5 + Math.random() * 3,
      speed: 3 + Math.random() * 5,
      color: Math.random() > 0.5 ? '#ffe080' : '#ffffff',
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.1 + Math.random() * 0.15,
    });
  }
}

// In drawFrame(), after particles:
if (this.#levelUpFlash > 0.01) {
  const grad = ctx.createRadialGradient(
    COLS * CELL_SIZE / 2, ROWS * CELL_SIZE / 2, 0,
    COLS * CELL_SIZE / 2, ROWS * CELL_SIZE / 2, COLS * CELL_SIZE * 0.7
  );
  grad.addColorStop(0, `rgba(255, 224, 128, ${this.#levelUpFlash * 0.4})`);
  grad.addColorStop(1, 'rgba(255, 224, 128, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
  this.#levelUpFlash *= 0.92;
}

if (this.#levelUpSparkles.length > 0) {
  for (const sp of this.#levelUpSparkles) {
    sp.y -= sp.speed;
    sp.x += Math.sin(sp.wobblePhase) * 1.5;
    sp.wobblePhase += sp.wobbleSpeed;
    sp.alpha -= 0.012;
    ctx.save();
    ctx.globalAlpha = Math.max(0, sp.alpha);
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    // Star shape
    ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
    ctx.fill();
    // Small glow
    ctx.shadowColor = sp.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  this.#levelUpSparkles = this.#levelUpSparkles.filter(sp => sp.alpha > 0.01);
}
```

## Game Over Collapse

Row-by-row dissolve from top to bottom with falling debris.

```javascript
// Add to Renderer:
#gameOverTimer = 0;
#gameOverActive = false;
#gameOverGrid = null;  // snapshot of the grid at game over

triggerGameOverEffect(visibleGrid) {
  this.#gameOverActive = true;
  this.#gameOverTimer = 0;
  // Deep copy the grid for animation
  this.#gameOverGrid = visibleGrid.map(row => [...row]);
}

// In drawFrame(), override board drawing during game over:
if (this.#gameOverActive && this.#gameOverGrid) {
  this.#gameOverTimer++;
  const dissolveRow = Math.floor(this.#gameOverTimer / 3); // one row every 3 frames
  
  for (let r = 0; r < this.#gameOverGrid.length; r++) {
    for (let c = 0; c < this.#gameOverGrid[r].length; c++) {
      if (!this.#gameOverGrid[r][c]) continue;
      
      if (r < dissolveRow) {
        // Already dissolved — skip
        continue;
      } else if (r === dissolveRow) {
        // Currently dissolving — spawn debris particles
        const cx = c * CELL_SIZE + CELL_SIZE / 2;
        const cy = r * CELL_SIZE + CELL_SIZE / 2;
        if (Math.random() < 0.3) {
          this.#particles.push(new Particle(cx, cy, this.#gameOverGrid[r][c]));
        }
        this.#gameOverGrid[r][c] = null;
      }
      // Below dissolveRow — draw normally (handled by drawBoard)
    }
  }
  
  if (dissolveRow >= ROWS) {
    this.#gameOverActive = false;
    this.#gameOverGrid = null;
  }
}
```

## Combo Counter (Floating Text)

Rising "+N COMBO" text that fades out.

```javascript
// Add to Renderer:
#floatingTexts = [];  // { text, x, y, alpha, color, size }

triggerComboText(comboCount, row) {
  if (comboCount < 2) return;
  this.#floatingTexts.push({
    text: `${comboCount}× COMBO`,
    x: (COLS * CELL_SIZE) / 2,
    y: row * CELL_SIZE,
    alpha: 1.0,
    color: comboCount >= 4 ? '#ffe080' : '#80c0ff',
    size: 16 + Math.min(comboCount * 2, 12),
    vy: -2,
  });
}

// In drawFrame(), after particles:
if (this.#floatingTexts.length > 0) {
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
```
