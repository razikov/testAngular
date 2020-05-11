import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
   debounceTime, distinctUntilChanged, switchMap, startWith
 } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-hex-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {
    width: 800;
    height: 600;
    viewBox: "-50 -50 100 100";
    children;
    
    constructor() {}

    ngOnInit(): void {}

}
