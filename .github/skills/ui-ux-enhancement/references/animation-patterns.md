# Animation & Effect Patterns

## Rendering Pipeline (z-order)

The `drawFrame()` method in `js/renderer.js` draws in this strict order:

1. **Background fill** — Solid or gradient canvas fill
2. **Grid lines** — Subtle cell dividers
3. **Locked/placed board cells** — Previously placed elements
4. **Ghost/preview element** — Drop/placement preview (30% alpha or dashed outline)
5. **Active element** — Currently active game element
6. **Flash overlay** — White flash on clear events (decays per frame)
7. **Particles** — Scatter effects from cleared rows/matches

New effects must be inserted at the correct position in this pipeline.

## Particle System

Current implementation in `Renderer`:

```
Particle {
  x, y        — position (pixels)
  vx, vy      — velocity (px/frame)
  life         — 1.0 → 0.0 (alpha)
  decay        — life reduction per frame (0.02–0.04)
  size         — square side length (2–6 px)
  gravity      — 0.15 px/frame² added to vy
}
```

### Recommendations
- **Cap particles**: Limit to ~200 active particles to maintain 60fps
- **Color variety**: Pass cleared row cell colors for per-cell particle coloring
- **Spawn shapes**: Emit from cell center outward with randomized velocity
- **Fade**: Use `globalAlpha = particle.life` for natural fade-out

## Screen Shake

```
shakeAmount = 3 + clearedLines * 2    (px, higher = more intense)
decay = 0.9                           (multiplied per frame)
```

Apply as `ctx.translate(randomX, randomY)` before drawing. Higher decay values = longer shake.

### Enhancements
- Scale shake with game events: Max clear (4+ rows) = strongest, single = subtle
- Hard drop/slam shake: Brief, directional (mostly vertical)
- Game over: Long rumble with slow decay (0.95)

## Common Animation Techniques

### Ease-Out (decelerating)
```javascript
value += (target - value) * 0.15;  // Smooth approach, never overshoots
```

### Pulse / Breathe
```javascript
const pulse = 0.8 + 0.2 * Math.sin(timestamp * 0.005);
ctx.globalAlpha = pulse;
```

### Color Flash on Event
```javascript
#flashAlpha = 0;
triggerFlash(intensity) { this.#flashAlpha = intensity; }
// In drawFrame:
if (this.#flashAlpha > 0.01) {
  ctx.globalAlpha = this.#flashAlpha;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  this.#flashAlpha *= 0.85;
}
```

### Spin/Scale on Lock
Briefly scale the element to 1.05x then back to 1.0x when it locks:
```javascript
ctx.save();
ctx.translate(centerX, centerY);
ctx.scale(scale, scale);
ctx.translate(-centerX, -centerY);
// draw piece
ctx.restore();
```

## Overlay Transitions

Current overlays use instant show/hide via CSS class toggle. Enhance with:

### Fade In/Out
```css
#overlay {
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
}
#overlay.visible {
  opacity: 1;
  pointer-events: auto;
}
```

### Text Entrance
```css
#overlay-text {
  transform: scale(0.8);
  transition: transform 0.3s ease, opacity 0.3s ease;
}
#overlay.visible #overlay-text {
  transform: scale(1);
}
```
