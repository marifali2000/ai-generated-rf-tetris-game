---
name: canvas-game
description: "Build and iterate on a browser-based canvas game. Use for: implementing game mechanics, grid systems, collision detection, scoring, level progression, randomizers, lock delay, ghost/preview elements, hold mechanics, game loop, canvas rendering, responsive layout. Examples include falling-block games (Tetris), match-3, puzzle games, and other grid-based games."
---

# Canvas Game Development Skill

## When to Use
- Implementing core game mechanics (board, elements, transformations, collision)
- Working on game loop, gravity/physics, lock/placement delay
- Adding or fixing the scoring system
- Implementing randomizers (bag system, weighted random, etc.)
- Working on hold/swap or preview mechanics
- Canvas rendering of the game board
- Building any grid-based browser game

## Game Mechanics Quick Reference

### Grid System
- Define configurable grid dimensions (width × height)
- Use a 2D array for the board state
- Add hidden rows above the visible area for spawn space
- Coordinate system: `{x, y}` where x=column, y=row, (0,0) is top-left

### Element/Piece Definitions
Define game elements with:
- Shape data as 2D arrays of 0s and 1s
- Color mappings per element type
- Rotation/transformation states (if applicable)
- Use `Object.freeze()` for immutable element data

### Example: Falling-Block Piece Definitions (SRS)
```
I: ....    O: ##    T: .#.    S: .##    Z: ##.    J: #..    L: ..#
   ####       ##       ###       ##.       .##       ###       ###
   ....
   ....
```

### Example: Piece Colors
| Piece | Color   | Hex       |
|-------|---------|-----------|
| I     | Cyan    | `#00f0f0` |
| O     | Yellow  | `#f0f000` |
| T     | Purple  | `#a000f0` |
| S     | Green   | `#00f000` |
| Z     | Red     | `#f00000` |
| J     | Blue    | `#0000f0` |
| L     | Orange  | `#f0a000` |

### Rotation & Wall Kicks
For falling-block games, implement SRS (Super Rotation System) with wall kicks.
See [SRS wall kick reference](./references/srs-wallkicks.md) for complete offset tables.
For other game types, implement appropriate transformation/matching logic.

### Scoring Template
Adapt scoring to your game type. Example for a falling-block game:

| Action        | Points        |
|---------------|---------------|
| Single        | 100 × level   |
| Double        | 300 × level   |
| Triple        | 500 × level   |
| Max clear     | 800 × level   |
| Soft drop     | 1 per cell    |
| Hard drop     | 2 per cell    |
| Special move  | 800 × level   |

### Gravity / Speed Progression
Increase difficulty over time. Example frames-per-drop at 60fps:

| Level | Frames | Level | Frames |
|-------|--------|-------|--------|
| 0     | 48     | 10    | 6      |
| 1     | 43     | 13    | 5      |
| 2     | 38     | 16    | 4      |
| 3     | 33     | 19    | 3      |
| 4     | 28     | 29    | 2      |
| 5     | 23     |       |        |

### Controls Template
| Key            | Action          |
|----------------|-----------------|
| Left/Right     | Move element    |
| Down           | Soft drop / fast |
| Space          | Hard drop / confirm |
| Up / X         | Rotate CW / action |
| Z / Ctrl       | Rotate CCW / alt action |
| C / Shift      | Hold / swap     |
| P              | Pause           |
| M              | Mute            |

## Procedure
1. Start with `js/piece.js` — define all game elements with transformation states
2. Build `js/board.js` — grid data structure, collision checks, clear/match detection
3. Create `js/game.js` — game state, spawn logic, gravity/physics timer, lock delay
4. Add `js/input.js` — keyboard mapping to game actions (+ optional touch controls)
5. Implement `js/renderer.js` — canvas drawing with ghost/preview elements
6. Add `js/scoring.js` — point calculation and level tracking
7. Wire everything in `index.html` with `type="module"` imports
8. Test in Chrome, Firefox, Safari, Edge
