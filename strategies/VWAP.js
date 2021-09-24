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

export default (lastPrice, vwapHistory, history) => {
  history.reverse()
  let ema = new EMA(strategies.MACD.params.ma.period)
  history.map(candle => ema.update(candle.close))

  // get VWAP
  let vwapCandles = []
  for (const candle of vwapHistory) {
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
  }).reverse()

  history.reverse()
  let lastCandle = history[1]

  let emaResult = ema.getResult().toNumber()

  let overEMA = emaResult < lastPrice
  let vwapReady = lastCandle.low < vwapResult[1] && lastCandle.close > vwapResult[1] && lastPrice > vwapResult[0] // vwapResult[3] > lastPrice && vwapResult[1] < lastPrice

  return overEMA && vwapReady
}