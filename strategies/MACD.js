import {
  MACD,
  EMA,
  WEMA
} from 'technicalindicators'

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
    period: 100,
    values: input
  }).reverse()
  // get MACD
  let macdResult = MACD.calculate({
    values: input,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  }).reverse()

  let macd = macdResult.map(candle => candle.MACD)
  let signal = macdResult.map(candle => candle.signal)
  let cross = macd[2] < signal[2] && macd[1] > signal[1]
  let lastMACD = macd[1] < 0

  // cross && console.log(`EMA: ${wemaResult[0]}`);

  let overEMA = wemaResult[1] < lastPrice

  return overEMA && cross && lastMACD


}