import { getDatafeed } from 'app/init'
import { getBalance } from 'lib/helpers/balance'
import { afterFees } from 'lib/helpers/calc'
import { getBase, PAIRS } from 'lib/helpers/tickers'
import { IDFTickerPayload } from 'lib/types/datafeed'
import { ITicker } from 'lib/types/tickers'

const initial = 'USDT'
const median = 'BTC'

export const dynamicArb = async () => {
  if (!Object.keys(PAIRS).length) {
    setTimeout(() => {
      dynamicArb()
    }, 500)
    return
  }
  const common: ITicker[] = []
  const medianPairs = PAIRS[median]
  const initialPairs = PAIRS[initial]

  for (const pair of initialPairs) {
    let symbol = pair.symbol.split('-')[0]
    if (medianPairs.find(tick => tick.symbol.split('-')[0] == symbol)) common.push(pair)
  }

  for (const pair of common) {
    const pairSymbol = pair.symbol.split('-')[0]
    arbitrage({
      AB: `${median}-${initial}`,
      BC: `${pairSymbol}-${median}`,
      CA: `${pairSymbol}-${initial}`,

      ABInfo: PAIRS[initial].find(tick => tick.symbol.includes(median)),
      BCInfo: PAIRS[median].find(tick => tick.symbol.includes(pairSymbol)),
      CAInfo: PAIRS[initial].find(tick => tick.symbol.includes(pairSymbol)),
    })
  }
}
interface IParams {
  AB: string
  BC: string
  CA: string
  ABInfo: ITicker | undefined
  BCInfo: ITicker | undefined
  CAInfo: ITicker | undefined
}
const arbitrage = (params: IParams) => {
  const { AB, BC, CA, ABInfo, BCInfo, CAInfo } = params
  if (!AB || !BC || !CA || !ABInfo || !BCInfo || !CAInfo) return
  const datafeed = getDatafeed()

  let topic = `/market/ticker:${AB},${BC},${CA}`
  let ABPrice: number = 0
  let BCPrice: number = 0
  let CAPrice: number = 0
  datafeed.subscribe(topic, async (payload: IDFTickerPayload) => {
    let currentTicker = payload.topic.split(':')[1]
    if (currentTicker == AB) ABPrice = parseFloat(payload.data.bestAsk)
    if (currentTicker == BC) BCPrice = parseFloat(payload.data.bestAsk)
    if (currentTicker == CA) CAPrice = parseFloat(payload.data.bestBid)
    console.log('arbitrage check...')
    // Housekeeping
    if (!ABPrice || !BCPrice || !CAPrice) return
    // simulate Arbitrage
    let risked = getBalance(initial) // * settings.strategies.TRIBITRAGE.risk
    let ownMedian = afterFees(risked / ABPrice)
    let target = afterFees(ownMedian / BCPrice)
    let ownInitial = afterFees(target * CAPrice)
    // check if there is an arbitrage opportunity
    // if the output is at least 0.03 bigger than the risked amount
    // and there's no active trade going on
    if (ownInitial > risked * 1.01) {
      console.log(`Arbitrage opportunity: ${initial}--${getBase(CA)}--${median}--${initial}`)
      console.log({ risked })
      console.log({ ABPrice, ownMedian })
      console.log({ BCPrice, target })
      console.log({ CAPrice, ownInitial })
      // let coin = getBase(CA)
      console.log(`Equity: ${risked}`)

      // start({
      //   AB,
      //   BC,
      //   CA,
      //   symbols,
      //   ownMedian,
      //   risked,
      //   target,
      // })

      // BC = floor(BC * (2 - settings.strategies.TRIBITRAGE.offset), getDecimalPlaces(BC))
      // CA = floor(CA * settings.strategies.TRIBITRAGE.offset, getDecimalPlaces(CA))

      // console.log(`${BC}: ${BC} => ${target}`)
      // console.log(`${CA}: ${CA} => ${ownInitial}`)
    }
  })
}
