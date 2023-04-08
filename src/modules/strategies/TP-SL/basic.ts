import { IStrategyParams } from 'lib/types/strategy'

export const previousCandles = ({ history, currentPrice }: IStrategyParams) => {
  // Find the lowest of the past 10 candles
  const past10Candles = history.slice(-10)
  const min = Math.min(...past10Candles.map(c => c.low))

  // Set the SL at the lowest of the past 10 candles
  const SL = min

  // Calculate the percentage of the downside from the current price to the SL
  const downside = (currentPrice - SL) / currentPrice

  // Set the TP at x1.5 the percentage of the downside from the current price to the SL
  const TP = currentPrice + currentPrice * (1.5 * Math.abs(downside))

  return { SL, TP }
}
