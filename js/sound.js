/**
 * Web Audio API procedural sound effects — "Breaking Off" theme.
 *
 * Design principles:
 * - Layered transients (click + body + texture + tail)
 * - Musical intervals for reward sounds
 * - Micro-variation (±5% pitch) prevents listener fatigue
 * - DynamicsCompressor prevents clipping during rapid gameplay
 * - Combo tracking escalates reward pitch
 * - Multiple sound themes: glass, concrete, crystal, metal, ice
 */

const SOUND_THEMES = Object.freeze(['glass', 'concrete', 'crystal', 'metal', 'ice']);

class SoundEngine {
  #ctx = null;
  #masterGain = null;
  #compressor = null;
  #volume = 0.6;
  #muted = false;
  #combo = 0;
  #lastClearTime = 0;
  #soundTheme = 'glass';

  /** Available sound themes. */
  static get themes() { return SOUND_THEMES; }

  get soundTheme() { return this.#soundTheme; }
  setSoundTheme(theme) {
    if (SOUND_THEMES.includes(theme)) {
      this.#soundTheme = theme;
    }
  }

  init() {
    if (!this.#ctx) {
      this.#ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();

      // Compressor prevents clipping when many sounds overlap
      this.#compressor = this.#ctx.createDynamicsCompressor();
      this.#compressor.threshold.value = -12;
      this.#compressor.knee.value = 10;
      this.#compressor.ratio.value = 4;
      this.#compressor.attack.value = 0.003;
      this.#compressor.release.value = 0.1;

      this.#masterGain = this.#ctx.createGain();
      this.#masterGain.gain.value = this.#volume;
      this.#masterGain.connect(this.#compressor);
      this.#compressor.connect(this.#ctx.destination);
    }
    if (this.#ctx.state === 'suspended') {
      this.#ctx.resume();
    }
  }

  get muted() { return this.#muted; }

  /** Pre-warm the audio pipeline so first real sound plays instantly */
  warmUp() {
    if (!this.#ctx) return;
    // Play a silent buffer to prime mobile audio pipeline
    const buf = this.#ctx.createBuffer(1, 1, this.#ctx.sampleRate);
    const src = this.#ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.#ctx.destination);
    src.start();
  }

  setVolume(v) {
    this.#volume = Math.max(0, Math.min(1, v));
    if (this.#masterGain) {
      this.#masterGain.gain.value = this.#muted ? 0 : this.#volume;
    }
  }

  toggleMute() {
    this.#muted = !this.#muted;
    if (this.#masterGain) {
      this.#masterGain.gain.value = this.#muted ? 0 : this.#volume;
    }
    return this.#muted;
  }

  /** Reset combo counter (call when a piece locks without clearing). */
  resetCombo() {
    this.#combo = 0;
  }

  #createNoiseBuffer(duration = 1) {
    const sampleRate = this.#ctx.sampleRate;
    const buffer = this.#ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Lightweight feedback-delay reverb — no ConvolverNode needed */
  #addReverb(source, duration = 0.3, feedback = 0.25, wet = 0.2) {
    const delay = this.#ctx.createDelay();
    delay.delayTime.value = 0.025 + Math.random() * 0.015;
    const fb = this.#ctx.createGain();
    fb.gain.value = feedback;
    const wetGain = this.#ctx.createGain();
    wetGain.gain.value = wet;
    source.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(this.#masterGain);
    // Auto-cleanup: silence after duration
    wetGain.gain.setValueAtTime(wet, this.#ctx.currentTime);
    wetGain.gain.linearRampToValueAtTime(0, this.#ctx.currentTime + duration);
  }

  #now() {
    return this.#ctx.currentTime;
  }

  // ─── Spawn — "Crystalline Pop" ────────────────────────────────────────

  /**
   * Bubbly pop + octave shimmer + percussive click transient.
   * Pitch micro-varied ±4% to stay fresh over hundreds of spawns.
   */
  playSpawn() {
    if (!this.#ctx) return;
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;

    // Layer 1: Bubbly pop — quick sine chirp up
    const pop = this.#ctx.createOscillator();
    pop.type = 'sine';
    pop.frequency.setValueAtTime(280 * pf, t);
    pop.frequency.exponentialRampToValueAtTime(950 * pf, t + 0.05);
    pop.frequency.exponentialRampToValueAtTime(600 * pf, t + 0.12);
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
    shimmer.frequency.setValueAtTime(560 * pf, t);
    shimmer.frequency.exponentialRampToValueAtTime(1900 * pf, t + 0.04);
    shimmer.frequency.exponentialRampToValueAtTime(1200 * pf, t + 0.1);
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

  // ─── Rotate — "Crystal Tick" ──────────────────────────────────────────

  /**
   * Musical click with octave harmonic for brightness.
   * ±3% pitch micro-variation.
   */
  playRotate() {
    if (!this.#ctx) return;
    const t = this.#now();
    const pitch = 0.97 + Math.random() * 0.06;

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

  // ─── Lock — "Satisfying Click-Thud" ───────────────────────────────────

  /**
   * Snappy transient + brief sub-bass weight you feel more than hear.
   */
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

    // Sub weight (felt more than heard)
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

  // ─── Hard Drop — "Weighted Impact" ────────────────────────────────────

  /**
   * Deep thud with floor resonance + dust scatter noise texture.
   */
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

  // ─── Line Clear — Theme-based Sound ──────────────────────────────────

  /**
   * Dispatches to the active sound theme for line clear.
   */
  playLineClear(count = 1) {
    if (!this.#ctx) return;
    const t = this.#now();
    const intensity = Math.min(count, 4);
    const totalDur = 0.8 + intensity * 0.4;
    const vol = 0.5 + intensity * 0.12;

    // Track combos
    const now = performance.now();
    if (now - this.#lastClearTime < 3000) {
      this.#combo++;
    } else {
      this.#combo = 1;
    }
    this.#lastClearTime = now;
    const comboShift = this.#combo * 0.03;

    switch (this.#soundTheme) {
      case 'concrete': this.#playConcreteBreak(t, intensity, totalDur, vol, comboShift); break;
      case 'crystal': this.#playCrystalChime(t, intensity, totalDur, vol, comboShift); break;
      case 'metal': this.#playMetalClang(t, intensity, totalDur, vol, comboShift); break;
      case 'ice': this.#playIceCrack(t, intensity, totalDur, vol, comboShift); break;
      default: this.#playGlassShatter(t, intensity, totalDur, vol, comboShift); break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  THEME: GLASS — Real Glass Shattering
  // ═══════════════════════════════════════════════════════════════════════

  #playGlassShatter(t, intensity, totalDur, vol, comboShift) {
    // 1. FRACTURE TRANSIENT (0–30ms)
    const fracture = this.#ctx.createBufferSource();
    fracture.buffer = this.#createNoiseBuffer(0.03);
    const fractureFilter = this.#ctx.createBiquadFilter();
    fractureFilter.type = 'highpass';
    fractureFilter.frequency.value = 1500;
    const fractureGain = this.#ctx.createGain();
    fractureGain.gain.setValueAtTime(vol * 1.2, t);
    fractureGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    fracture.connect(fractureFilter);
    fractureFilter.connect(fractureGain);
    fractureGain.connect(this.#masterGain);
    fracture.start(t);
    fracture.stop(t + 0.035);

    // 2. PLATE-MODE RESONANCES
    const plateFreqs = [2093, 3136, 4186, 5274, 6272];
    const plateCount = 2 + intensity;
    for (let i = 0; i < plateCount; i++) {
      const freq = plateFreqs[i % plateFreqs.length] * (0.92 + Math.random() * 0.16 + comboShift);
      const dur = 0.06 + Math.random() * 0.14;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(vol * (0.15 + Math.random() * 0.1), t + i * 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.008 + dur);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + i * 0.008);
      osc.stop(t + i * 0.008 + dur + 0.01);
    }

    // 3. INITIAL SHATTER BURST
    const burstLayers = 2 + intensity;
    for (let i = 0; i < burstLayers; i++) {
      const offset = 0.01 + i * 0.025;
      const dur = 0.1 + Math.random() * 0.1;
      const src = this.#ctx.createBufferSource();
      src.buffer = this.#createNoiseBuffer(dur);
      const f1 = this.#ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 3000 + i * 1500 + Math.random() * 1000;
      f1.Q.value = 4 + Math.random() * 6;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(vol * 0.55, t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      src.connect(f1);
      f1.connect(env);
      env.connect(this.#masterGain);
      src.start(t + offset);
      src.stop(t + offset + dur + 0.01);
    }

    // 4. CASCADING SHARD TINKLES
    const shardCount = 8 + intensity * 6;
    for (let i = 0; i < shardCount; i++) {
      const offset = 0.05 + Math.random() * totalDur * 0.9;
      const freq = 2500 + Math.random() * 10000;
      const dur = 0.015 + Math.random() * 0.04;
      const loudness = (0.1 + Math.random() * 0.12) * Math.max(0.1, 1 - offset / totalDur);
      if (loudness <= 0.001) continue;
      const src = this.#ctx.createBufferSource();
      src.buffer = this.#createNoiseBuffer(dur);
      const filter = this.#ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 20 + Math.random() * 40;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      src.connect(filter);
      filter.connect(env);
      env.connect(this.#masterGain);
      src.start(t + offset);
      src.stop(t + offset + dur + 0.01);
    }

    // 5. MID-FREQUENCY CRUNCH
    const crunchDur = 0.12 + intensity * 0.04;
    const crunch = this.#ctx.createBufferSource();
    crunch.buffer = this.#createNoiseBuffer(crunchDur);
    const crunchF = this.#ctx.createBiquadFilter();
    crunchF.type = 'bandpass';
    crunchF.frequency.setValueAtTime(800, t);
    crunchF.frequency.exponentialRampToValueAtTime(200, t + crunchDur);
    crunchF.Q.value = 1;
    const crunchEnv = this.#ctx.createGain();
    crunchEnv.gain.setValueAtTime(vol * 0.5, t + 0.005);
    crunchEnv.gain.exponentialRampToValueAtTime(0.001, t + crunchDur);
    crunch.connect(crunchF);
    crunchF.connect(crunchEnv);
    crunchEnv.connect(this.#masterGain);
    crunch.start(t + 0.005);
    crunch.stop(t + crunchDur + 0.01);

    // 6. DEBRIS SCATTER TAIL
    const scatterDur = totalDur * 0.7;
    const scatter = this.#ctx.createBufferSource();
    scatter.buffer = this.#createNoiseBuffer(scatterDur);
    const scatterF = this.#ctx.createBiquadFilter();
    scatterF.type = 'highpass';
    scatterF.frequency.value = 5000;
    const scatterEnv = this.#ctx.createGain();
    scatterEnv.gain.setValueAtTime(0.001, t + 0.15);
    scatterEnv.gain.linearRampToValueAtTime(vol * 0.15, t + 0.25);
    scatterEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + scatterDur);
    scatter.connect(scatterF);
    scatterF.connect(scatterEnv);
    scatterEnv.connect(this.#masterGain);
    scatter.start(t + 0.15);
    scatter.stop(t + 0.15 + scatterDur + 0.01);

    // 7. REVERB TAIL
    const reverbSrc = this.#ctx.createBufferSource();
    reverbSrc.buffer = this.#createNoiseBuffer(0.08);
    const reverbFilter = this.#ctx.createBiquadFilter();
    reverbFilter.type = 'bandpass';
    reverbFilter.frequency.value = 3000;
    reverbFilter.Q.value = 0.5;
    const delay = this.#ctx.createDelay();
    delay.delayTime.value = 0.035;
    const fbGain = this.#ctx.createGain();
    fbGain.gain.value = 0.3 + intensity * 0.05;
    const reverbEnv = this.#ctx.createGain();
    reverbEnv.gain.setValueAtTime(vol * 0.2, t + 0.02);
    reverbEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.15);
    reverbSrc.connect(reverbFilter);
    reverbFilter.connect(delay);
    delay.connect(fbGain);
    fbGain.connect(delay);
    delay.connect(reverbEnv);
    reverbEnv.connect(this.#masterGain);
    reverbSrc.start(t + 0.02);
    reverbSrc.stop(t + 0.1);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  THEME: CONCRETE — Heavy Crumble & Rubble
  // ═══════════════════════════════════════════════════════════════════════

  #playConcreteBreak(t, intensity, totalDur, vol, comboShift) {
    // 1. INITIAL CRACK — low-mid broadband impact
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.05);
    const crackF = this.#ctx.createBiquadFilter();
    crackF.type = 'bandpass';
    crackF.frequency.value = 400 + comboShift * 200;
    crackF.Q.value = 0.8;
    const crackEnv = this.#ctx.createGain();
    crackEnv.gain.setValueAtTime(vol * 1.3, t);
    crackEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    crack.connect(crackF);
    crackF.connect(crackEnv);
    crackEnv.connect(this.#masterGain);
    crack.start(t);
    crack.stop(t + 0.055);

    // 2. SUB-BASS THUD — you feel the concrete breaking
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60 + intensity * 5, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.2);
    const subEnv = this.#ctx.createGain();
    subEnv.gain.setValueAtTime(vol * 0.7, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    sub.connect(subEnv);
    subEnv.connect(this.#masterGain);
    sub.start(t);
    sub.stop(t + 0.26);

    // 3. MID CRUMBLE — dense grainy texture, lower frequencies than glass
    const crumbleDur = 0.2 + intensity * 0.08;
    const crumble = this.#ctx.createBufferSource();
    crumble.buffer = this.#createNoiseBuffer(crumbleDur);
    const crumbleF = this.#ctx.createBiquadFilter();
    crumbleF.type = 'lowpass';
    crumbleF.frequency.setValueAtTime(2500, t);
    crumbleF.frequency.exponentialRampToValueAtTime(300, t + crumbleDur);
    const crumbleEnv = this.#ctx.createGain();
    crumbleEnv.gain.setValueAtTime(vol * 0.6, t + 0.01);
    crumbleEnv.gain.exponentialRampToValueAtTime(0.001, t + crumbleDur);
    crumble.connect(crumbleF);
    crumbleF.connect(crumbleEnv);
    crumbleEnv.connect(this.#masterGain);
    crumble.start(t + 0.01);
    crumble.stop(t + crumbleDur + 0.01);

    // 4. RUBBLE CASCADE — staggered low-frequency chunks bouncing
    const rubbleCount = 5 + intensity * 3;
    for (let i = 0; i < rubbleCount; i++) {
      const offset = 0.06 + Math.random() * totalDur * 0.85;
      const dur = 0.03 + Math.random() * 0.06;
      const freq = 150 + Math.random() * 600;
      const loudness = (0.15 + Math.random() * 0.15) * Math.max(0.15, 1 - offset / totalDur);
      const src = this.#ctx.createBufferSource();
      src.buffer = this.#createNoiseBuffer(dur);
      const f = this.#ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = 1.5 + Math.random() * 3;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      src.connect(f);
      f.connect(env);
      env.connect(this.#masterGain);
      src.start(t + offset);
      src.stop(t + offset + dur + 0.01);
    }

    // 5. CHUNK IMPACTS — heavy thuds as chunks hit ground
    const chunkCount = 2 + intensity;
    for (let i = 0; i < chunkCount; i++) {
      const offset = 0.1 + i * 0.12 + Math.random() * 0.05;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80 + Math.random() * 40, t + offset);
      osc.frequency.exponentialRampToValueAtTime(30, t + offset + 0.1);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(vol * (0.25 - i * 0.04), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.1);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.11);
    }

    // 6. DUST CLOUD — long low-frequency hiss
    const dustDur = totalDur * 0.6;
    const dust = this.#ctx.createBufferSource();
    dust.buffer = this.#createNoiseBuffer(dustDur);
    const dustF = this.#ctx.createBiquadFilter();
    dustF.type = 'lowpass';
    dustF.frequency.value = 1200;
    const dustEnv = this.#ctx.createGain();
    dustEnv.gain.setValueAtTime(0.001, t + 0.1);
    dustEnv.gain.linearRampToValueAtTime(vol * 0.18, t + 0.2);
    dustEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1 + dustDur);
    dust.connect(dustF);
    dustF.connect(dustEnv);
    dustEnv.connect(this.#masterGain);
    dust.start(t + 0.1);
    dust.stop(t + 0.1 + dustDur + 0.01);

    // 7. REVERB RUMBLE
    const revSrc = this.#ctx.createBufferSource();
    revSrc.buffer = this.#createNoiseBuffer(0.1);
    const revF = this.#ctx.createBiquadFilter();
    revF.type = 'lowpass';
    revF.frequency.value = 800;
    const revDelay = this.#ctx.createDelay();
    revDelay.delayTime.value = 0.05;
    const revFb = this.#ctx.createGain();
    revFb.gain.value = 0.35 + intensity * 0.04;
    const revEnv = this.#ctx.createGain();
    revEnv.gain.setValueAtTime(vol * 0.15, t + 0.03);
    revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + intensity * 0.12);
    revSrc.connect(revF);
    revF.connect(revDelay);
    revDelay.connect(revFb);
    revFb.connect(revDelay);
    revDelay.connect(revEnv);
    revEnv.connect(this.#masterGain);
    revSrc.start(t + 0.03);
    revSrc.stop(t + 0.13);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  THEME: CRYSTAL — Ethereal Chimes & Sparkles
  // ═══════════════════════════════════════════════════════════════════════

  #playCrystalChime(t, intensity, totalDur, vol, comboShift) {
    // 1. INITIAL PING — bright crystalline attack
    const ping = this.#ctx.createOscillator();
    ping.type = 'sine';
    const pingFreq = 2637 * (1 + comboShift); // E7
    ping.frequency.setValueAtTime(pingFreq, t);
    ping.frequency.exponentialRampToValueAtTime(pingFreq * 0.85, t + 0.15);
    const pingEnv = this.#ctx.createGain();
    pingEnv.gain.setValueAtTime(vol * 0.5, t);
    pingEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    ping.connect(pingEnv);
    pingEnv.connect(this.#masterGain);
    ping.start(t);
    ping.stop(t + 0.21);

    // 2. HARMONIC CHORD — major triad at crystal frequencies
    const chordNotes = [1760, 2217.5, 2637, 3520, 4186]; // A6, C#7, E7, A7, C8
    const noteCount = 2 + intensity;
    for (let i = 0; i < noteCount; i++) {
      const freq = chordNotes[i % chordNotes.length] * (0.97 + Math.random() * 0.06 + comboShift);
      const dur = 0.15 + Math.random() * 0.25;
      const osc = this.#ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(vol * (0.12 + Math.random() * 0.08), t + i * 0.015);
      env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.015 + dur);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + i * 0.015);
      osc.stop(t + i * 0.015 + dur + 0.01);
    }

    // 3. SPARKLE CASCADE — many tiny bright tones spreading out
    const sparkleCount = 10 + intensity * 5;
    for (let i = 0; i < sparkleCount; i++) {
      const offset = 0.03 + Math.random() * totalDur * 0.85;
      const freq = 3000 + Math.random() * 9000;
      const dur = 0.02 + Math.random() * 0.06;
      const loudness = (0.08 + Math.random() * 0.08) * Math.max(0.15, 1 - offset / totalDur);
      if (loudness <= 0.001) continue;
      const osc = this.#ctx.createOscillator();
      osc.type = Math.random() < 0.5 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }

    // 4. SHIMMER WASH — bright filtered noise
    const shimDur = totalDur * 0.5;
    const shim = this.#ctx.createBufferSource();
    shim.buffer = this.#createNoiseBuffer(shimDur);
    const shimF = this.#ctx.createBiquadFilter();
    shimF.type = 'bandpass';
    shimF.frequency.value = 8000;
    shimF.Q.value = 2;
    const shimEnv = this.#ctx.createGain();
    shimEnv.gain.setValueAtTime(vol * 0.12, t + 0.02);
    shimEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + shimDur);
    shim.connect(shimF);
    shimF.connect(shimEnv);
    shimEnv.connect(this.#masterGain);
    shim.start(t + 0.02);
    shim.stop(t + 0.02 + shimDur + 0.01);

    // 5. BELL RESONANCE — decaying pitched ring
    const bellFreq = 1568 * (1 + comboShift); // G6
    const bell = this.#ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = bellFreq;
    const bellOvertone = this.#ctx.createOscillator();
    bellOvertone.type = 'sine';
    bellOvertone.frequency.value = bellFreq * 2.76; // inharmonic overtone = bell-like
    const bellEnv = this.#ctx.createGain();
    bellEnv.gain.setValueAtTime(vol * 0.15, t);
    bellEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.1);
    const overtoneEnv = this.#ctx.createGain();
    overtoneEnv.gain.setValueAtTime(vol * 0.06, t);
    overtoneEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    bell.connect(bellEnv);
    bellEnv.connect(this.#masterGain);
    bellOvertone.connect(overtoneEnv);
    overtoneEnv.connect(this.#masterGain);
    bell.start(t);
    bell.stop(t + 0.6 + intensity * 0.1);
    bellOvertone.start(t);
    bellOvertone.stop(t + 0.31);

    // 6. REVERB SHIMMER
    const revSrc = this.#ctx.createBufferSource();
    revSrc.buffer = this.#createNoiseBuffer(0.06);
    const revF = this.#ctx.createBiquadFilter();
    revF.type = 'highpass';
    revF.frequency.value = 4000;
    const revDelay = this.#ctx.createDelay();
    revDelay.delayTime.value = 0.025;
    const revFb = this.#ctx.createGain();
    revFb.gain.value = 0.25 + intensity * 0.05;
    const revEnv = this.#ctx.createGain();
    revEnv.gain.setValueAtTime(vol * 0.12, t + 0.01);
    revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + intensity * 0.1);
    revSrc.connect(revF);
    revF.connect(revDelay);
    revDelay.connect(revFb);
    revFb.connect(revDelay);
    revDelay.connect(revEnv);
    revEnv.connect(this.#masterGain);
    revSrc.start(t + 0.01);
    revSrc.stop(t + 0.07);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  THEME: METAL — Industrial Clang & Scrape
  // ═══════════════════════════════════════════════════════════════════════

  #playMetalClang(t, intensity, totalDur, vol, comboShift) {
    // 1. INITIAL CLANG — sharp metallic attack with inharmonic overtones
    const baseFreq = 220 * (1 + comboShift);
    const clangOvertones = [1, 2.76, 4.07, 5.4, 6.8]; // inharmonic = metallic
    const clangCount = 2 + intensity;
    for (let i = 0; i < clangCount; i++) {
      const freq = baseFreq * clangOvertones[i % clangOvertones.length];
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq * (0.98 + Math.random() * 0.04);
      const env = this.#ctx.createGain();
      const startVol = vol * (0.3 - i * 0.04);
      env.gain.setValueAtTime(Math.max(startVol, 0.02), t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + Math.random() * 0.1);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    }

    // 2. IMPACT RING — resonant metallic ring that sustains
    const ringFreq = 440 * (1 + comboShift);
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = ringFreq;
    const ringFilter = this.#ctx.createBiquadFilter();
    ringFilter.type = 'peaking';
    ringFilter.frequency.value = ringFreq;
    ringFilter.Q.value = 15;
    ringFilter.gain.value = 8;
    const ringEnv = this.#ctx.createGain();
    ringEnv.gain.setValueAtTime(vol * 0.35, t);
    ringEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + intensity * 0.15);
    ring.connect(ringFilter);
    ringFilter.connect(ringEnv);
    ringEnv.connect(this.#masterGain);
    ring.start(t);
    ring.stop(t + 0.7 + intensity * 0.15);

    // 3. METAL SCRAPE — filtered noise sweeping down
    const scrapeDur = 0.15 + intensity * 0.06;
    const scrape = this.#ctx.createBufferSource();
    scrape.buffer = this.#createNoiseBuffer(scrapeDur);
    const scrapeF = this.#ctx.createBiquadFilter();
    scrapeF.type = 'bandpass';
    scrapeF.frequency.setValueAtTime(3500, t + 0.01);
    scrapeF.frequency.exponentialRampToValueAtTime(800, t + 0.01 + scrapeDur);
    scrapeF.Q.value = 5;
    const scrapeEnv = this.#ctx.createGain();
    scrapeEnv.gain.setValueAtTime(vol * 0.45, t + 0.01);
    scrapeEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.01 + scrapeDur);
    scrape.connect(scrapeF);
    scrapeF.connect(scrapeEnv);
    scrapeEnv.connect(this.#masterGain);
    scrape.start(t + 0.01);
    scrape.stop(t + 0.01 + scrapeDur + 0.01);

    // 4. RATTLE — scattered metallic pings
    const rattleCount = 6 + intensity * 4;
    for (let i = 0; i < rattleCount; i++) {
      const offset = 0.05 + Math.random() * totalDur * 0.8;
      const freq = 800 + Math.random() * 4000;
      const dur = 0.01 + Math.random() * 0.03;
      const loudness = (0.08 + Math.random() * 0.1) * Math.max(0.1, 1 - offset / totalDur);
      if (loudness <= 0.001) continue;
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }

    // 5. ANVIL RESONANCE — low sustaining hum
    const anvil = this.#ctx.createOscillator();
    anvil.type = 'sawtooth';
    anvil.frequency.value = 110 * (1 + comboShift);
    const anvilF = this.#ctx.createBiquadFilter();
    anvilF.type = 'lowpass';
    anvilF.frequency.value = 400;
    const anvilEnv = this.#ctx.createGain();
    anvilEnv.gain.setValueAtTime(vol * 0.2, t);
    anvilEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + intensity * 0.1);
    anvil.connect(anvilF);
    anvilF.connect(anvilEnv);
    anvilEnv.connect(this.#masterGain);
    anvil.start(t);
    anvil.stop(t + 0.5 + intensity * 0.1);

    // 6. REVERB CLANG
    const revSrc = this.#ctx.createBufferSource();
    revSrc.buffer = this.#createNoiseBuffer(0.06);
    const revF = this.#ctx.createBiquadFilter();
    revF.type = 'bandpass';
    revF.frequency.value = 1500;
    revF.Q.value = 3;
    const revDelay = this.#ctx.createDelay();
    revDelay.delayTime.value = 0.04;
    const revFb = this.#ctx.createGain();
    revFb.gain.value = 0.35 + intensity * 0.05;
    const revEnv = this.#ctx.createGain();
    revEnv.gain.setValueAtTime(vol * 0.18, t + 0.02);
    revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.12);
    revSrc.connect(revF);
    revF.connect(revDelay);
    revDelay.connect(revFb);
    revFb.connect(revDelay);
    revDelay.connect(revEnv);
    revEnv.connect(this.#masterGain);
    revSrc.start(t + 0.02);
    revSrc.stop(t + 0.08);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  THEME: ICE — Crisp Crack & Frozen Shatter
  // ═══════════════════════════════════════════════════════════════════════

  #playIceCrack(t, intensity, totalDur, vol, comboShift) {
    // 1. SHARP CRACK — extremely crisp high-frequency transient
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.02);
    const crackF = this.#ctx.createBiquadFilter();
    crackF.type = 'highpass';
    crackF.frequency.value = 3000;
    const crackF2 = this.#ctx.createBiquadFilter();
    crackF2.type = 'peaking';
    crackF2.frequency.value = 6000;
    crackF2.Q.value = 3;
    crackF2.gain.value = 10;
    const crackEnv = this.#ctx.createGain();
    crackEnv.gain.setValueAtTime(vol, t);
    crackEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    crack.connect(crackF);
    crackF.connect(crackF2);
    crackF2.connect(crackEnv);
    crackEnv.connect(this.#masterGain);
    crack.start(t);
    crack.stop(t + 0.03);

    // 2. ICE RESONANCE — cold, hollow tones (detuned sine pair)
    const iceFreqs = [1760, 2349, 3136, 4186]; // A6, D7, G7, C8
    const iceCount = 2 + intensity;
    for (let i = 0; i < iceCount; i++) {
      const freq = iceFreqs[i % iceFreqs.length] * (0.98 + Math.random() * 0.04 + comboShift);
      const osc1 = this.#ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      const osc2 = this.#ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.005; // slight detune = cold shimmer
      const dur = 0.1 + Math.random() * 0.2;
      const env1 = this.#ctx.createGain();
      env1.gain.setValueAtTime(vol * 0.12, t + i * 0.01);
      env1.gain.exponentialRampToValueAtTime(0.001, t + i * 0.01 + dur);
      const env2 = this.#ctx.createGain();
      env2.gain.setValueAtTime(vol * 0.08, t + i * 0.01);
      env2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.01 + dur);
      osc1.connect(env1);
      env1.connect(this.#masterGain);
      osc2.connect(env2);
      env2.connect(this.#masterGain);
      osc1.start(t + i * 0.01);
      osc1.stop(t + i * 0.01 + dur + 0.01);
      osc2.start(t + i * 0.01);
      osc2.stop(t + i * 0.01 + dur + 0.01);
    }

    // 3. FRACTURE SPREAD — rapid crackling like ice splitting
    const fractureCount = 6 + intensity * 4;
    for (let i = 0; i < fractureCount; i++) {
      const offset = 0.01 + Math.random() * 0.15;
      const dur = 0.005 + Math.random() * 0.015;
      const src = this.#ctx.createBufferSource();
      src.buffer = this.#createNoiseBuffer(dur);
      const f = this.#ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 4000 + Math.random() * 8000;
      f.Q.value = 10 + Math.random() * 30;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(vol * (0.15 + Math.random() * 0.15), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      src.connect(f);
      f.connect(env);
      env.connect(this.#masterGain);
      src.start(t + offset);
      src.stop(t + offset + dur + 0.005);
    }

    // 4. FROZEN SHARD TINKLES — higher and thinner than glass
    const shardCount = 8 + intensity * 5;
    for (let i = 0; i < shardCount; i++) {
      const offset = 0.08 + Math.random() * totalDur * 0.85;
      const freq = 4000 + Math.random() * 12000;
      const dur = 0.01 + Math.random() * 0.025;
      const loudness = (0.06 + Math.random() * 0.08) * Math.max(0.1, 1 - offset / totalDur);
      if (loudness <= 0.001) continue;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
      env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
      osc.connect(env);
      env.connect(this.#masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + dur + 0.01);
    }

    // 5. CREAK — low grinding ice stress (slow sawtooth sweep)
    const creakDur = 0.15 + intensity * 0.05;
    const creak = this.#ctx.createOscillator();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(200, t + 0.02);
    creak.frequency.exponentialRampToValueAtTime(60, t + 0.02 + creakDur);
    const creakF = this.#ctx.createBiquadFilter();
    creakF.type = 'lowpass';
    creakF.frequency.value = 500;
    const creakEnv = this.#ctx.createGain();
    creakEnv.gain.setValueAtTime(vol * 0.2, t + 0.02);
    creakEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + creakDur);
    creak.connect(creakF);
    creakF.connect(creakEnv);
    creakEnv.connect(this.#masterGain);
    creak.start(t + 0.02);
    creak.stop(t + 0.02 + creakDur + 0.01);

    // 6. CRYSTALLINE SCATTER — airy frozen debris
    const scatDur = totalDur * 0.5;
    const scat = this.#ctx.createBufferSource();
    scat.buffer = this.#createNoiseBuffer(scatDur);
    const scatF = this.#ctx.createBiquadFilter();
    scatF.type = 'highpass';
    scatF.frequency.value = 7000;
    const scatEnv = this.#ctx.createGain();
    scatEnv.gain.setValueAtTime(0.001, t + 0.12);
    scatEnv.gain.linearRampToValueAtTime(vol * 0.1, t + 0.2);
    scatEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + scatDur);
    scat.connect(scatF);
    scatF.connect(scatEnv);
    scatEnv.connect(this.#masterGain);
    scat.start(t + 0.12);
    scat.stop(t + 0.12 + scatDur + 0.01);

    // 7. REVERB — icy echo
    const revSrc = this.#ctx.createBufferSource();
    revSrc.buffer = this.#createNoiseBuffer(0.06);
    const revF = this.#ctx.createBiquadFilter();
    revF.type = 'highpass';
    revF.frequency.value = 3500;
    const revDelay = this.#ctx.createDelay();
    revDelay.delayTime.value = 0.03;
    const revFb = this.#ctx.createGain();
    revFb.gain.value = 0.28 + intensity * 0.05;
    const revEnv = this.#ctx.createGain();
    revEnv.gain.setValueAtTime(vol * 0.15, t + 0.015);
    revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.12);
    revSrc.connect(revF);
    revF.connect(revDelay);
    revDelay.connect(revFb);
    revFb.connect(revDelay);
    revDelay.connect(revEnv);
    revEnv.connect(this.#masterGain);
    revSrc.start(t + 0.015);
    revSrc.stop(t + 0.075);
  }

  // ─── Level Up — "Triumphant Arpeggio" ─────────────────────────────────

  /**
   * Ascending major arpeggio C5→E5→G5→C6 with octave sparkle + shimmer burst.
   */
  playLevelUp() {
    if (!this.#ctx) return;
    const t = this.#now();

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

  // ─── Game Over — "Cathedral Collapse" ─────────────────────────────────

  /**
   * Descending minor chord + sub-bass rumble + staggered debris cascade + reverb tail.
   */
  playGameOver() {
    if (!this.#ctx) return;
    const t = this.#now();

    // Descending chord cluster (minor feel: G4, Bb4, C5)
    const chordFreqs = [392, 466.16, 523.25];
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

  // ─── Move — "Soft Nudge" ─────────────────────────────────────────────

  /**
   * Subtle, quiet sine blip for left/right movement. Very short so it
   * never intrudes even at fast DAS repeat rates.
   */
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

  // ─── Hold — "Whoosh" ─────────────────────────────────────────────────

  /**
   * Breathy bandpass sweep for hold/swap action.
   */
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

  // ─── Pause — "Tape Stop" ─────────────────────────────────────────────

  /**
   * Satisfying sawtooth slow-down with lowpass sweep.
   */
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

  // ─── Unpause — "Tape Start" ──────────────────────────────────────────

  /**
   * Reverse of pause — sawtooth ramp-up with opening lowpass.
   */
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

  // ─── Combo Hit — Ascending reward chime ───────────────────────────────

  /**
   * Escalating pitched chime per combo level. Higher combo = higher pitch.
   */
  playComboHit(combo) {
    if (!this.#ctx || combo < 2) return;
    const t = this.#now();
    // Base pitch rises with combo (C5, D5, E5, F5, G5, A5, B5, C6...)
    const semitones = Math.min(combo - 2, 12);
    const freq = 523.25 * Math.pow(2, semitones / 12);

    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(env);
    env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.21);

    // Octave harmonic for shimmer
    const harm = this.#ctx.createOscillator();
    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, t);
    const harmEnv = this.#ctx.createGain();
    harmEnv.gain.setValueAtTime(0.08, t);
    harmEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    harm.connect(harmEnv);
    harmEnv.connect(this.#masterGain);
    harm.start(t); harm.stop(t + 0.16);
  }

  // ─── T-Spin — Dramatic whoosh + power chime ──────────────────────────

  /**
   * Dramatic spinning whoosh followed by a resonant power chime.
   */
  playTSpin(type) {
    if (!this.#ctx) return;
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.22 : 0.12;

    // Whoosh — filtered noise sweep
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.3);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(300, t);
    bpf.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
    bpf.frequency.exponentialRampToValueAtTime(600, t + 0.2);
    bpf.Q.value = 2;
    const nEnv = this.#ctx.createGain();
    nEnv.gain.setValueAtTime(vol, t);
    nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(bpf);
    bpf.connect(nEnv);
    nEnv.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.26);

    // Power chime — perfect fifth interval
    if (isFull) {
      const freqs = [440, 660, 880]; // A4, E5, A5
      freqs.forEach((f, i) => {
        const osc = this.#ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = f;
        const g = this.#ctx.createGain();
        const start = t + 0.05 + i * 0.03;
        g.gain.setValueAtTime(0.15, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(g);
        g.connect(this.#masterGain);
        osc.start(start); osc.stop(start + 0.31);
      });
    }
  }

  // ─── Perfect Clear — Triumphant fanfare ──────────────────────────────

  /**
   * Major chord arpeggio with sparkle — triumphant celebration.
   */
  playPerfectClear() {
    if (!this.#ctx) return;
    const t = this.#now();
    // C major arpeggio: C5, E5, G5, C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.#ctx.createGain();
      const start = t + i * 0.08;
      g.gain.setValueAtTime(0.2, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(g);
      g.connect(this.#masterGain);
      osc.start(start); osc.stop(start + 0.51);

      // Shimmer octave
      const shim = this.#ctx.createOscillator();
      shim.type = 'triangle';
      shim.frequency.value = f * 2;
      const sg = this.#ctx.createGain();
      sg.gain.setValueAtTime(0.06, start);
      sg.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      shim.connect(sg);
      sg.connect(this.#masterGain);
      shim.start(start); shim.stop(start + 0.41);
    });

    // Sparkle noise tail
    const sparkle = this.#ctx.createBufferSource();
    sparkle.buffer = this.#createNoiseBuffer(0.5);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 6000;
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0.08, t + 0.2);
    sEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    sparkle.connect(hpf);
    hpf.connect(sEnv);
    sEnv.connect(this.#masterGain);
    sparkle.start(t + 0.2); sparkle.stop(t + 0.71);
  }

  // ─── Back-to-Back — Emphatic power chord ─────────────────────────────

  /**
   * Stacked power chord with sub emphasis.
   */
  playBackToBack() {
    if (!this.#ctx) return;
    const t = this.#now();
    // Power chord: root + fifth
    const freqs = [220, 330, 440]; // A3, E4, A4
    freqs.forEach((f, i) => {
      const osc = this.#ctx.createOscillator();
      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.value = f;
      const g = this.#ctx.createGain();
      g.gain.setValueAtTime(i === 0 ? 0.1 : 0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g);
      g.connect(this.#masterGain);
      osc.start(t); osc.stop(t + 0.26);
    });
  }

  // ─── Danger Pulse — Audible warning heartbeat ────────────────────────

  /**
   * Warning tone that gets louder and higher as danger increases (1–10).
   * Uses mid-range frequencies so it's clearly audible on all speakers.
   */
  playDangerPulse(intensity) {
    if (!this.#ctx || intensity < 1) return;
    const t = this.#now();
    const i = Math.min(intensity, 10);
    // Pitch rises from ~150Hz to ~350Hz with danger
    const freq = 150 + i * 20;
    // Volume ramps from barely audible to clearly noticeable
    const vol = 0.03 + i * 0.015;

    // Layer 1: Deep pulse (the "heartbeat" body)
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.25);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.linearRampToValueAtTime(vol * 1.3, t + 0.06);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(env);
    env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.31);

    // Layer 2: Higher alarm tone (audible on laptop speakers)
    if (i >= 4) {
      const alarmFreq = 400 + i * 40;
      const alarm = this.#ctx.createOscillator();
      alarm.type = 'triangle';
      alarm.frequency.setValueAtTime(alarmFreq, t);
      alarm.frequency.exponentialRampToValueAtTime(alarmFreq * 0.8, t + 0.15);
      const alarmEnv = this.#ctx.createGain();
      const alarmVol = 0.02 + (i - 4) * 0.01;
      alarmEnv.gain.setValueAtTime(alarmVol, t);
      alarmEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      alarm.connect(alarmEnv);
      alarmEnv.connect(this.#masterGain);
      alarm.start(t); alarm.stop(t + 0.21);
    }

    // Layer 3: Noise crackle at extreme danger
    if (i >= 7) {
      const noise = this.#ctx.createBufferSource();
      noise.buffer = this.#createNoiseBuffer(0.1);
      const nf = this.#ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 800;
      nf.Q.value = 2;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.03, t);
      ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      noise.connect(nf);
      nf.connect(ne);
      ne.connect(this.#masterGain);
      noise.start(t); noise.stop(t + 0.11);
    }
  }

  // ─── Row Highlight Sound — theme-aware anticipation ──────────────────

  /**
   * Sound when a row starts glowing before clearing. Dispatches to theme.
   */
  playRowHighlight(rowIndex = 0) {
    if (!this.#ctx) return;
    const t = this.#now();
    const pitch = 0.95 + Math.random() * 0.1; // ±5% micro-variation

    switch (this.#soundTheme) {
      case 'concrete': this.#rowHighlightConcrete(t, rowIndex, pitch); break;
      case 'crystal':  this.#rowHighlightCrystal(t, rowIndex, pitch); break;
      case 'metal':    this.#rowHighlightMetal(t, rowIndex, pitch); break;
      case 'ice':      this.#rowHighlightIce(t, rowIndex, pitch); break;
      default:         this.#rowHighlightGlass(t, rowIndex, pitch); break;
    }
  }

  #rowHighlightGlass(t, rowIndex, pitch) {
    // Realistic glass stress creak — crackling, no tonal whistle
    // Layer 1: Glass micro-fracture crackle (noise-only, no sine)
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.5);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 3000 + rowIndex * 800; cf.Q.value = 1.5;
    const ce = this.#ctx.createGain();
    // Intermittent crackling — sounds like glass fracturing
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.02);
    ce.gain.setValueAtTime(0.03, t + 0.08);
    ce.gain.linearRampToValueAtTime(0.12, t + 0.12);
    ce.gain.setValueAtTime(0.02, t + 0.2);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.25);
    ce.gain.setValueAtTime(0.01, t + 0.35);
    ce.gain.linearRampToValueAtTime(0.08, t + 0.38);
    ce.gain.linearRampToValueAtTime(0, t + 0.5);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.55);

    // Layer 2: High-freq glass crinkle (very short bursts)
    const crinkle = this.#ctx.createBufferSource();
    crinkle.buffer = this.#createNoiseBuffer(0.4);
    const crf = this.#ctx.createBiquadFilter();
    crf.type = 'highpass'; crf.frequency.value = 6000;
    const cre = this.#ctx.createGain();
    cre.gain.setValueAtTime(0, t);
    cre.gain.linearRampToValueAtTime(0.04, t + 0.05);
    cre.gain.setValueAtTime(0.01, t + 0.15);
    cre.gain.linearRampToValueAtTime(0.05, t + 0.2);
    cre.gain.linearRampToValueAtTime(0, t + 0.45);
    crinkle.connect(crf); crf.connect(cre); cre.connect(this.#masterGain);
    crinkle.start(t); crinkle.stop(t + 0.5);

    // Layer 3: Sub-bass tension (felt, not heard)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 45 + rowIndex * 8;
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0, t);
    sEnv.gain.linearRampToValueAtTime(0.1, t + 0.1);
    sEnv.gain.linearRampToValueAtTime(0, t + 0.5);
    sub.connect(sEnv); sEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.55);
  }

  #rowHighlightConcrete(t, rowIndex, pitch) {
    // Realistic pre-demolition stress — rumbling, cracking
    // Layer 1: Deep structural groan
    const groanFreq = (40 + rowIndex * 12) * pitch;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(groanFreq, t);
    osc.frequency.linearRampToValueAtTime(groanFreq * 0.7, t + 0.5);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 200;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.18, t + 0.08);
    env.gain.setValueAtTime(0.18, t + 0.3);
    env.gain.linearRampToValueAtTime(0, t + 0.55);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.6);

    // Layer 2: Concrete cracking noise — gritty, low-mid frequency
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.5);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 300 + rowIndex * 50; cf.Q.value = 0.8;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.05);
    ce.gain.setValueAtTime(0.04, t + 0.15);
    ce.gain.linearRampToValueAtTime(0.12, t + 0.25);
    ce.gain.linearRampToValueAtTime(0, t + 0.5);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.55);

    // Layer 3: Rebar stress (metallic undertone)
    const rebar = this.#ctx.createOscillator();
    rebar.type = 'square';
    rebar.frequency.value = 120 * pitch;
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 150; rf.Q.value = 8;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0, t);
    re.gain.linearRampToValueAtTime(0.04, t + 0.15);
    re.gain.linearRampToValueAtTime(0, t + 0.45);
    rebar.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rebar.start(t); rebar.stop(t + 0.5);
  }

  #rowHighlightCrystal(t, rowIndex, pitch) {
    // Crystal resonance building — like a wine glass being rubbed
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    const base = notes[Math.min(rowIndex, 3)] * pitch;
    // Layer 1: Swelling pure tone
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.2);
    env.gain.setValueAtTime(0.12, t + 0.3);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(env); env.connect(this.#masterGain);
    this.#addReverb(env, 0.8, 0.3, 0.15);
    osc.start(t); osc.stop(t + 0.65);

    // Layer 2: Perfect fifth harmonic
    const h5 = this.#ctx.createOscillator();
    h5.type = 'sine';
    h5.frequency.value = base * 1.5;
    const h5e = this.#ctx.createGain();
    h5e.gain.setValueAtTime(0, t + 0.05);
    h5e.gain.linearRampToValueAtTime(0.05, t + 0.2);
    h5e.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    h5.connect(h5e); h5e.connect(this.#masterGain);
    h5.start(t + 0.05); h5.stop(t + 0.6);

    // Layer 3: High shimmer
    const shim = this.#ctx.createOscillator();
    shim.type = 'sine';
    shim.frequency.value = base * 3;
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0, t + 0.1);
    se.gain.linearRampToValueAtTime(0.025, t + 0.25);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    shim.connect(se); se.connect(this.#masterGain);
    shim.start(t + 0.1); shim.stop(t + 0.55);
  }

  #rowHighlightMetal(t, rowIndex, pitch) {
    // Metal stress — like a steel beam bending under load
    // Layer 1: Deep metallic groan (low square through resonant filter)
    const freq = (80 + rowIndex * 30) * pitch;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 1.3, t + 0.5);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq * 2; filter.Q.value = 6;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.1);
    env.gain.setValueAtTime(0.12, t + 0.35);
    env.gain.linearRampToValueAtTime(0, t + 0.55);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.6);

    // Layer 2: Metallic rattle (filtered noise simulating vibration)
    const rattle = this.#ctx.createBufferSource();
    rattle.buffer = this.#createNoiseBuffer(0.4);
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 800 + rowIndex * 200; rf.Q.value = 10;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0, t);
    re.gain.linearRampToValueAtTime(0.06, t + 0.08);
    re.gain.setValueAtTime(0.02, t + 0.2);
    re.gain.linearRampToValueAtTime(0.07, t + 0.3);
    re.gain.linearRampToValueAtTime(0, t + 0.5);
    rattle.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rattle.start(t); rattle.stop(t + 0.55);

    // Layer 3: Sub vibration
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 40 * pitch;
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0, t);
    sEnv.gain.linearRampToValueAtTime(0.1, t + 0.1);
    sEnv.gain.linearRampToValueAtTime(0, t + 0.5);
    sub.connect(sEnv); sEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.55);
  }

  #rowHighlightIce(t, rowIndex, pitch) {
    // Ice cracking under pressure — sharp cracks, no whistle
    // Layer 1: Short sharp crack bursts (pitch-dropped noise, not sine)
    const crack1 = this.#ctx.createBufferSource();
    crack1.buffer = this.#createNoiseBuffer(0.06);
    const c1f = this.#ctx.createBiquadFilter();
    c1f.type = 'bandpass'; c1f.frequency.value = 4000 + rowIndex * 500; c1f.Q.value = 2;
    const c1e = this.#ctx.createGain();
    c1e.gain.setValueAtTime(0.15, t);
    c1e.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    crack1.connect(c1f); c1f.connect(c1e); c1e.connect(this.#masterGain);
    crack1.start(t); crack1.stop(t + 0.06);

    // Second crack after a gap
    const crack2 = this.#ctx.createBufferSource();
    crack2.buffer = this.#createNoiseBuffer(0.05);
    const c2f = this.#ctx.createBiquadFilter();
    c2f.type = 'highpass'; c2f.frequency.value = 5000;
    const c2e = this.#ctx.createGain();
    c2e.gain.setValueAtTime(0.12, t + 0.15);
    c2e.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    crack2.connect(c2f); c2f.connect(c2e); c2e.connect(this.#masterGain);
    crack2.start(t + 0.15); crack2.stop(t + 0.22);

    // Layer 2: Creaking ice noise (broadband, slow swell)
    const creak = this.#ctx.createBufferSource();
    creak.buffer = this.#createNoiseBuffer(0.4);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 2000 + rowIndex * 400; cf.Q.value = 1;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.06, t + 0.08);
    ce.gain.setValueAtTime(0.02, t + 0.18);
    ce.gain.linearRampToValueAtTime(0.07, t + 0.25);
    ce.gain.linearRampToValueAtTime(0, t + 0.45);
    creak.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    creak.start(t); creak.stop(t + 0.5);

    // Layer 3: Low sub-ice rumble (frozen lake groaning)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40 * pitch, t);
    sub.frequency.linearRampToValueAtTime(30 * pitch, t + 0.4);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0, t);
    se.gain.linearRampToValueAtTime(0.1, t + 0.08);
    se.gain.linearRampToValueAtTime(0, t + 0.45);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.5);
  }

  // ─── Per-Cell Pop Sound — theme-aware sweep ──────────────────────────

  /**
   * Per-cell sound as each block vanishes left-to-right. Dispatches to theme.
   */
  playCellPop(col, totalCols = 10) {
    if (!this.#ctx) return;
    const t = this.#now();
    const progress = col / totalCols;
    const pitch = 0.95 + Math.random() * 0.1; // micro-variation

    switch (this.#soundTheme) {
      case 'concrete': this.#cellPopConcrete(t, progress, pitch); break;
      case 'crystal':  this.#cellPopCrystal(t, progress, pitch); break;
      case 'metal':    this.#cellPopMetal(t, progress, pitch); break;
      case 'ice':      this.#cellPopIce(t, progress, pitch); break;
      default:         this.#cellPopGlass(t, progress, pitch); break;
    }
  }

  #cellPopGlass(t, progress, pitch) {
    // Realistic glass shard breaking off — sharp transient + tinkle ring-out
    const freq = (1800 + progress * 2500) * pitch;

    // Layer 1: Sharp transient crack (< 5ms attack)
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.025);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'highpass'; cf.frequency.value = 3000 + progress * 3000;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.2, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.03);

    // Layer 2: Glass resonance ring (sine with natural decay)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = freq;
    const ringEnv = this.#ctx.createGain();
    ringEnv.gain.setValueAtTime(0.14, t);
    ringEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    ring.connect(ringEnv); ringEnv.connect(this.#masterGain);
    this.#addReverb(ringEnv, 0.3, 0.2, 0.08);
    ring.start(t); ring.stop(t + 0.22);

    // Layer 3: Octave overtone (glass has strong harmonics)
    const harm = this.#ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 2.3;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.04, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    harm.connect(he); he.connect(this.#masterGain);
    harm.start(t); harm.stop(t + 0.12);
  }

  #cellPopConcrete(t, progress, pitch) {
    // Concrete chunk breaking — heavy thud + rubble scatter
    const freq = (60 + progress * 40) * pitch;

    // Layer 1: Impact thud (you feel it)
    const thud = this.#ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(freq, t);
    thud.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.06);
    const te = this.#ctx.createGain();
    te.gain.setValueAtTime(0.25, t);
    te.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    thud.connect(te); te.connect(this.#masterGain);
    thud.start(t); thud.stop(t + 0.09);

    // Layer 2: Rubble/gravel scatter (broadband noise, mid-freq)
    const rubble = this.#ctx.createBufferSource();
    rubble.buffer = this.#createNoiseBuffer(0.08);
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 600 + progress * 500; rf.Q.value = 1.5;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.15, t + 0.005);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    rubble.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rubble.start(t + 0.005); rubble.stop(t + 0.08);

    // Layer 3: Dust puff (very high noise, faint)
    const dust = this.#ctx.createBufferSource();
    dust.buffer = this.#createNoiseBuffer(0.04);
    const df = this.#ctx.createBiquadFilter();
    df.type = 'highpass'; df.frequency.value = 2000;
    const de = this.#ctx.createGain();
    de.gain.setValueAtTime(0.05, t + 0.01);
    de.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    dust.connect(df); df.connect(de); de.connect(this.#masterGain);
    dust.start(t + 0.01); dust.stop(t + 0.06);
  }

  #cellPopCrystal(t, progress, pitch) {
    // Crystal chime — pure bell tone with harmonic singing
    const note = (1047 + progress * 1047) * pitch; // C6 rising to C7

    // Layer 1: Pure bell fundamental
    const bell = this.#ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = note;
    const bEnv = this.#ctx.createGain();
    bEnv.gain.setValueAtTime(0.12, t);
    bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    bell.connect(bEnv); bEnv.connect(this.#masterGain);
    this.#addReverb(bEnv, 0.5, 0.3, 0.12);
    bell.start(t); bell.stop(t + 0.38);

    // Layer 2: Perfect fifth harmonic (bell-like inharmonic partial)
    const h5 = this.#ctx.createOscillator();
    h5.type = 'sine';
    h5.frequency.value = note * 1.5;
    const h5e = this.#ctx.createGain();
    h5e.gain.setValueAtTime(0.05, t);
    h5e.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    h5.connect(h5e); h5e.connect(this.#masterGain);
    h5.start(t); h5.stop(t + 0.28);

    // Layer 3: Inharmonic bell partial (× 2.76 — real bells have these)
    const ih = this.#ctx.createOscillator();
    ih.type = 'sine';
    ih.frequency.value = note * 2.76;
    const ihe = this.#ctx.createGain();
    ihe.gain.setValueAtTime(0.02, t);
    ihe.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    ih.connect(ihe); ihe.connect(this.#masterGain);
    ih.start(t); ih.stop(t + 0.18);

    // Layer 4: Tiny attack transient
    const click = this.#ctx.createBufferSource();
    click.buffer = this.#createNoiseBuffer(0.004);
    const cke = this.#ctx.createGain();
    cke.gain.setValueAtTime(0.08, t);
    cke.gain.exponentialRampToValueAtTime(0.001, t + 0.004);
    click.connect(cke); cke.connect(this.#masterGain);
    click.start(t); click.stop(t + 0.006);
  }

  #cellPopMetal(t, progress, pitch) {
    // Metal shard clanging — resonant ping + rattle
    const freq = (300 + progress * 600) * pitch;

    // Layer 1: Sharp metallic transient
    const hit = this.#ctx.createBufferSource();
    hit.buffer = this.#createNoiseBuffer(0.01);
    const hf = this.#ctx.createBiquadFilter();
    hf.type = 'bandpass'; hf.frequency.value = freq * 4; hf.Q.value = 12;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.2, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    hit.connect(hf); hf.connect(he); he.connect(this.#masterGain);
    hit.start(t); hit.stop(t + 0.02);

    // Layer 2: Resonant ring (metal has high-Q resonances)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sawtooth';
    ring.frequency.value = freq;
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = freq * 3; rf.Q.value = 15;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.1, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    ring.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    this.#addReverb(re, 0.25, 0.2, 0.06);
    ring.start(t); ring.stop(t + 0.2);

    // Layer 3: Sub-clank (felt impact)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.25, t);
    sub.frequency.exponentialRampToValueAtTime(freq * 0.1, t + 0.05);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.12, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.07);
  }

  #cellPopIce(t, progress, pitch) {
    // Ice crystal snapping — sharp crack + sparkle
    const freq = (3000 + progress * 4000) * pitch;

    // Layer 1: Sharp snap (< 3ms — sounds like ice cracking)
    const snap = this.#ctx.createOscillator();
    snap.type = 'sine';
    snap.frequency.setValueAtTime(freq, t);
    snap.frequency.exponentialRampToValueAtTime(freq * 0.2, t + 0.02);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.16, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    snap.connect(se); se.connect(this.#masterGain);
    snap.start(t); snap.stop(t + 0.035);

    // Layer 2: Ice shard tinkle (high-pass noise burst)
    const shard = this.#ctx.createBufferSource();
    shard.buffer = this.#createNoiseBuffer(0.04);
    const sf = this.#ctx.createBiquadFilter();
    sf.type = 'highpass'; sf.frequency.value = 8000;
    const sf2 = this.#ctx.createBiquadFilter();
    sf2.type = 'peaking'; sf2.frequency.value = 10000 + progress * 2000; sf2.gain.value = 8; sf2.Q.value = 3;
    const she = this.#ctx.createGain();
    she.gain.setValueAtTime(0.07, t);
    she.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    shard.connect(sf); sf.connect(sf2); sf2.connect(she); she.connect(this.#masterGain);
    shard.start(t); shard.stop(t + 0.045);

    // Layer 3: Tiny resonant ring (ice has crystalline resonance)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = freq * 0.7;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.04, t + 0.005);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t + 0.005); ring.stop(t + 0.09);
  }

  // ─── Row Cleared Sound — theme-aware completion ──────────────────────

  /**
   * Completion sound when an entire row finishes vanishing.
   */
  playRowCleared(rowIndex = 0) {
    if (!this.#ctx) return;
    const t = this.#now();
    const pitch = 0.95 + Math.random() * 0.1;

    switch (this.#soundTheme) {
      case 'concrete': this.#rowClearedConcrete(t, rowIndex, pitch); break;
      case 'crystal':  this.#rowClearedCrystal(t, rowIndex, pitch); break;
      case 'metal':    this.#rowClearedMetal(t, rowIndex, pitch); break;
      case 'ice':      this.#rowClearedIce(t, rowIndex, pitch); break;
      default:         this.#rowClearedGlass(t, rowIndex, pitch); break;
    }
  }

  #rowClearedGlass(t, rowIndex, pitch) {
    // Full glass panel shattering — the big satisfying break
    // Layer 1: Cascading shatter (long noise with frequency sweep)
    const shatter = this.#ctx.createBufferSource();
    shatter.buffer = this.#createNoiseBuffer(0.5);
    const sf = this.#ctx.createBiquadFilter();
    sf.type = 'bandpass'; sf.frequency.value = 5000; sf.Q.value = 0.8;
    sf.frequency.setValueAtTime(5000, t);
    sf.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.25, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    shatter.connect(sf); sf.connect(se); se.connect(this.#masterGain);
    this.#addReverb(se, 0.6, 0.25, 0.15);
    shatter.start(t); shatter.stop(t + 0.55);

    // Layer 2: Glass shards bouncing (multiple tiny high-freq pings)
    const shardCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shardCount; i++) {
      const shard = this.#ctx.createOscillator();
      shard.type = 'sine';
      shard.frequency.value = (2000 + Math.random() * 4000) * pitch;
      const shEnv = this.#ctx.createGain();
      const st = t + 0.03 + i * 0.04 + Math.random() * 0.02;
      shEnv.gain.setValueAtTime(0.06, st);
      shEnv.gain.exponentialRampToValueAtTime(0.001, st + 0.06 + Math.random() * 0.04);
      shard.connect(shEnv); shEnv.connect(this.#masterGain);
      shard.start(st); shard.stop(st + 0.12);
    }

    // Layer 3: Reward chime (musical confirmation — escalates per row)
    const chordFreqs = [523, 659, 784, 1047];
    const reward = chordFreqs[Math.min(rowIndex, 3)] * pitch;
    const chime = this.#ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.value = reward;
    const chEnv = this.#ctx.createGain();
    chEnv.gain.setValueAtTime(0, t + 0.02);
    chEnv.gain.linearRampToValueAtTime(0.15, t + 0.04);
    chEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    chime.connect(chEnv); chEnv.connect(this.#masterGain);
    this.#addReverb(chEnv, 0.5, 0.2, 0.08);
    chime.start(t + 0.02); chime.stop(t + 0.65);

    // Layer 4: Sub impact (weight)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 50 + rowIndex * 8;
    const subEnv = this.#ctx.createGain();
    subEnv.gain.setValueAtTime(0.15, t);
    subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    sub.connect(subEnv); subEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.13);
  }

  #rowClearedConcrete(t, rowIndex, pitch) {
    // Building floor collapsing — heavy impact + rubble cascade
    // Layer 1: Massive impact thud
    const impact = this.#ctx.createOscillator();
    impact.type = 'sine';
    impact.frequency.setValueAtTime((50 + rowIndex * 10) * pitch, t);
    impact.frequency.exponentialRampToValueAtTime(25, t + 0.25);
    const ie = this.#ctx.createGain();
    ie.gain.setValueAtTime(0.4, t);
    ie.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    impact.connect(ie); ie.connect(this.#masterGain);
    impact.start(t); impact.stop(t + 0.35);

    // Layer 2: Mid-body crunch (the concrete breaking apart)
    const crunch = this.#ctx.createBufferSource();
    crunch.buffer = this.#createNoiseBuffer(0.4);
    const crf = this.#ctx.createBiquadFilter();
    crf.type = 'bandpass'; crf.frequency.value = 400; crf.Q.value = 0.7;
    crf.frequency.setValueAtTime(600, t);
    crf.frequency.exponentialRampToValueAtTime(200, t + 0.35);
    const cre = this.#ctx.createGain();
    cre.gain.setValueAtTime(0.2, t);
    cre.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    crunch.connect(crf); crf.connect(cre); cre.connect(this.#masterGain);
    crunch.start(t); crunch.stop(t + 0.45);

    // Layer 3: Rubble cascade (delayed scatter — debris bouncing)
    const debris = this.#ctx.createBufferSource();
    debris.buffer = this.#createNoiseBuffer(0.3);
    const df = this.#ctx.createBiquadFilter();
    df.type = 'bandpass'; df.frequency.value = 800; df.Q.value = 1.2;
    const de = this.#ctx.createGain();
    de.gain.setValueAtTime(0, t + 0.05);
    de.gain.linearRampToValueAtTime(0.12, t + 0.08);
    de.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    debris.connect(df); df.connect(de); de.connect(this.#masterGain);
    this.#addReverb(de, 0.4, 0.15, 0.08);
    debris.start(t + 0.05); debris.stop(t + 0.4);

    // Layer 4: Dust whoosh (very faint high noise trailing off)
    const dust = this.#ctx.createBufferSource();
    dust.buffer = this.#createNoiseBuffer(0.3);
    const dustf = this.#ctx.createBiquadFilter();
    dustf.type = 'highpass'; dustf.frequency.value = 1500;
    const duste = this.#ctx.createGain();
    duste.gain.setValueAtTime(0, t + 0.08);
    duste.gain.linearRampToValueAtTime(0.05, t + 0.12);
    duste.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    dust.connect(dustf); dustf.connect(duste); duste.connect(this.#masterGain);
    dust.start(t + 0.08); dust.stop(t + 0.45);
  }

  #rowClearedCrystal(t, rowIndex, pitch) {
    // Crystal bowl singing — rich harmonic chord with long reverb tail
    const chordFreqs = [523, 659, 784, 1047];
    const base = chordFreqs[Math.min(rowIndex, 3)] * pitch;
    const intervals = [1, 1.25, 1.5, 2]; // root, M3, P5, octave

    // Layer 1: Full major chord with staggered entry
    for (let i = 0; i < intervals.length; i++) {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * intervals[i];
      const env = this.#ctx.createGain();
      const st = t + i * 0.025;
      env.gain.setValueAtTime(0, st);
      env.gain.linearRampToValueAtTime(0.1, st + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, st + 0.8);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(st); osc.stop(st + 0.85);
    }

    // Layer 2: Shimmer (high inharmonic partials — crystal bowl character)
    const shim = this.#ctx.createOscillator();
    shim.type = 'sine';
    shim.frequency.value = base * 3.76; // inharmonic partial
    const shEnv = this.#ctx.createGain();
    shEnv.gain.setValueAtTime(0.03, t);
    shEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    shim.connect(shEnv); shEnv.connect(this.#masterGain);
    this.#addReverb(shEnv, 0.8, 0.35, 0.15);
    shim.start(t); shim.stop(t + 0.55);

    // Layer 3: Soft air transient
    const air = this.#ctx.createBufferSource();
    air.buffer = this.#createNoiseBuffer(0.01);
    const ae = this.#ctx.createGain();
    ae.gain.setValueAtTime(0.06, t);
    ae.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
    air.connect(ae); ae.connect(this.#masterGain);
    air.start(t); air.stop(t + 0.015);
  }

  #rowClearedMetal(t, rowIndex, pitch) {
    // Heavy metal structure collapsing — clang + ring + debris
    const freq = (150 + rowIndex * 60) * pitch;

    // Layer 1: Heavy impact clang
    const clang = this.#ctx.createOscillator();
    clang.type = 'sawtooth';
    clang.frequency.value = freq;
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = freq * 3; cf.Q.value = 12;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.22, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    clang.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    this.#addReverb(ce, 0.5, 0.3, 0.1);
    clang.start(t); clang.stop(t + 0.5);

    // Layer 2: Impact transient (hammer on anvil)
    const hit = this.#ctx.createBufferSource();
    hit.buffer = this.#createNoiseBuffer(0.015);
    const hf = this.#ctx.createBiquadFilter();
    hf.type = 'bandpass'; hf.frequency.value = freq * 6; hf.Q.value = 8;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.25, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    hit.connect(hf); hf.connect(he); he.connect(this.#masterGain);
    hit.start(t); hit.stop(t + 0.025);

    // Layer 3: Metallic debris rattle (multiple resonant noise hits)
    for (let i = 0; i < 3; i++) {
      const rattle = this.#ctx.createBufferSource();
      rattle.buffer = this.#createNoiseBuffer(0.03);
      const rf = this.#ctx.createBiquadFilter();
      rf.type = 'bandpass';
      rf.frequency.value = (500 + Math.random() * 1500) * pitch;
      rf.Q.value = 12 + Math.random() * 5;
      const re = this.#ctx.createGain();
      const st = t + 0.04 + i * 0.05 + Math.random() * 0.02;
      re.gain.setValueAtTime(0.06, st);
      re.gain.exponentialRampToValueAtTime(0.001, st + 0.04);
      rattle.connect(rf); rf.connect(re); re.connect(this.#masterGain);
      rattle.start(st); rattle.stop(st + 0.05);
    }

    // Layer 4: Sub bass thud
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(45, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.15);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.2, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.18);
  }

  #rowClearedIce(t, rowIndex, pitch) {
    // Ice shelf collapsing — dramatic crack + cascade of ice shards
    // Layer 1: Big crack (sharp pitch-drop)
    const crackFreq = (4000 + rowIndex * 500) * pitch;
    const crack = this.#ctx.createOscillator();
    crack.type = 'sine';
    crack.frequency.setValueAtTime(crackFreq, t);
    crack.frequency.exponentialRampToValueAtTime(crackFreq * 0.1, t + 0.08);
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.25, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    crack.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.12);

    // Layer 2: Long ice shatter noise (frequency sweep high→low)
    const shatter = this.#ctx.createBufferSource();
    shatter.buffer = this.#createNoiseBuffer(0.4);
    const sf = this.#ctx.createBiquadFilter();
    sf.type = 'bandpass'; sf.Q.value = 1.5;
    sf.frequency.setValueAtTime(8000, t);
    sf.frequency.exponentialRampToValueAtTime(1500, t + 0.35);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.18, t + 0.01);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    shatter.connect(sf); sf.connect(se); se.connect(this.#masterGain);
    this.#addReverb(se, 0.5, 0.2, 0.1);
    shatter.start(t); shatter.stop(t + 0.45);

    // Layer 3: Cascading ice shard tinkles (randomized high pings)
    const shardCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < shardCount; i++) {
      const tink = this.#ctx.createOscillator();
      tink.type = 'sine';
      tink.frequency.value = (4000 + Math.random() * 6000) * pitch;
      const te = this.#ctx.createGain();
      const st = t + 0.02 + i * 0.03 + Math.random() * 0.025;
      te.gain.setValueAtTime(0.04 + Math.random() * 0.03, st);
      te.gain.exponentialRampToValueAtTime(0.001, st + 0.05 + Math.random() * 0.05);
      tink.connect(te); te.connect(this.#masterGain);
      tink.start(st); tink.stop(st + 0.12);
    }

    // Layer 4: Deep ice groan (sub-bass for weight)
    const groan = this.#ctx.createOscillator();
    groan.type = 'sine';
    groan.frequency.setValueAtTime(50 * pitch, t);
    groan.frequency.linearRampToValueAtTime(30, t + 0.3);
    const ge = this.#ctx.createGain();
    ge.gain.setValueAtTime(0.12, t);
    ge.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    groan.connect(ge); ge.connect(this.#masterGain);
    groan.start(t); groan.stop(t + 0.35);
  }
}

export { SoundEngine, SOUND_THEMES };
