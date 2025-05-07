import { getDatafeed } from 'app/init'
import { LIVE_ORDERS } from 'app/orders'
import { ACCOUNTS } from 'lib/constants/account'
import { CURRENCIES } from 'lib/constants/currencies'
import { ORDER_TYPE, TRADE_DIRECTION } from 'lib/constants/trade'
import { afterFees, getSizeIncrementPrecision, roundDown } from 'lib/helpers/calc'
import { getHistory } from 'lib/helpers/candles'
import { candleArray2object } from 'lib/helpers/conversion'
import { PAIRS, getBase, getQuote } from 'lib/helpers/tickers'
import { IOrder } from 'lib/types/Trader'
import { ICandle } from 'lib/types/data'
import { IDFKLines } from 'lib/types/datafeed'
import { TStrategyResponse } from 'lib/types/strategy'
import { ITicker } from 'lib/types/tickers'
import { IWatchdogParams } from 'lib/types/watchdog'
import { Trader } from './Trader'
import Logger from 'app/Logger'

const logger = Logger.getInstance()
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
  outpost = async (pair: ITicker) => {
    // get the most up to date info for that ticker
    const history = await getHistory({ symbol: pair.symbol, timeframe: this.timeframe, lookbackPeriods: 200 })
    if (!history) {
      logger.error('failed to get history, retrying...')
      return setTimeout(() => this.outpost(pair), 1000)
    }

    // Initialize a variable to store the last candle data received from the data feed.
    // Initialize it with the current candle data
    let lastCandleData: ICandle | undefined = history.at(-1)
    logger.info(`Watching for ${pair.symbol} on ${this.timeframe.text} timeframe`)
    // Subscribe to the data feed for the specified trading pair and timeframe.
    getDatafeed().subscribe(`/market/candles:${pair.symbol}_1min`, async (payload: IDFKLines) => {
      // Extract the candlestick data from the payload.
      const {
        data: { candles },
      } = payload

      // Extract the start time of the candle.
      const [startTime] = candles

      // Parse the candlestick data into an ICandle object.
      const candleData = candleArray2object(candles)

      // Check if this is a new candlestick.
      if (!LIVE_ORDERS[pair.symbol] && lastCandleData && +startTime !== lastCandleData.timestamp) {
        // Add the last candle data to the historical data array.
        history.push(lastCandleData)
        console.log(`lastCandleData: ${new Date()} ${JSON.stringify(lastCandleData)}`)
        // Reset the lastCandleData variable.
        lastCandleData = undefined

        // Get the available equity for the quote currency of the trading pair.
        const equity = ACCOUNTS[getQuote(pair.symbol)]?.available

        // Check if the historical data or equity value is undefined. If so, return without processing.
        if (!history?.length || !equity) return

        // Get the current price of the trading pair.
        const currentPrice = candleData.close

        // Invoke the provided strategy function to generate a trading signal.
        const order = this.strategy.fn({ symbol: pair.symbol, timeframe: this.timeframe, currentPrice, history })

        // If the strategy does not generate a trading signal, return without processing.
        if (order) {
          this.prepareOrder({ order, currentPrice, equity, pair })
          logger.verbose({ candleData, currentPrice })
        }
      }

      // Update the lastCandleData variable with the current candle data.
      lastCandleData = candleData
    })
  }

  prepareOrder = async ({
    order,
    pair,
    equity,
    currentPrice,
  }: {
    order: TStrategyResponse
    pair: ITicker
    equity: string
    currentPrice: number
  }) => {
    // get the precision of the currency
    const currency = CURRENCIES[getBase(pair.symbol)]
    const precision = currency?.baseIncrement.split('.')[1].length
    if (!precision) {
      logger.error('Precision not found', { precision })
      return
    }
    // calculate the order size by dividing the available equity by the current price
    const orderSize = roundDown(afterFees(Number(equity) / currentPrice), precision)
    const id = `${pair.symbol}_${Date.now().toString()}`
    const tradeOrder: IOrder = {
      baseParams: {
        // clientOid is a unique identifier for the order
        clientOid: id,
        // the side of the order (buy or sell)
        side: order?.side || TRADE_DIRECTION.buy,
        // the symbol of the ticker
        symbol: pair.symbol,
        // the type of the order (limit or market)
        type: ORDER_TYPE.market,
      },
      // object containing the order parameters
      orderParams: {
        // the price at which the order should be executed
        price: currentPrice.toString(),
        // the size of the order
        size: getSizeIncrementPrecision(getBase(pair.symbol), orderSize),
      },
    }
    // execute the trade using the trader class
    const result = await new Trader({
      // object containing the base parameters of the order
      order: tradeOrder,
      // the time frame of the order
      timeframe: this.timeframe,
      // the stop loss level for the order
      SL: order.SL,
      // the take profit level for the order
      TP: order.TP,
      // the close condition for the order
      closeCondition: order.closeCondition,
      // the name of the strategy used
      strategy: this.strategy.name,
    }).execute()
    logger.info(result)
  }
}
