import { Component, Input, OnInit } from '@angular/core';
import { PlayerAI } from '../game.v4';

@Component({
  selector: 'app-game-player',
  templateUrl: './game-player.component.html',
  styleUrls: ['./game-player.component.scss']
})
export class GamePlayerComponent implements OnInit {
  @Input() context;
  @Input() firstPlayer;
  @Input() secondPlayer;

  constructor() { }

  ngOnInit(): void {
  }

  getStyleCard(playerIndex, player) {
    let style = 'margin: 8px; min-width:400px;';
    if (this.context.loserPlayerIndex === null || player === undefined) {
      return style;
    }
    if (this.context.winerPlayerIndex == playerIndex) {
      style += 'background:palegreen;';
    } else if (this.context.loserPlayerIndex == playerIndex && player.isDie) {
      style += 'background:lightcoral;';
    } else if (this.context.loserPlayerIndex == playerIndex) {
      style += 'background:antiquewhite;';
    }
    return style;
  }

  playerIsHuman(player) {
    return !(player instanceof PlayerAI);
  }
}
