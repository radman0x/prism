import { AnimationScheduler } from "./../../systems/animation-scheduler";
import { DijkstraCalculator } from "./../../systems/dijkstra-calculator";
import {
  PlayerControl,
  InputHandler,
  ChooseTarget
} from "./input-handler.model";
import {
  Health,
  Sight,
  Dynamism,
  Velocity,
  Aimed,
  Combat,
  Player,
  Clock,
  AI,
  Conditional,
  Renderable,
  Position,
  Size,
  Physical,
  Proximity,
  EndGame,
  CompositeLink,
  ParentLink,
  Spawner,
  IncrementTime,
  Destructible,
  DijkstraMap,
  LightSource,
  LightStrength
} from "./../../components.model";
import { Movement } from "../../systems/movement";
import {
  Dimensions,
  popRandomElement,
  randomElement,
  ValueMap
} from "./../../../utils";
import {
  Component,
  OnInit,
  Input,
  HostListener,
  Output,
  OnChanges
} from "@angular/core";
import { EcsService } from "src/ecs.service";

import * as ROT from "rot-js";
import { Room } from "rot-js/lib/map/features";
import { FOVManager } from "src/app/systems/fov.model";
import { Projectiles } from "src/app/systems/projectiles";
import { Reaper } from "src/app/systems/reaper";
import { EntityManager, Entity } from "rad-ecs";
import { CombatHandler } from "src/app/systems/combat-handler";
import { TimeFlow } from "src/app/systems/time-flow";
import { AIController } from "src/app/systems/ai-controller";

import { GameEnder } from "src/app/systems/game-ender";
import { Subject } from "rxjs";
import { Spawn } from "src/app/systems/spawn";
import { Dismantle } from "src/app/systems/dismantle";
import { randomPosInRoom } from "src/rot-utils";
import { PixiRendererService } from "./pixi-renderer.service";
import { Lighting } from "src/app/systems/lighting";
import { MoveResultHandler } from "src/app/systems/move-result-handler";

@Component({
  selector: "app-play",
  templateUrl: "./play.component.html",
  styleUrls: ["./play.component.css"]
})
export class PlayComponent implements OnInit, OnChanges {
  @Input("dimensions") dimensions: Dimensions;
  @Output("playFinished") playFinished = new Subject();

  public playerId: number;
  public wallclockId: number;

  private worldDisplayDimensions: Dimensions;
  private SIDEBAR_WIDTH = 200;

  private LEVEL_WIDTH = 44;
  private LEVEL_HEIGHT = 21;

  private inputState: InputHandler;

  constructor(
    private ecs: EcsService,
    private renderService: PixiRendererService
  ) {}

  ngOnInit() {
    this.initLevel();

    this.ecs.addSystemAndUpdate(new Lighting());
    this.ecs.addSystem(new Spawn(this.wallclockId));
    this.ecs.addSystem(new AIController(this.wallclockId));
    this.ecs.addSystem(new CombatHandler());
    this.ecs.addSystem(new Dismantle());
    this.ecs.addSystem(new Movement());
    this.ecs.addSystem(new MoveResultHandler());
    this.ecs.addSystemAndUpdate(new FOVManager());
    this.ecs.addSystemAndUpdate(new DijkstraCalculator());
    this.ecs.addSystem(new Projectiles(this.renderService));
    this.ecs.addSystem(new Reaper());
    this.ecs.addSystem(new TimeFlow());
    this.ecs.addSystem(new GameEnder(() => this.playFinished.next()));

    this.ecs.setAnimScheduler(
      new AnimationScheduler(
        this.renderService,
        () => (this.ecs.viewStateDirty = true)
      )
    );

    this.placePortal(
      this.ecs.em.get(this.playerId).component(DijkstraMap).distanceMap,
      this.ecs.em
    );

    this.inputState = new PlayerControl(
      this.playerId,
      this.ecs,
      this.renderService,
      (h: InputHandler) => (this.inputState = h)
    );

    this.worldDisplayDimensions = new Dimensions(
      this.dimensions.width - this.SIDEBAR_WIDTH,
      this.dimensions.height
    );
  }

  ngOnChanges(): void {
    this.worldDisplayDimensions = new Dimensions(
      this.dimensions.width - this.SIDEBAR_WIDTH,
      this.dimensions.height
    );
  }

  worldDisplaySize(): Dimensions {
    return this.worldDisplayDimensions;
  }

  sidebarSize(): {} {
    return {
      width: `${this.SIDEBAR_WIDTH}px`,
      height: `${this.dimensions.height}px`
    };
  }

