# Tetris Game

A fully-featured, browser-based Tetris game with dramatic sound effects, eye-catching animations, and mobile touch controls — built entirely with **AI pair programming** using GitHub Copilot in just a couple of hours.

## Play Now

[**Play the game live**](https://marifali2000.github.io/ai-generated-rf-tetris-game/)

## What Is This?

A modern Tetris clone that runs directly in your browser with zero dependencies — pure HTML5, CSS3, and vanilla JavaScript. No frameworks, no build tools, no npm install. Just open and play.

### Features

- **Classic Tetris gameplay** — 10×20 grid, 7 standard tetrominoes (I, O, T, S, Z, J, L)
- **Super Rotation System (SRS)** with wall kicks for competitive-quality rotation
- **7-bag randomizer** for fair piece distribution
- **Ghost piece** showing where the piece will land
- **Hold piece** — swap the current piece once per drop
- **Next piece preview** — see the next 3 coming pieces
- **DAS/ARR** (Delayed Auto Shift / Auto Repeat Rate) for competitive movement speed
- **T-spin detection** with bonus scoring
- **Back-to-back bonus** for consecutive difficult clears
- **Combo system** with escalating rewards
- **Progressive difficulty** — gravity increases every 10 lines

### Sound Design

All sounds are generated procedurally using the **Web Audio API** — no audio files needed:

- 5 selectable sound themes: Glass Shatter, Concrete Break, Crystal Chime, Metal Clang, Ice Crack
- Dramatic line clear effects with shattering/breaking sounds
- Impact thuds on hard drop, crystalline clicks on rotation
- Escalating drama for Tetris (4-line) clears
- Adjustable volume control

### Visual Effects

- Multi-phase line clear animations: flash → crack → sweep → dissolve → shockwave → particles
- Screen shake on hard drops and line clears
- Floating combo text and score popups
- Danger zone pulsing when the stack gets high
- Game over collapse cascade
- Level-up celebration effects

### Mobile Support

- Fully responsive layout that adapts to any screen size
- Touch controls with hold-to-repeat for movement buttons
- Mobile-optimized stats bar
- Pinch-to-zoom disabled for uninterrupted gameplay

### Demo Mode

Hit the **DEMO** button (or press `D`) to watch the AI autoplay — it evaluates all possible placements and picks the best move using a weighted heuristic.

## How It Was Built

This entire game was built in a **couple of hours** using **GitHub Copilot** with custom skills and instructions:

1. **Scaffolded** the project structure with a prompt file that defined the full Tetris specification
2. **Generated** all game logic (board, pieces, SRS rotation, collision, scoring) through AI-assisted coding
3. **Designed** procedural sound effects using a dedicated sound design skill with Web Audio API recipes
4. **Created** dramatic animations using an eye-catching animations skill with particle systems and multi-phase effects
5. **Polished** the UI/UX with a visual enhancement skill covering colors, layout, and responsive design
6. **Added** mobile touch controls and responsive CSS for phone/tablet play

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Rendering | HTML5 Canvas |
| Audio | Web Audio API (procedural) |
| Styling | CSS3 (no preprocessor) |
| Logic | Vanilla JavaScript (ES modules) |
| Hosting | GitHub Pages |
| Build step | None — open `index.html` and play |

### Project Structure

```
index.html          — Entry point, canvas, UI layout
css/style.css       — Styling, responsive layout, dark theme
js/game.js          — Main game loop, state management
js/board.js         — Grid, collision detection, line clearing
js/piece.js         — Tetromino definitions, SRS rotation
js/input.js         — Keyboard + touch input handling
js/sound.js         — Web Audio API sound engine (5 themes)
js/renderer.js      — Canvas drawing, animations, particles
js/scoring.js       — Score, level, combo, T-spin tracking
js/autoplay.js      — AI demo player
```

## Controls

### Keyboard
| Key | Action |
|-----|--------|
| ← → | Move left/right |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ or X | Rotate clockwise |
| Z or Ctrl | Rotate counter-clockwise |
| C or Shift | Hold piece |
| Enter | Start game |
| P | Pause |
| M | Mute |
| D | Demo mode |

### Mobile
Tap the on-screen buttons: **◀ ▼ ▶** for movement, **↻** to rotate, **HOLD** to hold, **DROP** for hard drop.

## Run Locally

No build step required:

```bash
# Option 1: Python
python3 -m http.server 8080

# Option 2: Node
npx serve .

# Then open http://localhost:8080
```

## License

Personal project — built for fun with AI.
