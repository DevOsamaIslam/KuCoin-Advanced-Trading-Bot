import {
  VWAP,
} from 'technicalindicators'
import {
  EMA
} from 'trading-signals'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default history => {
  history.reverse()
  let ema = new EMA(strategies.VWAP.params.ma.period)
  history.map(candle => ema.update(candle.close))

  // get VWAP
  history.reverse()
  let vwapCandles = []
  for (const candle of history) {
    let timestamp = candle.timestamp * 1000
    let date = new Date(timestamp)
    vwapCandles.push(candle)
    if (date.getUTCHours() == '16' && date.getMinutes() == '00') break
  }
  let vwapResult = VWAP.calculate({
    reversedInput: true,
    close: vwapCandles.map(candle => parseFloat(candle.close)),
    high: vwapCandles.map(candle => parseFloat(candle.high)),
    low: vwapCandles.map(candle => parseFloat(candle.low)),
    volume: vwapCandles.map(candle => parseFloat(candle.volume))
  })

  let lastCandle = history[0]

  let emaResult = ema.getResult().toNumber()

  let overEMA = emaResult < lastCandle.close
  let vwapReady = (
    lastCandle.low < vwapResult[0] &&
    lastCandle.open > vwapResult[0] &&
    lastCandle.close > lastCandle.open &&
    lastCandle.close > vwapResult[0] &&
    (lastCandle.close - lastCandle.open) > (lastCandle.high - lastCandle.close) * 2
  )

  return overEMA && vwapReady
}