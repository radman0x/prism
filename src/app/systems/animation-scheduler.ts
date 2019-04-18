
import { MoveAnimation, Knowledge, Player, DijkstraMap, Position } from './../components.model';
import { System, EntityManager, Entity } from 'rad-ecs';

import { PixiRendererService, MoveAnim } from '../game/play/pixi-renderer.service';

export class AnimationScheduler implements System {
  constructor(
    private render: PixiRendererService,
    private signalDirty: () => {}
  ) {}

  update(em: EntityManager): void {
    // console.log(`anim schedule update`);
    let anyAnimsAdded = false;
    em.each( (animEntity: Entity, ma: MoveAnimation) => {
      // console.log(`pushing move animation`);
      // this.render.pushMoveAnimation(
      //   new MoveAnim(
      //     animEntity.id(),
      //     ma.start, 
      //     ma.end, 
      //     ma.durationMs
      //   )
      // );
      anyAnimsAdded = true;
      // em.removeComponent(animEntity.id(), MoveAnimation);
    }, 
    MoveAnimation);

    if ( ! anyAnimsAdded ) {
      this.signalDirty();
    }
  }
}