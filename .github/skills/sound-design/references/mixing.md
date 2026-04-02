# Mixing & Mastering Reference

Volume balance, dynamic range, and overall audio polish for the Tetris game.

## Volume Hierarchy

Not all sounds are equal. Frequent quiet sounds + rare loud sounds = balanced mix.

| Sound | Frequency | Target Volume | Role |
|-------|-----------|---------------|------|
| Move (soft nudge) | Very high | 0.05–0.08 | Background texture |
| Rotate (crystal tick) | High | 0.15–0.22 | Subtle feedback |
| Spawn (pop) | High | 0.20–0.30 | Awareness cue |
| Lock (click-thud) | High | 0.30–0.40 | Confirmation |
| Soft drop | Moderate | 0.05–0.08 | Background |
| Hard drop (impact) | Moderate | 0.50–0.65 | Punctuation |
| Line clear (shatter) | Low-moderate | 0.40–0.70 | Reward (scales with count) |
| Level up (arpeggio) | Rare | 0.25–0.30 | Celebration |
| Hold/swap (whoosh) | Moderate | 0.12–0.18 | Feedback |
| Pause/unpause | Rare | 0.10–0.15 | State change |
| Game over (collapse) | Rare | 0.50–0.70 | Dramatic |

**Rule**: Frequent sounds (move, rotate) are quiet. Rare rewards (level up, tetris) are louder. This prevents fatigue and makes rewards feel special.

## Master Volume Setup

```javascript
// Class-level defaults
#volume = 0.6;     // Master: 60% — leaves headroom for peaks
#muted = false;

// Master gain node connected to destination
this.#masterGain = this.#ctx.createGain();
this.#masterGain.gain.value = this.#volume;
this.#masterGain.connect(this.#ctx.destination);
```

All individual sound volumes are relative to this master. A sound with `gain = 0.5` at master `0.6` outputs at 30% total.

## Preventing Clipping

Multiple sounds playing simultaneously can stack and clip (distort). Prevention strategies:

### 1. Use a DynamicsCompressorNode
```javascript
// Create once in init()
const compressor = this.#ctx.createDynamicsCompressor();
compressor.threshold.value = -12;  // Start compressing at -12dB
compressor.knee.value = 10;        // Soft knee for natural feel
compressor.ratio.value = 4;        // 4:1 compression ratio
compressor.attack.value = 0.003;   // Fast attack catches transients
compressor.release.value = 0.1;    // Quick release for game responsiveness

// Route: all sounds → compressor → destination
this.#masterGain.connect(compressor);
compressor.connect(this.#ctx.destination);
```

### 2. Keep Individual Gains Conservative
- No single sound should have gain > 0.7 at source level
- Transient layers (noise clicks) should be 0.1–0.3
- Tonal layers should be 0.2–0.4
- Sub-bass layers should be 0.1–0.2

### 3. Limit Concurrent Sounds
During rapid gameplay (fast drops, quick rotations), many sounds can overlap:
```javascript
// Track active nodes and skip if too many
#activeNodes = 0;
#maxConcurrent = 12;

#canPlay() {
  return this.#activeNodes < this.#maxConcurrent;
}
```

## Lightweight Reverb

Full ConvolverNode is expensive. Use a feedback delay for a reverb-like tail:

```javascript
#setupReverb() {
  this.#reverbSend = this.#ctx.createGain();
  this.#reverbSend.gain.value = 0.15; // wet mix level

  const delay = this.#ctx.createDelay(0.1);
  delay.delayTime.value = 0.035;

  const feedback = this.#ctx.createGain();
  feedback.gain.value = 0.25;

  const filter = this.#ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3000; // dampen high frequencies in reverb

  this.#reverbSend.connect(delay);
  delay.connect(filter);
  filter.connect(feedback);
  feedback.connect(delay); // feedback loop
  filter.connect(this.#masterGain); // wet output
}

// To add reverb to a sound, connect its gainNode to both:
// gainNode → this.#masterGain (dry)
// gainNode → this.#reverbSend (wet)
```

## Sound Duration Guidelines

| Category | Duration | Reason |
|----------|----------|--------|
| Transient (click, tick) | 15–50ms | Instant feedback, no interference |
| Action (lock, rotate) | 30–80ms | Snappy confirmation |
| Event (spawn, move) | 15–30ms | Quick, unobtrusive |
| Reward (line clear) | 200–600ms | Noticeable but not lingering |
| Celebration (level up) | 300–500ms | Moment to appreciate |
| Dramatic (game over) | 2–3s | Full emotional arc |

## Testing Checklist

- [ ] Play 5 minutes continuously — are any sounds annoying by the end?
- [ ] Clear 20+ lines — does the sound stay satisfying or feel repetitive?
- [ ] Hard drop 10 times rapidly — do sounds stack cleanly without distortion?
- [ ] Mute toggle works instantly (M key)
- [ ] Test in Chrome, Firefox, Safari
- [ ] No warning/error in console about AudioContext state
- [ ] First user interaction (Enter key) properly initializes AudioContext
