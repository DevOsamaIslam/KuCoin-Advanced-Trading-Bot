import api from './main.js'
import {
  calcPerc,
  getOrder,
} from './config/utils.js'
import log, {
  logStrategy
} from './log.js'

export default class Trader {

  constructor(options) {
    this.pair = options.pair
    this.order = options.order
    this.tf = options.tf
    this.tickerInfo = options.tickerInfo
    this.isNewPair = options.isNewPair
    this.dynamicTPSL = options.dynamicTPSL
    this.strategy = options.strategy
    this.buy().then(order => {
      if (order) {
        this.activeOrder = order;
        if (this.dynamicTPSL)
          this.startDynamicTPSL()
        else if (this.order.SL || this.order.TP) this.stopOrder()
      }
    })

  }

  async buy() {
    // find the lowest quote increment decimal value
    let decimals = this.tickerInfo.baseIncrement ? this.tickerInfo.baseIncrement.split('.')[1].length : 4
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
        stp: 'CO',
        remark: `Strategy: ${this.strategy}`
      },
      orderParams: {
        price: this.order.currentPrice,
        size
      }
    }

    let order = await api.rest.Trade.Orders.postOrder(params.baseParams, params.orderParams)
    if (order.data) {
      let activeOrder = await getOrder(order.data.orderId)
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`${this.order.type === 'market' ? 'Bought' : 'Ordered to buy'} ${this.order.size.toFixed(2)} at $${activeOrder.dealFunds / activeOrder.dealSize}`]
      });
      return activeOrder
    } else {
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`Something went wrong while buying: ${order.msg}`]
      });
      return false
    }
  }

  async sell(options) {
    api.rest.Trade.Orders.postOrder({
      clientOid: `Sell_${this.pair.symbol}_at_${Date.now()}`,
      side: 'sell',
      symbol: this.pair.symbol,
      type: options.type || 'market',
      remark: `Strategy: ${this.strategy} (${this.activeOrder.id})`
    }, {
      size: this.activeOrder.dealSize,
      price: options.price
    }).then(order => {
      if (order.data) {
        log(`Sold ${Math.floor(this.activeOrder.dealSize)} of ${this.pair.symbol} (${order.data.orderId})`)
        return true
      } else {
        log(`Something went wrong while selling: ${order.msg}`)
        return false
      }
    })
  }

  stopOrder() {
    this.setTP()
    let decimals = this.tickerInfo.baseIncrement.split('.')[1].length || 4
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
        stp: 'CO',
        remark: `Strategy: ${this.strategy}`
      }, {
        size: dealSize
      }).then(order => {
        order.data ?
          logStrategy({
            strategy: this.strategy,
            pair: this.pair,
            orderId: this.activeOrder.id,
            data: [`Stop Loss is ${this.order.SL} (${order.data.orderId})`]
          }) :
          logStrategy({
            strategy: this.strategy,
            pair: this.pair,
            orderId: this.activeOrder.id,
            data: [`Something went wrong while setting a stop loss: ${order.msg}`]
          });
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
        stp: 'CO',
        remark: `Strategy: ${this.strategy}`
      }, {
        size: dealSize
      }).then(order => {
        this.TPOrder = order.data
        order.data ?
          logStrategy({
            strategy: this.strategy,
            pair: this.pair,
            orderId: this.activeOrder.id,
            data: [`Take Profit is ${this.order.TP} (${order.data.orderId})`]
          }) :
          logStrategy({
            strategy: this.strategy,
            pair: this.pair,
            orderId: this.activeOrder.id,
            data: [`Something went wrong while setting a take profit: ${order.msg}`]
          });
      })
  }

  setTP() {
    let price = this.activeOrder.dealFunds / this.activeOrder.dealSize
    let SLP = calcPerc(SL, price)
    let TPP = Math.abs(SLP) * this.order.rr
    this.order.TP = price * (TPP / 100 + 1)
    return TP
  }

  startDynamicTPSL() {
    let lastPrice = this.activeOrder.price
    let boughtPrice = parseFloat(this.activeOrder.dealFunds / this.activeOrder.size)
    this.dynamicTPSL.TP = boughtPrice * (this.dynamicTPSL.TPP / 100 + 1)
    this.dynamicTPSL.SL = this.order.SL
    this.dynamicTPSL.height = this.dynamicTPSL.TP - this.dynamicTPSL.SL
    logStrategy({
      strategy: this.strategy,
      pair: this.pair,
      orderId: this.activeOrder.id,
      data: [`Ceiling: $${this.dynamicTPSL.TP}`, `Bought for: $${this.order.currentPrice}`, `Floor: $${this.dynamicTPSL.SL}`]
    });

    const datafeed = new api.websocket.Datafeed();
    // connect
    datafeed.connectSocket();
    const topic = `/market/ticker:${this.pair.symbol}`;
    log(`Started monitoring ${this.pair.symbol}.....`);
    const callbackId = datafeed.subscribe(topic, (message) => {

      let {
        bestBid
      } = message.data

      let newPrice = bestBid

      if (lastPrice != newPrice) {
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`New Price: $${newPrice}`]
        });
        lastPrice = newPrice
      }
      if (newPrice > this.dynamicTPSL.TP) {
        this.dynamicTPSL.TP = newPrice
        this.dynamicTPSL.SL = newPrice - this.dynamicTPSL.height
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`New TP: ${this.dynamicTPSL.TP}\nNew SL: ${this.dynamicTPSL.SL}`]
        });
      } else if (newPrice <= this.dynamicTPSL.SL) {
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`SL hit: ${this.dynamicTPSL.SL}`]
        });
        this.sell().then(data => {
          if (!data)
            this.sell({
              type: 'limit',
              price: bestBid * 0.98
            })
        })
        datafeed.unsubscribe(topic, callbackId)
      }

    })
  }


}