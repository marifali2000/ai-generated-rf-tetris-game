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
  #animSpeed = 2;

  /** Available sound themes. */
  static get themes() { return SOUND_THEMES; }

  get soundTheme() { return this.#soundTheme; }
  get animSpeed() { return this.#animSpeed; }
  setAnimSpeed(m) { this.#animSpeed = Math.max(0.25, Math.min(4, m)); }
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

  // ─── Spawn — Theme-aware piece appear ──────────────────────────────

  /** Dispatches to active sound theme. */
  playSpawn() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#spawnGlass(); break;
      case 'concrete': this.#spawnConcrete(); break;
      case 'crystal': this.#spawnCrystal(); break;
      case 'metal': this.#spawnMetal(); break;
      case 'ice': this.#spawnIce(); break;
    }
  }

  #spawnGlass() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Glass tinkle ping
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800 * pf, t);
    osc.frequency.exponentialRampToValueAtTime(3500 * pf, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(2200 * pf, t + 0.12);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.15);
    // High sparkle
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.02);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 7000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.08, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.03);
  }

  #spawnConcrete() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Stone tap
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 * pf, t);
    osc.frequency.exponentialRampToValueAtTime(60 * pf, t + 0.08);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.11);
    // Grit texture
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.03);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 400;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.08, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.04);
  }

  #spawnCrystal() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Crystal bell chime
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200 * pf, t);
    osc.frequency.exponentialRampToValueAtTime(1800 * pf, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(1400 * pf, t + 0.12);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
    // Harmonic overtone
    const h = this.#ctx.createOscillator();
    h.type = 'sine'; h.frequency.value = 2400 * pf;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.05, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    h.connect(he); he.connect(this.#masterGain);
    h.start(t); h.stop(t + 0.09);
  }

  #spawnMetal() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Metallic ping
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(500 * pf, t);
    osc.frequency.exponentialRampToValueAtTime(300 * pf, t + 0.06);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.09);
    // Ring resonance
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = 1100 * pf;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.06, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t); ring.stop(t + 0.11);
  }

  #spawnIce() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Ice crackle
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.03);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 3000 * pf; bpf.Q.value = 4;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.15, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.04);
    // Cold sine ping
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 1800 * pf;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
  }

  // ─── Rotate — Theme-aware piece rotation ─────────────────────────────

  /** Dispatches to active sound theme. */
  playRotate() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#rotateGlass(); break;
      case 'concrete': this.#rotateConcrete(); break;
      case 'crystal': this.#rotateCrystal(); break;
      case 'metal': this.#rotateMetal(); break;
      case 'ice': this.#rotateIce(); break;
    }
  }

  #rotateGlass() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 3200 * p;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.04);
  }

  #rotateConcrete() {
    const t = this.#now();
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.03);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 500;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.04);
  }

  #rotateCrystal() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 1800 * p;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.05);
  }

  #rotateMetal() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    const osc = this.#ctx.createOscillator();
    osc.type = 'square'; osc.frequency.value = 800 * p;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.04);
  }

  #rotateIce() {
    const t = this.#now();
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.02);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 4000; bpf.Q.value = 5;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.03);
  }

  // ─── Lock — Theme-aware piece lock ────────────────────────────────────

  /** Dispatches to active sound theme. */
  playLock() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#lockGlass(); break;
      case 'concrete': this.#lockConcrete(); break;
      case 'crystal': this.#lockCrystal(); break;
      case 'metal': this.#lockMetal(); break;
      case 'ice': this.#lockIce(); break;
    }
  }

  #lockGlass() {
    const t = this.#now();
    // Glass clink
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 2500 + Math.random() * 300;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
    // Tiny glass tap
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.015);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 5000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.02);
  }

  #lockConcrete() {
    const t = this.#now();
    // Concrete thud
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.25, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
    // Grit
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.025);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 350;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.03);
  }

  #lockCrystal() {
    const t = this.#now();
    // Crystal clunk
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 1000 + Math.random() * 200;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
  }

  #lockMetal() {
    const t = this.#now();
    // Metal clank
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400 + Math.random() * 100, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.07);
  }

  #lockIce() {
    const t = this.#now();
    // Ice crunch
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.04);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 2500 + Math.random() * 500; bpf.Q.value = 3;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.2, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.05);
  }

  // ─── Hard Drop — Theme-aware impact ───────────────────────────────────

  /** Dispatches to active sound theme. */
  playHardDrop() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#hardDropGlass(); break;
      case 'concrete': this.#hardDropConcrete(); break;
      case 'crystal': this.#hardDropCrystal(); break;
      case 'metal': this.#hardDropMetal(); break;
      case 'ice': this.#hardDropIce(); break;
    }
  }

  #hardDropGlass() {
    const t = this.#now();
    // Glass impact — bright shatter with sub
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 4000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.25, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.09);
    // Sub weight
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.15, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.11);
  }

  #hardDropConcrete() {
    const t = this.#now();
    // Heavy concrete slam
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(70, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.12);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.5, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.13);
    // Concrete dust
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 300;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.18, t + 0.01);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t + 0.01); n.stop(t + 0.09);
  }

  #hardDropCrystal() {
    const t = this.#now();
    // Crystal crash
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.25, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.13);
    // Crystal shard scatter
    const h = this.#ctx.createOscillator();
    h.type = 'sine'; h.frequency.value = 3000;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.08, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    h.connect(he); he.connect(this.#masterGain);
    h.start(t); h.stop(t + 0.07);
  }

  #hardDropMetal() {
    const t = this.#now();
    // Metal slam
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.11);
    // Metallic ring aftermath
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = 600;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.1, t + 0.02);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t + 0.02); ring.stop(t + 0.16);
  }

  #hardDropIce() {
    const t = this.#now();
    // Ice crack impact
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.06);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 3500; bpf.Q.value = 4;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.3, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.07);
    // Deep ice fracture
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(100, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.2, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.13);
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

  // ─── Level Up — Theme-aware celebration ─────────────────────────────

  /** Dispatches to active sound theme. */
  playLevelUp() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#levelUpGlass(); break;
      case 'concrete': this.#levelUpConcrete(); break;
      case 'crystal': this.#levelUpCrystal(); break;
      case 'metal': this.#levelUpMetal(); break;
      case 'ice': this.#levelUpIce(); break;
    }
  }

  #levelUpGlass() {
    const t = this.#now();
    // Ascending glass tinkles
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.07;
      const freq = 2500 + i * 600;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = freq;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.18, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.13);
    }
    // Glass shimmer burst
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.12);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 6000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t + 0.28);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t + 0.28); n.stop(t + 0.41);
  }

  #levelUpConcrete() {
    const t = this.#now();
    // Rising concrete thuds getting louder
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.08;
      const freq = 50 + i * 20;
      const osc = this.#ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, s + 0.1);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.15 + i * 0.05, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.13);
    }
    // Rumble aftermath
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.15);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 300;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t + 0.32);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t + 0.32); n.stop(t + 0.46);
  }

  #levelUpCrystal() {
    const t = this.#now();
    // Crystal ascending chimes
    const freqs = [800, 1000, 1200, 1600];
    freqs.forEach((f, i) => {
      const s = t + i * 0.07;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = f;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.2, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.16);
      // Overtone
      const h = this.#ctx.createOscillator();
      h.type = 'sine'; h.frequency.value = f * 2;
      const he = this.#ctx.createGain();
      he.gain.setValueAtTime(0.04, s);
      he.gain.exponentialRampToValueAtTime(0.001, s + 0.08);
      h.connect(he); he.connect(this.#masterGain);
      h.start(s); h.stop(s + 0.09);
    });
  }

  #levelUpMetal() {
    const t = this.#now();
    // Ascending metallic clangs
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.08;
      const freq = 300 + i * 120;
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, s + 0.08);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.12 + i * 0.03, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.1);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.11);
      // Ring
      const ring = this.#ctx.createOscillator();
      ring.type = 'sine'; ring.frequency.value = freq * 2.5;
      const re = this.#ctx.createGain();
      re.gain.setValueAtTime(0.05, s);
      re.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
      ring.connect(re); re.connect(this.#masterGain);
      ring.start(s); ring.stop(s + 0.13);
    }
  }

  #levelUpIce() {
    const t = this.#now();
    // Ascending ice cracks
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.07;
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.04);
      const bpf = this.#ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 2000 + i * 600; bpf.Q.value = 4;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.15 + i * 0.03, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.04);
      n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.05);
    }
    // Cold shimmer
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 4000;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.08, t + 0.28);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t + 0.28); osc.stop(t + 0.41);
  }

  // ─── Game Over — Theme-aware collapse ─────────────────────────────────

  /** Dispatches to active sound theme. */
  playGameOver() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#gameOverGlass(); break;
      case 'concrete': this.#gameOverConcrete(); break;
      case 'crystal': this.#gameOverCrystal(); break;
      case 'metal': this.#gameOverMetal(); break;
      case 'ice': this.#gameOverIce(); break;
    }
  }

  #gameOverGlass() {
    const t = this.#now();
    // Glass shattering cascade — descending tinkles + debris
    for (let i = 0; i < 5; i++) {
      const s = t + i * 0.3;
      const freq = 4000 - i * 500;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.5);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.2, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.5);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.51);
      // Glass debris noise
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.3);
      const hpf = this.#ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = 3000 + i * 200;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.15 - i * 0.02, s + 0.05);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
      n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s + 0.05); n.stop(s + 0.31);
    }
  }

  #gameOverConcrete() {
    const t = this.#now();
    // Building collapse — descending rumbles + debris cascade
    // Sub-bass rumble
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, t + 0.1);
    sub.frequency.exponentialRampToValueAtTime(15, t + 2.5);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.4, t + 0.1);
    se.gain.linearRampToValueAtTime(0.001, t + 2.5);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t + 0.1); sub.stop(t + 2.6);
    // Staggered concrete debris
    for (let i = 0; i < 5; i++) {
      const s = t + 0.3 + i * 0.35;
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.4);
      const lpf = this.#ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 500 - i * 60;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.2 - i * 0.03, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.35);
      n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.36);
    }
    // Long rumble tail
    const tail = this.#ctx.createBufferSource();
    tail.buffer = this.#createNoiseBuffer(2);
    const tl = this.#ctx.createBiquadFilter();
    tl.type = 'lowpass'; tl.frequency.setValueAtTime(400, t);
    tl.frequency.exponentialRampToValueAtTime(60, t + 2.5);
    const te = this.#ctx.createGain();
    te.gain.setValueAtTime(0.12, t + 0.5);
    te.gain.linearRampToValueAtTime(0.001, t + 2.5);
    tail.connect(tl); tl.connect(te); te.connect(this.#masterGain);
    tail.start(t + 0.5); tail.stop(t + 2.6);
  }

  #gameOverCrystal() {
    const t = this.#now();
    // Crystal shattering cascade — descending pure tones
    for (let i = 0; i < 5; i++) {
      const s = t + i * 0.3;
      const freqs = [1600 - i * 150, 1200 - i * 100, 800 - i * 60];
      freqs.forEach((f) => {
        const osc = this.#ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, s);
        osc.frequency.exponentialRampToValueAtTime(f * 0.2, s + 0.6);
        const env = this.#ctx.createGain();
        env.gain.setValueAtTime(0.15, s);
        env.gain.exponentialRampToValueAtTime(0.001, s + 0.6);
        osc.connect(env); env.connect(this.#masterGain);
        osc.start(s); osc.stop(s + 0.61);
      });
    }
  }

  #gameOverMetal() {
    const t = this.#now();
    // Metal structural collapse — grinding + impacts
    const sub = this.#ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.setValueAtTime(100, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 2);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.15, t);
    se.gain.linearRampToValueAtTime(0.001, t + 2);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 2.1);
    for (let i = 0; i < 5; i++) {
      const s = t + 0.2 + i * 0.35;
      const freq = 500 - i * 60;
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.3);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.12, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.31);
      // Ring
      const ring = this.#ctx.createOscillator();
      ring.type = 'sine'; ring.frequency.value = freq * 2;
      const re = this.#ctx.createGain();
      re.gain.setValueAtTime(0.06, s);
      re.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
      ring.connect(re); re.connect(this.#masterGain);
      ring.start(s); ring.stop(s + 0.41);
    }
  }

  #gameOverIce() {
    const t = this.#now();
    // Ice shelf collapse — cascading cracks + deep rumble
    for (let i = 0; i < 6; i++) {
      const s = t + i * 0.25;
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.2);
      const bpf = this.#ctx.createBiquadFilter();
      bpf.type = 'bandpass'; bpf.frequency.value = 3000 - i * 300; bpf.Q.value = 3;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.18 - i * 0.02, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
      n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.21);
    }
    // Deep sub creak
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, t + 0.3);
    sub.frequency.exponentialRampToValueAtTime(15, t + 2.5);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.3, t + 0.3);
    se.gain.linearRampToValueAtTime(0.001, t + 2.5);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t + 0.3); sub.stop(t + 2.6);
  }

  // ─── Move — Theme-aware nudge ─────────────────────────────────────────

  /** Dispatches to active sound theme. */
  playMove() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#moveGlass(); break;
      case 'concrete': this.#moveConcrete(); break;
      case 'crystal': this.#moveCrystal(); break;
      case 'metal': this.#moveMetal(); break;
      case 'ice': this.#moveIce(); break;
    }
  }

  #moveGlass() {
    const t = this.#now();
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 3500 + Math.random() * 300;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.04, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.025);
  }

  #moveConcrete() {
    const t = this.#now();
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.015);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 300;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.05, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.02);
  }

  #moveCrystal() {
    const t = this.#now();
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 1500 + Math.random() * 200;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.04, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.025);
  }

  #moveMetal() {
    const t = this.#now();
    const osc = this.#ctx.createOscillator();
    osc.type = 'square'; osc.frequency.value = 600 + Math.random() * 100;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.03, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.025);
  }

  #moveIce() {
    const t = this.#now();
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.015);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 3000; bpf.Q.value = 3;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.04, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.02);
  }

  // ─── Hold — Theme-aware swap ──────────────────────────────────────────

  /** Dispatches to active sound theme. */
  playHold() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#holdGlass(); break;
      case 'concrete': this.#holdConcrete(); break;
      case 'crystal': this.#holdCrystal(); break;
      case 'metal': this.#holdMetal(); break;
      case 'ice': this.#holdIce(); break;
    }
  }

  #holdGlass() {
    const t = this.#now();
    // Glass slide whoosh
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.1);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(3000, t);
    hpf.frequency.exponentialRampToValueAtTime(6000, t + 0.05);
    hpf.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.11);
  }

  #holdConcrete() {
    const t = this.#now();
    // Stone slide
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.1);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(300, t);
    lpf.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    lpf.frequency.exponentialRampToValueAtTime(200, t + 0.1);
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.11);
  }

  #holdCrystal() {
    const t = this.#now();
    // Crystal whoosh
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.11);
  }

  #holdMetal() {
    const t = this.#now();
    // Metal slide
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.1);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(500, t);
    bpf.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
    bpf.frequency.exponentialRampToValueAtTime(800, t + 0.1);
    bpf.Q.value = 1;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.11);
  }

  #holdIce() {
    const t = this.#now();
    // Ice slide
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(2000, t);
    bpf.frequency.exponentialRampToValueAtTime(5000, t + 0.04);
    bpf.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
    bpf.Q.value = 3;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.09);
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

  // ─── Combo Hit — Theme-aware ascending reward ───────────────────────

  /** Dispatches to active sound theme. */
  playComboHit(combo) {
    if (!this.#ctx || combo < 2) return;
    switch (this.#soundTheme) {
      case 'glass': this.#comboHitGlass(combo); break;
      case 'concrete': this.#comboHitConcrete(combo); break;
      case 'crystal': this.#comboHitCrystal(combo); break;
      case 'metal': this.#comboHitMetal(combo); break;
      case 'ice': this.#comboHitIce(combo); break;
    }
  }

  #comboHitGlass(combo) {
    const t = this.#now();
    const semitones = Math.min(combo - 2, 12);
    const freq = 2000 * Math.pow(2, semitones / 12);
    // Glass tinkle that rises with combo
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.06);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
    // High-freq noise tinkle
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.06);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 6000 + combo * 200;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.1, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.07);
  }

  #comboHitConcrete(combo) {
    const t = this.#now();
    const intensity = Math.min(combo - 1, 8);
    const freq = 60 + intensity * 15;
    // Escalating concrete impact thuds
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.1);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.25 + intensity * 0.02, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.13);
    // Gritty rubble noise
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 400 + intensity * 50;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.12, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.09);
  }

  #comboHitCrystal(combo) {
    const t = this.#now();
    const semitones = Math.min(combo - 2, 12);
    const freq = 800 * Math.pow(2, semitones / 12);
    // Clear crystal bell tone rising with combo
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.26);
    // Resonant harmonic
    const h = this.#ctx.createOscillator();
    h.type = 'sine'; h.frequency.value = freq * 2.5;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.06, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    h.connect(he); he.connect(this.#masterGain);
    h.start(t); h.stop(t + 0.19);
  }

  #comboHitMetal(combo) {
    const t = this.#now();
    const intensity = Math.min(combo - 1, 8);
    const freq = 300 + intensity * 60;
    // Metallic clang escalating
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.12);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
    // Metallic ring
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = freq * 2.2;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.08, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t); ring.stop(t + 0.21);
  }

  #comboHitIce(combo) {
    const t = this.#now();
    const intensity = Math.min(combo - 1, 8);
    const freq = 1500 + intensity * 200;
    // Sharp ice crack escalating
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.05);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = freq; bpf.Q.value = 3;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.2 + intensity * 0.02, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.06);
    // Brittle sine
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq * 0.8;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.1, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.09);
  }

  // ─── T-Spin — Theme-aware dramatic effect ────────────────────────────

  /** Dispatches to active sound theme. */
  playTSpin(type) {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#tSpinGlass(type); break;
      case 'concrete': this.#tSpinConcrete(type); break;
      case 'crystal': this.#tSpinCrystal(type); break;
      case 'metal': this.#tSpinMetal(type); break;
      case 'ice': this.#tSpinIce(type); break;
    }
  }

  #tSpinGlass(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.2 : 0.12;
    // Glass spiral — rising filtered noise
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.25);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(3000, t);
    hpf.frequency.exponentialRampToValueAtTime(8000, t + 0.1);
    hpf.frequency.exponentialRampToValueAtTime(4000, t + 0.2);
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(vol, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.23);
    if (isFull) {
      // Glass shatter burst
      const shard = this.#ctx.createBufferSource();
      shard.buffer = this.#createNoiseBuffer(0.15);
      const shpf = this.#ctx.createBiquadFilter();
      shpf.type = 'highpass'; shpf.frequency.value = 5000;
      const se = this.#ctx.createGain();
      se.gain.setValueAtTime(0.18, t + 0.08);
      se.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      shard.connect(shpf); shpf.connect(se); se.connect(this.#masterGain);
      shard.start(t + 0.08); shard.stop(t + 0.21);
    }
  }

  #tSpinConcrete(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.25 : 0.15;
    // Concrete grinding — lowpass noise sweep
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.3);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(200, t);
    lpf.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    lpf.frequency.exponentialRampToValueAtTime(150, t + 0.25);
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(vol, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.29);
    if (isFull) {
      // Heavy concrete crack
      const sub = this.#ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(80, t + 0.1);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.25);
      const se = this.#ctx.createGain();
      se.gain.setValueAtTime(0.3, t + 0.1);
      se.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      sub.connect(se); se.connect(this.#masterGain);
      sub.start(t + 0.1); sub.stop(t + 0.26);
    }
  }

  #tSpinCrystal(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.18 : 0.1;
    // Crystal spinning resonance
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.2);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.23);
    if (isFull) {
      // Crystal harmonic burst
      [1600, 2000, 2800].forEach((f, i) => {
        const h = this.#ctx.createOscillator();
        h.type = 'sine'; h.frequency.value = f;
        const he = this.#ctx.createGain();
        const s = t + 0.06 + i * 0.025;
        he.gain.setValueAtTime(0.12, s);
        he.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
        h.connect(he); he.connect(this.#masterGain);
        h.start(s); h.stop(s + 0.21);
      });
    }
  }

  #tSpinMetal(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.2 : 0.12;
    // Metal grinding sweep
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.2);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(400, t);
    bpf.frequency.exponentialRampToValueAtTime(1500, t + 0.1);
    bpf.frequency.exponentialRampToValueAtTime(600, t + 0.18);
    bpf.Q.value = 1.5;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(vol, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.21);
    if (isFull) {
      // Heavy metal impact
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.2, t + 0.08);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(t + 0.08); osc.stop(t + 0.23);
    }
  }

  #tSpinIce(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.2 : 0.12;
    // Ice spinning crack — sharp bandpass sweep
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.2);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(2000, t);
    bpf.frequency.exponentialRampToValueAtTime(6000, t + 0.08);
    bpf.frequency.exponentialRampToValueAtTime(3000, t + 0.18);
    bpf.Q.value = 4;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(vol, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.21);
    if (isFull) {
      // Deep ice fracture
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.2, t + 0.06);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(t + 0.06); osc.stop(t + 0.23);
    }
  }

  // ─── Perfect Clear — Theme-aware celebration ─────────────────────────

  /** Dispatches to active sound theme. */
  playPerfectClear() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#perfectClearGlass(); break;
      case 'concrete': this.#perfectClearConcrete(); break;
      case 'crystal': this.#perfectClearCrystal(); break;
      case 'metal': this.#perfectClearMetal(); break;
      case 'ice': this.#perfectClearIce(); break;
    }
  }

  #perfectClearGlass() {
    const t = this.#now();
    // Cascading glass shatter — multiple tinkles
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.08;
      const freq = 3000 + i * 500;
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.12);
      const hpf = this.#ctx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = freq;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.15, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
      n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.13);
      // Tinkle tone
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = freq * 0.8;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.12, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.16);
    }
  }

  #perfectClearConcrete() {
    const t = this.#now();
    // Concrete demolition — staggered heavy impacts
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.1;
      const freq = 80 - i * 10;
      const osc = this.#ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.15);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.3, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.16);
      // Rubble burst
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.1);
      const lpf = this.#ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 500 - i * 50;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.15, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.1);
      n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.11);
    }
  }

  #perfectClearCrystal() {
    const t = this.#now();
    // Crystal ascending choir — pure harmonic series
    const freqs = [800, 1000, 1200, 1600];
    freqs.forEach((f, i) => {
      const s = t + i * 0.07;
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = f;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.18, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.41);
      // Harmonic overtone
      const h = this.#ctx.createOscillator();
      h.type = 'sine'; h.frequency.value = f * 2.5;
      const he = this.#ctx.createGain();
      he.gain.setValueAtTime(0.05, s);
      he.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
      h.connect(he); he.connect(this.#masterGain);
      h.start(s); h.stop(s + 0.31);
    });
  }

  #perfectClearMetal() {
    const t = this.#now();
    // Metal demolition — cascading metallic strikes
    for (let i = 0; i < 4; i++) {
      const s = t + i * 0.09;
      const freq = 400 + i * 100;
      const osc = this.#ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, s);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, s + 0.12);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.15, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(s); osc.stop(s + 0.16);
      // Metallic ring resonance
      const ring = this.#ctx.createOscillator();
      ring.type = 'sine'; ring.frequency.value = freq * 2.5;
      const re = this.#ctx.createGain();
      re.gain.setValueAtTime(0.08, s);
      re.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
      ring.connect(re); re.connect(this.#masterGain);
      ring.start(s); ring.stop(s + 0.21);
    }
  }

  #perfectClearIce() {
    const t = this.#now();
    // Ice avalanche — cascading sharp cracks
    for (let i = 0; i < 5; i++) {
      const s = t + i * 0.07;
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.08);
      const bpf = this.#ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 3000 + i * 400;
      bpf.Q.value = 5;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.18, s);
      ne.gain.exponentialRampToValueAtTime(0.001, s + 0.08);
      n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
      n.start(s); n.stop(s + 0.09);
    }
    // Deep sub-ice rumble
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, t + 0.1);
    sub.frequency.exponentialRampToValueAtTime(25, t + 0.5);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.2, t + 0.1);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t + 0.1); sub.stop(t + 0.51);
  }

  // ─── Back-to-Back — Theme-aware emphatic hit ─────────────────────────

  /** Dispatches to active sound theme. */
  playBackToBack() {
    if (!this.#ctx) return;
    switch (this.#soundTheme) {
      case 'glass': this.#backToBackGlass(); break;
      case 'concrete': this.#backToBackConcrete(); break;
      case 'crystal': this.#backToBackCrystal(); break;
      case 'metal': this.#backToBackMetal(); break;
      case 'ice': this.#backToBackIce(); break;
    }
  }

  #backToBackGlass() {
    const t = this.#now();
    // Emphatic glass crash — layered shatter
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.2);
    const hpf = this.#ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 4000;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.25, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    n.connect(hpf); hpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.21);
    // Glass resonance ping
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 3500;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
  }

  #backToBackConcrete() {
    const t = this.#now();
    // Heavy double concrete impact
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.15);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.35, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.19);
    // Rubble scatter
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.15);
    const lpf = this.#ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 350;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.18, t + 0.03);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t + 0.03); n.stop(t + 0.16);
  }

  #backToBackCrystal() {
    const t = this.#now();
    // Crystal power chord — harmonics
    [1000, 1500, 2000].forEach((f, i) => {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = f;
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.15, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(t); osc.stop(t + 0.26);
    });
  }

  #backToBackMetal() {
    const t = this.#now();
    // Heavy metal strike with ring
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
    // Ring overtone
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = 800;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.1, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t); ring.stop(t + 0.26);
  }

  #backToBackIce() {
    const t = this.#now();
    // Deep ice fracture — sharp crack + sub rumble
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 4000; bpf.Q.value = 5;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(0.25, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.09);
    // Sub ice rumble
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.2, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.21);
  }

  // ─── Danger Pulse — Theme-aware warning ──────────────────────────────

  /** Dispatches to active sound theme. */
  playDangerPulse(intensity) {
    if (!this.#ctx || intensity < 1) return;
    switch (this.#soundTheme) {
      case 'glass': this.#dangerPulseGlass(intensity); break;
      case 'concrete': this.#dangerPulseConcrete(intensity); break;
      case 'crystal': this.#dangerPulseCrystal(intensity); break;
      case 'metal': this.#dangerPulseMetal(intensity); break;
      case 'ice': this.#dangerPulseIce(intensity); break;
    }
  }

  #dangerPulseGlass(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const freq = 2000 + i * 200;
    const vol = 0.03 + i * 0.012;
    // Glass stress creak — high sine descending
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.2);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.26);
  }

  #dangerPulseConcrete(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const freq = 50 + i * 10;
    const vol = 0.04 + i * 0.015;
    // Concrete stress groan — deep rumble
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.3);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.31);
    if (i >= 6) {
      const n = this.#ctx.createBufferSource();
      n.buffer = this.#createNoiseBuffer(0.1);
      const lpf = this.#ctx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = 200;
      const ne = this.#ctx.createGain();
      ne.gain.setValueAtTime(0.03, t);
      ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      n.connect(lpf); lpf.connect(ne); ne.connect(this.#masterGain);
      n.start(t); n.stop(t + 0.11);
    }
  }

  #dangerPulseCrystal(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const freq = 600 + i * 60;
    const vol = 0.03 + i * 0.01;
    // Crystal warning hum
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.25);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.26);
  }

  #dangerPulseMetal(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const freq = 150 + i * 25;
    const vol = 0.04 + i * 0.012;
    // Metal stress groan — square wave pulse
    const osc = this.#ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.25);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.29);
  }

  #dangerPulseIce(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const vol = 0.03 + i * 0.012;
    // Ice creaking — filtered noise crack
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(0.08);
    const bpf = this.#ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 1500 + i * 150;
    bpf.Q.value = 3;
    const ne = this.#ctx.createGain();
    ne.gain.setValueAtTime(vol, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    n.connect(bpf); bpf.connect(ne); ne.connect(this.#masterGain);
    n.start(t); n.stop(t + 0.09);
    // Sub creak
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100 + i * 10, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(vol * 0.8, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.16);
  }

  // ─── Row Highlight Sound — theme-aware anticipation ──────────────────

  /**
   * Sound when a row starts glowing before clearing. Dispatches to theme.
   */
  playRowHighlight(rowIndex = 0) {
    if (!this.#ctx) return;
    const t = this.#now();
    const pitch = 0.95 + Math.random() * 0.1; // ±5% micro-variation
    const ds = 2 / this.#animSpeed; // duration scale

    switch (this.#soundTheme) {
      case 'concrete': this.#rowHighlightConcrete(t, rowIndex, pitch, ds); break;
      case 'crystal':  this.#rowHighlightCrystal(t, rowIndex, pitch, ds); break;
      case 'metal':    this.#rowHighlightMetal(t, rowIndex, pitch, ds); break;
      case 'ice':      this.#rowHighlightIce(t, rowIndex, pitch, ds); break;
      default:         this.#rowHighlightGlass(t, rowIndex, pitch, ds); break;
    }
  }

  #rowHighlightGlass(t, rowIndex, pitch, ds) {
    // Realistic glass stress creak — crackling, no tonal whistle
    // Layer 1: Glass micro-fracture crackle (noise-only, no sine)
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.5 * ds);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 3000 + rowIndex * 800; cf.Q.value = 1.5;
    const ce = this.#ctx.createGain();
    // Intermittent crackling — sounds like glass fracturing
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.02 * ds);
    ce.gain.setValueAtTime(0.03, t + 0.08 * ds);
    ce.gain.linearRampToValueAtTime(0.12, t + 0.12 * ds);
    ce.gain.setValueAtTime(0.02, t + 0.2 * ds);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.25 * ds);
    ce.gain.setValueAtTime(0.01, t + 0.35 * ds);
    ce.gain.linearRampToValueAtTime(0.08, t + 0.38 * ds);
    ce.gain.linearRampToValueAtTime(0, t + 0.5 * ds);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.55 * ds);

    // Layer 2: High-freq glass crinkle (very short bursts)
    const crinkle = this.#ctx.createBufferSource();
    crinkle.buffer = this.#createNoiseBuffer(0.4 * ds);
    const crf = this.#ctx.createBiquadFilter();
    crf.type = 'highpass'; crf.frequency.value = 6000;
    const cre = this.#ctx.createGain();
    cre.gain.setValueAtTime(0, t);
    cre.gain.linearRampToValueAtTime(0.04, t + 0.05 * ds);
    cre.gain.setValueAtTime(0.01, t + 0.15 * ds);
    cre.gain.linearRampToValueAtTime(0.05, t + 0.2 * ds);
    cre.gain.linearRampToValueAtTime(0, t + 0.45 * ds);
    crinkle.connect(crf); crf.connect(cre); cre.connect(this.#masterGain);
    crinkle.start(t); crinkle.stop(t + 0.5 * ds);

    // Layer 3: Sub-bass tension (felt, not heard)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 45 + rowIndex * 8;
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0, t);
    sEnv.gain.linearRampToValueAtTime(0.1, t + 0.1 * ds);
    sEnv.gain.linearRampToValueAtTime(0, t + 0.5 * ds);
    sub.connect(sEnv); sEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.55 * ds);
  }

  #rowHighlightConcrete(t, rowIndex, pitch, ds) {
    // Realistic pre-demolition stress — rumbling, cracking
    // Layer 1: Deep structural groan
    const groanFreq = (40 + rowIndex * 12) * pitch;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(groanFreq, t);
    osc.frequency.linearRampToValueAtTime(groanFreq * 0.7, t + 0.5 * ds);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 200;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.18, t + 0.08 * ds);
    env.gain.setValueAtTime(0.18, t + 0.3 * ds);
    env.gain.linearRampToValueAtTime(0, t + 0.55 * ds);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.6 * ds);

    // Layer 2: Concrete cracking noise — gritty, low-mid frequency
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.5 * ds);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 300 + rowIndex * 50; cf.Q.value = 0.8;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.1, t + 0.05 * ds);
    ce.gain.setValueAtTime(0.04, t + 0.15 * ds);
    ce.gain.linearRampToValueAtTime(0.12, t + 0.25 * ds);
    ce.gain.linearRampToValueAtTime(0, t + 0.5 * ds);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.55 * ds);

    // Layer 3: Rebar stress (metallic undertone)
    const rebar = this.#ctx.createOscillator();
    rebar.type = 'square';
    rebar.frequency.value = 120 * pitch;
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 150; rf.Q.value = 8;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0, t);
    re.gain.linearRampToValueAtTime(0.04, t + 0.15 * ds);
    re.gain.linearRampToValueAtTime(0, t + 0.45 * ds);
    rebar.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rebar.start(t); rebar.stop(t + 0.5 * ds);
  }

  #rowHighlightCrystal(t, rowIndex, pitch, ds) {
    // Crystal resonance building — like a wine glass being rubbed
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    const base = notes[Math.min(rowIndex, 3)] * pitch;
    // Layer 1: Swelling pure tone
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = base;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.2 * ds);
    env.gain.setValueAtTime(0.12, t + 0.3 * ds);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.6 * ds);
    osc.connect(env); env.connect(this.#masterGain);
    this.#addReverb(env, 0.8 * ds, 0.3, 0.15);
    osc.start(t); osc.stop(t + 0.65 * ds);

    // Layer 2: Perfect fifth harmonic
    const h5 = this.#ctx.createOscillator();
    h5.type = 'sine';
    h5.frequency.value = base * 1.5;
    const h5e = this.#ctx.createGain();
    h5e.gain.setValueAtTime(0, t + 0.05 * ds);
    h5e.gain.linearRampToValueAtTime(0.05, t + 0.2 * ds);
    h5e.gain.exponentialRampToValueAtTime(0.001, t + 0.55 * ds);
    h5.connect(h5e); h5e.connect(this.#masterGain);
    h5.start(t + 0.05 * ds); h5.stop(t + 0.6 * ds);

    // Layer 3: High shimmer
    const shim = this.#ctx.createOscillator();
    shim.type = 'sine';
    shim.frequency.value = base * 3;
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0, t + 0.1 * ds);
    se.gain.linearRampToValueAtTime(0.025, t + 0.25 * ds);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.5 * ds);
    shim.connect(se); se.connect(this.#masterGain);
    shim.start(t + 0.1 * ds); shim.stop(t + 0.55 * ds);
  }

  #rowHighlightMetal(t, rowIndex, pitch, ds) {
    // Metal stress — like a steel beam bending under load
    // Layer 1: Deep metallic groan (low square through resonant filter)
    const freq = (80 + rowIndex * 30) * pitch;
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 1.3, t + 0.5 * ds);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq * 2; filter.Q.value = 6;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.1 * ds);
    env.gain.setValueAtTime(0.12, t + 0.35 * ds);
    env.gain.linearRampToValueAtTime(0, t + 0.55 * ds);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.6 * ds);

    // Layer 2: Metallic rattle (filtered noise simulating vibration)
    const rattle = this.#ctx.createBufferSource();
    rattle.buffer = this.#createNoiseBuffer(0.4 * ds);
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 800 + rowIndex * 200; rf.Q.value = 10;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0, t);
    re.gain.linearRampToValueAtTime(0.06, t + 0.08 * ds);
    re.gain.setValueAtTime(0.02, t + 0.2 * ds);
    re.gain.linearRampToValueAtTime(0.07, t + 0.3 * ds);
    re.gain.linearRampToValueAtTime(0, t + 0.5 * ds);
    rattle.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rattle.start(t); rattle.stop(t + 0.55 * ds);

    // Layer 3: Sub vibration
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 40 * pitch;
    const sEnv = this.#ctx.createGain();
    sEnv.gain.setValueAtTime(0, t);
    sEnv.gain.linearRampToValueAtTime(0.1, t + 0.1 * ds);
    sEnv.gain.linearRampToValueAtTime(0, t + 0.5 * ds);
    sub.connect(sEnv); sEnv.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.55 * ds);
  }

  #rowHighlightIce(t, rowIndex, pitch, ds) {
    // Ice cracking under pressure — sharp cracks, no whistle
    // Layer 1: Short sharp crack bursts (pitch-dropped noise, not sine)
    const crack1 = this.#ctx.createBufferSource();
    crack1.buffer = this.#createNoiseBuffer(0.06);
    const c1f = this.#ctx.createBiquadFilter();
    c1f.type = 'bandpass'; c1f.frequency.value = 4000 + rowIndex * 500; c1f.Q.value = 2;
    const c1e = this.#ctx.createGain();
    c1e.gain.setValueAtTime(0.15, t);
    c1e.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
    crack1.connect(c1f); c1f.connect(c1e); c1e.connect(this.#masterGain);
    crack1.start(t); crack1.stop(t + 0.06 * ds);

    // Second crack after a gap
    const crack2 = this.#ctx.createBufferSource();
    crack2.buffer = this.#createNoiseBuffer(0.05);
    const c2f = this.#ctx.createBiquadFilter();
    c2f.type = 'highpass'; c2f.frequency.value = 5000;
    const c2e = this.#ctx.createGain();
    c2e.gain.setValueAtTime(0.12, t + 0.15 * ds);
    c2e.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * ds);
    crack2.connect(c2f); c2f.connect(c2e); c2e.connect(this.#masterGain);
    crack2.start(t + 0.15 * ds); crack2.stop(t + 0.22 * ds);

    // Layer 2: Creaking ice noise (broadband, slow swell)
    const creak = this.#ctx.createBufferSource();
    creak.buffer = this.#createNoiseBuffer(0.4 * ds);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'bandpass'; cf.frequency.value = 2000 + rowIndex * 400; cf.Q.value = 1;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0, t);
    ce.gain.linearRampToValueAtTime(0.06, t + 0.08 * ds);
    ce.gain.setValueAtTime(0.02, t + 0.18 * ds);
    ce.gain.linearRampToValueAtTime(0.07, t + 0.25 * ds);
    ce.gain.linearRampToValueAtTime(0, t + 0.45 * ds);
    creak.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    creak.start(t); creak.stop(t + 0.5 * ds);

    // Layer 3: Low sub-ice rumble (frozen lake groaning)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40 * pitch, t);
    sub.frequency.linearRampToValueAtTime(30 * pitch, t + 0.4 * ds);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0, t);
    se.gain.linearRampToValueAtTime(0.1, t + 0.08 * ds);
    se.gain.linearRampToValueAtTime(0, t + 0.45 * ds);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.5 * ds);
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
    const ds = 2 / this.#animSpeed; // duration scale — shorter at high speed, longer at low

    switch (this.#soundTheme) {
      case 'concrete': this.#cellPopConcrete(t, progress, pitch, ds); break;
      case 'crystal':  this.#cellPopCrystal(t, progress, pitch, ds); break;
      case 'metal':    this.#cellPopMetal(t, progress, pitch, ds); break;
      case 'ice':      this.#cellPopIce(t, progress, pitch, ds); break;
      default:         this.#cellPopGlass(t, progress, pitch, ds); break;
    }
  }

  #cellPopGlass(t, progress, pitch, ds) {
    // Realistic glass shard breaking off — sharp transient + tinkle ring-out
    const freq = (1800 + progress * 2500) * pitch;

    // Layer 1: Sharp transient crack (< 5ms attack)
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(0.025 * ds);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'highpass'; cf.frequency.value = 3000 + progress * 3000;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.2, t);
    ce.gain.exponentialRampToValueAtTime(0.001, t + 0.025 * ds);
    crack.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    crack.start(t); crack.stop(t + 0.03 * ds);

    // Layer 2: Glass resonance ring (sine with natural decay)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = freq;
    const ringEnv = this.#ctx.createGain();
    ringEnv.gain.setValueAtTime(0.14, t);
    ringEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * ds);
    ring.connect(ringEnv); ringEnv.connect(this.#masterGain);
    this.#addReverb(ringEnv, 0.3 * ds, 0.2, 0.08);
    ring.start(t); ring.stop(t + 0.22 * ds);

    // Layer 3: Octave overtone (glass has strong harmonics)
    const harm = this.#ctx.createOscillator();
    harm.type = 'sine';
    harm.frequency.value = freq * 2.3;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.04, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.1 * ds);
    harm.connect(he); he.connect(this.#masterGain);
    harm.start(t); harm.stop(t + 0.12 * ds);
  }

  #cellPopConcrete(t, progress, pitch, ds) {
    // Concrete chunk breaking — heavy thud + rubble scatter
    const freq = (60 + progress * 40) * pitch;

    // Layer 1: Impact thud (you feel it)
    const thud = this.#ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(freq, t);
    thud.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.06 * ds);
    const te = this.#ctx.createGain();
    te.gain.setValueAtTime(0.25, t);
    te.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * ds);
    thud.connect(te); te.connect(this.#masterGain);
    thud.start(t); thud.stop(t + 0.09 * ds);

    // Layer 2: Rubble/gravel scatter (broadband noise, mid-freq)
    const rubble = this.#ctx.createBufferSource();
    rubble.buffer = this.#createNoiseBuffer(0.08 * ds);
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = 600 + progress * 500; rf.Q.value = 1.5;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.15, t + 0.005);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.07 * ds);
    rubble.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    rubble.start(t + 0.005); rubble.stop(t + 0.08 * ds);

    // Layer 3: Dust puff (very high noise, faint)
    const dust = this.#ctx.createBufferSource();
    dust.buffer = this.#createNoiseBuffer(0.04 * ds);
    const df = this.#ctx.createBiquadFilter();
    df.type = 'highpass'; df.frequency.value = 2000;
    const de = this.#ctx.createGain();
    de.gain.setValueAtTime(0.05, t + 0.01);
    de.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
    dust.connect(df); df.connect(de); de.connect(this.#masterGain);
    dust.start(t + 0.01); dust.stop(t + 0.06 * ds);
  }

  #cellPopCrystal(t, progress, pitch, ds) {
    // Crystal chime — pure bell tone with harmonic singing
    const note = (1047 + progress * 1047) * pitch; // C6 rising to C7

    // Layer 1: Pure bell fundamental
    const bell = this.#ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = note;
    const bEnv = this.#ctx.createGain();
    bEnv.gain.setValueAtTime(0.12, t);
    bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.35 * ds);
    bell.connect(bEnv); bEnv.connect(this.#masterGain);
    this.#addReverb(bEnv, 0.5 * ds, 0.3, 0.12);
    bell.start(t); bell.stop(t + 0.38 * ds);

    // Layer 2: Perfect fifth harmonic (bell-like inharmonic partial)
    const h5 = this.#ctx.createOscillator();
    h5.type = 'sine';
    h5.frequency.value = note * 1.5;
    const h5e = this.#ctx.createGain();
    h5e.gain.setValueAtTime(0.05, t);
    h5e.gain.exponentialRampToValueAtTime(0.001, t + 0.25 * ds);
    h5.connect(h5e); h5e.connect(this.#masterGain);
    h5.start(t); h5.stop(t + 0.28 * ds);

    // Layer 3: Inharmonic bell partial (× 2.76 — real bells have these)
    const ih = this.#ctx.createOscillator();
    ih.type = 'sine';
    ih.frequency.value = note * 2.76;
    const ihe = this.#ctx.createGain();
    ihe.gain.setValueAtTime(0.02, t);
    ihe.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * ds);
    ih.connect(ihe); ihe.connect(this.#masterGain);
    ih.start(t); ih.stop(t + 0.18 * ds);

    // Layer 4: Tiny attack transient
    const click = this.#ctx.createBufferSource();
    click.buffer = this.#createNoiseBuffer(0.004);
    const cke = this.#ctx.createGain();
    cke.gain.setValueAtTime(0.08, t);
    cke.gain.exponentialRampToValueAtTime(0.001, t + 0.004);
    click.connect(cke); cke.connect(this.#masterGain);
    click.start(t); click.stop(t + 0.006);
  }

  #cellPopMetal(t, progress, pitch, ds) {
    // Metal shard clanging — resonant ping + rattle
    const freq = (300 + progress * 600) * pitch;

    // Layer 1: Sharp metallic transient
    const hit = this.#ctx.createBufferSource();
    hit.buffer = this.#createNoiseBuffer(0.01);
    const hf = this.#ctx.createBiquadFilter();
    hf.type = 'bandpass'; hf.frequency.value = freq * 4; hf.Q.value = 12;
    const he = this.#ctx.createGain();
    he.gain.setValueAtTime(0.2, t);
    he.gain.exponentialRampToValueAtTime(0.001, t + 0.015 * ds);
    hit.connect(hf); hf.connect(he); he.connect(this.#masterGain);
    hit.start(t); hit.stop(t + 0.02 * ds);

    // Layer 2: Resonant ring (metal has high-Q resonances)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sawtooth';
    ring.frequency.value = freq;
    const rf = this.#ctx.createBiquadFilter();
    rf.type = 'bandpass'; rf.frequency.value = freq * 3; rf.Q.value = 15;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.1, t);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.18 * ds);
    ring.connect(rf); rf.connect(re); re.connect(this.#masterGain);
    this.#addReverb(re, 0.25 * ds, 0.2, 0.06);
    ring.start(t); ring.stop(t + 0.2 * ds);

    // Layer 3: Sub-clank (felt impact)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq * 0.25, t);
    sub.frequency.exponentialRampToValueAtTime(freq * 0.1, t + 0.05 * ds);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.12, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.06 * ds);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.07 * ds);
  }

  #cellPopIce(t, progress, pitch, ds) {
    // Ice crystal snapping — sharp crack + sparkle
    const freq = (3000 + progress * 4000) * pitch;

    // Layer 1: Sharp snap (< 3ms — sounds like ice cracking)
    const snap = this.#ctx.createOscillator();
    snap.type = 'sine';
    snap.frequency.setValueAtTime(freq, t);
    snap.frequency.exponentialRampToValueAtTime(freq * 0.2, t + 0.02 * ds);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.16, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.03 * ds);
    snap.connect(se); se.connect(this.#masterGain);
    snap.start(t); snap.stop(t + 0.035 * ds);

    // Layer 2: Ice shard tinkle (high-pass noise burst)
    const shard = this.#ctx.createBufferSource();
    shard.buffer = this.#createNoiseBuffer(0.04 * ds);
    const sf = this.#ctx.createBiquadFilter();
    sf.type = 'highpass'; sf.frequency.value = 8000;
    const sf2 = this.#ctx.createBiquadFilter();
    sf2.type = 'peaking'; sf2.frequency.value = 10000 + progress * 2000; sf2.gain.value = 8; sf2.Q.value = 3;
    const she = this.#ctx.createGain();
    she.gain.setValueAtTime(0.07, t);
    she.gain.exponentialRampToValueAtTime(0.001, t + 0.04 * ds);
    shard.connect(sf); sf.connect(sf2); sf2.connect(she); she.connect(this.#masterGain);
    shard.start(t); shard.stop(t + 0.045 * ds);

    // Layer 3: Tiny resonant ring (ice has crystalline resonance)
    const ring = this.#ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = freq * 0.7;
    const re = this.#ctx.createGain();
    re.gain.setValueAtTime(0.04, t + 0.005);
    re.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * ds);
    ring.connect(re); re.connect(this.#masterGain);
    ring.start(t + 0.005); ring.stop(t + 0.09 * ds);
  }

  // ─── Row Cleared Sound — theme-aware completion ──────────────────────

  /**
   * Completion sound when an entire row finishes vanishing.
   */
  playRowCleared(rowIndex = 0) {
    if (!this.#ctx) return;
    const t = this.#now();
    const pitch = 0.95 + Math.random() * 0.1;
    const ds = 2 / this.#animSpeed; // duration scale

    switch (this.#soundTheme) {
      case 'concrete': this.#rowClearedConcrete(t, rowIndex, pitch, ds); break;
      case 'crystal':  this.#rowClearedCrystal(t, rowIndex, pitch, ds); break;
      case 'metal':    this.#rowClearedMetal(t, rowIndex, pitch, ds); break;
      case 'ice':      this.#rowClearedIce(t, rowIndex, pitch, ds); break;
      default:         this.#rowClearedGlass(t, rowIndex, pitch, ds); break;
    }
  }

  #rowClearedGlass(t, rowIndex, pitch, ds) {
    // One continuous glass pane shattering left-to-right
    // Total sound duration spans the full cell sweep
    const dur = 0.8 * ds; // total sound length

    // Layer 1: Sweeping crack — bandpass noise sweeps L-to-R (high→low freq = left→right)
    const sweep = this.#ctx.createBufferSource();
    sweep.buffer = this.#createNoiseBuffer(dur + 0.2);
    const swF = this.#ctx.createBiquadFilter();
    swF.type = 'bandpass'; swF.Q.value = 2.5;
    swF.frequency.setValueAtTime(8000, t);
    swF.frequency.linearRampToValueAtTime(1200, t + dur * 0.8);
    swF.frequency.exponentialRampToValueAtTime(400, t + dur);
    const swE = this.#ctx.createGain();
    swE.gain.setValueAtTime(0.08, t);
    swE.gain.linearRampToValueAtTime(0.30, t + dur * 0.15);
    swE.gain.setValueAtTime(0.25, t + dur * 0.5);
    swE.gain.linearRampToValueAtTime(0.10, t + dur * 0.85);
    swE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    sweep.connect(swF); swF.connect(swE); swE.connect(this.#masterGain);
    this.#addReverb(swE, dur * 0.6, 0.3, 0.2);
    sweep.start(t); sweep.stop(t + dur + 0.1);

    // Layer 2: Staggered crack transients — 6-8 sharp pops spread across the sweep
    const cracks = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cracks; i++) {
      const ct = t + (i / cracks) * dur * 0.9 + Math.random() * 0.02 * ds;
      const cn = this.#ctx.createBufferSource();
      cn.buffer = this.#createNoiseBuffer(0.025);
      const cf = this.#ctx.createBiquadFilter();
      cf.type = 'highpass';
      cf.frequency.value = 3000 + Math.random() * 5000;
      const ce = this.#ctx.createGain();
      ce.gain.setValueAtTime(0.12 + Math.random() * 0.10, ct);
      ce.gain.exponentialRampToValueAtTime(0.001, ct + 0.02 + Math.random() * 0.015);
      cn.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
      cn.start(ct); cn.stop(ct + 0.04);
    }

    // Layer 3: Glass shard tinkles — high-pitched sine pings that trail behind the crack
    const shards = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < shards; i++) {
      const st = t + (i / shards) * dur * 0.85 + 0.03 * ds;
      const shard = this.#ctx.createOscillator();
      shard.type = 'sine';
      shard.frequency.value = (3000 + Math.random() * 5000) * pitch;
      const se = this.#ctx.createGain();
      se.gain.setValueAtTime(0.06, st);
      se.gain.exponentialRampToValueAtTime(0.001, st + 0.08 * ds);
      shard.connect(se); se.connect(this.#masterGain);
      shard.start(st); shard.stop(st + 0.1 * ds);
    }

    // Layer 4: Musical reward chime — escalates per row
    const chordFreqs = [523, 659, 784, 1047];
    const chime = this.#ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.value = chordFreqs[Math.min(rowIndex, 3)] * pitch;
    const chE = this.#ctx.createGain();
    chE.gain.setValueAtTime(0, t + 0.05 * ds);
    chE.gain.linearRampToValueAtTime(0.12, t + 0.08 * ds);
    chE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    chime.connect(chE); chE.connect(this.#masterGain);
    this.#addReverb(chE, dur * 0.5, 0.2, 0.08);
    chime.start(t + 0.05 * ds); chime.stop(t + dur + 0.05);

    // Layer 5: Sub-bass impact (visceral weight)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(55 + rowIndex * 8, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + dur * 0.5);
    const subE = this.#ctx.createGain();
    subE.gain.setValueAtTime(0.18, t);
    subE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.4);
    sub.connect(subE); subE.connect(this.#masterGain);
    sub.start(t); sub.stop(t + dur * 0.5);
  }

  #rowClearedConcrete(t, rowIndex, pitch, ds) {
    // Concrete slab crumbling left-to-right — heavy, gritty, rumbling
    const dur = 0.8 * ds;

    // Layer 1: Low rumbling crumble sweep (bandpass noise, freq drops as it sweeps right)
    const rumble = this.#ctx.createBufferSource();
    rumble.buffer = this.#createNoiseBuffer(dur + 0.2);
    const rF = this.#ctx.createBiquadFilter();
    rF.type = 'bandpass'; rF.Q.value = 0.8;
    rF.frequency.setValueAtTime(600, t);
    rF.frequency.linearRampToValueAtTime(200, t + dur);
    const rE = this.#ctx.createGain();
    rE.gain.setValueAtTime(0.05, t);
    rE.gain.linearRampToValueAtTime(0.28, t + dur * 0.12);
    rE.gain.setValueAtTime(0.22, t + dur * 0.6);
    rE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    rumble.connect(rF); rF.connect(rE); rE.connect(this.#masterGain);
    rumble.start(t); rumble.stop(t + dur + 0.1);

    // Layer 2: Cracking impacts — staggered concrete chunks snapping
    const chunks = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < chunks; i++) {
      const ct = t + (i / chunks) * dur * 0.85 + Math.random() * 0.02 * ds;
      const cn = this.#ctx.createBufferSource();
      cn.buffer = this.#createNoiseBuffer(0.04);
      const cf = this.#ctx.createBiquadFilter();
      cf.type = 'bandpass'; cf.frequency.value = 200 + Math.random() * 400; cf.Q.value = 1.5;
      const ce = this.#ctx.createGain();
      ce.gain.setValueAtTime(0.15 + Math.random() * 0.12, ct);
      ce.gain.exponentialRampToValueAtTime(0.001, ct + 0.03 + Math.random() * 0.02);
      cn.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
      cn.start(ct); cn.stop(ct + 0.06);
    }

    // Layer 3: Dust/debris trail (high-freq noise fading in behind the crack front)
    const dust = this.#ctx.createBufferSource();
    dust.buffer = this.#createNoiseBuffer(dur);
    const dF = this.#ctx.createBiquadFilter();
    dF.type = 'highpass'; dF.frequency.value = 2000;
    const dE = this.#ctx.createGain();
    dE.gain.setValueAtTime(0, t + dur * 0.1);
    dE.gain.linearRampToValueAtTime(0.06, t + dur * 0.3);
    dE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    dust.connect(dF); dF.connect(dE); dE.connect(this.#masterGain);
    this.#addReverb(dE, dur * 0.4, 0.15, 0.08);
    dust.start(t); dust.stop(t + dur + 0.05);

    // Layer 4: Sub-bass thud (the weight of concrete)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime((50 + rowIndex * 10) * pitch, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + dur * 0.4);
    const sE = this.#ctx.createGain();
    sE.gain.setValueAtTime(0.30, t);
    sE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.35);
    sub.connect(sE); sE.connect(this.#masterGain);
    sub.start(t); sub.stop(t + dur * 0.4);
  }

  #rowClearedCrystal(t, rowIndex, pitch, ds) {
    // Crystal rod fracturing left-to-right — shimmering harmonic cascade
    const dur = 0.8 * ds;
    const chordFreqs = [523, 659, 784, 1047];
    const base = chordFreqs[Math.min(rowIndex, 3)] * pitch;

    // Layer 1: Cascading harmonic pings — staggered across the sweep
    const intervals = [1, 1.25, 1.5, 2, 2.5, 3];
    for (let i = 0; i < intervals.length; i++) {
      const osc = this.#ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = base * intervals[i];
      const env = this.#ctx.createGain();
      const st = t + (i / intervals.length) * dur * 0.6;
      env.gain.setValueAtTime(0, st);
      env.gain.linearRampToValueAtTime(0.10, st + 0.01 * ds);
      env.gain.exponentialRampToValueAtTime(0.001, st + dur * 0.7);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(st); osc.stop(st + dur * 0.8);
    }

    // Layer 2: Crystalline shatter sweep (highpass noise sweeping down)
    const shatter = this.#ctx.createBufferSource();
    shatter.buffer = this.#createNoiseBuffer(dur);
    const sF = this.#ctx.createBiquadFilter();
    sF.type = 'bandpass'; sF.Q.value = 4;
    sF.frequency.setValueAtTime(10000, t);
    sF.frequency.exponentialRampToValueAtTime(2000, t + dur * 0.8);
    const sE = this.#ctx.createGain();
    sE.gain.setValueAtTime(0.04, t);
    sE.gain.linearRampToValueAtTime(0.08, t + dur * 0.2);
    sE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    shatter.connect(sF); sF.connect(sE); sE.connect(this.#masterGain);
    this.#addReverb(sE, dur * 0.8, 0.35, 0.18);
    shatter.start(t); shatter.stop(t + dur + 0.1);

    // Layer 3: Inharmonic shimmer (crystal character — detuned partial)
    const shim = this.#ctx.createOscillator();
    shim.type = 'sine';
    shim.frequency.value = base * 3.76;
    const shE = this.#ctx.createGain();
    shE.gain.setValueAtTime(0.03, t);
    shE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
    shim.connect(shE); shE.connect(this.#masterGain);
    shim.start(t); shim.stop(t + dur * 0.75);
  }

  #rowClearedMetal(t, rowIndex, pitch, ds) {
    // Metal beam tearing apart left-to-right — grinding, clanging, resonant
    const dur = 0.8 * ds;
    const freq = (150 + rowIndex * 60) * pitch;

    // Layer 1: Grinding metal sweep (sawtooth through sweeping bandpass)
    const grind = this.#ctx.createOscillator();
    grind.type = 'sawtooth';
    grind.frequency.setValueAtTime(freq, t);
    grind.frequency.linearRampToValueAtTime(freq * 0.5, t + dur);
    const gF = this.#ctx.createBiquadFilter();
    gF.type = 'bandpass'; gF.Q.value = 8;
    gF.frequency.setValueAtTime(freq * 4, t);
    gF.frequency.linearRampToValueAtTime(freq * 1.5, t + dur);
    const gE = this.#ctx.createGain();
    gE.gain.setValueAtTime(0.05, t);
    gE.gain.linearRampToValueAtTime(0.18, t + dur * 0.1);
    gE.gain.setValueAtTime(0.15, t + dur * 0.6);
    gE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    grind.connect(gF); gF.connect(gE); gE.connect(this.#masterGain);
    this.#addReverb(gE, dur * 0.5, 0.3, 0.12);
    grind.start(t); grind.stop(t + dur + 0.05);

    // Layer 2: Impact clangs — staggered metallic hits
    const clangs = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < clangs; i++) {
      const ct = t + (i / clangs) * dur * 0.85 + Math.random() * 0.015 * ds;
      const clang = this.#ctx.createOscillator();
      clang.type = 'square';
      clang.frequency.value = (300 + Math.random() * 800) * pitch;
      const cF = this.#ctx.createBiquadFilter();
      cF.type = 'bandpass'; cF.frequency.value = clang.frequency.value * 3; cF.Q.value = 15;
      const cE = this.#ctx.createGain();
      cE.gain.setValueAtTime(0.10 + Math.random() * 0.08, ct);
      cE.gain.exponentialRampToValueAtTime(0.001, ct + 0.06 * ds);
      clang.connect(cF); cF.connect(cE); cE.connect(this.#masterGain);
      clang.start(ct); clang.stop(ct + 0.08 * ds);
    }

    // Layer 3: Rattling debris (high-Q resonant noise bursts)
    const rattle = this.#ctx.createBufferSource();
    rattle.buffer = this.#createNoiseBuffer(dur * 0.7);
    const rF = this.#ctx.createBiquadFilter();
    rF.type = 'bandpass'; rF.frequency.value = 2000; rF.Q.value = 12;
    const rE = this.#ctx.createGain();
    rE.gain.setValueAtTime(0, t + dur * 0.15);
    rE.gain.linearRampToValueAtTime(0.05, t + dur * 0.3);
    rE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.85);
    rattle.connect(rF); rF.connect(rE); rE.connect(this.#masterGain);
    rattle.start(t); rattle.stop(t + dur * 0.9);

    // Layer 4: Sub-bass thud
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(45, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + dur * 0.3);
    const sE = this.#ctx.createGain();
    sE.gain.setValueAtTime(0.22, t);
    sE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.3);
    sub.connect(sE); sE.connect(this.#masterGain);
    sub.start(t); sub.stop(t + dur * 0.35);
  }

  #rowClearedIce(t, rowIndex, pitch, ds) {
    // Ice shelf cracking left-to-right — sharp fracture propagation + tinkles
    const dur = 0.8 * ds;

    // Layer 1: Propagating crack sweep (bright noise with descending bandpass)
    const crack = this.#ctx.createBufferSource();
    crack.buffer = this.#createNoiseBuffer(dur + 0.2);
    const cF = this.#ctx.createBiquadFilter();
    cF.type = 'bandpass'; cF.Q.value = 2;
    cF.frequency.setValueAtTime(9000, t);
    cF.frequency.linearRampToValueAtTime(2000, t + dur * 0.7);
    cF.frequency.exponentialRampToValueAtTime(800, t + dur);
    const cE = this.#ctx.createGain();
    cE.gain.setValueAtTime(0.06, t);
    cE.gain.linearRampToValueAtTime(0.22, t + dur * 0.1);
    cE.gain.setValueAtTime(0.18, t + dur * 0.5);
    cE.gain.exponentialRampToValueAtTime(0.001, t + dur);
    crack.connect(cF); cF.connect(cE); cE.connect(this.#masterGain);
    this.#addReverb(cE, dur * 0.5, 0.25, 0.15);
    crack.start(t); crack.stop(t + dur + 0.1);

    // Layer 2: Sharp crack transients — ice snapping
    const snaps = 7 + Math.floor(Math.random() * 4);
    for (let i = 0; i < snaps; i++) {
      const st = t + (i / snaps) * dur * 0.9 + Math.random() * 0.01 * ds;
      const snap = this.#ctx.createBufferSource();
      snap.buffer = this.#createNoiseBuffer(0.015);
      const sF = this.#ctx.createBiquadFilter();
      sF.type = 'highpass'; sF.frequency.value = 5000 + Math.random() * 4000;
      const sE = this.#ctx.createGain();
      sE.gain.setValueAtTime(0.15 + Math.random() * 0.10, st);
      sE.gain.exponentialRampToValueAtTime(0.001, st + 0.015 + Math.random() * 0.01);
      snap.connect(sF); sF.connect(sE); sE.connect(this.#masterGain);
      snap.start(st); snap.stop(st + 0.03);
    }

    // Layer 3: Ice shard tinkles — crystalline pings trailing behind the crack
    const tinkles = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < tinkles; i++) {
      const tt = t + (i / tinkles) * dur * 0.8 + 0.04 * ds;
      const tink = this.#ctx.createOscillator();
      tink.type = 'sine';
      tink.frequency.value = (5000 + Math.random() * 7000) * pitch;
      const tE = this.#ctx.createGain();
      tE.gain.setValueAtTime(0.04 + Math.random() * 0.03, tt);
      tE.gain.exponentialRampToValueAtTime(0.001, tt + 0.06 * ds);
      tink.connect(tE); tE.connect(this.#masterGain);
      tink.start(tt); tink.stop(tt + 0.08 * ds);
    }

    // Layer 4: Deep ice groan (sub-bass — the lake groaning)
    const groan = this.#ctx.createOscillator();
    groan.type = 'sine';
    groan.frequency.setValueAtTime(50 * pitch, t);
    groan.frequency.linearRampToValueAtTime(30, t + dur * 0.5);
    const gE = this.#ctx.createGain();
    gE.gain.setValueAtTime(0.14, t);
    gE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5);
    groan.connect(gE); gE.connect(this.#masterGain);
    groan.start(t); groan.stop(t + dur * 0.55);
  }
}

export { SoundEngine, SOUND_THEMES };
