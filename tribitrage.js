import {
  getAllTickers,
  getAllPairs,
  getTickerInfo,
  getBalance,
  floor,
  exclude,
  isExcluded,
  includeIt,
  exclusionList,
  getBase,
  io,
} from './config/utils.js'

import Trader from './Trader.js';

import settings from './config/settings.js';

import api from './main.js'

import log from './log.js'

let fee = 0.998
let x = false
let median = 'BTC'
let opportinities = []
let orderTimeout = 60 * 5

const arbitrage = async options => {
  let {
    symbols,
  } = options
  let AB = undefined
  let BC = undefined
  let CD = undefined

  const datafeed = new api.websocket.Datafeed();
  // connect
  datafeed.connectSocket();

  let topic = `/market/ticker:${symbols.AB},${symbols.BC},${symbols.CD}`
  let cbid = datafeed.subscribe(topic, async data => {
    let currentTicker = data.topic.split(':')[1]
    if (currentTicker == symbols.AB) AB = data.data.bestAsk
    if (currentTicker == symbols.BC) BC = data.data.bestAsk
    if (currentTicker == symbols.CD) CD = data.data.bestBid
    // Housekeeping
    if (!AB || !BC || !CD || x || isExcluded(getBase(symbols.BC))) return
    // simulate Arbitragelet 
    let risked = await getBalance('USDT') * settings.strategies.TRIBITRAGE.risk
    let ownMedian = (risked / AB) * fee
    let target = (ownMedian / BC) * fee
    let ownUSDT = (target * CD) * fee
    ownUSDT = Number(floor(ownUSDT, 2))
    risked = Number(floor(risked, 2))
    // check if there is an arbitrage opportunity
    // if the output is at least 0.03 bigger than the risked amount
    // and there's no active trade going on
    if (ownUSDT - 0.03 > risked) {
      let coin = getBase(symbols.BC)
      if (!isExcluded(coin)) exclude(coin)
      log(`Arbitrage opportunity`);
      log(`Equity: ${risked}`);
      log(`${symbols.AB}: ${AB} => ${ownMedian}`);
      log(`${symbols.BC}: ${BC} => ${target}`);
      log(`${symbols.CD}: ${CD} => ${ownUSDT}`);
      start({
        AB,
        BC,
        CD,
        symbols,
        ownMedian,
        risked,
        target
      })
    }
  })
}

const start = async options => {
  let {
    AB,
    BC,
    CD,
    symbols,
    ownMedian,
    risked,
    target
  } = options
  let id = Date.now()
  let medianAmount = await getBalance(median)
  let isMedianAvailable = medianAmount >= ownMedian
  let steps = []
  let step1 = {
    pair: {
      symbol: symbols.AB
    },
    order: {
      size: ownMedian,
      currentPrice: AB,
      type: 'limit',
      side: 'buy',
      timeInForce: 'GTT',
      cancelAfter: orderTimeout
    },
    tickerInfo: symbols.ABI,
    strategy: 'Tribitrage',
    equity: risked
  }
  let step2 = {
    pair: {
      symbol: symbols.BC
    },
    order: {
      size: target,
      currentPrice: BC,
      type: 'limit',
      side: 'buy',
      timeInForce: 'GTT',
      cancelAfter: orderTimeout
    },
    tickerInfo: symbols.BCI,
    strategy: 'Tribitrage'
  }
  let step3 = {
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
  }
  if (isMedianAvailable) {
    // if the median currency is enough, start with the second step
    steps.push(step2)
    steps.push(step3)
    steps.push(step1)
  } else {
    // if the median currency is not enough, start with the first step
    steps.push(step1)
    steps.push(step2)
    steps.push(step3)
  }
  opportinities.push({
    id,
    steps,
  })
  // step 1 ---------------------------------------------------
  new Trader(steps[0]).tribitrage()
  log(`Exclusion list: ${exclusionList().join(' - ')}`)
}
io.on('order-filled', order => {
  for (const op of opportinities) {
    let steps = op.steps
    // check if the filled order is step 1, then start step 2
    if (steps[0].pair.symbol == order.symbol && steps[0].order.currentPrice == order.price) {
      new Trader(steps[1]).tribitrage()
      break
    }
    // check if the filled order is step 2, then start step 3 and re-enable looking for new arbitrage opportunities
    else if (steps[1].pair.symbol == order.symbol && steps[1].order.currentPrice == order.price) {
      new Trader(steps[2]).tribitrage()
      break
    }
    // check if the filled order is step 3, then remove the coin from open opportunities
    else if (steps[2].pair.symbol == order.symbol && steps[2].order.currentPrice == order.price) {
      includeIt(getBase(order.symbol))
      opportinities.splice(opportinities.indexOf(op), 1)
      break
    }


  }
})

const dynamicArb = async () => {
  let common = []
  let medianPairs = await getAllPairs(median)
  let medianTickers = await getAllTickers(median)
  let usdtPairs = await getAllPairs('USDT')
  let usdtTickers = await getAllTickers('USDT')
  if (!medianPairs || !medianTickers || !usdtPairs || !usdtTickers) {
    dynamicArb()
    return
  }
  for (const usdtPair of usdtPairs) {
    let symbol = usdtPair.symbol.split('-')[0]
    if (medianPairs.find(s => s.symbol.split('-')[0] == symbol))
      common.push(symbol)
  }

  for (const pair of common) {
    arbitrage({
      symbols: {
        AB: `${median}-USDT`,
        BC: `${pair}-${median}`,
        CD: `${pair}-USDT`,
        ABI: getTickerInfo({
          symbol: `${median}-USDT`
        }, usdtTickers),
        BCI: getTickerInfo({
          symbol: `${pair}-${median}`
        }, medianTickers),
        CDI: getTickerInfo({
          symbol: `${pair}-USDT`
        }, usdtTickers),
      }
    })
  }



}


export default dynamicArb