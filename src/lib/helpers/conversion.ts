import { ICandle } from 'lib/types/data'

export const candleArray2object = (candle: string[]): ICandle => ({
  timestamp: parseInt(candle[0]),
  open: parseInt(candle[1]),
  close: parseInt(candle[2]),
  high: parseInt(candle[3]),
  low: parseInt(candle[4]),
  volume: parseInt(candle[5]),
  amount: parseInt(candle[6]),
})

export const convertRawHistory = (rawHistory: string[][]) => rawHistory.reverse().map(candle => candleArray2object(candle))
