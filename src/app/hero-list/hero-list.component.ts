import { Component, OnInit } from '@angular/core';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';
import { MessageService } from '../message.service';
import { HeroRemoveComponent } from '../hero-remove/hero-remove.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
//import { I18n } from '@ngx-translate/i18n-polyfill';
// import { Game } from '../game';
import { Game } from '../game.v2';

@Component({
  selector: 'app-hero-list',
  templateUrl: './hero-list.component.html',
  styleUrls: ['./hero-list.component.scss']
})
export class HeroListComponent implements OnInit {
    heroes: Hero[];
//    selectedHero: Hero;

    constructor(
      public dialog: MatDialog,
//      public i18n: I18n,
      private snackBar: MatSnackBar,
      private heroService: HeroService,
      private messageService: MessageService
    ) { }

    ngOnInit(): void {
      this.getHeroes();
    }

    getHeroes(): void {
      this.heroService.getHeroes()
          .subscribe(heroes => this.heroes = heroes);
    }

//    selectHero(hero) {
//        this.selectedHero = hero;
//        this.messageService.add(`HeroService: Selected hero id=${hero.id}`);
//    }

    add(name: string): void {
      name = name.trim();
      if (!name) { return; }
      this.heroService.addHero({ name } as Hero)
        .subscribe(hero => {
          this.heroes.push(hero);
        });
    }
  
    delete(hero: Hero): void {
        const dialogRef = this.dialog.open(HeroRemoveComponent);
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.heroService.deleteHero(hero).subscribe(() => {
                this.heroes = this.heroes.filter(h => h !== hero);
                
                const config: any = new MatSnackBarConfig();
                config.duration = 3000;
                let message = 'Hero removed'; //this.i18n({value: 'Hero removed', id: '@@heroRemoved'});
                let action = 'Ok'; //this.i18n({value: 'Ok', id: '@@ok'});
                this.snackBar.open(message, action, config);
            });
          }
        });
    }

    // game() {
    //   let game = new Game(this.heroes[0], this.heroes[1]);
    //   game.run();
    //   game.flow();
    // }

}
