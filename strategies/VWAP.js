import {
  VWAP,
  WEMA,
} from 'technicalindicators'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default (lastPrice, history) => {
  let close = history.map(candle => parseFloat(candle[2]))

  // get VWAP
  let vwapResult = VWAP.calculate({
    reversedInput: true,
    close: close,
    high: history.map(candle => parseFloat(candle[3])),
    low: history.map(candle => parseFloat(candle[4])),
    volume: history.map(candle => parseFloat(candle[5]))
  })
  // get EMA
  let wemaResult = WEMA.calculate({
    reversedInput: true,
    period: strategies.VWAP.params.ma.period,
    values: input
  }).reverse()

  let overEMA = wemaResult[1] < lastPrice
  let vwapReady = vwapResult[3] > lastPrice && vwapResult[1] < lastPrice

  return overEMA && vwapReady
}