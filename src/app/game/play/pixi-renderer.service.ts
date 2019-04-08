import { Injectable } from '@angular/core';
import { EcsService } from 'src/ecs.service';
import { Entity } from 'rad-ecs';
import { ClearRender, Renderable, Position, Knowledge, Physical, KnownState, Dynamism, LightLevel } from 'src/app/components.model';
import { randomInt, Dimensions } from 'src/utils';

import * as PIXI from 'pixi.js';
import * as ROT from 'rot-js';

export class MoveAnim {
  constructor(
    public start: Position,
    public end: Position,
    public durationMs: number,
    public image: string,
    public renderableId: number | undefined = undefined
  ) {}
}

class MoveProgress {
  constructor(
    public sprite: PIXI.Sprite,
    public currentTime: number, 
    public startPos: Position,
    public hideId: number
  ) {}
}

@Injectable({
  providedIn: 'root'
})
export class PixiRendererService {

  private DISPLAY_WIDTH_IN_TILES = 44;
  private DISPLAY_HEIGHT_IN_TILES = 21;
  private TILE_SIZE = 16;
  private PRISM_SPRITE_SHEET = 'assets/prism.json';
  private SMALLER_SPRITE_SHEET = 'assets/smaller.json';

  private pixiApp: PIXI.Application | null = null;
  private textures: PIXI.ITextureDictionary;
  private smallTextures: PIXI.ITextureDictionary;

  private spriteRegister = new Map<number, PIXI.Sprite>();
  // private dijkstraRegister = new Map<Position, PIXI.Sprite>();
  private lightRegister = new Map<number, PIXI.Sprite>();

  private targetRenderSize: Dimensions;

  private animations: {id: number, anim: MoveAnim}[] = [];
  private runningAnims = new Map<number, MoveProgress>();
  private animCounter: number = 0;

  constructor(
    private ecs: EcsService
  ) { }

  init(width: number, height: number): void {
    this.targetRenderSize = new Dimensions(width, height);

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    this.pixiApp = new PIXI.Application({
      width: width,
      height: height
    });

    this.pixiApp.loader
      .add(this.PRISM_SPRITE_SHEET)
      .add(this.SMALLER_SPRITE_SHEET)
      .load(() => {
      this.textures = this.pixiApp.loader.resources[this.PRISM_SPRITE_SHEET].textures;
      this.smallTextures = this.pixiApp.loader.resources[this.SMALLER_SPRITE_SHEET].textures;
      this.pixiApp.ticker.add( () => this.renderLoop() );
    });

    this.setPixiScale(width, height);
  }

  pushMoveAnimation(anim: MoveAnim): void {
    console.log(`Move animation being pushed`);
    this.animations.push( {id: this.animCounter++, anim: anim} );
  }

  running(): boolean {
    return this.pixiApp !== null;
  }

  reset(): void {
    this.pixiApp.destroy();
    this.pixiApp = null;
  }

  getRenderView(): HTMLElement {
    this.checkRunning();
    return this.pixiApp.view;
  }

  resize(width: number, height: number): void {
    this.checkRunning();
    this.targetRenderSize = new Dimensions(width, height);
    this.pixiApp.renderer.resize(width, height);

  }

  setPixiScale(width: number, height: number): void {
    this.checkRunning();
    const rawTileWidth = this.DISPLAY_WIDTH_IN_TILES * this.TILE_SIZE;
    const rawTileHeight = this.DISPLAY_HEIGHT_IN_TILES * this.TILE_SIZE;
    const scale = Math.min(width / rawTileWidth, height / rawTileHeight);
    this.pixiApp.stage.scale.set(scale, scale);
  }

  private renderLoop(): void {
    const dt = this.pixiApp.ticker.deltaMS;

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
        const texture = r.smaller ? this.smallTextures[r.image] : this.textures[r.image];
        // console.log(`creating new texture: ${r.image}`);
        sprite = new PIXI.Sprite(texture);
        this.spriteRegister.set(e.id(), sprite);
      }

      this.adjustSprite(sprite, e.id(), r, p);
      this.pixiApp.stage.addChild(sprite);

