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

export default (lastPrice, history) => {
  history.reverse()
  let ema = new EMA(strategies.MACD.params.ma.period)
  let close = history.map(candle => {
    // get EMA
    ema.update(candle.close)
    return parseFloat(candle.close)
  })

  // get VWAP
  let vwapResult = VWAP.calculate({
    close,
    high: history.map(candle => parseFloat(candle.high)),
    low: history.map(candle => parseFloat(candle.low)),
    volume: history.map(candle => parseFloat(candle.volume))
  })

  history.reverse()
  let lastCandle = history[1]

  let emaResult = ema.getResult().toNumber()

  let overEMA = emaResult < lastPrice
  let vwapReady = lastCandle.low < vwapResult[1] && lastCandle.close > vwapResult[1] && lastPrice > vwapResult[0] // vwapResult[3] > lastPrice && vwapResult[1] < lastPrice

  return overEMA && vwapReady
}