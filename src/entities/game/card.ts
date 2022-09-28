import { CardType } from "./enums/card-type.enum"

export class Card {
    id: number
    text: string
    canKeep: boolean
    type: CardType

    constructor(id: number, text: string, canKeep: boolean, type: CardType){
        this.id = id
        this.text = text
        this.canKeep = canKeep
        this.type = type
    }
}