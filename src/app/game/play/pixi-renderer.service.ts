import { Injectable } from '@angular/core';
import { EcsService } from 'src/ecs.service';
import { Entity, ComponentChange } from 'rad-ecs';
import {  Renderable, Position, Knowledge, Physical, KnownState, Dynamism, LightLevel, MoveAnimation } from 'src/app/components.model';
import { randomInt, Dimensions } from 'src/utils';

const deepEqual = require('fast-deep-equal');

import * as PIXI from 'pixi.js';
import * as ROT from 'rot-js';
import { Subscription } from 'rxjs';

export class MoveAnim {
  constructor(
    public entityId: number,
    public start: Position,
    public end: Position,
    public durationMs: number,
  ) {}
}

class MoveProgress {
  constructor(
    public currentTime: number, 
    public startPos: Position,
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

  private viewState = new Map<number, {sprite: PIXI.Sprite, hide: boolean}>();
  // private dijkstraRegister = new Map<Position, PIXI.Sprite>();
  private lightRegister = new Map<number, PIXI.Sprite>();

  private targetRenderSize: Dimensions;

  private runningAnims = new Map<number, MoveProgress>();
  private animCounter: number = 0;

  private spriteCreateSubscription: Subscription;

  constructor(
    private ecs: EcsService
  ) { }

  init(width: number, height: number): void {
    if ( this.spriteCreateSubscription ) {
      this.spriteCreateSubscription.unsubscribe();
    }

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
      this.ecs.em.each(
        (e: Entity, r: Renderable) => {
          this.updateSpriteRegister(e.id(), r);
        }, Renderable
      );
  
      this.spriteCreateSubscription = this.ecs.em.monitorComponentType(
        Renderable, 
        (change: ComponentChange<Renderable>) => this.updateSpriteRegister(change.id, change.c)
      );

      this.pixiApp.ticker.add( () => this.doRenderCycle() );
    });

    this.setPixiScale(width, height);
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

  doRenderCycle(): void {
    this.updateViewState();
    this.handleAnimations();
    this.renderLoop();
  }

  updateViewState(force = false): void {
    if ( this.ecs.viewStateDirty || force) {
      console.log(`building view state`);
      this.ecs.em.each( (e: Entity, p: Position, r: Renderable) => {
        
        let entry = this.viewState.get(e.id());
        entry.hide = false;
        entry.sprite.position.set(...this.modelToViewPos(p));
        this.adjustSprite(entry.sprite, e.id(), r, p);

      }, Position, Renderable);

      this.ecs.viewStateDirty = false;
    }
  }

  private updateSpriteRegister(id: number, r?: Renderable) {
    if ( ! r ) {
      console.log(`removing sprite from view state`);
      this.viewState.delete(id);
      this.runningAnims.delete(id);
    } else {
      // console.log(`Creating new sprite in view state`);
      const texture = r.smaller ? this.smallTextures[r.image] : this.textures[r.image];
      let sprite = new PIXI.Sprite(texture);
      this.viewState.set(id, {sprite: sprite, hide: true});
    }
  }

  private handleAnimations(): void {
    const dt = this.pixiApp.ticker.elapsedMS;
    let toRemove: number[] = [];
    let count = 0;
    this.ecs.em.each((e: Entity, anim: MoveAnimation) => {
      console.log(`got move anim`);
      let progress = this.runningAnims.get(e.id());
      if ( ! progress || ! deepEqual(progress.startPos, anim.start) ) {
        progress = new MoveProgress(0, anim.start);
        this.runningAnims.set(e.id(), progress);

      } else if (count === 0) {
        progress.currentTime += dt;
        let spriteState = this.viewState.get(e.id());
        spriteState.hide = false;
        let sprite = spriteState.sprite;
        if ( progress.currentTime <= anim.durationMs ) {
          console.log(`moving`)
          const vecToTarget = anim.start.subtract(anim.end);
          const elapsedSecs = progress.currentTime;
          const progressRatio = elapsedSecs / anim.durationMs;
          console.log(`progress: ${progressRatio}`);
          const {x, y} = vecToTarget.multiply(progressRatio * this.TILE_SIZE).add(anim.start.multiply(this.TILE_SIZE));
  
          sprite.position.set(x, y);
  
        } else {
          console.log(`current: ${progress.currentTime} vs length: ${anim.durationMs}`);
          sprite.position.set(anim.end.x * this.TILE_SIZE, anim.end.y * this.TILE_SIZE);
          toRemove.push(e.id());
          this.runningAnims.delete(e.id());
          this.ecs.em.removeComponent(e.id(), MoveAnimation);
        }
      }
      ++count;
    }, MoveAnimation);

  }

  private renderLoop(): void {
    this.pixiApp.stage.destroy();
    this.pixiApp.stage = new PIXI.Container();


    let renderables = this.ecs.em.matching(Renderable, Position);
    renderables.sort( (lhs: Entity, rhs: Entity) => lhs.component(Renderable).zOrder - rhs.component(Renderable).zOrder);

    const knowledge = this.ecs.em.matching(Knowledge).reduce( (accum, curr) => curr, null );
    const positionKnowledge = knowledge ? knowledge.component(Knowledge).positions : null;

    for (const e of renderables) {
      const [r, p] = e.components(Renderable, Position);
      const phy = e.has(Physical) ? e.component(Physical) : null;
      let {sprite, hide} = this.viewState.get(e.id());
      if ( hide ) {
        continue;
      }
      if ( ! sprite ) {
        console.error(`Got renderable with no active sprite!`);
        console.error(`Entity: ${e.id()}, image: ${r.image}`);
      }
      this.pixiApp.stage.addChild(sprite);

      if (positionKnowledge && phy) {
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
        const lightLevel = this.ecs.em.matchingIndex(currPos).filter( (e: Entity) => e.has(LightLevel))
                                                             .reduce( (accum, curr) => curr, null);
        
        if (posKnown === KnownState.CURRENT) {
          sprite.visible = true;
          const lightRgb = lightLevel ? +convertRgb(lightLevel.component(LightLevel).level) : +'0x000000';
          sprite.tint = lightRgb;
        } else if (posKnown === KnownState.REMEMBERED) {
          if (phy.dynamism === Dynamism.STATIC) {
            sprite.visible = true;
            const lightRgb = lightLevel ? +convertRgb(lightLevel.component(LightLevel).level) : +'0x000000';
            sprite.tint = lightRgb;
          } else {
            sprite.visible = false;
          }
        } else {
          sprite.visible = false;
        }
      }
    } // display of Renderables

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
    //       c.phy * this.TILE_SIZE + (this.TILE_SIZE * 0.5)
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

  private modelToViewPos(pos: Position): [number, number] {
    return [pos.x * this.TILE_SIZE, pos.y * this.TILE_SIZE];
  }
}
