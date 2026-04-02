---
name: eye-catching-animations
description: "Create dramatic, eye-catching game animations in canvas. Use for: line clear animations, row sweep effects, dissolve effects, shockwave, explosion particles, screen shake, hard drop impact, lock flash, level up celebration, game over collapse, cascade chain animations, combo visuals, visual drama, slow-motion effect, freeze frames, row highlight before clear, staggered cell removal, piece lock bounce."
---

# Eye-Catching Animations Skill

## When to Use
- Making line clears more dramatic and visible
- Adding impact animations for hard drop or piece lock
- Creating celebration effects for Tetris (4-line), combos, or level ups
- Adding staggered / sequenced animation timing for visual drama
- Implementing dissolve, sweep, shockwave, or explosion effects
- Adding freeze-frames or slow-motion pauses for big moments
- Enhancing cascade chain visuals (Block Blast gravity clears)
- Polishing game over collapse animation

## Architecture

| File | Animation Role |
|------|---------------|
| `js/renderer.js` | All canvas effects — particles, flashes, row highlights, shockwaves, cell dissolve |
| `js/game.js` | Triggers effects via `this.#renderer.triggerLineClearEffect()` and similar methods |
| `js/sound.js` | Audio must sync with visual beats (called alongside renderer triggers in game.js) |

### Current Animation System
| Effect | Trigger | Current Implementation |
|--------|---------|----------------------|
| Line clear | `triggerLineClearEffect()` | Particles from each cell + screen shake + blue-tinted flash |
| Screen shake | Part of line clear | Random translate, decays at 0.9× per frame |
| Flash overlay | Part of line clear | Blue-tinted `#c8d8ff`, alpha decays at 0.8× per frame |
| Particles | Part of line clear | Round particles, gravity, life decay, MAX 250 |
| Active piece glow | Every frame | `shadowBlur = 18` on active piece |
| Ghost piece | Every frame | Dashed outline + faint fill |
| Stars | Every frame | 60 twinkling background stars |
| Score tween | Every frame | Smooth ease-out toward target value |

### Rendering Pipeline (draw order)
```
1. Background gradient
2. Twinkling stars
3. Vignette overlay
4. Grid lines
5. Locked board cells       ← row highlight/dissolve effects go HERE
6. Ghost piece
7. Active piece (with glow)
8. Flash overlay            ← shockwave rings go HERE
9. Particles                ← explosion particles go HERE
```

## Design Principles

1. **Visibility** — The player must SEE what happened. A cleared line should be visually obvious even in peripheral vision. Use bright flashes, expanding effects, and high contrast.
2. **Timing & anticipation** — Don't just delete rows instantly. Show: highlight → pause briefly → dissolve/sweep → particles. This "wind-up → hit" pattern makes effects feel impactful.
3. **Escalation** — Single line = subtle. Double = bigger. Triple = dramatic. Tetris = spectacular. Every effect should scale with the magnitude of the event.
4. **Screen-space impact** — Big events should affect the WHOLE screen (shockwaves, full-screen flash, heavy shake), not just the cleared row. This makes them feel important.
5. **Performance budget** — Cap particles at 250–300. Use simple math (no per-pixel operations). Prefer `globalAlpha` fades over filter effects. Keep effects under 60 frames duration.
6. **Rhythm** — Stagger effects over 3–8 frames rather than triggering all at once. This creates a visual "beat" that feels satisfying.

## Line Clear — The Core Animation

The most important animation in the game. Must be dramatic, visible, and feel rewarding.

### Recipe: Dramatic Line Clear (Full Implementation)

This replaces the basic particle+flash with a multi-phase animation:

**Phase 1 — Highlight (frames 0–8):** Cleared rows glow bright white, cells pulse  
**Phase 2 — Sweep (frames 8–20):** A bright horizontal beam sweeps across each row  
**Phase 3 — Dissolve (frames 12–30):** Individual cells shrink, rotate, and fade out  
**Phase 4 — Shockwave (frames 4–25):** Expanding ring radiates outward from center  
**Phase 5 — Particles (frames 8+):** Explosion particles burst from cell positions  

