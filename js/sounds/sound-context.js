/**
 * SoundContext — shared audio primitives for theme sound modules.
 *
 * Wraps AudioContext + masterGain and provides reusable helper methods
 * (noise generation, reverb, crack transients, sine pings) so theme
 * modules stay focused on sound design only.
 */

class SoundContext {
  #ctx;
  #gain;

  constructor(ctx, masterGain) {
    this.#ctx = ctx;
    this.#gain = masterGain;
  }

  /** @returns {AudioContext} */
  get ctx() { return this.#ctx; }

  /** @returns {GainNode} */
  get gain() { return this.#gain; }

  /** Current audio-context time. */
  now() { return this.#ctx.currentTime; }

  /** Generate a white-noise AudioBuffer. */
  createNoiseBuffer(duration = 1) {
    const sampleRate = this.#ctx.sampleRate;
    const buffer = this.#ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** Lightweight feedback-delay reverb — no ConvolverNode needed. */
  addReverb(source, duration = 0.3, feedback = 0.25, wet = 0.2) {
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
    wetGain.connect(this.#gain);
    wetGain.gain.setValueAtTime(wet, this.#ctx.currentTime);
    wetGain.gain.linearRampToValueAtTime(0, this.#ctx.currentTime + duration);
  }

  /**
   * Short filtered noise crack transient — the building block of all
   * break sounds.
   */
  crackBurst(t, freq, q, len, vol, type = 'bandpass') {
    const n = this.#ctx.createBufferSource();
    n.buffer = this.createNoiseBuffer(len + 0.005);
    const f = this.#ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.#ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    n.connect(f); f.connect(g); g.connect(this.#gain);
    n.start(t); n.stop(t + len + 0.005);
    return g;
  }

  /** Quick sine ping with exponential decay. */
  ping(t, freq, len, vol) {
    const o = this.#ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = freq;
    const g = this.#ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g); g.connect(this.#gain);
    o.start(t); o.stop(t + len + 0.005);
    return g;
  }
}

export { SoundContext };
