# Layout & Responsive Design Reference

## Recommended Layout Structure

```
body (flex column, centered)
├── #game-container (flex row, gap 20px)
│   ├── #left-panel (140px wide)
│   │   └── #hold-section
│   │       ├── h3 "HOLD"
│   │       └── canvas#hold-canvas (120×90)
│   ├── #center-panel (relative positioned)
│   │   ├── canvas#game-canvas (cols × rows × cellSize)
│   │   └── #overlay (absolute, inset 0)
│   │       └── #overlay-text
│   └── #right-panel (140px wide)
│       ├── #preview-section
│       │   ├── h3 "NEXT"
│       │   └── canvas#preview-canvas (120×270)
│       └── #score-section
│           ├── SCORE → #score-value
│           ├── LEVEL → #level-value
│           └── LINES → #lines-value
└── #controls-info (flex row, wrapped)
```

## Canvas Dimensions (Example)

| Canvas | Width | Height | Purpose |
|--------|-------|--------|---------|
| `#game-canvas` | 384px | 768px | Main game board (configurable cols×rows at cellSize px) |
| `#hold-canvas` | 120px | 90px | Hold/swap element preview |
| `#preview-canvas` | 120px | 270px | Next elements preview (3 × 90px slots) |

## Responsive Breakpoint

```css
@media (max-width: 600px) {
  #game-container { gap: 8px; transform: scale(0.75); }
  #left-panel, #right-panel { width: 100px; }
}
```

## Layout Enhancement Ideas

### Centered Vertical Alignment
Side panels currently use `align-items: flex-start`. To vertically center them alongside the board:
```css
#game-container { align-items: center; }
```

### Panel Styling
Add rounded corners and subtle background to info panels:
```css
#hold-section, #next-section, #score-section {
  background: rgba(13, 27, 42, 0.8);
  border: 1px solid #1b3a5c;
  border-radius: 8px;
  padding: 12px;
}
```

### Score Typography
Use a monospaced or tabular-nums font for scores that don't shift layout:
```css
#score-value, #level-value, #lines-value {
  font-variant-numeric: tabular-nums;
  font-family: 'Courier New', monospace;
}
```

### Mobile Touch Controls
For mobile play, consider adding on-screen button overlays:
```html
<div id="touch-controls">
  <button data-action="left">◀</button>
  <button data-action="right">▶</button>
  <button data-action="rotateCW">↻</button>
  <button data-action="softDrop">▼</button>
  <button data-action="hardDrop">⏬</button>
</div>
```

### Fullscreen API
Add a fullscreen toggle for immersive play:
```javascript
document.getElementById('game-container').requestFullscreen();
```
