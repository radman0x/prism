import { EntityManager, Entity } from 'rad-ecs';
import { Position, Physical, PhysicalMove, Renderable, ClearRender, Knowledge, KnownState, Size } from 'src/app/components.model';
import { DIR_VECTORS, DIR_FROM_KEY } from './../../../utils';
import { EcsService } from 'src/ecs.service';

import * as clone from 'clone';
import { bresenham, BresPos } from 'src/bresenham';
const deepEqual = require('deep-equal');

export interface InputHandler {
  handleKey: (e: KeyboardEvent) => void
}

export class PlayerControl implements InputHandler {
  constructor(
    private playerId: number,
    private ecs: EcsService,
    private changeState: (s: InputHandler) => void
  ) {}

  handleKey(e: KeyboardEvent): void {
    if ( e.key === '5') {
        console.log(`Player resting...`);
        this.ecs.update(); // hack for testing
        return;
    }

    if ( DIR_FROM_KEY.has(e.key) ) {
      let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(e.key));
      let playerPos = this.ecs.em.get(this.playerId).component(Position);
      this.ecs.em.setComponent(this.playerId, 
        new PhysicalMove(
          new Position(playerPos.x + moveDir[0], playerPos.y + moveDir[1], playerPos.z)
        )
      );

      // this.ecs.em.setComponent(this.playerId, new IncrementTime(100));
      this.ecs.update(); // for player
      // this.ecs.update(); // for AI
    } 
  }
}

export class ChooseTarget implements InputHandler {
  private displayId: number;
  private pathHighlight: number[] = [];

  constructor(
    private currentTarget: Position,
    private playerId: number,
    private callback: (origin: Position, target: Position, dir: Position) => void,
    private ecs: EcsService,
    private changeState: (s: InputHandler) => void
  ) {
    this.updateDisplay();

  }

  handleKey(e: KeyboardEvent): void {
    if (e.key === 'Escape' || e.key === 'Delete') {
      this.cleanup();
      this.leave();
      return;
    }
    if (e.key === 'Enter') {
      this.cleanup();
      if (this.posTargetable(this.currentTarget)) {
        const playerPos = this.ecs.em.get(this.playerId).component(Position);
        this.callback(
          playerPos,
          this.currentTarget, 
          this.makeUnitVector(this.currentTarget, playerPos)
        );
      }
      this.leave();
      return;
    }
    if ( DIR_FROM_KEY.has(e.key) ) {
      let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(e.key));
      this.currentTarget = this.currentTarget.add(new Position(moveDir[0], moveDir[1], 0));
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
      this.ecs.em.createEntity(
        new ClearRender(id)
      )
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
    this.changeState(new PlayerControl(this.playerId, this.ecs, this.changeState));
  }

  private updateDisplay(): void {

    this.cleanup();

    let targetable = this.posTargetable(this.currentTarget) 
    let displayImage = targetable ? '0005_select_ring.png'  : '0006_invalid_select_ring.png';
    this.displayId = this.ecs.em.createEntity(
      new Renderable(displayImage, 100),
      clone(this.currentTarget)
    ).id();

    const playerPos = this.ecs.em.get(this.playerId).component(Position);
    bresenham(
      playerPos.x, playerPos.y,
      this.currentTarget.x, this.currentTarget.y,
      (x: number, y: number) => {
        const targetPos = new Position(x, y, 0);
        if ( deepEqual(playerPos, targetPos) ) {
          return;
        }
        const image = targetable ? '0007_spot_highlight.png' : '0008_spot_invalid.png';
        const id = this.ecs.em.createEntity(
          new Renderable(image, 100),
          targetPos
        ).id();
        this.pathHighlight.push(id);
      }
    );

  }

  private posVisible(pos: Position): boolean {
    const player = this.ecs.em.get(this.playerId);
    return player.has(Knowledge) 
      && player.component(Knowledge).positions.get(pos) 
      === KnownState.CURRENT;
  }
  private posTargetable(pos: Position): boolean {
    const player = this.ecs.em.get(this.playerId);
    const playerPos = player.component(Position);
    if (this.posVisible) {
      const sightLine = bresenham(
        playerPos.x, playerPos.y,
        pos.x, pos.y
      );
      const blockedPositions = sightLine.filter( ({x, y}: BresPos, i: number) => {
        return this.fillAtPos(new Position(x, y, 0), this.ecs.em) && i !== sightLine.length -1; 
      });
      return blockedPositions.length === 0;
    } else {
      return false;
    }

  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size === Size.FILL)
      .length !== 0;
  }
}