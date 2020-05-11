import { Component, OnInit } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { HeroService } from '../hero.service';
import { Hero } from '../hero';
import { Game, PlayerAI, Player, Dice, GameContext } from '../game.v3';
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

  context = null;
  historyContext = new Map();
  historyIndex = 0;
  maxHistoryIndex = 0;
  
  constructor(
    private heroService: HeroService,
  ) {

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

  game() {
    if (this.validateGame()) {
      let playerFactory = (isManual, hero, dice) => {
        if (isManual) {
          return new Player(hero, dice);
        } else {
          return new PlayerAI(hero, dice);
        }
      }
      
      let dice = new Dice(1,6);
      let firstPlayer = playerFactory(this.firstManual, this.firstChangeHero, dice);
      let secondPlayer = playerFactory(this.secondManual, this.secondChangeHero, dice);
      let context = new GameContext();
      context.setFirstPlayer(firstPlayer);
      context.setSecondPlayer(secondPlayer);
      let game = new Game(context, dice);
      let i = 0;
      context.onChange$.subscribe({
        next: (v) => {this.historyIndex = this.maxHistoryIndex = i++; this.historyContext.set(this.maxHistoryIndex, v); console.log(v.state, v)}
      });
      let playerEventHandler = {
        next: (v) => {
          if (v == null) { // пропустить начальное значение
            return;
          }
          console.log(v);
          switch (v.name) {
            case 'rolledSpeed':
              console.log('rolledSpeed: ' + v.roll);
              game.onRolledSpeedHandler(v.roll, v.player);
              break;
            case 'rolledAttack':
              console.log('rolledAttack: ' + v.roll);
              game.onRolledBattleHandler(v.roll, v.player);
              break;
            case 'rolledDefence':
              console.log('rolledDefence: ' + v.roll);
              game.onRolledBattleHandler(v.roll, v.player);
              break;
            case 'choosedDamageSet':
              console.log('choosedDamageSet: ' + v.damageSet);
              game.onChoosedDamageSetHandler(v.damageSet, v.player);
              break;
            case 'rolledRecovery':
              console.log('rolledRecovery: ' + v.roll);
              // game.onRolledRecoveryHandler(v.roll, v.player);
              break;
            default:
              console.warn("event not support: " + v.name);
              break;
          }
        }
      };
      firstPlayer.onRolledDice$.subscribe(playerEventHandler);
      secondPlayer.onRolledDice$.subscribe(playerEventHandler);
      game.flow();
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
