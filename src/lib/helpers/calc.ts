import { FEES } from 'app/settings'
import { ICurrency } from 'lib/types/tickers'

export const afterFees = (value: number) => {
  const fee = (value * FEES) / 100
  return value - fee
}

export const roundDown = (number: number, decimals: number = 0) => Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals)

export const getPriceIncrementPrecision = (value: number | string, currency: ICurrency) => {
  const precision = currency.priceIncrement
  if (typeof value === 'string') {
    return Number(value).toFixed(+precision)
  } else return Number(value.toFixed(+precision))
}
