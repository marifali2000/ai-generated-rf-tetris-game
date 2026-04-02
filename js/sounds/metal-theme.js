/**
 * Metal theme — procedural sound effects.
 * All functions receive a SoundContext (sc) for audio primitives.
 */

export const metalTheme = {
  spawn(sc) {
  const t = sc.now();
  const pf = 0.96 + Math.random() * 0.08;
  // Metallic ping
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(500 * pf, t);
  osc.frequency.exponentialRampToValueAtTime(300 * pf, t + 0.06);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.12, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.09);
  // Ring resonance
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine'; ring.frequency.value = 1100 * pf;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.06, t);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  ring.connect(re); re.connect(sc.gain);
  ring.start(t); ring.stop(t + 0.11);
    },

  rotate(sc) {
  const t = sc.now();
  const p = 0.97 + Math.random() * 0.06;
  const osc = sc.ctx.createOscillator();
  osc.type = 'square'; osc.frequency.value = 800 * p;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.04);
    },

  lock(sc) {
  const t = sc.now();
  // Metal clank
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(400 + Math.random() * 100, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.05);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.18, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.07);
    },

  hardDrop(sc) {
  const t = sc.now();
  // Metal slam
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.3, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.11);
  // Metallic ring aftermath
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine'; ring.frequency.value = 600;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.1, t + 0.02);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  ring.connect(re); re.connect(sc.gain);
  ring.start(t + 0.02); ring.stop(t + 0.16);
    },

  lineClear(sc, t, intensity, totalDur, vol, comboShift) {
  // 1. INITIAL CLANG — sharp metallic attack with inharmonic overtones
  _metalInitialClang(sc, t, intensity, totalDur, vol, comboShift);

  // 2. IMPACT RING — resonant metallic ring that sustains
  _metalImpactRing(sc, t, intensity, totalDur, vol, comboShift);

  // 3. METAL SCRAPE — filtered noise sweeping down
  _metalMetalScrape(sc, t, intensity, totalDur, vol, comboShift);

  // 4. RATTLE — scattered metallic pings
  _metalRattle(sc, t, intensity, totalDur, vol, comboShift);

  // 5. ANVIL RESONANCE — low sustaining hum
  _metalAnvilResonance(sc, t, intensity, totalDur, vol, comboShift);

  // 6. REVERB CLANG
  _metalReverbClang(sc, t, intensity, totalDur, vol, comboShift);

    },

  levelUp(sc) {
  const t = sc.now();
  // Ascending metallic clangs
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.08;
    const freq = 300 + i * 120;
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, s + 0.08);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.12 + i * 0.03, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.1);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.11);
    // Ring
    const ring = sc.ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = freq * 2.5;
    const re = sc.ctx.createGain();
    re.gain.setValueAtTime(0.05, s);
    re.gain.exponentialRampToValueAtTime(0.001, s + 0.12);
    ring.connect(re); re.connect(sc.gain);
    ring.start(s); ring.stop(s + 0.13);
  }
    },

  gameOver(sc) {
  const t = sc.now();
  // Metal structural collapse — grinding + impacts
  const sub = sc.ctx.createOscillator();
  sub.type = 'square';
  sub.frequency.setValueAtTime(100, t);
  sub.frequency.exponentialRampToValueAtTime(20, t + 2);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.15, t);
  se.gain.linearRampToValueAtTime(0.001, t + 2);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 2.1);
  for (let i = 0; i < 5; i++) {
    const s = t + 0.2 + i * 0.35;
    const freq = 500 - i * 60;
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, s + 0.3);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.12, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.31);
    // Ring
    const ring = sc.ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = freq * 2;
    const re = sc.ctx.createGain();
    re.gain.setValueAtTime(0.06, s);
    re.gain.exponentialRampToValueAtTime(0.001, s + 0.4);
    ring.connect(re); re.connect(sc.gain);
    ring.start(s); ring.stop(s + 0.41);
  }
    },

  move(sc) {
  const t = sc.now();
  const osc = sc.ctx.createOscillator();
  osc.type = 'square'; osc.frequency.value = 600 + Math.random() * 100;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.03, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.025);
    },

  hold(sc) {
  const t = sc.now();
  // Metal slide
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.1);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(500, t);
  bpf.frequency.exponentialRampToValueAtTime(1500, t + 0.05);
  bpf.frequency.exponentialRampToValueAtTime(800, t + 0.1);
  bpf.Q.value = 1;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(0.1, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.11);
    },

  comboHit(sc, combo) {
  const t = sc.now();
  const intensity = Math.min(combo - 1, 8);
  const freq = 300 + intensity * 60;
  // Metallic clang escalating
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.12);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.15, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
  // Metallic ring
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine'; ring.frequency.value = freq * 2.2;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.08, t);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  ring.connect(re); re.connect(sc.gain);
  ring.start(t); ring.stop(t + 0.21);
    },

  tSpin(sc, type) {
  const t = sc.now();
  const isFull = type === 'full';
  const vol = isFull ? 0.2 : 0.12;
  // Metal grinding sweep
  const n = sc.ctx.createBufferSource();
  n.buffer = sc.createNoiseBuffer(0.2);
  const bpf = sc.ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(400, t);
  bpf.frequency.exponentialRampToValueAtTime(1500, t + 0.1);
  bpf.frequency.exponentialRampToValueAtTime(600, t + 0.18);
  bpf.Q.value = 1.5;
  const ne = sc.ctx.createGain();
  ne.gain.setValueAtTime(vol, t);
  ne.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bpf); bpf.connect(ne); ne.connect(sc.gain);
  n.start(t); n.stop(t + 0.21);
  if (isFull) {
    // Heavy metal impact
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.2, t + 0.08);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(env); env.connect(sc.gain);
    osc.start(t + 0.08); osc.stop(t + 0.23);
  }
    },

  perfectClear(sc) {
  const t = sc.now();
  // Metal demolition — cascading metallic strikes
  for (let i = 0; i < 4; i++) {
    const s = t + i * 0.09;
    const freq = 400 + i * 100;
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, s + 0.12);
    const env = sc.ctx.createGain();
    env.gain.setValueAtTime(0.15, s);
    env.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
    osc.connect(env); env.connect(sc.gain);
    osc.start(s); osc.stop(s + 0.16);
    // Metallic ring resonance
    const ring = sc.ctx.createOscillator();
    ring.type = 'sine'; ring.frequency.value = freq * 2.5;
    const re = sc.ctx.createGain();
    re.gain.setValueAtTime(0.08, s);
    re.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
    ring.connect(re); re.connect(sc.gain);
    ring.start(s); ring.stop(s + 0.21);
  }
    },

  backToBack(sc) {
  const t = sc.now();
  // Heavy metal strike with ring
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(250, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0.2, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.16);
  // Ring overtone
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine'; ring.frequency.value = 800;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.1, t);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  ring.connect(re); re.connect(sc.gain);
  ring.start(t); ring.stop(t + 0.26);
    },

  dangerPulse(sc, intensity) {
  const t = sc.now();
  const i = Math.min(intensity, 10);
  const freq = 150 + i * 25;
  const vol = 0.04 + i * 0.012;
  // Metal stress groan — square wave pulse
  const osc = sc.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.25);
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(vol, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + 0.29);
    },

  rowHighlight(sc, t, rowIndex, pitch, ds) {
  // Metal stress — bending beam + discrete metallic plinks
  const dur = 0.5 * ds;
  const freq = (80 + rowIndex * 30) * pitch;

  // Deep metallic groan (oscillator through resonant filter)
  const osc = sc.ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.linearRampToValueAtTime(freq * 1.3, t + dur);
  const filter = sc.ctx.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = freq * 2; filter.Q.value = 6;
  const env = sc.ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.12, t + 0.1 * ds);
  env.gain.setValueAtTime(0.12, t + 0.35 * ds);
  env.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(filter); filter.connect(env); env.connect(sc.gain);
  osc.start(t); osc.stop(t + dur + 0.05);

  // Metallic plinks — discrete high-Q noise bursts (not continuous rattle)
  const plinks = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < plinks; i++) {
    const pt = t + (i / plinks) * dur * 0.7 + Math.random() * 0.03 * ds;
    sc.crackBurst(pt, 800 + rowIndex * 200 + Math.random() * 500,
      12 + Math.random() * 8, 0.008 + Math.random() * 0.005,
      0.04 + Math.random() * 0.03);
  }

  // Sub vibration
  sc.ping(t, 40 * pitch, dur, 0.08);
    },

  cellPop(sc, t, progress, pitch, ds) {
  // Metal shard clanging — resonant ping + rattle
  const freq = (300 + progress * 600) * pitch;

  // Layer 1: Sharp metallic transient
  const hit = sc.ctx.createBufferSource();
  hit.buffer = sc.createNoiseBuffer(0.01);
  const hf = sc.ctx.createBiquadFilter();
  hf.type = 'bandpass'; hf.frequency.value = freq * 4; hf.Q.value = 12;
  const he = sc.ctx.createGain();
  he.gain.setValueAtTime(0.2, t);
  he.gain.exponentialRampToValueAtTime(0.001, t + 0.015 * ds);
  hit.connect(hf); hf.connect(he); he.connect(sc.gain);
  hit.start(t); hit.stop(t + 0.02 * ds);

  // Layer 2: Resonant ring (metal has high-Q resonances)
  const ring = sc.ctx.createOscillator();
  ring.type = 'sawtooth';
  ring.frequency.value = freq;
  const rf = sc.ctx.createBiquadFilter();
  rf.type = 'bandpass'; rf.frequency.value = freq * 3; rf.Q.value = 15;
  const re = sc.ctx.createGain();
  re.gain.setValueAtTime(0.1, t);
  re.gain.exponentialRampToValueAtTime(0.001, t + 0.18 * ds);
  ring.connect(rf); rf.connect(re); re.connect(sc.gain);
  sc.addReverb(re, 0.25 * ds, 0.2, 0.06);
  ring.start(t); ring.stop(t + 0.2 * ds);

  // Layer 3: Sub-clank (felt impact)
  const sub = sc.ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(freq * 0.25, t);
  sub.frequency.exponentialRampToValueAtTime(freq * 0.1, t + 0.05 * ds);
  const se = sc.ctx.createGain();
  se.gain.setValueAtTime(0.12, t);
  se.gain.exponentialRampToValueAtTime(0.001, t + 0.06 * ds);
  sub.connect(se); se.connect(sc.gain);
  sub.start(t); sub.stop(t + 0.07 * ds);
    },

  rowCleared(sc, t, rowIndex, pitch, ds) {
  // Metal tearing L→R: resonant clangs, each hit rings with inharmonic partials
  const dur = 0.8 * ds;
  const baseFreq = (180 + rowIndex * 50) * pitch;

  // Initial metal strike — loud high-Q clang
  sc.crackBurst(t, baseFreq * 3, 20, 0.008, 0.40);
  // Ringing from initial strike (long high-Q noise = metallic ring)
  sc.crackBurst(t, baseFreq * 5, 25, 0.06, 0.12);
  // Sub impact
  sc.ping(t, 45, dur * 0.2, 0.20);

  // 10-cell metal tear L→R: each is a clang through very high Q
  for (let i = 0; i < 10; i++) {
    const ct = t + ((i + 1) / 11) * dur * 0.7 + (Math.random() - 0.5) * 0.006 * ds;
    const clangFreq = (300 + Math.random() * 900) * pitch;
    // Resonant clang — high Q creates metallic ringing
    sc.crackBurst(ct, clangFreq, 15 + Math.random() * 10,
      0.006 + Math.random() * 0.006, 0.15 + Math.random() * 0.12);
    // Inharmonic partial (metallic timbre = non-integer freq ratios)
    const ratio = 1.4 + Math.random() * 1.6;
    sc.crackBurst(ct, clangFreq * ratio, 18,
      0.01, 0.06 + Math.random() * 0.04);
  }

  // Scraping texture: longer resonant noise bursts with reverb
  for (let i = 0; i < 3; i++) {
    const st = t + (i / 3) * dur * 0.5 + 0.02 * ds;
    const node = sc.crackBurst(st, 800 + Math.random() * 1200, 20,
      0.03 + Math.random() * 0.02, 0.04 + Math.random() * 0.03);
    sc.addReverb(node, dur * 0.3, 0.2, 0.06);
  }
    },
};


