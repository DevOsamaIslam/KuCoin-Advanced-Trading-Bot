import Logger from 'app/Logger'
import SDK from 'kucoin-node-sdk'
import { ORDER_TYPE, TRADE_DIRECTION } from 'lib/constants/trade'
import { asyncHandler } from 'lib/helpers/async'
import { afterFees, getPriceIncrementPrecision, getSizeIncrementPrecision } from 'lib/helpers/calc'
import { getBase, getQuote } from 'lib/helpers/tickers'
import { IGetOrderResponse, IOrderResponse } from 'lib/types/sdk/trade'
import { IOrder, ITraderParams } from 'lib/types/Trader'

const logger = Logger.getInstance()

export class Trader {
  order: ITraderParams['order']
  timeframe: ITraderParams['timeframe']
  TP: ITraderParams['TP'] | undefined
  SL: ITraderParams['SL'] | undefined
  base: string
  quote: string
  closeCondition: ITraderParams['closeCondition']
  currentOrder: IGetOrderResponse | undefined

  constructor({ order, TP, SL, closeCondition, timeframe: timeFrame }: ITraderParams) {
    this.order = order
    this.timeframe = timeFrame
    this.TP = TP
    this.SL = SL
    this.base = getBase(this.order.baseParams.symbol)
    this.quote = getQuote(this.order.baseParams.symbol)
    this.closeCondition = closeCondition
  }

  async execute() {
    const [order, error] = await this.transact(this.order)
    if (error) {
      return { error }
    }
    if (this.SL) {
      logger.info(`Creating SL order at`, this.SL)
      const SLorder: IOrder = {
        baseParams: {
          ...this.order.baseParams,
          clientOid: 'SL_' + this.order.baseParams.clientOid,
          type: ORDER_TYPE.market,
          stop: 'loss',
          stopPrice: getPriceIncrementPrecision(this.base, this.SL),
          side: TRADE_DIRECTION.sell,
        },
        orderParams: {
          size: getSizeIncrementPrecision(this.base, afterFees(this.order.orderParams.size!)),
          price: getPriceIncrementPrecision(this.base, this.SL),
        },
      }
      const [, error] = await this.transact(SLorder)
      if (error) return { error, SLorder }
    }
    if (this.TP) {
      logger.info(`Creating TP order at`, this.TP)
      const TPorder: IOrder = {
        baseParams: {
          ...this.order.baseParams,
          stop: 'entry',
          clientOid: 'TP_' + this.order.baseParams.clientOid,
          side: TRADE_DIRECTION.sell,
          stopPrice: getPriceIncrementPrecision(this.base, this.TP),
        },
        orderParams: {
          size: getSizeIncrementPrecision(this.base, afterFees(this.order.orderParams.size!)),
          price: getPriceIncrementPrecision(this.base, this.TP),
        },
      }
      const [, error] = await this.transact(TPorder)
      if (error) return { error, TPorder }
    }
    if (this.closeCondition) {
      this.monitor()
    }

    SDK.rest.Trade.Orders.getOrderByID(order.id).then(res => (this.currentOrder = res.data))

    return { order }
  }

  async transact(order: IOrder) {
    return await asyncHandler<IOrderResponse>(SDK.rest.Trade.Orders.postOrder(order.baseParams, order.orderParams))
  }

  async monitor() {
    setInterval(async () => {
      const shouldClose = this.closeCondition?.()
      if (shouldClose)
        this.transact({
          baseParams: {
            ...this.order.baseParams,
            clientOid: 'TSL_' + this.order.baseParams.clientOid,
            type: ORDER_TYPE.market,
            side: TRADE_DIRECTION.sell,
          },
          orderParams: {
            size: getSizeIncrementPrecision(this.base, afterFees(this.order.orderParams.size!)),
          },
        })
    }, this.timeframe.value)
  }
}
