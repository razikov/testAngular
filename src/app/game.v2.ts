import { BehaviorSubject } from 'rxjs';
import { Hero } from './hero';
import { cloneDeep as lodashClonedeep } from 'lodash';

export class Player
{
    hero: Hero;
    currentAttack: number;
    currentDefence: number;
    currentSpeed: number;
    isDie: boolean;
    isWin: boolean;
    isDamaged: boolean;
    isHardDamaged: boolean;
    isHuman: boolean
    
    constructor(hero: Hero, isHuman: boolean = false) {
        this.hero = hero;
        this.currentAttack = hero.attackDice;
        this.currentDefence = hero.defenceDice;
        this.currentSpeed = hero.speedDice;
        this.isHuman = isHuman;
        this.isDie = false;
        this.isWin = false;
        this.isDamaged = false;
        this.isHardDamaged = false;
    }

    rollAttack(dice: Dice): number[] {
        let dices = [];
        for (let index = 0; index < this.currentAttack; index++) {
            dices.push(dice.roll());
        }
        return dices.sort((a: number, b: number) => b - a);
    }

    rollDefence(dice: Dice): number[] {
        let dices = [];
        for (let index = 0; index < this.currentDefence; index++) {
            dices.push(dice.roll());
        }
        return dices.sort((a: number, b: number) => b - a);
    }

    rollSpeed(dice: Dice): number[] {
        let dices = [];
        for (let index = 0; index < this.currentSpeed; index++) {
            dices.push(dice.roll());
        }
        return dices;
    }

    roll(dice: Dice): number {
        let roll = dice.roll();
        return roll;
    }
    
    takeDamage(damages: string[]) {
        damages.forEach(attr => {
            this.lostDice(attr);
        });
        if (this.getHealth() == 2) {
            this.isDamaged = true;
        }
        if (this.getHealth() == 1) {
            this.isDamaged = true;
            this.isHardDamaged = true;
        }
        if (this.getHealth() == 0) {
            this.isDie = true;
        }
    }
    
    recovery(dice: number) {
        switch (dice) {
            case 5:
            case 6:
                if (this.isHardDamaged) {
                    this.isHardDamaged = false;
                } else {
                    this.isDamaged = false;
                }
                break;
            case 1:
            case 2:
                this.isDamaged = false;
                this.isDie = true;
                break;
            default:
                break;
        }
        return this;
    }

    getListHealth() {
        return [
            'attack', 'defence', 'speed'
        ];
    }

    lostDice(attr: string) {
        switch (attr) {
            case 'attack':
                if (this.canLostDiceRule(this.currentAttack, this.getHealth())) {
                    this.currentAttack--;
                } else {
                    throw new Error("attribute " + attr + " does not lost");
                }
                break;
            case 'defence':
                if (this.canLostDiceRule(this.currentDefence, this.getHealth())) {
                    this.currentDefence--;
                } else {
                    throw new Error("attribute " + attr + " does not lost");
                }
                break;
            case 'speed':
                if (this.canLostDiceRule(this.currentSpeed, this.getHealth())) {
                    this.currentSpeed--;
                } else {
                    throw new Error("attribute " + attr + " does not lost");
                }
                break;
            default:
                throw new Error("attribute " + attr + " does not exist");
        }
    }

    getHealth(): number {
        return this.currentAttack + this.currentDefence + this.currentSpeed;
    }

    generateDamageSet(damage: number): string[] {
        let takeDamage = [];
        if (damage > this.getHealth()) {
            damage = this.getHealth();
        }
        let currentDices = [this.currentAttack, this.currentDefence, this.currentSpeed];
        let attrs = this.getListHealth();
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

    canLostDiceRule(current: number, all: number) {
        let isLastDice = (current == 1 && [1,2,3].includes(all));
        let isCanLost = current > 1;
        return isCanLost || isLastDice;
    }
}

interface PlayerDecorator
{
    roll(dice: Dice, state: string): void;
    onRolledDice(roll: number[]): void;
}

class PlayerHumanDecorator implements PlayerDecorator
{
    game: Game;
    player: Player;
    state: string;
    dice: Dice;
    
    constructor(game: Game, player: Player) {
        this.game = game;
        this.player = player;
    }

