import { Movement } from './../../systems/movement';
import { Dimensions, DIR_FROM_KEY, DIR_VECTORS, randomInt } from './../../../utils';
import { Component, OnInit, Input, HostListener } from '@angular/core';
import { EcsService } from 'src/ecs.service';
import { Renderable, Position, Size, Physical, PhysicalMove } from 'src/app/components.model';

import * as ROT from 'rot-js';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.css']
})
export class PlayComponent implements OnInit {
  
  @Input('dimensions') dimensions: Dimensions;

  private playerId: number;

  private LEVEL_WIDTH = 44;
  private LEVEL_HEIGHT = 21;

  constructor(
    private ecs: EcsService
  ) { }

  ngOnInit() {
    this.initLevel();

    this.ecs.addSystem( new Movement() );
  }

  worldDisplaySize(): Dimensions {
    return this.dimensions;
  }

initLevel(): void {
  let world = new ROT.Map.Uniform(this.LEVEL_WIDTH, this.LEVEL_HEIGHT, {roomDugPercentage: 0.9});

  let em = this.ecs.em;
  world.create( (x: number, y: number, contents: number) => {
    em.createEntity( 
      new Position(x, y, -1),
      new Renderable('Floor-48.png', 0),
      new Physical(Size.FILL)
    )

    if (contents === 1) {
      em.createEntity( 
        new Position(x, y, 0),
        new Renderable('Wall-188.png', 1),
        new Physical(Size.FILL)
      )
    }
  });

  let rooms = world.getRooms();
  let playerRoomNum = randomInt(0, rooms.length -1);
  console.log(`player room num: ${playerRoomNum}`);
  let playerRoom = rooms[playerRoomNum];
  console.log(`player pos: ${playerRoom.getCenter()}`);
  this.playerId = em.createEntity(
    new Position(playerRoom.getCenter()[0], playerRoom.getCenter()[1], 0),
    new Renderable("Player0-22.png", 1),
    new Physical(Size.MEDIUM)
  ).id();

  // let remainingRooms = rooms.filter( (r: Room, i: number) => i !== playerRoomNum);
  // let enemyRoom = remainingRooms[ randomInt(0, remainingRooms.length -1) ];
  // console.log(`Enemy pos: ${enemyRoom.getCenter()}`);
  // em.createEntity(
  //   new Position(enemyRoom.getCenter()[0], enemyRoom.getCenter()[1], 0),
  //   new Renderable("Player0-61.png", 1),
  //   new Combat(7, 3, 1),
  //   new Health(10, 10),
  //   new AI(100, 0)
  // );

  // this.wallClockId = em.createEntity(
  //   new Clock('wall-clock', 0)
  // ).id();
}

  @HostListener('window:keypress', ['$event'])
  handleMoveInput(e: KeyboardEvent) {
    if ( e.key === '5') {
      console.log(`Player resting...`);
      this.ecs.update(); // hack for testing
      return;
    }
    if ( DIR_FROM_KEY.has(e.key) ) {
      console.log(`move key received: ${e.key}`);
      if ( this.ecs.em.exists(this.playerId) ) {
        console.log(`player exists`);
        let moveDir = DIR_VECTORS.get(DIR_FROM_KEY.get(e.key));
        let playerPos = this.ecs.em.get(this.playerId).component(Position);
        this.ecs.em.setComponent(this.playerId, 
          new PhysicalMove(
            new Position(playerPos.x + moveDir[0], playerPos.y + moveDir[1], playerPos.z)
          )
        );

        // this.ecs.em.setComponent(this.playerId, new IncrementTime(100));
        this.ecs.update(); // for player
        // this.ecs.update(); // for AI

      }
    }
  }
}
