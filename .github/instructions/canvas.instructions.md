---
description: "Use when working on canvas rendering, drawing, animations, particle effects, or the Renderer class."
applyTo: "js/renderer.js"
---
# Canvas Rendering Guidelines

- Use a fixed cell size (e.g., 30px) and scale canvas to grid dimensions
- Draw the board background as a dark grid with subtle lines
- Each piece color should have a gradient or bevel effect for 3D appearance
- Ghost piece: draw with 30% opacity using `globalAlpha`
- Line clear animation: flash white, then particles scatter downward (breaking effect)
- Use a separate offscreen canvas for static board elements if performance requires it
- Clear and redraw entire canvas each frame (simpler than dirty-rect tracking)
- Support responsive sizing: listen to `window.resize` and scale canvas via CSS `transform`
- Draw score, level, next pieces, and hold piece in side panels using canvas or DOM elements