See [Line Clear Effects Reference](./references/line-clear-effects.md) for complete drop-in code.

### Quick Upgrade: Row Flash Before Clear

Add a bright flash on cleared rows BEFORE they vanish. Insert in `drawFrame()` after drawing the board:

```javascript
// After #drawBoard(ctx, state.visibleGrid)
if (this.#rowFlashData.length > 0) {
  for (const rf of this.#rowFlashData) {
    ctx.globalAlpha = rf.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, rf.row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    // Glow halo
    ctx.shadowColor = '#80c0ff';
    ctx.shadowBlur = 20 * rf.alpha;
    ctx.fillRect(0, rf.row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    ctx.shadowBlur = 0;
    rf.alpha -= 0.06;
  }
  this.#rowFlashData = this.#rowFlashData.filter(rf => rf.alpha > 0);
  ctx.globalAlpha = 1;
}
```

### Quick Upgrade: Shockwave Ring

An expanding translucent ring that radiates outward from the cleared area:

```javascript
// Shockwave state
#shockwaves = [];

triggerShockwave(centerY) {
  this.#shockwaves.push({ cx: COLS * CELL_SIZE / 2, cy: centerY, radius: 10, maxRadius: 300, alpha: 0.6 });
}

// In drawFrame(), after flash overlay:
for (const sw of this.#shockwaves) {
  ctx.save();
  ctx.globalAlpha = sw.alpha;
  ctx.strokeStyle = '#80c0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(sw.cx, sw.cy, sw.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  sw.radius += 8;
  sw.alpha *= 0.92;
}
this.#shockwaves = this.#shockwaves.filter(sw => sw.alpha > 0.01);
```

## Scaling by Event Magnitude

| Event | Flash | Shake | Particles/cell | Shockwave | Extra |
|-------|-------|-------|----------------|-----------|-------|
| Single (1 line) | 0.25 α | 4px | 4–6 | 1 small | — |
| Double (2 lines) | 0.40 α | 8px | 6–8 | 1 medium | — |
| Triple (3 lines) | 0.55 α | 12px | 8–10 | 2 staggered | Screen tint |
| Tetris (4 lines) | 0.70 α | 18px | 10–14 | 2 large | Freeze frame (3f) + golden flash |
| Cascade chain | +0.10 α/wave | +4px/wave | +2/wave | 1 per wave | Pitch-shifted ring color |

## Other Game Event Animations

See [Game Event Animations Reference](./references/game-event-animations.md) for:
- **Hard drop impact** — Vertical slam lines + dust particles + directional shake
- **Piece lock pulse** — Brief scale-up to 1.08x then snap back
- **Level up celebration** — Ascending sparkle column + golden flash
- **Game over collapse** — Row-by-row top-down dissolve with falling debris
- **Combo counter** — Floating "+N COMBO" text that rises and fades
- **Cascade chain flash** — Intensifying screen tint per cascade wave

## Particle Enhancements

See [Particle Systems Reference](./references/particle-systems.md) for:
- **Spark particles** — Tiny bright dots with long trails (for sweeps)
- **Debris chunks** — Larger, slower particles with rotation (for shattering)
- **Ring burst** — Particles emitted in a circle (for shockwaves)
- **Trail particles** — Particles that leave fading afterimages
- **Confetti** — Rect particles that tumble (for celebrations)

## Procedure

1. **Identify the target event** — Which game moment needs more drama?
2. **Read current renderer code** — Check `triggerLineClearEffect()` and `drawFrame()` in `js/renderer.js`
3. **Choose effects** — Pick from recipes above. Layer multiple effects for big events.
4. **Add state fields** — New effects need tracking arrays/numbers on the `Renderer` class (e.g., `#shockwaves = []`, `#rowFlashData = []`)
5. **Trigger in game.js** — Call new renderer methods from `#lockPiece()` or other game events
6. **Insert in draw pipeline** — Add rendering at the correct z-order position (see pipeline above)
7. **Scale with magnitude** — Use the event count/type to vary intensity
8. **Test at 60fps** — Verify no frame drops with DevTools Performance panel
