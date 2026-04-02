---
description: "Scaffold the core Tetris game files with board, pieces, game loop, and input handling"
agent: "agent"
---
Create the core Tetris game implementation following the project's copilot-instructions.md specifications.

Generate all the required files:
1. `index.html` — HTML5 page with canvas element, score display, next piece preview, hold piece display
2. `css/style.css` — Dark-themed responsive layout with centered game board
3. `js/game.js` — Main game class with state management and requestAnimationFrame loop
4. `js/board.js` — 10×20 grid, collision detection, line clearing logic
5. `js/piece.js` — All 7 tetrominoes with SRS rotation data and wall kick tables
6. `js/input.js` — Keyboard handler (arrow keys, space=hard drop, C=hold, P=pause, M=mute)
7. `js/renderer.js` — Canvas rendering with ghost piece, grid lines, beveled blocks
8. `js/scoring.js` — Score calculation, level progression, lines counting

Follow the Tetris Guideline spec: 7-bag randomizer, SRS rotation, lock delay, ghost piece, hold piece, next preview. The game must work by opening index.html directly in any browser with no build step.
