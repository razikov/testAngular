import { BehaviorSubject } from 'rxjs';
import { Hero } from './hero';
import { cloneDeep as lodashClonedeep } from 'lodash';
import { CONTEXT_NAME } from '@angular/compiler/src/render3/view/util';

interface PlayerI
{
    onRolledDice$: BehaviorSubject<any>;
    isWin: boolean;// del

    getHits(): number;
    takeDamage(damages);
    recovery(roll);
    isNeedRecovery(): boolean;

    rollSpeed();
    rollAttack();
    rollDefence();
    rollRecovery();
    chooseDamageSet(damageSet: string[]);
}

export class Player implements PlayerI
{
    hero: Hero;
    dice: Dice; // создаются одинаковые для игрока и игры
    currentAttack: number;
    currentDefence: number;
    currentSpeed: number;
    needRecovery: number;
    isDie: boolean;
    isWin: boolean;
    onRolledDice$: BehaviorSubject<any>;
    
    constructor(hero: Hero, dice: Dice = new Dice(1, 6)) {
        this.hero = hero;
        this.currentAttack = hero.attackDice;
        this.currentDefence = hero.defenceDice;
        this.currentSpeed = hero.speedDice;
        this.isDie = false;
        this.isWin = false;
        this.needRecovery = 0;
        this.dice = dice;
        this.onRolledDice$ = new BehaviorSubject(null);
    }

    rollAttack(): void {
        this.onRolledDice$.next({
            name: 'rolledAttack',
            roll: this.roll(this.dice, this.currentAttack),
            player: this
        });
    }

    rollDefence(): void {
        this.onRolledDice$.next({
            name: 'rolledDefence',
            roll: this.roll(this.dice, this.currentDefence),
            player: this
        });
    }

    rollSpeed(): void {
        this.onRolledDice$.next({
            name: 'rolledSpeed',
            roll: this.roll(this.dice, this.currentSpeed),
            player: this
        });
    }
    
    chooseDamageSet(damage) {
        this.onRolledDice$.next({
            name: 'choosedDamageSet',
            damageSet: [],
            player: this
        });
    }
    
    rollRecovery(): void {
        this.onRolledDice$.next({
            name: 'rolledRecovery',
            roll: this.roll(this.dice),
            player: this
        });
    }
    
    recovery(roll: number[]) {
        let value = roll.reduce((sum, current) => {
            return sum + current;
        }, 0);

        // правила для 1d6
        if (value >= 5) {
            this.needRecovery--;
        } else if (value <= 2) {
            this.isDie = true;
        }
        return this;
    }

    isNeedRecovery() {
        return !this.isDie && this.needRecovery !== 0;
    }

    roll(dice: Dice, count: number = 1): number[] {
        let roll = [];
        for (let index = 0; index < count; index++) {
            roll.push(dice.roll());
        }
        return roll;
    }
    
