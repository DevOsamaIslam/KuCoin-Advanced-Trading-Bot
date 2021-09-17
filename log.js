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

  data.forEach(line => appendFileSync(`./records/${strategy.toUpperCase()}/${moment().format('YYYY-MM-DD')}.log`, `${new Date()} ${pair.symbol} ${line}\n`))

}