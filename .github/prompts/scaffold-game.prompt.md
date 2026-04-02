---
description: "Scaffold the core game files with board, game elements, game loop, and input handling"
agent: "agent"
---
Create the core game implementation following the project's copilot-instructions.md specifications.

Generate all the required files:
1. `index.html` — HTML5 page with canvas element, score display, preview panel, hold display
2. `css/style.css` — Dark-themed responsive layout with centered game board
3. `js/game.js` — Main game class with state management and requestAnimationFrame loop
4. `js/board.js` — Configurable grid (e.g., 10×20), collision detection, row/match clearing logic
5. `js/piece.js` — Game element definitions with transformation/rotation data and wall kick tables
6. `js/input.js` — Keyboard handler (arrow keys, space=action, C=hold, P=pause, M=mute)
7. `js/renderer.js` — Canvas rendering with ghost/preview elements, grid lines, beveled cells
8. `js/scoring.js` — Score calculation, level progression, statistics tracking

Follow the game specification from copilot-instructions.md. Use fair randomization, lock delay, ghost/preview elements, hold mechanics, and preview queue. The game must work by opening index.html directly in any browser with no build step.
