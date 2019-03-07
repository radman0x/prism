import { Dimensions } from './../../utils';
import { Component, OnInit, Input, ElementRef, AfterViewInit, ViewChild } from '@angular/core';

enum GameState {
  TITLE,
  PLAY,
  REPORT
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('fullScreen') fullScreen: ElementRef;
  @ViewChild('navbar')     navbar: ElementRef;

  public GameState = GameState;
  public state = GameState.PLAY;

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

  endPlay(): void {
    this.state = GameState.REPORT;
  }
}
