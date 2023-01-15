import { IBacktesterParams } from 'lib/types/Backtester'
import { ICandle, IHistory } from 'lib/types/data'

export class Backtester {
  strategy: IBacktesterParams['strategy']
  history: IBacktesterParams['history']
  pastCandles: IHistory['candles']
  buySignals: ICandle[]
  winningTrades: number = 0
  losingTrades: number = 0
  totalTrades: number = 0

  constructor({ strategy, history }: IBacktesterParams) {
    this.strategy = strategy
    this.history = history
    this.pastCandles = [] as IHistory['candles']
    this.buySignals = [] as IHistory['candles']
  }

  /**
   * Runs the backtesting simulation and returns the results
   * @returns {Object} An object containing the results of the backtest, including the buy signals, winning trades, losing trades, total trades, success ratio, average trade duration, and average idle time.
   */
  run(): object {
    // variable to keep track of total trade duration
    let totalTradeDuration = 0
    // variable to keep track of total idle time
    let totalIdle = 0

    // loop through each candle in the history
    for (let i = 0; i < this.history.candles.length; i++) {
      // get the current candle and check if it's defined
      const currentCandle = this.history.candles.pop()
      if (!currentCandle) continue

      // add the current candle to the pastCandles array
      this.pastCandles.push(currentCandle)

      // get the results of the strategy function
      const results = this.strategy.fn({
        currentPrice: currentCandle.close,
        history: this.pastCandles,
      })

      // check if the strategy function returned a results object
      if (results) {
        // check if the results object has TP and SL properties
        if (!results.TP || !results.SL) continue

        // add the current candle to the buySignals array
        this.buySignals.push(currentCandle)

        // loop through the remaining candles
        for (let i = 0; i < this.history.candles.length; i++) {
          // get the current candle and check if it's defined
          const nextCandle = this.history.candles.pop()
          if (!nextCandle) break

          // add the next candle to the pastCandles array
          this.pastCandles.push(nextCandle)

          // increment the total trade duration
          totalTradeDuration++

          // check if the next candle's high is greater than or equal to the TP value
          if (nextCandle.high >= Number(results.TP)) {
            // increment the winning trades
            this.winningTrades++
            // break the loop
            break
          }

          // check if the next candle's low is less than or equal to the SL value
          if (nextCandle.low <= Number(results.SL)) {
            // increment the losing trades
            this.losingTrades++
            // break the loop
            break
          }
        }

        // increment the total trades
        this.totalTrades++
      } else {
        // increment the total idle time
        totalIdle++
      }
    }

    // return the results object
    return {
      buySignals: this.buySignals,
      winningTrades: this.winningTrades,
      losingTrades: this.losingTrades,
      totalTrades: this.totalTrades,
      successRatio: (this.winningTrades / this.totalTrades) * 100,
      averageTradeDuration: totalTradeDuration / this.totalTrades,
      averageIdle: totalIdle / this.totalTrades,
    }
  }
}
