import { PixiRendererService } from "./pixi-renderer.service";
import { MoveAnimation } from "./../../components.model";
import { EntityManager, Entity } from "rad-ecs";
import {
  Position,
  Physical,
  PhysicalMove,
  Renderable,
  Knowledge,
  KnownState,
  Size,
  IncrementTime
} from "src/app/components.model";
import { DIR_VECTORS, DIR_FROM_KEY } from "./../../../utils";
import { EcsService } from "src/ecs.service";

import * as clone from "clone";
import { bresenham, BresPos } from "src/bresenham";
import * as deepEqual from "fast-deep-equal";

export interface InputHandler {
  handleKey: (key: string) => boolean;
}

export class PlayerControl implements InputHandler {
  constructor(
    private playerId: number,
    private ecs: EcsService,
    private renderService: PixiRendererService,
    private changeState: (s: InputHandler) => void
  ) {}

  handleKey(key: string): boolean {
    if (key === "5" || key === ".") {
      this.ecs.em.setComponent(this.playerId, new IncrementTime(100));
      // this.ecs.update(); // hack for testing
      this.ecs.update(true);
      return false;
    }

    if (DIR_FROM_KEY.has(key)) {
      let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(key));
      let playerPos = this.ecs.em.get(this.playerId).component(Position);
      this.ecs.em.setComponent(
        this.playerId,
        new PhysicalMove(
          new Position(
            playerPos.x + moveDir[0],
            playerPos.y + moveDir[1],
            playerPos.z
          )
        )
      );

      this.ecs.em.each((e: Entity, ma: MoveAnimation) => {
        this.ecs.em.removeComponent(e.id, MoveAnimation);
      }, MoveAnimation);

      this.renderService.updateViewState(true);

      this.ecs.em.setComponent(this.playerId, new IncrementTime(100));
      this.ecs.update(); // for player
      this.ecs.update(true); // for AI
    }
    return false;
  }
}

export class ChooseTarget implements InputHandler {
  private displayId: number;
  private pathHighlight: number[] = [];
  private startPoint: Position;

  constructor(
    private currentTarget: Position,
    private playerId: number,
    private callback: (
      origin: Position,
      target: Position,
      dir: Position
    ) => void,
    private ecs: EcsService,
    private renderService: PixiRendererService,
    private changeState: (s: InputHandler) => void
  ) {
    this.updateDisplay();
    this.startPoint = currentTarget;
  }

  handleKey(key: string): boolean {
    if (key === "/") {
      console.log(`should consume`);
      return true; // ignore
    }
    if (key === "Escape" || key === "Delete") {
      this.cleanup();
      this.leave();
      return false;
    }
    if (key === "Enter") {
      this.cleanup();
      if (
        !deepEqual(this.currentTarget, this.startPoint) &&
        this.posTargetable(this.currentTarget)
      ) {
        const playerPos = this.ecs.em.get(this.playerId).component(Position);
        this.callback(
          playerPos,
          this.currentTarget,
          this.makeUnitVector(this.currentTarget, playerPos)
        );
      }
      this.leave();
      return false;
    }
    if (DIR_FROM_KEY.has(key)) {
      let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(key));
      this.currentTarget = this.currentTarget.add(
        new Position(moveDir[0], moveDir[1], 0)
      );
      this.updateDisplay();
    }
  }

  private makeUnitVector(pos0: Position, pos1: Position): Position {
    const direction = pos1.subtract(pos0);
    direction.normalise();
    return direction;
  }

  private cleanup(): void {
    const removeClear = (id: number) => {
      this.ecs.em.removeEntity(id);
    };
    if (this.displayId) {
      removeClear(this.displayId);
    }
    for (const highlightId of this.pathHighlight) {
      removeClear(highlightId);
    }
    this.pathHighlight = [];
  }

  private leave(): void {
    this.changeState(
      new PlayerControl(
        this.playerId,
        this.ecs,
        this.renderService,
        this.changeState
      )
    );
  }

  private updateDisplay(): void {
    this.cleanup();

    let targetable = this.posTargetable(this.currentTarget);
    let displayImage = targetable
      ? "0005_select_ring.png"
      : "0006_invalid_select_ring.png";
    this.displayId = this.ecs.em.createEntity(
      new Renderable(displayImage, 100),
      clone(this.currentTarget)
    ).id;

    const playerPos = this.ecs.em.get(this.playerId).component(Position);
    bresenham(
      playerPos.x,
      playerPos.y,
      this.currentTarget.x,
      this.currentTarget.y,
      (x: number, y: number) => {
        const targetPos = new Position(x, y, 0);
        if (deepEqual(playerPos, targetPos)) {
          return;
        }
        const image = targetable
          ? "0007_spot_highlight.png"
          : "0008_spot_invalid.png";
        const id = this.ecs.em.createEntity(
          new Renderable(image, 100),
          targetPos
        ).id;
        this.pathHighlight.push(id);
      }
    );

    this.ecs.viewStateDirty = true;
  }

  private posVisible(pos: Position): boolean {
    const player = this.ecs.em.get(this.playerId);
    return (
      player.has(Knowledge) &&
      player.component(Knowledge).positions.get(pos) === KnownState.CURRENT
    );
  }
  private posTargetable(pos: Position): boolean {
    const player = this.ecs.em.get(this.playerId);
    const playerPos = player.component(Position);
    if (this.posVisible) {
      const sightLine = bresenham(playerPos.x, playerPos.y, pos.x, pos.y);
      const blockedPositions = sightLine.filter(
        ({ x, y }: BresPos, i: number) => {
          return (
            this.fillAtPos(new Position(x, y, 0), this.ecs.em) &&
            i !== sightLine.length - 1
          );
        }
      );
      return blockedPositions.length === 0;
    } else {
      return false;
    }
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return (
      em
        .matchingIndex(pos)
        .filter(
          (fe: Entity) =>
            fe.has(Physical) && fe.component(Physical).size === Size.FILL
        ).length !== 0
    );
  }
}