  private initLevel(): void {
    let world = new ROT.Map.Uniform(this.LEVEL_WIDTH, this.LEVEL_HEIGHT, {
      roomDugPercentage: 0.9
    });

    let em = this.ecs.em;
    world.create((x: number, y: number, contents: number) => {
      em.createEntity(
        new Position(x, y, -1),
        new Renderable("Floor-48.png", 0),
        new Physical(Size.FILL, Dynamism.STATIC)
      );

      if (contents === 1) {
        em.createEntity(
          new Position(x, y, 0),
          new Renderable("Wall-188.png", 1),
          new Physical(Size.FILL, Dynamism.STATIC)
        );
      }
    });

    let rooms = world.getRooms();
    let playerRoom = popRandomElement(rooms);
    let playerPos = new Position(
      playerRoom.getCenter()[0],
      playerRoom.getCenter()[1],
      0
    );
    console.log(`player pos: ${playerRoom.getCenter()}`);
    this.playerId = this.createPlayer(playerPos, em);
    console.log(`Player ID: ${this.playerId}`);

    em.createEntity(
      new Position(playerPos.x - 1, playerPos.y, 0),
      new Renderable("Decor0-65.png", 5),
      new LightSource(LightStrength.HIGH),
      new Physical(Size.SMALL, Dynamism.STATIC)
    );

    for (let room of rooms) {
      em.createEntity(
        new Position(room.getCenter()[0], room.getCenter()[1], 0),
        new Renderable("Decor0-65.png", 5),
        new LightSource(LightStrength.HIGH),
        new Physical(Size.SMALL, Dynamism.STATIC)
      );
    }

    this.placeSpawners(rooms, em);

    let enemyRoom = popRandomElement(rooms);
    console.log(`Enemy pos: ${enemyRoom.getCenter()}`);

    this.createEnemy(
      new Position(enemyRoom.getCenter()[0], enemyRoom.getCenter()[1], 0),
      em
    );
    this.createEnemy(
      new Position(enemyRoom.getCenter()[0] + 1, enemyRoom.getCenter()[1], 0),
      em
    );

    this.wallclockId = em.createEntity(new Clock("wallclock", 0)).id;
  }

  private createPlayer(pos: Position, em: EntityManager): number {
    return em.createEntity(
      pos,
      new Renderable("Player0-22.png", 11),
      new Physical(Size.MEDIUM, Dynamism.DYNAMIC),
      new Sight(100),
      new Combat(8, 5, 4),
      new Health(100, 100),
      new Player(),
      new LightSource(LightStrength.HIGH)
    ).id;
  }
  private createEnemy(pos: Position, em: EntityManager): number {
    return em.createEntity(
      pos,
      new Renderable("Undead0-41.png", 10),
      new Health(10, 10),
      new Physical(Size.MEDIUM, Dynamism.DYNAMIC),
      new Combat(6, 4, 0),
      new AI(0, 150)
    ).id;
  }

  private createSpawner(pos: Position, em: EntityManager): number {
    return em.createEntity(
      pos,
      new Renderable("Decor0-126.png", 2),
      new Health(20, 20),
      new Physical(Size.LARGE, Dynamism.STATIC),
      new Destructible(),
      new Spawner(
        [
          new Renderable("Undead0-41.png", 10),
          new Health(10, 10),
          new Physical(Size.MEDIUM, Dynamism.DYNAMIC),
          new Combat(6, 4, 0),
          new AI(0, 150)
        ],
        100,
        0,
        7
      )
    ).id;
  }

  private posAvailable = (p: Position, em: EntityManager) => {
    return (
      em.matchingIndex(p).filter((e: Entity) => {
        return (
          e.component(Position).z === 0 &&
          e.has(Physical) &&
          e.component(Physical).size >= Size.MEDIUM
        );
      }).length === 0
    );
  };

  private placeSpawners(rooms: Room[], em: EntityManager): void {
    const N_SPAWNERS = rooms.length - 2;
    for (let i = 0; i < N_SPAWNERS; ++i) {
      const room = randomElement(rooms);
      this.createSpawner(
        randomPosInRoom(room, (p: Position) => this.posAvailable(p, em)),
        em
      );
    }
  }

  private placePortal(
    distanceMap: ValueMap<Position, number>,
    em: EntityManager
  ) {
    let orderedFurthest: [Position, number][] = [];
    for (let [p, d] of distanceMap) {
      orderedFurthest.push([p, d]);
    }
    orderedFurthest.sort(
      (lhs: [Position, number], rhs: [Position, number]) => rhs[1] - lhs[1]
    );
    for (const [p, d] of orderedFurthest) {
      if (this.posAvailable(p, em)) {
        let portalId = em.createEntity(
          p,
          new Renderable("Door0-41.png", 5),
          new Physical(Size.LARGE, Dynamism.STATIC)
        ).id;
        let portalActionId = em.createEntity(
          new Conditional(new Proximity(0, this.playerId)),
          new EndGame()
        ).id;
        em.setComponent(portalId, new CompositeLink(portalActionId));
        em.setComponent(portalActionId, new ParentLink(portalId));
        return; // only need one
      }
    }
  }

  private handleKey(key: string): void {
    const changeState = (h: InputHandler) => {
      this.inputState = h;
    };

    if (!this.ecs.em.exists(this.playerId)) {
      console.log(`player is gone yo :O`);
      return;
    }
    let consumePress = false;
    if (this.inputState) {
      consumePress = this.inputState.handleKey(key);
    }
    if (!consumePress && key === "/") {
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
          this.ecs.em.setComponent(this.playerId, new IncrementTime(100));
          this.ecs.viewStateDirty = true;
          this.ecs.update();
          this.ecs.update(true);
        },
        this.ecs,
        this.renderService,
        changeState
      );
      return;
    }
  }

  @HostListener("window:keypress", ["$event"])
  handleMoveInput(e: KeyboardEvent) {
    console.log(`Key input: ${e.key}`);
    if (this.inputState) {
      this.handleKey(e.key);
    }
  }

  @HostListener("window:keyup.escape", ["$event"])
  handleEsc(e: KeyboardEvent) {
    if (this.inputState) {
      this.handleKey("Escape");
    }
  }

  @HostListener("window:keydown", ["$event"])
  handleArrows(e: KeyboardEvent) {
    const ARROWS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    const arrowKey = ARROWS.find((s: string) => s === e.key);
    if (arrowKey && this.inputState) {
      console.log(`pushing arrow key: ${arrowKey}`);
      this.inputState.handleKey(arrowKey);
    }
  }
}
