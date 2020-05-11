import { BehaviorSubject } from 'rxjs';
import { Hero } from './hero';
import { cloneDeep as lodashClonedeep } from 'lodash';

interface PlayerI
{
    onRolledDice$: BehaviorSubject<any>;
    isWin: boolean;

    getHits(): number;
    takeDamage(damages);
    recovery(roll);
    isNeedRecovery(): boolean;

    rollSpeed();
    rollAttack();
    rollDefence();
    chooseDamageSet(damage);
    rollRecovery();
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
    
    takeDamage(damages: string[]) {
        damages.forEach(attr => {
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

export class GameContext
{
    static readonly FIRST_PLAYER = 0;
    static readonly SECOND_PLAYER = 1;

    state: string;
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
    rollsRecovery: number[][];
    winerPlayerIndex: number; // ключ игрока
    loserPlayerIndex: number; // ключ игрока
    onChange$: BehaviorSubject<GameContext>;

    constructor() {
        this.players = new Map();
        this.round = 0;
        this.onChange$ = new BehaviorSubject(this);
    }

    setState(state) {
        this.state = state;
        this.onChange$.next(lodashClonedeep(this));
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
        this.rollsRecovery = [];
        this.winerPlayerIndex = null;
        this.loserPlayerIndex = null;
        this.onChange$.next(lodashClonedeep(this));
    }
    
    addSpeedRoll(roll: number[], player: PlayerI) {
        for (const [index, playerFromContext] of this.players) {
            if (player === playerFromContext) {
                this.rollsSpeed.set(index, roll);
                let speedValue = roll.reduce((sum, current) => {
                    return sum + current;
                }, 0);
                this.rollsSpeedValue.set(index, speedValue);
                this.onChange$.next(lodashClonedeep(this));
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

    setStep(playerKey) {
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
                this.onChange$.next(lodashClonedeep(this));
            }
        }
    }

    addDefenceRoll(roll, player: PlayerI) {
        for (const [index, playerFromContext] of this.players) {
            if (player === playerFromContext && index !== this.stepPlayerIndex) {
                this.rollDefence = roll;
                this.onChange$.next(lodashClonedeep(this));
            }
        }
    }

    calculateDamage(): void {
        // TODO: отсортировать значения
        // Если пул кубиков защиты меньше пула атаки надо добавить дефолтные кубики на 2
        this.rollAttack.sort((a: number, b: number) => b - a);
        this.rollDefence.sort((a: number, b: number) => b - a);
        let diffCountDices = this.rollAttack.length - this.rollDefence.length;
        let defence = lodashClonedeep(this.rollDefence); // TODO: найти клонирование полегче полегче
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
        this.onChange$.next(lodashClonedeep(this));
    }

    takeDamage(damageSet, player) {
        for (const [index, playerFromContext] of this.players) {
            if (player == playerFromContext) {
                this.damageSet = damageSet;
                this.onChange$.next(lodashClonedeep(this));
                playerFromContext.takeDamage(damageSet);
                this.onChange$.next(lodashClonedeep(this));
            }
        }
    }

    addRecoveryRoll(roll, player) {
        for (const [index, playerFromContext] of this.players) {
            if (player == playerFromContext) {
                this.rollsRecovery.push(roll);
                this.onChange$.next(lodashClonedeep(this));
                player.recovery(roll);
                this.onChange$.next(lodashClonedeep(this));
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
        this.onChange$.next(lodashClonedeep(this));
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
    onEndRound$: BehaviorSubject<GameContext>;

    constructor(context: GameContext, dice: Dice = new Dice(1, 6)) {
        this.dice = dice;
        this.state = 'startGame';
        this.context = context;
        this.context.setState(this.state);
        this.onEndRound$ = new BehaviorSubject(null);
    }

    flow() {
        switch (this.state) {
            case 'startGame':
                this.state = 'startRound';
                this.context.setState(this.state);
                this.flow();
                break;
            case 'startRound':
                this.context.startRound();
                this.state = 'rollSpeed';
                this.context.setState(this.state);
                this.flow();
                break;
            case 'rollSpeed':
                // Кидаем кубики: скорость первого и второго игрока
                for (const [index, player] of this.context.players) {
                    player.rollSpeed();
                }
                break;
            case 'actionsFirstPlayer':
                // Кидаем кубики: атака первого игрока, защита второго игрока
                this.context.setStep(this.context.firstPlayerIndex);
                for (const [index, player] of this.context.players) {
                    switch (index) {
                        case this.context.firstPlayerIndex:
                            player.rollAttack();
                            break;
                        case this.context.secondPlayerIndex:
                            player.rollDefence();
                            break;
                        default: throw new Error("incorrect player: " + player);
                    }
                }
                break;
            case 'actionsSecondPlayer':
                // Кидаем кубики: атака второго игрока, защита первого игрока
                this.context.setStep(this.context.secondPlayerIndex);
                for (const [index, player] of this.context.players) {
                    switch (index) {
                        case this.context.secondPlayerIndex:
                            player.rollAttack();
                            break;
                        case this.context.firstPlayerIndex:
                            player.rollDefence();
                            break;
                        default: throw new Error("incorrect player: " + player);
                    }
                }
                break;
            case 'chooseDamageSet':
                for (const [index, player] of this.context.players) {
                    if (index !== this.context.stepPlayerIndex) {
                        player.chooseDamageSet(this.context.damage);
                    }
                }
                break;
            case 'endRound':
                // this.onEndRound$.next(this.context);
                if (this.isGameOver()) { // игровой цикл закончен
                    this.context.changeWiner();
                    this.state = 'rollRecovery';
                    this.context.setState(this.state);
                    this.flow();
                } else {
                    this.state = 'startRound';
                    this.context.setState(this.state);
                    this.flow();
                }
                break;
            case 'rollRecovery':
                let looser = this.context.players.get(this.context.loserPlayerIndex);
                if (looser === undefined) {
                    throw new Error("looser not found");
                }
                if (looser.isNeedRecovery()) {
                    looser.rollRecovery();
                    return;
                }
                this.state = 'endGame';
                this.context.setState(this.state);
                this.flow();
                break;
            case 'endGame':
                return this.context;
            default: throw new Error("incorrect state: " + this.state + " in flow()");
        }
    }

    onRolledRecoveryHandler(roll: number[], player: PlayerI) {
        // восстанавливаем либо убиваем проигравшего
        this.context.addRecoveryRoll(roll, player);
        if (player.isNeedRecovery()) {
            this.state = 'rollRecovery';
            this.context.setState(this.state);
            this.flow();
            return
        }
        this.state = 'endGame';
        this.context.setState(this.state);
        this.flow();
        return;
    }

    onChoosedDamageSetHandler(damageSet, player) {
        this.context.takeDamage(damageSet, player);
        //если после получения повреждений игрок проиграл заканчиваем раунд, иначе следующий шаг битвы
        if (this.isGameOver()) {
            this.state = 'endRound';
            this.context.setState(this.state);
            this.flow();
            return;
        }
        this.nextBattleState();
        return;
    }

    onRolledBattleHandler(roll, player) {
        this.context.addAttackRoll(roll, player);
        this.context.addDefenceRoll(roll, player);
        if (this.context.rollAttack !== null && this.context.rollDefence !== null) {
            this.context.calculateDamage();
            //если повреждения есть даём выбрать как их нанести, иначе прееходим к следующему шагу битвы
            if (this.context.damage > 0) {
                this.state = 'chooseDamageSet';
                this.context.setState(this.state);
                this.flow();
                return;
            }
            this.nextBattleState();
            return;
        }
        return;
    }

    nextBattleState() {
        if (this.context.stepPlayerIndex == this.context.firstPlayerIndex) {
            // если первый шаг идём на второй шаг
            this.state = 'actionsSecondPlayer';
        } else if (this.context.stepPlayerIndex == this.context.secondPlayerIndex) {
            // если второй шаг заканчиваем раунд
            this.state = 'endRound';
        }
        this.context.setState(this.state);
        this.flow();
        return;
    }

    onRolledSpeedHandler(playerRollSpeed: number[], player: PlayerI) {
        this.context.addSpeedRoll(playerRollSpeed, player);
        if (this.context.getFirstSpeedValue() !== undefined && this.context.getSecondSpeedValue() !== undefined) {
            if (this.context.getFirstSpeedValue() === this.context.getSecondSpeedValue()) {
                this.context.resetSpeedRoll();
                this.state = 'rollSpeed';
                this.context.setState(this.state);
                this.flow();
                return;
            }
            this.context.chooseFirstPlayer();
            this.state = 'actionsFirstPlayer';
            this.context.setState(this.state);
            this.flow();
            return;
        }
        return;
    }

    isGameOver() {
        return !(this.context.getFirstPlayer().getHits() > 2 && this.context.getSecondPlayer().getHits() > 2);
    }
}