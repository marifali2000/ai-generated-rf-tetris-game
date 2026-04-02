# Advanced Sound Recipes

Drop-in replacement recipes for each game sound. Each recipe is designed to be more satisfying, layered, and addictive than the basic version.

## Glass Theme Principles

Real glass breaking (from reference audio analysis) has these characteristics:

- **Peak energy at 4000–5500Hz** — NOT ultra-high (>8kHz). Use bandpass, not highpass
- **Strong sustained body** lasting 80–200ms that decays with irregularity
- **Multiple impact bursts** — secondary impacts at ~60% through as large pieces break away
- **Sporadic loud shard hits** scattered unpredictably through the cascade
- **Low Q values (0.4–0.8)** — natural broadband character. High Q (>5) sounds metallic
- **Multi-layered**: impact burst + shatter body + shard cascade + scattered debris

**Critical rule**: For ALL glass-themed sounds, use `bandpass` filters (not `highpass`). Highpass creates thin, wispy, airy sounds that lack the body of real glass. Bandpass centred at 3500–8000Hz with low Q gives convincing glass character.

## Spawn — "Crystalline Pop"

Replace the basic poing with a bubbly pop + shimmer tail:

```javascript
playSpawn() {
  if (!this.#ctx) return;
  const t = this.#now();
  const pitchFactor = 0.96 + Math.random() * 0.08;

  // Layer 1: Bubbly pop — quick sine chirp up
  const pop = this.#ctx.createOscillator();
  pop.type = 'sine';
  pop.frequency.setValueAtTime(280 * pitchFactor, t);
  pop.frequency.exponentialRampToValueAtTime(950 * pitchFactor, t + 0.05);
  pop.frequency.exponentialRampToValueAtTime(600 * pitchFactor, t + 0.12);
  const popEnv = this.#ctx.createGain();
  popEnv.gain.setValueAtTime(0.28, t);
  popEnv.gain.linearRampToValueAtTime(0.32, t + 0.03);
  popEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  pop.connect(popEnv);
  popEnv.connect(this.#masterGain);
  pop.start(t); pop.stop(t + 0.17);

  // Layer 2: Octave shimmer
  const shimmer = this.#ctx.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(560 * pitchFactor, t);
  shimmer.frequency.exponentialRampToValueAtTime(1900 * pitchFactor, t + 0.04);
  shimmer.frequency.exponentialRampToValueAtTime(1200 * pitchFactor, t + 0.1);
  const shimEnv = this.#ctx.createGain();
  shimEnv.gain.setValueAtTime(0.07, t);
  shimEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  shimmer.connect(shimEnv);
  shimEnv.connect(this.#masterGain);
  shimmer.start(t); shimmer.stop(t + 0.11);

  // Layer 3: Tiny air click (percussive transient)
  const click = this.#ctx.createBufferSource();
  click.buffer = this.#createNoiseBuffer(0.015);
  const clickFilter = this.#ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 4500;
  clickFilter.Q.value = 1.5;
  const clickEnv = this.#ctx.createGain();
  clickEnv.gain.setValueAtTime(0.12, t);
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  click.connect(clickFilter);
  clickFilter.connect(clickEnv);
  clickEnv.connect(this.#masterGain);
  click.start(t); click.stop(t + 0.02);
}
```

## Rotate — "Crystal Tick"

Musical click with harmonic overtone:

```javascript
playRotate() {
  if (!this.#ctx) return;
  const t = this.#now();
  const pitch = (0.97 + Math.random() * 0.06); // micro-variation

  // Fundamental tick
  const osc = this.#ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1200 * pitch;
  const env = this.#ctx.createGain();
  env.gain.setValueAtTime(0.22, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(env);
  env.connect(this.#masterGain);
  osc.start(t); osc.stop(t + 0.05);

  // Octave harmonic for brightness
  const h = this.#ctx.createOscillator();
  h.type = 'sine';
  h.frequency.value = 2400 * pitch;
  const hEnv = this.#ctx.createGain();
  hEnv.gain.setValueAtTime(0.06, t);
  hEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  h.connect(hEnv);
  hEnv.connect(this.#masterGain);
  h.start(t); h.stop(t + 0.03);
}
```

