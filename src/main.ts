import { initialize } from 'app/init'

import { refreshBalances } from 'lib/helpers/balance'
import { liveEquity } from 'lib/helpers/datafeed'
import { refreshPairs, refreshTickersInfo } from 'lib/helpers/tickers'
import { macdStrategy } from 'modules/strategies/macd/strategy'
import { Watchdog } from 'modules/Watchdog'

console.log = (...values: any) => setImmediate(() => console.info(values))
initialize()
refreshBalances()
refreshPairs()
refreshTickersInfo()
liveEquity()
// dynamicArb()
const timeframe = {
  text: '15min',
  value: 15 * 60 * 1000,
}

setTimeout(() => {
  new Watchdog({
    strategy: {
      name: macdStrategy.name,
      fn: macdStrategy,
    },
    pairs: ['BTC-USDT'],
    timeframe,
  })
}, 2000)
