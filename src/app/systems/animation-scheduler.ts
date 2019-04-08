
import { MoveAnimation, Knowledge, Player, DijkstraMap, Position } from './../components.model';
import { System, EntityManager, Entity } from 'rad-ecs';

import { PixiRendererService, MoveAnim } from '../game/play/pixi-renderer.service';

export class AnimationScheduler implements System {
  constructor(
    private render: PixiRendererService
  ) {}

  update(em: EntityManager): void {
    console.log(`anim schedule update)`);
    em.each( (animEntity: Entity, ma: MoveAnimation) => {
      let renderable = (ma.hideExisting ? animEntity.id() : undefined);
      console.log(`pushing move animation`);
      this.render.pushMoveAnimation(
        new MoveAnim(
          ma.start, 
          ma.end, 
          ma.durationMs, 
          ma.image, 
          renderable
        )
      );
      em.removeComponent(animEntity.id(), MoveAnimation);
    }, 
    MoveAnimation);
  }
}