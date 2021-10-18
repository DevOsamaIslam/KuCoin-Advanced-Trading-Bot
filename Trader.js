import api from './main.js'
import {
  calcPerc,
  getOrder,
  getOrderSync,
  getDecimalPlaces,
  getBalance,
  floor,
  postOrder,
  getBase,
  getQuote,
  includeIt
} from './config/utils.js'
import log, {
  logStrategy
} from './log.js'
import Orders from './records/model.js'

export default class Trader {

  constructor(options) {
    this.datafeed = new api.websocket.Datafeed(true);
    // connect
    this.datafeed.connectSocket();

    this.equity = options.equity
    this.pair = options.pair
    this.order = options.order
    this.tf = options.tf
    this.tickerInfo = options.tickerInfo
    this.isNewPair = options.isNewPair
    this.dynamicTPSL = options.dynamicTPSL
    this.strategy = options.strategy
  }

  async execute() {
    this.order.side == 'buy' ?
      this.buy().then(order => {
        this.order.SL && this.afterBuy(order).then(data => data)
      }) : this.sell({
        type: this.order.type,
        price: this.order.currentPrice
      }).then(data => data)
  }

  async buy() {
    // find the lowest quote increment decimal value
    let decimals = this.tickerInfo.baseIncrement ? getDecimalPlaces(this.tickerInfo.baseIncrement) : 4
    // get the order size in the base currency (the one you want to buy)
    let size = this.order.type == 'limit' ?
      floor(this.order.size, decimals) :
      floor(this.order.size / (this.pair.bestAsk || this.order.currentPrice), decimals)
    // check if the order size is less-than/equal-to the minimum
    if (size <= this.tickerInfo.baseMinSize) return false

    let params = {
      baseParams: {
        clientOid: `Buy_${this.pair.symbol}_${Date.now()}`,
        side: 'buy',
        symbol: this.pair.symbol,
        type: this.order.type || 'market',
        stp: 'CN',
        remark: `Strategy: ${this.strategy}`,
        timeInForce: this.order.timeInForce || 'GTC',
        cancelAfter: this.order.cancelAfter
      },
      orderParams: {
        price: this.order.currentPrice,
        size
      }
    }

    this.activeOrder = await postOrder(params.baseParams, params.orderParams)
    if (this.activeOrder) {
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`${this.order.type === 'market' ? 'Bought' : 'Ordered to buy'} ${this.order.size} at $${(this.activeOrder.dealFunds / this.activeOrder.dealSize) || this.order.currentPrice}`]
      });
      return this.activeOrder
    } else {
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`Something went wrong while buying`]
      });
      return false
    }
  }

  async afterBuy(order) {
    if (order.id) {
      if (this.dynamicTPSL)
        this.startDynamicTPSL()
      else if (this.order.SL || this.order.TP) {
        let {
          TPOrder,
          SLOrder
        } = await this.stopOrder()

        Orders.create({
          strategy: this.strategy,
          data: this.activeOrder,
          status: 'ongoing',
          relatedOrders: {
            SL: SLOrder,
            TP: TPOrder
          }
        })
      }
    }
  }

  async sell(options) {
    // find the lowest quote increment decimal value
    let decimals = this.tickerInfo.baseIncrement ? getDecimalPlaces(this.tickerInfo.baseIncrement) : 4
    // get the order size in the base currency (the one you want to buy)
    let size = this.order.type == 'limit' ?
      floor(this.order.size, decimals) :
      floor(this.order.size / (this.pair.bestAsk || this.order.currentPrice), decimals)
    // check if the order size is less-than/equal-to the minimum
    if (size <= this.tickerInfo.baseMinSize) return false

    let order = await postOrder({
      clientOid: `Sell_${Date.now()}`,
      side: 'sell',
      symbol: this.pair.symbol,
      type: options.type || 'market',
      remark: `Strategy: ${this.strategy} (${this.activeOrder && this.activeOrder.id})`
    }, {
      size: this.order.size,
      price: options.price
    })
    if (order) {
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`Sold ${this.order.size} (${order.orderId})`]
      });
      return order
    } else {
      logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        data: [`Something went wrong while selling`]
      });
      return false
    }
  }

  async stopOrder() {
    this.setTP()
    let TPOrder = {}
    let SLOrder = {}
    let decimals = getDecimalPlaces(this.tickerInfo.baseIncrement) || 4
    let dealSize = floor(this.activeOrder.dealSize, decimals - 1)
    // stop loss
    if (this.order.SL) {
      SLOrder = await api.rest.Trade.StopOrder.postStopOrder({
        clientOid: `SL_${this.activeOrder.id}`,
        side: 'sell',
        symbol: this.pair.symbol,
        type: 'market',
        stop: 'loss',
        stopPrice: this.order.SL,
        stp: 'CO',
        remark: `Strategy: ${this.strategy}`
      }, {
        size: dealSize
      })
      if (SLOrder.data) {
        SLOrder = SLOrder.data
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`Stop Loss is ${this.order.SL} (${SLOrder.orderId})`]
        })
      } else
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`Something went wrong while setting a stop loss: ${SLOrder.msg}`]
        });
    }

    // take profit
    if (this.order.TP) {
      TPOrder = await api.rest.Trade.StopOrder.postStopOrder({
        clientOid: `TP_${this.activeOrder.id}`,
        side: 'sell',
        symbol: this.pair.symbol,
        type: 'market',
        stop: 'entry',
        stopPrice: this.order.TP,
        stp: 'CO',
        remark: `Strategy: ${this.strategy}`
      }, {
        size: dealSize
      })
      if (TPOrder.data) {
        TPOrder = TPOrder.data
        logStrategy({
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`Take Profit is ${this.order.TP} (${TPOrder.orderId})`]
        })
      } else logStrategy({
        strategy: this.strategy,
        pair: this.pair,
        orderId: this.activeOrder.id,
        data: [`Something went wrong while setting a take profit: ${TPOrder.msg}`]
      });
    }


    return {
      TPOrder: await getOrder(TPOrder.orderId),
      SLOrder: await getOrder(SLOrder.orderId)
    }
  }

  setTP() {
    let price = this.activeOrder.dealFunds / this.activeOrder.dealSize
    let SLP = calcPerc(this.order.SL, price)
    let TPP = Math.abs(SLP) * this.order.rr
    this.order.TP = price * (TPP / 100 + 1)
    return this.order.TP
  }

  startDynamicTPSL() {
    let lastPrice = this.activeOrder.price
    let boughtPrice = this.activeOrder.dealFunds / this.activeOrder.dealSize
    this.dynamicTPSL.TP = boughtPrice * (this.dynamicTPSL.TPP / 100 + 1)
    this.dynamicTPSL.SL = boughtPrice * (this.dynamicTPSL.SLP / 100 - 1)
    this.dynamicTPSL.height = this.dynamicTPSL.TP - this.dynamicTPSL.SL
    logStrategy({
      fileName: `${this.pair.symbol}_${this.activeOrder.id}`,
      strategy: this.strategy,
      pair: this.pair,
      orderId: this.activeOrder.id,
      data: [`Ceiling: $${this.dynamicTPSL.TP}`, `Bought for: $${boughtPrice}`, `Floor: $${this.dynamicTPSL.SL}`]
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
          fileName: `${this.pair.symbol}_${this.activeOrder.id}`,
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
          fileName: `${this.pair.symbol}_${this.activeOrder.id}`,
          strategy: this.strategy,
          pair: this.pair,
          orderId: this.activeOrder.id,
          data: [`New TP: ${this.dynamicTPSL.TP}\nNew SL: ${this.dynamicTPSL.SL}`]
        });
      } else if (newPrice <= this.dynamicTPSL.SL) {
        logStrategy({
          fileName: `${this.pair.symbol}_${this.activeOrder.id}`,
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

  async tribitrage() {
    if (!this.order.size) {
      if (this.order.side === 'buy') {
        let quote = getQuote(this.pair.symbol)
        let balance = await getBalance(quote)
        this.order.size = (balance / this.order.currentPrice) * 0.998
        log(`${quote} balance is ${balance}`)
        log(`${this.pair.symbol} current Price: ${this.order.currentPrice}`)
        log(`size: ${this.order.size}`)
      } else {
        let balance = await getBalance(getBase(this.pair.symbol))
        this.order.size = balance
      }
    }

    let order = this.order.side === 'buy' ? await this.buy() : await this.sell({
      price: this.order.currentPrice,
      size: this.order.size
    })
    // check if the order has gone through
    if (order) {
      // check if the order is filled
      let filled = await this.orderFilled(order)
      if (filled) {
        log(`${this.pair.symbol} step done.`)
        return filled
      }


    } else return false

  }

  async orderFilled(order) {
    order = await getOrder(order.id || order.orderId) || order
    if (order && ((!order.isActive && !order.cancelExist) || (order.status == 'done' && order.type == 'filled'))) {
      log(`${this.pair.symbol} filled`)
      return order
    } else if (order && order.type == 'cancelled') return false
    else this.orderFilled(order)
  }


  print = () => {
    logStrategy({
      strategy: this.strategy,
      pair: this.pair,
      data: [
        `Started with: $${this.equity}`,
        `Ended with: $${this.order.size * this.order.currentPrice}`
      ]
    })
  }


  updateConstructor(data) {
    this.pair = data.pair
    this.order = data.order
    this.tickerInfo = data.tickerInfo
    this.strategy = data.strategy
  }


}