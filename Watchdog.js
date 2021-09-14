import {
  appendFileSync,
  writeFileSync,
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
      this.untradeables = this.allUsdtTickers.filter(ticker => !ticker.enableTrading)
      this.watchNewPair(this.untradeables)

      // monitor watchlist
      this.monitor(this.watchlist)

      // monitor for volume spike
      this.volSpike(this.usdtPairs)
    })
  }
  async watchNewPair() {
    console.log('monitoring new pairs...');
    // loop through all new tickers and check if their trading status (enableTrading) changed to true
    for (const pair of this.untradeables) {
      let status = (await getAllUsdtTickers()).find(tick => tick.symbol == pair.symbol).enableTrading
      if (!status) continue

      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      // monitor new pair
      const datafeed = new api.websocket.Datafeed();
      // connect
      datafeed.connectSocket();
      const topic = `/market/pair:${pair.symbol}`;
      let callbackId = datafeed.subscribe(topic, async message => {
        let equity = await getEquity('USDT')
        if (equity) {
          let feed = message.data
          if (feed.bestAsk > 0) {
            console.log(`\n\nNew Pair ${pair.symbol} found..............\n\n`);
            let dynamicTPSL = {
              TP: feed.bestAsk * 1.3,
              SL: feed.bestAsk * 0.8,
            }
            let order = {
              size: equity * 0.5,
              currentPrice: feed.bestAsk,
              type: 'limit',
            }
            new Trader({
              pair: pair,
              order,
              tf: this.tf,
              tickerInfo,
              isNewPair: true,
              dynamicTPSL
            })
            datafeed.unsubscribe(topic, callbackId);
          }
        }
      });

    }
    this.untradeables = this.allUsdtTickers.filter(ticker => !ticker.enableTrading)
    this.allUsdtTickers = await getAllUsdtTickers() || this.allUsdtTickers
    this.watchNewPair()
  }



  async monitor(watchlist) {
    console.log('checking MACD strategy...');
    // loop through the watchlist and check the vol of each pair
    for (let pair of watchlist) {
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      if (this.excluded.includes(pair.symbol)) continue
      let history = await getHistory(pair, timeframes[timeframes.indexOf(this.tf) + 2], 201)
      if (!history || history.length < 201) continue

      // check if the set up matches MACD strategy
      let signal = strategy.MACD(pair.sell, history)
      if (signal) {
        let balance = await isSufficient()
        if (!balance) continue
        console.log(`\nMACD strategy gives the green light to buy ${pair.symbol} at $${pair.sell} - ${new Date()} on ${timeframes[timeframes.indexOf(this.tf) + 2].text} timeframe\n`);
        appendFileSync(`./records/MACD/buy ${pair.symbol} at ${pair.sell} on ${timeframes[timeframes.indexOf(this.tf) + 2].text} timeframe.json`, JSON.stringify(history));

        // buy it
        let order = await defineOrder(this.equity, pair, timeframes[timeframes.indexOf(this.tf) + 2], 1.5)
        if (!order) continue
        new Trader({
          pair,
          order,
          tf: timeframes[timeframes.indexOf(this.tf) + 2],
          tickerInfo,
        })
        // exclude from watchlist
        this.excluded.push(pair.symbol)
        continue
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
      //   })
      //   // exclude from watchlist
      //   this.excluded.push(pair.symbol)
      //   continue
      // }

    }

    setTimeout(() => {
      this.monitor(this.watchlist)
    }, 5000);

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
        console.log(`\nRIDE THE WAVE strategy gives the green light to buy ${pair.symbol} at $${pair.sell} - ${new Date()} on ${timeframes[timeframes.indexOf(this.tf) + 4].text} timeframe`);
        // buy it
        let order = await defineOrder(this.equity, pair, timeframes[timeframes.indexOf(this.tf) + 4], 2)
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
          dynamicTPSL
        })
        // exclude from watchlist
        this.excluded.push(pair.symbol)
      }
    }
    this.volSpike(this.usdtPairs)
  }




}