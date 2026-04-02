---
name: next-level-game
description: "Comprehensive guide for elevating the Tetris game to professional quality across ALL dimensions: gameplay mechanics, animations, sound, UI/UX, visual polish, drama, performance, and player psychology. Use for: any request to improve, enhance, upgrade, polish, or take the game to the next level. Covers T-spins, back-to-back, combos, DAS/ARR, settings panel, stats, high scores, volume slider, touch controls, level-up celebrations, perfect clears, juice, feel, polish, game feel, player retention, addictiveness."
---

# Next-Level Game Skill — Complete Enhancement Guide

## When to Use
- Any request to "make the game better", "next level", "more polished", "more addictive"
- Adding advanced Tetris mechanics (T-spins, combos, back-to-back)
- Improving player controls (DAS/ARR, input buffering, touch)
- Enhancing UI beyond basic layout (settings, stats, menus)
- Making animations more satisfying or dramatic
- Improving sound quality or adding new sound events
- Performance optimization
- Mobile/accessibility improvements

## Current State Audit

### What's Already Excellent
| Feature | Quality | File |
|---------|---------|------|
| 7-layer line clear sounds | ⭐⭐⭐⭐⭐ | `js/sound.js` |
| 5 sound themes (glass, concrete, crystal, metal, ice) | ⭐⭐⭐⭐⭐ | `js/sound.js` |
| Multi-phase line clear animation | ⭐⭐⭐⭐⭐ | `js/renderer.js` |
| Glass shard particle system | ⭐⭐⭐⭐⭐ | `js/renderer.js` |
| Block Blast cascade gravity | ⭐⭐⭐⭐ | `js/board.js` |
| SRS rotation with wall kicks | ⭐⭐⭐⭐ | `js/piece.js` |
| AI demo mode | ⭐⭐⭐⭐ | `js/autoplay.js` |
| Dark blue visual theme | ⭐⭐⭐⭐ | `css/style.css` |

### What Needs Work (Priority Order)

| Gap | Impact | Effort | Category |
|-----|--------|--------|----------|
| DAS/ARR for movement | Critical — game "feel" | Medium | Controls |
| Combo display on screen | High — player feedback | Easy | UI/UX |
| T-spin detection & scoring | High — depth | Medium | Gameplay |
| Back-to-back bonus | High — strategy | Easy | Gameplay |
| Volume slider (not just mute) | High — usability | Easy | UI/UX |
| Level-up celebration effect | High — drama | Easy | Animation |
| Settings panel | High — customization | Medium | UI/UX |
| High score persistence | High — retention | Easy | Feature |
| Perfect clear detection | Medium — wow moments | Easy | Gameplay |
| Combo scoring multiplier | Medium — depth | Easy | Gameplay |
| Input buffering | Medium — responsiveness | Medium | Controls |
| Touch controls | Medium — mobile reach | Medium | Controls |
| Game over animation | Medium — drama | Easy | Animation |
| Sound preview on theme change | Medium — polish | Easy | Sound |
| Statistics screen | Medium — engagement | Medium | UI/UX |
| Mini-T-spin indicator | Medium — feedback | Easy | UI/UX |
| Piece lock squash/bounce | Low — juice | Easy | Animation |

---

## TIER 1: Game Feel & Controls (The Foundation)

### 1.1 DAS/ARR — Delayed Auto Shift & Auto Repeat Rate

**Why it matters**: Without DAS/ARR, holding left/right either does nothing (key repeat disabled) or fires at the OS repeat rate (inconsistent). Competitive Tetris players NEED configurable DAS/ARR. This single change makes the game feel 10× more responsive.

**Implementation in `js/input.js`:**

