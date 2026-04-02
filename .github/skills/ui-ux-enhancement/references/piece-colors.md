# Element Color Reference

## Base Element Colors (Example: Falling-Block Game)

| Element | Color Name | Hex | RGB |
|---------|-----------|-----|-----|
| I | Cyan | `#00f0f0` | `0, 240, 240` |
| O | Yellow | `#f0f000` | `240, 240, 0` |
| T | Purple | `#a000f0` | `160, 0, 240` |
| S | Green | `#00f000` | `0, 240, 0` |
| Z | Red | `#f00000` | `240, 0, 0` |
| J | Blue | `#0000f0` | `0, 0, 240` |
| L | Orange | `#f0a000` | `240, 160, 0` |

## Derived Colors for Visual Effects

### Highlight (lighter, for top/left bevel or glow)
| Element | Highlight Hex | Usage |
|---------|-------------|-------|
| I | `#66ffff` | Top/left edge, glow |
| O | `#ffff66` | Top/left edge, glow |
| T | `#cc66ff` | Top/left edge, glow |
| S | `#66ff66` | Top/left edge, glow |
| Z | `#ff6666` | Top/left edge, glow |
| J | `#6666ff` | Top/left edge, glow |
| L | `#ffcc66` | Top/left edge, glow |

### Shadow (darker, for bottom/right bevel)
| Element | Shadow Hex | Usage |
|---------|-----------|-------|
| I | `#009090` | Bottom/right edge |
| O | `#909000` | Bottom/right edge |
| T | `#600090` | Bottom/right edge |
| S | `#009000` | Bottom/right edge |
| Z | `#900000` | Bottom/right edge |
| J | `#000090` | Bottom/right edge |
| L | `#906000` | Bottom/right edge |

## Color Utility Functions

To dynamically lighten or darken a hex color for gradients and effects:

```javascript
function lightenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0xff) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex, alpha) {
  const num = parseInt(hex.slice(1), 16);
  return `rgba(${num >> 16},${(num >> 8) & 0xff},${num & 0xff},${alpha})`;
}
```
