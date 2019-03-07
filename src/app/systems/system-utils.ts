import { Entity, EntityManager } from 'rad-ecs';
import { Position, ParentLink, Condition, Proximity } from '../components.model';

export class ConditionHandler {

  static handleCondition(c: Condition, owner: Entity, em: EntityManager): boolean {
    if (c instanceof Proximity) {
      try {
        if ( c.specificEntity ) {
          let anchorPos: Position;
          if ( ! owner.has(Position) && owner.has(ParentLink) ) {
            let rootOwner = em.get(owner.component(ParentLink).parentId);
            anchorPos = rootOwner.component(Position);
          } else {
            throw Error(`Condition entity doesn't contain a position and has no root parent`);
          }
          
          let specificPos = em.get(c.specificEntity).component(Position);
          // console.log(`anchor: ${anchorPos.hash()}, specific: ${specificPos.hash()}`);
          let distanceToSpecific = anchorPos.subtract(specificPos).magnitude();
          // console.log(`Specific entity is ${distanceToSpecific} away`);
          if ( distanceToSpecific <= c.range ) {
            return true;
          }
        } else {
          throw Error(`Proximity without specific entity isn't supported right now!`);
        }

      } catch (e) {
        throw Error(`Proximity condition failed processing because: ${e}`);
      }

    }
    return false;
  }
}