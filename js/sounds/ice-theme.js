/**
 * Ice theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const iceTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Ice crackle
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.03);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 3000 * pf; bpf.Q.value = 4;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.15, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.04);
  // Cold sine ping
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 1800 * pf;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
    },

  rotate(sc) {
  const t = sc.now();
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.02);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 4000; bpf.Q.value = 5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.03);
    },

  lock(sc) {
  const t = sc.now();
  // Ice crunch
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.04);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 2500 + Math.random() * 500; bpf.Q.value = 3;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.2, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.05);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Ice crack impact
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.06);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 3500; bpf.Q.value = 4;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.3, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.07);
  // Deep ice fracture
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(100, t);
  sub.frequency.exponentialRampToValueAtTime(35, t + 0.12);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.2, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 0.13);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  // 1. SHARP CRACK — extremely crisp high-frequency transient
  _iceSharpCrack(sc, t, intensity, totalDur, vol, comboShift);

  // 2. ICE RESONANCE — cold, hollow tones (detuned sine pair)
  _iceIceResonance(sc, t, intensity, totalDur, vol, comboShift);

  // 3. FRACTURE SPREAD — rapid crackling like ice splitting
  _iceFractureSpread(sc, t, intensity, totalDur, vol, comboShift);

  // 4. FROZEN SHARD TINKLES — higher and thinner than glass
  _iceFrozenShardTinkles(sc, t, intensity, totalDur, vol, comboShift);

  // 5. CREAK — low grinding ice stress (slow sawtooth sweep)
  _iceCreak(sc, t, intensity, totalDur, vol, comboShift);

  // 6. CRYSTALLINE SCATTER — airy frozen debris
  _iceCrystallineScatter(sc, t, intensity, totalDur, vol, comboShift);

  // 7. REVERB — icy echo
  _iceReverb(sc, t, intensity, totalDur, vol, comboShift);

    },

  levelUp(sc) {
  const t = sc.now();
  // Ascending ice cracks
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.07;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.04);
    const bpf = sc.ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 2000 + i * 600; bpf.Q.value = 4;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.15 + i * 0.03, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.04);
    n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.05);
  }
  // Cold shimmer
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 4000;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.08, t + 0.28);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t + 0.28); osc.stop(t + 0.41);
    },

  gameOver(sc) {
  const t = sc.now();
  // Ice shelf collapse — cascading cracks + deep rumble
  for (let i = 0; i < 6; i++) {
    const s = t + i * 0.25;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.2);
    const bpf = sc.ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.frequency.value = 3000 - i * 300; bpf.Q.value = 3;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.18 - i * 0.02, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
    n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.21);
  }
  // Deep sub creak
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(80, t + 0.3);
  sub.frequency.exponentialRampToValueAtTime(15, t + 2.5);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.3, t + 0.3);
  se.gain.linearRampToValueAtTime(0.001, t + 2.5);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t + 0.3); sub.stop(t + 2.6);
    },

  move(sc) {
  const t = sc.now();
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.015);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 3000; bpf.Q.value = 3;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.04, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.02);
    },

  hold(sc) {
  const t = sc.now();
  // Ice slide
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(2000, t);
  bpf.frequency.exponentialRampToValueAtTime(5000, t + 0.04);
  bpf.frequency.exponentialRampToValueAtTime(3000, t + 0.08);
  bpf.Q.value = 3;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.09);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const intensity = Math.min(combo - 1, 8);
  const freq = 1500 + intensity * 200;
  // Sharp ice crack escalating
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.05);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = freq; bpf.Q.value = 3;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.2 + intensity * 0.02, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.06);
  // Brittle sine
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = freq * 0.8;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.09);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.2 : 0.12;
  // Ice spinning crack — sharp bandpass sweep
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.2);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(2000, t);
  bpf.frequency.exponentialRampToValueAtTime(6000, t + 0.08);
  bpf.frequency.exponentialRampToValueAtTime(3000, t + 0.18);
  bpf.Q.value = 4;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.21);
  if (isFull) {
    // Deep ice fracture
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t + 0.06);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.2, t + 0.06);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(env); env.connect(sc.gain);
    osc.start(t + 0.06); osc.stop(t + 0.23);
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Ice avalanche — cascading sharp cracks
  for (let i = 0; i < 5; i++) {
    const s = t + i * 0.07;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.08);
    const bpf = sc.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 3000 + i * 400;
    bpf.Q.value = 5;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.18, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.08);
    n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.09);
  }
  // Deep sub-ice rumble
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(60, t + 0.1);
  sub.frequency.exponentialRampToValueAtTime(25, t + 0.5);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.2, t + 0.1);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t + 0.1); sub.stop(t + 0.51);
    },

  backToBack(sc) {
  const t = sc.now();
  // Deep ice fracture — sharp crack + sub rumble
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass'; bpf.frequency.value = 4000; bpf.Q.value = 5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.25, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.09);
  // Sub ice rumble
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, t);
  osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.21);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const vol = 0.03 + i * 0.012;
  // Ice creaking — filtered noise crack
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.value = 1500 + i * 150;
  bpf.Q.value = 3;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.09);
  // Sub creak
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100 + i * 10, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol * 0.8, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Ice stress — sharp discrete stress cracks + sub rumble
  const dur = 0.5 * ds;

  // Short sharp crack burst at start
  sc.crackBurst(t, 4000 + rowIndex * 500, 6, 0.004,
    0.12, 'highpass');

  // Second crack after a gap
  sc.crackBurst(t + 0.15 * ds, 5000 + Math.random() * 2000, 5,
    0.003, 0.10, 'highpass');

  // 2-3 additional stress cracks spread across duration
  const extras = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < extras; i++) {
    const ct = t + 0.1 * ds + (i / extras) * dur * 0.7 + Math.random() * 0.03 * ds;
    sc.crackBurst(ct, 3000 + Math.random() * 3000, 4 + Math.random() * 4,
      0.003, 0.05 + Math.random() * 0.04);
  }

  // Low sub-ice rumble (frozen lake groaning)
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(40 * pitch, t);
  sub.frequency.linearRampToValueAtTime(30 * pitch, t + dur);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0, t);
  se.gain.linearRampToValueAtTime(0.08, t + 0.08 * ds);
  se.gain.linearRampToValueAtTime(0, t + dur);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + dur + 0.05);
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Ice crystal snapping — sharp crack + sparkle
  const freq = (3000 + progress * 4000) * pitch;

  // Layer 1: Sharp snap (< 3ms — sounds like ice cracking)
  const snap = sc.ctx.createOscillator();
  snap.type = 'sine';
  snap.frequency.setValueAtTime(freq, t);
  snap.frequency.exponentialRampToValueAtTime(freq * 0.2, t + 0.02 * ds);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.16, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.03 * ds);
  snap.connect(se); se.connect(sc.gain);
  snap.start(t); snap.stop(t + 0.035 * ds);

  // Layer 2: Ice shard tinkle (high-pass noise burst)
  const shard = sc.ctx.createBufferSource();
  shard.buffer = sc.createNoiseBuffer(0.04 * ds);
  const sf = sc.ctx.createBiquadFilter();
  sf.type = 'highpass'; sf.frequency.value = 8000;
  const sf2 = sc.ctx.createBiquadFilter();
  sf2.type = 'peaking'; sf2.frequency.value = 10000 + progress * 2000; sf2.gain.value = 8; sf2.Q.value = 3;
  const she = sc.ctx.createGain();
  she.gain.setValueAtTime(0.07, t);
  she.gain.exponentialRampToValueAtTime(0.001, t + 0.04 * ds);
  shard.connect(sf); sf.connect(sf2); sf2.connect(she); she.connect(sc.gain);
  shard.start(t); shard.stop(t + 0.045 * ds);

  // Layer 3: Tiny resonant ring (ice has crystalline resonance)
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
  // Ice shelf cracking L→R: ultra-sharp bright snaps + characteristic pings
  const dur = 0.8 * ds;

  // Initial ice crack — extremely bright and sharp
  sc.crackBurst(t, 7000 * pitch, 10, 0.003, 0.45, 'highpass');
  sc.ping(t, 8000 * pitch, 0.04, 0.06);

  // Deep ice groan (sub-bass — the lake groaning)
  const groan = sc.ctx.createOscillator();
  groan.type = 'sine';
  groan.frequency.setValueAtTime(50 * pitch, t);
  groan.frequency.linearRampToValueAtTime(30, t + dur * 0.45);
  const gE = sc.ctx.createGain();
  gE.gain.setValueAtTime(0.14, t);
  gE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.45);
  groan.connect(gE); gE.connect(sc.gain);
  groan.start(t); groan.stop(t + dur * 0.5);

  // 10-cell ice fracture cascade L→R — rapid sharp snaps
  for (let i = 0; i < 10; i++) {
    const ct = t + ((i + 1) / 11) * dur * 0.65 + (Math.random() - 0.5) * 0.004 * ds;
    // Sharp ice snap: very short, very bright
    sc.crackBurst(ct, (6000 + Math.random() * 5000) * pitch,
      8 + Math.random() * 6, 0.002 + Math.random() * 0.002,
      0.25 + Math.random() * 0.15, 'highpass');
    // Characteristic ice ping
    sc.ping(ct + 0.001, (7000 + Math.random() * 5000) * pitch,
      0.02 + Math.random() * 0.03, 0.03 + Math.random() * 0.03);
    // Branching micro-crack (50% chance)
    if (Math.random() > 0.5) {
      const bt = ct + 0.003 + Math.random() * 0.005;
      sc.crackBurst(bt, (8000 + Math.random() * 4000) * pitch,
        10, 0.002, 0.08 + Math.random() * 0.06, 'highpass');
    }
  }

  // Ice shard tinkles after fracture
  for (let i = 0; i < 5; i++) {
    const st = t + dur * 0.4 + Math.random() * dur * 0.4;
    sc.ping(st, (8000 + Math.random() * 6000) * pitch,
      0.015 + Math.random() * 0.02, 0.02 + Math.random() * 0.02);
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _iceSharpCrack(sc, t, intensity, totalDur, vol, comboShift) {
  const crack = sc.ctx.createBufferSource();
  crack.buffer = sc.createNoiseBuffer(0.02);
  const crackF = sc.ctx.createBiquadFilter();
  crackF.type = 'highpass';
  crackF.frequency.value = 3000;
  const crackF2 = sc.ctx.createBiquadFilter();
  crackF2.type = 'peaking';
  crackF2.frequency.value = 6000;
  crackF2.Q.value = 3;
  crackF2.gain.value = 10;
  const crackEnv = sc.ctx.createGain();
  crackEnv.gain.setValueAtTime(vol, t);
  crackEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  crack.connect(crackF);
  crackF.connect(crackF2);
  crackF2.connect(crackEnv);
  crackEnv.connect(sc.gain);
  crack.start(t);
  crack.stop(t + 0.03);

}

function _iceIceResonance(sc, t, intensity, totalDur, vol, comboShift) {
  const iceFreqs = [1760, 2349, 3136, 4186]; // A6, D7, G7, C8
  const iceCount = 2 + intensity;
  for (let i = 0; i < iceCount; i++) {
    const freq = iceFreqs[i % iceFreqs.length] * (0.98 + Math.random() * 0.04 + comboShift);
    const osc1 = sc.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;
    const osc2 = sc.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.005; // slight detune = cold shimmer
    const dur = 0.1 + Math.random() * 0.2;
    const env1 = sc.ctx.createGain();
    env1.gain.setValueAtTime(vol * 0.12, t + i * 0.01);
    env1.gain.exponentialRampToValueAtTime(0.001, t + i * 0.01 + dur);
    const env2 = sc.ctx.createGain();
    env2.gain.setValueAtTime(vol * 0.08, t + i * 0.01);
    env2.gain.exponentialRampToValueAtTime(0.001, t + i * 0.01 + dur);
    osc1.connect(env1);
    env1.connect(sc.gain);
    osc2.connect(env2);
    env2.connect(sc.gain);
    osc1.start(t + i * 0.01);
    osc1.stop(t + i * 0.01 + dur + 0.01);
    osc2.start(t + i * 0.01);
    osc2.stop(t + i * 0.01 + dur + 0.01);
  }

}

function _iceFractureSpread(sc, t, intensity, totalDur, vol, comboShift) {
  const fractureCount = 6 + intensity * 4;
  for (let i = 0; i < fractureCount; i++) {
    const offset = 0.01 + Math.random() * 0.15;
    const dur = 0.005 + Math.random() * 0.015;
    const src = sc.ctx.createBufferSource();
    src.buffer = sc.createNoiseBuffer(dur);
    const f = sc.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 4000 + Math.random() * 8000;
    f.Q.value = 10 + Math.random() * 30;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(vol * (0.15 + Math.random() * 0.15), t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
    src.connect(f);
    f.connect(env);
    env.connect(sc.gain);
    src.start(t + offset);
    src.stop(t + offset + dur + 0.005);
  }

}

function _iceFrozenShardTinkles(sc, t, intensity, totalDur, vol, comboShift) {
  const shardCount = 8 + intensity * 5;
  for (let i = 0; i < shardCount; i++) {
    const offset = 0.08 + Math.random() * totalDur * 0.85;
    const freq = 4000 + Math.random() * 12000;
    const dur = 0.01 + Math.random() * 0.025;
    const loudness = (0.06 + Math.random() * 0.08) * Math.max(0.1, 1 - offset / totalDur);
    if (loudness <= 0.001) continue;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
    osc.connect(env);
    env.connect(sc.gain);
    osc.start(t + offset);
    osc.stop(t + offset + dur + 0.01);
  }

}

function _iceCreak(sc, t, intensity, totalDur, vol, comboShift) {
  const creakDur = 0.15 + intensity * 0.05;
  const creak = sc.ctx.createOscillator();
  creak.type = 'sawtooth';
  creak.frequency.setValueAtTime(200, t + 0.02);
  creak.frequency.exponentialRampToValueAtTime(60, t + 0.02 + creakDur);
  const creakF = sc.ctx.createBiquadFilter();
  creakF.type = 'lowpass';
  creakF.frequency.value = 500;
  const creakEnv = sc.ctx.createGain();
  creakEnv.gain.setValueAtTime(vol * 0.2, t + 0.02);
  creakEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + creakDur);
  creak.connect(creakF);
  creakF.connect(creakEnv);
  creakEnv.connect(sc.gain);
  creak.start(t + 0.02);
  creak.stop(t + 0.02 + creakDur + 0.01);

}

function _iceCrystallineScatter(sc, t, intensity, totalDur, vol, comboShift) {
  const scatDur = totalDur * 0.5;
  const scat = sc.ctx.createBufferSource();
  scat.buffer = sc.createNoiseBuffer(scatDur);
  const scatF = sc.ctx.createBiquadFilter();
  scatF.type = 'highpass';
  scatF.frequency.value = 7000;
  const scatEnv = sc.ctx.createGain();
  scatEnv.gain.setValueAtTime(0.001, t + 0.12);
  scatEnv.gain.linearRampToValueAtTime(vol * 0.1, t + 0.2);
  scatEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + scatDur);
  scat.connect(scatF);
  scatF.connect(scatEnv);
  scatEnv.connect(sc.gain);
  scat.start(t + 0.12);
  scat.stop(t + 0.12 + scatDur + 0.01);

}

function _iceReverb(sc, t, intensity, totalDur, vol, comboShift) {
  const revSrc = sc.ctx.createBufferSource();
  revSrc.buffer = sc.createNoiseBuffer(0.06);
  const revF = sc.ctx.createBiquadFilter();
  revF.type = 'highpass';
  revF.frequency.value = 3500;
  const revDelay = sc.ctx.createDelay();
  revDelay.delayTime.value = 0.03;
  const revFb = sc.ctx.createGain();
  revFb.gain.value = 0.28 + intensity * 0.05;
  const revEnv = sc.ctx.createGain();
  revEnv.gain.setValueAtTime(vol * 0.15, t + 0.015);
  revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.12);
  revSrc.connect(revF);
  revF.connect(revDelay);
  revDelay.connect(revFb);
  revFb.connect(revDelay);
  revDelay.connect(revEnv);
  revEnv.connect(sc.gain);
  revSrc.start(t + 0.015);
  revSrc.stop(t + 0.075);
}

