import { $strategyFn, IStrategyParams } from 'lib/types/strategy'
import { MACD } from 'technicalindicators'

export const macdStrategy: $strategyFn = ({ history, currentPrice }) => {
  const macd = MACD.calculate({
    values: history.map(candle => candle.close),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })

  // Check if the MACD line crossed above the signal line
  // const prevCandle = history[1]
  // const currentCandle = history[0]
  if (macd.length < 50) return
  if (macd[macd.length - 1].MACD! > macd[macd.length - 1].signal! && macd[macd.length - 2].MACD! < macd[macd.length - 2].signal!) {
    const { TP, SL } = setSLandTP({ history: history, currentPrice })
    return {
      side: 'buy',
      TP: TP.toString(),
      SL: SL.toString(),
    }
  }
}

function setSLandTP({ history, currentPrice }: IStrategyParams) {
  // Find the lowest of the past 10 candles
  const past10Candles = history.slice(-10)
  const min = Math.min(...past10Candles.map(c => c.low))

  // Set the SL at the lowest of the past 10 candles
  const SL = min

  // Calculate the percentage of the downside from the current price to the SL
  const downside = (currentPrice - SL) / currentPrice

  // Set the TP at x1.5 the percentage of the downside from the current price to the SL
  const TP = currentPrice + currentPrice * (1.5 * downside)

  return { SL, TP }
}
