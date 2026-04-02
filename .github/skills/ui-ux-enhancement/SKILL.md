---
name: ui-ux-enhancement
description: "Enhance browser canvas game visual design and user experience. Use for: UI polish, color themes, gradients, glow effects, cell rendering, animations, transitions, particle effects, screen shake, responsive layout, typography, overlay styling, dark theme, canvas visual effects, HUD design, score display, preview panel styling, ghost/shadow element appearance, background design."
---

# UI/UX Enhancement Skill

## When to Use
- Improving visual appearance of the game board, cells, or background
- Adding or refining animations (clear events, drops, level up, game over)
- Enhancing particle effects or screen shake
- Redesigning the HUD (score, level, stats, hold, preview panels)
- Adjusting color schemes, gradients, or glow effects
- Improving responsive layout or mobile presentation
- Polishing overlay screens (start, pause, game over)
- Adding visual feedback for player actions (rotation, lock, drop)

## Architecture Overview

| File | UI/UX Role |
|------|-----------|
| `js/renderer.js` | All canvas drawing — board, elements, ghost, particles, grid, preview panels |
| `css/style.css` | Page layout, panel styling, typography, overlay, responsive breakpoints |
| `index.html` | Canvas elements, DOM structure, overlay, stat display elements |
| `js/game.js` | Triggers visual effects (calls renderer methods on game events) |

### Visual Stack
- **Cell rendering**: Flat color fill with light/shadow bevel (3px highlights)
- **Background**: Dark theme (e.g., `#0d1b2a` dark navy) with subtle grid lines
- **Ghost/preview**: 30% opacity of element color or dashed outline
- **Particles**: Square particles with random velocity, gravity, and life decay
- **Screen shake**: Random translation with exponential decay (`0.9` factor)
- **Flash**: White/tinted overlay with alpha decay on clear events
- **Overlays**: CSS `rgba(0,0,0,0.75)` backdrop with centered text

## Design Principles

1. **Canvas for gameplay, DOM for HUD** — Draw the board, elements, and effects on `<canvas>`. Use DOM elements for score/level/stats text and overlays.
2. **No external assets** — All visuals must be procedural (canvas gradients, shapes, colors). No image files, no icon fonts, no CDN.
3. **60fps budget** — Visual enhancements must not cause frame drops. Prefer simple math over complex per-pixel operations. Cap particle count.
4. **Consistent color language** — Element colors are defined in `js/piece.js`. Derive glow/shadow colors from these base colors.
5. **Dark theme** — Background uses a dark palette. Grid lines, borders, and panel backgrounds should stay in the same color family.

## Color Palette

### Example Dark Theme Colors
| Element | Color | Usage |
|---------|-------|-------|
| Board background | `#0d1b2a` | Main game canvas fill |
| Grid lines | `#1b3a5c` | Cell dividers |
| Canvas border | `#1b3a5c` | Game canvas CSS border |
| Panel background | `#0f2136` | Side panel canvas fill |
| Page background | `#0a0a0a` | Body CSS |
| Text primary | `#fff` | Score values, overlay text |
| Text secondary | `#888` | Panel headings |
| Text muted | `#555` | Controls info bar |

### Element Colors
See [element color reference](./references/piece-colors.md) for full color-to-element mapping and derived highlight/shadow values.

## Recipes

### Gradient Cell Rendering
Replace flat `fillRect` with a linear gradient for a polished 3D look:
```javascript
const grad = ctx.createLinearGradient(px, py, px, py + CELL_SIZE);
grad.addColorStop(0, lightenColor(color, 30));
grad.addColorStop(1, darkenColor(color, 30));
ctx.fillStyle = grad;
ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
```

### Glow Effect on Active Element
Add a subtle colored shadow behind the active game element:
```javascript
ctx.shadowColor = color;
ctx.shadowBlur = 12;
// draw piece cells
ctx.shadowBlur = 0;
```

### Animated Score Counter
Smoothly tween the displayed score instead of instant updates:
```javascript
#displayScore = 0;
#updateStats(score, level, lines) {
  this.#displayScore += (score - this.#displayScore) * 0.15;
  this.#scoreEl.textContent = Math.round(this.#displayScore);
  // ...
}
```

### Line/Row Clear Flash
Before particles spawn, briefly highlight the cleared row in white:
```javascript
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
ctx.fillRect(0, row * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
```

### Background Gradient
Replace the flat background with a vertical gradient for depth:
```javascript
const bgGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
bgGrad.addColorStop(0, '#0d1b2a');
bgGrad.addColorStop(1, '#1a0a2e');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, canvasW, canvasH);
```

### Ghost/Preview Element — Dashed Outline
Instead of a translucent fill, draw a dashed outline for the ghost/preview:
```javascript
ctx.setLineDash([4, 3]);
ctx.strokeStyle = color;
ctx.globalAlpha = 0.5;
ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
ctx.setLineDash([]);
```

## Procedure

1. **Identify the target** — Which visual element needs improvement? Board, cells, HUD, overlays, animations, or layout?
2. **Read the current code** — Check `js/renderer.js` for canvas rendering, `css/style.css` for layout/styling, `index.html` for DOM structure.
3. **Apply changes in the right layer** — Canvas effects go in `renderer.js`, layout/typography in `style.css`, structure in `index.html`.
4. **Preserve the rendering pipeline** — The `drawFrame()` method draws in a specific order: background → grid → locked elements → ghost → active element → flash overlay → particles. Insert new effects at the appropriate z-order.
5. **Test visual impact** — Open the game in browser. Check that effects render at 60fps, don't obscure gameplay, and work at the configured grid size.
6. **Check responsive scaling** — Verify CSS media queries work. Common approach: `transform: scale(0.75)` on small screens.
