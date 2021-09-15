import {
  ATR
} from 'technicalindicators'

import api from '../main.js'


export const calcPerc = (newValue, oldValue) => ((newValue - oldValue) / oldValue) * 100

export const calculateTPPrice = (price, TPP) => parseFloat(price + price * TPP)

export const calculateSLPrice = (price, SLP) => parseFloat(price - price * SLP)

export const isSufficient = async () => await getBalance() > 10

export const getAllUsdtPairs = async () => {
  let allUsdtTickers = await asyncHandler(api.rest.Market.Symbols.getAllTickers())
  if (allUsdtTickers) return allUsdtTickers.data.ticker.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith('USDT'))
  else return false
}

export const getAllUsdtTickers = async () => (await asyncHandler(api.rest.Market.Symbols.getSymbolsList())).data.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith('USDT')) || false
// let allUsdtTickers = await asyncHandler(api.rest.Market.Symbols.getSymbolsList())
// if (allUsdtTickers) return allUsdtTickers.data.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith('USDT'))
// else return false
export const getPrice = async pair => (await asyncHandler(api.rest.Market.Symbols.getTicker(pair))).price || false

export const getTickerInfo = (pair, allUsdtTickers) => allUsdtTickers.find(tick => tick.symbol === pair.symbol)

export const getOrder = async id => (await asyncHandler(api.rest.Trade.Orders.getOrderByID(id))).data

export const getLastPrice = async pair => (await asyncHandler(api.rest.Market.Symbols.getTicker(pair))).data.price

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
    let low = parseFloat(candle[4])
    if (low <= lowestPrice)
      lowestPrice = low
  }
  return lowestPrice
}

export const getATR = history => {
  let input = {
    close: history.map(candle => candle[2]),
    high: history.map(candle => candle[3]),
    low: history.map(candle => candle[4]),
    period: 14
  }
  let atr = ATR.calculate(input)[0]
  console.log('atr:', atr);
  return atr
}

export const getHistory = async (pair, tf, lookbackPeriods) => {
  let span = {
    startAt: Math.floor((Date.now() - (tf.value * lookbackPeriods)) / 1000),
    endAt: Math.floor(Date.now() / 1000)
  }
  let data = await asyncHandler(api.rest.Market.Histories.getMarketCandles(pair.symbol, tf.text, span))
  if (!data.data) {
    console.log('getHistory:', data);
    return false
  }
  return data.data
}

export const defineOrder = async (equity, pair, tf, rr) => {
  /*
    check the last 20 candles and get the lowest price (getLowestPriceHistory)
    Then get the RR from the environment variable and calculate the Take Profit price

    Returns:
    - Stop Loss
    - Take Profit
  */
  let SL = 0
  let lbPeriod = 50
  do {
    let history = await getHistory(pair, tf, lbPeriod)
    if (!history) return false
    history.reverse()
    let atr = ATR.calculate({
      reversedInput: true,
      high: history.map(candle => candle[3]),
      low: history.map(candle => candle[4]),
      close: history.map(candle => candle[2]),
      period: 14
    })
    SL = parseFloat(getLowestPriceHistory(history)) + atr[0]
    lbPeriod += 10
  } while (SL >= parseFloat(pair.sell))

  let SLP = calcPerc(SL, pair.sell)
  let TPP = Math.abs(SLP) * rr
  let TP = pair.sell * (TPP / 100 + 1)

  return {
    currentPrice: pair.sell,
    SLP,
    SL,
    TPP,
    TP,
    size: equity * 0.1,
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
    console.log('asyncHandler error:', error);
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