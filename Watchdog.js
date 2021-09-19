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
      // this.volSpike(this.usdtPairs)
    })
  }
  // async watchNewPair() {
  //   console.log('monitoring new pairs...');
  //   this.allUsdtTickers = await getAllUsdtTickers()
  //   if (!this.allUsdtTickers)
  //     return
  //   this.untradeables = this.allUsdtTickers.filter(ticker => !ticker.enableTrading)
  //   // loop through all new tickers and check if their trading status (enableTrading) changed to true
  //   for (const pair of this.untradeables) {
  //     let status = this.allUsdtTickers.find(tick => tick.symbol == pair.symbol).enableTrading
  //     if (!status) continue
  //     console.log(`New Pair found: ${pair.symbol}`);
  //     let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
  //     this.equity = await getEquity('USDT')
  //     this.monitorNew(pair, tickerInfo)

  //   }
  //   // wait for one minute to check again for new pairs
  //   setTimeout(() => this.watchNewPair(), 60 * 1000);

  // }

  // async monitorNew(pair, tickerInfo) {
  //   // monitor new pair
  //   const datafeed = new api.websocket.Datafeed();
  //   // connect
  //   datafeed.connectSocket();
  //   const topic = `/market/ticker:${pair.symbol}`;
  //   let callbackId = datafeed.subscribe(topic, (message) => {
  //     let feed = message.data
  //     log(`\n\nNew Pair ${pair.symbol} found..............\n\n`);
  //     if (feed.bestAsk > 0) {
  //       log(`Trying to buy ${pair.symbol}...`);
  //       let dynamicTPSL = {
  //         TP: feed.bestAsk * settings.strategies.SNIPER.params.TPP,
  //         SL: feed.bestAsk * settings.strategies.SNIPER.params.SLP,
  //       }
  //       let order = {
  //         size: this.equity * settings.strategies.SNIPER.params.risk,
  //         currentPrice: parseFloat(feed.bestAsk * 1.1).toFixed(feed.bestAsk.split('.')[1].length),
  //         type: 'limit',
  //       }
  //       new Trader({
  //         pair,
  //         order,
  //         tf: this.tf,
  //         tickerInfo,
  //         isNewPair: true,
  //         dynamicTPSL,
  //         strategy: 'Sniper'
  //       })
  //       datafeed.unsubscribe(topic, callbackId);
  //     }
  //   });
  // }



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
      let history = await getHistory(pair, this.tf, settings.strategies.lookbackPeriod + 1)
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

  async volSpike(usdtTickers) {
    console.log('checking volume spike...');
    // loop through the USDT pairs and check the vol of each pair
    for (let pair of usdtTickers) {
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      if (this.excluded.includes(pair.symbol)) continue
      let history = await getHistory(pair, this.tf, 51)
      if (!history || history.length < 50) continue

      // check if the set up matches Ride The Wave (RTW) strategy
      let signal = strategy.RTW(history)
      if (signal) {
        log(`RIDE THE WAVE strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);
        // buy it
        let order = defineOrder(this.equity, pair, history, 1.5)
        if (!order) continue
        order.size = this.equity * 0.05
        let dynamicTPSL = {
          TPP: order.TPP,
          SLP: order.SLP
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
    this.volSpike(this.usdtPairs)
  }




}