/**
 * Keyboard input handling with DAS/ARR for competitive-quality movement.
 *
 * DAS (Delayed Auto Shift): ms before auto-repeat begins when holding left/right
 * ARR (Auto Repeat Rate): ms between auto-repeat moves (0 = instant to wall)
 */

const KEY_MAP = Object.freeze({
  ArrowLeft:    'left',
  ArrowRight:   'right',
  ArrowDown:    'softDrop',
  ArrowUp:      'rotateCW',
  KeyX:         'rotateCW',
  KeyZ:         'rotateCCW',
  ControlLeft:  'rotateCCW',
  ControlRight: 'rotateCCW',
  Space:        'hardDrop',
  KeyC:         'hold',
  ShiftLeft:    'hold',
  ShiftRight:   'hold',
  KeyP:         'pause',
  KeyM:         'mute',
  KeyD:         'demo',
  Enter:        'start',
});

// Actions that should never auto-repeat from OS key repeat
const NO_REPEAT = new Set([
  'rotateCW', 'rotateCCW', 'hardDrop', 'hold', 'pause', 'mute', 'demo', 'start',
]);

class InputHandler {
  #callbacks = {};
  #keysDown = new Set();
  #boundKeyDown;
  #boundKeyUp;

  // DAS/ARR state
  #das = 133;         // ms before auto-repeat starts
  #arr = 10;          // ms between repeats (0 = instant)
  #heldDirection = null; // 'left' | 'right' | null
  #dasTimer = 0;
  #arrTimer = 0;
  #dasCharged = false;

  // Soft drop held state
  #softDropHeld = false;

  constructor() {
    this.#boundKeyDown = (e) => this.#onKeyDown(e);
    this.#boundKeyUp = (e) => this.#onKeyUp(e);
  }

  get das() { return this.#das; }
  get arr() { return this.#arr; }
  set das(v) { this.#das = Math.max(0, Math.min(300, v)); }
  set arr(v) { this.#arr = Math.max(0, Math.min(100, v)); }

  get softDropHeld() { return this.#softDropHeld; }

  attach() {
    document.addEventListener('keydown', this.#boundKeyDown);
    document.addEventListener('keyup', this.#boundKeyUp);
  }

  detach() {
    document.removeEventListener('keydown', this.#boundKeyDown);
    document.removeEventListener('keyup', this.#boundKeyUp);
  }

  on(action, callback) {
    this.#callbacks[action] = callback;
  }

  /**
   * Call every frame from the game loop with delta milliseconds.
   * Handles DAS/ARR auto-repeat for held left/right keys.
   * Returns true if any move was generated.
   */
  updateDAS(deltaMs) {
    if (!this.#heldDirection) return;

    this.#dasTimer += deltaMs;
    if (!this.#dasCharged) {
      if (this.#dasTimer >= this.#das) {
        this.#dasCharged = true;
        this.#arrTimer = 0;
        this.#callbacks[this.#heldDirection]?.();
      }
    } else {
      this.#arrTimer += deltaMs;
      if (this.#arr === 0) {
        // Instant: fire repeatedly until callback returns (move fails)
        for (let i = 0; i < 20; i++) {
          this.#callbacks[this.#heldDirection]?.();
        }
        this.#arrTimer = 0;
      } else {
        while (this.#arrTimer >= this.#arr) {
          this.#arrTimer -= this.#arr;
          this.#callbacks[this.#heldDirection]?.();
        }
      }
    }
  }

  #onKeyDown(e) {
    const action = KEY_MAP[e.code];
    if (!action) return;

    e.preventDefault();

    // Block OS key repeat for non-movement actions
    if (NO_REPEAT.has(action)) {
      if (this.#keysDown.has(e.code)) return;
    }

    this.#keysDown.add(e.code);

    // DAS handling for left/right — fire first move immediately, then DAS takes over
    if (action === 'left' || action === 'right') {
      if (this.#heldDirection !== action) {
        this.#heldDirection = action;
        this.#dasTimer = 0;
        this.#arrTimer = 0;
        this.#dasCharged = false;
        this.#callbacks[action]?.(); // Immediate first move
      }
      return;
    }

    // Track soft drop hold state
    if (action === 'softDrop') {
      this.#softDropHeld = true;
    }

    this.#callbacks[action]?.();
  }

  #onKeyUp(e) {
    this.#keysDown.delete(e.code);

    const action = KEY_MAP[e.code];
    if (action === 'left' || action === 'right') {
      if (this.#heldDirection === action) {
        this.#heldDirection = null;
        this.#dasTimer = 0;
        this.#arrTimer = 0;
        this.#dasCharged = false;
      }
    }
    if (action === 'softDrop') {
      this.#softDropHeld = false;
    }
  }
}

export { InputHandler };
