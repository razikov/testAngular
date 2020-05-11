
import { Hero } from "./hero";

class Player
{
    hero: Hero;
    currentAttack: number;
    currentDefence: number;
    currentSpeed: number;
    isDie: boolean;
    isWin: boolean;
    isDamaged: boolean;
    isHardDamaged: boolean;
    
    constructor(hero) {
        this.hero = hero;
        this.currentAttack = hero.attackDice;
        this.currentDefence = hero.defenceDice;
        this.currentSpeed = hero.speedDice;
        this.isDie = false;
        this.isWin = false;
        this.isDamaged = false;
        this.isHardDamaged = false;
    }
    
    takeDamage(damages: string[], canLostDiceRule: CallableFunction) {
        damages.forEach(attr => {
            this.lostDice(attr, canLostDiceRule);
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

    getListHealth() {
        return [
            'attack', 'defence', 'speed'
        ];
    }

    lostDice(attr: string, canLostDiceRule: CallableFunction) {
        switch (attr) {
            case 'attack':
                if (canLostDiceRule(this.currentAttack, this.getHealth())) {
                    this.currentAttack--;
                } else {
                    throw new Error("attribute " + attr + " does not lost");
                }
                break;
            case 'defence':
                if (canLostDiceRule(this.currentDefence, this.getHealth())) {
                    this.currentDefence--;
                } else {
                    throw new Error("attribute " + attr + " does not lost");
                }
                break;
            case 'speed':
                if (canLostDiceRule(this.currentSpeed, this.getHealth())) {
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
// порядок хода определяется броском кубиков скорости, у кого больше тот решает кто ходит первым
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
    player_one: Player;
    player_tho: Player;
    dice: Dice;

    constructor(hero1: Hero, hero2: Hero) {
        this.player_one = new Player(hero1);
        this.player_tho = new Player(hero2);
        this.dice = new Dice(1, 6);
    }
    
    run() {
        console.log('start game');
        let i = 0;
        while((this.player_one.getHealth() > 2 && this.player_tho.getHealth() > 2)) {
            this.round(this.player_one, this.player_tho);
            i++;
            console.log(i, 'round end');
        }
        if (this.player_one.getHealth() > 2) {
            this.player_one.isWin = true;
            console.log('win', this.player_one.hero.name);
        }
        if (this.player_tho.getHealth() > 2) {
            this.player_tho.isWin = true;
            console.log('win', this.player_tho.hero.name);
        }
        console.log('end game');
        console.log(this.player_one, this.player_tho);
    }

    round(playerOne, playerTwo) {
        let playerOneSpeed;
        let playerTwoSpeed;
        let playerOneRoll;
        let playerTwoRoll;
        while(true) {
            playerOneRoll = this.rollSpeed(playerOne);
            playerOneSpeed = playerOneRoll.reduce(function(sum, current) {
                return sum + current;
            }, 0);
            playerTwoRoll = this.rollSpeed(playerTwo);
            playerTwoSpeed = playerTwoRoll.reduce(function(sum, current) {
                return sum + current;
            }, 0);
            if (playerOneSpeed != playerTwoSpeed) {
                break;
            }
        }
        console.log(playerOne.hero.name, 'speedRoll', playerOneRoll, playerOneSpeed);
        console.log(playerTwo.hero.name, 'speedRoll', playerTwoRoll, playerTwoSpeed);
        
        if (playerOneSpeed > playerTwoSpeed) {
            playerTwo = this.attack(playerOne, playerTwo);
            playerOne = this.attack(playerTwo, playerOne);
        } else if (playerOneSpeed < playerTwoSpeed) {
            playerOne = this.attack(playerTwo, playerOne);
            playerTwo = this.attack(playerOne, playerTwo);
        }
        this.player_one = playerOne;
        this.player_tho = playerTwo;
    }

    attack(attackPlayer: Player, defencePlayer: Player) {
        if (attackPlayer.getHealth() < 3) {
            return defencePlayer;
        }
        let attackDices = this.rollAttack(attackPlayer);
        let defenceDices = this.rollDefence(defencePlayer);
        console.log(attackPlayer.hero.name, 'attackRoll=', attackDices, defencePlayer.hero.name, 'defenceRoll=', defenceDices);
        let damage = this.calculateDamage(attackDices, defenceDices);
        let damageSet = this.generateDamageSet(damage, defencePlayer);
        console.log('gamage=', damage, 'ds=', damageSet);
        defencePlayer.takeDamage(damageSet, this.canLostDiceRule());
        while (defencePlayer.isDamaged) {
            let dice = this.dice.roll();
            console.log('healingRoll=', dice);
            defencePlayer = defencePlayer.recovery(dice);
        }
        return defencePlayer;
    }

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

    rollAttack(player: Player): number[] {
        let dices = [];
        for (let index = 0; index < player.currentAttack; index++) {
            dices.push(this.dice.roll());
        }
        return dices.sort((a: number, b: number) => b - a);
    }

    rollDefence(player: Player): number[] {
        let dices = [];
        for (let index = 0; index < player.currentDefence; index++) {
            dices.push(this.dice.roll());
        }
        return dices.sort((a: number, b: number) => b - a);
    }

    rollSpeed(player: Player): number[] {
        let dices = [];
        for (let index = 0; index < player.currentSpeed; index++) {
            dices.push(this.dice.roll());
        }
        return dices;
    }

    generateDamageSet(damage: number, player: Player): string[] {
        let takeDamage = [];
        if (damage > player.getHealth()) {
            damage = player.getHealth();
        }
        let currentDices = [player.currentAttack, player.currentDefence, player.currentSpeed];
        let attrs = player.getListHealth();
        while(damage > 0) {
            let sum = currentDices.reduce(function(sum, current) {
                return sum + current;
            }, 0)
            while(true) {
                let rand = Math.floor(Math.random() * 3);
                let canLost = this.canLostDiceRule()(currentDices[rand], sum);
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

    canLostDiceRule() {
        return (current: number, all: number) => {
            let isLastDice = (current == 1 && [1,2,3].includes(all));
            let isCanLost = current > 1;
            return isCanLost || isLastDice;
        }
    }
}
