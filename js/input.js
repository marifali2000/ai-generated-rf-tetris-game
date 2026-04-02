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

  // Touch state
  #touchRepeatInterval = null;

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
    this.#attachTouchControls();
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

  #attachTouchControls() {
    // Use the game canvas as the gesture target — it fills the screen on mobile
    const gestureTarget = document.getElementById('game-canvas');
    if (!gestureTarget) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let hasMoved = false;
    let moveCount = 0;
    const MOVE_THRESHOLD = 25;  // px per column-move
    const TAP_THRESHOLD = 12;
    const SWIPE_DOWN_THRESHOLD = 40;

    gestureTarget.addEventListener('touchstart', (e) => {
      e.preventDefault();

      // Two-finger tap = hold
      if (e.touches.length >= 2) {
        this.#callbacks['hold']?.();
        return;
      }

      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
      hasMoved = false;
      moveCount = 0;
    }, { passive: false });

    gestureTarget.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length !== 1) return;

      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // Horizontal drag — move piece per threshold crossed
      if (Math.abs(dx) >= MOVE_THRESHOLD) {
        const moves = Math.floor(Math.abs(dx) / MOVE_THRESHOLD);
        const dir = dx > 0 ? 'right' : 'left';
        for (let i = 0; i < moves; i++) {
          this.#callbacks[dir]?.();
        }
        startX += (dx > 0 ? 1 : -1) * moves * MOVE_THRESHOLD;
        hasMoved = true;
        moveCount += moves;
      }

      // Downward swipe — hard drop (only if not already moving horizontally)
      if (dy > SWIPE_DOWN_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.5 && moveCount === 0) {
        hasMoved = true;
        this.#callbacks['hardDrop']?.();
        // Reset to prevent re-triggering
        startY = t.clientY;
      }
    }, { passive: false });

    gestureTarget.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (hasMoved) return;

      const elapsed = Date.now() - startTime;
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      // Quick tap = rotate
      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD && elapsed < 300) {
        this.#callbacks['rotateCW']?.();
      }
    }, { passive: false });

    // ── Tap overlay to start ──
    const overlay = document.getElementById('overlay');
    overlay?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.#callbacks['start']?.();
    }, { passive: false });
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
