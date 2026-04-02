/**
 * Crystal theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const crystalTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Crystal bell chime
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200 * pf, t);
  osc.frequency.exponentialRampToValueAtTime(1800 * pf, t + 0.04);
  osc.frequency.exponentialRampToValueAtTime(1400 * pf, t + 0.12);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.18, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
  // Harmonic overtone
  const h = sc.ctx.createOscillator();
  h.type = 'sine'; h.frequency.value = 2400 * pf;
  const he = sc.ctx.createGain();
  he.gain.setValueAtTime(0.05, t);
  he.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  h.connect(he); he.connect(sc.gain);
  h.start(t); h.stop(t + 0.09);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 1800 * p;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.05);
    },

  lock(sc) {
  const t = sc.now();
  // Crystal clunk
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 1000 + Math.random() * 200;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Crystal crash
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1500, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.25, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.13);
  // Crystal shard scatter
  const h = sc.ctx.createOscillator();
  h.type = 'sine'; h.frequency.value = 3000;
  const he = sc.ctx.createGain();
  he.gain.setValueAtTime(0.08, t);
  he.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  h.connect(he); he.connect(sc.gain);
  h.start(t); h.stop(t + 0.07);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  // 1. INITIAL PING — bright crystalline attack
  _crystalInitialPing(sc, t, intensity, totalDur, vol, comboShift);

  // 2. HARMONIC CHORD — major triad at crystal frequencies
  _crystalHarmonicChord(sc, t, intensity, totalDur, vol, comboShift);

  // 3. SPARKLE CASCADE — many tiny bright tones spreading out
  _crystalSparkleCascade(sc, t, intensity, totalDur, vol, comboShift);

  // 4. SHIMMER WASH — bright filtered noise
  _crystalShimmerWash(sc, t, intensity, totalDur, vol, comboShift);

  // 5. BELL RESONANCE — decaying pitched ring
  _crystalBellResonance(sc, t, intensity, totalDur, vol, comboShift);

  // 6. REVERB SHIMMER
  _crystalReverbShimmer(sc, t, intensity, totalDur, vol, comboShift);

    },

  levelUp(sc) {
  const t = sc.now();
  // Crystal ascending chimes
  const freqs = [800, 1000, 1200, 1600];
  freqs.forEach((f, i) => {
    const s = t + i * 0.07;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = f;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.2, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.16);
    // Overtone
    const h = sc.ctx.createOscillator();
    h.type = 'sine'; h.frequency.value = f * 2;
    const he = sc.ctx.createGain();
    he.gain.setValueAtTime(0.04, s);
    he.gain.exponentialRampToValueAtTime(0.001, s + 0.08);
    h.connect(he); he.connect(sc.gain);
    h.start(s); h.stop(s + 0.09);
  });
    },

  gameOver(sc) {
  const t = sc.now();
  // Crystal shattering cascade — descending pure tones
  for (let i = 0; i < 5; i++) {
    const s = t + i * 0.3;
    const freqs = [1600 - i * 150, 1200 - i * 100, 800 - i * 60];
    freqs.forEach((f) => {
      const osc = sc.ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.setValueAtTime(f, s);
      osc.frequency.exponentialRampToValueAtTime(f * 0.2, s + 0.6);
      const env = sc.ctx.createGain();
      env.gain.setValueAtTime(0.15, s);
      env.gain.exponentialRampToValueAtTime(0.001, s + 0.6);
      osc.connect(env); env.connect(sc.gain);
      osc.start(s); osc.stop(s + 0.61);
    });
  }
    },

  move(sc) {
  const t = sc.now();
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = 1500 + Math.random() * 200;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.04, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.025);
    },

  hold(sc) {
  const t = sc.now();
  // Crystal whoosh
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(2000, t + 0.05);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.11);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const semitones = Math.min(combo - 2, 12);
  const freq = 800 * Math.pow(2, semitones / 12);
  // Clear crystal bell tone rising with combo
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.26);
  // Resonant harmonic
  const h = sc.ctx.createOscillator();
  h.type = 'sine'; h.frequency.value = freq * 2.5;
  const he = sc.ctx.createGain();
  he.gain.setValueAtTime(0.06, t);
  he.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  h.connect(he); he.connect(sc.gain);
  h.start(t); h.stop(t + 0.19);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.18 : 0.1;
  // Crystal spinning resonance
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.2);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.23);
  if (isFull) {
    // Crystal harmonic burst
    [1600, 2000, 2800].forEach((f, i) => {
      const h = sc.ctx.createOscillator();
      h.type = 'sine'; h.frequency.value = f;
      const he = sc.ctx.createGain();
      const s = t + 0.06 + i * 0.025;
      he.gain.setValueAtTime(0.12, s);
      he.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
      h.connect(he); he.connect(sc.gain);
      h.start(s); h.stop(s + 0.21);
    });
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Crystal ascending choir — pure harmonic series
  const freqs = [800, 1000, 1200, 1600];
  freqs.forEach((f, i) => {
    const s = t + i * 0.07;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = f;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.18, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.41);
    // Harmonic overtone
    const h = sc.ctx.createOscillator();
    h.type = 'sine'; h.frequency.value = f * 2.5;
    const he = sc.ctx.createGain();
    he.gain.setValueAtTime(0.05, s);
    he.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
    h.connect(he); he.connect(sc.gain);
    h.start(s); h.stop(s + 0.31);
  });
    },

  backToBack(sc) {
  const t = sc.now();
  // Crystal power chord — harmonics
  [1000, 1500, 2000].forEach((f, i) => {
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = f;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(env); env.connect(sc.gain);
    osc.start(t); osc.stop(t + 0.26);
  });
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const freq = 600 + i * 60;
  const vol = 0.03 + i * 0.01;
  // Crystal warning hum
  const osc = sc.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t + 0.25);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.26);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Crystal stress — short crystalline ticks, no sustained tones
  const dur = 0.5 * ds;
  const notes = [523, 659, 784, 1047];
  const base = notes[Math.min(rowIndex, 3)] * pitch;
  // 2-3 short crystal ticks at harmonic frequencies
  const ticks = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < ticks; i++) {
    const ct = t + (i / ticks) * dur * 0.7 + Math.random() * 0.02 * ds;
    sc.ping(ct, base * (1 + i * 0.5), 0.03, 0.06);
  }
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Crystal chime — pure bell tone with harmonic singing
  const note = (1047 + progress * 1047) * pitch; // C6 rising to C7

  // Layer 1: Pure bell fundamental
  const bell = sc.ctx.createOscillator();
  bell.type = 'sine';
  bell.frequency.value = note;
  const bEnv = sc.ctx.createGain();
  bEnv.gain.setValueAtTime(0.12, t);
  bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.35 * ds);
  bell.connect(bEnv); bEnv.connect(sc.gain);
  sc.addReverb(bEnv, 0.5 * ds, 0.3, 0.12);
  bell.start(t); bell.stop(t + 0.38 * ds);

  // Layer 2: Perfect fifth harmonic (bell-like inharmonic partial)
  const h5 = sc.ctx.createOscillator();
  h5.type = 'sine';
  h5.frequency.value = note * 1.5;
  const h5e = sc.ctx.createGain();
  h5e.gain.setValueAtTime(0.05, t);
  h5e.gain.exponentialRampToValueAtTime(0.001, t + 0.25 * ds);
  h5.connect(h5e); h5e.connect(sc.gain);
  h5.start(t); h5.stop(t + 0.28 * ds);

  // Layer 3: Inharmonic bell partial (× 2.76 — real bells have these)
  const ih = sc.ctx.createOscillator();
  ih.type = 'sine';
  ih.frequency.value = note * 2.76;
  const ihe = sc.ctx.createGain();
  ihe.gain.setValueAtTime(0.02, t);
  ihe.gain.exponentialRampToValueAtTime(0.001, t + 0.15 * ds);
  ih.connect(ihe); ihe.connect(sc.gain);
  ih.start(t); ih.stop(t + 0.18 * ds);

  // Layer 4: Tiny attack transient
  const click = sc.ctx.createBufferSource();
  click.buffer = sc.createNoiseBuffer(0.004);
  const cke = sc.ctx.createGain();
  cke.gain.setValueAtTime(0.08, t);
  cke.gain.exponentialRampToValueAtTime(0.001, t + 0.004);
  click.connect(cke); cke.connect(sc.gain);
  click.start(t); click.stop(t + 0.006);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Crystal fracturing L→R: each crack excites a resonant harmonic ping
  const dur = 0.8 * ds;
  const chordFreqs = [523, 659, 784, 1047];
  const base = chordFreqs[Math.min(rowIndex, 3)] * pitch;
  const harmonics = [1, 1.25, 1.5, 2, 2.5, 3, 4];

  // Initial crystal crack — sharp + bright resonance
  sc.crackBurst(t, 2500 * pitch, 12, 0.004, 0.35);
  sc.ping(t, base, 0.12, 0.12);
  // Sub wobble
  sc.ping(t, 55 + rowIndex * 8, dur * 0.2, 0.10);

  // 10-cell crystal fracture L→R — each crack triggers a harmonic
  for (let i = 0; i < 10; i++) {
    const ct = t + ((i + 1) / 11) * dur * 0.65 + (Math.random() - 0.5) * 0.005 * ds;
    // Crack transient through high-Q bandpass
    sc.crackBurst(ct, (2000 + Math.random() * 3000) * pitch,
      10 + Math.random() * 5, 0.003 + Math.random() * 0.002,
      0.18 + Math.random() * 0.12);
    // Harmonic ping — picks from the harmonic series
    const harm = harmonics[i % harmonics.length];
    sc.ping(ct + 0.002, base * harm,
      0.05 + Math.random() * 0.06, 0.06 + Math.random() * 0.04);
  }

  // Shimmer trail — overlapping harmonic decays with reverb
  for (let i = 0; i < 5; i++) {
    const st = t + dur * 0.3 + (i / 5) * dur * 0.5;
    const harm = harmonics[Math.floor(Math.random() * harmonics.length)];
    const node = sc.ping(st, base * harm,
      0.08 + Math.random() * 0.06, 0.03 + Math.random() * 0.02);
    sc.addReverb(node, dur * 0.4, 0.25, 0.08);
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _crystalInitialPing(sc, t, intensity, totalDur, vol, comboShift) {
  const ping = sc.ctx.createOscillator();
  ping.type = 'sine';
  const pingFreq = 2637 * (1 + comboShift); // E7
  ping.frequency.setValueAtTime(pingFreq, t);
  ping.frequency.exponentialRampToValueAtTime(pingFreq * 0.85, t + 0.15);
  const pingEnv = sc.ctx.createGain();
  pingEnv.gain.setValueAtTime(vol * 0.5, t);
  pingEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  ping.connect(pingEnv);
  pingEnv.connect(sc.gain);
  ping.start(t);
  ping.stop(t + 0.21);

}

function _crystalHarmonicChord(sc, t, intensity, totalDur, vol, comboShift) {
  const chordNotes = [1760, 2217.5, 2637, 3520, 4186]; // A6, C#7, E7, A7, C8
  const noteCount = 2 + intensity;
  for (let i = 0; i < noteCount; i++) {
    const freq = chordNotes[i % chordNotes.length] * (0.97 + Math.random() * 0.06 + comboShift);
    const dur = 0.15 + Math.random() * 0.25;
    const osc = sc.ctx.createOscillator();
    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(vol * (0.12 + Math.random() * 0.08), t + i * 0.015);
    env.gain.exponentialRampToValueAtTime(0.001, t + i * 0.015 + dur);
    osc.connect(env);
    env.connect(sc.gain);
    osc.start(t + i * 0.015);
    osc.stop(t + i * 0.015 + dur + 0.01);
  }

}

function _crystalSparkleCascade(sc, t, intensity, totalDur, vol, comboShift) {
  const sparkleCount = 10 + intensity * 5;
  for (let i = 0; i < sparkleCount; i++) {
    const offset = 0.03 + Math.random() * totalDur * 0.85;
    const freq = 3000 + Math.random() * 9000;
    const dur = 0.02 + Math.random() * 0.06;
    const loudness = (0.08 + Math.random() * 0.08) * Math.max(0.15, 1 - offset / totalDur);
    if (loudness <= 0.001) continue;
    const osc = sc.ctx.createOscillator();
    osc.type = Math.random() < 0.5 ? 'sine' : 'triangle';
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

function _crystalShimmerWash(sc, t, intensity, totalDur, vol, comboShift) {
  const shimDur = totalDur * 0.5;
  const shim = sc.ctx.createBufferSource();
  shim.buffer = sc.createNoiseBuffer(shimDur);
  const shimF = sc.ctx.createBiquadFilter();
  shimF.type = 'bandpass';
  shimF.frequency.value = 8000;
  shimF.Q.value = 2;
  const shimEnv = sc.ctx.createGain();
  shimEnv.gain.setValueAtTime(vol * 0.12, t + 0.02);
  shimEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + shimDur);
  shim.connect(shimF);
  shimF.connect(shimEnv);
  shimEnv.connect(sc.gain);
  shim.start(t + 0.02);
  shim.stop(t + 0.02 + shimDur + 0.01);

}

function _crystalBellResonance(sc, t, intensity, totalDur, vol, comboShift) {
  const bellFreq = 1568 * (1 + comboShift); // G6
  const bell = sc.ctx.createOscillator();
  bell.type = 'sine';
  bell.frequency.value = bellFreq;
  const bellOvertone = sc.ctx.createOscillator();
  bellOvertone.type = 'sine';
  bellOvertone.frequency.value = bellFreq * 2.76; // inharmonic overtone = bell-like
  const bellEnv = sc.ctx.createGain();
  bellEnv.gain.setValueAtTime(vol * 0.15, t);
  bellEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.1);
  const overtoneEnv = sc.ctx.createGain();
  overtoneEnv.gain.setValueAtTime(vol * 0.06, t);
  overtoneEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  bell.connect(bellEnv);
  bellEnv.connect(sc.gain);
  bellOvertone.connect(overtoneEnv);
  overtoneEnv.connect(sc.gain);
  bell.start(t);
  bell.stop(t + 0.6 + intensity * 0.1);
  bellOvertone.start(t);
  bellOvertone.stop(t + 0.31);

}

function _crystalReverbShimmer(sc, t, intensity, totalDur, vol, comboShift) {
  const revSrc = sc.ctx.createBufferSource();
  revSrc.buffer = sc.createNoiseBuffer(0.06);
  const revF = sc.ctx.createBiquadFilter();
  revF.type = 'highpass';
  revF.frequency.value = 4000;
  const revDelay = sc.ctx.createDelay();
  revDelay.delayTime.value = 0.025;
  const revFb = sc.ctx.createGain();
  revFb.gain.value = 0.25 + intensity * 0.05;
  const revEnv = sc.ctx.createGain();
  revEnv.gain.setValueAtTime(vol * 0.12, t + 0.01);
  revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.45 + intensity * 0.1);
  revSrc.connect(revF);
  revF.connect(revDelay);
  revDelay.connect(revFb);
  revFb.connect(revDelay);
  revDelay.connect(revEnv);
  revEnv.connect(sc.gain);
  revSrc.start(t + 0.01);
  revSrc.stop(t + 0.07);
}

