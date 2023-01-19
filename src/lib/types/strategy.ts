import { ICandle } from './data'
import { IBaseParams, ITraderParams } from './Trader'

export interface IStrategy {
  name: string
  fn: $strategyFn
}

export type $strategyFn = (params: IStrategyParams) => IStrategyResponse | undefined

export interface IStrategyParams {
  currentPrice: number
  history: ICandle[]
}

export interface IStrategyResponse {
  side: IBaseParams['side']
  TP: ITraderParams['TP']
  SL: ITraderParams['SL']
}