    takeDamage(damageSet: string[]) {
        damageSet.forEach(attr => {
            switch (attr) {
                case 'attack':
                    if (this.canLostDiceRule(this.currentAttack, this.getHits())) {
                        this.currentAttack--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'defence':
                    if (this.canLostDiceRule(this.currentDefence, this.getHits())) {
                        this.currentDefence--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'speed':
                    if (this.canLostDiceRule(this.currentSpeed, this.getHits())) {
                        this.currentSpeed--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                default: throw new Error("attribute " + attr + " does not exist");
            }
        });
        if (this.getHits() == 2) {
            this.needRecovery = 1;
        }
        if (this.getHits() == 1) {
            this.needRecovery = 2;
        }
        if (this.getHits() == 0) {
            this.isDie = true;
        }
    }

    getHits(): number {
        return this.currentAttack + this.currentDefence + this.currentSpeed;
    }

    canLostDiceRule(current: number, all: number) {
        let isLastDice = (current == 1 && [1,2,3].includes(all));
        let isCanLost = current > 1;
        return isCanLost || isLastDice;
    }
}

export class PlayerAI extends Player implements PlayerI
{
    rollAttack(): void {
        this.onRolledDice$.next({
            name: 'rolledAttack',
            roll: this.roll(this.dice, this.currentAttack),
            player: this
        });
    }

    rollDefence(): void {
        this.onRolledDice$.next({
            name: 'rolledDefence',
            roll: this.roll(this.dice, this.currentDefence),
            player: this
        });
    }

    rollSpeed(): void {
        this.onRolledDice$.next({
            name: 'rolledSpeed',
            roll: this.roll(this.dice, this.currentSpeed),
            player: this
        });
    }
    
    rollRecovery(): void {
        this.onRolledDice$.next({
            name: 'rolledRecovery',
            roll: this.roll(this.dice),
            player: this
        });
    }

    chooseDamageSet(damage) {
        let damageSet = this.generateDamageSet(damage);
        if (damageSet == []) {
            throw new Error("empty damage set: d=" + damage + " ds=" + damageSet);
        }
        this.onRolledDice$.next({
            name: 'choosedDamageSet',
            damageSet: this.generateDamageSet(damage),
            player: this
        });
    }

    generateDamageSet(damage: number): string[] {
        // TODO: добавить решаюшее дерево для AI
        let takeDamage = [];
        if (damage > this.getHits()) {
            damage = this.getHits();
        }
        let currentDices = [this.currentAttack, this.currentDefence, this.currentSpeed];
        let attrs = ['attack', 'defence', 'speed'];
        while(damage > 0) {
            let sum = currentDices.reduce(function(sum, current) {
                return sum + current;
            }, 0)
            while(true) {
                let rand = Math.floor(Math.random() * 3);
                let canLost = this.canLostDiceRule(currentDices[rand], sum);
                if (canLost) {
                    takeDamage.push(attrs[rand]);
                    currentDices[rand]--;
                    break;
                }
            }
            damage--;
        }
        return takeDamage;
    }
}

export class Dice
{
    min: number;
    max: number;

    // Максимум и минимум включаются
    constructor(min: number, max: number) {
        this.min = min;
        this.max = max;
    }

    roll() {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    }
}

interface GameState
{
    name: string;
    context: GameContext;

    next();
}
class BaseState
{
    context: GameContext;

    constructor(context) {
        this.context = context;
    }
}
class StartGame extends BaseState implements GameState
{
    static NAME = 'StartGame';
    name = 'StartGame';

    next() {
        this.context.state = new StartRound(this.context);
    }
}
class StartRound extends BaseState implements GameState
{
    static NAME = 'StartRound';
    name = 'StartRound';

    next() {
        this.context.startRound();
        this.context.state = new RollSpeed(this.context);
    }
}
class RollSpeed extends BaseState implements GameState
{
    static NAME = 'RollSpeed';
    name = 'RollSpeed';

    next() {
        this.context.resetSpeedRoll()
        this.context.state = new WaitRolledSpeed(this.context);
    }
}
class WaitRolledSpeed extends BaseState implements GameState
{
    static NAME = 'WaitRolledSpeed';
    name = 'WaitRolledSpeed';

    next() {
        if (this.context.hasRolledSpeed()) {
            this.context.state = new RolledSpeed(this.context);
        }
    }
}
class RolledSpeed extends BaseState implements GameState
{
    static NAME = 'RolledSpeed';
    name = 'RolledSpeed';

    next() {
        if (this.context.hasEqualRolledSpeed()) {
            this.context.state = new RollSpeed(this.context);
        }
        this.context.chooseFirstPlayer();
        this.context.state = new ActionsFirstPlayer(this.context);
    }
}
class ActionsFirstPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsFirstPlayer';
    name = 'ActionsFirstPlayer';

    next() {
        this.context.state = new WaitRolledAttackAndDefence(this.context);
    }
}
class ActionsSecondPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsSecondPlayer';
    name = 'ActionsSecondPlayer';

    next() {
        this.context.state = new WaitRolledAttackAndDefence(this.context);
    }
}
class WaitRolledAttackAndDefence extends BaseState implements GameState
{
    static NAME = 'WaitRolledAttackAndDefence';
    name = 'WaitRolledAttackAndDefence';

