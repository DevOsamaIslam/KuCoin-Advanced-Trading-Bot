import SDK from 'kucoin-node-sdk'
import { asyncHandler } from 'lib/helpers/async'
import { IOrderResponse } from 'lib/types/sdk/trade'
import { ITraderParams, IOrder } from 'lib/types/Trader'

export class Trader {
  equity: ITraderParams['equity']
  pair: ITraderParams['pair']
  order: ITraderParams['order']
  tickerInfo: ITraderParams['tickerInfo']
  strategy: ITraderParams['strategy']
  id: ITraderParams['id'] | undefined
  TP: ITraderParams['TP'] | undefined
  SL: ITraderParams['SL'] | undefined

  constructor({ equity, pair, order, tickerInfo, strategy, id, TP, SL }: ITraderParams) {
    this.equity = equity
    this.pair = pair
    this.order = order
    this.tickerInfo = tickerInfo
    this.strategy = strategy
    this.id = id
    this.TP = TP
    this.SL = SL
  }

  async execute() {
    const [order, error] = await asyncHandler<IOrderResponse>(this.transact(this.order))
    if (order) {
      this.SL && (await asyncHandler(this.transact(this.SL)))
      this.TP && (await asyncHandler(this.transact(this.TP)))
    }
    if (error) {
      console.error(error)
    }
  }

  async transact(order: IOrder) {
    return await asyncHandler<IOrderResponse>(SDK.rest.Trade.Orders.postOrder(order.baseParams, order.orderParams))
  }
}
