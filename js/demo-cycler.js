/**
 * Auto-cycles through game settings during demo mode.
 * Freeze → show old→new for 2s → apply setting → unfreeze → play → repeat.
 */

const PLAY_DURATION = 6000;      // ms to play after applying a setting
const FREEZE_DURATION = 2000;    // ms to freeze & highlight before applying
const SETTLE_DURATION = 1000;    // ms to show applied setting before resuming

/** Maps setting type → demo panel element IDs to highlight. */
const HIGHLIGHT_IDS = {
  theme:  ['demo-theme'],
  volume: ['demo-volume'],
  speed:  ['demo-speed'],
  mute:   ['demo-mute-btn'],
  unmute: ['demo-mute-btn'],
};

/** Maps theme value → display label for old→new indicator. */
const THEME_LABELS = {
  glass: '🔮 Glass Shatter',
  concrete: '🧱 Concrete Break',
  crystal: '💎 Crystal Chime',
  metal: '⚙️ Metal Clang',
  ice: '❄️ Ice Crack',
  wood: '🪵 Wood Snap',
  plastic: '🧩 Plastic Pop',
  gold: '🥇 Gold Ring',
  silver: '🥈 Silver Chime',
};

/** Maps speed index → display label. */
const SPEED_INDEX_LABELS = { '0': '0.5×', '1': '1×', '2': '2×', '3': '4×' };

const DEMO_SEQUENCE = [
  { type: 'theme', value: 'concrete', label: '🧱 Concrete Break' },
  { type: 'volume', value: 40, label: '🔊 Volume: 40%' },
  { type: 'theme', value: 'crystal', label: '💎 Crystal Chime' },
  { type: 'speed', value: '1', label: '⚡ Speed: 1×' },
  { type: 'theme', value: 'metal', label: '⚙️ Metal Clang' },
  { type: 'mute', label: '🔇 Sound: Muted' },
  { type: 'theme', value: 'ice', label: '❄️ Ice Crack' },
  { type: 'unmute', label: '🔊 Sound: On' },
  { type: 'volume', value: 90, label: '🔊 Volume: 90%' },
  { type: 'theme', value: 'wood', label: '🪵 Wood Snap' },
  { type: 'speed', value: '2', label: '⚡ Speed: 2×' },
  { type: 'theme', value: 'plastic', label: '🧩 Plastic Pop' },
  { type: 'volume', value: 60, label: '🔊 Volume: 60%' },
  { type: 'theme', value: 'gold', label: '🥇 Gold Ring' },
  { type: 'speed', value: '3', label: '⚡ Speed: 4×' },
  { type: 'theme', value: 'silver', label: '🥈 Silver Chime' },
  { type: 'volume', value: 70, label: '🔊 Volume: 70%' },
  { type: 'speed', value: '1', label: '⚡ Speed: 1×' },
  { type: 'theme', value: 'glass', label: '🔮 Glass Shatter' },
];

export class DemoCycler {
  #timer = null;
  #stepIndex = 0;
  #callbacks;
  #running = false;
  #phase = 'idle'; // idle | freeze | play

  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onThemeChange
   * @param {Function} callbacks.onVolumeChange
   * @param {Function} callbacks.onSpeedChange
   * @param {Function} callbacks.onMute
   * @param {Function} callbacks.onUnmute
   * @param {Function} callbacks.onFreeze  — freeze game (blocks stop falling)
   * @param {Function} callbacks.onUnfreeze — unfreeze game (blocks resume)
   * @param {Function} callbacks.onHighlight — highlight controls for a type
   * @param {Function} callbacks.onClearHighlight — remove highlights
   */
  constructor(callbacks) {
    this.#callbacks = callbacks;
  }

  start() {
    this.stop();
    this.#stepIndex = 0;
    this.#running = true;
    this.#phase = 'play';
    // Let the game play before the first setting change
    this.#timer = setTimeout(() => this.#beginFreeze(), PLAY_DURATION);
  }

  stop() {
    this.#running = false;
    this.#phase = 'idle';
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
    this.#clearAllHighlights();
    this.#removeIndicator();
    this.#callbacks.onUnfreeze();
  }

  get active() {
    return this.#running;
  }

