/**
 * Gold theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const goldTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Rich bell chime
  sc.ping(t, 800 * pf, 0.12, 0.14);
  sc.ping(t, 1200 * pf, 0.08, 0.06);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  sc.ping(t, 1200 * p, 0.04, 0.14);
  sc.ping(t, 1800 * p, 0.025, 0.05);
    },

  lock(sc) {
  const t = sc.now();
  // Gold coin clink
  sc.ping(t, 800, 0.06, 0.18);
  sc.ping(t + 0.005, 1200, 0.04, 0.08);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Heavy gold thud with ring
  sc.ping(t, 70, 0.12, 0.40);
  sc.ping(t + 0.02, 500, 0.10, 0.12);
  sc.ping(t + 0.02, 750, 0.08, 0.06);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  const dur = totalDur;
  const base = 400 * (1 + comboShift);
  // Big bell impact
  sc.ping(t, base, dur * 0.7, vol * 0.4);
  sc.ping(t, base * 1.5, dur * 0.5, vol * 0.2);
  sc.ping(t, base * 2, dur * 0.3, vol * 0.12);
  // Crash texture
  sc.crackBurst(t, 600, 2, 0.02, vol * 0.3);
  // Cascading harmonics
  const harmonics = [1, 1.25, 1.5, 2, 2.5, 3];
  const count = Math.min(intensity + 2, harmonics.length);
  for (let i = 0; i < count; i++) {
    const ct = t + (i / count) * dur * 0.5 + Math.random() * 0.01;
    const g = sc.ping(ct, base * harmonics[i], dur * 0.4, vol * 0.08);
    sc.addReverb(g, dur * 0.3, 0.2, 0.06);
  }
  sc.ping(t, 50, dur * 0.25, vol * 0.3);
    },

  levelUp(sc) {
  const t = sc.now();
  // Majestic ascending chime — C major arpeggio
  const freqs = [523, 659, 784, 1047];
  for (let i = 0; i < 4; i++) {
    const g = sc.ping(t + i * 0.08, freqs[i], 0.25, 0.16);
    sc.ping(t + i * 0.08, freqs[i] * 1.5, 0.15, 0.06);
    sc.addReverb(g, 0.3, 0.25, 0.08);
  }
    },

  gameOver(sc) {
  const t = sc.now();
  // Gold tower falling — descending rich bells
  const freqs = [784, 659, 523, 440, 349, 262];
  for (let i = 0; i < 6; i++) {
    const s = t + i * 0.3;
    const g = sc.ping(s, freqs[i], 0.4, 0.18 - i * 0.02);
    sc.ping(s, freqs[i] * 1.5, 0.25, 0.06);
    sc.addReverb(g, 0.5, 0.2, 0.08);
  }
  sc.ping(t, 35, 2.0, 0.12);
    },

  move(sc) {
  const t = sc.now();
  sc.ping(t, 900 + Math.random() * 200, 0.02, 0.04);
    },

  hold(sc) {
  const t = sc.now();
  // Gold coin flip
  sc.ping(t, 700, 0.08, 0.10);
  sc.ping(t + 0.03, 1050, 0.06, 0.06);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semi = Math.min(combo - 2, 12);
  const freq = 500 * Math.pow(2, semi / 12);
  const g = sc.ping(t, freq, 0.15, 0.16);
  sc.ping(t, freq * 1.5, 0.10, 0.07);
  sc.addReverb(g, 0.2, 0.2, 0.05);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.22 : 0.14;
  const g = sc.ping(t, 600, 0.15, vol);
  sc.ping(t, 900, 0.10, vol * 0.4);
  sc.addReverb(g, 0.2, 0.2, 0.06);
  if (isFull) sc.ping(t + 0.03, 1200, 0.10, vol * 0.3);
    },

  perfectClear(sc) {
  const t = sc.now();
  // Grand bell cascade — ascending major chord
  const freqs = [523, 659, 784, 1047, 1319];
  for (let i = 0; i < 5; i++) {
    const g = sc.ping(t + i * 0.08, freqs[i], 0.3, 0.18);
    sc.ping(t + i * 0.08, freqs[i] * 1.5, 0.2, 0.06);
    sc.addReverb(g, 0.4, 0.25, 0.08);
  }
  sc.ping(t, 50, 0.5, 0.15);
    },

  backToBack(sc) {
  const t = sc.now();
  // Emphatic gold crash
  sc.ping(t, 500, 0.20, 0.22);
  sc.ping(t, 750, 0.15, 0.10);
  sc.crackBurst(t, 600, 2, 0.015, 0.18);
  const g = sc.ping(t + 0.03, 1000, 0.12, 0.10);
  sc.addReverb(g, 0.25, 0.2, 0.06);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const vol = 0.03 + i * 0.012;
  sc.ping(t, 300 + i * 30, 0.10, vol);
  sc.ping(t, 450 + i * 45, 0.06, vol * 0.3);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Gold stress — swelling bell tone
  const dur = 0.5 * ds;
  const base = [523, 659, 784, 1047][Math.min(rowIndex, 3)] * pitch;
  const g = sc.ping(t, base, dur * 0.8, 0.08);
  sc.ping(t + 0.05 * ds, base * 1.5, dur * 0.6, 0.03);
  sc.addReverb(g, dur * 0.5, 0.2, 0.05);
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Gold ring pop — warm chime
  const base = freq * 0.8;
  sc.ping(t, base, 0.06 * ds, 0.12);
  sc.ping(t + 0.01 * ds, base * 1.5, 0.04 * ds, 0.06);
  // Sub ring
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = base * 0.25;
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.06, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 0.06 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Gold disintegrating — rich warm chimes cascade with reverb tails
  const dur = 0.5 * ds;
  const cells = 10;
  // Pentatonic scale for majestic sound
  const scale = [1, 1.125, 1.25, 1.5, 1.667, 1.875, 2, 2.25, 2.5, 3];
  for (let i = 0; i < cells; i++) {
    const ct = t + (i / cells) * dur * 0.75;
    const freq = 400 * scale[i] * pitch;
    // Warm chime
    const g = sc.ping(ct, freq, 0.08 * ds, 0.12 + Math.random() * 0.05);
    // Fifth harmonic
    sc.ping(ct + 0.01 * ds, freq * 1.5, 0.06 * ds, 0.04);
    // Sub warmth
    const sub = sc.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = freq * 0.25;
    const se = sc.ctx.createGain();
    se.gain.setValueAtTime(0.05, ct);
    se.gain.exponentialRampToValueAtTime(0.001, ct + 0.07 * ds);
    sub.connect(se); se.connect(sc.gain);
    sub.start(ct); sub.stop(ct + 0.08 * ds);
  }
  // Reverberant tail
  for (let i = 0; i < 6; i++) {
    const rt = t + dur * 0.5 + Math.random() * dur * 0.4;
    sc.ping(rt, (500 + Math.random() * 800) * pitch,
      0.05 + Math.random() * 0.04, 0.03);
  }
    },
};
