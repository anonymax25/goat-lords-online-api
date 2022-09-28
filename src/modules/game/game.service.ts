import { Injectable } from '@nestjs/common';
import { Game } from '../../entities/game/game.entity';
import { BaseService } from '../../shared/classes/base.service';
import { Lobby } from '../../entities/lobby.entity';
import { Player } from '../../entities/game/player';
import { Property } from '../../entities/game/property';
import { GeneralStorms, GeneralStormsAction } from '../../entities/game/generalStorms';
import { BadLuck, BadLuckAction } from '../../entities/game/badLuck';
import { GameStatus } from '../../entities/game/enums/game-status.enum';
import { GameResults } from '../../entities/game/gameResults';
import { DiceValue } from '../../entities/game/dice-value.enum';
import { Card } from 'entities/game/card';

@Injectable()
export class GameService extends BaseService<Game>{

    constructor(){
        super(Game)
    }

    create(lobby: Lobby) {
        
        let game = new Game()
        game.players = lobby.users.map(user => new Player(user.id))
        game.waitingFor = lobby.users.map(user => user.id)
        game.startTime = new Date()
        game.sherifUserid = lobby.users[this.getRandomIntInclusive(0, lobby.users.length-1)].id
        game.dollar = 4
        game.income = 0
        game.nuggets = 30
        game.property = this.fillProperty() as Property[]
        game.generalStorms = this.fillGeneralStorms() as GeneralStorms[]
        game.badLuck = this.fillBadLuck()
        game.status = GameStatus.DICE_ROLLING
        game.round = 1
        game.results = new GameResults()

        return this.save(game)
    }

    fillProperty() {
        let properties: Property[] = []

        for (let i = 0; i < 4; i++) {
            properties.push(new Property(16+4*i, 1, "", true))
            properties.push(new Property(16+4*i+1, 2, "", true))
            properties.push(new Property(16+4*i+2, 3, "", true))
            properties.push(new Property(16+4*i+3, 4, "", true))
        } 
        return this.shuffle(properties)
    }

    fillGeneralStorms() {
        let generalStorms: GeneralStorms[] = []

        generalStorms.push(new GeneralStorms(1, GeneralStormsAction.GET_1_POINTS, "Get 1 point at the end of the game", true))
        generalStorms.push(new GeneralStorms(2, GeneralStormsAction.GET_2_POINTS, "Get 2 points at the end of the game", true))
        generalStorms.push(new GeneralStorms(3, GeneralStormsAction.GET_3_POINTS, "Get 3 points at the end of the game", true))
        generalStorms.push(new GeneralStorms(4, GeneralStormsAction.GET_4_POINTS, "Get 4 points at the end of the game", true))
        generalStorms.push(new GeneralStorms(5, GeneralStormsAction.GET_5_POINTS, "Get 5 points at the end of the game", true))
        generalStorms.push(new GeneralStorms(6, GeneralStormsAction.GET_8_POINTS, "Get 8 points at the end of the game", true))
        generalStorms.push(new GeneralStorms(7, GeneralStormsAction.TWO_SALOON, "Get 8 points", true, GameStatus.SALOON_RESULT))
        generalStorms.push(new GeneralStorms(8, GeneralStormsAction.CANCEL_CARD, "Cancel a card played by another player", true, GameStatus.SALOON_RESULT))
        generalStorms.push(new GeneralStorms(9, GeneralStormsAction.ONE_MOR_PROPERTY, "Get one more property from hidden stack", true, GameStatus.PROPERTY_RESULT))
        generalStorms.push(new GeneralStorms(10, GeneralStormsAction.DOUBLE_NUGGETS, "Get double nuggets", true, GameStatus.NUGGETS_RESULT))
        generalStorms.push(new GeneralStorms(11, GeneralStormsAction.OLD_SHERIF_STAY, "Old sherif stays sherif", true, GameStatus.SHERIF_RESULT))
        generalStorms.push(new GeneralStorms(12, GeneralStormsAction.HALF_OF_BANK, "Get half of the bank heist", true, GameStatus.BANK_RESULT))
        generalStorms.push(new GeneralStorms(13, GeneralStormsAction.DO_BAD_LUCK, "Do bad luck even if you won something", true, GameStatus.BAD_LUCK_RESULT))
        generalStorms.push(new GeneralStorms(14, GeneralStormsAction.DOUBLE_STORE, "Pick store cards twice", true, GameStatus.GENERAL_STORMS_RESULT))
        generalStorms.push(new GeneralStorms(15, GeneralStormsAction.STEAL_4_DOLLAR, "Steal 4$ from any player", false))
        
        return this.shuffle(generalStorms)
    }

    fillBadLuck() {
        let badLuck: BadLuck[] = []

        badLuck.push(new BadLuck(32, BadLuckAction.GET_NUGGET_FROM_ALL_PLAYERS, "Get a nugget from each players", false))
        badLuck.push(new BadLuck(33, BadLuckAction.GET_NUGGET_FROM_ALL_PLAYERS, "Get a nugget from each players", false))
        badLuck.push(new BadLuck(34, BadLuckAction.GET_NUGGET_FROM_ALL_PLAYERS, "Get a nugget from each players", false))
        
        return this.shuffle(badLuck) as BadLuck[]
    }

    shuffle(deck: Card[]): Card[] {
        var j, x, i;
        for (i = deck.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = deck[i];
            deck[i] = deck[j];
            deck[j] = x;
        }
        return deck;
    }

    getRandomIntInclusive(min: number, max: number): number{
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    getWinners(value: DiceValue, game: Game){
        let max = 1
        let playerIds: number[] = []
        for (const player of game.players) {
            let playerMax = 0
            for (const dice of player.dices) {
                if(dice.value === value)
                    playerMax++;
            }

            if(playerMax > max){
                max = playerMax
                playerIds = [player.userId]
            }else if(playerMax === max){
                playerIds.push(player.userId)
            }
        }
        return playerIds
    }

    
}
