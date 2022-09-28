import { Card } from "./card";
import { CardType } from "./enums/card-type.enum";

export class Property extends Card {
    value: number

    constructor(id: number, value: number, text: string, canKeep: boolean) {
        super(id, text, canKeep, CardType.PROPERTY)
        this.value = value
    }
}