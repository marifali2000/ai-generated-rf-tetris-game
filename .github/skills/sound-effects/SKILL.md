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
- Source: White noise buffer (0.3s)
- Filter: Bandpass, Q=1.0, frequency automates from 4000→200Hz over 0.3s
- Gain: Start at 0.8, exponentialRampToValueAtTime 0.001 at +0.3s
- For multi-row/match clears, layer 2-3 instances with slight time offsets

### Impact Thud (Hard Drop / Slam)
- Oscillator: Sine wave, 80Hz, duration 0.1s
- Gain: Start at 0.6, exponential decay to 0.001 at +0.1s
- Layer with very short noise burst (0.05s) for texture

### Snap (Element Placement / Lock)
- Noise buffer: 0.05s duration
- Filter: Bandpass at 3000Hz, Q=2.0
- Gain: 0.4, fast decay

### Crystalline Click (Rotation / Action)
- Oscillator: Sine, 1200Hz, duration 0.03s
- Gain: 0.2, immediate decay

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
