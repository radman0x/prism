import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { PlayComponent } from './game/play/play.component';
import { WorldDisplayComponent } from './game/play/world-display/world-display.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    PlayComponent,
    WorldDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