```javascript
class InputHandler {
  #das = 133;     // ms before auto-repeat starts (Tetris Guideline default)
  #arr = 10;      // ms between auto-repeats (0 = instant)
  #sdf = 5;       // soft drop factor (cells per gravity tick, Infinity = instant)

  #heldDirection = null;  // 'left' | 'right' | null
  #dasTimer = 0;
  #arrTimer = 0;
  #dasCharged = false;

  // Call from game loop every frame with delta time
  updateMovement(deltaMs, moveCallback) {
    if (!this.#heldDirection) return;

    this.#dasTimer += deltaMs;
    if (!this.#dasCharged) {
      if (this.#dasTimer >= this.#das) {
        this.#dasCharged = true;
        this.#arrTimer = 0;
        moveCallback(this.#heldDirection === 'left' ? -1 : 1);
      }
    } else {
      this.#arrTimer += deltaMs;
      if (this.#arr === 0) {
        // Instant: move to wall
        while (moveCallback(this.#heldDirection === 'left' ? -1 : 1)) {}
      } else {
        while (this.#arrTimer >= this.#arr) {
          this.#arrTimer -= this.#arr;
          moveCallback(this.#heldDirection === 'left' ? -1 : 1);
        }
      }
    }
  }

  // On keydown for left/right: set #heldDirection, fire first move immediately
  // On keyup: clear #heldDirection, reset timers
}
```

**Configurable values** (expose in settings):
| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| DAS | 133ms | 50–300ms | Delay before repeat starts |
| ARR | 10ms | 0–100ms | Interval between repeats (0 = instant) |
| SDF | 5× | 1–40× or Infinity | Soft drop speed multiplier |

### 1.2 Input Buffering

Buffer one action during lock delay or line clear animation so it fires instantly when the game resumes. Without this, inputs during animations feel "swallowed."

```javascript
// In game.js
#inputBuffer = null;

#bufferAction(action) {
  if (this.#renderer.isAnimating || this.#lockTimer !== null) {
    this.#inputBuffer = action;
  }
}

// After animation ends or new piece spawns:
#flushInputBuffer() {
  if (this.#inputBuffer) {
    this.#executeAction(this.#inputBuffer);
    this.#inputBuffer = null;
  }
}
```

### 1.3 Lock Delay Improvements

Modern Tetris uses "infinity" or "extended" lock delay:
- **15 move/rotate resets max** before force-lock (prevents infinite stalling)
- Track `#lockMoveCount` — reset to 0 on each new piece, increment on each move/rotate that resets lock timer
- Force-lock when count hits 15 regardless of timer

```javascript
#lockMoveCount = 0;
#maxLockResets = 15;

// In move/rotate handlers:
if (this.#lockTimer !== null && this.#lockMoveCount < this.#maxLockResets) {
  this.#lockStartTime = performance.now();
  this.#lockMoveCount++;
} else if (this.#lockMoveCount >= this.#maxLockResets) {
  this.#lockPiece(); // Force lock — no more resets
}
```

---

## TIER 2: Advanced Gameplay Mechanics

### 2.1 T-Spin Detection

**Algorithm**: After a T-piece locks via rotation, check the 4 diagonal corners. If 3+ corners are occupied, it's a T-spin.

```javascript
// In board.js
detectTSpin(piece, lastActionWasRotation) {
  if (piece.type !== 'T' || !lastActionWasRotation) return 'none';

  const cx = piece.x + 1; // T-piece center column
  const cy = piece.y + 1; // T-piece center row (in grid coords)

  // 4 diagonal corners around center
  const corners = [
    this.#isFilled(cx - 1, cy - 1), // top-left
    this.#isFilled(cx + 1, cy - 1), // top-right
    this.#isFilled(cx - 1, cy + 1), // bottom-left
    this.#isFilled(cx + 1, cy + 1), // bottom-right
  ];

  const filled = corners.filter(Boolean).length;
  if (filled < 3) return 'none';

  // Determine which corners are "front" based on rotation
  // Front corners are the two closest to the T's flat side
  const frontCorners = this.#getFrontCorners(piece.rotation);
  const frontFilled = frontCorners.filter(i => corners[i]).length;

  return frontFilled === 2 ? 'full' : 'mini';
}
```

**Scoring** (add to `js/scoring.js`):
| Action | Points |
|--------|--------|
| T-Spin (no lines) | 400 × level |
| T-Spin Single | 800 × level |
| T-Spin Double | 1200 × level |
| T-Spin Triple | 1600 × level |
| Mini T-Spin | 100 × level |
| Mini T-Spin Single | 200 × level |

