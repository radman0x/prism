import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Dimensions } from 'src/utils';

import * as PIXI from 'pixi.js';
import { EcsService } from 'src/ecs.service';
import { Entity } from 'rad-ecs';
import { Renderable, Position } from 'src/app/components.model';

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
      this.setPixiScale();
    }
  }

  size(): {} {
    return {
      width:  `${this.dimensions.width}.px`,
      height: `${this.dimensions.height}.px`,
    }
  }

  renderLoop(): void {
    let renderables = this.ecs.em.matching(Renderable, Position);
    renderables.sort( (lhs: Entity, rhs: Entity) => lhs.component(Renderable).zOrder - rhs.component(Renderable).zOrder);

    for (const e of renderables) {
      const [r, p] = e.components(Renderable, Position);
      let sprite = this.spriteRegister.get(e.id());
      if ( ! sprite ) {
        
        sprite = new PIXI.Sprite(this.textures[r.image]);
        this.pixiApp.stage.addChild(sprite);
      }
      const renderPos = p.multiply(this.TILE_SIZE);
      sprite.position.set(renderPos.x, renderPos.y);
    }
  }

  private setPixiScale(): void {
    const rawTileWidth = this.DISPLAY_WIDTH_IN_TILES * this.TILE_SIZE;
    const scale = this.dimensions.width / rawTileWidth;
    this.pixiApp.stage.scale.set(scale, scale);
  }

}
