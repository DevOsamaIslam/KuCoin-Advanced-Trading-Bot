import {
  MACD,
} from 'technicalindicators'

import {
  EMA
} from 'trading-signals'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default (lastPrice, history) => {
  let lastCandle = history[1]
  history.reverse()
  let ema = new EMA(strategies.MACD.params.ma.period)
  let input = history.map(candle => {
    // get EMA
    ema.update(candle.close * 1.005)
    return parseFloat(candle.close)
  })

  // get MACD
  let macdResult = MACD.calculate({
    values: input,
    fastPeriod: strategies.MACD.params.fastPeriod,
    slowPeriod: strategies.MACD.params.slowPeriod,
    signalPeriod: strategies.MACD.params.signalPeriod,
  }).reverse()

  let emaResult = ema.getResult().toNumber()

  let macd = macdResult.map(point => point.MACD)
  let signal = macdResult.map(point => point.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] < 0
  let overEMA = emaResult < lastPrice && lastCandle.open > emaResult

  history.reverse()

  return overEMA && cross && lastMACD
}