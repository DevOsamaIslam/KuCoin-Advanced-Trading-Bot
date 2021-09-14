import {
  VWAP,
  EMA,
} from 'technicalindicators'

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
  let emaResult = EMA.calculate({
    reversedInput: true,
    period: 200,
    values: close
  })

  let overEMA = emaResult[1] < lastPrice
  let vwapReady = vwapResult[3] > lastPrice && vwapResult[1] < lastPrice

  if (overEMA && vwapReady)
    console.log();

  return overEMA && vwapReady
}