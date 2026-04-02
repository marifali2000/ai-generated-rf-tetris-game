---
description: "Use when working on sound effects, audio, Web Audio API, breaking sounds, shattering effects, or the SoundEngine class."
applyTo: "js/sound.js"
---
# Sound Effect Guidelines

## Web Audio API Pattern
- Create a single `AudioContext` on first user interaction (click/keypress) to comply with autoplay policies
- Reuse the AudioContext — never create multiple instances
- Use `OscillatorNode` for tonal sounds (rotation clicks, level chimes)
- Use `AudioBuffer` with white noise for breaking/shattering textures
- Use `BiquadFilterNode` to shape noise into cracking/glass sounds
- Use `GainNode` with exponential ramp-down for natural decay

## "Breaking Off" Sound Recipes
- **Line clear**: White noise burst (0.3s) → bandpass filter sweep 4000Hz→200Hz → fast gain decay
- **Hard drop**: Low oscillator (80Hz, 0.1s) + noise burst (0.05s) for impact
- **Piece lock**: Short noise burst (0.05s) at high frequency (3000Hz bandpass)
- **Tetris clear**: Layer 3 noise bursts with staggered timing (0, 50ms, 120ms), longer decay (0.5s), add slight delay effect
- **Game over**: Descending oscillator (400Hz→40Hz over 2s) + long noise with slow decay (2s)
- **Level up**: Two quick ascending tones (440→880Hz) then noise crack

## Volume Control
- Master volume control (0.0 to 1.0)
- Individual category volumes: music, effects
- Provide mute toggle (M key)
