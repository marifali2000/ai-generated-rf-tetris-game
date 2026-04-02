# Psychoacoustic Tricks for Addictive Game Audio

Techniques from game audio psychology that make sounds feel more satisfying, rewarding, and addictive.

## 1. Anticipation → Reward Loop

The brain loves predicting and being rewarded. When a player does something, the sound should confirm it felt good.

**Pattern**: Sharp attack + musical decay = "I did something satisfying"

```
Envelope shape:
  Volume
  ▐█▌
  ▐ ▌▄
  ▐   ▀▄▄▄___
  └──────────── Time
  ^attack  ^smooth tail
  (<5ms)   (50-200ms)
```

- Attack under 5ms feels instant and snappy
- Decay of 50-200ms gives the sound body without outstaying
- Total duration 50-300ms for action feedback

## 2. Pitch Escalation = Progress

Higher pitch unconsciously signals "things are getting better":

| Event | Pitch Strategy |
|-------|---------------|
| Single line clear | C5 (523 Hz) |
| Double | D5 (587 Hz) |
| Triple | E5 (659 Hz) |
| Tetris (4-line) | G5 (784 Hz) |
| Consecutive clears | +8% per combo |
| Level up | Full ascending arpeggio |

## 3. Micro-Variation Prevents Fatigue

Hearing the exact same sound 500+ times causes listener fatigue. Add tiny random variation:

```javascript
// ±5% pitch (barely noticeable, prevents repetition)
const pitch = 0.95 + Math.random() * 0.1;
osc.frequency.value = baseFreq * pitch;

// ±2ms timing offset
const jitter = (Math.random() - 0.5) * 0.004;

// ±10% filter Q variation
filter.Q.value = baseQ * (0.9 + Math.random() * 0.2);
```

The variations should be small enough that the player can't consciously notice them, but large enough that the brain doesn't flag "this is the same sound again."

## 4. Musical Intervals > Random Frequencies

Random frequencies feel chaotic. Musical intervals feel intentional and pleasant.

| Interval | Ratio | Feeling | Use For |
|----------|-------|---------|---------|
| Octave | 2:1 | Pure, open | Harmonics, sparkle layers |
| Perfect fifth | 3:2 | Powerful, heroic | Reward chords, level up |
| Major third | 5:4 | Happy, bright | Positive feedback |
| Minor third | 6:5 | Tense, dramatic | Warnings, game over |
| Major seventh | 15:8 | Dreamy, magical | Rare achievements |

```javascript
// Example: Add a fifth harmonic to any tone
const fundamental = 440;
const fifth = fundamental * 1.5; // 660 Hz
// Play both at different volumes (fundamental louder)
```

## 5. Sub-Bass for Impact

Frequencies below 100Hz are *felt* more than heard. They add weight and consequence to drops and impacts without being loud or annoying.

```javascript
// "Feel it" sub layer (below audible loudness threshold for most)
const sub = ctx.createOscillator();
sub.type = 'sine';
sub.frequency.value = 45; // deep sub
const subGain = ctx.createGain();
subGain.gain.setValueAtTime(0.15, t); // subtle volume
subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
```

Use for: hard drop, piece lock, game over rumble.

## 6. Layered Transient Design

Every satisfying game sound has layers. Think of it like cooking — one ingredient is bland, layers create flavor.

```
Great game sound anatomy:

1. TRANSIENT (0-5ms)    — Sharp click/pop (noise burst, high freq)
                           Provides "snap" and immediacy
2. BODY (5-50ms)        — Fundamental tone (oscillator)
                           The main pitch/character
3. TEXTURE (0-100ms)    — Filtered noise or harmonics
                           Adds richness and "crunch"
4. TAIL (50-300ms)      — Slow decay, reverb, or fade
                           Gives the sound space to breathe
```

## 7. Reward Sound Escalation

Consecutive achievements should produce progressively more rewarding sounds:

```javascript
// Track combo state in SoundEngine
#combo = 0;
#lastClearTime = 0;

onLineClear(count) {
  const now = performance.now();
  if (now - this.#lastClearTime < 3000) {
    this.#combo++;
  } else {
    this.#combo = 1;
  }
  this.#lastClearTime = now;

  // Escalate: higher pitch, richer harmonics, longer tail
  const pitchMultiplier = 1 + (this.#combo - 1) * 0.08;
  const harmonicCount = Math.min(this.#combo, 4);
  const tailDuration = 0.3 + this.#combo * 0.05;
}
```

## 8. Contrast Makes Sounds Stand Out

A sound in silence is less impactful than a sound preceded by a tiny gap.

- Before a big impact (hard drop), briefly duck other audio by 50% for 20ms
- After line clear, leave 50-100ms of relative quiet before spawn sound
- Game over: brief silence (50ms) before the collapse begins

```javascript
// Pre-impact duck for emphasis
this.#masterGain.gain.setValueAtTime(this.#volume * 0.5, t - 0.02);
this.#masterGain.gain.setValueAtTime(this.#volume, t + 0.05);
```

## 9. The "Tetris Clear" Special Treatment

A 4-line clear (Tetris) is the peak achievement. Its sound should be noticeably different and more rewarding than a single/double/triple:

- 2x longer duration
- Major chord (not just a tone)
- Brighter filter (higher Q, higher cutoff)
- Screen shake reinforces the sound
- Brief "impact silence" before the celebration sound
- Layered shatter from all 4 rows cascading
