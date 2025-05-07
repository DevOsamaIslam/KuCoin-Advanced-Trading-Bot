// import { getDatafeed } from 'app/init'
// import { TRIBITRAGE_MARGIN } from 'app/settings'
// import { ORDER_TYPE, TRADE_DIRECTION } from 'lib/constants/trade'
// import { getBalance, refreshBalances } from 'lib/helpers/balance'
// import { afterFees } from 'lib/helpers/calc'
// import { getUsableSize } from 'lib/helpers/conversion'
// import { getBase, getQuote, SEGMENTED_PAIRS } from 'lib/helpers/tickers'
// import { IDFOrderBookPayload } from 'lib/types/datafeed'
// import { ITicker } from 'lib/types/tickers'
// import { IOrder } from 'lib/types/Trader'
// import { Trader } from 'modules/Trader'

// const initial = 'USDT'
// const median = 'BTC'
// let x = true

// export const dynamicArb = async () => {
//   if (!Object.keys(SEGMENTED_PAIRS).length) {
//     setTimeout(() => {
//       dynamicArb()
//     }, 500)
//     return
//   }
//   const common: ITicker[] = []
//   const medianPairs = SEGMENTED_PAIRS[median]
//   const initialPairs = SEGMENTED_PAIRS[initial]

//   for (const pair of initialPairs) {
//     let symbol = pair.symbol.split('-')[0]
//     if (medianPairs.find(tick => tick.symbol.split('-')[0] == symbol)) common.push(pair)
//   }

//   for (const pair of common) {
//     const pairSymbol = pair.symbol.split('-')[0]
//     arbitrage({
//       AB: `${median}-${initial}`,
//       BC: `${pairSymbol}-${median}`,
//       CA: `${pairSymbol}-${initial}`,

//       ABInfo: SEGMENTED_PAIRS[initial].find(tick => tick.symbol.includes(median)),
//       BCInfo: SEGMENTED_PAIRS[median].find(tick => tick.symbol.includes(pairSymbol)),
//       CAInfo: SEGMENTED_PAIRS[initial].find(tick => tick.symbol.includes(pairSymbol)),
//     })
//   }
// }
// interface IParams {
//   AB: string
//   BC: string
//   CA: string
//   ABInfo: ITicker | undefined
//   BCInfo: ITicker | undefined
//   CAInfo: ITicker | undefined
// }
// const arbitrage = (params: IParams) => {
//   const { AB, BC, CA, ABInfo, BCInfo, CAInfo } = params
//   if (!AB || !BC || !CA || !ABInfo || !BCInfo || !CAInfo) return
//   const datafeed = getDatafeed()
//   let topic = `/spotMarket/level2Depth5:${AB},${BC},${CA}`
//   let ABPrice: number = 0
//   let BCPrice: number = 0
//   let CAPrice: number = 0
//   let CASize: number = 0

//   datafeed.subscribe(
//     topic,
//     async (payload: IDFOrderBookPayload) => {
//       let currentTicker = payload.topic.split(':')[1]

//       if (currentTicker == AB) ABPrice = parseFloat(payload.data.asks[0][0])
//       if (currentTicker == BC) BCPrice = parseFloat(payload.data.asks[0][0])
//       if (currentTicker == CA) {
//         CAPrice = parseFloat(payload.data.bids[0][0])
//         CASize = parseFloat(payload.data.bids[0][1])
//       }
//       if (excludedTickers.includes(getBase(CA))) return
//       // Housekeeping
//       if (!ABPrice || !BCPrice || !CAPrice) return
//       // simulate Arbitrage
//       let risked = Math.min(getBalance(initial), CAPrice * CASize) // * settings.strategies.TRIBITRAGE.risk
//       let firstBuySize = afterFees(risked / ABPrice)
//       let medianSize = afterFees(firstBuySize / BCPrice)
//       let initialSize = afterFees(medianSize * CAPrice)
//       // check if there is an arbitrage opportunity
//       // if the output is at least 0.01 bigger than the risked amount
//       if (initialSize > risked * (1 + TRIBITRAGE_MARGIN) || x) {
//         exclude(getBase(CA))
//         console.log(`Arbitrage opportunity: ${initial}--${getBase(CA)}--${getQuote(BC)}--${initial}`)
//         console.log({ AB, BC, CA })
//         x = false

//         const order1: IOrder = {
//           baseParams: {
//             clientOid: AB + Date.now().toString(),
//             side: TRADE_DIRECTION.buy,
//             symbol: AB,
//             type: ORDER_TYPE.market,
//           },
//           orderParams: {
//             price: ABPrice.toFixed(10),
//             size: getUsableSize(getBase(AB), firstBuySize),
//           },
//         }
//         await new Trader({ order: order1 }).execute()
//         await refreshBalances()

//         // adjust firstBuySize
//         firstBuySize = getBalance(getBase(AB)) || firstBuySize
//         const order2: IOrder = {
//           baseParams: {
//             clientOid: BC + Date.now().toString(),
//             side: TRADE_DIRECTION.buy,
//             symbol: BC,
//             type: ORDER_TYPE.market,
//           },
//           orderParams: {
//             price: BCPrice.toFixed(10),
//             funds: getUsableSize(getBase(BC), afterFees(firstBuySize)) + '',
//           },
//         }
//         await new Trader({ order: order2 }).execute()
//         const balances = await refreshBalances()
//         // adjust final
//         medianSize = parseFloat(balances[getBase(BC)]?.available || '0')
//         console.log({ medianSize })
//         const order3: IOrder = {
//           baseParams: {
//             clientOid: BC + Date.now().toString(),
//             side: TRADE_DIRECTION.sell,
//             symbol: CA,
//             type: ORDER_TYPE.market,
//           },
//           orderParams: {
//             price: CAPrice.toFixed(10),
//             size: getUsableSize(getBase(CA), afterFees(medianSize)),
//           },
//         }
//         await new Trader({ order: order3 }).execute()
//         await refreshBalances()

//         console.log({ difference: getBalance(initial) - risked })
//       }
//     },
//     false,
//   )
// }

// const excludedTickers: string[] = []

// const exclude = (ticker: string) => {
//   if (!excludedTickers.includes(ticker)) {
//     excludedTickers.push(ticker)
//     setTimeout(() => {
//       excludedTickers.splice(excludedTickers.indexOf(ticker), 1)
//     }, 5000)
//   }
// }