  /** Phase 1: freeze blocks, highlight the control, show old→new indicator. */
  #beginFreeze() {
    if (!this.#running) return;
    const step = DEMO_SEQUENCE[this.#stepIndex];
    this.#phase = 'freeze';
    this.#callbacks.onFreeze();
    this.#highlightControls(step.type);
    this.#callbacks.onHighlight(step.type);
    this.#bringDemoPanelForward();
    const oldLabel = this.#getCurrentLabel(step.type);
    this.#showTransitionIndicator(oldLabel, step.label);
    this.#timer = setTimeout(() => this.#applyAndSettle(), FREEZE_DURATION);
  }

  /** Phase 2: apply setting, stay frozen so user sees the new value. */
  #applyAndSettle() {
    if (!this.#running) return;
    const step = DEMO_SEQUENCE[this.#stepIndex];
    this.#applyStep(step);
    this.#showAppliedIndicator(step.label);
    this.#timer = setTimeout(() => this.#resume(), SETTLE_DURATION);
  }

  /** Phase 3: unfreeze, clear highlights, play for a while. */
  #resume() {
    if (!this.#running) return;
    this.#phase = 'play';
    this.#clearAllHighlights();
    this.#callbacks.onUnfreeze();
    this.#stepIndex = (this.#stepIndex + 1) % DEMO_SEQUENCE.length;
    this.#timer = setTimeout(() => this.#beginFreeze(), PLAY_DURATION);
  }

  #applyStep(step) {
    switch (step.type) {
      case 'theme':
        this.#callbacks.onThemeChange(step.value);
        break;
      case 'volume':
        this.#callbacks.onVolumeChange(step.value);
        break;
      case 'speed':
        this.#callbacks.onSpeedChange(step.value);
        break;
      case 'mute':
        this.#callbacks.onMute();
        break;
      case 'unmute':
        this.#callbacks.onUnmute();
        break;
    }
  }

  /** Highlight the relevant control row in the demo panel. */
  #highlightControls(type) {
    this.#clearMobileHighlights();
    const ids = HIGHLIGHT_IDS[type] || [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const row = el.closest('.demo-row');
      if (row) row.classList.add('demo-row-highlight');
      el.classList.add('demo-control-highlight');
    }
  }

  #clearMobileHighlights() {
    for (const el of document.querySelectorAll('.demo-row-highlight')) {
      el.classList.remove('demo-row-highlight');
    }
    for (const el of document.querySelectorAll('.demo-control-highlight')) {
      el.classList.remove('demo-control-highlight');
    }
  }

  #clearAllHighlights() {
    this.#clearMobileHighlights();
    this.#callbacks.onClearHighlight();
    this.#restoreDemoPanelOpacity();
  }

  /** Make demo panel fully opaque during freeze. */
  #bringDemoPanelForward() {
    document.getElementById('demo-controls')?.classList.add('demo-highlight-active');
  }

  #restoreDemoPanelOpacity() {
    document.getElementById('demo-controls')?.classList.remove('demo-highlight-active');
  }

  /** Get a human-readable label for the current value of a setting type. */
  #getCurrentLabel(type) {
    switch (type) {
      case 'theme': {
        const val = document.getElementById('demo-theme')?.value || 'glass';
        return THEME_LABELS[val] || val;
      }
      case 'volume': {
        const val = document.getElementById('demo-volume')?.value || '70';
        return `🔊 Volume: ${val}%`;
      }
      case 'speed': {
        const val = document.getElementById('demo-speed')?.value || '2';
        return `⚡ Speed: ${SPEED_INDEX_LABELS[val] || val}`;
      }
      case 'mute':
        return '🔊 Sound: On';
      case 'unmute':
        return '🔇 Sound: Muted';
      default:
        return '';
    }
  }

  /** Show indicator with just the applied (new) setting. */
  #showAppliedIndicator(label) {
    let el = document.getElementById('demo-setting-indicator');
    if (!el) return;
    el.innerHTML = `<span class="demo-new demo-applied">✓ ${label}</span>`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  /** Show a floating indicator with old → new transition. */
  #showTransitionIndicator(oldLabel, newLabel) {
    let el = document.getElementById('demo-setting-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-setting-indicator';
      document.body.appendChild(el);
    }
    el.innerHTML = `<span class="demo-old">${oldLabel}</span>`
      + `<span class="demo-arrow">→</span>`
      + `<span class="demo-new">${newLabel}</span>`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  #removeIndicator() {
    document.getElementById('demo-setting-indicator')?.remove();
  }
}
