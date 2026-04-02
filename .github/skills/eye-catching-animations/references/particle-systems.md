# Particle Systems — Enhanced Variants

Drop-in particle class variants and emission patterns for different visual effects.

## Base Particle (Current)

The existing `Particle` class emits round circles with gravity and life decay:

```javascript
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = -(Math.random() * 6 + 2);
    this.life = 1;
    this.decay = 0.012 + Math.random() * 0.018;
    this.size = 2 + Math.random() * 4;
    this.gravity = 0.12;
  }
}
```

All variants below extend or replace this pattern. They all share the same `update()` cycle and can be stored in the same `#particles` array — they just override `draw()`.

## Spark Particle (Line Sweeps, Fast Effects)

Tiny bright dots with speed-based stretching to create motion trails:

```javascript
class SparkParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 18;
    this.vy = (Math.random() - 0.5) * 18;
    this.life = 1;
    this.decay = 0.03 + Math.random() * 0.04;  // fast burn
    this.size = 1 + Math.random() * 1.5;
    this.gravity = 0;  // no gravity — radial motion
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.96;  // air friction
    this.vy *= 0.96;
    this.life -= this.decay;
  }

  draw(ctx) {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const trailLen = Math.min(speed * 2, 12);
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - (this.vx / speed) * trailLen, this.y - (this.vy / speed) * trailLen);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
```

**Use for:** Sweep beam trails, shockwave edge sparks, fast explosions.

## Debris Chunk (Shattering, Heavy Effects)

Larger rectangular chunks that tumble with rotation:

```javascript
class DebrisParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = -(Math.random() * 4 + 1);
    this.life = 1;
    this.decay = 0.01 + Math.random() * 0.012;  // slower
    this.width = 3 + Math.random() * 6;
    this.height = 2 + Math.random() * 4;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.25;
    this.gravity = 0.15;
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
```

**Use for:** Line clear debris, game over falling blocks, hard drop dust.

## Confetti Particle (Celebrations)

Flat rectangles that flip and flutter, with slow descent:

```javascript
class ConfettiParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color || ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6ec7'][Math.floor(Math.random() * 5)];
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = -(Math.random() * 3 + 2);
    this.life = 1;
    this.decay = 0.006 + Math.random() * 0.006;  // very slow — linger for drama
    this.width = 4 + Math.random() * 5;
    this.height = 2 + Math.random() * 3;
    this.rotation = Math.random() * Math.PI * 2;
    this.flipSpeed = 0.08 + Math.random() * 0.15;
    this.flip = Math.random() * Math.PI * 2;  // separate flip axis
    this.gravity = 0.04;  // slow fall
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.vx + Math.sin(this.wobblePhase) * 0.8;
    this.vy += this.gravity;
    this.y += this.vy;
    this.wobblePhase += 0.06;
    this.rotation += 0.02;
    this.flip += this.flipSpeed;
    this.vx *= 0.99;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    // Simulate 3D flip by scaling width with sin()
    const flipScale = Math.abs(Math.sin(this.flip));
    ctx.scale(flipScale, 1);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
```

**Use for:** Max clear celebrations, level up, high scores.

## Emission Patterns

### Radial Burst (Explosion)
Emit particles in all directions from a center point:
```javascript
function emitRadialBurst(particles, x, y, count, ParticleClass, color) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 4 + Math.random() * 8;
    const p = new ParticleClass(x, y, color);
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    if (particles.length < MAX_PARTICLES) particles.push(p);
  }
}
```

### Row Sweep (Line Clear)
Emit particles sequentially across a row for a "wipe" feel:
```javascript
function emitRowSweep(particles, row, cols, cellSize, colors, ParticleClass) {
  for (let c = 0; c < cols; c++) {
    const cx = c * cellSize + cellSize / 2;
    const cy = row * cellSize + cellSize / 2;
    const color = colors[c] || '#fff';
    // Stagger: more particles toward edges
    const edgeFactor = 1 + Math.abs(c - cols / 2) / cols;
    const count = Math.floor(3 * edgeFactor);
    for (let i = 0; i < count; i++) {
      const p = new ParticleClass(cx, cy, color);
      p.vx *= 1.5;  // wider horizontal spread
      if (particles.length < MAX_PARTICLES) particles.push(p);
    }
  }
}
```

### Ring Burst (Shockwave Edge)
Emit particles along a ring circumference:
```javascript
function emitRingBurst(particles, cx, cy, radius, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const p = new SparkParticle(x, y, color);
    p.vx = Math.cos(angle) * 3;
    p.vy = Math.sin(angle) * 3;
    if (particles.length < MAX_PARTICLES) particles.push(p);
  }
}
```

### Fountain (Upward Column)
Emit particles upward from a point, with slight spread:
```javascript
function emitFountain(particles, x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const p = new Particle(x + (Math.random() - 0.5) * 20, y, color);
    p.vx = (Math.random() - 0.5) * 3;
    p.vy = -(4 + Math.random() * 8);
    p.gravity = 0.08;
    if (particles.length < MAX_PARTICLES) particles.push(p);
  }
}
```

## Performance Notes

- **MAX_PARTICLES = 250–300** is safe for 60fps on mid-range devices
- Use `Particle` (circles) for most effects — drawing arcs is cheap
- `DebrisParticle` (rotate + translate) is more expensive — limit to 30–50 at once
- `ConfettiParticle` is expensive due to transform stack — limit to 20–30 at once
- Skip draw calls entirely when `life < 0` (filter before drawing, not after)
- Use a single pass: `filter()` then `forEach()` — not two separate iterations
