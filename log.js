import {
  appendFileSync
} from 'fs'
import moment from 'moment'

export default async data => appendFileSync(`./records/logs/${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${data}\n`)

export const logStrategy = async options => {
  let {
    strategy,
    pair,
    orderId,
    data,
  } = options

  appendFileSync(`./records/${strategy.toUpperCase()}/${pair.symbol}_${moment().format('YYYY-MM-DD')}_(${orderId}).log`, `${new Date()} ${pair.symbol} ${data}\n`)
}