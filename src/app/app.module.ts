import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { PlayComponent } from './game/play/play.component';
import { WorldDisplayComponent } from './game/play/world-display/world-display.component';
import { SidebarComponent } from './game/play/sidebar/sidebar.component';
import { PlayReportComponent } from './game/play-report/play-report.component';
import { TitleScreenComponent } from './game/title-screen/title-screen.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    PlayComponent,
    WorldDisplayComponent,
    SidebarComponent,
    PlayReportComponent,
    TitleScreenComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
