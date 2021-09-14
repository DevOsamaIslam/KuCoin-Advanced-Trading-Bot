import {
  MACD,
  EMA,
} from 'technicalindicators'

export default (lastPrice, history) => {
  // history.reverse()
  let input = history.map(candle => parseFloat(candle[2]))

  // get EMA
  let emaResult = EMA.calculate({
    period: 200,
    values: input
  })
  // get MACD
  let macdResult = MACD.calculate({
    values: input.reverse(),
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  }).reverse()

  let macd = macdResult.map(candle => candle.MACD)
  let signal = macdResult.map(candle => candle.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] < 0

  // cross && console.log(`EMA: ${emaResult[0]}`);

  let overEMA = emaResult[1] < lastPrice

  let isTrue = overEMA && cross && lastMACD
  if (isTrue)
    return true
}