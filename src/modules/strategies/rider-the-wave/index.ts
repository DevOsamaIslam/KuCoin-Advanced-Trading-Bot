import { getHistory } from 'lib/helpers/candles'
import { ICandle } from 'lib/types/data'
import { TStrategyFn } from 'lib/types/strategy'
import { EMA } from 'technicalindicators'

const calculateEma = (history: ICandle[], period: number = 50) => {
  return EMA.calculate({
    values: history.map(candle => candle.close),
    period,
  })
}

export const riderTheWaveStrategy: TStrategyFn = ({ symbol, timeframe, history, currentPrice }) => {
  if (history.length < 51) return // Need at least 51 candles to calculate EMA and volume

  // Calculate 50 EMA
  const ema50 = calculateEma(history)

  const currentEma = ema50[ema50.length - 1]

  // Calculate average volume of the past 10 candles
  let totalVolume = 0
  for (let i = history.length - 10; i < history.length; i++) {
    totalVolume += history[i].volume
  }
  const averageVolume = totalVolume / 10

  // Get current candle and volume
  const currentCandle = history.at(-1)
  if (!currentCandle) return

  const currentVolume = currentCandle.volume

  // Check if price crosses above EMA and volume is more than double the average
  if (currentPrice > currentEma && currentVolume > 2 * averageVolume) {
    return {
      side: 'buy',
      closeCondition: async () => {
        const history = await getHistory({
          symbol,
          timeframe,
          lookbackPeriods: 50,
        })
        const ema50 = calculateEma(history)
        const currentCandle = history.at(-1)
        if (!currentCandle) return false
        return currentCandle.close < ema50[ema50.length - 1]
      },
    }
  }
}
