import { FEES } from 'app/settings'
import { CURRENCIES } from 'lib/constants/currencies'

export const afterFees = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value)
  const fee = (value * FEES) / 100
  return value - fee
}

export const roundDown = (number: number, decimals: number = 0) => Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals)

export const getPriceIncrementPrecision = (ticker: string, amount: number | string): string => {
  const precision = CURRENCIES[ticker]?.priceIncrement.split('.')[1].length
  return Number(amount).toFixed(precision - 1)
}

export const getSizeIncrementPrecision = (ticker: string, amount: number | string): string => {
  const precision = CURRENCIES[ticker]?.baseIncrement.split('.')[1].length
  const result = Number(amount).toFixed(precision)
  return result
}
