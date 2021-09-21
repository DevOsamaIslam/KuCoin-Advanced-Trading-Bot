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
  let lastCandle = history[0]
  history.reverse()
  let ema = new EMA(strategies.MACD.params.ma.period)
  let input = history.map(candle => {
    // get EMA
    ema.update(candle[2])
    return parseFloat(candle[2])
  })

  // get MACD
  let macdResult = MACD.calculate({
    values: input,
    fastPeriod: strategies.MACD.params.fastPeriod,
    slowPeriod: strategies.MACD.params.slowPeriod,
    signalPeriod: strategies.MACD.params.signalPeriod,
  }).reverse()

  let emaResult = ema.getResult().toNumber()

  let macd = macdResult.map(candle => candle.MACD)
  let signal = macdResult.map(candle => candle.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] < 0
  let overEMA = emaResult < lastPrice && lastCandle[1] > emaResult

  return overEMA && cross && lastMACD
}