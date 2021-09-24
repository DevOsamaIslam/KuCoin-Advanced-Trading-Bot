import {
  calcPerc
} from '../config/utils.js'

import {
  SMA
} from 'technicalindicators'

import settings from '../config/settings.js'

let {
  strategies
} = settings

export default history => {
  // pull the closing price
  let prices = history.map(candle => parseFloat(candle.close))
  // pull the volume
  let volume = history.map(candle => parseFloat(candle.volume))
  // get average volume of the past 20 candles
  let avgVolume = SMA.calculate({
    period: strategies.RTW.params.avgVolumePeriod,
    values: volume,
  })
  // find the volume dfference betwen the current and the average, in percentage
  let volumeChange = calcPerc(volume[0], avgVolume[1])
  let priceIncreasePercentage = strategies.RTW.params.priceIncreasePercentage
  let volumeIncreasePercentage = strategies.RTW.params.volumeIncreasePercentage
  // find the price dfference betwen the current and the previous candle, in percentage
  let actualPriceChangePercentage = calcPerc(prices[0], prices[1])
  return (
    volume[1] != 0 &&
    volumeChange >= volumeIncreasePercentage && // The volume inceased by at least 200% 
    actualPriceChangePercentage >= priceIncreasePercentage // The price increased by at least 5%
  )
}