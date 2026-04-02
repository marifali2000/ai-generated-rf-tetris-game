---
description: "Use when working on canvas rendering, drawing, animations, particle effects, or the Renderer class in a browser-based canvas game."
applyTo: "js/renderer.js"
---
# Canvas Rendering Guidelines

## Grid & Layout
- Use a fixed cell size (e.g., 24–30px) and scale canvas to grid dimensions (columns × rows × cell size)
- Draw the board background with a dark theme and subtle grid lines for readability
- Support responsive sizing: listen to `window.resize` and scale canvas via CSS `transform`
- Clear and redraw entire canvas each frame (simpler than dirty-rect tracking for game-scale rendering)
- Use a separate offscreen canvas for static elements if performance requires it

## Visual Polish
- Game elements (pieces, tiles, icons) should have gradient or bevel effects for a 3D appearance
- Preview or ghost elements: draw with reduced opacity (e.g., 30%) using `globalAlpha`
- Use `shadowBlur` and `shadowColor` for glow effects on active or highlighted elements
- Derive highlight/shadow colors from base element colors for consistent visual language

## Animations & Effects
- Event animations (e.g., row clears, matches, explosions): flash white/bright, then spawn particles
- Cap particle count (200–300 max) to maintain 60fps
- Use `requestAnimationFrame` for all animation loops — never `setInterval`
- Prefer simple math (alpha decay, linear interpolation) over per-pixel operations
- Screen shake: random `ctx.translate()` with exponential decay per frame

## Rendering Pipeline (recommended draw order)
1. Background gradient / fill
2. Grid lines
3. Locked/placed board elements
4. Preview/ghost elements (reduced opacity)
5. Active/falling game element (with glow)
6. Flash overlays and shockwaves
7. Particles and floating text

## HUD & Side Panels
- Draw score, level, stats, and preview panels using canvas or DOM elements
- Use DOM for text-heavy HUD elements (scores, labels); canvas for visual previews
- Use `font-variant-numeric: tabular-nums` for score displays that don't shift layout
