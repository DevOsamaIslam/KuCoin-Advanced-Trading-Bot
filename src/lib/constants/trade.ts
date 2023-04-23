export const TRADE_DIRECTION = {
  buy: 'buy',
  sell: 'sell',
} as const

export type $tradeDirection = 'buy' | 'sell'

export const ORDER_TYPE = {
  market: 'market',
  limit: 'limit',
} as const

export type $orderType = 'market' | 'limit'

export const SELF_TRADE_PREVENTION = {
  cancelOldest: 'CO',
  cancelNewest: 'CN',
  cancelBoth: 'CB',
  decreaseAndCancel: 'DC',
} as const

export const TIME_IN_FORCE = {
  immediateOrCancel: 'IOC',
  fillOrKill: 'FOK',
  goodTillCancelled: 'GTC',
  goodTillTime: 'GTT',
} as const

export const TRADE_TYPE = {
  spot: 'TRADE',
  margin: 'MARGIN_TRADE',
} as const