**Visual indicator**: Flash "T-SPIN!" text on screen using `triggerFloatingText()`.

### 2.2 Back-to-Back Bonus

Consecutive "difficult" clears (Tetris or any T-Spin clear) earn a 50% bonus.

```javascript
// In scoring.js
#lastClearWasDifficult = false;
#backToBack = 0;

addLineClear(count, tSpinType = 'none') {
  const isDifficult = count === 4 || tSpinType !== 'none';

  if (isDifficult && this.#lastClearWasDifficult) {
    this.#backToBack++;
    // Add 50% bonus
    points = Math.floor(points * 1.5);
  } else if (!isDifficult) {
    this.#backToBack = 0;
  }
  this.#lastClearWasDifficult = isDifficult;
}
```

**Display**: Show "B2B ×3" floating text when back-to-back chain is active.

### 2.3 Combo System (Scoring Integration)

The sound engine already tracks combos — now make scoring match:

```javascript
// In scoring.js
#combo = 0;

addLineClear(count, tSpinType = 'none') {
  this.#combo++;
  const comboBonus = 50 * this.#combo * this.level; // +50 per combo level
  this.score += basePoints + comboBonus;
}

onNoLineClear() {
  this.#combo = 0;
}
```

**Display**: Trigger `renderer.triggerComboText(combo, row)` — this method already exists but isn't called.

### 2.4 Perfect Clear (All Clear)

When the entire board is empty after a line clear:

```javascript
// In board.js
isPerfectClear() {
  for (let r = 0; r < this.#grid.length; r++) {
    for (let c = 0; c < COLS; c++) {
      if (this.#grid[r][c]) return false;
    }
  }
  return true;
}
```

**Scoring**: 3000 × level points. Play a special fanfare sound and trigger a full-screen celebration.

---

## TIER 3: Visual Drama & Animation

### 3.1 Level-Up Celebration

**Currently missing**. When level increases, trigger a dramatic effect:

```javascript
// In renderer.js
triggerLevelUpEffect(newLevel) {
  // 1. Golden flash overlay
  this.#flashAlpha = 0.6;
  this.#flashColor = '#ffe080';

  // 2. Radial burst particles from center
  const cx = COLS * CELL_SIZE / 2;
  const cy = ROWS * CELL_SIZE / 2;
  for (let i = 0; i < 40; i++) {
    const p = new Particle(cx, cy, '#ffe080');
    p.vx = (Math.random() - 0.5) * 12;
    p.vy = (Math.random() - 0.5) * 12;
    p.decay = 0.015;
    this.#particles.push(p);
  }

  // 3. Floating "LEVEL X" text
  this.#floatingTexts.push({
    text: `LEVEL ${newLevel}`,
    x: cx, y: cy,
    alpha: 1.5,
    color: '#ffe080',
    size: 32,
    vy: -1.5,
  });

  // 4. Mild screen shake
  this.#shakeAmount = 4;
}
```

### 3.2 Game Over Collapse Animation

Instead of just stopping, make the board visually collapse row by row:

```javascript
triggerGameOverCollapse(grid) {
  // Stagger rows from bottom to top
  for (let r = grid.length - 1; r >= 0; r--) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c]) {
        const delay = (grid.length - r) * 4; // 4 frames per row
        this.#dissolveGrid.push({
          px: c * CELL_SIZE + CELL_SIZE / 2,
          py: r * CELL_SIZE + CELL_SIZE / 2,
          color: grid[r][c],
          scale: 1,
          rotation: 0,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          alpha: 1,
          delay,
          vx: (Math.random() - 0.5) * 3,
          vy: 1 + Math.random() * 2,
          isShard: true,
        });
      }
    }
  }
}
```

### 3.3 Piece Lock Squash & Bounce

When a piece locks, briefly squash it vertically then spring back — classic "juice" technique:

