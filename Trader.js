import {
  asyncHandler
} from "./config/utils.js"
import api from './main.js'
import {
  getOrder,
} from './config/utils.js'
import {
  appendFileSync
} from 'fs'

export default class Trader {

  constructor(options) {
    this.pair = options.pair
    this.order = options.order
    this.tf = options.tf
    this.tickerInfo = options.tickerInfo
    this.isNewPair = options.isNewPair
    this.dynamicTPSL = options.dynamicTPSL
    this.buy().then(order => {
      if (order) {
        this.activeOrder = order;
        this.dynamicTPSL & this.startDynamicTPSL()
        this.order.SL || this.order.TP & this.stopOrder()
      }
    })

  }

  async buy() {
    // find the lowest quote increment decimal value
    let decimals = this.tickerInfo.quoteIncrement.split('.')[1].length || 4
    // get the order size in the base currency (the one you want to buy)
    let size = (this.order.size / (this.pair.sell || this.order.currentPrice)).toFixed(decimals)
    // check if the order size is less-than/equal-to the minimum
    if (size <= this.tickerInfo.baseMinSize) return false

    let params = {
      baseParams: {
        clientOid: `${this.order.type ||'Market'}_Buy_${this.pair.symbol}_at_${Date.now()}`,
        side: 'buy',
        symbol: this.pair.symbol,
        type: this.order.type || 'market',
        stp: 'CO'
      },
      orderParams: this.order.type === 'limit' ? {
        price: this.order.currentPrice,
        size
      } : {
        size
      }
    }

    let order = await api.rest.Trade.Orders.postOrder(params.baseParams, params.orderParams)
    if (order.data) {
      let activeOrder = await getOrder(order.data.orderId)
      console.log(`${this.order.type === 'market' ? 'Bought' : 'Ordered to buy'} ${this.order.size.toFixed(2)} of ${this.pair.symbol} at $${activeOrder.price}`)
      return activeOrder
    } else {
      console.log(order);
      return false
    }
  }

  async marketSell() {
    api.rest.Trade.Orders.postOrder({
      clientOid: `Sell_${this.pair.symbol}_at_${Date.now()}`,
      side: 'sell',
      symbol: this.pair.symbol,
      type: 'market',
    }, {
      size: this.activeOrder.dealSize
    }).then(data => {
      this.orderId = data.data.orderId
      console.log(`Sold ${Math.floor(this.activeOrder.dealSize)} of ${this.pair.symbol}`);
    })
  }

  stopOrder() {
    let decimals = this.tickerInfo.quoteIncrement.split('.')[1].length || 4
    let dealSize = parseFloat(this.activeOrder.dealSize).toFixed(decimals - 1)
    // stop loss
    if (this.order.SL)
      api.rest.Trade.StopOrder.postStopOrder({
        clientOid: `SLSell_${this.pair.symbol}_at_${Date.now()}`,
        side: 'sell',
        symbol: this.pair.symbol,
        type: 'market',
        stop: 'loss',
        stopPrice: this.order.SL,
        stp: 'CO'
      }, {
        size: dealSize
      }).then(order => {
        order.data ? console.log(`Stop Loss is ${this.order.SL} (${order.data.orderId})`) : console.log(order);
      })

    // take profit
    if (this.order.TP)
      api.rest.Trade.StopOrder.postStopOrder({
        clientOid: `TPSell_${this.pair.symbol}_at_${Date.now()}`,
        side: 'sell',
        symbol: this.pair.symbol,
        type: 'market',
        stop: 'entry',
        stopPrice: this.order.TP,
        stp: 'CO'
      }, {
        size: dealSize
      }).then(order => {
        this.TPOrder = order.data
        order.data ? console.log(`Take Profit is ${this.order.TP} (${order.data.orderId})`) : console.log(order);
      })
  }

  startDynamicTPSL() {
    let logPath = `./records/RTW/${this.isNewPair ? 'New Pair_' : ''}${this.pair.symbol}_${this.activeOrder.id}.log`
    let lastPrice = this.activeOrder.price
    let boughtPrice = parseFloat(this.activeOrder.dealFunds / this.activeOrder.size)
    this.dynamicTPSL.TP = boughtPrice * (this.dynamicTPSL.TPP / 100 + 1)
    this.dynamicTPSL.SL = this.order.SL
    this.dynamicTPSL.height = this.dynamicTPSL.TP - this.dynamicTPSL.SL
    appendFileSync(logPath, `${new Date()} Ceiling: $${this.dynamicTPSL.TP}\n`);
    appendFileSync(logPath, `${new Date()} Bought for: $${this.order.currentPrice}\n`);
    appendFileSync(logPath, `${new Date()} Floor: $${this.dynamicTPSL.SL}\n`);

    const datafeed = new api.websocket.Datafeed();
    // connect
    datafeed.connectSocket();
    const topic = `/market/ticker:${this.pair.symbol}`;
    console.log(`Started monitoring ${this.pair.symbol}.....`);
    const callbackId = datafeed.subscribe(topic, (message) => {

      let {
        bestBid
      } = message.data

      let newPrice = bestBid

      if (lastPrice != newPrice) {
        appendFileSync(logPath, `${new Date()} New Price: $${newPrice}\n`);
        lastPrice = newPrice
      }
      if (newPrice > this.dynamicTPSL.TP) {
        this.dynamicTPSL.TP = newPrice
        this.dynamicTPSL.SL = newPrice - this.dynamicTPSL.height
        appendFileSync(logPath, `New TP: ${this.dynamicTPSL.TP}\n`);
        appendFileSync(logPath, `New SL: ${this.dynamicTPSL.SL}\n`);
      } else if (newPrice <= this.dynamicTPSL.SL) {
        appendFileSync(logPath, `SL hit: ${this.dynamicTPSL.SL}\n`);
        this.marketSell()
        datafeed.unsubscribe(topic, callbackId)
      }

    })
  }


}