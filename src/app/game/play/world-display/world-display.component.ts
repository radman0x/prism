import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Dimensions } from 'src/utils';

import * as PIXI from 'pixi.js';
import { EcsService } from 'src/ecs.service';
import { Entity } from 'rad-ecs';
import { Renderable, Position, Knowledge, KnownState, Dynamism, Physical, ClearRender } from 'src/app/components.model';

@Component({
  selector: 'app-world-display',
  templateUrl: './world-display.component.html',
  styleUrls: ['./world-display.component.css']
})
export class WorldDisplayComponent implements OnInit, AfterViewInit {
  
  @Input('dimensions') dimensions: Dimensions;
  @ViewChild('renderElement') renderElement: ElementRef;

  private HACK_REDUCE_HEIGHT = 5; // using exact values causes scrollbars to be displayed which then changes the available space

  private DISPLAY_WIDTH_IN_TILES = 44;
  private TILE_SIZE = 16;
  private PRISM_SPRITE_SHEET = 'assets/prism.json';
  
  private pixiApp: PIXI.Application;
  private textures: PIXI.ITextureDictionary;

  private spriteRegister = new Map<number, PIXI.Sprite>();
  
  constructor(
    private ecs: EcsService
  ) {}

  ngOnInit() {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    this.pixiApp = new PIXI.Application({
      width: this.dimensions.width,
      height: this.dimensions.height
    });
    
    this.pixiApp.loader.add(this.PRISM_SPRITE_SHEET).load(() => {
      this.pixiApp.ticker.add( () => this.renderLoop() );
      this.textures = this.pixiApp.loader.resources[this.PRISM_SPRITE_SHEET].textures;
    });

    this.setPixiScale();
  }

  ngAfterViewInit() {
    (this.renderElement.nativeElement as HTMLDivElement).appendChild(this.pixiApp.view);
  }

  ngOnChanges() {
    if ( this.pixiApp ) {
      this.pixiApp.renderer.resize(this.dimensions.width, this.dimensions.height - this.HACK_REDUCE_HEIGHT);
    }
  }

  size(): {} {
    return {
      width:  `${this.dimensions.width}.px`,
      height: `${this.dimensions.height}.px`,
    }
  }

  renderLoop(): void {
    this.pixiApp.stage.destroy();
    this.pixiApp.stage = new PIXI.Container();

    this.ecs.em.each( (e: Entity, cr: ClearRender) => {
      let clearSprite = this.spriteRegister.get(cr.clearId);
      if (clearSprite) {
        clearSprite.destroy();
        this.spriteRegister.delete(cr.clearId);
      }
      this.ecs.em.removeEntity(e.id());
    }, ClearRender);

    let renderables = this.ecs.em.matching(Renderable, Position);
    renderables.sort( (lhs: Entity, rhs: Entity) => lhs.component(Renderable).zOrder - rhs.component(Renderable).zOrder);

    const knowledge = this.ecs.em.matching(Knowledge).reduce( (accum, curr) => curr, null );
    const positionKnowledge = knowledge ? knowledge.component(Knowledge).positions : null;
    
    for (const e of renderables) {
      const [r, p] = e.components(Renderable, Position);
      const y = e.has(Physical) ? e.component(Physical) : null;
      let sprite = this.spriteRegister.get(e.id());
      if ( ! sprite ) {
        sprite = new PIXI.Sprite(this.textures[r.image]);
        this.spriteRegister.set(e.id(), sprite);
      }
      sprite.position.set(p.x * this.TILE_SIZE, p.y * this.TILE_SIZE);
      this.pixiApp.stage.addChild(sprite);

      if (positionKnowledge && y) {
        const posKnown = positionKnowledge.get(new Position(p.x, p.y, 0));
        if (posKnown === undefined) {
          sprite.visible = false;
        } else {
          switch (posKnown) {
            case KnownState.CURRENT:
              sprite.visible = true;
              sprite.tint = +'0xFFFFFF';
              break;
            case KnownState.REMEMBERED:
              if (y.dynamism === Dynamism.STATIC) {
                sprite.visible = true;
                sprite.tint = +'0xCCCCCC';
              } else {
                sprite.visible = false;
              }
              break;
          }
        }
      }
    }

    this.setPixiScale();
  }

  private setPixiScale(): void {
    const rawTileWidth = this.DISPLAY_WIDTH_IN_TILES * this.TILE_SIZE;
    const scale = this.dimensions.width / rawTileWidth;
    this.pixiApp.stage.scale.set(scale, scale);
  }

}
