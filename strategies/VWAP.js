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
    ema.update(candle[2])
    return parseFloat(candle[2])
  })

  // get VWAP
  let vwapResult = VWAP.calculate({
    close,
    high: history.map(candle => parseFloat(candle[3])),
    low: history.map(candle => parseFloat(candle[4])),
    volume: history.map(candle => parseFloat(candle[6]))
  })

  let emaResult = ema.getResult().toNumber()

  let overEMA = emaResult < lastPrice
  let vwapReady = vwapResult[3] > lastPrice && vwapResult[1] < lastPrice

  return overEMA && vwapReady
}