// ─── lineClear helpers ─────────────────────────────────────────────

function _metalInitialClang(sc, t, intensity, totalDur, vol, comboShift) {
  const baseFreq = 220 * (1 + comboShift);
  const clangOvertones = [1, 2.76, 4.07, 5.4, 6.8]; // inharmonic = metallic
  const clangCount = 2 + intensity;
  for (let i = 0; i < clangCount; i++) {
    const freq = baseFreq * clangOvertones[i % clangOvertones.length];
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = freq * (0.98 + Math.random() * 0.04);
    const env = sc.ctx.createGain();
    const startVol = vol * (0.3 - i * 0.04);
    env.gain.setValueAtTime(Math.max(startVol, 0.02), t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + Math.random() * 0.1);
    osc.connect(env);
    env.connect(sc.gain);
    osc.start(t);
    osc.stop(t + 0.26);
  }

}

function _metalImpactRing(sc, t, intensity, totalDur, vol, comboShift) {
  const ringFreq = 440 * (1 + comboShift);
  const ring = sc.ctx.createOscillator();
  ring.type = 'sine';
  ring.frequency.value = ringFreq;
  const ringFilter = sc.ctx.createBiquadFilter();
  ringFilter.type = 'peaking';
  ringFilter.frequency.value = ringFreq;
  ringFilter.Q.value = 15;
  ringFilter.gain.value = 8;
  const ringEnv = sc.ctx.createGain();
  ringEnv.gain.setValueAtTime(vol * 0.35, t);
  ringEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + intensity * 0.15);
  ring.connect(ringFilter);
  ringFilter.connect(ringEnv);
  ringEnv.connect(sc.gain);
  ring.start(t);
  ring.stop(t + 0.7 + intensity * 0.15);

}

