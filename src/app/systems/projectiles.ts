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
      
      const HACK_RANGE = 20;
      let strikePoint: {pos: Position, wall: boolean};

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
                strikePoint = {pos: currPos, wall: false};
                console.log(`target struck and now has: ${strikeTarget.component(Health).current} hitpoints`);
              }
            }
          }
          else if (physicalAt.find( (pe: Entity) => pe.component(Physical).size === Size.FILL)) {
            console.log(`struck a wall`);
            strikePoint = {pos: currPos, wall: true};
            
          }
        }
      });

      if (strikePoint) {
        const xUnit = Math.sign(v.direction.x) * -1;
        const yUnit = Math.sign(v.direction.y) * -1;
        let dropCandidates: Position[] = [];
        if ( Math.abs(v.direction.x) >= Math.abs(v.direction.y) ) {
          dropCandidates.push( new Position(strikePoint.pos.x + xUnit, strikePoint.pos.y, strikePoint.pos.z) );
          dropCandidates.push( new Position(strikePoint.pos.x, strikePoint.pos.y + yUnit, strikePoint.pos.z) );
          dropCandidates.push( new Position(strikePoint.pos.x + xUnit, strikePoint.pos.y + yUnit, strikePoint.pos.z) );
        } else {
          dropCandidates.push( new Position(strikePoint.pos.x, strikePoint.pos.y + yUnit, strikePoint.pos.z) );
          dropCandidates.push( new Position(strikePoint.pos.x + xUnit, strikePoint.pos.y, strikePoint.pos.z) );
          dropCandidates.push( new Position(strikePoint.pos.x + xUnit, strikePoint.pos.y + yUnit, strikePoint.pos.z) );
        }
        
        for (const pos of dropCandidates) {
          if ( ! this.fillAtPos(pos, em)) {
            em.createEntity(
              new Renderable('yellow-ball.png', 2, undefined, true),
              pos
            );
            break;
          }
        }

      } else {
        console.log(`projectile failed to strike anything`);
      }


      em.removeEntity(e.id());

    }, Velocity, Position);
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size === Size.FILL)
      .length !== 0;
  }
}