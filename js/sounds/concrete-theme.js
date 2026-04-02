/**
 * Concrete theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const concreteTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Stone tap
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120 * pf, t);
  osc.frequency.exponentialRampToValueAtTime(60 * pf, t + 0.08);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.11);
  // Grit texture
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.03);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 400;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.08, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.04);
    },

  rotate(sc) {
  const t = sc.now();
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.03);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 500;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.04);
    },

  lock(sc) {
  const t = sc.now();
  // Concrete thud
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(100 + Math.random() * 30, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.25, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
  // Grit
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.025);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 350;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.03);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Heavy concrete slam
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(70, t);
  sub.frequency.exponentialRampToValueAtTime(25, t + 0.12);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.5, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 0.13);
  // Concrete dust
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 300;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.18, t + 0.01);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t + 0.01); n.stop(t + 0.09);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  // 1. INITIAL CRACK — low-mid broadband impact
  _concreteInitialCrack(sc, t, intensity, totalDur, vol, comboShift);

  // 2. SUB-BASS THUD — you feel the concrete breaking
  _concreteSubbassThud(sc, t, intensity, totalDur, vol, comboShift);

  // 3. MID CRUMBLE — dense grainy texture, lower frequencies than glass
  _concreteMidCrumble(sc, t, intensity, totalDur, vol, comboShift);

  // 4. RUBBLE CASCADE — staggered low-frequency chunks bouncing
  _concreteRubbleCascade(sc, t, intensity, totalDur, vol, comboShift);

  // 5. CHUNK IMPACTS — heavy thuds as chunks hit ground
  _concreteChunkImpacts(sc, t, intensity, totalDur, vol, comboShift);

  // 6. DUST CLOUD — long low-frequency hiss
  _concreteDustCloud(sc, t, intensity, totalDur, vol, comboShift);

  // 7. REVERB RUMBLE
  _concreteReverbRumble(sc, t, intensity, totalDur, vol, comboShift);

    },

  levelUp(sc) {
  const t = sc.now();
  // Rising concrete thuds getting louder
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.08;
    const freq = 50 + i * 20;
    const osc = sc.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, s + 0.1);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.15 + i * 0.05, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.13);
  }
  // Rumble aftermath
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.15);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 300;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t + 0.32);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t + 0.32); n.stop(t + 0.46);
    },

  gameOver(sc) {
  const t = sc.now();
  // Building collapse — descending rumbles + debris cascade
  // Sub-bass rumble
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(60, t + 0.1);
  sub.frequency.exponentialRampToValueAtTime(15, t + 2.5);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.4, t + 0.1);
  se.gain.linearRampToValueAtTime(0.001, t + 2.5);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t + 0.1); sub.stop(t + 2.6);
  // Staggered concrete debris
  for (let i = 0; i < 5; i++) {
    const s = t + 0.3 + i * 0.35;
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.4);
    const lpf = sc.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 500 - i * 60;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.2 - i * 0.03, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.35);
    n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.36);
  }
  // Long rumble tail
  const tail = sc.ctx.createBufferSource();
  tail.buffer = sc.createNoiseBuffer(2);
  const tl = sc.ctx.createBiquadFilter();
  tl.type = 'lowpass'; tl.frequency.setValueAtTime(400, t);
  tl.frequency.exponentialRampToValueAtTime(60, t + 2.5);
  const te = sc.ctx.createGain();
  te.gain.setValueAtTime(0.12, t + 0.5);
  te.gain.linearRampToValueAtTime(0.001, t + 2.5);
  tail.connect(tl); tl.connect(te); te.connect(sc.gain);
  tail.start(t + 0.5); tail.stop(t + 2.6);
    },

  move(sc) {
  const t = sc.now();
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.015);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 300;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.05, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.02);
    },

  hold(sc) {
  const t = sc.now();
  // Stone slide
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.1);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(300, t);
  lpf.frequency.exponentialRampToValueAtTime(600, t + 0.05);
  lpf.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.11);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const intensity = Math.min(combo - 1, 8);
  const freq = 60 + intensity * 15;
  // Escalating concrete impact thuds
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.1);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.25 + intensity * 0.02, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.13);
  // Gritty rubble noise
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.08);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 400 + intensity * 50;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.12, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.09);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.25 : 0.15;
  // Concrete grinding — lowpass noise sweep
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.3);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(200, t);
  lpf.frequency.exponentialRampToValueAtTime(600, t + 0.12);
  lpf.frequency.exponentialRampToValueAtTime(150, t + 0.25);
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.29);
  if (isFull) {
    // Heavy concrete crack
    const sub = sc.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(80, t + 0.1);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.25);
    const se = sc.ctx.createGain();
    se.gain.setValueAtTime(0.3, t + 0.1);
    se.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    sub.connect(se); se.connect(sc.gain);
    sub.start(t + 0.1); sub.stop(t + 0.26);
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Concrete demolition — staggered heavy impacts
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.1;
    const freq = 80 - i * 10;
    const osc = sc.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.15);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.3, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.16);
    // Rubble burst
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.1);
    const lpf = sc.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 500 - i * 50;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.15, s);
    ne.gain.exponentialRampToValueAtTime(0.001, s + 0.1);
    n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
    n.start(s); n.stop(s + 0.11);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Heavy double concrete impact
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.exponentialRampToValueAtTime(25, t + 0.15);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.35, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.19);
  // Rubble scatter
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.15);
  const lpf = sc.ctx.createBiquadFilter();
  lpf.type = 'lowpass'; lpf.frequency.value = 350;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.18, t + 0.03);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
  n.start(t + 0.03); n.stop(t + 0.16);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const freq = 50 + i * 10;
  const vol = 0.04 + i * 0.015;
  // Concrete stress groan — deep rumble
  const osc = sc.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.3);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.31);
  if (i >= 6) {
    const n = sc.ctx.createBufferSource();
    n.buffer = sc.createNoiseBuffer(0.1);
    const lpf = sc.ctx.createBiquadFilter();
    lpf.type = 'lowpass'; lpf.frequency.value = 200;
    const ne = sc.ctx.createGain();
    ne.gain.setValueAtTime(0.03, t);
    ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    n.connect(lpf); lpf.connect(ne); ne.connect(sc.gain);
    n.start(t); n.stop(t + 0.11);
  }
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Concrete stress — short dry cracks only, no sustained groan
  const dur = 0.5 * ds;
  const cracks = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < cracks; i++) {
    const ct = t + (i / cracks) * dur * 0.8 + Math.random() * 0.03 * ds;
    sc.crackBurst(ct, 200 + Math.random() * 300, 2,
      0.008 + Math.random() * 0.006, 0.08 + Math.random() * 0.05);
  }
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Concrete chunk breaking — heavy thud + rubble scatter
  const freq = (60 + progress * 40) * pitch;

  // Layer 1: Impact thud (you feel it)
  const thud = sc.ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(freq, t);
  thud.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.06 * ds);
  const te = sc.ctx.createGain();
  te.gain.setValueAtTime(0.25, t);
  te.gain.exponentialRampToValueAtTime(0.001, t + 0.08 * ds);
  thud.connect(te); te.connect(sc.gain);
  thud.start(t); thud.stop(t + 0.09 * ds);

  // Layer 2: Rubble/gravel scatter (broadband noise, mid-freq)
  const rubble = sc.ctx.createBufferSource();
  rubble.buffer = sc.createNoiseBuffer(0.08 * ds);
  const rf = sc.ctx.createBiquadFilter();
  rf.type = 'bandpass'; rf.frequency.value = 600 + progress * 500; rf.Q.value = 1.5;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.15, t + 0.005);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.07 * ds);
  rubble.connect(rf); rf.connect(re); re.connect(sc.gain);
  rubble.start(t + 0.005); rubble.stop(t + 0.08 * ds);

  // Layer 3: Dust puff (very high noise, faint)
  const dust = sc.ctx.createBufferSource();
  dust.buffer = sc.createNoiseBuffer(0.04 * ds);
  const df = sc.ctx.createBiquadFilter();
  df.type = 'highpass'; df.frequency.value = 2000;
  const de = sc.ctx.createGain();
  de.gain.setValueAtTime(0.05, t + 0.01);
  de.gain.exponentialRampToValueAtTime(0.001, t + 0.05 * ds);
  dust.connect(df); df.connect(de); de.connect(sc.gain);
  dust.start(t + 0.01); dust.stop(t + 0.06 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Concrete fracturing L→R: heavy discrete cracks, chunky impacts, gritty
  const dur = 0.8 * ds;

  // Initial heavy crack — loud low snap + deep thump
  sc.crackBurst(t, 300 * pitch, 2.5, 0.015, 0.42);
  sc.ping(t, (50 + rowIndex * 10) * pitch, 0.04, 0.35);

  // Sub-bass rumble from impact
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime((45 + rowIndex * 8) * pitch, t);
  sub.frequency.exponentialRampToValueAtTime(25, t + dur * 0.4);
  const sE = sc.ctx.createGain();
  sE.gain.setValueAtTime(0.25, t);
  sE.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.35);
  sub.connect(sE); sE.connect(sc.gain);
  sub.start(t); sub.stop(t + dur * 0.4);

  // 10-cell concrete chunk cascade L→R
  for (let i = 0; i < 10; i++) {
    const ct = t + ((i + 1) / 11) * dur * 0.75 + (Math.random() - 0.5) * 0.008 * ds;
    // Heavy crack: low-mid bandpass noise burst
    sc.crackBurst(ct, 200 + Math.random() * 300, 2 + Math.random() * 2,
      0.012 + Math.random() * 0.01, 0.20 + Math.random() * 0.15);
    // Chunk impact — low sine thud for each chunk
    sc.ping(ct, (60 + Math.random() * 80) * pitch,
      0.02 + Math.random() * 0.01, 0.08 + Math.random() * 0.06);
    // Debris scatter (40% chance)
    if (Math.random() > 0.6) {
      sc.crackBurst(ct + 0.008, 1000 + Math.random() * 1500,
        1.5, 0.006, 0.06 + Math.random() * 0.04);
    }
  }

  // Dust cloud: tiny quiet high-freq bursts trailing behind
  for (let i = 0; i < 6; i++) {
    const dt = t + (i / 6) * dur * 0.6 + 0.03 * ds + Math.random() * 0.01;
    sc.crackBurst(dt, 2000 + Math.random() * 2000, 0.8,
      0.008 + Math.random() * 0.005, 0.03 + Math.random() * 0.02, 'highpass');
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _concreteInitialCrack(sc, t, intensity, totalDur, vol, comboShift) {
  const crack = sc.ctx.createBufferSource();
  crack.buffer = sc.createNoiseBuffer(0.05);
  const crackF = sc.ctx.createBiquadFilter();
  crackF.type = 'bandpass';
  crackF.frequency.value = 400 + comboShift * 200;
  crackF.Q.value = 0.8;
  const crackEnv = sc.ctx.createGain();
  crackEnv.gain.setValueAtTime(vol * 1.3, t);
  crackEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  crack.connect(crackF);
  crackF.connect(crackEnv);
  crackEnv.connect(sc.gain);
  crack.start(t);
  crack.stop(t + 0.055);

}

function _concreteSubbassThud(sc, t, intensity, totalDur, vol, comboShift) {
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(60 + intensity * 5, t);
  sub.frequency.exponentialRampToValueAtTime(25, t + 0.2);
  const subEnv = sc.ctx.createGain();
  subEnv.gain.setValueAtTime(vol * 0.7, t);
  subEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  sub.connect(subEnv);
  subEnv.connect(sc.gain);
  sub.start(t);
  sub.stop(t + 0.26);

}

function _concreteMidCrumble(sc, t, intensity, totalDur, vol, comboShift) {
  const crumbleDur = 0.2 + intensity * 0.08;
  const crumble = sc.ctx.createBufferSource();
  crumble.buffer = sc.createNoiseBuffer(crumbleDur);
  const crumbleF = sc.ctx.createBiquadFilter();
  crumbleF.type = 'lowpass';
  crumbleF.frequency.setValueAtTime(2500, t);
  crumbleF.frequency.exponentialRampToValueAtTime(300, t + crumbleDur);
  const crumbleEnv = sc.ctx.createGain();
  crumbleEnv.gain.setValueAtTime(vol * 0.6, t + 0.01);
  crumbleEnv.gain.exponentialRampToValueAtTime(0.001, t + crumbleDur);
  crumble.connect(crumbleF);
  crumbleF.connect(crumbleEnv);
  crumbleEnv.connect(sc.gain);
  crumble.start(t + 0.01);
  crumble.stop(t + crumbleDur + 0.01);

}

function _concreteRubbleCascade(sc, t, intensity, totalDur, vol, comboShift) {
  const rubbleCount = 5 + intensity * 3;
  for (let i = 0; i < rubbleCount; i++) {
    const offset = 0.06 + Math.random() * totalDur * 0.85;
    const dur = 0.03 + Math.random() * 0.06;
    const freq = 150 + Math.random() * 600;
    const loudness = (0.15 + Math.random() * 0.15) * Math.max(0.15, 1 - offset / totalDur);
    const src = sc.ctx.createBufferSource();
    src.buffer = sc.createNoiseBuffer(dur);
    const f = sc.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.5 + Math.random() * 3;
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(Math.max(loudness, 0.001), t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
    src.connect(f);
    f.connect(env);
    env.connect(sc.gain);
    src.start(t + offset);
    src.stop(t + offset + dur + 0.01);
  }

}

function _concreteChunkImpacts(sc, t, intensity, totalDur, vol, comboShift) {
  const chunkCount = 2 + intensity;
  for (let i = 0; i < chunkCount; i++) {
    const offset = 0.1 + i * 0.12 + Math.random() * 0.05;
    const osc = sc.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + Math.random() * 40, t + offset);
    osc.frequency.exponentialRampToValueAtTime(30, t + offset + 0.1);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(vol * (0.25 - i * 0.04), t + offset);
    env.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.1);
    osc.connect(env);
    env.connect(sc.gain);
    osc.start(t + offset);
    osc.stop(t + offset + 0.11);
  }

}

function _concreteDustCloud(sc, t, intensity, totalDur, vol, comboShift) {
  const dustDur = totalDur * 0.6;
  const dust = sc.ctx.createBufferSource();
  dust.buffer = sc.createNoiseBuffer(dustDur);
  const dustF = sc.ctx.createBiquadFilter();
  dustF.type = 'lowpass';
  dustF.frequency.value = 1200;
  const dustEnv = sc.ctx.createGain();
  dustEnv.gain.setValueAtTime(0.001, t + 0.1);
  dustEnv.gain.linearRampToValueAtTime(vol * 0.18, t + 0.2);
  dustEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.1 + dustDur);
  dust.connect(dustF);
  dustF.connect(dustEnv);
  dustEnv.connect(sc.gain);
  dust.start(t + 0.1);
  dust.stop(t + 0.1 + dustDur + 0.01);

}

function _concreteReverbRumble(sc, t, intensity, totalDur, vol, comboShift) {
  const revSrc = sc.ctx.createBufferSource();
  revSrc.buffer = sc.createNoiseBuffer(0.1);
  const revF = sc.ctx.createBiquadFilter();
  revF.type = 'lowpass';
  revF.frequency.value = 800;
  const revDelay = sc.ctx.createDelay();
  revDelay.delayTime.value = 0.05;
  const revFb = sc.ctx.createGain();
  revFb.gain.value = 0.35 + intensity * 0.04;
  const revEnv = sc.ctx.createGain();
  revEnv.gain.setValueAtTime(vol * 0.15, t + 0.03);
  revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + intensity * 0.12);
  revSrc.connect(revF);
  revF.connect(revDelay);
  revDelay.connect(revFb);
  revFb.connect(revDelay);
  revDelay.connect(revEnv);
  revEnv.connect(sc.gain);
  revSrc.start(t + 0.03);
  revSrc.stop(t + 0.13);
}

