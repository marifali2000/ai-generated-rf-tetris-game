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
    const baseFreq = 120 + rowIndex * 40;
    const vol = 0.15;

    switch (this.#soundTheme) {
      case 'concrete': this.#rowHighlightConcrete(t, baseFreq, vol, rowIndex); break;
      case 'crystal':  this.#rowHighlightCrystal(t, baseFreq, vol, rowIndex); break;
      case 'metal':    this.#rowHighlightMetal(t, baseFreq, vol, rowIndex); break;
      case 'ice':      this.#rowHighlightIce(t, baseFreq, vol, rowIndex); break;
      default:         this.#rowHighlightGlass(t, baseFreq, vol, rowIndex); break;
    }
  }

  #rowHighlightGlass(t, baseFreq, vol, rowIndex) {
    // Glass: high shimmer building
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 4, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 6, t + 0.7);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.4, t + 0.1);
    env.gain.linearRampToValueAtTime(0, t + 0.8);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.85);
    // Sub rumble
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(baseFreq, t);
    sub.frequency.linearRampToValueAtTime(baseFreq * 1.3, t + 0.6);
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0, t);
    sEnv.gain.linearRampToValueAtTime(vol, t + 0.1);
    sEnv.gain.linearRampToValueAtTime(0, t + 0.8);
    sub.connect(sEnv); sEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.85);
  }

  #rowHighlightConcrete(t, baseFreq, vol, rowIndex) {
    // Concrete: deep grinding rumble
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq * 0.5, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, t + 0.7);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + 0.15);
    env.gain.linearRampToValueAtTime(0, t + 0.8);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.85);
    // Crackle noise
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.5);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 200; nf.Q.value = 1;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0, t);
    ne.gain.linearRampToValueAtTime(vol * 0.3, t + 0.1);
    ne.gain.linearRampToValueAtTime(0, t + 0.6);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.65);
  }

  #rowHighlightCrystal(t, baseFreq, vol, rowIndex) {
    // Crystal: ascending bell-like arpeggios
    const notes = [1, 1.25, 1.5, 2]; // major chord intervals
    for (let i = 0; i < notes.length; i++) {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * 3 * notes[i];
      const env = this.#ctx.createGain();
      const startT = t + i * 0.12;
      env.gain.setValueAtTime(0, startT);
      env.gain.linearRampToValueAtTime(vol * 0.5, startT + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, startT + 0.25);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(startT); osc.stop(startT + 0.3);
    }
  }

  #rowHighlightMetal(t, baseFreq, vol, rowIndex) {
    // Metal: industrial hum building
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.8, t + 0.7);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 400;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.6, t + 0.15);
    env.gain.linearRampToValueAtTime(0, t + 0.8);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.85);
  }

  #rowHighlightIce(t, baseFreq, vol, rowIndex) {
    // Ice: high-pitched creak
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 8, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 5, t + 0.5);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol * 0.3, t + 0.05);
    env.gain.linearRampToValueAtTime(0, t + 0.6);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.65);
    // Sub crackle
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.3);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'highpass'; nf.frequency.value = 4000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0, t);
    ne.gain.linearRampToValueAtTime(vol * 0.2, t + 0.05);
    ne.gain.linearRampToValueAtTime(0, t + 0.4);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.45);
  }

  // ─── Per-Cell Pop Sound — theme-aware sweep ──────────────────────────

  /**
   * Per-cell sound as each block vanishes left-to-right. Dispatches to theme.
   */
  playCellPop(col, totalCols = 10) {
    if (!this.#ctx) return;
    const t = this.#now();
    const progress = col / totalCols; // 0 to 1 across row

    switch (this.#soundTheme) {
      case 'concrete': this.#cellPopConcrete(t, progress); break;
      case 'crystal':  this.#cellPopCrystal(t, progress); break;
      case 'metal':    this.#cellPopMetal(t, progress); break;
      case 'ice':      this.#cellPopIce(t, progress); break;
      default:         this.#cellPopGlass(t, progress); break;
    }
  }

  #cellPopGlass(t, progress) {
    // Glass: rising crystalline tink
    const freq = 800 + progress * 1200;
    const v = 1 + (Math.random() - 0.5) * 0.06;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * v;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.14, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.13);
    // Glass shard noise
    const click = this.#ctx.createBufferSource();
    click.buffer = this.#createNoiseBuffer(0.015);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'highpass'; cf.frequency.value = 4000;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.07, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    click.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    click.start(t); click.stop(t + 0.02);
  }

  #cellPopConcrete(t, progress) {
    // Concrete: chunky thud getting shorter
    const freq = 80 + progress * 60;
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.09);
    // Dust crumble
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.04);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 500 + progress * 400; nf.Q.value = 2;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.05);
  }

  #cellPopCrystal(t, progress) {
    // Crystal: bell chime rising in pitch
    const freq = 1047 + progress * 1047; // C6 to C7
    const v = 1 + (Math.random() - 0.5) * 0.04;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * v;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.21);
    // Harmonic shimmer
    const h = this.#ctx.createOscillator();
    h.type = 'sine';
    h.frequency.value = freq * 2.5 * v;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.04, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    h.connect(he); he.connect(this.#masterGain);
    h.start(t); h.stop(t + 0.13);
  }

  #cellPopMetal(t, progress) {
    // Metal: metallic ping rising
    const freq = 400 + progress * 800;
    const v = 1 + (Math.random() - 0.5) * 0.08;
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq * v;
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq * 2; filter.Q.value = 5;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.11);
  }

  #cellPopIce(t, progress) {
    // Ice: crisp crack/pop ascending
    const freq = 2000 + progress * 3000;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.06);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
    // Tiny ice crackle
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.02);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'highpass'; nf.frequency.value = 6000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.08, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.025);
  }

  // ─── Row Cleared Sound — theme-aware completion ──────────────────────

  /**
   * Completion sound when an entire row finishes vanishing. Dispatches to theme.
   */
  playRowCleared(rowIndex = 0) {
    if (!this.#ctx) return;
    const t = this.#now();

    switch (this.#soundTheme) {
      case 'concrete': this.#rowClearedConcrete(t, rowIndex); break;
      case 'crystal':  this.#rowClearedCrystal(t, rowIndex); break;
      case 'metal':    this.#rowClearedMetal(t, rowIndex); break;
      case 'ice':      this.#rowClearedIce(t, rowIndex); break;
      default:         this.#rowClearedGlass(t, rowIndex); break;
    }
  }

  #rowClearedGlass(t, rowIndex) {
    // Glass: shatter burst + chime
    const chordFreqs = [523, 659, 784, 1047];
    const freq = chordFreqs[Math.min(rowIndex, chordFreqs.length - 1)];
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.22, t);
    env.gain.exponentialRampToValueAtTime(0.06, t + 0.1);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.55);
    // Shatter noise
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.15);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'highpass'; nf.frequency.value = 2000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.15, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.16);
  }

  #rowClearedConcrete(t, rowIndex) {
    // Concrete: heavy collapse thud
    const freq = 60 + rowIndex * 15;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.3);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.45);
    // Rubble debris
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.2);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'bandpass'; nf.frequency.value = 400; nf.Q.value = 1;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t + 0.05);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.3);
  }

  #rowClearedCrystal(t, rowIndex) {
    // Crystal: bright major chord resolution
    const chordFreqs = [523, 659, 784, 1047];
    const base = chordFreqs[Math.min(rowIndex, chordFreqs.length - 1)];
    const intervals = [1, 1.25, 1.5]; // root, major 3rd, 5th
    for (let i = 0; i < intervals.length; i++) {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * intervals[i];
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.12, t + i * 0.03);
      env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.6);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(t + i * 0.03); osc.stop(t + i * 0.03 + 0.65);
    }
  }

  #rowClearedMetal(t, rowIndex) {
    // Metal: heavy clang + ring
    const freq = 200 + rowIndex * 80;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq * 3; filter.Q.value = 8;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.55);
    // Impact transient
    const click = this.#ctx.createBufferSource();
    click.buffer = this.#createNoiseBuffer(0.02);
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.15, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    click.connect(ce); ce.connect(this.#masterGain);
    click.start(t); click.stop(t + 0.025);
  }

  #rowClearedIce(t, rowIndex) {
    // Ice: cracking shatter + tinkling
    const freq = 1500 + rowIndex * 300;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, t + 0.3);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.4);
    // Ice debris tinkle
    for (let i = 0; i < 3; i++) {
      const tink = this.#ctx.createOscillator();
      tink.type = 'sine';
      tink.frequency.value = 3000 + Math.random() * 2000;
      const te = this.#ctx.createGain();
      const st = t + 0.05 + i * 0.04;
      te.gain.setValueAtTime(0.05, st);
      te.gain.exponentialRampToValueAtTime(0.001, st + 0.08);
      tink.connect(te); te.connect(this.#masterGain);
      tink.start(st); tink.stop(st + 0.09);
    }
    // Crack noise
    const noise = this.#ctx.createBufferSource();
    noise.buffer = this.#createNoiseBuffer(0.1);
    const nf = this.#ctx.createBiquadFilter();
    nf.type = 'highpass'; nf.frequency.value = 3000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(nf); nf.connect(ne); ne.connect(this.#masterGain);
    noise.start(t); noise.stop(t + 0.11);
  }
}

export { SoundEngine, SOUND_THEMES };
