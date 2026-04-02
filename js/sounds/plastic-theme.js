/**
 * Plastic theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const plasticTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Plastic click-pop
  sc.ping(t, 1400 * pf, 0.04, 0.15);
  sc.ping(t + 0.01, 2800 * pf, 0.02, 0.06);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  sc.ping(t, 2200 * p, 0.025, 0.15);
    },

  lock(sc) {
  const t = sc.now();
  // Plastic snap-click
  sc.crackBurst(t, 2800 + Math.random() * 400, 3, 0.004, 0.20);
  sc.ping(t, 1000, 0.02, 0.08);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Hollow plastic impact
  sc.ping(t, 120, 0.08, 0.30);
  sc.crackBurst(t, 1500, 2, 0.015, 0.15);
  sc.ping(t + 0.01, 600, 0.04, 0.10);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  const dur = totalDur;
  // Hollow pop at start
  sc.ping(t, 300 * (1 + comboShift), 0.05, vol * 0.5);
  sc.crackBurst(t, 1800, 3, 0.008, vol * 0.4);
  // Pop cascade
  const count = 4 + intensity * 2;
  for (let i = 0; i < count; i++) {
    const ct = t + (i / count) * dur * 0.8 + Math.random() * 0.015;
    const freq = (1200 + Math.random() * 2000) * (1 + comboShift);
    sc.crackBurst(ct, freq, 3 + Math.random() * 2, 0.005 + Math.random() * 0.004, vol * (0.2 + Math.random() * 0.15));
    sc.ping(ct + 0.003, 800 + Math.random() * 600, 0.02, vol * 0.06);
  }
  sc.ping(t, 60, dur * 0.2, vol * 0.25);
    },

  levelUp(sc) {
  const t = sc.now();
  // Bouncy ascending pops
  for (let i = 0; i < 4; i++) {
    sc.ping(t + i * 0.06, 600 + i * 300, 0.05, 0.14);
    sc.ping(t + i * 0.06, 1200 + i * 600, 0.03, 0.06);
  }
    },

  gameOver(sc) {
  const t = sc.now();
  // Plastic crumbling apart
  for (let i = 0; i < 6; i++) {
    const s = t + i * 0.25;
    sc.crackBurst(s, 1500 - i * 150, 3, 0.015, 0.18 - i * 0.02);
    sc.ping(s, 500 - i * 50, 0.10, 0.12);
  }
  sc.ping(t, 45, 1.8, 0.08);
    },

  move(sc) {
  const t = sc.now();
  sc.ping(t, 1800 + Math.random() * 400, 0.015, 0.04);
    },

  hold(sc) {
  const t = sc.now();
  // Plastic slide snap
  sc.crackBurst(t, 2000, 3, 0.01, 0.10);
  sc.ping(t + 0.01, 1200, 0.03, 0.06);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semi = Math.min(combo - 2, 12);
  const freq = 1000 * Math.pow(2, semi / 12);
  sc.ping(t, freq, 0.05, 0.15);
  sc.ping(t, freq * 2, 0.03, 0.06);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.22 : 0.14;
  sc.crackBurst(t, 2000, 4, 0.012, vol);
  sc.ping(t, 800, 0.06, vol * 0.5);
  if (isFull) sc.ping(t + 0.03, 1600, 0.05, vol * 0.4);
    },

  perfectClear(sc) {
  const t = sc.now();
  // Cascading plastic snaps
  for (let i = 0; i < 5; i++) {
    sc.crackBurst(t + i * 0.06, 1500 + i * 400, 4, 0.006, 0.18);
    sc.ping(t + i * 0.06, 800 + i * 200, 0.05, 0.10);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Emphatic plastic snap
  sc.crackBurst(t, 2200, 4, 0.012, 0.25);
  sc.ping(t, 800, 0.08, 0.18);
  sc.crackBurst(t + 0.03, 3000, 3, 0.008, 0.12);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const vol = 0.03 + i * 0.012;
  sc.ping(t, 600 + i * 60, 0.05, vol);
  sc.crackBurst(t, 1500 + i * 100, 3, 0.005, vol * 0.4);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Plastic stress — short clicks only, no sustained wobble
  const dur = 0.5 * ds;
  const clicks = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < clicks; i++) {
    const ct = t + (i / clicks) * dur * 0.6 + Math.random() * 0.02 * ds;
    sc.crackBurst(ct, 1500 + Math.random() * 1000, 3, 0.003, 0.05);
  }
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Plastic pop — bright hollow snap
  sc.crackBurst(t, freq * 1.5, 4, 0.005 * ds, 0.12);
  sc.ping(t, 1200 + colIndex * 100, 0.03 * ds, 0.08);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Plastic snapping — bright pops cascade L→R
  const dur = 0.5 * ds;
  const cells = 10;
  for (let i = 0; i < cells; i++) {
    const ct = t + (i / cells) * dur * 0.8;
    // Snap crack
    sc.crackBurst(ct, (1500 + Math.random() * 1500) * pitch,
      4 + Math.random() * 3, 0.005 + Math.random() * 0.003,
      0.18 + Math.random() * 0.1);
    // Pop ping
    sc.ping(ct, (1000 + i * 150) * pitch,
      0.025 + Math.random() * 0.015, 0.06 + Math.random() * 0.04);
    // Bouncy aftermath (30% chance)
    if (Math.random() > 0.7) {
      sc.ping(ct + 0.03 * ds, (2000 + Math.random() * 1000) * pitch,
        0.02, 0.03);
    }
  }
  // Final hollow rattle
  for (let i = 0; i < 4; i++) {
    const rt = t + dur * 0.6 + Math.random() * dur * 0.3;
    sc.crackBurst(rt, (800 + Math.random() * 600) * pitch,
      3, 0.003, 0.05);
  }
    },
};
