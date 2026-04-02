# Tetris Game — Project Guidelines

## Overview
Browser-based Tetris game with breaking/shattering sound effects. Must work in all modern browsers (Chrome, Firefox, Safari, Edge) with zero dependencies — pure HTML5, CSS3, and vanilla JavaScript only.

## Architecture
- **Single-page app**: One `index.html` with embedded or linked CSS/JS
- **Canvas rendering**: Use `<canvas>` element for the game board (10 columns × 20 rows)
- **Web Audio API**: Generate sound effects procedurally — no external audio files needed
- **Module pattern**: Use ES modules (`type="module"`) for code organization

### File Structure
```
index.html          — Entry point, canvas element, minimal UI
css/style.css       — Game styling, responsive layout, dark theme
js/game.js          — Main game loop, state management
js/board.js         — Board grid, collision detection, line clearing
js/piece.js         — Tetromino definitions, rotation (SRS)
js/input.js         — Keyboard input handling
js/sound.js         — Web Audio API sound effects (breaking, drop, rotate, clear)
js/renderer.js      — Canvas drawing, animations, particle effects
js/scoring.js       — Score, level, lines tracking
```

## Tetris Specification (Guideline-compliant)
- **Grid**: 10 wide × 20 tall (plus 2 hidden rows above)
- **Pieces**: I, O, T, S, Z, J, L with standard colors (cyan, yellow, purple, green, red, blue, orange)
- **Rotation**: Super Rotation System (SRS) with wall kicks
- **Randomizer**: 7-bag random generator (one of each piece per bag)
- **Gravity**: Pieces fall faster as level increases
- **Lock delay**: 0.5 seconds after landing before piece locks
- **Scoring**: Single=100, Double=300, Triple=500, Tetris=800 (multiplied by level)
- **Levels**: Advance every 10 lines cleared
- **Hold piece**: Player can hold one piece (swap once per drop)
- **Next piece preview**: Show next 3 pieces
- **Ghost piece**: Show where piece will land (translucent)

## Sound Design — "Breaking Off" Theme
All sounds use Web Audio API oscillators and noise buffers:
- **Line clear**: Glass shattering / cracking sound with descending frequency sweep
- **Hard drop**: Impact thud with crumble aftermath
- **Piece lock**: Short crack/snap sound
- **Tetris (4 lines)**: Extended shatter with reverb, louder and more dramatic
- **Rotation**: Quick crystalline click
- **Game over**: Slow crumbling/collapse cascade
- **Level up**: Ascending chime then crack

## Code Style
- Use `const` and `let`, never `var`
- Use arrow functions for callbacks
- Use `requestAnimationFrame` for the game loop
- All game state in a single state object (immutable updates where practical)
- No external libraries, frameworks, or CDN dependencies
- Prefer `class` syntax for game entities (Board, Piece, Renderer, SoundEngine)

## Build and Test
- No build step — open `index.html` directly in browser
- Test by opening in multiple browsers
- Use browser DevTools console for debugging

## Browser Compatibility
- Must work without transpilation in browsers supporting ES2020+
- Use feature detection, not user-agent sniffing
- Provide graceful fallback if Web Audio API is unavailable (game works silently)
