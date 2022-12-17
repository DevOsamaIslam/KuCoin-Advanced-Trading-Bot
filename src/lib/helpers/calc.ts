import { FEES } from 'app/settings'

export const afterFees = (value: number) => value * (1 - FEES)
