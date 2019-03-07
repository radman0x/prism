import { Component, OnInit, Input } from '@angular/core';
import { Dimensions } from 'src/utils';

@Component({
  selector: '[app-play-report]',
  templateUrl: './play-report.component.html',
  styleUrls: ['./play-report.component.css']
})
export class PlayReportComponent implements OnInit {
  @Input('dimensions') dimensions: Dimensions;

  constructor() { }

  ngOnInit() {
  }

  reportSize(): {} {
    return {
      width: `${this.dimensions.width}px`,
      height: `${this.dimensions.height}px`,
    }
  }
}
