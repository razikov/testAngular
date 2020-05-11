
// ============== src/app/gameHeroes.actions.ts
import { createAction } from '@ngrx/store';

export const increment = createAction('[Game Hero Component] Increment');
export const decrement = createAction('[Game Hero Component] Decrement');
export const reset = createAction('[Game Hero Component] Reset');

// ============== src/app/gameHeroes.reducer.ts
import { createReducer, on } from '@ngrx/store';
// import { increment, decrement, reset } from './counter.actions';
 
export const initialState = 0;
 
const _counterReducer = createReducer(initialState,
  on(increment, state => state + 1),
  on(decrement, state => state - 1),
  on(reset, state => 0),
);
 
export function counterReducer(state, action) {
  return _counterReducer(state, action);
}