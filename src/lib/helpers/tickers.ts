import SDK from 'kucoin-node-sdk'
import { CURRENCIES } from 'lib/constants/currencies'
import { ICurrency, ITicker, ITickerPayload } from 'lib/types/tickers'
import { asyncHandler } from './async'

export let PAIRS: { [ticker: string]: ITicker } = {}
export let SEGMENTED_PAIRS: { [quote: string]: ITicker[] } = {}

export const refreshPairs = async () => {
  let [allTickers] = await asyncHandler<ITickerPayload>(SDK.rest.Market.Symbols.getAllTickers())
  if (allTickers) {
    PAIRS = {}
    allTickers.ticker.forEach(tick => {
      const pair = tick.symbol
      const [baseSymbol, quoteSymbol] = pair.split('-')
      if (baseSymbol.includes('3L') || baseSymbol.includes('3S')) return
      PAIRS[pair] = tick
      SEGMENTED_PAIRS[quoteSymbol] ? SEGMENTED_PAIRS[quoteSymbol].push(tick) : (SEGMENTED_PAIRS[quoteSymbol] = [tick])
    })
  }
}

export const refreshTickersInfo = async () => {
  let [symbols] = await asyncHandler<ICurrency[]>(SDK.rest.Market.Symbols.getSymbolsList())
  if (symbols) {
    symbols.forEach(symbol => (CURRENCIES[symbol.baseCurrency] = symbol))
  }
}

export const getBase = (symbol: string) => symbol.split('-')[0]

export const getQuote = (symbol: string) => symbol.split('-')[1]
