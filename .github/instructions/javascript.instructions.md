---
description: "Use when writing or editing JavaScript files for the Tetris game. Covers vanilla JS patterns, ES module usage, and browser-compatible code."
applyTo: "**/*.js"
---
# JavaScript Conventions

- Use ES modules with `import`/`export` — no CommonJS
- Use `class` with private fields (`#field`) for encapsulation
- Game loop must use `requestAnimationFrame`, never `setInterval`
- All coordinates use `{x, y}` objects where x=column, y=row (0,0 is top-left)
- Piece rotation data is stored as 2D arrays of 0s and 1s
- Use `Object.freeze()` for constant data like piece definitions
- No DOM manipulation outside `renderer.js` — keep rendering separate from logic
- Handle keyboard events with `event.code` (not `event.keyCode`)
- Sanitize any text rendered to canvas using `CanvasRenderingContext2D` methods only (no `innerHTML`)
