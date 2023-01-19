export class StochasticRSI {
  private rsi: number[]
  private period: number
  private overbought: number
  private oversold: number

  constructor(rsi: number[], period: number, overbought: number, oversold: number) {
    this.rsi = rsi
    this.period = period
    this.overbought = overbought
    this.oversold = oversold
  }

  public getStochasticRSI(): number[] {
    const stochasticRSI: number[] = []

    for (let i = 0; i < this.rsi.length; i++) {
      if (i < this.period) {
        continue
      }

      const minRsi = Math.min(...this.rsi.slice(i - this.period, i))
      const maxRsi = Math.max(...this.rsi.slice(i - this.period, i))
      const currentRsi = this.rsi[i]

      const stochastic = (currentRsi - minRsi) / (maxRsi - minRsi)
      stochasticRSI.push(stochastic)
    }

    return stochasticRSI
  }

  public isOverbought(index: number): boolean {
    return this.rsi[index] > this.overbought
  }

  public isOversold(index: number): boolean {
    return this.rsi[index] < this.oversold
  }
}