## Lock — "Satisfying Click-Thud"

A snappy transient with a brief sub-bass weight:

```javascript
playLock() {
  if (!this.#ctx) return;
  const t = this.#now();

  // Sharp click transient
  const click = this.#ctx.createBufferSource();
  click.buffer = this.#createNoiseBuffer(0.03);
  const clickFilter = this.#ctx.createBiquadFilter();
  clickFilter.type = 'bandpass';
  clickFilter.frequency.value = 3200 + Math.random() * 600;
  clickFilter.Q.value = 2.5;
  const clickEnv = this.#ctx.createGain();
  clickEnv.gain.setValueAtTime(0.35, t);
  clickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  click.connect(clickFilter);
  clickFilter.connect(clickEnv);
  clickEnv.connect(this.#masterGain);
  click.start(t); click.stop(t + 0.04);

  // Sub weight (you feel it more than hear it)
  const sub = this.#ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = 100;
  const subEnv = this.#ctx.createGain();
  subEnv.gain.setValueAtTime(0.15, t);
  subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  sub.connect(subEnv);
  subEnv.connect(this.#masterGain);
  sub.start(t); sub.stop(t + 0.07);
}
```

## Hard Drop — "Weighted Impact"

Deeper thud with floor resonance and dust scatter:

```javascript
playHardDrop() {
  if (!this.#ctx) return;
  const t = this.#now();

  // Sub impact — feels heavy
  const sub = this.#ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(90, t);
  sub.frequency.exponentialRampToValueAtTime(40, t + 0.12);
  const subEnv = this.#ctx.createGain();
  subEnv.gain.setValueAtTime(0.65, t);
  subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  sub.connect(subEnv);
  subEnv.connect(this.#masterGain);
  sub.start(t); sub.stop(t + 0.13);

  // Mid body (floor resonance)
  const body = this.#ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(180, t);
  body.frequency.exponentialRampToValueAtTime(60, t + 0.08);
  const bodyEnv = this.#ctx.createGain();
  bodyEnv.gain.setValueAtTime(0.2, t);
  bodyEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  body.connect(bodyEnv);
  bodyEnv.connect(this.#masterGain);
  body.start(t); body.stop(t + 0.09);

  // Dust scatter (short noise texture)
  const dust = this.#ctx.createBufferSource();
  dust.buffer = this.#createNoiseBuffer(0.06);
  const dustFilter = this.#ctx.createBiquadFilter();
  dustFilter.type = 'highpass';
  dustFilter.frequency.value = 2000;
  const dustEnv = this.#ctx.createGain();
  dustEnv.gain.setValueAtTime(0.18, t + 0.01);
  dustEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  dust.connect(dustFilter);
  dustFilter.connect(dustEnv);
  dustEnv.connect(this.#masterGain);
  dust.start(t + 0.01); dust.stop(t + 0.08);
}
```

## Line Clear — "Glass Cascade" (Enhanced)

Add musical tonal layer and reverb tail to the existing shatter:

