import { Physical, Size, Renderable, Aimed, Health } from './../components.model';
import { Position } from 'src/app/components.model';
import { System, EntityManager, Entity } from 'rad-ecs';
import { Velocity } from '../components.model';
import { bresenhamRange } from 'src/bresenham';
import { randomInt } from 'src/utils';

const deepEqual = require('deep-equal');

export class Projectiles implements System {
  constructor() {}

  update(em: EntityManager): void {
    em.each( (e: Entity, v: Velocity, p: Position) => {
      console.log(`got projectile`);
      const HACK_RANGE = 20;
      let strikePoint: Position;
      bresenhamRange(p.x, p.y, v.direction.x, v.direction.y, HACK_RANGE, (x: number, y: number) => {
        const currPos = new Position(x, y, 0);
        if ( ! strikePoint && ! deepEqual(currPos, p) ) {
          const physicalAt = em.matchingIndex(currPos).filter( (e: Entity) => e.has(Physical) );
          const strikeTarget = physicalAt.find( (e: Entity) => e.component(Physical).size === Size.MEDIUM );
          if ( strikeTarget ) {
            console.log(`possible strike target: ${strikeTarget.id()}`);
            const baseChance = 25;
            const targetingBonus = e.has(Aimed) && deepEqual(e.component(Aimed).target, currPos) ? 50 : 0;
            const strikeChance = baseChance + targetingBonus;
            if (randomInt(1, 100) <= strikeChance ) {
              const targetHealth = strikeTarget.component(Health);
              if ( targetHealth ) {
                em.setComponent(strikeTarget.id(), new Health(targetHealth.current - 5, targetHealth.max));
                strikePoint = currPos;
                console.log(`target struck and now has: ${strikeTarget.component(Health).current} hitpoints`);
              }
            }
          }
          else if (physicalAt.find( (pe: Entity) => pe.component(Physical).size === Size.FILL)) {
            console.log(`struck a wall`);
            strikePoint = currPos;
          }

        }
      });

      em.removeEntity(e.id());
      
    }, Velocity, Position);
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size === Size.FILL)
      .length !== 0;
  }
}