    next() {
        if (this.context.hasRolledAttackAndDefence()) {
            this.context.state = new RolledAttackAndDefence(this.context);
        }
    }
}
class RolledAttackAndDefence extends BaseState implements GameState
{
    static NAME = 'RolledAttackAndDefence';
    name = 'RolledAttackAndDefence';

    next() {
        this.context.calculateDamage()
        if (this.context.damage > 0) {
            this.context.state = new ChooseDamage(this.context);
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
        }
    }
}
class ChooseDamage extends BaseState implements GameState
{
    static NAME = 'ChooseDamage';
    name = 'ChooseDamage';

    next() {
        this.context.state = new WaitChoosedDamage(this.context);
    }
}
class WaitChoosedDamage extends BaseState implements GameState
{
    static NAME = 'WaitChoosedDamage';
    name = 'WaitChoosedDamage';

    next() {
        this.context.state = new ChoosedDamage(this.context);
    }
}
class ChoosedDamage extends BaseState implements GameState
{
    static NAME = 'ChoosedDamage';
    name = 'ChoosedDamage';

    next() {
        this.context.takeDamage()
        if (this.context.isEndGame()) {
            this.context.state = new ChoosedWinner(this.context);
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
        }
    }
}
class ChoosedWinner extends BaseState implements GameState
{
    static NAME = 'ChoosedWinner';
    name = 'ChoosedWinner';

    next() {
        this.context.changeWiner()
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
        } else {
            this.context.state = new EndGame(this.context);
        }
    }
}
class RollRecovery extends BaseState implements GameState
{
    static NAME = 'RollRecovery';
    name = 'RollRecovery';

    next() {
        this.context.state = new WaitRolledRecovery(this.context);
    }
}
class WaitRolledRecovery extends BaseState implements GameState
{
    static NAME = 'WaitRolledRecovery';
    name = 'WaitRolledRecovery';

    next() {
        this.context.state = new RolledRecovery(this.context);
    }
}
class RolledRecovery extends BaseState implements GameState
{
    static NAME = 'RolledRecovery';
    name = 'RolledRecovery';

    next() {
        this.context.recovery()
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
        } else {
            this.context.state = new EndGame(this.context);
        }
    }
}
class EndGame extends BaseState implements GameState
{
    static NAME = 'EndGame';
    name = 'EndGame';

    next() {
        console.warn('наградить!')
    }
}

export class GameContext
{
    static readonly FIRST_PLAYER = 0;
    static readonly SECOND_PLAYER = 1;

    i: number = 0;
    state: GameState;
    players: Map<number, PlayerI>;
    round: number;
    rollsSpeed: Map<number, number[]>;
    rollsSpeedValue: Map<number, number>;
    firstPlayerIndex: number; // ключ игрока
    firstPlayer: PlayerI;
    secondPlayerIndex: number; // ключ игрока
    secondPlayer: PlayerI;
    stepPlayerIndex: number; // определяет чей ход
    rollAttack: number[];
    rollDefence: number[];
    damage: number;
    damageSet: string[];
    rollRecovery: number[];
    winerPlayerIndex: number; // ключ игрока
    loserPlayerIndex: number; // ключ игрока
    onChange$: BehaviorSubject<GameContext>;

    constructor() {
        this.state = new StartGame(this);
        this.players = new Map();
        this.round = 0;
        this.onChange$ = new BehaviorSubject(this);
        this.onChange$.next(lodashClonedeep(this));
    }

    next() {
        this.state.next();
        this.onChange$.next(lodashClonedeep(this));
    }

    hasRolledSpeed(): boolean {
        return this.getFirstSpeedValue() !== undefined && this.getSecondSpeedValue() !== undefined;
    }

