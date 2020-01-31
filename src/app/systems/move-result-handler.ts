import {
  MoveAnimation,
  Knowledge,
  Player,
  DijkstraMap,
  Renderable,
  Position
} from "./../components.model";

import { System, EntityManager, Entity } from "rad-ecs";
import { MoveResult } from "../components.model";

export class MoveResultHandler implements System {
  constructor() {}

  update(em: EntityManager): void {
    const player: Entity | null = em
      .matching(Player, DijkstraMap)
      .reduce((accum, curr) => curr, null);
    const knowledge = player.component(Knowledge);
    em.each(
      (resultEntity: Entity, mr: MoveResult, r: Renderable, p: Position) => {
        // console.log(`checking position in knowledge: ${p.hash()}`);

        if (knowledge.positions.has(p)) {
          em.setComponent(
            resultEntity.id,
            new MoveAnimation(mr.source, mr.destination, 70, r.image)
          );
        }

        em.removeComponent(resultEntity.id, MoveResult);
      },
      MoveResult,
      Renderable,
      Position
    );
  }
}
