import { ICandle } from 'lib/types/data'
import { StochasticRSI } from './Stoch'

const overbought = 80
const oversold = 20
const period = 14
export const stochasticRSIStrategy = ({ history, currentPrice }) => {
  // Calculate the RSI
  const rsi = calculateRSI(history, period)

  // Calculate the Stochastic RSI
  const stochasticRSI = new StochasticRSI(rsi, period, overbought, oversold)
  const stochastic = stochasticRSI.getStochasticRSI()

  // Find the current index in the candles array
  const currentIndex = history.findIndex(candle => candle.close === currentPrice)

  // Check if the current price is in the oversold territory and the Stochastic RSI is crossing up
  if (stochasticRSI.isOversold(currentIndex) && stochastic[currentIndex] > stochastic[currentIndex - 1]) {
    return 'buy'
  }

  return 'hold'
}

function calculateRSI(candles: ICandle[], period: number): number[] {
  // Calculate the average gain and loss over the period
  const avgGainLoss = calculateAvgGainLoss(candles, period)
  const gains = avgGainLoss[0]
  const losses = avgGainLoss[1]

  // Calculate the RSI
  const rsi: number[] = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      continue
    }

    let rs = gains[i] / losses[i]
    if (losses[i] === 0) {
      rs = 100
    }

    const rsiValue = 100 - 100 / (1 + rs)
    rsi.push(rsiValue)
  }

  return rsi
}

function calculateAvgGainLoss(candles: ICandle[], period: number): [number[], number[]] {
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      continue
    }

    const change = candles[i].close - candles[i - 1].close
    if (change > 0) {
      gains.push(change)
      losses.push(0)
    } else {
      gains.push(0)
      losses.push(Math.abs(change))
    }
  }

  // Calculate the average gain and loss over the period
  const avgGains: number[] = []
  const avgLosses: number[] = []
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      continue
    }

    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period
    avgGains.push(avgGain)
    avgLosses.push(avgLoss)
  }

  return [avgGains, avgLosses]
}
