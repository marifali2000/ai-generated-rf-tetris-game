---
name: tetris-game
description: "Build and iterate on the browser Tetris game. Use for: implementing game mechanics, SRS rotation, collision detection, scoring, level progression, 7-bag randomizer, lock delay, ghost piece, hold piece, game loop, canvas rendering, responsive layout."
---

# Tetris Game Development Skill

## When to Use
- Implementing core Tetris mechanics (board, pieces, rotation, collision)
- Working on game loop, gravity, lock delay
- Adding or fixing the scoring system
- Implementing the 7-bag randomizer
- Working on hold piece or next piece preview
- Canvas rendering of the game board

## Tetris Guideline Quick Reference

### Piece Definitions (SRS)
```
I: ....    O: ##    T: .#.    S: .##    Z: ##.    J: #..    L: ..#
   ####       ##       ###       ##.       .##       ###       ###
   ....
   ....
```

### Piece Colors
| Piece | Color   | Hex       |
|-------|---------|-----------|
| I     | Cyan    | `#00f0f0` |
| O     | Yellow  | `#f0f000` |
| T     | Purple  | `#a000f0` |
| S     | Green   | `#00f000` |
| Z     | Red     | `#f00000` |
| J     | Blue    | `#0000f0` |
| L     | Orange  | `#f0a000` |

### SRS Wall Kick Data
See [SRS wall kick reference](./references/srs-wallkicks.md) for complete wall kick offset tables.

### Scoring
| Action        | Points        |
|---------------|---------------|
| Single        | 100 × level   |
| Double        | 300 × level   |
| Triple        | 500 × level   |
| Tetris        | 800 × level   |
| Soft drop     | 1 per cell    |
| Hard drop     | 2 per cell    |
| T-Spin Single | 800 × level   |
| T-Spin Double | 1200 × level  |
| T-Spin Triple | 1600 × level  |

### Gravity (frames per drop at 60fps)
| Level | Frames | Level | Frames |
|-------|--------|-------|--------|
| 0     | 48     | 10    | 6      |
| 1     | 43     | 13    | 5      |
| 2     | 38     | 16    | 4      |
| 3     | 33     | 19    | 3      |
| 4     | 28     | 29    | 2      |
| 5     | 23     |       |        |
| 6     | 18     |       |        |
| 7     | 13     |       |        |
| 8     | 8      |       |        |
| 9     | 6      |       |        |

### Controls
| Key            | Action          |
|----------------|-----------------|
| Left/Right     | Move piece      |
| Down           | Soft drop       |
| Space          | Hard drop       |
| Up / X         | Rotate CW       |
| Z / Ctrl       | Rotate CCW      |
| C / Shift      | Hold piece      |
| P              | Pause           |
| M              | Mute            |

## Procedure
1. Start with `js/piece.js` — define all 7 tetrominoes with rotation states
2. Build `js/board.js` — grid data structure, collision checks, line clearing
3. Create `js/game.js` — game state, spawn logic, gravity timer, lock delay
4. Add `js/input.js` — keyboard mapping to game actions
5. Implement `js/renderer.js` — canvas drawing with ghost piece
6. Add `js/scoring.js` — point calculation and level tracking
7. Wire everything in `index.html` with `type="module"` imports
8. Test in Chrome, Firefox, Safari, Edge
