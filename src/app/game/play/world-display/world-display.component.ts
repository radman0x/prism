import { Component, OnInit, Input, AfterViewInit, ViewChild, ElementRef, OnChanges, OnDestroy } from '@angular/core';
import { Dimensions } from 'src/utils';

import { PixiRendererService } from '../pixi-renderer.service';

@Component({
  selector: 'app-world-display',
  templateUrl: './world-display.component.html',
  styleUrls: ['./world-display.component.css']
})
export class WorldDisplayComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input('dimensions') dimensions: Dimensions;
  @ViewChild('renderElement') renderElement: ElementRef;

  private HACK_REDUCE_HEIGHT = 6; // using exact values causes scrollbars to be displayed which then changes the available space

  constructor(
    private pixiService: PixiRendererService
  ) {}

  ngOnInit() {
    this.pixiService.init(this.dimensions.width, this.dimensions.height - this.HACK_REDUCE_HEIGHT); 
  }

  ngAfterViewInit() {
    (this.renderElement.nativeElement as HTMLDivElement).appendChild(this.pixiService.getRenderView());
  }

  ngOnChanges() {
    if (this.pixiService.running()) {
      this.pixiService.resize(this.dimensions.width, this.dimensions.height - this.HACK_REDUCE_HEIGHT);
    }
  }

  ngOnDestroy() {
    this.pixiService.reset();
  }

  size(): {} {
    return {
      width:  `${this.dimensions.width}.px`,
      height: `${this.dimensions.height}.px`,
    }
  }


}
