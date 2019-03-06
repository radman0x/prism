import { Coord, xyPositionsAround, ValueMap, randomInt } from './../../utils';
import { Clock, AI, Position, DijkstraMap, PhysicalMove, Player, Physical, Size } from './../components.model';
import { System, EntityManager, Entity } from 'rad-ecs';


export class AIController implements System {

  private RANDOM_MOVE_CHANCE = 25;

  constructor(
    private wallClockId: number,
  ) {}

  update(em: EntityManager) {
    const wallClock = em.get(this.wallClockId).component(Clock);
    const player: Entity | null = em.matching(Player, DijkstraMap).reduce( (accum, curr) => curr, null);
    const distanceMap = player.component(DijkstraMap).distanceMap;

    let aiPositions = new ValueMap<Position, number>();
    em.each( (e: Entity, ai: AI, p: Position) => {
      aiPositions.set(p, e.id());
    }, AI, Position);

    em.each( (aiEntity: Entity, ai: AI, p: Position) => {
      const actionPoints = wallClock.currentTick - ai.lastActionTick;
      // console.log(`updating AI: ${aiEntity.id()}, has: ${actionPoints} to use`);
      if ( actionPoints >= ai.actionCost) {
        const aiPos = aiEntity.component(Position);
        const closest = this.selectMoveTarget(aiPos, aiPositions, distanceMap, em);
        // console.log(`pushing ai move order to: ${closest.pos}`);
        if ( ! (closest.distance === 0)) { // attacking the player
          const moveTarget = closest.pos;
          aiPositions.delete(p);
          aiPositions.set(moveTarget, aiEntity.id());
        } 
        em.setComponent(aiEntity.id(), new PhysicalMove(closest.pos));
        em.setComponent(aiEntity.id(), new AI(ai.lastActionTick + ai.actionCost, ai.actionCost));
      }
    }, AI, Position);
  }

  private selectMoveTarget(
    aiPos: Position, 
    aiPositions: ValueMap<Position, number>,
    distanceMap: ValueMap<Position, number>,
    em: EntityManager)
    : {pos: Position, distance: number} | null {
    
    const playerAdjacent = xyPositionsAround(aiPos.asCoord())
      .filter( (c: Coord) => distanceMap.get(Position.fromCoord(c)) === 0).length !== 0;
    if ( playerAdjacent || randomInt(1, 100) > this.RANDOM_MOVE_CHANCE) {
      return this.chooseOptimalPosition(aiPos, aiPositions, distanceMap, em);
    } else {
      return this.chooseRandomPosition(aiPos, distanceMap, em);
    }
    
  }

  private chooseOptimalPosition(
    aiPos: Position, 
    aiPositions: ValueMap<Position, number>,
    distanceMap: ValueMap<Position, number>,
    em: EntityManager)
    : {pos: Position, distance: number} | null {

    const aiCoord = aiPos.asCoord();
    const surrounding = xyPositionsAround(aiCoord)
      .filter( (c: Coord) => ! this.obstacleAtPos(Position.fromCoord(c), em) && ! aiPositions.has(Position.fromCoord(c)));
    let closest: {pos: Position | null, distance: number} = {pos: null, distance: Infinity};

    for (let neighbourCoord of surrounding) {
      const direction = aiCoord.subtract(neighbourCoord);
      const cardinal = direction.x === 0 || direction.y === 0;
      const neighbourDist = distanceMap.get(Position.fromCoord(neighbourCoord));
      closest = neighbourDist < closest.distance ? {pos: Position.fromCoord(neighbourCoord), distance: neighbourDist} : closest;
      closest = neighbourDist === closest.distance && cardinal ? {pos: Position.fromCoord(neighbourCoord), distance: neighbourDist} : closest;
    }
    return closest.pos !== null ? closest : null;
  }

  private chooseRandomPosition(
    aiPos: Position, 
    distanceMap: ValueMap<Position, number>, 
    em: EntityManager)
    : {pos: Position, distance: number} | null {

    const aiCoord = aiPos.asCoord();
    const surrounding = xyPositionsAround(aiCoord)
      .filter( (c: Coord) => ! this.fillAtPos(Position.fromCoord(c), em) );
    if (surrounding.length === 0) {
      return null;
    } else {
      const selectedPos = Position.fromCoord( surrounding[ randomInt(0, surrounding.length-1) ] );
      return { pos: selectedPos, distance: distanceMap.get(selectedPos) };
    }
  }

  private fillAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => (fe.has(Physical) && fe.component(Physical).size === Size.FILL) )
      .length !== 0;
  }

  private obstacleAtPos(pos: Position, em: EntityManager): boolean {
    return em.matchingIndex(pos)
      .filter( (fe: Entity) => fe.has(AI) || (fe.has(Physical) && fe.component(Physical).size === Size.FILL) )
      .length !== 0;
  }
}