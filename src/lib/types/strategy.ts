import { ITimeframe } from './app'
import { ICandle } from './data'
import { IBaseParams, ITraderParams } from './Trader'

export interface IStrategy {
  name: string
  fn: TStrategyFn
}

export type TStrategyFn = (params: IStrategyParams) => TStrategyResponse | undefined

export interface IStrategyParams {
  symbol: string
  timeframe: ITimeframe
  currentPrice: number
  history: ICandle[]
}

export type TStrategyResponse = {
  side: IBaseParams['side']
  TP?: ITraderParams['TP']
  SL?: ITraderParams['SL']
  closeCondition?: () => Promise<boolean>
}
