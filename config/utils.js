import {
  ATR
} from 'technicalindicators'

import api from '../main.js'

import log, {
  err
} from '../log.js'

import settings from './settings.js'

let quote = settings.quote
let currencies = {}
let orders = []
let excluded = []

let _datafeed = false

export const exclude = coin => excluded.push(coin)

export const isExcluded = coin => excluded.find(x => x == coin)

export const includeIt = coin => excluded.splice(excluded.indexOf(coin), 1)

export const calcPerc = (newValue, oldValue) => ((newValue - oldValue) / oldValue) * 100

export const floor = (value, decimals) => {
  if (typeof value === 'number') value = value.toString()

  let ints = value.split('.')[0]
  let dec = value.split('.')[1]
  if (dec) return ints + '.' + dec.substr(0, decimals)
  else return parseFloat(ints)
}

export const calculateTPPrice = (price, TPP) => parseFloat(price + price * TPP)

export const getBase = (symbol) => symbol.split('-')[0]

export const getQuote = (symbol) => symbol.split('-')[1]

export const calculateSLPrice = (price, SLP) => parseFloat(price - price * SLP)

export const isSufficient = async (currency) => await getBalance(currency) > 10

export const getTickerInfo = (pair, allTickers) => allTickers.find(tick => tick.symbol === pair.symbol)

export const getDecimalPlaces = value => {
  if (typeof value === 'number')
    value.toString()
  if (!value.split('.')[1])
    return 0
  else return value.split('.')[1].length
}
export const getTicker = async symbol => {
  let ticker = await asyncHandler(api.rest.Market.Symbols.getTicker(symbol))
  if (ticker) {
    ticker.data.symbol = symbol
    return ticker.data
  } else return false
}
export const getAllPairs = async QUOTE => {
  let allTickers = await asyncHandler(api.rest.Market.Symbols.getAllTickers())
  if (allTickers) return allTickers.data.ticker.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith(QUOTE || quote))
  else return false
}
export const getAllTickers = async QUOTE => {
  let allTickers = await asyncHandler(api.rest.Market.Symbols.getSymbolsList())
  if (allTickers) return allTickers.data.filter(tick => !tick.symbol.includes('3S') && !tick.symbol.includes('3L') && tick.symbol.endsWith(QUOTE || quote))
  else return false
}
export const getPrice = async pair => {
  let data = await asyncHandler(api.rest.Market.Symbols.getTicker(pair))
  if (data) return data.price
  else return false
}
export const getOrder = async id => {
  let match = orders.find(x => x.orderId == id)
  if (match) return match
  let data = await asyncHandler(api.rest.Trade.Orders.getOrderByID(id))
  if (data) return data.data
  else return false
}
export const getOrderSync = id => orders.find(x => x.orderId == id)

export const cancelOrder = async id => {
  let data = await asyncHandler(api.rest.Trade.Orders.cancelOrder(id))
  if (data) return data.data
  else return false
}
export const getBalance = async currency => {
  // let results = await asyncHandler(api.rest.User.Account.getAccountsList({
  //   type: 'trade',
  //   currency
  // }))
  if (currency) {
    let results = currencies[currency] ? parseFloat(currencies[currency].available) : 0
    if (results == 0) return parseFloat((await getCurrency(currency)).available)
    else return results
  } else return parseFloat(await getCurrency(currency).available)

}
export const getCurrency = async (currency = undefined) => {
  if (currency) {
    let results = await asyncHandler(api.rest.User.Account.getAccountsList({
      type: 'trade',
      currency: currency
    }))
    return results.data ? results.data[0] : false
  } else {
    let results = await asyncHandler(api.rest.User.Account.getAccountsList({
      type: 'trade',
    }))
    if (results && results.data) {
      for (const coin of results.data)
        currencies[coin.currency] = coin
      return currencies
    }
  }

}
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
export const getHistory = async (pair, tf, lookbackPeriods = 1500) => {
  let span = {
    startAt: Math.floor((Date.now() - (tf.value * lookbackPeriods)) / 1000),
    endAt: Math.floor(Date.now() / 1000)
  }
  let data = await asyncHandler(api.rest.Market.Histories.getMarketCandles(pair.symbol, tf.text, span))
  if (!data.data) {
    return false
  }
  let candle = data.data.map(candle => {
    candle = {
      timestamp: parseInt(candle[0]),
      open: parseFloat(candle[1]),
      close: parseFloat(candle[2]),
      high: parseFloat(candle[3]),
      low: parseFloat(candle[4]),
      volume: parseFloat(candle[6]),
    }
    return candle
  })
  candle.shift()
  return candle
}
export const equity = async currency => {
  // if no currency has been recorded, get all
  Object.keys(currencies).length == 0 && await getCurrency()
  // connect
  // _datafeed.connectSocket();
  let topic = `/account/balance`
  _datafeed.subscribe(topic, payload => currencies[currency || payload.data.currency] = payload.data, true)
}
const initSocket = () => {
  _datafeed = new api.websocket.Datafeed(true)
  _datafeed.connectSocket()
}
setTimeout(async () => {
  await initSocket()
  equity()
  updateOrders()
}, 1000);

export const updateOrders = async () => {
  let topic = `/spotMarket/tradeOrders`
  _datafeed.subscribe(topic, payload => {
    let order = payload.data
    if (order.status === 'done' && order.type === 'filled') {
      log(`${order.symbol} filled`);
      orders.push(order)
    }
  }, true)
}

export const postOrder = async (baseParams, orderParams) => {
  let results = await asyncHandler(api.rest.Trade.Orders.postOrder(baseParams, orderParams))
  if (results) {
    let order = await getOrder(results.data.orderId)
    return order
  }
  return false
}
export const asyncHandler = async fn => {
  try {
    let results = await fn
    if (results.msg) {
      log(results.msg);
      return false
    } else return results
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
  getAllPairs,
  getAllTickers,
  getPrice,
  getTickerInfo,
  getOrder
}