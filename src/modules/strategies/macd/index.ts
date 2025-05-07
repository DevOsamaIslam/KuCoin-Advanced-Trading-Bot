import { TStrategyFn } from 'lib/types/strategy'
import { MACD } from 'technicalindicators'
import { setSLandTP, TPSLStrategies } from '../TP-SL'

export const macdStrategy: TStrategyFn = ({ symbol, timeframe, history, currentPrice }) => {
  const macd = MACD.calculate({
    values: history.map(candle => candle.close),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  })

  // Check if the MACD line crossed above the signal line
  if (macd.length < 50) return
  if (macd[macd.length - 1].MACD! > macd[macd.length - 1].signal! && macd[macd.length - 2].MACD! < macd[macd.length - 2].signal!) {
    const { TP, SL } = setSLandTP(TPSLStrategies.previousCandles, { history, currentPrice, symbol, timeframe })
    return {
      side: 'buy',
      TP: TP.toString(),
      SL: SL.toString(),
    }
  }
}
