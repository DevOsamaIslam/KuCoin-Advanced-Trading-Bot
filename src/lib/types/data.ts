import { ITimeframe } from './app'

export interface IHistory {
  timeframe: ITimeframe
  candles: ICandle[]
}

export interface ICandle {
  timestamp: number // the time when the candle opened
  open: number
  close: number
  high: number
  low: number
  volume: number
  amount: number
}
