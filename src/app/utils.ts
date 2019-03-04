

export class Dimensions {
  constructor(
    public width: number,
    public height: number
  ) { }

  toString(): string {
    return `{${this.width}, ${this.height}}`
  }
}

export function randomInt(min: number, max: number): number | never {
  if ( min >= max ) {
    throw Error(`Random range, min: ${min} -> ${max}, is invalid`);
  }
  min = Math.floor(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min)) + min;
}

export enum MoveDirection {
  NORTH,
  SOUTH,
  EAST,
  WEST,
  NORTH_EAST,
  NORTH_WEST,
  SOUTH_EAST,
  SOUTH_WEST
}

export const DIR_VECTORS = new Map<MoveDirection, [number, number]>([
  [MoveDirection.NORTH, [0, -1]],
  [MoveDirection.SOUTH, [0,  1]],
  [MoveDirection.EAST,  [ 1, 0]],
  [MoveDirection.WEST,  [-1, 0]],
  [MoveDirection.NORTH_EAST, [ 1, -1]],
  [MoveDirection.NORTH_WEST, [-1, -1]],
  [MoveDirection.SOUTH_EAST, [ 1,  1]],
  [MoveDirection.SOUTH_WEST, [-1,  1]]
]);

export const DIR_FROM_KEY = new Map<string, MoveDirection>([
  ['1', MoveDirection.SOUTH_WEST],
  ['2', MoveDirection.SOUTH],
  ['3', MoveDirection.SOUTH_EAST],
  ['4', MoveDirection.WEST],
  ['6', MoveDirection.EAST],
  ['7', MoveDirection.NORTH_WEST],
  ['8', MoveDirection.NORTH],
  ['9', MoveDirection.NORTH_EAST],
]);

export interface Hashable {
  hash: () => string;
}

export class ValueMap<K extends Hashable, V> {
  private index = new Map<string, {k: K, v: V}>();

  constructor() {}

  *[Symbol.iterator](){
    for (let [, entry] of this.index) {
      yield <[K, V]> [entry.k, entry.v];
    }
  }

  set(key: K, value: V) {
    this.index.set(key.hash(), {k: key, v: value});
  }

  get (key: K) {
    let entry = this.index.get(key.hash());
    return entry ? entry.v : undefined;
  }
}

export class Coord {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) {}

  toString(): string {
    return `{${this.x}, ${this.y}, ${this.z}}`;
  }

  hash(): string {
    return `${this.x},${this.y},${this.z}`
  }

  subtract(rhs: Coord): Coord {
    return new Coord(this.x - rhs.x, this.y - rhs.y, this.z - rhs.z);
  }

  static fromString(input: string): Coord | never {
    const re = /^{(\d+(.\d+)?), (\d+(.\d+)?), (\d+(.\d+)?)}$/;
    const result = re.exec(input);
    if ( result === null ) {
      throw Error(`Failed to serialise Coord from input string: ${input}`);
    } else {
      console.log(`Show: ${+result[1]}`);
      return new Coord(+result[1], +result[3], +result[5]);
    }
  }
  
}

export function xyPositionsAround(pos: Coord): Coord[] {
  let around: Coord[] = [];
  for (let x = -1; x <= 1; ++x) {
    for (let y = -1; y <= 1; ++y) {
      if ( x === 0 && y === 0 ) {
        continue;
      } else {
        around.push( new Coord(pos.x + x, pos.y + y, pos.z) );
      }
    }
  }
  return around;
}

export function xyWithinBounds(
  bottomLeft: Coord,
  dimensions: Dimensions,
  ...candidates: Coord[]): boolean {
    
    const inside = candidates
      .filter((c: Coord) => {
        const minX = Math.min(bottomLeft.x, bottomLeft.x + dimensions.width);
        const maxX = Math.max(bottomLeft.x, bottomLeft.x + dimensions.width);
        const minY = Math.min(bottomLeft.y, bottomLeft.y + dimensions.height);
        const maxY = Math.max(bottomLeft.y, bottomLeft.y + dimensions.height);
        return c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
      });

    return inside.length === candidates.length;
}