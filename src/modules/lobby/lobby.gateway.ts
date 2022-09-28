import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Dice } from '../../entities/game/dice';
import { GameStatus } from '../../entities/game/enums/game-status.enum';
import { ReadyStatus } from '../../entities/lobby/ready-status';
import { GameService } from '../game/game.service';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { DiceValue } from '../../entities/game/dice-value.enum';
import { BadLuckResult, GameResults, Result } from '../../entities/game/gameResults';
import { GameEvent } from 'entities/lobby/game-event';
import { Card } from '../../entities/game/card';
import { CardType } from '../../entities/game/enums/card-type.enum';

const { WEBSOCKETS_PORT_LOBBY } = process.env

@WebSocketGateway(parseInt(WEBSOCKETS_PORT_LOBBY), {
})
export class LobbyGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer()
  server: Server;

  diceToStr = new Map([
    [9, "dice9"],
    [10, "dice10"],
    [11, "diceStore"],
    [12, "diceSaloon"],
    [13, "diceSherif"],
    [14, "diceAce"],
    [15, "diceBadLuck"]
  ]); 
  
  private logger: Logger = new Logger("LobbyGateway")

  constructor(private lobbyService: LobbyService, private gameService: GameService){
  }
  
  afterInit(server: Server) {    
    this.logger.log("Initialized!")
  }

  handleDisconnect(client: Socket) {
    this.logger.log("client disconnected! " + client.id)
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log("client connected! " + client.id)
  }

  @SubscribeMessage('ping')
  ping(client: Socket, msg: string){
    client.emit('pong')
  }

  @SubscribeMessage('updateReadyStatus')
  async updateReadyStatus(client: Socket, readyStatus: ReadyStatus) {
    this.server.to(readyStatus.lobbyId.toString()).emit('updatedReadyStatus', readyStatus)
    await this.lobbyService.changeReadyStatus(readyStatus)
  }

  @SubscribeMessage('joinLobbySocket')
  joinLobby(client: Socket, body: {lobbyId: string, username: string, uid: string}){
    this.server.to(body.lobbyId).emit('userJoinedLobby', body.username)
    client.join(body.lobbyId)
    client.emit('joinedLobbySocket', body.lobbyId)
  }

  @SubscribeMessage('leaveLobbySocket')
  async leaveLobby(client: Socket, body: {lobbyId: string, username: string, uid: string}){
    client.leave(body.lobbyId)
    client.emit('leftLobbySocket', body.lobbyId)
    this.server.to(body.lobbyId).emit('userLeftLobby', body.username)

    let lobby = await this.lobbyService.findOneById(parseInt(body.lobbyId))
    if(lobby)
      this.updateReadyStatus(client, new ReadyStatus(parseInt(body.lobbyId), parseInt(body.uid), false))
  }
  
  @SubscribeMessage('switchStartGame')
  async switchStartGame(client: Socket, body: {lobbyId: string, isGame: boolean}){
    const lobby = await this.lobbyService.switchStartGame(parseInt(body.lobbyId))
  
    this.server.to(body.lobbyId).emit('startGameSwitched', lobby)
  }
  
  @SubscribeMessage('setDices')
  async setDices(client: Socket, body: {dices: Dice[], lobbyId: number, userId: number}){
    const lobby = await this.lobbyService.findOneLobbyPopulate({id: body.lobbyId})
    let game = lobby.game

    // add dices to player
    game.players.forEach(player => {
      if(player.userId === body.userId){
        player.dices.push(...body.dices)
      }
    })

    // player pays his move
    let costs = this.computeCosts(body.dices)
    game.players.forEach(player => {
      if(player.userId === body.userId)
        player.dollar -= costs
    })
    game.income += costs
    
    // update waiting list
    game.waitingFor = game.waitingFor.filter(userId => userId !== body.userId)

    // if its the last dice throw of the users
    if(game.waitingFor.length === 0){
      game.players.forEach(player => {

        // set state of user in new dice throw
        if(player.dices.length < 5){
          game.waitingFor.push(player.userId)
          player.canThrowDices = true
        }else{
          player.canThrowDices = false
        }

        //un-hide dices
        player.dices.forEach(dice => dice.hidden = false)
      })
    }else{

      //set user has rolled his dice
      game.players.forEach(player => {
        if(player.userId === body.userId){
          player.canThrowDices = false
        }
      })
    }
    
    
    //go to next game status if all players have all their dices
    if(!game.players.find(player => player.dices.length < 5)){
      game.status = GameStatus.NUGGETS_RESULT
      this.server.to(`${body.lobbyId}`).emit('event', new GameEvent(`Round ${lobby.game.round} results`))
      lobby.events.push(new GameEvent('Round results'))
      

      //compute winners of categories
      for (let i = 9; i < 15; i++) {
        let winnerIds = this.gameService.getWinners(i, game);

        let isHidden = true 
        let isSherifResolve = false
        let isActionDone = false
        let isRedeemed = false    

        switch(i){
          case 9:
            isActionDone = true
            isHidden = false
            break;
          case 10:
            isActionDone = true
            break;
          case 13:
            isActionDone = true
            break;
        }
        game.results[this.diceToStr.get(i)] = new Result(winnerIds, true, i, isSherifResolve, !winnerIds.length ? true : isActionDone, isRedeemed)
        
      }

      for (let i = 9; i <= 15; i++) {
        if(this.gameService.getWinners(i, game).length >= 0){
          game.results[this.diceToStr.get(i)].isHidden = false;
          break;
        }
      }
      // game.results.dice10 = new Result(this.gameService.getWinners(DiceValue.DICE10, game), true, DiceValue.DICE10, false, true)
      // game.results.diceStore = new Result(this.gameService.getWinners(DiceValue.DICE11, game), true, DiceValue.DICE11)
      // game.results.diceSaloon = new Result(this.gameService.getWinners(DiceValue.DICE12, game), true, DiceValue.DICE12)
      // game.results.diceSherif = new Result(this.gameService.getWinners(DiceValue.DICE13, game), true, DiceValue.DICE13, false, true)
      // game.results.diceAce = new Result(this.gameService.getWinners(DiceValue.DICE14, game), true, DiceValue.DICE14)

      game.players.forEach( player => {
        player.dices.sort((a,b) => {
          if(a.value > b.value) return 1
          if(a.value < b.value) return -1
          return 1
        })
      })
    }  

    this.server.to(body.lobbyId.toString()).emit('updateGame', game)
    
    await this.gameService.save(game)
    await this.lobbyService.save(lobby)
  }

  @SubscribeMessage('chooseWinner')
  async chooseWinner(client: Socket, body: {lobbyId: number, gameId: number, result: Result}){
    
    let game = await this.gameService.findOneById(body.gameId)

    game.results[this.diceToStr.get(body.result.dice)].ids = body.result.ids   
    game.results[this.diceToStr.get(body.result.dice)].isSherifResolve = true   


    this.server.to(body.lobbyId.toString()).emit('updateResults', game.results)
    
    game = await this.gameService.save(game)

  }
  
  @SubscribeMessage('redeemResult')
  async redeemResult(client: Socket, body: {lobbyId: number, gameId: number, result: Result}){
    
    const lobby = await this.lobbyService.findOneLobbyPopulate({id: body.lobbyId})

    lobby.game.results[this.diceToStr.get(body.result.dice)].isRedeemed = true

    switch(body.result.dice){
      case 9:
        const wonNuggets: number = this.lobbyService.countPlayerDice(lobby.game, 9, body.result.ids[0])
        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])].nuggets += wonNuggets
        lobby.game.nuggets -= wonNuggets
        lobby.game.results.dice10.isHidden = false
        lobby.game.status = GameStatus.BANK_RESULT

        lobby.events.push(new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} won ${wonNuggets} nuggets`))
        this.server.to(body.lobbyId.toString()).emit('event', new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} won ${wonNuggets} nugget${wonNuggets > 1 ? "s" : ""}`))

        break;
      case 10:
        const wonDollars = lobby.game.dollar
        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])].dollar += wonDollars
        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])].dollarWon = wonDollars
        lobby.game.dollar = lobby.game.income
        lobby.game.income = 0
        lobby.game.results.diceStore.isHidden = false
        lobby.game.status = GameStatus.GENERAL_STORMS_RESULT

        lobby.events.push(new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} won ${wonDollars}$`))
        this.server.to(body.lobbyId.toString()).emit('event', new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} won ${wonDollars}$`))

        break;
      case 11:

        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])].generalStorms.push(
          lobby.game.generalStorms.splice(lobby.game.generalStorms.findIndex(c => c.id === body.result.cardID), 1)[0]
        )

        lobby.events.push(new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} picked a general storms card`))
        this.server.to(body.lobbyId.toString()).emit('event', new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} picked a general storms card`))


        lobby.game.results.diceSaloon.isHidden = false
        lobby.game.status = GameStatus.SALOON_RESULT

        break;
      case 12:

        
        let card
        let foundPlayer

        for(let player of lobby.game.players){
          let cards = [...player.generalStorms, ...player.property]
          card = cards.find(card => card.id === body.result.cardID)
          if(card !== undefined){
            foundPlayer = player
            break;
          }
        }

        let cardTypeToProperty = {
          GENERAL_STORE: "generalStorms",
          PROPERTY: "property"
        }

        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])][cardTypeToProperty[card.type]].push(
          lobby.game.players.find(player => player.userId === foundPlayer.userId)[cardTypeToProperty[card.type]].splice(lobby.game.players.find(player => player.userId === foundPlayer.userId)[cardTypeToProperty[card.type]].findIndex(c => c.id === body.result.cardID), 1)[0]
        )

        lobby.game.results.diceSherif.isHidden = false
        lobby.game.status = GameStatus.SHERIF_RESULT
        
        break;
      case 13:

          lobby.events.push(new GameEvent(`${lobby.users.find(u => u.id === body.result.ids[0]).name} is now the sherif`))
          lobby.game.results.diceAce.isHidden = false
          lobby.game.status = GameStatus.PROPERTY_RESULT
          lobby.game.results.diceAce = new Result([lobby.game.players[0].userId], false, 14, false, true, false)

        break;
      case 14:

        lobby.game.players[lobby.game.players.findIndex(p => p.userId === body.result.ids[0])].property.push(
          ...lobby.game.property.splice(0, 1)
        )

        lobby.game.status = GameStatus.BAD_LUCK_RESULT

        let playersThatWon = []
        for (let i = 9; i < 15; i++) {
          console.log(this.diceToStr.get(i), i);
          
          if(lobby.game.results[this.diceToStr.get(i)].ids.length > 0)
            playersThatWon.push(lobby.game.results[this.diceToStr.get(i)].ids[0])
        }
        let badLuckPlayers = lobby.game.players.map(player => player.userId).filter(id => !playersThatWon.includes(id))

        lobby.game.results.diceBadLuck = new BadLuckResult(badLuckPlayers, false, 15, false, false, false, null)

        break;

      case 15:
        lobby.game.status = GameStatus.DICE_ROLLING
        lobby.game.players.forEach(player => {
          player.dices = []
          player.canThrowDices = true
        })
        lobby.game.round += 1
        lobby.events.push(new GameEvent(`Round ${lobby.game.round} started`))
        lobby.game.results = new GameResults()
        lobby.game.waitingFor = lobby.users.map(user => user.id)

    }


    this.server.to(body.lobbyId.toString()).emit('updateGame', lobby.game)
    
    await this.lobbyService.save(lobby)
    await this.gameService.save(lobby.game)

  }

  computeCosts(dices: Dice[]): number{
    if(!dices.length)
      return 1
    return dices.length - 1
  }
}

