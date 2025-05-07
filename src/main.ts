import { initialize } from 'app/init'

import { refreshBalances } from 'lib/helpers/balance'
import { refreshPairs, refreshTickersInfo } from 'lib/helpers/tickers'
import { liveAdvancedOrders, liveOrders } from 'modules/datafeed'
import { riderTheWaveStrategy } from 'modules/strategies/rider-the-wave'
import { Watchdog } from 'modules/Watchdog'

initialize()
refreshBalances()
refreshPairs()
refreshTickersInfo()
liveOrders()
liveAdvancedOrders()
// setTimeout(() => {
//   dynamicArb()
// }, 4000)
// const timeframe = {
//   text: '30min',
//   value: 30 * 60 * 1000,
// }

const strategy = {
  name: riderTheWaveStrategy.name,
  fn: riderTheWaveStrategy,
}

setTimeout(() => {
  new Watchdog({
    strategy,
    pairs: ['BTC-USDT'],
    timeframe: {
      text: '5m',
      value: 5 * 60 * 1000,
    },
  })
}, 2000)

// const strategy = {
//   name: macdStrategy.name,
//   fn: macdStrategy,
// }

// setTimeout(() => {
//   new Watchdog({
//     strategy,
//     pairs: [TRUSTED_CURRENCIES.ETHUSDT],
//     timeframe,
//   })
// }, 2000)

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