```javascript
triggerLockBounce(piece) {
  this.#lockBounce = {
    cells: this.#getPieceCells(piece),
    scaleY: 0.7,     // Start squashed
    scaleX: 1.15,     // Wider during squash
    targetY: 1,
    targetX: 1,
    spring: 0.3,      // Spring coefficient
    damping: 0.85,    // Energy loss per frame
    velocityY: 0,
    velocityX: 0,
  };
}

// In #drawLockBounce(ctx):
// Apply spring physics: velocity += (target - current) * spring
// velocity *= damping, current += velocity
// Scale cell height/width accordingly
```

### 3.4 T-Spin Visual Indicator

Flash a stylized "T-SPIN!" or "MINI T-SPIN!" label when detected:

```javascript
triggerTSpinText(type, row) {
  const label = type === 'full' ? 'T-SPIN!' : 'MINI T-SPIN';
  const color = type === 'full' ? '#a000f0' : '#d080ff';
  this.#floatingTexts.push({
    text: label,
    x: COLS * CELL_SIZE / 2,
    y: row * CELL_SIZE,
    alpha: 2,        // Stays longer
    color,
    size: type === 'full' ? 28 : 20,
    vy: -1.2,
  });
}
```

### 3.5 Combo Text Enhancement

The `triggerComboText()` method exists but is never called. Wire it in `game.js#lockPiece()`:

```javascript
// After successful line clear in #lockPiece():
if (this.#scoring.combo > 1) {
  const midRow = clearedRows[Math.floor(clearedRows.length / 2)];
  this.#renderer.triggerComboText(this.#scoring.combo, midRow);
}
```

### 3.6 Row Pre-Highlight (Anticipation)

Before the destruction animation begins, briefly highlight rows as solid white for 4-6 frames. This "wind-up" makes the following explosion feel more impactful. Already implemented via `#addRowFlashes()` — ensure the alpha starts high (1.2+) and the pulse is visible.

### 3.7 Background Reactivity

Make the starfield background react to game events:

```javascript
// Speed up star twinkle during line clears
#starSpeedBoost = 1;

// In triggerLineClearEffect():
this.#starSpeedBoost = 3 + count;

// In #drawStars():
const time = this.#frameCount * 0.02 * this.#starSpeedBoost;
// Decay back to 1:
this.#starSpeedBoost += (1 - this.#starSpeedBoost) * 0.02;
```

---

## TIER 4: Sound Enhancement

### 4.1 Missing Sound Events

Add sounds for events that currently play silently:

| Event | Sound Design | Priority |
|-------|-------------|----------|
| Combo (×2, ×3, …) | Ascending pitch with each combo | High |
| Back-to-back | Emphatic power chord | High |
| T-Spin | Dramatic whoosh + chime | High |
| Perfect clear | Triumphant fanfare (2s) | Medium |
| Board almost full | Low heartbeat rumble | Medium |
| Near-miss (close to top) | Tension drone | Low |

### 4.2 Sound Preview

Play a short preview clip when the user changes sound theme:

```javascript
// In game.js, theme select handler:
themeSelect?.addEventListener('change', (e) => {
  this.#sound.init();
  this.#sound.setSoundTheme(e.target.value);
  this.#sound.playLineClear(2); // Preview the theme with a double-clear
});
```

### 4.3 Volume Slider (Not Just Mute)

Replace the mute button with a range slider, or add a slider to the theme section:

```html
<div id="volume-section">
  <h3>VOLUME</h3>
  <input type="range" id="volume-slider" class="volume-slider"
         min="0" max="100" value="60" step="5">
</div>
```

Wire to `sound.setVolume(value / 100)`.

### 4.4 Danger Zone Audio

When the stack reaches above row 4 (visible), add a subtle heartbeat or rumble that intensifies as blocks get higher. Creates tension and urgency.

```javascript
// In game.js #render():
const highestBlock = this.#board.getHighestBlock();
if (highestBlock <= 6) {
  this.#sound.playDangerPulse(6 - highestBlock); // 0-6 intensity
}
```

### 4.5 Dynamic Music Layer

Add an optional ambient pad that changes tone with level:

```javascript
playAmbientPad(level) {
  // Low sustained drone that shifts pitch with level
  // Use a detuned oscillator pair for width
  // Modulate filter cutoff based on stack height
}
```

---

## TIER 5: UI/UX Polish

