import { IBacktesterParams } from 'lib/types/Backtester'
import { ICandle, IHistory } from 'lib/types/data'

export class Backtester {
  strategy: IBacktesterParams['strategy']
  history: IBacktesterParams['history']
  passedCandles: IHistory['candles']
  buySignals: ICandle[]

  constructor({ strategy, history }: IBacktesterParams) {
    this.strategy = strategy
    this.history = history
    this.passedCandles = [] as IHistory['candles']
    this.buySignals = [] as IHistory['candles']
  }

  run() {
    if (this.history.candles.length) {
      const currentCandle = this.history.candles.shift()!
      this.passedCandles.push(currentCandle)

      const results = this.strategy.fn({
        currentPrice: currentCandle.close,
        history: this.passedCandles,
      })
      if (results) this.buySignals.push(currentCandle)
      this.run()
    }
    return this.buySignals
  }
}
