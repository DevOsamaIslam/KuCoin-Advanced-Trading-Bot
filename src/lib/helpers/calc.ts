import { FEES } from 'app/settings'

export const afterFees = (value: number) => {
  const fee = (value * FEES) / 100
  return value - fee
}

export const roundDown = (number: number, decimals: number = 0) => Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals)
