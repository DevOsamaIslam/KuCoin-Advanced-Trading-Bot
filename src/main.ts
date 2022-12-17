import { initialize } from 'app/init'

import { refreshBalances } from 'lib/helpers/balance'
import { getHistory } from 'lib/helpers/candles'
import { refreshPairs } from 'lib/helpers/tickers'
import { ITimeframe } from 'lib/types/app'
import { Backtester } from 'modules/Backtester'
import { vwapStrategy } from 'modules/strategies/vwap'

initialize()
refreshBalances()
refreshPairs()

const timeframe: ITimeframe = {
  text: '15min',
  value: 15 * 60 * 1000,
}

getHistory('BTC-USDT', timeframe, 1400).then(async candles => {
  console.log({ data: candles?.length })
  if (candles) {
    const results = new Backtester({
      history: {
        timeframe,
        candles,
      },
      strategy: {
        name: vwapStrategy.name,
        fn: vwapStrategy,
      },
    }).run()
    console.log({ results, count: results.length })
  }
})

// dynamicArb()

// new Trader({
//   equity: 5,
//   pair: ['BTC', 'USDT'],
//   id: 'aaassa',
//   order: {
//     baseParams: {
//       clientOid: Date.now().toString(),
//       side: TRADE_DIRECTION.buy,
//       stp: SELF_TRADE_PREVENTION.cancelNewest,
//       symbol: 'BTC-USDT',
//       tradeType: TRADE_TYPE.spot,
//       type: ORDER_TYPE.market,
//       remark: 'test limit order',
//     },
//     orderParams: {
//       price: '16500',
//       size: '0.0001',
//       timeInForce: TIME_IN_FORCE.goodTillCancelled,
//     },
//   },
// })
//   .transact()
//   .then(data => console.log(data))