```javascript
// After the existing shatter layers, add:

// Layer 5: Musical reward tone (pitch rises with line count)
const rewardBase = [523.25, 587.33, 659.25, 783.99][intensity - 1]; // C5, D5, E5, G5
const reward = this.#ctx.createOscillator();
reward.type = 'sine';
reward.frequency.value = rewardBase;
const rewardEnv = this.#ctx.createGain();
rewardEnv.gain.setValueAtTime(0.001, t);
rewardEnv.gain.linearRampToValueAtTime(0.2, t + 0.02);
rewardEnv.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.8);
reward.connect(rewardEnv);
rewardEnv.connect(this.#masterGain);
reward.start(t); reward.stop(t + duration * 0.8 + 0.01);

// Layer 5b: Fifth harmonic for richness
const fifth = this.#ctx.createOscillator();
fifth.type = 'sine';
fifth.frequency.value = rewardBase * 1.5;
const fifthEnv = this.#ctx.createGain();
fifthEnv.gain.setValueAtTime(0.001, t);
fifthEnv.gain.linearRampToValueAtTime(0.08, t + 0.03);
fifthEnv.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);
fifth.connect(fifthEnv);
fifthEnv.connect(this.#masterGain);
fifth.start(t); fifth.stop(t + duration * 0.6 + 0.01);
```

## Level Up — "Triumphant Arpeggio"

Replace two-tone chime with a full ascending arpeggio:

```javascript
playLevelUp() {
  if (!this.#ctx) return;
  const t = this.#now();

  // Ascending major arpeggio: C5 → E5 → G5 → C6
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const noteGap = 0.07;
  
  notes.forEach((freq, i) => {
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = this.#ctx.createGain();
    const start = t + i * noteGap;
    env.gain.setValueAtTime(0.001, start);
    env.gain.linearRampToValueAtTime(0.25, start + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
    osc.connect(env);
    env.connect(this.#masterGain);
    osc.start(start); osc.stop(start + 0.16);

    // Octave sparkle on each note
    const sparkle = this.#ctx.createOscillator();
    sparkle.type = 'triangle';
    sparkle.frequency.value = freq * 2;
    const spEnv = this.#ctx.createGain();
    spEnv.gain.setValueAtTime(0.04, start + 0.005);
    spEnv.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
    sparkle.connect(spEnv);
    spEnv.connect(this.#masterGain);
    sparkle.start(start + 0.005); sparkle.stop(start + 0.09);
  });

  // Final shimmer burst
  const shimmer = this.#ctx.createBufferSource();
  shimmer.buffer = this.#createNoiseBuffer(0.15);
  const shimFilter = this.#ctx.createBiquadFilter();
  shimFilter.type = 'bandpass';
  shimFilter.frequency.value = 6000;
  shimFilter.Q.value = 0.8;
  const shimEnv = this.#ctx.createGain();
  const shimStart = t + notes.length * noteGap;
  shimEnv.gain.setValueAtTime(0.15, shimStart);
  shimEnv.gain.exponentialRampToValueAtTime(0.001, shimStart + 0.15);
  shimmer.connect(shimFilter);
  shimFilter.connect(shimEnv);
  shimEnv.connect(this.#masterGain);
  shimmer.start(shimStart); shimmer.stop(shimStart + 0.16);
}
```

## Game Over — "Cathedral Collapse"

Dramatic descending chord + rumble + debris cascade:

