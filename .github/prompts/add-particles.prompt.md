---
description: "Add particle effects for line clears — blocks shatter and scatter"
agent: "agent"
---
Add a particle system to `js/renderer.js` for line clear animations:

1. When a line is cleared, the blocks in that row should appear to shatter
2. Generate 5-8 small particle fragments per block in the cleared line
3. Each particle:
   - Starts at the block's position
   - Has random velocity (spread outward and downward)
   - Fades out over 0.5-1 second
   - Uses the color of the original block
   - Affected by simple gravity (acceleration downward)
4. For Tetris clears (4 lines), make particles larger and more numerous
5. Flash the cleared rows white briefly (50ms) before particles spawn
6. Use `requestAnimationFrame` integration — particles update in the same render loop
