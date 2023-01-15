import { initialize } from 'app/init'
import { writeFile } from 'fs'

import { refreshBalances } from 'lib/helpers/balance'
import { getHistory } from 'lib/helpers/candles'
import { refreshPairs, refreshTickersInfo } from 'lib/helpers/tickers'
import { Backtester } from 'modules/backtest'
import { macdStrategy } from 'modules/strategies/macd/strategy'

console.log = (...values: any) => setImmediate(() => console.info(values))
initialize()
refreshBalances()
refreshPairs()
refreshTickersInfo()
// liveEquity()
// dynamicArb()
const timeframe = {
  text: '15min',
  value: 15 * 60 * 1000,
}

// setTimeout(() => {
//   new Watchdog({
//     strategy: {
//       name: macdStrategy.name,
//       fn: macdStrategy,
//     },
//     pairs: ['BTC-USDT', 'ETH-USDT', 'ADA-USDT', 'SOL-USDT', 'DOT-USDT'],
//     timeframe,
//   })
// }, 2000)
const symbol = 'BTC-USDT'
getHistory({
  symbol,
  timeframe,
  lookbackPeriods: 1500,
}).then(data => {
  if (!data) return
  const testResults = new Backtester({
    strategy: {
      name: macdStrategy.name,
      fn: macdStrategy,
    },
    history: {
      timeframe,
      candles: data,
    },
  }).run()
  writeFile(
    `${process.cwd()}/src/modules/backtest/results/${macdStrategy.name}_${symbol}_${timeframe.text}.json`,
    JSON.stringify(testResults),
    error => {
      if (error) console.error({ error })
      console.log({ testResults })
    },
  )
})
