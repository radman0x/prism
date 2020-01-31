import { xyPositionsAround, ValueMap } from "./../../utils";

import { System, EntityManager, Entity } from "rad-ecs";
import {
  DijkstraMap,
  Position,
  Physical,
  Size,
  Player
} from "../components.model";

import { Graph, alg } from "graphlib";

import * as deepEqual from "fast-deep-equal";

export class DijkstraCalculator implements System {
  constructor() {}

  update(em: EntityManager) {
    let asId = (c: Position) => `${c.x}, ${c.y}, ${c.z}`;

    em.each((e: Entity, p: Player) => {
      const target = e;
      if (!target.has(DijkstraMap)) {
        em.setComponent(target.id, new DijkstraMap());
      }
      const targetPos = target.component(Position);
      const oldMapLocus = em.get(target.id).component(DijkstraMap).locus;

      if (!oldMapLocus || !deepEqual(targetPos, oldMapLocus)) {
        // console.log(`Calculating new distance map because target pos has changed`);
        let worldGraph = new Graph();

        let walkableMap = new ValueMap<
          Position,
          { blocked: boolean; hasFloor: boolean }
        >();
        em.each(
          (e: Entity, p: Position, py: Physical) => {
            let walkablePos = new Position(p.x, p.y, 0);
            let walkableEntry = walkableMap.get(walkablePos);

            worldGraph.setNode(asId(walkablePos), walkablePos);

            if (!walkableEntry) {
              walkableEntry = { blocked: false, hasFloor: false };
              walkableMap.set(walkablePos, walkableEntry);
            }
            if (p.z === 0 && py.size === Size.FILL) {
              walkableEntry.blocked = true;
            } else if (p.z === -1 && py.size === Size.FILL) {
              walkableEntry.hasFloor = true;
            }
          },
          Position,
          Physical
        );

        for (const [pos, details] of walkableMap) {
          if (!details.blocked && details.hasFloor) {
            const surrounding = xyPositionsAround(pos.asCoord());
            for (const neighbourCoord of surrounding) {
              const neighbourPos = Position.fromCoord(neighbourCoord);
              const neighbourWalkable = walkableMap.get(neighbourPos);
              if (
                neighbourWalkable &&
                !neighbourWalkable.blocked &&
                neighbourWalkable.hasFloor
              ) {
                worldGraph.setEdge(asId(pos), asId(neighbourPos));
              }
            }
          }
        }

        let distanceMap = new ValueMap<Position, number>();
        for (const [nodeId, entry] of Object.entries(
          alg.dijkstra(worldGraph, asId(targetPos))
        )) {
          if (entry.distance !== Infinity && worldGraph.node(nodeId)) {
            distanceMap.set(worldGraph.node(nodeId), entry.distance);
          }
        }
        em.setComponent(target.id, new DijkstraMap(targetPos, distanceMap));
      }
    }, Player);
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return (
      em
        .matchingIndex(pos)
        .filter(
          (fe: Entity) =>
            fe.has(Physical) && fe.component(Physical).size === Size.FILL
        ).length !== 0
    );
  }
}
