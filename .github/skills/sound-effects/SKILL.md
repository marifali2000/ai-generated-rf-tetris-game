---
name: sound-effects
description: "Create breaking, shattering, cracking, and impact sound effects using Web Audio API. Use for: adding audio, sound design, glass breaking sounds, impact sounds, procedural audio, oscillator-based sounds, noise generation, volume control, mute functionality."
---

# Sound Effects Skill — Procedural Game Audio

## When to Use
- Adding or modifying sound effects for game events
- Debugging Web Audio API issues
- Creating new procedural sounds (impacts, breaks, clicks, chimes)
- Implementing volume/mute controls

## Web Audio API Fundamentals

### AudioContext Setup (autoplay-compliant)
```javascript
class SoundEngine {
  #ctx = null;

  init() {
    if (!this.#ctx) {
      this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.#ctx.state === 'suspended') {
      this.#ctx.resume();
    }
  }
}
```
Call `init()` inside a user gesture event handler (click, keydown).

### White Noise Buffer (reusable)
```javascript
createNoiseBuffer(duration = 1) {
  const sampleRate = this.#ctx.sampleRate;
  const buffer = this.#ctx.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
```

### Breaking Sound Pattern
```
[Noise Source] → [BiquadFilter (bandpass)] → [GainNode (envelope)] → [Destination]
                  ↑ frequency sweep              ↑ exponential decay
```

## Sound Recipes

### Glass Shatter (Row/Match Clear)
Real glass breaking has strong energy at 4–6kHz with a sustained body, NOT thin highpass hiss.
- **Impact burst**: White noise (20–25ms), bandpass at 4000–5500Hz, Q=0.5–1.0, sharp exponential decay
- **Shatter body**: White noise (80–120ms), bandpass sweeping 5000→3000Hz, Q=0.4, gradual decay
- **Shard cascade**: 5–10 short (15–25ms) bandpass noise bursts at 4000–8000Hz, Q=0.4–0.8, staggered
- **Secondary impact**: Repeat impact burst at ~60% through (simulates large piece breaking away)
- **Scatter shards**: 5–7 tiny (10–15ms) bandpass noise puffs at 4000–8000Hz, randomised timing
- Always use **bandpass** (not highpass) for glass — highpass creates thin, wispy sounds lacking the body of real glass
- Low Q values (0.4–0.8) sound natural; high Q (>5) sounds metallic/resonant — avoid for glass
- For multi-row/match clears, layer 2-3 instances with slight time offsets

### Impact Thud (Hard Drop / Slam)
- Oscillator: Sine wave, 80Hz, duration 0.1s
- Gain: Start at 0.6, exponential decay to 0.001 at +0.1s
- Layer with very short noise burst (0.05s) for texture

### Snap (Element Placement / Lock)
- Noise buffer: 0.03s duration
- Filter: Bandpass at 3000–4500Hz, Q=0.6–1.0
- Gain: 0.3, fast exponential decay
- Layer with a brief sub-bass sine (80–100Hz, 0.03s) for weight

### Crystalline Click (Rotation / Action)
- Oscillator: Sine, 1200Hz, duration 0.03s
- Gain: 0.2, immediate decay
- Add octave harmonic (2400Hz) at 30% volume for brightness

### Collapse (Game Over)
- Oscillator: Sine, sweep 400→40Hz over 2s
- Noise: Long decay (2s), low-pass filter at 800Hz
- Gain: 0.7, slow linear decay

## Procedure
1. Create `SoundEngine` class in `js/sound.js`
2. Implement `init()` method with AudioContext creation (autoplay-compliant)
3. Add `createNoiseBuffer()` helper for white noise generation
4. Implement each sound as a method: `playLineClear()`, `playHardDrop()`, `playLock()`, `playRotate()`, `playGameOver()`, `playLevelUp()`
5. Add volume control: `setVolume(0-1)`, `toggleMute()`
6. Wire sound calls into game events in `js/game.js`
7. Test in Chrome and Safari (Safari may need `webkitAudioContext` fallback)
8. Support multiple sound themes for variety
