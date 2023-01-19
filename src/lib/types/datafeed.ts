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
  data: IBalanceData
  time: string
}

export interface IBalanceData {
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