    roll(dice: Dice, state: string) {
        let roll: number[];
        this.dice = dice;
        switch (state) {
            case 'attack':
                this.state = 'waitRollAttack';
                // roll = this.player.rollAttack(dice);
                break;
            case 'defence':
                this.state = 'waitRollDefence';
                // roll = this.player.rollDefence(dice);
                break;
            case 'speed':
                this.state = 'waitRollSpeed';
                // roll = this.player.rollSpeed(dice);
                break;
            case 'healing':
                this.state = 'waitRollHealing';
                // roll = [this.player.roll(dice)];
            default: throw new Error("неожиданный бросок кубиков");
        }
        // this.onRolledDice(roll);
    }

    onRolledDice(roll: number[]) {
        let game = this.game;
        let self = this;
        game.onRolledDiceHandler(roll, self);
    }
}

class PlayerAIDecorator implements PlayerDecorator
{
    game: Game;
    player: Player;
    
    constructor(game: Game, player: Player) {
        this.game = game;
        this.player = player;
    }

    roll(dice: Dice, state: string) {
        let roll: number[];
        switch (state) {
            case 'attack':
                roll = this.player.rollAttack(dice);
                break;
            case 'defence':
                roll = this.player.rollDefence(dice);
                break;
            case 'speed':
                roll = this.player.rollSpeed(dice);
                break;
            case 'healing':
                roll = [this.player.roll(dice)];
            default: throw new Error("неожиданный бросок кубиков");
        }
        console.log(this.player.hero.name, roll);
        this.onRolledDice(roll);
    }

    onRolledDice(roll: number[]) {
        let game = this.game;
        let self = this;
        game.onRolledDiceHandler(roll, self);
        // setTimeout(() => {
        //     game.onRolledDiceHandler(roll, self);
        // }, 2000);
    }
}

class Dice
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
    FIRST_PLAYER_KEY = 0;
    SECOND_PLAYER_KEY = 1;

    dice: Dice;
    state: string;
    context$ = new BehaviorSubject({ rounds: [] });
    context;

    constructor(firstPlayer: Player, secondPlayer: Player) {
        let playerFactory = (game: Game, player: Player): PlayerDecorator => {
            if (player.isHuman) {
                return new PlayerHumanDecorator(game, player);
            } else {
                return new PlayerAIDecorator(game, player);
            }
        }
        this.context = {
            players: [
                playerFactory(this, firstPlayer),
                playerFactory(this, secondPlayer)
            ],
            rounds: [],
            winer: null,
        };
        this.context$.next(this.context);
        this.dice = new Dice(1, 6);
        this.state = 'startGame';
    }

    flow() {
        switch (this.state) {
            case 'startGame':
                console.log('start game');
                this.state = 'startRound';
                this.flow();
                break;
            case 'startRound':
                this.context.rounds.push({
                    rollsSpeed: new Map(),
                    rollsSpeedValue: new Map(),
                    firstPlayer: null,
                    firstPlayerIndex: null,
                    secondPlayer: null,
                    secondPlayerIndex: null,
                    firstPlayerStep: {
                        rollAttack: null,
                        rollDefence: null,
                        damage: null,
                        damageSet: null,
                    },
                    secondPlayerStep: {
                        rollAttack: null,
                        rollDefence: null,
                        damage: null,
                        damageSet: null,
                    },
                });
                this.context$.next(this.context);
                console.log(this.context.rounds.length, 'round start');
                this.onRollDice();
                break;
            case 'actionsFirstPlayer':
            case 'actionsSecondPlayer':
                this.onRollDice();
                break;
            case 'endRound':
                let countRounds = this.context.rounds.length;
                let currentRound = this.context.rounds[countRounds - 1];
                console.log(
                    'first=', currentRound.firstPlayer.player.hero.name, 
                    'speedRoll=', currentRound.rollsSpeed.get(currentRound.firstPlayerIndex),
                    'speed=', currentRound.rollsSpeedValue.get(currentRound.firstPlayerIndex)
                );
                console.log(
                    'second=', currentRound.secondPlayer.player.hero.name,
                    'speedRoll=', currentRound.rollsSpeed.get(currentRound.secondPlayerIndex),
                    'speed=', currentRound.rollsSpeedValue.get(currentRound.secondPlayerIndex)
                );
                console.log('first attack');
                console.log(currentRound.firstPlayer.player.hero.name + " vs " + currentRound.secondPlayer.player.hero.name);
                console.log(currentRound.firstPlayerStep.rollAttack, " vs ", currentRound.firstPlayerStep.rollDefence);
                console.log('damage=', currentRound.firstPlayerStep.damage, 'damageSet=', currentRound.firstPlayerStep.damageSet);
                console.log('second attack');
                console.log(currentRound.secondPlayer.player.hero.name + " vs " + currentRound.firstPlayer.player.hero.name);
                console.log(currentRound.secondPlayerStep.rollAttack, " vs ", currentRound.secondPlayerStep.rollDefence);
                console.log('damage=', currentRound.secondPlayerStep.damage, 'damageSet=', currentRound.secondPlayerStep.damageSet);
                console.log('first dices rest [attack, defence, speed]',
                    currentRound.firstPlayer.player.currentAttack,
                    currentRound.firstPlayer.player.currentDefence,
                    currentRound.firstPlayer.player.currentSpeed,
                );
                console.log('second dices rest [attack, defence, speed]',
                    currentRound.secondPlayer.player.currentAttack,
                    currentRound.secondPlayer.player.currentDefence,
                    currentRound.secondPlayer.player.currentSpeed,
                );
                console.log(countRounds, 'round end');
                
                let firstPlayer = this.context.players[currentRound.firstPlayerIndex].player;
                let secondPlayer = this.context.players[currentRound.secondPlayerIndex].player;
                if (firstPlayer.getHealth() > 2 && secondPlayer.getHealth() > 2) {
                    this.state = 'startRound';
                    this.flow();
                } else {
                    // выбираем победителя
                    let loserPlayer: Player;
                    if (firstPlayer.getHealth() > 2) {
                        firstPlayer.isWin = true;
                        loserPlayer = secondPlayer;
                        this.context.winer = firstPlayer;
                        console.log('win', firstPlayer.hero.name);
                    }
                    if (secondPlayer.getHealth() > 2) {
                        secondPlayer.isWin = true;
                        loserPlayer = firstPlayer;
                        this.context.winer = secondPlayer;
                        console.log('win', secondPlayer.hero.name);
                    }
                    // восстанавливаем либо убиваем проигравшего
                    while (loserPlayer.isDamaged) {
                        let dice = this.dice.roll();
                        loserPlayer = loserPlayer.recovery(dice);
                        console.log('healingRoll=', dice);
                    }
                    this.state = 'endGame';
                    this.flow();
                }
                break;
            case 'endGame':
                console.log('end game');
                console.log(this.context);
                return this.context;
            default: throw new Error("incorrect state: " + this.state + " in flow()");
        }
    }

