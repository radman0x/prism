import { CompositeLink } from './../components.model';
import { System, EntityManager, Entity } from 'rad-ecs';
import { Health, ClearRender } from '../components.model';

export class Reaper implements System {
  constructor() {}

  update(em: EntityManager): void {
    em.each( (e: Entity, h: Health) => {
      if (h.current < 0) {
        console.log(`removing 0 health entity`);
        this.removeAll(e, em);
      }
    }, Health);
  }

  private removeAll(e: Entity, em: EntityManager): void {
    for (let childId of e.has(CompositeLink) ? e.component(CompositeLink).childIds : []) {
      this.removeAll(em.get(childId), em);
    }
    this.removeSingle(e.id(), em);    
  }
  private removeSingle(id: number, em: EntityManager): void {
    em.removeEntity(id);
    em.createEntity(
      new ClearRender(id)
    );
  }
}
