import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
   debounceTime, distinctUntilChanged, switchMap, startWith
 } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Hero } from '../hero';
import { HeroService } from '../hero.service';
import { Location } from '@angular/common';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-hero-search',
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.scss']
})
export class HeroSearchComponent implements OnInit {
    heroes$: Observable<Hero[]>;
    heroFormControl: FormControl;
//    private searchTerms = new Subject<string>();

    constructor(
        private heroService: HeroService,
        private location: Location,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.heroFormControl = new FormControl();
    }
    
//    search(term: string): void {
//        this.searchTerms.next(term);
//    }

    ngOnInit(): void {
        this.heroes$ = this.heroFormControl.valueChanges.pipe(
            startWith(''),
            // wait 300ms after each keystroke before considering the term
            debounceTime(300),
            // ignore new term if same as previous term
            distinctUntilChanged(),
            // switch to new search observable each time the term changes
            switchMap((term: string) => this.heroService.searchHeroes(term)),
        );
        
//        this.heroes$ = this.searchTerms.pipe(
//            // wait 300ms after each keystroke before considering the term
//            debounceTime(300),
//            // ignore new term if same as previous term
//            distinctUntilChanged(),
//            // switch to new search observable each time the term changes
//            switchMap((term: string) => this.heroService.searchHeroes(term)),
//        );
    }
    
    onRedirect(event: MatAutocompleteSelectedEvent): void {
        let path = '/hero-details/' + event.option.id;
        console.log(this.route, path);
        this.router.navigate([path]);
    }

}


//
//  defaultHeroes: Array<Hero>;
//  heroFormControl: FormControl;
//  filteredHeroes: any;
//
//  constructor(private heroService: HeroService,
//              @Inject(ROUTES_CONFIG) public routesConfig: any) {
//    this.defaultHeroes = [];
//    this.heroFormControl = new FormControl();
//  }
//
//  ngOnInit() {
//    this.heroService.getHeroes().subscribe((heroes: Array<Hero>) => {
//      this.defaultHeroes = heroes.filter(hero => hero.default);
//
//      this.heroFormControl.valueChanges.pipe(
//        startWith(null as string),
//        map(value => this.filterHeroes(value)))
//        .subscribe(heroesFiltered => {
//          this.filteredHeroes = heroesFiltered;
//        });
//    });
//  }
//
//  filterHeroes(val: string): Hero[] {
//    return val ? this.defaultHeroes.filter(hero => hero.name.toLowerCase().indexOf(val.toLowerCase()) === 0 && hero.default)
//      : this.defaultHeroes;
//  }