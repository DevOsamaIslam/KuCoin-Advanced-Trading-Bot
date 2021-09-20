import settings from './config/settings.js'

import Trader from './Trader.js'
import {
  isSufficient,
  getHistory,
  defineOrder,
  getAllUsdtPairs,
  getAllUsdtTickers,
  getTickerInfo,
  getEquity,
  getTicker
} from './config/utils.js'

import log from './log.js'

import strategy from './strategies/index.js'

import api from './main.js'

export default class Watchdog {
  constructor(equity) {
    this.watchlist = settings.watchlist
    this.tf = settings.tf
    this.equity = equity
    this.excluded = []

    getAllUsdtPairs().then(async data => {
      this.allUsdtTickers = await getAllUsdtTickers()
      if (!this.allUsdtTickers) {
        getAllUsdtPairs();
        return
      }
      this.usdtPairs = data

      // monitor watchlist
      this.monitor(this.watchlist)

      // monitor for volume spike
      this.volSpike(this.watchlist)
    })
  }


  async monitor(watchlist) {
    // loop through the watchlist and check the vol of each pair
    let count = 0
    setInterval(async () => {
      if (count >= watchlist.length) count = 0
      let pair = await getTicker(watchlist[count])
      if (!pair) {
        log(`Pair not found: ${watchlist[count]}`)
        count++
        return
      }
      // get that pair's information
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      // if the exclusion list is more than half the watchlist, remove the first element
      if (this.excluded.length > watchlist.length / 2) this.excluded.shift()
      // if the pair was excluded, stop it and move on to the next
      if (this.excluded.includes(pair.symbol)) {
        count++
        return
      }
      let history = await getHistory(pair, this.tf, settings.strategies.lookbackPeriod + 5)
      if (!history || history.length < settings.strategies.lookbackPeriod) {
        if (!history) log(`Unable to pull history for ${pair.symbol}`)
        if (history.length < settings.strategies.lookbackPeriod) log(`Data not enough for ${pair.symbol}: ${history.length}`)
        count++
        return
      }

      // check if the set up matches MACD strategy
      console.log(`checking ${pair.symbol}`);
      let signal = strategy.MACD(pair.bestAsk, history)
      if (signal) {
        let balance = await isSufficient()
        if (!balance) {
          log(`Insufficient balance!`)
          count++
          return
        }
        log(`MACD strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);

        // create an order
        let order = defineOrder(this.equity, pair, history, settings.strategies.MACD.params.rr)
        if (!order) {
          log(`Error while setting the order for ${pair.symbol}`)
          count++
          return
        }
        new Trader({
          pair,
          order,
          tf: this.tf,
          tickerInfo,
          strategy: 'MACD'
        })
        // exclude from watchlist
        this.excluded.push(pair.symbol)
      }
      count++
    }, 1000 * 5);

  }

  async volSpike(pairs) {
    // loop through the USDT pairs and check the vol of each pair
    for (let pair of pairs) {
      pair = await getTicker(pair.symbol)
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      if (this.excluded.includes(pair.symbol)) continue
      let history = await getHistory(pair, this.tf, 51)
      if (!history || history.length < 50) continue

      // check if the set up matches Ride The Wave (RTW) strategy
      let signal = strategy.RTW(history)
      if (signal) {
        log(`RIDE THE WAVE strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);
        // buy it
        let order = defineOrder(this.equity, pair, history, settings.strategies.RTW.params.risk)
        if (!order) continue
        order.size = this.equity * settings.strategies.RTW.params.risk
        let dynamicTPSL = {
          TPP: settings.strategies.RTW.params.TPP,
          SLP: settings.strategies.RTW.params.SLP
        }

        new Trader({
          pair,
          order,
          tf: this.tf,
          tickerInfo,
          dynamicTPSL,
          strategy: 'RTW'
        })
        // exclude from watchlist
        this.excluded.push(pair.symbol)
      }
    }
    this.volSpike(this.watchlist)
  }




}