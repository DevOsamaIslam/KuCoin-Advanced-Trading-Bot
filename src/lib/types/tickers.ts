export interface ITickerPayload {
  time: number
  ticker: ITicker[]
}
export interface ITicker {
  time: number // time
  symbol: string // symbol
  symbolName: string // Name of trading pairs, it would change after renaming
  buy: string // bestAsk
  sell: string // bestBid
  changeRate: string // 24h change rate
  changePrice: string // 24h change price
  high: string // 24h highest price
  low: string // 24h lowest price
  vol: string // 24h volume，the aggregated trading volume in BTC
  volValue: string // 24h total, the trading volume in quote currency of last 24 hours
  last: string // last price
  averagePrice: string // 24h average transaction price yesterday
  takerFeeRate: string // Basic Taker Fee
  makerFeeRate: string // Basic Maker Fee
  takerCoefficient: string // Taker Fee Coefficient
  makerCoefficient: string // Maker Fee Coefficient
}

export interface ICurrency {
  symbol: string
  name: string
  baseCurrency: string
  quoteCurrency: string
  feeCurrency: string
  market: string
  baseMinSize: string
  quoteMinSize: string
  baseMaxSize: string
  quoteMaxSize: string
  baseIncrement: string
  quoteIncrement: string
  priceIncrement: string
  priceLimitRate: string
  minFunds: string
  isMarginEnabled: boolean
  enableTrading: boolean
}
