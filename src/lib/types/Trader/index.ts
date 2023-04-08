import { ORDER_TYPE, SELF_TRADE_PREVENTION, TIME_IN_FORCE, TRADE_DIRECTION, TRADE_TYPE } from 'lib/constants/trade'

export interface ITraderParams {
  order: IOrder
  TP?: string
  SL?: string
  strategy?: string
}

export interface IOrder {
  baseParams: IBaseParams
  orderParams: IOrderParams
}
type $trade_direction = keyof typeof TRADE_DIRECTION
type $orderType = keyof typeof ORDER_TYPE
type $selfTradePrevention = keyof typeof SELF_TRADE_PREVENTION
type $tradeType = keyof typeof TRADE_TYPE

export interface IBaseParams {
  clientOid: string
  side: typeof TRADE_DIRECTION[$trade_direction]
  symbol: string
  type: typeof ORDER_TYPE[$orderType]
  remark?: string
  stp?: typeof SELF_TRADE_PREVENTION[$selfTradePrevention]
  stop?: 'loss' | 'entry'
  stopPrice?: string
  tradeType?: typeof TRADE_TYPE[$tradeType]
}

type $timeInForce = keyof typeof TIME_IN_FORCE
export interface IOrderParams {
  price: string
  size?: string
  funds?: string //  - The desired amount of quote currency to use
  timeInForce?: typeof TIME_IN_FORCE[$timeInForce]
  cancelAfter?: number
  postOnly?: boolean
  hidden?: boolean
  iceberg?: boolean
  visibleSize?: string
}
