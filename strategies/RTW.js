import {
  calcPerc
} from '../config/utils.js'

import {
  SMA
} from 'technicalindicators'

export default history => {
  // pull the closing price
  let prices = history.map(candle => parseFloat(candle[2]))
  // pull the volume
  let volume = history.map(candle => parseFloat(candle[6]))
  // get average volume of the past 20 candles
  let avgVolume = SMA.calculate({
    period: 20,
    values: volume,
  })
  // find the volume dfference betwen the current and the average, in percentage
  let volumeChange = calcPerc(volume[0], avgVolume[1])
  let priceIncreasePercentage = 5
  let volumeIncreasePercentage = 200
  // find the price dfference betwen the current and the previous candle, in percentage
  let actualPriceChangePercentage = calcPerc(prices[0], prices[1])
  return (
    volumeChange !== Infinity &&
    volumeChange >= volumeIncreasePercentage && // The volume inceased by at least 200% 
    volumeChange < volumeIncreasePercentage * 1.5 && // the bot should not recognize late enteries (less traps)
    actualPriceChangePercentage >= priceIncreasePercentage // The price increased by at least 5%
  )
}


// console.log(`volumeChange = calcPerc(${volume[0]}, ${avgVolume[1]})`);
// console.log(`actualPriceChangePercentage = calcPerc(${prices[0]}, ${prices[1]})`);
// console.log(`${volumeChange} !== Infinity && ${volumeChange} >= ${volumeIncreasePercentage} && ${actualPriceChangePercentage} >= ${priceIncreasePercentage}`);