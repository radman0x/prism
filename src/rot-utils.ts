
import * as ROT from 'rot-js';

import { Room } from 'rot-js/lib/map/features';
import { randomElement } from './utils';
import { Position } from './app/components.model';

export function randomPosInRoom(
  room: Room, 
  posFilter: (p: Position) => boolean
  ): Position {
  let roomCells: Position[] = [];
  for (let x = room.getLeft(); x <= room.getRight(); ++x) {
    for (let y = room.getTop(); y <= room.getBottom(); ++y) {
      const roomPos = new Position(x, y, 0);
      if (posFilter(roomPos)) {
        roomCells.push(roomPos);
      }
    }
  }

  // console.log(`providing random pos, from ${roomCells.length} candidates`);
  return randomElement(roomCells);
}