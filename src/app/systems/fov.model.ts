
import { ValueMap } from '../../utils';

import { Position, Physical, Size, Knowledge, KnownState, Sight, LightLevel } from '../components.model';
import { System, EntityManager, Entity } from 'rad-ecs';

import * as ROT from 'rot-js';
import * as clone from 'clone';

export class FOVManager implements System {
  constructor() {}

  update(em: EntityManager): void {

    em.each((e: Entity, s: Sight) => {
      let fov = new ROT.FOV.PreciseShadowcasting( (x: number, y: number) => {
        let blocking = em.matchingIndex(new Position(x, y, 0)).filter( (e: Entity) => {
          if (e.has(Position) && e.has(Physical)) {
            let [position, physical] = e.components(Position, Physical);
            return physical && position && physical.size === Size.FILL && position.z === 0;
          }
        });
        return blocking.length === 0;
      });
  
      let viewer = em.get(e.id());
      let viewPos = viewer.component(Position);
      let knowledge: ValueMap<Position, KnownState>;
      knowledge = viewer.has(Knowledge) ? clone(viewer.component(Knowledge).positions) : new ValueMap<Position, KnownState>();

      for (let [key,] of knowledge) {
        knowledge.set(key, KnownState.REMEMBERED);
      }
  
      fov.compute(
        viewPos.x, 
        viewPos.y, 
        s.range, 
        (x: number, y: number, r: number, v: number) => {
          const pos = new Position(x, y, 0);
          const hasLight = em.matchingIndex(pos)
            .filter( (e: Entity) => e.has(LightLevel) )
            .length !== 0;
          if (hasLight) {
            knowledge.set(pos, KnownState.CURRENT);
          }
        }
      );
    
      em.setComponent(e.id(), new Knowledge(knowledge));
    }, Sight);
  }
}
