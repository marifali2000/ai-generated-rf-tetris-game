---
name: sound-design
description: "Design and refine addictive, satisfying game sounds using Web Audio API. Use for: improving sound quality, making sounds more satisfying, audio polish, sound layering, reverb, delay, compression, musical chimes, harmonic tuning, satisfying feedback sounds, juicy audio, ear candy, addictive sounds, sound sweetening, audio mixing, master gain, dynamic range, sound variety, pitch randomization, combo sounds, streak rewards."
---

# Sound Design Skill — Addictive & Satisfying Audio

## When to Use
- Making existing sounds more satisfying and "juicy"
- Adding harmonic richness, reverb, or stereo width
- Creating musical reward sounds that feel addictive
- Tuning volumes and balance across all game sounds
- Adding sound variety / randomization to prevent listener fatigue
- Creating combo/streak escalating reward sounds
- Polish pass on any game audio

## Architecture

| File | Role |
|------|------|
| `js/sound.js` | `SoundEngine` class — all procedural audio via Web Audio API |
| `js/game.js` | Calls sound methods at game events (spawn, lock, clear, drop, rotate, game over, level up) |

### Current Sound Events
| Method | Event | Current Style |
|--------|-------|---------------|
| `playSpawn()` | Piece enters from top | Bouncy sine sweep "poing" |
| `playRotate()` | Piece rotates | Crystalline sine click |
| `playLock()` | Piece locks to board | Short bandpass noise snap |
| `playLineClear(count)` | Lines cleared (1–4) | Multi-layered: rumble + crunch + glass shatter + debris |
| `playHardDrop()` | Piece hard drops | Low sine thud + noise burst |
| `playLevelUp()` | Level advances | Two ascending tones + noise crack |
| `playGameOver()` | Game ends | Descending sine sweep + long noise decay |

### Audio Graph Basics
```
[Source] → [Filter] → [Effects] → [GainNode (envelope)] → #masterGain → destination
              ↑            ↑
         shape tone    reverb/delay
```

## Design Principles for Addictive Sound

1. **Instant feedback** — Sound must trigger within 1-2ms of the action. No perceptible delay.
2. **Musical intervals** — Use harmonically related frequencies (octaves, fifths, major thirds). Random frequencies feel chaotic; musical ones feel intentional and satisfying.
3. **Layering** — Every great game sound has 2-4 layers: a body (fundamental), a transient (attack click), a texture (noise/shimmer), and a tail (reverb/decay).
4. **Positive reinforcement escalation** — Bigger achievements = richer, higher-pitched, longer sounds. Single clear < Double < Triple < Tetris should be an audible progression.
5. **Micro-variation** — Randomize pitch ±5%, timing ±10ms, filter Q slightly. Prevents listener fatigue and makes sounds feel alive.
6. **Satisfying envelopes** — Sharp attack (< 5ms) + smooth decay. Snappy sounds feel responsive. Mushy attacks feel laggy.
7. **Harmonic sweetness** — Add subtle octave overtones or fifth harmonics to tonal sounds. A 440Hz tone with a quiet 880Hz and 1320Hz layer sounds rich and warm.

## Sound Quality Recipes

See reference files for detailed implementation:

- [Advanced Sound Recipes](./references/advanced-recipes.md) — Drop-in code for improved versions of every game sound
- [Psychoacoustic Tricks](./references/psychoacoustics.md) — Techniques that make sounds feel more satisfying
- [Mixing & Mastering](./references/mixing.md) — Volume balance, compression, stereo, reverb

## Quick Win Patterns

### Add Reverb Tail (Convolver-Free)
Use a feedback delay for lightweight reverb without ConvolverNode:
```javascript
#createReverb(input, duration = 0.3, feedback = 0.2) {
  const delay = this.#ctx.createDelay();
  delay.delayTime.value = 0.03;
  const fbGain = this.#ctx.createGain();
  fbGain.gain.value = feedback;
  const wetGain = this.#ctx.createGain();
  wetGain.gain.value = 0.25;
  input.connect(delay);
  delay.connect(fbGain);
  fbGain.connect(delay); // feedback loop
  delay.connect(wetGain);
  wetGain.connect(this.#masterGain);
}
```

### Pitch Randomization
Add ±5% pitch variation so sounds never feel repetitive:
```javascript
const pitchFactor = 0.95 + Math.random() * 0.1; // 0.95–1.05
osc.frequency.value = baseFreq * pitchFactor;
```

### Musical Reward Chime
Use major chord intervals for rewarding sounds:
```javascript
// C Major chord: root, major third, fifth
const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
freqs.forEach((f, i) => {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = f;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.2, t + i * 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + i * 0.05);
  osc.connect(g); g.connect(masterGain);
  osc.start(t + i * 0.05);
  osc.stop(t + 0.5);
});
```

### Escalating Combo Pitch
Raise pitch with consecutive actions for a rewarding feedback loop:
```javascript
// In SoundEngine: track combo count
#comboCount = 0;
playLineClear(count) {
  this.#comboCount++;
  const pitchBoost = 1 + (this.#comboCount - 1) * 0.08; // 8% per combo
  // Apply pitchBoost to oscillator frequencies
  // Reset #comboCount after a piece spawns without clearing
}
```

## Procedure

1. **Identify the target sound** — Which event needs improvement? Reference the Current Sound Events table above.
2. **Read `js/sound.js`** — Find the current `play*()` method implementation.
3. **Apply the relevant recipe** — Load [advanced-recipes.md](./references/advanced-recipes.md) for drop-in replacement code.
4. **Add micro-variation** — Apply pitch randomization and timing jitter (see [psychoacoustics.md](./references/psychoacoustics.md)).
5. **Balance the mix** — After modifying a sound, check relative volumes against other sounds (see [mixing.md](./references/mixing.md)).
6. **Test in browser** — Play the game. Sounds should feel immediate, satisfying, and never annoying after repeated hearing.
7. **Cross-browser verify** — Test in Chrome + Safari (Safari uses `webkitAudioContext`).
