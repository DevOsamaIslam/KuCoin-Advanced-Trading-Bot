import api from 'kucoin-node-sdk'

import dotenv from 'dotenv'

dotenv.config()

api.init({
  // baseUrl: 'https://openapi-sandbox.kucoin.com',
  baseUrl: 'https://api.kucoin.com',
  authVersion: 2,
  apiAuth: {
    key: process.env.BOT_API_KEY,
    secret: process.env.BOT_SECRET,
    passphrase: process.env.BOT_PASSPHRASE,
  }
})

import {
  MACD,
  CMF_MACD,
  VWAP
} from './strategies/index'


const getHistory = async (symbol, lookbackPeriods = 1500) => {
  let tf = {
    "value": 60000,
    "text": "1min"
  }
  let span = {
    startAt: Math.floor((Date.now() - (tf.value * lookbackPeriods)) / 1000),
    endAt: Math.floor(Date.now() / 1000)
  }
  // console.log('getting history...');
  let data = await asyncHandler(api.rest.Market.Histories.getMarketCandles(symbol, tf.text, span))
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


const testPair = async pair => {
  let history = await getHistory(pair)
  if (!history) return

  let candles = []

  for (const candle of history) {
    if (candles > 30) {

    }
  }
}