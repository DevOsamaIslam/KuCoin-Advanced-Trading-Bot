import { CURRENCIES } from 'lib/constants/currencies'
import { ICandle } from 'lib/types/data'

export const candleArray2object = (candle: string[]): ICandle => ({
  timestamp: parseFloat(candle[0]),
  open: parseFloat(candle[1]),
  close: parseFloat(candle[2]),
  high: parseFloat(candle[3]),
  low: parseFloat(candle[4]),
  volume: parseFloat(candle[5]),
  amount: parseFloat(candle[6]),
})

export const convertRawHistory = (rawHistory: string[][]) => rawHistory.map(candle => candleArray2object(candle))

export const getUsableSize = (currency: string, originalSize: number): string => {
  const baseIncrement = CURRENCIES[currency]?.baseIncrement

  if (baseIncrement) {
    return originalSize.toFixed(baseIncrement.length - 2)
  }
  return originalSize.toFixed(4)
}
