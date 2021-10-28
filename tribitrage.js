import {
  getAllTickers,
  getAllPairs,
  getTickerInfo,
  getBalance,
  getCurrency,
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

let fees = settings.fees
let x = false
let initial = settings.strategies.TRIBITRAGE.initial
let median = settings.strategies.TRIBITRAGE.median
let opportinities = []
let orderTimeout = settings.strategies.TRIBITRAGE.orderTimeout
let strategyName = 'Tribitrage'


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
    let risked = await getBalance(initial) * settings.strategies.TRIBITRAGE.risk
    let ownMedian = (risked / AB) * fees
    let target = (ownMedian / BC) * fees
    let ownInitial = (target * CD) * fees
    ownInitial = Number(floor(ownInitial, 2))
    risked = Number(floor(risked, 2))
    // check if there is an arbitrage opportunity
    // if the output is at least 0.03 bigger than the risked amount
    // and there's no active trade going on
    if (ownInitial > risked * settings.strategies.TRIBITRAGE.diff) {
      let coin = getBase(symbols.BC)
      if (!isExcluded(coin)) exclude(coin)
      log(`Arbitrage opportunity`);
      log(`Equity: ${risked}`);
      log(`${symbols.AB}: ${AB} => ${ownMedian}`);
      log(`${symbols.BC}: ${BC} => ${target}`);
      log(`${symbols.CD}: ${CD} => ${ownInitial}`);
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
  let steps = []
  let id = Date.now() / 1000
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
    strategy: strategyName,
    equity: risked,
    id
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
    strategy: strategyName,
    id
  }
  let step3 = {
    pair: {
      symbol: symbols.CD
    },
    order: {
      size: target,
      currentPrice: CD,
      type: 'limit',
      side: 'sell',
      timeInForce: 'GTT',
      cancelAfter: orderTimeout * 10
    },
    tickerInfo: symbols.CDI,
    strategy: strategyName,
    id
  }
  // if the median currency is enough, start with the second step
  steps.push(step1)
  steps.push(step2)
  steps.push(step3)
  opportinities.push({
    id,
    risked,
    coin: getBase(symbols.BC),
    steps,
  })
  // step 1 ---------------------------------------------------
  new Trader(steps[0]).tribitrage()
    .then(order => order ? null : includeIt(getBase(symbols.BC)))
  log(`Exclusion list: ${exclusionList().join(' - ')}`)
}
io.on('order-filled', order => {
  if (!order.clientOid) return
  for (const op of opportinities) {
    let steps = op.steps
    // check if the filled order is step 1, then start step 2
    if (steps[0].pair.symbol == order.symbol && order.clientOid.includes(op.id)) {
      steps[0].order = order
      new Trader(steps[1]).tribitrage().then(order => {
        if (!order) {
          includeIt(getBase(steps[1].pair.symbol))
          opportinities.splice(opportinities.indexOf(op), 1)
        }
      })
      break
    }
    // check if the filled order is step 2, then start step 3 and re-enable looking for new arbitrage opportunities
    else if (steps[1].pair.symbol == order.symbol && order.clientOid.includes(op.id)) {
      steps[1].order = order
      setTimeout(() => {
        new Trader(steps[2]).tribitrage().then(order => {
          if (!order) {
            includeIt(getBase(steps[2].pair.symbol))
            opportinities.splice(opportinities.indexOf(op), 1)
          }
        })
      }, 100);
      break
    }
    // check if the filled order is step 3, then remove the coin from open opportunities
    else if (steps[2].pair.symbol == order.symbol && order.clientOid.includes(op.id)) {
      steps[2].order = order
      let diff = ((order.size * order.price) - op.risked) * fees
      log(`Arbitrage done: ${steps[0].pair.symbol} >> ${steps[1].pair.symbol} >> ${steps[2].pair.symbol}: $${floor(diff, 2)}`)
      includeIt(getBase(order.symbol))
      opportinities.splice(opportinities.indexOf(op), 1)
    }
  }
})

io.on('order-canceled', async order => {
  if (!order.clientOid) return
  let oppo = opportinities.find(oppo => order.clientOid.includes(oppo.id))
  if (oppo) {
    includeIt(getBase(oppo.coin))
    opportinities.splice(opportinities.indexOf(oppo, 1))
  }
})

const dynamicArb = async () => {
  let common = []
  let medianPairs = await getAllPairs(median)
  let medianTickers = await getAllTickers(median)
  let initialPairs = await getAllPairs(initial)
  let initialTickers = await getAllTickers(initial)
  if (!medianPairs || !medianTickers || !initialPairs || !initialTickers) {
    dynamicArb()
    return
  }
  for (const pair of initialPairs) {
    let symbol = pair.symbol.split('-')[0]
    if (medianPairs.find(s => s.symbol.split('-')[0] == symbol))
      common.push(symbol)
  }

  for (const pair of common) {
    arbitrage({
      symbols: {
        AB: `${median}-${initial}`,
        BC: `${pair}-${median}`,
        CD: `${pair}-${initial}`,
        ABI: getTickerInfo({
          symbol: `${median}-${initial}`
        }, initialTickers),
        BCI: getTickerInfo({
          symbol: `${pair}-${median}`
        }, medianTickers),
        CDI: getTickerInfo({
          symbol: `${pair}-${initial}`
        }, initialTickers),
      }
    })
  }
}


const housekeeping = async () => {
  let currencies = await getCurrency()
  let initialTickers = await getAllTickers(initial)
  if (!currencies) return
  Object.keys(currencies).forEach(async coin => {
    coin = currencies[coin]
    if (coin.currency !== initial) {
      if (coin.available > 0) {
        let pair = `${coin.currency}-${initial}`
        let tickerInfo = getTickerInfo({
          symbol: pair
        }, initialTickers)
        new Trader({
          pair: {
            symbol: pair
          },
          strategy: 'Housekeeping',
          tickerInfo
        }).sell({
          type: 'market',
          size: coin.available,
        })
        isExcluded(coin.currency) && includeIt(coin.currency)
      }
    }

  });
}

setInterval(() => {
  log(`Housekeeping....`)
  housekeeping()
}, settings.strategies.TRIBITRAGE.housekeepingInterval);

// setTimeout(() => {
//   housekeeping()
// }, 100);


export default dynamicArb