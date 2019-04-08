
import { System, EntityManager, Entity } from 'rad-ecs';
import { LightSource, Position, Physical, Size, LightLevel } from '../components.model';

import * as ROT from 'rot-js';
import { ValueMap } from 'src/utils';

export class Lighting implements System {
  constructor() {}

  update(em: EntityManager): void {
    
    let openMap = new ValueMap<Position, boolean>();
    em.each((e: Entity, p: Position, y: Physical) => {
      const normalPos = new Position(p.x, p.y, 0);

      if ( ! openMap.has(p) ) {
        openMap.set(normalPos, true);
      }
      if (p.z === 0 && y.size === Size.FILL) {
        openMap.set(normalPos, false);
      }
    }, Position, Physical);


    let lightFov = new ROT.FOV.PreciseShadowcasting( (x: number, y: number) => {
      const currPos = new Position(x, y, 0);
      return openMap.has(currPos) && openMap.get(currPos);
    }, {topology: 8} );

    let lighting = new ROT.Lighting( (x: number, y: number) => {
      const currPos = new Position(x, y, 0);
      return openMap.has(currPos) && openMap.get(currPos) ? 0 : 0;
    }, {range:4, passes:2});
    lighting.setFOV(lightFov);

    em.each( (lsEntity: Entity, l: LightSource, p: Position) => {
      lighting.setLight(p.x, p.y, [255, 255, 255]);
    },

    LightSource, Position);

    let count = 0;
    lighting.compute( (x: number, y: number, c) => {
      ++count;
      let litEntity = em.matchingIndex(new Position(x, y, 0))
        .filter( (e: Entity) => e.has(LightLevel))
        .reduce( (accum, curr) => curr, null);
      if ( litEntity !== null ) {
        em.setComponent(litEntity.id(), new LightLevel(c));
      } else {
        em.createEntity(
          new Position(x, y, 0),
          new LightLevel(c)
        );
      }
    });
  }

  private lightBlockAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.component(Position).z === 0 && fe.has(Physical) && fe.component(Physical).size === Size.FILL )
      .length !== 0;
  }
}