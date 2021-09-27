import settings, {
  timeframes
} from './config/settings.js'

import Trader from './Trader.js'
import {
  isSufficient,
  getHistory,
  defineOrder,
  getAllUsdtPairs,
  getAllUsdtTickers,
  getTickerInfo,
  getTicker,
  getOrder,
  cancelOrder
} from './config/utils.js'
import Orders from './records/model.js'

import api from './main.js'

import log, {
  err
} from './log.js'

export default class Watchdog {
  constructor(options) {
    this.watchlist = settings.watchlist
    this.tf = settings.tf
    this.equity = options.equity
    this.strategy = options.strategy
    this.excluded = []
    this.history = []
    this.datafeed = new api.websocket.Datafeed();
    // connect
    this.datafeed.connectSocket();

    getAllUsdtPairs().then(async data => {
      this.allUsdtTickers = await getAllUsdtTickers()
      if (!this.allUsdtTickers) {
        getAllUsdtPairs();
        return
      }
      this.usdtPairs = data

      // monitor watchlist
      await this.collectHistory(this.watchlist)
      for (const pair of this.history) {
        this.monitor(pair)
      }

      // monitor for volume spike
      // this.volSpike(this.watchlist)

      setInterval(() => this.update(), 60 * 1000);
    })
  }

  async collectHistory(watchlist) {
    while (this.history.length < watchlist.length) {
      let index = this.history.length
      let pair = await getTicker(watchlist[index])
      if (!pair) {
        err(`Pair not found: ${watchlist[count]}`)
        continue
      }
      let history = await getHistory(pair, this.tf)
      if (!history || history.length < 1441) {
        if (!history) err(`Unable to pull history for ${pair.symbol}`)
        if (history.length < 1441) err(`Data not enough for ${pair.symbol}: ${history.length}`)
        continue
      }
      this.history.push({
        ...pair,
        tickerInfo: getTickerInfo(pair, this.allUsdtTickers),
        history
      })
    }
  }

  async monitor(pair) {
    let lastread = false

    // subscribe
    const topic = `/market/candles:${pair.symbol}_${this.tf.text}`;
    this.datafeed.subscribe(topic, message => {
      if (message.topic === topic) {
        let data = message.data.candles

        let candle = {
          timestamp: parseInt(data[0]),
          open: parseFloat(data[1]),
          close: parseFloat(data[2]),
          high: parseFloat(data[3]),
          low: parseFloat(data[4]),
          volume: parseFloat(data[6]),
        }
        if (!lastread) lastread = candle

        if (candle.timestamp !== lastread.timestamp) {
          pair.history.unshift(lastread)
          // console.log(`checking ${pair.symbol}`);
          if (!this.excluded.includes(pair.symbol)) {

            // check if the MACD strategy is enabled
            if (this.strategy.MACD) {
              // enter a trade if the MACD strategy gives the green light and exclude from the watchlist
              if (this.strategy.MACD(pair.bestAsk, pair.history)) {
                this.enter({
                  pair,
                  tickerInfo: pair.tickerInfo,
                  strategy: 'MACD',
                  rr: settings.strategies.MACD.params.rr,
                  history: pair.history
                })
                this.excluded.push(pair.symbol)
              }
            }

            // check if the CMF_MACD strategy is enabled
            else if (this.strategy.CMF_MACD) {
              // enter a trade if the CMF_MACD strategy gives the green light and exclude from the watchlist
              if (this.strategy.CMF_MACD(pair.history)) {
                this.enter({
                  pair,
                  tickerInfo: pair.tickerInfo,
                  strategy: 'CMF+MACD',
                  rr: settings.strategies.CMF_MACD.params.rr,
                  history: pair.history
                })
                this.excluded.push(pair.symbol)
              }
            }

            // check if the VWAP strategy is enabled
            else if (this.strategy.VWAP) {
              // enter a trade if the VWAP strategy gives the green light and exclude from the watchlist
              if (this.strategy.VWAP(pair.bestAsk, pair.history)) {
                this.enter({
                  pair,
                  tickerInfo: pair.tickerInfo,
                  strategy: 'VWAP',
                  rr: settings.strategies.VWAP.params.rr,
                  history: pair.history
                })
                this.excluded.push(pair.symbol)
              }
            }
          }
          lastread = candle
        } else lastread = candle
      }


    });
  }

  async enter(options) {
    let {
      pair,
      tickerInfo,
      strategy,
      rr,
      history
    } = options
    let balance = await isSufficient()
    if (!balance) {
      err(`Insufficient balance!`)
      return
    }
    log(`${strategy} strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);

    // create an order
    let order = defineOrder(this.equity, pair, history, rr)
    if (!order) {
      err(`Error while setting the order for ${pair.symbol}`)
      return
    }
    new Trader({
      pair,
      order,
      tf: this.tf,
      tickerInfo,
      strategy
    })
    // exclude from watchlist
    this.excluded.push(pair.symbol)
  }

  async volSpike(pairs) {
    // loop through the USDT pairs and check the vol of each pair
    for (let pair of pairs) {
      pair = await getTicker(pair)
      if (!pair) continue
      let tickerInfo = getTickerInfo(pair, this.allUsdtTickers)
      if (this.excluded.includes(pair.symbol)) continue
      let history = await getHistory(pair, this.tf, 51)
      if (!history || history.length < 50) continue

      // check if the set up matches Ride The Wave (RTW) strategy
      let signal = this.strategy.RTW && this.strategy.RTW(history)
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

  async update() {
    let orders = await Orders.find({
      status: 'ongoing'
    })
    if (orders) {
      for (const i in orders) {
        let order = orders[i]
        let SLOrder = order.relatedOrders.SL
        let TPOrder = order.relatedOrders.TP
        let updatedSL = false
        let updatedTP = false
        if (!SLOrder || !TPOrder) continue
        do {
          if (!updatedSL) updatedSL = await getOrder(SLOrder.id)
          if (!updatedTP) updatedTP = await getOrder(TPOrder.id)
        } while (!updatedSL || !updatedTP)

        if (updatedSL.stopTriggered) {
          console.log(`Loss on ${order.data.symbol}`);
          order.status = 'SL'
          order.relatedOrders.SL = updatedSL
          cancelOrder(order.relatedOrders.TP.id)
          this.excluded.splice(this.excluded.indexOf(order.data.symbol), 1)
          orders[i].save()
        } else if (updatedTP.stopTriggered) {
          console.log(`Profit on ${order.data.symbol}`);
          order.status = 'TP'
          order.relatedOrders.TP = updatedTP
          cancelOrder(order.relatedOrders.SL.id)
          this.excluded.splice(this.excluded.indexOf(order.data.symbol), 1)
          orders[i].save()
        }
      }

    }
  }




}