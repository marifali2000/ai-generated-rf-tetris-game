---
description: "Add particle effects for clear events — cells shatter and scatter"
agent: "agent"
---
Add a particle system to `js/renderer.js` for clear event animations:

1. When a row/match is cleared, the cells in that area should appear to shatter
2. Generate 5-8 small particle fragments per cell in the cleared area
3. Each particle:
   - Starts at the cell's position
   - Has random velocity (spread outward and downward)
   - Fades out over 0.5-1 second
   - Uses the color of the original cell
   - Affected by simple gravity (acceleration downward)
4. For max clears (4+ rows), make particles larger and more numerous
5. Flash the cleared rows white briefly (50ms) before particles spawn
6. Use `requestAnimationFrame` integration — particles update in the same render loop
