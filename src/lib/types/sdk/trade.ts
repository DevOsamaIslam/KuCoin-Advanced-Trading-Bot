import { ORDER_TYPE, SELF_TRADE_PREVENTION, TIME_IN_FORCE, TRADE_DIRECTION } from 'lib/constants/trade'
import { IBaseParams, IOrderParams } from '../Trader'

export interface ITrade {
  Orders: {
    postOrder: (baseParams: IBaseParams, orderParams: IOrderParams) => Promise<IOrderResponse>
    postMultiOrders: () => Promise<void>
    cancelOrder: () => Promise<void>
    cancelAllOrders: () => Promise<void>
    cancelOrderByClientOid: () => Promise<void>
    getOrdersList: () => Promise<void>
    getV1HistoricalOrdersList: () => Promise<void>
    getRecentOrders: () => Promise<void>
    getOrderByID: () => Promise<void>
    getSingleActiveOrderByClientOid: () => Promise<void>
  }
  StopOrder: {
    postStopOrder: () => Promise<void>
    cancelOrder: () => Promise<void>
    cancelMultiOrders: () => Promise<void>
    getOrder: () => Promise<void>
    getStopOrderList: () => Promise<void>
    getOrderByClientOid: () => Promise<void>
    cancelSingleOrderByClientOid: () => Promise<void>
  }
  Fills: {
    getFillsList: () => Promise<void>
    getRecentFills: () => Promise<void>
  }
}

export interface IOrderResponse {
  symbol: string
  type: keyof typeof ORDER_TYPE
  side: keyof typeof TRADE_DIRECTION
  price: string
  size: string
  funds: string | null
  stp: keyof typeof SELF_TRADE_PREVENTION
  stop: string
  stopPrice: string | null
  timeInForce: keyof typeof TIME_IN_FORCE
  cancelAfter: number | null
  postOnly: boolean
  hidden: boolean
  iceberg: boolean
  visibleSize: string | null
  channel: string
  id: string
  status: 'success' | 'fail'
  failMsg: string | null
  clientOid: string
}
