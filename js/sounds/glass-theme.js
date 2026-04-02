/**
 * Glass theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const glassTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Glass tinkle ping — body tone
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
  // Sparkle — bandpass for glass body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.025);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 5500 + Math.random() * 1500;
  bp.Q.value = 0.6;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.10, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.03);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  // Fundamental tick
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 3200 * p;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.04);
  // Bandpass transient for glass texture
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.012);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 5000 * p;
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.06, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.015);
    },

  lock(sc) {
  const t = sc.now();
  // Glass clink — body tone
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 2500 + Math.random() * 300;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
  // Glass tap — bandpass for body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.02);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 4000 + Math.random() * 1500;
  bp.Q.value = 0.6;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.025);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Glass impact — bandpass shatter burst with body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(5000, t);
  bp.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.28, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
  // Impact crack transient
  const cr = sc.ctx.createBufferSource();
  cr.buffer = sc.createNoiseBuffer(0.015);
  const cbp = sc.ctx.createBiquadFilter();
  cbp.type = 'bandpass'; cbp.frequency.value = 4500;
  cbp.Q.value = 0.7;
  const ce = sc.ctx.createGain();
  ce.gain.setValueAtTime(0.20, t);
  ce.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  cr.connect(cbp); cbp.connect(ce); ce.connect(sc.gain);
  cr.start(t); cr.stop(t + 0.02);
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
  // Glass shimmer burst — bandpass for body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.12);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 5000;
  bp.Q.value = 0.6;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.14, t + 0.28);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
    // Glass debris noise — bandpass for body
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.3);
    const bp = sc.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500 + i * 400;
    bp.Q.value = 0.5;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.15 - i * 0.02, s + 0.05);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
    n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
  // Glass slide — bandpass sweep for body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.1);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(3000, t);
  bp.frequency.exponentialRampToValueAtTime(5500, t + 0.05);
  bp.frequency.exponentialRampToValueAtTime(4000, t + 0.1);
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
  // Glass shard tinkle — bandpass for body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.06);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 5000 + combo * 300;
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.07);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.2 : 0.12;
  // Glass spiral — bandpass sweep for body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.25);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(3500, t);
  bp.frequency.exponentialRampToValueAtTime(6500, t + 0.1);
  bp.frequency.exponentialRampToValueAtTime(4500, t + 0.2);
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.23);
  if (isFull) {
    // Glass shatter burst — bandpass for body
    const shard = sc.ctx.createBufferSource();
    shard.buffer = sc.createNoiseBuffer(0.15);
    const sbp = sc.ctx.createBiquadFilter();
    sbp.type = 'bandpass'; sbp.frequency.value = 4500;
    sbp.Q.value = 0.6;
    const se = sc.ctx.createGain();
    se.gain.setValueAtTime(0.18, t + 0.08);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    shard.connect(sbp); sbp.connect(se); se.connect(sc.gain);
    shard.start(t + 0.08); shard.stop(t + 0.21);
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Cascading glass shatter — bandpass bursts with body
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.08;
    const freq = 3500 + i * 500;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.12);
    const bp = sc.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq;
    bp.Q.value = 0.5;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.18, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
    n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
  // Emphatic glass crash — bandpass shatter with body
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.2);
  const bp = sc.ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(5000, t);
  bp.frequency.exponentialRampToValueAtTime(3500, t + 0.2);
  bp.Q.value = 0.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.28, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bp); bp.connect(ne); ne.connect(sc.gain);
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
  // Glass stress — short bandpass micro-cracks
  const dur = 0.5 * ds;
  const cracks = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < cracks; i++) {
    const ct = t + (i / cracks) * dur * 0.85 + Math.random() * 0.02 * ds;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.006);
    const bp = sc.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3500 + rowIndex * 600 + Math.random() * 2000;
    bp.Q.value = 0.6 + Math.random() * 0.4;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.06 + Math.random() * 0.04, ct);
    env.gain.exponentialRampToValueAtTime(0.001, ct + 0.005);
    n.connect(bp); bp.connect(env); env.connect(sc.gain);
    n.start(ct); n.stop(ct + 0.008);
  }
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Realistic glass shard breaking off — sharp transient + tinkle ring-out
  const freq = (1800 + progress * 2500) * pitch;

  // Layer 1: Sharp transient crack — bandpass for body
  const crack = sc.ctx.createBufferSource();
  crack.buffer = sc.createNoiseBuffer(0.025 * ds);
  const cf = sc.ctx.createBiquadFilter();
  cf.type = 'bandpass'; cf.frequency.value = 3500 + progress * 2500;
  cf.Q.value = 0.6;
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
  // Glass shattering L→R — multi-layered to match real glass breakage
  // Reference: strong 4-6kHz body, secondary impacts, sporadic scatter
  const sweepDur = 0.15 * ds;
  const ctx = sc.ctx;

  // Layer 1: Initial impact burst — strong broadband crack (4-5.5kHz body)
  _glassImpactBurst(ctx, sc, t, 0.50);

  // Layer 2: Sustained shatter body — bandpass noise sweeping down
  _glassShatterBody(ctx, sc, t, sweepDur * 0.8, 0.32);

  // Layer 3: 10-cell L→R cascade — bandpass shards with body
  for (let i = 0; i < 10; i++) {
    const ct = t + (i / 9) * sweepDur;
    const vol = 0.22 + Math.random() * 0.12;
    _glassShardNoise(ctx, sc, ct, 0.02 + Math.random() * 0.015, vol);
  }

  // Layer 4: Secondary impact at ~60% — another big piece falling
  _glassImpactBurst(ctx, sc, t + sweepDur * 0.6, 0.30);

  // Layer 5: Final snap at end
  _glassSnap(ctx, sc, t + sweepDur, 0.010, 0.35);

  // Layer 6: 5-7 sporadic shard hits scattered throughout + after
  const shards = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < shards; i++) {
    const st = t + sweepDur * 0.3 + Math.random() * sweepDur * 0.9;
    const vol = 0.05 + Math.random() * 0.10;
    _glassShardNoise(ctx, sc, st, 0.010 + Math.random() * 0.012, vol);
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _glassFractureTransient030ms(sc, t, intensity, totalDur, vol, comboShift) {
  const fracture = sc.ctx.createBufferSource();
  fracture.buffer = sc.createNoiseBuffer(0.03);
  const fractureFilter = sc.ctx.createBiquadFilter();
  fractureFilter.type = 'bandpass';
  fractureFilter.frequency.value = 4000 + Math.random() * 1500;
  fractureFilter.Q.value = 0.6;
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
  scatterF.type = 'bandpass';
  scatterF.frequency.value = 4500;
  scatterF.Q.value = 0.5;
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

// ─── rowCleared helpers ────────────────────────────────────────────

/** Strong initial crack — broadband bandpass burst centred at 4-5.5kHz. */
function _glassImpactBurst(ctx, sc, t, vol) {
  const src = ctx.createBufferSource();
  src.buffer = sc.createNoiseBuffer(0.025);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4000 + Math.random() * 1500;
  bp.Q.value = 0.5 + Math.random() * 0.5;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.020);
  src.connect(bp); bp.connect(env); env.connect(sc.gain);
  src.start(t); src.stop(t + 0.025);
}

