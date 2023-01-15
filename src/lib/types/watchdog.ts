import { ITimeframe } from './app'
import { IStrategy } from './strategy'

export interface IWatchdogParams {
  timeframe: ITimeframe
  strategy: IStrategy
  pairs: string[]
}
