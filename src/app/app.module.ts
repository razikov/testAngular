
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgModule, TRANSLATIONS, LOCALE_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule }    from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeroDetailsComponent } from './hero-details/hero-details.component';
import { HeroListComponent } from './hero-list/hero-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MessagesComponent } from './messages/messages.component';
import { HeroSearchComponent } from './hero-search/hero-search.component';
import { HeroRemoveComponent } from './hero-remove/hero-remove.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

import { I18n } from '@ngx-translate/i18n-polyfill'; // Перевод через pipe | translate
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import { GameHeroesComponent } from './game-heroes/game-heroes.component';
import { GameRoundComponent } from './game-round/game-round.component';
import { StoreModule } from '@ngrx/store';
import { GamePlayerComponent } from './game-player/game-player.component';

registerLocaleData(localeRu, 'ru-RU');

@NgModule({
  declarations: [
    AppComponent,
    HeroDetailsComponent,
    HeroListComponent,
    DashboardComponent,
    MessagesComponent,
    HeroSearchComponent,
    HeroRemoveComponent,
    GameHeroesComponent,
    GameRoundComponent,
    GamePlayerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatSnackBarModule,
    MatDialogModule,
    MatBadgeModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
    StoreModule.forRoot({}, {})
  ],
  providers: [
//    {
//      provide: TRANSLATIONS,
//      useFactory: (locale) => {
//        locale = locale || 'en';
//        return require(`raw-loader!../i18n/messages.${locale}.xlf`);
//      },
//      deps: [LOCALE_ID]
//    },
//    I18n
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
