import settings, {
  timeframes
} from './config/settings.js'

import Trader from './Trader.js'
import {
  isSufficient,
  getBalance,
  getHistory,
  getAllPairs,
  getAllTickers,
  getTickerInfo,
  getTicker,
  getOrder,
  cancelOrder,
  getQuote
} from './config/utils.js'
import Orders from './records/model.js'

import api from './main.js'

import log, {
  err,
  verbose
} from './log.js'
import strategies from './strategies/index.js'

export default class Watchdog {
  constructor(strategy) {
    this.watchlist = settings.watchlist
    this.tf = settings.tf
    this.equity = 0
    this.strategy = {...settings.strategies[strategy], name: strategy}
    this.excluded = []
    this.history = []
  }

  async execute() {
    this.allTickers = await getAllTickers()
    this.equity = await getBalance(settings.quote)
    if (!this.allTickers) {
      getAllPairs();
      return
    }

    // monitor watchlist
    await this.collectHistory(this.watchlist)
    for (const pair of this.history) {
      this.monitor(pair)
      setInterval(() => {
        this.monitor(pair)
      }, settings.tf.value);
    }

    // setInterval(() => this.update(), 60 * 1000);
  }

  async collectHistory(watchlist) {
    while (this.history.length < watchlist.length) {
      let index = this.history.length
      let pair = await getTicker(watchlist[index])
      if (!pair) {
        err(`Pair not found: ${watchlist[count]}`)
        continue
      }
      let history = await getHistory(pair, this.tf, 210)
      if (!history || history.length < 200) {
        if (!history) err(`Unable to pull history for ${pair.symbol}`)
        if (history.length < 1441) err(`Data not enough for ${pair.symbol}: ${history.length}`)
        continue
      }
      this.history.push({
        ...pair,
        tickerInfo: getTickerInfo(pair, this.allTickers),
        history
      })
    }
  }

  async monitor(pair) {
    console.log(pair);
    let order = strategies[this.strategy.name](pair)
    if(order) {
      order.size = this.equity * settings.risk
      this.enter({
        pair,
        tickerInfo: getTickerInfo(pair, this.allTickers),
        strategy: this.strategy.name,
        order
      })
    } 
  }

  async enter(options) {
    let {
      pair,
      tickerInfo,
      strategy,
      order
    } = options
    let balance = await isSufficient(getQuote(pair.symbol))
    if (!balance) {
      err(`Insufficient balance!`)
      return false
    }
    log(`${strategy} strategy gives the green light to buy ${pair.symbol} at market value on ${this.tf.text} timeframe`);

    new Trader({
      pair,
      order,
      tf: this.tf,
      tickerInfo,
      strategy
    }).execute()
  }

  async volSpike(pairs) {
    // loop through the  pairs and check the vol of each pair
    for (let pair of pairs) {
      pair = await getTicker(pair)
      if (!pair) continue
      let tickerInfo = getTickerInfo(pair, this.allTickers)
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