    hasEqualRolledSpeed(): boolean {
        return this.getFirstSpeedValue() === this.getSecondSpeedValue();
    }

    hasRolledAttackAndDefence(): boolean {
        return this.rollAttack !== null && this.rollDefence !== null;
    }

    isFirstPlayerAction(): boolean {
        return this.stepPlayerIndex == this.firstPlayerIndex;
    }

    isSecondPlayerAction(): boolean {
        return this.stepPlayerIndex == this.secondPlayerIndex;
    }

    isEndGame(): boolean {
        return !(this.getFirstPlayer().getHits() > 2 && this.getSecondPlayer().getHits() > 2);
    }

    isNeedRecovery(): boolean {
        return this.getLooserPlayer().isNeedRecovery();
    }

    recovery() {
        this.getLooserPlayer().recovery(this.rollRecovery);
    }

    setFirstPlayer(player) {
        if (this.players.has(GameContext.FIRST_PLAYER)) {
            console.warn("первый игрок был заменён");
        }
        player.storeGameId = GameContext.FIRST_PLAYER;
        this.players.set(GameContext.FIRST_PLAYER, player);
        this.onChange$.next(lodashClonedeep(this));
    }

    getFirstPlayer() {
        return this.players.get(GameContext.FIRST_PLAYER);
    }

    getFirstSpeedValue() {
        return this.rollsSpeedValue.get(GameContext.FIRST_PLAYER);
    }

    setSecondPlayer(player) {
        if (this.players.has(GameContext.SECOND_PLAYER)) {
            console.warn("второй игрок был заменён");
        }
        player.storeGameId = GameContext.SECOND_PLAYER;
        this.players.set(GameContext.SECOND_PLAYER, player);
        this.onChange$.next(lodashClonedeep(this));
    };

    getSecondPlayer() {
        return this.players.get(GameContext.SECOND_PLAYER);
    }

    getSecondSpeedValue() {
        return this.rollsSpeedValue.get(GameContext.SECOND_PLAYER);
    }

    getLooserPlayer() {
        return this.players.get(this.loserPlayerIndex);
    }

    getAttackPlayer() {
        if (this.isFirstPlayerAction()) {
            return this.getFirstPlayer();
        } else {
            return this.getSecondPlayer();
        }
    }

    getDefencePlayer() {
        if (this.isFirstPlayerAction()) {
            return this.getSecondPlayer();
        } else {
            return this.getFirstPlayer();
        }
    }

    startRound() {
        this.round++;
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
        this.firstPlayerIndex = null;
        this.firstPlayer = null;
        this.secondPlayerIndex = null;
        this.secondPlayer = null;
        this.stepPlayerIndex = null;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
        this.rollRecovery = null;
        this.winerPlayerIndex = null;
        this.loserPlayerIndex = null;
    }
    
    addSpeedRoll(roll: number[], player: PlayerI) {
        for (const [index, playerFromContext] of this.players) {
            if (player === playerFromContext) {
                this.rollsSpeed.set(index, roll);
                let speedValue = roll.reduce((sum, current) => {
                    return sum + current;
                }, 0);
                this.rollsSpeedValue.set(index, speedValue);
            }
        }
    }

    resetSpeedRoll() {
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
    }

    chooseFirstPlayer() {
        if (this.getFirstSpeedValue() >= this.getSecondSpeedValue()) {
            this.firstPlayer = lodashClonedeep(this.getFirstPlayer());
            this.firstPlayerIndex = GameContext.FIRST_PLAYER;
            this.secondPlayer = lodashClonedeep(this.getSecondPlayer());
            this.secondPlayerIndex = GameContext.SECOND_PLAYER;
        } else {
            this.firstPlayer = lodashClonedeep(this.getSecondPlayer());
            this.firstPlayerIndex = GameContext.SECOND_PLAYER;
            this.secondPlayer = lodashClonedeep(this.getFirstPlayer());
            this.secondPlayerIndex = GameContext.FIRST_PLAYER;
        }
    }

