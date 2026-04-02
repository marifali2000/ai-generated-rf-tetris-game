/**
 * Wood theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const woodTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Wooden knock
  sc.ping(t, 400 * pf, 0.05, 0.18);
  sc.crackBurst(t, 800, 2, 0.008, 0.10);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  sc.crackBurst(t, 600 * p, 2, 0.006, 0.12);
    },

  lock(sc) {
  const t = sc.now();
  // Solid wood thunk
  sc.ping(t, 180 + Math.random() * 60, 0.04, 0.22);
  sc.crackBurst(t, 500, 1.5, 0.005, 0.15);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Heavy wood slam
  sc.ping(t, 80, 0.1, 0.35);
  sc.ping(t, 160, 0.06, 0.15);
  sc.crackBurst(t, 400, 1.5, 0.02, 0.18);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  const dur = totalDur;
  // Initial snap
  sc.crackBurst(t, 400, 2, 0.012, vol * 0.6);
  sc.ping(t, 100, 0.08, vol * 0.4);
  // Splinter cascade — increasing density with intensity
  const count = 3 + intensity * 2;
  for (let i = 0; i < count; i++) {
    const ct = t + (i / count) * dur * 0.8 + Math.random() * 0.02;
    const freq = (300 + Math.random() * 600) * (1 + comboShift);
    sc.crackBurst(ct, freq, 1.5 + Math.random(), 0.008 + Math.random() * 0.006, vol * (0.3 + Math.random() * 0.2));
    if (Math.random() > 0.5) sc.ping(ct, 150 + Math.random() * 100, 0.03, vol * 0.08);
  }
  // Sub-bass thump
  sc.ping(t, 50, dur * 0.3, vol * 0.35);
    },

  levelUp(sc) {
  const t = sc.now();
  // Ascending wooden knocks
  for (let i = 0; i < 4; i++) {
    sc.ping(t + i * 0.07, 300 + i * 150, 0.06, 0.16);
    sc.crackBurst(t + i * 0.07, 500 + i * 100, 1.5, 0.005, 0.08);
  }
    },

  gameOver(sc) {
  const t = sc.now();
  // Wood collapsing — descending thuds
  for (let i = 0; i < 6; i++) {
    const s = t + i * 0.3;
    sc.crackBurst(s, 300 - i * 30, 1.5, 0.02, 0.20 - i * 0.02);
    sc.ping(s, 120 - i * 10, 0.15, 0.15);
  }
  sc.ping(t, 40, 2.0, 0.10);
    },

  move(sc) {
  const t = sc.now();
  sc.crackBurst(t, 500 + Math.random() * 200, 1.5, 0.004, 0.04);
    },

  hold(sc) {
  const t = sc.now();
  // Wood slide
  sc.crackBurst(t, 600, 1.5, 0.015, 0.10);
  sc.ping(t + 0.02, 350, 0.04, 0.08);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semi = Math.min(combo - 2, 12);
  const freq = 300 * Math.pow(2, semi / 12);
  sc.crackBurst(t, freq, 2, 0.01, 0.15);
  sc.ping(t, freq * 0.5, 0.06, 0.12);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.22 : 0.14;
  sc.crackBurst(t, 400, 2, 0.02, vol);
  sc.ping(t + 0.01, 250, 0.08, vol * 0.6);
  if (isFull) sc.crackBurst(t + 0.03, 600, 1.5, 0.015, vol * 0.5);
    },

  perfectClear(sc) {
  const t = sc.now();
  // Big wood split + ascending knocks
  sc.crackBurst(t, 350, 2, 0.02, 0.30);
  for (let i = 0; i < 4; i++) {
    sc.ping(t + i * 0.08, 250 + i * 100, 0.10, 0.14);
    sc.crackBurst(t + i * 0.08, 400 + i * 80, 1.5, 0.008, 0.10);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Emphatic wood crack
  sc.crackBurst(t, 350, 2, 0.02, 0.28);
  sc.ping(t, 200, 0.10, 0.20);
  sc.crackBurst(t + 0.04, 500, 1.5, 0.012, 0.15);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const vol = 0.03 + i * 0.012;
  sc.ping(t, 80 + i * 10, 0.08, vol);
  sc.crackBurst(t, 200 + i * 30, 1.5, 0.006, vol * 0.5);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Wood stress — creaking + quiet snaps
  const dur = 0.5 * ds;
  // Creaking oscillator (low sawtooth through lowpass)
  const osc = sc.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime((60 + rowIndex * 15) * pitch, t);
  osc.frequency.linearRampToValueAtTime((45 + rowIndex * 10) * pitch, t + dur);
  const filter = sc.ctx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 250;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.12, t + 0.1 * ds);
  env.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(filter); filter.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + dur + 0.05);
  // A couple stress cracks
  for (let i = 0; i < 2; i++) {
    sc.crackBurst(t + Math.random() * dur * 0.6, 400 + Math.random() * 300, 1.5, 0.005, 0.06);
  }
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Wood chip pop — dry crack + low knock
  sc.crackBurst(t, freq * 0.4, 2, 0.008 * ds, 0.15);
  // Hollow knock body
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180 + colIndex * 15, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.04 * ds);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.12, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.06 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Wood breaking — splintering cascade L→R with body creaks
  const dur = 0.5 * ds;
  const cells = 10;
  for (let i = 0; i < cells; i++) {
    const ct = t + (i / cells) * dur * 0.8;
    // Dry splitting crack
    sc.crackBurst(ct, (300 + Math.random() * 400) * pitch,
      2 + Math.random() * 2, 0.008 + Math.random() * 0.005,
      0.2 + Math.random() * 0.15);
    // Body knock
    const osc = sc.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime((120 + i * 20) * pitch, ct);
    osc.frequency.exponentialRampToValueAtTime(60 * pitch, ct + 0.04 * ds);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.1, ct);
    env.gain.exponentialRampToValueAtTime(0.001, ct + 0.06 * ds);
    osc.connect(env); env.connect(sc.gain);
    osc.start(ct); osc.stop(ct + 0.07 * ds);
    // Occasional splinter ping
    if (Math.random() > 0.5) {
      sc.ping(ct + 0.01, (600 + Math.random() * 400) * pitch,
        0.02, 0.04 + Math.random() * 0.03);
    }
  }
  // Final creak
  const creak = sc.ctx.createOscillator();
  creak.type = 'sawtooth';
  creak.frequency.setValueAtTime(40 * pitch, t + dur * 0.7);
  creak.frequency.linearRampToValueAtTime(25 * pitch, t + dur);
  const cf = sc.ctx.createBiquadFilter();
  cf.type = 'lowpass'; cf.frequency.value = 200;
  const ce = sc.ctx.createGain();
  ce.gain.setValueAtTime(0.08, t + dur * 0.7);
  ce.gain.exponentialRampToValueAtTime(0.001, t + dur);
  creak.connect(cf); cf.connect(ce); ce.connect(sc.gain);
  creak.start(t + dur * 0.7); creak.stop(t + dur + 0.05);
    },
};
