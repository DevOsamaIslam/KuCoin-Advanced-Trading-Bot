import {
  MACD,
} from 'technicalindicators'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default history => {
  let close = history.map(candle => candle.close)
  let length = strategies.CMF_MACD.params.length
  let ad = []
  let volume = []
  for (let i = 0; i < length; i++) {
    let candle = history[i + 1]
    let cond = candle.close == candle.high && candle.close == candle.low || candle.high == candle.low ?
      0 :
      ((2 * candle.close - candle.low - candle.high) / (candle.high - candle.low)) * candle.volume
    ad.push(cond)
    volume.push(candle.volume)
  }

  let mf = ad.reduce((c, e) => c + e) / volume.reduce((c, e) => c + e)

  // get MACD
  let macdResult = MACD.calculate({
    reversedInput: true,
    values: close,
    fastPeriod: strategies.CMF_MACD.params.fastPeriod,
    slowPeriod: strategies.CMF_MACD.params.slowPeriod,
    signalPeriod: strategies.CMF_MACD.params.signalPeriod,
  })


  let macd = macdResult.map(point => point.MACD)
  let signal = macdResult.map(point => point.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] > 0
  let positiveMf = mf > 0

  return positiveMf && cross && lastMACD
}