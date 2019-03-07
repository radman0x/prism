import { System, EntityManager, Entity } from 'rad-ecs';
import { Spawner, Clock, Position, Physical, Size, AI } from '../components.model';
import { xyPositionsAround, Coord, randomElement, randomInt } from 'src/utils';

export class Spawn implements System {
  constructor(
    private wallClockId: number
  ) {}

  update(em: EntityManager): void {
    em.each( (e: Entity, s: Spawner, p: Position) => {
      const wallClock = em.get(this.wallClockId).component(Clock);
      let spawnerAP = wallClock.currentTick - s.lastSpawnTick;
      const aiCount = em.matching(AI).length;
      for ( ; spawnerAP >= s.spawnRate; spawnerAP -= s.spawnRate) {
        const spawnChance = s.spawnChance - aiCount / 3;
        if (randomInt(0, 100) <= spawnChance) {
          const availableAround = xyPositionsAround(p.asCoord())
          .map( (c: Coord) => Position.fromCoord(c) )
          .filter( (p: Position) => ! this.spawnBlockedAtPos(p, em));
          if ( availableAround.length === 0) {
            console.log(`All spawn positions blocked for spawner: ${e.id()}`);
            continue;
          }
          const spawnAt = randomElement(availableAround);
          const newSpawn = em.createEntity(
            spawnAt,
            ...s.spawnComponents
          ).id();
          em.setComponent(newSpawn, new AI(wallClock.currentTick, 150));
          console.log(`new enemy spawned, total now: ${em.matching(AI).length}`);
        }
      }
      em.setComponent(e.id(), new Spawner(s.spawnComponents, s.spawnRate, wallClock.currentTick - spawnerAP, s.spawnChance));
    }, Spawner, Position);
  }

  private spawnBlockedAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(Physical) && fe.component(Physical).size >= Size.MEDIUM)
      .length !== 0;
  }
}
