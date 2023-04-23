export interface ITimeframe {
  text: string
  value: number
}

export interface ILiveOrder {
  [pair: string]: {
    mainOrder: string
    SL?: string
    TP?: string
  }
}