    onRollDice() {
        this.context.players.map(playerMap => {
            let player: PlayerDecorator = playerMap;
            let currentRound = this.context.rounds[this.context.rounds.length - 1];
            switch (this.state) {
                case 'startRound':
                    // Кидаем кубики: скорость первого и второго игрока
                    player.roll(this.dice, 'speed');
                    break;
                case 'actionsFirstPlayer':
                    // Кидаем кубики: атака первого игрока, защита второго игрока
                    switch (player) {
                        case this.context.players[currentRound.firstPlayerIndex]:
                            player.roll(this.dice, 'attack');
                            break;
                        case this.context.players[currentRound.secondPlayerIndex]:
                            player.roll(this.dice, 'defence');
                            break;
                        default: throw new Error("incorrect player: " + player);
                    }
                    break;
                case 'actionsSecondPlayer':
                    // Кидаем кубики: атака второго игрока, защита первого игрока
                    switch (player) {
                        case this.context.players[currentRound.secondPlayerIndex]:
                            player.roll(this.dice, 'attack');
                            break;
                        case this.context.players[currentRound.firstPlayerIndex]:
                            player.roll(this.dice, 'defence');
                            break;
                        default: throw new Error("incorrect player: " + player);
                    }
                    break;
                default:
                    throw new Error("incorrect state: " + this.state + " in onRolledDiceHandler()");
            }
        });
    }

    onRolledDiceHandler(roll: number[], player: PlayerDecorator) {
        switch (this.state) {
            case 'startRound':
                this.rolledSpeed(roll, player)
                break;
            case 'actionsFirstPlayer':
            case 'actionsSecondPlayer':
                // TODO: выбор действия: атака/движение
                this.rolledAttack(roll, player);
                break;
            default:
                throw new Error("incorrect state: " + this.state + " in onRolledDiceHandler()");
        }
    }