### 5.1 Settings Panel

Add an expandable settings panel (slide-out or modal):

```
┌─────────────────────┐
│ ⚙ SETTINGS          │
│                      │
│ DAS:    [===●===] ms │
│ ARR:    [●========] ms│
│ Volume: [=====●==]   │
│ Theme:  [▼ Glass   ] │
│ Ghost:  [✓]          │
│ Grid:   [✓]          │
│ Shake:  [✓]          │
│                      │
│ [Reset Defaults]     │
└─────────────────────┘
```

**Implementation**: Use a `<dialog>` element or a slide-out panel. Store settings in `localStorage`.

### 5.2 High Score Persistence

```javascript
class HighScoreManager {
  #key = 'tetris-highscores';

  save(score, level, lines) {
    const scores = this.getAll();
    scores.push({ score, level, lines, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(10); // Keep top 10
    localStorage.setItem(this.#key, JSON.stringify(scores));
  }

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.#key)) || [];
    } catch { return []; }
  }

  getHighScore() {
    const scores = this.getAll();
    return scores.length > 0 ? scores[0].score : 0;
  }
}
```

**Display**: Show "HI: 12,400" above the current score. Flash "NEW HIGH SCORE!" when beaten.

### 5.3 Statistics Tracking

Track per-session and lifetime stats:
- Total lines, pieces placed, Tetrises, T-spins, combos
- Lines per minute, pieces per second
- Best combo chain, longest survival time

```javascript
class GameStats {
  piecesPlaced = 0;
  singles = 0;
  doubles = 0;
  triples = 0;
  tetrises = 0;
  tSpins = 0;
  maxCombo = 0;
  startTime = 0;
  perfectClears = 0;

  get ppm() { // Pieces per minute
    const elapsed = (Date.now() - this.startTime) / 60000;
    return elapsed > 0 ? Math.round(this.piecesPlaced / elapsed) : 0;
  }
}
```

### 5.4 On-Screen HUD Enhancements

Show real-time feedback above the board:

```
┌─────── GAME BOARD ────────┐
│  COMBO ×3       B2B ×2    │  ← floating indicators
│                            │
│     ▓▓▓▓ falling piece     │
│                            │
│  ███████████ ← full row    │
│                            │
│  ░░░ ghost position ░░░    │
│                            │
│        T-SPIN!             │  ← action labels
└────────────────────────────┘
```

### 5.5 Keyboard Shortcut Overlay

Show a semi-transparent controls overlay that fades after 5 seconds on first play, or toggles with `?` key.

### 5.6 Responsive Touch Controls

For mobile, add on-screen buttons:

```
┌────────────────────┐
│   [↺]    game    [↻] │
│  [←] [↓] board  [→] │
│       [HARD DROP]     │
│  [HOLD]    [PAUSE]    │
└────────────────────┘
```

Use `touchstart`/`touchend` events. Support swipe gestures: swipe down = hard drop, swipe left/right = move, tap = rotate.

---

## TIER 6: Advanced Visual Effects

### 6.1 Cell Rendering Upgrade — Inner Glow + Specular

Add a small specular highlight dot and a colored inner glow to each cell:

```javascript
// After the main cell gradient fill:
// Inner color glow
const glowGrad = ctx.createRadialGradient(
  px + CELL_SIZE/2, py + CELL_SIZE/2, 0,
  px + CELL_SIZE/2, py + CELL_SIZE/2, CELL_SIZE * 0.6
);
glowGrad.addColorStop(0, hexToRgba(color, 0.15));
glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = glowGrad;
ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
```

### 6.2 Board Edge Glow

Add a subtle animated glow along the board borders that intensifies during line clears:

```javascript
#drawBoardEdgeGlow(ctx, canvasW, canvasH) {
  const intensity = this.#clearAnimTimer > 0 ? 0.4 : 0.1;
  const grad = ctx.createLinearGradient(0, 0, 4, 0);
  grad.addColorStop(0, `rgba(90, 176, 255, ${intensity})`);
  grad.addColorStop(1, 'rgba(90, 176, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, canvasH);
  // Repeat for right, top, bottom edges
}
```

