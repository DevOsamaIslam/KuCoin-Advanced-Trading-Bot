import {
  MACD,
  ATR
} from 'technicalindicators'

import {
  EMA
} from 'trading-signals'

import {
  getLowestPriceHistory
} from '../config/utils.js'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default options => {
  let lastPrice = options.pair.bestAsk
  let history = options.pair.history
  let lastCandle = history[0]
  history.reverse()
  let ema = new EMA(strategies.MACD.params.ma.period)
  let input = history.map(candle => {
    // get EMA
    ema.update(candle.close)
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
  let cross = macd[1] < signal[1] && macd[0] > signal[0]
  let lastMACD = macd[0] < 0
  let overEMA = emaResult < lastPrice && lastCandle.open > emaResult

  history.reverse()

  let conditions = overEMA && cross && lastMACD

  return conditions ? defineOrder(options) : false
}

const defineOrder = options => {
  let rr = strategies.MACD.params.rr
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