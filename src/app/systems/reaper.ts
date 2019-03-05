import { System, EntityManager, Entity } from 'rad-ecs';
import { Health, ClearRender } from '../components.model';

export class Reaper implements System {
  constructor() {}

  update(em: EntityManager): void {
    em.each( (e: Entity, h: Health) => {
      if (h.current < 0) {
        const removeId = e.id();
        console.log(`removing 0 health entity`);
        em.removeEntity(removeId);
        em.createEntity(
          new ClearRender(removeId)
        );
      }
    }, Health);
  }
}