    initFirstStep() {
        this.setStep(this.firstPlayerIndex)
    }

    initSecondStep() {
        this.setStep(this.secondPlayerIndex)
    }

    private setStep(playerKey) {
        this.stepPlayerIndex = playerKey;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
    }

    addAttackRoll(roll, player: PlayerI) {
        for (const [index, playerFromContext] of this.players) {
            if (player === playerFromContext && index === this.stepPlayerIndex) {
                this.rollAttack = roll;
            }
        }
    }

    addDefenceRoll(roll, player: PlayerI) {
        for (const [index, playerFromContext] of this.players) {
            if (player === playerFromContext && index !== this.stepPlayerIndex) {
                this.rollDefence = roll;
            }
        }
    }

    calculateDamage(): void {
        // Если пул кубиков защиты меньше пула атаки надо добавить дефолтные кубики на 2
        this.rollAttack.sort((a: number, b: number) => b - a);
        this.rollDefence.sort((a: number, b: number) => b - a);
        let diffCountDices = this.rollAttack.length - this.rollDefence.length;
        let defence = lodashClonedeep(this.rollDefence); // TODO: найти клонирование полегче
        if (diffCountDices > 0) {
            for (let index = 0; index < diffCountDices; index++) {
                defence.push(2);
            }
        }
        let damage = 0;
        for (let index = 0; index < this.rollAttack.length; index++) {
            if (this.rollAttack[index] > defence[index]) {
                damage++;
            }
        }
        this.damage = damage;
    }

    addDamageSet(damageSet, player) { // TODO: можно по индексу в зависимости от раунда добавить?
        for (const [index, playerFromContext] of this.players) {
            if (player == playerFromContext) {
                this.damageSet = damageSet;
            }
        }
    }

    takeDamage() {
        if (this.isFirstPlayerAction()) {
            this.players.get(this.secondPlayerIndex).takeDamage(this.damageSet);
        } else {
            this.players.get(this.firstPlayerIndex).takeDamage(this.damageSet);
        }
    }

    addRecoveryRoll(roll, player) { // TODO: можно по индексу в зависимости от раунда добавить?
        for (const [index, playerFromContext] of this.players) {
            if (player == playerFromContext) {
                this.rollRecovery = roll;
            }
        }
    }

    changeWiner() {
        if (this.getFirstPlayer().getHits() > 2) {
            this.winerPlayerIndex = GameContext.FIRST_PLAYER;
            this.loserPlayerIndex = GameContext.SECOND_PLAYER;
            this.getFirstPlayer().isWin = true;
        } else {
            this.winerPlayerIndex = GameContext.SECOND_PLAYER;
            this.loserPlayerIndex = GameContext.FIRST_PLAYER;
            this.getSecondPlayer().isWin = true;
        }
    }
}

// Правила:
// 
// Бой идёт до тех пор пока один из противников не повержен (сумма кубиков больше 3)
// 0 кубиков и меньше смерть героя, 1 кубик тяжелое ранение, 2 кубика ранение.
// восстановление ранения: серия бросков d6, если выпадает 5,6 вылечен, 3,4 кидает дальше, 1,2 умер.
// сначало восстанавливается тяжелое ранение, потом обычное
// 
// бой состоит из раундов.
// раунд это 2 действия, порядок не важен, оба не обязательны:
// 1) перемещение
// 2) атака (имеет радиус)
//
// -порядок хода определяется броском кубиков скорости, у кого больше тот решает кто ходит первым
//
// атака - это бросок кубиков d6 атаки против броска кубиков d6 защиты противника
// повреждения от атаки вычисляются так: 
// отсортированный бросок атаки сравнивается с отсортированным броском защиты
// если атака строго больше защиты, то наносится повреждение
// если защиты нет, то повреждение добавляется если атака 3 и больше
//
// за каждое полученное повреждение игрок обязан снять один любой кубик.
// нельзя снимать последний кубик если возможно снять другие кубики.
// 

