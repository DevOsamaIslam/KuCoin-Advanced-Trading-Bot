import SDK from 'kucoin-node-sdk'
import { CURRENCIES } from 'lib/constants/currencies'
import { asyncHandler } from 'lib/helpers/async'
import { afterFees, getPriceIncrementPrecision } from 'lib/helpers/calc'
import { getBase } from 'lib/helpers/tickers'
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
          clientOid: 'SL_' + this.order.baseParams.clientOid,
          type: 'market',
          stop: 'loss',
          stopPrice: this.SL,
          side: this.order.baseParams.side === 'buy' ? 'sell' : 'buy',
        },
        orderParams: {
          size: afterFees(parseFloat(this.order.orderParams.size + '0')) + '',
          price: getPriceIncrementPrecision(this.SL, CURRENCIES[getBase(this.order.baseParams.symbol)]) as string,
        },
      }
      const [_, error] = await this.transact(SLorder)
      if (error) return { error }
    }
    if (this.TP) {
      const TPorder: IOrder = {
        baseParams: {
          ...this.order.baseParams,
          stop: 'entry',
          clientOid: 'TP_' + this.order.baseParams.clientOid,
          side: this.order.baseParams.side === 'buy' ? 'sell' : 'buy',
        },
        orderParams: {
          size: afterFees(parseFloat(this.order.orderParams.size + '0')) + '',
          price: getPriceIncrementPrecision(this.TP, CURRENCIES[getBase(this.order.baseParams.symbol)]) as string,
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