### 6.3 Danger Zone Visual

When stack reaches near the top, add visual urgency:
- Board border turns red/orange
- Background gradient shifts warmer
- Subtle red vignette appears
- Cells near top pulse slightly

```javascript
#drawDangerIndicator(ctx, highestRow) {
  if (highestRow > 6) return;
  const danger = 1 - highestRow / 6; // 0 to 1
  ctx.save();
  ctx.globalAlpha = danger * 0.3;
  ctx.fillStyle = '#ff2020';
  ctx.fillRect(0, 0, COLS * CELL_SIZE, highestRow * CELL_SIZE);
  ctx.restore();
}
```

### 6.4 Piece Trail Effect

Leave a brief ghostly trail behind the active piece as it moves:

```javascript
#pieceTrail = [];

// On piece move/drop:
#addTrailFrame(piece) {
  this.#pieceTrail.push({
    shape: piece.shape,
    x: piece.x, y: piece.y,
    color: piece.color,
    alpha: 0.3,
  });
  if (this.#pieceTrail.length > 4) this.#pieceTrail.shift();
}

#drawTrail(ctx) {
  for (const t of this.#pieceTrail) {
    this.#drawPiece(ctx, t.shape, t.x, t.y, t.color, t.alpha);
    t.alpha *= 0.6;
  }
  this.#pieceTrail = this.#pieceTrail.filter(t => t.alpha > 0.02);
}
```

---

## TIER 7: Performance & Quality

### 7.1 Object Pooling for Particles

Instead of creating new `Particle` objects constantly (GC pressure), pool them:

```javascript
class ParticlePool {
  #pool = [];
  #active = [];

  acquire(x, y, color) {
    const p = this.#pool.pop() || new Particle(0, 0, '');
    p.reset(x, y, color); // Re-initialize properties
    this.#active.push(p);
    return p;
  }

  release(particle) {
    this.#pool.push(particle);
  }

  update() {
    for (let i = this.#active.length - 1; i >= 0; i--) {
      this.#active[i].update();
      if (this.#active[i].life <= 0) {
        this.release(this.#active.splice(i, 1)[0]);
      }
    }
  }
}
```

### 7.2 Offscreen Canvas for Static Elements

Render the grid lines and background gradient to an offscreen canvas once, then draw it each frame with `drawImage()` — saves ~1ms per frame:

```javascript
#bgCanvas = null;

#initBackgroundCanvas() {
  this.#bgCanvas = new OffscreenCanvas(COLS * CELL_SIZE, ROWS * CELL_SIZE);
  const ctx = this.#bgCanvas.getContext('2d');
  // Draw gradient + grid lines once
  ctx.fillStyle = this.#bgGradient;
  ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
  this.#drawGrid(ctx);
}

// In drawFrame():
ctx.drawImage(this.#bgCanvas, 0, 0);
```

### 7.3 Reduce Canvas State Changes

Group draw calls by style. Instead of setting fillStyle per cell, batch cells by color:

```javascript
// Group cells by color, draw all same-color cells together
const cellsByColor = new Map();
for (let r = 0; r < grid.length; r++) {
  for (let c = 0; c < grid[r].length; c++) {
    if (grid[r][c]) {
      if (!cellsByColor.has(grid[r][c])) cellsByColor.set(grid[r][c], []);
      cellsByColor.get(grid[r][c]).push([c, r]);
    }
  }
}
// Draw each batch with one gradient setup
```

### 7.4 localStorage for Settings

Persist all user preferences:

```javascript
const DEFAULTS = Object.freeze({
  das: 133, arr: 10, sdf: 5,
  volume: 0.6, soundTheme: 'glass',
  showGhost: true, showGrid: true, screenShake: true,
});

function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('tetris-settings')) };
  } catch { return { ...DEFAULTS }; }
}

function saveSettings(settings) {
  localStorage.setItem('tetris-settings', JSON.stringify(settings));
}
```

---

## TIER 8: Player Psychology & Retention

### 8.1 Reward Escalation

