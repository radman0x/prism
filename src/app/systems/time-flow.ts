import { IncrementTime, Clock } from "./../components.model";
import { System, EntityManager, Entity } from "rad-ecs";

export class TimeFlow implements System {
  constructor() {}

  update(em: EntityManager): void {
    em.each((timeEntity: Entity, inc: IncrementTime) => {
      // console.log(`Inc Time message received, for ${inc.ticks}`);
      em.each((clockEntity: Entity, c: Clock) => {
        // console.log(`incrementing clock ${c.name} to  ${c.currentTick + inc.ticks}`);
        em.setComponent(
          clockEntity.id,
          new Clock(c.name, c.currentTick + inc.ticks)
        );
      }, Clock);

      em.removeComponent(timeEntity.id, IncrementTime);
    }, IncrementTime);
  }
}
