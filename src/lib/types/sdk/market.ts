import { IDFTickerPayload } from '../datafeed'
import { ICurrency } from '../tickers'
import { ISpan } from './sdk'

export interface IMarket {
  Symbols: {
    getSymbolsList: () => Promise<ICurrency[]>
    getTicker: () => Promise<any>
    getAllTickers: () => IDFTickerPayload
    get24hrStats: () => Promise<any>
    getMarketList: () => Promise<any>
  }
  OrderBook: {
    getLevel2_20: () => Promise<any>
    getLevel2_100: () => Promise<any>
    getLevel2_full: () => Promise<any>
    getLevel3_full: () => Promise<any>
  }
  Histories: {
    getMarketHistories: () => Promise<any>
    getMarketCandles: (symbol: string, timeframeText: string, span: ISpan) => Promise<any>
  }
  Currencies: {
    getCurrencies: () => Promise<any>
    getCurrencyDetail: () => Promise<any>
    getFiatPrice: () => Promise<any>
  }
}