      if (positionKnowledge && y) {
        const modRgbString = (rgb: string) => '0x' + rgb.slice(1);
        const convertRgb = (rgb: [number, number, number]) => modRgbString(ROT.Color.toHex(rgb));
        const colorAdder = (cs: string, rgbVals: [number, number, number]): string => {
          const combined = ROT.Color.add(rgbVals, ROT.Color.fromString(cs) as [number, number, number]);
          let raw = ROT.Color.toHex(combined);
          const modified = modRgbString(raw);
          return modified;
        };
        const currPos = new Position(p.x, p.y, 0);
        const posKnown = positionKnowledge.get(currPos);
        const lightLevel = this.ecs.em.matchingIndex(currPos)
          .filter( (e: Entity) => e.has(LightLevel))
          .reduce( (accum, curr) => curr, null);
        
        if (posKnown === undefined || this.runningAnims.has(e.id())) {
          sprite.visible = false;
        } else {
          switch (posKnown) {
            case KnownState.CURRENT:
              sprite.visible = true;
              const lightRgb = lightLevel ? +convertRgb(lightLevel.component(LightLevel).level) : +'0x000000';
              sprite.tint = lightRgb;
              break;
            case KnownState.REMEMBERED:
              if (y.dynamism === Dynamism.STATIC) {
                sprite.visible = true;
                const lightRgb = lightLevel ? +convertRgb(lightLevel.component(LightLevel).level) : +'0x000000';
                sprite.tint = lightRgb;
              } else {
                sprite.visible = false;
              }
              break;
          }
        }
      }
    } // display of Renderables

    // handle animations
    for (let [index, animation] of this.animations.entries()) {
      let progress = this.runningAnims.get(animation.anim.renderableId);
      if ( ! progress ) {
        console.log(`creating new sprite for animation`);
        const sprite = new PIXI.Sprite(this.textures[animation.anim.image]);
        progress = new MoveProgress(
          sprite,
          0,
          animation.anim.start,
          animation.anim.renderableId
        );
        console.log(`adding anim to running`);
        this.runningAnims.set(animation.anim.renderableId, progress);
      }

      if ( index === 0 ) {
        progress.currentTime += dt;
        
        if ( progress.currentTime < animation.anim.durationMs ) {
  
          if (progress.hideId !== undefined) {
            let hideImage = this.spriteRegister.get(progress.hideId);
            if ( hideImage ) {
              hideImage.visible = false;
            }
          }
  
          const vecToTarget = animation.anim.start.subtract(animation.anim.end);
          const elapsedSecs = progress.currentTime;
          const progressRatio = elapsedSecs / animation.anim.durationMs;
          const {x, y} = vecToTarget.multiply(progressRatio * this.TILE_SIZE).add(animation.anim.start.multiply(this.TILE_SIZE));
  
          progress.sprite.position.set(x, y);
          this.pixiApp.stage.addChild(progress.sprite);
  
        } else {
          console.log(`REMOVING animation sprite`);
          progress.sprite.destroy();
          this.runningAnims.delete(animation.anim.renderableId);
          this.animations.splice(0, 1);
        }

      } else {
        const startPos = animation.anim.start.multiply(this.TILE_SIZE);
        progress.sprite.position.set(startPos.x, startPos.y);
        this.pixiApp.stage.addChild(progress.sprite);
      }
    }

    this.setPixiScale(this.targetRenderSize.width, this.targetRenderSize.height);

    // radNOTE: uncomment to render out Dijkstra distance map values
    // this.ecs.em.each( (e: Entity, dm: DijkstraMap) => {
    //   for (const [c, d] of dm.distanceMap) {
    //     let oldText = this.dijkstraRegister.get(c);
    //     if ( oldText ) {
    //       oldText.destroy();
    //       this.dijkstraRegister.delete(c);
    //     }
    //     let text = new PIXI.Text(
    //       `${d}`,
    //       { fontSize: 72, fill: 'white', fontWeight: 'bold' }
    //     );
    //     text.position.set(
    //       c.x * this.TILE_SIZE + (this.TILE_SIZE * 0.5),
    //       c.y * this.TILE_SIZE + (this.TILE_SIZE * 0.5)
    //     );
    //     text.scale.set(0.15, 0.15);
    //     text.anchor.set(0.5, 0.5);
    //     this.dijkstraRegister.set(c, text);
    //     this.pixiApp.stage.addChild(text);
    //   }
    // },
    // DijkstraMap);
  }

  private checkRunning() {
    if ( this.pixiApp === null) {
      throw Error(`PIXI app isn't initialised!!`);
    }
  }

  private adjustSprite(s: PIXI.Sprite, id: number, r: Renderable, p: Position): void {
    let spritePos = [p.x * this.TILE_SIZE, p.y * this.TILE_SIZE];
    if (r.smaller) {
      if ( ! r.subPos) {
        const subPos = {x: spritePos[0] + randomInt(0,11), y: spritePos[1] + randomInt(0,11)};
        const replace = new Renderable(r.image, r.zOrder, r.shrinkFactor, r.smaller, subPos, r.rotation);
        this.ecs.em.setComponent(id, replace);
        r = replace;
      }
      spritePos = [r.subPos.x, r.subPos.y];

      // if ( r.rotation === undefined ) {
      //   const randAngle = randomInt(0, 360);
      //   const replace = new Renderable(r.image, r.zOrder, r.shrinkFactor, r.smaller, r.subPos, randAngle);
      //   this.ecs.em.setComponent(id, replace);
      //   r = replace;
      // }
    }

    s.position.set(...spritePos);
    // s.pivot.set(8, 8);
    // s.angle = r.rotation !== undefined ? r.rotation : 0;

    if ( r.shrinkFactor !== undefined ) {
      s.scale.set(r.shrinkFactor, r.shrinkFactor);
    }
  }

}
