
import { System, EntityManager, Entity } from 'rad-ecs';
import { Health, Destructible, PhysicalMove, AI, Combat } from '../components.model';

export class Dismantle implements System {
  constructor() {}

  update(em: EntityManager): void {
    em.each( (dismantlerEntity: Entity, m: PhysicalMove) => {
      if (dismantlerEntity.has(AI) ) {
        return; // radHACK: ignore for AIs
      }
      const destructibleAt = em.matchingIndex(m.target)
        .filter((de: Entity) => de.has(Destructible) && de.has(Health))
        .reduce((accum, curr) => curr, null);
      if ( destructibleAt !== null ) {
        const dHealth = destructibleAt.component(Health);
        console.log(`Destructible suffering ${dismantlerEntity.component(Combat).damage} damage`);
        em.setComponent(destructibleAt.id(), new Health(dHealth.current - dismantlerEntity.component(Combat).damage, dHealth.max))
        em.removeComponent(dismantlerEntity.id(), PhysicalMove); // dismantled instead
      }

    }, PhysicalMove);
  }

}
