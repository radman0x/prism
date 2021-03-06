import { Coord, ValueMap } from './../utils';
import { Component } from "rad-ecs";

export class Renderable extends Component {

  constructor(
    public readonly image: string,
    public readonly zOrder: number,
    public readonly shrinkFactor?: number,
    public readonly smaller: boolean = false,
    public readonly subPos?: {x: number, y: number},
    public readonly rotation?: number
  ) {
    super();
  }
}

export class Position extends Component {

  private coord: Coord;

  constructor(
    x: number,
    y: number,
    z: number
  ) {
    super();
    this.coord = new Coord(x, y, z);
  }

  get x(): number { return this.coord.x; }
  get y(): number { return this.coord.y; }
  get z(): number { return this.coord.z; }

  subtract(rhs: Position): Position {
    let newCoord = rhs.coord.subtract(this.coord);
    return new Position(newCoord.x, newCoord.y, newCoord.z);
  }

  normalise(): void {
    this.coord.normalise();
  }

  add(rhs: Position): Position {
    let newCoord = rhs.coord.add(this.coord);
    return new Position(newCoord.x, newCoord.y, newCoord.z);
  }

  multiply(scale: number): Position {
    return Position.fromCoord(this.coord.multiply(scale));
  }

  hash(): string {
    return `${this.x},${this.y},${this.z}`;
  }

  asCoord(): Coord {
    return new Coord(this.x, this.y, this.z);
  }

  static fromCoord(c: Coord): Position {
    return new Position(c.x, c.y, c.z);
  }

  magnitude(): number {
    return this.coord.magnitude();
  }
}

export enum Size {
  SMALL,
  MEDIUM,
  LARGE,
  FILL
}

export enum Dynamism {
  STATIC,
  DYNAMIC
}

export class Physical extends Component {
  constructor(
    public readonly size: Size,
    public readonly dynamism: Dynamism
  ) {
    super();
  }
}

export class PhysicalMove extends Component {
  constructor(
    public readonly target: Position
  ) {
    super();
  }
}

export class Health extends Component {
  constructor(
    public readonly current: number,
    public readonly max: number
  ) {
    super();
  }
}

export enum KnownState {
  UNKNOWN,
  CURRENT,
  REMEMBERED
}

export class Knowledge extends Component {
  constructor(
    public readonly positions: ValueMap<Position, KnownState>
  ) {
    super();
  }
}

export class Sight extends Component {
  constructor(
    public readonly range: number
  ) {
    super();
  }
}

export class Velocity extends Component {
  constructor(
    public readonly direction: {x: number, y: number}
  ) {
    super();
  }
}

export class Aimed extends Component {
  constructor(
    public readonly target: Position
  ) {
    super();
  }
}

export class Combat extends Component {
  constructor(
    readonly skill: number,
    readonly damage: number,
    readonly armor: number,
  ) {
    super();
  }
}

export class Player extends Component {
  constructor() {
    super();
  }
}

export class DijkstraMap extends Component {
  constructor(
    public readonly locus?: Position,
    public readonly distanceMap?: ValueMap<Position, number>
  ) {
    super();
  }
}

export class IncrementTime extends Component {
  constructor(
    public readonly ticks: number
  ) {
    super();
  }
}

export class Clock extends Component {
  constructor(
    public readonly name: string,
    public readonly currentTick: number
  ) {
    super();
  }
}

export class AI extends Component {
  constructor(
    public readonly lastActionTick: number,
    public readonly actionCost: number
  ) {
    super();
  }
}

export class ParentLink extends Component {
  constructor(
    public readonly parentId: number
  ) {
    super();
  }
}

export class CompositeLink extends Component {
  public readonly childIds: number[]
  constructor(
    ...childIds_: number[]
  ) {
    super();
    this.childIds = childIds_;
  }
}

export class Conditional extends Component {
  constructor(
    public readonly condition: Condition
  ) {
    super();
  }
}

export class Condition {

}

export class Proximity extends Condition {
  constructor(
    public readonly range: number,
    public readonly specificEntity?: number
  ) {
    super();
  }
}

export class EndGame extends Component {
  constructor() {
    super();
  }
}

export class Spawner extends Component {
  constructor(
    public readonly spawnComponents: Component[],
    public readonly spawnRate: number,
    public readonly lastSpawnTick: number,
    public readonly spawnChance: number
  ) {
    super();
  }
}

export class Destructible extends Component {
  constructor() {
    super();
  }
}

export enum Lit {
  DARKNESS,
  VERY_DIM,
  DIM,
  MELLOW,
  LIGHT,
  VERY_LIGHT
}

export enum LightStrength {
  LOW = 2.5,
  HIGH = 5
}

export class LightSource extends Component {
  constructor(
    public readonly strength: LightStrength
  ) {
    super();
  }
}

export class LightLevel extends Component {
  constructor(
    public readonly level: [number, number, number]
  ) {
    super();
  }
}

export class MoveResult extends Component {
  constructor(
    public readonly source: Position,
    public readonly destination: Position
  ) {
    super();
  }
}

export class MoveAnimation extends Component {
  constructor(
    public readonly start: Position,
    public readonly end: Position,
    public readonly durationMs: number,
    public readonly image: string,
    public readonly hideExisting: boolean = true
  ) {
    super();
  }
}