import { AnimationScheduler } from './app/systems/animation-scheduler';
import { Position, Renderable } from './app/components.model';
import { Injectable } from '@angular/core';

import { EntityManager, System, ComponentChange } from 'rad-ecs';

@Injectable({
  providedIn: 'root'
})
export class EcsService {
  
  public em: EntityManager = new EntityManager();
  private systems: System[] = [];
  public viewStateDirty = true;

  private animScheduler: AnimationScheduler;

  constructor() {
    this.em.indexBy(Position);
   }

  addSystem(s: System): void {
    this.systems.push(s);
  }

  setAnimScheduler(scheduler: AnimationScheduler): void {
    this. animScheduler = scheduler;
  }

  addSystemAndUpdate(s: System): void {
    s.update(this.em);
    this.systems.push(s);
  }

  update(animPush = false) {
    for (let s of this.systems) {
      s.update(this.em);
    }
    if (animPush) {
      this.animScheduler.update(this.em);
    }
  }
}
