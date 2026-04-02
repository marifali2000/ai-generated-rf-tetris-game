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
- **Scoring**: Single=10, Double=30, Triple=70, Tetris=150 (multiplied by level)
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
- No file should be more than 1000 lines — split into modules as needed
- No functions longer than 50 lines — break into smaller helper functions
- Use descriptive variable and function names
- Comment complex logic, especially for rotation and collision detection
- Use consistent indentation (2 spaces) and spacing
- Use template literals for string concatenation
- Avoid global variables — encapsulate in modules or classes
- Use feature detection for Web Audio API, with graceful fallback if unavailable (game should still work silently)
- Ensure all code runs without transpilation in modern browsers supporting ES2020+ features
- 

## Build and Test
- No build step — open `index.html` directly in browser
- Test by opening in multiple browsers
- Use browser DevTools console for debugging

## Browser Compatibility
- Must work without transpilation in browsers supporting ES2020+
- Use feature detection, not user-agent sniffing
- Provide graceful fallback if Web Audio API is unavailable (game works silently)

## Pushing the code
- Write clear commit messages describing the changes
- After every push, make a tag with the version number (e.g., `v1.0.0`) and push tags to GitHub
- Update the README.md with any new features or changes to the project structure or controls    
- Ensure the project is deployed to GitHub Pages and the link is included in the README.md
