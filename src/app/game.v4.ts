import { BehaviorSubject } from 'rxjs';
import { Hero } from './hero';
import { cloneDeep as lodashClonedeep } from 'lodash';

interface PlayerI
{
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
    getEventEmiter(): BehaviorSubject<any>;
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

    getEventEmiter(): BehaviorSubject<any> {
        return this.onRolledDice$;
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

// TODO:
// выбор в пользу бросков игрока не очень удачно, событие можно сгенерировать вручную, лучше обмениваться сообщениями вида:
// game -> event {name: 'rollSpeed', player: player}; player -> event {name: 'rolledSpeed', player: player}
// а сейчас
// game -> event {name: 'rollSpeed', player: player}; player -> event {name: 'rolledSpeed', roll: roll, player: player}
// исчезнет зависимость игрока от кубика и возможно получится достать из игрока игровую логику

interface GameState
{
    name: string;
    context: GameContext;

    next(): boolean;
    handle(event: any): void; // обрабатывает события игроков
}

class BaseState
{
    static NAME = 'BaseState';
    name = 'BaseState';
    context: GameContext;

    constructor(context) {
        this.context = context;
    }

    handle(event: any) {
        console.warn("can't handle event: ", event, "; in: ", this.name);
    }

    onChangeState(): void {
        this.context.onChangeEvent$.next(lodashClonedeep(this.context));
    }

    protected emit(event: any) {
        this.context.onGameEvent$.next(event);
    }
}
// лишний
class StartGame extends BaseState implements GameState
{
    static NAME = 'StartGame';
    name = 'StartGame';

    next() {
        console.log('onStartGame');
        this.context.state = new StartRound(this.context);
        this.onChangeState();
        return true;
    }
}
class StartRound extends BaseState implements GameState
{
    static NAME = 'StartRound';
    name = 'StartRound';

    next() {
        this.context.startRound();
        this.context.state = new RollSpeed(this.context);
        this.onChangeState();
        return true;
    }
}
class RollSpeed extends BaseState implements GameState
{
    static NAME = 'RollSpeed';
    name = 'RollSpeed';

    next() {
        // TODO: как повторно испустить события на броски кубиков для игрока который кубики не кинул через время ожидания?
        // NOTE: сначало меняем состояние на случай если событие обработается раньше чем мы будем ожидать его
        this.context.resetSpeedRoll()
        this.context.state = new WaitRolledSpeed(this.context);
        this.onChangeState();
        for (const [index, player] of this.context.players) {
            this.emit({
                name: 'rollSpeed',
                player: player,
            })
        }
        return true;
    }
}
class WaitRolledSpeed extends BaseState implements GameState
{
    static NAME = 'WaitRolledSpeed';
    name = 'WaitRolledSpeed';

    next() {
        if (this.context.hasRolledSpeed()) {
            this.context.state = new RolledSpeed(this.context);
            this.onChangeState();
            return true;
        }
        return false
    }

    handle(event) {
        if (event.name !== 'rolledSpeed') {
            console.warn(event.name + " != rolledSpeed");
            return;
        } else {
            this.context.addSpeedRoll(event.roll, event.player);
            this.next();
            return;
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
            this.onChangeState();
            return true;
        } else {
            this.context.chooseFirstPlayer();
            this.context.state = new ActionsFirstPlayer(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class ActionsFirstPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsFirstPlayer';
    name = 'ActionsFirstPlayer';

    next() {
        this.context.initFirstStep()
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollAttack',
            player: this.context.getAttackPlayer(),
        });
        this.emit({
            name: 'rollDefence',
            player: this.context.getDefencePlayer(),
        });
        return true;
    }
}
class ActionsSecondPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsSecondPlayer';
    name = 'ActionsSecondPlayer';

    next() {
        this.context.initSecondStep()
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollAttack',
            player: this.context.getAttackPlayer(),
        });
        this.emit({
            name: 'rollDefence',
            player: this.context.getDefencePlayer(),
        });
        return true;
    }
}
class WaitRolledAttackAndDefence extends BaseState implements GameState
{
    static NAME = 'WaitRolledAttackAndDefence';
    name = 'WaitRolledAttackAndDefence';

    next() {
        if (this.context.hasRolledAttackAndDefence()) {
            this.context.state = new RolledAttackAndDefence(this.context);
            this.onChangeState();
            return true;
        }
        return false
    }

    handle(event) {
        if (['rolledAttack', 'rolledDefence'].indexOf(event.name) === -1) {
            console.warn(event.name + " not in ['rolledAttack', 'rolledDefence']");
            return;
        }
        this.context.addAttackRoll(event.roll, event.player);
        this.context.addDefenceRoll(event.roll, event.player);
        this.next();
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
            this.onChangeState();
            return true;
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        } else {
            throw new Error("неожиданное состояние!");
        }
    }
}
class ChooseDamage extends BaseState implements GameState
{
    static NAME = 'ChooseDamage';
    name = 'ChooseDamage';

    next() {
        this.context.state = new WaitChoosedDamage(this.context);
        this.onChangeState();
        this.emit({
            name: 'chooseDamageSet',
            damage: this.context.damage,
            player: this.context.getDefencePlayer(),
        })
        return true;
    }
}
class WaitChoosedDamage extends BaseState implements GameState
{
    static NAME = 'WaitChoosedDamage';
    name = 'WaitChoosedDamage';

    next() {
        console.log("WaitChoosedDamage");
        // TODO: добавить условие если задано
        this.context.state = new ChoosedDamage(this.context);
        this.onChangeState();
        return true;
    }

