/**
 * Auto-cycles through game settings during demo mode.
 * Shows floating indicators for each setting change.
 */

const STEP_INTERVAL = 3500;

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
  #timer = null;
  #stepIndex = 0;
  #callbacks;

  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onThemeChange
   * @param {Function} callbacks.onVolumeChange
   * @param {Function} callbacks.onSpeedChange
   * @param {Function} callbacks.onMute
   * @param {Function} callbacks.onUnmute
   */
  constructor(callbacks) {
    this.#callbacks = callbacks;
  }

  start() {
    this.stop();
    this.#stepIndex = 0;
    this.#timer = setInterval(() => this.#nextStep(), STEP_INTERVAL);
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#stepIndex = 0;
    this.#removeIndicator();
  }

  get active() {
    return this.#timer !== null;
  }

  #nextStep() {
    const step = DEMO_SEQUENCE[this.#stepIndex];
    this.#applyStep(step);
    this.#stepIndex = (this.#stepIndex + 1) % DEMO_SEQUENCE.length;
  }

  #applyStep(step) {
    this.#showIndicator(step.label);
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
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('show');
  }

  #removeIndicator() {
    document.getElementById('demo-setting-indicator')?.remove();
  }
}
