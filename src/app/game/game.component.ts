import { Dimensions } from './../../utils';
import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('fullScreen') fullScreen: ElementRef;
  @ViewChild('navbar')     navbar: ElementRef;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit(): void {

  }

  playAreaSize(): Dimensions {
    let fullSize = (this.fullScreen.nativeElement as HTMLDivElement).getBoundingClientRect();
    let navSize =  (this.navbar.nativeElement as HTMLDivElement).getBoundingClientRect();

    return {
      width: fullSize.width,
      height: fullSize.height - navSize.height
    }
  }
}
