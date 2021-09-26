import strategyMACD from './MACD.js'
import strategyVWAP from './VWAP.js'
import strategyCMF_MACD from './CMF_MACD.js'
import strategyRTW from './RTW.js'

export const MACD = strategyMACD
export const VWAP = strategyVWAP
export const CMF_MACD = strategyCMF_MACD
export const RTW = strategyRTW

export default {
  MACD,
  VWAP,
  CMF_MACD,
  RTW,
}