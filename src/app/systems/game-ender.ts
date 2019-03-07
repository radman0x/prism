import { System, EntityManager, Entity } from 'rad-ecs';
import { Subject } from 'rxjs';
import { EndGame, Conditional } from '../components.model';
import { ConditionHandler } from './system-utils';


export class GameEnder implements System {
  private endEvent = new Subject();
  constructor(
    callback: () => void
  ) {
    this.endEvent.subscribe(callback);
  }

  update(em: EntityManager): void {
    em.matching(EndGame).forEach( (e: Entity) => {
      if ( e.has(Conditional) ) {
        if ( ConditionHandler.handleCondition(
          e.component(Conditional).condition, 
          e, 
          em) 
        ) {
          console.log(`EndGame condition was triggered!`);
          this.endEvent.next();
        }
      }
    });
  }
}