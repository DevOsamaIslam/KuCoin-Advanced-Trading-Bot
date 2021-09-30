import {
  VWAP,
  ATR
} from 'technicalindicators'
import {
  EMA
} from 'trading-signals'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default options => {
  let history = options.pair.history
  history.reverse()
  let ema = new EMA(strategies.VWAP.params.ma.period)
  history.map(candle => ema.update(candle.close))

  // get VWAP
  history.reverse()
  let vwapCandles = []
  for (const candle of history) {
    let timestamp = candle.timestamp * 1000
    let date = new Date(timestamp)
    vwapCandles.push(candle)
    if (date.getUTCHours() == '16' && date.getMinutes() == '00') break
  }
  let vwapResult = VWAP.calculate({
    reversedInput: true,
    close: vwapCandles.map(candle => parseFloat(candle.close)),
    high: vwapCandles.map(candle => parseFloat(candle.high)),
    low: vwapCandles.map(candle => parseFloat(candle.low)),
    volume: vwapCandles.map(candle => parseFloat(candle.volume))
  })

  let lastCandle = history[0]

  let emaResult = ema.getResult().toNumber()

  let overEMA = emaResult < lastCandle.close
  let vwapReady = (
    lastCandle.low < vwapResult[0] &&
    lastCandle.open > vwapResult[0] &&
    lastCandle.close > lastCandle.open &&
    lastCandle.close > vwapResult[0] &&
    (lastCandle.close - lastCandle.open) > (lastCandle.high - lastCandle.close) * 2
  )
  let conditions = vwapReady
  return conditions ? defineOrder(options) : false
}

const defineOrder = options => {
  let rr = strategies.VWAP.params.rr
  let equity = options.equity
  let pair = options.pair
  let history = pair.history
  let SL = 0
  let lbPeriod = 20
  let atr = ATR.calculate({
    reversedInput: true,
    high: history.map(candle => candle.high),
    low: history.map(candle => candle.low),
    close: history.map(candle => candle.close),
    period: 14
  })
  SL = parseFloat(getLowestPriceHistory(history.splice(0, lbPeriod))) - atr[0]

  return {
    currentPrice: pair.bestAsk,
    SL,
    size: equity * 0.05,
    rr,
    type: 'market'
  }
}