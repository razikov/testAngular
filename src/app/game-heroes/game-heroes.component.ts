import { Component, OnInit } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';
import { GameHandler } from '../game.v4';
// import { Game, PlayerAI, Player, Dice, GameContext } from '../game.v3';
// import { ContextGame, ContextRound, ContextStep, Player } from '../game.v2';

@Component({
  selector: 'app-game-heroes',
  templateUrl: './game-heroes.component.html',
  styleUrls: ['./game-heroes.component.scss']
})
export class GameHeroesComponent implements OnInit {
  firstManual = false;
  secondManual = false;
  firstChangeHero = null;
  secondChangeHero = null;
  errors = [];
  heroes: Hero[];
  firstPlayer;
  secondPlayer;
  gameHandler: GameHandler;

  context = null;
  historyContext = new Map();
  historyIndex = 0;
  maxHistoryIndex = 0;
  
  constructor(
    private heroService: HeroService,
  ) {
    this.gameHandler = new GameHandler();
  }

  ngOnInit(): void {
    this.getHeroes();
  }

  getHeroes(): void {
    this.heroService.getHeroes()
        .subscribe(heroes => {
          this.heroes = heroes;
        });
  }

  firstChange($event) {
    let id = $event.value;
    for (const hero of this.heroes) {
      if (hero.id === id) {
        this.firstChangeHero = hero;
        break;
      }
    }
  }

  secondChange($event) {
    let id = $event.value;
    for (const hero of this.heroes) {
      if (hero.id === id) {
        this.secondChangeHero = hero;
        break;
      }
    }
  }

  prevHistory() {
    if (this.historyIndex == 0) {
      return;
    }
    this.historyIndex -= 1;
    this.context = this.historyContext.get(this.historyIndex);
  }

  nextHistory() {
    if (this.historyIndex == this.maxHistoryIndex) {
      return;
    }
    this.historyIndex += 1;
    this.context = this.historyContext.get(this.historyIndex);
  }

  alarmExit() {
    this.gameHandler.alarmExit = true;
  }

  setGameDelay(value) {
    this.gameHandler.delay = parseInt(value);
  }

  game() {
    if (this.validateGame()) {
      let i = 0;
      let game = this.gameHandler;
      this.firstPlayer = game.addFirstPlayer(this.firstManual, this.firstChangeHero);
      this.secondPlayer = game.addSecondPlayer(this.secondManual, this.secondChangeHero);
      game.context.onChangeEvent$.subscribe({
        next: (v) => {
          if (v == null) {
            return
          }
          console.log('forState: ', v.state.name, v);
          this.historyIndex = this.maxHistoryIndex = i;
          this.historyContext.set(this.maxHistoryIndex, v);
          this.context = v;
          i++;
        }
      });
      game.run();
    } else {
      console.log('errors')
    }
  }

  validateGame() {
    this.errors = [];
    if (this.firstChangeHero === null) {
      this.errors.push('first hero must be select')
    }
    if (this.secondChangeHero === null) {
      this.errors.push('second hero must be select')
    }
    return this.errors.length === 0;
  }

}
