import {
  MACD,
  WEMA
} from 'technicalindicators'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default (lastPrice, history) => {
  // history.reverse()
  let input = history.map(candle => parseFloat(candle[2])).reverse()

  // // get EMA
  // let emaResult = EMA.calculate({
  //   period: 200,
  //   values: input
  // }).reverse()
  // get WEMA - SMMA
  let wemaResult = WEMA.calculate({
    period: strategies.MACD.params.ma.period,
    values: input
  }).reverse()
  // get MACD
  let macdResult = MACD.calculate({
    values: input,
    fastPeriod: strategies.MACD.params.fastPeriod,
    slowPeriod: strategies.MACD.params.slowPeriod,
    signalPeriod: strategies.MACD.params.signalPeriod,
  }).reverse()

  let macd = macdResult.map(candle => candle.MACD)
  let signal = macdResult.map(candle => candle.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] < 0

  // hot fixing the deviation in WEMA
  wemaResult[1] *= 1.0008

  let overEMA = wemaResult[1] < lastPrice

  return overEMA && cross && lastMACD


}