---
description: "Use when working on sound effects, audio, Web Audio API, procedural sounds, or the SoundEngine class in a browser-based canvas game."
applyTo: "js/sound.js"
---
# Sound Effect Guidelines

## Web Audio API Setup
- Create a single `AudioContext` on first user interaction (click/keypress) to comply with autoplay policies
- Use `window.AudioContext || window.webkitAudioContext` for Safari compatibility
- Reuse the AudioContext — never create multiple instances
- Resume suspended context on user gesture: `if (ctx.state === 'suspended') ctx.resume()`

## Audio Node Toolkit
- **OscillatorNode** — tonal sounds (clicks, chimes, sweeps). Types: sine, triangle, sawtooth, square
- **AudioBufferSourceNode** — white noise for breaking, shattering, impact textures
- **BiquadFilterNode** — shape noise into specific sounds (highpass for glass, bandpass for focused, lowpass for muffled)
- **GainNode** — envelopes with `exponentialRampToValueAtTime()` for natural decay
- **DelayNode** — feedback loops for reverb-like tails (lightweight alternative to ConvolverNode)

## Sound Design Patterns
- **Impact** — Low oscillator (40–100Hz, 0.1s) + noise burst for weight
- **Snap/Click** — Short noise (0.03–0.05s) through bandpass filter (3000–5000Hz, Q=0.6–1.0)
- **Shatter/Break** — Multi-layered: impact burst (bandpass 4–5.5kHz) + sustained body (bandpass sweep 5→3kHz) + scattered debris shards (bandpass 4–8kHz). Use bandpass, NOT highpass — highpass alone creates thin wispy sounds. Low Q (0.4–0.8) sounds natural; high Q (>5) sounds metallic
- **Celebration** — Ascending arpeggio using musical intervals (octaves, fifths)
- **Collapse/Fail** — Descending oscillator + long noise tail with slow decay
- **Layer sounds** — Every impactful sound needs 2–4 layers: transient + body + texture + tail

## Sound Scaling
- Scale sound intensity with event magnitude (bigger events = louder, richer, longer)
- Add micro-variation: ±5% pitch, ±10ms timing, ±10% filter Q to prevent listener fatigue
- Use musical intervals (octaves, fifths, thirds) — not random frequencies

## Volume & Mixing
- Master volume control (0.0 to 1.0) via master GainNode
- Provide mute toggle (e.g., M key)
- Frequent sounds (movement, clicks) are quiet; rare rewards (level up, big clears) are louder
- Use DynamicsCompressorNode to prevent clipping when multiple sounds overlap
- Support multiple sound themes for variety

## Graceful Fallback
- Use feature detection for Web Audio API availability
- Game must remain fully playable if audio is unavailable (silent mode)
