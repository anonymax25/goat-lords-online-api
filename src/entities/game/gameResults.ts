export class GameResults {

    dice9: Result
    dice10: Result
    diceStore: Result
    diceSaloon: Result
    diceSherif: Result
    diceAce: Result
    diceBadLuck: BadLuckResult

}

export class Result {
    constructor(
        public ids: number[], 
        public isHidden: boolean, 
        public dice: number, 
        public isSherifResolve: boolean = false, 
        public isActionDone: boolean = false, 
        public isRedeemed: boolean = false,
        public cardID: number = null
        ){

        }
}

export class BadLuckResult extends Result {
    constructor(
        ids: number[], 
        isHidden: boolean, 
        dice: number, 
        isSherifResolve: boolean = false, 
        isActionDone: boolean = false, 
        isRedeemed: boolean = false,
        cardID: number = null,
        private playersRedeemedMap: Map<number, boolean> = new Map(),
        ){
            super(ids, isHidden, dice, isSherifResolve, isActionDone, isRedeemed, cardID)
            for(let id of ids) {
                playersRedeemedMap.set(id, false)
            }
        }

        set playersRedeemed(data: Map<number, boolean>){
            this.isRedeemed = this.isPlayerRedeemedMapTrue(data)
            this.playersRedeemedMap = data
        }

        get playersRedeemed(){
            return this.playersRedeemedMap
        }

        isPlayerRedeemedMapTrue(map: Map<number, boolean>): boolean {
            map.forEach((value: boolean, key: number) => {
                if(!value) return false
            });
            return true
        }

}