Each successive line clear should feel MORE rewarding:
- **Sound**: Combo pitch increases (already done in sound.js)
- **Visual**: Particles increase, shake increases, colors intensify
- **Score**: Combo multiplier gets visually larger
- **Text**: "DOUBLE!", "TRIPLE!", "TETRIS!!!", "INSANE ×5 COMBO!"

### 8.2 Near-Miss Feedback

When the player ALMOST clears a line (only 1-2 gaps), briefly flash the incomplete row with a red tint. This shows them how close they were and motivates "one more try."

### 8.3 Flow State Maintenance

- **No interrupting pauses** — animations should not block input for more than ~200ms
- **Consistent audio feedback** — every action has a sound, no silent actions
- **Progressive difficulty** — never sudden jumps; gravity curve should be smooth
- **Recovery possibility** — even a messy board should feel recoverable (cascade gravity helps)

### 8.4 Session Milestone Rewards

Track and celebrate mini-achievements:
- "First Tetris!" — special animation on first 4-line clear
- "10 Lines!" — milestone text
- "100 Combo!" — achievement flash
- "Speed Demon" — survive 60 seconds at level 15+
- "Perfect Start" — first 10 pieces with no holes

### 8.5 Score Pop Animation

When score increases, make the score number briefly scale up and glow:

```javascript
#scorePopScale = 1;
#scorePopColor = '#fff';

onScoreIncrease(amount) {
  this.#scorePopScale = 1.3 + Math.min(amount / 1000, 0.5);
  this.#scorePopColor = amount >= 800 ? '#ffe080' : '#80c0ff';
}

// In updateStats():
// Apply scale transform to #score-value element briefly
```

---

## Implementation Priority Order

For maximum impact with minimum effort, implement in this order:

### Sprint 1 — Instant Impact (1-2 hours)
1. Wire `triggerComboText()` (already exists, just needs the call)
2. Add volume slider UI + wiring
3. Add level-up celebration effect
4. Sound preview on theme change
5. Back-to-back bonus tracking + display

### Sprint 2 — Game Feel (2-3 hours)
6. DAS/ARR system in input.js
7. Input buffering
8. Lock delay move counter (15 max resets)
9. Combo scoring multiplier integration

### Sprint 3 — Advanced Mechanics (3-4 hours)
10. T-spin detection in board.js
11. T-spin scoring in scoring.js
12. T-spin visual/sound feedback
13. Perfect clear detection + celebration

### Sprint 4 — UI/UX Polish (2-3 hours)
14. High score persistence (localStorage)
15. Settings panel (DAS/ARR/volume/toggles)
16. Statistics tracking
17. Game over collapse animation

### Sprint 5 — Deep Polish (2-3 hours)
18. Danger zone visual + audio
19. Piece trail effect
20. Background reactivity
21. Piece lock squash/bounce
22. Score pop animation
23. Touch controls

---

## File Change Map

| File | Changes Needed |
|------|---------------|
| `js/input.js` | DAS/ARR system, input buffering, touch controls |
| `js/board.js` | T-spin detection, perfect clear detection |
| `js/scoring.js` | Combo multiplier, B2B bonus, T-spin scoring, stats |
| `js/game.js` | Wire new mechanics, settings, high scores, lock delay counter |
| `js/renderer.js` | Level-up effect, game over collapse, lock bounce, danger zone, trail, combo wiring |
| `js/sound.js` | Combo sound, T-spin sound, perfect clear fanfare, danger pulse, volume slider wiring |
| `index.html` | Volume slider, settings panel, stats display, touch controls |
| `css/style.css` | Settings panel styling, volume slider, touch buttons, responsive updates |
| `js/settings.js` | NEW — localStorage persistence, defaults, UI binding |
| `js/stats.js` | NEW — Statistics tracking, high scores, achievements |

## Procedure

1. **Read this skill file** to understand the full scope
2. **Pick the sprint** that matches the user's request priority
3. **Read the relevant source files** before making changes
4. **Implement changes** following existing code patterns (private fields, ES modules, canvas rendering)
5. **Test in browser** — open DevTools console for errors
6. **Verify cross-browser** — test in Chrome + Safari minimum
7. **Check performance** — monitor FPS in DevTools Performance tab during line clears
