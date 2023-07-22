import { initialize } from 'app/init'
import { TRUSTED_CURRENCIES } from 'lib/constants/currencies'

import { refreshBalances } from 'lib/helpers/balance'
import { refreshPairs, refreshTickersInfo } from 'lib/helpers/tickers'
import { liveAdvancedOrders, liveOrders } from 'modules/datafeed'
import { macdStrategy } from 'modules/strategies/macd'
import { Watchdog } from 'modules/Watchdog'

initialize()
refreshBalances()
refreshPairs()
refreshTickersInfo()
liveOrders()
liveAdvancedOrders()
const timeframe = {
  text: '15min',
  value: 15 * 60 * 1000,
}

const strategy = {
  name: macdStrategy.name,
  fn: macdStrategy,
}

setTimeout(() => {
  new Watchdog({
    strategy,
    pairs: [TRUSTED_CURRENCIES.ETHUSDT],
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
