import { $orderType, $tradeDirection } from 'lib/constants/trade'

export interface IDatafeedObject {
  privateBullet: boolean
  trustConnected: boolean
  client: any
  emitter: {}
  topicState: []
  topicListener: {}
  incrementSubscribeId: number
  ping: number
  _connecting: boolean
  _onClose: []
  _maxId: number
  _pingTs: any
  connectSocket: () => Promise<any>
  subscribe: (topic: string, callback: (payload) => void, isPrivate?: boolean) => void
  unsubscribe: Function
  onClose: Function
  _handleClose: Function
  _distribute: Function
  _handleAfterConnect: Function
  _connect: () => Promise<any>
  _getBulletToken: () => Promise<any>
  _sub: Function
  _unsub: Function
  _clearPing: Function
  _ping: Function
}

export interface IDFTickerPayload {
  type: string
  topic: string
  subject: string
  data: {
    bestAsk: string
    bestAskSize: string
    bestBid: string
    bestBidSize: string
    price: string
    sequence: string
    size: string
    time: number
  }
}
export interface IDFOrderBookPayload {
  type: 'message'
  topic: string
  subject: 'level2'
  data: {
    asks: [price: string, size: string]
    bids: [price: string, size: string]
    timestamp: number
  }
}

export interface IDFBalancePayload {
  type: string
  topic: string
  subject: string
  channelType: 'private'
  data: {
    total: string
    available: string
    availableChange: string
    currency: string
    hold: string
    holdChange: string
    relationEvent: string
    relationEventId: string
    relationContext: string
    symbol: string
    tradeId: string
    orderId: string
  }
  time: string
}

export interface IDFOrderPayload {
  type: string
  topic: string
  subject: string
  channelType: string
  data: {
    symbol: string
    orderType: $orderType
    side: $tradeDirection
    orderId: string
    type: 'filled' | 'received' | 'match'
    orderTime: number
    price: string
    clientOid: string
    status: 'open' | 'match' | 'done' | 'new'
    originSize: string // original quantity
    originFunds: string // The original funds of the market order
    ts: number
  }
}

export interface IDFAdvancedOrderPayload {
  type: string
  topic: string
  subject: string
  channelType: string
  data: {
    createdAt: number
    orderId: string
    orderPrice: string
    orderType: $orderType
    side: $tradeDirection
    size: string
    stop: 'entry' | 'loss'
    stopPrice: string
    symbol: string
    tradeType: string
    triggerSuccess: boolean
    ts: number
    type: 'TRIGGERED' | 'cancel' | 'open'
  }
}

export interface IDFKLines {
  type: string
  topic: string
  subject: string
  data: {
    symbol: string // symbol
    candles: [
      string, // Start time of the candle cycle
      string, // open price
      string, // close price
      string, // high price
      string, // low price
      string, // Transaction volume
      string, // Transaction amount
    ]
    time: number // now（us）
  }
}
