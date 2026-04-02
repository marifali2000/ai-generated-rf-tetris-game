# Browser-Based Canvas Game — Project Guidelines

## Overview
Browser-based game built with HTML5 Canvas, CSS3, and vanilla JavaScript. Must work in all modern browsers (Chrome, Firefox, Safari, Edge) with zero dependencies. Uses Web Audio API for procedural sound effects — no external audio files needed.

## Architecture
- **Single-page app**: One `index.html` with embedded or linked CSS/JS
- **Canvas rendering**: Use `<canvas>` element for the game board (configurable grid: e.g., 10 columns × 20 rows)
- **Web Audio API**: Generate sound effects procedurally using oscillators and noise buffers
- **Module pattern**: Use ES modules (`type="module"`) for code organization

### File Structure
Recommended modular file structure. Each file should have a clear responsibility. The main goal is to ensure that the overall structure is easy to navigate. No file should be more than 1000 lines, and no function should be longer than 50 lines — break into smaller helper functions as needed. Follow SOLID principles where applicable, and ensure that the code is modular and reusable. SOLID principles include:
- Single Responsibility Principle: Each class or module should have one responsibility or reason to change.
- Open/Closed Principle: Software entities (classes, modules, functions) should be open for extension but closed for modification.
- Liskov Substitution Principle: Objects of a superclass should be replaceable with objects of a subclass without affecting the correctness of the program.
- Interface Segregation Principle: Clients should not be forced to depend on interfaces they do not use.
- Dependency Inversion Principle: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- All the behavior of the game should be encapsulated within these modules, and they should interact with each other through well-defined interfaces. This will help ensure that the code is maintainable, testable, and scalable as the project evolves.
```
index.html          — Entry point, canvas element, minimal UI
css/style.css       — Game styling, responsive layout, dark theme
js/game.js          — Main game loop, state management, event orchestration
js/board.js         — Board/grid data structure, collision detection, row/match clearing
js/piece.js         — Game element definitions, shapes, rotation systems
js/input.js         — Keyboard (and optional touch) input handling
js/sound.js         — Web Audio API sound effects engine, theme support
js/renderer.js      — Canvas drawing, animations, particle effects, visual feedback
js/scoring.js       — Score calculation, level progression, statistics tracking
```
Feel free to add more modules as needed (e.g., `js/autoplay.js` for AI/demo mode, `js/particles.js` for complex particle systems, `js/sounds/` directory for multiple sound themes).

## Game Design Template
Adapt these parameters to your specific game:
- **Grid**: Configurable width × height (e.g., 10×20 for Tetris, 8×8 for match-3, custom for puzzle games)
- **Game elements**: Define shapes, colors, and behaviors for your game pieces/tiles
- **Rotation/Transformation**: Implement appropriate transformation systems (e.g., SRS wall kicks for falling-block games, match detection for puzzle games)
- **Randomizer**: Use fair randomization (e.g., bag system, weighted random) to ensure balanced gameplay
- **Gravity/Physics**: Configure speed progression tied to level/difficulty
- **Lock/Placement delay**: Add a brief delay before committing placement (allows last-second adjustments)
- **Scoring**: Define clear, escalating point values that reward skill (bigger combos = higher multipliers)
- **Levels**: Advance based on score, lines, time, or other game-specific metrics
- **Preview**: Show upcoming elements so players can plan ahead
- **Ghost/Shadow**: Show where elements will land or what will happen next

## Sound Design — Procedural Audio Theme
All sounds use Web Audio API oscillators and noise buffers:
- **Row/match clear**: Shattering/breaking sound with descending frequency sweep
- **Hard drop/slam**: Impact thud with crumble aftermath
- **Element placement**: Short crack/snap/click sound
- **Big clear (multi-row/combo)**: Extended shatter with reverb, louder and more dramatic
- **Rotation/action**: Quick crystalline click
- **Game over**: Slow crumbling/collapse cascade
- **Level up**: Ascending chime then crack
- **Combo chains**: Escalating pitch with each consecutive clear
- Support multiple sound themes for variety (glass, metal, crystal, concrete, ice, etc.)

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
- Comment complex logic, especially for collision detection, rotation, and animation timing
- Use consistent indentation (2 spaces) and spacing
- Use template literals for string concatenation
- Avoid global variables — encapsulate in modules or classes
- Use feature detection for Web Audio API, with graceful fallback if unavailable (game should still work silently)
- Ensure all code runs without transpilation in modern browsers supporting ES2020+ features

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
