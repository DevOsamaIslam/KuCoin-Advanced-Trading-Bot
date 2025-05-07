import { ORDER_TYPE, SELF_TRADE_PREVENTION, TIME_IN_FORCE, TRADE_DIRECTION } from 'lib/constants/trade'
import { IBaseParams, IOrderParams } from '../Trader'

interface IBaseResponse<T = any> {
  code: string
  data: any
}

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
    getOrderByID: (orderId: string) => Promise<IBaseResponse<IGetOrderResponse>>
    getSingleActiveOrderByClientOid: () => Promise<void>
  }
  StopOrder: {
    postStopOrder: () => Promise<void>
    cancelOrder: (symbol: string, orderId: string) => Promise<{ orderId: string }>
    cancelMultiOrders: (orderIds: string[]) => Promise<void>
    getOrder: () => Promise<void>
    getStopOrderList: () => Promise<IListStopOrders>
    getOrderByClientOid: () => Promise<void>
    cancelSingleOrderByClientOid: (clientOid: string, symbol: string) => Promise<void>
  }
  Fills: {
    getFillsList: () => Promise<void>
    getRecentFills: () => Promise<void>
  }
}

export interface IGetOrderResponse {
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
export interface IOrderResponse {
  id: string
}

export interface IListStopOrders {
  currentPage: number
  pageSize: number
  totalNum: number
  totalPage: number
  items: Item[]
}

export interface Item {
  id: string
  symbol: string
  userId: string
  status: string
  type: string
  side: string
  price: null
  size: string
  funds: null
  stp: null
  timeInForce: string
  cancelAfter: number
  postOnly: boolean
  hidden: boolean
  iceberg: boolean
  visibleSize: null
  channel: string
  clientOid: string
  remark: null
  tags: null
  relatedNo: null
  orderTime: number
  domainId: string
  tradeSource: string
  tradeType: string
  feeCurrency: string
  takerFeeRate: string
  makerFeeRate: string
  createdAt: number
  stop: string
  stopTriggerTime: null
  stopPrice: string
  limitPrice: null
  pop: null
  activateCondition: null
}
