import { Position } from './app/components.model';
import { Injectable } from '@angular/core';

import { EntityManager, System } from 'rad-ecs';

@Injectable({
  providedIn: 'root'
})
export class EcsService {
  
  public em: EntityManager = new EntityManager();
  private systems: System[] = [];

  constructor() {
    this.em.indexBy(Position);
   }

  addSystem(s: System): void {
    this.systems.push(s);
  }

  addSystemAndUpdate(s: System): void {
    s.update(this.em);
    this.systems.push(s);
  }

  update(): void {
    for (let s of this.systems) {
      s.update(this.em);
    }
  }
}
