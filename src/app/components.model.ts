import { Coord, ValueMap } from './../utils';
import { Component } from "rad-ecs";

export class Renderable extends Component {

  constructor(
    public readonly image: string,
    public readonly zOrder: number
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

  add(rhs: Position): Position {
    let newCoord = rhs.coord.add(this.coord);
    return new Position(newCoord.x, newCoord.y, newCoord.z);
  }

  hash(): string {
    return `${this.x},${this.y},${this.z}`;
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

export enum KnownState   {
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

export class ClearRender extends Component {
  constructor(
    public readonly clearId
  ) {
    super();
  }


}