import SDK from 'kucoin-node-sdk'
import { asyncHandler } from 'lib/helpers/async'
import { IOrderResponse } from 'lib/types/sdk/trade'
import { ITraderParams, IOrder } from 'lib/types/Trader'

export class Trader {
  order: ITraderParams['order']
  TP: ITraderParams['TP'] | undefined
  SL: ITraderParams['SL'] | undefined

  constructor({ order, TP, SL }: ITraderParams) {
    this.order = order
    this.TP = TP
    this.SL = SL
  }

  async execute() {
    const [order, error] = await this.transact(this.order)
    if (error) return { error }
    if (this.SL) {
      const SLorder: IOrder = {
        baseParams: {
          ...this.order.baseParams,
          side: this.order.baseParams.side === 'buy' ? 'sell' : 'buy',
        },
        orderParams: {
          ...this.order.orderParams,
          price: this.SL,
        },
      }
      const [_, error] = await this.transact(SLorder)
      if (error) return { error }
    }
    if (this.TP) {
      const TPorder: IOrder = {
        baseParams: {
          ...this.order.baseParams,
          side: this.order.baseParams.side === 'buy' ? 'sell' : 'buy',
        },
        orderParams: {
          ...this.order.orderParams,
          price: this.TP,
        },
      }
      const [_, error] = await this.transact(TPorder)
      if (error) return { error }
    }
    return { order }
  }

  async transact(order: IOrder) {
    return await asyncHandler<IOrderResponse>(SDK.rest.Trade.Orders.postOrder(order.baseParams, order.orderParams))
  }
}