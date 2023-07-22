import { IStrategyParams } from 'lib/types/strategy'
import TechnicalIndicators from 'technicalindicators'

const MULTIPLIER = 2
export const ATRBasedTPSL = ({ history, currentPrice }: IStrategyParams) => {
  const inputATR = {
    period: 14,
    high: history.map(c => c.high),
    low: history.map(c => c.low),
    close: history.map(c => c.close),
  }

  // Calculate ATR
  const atr = TechnicalIndicators.ATR.calculate(inputATR)

  // Get the latest ATR value
  const latestATR = atr[atr.length - 1]

  // Calculate the stop loss price
  const SL = currentPrice - MULTIPLIER * latestATR

  // Calculate the take profit price
  const TP = currentPrice + 1.5 * MULTIPLIER * latestATR

  return { SL, TP }
}
