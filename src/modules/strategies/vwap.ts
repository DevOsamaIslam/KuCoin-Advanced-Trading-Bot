import { ICandle } from 'lib/types/data'
import { $strategyFn } from 'lib/types/strategy'
import { EMA, VWAP } from 'technicalindicators'

export const vwapStrategy: $strategyFn = options => {
  let history = options.history
  let ema = EMA.calculate({ period: 200, values: history.map(c => c.close) })

  // get VWAP
  let vwapCandles: ICandle[] = []
  for (const candle of history) {
    let timestamp = candle.timestamp * 1000
    let date = new Date(timestamp)
    vwapCandles.push(candle)
    if (date.getUTCHours() === 16 && date.getMinutes() === 0) break
  }
  if (vwapCandles.length < 20) return false
  let vwapResult = VWAP.calculate({
    close: vwapCandles.map(candle => candle.close),
    high: vwapCandles.map(candle => candle.high),
    low: vwapCandles.map(candle => candle.low),
    volume: vwapCandles.map(candle => candle.volume),
  })

  let lastCandle = history[history.length - 1]
  ema
  // let overEMA = ema[0] < lastCandle.close
  let vwapReady =
    lastCandle.low < vwapResult[vwapResult.length - 1] &&
    lastCandle.open > vwapResult[vwapResult.length - 1] &&
    lastCandle.close > vwapResult[vwapResult.length - 1] &&
    lastCandle.close - lastCandle.open > lastCandle.high - lastCandle.close // candle body is larger that its upper shadow
  return vwapReady
}
