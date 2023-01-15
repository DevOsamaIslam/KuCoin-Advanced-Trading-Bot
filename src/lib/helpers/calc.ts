import { FEES } from 'app/settings'

export const afterFees = (value: number) => {
  const fee = (value * FEES) / 100
  return value - fee
}
