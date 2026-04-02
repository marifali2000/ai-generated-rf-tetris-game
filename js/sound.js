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

const SOUND_THEMES = Object.freeze(['glass', 'concrete', 'crystal', 'metal', 'ice', 'wood', 'plastic', 'gold', 'silver']);

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
      case 'wood': this.#spawnWood(); break;
      case 'plastic': this.#spawnPlastic(); break;
      case 'gold': this.#spawnGold(); break;
      case 'silver': this.#spawnSilver(); break;
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

  #spawnWood() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Wooden knock
    this.#ping(t, 400 * pf, 0.05, 0.18);
    this.#crackBurst(t, 800, 2, 0.008, 0.10);
  }

  #spawnPlastic() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Plastic click-pop
    this.#ping(t, 1400 * pf, 0.04, 0.15);
    this.#ping(t + 0.01, 2800 * pf, 0.02, 0.06);
  }

  #spawnGold() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Rich bell chime
    this.#ping(t, 800 * pf, 0.12, 0.14);
    this.#ping(t, 1200 * pf, 0.08, 0.06);
  }

  #spawnSilver() {
    const t = this.#now();
    const pf = 0.96 + Math.random() * 0.08;
    // Bright silver ting
    this.#ping(t, 3000 * pf, 0.06, 0.12);
    this.#ping(t, 4500 * pf, 0.04, 0.05);
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
      case 'wood': this.#rotateWood(); break;
      case 'plastic': this.#rotatePlastic(); break;
      case 'gold': this.#rotateGold(); break;
      case 'silver': this.#rotateSilver(); break;
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

  #rotateWood() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    this.#crackBurst(t, 600 * p, 2, 0.006, 0.12);
  }

  #rotatePlastic() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    this.#ping(t, 2200 * p, 0.025, 0.15);
  }

  #rotateGold() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    this.#ping(t, 1200 * p, 0.04, 0.14);
    this.#ping(t, 1800 * p, 0.025, 0.05);
  }

  #rotateSilver() {
    const t = this.#now();
    const p = 0.97 + Math.random() * 0.06;
    this.#ping(t, 3500 * p, 0.03, 0.13);
    this.#ping(t, 5250 * p, 0.02, 0.04);
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
      case 'wood': this.#lockWood(); break;
      case 'plastic': this.#lockPlastic(); break;
      case 'gold': this.#lockGold(); break;
      case 'silver': this.#lockSilver(); break;
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

  #lockWood() {
    const t = this.#now();
    // Solid wood thunk
    this.#ping(t, 180 + Math.random() * 60, 0.04, 0.22);
    this.#crackBurst(t, 500, 1.5, 0.005, 0.15);
  }

  #lockPlastic() {
    const t = this.#now();
    // Plastic snap-click
    this.#crackBurst(t, 2800 + Math.random() * 400, 3, 0.004, 0.20);
    this.#ping(t, 1000, 0.02, 0.08);
  }

  #lockGold() {
    const t = this.#now();
    // Gold coin clink
    this.#ping(t, 800, 0.06, 0.18);
    this.#ping(t + 0.005, 1200, 0.04, 0.08);
  }

  #lockSilver() {
    const t = this.#now();
    // Silver clink
    this.#ping(t, 2800, 0.04, 0.16);
    this.#crackBurst(t, 4000, 8, 0.004, 0.08);
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
      case 'wood': this.#hardDropWood(); break;
      case 'plastic': this.#hardDropPlastic(); break;
      case 'gold': this.#hardDropGold(); break;
      case 'silver': this.#hardDropSilver(); break;
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

  #hardDropWood() {
    const t = this.#now();
    // Heavy wood slam
    this.#ping(t, 80, 0.1, 0.35);
    this.#ping(t, 160, 0.06, 0.15);
    this.#crackBurst(t, 400, 1.5, 0.02, 0.18);
  }

  #hardDropPlastic() {
    const t = this.#now();
    // Hollow plastic impact
    this.#ping(t, 120, 0.08, 0.30);
    this.#crackBurst(t, 1500, 2, 0.015, 0.15);
    this.#ping(t + 0.01, 600, 0.04, 0.10);
  }

  #hardDropGold() {
    const t = this.#now();
    // Heavy gold thud with ring
    this.#ping(t, 70, 0.12, 0.40);
    this.#ping(t + 0.02, 500, 0.10, 0.12);
    this.#ping(t + 0.02, 750, 0.08, 0.06);
  }

  #hardDropSilver() {
    const t = this.#now();
    // Bright silver crash
    this.#ping(t, 80, 0.10, 0.35);
    this.#crackBurst(t, 3000, 10, 0.015, 0.15);
    this.#ping(t + 0.01, 2000, 0.06, 0.10);
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
      case 'wood': this.#playWoodSplit(t, intensity, totalDur, vol, comboShift); break;
      case 'plastic': this.#playPlasticSnap(t, intensity, totalDur, vol, comboShift); break;
      case 'gold': this.#playGoldCrash(t, intensity, totalDur, vol, comboShift); break;
      case 'silver': this.#playSilverShatter(t, intensity, totalDur, vol, comboShift); break;
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

  // ── LINE CLEAR: WOOD — splintering snap cascade ─────────────────────
  #playWoodSplit(t, intensity, totalDur, vol, comboShift) {
    const dur = totalDur;
    // Initial snap
    this.#crackBurst(t, 400, 2, 0.012, vol * 0.6);
    this.#ping(t, 100, 0.08, vol * 0.4);
    // Splinter cascade — increasing density with intensity
    const count = 3 + intensity * 2;
    for (let i = 0; i < count; i++) {
      const ct = t + (i / count) * dur * 0.8 + Math.random() * 0.02;
      const freq = (300 + Math.random() * 600) * (1 + comboShift);
      this.#crackBurst(ct, freq, 1.5 + Math.random(), 0.008 + Math.random() * 0.006, vol * (0.3 + Math.random() * 0.2));
      if (Math.random() > 0.5) this.#ping(ct, 150 + Math.random() * 100, 0.03, vol * 0.08);
    }
    // Sub-bass thump
    this.#ping(t, 50, dur * 0.3, vol * 0.35);
  }

  // ── LINE CLEAR: PLASTIC — hollow snapping pops ──────────────────────
  #playPlasticSnap(t, intensity, totalDur, vol, comboShift) {
    const dur = totalDur;
    // Hollow pop at start
    this.#ping(t, 300 * (1 + comboShift), 0.05, vol * 0.5);
    this.#crackBurst(t, 1800, 3, 0.008, vol * 0.4);
    // Pop cascade
    const count = 4 + intensity * 2;
    for (let i = 0; i < count; i++) {
      const ct = t + (i / count) * dur * 0.8 + Math.random() * 0.015;
      const freq = (1200 + Math.random() * 2000) * (1 + comboShift);
      this.#crackBurst(ct, freq, 3 + Math.random() * 2, 0.005 + Math.random() * 0.004, vol * (0.2 + Math.random() * 0.15));
      this.#ping(ct + 0.003, 800 + Math.random() * 600, 0.02, vol * 0.06);
    }
    this.#ping(t, 60, dur * 0.2, vol * 0.25);
  }

  // ── LINE CLEAR: GOLD — majestic bell crash ──────────────────────────
  #playGoldCrash(t, intensity, totalDur, vol, comboShift) {
    const dur = totalDur;
    const base = 400 * (1 + comboShift);
    // Big bell impact
    this.#ping(t, base, dur * 0.7, vol * 0.4);
    this.#ping(t, base * 1.5, dur * 0.5, vol * 0.2);
    this.#ping(t, base * 2, dur * 0.3, vol * 0.12);
    // Crash texture
    this.#crackBurst(t, 600, 2, 0.02, vol * 0.3);
    // Cascading harmonics
    const harmonics = [1, 1.25, 1.5, 2, 2.5, 3];
    const count = Math.min(intensity + 2, harmonics.length);
    for (let i = 0; i < count; i++) {
      const ct = t + (i / count) * dur * 0.5 + Math.random() * 0.01;
      const g = this.#ping(ct, base * harmonics[i], dur * 0.4, vol * 0.08);
      this.#addReverb(g, dur * 0.3, 0.2, 0.06);
    }
    this.#ping(t, 50, dur * 0.25, vol * 0.3);
  }

  // ── LINE CLEAR: SILVER — bright shimmering crash ────────────────────
  #playSilverShatter(t, intensity, totalDur, vol, comboShift) {
    const dur = totalDur;
    const base = 2000 * (1 + comboShift);
    // Bright initial hit
    this.#crackBurst(t, base, 12, 0.008, vol * 0.5);
    this.#ping(t, base * 0.5, 0.08, vol * 0.3);
    // Silver tinkle cascade
    const count = 4 + intensity * 2;
    for (let i = 0; i < count; i++) {
      const ct = t + (i / count) * dur * 0.75 + Math.random() * 0.015;
      const freq = (2000 + Math.random() * 3000) * (1 + comboShift);
      this.#crackBurst(ct, freq, 10 + Math.random() * 8, 0.005 + Math.random() * 0.004, vol * (0.15 + Math.random() * 0.1));
      this.#ping(ct + 0.002, freq * 0.7, 0.04, vol * 0.06);
    }
    this.#ping(t, 60, dur * 0.2, vol * 0.25);
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
      case 'wood': this.#levelUpWood(); break;
      case 'plastic': this.#levelUpPlastic(); break;
      case 'gold': this.#levelUpGold(); break;
      case 'silver': this.#levelUpSilver(); break;
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

  #levelUpWood() {
    const t = this.#now();
    // Ascending wooden knocks
    for (let i = 0; i < 4; i++) {
      this.#ping(t + i * 0.07, 300 + i * 150, 0.06, 0.16);
      this.#crackBurst(t + i * 0.07, 500 + i * 100, 1.5, 0.005, 0.08);
    }
  }

  #levelUpPlastic() {
    const t = this.#now();
    // Bouncy ascending pops
    for (let i = 0; i < 4; i++) {
      this.#ping(t + i * 0.06, 600 + i * 300, 0.05, 0.14);
      this.#ping(t + i * 0.06, 1200 + i * 600, 0.03, 0.06);
    }
  }

  #levelUpGold() {
    const t = this.#now();
    // Majestic ascending chime — C major arpeggio
    const freqs = [523, 659, 784, 1047];
    for (let i = 0; i < 4; i++) {
      const g = this.#ping(t + i * 0.08, freqs[i], 0.25, 0.16);
      this.#ping(t + i * 0.08, freqs[i] * 1.5, 0.15, 0.06);
      this.#addReverb(g, 0.3, 0.25, 0.08);
    }
  }

  #levelUpSilver() {
    const t = this.#now();
    // Bright ascending tinkles
    for (let i = 0; i < 4; i++) {
      this.#ping(t + i * 0.06, 3000 + i * 800, 0.08, 0.12);
      this.#crackBurst(t + i * 0.06, 4000 + i * 500, 10, 0.004, 0.06);
    }
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
      case 'wood': this.#gameOverWood(); break;
      case 'plastic': this.#gameOverPlastic(); break;
      case 'gold': this.#gameOverGold(); break;
      case 'silver': this.#gameOverSilver(); break;
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

  #gameOverWood() {
    const t = this.#now();
    // Wood collapsing — descending thuds
    for (let i = 0; i < 6; i++) {
      const s = t + i * 0.3;
      this.#crackBurst(s, 300 - i * 30, 1.5, 0.02, 0.20 - i * 0.02);
      this.#ping(s, 120 - i * 10, 0.15, 0.15);
    }
    this.#ping(t, 40, 2.0, 0.10);
  }

  #gameOverPlastic() {
    const t = this.#now();
    // Plastic crumbling apart
    for (let i = 0; i < 6; i++) {
      const s = t + i * 0.25;
      this.#crackBurst(s, 1500 - i * 150, 3, 0.015, 0.18 - i * 0.02);
      this.#ping(s, 500 - i * 50, 0.10, 0.12);
    }
    this.#ping(t, 45, 1.8, 0.08);
  }

  #gameOverGold() {
    const t = this.#now();
    // Gold tower falling — descending rich bells
    const freqs = [784, 659, 523, 440, 349, 262];
    for (let i = 0; i < 6; i++) {
      const s = t + i * 0.3;
      const g = this.#ping(s, freqs[i], 0.4, 0.18 - i * 0.02);
      this.#ping(s, freqs[i] * 1.5, 0.25, 0.06);
      this.#addReverb(g, 0.5, 0.2, 0.08);
    }
    this.#ping(t, 35, 2.0, 0.12);
  }

  #gameOverSilver() {
    const t = this.#now();
    // Silver shattering cascade
    for (let i = 0; i < 6; i++) {
      const s = t + i * 0.28;
      this.#crackBurst(s, 3000 - i * 300, 12, 0.012, 0.18 - i * 0.02);
      this.#ping(s, 2000 - i * 200, 0.12, 0.10);
    }
    this.#ping(t, 40, 2.0, 0.10);
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
      case 'wood': this.#moveWood(); break;
      case 'plastic': this.#movePlastic(); break;
      case 'gold': this.#moveGold(); break;
      case 'silver': this.#moveSilver(); break;
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

  #moveWood() {
    const t = this.#now();
    this.#crackBurst(t, 500 + Math.random() * 200, 1.5, 0.004, 0.04);
  }

  #movePlastic() {
    const t = this.#now();
    this.#ping(t, 1800 + Math.random() * 400, 0.015, 0.04);
  }

  #moveGold() {
    const t = this.#now();
    this.#ping(t, 900 + Math.random() * 200, 0.02, 0.04);
  }

  #moveSilver() {
    const t = this.#now();
    this.#ping(t, 3200 + Math.random() * 400, 0.015, 0.04);
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
      case 'wood': this.#holdWood(); break;
      case 'plastic': this.#holdPlastic(); break;
      case 'gold': this.#holdGold(); break;
      case 'silver': this.#holdSilver(); break;
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

  #holdWood() {
    const t = this.#now();
    // Wood slide
    this.#crackBurst(t, 600, 1.5, 0.015, 0.10);
    this.#ping(t + 0.02, 350, 0.04, 0.08);
  }

  #holdPlastic() {
    const t = this.#now();
    // Plastic slide snap
    this.#crackBurst(t, 2000, 3, 0.01, 0.10);
    this.#ping(t + 0.01, 1200, 0.03, 0.06);
  }

  #holdGold() {
    const t = this.#now();
    // Gold coin flip
    this.#ping(t, 700, 0.08, 0.10);
    this.#ping(t + 0.03, 1050, 0.06, 0.06);
  }

  #holdSilver() {
    const t = this.#now();
    // Silver ting-slide
    this.#ping(t, 2500, 0.06, 0.10);
    this.#ping(t + 0.02, 3750, 0.04, 0.05);
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
      case 'wood': this.#comboHitWood(combo); break;
      case 'plastic': this.#comboHitPlastic(combo); break;
      case 'gold': this.#comboHitGold(combo); break;
      case 'silver': this.#comboHitSilver(combo); break;
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

  #comboHitWood(combo) {
    const t = this.#now();
    const semi = Math.min(combo - 2, 12);
    const freq = 300 * Math.pow(2, semi / 12);
    this.#crackBurst(t, freq, 2, 0.01, 0.15);
    this.#ping(t, freq * 0.5, 0.06, 0.12);
  }

  #comboHitPlastic(combo) {
    const t = this.#now();
    const semi = Math.min(combo - 2, 12);
    const freq = 1000 * Math.pow(2, semi / 12);
    this.#ping(t, freq, 0.05, 0.15);
    this.#ping(t, freq * 2, 0.03, 0.06);
  }

  #comboHitGold(combo) {
    const t = this.#now();
    const semi = Math.min(combo - 2, 12);
    const freq = 500 * Math.pow(2, semi / 12);
    const g = this.#ping(t, freq, 0.15, 0.16);
    this.#ping(t, freq * 1.5, 0.10, 0.07);
    this.#addReverb(g, 0.2, 0.2, 0.05);
  }

  #comboHitSilver(combo) {
    const t = this.#now();
    const semi = Math.min(combo - 2, 12);
    const freq = 2500 * Math.pow(2, semi / 12);
    this.#ping(t, freq, 0.06, 0.14);
    this.#crackBurst(t, freq * 1.5, 10, 0.004, 0.06);
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
      case 'wood': this.#tSpinWood(type); break;
      case 'plastic': this.#tSpinPlastic(type); break;
      case 'gold': this.#tSpinGold(type); break;
      case 'silver': this.#tSpinSilver(type); break;
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

  #tSpinWood(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.22 : 0.14;
    this.#crackBurst(t, 400, 2, 0.02, vol);
    this.#ping(t + 0.01, 250, 0.08, vol * 0.6);
    if (isFull) this.#crackBurst(t + 0.03, 600, 1.5, 0.015, vol * 0.5);
  }

  #tSpinPlastic(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.22 : 0.14;
    this.#crackBurst(t, 2000, 4, 0.012, vol);
    this.#ping(t, 800, 0.06, vol * 0.5);
    if (isFull) this.#ping(t + 0.03, 1600, 0.05, vol * 0.4);
  }

  #tSpinGold(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.22 : 0.14;
    const g = this.#ping(t, 600, 0.15, vol);
    this.#ping(t, 900, 0.10, vol * 0.4);
    this.#addReverb(g, 0.2, 0.2, 0.06);
    if (isFull) this.#ping(t + 0.03, 1200, 0.10, vol * 0.3);
  }

  #tSpinSilver(type) {
    const t = this.#now();
    const isFull = type === 'full';
    const vol = isFull ? 0.22 : 0.14;
    this.#crackBurst(t, 3000, 12, 0.008, vol);
    this.#ping(t + 0.005, 2500, 0.06, vol * 0.4);
    if (isFull) this.#crackBurst(t + 0.03, 4000, 10, 0.006, vol * 0.4);
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
      case 'wood': this.#perfectClearWood(); break;
      case 'plastic': this.#perfectClearPlastic(); break;
      case 'gold': this.#perfectClearGold(); break;
      case 'silver': this.#perfectClearSilver(); break;
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

  #perfectClearWood() {
    const t = this.#now();
    // Big wood split + ascending knocks
    this.#crackBurst(t, 350, 2, 0.02, 0.30);
    for (let i = 0; i < 4; i++) {
      this.#ping(t + i * 0.08, 250 + i * 100, 0.10, 0.14);
      this.#crackBurst(t + i * 0.08, 400 + i * 80, 1.5, 0.008, 0.10);
    }
  }

  #perfectClearPlastic() {
    const t = this.#now();
    // Cascading plastic snaps
    for (let i = 0; i < 5; i++) {
      this.#crackBurst(t + i * 0.06, 1500 + i * 400, 4, 0.006, 0.18);
      this.#ping(t + i * 0.06, 800 + i * 200, 0.05, 0.10);
    }
  }

  #perfectClearGold() {
    const t = this.#now();
    // Grand bell cascade — ascending major chord
    const freqs = [523, 659, 784, 1047, 1319];
    for (let i = 0; i < 5; i++) {
      const g = this.#ping(t + i * 0.08, freqs[i], 0.3, 0.18);
      this.#ping(t + i * 0.08, freqs[i] * 1.5, 0.2, 0.06);
      this.#addReverb(g, 0.4, 0.25, 0.08);
    }
    this.#ping(t, 50, 0.5, 0.15);
  }

  #perfectClearSilver() {
    const t = this.#now();
    // Bright silver cascade
    for (let i = 0; i < 5; i++) {
      this.#ping(t + i * 0.06, 3000 + i * 600, 0.12, 0.15);
      this.#crackBurst(t + i * 0.06, 4000 + i * 500, 12, 0.005, 0.08);
    }
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
      case 'wood': this.#backToBackWood(); break;
      case 'plastic': this.#backToBackPlastic(); break;
      case 'gold': this.#backToBackGold(); break;
      case 'silver': this.#backToBackSilver(); break;
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

  #backToBackWood() {
    const t = this.#now();
    // Emphatic wood crack
    this.#crackBurst(t, 350, 2, 0.02, 0.28);
    this.#ping(t, 200, 0.10, 0.20);
    this.#crackBurst(t + 0.04, 500, 1.5, 0.012, 0.15);
  }

  #backToBackPlastic() {
    const t = this.#now();
    // Emphatic plastic snap
    this.#crackBurst(t, 2200, 4, 0.012, 0.25);
    this.#ping(t, 800, 0.08, 0.18);
    this.#crackBurst(t + 0.03, 3000, 3, 0.008, 0.12);
  }

  #backToBackGold() {
    const t = this.#now();
    // Emphatic gold crash
    this.#ping(t, 500, 0.20, 0.22);
    this.#ping(t, 750, 0.15, 0.10);
    this.#crackBurst(t, 600, 2, 0.015, 0.18);
    const g = this.#ping(t + 0.03, 1000, 0.12, 0.10);
    this.#addReverb(g, 0.25, 0.2, 0.06);
  }

  #backToBackSilver() {
    const t = this.#now();
    // Emphatic silver crash
    this.#crackBurst(t, 3500, 15, 0.01, 0.25);
    this.#ping(t, 2500, 0.10, 0.18);
    this.#crackBurst(t + 0.03, 4500, 12, 0.008, 0.12);
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
      case 'wood': this.#dangerPulseWood(intensity); break;
      case 'plastic': this.#dangerPulsePlastic(intensity); break;
      case 'gold': this.#dangerPulseGold(intensity); break;
      case 'silver': this.#dangerPulseSilver(intensity); break;
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

  #dangerPulseWood(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const vol = 0.03 + i * 0.012;
    this.#ping(t, 80 + i * 10, 0.08, vol);
    this.#crackBurst(t, 200 + i * 30, 1.5, 0.006, vol * 0.5);
  }

  #dangerPulsePlastic(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const vol = 0.03 + i * 0.012;
    this.#ping(t, 600 + i * 60, 0.05, vol);
    this.#crackBurst(t, 1500 + i * 100, 3, 0.005, vol * 0.4);
  }

  #dangerPulseGold(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const vol = 0.03 + i * 0.012;
    this.#ping(t, 300 + i * 30, 0.10, vol);
    this.#ping(t, 450 + i * 45, 0.06, vol * 0.3);
  }

  #dangerPulseSilver(intensity) {
    const t = this.#now();
    const i = Math.min(intensity, 10);
    const vol = 0.03 + i * 0.012;
    this.#ping(t, 2000 + i * 150, 0.06, vol);
    this.#crackBurst(t, 3000 + i * 200, 10, 0.004, vol * 0.4);
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
      case 'wood':     this.#rowHighlightWood(t, rowIndex, pitch, ds); break;
      case 'plastic':  this.#rowHighlightPlastic(t, rowIndex, pitch, ds); break;
      case 'gold':     this.#rowHighlightGold(t, rowIndex, pitch, ds); break;
      case 'silver':   this.#rowHighlightSilver(t, rowIndex, pitch, ds); break;
      default:         this.#rowHighlightGlass(t, rowIndex, pitch, ds); break;
    }
  }

  #rowHighlightGlass(t, rowIndex, pitch, ds) {
    // Glass stress — intermittent micro-cracks as pressure builds
    const dur = 0.5 * ds;

    // 4-6 intermittent stress cracks — like glass about to shatter
    const cracks = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cracks; i++) {
      const ct = t + (i / cracks) * dur * 0.85 + Math.random() * 0.02 * ds;
      this.#crackBurst(ct, 3000 + rowIndex * 800 + Math.random() * 2000,
        4 + Math.random() * 4, 0.003 + Math.random() * 0.003,
        0.08 + Math.random() * 0.06);
    }

    // Subtle high-freq crinkle — 2-3 very quiet short bursts
    const crinkles = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < crinkles; i++) {
      const ct = t + Math.random() * dur * 0.7;
      this.#crackBurst(ct, 6000 + Math.random() * 3000, 3,
        0.002, 0.03 + Math.random() * 0.02, 'highpass');
    }

    // Sub-bass tension
    this.#ping(t, 45 + rowIndex * 8, dur, 0.08);
  }

  #rowHighlightConcrete(t, rowIndex, pitch, ds) {
    // Concrete stress — deep structural groan + discrete pre-fracture snaps
    const dur = 0.5 * ds;
    const freq = (40 + rowIndex * 12) * pitch;

    // Deep structural groan (oscillator, not noise — no "water" quality)
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.7, t + dur);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 200;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.15, t + 0.1 * ds);
    env.gain.setValueAtTime(0.15, t + 0.3 * ds);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);

    // 3-4 pre-fracture stress cracks
    const cracks = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < cracks; i++) {
      const ct = t + (i / cracks) * dur * 0.8 + Math.random() * 0.03 * ds;
      this.#crackBurst(ct, 200 + Math.random() * 200, 2,
        0.008 + Math.random() * 0.006, 0.08 + Math.random() * 0.05);
    }

    // Rebar stress tone
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
    rebar.start(t); rebar.stop(t + dur);
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
    // Metal stress — bending beam + discrete metallic plinks
    const dur = 0.5 * ds;
    const freq = (80 + rowIndex * 30) * pitch;

    // Deep metallic groan (oscillator through resonant filter)
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.linearRampToValueAtTime(freq * 1.3, t + dur);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq * 2; filter.Q.value = 6;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.1 * ds);
    env.gain.setValueAtTime(0.12, t + 0.35 * ds);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);

    // Metallic plinks — discrete high-Q noise bursts (not continuous rattle)
    const plinks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < plinks; i++) {
      const pt = t + (i / plinks) * dur * 0.7 + Math.random() * 0.03 * ds;
      this.#crackBurst(pt, 800 + rowIndex * 200 + Math.random() * 500,
        12 + Math.random() * 8, 0.008 + Math.random() * 0.005,
        0.04 + Math.random() * 0.03);
    }

    // Sub vibration
    this.#ping(t, 40 * pitch, dur, 0.08);
  }

  #rowHighlightIce(t, rowIndex, pitch, ds) {
    // Ice stress — sharp discrete stress cracks + sub rumble
    const dur = 0.5 * ds;

    // Short sharp crack burst at start
    this.#crackBurst(t, 4000 + rowIndex * 500, 6, 0.004,
      0.12, 'highpass');

    // Second crack after a gap
    this.#crackBurst(t + 0.15 * ds, 5000 + Math.random() * 2000, 5,
      0.003, 0.10, 'highpass');

    // 2-3 additional stress cracks spread across duration
    const extras = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < extras; i++) {
      const ct = t + 0.1 * ds + (i / extras) * dur * 0.7 + Math.random() * 0.03 * ds;
      this.#crackBurst(ct, 3000 + Math.random() * 3000, 4 + Math.random() * 4,
        0.003, 0.05 + Math.random() * 0.04);
    }

    // Low sub-ice rumble (frozen lake groaning)
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(40 * pitch, t);
    sub.frequency.linearRampToValueAtTime(30 * pitch, t + dur);
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0, t);
    se.gain.linearRampToValueAtTime(0.08, t + 0.08 * ds);
    se.gain.linearRampToValueAtTime(0, t + dur);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + dur + 0.05);
  }

  #rowHighlightWood(t, rowIndex, pitch, ds) {
    // Wood stress — creaking + quiet snaps
    const dur = 0.5 * ds;
    // Creaking oscillator (low sawtooth through lowpass)
    const osc = this.#ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime((60 + rowIndex * 15) * pitch, t);
    osc.frequency.linearRampToValueAtTime((45 + rowIndex * 10) * pitch, t + dur);
    const filter = this.#ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 250;
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.12, t + 0.1 * ds);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(filter); filter.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
    // A couple stress cracks
    for (let i = 0; i < 2; i++) {
      this.#crackBurst(t + Math.random() * dur * 0.6, 400 + Math.random() * 300, 1.5, 0.005, 0.06);
    }
  }

  #rowHighlightPlastic(t, rowIndex, pitch, ds) {
    // Plastic stress — creaking + quiet clicks
    const dur = 0.5 * ds;
    // Quiet sine wobble
    const osc = this.#ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime((300 + rowIndex * 50) * pitch, t);
    osc.frequency.linearRampToValueAtTime((250 + rowIndex * 40) * pitch, t + dur);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.08, t + 0.1 * ds);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + dur + 0.05);
    // Stress clicks
    for (let i = 0; i < 2; i++) {
      this.#crackBurst(t + Math.random() * dur * 0.6, 1500 + Math.random() * 1000, 3, 0.003, 0.05);
    }
  }

  #rowHighlightGold(t, rowIndex, pitch, ds) {
    // Gold stress — swelling bell tone
    const dur = 0.5 * ds;
    const base = [523, 659, 784, 1047][Math.min(rowIndex, 3)] * pitch;
    const g = this.#ping(t, base, dur * 0.8, 0.08);
    this.#ping(t + 0.05 * ds, base * 1.5, dur * 0.6, 0.03);
    this.#addReverb(g, dur * 0.5, 0.2, 0.05);
  }

  #rowHighlightSilver(t, rowIndex, pitch, ds) {
    // Silver stress — bright discrete plinks
    const dur = 0.5 * ds;
    const cracks = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < cracks; i++) {
      const ct = t + (i / cracks) * dur * 0.7 + Math.random() * 0.02 * ds;
      this.#crackBurst(ct, 3000 + Math.random() * 2000, 10 + Math.random() * 6, 0.004, 0.06);
    }
    this.#ping(t, 2000 * pitch, dur * 0.5, 0.04);
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
      case 'wood':     this.#cellPopWood(t, progress, pitch, ds); break;
      case 'plastic':  this.#cellPopPlastic(t, progress, pitch, ds); break;
      case 'gold':     this.#cellPopGold(t, progress, pitch, ds); break;
      case 'silver':   this.#cellPopSilver(t, progress, pitch, ds); break;
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

  #cellPopWood(t, colIndex, freq, ds) {
    // Wood chip pop — dry crack + low knock
    this.#crackBurst(t, freq * 0.4, 2, 0.008 * ds, 0.15);
    // Hollow knock body
    const osc = this.#ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180 + colIndex * 15, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.04 * ds);
    const env = this.#ctx.createGain();
    env.gain.setValueAtTime(0.12, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
    osc.connect(env); env.connect(this.#masterGain);
    osc.start(t); osc.stop(t + 0.06 * ds);
  }

  #cellPopPlastic(t, colIndex, freq, ds) {
    // Plastic pop — bright hollow snap
    this.#crackBurst(t, freq * 1.5, 4, 0.005 * ds, 0.12);
    this.#ping(t, 1200 + colIndex * 100, 0.03 * ds, 0.08);
  }

  #cellPopGold(t, colIndex, freq, ds) {
    // Gold ring pop — warm chime
    const base = freq * 0.8;
    this.#ping(t, base, 0.06 * ds, 0.12);
    this.#ping(t + 0.01 * ds, base * 1.5, 0.04 * ds, 0.06);
    // Sub ring
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = base * 0.25;
    const se = this.#ctx.createGain();
    se.gain.setValueAtTime(0.06, t);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
    sub.connect(se); se.connect(this.#masterGain);
    sub.start(t); sub.stop(t + 0.06 * ds);
  }

  #cellPopSilver(t, colIndex, freq, ds) {
    // Silver tinkle pop — bright metallic burst
    this.#crackBurst(t, freq * 2, 12, 0.004 * ds, 0.1);
    this.#ping(t, 3000 + colIndex * 200, 0.04 * ds, 0.07);
    // Modulated ring
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
      case 'wood':     this.#rowClearedWood(t, rowIndex, pitch, ds); break;
      case 'plastic':  this.#rowClearedPlastic(t, rowIndex, pitch, ds); break;
      case 'gold':     this.#rowClearedGold(t, rowIndex, pitch, ds); break;
      case 'silver':   this.#rowClearedSilver(t, rowIndex, pitch, ds); break;
      default:         this.#rowClearedGlass(t, rowIndex, pitch, ds); break;
    }
  }

  // Helper: short filtered noise crack transient — the building block of all break sounds
  #crackBurst(t, freq, q, len, vol, type = 'bandpass') {
    const n = this.#ctx.createBufferSource();
    n.buffer = this.#createNoiseBuffer(len + 0.005);
    const f = this.#ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.#ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(f); f.connect(g); g.connect(this.#masterGain);
    n.start(t); n.stop(t + len + 0.005);
    return g;
  }

  // Helper: quick sine ping with exponential decay
  #ping(t, freq, len, vol) {
    const o = this.#ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = freq;
    const g = this.#ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(this.#masterGain);
    o.start(t); o.stop(t + len + 0.005);
    return g;
  }

  #rowClearedGlass(t, rowIndex, pitch, ds) {
    // Glass pane shattering L→R: sharp discrete cracks only, no continuous noise
    const dur = 0.8 * ds;

    // Initial impact crack at left edge — loud, sharp
    this.#crackBurst(t, 4500 * pitch, 8, 0.004, 0.45);
    this.#ping(t, 3200 * pitch, 0.06, 0.08);

    // Sub-bass thud at impact point
    this.#ping(t, 55 + rowIndex * 8, dur * 0.25, 0.15);

    // 10-cell fracture cascade L→R — each cell is a discrete crack
    for (let i = 0; i < 10; i++) {
      const ct = t + ((i + 1) / 11) * dur * 0.7 + (Math.random() - 0.5) * 0.006 * ds;
      const freq = (3000 + Math.random() * 5000) * pitch;
      // Main crack: short noise burst through high-Q bandpass
      this.#crackBurst(ct, freq, 6 + Math.random() * 6,
        0.003 + Math.random() * 0.003, 0.22 + Math.random() * 0.18);
      // Glass resonance ring from each crack point
      this.#ping(ct + 0.002, freq * 0.8,
        0.03 + Math.random() * 0.03, 0.04 + Math.random() * 0.03);
      // Secondary micro-crack (60% chance)
      if (Math.random() > 0.4) {
        const mt = ct + 0.004 + Math.random() * 0.008;
        this.#crackBurst(mt, (5000 + Math.random() * 4000) * pitch,
          8, 0.002, 0.10 + Math.random() * 0.08);
      }
    }

    // Shard tinkles trailing behind fracture front
    const shards = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < shards; i++) {
      const st = t + (i / shards) * dur * 0.7 + 0.02 * ds + Math.random() * 0.015;
      this.#ping(st, (5000 + Math.random() * 6000) * pitch,
        0.03 + Math.random() * 0.04, 0.03 + Math.random() * 0.03);
    }

    // Late falling debris — quiet tinkles
    for (let i = 0; i < 4; i++) {
      const dt = t + dur * 0.55 + Math.random() * dur * 0.35;
      this.#ping(dt, (6000 + Math.random() * 6000) * pitch,
        0.015 + Math.random() * 0.02, 0.015 + Math.random() * 0.015);
    }
  }

  #rowClearedConcrete(t, rowIndex, pitch, ds) {
    // Concrete fracturing L→R: heavy discrete cracks, chunky impacts, gritty
    const dur = 0.8 * ds;

    // Initial heavy crack — loud low snap + deep thump
    this.#crackBurst(t, 300 * pitch, 2.5, 0.015, 0.42);
    this.#ping(t, (50 + rowIndex * 10) * pitch, 0.04, 0.35);

    // Sub-bass rumble from impact
    const sub = this.#ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime((45 + rowIndex * 8) * pitch, t);
    sub.frequency.exponentialRampToValueAtTime(25, t + dur * 0.4);
    const sE = this.#ctx.createGain();
    sE.gain.setValueAtTime(0.25, t);
    sE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.35);
    sub.connect(sE); sE.connect(this.#masterGain);
    sub.start(t); sub.stop(t + dur * 0.4);

    // 10-cell concrete chunk cascade L→R
    for (let i = 0; i < 10; i++) {
      const ct = t + ((i + 1) / 11) * dur * 0.75 + (Math.random() - 0.5) * 0.008 * ds;
      // Heavy crack: low-mid bandpass noise burst
      this.#crackBurst(ct, 200 + Math.random() * 300, 2 + Math.random() * 2,
        0.012 + Math.random() * 0.01, 0.20 + Math.random() * 0.15);
      // Chunk impact — low sine thud for each chunk
      this.#ping(ct, (60 + Math.random() * 80) * pitch,
        0.02 + Math.random() * 0.01, 0.08 + Math.random() * 0.06);
      // Debris scatter (40% chance)
      if (Math.random() > 0.6) {
        this.#crackBurst(ct + 0.008, 1000 + Math.random() * 1500,
          1.5, 0.006, 0.06 + Math.random() * 0.04);
      }
    }

    // Dust cloud: tiny quiet high-freq bursts trailing behind
    for (let i = 0; i < 6; i++) {
      const dt = t + (i / 6) * dur * 0.6 + 0.03 * ds + Math.random() * 0.01;
      this.#crackBurst(dt, 2000 + Math.random() * 2000, 0.8,
        0.008 + Math.random() * 0.005, 0.03 + Math.random() * 0.02, 'highpass');
    }
  }

  #rowClearedCrystal(t, rowIndex, pitch, ds) {
    // Crystal fracturing L→R: each crack excites a resonant harmonic ping
    const dur = 0.8 * ds;
    const chordFreqs = [523, 659, 784, 1047];
    const base = chordFreqs[Math.min(rowIndex, 3)] * pitch;
    const harmonics = [1, 1.25, 1.5, 2, 2.5, 3, 4];

    // Initial crystal crack — sharp + bright resonance
    this.#crackBurst(t, 2500 * pitch, 12, 0.004, 0.35);
    this.#ping(t, base, 0.12, 0.12);
    // Sub wobble
    this.#ping(t, 55 + rowIndex * 8, dur * 0.2, 0.10);

    // 10-cell crystal fracture L→R — each crack triggers a harmonic
    for (let i = 0; i < 10; i++) {
      const ct = t + ((i + 1) / 11) * dur * 0.65 + (Math.random() - 0.5) * 0.005 * ds;
      // Crack transient through high-Q bandpass
      this.#crackBurst(ct, (2000 + Math.random() * 3000) * pitch,
        10 + Math.random() * 5, 0.003 + Math.random() * 0.002,
        0.18 + Math.random() * 0.12);
      // Harmonic ping — picks from the harmonic series
      const harm = harmonics[i % harmonics.length];
      this.#ping(ct + 0.002, base * harm,
        0.05 + Math.random() * 0.06, 0.06 + Math.random() * 0.04);
    }

    // Shimmer trail — overlapping harmonic decays with reverb
    for (let i = 0; i < 5; i++) {
      const st = t + dur * 0.3 + (i / 5) * dur * 0.5;
      const harm = harmonics[Math.floor(Math.random() * harmonics.length)];
      const node = this.#ping(st, base * harm,
        0.08 + Math.random() * 0.06, 0.03 + Math.random() * 0.02);
      this.#addReverb(node, dur * 0.4, 0.25, 0.08);
    }
  }

  #rowClearedMetal(t, rowIndex, pitch, ds) {
    // Metal tearing L→R: resonant clangs, each hit rings with inharmonic partials
    const dur = 0.8 * ds;
    const baseFreq = (180 + rowIndex * 50) * pitch;

    // Initial metal strike — loud high-Q clang
    this.#crackBurst(t, baseFreq * 3, 20, 0.008, 0.40);
    // Ringing from initial strike (long high-Q noise = metallic ring)
    this.#crackBurst(t, baseFreq * 5, 25, 0.06, 0.12);
    // Sub impact
    this.#ping(t, 45, dur * 0.2, 0.20);

    // 10-cell metal tear L→R: each is a clang through very high Q
    for (let i = 0; i < 10; i++) {
      const ct = t + ((i + 1) / 11) * dur * 0.7 + (Math.random() - 0.5) * 0.006 * ds;
      const clangFreq = (300 + Math.random() * 900) * pitch;
      // Resonant clang — high Q creates metallic ringing
      this.#crackBurst(ct, clangFreq, 15 + Math.random() * 10,
        0.006 + Math.random() * 0.006, 0.15 + Math.random() * 0.12);
      // Inharmonic partial (metallic timbre = non-integer freq ratios)
      const ratio = 1.4 + Math.random() * 1.6;
      this.#crackBurst(ct, clangFreq * ratio, 18,
        0.01, 0.06 + Math.random() * 0.04);
    }

    // Scraping texture: longer resonant noise bursts with reverb
    for (let i = 0; i < 3; i++) {
      const st = t + (i / 3) * dur * 0.5 + 0.02 * ds;
      const node = this.#crackBurst(st, 800 + Math.random() * 1200, 20,
        0.03 + Math.random() * 0.02, 0.04 + Math.random() * 0.03);
      this.#addReverb(node, dur * 0.3, 0.2, 0.06);
    }
  }

  #rowClearedIce(t, rowIndex, pitch, ds) {
    // Ice shelf cracking L→R: ultra-sharp bright snaps + characteristic pings
    const dur = 0.8 * ds;

    // Initial ice crack — extremely bright and sharp
    this.#crackBurst(t, 7000 * pitch, 10, 0.003, 0.45, 'highpass');
    this.#ping(t, 8000 * pitch, 0.04, 0.06);

    // Deep ice groan (sub-bass — the lake groaning)
    const groan = this.#ctx.createOscillator();
    groan.type = 'sine';
    groan.frequency.setValueAtTime(50 * pitch, t);
    groan.frequency.linearRampToValueAtTime(30, t + dur * 0.45);
    const gE = this.#ctx.createGain();
    gE.gain.setValueAtTime(0.14, t);
    gE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.45);
    groan.connect(gE); gE.connect(this.#masterGain);
    groan.start(t); groan.stop(t + dur * 0.5);

    // 10-cell ice fracture cascade L→R — rapid sharp snaps
    for (let i = 0; i < 10; i++) {
      const ct = t + ((i + 1) / 11) * dur * 0.65 + (Math.random() - 0.5) * 0.004 * ds;
      // Sharp ice snap: very short, very bright
      this.#crackBurst(ct, (6000 + Math.random() * 5000) * pitch,
        8 + Math.random() * 6, 0.002 + Math.random() * 0.002,
        0.25 + Math.random() * 0.15, 'highpass');
      // Characteristic ice ping
      this.#ping(ct + 0.001, (7000 + Math.random() * 5000) * pitch,
        0.02 + Math.random() * 0.03, 0.03 + Math.random() * 0.03);
      // Branching micro-crack (50% chance)
      if (Math.random() > 0.5) {
        const bt = ct + 0.003 + Math.random() * 0.005;
        this.#crackBurst(bt, (8000 + Math.random() * 4000) * pitch,
          10, 0.002, 0.08 + Math.random() * 0.06, 'highpass');
      }
    }

    // Ice shard tinkles after fracture
    for (let i = 0; i < 5; i++) {
      const st = t + dur * 0.4 + Math.random() * dur * 0.4;
      this.#ping(st, (8000 + Math.random() * 6000) * pitch,
        0.015 + Math.random() * 0.02, 0.02 + Math.random() * 0.02);
    }
  }

  #rowClearedWood(t, rowIndex, pitch, ds) {
    // Wood breaking — splintering cascade L→R with body creaks
    const dur = 0.5 * ds;
    const cells = 10;
    for (let i = 0; i < cells; i++) {
      const ct = t + (i / cells) * dur * 0.8;
      // Dry splitting crack
      this.#crackBurst(ct, (300 + Math.random() * 400) * pitch,
        2 + Math.random() * 2, 0.008 + Math.random() * 0.005,
        0.2 + Math.random() * 0.15);
      // Body knock
      const osc = this.#ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime((120 + i * 20) * pitch, ct);
      osc.frequency.exponentialRampToValueAtTime(60 * pitch, ct + 0.04 * ds);
      const env = this.#ctx.createGain();
      env.gain.setValueAtTime(0.1, ct);
      env.gain.exponentialRampToValueAtTime(0.001, ct + 0.06 * ds);
      osc.connect(env); env.connect(this.#masterGain);
      osc.start(ct); osc.stop(ct + 0.07 * ds);
      // Occasional splinter ping
      if (Math.random() > 0.5) {
        this.#ping(ct + 0.01, (600 + Math.random() * 400) * pitch,
          0.02, 0.04 + Math.random() * 0.03);
      }
    }
    // Final creak
    const creak = this.#ctx.createOscillator();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(40 * pitch, t + dur * 0.7);
    creak.frequency.linearRampToValueAtTime(25 * pitch, t + dur);
    const cf = this.#ctx.createBiquadFilter();
    cf.type = 'lowpass'; cf.frequency.value = 200;
    const ce = this.#ctx.createGain();
    ce.gain.setValueAtTime(0.08, t + dur * 0.7);
    ce.gain.exponentialRampToValueAtTime(0.001, t + dur);
    creak.connect(cf); cf.connect(ce); ce.connect(this.#masterGain);
    creak.start(t + dur * 0.7); creak.stop(t + dur + 0.05);
  }

  #rowClearedPlastic(t, rowIndex, pitch, ds) {
    // Plastic snapping — bright pops cascade L→R
    const dur = 0.5 * ds;
    const cells = 10;
    for (let i = 0; i < cells; i++) {
      const ct = t + (i / cells) * dur * 0.8;
      // Snap crack
      this.#crackBurst(ct, (1500 + Math.random() * 1500) * pitch,
        4 + Math.random() * 3, 0.005 + Math.random() * 0.003,
        0.18 + Math.random() * 0.1);
      // Pop ping
      this.#ping(ct, (1000 + i * 150) * pitch,
        0.025 + Math.random() * 0.015, 0.06 + Math.random() * 0.04);
      // Bouncy aftermath (30% chance)
      if (Math.random() > 0.7) {
        this.#ping(ct + 0.03 * ds, (2000 + Math.random() * 1000) * pitch,
          0.02, 0.03);
      }
    }
    // Final hollow rattle
    for (let i = 0; i < 4; i++) {
      const rt = t + dur * 0.6 + Math.random() * dur * 0.3;
      this.#crackBurst(rt, (800 + Math.random() * 600) * pitch,
        3, 0.003, 0.05);
    }
  }

  #rowClearedGold(t, rowIndex, pitch, ds) {
    // Gold disintegrating — rich warm chimes cascade with reverb tails
    const dur = 0.5 * ds;
    const cells = 10;
    // Pentatonic scale for majestic sound
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 1.875, 2, 2.25, 2.5, 3];
    for (let i = 0; i < cells; i++) {
      const ct = t + (i / cells) * dur * 0.75;
      const freq = 400 * scale[i] * pitch;
      // Warm chime
      const g = this.#ping(ct, freq, 0.08 * ds, 0.12 + Math.random() * 0.05);
      // Fifth harmonic
      this.#ping(ct + 0.01 * ds, freq * 1.5, 0.06 * ds, 0.04);
      // Sub warmth
      const sub = this.#ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = freq * 0.25;
      const se = this.#ctx.createGain();
      se.gain.setValueAtTime(0.05, ct);
      se.gain.exponentialRampToValueAtTime(0.001, ct + 0.07 * ds);
      sub.connect(se); se.connect(this.#masterGain);
      sub.start(ct); sub.stop(ct + 0.08 * ds);
    }
    // Reverberant tail
    for (let i = 0; i < 6; i++) {
      const rt = t + dur * 0.5 + Math.random() * dur * 0.4;
      this.#ping(rt, (500 + Math.random() * 800) * pitch,
        0.05 + Math.random() * 0.04, 0.03);
    }
  }

  #rowClearedSilver(t, rowIndex, pitch, ds) {
    // Silver shattering — bright metallic fracture cascade with tinkles
    const dur = 0.5 * ds;
    const cells = 10;
    for (let i = 0; i < cells; i++) {
      const ct = t + (i / cells) * dur * 0.8;
      // High-Q metallic crack
      this.#crackBurst(ct, (3000 + Math.random() * 3000) * pitch,
        10 + Math.random() * 8, 0.004 + Math.random() * 0.003,
        0.2 + Math.random() * 0.12, 'bandpass');
      // Bright tinkle
      this.#ping(ct, (3500 + i * 300) * pitch,
        0.03 + Math.random() * 0.02, 0.07 + Math.random() * 0.04);
      // Resonant ring (40% chance)
      if (Math.random() > 0.6) {
        const ring = this.#ctx.createOscillator();
        ring.type = 'sine';
        ring.frequency.value = (2500 + Math.random() * 2000) * pitch;
        const re = this.#ctx.createGain();
        re.gain.setValueAtTime(0.04, ct + 0.005);
        re.gain.exponentialRampToValueAtTime(0.001, ct + 0.06 * ds);
        ring.connect(re); re.connect(this.#masterGain);
        ring.start(ct + 0.005); ring.stop(ct + 0.07 * ds);
      }
    }
    // Silver dust tinkles after fracture
    for (let i = 0; i < 6; i++) {
      const st = t + dur * 0.4 + Math.random() * dur * 0.4;
      this.#ping(st, (5000 + Math.random() * 5000) * pitch,
        0.015 + Math.random() * 0.02, 0.03 + Math.random() * 0.02);
    }
  }
}

export { SoundEngine, SOUND_THEMES };
