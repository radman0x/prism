import { System, EntityManager, Entity } from 'rad-ecs';
import { PhysicalMove, Position, Physical, Size } from '../components.model';

export class Movement implements System {
  constructor() {}

  update(em: EntityManager): void {
    
    em.each( (e: Entity, pm: PhysicalMove) => {
      let floorPos = new Position(pm.target.x, pm.target.y, pm.target.z -1);
      let floorAtTarget = this.fillAtPos(floorPos, em);
      let blockageAtTarget = this.fillAtPos(pm.target, em);
      if ( floorAtTarget && ! blockageAtTarget ) {
        em.setComponent(e.id(), pm.target);
      }

      em.removeComponent(e.id(), PhysicalMove);

    }, PhysicalMove);
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size === Size.FILL)
      .length !== 0;
  }
}