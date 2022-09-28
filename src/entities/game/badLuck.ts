import { Card } from "./card";
import { CardType } from "./enums/card-type.enum";

export class BadLuck extends Card {
    action: BadLuckAction
    constructor(id: number, action: BadLuckAction, text: string, canKeep: boolean){
        super(id, text, canKeep, CardType.BAD_LUCK)
        this.action = action
    }
}
 
export enum BadLuckAction {
    GET_NUGGET_FROM_ALL_PLAYERS
}