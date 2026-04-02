/**
 * Silver theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const silverTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Bright silver ting
  sc.ping(t, 3000 * pf, 0.06, 0.12);
  sc.ping(t, 4500 * pf, 0.04, 0.05);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  sc.ping(t, 3500 * p, 0.03, 0.13);
  sc.ping(t, 5250 * p, 0.02, 0.04);
    },

  lock(sc) {
  const t = sc.now();
  // Silver clink
  sc.ping(t, 2800, 0.04, 0.16);
  sc.crackBurst(t, 4000, 8, 0.004, 0.08);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Bright silver crash
  sc.ping(t, 80, 0.10, 0.35);
  sc.crackBurst(t, 3000, 10, 0.015, 0.15);
  sc.ping(t + 0.01, 2000, 0.06, 0.10);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  const dur = totalDur;
  const base = 2000 * (1 + comboShift);
  // Bright initial hit
  sc.crackBurst(t, base, 12, 0.008, vol * 0.5);
  sc.ping(t, base * 0.5, 0.08, vol * 0.3);
  // Silver tinkle cascade
  const count = 4 + intensity * 2;
  for (let i = 0; i < count; i++) {
    const ct = t + (i / count) * dur * 0.75 + Math.random() * 0.015;
    const freq = (2000 + Math.random() * 3000) * (1 + comboShift);
    sc.crackBurst(ct, freq, 10 + Math.random() * 8, 0.005 + Math.random() * 0.004, vol * (0.15 + Math.random() * 0.1));
    sc.ping(ct + 0.002, freq * 0.7, 0.04, vol * 0.06);
  }
  sc.ping(t, 60, dur * 0.2, vol * 0.25);
    },

  levelUp(sc) {
  const t = sc.now();
  // Bright ascending tinkles
  for (let i = 0; i < 4; i++) {
    sc.ping(t + i * 0.06, 3000 + i * 800, 0.08, 0.12);
    sc.crackBurst(t + i * 0.06, 4000 + i * 500, 10, 0.004, 0.06);
  }
    },

  gameOver(sc) {
  const t = sc.now();
  // Silver shattering cascade
  for (let i = 0; i < 6; i++) {
    const s = t + i * 0.28;
    sc.crackBurst(s, 3000 - i * 300, 12, 0.012, 0.18 - i * 0.02);
    sc.ping(s, 2000 - i * 200, 0.12, 0.10);
  }
  sc.ping(t, 40, 2.0, 0.10);
    },

  move(sc) {
  const t = sc.now();
  sc.ping(t, 3200 + Math.random() * 400, 0.015, 0.04);
    },

  hold(sc) {
  const t = sc.now();
  // Silver ting-slide
  sc.ping(t, 2500, 0.06, 0.10);
  sc.ping(t + 0.02, 3750, 0.04, 0.05);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semi = Math.min(combo - 2, 12);
  const freq = 2500 * Math.pow(2, semi / 12);
  sc.ping(t, freq, 0.06, 0.14);
  sc.crackBurst(t, freq * 1.5, 10, 0.004, 0.06);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.22 : 0.14;
  sc.crackBurst(t, 3000, 12, 0.008, vol);
  sc.ping(t + 0.005, 2500, 0.06, vol * 0.4);
  if (isFull) sc.crackBurst(t + 0.03, 4000, 10, 0.006, vol * 0.4);
    },

  perfectClear(sc) {
  const t = sc.now();
  // Bright silver cascade
  for (let i = 0; i < 5; i++) {
    sc.ping(t + i * 0.06, 3000 + i * 600, 0.12, 0.15);
    sc.crackBurst(t + i * 0.06, 4000 + i * 500, 12, 0.005, 0.08);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Emphatic silver crash
  sc.crackBurst(t, 3500, 15, 0.01, 0.25);
  sc.ping(t, 2500, 0.10, 0.18);
  sc.crackBurst(t + 0.03, 4500, 12, 0.008, 0.12);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const vol = 0.03 + i * 0.012;
  sc.ping(t, 2000 + i * 150, 0.06, vol);
  sc.crackBurst(t, 3000 + i * 200, 10, 0.004, vol * 0.4);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Silver stress — bright discrete plinks
  const dur = 0.5 * ds;
  const cracks = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < cracks; i++) {
    const ct = t + (i / cracks) * dur * 0.7 + Math.random() * 0.02 * ds;
    sc.crackBurst(ct, 3000 + Math.random() * 2000, 10 + Math.random() * 6, 0.004, 0.06);
  }
  sc.ping(t, 2000 * pitch, dur * 0.5, 0.04);
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Silver tinkle pop — bright metallic burst
  sc.crackBurst(t, freq * 2, 12, 0.004 * ds, 0.1);
  sc.ping(t, 3000 + colIndex * 200, 0.04 * ds, 0.07);
  // Modulated ring
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.value = freq * 0.7;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.04, t + 0.005);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * ds);
  ring.connect(re); re.connect(sc.gain);
  ring.start(t + 0.005); ring.stop(t + 0.09 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Silver shattering — bright metallic fracture cascade with tinkles
  const dur = 0.5 * ds;
  const cells = 10;
  for (let i = 0; i < cells; i++) {
    const ct = t + (i / cells) * dur * 0.8;
    // High-Q metallic crack
    sc.crackBurst(ct, (3000 + Math.random() * 3000) * pitch,
      10 + Math.random() * 8, 0.004 + Math.random() * 0.003,
      0.2 + Math.random() * 0.12, 'bandpass');
    // Bright tinkle
    sc.ping(ct, (3500 + i * 300) * pitch,
      0.03 + Math.random() * 0.02, 0.07 + Math.random() * 0.04);
    // Resonant ring (40% chance)
    if (Math.random() > 0.6) {
      const ring = sc.ctx.createOscillator();
      ring.type = 'sine';
      ring.frequency.value = (2500 + Math.random() * 2000) * pitch;
      const re = sc.ctx.createGain();
      re.gain.setValueAtTime(0.04, ct + 0.005);
      re.gain.exponentialRampToValueAtTime(0.001, ct + 0.06 * ds);
      ring.connect(re); re.connect(sc.gain);
      ring.start(ct + 0.005); ring.stop(ct + 0.07 * ds);
    }
  }
  // Silver dust tinkles after fracture
  for (let i = 0; i < 6; i++) {
    const st = t + dur * 0.4 + Math.random() * dur * 0.4;
    sc.ping(st, (5000 + Math.random() * 5000) * pitch,
      0.015 + Math.random() * 0.02, 0.03 + Math.random() * 0.02);
  }
    },
};