    handle(event) {
        if (event.name !== 'choosedDamageSet') {
            console.warn(event.name + " != " + 'choosedDamageSet');
            return;
        } else {
            this.context.addDamageSet(event.damageSet, event.player);
            this.next();
        }
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
            this.onChangeState();
            return true;
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        } else {
            throw new Error("неожиданное состояние!")
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
            this.onChangeState();
            return true;
        } else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class RollRecovery extends BaseState implements GameState
{
    static NAME = 'RollRecovery';
    name = 'RollRecovery';

    next() {
        this.context.state = new WaitRolledRecovery(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollRecovery',
            player: this.context.getLooserPlayer(),
        })
        return true;
    }
}
class WaitRolledRecovery extends BaseState implements GameState
{
    static NAME = 'WaitRolledRecovery';
    name = 'WaitRolledRecovery';

    next() {
        this.context.state = new RolledRecovery(this.context);
        this.onChangeState();
        return true;
    }

    handle(event) {
        if (event.name !== 'rolledRecovery') {
            console.warn(event.name + " != " + 'rolledRecovery');
            return;
        } else {
            this.context.addRecoveryRoll(event.roll, event.player);
            this.next();
        }
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
            this.onChangeState();
            return true;
        } else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class EndGame extends BaseState implements GameState
{
    static NAME = 'EndGame';
    name = 'EndGame';

    next() {
        // Разрушить событийные линии
        return false;
        console.warn('наградить!')
    }
}

export class GameContext
{
    static readonly FIRST_PLAYER = 0;
    static readonly SECOND_PLAYER = 1;

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
    onGameEvent$: BehaviorSubject<any>; // испускает игровые события для игроков
    onChangeEvent$: BehaviorSubject<GameContext>; // испускает события изменения контекста

    constructor() {
        this.state = new StartGame(this);
        this.players = new Map();
        this.round = 0;
        this.onGameEvent$ = new BehaviorSubject(null);
        this.onChangeEvent$ = new BehaviorSubject(null);
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
// механики к рассмотрению: 
// 1) Тяжелые повреждения можно либо голосованием зрителей решать, либо отдавать на предпочтение победителю

export class GameHandler
{
    context: GameContext;
    dice: Dice;
    firstPlayerAdded = false;
    secondPlayerAdded = false;

    constructor() {
        this.context = new GameContext();
        this.dice = new Dice(1,6);
    }

    run() {
        if (!this.firstPlayerAdded) {
            console.warn("назначьте первого игрока")
            return
        }
        if (!this.secondPlayerAdded) {
            console.warn("назначьте второго игрока")
            return
        }
        let intervalId;
        intervalId = setInterval((intervalId) => {
            try {
                this.context.state.next();
                if (this.context.state.name == EndGame.NAME) {
                    clearInterval(intervalId);
                }
            } catch (error) {
                clearInterval(intervalId);
            }
            
        }, 1000);
    }

    getOnContextEmiter() { // испускает события по смене контекста
        return this.context.onChangeEvent$;
    }

    getOnPlayerEmiter() { // испускает события на которые должен реагировать игрок
        return this.context.onGameEvent$;
    }

    addFirstPlayer(isManual: boolean, hero: Hero) {
        if (this.firstPlayerAdded) {
            console.warn("первый игрок уже добавлен");
            return
        }
        let player = this.playerFactory(isManual, hero, this.dice);
        this.context.setFirstPlayer(player);
        this.firstPlayerAdded = true;
        // Подписка!
        player.getEventEmiter().subscribe(this.getPlayerEventHandler());
        this.getOnPlayerEmiter().subscribe(this.getGameEventHandler(player));
    }

    addSecondPlayer(isManual: boolean, hero: Hero) {
        if (this.secondPlayerAdded) {
            console.warn("первый игрок уже добавлен");
            return
        }
        let player = this.playerFactory(isManual, hero, this.dice);
        this.context.setSecondPlayer(player);
        this.secondPlayerAdded = true;
        // Подписка
        player.getEventEmiter().subscribe(this.getPlayerEventHandler());
        this.getOnPlayerEmiter().subscribe(this.getGameEventHandler(player));
    }

    playerFactory(isManual, hero, dice) {
        if (isManual) {
            return new Player(hero, dice);
        } else {
            return new PlayerAI(hero, dice);
        }
    }

    getPlayerEventHandler() {
        return {
            next: (v) => {
                console.log('fromPlayerEvent: ', v);
                if (v == null) { // пропустить начальное значение
                    return;
                }
                this.context.state.handle(v);
            }
        }
    }

    getGameEventHandler(player) { // для AI это будет автогенерация событий, для игрока сообщение в интерфейс, сейчас это вызов метода
        return {
            next: (v) => {
                if (v == null) { // пропустить начальное значение
                    return;
                }
                if (player !== v.player) {
                    return;
                }
                console.log('fromGameEvent: ', v);
                switch (v.name) {
                    case 'rollSpeed':
                        player.rollSpeed();
                        break;
                    case 'rollAttack':
                        player.rollAttack();
                        break;
                    case 'rollDefence':
                        player.rollDefence();
                        break;
                    case 'chooseDamageSet':
                        player.chooseDamageSet(v.damage);
                        break;
                    case 'rollRecovery':
                        player.rollRecovery();
                        break;
                    default:
                        console.warn("event not support: " + v.name);
                        break;
                }
            }
        }
    }
}