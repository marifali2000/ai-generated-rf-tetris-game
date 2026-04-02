---
description: "Use when writing or editing JavaScript files for a browser-based canvas game. Covers vanilla JS patterns, ES module usage, and browser-compatible code."
applyTo: "**/*.js"
---
# JavaScript Conventions

## Module & Language
- Use ES modules with `import`/`export` — no CommonJS
- Use `const` and `let`, never `var`
- Use `class` with private fields (`#field`) for encapsulation
- Use `Object.freeze()` for constant data (piece definitions, config tables, color maps)
- Use arrow functions for callbacks
- Use template literals for string construction

## Architecture
- Game loop must use `requestAnimationFrame`, never `setInterval`
- Separate rendering from logic — no DOM manipulation outside the renderer module
- All coordinates use `{x, y}` objects where x=column, y=row (0,0 is top-left)
- Game element shape/rotation data is stored as 2D arrays of 0s and 1s
- Encapsulate all game state in classes or modules — avoid global variables

## Input & Security
- Handle keyboard events with `event.code` (not `event.keyCode`)
- Sanitize any text rendered to canvas using `CanvasRenderingContext2D` methods only (no `innerHTML`)
- Use feature detection (not user-agent sniffing) for browser compatibility

## Code Quality
- No file should exceed 1000 lines — split into modules
- No function should exceed 50 lines — break into smaller helpers
- Use descriptive variable and function names
- Comment complex logic (collision detection, rotation systems, animation math)
- Consistent indentation: 2 spaces