/** Sustained shatter body — bandpass noise sweeping 5→3kHz for warmth. */
function _glassShatterBody(ctx, sc, t, dur, vol) {
  const src = ctx.createBufferSource();
  src.buffer = sc.createNoiseBuffer(dur);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(5000, t);
  bp.frequency.exponentialRampToValueAtTime(3000, t + dur);
  bp.Q.value = 0.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.setValueAtTime(vol * 0.7, t + dur * 0.15);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(bp); bp.connect(env); env.connect(sc.gain);
  src.start(t); src.stop(t + dur + 0.005);
}

/** Sharp snap — bandpass noise burst at 3.5-5.5kHz. */
function _glassSnap(ctx, sc, t, len, vol) {
  const src = ctx.createBufferSource();
  src.buffer = sc.createNoiseBuffer(len);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3500 + Math.random() * 2000;
  bp.Q.value = 0.6;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(bp); bp.connect(env); env.connect(sc.gain);
  src.start(t); src.stop(t + len + 0.002);
}

/** Glass fragment — bandpass noise at 4-8kHz with body. */
function _glassShardNoise(ctx, sc, t, len, vol) {
  const src = ctx.createBufferSource();
  src.buffer = sc.createNoiseBuffer(len);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 4000 + Math.random() * 4000;
  bp.Q.value = 0.4 + Math.random() * 0.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + len);
  src.connect(bp); bp.connect(env); env.connect(sc.gain);
  src.start(t); src.stop(t + len + 0.002);
}

