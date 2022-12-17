import SDK from 'kucoin-node-sdk'
import { ITicker, ITickerPayload } from 'lib/types/tickers'
import { asyncHandler } from './async'

export let PAIRS: { [quote: string]: ITicker[] } = {}

export const refreshPairs = async () => {
  PAIRS = {}
  let [allTickers] = await asyncHandler<ITickerPayload>(SDK.rest.Market.Symbols.getAllTickers())
  if (allTickers) {
    PAIRS = {}
    allTickers.ticker.forEach(tick => {
      const [baseSymbol, quoteSymbol] = tick.symbol.split('-')
      if (baseSymbol.includes('3L') || baseSymbol.includes('3S')) return
      PAIRS[quoteSymbol] ? PAIRS[quoteSymbol].push(tick) : (PAIRS[quoteSymbol] = [tick])
    })
  } else return false
}

export const getBase = (symbol: string) => symbol.split('-')[0]

export const getQuote = (symbol: string) => symbol.split('-')[1]