function _metalMetalScrape(sc, t, intensity, totalDur, vol, comboShift) {
  const scrapeDur = 0.15 + intensity * 0.06;
  const scrape = sc.ctx.createBufferSource();
  scrape.buffer = sc.createNoiseBuffer(scrapeDur);
  const scrapeF = sc.ctx.createBiquadFilter();
  scrapeF.type = 'bandpass';
  scrapeF.frequency.setValueAtTime(3500, t + 0.01);
  scrapeF.frequency.exponentialRampToValueAtTime(800, t + 0.01 + scrapeDur);
  scrapeF.Q.value = 5;
  const scrapeEnv = sc.ctx.createGain();
  scrapeEnv.gain.setValueAtTime(vol * 0.45, t + 0.01);
  scrapeEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.01 + scrapeDur);
  scrape.connect(scrapeF);
  scrapeF.connect(scrapeEnv);
  scrapeEnv.connect(sc.gain);
  scrape.start(t + 0.01);
  scrape.stop(t + 0.01 + scrapeDur + 0.01);

}

function _metalRattle(sc, t, intensity, totalDur, vol, comboShift) {
  const rattleCount = 6 + intensity * 4;
  for (let i = 0; i < rattleCount; i++) {
    const offset = 0.05 + Math.random() * totalDur * 0.8;
    const freq = 800 + Math.random() * 4000;
    const dur = 0.01 + Math.random() * 0.03;
    const loudness = (0.08 + Math.random() * 0.1) * Math.max(0.1, 1 - offset / totalDur);
    if (loudness <= 0.001) continue;
    const osc = sc.ctx.createOscillator();
    osc.type = 'square';
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

function _metalAnvilResonance(sc, t, intensity, totalDur, vol, comboShift) {
  const anvil = sc.ctx.createOscillator();
  anvil.type = 'sawtooth';
  anvil.frequency.value = 110 * (1 + comboShift);
  const anvilF = sc.ctx.createBiquadFilter();
  anvilF.type = 'lowpass';
  anvilF.frequency.value = 400;
  const anvilEnv = sc.ctx.createGain();
  anvilEnv.gain.setValueAtTime(vol * 0.2, t);
  anvilEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.4 + intensity * 0.1);
  anvil.connect(anvilF);
  anvilF.connect(anvilEnv);
  anvilEnv.connect(sc.gain);
  anvil.start(t);
  anvil.stop(t + 0.5 + intensity * 0.1);

}

function _metalReverbClang(sc, t, intensity, totalDur, vol, comboShift) {
  const revSrc = sc.ctx.createBufferSource();
  revSrc.buffer = sc.createNoiseBuffer(0.06);
  const revF = sc.ctx.createBiquadFilter();
  revF.type = 'bandpass';
  revF.frequency.value = 1500;
  revF.Q.value = 3;
  const revDelay = sc.ctx.createDelay();
  revDelay.delayTime.value = 0.04;
  const revFb = sc.ctx.createGain();
  revFb.gain.value = 0.35 + intensity * 0.05;
  const revEnv = sc.ctx.createGain();
  revEnv.gain.setValueAtTime(vol * 0.18, t + 0.02);
  revEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + intensity * 0.12);
  revSrc.connect(revF);
  revF.connect(revDelay);
  revDelay.connect(revFb);
  revFb.connect(revDelay);
  revDelay.connect(revEnv);
  revEnv.connect(sc.gain);
  revSrc.start(t + 0.02);
  revSrc.stop(t + 0.08);
}

