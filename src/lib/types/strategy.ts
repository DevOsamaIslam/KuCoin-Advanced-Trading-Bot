import { ICandle } from './data'

export interface IStrategy {
  name: string
  fn: $strategyFn
}

export type $strategyFn = (params: IStrategyParams) => boolean

export interface IStrategyParams {
  currentPrice: number
  history: ICandle[]
}
