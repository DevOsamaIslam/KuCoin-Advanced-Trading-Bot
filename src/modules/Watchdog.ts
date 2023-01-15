import { ACCOUNTS } from 'lib/constants/account'
import { getHistory } from 'lib/helpers/candles'
import { getQuote, PAIRS } from 'lib/helpers/tickers'
import { ITicker } from 'lib/types/tickers'
import { IWatchdogParams } from 'lib/types/watchdog'
import { Trader } from './Trader'

export class Watchdog {
  strategy: IWatchdogParams['strategy']
  timeframe: IWatchdogParams['timeframe']
  pairs: IWatchdogParams['pairs']
  constructor({ strategy, timeframe, pairs }: IWatchdogParams) {
    this.strategy = strategy
    this.timeframe = timeframe
    this.pairs = pairs

    // loop through all pairs and create an outpost for each
    for (let i = 0; i < pairs.length; i++) {
      const currentPair = PAIRS[pairs[i]]
      if (!currentPair) continue
      setTimeout(() => {
        this.outpost(currentPair)
      }, 1000)
    }
  }

  outpost(pair: ITicker) {
    setInterval(async () => {
      // get the most up to date info for that ticker
      const history = await getHistory({ symbol: pair.symbol, timeframe: this.timeframe, lookbackPeriods: 200 })
      const equity = ACCOUNTS[getQuote(pair.symbol)]?.available
      if (!history || !equity) return
      const currentPrice = history[0].close
      // check if the passed strategy gives a signal
      const order = this.strategy.fn({ currentPrice, history })
      if (!order) return
      const result = await new Trader({
        order: {
          baseParams: {
            clientOid: `${pair.symbol}_${Date.now().toString()}`,
            side: order.side,
            symbol: pair.symbol,
            type: 'limit',
          },
          orderParams: {
            price: currentPrice.toString(),
            size: equity,
          },
        },
        SL: order.SL,
        TP: order.TP,
        strategy: this.strategy.name,
      }).execute()
      console.log({ result })
    }, this.timeframe.value)
  }
}
