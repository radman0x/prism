import { Movement } from './../../systems/movement';
import { Dimensions, DIR_FROM_KEY, DIR_VECTORS } from './../../../utils';
import { Component, OnInit, Input, HostListener } from '@angular/core';
import { EcsService } from 'src/ecs.service';
import { Renderable, Position, Size, Physical, PhysicalMove } from 'src/app/components.model';

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
    this.playerId = this.initLevel();

    this.ecs.addSystem( new Movement() );
  }

  worldDisplaySize(): Dimensions {
    return this.dimensions;
  }

  initLevel(): number {
    for (let x = 0; x < this.LEVEL_WIDTH; ++x) {
      for (let y = 0; y < this.LEVEL_HEIGHT; ++y) {
        if (x === 0 || x === this.LEVEL_WIDTH-1 || y === 0 || y === this.LEVEL_HEIGHT-1 ) {
          this.ecs.em.createEntity(
            new Renderable('Wall-188.png', 1),
            new Position(x, y, 0),
            new Physical(Size.FILL)
          )          
        }
        this.ecs.em.createEntity(
          new Renderable('Floor-48.png', 0),
          new Position(x, y, -1),
          new Physical(Size.FILL)
        )
      }
    }

    return this.ecs.em.createEntity(
      new Renderable('Player0-22.png', 10),
      new Position(4, 4, 0),
      new Physical(Size.MEDIUM)
    ).id();
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