```javascript
playGameOver() {
  if (!this.#ctx) return;
  const t = this.#now();

  // Descending chord cluster (minor chord dissolving)
  const chordFreqs = [392, 466.16, 523.25]; // G4, Bb4, C5 (minor feel)
  chordFreqs.forEach((freq, i) => {
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.15, t + 2.5);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.3, t + i * 0.05);
    env.gain.linearRampToValueAtTime(0.001, t + 2.5);
    osc.connect(env);
    env.connect(this.#masterGain);
    osc.start(t + i * 0.05); osc.stop(t + 2.6);
  });

  // Sub-bass rumble
  const sub = this.#ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(80, t + 0.1);
  sub.frequency.exponentialRampToValueAtTime(20, t + 2.5);
  const subEnv = this.#ctx.createGain();
  subEnv.gain.setValueAtTime(0.5, t + 0.1);
  subEnv.gain.linearRampToValueAtTime(0.001, t + 2.5);
  sub.connect(subEnv);
  subEnv.connect(this.#masterGain);
  sub.start(t + 0.1); sub.stop(t + 2.6);

  // Crumbling debris cascade (staggered noise bursts)
  for (let i = 0; i < 5; i++) {
    const offset = 0.3 + i * 0.35;
    const debris = this.#ctx.createBufferSource();
    debris.buffer = this.#createNoiseBuffer(0.4);
    const debFilter = this.#ctx.createBiquadFilter();
    debFilter.type = 'bandpass';
    debFilter.frequency.value = 1200 - i * 150;
    debFilter.Q.value = 0.6;
    const debEnv = this.#ctx.createGain();
    debEnv.gain.setValueAtTime(0.2 - i * 0.03, t + offset);
    debEnv.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.4);
    debris.connect(debFilter);
    debFilter.connect(debEnv);
    debEnv.connect(this.#masterGain);
    debris.start(t + offset); debris.stop(t + offset + 0.41);
  }

  // Long reverb-like tail
  const tail = this.#ctx.createBufferSource();
  tail.buffer = this.#createNoiseBuffer(3);
  const tailFilter = this.#ctx.createBiquadFilter();
  tailFilter.type = 'lowpass';
  tailFilter.frequency.setValueAtTime(600, t);
  tailFilter.frequency.exponentialRampToValueAtTime(100, t + 3);
  const tailEnv = this.#ctx.createGain();
  tailEnv.gain.setValueAtTime(0.15, t + 0.5);
  tailEnv.gain.linearRampToValueAtTime(0.001, t + 3);
  tail.connect(tailFilter);
  tailFilter.connect(tailEnv);
  tailEnv.connect(this.#masterGain);
  tail.start(t + 0.5); tail.stop(t + 3.1);
}
```

## New Sound: Move — "Soft Nudge"

A subtle sound for left/right movement:

```javascript
playMove() {
  if (!this.#ctx) return;
  const t = this.#now();
  const osc = this.#ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 250 + Math.random() * 30;
  const env = this.#ctx.createGain();
  env.gain.setValueAtTime(0.06, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  osc.connect(env);
  env.connect(this.#masterGain);
  osc.start(t); osc.stop(t + 0.03);
}
```

## New Sound: Hold/Swap — "Whoosh"

A breathy swap sound:

```javascript
playHold() {
  if (!this.#ctx) return;
  const t = this.#now();
  const src = this.#ctx.createBufferSource();
  src.buffer = this.#createNoiseBuffer(0.12);
  const filter = this.#ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(3000, t + 0.06);
  filter.frequency.exponentialRampToValueAtTime(1500, t + 0.12);
  filter.Q.value = 0.8;
  const env = this.#ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(filter);
  filter.connect(env);
  env.connect(this.#masterGain);
  src.start(t); src.stop(t + 0.13);
}
```

## New Sound: Pause — "Tape Stop"

A satisfying slow-down effect:

```javascript
playPause() {
  if (!this.#ctx) return;
  const t = this.#now();
  const osc = this.#ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
  const filter = this.#ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
  const env = this.#ctx.createGain();
  env.gain.setValueAtTime(0.12, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(filter);
  filter.connect(env);
  env.connect(this.#masterGain);
  osc.start(t); osc.stop(t + 0.21);
}
```

## New Sound: Unpause — "Tape Start"

Reverse of pause — ramp up:

```javascript
playUnpause() {
  if (!this.#ctx) return;
  const t = this.#now();
  const osc = this.#ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, t);
  osc.frequency.exponentialRampToValueAtTime(500, t + 0.15);
  const filter = this.#ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, t);
  filter.frequency.exponentialRampToValueAtTime(4000, t + 0.15);
  const env = this.#ctx.createGain();
  env.gain.setValueAtTime(0.001, t);
  env.gain.linearRampToValueAtTime(0.12, t + 0.05);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(filter);
  filter.connect(env);
  env.connect(this.#masterGain);
  osc.start(t); osc.stop(t + 0.19);
}
```