export class Game
{
    dice: Dice;
    state: string;
    context: GameContext;
    onPlayerEvent$: BehaviorSubject<any>;

    constructor(context: GameContext, dice: Dice = new Dice(1, 6)) {
        this.dice = dice;
        this.context = context;
        this.onPlayerEvent$ = new BehaviorSubject(null);
    }

    flow() {
        switch (this.context.state.name) {
            case StartGame.NAME:
            case StartRound.NAME:
            case RolledSpeed.NAME:
            case RolledAttackAndDefence.NAME:
            case ChoosedDamage.NAME:
            case RolledRecovery.NAME:
            case ChoosedWinner.NAME:
                this.context.next()
                this.flow();
                break;
            case WaitRolledSpeed.NAME:
            case WaitRolledAttackAndDefence.NAME:
            case WaitChoosedDamage.NAME:
            case WaitRolledRecovery.NAME:
                this.context.state.next()
                break;
            case RollSpeed.NAME:
                this.context.next()
                this.rollSpeed();
                break;
            case ActionsFirstPlayer.NAME:
                this.context.initFirstStep()
                this.context.next()
                this.rollAttackAndDefence()
                break;
            case ActionsSecondPlayer.NAME:
                this.context.initSecondStep()
                this.context.next()
                this.rollAttackAndDefence()
                break;
            case ChooseDamage.NAME:
                this.context.next();
                this.chooseDamageSet();
                break;
            case RollRecovery.NAME:
                this.context.next()
                this.rollRecovery()
                break;
            case EndGame.NAME:
                return this.context;
            default: throw new Error("incorrect state: " + this.context.state.name + " in flow()");
        }
    }

    rollSpeed() {
        for (const [index, player] of this.context.players) {
            this.onPlayerEvent$.next({
                name: 'rollSpeed',
                player: player,
            })
        }
    }

    rollAttackAndDefence() {
        this.onPlayerEvent$.next({
            name: 'rollAttack',
            player: this.context.getAttackPlayer(),
        })
        this.onPlayerEvent$.next({
            name: 'rollDefence',
            player: this.context.getDefencePlayer(),
        })
    }

    chooseDamageSet(): void {
        this.onPlayerEvent$.next({
            name: 'chooseDamageSet',
            damage: this.context.damage,
            player: this.context.getDefencePlayer(),
        })
    }

    rollRecovery(): void {
        this.onPlayerEvent$.next({
            name: 'rollRecovery',
            player: this.context.getLooserPlayer(),
        })
    }

    onRolledRecoveryHandler(roll: number[], player: PlayerI) {
        if (this.context.state.name !== WaitRolledRecovery.NAME) {
            console.warn(this.context.state.name + " != " + WaitRolledRecovery.NAME);
            return;
        }
        this.context.addRecoveryRoll(roll, player);
        this.context.next();
        this.flow();
        return;
    }

    onChoosedDamageSetHandler(damageSet, player) {
        if (this.context.state.name !== WaitChoosedDamage.NAME) {
            console.warn(this.context.state.name + " != " + WaitChoosedDamage.NAME);
            return;
        }
        this.context.addDamageSet(damageSet, player);
        this.context.next();
        this.flow();
        return;
    }

    onRolledBattleHandler(roll, player) {
        if (this.context.state.name !== WaitRolledAttackAndDefence.NAME) {
            console.warn(this.context.state.name + " != " + WaitRolledAttackAndDefence.NAME);
            return;
        }
        this.context.addAttackRoll(roll, player);
        this.context.addDefenceRoll(roll, player);
        this.context.next();
        this.flow();
        return;
    }

    onRolledSpeedHandler(playerRollSpeed: number[], player: PlayerI) {
        if (this.context.state.name !== WaitRolledSpeed.NAME) {
            console.warn(this.context.state.name + " != " + WaitRolledSpeed.NAME);
            return;
        }
        this.context.addSpeedRoll(playerRollSpeed, player);
        this.context.next();
        this.flow();
        return;
    }
}