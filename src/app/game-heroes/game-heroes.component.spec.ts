import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameHeroesComponent } from './game-heroes.component';

describe('GameHeroesComponent', () => {
  let component: GameHeroesComponent;
  let fixture: ComponentFixture<GameHeroesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameHeroesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameHeroesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
