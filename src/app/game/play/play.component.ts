import { PlayerControl, InputHandler, ChooseTarget } from './input-handler.model';
import { Health, Sight, Dynamism, Velocity, Aimed } from './../../components.model';
import { Movement } from '../../systems/movement.model';
import { Dimensions, DIR_FROM_KEY, DIR_VECTORS, randomInt } from './../../../utils';
import { Component, OnInit, Input, HostListener } from '@angular/core';
import { EcsService } from 'src/ecs.service';
import { Renderable, Position, Size, Physical, PhysicalMove } from 'src/app/components.model';

import * as ROT from 'rot-js';
import { Room } from 'rot-js/lib/map/features';
import { FOVManager } from 'src/app/systems/fov.model';
import { Projectiles } from 'src/app/systems/projectiles';
import { Reaper } from 'src/app/systems/reaper';

const clone = require('clone');

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

  private inputState: InputHandler;

  constructor(
    private ecs: EcsService
  ) { }

  ngOnInit() {
    this.initLevel();

    this.ecs.addSystem( new Movement() );
    this.ecs.addSystemAndUpdate( new FOVManager() );
    this.inputState = new PlayerControl(this.playerId, this.ecs, (h: InputHandler) => this.inputState = h);
    this.ecs.addSystem( new Projectiles() );
    this.ecs.addSystem( new Reaper() );
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
      new Physical(Size.FILL, Dynamism.STATIC)
    )

    if (contents === 1) {
      em.createEntity( 
        new Position(x, y, 0),
        new Renderable('Wall-188.png', 1),
        new Physical(Size.FILL, Dynamism.STATIC)
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
    new Physical(Size.MEDIUM, Dynamism.DYNAMIC),
    new Sight(100)
  ).id();

  let remainingRooms = rooms.filter( (r: Room, i: number) => i !== playerRoomNum);
  let enemyRoom = remainingRooms[ randomInt(0, remainingRooms.length -1) ];
  console.log(`Enemy pos: ${enemyRoom.getCenter()}`);
  em.createEntity(
    new Position(enemyRoom.getCenter()[0], enemyRoom.getCenter()[1], 0),
    new Renderable("Undead0-41.png", 1),
    new Health(10, 10),
    new Physical(Size.MEDIUM, Dynamism.DYNAMIC)
  );
  em.createEntity(
    new Position(enemyRoom.getCenter()[0]+1, enemyRoom.getCenter()[1], 0),
    new Renderable("Undead0-41.png", 1),
    new Health(10, 10),
    new Physical(Size.MEDIUM, Dynamism.DYNAMIC)
  );

}

  @HostListener('window:keypress', ['$event'])
  handleMoveInput(e: KeyboardEvent) {
    console.log(`Key input: ${e.key}`);
    const changeState = (h: InputHandler) => {
      this.inputState = h;
    };

    if ( ! this.ecs.em.exists(this.playerId) ) {
      console.log(`player is gone yo :O`);
      return;
    }
    if ( e.key === '/') {
      const player = this.ecs.em.get(this.playerId);
      this.inputState = new ChooseTarget(
        player.component(Position), 
        this.playerId,
        (o: Position, t: Position, d: Position) => {
          this.ecs.em.createEntity(
            new Velocity(d),
            new Aimed(t),
            o,  
            new Physical(Size.SMALL, Dynamism.STATIC)
          );
          this.ecs.update();
        },
        this.ecs, 
        changeState
      );
      return;
    }

    if (this.inputState) {
      this.inputState.handleKey(e);
    }
  }

  @HostListener('window:keyup.escape', ['$event'])
  handleEsc(e: KeyboardEvent) {
    if ( this.inputState ) {
      this.inputState.handleKey(e);
    }
  }
}
