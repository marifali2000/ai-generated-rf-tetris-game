/**
 * Glass theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const glassTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Glass tinkle ping
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2800 * pf, t);
  osc.frequency.exponentialRampToValueAtTime(3500 * pf, t + 0.04);
  osc.frequency.exponentialRampToValueAtTime(2200 * pf, t + 0.12);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.15);
  // High sparkle
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.02);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 7000;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.08, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.03);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 3200 * p;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.04);
    },

  lock(sc) {
  const t = sc.now();
  // Glass clink
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 2500 + Math.random() * 300;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
  // Tiny glass tap
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.015);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 5000;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.02);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Glass impact — bright shatter with sub
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 4000;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.25, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.09);
  // Sub weight
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(90, t);
  sub.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.15, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 0.11);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  // 1. FRACTURE TRANSIENT (0–30ms)
  _glassFractureTransient030ms(sc, t, intensity, totalDur, vol, comboShift);

  // 2. PLATE-MODE RESONANCES
  _glassPlatemodeResonances(sc, t, intensity, totalDur, vol, comboShift);

  // 3. INITIAL SHATTER BURST
  _glassInitialShatterBurst(sc, t, intensity, totalDur, vol, comboShift);

  // 4. CASCADING SHARD TINKLES
  _glassCascadingShardTinkles(sc, t, intensity, totalDur, vol, comboShift);

  // 5. MID-FREQUENCY CRUNCH
  _glassMidfrequencyCrunch(sc, t, intensity, totalDur, vol, comboShift);

  // 6. DEBRIS SCATTER TAIL
  _glassDebrisScatterTail(sc, t, intensity, totalDur, vol, comboShift);

  // 7. REVERB TAIL
  _glassReverbTail(sc, t, intensity, totalDur, vol, comboShift);

    },

  levelUp(sc) {
  const t = sc.now();
  // Ascending glass tinkles
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.07;
    const freq = 2500 + i * 600;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.18, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.13);
  }
  // Glass shimmer burst
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.12);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 6000;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t + 0.28);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t + 0.28); n.stop(t + 0.41);
    },

  gameOver(sc) {
  const t = sc.now();
  // Glass shattering cascade — descending tinkles + debris
  for (let i = 0; i < 5; i++) {
    const s = t + i * 0.3;
    const freq = 4000 - i * 500;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.5);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.2, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.5);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.51);
    // Glass debris noise
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.3);
    const hpf = sc.ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = 3000 + i * 200;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.15 - i * 0.02, s + 0.05);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
    n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
    n.start(s + 0.05); n.stop(s + 0.31);
  }
    },

  move(sc) {
  const t = sc.now();
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 3500 + Math.random() * 300;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.04, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.025);
    },

  hold(sc) {
  const t = sc.now();
  // Glass slide whoosh
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.1);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(3000, t);
  hpf.frequency.exponentialRampToValueAtTime(6000, t + 0.05);
  hpf.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.11);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semitones = Math.min(combo - 2, 12);
  const freq = 2000 * Math.pow(2, semitones / 12);
  // Glass tinkle that rises with combo
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.06);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.18, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
  // High-freq noise tinkle
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.06);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 6000 + combo * 200;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.07);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.2 : 0.12;
  // Glass spiral — rising filtered noise
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.25);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(3000, t);
  hpf.frequency.exponentialRampToValueAtTime(8000, t + 0.1);
  hpf.frequency.exponentialRampToValueAtTime(4000, t + 0.2);
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.23);
  if (isFull) {
    // Glass shatter burst
    const shard = sc.ctx.createBufferSource();
    shard.buffer = sc.createNoiseBuffer(0.15);
    const shpf = sc.ctx.createBiquadFilter();
    shpf.type = 'highpass'; shpf.frequency.value = 5000;
    const se = sc.ctx.createGain();
    se.gain.setValueAtTime(0.18, t + 0.08);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    shard.connect(shpf); shpf.connect(se); se.connect(sc.gain);
    shard.start(t + 0.08); shard.stop(t + 0.21);
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Cascading glass shatter — multiple tinkles
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.08;
    const freq = 3000 + i * 500;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.12);
    const hpf = sc.ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = freq;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.15, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
    n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.13);
    // Tinkle tone
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = freq * 0.8;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.12, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.16);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Emphatic glass crash — layered shatter
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.2);
  const hpf = sc.ctx.createBiquadFilter();
  hpf.type = 'highpass'; hpf.frequency.value = 4000;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.25, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(hpf); hpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.21);
  // Glass resonance ping
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 3500;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const freq = 2000 + i * 200;
  const vol = 0.03 + i * 0.012;
  // Glass stress creak — high sine descending
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.2);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.26);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Glass stress — intermittent micro-cracks as pressure builds
  const dur = 0.5 * ds;

  // 4-6 intermittent stress cracks — like glass about to shatter
  const cracks = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < cracks; i++) {
    const ct = t + (i / cracks) * dur * 0.85 + Math.random() * 0.02 * ds;
    sc.crackBurst(ct, 3000 + rowIndex * 800 + Math.random() * 2000,
      4 + Math.random() * 4, 0.003 + Math.random() * 0.003,
      0.08 + Math.random() * 0.06);
  }

  // Subtle high-freq crinkle — 2-3 very quiet short bursts
  const crinkles = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < crinkles; i++) {
    const ct = t + Math.random() * dur * 0.7;
    sc.crackBurst(ct, 6000 + Math.random() * 3000, 3,
      0.002, 0.03 + Math.random() * 0.02, 'highpass');
  }

  // Sub-bass tension
  sc.ping(t, 45 + rowIndex * 8, dur, 0.08);
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Realistic glass shard breaking off — sharp transient + tinkle ring-out
  const freq = (1800 + progress * 2500) * pitch;

  // Layer 1: Sharp transient crack (< 5ms attack)
  const crack = sc.ctx.createBufferSource();
  crack.buffer = sc.createNoiseBuffer(0.025 * ds);
  const cf = sc.ctx.createBiquadFilter();
  cf.type = 'highpass'; cf.frequency.value = 3000 + progress * 3000;
  const ce = sc.ctx.createGain();
  ce.gain.setValueAtTime(0.2, t);
  ce.gain.exponentialRampToValueAtTime(0.001, t + 0.025 * ds);
  crack.connect(cf); cf.connect(ce); ce.connect(sc.gain);
  crack.start(t); crack.stop(t + 0.03 * ds);

  // Layer 2: Glass resonance ring (sine with natural decay)
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.value = freq;
  const ringEnv = sc.ctx.createGain();
  ringEnv.gain.setValueAtTime(0.14, t);
  ringEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2 * ds);
  ring.connect(ringEnv); ringEnv.connect(sc.gain);
  sc.addReverb(ringEnv, 0.3 * ds, 0.2, 0.08);
  ring.start(t); ring.stop(t + 0.22 * ds);

  // Layer 3: Octave overtone (glass has strong harmonics)
  const harm = sc.ctx.createOscillator();
  harm.type = 'sine';
  harm.frequency.value = freq * 2.3;
  const he = sc.ctx.createGain();
  he.gain.setValueAtTime(0.04, t);
  he.gain.exponentialRampToValueAtTime(0.001, t + 0.1 * ds);
  harm.connect(he); he.connect(sc.gain);
  harm.start(t); harm.stop(t + 0.12 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Glass pane shattering L→R: sharp discrete cracks only, no continuous noise
  const dur = 0.8 * ds;

  // Initial impact crack at left edge — loud, sharp
  sc.crackBurst(t, 4500 * pitch, 8, 0.004, 0.45);
  sc.ping(t, 3200 * pitch, 0.06, 0.08);

  // Sub-bass thud at impact point
  sc.ping(t, 55 + rowIndex * 8, dur * 0.25, 0.15);

  // 10-cell fracture cascade L→R — each cell is a discrete crack
  for (let i = 0; i < 10; i++) {
    const ct = t + ((i + 1) / 11) * dur * 0.7 + (Math.random() - 0.5) * 0.006 * ds;
    const freq = (3000 + Math.random() * 5000) * pitch;
    // Main crack: short noise burst through high-Q bandpass
    sc.crackBurst(ct, freq, 6 + Math.random() * 6,
      0.003 + Math.random() * 0.003, 0.22 + Math.random() * 0.18);
    // Glass resonance ring from each crack point
    sc.ping(ct + 0.002, freq * 0.8,
      0.03 + Math.random() * 0.03, 0.04 + Math.random() * 0.03);
    // Secondary micro-crack (60% chance)
    if (Math.random() > 0.4) {
      const mt = ct + 0.004 + Math.random() * 0.008;
      sc.crackBurst(mt, (5000 + Math.random() * 4000) * pitch,
        8, 0.002, 0.10 + Math.random() * 0.08);
    }
  }

  // Shard tinkles trailing behind fracture front
  const shards = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < shards; i++) {
    const st = t + (i / shards) * dur * 0.7 + 0.02 * ds + Math.random() * 0.015;
    sc.ping(st, (5000 + Math.random() * 6000) * pitch,
      0.03 + Math.random() * 0.04, 0.03 + Math.random() * 0.03);
  }

  // Late falling debris — quiet tinkles
  for (let i = 0; i < 4; i++) {
    const dt = t + dur * 0.55 + Math.random() * dur * 0.35;
    sc.ping(dt, (6000 + Math.random() * 6000) * pitch,
      0.015 + Math.random() * 0.02, 0.015 + Math.random() * 0.015);
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _glassFractureTransient030ms(sc, t, intensity, totalDur, vol, comboShift) {
  const fracture = sc.ctx.createBufferSource();
  fracture.buffer = sc.createNoiseBuffer(0.03);
  const fractureFilter = sc.ctx.createBiquadFilter();
  fractureFilter.type = 'highpass';
  fractureFilter.frequency.value = 1500;
  const fractureGain = sc.ctx.createGain();
  fractureGain.gain.setValueAtTime(vol * 1.2, t);
  fractureGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  fracture.connect(fractureFilter);
  fractureFilter.connect(fractureGain);
  fractureGain.connect(sc.gain);
  fracture.start(t);
  fracture.stop(t + 0.035);

}

function _glassPlatemodeResonances(sc, t, intensity, totalDur, vol, comboShift) {
  const plateFreqs = [2093, 3136, 4186, 5274, 6272];
  const plateCount = 2 + intensity;
  for (let i = 0; i < plateCount; i++) {
    const freq = plateFreqs[i % plateFreqs.length] * (0.92 + Math.random() * 0.16 + comboShift);
    const dur = 0.06 + Math.random() * 0.14;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(vol * (0.15 + Math.random() * 0.1), t + i * 0.008);
    env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.008 + dur);
    osc.connect(env);
    env.connect(sc.gain);
    osc.start(t + i * 0.008);
    osc.stop(t + i * 0.008 + dur + 0.01);
  }

}

function _glassInitialShatterBurst(sc, t, intensity, totalDur, vol, comboShift) {
  const burstLayers = 2 + intensity;
  for (let i = 0; i < burstLayers; i++) {
    const offset = 0.01 + i * 0.025;
    const dur = 0.1 + Math.random() * 0.1;
    const src = sc.ctx.createBufferSource();
    src.buffer = sc.createNoiseBuffer(dur);
    const f1 = sc.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 3000 + i * 1500 + Math.random() * 1000;
    f1.Q.value = 4 + Math.random() * 6;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(vol * 0.55, t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
    src.connect(f1);
    f1.connect(env);
    env.connect(sc.gain);
    src.start(t + offset);
    src.stop(t + offset + dur + 0.01);
  }

}

function _glassCascadingShardTinkles(sc, t, intensity, totalDur, vol, comboShift) {
  const shardCount = 8 + intensity * 6;
  for (let i = 0; i < shardCount; i++) {
    const offset = 0.05 + Math.random() * totalDur * 0.9;
    const freq = 2500 + Math.random() * 10000;
    const dur = 0.015 + Math.random() * 0.04;
    const loudness = (0.1 + Math.random() * 0.12) * Math.max(0.1, 1 - offset / totalDur);
    if (loudness <= 0.001) continue;
    const src = sc.ctx.createBufferSource();
    src.buffer = sc.createNoiseBuffer(dur);
    const filter = sc.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 20 + Math.random() * 40;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(sc.gain);
    src.start(t + offset);
    src.stop(t + offset + dur + 0.01);
  }

}

function _glassMidfrequencyCrunch(sc, t, intensity, totalDur, vol, comboShift) {
  const crunchDur = 0.12 + intensity * 0.04;
  const crunch = sc.ctx.createBufferSource();
  crunch.buffer = sc.createNoiseBuffer(crunchDur);
  const crunchF = sc.ctx.createBiquadFilter();
  crunchF.type = 'bandpass';
  crunchF.frequency.setValueAtTime(800, t);
  crunchF.frequency.exponentialRampToValueAtTime(200, t + crunchDur);
  crunchF.Q.value = 1;
  const crunchEnv = sc.ctx.createGain();
  crunchEnv.gain.setValueAtTime(vol * 0.5, t + 0.005);
  crunchEnv.gain.exponentialRampToValueAtTime(0.001, t + crunchDur);
  crunch.connect(crunchF);
  crunchF.connect(crunchEnv);
  crunchEnv.connect(sc.gain);
  crunch.start(t + 0.005);
  crunch.stop(t + crunchDur + 0.01);

}

function _glassDebrisScatterTail(sc, t, intensity, totalDur, vol, comboShift) {
  const scatterDur = totalDur * 0.7;
  const scatter = sc.ctx.createBufferSource();
  scatter.buffer = sc.createNoiseBuffer(scatterDur);
  const scatterF = sc.ctx.createBiquadFilter();
  scatterF.type = 'highpass';
  scatterF.frequency.value = 5000;
  const scatterEnv = sc.ctx.createGain();
  scatterEnv.gain.setValueAtTime(0.001, t + 0.15);
  scatterEnv.gain.linearRampToValueAtTime(vol * 0.15, t + 0.25);
  scatterEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + scatterDur);
  scatter.connect(scatterF);
  scatterF.connect(scatterEnv);
  scatterEnv.connect(sc.gain);
  scatter.start(t + 0.15);
  scatter.stop(t + 0.15 + scatterDur + 0.01);

}

function _glassReverbTail(sc, t, intensity, totalDur, vol, comboShift) {
  const reverbSrc = sc.ctx.createBufferSource();
  reverbSrc.buffer = sc.createNoiseBuffer(0.08);
  const reverbFilter = sc.ctx.createBiquadFilter();
  reverbFilter.type = 'bandpass';
  reverbFilter.frequency.value = 3000;
  reverbFilter.Q.value = 0.5;
  const delay = sc.ctx.createDelay();
  delay.delayTime.value = 0.035;
  const fbGain = sc.ctx.createGain();
  fbGain.gain.value = 0.3 + intensity * 0.05;
  const reverbEnv = sc.ctx.createGain();
  reverbEnv.gain.setValueAtTime(vol * 0.2, t + 0.02);
  reverbEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.15);
  reverbSrc.connect(reverbFilter);
  reverbFilter.connect(delay);
  delay.connect(fbGain);
  fbGain.connect(delay);
  delay.connect(reverbEnv);
  reverbEnv.connect(sc.gain);
  reverbSrc.start(t + 0.02);
  reverbSrc.stop(t + 0.1);
}

