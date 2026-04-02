/**
 * Auto-cycles through game settings during demo mode.
 * Highlights the control being changed, applies the setting, game keeps playing.
 */

const STEP_INTERVAL = 6000;      // ms between setting changes
const HIGHLIGHT_DURATION = 2500; // ms the control stays highlighted after change

/** Maps setting type → demo panel element IDs to highlight. */
const HIGHLIGHT_IDS = {
  theme:  ['demo-theme'],
  volume: ['demo-volume'],
  speed:  ['demo-speed'],
  mute:   ['demo-mute-btn'],
  unmute: ['demo-mute-btn'],
};

const DEMO_SEQUENCE = [
  { type: 'theme', value: 'concrete', label: '🧱 Concrete Break' },
  { type: 'volume', value: 40, label: '🔊 Volume: 40%' },
  { type: 'theme', value: 'crystal', label: '💎 Crystal Chime' },
  { type: 'speed', value: '3', label: '⚡ Speed: 4×' },
  { type: 'theme', value: 'metal', label: '⚙️ Metal Clang' },
  { type: 'mute', label: '🔇 Sound: Muted' },
  { type: 'theme', value: 'ice', label: '❄️ Ice Crack' },
  { type: 'unmute', label: '🔊 Sound: On' },
  { type: 'volume', value: 90, label: '🔊 Volume: 90%' },
  { type: 'theme', value: 'wood', label: '🪵 Wood Snap' },
  { type: 'speed', value: '0', label: '⚡ Speed: 0.5×' },
  { type: 'theme', value: 'plastic', label: '🧩 Plastic Pop' },
  { type: 'volume', value: 60, label: '🔊 Volume: 60%' },
  { type: 'theme', value: 'gold', label: '🥇 Gold Ring' },
  { type: 'speed', value: '1', label: '⚡ Speed: 1×' },
  { type: 'theme', value: 'silver', label: '🥈 Silver Chime' },
  { type: 'volume', value: 70, label: '🔊 Volume: 70%' },
  { type: 'speed', value: '2', label: '⚡ Speed: 2×' },
  { type: 'theme', value: 'glass', label: '🔮 Glass Shatter' },
];

export class DemoCycler {
  #stepTimer = null;
  #highlightTimer = null;
  #stepIndex = 0;
  #callbacks;
  #running = false;

  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onThemeChange
   * @param {Function} callbacks.onVolumeChange
   * @param {Function} callbacks.onSpeedChange
   * @param {Function} callbacks.onMute
   * @param {Function} callbacks.onUnmute
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
    this.#stepTimer = setTimeout(() => this.#tick(), STEP_INTERVAL);
  }

  stop() {
    this.#running = false;
    if (this.#stepTimer) {
      clearTimeout(this.#stepTimer);
      this.#stepTimer = null;
    }
    if (this.#highlightTimer) {
      clearTimeout(this.#highlightTimer);
      this.#highlightTimer = null;
    }
    this.#stepIndex = 0;
    this.#clearAllHighlights();
    this.#removeIndicator();
  }

  get active() {
    return this.#running;
  }

  /** Apply the setting, highlight the control, schedule next step. */
  #tick() {
    if (!this.#running) return;
    const step = DEMO_SEQUENCE[this.#stepIndex];

    // Highlight, apply, show indicator — all at once, no pause
    this.#highlightControls(step.type);
    this.#callbacks.onHighlight(step.type);
    this.#bringDemoPanelForward();
    this.#showIndicator(step.label);
    this.#applyStep(step);

    // Clear highlights after duration
    this.#highlightTimer = setTimeout(() => {
      this.#clearAllHighlights();
    }, HIGHLIGHT_DURATION);

    this.#stepIndex = (this.#stepIndex + 1) % DEMO_SEQUENCE.length;
    this.#stepTimer = setTimeout(() => this.#tick(), STEP_INTERVAL);
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

  /** Make demo panel fully opaque during highlight. */
  #bringDemoPanelForward() {
    document.getElementById('demo-controls')?.classList.add('demo-highlight-active');
  }

  #restoreDemoPanelOpacity() {
    document.getElementById('demo-controls')?.classList.remove('demo-highlight-active');
  }

  /** Show a floating indicator with the setting name. */
  #showIndicator(text) {
    let el = document.getElementById('demo-setting-indicator');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-setting-indicator';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  #removeIndicator() {
    document.getElementById('demo-setting-indicator')?.remove();
  }
}
