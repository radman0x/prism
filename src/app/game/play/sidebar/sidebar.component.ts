import { Entity } from 'rad-ecs';
import { Component, OnInit, Input } from '@angular/core';
import { Dimensions } from 'src/utils';
import { EcsService } from 'src/ecs.service';
import { Clock } from 'src/app/components.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input('dimensions') dimensions: Dimensions;
  @Input('wallClockId') wallClockId: number;

  private currentTurn_ = 0;

  constructor(
    private ecs: EcsService
  ) { }

  ngOnInit() {
    this.ecs.em.monitorEntity(this.wallClockId, (e: Entity | null) => {
      this.currentTurn_ = e.component(Clock).currentTick / 100;
    })
  }

  currentTurn(): number {
    return this.currentTurn_;
  }

}
