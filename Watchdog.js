import {
  appendFileSync,
} from 'fs'

import Trader from './Trader.js'
import {
  isSufficient,
  getHistory,
  defineOrder,
  getAllUsdtPairs,
  getAllUsdtTickers,
  getTickerInfo,
  getEquity
} from './config/utils.js'

import log from './log.js'

import {
  timeframes
} from './main.js'

import strategy from './strategies/index.js'

import api from './main.js'

export default class Watchdog {
  constructor(equity, watchlist, tf) {
    this.watchlist = watchlist
    this.tf = tf
    this.equity = equity
    this.excluded = []

    getAllUsdtPairs().then(async data => {
      this.allUsdtTickers = await getAllUsdtTickers()
      if (!this.allUsdtTickers) {
        getAllUsdtPairs();
        return
      }
      this.usdtPairs = data
      this.watchlist = this.usdtPairs.filter(pair => watchlist.includes(pair.symbol))

      // strategies

      // Watch for new pairs
      this.watchNewPair()

      // monitor watchlist
      this.monitor(this.watchlist)

      // monitor for volume spike
      // this.volSpike(this.usdtPairs)
    })
  }
  async watchNewPair() {
    // console.log('monitoring new pairs...');
    this.allUsdtTickers = await getAllUsdtTickers()
    this.untradeables = this.allUsdtTickers.filter(ticker => !ticker.enableTrading)
    // loop through all new tickers and check if their trading status (enableTrading) changed to true
    for (const pair of this.untradeables) {
      let status = this.allUsdtTickers.find(tick => tick.symbol == pair.symbol).enableTrading
      if (status) continue

      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      this.equity = await getEquity('USDT')
      this.monitorNew(pair, tickerInfo)

    }
    // wait for one minute to check again for new pairs
    setTimeout(async () => {
      this.watchNewPair()
    }, 30 * 1000);

  }

  async monitorNew(pair, tickerInfo) {
    // monitor new pair
    const datafeed = new api.websocket.Datafeed();
    // connect
    datafeed.connectSocket();
    const topic = `/market/ticker:${pair.symbol}`;
    let callbackId = datafeed.subscribe(topic, (message) => {
      let feed = message.data
      console.log(`Trying to buy ${pair.symbol}...`);
      if (feed.bestAsk > 0) {
        console.log(`\n\nNew Pair ${pair.symbol} found..............\n\n`);
        let dynamicTPSL = {
          TP: feed.bestAsk * 1.3,
          SL: feed.bestAsk * 0.8,
        }
        let order = {
          size: this.equity * 0.5,
          currentPrice: parseFloat(feed.bestAsk * 1.1).toFixed(feed.bestAsk.split('.')[1].length),
          type: 'limit',
        }
        new Trader({
          pair,
          order,
          tf: this.tf,
          tickerInfo,
          isNewPair: true,
          dynamicTPSL,
          strategy: 'Sniper'
        })
        datafeed.unsubscribe(topic, callbackId);
      }
    });
  }



  async monitor(watchlist) {
    // loop through the watchlist and check the vol of each pair
    let count = 0
    setInterval(async () => {
      let pair = watchlist[count]
      console.log(`Checking ${pair.symbol}`);
      // get that pair's information
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      // if the exclusion list is more than half the watchlist, remove the first element
      if (this.excluded.length > watchlist.length / 2) this.excluded.shift()
      // if the pair was excluded, stop it and move on to the next
      if (this.excluded.includes(pair.symbol)) {
        count++
        return
      }
      let history = await getHistory(pair, this.tf, 201)
      if (!history || history.length < 200) {
        count++
        return
      }

      // check if the set up matches MACD strategy
      let signal = strategy.MACD(pair.sell, history)
      if (signal) {
        let balance = await isSufficient()
        if (!balance) {
          count++
          return
        }
        log(`MACD strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);

        // create an order
        let order = defineOrder(this.equity, pair, history, 1.5)
        if (!order) {
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

      // // check if the set up matches VWAP strategy
      // signal = strategy.VWAP(pair.sell, history)
      // if (signal) {
      //   console.log(`\nVWAP strategy gives the green light to buy ${pair.symbol} at $${pair.sell} - ${new Date()} on ${timeframes[timeframes.indexOf(this.tf) + 2].text} timeframe\n`);
      //   appendFileSync(`./records/VWAP/buy ${pair.symbol} at ${pair.sell} on ${timeframes[timeframes.indexOf(this.tf) + 2].text} timeframe.json`, JSON.stringify(history));

      //   // buy it
      //   let order = await defineOrder(this.equity, pair, timeframes[timeframes.indexOf(this.tf) + 2], 1.5)
      //   if (!order) continue
      //   new Trader({
      //     pair,
      //     order,
      //     tf: timeframes[timeframes.indexOf(this.tf) + 2],
      //     tickerInfo,
      //     strategy: 'VWAP'
      //   })
      //   // exclude from watchlist
      //   this.excluded.push(pair.symbol)
      //   continue
      // }
      count++
      if (count >= watchlist.length) {
        console.log('checking MACD strategy...');
        count = 0
      }
      if (this.excluded.length > watchlist.length / 2) {
        this.excluded.shift()
        this.excluded.shift()
        this.excluded.shift()
        this.excluded.shift()
      }

    }, 1000 * 5);

  }

  async volSpike(usdtTickers) {
    console.log('checking volume spike...');
    // loop through the USDT pairs and check the vol of each pair
    for (let pair of usdtTickers) {
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      if (this.excluded.includes(pair.symbol)) continue
      let history = await getHistory(pair, timeframes[timeframes.indexOf(this.tf) + 4], 51)
      if (!history || history.length < 50) continue

      // check if the set up matches Ride The Wave (RTW) strategy
      let signal = strategy.RTW(history)
      if (signal) {
        log(`RIDE THE WAVE strategy gives the green light to buy ${pair.symbol} at market value on ${timeframes[timeframes.indexOf(this.tf) + 4].text} timeframe`);
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