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
  text: '1min',
  value: 60 * 1000,
}

const strategy = {
  name: macdStrategy.name,
  fn: macdStrategy,
}

setTimeout(() => {
  new Watchdog({
    strategy,
    pairs: ['BTC-USDT'],
    timeframe,
  })
}, 2000)

// const symbol = 'BTC-USDT'
// getHistory({
//   symbol,
//   timeframe,
//   lookbackPeriods: 1500,
// }).then(data => {
//   if (!data) return
//   const testResults = new Backtester({
//     strategy,
//     history: {
//       timeframe,
//       candles: data,
//     },
//   }).run()
//   writeFile(
//     `${process.cwd()}/src/modules/backtest/results/${macdStrategy.name}_${symbol}_${timeframe.text}.json`,
//     JSON.stringify(testResults),
//     error => {
//       if (error) console.error({ error })
//       console.log({ testResults })
//     },
//   )
// })
