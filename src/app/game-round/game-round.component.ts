import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-game-round',
  templateUrl: './game-round.component.html',
  styleUrls: ['./game-round.component.scss']
})
export class GameRoundComponent implements OnInit {
  @Input() rounds;
  
  constructor() { }

  ngOnInit(): void {
  }

}
