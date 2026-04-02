---
description: "Fix bugs, improve performance, or add features to the canvas game"
agent: "agent"
argument-hint: "Describe the bug or feature..."
---
Help debug or enhance the canvas game. The project uses:
- Vanilla JavaScript with ES modules
- HTML5 Canvas for rendering
- Web Audio API for sound effects
- No external dependencies

Check the project's [copilot-instructions.md](.github/copilot-instructions.md) for the full game specification and coding standards.

When fixing bugs:
1. Identify the root cause in the relevant module
2. Verify against the game specification (mechanics, scoring, etc.)
3. Test the fix doesn't break other functionality

When adding features:
1. Follow existing patterns and architecture
2. Keep browser compatibility — no transpilation needed
3. Maintain the procedural sound theme for any new audio
