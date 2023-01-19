import { ACCOUNTS } from 'lib/constants/account'
import { CURRENCIES } from 'lib/constants/currencies'
import { getHistory } from 'lib/helpers/candles'
import { getBase, getQuote, PAIRS } from 'lib/helpers/tickers'
import { ITicker } from 'lib/types/tickers'
import { IWatchdogParams } from 'lib/types/watchdog'
import { Trader } from './Trader'
import { afterFees, roundDown } from 'lib/helpers/calc'

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
      }, 1000 * i)
    }
  }

  /**
   * Runs the trading strategy on the given pair
   * @param {ITicker} pair - The pair to run the strategy on
   */
  outpost(pair: ITicker) {
    // set an interval to run the trading strategy on the given pair
    setInterval(async () => {
      // get the most up to date info for that ticker
      const history = await getHistory({ symbol: pair.symbol, timeframe: this.timeframe, lookbackPeriods: 200 })
      // get the available equity for the ticker
      const equity = ACCOUNTS[getQuote(pair.symbol)]?.available
      // check if the history or equity is undefined
      if (!history || !equity) return

      // get the current price of the ticker
      const currentPrice = history[0].close

      // check if the passed strategy gives a signal
      const order = this.strategy.fn({ currentPrice, history })
      // if the strategy doesn't give a signal, return
      if (!order) return
      // get the precision of the currency
      const currency = CURRENCIES[getBase(pair.symbol)]
      const precision = currency?.baseIncrement.split('.')[1].length
      if (!precision) return
      // calculate the order size by dividing the available equity by the current price
      const orderSize = roundDown(afterFees(Number(equity) / currentPrice), precision)
      const id = `${pair.symbol}_${Date.now().toString()}`
      // execute the trade using the trader class
      const result = await new Trader({
        // object containing the base parameters of the order
        order: {
          baseParams: {
            // clientOid is a unique identifier for the order
            clientOid: id,
            // the side of the order (buy or sell)
            side: order?.side || 'buy',
            // the symbol of the ticker
            symbol: pair.symbol,
            // the type of the order (limit or market)
            type: 'limit',
          },
          // object containing the order parameters
          orderParams: {
            // the price at which the order should be executed
            price: currentPrice.toString(),
            // the size of the order
            size: orderSize.toString(),
          },
        },
        // the stop loss level for the order
        SL: order.SL,
        // the take profit level for the order
        TP: order.TP,
        // the name of the strategy used
        strategy: this.strategy.name,
      }).execute()
      console.log({ result, order })
    }, this.timeframe.value)
  }
}
