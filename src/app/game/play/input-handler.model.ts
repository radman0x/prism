import { Position, PhysicalMove, Renderable, ClearRender, Knowledge, KnownState } from 'src/app/components.model';
import { DIR_VECTORS, DIR_FROM_KEY } from './../../../utils';
import { EcsService } from 'src/ecs.service';

import * as clone from 'clone';

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

  constructor(
    private currentTarget: Position,
    private playerId: number,
    private callback: () => void,
    private ecs: EcsService,
    private changeState: (s: InputHandler) => void
  ) {
    this.updateDisplay();

  }

  handleKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.cleanup();
      this.leave();
      return;
    }
    if (e.key === 'Enter') {
      this.cleanup();
      this.callback();
      this.leave();
      return;
    }
    if ( DIR_FROM_KEY.has(e.key) ) {
      let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(e.key));
      this.currentTarget = this.currentTarget.add(new Position(moveDir[0], moveDir[1], 0));
      this.updateDisplay();
    }
  }

  private cleanup(): void {
    if (this.displayId) {
      this.ecs.em.removeEntity(this.displayId);
      this.ecs.em.createEntity(
        new ClearRender(this.displayId)
      )
    }
  }

  private leave(): void {
    this.changeState(new PlayerControl(this.playerId, this.ecs, this.changeState));
  }

  private updateDisplay(): void {
    this.cleanup();
    let displayImage = this.posTargetable(this.currentTarget) 
      ? '0005_select_ring.png' 
      : '0006_invalid_select_ring.png';
    this.displayId = this.ecs.em.createEntity(
      new Renderable(displayImage, 100),
      clone(this.currentTarget)
    ).id();
  }

  private posTargetable(pos: Position): boolean {
    const player = this.ecs.em.get(this.playerId);
    return player.has(Knowledge) 
      && player.component(Knowledge).positions.get(this.currentTarget) 
      === KnownState.CURRENT;
  }
}