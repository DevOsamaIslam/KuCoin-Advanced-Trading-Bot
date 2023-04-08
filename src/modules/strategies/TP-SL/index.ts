import { IStrategyParams } from 'lib/types/strategy'
import { previousCandles } from './basic'

export const TPSLStrategies = {
  previousCandles: 'Previous candles close',
  atr: 'Atr',
} as const
type $TPSLStrategy = typeof TPSLStrategies[keyof typeof TPSLStrategies]
export const setSLandTP = (type: $TPSLStrategy, strategyParams: IStrategyParams) => {
  switch (type) {
    default:
      return previousCandles(strategyParams)
  }
}
