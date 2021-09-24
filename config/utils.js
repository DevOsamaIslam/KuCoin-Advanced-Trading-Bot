import {
  ATR
} from 'technicalindicators'

import api from '../main.js'

import {
  err
} from '../log.js'

export const getDecimalPlaces = value => {
  if (typeof value === 'number')
    value.toString()
  if (!value.split('.')[1])
    return 0
  else return value.split('.')[1].length
}

export const calcPerc = (newValue, oldValue) => ((newValue - oldValue) / oldValue) * 100

export const calculateTPPrice = (price, TPP) => parseFloat(price + price * TPP)

export const calculateSLPrice = (price, SLP) => parseFloat(price - price * SLP)

export const isSufficient = async () => await getBalance() > 10

export const getTickerInfo = (pair, allUsdtTickers) => allUsdtTickers.find(tick => tick.symbol === pair.symbol)

export const getTicker = async symbol => {
  let ticker = await asyncHandler(api.rest.Market.Symbols.getTicker(symbol))
  if (ticker) {
    ticker.data.symbol = symbol
    return ticker.data
  } else return false
}

export const getAllUsdtPairs = async () => {
  let allUsdtTickers = await asyncHandler(api.rest.Market.Symbols.getAllTickers())
  if (allUsdtTickers) return allUsdtTickers.data.ticker.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith('USDT'))
  else return false
}
export const getAllUsdtTickers = async () => {
  let allUsdtTickers = await asyncHandler(api.rest.Market.Symbols.getSymbolsList())
  if (allUsdtTickers) return allUsdtTickers.data.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith('USDT'))
  else return false
}
export const getPrice = async pair => {
  let data = await asyncHandler(api.rest.Market.Symbols.getTicker(pair))
  if (data) return data.price
  else return false
}
export const getOrder = async id => {
  let data = await asyncHandler(api.rest.Trade.Orders.getOrderByID(id))
  if (data) return data.data
  else return false
}
export const cancelOrder = async id => {
  let data = await asyncHandler(api.rest.Trade.Orders.cancelOrder(id))
  if (data) return data.data
  else return false
}
export const getLastPrice = async pair => {
  let data = await asyncHandler(api.rest.Market.Symbols.getTicker(pair))
  if (data) return data.data.price
  else return false
}
export const getBalance = async () => (
  await asyncHandler(api.rest.User.Account.getAccountsList({
    type: 'trade',
    currency: 'USDT'
  }))).data[0].available

export const getEquity = async (currency) => (await api.rest.User.Account.getAccountsList({
  type: 'trade',
  currency: currency
})).data[0].available

export const getLowestPriceHistory = history => {
  /*
    get the lowest close of the last 20 candles of a specified pair

    Returns:
    - The lowset price
  */
  let lowestPrice = 999999999999
  for (let candle of history) {
    let low = parseFloat(candle.low)
    if (low <= lowestPrice)
      lowestPrice = low
  }
  return lowestPrice
}

export const getATR = history => {
  let input = {
    close: history.map(candle => candle.close),
    high: history.map(candle => candle.high),
    low: history.map(candle => candle.low),
    period: 14
  }
  let atr = ATR.calculate(input)[0]
  return atr
}

export const getHistory = async (pair, tf, lookbackPeriods) => {
  let span = {
    startAt: Math.floor((Date.now() - (tf.value * lookbackPeriods)) / 1000),
    endAt: Math.floor(Date.now() / 1000)
  }
  // console.log('getting history...');
  let data = await asyncHandler(api.rest.Market.Histories.getMarketCandles(pair.symbol, tf.text, span))
  if (!data.data) {
    return false
  }
  return data.data.map(candle => {
    candle = {
      timestamp: candle[0],
      open: candle[1],
      close: candle[2],
      high: candle[3],
      low: candle[4],
      volume: candle[6],
    }
    return candle
  })
}

export const defineOrder = (equity, pair, history, rr) => {

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


export const asyncHandler = async fn => {
  try {
    let results = await fn
    if (results.msg) {
      console.log(results.msg);
      return false
    }
    return results
  } catch (error) {
    err(`asyncHandler error: ${JSON.stringify(error)}`);
    return false
  }
}


export default {
  calcPerc,
  calculateTPPrice,
  calculateSLPrice,
  isSufficient,
  getBalance,
  getLowestPriceHistory,
  getHistory,
  defineOrder,
  getAllUsdtPairs,
  getAllUsdtTickers,
  getPrice,
  getTickerInfo,
  getOrder,
  getLastPrice
}