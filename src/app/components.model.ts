import { Coord } from './../utils';
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

  multiply(factor: number): Position {
    return new Position(this.x * factor, this.y * factor, this.z * factor);
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

export class Physical extends Component {
  constructor(
    public readonly size: Size
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
