/**
 * Tetromino definitions with SRS rotation states and wall kick data.
 */

const COLS = 10;

// Rotation states for each piece (4 rotations each)
// 0=spawn, 1=CW, 2=180°, 3=CCW
const PIECE_DATA = Object.freeze({
  I: {
    color: '#00f0f0',
    shapes: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ],
  },
  O: {
    color: '#f0f000',
    shapes: [
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
      [[1,1],[1,1]],
    ],
  },
  T: {
    color: '#a000f0',
    shapes: [
      [[0,1,0],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,1],[0,1,0]],
      [[0,1,0],[1,1,0],[0,1,0]],
    ],
  },
  S: {
    color: '#00f000',
    shapes: [
      [[0,1,1],[1,1,0],[0,0,0]],
      [[0,1,0],[0,1,1],[0,0,1]],
      [[0,0,0],[0,1,1],[1,1,0]],
      [[1,0,0],[1,1,0],[0,1,0]],
    ],
  },
  Z: {
    color: '#f00000',
    shapes: [
      [[1,1,0],[0,1,1],[0,0,0]],
      [[0,0,1],[0,1,1],[0,1,0]],
      [[0,0,0],[1,1,0],[0,1,1]],
      [[0,1,0],[1,1,0],[1,0,0]],
    ],
  },
  J: {
    color: '#0000f0',
    shapes: [
      [[1,0,0],[1,1,1],[0,0,0]],
      [[0,1,1],[0,1,0],[0,1,0]],
      [[0,0,0],[1,1,1],[0,0,1]],
      [[0,1,0],[0,1,0],[1,1,0]],
    ],
  },
  L: {
    color: '#f0a000',
    shapes: [
      [[0,0,1],[1,1,1],[0,0,0]],
      [[0,1,0],[0,1,0],[0,1,1]],
      [[0,0,0],[1,1,1],[1,0,0]],
      [[1,1,0],[0,1,0],[0,1,0]],
    ],
  },
});

// SRS Wall kick offsets: [dx, dy] for each test
// Positive dy means move up on screen (subtract from y)
const WALL_KICKS = Object.freeze({
  standard: {
    '0->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '1->0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '1->2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '2->1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '2->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '3->2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '3->0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '0->3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  },
  I: {
    '0->1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '1->0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '1->2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    '2->1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '2->3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '3->2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '3->0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '0->3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  },
});

const PIECE_TYPES = Object.freeze(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);

class Piece {
  #type;
  #rotation;
  #x;
  #y;

  constructor(type) {
    this.#type = type;
    this.#rotation = 0;
    const shape = PIECE_DATA[type].shapes[0];
    this.#x = Math.floor((COLS - shape[0].length) / 2);
    this.#y = type === 'I' ? -1 : 0;
  }

  get type() { return this.#type; }
  get rotation() { return this.#rotation; }
  get x() { return this.#x; }
  get y() { return this.#y; }
  get color() { return PIECE_DATA[this.#type].color; }
  get shape() { return PIECE_DATA[this.#type].shapes[this.#rotation]; }

  set x(val) { this.#x = val; }
  set y(val) { this.#y = val; }
  set rotation(val) { this.#rotation = val; }

  getShape(rotation) {
    return PIECE_DATA[this.#type].shapes[rotation];
  }

  getWallKicks(fromRotation, toRotation) {
    if (this.#type === 'O') return [[0, 0]];
    const table = this.#type === 'I' ? WALL_KICKS.I : WALL_KICKS.standard;
    const key = `${fromRotation}->${toRotation}`;
    return table[key];
  }

  clone() {
    const p = new Piece(this.#type);
    p.#rotation = this.#rotation;
    p.#x = this.#x;
    p.#y = this.#y;
    return p;
  }
}

class BagRandomizer {
  #bag = [];

  next() {
    if (this.#bag.length === 0) {
      this.#bag = [...PIECE_TYPES];
      for (let i = this.#bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.#bag[i], this.#bag[j]] = [this.#bag[j], this.#bag[i]];
      }
    }
    return this.#bag.pop();
  }
}

function getColorForType(type) {
  return PIECE_DATA[type]?.color ?? '#888';
}

function getShapeForType(type, rotation = 0) {
  return PIECE_DATA[type]?.shapes[rotation];
}

export { Piece, BagRandomizer, getColorForType, getShapeForType };
