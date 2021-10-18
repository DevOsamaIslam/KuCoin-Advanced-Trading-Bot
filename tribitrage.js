import {
  getAllTickers,
  getAllPairs,
  getTickerInfo,
  getBalance,
  floor,
  exclude,
  isExcluded,
  getBase
} from './config/utils.js'

import Trader from './Trader.js';

import settings from './config/settings.js';

import api from './main.js'

import log from './log.js'

let fee = 0.999
let x = false


const arbitrage = async options => {
  let {
    symbols,
  } = options
  let AB = undefined
  let BC = undefined
  let CD = undefined

  const datafeed = new api.websocket.Datafeed();
  let order = {}
  // connect
  datafeed.connectSocket();

  let topic = `/market/ticker:${symbols.AB},${symbols.BC},${symbols.CD}`
  let cbid = datafeed.subscribe(topic, async data => {
    let currentTicker = data.topic.split(':')[1]
    if (currentTicker == symbols.AB) AB = data.data.bestAsk
    if (currentTicker == symbols.BC) BC = data.data.bestAsk
    if (currentTicker == symbols.CD) CD = data.data.bestBid
    // Housekeeping
    if (!AB || !BC || !CD) return
    if (isExcluded(getBase(symbols.BC))) return
    // simulate Arbitragelet 
    let risked = await getBalance('USDT') * settings.strategies.TRIBITRAGE.risk
    let ownBTC = (risked / AB) * fee
    let target = (ownBTC / BC) * fee
    let ownUSDT = (target * CD) * fee
    ownUSDT = Number(floor(ownUSDT, 2))
    risked = Number(floor(risked, 2))
    if (ownUSDT - 0.03 > risked) {
      exclude(getBase(symbols.BC))
      log(`Arbitrage opportunity`);
      log(`Equity: ${risked}`);
      log(`${symbols.AB}: ${AB} => ${ownBTC}`);
      log(`${symbols.BC}: ${BC} => ${target}`);
      log(`${symbols.CD}: ${CD} => ${ownUSDT}`);
      // Step 1 ------------------------------------------------------
      order = {
        size: ownBTC,
        currentPrice: AB,
        type: 'limit',
        side: 'buy',
        timeInForce: 'GTT',
        cancelAfter: 60 * 15
      }
      await new Trader({
          pair: {
            symbol: symbols.AB
          },
          order,
          tickerInfo: symbols.ABI,
          strategy: 'Tribitrage',
          equity: risked
        }).tribitrage() &&
        // step 2 ------------------------------------------------------
        await new Trader({
          pair: {
            symbol: symbols.BC
          },
          order: {
            size: target,
            currentPrice: BC,
            type: 'limit',
            side: 'buy',
            timeInForce: 'GTT',
            cancelAfter: 60 * 15
          },
          tickerInfo: symbols.BCI,
          strategy: 'Tribitrage'
        }).tribitrage() &&
        // step 3 ------------------------------------------------------
        await new Trader({
          pair: {
            symbol: symbols.CD
          },
          order: {
            currentPrice: CD,
            type: 'limit',
            side: 'sell'
          },
          tickerInfo: symbols.CDI,
          strategy: 'Tribitrage'
        }).tribitrage()
    }
  })
}

const dynamicArb = async () => {
  let common = []
  let btcPairs = await getAllPairs('BTC')
  let btcTickers = await getAllTickers('BTC')
  let usdtPairs = await getAllPairs('USDT')
  let usdtTickers = await getAllTickers('USDT')
  if (!btcPairs || !btcTickers || !usdtPairs || !usdtTickers) {
    dynamicArb()
    return
  }
  for (const usdtPair of usdtPairs) {
    let symbol = usdtPair.symbol.split('-')[0]
    if (btcPairs.find(s => s.symbol.split('-')[0] == symbol))
      common.push(symbol)
  }

  for (const pair of common) {
    arbitrage({
      symbols: {
        AB: `BTC-USDT`,
        BC: `${pair}-BTC`,
        CD: `${pair}-USDT`,
        ABI: getTickerInfo({
          symbol: 'BTC-USDT'
        }, usdtTickers),
        BCI: getTickerInfo({
          symbol: `${pair}-BTC`
        }, btcTickers),
        CDI: getTickerInfo({
          symbol: `${pair}-USDT`
        }, usdtTickers),
      }
    })
  }



}


export default dynamicArb