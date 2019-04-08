import { System, EntityManager, Entity } from 'rad-ecs';
import { PhysicalMove, Position, Physical, Size, MoveResult } from '../components.model';

export class Movement implements System {
  constructor() {}

  update(em: EntityManager): void {
    
    em.each( (e: Entity, pm: PhysicalMove, p: Position) => {
      let floorPos = new Position(pm.target.x, pm.target.y, pm.target.z -1);
      let floorAtTarget = this.fillAtPos(floorPos, em);
      let blockageAtTarget = this.fillAtPos(pm.target, em);
      if ( floorAtTarget && ! blockageAtTarget ) {
        em.setComponent(e.id(), pm.target);
        em.setComponent(e.id(), new MoveResult(p, pm.target));
      }

      em.removeComponent(e.id(), PhysicalMove);


    }, PhysicalMove, Position);
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size === Size.FILL)
      .length !== 0;
  }
}