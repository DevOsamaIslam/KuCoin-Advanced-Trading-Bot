import { ICandle } from 'lib/types/data'
import { $strategyFn } from 'lib/types/strategy'
import { VWAP } from 'technicalindicators'
import { previousCandles } from './TP-SL/basic'

export const vwapStrategy: $strategyFn = ({ history, currentPrice }) => {
  // let ema = EMA.calculate({ period: 200, values: history.map(c => c.close) })

  // get VWAP
  let vwapCandles: ICandle[] = []
  for (const candle of history) {
    let timestamp = candle.timestamp * 1000
    let date = new Date(timestamp)
    vwapCandles.push(candle)
    if (date.getUTCHours() === 16 && date.getMinutes() === 0) break
  }
  if (vwapCandles.length < 20) return
  let vwapResult = VWAP.calculate({
    close: vwapCandles.map(candle => candle.close),
    high: vwapCandles.map(candle => candle.high),
    low: vwapCandles.map(candle => candle.low),
    volume: vwapCandles.map(candle => candle.volume),
  })

  let lastCandle = history[history.length - 1]

  // let overEMA = ema[0] < lastCandle.close
  let vwapReady =
    lastCandle.low < vwapResult[vwapResult.length - 1] &&
    lastCandle.open > vwapResult[vwapResult.length - 1] &&
    lastCandle.close > vwapResult[vwapResult.length - 1] &&
    lastCandle.close - lastCandle.open > lastCandle.high - lastCandle.close // candle body is larger that its upper shadow
  if (vwapReady) {
    const { TP, SL } = previousCandles({ history, currentPrice })
    return {
      side: 'buy',
      TP: TP.toFixed(10),
      SL: SL.toFixed(10),
    }
  }
}