    rolledAttack(rollAttackOrDefence: number[], player: PlayerDecorator) {
        let currentRound = this.context.rounds[this.context.rounds.length - 1];
        let firstPlayer;
        let secondPlayer;
        let step;
        // -- get first & second players & step store
        if (this.state == 'actionsFirstPlayer') {
            step = currentRound.firstPlayerStep;
            firstPlayer = this.context.players[currentRound.firstPlayerIndex];
            secondPlayer = this.context.players[currentRound.secondPlayerIndex];
        } else if (this.state == 'actionsSecondPlayer') {
            step = currentRound.secondPlayerStep;
            firstPlayer = this.context.players[currentRound.secondPlayerIndex];
            secondPlayer = this.context.players[currentRound.firstPlayerIndex];
        } else {
            throw new Error("incorrect state: " + this.state + " in rolledAttackHandler()");
        }
        // -- get first & second players
        if (player == firstPlayer) {
            step.rollAttack = rollAttackOrDefence;
        } else if (player == secondPlayer) {
            step.rollDefence = rollAttackOrDefence;
        }

        let isRollBoth = step.rollAttack !== null && step.rollDefence !== null;
        if (isRollBoth) {
            // Когда кинули атаку и защиту определяем количество повреждений
            let damage = this.calculateDamage(step.rollAttack, step.rollDefence);
            step.damage = damage;
            this.context$.next(this.context);
            // просим выбрать какие кубики снять
            let damageSet = secondPlayer.player.generateDamageSet(damage);
            step.damageSet = damageSet;
            this.context$.next(this.context);
            // снимаем
            secondPlayer.player.takeDamage(damageSet);
            this.context$.next(this.context);
            // переходим к следующему стейту
            if (this.state == 'actionsFirstPlayer') {
                // если у защищающегося 3 кубика и больше даём ходить, иначе заканчиваем раунд и игру
                if (secondPlayer.player.getHealth() > 2) {
                    this.state = 'actionsSecondPlayer';
                } else {
                    this.state = 'endRound';
                }
            } else if (this.state == 'actionsSecondPlayer') {
                this.state = 'endRound';
            }
            this.flow();
        }
    }

    rolledSpeed(playerRollSpeed: number[], player: PlayerDecorator) {
        // -- addRollSpeed
        let currentRound = this.context.rounds[this.context.rounds.length - 1];
        this.context.players.map((currentPlayer, index) => {
            if (player === currentPlayer) { // сохранение бросков на скорость и их суммы в текущем раунде
                currentRound.rollsSpeed.set(index, playerRollSpeed);
                currentRound.rollsSpeedValue.set(index, playerRollSpeed.reduce((sum, current) => {
                    return sum + current;
                }, 0));
            }
        })
        // this.context.addRollSpeed(playerRollSpeed, player);
        this.context$.next(this.context);
        
        if (this.isRollSpeedBoth(currentRound)) {
            if (this.isEqualRollsSpeed(currentRound)) {
                // сбросить текущие кубики и повторить броски
                currentRound.rollsSpeed = new Map();
                currentRound.rollsSpeedValue = new Map();
                this.onRollDice();
            }
            // -- chooseFirstPlayer
            let first = lodashClonedeep(this.context.players[0]);
            let firstSpeed = currentRound.rollsSpeedValue.get(0);
            let second = lodashClonedeep(this.context.players[1]);
            let secondSpeed = currentRound.rollsSpeedValue.get(1);
            if (firstSpeed >= secondSpeed) {
                currentRound.firstPlayer = first;
                currentRound.firstPlayerIndex = 0;
                currentRound.secondPlayer = second;
                currentRound.secondPlayerIndex = 1;
            } else {
                currentRound.firstPlayer = second;
                currentRound.firstPlayerIndex = 1;
                currentRound.secondPlayer = first;
                currentRound.secondPlayerIndex = 0;
            }
            // this.context.chooseFirstPlayer();
            this.context$.next(this.context);

            this.state = 'actionsFirstPlayer';
            this.flow();
        }
    }

    // final
    isRollSpeedBoth(currentRound) {
        return currentRound.rollsSpeedValue.get(this.FIRST_PLAYER_KEY) !== undefined && currentRound.rollsSpeedValue.get(this.SECOND_PLAYER_KEY) !== undefined;
    }

    // final
    isEqualRollsSpeed(currentRound) {
        return currentRound.rollsSpeedValue.get(this.FIRST_PLAYER_KEY) === currentRound.rollsSpeedValue.get(this.SECOND_PLAYER_KEY);
    }

    // final
    calculateDamage(attackDices: number[], defenceDices: number[]): number {
        // Если пул кубиков защиты меньше пула атаки надо добавить дефолтные кубики на 2
        let diffCountDices = attackDices.length - defenceDices.length;
        if (diffCountDices > 0) {
            for (let index = 0; index < diffCountDices; index++) {
                defenceDices.push(2);
            }
        }
        let damage = 0;
        for (let index = 0; index < attackDices.length; index++) {
            if (attackDices[index] > defenceDices[index]) {
                damage++;
            }
        }
        return damage;
    }
}
